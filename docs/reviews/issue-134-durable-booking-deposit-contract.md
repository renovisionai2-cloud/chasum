# Issue #134 — durable fresh-booking operation and canonical manual-deposit handoff

**Status:** IMPLEMENTATION-READY DESIGN / PREPARED-ONLY IMPLEMENTATION NOT YET AUTHORIZED.
**Design baseline:** `0b3f071511e14a7c77541e80f039862fc71f924a`.
**Applied Staging baseline:** attribution migration `20261007170242 / issue_134_appointment_financial_attribution`.
**Competitive gate:** [bounded official-source gate](issue-134-booking-deposit-competitive-gate.md) complete for contract preparation; product/UX acceptance remains NOT RUN.
**Scope:** authenticated Booking Sheet and Quick Appointment creation with one optional manual tender.

This contract settles the next implementation package.
It does not authorize code, SQL, migration generation, local PostgreSQL execution, Staging application, activation, deployment, permissions changes, Production, GVM activity, or technician resumption.
Foundation, R1a, C01, Run02, attribution proof, and retained evidence remain closed and immutable.

## 1. Evidence classifications
### Source-confirmed facts
- Both target surfaces call `createAppointment()` today (`components/booking-sheet/booking-sheet.tsx:173-186,922-937`; `components/reception/quick-appointment.tsx:223-224,987-1001`).
- `createAppointment()` creates the appointment before it calls the legacy payment writer (`lib/actions/appointments.ts:346-478,529-650`).
- The current browser references are `bs-*` / `qb-*` strings, not canonical UUIDs (`components/booking-sheet/booking-sheet.tsx:351-361`; `components/reception/quick-appointment.tsx:202-210`).
- `recordPreparedManualPaymentAttempt()` has no application caller and new admission is hard-disabled (`lib/commerce/payment-attempts/kernel.ts:274-356`).
- Foundation already supplies `commerce_payment_attempts.booking_operation_id`, its lookup index, immutable request coverage, and one-time NULL→appointment binding (`supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql:24-96,170-193`).
- Existing R1a normalization accepts only customer or existing-appointment targets (`lib/commerce/payment-attempts/normalize.ts:113-157`).
- Existing `commit_manual_payment_attempt_v1` rejects every non-NULL `booking_operation_id`; it cannot safely commit this flow unchanged (`supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql:255-315`).
- Existing booking validation owns staff/location/service/hours/no-overlap policy (`lib/booking-engine/availability/query.ts:109-174,176-458`).
- The accepted payment commit creates one ledger, one ACCEPTED event, and four PENDING obligations atomically (`supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql:451-531`).
- The Staging application proved schema identity and preservation, not this connected workflow (`docs/reviews/issue-134-staging-attribution-application-result.md:20-47`).

### Proposed decisions locked by this contract
Everything in sections 2–16 is the implementation contract unless explicitly marked deferred.

### Execution results
No implementation, test, SQL, database, browser, provider, or environment execution occurred; all future results remain UNKNOWN.

## 2. Product boundary and measurable target
The first connected product target is one authenticated new appointment plus zero or one manually recorded tender.
Booking Sheet maps to literal source `booking_sheet`.
Quick Appointment maps to literal source `quick_appointment`.
The source is selected by a dedicated server entry point, never accepted from browser form data.

Parity floor:
- retain one coherent customer/service/staff/location/time/payment confirmation;
- permit explicit no payment, configured deposit, full payment, and the existing custom amount mode;
- make currency, amount, method, appointment identity, and money outcome visible;
- recover a lost response without another appointment or tender;
- never represent a configured deposit as received money.

Deliberate Chasum advantage to prove:
- one durable booking-operation identity spans appointment creation and the intended payment;
- raw money truth and downstream synchronization truth remain visibly separate;
- recovery never requires a developer to infer whether recollection is safe.

First connected activation is not allowed until the competitive gate's responsive and operator-state outcomes pass at 390×844, 768×1024, 1280×800, and 1440×900.
Official competitor documentation is a workflow benchmark only.
No competitor backend, idempotency, concurrency, or accessibility behavior is inferred.

## 3. Supported and explicitly unsupported paths
### Supported by this contract
- authenticated Booking Sheet create;
- authenticated Quick Appointment create;
- selected existing customer;
- inline customer creation followed by booking;
- named employee under current default configuration;
- unassigned employee only when the existing optional-staff flag and schema permit it;
- existing location, service, hours, duration, room/resource, package, pricing, tax, status, and overlap rules;
- manual `cash`, `e_transfer`, `debit_card`, `credit_card`, and `other`;
- modes `none`, `deposit`, `full`, and positive bounded `custom`;
- CAD and every currency already accepted by `BUSINESS_CURRENCIES`, with Business currency authoritative.

### Explicitly outside the first connected activation
- public booking, Summer booking, API booking, duplicate appointment, recurring booking, and multi-service bundles;
- gift card, store credit, Stripe/provider charge, pending card confirmation, webhook finalization, refunds, voids, or reversals;
- existing-appointment Collect payment, Customer Billing, Payments Dashboard, and other legacy writers;
- communication delivery, receipt email, customer/business email, SMS, webhook, calendar, or worker activation;
- customer merge, financial transfer, historical repair, retained-obligation processing, and permission cutover.

Unsupported modes fail before canonical admission.
Once an operation or attempt is admitted, no error may fall through to `recordCommercePayment()`.
Legacy paths remain unchanged until their own replacement gate; this first slice is not full pilot readiness.

## 4. Customer resolution and booking-engine ownership
Every request starts by resolving the current user and current Business on the server.
Browser-supplied Business, actor, source, currency, price, tax, and deposit values are advisory only and never authoritative.
Before any mutating request, the authenticated server allocates and returns three opaque UUIDs: operation, attempt, and inline-customer candidate.
The browser persists only those opaque references; the candidate is not customer PII and is unused for an existing-customer request.

For an existing customer:
- require exactly one `(customer_id, business_id)` match;
- persist that customer identity in the operation;
- reject missing, foreign-Business, deleted, or inaccessible customers before admission.

For an inline customer:
- validate name and normalized email using the existing customer rules;
- derive advisory identities from `(business_id, lower(trim(email)))` and every 7-or-more-digit suffix of the normalized phone;
- hash, sort, and acquire those transaction advisory locks in ascending order, then acquire the operation advisory lock;
- after both lock classes are held, load the operation before running any customer-match logic;
- if it exists, compare stored input columns plus joined attempt columns and return its stored customer/attempt; never return match-required for its own replay;
- search tenant-scoped case-insensitive email and normalized phone matches;
- return `CUSTOMER_MATCH_REQUIRES_SELECTION` without creating customer/operation/attempt when a match exists;
- otherwise insert the customer at the preallocated inline-customer UUID, then operation/attempt/events in one database transaction;
- same-operation replay returns the same customer and never inserts another;
- same-input independent canonical operations serialize on at least one shared email/phone advisory identity; the loser observes the committed customer and returns match-required with no writes;
- a customer unique violation rolls back the bootstrap unit and returns match-required only after a tenant-scoped exact re-read; it is never blindly retried.

