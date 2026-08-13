# SecureGate — Supabase

SecureGate uses Supabase **only** as a managed PostgreSQL host. It does **not**
use Supabase Auth, Storage, or the Supabase JS client — Django's own auth and
migration system manage everything.

## Connecting the database

1. Create a Supabase project (any region).
2. Dashboard → Project Settings → Database → Connection string.
3. Select **Session pooler** (PostgreSQL, port `5432`).
4. Set `DATABASE_URL` in `backend/.env` (see `backend/.env.example`), or as a
   **secret environment variable on Render**. Keep the `?sslmode=require`
   suffix — Supabase requires TLS.
5. Initialize the schema with Django's migrations:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate    # macOS / Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo     # optional demo data (Acme Corp + demo accounts)
```

> `python manage.py migrate` is the **only** supported way to create/update the
> schema. In production it runs automatically via Render's pre-deploy command
> (`python manage.py migrate`).

## About the archived schema snapshot

`docs/database/0001_django_full_schema.sql` is an **archived snapshot** of the
DDL Django generated from its migration plan. It is kept for reference/audit
only — **do not apply it manually** and do not treat it as the source of truth.
It lives **outside** `supabase/migrations/` on purpose, so the Supabase GitHub
integration does not try to re-apply it to preview databases. Applying it by
hand and then running `migrate` can produce conflicting state. If you ever need
to build a fresh environment, run `python manage.py migrate` instead.

## Row Level Security (RLS)

The Django backend connects to Supabase with the database owner / pooler role,
which is a table owner, so Postgres RLS policies are bypassed. SecureGate enforces
its own authorization (Django sessions + SimpleJWT + RBAC), so no RLS policies
are required. If you later expose tables directly to Supabase's PostgREST API,
enable RLS per table at that time.
