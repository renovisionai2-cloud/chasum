# Industries — Editorial Photography System

Visual source of truth for industry order and shared photography.

## Approved industry order (full `/industries` page)

1. Medical Clinics  
2. Legal Services  
3. Salons  
4. Spas  
5. Gyms  
6. Home & Field Services  
7. Automotive  
8. Professional Services  
9. Photography & Creative  
10. Pet Services  
11. Cleaning  

Canonical array: `lib/marketing/homepage.ts` → `INDUSTRIES`.  
Order constant: `lib/marketing/industryImages.ts` → `INDUSTRIES_PAGE_ORDER`.

Education remains a homepage category tile (maps to the shared Education asset).

## Legal Services positioning

- Second on the Industries page (directly below Medical Clinics).
- Dedicated homepage tile — not folded into Professional Services.
- Healthcare → Medical Clinics asset; Professional Services → advisors /
  consultants only.

## Editorial photography standards

Images should feel like Apple editorial photography:

- Natural lighting, modern workplaces, shallow depth of field
- Real people working; warm neutral colour grade
- No cartoons, illustrations, exaggerated AI look, or handshake clichés
- No readable patient / client records or third-party logos

### Surfaces

| Surface | Treatment |
| --- | --- |
| Industries detail | One hero in upper-right (`md+`); full-width below title/intro on mobile; rounded corners; subtle shadow; `object-cover`; fixed aspect (no CLS) |
| Homepage tiles | Full-bleed editorial photo; dark gradient overlay; white title + blurb; same card min-height; hover scale unchanged |

## Shared image system

Canonical map: `lib/marketing/industryImages.ts`

Each entry:

- `id`
- `hero`
- `thumbnail`
- `alt`
- optional `objectPosition`
- explicit width / height

Homepage category labels alias to the same asset paths as the Industries
page (no duplicated image paths). Compatibility helpers remain in
`lib/marketing/industry-visuals.ts`.

Do **not** hardcode paths in multiple components.
Do **not** hotlink remote stock URLs.

## Performance

- Local WebP via Next.js `Image`
- Responsive `sizes`
- Lazy-load below-the-fold; `priority` only for the default detail hero
- Fixed media aspect / card min-height → CLS ≈ 0

## Accessibility

- Meaningful `alt` on Industries detail heroes
- Decorative homepage tile photos use `alt=""` (title + blurb convey meaning)
- Keyboard listbox / option interaction unchanged
- `prefers-reduced-motion` disables fade / hover scale

## Deferred Version 2

- Education deep-dive on the full Industries page
- Owner-approved authentic photography replacing licensed stock
- Industry hash deep-links (`/industries#legal-services`)
