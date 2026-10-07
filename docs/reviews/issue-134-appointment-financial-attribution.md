# Issue #134 — appointment/customer financial attribution candidate

**Current status:** HUMAN LOCAL PROOF STOPPED IN CONTRACT PASS 02 / PROOF-ONLY TYPE CORRECTION AWAITING INDEPENDENT DELTA REVIEW / HOSTED UNAPPLIED.

## Current continuation — executed local proof reached the new migration and stopped on proof typing

Darshan's second human-owned Terminal run used coordinator-observed source at `d23ba22ce7a271e18f777c892b09945ca498337d`. The evidence artifacts do not embed a repository identity, so this attribution remains a before/after source observation rather than an artifact-internal cryptographic binding.

**Run classification: `STOPPED_IN_CONTRACT_PASS_02 / NOT A DATABASE PASS / NOT AN INVARIANT FAILURE`.** PostgreSQL 17.11 started on exact loopback, the synthetic foundation/R1a fixture loaded, and the new attribution migration completed locally in 20ms. The bounded observation was `2003|2001|188416|401408|155648`. The run then stopped at `issue-134-appointment-financial-attribution-contract.sql:236`, before concurrency or lock-timeout work, because PostgreSQL could not compare `name[]` from `array_agg(pg_trigger.tgname)` with the expected `text[]` literal.

The retained `summary.json` is SHA-256 `20b18b148e915fd79af7bc9d31a727e4ff74633ad8c51da01477b515bfc5ab9a`; `postgres.log` is SHA-256 `d7e3195eb1436a78c0d8d4db579f4d66833f6427069925ba5714765a68144e2a`. Both remain byte-identical outside the repository. The summary records `passed=false`, `concurrency=[]`, `lockTimeoutElapsedMs=null`, `stopConfirmed=true`, `pgdataRemoved=true`, `cleanupFailure=null`, stop status 0 and final status 3. The coordinator separately confirmed PGDATA absent.

This was a deterministic proof-expression type error, not rejection by the appointment/customer invariant and not a hosted migration application. The proof-only correction casts each catalogue `tgname` value to `text` inside `array_agg`, while retaining the exact two-name array, catalogue ordering and fail-closed mismatch exception. It does not cast the expected identifiers to PostgreSQL `name`, truncate them, weaken the assertion, or change runtime/migration behavior.

A bounded source scan covered the remaining contract/verifier assertions for the same concrete class. The `pg_attribute.attname` aggregates are assigned into declared `text[]` variables and PASS 01 executed before this failure; `pg_proc.proconfig` is already `text[]`; the scalar `"char"` catalogue predicates, regprocedure/OID comparisons and ACL OID check all executed before the failing trigger comparison. Remaining expected-name arrays are parameters already typed `text[]`. The verifier has no further catalogue-name array comparison. No additional analogous deterministic defect was found. This is a source scan plus partial-run evidence, not execution proof of PASS 02 onward; the hard-delete cases, concurrency interleavings and timeout rollback remain unexecuted.

Offline validation after the correction: two focused files / 25 tests PASS; scoped booking/booking-engine/commerce/migrations 63 files / 587 tests PASS; typecheck, targeted lint and verifier syntax PASS. No PostgreSQL process, verifier, build, network or hosted operation was run by this correction. Independent delta review is next; only afterward may another human execution be requested under the existing local-only authorization.

## Prior continuation — reviewed local identity-format correction

**Human local attempt: STOPPED_BEFORE_FIXTURES. Corrected source: CLAUDE SOURCE_DELTA_VERDICT PASS. DATABASE_PROOF_GATE: NOT MET.**

The human-started disposable PostgreSQL 17.11 instance successfully started and performed the initial identity SELECT. The original verifier rejected its `127.0.0.1/32` text value against exact `127.0.0.1` equality, before any dedicated test database, fixture/migration load or financial contract. This is a reproduced identity-format defect, not evidence that the payment/attribution kernel failed. The stopped-run evidence reports confirmed shutdown, no cleanup failure and owned PGDATA removal, independently corroborated by the log and absent directory. Original summary/log remain unchanged at SHA-256 `d12a8ce2eb3d76dc78a5bd7a5d9ede63556ec8cf805990bc43ad54f1e61de299` and `e5b54ed10e02b1a93ab9febcf7a35cd86028dda9beacc12d3dffd2a6b889bcdd`.

