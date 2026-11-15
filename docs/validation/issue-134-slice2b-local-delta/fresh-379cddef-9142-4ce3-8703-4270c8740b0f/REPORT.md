# Slice 2B PR #164 — bounded harness correction and single failed proof

## Verdict

C — LOCAL_IMPLEMENTATION_OR_HARNESS_CORRECTION_REQUIRED.

The single authorized runner invocation exited 1. A newly added JavaScript evidence parser rejected a valid PUBLIC ACL witness because PostgreSQL serialized the OID as string "0", while the parser required numeric 0. The database itself recorded assertion=true, effective_privilege=true, PUBLIC grantee="0", and the intended SQLSTATE 55000 / LIFECYCLE_UNSAFE_OPERATIONAL_CAPABILITY. This is a proof-harness parser defect, not evidence of a lifecycle SQL defect. No correction or second invocation was performed after the failure.

## 1. Starting identity

PR #164 remains Draft/open on codex/slice2b-d1-lifecycle-sql-pg17. Starting HEAD 67cda2d0b5eae7207a9f6b1174feddd0f2baca6f, tree 0bb70e7ef6fc2a107f53bd0b677503321f0402fa, parent 7b11effee5539df93cbd35da5431a0207103edc7. Remote main freshly matched 35dd307986c36bb9a5c3a4847e4a212e8dce9fde / aaaf5be03e16a23265af2f0bd8e8fb9b27fdbb99 before edits and again after the failed run.

## 2. Authorized source changes

Only the runner and two new helpers in scripts/proofs/issue-134-slice2b-lifecycle were changed. availability-cases.mjs isolates dedicated fixtures from existing financial proof fixtures. capability-evidence.mjs records actual preimages and expanded rollback catalogs. Existing domain/financial/concurrency oracles, generator, catalog assertion source, application, migrations and D1 remain unchanged. The helper separation is limited to the three requested coverage gaps.

## 3. Immutable tested source

HEAD 9c0d53686288ff0cfbf86810f29b9c3e9a530c4a
Tree 1435cd48083b2a9c4ad1e9d4eb55587c24d3083e
The source commit was created before SQL. Subsequent evidence-only publication does not alter these source bytes.

- scripts/proofs/issue-134-slice2b-lifecycle/availability-cases.mjs: 80f7ed3e898f4576c7e576bd9a3939fc09506724bedc6c080c4f1a35eeb931f4
- scripts/proofs/issue-134-slice2b-lifecycle/capability-evidence.mjs: 37b10fff5cb219ea093127f215312076c270f44c573b3a183a404c99cdab49bf
- scripts/verify-issue134-slice2b-lifecycle-disposable-postgres.mjs: ab6072820eb16dd63d6227badf6c2d109076da652dca420b14066576a1326b6b

## 4. Protected migration

supabase/migrations/20261013201608_issue_134_slice2b_lifecycle_amendment.sql
SHA-256 3c5179f29f53678ec51798d6fb2929448cba98cf64bd7c44a1d6c796e56eb3a1.
D1 0caf4f79ce43088520313728b4d3cd77758b0aa066f8f2f776f4714f9ebff6ed.
All protected source checks passed before execution and after the failure.

## 5. Static gate

PASS: exact three-file allowlist, node --check for all three files, git diff --check, protected manifest hashes, source isolation inspection and historical evidence checks. No database was invoked before this gate. This did not detect PostgreSQL's JSON OID representation, which caused the runtime parser failure.

## 6. Disposable PostgreSQL

postgres (PostgreSQL) 17.11 (Homebrew); version_num 170011.
Run 379cddef-9142-4ce3-8703-4270c8740b0f, 2026-10-14T21:21:30.333Z to 2026-10-14T21:21:32.324Z.
PGDATA /private/tmp/chasum-d1-pg17-qoECbx/pgdata; socket /private/tmp/chasum-d1-pg17-qoECbx/socket; port identifier 55473; PID 33928.
Fresh initdb, empty d1_lifecycle public schema, private socket, TCP disabled, scrubbed environment. Negative tests ran against fresh local clone d1_assertion_rollback. No hosted credentials or connection strings.

