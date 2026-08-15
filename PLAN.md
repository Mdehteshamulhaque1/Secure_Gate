# SecureGate — Visitor Management System (PLAN)

> Single source of truth for what SecureGate is, how it is built, what is left to
> build, and how we know it is done.

---

## 1. What the project is

**SecureGate** is a visitor management system ("gate pass" SaaS) that lets an
organization:

- **Pre-register visitors** before they arrive (name, phone, company, ID
  document, vehicle, purpose, expected arrival/exit, building, host).
- **Approve / reject** visit requests from a dashboard.
- **Issue a signed, single-use QR pass** the moment a visit is approved. The
  QR is shown inside the app and **emailed to the visitor** (new feature).
- **Check visitors in/out** at the gate by scanning/verifying the QR.
- **Track everything** with an immutable audit log, role-based access control
  (RBAC), dashboards, and reports.

It is a full-stack web app:

- **Backend:** Django + Django REST Framework + SimpleJWT (REST API) plus
  Django server-rendered pages for admin-style workflows.
- **Frontend:** React 19 + TypeScript + Vite SPA (landing page + dashboard).
- **Database:** Supabase PostgreSQL (used *only* as a managed Postgres host —
  no Supabase Auth/Storage/PostgREST).
- **Hosting:** Backend on Render (auto-deploy from `main`), frontend on Vercel.

---

## 2. What needs to be built

### Already built (verified working end-to-end)
- Email/password signup + JWT login (`access`/`refresh`), current-user endpoint.
- Visitor registration (visitor + visit in one atomic call).
- Approval workflow with QR pass generation (`approve` / `reject` / `checkin` /
  `checkout` actions + `QRPass.verify`).
- QR displayed in the visitor drawer in the SPA (fixed: matched visits via
  `visitor.id`).
- QR pass **emailed to the visitor on approval** (HTML email with inline QR PNG).
- Dashboards, visitors list/search, approvals, security (check-in/out), reports,
  org/building/host data, audit logging, RBAC gates.
- Demo data seeding (`seed_demo`) and production data setup (Acme org attached
  to the owner account).
- Deploy automation: `render.yaml`, `vercel.json`, Supabase GitHub-integration
  conflicts resolved (schema snapshot moved out of `supabase/migrations/`).

### Remaining / future work
1. **Real SMTP delivery** — wire `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD`
   (Gmail app password) into Render; until then emails print to logs.
2. **QR re-issue / self-service** — allow regenerating an expired pass and a
   public visitor-facing page to view/download the pass.
3. **SMS QR delivery** (optional, e.g. Twilio) for visitors without email.
4. **Hardening pass** — API rate limiting, refresh-token rotation on logout,
   pagination on all list endpoints (already capped via `page_size`), audit
   export (CSV/PDF), and archived-visit purge job.

---

## 3. Current codebase structure

```
Secure_Gate-main/
├── backend/                      # Django project (Render root directory)
│   ├── config/                   # settings.py, urls.py, wsgi.py, asgi.py
│   ├── accounts/                 # Custom User (email login), RBAC roles, lockout
│   ├── api/                      # DRF: auth/register/token/me, visits, hosts,
│   │                             #   buildings, dashboard summary, serializers
│   ├── organizations/            # Organization, Building, Department, Employee,
│   │                             #   Gate, Floor, AuditLog
│   ├── visits/                   # Visitor, Visit, QRPass, Blacklist models;
│   │                             #   services.py (workflow), qrcodes.py,
│   │                             #   emails.py (NEW), views, admin, seed_demo
│   ├── reports/                  # Dashboards/reports + chatbot helper
│   ├── templates/                # Django server-rendered HTML incl.
│   │   └── visits/qr_pass_email.html   (NEW email template)
│   ├── requirements.txt          # Django, DRF, SimpleJWT, psycopg, qrcode, etc.
│   ├── .env.example              # Env var reference (incl. new EMAIL_* vars)
│   └── manage.py
├── frontend/                     # React + TS + Vite SPA (Vercel)
│   ├── src/
│   │   ├── pages/                # landing, auth/login, auth/register, dashboard,
│   │   │                         #   visitors, register-visit, approvals,
│   │   │                         #   security, reports, error
│   │   ├── components/           # layout (AppShell, Sidebar, Topbar),
│   │   │                         #   ui/ (shadcn-style primitives),
│   │   │                         #   landing/, visitors/VisitorDrawer, widgets/
│   │   ├── lib/                  # api.ts, auth.tsx (JWT store), queries.ts
│   │   │                         #   (react-query), types.ts, utils.ts
│   │   └── hooks/
│   ├── vercel.json               # Rewrites /api/* -> Render backend
│   └── package.json
├── supabase/
│   ├── migrations/README.md      # Notes: Django owns migrations
│   └── (migration SQL moved to docs/database/)
├── docs/database/0001_django_full_schema.sql   # Archived schema snapshot
├── render.yaml                   # Render IaC (preDeploy: migrate, health check)
└── README.md
```

