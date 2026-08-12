from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from accounts.permissions import has_perm
from organizations.models import AuditLog

from .forms import (
    BlacklistForm,
    ManualVerificationForm,
    QRScanForm,
    VisitorRegistrationForm,
    VisitForm,
)
from .models import Blacklist, QRPass, Visit, VisitStatus, Visitor
from .qrcodes import qr_data_uri, qr_payload
from .services import approve_visit, check_in, check_out, reject_visit


def _org(request):
    return request.user.organization


def _visits_for(request):
    return Visit.objects.filter(organization=_org(request))


def _guard(request, perm):
    if not has_perm(request.user, perm):
        messages.error(request, "You don't have permission to do that.")
        return redirect("reports:dashboard")
    return None


def _visitor_context(visitor):
    """Attach visit summaries & qr data for detail/badge templates."""
    visits = visitor.visits.all()[:10]
    context = {"visitor": visitor, "visits": visits, "recent_visits": visits}
    for v in visits:
        if hasattr(v, "qr_pass"):
            v.qr_uri = qr_data_uri(qr_payload(v.qr_pass))
    return context


# ---------------------------------------------------------------- visitor list

@login_required
def visitor_list(request):
    q = request.GET.get("q", "").strip()
    status = request.GET.get("status", "")
    date = request.GET.get("date", "").strip()

    visits = _visits_for(request).select_related("visitor", "host", "building")
    if q:
        visits = visits.filter(
            Q(visitor__full_name__icontains=q)
            | Q(visitor__phone__icontains=q)
            | Q(visitor__company__icontains=q)
            | Q(visitor__vehicle_number__icontains=q)
            | Q(host__full_name__icontains=q)
            | Q(purpose__icontains=q)
        )
    if status in VisitStatus.values:
        visits = visits.filter(status=status)
    if date:
        visits = visits.filter(visit_date=date)

    paginator = Paginator(visits, 15)
    page = paginator.get_page(request.GET.get("page"))

    return render(
        request,
        "visits/visitor_list.html",
        {
            "visits": page,
            "q": q,
            "status": status,
            "date": date,
            "statuses": VisitStatus.choices,
        },
    )


@login_required
def visitor_detail(request, pk):
    visitor = get_object_or_404(Visitor, pk=pk, visits__organization=_org(request))
    return render(request, "visits/visitor_detail.html", _visitor_context(visitor))


# ------------------------------------------------------------- registration

@login_required
def visitor_register(request):
    if _guard(request, "create_visitor"):
        return redirect("reports:dashboard")
    org = _org(request)
    visitor_form = VisitorRegistrationForm(request.POST or None, request.FILES or None)
    visit_form = VisitForm(request.POST or None, org=org)
    if request.method == "POST":
        if visitor_form.is_valid() and visit_form.is_valid():
            visitor = visitor_form.save()
            visit = visit_form.save(commit=False)
            visit.visitor = visitor
            visit.organization = org
            visit.created_by = request.user
            visit.save()
            AuditLog.log(
                request.user, "Visit registered", "Visit", visit.visit_id,
                f"{visitor.full_name} | {visit.purpose}",
            )
            messages.success(
                request,
                "Visitor registered and request submitted for host approval."
                if visit.host
                else "Visitor registered.",
            )
            return redirect("visits:visitor_detail", pk=visitor.pk)
    return render(
        request,
        "visits/visitor_register.html",
        {"visitor_form": visitor_form, "visit_form": visit_form, "is_walkin": False},
    )


