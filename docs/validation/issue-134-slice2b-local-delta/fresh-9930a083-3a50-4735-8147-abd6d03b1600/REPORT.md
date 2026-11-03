# Slice 2B fresh local proof — coverage correction required

## Disposition

LOCAL_IMPLEMENTATION_OR_HARNESS_CORRECTION_REQUIRED — harness evidence/coverage, not a demonstrated migration defect.

One exact committed runner invocation completed with exit code 0 and failures=[]. The raw summary remains LOCAL_PROOF_INCOMPLETE. All 28 new capability cases reached their expected rejection category. D09 and C09 retain accepted NOT_PROVEN limitations. The expanded availability matrix and negative-case evidence requirements in the October 14 dispatch are not fully implemented by this exact runner, so this package does not claim complete acceptance.

## Immutable tested identities

- Tested HEAD: 7b11effee5539df93cbd35da5431a0207103edc7
- Tree: 09e169343e7dee116771d9c020df68f2d3dd782b
- Parent: 429e232eee0ec8cae4a128b8bafcd3fe5cea82ad
- Remote main: 35dd307986c36bb9a5c3a4847e4a212e8dce9fde
- Main tree: aaaf5be03e16a23265af2f0bd8e8fb9b27fdbb99
- D1 SHA-256: 0caf4f79ce43088520313728b4d3cd77758b0aa066f8f2f776f4714f9ebff6ed
- Migration SHA-256: 3c5179f29f53678ec51798d6fb2929448cba98cf64bd7c44a1d6c796e56eb3a1
- Runner SHA-256: 53905f7fecfffcd24bbba93b4b641a8a6b161d90405da5117b9633051b7965b0

Command: node scripts/verify-issue134-slice2b-lifecycle-disposable-postgres.mjs --confirm-disposable-local

## Fresh environment and shutdown

Run 9930a083-3a50-4735-8147-abd6d03b1600 ran 2026-10-14T16:05:30.508Z through 16:05:49.296Z.
PostgreSQL 17.11 Homebrew; binary /opt/homebrew/Cellar/postgresql@17/17.11/bin/postgres; postmaster PID 22020.
PGDATA /private/tmp/chasum-d1-pg17-73mxXJ/pgdata; private socket /private/tmp/chasum-d1-pg17-73mxXJ/socket; socket port identifier 55473; TCP listen_addresses empty.
Database d1_lifecycle, user darshan, version_num 170011, inet_server_addr null, initial public_tables=0. Negative migration experiments used d1_assertion_rollback within the same fresh cluster.
The runner constructs a scrubbed environment with private empty PGPASSFILE/PGSERVICEFILE and passes explicit socket/user/database to every database subprocess. No hosted credential or connection string is used. Initial process, postmaster and SQL identity checks passed before prerequisite mutation.
The runner stopped the cluster. 99-stop.log reports server stopped; postmaster.pid and the socket file are absent. No restart or second run occurred. The stopped physical cluster is not included in the evidence archive.

## Installed prerequisite composition

Chronological prerequisite logs show numbered migrations through 033, Package A, existing 039/tenant-identity dependencies, later Issue 81 and financial migrations.

Before lifecycle application, after application and at final catalog:
- availability_block_reason: d2261e44fd62ffb476fe69864635ce14
- get_available_slots: d3f0f20c81a56b5e70fe3850e7b357f7
- validate_appointment_slot: ba820a872e7ae4082cc66ce02dc03b52

All 17 protected installed functions were reconciled to the source pins. Only availability_block_reason differs from historical candidate 429e232; other 16 match. Final catalog equals the post-migration catalog, including removal of proof instrumentation.

## Actual D matrix

