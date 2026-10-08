# Issue #133 / #134 — Canonical Projection + Financial Observability Contract

**Date:** 2026-10-08  
**Status:** DESIGN PREPARATION / NOT AUTHORIZED TO IMPLEMENT  
**Technical baseline:** `ff063bab8acbfb996c75fa8d7fa79ef2e838f303`  
**Local-proof status:** `LOCAL_DATABASE_PROOF_6_ACCEPTED`  
**Current documentation head at preparation:** `eb43aef1bb7774c1837d59ff8f02771a54d2e371`  
**Issue #158 migration:** `01b10f8c629cc73b08d6c5849160836b90cbc87beb29d7c8b78857375fe2493b` / 83,565 bytes / NOT APPLIED TO HOSTED ENVIRONMENTS  
**Parent product issues:** #133 financial observability, #134 idempotency/reconciliation, #153 permission cutover  

This contract defines the next Chasum financial-integrity layer after the independently accepted Issue #158 local database proof. It is intentionally **design-only**. It does not authorize a migration, code implementation, Staging application, worker activation, UI wiring, communication delivery, Production change, GVM test booking, or technician payment/deposit resumption.

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
- `NOT_REQUIRED` — only where the contract explicitly says no target should exist. For the accepted booking-payment path, all four current obligations are required and begin PENDING.

No failed/unknown projection allows recollection, a new payment attempt, or a second appointment.

## 5. Projection worker security and transaction boundary

The first projection implementation must remain server-only and service-role-only.

Every projection RPC/function must:

1. require literal `service_role`;
2. accept exact `business_id` + `attempt_id` only (plus no browser-controlled customer/amount/target identity);
3. lock the matching reconciliation obligation first;
4. require obligation kind to match the called projector;
5. accept only `PENDING` or `FAILED` as retryable input; replay of `COMPLETE/NOT_REQUIRED` returns the recorded result without target mutation;
6. load and lock the attempt;
7. prove `execution_state='ACCEPTED'` and exact one linked ledger row;
8. prove Business/customer/appointment/amount/currency/method/kind/provider identity agrees between attempt and ledger;
9. load required target rows in documented deterministic order;
10. perform one idempotent target reconciliation;
11. transition the obligation by compare-and-set and append one `PROJECTION_CHANGED` event in the same transaction;
12. never call a provider, email/SMS service, external API, or non-transactional network operation inside the database transaction.

Lock order for the new projector layer:

**obligation → attempt → ledger → appointment → invoice/sequence or receipt/sequence or CRM target.**

No projector may obtain an attempt lock after locking its target.

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

The projector reads all same-Business ledger movements linked to the appointment, not just the triggering attempt, so later legitimate payments cannot be overwritten by replaying an older obligation.

For the first slice, automatic reconciliation proceeds only when financial history is unambiguous and supported. It must hold `PROJECTION_UNCERTAIN` when it encounters refund/void/adjustment evidence or a currency/identity contradiction that the current bounded contract cannot safely interpret.

For supported positive manual movements, gross paid is derived from canonical ledger rows once per distinct transaction identity. The triggering accepted attempt must be present exactly once.

The projector writes the fully recomputed totals/status, never `existing + delta`.

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

More than one existing invoice, mismatched customer/Business, unverifiable line identity, or conflicting financial totals is `PROJECTION_UNCERTAIN`; do not choose one and do not create a replacement.

### Invoice creation

When no invoice exists, create invoice + initial line(s) atomically from stored appointment terms. Do not seed paid amount from stale appointment cache; compute settlement from canonical ledger truth in the same projector transaction.

Invoice number allocation must use the existing `commerce_invoice_sequences` row under a database/advisory lock and update/return the number atomically. Do not reuse the current application read-then-update allocator as the canonical concurrency contract.

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

Receipt document creation is required; receipt email/SMS delivery is **not** part of this projection. `email_status` remains `not_sent` and communications remain separately gated.

## 10. Required transaction same-Business key

To support DB-enforced same-Business projection references, add a tenant key on canonical transactions:

