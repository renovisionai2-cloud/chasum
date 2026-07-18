# Chasum Beta Readiness Audit

**Version:** 1.0  
**Date:** 2026-07-18  
**Branch audited:** `cursor/phase-3-integrations` (through Milestone 5 / Phase 5.8)  
**Auditor stance:** CTO preparing a SaaS product for paying beta customers  

**Rule used throughout:** A page existing ≠ a production-ready module. Soft schema fallbacks, mock billing, and marketing claims ahead of implementation are treated as incomplete.

---

## Executive verdict

Chasum is a **strong private / GVM-style ops beta** for a single-owner business running reception, calendar, CRM, and public booking.

It is **not yet ready for open SaaS beta** marketed as a full AI Workforce + payments + multi-tenant product.

| Lens | Verdict |
|------|---------|
| Core ops (book / calendar / CRM / public book) | ~85–90% — shippable to friendly operators |
| Platform completeness (Phases 5.0–5.8 as marketed) | ~68–72% |
| Monetization (SaaS billing + card checkout) | ~30–45% |
| Engineering maturity (tests, observability, rate limits) | Weak — launch blockers |

**Overall launch readiness for open beta: 6.4 / 10**  
**Overall launch readiness for private alpha (1–5 businesses): 7.8 / 10**

Companion docs:
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)
- [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)
- [PRODUCTION_SCORECARD.md](./PRODUCTION_SCORECARD.md)

---

## Module audits

### Marketing Website

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **82%** UI; **45%** claim authenticity |
| **Production ready?** | Soft yes for waitlist/landing; no for paid conversion honesty |
| **Known issues** | Testimonials / logo cloud placeholders; comparison “Coming Soon” cells; AI Workforce marketed beyond Summer + Chase |
| **Technical debt** | Large landing surface (~3k LOC) with marketing copy that outruns engineering |
| **Missing** | Live plan checkout; real case studies; Stripe-backed pricing CTAs |
| **Security** | Low risk (public static/marketing) |
| **Performance** | Marketing animations respect `prefers-reduced-motion`; watch image/font weight |
| **Accessibility** | Generally good ARIA on landing; not formally audited |
| **Mobile** | Responsive layouts present |
| **Testing** | None |
| **Future** | Narrow AI claims; wire pricing to honest free/manual beta or real Stripe Billing |

---

### Authentication

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **90%** |
| **Production ready?** | **Yes**, if Supabase Auth SMTP (Resend) is configured |
| **Known issues** | Single-owner model; multi-staff login explicitly deferred |
| **Technical debt** | Dual auth email path (Supabase SMTP vs app Resend) must both be configured |
| **Missing** | Invite/accept staff users; SSO; MFA |
| **Security** | `getUser()` gate in middleware + layouts — solid. Matcher does not cover `/api` (by design for public routes) |
| **Performance** | Fine |
| **Accessibility** | Standard forms; not deeply audited |
| **Mobile** | Auth pages usable |
| **Testing** | None |
| **Future** | Staff invitations end-to-end; MFA for owner |

---

### Business

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **85%** |
| **Production ready?** | **Yes** for owner hub beta |
| **Known issues** | Overlap with `/dashboard/settings`; soft-fallback creates when columns missing |
| **Technical debt** | Large hub (~1k LOC) + soft schema paths |
| **Missing** | True multi-location UX polish; franchise packs |
| **Security** | Owner RLS; secrets not in client |
| **Performance** | Acceptable; hub loads many subsections |
| **Accessibility** | Forms present; inconsistent density |
| **Mobile** | Usable but dense |
| **Testing** | None |
| **Future** | Consolidate Settings vs Business; remove soft fallbacks in prod |

---

