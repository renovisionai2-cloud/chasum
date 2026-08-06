# World Class Command Centre — Data Dictionary

**Chapter:** 2 — Command Centre  
**Branch:** `cursor/world-class-portal-foundation`  
**Authoritative snapshot:** `getCommandCentreSnapshot()` in `lib/actions/command-centre.ts`  
**Pure helpers:** `lib/dashboard/command-centre.ts`  
**Commerce SoT:** `getCommerceDashboardSnapshot()` in `lib/commerce/dashboard.ts`  
**Production baseline:** `4eecbec` (unchanged)  
**Rule:** Zero means verified zero. Load failures show Unavailable / Couldn’t load / No data yet — never invent numbers.

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
| **Business meaning** | Count of visits expected to start on the current business-local day |
| **Data source** | `appointments` count, head query |
| **Date range** | `start_time` ∈ [startOfBusinessDay, endOfBusinessDay] |
| **Timezone** | Business timezone |
| **Location** | Respects location scope |
| **Status exclusions** | Excludes `cancelled`, `no_show` |
| **Payment-status treatment** | Not applied |
| **Refund treatment** | N/A |
| **Currency** | N/A |
| **Empty-state** | `0` when query succeeds with no rows |
| **Permission** | Authenticated dashboard user with business access |
| **Known limitations** | Does not exclude completed vs confirmed; all non-cancelled / non-no-show |
| **Related Reports** | Reports appointment volume uses its own period aggregation — do not assume identical filters without checking Reports |

### Appointments this week

| Field | Value |
|-------|--------|
| **Name** | Appointments this week (week bars) |
| **Business meaning** | Active appointments starting in the current business week, bucketed by business-local day |
| **Data source** | `appointments.start_time` list for week window |
| **Date range** | Week start (business) through end of 7th business day |
| **Timezone** | Business timezone for bucketing |
| **Location** | Respects location scope |
| **Status exclusions** | Excludes `cancelled`, `no_show` |
| **Empty-state** | Quiet week empty panel when all bars are 0 |
| **Known limitations** | Not a prior-period comparison; no % change |
| **Related Reports** | Prefer Reports for formal weekly volume |

### Payments collected today

| Field | Value |
|-------|--------|
| **Name** | Payments collected today (UI label — not “Revenue”) |
| **Business meaning** | Sum of **succeeded** deposit + payment transactions whose `occurredAt` falls on the business-local day |
| **Data source** | `getCommerceDashboardSnapshot` → `revenueTodayCents` via `sumSucceededPayments` |
| **Date range** | Business day |
| **Timezone** | Business timezone |
| **Location** | **Business-wide** (not location-filtered) |
| **Status exclusions** | Only `status === succeeded` and kind `payment` or `deposit` |
| **Payment-status treatment** | Ledger transaction status, not appointment `payment_status` |
| **Refund treatment** | Refunds are **not** subtracted here; month refunds tracked separately on Payments dashboard |
| **Currency** | Business currency |
| **Empty-state** | `$0.00` when schema ready and sum is 0; `No data yet` when schema not ready; `Unavailable` on load error |
| **Permission** | Dashboard auth; commerce schema must be ready |
| **Known limitations** | Named `revenueTodayCents` in commerce code historically — Command Centre UI must say **payments collected** |
| **Related Reports / Payments** | Must match Payments Command / commerce dashboard “today” collected total |

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