Sol corrected only the SQL address projection to `pg_catalog.host(pg_catalog.inet_server_addr())`, preserving every strict bind/host/port/realpath/marker/cleanup predicate. Corrected source `9ea36e72366fa4c17d96dd4d8a89b375ab7c2cd4`; verifier SHA-256 `1273354af70bbc574468a497affee80a7450b49fe59c2d49d6b76cbed05e1802`. The four-file delta adds one focused regression and updates this record/changelog; migration, application mapping and financial SQL contract are unchanged from accepted source `d04a79c9`.

Claude continued independent session `797e841c-7601-4f61-9e0c-363ec6842e7e`, with reported model `Claude Opus 5 300K High No Thinking`, and returned **SOURCE_DELTA_VERDICT: PASS** after reading original evidence, hashing source/evidence, inspecting the four-file delta and independently running 24 focused tests plus 63 files / 586 scoped tests, syntax and targeted lint. Sol independently ran 24 focused tests, syntax and targeted lint. Neither reran PostgreSQL, a build, or any hosted operation. The original source audit remains valid within its recorded limits; no foundation/R1a/C01 audit was reopened.

Coordinator qualifications to the verbatim review below: the initial identity SELECT **did run**; “no SQL” means no fixture/migration/financial-contract SQL, not zero connection queries. The adjacent version predicate proves PG >=17, not a categorical upper-major bound; the stopped-run server log explicitly identifies 17.11. Temp-path delimiter and elapsed-time observations are not stand-alone execution proof. Source control flow plus original stopped-run records establish the pre-fixture stop. The summary does not embed repository/verifier hashes; source-to-run identity is attested by the coordinator's before/after observations, not a cryptographic binding inside the artifact. This remains a disclosed provenance limitation, not a waived financial-test requirement.

Next is one HUMAN local run of the corrected verifier under the existing local-only proof approval. It creates a fresh owned disposable cluster and must not repeat the unchanged failing bytes or the denied agent-sandbox bootstrap. No new policy approval is needed for this unchanged financial scope. No token or hosted URL is required. The prior human-run evidence remains retained, not overwritten. On any new failure, stop and preserve that result; no automatic retry. Current code/source readiness is NOT database acceptance, Staging application permission or GVM Operational Acceptance.

This is a factual documentation-only closeout after the corrected-source audit. No fixture, worker, payment, Staging/Production/GVM operation, migration application, permission change, activation or merge is included. All prior operational holds remain.

<details><summary>Claude final narrow delta and actual-stop review (verbatim final block)</summary>

````markdown
# CLAUDE — PR157 DELTA / HUMAN LOCAL STOP REVIEW — Issue #134

Continuation of accepted source audit session `797e841c-7601-4f61-9e0c-363ec6842e7e`.
Not a fresh foundation/R1a/C01 audit. I did not execute or import the verifier, initdb,
pg_ctl, SQL, any build, network or credential path, and did not retry the established
agent-sandbox `shmget` denial.

## SOURCE_DELTA_VERDICT: PASS (narrow format correction accepted)

Exactly four files changed vs `74d1b083cb6cfe7d7873b94d0b01f2fdee797e03`
(+44/−12): the verifier, the migration unit test, the candidate review, and the changelog.
No fifth file. The functional change is one line:

`inet_server_addr()::text` → `pg_catalog.host(pg_catalog.inet_server_addr())`

Verified **not** a loosening. Every acceptance predicate is unchanged strict equality:
`listenAddresses !== "127.0.0.1"`, `serverAddress !== "127.0.0.1"`,
`serverPort !== String(port)`, `isPostgres17 !== "t"`, `!observedDataDirectory`, and
`realpathSync(observedDataDirectory) !== realpathSync(dataDir)`. I searched the verifier for
any substring, prefix, regex, `split("/")`, `startsWith`, or SQL `LIKE` relaxation and found
none — the correction normalizes the value at the SQL projection layer rather than weakening
the comparison, which is the right fix direction. Per the coordinator-supplied PostgreSQL 17
`functions-net` Table 9.40, `text(inet)` includes the netmask while `host(inet)` returns the
address only; I am relying on that documented behavior, not on reviewer SQL execution.
Schema-qualifying both functions additionally hardens against `search_path` shadowing, a
small improvement over the prior bare call.

Fail-closed behavior is preserved in the failure directions that matter: a non-loopback bind,
an IPv6 bind, or a NULL `inet_server_addr()` (socket connection) all still mismatch and abort.
No alternate target, endpoint override, or credential path was introduced; the minimal child
environment, private empty `.pgpass`/`pg_service.conf`, `PGSYSCONFDIR` redirect, marker
checks, stop-confirmation (`pg_ctl status` == 3) and single marker-gated `rmSync(dataDir)`
are untouched.

