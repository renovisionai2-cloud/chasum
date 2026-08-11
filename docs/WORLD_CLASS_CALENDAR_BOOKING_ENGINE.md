# World Class — Calendar & Booking Engine

**Chapter:** 5 — Calendar & Booking Engine  
**Phase:** **5.3 — Week/Month Planning Intelligence + Safe Engine Convergence** (5.0 / 5.1 complete; **5.2 PO-accepted**; 5.3 implementation — PO review pending)  
**Branch:** `cursor/world-class-portal-foundation`  
**Chapter 4 accepted tip:** `4da237c`  
**Phase 5.0 tip:** `60c71cd`  
**Phase 5.1 tip:** `3c843e5`  
**Phase 5.2 accepted Preview tip:** `e88f22d` · lock `5756a45`  
**Production baseline:** `4eecbec` — untouched  
**Database:** Preview ↔ Production share Supabase — **no migrations in Phase 5.3**

---

## PO acceptance (Phase 5.2 — locked)

**Chapter 5 Phase 5.2 — Calendar Day View and shared Reception calendar operating surface — PO accepted after hands-on Preview review.**

Do **not** redesign Phase 5.2 further. Phase 5.3 is PO-narrowed (below). Do **not** apply migrations. Production remains untouched.

Accepted Preview state includes:

- world-class Day View foundation
- schedule-first operating surface
- contextual booking/appointment workspaces
- improved toolbar hierarchy
- full-width Reception calendar canvas
- responsive employee lane distribution
- Week/Month using the shared calendar canvas
- business-timezone geometry
- current-time line
- truthful blocked-time overlays
- Chapter 4 booking integration
- exact appointment-management opening
- engine-validated drag/resize
- empty Unassigned lane de-emphasis
- mobile agenda direction
- no fake resource/capacity data

Correction commits included in the accepted surface: `3a433e1` (final Day View density and width), `024e1c4` (density stamp), `a556a90` / `e88f22d` (shared canvas).

### Intentionally deferred (later phases / final polish)

These remain backlog — they are **not** reasons to reopen Phase 5.2:

- further Reception header/operational-summary compression
- typography refinement
- appointment-card final visual polish
- Agenda/Timeline refinement
- premium select/filter/menu styling
- final motion and micro-interactions
- loading/empty/error-state final polish
- `staff_locations` RPC multi-location gap
- keyboard drag/resize accessibility
- resource scheduling remains FUTURE

---

## Locked principle

**EMPTY TIME ≠ AVAILABLE TIME.**

A valid slot may depend on hours, eligibility, duration, interval, buffers, conflicts, breaks, vacations, closures, blackouts, notice, advance window, daily caps, channel restrictions, and future resources. Phase 5.1 documents what Chasum can prove **today** versus what remains future.

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
5. **Phase 5.0 = contracts; Phase 5.1 = availability truth** — do not rebuild Day View (Phase 5.2); do not invent unsupported rules.

---

## BookingFacade

Public contract: `lib/booking-engine/facade.ts` (exported from `lib/booking-engine`).

| Method | Delegates to | Authority |
|--------|--------------|-----------|
| `previewSlots` | `previewAvailableSlots` | `get_available_slots` RPC |
| `validate` | `validateBooking` | `validate_appointment_slot` RPC (named staff) |
| `composeContext` | `composeAvailabilityContext` | SoT tables (no slot math) |
| `resolvePolicy` | `resolveSchedulingPolicy` | Snapshot from AvailabilityContext — not a second validator |
| `create` | `createBooking` | validate → insert |
| `update` | `updateBooking` | validate → update |
| `reschedule` | `rescheduleBooking` | validate → update |
| `resize` | `resizeBooking` | validate → update |
| `cancel` | `cancelBooking` | update status |
| `range` | `queryAppointmentsInRange` | reads |
| `utilization` | `queryUtilizationProjection` | truthful aggregates only |

