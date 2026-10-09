# #133 / #134 Slice 1 — Prepared implementation

Date: 2026-10-08. Status: IMPLEMENTED / UNWIRED / DEFAULT-OFF / DATABASE PROOF NOT RUN.

## Authority and source identity

Sole implementer; no delegation. Worktree `/Users/darshan/chasum-worktrees/issue-133-projection-observability`, branch `codex/issue-133-projection-observability`.
Starting HEAD `a8538ac28efebbb38410037eea26cfd4817a6b5f`, tree `8d5d92ead66de38c11455e81a66a158ff1b97d98`; starting worktree clean.
Original gate `9fe7c6a84571ba88473c8a8d9d97fc1228930337`; amended semantic PO gate `5f9562b74215e8355e578569f7d406f14647e81e`.
Primary contract initially verified at `1472f0ff65e1b0476fbc57f86a3f18d6dfc35ca9b72d919ab3b2c6743cfcda91`.
Amendment at semantic gate verified at `5e43efcbc7ba3082b8062b6b9193c68e02bfb4a0a705b9834f123d85c4929d96`; later amendment diff contains approval/status metadata only. Amendment file is not edited.

The prior HOLD identified R1a ACCEPTED replay rejecting every legitimate projection transition. Darshan approved the independently reviewed amendment: replace only ACCEPTED zero-write evidence classification in the NEW migration. No old migration changes. No #158 proof rerun.

This is internal implementation of an already locked financial/security contract, with no new product/UX decisions; separate competitive research is not applicable to this bounded backend correction. No runtime product acceptance is claimed.

Authorized: the exact sixteen paths below, migration authoring, private wrappers, test/proof authoring, offline validation and one local commit. PostgreSQL execution, hosted actions, migration application, admission activation, provider calls, worker/UI wiring, reporting/CRM cutover and #153 changes are excluded.

## Exact-candidate audit correction — prepared only

Claude returned `CORRECTIONS_REQUIRED_BEFORE_DATABASE_PROOF` for audited commit `860de2fd5aca8dcf1109fd5f0cf54c6179fbc8a9`, tree `023f82ac92e9eac2668648817c04b0c37965c5b1`. Branch/HEAD/tree and clean working tree were verified before correction. Control Tower explicitly selected the existing four-digit document-number behavior. This bounded regression correction requires no new product design or competitive gate.

The correction is one new local commit on that audited parent, without amend/rewrite. It changes only four existing allowlisted paths: the Slice 1 migration, its migration static test, its PostgreSQL contract, and this report. The complete original sixteen-path inventory below remains unchanged.

- **B1:** the migration differs from the audited file only in the two allocation expressions: `greatest(6,length(number_value::text))` becomes `greatest(4,length(number_value::text))`. Prefixes, lock order, sequence creation/counters, 32-candidate collision scan, identity constraints and all other function/security behavior are byte-preserved.
- **Static pin:** two branch-bound assertions extract the `document_number :=` assignment independently from invoice_settlement and receipt allocation. Each must exactly equal the four-digit expression after whitespace normalization; six digits in either branch fail its assertion.
- **Authored number proof:** the first actual projector documents must be `INV-0001` and `RCT-0001`. A rollback-only fixture block sets the existing sequences to 42, 9999 and 10000 and invokes the actual projectors, requiring exactly `INV-0042` / `RCT-0042`, `INV-9999` / `RCT-9999`, and `INV-10000` / `RCT-10000`. Existing first-row/concurrent allocator proofs are preserved; the verifier is byte-identical.
- **B2 authored privacy proof:** attempt n=1 belongs to Actor A (`...0001`), the existing Business owner. A transaction gives distinct Actor B (`...0002`) an explicit same-Business admin membership. Both call the real reader as service_role with their respective actor identity. Actor B must see the same RECORDED attempt with the attempt_key property explicitly JSON null; Actor A retains its exact original key. All other row fields must match. Closed key sets cover the envelope, attempt, ledger, events and obligations; private-key occurrence and PII/internal/provider-detail exclusions are asserted. The membership addition rolls back, preserving existing foreign/revoked authorization negatives. Reader implementation/authorization is unchanged.

