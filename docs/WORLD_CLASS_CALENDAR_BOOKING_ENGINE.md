# World Class — Calendar & Booking Engine

**Chapter:** 5 — Calendar & Booking Engine  
**Phase:** **5.0 — Engine Contract Foundation** (first approved implementation slice)  
**Branch:** `cursor/world-class-portal-foundation`  
**Chapter 4 accepted tip:** `4da237c` (architecture + core booking flow PO-accepted)  
**Production baseline:** `4eecbec` — untouched  
**Database:** Preview ↔ Production share Supabase — **no migrations in Phase 5.0**

---

## Product thesis

Chasum’s Calendar is the operational control plane where Business, Services, Employees, Locations, Resources, Customers, Appointments, Payments, Communications, Summer, and Chase eventually meet through **ONE scheduling engine**.

Actors / surfaces:

| Actor | Surface |
|-------|---------|
| Staff / Owner | Calendar Day / Week / Month |
| Front Desk | Reception (operational MODE of Calendar — not a separate brain) |
| Customer | Public booking / portal |
| Summer | Conversational booking (via facade only) |
| Chase | Read-only operating intelligence |
| Future API | booking API |

All booking actors must ultimately use **one Booking Engine**.

---

## Non-negotiable architecture (locked)

1. **One booking pipeline** — staff, reception, public, Summer, API must not each own separate booking rules.
2. **SQL / scheduling RPCs remain authoritative** — concurrent-safe slot/conflict validation stays in Postgres. TypeScript orchestrates.
3. **UI never owns business rules** — hours, duration, buffers, prices, permissions, notice, availability, conflicts come from SoT + RPC.
4. **Source-of-truth modules remain authoritative** — Business, Services, Employees, Resources; Calendar composes them.
5. **Phase 5.0 is foundation only** — do not rebuild Day View; do not start Phase 5.1.

---

## BookingFacade

Public contract: `lib/booking-engine/facade.ts` (exported from `lib/booking-engine`).

| Method | Delegates to | Authority |
|--------|--------------|-----------|
| `previewSlots` | `previewAvailableSlots` | `get_available_slots` RPC |
| `validate` | `validateBooking` | `validate_appointment_slot` RPC (named staff) |
| `composeContext` | `composeAvailabilityContext` | SoT tables (no slot math) |
| `create` | `createBooking` | validate → insert |
| `update` | `updateBooking` | validate → update |
| `reschedule` | `rescheduleBooking` | validate → update |
| `resize` | `resizeBooking` | validate → update |
| `cancel` | `cancelBooking` | update status |
| `range` | `queryAppointmentsInRange` | reads |
| `utilization` | `queryUtilizationProjection` | truthful aggregates only |

Named function exports remain for existing call sites. Prefer `BookingFacade` for new code.

---

## BookingIntent

Canonical create/validate intent (`lib/booking-engine/types.ts`):

- `channel`: `staff` | `reception` | `public` | `summer` | `api`
- `businessId`, `locationId`, `serviceId`
- `staffId` (null/empty = unassigned — **gated**; named employee still required for current staff booking flow)
- `customerId?`, `resourceIds?`, `requestedStart`, `requestedEnd?`, notes, status, commercial fields, `excludeAppointmentId?`

Related: `RescheduleIntent`, `ResizeIntent`, `CancelIntent`, `UpdateBookingIntent`, `PreviewSlotsInput`.

---

## Channel model

| Channel | Meaning | Phase 5.0 |
|---------|---------|-----------|
| `staff` | Calendar / Booking Workspace | ACTIVE |
| `reception` | Front-desk mode of Calendar | PARTIAL (intents ready; many paths still tag `staff`) |
| `public` | Customer self-serve | PARTIAL (preview via facade; named create may still use `create_public_appointment`) |
| `summer` | AI Business Manager | ACTIVE wrappers; no new write enablement in 5.0 |
| `api` | Future HTTP API | FUTURE |

Channel will eventually control online-visible services, staff eligibility, overrides, confirmation mode. **Do not invent channel policy in Phase 5.0.**

---

## AvailabilityContext

Composed from Business → Location → Service → Employee (and future resources).

Provides timezone, interval, duration, cleanup, buffers, notice, window, caps, online flags, confirmation mode — so the engine can call RPCs with truthful inputs.

**Does not** generate slots locally.

---

## SlotCandidate

Stable UI-facing availability shape for Chapter 4 Booking Workspace, Calendar, public, Summer:

`start`, `end`, `staffId`, `locationId`, `serviceId`, `resourceIds`, `score`, `reason`, `warnings`.

UI must not parse raw RPC arrays differently per surface.

---

## ConflictReport / codes

Structured `BookingConflictReport`: `code`, `message`, `severity`, `recoverable`, optional ids/details.

**Mapped today when RPC text is clear:** STAFF_BUSY, DOUBLE_BOOKING, VACATION, LUNCH_BREAK, SERVICE_BLACKOUT, OUTSIDE_*, BUSINESS_CLOSURE, MIN_NOTICE, MAX_BOOKING_WINDOW, MAX_APPOINTMENTS, RESOURCE_BUSY (soft), NOT_AUTHORIZED, …