Named function exports remain for existing call sites. Prefer `BookingFacade` for new code.

---

## SchedulingPolicy (Phase 5.1)

Resolved rule snapshot: `lib/booking-engine/availability/policy.ts`.

Fields: `bookingIntervalMinutes` (start grid) · `serviceDurationMinutes` (block length) · buffers · cleanup · notice · advance days · daily cap · timezone · channel · online flags.

**Not a second validation engine.** RPC remains slot authority.

### Policy precedence (actual product)

| Knob | Precedence |
|------|------------|
| Interval | location_settings → business → 30 |
| Min notice | max(business, service, location) present values |
| Max ahead | min(business, service, location) present values (>0) |
| Daily cap | min(service, staff, location) present values (>0) |
| Buffers before/after | max(service, staff) |
| Cleanup | service only |
| Duration | staff_services.duration_override → service.duration |
| Timezone | location → business |

**Ambiguity (documented):** if `location_settings` row exists but `max_daily_bookings` is null, SQL may not fall back to business daily cap.

### Service duration vs booking interval

These are **different**:

- Duration = how long the appointment lasts once started  
- Interval = how frequently starts may begin (e.g. every 5 minutes for a 30-minute service)

GVM may legitimately use a 5-minute interval. Slot generation stays in `get_available_slots`.

---

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

**Mapped when proven:** STAFF_BUSY · OUTSIDE_HOURS · LUNCH_BLOCK · VACATION · CLOSURE · SERVICE_BLACKOUT · MIN_NOTICE · MAX_AHEAD · DAILY_CAP · NOT_QUALIFIED (staff_services / compose) · CHANNEL_FORBIDDEN (online flags) · SERVICE_INACTIVE · NOT_AUTHORIZED · RESOURCE_BUSY (soft room messages only)

**Aliases retained:** DOUBLE_BOOKING, LUNCH_BREAK, OUTSIDE_BUSINESS_HOURS, OUTSIDE_EMPLOYEE_HOURS, BUSINESS_CLOSURE, MAX_BOOKING_WINDOW, MAX_APPOINTMENTS

**Unmapped:** `UNMAPPED` / `UNKNOWN` — retain raw message; never upgrade to a guessed code.

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

## Scheduling capability matrix (Phase 5.1 definitive)

Audit basis: `026_availability_engine.sql`, `composeAvailabilityContext`, `lib/booking/interval.ts`, Chapter 4 gates.

