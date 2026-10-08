# Issue #133 / #134 — Canonical Projection + Financial Observability Contract

**Date:** 2026-10-08  
**Status:** PRODUCT OWNER APPROVED / PREPARED-ONLY SLICE 1 IMPLEMENTATION + LOCAL PROOF AUTHORIZED / NO HOSTED APPLICATION OR ACTIVATION AUTHORIZED
**Technical baseline:** `ff063bab8acbfb996c75fa8d7fa79ef2e838f303`  
**Local-proof status:** `LOCAL_DATABASE_PROOF_6_ACCEPTED`  
**Current documentation head at preparation:** `eb43aef1bb7774c1837d59ff8f02771a54d2e371`  
**Issue #158 migration:** `01b10f8c629cc73b08d6c5849160836b90cbc87beb29d7c8b78857375fe2493b` / 83,565 bytes / NOT APPLIED TO HOSTED ENVIRONMENTS  
**Parent product issues:** #133 financial observability, #134 idempotency/reconciliation, #153 permission cutover  

This contract defines the next Chasum financial-integrity layer after the independently accepted Issue #158 local database proof. It is intentionally **design-only**. It does not authorize a migration, code implementation, Staging application, worker activation, UI wiring, communication delivery, Production change, GVM test booking, or technician payment/deposit resumption.

**Independent challenge reconciliation:** Grok 4.7 High returned `CORRECTIONS_REQUIRED` on the original design hash `cdf61cb3...`. The overall architecture passed challenge; blocking specification corrections were required for legacy-writer/admission fencing, exact supported ledger set, void/unbound invoice behavior, COMPLETE verification, receipt/invoice independence, delete semantics, pre-bind recovery classification, Reporting authority, and retained-cohort exclusion. Those corrections are incorporated below; no implementation was performed.

**Independent Level-3 acceptance:** Claude Opus 5 High independently reviewed corrected commit `f5bb3b81b45ee02cc04bbadaddfb9828cfac8536` / tree `5c95b36314c67c9adb5c43e563c24fd07fe82ce3`, verified this document at SHA-256 `a43c8f9a152715e0f86302ba9ce26e0abf3722a4bef3ccb16b1461a9036af703` / 41,154 bytes, and returned `READY_FOR_PO_IMPLEMENTATION_GATE`. This means the design is complete enough to ask the Product Owner for one PREPARED-ONLY Slice 1 implementation/local-proof authorization. It does not itself authorize implementation or any hosted action.

**Product Owner authorization:** Darshan explicitly approved the exact prepared-only Slice 1 implementation and local-proof preparation under final contract SHA-256 `51334ca5da427df068fc6370e2189dc83f58f1611b7e8a9a53e46045d61586f0`. Authorization is limited to the exact 16-path Slice 1 allowlist and disposable-local proof preparation/execution gates defined below. It does **not** authorize Staging or Production migration application, worker activation, live Business admission, Reporting/CRM runtime cutover, UI wiring, communications, provider activity, #153 permission changes, historical repair, Production/GVM change, or technician payment/deposit resumption.

## 1. Launch classification and scope

### LAUNCH REQUIRED

The following are required before Chasum can safely return GVM to normal booking/payment operation:

- deterministic appointment paid/refunded cache reconciliation from canonical ledger truth;
- one deterministic appointment invoice identity and recomputed settlement truth;
- one deterministic CRM/customer payment mirror per canonical transaction;
- one deterministic receipt document per canonical transaction;
- durable obligation state and safe retry after partial synchronization;
- #133 canonical attempt/intent/outcome reader shared by operator surfaces and Summer;
- Reporting re-source away from unchecked CRM mirror financial truth;
- independently reviewed projection concurrency/failure recovery before connected Staging acceptance.

### DESIGN FOR NOW / BUILD LATER

- autonomous Summer financial actions;
- refund-aware automatic projection beyond the currently safe bounded rules below;
- provider/card-network recovery beyond accepted manual booking tender;
- communication delivery/retry integration;
- rich financial-audit explorer and advanced analytics.

### DEFER / DO NOT BUILD IN THIS SLICE

- historical Production backfill or speculative repair;
- GVM-specific architecture;
- #153 permission cutover itself;
- public booking changes;
- refund redesign;
- broad RLS/default-ACL redesign;
- email/SMS receipt delivery;
- Production release or GVM operational test.

## 2. Preserved source-of-truth decisions

The following decisions are already established and are not reopened by this contract:

1. `commerce_transactions` is authoritative recorded-money ledger truth.
2. `commerce_payment_attempts` is authoritative logical payment-intent identity/state.
3. `commerce_payment_attempt_events` is append-only attempt/audit history.
4. `commerce_payment_reconciliation` is the durable per-attempt projection-obligation ledger.
5. Appointment paid/refunded/status fields are **derived cache**, not money authority.
6. Invoice paid/refunded/balance/status fields are **derived settlement state** on an authoritative billing document; invoice existence is not proof of payment.
7. `customer_payment_events` is a derived CRM/reporting mirror, not money authority.
8. `commerce_receipts` is a derived document tied to a canonical transaction.
9. PENDING synchronization is not COMPLETE synchronization.
10. A legitimate second equal-value payment has a different attempt/transaction identity and must never be suppressed by amount-only dedupe.
11. Summer consumes the same deterministic financial truth as operators; no AI-specific financial history is permitted.
12. Communications remain a separate delivery domain and remain OFF in this slice.
13. The Issue #158 prepared backend remains unwired/default-off until later activation gates.
14. Proof #6 is accepted and must not be rerun merely for confidence.

