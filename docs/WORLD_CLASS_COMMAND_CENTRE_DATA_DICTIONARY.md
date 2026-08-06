# World Class Command Centre — Data Dictionary

**Chapter:** 2 — Command Centre (+ correction pass)  
**Branch:** `cursor/world-class-portal-foundation`  
**Authoritative snapshot:** `getCommandCentreSnapshot()` in `lib/actions/command-centre.ts`  
**Pure helpers:** `lib/dashboard/command-centre.ts`  
**Appointments today SoT:** `lib/dashboard/appointments-today.ts` (`countAppointmentsToday` / `isActiveBooking`)  
**Commerce SoT:** `getCommerceDashboardSnapshot()` → `sumGrossPaymentsCollectedCents` in `lib/commerce/dashboard.ts`  
**Production baseline:** `4eecbec` (unchanged)  
**Rule:** Zero means verified zero. Load failures show Unavailable / Couldn’t load / No data yet — never invent numbers.

---

## Correction pass — source-of-truth decisions

### Appointments today (cross-page)

**Root cause of CC=4 vs Reception/Reports=5:** Command Centre excluded `no_show`; Reception Morning Brief and Reports executive included `no_show`. Secondary risk: Reception/Reports previously used server-local midnight instead of business timezone.

**Authoritative definition — APPOINTMENTS TODAY:**
- Business timezone day: `[startOfBusinessDay, endOfBusinessDay]`
- Field: `appointments.start_time` (visits starting today that end later **are** included)
- Status: `isActiveBooking` — excludes `cancelled` and `no_show`
- Includes: pending, confirmed, arrived, waiting, in_progress, completed, **unassigned**
- Location: `getLocationScope` (Command Centre / Reports); Reception Morning Brief remains single active location
- Shared helper: `lib/dashboard/appointments-today.ts`
- Wired into: Command Centre, Reports executive, Morning Brief (Reception), `getDashboardStats` today/week counts

### Gross payments collected (cross-page)

**Root cause of CC/Payments $50 vs Reports CA$150:** Reports used appointment-start **recognized revenue**; CC/Payments used commerce **cash** by `occurredAt`. Different ledgers, not a shared sum bug.

**Authoritative definition — GROSS PAYMENTS COLLECTED:**
- Option **A** chosen: refunds are **not** subtracted
- Formula: Σ succeeded `payment` + `deposit` amounts where `occurredAt` ∈ period (business TZ)
- Refunds displayed separately (Payments “Refunds (month)”)
- UI label: **Gross payments collected** (today / week / month) on Command Centre, Payments, and Reports executive
- Reports year KPI: **Unavailable** until Chapter 10 (do not mix recognition formulas)

### Attention areas

KPI **Attention areas** = count of priority **categories** in Attention required (not individual deposit/invoice row counts).

### Cancellation attention

Wording states cancellations may free openings for rebooking — does **not** claim customers need follow-up unless a real follow-up workflow exists.

---

## Deferred organization issues (not fixed in this pass)

| Issue | Chapter |
|-------|---------|
| Packages sidebar route vs Business settings tab | Catalog / Business (Ch 9 or catalog chapter) |
| Business profile vs Account & Billing overlapping fields (logo, cover, name, timezone, address, website, phone, email, booking profile) | Chapter 9 |
| Communications delivery log raw/internal event names | Chapter 7 |
| Full Reports BI redesign (charts still appointment-price based) | Chapter 10 |
| Customers detail “Back to CRM” residual copy | Chapter 4 |
| Automations waitlist/recurring deep verification | Later automation chapter |
| Developer API key create/server enforcement beyond nav+page gate | Entitlement hardening |

---

## Scope labels

| Scope | Meaning |
|-------|---------|
| All locations | Location filter off; appointment metrics aggregate all business locations; payments remain business-wide |
| Single location | Appointment queries filter `location_id`; payments still business-wide and labeled as such in UI |

Timezone for day/week/month bounds: **business.timezone** via `startOfBusinessDay` / `endOfBusinessDay` / `startOfBusinessWeek` / `startOfBusinessMonth` (`lib/business/datetime.ts`).

Currency: **business.currency** via `formatMoneyCents` (GVM → CAD when configured).

---

## Metric definitions

### Appointments today

| Field | Value |
|-------|--------|
| **Name** | Appointments today |
| **Business meaning** | Count of active visits whose start falls on the current business-local day |
| **Data source** | Shared `countAppointmentsToday` / matching Supabase filters |
| **Date range** | `start_time` ∈ [startOfBusinessDay, endOfBusinessDay] |
| **Timezone** | Business timezone |
| **Location** | Respects location scope (Reception Morning Brief: active location) |
| **Status exclusions** | Excludes `cancelled`, `no_show` (`isActiveBooking`) |
| **Payment-status treatment** | Not applied |
| **Refund treatment** | N/A |
| **Currency** | N/A |
| **Empty-state** | `0` when query succeeds with no rows |
| **Permission** | Authenticated dashboard user with business access |
| **Known limitations** | Includes completed visits that started today |
| **Related Reports** | Reports executive `appointmentsToday` uses the same definition |

### Gross payments collected today

| Field | Value |
|-------|--------|
| **Name** | Gross payments collected today |
| **Business meaning** | Cash-in from succeeded deposits and payments; **not** net of refunds; **not** visit-recognized revenue |
| **Data source** | `getCommerceDashboardSnapshot` → `revenueTodayCents` via `sumGrossPaymentsCollectedCents` |
| **Date range** | Business day on `occurredAt` |
| **Timezone** | Business timezone |
| **Location** | **Business-wide** |
| **Status exclusions** | Only `succeeded` + kind `payment` \| `deposit` |
| **Refund treatment** | **Not subtracted** (Option A). Show refunds separately |
| **Currency** | Business currency |
| **Empty-state** | `$0.00` when schema ready and sum is 0; `No data yet` / `Unavailable` on failure |
| **Related** | Payments + Reports executive cards must match |

