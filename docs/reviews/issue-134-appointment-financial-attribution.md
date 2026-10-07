# Issue #134 — appointment/customer financial attribution candidate

**LATEST GATE:** [Final independently reviewed Staging application plan](issue-134-staging-application-plan-review.md), package audit `6abdd6ff1ed79e4a7ca6c21c625c26f29b45397b2bb41b5dc8606dfecc4ae4ba`, is READY_FOR_STAGING_APPLICATION_APPROVAL. Native read-only catalogue/data preparation passed; no migration applied. This update supersedes pending preparation text below while preserving its chronology. Accepted local proof and all original financial/runtime/evidence bytes remain unchanged; no rerun is required.

**Current status:** `LOCAL_DATABASE_PROOF_ACCEPTED` / STAGING PACKAGE CORRECTED / NATIVE CATALOGUE VALIDATION + INDEPENDENT DELTA REVIEW PENDING / HOSTED MIGRATION UNAPPLIED.

## Current continuation — accepted local result; exact Staging gate prepared

Exact source HEAD `732e3821858826898e0c9ec80996e643f6cf0f2c` produced retained local summary SHA-256 `cb0b975a9e67751207ee602c50b8f91b2c5dd400376153a37827d33e93562418`. Claude independently returned `LOCAL_DATABASE_PROOF_ACCEPTED`: all 11 attribution contract sections, four true multi-session interleavings, before/after source identity and cleanup passed on the disposable synthetic PostgreSQL 17.11 fixture. Migration elapsed time was 23ms. The 5,020ms timeout occurred in the migration preflight read before `ADD CONSTRAINT`, proving atomic timeout behavior at that first lock-acquisition point. Returned responses plus durable state checks support the scoped concurrency outcomes; attempt count alone is not treated as no-lost-response proof.

The accepted result remains bounded: it is not hosted PostgreSQL 17.6 compatibility, whole-database or full booking/payment/invoice/receipt/CRM/communications proof, application deployment, cutover, Production/GVM acceptance or technician resumption. No further local rerun is required. Exact synthetic/nonsecret evidence and the independent report are retained under `docs/reviews/evidence/issue-134-attribution-local-accepted/`; originals remain unchanged.

The initial [Staging application package](../validation/issue-134-attribution-staging-application/PLAN.md) received a source-only review, but coordinator execution proved chunk 01 was not executable as written: PostgreSQL `42725`, `operator is not unique: text || "char"`, in the policy fingerprint. No catalogue PASS is claimed. Byte-identical chunk 02 genuinely passed READ ONLY at `2026-10-07T16:29:22.098708Z` for all 18 old-cohort/four noncohort snapshots, Run02 aggregate, tuple compatibility and exact retained 90-row identity/counts. Earlier 14:11–14:21 observations and a separate 16:11 preliminary catalogue snapshot remain distinct actor-supplied dated records.

The corrected package, audit SHA-256 `6b5a0dc92892e466992c8d2f4979bbb66edc04ce5a095be1514897d1267f62b5`, explicitly casts catalogue values, positively checks the accepted `commerce_transactions_attempt_guard` target/enabled/event/row/internal/function posture, and records the prior noninternal target-trigger baseline excluding only the proposed trigger. Corrected chunk 01 is `ec3fa04dca994a77eec6773a5be90b30ea84c2c9b1179e73e8176ec8233b926a`; chunk 02 remains `0f1d25963292340be887002fcbf53089bdd38e0ea5a990a40789c3af04845411`. Fresh native catalogue validation and final independent delta review are pending. The only proposed future hosted write remains the exact unchanged 6,529-byte migration SHA-256 `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`; no Product Owner apply gate exists yet.

Schema application would immediately enforce the accepted legacy appointment attribution/delete rule even while R1a remains default-off; it would not deploy the application mapping. #153/SEQ-ACL-1, #133, #135, historical USD, retained-cohort worker exclusion, hosted workflow/cutover, technician, Production and GVM holds remain unchanged. This preparation performed no SQL, verifier/test/build, network, credential, hosted action, commit, push or PR mutation.

The earlier stopped-run and correction sections below remain immutable history; their then-open local-proof status is superseded only by the accepted result above.

## Current continuation — attribution contract passed; concurrency fixture call was misordered

Darshan's human-owned run retained instrumented evidence for exact source `f1e5228898afe761410ae0812e8d12edc68c17b3`. The summary is SHA-256 `87fda797ce56b9db3865c866677075a72e48ade6cfb59447fb2a5762ebfafbde`; PostgreSQL log is `8f013cc987b7ff1d00fb2fc6ebc09b254897054ece0672b1a98f06500a2646c0`. Before/after identity files are byte-identical at `8879e355ef0a2d255af2f6ee3d2a0e8c7459be1742cda6c0aecae6041b9220a3`: repository HEAD and all eight loaded-input hashes match, with `sourceIdentityMatched=true`.

**Run classification: `ATTRIBUTION_CONTRACT_11_OF_11_RETAINED_PASS / STOPPED_BEFORE_CONCURRENCY_DISPATCH / NOT A COMPLETE DATABASE PASS`.** PostgreSQL 17.11 was exact-loopback bound; accepted fixtures loaded; the attribution migration completed locally in 19ms; bounded observation was `2003|2001|188416|401408|155648`. The attribution-contract phase exited 0 and retained stdout contains PASS 01 through PASS 11. Retained stderr separately records the exact non-service `42501 PAYMENT_ATTEMPT_SERVER_ONLY` and service-role `23514 PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH` outcomes. The following fixture-setup phase was `sql:10`, exit 2: PostgreSQL correctly rejected nonexistent database `10`. Summary state is `passed=false`, `concurrency=[]`, timeout `null`, confirmed stop, PGDATA removed and no cleanup failure.

The verifier declared `createConcurrencyFixture(database, suffix, amount)` but all four call sites supplied only `(suffix, amount)`. The correction passes explicit database `issue134_success` with suffix/amount pairs `10/501`, `20/502`, `30/503`, `40/504`. The helper now rejects missing or misordered arguments, any database other than the owned success fixture, any suffix outside those four identifiers, and non-number, non-finite, non-integer or nonpositive amounts before invoking SQL.

A bounded source scan found no additional concrete deterministic helper-signature, result-shape, fixture-identifier, four-handoff or timeout-setup defect. This is static review only: all four concurrency interleavings, their rollback/state assertions and lock-timeout rollback remain unexecuted in the retained run. No later failure is preclassified as a proof defect.

