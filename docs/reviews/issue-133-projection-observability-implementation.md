# #133 / #134 Slice 1 — Prepared implementation

Date: 2026-10-09. Status: IMPLEMENTED / UNWIRED / DEFAULT-OFF / LOCAL DATABASE GATE CLOSED-ACCEPTED / STAGING PREFLIGHT CLOSED-ACCEPTED / STAGING SCHEMA GATE CLOSED-ACCEPTED / CONNECTED STAGING BEHAVIORAL VALIDATION NOT YET AUTHORIZED.

## Authority and source identity

Sole implementer; no delegation. Worktree `/Users/darshan/chasum-worktrees/issue-133-projection-observability`, branch `codex/issue-133-projection-observability`.
Starting HEAD `a8538ac28efebbb38410037eea26cfd4817a6b5f`, tree `8d5d92ead66de38c11455e81a66a158ff1b97d98`; starting worktree clean.
Original gate `9fe7c6a84571ba88473c8a8d9d97fc1228930337`; amended semantic PO gate `5f9562b74215e8355e578569f7d406f14647e81e`.
Primary contract initially verified at `1472f0ff65e1b0476fbc57f86a3f18d6dfc35ca9b72d919ab3b2c6743cfcda91`.
Amendment at semantic gate verified at `5e43efcbc7ba3082b8062b6b9193c68e02bfb4a0a705b9834f123d85c4929d96`; later amendment diff contains approval/status metadata only. Amendment file is not edited.

The prior HOLD identified R1a ACCEPTED replay rejecting every legitimate projection transition. Darshan approved the independently reviewed amendment: replace only ACCEPTED zero-write evidence classification in the NEW migration. No old migration changes. No #158 proof rerun.

This is internal implementation of an already locked financial/security contract, with no new product/UX decisions; separate competitive research is not applicable to this bounded backend correction. No runtime product acceptance is claimed.

Original implementation authority: the exact sixteen paths below, migration authoring, private wrappers, test/proof authoring, offline validation and one local commit. PostgreSQL execution, hosted actions, migration application, admission activation, provider calls, worker/UI wiring, reporting/CRM cutover and #153 changes are excluded.

## Prior exact-candidate audit correction — authoring record

Claude returned `CORRECTIONS_REQUIRED_BEFORE_DATABASE_PROOF` for audited commit `860de2fd5aca8dcf1109fd5f0cf54c6179fbc8a9`, tree `023f82ac92e9eac2668648817c04b0c37965c5b1`. Branch/HEAD/tree and clean working tree were verified before correction. Control Tower explicitly selected the existing four-digit document-number behavior. This bounded regression correction requires no new product design or competitive gate.

The correction is one new local commit on that audited parent, without amend/rewrite. It changes only four existing allowlisted paths: the Slice 1 migration, its migration static test, its PostgreSQL contract, and this report. The complete original sixteen-path inventory below remains unchanged.

- **B1:** the migration differs from the audited file only in the two allocation expressions: `greatest(6,length(number_value::text))` becomes `greatest(4,length(number_value::text))`. Prefixes, lock order, sequence creation/counters, 32-candidate collision scan, identity constraints and all other function/security behavior are byte-preserved.
- **Static pin:** two branch-bound assertions extract the `document_number :=` assignment independently from invoice_settlement and receipt allocation. Each must exactly equal the four-digit expression after whitespace normalization; six digits in either branch fail its assertion.
- **Authored number proof:** the first actual projector documents must be `INV-0001` and `RCT-0001`. A rollback-only fixture block sets the existing sequences to 42, 9999 and 10000 and invokes the actual projectors, requiring exactly `INV-0042` / `RCT-0042`, `INV-9999` / `RCT-9999`, and `INV-10000` / `RCT-10000`. Existing first-row/concurrent allocator proofs are preserved; the verifier is byte-identical.
- **B2 authored privacy proof:** attempt n=1 belongs to Actor A (`...0001`), the existing Business owner. A transaction gives distinct Actor B (`...0002`) an explicit same-Business admin membership. Both call the real reader as service_role with their respective actor identity. Actor B must see the same RECORDED attempt with the attempt_key property explicitly JSON null; Actor A retains its exact original key. All other row fields must match. Closed key sets cover the envelope, attempt, ledger, events and obligations; private-key occurrence and PII/internal/provider-detail exclusions are asserted. The membership addition rolls back, preserving existing foreign/revoked authorization negatives. Reader implementation/authorization is unchanged.

At that delivery, these were source assertions and authored tests, not database execution evidence. The subsequent authorized Proof #1 result and current correction gate are recorded below.

