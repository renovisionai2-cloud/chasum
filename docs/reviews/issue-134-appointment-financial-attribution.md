# Issue #134 — appointment/customer financial attribution candidate

**Status:** CORRECTED AFTER EXACT-CANDIDATE HOLD / HOSTED UNAPPLIED / POSTGRESQL PROOF NOT RUN.
**Competitive Product Gate:** NOT_APPLICABLE — bounded enforcement of the reviewed financial-integrity invariant and exact error mapping; no new operator workflow.

## Authority and bounded scope

Product Owner approval authorizes only the eight-file local implementation in section 5 of the hash-bound [runtime contract](issue-134-next-runtime-contract.md), reviewed in [the final design review](issue-134-next-runtime-contract-review.md). The design SHA-256 remains `33af6e34083c43730137f2fa0b748ed735de6c985980ffffe53ccb6c08961f0f`; both historical documents remain byte-identical.

The invariant is unchanged: any durable appointment-linked ledger row freezes appointment/customer attribution and blocks appointment hard-delete. No-ledger REQUESTED/FAILED/SKIPPED attempts do not freeze reassignment. Existing canonical guards and R1a functions remain unchanged. The legacy customer-only NULL-attempt/NULL-appointment cascade exposure remains #153 and blocks activation.

## Coordinator technical clarification

The reviewed draft named the FK `commerce_transactions_appointment_business_customer_financial_fk`. Independent byte counting and PostgreSQL's 63-byte identifier limit established that this is 64 bytes and would be implicitly truncated. The coordinator's 2026-10-06 implementation clarification explicitly replaces it with the 57-byte `commerce_transactions_appt_business_customer_financial_fk`.

This 64→57-byte correction changes no product rule, relation, column tuple, referential action, object count, privilege, financial scope, execution authority, or environment. No object with the original name was deployed, so there is no migration-history or hosted-object impact. The candidate uses the replacement explicitly in DDL, PostgREST error mapping, and tests; it never relies on PostgreSQL truncation. The original hash-bound design and final design review remain unchanged as historical authority, and this candidate record is the explicit reconciliation source for the clarification.

## Exact-candidate audit corrections

Claude's independent audit of commit `8d60454ce6f70572662ae2654121110966be975e` returned **HOLD** on the authored hard-delete proof. The product invariant remains correct, but the historical design review's mechanism statement is conditional: when the old referential `SET NULL` action executes as the referencing-table owner, the accepted canonical guard can raise exact `PAYMENT_ATTEMPT_SERVER_ONLY` / `42501` before its later `PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH` / `23514`. The hash-bound design and review remain unchanged; this candidate record carries the qualification.

The corrected local contract accepts `42501` only in the specifically identified canonical appointment-delete case and only with exact `PAYMENT_ATTEMPT_SERVER_ONLY`. That helper also recognizes only the named composite/attempt FK `23503` alternatives or exact canonical mismatch `23514`, then proves the appointment, ACCEPTED attempt, ledger, ACCEPTED event and four obligations remain intact. Other hard-delete checks require named `23503`/`23514` mechanisms; the generic helper does not accept arbitrary permission failures. Direct ledger mutation tests remain exact.

The audit also exposed an error-mapping false positive. The earlier token-boundary predicate mapped a valid quoted 63-byte lookalike ending in `$other`, and it trusted unrelated `details`/`hint` mentions. The correction maps only `code = 23503` plus either an exact structured `constraint` identity or the actual double-quoted constraint identity in `message`. Dollar, Unicode, prefix, alternate-quote and structured lookalikes, and an unrelated message with the intended name only in `details`/`hint`, remain unmapped.

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

`updateBooking()` maps only SQLSTATE `23503` with the exact corrected structured constraint identity or the actual double-quoted constraint name in the PostgreSQL/PostgREST `message`. It returns the approved fixed operator message and exposes no database details or row values. Arbitrary `23503`, all `23514`, `details`/`hint` mentions and quoted lookalikes retain existing error behavior. Rejection occurs before event/audit emission.

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
- ordinary status/time/notes/service/staff/location updates in an explicitly minimal synthetic-local appointment shape, not a hosted-schema or full-workflow claim;
- true multi-session payment-first/reassignment-first commit and rollback variants;
- failed R1a commit coherence with one retained attempt key and no ACCEPTED event, ledger, or obligations;
- 2,000-row bounded unique-index/FK validation timing, row digests, and atomic lock-timeout rollback.

The verifier accepts no `DATABASE_URL` or caller endpoint. It creates a uniquely marked PG17 cluster, binds TCP to `127.0.0.1` with Unix sockets disabled, and requires the backend's canonical `data_directory` to equal the owned PGDATA before fixture SQL. Child processes receive a minimal environment with fixed local paths, private HOME, empty private password/service files, `-X`, and no inherited provider secrets, loader hooks, endpoint or credential overrides. Original and cleanup failures are recorded separately. PGDATA is never removed unless the owned server's stopped state is confirmed and ownership markers match.

## Actual local results

- Corrected focused unit tests: **2 files / 23 tests PASS**.
- Booking/booking-engine/commerce/migration regression: **63 files / 585 tests PASS**.
- Typecheck: **PASS**.
- Targeted lint: **PASS, 0 errors / 0 warnings**.
- Verifier syntax: **PASS**.
- Build: installed Next.js 16.3.6 help confirmed supported `--webpack` mode. A one-time sanitized no-secrets webpack build passed configuration and entered compilation, then failed because sandbox DNS could not resolve `fonts.googleapis.com` for existing `next/font` Inter and JetBrains Mono downloads. Turbopack was not retried; no network permission, dependency/config change or credential was requested.
- PostgreSQL execution: **NOT RUN for this correction**, as explicitly required. The prior Homebrew PostgreSQL 17.11 bootstrap denial remains established: sandbox denied `shmget(..., 56, ...)` before cluster creation or SQL. Ineffective mmap flags were removed. Concurrency, FK/cascade behavior, RLS-role execution, index/validation cost, row digests and timeout rollback remain **AUTHORED / NOT EXECUTED**, not PASS.

Seven later failed verifier attempts removed their marker-owned PGDATA and retained summaries outside the repository. The first pre-hardening attempt left an empty initdb-cleaned directory at `/tmp/chasum-issue134-attribution-evidence-HZi2On/pgdata`; specialized deletion was rejected, and no retry, alternate deletion, or permission escalation occurred. No PostgreSQL process started in any attempt.

## Local artifacts and holds

The Supabase CLI created untracked `.supabase/telemetry.json` while generating the one migration. Its specialized deletion was rejected. Per coordinator instruction it remains untracked, is not hidden by `.gitignore`, and must be excluded from every commit.

This is not a database-accepted candidate while executable PostgreSQL proof remains blocked. No Staging/Production/GVM database, Auth, provider, worker, fixture, payment, retained C01/Run02 row, permission, flag, migration history, or release control was contacted or changed. Foundation, R1a, C01, Phase A, historical USD rows, #153, #133, projection/workflow, technician and GVM Operational Acceptance holds remain unchanged.

## Next independent gate

After independent delta review of the corrected commit, a human may run the authored verifier in an approved local environment that permits a new disposable PostgreSQL 17 cluster. Record the actual bounded cost/interleaving results before any Staging application gate. The earlier Claude audit applies only to `8d60454…` and returned HOLD; no independent review of the correction commit is claimed here.
