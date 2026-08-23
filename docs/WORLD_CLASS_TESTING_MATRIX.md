# World Class Testing Matrix

**Chapter:** 0–6 (scaffold through Chapter 6 Phase 6.0B)  
**Branch:** `cursor/world-class-portal-foundation`  
**Production baseline:** `4eecbec`  
**Rule:** Do not mark complete on appearance alone; verify data and workflow.  
**Chapter 2:** Command Centre page depth — approved tip `0f1f423`.  
**Chapter 3:** Reception / Calendar — see route block below.  
**Chapter 4:** Booking Workspace — PO-accepted (`4da237c`).  
**Chapter 5:** Phase 5.2 Day View + shared canvas — **PO-accepted** (`e88f22d`). Phase 5.3 Week/Month planning — **PO-accepted** (`caef495` / tip `284d726`).  
**Chapter 6:** Phase 6.0B **PO-accepted**. **Phase 6.1 = PO ACCEPTED.** **Phase 6.2A = PO ACCEPTED.** **Phase 6.2B = PO ACCEPTED.** Phase 6.3 **discovery complete / implementation NOT STARTED.** Tenant safety foundation: [`WORLD_CLASS_TENANT_SAFETY_FOUNDATION.md`](./WORLD_CLASS_TENANT_SAFETY_FOUNDATION.md) — HQ later created in Staging. **LIVE:** Preview → Staging; Production → Production ([`WORLD_CLASS_PREVIEW_STAGING_CUTOVER.md`](./WORLD_CLASS_PREVIEW_STAGING_CUTOVER.md)).

---

## Environment

| Item | Value |
|------|--------|
| Production | https://chasum.vercel.app @ `4eecbec` |
| World Class Preview | https://chasum-q4yk6yain-renovisionappcom.vercel.app @ `20e0c89` (Chapter 2) |
| Branch | `cursor/world-class-portal-foundation` |
| Shared DB | **SUPERSEDED.** LIVE: Preview → Staging `wnfahklzaxirftyskctd`; Production → Production `kxcydvhswkuzepwzzinq` |
| Migrations 034–036 | Do not apply |
| Commercial 037 | APPLIED + VERIFIED on Production and Staging |
| Commercial 038 | APPLIED + VERIFIED on Staging and Production — CROSS-ENVIRONMENT EXECUTION GATE CLOSED |
| GVM Production smoke after 038 | Passed (dashboard, Business Settings, public booking, services, staff, date, times). Known non-038 limitation: “Any available staff” still requires a specific employee |

---

## Page test template (copy per route)

| Field | Value |
|-------|--------|
| Route | |
| Purpose | |
| Roles | Owner / staff (future) |
| Plans | Free / Pro / Business / Enterprise / Private Alpha |
| Data deps | |
| Desktop | Pass / Fail / N/A |
| Mobile 375 / 430 | |
| Tablet | |
| Keyboard | |
| A11y | |
| Loading / Empty / Error / Permission | |
| Timezone | |
| Multi-location | |
| Regression risk | |
| Result | |
| Evidence | |
| Notes | |
| Approval | |

---

## Feature test template

| Field | Value |
|-------|--------|
| Feature | |
| Entry | |
| Preconditions | |
| Steps | |
| Expected / Actual | |
| Backend record | |
| Email/SMS | |
| Payment provider | |
| Cross-page | |
| Mobile | |
| Failure / permission / plan / industry | |
| Pass/Fail | |
| Bug / retest | |

---

## Mandatory regression scenarios (protect every chapter)

| # | Scenario | Owner chapter | Baseline |
|---|----------|---------------|----------|
| 1 | New customer | 4 | Open |
| 2 | Edit customer | 4 | Open |
| 3 | New booking (assigned employee) | 3,5 | Phase 0 OK |
| 4 | Package / service booking | 3,5 | Open |
| 5 | Taxes exclusive | 5,6 | Phase 0 OK |
| 6 | Deposits / due now / remaining | 5,6 | Phase 0 OK |
| 7 | Full / partial payment | 6 | Open |
| 8 | Invoice / receipt / refund | 6 | Open |
| 9 | Customer confirmation email | 7 | Phase 0 OK |
| 10 | Business new-booking email | 7 | Phase 0 OK |
| 11 | Resend (no duplicate tx) | 7 | Phase 0 OK |
| 12 | Calendar visibility | 3 | Open |
| 13 | Update / cancel / reschedule | 3,5 | Open |
| 14 | Business / Canadian timezone | 3,7 | Phase 0 OK |
| 15 | Multi-location booking | 3,9 | Open |
| 16 | Employee assignment | 3,8 | Open |
| 17 | Unassigned employee behavior | 3,8 | **Not prod-ready** — do not claim |
| 18 | Plan staff / location limits | 8,9,13 | Gaps documented |
| 19 | Add Location + upgrade prompt | 9 | Open |
| 20 | Mobile booking / customer / payment | 3,4,6 | Open |