| RULE | SOURCE OF TRUTH | ENFORCED WHERE | STATUS | CONFLICT CODE | DB CHANGE NEEDED? | NEXT PHASE |
|------|-----------------|----------------|--------|---------------|-------------------|------------|
| Business hours | `business_hours` (seed/template) | Not in RPC after multi-location | **PARTIAL** | OUTSIDE_HOURS (via location) | Optional sync→location | 5.1+ docs |
| Location hours | `location_hours` / segments | `get_available_slots` | **CURRENT** | OUTSIDE_HOURS | No | — |
| Employee working hours | `staff_working_hours` / segments | RPC | **CURRENT** | OUTSIDE_HOURS | No | — |
| Employee↔location | `staff.location_id`; `staff_locations` exists | RPC uses **primary only** | **PARTIAL** | UNMAPPED / empty slots | RPC or sync | Gap report |
| Service duration | `services.duration_minutes` + override | RPC + compose | **CURRENT** | SERVICE_INACTIVE (invalid) | No | — |
| Employee↔service eligibility | `staff_services` | RPC + compose (`NOT_QUALIFIED`) | **CURRENT** | NOT_QUALIFIED | No | — |
| Booking interval | location_settings → business → 30 | RPC step + TS resolve | **CURRENT** | — | 035 optional constraint | — |
| Appointment conflicts | appointments + GiST | RPC + DB | **CURRENT** | STAFF_BUSY | No | — |
| Buffer before | service/staff columns | RPC `greatest` | **CURRENT** | STAFF_BUSY / hours | No | — |
| Buffer after + cleanup | service/staff + cleanup | RPC | **CURRENT** | STAFF_BUSY / hours | No | — |
| Lunch / break | lunch cols + segments | RPC | **CURRENT** | LUNCH_BLOCK | No | — |
| Vacation / time off | `staff_vacations` / closures | RPC | **CURRENT** | VACATION | No | — |
| Business closures | `business_closures` + holidays | RPC | **CURRENT** | CLOSURE | No | — |
| Location closures | scoped business_closures / availability | RPC | **PARTIAL** | CLOSURE | No dedicated table | — |
| Service blackouts | `service_blackouts` | `availability_block_reason` | **CURRENT** | SERVICE_BLACKOUT | `slot_is_blocked` omits service | Gap report |
| Min notice | business / location / service | RPC + `applyPolicyChecks` | **CURRENT** | MIN_NOTICE | No | — |
| Max advance | business / location / service | RPC + policy | **CURRENT** | MAX_AHEAD | No | — |
| Daily caps | location / staff / service | RPC | **CURRENT** | DAILY_CAP | Loc null fallback ambiguity | Gap report |
| Public/online flags | service/staff/business columns | Compose (public/summer); **not SQL** | **PARTIAL** | CHANNEL_FORBIDDEN | SQL enforce later | Gap report |
| Channel restrictions | `BookingChannel` + compose | Soft TS only | **PARTIAL** | CHANNEL_FORBIDDEN | Policy table FUTURE | — |
| Resources | tables exist; 036 unapplied | Soft room only | **FUTURE** | RESOURCE_BUSY (soft msgs) | Yes for true engine | Ch9 / later |
| Optional unassigned staff | 034 prepared / gated | Not production | **NOT WIRED** | — | 034 | PO only |
| `min_break_minutes` | staff column | Settings only | **NOT WIRED** | — | RPC gap | Later |

---

## Phase 5.1 database gap report

**STOP — do not apply.** Preview shares Production Supabase.

| Required change | Why | Risk | Additive? | Surfaces | Suggested order |
|-----------------|-----|------|-----------|----------|-----------------|
| RPC honor `staff_locations` (or sync primary) | Multi-location employees (GVM) | Medium — wrong empty slots today | Additive RPC | Calendar, Booking, public | After PO |
| Pass service id into `slot_is_blocked` / deprecate | Blackouts skipped in wrapper | Low | Additive | Rare callers | After PO |
| SQL coalesce location daily cap → business | Null loc settings gap | Low | Additive | Caps | After PO |
| Enforce online/channel flags in RPC | Bypass via raw RPC | Medium | Additive | Public, Summer, API | After PO |
| Wire `businesses.online_booking_enabled` everywhere | Partial S | Low | Already partially in compose | Public | Done in TS compose |
| Resource concurrency RPCs | True RESOURCE_BUSY | High | Needs 036+ | Future | Ch9 |
| Optional staff (034) | Unassigned booking | High / gated | Migration | Reception | PO only |
| Interval allowed-values (035) | Constraint hygiene | Low | Migration | Settings | PO only |
| Enriched RPC conflict codes | Stop text classification | Medium | Additive | All | 5.1+ |

---

## Performance (Phase 5.1)

Typical staff slot preview:

1. `composeAvailabilityContext` — parallel SoT reads (memoized ~30s)  
2. One `get_available_slots` RPC  
3. Enrich/score starts in TS  

No per-interval TS generation. Multi-staff previews may call compose/RPC per staff — bounded by eligible set; avoid inventing batch RPC in 5.1 without evidence.

---

## Current vs future scheduling capability matrix

See **Scheduling capability matrix** above (Phase 5.1 definitive). Summary highlights:

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

Provenance, required-step integrity, MoneyAmountInput, slot density, View Appointment, Book Another, expandable management — **unchanged** in Phase 5.0 / 5.1. Date & Time continues to consume `BookingFacade.previewSlots`.

