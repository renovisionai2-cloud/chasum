# World Class — Commerce Money Engine

**Chapter:** 6 — Sales, Payments, Invoices & Receipts  
**Phase:** **6.2A — Professional Invoice & Receipt Workspace Foundation** (6.1 PO-accepted; 6.2A **not** PO-accepted; 6.0B PO-accepted)  
**Feature 6.2A:** `6a25f96` · closeout `3e7e3d3`  
**Feature 6.1E:** `f7c7fa1`  
**Feature 6.1D:** `28b7bf6`  
**Feature 6.0:** `9e7d72a` · stamp `160b10e`  
**Feature 6.0A:** `efaea51`  
**Feature 6.0B:** `309bc67` / civil-anchor `ee38142`  
**Feature 6.0B refund email:** `20177bb`  
**Feature 6.0B lifecycle emails:** `fd8560f`  
**Branch:** `cursor/world-class-portal-foundation`  
**Production baseline:** `4eecbec` — untouched  
**Database:** Preview ↔ Production share Supabase — **no migrations in Phase 6.0 / 6.1 / 6.2A**  
**Canonical helpers:** `lib/commerce/money-contract.ts` + `lib/commerce/refundability.ts`  
**Booking-time resolver (preserved):** `lib/commerce/booking-financials.ts` (`resolveBookingFinancials` / `computeBookingPricing`)

---

## Phase 6.0B lock — Mutation-wide calendar sync + payment-record refunds

| Concept | Rule |
|---------|------|
| Calendar `?date=` | Selected **civil anchor** only — never Month grid padding `range.start` |
| Mutation convergence | CREATE / UPDATE / RESCHEDULE / CANCEL share one overlay + refresh path |
| Refund UX | Payment-record driven — internal transaction ID is **not** required user input |
| Gross payments collected | Unchanged historical cash-in semantics |
| Cancel + refund | Cancel does **not** auto-refund; historical payment may still be manually refunded |
| Record Payment appointment picker | **Shipped in Phase 6.1** — customer → appointment, no UUID input |
| Appointment-native refund entry | **Shipped in Phase 6.1** — same RefundTransactionSheet |
| Reception today vs planning date | Documented for final polish — not redesigned in 6.0B |
| Refund confirmation email | After succeeded refund only — never reverses financial truth. **PO confirmed customer received.** |
| Cancellation confirmation email | Inline after successful cancel — not a refund notice. **PO confirmed customer received.** |
| Email failure | Refund remains successful; status logged |
| Template | `commerce.refund` — distinct from payment receipt; resend UI deferred to 6.2/6.3 |
| PO acceptance | Chapter 6 Phase 6.0B — Cross-View Calendar Synchronization + Transaction-Linked Refund Flow — PO accepted after hands-on Preview testing. |

---

## Phase 6.0A lock — Historical cash ≠ current collectible

| Concept | Rule |
|---------|------|
| Arithmetic remaining / deposit due | Pure amount math from stamps |
| Collectible remaining / deposit due | Amount math **and** lifecycle allow collection |
| `cancelled` | Collectible appointment balance = 0; collectible deposit due = 0 |
| Historical payments / receipts / refunds | Remain auditable; cancel does not erase |
| Open invoices | Remain open until explicitly resolved (**PO decision later**) |
| `no_show` | Collectibility unchanged until explicit PO fee policy |
| Normal Cancel | Soft `status = cancelled` — not hard delete / not test-data purge |

Helpers: `isAppointmentCollectible`, `collectibleRemainingBalanceCents`, `collectibleDepositDueNowCents`, `appointmentCollectibleMoneyFromStamps`.

Calendar: optimistic cancel + cancelled-ID override so Day/Week/Month/Agenda/Timeline agree without stale pre-cancel rows.

## Phase 6.2A lock — Invoice & Receipt Workspace

Display-only professional documents over existing `commerce_invoices` / `commerce_receipts`. Not an accounting rewrite.

