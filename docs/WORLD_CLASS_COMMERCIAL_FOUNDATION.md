# World Class Commercial Foundation

**Status:** Gate 2 authored — Track 1 + Track 2 **UNAPPLIED**. Track 3 **BLOCKED**.  
**Branch:** `cursor/commercial-track-1-2-7453`  
**World Class HEAD at start:** `c5aa36f78d4b3ad61311bbda8096b9cced6bf07b`  
**Production baseline:** `4eecbec0f0f04532ae0294132d07183b6e64f23f`  
**Shared Supabase:** Preview and Production. Do not apply SQL without explicit Product Owner execution approval.

Pricing hypotheses, packaging, and cost-to-serve direction live in [`WORLD_CLASS_COMMERCIAL_STRATEGY.md`](./WORLD_CLASS_COMMERCIAL_STRATEGY.md). This file is the **architecture / schema / implementation-state** source of truth. Do not duplicate list prices here.

Public Pricing remains locked: [`docs/marketing/PRICING_PAGE_V1_LOCK.md`](./marketing/PRICING_PAGE_V1_LOCK.md).

---

## Governing model

PLAN (`subscription_plans.plan_key`)  
→ IMMUTABLE OFFER VERSION (`plan_offers`)  
→ BUSINESS SUBSCRIPTION REFERENCE (`businesses.offer_id`)  
→ EFFECTIVE ENTITLEMENTS (later; Private Alpha overlay **not** encoded)  
→ BILLING EVENTS / INVOICES (existing tables; RLS unchanged in this gate)  
→ USAGE EVENTS (`usage_events`)

Independent: design-partner applications (Track 1). Future: billing profile + Stripe SaaS billing (not this gate).

---

## Track status

| Track | Scope | Status |
|-------|--------|--------|
| **1** | `design_partner_applications` + `/apply` persist | Authored, **UNAPPLIED** (`037`) |
| **2** | `plan_offers`, `businesses.offer_id`, `usage_events`, triggers | Authored, **UNAPPLIED** (`038`) |
| **3** | `subscription_events` / `billing_invoices` RLS hardening | **BLOCKED / NOT IMPLEMENTED** |

### Why Track 3 is blocked

Claude inspected Production `4eecbec` and confirmed it still writes `subscription_events` / `billing_invoices` with a **user-scoped** Supabase client and lacks the World Class paid-upgrade guard. Preview and Production share Supabase, so tightening those RLS policies would affect Production immediately. Track 3 requires an explicit **P0 PRODUCTION SAFETY / COMPATIBILITY DECISION**.

---

## Execution warning (034–036)

Migrations **034, 035, and 036 remain unapplied**.

This repository has no established Supabase CLI migration automation that can skip them.

**MANUAL SCOPED SQL EXECUTION ONLY UNTIL 034–036 ARE RESOLVED.**

Do **not** run `supabase db push`, `supabase migration up`, or any CLI that applies pending files in filename order. Those commands would attempt 034–036 first on the shared database.

---

## Track 1 — `/apply` persistence

- Table: `design_partner_applications`
- Server action: `lib/actions/design-partner.ts` via `createServiceClient()`
- No anon/authenticated INSERT or SELECT policies
- Does not create auth users, businesses, members, subscriptions, offers, Stripe customers, or billing rows
- Persist first; email notification after; a saved row is kept if email fails
- If 037 is not applied yet, missing-relation errors fall back to the existing email/log path so Preview `/apply` is not lost

Founder review remains manual (`status` + `reviewed_at` / `reviewed_by`).

---

## Track 2 — additive schema

### `plan_offers`

Stable plan identity stays on `subscription_plans`. Offers are versioned commercial SKUs.

Lifecycle: draft (`is_locked = false`) cannot be default, active-for-sale, or assigned. Locked payload is immutable. Flags `is_default_for_new` and `is_active_for_new_sales` remain mutable. Cannot unlock. Inserting an already-locked row is allowed.

Partial unique: at most one `is_default_for_new` per `(plan_key, currency)`.

CHECKs: default ⇒ locked AND active-for-sale; active-for-sale ⇒ locked.

**No seeds in Track 2.** Future Stage 2 CAD working baseline (not public Pricing) is documented only in the strategy doc. When Stage 2 is authored, paid CAD offers should start `is_locked = true` and `is_default_for_new = false` / `is_active_for_new_sales = false` unless PO separately activates sales.

### Read model

No authenticated/anon `plan_offers` policies. Revoke from `anon` / `authenticated`. `service_role` only. Tenant Billing must not become an accidental PostgREST catalog of historical/custom offers.

