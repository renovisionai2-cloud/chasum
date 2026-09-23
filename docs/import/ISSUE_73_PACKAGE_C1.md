# Issue #73 — Package C1 private artifact security foundation

**Level 3 / CORRECTION CANDIDATE / NOT MERGED / HOSTED C1 ACCEPTANCE INCOMPLETE.**
PO-authorized base: `68d944a8fb0cad282bb5df7b6100c490785d53de`; remote main
matched on entry. Branch: `codex/issue-73-package-c1-artifacts` (existing checkout).
Accepted behavior-changing application release remains
`06c7d502948a321b706ba07036724c9178e428e7`. No serving deployment was changed.
The current PO authorization and locked C decisions supersede the dated
read-only-next-gate wording in earlier Package A/B1/B2 documents and Issue body.

COMPETITIVE GATE APPLICABILITY: NOT_APPLICABLE

NOT APPLICABLE REASON: internal privacy/security/artifact foundation implementing
an already-audited Package C product contract; no customer-facing mapping/import
workflow is introduced in C1.
The hosted-absence correction is also NOT_APPLICABLE: a narrowly bounded
compatibility defect in the locked cleanup contract, with no new product behavior.

USER-FACING WORKFLOW: NO

## Hosted absence correction — 2026-09-23

Source: Product Owner / Control Tower correction handoff; no hosted calls were
made by Codex for this correction. Starting HEAD:
`8b7e2c39d77ce28aacf6716211d5439079edd07d`, Draft PR #97. Fresh remote main remains
`68d944a8fb0cad282bb5df7b6100c490785d53de`.

The original independent Claude Level-3 implementation audit returned
**A — PASS / READY FOR PRODUCT OWNER STAGING-C1 DECISION**. PO then authorized
Staging C1 migration and application/security acceptance. The handoff reports
the exact migration applied and verified as ledger
`20260923221157 / issue_73_package_c1_private_artifacts`, with Preview
`dpl_AM5fXYWTiRwFcBNwGVHwKQHkfwjM` serving the starting HEAD above.

Hosted `remove()` succeeded and the raw object was independently absent from
`storage.objects`, but `info(key)` returned `data=null`, `error.status=400`,
`error.statusCode="404"`. The previous allowlist misclassified that response:
`claimed=1 / confirmed=0 / failed=1`, artifact `reviewed_frozen`,
`raw_deleted_at=NULL`, `cleanup_failed=TRUE`; reviewed bytes remained private
and present. **Hosted C1 acceptance and Staging PASS are not claimed.**

This correction adds only exact string/numeric `statusCode` 404 to the existing
absence allowlist. `NoSuchKey`, `ObjectNotFound` and `status=404` remain accepted.
Ambiguous 400, `statusCode="400"`, auth/transport errors, other unrecognized
errors, still-present data and any `remove()` error remain failures. The installed
Storage SDK passes numeric body status codes through despite its string type;
both forms are exercised through an entirely mocked SDK transport.

All migration bytes/hash, schema/ACL/RLS, bucket policies, lifecycle, retention,
fencing, ordering, owner authority, cron and Vercel configuration are unchanged.
No hosted environment, data, deployment or Production/GVM/HQ mutation occurred
in this correction. The dated original implementation evidence below is retained.

Correction validation (credential-free local runs):

- All ten requested regression categories covered; **26 added tests**, no existing
  tests weakened. Before the code fix, five new tests failed with the reported
  false-negative absence/cleanup result; all pass after the narrow correction.
- Focused C1 suite: **121 PASS /4 files** — `import-artifacts.test.ts` **84**
  (storage/server/cleanup), `import-artifact-cron.test.ts` **22**,
  `artifact-storage-safety.test.ts` **7**, `import-artifact-client.test.ts` **8**.
- Changed-file ESLint, `npm run typecheck`, `npm run build`, `git diff --check`:
  **PASS**. Existing middleware deprecation warning unchanged.
- Full `npm test`: **1573 PASS /1 FAIL /36 SKIP** (153 passing files, one failed,
  one skipped). Only `tests/unit/marketing/multi-business-selection.test.ts:60`
  fails (`discovered` undefined); independently reproduced on a fresh exact-base
  archive: **3 PASS /1 FAIL**. Test/runtime dependency graph and config/lock files
  remain byte-identical; no C1 intersection. Initial sandbox Chromium launch
  failure resolved on the authorized local full-suite rerun. Repository-wide
  green is not claimed. Unchanged database tests were not rerun for this correction.

