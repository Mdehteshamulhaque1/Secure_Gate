from datetime import timedelta

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from accounts.permissions import has_perm
from organizations.models import Building
from visits.models import Visit, VisitStatus, Visitor
from visits.services import approve_visit, check_in, check_out, reject_visit

from .serializers import (
    BuildingSerializer,
    DashboardSummarySerializer,
    OrganizationSerializer,
    RegisterSerializer,
    UserSerializer,
    VisitSerializer,
    VisitorSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class VisitorViewSet(viewsets.ModelViewSet):
    serializer_class = VisitorSerializer

    def get_queryset(self):
        return Visitor.objects.filter(visits__organization=self.request.user.organization).distinct()

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=["get"])
    def search(self, request):
        q = request.query_params.get("q", "").strip()
        qs = self.get_queryset()
        if q:
            qs = qs.filter(full_name__icontains=q) | qs.filter(phone__icontains=q)
        return Response(self.get_serializer(qs[:25], many=True).data)


class VisitViewSet(viewsets.ModelViewSet):
    serializer_class = VisitSerializer

    def get_queryset(self):
        qs = Visit.objects.filter(organization=self.request.user.organization)
        status_filter = self.request.query_params.get("status")
        if status_filter in VisitStatus.values:
            qs = qs.filter(status=status_filter)
        return qs.select_related("visitor", "host", "building").order_by("-registered_at")

    def perform_create(self, serializer):
        serializer.save(host=serializer.validated_data.get("host"))

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        visit = self.get_object()
        ok, msg = approve_visit(visit, request.user)
        return self._respond(ok, msg, visit)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        visit = self.get_object()
        reason = request.data.get("reason", "Declined")
        ok, msg = reject_visit(visit, request.user, reason)
        return self._respond(ok, msg, visit)

    @action(detail=True, methods=["post"])
    def checkin(self, request, pk=None):
        visit = self.get_object()
        ok, msg = check_in(visit, request.user)
        return self._respond(ok, msg, visit)

    @action(detail=True, methods=["post"])
    def checkout(self, request, pk=None):
        visit = self.get_object()
        ok, msg = check_out(visit, request.user)
        return self._respond(ok, msg, visit)

    def _respond(self, ok, msg, visit):
        if not ok:
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": msg, "visit": self.get_serializer(visit).data})


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        visits = Visit.objects.filter(organization=request.user.organization)
        today = visits.filter(visit_date=timezone.localdate()).count()
        week = visits.filter(registered_at__gte=now - timedelta(days=7)).count()
        month = visits.filter(registered_at__gte=now - timedelta(days=30)).count()
        completed = visits.filter(checked_in_at__isnull=False, checked_out_at__isnull=False)
        avg = 0
        if completed.exists():
            avg = sum(v.duration_minutes for v in completed) // completed.count()
        data = DashboardSummarySerializer(
            {
                "today": today,
                "week": week,
                "month": month,
                "inside": visits.filter(status=VisitStatus.CHECKED_IN).count(),
                "pending": visits.filter(status=VisitStatus.PENDING).count(),
                "approved": visits.filter(status=VisitStatus.APPROVED).count(),
                "avg_duration_minutes": avg,
            }
        ).data
        return Response(data)


class CurrentUserView(APIView):
    """Current user + organization for the SPA shell (read-only)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.user.organization
        return Response(
            {
                "user": UserSerializer(request.user).data,
                "organization": OrganizationSerializer(org).data if org else None,
            }
        )


class RegisterVisitView(APIView):
    """Atomic visitor + visit creation for the SPA pre-registration flow."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        org = request.user.organization
        if org is None:
            return Response(
                {"detail": "Your account is not assigned to an organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        visitor_ser = VisitorSerializer(data=request.data.get("visitor", {}))
        visitor_ser.is_valid(raise_exception=True)
        visitor = visitor_ser.save()

        data = request.data.get("visit", {})
        if not data.get("purpose"):
            visitor.delete()
            return Response(
                {"detail": {"purpose": ["Purpose is required."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        visit = Visit.objects.create(
            visitor=visitor,
            organization=org,
            created_by=request.user,
            host_id=data.get("host") or request.user.pk,
            building_id=data.get("building") or None,
            purpose=data["purpose"],
            notes=data.get("notes") or "",
            visit_date=data.get("visit_date") or timezone.localdate(),
            expected_arrival=data.get("expected_arrival") or "10:00",
            expected_exit=data.get("expected_exit") or "17:00",
        )
        return Response(
            {
                "visitor": VisitorSerializer(visitor).data,
                "visit": VisitSerializer(visit, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class HostListView(APIView):
    """Active users in the org that can be chosen as a visit host."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.filter(
            organization=request.user.organization, is_active=True
        ).order_by("full_name")
        return Response(UserSerializer(users, many=True).data)


class BuildingListView(APIView):
    """Buildings belonging to the current organization."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        buildings = Building.objects.filter(organization=request.user.organization)
        return Response(BuildingSerializer(buildings, many=True).data)
