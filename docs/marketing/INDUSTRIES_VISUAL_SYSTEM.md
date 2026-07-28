# Industries — Premium Visual Experience

Source of truth for industry order, Legal Services positioning, and the
Chasum industry-photography system.

## Approved industry order (full `/industries` page)

1. Medical Clinics  
2. Legal Services  
3. Salons  
4. Spas  
5. Gyms  
6. Automotive  
7. Home & Field Services  
8. Photography & Creative  
9. Pet Services  
10. Cleaning  
11. Professional Services  

Canonical array: `lib/marketing/homepage.ts` → `INDUSTRIES`.

## Legal Services positioning

- Placed directly below Medical Clinics (second in hierarchy).
- Dedicated category — not folded into Professional Services.
- Homepage includes a dedicated **Legal Services** tile.
- Professional Services continues to cover accountants, consultants and
  similar advisory practices.
- Healthcare homepage tile maps to Medical Clinics and related care
  businesses.

### Required Legal Services content fields

| Field | Purpose |
| --- | --- |
| `intro` | Purpose-built law-firm positioning |
| `problem` | Workflow uniqueness (intake, cases, deadlines) |
| `solution` | Connected operational support |
| `types` | Representative practice areas (10) |
| `modules` | Recommended foundations including Payments |
| `note` | Privacy / confidentiality / not legal-advice disclaimer |
| `status` | Private Alpha · Available Today foundations |

## Industry image standards

- One premium hero image on the **active** Industries detail card.
- One restrained image band on each homepage industry tile.
- Consistent colour grading, authentic / modern / operational subjects.
- No readable patient or client data, no third-party logos, no embedded
  marketing text, no posed handshake clichés.

### Placement

| Surface | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| Industries detail | Upper-right of detail card | Alongside / below intro | Full-width below title + intro |
| Homepage tiles | 16:10 band above copy | Same ratio | Same ratio; copy remains primary |

### Interaction (Industries page)

- Selecting an industry updates copy + hero image without navigation.
- Calm crossfade ≈ 280ms (`.industry-detail-fade`).
- Fixed aspect-ratio media container — no layout jump / CLS.
- Respect `prefers-reduced-motion` (fade disabled).
- No sliders, carousels, or autoplay.

## Image mapping

Central map: `lib/marketing/industry-visuals.ts`

Each entry defines:

- `id`
- `src` / `tileSrc` (local WebP under `/public/marketing/industries/`)
- `alt` (meaningful for detail heroes; decorative `alt=""` on tiles)
- `objectPosition` when focal guidance is needed
- explicit width / height for CLS control

Do **not** hardcode image paths inside multiple components.
Do **not** hotlink remote stock URLs.

## Sourcing requirements

Allowed:

- Properly licensed assets (currently Unsplash License)
- Chasum-owned assets
- Approved generated imagery
- Assets already permitted in the repository

Attribution file: `public/marketing/industries/ATTRIBUTION.json`

Performance:

- WebP local assets
- Next.js `Image` with responsive `sizes`
- Lazy-load below-the-fold tile imagery
- Preload only the default detail hero (Medical Clinics)
- Meaningful alt text on detail heroes; decorative tile images hidden
  from assistive technology (`alt=""`)

## Alt-text requirements

- Detail heroes describe the operational scene without claiming Chasum
  customers or inventing testimonials.
- Never describe readable confidential records.
- Homepage tile photos are decorative (adjacent title + blurb convey
  meaning); use empty alt.

## Deferred Version 2 ideas

- Dedicated Education deep-dive on the full Industries page
- Industry-specific video atmosphere (muted, no autoplay audio)
- Owner-approved authentic photography replacing stock where available
- Per-industry hash deep-links (`/industries#legal-services`)

Do not expand this into a broad product roadmap.
