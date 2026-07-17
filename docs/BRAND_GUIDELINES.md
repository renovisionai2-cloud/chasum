# Chasum Brand Guidelines

**Status:** Brand V2 — FINAL / FROZEN  
**Source of truth:** `/public/brand-v2/`

Do not redesign, reinterpret, substitute fonts, or change proportions.  
Future brand changes require explicit product-owner approval.

Legacy assets under `/public/brand/` and root `/public/favicon*` / `/og-image.png` are frozen archives — **do not reference them** in application code.

---

## Meaning

- **C** — Chasum, Connection, Commitment  
- **Three dots** — Workflow, Intelligence, Growth  
- **Spark** — AI intelligence only (never a logo substitute)

Tagline: **AI Business Operating System**

---

## Folder layout (`/public/brand-v2/`)

| Path | Use |
|------|-----|
| `svg/` | Web-ready SVGs (prefer these) |
| `png/` | Web-ready lockups / light variants / app icon |
| `favicon/` | Browser + PWA icons |
| `social/` | Open Graph / Twitter image |
| `source/` | Masters: `CHASUM.ai`, `CHASUM.pdf`, `EPS/`, `PSD/`, original `SVG/` + `PNG/` |

Constants: `lib/brand/assets.ts`

---

## React

| Component | Asset |
|-----------|--------|
| `<Logo />` | horizontal PNG (`withTagline` → full SVG / light PNG) |
| `<LogoIcon />` | `svg/logo-icon.svg` |
| `<Wordmark />` | `png/wordmark.png` |
| `<Spark />` | `svg/spark.svg` |

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
- Prefer SVG; use PNG only when SVG cannot serve (composited lockups, light ink, raster-only contexts like email / ICO)
