# World Class Reception & Calendar Blueprint

**Chapter:** 3 — Reception and Calendar  
**Branch:** `cursor/world-class-portal-foundation`  
**Chapter 3 feature:** `4b4a29e`  
**Correction tip:** _(stamp after push)_  
**Baseline tip (Ch2 approved):** `0f1f423`  
**Production:** `4eecbec` (unchanged)  
**Golden rule:** Protect the core engine; improve the experience.

---

## Correction pass (final)

| Item | Result |
|------|--------|
| Week/month timezone | **Corrected** — shared `getCalendarViewRange` uses business-TZ day/week/month bounds |
| Unassigned create | Still gated; UI shows **Assign later — coming soon** (disabled) when flag off |
| Employee filter order | All → named A–Z → Unassigned last |
| Chase placeholders | `todayRevenue` / `availableCapacitySlots` are **null / Unavailable** — never verified 0 |
| Reception vs Calendar | Day = operating centre; Week/Month = planning (toolbar hint) |
| Resources empty | Truthful empty + View business locations CTA |
| Locations/Resources arch | `docs/WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md` · Chapter 9 |

---

## Audit summary (pre-implementation)

| Area | Finding |
|------|---------|
| Route | Single surface `/dashboard/calendar` (nav: Reception). No separate `/reception`. |
| Editors | BookingSheet (canonical) + AppointmentDrawer + QuickAppointment — kept; not rewritten |
| Appointment query | `getAppointments` → booking-engine range; day/week/month business-TZ via `getCalendarViewRange` |
| Morning Brief | Status grid + attention; no fake slot/revenue KPIs |
| Unassigned | Display + filter yes; create gated unless `CHASUM_OPTIONAL_STAFF_ENABLED` |
| Payment on cards | `payment_status` readiness |
| Conflict | Booking-engine RPC — unchanged |
| Resources | Empty state only (migration 036 gated) |

---

## Source of truth

| Concern | SoT |
|---------|-----|
| View ranges | `lib/calendar/view-range.ts` → `lib/business/datetime.ts` |
| Appointments today / active | `appointments-today.ts` + `isActiveBooking` |
| Status ops helpers | `lib/dashboard/appointment-ops.ts` |
| Location | `getLocationScope()` shared by brief + board |
| Money on floor | `payment_status` labels only |
| Availability | Booking sheet Availability Engine only |
| Unassigned create | Blocked until optional-staff flag / migration 034 |

---

## Known limitations / deferred

| Item | Chapter |
|------|---------|
| Timeline/Resource day grouping still uses date-fns `isSameDay` (local) for column grouping | Follow-up / 5 |
| Travel-time automation | Future |
| Unassigned create in Production | After 034 PO approval |
| Full Locations + Resources engine | **9** |
| Deep permission matrix | 8 |
| Final Apple/Stripe visual polish | After functional chapters |

---

## Regression protection

Do not rewrite: booking-engine mutations, tax, deposits, receipts, email/SMS delivery, customer CRM, timezone helpers (only consume them).
