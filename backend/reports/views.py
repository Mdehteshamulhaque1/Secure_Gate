import csv
import json
from datetime import timedelta

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone

from accounts.permissions import has_perm
from organizations.models import AuditLog
from visits.models import Visit, VisitStatus, Visitor

from . import chatbot as chatbot_engine

STATUS_COLORS = {
    "PENDING": "#f59e0b",
    "APPROVED": "#3b82f6",
    "REJECTED": "#ef4444",
    "CHECKED_IN": "#22c55e",
    "CHECKED_OUT": "#64748b",
    "ARCHIVED": "#94a3b8",
    "EXPIRED": "#0ea5e9",
}


def _visits_for(request):
    return Visit.objects.filter(organization=request.user.organization)


def _guard(request, perm="view_reports"):
    if not has_perm(request.user, perm):
        messages.error(request, "You don't have permission to view reports.")
        return redirect("reports:dashboard")
    return None


# ---------------------------------------------------------------- dashboard

def build_dashboard_data(user):
    """KPI + chart payload shared by the standalone dashboard and the landing page."""
    org = getattr(user, "organization", None)
    visits = Visit.objects.filter(organization=org) if org else Visit.objects.none()
    now = timezone.now()
    today = timezone.localdate()

    status_counts = {s: visits.filter(status=s).count() for s in VisitStatus.values}

    completed = visits.filter(checked_in_at__isnull=False, checked_out_at__isnull=False)
    avg_duration = 0
    if completed.exists():
        avg_duration = sum(v.duration_minutes for v in completed) // completed.count()

    peak_buckets = {f"{h:02d}:00": 0 for h in range(8, 20)}
    for v in visits.filter(registered_at__gte=now - timedelta(days=30)).exclude(
        expected_arrival__isnull=True
    ):
        bucket = f"{v.expected_arrival.hour:02d}:00"
        if bucket in peak_buckets:
            peak_buckets[bucket] += 1

    dept_rows = (
        visits.exclude(host__employee_profile__isnull=True)
        .exclude(host__employee_profile__department__isnull=True)
        .values("host__employee_profile__department__name")
        .annotate(total=Count("id"))
        .order_by("-total")[:8]
    )
    dept_labels = [r["host__employee_profile__department__name"] or "—" for r in dept_rows]
    dept_values = [r["total"] for r in dept_rows]

    if org:
        repeat = (
            Visitor.objects.filter(visits__organization=org)
            .annotate(n=Count("visits")).filter(n__gt=1).count()
        )
        first_time = (
            Visitor.objects.filter(visits__organization=org)
            .annotate(n=Count("visits")).filter(n=1).count()
        )
    else:
        repeat = first_time = 0

    kpis = {
        "today": visits.filter(visit_date=today).count(),
        "week": visits.filter(registered_at__gte=now - timedelta(days=7)).count(),
        "month": visits.filter(registered_at__gte=now - timedelta(days=30)).count(),
        "inside": status_counts[VisitStatus.CHECKED_IN],
        "pending": status_counts[VisitStatus.PENDING],
        "approved": status_counts[VisitStatus.APPROVED],
        "avg_duration": avg_duration,
        "repeat": repeat,
        "first_time": first_time,
        "total": visits.count(),
        "checked_out": status_counts[VisitStatus.CHECKED_OUT],
        "rejected": status_counts[VisitStatus.REJECTED],
    }

    charts = {
        "status_counts": list(status_counts.values()),
        "status_labels": [VisitStatus(label).label for label in VisitStatus.values],
        "status_colors": [STATUS_COLORS[s] for s in VisitStatus.values],
        "peak_labels": list(peak_buckets.keys()),
        "peak_values": list(peak_buckets.values()),
        "dept_labels": dept_labels,
        "dept_values": dept_values,
        "repeat_vals": [first_time, repeat],
    }
    return kpis, charts


@login_required
def dashboard(request):
    kpis, charts = build_dashboard_data(request.user)
    return render(
        request,
        "reports/dashboard.html",
        {"kpis": kpis, "charts": charts, "status_choices": VisitStatus.choices},
    )


# ---------------------------------------------------------------- reports