The existing `quickCreateCustomer()` helper does not take these advisory locks.
The prepared slice does not change or claim to fix that global CRM race.
Before target-surface activation, Booking Sheet and Quick Appointment inline creation must stop calling that helper and use bootstrap exclusively.
Other customer-creation surfaces remain outside this contract; this is not a global customer-identity redesign.

The operation RPC does not duplicate availability logic.
Before bootstrap, the server calls the existing booking validator.
Immediately before durable persistence, `createBooking()` runs its normal validation again, including current named/unassigned staff, service/location, hours, duration, room, resource, status, pricing, and tax behavior.
That validation is a check, not a transaction lock.

The prepared implementation adds an explicit `durable_operation` persistence strategy.
Only the already-authorized server kernel can construct it after `requireUser()` and `requireBusiness()`.
After validation, it uses the service client to call `persist_booking_operation_appointment_v1`; the browser and authenticated role cannot execute that function.
The original appointment INSERT contains the non-NULL `booking_operation_id`.
The durable branch persists the exact validated subtotal, tax, and deposit values, including zero, and the exact operation ID.
It must not enter the current compatibility fallback that drops commercial columns, and no fallback may strip operation identity.
Session/public callers with no operation identity keep their current strategy and fallback unchanged.

Named/unassigned employee behavior remains controlled by `assertNamedStaffRequired()` and `OPTIONAL_STAFF_PERSISTENCE_ENABLED` (`lib/booking/optional-staff.ts:1-45`).
Existing staff eligibility and location/service relationships remain authoritative (`lib/booking/eligible-staff.ts:1-52`).
Named-staff overlap remains protected by the existing GiST exclusion.
Unassigned overlap and room checks remain the existing soft checks; this slice does not claim they lock the interval.
Regardless of optional staff, the unique appointment-operation index makes a same-operation second INSERT fail and recover the first row.

## 5. Durable identities and browser recovery
Each draft receives one canonical `operationId` UUID through `crypto.randomUUID()` before the first mutating request.
The same draft receives one distinct canonical `attemptKey` UUID.
Inline mode also receives one stable `inlineCustomerId` candidate UUID before normalization.
The browser persists only those opaque UUIDs in session-backed application storage.
It stores no name, contact detail, amount, method, notes, appointment data, or financial outcome.

The operation and attempt are persisted before appointment insertion.
Loss of the bootstrap response is recovered using the same operation UUID; neither UUID is regenerated.

Same-user refresh:
- reload reads the opaque UUID;
- a server action reauthorizes current user and Business;
- canonical recovery returns the existing operation/attempt/appointment/ledger state.

Cross-device recovery:
- the server exposes cursor-paginated authorized operation history for the current `(business_id, actor_id)`;
- unresolved operations are first, followed by recent appointment-created operations including SKIPPED no-payment and fully recorded results;
- older operations remain retrievable by exact UUID and pagination; age never changes financial semantics;
- the browser receives operation UUID, created timestamp, source, appointment reference if present, and derived operator state only;
- customer PII, payment note, and raw canonical payload are omitted;
- selecting an item performs a fresh authorized lookup.

First-slice private read entrypoints are implemented in `lib/commerce/booking-operations/kernel.ts` and exported server-only from its existing `index.ts`:

- `readBookingOperationCanonical(operationId: string): Promise<BookingOperationReadResult>`;
- `listBookingOperationHistory(input?: { cursor?: BookingOperationHistoryCursor; limit?: number }): Promise<BookingOperationHistoryPage>`.

Neither accepts actor or Business from its caller.
Each calls `requireUser()` and `requireBusiness()`, validates canonical input, then uses the existing service client to invoke the private read-only `read_booking_operations_v1` RPC with exact `business_id` and `actor_id`.
Revoked access returns `NOT_AUTHORIZED` before canonical data and exposes no existence distinction.

`readBookingOperationCanonical` uses one RPC statement rooted at the operation and aggregates its unique operation-tagged appointment, unique attempt, ordered events, ledger, and four obligations without PostgREST child-row pagination.
Its discriminated result is `FOUND | ABSENT | UNKNOWN`.
FOUND returns internal IDs/tuples, lifecycle, attempt/events, exact ledger count and tuple, obligations, derived operator state, synchronization, recovery action, and `consistency: SINGLE_STATEMENT_READ_COMMITTED`.
Contradictory identities/counts, truncated required relations, or query errors return UNKNOWN; no partial result is classified.
ABSENT means only “not visible to this completed read.”
It never proves that a concurrent transaction cannot commit and never authorizes a new identity; recovery retries only the same operation through an advisory-locking RPC.

`listBookingOperationHistory` accepts an opaque `(attention_rank,created_at,id)` cursor and limit 1–50.
It returns `PAGE | UNKNOWN`, deterministic next cursor, and bounded canonical summaries derived by the same one-statement RPC; SQL computes attention rank before pagination.
Each summary contains only operation/appointment references, source, timestamps, lifecycle, amount/currency/method, operator state, recorded/synchronization state, and recovery action.
It returns no customer/actor identity, inline input, notes, hashes, provider payload, or other PII.
An in-flight invisible row may be absent from a page; exact same-operation recovery remains authoritative.

Every lookup and mutation requires current user, current Business, actor equality, and tenant equality.
A user whose access is revoked receives one generic authorization failure and no existence oracle.
Possession of an operation UUID grants nothing.
Supervisor takeover is deferred and cannot be simulated by changing actor identity.

Two tabs or surfaces using the same operation UUID converge on one operation.
Different operation UUIDs are different booking intentions even when every visible value is equal.
Reusing one UUID with changed canonical fields returns `KEY_CONFLICT`.

“Book another” must rotate operation and attempt UUIDs plus any inline-customer candidate before enabling the next submit.
A corrected tuple uses a new identity only after the old operation is durably CLOSED with no appointment and no ledger.
An ambiguous request never rotates either identity.

Operations have no age-based financial expiry.
Age may change display priority, but never authorizes recollection or a new key.
Operation request fields are immutable and retained with their attempt/ledger history; only the fenced lifecycle fields transition.
Any future retention policy is separately governed and cannot delete referenced evidence.