---

## Chapter 0 baseline (inherited)

| Check | Result |
|-------|--------|
| Typecheck | Pass |
| Lint | 54 problems (34 errors, 20 warnings) |
| Unit tests | 266 passed, 1 failed (`multi-business-selection`) |
| Build | Pass |

## Chapter 1 automated results

| Check | Result |
|-------|--------|
| Typecheck | **Pass** |
| Lint (Ch 1 files) | **Clean** |
| Lint (full) | **52 problems (32 errors, 20 warnings)** — resolved 2 shell setState-in-effect errors; no new issues |
| Unit tests | **270 passed, 1 failed** (+4 foundation tests); inherited fail unchanged |
| Build | **Pass** |

## Chapter 2 — Command Centre

| Field | Value |
|-------|--------|
| Route | `/dashboard` |
| Purpose | Owner daily operating view: today / attention / next action |
| Roles | Owner (dashboard auth) |
| Data deps | appointments, customers, notification_logs, commerce snapshot, setup progress |
| Desktop / laptop | Hierarchy: header → priority → KPIs → attention + quick actions → schedule → Summer + week bars → activity |
| Mobile 375 / 430 | Same stack; touch-min CTAs; no decorative sparklines |
| Keyboard | Links/buttons focusable; section headings |
| A11y | Semantic sections; metric Unavailable on load fail; no color-only status |
| Loading / Empty / Error | Suspense skeleton; empty schedule/activity/attention; Unavailable vs verified zero |
| Timezone | Business TZ for greeting, date label, day bounds, schedule clocks |
| Multi-location | Scope label; appointments filtered; payments labeled business-wide |
| Regression risk | Shell nav / Reception / Payments routes unchanged |
| Result | Automated tests added; Preview pending stamp |
| Notes | Money labeled “Payments collected”; no fabricated % comparisons |
| Approval | Approved (`0f1f423`) |

### Chapter 2 correction pass

| Check | Result |
|-------|--------|
| Appointments today SoT | `lib/dashboard/appointments-today.ts` — exclude cancelled/no_show; business TZ |
| Gross payments SoT | Commerce ledger; refunds not subtracted; CC / Payments / Reports executive aligned |
| Summer identity | Portal greeting AI Business Manager; no AI receptionist in Summer workspace/orchestrator |
| AI Workforce | Future Vision banner; fake online/tasks/activity removed |
| Reports Inventory | Tab hidden |
| Membership revenue | Hidden (Beta incomplete) |
| Developer | Nav + page gated (`planAllowsApiIntegrations` + platform owner) |
| Automated tests | `chapter2-correction*.test.ts` |
| Approval | Approved |

## Chapter 3 — Reception and Calendar

| Field | Value |
|-------|--------|
| Route | `/dashboard/calendar` (nav: Reception) |
| Purpose | Daily operating queue + schedule board; same appointment SoT as Command Centre |
| Roles | Auth business membership (fine-grained roles deferred Ch8) |
| Data deps | appointments, staff, locations, notification_logs (failed), waitlists, payment_status |
| Desktop | Morning brief + day control center + filters |
| Mobile 375 / 430 | Day agenda list; filter sheet; touch CTAs |
| Keyboard | Toolbar, filters, appointment cards, drawer Escape |
| A11y | Status labels + payment text (not color-only); aria-labels on agenda rows |
| Loading / Empty / Error | `loading.tsx`; filter empty + agenda empty; `error.tsx` |
| Timezone | Business TZ day bounds for day views; clocks via business helpers |
| Multi-location | LocationScope shared by brief + board |
| Filters | Employee + status; location via header switcher |
| Unassigned | Display + filter; create gated (`CHASUM_OPTIONAL_STAFF_ENABLED`) |
| Regression risk | Booking engine / payments / notifications unchanged |
| Automated tests | `tests/unit/dashboard/reception-calendar-ops.test.ts` |
| Approval | Awaiting PO |

### Chapter 3 correction pass

| Check | Result |
|-------|--------|
| Week/month TZ | `getCalendarViewRange` business-TZ bounds |
| Unassigned create UI | Disabled “Assign later — coming soon” when flag off |
| Employee filter order | All → A–Z → Unassigned |
| Chase placeholders | Null / Unavailable — not verified zero |
| Resources empty | Truthful + View business locations |
| Architecture doc | `WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md` |
| Automated tests | `view-range.test.ts` + expanded `reception-calendar-ops.test.ts` |
| Approval | Awaiting PO |

## Chapter 4 — Customer Workspace

