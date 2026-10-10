# #133/#158 connected Staging C03 — accepted result

**Status: CONNECTED_BACKEND_PASS / CONNECTED_STAGING_C03_ACCEPTED_WITH_NONBLOCKING_LIMITATIONS.**
Connected Staging backend acceptance is achieved for this exact CAD50 manual
E-Transfer deposit path. **C03 is CONSUMED; never rerun or reuse it.**

## Source authority and exact identity

This documentation-only closeout records the supplied Program Lead accepted result,
separate-principal post-run reconciliation and completed independent Claude audit.
It does not repeat those investigations. Only first/final `observed_at` metadata was
read locally from the immutable evidence to date the observation accurately.
Competitive Product Gate: **NOT_APPLICABLE** — factual documentation of accepted
validation, with no product behavior or strategy change.

| Identity | Exact value |
| --- | --- |
| Executed package commit | `0314e6d3694002e16e051a3789c1949035e76023` |
| Executed package tree | `0b57a9aa88366b8cb9d397620e63483d883ac807` |
| Executed package parent | `72be50fd93bd3f4dca4be97cfc01c72d01fc7f49` |
| Package aggregate SHA-256 | `3653c35027a98ff86e647e737252dbd97353da959ad075be2c91c367919002e9` |
| Run | `HV133-158-20261009-C03-9b8c5783` |
| Target | Chasum Staging only, `wnfahklzaxirftyskctd` |
| First / final evidence time (UTC) | `2026-10-10T02:48:09.368060+00:00` / `2026-10-10T02:48:29.572203+00:00` |
| Local run date/time | 2026-10-09, 22:48:09–22:48:29 America/Toronto |
| Append-only evidence | `/Users/darshan/chasum-evidence/issue133-connected-staging/HV133-158-20261009-C03-9b8c5783/evidence.jsonl` |
| Evidence bytes / records | 216221 / 83 |
| Evidence SHA-256 | `d703df6fe6d43759d7949bc8093d33eb5ce8ab8d629398f61bc4f5d17c56f747` |
| Final record | `phase=final`, `status=CONNECTED_BACKEND_PASS`, `hosted_validation_run=true` |

The Program Lead mechanically verified the exact evidence SHA-256 and fully
recomputed sequence, previous-hash and per-record hash chain: **PASS**. This is
supplied completed verification, not a new hash recomputation by this closeout or
by Claude. [Independent audit and its hashing limitation](issue-133-connected-staging-c03-review.md).
The [V3 preparation report](issue-133-connected-staging-v3-preparation.md) and
[V3 PLAN](../validation/issue-133-connected-staging-v3/PLAN.md) remain byte-identical;
their NOT RUN language is immutable authoring history, superseded for execution
status by this accepted result.

## Actual phase outcome

The pre-write gates passed in this order:

1. `zero-write-preflight`.
2. Literal `service_role` READ ONLY: `literal_role=service_role`, `read_only=on`.
3. Same-Management-bearer project identity: exact ref `wnfahklzaxirftyskctd`, `ACTIVE_HEALTHY`.
4. `management-database-read-write-capability`: `transaction_read_only=off`, non-mutating transaction ending in `ROLLBACK`.
5. Only then `owner:dispatch`, the first mutation boundary.

The single-shot connected flow completed financial persistence, all four explicit
projectors, canonical readers, successful-path replay, authorization negatives and
final containment. No mutation preceded `owner:dispatch`; no unknown-money outcome
or blocking inconsistency was found.

## Connected financial truth

All monetary amounts below are CAD cents. Appointment/customer/Business attribution
is correct throughout.

| Object | Accepted actual state |
| --- | --- |
| Attempt / transaction | Exactly one accepted synthetic attempt and one `manual` / `e_transfer` deposit transaction of 5000 |
| Appointment | Exactly one confirmed appointment: price 10000 / tax 0 / deposit 5000 / paid 5000 / refunded 0 / `deposit_paid` |
| Invoice | Exactly one partial `INV-0001`: subtotal 10000 / tax 0 / total 10000 / paid 5000 / refunded 0 / balance 5000 |
| Receipt | Exactly one `RCT-0001`: 5000 CAD / `e_transfer` / `not_sent` / `emailed_at=NULL` / exact transaction link |
| Receipt invoice relationship | `invoice_id=NULL` by the accepted independence contract; reconcile receipt → transaction → invoice |
| CRM | Exactly one customer payment event |
| Reconciliation | `appointment_cache`, `invoice_settlement`, `customer_payment_events`, `receipt`: all four obligations `COMPLETE` |
| Attempt lifecycle/projection events | Exactly six: `REQUESTED`, `ACCEPTED`, four `PROJECTION_CHANGED` |
| Refunds | Zero |
| Final canonical reader | `operator_state=RECORDED`, synchronization `COMPLETE` |
| Nonmember authorization | Both readers denied with SQLSTATE `42501` |

This records a manual payment assertion, not bank/provider verification.

## Replay and idempotency

Bootstrap, persist and bind returned `EXISTING`. Money returned `REPLAY` for the
same attempt and transaction. All four projector replays returned
`VERIFIED` / `COMPLETE`. Complete rows equalled replayed rows; before/after digest:

`0bbf119d7143a738739b5a626aca6be6c95f7bd9aca879b723ce97c3b5ba8a2c`.

There was no second appointment, attempt, transaction, invoice, receipt or CRM
event. Invoice sequence next = 2 and receipt sequence next = 2; no extra sequence
burn. The replay-money response still says synchronization `PENDING` even after
the authoritative reader says `COMPLETE`; data is correct, but that response is
stale. This is a pre-activation guard, not a C03 blocker.