| Concept | Rule |
|---------|------|
| Invoice Workspace | `/dashboard/payments/invoices/{INV-…}` — commerce invoices only |
| Receipt Workspace | `/dashboard/payments/receipts/{RCT-…}` — one payment, not the full invoice |
| SaaS `billing_invoices` | Must not appear |
| Manual invoice create / edit amounts / void / delete | **Not in 6.2A** |
| Auto-email invoice on booking | **Forbidden** |
| Intentional invoice email | Staff action from Invoice Workspace; failure must not mutate money columns |
| Receipt resend | Existing `sendPaymentReceiptNow` on the existing receipt row |
| Collect from invoice | Only when appointment collectible remaining > 0; routes to existing Payments collect |
| Print | Browser print / Save as PDF; hide portal chrome; no PDF library; normal one-service invoice fits one US Letter page |
| Numbering | Unchanged; non-atomic invoice sequence and RCT `count(*)+1` remain deferred |
| Refund math | `applyInvoicePayment` unchanged; display stored paid / refunded / balance / status |
| Currency | Show **stored** document currency. Mismatch documents prefix ISO (e.g. `USD $248.60`). Do not relabel USD as CAD. New invoice inserts stamp `businesses.currency`. Do **not** rewrite INV-0033. |
| Civil dates | `issue_date` / `due_date` are date-only. Display via `formatCommerceCivilDate` (YYYY-MM-DD parts). Never `new Date("YYYY-MM-DD")`. New issue dates use business-timezone civil day. |
| Line items | Service line shows tax-exclusive amount when tax is itemized. Subtotal + tax − discount = total. Historical line rows are not rewritten. |

### Currency forensics (read-only)

| Item | Finding |
|------|---------|
| Business currency | `businesses.currency` = `cad` |
| INV-0033 stored | `usd` (historical insert omitted currency; DB default) |
| RCT-0001 | `usd` $50.00 |
| RCT-0002 | `cad` $198.60 |
| Contradiction | **YES** |
| Historical rewrite | **Forbidden** without PO |

Invoice **Balance** is `commerce_invoices.balance_cents`. Appointment collectible remaining is separate.

### Phase 6.2A closeout — document integrity

| Surface | Date source after |
|---------|-------------------|
| Customer Billing issued | `formatCommerceCivilDate(issue_date)` |
| Invoice Workspace / print | same helper |
| Invoice email Issued | `model.issueDateLabel` from the same helper |

Root cause: Billing used `format(new Date(issueDate))` which treats `YYYY-MM-DD` as UTC midnight and shifts the civil day in America/Toronto. Workspace used a noon local parse (UTC on Vercel), so INV-0033 showed Aug 14 in Billing and Aug 15 on the document. Stored `date` was not rewritten.

Line presentation: display exclusive service amount (`$220.00`) when tax is itemized; stored `commerce_invoice_lines.total_cents` for INV-0033 may remain tax-inclusive.

Phase 6.2A PO acceptance = **NOT YET**. Phase 6.2B / 6.3 / 6.4 not started.

## Phase 6.1A lock — Integrity + staff-facing labels

Users operate money through **Customer → Appointment → Payment**. Internal IDs are not normal user input **or** normal user-facing output (`booking:bs-…`, UUIDs).

| Surface | Metric | Source | Notes |
|---------|--------|--------|--------|
| Payments / Reports Executive / Command Centre | Gross payments collected | `commerce_transactions` succeeded payment+deposit, business TZ | Refunds not subtracted |
| Payments | Outstanding appointment balances | Collectible remaining on non-cancelled appointments | Counts **appointments** |
| Payments | Outstanding deposits | Collectible deposit due now | Not remaining balance |
| Payments / Reports Executive | Outstanding invoices | `commerce_invoices` only | Not `appt:` synthetics |
| Reports → Revenue | Recognized appointment value | Completed or collected stamps, tax-exclusive `price_cents` | YTD on that tab; **not** cash collected |
| Reports → Employees / Locations / Services | Same recognized value as Revenue tab | **This business calendar month** · `appointmentPriceCents` / 100 on recognized rows | Not `amount_paid_cents` / deposit cash |

Phase 6.1 is **PO-accepted**.

## Phase 6.1C lock — Collect chrome + cents + Booked