## 6. Canonical request and fingerprint
The authenticated server normalizer constructs customer-input, booking, and payment UTF-8 JSON tuples with fixed field order after all stable UUIDs exist.
For inline mode, the preallocated customer candidate is the resolved customer UUID used in both booking and payment tuples.
The bootstrap RPC recomputes all three digests from normalized arguments using the same exact no-whitespace JSON bytes and rejects any supplied mismatch.
Database-recomputed values are stored.
Cross-language vectors must prove byte identity with `JSON.stringify()` and `normalizePaymentIntentV1()`.
Replay compares every stored request column and joined attempt column; matching hashes alone never establish equality.

Customer-input tuple v1:
1. literal `chasum.booking-customer-input`;
2. integer version `1`;
3. mode `existing|inline`;
4. existing or preallocated customer UUID;
5. normalized inline name or NULL;
6. lowercase trimmed inline email or NULL;
7. normalized phone digits or NULL.

Booking tuple v1:
1. literal `chasum.booking-operation`;
2. integer version `1`;
3. Business UUID;
4. resolved customer UUID;
5. location UUID;
6. service UUID;
7. staff UUID or NULL;
8. requested start ISO timestamptz;
9. requested end ISO timestamptz;
10. requested appointment status;
11. duration minutes;
12. room UUID or NULL;
13. ordered resource UUID array;
14. package UUID or NULL;
15. package name or NULL;
16. server subtotal cents;
17. server tax cents;
18. server required-deposit cents;
19. payment mode `none|deposit|full|custom`;
20. normalized appointment notes or NULL;
21. normalized payment note or NULL;
22. receipt-requested boolean.

Payment tuple remains existing v1:
- Business and resolved customer;
- target `booking_operation`;
- target ID = operation UUID;
- integer amount cents;
- Business currency normalized lowercase;
- method or NULL;
- payment kind `payment|deposit|none`;
- provider route `manual` or NULL;
- instrument ID NULL.

Source and actor remain immutable attribution but stay excluded from the payment fingerprint, matching accepted R1a.
They are included in operation replay comparison.

Server-authoritative amount rules:
- `none`: amount 0, method NULL, provider NULL, kind `none`;
- `deposit`: exact current server-calculated deposit due now, positive and no more than total;
- `full`: exact current server appointment total, positive;
- `custom`: integer cents greater than zero and no more than current appointment total;
- custom kind uses existing `paymentKindForAmount()` classification;
- currency always comes from the current Business;
- manual debit/credit means an operator records POS tender; no card is charged or verified.

Immediately before appointment insertion, service/location/staff eligibility and server price/tax/deposit are recomputed.
Any difference from the admitted booking tuple invokes fenced close with `PRICING_CHANGED` or the existing conflict reason before appointment insertion.
It never silently rewrites the admitted amount.
The operator may review new values and start a new operation only after close is durably confirmed.

A legitimate second equal-value payment always has a new attempt key.
After the booking operation is complete, it uses the future existing-appointment `collect_payment` path, not the original booking operation.

## 7. New durable registry and exact database contract
One new table is justified because attempts identify financial intent but cannot idempotently identify or recover an appointment/customer creation operation.
The registry owns booking request identity only.
It contains a minimal booking lifecycle fence, but no payment execution, ledger, synchronization, or communication truth.
Those remain exclusively in attempts, events, ledger, obligations, and send-intent records.

New table: `public.commerce_booking_operations`.

Required columns:
- `id uuid`;
- `business_id uuid`;
- `actor_id uuid`;
- `source text`;
- `booking_fingerprint text`;
- `customer_input_fingerprint text`;
- `customer_origin text`;
- `customer_id uuid`;
- `inline_name text NULL`;
- `inline_email text NULL`;
- `inline_phone_digits text NULL`;
- `location_id uuid`;
- `service_id uuid`;
- `staff_id uuid`;
- `requested_start timestamptz`;
- `requested_end timestamptz`;
- `requested_status text`;
- `duration_minutes integer`;
- `room_id uuid`;
- `resource_ids uuid[]`;
- `package_id uuid`;
- `package_name text`;
- `subtotal_cents integer`;
- `tax_cents integer`;
- `deposit_required_cents integer`;
- `payment_mode text`;
- `appointment_notes text`;
- `payment_note text`;
- `receipt_requested boolean`;
- `lifecycle_state text` constrained to `OPEN|APPOINTMENT_CREATED|CLOSED`;
- `close_reason text NULL`;
- `replacement_customer_id uuid NULL`;
- `closed_at timestamptz NULL`;
- `created_at timestamptz`;
- `updated_at timestamptz`.

`lifecycle_state` answers only whether this booking request may still create/bind an appointment.
It never asserts whether money is recorded.
`OPEN→APPOINTMENT_CREATED`, `OPEN→CLOSED`, and `APPOINTMENT_CREATED→CLOSED` are the only transitions; CLOSED never reopens.
While CLOSED, the close RPC may advance `replacement_customer_id`, `close_reason`, and `updated_at` for another authorized no-ledger correction or cancellation; request columns and the original attempt remain immutable.
Payment state is always derived from the attempt/events/ledger/obligations.

Named constraints:
- `commerce_booking_operations_pkey` on `id`;
- `commerce_booking_operations_id_business_key` on `(id,business_id)`;
- `commerce_booking_operations_business_fk`, `ON DELETE RESTRICT`;
- `commerce_booking_operations_customer_fk` on `(customer_id,business_id)`, `ON DELETE RESTRICT`;
- `commerce_booking_operations_request_check` covering source, fingerprints, origin, mode, cents, finite timestamps, duration, and resource-array shape;
- `commerce_booking_operations_lifecycle_check` covering allowed state, close reason/timestamp pairing, and monotonic timestamps;
- `appointments_booking_operation_fk` on `(booking_operation_id,business_id)` to `(id,business_id)`, `ON DELETE RESTRICT`;
- `commerce_payment_attempts_booking_operation_fk` on `(booking_operation_id,business_id)` to `(id,business_id)`, `ON DELETE RESTRICT`.

New existing-table column:
- `public.appointments.booking_operation_id uuid NULL`.

New indexes:
- `commerce_booking_operations_actor_recovery_idx` on `(business_id,actor_id,created_at desc,id)`;
- unique partial `appointments_booking_operation_key` on `(business_id,booking_operation_id)` where non-NULL;
- unique partial `commerce_payment_attempts_booking_operation_key` on `(business_id,booking_operation_id)` where non-NULL.

The accepted foundation already has nonunique `commerce_payment_attempts_booking_idx` on the same columns/predicate.
The new unique index is required for one attempt per operation.
The old index remains deliberately in the additive first migration; its bounded write/storage redundancy is disclosed.
Dropping it requires later index-usage/size evidence and a separately governed migration, never a silent first-slice drop.

