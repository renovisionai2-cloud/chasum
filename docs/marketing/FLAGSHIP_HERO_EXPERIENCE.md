# Flagship Hero Experience (Phase 7)

Cinematic introduction for `/meet-summer`. Visual experience only — no engine, CRM, or authenticated-app changes.

## Hero architecture

| Layer | Role |
| --- | --- |
| `.fs-hero-lock` | Locks the viewport while the intro plays — no journey, chat, or scroll chrome |
| `.fs-hero-atmosphere` | Infinite midnight field: void, bloom, volumetric light, particles, horizon |
| `SummerOrb` (`cinematic`, `size="hero"`) | Living identity — core, ring, haze, ripple, particle halo |
| Typography stack | Brand → headline → micro lines → CTA + hint |
| Exit path | Orb expand + soft fade → journey veil dissolves into chapter one |

Components:

- `components/marketing/flagship-summer/flagship-hero.tsx`
- `components/marketing/flagship-summer/summer-orb.tsx`
- `components/marketing/flagship-summer/flagship-experience.tsx` (begin / exit timing)
- Styles under `.fs-*` in `app/globals.css`
- Copy in `lib/marketing/flagship-summer.ts` (`FS_HERO`)

## Animation sequence

| Time | Event |
| --- | --- |
| 0.0s | Screen fades in from black |
| 0.8s | Blue light / bloom appears |
| 1.6s | Orb materializes |
| 2.3s | Breathing, float, pulse begin |
| 3.0s | **MEET SUMMER** fades in |
| 3.8s | Headline + microcopy fade in |
| 4.6s | Primary CTA + hint appear |

On **Begin the Experience**:

1. Orb emits an expand pulse
2. Hero brightness rises and opacity falls (~1.15s)
3. After ~1.2s the journey mounts behind a short veil fade
4. Visitor enters the next chapter without an abrupt jump-cut scroll

## Motion philosophy

- Smooth, precise, confident, calm, cinematic
- No bounce, no flashy loops, no attention-stealing effects
- Transforms and opacity only where possible; `will-change` limited to bloom / volumetric layers
- Easing: `--fs-ease` / `--fs-ease-soft` (ease-out curves)
- Orb reads as calm intelligence: slow breathe, soft pulse, gentle float, faint ripple, sparse halo

## Accessibility

- `prefers-reduced-motion: reduce` skips the timed reveal, float, breathe, exit expand, and journey veil — content is visible immediately
- CTA remains keyboard-focusable with a clear focus ring
- Orb uses `role="img"` + accessible label
- Microcopy is semantic list content, not decorative-only

## Performance

- CSS-only motion (no JS animation loops on the hero)
- GPU-friendly transforms / opacity
- Particle field is sparse CSS radial dots, not canvas
- Target: maintain 60fps on typical marketing devices

## Future evolution

- Optional WebGL / shader bloom if a later brand film requires it (keep a CSS fallback)
- Chapter-to-chapter shared orb continuity (hero orb morphs into awakening orb)
- Localized sequence timings via CSS custom properties
- Optional audio bed (user-initiated only) tied to the same timeline