---

## 4. Requirements

### Functional
- F1 — Email/password signup and login; JWT access + refresh tokens.
- F2 — RBAC: EMPLOYEE, RECEPTIONIST, SECURITY, ORG_ADMIN, AUDITOR, SUPER_ADMIN;
  nav and actions gated by role.
- F3 — Register a visitor + visit in one step (org, building, host, date,
  arrival/exit, purpose, vehicle, documents).
- F4 — Host/approver can approve or reject a PENDING visit.
- F5 — Approval creates a cryptographically signed, single-use QR pass valid
  120 minutes.
- F6 — QR pass visible in-app (visitor drawer) and **emailed to the visitor**.
- F7 — Security can verify a QR and check the visitor in/out; used/expired/
  tampered passes are rejected.
- F8 — Dashboards (today/week/month KPIs), visitors search, approvals list,
  reports, audit log.
- F9 — Multi-organization tenancy: every user belongs to one org; all queries
  are org-scoped.

### Non-functional
- N1 — Deploy backend (Render) and frontend (Vercel) from `main` automatically.
- N2 — Supabase Postgres with TLS (`sslmode=require`).
- N3 — Production logging so 500s are traceable (LOGGING config added).
- N4 — Frontend: strict TypeScript (`tsc --noEmit`) + Vite build must pass.
- N5 — Backend test suite must pass (`python manage.py test`).

### Environment variables
| Variable | Where | Notes |
|---|---|---|
| `SECRET_KEY` | Render (generated) | Django secret; also signs QR passes |
| `DJANGO_ENV=production` | Render | No SQLite fallback |
| `DJANGO_DEBUG=False` | Render | |
| `ALLOWED_HOSTS=.onrender.com` | Render | |
| `DATABASE_URL` | Render (secret) | Supabase Session Pooler, `?sslmode=require`, **password must be `%40`-encoded** |
| `CORS_ALLOWED_ORIGINS` | Render | Vercel URL, **no trailing slash** |
| `CSRF_TRUSTED_ORIGINS` | Render | Same |
| `EMAIL_HOST_USER` | Render | Gmail address (unset = console backend) |
| `EMAIL_HOST_PASSWORD` | Render | Gmail **App Password** (not the login password) |
| `DEFAULT_FROM_EMAIL` | Render | `SecureGate <email>` |
| `VITE_API_URL` | Vercel | Optional; `vercel.json` rewrites `/api/*` by default |

---

## 5. Architecture decisions

1. **Django owns the schema.** Migrations are the only supported way to create
   the DB (`preDeployCommand: python manage.py migrate`). The `sqlmigrate`
   snapshot lives in `docs/database/` for reference only and is kept **outside**
   `supabase/migrations/` so the Supabase GitHub integration does not re-apply it.
2. **Supabase = Postgres only.** No Supabase Auth/Storage/RLS needed: the Django
   backend connects as table owner (RLS bypassed), and auth is Django + SimpleJWT.
3. **Service layer as single source of truth.** `visits/services.py`
   (`approve_visit`, `reject_visit`, `check_in`, `check_out`, `archive_old_visits`)
   is shared by both the DRF API and the server-rendered views.
