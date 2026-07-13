# Chasum Brand Guidelines

**Status:** Brand V1.0 — FINAL / FROZEN  
**Source of truth:** Official Chasum Brand Identity Board.

Do not redesign, reinterpret, substitute fonts, or change proportions.  
Future brand changes require explicit product-owner approval.

---

## Meaning

- **C** — Chasum, Connection, Commitment  
- **Three dots** — Workflow, Intelligence, Growth  
- **Spark** — AI intelligence only (never a logo substitute)

Tagline: **AI Business Operating System**

---

## Assets (`/public/brand/`)

| File | Use |
|------|-----|
| `logo-full.svg` | C Mark + wordmark + tagline |
| `logo-horizontal.svg` | C Mark + wordmark |
| `logo-stacked.svg` | Stacked lockup |
| `wordmark.svg` | CHASUM (custom A + AI dot) |
| `logo-icon.svg` | C Mark |
| `spark.svg` | AI Spark |
| `favicon.svg` | Favicon |
| `apple-touch-icon.png` | 180×180 |
| `manifest-icon.png` | 512×512 |
| `app-icon-1024.png` | 1024×1024 |
| `*-light.svg` | Light ink on dark surfaces |

Constants: `lib/brand/assets.ts`

---

## React

| Component | Asset |
|-----------|--------|
| `<Logo />` | horizontal (`withTagline` → full) |
| `<LogoIcon />` | `logo-icon.svg` |
| `<Wordmark />` | `wordmark.svg` |
| `<Spark />` | `spark.svg` |

Import only from `@/components/brand/*`. Never recreate the wordmark with CSS text.

---

## Colors

| Token | Hex |
|-------|-----|
| Primary Blue | `#2563EB` |
| Deep Blue | `#1E40AF` |
| Purple | `#7C3AED` |
| Dark Navy | `#0B1324` |
| Slate | `#334155` |
| Light Gray | `#F1F5F9` |

---

## Rules

- Clear space ≥ C Mark unit  
- Digital min height 32px · Print 12mm  
- Do not rotate, stretch, recolor, or add effects  
- Spark only for AI features  
- Dark Navy sidebar uses `Logo tone="light"`
