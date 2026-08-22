# Chasum Commercial Strategy — Pricing & Packaging

**Status:** Active World Class roadmap track (architecture assessment)  
**Pass:** Pricing + Subscription Architecture Gap Assessment  
**Authority:** Product Owner  
**Companion track:** Commercial SaaS Readiness (self-serve lifecycle, `/apply` persistence, Stripe Billing)  
**Public Pricing page:** **Locked v1** — [`docs/marketing/PRICING_PAGE_V1_LOCK.md`](./marketing/PRICING_PAGE_V1_LOCK.md). This track does **not** change `/pricing`.  
**Production:** Do not touch. No SQL. No Stripe product/price changes. No tenant plan assignment changes.

---

## What this track is

Chasum is an **AI Business Operating System for service businesses**, not a low-cost appointment scheduler.

Commercial architecture must eventually support the operating product (booking, reception, CRM, employees, locations, catalog, payments, communications, reporting, automation, configuration, permissions, integrations, Summer, future AI Workforce) **without confusing**:

| Layer | Meaning |
|-------|---------|
| **Product availability** | What is actually operational today (Available Today / Coming Soon / Preview) |
| **Plan entitlement** | What a plan is *allowed* to include when the capability exists |
| **Commercial price** | What Chasum charges for that plan / interval / version |

Memberships may be entitled on Professional while remaining Preview / Coming Soon. Inventory may be entitled on Business while remaining Coming Soon. Marketing must keep stating operational status.

---

## Development pricing hypotheses (NOT public locks)

These are **working development hypotheses**. Architecture should be able to represent them. They are **not** permanently locked public prices.

| Plan | Monthly hypothesis | Annual hypothesis | Customer framing |
|------|--------------------|-------------------|------------------|
| Free | $0 CAD | — | — |
| Professional | **$59 CAD/month** | **$590 CAD/year** | Save 2 months with annual billing (~10 months paid / 12 months service) |
| Business | **$149 CAD/month** | **$1,490 CAD/year** | Same annual framing |
| Enterprise | Custom | Custom | Sales-led |

Final public price lock requires: competitive analysis, **cost-to-serve**, pilot feedback, commercial validation, and Product Owner approval.

**Public Pricing v1 today remains `$79` / `$149` monthly-equivalent yearly (`$63` / `$119`) with unlabeled SaaS currency.** Do not ship `$59 CAD` to `/pricing` from this track.

---

## Entitlement baseline to preserve (locked unless PO changes)

| Plan | `plan_key` | Active staff | Locations |
|------|------------|--------------|-----------|
| Free | `starter` | 1 | 1 |
| Professional | `professional` | 3 | 3 |
| Business | `business` | Unlimited | 6 (app); live DB seed still 10 — **deferred** |
| Enterprise | `enterprise` | Unlimited | Unlimited / custom |

Staff limits count **active** staff only. Do not convert Chasum into aggressive per-seat SaaS. Additional locations are **monetizable later**; working research range **$25–$40 CAD/month/location is not locked** — do not implement the amount.

---

## Current foundation (evidence)

What exists and is reusable:

- Plan identity: `starter` / `professional` / `business` / `enterprise` (`lib/billing/types.ts`)
- Catalog table `subscription_plans` (008 + 014/015): name, `max_locations`, `monthly_price_cents`, `yearly_price_cents`
- Tenant subscription fields on `businesses`: plan key, status, interval, trial, period, cancel flags, Stripe customer/subscription ids
- `subscription_events` + `billing_invoices`
- Provider interface `BillingProvider` with **mock only** (`getBillingProvider()` never swaps to Stripe)
- Paid self-serve correctly **refused** without Stripe (`lib/billing/paid-upgrade-guard.ts`)
- Numeric entitlements in code: `PLAN_STAFF_LIMITS`, `PLAN_LOCATION_LIMITS`
- Boolean-ish gates: SMS, remove-branding, partial API nav (`lib/billing/plan-features.ts`)
- Private Alpha flag `private_alpha_enabled` elevates **features** toward Professional without changing billed plan key
- Tenant Stripe = **commerce PaymentIntents**, not SaaS Billing (`app/api/webhooks/stripe/route.ts`)

