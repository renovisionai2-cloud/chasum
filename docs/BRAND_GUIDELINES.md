# Chasum Brand Guidelines

**Status:** Brand V1.0 — Official  
**Source of truth:** Approved Chasum Brand Identity board.

Do not redesign, reinterpret, or recreate the logo with fonts or CSS.

---

## Brand meaning

- The **C** represents Chasum, Connection, and Commitment.
- The **signal dots** represent Workflow, Intelligence, and Growth.
- The **Spark** represents intelligence, innovation, and AI-powered features only.

Tagline: **AI Business Operating System**

---

## Asset locations

All official files live in [`/public/brand/`](../public/brand/):

| File | Use |
|------|-----|
| `logo-full.svg` | Icon + wordmark + tagline (marketing) |
| `logo-horizontal.svg` | Icon + wordmark (product nav / auth) |
| `wordmark.svg` | Wordmark + tagline |
| `wordmark-name.svg` | Wordmark only (custom A + blue AI dot) |
| `logo-icon.svg` | C Mark icon |
| `spark.svg` | AI Spark |
| `favicon.svg` | Browser favicon |
| `apple-touch-icon.png` | 180×180 |
| `manifest-icon.png` | 512×512 PWA |
| `app-icon-1024.png` | 1024×1024 app icon |
| `*-light.svg` | Light ink lockups for dark backgrounds |

Constants: [`lib/brand/assets.ts`](../lib/brand/assets.ts)

---

## React components

Import from `@/components/brand/logo` and `@/components/brand/spark`:

| Component | Asset |
|-----------|--------|
| `<Logo />` | `logo-horizontal.svg` (or `logo-full` with `withTagline`) |
| `<LogoIcon />` | `logo-icon.svg` |
| `<Wordmark />` | `wordmark.svg` / `wordmark-name.svg` |
| `<Spark />` | `spark.svg` — AI features only |

`@/components/ui/logo` re-exports for compatibility.  
`SparkMark` / `ChasumMark` in `marks.tsx` wrap the official components.

**Never** paste wordmark text as CSS/HTML as a substitute for the artwork.

---

## Colors (Brand Identity board)

| Token | Hex | Role |
|-------|-----|------|
| Primary Blue | `#2563EB` | CTAs, links, AI dot |
| Deep Blue | `#1E40AF` | Logo gradient mid |
| Purple | `#7C3AED` | Logo/Spark gradient, AI accent |
| Dark Navy | `#0B1324` | Ink / dark surfaces |
| Slate | `#334155` | Secondary text |
| Light Gray | `#F1F5F9` | App canvas |

Product tokens: `app/globals.css`.

---

## Typography

- **UI / product:** Inter (Regular → ExtraBold)
- **Wordmark:** official SVG artwork only — preserves custom **A** and blue AI dot
- **Code:** JetBrains Mono

---

## Clear space & minimum size

- Clear space around lockups ≥ height of the **C** icon on all sides.
- Digital minimum logo height: **32px**
- Icon / favicon: 16–32px SVG
- Do not rotate, stretch, recolor arbitrarily, or add effects that obscure the mark.

---

## Do’s

- Use `Logo` / `LogoIcon` / `Wordmark` / `Spark` everywhere.
- Pair Spark only with AI features.
- Use light lockups (`tone="light"`) on dark navy chrome.
- Keep contrast and clear space.

## Don’ts

- Don’t redraw the C, wordmark, or Spark.
- Don’t use Spark as the company logo.
- Don’t recreate “CHASUM” with Inter/CSS instead of the wordmark asset.
- Don’t place the mark on busy photography without a scrim.

---

## Application map

| Surface | Implementation |
|---------|----------------|
| Landing | `Logo` (+ `withTagline` in hero), `Spark` on AI copy |
| Dashboard sidebar | `Logo` |
| Auth | `Logo` via `AuthForm` |
| Public booking | `Logo` + tenant logo |
| Loaders | `Logo` / `Spark` |
| Emails | Hosted `/brand/logo-icon.svg` or horizontal |
| Favicon / PWA | Metadata + `site.webmanifest` |

---

## Change control

Brand V1.0 is **final**. Geometry or wordmark changes require an explicit brand update — not a drive-by UI tweak.
