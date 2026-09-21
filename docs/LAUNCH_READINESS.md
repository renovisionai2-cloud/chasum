# Chasum Launch Readiness Tracker

**Status:** Canonical launch-governance tracker  
**Authority:** Working planning targets and launch-criticality classification live here. Product handoff still starts at [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md).  
**Last updated:** 2026-09-21
**Updated by:** Codex under ChatGPT Control Tower’s Issue #73 Package B1 contract. Phase 5 is COMPLETE; Outside Private Alpha readiness remains the current program phase. Historical dated entries below retain the status that was true at their observation time.

These are **planning targets, not public promises.**

**2026-09-21 current control state:** Issue #72 is CLOSED / PRODUCTION ACCEPTED. PR #79 / Issue #73 Package A is **COMPLETE / PRODUCTION ACCEPTED CODE FOUNDATION** at main `ea2fbe18e1c6bd759813bcb56d0544b86aa2aa5e`; Vercel Production deployment is SUCCESS. Package A remains pure deterministic import preview only with no persistence/write/UI surface. From base `aa97e294625418499a675a3b4b3ee502c85654cd`, Package B1 is IMPLEMENTED CANDIDATE / NOT APPLIED: three private import tables and local DB tests only. Independent Level-3 review and separate PO Staging application remain required; B2 is NOT AUTHORIZED; Package C UX remains later governed. Outside Private Alpha readiness remains IN PROGRESS; Phase 5/observability COMPLETE; Sentry OFF; Gate B not begun.

**2026-09-21 historical pre-merge control state:** Outside Private Alpha readiness remains **IN PROGRESS**. Issue #72 / PR #78 implementation, separately approved Staging migration `20260920230358_tenant_identity_gate`, live DB/RLS/RPC acceptance, hosted Playwright acceptance and independent audits are complete at application candidate `4c39652866117a4ce93b4f8193375c8816c2b582`. PR #78 remains unmerged; the migration is NOT APPLIED to Production. The remaining #72 gate is the Product Owner’s coordinated merge/Production rollout decision and controlled Production acceptance. #73 governed switching/import readiness follows #72 Production closeout. Phase 5 and observability remain COMPLETE; Production Sentry stays OFF. Gate B has not begun. Git main at restamp: `d6f6cd0481305c07d6c721cf3bb4b4cc147ac433`.