## Scope and deployment order

C1 implements temporary private raw CSV/reviewed-plan storage, durable source
identity, primary-owner server seams, verification and cleanup. No C2 parser,
mapping/review UI, dashboard navigation, C3 orchestration/results/cutover,
reminder takeover, source connectors or second import writer is introduced.
B1/B2 migration files, audit tables and writer semantics are unchanged.

Migration: `supabase/migrations/20260923205834_issue_73_package_c1_private_artifacts.sql`.
SHA-256: `c5bab138294b84de40e9644fcd604594db94b2d917a8f1b5dc601b58d9542089`.
The CLI generated the filename; migration timestamps are identifiers, not a
directive to replay historical migrations. Apply only the reviewed exact body in
one transaction after inspecting actual prerequisites. No reliance on 034–036.

**DB FIRST in every environment:** separately authorize migration/Storage bucket
application → verify tables, constraints, ACL/RLS and actual Storage posture →
authorize application deployment → hosted synthetic validation. Code that calls
these tables/RPCs must not deploy first. There is no missing-schema fallback.
`vercel.json` disables automatic Git deployment for this exact candidate branch
only, using `git.deploymentEnabled`; other branches retain their existing default.
Do not remove that guard or manually deploy until the environment has the verified
C1 migration. No Vercel project setting/secret was changed. A green Vercel Preview
check is intentionally not claimed. Main merge remains prohibited in this task.
See [Vercel's branch configuration](https://vercel.com/docs/project-configuration/git-configuration).

## Schema and source identity

`data_import_sources`: Business, Auth creator, bounded trimmed `source_system`
(1–200 characters), operator `display_label` (1–120), timestamps and a
database-generated random UUIDv4 `source_account_key`. Unicode trim checks match
Package A/B1; controls are rejected. The tuple `(business_id, source_system,
source_account_key)` is unique. Source labels are potentially PII and receive the
same private access boundary. No filename-derived key, naming taxonomy or region
inference exists. Owner create/list return only id/system/label/created time;
there is no rename/delete or caller-supplied new account-key path. Source identity
outlives artifact deletion and can be reused across entity runs by the current
Business primary owner, including after an ownership change.

`data_import_artifacts`: immutable Business/creator/source/entity identity,
opaque unique raw/reviewed keys, SHA-256/byte-count/media metadata, raw/reviewed
deadlines, reviewed preview/snapshot commitments, optional unique B1 run id,
fencing lease, cleanup schedule/attempt/failure fields and confirmed-deletion
timestamps. No JSON/bytea plan, original filename, signed token/URL, customer
contact/name/notes, locale, country or payment metadata is stored here.
Both raw and reviewed objects are bounded to **10,485,760 bytes (10 MiB)**.
Top-level entity intent is location/service/staff/customer/appointment. Future C2
may expand service into serviceLocation and staff into staffLocation/staffService;
C1 merely checks those existing entity boundaries on the supplied plan.

Composite source FK enforces same Business. Run binding validates Business,
creator, source system/key, verified input checksum and reviewed preview/snapshot
hashes. One artifact per run; binding is immutable, accepts previewed/committing
runs, does not create/advance a run and does not extend retention. Future C2/C3
owns calling it; C1 fabricates no runtime run preparation.

Both tables ENABLE and FORCE RLS, have zero policies, and revoke all direct
PUBLIC/anon/authenticated privileges. Service role has SELECT only; writes use
10 narrowly scoped RPCs. Four internal helpers have no API EXECUTE. Functions pin
`search_path=pg_catalog,pg_temp`; effective privilege assertions reject inherited
ACL drift. Existing `c1_` helper drift fails before any changes. Reapplication
fails rather than adopting unexpected tables/buckets or privileges.

Sources cascade from Business; creators use Auth-user DELETE RESTRICT.
Artifacts use Business/source/run DELETE RESTRICT, preventing lost Storage
locators on offboarding. API roles cannot purge metadata. Privileged offboarding
must first stop new work, drain in-flight provider writes/capabilities, confirm
exact object deletion, purge only `deleted` artifact rows, then remove the
Business; remaining source rows can cascade. Ordinary artifact cleanup retains
sources and tombstone metadata. No new offboarding API is exposed.

## Owner and Storage boundary

Every owner entry in `lib/server/import-artifacts.ts` performs fresh session
`auth.getUser()` → authoritative `resolveBusinessForUser()` → primary
`businesses.owner_id === actor` → only then service client. No actor or Business
is accepted from a browser. Database RPCs repeat current owner checks under a
Business lock. Artifact reads also require its original creator; old artifacts
cannot transfer recovery authority to a replacement owner. Trusted Admin and
Platform Admin status grants no C1 access. Raw/reviewed reads reauthenticate and
recheck database expiry/state after private I/O. The modules are `server-only`,
with no Server Action or owner HTTP endpoint in C1.

Dedicated bucket `import-artifacts`: `public=false`, 10 MiB limit, explicit CSV,
plain/octet-stream and JSON MIME allowlist. No Storage policy or grant is added
or widened; existing `business-assets` policies remain bucket-specific. The
public `business-assets` bucket is never reused. Actual hosted effective policy
inspection remains mandatory; source checks cannot rule out hosted policy drift.
Keys are server-generated `Business UUID/artifact UUID/raw-or-reviewed/random UUID`.

Installed `@supabase/supabase-js` / `@supabase/storage-js`: **2.110.2**. Its
`createSignedUploadUrl(path,{upsert:false})` has a fixed **2-hour** lifetime, no
caller-selectable shorter TTL; signed upload itself requires no broad browser
Storage permissions. Issuance accepts source/entity only, reserves the metadata
first and signs one exact raw key once. A delayed reservation cannot issue after
one minute. Provider token expiry is checked against the reserved safe window;
unexpected/expired tokens are not returned. No full signed URL is returned or
logged. Tokens remain sensitive bearer capabilities until expiry, even after an
owner loses authority; server read/finalize authority is independently checked.
See [provider API contract](https://supabase.com/docs/reference/javascript/file-buckets-createsigneduploadurl)
and installed `node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts`.

**Not true single use:** create-only forbids replacing an existing object under
the provider contract, but deleting it can permit token replay into that same
path until expiry. A token cannot intentionally be issued for another path; the
provider's actual path/upsert enforcement must still pass hosted attack tests.
No browser signed-download capability is generated.

Verification fetches the exact private object, checks metadata sanity, bounds the
actual Blob/bytes, validates UTF-8 with fatal decoding, rejects NUL/empty/binary
posture and computes SHA-256 over actual bytes. Browser checksum/size/content type
are never accepted as truth. This is not CSV parsing, antivirus certification or
mapping. Failures use controlled messages and leave metadata discoverable.

## Freeze, read and lifecycle

`upload_pending → raw_verified → freezing → reviewed_frozen`.
Expiration/interrupted freeze: active state → `cleanup_pending → deleted`.
`import_run_id` indicates binding without duplicating B1 lifecycle. `deleted`
means deletion was confirmed at its timestamps; immutable locators remain for
retry/rechecking. No recovery plan can be replaced or regenerated by C1.

Future C2 supplies exact OperationalPlan JSON bytes to the internal freeze seam.
C1 validates bounded shape, tenant, source, verified checksum and entity intent
without normalizing/reserializing stored bytes. It reserves key/hash/size/review
commitments and a five-minute fenced freeze before Storage upload. Upload is
create-only JSON; exact read-back hash/size must agree before final freeze. A
stalled reservation is rejected before starting I/O. An interrupted reservation
is cleanup-only after its lease expires, never a path to a different plan.
Successful freeze immediately attempts raw deletion; provider/database failure
does not undo the frozen plan or hide pending cleanup. Later reads return exact
private bytes only after checksum/size and current owner/deadline checks.
B2 still validates operational row commitments during its own recovery; C1 does
not change or bypass that writer.

| Retention rule | Authority |
| --- | --- |
| Raw hard access deadline | DB artifact creation +24h, conservatively earlier than upload completion |
| Early raw deletion | Immediately after successful reviewed freeze |
| Reviewed hard deadline | DB freeze reservation +72h, never extended |
| Bound terminal run | Earlier of hard deadline and B1 `finished_at` +1h |
| Previewed/committing or unbound plan | Retained until hard deadline |
| Signed upload quiescence | Creation +2h5m; expiry admission requires another 1m margin |
| Operation/cleanup lease | 5m; tokens rotate on reclaim |
| C1 HTTP request timeout | 10s, no-store, caller abort preserved |

A committing run stuck past 72 hours becomes **unrecoverable by design** through
this retained artifact. Hard expiry fails closed even before cron runs. C3 must
not replace it with a newly generated plan. These are access/eligibility deadlines;
physical deletion is attempted at the next bounded hourly sweep, and outages or
backlog can delay confirmation. C1 does not claim a provider-level wall-clock
physical-erasure guarantee. This operational retention limitation must be accepted
and tested at the next Level-3/hosted gate, not represented as a local PASS.

## Cleanup and cron

Dedicated GET/POST `/api/cron/cleanup-import-artifacts` requires `CRON_SECRET`
even locally: missing →503, incorrect bearer →401, authorized rate limit →429
when exhausted. No communications job/worker flag dependency. Hourly Vercel
schedule `0 * * * *`; at most 25 claims, five processed concurrently. C1 adds no
telemetry instrumentation, logger, provider or hosted scheduler mutation.

Database `FOR UPDATE SKIP LOCKED` claims and UUID fences serialize cleanup. The
worker deletes each exact object, then confirms absence via exact-key `info`.
Only exact `"404"`/`404`/`NoSuchKey`/`ObjectNotFound` SDK `statusCode` or HTTP404 means absence;
an ambiguous 400, authentication/transport error or still-present object fails.
Each object's outcome is recorded independently. Both required fresh deletion
confirmations are necessary before terminal metadata finalization, even if an
older timestamp said that object had previously been removed. A failed object
does not abort other claims. Failed persistence leaves the lease/locator for
reclaim; stale workers cannot finalize. Aggregate responses are
`claimed/confirmed/failed`; `confirmed` means this attempt's required deletions,
not necessarily final metadata deletion before token quiescence.

Early raw deletion keeps its locator and does not finalize `raw_deleted_at` until
a **new deletion claim begins after** upload quiescence. A finish RPC delayed
across expiry cannot turn an earlier absence check into post-expiry proof. Raw
keys are reaped hourly while the reviewed object remains live; fully deleted
artifact tombstones are reaped daily, active due rows first. This also discovers
very late provider writes after client request cancellation. The code never
assumes abort means provider rollback. `cleanup_attempts`, `cleanup_failed` and
retry time are protected observable state; failures retry hourly rather than
silently dropping poisoned metadata. Hosted operations must monitor aggregate
failure/backlog counts and verify scheduler throughput before activation.

## Privacy and global boundary

No intentional logs of bytes/plans/mappings, names/contacts/notes, labels,
keys/source-account keys or capabilities. Errors suppress raw Storage/DB/transport
bodies. The shared service factory's optional timeout changes C1 callers only;
existing callers retain the old configuration. Provider access logs can still
contain routes/status/lengths and pseudonymous object paths; prior synthetic edge
evidence is limited, not a universal no-logging guarantee.

**GLOBAL ARCHITECTURE NOW. REGIONAL ACTIVATION DELIBERATELY.** Source system and
opaque ownership/object identity are region-neutral. No country, locale, address,
phone, currency/tax inference or regional provider model was added. Existing
canonical source timezone/currency are checked only as part of the supplied plan;
C1 does not activate the later Global Readiness Foundation.

## Original local evidence and hosted gaps

Local PostgreSQL **17.11 (Homebrew)**, fresh disposable UTF-8 cluster, private Unix
socket, TCP disabled, `psql -X`, credential-free child environment, teardown on
completion. C1 applies exact B1 + exact C1 to a bounded fixture. `storage.buckets`
and `storage.objects` are explicitly **SQL fixtures, not a running Storage service**.

- `python3 tests/database/import-artifacts.test.py`: **45 PASS**. Includes real
  concurrent claims, ACL/RLS, drift rollback, identity/constraints, same-Business
  binding, offboarding, all TTL boundaries, raw replay quiescence, partial failures,
  fresh deletion confirmation and per-object tombstone retry.
- B1 `governed-import-foundation.test.py`: **124 PASS**.
- B2 `governed-import-writer.test.py`: **31 PASS**, including real writer races.
- Four new C1 Vitest files: **95 PASS** (58 seams/cleanup, 22 cron, 7 source/SDK
  transport, 8 optional-client timeout tests).
- Focused imports/B2/owner/auth/cron/runtime tests: **322 PASS /14 files** on the
  final focused run, including all four new C1 files.
- Changed-file ESLint, TypeScript `npm run typecheck`, `npm run build`, and
  `git diff --check`: PASS. Build uses a credential-free child environment, with
  network for existing Google Fonts; existing middleware deprecation is unchanged.
- Full suite: **1547 PASS /1 FAIL /36 SKIP**, 153 passing files, one failed file,
  one skipped file. The only failure is
  `tests/unit/marketing/multi-business-selection.test.ts:60` (`discovered` is
  undefined). Reproduced on an exact `68d944a...` Git archive: 3 PASS/1 FAIL.
  Test, `flagship-summer.ts`, `meet-summer-intelligence.ts`, `session-memory.ts`,
  its type-only dependency, package/lock/config/setup all match base exactly.
  No C1 dependency path intersects that runtime graph. Non-blocking for C1;
  repository-wide green status is not claimed. The initial sandbox-only Chromium
  launch failure was resolved by an authorized local rerun; its test then passed.
  Skipped tests, including opt-in PostgreSQL integration, are not counted as run.

Adversarial properties: local tests prove exact signed request path, no upsert at
issuance, distinct constrained random paths, private bucket SQL, owner/tenant
denial, expired-token rejection by the seam, exact hash and retry order. Installed
SDK mock-transport tests intentionally demonstrate that a malicious client can
send another path or `x-upsert:true`; **provider rejection is NOT proven locally**.

Mandatory later authorized Staging tests, synthetic fixtures only:

1. Replay one capability against another artifact/path/bucket; verify denial.
2. Consume it, then replay with different bytes and `upsert:true`; original bytes
   must remain unchanged. Test concurrent consumption and token expiry.
3. Check private public-URL denial, anonymous/authenticated list/read/delete and
   cross-tenant/Trusted Admin/Platform Admin server denial.
4. Delete raw early; replay during token life; verify post-expiry cleanup and
   delayed-finalization fences, including in-flight provider request completion.
5. Exact reviewed freeze/read/recovery bytes, no PostgreSQL plan payload, terminal
   +1h and hard72h failure, partial deletion failures and concurrent cron claims.
6. Verify real `info` absence errors, remove acknowledgement, inherited Storage
   policies, 10 MiB bucket enforcement, hosted secret posture, scheduler/backlog
   and failure visibility, provider log/cache behavior and complete cleanup.

Original implementation session: Staging NOT touched. Production NOT touched. Hosted Storage NOT touched.
GVM NOT touched. HQ NOT touched. No real files, merge or migration application.
Runtime manifest remains unchanged because no runtime/configuration was applied.

## Next correction audit gate and dispatch truth

Control Tower reconciles the exact corrected candidate commit/diff and unchanged
migration hash, then dispatches Claude for an independent correction audit.
The original audit PASS above does not accept this correction or hosted C1.
Supporting Codex review/testing is not a substitute for Claude.

Claude correction audit: **PLANNED / NOT SENT / NOT RUNNING**. No accepted
Claude correction task/session or result exists in this correction session. Its
dispatch is **BLOCKED on manual Control Tower/Darshan dispatch**, not on code
work. No executable Claude channel was available; no mention was posted.

Manual dispatch prompt (fill the delivered immutable corrected HEAD):
“Claude, independently audit Issue #73 Package C1 hosted-absence correction at
HEAD <CORRECTED_HEAD>, correction base 8b7e2c39d77ce28aacf6716211d5439079edd07d,
branch codex/issue-73-package-c1-artifacts, Draft PR #97. Read
docs/import/ISSUE_73_PACKAGE_C1.md. Review only the correction diff: exact string
and numeric statusCode 404 recognition, existing absence shapes, fail-closed
errors, remove/info ordering and all ten required regressions. Verify migration
SHA-256 remains c5bab138294b84de40e9644fcd604594db94b2d917a8f1b5dc601b58d9542089.
Return findings and correction verdict; do not claim hosted acceptance.
Read-only; no merge, deploy, hosted calls or tenant mutation.”

Darshan/Control Tower must dispatch that audit; safe source review can continue.
**Exact next gate: independent Claude correction audit before corrected Preview
redeploy.** After reconciliation, Control Tower must redeploy the exact corrected
SHA and resume the existing authorized acceptance fixture. Codex must not deploy
or touch hosted environments. Staging/C1 acceptance remains incomplete pending
that retest; merge and Production remain separately PO-gated.
