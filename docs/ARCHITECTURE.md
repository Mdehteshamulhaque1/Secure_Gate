# SecureGate — Architecture & Design

## 1. High-level architecture

```
┌────────────────────────────────────────────────────────────┐
│  Browser (Django Templates + Bootstrap 5 + Chart.js)        │
│  Landing / Auth / Dashboards / Reception / Security / Admin │
└───────────────┬──────────────────────────────┬─────────────┘
                │ (session auth, CSRF)         │ (JWT Bearer)
┌───────────────▼──────────────────┐   ┌────────▼─────────────────┐
│  Django View Layer               │   │  DRF API (api app)       │
│  accounts / organizations /      │   │  serializers + viewsets  │
│  visits / reports                │   │  SimpleJWT auth          │
└───────────────┬──────────────────┘   └────────┬─────────────────┘
                │  calls the SAME service layer  │
┌───────────────▼────────────────────────────────┴──────────────┐
│  Service layer (visits/services.py)                           │
│  approve_visit / reject_visit / check_in / check_out          │
│  - single source of truth for workflow rules                  │
│  - writes AuditLog on every mutation                          │
└───────────────┬──────────────────────────────────────────────┘
                ▼
┌───────────────────────────────────────────────────────────────┐
│  ORM (Django) → SQLite / PostgreSQL                            │
│  Tables: User, Organization, Building, Floor, Gate, Department,│
│  Employee, Visitor, Visit, QRPass, Blacklist, AuditLog         │
└───────────────────────────────────────────────────────────────┘
```

Key design decision: **server-rendered frontend + REST API share one service layer**,
so a mobile app or kiosk can be added later without duplicating business rules.

## 2. Data model (ERD)

```
accounts.User ──┬──> organizations.Organization
                │     ├──< Building ──< Floor
                │     │          └──< Gate
                │     ├──< Department
                │     └──< Employee (1:1 with User)
                │
                └──  role: SUPER_ADMIN | ORG_ADMIN | RECEPTIONIST |
                       SECURITY | EMPLOYEE | AUDITOR

visits.Visitor ──< visits.Visit ──> organizations.Organization
       │              │  ├──> organizations.Building (nullable)
       │              │  ├──> User (host)      ── 1:1 ──> QRPass
       │              │  └──> User (created_by)
       │              │
       └──< Blacklist (active reason)

organizations.AuditLog  (user, action, entity, details, timestamp)
```

### Status machine (Visit)

```
Registered ──> PENDING ──> APPROVED ──> CHECKED_IN ──> CHECKED_OUT ──> ARCHIVED
                  │            │             │
                  └──> REJECTED┘             └ (expiry) ──> EXPIRED
```

Transitions enforced in `visits/services.py` — each transition validates current state,
logs to AuditLog, and (on approval) issues a signed QRPass.

## 3. QR pass security

A QR pass is **signed and bound to a visit** so it can't be forged or replayed:

```
payload     = "<visit_id>|<organization_id>|<token>"
signature   = HMAC-SHA256(SECRET_KEY, payload)
QR contents = "<token>|<signature>"
```

On scan, `QRPass.verify()` checks, in order:
1. **Signature** — must match recomputed HMAC (tamper detection)
2. **Existence** — unknown tokens rejected
3. **Single use** — `is_used` flag blocks duplicate entry
4. **Expiry** — time-boxed (default 120 min)

## 4. RBAC matrix

| Permission | Super | OrgAdmin | Reception | Security | Employee | Auditor |
|---|---|---|---|---|---|---|
| create_visitor | ✅ | ✅ | ✅ | — | ✅ | — |
| approve_visitor | ✅ | ✅ | — | — | ✅ | — |
| checkin_visitor | ✅ | ✅ | — | ✅ | — | — |
| checkout_visitor | ✅ | ✅ | — | ✅ | — | — |
| scan_qr | ✅ | — | — | ✅ | — | — |
| badge_print | ✅ | ✅ | ✅ | — | — | — |
| manage_buildings | ✅ | ✅ | — | — | — | — |
| manage_employees | ✅ | ✅ | — | — | — | — |
| manage_users / roles | ✅ | ✅ | — | — | — | — |
| view_reports | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| view_audit_logs | ✅ | ✅ | — | — | — | ✅ |
| blacklist_visitor | ✅ | ✅ | — | — | — | — |

Implemented declaratively in `accounts/permissions.py`; exposed to templates via a
context processor (`perms`), and enforced in every view with a `_guard()` check.

## 5. Security measures implemented

- **Passwords:** Argon2 (resists GPU cracking), bcrypt fallback
- **Auth:** JWT access/refresh with rotation + blacklisting, session auth for the web UI
- **Account lockout:** 5 failed attempts → 15 min lock (`accounts/User.register_failed_attempt`)
- **QR forgery:** HMAC signature bound to secret + visit IDs
- **CSRF:** enabled on all web forms
- **Blacklist:** enforced at approval AND check-in layers (defense in depth)
- **Upload validation:** file-extension allowlist on documents (pdf/jpg/jpeg/png)
- **Parameterized queries:** 100% ORM, no raw SQL
- **Audit logging:** every state-changing action is recorded immutably
- **Rate limiting:** SimpleJWT + DRF throttling configured for auth endpoints

## 6. What's designed but not built (honest roadmap)

Mention these as *future work*, not as things already done:

- Celery background jobs (email, QR expiry sweeps, nightly reports) — `archive_old_visits()`
  already exists as the unit of work to be scheduled
- Real email delivery (currently console backend), SMS / WhatsApp / push
- Facial recognition, OCR of ID cards, NFC/RFID, kiosk self-service
- PostgreSQL + Redis for production, Docker Compose + CI
- i18n, multi-language