### Services

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **90%** |
| **Production ready?** | **Yes** |
| **Known issues** | Soft fallbacks on `staff_services` / optional columns |
| **Technical debt** | Migration-dependent feature flags via try/catch |
| **Missing** | Advanced packages burn-down in portal |
| **Security** | Standard owner scope |
| **Performance** | Directory pagination present |
| **Accessibility** | Search/filter labels present |
| **Mobile** | Manager is dense on small screens |
| **Testing** | None |
| **Future** | Fail-loud when migration lagging |

---

### Employees

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **80%** |
| **Production ready?** | Soft yes (HR-lite); no for payroll/RBAC |
| **Known issues** | Roles catalog not enforced; payroll fields are storage-only |
| **Technical debt** | Legacy `/dashboard/staff` redirect; dual naming |
| **Missing** | Staff login; permission enforcement; live payroll |
| **Security** | Owner-only mutations — fine for alpha; insufficient for multi-staff |
| **Performance** | Directory pagination OK |
| **Accessibility** | Good filter/search ARIA on directory |
| **Mobile** | Profile tabs cramped |
| **Testing** | None |
| **Future** | Enforce `billing:read` / role permissions; staff auth |

---

### CRM

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **85%** |
| **Production ready?** | **Yes** for GVM-style CRM |
| **Known issues** | Soft fallback if migration 027 missing; portal commerce sections scaffold |
| **Technical debt** | Permissions helper is owner-always |
| **Missing** | True multi-user CRM assignment workflows |
| **Security** | PII-heavy; RLS required — present |
| **Performance** | Profile loads many panels; acceptable |
| **Accessibility** | Tabs/forms generally labeled |
| **Mobile** | Profile workable; billing tab dense |
| **Testing** | None |
| **Future** | Harden marketing consent enforcement across all sends |

---

### Booking Engine

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **92%** |
| **Production ready?** | **Yes** (core strength) |
| **Known issues** | Event bridge to Communications is new; public/API paths still dual-call in places |
| **Technical debt** | Domain events + residual direct `handleAppointmentEvent` on public/API inserts |
| **Missing** | Automated conflict regression suite |
| **Security** | Channel adapters; SQL RPCs authoritative — good |
| **Performance** | Relies on RPC; watch N+1 if adapters over-fetch |
| **Accessibility** | N/A (engine) |
| **Mobile** | N/A |
| **Testing** | Manual scripts only (`scripts/verify-*.mjs`) |
| **Future** | Unit tests on mutations + RPC contract tests |

---

### Availability Engine

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **90%** |
| **Production ready?** | **Yes**, if migration **026** applied |
| **Known issues** | Extension hooks (travel/recurring) scaffold |
| **Technical debt** | Soft UI fallbacks can disagree with RPC if DB lagging |
| **Missing** | Travel time, advanced waitlist ranking |
| **Security** | SECURITY DEFINER public slots — must stay locked down |
| **Performance** | Memoized compose path — good design |
| **Accessibility** | N/A |
| **Mobile** | N/A |
| **Testing** | Script audits exist; no automated suite |
| **Future** | Contract tests against `get_available_slots` |

---

### Calendar / Day View

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **88%** |
| **Production ready?** | **Yes** for front-desk beta |
| **Known issues** | Optimistic DnD races; no realtime multi-user sync |
| **Technical debt** | Large calendar + day-view surface area |
| **Missing** | Presence / conflict broadcast across devices |
| **Security** | Dashboard-auth only |
| **Performance** | Day columns can get heavy with many staff |
| **Accessibility** | Keyboard/⌘K present; calendar grid a11y imperfect |
| **Mobile** | Agenda fallback for day view — intentional |
| **Testing** | None |
| **Future** | Virtualize long day columns; live sync |

---

### Booking Sheet

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **85%** |
| **Production ready?** | Soft yes |
| **Known issues** | Collect Payment still toast-defers (“Stripe soon”) despite Commerce module |
| **Technical debt** | Dual payment UX (sheet toast vs Payments dashboard) |
| **Missing** | In-sheet commerce collect wired to `recordCommercePayment` |
| **Security** | Focus trap / Escape — good |
| **Performance** | Fine |
| **Accessibility** | Sheet focus management present |
| **Mobile** | Bottom sheet — good |
| **Testing** | None |
| **Future** | Unify collect → Commerce Platform |

