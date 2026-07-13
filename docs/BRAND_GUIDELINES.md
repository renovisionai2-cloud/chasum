# Chasum Brand Guidelines

**Status:** Brand V1.0 — Official  
**Source of truth:** Approved Chasum Brand Identity Board (attached / design system).

Do not redesign, reinterpret, substitute fonts, or change proportions.

---

## Brand meaning

- The **C** represents Chasum, Connection, and Commitment.
- The **three dots** represent Workflow, Intelligence, and Growth.
- The **Spark** represents intelligence and AI-powered features only.

Tagline: **AI Business Operating System**

---

## Assets (`/public/brand/`)

| File | Use |
|------|-----|
| `logo-full.svg` | C Mark + wordmark + tagline |
| `logo-horizontal.svg` | C Mark + wordmark (nav / product) |
| `logo-stacked.svg` | Stacked lockup |
| `wordmark.svg` | CHASUM (custom A + AI dot) |
| `wordmark-tagline.svg` | Wordmark + tagline |
| `logo-icon.svg` | C Mark |
| `spark.svg` | AI Spark (AI features only) |
| `favicon.svg` | Favicon |
| `apple-touch-icon.png` | 180×180 |
| `manifest-icon.png` | 512×512 PWA |
| `app-icon-1024.png` | 1024×1024 |
| `*-light.svg` | Light ink on dark surfaces |

Constants: `lib/brand/assets.ts`

---

## React components

| Component | Default asset |
|-----------|----------------|
| `<Logo />` | `logo-horizontal.svg` (`withTagline` → `logo-full`) |
| `<LogoIcon />` | `logo-icon.svg` |
| `<Wordmark />` | `wordmark.svg` |
| `<Spark />` | `spark.svg` — AI only |

Never recreate the wordmark with CSS/Inter text in feature code.

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

- Clear space ≥ height of the C Mark
- Digital minimum height: 32px
- Do not rotate, stretch, recolor, or add effects
- Spark only for AI-powered features
- Dark Navy sidebar uses light lockups (`tone="light"`)
