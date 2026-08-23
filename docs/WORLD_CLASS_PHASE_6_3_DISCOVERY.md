# World Class — Phase 6.3 Discovery (forensic audit)

**Program:** Chasum World Class Program — Chapter 6  
**Phase:** 6.3 — Outstanding balances, collection follow-up, refund/cancellation interaction, customer-money follow-up truth  
**Mode:** Discovery / forensic audit **only**  
**Implementation:** **NOT STARTED**  
**Phase 6.4:** **NOT STARTED**  
**Phase 6.2B:** **PO ACCEPTED** (`dfc67b8` acceptance stamp; money/comms contracts remain locked)  
**Branch:** `cursor/world-class-portal-foundation`  
**Production:** locked — `https://chasum.vercel.app` (`4eecbec`) — **not modified**  
**Preview:** `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app`  
**Database:** Preview ↔ Production share Supabase — **no schema / migration / RPC / data changes in this task** *(historical; **LIVE 2026-08-23:** Preview → Staging; Production → Production)*  
**Migrations 034 / 035 / 036:** remain **unapplied**  
**Product code changed by this task:** **NONE**  
**DB impact from this discovery task:** **NONE**  
**Production impact from this discovery task:** **NONE**

Canonical money SoT: [`WORLD_CLASS_COMMERCE_MONEY_ENGINE.md`](./WORLD_CLASS_COMMERCE_MONEY_ENGINE.md) · `lib/commerce/money-contract.ts`

Do **not** treat this document as Phase 6.3 acceptance or as permission to implement.

---

## Status lock

| Item | Status |
|------|--------|
| Phase 6.2B money / refund / communications contract | **Intact — do not reopen** |
| Phase 6.3 discovery | **Complete (this document)** |
| Phase 6.3 implementation | **NOT STARTED** |
| Phase 6.4 | **NOT STARTED** |
| Unique `commerce_invoices(appointment_id)` | Deferred |
| Unique `commerce_receipts(transaction_id)` | Deferred |
| Atomic invoice-number RPC | Deferred |
| Receipt-number sequencing race | Deferred (max+1 + retry; not unique) |

---

## A. Current outstanding-money architecture

Chasum already has a **canonical collectible-money contract** (Phase 6.0A / 6.2B). Outstanding *display* is a **read-model fan-out** over appointment stamps + commerce invoices. There is **no collections engine**, **no aging buckets**, and **no due-date enforcer**.

```
appointments stamps (price, tax, amount_paid, amount_refunded, deposit, status, payment_status)
        │
        ├── money-contract.ts  → collectible remaining / collectible deposit due
        │         └── Payments queues, Payments KPI, CRM account, directory metrics,
        │             drawer, booking sheet, front-desk, invoice Collect CTA
        │
        ├── payment_status column (derived at pay/refund; also used as a filter)
        │         └── Command Centre summer facts, dashboard query prefilter
        │
commerce_invoices (total, amount_paid, amount_refunded, balance_cents, status, due_date)
        │
        ├── invoiceCollectibleBalanceCents = max(0, total − amount_paid)  [gross; void → 0]
        │         └── Payments outstanding invoices, customer outstandingInvoiceCents
        │
        └── stored balance_cents / status  [may still be total − net historically]
                  └── Summer open-invoice line items, CRM openInvoiceCount (status only)
```

**Ledger vs obligation (locked):**

| Concept | Store | Role |
|---------|--------|------|
| Gross cash-in | `commerce_transactions` payment/deposit succeeded (incl. later refunded rows) | Historical cash |
| Refunds | `commerce_refunds` + kind=`refund` rows | Cash-out; **never** reopen collectible debt |
| Appointment collectible remaining | derived: `max(0, total − gross paid)` unless cancelled | Current obligation |
| Invoice collectible remaining | derived: `max(0, total − amount_paid)` unless void | Document obligation (separate) |
| Stored `balance_cents` | invoice column | **Not** Collect SoT |

---

## B. Canonical formulas currently in use (locked 6.2B)

From `lib/commerce/money-contract.ts`:

| Name | Formula | May drive Collect / outstanding labels? |
|------|---------|------------------------------------------|
| Appointment total | `price_cents + tax_cents` | Yes (denominator) |
| Gross paid | `amount_paid_cents` | Yes |
| Refunded | `amount_refunded_cents` | Display / facing label |
| Net paid | `max(0, gross − refunded)` | Lifetime / audit |
| Arithmetic remaining | `max(0, total − net paid)` | **Audit only** |
| **Collectible remaining** | cancelled → `0`; else `max(0, total − gross paid)` | **Yes** |
| Collectible deposit due now | cancelled → `0`; else deposit required − **gross** paid toward deposit | **Yes** |
| Invoice collectible | status `void` → `0`; else `max(0, total − amountPaid)` | **Yes** (invoice queues) |
| Outstanding invoice status | not in `{paid, void, refunded}` | Filter only |
| Collect CTA | collectible remaining > 0 | Yes |
| Cancelled | not collectible; collection action `"none"` | Yes |
| No-show | **still collectible** | Yes |

Refunds **do not** increment collectible remaining. `deriveAppointmentPaymentStatus` uses **gross** vs total (`lib/commerce/mappers.ts`), so a full-pay then voluntary refund stays `fully_paid` (or `partially_refunded` facing label), not a new debt.