| Field | Value |
|-------|--------|
| Routes | `/dashboard/clients`, `/dashboard/clients/[id]` (nav: Customers) |
| Purpose | Customer Workspace — who / booked / owed / purchased / conversations / next action |
| Roles | Auth business membership (fine-grained roles deferred Ch8) |
| Data deps | customers, appointments (visits + outstanding), commerce account, notes, documents, communications |
| Desktop | Directory list + full profile tabs (overview → Summer) |
| Mobile 375 / 430 | Stacked directory rows; profile hero + payment metrics wrap; tab scroll |
| Keyboard | Search, filter selects, directory links, profile tabs, notes/docs forms |
| A11y | Directory `aria-label` includes balance due; payment summary `aria-label`; notes search labeled |
| Loading / Empty / Error | `clients/loading.tsx`, `clients/[id]/loading.tsx`; EmptyState for appointments/notes/docs/timeline |
| Money truth | Payment summary = collected/outstanding (commerce); Insights = booking value (not revenue) |
| Packages | Honest empty — ownership not linked on profile |
| Regression risk | Booking engine / payment engine / Production / migrations unchanged |
| Automated tests | `tests/unit/crm/customer-workspace.test.ts` |
| Blueprint | `WORLD_CLASS_CUSTOMER_WORKSPACE_BLUEPRINT.md` |
| Approval | Covered by Chapter 4 PO acceptance (`4da237c`) |

### Existing Appointment expandable management workspace

| Field | Value |
|-------|--------|
| Trigger | PO Preview video — narrow appointment panel |
| Expand | Desktop Expand/Collapse; ~60–70vw capped ~1180px |
| Layout | Multi-column when expanded; quick-view when collapsed |
| New Appointment | Protected / unchanged |
| Tests | `appointment-management-expand.test.ts` |
| Approval | Covered by Chapter 4 PO acceptance (`4da237c`) |

### Chapter 4 Booking micro-interaction correction

| Field | Value |
|-------|--------|
| Trigger | PO Preview video — amount editing + View Appointment |
| Money input | `MoneyAmountInput` — draft while focused; normalize on blur; temporary empty OK |
| Projection | Existing `resolveBookingFinancials` only |
| View Appointment | Opens created ID via `onViewCreatedAppointment` → `openEdit` / fetch |
| Book Another / Done | Remain distinct |
| Tests | `booking-money-and-view-appointment.test.ts`, `money-amount-input.test.tsx` |
| Locked principles | Money fields must not fight cursor; View opens exact appointment; never search for a known entity |
| Approval | Covered by Chapter 4 PO acceptance (`4da237c`) |

### Chapter 4 Date & Time slot density correction

| Field | Value |
|-------|--------|
| Trigger | PO Preview video — ~139 five-minute start times |
| Root cause | Engine steps by `appointment_interval_minutes` (location → business → 30); UI dumped all openings |
| Config | Existing booking increment — no hard-coded 30 in presentation |
| Presentation | Interval filter + Next available + More times per period |
| Footer | Continue on Date & Time; Confirm only on Review |
| Unified Date & Time | Preserved |
| Tests | `slot-density-presentation.test.ts` |
| Locked principle | Useful start times, not raw availability granularity |
| Approval | Covered by Chapter 4 PO acceptance (`4da237c`) |

### Chapter 4 Booking progress navigation & Book another

| Field | Value |
|-------|--------|
| Trigger | PO Preview — dead progress clicks; Book another no-op |
| Progress | Real buttons; completed/prefilled revisitable via `bookingDecisionAccess` |
| Disabled stages | Visually muted + `disabled` + title reason |
| Book another | Suppress success re-hydration; fresh draft in same workspace |
| Success actions | View / Book another / Done remain distinct |
| Tests | `booking-progress-navigation.test.ts` |
| Locked principles | Revisitable decisions; no silent dead clicks; Book another = fresh in-workspace |
| Approval | Covered by Chapter 4 PO acceptance (`4da237c`) |

### Chapter 4 Booking Workspace — PO acceptance lock

| Item | Detail |
|------|--------|
| Status | **Chapter 4 Booking Workspace architecture and core interaction flow PO-accepted on Preview after hands-on testing** |
| Accepted tip | `4da237c` |
| Accepted flow | Customer → Service → Employee → Date & Time → Payment → Review → Confirmation |
| Adaptive | Skip only intentionally + validly resolved decisions (provenance) |
| Architecture reopen | Not for remaining visual polish items |
| Polish backlog | Motion, typography, spacing, hierarchy, action styling, appointment-management visual refinement, micro-interactions remain in Polish & Intelligence backlog |
| Chapter 5 | Implementation not started |

### Chapter 4 Booking state integrity / decision provenance

