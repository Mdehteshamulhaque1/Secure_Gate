# 🔐 SecureGate

> **Enterprise Visitor & Access Management Platform** — built with **React 19 + TypeScript + Vite + Tailwind CSS (Frontend)** and **Django 5 + Django REST Framework + SimpleJWT (Backend)**.

Modern, cinematic visitor management: pre-registration → host approval → signed QR passes → security check-in/out → live dashboards → audit trails → role-based access.

---

## ✨ Features

| Area | Highlights |
|------|------------|
| **Auth** | Email/password login, JWT (30 min access / 7 day refresh with rotation), auto-refresh, account lockout |
| **RBAC** | 6 roles (Super Admin, Org Admin, Receptionist, Security, Employee, Auditor) with granular permissions |
| **Multi-tenant** | Organization profile, buildings, departments, employees |
| **Visitor workflow** | Pre-register → host approve/reject → signed QR pass → security scan check-in/out |
| **QR passes** | Cryptographically signed (HMAC), expiry, single-use, duplicate detection |
| **Security panel** | QR scan + verify, manual lookup, live inside roster, blacklist alerts |
| **Dashboards** | Live KPIs, animated charts (Recharts), recent scans, approvals feed |
| **Reports** | Daily/weekly/monthly, CSV export, audit log, inside-now roster |
| **Audit log** | Immutable trail of every action (login, approval, check-in, role change) |
| **REST API** | DRF + SimpleJWT: visitors, visits, approve/reject/check-in/out, dashboard summary |
| **Dark theme** | Cinematic landing page, glassmorphism UI, Framer Motion animations |

---

## 🏗 Architecture

```
SecureGate/
├── frontend/                 # React 19 + Vite + Tailwind + Framer Motion
│   ├── src/
│   │   ├── components/       # Reusable UI (Button, Card, Dialog, etc.)
│   │   │   ├── landing/      # Cinematic landing page sections
│   │   │   ├── layout/       # AppShell, Sidebar, Topbar
│   │   │   ├── ui/           # Shadcn-style primitives
│   │   │   └── visitors/     # VisitorDrawer, etc.
│   │   ├── pages/            # Routes (Landing, Login, Dashboard, Visitors, Approvals, Security, Reports, RegisterVisit)
│   │   ├── hooks/            # Custom hooks (usePendingCount, etc.)
│   │   ├── lib/              # API client, AuthProvider, queries (TanStack Query), types, utils
│   │   ├── App.tsx           # Routes + RBAC guards
│   │   └── main.tsx
│   ├── vercel.json           # Vercel config (API proxy)
│   └── .env.example
│
├── backend/                  # Django 5 + DRF + SimpleJWT
│   ├── config/               # Settings, URLs, WSGI/ASGI
│   ├── accounts/             # Custom User, RBAC permissions, JWT auth
│   ├── organizations/        # Org, Building, Department, Employee, AuditLog
│   ├── visits/               # Visitor, Visit, QRPass, Blacklist, workflow services
│   ├── reports/              # Dashboards, reports, audit log
│   ├── api/                  # DRF ViewSets, serializers, JWT auth
│   ├── render.yaml           # Render IaC (web service + PostgreSQL)
│   └── .env.example
│
├── render.yaml               # Render IaC (PostgreSQL + Web Service)
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (optional locally, SQLite works)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # edit values
python manage.py migrate
python manage.py seed_demo         # creates demo org + accounts
python manage.py runserver 127.0.0.1:8001
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local         # optional: VITE_API_URL=http://localhost:8001
npm run dev
```

- Frontend: `http://localhost:5173` (proxies `/api` → `http://127.0.0.1:8001`)
- Backend API: `http://127.0.0.1:8001/api/`
- Django Admin: `http://127.0.0.1:8001/admin/`

### Demo Accounts (password: `Secure@123`)

| Role | Email |
|------|-------|
| Org Admin | admin@acme.com |
| Employee (Host) | alice@acme.com |
| Security | security@acme.com |
| Receptionist | reception@acme.com |
| Employee | bob@acme.com |

---

## 🧪 Tests

```bash
# Backend
cd backend
python manage.py test visits api

# Frontend
cd frontend
npm run typecheck
npm run build
```

---

## 🚀 Production Deployment

### Frontend → Vercel

