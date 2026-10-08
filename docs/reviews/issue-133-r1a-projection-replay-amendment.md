# Issue #133 / #134 — R1a Projection-Aware ACCEPTED Replay Amendment

**Date:** 2026-10-08  
**Status:** PRODUCT OWNER APPROVED / R1a PROJECTION-AWARE ACCEPTED REPLAY AMENDMENT AUTHORIZED FOR PREPARED-ONLY SLICE 1 IMPLEMENTATION / NO DATABASE PROOF OR HOSTED ACTION AUTHORIZED
**Trigger:** Codex Slice 1 HOLD from clean HEAD `cd0b797f745e90ca89d99a8d9cfcf166e05d0bae`  
**Protected R1a source:** `supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql` SHA-256 `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`  
**Approved Slice 1 architectural contract:** gate SHA-256 `51334ca5da427df068fc6370e2189dc83f58f1611b7e8a9a53e46045d61586f0`  

This amendment resolves one concrete compatibility conflict discovered before Slice 1 implementation began. It does not authorize implementation, migration authoring/application, PostgreSQL execution, Staging, Production, GVM, worker activation, live admission, Reporting cutover, #153 changes, provider/communication activity or technician resumption.

**Independent review:** Claude Opus 5 High independently reviewed the original amendment at SHA-256 `fae6246c8710dc71de1117499970b2db726736ee0cd9c46f017b5e1d530a9f29` / 14,247 bytes and returned `R1A_PROJECTION_REPLAY_AMENDMENT_READY_FOR_PO_GATE`. Claude confirmed the blocker in protected R1a source, confirmed this predicate remains stricter than the Issue #158 replay predicate that passed Database Proof #6, and required the implementation conditions now incorporated below.

**Product Owner authorization:** Darshan explicitly approved this amended semantic scope after Claude Level-3 acceptance. The approved semantic gate is commit `5f9562b74215e8355e578569f7d406f14647e81e`, with reviewed amendment SHA-256 `5e43efcbc7ba3082b8062b6b9193c68e02bfb4a0a705b9834f123d85c4929d96` and reconciled projection contract SHA-256 `1472f0ff65e1b0476fbc57f86a3f18d6dfc35ca9b72d919ab3b2c6743cfcda91`. Authorization permits the previously approved Slice 1 implementation to resume and permits exactly one additional existing-function replacement inside the NEW Slice 1 migration: `CREATE OR REPLACE public.commit_manual_payment_attempt_v1(uuid,uuid)` with identical signature/result/security/ACL, changing only the zero-write ACCEPTED replay evidence predicate as specified here. No PostgreSQL proof execution, hosted migration application, Staging/Production/GVM action, worker/live admission, Reporting/CRM cutover, #153 change, provider/communication activity, historical repair or technician resumption is authorized.

## 1. Confirmed conflict

The accepted R1a `public.commit_manual_payment_attempt_v1(uuid, uuid)` treats the original post-commit evidence shape as the only valid ACCEPTED replay shape.

Current protected logic requires:

- exactly one canonical ledger row;
- exact immutable money/identity tuple;
- `recovery_disposition='RECOVER'` with no failure metadata;
- exactly one REQUESTED event;
- exactly one ACCEPTED event;
- total events = `2 + valid KEY_CONFLICT events`;
- exactly four reconciliation rows;
- all four reconciliation rows still in their original writer-created configuration.

For appointment-bound attempts, all four must still be PENDING. For customer-only attempts, `appointment_cache` must remain NOT_REQUIRED and the other three must still be PENDING.

Slice 1 projectors are designed to legitimately transition those obligations to COMPLETE/FAILED and, for customer-only attempts, `invoice_settlement` to NOT_REQUIRED, while appending `PROJECTION_CHANGED` evidence atomically.

Therefore a valid recorded payment becomes `UNKNOWN | recorded=true` on later R1a replay merely because synchronization progressed. This is a real compatibility defect. Projection admission being disabled prevents current runtime impact but does not remove the future conflict.

## 2. Existing proven precedent

The independently accepted Issue #158 function `commit_booking_operation_manual_payment_v1` already uses a projection-compatible ACCEPTED replay shape:

- exact one ledger;
- one REQUESTED event;
- one ACCEPTED event;
- exactly four obligations;
- exact ledger/attempt/appointment tuple;
- no requirement that all obligations remain PENDING;
- no total-event equality that rejects later projection history.