| Item | Detail |
|------|--------|
| Trigger | PO video — CC New Appointment → select customer → jumped to Date & time |
| Root cause | Reception prefs hydrated service/staff; workflow equated truthy IDs with resolved |
| Fix | Provenance + intentional resolution flags; stop prefs hydrate for service/staff |
| Forward | `firstMissingDecision` = first required unresolved |
| Change affordance | `Button` variant `subtle` on booking summary / customer Change |
| Tests | `booking-decision-provenance.test.ts` + updated workflow tests |
| Approval | **PO-accepted** on Preview after hands-on testing (`4da237c`) |

### Chapter 4 Final Booking Interaction & Front-Desk Speed Pass

| Field | Value |
|-------|--------|
| Trigger | Latest PO video — speed, continuity, selection clarity |
| Focus | Active decision dominates; compact customer; labeled summary chips |
| Selection | Primary ring chrome; 120ms beat then auto-advance |
| Date/time | Unified; date above times; `onAfterSelect` focuses times; no time Continue |
| Payment | 2×2 modes; primary selected chrome; MoneyAmountInput preserved |
| Footer | Status + contextual Continue/Confirm; money line on payment/review; Close on success |
| Tests | `booking-front-desk-speed.test.ts` |
| Approval | Covered by Chapter 4 PO acceptance (`4da237c`) |

### Chapter 4 Adaptive Booking Workspace

| Field | Value |
|-------|--------|
| Architecture | Ask only what’s missing; one decision; summary strip |
| Decisions | Customer → Service → Employee → Date&time → Payment → Review → Success |
| Date/time | Unified panel (calendar + grid) |
| Payment | Checkout card; footer `payment_*` fields |
| Success | Confirmed outcomes only |
| Contract | `WORLD_CLASS_BOOKING_WORKSPACE.md` (+ benchmarks) |
| Automated tests | `booking-workspace-ux.test.ts` |
| Approval | Covered by Chapter 4 PO acceptance (`4da237c`) |

### Chapter 4 Final Acceptance — Progressive Booking Workspace

| Field | Value |
|-------|--------|
| Surface | New Appointment (`BookingSheet` create path) |
| Architecture | True progressive stages — only active expanded |
| Flow | Customer → Appointment → Time → Payment → Confirm |
| Auto-advance | Customer select → Appointment; appointment ready → Time; slot → Payment; Continue → Confirm |
| Time UI | `workspaceMode` + `alwaysExpanded` grid |
| Payment | One decision card; footer owns `payment_*` fields |
| Confirm | `BookingConfirmStep` review + sticky Confirm CTA |
| Acceptance | Passed only after true progressive workflow acceptance |
| Contract | `WORLD_CLASS_BOOKING_WORKSPACE.md` |
| Automated tests | `tests/unit/booking/booking-workspace-ux.test.ts` |
| Approval | Covered by Chapter 4 PO acceptance (`4da237c`) |

### Chapter 4 Final Correction — Booking Workspace

| Field | Value |
|-------|--------|
| Surface | New Appointment / Edit Appointment (`BookingSheet`) |
| Purpose | Premium receptionist booking with minimal scroll |
| Flow lock | Customer → Appointment → Time → Payment → Confirm |
| Layout controls | Narrow/Standard/Wide **hidden** (`showWidthControls={false}`) |
| Date → time | Availability immediately after Appointment section |
| Payment | One `BookingPaymentSection`; projected “Balance after confirmation” |
| History / Summer | Collapsed disclosures |
| Sticky footer | Status + Cancel + Confirm / Confirm & record $X |
| Mobile | Full-height sheet; sticky header/footer; min 44px targets |
| Regression risk | Booking/payment/tax/deposit/notification engines unchanged |
| Contract | `WORLD_CLASS_BOOKING_WORKSPACE.md` |
| Automated tests | `tests/unit/booking/booking-workspace-ux.test.ts` |
| Approval | Covered by Chapter 4 PO acceptance (`4da237c`) |

### Chapter 4 correction & premium polish

| Check | Result |
|-------|--------|
| Directory columns | Tight operational list + chevron |
| Avg spend | Unavailable (no commerce rollup on directory) |
| CRM status vs segments | Status dropdown Lead/Active/Inactive/Archived; VIP/New/Recent/Balance due segments |
| Overview | Read-first + Edit profile sheet |
| Billing | Sectioned balance / collect / invoices / receipts / history |
| Insights | Completed service list value + X of Y rates |
| Summer | Observed facts vs Recommendations |
| Data dictionary | `WORLD_CLASS_CUSTOMER_WORKSPACE_DATA_DICTIONARY.md` |
| Automated tests | Expanded `tests/unit/crm/customer-workspace.test.ts` |
| Approval | Covered by Chapter 4 PO acceptance (`4da237c`) |

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.0B)