---

## C. Competing / stale formulas still found

| Location | Current formula | Problem |
|----------|-----------------|----------|
| `invoiceAmountsFromAppointmentStamps` | `amountPaidCents = netPaid`; `balanceCents = remainingBalanceCents` (total − net) | Invoice **create** can stamp **net** paid. If an invoice is first created **after** a refund, `invoiceCollectibleBalanceCents` = total − net and **reopens debt** on the document. Subsequent `applyInvoicePayment` / refund paths stamp **gross**. |
| `commerce_invoices.balance_cents` (historical) | often total − net | Documented 6.2B; Collect must not use it. Refund path now writes collectible balance. |
| `getBookingSheetCustomerSnapshot` (`lib/actions/booking-sheet.ts`) | upcoming appts where `deposit_cents < catalog/price` and not cancelled | **Not** collectible remaining. Counts “deposit less than price,” ignores refunds, tax, gross paid, invoices. |
| Command Centre `outstandingBalanceCount` (`lib/actions/command-centre.ts`) | **today’s** rows with `payment_status ∈ {unpaid, deposit_required, deposit_paid, partially_paid}` | Not collectible remaining. Fully-paid + voluntary refund stays `fully_paid` (OK). `deposit_paid` / `partially_paid` with collectible $0 would still count. **Today-only**, not the Payments all-time queue. |
| CRM `openInvoiceCount` (`lib/crm/payment-summary.ts`) | status ∈ `{open, partial, overdue}` | Ignores `invoiceCollectibleBalanceCents`. Open invoice with $0 collectible still counts. |
| Summer `openInvoices[].balanceCents` (`getSummerCommerceSnapshot`) | stored `balance_cents` | May be arithmetic remaining on historical rows. |
| Morning brief `overdueCustomers` | **alias of** today’s payment-attention count | **Not** invoice overdue. **Misleading name.** |
| `countDailyStatuses` / Reception | skips `no_show` before payment attention | Payments queues **include** no-show unpaid. |
| Command Centre attention copy | “Remaining appointment totals after payments and refunds” | Sounds like **arithmetic remaining**. Code uses collectible remaining. |
| Reports fallback (no commerce ledger) | pending `customer_payment_events` + catalog invoices | Only if ledger missing; commerce path is SoT. |
| `recognize.ts` | completed/collected catalog value; no-show never recognizes revenue | Correct for **revenue projection**; must not be used as collectible debt. |

`remainingBalanceCents()` is **not** used as a live Collect driver in product UI (tests + invoice create only). That is a 6.2B win — keep it.

---

## D. Appointment-balance follow-up truth

**There is no due-date for appointment remaining.** Nothing compares appointment `start_time` to “now” to classify remaining as not-yet-due vs due vs overdue.

| Question | Current behavior |
|----------|------------------|
| When is an unpaid appointment “due”? | **Whenever collectible remaining > 0.** Upcoming unpaid visits appear in Payments outstanding **before** the visit. |
| Before / at / after appointment? | **Not distinguished.** Same queue. |
| Deposit vs final balance states? | **Separate queues and KPIs** (deposit due now vs remaining). Same Collect path. No follow-up state machine. |
| Cancelled | Collectible $0; excluded from outstanding appointment queues (`neq cancelled`). |
| No-show | Collectible if unpaid; **in** Payments queues; **out of** Reception daily payment-attention and morning-brief payment count. |

**Phase 6.3 still needs to define (PO):** whether unpaid **future** appointments are “outstanding” vs “not yet due”; whether deposits and finals have different reminder clocks.

---

## E. Deposit follow-up truth

| Item | Truth |
|------|--------|
| Formula | `collectibleDepositDueNowCents` — 0 if not collectible; else required − **gross** paid toward deposit |
| Surfaces | Payments KPI + deposit queue, Command Centre “outstanding deposits”, customer account `outstandingDepositDueCents`, drawer / booking sheet |
| Timing | **Due now** whenever required deposit is unsatisfied — **not** tied to appointment date or a reminder schedule |
| Template | `commerce.deposit_reminder` exists in SMS templates |
| Dispatcher | **None.** No job, action, or automation sends it |
| Arithmetic `depositDueNowCents` | Uses **net** paid; can show deposit due after refund. Collectible helper uses **gross**. Operating surfaces use collectible. |

---

## F. Invoice due / overdue truth

| Status (enum) | How it is set today |
|---------------|---------------------|
| `draft` | Typed; not a first-class staff workflow in 6.2A |
| `open` | Created when balance > 0 and amount paid = 0 |
| `partial` | Amount paid > 0 and collectible/stored balance > 0 |
| `paid` | Balance ≤ 0 at create or after payment |
| `refunded` | Refund path when refunded ≥ amount paid |
| `void` | Typed; **no void action exists** |
| `overdue` | Typed in UI maps and `InvoiceStatus`. **Never written by application logic.** No job compares `due_date` to today. |

**Due date:**

- Set at invoice create: **issue civil date in business timezone + `dueInDays` default 7** (`lib/commerce/invoices.ts`).
- Stored as PostgreSQL `date`; displayed via `formatCommerceCivilDate` (business-timezone-safe).
- **Never enforced.** No overdue transition. No due-soon / due-today helper.
- Shown on invoice document and in Summer open-invoice text if present.