## Database Proof #1 — failed; narrow harness correction

**DATABASE PROOF #1: FAILED — PROOF HARNESS / TEST SQL DEFECT.** The retained logs were read, not re-executed. Proof #1 ran PostgreSQL 17.11 (Homebrew) at source HEAD `b8919b07b76be4db6004f00d62abd92ff83fad86`; the failed proof SQL SHA was `3d5fdacb17a2f5da2320b409fcb3b6ca348e1f7e6d31e6b014c1d3ab25a35daa`. No product migration, R1a, projection, security or concurrency defect is established by this failure.

Exact error: **SQLSTATE 42702 — column reference "a" is ambiguous**. The cursor-disjointness assertion in the canonical #133 reader proof used SQL range alias `a` inside a PL/pgSQL block declaring `a uuid`. psql reported the containing block at line 796 (assertion line 793), inline block line 21.

Retained evidence: `/tmp/chasum-issue133-projection-evidence-TXl9oX/`. `summary.json`, `phases.jsonl` and source identity records were inspected read-only. This directory remains historical Proof #1 evidence; nothing there was overwritten or rewritten.

Bounded evidence before failure:

- Protected migrations loaded and the new migration compiled/applied in the disposable fixture; the fixture log reached subsequent tests. This is not hosted migration acceptance.
- The unchanged historical R1a contract printed its PASS markers through PASS 14.
- Explicit subsequent PASS markers cover projection targets and original/complete/unbound/key-conflict replay; exact four-digit invoice/receipt numbers; replay negative census/state/history; admission equality/absence/disable/re-enable; supported aggregate/hold/zero/cancellation/invoice identity; and same-Business Actor B key masking with Actor A key retention.
- The containing canonical reader block failed; statements printed or reached inside it are not claimed as a completed reader gate. The overall SQL contract/fixture-ready sentinels were not reached. `fixtureSetup=NOT_STARTED` in the summary is the verifier's unset completion state, not evidence that no fixture SQL ran.
- Verifier concurrency and recovery phases were NOT reached: both arrays are empty. Earlier historical R1a replay PASS markers do not imply those later verifier phases ran.
- `sourceIdentityMatched=true`, `stopConfirmed=true`, `pgdataRemoved=true`, `cleanupFailure=null`, `passed=false`.

Harness correction preflight matched clean HEAD `2df774015fdf57d863afd17dd46eb92a079243d0`, tree `b7bb23c950295433e8735bad53d460b0c97dfa26` on the existing governed branch. Exactly two files change: this report and the proof SQL. In the single cursor assertion, aliases `a` / `b` become `page1_row` / `page2_row`, including their two JSON references. `a uuid` is not renamed. The next_cursor non-null requirement and NOT EXISTS equality join on attempt_id remain identical. No reader, pagination, migration, verifier or runtime behavior changes.

A bounded source sweep found no remaining JSON/range alias `a` in a block declaring variable `a`. The two `commerce_payment_attempts a` aliases in the replay helper do not collide: that helper declares `aid`, not `a`. No equivalent short-alias collision was found in the affected DO block. This is a static inspection, not PostgreSQL compilation proof.

Correction checks: exact two-path scope, inverse alias substitution restoring the entire original proof byte-for-byte, diff whitespace, immutable migration/verifier sizes and hashes, and all protected hashes. No PostgreSQL process, verifier positive mode, hosted test or broad validation run was invoked during this correction. Prior unit/typecheck/lint results below remain historical.

**DATABASE PROOF #2: PASSED — INDEPENDENTLY ACCEPTED.** After Claude accepted the Proof #1 harness correction, Darshan explicitly authorized exactly one new disposable-local run. That approval was consumed once. The verifier ran from repository HEAD `91af454a79460dd2a444ca45a30fba687b2fbd8f` against corrected proof SHA-256 `552a9c971ba25ab6b92ee04e7c15cacf4c5a179b6236018622ba1e776ba12842`, unchanged migration SHA-256 `ca91f6cbe7b9aa3a2c1b0b1eec13c267b1364badac9bfe07c4366c3157006f56`, and unchanged verifier SHA-256 `a6b8c34bb7251cc1a16ff9179ac9cac4abda304e401cff22b020294a22d6372b`.

