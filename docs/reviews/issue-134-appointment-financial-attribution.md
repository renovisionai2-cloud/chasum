# Issue #134 — appointment/customer financial attribution candidate

**Status:** PREPARED LOCALLY / HOSTED UNAPPLIED / EXECUTABLE POSTGRESQL PROOF BLOCKED BY LOCAL SANDBOX.
**Competitive Product Gate:** NOT_APPLICABLE — bounded enforcement of the reviewed financial-integrity invariant and exact error mapping; no new operator workflow.

## Authority and bounded scope

Product Owner approval authorizes only the eight-file local implementation in section 5 of the hash-bound [runtime contract](issue-134-next-runtime-contract.md), reviewed in [the final design review](issue-134-next-runtime-contract-review.md). The design SHA-256 remains `33af6e34083c43730137f2fa0b748ed735de6c985980ffffe53ccb6c08961f0f`; both historical documents remain byte-identical.

The invariant is unchanged: any durable appointment-linked ledger row freezes appointment/customer attribution and blocks appointment hard-delete. No-ledger REQUESTED/FAILED/SKIPPED attempts do not freeze reassignment. Existing canonical guards and R1a functions remain unchanged. The legacy customer-only NULL-attempt/NULL-appointment cascade exposure remains #153 and blocks activation.

## Coordinator technical clarification

The reviewed draft named the FK `commerce_transactions_appointment_business_customer_financial_fk`. Independent byte counting and PostgreSQL's 63-byte identifier limit established that this is 64 bytes and would be implicitly truncated. The coordinator's 2026-10-06 implementation clarification explicitly replaces it with the 57-byte `commerce_transactions_appt_business_customer_financial_fk`.

This 64→57-byte correction changes no product rule, relation, column tuple, referential action, object count, privilege, financial scope, execution authority, or environment. No object with the original name was deployed, so there is no migration-history or hosted-object impact. The candidate uses the replacement explicitly in DDL, PostgREST error mapping, and tests; it never relies on PostgreSQL truncation. The original hash-bound design and final design review remain unchanged as historical authority, and this candidate record is the explicit reconciliation source for the clarification.

## Candidate

- New CLI-generated migration: `20261007012529_issue_134_appointment_financial_attribution.sql`
- Migration SHA-256: `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`
- Adds only:
  - `appointments_id_business_customer_financial_key`;
  - `commerce_transactions_appt_business_customer_financial_fk`;
  - `guard_legacy_commerce_transaction_appointment_attribution_v1()`;
  - `commerce_transactions_legacy_appointment_attribution_guard`.
- The FK is validated, immediate, `NOT DEFERRABLE`, `MATCH SIMPLE`, `ON UPDATE RESTRICT`, `ON DELETE NO ACTION`; the old appointment `ON DELETE SET NULL` FK remains.
- The invoker guard has fixed `pg_catalog, pg_temp` search path and no direct PUBLIC/anon/authenticated/service_role EXECUTE. It runs after the accepted canonical guard alphabetically and acts only when `OLD.payment_attempt_id IS NULL AND OLD.appointment_id IS NOT NULL`.
- The migration is one explicit transaction with 5-second lock and 30-second statement budgets. It checks required column type/nullability, the old FK, accepted guard presence, object collisions, and existing tuple mismatches before DDL. It contains no DML/backfill, RLS/ACL/table-grant/default-ACL change, destructive DDL, or hosted command.

`updateBooking()` maps only SQLSTATE `23503` with the exact corrected constraint token found in the actual PostgREST `message`/`details`/`hint` shape. It returns the approved fixed operator message and exposes no database details or row values. Arbitrary `23503`, all `23514`, and prefix/suffix lookalikes retain existing error behavior. Rejection occurs before event/audit emission.

## Proof authored

The static migration suite pins the accepted foundation (`dee700ae…ee3a47`), accepted R1a (`4b7e3855…bad5ee7`), and reviewed design hash. It checks exact object count/names, FK semantics, invoker posture, no grants/RLS changes, atomic timeouts, preflight stops, no DML/backfill, and the 57-byte correction.

