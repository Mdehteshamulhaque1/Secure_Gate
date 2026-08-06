# SecureGate — Interview Prep (read this tonight)

## The 90-second pitch

> "SecureGate is a production-style visitor and access management platform. It's a
> multi-tenant Django application where employees pre-register visitors, hosts approve
> them, security guards verify a signed QR pass at the gate, and every action is
> recorded in an audit log. The frontend is Django templates with Bootstrap and Chart.js,
> and there's also a complete REST API using DRF with JWT auth. I chose Django because its
> ORM, admin and auth let me focus on the actual business domain."

Then stop and let them ask. Do NOT recite the whole feature list.

## Demo script (20 minutes, in order)

**Setup before the interview:** `python manage.py runserver` already running on port
8001. Password for all accounts: `Secure@123`.

1. **Landing page (60s, anonymous)** — animated shield logo, hero, feature cards, "how it
   works" steps. GateBot is openable but answers "sign in to see live data" when logged out.
   > *"This is the marketing entry point AND the app home — once you sign in, everything
   > (KPIs, charts, approvals, security, reports) lives on this one page."*
2. **Login as `alice@acme.com`** (Employee) → lands back on the **same landing page**, now
   with live data: KPI strip, status/peak-hours/department/repeat charts, inside-now,
   today's arrivals, recent visitors, and a **pending approvals** card with inline
   Approve/Reject buttons. Open **GateBot** and ask *"visitors today"*, *"who is inside
   now"*, or *"find Rahul"* — real answers from the live DB.
3. **Pre-register a visitor** (`visitors/register/`) — fill name, phone, company, document
   type/number, vehicle, host (self). Submit. **Show it lands in PENDING** and the landing
   approvals card now shows it.
   > *"Approval is required before a QR pass is generated — so a visitor can't get in
   > without a host confirming them."*
4. **Approve from the landing card** (or via My Approvals). Show status → APPROVED. The
   approvals card empties, KPI/inside-now update without a reload.
5. **View the visitor profile → QR modal.** Scan it with the phone/QR reader or show the
   payload. Explain the QR contains `token|signature`, signature is HMAC over the visit.
6. **Security panel** — log in as `security@acme.com` (second tab). Use **camera scanner**
   (or paste the QR payload) → auto verify + check-in. Show the visitor now appears under
   *Inside now* on the landing.
7. **Reception desk** — log in as `reception@acme.com`. Show today's roster, print badge
   (Ctrl+P), walk-in register flow (auto-approved).
8. **Full dashboard** — log in as `admin@acme.com`. The landing already showed KPIs +
   charts; click **Open full dashboard** for the standalone page with all 4 charts and the
   reports link.
   > *"Peak hours and department breakdown drive decisions like how many guards to schedule
   > and which meeting rooms to staff."*
9. **Reports** — export CSV, switch daily/weekly/monthly.
10. **Audit logs** — show login, registration, approval, check-in entries.
11. **Admin panel** — buildings/departments/employees/roles.
12. **REST API** (if asked) — `docs/API.md`; show a curl login + GET visits.

Keep it interactive: let them pick a visitor name, ask "what happens if I try to check the
same QR twice?" → show duplicate block.

## Likely questions and short answers

**Why Django?**
> ORM, built-in auth, admin, migrations and security defaults let me build the domain fast.
> DRF sits on top for the API. Batteries included → fewer dependencies, fewer surprises.

**How does multi-tenancy work?**
> Every Organization is a row in the Organization table. User, Building, Department,
> Employee and Visit all carry an `organization` FK. Every queryset in the views filters by
> `request.user.organization`, and `get_object_or_404` uses that filter too, so cross-tenant
> access returns 404 rather than leaking data. I'd add tenant-level row-level security in
> Postgres for scale.

**How does the QR pass work / can it be forged?**
> The QR contains a random token and an HMAC-SHA256 signature computed over
> `visit_id|org_id|token` with Django's SECRET_KEY. On scan we recompute and compare with
> constant-time comparison (`secrets.compare_digest`), then check existence, single-use and
> expiry. Forgery requires the secret key. Duplicate scans are blocked by the `is_used` flag.

**How do you prevent abuse (rate limiting / lockout)?**
> 5 failed logins → 15-minute lockout stored on the user. JWT refresh rotation + blacklist.
> DRF throttling configured. CSRF on all forms, allowed file extensions on uploads.

**Why did you use a service layer?**
> The web views and the REST API both call `approve_visit()` / `check_in()` etc. in
> `visits/services.py`. That keeps workflow rules in one place — you can't create a
> Checked-In visit by hitting a different endpoint with different logic.

**How would you scale this?**
> Postgres + Redis, Celery for the emails/QR-expiry sweeps (I already wrote
> `archive_old_visits()` as the task unit), server-side caching of dashboard aggregates,
> CDN for static, Docker + CI.

**What would you improve if you had more time?**
> Real email/SMS providers, facial recognition and OCR for ID documents, kiosk mode,
> real-time check-in via WebSockets/Channels, proper tests for the API layer, Postgres.

**Tell me about a tricky bug you hit.**
> (Tell the truth about something from this build — e.g. the Argon2 library missing when
> switching hashers, or a 403 CSRF issue, or duplicate QR single-use enforcement.) Describe:
> symptom → how you debugged → fix → how you verified. This is the most valuable answer.

## Honesty guardrails (very important)

- If they ask "is this fully complete per the spec?" say **no**:
  *"I built the core end-to-end workflows — auth, RBAC, multi-tenant, visitor lifecycle,
  QR, reception, security, reporting, audit. Email delivery, Celery jobs, facial
  recognition and the deployment pipeline are designed but not built yet."*
- Don't claim features that aren't there. Admitting scope boundaries looks like maturity,
  and they may well ask you to extend it live.
- If you don't know a concept, say so and describe how you'd approach learning it.

## One-day-extension list (if they ask you to add something)

- Celery beat task calling `visits/services.archive_old_visits()` + email sending
- `EXPIRED` sweep for QR passes
- Visitor self-service kiosk (a single page to register)
- CSV → Excel via `openpyxl`, PDF via `weasyprint`
- Postgres swap + `docker-compose.yml`
