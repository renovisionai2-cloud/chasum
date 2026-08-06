# World Class Industry Readiness Matrix

**Chapter:** 0  
**Industry list source:** `lib/marketing/homepage.ts` (`INDUSTRIES`) + `/industries` page  
**Homepage tiles:** `components/landing/homepage-industries.tsx` (includes **Education** not on Industries page)  
**Rule:** Configuration + icons ≠ industry support. Essential workflow must function.  

**Healthcare:** Specialized future workspace — not EMR in v1 (`docs/HEALTHCARE_WORKSPACE_DIRECTION.md`, Enterprise: no clinical records in v1).  

---

## Shared OS foundations (all marketed industries)

Claimed chips: AI Business Manager · Appointment Scheduling · CRM · Customer Communication · Team Coordination · Payments · Reporting · Business Memory · Multi-location  

| Capability | Status | Notes |
|------------|--------|-------|
| Assigned-employee appointments | Fully supported (GVM path) | Phase 0 Production |
| Public booking | Fully supported | `/book/[slug]` |
| CRM | Fully supported | |
| Manual payments / deposits / receipts | Fully supported | Card Elements Coming Next |
| Multi-location | Fully supported | Plan quotas |
| Email confirmations | Fully supported | Config-dependent |
| SMS | Partially supported | Plan + Twilio |
| Summer | Partially supported | Early Access — not full automation |
| Unassigned employee booking | Not production-ready | Migrations 034+ blocked |
| Rooms/resources | Not applied | Migration 036 prepared only |
| Inventory | Not supported | Placeholder |
| Staff login / RBAC | Coming Next | Directory exists |
| EMR / PHI | Not supported | Correct |

---

## Industry readiness (category level)

| Industry (marketing) | Model | Essential journey | Existing support | Config gaps | Product gaps | Logic gaps | Compliance | Readiness | Chapter |
|----------------------|-------|-------------------|------------------|-------------|--------------|------------|------------|-----------|---------|
| Medical Clinics | Appointment + clinical risk | Book → visit → pay → follow-up; **no EMR required for foundations** | Core OS | Specialty forms | Charting, consent packs, PHI | Clinical workflows | High if overclaimed | **Partially supported** (non-clinical foundations only) | 14 |
| Legal Services | Consult appointments | Book → consult → notes → invoice | Core OS | Matter types | Matter/case mgmt | Billing rules | Med | **Supported with configuration** | 14 |
| Salons | Appointment + packages | Book → service → pay → rebook | Core OS | Chair resources | Resources migration | Retail inventory | Low | **Supported with configuration** | 14 |
| Spas | Appointment + packages | Same + memberships | Core OS + memberships hub | Membership UX | Advanced memberships | — | Low | **Supported with configuration** | 14 |
| Gyms | Classes + memberships | Sessions, capacity, memberships | Memberships hub; weak class capacity | Class capacity | Class scheduling product | Recurring billing | Low | **Partially supported** | 14 |
| Home & Field Services | Jobs / sites | Quote → schedule → crew → invoice | Appointments as jobs (stretch) | Job address, travel | Project/job OS | Crew, materials | Low | **Requires product work** | 14 |
| Automotive Services | Shop appointments | Book → bay → repair → invoice | Core OS | Bay/resources | Resources, RO workflow | Parts inventory | Low | **Partially supported** | 14 |
| Professional Services | Consult / retainers | Book → deliver → invoice | Core OS | Retainers | Project billing | — | Low | **Supported with configuration** | 14 |
| Photography & Creative | Sessions / packages | Book → shoot → deliver → pay | Core OS + packages | Galleries | Deliverables | — | Low | **Supported with configuration** | 14 |
| Pet Services | Appointments | Book → service → pay | Core OS | Pet profiles | Species fields | — | Low | **Supported with configuration** | 14 |
| Cleaning | Recurring / sites | Schedule → complete → invoice | Core OS | Recurring jobs | Field ops | Site checklists | Low | **Partially supported** | 14 |
| Education (homepage only) | Classes | — | Not on Industries page | Taxonomy | Entire vertical | — | — | **Not currently supported** (tile-only) | 14 |

---

## Subtype note

Full subtype lists (ultrasound studios, HVAC, collision, etc.) live in `INDUSTRIES`. For Chapter 0, **category readiness** applies: subtypes inherit the same OS unless a dedicated workflow exists (none do beyond configuration).

**GVM Baby World:** Elective ultrasound on **universal** OS — Fully supported for Phase 0 assigned-employee commercial workflow; not a clinical EMR product.

---

## Readiness classifications used

- Fully supported  
- Supported with configuration  
- Partially supported  
- Requires product work  
- Future roadmap  
- Not currently supported  

---

## Chapter 14 directive

Do not build one-off industry forks. Prefer reusable capabilities (resources, jobs, memberships, classes) gated honestly. Never claim EMR/HIPAA completeness.  
