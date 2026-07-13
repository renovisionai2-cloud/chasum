# Design System

Product UX standards. Implementation: `app/globals.css`, `components/ui/*`, `components/brand/*`.
Also see [`../UI_GUIDELINES.md`](../UI_GUIDELINES.md), [18_UX_PRINCIPLES.md](./18_UX_PRINCIPLES.md).

## Brand identity

| Asset | Name | Usage |
|-------|------|-------|
| **Logo** | C Mark + wordmark | `/public/brand/*`, `Logo` / `LogoIcon` / `Wordmark` |
| **Spark** | AI Spark | `Spark` only — never a logo substitute |

See [`../BRAND_GUIDELINES.md`](../BRAND_GUIDELINES.md).

- Do not invent alternate lettermarks or recreate the wordmark with CSS text.
- Spark accent follows the brand board (`--spark` purple); use the SVG asset for AI UI.
- Primary brand color is Primary Blue (`--primary` `#2563EB`).

## Principles

1. **Clean and calm** — generous whitespace, minimal chrome
2. **Mobile-first** — booking and dashboard usable on phones
3. **Accessible by default** — keyboard, screen reader, focus management
4. **Feedback always** — loading, empty, error, and success on every action
5. **Premium OS feel** — consistent radius, shadow, and typography tokens

## Core components

| Component | Path |
|-----------|------|
| Buttons | `components/ui/button.tsx` (`primary`, `secondary`, `outline`, `ghost`, `spark`, `destructive`) |
| Cards | `components/ui/card.tsx` |
| Stat cards | `components/ui/stat-card.tsx` |
| Forms | `input`, `select`, `textarea`, `checkbox`, `label`, `form-feedback` |
| Dialogs | `components/ui/dialog.tsx` |
| Tables | `components/ui/table.tsx` |
| Charts | `components/ui/chart.tsx` (`BarChart`, `Sparkline`, `WeekBars`) |
| Badges | `components/ui/badge.tsx` |
| Alerts | `components/ui/alert.tsx` + `AlertMessage` |
| Empty states | `components/ui/empty-state.tsx` (`page` / `panel` / `inline` variants) |
| Loading | `components/ui/loading.tsx` (`Spinner`, `Skeleton`, `PageLoader`, `DashboardSkeleton`) |
| Page header | `components/ui/page-header.tsx` |

## Tokens (CSS)

Defined in `app/globals.css`:

- Surfaces: `--background`, `--card`, `--muted`, `--border`
- Brand: `--primary`, `--spark`
- Elevation: `--shadow-xs` → `--shadow-lg`
- Radius: `--radius-sm` / `--md` / `--lg` / `--xl`
- Spacing: `--space-1` … `--space-12` (4px base)
- Motion: `--ease-out`, `--duration-fast` / `--duration-normal`

Utility classes: `.ds-page`, `.ds-label`, `.ds-section-title`, `.ds-card-interactive`, `.ds-nav-item*`, `.ds-focus-ring`

## Typography

- **Font:** Geist Sans (UI), Geist Mono (code)
- Page title: `text-2xl` / `md:text-[1.75rem]` font-semibold tracking-tight
- Section title: `.ds-section-title` / `CardTitle`
- Label (KPI): `.ds-label` (uppercase, tracked)
- Body: `text-sm` (product) / `text-base`–`text-lg` (marketing)

## Empty states

Prefer `EmptyState` with a primary CTA inside the empty region:

- `variant="page"` — full module empty
- `variant="panel"` — inside a card
- `variant="inline"` — compact nested empty
- Optional `glyph` (Lucide) or brand `icon` (`c` / `spark`)

## Status colors

Use `StatusBadge` — pending amber, confirmed blue, cancelled red, completed green, no-show muted.

## Dashboard shell

- Sidebar: The C logo, active nav pill + primary dot, signed-in strip
- Top nav: client search shortcut, location switcher, notifications, theme, account
- Content title lives in `PageHeader` (avoid a second competing H1 in the top bar)