## 3. Current source map — reusable foundations and unsafe legacy assumptions

### Reuse as-is

`commerce_payment_reconciliation` already creates exactly four obligations for one accepted canonical attempt:

- `appointment_cache`;
- `invoice_settlement`;
- `customer_payment_events`;
- `receipt`.

Primary key `(attempt_id, projection_kind)` already gives one durable obligation identity per attempt/kind. States are `PENDING | COMPLETE | FAILED | NOT_REQUIRED`; failure codes are bounded. This remains the only projection-work registry. **Do not create a second queue/outbox table for these four projections.**

The accepted Issue #158 commit creates the exact ledger row and four PENDING obligations in one transaction. The projection layer starts only from that durable state.

### Legacy behavior that must not be copied into canonical projection

Current `recordCommercePayment()` writes the ledger and then sequentially performs appointment cache, invoice, CRM mirror, receipt/audit/event work. A failure after the ledger can leave partial synchronization. That flow remains legacy compatibility until canonical cutover; it is not the new projection architecture.

Current appointment cache synchronization is read/add/write delta logic. Canonical projection must recompute from ledger truth rather than add an untrusted delta.

Current invoice payment synchronization is read/add/write. Canonical invoice settlement must recompute from ledger truth.

Current invoice identity is not DB-unique by appointment. `createInvoiceForAppointment()` assumes zero/one but schema currently enforces only `(business_id, invoice_number)` uniqueness.

Current invoice sequence allocation is application read/update. The existing per-Business sequence table is reusable, but canonical allocation must occur atomically under a database lock/transaction.

Current receipt identity is not DB-unique by transaction. `createReceiptForTransaction()` performs check-before-insert and receipt numbering uses Business receipt count + 1, which is not concurrency-safe.

Current `customer_payment_events` has no transaction/attempt correlation or uniqueness. CRM and Reporting read it, so absence can create visible divergence, but the mirror must never become financial authority.

Current refund flow persists `commerce_refunds`, updates the original transaction status, and also writes a `commerce_transactions(kind='refund')` movement. Automatic refund reconciliation is therefore unsafe unless the movement relationship is explicitly resolved. This slice must **hold**, not guess, when refund/void/adjustment evidence is present.

## 4. Canonical projection invariant

For an accepted canonical payment attempt:

**Attempt + events + canonical ledger = financial truth.**  
**Obligation row = synchronization work/state.**  
**Appointment/invoice/CRM/receipt = deterministic projections.**

A projection may never create or modify canonical money.

Each projection runs in its own database transaction and must be safely replayable using the same `(business_id, attempt_id, projection_kind)` identity.

A projection result is one of:

- `COMPLETE` — target exists and exactly matches canonical truth;
- `FAILED / PROJECTION_FAILED` — current projection transaction definitely failed without an uncertain committed target effect;
- `FAILED / PROJECTION_UNCERTAIN` — target evidence is ambiguous or contradictory and must be reviewed/recovered by the same obligation identity;
- `NOT_REQUIRED` — only where the contract explicitly says no target should exist.

Obligation shape is source-specific and preserved:

- accepted Issue #158 booking payment with a bound appointment creates all four obligations as PENDING;
- accepted R1a customer-only payment already creates `appointment_cache=NOT_REQUIRED` and leaves `invoice_settlement`, `customer_payment_events`, and `receipt` PENDING; the invoice projector must resolve `invoice_settlement` to NOT_REQUIRED when `appointment_id` is NULL, while CRM mirror and receipt remain required.

No failed/unknown projection allows recollection, a new payment attempt, or a second appointment.

## 5. Projection worker security, admission and transaction boundary

The first projection implementation must remain server-only and service-role-only.

### Durable projection admission / retained-cohort exclusion

A pending-index scanner or direct projector call must not be able to claim historical retained attempts merely because their obligation is PENDING. Add one durable per-Business projection-admission row. The minimum v1 shape is:

- `business_id uuid PRIMARY KEY`;
- `enabled boolean NOT NULL DEFAULT false`;
- `admit_attempts_created_after timestamptz NULL`;
- `updated_at timestamptz NOT NULL`.

No row, `enabled=false`, or a NULL watermark means **no attempts are admitted**. First governed activation sets the watermark to `clock_timestamp()` and enables admission in one service-role-only transaction. Re-enabling may reuse the same watermark; v1 does not move it backward or silently admit older work. Every claim query and every projector RPC must require `enabled=true` and `attempt.created_at > admit_attempts_created_after`. Thus retained attempts created before activation are mechanically ineligible even if they remain PENDING.

Projection admission is also a traffic-cutover boundary. For a Business with projection admission enabled, legacy payment/refund writers must not run. Before any real-Business activation, the supported writer inventory must be converged and the application must route/deny legacy payment/refund entrypoints **before provider/network or database side effects**. The projector does not attempt to repair a race with `recordCommercePayment()` or `processCommerceRefund()`. Connected Staging uses a new synthetic Business/cohort dedicated to the canonical path.

