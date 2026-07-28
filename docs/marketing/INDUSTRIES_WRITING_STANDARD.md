# Industries Writing Standard

**Status:** Permanent lock standard — Operation Chasum Final Lock Sprint  
**Canonical content:** `lib/marketing/homepage.ts` → `INDUSTRIES`  
**Homepage tiles:** `components/landing/homepage-industries.tsx` → `HOMEPAGE_INDUSTRY_TILES`  
**Visual system:** [INDUSTRIES_VISUAL_SYSTEM.md](./INDUSTRIES_VISUAL_SYSTEM.md)  
**Capability truth:** [PRODUCT_TRUTH_MATRIX.md](./PRODUCT_TRUTH_MATRIX.md)

After the Final Lock Sprint, Industries requires no further design or content work unless a genuine bug is discovered.

---

## Principle

> Promise only what exists.  
> Inspire with what is coming.  
> Never imply functionality that has not yet been built.  
> Never imply Chasum replaces specialized industry software unless that capability actually exists.

Visitors should leave thinking:

**“Chasum understands businesses like mine.”**

Not:

**“Chasum replaces every piece of software I already use.”**

---

## Required structure (every industry)

Every industry entry must communicate, in this order of meaning:

1. **Designed for…** — `intro` opens with “Designed for…” and names the industry audience.
2. **Representative business types** — `types` lists concrete businesses or practice areas operators recognize.
3. **How Chasum helps today** — `solution` describes Available Today / Early Access foundations only (scheduling, CRM, communication, staff, payments, reporting, AI reception where true).
4. **Future evolves without overclaim** — close with language such as “Industry-specific … workflows continue to evolve.” Do not promise unavailable features.

Supporting fields:

| Field | Role |
| --- | --- |
| `problem` | Workflow pressure operators feel (not a feature list) |
| `modules` | Recommended product foundations already in the product |
| `note` | Required when non-claims must be explicit (Medical, Legal, Automotive) |
| `status` | Private Alpha framing |

---

## Approved positioning language

Prefer:

- Designed for…
- Helps manage…
- Helps coordinate…
- Supports daily / business operations…
- Today, Chasum helps…
- Industry-specific workflows continue to evolve

Avoid unless factually true today:

- Complete industry solution
- Manages every aspect
- Replaces existing software
- End-to-end platform
- Full industry management

---

## Explicit non-claims by industry

| Industry | Do not imply (unless built) |
| --- | --- |
| Medical Clinics | EMR/EHR, PACS, diagnostic reporting, clinical documentation, medical charting |
| Legal Services | Legal advice, case management, legal document automation, court integrations |
| Automotive Services | Estimating, repair management, inventory, OEM integrations, VIN decoding, warranty processing, parts management |
| Home & Field Services | Estimating, project management, takeoffs |
| Professional Services | Specialized compliance certifications |

---

## Homepage tiles

Homepage tiles are category summaries, not full industry pages. Each blurb should open with **Designed for…** (or equivalent) and stay truth-first. Do not invent capabilities absent from `PRODUCT_TRUTH_MATRIX.md`.

---

## Adding a future industry

1. Add an `INDUSTRIES` entry with `intro`, `problem`, `solution`, `types`, `modules`, and `status`.
2. Add photography via `lib/marketing/industryImages.ts` (see visual system).
3. Update order docs and unit tests in `tests/unit/marketing/industries-legal.test.ts`.
4. Verify against this standard and the Product Truth Matrix before merge.
