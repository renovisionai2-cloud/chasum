# Master Tasks

**Status:** Active development backlog  
**Parent:** [`CHASUM_BIBLE.md`](./CHASUM_BIBLE.md)  
**Roadmap:** [`MASTER_ROADMAP.md`](./MASTER_ROADMAP.md)
**Handoff:** [`../CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md) control board is the current NEXT authority.

Update this file at the start of every sprint. It is the working queue — not a historical archive (history belongs in CHANGELOG + roadmap completed tables).

---

**Engineering ownership:** Darshan = Founder / CEO / Product Owner. ChatGPT = control tower / Product & Development Program Lead. Cursor = primary implementation engineer unless otherwise directed. Claude = independent auditor for higher-risk work. Momentic = browser/workflow regression. Codex may be used where useful and available; Codex availability/capacity must not block Chasum progress and is not permanent product truth. One primary implementer per task.

**Anti-stall:** A blocker in one lane — deployment, authentication, external customer event, credential gate, agent capacity/credits, or approval — does not authorize unsafe work, but it also must not idle the entire Chasum program. While one lane is waiting, other safe approved work should continue where useful (read-only investigation, source-of-truth reconciliation, regression preparation, audit preparation, bounded design analysis). Production safety and approval gates remain fully enforced.

## Current release

**Accepted PR #41 runtime / Production release baseline:** `35ba43fd3c9c7e854ea11d558571e8456ed43079`. **main at this docs restamp base:** `35ba43fd3c9c7e854ea11d558571e8456ed43079`. Current GitHub main identity is repository HEAD and may advance through documentation-only restamps without changing that accepted PR #41 runtime behavior. A docs-only automatic Vercel deployment may also become the current serving deployment; verify serving identity from `/api/build-info`. Cancelled-appointment terminal-state integrity P1 **CLOSED / PRODUCTION ACCEPTED**. Cancellation confirmation P1 remains **CLOSED / PRODUCTION ACCEPTED**. Repeated-cancel waitlist idempotency P1 remains **CLOSED / PRODUCTION ACCEPTED**. Reception reschedule-notification P1 remains **CLOSED / PRODUCTION ACCEPTED**. Password-reset completion P1 **CLOSED**. Broader Production recovery remains **CLOSED**. Phase 5 **IN PROGRESS**.

**Working name:** World Class AI Business Operating System — launch-readiness chapter
**Branch workflow:** Subsequent approved work branches from then-current main. PR #32 (`8df29d298c196a2431c86a8cea4af1e5bfec09fd`) remains the 2026-09-14 recovery-closeout identity, not a claim that main never moved.

**Release intent:** Recovery CLOSED; Auth reset-completion P1 CLOSED; Reception reschedule-notification P1 CLOSED / PRODUCTION ACCEPTED; cancellation confirmation P1 CLOSED / PRODUCTION ACCEPTED; repeated-cancel waitlist idempotency P1 CLOSED / PRODUCTION ACCEPTED; cancelled-appointment terminal-state integrity P1 CLOSED / PRODUCTION ACCEPTED; Phase 5 IN PROGRESS. Phases 1–4A merged; Gate A complete, Commercial SaaS Lifecycle PARTIAL and Gate B NOT MET. GVM and HQ remain normal validation tenants. No recovery reopening absent new contradictory runtime evidence. Cross-session Auth (TD-H10) and `/rest/v1/` env (TD-H11) are separate non-blocking follow-ups. Staging queue/worker health and Staging-only Resend capability are separate operational debt, not PR #41 failures. Live authenticated API smoke remains deferred until HQ has a governed Staging API credential; do not create a key from this restamp. ChatGPT control tower / Product Owner selects the next bounded Phase 5 lifecycle slice after this source-of-truth restamp.

**Obsolete (do not follow as current sprint):** “Company OS + AI Receptionist foundation” on `cursor/phase-3-integrations`; “apply migrations 001 → 022”; treat Emma as the current AI slice. Those were historical. Migrations far beyond 022 are in use; Emma is a legacy Summer alias.

---

## Current sprint

1. GVM + Chasum HQ Phase 5 validation **in parallel**. HQ booking, reschedule, cancellation confirmation, waitlist idempotency, and cancelled terminal-state integrity slices are now accepted. ChatGPT control tower / Product Owner will select the next bounded Phase 5 lifecycle slice after this source-of-truth restamp. GVM still waits for the next legitimate Production booking for exactly-once confirmation/business-notification evidence — observe passively; do not manufacture a GVM booking. Engineering must not wait idle for a GVM customer.
2. Outside Private Alpha readiness, including observability, switching/import capability and tenant onboarding/identity safety.
3. Commercial SaaS Gate B — explicit major post-Phase-5 priority; separately scoped and approved before implementation.
4. Summer Business Manager horizontal v1 — explicit major post-Phase-5 priority; separately scoped and approved before implementation.

Core Operations launch-required defect work continues throughout. GVM and HQ are validation tenants, not product forks; neither may dominate the roadmap.

This documentation does not authorize implementation expansion.

Momentic is **complete** (PRs #20 / #21, Chasum Test Studio). Use it as a booking-path canary — not as a sprint theme.

---

## High priority

### Platform / World Class

- [x] Claude pre-challenge + Minimum Necessary Diff: approved World Class grouped nav onto `main` (PR #23)
- [x] World Class Phase 2: staff plan honesty (active-staff quota wiring) — merged PR #25
- [x] World Class Phase 3: Command Centre / Today experience — merged PR #27
- [x] World Class Phase 4A: Commercial SaaS Lifecycle Honesty (Gate A / Private Alpha billing) — **COMPLETE / MERGED TO MAIN** (PR #29); does **not** mark Commercial SaaS DONE (see [`../LAUNCH_READINESS.md`](../LAUNCH_READINESS.md))
- [ ] World Class Phase 5: Production Pin and Design-Partner Pilot Stabilization — **IN PROGRESS**
- [ ] Commercial v1 paid billing (Gate B) — explicit post-Phase-5 chapter after Outside Private Alpha readiness; LEVEL 3; Claude pre-challenge before implementation
- [ ] Later PO decision on `/dashboard/hq` disposition (move to `/owner`, relabel, or retire) — **no expansion until then**

### Commercial SaaS (currently trailing Core Operations)

These Stripe / paid-lifecycle items are **Gate B** (commercial-v1 paid billing). They are **not** Phase 4A and do **not** become DONE when Private Alpha billing honesty ships.

- [ ] Stripe live provider behind existing billing interface (paid self-serve conversion)
- [ ] SaaS billing lifecycle maturity (upgrade / downgrade / cancellation)
- [ ] Failed-payment / dunning recovery
- [ ] Mature plan entitlement enforcement
- [ ] Before commercial-v1 team claims, decide minimum staff login, invitations, roles, permissions and owner/admin boundaries. If paid plans promise team access, practical RBAC is LAUNCH REQUIRED; otherwise product/marketing must explicitly describe owner-operated v1.
- [ ] Account lifecycle and usage / account-health depth

### Outside Private Alpha readiness

- [ ] Production error visibility and trace/correlation sufficient to investigate failures without a blind Gateway Timeout campaign; separately evaluate Sentry / OTel or equivalent before broader Outside Private Alpha.
- [ ] Governed switching/import/migration as a product capability: map customers, staff, services and future appointments; additional entities as justified. Summer-assisted migration/onboarding remains a strategic opportunity.
- [ ] Tenant onboarding and identity safety acceptance.

### Intelligence

- [ ] Summer Business Manager horizontal v1 — explicit major chapter after Gate B; authoritative cross-domain understanding, explanation, recommendation, permissioned action and audit (not already delivered).
- [ ] Keep Chase read-oriented; do not invent KPIs

### Core Operations / validation (do not let these dominate the whole backlog)

- [ ] Reception + CRM communication: real Twilio/Resend paths verified in staging/production
- [ ] GVM validation remaining: legitimate booking observation + customer and business emails, each exactly once — see [`../GVM_GO_LIVE.md`](../GVM_GO_LIVE.md) (not automatic product NEXT #1)
- [ ] Reports: scheduled email delivery worker (CRUD exists; send pipeline next)

### Engineering gates (visible; not this sprint’s product story unless PO schedules)

- [ ] Migrations 034–036 still UNAPPLIED — do not apply without PO
- [ ] Restore 037/038 executable SQL into repo history (applied in DBs)
- [ ] Remaining Track 3 / RLS hardening

---

## Medium priority

- [ ] Alex: waitlist auto-fill suggestions with owner approval
- [ ] Inventory & Products schema + Business/Reports wiring
- [ ] Marketing automation MVP (segments + approved campaigns)
- [ ] Customer portal polish (memberships/packages/gift cards beyond scaffold)
- [ ] Square research spike (payments + in-person)
- [ ] Enterprise: org / multi-business admin spike
- [ ] Native mobile / App Store readiness (tracker workstream 18) — **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY**; **NOT STARTED / PLANNED**; working direction React Native + Expo; final stack confirmed at native-app preflight; one reusable multi-tenant app
- [ ] Marketplace: API partner guidelines draft
- [ ] Booking resources (`036`) when a tenant needs concurrent room/chair truth
- [ ] Unify `create_public_appointment` write path with Booking Engine facade
- [ ] Collapse dual communications stacks; dual Emma/Summer path; dual Chase routes

---

## Low priority

- [ ] Voice calling for Summer (architecture reserved; implement later)
- [ ] Advanced AI Workforce collaboration graphs
- [ ] Version 2 design-system evolution (explicit project only)
- [ ] Nice-to-have analytics visualizations beyond current charts
- [ ] Idea parking lot promotions (see `docs/product/99_IDEA_PARKING_LOT.md`)
- [ ] Home page (`/`) when product owner directs — marketing locks otherwise stand

---

## Development rules (mandatory)

Every development session that changes the product:

1. **Read** [`CHASUM_BIBLE.md`](./CHASUM_BIBLE.md), [`PRODUCT_PRINCIPLES.md`](./PRODUCT_PRINCIPLES.md), and [`../CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md) first.
2. **Implement** only the scoped task; do not redesign unrelated UI or modules.
3. **Run** `npm run lint`
4. **Run** `npm run build`
5. **Fix** all issues introduced.
6. **Update** `docs/CHANGELOG.md`
7. **Commit** with a concise, why-focused message
8. **Push** the branch

Documentation-only sessions still commit and push when the PO asks. Application sessions must not skip lint/build.

Level 3 work (tenancy, RLS, billing, booking architecture, **navigation architecture**, migrations, tenant identity, Production data) requires Claude independent pre-challenge before primary-engineer implementation.

---

## Definition of done (task-level)

- Matches Product Principles and Bible standards  
- Multi-tenant safe  
- Loading / empty / error covered where UI changed  
- CHANGELOG updated  
- Lint + build clean  
- Committed and pushed  

---

*Chasum Company Operating System — Master Tasks*
