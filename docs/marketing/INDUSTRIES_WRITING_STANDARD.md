# Industries Writing Standard

**Status:** Permanent writing standard — Final Wording Pass  
**Canonical content:** `lib/marketing/industries-page.ts` → `INDUSTRIES`  
**Shared growing statement:** `INDUSTRY_GROWING_STATEMENT` (page-level, not repeated on every card)  
**Homepage tiles:** `components/landing/homepage-industries.tsx` → `HOMEPAGE_INDUSTRY_TILES`  
**Visual system:** [INDUSTRIES_VISUAL_SYSTEM.md](./INDUSTRIES_VISUAL_SYSTEM.md)  
**Capability truth:** [PRODUCT_TRUTH_MATRIX.md](./PRODUCT_TRUTH_MATRIX.md)

---

## Principle

> Promise only what exists.  
> Inspire with what is coming.  
> Never imply functionality that has not yet been built.

Visitors should leave thinking:

1. **Chasum was designed for businesses like mine.**
2. **I understand what it does today.**
3. **I know the platform will continue to evolve.**

Not:

**“Here’s everything Chasum doesn’t do.”**

---

## Required structure (every industry)

Within the first few seconds, every industry answers:

| Question | Field / UI |
| --- | --- |
| Who is this for? | `intro` |
| What makes this operating model different? | `distinction` |
| How does Chasum help connect it today? | `solution` |
| Proof | `types` (secondary) + `modules` (relevant chips only) |

Growing with your business is a **shared page-level** statement (`INDUSTRY_GROWING_STATEMENT`), not a repeated card paragraph.

Do **not** put lists of missing features on the Industries page. Keep those constraints in this doc and the Product Truth Matrix for writers—not in visitor-facing copy.

Do **not** turn Growing into a roadmap or future feature list.

Education remains a homepage tile only. Do **not** add an Industries deep-dive unless the product owner explicitly requests it.

---

## Capability chips (public)

Use current-generation marketing names. Choose the most relevant chips per industry — not every capability on every card.

Scheduling chips may use an industry-native label for the **same underlying scheduling capability**. Do not invent dispatch, routing, or job-management product features. Do not rename dashboard navigation.

Allowed scheduling labels:

- Appointment Scheduling — Medical Clinics, Salons, Spas, Pet Services
- Consultation Scheduling — Legal Services, Professional Services
- Session Scheduling — Gyms, Photography & Creative
- Job Scheduling — Home & Field Services, Cleaning
- Service Scheduling — Automotive Services

Other chips:

- Customer Records
- Employees
- Payments
- Communications
- Reporting
- Multi-location
- Packages
- Memberships

Avoid on Industries chips: CRM, Billing, Dashboard, AI Workforce, Communication (singular), Team Coordination.

---

## Representative types

Keep the full source taxonomy in `INDUSTRIES[].types`. The display layer may show the first 8 chips with a quiet `+ N more` control. Do **not** delete valid supported types from the source model to shorten a card.

Veterinary Clinics belongs under **Pet Services**, not as a Medical Clinics subtype. Meet Summer may still offer dual discovery paths; that is not Industries representative-type duplication.

---

## Growing with your business (shared)

Use `INDUSTRY_GROWING_STATEMENT` exactly—one concise continuous-improvement line for every industry.

---

## Approved positioning language

Prefer:

- Designed for…
- Chasum helps… manage…
- Growing with your business (shared statement)

Avoid on the Industries page:

- Catalogs of unimplemented features
- Roadmaps or “coming next” feature lists in industry detail
- Complete industry solution / end-to-end / replaces existing software (unless factually true)

---

## Internal non-claims (writers only — not page copy)

| Industry | Do not imply on marketing surfaces (unless built) |
| --- | --- |
| Medical Clinics | EMR/EHR, PACS, diagnostic reporting, clinical documentation, medical charting |
| Legal Services | Legal advice, case management, legal document automation, court integrations |
| Automotive Services | Estimating, repair management, inventory, OEM integrations, VIN decoding, warranty processing, parts management |
| Home & Field Services | Estimating, project management, takeoffs |
| Professional Services | Specialized compliance certifications |

---

## Adding a future industry

1. Add an `INDUSTRIES` entry in `lib/marketing/industries-page.ts` with `intro`, `distinction`, `solution`, `types`, relevant `modules`, and `status`.
2. Do not add a custom growing statement — the shared constant is required.
3. Add photography via `lib/marketing/industryImages.ts`.
4. Update unit tests in `tests/unit/marketing/industries-legal.test.ts`.
5. Verify against this standard and the Product Truth Matrix before merge.
