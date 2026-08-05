# World Class Design Principles

**Program:** Chasum World Class Program — Chapter 1  
**Baseline:** Design System v1 (`docs/product/23_DESIGN_SYSTEM_V1.md`), Brand V2 (`docs/BRAND_GUIDELINES.md`), UX Principles (`docs/product/18_UX_PRINCIPLES.md`)  
**Visual direction:** Clean, bright, premium — **not** heavy dark product chrome for content surfaces. Dark sidebar may remain as shell chrome if hierarchy stays clear.

---

## North star

Competitors ship features. Chasum wins on **experience**.

The portal should feel:

- premium · calm · intelligent · fast · trustworthy  
- easy for small businesses · scalable for multi-location  
- consistent · operationally connected (one OS, not modules)

Inspired by craft bars of Apple, Stripe, Linear, Notion, Framer — **never clone** their branding or layouts.

---

## What already exists (reuse)

| Asset | Location | Action |
|-------|----------|--------|
| Tokens (colour, space, radius, shadow, motion) | `app/globals.css` | **Reuse / extend** |
| DS utilities (`.ds-page`, `.ds-nav-item`, …) | `globals.css` | **Adopt more widely** |
| Primitives | `components/ui/*` | **Extend; do not fork** |
| PageHeader, EmptyState, Loading, Money, Field | `components/ui/*` | **Standardize page chrome** |
| Toast + Theme providers | `providers/*` | **Keep** |
| Command palette | `components/command-palette` | **Elevate** |
| Brand V2 assets | `/public/brand-v2/` | **Frozen — do not redesign** |

**Rule:** Do not invent parallel button, card, table, or form systems.

---

## Recommended foundation

### Typography scale

Keep Geist Sans / Geist Mono. Roles:

| Role | Guidance |
|------|----------|
| Page title | `PageHeader` — `text-2xl` / `md:text-[1.75rem]` semibold |
| Section | `.ds-section-title` |
| KPI label | `.ds-label` |
| Body | `text-sm` in product |
| Money | Tabular nums via `Money` |

Avoid Inter/Roboto/system default stacks on branded surfaces.

### Spacing scale

Continue 4px base `--space-1` … `--space-12`. Standard page padding via `.ds-page` / `.ds-safe-pad`. Aim for **one vertical rhythm** per page (title → action → content), not stacked card cities.

### Page widths & grid

| Context | Recommendation |
|---------|----------------|
| Operational (Reception, CRM) | Fluid full width of content column |
| Settings / forms | Constrained readable width (~720–880px) for single-column forms |
| Reports | Fluid with max content width for charts |
| Drawers / sheets | Existing Sheet widths; standardize sm/md/lg sizes |

### Radius & shadows

Reuse `--radius-sm|md|lg|xl` and `--shadow-xs`→`lg`. Prefer subtle elevation; avoid multi-layer glow and purple gradients on product chrome.

### Colour

| Use | Token |
|-----|-------|
| Primary actions | `--primary` blue |
| AI accent only | `--spark` |
| Surfaces | `--background`, `--card`, `--muted` |
| Status | `--success`, `--warning`, `--destructive` |

Content area stays **bright**. Avoid defaulting the whole OS to dark mode as the primary look.

### Semantic status colours

Unify appointment, payment, and communication statuses through shared badge components (extend `StatusBadge` / payment status labels from commerce types). One word per status; no conflicting synonyms across pages.

### Icons

Lucide only. Consistent stroke. Touch targets ≥ 40px for icon buttons (`IconButton`).

### Button hierarchy

| Level | Variant | Rule |
|-------|---------|------|
| Primary | `primary` | One per view region |
| Secondary | `secondary` / `outline` | Supporting |
| Tertiary | `ghost` | Inline |
| Destructive | `destructive` | Confirm required |
| AI | `spark` | Summer/AI actions only |

### Forms

Always: visible label, hint when non-obvious, `Field` error, `FormFooter` pending. No placeholder-only labels.

### Cards

Default: **no decorative cards**. Cards for interactive containers or KPI stats only (aligns with product frontend rules). Prefer lists and sections for settings.

### Tables & list rows

Shared `Table` + mobile card-list fallback pattern. Row click opens profile/sheet; actions overflow menu for secondary.

### Drawers & modals

| Pattern | When |
|---------|------|
| **Sheet (drawer)** | Create/edit operational objects (appointment, customer) |
| **Dialog** | Confirmations, short forms, blockers |
| **Inspect drawer** | Read-first appointment summary → Edit opens canonical sheet |

Avoid stacking multiple modals. Prefer sheet → confirm dialog only when destructive.

### Tabs & filters

Tabs for peer views of one object. Filters as a single filter bar (not scattered chips). Persist filter state in URL where helpful.

### Badges & financial summaries

Reuse commerce money formatting. Financial summaries always show: total, paid, due now, remaining, status — never “deposit required” alone when payment state exists (Phase 0 lesson).

### Empty / loading / error / success

| State | Standard |
|-------|----------|
| Empty | `EmptyState` + one CTA |
| Loading | Skeleton matching layout |
| Error | Alert + retry |
| Success | Toast for background; inline for forms |

### Motion

Use existing `--duration-fast|normal` and `--ease-out`. Shell transitions + sheet enter/exit only — no decorative noise. Respect `prefers-reduced-motion`.

### Responsive breakpoints

| Breakpoint | Shell behaviour |
|------------|-----------------|
| Mobile | Drawer nav; Reception prioritizes day agenda + FAB |
| Tablet | Collapsible reception side panel |
| Desktop | Persistent sidebar + optional reception split |

### Accessibility

Focus rings (`.ds-focus-ring`), contrast, Escape closes overlays, labelled icon buttons, keyboard path for primary Reception actions. Chapter Phase 11 is the deep a11y pass; Phase 1 must not regress basics.

---

## Explicit non-goals

- Heavy dark content themes as default
- Purple-on-white / cream-serif-terracotta AI clichés on portal
- Broadsheet / newspaper layouts
- Parallel design systems for “World Class”
- Redesigning Brand V2 or marketing locks

---

## Authority

| Doc | Role |
|-----|------|
| `docs/product/23_DESIGN_SYSTEM_V1.md` | Canonical UI contract — **remain authoritative** |
| This document | World Class **extension principles** for portal shell work |
| `docs/BRAND_GUIDELINES.md` | Brand freeze |
| `docs/product/18_UX_PRINCIPLES.md` | Interaction philosophy |