It returns `REPLAY`, the same transaction identity, `recorded=true`, and compatibility synchronization `PENDING`.

This amendment applies the same core principle to R1a while retaining R1a's existing KEY_CONFLICT evidence validation and adding explicit validation of projection history rather than blindly ignoring it.

## 3. Locked preservation

The following remain immutable:

- Foundation migration bytes/hash;
- R1a applied migration bytes/hash;
- Attribution migration bytes/hash;
- Issue #158 migration bytes/hash;
- `admit_payment_attempt_v1` behavior and signature;
- `commit_manual_payment_attempt_v1(uuid,uuid)` signature and result columns;
- authorization, tenant checks, actor/binding validation, attempt lock and canonical ledger identity requirements;
- REQUESTED commit/new-money branch, including attempt state change, ledger insert, ACCEPTED event and initial four obligation writes;
- at-most-one ledger effect per attempt;
- KEY_CONFLICT stable evidence behavior;
- TypeScript `CommitOutcome` wire contract;
- no provider/network behavior;
- all existing migrations remain unedited.

Any implementation must redefine the existing function only from a **new unapplied migration**.

## 4. Exact semantic delta

Only the `attempt.execution_state='ACCEPTED'` replay evidence predicate may change.

The replacement remains fail-closed and returns `REPLAY` only when all categories below are certified.

### 4.1 Exact money identity — unchanged

Require exactly one same-Business canonical transaction linked by `payment_attempt_id` and the existing exact R1a tuple:

- business;
- customer;
- appointment;
- kind;
- status `succeeded`;
- method;
- amount;
- currency;
- provider `manual`;
- provider reference `manual-attempt:<attempt_id>`;
- provider payment intent NULL;
- created_by actor.

Any zero/multiple/mismatched ledger evidence remains `UNKNOWN`; if exactly one ledger row exists its transaction identity may still be returned with `recorded=true`, preserving the existing ledger-backed UNKNOWN behavior.

### 4.2 Attempt state — unchanged

Require:

- execution_state ACCEPTED;
- recovery_disposition RECOVER;
- failure_class NULL;
- failure_code NULL.

### 4.3 Core lifecycle events — unchanged

Require exactly:

- one `REQUESTED / NOT_RECORDED` event with null failure metadata;
- one `ACCEPTED / RECORDED` event with null failure metadata.

### 4.4 KEY_CONFLICT history — preserved

Continue accepting any number of stable valid R1a KEY_CONFLICT events only when each is:

- `event_type='KEY_CONFLICT'`;
- `money_state='NOT_RECORDED'`;
- `failure_class='CONFLICT'`;
- `failure_code='KEY_CONFLICT'`;
- same Business/attempt.

Existing conflict idempotency semantics remain unchanged.

### 4.5 Projection-event history — newly recognized

Additional events on an ACCEPTED attempt may be accepted only when they are valid `PROJECTION_CHANGED` evidence generated by the Slice 1 state machine.

Each valid projection event must satisfy:

- same Business and attempt;
- `event_type='PROJECTION_CHANGED'`;
- `projection_kind` is one of the four canonical kinds;
- `reconciliation_state IN ('COMPLETE','FAILED','NOT_REQUIRED')`; PENDING is not emitted as a transition in Slice 1;
- `money_state='RECORDED'` because the canonical payment already exists;
- if reconciliation_state=`FAILED`:
  - `failure_class='PROJECTION'`;
  - `failure_code IN ('PROJECTION_FAILED','PROJECTION_UNCERTAIN')`;
- if reconciliation_state in (`COMPLETE`,`NOT_REQUIRED`):
  - failure_class and failure_code are NULL.

`REPLAYED`, `RECOVERY_REQUIRED`, `FAILED`, `SKIPPED`, malformed projection events, wrong-money-state projection events or any other extra event on an ACCEPTED R1a attempt are not silently accepted by this compatibility branch.

The total event census must prove:

`total_event_count = 2 + valid_key_conflict_count + valid_projection_event_count`.

Thus projection history is widened deliberately, not arbitrary event drift.

## 5. Current obligation validation

Require exactly four obligations, one per canonical kind. The existing primary key guarantees one row per `(attempt_id, projection_kind)`; replay still checks `obligation_count=4`.