**Can an invoice stay open when appointment collectible is $0?** **Yes.**

- Cancelled appointment → collectible remaining $0; invoice rows **untouched** (`cancelBooking` only sets `status = cancelled`).
- Full pay + voluntary refund → appointment collectible $0; invoice collectible also $0 if `amount_paid` is gross (post-6.2B refund writer). Historical stored `balance_cents` may still look “due.”
- Invoice outstanding filter does **not** join appointment status.

`isOutstandingInvoiceStatus` treats `draft`, `open`, `partial`, **and `overdue`** as outstanding. Because `overdue` is never set, it is dead status vocabulary.

---

## G. Refund interaction truth

Locked 6.2B, reconfirmed:

- Voluntary refunds **do not** create follow-up debt on **appointments**.
- Refund writer sets invoice `balance_cents` to `max(0, total − amount_paid)` (gross) and status `refunded` / `paid` / `partial` without reopening Collect.
- Invoice workspace Collect = `min(appointment collectible, invoice collectible)`; hidden when $0.
- Partially refunded + gross paid ≥ total → facing **Partially refunded**, Collect hidden, **not** balance due.
- Invoice email paid/balance context uses **collectible remaining**, not net-reopened remaining.

**Residual risk:** invoice **created after** a refund stamps net paid (`invoiceAmountsFromAppointmentStamps`) — competing formula (section C).

No surface should treat net retained as collectible. Net retained remains an **audit** number. Customer account `lifetimeSpendCents` / `totalPaidCents` = `max(ledger gross cash-in, sum of appointment netPaid stamps)` — **historical cash**, not obligation.

---

## H. Cancellation interaction truth

| Behavior | Today |
|----------|--------|
| Cancel mutation | `status = cancelled` only. **No auto-refund. No invoice void. No fee.** |
| Appointment collectible | $0 |
| Historical payments / receipts / refunds | Remain |
| Existing invoice | **Unchanged** — may remain `open` / `partial` with collectible balance > 0 |
| Presentation | `appointmentInvoiceLifecycle` → `cancelled_with_invoice` (`lib/commerce/document-identity.ts`) — identity/lifecycle label only, **no operator prompt** |
| Payments appointment queues | Exclude cancelled |
| Payments invoice KPI / customer outstanding invoices | **Can still include** that invoice |

**Do not invent a cancellation-fee policy.** Exact future PO decision (must not be decided in implementation):

1. Keep invoice open (current default)?
2. Auto-void invoice?
3. Prompt operator (keep / void / convert to fee)?
4. Cancellation fee (new collectible)?
5. Deposit retention vs refund?

---

## I. No-show interaction truth

| Behavior | Today |
|----------|--------|
| Collectible | **Yes** (`isAppointmentCollectible` only excludes `cancelled`) |
| Invoice | No auto-invoice; if one exists, same as any unpaid visit |
| Payments outstanding | Included (`neq cancelled` + collectible remaining > 0) |
| Reception daily payment attention | **Excluded** (`countDailyStatuses` `continue`s on no-show) |
| Morning brief payment count | **Excluded** (`isActiveBooking` excludes no-show) |
| Recognized revenue | No-show never recognizes (`recognize.ts`) |
| Fee / deposit retention | **None** |

Future no-show fee / deposit-retention needs a **separate PO decision**. Do not silently change collectibility.

---

## J. Customer account / CRM money truth

`getCustomerCommerceAccount` (`lib/commerce/customer-account.ts`) **can** show a coherent **split** view:

| Field | Meaning | Canonical? |
|-------|---------|------------|
| `outstandingAppointmentBalanceCents` | Sum collectible remaining (cancelled = 0) | Yes |
| `outstandingBalanceCents` | **Alias of appointment collectible** — **not** invoices | Alias; easy to misread |
| `outstandingInvoiceCents` | Sum invoice collectible where outstanding status | Yes (separate) |
| `outstandingDepositDueCents` | Sum collectible deposit due | Yes |
| `totalPaidCents` / `lifetimeSpendCents` | Historical cash (gross ledger vs net stamps max) | Historical ≠ obligation |
| `depositsCents` | Gross deposits collected | Historical |
| invoices / receipts / refunds / timeline | Lists | Yes |
| Net retained | Not a first-class account field | Compute from stamps/ledger only |
| Upcoming vs overdue | **Not split** | Missing |
| Communication history | CRM comms + appointment Communications; invoice delivery is **not** in that timeline | Partial |
| Collect / follow-up actions | Collect payment CTA; generic CRM follow-up; “Consider sending a payment reminder” **copy only** | Partial / placeholder |

**Do not collapse** historical cash and current collectible into one number. The panel already separates buckets (`components/commerce/customer-commerce-panel.tsx`). Remaining contradictions: alias name `outstandingBalanceCents`; CRM `openInvoiceCount` vs collectible invoices; Booking Sheet snapshot stale count; Chase “overdue” = 45–120 days since visit, not money.

---

## K. Invoice delivery truth