| Concept | Rule |
|---------|------|
| Appointment-native Collect | Only when `collectibleRemainingBalanceCents` > 0 |
| Fully paid | Show **Paid in full** (or hide Collect); do not open a zero-balance workspace |
| Payments hub Collect | Remains a global front-desk action; selected appointment with $0 remaining cannot be collected |
| Customer report money | Presentation uses `formatMoneyCents` / `formatMoneyDollars` — preserve cents |
| Staff status | Stored `confirmed` displays as **Booked**; `pending` remains a distinct awaiting-confirmation state |

## Phase 6.1D lock — Integrity closeout (presentation + gating)

| Concept | Rule |
|---------|------|
| Customer Billing Record payment | Generic unallocated `commerce_transactions` (no `appointment_id` / `invoice_id`) is **not** a 6.1 product path. Server rejects it. Panel shows paid/current empty state when collectible appointment, invoice, and deposit-due-now are all 0. No store credit / wallet / unapplied cash invented. Gift-card redeem on that form is deferred. |
| Past Booked / open visit | Non-cancelled, non-completed visit whose **end** is in the past → Customer Workspace **Needs attention**. Never silently Completed. Do not auto-complete or auto no-show. |
| Last visit | **Completed** appointments only (profile insights, directory, Chase last-visit). Past Booked is not a last visit. |
| Own-slot edit | Unchanged start + staff + location + duration skips Availability Engine / min-notice. Changing date/time still validates. Exclude-self overlap remains. |
| Staff notification UI | No log + recipient → **skipped** (not Not applicable) with Send if email is configured. **Not applicable** must not show Resend. Do not auto-enable a new policy. |
| Reports Customers metric | Label **Avg collected per customer** = mean of per-customer payment totals. Workspace **Avg transaction** remains mean of succeeded commerce txs. |
| Paid in full | Non-interactive status badge on appointment editor when collectible remaining is 0. |

## Phase 6.1E lock — Rescheduled analytics

| Concept | Rule |
|---------|------|
| **Before** | Reports counted any non-cancelled month appointment whose `updated_at` was >60s after `created_at` and `start_time !== created_at`. Payments, notes, and unchanged saves all bump `updated_at`. |
| **After** | Count distinct month-window appointments that have an `appointment_change_log` row whose **start_time or end_time actually moved** (`reschedule`, `resize`, or `update`). |
| Edit / unchanged save / payment | Not rescheduled |
| Employee/location only | Not rescheduled unless start or end also moved |
| Date/time change | Rescheduled |
| Duration (end) change | Rescheduled (slot length moved) |
| Ana forensic | Create `2026-08-15T00:30:00Z`; current start unchanged; logs are `create` + deposit `update`; `updated_at` later from payment/edits. **Not a reschedule.** Historical logs not rewritten. |

---

## Phase 6.1B lock — Reports interpretation (not a new ledger)

| Concept | Rule |
|---------|------|
| Gross / recognized / tax-inclusive / outstanding | Remain distinct; do not force them to match |
| Analytics bucketing | Business timezone civil date/hour — do not rewrite stored `start_time` |
| Employee Completed | `status === completed` only |
| Customer “returning” | Executive = prior customers booked this month; Customers tab = 2+ completed visits |
| Avg collected per customer / top customers | Mean of each paying customer's summed `customer_payment_events` (paid/recorded); else completed appointment catalog value. **Not** average transaction size (workspace Avg transaction). |
| Reports freshness | RSC + `revalidatePath`; no poll; open tab stays until next navigation |

---

## Phase 6.1 lock — Front-desk operating surface

Users operate money through human business context: **Customer → Appointment → Payment**. Internal IDs are not normal user input. All money surfaces share one money engine (`commerce_transactions` + money-contract). Collect Payment, appointment-native refund, and Payments history refund use the same workflows.

---

## Chapter 6 purpose

Make customer money in Chasum trustworthy, connected, auditable, clear, and fast across:

Booking → Deposit / due now → Payment → Invoice → Receipt → Refund → Outstanding balance → Follow-up → Reporting

**Lock:** one customer-money ledger. `commerce_transactions` is the canonical cash-movement ledger. Do not create another ledger. Do not mix customer commerce with Chasum SaaS subscription billing (`billing_invoices` / `MockBillingProvider` / settings billing are **not** part of this contract).