Retained Proof #2 evidence: `/tmp/chasum-issue133-projection-evidence-nTgl8K/`. Summary SHA-256 `8669fd940eeb7214c1eb10e1bfe1cff5ff92bf5d5e6ac052b561c43b182574d2`; phases SHA-256 `83bcb467484cd690413a773055d0f447cd2c65968f39b7b7b4992ab12ba71e31`; concurrency responses SHA-256 `e5b6f31e432ca3ccc0e99a847d208fb0f46311b34eff5f4f3bf409831af48926`; PostgreSQL log SHA-256 `97aea497df288cb5ae95950f427ccc4e584545cca597ebc8e0044c7928be32f7`; source identity before/after SHA-256 both `6b104b06352327454620c738f45510442d4d457f170ff76cba38fc41ccb8a624`.

Runtime result: PostgreSQL `17.11 (Homebrew)`; `sourceIdentityMatched=true`; `fixtureSetup=PASS`; final sentinels `ISSUE133_SQL_CONTRACT_PASS`, `ISSUE133_FIXTURE_READY`, and `ISSUE133_POSTGRES_PROOF_PASS` were reached; `passed=true`; `originalFailure=null`; `cleanupFailure=null`; `stopConfirmed=true`; `pgdataRemoved=true`. Duplicate-prestate migration rejection rolled back as expected.

Concurrency completed for all six authored scenarios: `appointment_cache`, `invoice_settlement`, `customer_payment_events`, `receipt`, first-row invoice-sequence allocation and first-row receipt-sequence allocation. Same-obligation races converged APPLIED/VERIFIED on one target identity; first-row sequence races completed with separate unique target identities under the Business advisory locks.

Lost-response recovery completed for three committed boundaries: receipt identity/number remained `75651241-5734-4f84-9a53-4969be47f644|RCT-0003`; invoice identity/number remained `0cefb6d8-812c-4272-8ff8-3cb9c2255c83|INV-0003`; CRM identity remained `d5abde72-310c-45d2-85e7-f7a201d2cfd5|7014a68d-f68f-4f22-b3f7-c08bb739f5a4`. Each deliberate discarded response was classified UNKNOWN, then replay returned VERIFIED with the exact same durable identity.

Claude Opus 5 High subsequently performed a read-only retained-evidence audit and returned `SLICE1_DATABASE_PROOF2_ACCEPTED`. It independently verified all seven evidence hashes, byte-identical source identity before/after, PostgreSQL 17.11, historical R1a runtime compatibility, both SQL contract sentinels, the corrected post-line-793 reader/privacy/authorization range, intentional duplicate-prestate rollback, all six genuine concurrency scenarios, all three discarded-response recovery boundaries, cleanup/ownership, and the exact runtime artifact identities. The verifier's `ISSUE133_POSTGRES_PROOF_PASS` string is console-only and is not present in retained evidence; Claude accepted its evidentiary equivalent `passed=true` with `originalFailure=null` after confirming the verifier control flow. **The local PostgreSQL database gate is CLOSED / ACCEPTED.**

The #158 Staging schema application is now independently accepted under `ISSUE158_STAGING_SCHEMA_APPLICATION_ACCEPTED`, so the dependency is closed. A fresh read-only #133 compatibility preflight was then executed against governed Staging `wnfahklzaxirftyskctd` with **no hosted mutation**. Control Tower result: `CONTROL_TOWER_PREFLIGHT_PASS`. Protected hosted Foundation/R1a/Attribution/#158 statements remain at exact accepted hashes and #133 remains absent. Every new #133 object name is collision-free; the existing `commit_manual_payment_attempt_v1(uuid,uuid)` replacement target exists exactly once with the expected invoker/search-path/ACL/result shape. Hosted data has zero invoice identity duplicates, zero receipt transaction duplicates, zero receipt cross-tenant/orphan rows, zero cross-tenant invoice appointments and zero duplicate transaction IDs. Existing two CRM payment-event rows remain legacy rows; `transaction_id` is absent as expected and will be added nullable with no backfill/NULL-excluding partial uniqueness. A 128-column/type live schema matrix returned 128/128 OK. Every required existing-table SELECT/INSERT privilege and all 19 exact existing-column UPDATE privileges used by #133 are effectively present for service_role; no grant widening was performed.

Retained cohort boundary is explicit: six historical attempts (4 ACCEPTED / 2 REQUESTED), 15 PENDING obligations, zero operation-linked attempts and zero booking operations. #133 seeds no admission rows; no row/disabled/NULL watermark denies, and later enable uses server time with strict attempt.created_at > watermark, so retained attempts remain mechanically excluded. Connected Staging must use a NEW synthetic Business/cohort. Legacy receipt namespace currently contains two numeric RCT receipts (1–2) in one Business; that is not a schema-application blocker for the planned new synthetic Business and remains an activation/runbook note before any existing Business admission. Existing broad legacy commerce ACLs are recorded under separate #153; #133 does not widen them.