| Question | Finding |
|----------|---------|
| How sent | Staff `sendInvoiceEmail` → `sendEmail` template `commerce.invoice` (`lib/commerce/invoice-email.ts`) |
| Auto-send on issue / render | **Forbidden / not implemented** |
| `notification_logs` | Yes — `sendEmail` inserts logs |
| Failure mutates invoice money? | **No** |
| Invoice row `email_status` | **No such column** (receipts **do** have `email_status`) |
| UI first-send vs resend **button** | Yes — `emailStatus === "sent"` → “Resend invoice” else “Email invoice” |
| Success copy | Always **“Invoice emailed.”** — **not** first-send vs resent (unlike 6.2B refund copy) |
| Status vocabulary | `sent` / `failed` / `no_recipient` / `never_sent` / unused `queued`. **`delivered` collapsed to `sent`.** No **Not recorded**. |
| Log query | Last 8 logs where `template_key = commerce.invoice` **and `recipient = customerEmail`**. **Not** filtered by invoice number or `appointment_id`. Same customer, two invoices → **cross-talk**. “Never sent” can be **wrong** (other invoice’s send) or **weaker** than appointment Communications. |
| Staff delivery log | One line on the invoice document. No inbox/timeline of invoice sends. |
| Receipt / refund comms | Separate contracts (`commerce_receipts.email_status`; appointment Communications 6.2B). Not unified. |

**Unify in 6.3 (recommended):** bind invoice send truth to invoice identity; first-send vs resent copy; do not claim Sent without a log; keep failure off the money columns.

**Defer:** full appointment-Communications vocabulary (`not_recorded` / channel grid) on invoices; SMS invoice; payment links.

---

## L. Current payment-reminder / collection capabilities

Classification: **IMPLEMENTED** / **PARTIAL** / **PLACEHOLDER** / **MISSING** / **MISLEADING**

| Capability | Class | Evidence |
|------------|-------|----------|
| Collect payment from Payments / appointment / invoice (when collectible > 0) | IMPLEMENTED | front-desk + money-contract |
| Email invoice (staff) | PARTIAL | Send works; copy/log identity incomplete |
| Resend invoice | PARTIAL | Button label only; success string not resend-aware |
| Print invoice | IMPLEMENTED | Browser print |
| Open customer / appointment from invoice | IMPLEMENTED | Links |
| Send payment reminder (dedicated) | PLACEHOLDER | CRM “Consider sending a payment reminder.” — no action |
| Resend invoice from customer list | MISSING | Invoice workspace only |
| Email invoice SMS | MISSING | Email only |
| Balance-due message | MISSING | |
| Deposit-due reminder | PLACEHOLDER | Template `commerce.deposit_reminder`; **never sent** |
| Overdue invoice reminder | MISSING | `overdue` never set |
| Customer payment link | MISSING | SaaS Stripe hosted invoice is **not** customer commerce. Online pay = 6.4 |
| Call / message from **balance** context | PARTIAL | CRM comms exist; not money-context actions |
| Schedule follow-up | PARTIAL | Generic `communication_follow_ups` — not money-typed |
| Mark promise-to-pay | MISSING | |
| Collection note | PARTIAL | CRM notes — not collection-typed |
| Snooze follow-up | MISSING | Follow-up is pending/complete/cancel only |
| Assign follow-up to employee | MISSING | `createdBy` only |
| Surface due balances in Command Centre | PARTIAL | Counts from commerce snapshot + **misleading** copy / separate today `payment_status` fact |
| Surface due balances in Reception | PARTIAL | Daily payment attention; **excludes no-show**; not due vs overdue |
| Surface due balances in Customer CRM | PARTIAL | Split money panel + Collect; reminder placeholder |
| Surface in Summer | PARTIAL | Grounded snapshot if customer recognized; uses some stored invoice balances |
| Surface in Chase | PARTIAL / MISLEADING | Outstanding **deposits** insight is grounded. “Overdue guests” = **visit retention 45–120d**, not invoices |

---

## M. Automation / reminder capabilities

| Automation | Event source | Trigger | Channel | Template | Logging | Retry | Active? |
|------------|--------------|---------|---------|----------|---------|-------|---------|
| Appointment reminder | `background_jobs` job_type `reminder` | Scheduled at `reminder_hours_before` | email/sms | `appointment.reminder` | notification_logs | job processor | **Active** (visit reminder, **not money**) |
| Confirmation / cancel / reschedule | booking events | mutation | email/sms | appointment.* | logs | existing | **Active** |
| Invoice due reminder | — | — | — | none | — | — | **None** |
| Invoice overdue reminder | — | — | — | none | — | — | **None** |
| Unpaid deposit | template only | none | sms text exists | `commerce.deposit_reminder` | — | — | **Template only** |
| Unpaid appointment balance | — | — | — | none | — | — | **None** |
| Failed payment follow-up | — | — | — | none | — | — | **None** (no public PI workflow) |
| Refund follow-up | succeeded refund | inline | email | `commerce.refund` | logs + 6.2B first-send | resend UI exists for refunds | **Active** (notification, not collection) |
| Cancellation refund follow-up | — | cancel ≠ refund | — | cancel email ≠ refund | — | — | **None as money follow-up** |
| No-show balance follow-up | — | — | — | none | — | — | **None** |
| Business Hub `follow_up` / `reminder` rules | `business_automation_rules` CRUD | **no executor found** | config | n/a | n/a | n/a | **PLACEHOLDER / config theater** |

Do **not** enable anything in this phase.

---

## N. Summer / Chase money intelligence truth

**Grounded (if customer recognized):**

