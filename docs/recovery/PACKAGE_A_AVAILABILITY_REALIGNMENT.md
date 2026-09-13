# Package A — bounded existing-appointment interval correction

**B — PASS WITH NON-BLOCKING FINDINGS. PRODUCTION APPLY NOT AUTHORIZED.**

Final reconciliation: 2026-09-13, documentation/evidence only.

| Gate | Current state |
| --- | --- |
| Implementation | CORRECTED |
| Staging | APPLIED / VERIFIED |
| Hosted acceptance | COMPLETE |
| Claude independent audit | B — PASS WITH NON-BLOCKING FINDINGS |
| Technical Production readiness | READY FOR PRODUCT OWNER PRODUCTION-APPLY DECISION |
| Production apply | NOT AUTHORIZED |
| Production hold | ON (governing state supplied; not re-queried here) |

The earlier approval rejection and C/HOLD were intermediate states, superseded
by the authorized Staging correction and completed hosted acceptance below.
Engineering/test results are retained evidence, not rerun during this closeout.

## History preserved

Worktree: `/private/tmp/chasum-package-a-availability-realign`.
Branch: `codex/package-a-availability-realign`.
Prior blocked-package commit: `0e4c0536f021a44d52dc151220de42265b03ce78`.
Recovery base: `dbbe4502365858d4194f197b9ac22afe8d259c14`.

Before this correction, the unchanged suite was rerun: 26 passed, two failed.
Existing 10:00–10:30 with cleanup=5 incorrectly offered and validated 10:30.
The original evidence is retained in `PACKAGE_A_026_FAILED_EVIDENCE.json` and the
prior commit. Historical `supabase/migrations/026_availability_engine.sql` is
unchanged. It remains evidence of the defective original target.

## Exact correction

Only the same-staff appointment branch of `availability_block_reason` changes.
Existing service/staff metadata is LEFT JOINed by ID and business ID. Missing or
foreign-tenant metadata does not remove the appointment from collision checks.
COALESCE falls back to zero for absent buffer/cleanup metadata.

The existing blocked interval becomes:

- start minus greatest(service before-buffer, staff before-buffer);
- end plus greatest(service after-buffer, staff after-buffer), plus service cleanup.