4. **Signed single-use QR.** QR payload = `token|signature`, where
   `signature = HMAC(visit_id|org_id|token)` using `SECRET_KEY`. `QRPass.verify`
   checks signature, existence, expiry (120 min), and single-use.
5. **Org scoping.** All API querysets filter by `request.user.organization`.
   Hosts/buildings lists are org-filtered. Registration rejects users with no org.
6. **JWT for the SPA, session auth for server-rendered pages.** API views use
   SimpleJWT; DRF API is stateless.
7. **Frontend uses react-query + typed API layer** (`lib/api.ts`, `lib/queries.ts`)
   with a `Paged<T>`/`T[]` unwrap helper; zod for form validation.
8. **Deployment:** `render.yaml` (migrate → collectstatic → gunicorn, health
   check on `/api/health/`), `vercel.json` (proxy `/api/*` to Render).

---

## 6. Files to create / modify

### Created (this plan / recent work)
- `backend/visits/emails.py` — `send_qr_pass_email()` + `qr_pass_png_bytes()`.
- `backend/templates/visits/qr_pass_email.html` — HTML email with inline QR.
- `docs/database/0001_django_full_schema.sql` — moved archived schema snapshot.
- `frontend/src/pages/onboarding.tsx` — workspace create/join UI.
- `PLAN.md` — this document.

### Modified (recent)
- `backend/config/settings.py` — LOGGING config; env-driven EMAIL_* settings.
- `backend/api/views.py` — added `OrganizationCreateView`, `OrganizationJoinView`.
- `backend/api/serializers.py` — added `OrganizationCreateSerializer`,
  `OrganizationJoinSerializer`.
- `backend/api/urls.py` — `organizations/`, `organizations/join/` endpoints.
- `backend/api/tests.py` — API tests (register/token/me/visit-register/org scope).
- `backend/visits/services.py` — email QR on approval (non-blocking on SMTP error).
- `backend/visits/tests.py` — 2 new email tests (31 total).
- `backend/.env.example` — documented `EMAIL_*` vars.
- `frontend/src/components/layout/Sidebar.tsx` — logo links to landing `/`.
- `frontend/src/components/visitors/VisitorDrawer.tsx` — match visits via `visitor.id`.
- `frontend/src/lib/types.ts` — removed phantom `visitor_id` from `Visit`;
  added org create/join payloads.
- `frontend/src/lib/queries.ts` — `useCreateOrganization`, `useJoinOrganization`.
- `frontend/src/App.tsx` — `/onboarding` route; `Protected` redirects
  authenticated users with no org to onboarding.
- `supabase/migrations/README.md` — archive location note.

### Remaining work — likely files
- Org onboarding: new `frontend/src/pages/...` (org create/join) + a backend
  endpoint (e.g. `POST /api/organizations/`, `PATCH /api/auth/me/`) +
  serializer + tests.
- QR self-service: `QRPass` re-issue action + visitor-facing public page.
- SMS: `backend/visits/sms.py` (Twilio) + provider env vars.
- Hardening: DRF throttling settings, refresh rotation, CSV export view.

---

## 7. Implementation steps

### Done
1. Restored/deployed Supabase DB and ran all Django migrations (schema was empty).
2. Added API tests + LOGGING; committed `error fixing`; pushed to `main`.
3. Fixed Supabase Preview failure (moved archived SQL out of migrations dir).
4. Seeded demo data (Acme + buildings + employees + sample visits) and attached
   the owner account as ORG_ADMIN.
5. Fixed sidebar logo → landing page.
6. Fixed visitor drawer so the QR pass renders (match by nested `visitor.id`).
7. Implemented QR email delivery on approval; added tests; pushed.

### Remaining (in order)
8. ~~Frontend org onboarding~~ ✅ Done — `POST /api/organizations/` (create,
   sets user ORG_ADMIN + default building) and `POST /api/organizations/join/`
   (join by slug, sets EMPLOYEE); `/onboarding` page; no-org users are
   redirected there instead of hitting a blocked form.
