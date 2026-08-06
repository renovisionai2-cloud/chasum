# World Class Design System

**Status:** Chapter 1 — formalized tokens + shell foundation  
**Branch:** `cursor/world-class-portal-foundation`  
**Production baseline:** `4eecbec` · tag `phase-0-gvm-production-2026-08-04`  
**Shell base:** `d86e398` · Chapter 1 completes remaining foundation  
**Canonical contract:** [`docs/product/23_DESIGN_SYSTEM_V1.md`](./product/23_DESIGN_SYSTEM_V1.md)  
**Related:** [`WORLD_CLASS_DESIGN_PRINCIPLES.md`](./WORLD_CLASS_DESIGN_PRINCIPLES.md)  

---

## Authority

1. **DS v1** remains the UI contract (`app/globals.css` + `components/ui/*`).  
2. World Class extends tokens — does **not** fork a second system.  
3. Brand / logo locked — official assets only.  
4. Do not redesign operational pages independently in later chapters — reuse this system.

---

## Locked owner decisions (Chapter 0 → recorded for all chapters)

1. **Online Payments** — present as available only for genuinely connected/tested workflows; do not imply every financial workflow is complete.  
2. **Inventory** — Roadmap / Coming Soon until built and tested; not an available Business-plan capability.  
3. **Summer** — Early Access / Private Alpha; do not present full future vision as Available Today.  
4. **Memberships** — Beta / Incomplete until workflows verified.  
5. **Multi-location** — core available where proven; advanced franchise/enterprise location mgmt remains future.  
6. **Staff plan limits** — require UI + server/API enforcement; any migration proposed separately (not in Ch 1).  
7. **Business location limit** — locked at **six** in marketing; do not silently change DB this chapter.  
8. **Unsupported stats/testimonials** — never render; quarantine in marketing-parity chapter.  
9. **Start Free** — marketing CTA honesty deferred to parity chapter.  
10. **Calls & Texting** — only where plan + configured providers support them.  
11. **Paid areas / API** — eventually nav + page + component + server enforcement (foundation starts with HQ command filtering).  
12. **Education** — not fully supported until workflow + tests complete.

---

## Tokens (`app/globals.css` `:root`)

| Category | Tokens |
|----------|--------|
| Surfaces | `--background`, `--foreground`, `--card`, `--muted`, `--border` |
| Brand | `--primary`, `--spark` (AI only) |
| Status | `--destructive`, `--success`, `--warning`, `--info` |
| Elevation | `--shadow-xs` → `--shadow-lg` |
| Radius | `--radius-sm` / `md` / `lg` / `xl` |
| Space | `--space-1` … `--space-12` (4px base) |
| Motion | `--ease-out`, `--duration-fast` (150ms), `--duration-normal` (220ms), `--duration-complex` (320ms) |
| Z-index | `--z-shell` (40), `--z-overlay` (50), `--z-palette` (60), `--z-toast` (70) |
| Touch | `--touch-min` (2.75rem) |
| Breakpoints (reference) | `--bp-sm` 40rem · `--bp-md` 48rem · `--bp-lg` 64rem · `--bp-xl` 80rem |

### Typography utilities

| Role | Class / component |
|------|-------------------|
| Display | `.ds-display` |
| Page title | `.ds-page-title` / `PageHeader` |
| Section | `.ds-section-title` |
| Card title | `.ds-card-title` |
| Body | `.ds-body` |
| Supporting | `.ds-supporting` |
| Labels | `.ds-label` |
| Captions | `.ds-caption` |
| Numeric | `.ds-numeric` + `Money` |

Font: Geist Sans / Geist Mono.

### Layout utilities

`.ds-page` · `.ds-safe-pad` · `.ds-touch-target` · `.ds-table-scroll` · `.ds-form-stack` · `.ds-focus-ring` · `.ds-nav-item*` · `.ds-skeleton-shimmer`

---

## Colour & status language

| Meaning | Token | Rule |
|---------|-------|------|
| Success / healthy | `--success` | Never colour-only |
| Information | `--info` | Pair with text/icon |
| Summer / AI | `--spark` | AI context only |
| Attention | `--warning` | Pair with label |
| Destructive | `--destructive` | Confirmations |
| Neutral / disabled | muted | — |
| Money | `Money` + tabular nums | **No** misleading status colours on amounts |

---

## Motion

Micro ~150ms · Standard ~220ms · Complex ~320ms.  
Honor `prefers-reduced-motion` (global reduce block in `globals.css`).  
No bounce / spin / decorative delay.

---

## Primitives (`components/ui`)

alert · badge · button · card · chart · checkbox · color-picker · date-field · dialog · empty-state · field · form-feedback · icon-button · image-upload-field · input · label · loading · logo · money · page-header · select · sheet · stat-card · table · tabs · textarea · timezone-select  

### Shell components (Chapter 1)

| Component | Path |
|-----------|------|
| App shell | `components/dashboard/shell.tsx` |
| Sidebar / top nav / mobile drawer | `components/dashboard/sidebar.tsx` |
| Mobile bottom nav | `components/dashboard/mobile-bottom-nav.tsx` |
| Command trigger | `components/dashboard/command-trigger.tsx` |
| Command palette | `components/command-palette/command-palette.tsx` |
| Quick create | `components/dashboard/quick-create-menu.tsx` + `lib/dashboard/quick-create.ts` |
| Account menu | `components/dashboard/user-account-menu.tsx` |

---

## Accessibility decisions (Ch 1)

- Skip link → `#portal-main`  
- Main landmark `id="portal-main"` focusable (`tabIndex={-1}`)  
- Command palette focus restore on close  
- Touch targets via `--touch-min`  
- Summer links expose “AI Business Manager · Early Access” in accessible names  
- Visible focus via `.ds-focus-ring`  

---

## Responsive decisions (Ch 1)

- Desktop sidebar `lg+`; mobile drawer + bottom nav below `lg`  
- Mobile Command Centre label shortened to “Centre” (`mobileLabel`) with full `aria-label`  
- Safe-area padding on bottom nav; `.ds-safe-pad` utility available  
- Quick-create / command / overlays use token z-index scale  

---

## Chapter 1 remaining gaps (not blocking)

- [ ] Migrate every operational page to `PageHeader` / empty states (later chapters)  
- [ ] Standardize status badges across appointment/payment/comms  
- [ ] Full plan-gated nav for Developer / paid features (Ch 9/13)  
- [ ] Staff limit enforcement (needs separate migration PO)  

---

## Explicit non-goals this chapter

- Command Centre page depth (Chapter 2)  
- Marketing copy changes  
- Core booking / payment / email engine rewrites  
- Migrations 034–036  
- New component libraries  