Every projection RPC/function must:

1. require literal `service_role`;
2. accept exact `business_id` + `attempt_id` only (plus no browser-controlled customer/amount/target identity);
3. prove the Business projection-admission row currently admits this attempt;
4. lock the matching reconciliation obligation first;
5. require obligation kind to match the called projector;
6. accept only `PENDING` or `FAILED` as mutating/retryable input; `COMPLETE/NOT_REQUIRED` is verification-only and never mutates target state;
7. load and lock the attempt;
8. prove `execution_state='ACCEPTED'` and exact one linked ledger row;
9. prove Business/customer/appointment/amount/currency/method/kind/provider identity agrees between attempt and ledger;
10. for appointment-scoped projection, lock the appointment **before** reading the full appointment ledger set used for recomputation;
11. load required target rows in documented deterministic order;
12. perform one idempotent target reconciliation;
13. transition the obligation by compare-and-set and append one `PROJECTION_CHANGED` event in the same transaction;
14. never call a provider, email/SMS service, external API, or non-transactional network operation inside the database transaction.

Lock order for the new projector layer:

**obligation → attempt → triggering ledger → appointment → full appointment ledger snapshot → invoice/sequence or receipt/sequence or CRM target.**

No projector may obtain an attempt lock after locking its target.

Invoice/receipt sequence allocation must take a distinct Business-scoped advisory lock **before** inserting a missing sequence row, then lock the sequence row `FOR UPDATE`. Use separate advisory namespaces such as `invoice-sequence:<business_id>` and `receipt-sequence:<business_id>`; do not reuse the booking-operation advisory key. This closes the first-row creation race that `FOR UPDATE` alone cannot cover.

## 6. Canonical appointment-cache projection

### Authority

Appointment fields remain derived cache:

- `amount_paid_cents`;
- `amount_refunded_cents`;
- `payment_status`.

Commercial terms remain the appointment's stored terms:

- `price_cents` is stored tax-exclusive subtotal, including legitimate zero;
- `tax_cents` is stored tax;
- `deposit_cents` is configured required deposit, not collected money.

Never substitute today's service catalog values during reconciliation.

### Recompute rule

The projector locks the appointment, then reads all same-Business ledger movements linked to that appointment, not just the triggering attempt, so later legitimate payments cannot be overwritten by replaying an older obligation.

The exact supported positive set for this first slice is every distinct transaction row satisfying all of:

- same `business_id`;
- same `appointment_id`;
- `kind IN ('payment','deposit')`;
- `status='succeeded'`;
- `provider='manual'`;
- `currency` equals the triggering accepted attempt currency.

The triggering accepted attempt must be represented by exactly one linked transaction. Two legitimate equal-value payments count because they have distinct transaction IDs. Legacy positive manual rows may contribute only when they satisfy the same supported tuple; no amount/time/description dedupe is allowed.

Any other appointment-linked financial evidence makes the affected automatic projection `PROJECTION_UNCERTAIN` with **no cache write**: refund/void/adjustment; `store_credit`/`gift_card`; non-succeeded status; non-manual provider; second currency; malformed identity; or contradictory transaction/attempt tuple.

Stored commercial terms are authoritative: `total_cents = price_cents + tax_cents`; explicit zero remains zero; `deposit_cents` is a requirement, not collected money. `price_cents` and `tax_cents` must both be present, finite integers and non-negative; invalid/NULL/negative stored terms hold `PROJECTION_UNCERTAIN` rather than falling back to the service catalog. `deposit_cents` must be finite/non-negative; contradictory stored terms hold rather than being normalized silently. A positive ledger against contradictory/invalid stored totals holds rather than substituting catalog values.

As belt-and-braces protection, `appointments.amount_refunded_cents > 0` also holds `PROJECTION_UNCERTAIN` even if refund ledger evidence is unexpectedly absent. For an ACCEPTED canonical attempt the zero-total/zero-paid branch is unreachable because accepted non-none attempts require positive amount; do not "harmonize" this projector with legacy zero-total status derivation.

For the supported set, `amount_paid_cents` is the sum of supported distinct transaction IDs and `amount_refunded_cents` remains zero because any refund evidence holds. `payment_status` derives only from stored terms and that recomputed paid amount:

- `paid <= 0 && total > 0 && deposit_cents > 0` → `deposit_required`;
- `paid <= 0 && total > 0` → `unpaid`;
- `deposit_cents > 0 && paid >= deposit_cents && paid < total` → `deposit_paid`;
- `paid >= total` → `fully_paid`;
- otherwise → `partially_paid`.

Cancellation is not money uncertainty: a cancelled appointment still receives the canonical financial cache when its ledger history is otherwise supported.

The projector writes **only** `amount_paid_cents`, `amount_refunded_cents`, and `payment_status`; it never rewrites `price_cents`, `tax_cents`, or `deposit_cents`. It writes the fully recomputed totals/status, never `existing + delta`.

### Refund boundary

This slice does **not** invent refund semantics. If the appointment has:

- `kind='refund'` ledger rows;
- original payment status `partially_refunded` / `refunded`;
- successful `commerce_refunds` evidence;
- unsupported `void` / `adjustment` movement;

