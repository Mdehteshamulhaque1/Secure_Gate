# SecureGate — REST API Reference

Base URL: `http://127.0.0.1:8000/api/`

All endpoints except **register** and **token** require:
`Authorization: Bearer <access_token>`

## Auth

### POST `/api/auth/register/`  (public)
```json
{ "email": "new@acme.com", "full_name": "New Person", "phone": "9999999999", "password": "Str0ng!Pass" }
```
Returns user object + `access`/`refresh` tokens.

### POST `/api/auth/token/`  (public)
```json
{ "email": "alice@acme.com", "password": "Secure@123" }
```
Returns `access` (30 min) and `refresh` (7 days).

### POST `/api/auth/token/refresh/`
```json
{ "refresh": "<refresh_token>" }
```
With `ROTATE_REFRESH_TOKENS=True`, returns a **new refresh + access** pair and blacklists the old one.

## Visitors

### GET `/api/visitors/`
List visitors in your organization. Query params: `?search` (via `/search/?q=`) , paginated.

### GET `/api/visitors/{id}/`
### GET `/api/visitors/search/?q=rahul`

## Visits

### GET `/api/visits/?status=CHECKED_IN`
List visits, optionally filtered by status (`PENDING`, `APPROVED`, `REJECTED`, `CHECKED_IN`, `CHECKED_OUT`).

### POST `/api/visits/`
```json
{
  "visitor_id": 1,
  "host": 4,
  "building": 1,
  "purpose": "Client meeting",
  "visit_date": "2026-08-06",
  "expected_arrival": "10:00",
  "expected_exit": "17:00"
}
```
Creates a visit in `PENDING` status. Visitor must already exist and belong to your org.

### POST `/api/visits/{id}/approve/`
Approves the visit and issues a signed QR pass. Host (or org admin) only. `403` if you lack `approve_visitor`.

### POST `/api/visits/{id}/reject/`
```json
{ "reason": "No slot available" }
```

### POST `/api/visits/{id}/checkin/`
Marks visitor inside. Fails if not APPROVED, or if visitor is blacklisted.

### POST `/api/visits/{id}/checkout/`
Marks visitor out. Fails unless status is `CHECKED_IN`.

Each action returns `{ "detail": "...", "visit": { ... } }` with the updated visit + embedded QR.

## Dashboard

### GET `/api/dashboard/summary/`
```json
{ "today": 4, "week": 12, "month": 30, "inside": 2, "pending": 1, "approved": 3, "avg_duration_minutes": 65 }
```

## Quick test with curl

```bash
# get tokens
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@acme.com","password":"Secure@123"}' | python -c "import sys,json;print(json.load(sys.stdin)['access'])")

# list visits
curl -s http://127.0.0.1:8000/api/visits/?status=CHECKED_IN \
  -H "Authorization: Bearer $TOKEN"

# approve visit 1
curl -s -X POST http://127.0.0.1:8000/api/visits/1/approve/ \
  -H "Authorization: Bearer $TOKEN"
```

## Error conventions

- `400` — validation / workflow rule violation (e.g. "Visitor is blacklisted")
- `401` — missing / expired token
- `403` — authenticated but lacks the role permission
- `404` — unknown resource or outside your organization (org-scoped queries)
