# Proposed update — `docs/CURRENT_PROJECT_STATE.md`

**Status:** Proposal only — **do not overwrite** `CURRENT_PROJECT_STATE.md` until product owner approves.  
**Reason:** Chapter 1 World Class audit found the handoff file last updated **2026-07-30**, before Phase 0 Production (`4eecbec` / `phase-0-gvm-production-2026-08-04`).

---

## Why update

`CURRENT_PROJECT_STATE.md` is the primary technical session SoT. It currently:

- Omits Phase 0 Production baseline and git tag  
- Still frames GVM go-live blockers that may be partially superseded by Phase 0 email/commerce work  
- Does not point to World Class Program planning docs  
- Leaves MASTER_TASKS / migration-floor drift unacknowledged  

---

## Proposed additions (do not apply yet)

### 1. Companion entry points table — add rows

| Doc | Role |
|-----|------|
| `docs/WORLD_CLASS_PROGRAM_MASTER_PLAN.md` | World Class Program phased plan |
| `docs/PORTAL_FOUNDATION_AUDIT.md` | Portal foundation audit (Chapter 1) |
| `docs/PORTAL_ROUTE_INVENTORY.md` | Tenant portal route inventory |
| `docs/WORLD_CLASS_DESIGN_PRINCIPLES.md` | Portal DS extension principles |
| `docs/WORLD_CLASS_IMPLEMENTATION_SEQUENCE.md` | Implementation order |
| `docs/HEALTHCARE_WORKSPACE_DIRECTION.md` | Healthcare workspace (future, non-universal) |

### 2. Current milestone — proposed wording

- **Production baseline:** `4eecbec` · tag `phase-0-gvm-production-2026-08-04` · https://chasum.vercel.app  
- **Phase 0 (GVM):** assigned-employee booking, exclusive HST, deposits, receipts, tenant email branding, timezone-correct comms, communications resend — **protected**  
- **Active program:** Chasum World Class Program — Chapter 1 audit complete; **implementation not started** until approved  
- **Working branch for World Class:** `cursor/world-class-portal-foundation` (from `4eecbec`)  
- **Still excluded from Production:** migrations 034–036; optional/unassigned employee booking; SMS for GVM if unset  

### 3. Next recommended task — proposed wording

After PO review of Chapter 1 docs: begin **Phase 1 Portal Foundation** on Preview only (shell/nav/DS adoption) — do not touch Phase 0 commerce/email math.

### 4. Known issues — proposed notes

- Document drift: refresh MASTER_TASKS migration floors; TECHNICAL_DEBT stale rows  
- World Class IA issues catalogued in PORTAL_FOUNDATION_AUDIT (nav density, triple booking UI, Business mega-hub)  

### 5. Explicit non-goals to restate

- Do not redesign marketing locks  
- Do not start Inventory / Marketplace / native mobile / V2 product redesign unless asked  
- Do not implement healthcare PHI features without compliance chapter  

---

## Authority reminder

When applied, Bible still wins constitutional conflicts; this file remains the handoff bridge for “where we are now.”