- Summer commerce intent reads `getSummerCommerceSnapshot`: appointment collectible, invoice collectible **sum**, deposit due, lifetime spend, deposits on file, store credit, up to 5 open invoices (stored `balanceCents` + `dueDate` + status).
- Explicit: never process cards.
- Chase: `outstandingDeposits` count from commerce snapshot; “Collect required deposits… Chase will not charge.”

**Fake / misleading / not money:**

- Chase `overdueFollowUp` / “high-value or overdue guests” = **days since last visit** (45–119), not overdue invoices.
- Command Centre Summer fact `outstandingBalanceCount` = **today payment_status**, not collectible remaining.
- CRM Spark “Consider sending a payment reminder” is not an agent action and not a send.
- No ranking of “collection priorities” or “high-value unpaid appointments” as a defined contract.
- Summer open-invoice dollars may use **stored balance**, not invoice collectible.

**Phase 6.3 should safely expose:** the three collectible buckets (appointment remaining, deposit due now, invoice collectible), with due_date as **display only** until PO defines overdue. Must not invent who to chase first.

---

## O. Cross-surface contradictions

| # | Contradiction | File / helper | Current formula | Expected canonical | Severity |
|---|----------------|---------------|-----------------|--------------------|----------|
| 1 | Paid in full (facing) vs outstanding if UI uses `payment_status` or arithmetic remaining | Most operating UIs fixed in 6.2B; Command Centre today-count still uses `payment_status` | `deposit_paid`/`partially_paid` counts | Collectible remaining > 0 only | Medium |
| 2 | Partially refunded + “balance due” | Should not happen on drawer/Payments if 6.2B helpers used | collectible = max(0, total − gross) | No Collect; Partially refunded | Low if 6.2B held; High if any leftover consumer |
| 3 | Invoice open + appointment collectible $0 | cancel leaves invoice; `invoiceCollectibleBalanceCents` ignores appointment status | invoice total − amount_paid | PO: void / keep / prompt | **High** (policy + UX) |
| 4 | Cancelled appointment + payment due (invoice KPI) | `cancel.ts` vs dashboard invoices | invoice still outstanding | Same as #3 | **High** |
| 5 | Refunded payment + customer “owes” refund amount | Only if net/arithmetic remaining used | invoice create stamps net | Never reopen | Medium (create path) |
| 6 | Invoice “Never sent” vs log sent | `document-workspace.ts` query by recipient+template | last matching customer email | Per-invoice identity | **High** (delivery truth) |
| 7 | “Overdue” before due date | Morning brief `overdueCustomers`; Chase overdue guests | payment attention / 45d visits | Do not say overdue for money until due_date contract | **High** (vocabulary) |
| 8 | Deposit due after deposit satisfied | arithmetic `depositDueNowCents` after refund | net toward deposit | Collectible deposit uses gross | Low on operating surfaces |
| 9 | Reports vs Payments outstanding | Reports uses commerce ledger when present | appointment collectible + invoice collectible separately labeled | Keep split | Low if ledger path |
| 10 | Customer account vs drawer | Account sums all appts; drawer is one appt | same helper | Same per appointment | Low |
| 11 | Command Centre vs Payments | CC deposits/invoices/balances from snapshot (collectible); CC summer fact from today `payment_status`; copy implies arithmetic remaining | mixed | One contract + honest labels | **High** |
| 12 | Booking Sheet “N due” vs Payments | `deposit < price` on upcoming | stale | collectible remaining | **High** |
| 13 | Gross payments mistaken for revenue | Internal field `revenueTodayCents`; UI label Gross payments collected | cash-in | Keep labels; don’t use for outstanding | Medium (naming debt) |
| 14 | Net retained mistaken for collectible | invoice create; historical balance_cents | total − net | Collectible = total − gross | Medium |
| 15 | Reception vs Payments on no-show unpaid | daily counts skip no-show; queues include | isActiveBooking vs neq cancelled | PO: include or exclude consistently | Medium |
| 16 | CRM open invoice count vs outstanding invoice $ | status vs collectible | open/partial/overdue | collectible > 0 | Medium |
| 17 | Customer “Paid in full” banner vs listed open $0-collectible invoice | `hasCollectibleObligation` vs invoice list status labels | collectible buckets vs raw status | Don’t label Paid in full if an invoice is still “Open” unless policy says so | Medium |

---

## P. Recommended Phase 6.3 scope (smallest correct)

Phase 6.3 is **follow-up truth**, not a new ledger, not aging reports, not online payment, not cancellation fees.

**In scope (after PO accepts this discovery + required decisions):**

1. One **outstanding vs due vs overdue** vocabulary across Payments, Command Centre, Reception, CRM, Reports, Summer.
2. Kill remaining **stale counters** (Booking Sheet snapshot; Command Centre today `payment_status` fact; morning-brief `overdueCustomers` name; CRM open-invoice count).
3. Invoice **delivery identity** aligned with 6.2B communications honesty (per-invoice logs; first-send copy; never claim Sent without a log).
4. Honest **lifecycle UX** for cancel + open invoice and no-show unpaid — **prompts or labels only** until PO chooses money policy.
5. Collection **operating** actions that already exist (Collect, Email invoice, generic follow-up) presented from money context — **no** fake reminder automation.

**Out of scope (do not pull into first 6.3 implementation):**

