# Issue #134 / #158 durable booking-operation implementation

Date: 2026-10-08
Status: PREPARED ONLY / UNWIRED / DEFAULT-OFF / STAGING SCHEMA APPLIED ONCE / POSTCHECKS PASS / INDEPENDENT RESULT AUDIT PENDING
Product Owner authorization: Issue #158 exact prepared-only implementation under the reviewed #134 contract

## Current gate — exact #158 Staging schema application succeeded / postchecks PASS / independent result audit pending

Darshan explicitly approved one exact #158 schema application to governed Staging project `wnfahklzaxirftyskctd`. A preliminary coordinator wrapper attempt stopped before calling Supabase because it misread the local hash-check result object; it performed no hosted mutation. The corrected wrapper rechecked migration history (no existing #158), revalidated the local source SHA/size, reconstructed the exact 83,565-character SQL payload, and invoked native `apply_migration` exactly once. Supabase returned `success:true`. No retry or second migration application occurred.

**Applied candidate:** `supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql`, local and hosted stored SHA-256 `01b10f8c629cc73b08d6c5849160836b90cbc87beb29d7c8b78857375fe2493b`, 83,565 bytes. Hosted history now records exactly one entry `20261009035548 / issue_134_durable_booking_operation`, one stored statement at the exact accepted bytes/hash. Foundation `20261005032107 / dee700ae...`, R1a `20261005170446 / 4b7e3855...`, and Attribution `20261007170242 / fd673cbf...` remain byte-exact; #133 is absent from hosted migration history. **Do not reapply #158.**

Read-only catalogue postchecks PASS: `commerce_booking_operations` exists; `appointments.booking_operation_id` and the pre-existing `commerce_payment_attempts.booking_operation_id` exist; actor-recovery, appointment-operation and attempt-operation indexes exist; both guard triggers exist; all eight expected functions exist; new booking-operation row count is zero; all current attempt/appointment operation links remain zero. Functions are `SECURITY INVOKER` (`prosecdef=false`) with `search_path=pg_catalog, pg_temp`, owned by the existing posture, and ACL `{postgres=X/postgres,service_role=X/postgres}` only. The new table has RLS enabled, FORCE RLS false, zero policies, no anon/authenticated SELECT/INSERT/UPDATE, service_role SELECT+INSERT, no service_role DELETE/TRUNCATE, and UPDATE only on `lifecycle_state`, `close_reason`, `replacement_customer_id`, `closed_at`, `updated_at`; tenant/identity fields have no service-role UPDATE. Required FKs/checks/index definitions and trigger bindings match the migration contract.

