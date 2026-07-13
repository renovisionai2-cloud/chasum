# Chasum Brand Guidelines

**Official mark:** Option 01 — **The C Mark**  
**Status:** Permanent. Do not redesign, redraw, or replace with a generic letter C.

Companion AI accent: Option 02 — **The Spark** (not a substitute for the logo).

---

## Asset locations

All official files live in [`/public/brand/`](../public/brand/):

| File | Use |
|------|-----|
| `logo.svg` | Primary framed mark (blue badge + white C) — product chrome |
| `logo-dark.svg` | C Mark in brand blue on transparent — light backgrounds |
| `logo-light.svg` | C Mark in white — dark backgrounds |
| `icon.svg` | Bare C Mark (PWA / compact) |
| `favicon.svg` | Browser favicon |
| `apple-touch-icon.png` | 180×180 iOS / PWA touch icon |
| `site.webmanifest` | Also mirrored at `/public/site.webmanifest` |

**React / app usage:** import only from `@/components/brand/logo` (`Logo`, `LogoMark`).  
`@/components/ui/logo` re-exports the same module for compatibility.  
**Do not** paste SVG paths, invent alternate Cs, or duplicate lockups in feature code.

Constants: [`lib/brand/assets.ts`](../lib/brand/assets.ts)

---

## Logo usage

### Preferred compositions

1. **Product nav / auth / emails:** `Logo` with `variant="color"` (framed mark + “Chasum” wordmark).
2. **Hero / marketing:** same, larger `size="lg"` / `"xl"`.
3. **Mark only:** `Logo showText={false}` or `LogoMark`.
4. **On photography / dark UI:** `variant="light"`.
5. **On very light UI without the badge:** `variant="dark"`.

### Clear space

Maintain clear space around the mark equal to **at least 25% of the mark’s width** on all sides. Do not crowd with icons, chips, or dense copy.

### Minimum size

| Context | Min mark size |
|---------|----------------|
| Digital UI | 20×20 px |
| Favicon | 16×16 px (SVG scales) |
| Print / PDF | 0.3 in (≈ 8 mm) |
| Touch icon | 180×180 px (`apple-touch-icon.png`) |

Never distort, rotate (beyond 0°), or crop the open C.

---

## Colors

| Token | Hex | Role |
|-------|-----|------|
| Primary | `#1d4ed8` | Brand blue — badges, links, CTAs |
| Primary foreground | `#ffffff` | Ink on primary |
| Ink | `#0c1222` | Primary text |
| Spark | `#0f766e` | AI accent only |
| Background | `#f7f8fa` | App canvas |

Full product tokens: `app/globals.css`, [`docs/UI_GUIDELINES.md`](./UI_GUIDELINES.md).

Do not replace the C Mark with a purple-glow or generic sans “C”.

---

## Typography

- **Wordmark:** Geist Sans, semibold, tracking-tight, text “Chasum” (from `BRAND_NAME`).
- **UI:** Geist Sans; code: Geist Mono.
- Do not outline, skew, or recreate the wordmark as a custom SVG unless Marketing publishes a lockup file into `/public/brand/`.

---

## Icon spacing (framed badge)

The framed logo (`logo.svg`) uses an 8px-equivalent corner radius at 32×32 artboard (~22% rounding). Keep the stroke of The C Mark at the canonical weight — do not thicken for “visibility.”

---

## Do’s

- Use `Logo` / `LogoMark` everywhere (landing, dashboard, auth, booking, loaders, emails via hosted `/brand/logo.svg`).
- Pair The Spark with AI features — never as a replacement logo.
- Keep contrast: light mark on dark, dark/color mark on light.
- Link wordmark+mark together in navigation.

## Don’ts

- Don’t redesign The C Mark or draw a new letter C.
- Don’t use The Spark as the company logo.
- Don’t stretch, recolor arbitrarily (except approved light/dark/color variants), or add drop-shadows that obscure the stroke.
- Don’t place the mark on busy photo areas without a solid scrim.
- Don’t duplicate SVG path code outside `/public/brand/` + `lib/brand/assets.ts`.

---

## Application map

| Surface | Implementation |
|---------|----------------|
| Landing header / footer / hero | `Logo` |
| Dashboard sidebar / mobile drawer | `Logo` |
| Auth (login, signup, forgot, reset) | `Logo` via `AuthForm` |
| Public booking | `Logo` + tenant business logo |
| Loaders / splash | `PageLoader`, `SplashScreen`, `AppLoader` |
| Emails | Absolute URL to `/brand/logo.svg` |
| Favicon / PWA | Metadata + `site.webmanifest` |
| Customer portal (future) | Must use `Logo` from `@/components/brand/logo` |
| Mobile app (future) | Bundle `logo.svg` / `apple-touch-icon.png`; same clear space & min sizes |

---

## Change control

The C Mark is **final**. Asset or geometry changes require an explicit brand update — not a drive-by UI tweak.