Exact new function signatures:
1. `public.guard_commerce_booking_operation_v1() returns trigger`.
2. `public.guard_appointment_booking_operation_link_v1() returns trigger`.
3. `public.bootstrap_booking_operation_v1(uuid,uuid,uuid,uuid,text,text,text,text,text,uuid,uuid,text,text,text,uuid,uuid,uuid,timestamptz,timestamptz,text,integer,uuid,uuid[],uuid,text,integer,integer,integer,text,text,text,boolean,text,integer,text,text,text) returns table(outcome text,operation_id uuid,customer_id uuid,attempt_id uuid,execution_state text,conflict_event_id uuid)`.
4. `public.persist_booking_operation_appointment_v1(uuid,uuid,uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,integer,text,uuid,uuid[],uuid,text,integer,integer,integer) returns table(outcome text,operation_id uuid,appointment_id uuid)`.
5. `public.bind_booking_operation_appointment_v1(uuid,uuid,uuid,uuid) returns table(outcome text,operation_id uuid,appointment_id uuid,attempt_id uuid)`.
6. `public.close_booking_operation_v1(uuid,uuid,uuid,text,uuid,uuid,boolean) returns table(outcome text,operation_id uuid,appointment_id uuid,attempt_id uuid,recorded boolean)`.
7. `public.commit_booking_operation_manual_payment_v1(uuid,uuid,uuid,uuid) returns table(outcome text,attempt_id uuid,transaction_id uuid,recorded boolean,synchronization text)`.
8. `public.read_booking_operations_v1(uuid,uuid,text,uuid,integer,timestamptz,uuid,integer) returns table(snapshot_at timestamptz,payload jsonb)`.

The bootstrap parameters, in order, are:
`business_id, operation_id, attempt_key, actor_id, source, booking_fingerprint, payment_fingerprint, customer_input_fingerprint, customer_origin, existing_customer_id, inline_customer_id, inline_name, inline_email, inline_phone, location_id, service_id, staff_id, requested_start, requested_end, requested_status, duration_minutes, room_id, resource_ids, package_id, package_name, subtotal_cents, tax_cents, deposit_required_cents, payment_mode, appointment_notes, payment_note, receipt_requested, payment_kind, payment_amount_cents, currency, method, provider_route`.

This exact 37-argument bootstrap signature and order is pinned; static tests must fail on drift.
The persistence function parameters follow its signature names in the same order and must equal the stored operation tuple.
Close reasons are exactly `PRICING_CHANGED|SLOT_CONFLICT|CUSTOMER_REASSIGNED|APPOINTMENT_CANCELLED|OPERATOR_ABANDONED`.
Close parameters are `business_id, operation_id, actor_id, reason, expected_current_customer_id, replacement_customer_id, cancel`.
Customer reassignment requires both customer arguments; cancellation requires both NULL and `cancel=true`; all other combinations reject.
Attempt failure mapping is `PRICING_CHANGED/OPERATOR_ABANDONED→VALIDATION/INVALID_REQUEST` and `SLOT_CONFLICT/CUSTOMER_REASSIGNED/APPOINTMENT_CANCELLED→CONFLICT/KEY_CONFLICT`.
The read RPC parameters are `business_id, actor_id, mode, operation_id, cursor_attention_rank, cursor_created_at, cursor_id, limit`; mode is exactly `one|history`, it is read-only, and history payload excludes the PII fields named in section 5.

New triggers:
- `commerce_booking_operations_guard` BEFORE UPDATE OR DELETE on the registry;
- `appointments_booking_operation_guard` BEFORE INSERT OR UPDATE OF operation/business/customer/status and admitted booking tuple fields.

Security posture:
- all eight functions are `SECURITY INVOKER`; mutation functions are PL/pgSQL and the read primitive is `LANGUAGE plpgsql STABLE` with one canonical SELECT/CTE after authorization and no mutation;
- fixed `search_path = pg_catalog, pg_temp`;
- literal `current_user = 'service_role'` requirement on all mutation functions;
- the read RPC also requires service_role and independently verifies the supplied actor's current owner/admin membership;
- EXECUTE revoked from PUBLIC, anon, and authenticated; granted only to service_role;
- registry RLS enabled, FORCE RLS off;
- no browser-role policy;
- table privileges revoked from PUBLIC/anon/authenticated;
- only minimum service-role SELECT/INSERT plus lifecycle-column UPDATE is granted on the registry;
- no request-column UPDATE or DELETE grant on the registry;
- no existing table, sequence, default-ACL, FORCE-RLS, or owner-policy widening.

Application authority is exact:
- the server action obtains actor and Business through `requireUser()` and `requireBusiness()`;
- every RPC requires `current_user='service_role'`, operation actor equality, and a current `businesses.owner_id` or owner/admin `business_members` row for that actor/Business;
- revoked membership fails before data is returned or changed;
- on INSERT with `new.booking_operation_id IS NULL`, the appointment guard returns `new` before any service-role, permission, or registry access;
- on UPDATE with both old and new operation IDs NULL, it likewise returns `new` first;
- only a branch with old or new non-NULL operation identity performs the service-role and registry checks; non-NULL→NULL and NULL→non-NULL UPDATE are rejected;
- a non-NULL operation ID is valid only in the original service-role INSERT and must match operation Business/customer;
- `booking_operation_id` and its Business are immutable after INSERT;
- bind changes only `attempt.appointment_id` after proving the appointment already carries that exact operation ID.

For operation-linked rows, direct customer change or cancellation fails with a canonical-close-required error; admitted tuple changes also fail while payment is REQUESTED.
`close_booking_operation_v1` fences the attempt and performs an authorized no-ledger customer reassignment or cancellation in the same transaction.
For every reassignment it locks the appointment, requires its customer to equal the supplied `expected_current_customer_id`, validates the new same-Business target, stores that exact target in lifecycle metadata, and updates only `WHERE customer_id=expected_current_customer_id`.
The trigger permits only that expected-current→stored-target transition in the same service-role transaction.
The operation may already be CLOSED; it stays CLOSED, and no terminal attempt is reopened or replaced.
SKIPPED no-payment and FAILED no-ledger attempts therefore retain repeated authorized customer correction through the atomic close path.
Any appointment-linked ledger history blocks customer change, including accepted original-attempt and later separate-payment ledgers; no accepted guard is weakened.

The applied foundation and R1a migration bytes remain unchanged.
The existing R1a RPCs remain unchanged for customer/existing-appointment targets.
The new booking-operation commit is specialized because the accepted R1a commit deliberately rejects `booking_operation_id`.

This migration has exactly 23 schema deltas: one table, one existing-table column, eight named constraints, three indexes, eight functions, and two triggers.
It contains no fixture DML, backfill, permission cutover, worker, provider, or communication action.

## 8. Operation orchestration and transaction boundaries
The prepared kernel follows this order:

1. authorize current user/Business and obtain the three stable opaque UUIDs;
2. normalize literal source, customer input, booking tuple, and payment tuple;
3. run existing booking validation and calculate the authoritative server snapshot;
4. call bootstrap with stable identities and fingerprints;
5. recover an appointment by `(business_id,booking_operation_id)`;
6. if absent and operation OPEN, call `createBooking()` with durable persistence and exact snapshot;
7. recover the appointment after any uncertain create response;
8. bind only the attempt to the already operation-tagged appointment;
9. for `none`, return explicit no-payment outcome;
10. for manual tender, call the specialized booking-operation commit;
11. read canonical attempt/ledger/obligation state;
12. return one operator outcome without sending communications.

Commit boundaries are intentionally separate:
- bootstrap customer + operation + attempt + initial event is one database transaction;
- operation-aware appointment plus resource insertion is one service-role persistence transaction;
- attempt binding plus `OPEN→APPOINTMENT_CREATED` is one database transaction;
- ACCEPTED + ledger + event + four obligations is one database transaction;
- projections are later idempotent transactions, one obligation at a time.

An appointment is never rolled back or duplicated merely because payment failed.
Accepted money is never hidden or rolled back because appointment cache, invoice, receipt, CRM, refresh, or communication failed.

Lock order:
- bootstrap acquires sorted email/phone identity advisory locks, then the operation advisory lock;
- every create/bind/close/commit/replay RPC acquires the same operation advisory lock first;
- after advisory serialization, existing rows are locked in one order: attempt → appointment if present → operation;
- bootstrap's new-row inserts are customer → operation → attempt/events after proving corresponding rows absent; this FK insertion order does not reverse any visible-row lock;
- create locks attempt → operation because its appointment is absent, then inserts the appointment with its non-NULL operation ID;
- the appointment trigger never locks an attempt; PostgreSQL's existing-row update order is appointment → operation, which is the same suffix used after a canonical RPC obtains its attempt;
- bind/close/commit never hold operation while waiting for appointment;
- commit then writes ledger → event → obligations;
- projector: one obligation first, then target records in `appointment → invoice → receipt/CRM` UUID order;
- no projector may acquire an attempt lock after locking a projection target.

Existing validation queries and `validate_appointment_slot` are not represented as locks.
Direct cancellation/reassignment may hold appointment before its trigger reads operation, but it never waits for attempt; canonical functions waiting on that appointment have not yet locked operation, so this design does not introduce the reverse edge.
The implementation does not assert global deadlock freedom: `40001`/`40P01` returns UNKNOWN and requires same-identity read recovery, never automatic replay with a new key.

Same-operation concurrent requests produce one registry, one customer, one appointment, one attempt, and at most one ledger.
Expected unique races recover and compare exact columns.
Unexpected errors roll back their current transaction and return UNKNOWN unless durable evidence proves more.

Fenced close is mandatory after a post-bootstrap pricing/slot failure, operator abandonment, no-ledger customer correction, or cancellation:

- close takes the operation advisory lock and canonical row locks, then checks appointment and ledger counts;
- customer correction checks every `commerce_transactions` row linked to the appointment, regardless of payment-attempt identity, kind, status, or whether it was a later legitimate payment;
- a pricing/slot close succeeds only with zero appointments and zero ledgers;
- for pricing/slot/replacement, an existing appointment or ledger is returned for recovery rather than closed/replaced;
- customer reassignment with a ledger is rejected by the accepted attribution invariant;
- explicit cancellation may close the booking lifecycle and appointment while returning an existing ledger as recorded truth; it never changes or hides that ledger and never authorizes recollection;
- a REQUESTED money attempt transitions to FAILED/DO_NOT_RETRY with one FAILED/NOT_RECORDED event;
- a SKIPPED no-payment attempt remains SKIPPED because the accepted guard forbids SKIPPED→FAILED;
- no-ledger customer reassignment or cancellation is performed by close itself in the same transaction after fencing REQUESTED; on an already CLOSED operation it leaves every terminal attempt unchanged;
- lifecycle becomes CLOSED only after all checks and any allowed appointment mutation succeed;
- all create/bind/commit functions reject CLOSED before a new financial write.

Only a committed CLOSED result with zero appointment and zero ledger permits a replacement operation.
An unknown close response, a read-only absent snapshot, or an in-flight transaction permits only same-operation recovery.
Thus an old creator cannot succeed after the close fence: it must acquire the same advisory lock and then observes CLOSED.

The booking-specific commit first handles ACCEPTED replay by verifying its one exact ledger and four obligations.
For a REQUESTED attempt it performs no financial update until all of these hold under lock:

- operation is `APPOINTMENT_CREATED`, open to its admitted appointment, and owned by the current actor/Business;
- exactly one appointment has `(business_id,booking_operation_id)`;
- that appointment ID equals `attempt.appointment_id`;
- operation, appointment, and attempt customer/Business identities are equal;
- appointment is not cancelled;
- attempt is manual payment/deposit with its immutable canonical tuple;
- ledger count is zero and REQUESTED/event evidence is exact.

Any incoherent binding returns UNKNOWN or a durable zero-ledger terminal failure as the evidence allows.
It never adopts the appointment's new customer and never writes a customer-only ledger.
This booking-specific rule does not alter older R1a's legitimate customer-only support.

## 9. Explicit no-payment outcome
Bootstrap persists an attempt even for `none`.
It uses:

- `payment_kind='none'`;
- amount `0`;
- method/provider/instrument NULL;
- `execution_state='SKIPPED'`;
- `recovery_disposition='DO_NOT_RETRY'`;
- one REQUESTED/NOT_RECORDED event followed by one SKIPPED/NOT_RECORDED event;
- zero ledger rows;
- zero reconciliation obligations;
- zero receipt or communication eligibility.

Only after the operation-tagged appointment exists and bind succeeds is operator copy “Appointment saved — no payment recorded.”
No-payment is not FAILED, UNKNOWN, or a missing attempt.
Replay returns the same appointment and SKIPPED attempt.
If booking fails first, close records the booking lifecycle failure while the attempt remains SKIPPED; copy is “Booking not created — no payment was attempted.”
No code attempts the forbidden SKIPPED→FAILED transition.

## 10. Projection contract and first-slice boundary
Raw `RECORDED` means exactly one canonical ledger effect exists.
It does not mean synchronization is complete.
All four obligations created by the booking-operation commit begin PENDING.

Authoritative operator states:
- `NOT_RECORDED`: SKIPPED no-payment or a fenced terminal failure with durable zero-ledger proof;
- `PAYMENT_RECOVERY_REQUIRED`: appointment exists, the same attempt is REQUESTED, and ledger count is zero; continue bind/commit/recovery with that attempt only;
- `RECORDED`: one exact ledger and every required financial/document obligation COMPLETE or NOT_REQUIRED;
- `RECORDED_BUT_NOT_FULLY_SYNCHRONIZED`: exact ledger exists and any obligation is PENDING or FAILED;
- `UNKNOWN`: transport, identity, count, tuple, or state evidence cannot certify either zero or one effect.

