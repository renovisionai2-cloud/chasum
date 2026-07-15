# Owner Platform

Secure dashboard for **Chasum platform owners** (super administrators) only.  
Customer businesses continue to use `/dashboard` and cannot access `/owner`.

## Access

1. Sign in with a Supabase Auth user.
2. Authorize via either:
   - `PLATFORM_OWNER_EMAILS` (comma-separated) in the environment, or
   - a row in `platform_admins` (migration `014_owner_platform.sql`).
3. Open `/owner`.

Non-owners are redirected to `/dashboard`. Unauthenticated users go to `/login?redirect=/owner`.

Cross-tenant reads use the **service role** only after the platform-owner gate.

## Routes

| Path | Purpose |
|------|---------|
| `/owner` | Overview metrics |
| `/owner/businesses` | All tenants |
| `/owner/subscriptions` | Plan mix |
| `/owner/revenue` | Estimated MRR / ARR |
| `/owner/trials` | Free trials |
| `/owner/support` | Failed notification deliveries |
| `/owner/health` | Dependency checks + alerts |
| `/owner/security` | Admin allowlist status |
| `/owner/settings` | Runtime configuration (no secrets) |

## Setup

```bash
# Apply migration 014 in Supabase
# Then set:
PLATFORM_OWNER_EMAILS=you@chasum.app
SUPABASE_SERVICE_ROLE_KEY=...
```

Optional DB seed:

```sql
insert into platform_admins (user_id, email, role)
values ('<auth-user-uuid>', 'you@chasum.app', 'super_admin');
```

## Notes

- MRR/ARR are estimated from `subscription_plans.monthly_price_cents` (or marketing fallbacks) until Stripe is connected.
- Customer dashboard UI and branding are intentionally unchanged.
