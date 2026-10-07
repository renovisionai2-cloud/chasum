# Issue #134 — appointment/customer financial attribution candidate

**Status:** CORRECTED AFTER EXACT-CANDIDATE HOLD / HOSTED UNAPPLIED / POSTGRESQL PROOF NOT RUN.
**Competitive Product Gate:** NOT_APPLICABLE — bounded enforcement of the reviewed financial-integrity invariant and exact error mapping; no new operator workflow.

## Final independent source review — database proof still open

**SOURCE_VERDICT: AUTHORING_PASS. DATABASE_PROOF_GATE: NOT MET.** The corrected executable candidate is `d04a79c922835c1bd831cf5ab33c39a6512e547a`, tree `af2a8f56ad8d7c649bf252ef9b156cbaa70a6a21`. Its migration remains SHA-256 `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`. The subsequent publication closeout changes documentation only, not reviewed runtime, tests, verifier or SQL.

Claude independently reviewed and hashed the exact corrected candidate in session `797e841c-7601-4f61-9e0c-363ec6842e7e` (reported Claude Opus 5 300K High), reran 23 focused tests and 585 scoped tests across 63 files, typecheck, targeted lint and verifier syntax, and separately verified 13 mapping counterexamples. No blocking source correction remains. The initial HOLD was corrected, not waived: targeted canonical cascade SQLSTATE expectations, exact constraint mapping, verifier ownership/environment/stop-confirmation cleanup, and bounded non-key edit coverage.

**No PostgreSQL proof is claimed.** The previously observed sandbox `shmget` bootstrap denial remains; the corrected verifier was not retried in that sandbox. Build is not passed: the ordinary supported webpack build reached existing font downloads but sandbox DNS could not resolve Google Fonts. Full-suite and hosted/workflow proofs remain unperformed. No proof requirement is waived by the source verdict.

Claude separately accepted a human-owned local proof as safe for this exact code: Darshan may personally run the verifier in a normal Terminal from this worktree, with no arguments, credentials or sudo. It provisions only a new marked disposable PG17 cluster on 127.0.0.1, verifies its data_directory, uses private empty password/service files, and removes only its owned PGDATA after confirmed shutdown. It has no hosted target option. Its temporary trust-auth loopback port contains synthetic data only and is reachable to other local processes during the bounded test window. This is the remaining execution dependency, not a Staging migration-application approval. Do not automate a rerun of the previously denied sandbox launch.

The source branch remains dependent on PR156; no merge/release, Staging/Production/GVM action, historical USD repair, #153 change, worker execution, C01 rerun, or technician resumption follows. Existing pending synthetic records remain excluded from future worker activation. The untracked `.supabase/telemetry.json` and previously disclosed empty temp residue remain outside the candidate; no refused deletion was retried.


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


<details>
<summary>Final independent source audit (database execution expressly not claimed)</summary>

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
