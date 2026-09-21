# Issue #73 — Package B1: private import persistence foundation

**LEVEL 3 / MERGED / STAGING APPLIED + VERIFIED / PRODUCTION DB NOT APPLIED.** PR #82 merged at canonical main
`6b095cbf8c42664a44398c01b2b19ff2e1f15c40`. Package A is COMPLETE / PRODUCTION ACCEPTED. B1 passed independent Level-3 audit and controlled Staging acceptance. Package B2 remains NOT AUTHORIZED.

## Scope and schema

Migration: `supabase/migrations/20260921203029_governed_import_foundation.sql`.
It creates exactly three tables, with UUID defaults and explicit scalar metadata:

- `data_import_runs`: authoritative existing Business, Auth creator, source/account,
  schema version, input checksum, source timezone/currency, lifecycle state,
  reviewed hashes and timestamps. No source payload or source-file storage.
- `data_import_entity_refs`: immutable source namespace → existing UUID entity
  mapping, first/last run, content hash and first/last-seen timestamps.
- `data_import_row_outcomes`: immutable preview/commit phase facts with opaque row
  locator/hash, entity type, controlled status/action/reasons and optional UUID
  target. Business authority is inherited from the run, never a second supplied
  outcome business_id.

No application code, import action, operational writer, DEFINER RPC, upload,
Storage, UI, createBooking path, event, communications or provider call is added.
No appointments/payment schema or historical migration is changed. No dependency
on unapplied 034–036.

## Privacy and privileges

All three tables ENABLE and FORCE RLS and have **zero policies**, including no
ordinary owner policy. ALL privileges are explicitly revoked from PUBLIC, anon,
authenticated and service_role, then only SELECT is restored to service_role.
The existing BYPASSRLS role attribute is a prerequisite; B1 does not change roles.
No API role receives INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES or TRIGGER.

Four internal helpers are SECURITY INVOKER with `search_path = pg_catalog, pg_temp`
and fully qualified application relations. PUBLIC/anon/authenticated/service_role
EXECUTE is revoked. Only the migration owner retains authority to use them. There
is no new callable discovery API. A final effective-ACL assertion fails closed
if unexpected inherited privileges defeat these revocations.