then automatic appointment projection must hold `PROJECTION_UNCERTAIN` unless a separately approved refund-aware contract can prove one canonical movement source without double counting.

This is fail-closed by design and is safe for the initial GVM booking/deposit path, which does not need refund projection to validate new booking payments.

## 7. Canonical invoice-settlement projection

### One invoice per appointment

The current product workflow treats an appointment as having zero or one current commerce invoice. The database must mechanically enforce that invariant before canonical projection activation.

Proposed additive uniqueness:

- unique `(business_id, appointment_id)` for non-null appointment IDs.

Before creating anything, the projector accepts only:

- zero matching invoices; or
- one matching invoice whose Business/customer/appointment/commercial terms can be verified.

More than one existing invoice, mismatched customer/Business, unverifiable line identity, or conflicting financial totals is `PROJECTION_UNCERTAIN`; do not choose one and do not create a replacement. The migration must fail preflight/application if duplicate non-null `(business_id, appointment_id)` pairs already exist; it must not silently skip or weaken the unique index.

A `void` invoice is also `PROJECTION_UNCERTAIN`: do not mark it paid and do not create a replacement. **V1 deliberately reserves the one invoice identity even when void.** Invoice reissue/replacement requires a later explicit document-version contract and future index change; it is not inferred here.

If an accepted attempt has `appointment_id IS NULL`, `invoice_settlement` becomes `NOT_REQUIRED` in this slice. It must not remain permanently PENDING without a document identity. CRM mirror and receipt remain required for that accepted ledger.

### Invoice creation

When no invoice exists, create invoice + initial line(s) atomically from stored appointment terms. Do not seed paid amount from stale appointment cache; compute settlement from canonical ledger truth in the same projector transaction.

Invoice number allocation must use a Business-scoped invoice-sequence advisory lock taken before first-row creation, then the existing `commerce_invoice_sequences` row `FOR UPDATE`, with allocation/increment committed in the same invoice projection transaction. Do not reuse the current application read-then-update allocator as the canonical concurrency contract. A unique invoice-number collision is a same-obligation retry/verification event, never permission to create a second appointment invoice. Gaps are acceptable; duplicate document identity is not.

Invoice document identity is appointment identity; invoice number is display/business sequence identity, not dedupe identity.

### Invoice settlement

Recompute:

- gross paid;
- supported refunded amount when/if refund-aware contract exists;
- balance;
- paid/partial/open/refunded status;
- `paid_at` only when canonical settlement proves balance zero.

For this first slice, refund/void/adjustment ambiguity holds `PROJECTION_UNCERTAIN`, matching appointment-cache behavior.

After one verified invoice exists, the projector may set the canonical transaction's `invoice_id` from NULL to that exact invoice. A different existing non-null `invoice_id` is a contradiction/hold; never silently repoint money to another invoice.

## 8. Canonical CRM/customer-payment-event projection

`customer_payment_events` remains a derived compatibility/read-model table.

The canonical mirror needs durable transaction identity, not amount/time matching.

Proposed additive schema:

- nullable `transaction_id uuid` on `customer_payment_events` for backward compatibility;
- unique `(business_id, transaction_id)` where transaction_id is non-null;
- same-Business FK from `(transaction_id, business_id)` to the canonical transaction identity key.

Legacy rows remain NULL and are not backfilled speculatively.

The projector writes exactly one canonical mirror row from the transaction and appointment identity. Replays verify exact tuple equality and return COMPLETE; mismatched existing canonical mirror becomes `PROJECTION_UNCERTAIN`.

The mirror is not allowed to introduce a second amount, currency, customer, appointment, method, provider or transaction truth.

## 9. Canonical receipt projection

### One receipt per transaction

Receipt identity must be database-enforced as one document per canonical transaction.

Proposed additive uniqueness:

- unique `(business_id, transaction_id)` on `commerce_receipts`.

A same-Business transaction FK must remain mechanically valid. No receipt may be created from a caller-supplied amount/customer/method.

### Receipt numbering

Current `COUNT(*) + 1` numbering is not concurrency-safe and must not be used by canonical projection.

Proposed new `commerce_receipt_sequences` table:

- `business_id uuid PRIMARY KEY`;
- `next_number integer NOT NULL`;
- `prefix text NOT NULL DEFAULT 'RCT'`;
- `updated_at timestamptz NOT NULL`.

Canonical allocation occurs atomically inside the receipt projection transaction under a per-Business receipt-sequence lock.

Receipt number is presentation identity; canonical dedupe identity is transaction ID.

### Receipt body truth

Receipt amount/currency/method/customer/transaction reference must come from canonical transaction. Appointment/service/tax/balance context may be included only after same-Business verification and must never override transaction money.

Receipt completion does **not** depend on `invoice_id`. The required completion tuple is Business + transaction + customer + amount + currency + method plus the canonical receipt identity/number/body derived from that transaction. If the transaction has no invoice yet, receipt may COMPLETE with `invoice_id=NULL`. COMPLETE replay never mutates the receipt later merely to fill invoice linkage; any future NULL→exact-invoice enrichment is a separately reviewed monotonic document-link contract.

