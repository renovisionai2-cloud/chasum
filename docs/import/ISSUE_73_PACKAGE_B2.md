# Issue #73 — Package B2 core governed import writer

**Level 3 / CODE-ONLY CANDIDATE / NOT MERGED / NOT HOSTED-APPLIED.**
Authorized base: `18933a3268a57f01daf439b9d116b4672a002a1d`.
Branch: `codex/issue-73-package-b2-core`. Remote main matched this exact base at
entry. The Product Owner's B2 authorization on Issue #73 supersedes the earlier
Staff-quota-only scope in dated documents. Package A is accepted; B1 and Staff
quota are merged and Staging accepted. Both Production migrations remain unapplied.

COMPETITIVE GATE APPLICABILITY: REQUIRED

USER-FACING WORKFLOW: NO — core writer, no Package C import workspace.

The existing Issue #73 competitive gate (Fresha, Square, Vagaro, Jane) establishes
mapping, deterministic preview, duplicate/error review, explicit import, and
results/retry as the parity floor. Chasum's advantage is connected tenant and
relationship truth, preserved money, reviewed commitments, safe operational
activation, and an auditable replay-safe commit. No broad research was repeated.
This candidate establishes the core; it does not claim hosted workflow, responsive
import-workspace, Staging, or Production acceptance.

## Entry points and trust boundary

`lib/server/import-writer.ts` is `server-only`, not a Server Action or HTTP route.
There is no new browser-callable mutation endpoint. Each entry independently calls
session `auth.getUser()`, resolves the existing Business, and requires its primary
`owner_id` to equal the actor before creating the service-role client. It never
creates a Business. Trusted Admin and Platform Admin alone cannot commit.

The five service-role-only SECURITY DEFINER RPCs are:
- `get_data_import_context`: coherent authoritative tenant snapshot;
- `prepare_data_import_run`: private audit preparation, no operational writes;
- `begin_data_import_commit`: reviewed begin CAS or expired-lease reclaim;
- `commit_data_import_batch`: 0–50 reviewed rows, zero rows = heartbeat;
- `finish_data_import_run`: derive terminal truth, or explicitly abort as failed.

Every call locks/checks primary Business owner authority. Run calls additionally
lock/check Business + creator + run. Batch and finish repeat authority and lease
checks. Lock order is Business (NO KEY UPDATE) → active subscription plan → run. All function
search paths are pinned; internal helpers have no API EXECUTE. PUBLIC, anon and
authenticated cannot directly execute the RPCs. Effective ACL assertions fail
migration application on inherited privilege drift. B1 audit tables retain FORCE
RLS, zero policies, service_role SELECT-only, and no direct API mutation grants.

## Review and commit integrity

The pure `buildOperationalPlan` reuses Package A and the extracted Stage 1C
`locationSlug` helper. Missing slugs are generated BEFORE review; no suffix is
invented at commit. Empty or duplicate slugs block. The Add Location algorithm is
unchanged. B2 overlays NONE and nonzero-discount appointment REVIEW without
changing Package A's accepted source/preview semantics.

Preparation stores reviewed A preview/snapshot hashes, a DB target fingerprint,
per-row operational commitments and a commit guard. The guard binds Business,
plan key, numeric max_locations/max_staff (NULL = unlimited), active counts,
reviewed generated CREATE Location slugs, preview hash, snapshot hash, target
fingerprint and the entire operational-plan hash. It therefore also binds B2's
commit-only restrictions and mapped appointment status.

Immediately before the first begin, the server reauthenticates, rebuilds current
target truth, reruns Package A and requires both exact reviewed hashes. The DB
atomically rechecks the target fingerprint and all reviewed row commitments
before previewed → committing. Drift leaves the run previewed and requires a new
review. The snapshot uses one SQL statement, no PostgREST row-limit truncation,
and UTC-pinned serialization. Row versions hash all operational row fields;
matching projections expose only the needed fields transiently.

Hashes do not replace final constraints. Quota triggers, entity tenant/existence
checks, relationship row locks and the Staff-overlap exclusion remain final
write authority. Fixed-snapshot isolation is rejected for governed writes.

## B1 additions and privacy

One new migration: `20260923210000_issue_73_package_b2_core.sql`.
No old migration is changed, including 034–036. The Staff quota migration is a
prerequisite, not copied or reapplied inside B2.

No new tables. Minimal additions:
- runs: `target_fingerprint`, `commit_guard_hash` bind reviewed target/plan;
  `lease_token`, `lease_expires_at`, `heartbeat_at` support fenced recovery;
- row outcomes: `operational_hash` binds exact transient row + decision;
  `row_ordinal` binds dependency order and complete coverage;
  `commit_result` distinguishes CREATED / LINKED / SKIPPED / BLOCKED;
