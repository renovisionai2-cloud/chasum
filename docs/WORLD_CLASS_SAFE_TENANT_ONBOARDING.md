# World Class — Safe Tenant Onboarding Gate

**Program:** Chasum World Class Program  
**Gate:** Authenticated zero-business users must not auto-create a tenant  
**Status:** Implemented on Preview — **Chasum HQ created in Staging and verified**  
**Branch:** `cursor/world-class-portal-foundation`  
**Production:** locked — `https://chasum.vercel.app` (`4eecbec`)  
**Preview:** `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app`  
**Staging Supabase:** `wnfahklzaxirftyskctd`  
**Production Supabase:** `kxcydvhswkuzepwzzinq`  
**Migrations 034 / 035 / 036:** remain **unapplied**  
**Chasum HQ:** **created in Staging only** (not Production)  
**Phase 6.3:** **NOT STARTED**

---

## Verified Staging tenant (Chasum HQ)

| Field | Value |
|-------|--------|
| Auth owner | `operations@chasumai.com` (confirmed) |
| Name | Chasum HQ |
| Slug | `chasum-hq` |
| Timezone | `America/Toronto` |
| Currency | `cad` |
| Plan | `starter` (Free → starter) |
| Default location | `Chasum HQ — Main` / `main` / `America/Toronto` / `is_default = true` |
| Duplicate HQ | none |
| Create-time fake billing | none (`subscription_events` = 0, `billing_invoices` = 0) |
| Claude independent audit | **CONDITIONAL PASS** — P1 mock paid-upgrade path; P2 30-minute silent default |

Production does **not** have Chasum HQ.

---

## A. Root cause

An authenticated user with zero businesses could reach `/dashboard`. The dashboard layout called `getOrCreateBusiness()`, which called `ensure_business_for_owner()` and created a tenant from Auth `full_name` / `name` or **"My Business"**, with a slug from that name or the email prefix.

Authentication therefore meant tenant creation. That is unsafe for:

- a confirmed or unconfirmed Staging operator with zero businesses
- Platform Admin identities that must not receive a normal tenant merely because they signed in
- first-tenant quality (placeholder names, NY/USD defaults applied silently)

## B. Architecture implemented

```
Auth user
  → may have zero businesses
  → if accessible businesses exist → /dashboard (existing resolver + switcher)
  → if Platform Admin and zero businesses → /dashboard/hq (no tenant created)
  → otherwise → /onboarding/business
       → user submits name, timezone, and currency
       → server validates name + IANA timezone + supported currency
       → ensure_business_for_owner(p_name = entered name)
       → application stamps timezone + currency on the business
       → default location timezone updated to the selected IANA zone
       → appointment_interval_minutes seeded to 15 (business + default location_settings)
       → preferred_plan metadata mapped (Free → starter)
       → /dashboard

The RPC still inserts `owner_id, name, slug` only (DB defaults remain
`America/New_York` / `usd` / 30 minutes). No migration was authorized, so
selected timezone, currency, and the recommended 15-minute interval are
written in the same request after create. Invalid values never call the RPC.
```

Retrieval and mutation remain separated. Auth still must not auto-create a tenant.

## C. HQ audit fix pass (this follow-up)

Claude’s HQ audit **conditionally passed** with two required fixes:

1. **P1 — Block fake paid billing.** `MockBillingProvider.changePlan()` must not mint paid Professional/Business invoices, paid subscription state, or MRR. Server-side `refusePaidPlanChange` rejects paid plans unless the active provider is Stripe. Settings → Billing shows current starter plan; Upgrade is coming-soon / unavailable. Enterprise remains sales.
2. **P2 — 15-minute new-business default.** A genuinely new first-business create seeds `RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES` (15) on the business and default `location_settings`. Same-name retry never infers incompleteness from timezone, currency, or interval values (including New York + USD + 30). Existing tenants keep their interval unless the operator saves it in Settings. Setup progress no longer treats the silent 30-minute DB default as configured. **Existing Chasum HQ stays at 30** until an explicit Settings → Business booking-interval save.

Deferred P3 (not in this pass): dashboard-group `error.tsx`; `getHolidays()` silent empty fallback.

## STOP

Do **not** mutate Chasum HQ via SQL.  
Do **not** create GVM Test.  
Do **not** start Phase 6.3.  
Do **not** ask the Product Owner to test Billing Upgrade until Claude re-audits this fix pass.  
Production remains `4eecbec`.