Raw read-only preflight evidence is retained outside the repository at `/Users/darshan/chasum-evidence/issue133-staging-preflight-20261009/`. `SHA256SUMS.txt` covers 13 raw/source files plus `SUMMARY.md`; SHA-256 of the manifest is `20efada59a8028c8272be7d94face6c4d915b498ad976213991cef0e899bd965`. Claude Opus 5 High independently hashed all 14 files, re-parsed the raw hosted outputs, enumerated the migration source against the collision scan, verified the R1a replacement signature/return/search_path/ACL compatibility, and returned `ISSUE133_STAGING_PREFLIGHT_ACCEPTED_FOR_APPLICATION_GATE`. **The #133 Staging PREFLIGHT gate is CLOSED / ACCEPTED. #133 itself remains NOT APPLIED / NOT AUTHORIZED.**

Mandatory future application postcheck condition **P1**: the frozen baseline hashes `customer_payment_events` before the new nullable `transaction_id` column exists. After schema application, its postcheck MUST hash `(to_jsonb(t) - 'transaction_id')` with the same deterministic row ordering; the other eleven baseline relations remain unchanged. Reusing plain `to_jsonb(t)` after application would create an expected false mismatch and destroy evidentiary value. Observation **O2 / #153 scope**: because `customer_payment_events` currently has broad legacy table-level anon/authenticated grants, PostgreSQL will extend those existing table privileges to the new `transaction_id` column. #133 issues no browser-role GRANT and does not widen the existing table ACL, so Claude classifies this as a separate #153 permission-hardening concern rather than a schema-application blocker. Record `customer_payment_events.transaction_id` explicitly in future #153 scope; do not alter ACLs in this gate.

## Exact changed paths

1. `supabase/migrations/20261008210359_issue_133_payment_projection_observability.sql`
2. `lib/commerce/payment-projections/types.ts`
3. `lib/commerce/payment-projections/kernel.ts`
4. `lib/commerce/payment-projections/index.ts`
5. `lib/commerce/payment-observability/types.ts`
6. `lib/commerce/payment-observability/reader.ts`
7. `lib/commerce/payment-observability/index.ts`
8. `tests/unit/commerce/payment-projection-kernel.test.ts`
9. `tests/unit/commerce/payment-projection-admission.test.ts`
10. `tests/unit/commerce/payment-observability-reader.test.ts`
11. `tests/unit/migrations/issue133-payment-projection-observability.test.ts`
12. `tests/postgres/issue-133-payment-projection-observability-contract.sql`
13. `scripts/verify-issue133-payment-projection-postgres.mjs`
14. `docs/reviews/issue-133-projection-observability-implementation.md`
15. `docs/CHANGELOG.md`
16. `docs/reviews/issue-133-projection-observability-contract.md`

## Migration and complete object inventory

Generated through installed Supabase CLI 2.117.0, with telemetry disabled and OS network denial:
`supabase/migrations/20261008210359_issue_133_payment_projection_observability.sql`

SHA-256 / size: `ca91f6cbe7b9aa3a2c1b0b1eec13c267b1364badac9bfe07c4366c3157006f56 / 48,612 bytes`.

The npm wrapper could not use its local cache; direct invocation of the already installed CLI successfully displayed help and generated the filename. Timestamp was not invented. Migration was applied only inside historical disposable-local Proof #1; no hosted/shared application is claimed. No migration is applied during this correction.

Additive schema:

- `commerce_transactions_projection_tenant_key`: UNIQUE(id,business_id), with backing index.
- `commerce_invoices_projection_appointment_key`: partial unique index on (business_id,appointment_id), non-null appointments only. Duplicate historical identities fail the transaction.
- `commerce_receipts_projection_transaction_key`: UNIQUE(business_id,transaction_id), with backing index.
- `commerce_receipts_projection_tenant_fk`: composite transaction/Business FK, ON DELETE CASCADE. Existing single-column cascade FK remains.
- `customer_payment_events.transaction_id`: nullable UUID, no backfill.
- `customer_payment_events_projection_transaction_key`: partial unique index on (business_id,transaction_id), non-null transactions only.
- `customer_payment_events_projection_tenant_fk`: composite transaction/Business FK, ON DELETE CASCADE.
- `commerce_receipt_sequences`: Business PK/FK ON DELETE CASCADE; positive integer next_number default 1; bounded prefix default RCT; updated_at default now(). PK backing index and positive-number/prefix CHECKs.
- `commerce_projection_admission`: Business PK/FK ON DELETE CASCADE; enabled NOT NULL default false; nullable finite timestamp watermark; updated_at default now(). PK backing index and finite-watermark CHECK.
- RLS enabled on the two new tables, no policies. No existing RLS, ownership or default-ACL cutover. No invoice→appointment composite FK.
- Nine new functions below; one separately identified existing-function replacement. No trigger, queue, worker, provider or communication object.