### `businesses.offer_id`

Nullable FK. **No backfill.** Once set, `offer.plan_key` is canonical; `subscription_plan_key` must match.

Assignment of `offer_id` requires `auth.role() = 'service_role'`. Do **not** treat `auth.uid() IS NULL` as trusted (anonymous JWTs also have a null uid).

Consistency (locked offer + matching `plan_key`) runs for **every** writer: primary owner, co-owner admin, server action, service role, future Platform Admin. Co-owners can UPDATE `businesses` under existing RLS; they still cannot create an invalid commercial pair.

#### Emergency DBA repair (exceptional)

Normal assignment MUST use `createServiceClient()` so PostgREST presents JWT `auth.role() = 'service_role'`. That is the only application path.

**Verified SQL Editor model (this project):** dashboard SQL runs as PostgreSQL role `postgres` with **no JWT**. `auth.role()` reads the request JWT claim (same GUC used in `004` service-role policies). It is **NULL** in the SQL Editor, so API roles fail closed — including after `SET ROLE service_role`, which does **not** populate `auth.role()`. Do not use `SET ROLE service_role` as a repair procedure.

The assignment trigger therefore also allows `current_user IN ('postgres', 'supabase_admin')` so an authorized administrator can repair **without disabling the trigger**. The rest of the trigger still requires:

- offer row exists
- offer `is_locked`
- `subscription_plan_key` = `plan_offers.plan_key`

Anon / authenticated / owner / co-owner remain blocked (`current_user` is `anon` or `authenticated`).

Example (replace ids; run only with PO authorization):

    UPDATE public.businesses b
    SET offer_id = o.id,
        subscription_plan_key = o.plan_key
    FROM public.plan_offers o
    WHERE b.id = '<business-uuid>'
      AND o.id = '<locked-offer-uuid>'
      AND o.is_locked = true
      AND o.plan_key = b.subscription_plan_key;

If a trigger must ever be disabled (last resort, not the preferred path):

    BEGIN;
    ALTER TABLE public.businesses DISABLE TRIGGER businesses_offer_assignment_guard;
    -- run the same UPDATE, then immediately:
    ALTER TABLE public.businesses ENABLE TRIGGER businesses_offer_assignment_guard;
    COMMIT;

Never leave the trigger disabled across sessions. Never DROP the function. Never add a general bypass API.

### `usage_events`

Append-only internal COGS ledger. `estimated_cost_micros`: 1,000,000 = $1.00 USD-equivalent. Not customer billing. `business_id` is `ON DELETE RESTRICT` so usage/COGS history is not silently removed if a business row is hard-deleted.

No authenticated SELECT/INSERT/UPDATE/DELETE. No tenant-facing usage view in this gate (would leak provider cost).

Corrections = new compensating rows. Trigger blocks UPDATE/DELETE even for service_role.

No emitters in Track 2.

**Future SMS (design only):** Twilio REST create `num_segments` is provisional; status callback `NumSegments` is the reconciliation signal. One message ≠ one segment.

---

## Explicitly not in Track 1 / 2

- `billing_profiles` — DESIGN NOW / BUILD WITH STRIPE BILLING
- `past_due_since` — DESIGN NOW / BUILD WITH STRIPE BILLING
- Private Alpha overlay / entitlement changes — **neutral**; current app staff/location caps, RPC, SMS, branding, API unchanged
- Public Pricing, Stripe Products/Prices/Checkout
- Production, GVM, or Chasum HQ data

---

## P0 Production safety finding (document only)

Production `4eecbec`:

- lacks the World Class paid-upgrade guard
- writes `subscription_events` via a user-scoped client
- contains the older mock `billing_invoices` paid-invoice path

Do **not** fix Production in this gate. Requires explicit PO authorization.

---

## Approval gates

1. PO approved this plan with Claude’s required modifications (done).  
2. Cursor authored Track 1 + Track 2 on a branch, **did not apply** (this file).  
3. Claude audits the actual diff.  
4. PO explicitly approves Track 1 and/or Track 2 database execution (separate).  
5–9. Stage 2 seed/backfill remains later; Track 3 remains blocked until the Production compatibility decision.

---

## Private Alpha (neutral)

Current audited behavior (billed `starter` + `private_alpha_enabled`):

- app staff cap 1, app location cap 1, RPC location unlimited  
- SMS true, remove branding true, API/Developer true  

No overlay values are approved. Do not encode `PRIVATE_ALPHA_OVERLAY_ENTITLEMENTS` until PO decides.
