# #133/#158 connected Staging C03 — independent post-run audit

**Exact verdict: CONNECTED_STAGING_C03_ACCEPTED_WITH_NONBLOCKING_LIMITATIONS.**

This is a factual record of the supplied completed Claude post-run audit, not a
new review dispatch or a verbatim transcript. It preserves the separation between
Claude's evidence inspection and the Program Lead's mechanical hashing and
separate-principal Staging reconciliation.

## Reviewer and subject

| Field | Exact value |
| --- | --- |
| Configured reviewer model | `claude-opus-5` |
| Thinking | `true` |
| Effort | `high` |
| Fast | `false` |
| Audit dispatch state | **COMPLETED**, supported by the supplied returned audit; no new dispatch in this closeout |
| Package commit | `0314e6d3694002e16e051a3789c1949035e76023` |
| Package tree | `0b57a9aa88366b8cb9d397620e63483d883ac807` |
| Package parent | `72be50fd93bd3f4dca4be97cfc01c72d01fc7f49` |
| Package aggregate SHA-256 | `3653c35027a98ff86e647e737252dbd97353da959ad075be2c91c367919002e9` |
| Run / target | `HV133-158-20261009-C03-9b8c5783` / Chasum Staging only `wnfahklzaxirftyskctd` |
| Evidence path | `/Users/darshan/chasum-evidence/issue133-connected-staging/HV133-158-20261009-C03-9b8c5783/evidence.jsonl` |
| Evidence identity | 216221 bytes / 83 records / SHA-256 `d703df6fe6d43759d7949bc8093d33eb5ce8ab8d629398f61bc4f5d17c56f747` |

## What Claude independently confirmed

Claude inspected all 83 records and confirmed:

- A complete single-shot `CONNECTED_BACKEND_PASS`, final `phase=final`, `hosted_validation_run=true`.
- Exact pre-write gate order: zero-write preflight → literal service_role READ ONLY (`read_only=on`) → same-bearer exact Staging project identity / `ACTIVE_HEALTHY` → non-mutating read-write capability (`transaction_read_only=off`, ROLLBACK) → `owner:dispatch`. No mutation before that owner boundary.
- Exactly-once financial truth: one accepted attempt, one CAD5000-cent manual E-Transfer deposit, correct appointment/customer/Business attribution, consistent confirmed appointment, partial `INV-0001`, unsent `RCT-0001`, one CRM event, zero refunds and four COMPLETE reconciliation obligations. Exactly six lifecycle/projection events.
- Stable successful-path replay: bootstrap/persist/bind EXISTING, same-attempt/same-transaction money REPLAY, all four projectors COMPLETE and replay VERIFIED, equal before/after rows/digest, no duplicate money/documents/CRM events and no extra sequence burn; invoice/receipt next numbers both 2.
- Final canonical reader `RECORDED` / synchronization `COMPLETE`, with both nonmember reader calls denied by SQLSTATE `42501`.
- Final admission disabled with the same watermark; sessions, other members, other admission and other writers all zero; no customer/provider reference, no communications across the nine checked surfaces, receipt still `not_sent`, and confirmed owner never logged in.
- Retained state and full-row digests unchanged outside C03, consistent with the Program Lead's independent separate-principal post-run read-only Staging reconciliation.
- No unknown-money outcome, credential/raw Management failure body, blocking inconsistency or hidden side effect in the inspected record.

Exact financial rows, replay digest, retained counts and all ten retained relation
digests are preserved in the [accepted result](issue-133-connected-staging-c03-result.md).
Claude's evidence review is not a claim that Claude executed SQL, repeated the
run or independently observed every live database fact.

## Disclosed hashing limitation

Claude **could not independently recompute SHA-256 because of its shell allowlist**.
The Program Lead had already mechanically verified the exact evidence SHA-256
and fully recomputed the record sequence, previous-hash and per-record hash chain:
**PASS**. The evidence identity above is that accepted Program Lead result.
This is a **nonblocking reviewer-tool limitation, not an evidence defect**.
Do not attribute independent hash recomputation to Claude or rerun accepted
verification merely to remove this disclosed limitation.

## Nonblocking observations to carry forward

| Observation | Required interpretation / follow-up |
| --- | --- |
| Replay-money response says synchronization `PENDING` after canonical reader `COMPLETE` | Financial data is correct; response payload is stale. Before operator wiring, correct the response or explicitly make canonical reader truth authoritative. **IMPORTANT BEFORE FINANCIAL WORKFLOW ACTIVATION / not a C03 blocker.** |
| Receipt `invoice_id=NULL` | Accepted receipt/invoice independence contract. Operator/accounting surfaces must reconcile receipt → transaction → invoice; do not assume a direct receipt → invoice link. |
| Business protection flags not directly echoed as evidence rows | Program Lead independent post-run read confirmed them; communication counts stayed zero. Evidence-schema improvement only. |
| `event_sequence` allocated globally | Weak platform-volume inference is possible if raw sequence numbers are exposed to tenants. Bounded multi-tenant observability/privacy review; **DESIGN FOR NOW / BUILD LATER** unless a customer surface exposes it. |
| Settled attempt retains `recovery_disposition=RECOVER` | Canonical `operator_state=RECORDED` is correct. Future readers/workers must not use recovery_disposition alone as live recovery truth. Important guard before wiring. |
| Proof breadth | Concurrency, failure recovery, refunds, other payment shapes, application UI, Production and GVM remain unproven by C03. |

## Mandatory acceptance statements

- Connected Staging backend proof is accepted **only for this exact CAD50 deposit path** on `wnfahklzaxirftyskctd`.
- **C03 is CONSUMED and must never be rerun/reused.** C01/C02 remain preserved, consumed `STOP_ZERO_WRITES` history and also must never be rerun/reused.
- This is **not Production approval, GVM Operational Acceptance, technician resumption, communications/provider activation, #153 closure or additional financial execution authority**.
- It does not accept the full Booking Sheet / Quick Appointment UI, authorize workers or historical repair, authorize migration/RLS/ACL changes, or establish broader concurrency/refund/payment-shape acceptance.
- Application wiring/UI, worker, #153, broader hosted acceptance, Production and GVM gates remain open; default-off behavior and retained-cohort exclusions remain in force.

The next boundary is local source/read-only design preparation for separately
reviewed canonical aggregate/Reporting/CRM/operator integration and booking
recovery wiring, carrying the observations above and actual writer/#153
dependencies. The [result's next governance boundary](issue-133-connected-staging-c03-result.md#preserved-predecessors-and-next-governance-boundary)
records source dependencies and subsequent review/approval requirements. This
documentation closeout authorizes no implementation or automatic financial run.