@login_required
def reports(request):
    if _guard(request):
        return redirect("reports:dashboard")
    period = request.GET.get("period", "daily")
    dept = request.GET.get("dept", "")
    fmt = request.GET.get("format", "")

    visits = _visits_for(request).select_related("visitor", "host", "building", "host__employee_profile__department")

    title = {"daily": "Daily Report", "weekly": "Weekly Report", "monthly": "Monthly Report"}.get(period, "Daily Report")

    now = timezone.now()
    if period == "weekly":
        visits = visits.filter(registered_at__gte=now - timedelta(days=7))
    elif period == "monthly":
        visits = visits.filter(registered_at__gte=now - timedelta(days=30))
    else:
        visits = visits.filter(visit_date=timezone.localdate())

    if dept:
        visits = visits.filter(host__employee_profile__department_id=dept)

    departments = (
        request.user.organization.departments.all()
        if request.user.organization
        else []
    )

    if fmt == "csv":
        return _export_csv(visits, period, title)

    # summary numbers
    summary = {
        "total": visits.count(),
        "approved": visits.filter(status=VisitStatus.APPROVED).count(),
        "checked_in": visits.filter(status=VisitStatus.CHECKED_IN).count(),
        "checked_out": visits.filter(status=VisitStatus.CHECKED_OUT).count(),
        "rejected": visits.filter(status=VisitStatus.REJECTED).count(),
    }

    return render(
        request,
        "reports/reports.html",
        {
            "visits": visits[:200],
            "period": period,
            "dept": dept,
            "departments": departments,
            "title": title,
            "summary": summary,
            "today": timezone.localdate(),
        },
    )


def _export_csv(visits, period, title):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="securegate-{period}-{timezone.localdate()}.csv"'
    writer = csv.writer(response)
    writer.writerow(
        ["Visitor", "Phone", "Company", "Purpose", "Host", "Department", "Building",
         "Visit Date", "Status", "Registered", "Checked In", "Checked Out", "Duration (min)"]
    )
    for v in visits:
        writer.writerow(
            [
                v.visitor.full_name,
                v.visitor.phone,
                v.visitor.company,
                v.purpose,
                v.host.full_name if v.host else "",
                v.host.employee_profile.department.name if v.host and hasattr(v.host, "employee_profile") and v.host.employee_profile.department else "",
                v.building.name if v.building else "",
                v.visit_date,
                v.status,
                v.registered_at.strftime("%Y-%m-%d %H:%M"),
                v.checked_in_at.strftime("%Y-%m-%d %H:%M") if v.checked_in_at else "",
                v.checked_out_at.strftime("%Y-%m-%d %H:%M") if v.checked_out_at else "",
                v.duration_minutes,
            ]
        )
    return response


# ---------------------------------------------------------------- audit log

@login_required
def audit_log(request):
    if _guard(request, "view_audit_logs"):
        return redirect("reports:dashboard")
    org = request.user.organization
    logs = (
        AuditLog.objects.select_related("user")
        .filter(user__organization=org)
        .order_by("-created_at")[:200]
    )
    return render(request, "reports/audit_log.html", {"logs": logs})


# ---------------------------------------------------------------- inside (emergency)

@login_required
def inside_now(request):
    if _guard(request):
        return redirect("reports:dashboard")
    inside = _visits_for(request).filter(status=VisitStatus.CHECKED_IN).select_related("visitor", "host", "building")
    return render(request, "reports/inside_now.html", {"inside": inside})


# ---------------------------------------------------------------- chatbot

def chatbot(request):
    """JSON endpoint for the GateBot widget. Works for anonymous users too."""
    if request.method != "POST":
        return JsonResponse({"reply": "Send a POST request with {'message': '...'}."}, status=405)
    try:
        payload = json.loads(request.body or b"{}")
        message = payload.get("message", "")
    except json.JSONDecodeError:
        message = request.POST.get("message", "")
    reply = chatbot_engine.handle(message, request.user)
    return JsonResponse({"reply": reply})


# ------------------------------------------------------- landing page context

def landing_context(user):
    """All dashboard widgets & live lists that the landing page embeds."""
    org = getattr(user, "organization", None)
    kpis, charts = build_dashboard_data(user)
    visits = Visit.objects.filter(organization=org) if org else Visit.objects.none()
    today = timezone.localdate()

    return {
        "kpis": kpis,
        "charts": charts,
        "recent_visits": visits.select_related("visitor", "host").order_by("-registered_at")[:8],
        "inside": visits.filter(status=VisitStatus.CHECKED_IN).select_related("visitor", "host")[:10],
        "today_visits": visits.filter(visit_date=today).select_related("visitor", "host").order_by("-registered_at")[:8],
        "pending": visits.filter(status=VisitStatus.PENDING).select_related("visitor", "host").order_by("-registered_at")[:8],
        "report_summary": {
            "total": kpis["total"],
            "approved": kpis["approved"],
            "inside": kpis["inside"],
            "checked_out": kpis["checked_out"],
            "rejected": kpis["rejected"],
        },
    }