What does **not** exist:

- Plan version / commercial offer identity
- Purchased-price snapshot on the subscription
- CAD as SaaS currency (invoices/events default `usd`)
- Stripe Price IDs / Checkout / Customer Portal / SaaS webhooks
- Quantitative allowances (SMS, Summer, voice, storage) or usage ledger
- Add-on SKUs (extra locations, AI, telephony)
- Formal trial start workflow (columns exist; no productized trial conversion)
- `/apply` persistence (email/log only)
- Grandfathering of **prices** (staff over-limit grandfathering exists; commercial terms do not)

---

## Target commercial domain model (simplest correct)

Evolve toward — do not implement in this pass:

```
PLAN (identity: starter | professional | business | enterprise)
  → PLAN OFFER / VERSION (commercial SKU: currency, interval prices, Stripe price ids, entitlement snapshot)
    → PRICE (monthly_cents, annual_cents, currency)
    → BILLING INTERVAL (monthly | yearly)
    → SUBSCRIPTION (tenant bind: offer_id, status, period, Stripe ids, purchased terms)
      → ENTITLEMENTS (boolean)
      → ALLOWANCES (quantitative included)
      → USAGE (metered, internal)
      → TENANT (business)
```

**Keep** `plan_key` on the business for fast reads.  
**Add later** `plan_offer_id` (or equivalent) so a subscription preserves the commercial terms actually purchased.

Do **not** mutate `subscription_plans.monthly_price_cents` in place as the only price history. New customers get the current default offer; existing customers stay on their offer until they change plan.

Marketing copy is **not** the database. Product availability lives in Product Truth. Entitlements live in a versioned offer + code guards. Price lives on the offer + Stripe.

---

## Annual billing (hypothesis vs today)

| Source | Professional annual | Business annual |
|--------|---------------------|-----------------|
| **Hypothesis** | $590 CAD (10× monthly) | $1,490 CAD (10× monthly) |
| Marketing `/pricing` | `$63`/mo equivalent (~20% off $79 → ~$756/year) | `$119`/mo equivalent (~$1,428/year) |
| Billing fallback catalog | `yearlyPriceCents: 79000` ($790) | `yearlyPriceCents: 149000` ($1,490) |

Three different annual models already exist. Before self-serve, lock **one**: 10 months for 12, 20% monthly-equivalent, or Stripe-native annual price. Customer framing: “Save 2 months with annual billing.”

---

## Summer / communications economics (design-for-now)

Bundle Summer into plans (not a separate chatbot SKU):

| Plan | Working Summer posture |
|------|------------------------|
| Free | Limited Summer |
| Professional | Meaningful Summer |
| Business | Advanced / proactive Summer |
| Enterprise | Advanced usage, governance, custom limits |

Internally measure later: model/token usage, AI actions, voice minutes, SMS, document processing. Customers should **not** see token pricing unless economics require it.

**Now:** no usage ledger. Do not build a metering platform.  
**Later:** append-only `usage_events` (business_id, meter, quantity, cost_basis, occurred_at) plus plan-offer allowances. Feature entitlement ≠ included allowance ≠ metered usage ≠ overage/add-on.

SMS today is a **boolean plan gate** (Free no / Pro+ yes), not an allowance.

---

## Additional locations (architecture only)

Keep location as a first-class tenant object (already true). Later:

- Offer includes `location_included`
- Extra locations are a **quantity add-on** on the subscription, not a new tenancy model
- Price amount **not locked** ($25–$40 CAD/month is research only)

Application cap (1/3/6/unlimited) stays. DB Business `max_locations = 10` remains untouched until a separate PO-approved migration.

---

## Cost-to-serve (required before public price lock)

Formal study still required. Do **not** fabricate numbers. Cover at least:

