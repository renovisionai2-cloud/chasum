# Track 3 Production Compatibility Patch

**Status:** BUILT ON PRODUCTION-DERIVED BRANCH · PREVIEW/STAGING ONLY · NOT YET PRODUCTION APPROVED · TRACK 3 DB HARDENING STILL NOT IMPLEMENTED  
**Branch:** `cursor/production-billing-compatibility-7453`  
**Production baseline:** `4eecbec0f0f04532ae0294132d07183b6e64f23f` · https://chasum.vercel.app  
**Production Supabase:** `kxcydvhswkuzepwzzinq`  
**Preview / Staging Supabase:** `wnfahklzaxirftyskctd`  
**LIVE CONTRACT:** Preview → Staging; Production → Production  

This patch is **not** World Class branch work and is **not** Track 3 database hardening.

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

- Track 3 RLS hardening / Migration 039
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

Track 3 DB hardening remains **blocked** until this compatibility patch is verified on Preview/Staging and then approved for Production application code.

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

Product Owner verifies Preview against Staging `wnfahklzaxirftyskctd`. After Preview acceptance, a **separate** Production application cutover decision is required before Track 3 RLS / Migration 039. Do not apply 034–036. Do not deploy this branch to Production until explicitly approved.