---

## Money journey

```
Resolver (booking time)
  → appointment stamps (price_cents, tax_cents, deposit_cents, amount_paid_cents, …)
  → commerce_transactions (cash in / cash out)
  → commerce_invoices (customer documents over that truth)
  → commerce_receipts (transaction-bound evidence)
  → commerce_refunds (refund authority + matching ledger rows)
  → derived remaining / deposit due / payment status
```

---

## Canonical ledger

| Store | Role |
|-------|------|
| `commerce_transactions` | **Authoritative cash movement.** Succeeded `payment` + `deposit` = gross payments collected. |
| `commerce_refunds` + refund ledger rows | Refund truth. Refunds are never gross collection. |
| Appointment money columns | Operational stamps, **not** a second ledger. |
| `commerce_invoices` | Customer documents over money truth, **not** the payment ledger. |
| `commerce_receipts` | Transaction-bound evidence of payment. |
| `lib/commerce/recognize.ts` | Recognized-revenue **projection**. Not cash-in. Do not label as Gross payments collected. |

Gross collection kinds: `payment`, `deposit` with `status = succeeded`.

---

## Resolver role

`resolveBookingFinancials` / `computeBookingPricing` remain authoritative **at booking time**.

Phase 6.0 does **not** rewrite:

- exclusive / inclusive tax logic
- `tax_rates` behavior
- service tax override behavior
- deposit requirement configuration

Phase 6.0 fixes **consumers** that interpret stamped values incorrectly.

---

## Appointment stamp role

Accepted booking convention:

| Column | Meaning |
|--------|---------|
| `price_cents` | **Exclusive subtotal.** Never silently treat as total. |
| `tax_cents` | Tax |
| Appointment total | `price_cents + tax_cents` |
| `deposit_cents` | Configured / required deposit amount |
| `amount_paid_cents` | Gross paid stamp |
| `amount_refunded_cents` | Refunded stamp |
| `payment_status` | Operational status vocabulary (unchanged in 6.0) |

---

## Exact money definitions

Centralized in `lib/commerce/money-contract.ts`. Do not duplicate formulas.

| Term | Definition |
|------|------------|
| `subtotalCents` | Exclusive subtotal (`price_cents`, catalog fallback only if stamp missing) |
| `taxCents` | `tax_cents` |
| `totalCents` | `subtotalCents + taxCents` |
| `grossPaidCents` | `amount_paid_cents` |
| `refundedCents` | `amount_refunded_cents` |
| `netPaidCents` | `max(0, grossPaid − refunded)` |
| `remainingBalanceCents` | `max(0, total − net paid)` |
| `depositRequiredCents` | Configured required deposit (`deposit_cents` / service deposit rules) |
| `depositCollectedCents` | Amount of net paid applied toward the required deposit |
| `depositDueNowCents` | `max(0, required − collected toward deposit)` |
| `invoice total` (new rows) | Appointment total (`subtotal + tax`) |
| `invoice balance` (new rows) | Remaining appointment balance at create time |
| Gross payments collected | Sum of succeeded `payment` + `deposit` ledger rows |

**Deposit required ≠ deposit collected ≠ deposit due now ≠ remaining balance.**

A $200 remaining balance after a $50 required deposit is **not** an outstanding deposit of $200.

---

## Invoice role

A commerce invoice is an actual `commerce_invoices` record.

- An unpaid appointment is **not** automatically an invoice.
- Do not call synthetic appointment balances “invoices.”
- Do not silently generate invoices to make metrics line up.
- **New invoices (6.0):** subtotal / tax / total agree with the appointment contract.
- **Existing rows:** display persisted invoice truth. No bulk historical rewrite. No shared Supabase data repair.

Historical inconsistency: invoices created before 6.0 may have stored `total_cents = price_cents` (exclusive subtotal only). Application behavior is corrected going forward; historical rows are not mutated.

---

## Receipt role

Phase 0 path preserved:

`recordCommercePayment` → `createReceiptForTransaction` → receipt email → resend/retry