- unique per-run/phase ordinal and outcome-shape constraint;
- Services: `commercial_settings_reviewed boolean NOT NULL DEFAULT false`.

B1 already has preview/snapshot hashes; no competing copies are added. B1's run
guard is minimally extended for committing-state lease updates while retaining
identity, review, original commit-start and terminal immutability.

No canonical payload JSON, names, customer contacts, addresses, notes, source
files, provider errors, or payment data is added to audit storage. B1 opaque
locators and source IDs plus hashes remain sensitive pseudonymous metadata. A
future adapter must supply non-PII locators/source namespace; syntax alone cannot
prove that arbitrary source IDs are non-PII. No upload/storage adapter exists in
B2. Actual-file checksum verification belongs at that future input boundary.

## Recovery and idempotency

Leases last two minutes, use wall-clock time after lock waits, and refresh after
every successful batch/heartbeat. A live lease cannot be stolen. Only the same
run creator who is still primary owner can reclaim an expired committing run.
Reclaim rotates a UUID fencing token; all old-worker batches/finish calls fail.

The caller must resupply the **original reviewed operational plan**, including
normalized rows and reviewed decisions. Every row/ordinal commitment is checked
before reclaim. B2 does not persist that PII-bearing plan. The future workspace
must provide bounded transient retention or a reviewed re-upload artifact. Loss
of this artifact cannot justify silently regenerating a different plan.

Resume intentionally does not compare the pre-import snapshot against the run's
own writes. Successful immutable outcomes replay unchanged; missing outcomes
execute remaining rows in dependency order with fresh DB checks. Unexpected
failures roll back the whole batch and leave the run recoverable, rather than
immediately marking it failed. Empty heartbeat batches make liveness explicit.

Stable refs retain Business + source system + source account + type + external
ID. Same-run replay checks commitment before returning its original result.
New-run reuse checks unchanged source hash and live tenant-scoped target, then
updates only last-run/last-seen metadata. Changed source or stale target blocks.
There is no DELETE/reinsert retargeting or operational UPDATE policy. Missing
external IDs never receive fabricated durable identity. Assignment idempotency
uses actual endpoint pairs; an existing pair records SKIPPED, not a false CREATE.

One bounded batch atomically contains operational rows, refs and immutable
outcomes. Controlled dependency/identity/money/quota/overlap failures may record
BLOCKED; unexpected errors rethrow and roll back all rows in that batch. Finish
requires full outcome coverage unless explicitly aborted. All-success/skip is
completed; mixed blocked/success is completed_with_errors; all-blocked or abort
is failed. Terminal retry always creates a new run.

## Safe operational results

Locations: active, non-default, exact reviewed slug, row timezone or source
fallback, unchanged source address in address_line1, no invented address parsing.
One settings row copies Business booking defaults; exactly seven CLOSED hours.
No segments, resources, implicit Services or Staff.

Services: one Business catalog row with exact name/duration/price, primary
Location and primary offered-at mapping. Active/internal, online_booking=false,
commercial_settings_reviewed=false. Unknown tax/deposit columns are omitted;
readiness distinguishes their inherited DB defaults from reviewed commercial
truth. Additional mappings are explicit only.

Readiness is enforced by a DB trigger on normal Service INSERT/UPDATE. Either
online_booking=true or booking_visibility=online fails while unreviewed. Existing
catalog rows are grandfathered as reviewed using a temporary ADD-column default
true followed by final DEFAULT false; this preserves accepted behavior without
rewriting their updated_at timestamps. Normal explicit Service creation marks
its configured settings reviewed. Editing an imported Service does not do so
automatically: the existing editor exposes an explicit tax/deposit confirmation.
The action translates the controlled error to safe product wording. Internal
appointment references remain usable. B2 schema is a prerequisite for deploying
these new Service writes; no hosted deployment acceptance is claimed here.

Staff: active employment, primary/home fields agree, primary works-at mapping,
no Auth identity and all three public-booking flags false. The existing seed
trigger creates seven hours; the governed transaction immediately closes all
seven, and never double-seeds. Ordinary Staff seed behavior remains unchanged.
Explicit Staff-Service and additional Location assignments only. Existing quota
triggers are authoritative.

Customers: required normalized valid email, exact normalized tenant match may
LINK only with compatible name/known phone; ambiguity/conflict blocks. A short
SHARE ROW EXCLUSIVE customer-table lock for customer-containing batches waits
for in-flight ordinary customer writers before normalized identity checks. This
is deliberate bounded cross-tenant customer-write contention (maximum 50 rows),
not a global normalized-email schema redesign. Existing case-variant duplicates
are reviewed; future ordinary writes retain their existing uniqueness policy.
No consent, invitation, Auth user, email or SMS is inferred/created.

