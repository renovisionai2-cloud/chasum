# Package A — blocked by the approved target's cleanup behavior

**D — FAIL — DESIGN/IMPLEMENTATION DEFECT. PRODUCTION APPLY NOT AUTHORIZED.**

Prepared on `codex/package-a-availability-realign`, exact base
`dbbe4502365858d4194f197b9ac22afe8d259c14` (parent
`19d86a265fd6eecbc2da4b66c5ad508a0b93f6b5`). No application code or migration
was changed. The accepted worker, identity, timezone, Package B, and Phase 5
gates remain closed. This package is not an instruction to apply migration 026.

## Decision and reproducible blocker

The approved repository 026 is copied verbatim into the forward artifact.
Its `availability_block_reason` compares an existing appointment's **raw** end
time to the proposed block start (`026_availability_engine.sql:49`).
`get_available_slots` and `validate_appointment_slot` extend the **proposed**
appointment's block end with cleanup; they do not reserve the existing
appointment's cleanup interval.

Actual PostgreSQL reproduction, synthetic tenant, Toronto timezone, five-minute
slot interval, 30-minute service, cleanup=5, zero buffers:

- Existing appointment: 10:00–10:30.
- Offered 10:30–11:00: **yes**, but required result is **no**.
- Validator accepts 10:30–11:00: **yes**, but required result is rejection.
- Cleanup=0 control: adjacent 10:30 is offered, correctly.
- Known-good 10:35 is offered; candidate cleanup correctly blocks 09:30 before
  the existing appointment. This confirms direction-dependent enforcement.

This is a **P1 target-design defect**, not a transcription defect. The exact
live Staging target also has it. No target function was improved or replaced to
make the tests pass. Do not apply this package unchanged to clear exposure.
The fixture agrees with application timing: `lib/actions/public-booking.ts:280`
computes end from service duration; `lib/booking-engine/types.ts:114` explicitly
leaves cleanup/buffers to RPC candidate expansion.
Control-tower approval of a narrowly corrected target is needed before further
implementation, independent review, or hosted mutation tests. Raw overlap GiST
protection cannot enforce a cleanup-only gap.

## Artifacts and boundaries

- `sql/recovery/A_production_availability_engine_realign.sql`: one transaction
  around the entire unchanged repository 026 artifact: four definitions, three
  grants, two comments. PostgREST NOTIFY follows COMMIT.
- `sql/recovery/A_production_availability_engine_rollback.sql`: fresh Production
  definitions for the three original functions; explicitly restores owner,
  configuration, original effective EXECUTE ACL and null comments; drops only
  the exact captured target classifier signature with RESTRICT; reload after
  COMMIT. No CASCADE. A later rollback also requires an independent caller and
  dependency check: catalog dependencies alone do not detect every application
  or PL/pgSQL caller.
- `tests/fixtures/package-a/production-functions.json`: exact fresh read-only
  function/metadata capture, containing no customer row data or credentials.
- `tests/fixtures/package-a/schema-and-008.sql`: disposable local fixture built
  from captured column types, three exact helper bodies, three exact old bodies,
  and selected real CHECK/GiST constraints. This is **not** a complete Production
  schema, RLS, FK, trigger, or PostgREST replica.
- `tests/integration/package-a-availability-postgres.test.ts`: opt-in actual
  PostgreSQL transition, rollback, failure injection and behavioral assertions.
  The two cleanup assertions deliberately remain failing acceptance requirements.
- `tests/unit/booking-engine/package-a-contract.test.ts`: exact artifact and
  rollback-scope assertions; these are static, not runtime proofs.
- `docs/recovery/PACKAGE_A_AVAILABILITY_EVIDENCE.json`: bounded non-sensitive
  capture summaries, target fingerprints, dependency references and test results.

Forward grants/comments exactly match 026, including anon/authenticated EXECUTE
for the new classifier, slot listing and validator. There are no table grants,
RLS changes, role changes, 041 edits, or 034–036/040 execution. Existing defaults
and pre-existing ACLs are not redesigned. Rollback restores captured PUBLIC
EXECUTE, not a newly invented restriction. ACL array ordering may differ; the
effective ACL entry set is exactly restored.

## Fresh read-only evidence