### Payments collected this week

| Field | Value |
|-------|--------|
| **Name** | Payments collected this week |
| **Business meaning** | Same as today over business week |
| **Data source** | `revenueWeekCents` from commerce snapshot |
| **Date range** | Business week |
| **Location** | Business-wide |
| **UI in Chapter 2** | Exposed on snapshot for reconciliation; not a primary KPI card |
| **Related** | Payments / Reports commerce week total |

### Payments collected this month

| Field | Value |
|-------|--------|
| **Name** | Payments collected this month |
| **Business meaning** | Same as today over business month |
| **Data source** | `revenueMonthCents` |
| **UI in Chapter 2** | Snapshot only |
| **Related** | Payments / Reports |

### New customers this month

| Field | Value |
|-------|--------|
| **Name** | New customers this month |
| **Business meaning** | Customers created on or after business month start |
| **Data source** | `customers` count where `created_at >= startOfBusinessMonth` |
| **Location** | **Business-wide** (customers are not location-scoped) |
| **Empty / error** | `0` when empty; `Unavailable` when query errors |
| **Related Reports** | CRM / customer acquisition counts if present |

### Outstanding invoices

| Field | Value |
|-------|--------|
| **Name** | Outstanding invoices (count) |
| **Business meaning** | Open commerce invoices plus synthetic open balances from unpaid appointments without matching invoice |
| **Data source** | Commerce snapshot `outstandingInvoicesCount` |
| **Location** | Business-wide |
| **Status exclusions** | Cancelled appointments excluded from synthetic balances |
| **UI** | Attention item when count > 0 and schema ready |
| **Related** | Payments outstanding invoices |

### Outstanding deposits

| Field | Value |
|-------|--------|
| **Name** | Outstanding deposits / balances (count) |
| **Business meaning** | Appointments with remaining amount due (`price - paid > 0`) in unpaid/deposit/partial payment statuses |
| **Data source** | Commerce snapshot `outstandingDepositsCount` |
| **Location** | Business-wide |
| **UI** | Attention item |
| **Known limitations** | Count may overlap conceptually with invoice balances; both are surfaced when commerce provides them |
| **Related** | Payments deposits due |

### Upcoming appointments

| Field | Value |
|-------|--------|
| **Name** | Next appointment (Summer fact) |
| **Business meaning** | Earliest today’s schedule row with `start_time >= now` |
| **Data source** | Today’s schedule list |
| **Timezone** | Clock formatted with `formatAppointmentEmailClock` + business TZ |

### Active customers

| Field | Value |
|-------|--------|
| **Name** | Active customers |
| **Chapter 2** | **Not shown** as a KPI — prior dashboard “clients” counts were ambiguous; omit until CRM defines “active” |
| **Related** | Customers list / Reports |

### Recent bookings

| Field | Value |
|-------|--------|
| **Name** | Recent bookings (activity) |
| **Business meaning** | Latest appointments by `created_at` |
| **Data source** | `appointments` limit 6 |
| **Location** | Respects location scope |
| **UI** | Merged into Recent activity |

### Failed communications

| Field | Value |
|-------|--------|
| **Name** | Failed communications today |
| **Business meaning** | `notification_logs` with `status = failed` created today (business day) |
| **Data source** | `notification_logs` count |
| **Location** | Business-wide |
| **Error behavior** | `null` → omit from attention/Summer (do **not** treat as zero) |
| **Related** | Communications |

### Unassigned appointments

| Field | Value |
|-------|--------|
| **Name** | Unassigned appointments today |
| **Business meaning** | Today’s schedule rows with `staff_id` null |
| **Data source** | Derived from schedule |
| **Location** | Same as schedule |

### Cancelled appointments requiring follow-up

| Field | Value |
|-------|--------|
| **Name** | Cancellations today |
| **Business meaning** | Count of appointments with `status = cancelled` starting today |
| **Data source** | `appointments` count |
| **UI** | Attention item (follow-up opportunity) |
| **Limitation** | Does not prove follow-up was completed |

### Outstanding actions

| Field | Value |
|-------|--------|
| **Name** | Outstanding actions |
| **Business meaning** | Length of Attention required list |
| **Data source** | Derived from `buildAttentionItems` |

---

## Financial vocabulary (strict)

| Term | Meaning on Command Centre |
|------|---------------------------|
| Payments collected | Succeeded deposit + payment ledger amounts by `occurredAt` |
| Invoiced revenue | **Not shown** on Command Centre Ch2 |
| Outstanding balance | Appointment/invoice remaining due (attention + schedule payment readiness) |
| Outstanding invoices | Open invoice balances (commerce) |
| Outstanding deposits | Remaining due on deposit-track appointments |
| Refunded amount | Not shown as a KPI; not subtracted from “payments collected today” |
| Gross payment volume | Same as payments collected for succeeded txs in window |
| Recognized service revenue | **Not used** on Command Centre; see `lib/commerce/recognize.ts` for Reports recognition |

Do **not** label payments collected as generic “Revenue.”

---

## Summer (AI Business Manager)

Only deterministic facts/suggestions from snapshot fields. Early Access. No predictions, confidence scores, or fabricated coaching.

---

## Source-of-truth decisions

1. Money → commerce dashboard snapshot (same as Payments).  
2. Day boundaries → business timezone helpers.  
3. Appointment operational counts → direct Supabase with location scope.  
4. Prior decorative sparklines / fake % comparisons → **removed**.  
5. “You’re clear” → only when Attention list is empty (not merely no pending confirmations).