**No application, migration, or financial-contract change.** `git diff d04a79c9..HEAD` across
`supabase/`, `lib/`, and `tests/postgres/` is empty. Migration stays
`fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`.

Documentation delta is accurate and does not conceal the outcome: it classifies the run
STOPPED_BEFORE_FIXTURES / NOT PASS, cites the official docs, states no database PASS is
claimed, relabels my prior audit as historical rather than restating it as current, and
preserves all holds. No false PASS found.

## Actual-human-run verdict: STOPPED_BEFORE_FIXTURES — NOT A FINANCIAL FAILURE

Classification confirmed from the original evidence, not from the report. This was the
harness refusing to proceed on its own identity self-check — a fail-closed abort, not a
financial-contract failure and not a hosted event.

Notably, every *substantive* ownership property was in fact satisfied in that run: field 1
`127.0.0.1`, field 3 port `57017` matching the allocated port, field 4 `t` (PG≥17), and
field 5 the owned PGDATA path. Only field 2's textual form (`127.0.0.1/32`) differed. So the
cluster was correct and the assertion was wrong — which is the benign ordering.

Proof that no fixture/database/SQL ran, from the retained summary's own null fields:
`dataDirectory`, `postgresVersion`, `boundedFixture`, `migrationElapsedMs`,
`lockTimeoutElapsedMs` are all `null` and `concurrency` is `[]`. `dataDirectory: null`
places the throw at the binding check, which precedes the version read, which precedes
`createDatabase()`. The server log independently corroborates: ready to accept connections at
22:36:53.218, fast shutdown requested at 22:36:53.470 — a ~252 ms window, far too short to
load the five fixture/migration files. The log also shows initdb had completed successfully,
confirming the human environment does permit PG bootstrap (unlike the agent sandbox).

### Proof of cleanup
- `stopCommandStatus: 0`, `statusCommandStatus: 3` (no server running) → `stopConfirmed: true`
- `cleanupFailure: null`, `pgdataRemoved: true`, `passed: false`
- I independently confirmed `…PQdbgH/pgdata` is **absent** on disk now.
- Retained dir is `0700`; only `ownership-marker`, `postgres.log`, `summary.json`, and
  `home/`. Both `home/.pgpass` and `home/pg_service.conf` are **0 bytes, 0600** — no
  credential was present, used, or captured.
- Evidence immutability: `summary.json` SHA-256 recomputes to
  `d12a8ce2eb3d76dc78a5bd7a5d9ede63556ec8cf805990bc43ad54f1e61de299`, matching the dispatch
  value byte-exactly. Nothing was rewritten or deleted. I deleted no files.
- Pre-existing `.supabase/` remains untracked, uninspected, not gitignored; git status is
  `?? .supabase/` only.

## Adjacent identity parsing — narrow check, no deterministic next-step error

`binding.split("|")` into five scalars is safe: `listen_addresses` is pinned by the start
option, and a `|` inside the temp path (not possible under macOS `TMPDIR` + `mkdtemp`) would
truncate field 5 and fail the realpath comparison rather than widen acceptance.

I also checked the immediate next-step loader asymmetry: `loadAcceptedBaseline` runs one
`psql` per file (separate sessions) while the success database uses a single multi-`-f`
session. This would break if a fixture's `on commit preserve rows` temp table were read
across files — verified it is not: each fixture creates and reads only its own temp table
within the same file, and neither accepted migration references either. No defect.

Cosmetic only: `inet_server_port()` and `current_setting()` remain unqualified while the two
corrected functions are `pg_catalog`-qualified. Negligible in a freshly provisioned owned
cluster.

Non-blocking recommendation (evidence provenance, not a code defect): `summary.json` records
no repository HEAD or verifier SHA-256, so the retained evidence cannot be cryptographically
bound to the reviewed bytes — the report's attribution of the run to `74d1b083` is not
independently verifiable from the artifact. Recording HEAD and the verifier hash into the
summary would close this before the next run produces acceptance-grade evidence.

## Tests I actually ran (offline only)

| Check | Result |
|---|---|
| Focused attribution tests (2 files) | **24/24 PASS** — matches claim |
| Scoped booking/booking-engine/commerce/migrations | **63 files / 586 PASS** (+1 new test) |
| `node --check` verifier | PASS (syntax only, no execution) |
| eslint — verifier + migration test | PASS, no diagnostics |
| Hashes / diff / four-file scope / preservation | PASS |
| Verifier, initdb, pg_ctl, SQL, DB bootstrap, build, network, credentials | **NOT RUN** |

