# Master Tasks

**Status:** Active development backlog  
**Parent:** [`CHASUM_BIBLE.md`](./CHASUM_BIBLE.md)  
**Roadmap:** [`MASTER_ROADMAP.md`](./MASTER_ROADMAP.md)
**Handoff:** [`../CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md) control board is the current NEXT authority.

Update this file at the start of every sprint. It is the working queue — not a historical archive (history belongs in CHANGELOG + roadmap completed tables).

---

## Current release

**Working name:** World Class AI Business Operating System — launch-readiness chapter
**Branch focus:** `main` (`0c61a8d` at this stamp)

**Release intent:** Continue from current `main` only. Phases 1–3 are merged (PRs #23 / #25 / #27). Sequence the next product slice from [`../LAUNCH_READINESS.md`](../LAUNCH_READINESS.md). Recommended **Phase 4A:** **Commercial SaaS Lifecycle Honesty** (Gate A / Private Alpha billing) — **not started**. Completing 4A does **not** mark Commercial SaaS Lifecycle DONE. Gate B (commercial-v1 paid billing) is later. Do **not** merge `origin/cursor/world-class-portal-foundation`. GVM and Chasum HQ remain **normal validation tenants**.

**Obsolete (do not follow as current sprint):** “Company OS + AI Receptionist foundation” on `cursor/phase-3-integrations`; “apply migrations 001 → 022”; treat Emma as the current AI slice. Those were historical. Migrations far beyond 022 are in use; Emma is a legacy Summer alias.

---

## Current sprint

World Class Phases 1–3 are merged. Then, in order:

1. **Do not start Phase 4A in this documentation stamp.** Recommended next product slice from the launch tracker: **Phase 4A Commercial SaaS Lifecycle Honesty** (Gate A; LEVEL 2 if no provider/migration/webhook/Production billing-data changes). Completing 4A does **not** mark Commercial SaaS DONE. Gate B (live paid-provider lifecycle) is LEVEL 3 and requires Claude pre-challenge before implementation.
2. **Parallel validation:** GVM + Chasum HQ stable pilot (Late Sep–Oct 2026).
3. **Do not** merge or rebase `origin/cursor/world-class-portal-foundation`. Reference only.
4. **Do not** fix DashboardTopNav overflow, tenancy, booking-engine, commerce formulas, or `/dashboard/hq` unless the tracker reclassifies them.

Momentic is **complete** (PRs #20 / #21, Chasum Test Studio). Use it as a booking-path canary — not as a sprint theme.

---

## High priority

### Platform / World Class

- [x] Claude pre-challenge + Minimum Necessary Diff: approved World Class grouped nav onto `main` (PR #23)
- [x] World Class Phase 2: staff plan honesty (active-staff quota wiring) — merged PR #25
- [x] World Class Phase 3: Command Centre / Today experience — merged PR #27
- [ ] World Class Phase 4A: Commercial SaaS Lifecycle Honesty (Gate A / Private Alpha billing) — **recommended, not started**; does **not** mark Commercial SaaS DONE (see [`../LAUNCH_READINESS.md`](../LAUNCH_READINESS.md))
- [ ] Commercial v1 paid billing (Gate B) — later; LEVEL 3; Claude pre-challenge before implementation
- [ ] Later PO decision on `/dashboard/hq` disposition (move to `/owner`, relabel, or retire) — **no expansion until then**

### Commercial SaaS (currently trailing Core Operations)

These Stripe / paid-lifecycle items are **Gate B** (commercial-v1 paid billing). They are **not** Phase 4A and do **not** become DONE when Private Alpha billing honesty ships.

- [ ] Stripe live provider behind existing billing interface (paid self-serve conversion)
- [ ] SaaS billing lifecycle maturity (upgrade / downgrade / cancellation)
- [ ] Failed-payment / dunning recovery
- [ ] Mature plan entitlement enforcement
- [ ] Staff roles / permissions enforcement for multi-staff login (RBAC)
- [ ] Account lifecycle and usage / account-health depth

### Intelligence

- [ ] Deepen Summer toward AI Business Manager actions on authoritative data (do not claim this is already done; current strength is booking / availability / CRM-grounded assist)
- [ ] Keep Chase read-oriented; do not invent KPIs

### Core Operations / validation (do not let these dominate the whole backlog)

- [ ] Reception + CRM communication: real Twilio/Resend paths verified in staging/production
- [ ] GVM validation remaining: first real appointment + production email SMTP — see [`../GVM_GO_LIVE.md`](../GVM_GO_LIVE.md) (not automatic product NEXT #1)
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
- [ ] Native mobile: choose stack + reception MVP scope
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

Level 3 work (tenancy, RLS, billing, booking architecture, **navigation architecture**, migrations, tenant identity, Production data) requires Claude independent pre-challenge before Cursor implementation.

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