---

### Summer

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **75%** |
| **Production ready?** | Soft yes as grounded receptionist |
| **Known issues** | Not voice/SMS channel; OpenAI optional |
| **Technical debt** | Legacy Emma path still present |
| **Missing** | Channel adapters (SMS/voice); rigorous eval harness |
| **Security / AI** | Mutations via Booking Engine only; slots via Availability — strong grounding story |
| **Hallucination risk** | Medium with OpenAI; low in grounded-only mode |
| **Performance** | Orchestrator sequential tool calls — OK for beta |
| **Accessibility** | Chat UI needs ongoing focus/live-region work |
| **Mobile** | Workspace usable |
| **Testing** | None |
| **Future** | Golden prompt suite; SMS Summer |

---

### Chase

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **70%** |
| **Production ready?** | Soft yes as read-only ops advisor |
| **Known issues** | Forecast stubs (`provider: "none"`); utilization approximations |
| **Technical debt** | Aggregates many engines — latency risk |
| **Missing** | Prediction models; live subscriptions |
| **Security** | Read-only by design — good |
| **Performance** | Large Promise.all snapshot — watch TTFB |
| **Accessibility** | Regions labeled |
| **Mobile** | Dense KPI grids |
| **Testing** | None |
| **Future** | Memoized/cached snapshot; forecasts later |

---

### Commerce

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **65%** |
| **Production ready?** | Manual ledger yes; card checkout **no** |
| **Known issues** | No Stripe Elements; `STRIPE_SECRET_KEY` missing from `.env.example`; booking sheet not wired; SaaS billing still mock |
| **Technical debt** | Soft “schema not ready” UX; dual SaaS vs client commerce tracks |
| **Missing** | Elements UI; webhooks; tax engine depth; portal gift-card redemption |
| **Security / PCI** | Intentional: store provider refs only — good posture |
| **Performance** | Fine at low volume |
| **Accessibility** | Forms OK |
| **Mobile** | Dashboard dense |
| **Testing** | None |
| **Future** | Elements + webhook reconciliation; document Stripe env |

---

### Communications

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **70%** |
| **Production ready?** | Soft yes with Resend/Twilio + cron |
| **Known issues** | Dual path (new `lib/communications` + legacy orchestrator/jobs); no inbound delivery webhooks |
| **Technical debt** | Soft preference column fallbacks |
| **Missing** | Status webhooks; push/WhatsApp; campaign builder |
| **Security** | Secrets via env; audit log present (029) |
| **Performance** | Queue + 5-min cron — fine for beta volume |
| **Accessibility** | Notification Center filters keyboard-usable |
| **Mobile** | Notification Center OK |
| **Testing** | None |
| **Future** | Single send path; Resend/Twilio webhooks |

---

### Settings

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **85%** |
| **Production ready?** | **Yes** |
| **Known issues** | Overlaps Business hub |
| **Missing** | Clear IA between Settings / Business / Billing |
| **Testing** | None |

---

### Notifications

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **75%** |
| **Production ready?** | Soft yes |
| **Known issues** | Archive/priority need migration 029 |
| **Missing** | Push; realtime toasts across devices |
| **Testing** | None |

---

### Public Booking

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **90%** |
| **Production ready?** | **Yes** for beta |
| **Known issues** | No rate limiting on `/book` or RPC surface |
| **Security** | Public SECURITY DEFINER RPCs — critical; no bot throttle |
| **Performance** | Slot queries can be heavy for wide windows |
| **Mobile** | Important path — generally responsive |
| **Testing** | None (high risk) |
| **Future** | Rate limit + CAPTCHA option |

---

