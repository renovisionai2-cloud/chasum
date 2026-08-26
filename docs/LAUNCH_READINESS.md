# Chasum Launch Readiness Tracker

**Status:** Canonical launch-governance tracker  
**Authority:** Working planning targets and launch-criticality classification live here. Product handoff still starts at [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md).  
**Last updated:** 2026-08-25  
**Updated by:** Native-app strategy governance correction (follow-up to PR #30). Workstream 18 is **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY**. Phase 5 remains **PREFLIGHT REQUIRED / NOT STARTED**. Tracker: **18 workstreams**.

These are **planning targets, not public promises.**

---

## Working planning targets

| # | Target | Window |
|---|--------|--------|
| 1 | GVM + Chasum HQ **stable pilot use** | Late September–October 2026 |
| 2 | Selected **outside Private Alpha** | October–November 2026 |
| 3 | **Commercially launchable Chasum v1** | December 2026–February 2027 |
| 4 | **Broader public launch** | February–April 2027 |
| 5 | Fuller world-class **AI Business Operating System** vision | Mid/Late 2027 onward |

---

## Governing principle

**Build what Chasum needs to launch trustworthily first.**
**Preserve the AI-operated architecture now.**
**Expand toward full AI operation continuously after launch.**

World-class foundation required for trust comes before launch.  
World-class expansion continues after commercial launch.

The December 2026–February 2027 commercial-v1 target does **not** require full autonomous business operation. Launch-driven implementation must **not** create architecture that blocks or materially increases the cost of reaching that vision.

Launch criticality **does not override quality.**

We defer unnecessary **breadth**. We do **not** defer:

- reliability
- trust
- financial truth
- security
- usability
- workflow quality
- responsive quality on key workflows
- architectural correctness
- tenant isolation
- professional polish required for customer confidence

---

## Launch-criticality check

Before approving or starting any major phase, feature, redesign, audit, architecture change, or workflow expansion, classify it as **exactly one**:

| Class | Meaning |
|-------|---------|
| **LAUNCH REQUIRED** | Must be completed before commercially launchable Chasum v1. Document: why Chasum cannot safely or commercially launch without it; acceptance condition; owner/current task; blocking issue; target window; launch risk GREEN / AMBER / RED; whether delay threatens December 2026–February 2027. |
| **IMPORTANT BUT POST-LAUNCH SAFE** | Valuable, but commercial launch can proceed safely without it. |
| **DESIGN FOR NOW / BUILD LATER** | Architecture and current decisions must account for it now; implementation must not delay launch. |
| **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY** | Design and architecture now. Begin material implementation after named core flows are stable enough not to rebuild twice, and early enough for meaningful testing before broader public launch. Do **not** wait until the entire web platform is finished. |
| **BACKLOG** | Useful future work with no current launch dependency. |
| **DEFER / DO NOT BUILD NOW** | Interesting, but not currently worth development time. |

### Anti-scope-creep rule

Nothing becomes LAUNCH REQUIRED merely because it is valuable, visually impressive, competitive, “World Class,” requested by one pilot, or present in a competitor.

LAUNCH REQUIRED must have a specific **safety, commercial, operational, legal/security, customer-trust, platform reliability, or product-positioning** reason that prevents Chasum from launching without it.

### Quality gate

Any feature chosen for launch must still meet the quality bar. Chasum is **not** building a mediocre MVP. It is building a **focused, trustworthy, world-class commercial v1.**

At minimum evaluate: intuitive UX; workflow speed; visual hierarchy; professional polish; trustworthy data; financial truth where relevant; tenant isolation; responsive quality; mobile quality for key workflows; loading / empty / error states; no confusing dead ends; accessibility appropriate to scope; no fake AI; future-safe architecture without unnecessary overengineering.

---

## Competitive quality standard

Service-business competitive **reference set** (benchmarks, not products to copy):

Square · Vagaro · Jane · Fresha · Booksy · GlossGenius · Mangomint · Boulevard · Acuity · Calendly

Chasum must compete with or exceed the **best principles** across this market while building the next-generation AI Business Operating System.

Broader benchmark principles already established:

| Reference | Principle |
|-----------|-----------|
| Apple | simplicity / polish / clarity |
| Stripe | financial truth / reliability / data discipline |
| Linear | speed / hierarchy / focus |
| Notion | flexibility |
| OpenAI | intelligent contextual interaction |
| Framer | visual quality |
| Jane | workflow trust |
| Fresha / Vagaro | service-business operational breadth |
| Calendly | scheduling simplicity |

For launch-critical customer-facing work, ask:

> Would this workflow feel credible beside Square, Vagaro, Jane, Fresha, Booksy, GlossGenius, Mangomint, Boulevard, Acuity, and Calendly — while still advancing Chasum’s connected AI Business Operating System advantage?

---

## Next-generation product rule

Do not merely match competitors feature-for-feature.

Chasum’s strategic advantage is the **connected business operating model**:

Customer → Booking → Appointment → Staff → Payment → Invoice → Communication → Follow-up → Reporting → Summer intelligence → Business action

Summer must increasingly understand and operate across this connected chain.

Long-term AI operating progression (Mid/Late 2027+ destination — **not** commercial-v1 acceptance):

**Observe → Understand → Recommend → Act with approval → Automate safely → Operate proactively**

That milestone is progress toward increasingly autonomous business operation, **not** merely additional feature breadth. The commercial-v1 target does **not** require this full progression.

---

## Four-axis phase decision model

Every major next phase is evaluated on:

1. **Launch criticality** — Does Chasum need it before commercial launch?
2. **World-class quality** — If we ship it, is it good enough to stand beside strong competitors?
3. **Next-generation advantage** — Does it move Chasum toward a connected AI Business Operating System rather than a legacy service-business clone?
4. **AI Operating-System Preservation Check** — Does this decision preserve or strengthen Chasum’s ability to evolve into a deeply AI-operated business system? Or does it push Chasum toward conventional service-business software that would later require major rebuilding to support AI operation?

Do not approve a major architecture/product phase that fails check 4 even if it is launch-critical, unless the alternative is documented and the rebuild cost is accepted by the PO.

---

## Status and risk vocabulary

**STATUS:** `DONE` · `IN PROGRESS` · `PARTIAL` · `BLOCKED` · `NOT STARTED`  
**LAUNCH RISK:** `GREEN` · `AMBER` · `RED`

---

## Companion documents (not duplicates)

| Doc | Role |
|-----|------|
| [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md) | Living product handoff / control board |
| [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md) | Historical 2026-07 open-beta engineering checklist |
| [`LAUNCH_RISK_REGISTER.md`](./LAUNCH_RISK_REGISTER.md) | Historical commercial-integrity risk register |
| [`TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md) | Engineering debt register |
| [`GVM_GO_LIVE.md`](./GVM_GO_LIVE.md) | GVM validation / cutover checklist |
| [`OWNER_PLATFORM.md`](./OWNER_PLATFORM.md) | `/owner` Platform Admin direction |

Do not treat the July 2026 checklist/register as this tracker. Update **this file** for launch-criticality classification.

---

## Tracker

The canonical Launch Readiness Tracker contains **18 workstreams**.

Owner defaults to **Founder / PO** for sequencing and **Engineering** for implementation unless noted.

### 1. Reliable Core Business Operations

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — Chasum cannot commercially launch if booking, appointment lifecycle, customers, staff, locations, catalog, communications, and day-to-day workflow trust fail for a real service business. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — operate and harden existing Reception, CRM, Employees, Locations, Services, Communications, Command Centre. No new department rewrite scheduled. |
| Blocking issue | Remaining craft: Booking Sheet collect-payment stub; dual communications stacks; public named-staff write path converged onto Booking Engine on `cursor/phase-5-booking-path-convergence` (**not Production**); resources migration `036` unapplied (flag off). |
| Acceptance condition | A 1-location / 1–few-staff business can create customers, book/reschedule/cancel, run today’s schedule from Command Centre + Reception, collect/record money honestly, and communicate confirmations without dead ends or fabricated data. |
| Target completion window | Late September–October 2026 (pilot-grade); hold through Dec 2026–Feb 2027 commercial v1 |
| Launch risk | **GREEN** |
| Threatens Dec 2026–Feb 2027? | **NO** if current core paths keep working; **YES** if a production booking/comms regression lands |
| Notes | Command Centre V1 on `main` (PR #27). Core Ops is the strongest outcome axis. Competitor check: Jane / Fresha / Vagaro workflow trust — current Reception is credible for Private Alpha, not yet full-salon-POS breadth. Source: [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md). |

Launch requirement vs later expansion: **launch** = trusted booking + CRM + staff + locations + services + communications for small/growing businesses. **Later** = resources/rooms, inventory, franchise, native mobile.

---

### 2. Signup / Authentication

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — operators must sign in, reset passwords, and reach the correct tenant dashboard. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — existing Supabase Auth + dashboard protection. Phase 4A closed the signup paid-plan hole. Remaining: staff invitation / multi-user login is workstream 6, not this row. |
| Blocking issue | Single-owner login is the real path today; “team” marketing must stay honest. |
| Acceptance condition | Owner can sign up / sign in / reset password and land in the correct business; unauthenticated users cannot reach `/dashboard` or `/owner`; magic-link and password reset work in Staging and Production; signup cannot grant paid `subscription_plan_key`. |
| Target completion window | Already usable; hold through commercial v1 |
| Launch risk | **GREEN** |
| Threatens Dec 2026–Feb 2027? | **NO** |
| Notes | Auth surfaces exist. Paid-plan assignment hole closed in PR #29. Multi-staff login is workstream 6, not a silent claim of this row. |

---

### 3. Safe Tenant Provisioning / Onboarding

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — a new business must become a real tenant without identity collisions or fake “you’re live” states. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — `getOrCreateBusiness` + setup checklist. Follow-up: onboarding duplicate detection (identity-incident debt). |
| Blocking issue | Duplicate-business detection / slug identity hygiene still listed as follow-up; setup can remain incomplete (valid). |
| Acceptance condition | New owner gets one business, a unique booking slug, and an honest setup checklist; Tenant Identity Safety Gate remains enforced; no second GVM-style public-slug collision. |
| Target completion window | Before selected outside Private Alpha (October–November 2026) |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** if a second identity collision ships to a paying or public tenant |
| Notes | Gate: [`TENANT_IDENTITY_SAFETY_GATE.md`](./TENANT_IDENTITY_SAFETY_GATE.md). HQ Staging setup was still incomplete (no services) during Phase 3 review — expected dogfood gap, not a product defect. Duplicate-detection follow-up is **not** the next major phase; it remains a bounded item before outside Private Alpha. |

---

### 4. Commercial SaaS Lifecycle

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — commercially launchable v1 cannot mint fake paid invoices or pretend self-serve billing is live. Operators need a truthful plan/subscription path. Full paid-provider lifecycle is **Gate B**, later than Phase 4A. |
| Status | **PARTIAL** |
| Private Alpha billing readiness | **Gate A COMPLETE** (PR #29, `f6517a1`) |
| Commercial v1 billing readiness | **NOT MET** — Gate B required later |
| Current owner / current task | Engineering / Founder — Gate A shipped. Do **not** start Gate B in this chapter. Next launch-critical phase is Production pin + design-partner pilot stabilization (preflight). |
| Blocking issue | No live payment-provider billing; paid self-serve conversion gated; upgrade / downgrade / cancellation / dunning immature. Phase 4A removed theater; it did not ship provider billing. |
| Acceptance condition | **Do not use a single acceptance for this workstream.** See Gate A vs Gate B below. This workstream stays **PARTIAL** until Gate B is also met. |
| Target completion window | Gate A: done before selected outside Private Alpha. Gate B: before December 2026–February 2027 commercially launchable v1 (or the commercial-v1 date slips). |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** if commercial v1 is declared without Gate B. Fake paid-upgrade UX is closed. |
| Notes | Trails Core Operations. [`LAUNCH_RISK_REGISTER.md`](./LAUNCH_RISK_REGISTER.md) R-C1. Competitor check: Square/Mangomint billing honesty — do not ship theater. |

**Status rule:** Commercial SaaS Lifecycle remains **PARTIAL** after Phase 4A. Manual billing, `/owner` plan assignment, and removal of upgrade theater do **not** mark this workstream DONE.

#### Gate A — Private Alpha / design-partner billing

**WORLD CLASS PHASE 4A — COMMERCIAL SAAS LIFECYCLE HONESTY**

**STATUS:** COMPLETE / MERGED TO MAIN (PR #29, `f6517a17504667b58799a3202e43f5ec145643a1`)

Purpose: truthful Commercial SaaS behavior for controlled Private Alpha **without** pretending full self-serve billing exists.

**Operating path:** apply or invite → approve off-platform → `/owner` assigns Free or Professional → entitlements follow `subscription_plan_key` → tenant billing shows arrangement truth. `private_alpha_enabled` stays a separate flag. See [`OWNER_PLATFORM.md`](./OWNER_PLATFORM.md).

Non-blocking debt: `/owner` plan UPDATE and `subscription_events` INSERT are not atomic ([`TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md) TD-M11, PLANNED HARDENING). `productPlanKeyForNewBusiness()` is tested but unused in app code (TD-L6, P3 / cleanup).