New signatures:

1. `set_payment_projection_admission_v1(uuid,boolean) RETURNS jsonb`
2. `payment_projection_history_valid_v1(uuid,uuid) RETURNS boolean`
3. `payment_appointment_truth_v1(uuid,uuid) RETURNS jsonb`
4. `project_payment_obligation_v1(uuid,uuid,text) RETURNS jsonb` — validated private dispatcher, no arbitrary payload.
5. `project_payment_appointment_cache_v1(uuid,uuid) RETURNS jsonb`
6. `project_payment_invoice_settlement_v1(uuid,uuid) RETURNS jsonb`
7. `project_payment_customer_payment_events_v1(uuid,uuid) RETURNS jsonb`
8. `project_payment_receipt_v1(uuid,uuid) RETURNS jsonb`
9. `read_payment_observability_v1(uuid,uuid,text,uuid,text,integer) RETURNS jsonb`

Existing function replacement:
`commit_manual_payment_attempt_v1(uuid,uuid) RETURNS TABLE(outcome text,attempt_id uuid,transaction_id uuid,recorded boolean,synchronization text)`.

All ten definitions explicitly declare SECURITY INVOKER and search_path=pg_catalog,pg_temp and require literal current_user=service_role. New functions revoke all from PUBLIC/anon/authenticated/service_role, then grant only service_role EXECUTE. Existing R1a function owner/ACL are preserved by CREATE OR REPLACE, without DROP/re-grants.

New-table privileges: service_role SELECT and INSERT(business_id); receipt sequence UPDATE(next_number,updated_at); admission UPDATE(enabled,admit_attempts_created_after,updated_at). No DELETE/TRUNCATE/browser privileges. Existing target privileges remain untouched and must be verified at a later governed environment gate.

## R1a amendment and shared transition evidence

Static comparison pins the original function header/declarations/authorization/pre-ACCEPTED checks and the entire REQUESTED/new-money suffix byte-for-byte. Only ACCEPTED replay uses the new shared history validator. Exact original money tuple checks remain in that branch. Valid replay still returns the original attempt/transaction, recorded=true, synchronization=PENDING. This is a deliberate compatibility under-claim, not projection truth.

History requires exactly one valid REQUESTED and ACCEPTED event, four coherent obligations and the exact census of two lifecycle events plus valid KEY_CONFLICT and valid PROJECTION_CHANGED events. Latest projection evidence is selected by immutable event_sequence. PENDING has no transition history. Initial customer-only appointment_cache NOT_REQUIRED has no transition history. Customer-only invoice transitions only to NOT_REQUIRED. COMPLETE/FAILED match latest state/failure code; malformed or extra events are UNKNOWN. Terminal projection history cannot be followed by another transition.

Projection emitter vocabulary: PROJECTION_CHANGED / RECORDED; COMPLETE or NOT_REQUIRED with null failures; FAILED with PROJECTION plus PROJECTION_FAILED or PROJECTION_UNCERTAIN. Never a PENDING transition. Replay never repairs, creates money, calls a projector, or appends an event.

## Admission and transaction boundary

No admission rows are seeded. No row, disabled, or NULL watermark denies. Each direct projector obtains an admission share lock and requires attempt.created_at > watermark; equality denies. Private activation accepts no timestamp and advances the watermark to at least clock_timestamp on every enable. Disable retains the watermark. No live Business activation was executed; historical Proof #1 exercised admission only in its disposable synthetic fixture.

Before real Business activation, legacy payment/refund entrypoints must be excluded before provider/network/database effects. No legacy writer modification or post-provider rejection trigger is included. There is no worker/claim loop; a future claim RPC must enforce the same admission predicate.

Order: admission fence, obligation, attempt, triggering ledger, appointment, full ledger snapshot, target/sequence. Target write, obligation state and event use one subtransaction. Definite target failure rolls it back and records PROJECTION_FAILED; contradictory supported-target evidence records PROJECTION_UNCERTAIN. COMPLETE/NOT_REQUIRED only verify; mismatches are explicit VERIFICATION_MISMATCH without mutation/downgrade. Customer-only invoice infrastructure failures roll back the invocation, retaining PENDING because the approved vocabulary does not allow a customer-only invoice FAILED state.