Production `kxcydvhswkuzepwzzinq`: three old functions, classifier absent; owners
postgres; fresh definitions captured. The complete referenced inventory covers
20 tables and 107 qualified table/column pairs with no missing columns. Helper
signatures and live definitions for resolve_location_id, is_location_holiday,
is_staff_on_vacation were captured. Closure and segment literals are present in
live CHECK definitions. The live raw same-staff GiST constraint was reproduced.

P-A5: zero pending/processing recurring jobs. Queue remains 581: 12 completed,
568 cancelled, one pending webhook. Held webhook
`1060a548-7518-4e8f-8741-302400d55d4c` remains pending, attempts=0, started_at=NULL.
Hold ON, Cron ENABLED, webhooks OFF are retained from the governing accepted
control-plane evidence; this task did not reopen worker observation or change
those controls. Any future apply audit must reconcile Cron remaining enabled.

GVM: 14 active services, 11 with cleanup=5; all 14 are associated with canonical
Main directly or via service_locations. No active service notice/horizon
overrides, service/staff caps, populated staff lunch rows, business/staff
closures, or service blackouts. Canonical business/location both Toronto. No
GVM data changed. PO confirmation of intended cleanup remains an exposure gate.

Staging `wnfahklzaxirftyskctd`: all four live function bodies exactly equal repo
026; identities and body fingerprints recorded. No permanent Staging downgrade,
function replacement, or synthetic data mutation was performed.

## Validation

Actual local PostgreSQL 17.11 transition 008 → A → rollback008 passed. All four target
bodies matched. The three original definitions, owners, configs/comments and
effective ACLs were restored, with the new classifier absent. Injected exception
before COMMIT preserved the original function set. Target was reinstalled only
locally for behavior tests. NOTIFY was executed locally but no PostgREST server
was present: hosted cache visibility remains untested.

Combined tests: **26 passed / 2 failed**, four test files. Local Package A suite:
19 passed / 2 failed (including transition). Contract tests: 2 passed. Existing
booking-engine tests: 5 passed. Failures are the required cleanup listing and
validation cases; no unrelated baseline failure was encountered.

Passing local behavior: cleanup0, known-good slot, candidate cleanup before an
appointment, lunch, split location hours, business closure, staff closure,
service blackout, staff/service caps, notice, horizon, duration override,
service_locations, exclude-appointment, GiST, Auckland session timezone, and
Toronto winter UTC offset after a DST boundary. The DST test is not exhaustive
ambiguous/nonexistent-local-time coverage.

TypeScript and changed-file ESLint pass. Build and unrelated full-platform suite
not run: no application source, dependency or build configuration changed.
Hosted public/operator/API POST/PATCH tests were **not run**, because the
mandatory target cleanup acceptance tests fail. No Staging residue exists from
this task. Hosted provider suppression and unrelated-tenant fingerprints were
therefore not needed and are not claimed as proven.

## Reproduction (local only)

Use a fresh disposable PostgreSQL 17 cluster at
`/private/tmp/chasum-package-a-pg/data`, Unix socket
`/private/tmp/chasum-package-a-pg/socket`, port 55483, database `package_a`, local
role postgres. Disable TCP listening. Never substitute a hosted URL. Load the
fixture only into this disposable database, then the prepared forward artifact.
The integration suite checks database, local socket and data-directory identity.

    CHASUM_RUN_PACKAGE_A_PG=1 ./node_modules/.bin/vitest run tests/integration/package-a-availability-postgres.test.ts tests/unit/booking-engine

Expected current outcome: two cleanup failures. All synthetic DML runs inside
transactions that roll back, including disconnected error cases. Post-test local
counts confirmed zero synthetic businesses and zero appointments. No provider or
hosted-client code is invoked. A local node_modules symlink reuses installed
dependencies; it is not part of the package.

## Remaining governed action

Keep the prepared artifacts local and blocked. Obtain a bounded design decision
for existing-appointment cleanup enforcement, then update the approved target
under that new authority and rerun both failing tests, transition/rollback and
safe hosted workflows. This is not a request to reopen unrelated recovery work.
Independent reviewers may inspect this package as a defect report, but it is
not ready for a successful as-built approval or Production apply.