### Dashboard (Overview)

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **85%** |
| **Production ready?** | **Yes** |
| **Known issues** | Metrics depend on real data hygiene |
| **Testing** | None |

---

### Reports

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **75%** |
| **Production ready?** | Soft yes |
| **Known issues** | Soft-empty gift/membership/inventory; export/schedule schema-dependent |
| **Missing** | Inventory module; guaranteed export reliability |
| **Testing** | None |

---

### AI Workforce

| Dimension | Assessment |
|-----------|------------|
| **Completion** | **35%** (roster); Summer/Chase higher |
| **Production ready?** | **No** as a “team of AI employees” product |
| **Known issues** | Roster copy admits placeholder intelligence; Alex = slots only; others idle |
| **Missing** | Real Maya/Leo/Sophia implementations |
| **Security** | Low mutation risk today |
| **Future** | Market Summer + Chase only until others ship |

---

## Database audit

| Area | Status | Notes |
|------|--------|-------|
| Schema | Strong | Migrations **001–029** cover ops → commerce → communications |
| Indexes | Strong | Tenant `(business_id, …)` pattern from early hardening |
| Foreign keys | Strong | Cascades generally intentional |
| RLS | Strong | Core strength; public via SECURITY DEFINER RPCs |
| Migrations | Risk | Commerce/comms need **028–029** applied; soft fallbacks hide lag |
| Constraints | Good | Enums / checks on money & status |
| Soft deletes | Absent | Use `is_active` / status — no `deleted_at` |
| Audit logs | Partial | Commerce + communications + appointment change log; not universal |
| Data integrity | Medium | Soft fallbacks can leave UI “working” with empty capabilities |

**Blocker:** Production must fail loud when required migrations missing — not degrade silently.

---

## API audit

| Area | Status |
|------|--------|
| Server actions | Primary mutation path (~35 modules) — consistent `getOrCreateBusiness` |
| Route handlers | v1 REST + cron + OAuth + calendar feed + health |
| Validation | **Weak** — Zod in package.json but unused; ad-hoc parsing |
| Error handling | Thin message strings |
| Authentication | Dashboard session; API hashed keys; cron bearer |
| Authorization | Coarse scopes (`read`/`write`); owner-centric |
| Rate limiting | **None** |
| Typing | Strong TypeScript surface |

---

## Security audit (OWASP-oriented)

| Risk | Severity | Notes |
|------|----------|-------|
| Broken auth | Low–Med | Solid session checks; multi-staff not ready |
| Broken access control | Med | Service-role bypasses RLS widely — correct but high blast radius |
| Injection | Low–Med | Supabase client parameterized; raw JSON into inserts on API |
| XSS | Low–Med | React escapes; rich email HTML templates — sanitize vigilance |
| CSRF | Low | Relies on SameSite cookies for server actions |
| Secrets exposure | Low | Env-centered; health returns booleans |
| Logging sensitive data | Low | No password logs found; console SMS in dev |
| Rate limit / abuse | **High** | Public booking + API unprotected |
| PCI | Med | Good design; incomplete Elements + webhook story |
| Portal/ICS tokens | Med | Stored/compared as secrets — not hashed like API keys |

---

## Performance audit

| Area | Status |
|------|--------|
| Bundle / splitting | Next App Router helps; large calendar/CRM clients |
| Caching | Availability compose memoized; little HTTP caching strategy |
| N+1 | Possible in reports/CRM aggregations |
| Images/fonts | Brand assets; watch landing weight |
| Virtualization | Not evident on long lists/calendars |
| Jobs | 5-minute cron — OK for beta, not realtime |

---

## Accessibility audit

| Area | Status |
|------|--------|
| Keyboard / ⌘K | Present and intentional |
| Focus management | Sheets/dialogs addressed in Phase 5.3 |
| Screen readers | Partial — labels exist; no formal audit |
| Contrast | Design system oriented; not WCAG-certified |
| ARIA | Used in many newer components |
| Reduced motion | Landing + globals respect `prefers-reduced-motion` |
| Mobile a11y | Touch targets mixed on dense dashboards |