`PAYMENT_RECOVERY_REQUIRED` is not intentional no-payment and does not offer Collect payment, a new attempt key, or a new booking.
`NOT_RECORDED` carries an explicit reason and `appointmentSaved` boolean so a failed payment is never rendered as “Appointment saved” when no row exists.

The first prepared-only implementation slice stops after canonical commit/read:
- it implements registry, idempotent appointment creation, bind, no-payment, canonical manual commit, recovery, and typed operator outcome;
- it creates four PENDING obligations for recorded money;
- it performs no appointment/invoice/receipt/CRM projection;
- it sends no communication;
- it remains unwired/default-off and cannot be activated.

The connected projection follow-on must implement these minimal interfaces:
- `reconcileAppointmentCache(attemptId)`;
- `reconcileInvoiceSettlement(attemptId)`;
- `reconcileReceipt(attemptId)`;
- `reconcileCustomerPaymentEvent(attemptId)`;
- `readCanonicalPaymentOutcome(operationId)`.

Rules for that follow-on:
- recompute appointment paid/refunded totals from canonical ledgers, never add an untrusted delta;
- multiple payments sum once each by distinct attempt/transaction identity;
- refunds and inconsistent status produce UNKNOWN/hold, not guessed net money;
- invoice work locks by Business/appointment, accepts exactly zero or one verified current invoice, and holds on ambiguity;
- invoice numbering allocation must be atomic and idempotent before activation;
- receipt identity is one document per canonical transaction, protected by a database uniqueness contract before concurrency;
- CRM mirror identity is one event per canonical attempt/transaction, protected by a database uniqueness contract;
- each obligation transition is compare-and-set PENDING/FAILED→COMPLETE or FAILED with exact failure code;
- only service-role server code may reconcile;
- replay of COMPLETE returns the recorded output and performs no target write;
- FAILED may retry only the same obligation and same canonical attempt;
- projection uncertainty leaves the obligation unresolved and forbids payment retry.

PENDING never satisfies synchronization.
The existing 90-row/CAD181 cohort is excluded by default: initial projectors accept only operation-linked attempts created after the eventual activation marker.
No historical or retained PENDING obligation is eligible merely because code exists.

Communications remain `OFF / NOT_IMPLEMENTED` in the first slice.
Receipt creation does not authorize receipt email.
Later communications require receipt projection COMPLETE, reviewed send-intent identity, and explicit eligibility.
Existing booking confirmation customer/business delivery remains distinct from payment-receipt delivery (`lib/actions/appointments.ts:687-735`; `lib/notifications/booking-delivery.ts:547-772`).
The later gate must preserve those separate occurrences without duplicate sends; no delivery is tested or triggered here.

## 11. #133 canonical reader and Summer contract
`readCanonicalPaymentOutcome(operationId)` is the deferred public operator/Summer #133 adapter, not the first slice's private reader.
It must call `readBookingOperationCanonical()` and map that canonical result; it may not independently query or reinterpret financial tables.
The adapter exposes, never stores separately:

- operation ID, attempt ID, appointment ID, transaction ID;
- source;
- booking lifecycle state, close reason, and appointment-saved boolean;
- requested payment mode, kind, amount, currency, method;
- actor ID for authorized audit views only;
- attempt execution state and recovery disposition;
- ordered event sequence/type/money state/failure class/failure code/timestamp;
- each projection kind/state/failure code/updated/completed timestamp;
- raw recorded boolean;
- synchronization summary;
- operator state;
- communication eligibility `NOT_IMPLEMENTED|NOT_ELIGIBLE|ELIGIBLE|UNKNOWN`;
- canonical created/resolved timestamps.

The normal operator transport omits customer PII, notes, raw payload, request hashes, provider metadata, and internal database errors.
It requires current tenant and actor authorization on every read.
Audit-only actor identity remains server-side and role-gated.
Negative, conflict, no-payment, PAYMENT_RECOVERY_REQUIRED, and UNKNOWN states use the same reader and event truth.

Summer may:
- UNDERSTAND the requested tender and durable result;
- EXPLAIN recorded money versus unfinished synchronization;
- RECOMMEND review or same-identity recovery;
- cite UNKNOWN honestly.

Summer may not:
- create, retry, bind, commit, reconcile, refund, send, or rotate identities;
- infer money from appointment cache, invoice, receipt, CRM, or communication alone;
- process retained obligations;
- create a parallel AI financial history.

## 12. #153, SEQ-ACL-1, and cutover
This slice creates only operation-linked canonical attempts and ledgers.
It does not repair legacy rows where `payment_attempt_id IS NULL AND appointment_id IS NULL`.
Those rows remain the exact #153 durability residual.

Retention/deletion impact is explicit:
- the applied foundation already gives every attempt `ON DELETE RESTRICT` customer/Business FKs, so its six accepted attempts already block deletion of their referenced identities;
- the new registry adds another RESTRICT reference for its durable booking request;
- before activation there are no registry rows, so applying an unwired additive migration creates no new live-row deletion failure;
- after activation every canonical booking has both registry and attempt history, and customer or Business deletion is expected to fail while that history exists;
- `deleteCustomer()` currently returns raw database error text (`lib/actions/customers.ts:217-230`);
- before activation, that action must map the relevant 23503 constraints to “This client has durable booking or payment history and cannot be deleted; archive or retain the client instead.”;
- no current Business-delete action was found in the bounded source inspection; any future/admin deletion control must provide the equivalent retained-history explanation;
- cascade deletion, history erasure, and synthetic cleanup are not alternatives.

No permission is revoked until the activated caller inventory proves:
- Booking Sheet and Quick Appointment use the canonical path for every supported mode;
- every still-active direct ledger writer is identified by actual call graph;
- replacement, recovery, and projection paths have passed their gates;
- no supported route depends on broad legacy UPDATE/DELETE.

Five source labels are not sufficient evidence of caller replacement.
Gift-card redemption, store credit, refunds, provider finalization, scripts, and administrative paths remain explicit dependencies.

SEQ-ACL-1 remains separate:
- anon/authenticated sequence USAGE+SELECT was a dated observation;
- no exploit was proven;
- the first slice must not call the event sequence directly;
- the local proof records sequence effects without assuming rollback of identity allocation;
- least-privilege correction is proposed only with the actual activated call graph.

Broad FORCE-RLS, owner-policy, and default-ACL redesign is deferred.
It is not silently promoted to a launch prerequisite.
The proven launch requirement is replacement of unsafe active legacy writers plus closure of the NULL/NULL durability exposure before permission cutover.

