# Industries Writing Standard

**Status:** Permanent writing standard — Core Capabilities Refinement  
**Canonical content:** `lib/marketing/homepage.ts` → `INDUSTRIES`  
**Shared capability chips:** `CORE_CHASUM_CAPABILITIES`  
**Homepage tiles:** `components/landing/homepage-industries.tsx` → `HOMEPAGE_INDUSTRY_TILES`  
**Visual system:** [INDUSTRIES_VISUAL_SYSTEM.md](./INDUSTRIES_VISUAL_SYSTEM.md)  
**Capability truth:** [PRODUCT_TRUTH_MATRIX.md](./PRODUCT_TRUTH_MATRIX.md)

---

## Principle

> Promise only what exists.  
> Inspire with what is coming.  
> Never imply functionality that has not yet been built.

Visitors should leave thinking:

**“Chasum already solves important parts of my business.”**

Not:

**“Here’s everything Chasum doesn’t do.”**

---

## Required structure (every industry)

1. **Designed for…** — `intro`
2. **Representative business types** — `types`
3. **How Chasum helps today** — `solution` (positive, Available Today / Early Access only)
4. **Core Chasum Capabilities** — `modules` from `CORE_CHASUM_CAPABILITIES`
5. **Future evolves without overclaim** — close solutions with “Industry-specific … workflows continue to evolve.”

Do **not** put lists of missing features on the Industries page (OEM, VIN, estimating, inventory, repair management, warranty, parts, EMR catalogs, case-management catalogs, etc.). Keep those constraints in this doc and the Product Truth Matrix for writers—not in visitor-facing copy.

---

## Core Chasum Capabilities (public chips)

Use this shared set consistently across industries:

- AI Receptionist
- Appointment Scheduling
- Customer Communication
- CRM
- Team Scheduling
- Payments
- Business Reporting
- Business Memory
- Multi-location Support

UI label: **Core Chasum Capabilities** (not “Recommended product foundations”).

---

## Approved positioning language

Prefer:

- Designed for…
- Today, Chasum helps manage…
- Helps coordinate…
- Industry-specific workflows continue to evolve

Avoid on the Industries page:

- Catalogs of unimplemented features
- “Not a replacement for…” lists that spotlight gaps
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

1. Add an `INDUSTRIES` entry with `intro`, `problem`, `solution`, `types`, `modules: [...CORE_CHASUM_CAPABILITIES]`, and `status`.
2. Add photography via `lib/marketing/industryImages.ts`.
3. Update unit tests in `tests/unit/marketing/industries-legal.test.ts`.
4. Verify against this standard and the Product Truth Matrix before merge.
