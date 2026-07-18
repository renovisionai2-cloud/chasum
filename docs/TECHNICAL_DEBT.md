# Chasum Technical Debt Register

**Version:** 1.0 · 2026-07-18  
**Companion:** [BETA_READINESS_AUDIT.md](./BETA_READINESS_AUDIT.md)

Debt is listed by **severity × interest rate** (how fast it compounds).  
No fixes in this document — tracking only.

---

## Critical (pays interest daily)

| ID | Debt | Location / evidence | Interest |
|----|------|---------------------|----------|
| TD-C1 | **No automated test suite** | `package.json` has no `test`; 0 `*.test.*` / `*.spec.*` | Every change risks booking regressions |
| TD-C2 | **Soft schema fallbacks** | `lib/supabase/errors.ts`, CRM/commerce/comms/reports actions | Hides undeployed migrations in “prod-looking” UI |
| TD-C3 | **Zod unused** | Dependency present; zero imports | Invalid API/action payloads accepted |
| TD-C4 | **No rate limiting** | Public book + `/api/v1/*` | Abuse cost + availability scraping |
| TD-C5 | **Dual communications stacks** | `lib/communications/*` vs `lib/integrations/notifications/orchestrator.ts` + jobs | Divergent templates/behavior |
| TD-C6 | **Mock SaaS billing** | `MockBillingProvider` in `lib/billing/` | Pricing page lies by omission |

---

## High

| ID | Debt | Notes |
|----|------|-------|
| TD-H1 | Booking Sheet collect payment stub | Toast to CRM/Stripe-later while Commerce exists |
| TD-H2 | Stripe env not in `.env.example` / `lib/env.ts` | Ops miss; Elements UI missing |
| TD-H3 | Public/API appointment creates still call orchestrator directly | Partial overlap with Booking Engine event bridge |
| TD-H4 | Service-role client used broadly | Correct for jobs; high blast radius without audits |
| TD-H5 | Portal / ICS tokens not hashed | Unlike API keys |
| TD-H6 | Employee roles not enforced | Catalog exists; owner-always permissions |
| TD-H7 | No Sentry/OTel | Blind production |
| TD-H8 | Middleware deprecation | `middleware.ts` vs Next “proxy” convention warning |

---

## Medium

| ID | Debt | Notes |
|----|------|-------|
| TD-M1 | Settings vs Business hub IA duplication | Two homes for overlapping config |
| TD-M2 | Chase utilization approximations | Booked minutes / rough capacity |
| TD-M3 | Forecast stubs still in product surface | Honest but unfinished |
| TD-M4 | AI Workforce roster placeholders | Marketing debt |
| TD-M5 | Reports soft-empty gift/membership/inventory | Looks like “zero” not “unavailable” |
| TD-M6 | No soft-delete / recycle bin | Hard deletes / status only |
| TD-M7 | Calendar not virtualized | Scale risk with many staff/day |
| TD-M8 | No inbound email/SMS webhooks | Delivery status incomplete |
| TD-M9 | Legacy Emma + Summer dual reception paths | Redirects help; code still dual |
| TD-M10 | No `supabase/config.toml` in repo | Local/CLI drift |

---

## Low

| ID | Debt | Notes |
|----|------|-------|
| TD-L1 | Untracked brand rebuild scripts in working tree | Noise; not product |
| TD-L2 | Landing placeholder social proof | Trust optics |
| TD-L3 | Owner platform vs tenant product surface complexity | Fine for now |
| TD-L4 | Apple CalDAV not implemented (ICS only) | Documented gap |
| TD-L5 | Push / WhatsApp channel stubs | Intentional |

---

## Architectural tensions (not bugs, but choices that cost)

1. **Engines vs actions** — Booking/Availability engines are the right abstraction; residual direct inserts (public book RPC path, API v1) bypass some of the facade.
2. **Soft-fail culture** — Accelerated Milestone delivery; toxic past private alpha.
3. **Two money systems** — SaaS `billing_*` vs client `commerce_*`; both needed eventually, but naming/UX confuse.
4. **AI product vs AI scaffolding** — Summer/Chase are real; “Workforce” is a roadmap dressed as a feature.

---

## Suggested paydown order (for planning only)

1. TD-C1 tests (booking + availability + auth smoke)
2. TD-C4 rate limits
3. TD-C2 fail-loud production flag
4. TD-C5 unify communications
5. TD-H1 + TD-H2 commerce honesty
6. TD-C6 billing honesty (mock → free beta banner or Stripe Billing)

---

## Metrics to track debt burn

| Metric | Target for Closed Beta |
|--------|------------------------|
| Critical-path automated tests | ≥ 25 covering book/cancel/slot/auth |
| Soft-fallback hits in prod logs | 0 |
| Public book 429/rate-limit coverage | Enabled |
| Open P1 incidents without Sentry | 0 blind |
| Marketing claims with “scaffold” backend | 0 |