Receipt sequence allocation takes the Business receipt-sequence advisory lock before inserting a missing `commerce_receipt_sequences` row, then locks that row `FOR UPDATE` and allocates/increments in the same receipt transaction. Reprint/regeneration reuses the same receipt row and number.

Receipt document creation is required; receipt email/SMS delivery is **not** part of this projection. `email_status` remains `not_sent` and communications remain separately gated.

## 10. Required transaction same-Business key

To support DB-enforced same-Business projection references, add a tenant key on canonical transactions:

- unique `(id, business_id)` on `commerce_transactions`.

This does not change transaction identity; the existing global UUID PK remains authoritative. It only permits composite tenant FKs for canonical mirrors/documents.

Delete semantics are explicit:

- receipt → transaction: retain the existing single-column `ON DELETE CASCADE` FK and add composite same-Business integrity only with **ON DELETE CASCADE**; do not replace it with RESTRICT/NO ACTION;
- CRM mirror → transaction: new composite same-Business FK uses **ON DELETE CASCADE** because the mirror is derived and legacy NULL-transaction rows remain unaffected;
- invoice → appointment: **do not add a composite FK in this slice**. The current single-column relationship uses `ON DELETE SET NULL`; a naïve composite SET NULL would also try to null non-null `business_id`, changing delete behavior. V1 uses appointment uniqueness plus projector same-Business validation; broader cross-tenant legacy-writer closure stays with #153/cutover.

The implementation preflight must check collisions/duplicates and exact deployed object names before authoring/applying anything.

## 11. Obligation state/event contract

For each projection retry:

1. prove Business admission admits the attempt and lock the exact obligation;
2. if COMPLETE/NOT_REQUIRED, re-read/verify current target truth and return replay result **without target mutation or obligation downgrade**;
3. if PENDING/FAILED, execute deterministic projection;
4. on success set:
   - `state='COMPLETE'`;
   - `failure_code=NULL`;
   - `updated_at=now()`;
   - `completed_at=now()`;
5. append exactly one canonical `PROJECTION_CHANGED` event in the same transaction. The emitted vocabulary is a jointly locked invariant with the R1a replay amendment:
   - `money_state='RECORDED'`;
   - `projection_kind` = the exact obligation kind;
   - success: `reconciliation_state='COMPLETE'`, `failure_class=NULL`, `failure_code=NULL`;
   - definite projection failure: `reconciliation_state='FAILED'`, `failure_class='PROJECTION'`, `failure_code='PROJECTION_FAILED'`;
   - contradictory/ambiguous projection evidence: `reconciliation_state='FAILED'`, `failure_class='PROJECTION'`, `failure_code='PROJECTION_UNCERTAIN'`;
   - customer-only invoice transition: `reconciliation_state='NOT_REQUIRED'`, `failure_class=NULL`, `failure_code=NULL`;
   - Slice 1 never emits `PROJECTION_CHANGED` with `reconciliation_state='PENDING'`.
6. on a definitely rolled-back/recoverable target error, set FAILED/PROJECTION_FAILED and append the exact matching event above;
7. on contradictory/ambiguous target evidence, set FAILED/PROJECTION_UNCERTAIN and append the exact matching event above;
8. transport loss after a database commit is recovered by re-reading the **same obligation**; never create another obligation or payment attempt.

No projector may set all obligations complete as a batch. Each target earns its own COMPLETE state.

For aggregate targets such as appointment cache or invoice settlement, COMPLETE replay verifies the target against the **current full supported same-appointment ledger aggregate**, not the triggering attempt delta or an old completion snapshot. A later legitimate payment does not invalidate or reopen the older COMPLETE obligation; the later attempt's own PENDING/FAILED obligation is responsible for writing the new aggregate. If a COMPLETE replay observes contradiction with current truth, it returns a fail-closed verification result but does not rewrite the target or downgrade the historical COMPLETE row.

Unique-violation losers must re-read the canonical target: exact matching identity/tuple can converge to COMPLETE; a different or contradictory target is `PROJECTION_UNCERTAIN`. Target write + obligation transition + `PROJECTION_CHANGED` event must commit atomically so a committed target cannot be hidden behind a FAILED obligation.

Unbound accepted attempts preserve the R1a shape: `appointment_cache` remains NOT_REQUIRED; `invoice_settlement` is resolved to NOT_REQUIRED by this slice; CRM mirror and receipt can independently COMPLETE.

**Locked cross-contract vocabulary:** any future slice that proposes a new payment-attempt event type, a new `PROJECTION_CHANGED` reconciliation state (including PENDING/requeue), or different projection failure metadata must jointly review and update both the projection emitter contract and every ACCEPTED replay validator before activation. Do not repeat the implicit-coupling defect that triggered the R1a amendment. Issue #158 replay is intentionally not harmonized in this slice; its looser event census already holds an accepted Database Proof #6 and remains closed.

## 12. #133 canonical financial-intent/outcome reader

Issue #133 must not become another logging table.

The durable attempt/event/ledger/obligation model now contains the core canonical evidence. The #133 implementation should add one private, tenant-authorized canonical reader over that same truth rather than persist parallel financial history.

### Reader modes

Proposed internal reader supports:

- `one` — exact attempt ID;
- `history` — deterministic bounded Business history with opaque cursor.

