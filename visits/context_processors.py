from django.utils import timezone

from accounts.permissions import user_permissions
from visits.models import VisitStatus, Visit


def global_stats(request):
    """Small counters available on every authenticated page (used in the sidebar)."""
    user = request.user
    if not user.is_authenticated:
        return {}

    visits = Visit.objects.filter(organization=user.organization) if user.organization else Visit.objects.none()
    today = timezone.localdate()

    return {
        "pending_count": visits.filter(status=VisitStatus.PENDING).count(),
        "approved_count": visits.filter(status=VisitStatus.APPROVED).count(),
        "inside_count": visits.filter(status=VisitStatus.CHECKED_IN).count(),
        "today_count": visits.filter(visit_date=today).count(),
        "perms": user_permissions(user),
    }
