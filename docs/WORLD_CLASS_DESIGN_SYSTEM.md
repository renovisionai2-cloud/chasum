# World Class Design System

**Status:** Chapter 0 formalization — extends Design System v1; does not fork a second system  
**Canonical contract:** [`docs/product/23_DESIGN_SYSTEM_V1.md`](./product/23_DESIGN_SYSTEM_V1.md)  
**Related:** [`WORLD_CLASS_DESIGN_PRINCIPLES.md`](./WORLD_CLASS_DESIGN_PRINCIPLES.md), Brand V2 (`BRAND_GUIDELINES.md`)  

---

## Authority

1. **DS v1** remains the UI contract (`app/globals.css` + `components/ui/*`).  
2. This document records **World Class execution requirements** and adoption gaps.  
3. Do **not** invent parallel tokens, button systems, or page-specific themes.  
4. Brand / logo locked — no redesign.

---

## Existing tokens (reuse)

Defined in `app/globals.css`:

| Category | Tokens |
|----------|--------|
| Surfaces | `--background`, `--foreground`, `--card`, `--muted`, `--border` |
| Brand | `--primary` (blue), `--spark` (AI only) |
| Status | `--destructive`, `--success`, `--warning` |
| Elevation | `--shadow-xs` → `--shadow-lg` |
| Radius | `--radius-sm` / `md` / `lg` / `xl` |
| Space | `--space-1` … `--space-12` (4px base) |
| Motion | `--ease-out`, `--duration-fast`, `--duration-normal` |

Utilities: `.ds-page`, `.ds-section-title`, `.ds-label`, `.ds-form-stack`, `.ds-field`, `.ds-table-scroll`, `.ds-safe-pad`, `.ds-focus-ring`, `.ds-nav-item*`, `.ds-card-interactive`.

---

## Typography hierarchy (required)

| Role | Implementation |
|------|----------------|
| Display | Marketing only; portal rarely |
| Page title | `PageHeader` |
| Section title | `.ds-section-title` / `CardTitle` |
| Card title | `CardTitle` |
| Body | `text-sm` product |
| Supporting | `text-muted-foreground` |
| Labels | `.ds-label` / `Label` |
| Captions | `text-xs` |
| Numeric / money | `Money` + tabular nums |

Font: Geist Sans / Geist Mono.

---

## Primitives inventory (`components/ui`)

alert · badge · button · card · chart · checkbox · color-picker · date-field · dialog · empty-state · field · form-feedback · icon-button · image-upload-field · input · label · loading · logo · money · page-header · select · sheet · stat-card · table · tabs · textarea · timezone-select  

**World Class shell additions (already on branch):** CommandTrigger · QuickCreateMenu · UserAccountMenu · MobileBottomNav · grouped sidebar (`lib/dashboard/nav.ts`).

---

## Motion guidance (Execution Program)

| Kind | Target |
|------|--------|
| Micro | ~150ms |
| Standard | ~220ms |
| Complex | ~320ms |
| Reduced motion | Honor `prefers-reduced-motion` |

No bouncing/spinning decorative animation.

---

## Spacing

Prefer multiples of 4/8 via `--space-*`. Page padding via shell (`px-4` / `md:px-6` / `lg:px-8`). Operational pages: full width; settings/forms: constrained (~`max-w-6xl` where shell already applies).

---

## Visual direction

- Bright content surfaces; restrained dark sidebar chrome allowed.  
- No heavy dark content theme as default.  
- No purple-gradient / cream-serif AI clichés on portal.  
- Cards only when interactive or KPI — prefer sections/lists for settings.

---

## Chapter 1 remaining DS work (after audit approval)

- [ ] Audit pages not using `PageHeader` / `EmptyState` / skeletons  
- [ ] Standardize status badge usage across appointment/payment/comms  
- [ ] Document z-index scale for shell overlays (palette, mobile nav, sheets)  
- [ ] Ensure financial summaries always show due-now + status (Phase 0 lesson)  
- [ ] No new component library dependencies  

---

## Explicit non-goals

- Redesigning Brand V2 or marketing locks  
- Dark-mode-first product  
- Per-page custom design systems  
- Fake “premium” effects that hurt clarity  