---

## Database safety

**No migrations in Phase 5.0 or 5.1.** Do not apply 034 / 035 / 036 or alter shared RPCs. Gaps are listed in the Phase 5.1 database gap report — document and stop.

---

## Phase 5.0 completed scope

- Formal `BookingFacade` contract aliases
- Intent / channel / AvailabilityContext / SlotCandidate / ConflictReport documentation
- Conflict explanation layer + UNMAPPED truthfulness
- Adapter status matrix
- Contract tests

## Phase 5.1 completed scope

- Availability truth principle locked
- `SchedulingPolicy` + precedence documentation
- Interval ≠ duration formalized
- Stronger truthful conflict codes (OUTSIDE_HOURS, LUNCH_BLOCK, CLOSURE, MIN_NOTICE, MAX_AHEAD, DAILY_CAP, NOT_QUALIFIED, CHANNEL_FORBIDDEN when proven)
- Capability matrix + database gap report
- Policy / conflict unit tests
- Chapter 4 UI unchanged; no Day View redesign

## Phase 5.2 — Final shared calendar canvas correction (PO-accepted)

**Primary Reception calendar views share one full operating canvas. Day, Week and Month must not use inconsistent page-width constraints.**

- Chain: sidebar → normal shell content margin → calendar workspace fills remaining width → normal right margin.
- Shared rule: `CALENDAR_CANVAS_CLASS` (`w-full max-w-none min-w-0`) on CalendarClient + Week + Month.
- Root cause of the Week/Month dead region: `lg:items-start` on the shared flex wrapper plus Week/Month missing `w-full`, so Week shrink-wrapped to `min-w-[780px]`.
- `lg:items-start` applies only when the Reception rail is actually a side-by-side row.
- Week: seven `flex-1 min-w-0` columns across the canvas; `min-w-[780px]` remains a scroll floor so columns stay readable.
- Month: `grid w-full grid-cols-7` fills the same canvas. No Month intelligence redesign.
- Day View density (`dayLaneFlexStyle`, 240px min, geometry, drag/resize, Now line) unchanged.
- Do not fill unused space with widgets. Phase 5.2 is **PO-accepted**. Phase 5.3 not started.

## Phase 5.2 — Final density & width correction (PO-accepted)

Phase 5.2 final density correction — Day View must use the available operating workspace rather than leave large unused desktop space.

- Portal shell already treats `/dashboard/calendar` as wide (`max-w-none`).
- The remaining Day-only constraint was employee lane `max-w-[20rem]`.
- Lanes now flex-fill the schedule (`dayLaneFlexStyle`); min 240px; no artificial max.
- Reception workspace no longer uses `ds-page` vertical stacking that kept the schedule visually secondary.
- Later PO video: Week/Month still used a narrower canvas — see shared canvas correction above.

## Phase 5.2 — Day View Operating Surface Correction (PO-accepted)

**Locks**

- Day View is schedule-first. Contextual booking/appointment workspaces must not permanently compress the calendar.
- Calendar views, filters/scopes, alternate representations, and contextual actions must have distinct hierarchy.
- Empty Unassigned scheduling space must not compete equally with active employee lanes while unassigned creation is gated.

Idle Day View: no Reception rail, no Morning Brief, compact header. New Appointment / empty slot → Chapter 4 Booking Workspace overlay. Appointment click → existing management workspace. Close restores full-width schedule without refetching for layout.

Toolbar: Day / Week / Month + date + employee/status scope + New Appointment. Secondary views and Undo/Duplicate/New Customer live under More.

## Phase 5.2 — Day View (PO-accepted)

### Architecture

