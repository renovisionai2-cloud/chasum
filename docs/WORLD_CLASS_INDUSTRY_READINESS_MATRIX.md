# World Class Industry Readiness Matrix

**Chapter:** 0 — Audit Completion Addendum  
**Branch:** `cursor/world-class-portal-foundation`  
**Production baseline:** `4eecbec`  
**Industry list authority:** Marketing website sources below — **not a guessed list**  
**Mode:** Documentation only  
**Owner decision:** Education is **not fully supported** until workflows and testing are complete.


---

## Source inventory (final marketed set)

| Source | Route / file | What it lists |
|--------|--------------|---------------|
| Industries overview | `/industries` ← `lib/marketing/homepage.ts` `INDUSTRIES` | **11** named industries (authoritative for “supported industries” page) |
| Capability chips | `CORE_CHASUM_CAPABILITIES` | 9 chips applied to every industry |
| Homepage tiles | `/` ← `components/landing/homepage-industries.tsx` `HOMEPAGE_INDUSTRY_TILES` | **10** tiles (naming differs; includes **Education**) |
| Individual industry pages | — | **None** (`/industries/[slug]` does not exist) |
| Apply categories | `flagship-summer` `FS_BUSINESS_CATEGORIES` | Form categories (not readiness claims) |

### Canonical `/industries` list (11)

1. Medical Clinics  
2. Legal Services  
3. Salons  
4. Spas  
5. Gyms  
6. Home & Field Services  
7. Automotive Services  
8. Professional Services  
9. Photography & Creative  
10. Pet Services  
11. Cleaning  

### Homepage-only tile not on `/industries`

| Name | Source | Readiness |
|------|--------|-----------|
| Education | `HOMEPAGE_INDUSTRY_TILES` | **Not currently supported** as marketed industry page — taxonomy drift |

### Naming bridges (homepage tile → industries page)

| Homepage tile | Maps toward |
|---------------|-------------|
| Healthcare | Medical Clinics |
| Beauty & Personal Care | Salons (+ Spas adjacency) |
| Fitness & Wellness | Gyms |
| Home & Construction Services | Home & Field Services |

---

## Shared OS vs industry-ready OS

| Layer | Meaning |
|-------|---------|
| **Generic booking workflow** | Appointments, availability, customers, payments (manual), email — Phase 0 GVM path |
| **Configurable industry workflow** | Same OS + services/hours/locations/staff configuration; labels change |
| **Genuine industry-ready OS** | Essential vertical journey works end-to-end (resources, jobs, classes, clinical, RO, etc.) |

**Rule:** Configuration + icons ≠ industry support.

### Shared chips promised to every industry

AI Business Manager · Appointment Scheduling · CRM · Customer Communication · Team Coordination · Payments · Reporting · Business Memory · Multi-location  

| Chip | Reusable capability today | Gap |
|------|---------------------------|-----|
| Appointment Scheduling | Fully supported (assigned employee); Reception/Calendar Ch3 ops UI; business-TZ day/week/month ranges | Unassigned create gated (034); Resources empty until Ch9; travel-time automation absent |
| CRM / Communication / Team | Fully / partial | Staff login Coming Next |
| Payments | Manual AT; card Coming Next | “Online” overclaim |
| Reporting | Foundations | Advanced undefined |
| Multi-location | Fully supported (quotas) | Roadmap Future Vision conflict |
| AI Business Manager | Early Access | Not autonomous |
| Business Memory | Limited | Overclaim risk |

---

## Industry readiness (one row per marketed industry)