1. **Push repo** (already done) → Vercel imports `frontend/` as root
2. **Root Directory**: `frontend`
3. **Framework**: Vite (auto)
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables** (Vercel → Settings → Env):
   - `VITE_API_URL` = `https://your-render-api.onrender.com`
6. **Deploy** → get `https://securegate.vercel.app`

> `vercel.json` rewrites `/api/*` → `https://your-render-api.onrender.com/api/*`

### Backend → Render

#### Option A: Infrastructure as Code (render.yaml)
1. Connect repo in Render Dashboard → **New → Blueprint**
2. Select repo → Render reads `render.yaml` → creates:
   - PostgreSQL database (`securegate-db`)
   - Web service (`securegate-api`) with Gunicorn + whitenoise
3. Add env vars in Render Dashboard:
   - `SECRET_KEY` (generate: `openssl rand -base64 32`)
   - `DEBUG` = `False`
   - `ALLOWED_HOSTS` = `.onrender.com`
   - `CSRF_TRUSTED_ORIGINS` = `https://your-vercel-app.vercel.app`
   - `CORS_ALLOWED_ORIGINS` = `https://your-vercel-app.vercel.app`
4. First deploy → open **Shell** tab → run:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```
5. Set **Pre-Deploy Command** (Settings → Build):
   ```bash
   python manage.py migrate --noinput
   ```

#### Option B: Manual Web Service
- **Build**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- **Start**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 60`
- Add PostgreSQL database → copy `DATABASE_URL` to env vars

### Required Render Env Vars

| Key | Value |
|-----|-------|
| `SECRET_KEY` | `openssl rand -base64 32` |
| `DJANGO_DEBUG` | `False` |
| `ALLOWED_HOSTS` | `.onrender.com,yourdomain.com` |
| `CSRF_TRUSTED_ORIGINS` | `https://your-vercel-app.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | `https://your-vercel-app.vercel.app` |
| `DATABASE_URL` | (auto from Render PostgreSQL) |

### Post-Deploy
1. Run migrations: `python manage.py migrate` (or set as pre-deploy command)
2. Create superuser: `python manage.py createsuperuser`
3. Verify: `https://your-api.onrender.com/api/auth/me/` → 401 (unauthenticated)
4. Test login from Vercel frontend

---

## 🔧 Environment Variables Reference

### Frontend (`frontend/.env.local` | Vercel Env)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Production only | Full backend URL (e.g., `https://api.securegate.io`) |

### Backend (`backend/.env` | Render Env)
| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | **Yes** | Django secret (generate: `openssl rand -base64 32`) |
| `DJANGO_DEBUG` | No | `True`/`False` (default: `True` locally) |
| `ALLOWED_HOSTS` | Prod | Comma-separated (e.g., `.onrender.com,api.example.com`) |
| `CSRF_TRUSTED_ORIGINS` | Prod | Vercel frontend URL(s) |
| `CORS_ALLOWED_ORIGINS` | Prod | Vercel frontend URL(s) |
| `DATABASE_URL` | Prod | Auto from Render PostgreSQL |
| `DATABASE_URL` | Local | `sqlite:///db.sqlite3` (default) |

---

## 📁 Key Files for Deployment

| File | Purpose |
|------|---------|
| `frontend/vercel.json` | Vercel rewrites `/api/*` → Render backend |
| `frontend/.env.example` | Frontend env template |
| `backend/render.yaml` | Render Blueprint (PostgreSQL + Web Service) |
| `backend/.env.example` | Backend env template |
| `backend/requirements.txt` | Python deps (includes whitenoise, corsheaders, gunicorn) |
| `backend/config/settings.py` | Production-ready settings (whitenoise, CORS, PostgreSQL, security headers) |

---

## 🧩 Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, TanStack Query, React Router 7, React Hook Form + Zod, Lucide Icons, Recharts, Shadcn-style UI |
| **Backend** | Django 5.2, Django REST Framework, SimpleJWT (rotate+blacklist), dj-database-url, whitenoise, django-cors-headers, gunicorn |
| **Database** | PostgreSQL (Render) / SQLite (local) |
| **Auth** | JWT (access 30 min, refresh 7 days, rotation + blacklist) |
| **QR** | Signed HMAC payload (token\|signature), expiry, single-use |
| **Charts** | Recharts (animated area chart, custom tooltips) |
| **Animations** | Framer Motion (stagger, scroll parallax, spring physics) |

---

## 📄 License

MIT — build something great.