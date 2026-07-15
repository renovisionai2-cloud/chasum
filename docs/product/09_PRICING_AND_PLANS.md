# Pricing and Plans

## Status

**Marketing copy** lives in `lib/marketing/pricing.ts` (landing, `/pricing`, signup, upgrade prompts).  
Stripe Checkout is still planned — plan selection currently stores preference on the business record.

## Messaging

**Headline:** Simple pricing that grows with your business.  
**Subhead:** Start free. Upgrade only when you're ready. No hidden fees. No appointment commissions.

| Plan | Tagline | CTA |
|------|---------|-----|
| **Free** (`starter`) | Start your journey. | Start Free |
| **Professional** ⭐ Most Popular | Grow your business. | Start Professional |
| **Business** | Scale with confidence. | Start Business |
| **Enterprise** | Built for large organizations. | Contact Sales |

**Free plan limit upgrade prompt:**  
“Congratulations! Your business has grown to the point where Professional will save you even more time.” → **Upgrade to Professional**

## Proposed list prices (UI)

| Plan | Price | Target | Limits |
|------|-------|--------|--------|
| **Free** | $0 | Getting started | 1 location |
| **Professional** | $79/mo | Small studio (GVM) | Up to 3 locations |
| **Business** | $149/mo | Growing teams | Up to 10 locations |
| **Enterprise** | Custom | Large orgs | Unlimited locations |

## Feature gating (draft)

| Feature | Free | Pro | Business | Enterprise |
|---------|------|-----|----------|------------|
| Public booking | ✅ | ✅ | ✅ | ✅ |
| Calendar sync | — | ✅ | ✅ | ✅ |
| SMS reminders | — | ✅ | ✅ | ✅ |
| REST API | — | — | ✅ | ✅ |
| Custom domain | — | — | ✅ | ✅ |
| AI assistant | — | ✅ | ✅ | ✅ |
| Multi-location | — | ✅ | ✅ | ✅ |

## GVM Baby World

Design partner — **Professional tier at no cost** during dogfood period. Validates feature set before public pricing.

## Billing implementation (future)

- Stripe Checkout + Customer Portal
- `businesses.stripe_customer_id`, `subscription_status`, `plan_id`
- Webhook: `invoice.paid`, `customer.subscription.updated`
- Grace period on failed payment (read-only mode, booking disabled)

## Competitive reference

| Competitor | Entry price |
|------------|-------------|
| Calendly | Free–$12/seat/mo |
| Picktime | ~$30–50/mo |
| Square Appointments | Free + processing fees |

Chasum premium justified by multi-staff scheduling engine + integrations + AI roadmap.