- Aging 1–30 / 31–60 / 61–90 / 90+
- Automatic due/overdue reminder jobs
- Payment links / Stripe Checkout / 6.4
- Unique indexes, atomic invoice RPC, 034–036
- Cancellation fees, no-show fees, deposit retention policy
- Void/edit invoice, delete payments
- Collection RBAC expansion
- Fake Chase “collection priority” ranking

---

## Q. Recommended sub-phases

### 6.3A — Outstanding / due / overdue semantic contract

| Field | Content |
|-------|---------|
| **Objective** | One vocabulary. Outstanding ≠ due ≠ overdue. Historical cash ≠ collectible. |
| **Behavior** | All counters that mean “money to collect now” use collectible remaining / collectible deposit / invoice collectible. Rename morning-brief `overdueCustomers`. Fix Booking Sheet snapshot. Fix Command Centre summer fact. CRM open-invoice count uses collectible filter. Summer invoice lines use collectible cents. Command Centre copy must not say “after refunds” as if arithmetic remaining. **Do not** auto-mark invoices overdue. |
| **Files** | `lib/actions/booking-sheet.ts`, `lib/actions/command-centre.ts`, `lib/dashboard/command-centre.ts`, `lib/actions/morning-brief.ts`, `lib/crm/payment-summary.ts`, `lib/commerce/customer-account.ts`, tests in `tests/unit/commerce`, `tests/unit/dashboard`, `tests/unit/crm` |
| **Tests** | Collectible $0 never increments outstanding counters; cancelled excluded from appointment queues; refund does not increment; naming tests that “overdue” is not used for payment-attention; Booking Sheet count matches collectible |
| **DB** | **None** |
| **PO first?** | **Yes for due timing** (is a future unpaid visit “outstanding” or “not yet due”?). Vocabulary cleanup of **false overdue** can proceed with “do not call it overdue.” |
| **Risk** | Medium — label/count changes only if 6.2B helpers reused |

### 6.3B — Lifecycle interaction (cancel / no-show / invoice) — policy surface

| Field | Content |
|-------|---------|
| **Objective** | Make cancel+invoice and no-show visible and consistent **without inventing fees**. |
| **Behavior** | After PO: either leave invoice open with an explicit staff state (`cancelled_with_invoice`), or prompt void, or other chosen policy. Align Reception vs Payments on no-show unpaid. |
| **Files** | `lib/booking-engine/mutations/cancel.ts` (behavior only after PO), invoice workspace, Payments queues, appointment-ops, document-identity |
| **Tests** | Cancel does not auto-refund (preserve 6.0B); invoice fate matches PO; no-show collectible unchanged until PO fee policy |
| **DB** | **None** unless PO requires void status write (still app-side `status=void` possible without migration) |
| **PO first?** | **YES — hard gate** |
| **Risk** | High if money policy changes; Low if labels only |

### 6.3C — Invoice delivery + reminder integrity

| Field | Content |
|-------|---------|
| **Objective** | Invoice email truth matches 6.2B honesty. |
| **Behavior** | Query logs by invoice number and/or `appointment_id` + template; first-send vs resent success copy; failed send ≠ success; Never sent only when **this** invoice has no sent/delivered log; do not add `email_status` column unless PO wants schema. Optional: hide or implement staff-triggered `commerce.deposit_reminder` — do not auto-send. |
| **Files** | `lib/commerce/invoice-email.ts`, `document-workspace.ts`, `document-delivery-truth.ts`, `invoice-workspace-actions.tsx`, `lib/actions/commerce-documents.ts` |
| **Tests** | Two invoices same customer email do not share Sent; first send vs resend copy; failure does not mutate money |
| **DB** | **App-only first.** Column on invoices is optional later (receipts already have one). |
| **PO first?** | Partial: SMS vs email-only; auto reminders stay off until a later decision |
| **Risk** | Medium (comms copy); Low for money columns |

### 6.3D — Follow-up operating surface (no fake collections CRM)

| Field | Content |
|-------|---------|
| **Objective** | Staff can act on money owed from the surfaces that already show it. |
| **Behavior** | From Payments queues / customer money panel / invoice: Collect, Email invoice, open appointment, create **generic** follow-up with money context in the title. Do **not** ship promise-to-pay, snooze, assignee, payment links, or auto-drip unless PO asks. |
| **Files** | `payments-dashboard.tsx`, `customer-commerce-panel.tsx`, `customer-profile.tsx`, communication follow-up actions |
| **Tests** | Placeholder “payment reminder” is not a silent send; follow-up create does not email invoice automatically |
| **DB** | **None** (reuse `communication_follow_ups`) |
| **PO first?** | Yes for SMS reminders, promise-to-pay, assignment, auto-drip |
| **Risk** | Medium UX; Low money math if Collect remains 6.2B |

**Do not start 6.4.** Do not apply uniqueness migrations as part of 6.3.

---

## R. PO decisions required before implementation

Do **not** decide these silently:

