# Business Category Discovery (Phase 8)

Premium category accordion for Meet Summer Business Discovery. UX/UI only — engines unchanged.

## UX philosophy

Visitors should feel Summer already understands their world before the first message.

Instead of a dense wall of industry buttons, businesses are organized into elegant categories — closer to choosing a profile in a premium Apple / OpenAI / Linear product than filling an enterprise form.

Principles:

- Calm hierarchy (category → industry)
- One decision at a time
- Generous spacing, glass surfaces, soft blue accents
- Selection feels intentional, not transactional

## Category architecture

Data lives in `lib/marketing/flagship-summer.ts` as `FS_BUSINESS_CATEGORIES`.

| Category | Examples |
| --- | --- |
| Healthcare | Ultrasound, Dental, Chiropractic, … |
| Beauty & Personal Care | Hair Salon, Spa, Medical Spa, … |
| Fitness & Wellness | Gym, Yoga, Pilates, … |
| Pet Services | Veterinary, Pet Grooming, … |
| Automotive | Auto Repair, Detailing, … |
| Home Services | Cleaning, HVAC, Plumbing, … |
| Professional Services | Law, Accounting, Consulting, … |
| Photography & Creative | Studio, Videography, Photo Booth |
| Education | Tutoring, Music, Driving School |
| Other | Other Appointment-Based Business |

Each industry has:

- `id` — UI selection key
- `label` — visible name
- `prompt` — natural-language sentence sent to the existing Discovery Engine

`FS_BUSINESS_TYPES` remains as a flat derived list for compatibility.

## Expansion behavior

Component: `components/marketing/flagship-summer/flagship-discovery.tsx`

- Accordion cards; **only one category open at a time**
- Opening a category closes the previous (smooth `grid-template-rows` animation)
- Healthcare opens by default for discoverability
- Selecting an industry:
  1. Highlights the row (`aria-pressed`)
  2. Calls `onSelect(prompt, id)` → existing `send()` / Discovery flow
  3. Conversation continues unchanged

Styles: `.fs-cat-*` in `app/globals.css`.

## Integration with Business Discovery Engine

No new backend. No new AI. No OpenAI.

Selection still feeds the same path used before Phase 8:

`FlagshipDiscovery.onSelect` → `FlagshipExperience.send(prompt)` → Session Memory extractors / Knowledge Engine / Provider Registry.

Industry prompts are written so known extractors (ultrasound, salon, spa, dental, fitness, veterinary, etc.) continue to fire where patterns already exist. Unfamiliar industries still enter discovery conversationally via the raw prompt.

## Accessibility

- Category headers: `aria-expanded`, `aria-controls`
- Panels: `role="region"`, `aria-labelledby`, `inert` when collapsed
- Industry buttons: `aria-pressed`, visible focus rings
- Keyboard: header and industry buttons are native focusable controls
- `prefers-reduced-motion`: expand / hover transitions disabled

## Future scalability

- Add industries by appending to `FS_BUSINESS_CATEGORIES` only
- Optional search / filter layer without changing engine contracts
- Localized category labels
- Soft suggest “Similar businesses” after selection (still marketing UI)
- Keep engine playbooks independent — UI taxonomy can grow faster than typed `BusinessType` enums