Offline tests evaluate the actual extracted helper with a fake SQL callback and prove invalid inputs make zero callback calls; an AST check captures all four exact literal call contracts. Focused tests pass 29/29 across two files; scoped booking/booking-engine/commerce/migrations pass 63 files / 591 tests; typecheck, targeted lint and verifier syntax pass. No verifier import/execution, PostgreSQL command, database, build, network, credential or hosted operation occurred in this correction. Claude subsequently accepted exact correction e4b5bf74 with SOURCE_DELTA PASS, while DATABASE_PROOF_GATE remains NOT MET. The accepted delta and qualifications below govern one future human-only local execution under the existing scope; no corrected database execution occurred here.

## Latest independent delta review — fixture arguments and instrumented human result

Reviewed source: `e4b5bf74b19eb3ab5d863612838131f1ee605e66`; verifier SHA-256 `71c98a1e2f647bdd39e88b237eea342bc6b1a95fce5da629d17cf1dd724e4c83`. Sol/Cursor continued the existing sole implementation session; Claude continued independent session `797e841c-7601-4f61-9e0c-363ec6842e7e`, reported model `Claude Opus 5 300K High No Thinking`. Final source-delta PASS; complete database proof is NOT MET. Neither reviewer nor coordinator ran a database/verifier or changed a hosted environment during this correction/review.

Both independently ran 29 focused tests and 63 files / 591 scoped tests, typecheck, targeted lint and syntax checks. Claude separately exercised the real isolated helper with a fake SQL callback across 18 cases and found no SQL callback on invalid arguments; its source AST scan found no arity mismatch across 20 functions / 78 internal call sites. Those are offline checks, not evidence of the unexecuted multi-session or timeout behavior. The migration, application mapping and financial test SQL remain unchanged.

The actual human result now has retained PASS output for all eleven bounded attribution sections and the exact role-negative outcomes, with equal recorded source identities. This establishes the recorded single-session local contract sections only, including confirmation that the legacy NULL/NULL #153 residual remains open. It is not whole-ledger security, hosted-schema compatibility, full workflow acceptance, or GVM Operational Acceptance. Four concurrency interleavings and lock-timeout rollback remain unexecuted. Original logs and identity files are preserved byte-for-byte; owned PGDATA is confirmed absent.

Coordinator qualifications to the verbatim review: the corrected verifier is changed from the human-run bytes, but unchanged from the newly reviewed e4b5bf74 candidate. A future human run must use that corrected source, never the previous failing version. Recorded before/after input hashes and source identity establish artifact-level provenance; they are not independent signed execution attestation. No future failure is assumed to be a harness defect.

One fresh HUMAN local execution remains within the existing local-only approval after this reconciliation; no new token, hosted authority, or policy approval is required. Do not automate the denied database bootstrap. No application of this migration to Staging/Production, PR merge, #135 release, #153 change, worker activation, historical USD repair, retained C01/Run02 processing, GVM change or technician resumption is authorized. Build and hosted acceptance remain separate requirements.

### Returned independent report

````markdown
# CLAUDE — PR157 FIXTURE-ARITY DELTA + HUMAN RESULT REVIEW — Issue #134

Session continuity; not a restart of accepted product/foundation/R1a/C01/source audits. I ran
no verifier, initdb, pg_ctl, psql, DB engine, build, hosted/credential call; made no edit,
commit or push; read no `.supabase/` artifact; did not circumvent the sandbox denial.

## SOURCE_DELTA: PASS — no blocker
## DATABASE_PROOF_GATE: NOT MET — concurrency and timeout still unexecuted

## Recomputed identity

HEAD `e4b5bf74b19eb3ab5d863612838131f1ee605e66`, tree
`921955a53da4a318d177610957f1540f838c0826`, parent `f1e5228898afe761410ae0812e8d12edc68c17b3`.
Status `?? .supabase/` only. Delta is exactly the four allowed files (+210/−6): verifier,
migration unit test, candidate review, changelog. `git diff f1e5228..HEAD -- supabase/ lib/
tests/postgres/` is **empty**, and the three pinned artifacts recompute byte-identical:
migration `fd673cbf…3e7524`, mapping `727cd72b…ecdc`, financial contract `6be2c3ae…d747`.
Verifier is now `71c98a1e2f647bdd39e88b237eea342bc6b1a95fce5da629d17cf1dd724e4c83`
(was `17e64550…80d0` in the run). No guard, grant, RLS, financial-policy or new fixture
effect added; no database target added or changed.

## Human run classification — PARTIAL: eleven bounded single-session sections proven; harness arity defect stopped it before any concurrency

Evidence at `…-qS8l7J` reconciles exactly. Summary recomputes to
`87fda797…fbde` as supplied; before/after source identity files are byte-identical
(`8879e355…20a3` both), `sourceIdentityMatched: true`, `repositoryHead
f1e5228898afe761410ae0812e8d12edc68c17b3` — so the run is now cryptographically bound to the
reviewed bytes, closing the provenance gap I flagged in prior rounds.

Retained captures: `phases.jsonl` shows sequences 1–13 all `status: 0` (initdb, start, identity,
createdb, combined fixture+foundation+R1a+R1a-contract load, bounded fixture, migration,
digests, attribution contract, delay trigger), then `sequence 14 phase "sql:10" status 2`.
`sql.stdout.log` retains **26 PASS lines: 15 from the accepted R1a contract and all eleven
attribution sections PASS 01–11**. `sql.stderr.log` retains the NOTICE oracle trail, which
confirms the PR157 role work executed as intended: `EXPECTED_EXACT_FAILURE sqlstate=42501
PAYMENT_ATTEMPT_SERVER_ONLY` for the non-service role and `sqlstate=23514
PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH` under `service_role`, plus
`EXPECTED_CANONICAL_DELETE_FAILURE sqlstate=42501` and `EXPECTED_INTEGRITY_FAILURE
sqlstate=23503 appointments_customer_id_fkey`. Migration applied locally in 19 ms;
`boundedFixture 2003|2001|188416|401408|155648`.

Failure: `FATAL: database "10" does not exist` — `phase sql:10`, exit 2. Confirmed root cause:
the three-parameter `createConcurrencyFixture(database, suffix, amount)` was invoked
`("10", 501)`, so `database="10"`. **`concurrency: []` and `lockTimeoutElapsedMs: null`** —
zero of the four interleavings and no lock-timeout rollback executed. Clean containment:
`stopConfirmed: true`, `statusCommandStatus: 3`, `pgdataRemoved: true`, `cleanupFailure: null`;
I confirmed PGDATA absent and both private `.pgpass`/`pg_service.conf` are 0 bytes, 0600.