The frozen pre-application operational/financial data baseline is byte-stable after application. Counts/digests remain exactly: Businesses `6 / 49a44849fd5c61aa75070720ee6c68d69fffac529d9fee84592ca4b3b218eafd`; Customers `6 / 398301018e7e92ad5279ac441ce08953ed4b76b5edd95fafbc1d5045e15c7525`; Appointments pre-existing columns `13 / fdf113eb9b06d55f55bf0991ab8a2991cfc704902fd65c4a3d1d7e07183f82ee`; Appointment resources `0 / e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; Attempts `6 / ed9f221358f53afac119a3841042807884545a480c8474b16e66932e38a9137c`; Attempt events `11 / 690e347f076f6482ab91ca0da9bceeb70a2645b8c99f74e169416bc6d9f3bf64`; Reconciliation obligations `16 / e4080793b4aa70aa03f78f12270b169918c6dbec98fa3db41b6c56f7c8f71b32`; Transactions `6 / ff2fe7b24fdd1407ba0b918a4b4ab0ee5fa8da73dfa90c43a43a9e40a77979f6`. No existing operational or financial row was rewritten.

This is **schema application only**. No #158 function was invoked; no synthetic booking/payment/customer row was created; no admission/worker/projection was activated; no #133 migration was applied; no #153 permission change, communication/provider call, Production/GVM action, historical repair or technician resumption occurred. The application result now awaits independent Claude read-only audit. After that acceptance, the next safe continuation is a fresh #133 Staging compatibility preflight on the newly completed dependency schema before any #133 application request.

## Historical local gate — local database proof #6 accepted / prepared-only local gate closed

**DATABASE PROOFS #1–#5: HISTORICAL FAILED ATTEMPTS — preserved, not rewritten.**

**DATABASE PROOF #6: PASSED / INDEPENDENTLY ACCEPTED.**

Claude Opus 5 High independently returned `LOCAL_DATABASE_PROOF_6_ACCEPTED` for exact candidate `ff063bab8acbfb996c75fa8d7fa79ef2e838f303` / tree `9b22daeab43fd961faf7d9df93e586d311df2718`. The exact corrected migration is SHA-256 `01b10f8c629cc73b08d6c5849160836b90cbc87beb29d7c8b78857375fe2493b`, 83,565 bytes. The backend remains PREPARED ONLY / UNWIRED / DEFAULT-OFF and the migration remains authored only / not applied to any hosted environment.

Retained Proof #6 evidence directory: `chasum-issue134-durable-evidence-SadzsY`. Frozen evidence identities:

- `summary.json` — SHA-256 `319b2f8f9f34f5865ea74a82587d38bf2cf58b382305eb3eea7b29386602e05d`, 7,871 bytes.
- `phases.jsonl` — SHA-256 `5ae2190e68681de5cd81bafb4ed5ca37fa9808fe78f80dfe0501b8eaf82cc744`, 17,076 bytes.
- `concurrency-responses.json` — SHA-256 `414f9a10b2911b3eddac20730a6b43429c4d5e6c3dca0afa0110619162f82684`, 3,116 bytes.
- `postgres.log` — SHA-256 `667d11f34fc1317dd0bf0a5a703bcb88b23ebd165834f913b6ed1cad99403048`, 5,792 bytes.

Proof #6 genuinely completed on PostgreSQL 17.11 (Homebrew): source identity before/after matched exactly; `ISSUE134_DURABLE_SQL_CONTRACT_PASS` was reached; all nine concurrency scenarios completed; all five recovery boundaries completed; revoked authorization and final reconciliation completed; `stopConfirmed=true`; `pgdataRemoved=true`; `passed=true`; `originalFailure=null`; `cleanupFailure=null`; final counts were `18|10|4|16`. The four deliberate lost-response boundaries were classified UNKNOWN before canonical read and never invited recollection; known rollback proved zero durable operation/attempt/appointment/ledger effect.

Runtime acceptance includes same-operation and NULL-staff one-appointment identity, RECORDED+REPLAY on the same transaction under concurrent commit, both close/create lock orders, both close/commit lock orders, `NOT_COMMITTABLE|f` when close wins before commit, canonical lost-response recovery at bootstrap/appointment/bind/money boundaries, equal-value distinct payment intent, tenant/browser/revoked-access denial, exact four PENDING obligations, and microsecond cursor/history behavior.

The local database-proof gate for the prepared-only Issue #158 candidate is **CLOSED / ACCEPTED**. This does **not** authorize Staging application, hosted PostgREST/application behavior, UI wiring, projections, communications, #133 public/Summer reporting, #153 permission cutover, Production, GVM operational acceptance, or technician deposit/payment resumption.

Per the locked contract sequence, the next safe continuation is **projection/#133 design preparation**: appointment cache, invoice settlement, receipt, CRM/customer-payment-event uniqueness/idempotency and canonical #133 reader design, with communications remaining OFF. No Staging application occurs yet. After separately reviewed projection design/implementation, the later connected Staging gate requires a fresh read-only preflight and exact Product Owner migration/application approval using only a new synthetic cohort; retained Staging cohorts/obligations remain untouched.

## Previous gate — post-proof-5 commit terminal-state correction (historical)

**DATABASE PROOF #1: FAILED — fixture UUID default mismatch.**

**DATABASE PROOF #2: FAILED — bind `appointment_id` ambiguity.**

**DATABASE PROOF #3: FAILED — unsupported `min(uuid)`.**

**DATABASE PROOF #4: FAILED — verifier parsing after successful NULL-staff admission.**

**DATABASE PROOF #5: FAILED — PRODUCT MIGRATION / COMMIT CONTROL-FLOW DEFECT.**

**DATABASE PROOF #6: NOT RUN.**

Starting candidate: `2a9581310f5880b9c092edf7057b40f510eaeb0a`. This bounded correction changes only the product migration's commit function, the existing migration/static and kernel tests, and this report. The contract remains SHA-256 `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d`. Corrected migration bytes are authored only and have not been applied anywhere. Older sections below are historical snapshots, superseded by this gate.

### Proof #5 evidence and limits

Retained evidence `chasum-issue134-durable-evidence-5boTKR` reports `fixtureSetup=PASS`, eight completed concurrency/fence phases and no recovery phases. It passed the full SQL contract: corrected fixture/bind/reader paths; inventory and protected digests; fingerprints and KEY_CONFLICT; canonical deposit commit/replay/read with four PENDING obligations; no-payment; repeated no-ledger correction and attribution protection; PII-free history/cursor precision; equal-value distinct attempt keys; tenant/browser denial. It then passed same-operation bootstrap, inline email/phone, same-operation appointment, same-attempt commit, NULL-staff appointment, close-before-create, create-before-close and commit-before-close races.

The close-before-commit holder returned `CLOSED` and COMMIT at exit 0; the blocked commit also exited 0 but returned `UNKNOWN|f`, versus expected `NOT_COMMITTABLE|f`. The close source correctly closes/cancels and fences REQUESTED to FAILED/DO_NOT_RETRY with a FAILED/NOT_RECORDED event. Commit's generic lifecycle/cancellation gate ran before terminal evidence handling, masking conclusive terminal zero-ledger truth. The verifier correctly rejected that behavior. Recovery phases did not run. Retained cleanup fields are `stopConfirmed=true`, `pgdataRemoved=true`. Evidence is unchanged; no overall proof PASS is claimed.

### Branch ordering and contract reconciliation

Sections 8, 9, 10 and the section 15 cancellation fault matrix require terminal zero-money truth, explicit SKIPPED no-payment, and replay of previously recorded money. The correction preserves authorization, advisory locking, exact attempt/Business/operation lookup, appointment binding lookup, operation actor check and shared identity checks before any financial classification.

Order is now: locked identity → ledger/requested-event/accepted-event/obligation census → certified FAILED/SKIPPED terminal branch → original positive-tender checks → unchanged ACCEPTED replay block → active lifecycle/not-cancelled gate → unchanged REQUESTED evidence checks → unchanged financial writes.

The terminal branch requires zero attempt-linked ledger rows, one REQUESTED/NOT_RECORDED event, no ACCEPTED/RECORDED event, no obligations, exactly one matching terminal NOT_RECORDED event, exactly two lifecycle events, resolved_at and DO_NOT_RETRY. Event failure metadata must match the attempt. FAILED additionally requires the canonical close failure pair (CONFLICT/KEY_CONFLICT or VALIDATION/INVALID_REQUEST) and a valid positive manual tender. SKIPPED requires the exact none/zero/null-tender/null-failure tuple. Contradictory counts, malformed metadata, uncertain failures or missing terminal evidence return UNKNOWN before NOT_COMMITTABLE. SKIPPED is never changed to FAILED.

Identity/binding failures still return UNKNOWN: this does not broaden the RPC to unbound/missing appointments or contradictory customer identity. Zero ledger is certified for this exact attempt, not an assertion that the appointment has no other legitimate payments. No recovery disposition, new attempt, retry or write is introduced by terminal classification.

Sibling ordering findings corrected: the original positive-tender gate masked SKIPPED's valid no-payment tuple; the lifecycle/cancellation gate also masked ACCEPTED replay after cancellation; and the old terminal branch could report NOT_COMMITTABLE without checking ledger/event/obligation consistency. ACCEPTED's one-exact-ledger, event-count, four-obligation and tuple checks remain byte-identical. REQUESTED + CLOSED/cancelled remains UNKNOWN regardless of zero count; any new write still requires all original active-booking/tender/evidence checks. ACCEPTED with zero/multiple/mismatched ledger evidence remains UNKNOWN. No unrelated reader/kernel behavior or permission/schema contract is changed.

### Tests and offline validation

Eight new static cases guard exact identity/lock ordering; FAILED and SKIPPED before lifecycle/tender rejection; contradictory ledger/event/obligation rejection; resolved terminal metadata; byte-identical ACCEPTED replay checks before cancellation gating; REQUESTED UNKNOWN/write gating; and absence of writes before terminal/replay returns. Against the exact old migration, the expanded static suite failed (6 failures / 44 passes). Three kernel tests cover cancelled FAILED/SKIPPED operator truth and cancelled ACCEPTED replay without duplicate payment calls or appointment creation; these use mocked database outcomes and do not execute SQL.

Validation PASS: focused suites 5 files / 91 tests (50 migration/verifier tests); scoped booking/booking-engine/commerce/migration/customer/notification suites 75 files / 739 tests; typecheck; changed-path ESLint; webpack build with telemetry disabled and OS-level network denial; verifier syntax and help/no-argument/wrong/extra refusal matrix (0/2/2/2); diff check; exact four-path allowlist; protected Foundation/R1a/attribution/contract/fixture/verifier hashes. Seven sibling SQL functions, the financial-write block, kernel implementation and all pre-existing regression tests remain byte-preserved. Static/source tests and mocked kernel results are not PostgreSQL proof. Verifier execution is limited to syntax/help/refusal gates; proof #6 is not run.

Prior fixture UUID default, bind aliases, reader C-collated UUID aggregate, cursor precision, verifier parser/result-consumption corrections, Section 14 vectors and safety controls are preserved. No hosted/shared environment, Staging, Production, GVM, provider, projection, communication, UI/action, #153 permission or historical financial action occurred. No push or PR activity. Competitive Product Gate: NOT APPLICABLE — bounded bug correction to the locked financial-truth contract. Independent review and a fresh governed gate are required before proof #6.

## Previous gate — post-proof-4 verifier parsing correction (historical)

**DATABASE PROOF #1: FAILED — fixture UUID default mismatch.**

**DATABASE PROOF #2: FAILED — bind `appointment_id` ambiguity.**

**DATABASE PROOF #3: FAILED — unsupported `min(uuid)`.**

**DATABASE PROOF #4: FAILED — verifier output-parsing defect after successful NULL-staff bootstrap admission.**

**At this prior correction, proof #5 had not run; its subsequent product failure is recorded above.**

Starting candidate: `38f2634e1da44503cf35b6434ef0d673fb043455`. This correction changes only the verifier, its existing migration/static test file and this report. Product migration is byte-identical: SHA-256 `49a5e3b8d8247d786878de34b3a9f021e44a4972453e17908add9c70dc9000d5`, 80,631 bytes. No new product defect was identified. The latest governed prompt and current section supersede older proof-state snapshots; historical correction sections below retain their dated scope.

### Proof #4 evidence and acceptance boundary

Read-only inspection of retained `chasum-issue134-durable-evidence-G8nSZ2` confirms `fixtureSetup=PASS`, the `ISSUE134_DURABLE_SQL_CONTRACT_PASS` marker, four completed concurrency phases, then phase `concurrency:null-staff:bootstrap` with exit status 0, stdout `SET\nADMITTED\n` and empty stderr. The summary failure is `NULL-staff operation was not admitted: SET\nADMITTED`. This is a harness parsing defect, not failed database admission or a product migration/function defect.

The run passed the corrected fixture UUID default, bind aliases and reader UUID aggregate; 23-delta schema inventory; protected fixture/migration digests; cross-language nested-resource fingerprint; changed-tuple KEY_CONFLICT determinism/idempotency; canonical deposit commit and same-attempt replay; exact canonical read and four PENDING obligations; PII-free history; explicit no-payment; repeated CLOSED no-ledger customer correction; appointment-linked ledger reassignment protection; non-null history cursor/microsecond precision/deterministic pagination; two deliberate equal-value attempt keys; cross-/foreign-tenant denial; and browser-role denial.

The recorded concurrency passes are same-operation bootstrap, independent inline email/phone identity, same-operation appointment and same-attempt payment commit. **Only NULL-staff bootstrap admission completed; the NULL-staff race did not pass or run.** Later close/create and close/commit races, lost-response recovery boundaries, known-rollback comparison and final revocation/reconciliation/source-identity completion remain unproven by this run. No overall database-proof PASS is claimed. Retained summary confirms `stopConfirmed=true` and `pgdataRemoved=true`; evidence is unchanged.

### Exact parser correction and sibling sweep

`sql()` previously returned all of `stdout.trim()`, so psql command tags contaminated comparisons. It now delegates to the existing `finalRow(command(...))` helper. `finalRow` ignores blank lines and only exact standalone SET, RESET, BEGIN, COMMIT, ROLLBACK and UPDATE n tags before returning the final semantic line. It neither searches for a successful outcome nor changes the strict ADMITTED equality. Wrong/unknown outcomes and extra business fields remain visible to the original checks. This is normalization, not a claim that a transaction committed; transaction outcome and durable-state assertions remain separate.

All synchronous `sql()` calls and direct psql wrappers were inspected. Genuine sibling false-fail sites corrected through the shared helper:

- `setupBoundOperation` admission checks used by the commit/close fences and commit-recovery setup.
- `exactRecoveryEvidence` tuple comparisons at bootstrap, appointment, bind and money-commit recovery boundaries.
- Bootstrap recovery's EXISTING replay; appointment and bind recovery's ADMITTED setup checks; appointment/bind EXISTING replay tuples; money-commit REPLAY tuple.
- The NULL-staff first race result ends with a sleep result and COMMIT; the original helper would select COMMIT instead of CREATED|appointment_id. Filtering the exact trailing command tag preserves the same semantic-row convention.

Three related asynchronous result-consumption defects were also found: `finalRow` received unresolved Promise objects for closeAfterCreate, cancelAfterCommit and commitAfterClose even after `Promise.all` completed. Those checks now read the corresponding already-settled `[1]` result from createFirstResults, commitFirstResults and closeBeforeCommitResults. Original expected prefix/suffix checks and process-status checks are unchanged.

Single-SELECT IDs/counts/activity probes have no command-tag prefix today. Setup persistence tuple extraction already preserved the second pipe-delimited field, but now receives clean normalized text too. Ignored setup/bind/rollback outputs remain ignored; known-rollback acceptance still depends on its separate zero-count query. Cluster binding/version wrappers are unprefixed single SELECT/SHOW calls and remain unchanged. No other same-class comparison defect was found; this is a bounded source sweep, not an end-to-end verifier proof.

### Offline regression and safety evidence

Added 21 offline tests to the existing migration/static suite. They extract only command/sql/finalRow function definitions and execute them in a VM with an inert spawn stub; the verifier module is never imported or started. Cases cover exact and SET-prefixed ADMITTED, CRLF and transaction/status tags, wrong outcomes and misleading earlier success, empty/status-only output, six exact replay/recovery tuples, trailing COMMIT, and failed process status despite successful-looking stdout. Three tests execute the actual fence-check expressions with resolved results and Promise variables to protect all asynchronous sibling corrections. Raw stdout phase recording is also asserted.

Against the old verifier, the expanded suite failed with 18 failures / 24 passes. After correction: focused suites 5 files / 80 tests (42 migration/verifier tests), scoped suites 75 files / 728 tests, typecheck, changed-path ESLint, verifier syntax and help/no-argument/wrong/extra refusal gates (0/2/2/2) PASS. No valid confirmation invocation or PostgreSQL execution occurred. A build was not rerun for this verifier-only task; it was not requested in this correction's validation list.

Verifier SHA-256: `b2195bd846bcbb32f835a4dfb509b4f78a2dc2460a0a043c670c640af04160f2`.

The exact confirmation gate, loopback-owned cluster setup, sanitized child environment, source identity before/after, raw phase recording, concurrency-response capture, failure evidence retention, confirmed shutdown and dual ownership-marker deletion fence are unchanged. Product/Foundation/R1a/attribution migrations, contract, fixture, cursor implementation/tests and all accepted evidence remain unchanged. Diff/allowlist and protected hash checks passed. Reversing only the reviewed parser edits reconstructs the parent verifier byte-for-byte, independently confirming that all other controls are unchanged.

No database, hosted/shared environment, Staging, Production, GVM, provider, projection, communication, permission, historical-data or UI/action change occurred. No push or PR action. Competitive Product Gate: NOT APPLICABLE — narrow verifier maintenance preserving the approved product/proof contract. A fifth disposable-local proof requires a separately governed gate.

## Previous gate — post-proof-3 reader correction (historical)

**DATABASE PROOF #1: FAILED — synthetic `appointments.id` fixture default mismatch.**

**DATABASE PROOF #2: FAILED — bind function ambiguous `appointment_id`.**

**DATABASE PROOF #3: FAILED — `read_booking_operations_v1` unsupported `min(uuid)`.**

**At this prior correction, proof #4 had not yet run; its subsequent harness failure is recorded above.**

This bounded correction starts from `8fc24ed7308267eba4f4d0abe48c7c9c88ff436b`. It changes one SQL expression, adds focused source regression tests and updates this report only. The latest governed prompt supersedes the older control-board/handoff proof status. The approved contract and all prior fixture, bind, cursor, Section 14 proof and verifier corrections are preserved. No PostgreSQL execution or hosted/shared environment access occurred during this correction. Revised migration bytes remain authored only / not applied anywhere.

### Proof #3 evidence and limits

The retained `chasum-issue134-durable-evidence-gTHvFc` summary pins input HEAD `8fc24ed7308267eba4f4d0abe48c7c9c88ff436b`, migration hash `5c5f8754fc45edf978b5bc5cefedfc495c003dbbb1b48f4d1244005b6ba33df3` and PostgreSQL `17.11 (Homebrew)`. Its contract phase exited 3 at fixture line 715 with `function min(uuid) does not exist`, identifying `min(transaction_row.id)` in the history reader's lateral ledger summary.

Proof #3 passed the corrected UUID-default fixture path and corrected bind path. Execution advanced through the commit call and into the reader block before history-mode parsing failed. The earlier positive schema/digest/fingerprint/KEY_CONFLICT markers are retained. This progress is not full reader or financial acceptance: the encompassing golden-path PASS marker was not reached. Downstream reader/operator-state, authorization, cursor, concurrency, recovery and remaining Section 14 outcomes are runtime-unproven. Do not treat the combined fixture's unfinished status as evidence that no SQL executed.

The retained summary confirms `stopConfirmed=true` and `pgdataRemoved=true`. Accepted evidence was read only and remains unchanged. A retained sandbox startup failure (`chasum-issue134-durable-evidence-SvPCHf`, `initdb` shared-memory permission denial) is an environment-start attempt, not an additional database proof; its occurrence does not renumber the three governed SQL proofs. No hosted/shared environment was touched by these disposable-local runs or this correction.

### Exact reader correction and financial truth

Replaced only `min(transaction_row.id)` with `min(transaction_row.id::text collate "C")::uuid`. PostgreSQL can aggregate text; canonical UUID text casts back to UUID. Explicit C collation gives deterministic bytewise representative selection independent of database locale, without materializing an array or adding another join/subquery.

- Zero rows: the aggregate and resulting UUID are NULL; ledger_count remains zero.
- One row: the exact transaction UUID is returned; ledger_count remains one.
- Multiple rows: a deterministic representative is returned while ledger_count remains greater than one. It is not financial proof. The unchanged SQL operator-state CASE permits RECORDED states only at ledger_count = 1 and otherwise yields UNKNOWN for multiple rows. Both canonical and history TypeScript parsers reject ledger_count > 1 before returning usable financial results.

The representative is not joined to any amount/customer/appointment/tenant fields. Existing history amounts come from the attempt; tenant and attempt filters remain in the lateral query. No amount, attribution or recorded-money truth is inferred from the chosen UUID when the count is invalid.

### Whole-migration aggregate / runtime-compatibility sweep

After stripping comments, the full migration contains 15 COUNT calls, four STRING_AGG calls, three JSONB_AGG calls and this one MIN call; no MAX, SUM, AVG or ARRAY_AGG occurs. This was the sole direct UUID min/max occurrence found in the repository migration search. Historical 006 examples and 007 contain MIN(created_at), so a literal claim that the entire repository has only one min/max occurrence would be inaccurate; those timestamp cases are not changed.

COUNT returns bigint; explicit integer narrowing and integer local assignments remain unchanged and would raise rather than wrap on overflow. STRING_AGG inputs are text (JSON/UUID values explicitly serialized), with explicit ordering and the existing empty-resource-array fallback. JSONB_AGG consumes JSONB objects, retains ordering and uses JSONB empty-array fallbacks. UUID-array UNNEST/WITH ORDINALITY, JSONB conversions, UUID text serialization, MD5-to-UUID conflict identity, typed timestamptz parameters/row comparison and timestamp formatting were inspected. Reader branches and both lateral aggregates were checked against their source types; no additional unsupported aggregate or cast combination was found in this bounded static sweep. This is not a runtime compatibility certification.

### Regression tests and offline checks

Four new static cases protect the complete tenant/attempt-scoped ledger_summary expression and unfiltered COUNT, reject direct UUID MIN and MAX mutants, and retain both recorded-state count gates plus UNKNOWN fallback. The full migration guard also pins its sole min/max expression. Against unchanged defective SQL the expanded suite produced 2 failures / 19 passes; after correction it passes. These source checks do not execute PostgreSQL or emulate aggregate runtime semantics.

Validation PASS: focused Issue #158 suites (5 files / 59 tests, including 21 migration tests); scoped booking/booking-engine/commerce/migration/customer/notification suites (75 files / 707 tests); `npm run typecheck`; changed-test ESLint; `npx next build --webpack` with telemetry disabled and OS-level network denial; verifier `node --check`; help/no-argument/wrong/extra refusal gates (0/2/2/2); diff whitespace, exact three-path allowlist and protected Foundation/R1a/attribution/contract/fixture/verifier hash checks. No exact-confirmation verifier execution or PostgreSQL process was started. The full migration is byte-identical to the parent except for the one aggregate expression; cursor implementation/test and all prior proof sources are unchanged.

Competitive Product Gate: NOT APPLICABLE — narrow compatibility correction with locked reader semantics. No UI/action wiring, admission, provider, projection, communication, permission or historical-data change. No push or PR activity. Any fourth database proof requires a separate governed gate.

## Previous gate — post-second-proof product migration correction (historical)

**DATABASE PROOF #1: FAILED — synthetic `appointments.id` fixture default mismatch.**

**DATABASE PROOF #2: FAILED — product migration `bind_booking_operation_appointment_v1` ambiguous `appointment_id` reference.**

**At this prior correction, proof #3 had not yet run; its subsequent failure is recorded in the current gate above.**

This prior gate superseded the earlier first-proof-only continuation in the dated control-board/handoff snapshots. Correction starts from `ef8c6a671c8683d5198160c97aeb9bb692c460d3` and preserves fixture-correction ancestor `4a43d893aa7fce8e38a658ff8ddea0e9dbcb901e`. The approved contract remains byte-identical at SHA-256 `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d`. No PostgreSQL execution is authorized or performed during this correction; the revised migration is authored only / not applied anywhere.

### Second-proof evidence and limits

The retained `chasum-issue134-durable-evidence-fYAIYP` summary and phase log identify input HEAD `ef8c6a6`, the old migration hash `805f49255069cf0cc0e831bd45986218246e982acdc35e75d8b25d91212cb727`, and PostgreSQL `17.11 (Homebrew)`. The contract phase exited 3 at SQL contract line 665. Its exact failure was `column reference "appointment_id" is ambiguous`, at the bind UPDATE predicate `and appointment_id is null`; PostgreSQL reported that it could refer to a PL/pgSQL variable or a table column. This is a **product function defect**, separate from proof #1's fixture mismatch.

The retained second-run stdout positively records PASS for the exact 23-delta schema inventory, protected pre-existing fixture digests, the TypeScript/PostgreSQL nested-resource fingerprint vector, and deterministic/idempotent same-key changed-tuple KEY_CONFLICT. The guarded admission and same-key EXISTING replay checks precede those markers. The golden-path appointment-persistence call completed and supplied its appointment ID to the failing bind call, so the original UUID-default failure was passed. This is execution progress, not complete appointment/binding/financial acceptance. The verifier confirmed shutdown and owned-PGDATA removal; original evidence is unchanged.

Binding did not complete. Manual money commit, its one-ledger/one-ACCEPTED/four-obligation outcome, exact/history readers and cursor boundaries, tenant/actor/revocation denial, equal-value distinct attempt keys, inline and appointment concurrency, close/create and close/commit races, repeated no-ledger correction, lost-response recovery at all four boundaries, rollback versus UNKNOWN, and NULL-staff same-operation concurrency remain runtime-unproven in the durable-operation proof. No complete database-proof PASS is claimed.

### Exact correction and eight-function ambiguity sweep

`RETURNS TABLE` creates PL/pgSQL output variables. The bind function declares `appointment_id`, so its unqualified expression in a table UPDATE is ambiguous under PostgreSQL's normal conflict checking. The correction adds `AS attempt_target` and qualifies `id`, `business_id` and `appointment_id` in that UPDATE's predicates. Its second UPDATE adds `AS operation_target` and qualifies `id`, `business_id` and `lifecycle_state`. PostgreSQL SET assignment targets remain bare column names; RHS record references stay qualified. No conflict-resolution directive, schema delta, signature, guard, locking order, comparison or authorization is changed.

| Function | Sweep result |
| --- | --- |
| `guard_commerce_booking_operation_v1` | NEW/OLD record references; no colliding SQL expression. Unchanged. |
| `guard_appointment_booking_operation_link_v1` | Aliased lookup predicates and NEW/OLD/record fields; no collision. Unchanged. |
| `bootstrap_booking_operation_v1` | Outputs include customer_id, attempt_id and execution_state; expression references are record-qualified or distinctly named. INSERT target lists are column targets; ON CONFLICT(id) has no same-named variable. Bare resource_id/lock_key/suffix_length query aliases do not match parameters/locals/outputs. Unchanged. |
| `persist_booking_operation_appointment_v1` | Output appointment_id appears bare only as an INSERT target column; expression references are qualified. Unchanged. |
| `bind_booking_operation_appointment_v1` | Confirmed appointment_id predicate collision fixed; all six target predicate column references in its two UPDATEs now explicitly qualified. |
| `close_booking_operation_v1` | Bare UPDATE predicates id/business_id/customer_id/status/execution_state and RHS closed_at do not match its current parameters, locals or output names. No current runtime ambiguity; unchanged. |
| `commit_booking_operation_manual_payment_v1` | Bare UPDATE predicates id/business_id/execution_state do not match its current parameters, locals or output names. attempt_id/transaction_id references are qualified or INSERT targets. Unchanged. |
| `read_booking_operations_v1` | Outputs are snapshot_at/payload; bare history CTE attention_rank/created_at/id do not collide. Other expressions are qualified. Unchanged. |

No sibling **current** PL/pgSQL name collision was found. No DELETE statement or dynamic SQL in these bodies needed correction. Wildcard SELECT/RETURNING projections and INSERT/SET target lists are not ambiguous variable expression references and were not rewritten. The seven sibling bodies remain byte-identical. Unqualified names that do not currently collide are recorded above rather than turned into an unrelated refactor.

### Static regression and offline validation

The existing migration test now extracts the bind body and checks both complete UPDATE shapes: target table, alias, assignments and tenant/identity/state predicates. Six mutation cases remove one qualification at a time and must be rejected; another guard rejects bare bind output/identity expressions while exempting the syntactically required SET target. It also rejects an ambiguous SET RHS mutant and conflict-resolution directives. These are bounded source guards, not a SQL parser or runtime proof.

Before the SQL edit, the expanded migration suite failed (8 new failures / 9 existing passes), demonstrating detection against the defective source. After correction, focused Issue #158 tests passed (5 files / 55 tests), and relevant booking/booking-engine/commerce/migration/customer/notification scopes passed (75 files / 703 tests). Typecheck, changed-test ESLint, verifier syntax and help/no-arg/wrong/extra refusal gates passed (0/2/2/2). `npx next build --webpack` passed with telemetry disabled and OS-level network denial. `git diff --check`, the exact three-path allowlist, and protected Foundation/R1a/attribution/contract/fixture/verifier hashes passed. The prior fixture-correction ancestor and UUID default remain intact. No exact-confirmation verifier run occurred.

Only the product migration, its existing static test, and this report change. The 23-delta contract and protected Foundation/R1a/attribution migrations remain unchanged. Competitive Product Gate: NOT APPLICABLE — narrow runtime-ambiguity correction to already-locked product behavior. No new remote/environment preflight was performed under the offline-only instruction.

## Original implementation candidate identity (historical)

- Branch: `codex/issue-158-durable-booking-operation`
- Authorized starting commit / parent: `afafc855634dc8d53b2a3cdf554ce1060c96a1b2`
- Remote-main observation at reconciliation: `31115e6a51b71fc097c279d205065d80e0be3573`
- Exact reviewed contract SHA-256: `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d`
- Exact implementation candidate commit: `5f9af16422310428852d343f65f140591d2dac86`
- Exact implementation candidate tree: `7b90c1a989a0ab159119c6bbabb830055d61c660`
- Candidate parent: `afafc855634dc8d53b2a3cdf554ce1060c96a1b2`

The candidate commit contains the 15 code, migration, test, proof, and changelog paths. This report is the 16th approved path and is committed afterward so it can record a real immutable candidate commit/tree; a Git object cannot embed its own hash.

## First disposable-local database proof — run once, failed

**Historical proof #1 result: FAILED. Current proofs #2–#5 also FAILED; proof #6 NOT RUN (see current gate above).**

The first Product-Owner-authorized disposable-local run used corrected candidate `b1f54b81b740a088b331f5ddbfd33a0c54c2dd09` / tree `ff4384f591a6d18982f7321cbb1923786629e277` on PostgreSQL `17.11 (Homebrew)`. Retained evidence is timestamped `2026-10-07T20:20:04–05-0400` and remains outside the repository in the system temporary evidence directory identified as `chasum-issue134-durable-evidence-8QXkp7`. No credentials or machine-sensitive evidence contents are copied into this report.

The run stopped in the SQL contract's golden-path `persist_booking_operation_appointment_v1` call with PostgreSQL status 3:

> `null value in column "id" of relation "appointments" violates not-null constraint`

The failing row had a null appointment ID because the accepted synthetic foundation fixture declares `appointments.id uuid primary key` without the UUID default used by the production schema and existing application appointment inserts. This is classified as a synthetic proof-fixture mismatch, not currently a product migration defect. The Issue #158 migration was not changed by that fixture correction; the later product correction is recorded above. The allowlisted contract fixture now models the production convention locally with:

```sql
alter table public.appointments
  alter column id set default gen_random_uuid();