| Group | Exact runner result | Qualification |
|---|---|---|
| D01 | PASS | Original creation/resources/package/free-price witnesses |
| D02 | PASS | Status workflow/correction and money preservation |
| D03 | PASS | Cancellation/fences/terminal behavior |
| D04 | PASS | Existing schedule/resource/staff/location and DST witnesses; expanded availability matrix incomplete |
| D05 | PASS | Existing price/duration/notes and combined buffer case; dedicated Package A edge matrix incomplete |
| D06 | PASS | Customer correction and ledger/refund vetoes |
| D07 | PASS | HOLD and projection preservation |
| D08 | PASS | Linked retention and Business cascade |
| D09 | NOT_PROVEN | Constructible revision/permit cases passed; legitimate INT64_MAX successor remains source-only |
| D10 | PASS | Resource-child guard witnesses |
| D11 | PASS | Existing ACL/RLS/catalog witnesses; new negative evidence gaps below remain |
| D12 | PASS | Existing v1 close compatibility |
| D13 | PASS | Injection/timeout/disconnection atomic rollback |
| D14 | PASS | Existing recovery/replay witnesses |
| D15 | PASS | Zero recorded SQL-side effect rows |

D12-E, D12-F, D14-E, D14-F and D14-G: PASS in this run. D12-E retains UNKNOWN for corrected SKIPPED/FAILED replay. D14-E records original_count=0 with independent appointment_money=200 cents. D14-F retains the original transaction and matching financial digests. D12-F records actual actor-specific DTO boundaries; no hidden validity flags are exported.

## Actual concurrency matrix

C01–C08 and C10–C11: PASS under their existing oracles. C09: NOT_PROVEN only for the structurally unavailable unauthorized-role downgrade; membership deletion and owner transfer ran both orders. No fresh employee downgrade was attempted; the raw limitation text references historical run 640c9cf9.

Raw observations contain 38 lock witnesses, 358 session dispatch records and 358 session result records, with actual backend/xid/lock/blocker observations. C07's two named-staff races rejected the loser with 23P01. Existing soft resource overlap remains characterized, not corrected. C11's deliberately incompatible order produced bounded 40P01 with rollback. D13 produced 55P03 and 57014 with unchanged financial digest/revision.

## All 28 security negative results

Each entry below is an observed expected rejection, SQLSTATE 55000, followed by successful journal-absence and roles/memberships/table-ACL restoration checks.

Error abbreviations:
U = LIFECYCLE_UNSAFE_OPERATIONAL_CAPABILITY
D = LIFECYCLE_OPERATIONAL_DDL_CAPABILITY
T = LIFECYCLE_OPERATIONAL_TRIGGER_CAPABILITY

| Role | Table | TRUNCATE | TRIGGER |
|---|---|---|---|
| anon | appointments | PASS/D | PASS/T |
| anon | appointment_resources | PASS/D | PASS/T |
| authenticated | appointments | PASS/D | PASS/T |
| authenticated | appointment_resources | PASS/D | PASS/T |
| authenticator | appointments | PASS/D | PASS/T |
| authenticator | appointment_resources | PASS/D | PASS/T |
| service_role | appointments | PASS/U | PASS/U |
| service_role | appointment_resources | PASS/U | PASS/U |
| PUBLIC | appointments | PASS/U | PASS/U |
| PUBLIC | appointment_resources | PASS/U | PASS/U |

| Principal / two-hop mode | TRUNCATE on appointment_resources | TRIGGER on appointment_resources |
|---|---|---|
| anon / inherited | PASS/D | PASS/T |
| anon / SET ROLE | PASS/D | PASS/T |
| authenticator / inherited | PASS/D | PASS/T |
| authenticator / SET ROLE | PASS/D | PASS/T |

Counts: U=8, D=10, T=10. PUBLIC reaches the early service-role effective-privilege check, which is the expected precedence. Existing parameter and disabled-parent cases also refused as expected.

The setup logs contain successful GRANT / GRANT ROLE command tags; the exact intended category follows, with no unrelated rejection. The harness does not separately query and record effective capability before migration, nor operational_revision absence after EACH negative. Journal absence and exact restored roles/memberships/table ACLs are recorded for every case. The separate final-assertion rollback experiment records revision_columns=0 and v2_count=0. These distinctions must not be collapsed into a claim that every newly requested observation was captured.