## 13. Exact next prepared-only implementation allowlist
The next genuine Product Owner gate should authorize only these 16 paths and local proof:

1. `supabase/migrations/<CLI-generated>_issue_134_durable_booking_operation.sql` — NEW; timestamp generated only when authorized.
2. `lib/booking-engine/types.ts` — add optional internal operation identity/expected snapshot.
3. `lib/booking-engine/persistence.ts` — add the server-constructed durable persistence strategy.
4. `lib/booking-engine/mutations/create.ts` — validate, persist, and recover without operation-ID or zero-value fallback.
5. `lib/commerce/booking-operations/types.ts` — NEW.
6. `lib/commerce/booking-operations/normalize.ts` — NEW.
7. `lib/commerce/booking-operations/kernel.ts` — NEW dependency-injected prepared kernel; no active caller.
8. `lib/commerce/booking-operations/index.ts` — NEW bounded exports.
9. `tests/unit/booking/create-booking-persistence.test.ts` — operation persistence/recovery regression.
10. `tests/unit/commerce/booking-operation-normalization.test.ts` — NEW vectors and exact tuple behavior.
11. `tests/unit/commerce/booking-operation-kernel.test.ts` — NEW stage/fault behavior.
12. `tests/unit/migrations/issue134-durable-booking-operation.test.ts` — NEW static migration contract.
13. `tests/postgres/issue-134-durable-booking-operation-contract.sql` — NEW disposable-local behavior contract.
14. `scripts/verify-issue134-durable-booking-operation-postgres.mjs` — NEW owned-cluster verifier.
15. `docs/reviews/issue-134-durable-booking-deposit-implementation.md` — NEW candidate/result record.
16. `docs/CHANGELOG.md`.

Inventory: 11 new paths and five existing paths.
Schema inventory: 23 exact deltas defined in section 7.

Must not change:
- either applied foundation/R1a/attribution migration;
- current `recordCommercePayment()`, refund, invoice, receipt, provider, worker, communication, or Summer runtime;
- Booking Sheet, Quick Appointment, `createAppointment()`, current UI copy, flags, configuration, grants, or permissions;
- existing proof/evidence;
- retained cohort, historical USD rows, #135, release controls, Production, or GVM state.

This intentionally leaves the prepared kernel unwired.
The connected follow-on owns modifications to the two UI surfaces and `lib/actions/appointments.ts`, only after projection readiness and independent review.
Before any activation it also owns `lib/actions/customers.ts` friendly deletion handling and operation-linked routes in `lib/booking-engine/mutations/update.ts` and `cancel.ts`.

## 14. Required authoring and proof
Offline/unit requirements:
- literal cross-language booking and payment canonicalization vectors;
- three-UUID generation/rotation and malformed identity rejection;
- operation-first inline replay, independent canonical email/phone races, and exact customer identity;
- source fixed by trusted entry point;
- current authorization checked before every dependency;
- normalizer rejects unsupported method/provider before admission;
- kernel fault injection at every boundary;
- exact lifecycle fence and operator-state mapping;
- private exact/history reader FOUND/ABSENT/UNKNOWN, authorization, cursor, PII-omission, and in-flight-absence behavior;
- no legacy fallback after admission;
- durable branch preserves zero subtotal/tax/deposit and never executes compatibility fallback;
- existing booking engine policy calls remain present;
- current callers without operation ID remain behaviorally unchanged.

Static migration requirements:
- exact 23-delta inventory and names/signatures;
- additive-only transaction with bounded lock/statement timeout;
- zero fixture/backfill DML;
- invoker/search-path/ACL/RLS posture;
- no broad grant, default ACL, FORCE RLS, or existing-function replacement;
- existing nonunique attempt index retained and new uniqueness proved;
- collision/nullability/data preflight;
- accepted migration hashes byte-identical.

Disposable-local PostgreSQL requirements:
- actual roles and grants, not owner-only simulation;
- read RPC exact/history modes, membership revocation, cursor order, one-snapshot contradictions, and PII-free history payload;
- operation-first inline replay plus independent canonical email/phone race stop;
- one appointment per operation under named and optional-staff concurrency;
- operation/appointment/attempt one-time binding;
- close-versus-create and close-versus-commit fencing in both lock orders;
- no-payment two-event/zero-ledger/zero-obligation result;
- payment commit creates exactly one ledger/event and four obligations;
- commit rejects every unbound, mismatched, cancelled, foreign-actor, and foreign-tenant case before financial writes;
- same-key replay and changed-tuple conflict;
- two deliberate equal-value attempt keys;
- lost-response recovery from each committed boundary;
- known rollback versus unknown transport classification;
- zero-ledger reassignment/cancellation closes atomically; accepted attribution remains protected;
- repeated CLOSED no-ledger corrections compare expected current and succeed; any original/later appointment ledger blocks them;
- role revocation and cross-tenant denial;
- lock order and bounded concurrent sessions;
- sequence side effects recorded honestly;
- protected existing fixture digests unchanged.

The money fixture declares service subtotal CAD100.00, tax CAD0.00 through an explicit zero-tax setup, final payable total CAD100.00, and required deposit CAD50.00.
No test may treat CAD100 as pre-tax when asserting full payment.

Regression scope:
- focused booking engine/create persistence suites;
- focused payment-attempt and migration suites;
- scoped booking, booking-engine, commerce, migration, customer, and notification tests;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- `npm test --` with the required focused/scoped suites;
- verifier syntax, migration hash, and exact allowlist checks;
- no accepted proof rerun merely for confidence.

Positive proof must execute behavior and inspect durable state.
Presence-only strings, mocked ledger success, or static scans cannot satisfy database proof.
Only new isolated synthetic local data is permitted.
The known agent-sandbox PostgreSQL denial must not be bypassed; after source review, an authorized human-owned local run remains the execution route.