- unique `(id, business_id)` on `commerce_transactions`.

This does not change transaction identity; the existing global UUID PK remains authoritative. It only permits composite tenant FKs for canonical mirrors/documents.

The implementation preflight must check collisions/duplicates and exact deployed object names before authoring/applying anything.

## 11. Obligation state/event contract

For each projection retry:

1. lock exact obligation;
2. if COMPLETE/NOT_REQUIRED, re-read/verify target and return replay result without write;
3. if PENDING/FAILED, execute deterministic projection;
4. on success set:
   - `state='COMPLETE'`;
   - `failure_code=NULL`;
   - `updated_at=now()`;
   - `completed_at=now()`;
5. append `PROJECTION_CHANGED` event with projection kind + COMPLETE;
6. on a definitely rolled-back/recoverable target error, set FAILED/PROJECTION_FAILED and append matching event;
7. on contradictory/ambiguous target evidence, set FAILED/PROJECTION_UNCERTAIN and append matching event;
8. transport loss after a database commit is recovered by re-reading the **same obligation**; never create another obligation or payment attempt.

No projector may set all obligations complete as a batch. Each target earns its own COMPLETE state.

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
- `PAYMENT_RECOVERY_REQUIRED` — appointment exists, same attempt is REQUESTED, zero ledger, and same-identity recovery is required;
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

- financial totals/revenue/payment counts must be sourced from canonical `commerce_transactions` under explicit status/kind/currency rules, or from a canonical #133 server query built on that ledger;
- `customer_payment_events` may remain a CRM timeline projection only;
- a missing CRM mirror may surface synchronization failure but may never erase recorded money from financial reporting;
- customer account disagreement remains visible/fail-closed rather than using `Math.max` or another masking heuristic.

Summer must use the same canonical reader/query as Reporting/operator recovery, not the mirror.

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

## 15. Proposed prepared-only schema delta

Exact names remain subject to independent design review, but the implementation gate should stay bounded to the following additive intent:

1. unique tenant key `(id, business_id)` on `commerce_transactions` for projection FKs;
2. unique appointment invoice identity `(business_id, appointment_id)` for non-null appointment;
3. unique receipt identity `(business_id, transaction_id)`;
4. same-Business receipt→transaction composite integrity using the transaction tenant key, preserving compatible delete semantics;
5. nullable `customer_payment_events.transaction_id`;
6. unique canonical CRM mirror `(business_id, transaction_id)` where non-null;
7. same-Business CRM mirror→transaction composite integrity;
8. new `commerce_receipt_sequences` table and server-only security posture;
9. canonical appointment-ledger-truth read helper;
10. appointment-cache reconcile RPC;
11. invoice-settlement reconcile RPC;
12. CRM-mirror reconcile RPC;
13. receipt reconcile RPC;
14. private canonical #133 attempt read/history RPC.

No projection row backfill, no legacy mirror backfill, no historical invoice/receipt repair and no worker activation in the migration.

Independent review must challenge whether any proposed FK/constraint would unintentionally change legacy delete semantics; if so, prefer a narrower tenant guard plus the later #153 cutover rather than silently changing legacy behavior.

## 16. Proposed prepared-only implementation allowlist

No implementation is authorized yet. If independently accepted, the next Product Owner implementation gate should be limited to an exact allowlist similar to:

1. `supabase/migrations/<CLI-generated>_issue_133_payment_projection_observability.sql` — NEW;
2. `lib/commerce/payment-projections/types.ts` — NEW;
3. `lib/commerce/payment-projections/kernel.ts` — NEW;
4. `lib/commerce/payment-projections/index.ts` — NEW;
5. `lib/commerce/payment-observability/types.ts` — NEW;
6. `lib/commerce/payment-observability/reader.ts` — NEW;
7. `lib/commerce/payment-observability/index.ts` — NEW;
8. `lib/actions/reports.ts` — tests/design only initially; runtime re-source requires explicit implementation gate confirmation;
9. `lib/crm/service.ts` — adapter/read-model only if required by exact reviewed scope;
10. `tests/unit/commerce/payment-projection-kernel.test.ts` — NEW;
11. `tests/unit/commerce/payment-observability-reader.test.ts` — NEW;
12. `tests/unit/migrations/issue133-payment-projection-observability.test.ts` — NEW;
13. `tests/postgres/issue-133-payment-projection-observability-contract.sql` — NEW;
14. `scripts/verify-issue133-payment-projection-postgres.mjs` — NEW human-owned disposable-local verifier;
15. `docs/reviews/issue-133-projection-observability-implementation.md` — NEW;
16. `docs/CHANGELOG.md`.

Before implementation approval, independent review must decide whether report/CRM runtime re-source belongs in this same slice or in the immediately following operator/read-integration slice. Default preference: **schema + projector + canonical reader first; re-source/wiring second**, to keep the financial write/projection candidate bounded and independently provable.

## 17. Required local proof matrix before any connected Staging gate

Disposable-local PostgreSQL proof must include actual roles/grants and at minimum:

### Projection identity/concurrency

- two workers race same appointment-cache obligation → one target truth, one COMPLETE obligation;
- two workers race invoice creation → one invoice for appointment, one atomic invoice number, no duplicate lines;
- two workers race same CRM mirror → one transaction-linked event;
- two workers race receipt → one receipt for transaction, one atomic receipt number;
- replay COMPLETE performs no target mutation and returns same target identity.

### Financial recomputation

- two distinct equal-value canonical payments on one appointment are both counted once;
- old obligation replay after a later payment recomputes full ledger aggregate and does not overwrite the later payment;
- zero-value/tax stored appointment terms remain exact;
- transaction currency mismatch holds projection rather than converting currency;
- refund/void/adjustment evidence holds `PROJECTION_UNCERTAIN` in this slice rather than guessing.

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
- REQUESTED bound appointment PAYMENT_RECOVERY_REQUIRED;
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
5. create **new synthetic cohort only**; do not process retained 90-row/CAD181 obligations/cohorts;
6. keep communications/providers off;
7. run fault/concurrency recovery matrix;
8. prove exact attempt→ledger→appointment cache→invoice→CRM mirror→receipt convergence;
9. prove #133/operator/Summer read truth;
10. only then approach writer inventory/#153 and operator UI/wiring gates.

No local proof authorizes this Staging step automatically.

## 19. GVM operational acceptance remains later

GVM technician resumption still requires the complete connected chain:

booking intent → one appointment → one canonical attempt → zero/one ledger → deterministic appointment cache → invoice → receipt → CRM/reporting truth → communications → operator disclosure/recovery,

plus supported-surface writer convergence, #153 permission cutover, responsive Staging acceptance, separately approved Production release, and controlled real GVM verification.

Issue #133/#134 merge status alone never earns GVM Operational Acceptance.

## 20. Decisions requiring independent challenge before Product Owner implementation gate

Claude/Grok review must explicitly challenge:

1. whether one-invoice-per-appointment is the correct v1 durable invariant;
2. whether receipt transaction uniqueness plus a new receipt-sequence table is the minimum safe numbering contract;
3. whether composite same-Business FKs can preserve existing delete semantics or should be narrowed to service-role guards until #153;
4. whether refund evidence should hold all affected projections in v1 or whether a safe bounded ledger-only refund interpretation can already be proven;
5. whether #133's current attempt schema is sufficient for non-booking requested-mode observability;
6. whether Reporting re-source belongs in the projector implementation slice or the immediate follow-on read/wiring slice;
7. whether projection lock order introduces any reverse edge with current invoice/receipt/legacy writers;
8. whether obligation FAILED vs PROJECTION_UNCERTAIN classification is sufficiently deterministic;
9. whether retained Staging cohorts can be mechanically excluded before any worker activation;
10. whether any schema hardening is missing that would be expensive to retrofit after activation.

Until that review is complete, this document is a design proposal, not an implementation authorization.