## 7. Availability identities

Historical 026 SHA-256 37b19fb00c95994b5c8c05d143b7fc668b1d032c665ed3ce43aba8a33caea0a8.
Package A SHA-256 84863ad305bd98b01e817a43153f3344e816c5994c32f7b8452e2c09aac94fdf.
Pinned bodies: availability_block_reason d2261e44fd62ffb476fe69864635ce14; get_available_slots d3f0f20c81a56b5e70fe3850e7b357f7; validate_appointment_slot ba820a872e7ae4082cc66ce02dc03b52.
Prerequisites were installed in the intended order, and the unchanged migration's assertions passed in the injected-final-failure rollback probe. Complete before/after/final function catalog capture was NOT reached in this run; no composed behavioral PASS is claimed.

## 8. Expanded availability matrix

- existing service before buffer: NOT_RUN.
- existing service after buffer: NOT_RUN.
- existing staff before buffer: NOT_RUN.
- existing staff after buffer: NOT_RUN.
- greatest(service,staff), not sum: NOT_RUN.
- existing service cleanup: NOT_RUN.
- combined after buffer plus cleanup: NOT_RUN.
- half-open boundaries: NOT_RUN.
- self-exclusion on reschedule: NOT_RUN.
- cancelled appointment exclusion: NOT_RUN.
- configured double booking / physical exclusion distinction: NOT_RUN.
- missing service metadata constructibility: NOT_RUN.
- missing staff metadata constructibility: NOT_RUN.
- foreign Business metadata isolation: NOT_RUN.
- normal named-staff conflict: NOT_RUN.
- staff/location/service duration and qualification: NOT_RUN.
- timezone/DST elapsed duration: NOT_RUN.

## 9. Cleanup boundary

10:00–10:30 existing appointment, five-minute existing-service cleanup, different zero-buffer candidate service: harness cases were authored for 10:30 rejection and 10:35 acceptance, with row/revision/journal/money witnesses. Neither executed. No witness or PASS is claimed.

## 10–12. Lifecycle, concurrency and recovery

D01–D15: all NOT_RUN.
C01–C11: all NOT_RUN.
D12-E, D12-F, D14-E, D14-F, D14-G: all NOT_RUN.
The initial migration final-assertion rollback probe is separately observed; it does not make the unexecuted D13 group PASS.

## 13–15. All 28 security cases

P = preimage / intended refusal / explicit post-rollback evidence all PASS.
F = SQL preimage and intended refusal observed; JavaScript parser FAIL; post-rollback query NOT_OBSERVED.
N = NOT_RUN.

| Principal | Table or membership mode | TRUNCATE | TRIGGER |
|---|---|---|---|
| anon | appointments | P | P |
| anon | appointment_resources | P | P |
| authenticated | appointments | P | P |
| authenticated | appointment_resources | P | P |
| authenticator | appointments | P | P |
| authenticator | appointment_resources | P | P |
| service_role | appointments | P | P |
| service_role | appointment_resources | P | P |
| PUBLIC | appointments | F | N |
| PUBLIC | appointment_resources | N | N |
| anon | inherited two-hop/resources | N | N |
| anon | SET ROLE two-hop/resources | N | N |
| authenticator | inherited two-hop/resources | N | N |
| authenticator | SET ROLE two-hop/resources | N | N |

For each of the 16 completed cases, actual preimage effective_privilege=true; exact ACL entry, table, privilege, transaction, principal and backend recorded. Fresh rollback connection has journal_schema=null, journal_relation=null, revision_columns=0, v2_objects=[], private_objects=0, guard_enabled=O, parameter_set=false. Full roles, membership catalog, protected ACLs, original triggers and parameter ACL/effective privileges equal baseline. Backend identity was independently verified and differed from the failed connection. See gate-<case>-evidence.json in the archive and review.json's full 28-row inventory.

PUBLIC appointments/TRUNCATE raw witness: grantee="0" (JSON string), principal=service_role, effective_privilege=true, assertion=true. SQL refusal 55000 is correct. The parser's strict numeric comparison failed. No fresh rollback observation exists for this case; do not substitute presumed transaction semantics for the required query.