I do not overstate this. The eleven sections are single-session, single-statement assertions on
a minimal synthetic local fixture. They are **not** multi-session concurrency proof, not
hosted compatibility, not whole-system containment, and not GVM operational acceptance.

## Root-cause correction — verified behaviourally, not by string presence

All four call sites now pass three explicit arguments (AST-confirmed at lines 649, 704, 752,
806), and guards precede any subprocess. I extracted the committed function text and exercised
it in isolation with a stubbed `sql` recorder (no import, no psql). **18/18 cases correct, with
zero recorded SQL on every rejection:** valid 3-arg proceeds with `dbArg=issue134_success`,
`ids.business=13431000-0000-4000-8000-000000000001`, `ids.key=…0005`, amount in SQL; the
original `("10", 501)` bug throws on arity; both misorderings, missing, 4-arg, `issue134_timeout`,
`postgres`, numeric suffix `10`, unlisted `"50"`, an injection-shaped suffix, and `undefined`/
`"501"`/`0`/negative/float/`NaN`/`Infinity` amounts all throw first. `arguments.length !== 3`
is valid here (function declaration, not arrow). Only `issue134_success` is accepted, so no
alternate target is reachable.

The engineer's own new tests are genuinely behavioural too (AST visitor plus isolated function
construction with a `sqlCalls` stub, `toThrow`, and `expect(sqlCalls).toEqual([])`), not
string-presence only.

## Remaining arity/wiring scan — no further source-demonstrable defect

- Whole-file AST check: 20 declared functions, 78 internal call sites, **0 arity mismatches**.
- Every database-typed first argument across the nine DB helpers resolves to a literal
  `issue134_success`, `issue134_timeout`, or `postgres`, or to a forwarded `database`
  parameter. No stray literal.
- All nine `application_name` values match one-to-one between setters and `waitForActivity`
  waiters; no orphan in either direction.
- Delay wiring agrees: the verifier sets `issue134.delay_reference = 'manual-attempt:<attempt>'`
  and R1a line 491 writes `provider_reference = 'manual-attempt:' || attempt.id::text`.
- Fixture ids are well-formed per suffix (`1343{10,20,30,40}00-…`), and fingerprint seeds
  `suffix[0]` are distinct `1/2/3/4`.
- Timeout wiring consistent: `lock_timeout 5s`, holder `pg_sleep(6.5)`, asserted window
  4500–6500 ms.
- Containment unchanged (11 matches): strict `listen_addresses`/`inet` host/port equality,
  `realpathSync` `data_directory` equality, marker checks, minimal child env with private
  HOME/passfile/servicefile, confirmed stop (`status === 3`) before the single marker-gated
  `rmSync(dataDir)`, private phase/SQL capture, and before/after source-pin equality.

This is source inspection plus partial-run evidence. I make **no prediction** that the
financial concurrency or timeout SQL will succeed.

## Tests I executed (offline only)

Focused **2 files / 29 PASS**; scoped booking/booking-engine/commerce/migrations
**63 files / 591 PASS**; `tsc --noEmit` PASS; targeted ESLint clean; `node --check` PASS; plus
my own AST arity scan (0 mismatches) and the 18-case isolated argument-handling harness. No
database, build or network execution.

## Material limits

1. Concurrency (all four orderings), rollback variants and lock-timeout rollback remain
   **AUTHORED / NEVER EXECUTED**; `concurrency: []` is the authoritative fact.
2. The eleven passing sections run against the minimal synthetic fixture, not real `001`/`028`
   schema, RLS or scale; the 2,000-row cost figure is smoke scale.
3. Two interleaving rejections still match the constraint name by substring on psql stderr
   rather than an exact SQLSTATE+constraint oracle — the weakest remaining executable oracle,
   acceptable because the migration's collision preflight excludes same-named objects in a
   fresh cluster. Non-blocking.
4. Three consecutive runs stopped on harness defects; I explicitly do not infer that a future
   stop would also be a harness defect. A genuine invariant defect would be HOLD, never a
   reason to relax a test expectation.

## Next real dependency

One corrected single human-owned local execution — same worktree, unchanged verifier bytes at
`e4b5bf74`, fresh private disposable cluster — is **within existing local-proof approval**: no
hosted environment, no credentials, no new policy gate, and not a migration-application
approval. I did not perform it, and the coordinator reconciles first. Retain `summary.json`,
`phases.jsonl`, both SQL logs, both identity files and the server log verbatim.

Not authorized: Staging, Production, activation, hosted migration application, hosted
validation, #153 change, merge, release, GVM action. Migration remains PREPARED ONLY / HOSTED
UNAPPLIED; the 19 ms local application confers no hosted authority. Build not retried. #153
remains open — attribution PASS 05 re-confirms the NULL/NULL customer-cascade residual.
````

## Prior continuation — executed local proof exposed a role-sequencing error in PASS 07

Darshan's latest human-owned Terminal run used coordinator-observed source at `709a8b6c6ce0b9f350926f2ce0d108e41279801e`. The retained artifacts do not embed the repository identity, so this remains a before/after source observation rather than an artifact-internal cryptographic binding. The original `summary.json` remains byte-identical at SHA-256 `62d9a91fb2fc1f978f941f58da2752d6e72a955b3cf3a214a015665f0aff096d`; `postgres.log` remains byte-identical at SHA-256 `6cdafd3c0f011fda358bbaa2481cac125ba11753946f6ffb4fe99ae2c5632840`.

**Run classification: `STOPPED_IN_CONTRACT_PASS_07_ROLE_ORACLE / NOT A DATABASE PASS / NOT AN INVARIANT FAILURE`.** PostgreSQL 17.11 was exact-loopback bound, the synthetic fixture loaded, and the new attribution migration completed locally in 20ms with bounded observation `2003|2001|188416|401408|155648`. The run stopped at contract SQL line 500: the proof expected `23514 PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH` but received `42501 PAYMENT_ATTEMPT_SERVER_ONLY`. The summary records `passed=false`, `concurrency=[]`, `lockTimeoutElapsedMs=null`, `stopConfirmed=true`, `pgdataRemoved=true`, `cleanupFailure=null`, stop status 0 and final status 3.