| Field | Value |
|-------|--------|
| Phase | **6.0B — Cross-View Calendar Synchronization + Transaction-Linked Refund Flow** |
| Feature | `309bc67` |
| Calendar | Civil-anchor `?date=`; mutation-wide overlay for CREATE/UPDATE/RESCHEDULE/CANCEL |
| Refund UX | Transaction-history Refund → contextual sheet; no raw Transaction ID required |
| Tests | `phase-6-0b-sync` + `phase-6-0b-refund-ux` + `phase-6-0b-refund-email` |
| Refund email | `commerce.refund` after succeeded refund only |
| Cancellation email | Inline `appointment.cancellation` after successful cancel |
| Customer emails (PO hands-on) | Cancellation confirmation received; refund confirmation received |
| Phase 6.1 | **Not started** |
| Status | **Chapter 6 Phase 6.0B — Cross-View Calendar Synchronization + Transaction-Linked Refund Flow — PO accepted after hands-on Preview testing.** |

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.2B)

| Field | Value |
|-------|--------|
| Phase | **6.2B — Commerce document integrity + forensic closeout + operational refund notification** |
| Invoice numbers | Sequence CAS + unique `(business_id, invoice_number)` retry |
| Receipt numbers | Max existing + 1 (not `count(*)+1`) + unique retry |
| Identity | Earliest invoice per appointment; earliest receipt per payment; no historical deletes |
| Currency | New rows default to `businesses.currency`; historical USD unchanged |
| Reports | Booked / employee / service / location use full business calendar month including future starts |
| Gross cash | Original payment/deposit rows remain cash-in after partial refund; date = transaction timestamp |
| Refunds | Voluntary refund does not recreate collectible debt (`total − gross paid`). Operating remaining/outstanding uses collectible remaining, not `total − net paid`. |
| Business refund email | `commerce.refund.business`; first send available when never recorded; result copy is “sent.” vs “resent.” from prior delivery truth; Sent only from delivery truth; no automatic duplicate |
| Historical booking emails | Missing `notification_logs` on an applicable channel = **Not recorded** (not Not applicable / not Skipped). True Not applicable only when the event does not exist. Explicit first send; no auto-send on render |
| Staff email | New appointment subject/body; Deposit method; no customer greeting |
| Customer email | Subtotal (not Catalog subtotal); stacked label/value on narrow screens |
| Package catalog | Counts active `service_packages`; services named Package are services; no entitlement |
| Tests | `tests/unit/commerce/phase-6-2b-integrity.test.ts` + `phase-6-2b-closeout.test.ts` + `phase-6-2b-po-closeout.test.ts` + `phase-6-2b-po-final-correction.test.ts` + `tests/unit/notifications/phase-6-2b-historical-comms-truth.test.ts` |
| Stripe Elements | **Not implemented** |
| Migrations | **None** (proposed unique indexes + allocate RPC documented only) |
| Status | **PO ACCEPTED** after hands-on Preview (Chase $337.87 / $50 refund collectible $0; Sum historical Not recorded → Sent). Phase 6.3 discovery = [`WORLD_CLASS_PHASE_6_3_DISCOVERY.md`](./WORLD_CLASS_PHASE_6_3_DISCOVERY.md). Phase 6.3 implementation = NOT STARTED. |

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.2A)

| Field | Value |
|-------|--------|
| Phase | **6.2A — Professional Invoice & Receipt Workspace Foundation** |
| Invoice | Commerce invoices only; INV-0033 cents preserved; stored currency displayed |
| Receipt | One payment (RCT-0001 $50, RCT-0002 $198.60); not the full invoice |
| Email | Intentional invoice send; failure does not mutate money; receipt resend existing row |
| Print | Browser print; one-service invoice fits one US Letter page; `print:hidden` portal chrome |
| Collect | Hidden at $0 collectible remaining; cancelled not collectible |
| Tests | `tests/unit/commerce/phase-6-2a-documents.test.ts` + `phase-6-2a-closeout.test.ts` + `tests/unit/booking/phase-6-booking-ux-closeout.test.ts` |
| Stripe Elements | **Not implemented** |
| Migrations | **None** |
| Status | **PO ACCEPTED** after hands-on Preview E2E (RCT-0006). Phase 6.2B = **PO ACCEPTED**. Phase 6.3 discovery complete / implementation NOT STARTED. |

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.1)

| Field | Value |
|-------|--------|
| Phase | **6.1 — Front-Desk Payments Operating Surface** |
| Collect Payment | Customer search → appointment list → amount (full / deposit / custom) |
| IDs | Appointment ID / Customer ID / Transaction ID not user input |
| Appointment-native | Collect Payment + Refund share Payments workflows |
| Tests | `tests/unit/commerce/phase-6-1-front-desk.test.ts` + `phase-6-1a-integrity.test.ts` |
| Stripe Elements | **Not implemented** |
| Phase 6.2 | **6.2A = PO ACCEPTED. 6.2B = PO ACCEPTED.** |
| Status | **PO-accepted** (Phase 6.1). Corrected in Phase 6.1A.

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.1A)

