# 🔐 SecureGate

> Enterprise Visitor & Access Management Platform — built with **Django 5 + Django REST Framework + Bootstrap 5**.

Modern visitor management with employee approvals, QR access passes, security check-in/check-out,
role-based access control and multi-tenant organizations.

---

## ✨ What's implemented (working demo)

| Area | Features |
|------|----------|
| **Auth** | Email login, register, logout, profile, change password, JWT (30 min access / 7 day refresh with rotation), account lock after 5 failed attempts |
| **RBAC** | 6 roles (Super Admin, Org Admin, Receptionist, Security Guard, Employee, Auditor) with granular permissions |
| **Multi-tenant** | Organization profile, logo, timezone, working hours, buildings, floors, gates, departments |
| **Visitor workflow** | Pre-registration → host approval → QR pass → security check-in → check-out → archived |
| **QR system** | Signed QR passes (HMAC + secret), expiry, single-use, duplicate-entry blocking, camera scanner + manual paste |
| **Reception desk** | Walk-in registration (auto-approved), today's roster, waiting/inside counters, printable badge |
| **Security panel** | QR scan + verify + check-in, manual lookup, check-out, live "inside" roster, blacklist alerts |
| **Dashboards** | Live KPIs + Chart.js charts: status breakdown, peak hours, by-department, first-time vs repeat |
| **Reports** | Daily / weekly / monthly, department filter, CSV export, summary KPIs |
| **Audit log** | Immutable trail of logins, approvals, check-ins, role changes, settings changes |
| **Blacklist** | Reason-based (security concern / fake docs / misconduct / permanent ban), blocks approval & entry |
| **REST API** | DRF + JWT: register, visitors, visits, approve/reject/check-in/check-out, dashboard summary |
| **Extras** | Emergency "Inside Now" roster, admin panel (org, buildings, departments, employees, roles), Django admin |

## 🚀 Quick start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Migrate + seed demo data
python manage.py migrate
python manage.py seed_demo

# 3. Run
python manage.py runserver
```

Open <http://127.0.0.1:8000/> — land on the animated landing page.

## 👤 Demo accounts (password for all: `Secure@123`)

| Role | Email |
|------|-------|
| Super Admin | superadmin@securegate.io |
| Organization Admin | admin@acme.com |
| Receptionist | reception@acme.com |
| Security Guard | security@acme.com |
| Employee (host) | alice@acme.com |
| Employee | bob@acme.com |
| Auditor | auditor@acme.com |

> Note: the console email backend prints emails (approval notifications, QR links) to the terminal.

## 🧪 Tests

```bash
python manage.py test visits
```

Covers: full visit workflow, QR verification/duplicate/tamper, RBAC matrix, account lockout, page access.

## 📦 Tech stack

- **Backend:** Django 5, Django REST Framework, SimpleJWT
- **Frontend:** Django templates, Bootstrap 5, Chart.js, html5-qrcode
- **Passwords:** Argon2 (strongest), bcrypt fallback
- **QR:** `qrcode` (signed HMAC payload, rendered as data URI — no file storage needed)
- **DB:** SQLite (drop-in swap to PostgreSQL for prod)

## 📁 Project layout

```
SecureGate/
├── config/            # settings, urls
├── accounts/          # custom User, auth views, RBAC permissions
├── organizations/     # Organization, Building, Floor, Gate, Department, Employee, AuditLog
├── visits/            # Visitor, Visit, QRPass, Blacklist + workflow service layer
├── reports/           # dashboard, reports, audit log, inside-now
├── api/               # DRF serializers/viewsets + JWT
├── templates/         # Bootstrap templates (landing w/ logo animation, base + pages)
└── static/            # CSS + JS
```

See [`docs/`](docs/) for architecture, API reference and interview prep.
