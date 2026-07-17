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

1. Socialize Company Operating System docs (`docs/company/*`) as mandatory session start.
2. Apply outstanding Supabase migrations in each environment (**001 → 022**; linked project is current through `022`).
3. Harden Emma Phase 1 (persist conversations, CRM link paths, grounded answers QA).
4. Identify next AI Workforce slice (Emma public/channel OR Alex automation) without redesigning UI.
5. Keep Billing path ready for Stripe swap (provider interface already in place).

---

## High priority

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