| Field | Value |
|-------|--------|
| Phase | **6.1A — Financial Integrity + Front-Desk UX Correction** |
| IDs | Internal booking refs / UUIDs stripped from staff-facing money UI |
| Gross collected | Payments = Reports Executive = commerce ledger, business TZ, cents |
| Revenue report | Recognized appointment value (YTD on Revenue tab); not cash collected |
| Financial | Payments collected include deposits as a subset |
| Customers | “Customers with balances due” (customers) vs outstanding appointments |
| Tests | `tests/unit/commerce/phase-6-1a-integrity.test.ts` |
| Stripe Elements | **Not implemented** |
| Phase 6.2 | **6.2A = PO ACCEPTED. 6.2B = PO ACCEPTED.** |
| Status | Implemented — awaiting PO hands-on review. Phase 6.1 **not** PO-accepted. |

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.1B)

| Field | Value |
|-------|--------|
| Phase | **6.1B — Reporting Integrity + Propagation** |
| Timezone | Appointment analytics + report month windows use business civil date |
| Employee / location revenue | Same recognized appointment value as Revenue tab (`appointmentPriceCents`) |
| Completed | `status === completed` only |
| Propagation | Calendar / booking-engine mutations revalidate `/dashboard/reports`; no polling |
| Customer labels | Prior customers booked this month vs repeat completed visits vs recorded payments |
| Tests | `tests/unit/commerce/phase-6-1b-reporting-integrity.test.ts` |
| Stripe Elements | **Not implemented** |
| Phase 6.2 | **6.2A = PO ACCEPTED. 6.2B = PO ACCEPTED.** |
| Status | Implemented — awaiting PO hands-on review. Phase 6.1 **not** PO-accepted. |

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.1E)

| Field | Value |
|-------|--------|
| Phase | **6.1E — Reschedule Analytics Integrity** |
| Rescheduled | Real start/end move in `appointment_change_log` |
| Not counted | Unchanged save, notes, payments, `updated_at` heuristic |
| Tests | `tests/unit/commerce/phase-6-1e-reschedule-analytics.test.ts` |
| Stripe Elements | **Not implemented** |
| Phase 6.2 | **6.2A = PO ACCEPTED. 6.2B = PO ACCEPTED.** |
| Status | Implemented — awaiting PO hands-on Preview verification. Phase 6.1 **not** PO-accepted. |

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.1D)

| Field | Value |
|-------|--------|
| Phase | **6.1D — Final Integrity Closeout** |
| Billing | Hide generic Record payment; reject unallocated collections |
| Past Booked | Needs attention (not Completed) |
| Last visit | Completed only |
| Own-slot | Hold existing schedule; reschedule still validates |
| Staff comms | No log + recipient = Not recorded; explicit first send; no Resend on not_applicable |
| Reports | Avg collected per customer (mean of customer totals) |
| Tests | `tests/unit/commerce/phase-6-1d-closeout.test.ts` |
| Stripe Elements | **Not implemented** |
| Phase 6.2 | **6.2A = PO ACCEPTED. 6.2B = PO ACCEPTED.** |
| Status | Implemented — awaiting PO hands-on Preview verification. Phase 6.1 **not** PO-accepted. |

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.1C)

| Field | Value |
|-------|--------|
| Phase | **6.1C — Final Closeout** |
| Collect | Hidden when collectible remaining = 0; partial still collects |
| Copy | Collect Payment subtitle is staff-facing |
| Customer reports | Exact cents via `formatMoneyDollars` / `formatMoneyCents` |
| Status | Stored `confirmed` → staff **Booked** |
| Tests | `tests/unit/commerce/phase-6-1c-closeout.test.ts` |
| Stripe Elements | **Not implemented** |
| Phase 6.2 | **6.2A = PO ACCEPTED. 6.2B = PO ACCEPTED.** |
| Status | Implemented — awaiting PO hands-on Preview verification. Phase 6.1 **not** PO-accepted. |

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.0A)

| Field | Value |
|-------|--------|
| Phase | **6.0A — Appointment Lifecycle + Collectibility Integrity** |
| Collectibility | `isAppointmentCollectible` / `collectibleRemainingBalanceCents` / `collectibleDepositDueNowCents` |
| Cancelled | Not collectible for appointment balance or deposit due |
| Calendar | Optimistic cancel + override; Day/Week/Month/Agenda/Timeline agree |
| Invoices on cancel | Unchanged (PO policy later) |
| Auto-refund | **No** |
| Hard delete | **No** |
| Tests | `tests/unit/calendar/phase-6-0a-lifecycle.test.ts` + money-contract collectibility |
| Feature | `efaea51` |
| Phase 6.1 | **Not started** |
| Approval | Awaiting PO hands-on review |

