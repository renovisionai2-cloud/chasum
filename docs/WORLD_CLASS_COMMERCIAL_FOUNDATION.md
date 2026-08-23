# World Class Commercial Foundation

**Status:** Track 1 / Migration 037 **APPLIED + VERIFIED**. Track 2 / Migration 038 **UNAPPLIED**. Track 3 **BLOCKED**. Commercial Foundation as a whole is **not complete**.  
**Branch:** `cursor/commercial-track-1-2-7453`  
**World Class HEAD at start:** `c5aa36f78d4b3ad61311bbda8096b9cced6bf07b`  
**Production code:** `4eecbec0f0f04532ae0294132d07183b6e64f23f`  
**Preview code:** `6ecc35f5c69934ba37398c58ff36322768d49efd`

### LIVE ENVIRONMENT CONTRACT (2026-08-23)

| Surface | Code | Database |
|---------|------|----------|
| **Production** | `4eecbec` · https://chasum.vercel.app | Production Supabase `kxcydvhswkuzepwzzinq` |
| **Preview** | `6ecc35f` · https://chasum-git-cursor-commercial-track-1-2-7453-renovisionappcom.vercel.app | Staging Supabase `wnfahklzaxirftyskctd` |

Preview → Staging. Production → Production. **Do not change either environment.**

**SUPERSEDED:** “Preview and Production currently share Supabase.” That was true on 2026-08-19 (cutover STOPPED in-agent). Out-of-band Preview-only Vercel cutover completed before 2026-08-21 HQ creation. Live-verified 2026-08-23 Preview `/api/build-info`: `"supabaseProjectRef":"wnfahklzaxirftyskctd"`. Canonical cutover record: [`WORLD_CLASS_PREVIEW_STAGING_CUTOVER.md`](./WORLD_CLASS_PREVIEW_STAGING_CUTOVER.md).

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
| **1** | `design_partner_applications` + `/apply` persist | **APPLIED + VERIFIED** (`037`) |
| **2** | `plan_offers`, `businesses.offer_id`, `usage_events`, triggers | Authored, **UNAPPLIED** (`038`) |
| **3** | `subscription_events` / `billing_invoices` RLS hardening | **BLOCKED / NOT IMPLEMENTED** |

### Track 1 / Migration 037 — APPLIED + VERIFIED

| Database | 037 | Verification |
|----------|-----|----------------|
| Production `kxcydvhswkuzepwzzinq` | **APPLIED** | Schema + security verified (table, 17 columns, RLS on, 0 policies, 0 anon/authenticated grants, service_role present). Production app is still `4eecbec` — **not application-functionally tested**. |
| Staging `wnfahklzaxirftyskctd` | **APPLIED** | Schema + security + Preview `/apply` E2E **PASSED**. Test row `business_name` = `Chasum Migration 037 Test` persisted once; `status` = `received`; `source` = `apply`; `created_at` populated. |

### Why Track 3 is blocked

Claude inspected Production `4eecbec` and confirmed it still writes `subscription_events` / `billing_invoices` with a **user-scoped** Supabase client and lacks the World Class paid-upgrade guard. Preview no longer shares Production Supabase, so Staging-only RLS would not hit Production — but Track 3 on **Production** would still break live `4eecbec` billing writes. Track 3 requires an explicit **P0 PRODUCTION SAFETY / COMPATIBILITY DECISION**. Do not implement Track 3 in this gate.

### Track 2 / Migration 038 — environment-safe sequence (UNAPPLIED)

Do **not** apply 038 until Product Owner Gate 4 for Track 2.

1. Staging first (`wnfahklzaxirftyskctd`) — MANUAL SCOPED SQL of the exact reviewed `038` file  
2. Verify against Preview `6ecc35f`  
3. Claude/PO acceptance if required  
4. Production (`kxcydvhswkuzepwzzinq`) **only** through a **separate** explicit PO approval  

Never `supabase db push` / `migration up` (would apply 034–036 first).

---

## Execution warning (034–036)

Migrations **034, 035, and 036 remain unapplied**.

This repository has no established Supabase CLI migration automation that can skip them.

**MANUAL SCOPED SQL EXECUTION ONLY UNTIL 034–036 ARE RESOLVED.**

Do **not** run `supabase db push`, `supabase migration up`, or any CLI that applies pending files in filename order. Those commands would attempt 034–036 first on whichever project they target (Staging or Production).

---

## Track 1 — `/apply` persistence

- Table: `design_partner_applications`
- Server action: `lib/actions/design-partner.ts` via `createServiceClient()`
- No anon/authenticated INSERT or SELECT policies
- Does not create auth users, businesses, members, subscriptions, offers, Stripe customers, or billing rows
- Persist first; email notification after; a saved row is kept if email fails
- Missing-relation fallback remains in code for environments where 037 is absent; Staging Preview now persists to the table. Do not remove the fallback in this closeout.

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

If a trigger must ever be disabled (**last resort only**, not the preferred path):

Preferred repair keeps the trigger **active** and runs the UPDATE as `postgres` / `supabase_admin`. Normal application assignment uses JWT `service_role`. Do **not** DROP the trigger or function as a shortcut.

    BEGIN;
    ALTER TABLE public.businesses DISABLE TRIGGER businesses_offer_assignment_guard;
    -- run the same UPDATE, then immediately:
    ALTER TABLE public.businesses ENABLE TRIGGER businesses_offer_assignment_guard;

    -- REQUIRED before COMMIT: confirm the trigger is enabled again.
    -- pg_trigger.tgenabled: 'O' = origin/local enabled, 'D' = disabled.
    DO $$
    DECLARE
      enabled char;
    BEGIN
      SELECT t.tgenabled INTO enabled
      FROM pg_trigger t
      WHERE t.tgrelid = 'public.businesses'::regclass
        AND t.tgname = 'businesses_offer_assignment_guard';
      IF enabled IS DISTINCT FROM 'O' THEN
        RAISE EXCEPTION
          'businesses_offer_assignment_guard is not enabled (tgenabled=%); ROLLBACK',
          enabled;
      END IF;
    END $$;

    COMMIT;

Never leave the trigger disabled across sessions. Never DROP the trigger or function. Never add a general bypass API. If the verification block raises, ROLLBACK — do not COMMIT.

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
2. Cursor authored Track 1 + Track 2 on a branch (done).  
3. Claude audited the actual diff; Gate 3 corrections applied (done).  
4. Track 1 / 037: PO manual scoped SQL on Production (schema verified) and Staging (Preview E2E verified) — **closed**.  
5. Track 2 / 038: Staging first → Preview verify → Claude/PO if required → separate Production PO approval — **not started**.  
6–9. Stage 2 seed/backfill remains later; Track 3 remains blocked until the Production compatibility decision.

---

## Private Alpha (neutral)

Current audited behavior (billed `starter` + `private_alpha_enabled`):

- app staff cap 1, app location cap 1, RPC location unlimited  
- SMS true, remove branding true, API/Developer true  

No overlay values are approved. Do not encode `PRIVATE_ALPHA_OVERLAY_ENTITLEMENTS` until PO decides.