| Industry | Route | Source | Promised capabilities | Reusable Chasum today | Missing engines | Missing logic | Missing data model | Missing permissions | Missing entitlement | Missing tests | Compliance | Readiness | Earliest Ch | Pilot |
|----------|-------|--------|----------------------|----------------------|-----------------|---------------|--------------------|---------------------|---------------------|---------------|------------|-----------|-------------|-------|
| Medical Clinics | `/industries` | `INDUSTRIES[0]` | Foundations chips + patient communication / reminders | Booking, CRM, email, manual pay | Clinical charting, consent packs | Clinical workflows | PHI / EMR tables | Clinical roles | N/A | Vertical scenarios | **High if overclaimed as EMR** | **Partially supported** (non-clinical foundations only) | 14 | GVM ultrasound elective only — not clinical EMR |
| Legal Services | `/industries` | `INDUSTRIES[1]` | Consultations, CRM, billing, team | Core OS | Matter/case mgmt | Matter billing rules | Matters | — | — | Vertical | Med (confidentiality) | **Supported with configuration** | 14 | Consult booking pilot |
| Salons | `/industries` | `INDUSTRIES[2]` | Appointments, staff, payments, CRM | Core OS + packages | Chair/resources | Retail inventory | Resources (036 blocked) | — | Inventory claim | Vertical | Low | **Supported with configuration** | 14 | Strong fit |
| Spas | `/industries` | `INDUSTRIES[3]` | Rooms, treatments, payments | Core + memberships hub | Rooms/resources | Advanced memberships | Resources | — | — | Vertical | Low | **Supported with configuration** | 14 | With room caveat |
| Gyms | `/industries` | `INDUSTRIES[4]` | Sessions, **memberships**, staff, payments | Memberships CRUD; weak classes | Class capacity, attendance | Recurring billing | Class sessions | — | — | Vertical | Low | **Partially supported** | 14 | Membership ops only |
| Home & Field Services | `/industries` | `INDUSTRIES[5]` | Estimates, jobs, crews, sites | Appointments as stretch jobs | Job/field OS, travel | Crew, materials, quotes | Job sites, photos | Field roles | — | Vertical | Low | **Requires product work** | 14 | Not ready as field OS |
| Automotive Services | `/industries` | `INDUSTRIES[6]` | Bookings, shop schedules, payments, multi-bay implied | Core appointments | RO, bays, parts | Repair orders, parts | Vehicles, RO | Shop roles | Inventory | Vertical | Low | **Partially supported** | 14 | Appointment-only shops; **not** repair management |
| Professional Services | `/industries` | `INDUSTRIES[7]` | Booking, CRM, payments, reporting | Core OS | Project retainers | Progress billing | Projects | — | — | Vertical | Low | **Supported with configuration** | 14 | Advisors |
| Photography & Creative | `/industries` | `INDUSTRIES[8]` | Sessions, deposits, CRM, reporting | Core + deposits | Galleries/deliverables | Delivery workflow | Assets | — | — | Vertical | Low | **Supported with configuration** | 14 | Session studios |
| Pet Services | `/industries` | `INDUSTRIES[9]` | Recurring visits, reminders, payments | Core OS | Pet profiles | Species-specific | Pet entities | — | — | Vertical | Med (vet clinical) | **Supported with configuration** (grooming); vet clinical = medical caveats | 14 | Grooming first |
| Cleaning | `/industries` | `INDUSTRIES[10]` | Recurring routes, crews, changes | Core OS | Field routes, checklists | Recurring job OS | Sites, routes | — | — | Vertical | Low | **Partially supported** | 14 | Simple recurring appts only |
| Education | `/` tile only | `HOMEPAGE_INDUSTRY_TILES` | Soft blurb | None dedicated | Entire vertical | Classes/LMS | — | — | — | — | — | **Not currently supported** | 14 | Remove or add page after product |

---

## Explicit non-readiness (do not claim ready)

| Workflow | Marketed adjacency | Status |
|----------|-------------------|--------|
| Pharmacy / dispensing | Medical subtypes none explicit “pharmacy” | **Not currently supported** |
| EMR / PHI clinical records | Medical Clinics | **Not supported** — Enterprise direction: no clinical records in v1 |
| Automotive repair management (RO/parts) | Automotive Services | **Requires product work** |
| Construction project management | Home & Field / Construction tile | **Requires product work** |
| Field-service job OS (travel, crew, site) | Home & Field, Cleaning | **Requires product work** |
| Membership/class OS (capacity, attendance, recurring bill) | Gyms | **Partially supported** (membership directory only) |
| Resource-based (rooms/chairs/bays) | Spas, Salons, Automotive | **Not applied** — migration 036 blocked |
| Professional project billing | Professional Services | **Configuration / partial** |

---

## Pilot mapping (requested)

| Pilot / requirement | Fits marketed industry | Readiness note |
|---------------------|------------------------|----------------|
| **GVM Baby World** (elective ultrasound) | Medical Clinics → Private Ultrasound / 3D–5D Baby Ultrasound Studios subtypes | **Fully supported** for Phase 0 assigned-employee commercial workflow on universal OS — **not** EMR |
| Multi-location automotive | Automotive Services + Multi-location chip | Locations **supported**; automotive RO **not** |
| Pharmacy | Not a named industry | Not supported |
| Construction | Home & Field / Construction tile | Not project-ready |
| Field-service | Home & Field, Cleaning | Not job-OS-ready |
| Membership/class | Gyms, Spas | Membership CRUD partial; classes weak |
| Resource-based | Spas, Salons, Automotive | Blocked on 036 |
| Professional-service | Professional Services, Legal | Config-supported for consult booking |

---

## Readiness classifications used

- Fully supported  
- Supported with configuration  
- Partially supported  
- Requires product work  
- Future roadmap  
- Not currently supported  

---

## Counts (Addendum)

| Metric | Count |
|--------|------:|
| Industries on `/industries` | 11 |
| Homepage tiles | 10 |
| Individual industry routes | 0 |
| Industries Fully supported (vertical OS) | 0 (GVM = commercial ultrasound on universal OS) |
| Supported with configuration | 5+ |
| Requires product work | Home & Field (+ construction/field) |
| Owner decisions | Education tile fate; Medical non-EMR wording; Inventory “where applicable” vs verticals |

**Chapter 14 directive:** Prefer reusable engines over one-off industry forks. Never claim EMR/HIPAA/pharmacy/RO completeness without repository proof.