It must use one database statement/snapshot after authorization, analogous to the accepted booking-operation reader.

### Minimum output

PII-safe operator/Summer result:

- attempt ID and attempt key where role-appropriate;
- source/surface;
- booking-operation ID when present;
- appointment ID when bound;
- payment kind;
- requested/effective amount, currency, method and provider route from immutable attempt truth;
- exact booking `payment_mode` from booking-operation registry when one exists;
- execution state and recovery disposition;
- failure class/code;
- ordered events;
- ledger count and exact canonical transaction ID/tuple when one valid row exists;
- four obligation states/failure codes/timestamps;
- derived operator state;
- synchronization state;
- created/resolved timestamps;
- communication eligibility `NOT_IMPLEMENTED` in this slice.

Do not return inline customer name/email/phone, raw notes, provider secrets, card data, raw request hashes or internal database errors to normal operator/Summer views.

### Exact operator states

Use one shared derivation:

- `NOT_RECORDED` — SKIPPED no-payment or coherent terminal FAILED attempt with certified zero ledger;
- `PAYMENT_RECOVERY_REQUIRED` — coherent REQUESTED attempt with `recovery_disposition='RECOVER'` and zero ledger, whether or not an appointment is already bound; same-identity recovery is required;
- `RECORDED_BUT_NOT_FULLY_SYNCHRONIZED` — exact ACCEPTED ledger exists but one or more required obligations are PENDING/FAILED;
- `RECORDED` — exact ACCEPTED ledger exists and every required obligation is COMPLETE/NOT_REQUIRED;
- `UNKNOWN` — contradictory identity/count/tuple/state evidence or query uncertainty.

`UNKNOWN` never authorizes collection, replay with a new key, or a new booking.

### Requested-mode limitation

For booking-operation attempts, exact `payment_mode` is already durable in `commerce_booking_operations` and must be joined into #133 output.

For non-booking canonical attempts, current attempt schema persists kind/amount/currency/method/provider/source but not every UI presentation mode such as `full` versus `custom`. Do not fabricate that distinction. A future existing-appointment canonical-writer v2 may add an explicit normalized request-mode field if that distinction is required for those surfaces. This limitation must remain visible until that writer contract exists.

## 13. Reporting and CRM re-source rule

Current Reporting reads `customer_payment_events`. That is a derived mirror and must not remain authoritative after canonical cutover.

Before GVM operational acceptance:

- financial totals/revenue/payment counts use **one canonical ledger aggregate definition** over `commerce_transactions`; Reporting and any later totals endpoint must call/reuse that same definition rather than independently reimplementing financial math;
- revenue inclusion is ledger truth, **not obligation COMPLETE**. Missing/failed CRM or receipt synchronization must never erase recorded revenue; synchronization is reported separately;
- the first supported positive revenue set follows the bounded manual ledger predicate in section 6. If the requested reporting scope contains refund/void/adjustment, unsupported provider/kind, or currency ambiguity, the aggregate must return an explicit held/unknown condition for that affected scope rather than silently netting or silently omitting it;
- location reporting continues to derive location from appointments; this slice does not add `location_id` to the ledger;
- `customer_payment_events` remains a CRM timeline projection only;
- customer account disagreement remains visible/fail-closed rather than using `Math.max` or another masking heuristic.

The #133 attempt reader remains the per-attempt intent/outcome contract; it is not a second revenue calculator. Summer and operators consume the same canonical reader for attempt truth and the same canonical ledger aggregate for financial totals.

## 14. Summer readiness

### UNDERSTAND — BUILD NOW

Summer can read exact normalized intent, attempt state, ledger truth and projection state from the canonical reader.

### EXPLAIN — BUILD NOW

Summer may answer, for example:

- what payment was requested;
- whether it was recorded;
- which transaction proves it;
- whether appointment/invoice/CRM/receipt synchronization is complete;
- which projection failed and whether money should **not** be recollected.

### RECOMMEND — DESIGN NOW / BOUNDED BUILD

Summer may recommend review/retry of the **same projection obligation** or same attempt recovery when evidence permits. It must not recommend recollection when canonical ledger exists.

### ACT — BUILD LATER

No autonomous payment, refund, projection retry, invoice/receipt send, or identity rotation in this slice.

### AUDIT — BUILD NOW

Attempt events + obligation transitions are the durable audit trail. Summer action later must reference these identities; no hidden AI side log.

### Implementation carry-forward conditions from independent Level-3 review

The prepared-only implementation prompt must also enforce these non-blocking-but-binding details:

- future worker claim/selection is exposed only through one service-role function that applies the admission predicate; no ad-hoc scanner may claim directly from the PENDING partial index;
- COMPLETE-replay verification mismatch must be visible in the RPC/reader result without mutating or downgrading the COMPLETE obligation;
- Slice 2 financial aggregate must define currency explicitly (group by currency or hold); the per-attempt "triggering currency" rule is not a reporting-scope rule;
- any future refund-aware CRM mirror keys to the refund movement's own canonical refund transaction ID, not the original payment transaction ID;
- `commerce_payment_attempt_events` has no actor column; this is accepted for Slice 1, but later Summer ACT attribution may require an additive actor/audit field;
- legacy `createReceiptForTransaction()` reads existing receipts by transaction ID without a Business filter, reinforcing the requirement that legacy writers remain excluded before real-Business projection admission.