9. Configure real Gmail SMTP on Render (user action) and verify a delivered email.
10. Add rate limiting (DRF `DEFAULT_THROTTLE_RATES`) and refresh-token rotation.
11. QR self-service page + regeneration of expired passes.
12. CSV/PDF audit export + scheduled archive purge (`archive_old_visits`).

---

## 8. Testing requirements

- **Backend:** `python manage.py test` must pass (currently **31 tests**).
  Cover: register/token/me, org scoping, visit register + approve/reject/
  check-in/out, QR verify (tampered/unknown/duplicate), RBAC, page renders,
  **QR email sent on approval with a PNG attachment**, no email when the
  visitor has no address, and **org create/join** (admin role, default building,
  unique slug, join by slug, already-in-org rejection).
- **Frontend:** `npm run typecheck` (`tsc --noEmit`) and `npm run build` pass.
- **Deployed smoke test (manual):**
  1. Sign up → confirm token/`/api/auth/me/` returns 200.
  2. Register a visitor **with an email** → approve → visitor gets the email
     with QR (once SMTP configured).
  3. Open the visitor in **Visitors** → drawer shows "Active QR pass".
  4. Scan/verify QR (Security) → check in/out; reused QR is rejected.
  5. No-org account shows a clear onboarding prompt instead of a blocked form.
- **Email test harness:** locmem backend via `override_settings`; verify outbox,
  recipient, subject, HTML body, PNG payload (`\x89PNG`).

---

## 9. Security / performance considerations

### Security
- **Secrets:** `SECRET_KEY` and `DATABASE_URL` never committed; DB password
  `%40`-encoded (raw `@` breaks the connection). Gmail uses an **App Password**,
  never the account password. Rotate if leaked.
- **Transport:** HTTPS enforced (`SECURE_SSL_REDIRECT`), secure cookies,
  HSTS when `DEBUG=False`; Postgres TLS (`sslmode=require`).
- **QR integrity:** HMAC-signed payload, 120-min expiry, single-use, blacklist
  blocks approval; `secrets.compare_digest` for signature comparison.
- **Auth:** JWT access/refresh with token blacklisting enabled; account lockout
  after `MAX_LOGIN_ATTEMPTS`.
- **Tenancy:** every queryset org-scoped; `validate_visitor_id` checks the
  visitor belongs to the caller's org; registration rejected for org-less users.
- **CSRF/CORS:** CORS restricted to the Vercel origin (no trailing slash);
  CSRF trusted origins env-driven.
- **Input:** DRF serializers + zod on the frontend; document uploads restricted
  to pdf/jpg/jpeg/png.
- **Emails:** QR emailed only to the visitor's own registered address; SMTP
  failures are logged and never block approval.

### Performance
- `select_related("visitor", "host", "building")` on visit listings; indexes on
  `(status, visit_date)` and `(organization, status)`.
- List endpoints capped with `page_size` (1000 max) to bound payloads.
- `conn_max_age=600` + `conn_health_checks` for Postgres pooling.
- gunicorn with 3 workers / 60s timeout on Render free tier.
- Frontend: code-split landing page (`React.lazy`), react-query caching/invalidation.

---

## 10. Definition of done

SecureGate is **done** when:

1. A new user can sign up and (via UI) create/join an organization with a
   building and default host — no admin/seed step required. ✅ (Done — verified
   live: create → ORG_ADMIN + default building; join by slug → EMPLOYEE.)
2. Registering a visitor (with an email) → approving → **emails the QR pass** to
   that visitor and shows it in-app; the pass scans once, then is spent.
3. Security can verify the QR, check in/out, and tampered/expired/duplicate
   passes are refused with clear messages.
4. Dashboards, visitors, approvals, security, and reports work with org-scoped
   data for all roles.
5. Backend suite (**23+ tests**) and frontend `tsc`/build pass on every change.
6. Production deploys automatically from `main` (Render backend + Vercel
   frontend), the health check returns 200, Supabase Preview check is green,
   and logs show no 500s.
7. Rate limiting, refresh-token rotation, QR self-service, and audit export are
   implemented (hardening pass) — or explicitly accepted as out of scope.