## 15. Fault matrix
| Scenario | Operation | Appointment | Attempt/event | Ledger | Obligations | Operator result | Communication |
|---|---|---|---|---|---|---|---|
| CAD50 E-Transfer deposit on CAD100 final total, explicit zero tax | APPOINTMENT_CREATED | one tagged/bound row | REQUESTED→ACCEPTED | one CAD5000 deposit | four PENDING first slice | RECORDED_BUT_NOT_FULLY_SYNCHRONIZED | OFF |
| CAD100 full manual payment on same final-total fixture | APPOINTMENT_CREATED | one tagged/bound row | REQUESTED→ACCEPTED | one CAD10000 payment | four PENDING | RECORDED_BUT_NOT_FULLY_SYNCHRONIZED | OFF |
| No payment now | one | one | REQUESTED→SKIPPED | zero | zero | NOT_RECORDED / explicit no payment | OFF |
| No-payment booking fails after bootstrap | CLOSED | none | stays SKIPPED | zero | zero | NOT_RECORDED / booking not created | OFF |
| Deliberate second equal CAD50 | original unchanged; no second booking op | same | new existing-appointment attempt key | second distinct ledger | second set only | derived from both | OFF until later gate |
| Same-key replay | same | same | no duplicate REQUESTED/ACCEPTED | same transaction | same four | prior result | none |
| Same key, changed tuple | unchanged | no new row | one idempotent KEY_CONFLICT | unchanged | unchanged | NOT_RECORDED or prior recorded truth plus conflict | none |
| Concurrent same key, including NULL staff | one | one by unique operation index | one winner | at most one | exactly four if recorded | winner/replay | none |
| Independent inline operations, matching email/phone | one winner; loser no writes | at most winner's later row | loser match-required | zero for loser | zero | select existing customer | none |
| Response loss before bootstrap commit | unknown until same-key advisory/recovery settles | absent if rollback | absent if rollback | absent | absent | UNKNOWN; no replacement from snapshot absence | none |
| Response loss after bootstrap | present | absent | REQUESTED or SKIPPED | absent | absent | recover same operation; never rotate | none |
| Response loss after appointment commit | OPEN until bind | one tagged/recoverable | REQUESTED, unbound | absent | absent | PAYMENT_RECOVERY_REQUIRED / bind same attempt | none |
| Response loss after bind | APPOINTMENT_CREATED | one | REQUESTED, bound | absent | absent | PAYMENT_RECOVERY_REQUIRED / commit same attempt | none |
| Response loss after money commit | present | one | ACCEPTED | one | four PENDING | UNKNOWN until same-key replay proves recorded | none |
| Pricing/slot failure racing old create | CLOSED only if no row/effect | zero or recovered one | FAILED or unchanged SKIPPED only after fence | zero | zero | replacement only after durable zero-row close | none |
| First/repeated no-ledger customer correction | CLOSED and never reopened | locked expected-current→target atomically | first REQUESTED→FAILED; later terminal attempt unchanged | zero across all appointment-linked history | zero | NOT_RECORDED; original facts retained | none |
| Correction after original or later separate ledger | unchanged | customer protected | original attempt unchanged | any appointment-linked ledger blocks | unchanged | exact accepted operator error | none |
| Cancellation racing commit | fenced by same operation/attempt locks | cancelled before commit or recorded then cancelled | FAILED if zero-ledger; ACCEPTED replay otherwise | zero or one exact | zero or four | NOT_RECORDED or recorded truth | none |
| Privilege expires/revoked | hidden from caller | unchanged | unchanged | unchanged | unchanged | NOT AUTHORIZED, no existence detail | none |
| Foreign tenant/customer | no admission | none | none | none | none | NOT RECORDED | none |
| Unsupported/invalid currency | no admission | none | none | none | none | NOT RECORDED | none |
| Price/tax/deposit changes before insert | durably CLOSED after fence | none | FAILED or SKIPPED unchanged | none | none | NOT_RECORDED; then reviewed new operation | none |
| Slot/staff/hours conflict before insert | durably CLOSED after fence | none | FAILED or SKIPPED unchanged | none | none | NOT_RECORDED with booking conflict | none |
| Stale appointment cache after commit | present | exists with stale cache | ACCEPTED | one | appointment_cache PENDING/FAILED | RECORDED_BUT_NOT_FULLY_SYNCHRONIZED | none |
| Invoice/receipt/CRM failure | present | exists | ACCEPTED + projection event later | one | named obligation FAILED/PENDING | RECORDED_BUT_NOT_FULLY_SYNCHRONIZED | not eligible |
| Projection recovery | unchanged | recomputed from ledgers | append PROJECTION_CHANGED | unchanged | same obligation COMPLETE once | RECORDED only when all required complete | still separate gate |
| Browser storage loss | server row remains | recoverable | unchanged | unchanged | unchanged | authorized history includes unresolved and completed/no-payment | none |
| Book another | new UUID trio | new appointment | distinct attempt | independent | independent | independent result | none |
| Two tabs/surfaces, same UUID | one source/tuple wins | one | replay or KEY_CONFLICT | at most one | at most one set | explicit convergence/conflict | none |
| Serialization/hash mismatch | no changed row | no new row | KEY_CONFLICT/UNKNOWN; never hash-only acceptance | unchanged | unchanged | hold | none |
| Refund appears during later projection | unchanged | no guessed total | canonical read includes refund evidence | preserved | hold/fail affected obligation | UNKNOWN pending refund-aware gate | none |

## 16. Finite sequence to GVM acceptance
1. **Current task:** publish this contract; no execution.
2. **Independent design audit:** verify source consistency, competitive measurable outcomes, signatures, object/path counts, lock order, and fault matrix.
3. **Next PO gate:** authorize exactly the section 13 prepared-only implementation and bounded local proofs.
4. **Authoring/local gate:** implement default-off/unwired candidate; run offline checks and independently audited human-owned disposable-local PostgreSQL proof.
5. **Independent implementation audit:** exact source, migration, test, proof, and preservation review.
6. **Projection design/implementation gate:** appointment cache, invoice, receipt, CRM uniqueness/idempotency and #133 reader; communications remain off.
7. **Connected Staging gate:** fresh read-only preflight, exact migration/application approval, synthetic new cohort only, no retained cohort processing.
8. **Staging workflow acceptance:** Booking Sheet/Quick Appointment responsive recovery, all operator states, projection recovery, authorization, and no communications/provider effects.
9. **Writer inventory and #153 gate:** replace every actually activated caller, then close legacy NULL/NULL and separately adjudicate SEQ-ACL-1 least privilege.
10. **Communication gate:** preserve distinct booking confirmation and receipt occurrences, prove send-intent recovery and duplicate-delivery limits.
11. **Exact-candidate application release gate:** merge and green CI remain non-authorizing; Production moves only through `.github/workflows/release-production.yml`, exact allowlist, protected owner approval, and build-info verification.
12. **Controlled GVM verification:** after governed Production release, one separately authorized real workflow with explicit containment and evidence.
13. **Resumption decision:** technician activity resumes only after explicit Product Owner acceptance.

No preliminary design gate remains.
The next requested decision, after independent review, is the exact prepared-only implementation/local-proof authorization in section 13.

## 17. Material limitations at design close
- Source-reviewed authoring only; no independent acceptance, compilation, SQL, DDL, or hosted execution occurred.
- Projection uniqueness and communications are follow-on gates and block activation.
- Active legacy writers, #153 NULL/NULL, SEQ-ACL-1, and cross-actor recovery remain open.
- Providers, stored value, refunds, public booking, and communications are unsupported.
- No local-only result permits Staging, Production, GVM, or technician action.

**Design readiness:** ready for independent design audit; if accepted, ready for one exact Product Owner prepared-only implementation/local-proof gate.
