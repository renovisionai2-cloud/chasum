# World Class Reception & Calendar — Data Dictionary

**Chapter:** 3  
**Shared with:** Command Centre (Ch2), Reports appointments today  

---

## Appointment statuses

| Status | Active daily count? | Meaning | Typical next actions |
|--------|---------------------|---------|----------------------|
| pending | Yes | Awaiting confirmation | Confirm, cancel, contact |
| confirmed | Yes | Expected visit | Check in, reschedule, cancel |
| arrived | Yes | Checked in | Start service, wait |
| waiting | Yes | Waiting for service | Start service |
| in_progress | Yes | Service underway | Complete |
| completed | Yes | Service finished | Collect balance if due |
| cancelled | No | Cancelled | Rebook opening if desired |
| no_show | No | Did not attend | Separate from scheduled |

Active = `isActiveBooking` (`lib/commerce/recognize.ts`).

Helpers: `lib/dashboard/appointment-ops.ts` (`APPOINTMENT_STATUS_MEANING`, `countDailyStatuses`).

---

## Appointments today (Reception + Calendar board)

Same definition as Command Centre / Reports:

- Business timezone day on `start_time`
- Excludes cancelled and no_show from active scheduled count
- Includes unassigned active visits
- Reception brief and calendar list both use **`getLocationScope()`** (single location or all)

Helper: `countAppointmentsToday` / `countDailyStatuses`.

### Calendar view ranges

`getCalendarViewRange` (`lib/calendar/view-range.ts`):

| View | Bounds |
|------|--------|
| Day / Timeline / Employees / Locations / Resources | `startOfBusinessDay` … `endOfBusinessDay` |
| Week / Agenda | `startOfBusinessWeek` … `endOfBusinessWeek` (Sun–Sat business TZ) |
| Month | `startOfBusinessMonth` … `endOfBusinessMonth` |

---

## Calendar board filters

| Filter | Values | Notes |
|--------|--------|-------|
| Location | Header LocationSwitcher | Cookie `chasum_location_scope` |
| Employee | All → named A–Z → **Unassigned last** | Client filter; Unassigned is view-only for existing rows |
| Status | All / Active only / each status | Active = `isActiveBooking` |
| Date | Toolbar | Business-TZ server fetch window |

Empty filter match shows reset CTA — never replaces failed queries with zero.

---

## Payment readiness (floor indicators)

Derived from `appointments.payment_status` (commerce-stamped):

| payment_status | Label |
|----------------|-------|
| fully_paid | Paid |
| deposit_paid / partially_paid | Balance due |
| unpaid / deposit_required | Payment due |
| refunded | Refunded |

Do **not** invent revenue on Reception/Calendar.

---

## Availability

Reception does **not** display a unique “available slots” total.

Openings are shown only via Availability Engine in the booking sheet.

`MorningBriefData.availableSlots` and `todayRevenue` remain **`null`**. Chase shows **Unavailable** — never coerce to verified zero.

---

## Unassigned employees

| Capability | Status |
|------------|--------|
| Display unassigned column / cards | Supported |
| Filter board to Unassigned | Supported (option last) |
| Create booking without employee | **Blocked** unless `CHASUM_OPTIONAL_STAFF_ENABLED=true` |
| Create UI when blocked | Disabled option: **Assign later — coming soon** |
| Fake “Any employee” | Not offered |

---

## Conflict detection (unchanged engine)

- Hard: `validate_appointment_slot` RPC for named staff  
- Soft: room conflicts, external calendar busy where configured  
- Travel-time between locations: **not** auto-blocked  

---

## Communication indicators

Reception drawer does not claim message history. Failed sends surface in Attention. Authoritative log: `/dashboard/notifications`.

---

## Permissions (current)

Auth + business membership only. Fine-grained roles: Chapter 8.

---

## Locations & Resources (future)

See [`WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md`](./WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md).  
Calendar Resources view: truthful empty state → `/dashboard/business?tab=locations`. Implementation: **Chapter 9**.