Overlap remains half-open: existing blocked start < proposed blocked end AND
existing blocked end > proposed blocked start. Minute intervals use PostgreSQL
`make_interval`, matching the existing proposed-interval convention.
See [PostgreSQL datetime functions](https://www.postgresql.org/docs/17/functions-datetime.html).

Business, location and staff predicates, cancelled exclusion, exclude-appointment
and allow_double_booking behavior remain unchanged. The other three functions,
signatures, grants and comments remain the approved 026 text. No index, table,
policy, new function or other schema object is added to the target.

The public application computes appointment end from service duration at
`lib/actions/public-booking.ts:280`; cleanup/buffers are RPC block expansion,
not an extra persisted duration (`lib/booking-engine/types.ts:114`).

## Artifacts

- `sql/recovery/A_production_availability_engine_realign.sql`: corrected four-function
  recovery target, one transaction, existing grants/comments, NOTIFY after COMMIT.
- `sql/recovery/A_production_availability_engine_rollback.sql`: unchanged rollback
  to the captured Production 008 functions and effective metadata; classifier DROP
  uses its exact identity and RESTRICT. Caller/dependency recheck required before use.
- `sql/recovery/A_staging_availability_engine_pre_correction_rollback.sql`: separate
  rollback restoring the four freshly captured Staging 026 definitions/comments.
  Verify captured ownership/ACL first; the intended forward does not alter them.
- `tests/fixtures/package-a/staging-pre-correction-functions.json`: fresh Staging
  capture including definitions, owner, ACL, comments and timestamp.
- `tests/integration/package-a-availability-postgres.test.ts`: actual local PostgreSQL.
- `tests/unit/booking-engine/package-a-contract.test.ts`: bounds changes to the
  classifier appointment branch and preserves other target text and rollback scope.
- `PACKAGE_A_AVAILABILITY_EVIDENCE.json`: current results and artifact hashes.
- `PACKAGE_A_026_FAILED_EVIDENCE.json`: preserved first-package failure evidence.

The original Production capture and disposable schema fixture are unchanged.
The fixture contains types/helpers and selected real constraints, not a full
Production RLS/FK/trigger replica. No customer row data or credentials are stored.

## Local results

PostgreSQL 17.11, socket-only disposable database `package_a`.
Final combined suite: **43 passed / 0 failed**, four files.
Both original failing assertions are retained and now pass.

New proof covers separate existing-service before/after buffers, staff greatest
rather than sum, combined after-buffer+cleanup, exact legal boundaries, cancelled
appointments, double-booking classifier behavior, missing metadata, foreign-tenant
service metadata, expanded-interval exclusion, and business/location/staff scope.
The 10:35 known-good slot passes authoritative validation; earlier service-buffer
conflicts are rejected by that validator.

All prior behavior still passes: cleanup0, candidate cleanup, lunch, segments,
closures, blackout, caps, notice, horizon, duration override, service_locations,
exclude semantics, raw GiST overlap, Auckland session timezone and Toronto winter
UTC offset. DST coverage is bounded, not exhaustive fold/gap testing.

008 → corrected A → exact008 rollback passes. Injected failure preserves the
original set. After rollback the classifier is absent and original definitions,
owners, configuration, comments and effective ACL entry sets match. ACL array
order is not semantic. A final query confirms all four local bodies match the
corrected artifact. Local synthetic business and appointment counts are zero.

TypeScript, changed-scope ESLint and diff checks pass. Build is not required:
no application/build source changed. Unrelated full-platform tests were not run.

## Historical intermediate Staging hold (superseded)

Fresh read-only capture of `wnfahklzaxirftyskctd` matched historical 026 4/4 before
any attempted apply. No additional worktree rule prohibited the requested bounded
correction beyond the user's explicit gate.

The Supabase DDL tool was then invoked for this exact four-function target on
Staging only, with the operation name
`package_a_existing_appointment_interval_correction`. Automatic approval review
rejected shared-Staging DDL and migration recording because it did not recognize
sufficiently specific authorization. No successful apply was reported. Read-only
post-check: 4/4 definitions, signatures, owners, ACLs and comments unchanged.

No local-validation failure caused that stop. It was an approval boundary.
The operator then required explicit approval for the exact shared-Staging DDL
mechanism, including migration recording. Later explicit authorization enabled
the governed apply; the rejection was not bypassed through an alternate route.

At that intermediate checkpoint, no hosted public/operator/API create/PATCH
workflow or synthetic hosted write had run. Those gates were subsequently completed.
Use only synthetic tenant data, suppress provider sends, preserve before/after
unrelated-tenant fingerprints, and clean all residue. The local suite does not
substitute for those hosted acceptance gates. No PostgREST cache visibility is
claimed from local SQL NOTIFY alone.

## GVM and Production boundaries

User-established current GVM facts retained without new Production SQL:
14 active services, 11 cleanup=5, one service before-buffer=5, zero positive
service after-buffers, active staff buffers zero, Toronto/Toronto. Configured
rules must be respected; PO confirmation of operational cleanup intent remains
separate. No GVM data changed. Later authorized temporary HQ service/assignment records
were created and removed; no HQ operational customer/appointment data changed.

No Production connection/query/write, migration, function replacement, booking,
provider send, Cron/hold/webhook change, deployment, push or main merge occurred.
No 034–036, 040 or 041 changes. Accepted worker/Phase 5/identity/timezone gates
remain closed. This work does not authorize Production apply or hold removal.

## Reproduction and next gate

Start the existing isolated PostgreSQL fixture using local Unix socket
`/private/tmp/chasum-package-a-pg/socket`, port 55483, database `package_a`,
data directory `/private/tmp/chasum-package-a-pg/data`, with no TCP listener.
On a fresh cluster load the existing schema-and-008 fixture, then corrected A.

    CHASUM_RUN_PACKAGE_A_PG=1 ./node_modules/.bin/vitest run tests/integration/package-a-availability-postgres.test.ts tests/unit/booking-engine

The test guards local identity and rolls back synthetic DML. Do not substitute
a hosted host or credentials. The local server is stopped after validation.

Next: present this reconciled packet to the Product Owner for a bounded
Production-apply decision. No Production action is authorized. Do not rerun
accepted Staging work or bulk-apply pending migrations.

## Final Staging and hosted acceptance (supersedes intermediate hold)

Project `wnfahklzaxirftyskctd`: corrected four-function target installed and verified.
Record: `20260913195436` / `package_a_existing_appointment_interval_correction`.
Live RPC proof: existing 10:00–10:30 + cleanup=5 makes 10:30 unavailable and
validation rejects it; 10:35 is offered/accepted. Exclude-appointment and existing
after-buffer semantics passed. Historical 026 remains unchanged.

Protected Preview: https://chasum-pu15qsyba-renovisionappcom.vercel.app

- Public UI: 10:30 absent; 10:35 offered.
- Application POST: invalid 10:30 returned 400 without persistence; legal 10:35 returned 201.
- PATCH: self-exclusion passed; another expanded-interval conflict was rejected;
  rejected PATCH preserved the legal prior state.
- Authenticated Chasum HQ (`724d9ecd-438d-439e-952e-2d8c4ab4486c`): authorized
  temporary one-service/one-assignment fixture exposed operator availability.
  September 14 returned 31 options, 9:00 AM–4:30 PM at 15-minute intervals.
  No customer selected; no appointment submitted. Both setup records removed.
- Synthetic API/test records removed; no real provider send or Cron/worker invocation.
  No GVM mutation or HQ operational customer/appointment mutation.
  Both campaigns restored all 16 monitored table counts/full-row fingerprints.
  Aggregate evidence is retained in `PACKAGE_A_AVAILABILITY_EVIDENCE.json`;
  no customer rows, credentials or auth state are copied into this ledger.

## Separate post-cleanup reliability incident

Digest `498843134` correlates to `Error: Gateway Timeout` on Preview
`GET /dashboard/calendar`, `2026-09-13T21:56:58.935Z`, deployment
`dpl_ErAeZHb8Tq83ZSf4wJnegBMKSX64`. Captured request/log ID:
`jzpz9-1789336618935-66bdedf2c707` (the final instruction omitted the `9`).
The recorded HTTP 200 did not negate the server-render exception.

After zero residue was verified, a fresh same-session bare route and normal
Command Centre → Reception navigation rendered the expected zero-service
“Set up your booking engine” state without console errors. No Package A
function was named in the captured stack. Operator availability already passed.
Classification C: Preview/platform transient; separate P2 reliability evidence,
not a demonstrated Package A defect or technical-readiness blocker. The exact
upstream cause is NOT proven. See
`PACKAGE_A_POST_CLEANUP_RECEPTION_RECONCILIATION.json` for captured details.

## Independent audit and remaining findings

Claude verdict, as supplied in the governing closeout instruction:
**B — PASS WITH NON-BLOCKING FINDINGS; no P0/P1.**
Claude verified lineage/scope, original defect, corrected tenant-safe LEFT JOIN
and interval logic, half-open/cancelled/exclude/double-book behavior, metadata,
historical preservation, Production pre-state/rollback, rehearsal, tests,
installed Staging target, live RPC/public UI/POST/PATCH and synthetic safety.
The independent audit was not rerun or impersonated by this documentation task.

P2: stale committed recovery documentation is resolved here; operator raw-network
status remains unavailable (UI evidence is weaker than API/RPC evidence); the
correlated Preview Gateway Timeout remains a separate reliability incident.
P3: local fixture does not reproduce every Production FK; matching fingerprints
have epistemic limits; `slot_is_blocked` ACL/comment pattern is inherited from
026. The optional before-buffer UI check remains unperformed and need not be
recreated for this closeout. No additional engineering scope is authorized.

**Corrected Package A is technically ready for Product Owner Production-apply
decision. Production apply remains NOT AUTHORIZED; hold remains ON.**
Global project-state/governance documentation is deliberately untouched until
Production recovery acceptance. No new Production or Staging query was made for
this documentation reconciliation.
