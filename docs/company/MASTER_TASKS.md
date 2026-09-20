# Master Tasks

**Status:** Active development backlog  
**Parent:** [`CHASUM_BIBLE.md`](./CHASUM_BIBLE.md)  
**Roadmap:** [`MASTER_ROADMAP.md`](./MASTER_ROADMAP.md)
**Handoff:** [`../CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md) control board is the current NEXT authority.

Update this file at the start of every sprint. It is the working queue — not a historical archive (history belongs in CHANGELOG + roadmap completed tables).

---

**Engineering ownership:** Darshan = Founder / CEO / Product Owner. ChatGPT = Control Tower / Product & Development Program Lead. **Codex = PRIMARY NORMAL ENGINEERING IMPLEMENTER.** Claude = independent auditor where risk warrants. Momentic = browser/workflow regression. Cursor = fallback/local authenticated operator for bounded work when justified. One primary implementer per task; no racing.

**Anti-stall:** A blocker in one lane — deployment, authentication, external customer event, credential gate, agent capacity/credits, or approval — does not authorize unsafe work, but it also must not idle the entire Chasum program. While one lane is waiting, other safe approved work should continue where useful (read-only investigation, source-of-truth reconciliation, regression preparation, audit preparation, bounded design analysis). Production safety and approval gates remain fully enforced.

## Current release

**Current accepted application release:** PR #63 squash merge `ef9d2799c5f39abbcd1e3478f828f5f3443d54ea` — Issue #62 CLOSED / PRODUCTION ACCEPTED. Vercel reported deployment completed; Production GVM tenant/schema/address state was read-only verified. Direct Production `/api/build-info` / `/api/health` were not freshly observed for PR #63 and are not claimed.

**Last direct runtime-endpoint verified Production baseline:** `3629004e05fb0a921ab96954ab701eb4a2f4cd5a` (PR #59 / Issue #58). Production build-info/health, GVM tenant identity, and true 1366/1024/1180 Reception viewport checks passed.

**Phase 5:** COMPLETE. Genuine GVM Production booking + customer confirmation + business new-booking email evidence is accepted; Issue #47 and Issue #54 are CLOSED.

**Current program phase:** Outside Private Alpha readiness.

**Repository governance:** main is protected by ruleset `23730556` (“Chasum main governed release”): PR required, checks `Vercel` + `competitive-product-gate`, strict/up-to-date, review-thread resolution, force-push/deletion blocked, PR-only admin bypass.

**Working name:** World Class AI Business Operating System — Outside Private Alpha readiness chapter.

**Release intent:** preserve accepted Core Operations and Phase 5 evidence while making Chasum supportable for selected outside design partners. Observability Phase A and B2 are Production accepted; the immediate remaining observability slice is Issue #68/B1 framework + client-safe capture integration. After that, continue tenant onboarding/identity safety → governed switching/import capability. Gate B, full employee RBAC, Summer horizontal-v1 implementation, native apps, and branded-domain cutover remain separate later gates.

**Obsolete (do not follow as current sprint):** “Company OS + AI Receptionist foundation” on `cursor/phase-3-integrations`; “apply migrations 001 → 022”; treat Emma as the current AI slice; “Phase 5 still waits for first GVM booking.” Those are historical. Migrations far beyond 022 are in use; Emma is a legacy Summer alias; Phase 5 is complete.

---

## Current sprint

1. **Issue #68 / Observability Phase B1 — ACTIVE / Codex-owned.** Reconcile Codex work onto current main, preserve accepted B2 worker-health truth, run tests/Preview/Vercel + Claude audit, then bring only the genuine merge decision. Production Sentry/provider activation remains separately PO-governed.
2. Tenant onboarding / identity safety acceptance for an outside design partner.
3. Governed switching/import/migration capability for customers, staff, services and future appointments; Summer-assisted migration remains an opportunity, not the current implementation mandate.
4. Commercial SaaS Gate B — after Outside Private Alpha readiness; separately scoped/approved.
5. Summer Business Manager horizontal v1 — after Gate B; separately scoped/approved.

Core Operations launch-required defect work continues throughout. GVM and HQ remain validation tenants, not product forks.

This documentation does not authorize consequential Production instrumentation/provider changes. Read-only assessment may proceed automatically; vendor/config/secret rollout remains Product Owner-governed.

Momentic is **complete** (PRs #20 / #21, Chasum Test Studio). Use it as a booking-path canary — not as a sprint theme.

---

## High priority

### Platform / World Class

- [x] Claude pre-challenge + Minimum Necessary Diff: approved World Class grouped nav onto `main` (PR #23)
- [x] World Class Phase 2: staff plan honesty (active-staff quota wiring) — merged PR #25
- [x] World Class Phase 3: Command Centre / Today experience — merged PR #27
- [x] World Class Phase 4A: Commercial SaaS Lifecycle Honesty (Gate A / Private Alpha billing) — **COMPLETE / MERGED TO MAIN** (PR #29); does **not** mark Commercial SaaS DONE (see [`../LAUNCH_READINESS.md`](../LAUNCH_READINESS.md))
- [x] World Class Phase 5: Production Pin and Design-Partner Pilot Stabilization — **COMPLETE** (Issue #47 / #54)
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

- [ ] **CURRENT:** Production error visibility and trace/correlation sufficient to investigate failures without a blind Gateway Timeout campaign; separately evaluate Sentry / OTel or equivalent before broader Outside Private Alpha.
- [ ] Governed switching/import/migration as a product capability: map customers, staff, services and future appointments; additional entities as justified. Summer-assisted migration/onboarding remains a strategic opportunity.
- [ ] Tenant onboarding and identity safety acceptance.

### Intelligence

- [ ] Summer Business Manager horizontal v1 — explicit major chapter after Gate B; authoritative cross-domain understanding, explanation, recommendation, permissioned action and audit (not already delivered).
- [ ] Keep Chase read-oriented; do not invent KPIs

### Core Operations / validation (do not let these dominate the whole backlog)

- [ ] Reception + CRM communication: real Twilio/Resend paths verified in staging/production
- [x] GVM Phase 5 validation: legitimate Production booking + customer and business emails accepted; ongoing real-use hardening continues without manufactured tests.
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