## 15. Proposed prepared-only schema delta

Exact names remain subject to independent design review, but the implementation gate should stay bounded to the following additive intent:

1. unique tenant key `(id, business_id)` on `commerce_transactions` for projection FKs;
2. partial unique appointment invoice identity `(business_id, appointment_id)` where appointment is non-null; migration aborts on existing duplicates;
3. unique receipt identity `(business_id, transaction_id)`;
4. additional same-Business receipt→transaction composite FK with `ON DELETE CASCADE`, preserving the existing single-column cascade;
5. nullable `customer_payment_events.transaction_id`;
6. partial unique canonical CRM mirror `(business_id, transaction_id)` where transaction is non-null;
7. same-Business CRM mirror→transaction composite FK with `ON DELETE CASCADE`;
8. new `commerce_receipt_sequences` table and server-only security posture;
9. new per-Business projection-admission table, disabled by default with nullable admission watermark;
10. service-role-only admission read/activation boundary used by every claim/projector path; no worker activation in this slice;
11. canonical appointment-ledger-truth read helper implementing the exact supported-set/hold rule;
12. appointment-cache reconcile RPC;
13. invoice-settlement reconcile RPC, including NULL-appointment NOT_REQUIRED and void-invoice hold;
14. CRM-mirror reconcile RPC;
15. receipt reconcile RPC whose COMPLETE predicate does not require invoice linkage;
16. private canonical #133 attempt read/history RPC.

No invoice→appointment composite FK is added in this slice.

No projection row backfill, no legacy mirror backfill, no historical invoice/receipt repair and no worker activation in the migration.

Independent review must challenge whether any proposed FK/constraint would unintentionally change legacy delete semantics; if so, prefer a narrower tenant guard plus the later #153 cutover rather than silently changing legacy behavior.

## 16. Exact proposed prepared-only Slice 1 implementation allowlist

Implementation is **NOT authorized until the Product Owner explicitly approves this exact gate**. If approved, Slice 1 is limited to these 16 paths:

1. `supabase/migrations/<CLI-generated>_issue_133_payment_projection_observability.sql` — NEW; exact additive schema/functions only.
2. `lib/commerce/payment-projections/types.ts` — NEW.
3. `lib/commerce/payment-projections/kernel.ts` — NEW; server-only projector/admission wrappers, no worker loop.
4. `lib/commerce/payment-projections/index.ts` — NEW.
5. `lib/commerce/payment-observability/types.ts` — NEW.
6. `lib/commerce/payment-observability/reader.ts` — NEW.
7. `lib/commerce/payment-observability/index.ts` — NEW.
8. `tests/unit/commerce/payment-projection-kernel.test.ts` — NEW.
9. `tests/unit/commerce/payment-projection-admission.test.ts` — NEW.
10. `tests/unit/commerce/payment-observability-reader.test.ts` — NEW.
11. `tests/unit/migrations/issue133-payment-projection-observability.test.ts` — NEW.
12. `tests/postgres/issue-133-payment-projection-observability-contract.sql` — NEW.
13. `scripts/verify-issue133-payment-projection-postgres.mjs` — NEW human-owned disposable-local verifier.
14. `docs/reviews/issue-133-projection-observability-implementation.md` — NEW consolidated implementation/proof report.
15. `docs/CHANGELOG.md` — bounded factual entry only.
16. `docs/reviews/issue-133-projection-observability-contract.md` — status/hash/proof reconciliation only if implementation evidence requires factual restamping; no architectural expansion.

Explicitly **not allowlisted in Slice 1**: `lib/actions/reports.ts`, `lib/crm/service.ts`, current booking/reception UI/actions, communications, workers/jobs, #153 grants/RLS/default ACL, existing provider/refund writers, Foundation/R1a/Attribution/Issue #158 migrations, Production release files, or tenant-specific code.

Slice 1 = additive schema + admission boundary + four projectors + canonical #133 reader + offline/local database proofs. There is **no worker**, no live admission, no Reporting runtime re-source, no CRM/operator wiring, no hosted migration application, and no historical processing.

Slice 2 remains the immediate separately reviewed follow-on before any real-Business activation: one canonical financial aggregate, Reporting re-source, CRM/operator read integration and user-facing disclosure/wiring as required.

## 17. Required local proof matrix before any connected Staging gate

Disposable-local PostgreSQL proof must include actual roles/grants and at minimum:

### Projection identity/concurrency

- two workers race same appointment-cache obligation → one target truth, one COMPLETE obligation;
- two workers race invoice creation → one invoice for appointment, one atomic invoice number, no duplicate lines;
- two workers race same CRM mirror → one transaction-linked event;
- two workers race receipt → one receipt for transaction, one atomic receipt number;
- replay COMPLETE performs no target mutation and returns same target identity;
- older COMPLETE appointment/invoice obligation remains COMPLETE after a later legitimate payment; once the later attempt is projected, COMPLETE replay verifies the current aggregate without rewriting or reopening the older obligation;
- an accepted attempt with NULL appointment leaves `appointment_cache` and `invoice_settlement` NOT_REQUIRED while CRM mirror and receipt can COMPLETE;
- an attempt before the Business admission watermark is refused with zero target mutation;
- an attempt whose immutable `created_at` equals the watermark exactly is excluded by the strict `>` predicate;
- first-time invoice-sequence allocation raced by two projectors with no existing sequence row yields one sequence row and one allocated number; repeat equivalently for first-time receipt-sequence allocation.

