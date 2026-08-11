# World Class Testing Matrix

**Chapter:** 0–5 (scaffold through Calendar & Booking Engine Phase 5.0)  
**Branch:** `cursor/world-class-portal-foundation`  
**Production baseline:** `4eecbec`  
**Rule:** Do not mark complete on appearance alone; verify data and workflow.  
**Chapter 2:** Command Centre page depth — approved tip `0f1f423`.  
**Chapter 3:** Reception / Calendar — see route block below.  
**Chapter 4:** Booking Workspace — PO-accepted (`4da237c`).  
**Chapter 5:** Phase 5.0 Engine Contract Foundation — see block below.

---

## Environment

| Item | Value |
|------|--------|
| Production | https://chasum.vercel.app @ `4eecbec` |
| World Class Preview | https://chasum-q4yk6yain-renovisionappcom.vercel.app @ `20e0c89` (Chapter 2) |
| Branch | `cursor/world-class-portal-foundation` |
| Shared DB | Yes — **read-only preferred** on Preview for audits; no test appointments in Chapter 0 |
| Migrations 034–036 | Do not apply |

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
| Approval | Awaiting PO hands-on visual review — not auto-accepted |

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

## Shell smoke (Chapter 1 already shipped — retest after each chapter)

| Check | Result |
|-------|--------|
| Grouped nav visible | |
| Command opens (⌘K) not fake link | |
| HQ hidden for tenant | |
| Developer in Advanced | |
| Mobile bottom nav + More | |
| Summer entry | |  