Bounded acceptance (closes **Phase 4A only**):

- paid-upgrade UX cannot falsely claim a paid plan
- current plan state is truthful
- `/owner` can view and, where current architecture safely supports it, assign/manage approved design-partner plan state
- manual / design-partner billing path is documented and operationally usable
- entitlements remain consistent with the assigned plan
- no fake Stripe / payment-provider state
- no commerce-ledger formula changes

If no provider, migration, webhook, or Production billing-data changes are required: **LEVEL 2**.

Phase 4A **does not** mark the entire Commercial SaaS Lifecycle DONE.

#### Gate B — Commercial v1 paid billing

**STATUS:** REQUIRED LATER / **NOT MET**

Required before Chasum may be classified **COMMERCIALLY LAUNCHABLE V1**.

Must ultimately cover, as required by the chosen provider/architecture:

- real payment-provider billing for Chasum subscriptions
- truthful subscription state
- successful paid activation
- upgrade behavior appropriate to launch scope
- downgrade behavior appropriate to launch scope
- cancellation behavior appropriate to launch scope
- failed-payment handling appropriate to launch scope
- entitlement synchronization with actual subscription truth
- no fake or manually misleading paid state

**Do not design or implement this provider lifecycle in this documentation chapter.**

When live provider billing / webhooks / schema / migrations / Production subscription data enters scope: **LEVEL 3** and **Claude pre-challenge before implementation**.