- AI / model cost per tenant
- SMS
- Email
- Voice / telephony
- Supabase / database
- Vercel / infrastructure
- Storage
- Support
- Stripe / platform fees
- Onboarding
- Gross margin

Until that study exists, `$59` / `$149` / `$590` / `$1,490` remain hypotheses.

---

## Commercial SaaS lifecycle (current)

| Stage | Classification |
|-------|----------------|
| Discover | DONE (marketing) |
| Pricing | PARTIAL (locked v1 public page; hypotheses not published) |
| Choose plan | PRIVATE ALPHA MANUAL (CTA = Apply) |
| Signup | PARTIAL (auth exists; not plan checkout) |
| Verify | PARTIAL (email auth) |
| Trial / subscription | NOT STARTED as a productized path (columns exist) |
| Billing | PARTIAL (UI + mock provider; paid upgrades blocked) |
| Entitlement activation | PARTIAL (staff/location/SMS/branding; most features ungated) |
| Tenant provisioning | PARTIAL (onboarding gate; no billed provisioning) |
| Business onboarding | PARTIAL (`/onboarding/business`) |
| Summer-assisted setup | PARTIAL (Meet Summer marketing; in-app Early Access) |
| Operational workspace | DONE for core ops (World Class Preview) |
| `/apply` persistence | NOT STARTED (email/log only) |
| Stripe SaaS | NOT STARTED (commerce Stripe only) |

---

## Platform Admin (requirements only — do not implement)

Future Control Centre must see/manage: tenant, plan, plan version/offer, interval, subscription, status, trial, renewal, usage, entitlements, overrides, failed payment, account health, cancellation, grandfathering.

Today `/owner` lists businesses, plan keys, trials, soft MRR from catalog prices, and invoices. `/dashboard/hq` is founder Platform Admin with **seeded** Private Alpha data (disclosed). Neither is a commercial system of record.

---

## Implementation sequence (after PO approval)

Do **not** start self-serve billing from this document alone.

1. **Docs / SoT** — this file (done). Public Pricing unchanged.
2. **PO decisions** — CAD vs unlabeled `$`; $59 vs $79 Professional; annual 10× vs 20% equivalent; extra-location later.
3. **Commercial offer model** (schema + code, Preview only, PO-approved SQL window) — versioned offer, purchased snapshot, CAD-capable currency. No live price rewrite on Production.
4. **Cost-to-serve study** — before public lock.
5. **`/apply` persistence** — Commercial SaaS Readiness; founder approval unchanged.
6. **Stripe Billing provider** — Checkout + Customer Portal + SaaS webhooks; keep commerce Stripe separate.
7. **Align public Pricing** — only after PO lock; then update marketing, catalog, tests together.
8. **Allowances / add-ons / extra locations** — after core subscription is real.
9. **Metering** — only when cost-to-serve shows a genuine driver.

---

## Explicit non-goals of this pass

- Change public Pricing
- Change Production
- Change Stripe products/prices
- Run SQL / apply migrations
- Change tenant plan assignments
- Alter GVM or Chasum HQ
- Open public paid signup
- Implement self-service billing
- Per-seat staff pricing
- Token-priced Summer SKU
- Giant metering platform

---

## Related

- [`docs/WORLD_CLASS_PLAN_ENTITLEMENT_MATRIX.md`](./WORLD_CLASS_PLAN_ENTITLEMENT_MATRIX.md)
- [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md)
- [`docs/marketing/PRICING_PAGE_V1_LOCK.md`](./marketing/PRICING_PAGE_V1_LOCK.md)
- [`lib/billing/plan-entitlements.ts`](../lib/billing/plan-entitlements.ts)
- [`lib/billing/catalog.ts`](../lib/billing/catalog.ts)
- [`lib/billing/paid-upgrade-guard.ts`](../lib/billing/paid-upgrade-guard.ts)
- [`lib/marketing/pricing.ts`](../lib/marketing/pricing.ts)
