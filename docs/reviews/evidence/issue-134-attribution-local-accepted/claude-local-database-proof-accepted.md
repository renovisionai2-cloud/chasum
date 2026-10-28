```markdown
# CLAUDE — PR157 ACTUAL LOCAL RESULT ADJUDICATION — Issue #134

Read-only adjudication. I executed no verifier, initdb, pg_ctl, psql, DB engine, test, build,
hosted/network/credential path or agent; made no edit, commit, push or deletion; read no
`.supabase/` artifact; bypassed no safety denial. Only filesystem, git and hash reads.

## VERDICT: LOCAL_DATABASE_PROOF_ACCEPTED — bounded to a disposable local PostgreSQL 17.11 cluster on a minimal synthetic fixture

No further human local rerun is required for this proof scope. Every coordinator claim
verified against primary retained files; I found no overclaim in the claim set, and one
precision correction below (the lock timeout fired on the preflight read, not on `ADD CONSTRAINT`).

## Exact identities (independently recomputed)

HEAD `732e3821858826898e0c9ec80996e643f6cf0f2c`, tree `c02e740f6eabecabcc961674623620e87fcbf4a3`,
parent `e4b5bf74b19eb3ab5d863612838131f1ee605e66`. Working tree clean except `?? .supabase/`.
Delta from the previously audited `e4b5bf74` is **documentation only** (`docs/CHANGELOG.md`
+6, candidate review +145/−2); no code, migration, contract or verifier byte changed after my
last audit. `git diff d04a79c9 HEAD -- lib/ supabase/` is **empty**, confirming the financial
implementation is unchanged from `d04a79c9`.

My recomputation equals the pins: migration `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`,
verifier `71c98a1e2f647bdd39e88b237eea342bc6b1a95fce5da629d17cf1dd724e4c83`,
contract `6be2c3ae69f0d1a08298bbc3f33083097040cc849b9a29a09dd160c0158fd747`.

Evidence `…-WNClqF`: `summary.json` = `cb0b975a9e67751207ee602c50b8f91b2c5dd400376153a37827d33e93562418`
as supplied. Other artifacts: `phases.jsonl` `a317e035…c85`, `sql.stdout.log` `17d31200…623`,
`sql.stderr.log` `71ba53b6…daf`, `postgres.log` `f0416dcd…e50`, `ownership-marker` `f0429390…edf`.
`source-identity-before.json` and `-after.json` are **byte-identical** (`87b28d55…9474`),
`sourceIdentityMatched: true`, `repositoryHead 732e3821…`, and all eight listed file digests
equal my independent recomputation. The run is cryptographically bound to the reviewed bytes.

## Proof matrix — reached and passed

`phases.jsonl` retains 59 sequenced phases, all with the expected status; `originalFailure: null`,
`cleanupFailure: null`, `passed: true`.

| Proof | Evidence | Result |
|---|---|---|
| Cluster, identity, createdb, accepted baseline load | seq 1–6, status 0 | PASS |
| Bounded fixture | `2003\|2001\|188416\|401408\|155648` (identical to prior run) | PASS |
| Migration applied locally | seq 9 status 0, `migrationElapsedMs: 23` | PASS |
| Before/after digest equality | seq 10–11 | PASS |
| Attribution contract | seq 12 status 0; **11 retained `PASS 01`–`PASS 11`** in `sql.stdout.log` (26 total incl. 15 accepted R1a sections) | PASS |
| Payment-first commit | seq 19 status 0 (`RECORDED`, `COMMIT`); seq 20 status **1** | PASS |
| Payment-first rollback | seq 27 status 0 (`RECORDED`, `ROLLBACK`); seq 28 status 0 (`UPDATE 1`) | PASS |
| Reassignment-first commit | seq 35 status 0 (`UPDATE 1`, `COMMIT`); seq 36 status **1** | PASS |
| Reassignment-first rollback | seq 44 status 0 (`UPDATE 1`, `ROLLBACK`); seq 45 status 0 (`RECORDED`) | PASS |
| Lock-timeout rollback | seq 54 status **3**, `lockTimeoutElapsedMs: 5020` (window 4500–6500) | PASS |
| Confirmed stop, PGDATA removal | seq 58 status 0, seq 59 status **3** | PASS |

## Waiting evidence is persisted, not inferred

`waitForActivity` polls `pg_stat_activity` and its observations are written to the private log.
`sql.stdout.log` retains, per interleaving, `active|Timeout|PgSleep` (holder sleeping inside its
open transaction) and `active|Lock|transactionid` (the second session genuinely blocked on the
first session's transaction ID). That is real cross-session serialization captured from the
server, not control-flow inference. Only the harness's own `PASS …` console lines for the
concurrency and timeout steps are **not** retained in the evidence directory (they went to the
terminal); the underlying primary data — phase statuses, psql stdout/stderr, state tuples,
digests — is retained and independently sufficient, so `summary.json`'s `concurrency[]` and
`passed` are corroborated rather than self-asserted.

## Result/state mapping correct, exactly once, no lost response

`assertAttemptState` hard-throws on mismatch; the tuple is
`appointment.customer_id | execution_state | attempts-per-attempt_key | ledger rows | ACCEPTED events | reconciliation obligations`.
Retained observations:

- payment-first `13431000-…-0002|ACCEPTED|1|1|1|4` — attribution frozen at the **old** customer; one attempt per key, one ledger row, one event, four obligations.
- payment-rollback `13432000-…-0003|REQUESTED|1|0|0|0` — reassignment to the **new** customer allowed with **zero** financial effect.
- reassignment-first `13433000-…-0003|REQUESTED|1|0|0|0` — new customer committed, payment rejected, **no new key**, no ledger/event/obligation.
- reassignment-rollback `13434000-…-0002|ACCEPTED|1|1|1|4` — old customer retained, waiting payment recorded **exactly once**.

The `|1|` attempt-key count in all four cases is the exactly-once / no-lost-response witness.
Rejections are persisted with full server detail, not substring guesswork: `ERROR: update or
delete on table "appointments" violates foreign key constraint
"commerce_transactions_appt_business_customer_financial_fk"` with
`Key (id, business_id, customer_id)=(…004, …001, …002)`, and `ERROR: insert or update on table
"commerce_transactions" violates …` with `Key (appointment_id, business_id, customer_id)=(…004,
…001, …002) is not present in table "appointments"`. Key values match the fixture ids exactly.

## Timeout failure is deliberate and atomic — with one precision

Deliberate: exit 3, `canceling statement due to lock timeout`, 5020 ms against a 5 s
`set local lock_timeout`. Atomic: post-check returned `t|t` — both
`appointments_id_business_customer_financial_key` and
`guard_legacy_commerce_transaction_appointment_attribution_v1()` absent — and the
`issue134_timeout` digest is identical before and after (`153cf739f363f0d02fcef560a7cc04a9`
at seq 52 and seq 57). Fixture rows and catalogue preserved; `postgres.log` contains zero
`FATAL`/`PANIC` and ends with a clean `received fast shutdown request` → `database system is
shut down`.

**Precision:** cancellation occurred at migration **line 133**, i.e. the final preflight `DO`
block's `exists(... join public.appointments ...)` read — the earliest point needing ACCESS
SHARE against the holder's ACCESS EXCLUSIVE lock. The `ALTER TABLE … ADD CONSTRAINT` at line
135 was never reached. The proof therefore covers the migration's first lock-acquisition point
plus whole-transaction rollback; it does not separately exercise a timeout at the DDL step
itself. Same transaction-scoped `lock_timeout` governs both, so this is a bound, not a defect —
but "timed out during DDL acquisition" would be an overclaim.

## Residuals and limitations

1. **Synthetic minimal fixture, not hosted reality.** Local base tables, roles and policies are
   test constructs. This is not real `001`/`028` schema, not production RLS composition, not
   hosted extension/role configuration, not scale. ~2,000 rows is smoke scale; 23 ms says
   nothing about hosted duration under concurrent load.
2. **#153 stays OPEN.** Attribution `PASS 05` re-confirms the legacy NULL-attempt/NULL-appointment
   customer-cascade exposure. Testing a gap is not closing it.
3. The TypeScript error mapping (`lib/booking-engine/mutations/update.ts`) is not in the eight
   source-identity pins and is not exercised by this database run; its assurance remains the
   prior offline suites.
4. Single-host, single-run, single PostgreSQL build (17.11 Homebrew, macOS). No repeat-run
   stability or cross-version evidence.
5. Not retained: harness-level concurrency/timeout `PASS` console lines (see above). Nothing
   else is missing; I needed no further artifact to adjudicate.

## Cleanup and preservation

`stopConfirmed: true`, `stopCommandStatus: 0`, `statusCommandStatus: 3`, `pgdataRemoved: true`,
`cleanupFailure: null`. I confirmed `pgdata` is absent from the evidence directory, the
directory is `0700`, and the private `home/.pgpass` and `home/pg_service.conf` are 0 bytes,
mode `0600` — no secret material. Source immutability holds: identical before/after identity
files, and repository HEAD equals the recorded run HEAD with no post-run source change.

## Next requirements — Staging compatibility and application only

Before any Staging application: verify the five preflight guards against **real** Staging
catalogue state (schema shape, existing `appointments` FK, accepted-guard presence, object-name
collision, pre-existing mismatched `commerce_transactions` tuples); confirm no live
`appointments` tuple already violates the composite key; size the ACCESS EXCLUSIVE lock window
and rerun contention expectations under real traffic with the 5 s `lock_timeout`; confirm the
hosted `service_role`/`authenticated` ACL and RLS composition matches the local assumptions;
plan a rollback statement set; and capture hosted `/api/build-info`-class identity for the
applying artifact.

Not authorized and not implied by this verdict: GVM operational acceptance, activation, hosted
migration application, provider enablement, Staging or Production release, merge, or any new
financial authority. The migration remains PREPARED ONLY / HOSTED UNAPPLIED.
```