## Chapter 6 — Sales, Payments, Invoices & Receipts (Phase 6.0)

| Field | Value |
|-------|--------|
| Phase | **6.0 — Money Contract & Source-of-Truth Foundation** |
| Contract | `docs/WORLD_CLASS_COMMERCE_MONEY_ENGINE.md` |
| Ledger | `commerce_transactions` (succeeded payment + deposit = gross payments collected) |
| `price_cents` | Exclusive subtotal; total = subtotal + tax |
| Remaining | `max(0, total − net paid)` including tax |
| Deposits | Required ≠ collected ≠ due now ≠ remaining |
| Invoices | Real `commerce_invoices` only; new totals use appointment contract |
| Stripe Elements | **Not implemented** |
| Public named-staff RPC | Gap documented; **not modified** |
| Migrations | **None** (034–036 unapplied) |
| Tests | `tests/unit/commerce/money-contract.test.ts`, `tests/unit/commerce/phase-6-0-locks.test.ts` + commerce / GVM / Ch4 / Ch5 regression |
| Phase 6.1 | **Not started** |
| Feature | `9e7d72a` |
| Approval | Awaiting PO review |

## Chapter 5 — Calendar & Booking Engine (Phase 5.3)

| Field | Value |
|-------|--------|
| Phase | **5.3 — Week/Month Planning Intelligence + Safe Engine Convergence** |
| Title | Chapter 5 Phase 5.3 — Week/Month Planning Intelligence + Safe Engine Convergence |
| Week | Planning columns; business-TZ days; overflow; date-only New Appointment |
| Month | Density + truthful counts; business-TZ grid; date → Day View |
| Geometry | `lib/calendar/planning-geometry.ts` |
| Bypasses | `lib/booking-engine/bypass-registry.ts` |
| Deferred | Enriched RPC payloads · resource productization · optional staff |
| Tests | `planning-geometry.test.ts`, `bypass-convergence.test.ts` |
| Feature | `caef495` |
| Accepted Preview tip | `284d726` |
| Approval | **Chapter 5 Phase 5.3 — Week/Month Planning Intelligence + Safe Engine Convergence — PO accepted after hands-on Preview review.** |

## Chapter 5 — Calendar & Booking Engine (Phase 5.2 PO acceptance)

| Field | Value |
|-------|--------|
| Status | **Chapter 5 Phase 5.2 — Calendar Day View and shared Reception calendar operating surface — PO accepted after hands-on Preview review.** |
| Accepted Preview tip | `e88f22d` |
| Density commits | `3a433e1` / `024e1c4` |
| Shared canvas | `a556a90` |
| Architecture reopen | **No** — remaining polish stays in Polish & Intelligence backlog |
| Phase 5.3 | **Not started** |
| Product code in this lock | **None** (docs stamp only) |

## Chapter 5 — Calendar & Booking Engine (Phase 5.2 shared canvas)

| Field | Value |
|-------|--------|
| Phase | **5.2 — Final shared calendar canvas correction** |
| Rule | Primary Reception views share one full operating canvas |
| Constraint removed | Shared `lg:items-start` shrink-to-fit + Week/Month missing `w-full` |
| Shared class | `CALENDAR_CANVAS_CLASS` — `w-full max-w-none min-w-0` |
| Week | Seven `flex-1 min-w-0` columns; `min-w-[780px]` scroll floor |
| Month | `grid w-full grid-cols-7` |
| Day | `dayLaneFlexStyle` unchanged (240px min; no 20rem cap) |
| Tests | `tests/unit/calendar/day-surface.test.ts` shared-canvas block |
| Approval | **PO-accepted** after hands-on Preview review (`e88f22d`) |

## Chapter 5 — Calendar & Booking Engine (Phase 5.2 density)

| Field | Value |
|-------|--------|
| Phase | **5.2 — Final density & width correction** |
| Constraint removed | Day lane `max-w-[20rem]` |
| Sizing | `dayLaneFlexStyle` — fill remaining width; min 240px |
| Tests | `tests/unit/calendar/day-surface.test.ts` density block |
| Approval | **PO-accepted** after hands-on Preview review (`e88f22d`) |

## Chapter 5 — Calendar & Booking Engine (Phase 5.2 operating surface)

| Field | Value |
|-------|--------|
| Phase | **5.2 — Day View Operating Surface Correction** |
| Idle Day View | No persistent Reception rail (`shouldMountReceptionRail`) |
| Toolbar | Primary Day/Week/Month; secondary + contextual under More |
| Unassigned | Hidden when empty; visible when appointments or filter |
| Tests | `tests/unit/calendar/day-surface.test.ts` |
| Approval | **PO-accepted** after hands-on Preview review (`e88f22d`) |

## Chapter 5 — Calendar & Booking Engine (Phase 5.2)