Appointments: future, normalized UTC, explicit canonical status, all five
resolved references, actual offered-at/works-at/provides rows. Relationship locks
prevent concurrent deletion. Closed imported Location/Staff hours deliberately
do not reject an already-existing source booking. The existing staff-wide
half-open overlap exclusion remains race-safe authority.

Only EXACT, matching Business/source currency, nonnegative integer minor units
and int32-representable total are written. Paid/refunded/discount must be zero;
deposit <= price+tax. Exact price/tax/deposit are persisted independently of
catalog price, with explicit paid/refunded/discount zero and deposit_required
iff deposit>0, otherwise unpaid. NONE/unreconciled/reconciliation rows block.
No import_unreconciled, invoice, payment or refund is fabricated.

The import dependency graph never calls/imports createBooking,
resolveBookingFinancials, emitBookingEvent, reminder enqueue or provider paths.
Direct INSERT produces no appointment.created event, job or send intent. Negative
source tests and zero-job/send-intent PostgreSQL assertions cover this boundary.

## Validation and limits

Final local evidence:
- B2 migration SHA-256: `0f051b80fbdca7e199b8382e7d400785d408d73c6799beba17de0591c79c6062`.
- PostgreSQL **17.11 (Homebrew): 31 tests PASS**, 9.220 seconds.
- Six actual contention scenarios PASS with observed `pg_blocking_pids`: one
  begin winner, appointment overlap, normalized customer link/conflict, ordinary
  Location final seat and ordinary Staff final seat. Also validates UTC/Toronto
  fingerprint parity and direct anon/authenticated denial of every writer RPC.
  A seventh controlled interleaving proves import-first customer FK compatibility
  with no deadlock: Business NO KEY UPDATE permits ordinary FK KEY SHARE before
  the customer-table lock. Competing imports and owner/quota changes still serialize.
- Focused application/regression suite: **14 files / 202 tests PASS**. Includes
  Package A's unchanged 107 tests, B2 plan/server/auth/no-send tests, Service
  readiness, catalog and Stage 1C dialog/slug and quota regressions.
- Full repository suite: **149 files PASS, 1 FAIL, 1 skipped; 1,452 tests PASS,
  1 FAIL, 36 skipped**. The one unchanged baseline failure is detailed below.
  Initial sandbox Chromium launch failure was resolved by approved local rerun.
- Changed-file ESLint PASS; typecheck PASS; production build PASS; diff-check
  PASS. Initial sandbox build could not download existing Google Fonts; approved
  network-enabled local build passed. Existing middleware deprecation and Node
  localStorage warnings remain non-blocking.

The PostgreSQL harness creates a fresh private temporary cluster, disables TCP, uses psql -X and
a minimal credential-free child environment, and cleans up. It applies exact B1,
Staff quota and B2 bodies to a source-derived operational subset with real Staff
seed, relationship/tenant, Location quota and appointment exclusion guards. It is
not a complete hosted Supabase schema replay. Its synthetic RPC commitments are
complemented by application tests of Package A → B2 → server integration.

The unrelated full-suite Summer marketing failure is reproduced in isolation:
`tests/unit/marketing/multi-business-selection.test.ts:60` expects a discovered
business field which the unchanged current helper omits. That test and all its
runtime dependency files match the exact base. It is not silently waived or fixed
by this import package; full-suite status remains FAIL.

Staging NOT touched. Production NOT touched. GVM NOT touched. HQ NOT touched.
No real source files/customer data, hosted migration, merge, provider action or
protection/config change. Runtime manifest remains unchanged because this task
changed no hosted runtime. Hosted synthetic workflow acceptance is NOT RUN.

## Exact next gate and execution truth

Codex implementation and supporting Codex source/test review executed. Supporting
review is not Claude's independent audit. Control Tower must reconcile the exact
Draft PR HEAD and dispatch Claude for a fresh Level-3 **candidate** audit; the
older architecture audit does not replace it. No executable Claude channel is
available here: audit is BLOCKED ON MANUAL DISPATCH, with no accepted/run/result
evidence. Darshan/Control Tower must provide the final report's immutable prompt
and exact candidate to Claude. Safe code review can continue; hosted apply cannot.
Momentic/browser remains PLANNED / NOT DISPATCHED for later synthetic hosted work.

After independent audit: separate PO Staging-apply decision → synthetic hosted
acceptance → separate merge decision → later Production B1/Staff/B2 prerequisites
and a separate Production rollout decision. No step is implied by local tests.
