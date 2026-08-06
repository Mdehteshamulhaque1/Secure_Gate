"""
GateBot — a lightweight, rule-based assistant that answers questions using
the organization's LIVE data. No external AI service required, so it works
offline for the demo. Rules are easy to extend with more intents.

Intents handled:
    hello / help · visitors today · who is inside · pending approvals
    find <name> · phone lookup · weekly / monthly / total counts
    blacklist · average visit duration · status breakdown
"""

import re
from datetime import timedelta

from django.utils import timezone

from organizations.models import AuditLog
from visits.models import Visit, VisitStatus, Visitor

GREETINGS = {"hi", "hello", "hey", "yo", "namaste", "hola", "good morning", "good afternoon"}


def _visits(user):
    return Visit.objects.filter(organization=user.organization)


def handle(message, user):
    text = (message or "").lower().strip()

    if not user.is_authenticated:
        return (
            "I can answer with live data once you sign in.\n"
            "Use a demo account (e.g. alice@acme.com / Secure@123) and ask me "
            "'visitors today' or 'who is inside now'."
        )
    if not text:
        return "Ask me things like 'visitors today', 'who is inside', 'pending approvals', or 'find Rahul'."

    if text in GREETINGS or any(text.startswith(g) for g in GREETINGS):
        return (
            "Hello! I'm GateBot, SecureGate's assistant.\n"
            "Try: 'visitors today', 'who is inside now', 'pending approvals', "
            "'find <name>', 'reports this week', 'blacklist', 'help'."
        )

    # --- find visitor by name
    m = re.search(r"find\s+(.+)", text)
    if m:
        term = m.group(1).strip()
        found = (
            Visitor.objects.filter(
                visits__organization=user.organization, full_name__icontains=term
            )
            .distinct()
            .order_by("-created_at")[:5]
        )
        if found:
            lines = [f"Found {len(found)} visitor(s) matching '{term}':"]
            for v in found:
                last = v.visits.filter(organization=user.organization).order_by("-registered_at").first()
                status = last.get_status_display() if last else "no visits yet"
                lines.append(f"• {v.full_name} — {v.phone} ({v.company or 'Independent'}) · last: {status}")
            return "\n".join(lines)
        return f"No visitor found matching '{term}'. You can register them under Visitors."

    # --- phone lookup
    m = re.search(r"(\+?\d[\d\s\-]{7,})", text)
    if m:
        digits = re.sub(r"[\s\-]", "", m.group(1))
        v = (
            Visitor.objects.filter(
                visits__organization=user.organization, phone__contains=digits
            )
            .distinct()
            .first()
        )
        if v:
            last = v.visits.filter(organization=user.organization).order_by("-registered_at").first()
            status = f"{last.get_status_display()} on {last.visit_date}" if last else "no visits yet"
            return f"{v.full_name} — {v.phone}. Last activity: {status}."
        return f"No visitor found with phone {digits}."

    # --- who is inside
    if "inside" in text:
        inside = _visits(user).filter(status=VisitStatus.CHECKED_IN).select_related("visitor", "host")
        if inside.exists():
            lines = [f"{inside.count()} visitor(s) currently inside the building:"]
            for v in inside[:8]:
                time_in = v.checked_in_at.strftime("%H:%M") if v.checked_in_at else "?"
                lines.append(f"• {v.visitor.full_name} — {v.purpose} (host {v.host.full_name or '—'}, in since {time_in})")
            return "\n".join(lines)
        return "Nobody is inside the building right now."

    # --- pending / approvals
    if "pending" in text or "approval" in text:
        pending = _visits(user).filter(status=VisitStatus.PENDING).select_related("visitor")
        if pending.exists():
            lines = [f"{pending.count()} visit(s) awaiting approval:"]
            for v in pending[:8]:
                lines.append(f"• {v.visitor.full_name} → {v.purpose} ({v.visit_date})")
            return "\n".join(lines)
        return "No visits pending approval — all caught up."

    # --- visitors today
    if "today" in text:
        today = timezone.localdate()
        td = _visits(user).filter(visit_date=today)
        counts = {s: td.filter(status=s).count() for s in VisitStatus.values}
        return (
            f"Today ({today}) there {'is' if td.count()==1 else 'are'} {td.count()} visit(s): "
            f"{counts['CHECKED_IN']} inside, {counts['CHECKED_OUT']} checked out, "
            f"{counts['APPROVED']} waiting to arrive, {counts['PENDING']} pending approval, "
            f"{counts['REJECTED']} rejected."
        )

    # --- reports this week / this month
    if "week" in text:
        c = _visits(user).filter(registered_at__gte=timezone.now() - timedelta(days=7)).count()
        return f"{c} visit(s) registered in the last 7 days."
    if "month" in text:
        c = _visits(user).filter(registered_at__gte=timezone.now() - timedelta(days=30)).count()
        return f"{c} visit(s) registered in the last 30 days."

    # --- totals / breakdown
    if "total" in text or "all visit" in text:
        total = _visits(user).count()
        return f"There {'is' if total==1 else 'are'} {total} total visit record(s) for {user.organization.name}."

    if "breakdown" in text or "status" in text:
        counts = {s: _visits(user).filter(status=s).count() for s in VisitStatus.values}
        parts = ", ".join(f"{VisitStatus(s).label}: {counts[s]}" for s in VisitStatus.values)
        return f"Status breakdown:\n{parts}"

    # --- blacklist
    if "blacklist" in text:
        from visits.models import Blacklist

        entries = (
            Blacklist.objects.filter(
                visitor__visits__organization=user.organization, is_active=True
            )
            .distinct()
            .select_related("visitor")
        )
        if entries.exists():
            lines = [f"{entries.count()} visitor(s) blacklisted:"]
            for e in entries[:8]:
                lines.append(f"• {e.visitor.full_name} — {e.get_reason_display()}")
            return "\n".join(lines)
        return "Blacklist is empty — nobody is currently blocked."

    # --- average duration
    if "average" in text or "duration" in text or "how long" in text:
        done = _visits(user).filter(checked_in_at__isnull=False, checked_out_at__isnull=False)
        if done.exists():
            avg = sum(v.duration_minutes for v in done) // done.count()
            return f"Average visit duration is {avg} minutes across {done.count()} completed visits."
        return "No completed visits yet, so I can't compute an average duration."

    # --- audit trail
    if "audit" in text or "log" in text:
        logs = AuditLog.objects.filter(user__organization=user.organization).order_by("-created_at")[:5]
        if logs.exists():
            lines = ["Latest 5 audit events:"]
            for log in logs:
                lines.append(f"• {log.created_at.strftime('%d %b %H:%M')} — {log.action} by {log.user.full_name or 'system'}")
            return "\n".join(lines)
        return "No audit events recorded yet."

    # --- help / fallback
    if "help" in text or "what can" in text or "?" in text:
        return (
            "I can answer about your organization's live data:\n"
            "• 'visitors today' · 'who is inside now' · 'pending approvals'\n"
            "• 'find <name>' · a phone number · 'reports this week'\n"
            "• 'blacklist' · 'average visit duration' · 'status breakdown'\n"
            "• 'audit log'"
        )
    return (
        "I didn't catch that. Try one of these:\n"
        "'visitors today' · 'who is inside now' · 'pending approvals' · "
        "'find Rahul' · 'reports this week' · 'help'"
    )
