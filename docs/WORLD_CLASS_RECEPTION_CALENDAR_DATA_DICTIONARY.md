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

Cancelled and no-show still appear in status breakdown and attention where applicable.

---

## Calendar board filters

| Filter | Values | Notes |
|--------|--------|-------|
| Location | Header LocationSwitcher | Cookie `chasum_location_scope`; not duplicated in board bar |
| Employee | All / Unassigned / named staff | Client filter over loaded range |
| Status | All / Active only / each status | Active = `isActiveBooking` |
| Date | Toolbar | Day uses business-TZ server range |

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

Openings are shown only via Availability Engine in the booking sheet (service + employee + date + location + timezone).

`MorningBriefData.availableSlots` remains `null` for honesty; Chase consumers coalesce to `0` and must not treat that as verified capacity.

---

## Unassigned employees

| Capability | Status |
|------------|--------|
| Display unassigned column / cards | Supported |
| Filter board to Unassigned | Supported |
| Reschedule onto Unassigned | Supported when engine allows |
| Create booking without employee | **Blocked** unless `CHASUM_OPTIONAL_STAFF_ENABLED=true` |
| Fake “Any employee” | Not offered |

---

## Conflict detection (unchanged engine)

- Hard: `validate_appointment_slot` RPC for named staff  
- Soft: room conflicts, external calendar busy where configured  
- Outside hours / availability: compose + enrich layers  
- Multi-location same employee: engine overlap rules; travel time **not** auto-blocked  

Documented gaps: travel-time between locations not auto-blocked.

---

## Communication indicators

Reception drawer does not claim message history.

Failed sends today surface in Attention (business-wide `notification_logs` for the day).

Authoritative delivery log: `/dashboard/notifications`  
Full send/retry: BookingSheet communications section.

---

## Permissions (current)

Floor actions require authenticated business membership. Fine-grained receptionist vs technician gates are **not** shipped (Chapter 8). Do not treat UI-only hiding as security.
