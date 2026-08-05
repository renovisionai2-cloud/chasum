# World Class Implementation Sequence

**Program:** Chasum World Class Program — Chapter 1  
**Baseline Production:** `4eecbec` · `phase-0-gvm-production-2026-08-04`  
**Rule:** Preview-only until each chapter is reviewed and approved. Never apply migrations 034–036 without explicit approval.

---

## Order of chapters

| Order | Phase | Complexity | Why this order |
|-------|-------|------------|----------------|
| 1 | **Phase 1 — Portal Foundation** | Large | Shell/IA/DS adoption unlocks everything else with low DB risk |
| 2 | Phase 2 — Overview Command Centre | Medium | Immediate owner value; read-mostly |
| 3 | Phase 3 — Calendar & Reception | Very Large | Core ops; highest Production risk — after shell patterns exist |
| 4 | Phase 4 — Customer CRM | Large | Continuity into booking/commerce |
| 5 | Phase 5 — Commerce & Financial Ops | Large | Unify on Phase 0 resolver; UI consolidation |
| 6 | Phase 6 — Employees, Locations, Resources | Large | Resources may need migration — Preview isolation |
| 7 | Phase 7 — Communications | Medium | Unify inbox + booking retry |
| 8 | Phase 8 — Summer AI Business Manager | Large | Intelligence after operational spine is clear |
| 9 | Phase 9 — Reporting, Automation, Growth | Large | Trustworthy data after ops consistency |
| 10 | Phase 10 — Healthcare Workspace | Very Large | Compliance-gated; optional industry |
| 11 | Phase 11 — Performance, A11y, Mobile | Large | Hardening pass across prior phases |
| 12 | Phase 12 — Production Readiness & Launch | Medium | Tag, audit, controlled Production promote |

---

## First implementation chapter (approved recommendation)

### Chapter title

**Portal Foundation — Shell, Navigation, and Design System Adoption**

### Why first

- Evidence from audit: High severity IA, search, terminology, and shell consistency issues.
- Lowest shared-database risk.
- Establishes patterns Reception/CRM/Payments must reuse.
- Protects Phase 0 GVM workflows by **not** changing booking/tax/email logic.

### In scope (when implementation is approved)

- Nav regrouping / progressive disclosure (without removing GVM-critical paths)
- Header search → real command/search entry
- Terminology cleanup (Employees, Customers/CRM decision)
- Wider `PageHeader` / EmptyState / loading adoption
- Relocate or demote Developer for typical tenants
- Remove dead unused components only after confirmation

### Out of scope (remain untouched)

- Financial resolver math  
- Email templates content/branding behaviour  
- Migrations 034–036  
- Unassigned employee booking enablement  
- Healthcare/EMR  
- Marketing locks  
- Brand PDF / rebuild scripts / `tmp`  
- Production deploy until Phase 12 / explicit PO request  

### Acceptance criteria (for later implementation)

- [ ] Primary nav groups map to operating journey  
- [ ] Command/search opens from header  
- [ ] DS primitives used on Overview + Settings chrome  
- [ ] No regression on GVM Reception book → pay → email  
- [ ] Preview only; `/api/build-info` documents commit  
- [ ] Docs updated in CURRENT_PROJECT_STATE after ship  

---

## Parallel tracks (do not block Phase 1)

| Track | Note |
|-------|------|
| Doc hygiene | Refresh CPS / MASTER_TASKS migration floors |
| Debt cleanup | Mark stale TD rows; do not expand scope |
| GVM Production support | Hotfixes on Production tag only via controlled process |

---

## Stop conditions

Stop and escalate if a chapter requires:

- Shared Production schema change without Preview isolation plan  
- Enabling optional/unassigned staff in Production  
- Clinical PHI storage  
- Marketing lock redesign  