Phase 6.0 does not redesign receipt numbering. Race-prone RCT-count numbering remains documented for Phase 6.2. No PDFs. No public receipt URL.

---

## Refund role

- Refund approval workflow unchanged.
- Refund UI not redesigned.
- Appointment payment-status math after refund uses **appointment total (subtotal + tax)**, not `price_cents` alone.
- Remaining balance after refund follows `total − net paid`. Dashboard outstanding-balance metrics exclude `refunded` / `voided` payment statuses; customer remaining still uses the formula. Owner decision pending on void/delete vs compensating refund.

---

## Status vocabulary

Database values are unchanged. Friendly UI is one-to-one and truthful.

### Appointment `payment_status`

| DB | UI |
|----|----|
| `unpaid` | Unpaid |
| `deposit_required` | Deposit required |
| `deposit_paid` | Deposit paid |
| `partially_paid` | Outstanding balance |
| `fully_paid` | Paid in full |
| `refunded` | Refunded |
| `voided` | Voided |

### Invoice `status`

`draft` Draft · `open` Open · `partial` Partially paid · `paid` Paid · `void` Void · `refunded` Refunded · `overdue` Overdue

### Transaction `status`

`pending` Pending · `requires_action` Needs action · `succeeded` Succeeded · `failed` Didn't go through · `canceled` Canceled · `refunded` Refunded · `partially_refunded` Partially refunded

Receipt email: `not_sent` / `queued` / `sent` / `failed`  
Refund approval: `pending` / `approved` / `rejected`

Do not invent new DB statuses in Phase 6.0.

---

## Collected ≠ revenue

If the source is succeeded payment/deposit ledger rows, the truthful term is **Gross payments collected**, not Revenue, unless a recognized-revenue accounting model is in use.

`recognize.ts` remains a separate recognized-revenue projection. Internal field names `revenueTodayCents` / `revenueWeekCents` / `revenueMonthCents` are retained for compatibility (technical debt) but user-visible / CSV labels on corrected surfaces say Gross payments collected.

Chase Reception KPI “Today's revenue” still reads `recognize.ts` when Reception computes it — that is **not** ledger cash-in and must not be mixed with Payments / Command Centre collected figures.

---

## Deposit distinctions (metrics)

| Metric | Meaning |
|--------|---------|
| Outstanding deposits | Unpaid **required deposit** amounts (`depositDueNowCents`) only |
| Outstanding appointment balances | Remaining customer appointment totals (`remainingBalanceCents`) |
| Outstanding invoices | Actual `commerce_invoices` with remaining balance |

Do not merge these concepts. No fake “revenue opportunity.”

---

## Security

Preserve:

- RLS
- session-based commerce mutations
- service-role Stripe webhook **after** signature verification
- public booking authorization boundaries
- owner / business isolation

Do not broaden payment access / RBAC in 6.0. Staff payment permissions remain a future explicit decision.

Existing Stripe **server** code remains. Phase 6.0 does **not** implement Stripe Elements, Checkout, public online payment, new PaymentIntent UI, failed-PI workflow, or new webhook types.

Manual tenders preserved: cash, debit, credit/offline, e-transfer, gift_card, store_credit, other. Never store PAN/card numbers.

---

## Database constraints (Phase 6.0)

| Constraint | Status |
|------------|--------|
| New migrations | **None** |
| Schema / RPC changes | **None** |
| Shared Supabase data repair | **None** |
| Apply 034 / 035 / 036 | **Forbidden** |
| Production | **Untouched** |

Existing customer-money commerce migrations **028 / 030 / 031** are already applied.

---

## Phase 6 sequence

| Phase | Name | Status |
|-------|------|--------|
| **6.0** | Money Contract & Source-of-Truth Foundation | Implemented (`9e7d72a`) |
| **6.0A** | Appointment Lifecycle + Collectibility Integrity | Implemented (`efaea51`) |
| **6.0B** | Cross-View Calendar Sync + Transaction-Linked Refund + Email | **PO-accepted** after hands-on Preview testing |
| **6.1** | Front-Desk Payments Operating Surface | **PO-accepted** |
| **6.2A** | Invoice & Receipt Workspace Foundation | **Implemented — not PO-accepted** |
| 6.2B+ | Remaining invoice/receipt lifecycle | **Not started** |
| 6.3 | Refunds, Outstanding Balances & Follow-up Truth | **Not started** |
| 6.4 | Online Payment Completion | **Not started** — requires explicit future PO authorization |

