# World Class Reception & Calendar Blueprint

**Chapter:** 3 — Reception and Calendar  
**Branch:** `cursor/world-class-portal-foundation`  
**Baseline tip (Ch2 approved):** `0f1f423`  
**Chapter 3 commit:** _(stamp after push)_  
**Production:** `4eecbec` (unchanged)  
**Golden rule:** Protect the core engine; improve the experience.

---

## Audit summary (pre-implementation)

| Area | Finding |
|------|---------|
| Route | Single surface `/dashboard/calendar` (nav: Reception). No separate `/reception`. |
| Editors | BookingSheet (canonical) + AppointmentDrawer + QuickAppointment — kept; not rewritten |
| Appointment query | `getAppointments` → booking-engine range; day bounds business-TZ |
| Morning Brief | Was: misleading available-slots sum, generic “Revenue”, active-location-only vs calendar scope mismatch |
| Unassigned | Display column exists; **create** still requires named employee unless `CHASUM_OPTIONAL_STAFF_ENABLED` |
| Payment on cards | Was deposit&lt;price heuristic; now `payment_status` readiness |
| Comms in drawer | Was hardcoded empty; now honest link to Communications |
| Conflict | Booking-engine RPC + soft room conflicts — unchanged |
| Waitlist | Panel + Automation; recurring remains on Automations |
| Filters | Employee + status board filters added; location via header LocationScope |

---

## Source of truth

| Concern | SoT |
|---------|-----|
| Appointments today / active | `lib/dashboard/appointments-today.ts` + `isActiveBooking` |
| Status ops helpers | `lib/dashboard/appointment-ops.ts` |
| Day view range | `startOfBusinessDay` / `endOfBusinessDay` |
| Reception + Calendar location | **Same** `getLocationScope()` cookie (single or all) |
| Calendar board filters | `filterAppointmentsForBoard` (employee + status) |
| Money on floor | `appointment.payment_status` labels only — no independent revenue |
| Availability openings | Booking sheet / Availability Engine — **no** Reception slot total KPI |
| Unassigned create | Blocked until optional-staff flag / migration 034 |

---

## Experience delivered in Chapter 3

1. Reception header: business-local date, location scope label, next appointment, New appointment / New customer  
2. Daily status counts: scheduled, checked in, in progress, completed, cancelled, no-show, unassigned, payment due  
3. Attention required: pending, unassigned, payment, failed messages, no-shows (real data only)  
4. Removed misleading Available slots KPI and generic Revenue from Reception brief  
5. Reception brief aligned to calendar LocationScope (including All locations)  
6. Calendar employee + status filters with active chips, reset, mobile sheet  
7. Day calendar cards + mobile agenda use payment readiness from commerce-stamped `payment_status`  
8. Drawer communication section honest (no fake “no messages”); financial fetch lint-safe  
9. Day query window business-timezone aligned; route `loading.tsx`  
10. Shared helpers + unit tests for status counts, filters, timezone day samples  

---

## Known limitations / deferred

| Item | Chapter |
|------|---------|
| Full consolidation of QuickAppointment / Drawer / BookingSheet | Later polish |
| Week/month range still date-fns local week edges | 3 follow-up / 5 |
| Travel-time automation between GVM locations | Future |
| Unassigned create in Production | After 034 PO approval |
| Wire drawer to live notification_logs per appointment | 7 |
| Deep permission matrix for receptionist vs tech | 8 |
| Recurring on Reception floor | Automations / later |
| Payment badges on week/month blocks | Follow-up polish |
| Role-gated cancel/refund/reschedule UI | 8 (server auth membership only today) |

---

## Regression protection

Do not rewrite: booking-engine mutations, tax, deposits, receipts, email/SMS delivery, customer CRM, timezone helpers (only consume them).