| # | Decision | Default if unimplemented (today) |
|---|----------|----------------------------------|
| 1 | Invoice-after-cancellation | Invoice left open |
| 2 | No-show collection / fee / deposit retention | Unpaid no-show remains collectible; no fee |
| 3 | Invoice due-date policy (default days; appointment date vs issue+7; whether overdue is written) | +7 civil days; never enforced |
| 4 | Is unpaid **future** appointment “outstanding” or “not yet due”? | Outstanding immediately |
| 5 | Deposit reminder timing | None (template unused) |
| 6 | Final-balance reminder timing | None |
| 7 | Overdue reminder timing / frequency / opt-in vs default-on | None |
| 8 | Customers receive payment links? | No (6.4) |
| 9 | Manual payment reminders email only or SMS too? | Invoice email only |
| 10 | Staff can mark promise-to-pay? | No |
| 11 | Invoices can be voided? | No action (status exists) |
| 12 | Invoices can be edited after issue? | No (6.2A lock) |
| 13 | Payments deleted vs only reversed/refunded? | Refund/reverse only (no delete found) |
| 14 | Collection permissions / RBAC | Unchanged; staff payment RBAC still future |
| 15 | Aging report requirements | None |
| 16 | Automatic reminders opt-in or default-on? | N/A — none exist |
| 17 | Align Reception no-show with Payments outstanding? | Divergent today |
| 18 | Unique invoice/receipt indexes + allocate RPC | Deferred; shared DB |

---

## S. DB / schema / RPC requirements

**Reconfirmed deferred (do not apply):**

- unique `commerce_invoices(appointment_id)`
- unique `commerce_receipts(transaction_id)`
- atomic invoice-number allocation RPC
- receipt-number race (max+1 + unique retry is app-level)
- migrations **034 / 035 / 036**
- Preview and Production **share Supabase**

**Additional for 6.3:**

| Need | Required to start 6.3A/C/D? |
|------|------------------------------|
| Invoice `email_status` column | **No** — logs are enough if queried by invoice identity |
| `overdue` writer / due-date job | **No** for semantics; **yes** only if PO wants stored overdue |
| Promise-to-pay table | **No** unless PO wants it |
| Money-typed follow-ups | **No** — reuse generic follow-ups |
| Collections aging table | **No** — out of scope |

If a feature truly needs a migration: **STOP at recommendation. Do not apply.**

---

## T. What can remain app-only

- Semantic/label/count convergence (6.3A)
- Invoice delivery query + copy (6.3C)
- Cancel/no-show **labels and prompts** (6.3B labels)
- Follow-up titles that mention invoice/appointment (6.3D)
- Summer/Chase copy that uses collectible cents already on the snapshot

---

## U. Tests Phase 6.3 will require

- Collectible remaining $0 (full pay + voluntary refund) never appears in outstanding appointment KPI/queues
- Cancelled never in appointment outstanding; invoice fate per PO
- No-show unpaid: document expected surface (include vs exclude) once PO decides
- Invoice collectible $0 excluded from outstanding invoices even if status `open` (if that becomes the rule) **or** explicit open+$0 document state
- Invoice email: per-invoice log identity; first send vs resend; failure ≠ success; money columns unchanged
- Booking Sheet outstanding count matches collectible, not `deposit < price`
- Morning brief / Chase do not call visit-retention or payment-attention “invoice overdue”
- Command Centre copy/counts match Payments collectible helpers
- CRM open invoice count matches collectible filter
- Regression: 6.2B Chase $337.87 / $50 refund / collectible $0; communications Not recorded vs Not applicable; no auto-send on render
- No new use of `remainingBalanceCents` as Collect driver

---

## V. Risks / regressions to protect

- Reopening 6.2B collectible remaining
- Refunds creating Collect CTAs
- Auto-email invoice on load
- Claiming Sent without a log
- Applying 034–036 or uniqueness indexes on shared DB
- Collapsing historical cash into collectible
- Inventing cancellation/no-show fees
- Enabling unused automation rules
- Payment links / Stripe Elements (6.4)
- Using stored `balance_cents` for Collect
- Using Chase CRM “overdue” as money overdue

---

## W. Exact files / modules likely involved (implementation later)

**Contract (do not change formulas without PO):**  
`lib/commerce/money-contract.ts`, `lib/commerce/mappers.ts`, `lib/commerce/refundability.ts`

**Outstanding read models:**  
`lib/commerce/dashboard.ts`, `lib/commerce/front-desk.ts`, `lib/commerce/front-desk-queries.ts`, `lib/commerce/customer-account.ts`, `lib/crm/directory-metrics.ts`, `lib/crm/payment-summary.ts`, `lib/reports/compute.ts`

**Stale counters / copy:**  
`lib/actions/booking-sheet.ts`, `lib/actions/command-centre.ts`, `lib/dashboard/command-centre.ts`, `lib/dashboard/appointment-ops.ts`, `lib/actions/morning-brief.ts`

**Invoice / delivery:**  
`lib/commerce/invoices.ts`, `lib/commerce/invoice-email.ts`, `lib/commerce/document-workspace.ts`, `lib/commerce/document-delivery-truth.ts`, `lib/commerce/document-identity.ts`, `lib/commerce/document-refund-presentation.ts`, `lib/actions/commerce-documents.ts`, `components/commerce/invoice-workspace-actions.tsx`, `components/commerce/invoice-document.tsx`

**Surfaces:**  
`components/commerce/payments-dashboard.tsx`, `components/commerce/customer-commerce-panel.tsx`, `components/crm/customer-profile.tsx`, `components/booking-sheet/*`, `components/day-view/appointment-drawer.tsx`, `components/dashboard/command-centre.tsx`