The source cause is exact: the canonical fixture was created while `service_role` was active, then the proof executed `RESET ROLE` before attempting its deliberate inconsistent ledger update. The accepted canonical guard checks non-service access first, so the server-only rejection correctly preceded its request-mismatch branch. The correction does not change the guard, migration, grants or financial behavior. It now proves two separate oracles: a direct non-service canonical ledger update must return exact `42501 PAYMENT_ATTEMPT_SERVER_ONLY`; then, under a pinned `service_role`, the intended inconsistent tuple must return exact `23514 PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH`. It asserts the effective role and restoration and verifies the canonical appointment tuple, accepted attempt, ledger, ACCEPTED event and four obligations remain preserved after each rejection. The existing named delete oracle and preservation checks remain.

Only the migration timing/bounded observation and the actual line-500 error are direct summary evidence. Because that verifier revision did not preserve contract stdout/stderr, reaching line 500 makes earlier contract control flow inferable but does not provide retained `PASS nn` output for each earlier section. Those inferred earlier completions are not restated as artifact-backed individual PASS results.

The remaining role/fixture/oracle audit was a bounded source scan, not database execution. R1a admission/commit functions enforce exact `service_role`; payment-first and rollback processes set the role inside their transactions; reassignment-first and rollback payment sessions set it for their session; appointment-side sessions intentionally use the owner/session role; exact terminal states and counts remain asserted after each interleaving. The timeout holder and migration outcome remain fail-closed. The specialized canonical cascade helper continues to accept only the documented exact `42501` owner-RI path or recognized named `23503`/`23514` mechanisms with preserved rows. No further source-demonstrable deterministic role, fixture, existing-constraint or result-shape defect was found. The four interleavings, rollback coherence and timeout behavior remain unexecuted after this stop.

The verifier now closes the prior evidence-provenance gap for future runs without changing database controls: before startup it writes a private mode-0600 identity record containing repository HEAD and SHA-256 values for the verifier, contract, new migration and every loaded accepted fixture/migration/contract input; after the cleanup attempt it records the same identity again and fails on any difference. Private mode-0600 phase, SQL stdout and SQL stderr files retain phase exit/error metadata, successful `PASS nn` output and controlled expected-negative SQLSTATE/mechanism notices without reading `.env`, shell credential values or hosted configuration. Success markers use exact output-line matching. Exact loopback, ephemeral port, canonical PGDATA, marker, minimal child environment and confirmed-stop-before-removal controls are unchanged.

Offline validation after this correction: two focused files / 27 tests PASS; scoped booking/booking-engine/commerce/migrations 63 files / 589 tests PASS; typecheck, targeted lint and verifier syntax PASS. No verifier import/execution, PostgreSQL process, database SQL, build, network, credential, hosted or provider operation was run by this correction. Claude subsequently accepted the exact corrected source with SOURCE_DELTA_VERDICT: PASS; DATABASE_PROOF_GATE remains NOT MET. The final review and coordinator qualifications below govern one future human-only local run under the existing proof authority; no corrected database execution is claimed.

## Latest independent delta review — role oracles and evidence capture

Reviewed source commit `2ab4b8d1ce59f4acb683e8e2c34eedf75a154d81`, tree `fb8f41e791d5b45e8e601246c10028445f9865fc`, parent `709a8b6c6ce0b9f350926f2ce0d108e41279801e`. Source verdict **PASS**; complete database proof **NOT MET**. The following publication is documentation-only and does not change the reviewed executable files.

Sole engineer Sol/Cursor session `05e3058c-3323-448d-b337-0bc23f3f505f`, reported GPT-5.6 Sol 272K High; independent same-session reviewer Claude `797e841c-7601-4f61-9e0c-363ec6842e7e`, reported Claude Opus 5 300K High No Thinking. Both independently ran 27 focused tests and 63 files / 589 scoped tests, typecheck, targeted lint and syntax. Claude independently recomputed source and original-evidence hashes; the coordinator separately verified five-file correction scope, preserved application/migration/design/accepted sources, byte-identical latest summary/log, absent owned PGDATA and the unchanged eight-file PR inventory. Neither agent ran the verifier, SQL, database bootstrap, build, provider, hosted or secret path in this correction.

Corrected verifier SHA-256 `17e6455048c05b39ad44d832f04d058b7e5c9068f9e0f9415d74f7bbc55380d0`; test SQL `6be2c3ae69f0d1a08298bbc3f33083097040cc849b9a29a09dd160c0158fd747`. Migration remains `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`; financial implementation and applied foundation/R1a are unchanged.

Coordinator qualifications: the review's PASS 06 phrase `customers.customer_id` is a table-name typo; that test changes `appointments.customer_id`. Earlier completions in the stopped human run are qualified control-flow inferences, not separately retained success outputs. New source identity and SQL-output capture are implemented for future runs only, not reconstructed into previous evidence. Optional negative-stderr matching limitations remain disclosed. No reviewer predicts that a later failure must be another harness defect; any genuine product-invariant violation is a HOLD.

The next action is one personal human Terminal run of the reviewed verifier against a fresh disposable local cluster, without a token/password/hosted target. Existing local-only proof approval suffices; no Staging application, Production/GVM action, migration/permission cutover, shared financial replay, worker activation, merge or technician resumption follows. Do not repeat the denied agent-sandbox bootstrap or rewrite old evidence.

### Returned final independent report

This hinges on whether `service_role` can actually read `commerce_payment_attempts` after the foundation's blanket revoke. Checking the grant chain.Grant chain confirms `service_role` has SELECT on attempts (foundation line 266), so the new oracle path is viable. Now the verifier instrumentation.````markdown
# CLAUDE — PR157 ROLE-ORACLE PROOF DELTA + ACTUAL RESULT REVIEW — Issue #134

Same-session continuation. Accepted foundation/R1a/C01/product-rule reviews not reopened.
Scope is proof reliability. I executed no verifier, initdb, pg_ctl, SQL, DB bootstrap,
alternate engine, network, hosted call, build, credential or sandbox retry; made no edit,
commit or push; read no `.supabase/` artifact.

## SOURCE_DELTA_VERDICT: PASS — no blocker

## DATABASE_PROOF_GATE: NOT MET — OPEN

## Recomputed identity

- HEAD `2ab4b8d1ce59f4acb683e8e2c34eedf75a154d81`, tree
  `fb8f41e791d5b45e8e601246c10028445f9865fc`, parent `709a8b6c6ce0b9f350926f2ce0d108e41279801e`
- Status `?? .supabase/` only; inventory vs base `789f54d1` is still exactly the eight-file
  allowlist.
- Five changed files since my last reviewed `8046bea6`, all hashes matching the engineer's
  claims: changelog `a1bcfd45…6c99`, candidate review `1e46bc38…a441`, verifier
  `17e64550…80d0`, contract `6be2c3ae…d747`, migration unit test `aac66bb4…7350a`.