**2026-09-20 historical control state (superseded by the 2026-09-21 entry only as current queue state):** World Class Phase 5 is **COMPLETE**. Observability Phase A (#66 / PR #67), B2 (#69 / PR #70), B1 (#68 / PR #74) and C1 privacy hardening (#75 / PR #76) are **PRODUCTION ACCEPTED**. Current accepted application main at this restamp base is `470785f997c456a325c2ad17a503660bc6eafebc`. Parent Issue #65 is **CLOSED / COMPLETE**. Production Sentry/provider activation remains OFF and separately governed. Issue #72 tenant identity/onboarding safety is the next launch-required gate; #73 governed switching/import follows. Issue #57 branded-domain cutover remains deferred; `chasum.vercel.app` remains the legitimate Private Alpha Production hostname. Current program phase is **Outside Private Alpha readiness**.

**Observability readiness status:** **COMPLETE for the Outside Private Alpha launch-required foundation.** Server/client error capture, allowlist-first structured context, outbound-event privacy hardening, safe support references and truthful worker-health visibility are Production accepted. Production provider activation, source maps, deeper APM/metrics and richer alerting are separately governed future improvements and do not keep Issue #65 open.

**2026-09-17 (PR #41):** Cancelled-appointment terminal-state integrity P1 **CLOSED / PRODUCTION ACCEPTED**. Accepted PR #41 runtime / product-release baseline `35ba43fd3c9c7e854ea11d558571e8456ed43079` on `dpl_42gbuqefLzJm12gBiLzDXPxcis2J`. Current GitHub main identity is repository HEAD (**main at this docs restamp base:** `35ba43f`). After this docs PR merges, GitHub main will advance to a new documentation-only merge commit; serving identity must be verified from `/api/build-info`. Cancelled is terminal; notes-editable only; canonical PR #39 cancel path preserved. Hosted Staging UI acceptance PASS by explicit PO re-scope (enqueue-only). Live API smoke deferred (no governed HQ Staging API key; no key created). Phase 5 **IN PROGRESS**. HQ booking, reschedule, cancellation confirmation, and cancelled terminal-state integrity are accepted. GVM still waits for a legitimate Production booking. Outside Private Alpha **NOT STARTED**. Gate B **NOT MET**. No change to the 18 workstreams, windows, pricing, native strategy, or tenant architecture.

**2026-09-16 (PR #39):** Cancellation confirmation P1 and repeated-cancel waitlist idempotency P1 **CLOSED / PRODUCTION ACCEPTED**. Accepted PR #39 runtime / Production release SHA `0f0c376cdc2a0d7e80da94859f37ec918acf16d6`, deployment `dpl_E4CgoSXtXuVNavH3xuphDAYDyBHA`. Historical GitHub main identity at the PR #40 docs restamp base was `0f0c376`. Booking Sheet Cancel is confirmation-gated; `waitlist_notify` enqueues only on a real `appointment.cancelled` event. Hosted Staging acceptance was enqueue-only. Phase 5 **IN PROGRESS**. HQ booking, reschedule, and cancellation lifecycle slices are now accepted. GVM still waits for a legitimate Production booking. No change to the 18 workstreams, windows, pricing, native strategy, or tenant architecture.

**2026-09-16 (PR #37):** Reception reschedule-notification P1 **CLOSED / PRODUCTION ACCEPTED**. Accepted PR #37 runtime / Production release SHA `f36a7aaf7d5b601c2fa2c914cb89d125cf18eab2`, deployment `dpl_3zx6E7Ck22xYNdHTxiJ6xBVk9U2M`. Historical GitHub main identity at the PR #38 docs restamp base was `f36a7aa`. Start **or** end customer-visible range change is `appointment.rescheduled`. Hosted Staging acceptance was enqueue-only. Phase 5 **IN PROGRESS**. GVM still waits for a legitimate Production booking. No change to the 18 workstreams, windows, pricing, native strategy, or tenant architecture.

**2026-09-16 (Auth closeout):** Staging Auth **PASS / CLOSED / FROZEN**. Production password-reset completion **P1 CLOSED** (token_hash Reset Password href accepted; one GVM Production E2E passed). Broader Production recovery remains **CLOSED**. Cross-session Auth (TD-H10) and `/rest/v1/` env debt (TD-H11) remain separate and non-blocking. State-ambiguity prevention is governed in bounded slices alongside Phase 5 and is required before Outside Private Alpha; it is **not** a Phase 5 blocker. Then-canonical main `4f7da8fbadf9ab882be07b0112bee0c53d74913c`. No change to the 18 workstreams, windows, pricing, native strategy, or tenant architecture.

**2026-09-14:** PR #32 merged; then-canonical main / Production SHA `8df29d298c196a2431c86a8cea4af1e5bfec09fd`, deployment `dpl_3wENSHQrTUnu6VkaqjE7coJ4kjbn`, release ACCEPTED; all three aliases aligned. Protected git-main SSO is expected security behavior, not application failure. Production recovery CLOSED; public GVM exposure 3/3 PASS; worker reliability and Package A accepted. Phase 5 IN PROGRESS. First legitimate GVM booking + dual-email delivery and HQ dogfood remain operational validation. Outside Private Alpha NOT STARTED; Gate B NOT MET. [Recovery closeout](./recovery/PRODUCTION_RECOVERY_CLOSEOUT_20260914.md) records deployment and evidence. No change to the 18 workstreams, windows, or native strategy.

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

Square Appointments · Vagaro · Jane · Fresha · Booksy · GlossGenius · Mangomint · Boulevard · Acuity · Calendly · Mindbody

Reach a credible parity floor in essential operations; differentiate through connected intelligence, Command Centre clarity, Summer recommendations, safe permissioned actions, auditability, financial truth, simplicity and switching/onboarding speed. Competitor breadth does not authorize uncontrolled scope.

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
| Blocking issue | Remaining craft: Booking Sheet collect-payment stub; dual communications stacks; `create_public_appointment` vs Booking Engine write path; resources migration `036` unapplied (flag off). |
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
| Notes | Auth surfaces exist. Paid-plan assignment hole closed in PR #29. Password-reset **completion** P1 **CLOSED 2026-09-16** (token_hash template + GVM Production E2E). Remaining Auth follow-up is TD-H10 cross-session / correct-account, not this workstream’s closed P1. Multi-staff login is workstream 6, not a silent claim of this row. |

---

### 3. Safe Tenant Provisioning / Onboarding

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — a new business must become a real tenant without identity collisions or fake “you’re live” states. |
| Status | **PARTIAL** |
| Current owner / current task | Engineering — preserve #72 Production-accepted identity safety. Current implementation uses membership-first resolution, explicit create/join onboarding, conservative ambiguity stop and service-only governed atomic tenant creation. Authentication/dashboard reads no longer create tenants. |
| Blocking issue | #72 Production rollout acceptance is COMPLETE; #73 switching/import remains the next readiness gate. Setup may legitimately remain incomplete after creation. |
| Acceptance condition | New owner gets one business, a unique booking slug, and an honest setup checklist; Tenant Identity Safety Gate remains enforced; no second GVM-style public-slug collision. |
| Target completion window | Before selected outside Private Alpha (October–November 2026) |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** if a second identity collision ships to a paying or public tenant |
| Notes | Gate: [`TENANT_IDENTITY_SAFETY_GATE.md`](./TENANT_IDENTITY_SAFETY_GATE.md). HQ Staging setup was still incomplete (no services) during Phase 3 review — expected dogfood gap, not a product defect. #72 Staging acceptance is complete, including exact-once creation, complete seeds, ambiguity stop and post-create router-cache correction. Production rollout passed; #73 Package A is now active. |

---

### 4. Commercial SaaS Lifecycle

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — commercially launchable v1 cannot mint fake paid invoices or pretend self-serve billing is live. Operators need a truthful plan/subscription path. Full paid-provider lifecycle is **Gate B**, later than Phase 4A. |
| Status | **PARTIAL** |
| Private Alpha billing readiness | **Gate A COMPLETE** (PR #29, `f6517a1`) |
| Commercial v1 billing readiness | **NOT MET** — Gate B is the explicit chapter after Outside Private Alpha readiness |
| Current owner / current task | Engineering / Founder — Gate A shipped. **Do not start Gate B yet.** Outside Private Alpha readiness is current; Gate B follows after that readiness chapter. |
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

**STATUS:** EXPLICIT POST-PHASE-5 PRIORITY / **NOT MET**

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
- pricing-math reconciliation and truthful account lifecycle

Pricing remains configurable. Annual principle: **PAY FOR 10 MONTHS AND RECEIVE 2 MONTHS FREE**, not “20% off.”

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
| Current owner / current task | Engineering / Product — resolve commercial-v1 staff login, invitations, roles, permissions and owner/admin boundaries before team claims. Role catalog exists; owner-always permissions today (`TD-H6`). |
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
| Target completion window | Preserve grounded launch truth; horizontal v1 is the explicit post-Phase-5 chapter after Gate B, with scope approved separately; full autonomy remains longer-term |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **NO** if claims stay grounded; **YES** if marketing implies autonomous OS manager |
| Notes | Command Centre V1 is grounded-only. Competitor check: OpenAI contextual intelligence without gimmicks — current strength is assist, not autopilot. **Explicit horizontal-v1 priority after Gate B; no implementation in this restamp.** |

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
| Launch classification | **LAUNCH REQUIRED foundation COMPLETE.** Deep APM/provider expansion is **IMPORTANT BUT POST-LAUNCH SAFE / separately governed**. |
| Status | **COMPLETE — provider-off foundation accepted** |
| Current owner / current task | No active observability implementation. Issue #65 is closed. Production Sentry activation remains a later explicit Product Owner gate, not a prerequisite to continue Outside Private Alpha readiness. |
| Blocking issue | **None for the defined foundation.** Direct Production endpoint identity remains UNKNOWN beyond the last directly observed runtime baseline; do not infer it from deployment success. |
| Acceptance condition | Met through PRs #67/#70/#74/#76: supported error hooks, safe context/correlation, truthful worker visibility, outbound privacy hardening, provider-off safety and documented activation preflight. |
| Target completion window | Completed 2026-09-20; retain/regression-test through launch |
| Launch risk | **GREEN for foundation / AMBER operationally until real provider activation is separately chosen** |
| Threatens Dec 2026–Feb 2027? | **NO as an open foundation blocker** |
| Notes | Do not create another observability phase merely because deeper monitoring is possible. Activate/configure external telemetry only under a separate consequential gate. |

---

### 14. GVM Baby World Pilot Stability

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** for planning target #1 (Late Sep–Oct 2026). Not the entire product roadmap. |
| Status | **PHASE 5 GATE MET / ongoing real-use hardening** |
| Current owner / current task | Founder + GVM + Engineering — continue genuine pilot operation and capture new launch-required defects only when evidence appears. Do not manufacture replacement acceptance evidence. |
| Blocking issue | No Phase 5 blocker remains. Ongoing pilot quality issues are handled as bounded launch-hardening work. |
| Acceptance condition | GVM completes a legitimate booking with customer confirmation email AND business new-booking email, each arriving once; `/book/gvm-baby-world` stays on tenant `a04e1d65-eeb9-4d72-a5bf-739a9038bb91`; no identity regression. |
| Target completion window | Late September–October 2026 |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** if the founding design partner cannot actually run the product |
| Notes | [`GVM_GO_LIVE.md`](./GVM_GO_LIVE.md) contains historical checkboxes — do not treat “apply 001→022” as current. |

---

### 15. Chasum HQ Pilot Stability

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** for planning target #1 — dogfood the **normal HQ tenant**, not `/dashboard/hq`. |
| Status | **PHASE 5 GATE MET / ongoing dogfood** |
| Current owner / current task | Founder — continue operating Chasum HQ as a normal tenant for real internal use; capture friction without creating HQ-only product forks. |
| Blocking issue | No Phase 5 blocker remains. Day-to-day dogfood continues as evidence for Outside Private Alpha readiness and future product hardening. |
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
| Status | **READINESS IN PROGRESS / outside tenant not yet onboarded** |
| Current owner / current task | Control Tower + Engineering + Founder — complete the minimum readiness gates, then select 1–2 outside design partners. Phase 4A already supplies an honest plan-assignment path. |
| Blocking issue | Meaningful Production observability/trace-correlation, tenant onboarding/identity safety, and governed switching/import readiness remain before broader outside use. |
| Acceptance condition | At least one non-GVM / non-HQ service business completes setup, a real booking path, and a week of Command Centre/Reception use without a P0 tenant-isolation or money-truth failure. |
| Target completion window | October–November 2026 |
| Launch risk | **AMBER** |
| Threatens Dec 2026–Feb 2027? | **YES** if commercial v1 is attempted with only internal tenants |
| Notes | Invite-only. No public acquisition push. Gate A complete is a prerequisite, not a substitute for a real outside tenant. |

---

#### Outside Private Alpha capability gates

Before broader Outside Private Alpha, prove meaningful Production error visibility and trace/correlation sufficient to investigate failures without another blind Gateway Timeout campaign. Evaluate Sentry / OTel or equivalent as a separate scoped task; do not reopen historical incidents absent new contradictory runtime evidence.

Switching/import/migration is a **product capability**, not merely support work. Readiness requires a governed importing/mapping path for customers, staff, services and future appointments, with other entities justified later. Summer-assisted migration/onboarding remains a strategic opportunity. Tenant onboarding/identity safety remains mandatory. This restamp does not implement import tooling.

### 17. Production Release / Launch Hardening

| Field | Value |
|-------|--------|
| Launch classification | **LAUNCH REQUIRED** — do not sell a product Production is not actually serving. |
| Status | **PARTIAL** |
| Current owner / current task | Codex / ChatGPT — recovery CLOSED; subsequent accepted releases include PR #59 direct Production runtime verification and PR #63 Production acceptance. Main is now protected by repository ruleset #23730556. |
| Blocking issue | Recovery is closed; ongoing operational validation and launch readiness remain. |
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
| Current owner / current task | Founder / Engineering — preserve architecture for one reusable multi-tenant native surface. **Do not** start material native implementation during the current Outside Private Alpha readiness task. Continue capturing mobile-web evidence. |
| Blocking issue | Core operating flows still need commercial-readiness depth (Outside Private Alpha readiness, practical RBAC decision, Gate B) before native material implementation becomes the nearer launch priority. |
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

1. **Phase 5 is COMPLETE.** GVM genuine Production booking + customer/business email evidence and HQ connected-chain evidence are accepted. Do not keep operational validation as the program blocker.
2. **Outside Private Alpha readiness is now the near gate.** Production observability/trace-correlation, tenant onboarding/identity safety, and governed switching/import capability must be credible before inviting broader outside design partners.
3. **Commercial SaaS lifecycle remains trailing.** Gate A is COMPLETE; **Gate B** live-provider billing is still required before commercially launchable v1 and remains after Outside Private Alpha readiness.
4. **Practical RBAC remains a commercial-v1 gate before team claims.** Private Alpha Trusted Admin is not the final employee permission model.
5. **Core operations are the strongest axis.** Booking, Reception, CRM, money truth, customer communications, Command Centre and governed release discipline have materially matured; this is why the target remains AMBER rather than RED.
6. **Migration/debt risk remains scheduled, not silently solved.** Historical 034–036 and residual tenancy/security debt require governed handling when their specific work enters scope.

No unsupported schedule promise: Oct–Nov outside Private Alpha depends on readiness gates above; Dec–Feb commercial v1 still requires Gate B plus the minimum RBAC/commercial operating contract.

---

## Phase 4A impact on this tracker

Improved (not DONE):

| Workstream | Impact |
|------------|--------|
| 4. Commercial SaaS Lifecycle | Gate A **COMPLETE**. Signup cannot grant paid plans. Mock tenant lifecycle locked. Manual `/owner` assignment path exists. Workstream stays **PARTIAL** until Gate B. |
| 5. Entitlements / Plan Limits | Assigned product plan is now truthful, so staff-quota fences follow real `/owner` assignment rather than signup theater. Remaining fences unchanged. |
| 8. Platform Admin / Control Centre | Plan + Private Alpha visibility and bounded starter/professional assignment shipped. Controlled Private Alpha ops bar met; commercial-v1 usage/health/trial depth not. |
| 11. Support / Recovery / Operational Admin | Operators can see truthful plan/arrangement state while doing white-glove support. Help center still not in scope. |
| 16. Selected Outside Private Alpha | Honest onboarding/billing arrangement path exists. **Readiness is now IN PROGRESS**; broader outside tenant onboarding waits on observability, identity-safety and switching/import gates rather than Phase 5. |

Production pin / recovery acceptance and Phase 5 pilot acceptance **ARE COMPLETE**. Still open: Outside Private Alpha readiness, Gate B, practical RBAC before team claims, deeper Summer Business Manager capability, outside design-partner validation, and native implementation under its existing governed timing.

---

## Recommended next major phase

**OUTSIDE PRIVATE ALPHA READINESS**

**STATUS:** IN PROGRESS

This is the immediate post-Phase-5 readiness chapter. It is not an invitation to start Gate B, full RBAC, Summer horizontal-v1 implementation, or native apps simultaneously.

| Field | Value |
|-------|--------|
| Exact phase name | **Outside Private Alpha readiness** |
| Launch classification | **LAUNCH REQUIRED** before broader selected design-partner onboarding |
| Primary tracker workstreams | **13** Observability / Errors / Recovery; **3** Safe Tenant Provisioning / Onboarding; **16** Selected Outside Private Alpha; switching/import capability spans onboarding and Core Operations. |
| Why now | Phase 5 real-use proof is complete. The next launch risk is inviting outsiders before Chasum can diagnose failures, onboard tenants safely, and help them switch from incumbent systems without manual developer reconstruction. |
| Exact launch dependency | Before broader outside Private Alpha, Chasum must have meaningful Production error visibility/trace-correlation, tenant identity/onboarding safety, and a governed migration/import path appropriate to the selected design partners. |
| First bounded task | **Issue #73 Package B1 Level-3 candidate review.** Package A is Production accepted. B1 migration code is implemented/NOT APPLIED; B2 is NOT AUTHORIZED. Revised D3 keeps reconciliation REVIEW/BLOCK with no payment-status change. |
| Acceptance condition | (1) Production failures can be investigated with sufficient error/trace context; (2) onboarding identity safety is accepted for an outside tenant; (3) switching/import contract covers at least customers, staff, services and future appointments or has an explicit bounded manual/assisted path; (4) at least one selected outside tenant can be onboarded without developer-only tenant surgery; (5) no P0 tenant/money-truth regression. |
| Likely risk level | Read-only assessment = low. Instrumentation/provider/config changes can become LEVEL 2/3 depending on Production secrets, PII, vendor SDKs and rollout. Import/onboarding writes are separately risk-classified. |
| Competitive gate | Observability/internal maintenance is normally **NOT_APPLICABLE** with a concrete reason. Customer-facing onboarding/import work is **REQUIRED** and must benchmark switching/onboarding workflows before implementation. |
| Must remain out of scope for first task | Gate B billing, full employee RBAC build, Summer horizontal-v1 expansion, native app implementation, branded-domain cutover, unrelated migration replay. |
| Effect on Oct–Nov outside Private Alpha | **Direct blocker / protector.** This chapter is the gate. |
| Effect on Dec–Feb commercial v1 | **Protects** by reducing support/identity/switching risk before Gate B and broader commercial commitments. |

### Locked operating queue

Source-of-truth restamp  
→ **Outside Private Alpha readiness**  
→ Commercial SaaS Gate B  
→ Summer Business Manager horizontal v1

Core Operations launch-required defects continue throughout. GVM and HQ continue real use as validation tenants, but neither is a product fork or a reason to delay all other work.

### Parallel work — keep bounded

1. **GVM + HQ real-use hardening:** continue genuine use and capture concrete defects; do not manufacture Production tests.
2. **Outside-tenant onboarding/import contract:** #72 is Production accepted; #73 Package A is merged/Production accepted as the pure preview foundation. B1 is an unapplied Level-3 candidate; B2 remains separately governed and NOT authorized.
3. **Security/config hygiene:** remove historical temporary Preview credentials/config only after dependency checks and explicit approval when irreversible.

### Separate later gates

| Candidate | Verdict |
|-----------|---------|
| Gate B (commercial-v1 paid billing) | **Explicit major priority after Outside Private Alpha readiness.** LEVEL 3; separately scoped/approved. Required before commercially launchable v1. |
| Launch-critical RBAC | **Commercial-v1 decision gate before team claims.** Define minimum staff login, invitations, roles, permissions and owner/admin boundaries; Trusted Admin V1 is not final RBAC. |
| `/owner` expansion | Later, driven by commercial operations needs rather than Phase 5. |
| Summer OS-manager depth | **Summer Business Manager horizontal v1 after Gate B** as the next major intelligence chapter; preserve UNDERSTAND → EXPLAIN → RECOMMEND → ACT WITH PERMISSION → AUDIT. |
| Native iOS / Android apps | Begin material implementation after the Native App Start Gate, early enough for real testing before broader public launch. |
| Branded Production domain | **DEFERRED** by Product Owner; revisit near branded launch with fresh DNS/Auth preflight. |

