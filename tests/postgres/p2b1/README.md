# Issue #112 / P2B-1 disposable baseline preparation — 2026-09-26

Development approved; safe harness prepared. **Full migration/atomic apply NOT
IMPLEMENTED because required fresh hosted prechecks were blocked before execution
by OpenAI safety.** No alternative hosted route, retry or delegation is authorized.
This directory is test infrastructure, not a migration or a completed P2B-1 product.
Competitive Product Gate: NOT_APPLICABLE to this bounded internal test preparation;
no customer/operator behavior changes. The canonical board/handoff own task state.

## Supervisor commands (inspect every script/fixture first)

From this checkout, offline validation (does not start PostgreSQL):

```sh
node --check scripts/verify-p2b1-disposable-postgres.mjs
node --check tests/postgres/p2b1/runner-safety.test.mjs
node --test tests/postgres/p2b1/runner-safety.test.mjs
```

Only in the supervisor's explicitly authorized independent disposable execution,
outside the Codex sandbox:

```sh
env -i PATH=/opt/homebrew/bin:/usr/bin:/bin TMPDIR=/private/tmp /opt/homebrew/Cellar/node/26.7.0/bin/node scripts/verify-p2b1-disposable-postgres.mjs --baseline-only
```

The absolute Node path above is this machine's observed path; PostgreSQL 17 binaries
are fixed at `/opt/homebrew/opt/postgresql@17/bin`. No installation or CI job added.
Linux CI binary portability is not implemented. Do not add connection URLs to the
command. The runner rejects *all* PG-prefixed or database/Supabase environment
settings (even empty/local ones), arbitrary arguments and implicit/default mode.
The clean environment is for this NEW local cluster only, never a hosted retry.

```sh
node scripts/verify-p2b1-disposable-postgres.mjs --full-verification
```

Full verification always exits nonzero before any cluster/fixture/spawn. There is
no skip, placeholder migration, environment unlock, or fallback to baseline mode.

## What the runner prepares to observe

One private `0700` short `mkdtemp` directory under `os.tmpdir()`, a fresh cluster,
private Unix socket, no TCP listener (`listen_addresses=''`), random task database
and marker, and synthetic roles only. An explicit bootstrap connection to the
fresh cluster's `postgres` database creates the random task database. No existing
database is accepted, dropped, adopted, or attached. PostgreSQL is a direct child
with explicit argv, not a shell/pg_ctl command. Every phase uses `psql -X`, explicit
socket/port/user/database, ON_ERROR_STOP, and verifies current_database, marker,
cluster system identifier, server version and local server paths/identity in the
same connection before the fixture. No .env, psqlrc, password or service file is used.

Phases: synthetic baseline → role contract without overlay → exact historical 037
and 038 test copies → same role contract with overlay → overlay role contract.
Role changes are genuine `SET LOCAL ROLE` transactions; assertions observe
`current_user`, `auth.uid()`, JWT role, NOSUPERUSER and BYPASSRLS attributes.
Primary owners, membership owner/admin, a cross-business owner and an outsider
are distinct synthetic users. Business owner/admin memberships are never DB
superusers. `service_role` is NOSUPERUSER/BYPASSRLS; anon/authenticated NOBYPASSRLS.
Assertion helpers are SECURITY INVOKER. Bootstrap alone uses the new cluster owner.

Expected results, **NOT YET EXECUTED**:

- Ordinary Business name/timezone reads/writes work for owner/co-owner/admin;
  cross-business/outsider settings writes and identity reassignment are denied.
- Invoice reads retain owner/admin visibility; subscription-event reads remain
  direct-owner only. Anonymous public Business reads remain available.
- **OBSERVED BASELINE GAPS**, never a security PASS: permitted own Business plan,
  status and provider-ID edits; owner/admin invoice insertion; direct-owner event
  insertion; duplicate provider invoice IDs; legacy usd/paid/null-period defaults;
  actual anon/authenticated TRUNCATE despite RLS, including an outsider.
- Overlay client reads denied; three source triggers enabled; null-offer updates
  retain the same gaps. Under modelled historical broad service grants, usage
  UPDATE/DELETE hit the row trigger while TRUNCATE succeeds. No HTTP exploit or
  append-only security guarantee is claimed. No offers are assigned or seeded.

Mutations in assertion transactions roll back; all fixture data is synthetic.
Cleanup in finally stops only the direct child actually spawned, then removes
only its registered, inode/marker/path-verified directory. Failure/uncertain
shutdown preserves the directory instead of killing another process or deleting
an unverified target. Logs, exact paths/PID/system identifier and result remain
under gitignored `test-results/issue-112/disposable-*`, outside cluster cleanup.
SIGINT/SIGTERM request cleanup; SIGKILL/host failure cannot guarantee finally runs.
There is deliberately no automatic discovery/adoption/cleanup of previous runs.