- Immutable and confirmed unchanged: migration `fd673cbf…3e7524`, application mapping
  `727cd72b…ecdc`, design `33af6e34…1f0f`, foundation `dee700ae…ee3a47`, R1a
  `4b7e3855…5ee7`. `git diff 8046bea6..HEAD -- supabase/ lib/` is empty.
- No production code, migration, guard, grant, policy or RLS relaxation: the contract delta
  contains no added `grant`, `revoke`, `create policy`, or `enable row level security` line.
- Evidence: xCwB2v summary `62d9a91f…096d` and log `6cdafd3c…2840` both recompute to the
  supplied values. Older evidence immutable: PQdbgH `d12a8ce2…1de299`, A9FjV3
  `20b18b14…5ab9a`. PGDATA absent; `home/.pgpass` and `home/pg_service.conf` both 0 bytes,
  0600. No secrets; synthetic fixture identifiers only.

## Actual run classification

`STOPPED_IN_CONTRACT_PASS_07 ON A TEST-SIDE ROLE ORACLE` — not a database PASS, not a
financial-invariant failure, and not zero SQL. Local synthetic SQL executed and the
attribution migration applied to the owned disposable cluster in 20 ms
(`boundedFixture 2003|2001|188416|401408|155648`). The log contains exactly one ERROR:
`wrong SQLSTATE. expected 23514, got 42501 (PAYMENT_ATTEMPT_SERVER_ONLY)` at contract line
500, then clean shutdown. `passed=false`, `concurrency=[]`, `lockTimeoutElapsedMs=null`,
`stopConfirmed=true`, `pgdataRemoved=true`, `cleanupFailure=null`, stop/status `0/3`.

Root cause matches the conditional mechanism I recorded in my first audit: the accepted
foundation guard's privilege gate (`current_user <> 'service_role'` → `42501`, foundation
`:218-219`) precedes its mismatch raise (`23514`, `:233`). The old test ran the canonical
UPDATE after `reset role`, so it hit the gate.

## The key requirement: wrong-role 42501 does not substitute for the service-role 23514 oracle

Verified satisfied. The contract now pins two *separate* exact oracles in fixed order:

1. Role assertion requiring `current_user = session_user` and `current_user <> 'service_role'`,
   then `expect_exact_failure(…, 'PAYMENT_ATTEMPT_SERVER_ONLY', '42501')`.
2. `set local role service_role`, assertion `current_user = 'service_role'`, then
   `expect_exact_failure(…, 'PAYMENT_ATTEMPT_LEDGER_REQUEST_MISMATCH', '23514')`.
3. `reset role` plus a restoration assertion.

`expect_exact_failure` compares `sqlerrm is distinct from p_message` — full-message equality,
strictly stronger than the substring `expect_failure`. So 42501 is asserted deliberately for
the non-service role and cannot stand in for the intended service-role oracle; neither can
pass in the other's place. `assert_canonical_financial_fixture_preserved()` runs after each
rejection and is *tighter* than the previous inline version (it now also pins
`attempt.business_id/customer_id/appointment_id` and `transaction.business_id/customer_id`,
plus 1 ledger, 1 ACCEPTED event, 4 obligations).

I independently confirmed the service-role path is viable rather than a new dead end:
foundation `:266` grants `select, insert on commerce_payment_attempts to service_role`, so the
subquery resolves; the fixture grants ledger DML; `service_role` is BYPASSRLS; and the
BEFORE-UPDATE guard fires before the composite FK's after-row check, so `23514` — not `23503`
— is the deterministic outcome. Every table read by the preservation helper is granted to
`service_role`.

The unit test locks this against future weakening: it pins both exact oracle literals, their
relative order, both role predicates, exactly two `expect_exact_failure` call sites, exactly
three preservation calls, the exact-message comparison line, and asserts the contract does
**not** contain a collapsed `sqlstate in ('42501', '23514')`.

## RI-owner vs direct UPDATE — distinguished

These are different mechanisms that happened to coincide here, and the proof now treats them
separately:

- **Direct UPDATE** (PASS 07, line 500): `current_user` is the session/active role. Outcome is
  session-role dependent — `42501` as the non-service session user, `23514` under
  `set local role service_role`. Both now pinned exactly.
- **RI-owner path** (PASS 11 appointment delete → old FK `ON DELETE SET NULL`): PostgreSQL
  switches `current_user` to the *referencing table owner* for referential actions, so the
  outcome is owner-dependent, not session-dependent. In this local cluster the owner is the
  non-service superuser, giving `42501 PAYMENT_ATTEMPT_SERVER_ONLY`; were the owner
  `service_role`, it would give `23514 REQUEST_MISMATCH`. `expect_canonical_appointment_delete_failure`
  accepts exactly those two named outcomes plus the two named `23503` FK alternatives, each
  requiring its exact identifier — so it is owner-robust without accepting arbitrary
  permission errors.

## Remaining clauses and the four interleavings — scanned, no deterministic role/fixture/oracle defect found

- PASS 06 changes only `customers.customer_id` on ledger-free appointments; the attempt FK is
  on `(appointment_id, business_id)`, so no key check fires.
- PASS 09 and the `service_role` leg of PASS 10 insert ledger rows with NULL
  `payment_attempt_id`, so the accepted guard early-returns at `:215` and the privilege gate is
  never reached — `23503` is correct, not `42501`.
- PASS 10's `authenticated` leg relies on granted appointment DML plus the tenant policy;
  `42501 row-level security` is the intended oracle there and is asserted by substring on an
  RLS message, which is appropriate.
- PASS 11's customer and Business deletions use named-identifier arrays covering every
  reachable cascade ordering.
- All four interleavings run appointment reassignment as the non-service session user (no
  trigger involved — pure FK `ON UPDATE RESTRICT`) and the payment leg under
  `service_role` (passing the privilege gate), so no mistaken-role oracle exists. `RECORDED`
  checks were tightened from substring to exact trimmed-line equality.

## Instrumentation safety — verified

