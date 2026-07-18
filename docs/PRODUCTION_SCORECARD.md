# Chasum Production Scorecard

**Version:** 1.0 · 2026-07-18  
**Method:** CTO judgment from codebase evidence (not vanity UI completeness).  
**Scale:** 0–10 where **7.0 = private-alpha shippable**, **8.5 = closed beta**, **9.5 = open beta / 1.0 candidate**.

Full narrative: [BETA_READINESS_AUDIT.md](./BETA_READINESS_AUDIT.md)

---

## Module scores

| Module | Score | Completion % | Production ready? | One-line rationale |
|--------|------:|-------------:|-------------------|--------------------|
| Marketing Website | 7.2 | 82% | Soft | Strong UI; claim authenticity weak |
| Authentication | 8.8 | 90% | Yes* | Solid session gates; *SMTP must be configured |
| Business | 8.6 | 85% | Yes | Real hub; soft-fallback debt |
| Services | 9.0 | 90% | Yes | Catalog mature |
| Employees | 7.8 | 80% | Soft | HR-lite; no RBAC enforcement |
| CRM | 8.7 | 85% | Yes | Real profiles/timeline; owner-only |
| Booking Engine | 9.2 | 92% | Yes | Core strength |
| Availability Engine | 9.0 | 90% | Yes | RPC-authoritative; needs 026+ |
| Calendar / Day View | 8.7 | 88% | Yes | Front-desk ready; no realtime |
| Booking Sheet | 8.3 | 85% | Soft | Collect payment not wired to Commerce |
| Summer | 7.6 | 75% | Soft | Grounded; not multi-channel |
| Chase | 7.4 | 70% | Soft | Read-only ops; forecasts stub |
| Commerce | 6.2 | 65% | Soft/No | Manual ledger yes; card UX no |
| Communications | 7.3 | 70% | Soft | Queue real; dual-stack + no webhooks |
| Settings | 8.4 | 85% | Yes | Overlaps Business |
| Notifications | 7.5 | 75% | Soft | Center improved; depends on 029 |
| Public Booking | 8.5 | 90% | Yes* | *No rate limit — abuse risk |
| Dashboard | 8.5 | 85% | Yes | Live overview |
| Reports | 7.4 | 75% | Soft | Soft-empty traps |
| AI Workforce (roster) | 3.5 | 35% | No | Placeholders; Summer/Chase separate |

**Weighted ops core average (Booking, Availability, Calendar, CRM, Public Book, Auth): 8.8**  
**Weighted platform average (all modules above): 7.7**

---

## Dimension scores

| Dimension | Score | Notes |
|-----------|------:|-------|
| Architecture | 8.4 | Engines, adapters, provider abstractions are right |
| Engineering | 6.0 | Velocity high; tests/observability low |
| Product | 7.5 | Ops story strong; monetization/AI story ahead of code |
| Design | 8.0 | Coherent DS; dense dashboards on mobile |
| Security | 6.8 | RLS/auth strong; abuse controls & validation weak |
| Performance | 7.2 | Fine at GVM scale; calendar/reports will need work |
| Scalability | 6.5 | Single-owner; service-role; 5-min jobs |
| Maintainability | 6.4 | Soft fallbacks + dual stacks raise cognitive load |
| Accessibility | 7.0 | Intentional in places; not certified |
| Launch Readiness (open beta) | 6.4 | Blocked by tests, rate limits, monetization honesty |
| Launch Readiness (private alpha) | 7.8 | Viable with migration + ops discipline |

---

## Overall production readiness

### **6.9 / 10** — “Strong private alpha; not open SaaS beta”

Interpretation:

- **Below 7.0 open-beta bar** primarily due to engineering maturity and monetization truth.
- **Above private-alpha bar** for a supervised GVM-style deployment.

---

## Score methodology notes

- Deductions for: zero tests, soft production fallbacks, mock billing, incomplete Stripe UX, AI marketing gap, missing rate limits, missing monitoring.
- Credits for: Booking/Availability engines, RLS, grounded Summer, Chase read-only discipline, Communications provider honesty (no fake email in prod), Day View / Booking Sheet quality.

---

## Target scores by milestone

| Milestone | Overall target | Must move |
|-----------|---------------:|-----------|
| Private Alpha exit | ≥ 7.5 | Migrations strict; health green; claims narrowed |
| Closed Beta | ≥ 8.2 | Tests; rate limits; commerce wire-up; Sentry |
| Open Beta | ≥ 8.8 | Billing honesty; webhooks; abuse controls proven |
| Version 1.0 | ≥ 9.3 | RBAC; Elements; WCAG; DR runbooks |

---

## Module readiness map (visual)

```
9.0+  Services · Booking Engine · Availability
8.5+  Auth · CRM · Calendar · Public Book · Dashboard · Business · Settings
7.0+  Employees · Summer · Chase · Communications · Notifications · Reports · Marketing
6.0+  Commerce (manual) · Booking Sheet (payments gap)
<5    AI Workforce roster · SaaS Stripe Billing · Card Elements
```