```

Corrected proof-source SHA-256: `d32455b8ec6f6de154e89468ff606c59417bdaa47e2f7ccb9c4e4ed5335aa7aa`.

Before the stop, the run genuinely passed the 23-delta schema inventory, protected pre-existing fixture digests, the TypeScript/PostgreSQL nested-resource fingerprint vector, and changed-tuple `KEY_CONFLICT` determinism/idempotency. The repaired `issue134_fingerprint` helper executed successfully through admission. These assertions remain intact.

The proof stopped before runtime execution of history cursor order/`next_cursor`/sub-millisecond boundaries, cross-/foreign-tenant denial, two equal-value attempt keys, lost-response recovery at all four committed boundaries, known rollback versus `UNKNOWN`, and NULL-staff same-operation concurrency. Those deeper Section 14 vectors remain runtime-unproven; database proof has not passed.

Post-fixture-correction offline validation passed: focused Issue #158 suites (5 files / 47 tests), scoped booking/booking-engine/commerce/migration/notification suites (75 files / 695 tests), `npm run typecheck`, verifier `node --check`, verifier help/no-argument/wrong-argument/extra-argument gates (`0/2/2/2`), `git diff --check`, exact two-path allowlist verification, and protected source/migration hash verification. Changed-path ESLint is not applicable because this correction changes no TypeScript or JavaScript path. PostgreSQL and the verifier confirmation path were not run during the correction.

Failure cleanup behaved as designed: the verifier confirmed shutdown, removed owned PGDATA through its dual-marker safety fence, and retained failure evidence outside the repository. No Staging, Production, GVM, hosted service, credential, provider, permission, projection, communication, UI, worker, or historical financial action occurred. The separately governed second, third and fourth runs subsequently failed as recorded above; any fifth run requires a fresh governed Product Owner gate.

## Earlier bounded correction after independent audit (historical)

Claude independently returned `CORRECTIONS_REQUIRED_BEFORE_DATABASE_PROOF` for two bounded blockers. Darshan authorized correction within the existing Issue #158 allowlist at report HEAD `a293faa316784781a72fae60ac6dc00e7ed85ae5`; the implementation candidate under review remains the historical parent candidate `5f9af16422310428852d343f65f140591d2dac86`.

The correction changes exactly these five approved paths:

1. `lib/commerce/booking-operations/kernel.ts`
2. `tests/unit/commerce/booking-operation-kernel.test.ts`
3. `tests/postgres/issue-134-durable-booking-operation-contract.sql`
4. `scripts/verify-issue134-durable-booking-operation-postgres.mjs`
5. `docs/reviews/issue-134-durable-booking-deposit-implementation.md`

No migration, UI, action wiring, permission, configuration, provider, projection, communication, worker, accepted evidence, Staging, Production, GVM, or historical financial-record path changed.

Corrected source identities before the final documentation commit:

- `lib/commerce/booking-operations/kernel.ts`: SHA-256 `824e42146827d084caf701f0fc5d00d58b98c7748f7ca159c164f9f01b2e2634`
- `tests/unit/commerce/booking-operation-kernel.test.ts`: SHA-256 `d2dd3d860a1d5a58e7eb79ea779e9379a1d266c31586680ad1dbf47b967f5693`
- `tests/postgres/issue-134-durable-booking-operation-contract.sql`: SHA-256 `0f4f3ae3681d421cf8162f43082678f3f233d27762ea966b441ee790f947fa6d`
- `scripts/verify-issue134-durable-booking-operation-postgres.mjs`: SHA-256 `239981e3170dbdff5ec967581bd2b8ec7c359dd83c591aa65940d579441661c5`

The exact corrected branch commit and tree are recorded in the final delivery handoff immediately after the single authorized correction commit. They cannot be embedded into this same commit without changing both identities; unlike the original report-only child, this correction is intentionally one commit.

### B1 resolution — lossless history cursor

`decodeCursor()` now validates the exact PostgreSQL timestamp string with a bounded RFC 3339/PostgreSQL shape, real calendar/date/time/offset ranges, and parse validity, then returns the original bytes unchanged. It no longer reconstructs the cursor boundary with `Date.toISOString()`, so six-digit PostgreSQL fractional precision survives the base64url cursor and the `(attention_rank, created_at, id)` comparison. `encodeCursor()` applies the same fail-closed timestamp validation.

Focused reader tests drive two boundaries inside the same millisecond (`.123456` and `.123455`) through encode, decode, and successive pagination RPC arguments; they prove the encoded cursors remain distinct and the exact strings reach PostgreSQL unchanged. A malformed calendar date is rejected before the canonical reader is called.

### B2 resolution — complete Section 14 proof vectors

The disposable SQL contract and owned-cluster verifier now add executable coverage for every audit gap:

- same-key changed-tuple admission returns exact `KEY_CONFLICT`; the conflict event ID is recomputed from the documented deterministic tuple, its full financial classification is checked, and a second conflict replay leaves exactly one event;
- three rank-0 history rows include a same-timestamp UUID tie and a one-microsecond boundary; real non-null cursors paginate them in `attention_rank`, `created_at DESC`, `id DESC` order without skips or duplicates and preserve the six-digit cursor timestamp. Fixture-only timestamp seeding uses transaction-local `session_replication_role=replica` and positively asserts restoration to `origin` before reader proof;
- a second synthetic Business/customer proves wrong-actor reader, close, and commit denial, authorized foreign-tenant nonvisibility, and an `UNKNOWN` foreign-Business commit with byte-stable full-row digests across attempts, events, ledger, and obligations;
- two distinct attempt keys admit equal CAD50 payment intents under separate operation identities, with distinct operation IDs and request fingerprints;
- four deliberately discarded-response sessions commit bootstrap, appointment, bind, and money boundaries, discard stdout, terminate the client only after the session is observed sleeping after explicit `COMMIT`, classify the transport result as `UNKNOWN`, and then recover by canonical same-identity read before replay. Every stage checks the original attempt key, one operation/attempt, zero-or-one appointment as appropriate, zero-or-one ledger as appropriate, same-row replay, the exact durable transaction ID, and four—not duplicated—obligations after money commit. A separate explicit rollback proves zero durable operation/attempt/appointment/ledger effect. Evidence marks `recollectionInvited=false`;
- a bounded same-operation appointment race with `staff_id NULL` witnesses the first session after insert and the second blocked on the advisory lock, then requires exact `CREATED` plus `EXISTING`, the same appointment ID in both replies, and exactly one NULL-staff appointment row.

The verifier retains its exact confirmation flag, fixed PostgreSQL 17 binaries, loopback-only/socket-disabled cluster, minimal sanitized child environment, before/after source identities, append-only phase/concurrency evidence, confirmed stop, and dual-marker cleanup fence.

### Correction validation

- Focused Issue #158 suites — PASS, 5 files / 47 tests.
- Relevant booking/booking-engine/commerce/migration/customer/notification suites — PASS, 75 files / 695 tests.
- `npm run typecheck` — PASS.
- ESLint over every corrected TypeScript/JavaScript path — PASS.
- `node --check scripts/verify-issue134-durable-booking-operation-postgres.mjs` — PASS.
- Verifier `--help`, no-argument, wrong-argument, and extra-argument gates — PASS; statuses `0,2,2,2`, and every non-exact invocation refused before PostgreSQL binary inspection.
- `npx next build --webpack` — PASS; optimized production compilation, TypeScript, and 37/37 static pages completed.
- `git diff --check` — PASS.
- Allowlist and protected-hash checks — PASS.

Migration identity at that earlier correction remained byte-identical: SHA-256 `805f49255069cf0cc0e831bd45986218246e982acdc35e75d8b25d91212cb727`, exactly `80,473` bytes.

Protected hashes remain byte-identical:

- Foundation: `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`
- R1a: `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`
- Attribution: `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`
- Approved contract: `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d`

**Historical proof #1 result: FAILED. Current proofs #2–#5 also FAILED; proof #6 NOT RUN (see current gate above).**

The first governed run reached PostgreSQL and stopped on the synthetic `appointments.id` default mismatch documented above. It did not apply the product migration to any shared or hosted environment.

## Original implementation changed paths (historical)

1. `supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql`
2. `lib/booking-engine/types.ts`
3. `lib/booking-engine/persistence.ts`
4. `lib/booking-engine/mutations/create.ts`
5. `lib/commerce/booking-operations/types.ts`
6. `lib/commerce/booking-operations/normalize.ts`
7. `lib/commerce/booking-operations/kernel.ts`
8. `lib/commerce/booking-operations/index.ts`
9. `tests/unit/booking/create-booking-persistence.test.ts`
10. `tests/unit/commerce/booking-operation-normalization.test.ts`
11. `tests/unit/commerce/booking-operation-kernel.test.ts`
12. `tests/unit/migrations/issue134-durable-booking-operation.test.ts`
13. `tests/postgres/issue-134-durable-booking-operation-contract.sql`
14. `scripts/verify-issue134-durable-booking-operation-postgres.mjs`
15. `docs/reviews/issue-134-durable-booking-deposit-implementation.md`
16. `docs/CHANGELOG.md`

No path outside the Section 13 allowlist changed.

## Migration identity

- Created only through the installed CLI path after checking `npx supabase migration new --help`.
- Filename: `supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql`
- Current corrected size: `83,565` bytes
- Current corrected SHA-256: `01b10f8c629cc73b08d6c5849160836b90cbc87beb29d7c8b78857375fe2493b`
- State: current corrected bytes are authored only / not applied anywhere. Earlier product bytes were exercised in proofs #1–#5, never applied to Staging or Production. No database was run during this correction.

The migration supplies exactly the locked 23 deltas: one registry table, one appointment column, eight named constraints, three indexes, eight SECURITY INVOKER functions, and two triggers. It retains the accepted prior booking-attempt index and does not alter existing RLS policies or applied migrations.

## Contract coverage

- Stable opaque operation, attempt-key, and inline-customer UUID creation and all-three rotation are implemented.
- Customer, booking, and payment tuples use fixed-order UTF-8 JSON and SHA-256 fingerprints. PostgreSQL recomputes all three before new admission or replay; a fixed multi-resource cross-language vector covers nested-array whitespace.
- Bootstrap provides operation-first replay, full stored-column/attempt comparison, deterministic key-conflict evidence, sorted email/phone advisory locking, safe tenant-scoped inline matching, and same-transaction customer/operation/attempt/event creation.
- Existing booking validation, status, duration, room/resource, package, pricing, tax, and named/optional-staff behavior remain authoritative. `createBooking()` revalidates and accepts the opaque injected durable writer only through an explicit persistence strategy.
- Original appointment insertion carries the operation ID and exact validated commercial fields, including zero; appointment/resource insertion is atomic and the compatibility fallback is unavailable to the durable branch.
- Binding is one-time and identity checked. No-payment persists REQUESTED plus SKIPPED with zero ledger/obligations and returns an explicit `NO_PAYMENT_REQUESTED` operator reason.
- The specialized manual commit verifies tenant, actor, lifecycle, bound identities, tender, exact zero/one evidence, one REQUESTED event, one exact ledger, one ACCEPTED event, and four PENDING obligations before returning recorded truth.
- Close/create and close/commit use the common operation advisory fence and canonical attempt → appointment → operation row-lock order. Pricing/slot/abandonment, cancellation, repeated CLOSED zero-ledger customer correction, and appointment-linked ledger protection are represented.
- Private exact/history readers reauthorize current user and Business on every call, fail closed on malformed identity/count/tuple/state evidence, distinguish raw recording from synchronization, return same-identity recovery actions, and omit request/PII internals from history.
- Production dependencies keep new admission `false`. Booking Sheet, Quick Appointment, and current `createAppointment()` callers are not wired to the new kernel; the existing weak booking dedupe and current callers remain unchanged.

## Proof package

- SQL contract source: `tests/postgres/issue-134-durable-booking-operation-contract.sql`
- Human runner: `scripts/verify-issue134-durable-booking-operation-postgres.mjs`
- Static migration/verifier contract: `tests/unit/migrations/issue134-durable-booking-operation.test.ts`

The runner requires exactly `--confirm-disposable-local`, uses fixed PostgreSQL 17 Homebrew binaries, an owned loopback-only temporary cluster, a minimal sanitized child environment, before/after source hashes, phase recording, concurrency-response capture, confirmed shutdown, and two matching ownership markers before PGDATA removal. The SQL fixture loads immutable foundation/R1a/attribution sources, checks their digests, verifies schema/ACL inventory, and is authored to exercise replay, inline identity races, appointment races, commit races, both close/create orders, both close/commit orders, no-payment, repeated correction, ledger protection, reader privacy, and revocation. Proof #4 passed the SQL contract and the four pre-NULL-staff concurrency phases; the remaining scenarios are not proved (see current gate).

Argument refusal, fixture source, phase capture, concurrency capture, cleanup logic, and JavaScript syntax were checked offline. The five failed disposable-local proofs are historical. This commit correction runs refusal gates only; it does not start PostgreSQL or execute a sixth proof.

**Historical proof #1 result: FAILED. Current proofs #2–#5 also FAILED; proof #6 NOT RUN (see current gate above).**

The runtime failure and surviving/unexecuted proof boundaries are recorded above. A sixth human-operated run requires a fresh governed gate.

## Earlier implementation / first-proof commands and results (historical)

- `npx supabase migration new --help` — PASS; CLI help checked before authoring.
- `npx supabase migration new issue_134_durable_booking_operation` — PASS; generated the sole migration filename above.
- `npm test -- tests/unit/commerce/booking-operation-kernel.test.ts tests/unit/migrations/issue134-durable-booking-operation.test.ts tests/unit/commerce/booking-operation-normalization.test.ts tests/unit/booking/create-booking-persistence.test.ts tests/unit/booking/authenticated-create-booking-callers.test.ts` — PASS, 5 files / 45 tests.
- `npm test -- --exclude tests/unit/dashboard/top-nav-containment.test.tsx --exclude tests/unit/communications/customer-location-email-mobile.test.ts` — PASS, 190 files passed, 1 skipped; 1,959 tests passed, 36 skipped.
- `npm test` — PARTIAL: 1,957 tests passed and 39 skipped; only two untouched browser suites failed because the Playwright Chromium executable is absent. The earlier introduced persistence-privilege guard failure was corrected before the final runs.
- `npm run typecheck` — PASS.
- Scoped ESLint over every changed TypeScript/JavaScript path — PASS.
- `npm run lint` — BASELINE FAILURE: 29 errors and 10 warnings, all in untouched UI/integration files; no changed path was reported.
- `npm run build` — ENVIRONMENT BLOCKED before compilation: Turbopack rejected this worktree's `node_modules` symlink because it points outside Turbopack's filesystem root.
- `npx next build --webpack` — PASS on the final source candidate; optimized production compilation, type validation, static generation, and route output completed.
- `node --check scripts/verify-issue134-durable-booking-operation-postgres.mjs` — PASS.
- Verifier `--help`, no-argument, wrong-argument, and extra-argument checks — PASS; every non-exact invocation refused before PostgreSQL binary use.
- `git diff --check` / cached equivalent — PASS.
- Static hash and path checks — PASS.
- First governed disposable-local PostgreSQL 17.11 run — FAILED at the golden-path appointment insert because the synthetic fixture lacked the production `appointments.id` UUID default; verifier shutdown/owned-PGDATA cleanup PASS.

Source evidence remains in the changed focused tests, static migration test, SQL proof source, verifier source, this report, and the local task transcript. Failed-run evidence remains outside the repository in the retained system temporary evidence directory identified above.

## Preservation and boundaries

Protected hashes after implementation:

- Foundation migration: `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`
- R1a migration: `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`
- Attribution migration: `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`
- Reviewed contract: `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d`

Applied foundation, R1a, and attribution migrations are byte-preserved. Accepted local, C01, Run 02, Staging application, and other historical evidence files are untouched. No credential, passfile, `.env`, or `.supabase` file was directly inspected, printed, or added to evidence.

There was no hosted database access, migration application, projection processing, invoice/receipt/CRM write, communication, provider call, worker activation, public Summer/#133 adapter, permission/RLS cutover, #153 action, retained-cohort processing, historical financial change, Staging/Production/GVM action, deployment, push, PR mutation, merge, #135 release, or technician resumption.

## Remaining limitations and next gate

- DATABASE PROOFS #1–#5 remain historical FAILED attempts for the distinct reasons recorded above. DATABASE PROOF #6 PASSED and is independently accepted; do not rerun it merely for confidence.
- The backend is intentionally unusable for new admissions while `admissionEnabled` is `false` and no current surface calls its prepared entrypoints.
- Local proof does not establish Staging application, hosted PostgREST/application behavior, UI wiring, projections, communications, #133 public/Summer reporting, #153 cutover, Production/GVM acceptance or technician resumption.
- The next safe task is bounded projection/#133 design preparation under contract step 6; communications remain OFF. Projection implementation requires its own reviewed gate.
- Connected Staging application is later contract step 7, after projection work: fresh read-only preflight, exact migration/application Product Owner approval, synthetic new cohort only, and no retained-cohort processing.
- The default Turbopack command remains unusable in this symlinked worktree; the supported webpack build passed.
- Repository-wide lint and the two Chromium-dependent tests retain the pre-existing/environment blockers recorded above.

No rerun, hosted apply, activation, permission cutover, Production/GVM action or technician resumption is authorized by this local-proof acceptance.