`recordPhase` is invoked *before* `command()` rethrows, so failures are recorded and still
propagate; no assertion is bypassed. The `quiet`/`phase` destructuring preserves prior
behavior. Source identity (repo HEAD plus SHA-256 of all eight loaded inputs) is captured at
the very top of the try, before port allocation and before `initdb` (line 466 vs 479), written
`wx`/0600, re-captured after cleanup, and compared; on mismatch it sets `passed=false` and
only becomes `originalFailure` when none exists — so it cannot mask the original error.
`throw originalFailure` retains precedence. Endpoint, port, marker, `data_directory` realpath,
minimal child environment, confirmed-stop-before-removal and the single marker-gated
`rmSync(dataDir)` are unchanged. New artifacts (`phases.jsonl`, `sql.stdout.log`,
`sql.stderr.log`, both identity files) are 0600 inside the private temp dir and capture
synthetic SQL only; `git` runs from an absolute path with the private HOME and no credentials.

## Provenance limitations (non-blocking)

- The xCwB2v run predates this instrumentation, so its earlier PASS 01–06 progress is
  **control-flow inferred from single-ERROR log absence**, not retained per-assertion output.
  The engineer states this correctly and does not claim individual PASS evidence.
- That run's `summary.json` records no HEAD or input hashes, so its source attribution remains
  a coordinator before/after attestation. The log's embedded failing statement does
  textually match the pre-correction contract, which corroborates it. The new capture closes
  this for future runs.
- Weakest remaining executable oracle: two interleaving rejections still match the constraint
  name by substring on psql stderr (lines 664, 758) rather than an exact SQLSTATE+constraint
  pair. Acceptable here because the migration's collision preflight excludes same-named
  objects in a fresh synthetic cluster. Optional future tightening, not a blocker.

## Tests I executed (offline only)

Focused **2 files / 27 PASS**; scoped booking/booking-engine/commerce/migrations
**63 files / 589 PASS**; `tsc --noEmit` PASS; targeted ESLint clean; `node --check` PASS.
All match the engineer's claims. No database, build or network execution.

## Precise next action

One human-owned execution of the reviewed local-only verifier, from the worktree root, no
arguments or sudo, against a fresh disposable cluster — within existing local-proof approval;
**not** a migration-application or hosted approval, and no new policy gate. The coordinator
reconciles first.

```
cd /Users/darshan/chasum-worktrees/issue-134-appointment-financial-attribution && node scripts/verify-issue134-appointment-financial-attribution-postgres.mjs
```

I make no prediction of success and specifically do not assert that a further failure would
necessarily be a harness defect — PASS 08–11, all four interleavings and the lock-timeout
rollback have never executed, and a genuine product or invariant finding is possible. Retain
`summary.json`, `phases.jsonl`, both SQL logs, both identity files and the server log verbatim.

Not authorized: Staging, Production, activation, hosted migration application, hosted
validation, #153 change, merge, release, GVM action. Migration remains PREPARED ONLY /
HOSTED UNAPPLIED; the local 20 ms application confers no hosted authority. Build not retried.
````

## Prior continuation — executed local proof reached the new migration and stopped on proof typing

Darshan's second human-owned Terminal run used coordinator-observed source at `d23ba22ce7a271e18f777c892b09945ca498337d`. The evidence artifacts do not embed a repository identity, so this attribution remains a before/after source observation rather than an artifact-internal cryptographic binding.

**Run classification: `STOPPED_IN_CONTRACT_PASS_02 / NOT A DATABASE PASS / NOT AN INVARIANT FAILURE`.** PostgreSQL 17.11 started on exact loopback, the synthetic foundation/R1a fixture loaded, and the new attribution migration completed locally in 20ms. The bounded observation was `2003|2001|188416|401408|155648`. The run then stopped at `issue-134-appointment-financial-attribution-contract.sql:236`, before concurrency or lock-timeout work, because PostgreSQL could not compare `name[]` from `array_agg(pg_trigger.tgname)` with the expected `text[]` literal.

The retained `summary.json` is SHA-256 `20b18b148e915fd79af7bc9d31a727e4ff74633ad8c51da01477b515bfc5ab9a`; `postgres.log` is SHA-256 `d7e3195eb1436a78c0d8d4db579f4d66833f6427069925ba5714765a68144e2a`. Both remain byte-identical outside the repository. The summary records `passed=false`, `concurrency=[]`, `lockTimeoutElapsedMs=null`, `stopConfirmed=true`, `pgdataRemoved=true`, `cleanupFailure=null`, stop status 0 and final status 3. The coordinator separately confirmed PGDATA absent.

This was a deterministic proof-expression type error, not rejection by the appointment/customer invariant and not a hosted migration application. The proof-only correction casts each catalogue `tgname` value to `text` inside `array_agg`, while retaining the exact two-name array, catalogue ordering and fail-closed mismatch exception. It does not cast the expected identifiers to PostgreSQL `name`, truncate them, weaken the assertion, or change runtime/migration behavior.

A bounded source scan covered the remaining contract/verifier assertions for the same concrete class. The `pg_attribute.attname` aggregates are assigned into declared `text[]` variables and PASS 01 executed before this failure; `pg_proc.proconfig` is already `text[]`; the scalar `"char"` catalogue predicates, regprocedure/OID comparisons and ACL OID check all executed before the failing trigger comparison. Remaining expected-name arrays are parameters already typed `text[]`. The verifier has no further catalogue-name array comparison. No additional analogous deterministic defect was found. This is a source scan plus partial-run evidence, not execution proof of PASS 02 onward; the hard-delete cases, concurrency interleavings and timeout rollback remain unexecuted.

Offline validation after the correction: two focused files / 25 tests PASS; scoped booking/booking-engine/commerce/migrations 63 files / 587 tests PASS; typecheck, targeted lint and verifier syntax PASS. No PostgreSQL process, verifier, build, network or hosted operation was run by this correction. Claude subsequently completed the exact delta review with PASS; the acceptance and qualifications are recorded below. A corrected human-only local run remains within the existing authorization. No corrected database execution is claimed.

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

## Current exact type-correction acceptance and coordinator qualifications

Reviewed correction source: `8046bea67be4c6ff9023302f7d5933448ca33bd1`, tree `19079af38e9a7feb700c44cdce339d5e16a4e604`, parent `d23ba22ce7a271e18f777c892b09945ca498337d`. Contract SHA-256 is `4e90f6c968438928209627def8c6fba8a9c8200922036e2cd8f760506ddafa05`. The delta is exactly four existing allowlisted proof/test/documentation files; no migration, application mapping, verifier, accepted source or retained evidence change. This documentation closeout introduces no executable delta.