## Exact SHA / hash provenance (all recomputed by me)

- HEAD `9ea36e72366fa4c17d96dd4d8a89b375ab7c2cd4`, tree
  `0137b5373aaeabea000c12e53dc5ba9f68ff5276`, parent `74d1b083cb6cfe7d7873b94d0b01f2fdee797e03`
- Verifier `1273354af70bbc574468a497affee80a7450b49fe59c2d49d6b76cbed05e1802` (matches claim)
- Migration `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524` (UNCHANGED)
- Mapping `727cd72b54fd8a306456414d4f0cc248262bd89ee1a9ef3889f8fa3fe1dcecdc` (UNCHANGED)
- Financial SQL contract `e87deb3946846c5fedfb95c9191c005360eb8f6819091de3da49ca5d990990aa` (UNCHANGED)
- Design `33af6e34083c43730137f2fa0b748ed735de6c985980ffffe53ccb6c08961f0f` (UNCHANGED)
- Foundation `dee700ae…1ee3a47`, R1a `4b7e3855…4bad5ee7` (UNCHANGED)
- Human evidence: summary `d12a8ce2…1de299`, log
  `e5b54ed10e02b1a93ab9febcf7a35cd86028dda9beacc12d3dffd2a6b889bcdd` — both match claims

## Remaining DATABASE_PROOF_GATE: STILL NOT MET

Corrected-source readiness and database proof are different facts. The source is accepted;
the contract has still **never executed any SQL**. Outstanding and unproven: the eleven
contract sections, all four concurrency interleavings with rollback variants, cascade/RLS
role coverage, row digests, 2,000-row bounded index/FK validation cost, and atomic
lock-timeout rollback. My predicted canonical-cascade 42501 remains unresolved by evidence;
the corrected helper accepts it under any of the three analyzed orderings, but which
mechanism actually fires is still unobserved. Everything beyond the identity query is
first-execution territory.

## One future human local command: WITHIN EXISTING LOCAL-ONLY APPROVAL

Yes. Same worktree, same verifier, newly reviewed bytes at `9ea36e72`, fresh private temp
cluster. This is instrumentation re-execution of an already-authorized local proof, so it
needs **no fresh policy approval**. It reads no credentials, has no hosted or remote target,
applies no migration to any Chasum environment, writes nothing into the repository, and
deletes nothing outside its own fresh temp directory.

```
cd /Users/darshan/chasum-worktrees/issue-134-appointment-financial-attribution && node scripts/verify-issue134-appointment-financial-attribution-postgres.mjs
```

No arguments, no environment variables, no sudo; must run from the worktree root. Do not
re-run the unchanged failing bytes, and do not automate this or retry the denied agent-sandbox
launch. Unchanged disclosure: during the bounded window the throwaway cluster uses `trust`
auth on an ephemeral loopback port with synthetic data only. If it stops again, capture
`summary.json` and the verbatim error rather than re-running with modifications; a second
stop before fixtures is still not a financial failure.

## Not authorized

No Staging, Production, activation, migration application, hosted validation, #153 change,
projection execution, merge, release, or GVM action. Migration remains PREPARED ONLY /
HOSTED UNAPPLIED; the branch still depends on PR156. Build remains NOT PASSED (sandbox DNS
blocked existing Google Fonts downloads) — environmental, not a candidate defect. All
numerical hosted figures referenced in the docs remain dated prior observations, not current
reads. The approved financial rule and my earlier audits stand within their stated bounds;
GVM Operational Acceptance is not earned.
````

</details>

**Status:** HUMAN LOCAL PROOF STOPPED IN CONTRACT PASS 02 / PROOF-TYPING CORRECTION AWAITING DELTA REVIEW / HOSTED UNAPPLIED.
**Competitive Product Gate:** NOT_APPLICABLE — bounded enforcement of the reviewed financial-integrity invariant and exact error mapping; no new operator workflow.

## Final independent source review preserved — database proof still open

**SOURCE_VERDICT: AUTHORING_PASS. DATABASE_PROOF_GATE: NOT MET.** The corrected executable candidate is `d04a79c922835c1bd831cf5ab33c39a6512e547a`, tree `af2a8f56ad8d7c649bf252ef9b156cbaa70a6a21`. Its migration remains SHA-256 `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`. The subsequent publication closeout changes documentation only, not reviewed runtime, tests, verifier or SQL.

