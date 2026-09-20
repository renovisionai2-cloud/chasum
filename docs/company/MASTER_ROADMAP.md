# Master Roadmap

**Status:** Official company roadmap  
**Parent:** [`CHASUM_BIBLE.md`](./CHASUM_BIBLE.md)  
**Active backlog:** [`MASTER_TASKS.md`](./MASTER_TASKS.md)  
**Handoff / current NEXT:** [`../CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md) — that control board is current. Themes below are durable; the locked order below governs future work; GVM must not become the roadmap.

**Detailed history:** [`../ROADMAP.md`](../ROADMAP.md), [`../CHANGELOG.md`](../CHANGELOG.md)

This is the durable map of what Chasum has completed and what comes next. Update this file when a major department or platform milestone ships or is re-sequenced.

---

## Completed

| Milestone | Notes |
|-----------|--------|
| **Authentication** | Supabase auth, callbacks, protected dashboard routes, password reset |
| **Owner Platform** | `/owner` — platform ops, businesses, trials, revenue, health, security |
| **Billing** | Plans (Free → Enterprise), customer billing UI, provider interface, invoices/events |
| **Communication Center** | Call / SMS / Email tooling, timeline, notes, follow-ups, pluggable providers |
| **Employee Management** | Directory, profiles, departments, schedules, payroll fields, documents, activity |
| **CRM** | Customer hub, profiles, timeline, notes, payments events, insights hooks |
| **Calendar & Booking Engine** | Reception calendar, slots engine, public booking, waitlist, portal, commercial fields |
| **Business Management** | Profile, locations, catalog commerce scaffolds, taxes, forms, automation rules |
| **Reports & Analytics** | Executive KPIs, revenue/ops/financial reports, export, schedules, BI snapshot |
| **AI Receptionist Phase 1** | Emma — grounded knowledge, real slots, booking handoff, escalation, CRM logging |

Also foundational (earlier phases): design system, multi-tenant schema + RLS, services/staff/clients, integrations (Google/Outlook/Apple calendars), notifications, automation jobs, developer API surface.

| Milestone | Notes |
|-----------|--------|
| **OS Kernel (Foundation Sprint)** | Shared revenue recognition, commerce + platform event buses, business operating context, locale/datetime helpers, responsive DS polish — see `COMPANY_MEMORY.md` + `docs/product/22_OS_KERNEL.md` |
| **World Class Phase 1 — Navigation Foundation** | Grouped tenant nav + mobile nav on `main` (PR #23). Old World Class branch is reference-only. |
| **World Class Phase 2 — Staff Plan Honesty** | Active-staff plan limits on `main` (PR #25). |
| **World Class Phase 3 — Command Centre V1** | `/dashboard` Command Centre on `main` (PR #27). |
| **World Class Phase 4A — Commercial SaaS Lifecycle Honesty** | Private Alpha billing honesty / Gate A on `main` (PR #29). Commercial SaaS Lifecycle remains **PARTIAL**. Gate B not met. |
| **World Class Phase 5 — Production Pin and Design-Partner Pilot Stabilization** | **COMPLETE.** GVM genuine Production booking + dual-email acceptance and HQ connected-chain evidence accepted (Issues #47 / #54). Reception stability, communications/location hardening and governed release controls also accepted through #58/#59, #62/#63 and #53. |

---

## Future

### Locked execution order — 2026-09-20

1. Outside Private Alpha readiness — **current**.
2. Commercial SaaS Gate B.
3. Summer Business Manager horizontal v1.
4. Native material implementation after the Native App Start Gate and before broader public launch.

Phase 5 is complete. GVM + Chasum HQ continue real-use validation in parallel, but they are no longer the program gate.

The latter chapters remain separately scoped/approved implementation work. Core Operations launch-required defects continue throughout; validation tenants do not become product forks or dominate the roadmap.

Outside Private Alpha readiness includes meaningful Production error visibility and trace/correlation, tenant onboarding/identity safety, and switching/import/migration as a product capability for customers, staff, services and future appointments. Observability Phase A (#66/#67) and B2 (#69/#70) are Production accepted; the active bounded observability slice is Issue #68/B1 framework + client-safe capture integration. Production telemetry-provider activation remains a separate Product Owner gate. Summer-assisted onboarding/migration is a strategic opportunity.

Gate B covers real provider billing, truthful subscriptions and account lifecycle, paid activation, upgrade/downgrade/cancellation, failed-payment/dunning behavior, entitlement synchronization and pricing-math reconciliation. Pricing remains configurable: **pay for 10 months and receive 2 months free**, not “20% off.” Before selling multi-staff operation, resolve practical staff login/invitations/roles/permissions/owner-admin boundaries; promised team access makes RBAC LAUNCH REQUIRED, otherwise claims must explicitly say owner-operated v1.

### Summer Business Manager / intelligence layer

Summer horizontal v1 is the explicit major intelligence track, not a chatbot, receptionist, FAQ bot or copy generator. Across booking/calendar, customers, staff/locations, payments, invoices/receipts, communications, reporting and business setup/context, progress through **UNDERSTAND → EXPLAIN → RECOMMEND → ACT WITH PERMISSION → AUDIT**; longer-term **AUTOMATE SAFELY → OPERATE PROACTIVELY**.

Specialized workers share authoritative operating truth and permissions. Historical Emma naming does not set the future direction. Command Centre provides operating clarity; voice remains future capability, not a shipped claim.

### Competitive standard

Preserve a credible parity floor for essential service-business operations beside Fresha, Jane, Vagaro, Calendly, Square Appointments, Mangomint, Boulevard, GlossGenius, Mindbody and Booksy. Differentiate through connected intelligence, Command Centre clarity, Summer recommendations, safe permissioned actions, auditability, financial truth, simplicity and switching/onboarding speed. Competitor breadth is not uncontrolled scope.


### Inventory & Products

- Product catalog, stock levels, low-inventory alerts
- Retail / product sales tied to appointments and invoices
- Supplier orders
- Reports already reserved an Inventory section (future-ready)

### Marketing Automation

- Campaigns, segments, birthday/win-back flows
- Owner-approved sends only
- Tie to Communication Center and CRM

### Stripe

- Live subscription billing and customer payments
- Replace / augment mock billing provider
- Webhooks, customer portal, dunning

### Square

- In-person and omnichannel payments for service businesses
- POS-adjacent flows where relevant

### Native Mobile Apps

- **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY** — tracker workstream 18. Do not wait until the entire web platform is finished. Begin native development before broader public launch; begin **material** implementation only after the Native App Start Gate (core flows stable enough not to rebuild twice).
- **ONE** reusable multi-tenant Chasum app. GVM Baby World, Chasum HQ, and future businesses are **normal tenants** — no tenant-specific mobile forks.
- Working technical direction: **React Native + Expo**. Final stack decision: **TO BE CONFIRMED DURING NATIVE APP PREFLIGHT**.
- Future first-class **Apple App Store / iOS** and **Google Play / Android** — not a low-quality website wrapper.
- Native app is another operating surface for the same AI Business Operating System — not a separate mobile AI architecture.

### Marketplace

- Templates, integrations, industry packs
- Partner extensions with tenant-safe APIs

### Enterprise

- Org hierarchies, multi-business admin, advanced roles/permissions
- SSO, audit exports, SLA-oriented controls
- Cross-location rollups already seeded in Reports / Business

### Version 2

- Platform-wide UX/architecture leap after V1 departments are production-hardened
- Deeper AI collaboration, marketplace, and mobile as first-class
- Any intentional design-system evolution happens here — not as drive-by redesigns

---

## Roadmap rules

1. Do not mark future items complete until lint, build, CHANGELOG, and tenant-safe shipping bar are met.
2. Prefer finishing a department’s production path over starting three half-built themes.
3. AI features must obey AI Philosophy in the Bible (no invented business data).
4. Keep [`../ROADMAP.md`](../ROADMAP.md) for phase-level engineering detail; keep **this** file as the company-facing source of truth for completed vs future.

---

*Chasum Company Operating System — Master Roadmap*