Do **not** automatically start 6.2B. Do **not** start Chapter 7. Do **not** reopen Phase 6.0B.

---

## Packages + gift cards

Do not productize package purchases in 6.0. Do not turn gift certificates into a larger sales subsystem.

Preserved: package booking price behavior, gift-card issue/redeem, gift-card tender, store credit.

Partial productization remains documented — not a 6.0 product expansion.

---

## Known gaps

| Gap | Classification |
|-----|----------------|
| `create_public_appointment` named-staff path does not stamp `price_cents` / `tax_cents` / `deposit_cents` | **Dedicated future public-money remediation.** RPC is SECURITY DEFINER — **not modified in 6.0.** Unassigned public booking via BookingFacade **does** stamp financials. Do not claim the named-staff gap fixed. |
| Historical invoices that stored exclusive subtotal as total | Display persisted rows; no bulk repair |
| Receipt numbering race (RCT-count) | **Deferred** — not fixed in 6.2A |
| Invoice sequence non-atomic | **Deferred** — not fixed in 6.2A |
| No unique `appointment_id` / `transaction_id` on invoices/receipts | **Deferred** — no migration |
| Post-refund + later payment invoice math (`applyInvoicePayment`) | **Deferred** — 6.2A displays stored columns |
| Historical USD on CAD business (INV-0033) | **Documented** — no historical rewrite |
| `recognize.ts` `appointmentPriceCents` omits tax | Technical debt; keep separate from cash contract |
| Internal `revenueTodayCents` field names | Compatibility debt; UI/CSV labels corrected |
| Open invoice resolution on appointment cancel | **Owner decision pending** (leave open / prompt void / fee / refund) — 6.0A leaves invoices unchanged |
| No-show collectibility / fee policy | **Owner decision pending** — 6.0A preserves current collectible behavior |
| Record Payment appointment picker | **Shipped in 6.1** |
| Appointment-native Refund action | **Shipped in 6.1** — same RefundTransactionSheet |
| Reception today vs planning date clarity | **Final polish** — Operating Centre = today; Week/Month may plan ahead |
| Normal Cancel is not a test-data purge | Documented — no automated cleanup on shared Supabase |
| Stripe Elements / public online pay | Phase 6.4, PO-gated |
| Staff payment RBAC | Future explicit decision |
| SaaS `billing_invoices` | Out of this contract |

---

## Owner decisions — still pending

Do not silently resolve:

- Stripe Elements timing
- Public booking online pay scope
- Manual tender set (preserve current set until PO says otherwise)
- Refund permissions
- Invoice edit / void / delete policy
- Payment void/delete vs compensating refund
- Receipt numbering
- Sales vs Payments terminology
- Package / gift-card product scope
- Customer-facing invoice / receipt portal
- Payment / deposit reminders
- Synthetic appointment invoice removal policy (application no longer synthesizes; historical UI guard remains)
- Net collected metric (gross collected is locked; net is not a 6.0 product metric)

---

## PO decisions locked in 6.0

- One customer-money ledger: `commerce_transactions`
- `price_cents` = exclusive subtotal
- Appointment total = subtotal + tax
- Remaining balance includes tax
- Outstanding deposits = deposit due now only
- Outstanding invoices = real commerce invoices only
- Collected ≠ recognized revenue
- No Stripe Elements in 6.0
- No migrations in 6.0
- No Payments / Command Centre / Reports redesign (truth labels only)
- Phase 6.1 not auto-started
- Public named-staff RPC not modified

---

## Tests

- `tests/unit/commerce/money-contract.test.ts`
- `tests/unit/commerce/phase-6-0-locks.test.ts`
- Existing GVM / booking-financials / deposit / tax / receipt / refund / Booking Workspace / Chapter 5 payment-status suites remain the regression gate.