The SQL contract and owned-cluster verifier are authored to prove:

- all required legacy statuses freeze attribution and DELETE while non-attribution fields remain mutable;
- matching legacy NULL→appointment attachment then freezes;
- the #153 NULL/NULL customer cascade remains explicit;
- no-ledger REQUESTED/FAILED/SKIPPED attempts permit reassignment;
- canonical protection remains owned by the accepted guard;
- invalid/cross-tenant tuples never commit;
- representative authenticated RLS and service-role/BYPASSRLS behavior using a disclosed synthetic-local bootstrap, not claimed hosted privileges;
- canonical/legacy appointment, customer, and Business hard-delete outcomes;
- ordinary reschedule/cancel/notes updates;
- true multi-session payment-first/reassignment-first commit and rollback variants;
- failed R1a commit coherence with one retained attempt key and no ACCEPTED event, ledger, or obligations;
- 2,000-row bounded unique-index/FK validation timing, row digests, and atomic lock-timeout rollback.

The verifier accepts no `DATABASE_URL` or caller endpoint. It creates a uniquely marked PG17 cluster, binds TCP to `127.0.0.1` with Unix sockets disabled, verifies marker/binding/version before synthetic SQL, strips all inherited `PG*` variables, retains redacted evidence outside the repository, stops the cluster, and removes only marker-owned PGDATA.

## Actual local results

- New focused unit tests: **2 files / 16 tests PASS**.
- Booking/commerce/foundation/R1a/new-attribution regression: **61 files / 564 tests PASS**.
- Typecheck: **PASS**.
- Targeted lint: **PASS, 0 errors / 0 warnings** after removing one initial unused-helper warning.
- Verifier syntax: **PASS**.
- Build: **FAILED before compilation** because sandboxed Turbopack rejects the repository's existing out-of-root `node_modules` symlink. Exact failure: `Symlink [project]/node_modules is invalid, it points out of the filesystem root`. No dependency/config/lockfile change or sandbox escalation was attempted.
- PostgreSQL execution: **BLOCKED before cluster creation and before SQL**. Homebrew PostgreSQL 17.11 `initdb` reached bootstrap and the sandbox denied `shmget(..., 56, ...)` with `Operation not permitted`. Supported mmap settings did not remove that bootstrap syscall. No server started, port accepted connections, database was created, or synthetic SQL ran. Therefore concurrency, FK/cascade behavior, RLS-role execution, index/validation cost, row digests, and timeout rollback are **AUTHORED / NOT EXECUTED**, not PASS.

Seven later failed verifier attempts removed their marker-owned PGDATA and retained summaries outside the repository. The first pre-hardening attempt left an empty initdb-cleaned directory at `/tmp/chasum-issue134-attribution-evidence-HZi2On/pgdata`; specialized deletion was rejected, and no retry, alternate deletion, or permission escalation occurred. No PostgreSQL process started in any attempt.

## Local artifacts and holds

The Supabase CLI created untracked `.supabase/telemetry.json` while generating the one migration. Its specialized deletion was rejected. Per coordinator instruction it remains untracked, is not hidden by `.gitignore`, and must be excluded from every commit.

This is not a database-accepted candidate while executable PostgreSQL proof remains blocked. No Staging/Production/GVM database, Auth, provider, worker, fixture, payment, retained C01/Run02 row, permission, flag, migration history, or release control was contacted or changed. Foundation, R1a, C01, Phase A, historical USD rows, #153, #133, projection/workflow, technician and GVM Operational Acceptance holds remain unchanged.

## Next independent gate

Run the authored verifier in an approved environment that permits a disposable local PostgreSQL 17 cluster, record the actual bounded cost/interleaving results, and recompute the exact candidate identity. Only after that proof passes is the exact commit ready for Claude's independent candidate audit. No Claude audit is claimed here.