These are source assertions and authored future database tests, not database execution evidence. **Correction acceptance remains pending a short Claude exact-delta re-audit**, followed by fresh Darshan approval before one disposable-local positive proof run.

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

The npm wrapper could not use its local cache; direct invocation of the already installed CLI successfully displayed help and generated the filename. Timestamp was not invented. Migration is unapplied everywhere.

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

No admission rows are seeded. No row, disabled, or NULL watermark denies. Each direct projector obtains an admission share lock and requires attempt.created_at > watermark; equality denies. Private activation accepts no timestamp and advances the watermark to at least clock_timestamp on every enable. Disable retains the watermark. No activation call was executed.

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

## Proof package — AUTHORED ONLY

SQL: `tests/postgres/issue-133-payment-projection-observability-contract.sql`
SHA-256 / size: `3d5fdacb17a2f5da2320b409fcb3b6ca348e1f7e6d31e6b014c1d3ab25a35daa / 71,763 bytes`.

Verifier: `scripts/verify-issue133-payment-projection-postgres.mjs`
SHA-256 / size: `a6b8c34bb7251cc1a16ff9179ac9cac4abda304e401cff22b020294a22d6372b / 25,338 bytes`.

The future owned fixture loads protected migrations without rerunning #158's historical proof. It executes the unchanged historical R1a SQL contract against the replacement, then new replay/event/state vectors, admission boundaries, target identity, rollback failures, whole-ledger holds, equal payments, zero/cancellation, invoice void/duplicate, CRM legacy/conflict, receipt independence, reader state/privacy/cursor/access and booking pre/post-bind tests. Synthetic corruption probes roll back.

Verifier authors six forced-overlap races (four obligations plus two first-row allocators), three discarded committed-response recovery scenarios, and a second owned database whose duplicate invoice prestate must reject/roll back migration. It refuses dirty sources and all arguments except an exact future human confirmation token; sanitized child environment, loopback-only owned PG17, observed PGDATA/host binding, raw phase/concurrency evidence, source identity before/after, confirmed stop and dual-marker deletion fencing. Evidence is retained. No existing/hosted connection parameters are accepted.

**DATABASE PROOF: NOT RUN.** SQL compilation, triggers, ACLs, rollback and concurrency behavior are not certified by the static/mocked tests. Positive verifier mode and PostgreSQL startup were not invoked. Independent audit plus a fresh PO execution gate are mandatory.

## Offline validation

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

No PostgreSQL runtime proof; no hosted schema/ACL equivalence claim; local fixture models existing grants without implementing #153. Existing duplicate/cross-tenant documents can fail migration and must not be silently repaired. Unsupported refunds, providers or currencies deliberately hold. Admission remains off; no claim worker, UI wiring, communications, financial backfill, reporting/CRM runtime re-source or provider action. The offline font-fetch build limitation remains explicit.

Next: return the exact correction commit to Claude for a short exact-delta re-audit. No correction acceptance is claimed. Only after independent acceptance may Darshan authorize the single separate disposable-local positive proof. No hosted application or technician resumption is authorized.

SLICE 1 CORRECTION: COMPLETE (prepared source/package, not independent acceptance)
POSTGRESQL: NOT EXECUTED
SLICE 1 IMPLEMENTATION: COMPLETE (prepared source/package, not runtime acceptance)
R1a REPLAY AMENDMENT: IMPLEMENTED
DATABASE PROOF: NOT RUN
STAGING APPLICATION: NOT AUTHORIZED / NOT RUN
PRODUCTION: UNTOUCHED
GVM: UNTOUCHED
WORKER/LIVE ADMISSION: OFF
REPORTING/CRM RUNTIME CUTOVER: NOT IMPLEMENTED
#153 CUTOVER: NOT IMPLEMENTED
TECHNICIAN RESUMPTION: NOT AUTHORIZED