| Surface | Role |
|---------|------|
| **Day View** | Operate the business day — schedule is the dominant surface |
| **Week / Month** | Planning (unchanged beyond shared TZ helpers / drop-zone props) |
| **Reception** | Today-focused queue / floor — separate mode; same booking truth |
| **Booking Workspace** | Sole New Appointment / management workspace (Chapter 4) |
| **BookingFacade** | Sole mutation / legality authority |

### Desktop structure

1. Compact control bar: prev / Today / next / date / view tabs / New Appointment  
2. Operating strip: civil date (business TZ), count, Now/Next when Today  
3. Time axis (hour labels; visual density ≠ booking interval)  
4. Employee lanes: alphabetical active staff → **Unassigned last** (view only; create gated)  
5. Overlays: off / vacation / before-after shift / lunch (labeled only when data proves it)  
6. Appointment cards: customer → service → time; status/payment attention when useful  

### Mobile structure

- Agenda list (≤767px) — not squeezed columns  
- Horizontal employee switcher (All + staff)  
- Now / Next emphasis  
- Empty day → New Appointment  
- Tap → existing Appointment Management drawer / workspace  

### Geometry & timezone

- `lib/calendar/day-geometry.ts` — position, now-line, wall-clock slot construction, formatters  
- Day overlays DOW/date use business TZ (`dayOfWeekInTimezone` / `calendarDateInTimezone`)  
- URL date params use business civil date when timezone provided  

### Mutations

- Empty slot → `openNew(slot, staffId)` → Chapter 4 Adaptive Booking Workspace  
- Appointment click → existing management drawer  
- Drag / resize → BookingFacade via `rescheduleAppointment` / `resizeAppointment`; optimistic rollback on error; `explainConflicts` preferred  
- Grid creates **intent**; engine decides legality  

### Known limitations (Phase 5.2)

- Week/Month browser-local geometry — **corrected in Phase 5.3**
- `staff_locations` not fully authoritative in RPC (Phase 5.1 gap) — not faked as solved  
- Resource scheduling still FUTURE empty state  
- Keyboard drag-and-drop not implemented  
- Full surface bypass elimination — **safe subset in Phase 5.3**; see bypass registry  

## Phase 5.3 — Week/Month Planning Intelligence + Safe Engine Convergence

**PO-narrowed scope.** Do not use pre–World Class “Unified Booking Sheet” numbering.

| View | Role |
|------|------|
| **Day** | Operate the business today (Phase 5.2 locked) |
| **Week** | Plan the working week |
| **Month** | Understand and navigate broader scheduling demand |

**In scope**

1. Week View redesign + planning intelligence  
2. Month View redesign + planning intelligence  
3. Week/Month business-timezone geometry  
4. Safe mutation bypass elimination through existing BookingFacade (no DB/RPC)

**Explicitly deferred (not this implementation)**

- Enriched RPC conflict payloads  
- Resource scheduling productization  
- Optional staff enablement (034 / `CHASUM_OPTIONAL_STAFF_ENABLED`)

EMPTY TIME ≠ AVAILABLE TIME. Week/Month must not infer availability, capacity %, utilization, or open slots. Counts are derived only from loaded appointments.

Bypass inventory: `lib/booking-engine/bypass-registry.ts`.  
`create_public_appointment` is **INTENTIONALLY RETAINED** (SECURITY DEFINER + anon authorization + atomic validate/insert). API POST / non-cancel PATCH remain **PARTIAL**. Portal cancel and API DELETE are **CONVERGED**.

Phase 5.3 is **not** auto-accepted. Chapter 6 not started.

---

## Related docs

- [`WORLD_CLASS_BOOKING_WORKSPACE.md`](./WORLD_CLASS_BOOKING_WORKSPACE.md) — Chapter 4 UX contract (PO-accepted)
- [`WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md`](./WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md) — Business → Location → Resources
- [`WORLD_CLASS_RECEPTION_CALENDAR_BLUEPRINT.md`](./WORLD_CLASS_RECEPTION_CALENDAR_BLUEPRINT.md) — Reception as Calendar mode
