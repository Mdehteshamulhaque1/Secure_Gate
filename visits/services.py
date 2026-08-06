"""
Core visitor workflow operations.

Registered -> Pending -> Approved/Rejected -> QR issued -> Checked In -> Checked Out -> Archived

Kept in a service layer so both the server-rendered views and the DRF API
call the exact same logic (single source of truth).
"""

from django.utils import timezone

from organizations.models import AuditLog

from .models import QRPass, Visit, VisitStatus


def _log(user, action, visit, extra=""):
    AuditLog.log(
        user=user,
        action=action,
        entity_type="Visit",
        entity_id=str(visit.visit_id),
        details=f"{visit.visitor.full_name} | {visit.purpose} {extra}",
    )


def approve_visit(visit, approver):
    if visit.status != VisitStatus.PENDING:
        return False, f"Cannot approve: visit is {visit.status}."
    if visit.visitor.is_blacklisted:
        return False, "Visitor is blacklisted. Approval blocked."
    visit.status = VisitStatus.APPROVED
    visit.approved_at = timezone.now()
    visit.save(update_fields=["status", "approved_at"])
    QRPass.issue(visit)
    _log(approver, "Visit approved", visit)
    return True, "Visit approved. QR pass generated."


def reject_visit(visit, approver, reason="Not specified"):
    if visit.status != VisitStatus.PENDING:
        return False, f"Cannot reject: visit is {visit.status}."
    visit.status = VisitStatus.REJECTED
    visit.rejected_at = timezone.now()
    visit.rejection_reason = reason
    visit.save(update_fields=["status", "rejected_at", "rejection_reason"])
    _log(approver, "Visit rejected", visit, f"| reason: {reason}")
    return True, "Visit rejected."


def check_in(visit, officer, via_qr=False):
    if visit.status not in (VisitStatus.APPROVED, VisitStatus.PENDING):
        return False, f"Cannot check in: visit is {visit.status}."
    if visit.visitor.is_blacklisted:
        return False, "Visitor is blacklisted - entry denied."
    visit.status = VisitStatus.CHECKED_IN
    visit.checked_in_at = timezone.now()
    visit.checked_in_by = officer
    visit.save(update_fields=["status", "checked_in_at", "checked_in_by"])
    if via_qr and hasattr(visit, "qr_pass"):
        qr = visit.qr_pass
        qr.is_used = True
        qr.used_at = timezone.now()
        qr.save(update_fields=["is_used", "used_at"])
    _log(officer, "Visitor checked in", visit)
    return True, "Visitor checked in."


def check_out(visit, officer):
    if visit.status != VisitStatus.CHECKED_IN:
        return False, f"Cannot check out: visit is {visit.status}."
    visit.status = VisitStatus.CHECKED_OUT
    visit.checked_out_at = timezone.now()
    visit.checked_out_by = officer
    visit.save(update_fields=["status", "checked_out_at", "checked_out_by"])
    _log(officer, "Visitor checked out", visit)
    return True, "Visitor checked out."


def archive_old_visits(days=30):
    """Background job (scheduler/cron in prod) that archives stale visits."""
    cutoff = timezone.now() - timezone.timedelta(days=days)
    stale = Visit.objects.filter(
        checked_out_at__lte=cutoff, status=VisitStatus.CHECKED_OUT
    )
    count = stale.update(status=VisitStatus.ARCHIVED, archived_at=timezone.now())
    return count
