# Industries Writing Standard

**Status:** Permanent writing standard — Final Wording Pass  
**Canonical content:** `lib/marketing/homepage.ts` → `INDUSTRIES`  
**Shared capability chips:** `CORE_CHASUM_CAPABILITIES`  
**Shared growing statement:** `INDUSTRY_GROWING_STATEMENT`  
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
| Is my business one of these? | `intro` (**Designed for**) + `types` |
| What can Chasum help me with today? | `solution` (**How Chasum helps today**) + `modules` (**Core Chasum Capabilities**) |
| How does Chasum continue to grow with my business? | Shared `INDUSTRY_GROWING_STATEMENT` (**Growing with your business**) |

Do **not** put lists of missing features on the Industries page. Keep those constraints in this doc and the Product Truth Matrix for writers—not in visitor-facing copy.

Do **not** turn Growing into a roadmap or future feature list.

---

## Core Chasum Capabilities (public chips)

- AI Receptionist
- Appointment Scheduling
- CRM
- Customer Communication
- Team Coordination
- Payments
- Reporting
- Business Memory
- Multi-location

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

1. Add an `INDUSTRIES` entry with `intro`, `solution`, `types`, `modules: [...CORE_CHASUM_CAPABILITIES]`, and `status`.
2. Do not add a custom growing statement — the shared constant is required.
3. Add photography via `lib/marketing/industryImages.ts`.
4. Update unit tests in `tests/unit/marketing/industries-legal.test.ts`.
5. Verify against this standard and the Product Truth Matrix before merge.