**Unmapped:** `UNMAPPED` / `UNKNOWN` — retain raw message; never upgrade to a guessed code.

**Architectural aliases** (documented; prefer specific codes when known): OUTSIDE_HOURS, LUNCH_BLOCK, CLOSURE, MAX_AHEAD, DAILY_CAP.

**Future — do not invent from unstructured errors:** NOT_QUALIFIED, CHANNEL_FORBIDDEN.

Human explanations: `lib/booking-engine/conflicts/explain.ts` — grounded only.

---

## Composition boundary

```
BookingIntent
  → resolve business/location/service/employee context
  → compose AvailabilityContext
  → call authoritative scheduling RPC
  → slots or structured conflict
  → mutation
  → MutationResult + domain event
```

Orchestration (TS) ≠ authoritative validation (Postgres).

---

## Current vs future scheduling capability matrix

Audit basis: `026_availability_engine.sql` + `lib/booking-engine` + Chapter 4 gates.

| Capability | Label | Notes |
|------------|-------|-------|
| Basic staff conflicts | **CURRENT** | `validate_appointment_slot` / slot overlap |
| Business / location hours | **CURRENT** | RPC |
| Employee hours | **CURRENT** | RPC |
| Service duration | **CURRENT** | Service SoT + duration override |
| Booking interval | **CURRENT** | location → business → 30 |
| Employee eligibility (service/location) | **CURRENT** | compose / staff_services |
| Lunch / break blocks | **CURRENT** | RPC |
| Cleanup / buffers | **CURRENT** | RPC + context |
| Closures | **CURRENT** | RPC |
| Service blackouts | **CURRENT** | RPC |
| Min notice | **CURRENT** | RPC + TS policy mirror |
| Max ahead / booking window | **CURRENT** | RPC + TS policy mirror |
| Daily caps | **CURRENT** | RPC |
| Online booking flags | **PARTIAL** | fields on context; channel policy not fully enforced |
| Optional / unassigned staff | **NOT WIRED** (gated) | migration 034 not applied; Ch4 named employee required |
| Resource scheduling (rooms/equipment) | **FUTURE** | `resourceIds` on contracts; no RESOURCE_BUSY from true resource engine |
| Cross-employee DnD validation UX | **FUTURE** | Phase 5.2 — facade methods ready |
| Enriched conflict codes from RPC payload | **PARTIAL** | text classification today |
| API v1 full facade convergence | **FUTURE** | intent adapter only |
| Public named-staff via facade only | **PARTIAL** | RPC create path remains |

---

## Adapter responsibilities

| Adapter | Status | Role |
|---------|--------|------|
| `adapters/staff.ts` | ACTIVE | Intent builders for calendar/workspace |
| `adapters/reception.ts` | PARTIAL | Reception channel intents |
| `adapters/public.ts` | PARTIAL | Public intents — no invented rules |
| `adapters/summer.ts` | ACTIVE | Must call BookingFacade only |
| `adapters/api.ts` | FUTURE | Intent builders |

---

## Domain events

Typed: `appointment.created` | `updated` | `cancelled` | `rescheduled` | `completed` | `no_show` | `checked_in`.

Emitted from engine mutations; communications bridge listens. Phase 5.0 does not rewire every consumer. Known bypasses (portal cancel, some API/public paths) documented for later convergence.

---

## Chapter 4 protection

Accepted flow remains locked:

Customer → Service → Employee → Date & Time → Payment → Review → Confirmation  

Provenance, required-step integrity, MoneyAmountInput, slot density, View Appointment, Book Another, expandable management — **unchanged** in Phase 5.0.

---

## Database safety

**No migrations in Phase 5.0.** Do not apply 034 / 035 / 036 or alter shared RPCs. If a DB requirement is discovered: document and stop.

---

## Phase 5.0 completed scope

- Formal `BookingFacade` contract aliases
- Intent / channel / AvailabilityContext / SlotCandidate / ConflictReport documentation
- Conflict explanation layer + UNMAPPED truthfulness
- Adapter status matrix
- Contract tests
- This architecture document

## Phase 5.1 deferred (do not start)

- Full surface migration / bypass elimination
- Day View rebuild
- Enriched RPC conflict payloads
- Resource scheduling
- Optional staff enablement
- Channel policy enforcement
- Chase utilization productization
- DnD geometry → intent UX (Phase 5.2+)

---

## Related docs

- [`WORLD_CLASS_BOOKING_WORKSPACE.md`](./WORLD_CLASS_BOOKING_WORKSPACE.md) — Chapter 4 UX contract (PO-accepted)
- [`WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md`](./WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md) — Business → Location → Resources
- [`WORLD_CLASS_RECEPTION_CALENDAR_BLUEPRINT.md`](./WORLD_CLASS_RECEPTION_CALENDAR_BLUEPRINT.md) — Reception as Calendar mode
