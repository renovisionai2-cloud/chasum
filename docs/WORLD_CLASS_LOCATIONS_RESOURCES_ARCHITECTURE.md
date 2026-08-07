# World Class Locations & Resources Architecture

**Status:** REQUIRED BEFORE PUBLIC LAUNCH  
**Implementation chapter:** Execution **Chapter 9 — Business Structure Engine** (expanded from basic setup)  
**This document:** Planning only — **no database changes in Chapter 3**  
**Branch:** `cursor/world-class-portal-foundation`  
**Related:** Migration **036** / `CHASUM_RESOURCES_ENABLED` remain gated; do not apply without PO  

---

## Core hierarchy

```
Business
  → Location
      → Resources
```

| Concept | Meaning |
|---------|---------|
| **Business** | The operating entity (tenant) |
| **Location** | A physical or operational site of the business |
| **Resource** | Bookable capacity that **belongs to a Location** |

Locations and Resources are **separate but tightly connected**. A resource is never orphaned from a location in the target model.

---

## Location (site)

A Location represents a place where the business operates.

Future Location capabilities (Chapter 9):

- Add / edit / archive location  
- Location hours  
- Location timezone (may differ from business default)  
- Contact details  
- Staff assignment  
- Services offered  
- Taxes  
- Notifications  
- Plan limits (quota)  

Current product: locations exist and are manageable under **Business → Locations** (`/dashboard/business?tab=locations`). Full structure engine is not complete.

---

## Resource (bookable capacity)

A Resource is bookable place, equipment, or capacity associated with a Location.

### Categories (future)

**Place**

- Office, consultation room, treatment room, ultrasound room  
- Service bay, chair, desk, workstation, court, studio  

**Equipment**

- Ultrasound machine, scanner, diagnostic device  
- Vehicle, specialized tool  

**Capacity**

- Seats, stations, bays, rooms  

---

## Future booking relationship

```
Service
  → Location
  → Person + Place + Equipment
```

A service may require any of:

| Requirement | Example |
|-------------|---------|
| Person only | Phone consultation |
| Place only | Self-serve desk (coworking) |
| Equipment only | Machine reservation |
| Person + Place | Stylist + chair |
| Person + Equipment | Technician + diagnostic tool |
| Place + Equipment | Room + machine without named staff |
| Person + Place + Equipment | GVM path below |
| Multiple resources | Multi-bay / multi-room jobs |

---

## Industry examples

| Industry | Person | Place | Equipment |
|----------|--------|-------|-----------|
| **GVM Baby World** | Sonographer | Ultrasound room | Ultrasound machine |
| Optometry | Optometrist / optician | Exam room | Diagnostic equipment |
| Pharmacy | Pharmacist | Private consultation room | — |
| CarStar | Technician | Service bay | Diagnostic equipment |
| Construction | Crew | Job site | Vehicle + equipment |
| Salon | Stylist | Chair | — |
| Fitness | Instructor | Room / studio | Capacity |
| Coworking | Optional | Desk or meeting room | — |

Travel between locations (e.g. one sonographer across GVM Brampton and Burlington) must eventually consider travel gaps — document as a scheduling-engine expansion, not a Reception fake.

---

## Chapter 3 honesty

- Calendar **Resources** view shows a truthful empty state — resource scheduling is **not** active.  
- CTA: **View business locations** (existing route), not a fake Add Resource workflow.  
- Optional / unassigned **employee** booking remains gated (`CHASUM_OPTIONAL_STAFF_ENABLED` / migration **034**).

---

## Adaptive Booking Workspace (Chapter 4)

The Booking Workspace asks only for missing decisions and must remain compatible with future:

- employee only  
- resource only  
- employee + resource  
- multiple required resources  

Do **not** hard-code “employee is always the only bookable capacity” into the adaptive decision model in a way that blocks Chapter 9. Current create flow still requires a named employee until optional-staff / routing ships.

---

## Implementation ownership

| Work | Chapter |
|------|---------|
| Location CRUD depth, hours, timezone, taxes, notifications, plan limits | **9** |
| Resource CRUD, types, availability, blocking, maintenance | **9** |
| Service → resource requirements, multi-resource conflicts | **9** + scheduling-engine expansion |
| Full visual polish across Locations/Resources | After functional chapters |

**Do not** add temporary Location/Resource architecture in earlier chapters that will be discarded.