The two pre-existing disabled-parent and parameter-grant negative cases also reached expected refusal and explicit rollback checks. They are additional to the 28-case matrix.

## 16. Financial and tenant invariants

Fresh runtime domain/financial witnesses NOT_RUN because the harness stopped before creating those fixtures. Original source/fixtures remain byte-identical. The prior original_count=0 / appointment_money=200 witness belongs only to the prior preserved run; it is not a fresh PASS and never establishes whole-appointment unpaid status.

## 17. Complete error inventory

Expected SQL diagnostics in command logs:
- P0001: 1 injected EXPECTED_FINAL_ASSERTION_FAILURE.
- 55000: 19 negative refusals, including 17 capability cases plus disabled-parent and unsafe-parameter cases.
- 25001: 19 nested-BEGIN warnings, not successful commits.
No unexpected SQL error recorded. Unexpected harness error: PUBLIC is not ACL grantee zero. Exit code 1. No concurrency SQLSTATEs observed because concurrency was NOT_RUN.
Injected final-assertion experiment's subsequent connection: journal_schema=null, revision_columns=0, v2_count=0 (that pre-existing query checks the notes RPC only). The 16 expanded negative witnesses separately check all five new v2 names.

## 18. New evidence

Run 379cddef-9142-4ce3-8703-4270c8740b0f.
raw-evidence.zip: 254989 bytes, 134 members, 129 untouched runner files plus server log/config, static preflight, exact source diff and member hashes. No physical cluster.
Archive SHA-256: d462a99d441043f0f2180c03683bb7ba424dfa1803495529187c5b58b3c693a2.
review.json contains the machine-verifiable full security inventory, diagnostic inventory, sources, limits and isolation record. SHA256SUMS covers report/review/archive; MEMBER_SHA256.json covers archive payloads.

## 19. Prior evidence preservation

All original 33 archived runs / 47 original tracked evidence files, four files in fresh-9930a083-3a50-4735-8147-abd6d03b1600, and its 1,011 loose raw files remain byte-identical. Prior archive remains 6164b3e8cf4a9d00eb3a822685914b7c60df7d66437821d906096e2d8650a11d. No old package overwritten/relabelled/repacked.

## 20. Shutdown

99-stop.log says server stopped. postmaster.pid and socket absent. Separate OS process check found PID 33928 absent. No restart and no second invocation. The first optional sandboxed ps check was denied by the OS; the separately permitted read-only process check completed.

## 21. GitHub delivery

Source-tested HEAD/tree above remain immutable. The following evidence-only commit publishes only this new package to the same Draft PR #164; final evidence HEAD/tree and exact-head CI are reported in the consolidated delivery and PR body after push. No new PR, Ready transition, merge or manual deployment.

## 22. D09/C09 limits

Current run: both NOT_RUN. Prior accepted limitations remain: legitimate INT64_MAX cannot be constructed practically without prohibited manipulation; current membership CHECK permits owner/admin only, so unauthorized employee downgrade is not constructible. No constraint changed and no new runtime credit claimed.

## 23. Separate gates

Hosted security/default ACL and financial-table privilege inventory, PostgREST exposure, orphan/integrity checks, A1/A2 application behavior and #153 remain outstanding and outside this task. Local evidence does not authorize hosted application or financial/provider activity.

## 24. Required next gate

Darshan returns this failed-proof package to ChatGPT for reconciliation. The minimum proposed next correction is representation-aware PUBLIC OID validation (or explicit SQL numeric encoding) retaining exact grantee-zero and effective-capability checks, followed by a separately approved single fresh run. NOT IMPLEMENTED here. Claude may independently inspect the source, raw witness, diagnosis and proposed scope through Darshan's manual dispatch. Complete-proof acceptance is not earned; no audit automatically dispatched.

## 25. Scope confirmation

No Staging connection. No Production connection. No hosted migration application. No GVM/HQ mutation. No payment/provider activation. No worker/communications activation. No PR merge or Production deployment. No technician deposit resumption. No application, protected migration, D1, generator or financial fixture changes. No post-failure source correction or rerun.