## Source provenance and limits

`provenance.json` records source file SHA-256, exact excerpt line ranges and hashes,
fixture hashes, and supplied historical Git identities. Runner hash verification
fails on changed inputs before spawning. `baseline.sql` reuses scoped definitions
from 001, 008, 014, 015, 032, 033 and the accepted tenant-identity migration; it does
not execute those complete migrations. The 033 dynamic policy statement is copied
verbatim with its surrounding DO wrapper removed and a SQL terminator added.

`historical-037.sql` and `historical-038.sql` are byte-identical TEST-ONLY copies of
the supplied ../inputs source, historical head
`970ea91bcf3480921c915a6635dd2b9e2e27088e`, blobs respectively
`a812908c1763d25c8406b204760bf12259fea549` and
`32c6c05505731512198e388aefc2cef961dcd862`. Their original dated header statements
and comments are retained for source identity, not promoted to current truth.
In particular, 038's narrow GRANT/comment does not remove broad existing/default
service grants or protect TRUNCATE. The fixture explicitly models the dated usage_events
UPDATE/DELETE/TRUNCATE grants with a named-table grant in overlay-contract.sql;
no schema-wide default ACL is changed, and live provenance is not asserted.
This is not hosted replay, adoption, ledger repair or authorization to run 034–036.

The earlier Stage 1B runner and tenant-identity fixture informed conventions but
are unchanged. Auth stubs implement only synthetic users and JWT GUC lookup
(`auth.uid()`/`auth.role()`); they are not Auth/PostgREST or signature verification.
The fixture excludes unrelated tables, signup functions, settings columns beyond
name/timezone, app Platform Admin gates, pricing/entitlement caps and platform
runtime. It cannot certify hosted schema equivalence, complete settings/signup
regression or Admin application behavior. No production SQL has been authored.

## Authoring gate — every fresh precondition remains UNSATISFIED

No fresh hosted precheck executed. Previous observations are historical, including
any null/zero counts; no test asserts hosted counts from constants.

1. V1: fresh normalized overlay function-body equivalence (executable semantics,
   including the offer trigger fired by subscription_plan_key updates), required
   object shapes, constraints, policies, indexes and enabled triggers.
2. V2: fresh effective overlay privileges, including PUBLIC, table/column grants,
   inherited membership and service-role grants; do not infer from GRANT text.
3. V3: fresh all-null checks for Business offer_id and legacy provider customer/
   subscription IDs, plus relevant offer/overlay state; never erase data to fit.
4. Fresh billing invoice provider-ID nonnull/duplicate checks before designing an
   account/mode/provider identity constraint; Business nulls say nothing about it.
5. V4: fresh name-collision checks for the eventual proposed tables, columns,
   functions/signatures, policies, constraints, indexes and triggers. Actual names
   remain pending the reviewed design; no guessed candidate objects are supplied.

## Future tests — NOT IMPLEMENTED, NOT SKIPPED

- C1: committed-receipt crash recovery without another delivery; received/failed/
  retryable-blocked versus completed/terminal handling; receipt/mapping races;
  immutable identity/fingerprint and no duplicate invoice/history effects.
- C2: revision captured **before** canonical snapshot read; deliberately delayed
  worker conflicts, discards/refetches snapshot rather than updating expected
  revision; trusted Admin writers participate; consistent locks/bounded retries.
- C3: client table AND column/inherited effective permissions incl. TRUNCATE;
  chosen runtime append-only boundary; preserved audiences/settings/signup/Admin.
- C4: complete provider/account/mode/customer/subscription/price/Business binding;
  composite invoice identity and agreement checks across distinct event IDs;
  explicit currency/minor units, actual status and periods, no usd/paid defaults;
  recurring base price separate from invoice adjustments; unsupported recoverable.
- C5: reviewed migration on both baselines; unsupported non-null offer case fails
  safely without partial effects; assert exact shapes instead of name existence.
- C6: minimized allowlisted evidence, redacted error codes, deduplicated alerts and
  retention; no raw sensitive payload storage. Later HTTP endpoint/account context
  must handle nullable Event.account; no provider/HTTP work in this preparation.

P2A review PASS stands. PR111 stays untouched/Draft/unmerged. Full P2B-1 still needs
the blocked preconditions, implementation, actual role/crash/concurrency proof,
Claude Level-3 review and separately authorized release gates. STOP here.