Claude independently reviewed and hashed the exact corrected candidate in session `797e841c-7601-4f61-9e0c-363ec6842e7e` (reported Claude Opus 5 300K High), reran 23 focused tests and 585 scoped tests across 63 files, typecheck, targeted lint and verifier syntax, and separately verified 13 mapping counterexamples. No blocking source correction remains. The initial HOLD was corrected, not waived: targeted canonical cascade SQLSTATE expectations, exact constraint mapping, verifier ownership/environment/stop-confirmation cleanup, and bounded non-key edit coverage.

**No PostgreSQL contract PASS is claimed.** The previously observed agent-sandbox `shmget` bootstrap denial remains, and the verifier was not retried in that sandbox. The later human-owned run described below started PostgreSQL but stopped at the initial identity query before any database, fixture, migration or financial contract SQL. Build is not passed: the ordinary supported webpack build reached existing font downloads but sandbox DNS could not resolve Google Fonts. Full-suite and hosted/workflow proofs remain unperformed. No proof requirement is waived by the source verdict.

Claude separately accepted a human-owned local proof as safe for the reviewed executable. Darshan personally ran that exact command once. The run exposed a bounded verifier display-format defect; the unchanged failing script must not be requested again. Any later database run remains human-only after delta review of the correction. This is test instrumentation, not a Staging migration-application approval, and no automated database rerun is authorized here.

The source branch remains dependent on PR156; no merge/release, Staging/Production/GVM action, historical USD repair, #153 change, worker execution, C01 rerun, or technician resumption follows. Existing pending synthetic records remain excluded from future worker activation. The untracked `.supabase/telemetry.json` and previously disclosed empty temp residue remain outside the candidate; no refused deletion was retried.

## Human local verifier result — STOPPED_BEFORE_FIXTURES

Darshan's human-owned Terminal run used publication HEAD `74d1b083cb6cfe7d7873b94d0b01f2fdee797e03` with reviewed executable parent `d04a79c922835c1bd831cf5ab33c39a6512e547a`. The retained `summary.json` is SHA-256 `d12a8ce2eb3d76dc78a5bd7a5d9ede63556ec8cf805990bc43ad54f1e61de299`; the retained `postgres.log` is SHA-256 `e5b54ed10e02b1a93ab9febcf7a35cd86028dda9beacc12d3dffd2a6b889bcdd`. Both original files remain byte-identical outside the repository.

The evidence records PostgreSQL 17.11 starting on configured loopback `127.0.0.1:57017`, accepting the initial identity query, then shutting down normally. The summary truthfully reports `passed=false`, `stopConfirmed=true`, `pgdataRemoved=true`, and `cleanupFailure=null`. Execution stopped before `createDatabase()`: no fixture, accepted migration, new migration, financial contract, interleaving, digest, cost or timeout SQL ran.

