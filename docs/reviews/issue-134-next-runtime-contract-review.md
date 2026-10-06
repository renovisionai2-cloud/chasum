# Issue #134 — next runtime contract: final independent review

## Current gate
**CLAUDE READY_FOR_PO_GATE / DESIGN ONLY / NOT IMPLEMENTED.** The Product Owner approved continuing after C01; the team completed factual publication and a new bounded design. The proposed appointment/customer attribution rule and its prepared-only implementation are the next consequential decision, not already approved runtime behavior.

C01 closeout is committed and pushed as `88af990cd1ac929546692203a9e94a0a0719ce85`. Its exact 38-line evidence is now in Git, unchanged at SHA-256 `b452e9f8f850571989526b36bacbcf3868daff6e240b4d4ec1dac42a6e292a94`. The C01 package, all nine pins, Run02 evidence and both applied migrations remain unchanged. C01 was not rerun. The C01 actual result, scope and dated hosted observations remain in [its result record](issue-134-hv134-c01-result.md).

## Exact reviewed proposal
[Design contract](issue-134-next-runtime-contract.md)

SHA-256: `33af6e34083c43730137f2fa0b748ed735de6c985980ffffe53ccb6c08961f0f`.

The proposal's final sentence says independent review pending because that was its authoring-time state. This separate final review supersedes that status only; the reviewed proposal bytes have not been edited after acceptance.

One concrete decision is proposed: a durable appointment-linked ledger row freezes its appointment/customer attribution and blocks hard-deletion of that appointment. This includes pending and failed/canceled legacy ledger history, not merely succeeded payments. No-ledger requests do not freeze attribution. Other supported appointment edits remain allowed. Financial-history cascades may also block customer/Business hard-deletion; ordinary correction before financial history and cancel/new correctly attributed appointment afterwards remain the bounded alternative. No financial transfer/merge/offboarding engine is introduced.

Prepared-only scope is the contract's section 5: one new additive unique/composite-FK migration, a narrow legacy NULL-attempt-linked appointment guard, named-error mapping, focused tests and disposable-local database proofs. Accepted canonical guards and R1a SECURITY INVOKER functions remain unchanged. No migration, application code, test implementation, or hosted validation was authored or run in this design task.

## Team and corrections
- Sole design author: GPT-5.6 Sol/Cursor, session `1edf24c9-a0ef-435b-aeda-67fa725ee8a8`; initial reported model GPT-5.6 Sol 1M High, correction reported GPT-5.6 Sol 272K High.
- Independent reviewer: Claude, session `179646e9-e34c-479f-9ad6-d01893f8c05f`, reported Claude Opus 5 300K High. Targeted source review only; no reviewer SQL/tests/hash recomputation. Coordinator independently computed the proposal hash.
- Initial HOLD corrected existing SET NULL/FK interactions and disclosed deletion/teardown impacts, narrowed the new guard to legacy appointment-linked rows without duplicating accepted canonical protection, and named the legacy customer-only exposure as a pre-activation #153 residual.
- Coordinator also corrected premature permission-revocation sequencing and overbroad no-deadlock/retry claims. Unknown outcomes remain canonical recovery/hold, not new collection or a new key. Approved invoice/receipt policy remains intact.
- Claude explicitly corrected its initial C01 cascade-exposure statement: C01 is attempt-linked and already protected by the accepted DELETE guard. Only legacy NULL-attempt/NULL-appointment rows remain the named residual.
- Final verdict: **READY_FOR_PO_GATE; no genuine blockers remain.** Existing C01/foundation/R1a audits were not restarted; Grok was not needed for an unresolved method ambiguity.

## Implementation clarifications, not scope changes
The proposed trigger is explicitly **BEFORE UPDATE OR DELETE, FOR EACH ROW**. Its old-row predicate and error identifiers are fixed by section 5; canonical guard fires first alphabetically. The phrase about no existing table changes in the adjacent security sentence means no existing **table ACL** changes; the two new constraints are the explicitly authorized proposed schema delta. The foundation DELETE citation's relevant raise is within the quoted range. These routine clarifications do not modify the reviewed proposal or add objects.

## Required proofs and remaining boundaries
Concurrency, FK/cascade behavior, RLS-role coverage, named error mapping, index/lock budget, existing-data compatibility and ordinary booking/refund regression must actually pass in a disposable LOCAL database before a separate Staging application gate. No live compatibility claim or executable-test pass follows from this design review. Existing 90 synthetic rows/CAD181 and their retained financial history are not touched by preparation and must be preserved at any later approved application.

#153 remains open, including the legacy customer-only residual and SEQ-ACL-1. Do not revoke permissions until replacement writers, projections, durable fresh-booking recovery and all supported sources are ready for coordinated cutover. #133 intent/outcome evidence, invoice/receipt/CRM/communication synchronization, default-deny worker eligibility, responsive operator workflows and a separately controlled Production release remain necessary. Future workers must exclude/gate the retained cohort; do not sweep existing PENDING obligations.

No Production/GVM action, #135 release, historical USD repair, permissions/flags, merge, worker activation, new payment, or technician resumption occurred. **GVM Operational Acceptance is not earned.**

## Final Claude report
The report below is the returned final source review, not a reconstructed or executed database audit.

