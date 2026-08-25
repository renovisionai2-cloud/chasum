# Track 3 Production Compatibility Patch

**Current status (2026-08-24 restamp):** Application code for this compatibility patch **is on `main`** (`ef69815` — paid-upgrade guard + `subscription_events` inserts via `createServiceClient()`). The original working branch `cursor/production-billing-compatibility-7453` is **merged**. This is **not** World Class nav work and is **not** Track 3 database hardening.

**Still true:**

- Track 3 **DB / RLS hardening is NOT implemented**.
- Migrations **034–036 remain UNAPPLIED**.
- Migrations **037 / 038 remain APPLIED + VERIFIED** on Staging and Production; **executable SQL is missing from repo history**.
- Do **not** apply 034–036 without PO approval.

**Production:** Do **not** infer that current `main` (`be2cf6e` at restamp) is deployed to Production. **PRODUCTION DEPLOYED SHA — VERIFY BEFORE CLAIMING CURRENT.** Last documented Production serving SHA in the identity closeout was `68e9a816a230636e693d0e10b9b8ae7f3beb1e62`. This restamp did not re-verify Production.

**Historical context below** describes why the patch was built (Production `4eecbec` P0s). Treat branch/Preview-only language in that narrative as **historical**, not current handoff.

**Production Supabase:** `kxcydvhswkuzepwzzinq`  
**Preview / Staging Supabase:** `wnfahklzaxirftyskctd`  
**LIVE CONTRACT:** Preview → Staging; Production → Production  

Canonical handoff: [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md).

---

## Why

Production `4eecbec` had two P0 problems:

1. **Paid financial truth** — `MockBillingProvider.changePlan` could create `billing_invoices.status = "paid"` and an `invoice_paid` event with no Stripe payment.
2. **Trusted write boundary** — `subscription_events` and `billing_invoices` inserts used the user-scoped `createClient()` from `lib/billing/subscription-service.ts`. Track 3 will later remove authenticated write privileges from those tables.

---

## Built now

- Paid-upgrade guard: mock provider cannot produce positive-value paid-plan state.
- Trusted server writes: `subscription_events` inserts use `createServiceClient()`.
- Free / zero-dollar starter transitions remain intact.
- Cancel and reactivate behavior is preserved; only the event write client changed.
- No fake paid invoices, fake successful payments, fake Stripe state, or fake `invoice_paid` events.

## Explicitly not in this patch

- Track 3 RLS hardening (historical note: this patch’s “Migration 039” meant planned Track 3 RLS — **not** the later applied `039_business_slug_aliases.sql` identity/alias migration)
- SQL execution; Production or Staging database changes
- Migrations 034, 035, 036 (remain **UNAPPLIED**)
- Migrations 037 / 038 executable SQL (remain **APPLIED + VERIFIED** on Staging and Production; not modified here)
- `plan_offers` seeds, `offer_id` backfill, usage events
- Stripe Billing, public Pricing, Private Alpha entitlements
- Marketing website audit items
- Database Release Automation
- Production deploy

---

## Commercial migration status (preserved)

| Migration | Status |
|-----------|--------|
| 034 | UNAPPLIED |
| 035 | UNAPPLIED |
| 036 | UNAPPLIED |
| 037 | APPLIED + VERIFIED on Staging and Production |
| 038 | APPLIED + VERIFIED on Staging and Production |

Track 3 DB / RLS hardening remains **unimplemented**. The application compatibility patch is already on `main`. Hardening is a separate PO-scheduled item — not waiting on this historical branch. Do not apply 034–036. Do not confuse Track 3 RLS with applied slug-alias migration `039_business_slug_aliases.sql`.

---

## PO Preview verification plan

Use Preview only. Do **not** run destructive tests on Production GVM.

A. Account & Billing loads.  
B. Paid upgrade attempt is safely blocked (Professional / Business).  
C. No fake paid invoice appears after a blocked upgrade.  
D. Cancel / reactivate remains coherent if safe to test on a disposable Staging tenant (not GVM Production).  
E. Chasum HQ remains intact.  
F. GVM-equivalent booking workflow remains intact (assigned staff, services, date/time). Known existing limitation: “Any available staff” still requires a specific employee — not this patch.

---

## Recommended next action

**Superseded as product NEXT.** Follow [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md): World Class pre-challenge, then balanced reusable development. Track 3 RLS/hardening is gated engineering debt, not the default next product task.

Do not apply 034–036. Production deploys still require explicit PO approval. **PRODUCTION DEPLOYED SHA — VERIFY BEFORE CLAIMING CURRENT.**

Historical (do not follow): “deploy this branch to Production after Preview acceptance.” The compatibility patch is already on `main`; later `main` commits (Momentic, docs) are not claimed as Production.