## Four projections

Appointment: stored integer price/tax/deposit only; NULL/negative/refund cache/overflow holds. Locks appointment before full ledger read. Every linked row must be positive succeeded manual payment/deposit with matching Business/customer/currency and supported method. Canonical linked attempt tuples must agree; legacy supported manual rows may count. Refund records, unsupported kinds/providers/states or second currency hold the entire set. Sums distinct ledger rows naturally by their PK, never amount/time dedupe. Updates only paid/refunded/status; cancellation does not erase money.

Invoice: one non-null appointment identity, including void invoices. Unbound invoice obligation resolves NOT_REQUIRED. Existing document/customer/currency/terms/line arithmetic must match. Void/refunded/contradictory documents hold. Creates document and lines from stored terms, derives settlement from full ledger truth, never stale appointment cache. Business invoice-sequence advisory lock precedes missing-row insertion and row lock. Up to 32 occupied numbers are skipped within allocation; exhaustion fails the same obligation. Triggering ledger invoice_id can only move NULL to the verified invoice. Different non-null link holds.

CRM: one transaction-linked mirror of canonical customer/appointment/amount/currency/method/provider/time. Exact existing match converges; mismatch holds. Legacy NULL transaction rows are neither adopted nor rewritten.

Receipt: one transaction identity and stable existing number on replay. Separate receipt-sequence advisory namespace and locked allocator. Money/body come from canonical transaction; invoice_id is deliberately omitted on creation and never enriched by COMPLETE replay. email_status remains not_sent. No send path.

## Canonical reader and wrappers

Private stable reader authorizes current Business owner/admin before exact/history lookup. One PostgreSQL statement snapshot supplies attempt, ordered events, exact ledger/count, four obligations and booking payment_mode. Opaque Business-bound cursor carries exact timestamp/UUID; deterministic descending tuple pagination, limit 1–50. Attempt key is returned only to its actor. No names, contact details, notes, request hashes, provider references/secrets or internal database errors.

States: coherent terminal zero-ledger NOT_RECORDED; REQUESTED/RECOVER zero-ledger PAYMENT_RECOVERY_REQUIRED before or after binding; exact ACCEPTED ledger plus pending/failed work RECORDED_BUT_NOT_FULLY_SYNCHRONIZED; fully synchronized RECORDED; contradictory evidence UNKNOWN. Communication eligibility is NOT_IMPLEMENTED. Non-booking full/custom modes are not inferred. No revenue calculation or Reporting cutover.

TypeScript modules are server-only and unwired. Tenant/actor authority is resolved on the server. RPC responses are strictly validated/redacted. Transport uncertainty returns UNKNOWN; no automatic retry, identity rotation, collection, or projection activation.

## Proof package — corrected artifact awaiting Proof #2

SQL: `tests/postgres/issue-133-payment-projection-observability-contract.sql`
SHA-256 / size: `552a9c971ba25ab6b92ee04e7c15cacf4c5a179b6236018622ba1e776ba12842 / 71,795 bytes`.

Verifier: `scripts/verify-issue133-payment-projection-postgres.mjs`
SHA-256 / size: `a6b8c34bb7251cc1a16ff9179ac9cac4abda304e401cff22b020294a22d6372b / 25,338 bytes`.

The future owned fixture loads protected migrations without rerunning #158's historical proof. It executes the unchanged historical R1a SQL contract against the replacement, then new replay/event/state vectors, admission boundaries, target identity, rollback failures, whole-ledger holds, equal payments, zero/cancellation, invoice void/duplicate, CRM legacy/conflict, receipt independence, reader state/privacy/cursor/access and booking pre/post-bind tests. Synthetic corruption probes roll back.

Verifier authors six forced-overlap races (four obligations plus two first-row allocators), three discarded committed-response recovery scenarios, and a second owned database whose duplicate invoice prestate must reject/roll back migration. It refuses dirty sources and all arguments except an exact future human confirmation token; sanitized child environment, loopback-only owned PG17, observed PGDATA/host binding, raw phase/concurrency evidence, source identity before/after, confirmed stop and dual-marker deletion fencing. Evidence is retained. No existing/hosted connection parameters are accepted.

**DATABASE PROOF #1: FAILED (HARNESS); PROOF #2: PASSED / INDEPENDENTLY ACCEPTED.** Proof #2 executed the corrected artifact completely in the owned disposable-local environment, including runtime SQL, concurrency and lost-response recovery. Claude independently accepted the retained evidence; the local database gate is closed.

