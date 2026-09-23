# Issue #73 — Staff quota hardening prerequisite

**Status: CODE-ONLY / candidate.** Product Owner authorized implementation of this
separate Level-3 package from base `e52b78d131a466e9a4926cc592f37f54764d9791` on
`codex/issue-73-staff-quota-hardening`. Independent Claude audit, Control Tower
reconciliation, merge, and hosted application remain separate gates. This package
neither implements nor authorizes Package B2 core.

COMPETITIVE GATE APPLICABILITY: NOT_APPLICABLE

NOT APPLICABLE REASON: internal entitlement-integrity/security hardening; no customer/operator workflow redesign.

USER-FACING WORKFLOW: NO

## Contract

Application `PLAN_STAFF_LIMITS` remains canonical product truth. The new nullable
integer `subscription_plans.max_staff` mirrors Starter 1 / Professional 3 /
Business NULL / Enterprise NULL (NULL = unlimited). A focused test parses the
executable SQL seed and compares all entries with the application constants.
Pricing and Location entitlement values are unchanged.

`enforce_staff_quota()` runs BEFORE active Staff INSERT and inactive→active
UPDATE. It locks the target Business with `SELECT ... FOR UPDATE`, reads its
active subscription plan, then counts only that Business's active Staff in a
separate statement. The lock lasts through transaction completion. This reuses
Stage 1C's serialization model so direct authenticated and privileged writers
compete for the same seat. SECURITY DEFINER ensures RLS cannot hide counted rows;
search_path is pinned to `public, pg_temp`; direct EXECUTE is revoked from PUBLIC,
anon, authenticated and service_role.

Finite seat consumption requires READ COMMITTED (or PostgreSQL's equivalent READ
UNCOMMITTED). Fixed-snapshot REPEATABLE READ/SERIALIZABLE writes fail closed with
SQLSTATE `0A000`: a row lock alone cannot refresh their Staff snapshot. No
Business row is rewritten just to serialize a quota check. Future B2 must use
READ COMMITTED for seat-consuming transactions. See the [PostgreSQL isolation
contract](https://www.postgresql.org/docs/17/transaction-iso.html).

At capacity, the exact contract is SQLSTATE `P0001`, message
`STAFF_LIMIT_REACHED`. Existing Staff creation/update, employee profile/bulk
activation and owner onboarding translate this to a product message, including
legacy schema fallback paths. Application preflights remain useful feedback;
the database is final write authority. Unknown catalog plan keys fail closed rather than inheriting unlimited capacity.
No new RPC or application writer exists.

Existing over-cap Staff remain untouched, including active→active edits.
Inactive INSERT, inactive→inactive and active→inactive UPDATE remain allowed.
Deactivation frees capacity without deleting history. Multi-row operations fail
atomically if total consumption exceeds capacity. Existing working-hours seeding
and timestamp triggers remain intact. Stage 1B's existing Business-key
immutability prevents moving an active Staff row to bypass the transition guard.

## Migration discipline

Exact file: `supabase/migrations/20260923152046_issue_73_staff_quota_hardening.sql`.

Apply the exact body in **one transaction**, only after a separately authorized
hosted gate. Local tests use that same transaction boundary. The body bounds lock
waits to 5 seconds and statements to 30 seconds. It requires the enabled Stage 1B
Staff Business-key guard and all four active canonical plans. A newly added column
receives canonical values; a rerun requires an integer/nullable/no-default column
and exact existing canonical values. Missing plans, malformed columns or changed
values fail closed without silent reconciliation.

Repository timestamps are identifiers, not a hosted replay order. Stage 1B and
Stage 1C were applied under separately governed hosted ledger versions. Inspect
actual prerequisites and exact body/hash before any future application; never run
an unreviewed historical migration replay. Migrations 034, 035 and 036 are
untouched and are not dependencies. Production B1 remains unapplied; this package
does not depend on B1 import tables.

## Validation evidence and limits

`python3 tests/database/staff-quota.test.py` creates a fresh disposable PostgreSQL
17.11 cluster with TCP disabled, a private Unix socket, `psql -X`, and a minimal
child environment without inherited connection variables or hosted credentials.
The cluster is stopped and removed after the run, including failures.

The source-derived fixture includes relevant base tables, exact existing Staff
working-hours/timestamp triggers, Stage 1B tenant-key guards and the exact Stage
1C Location quota trigger. It is a bounded schema subset, not a full Supabase
replica. No hosted compatibility/rollout acceptance is claimed.

- 16 database tests PASS, including canonical values, guarded migration/replay,
  Starter/Professional boundaries, unlimited plans, grandfathering, updates,
  multi-row rollback, RLS-independent counts, role ACLs, tenant isolation and
  Location trigger regression.
- Four real two-session races PASS: INSERT/INSERT, activation/activation,
  INSERT/activation and activation/INSERT. Each observes `pg_blocking_pids` before
  releasing the winning transaction, then proves one success, one exact quota
  error and final active count 3. A second tenant can insert during that wait.
- Before/after SHA-256 fingerprints match for unrelated fixture functions,
  triggers, columns, policies, constraints, indexes, table ACL/RLS and row data,
  excluding only the additive Staff quota objects/column.
- 126 focused Vitest tests across 13 billing, migration and onboarding files PASS,
  including eight action/fallback race-loss cases and the parity test.
- Changed-file ESLint, TypeScript typecheck, production build and
  `git diff --check` PASS. The first sandboxed build could not fetch Google
  Fonts; a local build with network access and a credential-free child environment
  passed. Existing middleware deprecation and Node localStorage warnings are
  non-blocking. Full repository tests/lint and hosted workflow validation were
  not run; this evidence is scoped to the package.

Staging NOT touched. Production NOT touched. GVM NOT touched. HQ NOT touched.
No Auth/RLS changes, imports, hosted synthetic Staff, provider actions, Location
quota changes, public booking, Services, appointments or communication changes.
The runtime manifest is unchanged because no hosted runtime changed.

## Next gate

Control Tower must reconcile the draft candidate and dispatch Claude's separate
Level-3 audit of the exact candidate commit. Claude Staff-quota audit state is
**PLANNED / NOT DISPATCHED**; no accepted task/run evidence exists in this session.
The supporting Codex source review is not that independent audit. After audit,
seek the separate hosted application authorization; do not infer it from green
local tests or the earlier B2 architecture audit.