### Financial recomputation

- two distinct equal-value canonical payments on one appointment are both counted once;
- old obligation replay after a later payment recomputes full ledger aggregate and does not overwrite the later payment;
- zero-value/tax stored appointment terms remain exact;
- transaction currency mismatch holds projection rather than converting currency;
- refund/void/adjustment evidence, refunded original status, unsupported provider/kind, or second currency holds `PROJECTION_UNCERTAIN` in this slice rather than guessing;
- a void existing invoice holds and does not create a replacement;
- receipt can COMPLETE with transaction `invoice_id`/receipt `invoice_id` still NULL.

### Partial failure/recovery

- forced appointment target failure leaves ledger unchanged and obligation FAILED;
- invoice creation/line/sequence failure rolls back target atomically and leaves recoverable obligation state;
- CRM target conflict becomes PROJECTION_UNCERTAIN, not duplicate mirror;
- receipt sequence/document failure creates no duplicate document;
- lost response after projection commit recovers same obligation/target without duplicate effect;
- failure in one projection does not mark another projection COMPLETE.

### #133 reader

- exact REQUESTED / FAILED / SKIPPED / ACCEPTED states;
- zero-ledger terminal NOT_RECORDED;
- coherent REQUESTED zero-ledger attempt PAYMENT_RECOVERY_REQUIRED both before and after appointment binding;
- ACCEPTED + one ledger + pending obligation = RECORDED_BUT_NOT_FULLY_SYNCHRONIZED;
- all four complete = RECORDED;
- malformed/multiple ledger or obligation contradiction = UNKNOWN;
- revoked actor and foreign tenant expose no existence oracle;
- history cursor deterministic and PII-free.

### Safety

- no browser role can execute new mutation/projector RPCs;
- service-role function still verifies tenant relationships;
- accepted Foundation/R1a/Attribution/Issue #158 source hashes preserved;
- verifier refuses non-owned/non-local PostgreSQL;
- cleanup/evidence retention proven.

## 18. Connected Staging gate — later, separately approved

Only after projection implementation and local proof are independently accepted:

1. fresh read-only Staging preflight;
2. prove exact existing schema/data compatibility and zero collisions;
3. explicit Product Owner approval of exact migration/application candidate;
4. apply exact reviewed migrations once to governed Staging only;
5. create a **new synthetic Business/cohort only**; do not process retained 90-row/CAD181 obligations/cohorts;
6. initialize that synthetic Business projection-admission row disabled, then in the separately authorized run set its watermark immediately before creating the new canonical cohort; prove pre-watermark attempts are rejected by direct RPC and any claim query;
7. keep communications/providers off;
8. run fault/concurrency recovery matrix;
9. prove exact attempt→ledger→appointment cache→invoice→CRM mirror→receipt convergence;
10. prove #133/operator/Summer read truth;
11. only then approach writer inventory/#153 and operator UI/wiring gates.

No local proof authorizes this Staging step automatically.

## 19. GVM operational acceptance remains later

GVM technician resumption still requires the complete connected chain:

booking intent → one appointment → one canonical attempt → zero/one ledger → deterministic appointment cache → invoice → receipt → CRM/reporting truth → communications → operator disclosure/recovery,

plus supported-surface writer convergence, #153 permission cutover, responsive Staging acceptance, separately approved Production release, and controlled real GVM verification.

Issue #133/#134 merge status alone never earns GVM Operational Acceptance.

## 20. Decisions requiring independent challenge before Product Owner implementation gate

Claude/Grok review must explicitly challenge:

1. whether the corrected one-invoice-per-appointment v1 invariant plus explicit void/reissue hold is safe enough for launch;
2. whether receipt transaction uniqueness plus Business-scoped receipt sequence/advisory allocation is the minimum safe numbering contract;
3. whether the explicit receipt/CRM composite `ON DELETE CASCADE` rules preserve legacy semantics and the decision to omit invoice→appointment composite FK is correct;
4. whether the refund/void/adjustment hold is the correct launch boundary;
5. whether #133's current attempt schema is sufficient for non-booking requested-mode observability;
6. whether the two-slice boundary (projector/read foundation first, Reporting/CRM/operator re-source second) is safe with admission disabled by default;
7. whether the corrected projection/advisory lock order and real-Business legacy-writer exclusion close the phantom/race risks without a reverse edge;
8. whether COMPLETE verification, FAILED vs PROJECTION_UNCERTAIN classification, and unbound NOT_REQUIRED behavior are sufficiently deterministic;
9. whether the disabled-by-default nullable watermark mechanically excludes retained Staging cohorts and is safer than an infinity sentinel;
10. whether the supported manual-ledger predicate and one canonical Reporting aggregate avoid a second financial truth;
11. whether any schema hardening is still missing that would be expensive to retrofit after activation.

Until that review is complete, this document is a design proposal, not an implementation authorization.
