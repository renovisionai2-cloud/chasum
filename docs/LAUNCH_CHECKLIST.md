# Chasum Launch Checklist

**Version:** 1.0 · 2026-07-18  
**Source:** [BETA_READINESS_AUDIT.md](./BETA_READINESS_AUDIT.md)

Prioritized by risk to paying customers and platform reputation.  
Do not treat UI completeness as completion.

---

## Launch blockers

Must resolve before **open beta** or any paid public acquisition.

| ID | Item | Why it blocks |
|----|------|----------------|
| B1 | **Zero automated tests** on booking, availability RPCs, auth middleware, public book | Regressions will ship unnoticed; scheduling is the product |
| B2 | **No rate limiting** on public booking / API / auth-adjacent surfaces | Abuse, slot scraping, cost amplification |
| B3 | **Soft schema fallbacks in production** silently disable features | Operators think Commerce/Comms “work” while empty |
| B4 | **Marketing overclaims** (full AI Workforce, card payments, SaaS plans) vs reality | Trust destruction; refund/chargeback risk |
| B5 | **Stripe checkout incomplete** while product mentions card/Stripe | Book Sheet still toasts “Stripe soon”; no Elements |
| B6 | **SaaS billing is mock** while Pricing page sells plans | Cannot collect subscription revenue honestly |
| B7 | **Migrations 028–029** not guaranteed applied on all envs | Commerce + Communications soft-fail |
| B8 | **No production error monitoring** (Sentry/OTel) | Cannot operate a beta blind |

---

## High priority

Before **closed beta** expansion beyond a handful of friendly operators.

| ID | Item | Notes |
|----|------|-------|
| H1 | Wire Booking Sheet “Collect” → Commerce `recordCommercePayment` | End the dual UX |
| H2 | Document + require `STRIPE_SECRET_KEY` in `.env.example` / `lib/env.ts` | Or remove card claims |
| H3 | Add Zod (or equivalent) validation on API v1 + critical server actions | Package already present, unused |
| H4 | Hash or rotate portal / ICS secrets like API keys | Plaintext token risk |
| H5 | Single Communications send path (retire dual orchestrator drift) | Avoid divergent emails |
| H6 | Inbound Resend/Twilio delivery webhooks | Accurate “delivered/failed” |
| H7 | Narrow AI Workforce marketing to Summer + Chase | Roster is mostly scaffold |
| H8 | Production fail-loud mode when required tables missing | Replace silent empty states |
| H9 | Public booking abuse controls (rate limit + optional CAPTCHA) | Complements B2 |
| H10 | Cron secret required on all non-local environments | Preview deploys currently soft |

---

## Medium priority

Improve reliability and conversion during closed → open beta.

| ID | Item |
|----|------|
| M1 | Staff invitation + multi-user login (even single role) |
| M2 | Enforce employee role permissions (today owner-always) |
| M3 | Stripe Elements or Checkout Session for deposits |
| M4 | Stripe webhook reconciliation for PaymentIntents/refunds |
| M5 | Calendar realtime / multi-device conflict awareness |
| M6 | Chase snapshot caching (TTFB) |
| M7 | Formal a11y pass on Reception + Booking Sheet + Public Book |
| M8 | Consolidate Settings vs Business IA |
| M9 | Report export reliability + remove soft-empty traps |
| M10 | Backup/restore runbook documented for operators |

---

## Nice to have

Post-open-beta / toward 1.0.

| ID | Item |
|----|------|
| N1 | Maya / Leo / Sophia / Alex beyond stubs |
| N2 | Chase forecasting providers |
| N3 | Native mobile app |
| N4 | Push / WhatsApp channels |
| N5 | Soft deletes / recycle bin |
| N6 | Global audit trail |
| N7 | SSO / MFA |
| N8 | Franchise / multi-org |
| N9 | Inventory module (reports placeholder) |
| N10 | Marketing campaign builder UI |

---

## Pre-flight gates by stage

### Private Alpha (1–3 businesses)

- [ ] Migrations through **029** applied and verified
- [ ] `/api/health` green (Supabase, Resend, Cron)
- [ ] Smoke: book → confirm email → CRM timeline → Day View DnD
- [ ] Marketing copy adjusted for private alpha (no paid plan illusion)
- [ ] Owner contact for incident response defined

### Closed Beta (invite-only)

- [ ] All **Launch Blockers** addressed or explicitly waived in writing
- [ ] High priority H1–H8 done or scheduled with owners
- [ ] Support channel + status page lite
- [ ] Data export path for churned beta users

### Open Beta

- [ ] Rate limits live
- [ ] Monitoring + alerting live
- [ ] Monetization path honest (free beta **or** live Stripe Billing)
- [ ] Public booking load-tested at expected peak
- [ ] Privacy policy / ToS / DPA drafted

### Version 1.0

- [ ] Multi-staff RBAC
- [ ] Card deposits with Elements + webhooks
- [ ] WCAG AA on core journeys
- [ ] Documented RPO/RTO with Supabase
- [ ] Contract tests for Availability + Booking engines

---

## Explicit non-goals for next 30 days

Do **not** prioritize:

- New AI employee personas
- Forecast models
- Native apps
- Broadsheet redesigns
- Expanding marketing claims

Prioritize **truth, tests, and abuse resistance**.
