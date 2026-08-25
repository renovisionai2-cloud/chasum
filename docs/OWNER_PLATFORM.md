# Owner Platform

**CURRENT ROLE (2026-08-24 PO ruling):** `/owner` is the **Platform Admin / Control Centre** direction — the SaaS operator control plane (tenants, subscriptions, trials, plans, billing/account health, support access, usage, entitlements, platform operations).

**Chasum HQ** is a **normal tenant**, not this surface. **`/dashboard/hq`** is a legacy founder-only surface and must not become (or be described as) Chasum HQ. Handoff: [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md).

Secure dashboard for **Chasum platform owners** (super administrators) only.  
Customer businesses — including the Chasum HQ tenant and GVM — continue to use `/dashboard` and cannot access `/owner`.

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

- Assigned Professional+ product plans are **not** collected subscription revenue. Overview / Subscriptions / Revenue show **estimated MRR at list price**.
- Customer Account & billing is truthful Private Alpha copy: no self-serve checkout, cancel, or downgrade theater.
- Customer dashboard branding is otherwise unchanged.

## Private Alpha / design-partner operating path

1. Business applies (`/apply`) or is invited.
2. Chasum approves the design partner.
3. Billing/payment is arranged **outside** self-serve Chasum billing.
4. A platform owner assigns Free (`starter`) or Professional on `/owner/businesses`.
5. Existing entitlements follow `subscription_plan_key` (staff seats, etc.).
6. `private_alpha_enabled` remains a separate feature-elevation flag — it is not the product plan.
7. Tenant billing shows the product plan, Private Alpha status, and that billing is arranged with Chasum.
8. Further plan changes go through Chasum (`/owner`), not tenant self-serve controls.

Assignable keys in Phase 4A: `starter`, `professional` only. Assignment writes `subscription_events` and never writes Stripe IDs or `billing_invoices`. Plan UPDATE and event INSERT are **not atomic** (TD-M11, planned hardening — not blocking Phase 4A).
