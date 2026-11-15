# CHASUM GVM-FIN-A1 — one failed local proof, October 19, 2026

## Verdict and authority
GVM_FIN_A1_CORRECTION_REQUIRED. Darshan explicitly APPROVED the parser-only correction and ONE disposable PostgreSQL 17 proof. The one invocation was consumed; no retry or post-failure source correction occurred. No complete SQL, application, hosted or GVM acceptance is claimed.

## Exact source
Starting PR HEAD 8c0a2c92ea7da3438016e1aeaa90c09fe6b93720, tree b5e5b93535a5a31f38946785487af312a59ff037. Remote main 80968d24dc1d87407205e54ccc949433ed39e8eb was read only; not merged or rebased into this candidate.
Tested local source commit 5ea8bccb5b50d5d550b018cfc18f044e6b277617, tree 6e80f3f3023112eda0b80550388dfcb0fd98e3e8. This detached isolated checkout is /private/tmp/chasum-fin-a1; the old incomplete worktree was untouched. Local source commit only; remote PR unchanged.

## Bounded correction and static gate
One comparison changed in scripts/proofs/issue-134-slice2b-lifecycle/capability-evidence.mjs: PUBLIC accepts exact numeric 0 or exact string "0", with no coercion. One focused capability-evidence.test.mjs added. Original archived PostgreSQL witness reproduced the old rejection and is accepted after correction. 39 parser tests PASS, including invalid values, missing/multiple ACLs and unchanged identity/privilege guards. Syntax, diff hygiene, allowed-file scope and all protected hashes PASS before run. PostgreSQL 17.11 available. 98 historical tracked evidence files remain byte-identical after run.

## One-run environment
Run 68ab18a9-302d-40f7-8327-bd2d30058031; 2026-10-20T00:06:26.688Z through 2026-10-20T00:06:33.994Z (October 19 evening America/Toronto).
Fresh PGDATA /private/tmp/chasum-d1-pg17-aHH2Cz/pgdata; private socket /private/tmp/chasum-d1-pg17-aHH2Cz/socket; port identifier 55473; TCP disabled. Scrubbed process/child environments; empty pgpass/service files; explicit local socket connections; fresh public schema with zero tables before dependencies; synthetic Businesses only. No hosted database connection or credentials. PostgreSQL 17.11 / version_num 170011. Full runner exit 1, failing psql phase exit 3.

## Capability/security — all 28 complete
Each case has actual preimage, expected 55000 refusal, fresh distinct-backend rollback witness and complete baseline/catalog equality. 16 direct-role, 4 PUBLIC and 8 membership-chain cases PASS. Full case inventory and source hashes are in review.json and raw summary.json. Two additional disabled-parent/parameter negatives and injected migration-assertion rollback executed separately.

## New failure — HARNESS, not a demonstrated lifecycle SQL defect
scripts/proofs/issue-134-slice2b-lifecycle/availability-cases.mjs:20 inserts foreign service metadata with location_id NULL. Phase case-0503-availability-fixtures fails SQLSTATE 23502 on services.location_id. The pre-existing schema enforces NOT NULL (008_phase5_multi_location.sql:210). Line 24 also uses NULL for foreign staff; the same pre-existing constraint applies (:209), but that statement was NOT reached.
Smallest proposed next scope: only availability-cases.mjs; create a dedicated synthetic Location owned by ids.other and assign it to both foreign metadata rows. Preserve the deliberate foreign-Business relationship probe, all fixtures/oracles outside this helper, all constraints, migration and D1. NOT IMPLEMENTED. Separate file-specific PO approval and a new one-run authorization required.

## Actual lifecycle inventory
- D01: PASS
- D02: PASS
- D03: NOT_PROVEN
- D04: NOT_PROVEN
- D05: NOT_PROVEN
- D06: NOT_PROVEN
- D07: PASS
- D08: PASS
- D09: NOT_PROVEN
- D10: PASS
- D11: NOT_PROVEN
- D12: PASS
- D13: NOT_PROVEN
- D14: NOT_PROVEN
- D15: NOT_PROVEN
- C01: NOT_RUN
- C02: NOT_RUN
- C03: NOT_RUN
- C04: NOT_RUN
- C05: NOT_RUN
- C06: NOT_RUN
- C07: NOT_RUN
- C08: NOT_RUN
- C09: NOT_RUN
- C10: NOT_RUN
- C11: NOT_RUN
- D12-E: PASS
- D12-F: PASS
- D14-E: PASS
- D14-F: PASS
- D14-G: PASS

The runner recorded 99 completed subcase assertions, listed verbatim in review.json. NOT_PROVEN groups contain partial witnesses and are not complete-group passes. Existing D09 maximum-revision and C09 role-model limitations are not upgraded to PASS.

## Availability and concurrency limits
Availability setup FAIL. All dedicated availability matrix cases NOT_RUN: service/staff buffers, greatest-not-sum, cleanup 10:30 rejection/10:35 acceptance, half-open boundaries, self-exclusion, cancelled handling, double-booking characterization, missing/foreign metadata, qualification/mapping and dedicated DST cases. Earlier domain buffer/cleanup and DST witnesses exist among the 99 subcases; they do not substitute for this unexecuted matrix. All C01–C11 NOT_RUN. runFinal and final catalog/non-super-session/side-effect sweep NOT_RUN.

## Financial/tenant evidence
Completed fresh subcases include immutable original customer identity, corrected replay, paid-reassignment veto, independent later payment with zero original-attempt ledger count, refund axes, tenant denial and pending/failed projection preservation. Only those recorded local witnesses receive credit; no global final invariant sweep or complete financial acceptance is claimed. UNKNOWN is not relabelled zero/unpaid.

## Protected artifacts
D1 SHA256 0caf4f79ce43088520313728b4d3cd77758b0aa066f8f2f776f4714f9ebff6ed.
Migration SHA256 3c5179f29f53678ec51798d6fb2929448cba98cf64bd7c44a1d6c796e56eb3a1.
Both verified before and after; migration/generator/oracles/application/release source unchanged.

## Archive and shutdown
raw-evidence.zip SHA256 d5b77fbce98ac2d10a2e457f0baaecba9a5911cace902de3cf3793c8bb347752.
698 archive members including 685 untouched runner files, preflight data, source diff/identity, server log/config and MEMBER_SHA256.json. Member-manifest aggregate SHA256 79b1b4f69319efe98e12c966a2ab9b354aff9d335772ed33957d7908d697dcf4. Every member verified after archive creation; physical PGDATA is excluded. Original raw evidence remains in ../68ab18a9-302d-40f7-8327-bd2d30058031/; prior packages unchanged.
99-stop.log says server stopped. postmaster.pid/socket absent; independent ps found PID 31991 absent; pg_ctl status reports no server running. No restart or second invocation.

## Delivery and next gate
No source/evidence push under the conditional all-gates-pass delivery rule. PR #164 remains OPEN/DRAFT/UNMERGED at the original remote head. This new local evidence package and local source commit are preserved for reconciliation. Any PR discussion update is evidence-only; no Ready transition or merge. ChatGPT reconciliation and separate authorization for the one-file fixture correction/new proof come before complete-proof Claude audit. No automatic agent dispatch. No hosted migration, Staging/Production/GVM/HQ mutation, payment/provider/worker/communications activation, ledger repair or deployment. GVM deposits remain HELD.