Sol continued sole implementation session `05e3058c-3323-448d-b337-0bc23f3f505f` (reported GPT-5.6 Sol 272K High). Claude continued independent session `797e841c-7601-4f61-9e0c-363ec6842e7e` (reported Claude Opus 5 300K High No Thinking) and returned **SOURCE_DELTA_VERDICT: PASS**. Both independently ran 25 focused tests and 63 files / 587 scoped tests, syntax and targeted lint. Typecheck PASS is Sol's executed result, not a new Claude typecheck. Both inspected the remaining catalogue-array comparisons and found no other analogous issue. These are source/offline results, not proof of the remaining database behavior.

The actual human result is a partial local run: baseline/fixture load, local migration application and early schema/posture checks were reached before the trigger-order assertion type error. Some reached-stage successes are inferred from verified sequential fail-fast source control flow and the retained error location, rather than captured PASS stdout. The 20ms DDL timing and 2000-row addition are bounded synthetic observations, not a hosted-scale capacity or locking guarantee. Actual summary/log hashes and independently absent owned PGDATA remain the durable evidence; no new hosted observation was made.

Qualification to the returned reviewer text: a future stop is NOT presumed to be another harness error. Its actual evidence must determine whether it is a proof defect, environment problem, or real financial-invariant failure. No future result is pre-cleared. Full contract sections03-11, concurrency/rollback variants and timeout rollback remain unexecuted. Source-to-run identity remains coordinator before/after observation, not an embedded source signature; retaining source hashes and contract stdout in future evidence remains a non-blocking provenance recommendation, not a claim that this code already does so.

Separate existing Preview build evidence was recovered read-only by the coordinator: Vercel deployment `dpl_HCNERnrx8NCzXiriZ41nraEQabQ1`, exact pre-correction source `d23ba22ce7a271e18f777c892b09945ca498337d`, target null/Preview, READY. Native build-log tail records Build Completed and Deployment completed. No deployment/build/protection change was triggered to obtain this evidence. This qualifies prior no-build-evidence wording for that earlier revision only; it is not a new build of `8046bea`, a full CI test pass, database validation, or Production acceptance. The local font-fetch build failure remains historical and was not retried.

Next is one personal HUMAN local execution of the unchanged verifier loading the corrected contract, under existing local-only scope. No additional Product Owner policy approval, token, password, remote launcher or agent-sandbox bootstrap is required or authorized. Preserve this and all prior evidence. Stop on any new failure without automatic retry. No Staging/Production/GVM access, hosted migration application, #135 release, #153 cutover, retained-cohort processing, merge or technician resumption. GVM Operational Acceptance remains unearned.

### Returned final Claude delta review — retained verbatim

````markdown
# CLAUDE — PR157 PROOF DELTA + HUMAN RESULT REVIEW — Issue #134

Continuation of accepted review session. No re-audit of closed kernel/foundation/C01.
I executed no verifier/initdb/pg_ctl/PostgreSQL/alternate engine, no hosted or network call,
no credentials, no `.supabase/` read or deletion, no build retry, no sandbox retry, and no
source modification, commit, or push.

## SOURCE_DELTA_VERDICT: PASS — exact type correction, no weakening

Exactly four allowlisted files changed vs `d23ba22ce7a271e18f777c892b09945ca498337d`
(+46/−5): the PostgreSQL contract, the migration unit test, the candidate review, and the
changelog. No fifth file. The functional change is one element-type cast:

`array_agg(trigger_row.tgname …)` → `array_agg(trigger_row.tgname::text …)`

Verified **not** a weakened trigger set/order assertion. Unchanged in full: the
`ORDER BY trigger_row.tgname`; the `tgrelid = 'public.commerce_transactions'::regclass`,
`not tgisinternal`, and two-name `tgname in (…)` filters; the `is distinct from array[…]`
exact two-element ordered comparison with both full trigger names; and the
`raise exception 'commerce guard trigger order/set mismatch'`. Expected literals were not
cast to `name` and no name was truncated or shortened.

One detail worth stating because it is easy to get wrong: the cast is applied to the
*aggregated element*, while the `ORDER BY` still sorts the `name` column. That is the correct
choice — PostgreSQL fires same-event triggers in `name`-type (C/byte) order, so retaining
`name` ordering keeps the assertion aligned with real firing semantics instead of a
potentially collation-dependent `text` sort. Narrower and more faithful, not looser.

The new unit test pins the corrected form, asserts the old mismatched form is absent, and
pins the comparison block including both names and the raise, so a future weakening would
fail offline.

Migration, application mapping, and verifier are byte-identical: `git diff d23ba22c..HEAD`
across `supabase/`, `lib/`, and `scripts/` is empty.

## Genuine run classification: LOCAL SYNTHETIC SQL EXECUTED; MIGRATION APPLIED LOCALLY; CONTRACT ABORTED IN PASS 02

**Not** zero SQL, **not** "no local schema application", and **not** a financial-integrity
PASS. This was a real local synthetic proof execution on an owned disposable PG 17.11
cluster that got materially further than the prior attempt, then stopped on a catalogue-type
defect in the *test*, not in the product. The invariant was neither proven nor disproven.

Evidence I read directly rather than accepting: `dataDirectory` is now populated (so the
`host()` correction worked), `postgresVersion` = `17.11 (Homebrew)`, `migrationElapsedMs` =
20, `boundedFixture` = `2003|2001|188416|401408|155648`. The server log contains exactly one
ERROR — `operator does not exist: name[] = text[]` — then a clean shutdown. Total window:
ready 22:57:15.561, error 22:57:16.131, shut down 22:57:16.177.

### Reached / skipped proof matrix

