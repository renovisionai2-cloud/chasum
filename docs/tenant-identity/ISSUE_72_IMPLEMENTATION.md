# Issue #72 — tenant identity implementation and application gate

Status: feature-branch candidate; independent Level-3 audit pending. Migration
`20260920230358_tenant_identity_gate.sql` is **NOT APPLIED to Staging/Production**.
Do not merge or apply from this document. Outside Private Alpha is not cleared.

## Contract and authority

Uses the completed architecture and competitor assessments on Issue #72:
https://github.com/renovisionai2-cloud/chasum/issues/72#issuecomment-5751783513
https://github.com/renovisionai2-cloud/chasum/issues/72#issuecomment-5751844498

Person identity is separate from Business identity. Existing membership/ownership
resolves before onboarding. `/onboarding/business` is outside the dashboard layout.
The existing-business choice records a manual access request disposition; it sends
no message, creates no tenant/membership and exposes no candidate records. Users
must contact their owner or Support separately. Creation is an explicit confirmed
server action with freshly authenticated actor identity and a fresh access lookup.
Paid signup preference remains non-billing. One Business can have many Locations.

## Current source-derived posture and changes

Migration 033 grants business owners/members FOR ALL, including self-owned INSERT.
Migration 032's authenticated definer RPC is create-capable. These are source
findings, not a new live policy dump. No governed database was connected.

The new migration splits the management policy into SELECT/UPDATE/DELETE, retains
public booking SELECT, revokes client INSERT and adds a restrictive deny policy.
Ordinary updates cannot change Business id/primary owner. Profile saves and slug
alias triggers remain operational. Legacy `ensure_business_for_owner(text,text)`
keeps its signature and authenticated resolution, but contains no creation or seed
writes. Historical migrations, indexes and slug namespace triggers are unchanged.

`decide_business_identity` is the sole new create-capable RPC. PUBLIC, anon and
authenticated cannot execute it. Trusted server code supplies the verified actor;
no browser actor, override flag or preflight approval is accepted. The function
checks verified/active Auth identity, all memberships, primary ownership and the
Trusted Operator app_metadata marker itself. No user_metadata authority is used.

The server action returns only generic statuses/errors. It does not disclose the
candidate, matching contact fields or database errors. Missing migration/service
credentials/query failures fail closed; there is no legacy fallback.

## Ambiguity and concurrency

Preflight lives inside the database writer, not a separate time-of-check token.
Strong review signals: normalized phone (including Location phone), exact email,
website host/shared parent host, exact business/legal name plus matching city/region
(including Locations), contained brand name plus matching city/region, and explicitly
requested current or historical slug. No automatic join follows a match.

Name alone, city alone, email domain alone, or a generated slug alone do not assert
identity. A weak generated slug collision selects a free suffixed slug across both
canonical/alias namespaces. Same name in another city may create only when no other
blocking signal exists. Website parsing in the action removes path/query/userinfo;
no external request is performed. Unknown identity still requires human truth:
this is not KYC and cannot identify intentionally falsified/disjoint inputs. Shared
subdomain hosts are checked against parent hosts; no public-suffix registry/fuzzy
matching engine is introduced.

An Auth row lock and short SHARE ROW EXCLUSIVE locks on businesses, business_members,
locations and aliases cover preflight and commit. This serializes low-volume tenant
creation and prevents concurrent contact/member/alias writes from invalidating the
snapshot. Five-second lock timeout fails closed. Same owner: one created, one existing;
different owners with matching identity: one created, one ambiguity stop. Existing
unique-owner and namespace constraints remain final guards. This intentionally
trades brief profile-write contention for correctness during Private Alpha. Indexed
identity claims/advisory-lock refinement is a later scale decision, not a launch claim.

Business, seven business hours, default Location, settings, seven location hours and
create audit are atomic. New interval is 15 minutes; established timezone/subscription
and other defaults remain unchanged. Existing tenants are not reseeded or modified.

## Durable audit and override boundary