The returned identity was `127.0.0.1|127.0.0.1/32|57017|t|…/pgdata`. [PostgreSQL 17 network-address documentation](https://www.postgresql.org/docs/17/functions-net.html) states that converting `inet` to `text` includes the netmask, while `host(inet)` returns the address without its netmask. The strict equality check correctly rejected `127.0.0.1/32`; the query representation was wrong. The bounded correction replaces only `inet_server_addr()::text` with `pg_catalog.host(pg_catalog.inet_server_addr())`. Exact configured-address, host, ephemeral-port, PG17, canonical `data_directory`, marker, private child-environment, stop-confirmation and ownership checks remain fail-closed. Adjacent fields use stable unaligned scalar output; delimiter ambiguity would still fail closed rather than broaden endpoint acceptance.

Focused offline regression now pins the normalized host query, absence of the old cast, and unchanged strict host/port/version/ownership comparisons. Two focused files / 24 tests, verifier syntax and targeted lint pass. This correction awaits independent delta review; it is not database-proof acceptance.


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
- Verifier display-format correction: **2 focused files / 24 tests PASS**; verifier syntax and targeted lint **PASS**. No database process was started by these checks.
- Build: installed Next.js 16.3.6 help confirmed supported `--webpack` mode. A one-time sanitized no-secrets webpack build passed configuration and entered compilation, then failed because sandbox DNS could not resolve `fonts.googleapis.com` for existing `next/font` Inter and JetBrains Mono downloads. Turbopack was not retried; no network permission, dependency/config change or credential was requested.
- PostgreSQL execution: the agent-sandbox attempts remained blocked before SQL. The first human run stopped at identity verification; the corrected second human run loaded the synthetic fixture and accepted R1a contract, applied the new migration locally in 20ms, then stopped on the PASS 02 `name[]`/`text[]` proof-expression mismatch. Concurrency, hard-delete/cascade completion, RLS-role completion and timeout rollback remain incomplete; the migration timing/fixture-size observation is bounded local evidence only, not a database PASS.

Seven agent-sandbox attempts removed their marker-owned PGDATA and retained summaries outside the repository. The first pre-hardening attempt left an empty initdb-cleaned directory at `/tmp/chasum-issue134-attribution-evidence-HZi2On/pgdata`; specialized deletion was rejected, and no retry, alternate deletion, or permission escalation occurred. Separately, the human run started and cleanly stopped its owned server and removed its PGDATA, as recorded above.

## Local artifacts and holds

The Supabase CLI created untracked `.supabase/telemetry.json` while generating the one migration. Its specialized deletion was rejected. Per coordinator instruction it remains untracked, is not hidden by `.gitignore`, and must be excluded from every commit.

This is not a database-accepted candidate while executable PostgreSQL proof remains incomplete. No Staging/Production/GVM database, Auth, provider, worker, fixture, payment, retained C01/Run02 row, permission, flag, migration history, or release control was contacted or changed. Foundation, R1a, C01, Phase A, historical USD rows, #153, #133, projection/workflow, technician and GVM Operational Acceptance holds remain unchanged.

## Next independent gate

Independent delta review of the narrow proof-typing correction is next. Only after that review may a human choose to run the corrected verifier in an approved local environment with a new disposable PostgreSQL 17 cluster; do not request another run of the unchanged failing SQL bytes. Record the actual contract/interleaving/timeout results before any Staging application gate. No independent review or database PASS for this correction is claimed here.


<details>
<summary>Historical final source audit (predates the stopped human verifier run)</summary>

```markdown
# CLAUDE — SAME-SESSION DELTA AUDIT — Issue #134 corrected attribution candidate

## Exact identity (independently recomputed)

- HEAD: `d04a79c922835c1bd831cf5ab33c39a6512e547a`
- Tree: `af2a8f56ad8d7c649bf252ef9b156cbaa70a6a21`
- Parent / prior HOLD candidate: `8d60454ce6f70572662ae2654121110966be975e`
- Original base: `789f54d142bc80200654c04b87d82bced37e42e9`
- Migration SHA-256: `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524` — **byte-identical to the HOLD candidate**
- Hash-bound design `docs/reviews/issue-134-next-runtime-contract.md`: `33af6e34083c43730137f2fa0b748ed735de6c985980ffffe53ccb6c08961f0f` (UNCHANGED)
- Foundation `dee700ae…ee3a47`, R1a `4b7e3855…bad5ee7` (UNCHANGED)
- New hashes: update.ts `727cd72b…ecdc`, contract SQL `e87deb39…90aa`, verifier `e1c361b0…bfff`
- Dirty status before and after my work: `?? .supabase/` only. `.supabase/telemetry.json` still untracked and NOT in `.gitignore`.
- Delta vs `8d60454c`: 7 files, +420/−111. Inventory vs base still exactly the 8-file section 5 allowlist. All engineer-claimed identity values matched.

## SOURCE_VERDICT: AUTHORING_PASS

Both HOLD findings and all three non-blocking findings from my prior audit are resolved by
method, verified against source. I found no new blocking code defect. The migration is
untouched, so my prior schema-semantics acceptance carries forward unchanged.

## DATABASE_PROOF_GATE: NOT MET — OPEN

The PostgreSQL contract remains AUTHORED / NEVER EXECUTED. Per instruction I did not rerun
initdb, pg_ctl, the verifier, or any database bootstrap, and I did not touch the established
`shmget(..., 56, ...)` sandbox denial. Concurrency interleavings, cascade/RLS behavior, row
digests, 2,000-row validation cost, and lock-timeout rollback are authored only. The
candidate and changelog both state this correctly and claim no database PASS and no
independent review of this commit. No overclaiming found anywhere I checked.

## Verification of the corrections

**B1 — canonical cascade 42501, narrowly qualified: RESOLVED.** The blanket
`expect_integrity_failure` is fully renamed/removed (no residual references).
`tests/postgres/…-contract.sql:52-137` adds
`expect_canonical_appointment_delete_failure`, which accepts only: `42501` **with** exact
`PAYMENT_ATTEMPT_SERVER_ONLY`; `23514` **with** exact
`PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH`; or `23503` with the composite FK or
`commerce_payment_attempts_appointment_fk`. A bare permission error cannot satisfy it, so
arbitrary 42501 is not accepted. It then proves appointment `…032` retains its
business/customer tuple and that exactly 1 canonical ledger row, 1 ACCEPTED event and 4
obligations survive — a genuine post-rejection preservation check that did not exist before.
I confirmed `commerce_payment_attempts_appointment_fk` and `_customer_fk` really exist
(foundation `:62,:64`), so the named alternatives are live, not dead strings.
`expect_named_integrity_failure` now requires 23503/23514 **plus** a named mechanism at all
four remaining call sites.

**B1a — design-review qualification: RESOLVED correctly.**
`docs/reviews/issue-134-appointment-financial-attribution.md:18-26` records the conditional
mechanism (SET NULL executing as referencing-table owner can trip `42501` before the later
`23514`) in the candidate record only. Both hash-bound historical documents are byte-unchanged.

**Exact-mapping counterexamples: RESOLVED.** `lib/booking-engine/mutations/update.ts:21-37`
now requires `code === "23503"` plus either strict equality on a structured `constraint`
field or the literal `constraint "<exact name>"` in `message`. `details` and `hint` are no
longer consulted at all. I re-implemented the predicate standalone and ran 13 cases,
including two beyond the engineer's suite:

| Case | Maps | Required |
|---|---|---|
| Real referenced-side 23503 message | yes | yes |
| Real structured `constraint` field | yes | yes |
| 63-byte valid `…_fk$other` suffix | no | no |
| Unicode `…_fk é` suffix | no | no |
| Cyrillic homoglyph name (mine) | no | no |
| `prefix_…_fk` | no | no |
| Other FK, token in `hint` | no | no |
| Other FK, token in `details` | no | no |
| Structured `…_fk$other` | no | no |
| Single-quoted name | no | no |
| 23514 with exact token | no | no |
| Unquoted bare token | no | no |
| Token echoed inside `details` key values (mine) | no | no |

All 13 behaved as required. Note the last case is a real improvement, not cosmetic: the
previous predicate read `details`, where PostgreSQL echoes row key values, so
attacker-influenced text could have spoofed the calm message. That vector is now closed. The
candidate review's own admission that the old boundary predicate would have mapped `$other`
is accurate — I confirmed `$` is not in `[A-Za-z0-9_]`.

**Verifier ownership / environment / cleanup: RESOLVED.**
- `data_directory` ownership is now canonical: `realpathSync(observed) !== realpathSync(dataDir)`
  aborts before any fixture SQL, so a pre-existing or hosted backend on the chosen port is
  categorically rejected rather than circumstantially unlikely.
- `createChildEnv` is now an **allowlist** (PATH, HOME, USER, LOGNAME, PGPASSFILE,
  PGSERVICEFILE, PGSYSCONFDIR, plus optional LANG/LC_*/TZ/TMPDIR) rather than a PG*
  denylist. Private `HOME` (0700) with empty `.pgpass` and `pg_service.conf` (0600) and
  `PGSYSCONFDIR` redirected, so the real `~/.pgpass` and system service files are
  unreachable. The self-test proves `STRIPE_SECRET_KEY`, `NODE_OPTIONS` and
  `DYLD_INSERT_LIBRARIES` are absent from the child env.
- No deletion of live or unconfirmed server data: `stopConfirmed` now requires
  `pg_ctl status` exit code **3** (no server running) instead of merely non-zero, so an exit-4
  unreadable-datadir no longer masquerades as stopped. `startAttempted` is set before
  `pg_ctl start`, so a half-started postmaster still goes through confirmation.
  `Refusing PGDATA removal without confirmed server stop` precedes the single `rmSync`, which
  targets only `dataDir` inside the fresh `mkdtemp` and still requires a marker match.
  Failure to confirm retains PGDATA and reports `RETAINED` on stderr.
- `originalFailure` and `cleanupFailure` are recorded separately and the original is
  rethrown with precedence, so cleanup no longer masks the real error.
- Inert `shared_memory_type=mmap` / `dynamic_shared_memory_type=mmap` flags removed.

**Non-key fixture coverage: ADDED, honestly bounded.** `service_id`, `staff_id`,
`location_id` added as plain nullable uuids, set and verified alongside status/time/notes.
The PASS 08 label is downgraded to "minimal-local", and the migration test pins that
disclosure wording. No hosted-schema or full-workflow claim.

**No kernel/applied/schema-policy expansion.** Migration byte-identical; foundation and R1a
hashes preserved; `lib/commerce/payment-attempts/**` untouched; contract SQL still opens
`begin;` and ends `rollback;`; the delta introduces **zero** new `grant`, `create policy`,
`enable row level security` or `drop policy` statements; the verifier still loads only the
seven real migration/fixture/contract files and references none of the four forbidden
production scripts, no `DATABASE_URL`, no dotenv, no `.env`.

## Checks I independently executed

| Check | Result |
|---|---|
| Focused tests (2 files) | **23/23 PASS** — matches claim exactly |
| Scoped booking/booking-engine/commerce/migrations | **63 files / 585 PASS** — matches claim exactly |
| `tsc --noEmit` | PASS, exit 0, no diagnostics |
| eslint on all 4 code/test/script files | PASS, no diagnostics |
| `node --check` verifier | PASS (syntax only; no execution) |
| Standalone mapping counterexamples | 13/13 as required |
| Hash/diff/allowlist/preservation | PASS |
| initdb / pg_ctl / verifier / DB bootstrap | **NOT RUN** (per instruction) |
| Build, full suite | NOT RUN (out of audit scope) |

No new PGDATA was created by me. The disclosed empty
`/tmp/chasum-issue134-attribution-evidence-HZi2On/pgdata` residue remains untouched. No
source edit, commit, push, hosted, credential, Production or GVM action occurred.

## Residual non-blocking notes

1. English `lc_messages` dependency. The `message` path and the contract's `sqlerrm`
   substring assertions assume untranslated messages. The local proof is safe because
   `initdb --locale=C` yields `lc_messages=C`; hosted Supabase is English. Low risk.
2. `writeFileSync(summaryPath, …)` sits outside both try blocks; a write failure there would
   mask `originalFailure`. Very low.
3. `expect_canonical_appointment_delete_failure` does not record which of its three accepted
   branches actually fired. Correct and robust, but the evidence record would be stronger if
   the observed `sqlstate`/`sqlerrm` were captured into `summary.json`. Nice-to-have only.
4. The 2,000-row bounded-cost fixture remains smoke scale and cannot bound hosted index
   build, FK validation, or lock duration.

## Verified safe minimal human command — READY

The exact unchanged source at `d04a79c9` is safe for Darshan to run personally in Terminal.
It is a local owned-cluster proof, not a remote launcher and not a schema application: no
credentials are read or passed, no remote or hosted target is reachable, no network host is
contacted, nothing in the repository is written, and nothing outside its own fresh temp
directory is deleted. This executes proofs already authorized by the approved section 5
package, so **no fresh policy approval is required**.

```
cd /Users/darshan/chasum-worktrees/issue-134-appointment-financial-attribution && node scripts/verify-issue134-appointment-financial-attribution-postgres.mjs
```

No arguments, no environment variables, no `sudo`. Must run from the worktree root (SQL paths
resolve from `process.cwd()`) in a normal Terminal that permits SysV shared memory. Expect
roughly 30–60 seconds, PASS lines through contract 11 plus the four interleavings, bounded
cost and lock-timeout rollback, then owned-PGDATA removal; non-zero exit on any failure.
Disclosure, not a blocker: during the run the throwaway cluster uses `trust` auth on an
ephemeral 127.0.0.1 port, so another local process could connect for that window. It is
loopback-only with Unix sockets disabled and contains only synthetic data. A retained
`summary.json`, `postgres.log` and empty private `.pgpass` stay in the temp directory; none
contain secrets.

If it fails, capture `summary.json` and the error verbatim rather than re-running with
modifications.

## Held gates — unchanged

This audit authorizes no deployment, migration application, hosted validation, #153 change,
projection execution, activation, merge, release, Production or GVM action. Migration remains
PREPARED ONLY / HOSTED UNAPPLIED. Still owed before any Staging application gate: executed
database proof; preflight that counts **and identifies** mismatched appointment-linked
transactions; real table/index size and validation/lock budget at hosted scale; byte-for-byte
preservation of the 90 synthetic rows, CAD181/four ledgers, six attempts, eleven events,
sixteen obligations; disclosure that installing the guard immediately changes legacy
appointment-linked identity/DELETE behavior including the 42501 surface; and a separately
reviewed compatibility/application gate. #153 remains OPEN; #135 unreleased
(`release/candidates.json` still deny-all); #133, projections, workers, fresh-booking
identity and responsive operator workflows remain held. GVM Operational Acceptance is not
earned. Build is NOT PASS (sandbox DNS blocked existing `next/font` downloads) — environmental,
not a candidate defect, but it means no build evidence exists.
```

</details>
