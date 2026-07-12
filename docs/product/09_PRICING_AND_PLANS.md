# Pricing and Plans

## Status

**UI only** on landing page. Stripe integration planned Phase 5.

## Proposed tiers

| Plan | Price | Target | Limits |
|------|-------|--------|--------|
| **Starter** | $29/mo | Solo operator | 1 staff, 500 appts/mo |
| **Professional** | $79/mo | Small studio (GVM) | 5 staff, unlimited appts |
| **Business** | $149/mo | Multi-staff teams | 15 staff, API, webhooks |
| **Enterprise** | Custom | Franchises | Multi-location, SLA, SSO |

## Feature gating (draft)

| Feature | Starter | Pro | Business | Enterprise |
|---------|---------|-----|----------|------------|
| Public booking | ✅ | ✅ | ✅ | ✅ |
| Calendar sync | — | ✅ | ✅ | ✅ |
| SMS reminders | — | ✅ | ✅ | ✅ |
| REST API | — | — | ✅ | ✅ |
| Custom domain | — | — | ✅ | ✅ |
| AI assistant | — | Add-on | ✅ | ✅ |
| Multi-location | — | — | — | ✅ |

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