Every obligation must remain internally coherent with Foundation constraints and with the source-specific allowed state set.

### 5.1 Appointment-bound accepted attempt

For all four kinds:

- allowed states: `PENDING | COMPLETE | FAILED`;
- `NOT_REQUIRED` is contradictory and yields UNKNOWN.

### 5.2 Customer-only accepted attempt (`appointment_id IS NULL`)

- `appointment_cache` must remain `NOT_REQUIRED`;
- `invoice_settlement` may be:
  - PENDING before its projector runs; or
  - NOT_REQUIRED after the approved Slice 1 transition;
- `customer_payment_events` may be `PENDING | COMPLETE | FAILED`;
- `receipt` may be `PENDING | COMPLETE | FAILED`.

No customer-only appointment or invoice target is fabricated to make replay pass.

## 6. Projection history/current-state coherence

Replay must not merely accept any syntactically valid projection events.

For each projection kind:

- initial PENDING state with no projector transition may have zero `PROJECTION_CHANGED` events;
- initial customer-only `appointment_cache=NOT_REQUIRED` must have **zero** `PROJECTION_CHANGED` events because R1a created that state directly and Slice 1 never runs an appointment-cache projector for it; any such event is contradictory and yields UNKNOWN;
- if current state is FAILED, the latest projection event for that kind must be FAILED with matching failure_code;
- if current state is COMPLETE, the latest projection event for that kind must be COMPLETE;
- customer-only `invoice_settlement=NOT_REQUIRED` created by the projector must have latest projection event NOT_REQUIRED;
- if a kind has multiple projection events (for example FAILED then COMPLETE), historical earlier events may differ, but the latest event must agree with current obligation state.

A PENDING obligation with projection-transition history is contradictory under the Slice 1 state machine and yields UNKNOWN.

This provides fail-closed evidence that projection changes were canonical transitions rather than arbitrary service-role row edits.

## 7. Replay result compatibility

When the ACCEPTED replay evidence passes:

- outcome remains `REPLAY`;
- attempt_id remains the exact original attempt;
- transaction_id remains the exact original ledger transaction;
- recorded remains `true`;
- `synchronization` remains the existing compatibility value `PENDING`.

Do **not** widen the R1a TypeScript `CommitOutcome` in this amendment.

Reason: existing R1a TypeScript mappers/types accept only `RECORDED|REPLAY + PENDING`. Exact projection state is now owned by the #133 canonical reader. Until Slice 2/operator read integration, R1a's PENDING result is intentionally conservative and must never be interpreted as proof that a completed projection is still incomplete.

This preserves existing caller compatibility and keeps the correction in SQL/new-migration scope.

## 8. New-money branch boundary

The REQUESTED/new-money branch must remain behaviorally unchanged.

Projection-aware replay must never:

- create a transaction;
- change amount/currency/method/customer/appointment;
- rewrite an accepted attempt;
- create missing obligations;
- repair malformed projection history;
- retry a projection;
- send a receipt;
- call a provider;
- rotate an attempt key.

It only classifies already-recorded canonical evidence.

## 9. Implementation scope amendment

If independently accepted and Product Owner approved, expand the already-approved Slice 1 **semantic/object** scope by exactly one item:

- in the NEW Slice 1 migration, `CREATE OR REPLACE FUNCTION public.commit_manual_payment_attempt_v1(uuid, uuid)` with the projection-aware ACCEPTED replay predicate above.

No protected migration file is edited.

The existing 16-path filesystem allowlist can remain unchanged because the new migration, Slice 1 migration static test, PostgreSQL contract, verifier and implementation report are already allowlisted. Do not modify the old R1a static or PostgreSQL contract files.

The Slice 1 migration object inventory must explicitly classify this as **one existing function replacement**, not as a new function.

## 10. Binding implementation conditions from independent Level-3 review

These conditions are part of the amended Product Owner gate if approved:

1. The exact `PROJECTION_CHANGED` emitter vocabulary is jointly pinned in the main #133 projection contract and this amendment: `money_state='RECORDED'`; reconciliation state only COMPLETE/FAILED/NOT_REQUIRED; FAILED carries `failure_class='PROJECTION'` plus `PROJECTION_FAILED|PROJECTION_UNCERTAIN`; COMPLETE/NOT_REQUIRED carry null failure metadata; Slice 1 never emits PENDING transitions.
2. The future Slice 1 disposable-local verifier must execute the **unchanged historical R1a PostgreSQL contract** against the replaced function in addition to the new amendment vectors. The historical contract file remains byte-identical and is not edited.
3. The replacement definition must explicitly re-declare `SECURITY INVOKER` and `SET search_path = pg_catalog, pg_temp`; the new static test must pin both. Do not rely on CREATE OR REPLACE to preserve definition clauses.
4. Customer-only `appointment_cache=NOT_REQUIRED` is an initial R1a state with **zero** projection events; a NOT_REQUIRED projection event for that kind is not accepted.
5. Event vocabulary is a jointly reviewed invariant. Any future event type or PENDING/requeue projection event requires coordinated replay-validator review before activation.
6. Do not modify/harmonize Issue #158 replay in this slice. Its event-census asymmetry is an accepted observation only; Proof #6 remains closed.

## 11. Regression/proof additions

The new Slice 1 local PostgreSQL proof must include all prior Slice 1 vectors plus R1a compatibility cases:

1. ACCEPTED replay immediately after commit, before projection → same REPLAY transaction, PENDING compatibility result.
2. replay after one obligation COMPLETE + valid PROJECTION_CHANGED → same REPLAY transaction.
3. replay after one obligation FAILED/PROJECTION_FAILED → same REPLAY transaction.
4. replay after one obligation FAILED/PROJECTION_UNCERTAIN → same REPLAY transaction.
5. replay after FAILED then COMPLETE history for one kind → same REPLAY transaction; latest event/current state agree.
6. replay after all four appointment-bound obligations COMPLETE → same REPLAY transaction.
7. customer-only replay before invoice projector: appointment_cache NOT_REQUIRED + other three PENDING → REPLAY.
8. customer-only replay after invoice_settlement NOT_REQUIRED transition → REPLAY.
9. valid existing KEY_CONFLICT evidence plus projection history → REPLAY.
10. projection event with wrong money_state → ledger-backed UNKNOWN.
11. projection event FAILED with wrong/missing projection failure metadata → ledger-backed UNKNOWN.
12. current obligation state disagrees with latest projection event → ledger-backed UNKNOWN.
13. appointment-bound NOT_REQUIRED obligation → ledger-backed UNKNOWN.
14. PENDING obligation with projection-transition history → ledger-backed UNKNOWN.
15. extra unrecognized event type on ACCEPTED attempt → ledger-backed UNKNOWN.
16. missing/extra obligation → ledger-backed UNKNOWN.
17. all replay cases preserve the exact original attempt and transaction identities and create zero new ledger rows.

Static tests must prove the old protected R1a source remains byte-identical and that the replacement's REQUESTED/new-money write block is semantically/source-pinned unchanged as far as practical.

The human-owned Slice 1 verifier must also load and execute the **unchanged** `tests/postgres/issue-134-r1a-manual-kernel-contract.sql` against the replaced function and require its existing contract to pass before the new replay-amendment vectors may pass.

## 12. Risk classification

**Risk if not corrected:** HIGH before projection activation. A healthy recorded payment becomes UNKNOWN merely because its synchronization progressed, degrading recovery/operator truth and undermining #133/#134 convergence.

**Risk of correction:** MEDIUM-HIGH because an ACCEPTED replay predicate is being widened. The risk is false replay of contradictory evidence. Mitigation is strict exact-ledger validation, exact core lifecycle counts, bounded KEY_CONFLICT validation, bounded PROJECTION_CHANGED validation, exact four-obligation shape, latest-event/current-state coherence, no write on replay and disposable-local PostgreSQL proof before any hosted application.

**Impact now:** none while admission remains disabled and no Slice 1 implementation exists.

**Impact later:** required for R1a and projection state machine to coexist. It avoids forcing TypeScript/API changes and keeps exact synchronization truth in the #133 reader.

## 13. Governance decision

The old approved decision was to preserve the R1a function as part of the protected baseline. The proposed direction preserves the applied migration bytes but supersedes the function definition through a new migration solely for projection-aware ACCEPTED replay classification.

This is a consequential semantic expansion beyond the Product Owner's existing additive Slice 1 authorization. Product Owner approval is required **after independent review of this amendment** and before implementation resumes.

No current authorization transfers automatically.