@login_required
def walkin_register(request):
    """Reception registers a visitor on the spot. Auto-approves to speed entry."""
    if _guard(request, "create_visitor"):
        return redirect("reports:dashboard")
    org = _org(request)
    visitor_form = VisitorRegistrationForm(request.POST or None, request.FILES or None)
    visit_form = VisitForm(request.POST or None, org=org)
    if request.method == "POST":
        if visitor_form.is_valid() and visit_form.is_valid():
            visitor = visitor_form.save()
            visit = visit_form.save(commit=False)
            visit.visitor = visitor
            visit.organization = org
            visit.created_by = request.user
            visit.save()
            approve_visit(visit, request.user)  # walk-ins approved by reception
            AuditLog.log(
                request.user, "Walk-in registered & approved", "Visit", visit.visit_id,
                visitor.full_name,
            )
            messages.success(request, "Walk-in visitor registered and QR pass issued.")
            return redirect("visits:visitor_detail", pk=visitor.pk)
    return render(
        request,
        "visits/visitor_register.html",
        {"visitor_form": visitor_form, "visit_form": visit_form, "is_walkin": True},
    )


# ------------------------------------------------------- approvals (employee)

@login_required
def approvals(request):
    pending = (
        Visit.objects.filter(host=request.user, status=VisitStatus.PENDING)
        .select_related("visitor", "building")
    )
    history = (
        Visit.objects.filter(host=request.user)
        .exclude(status=VisitStatus.PENDING)
        .select_related("visitor")[:15]
    )
    return render(
        request,
        "visits/approvals.html",
        {"pending": pending, "history": history},
    )


@login_required
def approval_action(request, pk, action):
    if _guard(request, "approve_visitor"):
        return redirect("visits:approvals")
    visit = get_object_or_404(Visit, pk=pk, host=request.user, status=VisitStatus.PENDING)
    if action == "approve":
        ok, msg = approve_visit(visit, request.user)
    else:
        reason = request.POST.get("reason", "Declined by host")
        ok, msg = reject_visit(visit, request.user, reason)
    messages.success(request, msg) if ok else messages.error(request, msg)
    return redirect("visits:approvals")


# ------------------------------------------------------------ my visits

@login_required
def my_visits(request):
    visits = Visit.objects.filter(
        Q(created_by=request.user) | Q(host=request.user)
    ).select_related("visitor", "building").order_by("-registered_at")
    return render(request, "visits/my_visits.html", {"visits": visits})


# ------------------------------------------------------------- reception desk

@login_required
def reception(request):
    if _guard(request, "badge_print"):
        return redirect("reports:dashboard")
    today = timezone.localdate()
    today_visits = _visits_for(request).filter(visit_date=today).select_related("visitor", "host")
    waiting = today_visits.filter(status=VisitStatus.APPROVED)
    checked_in = today_visits.filter(status=VisitStatus.CHECKED_IN)
    return render(
        request,
        "visits/reception.html",
        {
            "today_visits": today_visits,
            "waiting": waiting,
            "checked_in": checked_in,
            "today": today,
        },
    )


@login_required
def badge(request, pk):
    if _guard(request, "badge_print"):
        return redirect("reports:dashboard")
    visit = get_object_or_404(
        Visit.objects.select_related("visitor", "host", "building"),
        pk=pk,
        organization=_org(request),
    )
    if not hasattr(visit, "qr_pass"):
        QRPass.issue(visit)
        visit.refresh_from_db()
    qr = visit.qr_pass
    context = _visitor_context(visit.visitor)
    context.update({"visit": visit, "qr_uri": qr_data_uri(qr_payload(qr)), "qr": qr})
    return render(request, "visits/badge.html", context)


# ---------------------------------------------------------------- security

@login_required
def security(request):
    if _guard(request, "scan_qr"):
        return redirect("reports:dashboard")
    inside = _visits_for(request).filter(status=VisitStatus.CHECKED_IN).select_related("visitor", "host")
    blacklisted = Visitor.objects.filter(
        visits__organization=_org(request), blacklists__is_active=True
    ).distinct()[:20]
    scan_form = QRScanForm()
    manual_form = ManualVerificationForm()
    return render(
        request,
        "visits/security.html",
        {"inside": inside, "blacklisted": blacklisted, "scan_form": scan_form, "manual_form": manual_form},
    )