---

### 5. Entitlements / Plan Limits

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — price fences must be real for staff (done) and other sold limits that we claim. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — active-staff quota on `main` (PR #25). Phase 4A made assigned product plan truthful, so staff seats follow `/owner` assignment rather than signup theater. Remaining: location helper 6 vs catalog/fallback 10; other entitlements. |
| Blocking issue | Location-limit 6-vs-10 mismatch; staff quota TOCTOU race (post-launch-safe for Private Alpha). |
| Acceptance condition | Every publicly claimed numeric plan limit is enforced server-side for the limits we sell now (active staff is the model). Location cap documented and consistent before it is sold as a fence. |
| Target completion window | Before commercially launchable v1 for any limit we claim on Pricing |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** only if Pricing claims a limit the product does not enforce |
| Notes | Staff honesty is the template. Do not expand entitlements theater. Phase 4A did not add new fences. |

---

### 6. Launch-Critical Permissions / RBAC

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** if commercial v1 sells multi-staff login or team permissions. **IMPORTANT BUT POST-LAUNCH SAFE** if v1 remains **owner-operated** and marketing does not include staff login. Current GTM: do not market staff login as included. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — role catalog exists (`lib/employees/roles.ts`); enforcement is “later.” Owner-always permissions today (`TD-H6`). |
| Blocking issue | Roles stored, not enforced for multi-staff login. |
| Acceptance condition | Either (A) owner-only v1 is explicit in product + Pricing + Truth Matrix, or (B) at least one non-owner role is enforced on calendar/CRM/payments with tests. |
| Target completion window | (A) now / hold; (B) before selling team seats — likely public-launch window if owner-only v1 is chosen |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **NO** if owner-only v1 stays honest; **YES** if team login is sold unenforced |
| Notes | Competitor check: Jane/Vagaro staff permissions are table stakes for multi-staff shops — not for a one-owner Private Alpha. **Not the next major phase** while staff login remains Coming Next and GTM stays owner-operated. |

---

### 7. Payments / Invoices / Refunds / Deposits / Taxes

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** for **recorded** client money truth. Card-present / Stripe Elements is **IMPORTANT BUT POST-LAUNCH SAFE** if cash/manual ledger remains the honest path. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — commerce ledger + Command Centre Gross payments collected from `getCommerceDashboardSnapshot()`. Do not change formulas in docs tasks. |
| Blocking issue | Booking Sheet collect-payment still partially stubbed; Stripe Elements incomplete; two money systems (SaaS `billing_*` vs client `commerce_*`). |
| Acceptance condition | Paid / refunded / outstanding / deposit / invoice / tax / balance displayed from authoritative commerce; no fake revenue; operator can record a payment and see it on Payments + Command Centre. |
| Target completion window | Hold through commercial v1; card collection when a tenant actually needs it |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **NO** for manual-first design partners; **YES** if card collection is marketed as live |
| Notes | Financial truth locked. Competitor check: Stripe/Square money honesty over feature breadth. |

---

### 8. Platform Admin / Control Centre

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — Chasum must operate tenants, trials, and support without using a customer tenant as the control plane. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — `/owner` lists tenants, product plan, Private Alpha flag, and bounded starter/professional assignment (PR #29). Do **not** expand `/owner` as the next architecture phase. `/dashboard/hq` disposition remains PO-gated. |
| Blocking issue | `/dashboard/hq` naming/disposition unresolved; list-price MRR is estimated until Gate B; usage / account-health / trial depth remain thin. |
| Acceptance condition | Platform operators use `/owner` (not Chasum HQ tenant, not `/dashboard/hq`) to list tenants, see plan/status, and perform bounded support access; HQ tenant remains a normal business. **Controlled Private Alpha bar is met** after Phase 4A; commercial-v1 ops depth is not. |
| Target completion window | Controlled Private Alpha: now. Deeper usage/health/trials: before commercial v1, not the next phase. |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **NO** if `/owner` remains usable for design-partner assignment; **YES** if support/tenant ops depend on unsafe Production poking |
| Notes | [`OWNER_PLATFORM.md`](./OWNER_PLATFORM.md). Do **not** confuse `/dashboard/hq` with Chasum HQ. |

---

### 9. Summer Launch Readiness

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** for the **positioned** AI Business Manager at commercial v1 — as a **grounded** assistant on approved workflows, not as full OS autonomy. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — in-app Summer + marketing concierge + Command Centre grounded facts (PR #27). |
| Blocking issue | Not full AI Business Operating Manager (proactive cross-OS actions). Dual Emma/Summer path remains. Roster roles are Coming Next. |
| Acceptance condition | Summer reliably answers approved business questions from authoritative tenant data; supports approved launch workflows (booking/availability/CRM-grounded assist + Command Centre facts); makes no fabricated claims; handles failure/escalation honestly. **Not** “Summer is world class.” |
| Target completion window | Hold grounded bar through commercial v1; deepen toward OS manager after |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **NO** if claims stay grounded; **YES** if marketing implies autonomous OS manager |
| Notes | Command Centre V1 is grounded-only. Competitor check: OpenAI contextual intelligence without gimmicks — current strength is assist, not autopilot. **Not the next major phase.** |

---

### 10. Security / Tenant Isolation

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — cross-tenant leakage or weak isolation blocks launch. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — RLS present; Track 3 hardening **not** implemented. Migrations **034–036 UNAPPLIED**. **037/038 APPLIED** in DBs; SQL missing from repo. |
| Blocking issue | Unapplied 034–036; missing 037/038 SQL in repo; service-role blast radius. |
| Acceptance condition | Authenticated tenant A cannot read tenant B data on dashboard/API/booking; Preview≠Production; Tenant Identity Safety Gate holds; no new cross-tenant writes. |
| Target completion window | Before broader public launch; keep isolation green through commercial v1 |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** if a cross-tenant bug is found; **NO** as a scheduled rewrite if current RLS holds |
| Notes | Do not apply 034–036 without PO. Level 3. |

---

### 11. Support / Recovery / Operational Admin

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** at a **design-partner** bar (reachable founder + `/owner` support). Full help center / SLA is **IMPORTANT BUT POST-LAUNCH SAFE**. |
| Status | **PARTIAL** |
| Current owner / current task | Founder — Private Alpha white-glove. `/owner/support` exists (failed notification deliveries). Phase 4A added truthful plan visibility for ops. |
| Blocking issue | No full help center; support promised on paid tiers vs mailto reality (historical R-H2). |
| Acceptance condition | Design partners have a documented contact path; platform owner can see failed deliveries; Production deploy remains PO-gated; incident path is written even if short. |
| Target completion window | Before selected outside Private Alpha |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **NO** for Private Alpha white-glove; **YES** for open paid self-serve without a support path |
| Notes | Do not sell dedicated SLA until operational. Do not expand this into a help-center program now. |

---

### 12. Responsive / Mobile Quality for Key Workflows

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** for key workflows (Command Centre, Reception, public booking, Customers, Payments) to be usable on phone. Tablet shell overflow is **IMPORTANT BUT POST-LAUNCH SAFE**. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — Phase 1 mobile bottom nav; Phase 3 Command Centre verified at 390 and 1440. |
| Blocking issue | Pre-existing `DashboardTopNav` overflow ~768–1024px (`scrollWidth` 844 at 820px). Same on Employees and Payments. **Not Command Centre.** |
| Acceptance condition | Phone (~390) can complete Command Centre scan, Reception, public book to “Your information,” Customers, Payments without horizontal content overflow or dead nav. Tablet top-nav overflow does not block those workflows. |
| Target completion window | Key-workflow mobile: hold now. Shell overflow: post-launch unless pilot proves it blocks tablet work. |
| Launch risk | **GREEN** |
| Threatens Dec 2026–Feb 2027? | **NO** |
| Notes | Reassess shell overflow only if pilot testing proves it materially blocks a key tablet workflow. Native iOS/Android apps are **workstream 18**, not this row. |

---

### 13. Production Telemetry / Monitoring / Error Visibility

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** at a **minimum** (know when Production is down / erroring). Deep APM is **IMPORTANT BUT POST-LAUNCH SAFE**. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — Sentry (`lib/observability/sentry.ts`, `instrumentation.ts`) + structured logs + `/api/health`. |
| Blocking issue | Historical debt register still says “No Sentry” (`TD-H7`) — stale vs current `main`. Coverage/alerting depth unverified in this stamp. |
| Acceptance condition | Production errors are visible to operators; `/api/health` is monitored; a failed cron/job is not silent. |
| Target completion window | Before commercially launchable v1 |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** if Production fails silently during pilots |
| Notes | Verify Sentry DSN in Production rather than assuming. |

---

### 14. GVM Baby World Pilot Stability

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** for planning target #1 (Late Sep–Oct 2026). Not the entire product roadmap. |
| Status | **PARTIAL** |
| Current owner / current task | Founder + GVM + Engineering — remaining validation: first real client appointment; Resend SMTP / production email path. Identity incident **CLOSED**. This is part of the recommended next phase (preflight), not a GVM-only product rewrite. |
| Blocking issue | First real appointment and production email still called out; Production serving SHA must be verified before claiming Phases 1–4A are live for GVM. |
| Acceptance condition | GVM can complete a real booking with confirmation reaching the customer; `/book/gvm-baby-world` stays on tenant `a04e1d65-eeb9-4d72-a5bf-739a9038bb91`; no identity regression. |
| Target completion window | Late September–October 2026 |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** if the founding design partner cannot actually run the product |
| Notes | [`GVM_GO_LIVE.md`](./GVM_GO_LIVE.md) contains historical checkboxes — do not treat “apply 001→022” as current. |

---

### 15. Chasum HQ Pilot Stability

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** for planning target #1 — dogfood the **normal HQ tenant**, not `/dashboard/hq`. |
| Status | **PARTIAL** |
| Current owner / current task | Founder — operate Chasum through Staging/Production HQ tenant as a **normal business**. Staging HQ still had incomplete setup (no services) during Phase 3 review. Part of the recommended next phase (preflight). |
| Blocking issue | HQ is not yet a fully operational day-to-day business in the reviewed Staging tenant; Production HQ posture not restamped here. |
| Acceptance condition | Chasum HQ tenant can run Command Centre + Reception + customers + at least one service/staff as a normal business; no privileged shortcuts vs other tenants. |
| Target completion window | Late September–October 2026 |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **NO** as a billing blocker; **YES** as a “we don’t use our own product” trust blocker |
| Notes | Staging slug `chasum-hq` (`724d9ecd-438d-439e-952e-2d8c4ab4486c`). |

---

### 16. Selected Outside Private Alpha Validation

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** for planning target #2 (Oct–Nov 2026). Commercial v1 should not be the first outside user if avoidable. |
| Status | **NOT STARTED** |
| Current owner / current task | Founder — select 1–2 outside design partners after GVM/HQ are stable. Phase 4A now supplies an honest plan-assignment path; that does **not** start this workstream. |
| Blocking issue | GVM/HQ pilot stability incomplete; Production pin unverified; onboarding identity hygiene follow-up. |
| Acceptance condition | At least one non-GVM / non-HQ service business completes setup, a real booking path, and a week of Command Centre/Reception use without a P0 tenant-isolation or money-truth failure. |
| Target completion window | October–November 2026 |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** if commercial v1 is attempted with only internal tenants |
| Notes | Invite-only. No public acquisition push. Gate A complete is a prerequisite, not a substitute for a real outside tenant. |

---

### 17. Production Release / Launch Hardening

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — do not sell a product Production is not actually serving. |
| Status | **PARTIAL** |
| Current owner / current task | Founder / Engineering — Production deploys remain PO-gated. Last documented Production serving SHA `68e9a81` (identity closeout). Current `main` is `f6517a1` (PR #29 / Phase 4A). **VERIFY BEFORE CLAIMING CURRENT.** Primary work of the recommended next phase. |
| Blocking issue | `main` ≠ documented Production; World Class Phases 1–4A may not be on Production yet. |
| Acceptance condition | Production SHA is known, documented, and includes the capabilities we tell pilots they have (nav, staff honesty, Command Centre, Gate A billing truth); Preview→Staging still isolated; no silent Production deploys. |
| Target completion window | Before GVM/HQ stable pilot claims; again before commercial v1 |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** if we commercially launch while Production lags `main` without a conscious pin |
| Notes | Preview → Staging `wnfahklzaxirftyskctd`. Production → `kxcydvhswkuzepwzzinq`. Do not deploy Production in this documentation chapter. |

---

### 18. Native Mobile / App Store Readiness

| Field | Value |
|-------|--------|
| Launch classification | **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY** — do **not** wait until the entire web platform is finished. Begin native Chasum app development **before broader public launch**. Begin **material** native implementation only after the core operating flows are stable enough that Chasum is not rebuilding them twice. Immediate Phase 5 launch risk remains **GREEN**. |
| Status | **NOT STARTED / PLANNED** |
| Current owner / current task | Founder / Engineering — preserve architecture for one reusable multi-tenant native surface. **Do not** implement native apps in Phase 5. Capture mobile-web evidence during Phase 5. |
| Blocking issue | Core operating flows are not yet at the Native App Start Gate. Phase 5 (Production pin + GVM/HQ pilots) is the nearer launch-required work. |
| Acceptance condition (current stage) | Architecture and launch-critical workflows preserve a clean path to a first-class native iOS/Android app **without rebuilding the business operating model.** The native app is another operating surface for the **same** Chasum AI Business Operating System — not a separate mobile AI architecture. |
| Target completion window | Material native implementation after the Native App Start Gate, early enough for meaningful iOS/Android testing **before broader public launch** (planning target #4, Feb–Apr 2027). Not Phase 5. Commercial v1 (Dec 2026–Feb 2027) does **not** currently require App Store / Play apps. |
| Launch risk | **GREEN** (immediate / Phase 5). Broader public launch is at risk if native work never starts after core stability. |
| Threatens Dec 2026–Feb 2027? | **NO** at present for commercially launchable v1, provided key responsive-web workflows remain genuinely usable |
| Notes | **Working technical direction:** React Native + Expo. **Final stack decision:** TO BE CONFIRMED DURING NATIVE APP PREFLIGHT — not irrevocably locked. Product Truth Matrix: Native mobile apps = Future Vision until a native preflight ships. |

#### Native App Start Gate

Material native implementation may begin when these eight core areas are **sufficiently stable**:

1. Booking / Calendar
2. Customers / CRM
3. Payments / Refunds
4. Invoices / Receipts
5. Employees / Locations
6. Communications
7. Permissions / Authentication
8. Summer

**Sufficiently stable** means: authoritative domain model established; primary workflows accepted; major data contracts are not undergoing active redesign; tenancy boundaries are clear; Preview / Staging / Production separation is safe; mobile can reuse Chasum’s operating truth instead of duplicating it. This does **not** require every feature to be permanently complete.

#### Working technical direction vs final stack

| Field | Value |
|-------|--------|
| Working technical direction | **React Native + Expo** |
| Final stack decision | **TO BE CONFIRMED DURING NATIVE APP PREFLIGHT** |

Do **not** treat the working direction as an irrevocable lock.

#### One reusable multi-tenant mobile product

Chasum has **ONE** reusable multi-tenant mobile product.

The mobile app must use the same authoritative tenant identity, business / location / resources, staff, permissions, entitlements, customers, appointments, commerce, communications, Summer context, and operating truth as the web product.

Tenant differences come from data, configuration, branding, permissions, plans, and entitlements — **not** separate product forks.

Do **not** create a GVM-specific Chasum app, a Chasum HQ-specific app, or separate apps per customer/business. GVM Baby World, Chasum HQ, and future businesses remain **normal tenants** of the same app/product.

The native app is another operating surface for the same AI Business Operating System (Observe → Understand → Recommend → Act with approval → Automate safely → Operate proactively) across the connected chain (Customer → Booking → Appointment → Staff → Payment → Invoice → Communication → Follow-up → Reporting → Summer intelligence → Business action).

#### App Store direction

Future distribution: **Apple App Store / iOS** and **Google Play / Android**. First-class native — **not** a low-quality website wrapper.

Future direction (not this PR, not Phase 5): push notifications, biometric authentication, deep links, appointment/customer quick actions, camera/document workflows, call/text workflows, operational alerts, Summer mobile interaction, later voice / AI operational interaction.

---

## Target health (December 2026–February 2027 commercial v1)

**Overall: AMBER**

Top factors:

1. **Production may lag `main`** — World Class nav, staff honesty, Command Centre, and Gate A billing truth are on `main` (`f6517a1`); last documented Production serving SHA is `68e9a81`. Unverified pin is the highest near-term launch threat.
2. **GVM/HQ pilots are not yet “stable use”** — first real appointment and production email remain open; HQ dogfood incomplete. This outranks a new architecture phase until Late Sep–Oct target is real.
3. **Commercial SaaS lifecycle remains trailing** — Gate A is **COMPLETE**; fake paid-upgrade theater is closed. **Gate B** (live provider billing) is still required before commercially launchable v1 and is **not** the next phase.
4. **Core operations are the strongest axis** — booking, CRM, Command Centre V1, staff quota honesty, truthful Private Alpha billing. This is why the target is AMBER, not RED.
5. **Isolation/migrations** — 034–036 unapplied is scheduled risk, not a known live cross-tenant incident.

No unsupported schedule promise: Late Sep–Oct pilots are the near gate; Oct–Nov outside Private Alpha depends on those pilots plus a verified Production pin; Dec–Feb commercial v1 still requires Gate B later.

---

## Phase 4A impact on this tracker

Improved (not DONE):

| Workstream | Impact |
|------------|--------|
| 4. Commercial SaaS Lifecycle | Gate A **COMPLETE**. Signup cannot grant paid plans. Mock tenant lifecycle locked. Manual `/owner` assignment path exists. Workstream stays **PARTIAL** until Gate B. |
| 5. Entitlements / Plan Limits | Assigned product plan is now truthful, so staff-quota fences follow real `/owner` assignment rather than signup theater. Remaining fences unchanged. |
| 8. Platform Admin / Control Centre | Plan + Private Alpha visibility and bounded starter/professional assignment shipped. Controlled Private Alpha ops bar met; commercial-v1 usage/health/trial depth not. |
| 11. Support / Recovery / Operational Admin | Operators can see truthful plan/arrangement state while doing white-glove support. Help center still not in scope. |
| 16. Selected Outside Private Alpha | Honest onboarding/billing arrangement path now exists. Workstream remains **NOT STARTED**; still blocked on GVM/HQ + Production pin. |

Did **not** complete: Gate B, RBAC, Summer OS-manager depth, Production pin, GVM first real appointment, HQ dogfood, native apps.

---

## Recommended next major phase

**WORLD CLASS PHASE 5 — PRODUCTION PIN AND DESIGN-PARTNER PILOT STABILIZATION**

**STATUS:** PREFLIGHT REQUIRED / NOT STARTED

Do **not** implement in this documentation chapter. Do **not** start Gate B, RBAC, Summer expansion, `/owner` expansion, or native apps here.

| Field | Value |
|-------|--------|
| Exact phase name | **World Class Phase 5 — Production Pin and Design-Partner Pilot Stabilization** |
| Launch classification | **LAUNCH REQUIRED** |
| Tracker workstreams | **17** Production Release / Launch Hardening (primary pin); **14** GVM Baby World Pilot Stability; **15** Chasum HQ Pilot Stabilization. Unblocks **16** Selected Outside Private Alpha. Observes **12** responsive-web use and **18** native timing evidence; observes Summer grounded use without expanding it. |
| Why now | Highest probability of delaying Oct–Nov Private Alpha. Architecture candidates (RBAC, `/owner` expansion, Summer, Gate B, native apps) would proceed on an unvalidated Production product. Production serving truth + GVM real workflow + HQ dogfooding currently pose a more immediate threat to Late Sep–Oct pilots and Oct–Nov outside Private Alpha than those alternatives. |
| Exact launch dependency | Chasum cannot safely invite an outside design partner, or claim Late Sep–Oct stable pilot use, while Production serving SHA is unverified relative to `main`, GVM has not completed a real booking+confirmation path, and HQ is not dogfooded as a normal tenant. |
| Acceptance condition | (1) Production SHA is verified and documented, and includes World Class Phases 1–4A capabilities told to pilots **or** a conscious pin is recorded; (2) GVM completes a real booking with customer confirmation on the authoritative tenant; (3) Chasum HQ tenant can run Command Centre + Reception + at least one service/staff as a normal business; (4) no P0 tenant-isolation or money-truth failure; (5) no Stripe/provider, RBAC, Summer architecture, `/owner` expansion, native apps, or migrations in this phase. Pilot validation must exercise the connected operating chain (not merely deployment health) and **capture** mobile friction and grounded-AI workflow gaps without expanding either. |
| Likely risk level | **LEVEL 2** for PO-gated Production pin, env/email verification, and targeted defect fixes with no schema/tenancy/provider change. **LEVEL 3** (Claude pre-challenge required) if migrations 034–036, Production data mutations, identity-schema work, or billing-provider work enter. |
| Claude pre-challenge | **NOT required** for bounded operational pin + real-use validation + targeted defects. **Required** before any LEVEL 3 expansion. |
| Must remain out of scope | Gate B / Stripe / Checkout / webhooks; RBAC / staff login; Summer architecture rewrite; native iOS/Android **implementation**; `/owner` expansion; `/dashboard/hq` disposition; DashboardTopNav overflow; tenancy rewrite; commerce-ledger formulas; applying 034–036; public launch marketing; treating React Native + Expo as an irrevocable stack lock. |
| Effect on Late Sep–Oct pilots | **Protects** the target. Direct acceptance of this phase. |
| Effect on Oct–Nov Private Alpha | **Protects** the target. Outside Private Alpha stays blocked until this phase’s acceptance is met. |
| Effect on Dec–Feb commercial v1 | **Protects** by proving the connected operating chain in live tenants. Does **not** complete Gate B. Does **not** ship native apps. Does **not** complete full AI autonomy. |

Four-axis: launch-critical because live workflow + Production truth are prerequisites to inviting outsiders (Axis 1); quality = Jane/Fresha operational trust on the real booking→confirmation→money path, not a theme-park (Axis 2); next-gen advantage is a connected OS that actually completes Customer → Booking → Appointment → Staff → Payment → Invoice → Communication before Summer/billing/RBAC/native layers expand (Axis 3); AI OS preservation = validate and record grounded Summer gaps without collapsing Chasum into conventional salon software (Axis 4).

**Launch-criticality proof:** Chasum cannot safely or commercially launch (and cannot honestly start selected outside Private Alpha) if the founding Production design partner has not completed a real booking with customer confirmation, Chasum HQ is not operated as a normal tenant, and Production may still be serving a SHA that predates World Class Phases 1–4A. An outside partner would otherwise be the first real user of an unverified live product.

### Parallel work (not the main architecture phase)

Keep bounded. Maximum three:

1. **GVM + HQ real-use testing** inside this phase’s validation loop — observe booking, Reception, Command Centre, staff, customer records, money, communications, Summer where currently grounded, and phone/responsive workflows. Capture: real mobile-web friction; owner/staff mobile usage patterns; notification needs; workflows that materially benefit from native behavior; Summer mobile use cases; architecture issues that could complicate native implementation later. Do **not** expand Summer or start native implementation.
2. **Momentic Preview/Staging booking canary** after any targeted product defect fix — not a substitute for a real GVM appointment.
3. **Manual launch operations** — `/apply` pipeline, `/owner` plan assignment on disposable/synthetic Staging only when PO-approved, incident notes. Do **not** mutate Chasum HQ or GVM plans as a “check.”

### Explicitly later (not next)

| Candidate | Verdict |
|-----------|---------|
| Gate B (commercial-v1 paid billing) | **Later.** LEVEL 3. Required before Dec–Feb commercial v1. Not next: Private Alpha does not need a live provider; 4A just closed honesty. |
| Launch-critical RBAC | **Later** while GTM remains owner-operated and staff login stays Coming Next. Becomes LAUNCH REQUIRED if team login is sold. |
| `/owner` expansion | **Later.** Controlled Private Alpha bar is met after 4A. |
| Summer OS-manager depth | **Later.** Launch bar is grounded assist; over-building now risks fake AI. Capture gaps in Phase 5; do not expand. |
| Native iOS / Android apps (workstream 18) | **After the Native App Start Gate, before broader public launch.** Classification: **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY**. Working direction: React Native + Expo; final stack confirmed at native-app preflight. One reusable multi-tenant app. Not Phase 5 implementation. |