These are deliberate separate controls: ACLs grant operations; RLS filters rows.
BYPASSRLS does not confer table privileges. See [PostgreSQL RLS documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

No raw names, email addresses, phone numbers, addresses, notes, payload JSON,
provider errors or file bytes have columns here. Reasons are an exact allowlist
of Package A codes, at most 40 non-null entries in one dimension. source_row_key
follows Package A’s trimmed 1–200-character locator contract, with no character
whitelist. Non-PII locators such as `row 17`, `sheet/1` and `page#2-row#4` persist
unchanged. Edge whitespace is rejected using the ECMAScript trim character set;
the database never silently trims or rewrites a locator. Source keys, UUIDs and hashes remain sensitive
pseudonymous metadata, not anonymous data. Syntax cannot prove a source key is
non-PII: the future server adapter must supply reviewed opaque identifiers and
must not encode contact data into them. Service-role reads require that server
boundary; these tables are not a browser API.

`input_checksum` checks lowercase SHA-256 shape only. It does not prove source
bytes or authorize import. Future upload handling must compute it from received
bytes; B2 must reauthorize and recompute current preview/commit truth.

## Lifecycle and audit write windows

Runs must INSERT as uploaded. Identity and created_at cannot change afterward.
Only these UPDATE transitions are accepted:

- uploaded → previewed, failed or cancelled;
- previewed → committing, failed or cancelled;
- committing → completed, completed_with_errors or failed.

Same-state UPDATE is rejected. Every terminal run is immutable, including no-op
UPDATE. Retry creates a new run. Preview entry requires both reviewed hashes and
previewed_at; later transitions preserve them. Committing requires
commit_started_at, which is then immutable. Termination requires finished_at.
Timestamps must be finite, ordered and consistent with state; a caller cannot
insert directly into a later state.

Preview outcomes may INSERT only while uploaded, **before** the transition to
previewed. Commit outcomes and reference inserts/updates require a committing
run. Outcomes reject all UPDATE, including preview → commit; insert a distinct
phase instead. Closed runs cannot acquire new child facts. Child validation holds
a SHARE row lock on the run so finalization cannot race past an in-flight insert.
Future B2 must persist each phase and its state transition in the intended atomic
transaction. B1 supplies constraints, not a mutation entrypoint or actor check.

The uniqueness `(run, phase, entity_type, source_row_key)` rejects duplicates,
never first-row-wins. Future persistence must reject ambiguous duplicate physical
row locators rather than overwrite their audit facts. Package A's source row
locators must be made stable/opaque by the adapter before persistence.

## Source-reference integrity

Unique source identity:
`business_id + source_system + source_account_key + entity_type + source_external_id`.
Only location/service/staff/customer/appointment are allowed. The real source ID
is not manufactured from the row hash. Assignments retain Package A endpoint-pair
idempotency; they are not source refs and cannot have outcome target_entity_id.

First and last runs use composite FKs binding the same Business, source system
and source account. A new reference starts with first_run = last_run. Ref identity,
target, first run, id and created_at are immutable. A later governed re-import can
change only source_row_hash, last_import_run_id and updated_at; last-seen time
cannot move backward and the last run must be committing in that namespace.

Ref INSERT/UPDATE and outcome INSERT with a target validate all five concrete
entity tables using the declared type and authoritative tenant. The target row
is locked FOR SHARE until transaction end, protecting against concurrent deletion
or business_id change during validation. Missing/wrong-type/foreign targets fail.

This is **write-time validation**, not a permanent polymorphic FK: a later normal
operational deletion can leave a historical target ID in the audit. No triggers
are added to operational tables and no operational entity is retained/deleted on
behalf of import. B2 must always revalidate mapped targets and stop for explicit
reconciliation if absent or re-tenanted; it must never silently create a duplicate
or re-target an existing ref. Tests cover stale-target update rejection.

## Deletion and offboarding

API roles have no generic delete path. Runs/refs cascade only from their Business
FK; outcomes cascade from runs. First/last-run composite FKs use deferred NO ACTION,
so deleting a referenced run alone fails at commit, while Business offboarding
can remove both runs and refs regardless of cascade ordering. No DELETE-blocking
trigger prevents legitimate Business offboarding. Synthetic offboarding with
cross-run refs and terminal runs is tested. This introduces no offboarding API
and does not certify unrelated legacy offboarding constraints.

The creator FK uses RESTRICT: Auth-user deletion cannot silently erase import
audit or clear immutable creator identity. Governed offboarding must handle
Business/audit retention before deleting that Auth identity. Privileged database
administration remains outside ordinary application workflows.

## Revised D3 and future B2 prerequisites

The revised Product Owner rule supersedes the earlier proposed
`import_unreconciled` capability. **Do not add that payment status.** Future v1
appointments are eligible only with NONE or EXACT truth representable without
paid/refunded ledger reconciliation. FINANCIAL_RECONCILIATION_REQUIRED stays
REVIEW/BLOCK, including in the durable status/action constraint. Never invent
zero/unpaid balances, recalculate source money from current catalog, or fabricate
payments/refunds. Supporting paid/refunded migration requires separate governance.

D1 valid customer email, D2 required staff and D5 required source account remain
locked. B2 must recheck owner/admin authority, tenant/run binding, reviewed preview,
current entitlement/count truth, active staff/location quotas and concurrency.
Its dedicated import writer must avoid createBooking/event/communications;
respect the existing staff working-hours seed trigger; and explicitly seed new
location_settings + seven location_hours. None is implemented here.

## Migration and validation

Run the exact migration body in **one transaction**. SET LOCAL bounds lock waits
to 5 seconds and individual statements to 30 seconds. Fail-closed preflight checks
absence of the three targets and required table/UUID tenant columns. CREATE TABLE
and CREATE FUNCTION have no IF NOT EXISTS/OR REPLACE drift masking. Unexpected
objects or effective privileges roll back the entire transaction. No bulk replay.

`python3 tests/database/governed-import-foundation.test.py` passed **124 tests**
on disposable local PostgreSQL 17.11 with UTF-8 encoding. Each run creates a fresh private directory,
uses Unix socket only (`listen_addresses=''`), psql `-X`, and a minimal child
environment containing no PG* connection variables, DATABASE_URL or hosted
credentials. Exact migration body/hash is recorded. Cluster stops and temporary
files are removed by unittest cleanup, including after failures.

Coverage includes effective table/function ACLs under adversarial defaults,
independent RLS denial, definitions/indexes/policies/triggers, all forbidden state
edges, valid transitions, scalar/FK validation, every target type, namespace
mismatch, concurrency, phase immutability, reconciliation, Business offboarding,
reapply/pre-existing target failures and late ACL failure with complete rollback.
Locator regressions cover spaces/slashes/hash characters, Unicode, the 200-character
boundary, and rejection of empty/whitespace/untrimmed/overlength input.
This is local PostgreSQL evidence, not hosted Supabase compatibility acceptance.
Typecheck/build are not required for this SQL/Python/docs-only change.

Migration content SHA-256 is `57b79680fdc60ad5789d90d1d9e6e9600b9b15fb84002687e86c1130acd4dc9f`. It is **APPLIED + VERIFIED on Staging only** (`wnfahklzaxirftyskctd`) and **NOT APPLIED to Production** (`kxcydvhswkuzepwzzinq`). Staging recorded hosted migration history name `governed_import_foundation` at generated version `20260921220118`; this is consistent with the governed `apply_migration` path and does not change the repository filename/content/hash. Post-apply verification showed all three tables empty, RLS/FORCE RLS enabled, zero policies, service_role SELECT-only, helper SECURITY INVOKER with pinned search_path and API EXECUTE revoked. A before/after fingerprint of unrelated public relations, columns, constraints, functions, triggers, policies and table privileges was unchanged. No GVM/HQ mutation. B2 remains blocked; no Production DB application is authorized by this status.