## Final containment and retained-state reconciliation

Admission was enabled for this run and then disabled with the same watermark;
final `enabled=false`. Final sessions = 0, other_members = 0, other_admission = 0,
other_writers = 0, and `customer_provider_absent=true`. Synthetic communication
counts were zero across all nine checked communication surfaces. Receipt stayed
`not_sent`; the owner was confirmed but never logged in. Synthetic parents,
financial records and disabled admission remain retained for audit.

The Program Lead's independent, separate-principal post-run READ ONLY Staging
reconciliation exactly corroborated synthetic state. Excluding C03, retained state
was unchanged: attempts 6 / accepted 4 / requested 2 / obligations 16 / pending 15 /
not_required 1 / operations 0 / admission 0 / receipt_sequences 0. These are scoped
preservation observations, not whole-database or current-serving assertions.

Retained exact full-row digests, excluding C03, were unchanged:

| Relation | SHA-256 |
| --- | --- |
| `commerce_payment_attempts` | `ed9f221358f53afac119a3841042807884545a480c8474b16e66932e38a9137c` |
| `commerce_payment_attempt_events` | `690e347f076f6482ab91ca0da9bceeb70a2645b8c99f74e169416bc6d9f3bf64` |
| `commerce_payment_reconciliation` | `6f7c58e65a5c482a208e07be232413d43966509f7d649647af6de09f2d5bc284` |
| `commerce_transactions` | `ff2fe7b24fdd1407ba0b918a4b4ab0ee5fa8da73dfa90c43a43a9e40a77979f6` |
| `commerce_invoices` | `513a7be02ebce0cf6fe6a71524d6b279e1e0239646c7d8ba1704db59349a07e5` |
| `commerce_receipts` | `f16a838f2a900f01d04b5b46b993e4080d99d9d30b4c820742090a16c7b62e45` |
| `customer_payment_events` | `5679721a63b1d0bbf97fa2ea1110714b40d90ac1efb15b5f2585450c5ab447fa` |
| `commerce_booking_operations` (empty) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `commerce_projection_admission` (empty) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `commerce_receipt_sequences` (empty) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

The empty retained admission/sequence sets exclude C03; they do not erase its
disabled admission row or its document sequences.

## Nonblocking observations and acceptance limits

1. Replay synchronization `PENDING` is stale. Before operator wiring, correct the response or explicitly make canonical reader truth authoritative. **IMPORTANT BEFORE FINANCIAL WORKFLOW ACTIVATION; not a C03 blocker.**
2. Receipt `invoice_id` remains NULL by contract. Operator/accounting surfaces must use receipt → transaction → invoice.
3. Business protection flags were not echoed directly as evidence rows. Program Lead post-run reads confirmed them, and communications stayed zero. Evidence-schema improvement only.
4. Globally allocated `event_sequence` could permit weak platform-volume inference if exposed raw to tenants. Bounded multi-tenant observability/privacy review: **DESIGN FOR NOW / BUILD LATER**, unless a customer surface exposes it.
5. `recovery_disposition=RECOVER` persists on the settled attempt while canonical `operator_state=RECORDED` is correct. Future readers/workers must not treat recovery_disposition alone as live recovery truth. Important guard before wiring.
6. C03 does not prove concurrency, failure recovery, refunds, other payment shapes, application UI, Production or GVM behavior.

Acceptance is only the exact connected Staging CAD50 deposit path. It grants no
Production approval, GVM Operational Acceptance, technician resumption,
communications/provider activation, #153 closure, additional financial execution,
full Booking Sheet/Quick Appointment UI acceptance, worker activation, historical
repair, migration/RLS/ACL change, or broader concurrency/refund/payment-shape
acceptance. Application wiring remains unaccepted and default-off.

## Preserved predecessors and next governance boundary

C01 `HV133-158-20261009-C01-72d9f02a` and C02
`HV133-158-20261009-C02-5776d6c8` remain consumed `STOP_ZERO_WRITES`, with no
synthetic/financial mutation. Both passed zero-write preflight and literal
service_role READ ONLY, then stopped at project identity. C01's opaque failure
class remains unknowable; C02 recorded `PROJECT_IDENTITY_HTTP_403`. Their evidence
SHA-256 values remain respectively
`a16c19aed6778ea76789f6d35e263f140611148aae6074ccade548369b745ab8` and
`19a833b4bf73b1eec798dcade86e26b69407a3cd97db711e50b3f79714921fd6`.
The V3 PLAN preserves the PO's historical finding that the old credential lacked
Project Settings Read. **C01/C02/C03 must never be rerun or reused.**

Next safe continuation is bounded local source/read-only design preparation for
the separately reviewed Slice 2 in the [#133 contract](issue-133-projection-observability-contract.md)
§13/§16/§18: one canonical ledger aggregate, Reporting re-source, CRM/operator
reader integration and disclosure, coordinated with the accepted
[booking-operation recovery contract](issue-134-durable-booking-deposit-contract.md).
Resolve the replay/recovery truth guards and receipt relationship in that design;
map actual replacement writers and #153 dependencies, including legacy NULL/NULL
durability, SEQ-ACL-1 and `customer_payment_events.transaction_id` permissions.
Keep retained cohorts excluded from future worker admission. Broader hosted
fault/concurrency/payment-shape and responsive operator acceptance remain open.

Program Lead reconciles the bounded design and applicable existing competitive
contract; independent review and the applicable exact Product Owner gate precede
implementation or consequential execution. This closeout identifies that boundary
but authorizes and starts none of it: no automatic financial run, worker or
permission cutover. No new remote-main/runtime/serving verification was performed;
remote freshness remains **NOT VERIFIED** under the local-only authorization.
