# Design System

Product UX standards. Implementation: `app/globals.css`, `components/ui/*`, `components/brand/*`.
Also see [`../UI_GUIDELINES.md`](../UI_GUIDELINES.md), [18_UX_PRINCIPLES.md](./18_UX_PRINCIPLES.md).

## Brand identity

| Asset | Name | Usage |
|-------|------|-------|
| **Option 01** | The C | Primary logo / wordmark badge (`ChasumMark`, `BrandBadge`, `Logo`) |
| **Option 02** | The Spark | AI symbol (`SparkMark`) for intelligence, automation, loaders |

- Do not invent alternate lettermarks.
- Spark accent color is teal (`--spark`), never purple glow.
- Primary brand color is signal blue (`--primary`).

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
| Forms | `input`, `select`, `textarea`, `label`, `form-feedback` |
| Dialogs | `components/ui/dialog.tsx` |
| Tables | `components/ui/table.tsx` |
| Charts | `components/ui/chart.tsx` (presentational) |
| Badges | `components/ui/badge.tsx` |
| Alerts | `components/ui/alert.tsx` + `AlertMessage` |
| Loading / empty | `loading.tsx`, `EmptyState` in `page-header.tsx` |

## Tokens (CSS)

Defined in `app/globals.css`:

- Surfaces: `--background`, `--card`, `--muted`, `--border`
- Brand: `--primary`, `--spark`
- Elevation: `--shadow-xs` → `--shadow-lg`
- Radius: `--radius-sm` / `--md` / `--lg`

## Typography

- **Font:** Geist Sans (UI), Geist Mono (code)
- Page title: `text-2xl font-semibold tracking-tight`
- Body: `text-sm` (product) / `text-base`–`text-lg` (marketing)

## Status colors

Use `StatusBadge` — pending amber, confirmed blue, cancelled red, completed green, no-show muted.