`tenant_identity_decisions` records actor/candidate/result IDs, decision, controlled
reason/signal codes, reviewer and timestamp. No raw contact/name/address JSON exists.
RLS enabled, no client policies/grants. Service role has SELECT/INSERT only. No audit
UPDATE/DELETE capability is granted. Client input cannot set candidate/result/reviewer.
Ten recorded decisions per actor per day bound retries/discovery; afterward Support
review is required. The audit itself is operational data, not an automatic support ticket.

No executable override workflow is provided. Reserved `private_alpha_override` rows
require a Platform Admin FK, controlled review reason, candidate and result IDs. That
constraint is NOT itself approval to create or an override mechanism. Any future
manual override needs a separately approved server-only operation binding the exact
reviewed identity to creation, recording the reviewer and decision atomically. Do not
insert a standalone override audit to bypass this function or create tenants manually.

## Validation and limits

`python3 tests/database/tenant-identity.test.py` creates a NEW local PostgreSQL 17
cluster with TCP disabled and a private Unix socket. It ignores connection PG* env
vars, creates only synthetic data, and stops its cluster. It uses a synthetic subset
of existing tables plus the actual prior owner/seed/slug functions and new migration.
This is executable authorization/concurrency/rollback evidence, not live Supabase
catalog parity or a full historical migration replay. Do not substitute a remote URL.

Candidate local results: 323 tests across 31 focused/regression files passed;
25 disposable PostgreSQL tests passed (including lock timeout, concurrent owners,
audit and seed rollback). Typecheck, changed-file ESLint and build passed.

`node tests/browser/tenant-identity-smoke.mjs` bundles the actual page/form with
explicit backend stubs and blocks all network. Chromium at 375px and 1280px verified
explicit choice, keyboard interaction, required inputs, submitted intent, ambiguity
stop, Support links, no horizontal overflow and no page errors. This is component
workflow evidence, not a live Next Server Action/Auth/database integration claim.
Screenshots were inspected locally; the script regenerates them outside the repo.

Focused application tests exercise resolution, action forgery, missing migration,
operator states, explicit intent, form feedback, profile saves and downstream guards.
Later hosted Momentic must verify the real authenticated route/action after a separate
Staging migration gate; an unapplied Preview cannot prove successful new creation.

## Minimum later environment gate (DO NOT EXECUTE NOW)

1. Independent Level-3 exact-commit audit, especially all creation paths and effective
   privileges, lock order/latency, normalization false negatives and audit privacy.
2. Read-only Staging catalog reconciliation: expected 033 policies, RLS, function
   owners/grants/search paths, one-owner unique index definition, required Auth and
   business/location columns, create_default_location and 039 namespace triggers.
   Unexpected INSERT/FOR ALL policy is a migration stop. Verify PUBLIC-schema CREATE
   privileges are restricted. Inspect pending migration ledger rather than bulk replay.
3. Review only the new timestamp migration. CLI generated its identifier after the
   latest existing timestamp `20260909140000`; no 034-036 dependency/replay is needed.
   Apply ONLY after separate PO approval, transactionally with bounded lock timeout.
4. SQL role tests: denied direct client create, resolve-only legacy RPC, denied new
   client RPC, trusted create+seeds+audit, owner/member profile saves, alias preservation,
   actor spoofing rejection, ambiguity, atomic rollback and concurrent requests.
5. Matched app Preview + synthetic Staging users: sign up/verify lands at explicit
   onboarding with zero Business delta; existing resolves same id; invited/revoked
   fails closed; join records only a disposition; new confirmed identity creates once;
   ambiguity exposes no tenant details. Check mobile/desktop/keyboard and Free wording.
6. No Production or GVM test creation. Production application, merge and rollout need
   their own approval after Staging acceptance. A rollback must not casually re-enable
   the legacy creation function or permissive INSERT policy. Keep creation unavailable
   while reconciling problems; existing tenant access should remain operational.

References for privilege mechanics:
https://supabase.com/docs/guides/database/postgres/row-level-security
https://supabase.com/docs/guides/database/functions
