# Milestone 6.1 Production Hardening — readiness update

**Date:** 2026-07-18  
**Prior overall:** 6.9 / 10  
**Updated overall:** **8.5 / 10**

## What moved the score

| Blocker (audit) | Status after 6.1 |
|-----------------|------------------|
| Zero automated tests | **Resolved** — Vitest + RTL + MSW + Playwright smoke |
| No rate limiting | **Resolved** — public book, API v1, cron, webhooks, health |
| Soft schema fallbacks | **Resolved** — off by default; `CHASUM_ALLOW_SOFT_SCHEMA=1` opt-in |
| No production monitoring | **Mostly resolved** — Sentry optional + structured logs + richer `/api/health` |
| Zod unused / weak validation | **Resolved** for public API write paths |
| Webhook verification | **Resolved** — Stripe / Resend / Twilio ingress + signature helpers |
| CI quality gates | **Resolved** — scripts + `docs/ci/github-actions-ci.yml` template (copy to `.github/workflows/` with `workflow`-scoped token) |

## Remaining (keeps score under 9.0)

- Stripe Elements / live SaaS billing still incomplete (product honesty)
- AI Workforce roster still mostly scaffold
- Multi-staff RBAC not enforced
- Rate limiter is in-memory (fine for single-instance beta; need Redis for multi-region)
- Portal/ICS token hashing still pending
- Formal WCAG audit not done

## Module score deltas (selected)

| Module | Was | Now |
|--------|----:|----:|
| Engineering (dimension) | 6.0 | 8.2 |
| Security (dimension) | 6.8 | 8.3 |
| Launch readiness (open beta) | 6.4 | 8.0 |
| Launch readiness (private alpha) | 7.8 | 8.7 |
| Public Booking | 8.5 | 8.9 |
| Authentication | 8.8 | 9.0 |
| Commerce | 6.2 | 6.8 |
| Communications | 7.3 | 7.8 |

See also: `docs/PRODUCTION_SCORECARD.md`, `docs/LAUNCH_CHECKLIST.md`.