```markdown
# CLAUDE — DELTA RE-REVIEW: corrected docs/reviews/issue-134-next-runtime-contract.md

## VERDICT: READY_FOR_PO_GATE

No genuine blockers remain. B1–B3 are resolved by method, not by wording, and each
resolution is verified against source. Only routine document nits remain; they are not
for owner approval.

## Correction to my prior review

My earlier B3 wrongly named C01 as cascade-exposed. `guard_commerce_attempt_ledger_link`
rejects DELETE whenever `payment_attempt_id IS NOT NULL`
(`20261004190341_issue_134_payment_attempt_foundation.sql:201-205`), and C01's
customer-only ledger is attempt-linked, so it is already protected. The residual is
legacy NULL-attempt / NULL-appointment rows only. §3 now states exactly that.

## Delta verification (independent, read-only)

**B1 — referential-action coexistence: resolved.** §1.3 keeps the accepted
`appointment_id → appointments.id ON DELETE SET NULL` (`028_commerce_platform.sql:176`)
and adds `ON DELETE NO ACTION` alongside it. I traced both orders. If SET NULL fires
first it issues `UPDATE commerce_transactions SET appointment_id = NULL`, which for
canonical rows trips `PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH` (foundation `:229-233`,
since `attempt.appointment_id` is non-NULL) and for legacy rows trips the new guard. If
NO ACTION fires first it finds the referencing row and raises 23503. Either order
rejects, as §2 claims. Critically, §2 does **not** claim NO ACTION restores tenant
teardown: it discloses that "financial-history cascades may also block customer or
Business hard-deletion," and §8(a) folds that into the owner ruling. That is the honest
resolution I asked for.

**B2 — guard overlap: resolved.** The new guard is scoped to
`OLD.payment_attempt_id IS NULL AND OLD.appointment_id IS NOT NULL`, so canonical rows
stay owned solely by the accepted trigger. Trigger firing order is correct as stated:
same-event BEFORE ROW triggers fire by name, and `commerce_transactions_attempt_guard`
sorts before `commerce_transactions_legacy_appointment_attribution_guard`. The legacy
path is real, not theoretical: for a NULL-linked row the accepted guard passes through at
foundation `:215` (`if new.payment_attempt_id is null then return new`), leaving a true
gap the new guard fills. Two distinct named errors with 23514, and booking mapping
restricted to 23503 plus the exact FK constraint name, make the operator error
deterministic. `appointment_id` NULL→non-NULL attachment is allowed because `OLD` is then
NULL, matching §3; re-linking an existing row is still blocked by
`PAYMENT_ATTEMPT_LEDGER_LINK_IMMUTABLE` (foundation `:208-209`).

**B3 — coverage claim: resolved and properly bounded.** The "covers … at the database
boundary" overclaim is gone. §3's "Open #153 residual" names the exposure
(`commerce_transactions.customer_id ON DELETE CASCADE`, `028:175`), states it is outside
this package, and declares it blocks activation/cutover. §6 row 7 proves the residual
rather than hiding it. I accept this as an explicitly bounded pre-activation residual.

**C4/C5 corrections.** The deadlock claim is correctly downgraded to "no direct cycle …
not a global no-deadlock proof." The recovery rule is grounded in real schema:
`recovery_disposition in ('RECOVER','DO_NOT_RETRY','NEW_ATTEMPT_ALLOWED')` exists at
foundation `:47-48`. §4 permits re-entry to canonical recovery for the same attempt key
only on confirmed rollback, treats timeout/missing response as UNKNOWN hold, and forbids
automatic retry of the financial effect. No blind retry is introduced.

**Specificity for prepared-only build.** Constraint names, function name, trigger name,
trigger order, both SQLSTATEs, both error identifiers, the mapping rule, the EXECUTE
revoke, and seven exact file paths are all fixed. No architecture guessing remains.

**Ordinary-update and customer-only allowances stay clear.** Reschedule and resize pass
the existing `customer_id` through (`reschedule.ts:51`, `resize.ts:46`), so no key column
changes and no FK check fires; cancel is a soft status update (`cancel.ts:33`), so the
"archive/cancel rather than erase" alternative in §2 is a real path in existing code, not
an aspiration. Customer-only NULLs remain outside the relation via MATCH SIMPLE, which is
safe only because `business_id`/`customer_id` are NOT NULL (`028:174-175`) — §1 now
states that dependency.

**Hard-deletion impact and cutover order.** The four appointment-delete scripts are cited
with correct ranges and labelled compatibility sources, not things to run. §7 now
sequences #153 after replacement writers and projections rather than before, and does not
remove legacy permissions while active surfaces depend on them.

## Non-blocking nits (routine; do not route to owner)

Foundation DELETE-branch citation `:200-204` should be `:201-205` (line 200 is `begin`;
the raise is at 203, so the range still contains it). §5's "make no existing table …
change" is ACL-scoped by context but sits next to adding a UNIQUE constraint to
`appointments`. The new trigger's event list (BEFORE UPDATE OR DELETE) is implied by
`OLD`-scoping but never written.

## Limitations

Targeted read-only source inspection only. I ran no SQL, tests, build, or hosted check,
and I did **not** recompute `33af6e34…1f0f` — that hash is a supplied coordinator claim.
I did not open the `/tmp` round-1 archive; my delta baseline is the round-1 text I read
in this session. Trigger ordering, lock behavior, and both interleavings are verified by
source and documented PostgreSQL semantics, not by execution; §6 remains the required
proof. The #153 residual is accepted as bounded and pre-activation, not closed.

## Permissible owner decision

Only: **(a)** the product rule that a durable appointment-linked ledger row permanently
freezes appointment/customer attribution, blocks appointment hard-delete, and may block
related customer/Business hard-deletion; and **(b)** the exact §5 prepared-only
allowlist. Approval authorizes local implementation and local proof only. It authorizes
no migration application, hosted validation, #153 change, projection execution,
activation, merge, release, Production/GVM action, or GVM Operational Acceptance.
```