| Stage | Status | Basis |
|---|---|---|
| Owned cluster provisioned; loopback/port/PG17/`data_directory`/marker identity | **REACHED — PASSED** | `dataDirectory` populated; prior stop no longer recurs |
| Synthetic foundation + R1a fixtures and both accepted migrations loaded | **REACHED — no error** | only one ERROR in log, later |
| Accepted R1a executable contract | **REACHED — no error** | same |
| 2,000-row bounded fixture; new migration applied | **REACHED — PASSED, 20 ms** | `migrationElapsedMs=20`; all five preflight guards, UNIQUE build and FK validation succeeded |
| Zero existing-row mutation (before/after digest) | **REACHED — PASSED** | run continued past the digest equality check, which throws on mismatch |
| Bounded cost recorded | **REACHED** | 2003 appointments / 2001 ledger rows; heaps 188416 / 401408 B; new unique index 155648 B |
| Contract PASS 01 — exact unique key + composite FK shape, MATCH SIMPLE / UPDATE RESTRICT / DELETE NO ACTION / NOT DEFERRABLE / validated | **REACHED — PASSED** | its DO block is absent from the log; failure was the next block |
| Contract PASS 02 — SECURITY INVOKER, fixed `search_path`, no PUBLIC/anon/authenticated/service_role EXECUTE | **REACHED — PASSED** | those raises precede line 33 of the block and did not fire |
| Contract PASS 02 — trigger set/order | **NOT PROVEN** | aborted on the type error |
| Contract PASS 03–11 (legacy status matrix, NULL attachment, #153 residual, no-ledger reassignment, canonical ownership, ordinary edits, cross-tenant, RLS roles, hard-delete matrix) | **NOT REACHED** | — |
| Four concurrency interleavings | **NOT REACHED** | `concurrency=[]` |
| Lock-timeout atomic rollback | **NOT REACHED** | `lockTimeoutElapsedMs=null` |

Net: schema-shape and security-posture assertions are now execution-proven on real
PostgreSQL 17; every financial-behaviour, concurrency, cascade/RLS and timeout assertion
remains authored and unexecuted.

## Adjacent same-class scan: no remaining analogous defect found

I enumerated every array/catalogue comparison in the contract. There are exactly four
`array_agg` sites plus one `proconfig` comparison:

- Lines 138, 156, 157 aggregate `pg_attribute.attname` but assign `INTO` variables declared
  `text[]` (lines 134–136), so PL/pgSQL applies an assignment cast and the later comparison
  is `text[]` vs `text[]`. This path is now **execution-proven**, because PASS 01 completed.
- Line 199 compares `proconfig`, already `text[]`; it executed.
- Line 222 was the single inline aggregate compared directly against a text array literal
  with no intervening typed assignment — the one defect, now corrected.

That asymmetry is the whole root cause: the assigned sites get an assignment cast, the inline
site did not. Beyond line 237 the contract performs no further catalogue introspection, and
the verifier contains no catalogue-name array comparison at all (its SQL compares scalars,
booleans, counts and md5 text). So the risky pattern occurred once and is fixed.

I am not predicting the next run will pass. PASS 03–11, the interleavings and the timeout
proof have never executed, and my earlier predicted canonical-cascade `42501` remains
unresolved by evidence — the helper accommodates it, but which mechanism fires is still
unobserved. Static tests prove no database behaviour.

## Blocker: none

No defect outside the exact proof correction. Nothing to HOLD.

## Evidence preservation and cleanup

- Summary recomputes to `20b18b148e915fd79af7bc9d31a727e4ff74633ad8c51da01477b515bfc5ab9a`
  and log to `d7e3195eb1436a78c0d8d4db579f4d66833f6427069925ba5714765a68144e2a` — both match
  the dispatch values byte-exactly.
- `pgdataRemoved: true`, `stopConfirmed: true`, `cleanupFailure: null`, stop/status `0 / 3`;
  I independently confirmed `…A9FjV3/pgdata` is **absent** on disk.
- Evidence dir `0700`; `home/.pgpass` and `home/pg_service.conf` are both **0 bytes, 0600**
  — no credential present, used, or captured. Contents are synthetic fixture identifiers
  only; no real customer data or secrets.
- `passed: false` recorded honestly; the engineer's report does not overclaim and its
  classification matches the artifact.
- The prior `…PQdbgH` evidence remains untouched. I deleted nothing.
- Git status is `?? .supabase/` only; `.supabase/` not read, not deleted, not gitignored.

**Source-to-run attribution** remains a coordinator before/after attestation: `summary.json`
still records no repository HEAD or verifier hash. However it is now corroborated
independently — the log embeds the failing statement verbatim, and that text matches
`d23ba22c`'s contract line 222 (`array_agg(trigger_row.tgname order by trigger_row.tgname)`)
exactly, which is the pre-correction form that HEAD's test now asserts is absent. That is
strong textual evidence the run used the pre-fix bytes.

Recurring non-blocking recommendation, now materially more important since runs reach real
assertions: record repo HEAD, the verifier hash and the contract hash into `summary.json`,
and retain contract stdout (the `PASS nn` lines) in the evidence directory. Today the PASS 01
and PASS 02 successes are inferable only from log absence, which is weaker than captured
output for acceptance-grade evidence.

## Checks I executed vs supplied

Executed by me (offline only): HEAD/tree/parent and four-file scope; recomputation of both
evidence hashes; recomputation of migration `fd673cbf…3e7524`, mapping `727cd72b…ecdc`,
verifier `1273354a…1802`, contract `4e90f6c9…fa05`, design `33af6e34…1f0f`, foundation
`dee700ae…ee3a47`, R1a `4b7e3855…5ee7`; full read of `summary.json` and `postgres.log`;
scan of all contract/verifier catalogue comparisons; `git show` of the pre-fix line for log
corroboration; focused tests **2 files / 25 PASS**; scoped booking/booking-engine/commerce/
migrations **63 files / 587 PASS**; targeted lint clean; `node --check` verifier PASS.

Supplied and accepted as coordinator attestation, not verified by me: that the run used
commit `d23ba22c` (textually corroborated as above), and the engineer's typecheck PASS
(I did not rerun typecheck this round). Not run by me: any database execution, build, or
hosted call.

## Corrected one-shot HUMAN local verifier: WITHIN EXISTING AUTHORITY

Yes. Same worktree, same unchanged verifier bytes, corrected contract at `8046bea6`, fresh
private temp cluster, human-only live local execution. This is instrumentation
re-execution of an already-authorized local proof: **no hosted environment, no credentials,
no extra policy gate.** Keep the current limit that live local execution is human-only; do
not automate it, do not retry the agent-sandbox `shmget` denial, and do not re-run unchanged
failing bytes.

```
cd /Users/darshan/chasum-worktrees/issue-134-appointment-financial-attribution && node scripts/verify-issue134-appointment-financial-attribution-postgres.mjs
```

No arguments, no environment variables, no sudo; run from the worktree root. I make no
prediction of success: a third stop is a realistic outcome and would again be a harness
finding, not a financial-invariant failure. If it stops, capture `summary.json`, the log and
the terminal output verbatim rather than re-running with modifications.

## Not authorized

No Staging, Production, activation, hosted migration application, hosted validation, #153
change, projection execution, merge, release, or GVM action. The migration remains PREPARED
ONLY / HOSTED UNAPPLIED — the 20 ms application proven here was to a disposable local
synthetic cluster only and confers no hosted authority. Build remains NOT PASSED and was not
retried. DATABASE_PROOF_GATE remains **NOT MET**. The approved financial rule and earlier
audits stand within their stated bounds; GVM Operational Acceptance is not earned.
````