| Field | Value |
|-------|--------|
| Phase | **5.2 — World-Class Calendar Day View** |
| Geometry | `lib/calendar/day-geometry.ts` — business TZ position / now / wall slots |
| Status UI | `lib/calendar/appointment-status-ui.ts` — real statuses only |
| Desktop | `DayControlCenter` — lanes alpha → Unassigned last; overlays; Now/Next |
| Mobile | `DayAgendaList` — employee switcher; agenda; empty CTA |
| Entry | Empty slot → Chapter 4 Booking Workspace; click → management workspace |
| Mutations | Drag/resize via BookingFacade; `explainConflicts` on reject |
| DB changes | **None** |
| Resources | Still FUTURE — not activated |
| Tests | `tests/unit/calendar/day-geometry.test.ts` + prior calendar/booking-engine suites |
| Approval | **PO-accepted** after hands-on Preview review (`e88f22d`) |

## Chapter 5 — Calendar & Booking Engine (Phase 5.1)

| Field | Value |
|-------|--------|
| Phase | **5.1 — Availability Truth & Scheduling Rules Foundation** |
| Principle | EMPTY TIME ≠ AVAILABLE TIME |
| Policy | `SchedulingPolicy` via `BookingFacade.resolvePolicy` |
| Interval vs duration | Distinguished; RPC generates starts |
| Matrix | `WORLD_CLASS_CALENDAR_BOOKING_ENGINE.md` |
| DB changes | **None** — gap report only |
| Chapter 4 | Unchanged |
| Tests | `scheduling-policy.test.ts`, booking-engine suite |
| Approval | Tip `3c843e5` — Phase 5.2 continues |
## Chapter 5 — Calendar & Booking Engine (Phase 5.0)

| Field | Value |
|-------|--------|
| Phase | **5.0 — Engine Contract Foundation** |
| Purpose | One BookingFacade; RPC authority; no Day View rebuild |
| Contract | `BookingFacade.previewSlots/create/update/reschedule/resize/cancel` |
| Docs | `WORLD_CLASS_CALENDAR_BOOKING_ENGINE.md` |
| Chapter 4 regression | Must remain green — no UI redesign |
| Migrations | None (034–036 unapplied) |
| Adapters | staff ACTIVE · reception PARTIAL · public PARTIAL · summer ACTIVE · api FUTURE |
| Conflicts | Structured codes + UNMAPPED; `explainConflict` grounded only |
| Automated tests | `tests/unit/booking-engine/facade-contracts.test.ts`, `availability.test.ts`, Chapter 4 booking suite |
| Approval | Covered by Phase 5.0 tip `60c71cd` — Phase 5.1 continues |

### Polish & Intelligence backlog (locked)

| Field | Value |
|-------|--------|
| Doc | `docs/WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md` |
| Scope | Visual hierarchy, spacing, icons, tables, Summer/Chase, appointment depth, business setup, payments intelligence, Command Centre evolution, reports, customer depth, mobile, motion, system states, final Polish Program |
| Implementation now | **No** — documentation lock only |
| Progressive | Each chapter acceptance criteria |
| Final gate | World Class Polish & Intelligence Program before public launch |
| Automated tests | `tests/unit/docs/world-class-polish-backlog.test.ts` |

### Permanent quality rule

No chapter may introduce additional lint errors/warnings, failing tests, typecheck failures, or build failures. Report inherited / new / resolved each chapter.

---

## Tenant safety + multi-business (2026-08-19)

Canonical: [`WORLD_CLASS_TENANT_SAFETY_FOUNDATION.md`](./WORLD_CLASS_TENANT_SAFETY_FOUNDATION.md).

| Check | Result |
|-------|--------|
| Unauthorized business id rejected | Unit: `pickActiveBusiness` / `isAuthorizedBusinessId` + `setActiveBusinessAction` source |
| Single-business user | Switcher hidden; resolver returns that tenant |
| Multi-membership selected tenant | Cookie + authorized list |
| Invalid stored selection | Fallback |
| Location reset on switch | `locationCookieAfterBusinessSwitch` + `getLocationScope` guard |
| Payments / calendar / reports / customers / settings | Loaders use `getOrCreateBusiness` |
| Notification retry preserves tenant | Uses resolver `business.id`; does not rewrite logs |
| Switch does not mutate records | Cookie + revalidate only |
| Live RLS integration | **Not tested** (shared Production DB) |
| Chasum HQ created | **NO** |
| Phase 6.3 implementation | **NOT STARTED** |

---

## Shell smoke (Chapter 1 already shipped — retest after each chapter)

| Check | Result |
|-------|--------|
| Grouped nav visible | |
| Command opens (⌘K) not fake link | |
| HQ hidden for tenant | |
| Developer in Advanced | |
| Mobile bottom nav + More | |
| Summer entry | |  