## Prior implementation/correction offline validation — historical results

- Correction focused/static suites: 50 tests PASS (included in the final scoped run; two new branch-bound format cases).
- Correction broader booking/commerce/migration run: 70 suites / 718 tests PASS, with OS network denial.
- TypeScript: PASS with --noEmit --incremental false.
- Correction changed-path ESLint: PASS, zero warnings. No cleanup changes to dead declarations.
- Verifier syntax: PASS. Help/no-argument/wrong/extra refusal exits: 0/2/2/2. No exact positive invocation.
- Webpack build: NOT RERUN for this SQL/test/document-only correction. Prior audited-candidate attempt was BLOCKED by offline font fetch. OS-level network denial prevented next/font fetching Inter and JetBrains Mono from fonts.googleapis.com (ENOTFOUND). No source workaround or network exception. app/layout.tsx is byte-identical to the starting candidate: `04ec78618505c863f5db80595473b91e75a7cf0aa9d2ccd5ce65780c150b08b2`.
- Exact four-path correction subset of the sixteen-path allowlist, protected hashes and diff whitespace: verified before the one local correction commit; final Git identities recorded in delivery. Migration delta is exactly two 6-to-4 substitutions; verifier unchanged.

## Protected sources

- Foundation: dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47
- R1a: 4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7
- Attribution: fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524
- #158: 01b10f8c629cc73b08d6c5849160836b90cbc87beb29d7c8b78857375fe2493b
- Historical R1a proof: 7d343b902711e264c3c2bbc15695ba092f983b88b84d9bdf9a4580b1652f2f23

## Independent audit carry-forward notes — no executable expansion

- **N2 — Admission disable/re-enable:** advancing the watermark on re-enable is an accepted fail-closed choice. Attempts created while disabled remain below the new watermark after re-enable and are not automatically projected. The future activation/runbook must account for this; real activation should quiesce relevant writers around watermark enable. Algorithm unchanged.
- **N3 — Existing target-table privileges:** hosted read-only preflight must STOP if any required service_role privilege is missing. Do not widen grants in Slice 1; #153 remains a separate gate. No hosted check or grant change performed here.
- **N4 — Receipt body:** body_text is intentionally simple and exact-string verified. Later wording changes can produce VERIFICATION_MISMATCH. Customer-grade receipt wording must be deliberately designed before activation, not silently changed after documents exist.
- **N5 — Legacy receipt namespace:** the new canonical receipt sequence starts at 1. Before an existing real Business is admitted, hosted read-only preflight must inspect its existing receipt-number namespace. If the first 32 canonical candidates are occupied, activation must STOP. Do not silently renumber historical receipts or automatically seed/repair the sequence without a separately reviewed contract. The current collision scan is preserved; no backfill/seeding migration is introduced. The planned NEW synthetic Staging Business/cohort is unaffected by this legacy namespace precondition.
- **N6 — Customer-only invoice exception asymmetry:** the P1331 catch versus other-exception rethrow remains a future fragility observation. No current executable incorrectness was established by this correction, and no failure/subtransaction semantics were changed.
- **N7 — Refund / terminal verification:** a later refund can cause terminal receipt verification to report VERIFICATION_MISMATCH because the appointment financial scope becomes unsupported. This remains read-only: it does not mutate/downgrade the receipt or obligation.

N1 dead declarations were left untouched. None of these notes expands executable scope.

## Limits and next gate

Proof #1 remains a historical failed partial run; Proof #2 is independently accepted. #158's dependency schema is independently accepted on governed Staging. The fresh #133 Staging compatibility preflight is also independently accepted. Existing broad legacy commerce ACL posture remains separately governed under #153; this Slice does not widen grants or perform the permission cutover. Unsupported refunds/providers/currencies deliberately hold. Admission remains off; there is no worker, UI wiring, communication delivery, financial backfill, Reporting/CRM runtime cutover or provider action.

Darshan explicitly approved that exact one-time Staging schema gate. Native Supabase `apply_migration` returned `success:true` once for governed Staging `wnfahklzaxirftyskctd`. Hosted history now records `20261009133204 / issue_133_payment_projection_observability`, exactly one 48,612-byte statement at SHA-256 `ca91f6cbe7b9aa3a2c1b0b1eec13c267b1364badac9bfe07c4366c3157006f56`; protected Foundation/R1a/Attribution/#158 statements remain exact. **Do not reapply #133.**