---

## Mobile audit

| Surface | Status |
|---------|--------|
| Shell / sidebar | Drawer pattern |
| Calendar | Agenda fallback on mobile |
| Booking Sheet | Bottom sheet — good |
| CRM / Payments / Chase | Dense — usable but not polished |
| Summer | Chat layout OK |
| Native app | Not started |

---

## AI audit

| Topic | Assessment |
|-------|------------|
| Summer grounding | Strong architecture (Booking + Availability + CRM read) |
| Chase grounding | Aggregates real engines; does not invent forecasts |
| Hallucination | Residual risk with OpenAI path |
| Permissions | Summer mutates only via adapters; Chase never mutates |
| Escalation | Present in Summer intents |
| Expansion | Roster overclaims — product risk |

---

## Commerce deep dive

| Topic | Status |
|-------|--------|
| Manual payments / ledger | Implemented |
| Invoices / receipts / refunds | Implemented (schema-dependent) |
| Stripe PaymentIntents | Server-side only |
| Stripe Elements / Checkout UI | Missing |
| SaaS subscription billing | Mock |
| Taxes / deposits | Fields + heuristics; not full tax engine |
| Webhooks | Missing |

---

## Communications deep dive

| Topic | Status |
|-------|--------|
| Email (Resend) | Production-honest (fails without key) |
| SMS (Twilio) | Optional skip |
| Templates | Expanded in Milestone 5 |
| Queue / retry / backoff | Present |
| Provider failure handling | Job retry until max attempts |
| Inbound webhooks | Missing |
| CRM timeline | Mirrored on send path |

---

## Integrations

| Integration | Readiness |
|-------------|-----------|
| Google Calendar | Soft — OAuth + sync jobs |
| Outlook | Soft — same |
| Apple / ICS feed | Feed yes; not full CalDAV |
| Stripe | Incomplete |
| Twilio / Resend | Soft |
| Zapier | Thin |
| Maps | Limited / not core |

---

## Testing

| Type | Status |
|------|--------|
| Unit | **0** |
| Integration | **0** |
| E2E | **0** |
| Scripts | Manual verify/audit scripts only |
| Coverage | Effectively **0%** of critical paths |

**This is a launch blocker for open beta.**

---

## DevOps

| Area | Status |
|------|--------|
| Vercel | Assumed; cron configured |
| Supabase | Migrations in repo; no `config.toml` |
| Env | Good `.env.example` except Stripe |
| Monitoring | No Sentry/OTel |
| Logging | `console.*` scoped tags |
| Analytics | Product analytics not clearly productized |
| Backups / recovery | Rely on Supabase — undocumented runbook in-app |

---

## Recommended path to market

1. **Private Alpha (now–2 weeks)** — 1–3 friendly businesses; migrations through 029; Resend + cron green; narrow marketing claims.
2. **Closed Beta (4–8 weeks)** — automated tests on booking/availability/auth; rate limits; wire Booking Sheet → Commerce; Stripe Elements or remove card claims; Sentry.
3. **Open Beta (8–14 weeks)** — SaaS billing honesty or live Stripe Billing; staff invites; inbound email/SMS webhooks; AI marketing = Summer + Chase only.
4. **Version 1.0** — multi-staff RBAC; realtime calendar; forecasts optional; WCAG pass on core flows; documented DR.

---

## Honesty statement

Chasum has built an impressive vertical ops platform in a short sequence of milestones. The engineering instincts (engines, grounding, RLS, cents, provider abstractions) are right.

What is missing is **production discipline**: tests, abuse controls, migration strictness, monetization truthfulness, and AI marketing honesty. Those gaps—not missing pages—are what separate a heroic demo from a product customers can depend on with their livelihood.