**Intelligence (read-only honesty):**  
`lib/summer/orchestrator.ts`, `lib/chase/insights.ts`, `lib/crm/ai-knowledge.ts`

**Lifecycle (policy-gated):**  
`lib/booking-engine/mutations/cancel.ts`, `lib/booking-engine/mutations/update.ts` (no-show)

---

## X. Phase 6.2B contract remains intact

**Yes.** This discovery does not change collectible remaining, refund-does-not-reopen-debt, cancelled non-collectible, no-show still collectible, open invoices separate, communications Not recorded vs Not applicable, first-send vs resend for **refunds**, or no auto-send on render.

---

## Y. DB impact from this discovery task = NONE

## Z. Production impact from this discovery task = NONE

## AA. Phase 6.3 implementation = NOT STARTED

## AB. Phase 6.4 = NOT STARTED

---

## Surface matrix (outstanding money)

| Surface | Source table(s) | Helper(s) | Formula | Collectible remaining | Invoice balance | Gross paid | Refunds | Deposit due | Invoice due date | Appt date | Payment status | Cancel / no-show | Canonical? | Stale stored override? |
|---------|-----------------|-----------|---------|----------------------|-----------------|------------|---------|-------------|------------------|-----------|----------------|------------------|-----------|------------------------|
| Payments KPIs | appointments + commerce_invoices + txs | `getCommerceDashboardSnapshot` | collectible sums; invoices via `invoiceCollectibleBalanceCents` | Yes | Yes (collectible) | Filter + cash-in KPI | Refunds KPI separate | collectible deposit | Display only on invoices | No | Prefilter unpaid…partially_paid | Excludes cancelled; includes no-show | Canonical for $ | Filter can miss fully_paid+collectible>0 (shouldn’t happen); includes partially_paid+collectible $0 in **query** then filters $ |
| Payments queues | appointments | `listOutstandingAppointmentBalances` / `listOutstandingDeposits` | remainingCents / depositDueNowCents from collectible | Yes | No | Via stamps | Via collectible | Yes | No | Sort by start | Prefilter | Excludes cancelled; includes no-show | Canonical rows | Same prefilter |
| Appointment drawer / booking sheet money | appointments | `appointmentCollectibleMoneyFromStamps` | 6.2B | Yes | No | Yes | Facing label | Yes | No | Visit time | Facing | Cancel hides Collect; no-show Collect if $ | Canonical | No |
| Booking Sheet CRM “N due” | upcoming appts | `getBookingSheetCustomerSnapshot` | deposit < price | **No** | No | **No** | **No** | Proxy | No | Upcoming only | No | Excludes cancelled | **Duplicated / stale** | N/A |
| Customer account panel | appts + invoices + txs | `getCustomerCommerceAccount` | collectible sums; invoices separate | Yes | Yes | Historical totalPaid | Refunds list | Yes | On invoice rows | No | No | Cancel = 0 appt $ | Canonical split | Invoice stored balance listed on rows |
| CRM directory outstanding | appointments | `buildDirectoryMetricsByCustomer` | `collectibleRemainingBalanceCents` | Yes | No | Yes | Yes | No | No | No | No | Cancel = 0 | Canonical appt $ | No |
| Command Centre attention | commerce snapshot | `buildAttentionItems` | counts from dashboard collectible | Yes | Yes | — | Copy misleading | Yes | No | No | No | Via snapshot | $ canonical; **copy stale** | No |
| Command Centre Summer facts | today’s schedule | `outstandingBalanceCount` | payment_status set | **No** | No | Via status | No | Mixed into unpaid/deposit_* | No | Today only | **Yes as SoT** | Today’s rows | **Duplicated / stale** | payment_status can lag facing label |
| Reception daily / morning brief | today’s appts | `paymentReadinessFromStamps` / `countDailyStatuses` | collectible readiness | Yes | No | Yes | Yes | Via payment_due | No | Today | Fallback if no stamps | **No-show excluded** | Canonical for **today active** | Name `overdueCustomers` misleading |
| Reports (commerce path) | ledger snapshot | `computeFinancialReport` | outstanding appointment $ + outstanding invoices $ separately | Yes | Yes | Month cash-in | Month refunds | Deposits collected | No | No | No | Via ledger | Canonical split | Fallback path if no ledger |
| Invoice workspace | invoice + appt | min(appt collectible, invoice collectible) | Collect CTA | Yes | Yes | Display | Display | No | Display | Display | Status label | Cancel → Collect hidden | Canonical Collect | Stored balance shown as document field |
| Receipt workspace | receipt + tx | payment evidence | Not outstanding | No | No | This payment | Refunds listed | No | No | No | No | — | N/A | No |
| Chase insights | KPIs + deposits count | `buildChaseInsights` | deposit count; “overdue guests” = CRM visits | Deposits only | No | Revenue KPIs | No | Yes | No | No | No | No | Deposits grounded; overdue **not money** | No |
| Summer commerce | customer account | `getSummerCommerceSnapshot` | same as account; invoice lines use `balanceCents` | Yes (sum) | Mixed | Lifetime | No | Yes | Display | No | Invoice status | Via account | Sums canonical; **line $ may be stored** | Yes on line items |

---

*End of discovery. Implementation not started. Do not mark Phase 6.3 PO-accepted.*