Read-only postchecks PASS. All expected constraints/indexes/new column/tables exist at the contracted definitions; all relevant constraints are validated and both partial unique indexes are valid/ready/unique. Both new tables have RLS enabled, FORCE RLS false, zero policies, no anon/authenticated SELECT, service_role table SELECT only, and the exact contracted column-level INSERT/UPDATE rights. `commerce_projection_admission` has 0 rows and `commerce_receipt_sequences` has 0 rows. All ten relevant functions, including the replaced `commit_manual_payment_attempt_v1(uuid,uuid)`, are SECURITY INVOKER with `search_path=pg_catalog, pg_temp`, postgres owner and postgres/service_role EXECUTE only; the replacement body is projection-aware and retains the service-role guard.

Mandatory P1 was applied to the post-application data proof: `customer_payment_events` was hashed as `(to_jsonb(t) - 'transaction_id')`, while the other eleven relations used the exact pre-application expression/order. The preflight baseline file SHA remains `cbeb1288486185175c3bf318b9512e6252e29b1b62438587d1ebc3297097cbf4`; pre/post arrays are exactly equal across all 12 relations. Retained state is unchanged: 6 attempts (4 ACCEPTED / 2 REQUESTED), 15 PENDING obligations, 0 booking operations, 0 operation-linked attempts, 0 admission rows, 0 receipt-sequence rows and 0 correlated CRM rows. Existing pre-#133 security catalogue rows also match the preflight byte-for-byte. The new CRM `transaction_id` column inherits the table's pre-existing broad anon/authenticated table privileges exactly as Claude predicted; no browser-role GRANT was introduced by #133. This remains an explicit #153 hardening carry-forward, not a schema-application correction in this gate.

Raw application/postcheck evidence is retained at `/Users/darshan/chasum-evidence/issue133-staging-application-20261009/`. `SHA256SUMS.txt` covers 16 evidence/source files plus `SUMMARY.md`; manifest SHA-256 `5d05584f5c8c468eac983a12c0e78d81e3fd5a210258585fb47702a20d103746`. Pre-application evidence was already anchored before application by documentation commit `cbb352866b41713bcc595725bb19fc3b93112d04` at 2026-10-09T09:25:30-04:00; hosted application version time is 2026-10-09T13:32:04Z. Claude Opus 5 High independently audited the exact retained package and returned `ISSUE133_STAGING_SCHEMA_APPLICATION_ACCEPTED` with zero defects. It re-hashed both preflight and application evidence, verified the full local→hosted identity chain, all installed objects/validation state, new-table security, all ten function signatures/ACL/search-path posture, the R1a projection-aware replacement body, mandatory P1 across all 12 relations, retained-cohort/default-off state, and unchanged pre-existing security catalogue. **The #133 Staging SCHEMA gate is CLOSED / ACCEPTED.** #133 remains UNWIRED / DEFAULT-OFF and no hosted workflow acceptance is implied.

Per the governed sequence, the next safe phase is **prepared-only design/package authoring for one bounded connected #133/#158 Staging behavioral validation on a NEW synthetic Business/cohort**. No execution authority exists yet. Preconditions for the future run are: new synthetic Business/cohort only; never process the retained six attempts/fifteen PENDING obligations; enable projection admission only for the synthetic Business under explicit PO authority; writer quiescence around the server-time watermark; frozen retained-cohort pre/post baseline; communications/providers off; no worker; no #153 mutation; and no Production/GVM/technician action. The earlier #134 competitive product gate already governs this approved booking/deposit contract, so no new competitor research is required merely to validate the accepted backend behavior.

PROOF HARNESS CORRECTION: ACCEPTED BEFORE PROOF #2
SLICE 1 IMPLEMENTATION: COMPLETE (prepared source/package)
R1a REPLAY AMENDMENT: IMPLEMENTED
DATABASE PROOF #1: FAILED — PROOF HARNESS / TEST SQL DEFECT
DATABASE PROOF #2: PASSED — INDEPENDENTLY ACCEPTED
STAGING PREFLIGHT: CLOSED / INDEPENDENTLY ACCEPTED
STAGING APPLICATION: CLOSED / INDEPENDENTLY ACCEPTED
PRODUCTION: UNTOUCHED
GVM: UNTOUCHED
WORKER/LIVE ADMISSION: OFF
REPORTING/CRM RUNTIME CUTOVER: NOT IMPLEMENTED
#153 CUTOVER: NOT IMPLEMENTED
TECHNICIAN RESUMPTION: NOT AUTHORIZED
