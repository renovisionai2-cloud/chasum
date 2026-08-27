# Official Chasum Pricing Page v1 — LOCK

> **SUPERSEDED — 2026-08-27.** This 2026-07-30 Official Pricing Page v1 lock is historical. Current Pricing PO lock: [`PRICING_V1_LOCK.md`](./PRICING_V1_LOCK.md) at SHA `f44fea23e80e14abddd0cf2279b8e199cbc4fb6d`. Do **not** restore this Preview as the current commercial-truth baseline.

| Field | Value |
|-------|--------|
| **STATUS** | Historical / superseded by 2026-08-27 Pricing PO lock |
| **PAGE** | Pricing (`/pricing`) |
| **VERSION** | Official Chasum Pricing Page v1 |
| **STATE** | **Superseded** |
| **Approved** | 2026-07-30 |
| **Approved by** | Product Owner |

---

## Visual source of truth

Treat this Preview URL as the permanent visual reference for Pricing v1:

**https://chasum-aw2cx9wbn-renovisionappcom.vercel.app/pricing**

Implementation baseline commit for that Preview: **`83fbaed`** (*Operation Chasum* — finalized Pricing page with shared plan data).

Any later polish that diverged from this Preview was rolled back so the repository matches the approved baseline.

---

## What is locked

Do **not** redesign or continue polishing:

- Hero section
- Billing toggle placement
- Pricing cards
- Pricing copy
- Plan structure
- Feature lists
- Comparison table
- Workflow section
- Private Alpha section
- FAQ
- CTA section
- Typography
- Colors
- Spacing
- Animations
- Responsive layout

---

## Allowed changes only

Future edits to Pricing are permitted **only** for:

1. Bug fixes  
2. Broken responsive layouts  
3. Accessibility fixes  
4. Product changes **explicitly requested by the product owner**  
5. Pricing or feature updates as Chasum evolves (data in `lib/marketing/pricing.ts` when the product owner directs)

**No additional visual polish** should be performed without an explicit product-owner request.

---

## Implementation map

| Area | Primary files |
|------|----------------|
| Page shell / sections | `components/landing/pricing.tsx` |
| Plan cards | `components/marketing/pricing-plan-cards.tsx` |
| Billing toggle | `components/marketing/pricing-billing-toggle.tsx` |
| Workflow | `components/landing/pricing-workflow.tsx` |
| Shared plan + comparison data | `lib/marketing/pricing.ts` |
| Route metadata | `app/(marketing)/pricing/page.tsx` |
| Concierge knowledge | `lib/website-concierge/knowledge/pricing.ts` |

Agent rule: `.cursor/rules/pricing-page-lock.mdc`

---

## Project status note

The Pricing page is **complete**. This design is the **approved baseline**. Future work should **not** revisit this page unless explicitly requested by the product owner.

Next marketing surface after this lock: **Home page** (`/`), per product-owner direction — see [`HOMEPAGE_MASTER_SPECIFICATION.md`](./HOMEPAGE_MASTER_SPECIFICATION.md).
