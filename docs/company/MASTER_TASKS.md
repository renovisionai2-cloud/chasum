# Master Tasks

**Status:** Active development backlog  
**Parent:** [`CHASUM_BIBLE.md`](./CHASUM_BIBLE.md)  
**Roadmap:** [`MASTER_ROADMAP.md`](./MASTER_ROADMAP.md)

Update this file at the start of every sprint. It is the working queue — not a historical archive (history belongs in CHANGELOG + roadmap completed tables).

---

## Current release

**Working name:** Company OS + AI Receptionist foundation  
**Branch focus:** `cursor/phase-3-integrations` → `main` when release slice is ready  

**Release intent:** Permanent company documentation; departments through Reports & Emma Phase 1 documented and shippable; next build work prioritizes hardening and AI Workforce depth.

---

## Current sprint

1. **Commercial Foundation Track 1 CLOSED.** 037 APPLIED + VERIFIED on Production (schema) and Staging (Preview `/apply` E2E). **Track 2 / 038 CROSS-ENVIRONMENT EXECUTION GATE CLOSED** — Staging APPLIED + VERIFIED, then Production APPLIED + VERIFIED after PO approval, precheck, DB/security verification, and GVM smoke. Track 3 RLS remains **BLOCKED / NOT IMPLEMENTED** until the Production `4eecbec` billing-write compatibility decision. Migration 038 does **not** resolve Track 3.
2. **Database Release Automation — DESIGN FOR NOW / BUILD LATER.** Do not implement now. Future pipeline must keep current safety (environment identity, per-env migration state, Staging-first, preflight, transaction-safe execution, post-verify, smoke hooks, Production approval gate, drift detection, rollback/forward-recovery playbook, audit log) and must prohibit `supabase db push` / `migration up` while 034–036 remain unapplied. Canonical: [`WORLD_CLASS_COMMERCIAL_FOUNDATION.md`](../WORLD_CLASS_COMMERCIAL_FOUNDATION.md).
3. **Marketing website audit follow-up — ACTIVE WORKSTREAM; do not implement in this closeout.** P0: Pricing must not imply Inventory is currently available if it remains Coming Soon; clarify current vs future multi-location. P1: Meet Summer should more strongly communicate Summer as the AI Business Manager; marketing currently undersells CRM, payments, scheduling integrity, and the connected operating model. Also preserve: sitemap P1, robots P2, structured-data follow-up, Private Alpha → future self-serve CTA transition, annual pricing “Save 20%” reconciliation before final public pricing lock. Canonical: [`WORLD_CLASS_MARKETING_PRODUCT_PARITY.md`](../WORLD_CLASS_MARKETING_PRODUCT_PARITY.md).
4. Socialize Company Operating System docs (`docs/company/*`) as mandatory session start.
5. Do **not** CLI-apply pending migrations (034–036). **LIVE:** Preview → Staging `wnfahklzaxirftyskctd`; Production → Production `kxcydvhswkuzepwzzinq`. Manual scoped SQL only after PO approval. Never `supabase db push`.
6. Harden Emma Phase 1 (persist conversations, CRM link paths, grounded answers QA).
7. Identify next AI Workforce slice (Emma public/channel OR Alex automation) without redesigning UI.
8. Stripe SaaS Billing remains later — do not swap the mock provider in this sprint.

---

## High priority

- [ ] **PRODUCT OWNER DECISION REQUIRED** — Production `4eecbec` commercial compatibility before Track 3 RLS
- [ ] **Database Release Automation** — DESIGN FOR NOW / BUILD LATER (do not implement in this sprint)
- [ ] **Marketing website audit follow-up** — active workstream; locked-page claim fixes only with explicit PO
- [ ] Environment migrations applied for Business, Reports, AI Receptionist tables
- [ ] Emma: production FAQ/config storage (owner-approved answers) without inventing facts
- [ ] Emma: public booking-page assist (web channel) using same service layer
- [ ] Stripe live provider behind existing billing interface
- [ ] Staff roles / permissions enforcement for multi-staff login (Employee Management ready)
- [ ] Reception + CRM communication: real Twilio/Resend paths verified in staging
- [ ] Reports: scheduled email delivery worker (CRUD exists; send pipeline next)
- [ ] Fix/monitor any go-live blockers for primary customer tenants (see `docs/GVM_GO_LIVE.md`)

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

---

## Low priority

- [ ] Voice calling for Emma (architecture reserved; implement later)
- [ ] Advanced AI Workforce collaboration graphs
- [ ] Version 2 design-system evolution (explicit project only)
- [ ] Nice-to-have analytics visualizations beyond current charts
- [ ] Idea parking lot promotions (see `docs/product/99_IDEA_PARKING_LOT.md`)

---

## Development rules (mandatory)

Every development session that changes the product:

1. **Read** [`CHASUM_BIBLE.md`](./CHASUM_BIBLE.md) and [`PRODUCT_PRINCIPLES.md`](./PRODUCT_PRINCIPLES.md) first.
2. **Implement** only the scoped task; do not redesign unrelated UI or modules.
3. **Run** `npm run lint`
4. **Run** `npm run build`
5. **Fix** all issues introduced.
6. **Update** `docs/CHANGELOG.md`
7. **Commit** with a concise, why-focused message
8. **Push** the branch

Documentation-only sessions still commit and push. Application sessions must not skip lint/build.

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
