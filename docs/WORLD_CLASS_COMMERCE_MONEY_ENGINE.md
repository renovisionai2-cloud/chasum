# World Class — Commerce Money Engine

**Chapter:** 6 — Sales, Payments, Invoices & Receipts  
**Phase:** **6.0A — Appointment Lifecycle + Collectibility Integrity** (correction to 6.0)  
**Feature 6.0:** `9e7d72a` · stamp `160b10e`  
**Feature 6.0A:** _(this commit)_  
**Branch:** `cursor/world-class-portal-foundation`  
**Production baseline:** `4eecbec` — untouched  
**Database:** Preview ↔ Production share Supabase — **no migrations in Phase 6.0 / 6.0A**  
**Canonical helpers:** `lib/commerce/money-contract.ts`  
**Booking-time resolver (preserved):** `lib/commerce/booking-financials.ts` (`resolveBookingFinancials` / `computeBookingPricing`)

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
| **6.0A** | Appointment Lifecycle + Collectibility Integrity | **Implemented — awaiting PO hands-on review** |
| 6.1 | Front-Desk Payments Operating Surface | **Not started** |
| 6.2 | Invoice & Receipt Workspace | **Not started** |
| 6.3 | Refunds, Outstanding Balances & Follow-up Truth | **Not started** |
| 6.4 | Online Payment Completion | **Not started** — requires explicit future PO authorization |

Do **not** automatically start 6.1. Do **not** start Chapter 7.

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
| Receipt numbering race (RCT-count) | Phase 6.2 |
| `recognize.ts` `appointmentPriceCents` omits tax | Technical debt; keep separate from cash contract |
| Internal `revenueTodayCents` field names | Compatibility debt; UI/CSV labels corrected |
| Open invoice resolution on appointment cancel | **Owner decision pending** (leave open / prompt void / fee / refund) — 6.0A leaves invoices unchanged |
| No-show collectibility / fee policy | **Owner decision pending** — 6.0A preserves current collectible behavior |
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