@login_required
def scan_qr(request):
    if _guard(request, "scan_qr"):
        return redirect("reports:dashboard")
    if request.method == "POST":
        form = QRScanForm(request.POST)
        if form.is_valid():
            ok, msg, qr = QRPass.verify(
                form.cleaned_data["token"], form.cleaned_data["signature"]
            )
            if ok and qr:
                visit = qr.visit
                res = check_in(visit, request.user, via_qr=True)
                if res[0]:
                    messages.success(request, f"Verified & checked in: {visit.visitor.full_name}.")
                    return redirect("visits:security")
                messages.error(request, res[1])
            else:
                messages.error(request, msg)
        else:
            messages.error(request, "Both token and signature are required.")
    return redirect("visits:security")


@login_required
def manual_verify(request):
    if _guard(request, "checkin_visitor"):
        return redirect("reports:dashboard")
    if request.method == "POST":
        form = ManualVerificationForm(request.POST)
        if form.is_valid():
            term = form.cleaned_data["phone_or_email"]
            visitor = (
                Visitor.objects.filter(
                    Q(phone=term) | Q(email__iexact=term),
                    visits__organization=_org(request),
                ).distinct().first()
            )
            if not visitor:
                messages.error(request, "No visitor found with that phone or email.")
                return redirect("visits:security")
            if visitor.is_blacklisted:
                messages.error(request, "Visitor is blacklisted - entry denied.")
                return redirect("visits:security")
            # pick the latest APPROVED/PENDING visit for today, else latest
            visit = (
                visitor.visits.filter(organization=_org(request))
                .filter(Q(status=VisitStatus.APPROVED) | Q(status=VisitStatus.PENDING))
                .first()
            )
            if not visit:
                messages.error(request, "No pending or approved visit found for this visitor.")
                return redirect("visits:security")
            ok, msg = check_in(visit, request.user)
            messages.success(request, msg) if ok else messages.error(request, msg)
    return redirect("visits:security")


@login_required
def checkin(request, pk):
    if _guard(request, "checkin_visitor"):
        return redirect("reports:dashboard")
    visit = get_object_or_404(Visit, pk=pk, organization=_org(request))
    ok, msg = check_in(visit, request.user)
    messages.success(request, msg) if ok else messages.error(request, msg)
    return redirect(request.META.get("HTTP_REFERER", "visits:reception"))


@login_required
def checkout(request, pk):
    if _guard(request, "checkout_visitor"):
        return redirect("reports:dashboard")
    visit = get_object_or_404(Visit, pk=pk, organization=_org(request))
    ok, msg = check_out(visit, request.user)
    messages.success(request, msg) if ok else messages.error(request, msg)
    return redirect(request.META.get("HTTP_REFERER", "visits:security"))


# ---------------------------------------------------------------- blacklist

@login_required
def blacklist_list(request):
    if _guard(request, "view_reports"):
        return redirect("reports:dashboard")
    entries = Blacklist.objects.filter(
        visitor__visits__organization=_org(request), is_active=True
    ).distinct().select_related("visitor", "added_by")
    return render(request, "visits/blacklist.html", {"entries": entries})


@login_required
def blacklist_add(request, visitor_pk):
    if _guard(request, "blacklist_visitor"):
        return redirect("visits:blacklist")
    visitor = get_object_or_404(Visitor, pk=visitor_pk, visits__organization=_org(request))
    form = BlacklistForm(request.POST or None)
    if request.method == "POST":
        if form.is_valid():
            entry = form.save(commit=False)
            entry.visitor = visitor
            entry.added_by = request.user
            entry.save()
            AuditLog.log(request.user, "Visitor blacklisted", "Visitor", visitor.id, visitor.full_name)
            messages.success(request, f"{visitor.full_name} added to blacklist.")
            return redirect("visits:blacklist")
    return render(request, "visits/blacklist_add.html", {"form": form, "visitor": visitor})


@login_required
def blacklist_remove(request, pk):
    if _guard(request, "blacklist_visitor"):
        return redirect("visits:blacklist")
    entry = get_object_or_404(
        Blacklist, pk=pk, visitor__visits__organization=_org(request), is_active=True
    )
    entry.is_active = False
    entry.save()
    messages.success(request, f"{entry.visitor.full_name} removed from blacklist.")
    return redirect("visits:blacklist")