## Rollback and error inventory

Expected final assertion injection: P0001 / EXPECTED_FINAL_ASSERTION_FAILURE. A following connection records journal_schema=null, revision_columns=0, v2_count=0.
Negative preflight scripts run under BEGIN, error before lifecycle DDL and close their connection; subsequent connections verify rollback state. Their nested BEGIN emits 25001 warning, not a failed test or successful commit.
Other expected outcomes include 23514 integrity refusals, 42501 ACL denials, 40001 expected-customer mismatch, 22023 notes limit, 23503 FK rejection, 23P01 exclusion rejection, 40P01 bounded deadlock, 55P03 lock timeout and 57014 statement timeout. 25P02 follows intentionally aborted concurrency transactions. No unexpected harness failure was recorded.

## Financial/tenant and side-effect evidence

The money digest orders and includes operations, attempts, attempt events, transactions, refunds, projection obligations, invoices and receipts. Raw logs preserve per-case snapshots and comparisons; five explicit before_digest/after_digest observation pairs match. Lifecycle corrections do not infer appointment-wide zero from original-attempt zero. Foreign refund contradictions veto correction without returning foreign identifiers in the RPC DTO.
background_jobs, calendar_connections, notification_logs, notifications, waitlists and webhook_endpoints each finish at zero. No application/provider/worker communication path was invoked.

## Required minimum follow-up — NOT IMPLEMENTED

1. Extend only the proof harness under separate approval to isolate existing-appointment service before/after buffers, staff maximum buffers, cleanup, half-open boundaries, self-exclusion, cancelled exclusion, double-book behavior, missing metadata and cross-Business metadata isolation against Package A plus Issue 81.
2. Explicitly prove 10:00–10:30 plus five-minute cleanup: 10:30 refuses and eligible 10:35 succeeds. The existing domain-cases.mjs combined buffer test places a proposed appointment BEFORE another appointment using a shared service with after-buffer/cleanup. It does not isolate the repaired existing-appointment expansion.
3. Add per-negative effective-capability preimages and post-rollback operational_revision absence (and preferably v2-object absence) alongside existing ACL/role/journal restoration checks.
4. Preserve existing source contract, all migration bytes and historical evidence unless a separately reviewed correction authorizes changes. Run another fresh cluster only after a new PO proof gate.

No migration defect or obsolete fixture expectation was demonstrated by this successful run. The gap is between the dispatch coverage requirements and what the exact committed harness measures. No source edit, generator execution, test alteration or repeat proof was performed.

## Evidence retention

raw-evidence.zip preserves 1,011 original runner files plus the stopped-cluster server log/config and MEMBER_SHA256.json. Every archived payload was byte-checked against its source. review.json records source hashes, installed pins, case-level outcomes, isolation and gaps. SHA256SUMS covers this new package. The loose original run directory is retained locally; no earlier archive was repackaged.

All original 33 ZIP archives and all 47 previously tracked evidence files remain byte-identical. Historical final run 20fe24d4-c538-40f4-846c-332a6303b0a4 still belongs only to migration 36d197d50dfa9560f58457cc65c7bfe7df39b97cbd8e584598b57f117b90ffe6.

## Governance

This evidence may be published only to existing Draft PR #164. Source candidate and migration remain unchanged by evidence-only publication. No merge/Ready/manual deployment or automatic specialist dispatch.
No Staging/Production contact or hosted SQL; no GVM/HQ mutation; no provider/worker/communications activation; no technician-deposit resumption. A1/A2, #153, #132, hosted privilege/default-ACL, orphan/integrity, PostgREST exposure and release gates remain separate.

Next: Darshan returns this evidence to ChatGPT for reconciliation and a bounded harness-correction decision. Complete the separately authorized missing proof before claiming readiness for independent complete-proof acceptance. Claude can review the observed evidence and gaps now through Darshan's manual dispatch; no audit was dispatched automatically.
