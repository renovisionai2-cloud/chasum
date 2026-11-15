# Slice 2B D1 — local implementation and proof delivery

Disposition: **LOCAL_PROOF_INCOMPLETE**. The new migration and all constructible proof cases are ready for independent review in a Draft PR. This is not a hosted-application or release approval. D09's actual maximum-revision successor and C09's unauthorized membership downgrade remain NOT_PROVEN for the precise reasons below.

## Immutable inputs and scope

- Base: `35dd307986c36bb9a5c3a4847e4a212e8dce9fde`
- Base tree: `aaaf5be03e16a23265af2f0bd8e8fb9b27fdbb99`
- Sole parent: `233a2bebc5a4e4a8a787eccbb4b99a7769de0172`
- D1 SHA-256: `0caf4f79ce43088520313728b4d3cd77758b0aa066f8f2f776f4714f9ebff6ed`
- Migration: `supabase/migrations/20261013201608_issue_134_slice2b_lifecycle_amendment.sql`
- Migration SHA-256: `36d197d50dfa9560f58457cc65c7bfe7df39b97cbd8e584598b57f117b90ffe6`
- Branch: `codex/slice2b-d1-lifecycle-sql-pg17`
- Worktree: `/private/tmp/chasum-slice2b-d1-lifecycle-sql-pg17`
- Final run: `20fe24d4-c538-40f4-846c-332a6303b0a4`

Only one new migration, the new disposable runner, helpers under its authorized directory, and this sanitized evidence directory are changed. No original migration, application source, release control, accepted design, prior proof script, or package file changed. The previously stopped implementation worktree was not read or reused.

The amendment adds the approved revision/journal, five v2 RPCs, paired guards and the compatible v1 close adapter. It leaves bootstrap/persist/bind/commit/read, financial guards, projectors and the existing privileged STABLE slot validator unchanged. All new writers use INVOKER, a pinned path and service-only entry. Existing table grants/RLS are not widened. Three integrity triggers are ALWAYS. Assertions fail closed on incompatible catalog/role posture rather than fixing platform grants.

## Reproduce locally

Prerequisites: PostgreSQL 17 Homebrew binaries at `/opt/homebrew/opt/postgresql@17/bin`, Node, Python3. Run from this candidate checkout:

    node scripts/verify-issue134-slice2b-lifecycle-disposable-postgres.mjs --confirm-disposable-local

The runner has no hosted target option. It initializes a new private cluster, disables TCP, rejects host authentication, uses a unique protected Unix-socket directory, scrubs inherited connection variables, verifies postmaster/database identity before SQL, loads unchanged source dependencies and creates only new synthetic identities. It stops its cluster in finally. It does not run a historical proof harness. PostgreSQL 17.11 and Node 26.7.0 were used for the final run. Fresh empty prerequisite cloning is local to that run, not historical fixture reuse.

Default privileges/API roles are deliberately modeled, including non-superuser service_role with BYPASSRLS. This is **not hosted Supabase equivalence**. A hosted environment with operational TRUNCATE, schema CREATE, role escalation, incompatible owner/ACL or validator drift is expected to fail this amendment's preflight and requires its own governed review.

The generator is an authoring helper for this one migration, not a second migration or executable hosted repair. Re-generating must preserve the accepted D1 input hash and be followed by a new proof if any bytes change.

## Evidence layout

- `final/summary.json`: executed statuses, source hashes, protected hashes, local identity, stopped state and side-effect counts.
- `final/observations.jsonl`: synthetic rows/results, ordered preservation digests, real session PIDs/xid8, dispatch/completion chronology, blocking locks, SQLSTATEs and concurrency outcomes.
- `final/*catalog.json`: full before/after/final local function/trigger/constraint/policy/role and lifecycle relation definitions.
- `runs/<run-id>.zip`: complete original raw outputs of every run, including failures. Each archive contains `MEMBER_SHA256.json`. All original members were byte-verified before redundant loose copies were removed.
- `run-index.json`: every archive hash/size, failure status and migration identity. Nothing was silently dropped or relabeled after a failed run.
- `static/`: syntax, lint, release-control and fixed-validator source inventory.
- `FILE_SHA256SUMS`: hashes of packaged evidence files, excluding itself.

No actual customer rows, hosted sessions, keys or provider tokens are included. UUIDs and contacts are freshly fictional. Local machine paths/username are infrastructure evidence, not a claim about Supabase owners.

## Proof matrix

PASS here means **LOCAL_RUNTIME-PROVEN in this disposable model**, bounded by the cited witnesses. It never means hosted acceptance or application recovery normalization.

| Group | Result | Evidence scope |
|---|---|---|
| D01 | PASS | Original real bootstrap/persist/bind/commit; service/package metadata, zero price, admitted empty/one/multiple resources, revision zero |
| D02 | PASS | Status progression, deliberate correction, no-show, configured skip, past/inactive-catalog notes/status; target misuse refused |
| D03 | PASS | Before/after commit cancellation, one fence, retained money, repeated NO_CHANGE, actual KEY SHARE compatibility, cancelled edit refusal and stale fence HOLD |
| D04 | PASS | Reschedule/resize/staff/Location/room/resources; field restriction, self-exclusion/other conflict, :30 and Toronto fall-back instants |
| D05 | PASS | Staff price override never reprices; explicit duration coupling/null/zero/negative; buffers; qualification/foreign Location; numeric price/tax/deposit/package incompatibility; notes bounds |
| D06 | PASS | First/repeated/admin correction; original identity retained; original/later/legacy/failed/refunded/foreign refund vetoes; stale metadata not a permit |
| D07 | PASS | REQUESTED HOLD, financial projection PENDING/FAILED and all four COMPLETE projector states; no reset/recollection |
| D08 | PASS | Linked DELETE by service/authenticated across states; actual Business cascade reached retained-history guard; separate legacy Business characterization and rollback |
| D09 | NOT_PROVEN (one subcase) | 0→1→2, reset/skip/MAX assignment refusal, malformed xid/actor/tenant/link/attempt/command/image/field/revision, same-xid keys and permit reuse proven. Actual successor at a legitimately reached INT64_MAX is not runtime-proven |
| D10 | PASS | Exact resource deltas, direct DML/reparent refusal, missing/extra delta rollback, RI child-owner principal, hidden parent refusal and disabled-guard preflight |
| D11 | PASS, local only | Catalog/ACL/RLS/ALWAYS, real non-superuser owner-escalation refusal, DDL/parameter/TRUNCATE denial, preserved validator identity/dependencies, post-wait observations |
| D12 | PASS | All five v1 reasons, creator-only semantics, mismatch/fences/terminal money, repeated CLOSED customer correction remains a real effect |
| D13 | PASS | Journal/child/parent/cache/final-assert injections, actual 55P03/57014, whole-transaction rollback, migration final-assert rollback |
| D14 | PASS, SQL scope | Abrupt client loss before COMMIT rolls back; committed response-loss replay and old-key after later revision; actual original-attempt UNKNOWN behavior |
| D15 | PASS, SQL scope | No source side-effect integration; local jobs/logs/notifications/calendar/waitlist/webhook inventory remains zero |

D12-E, D12-F, D14-E, D14-F, D14-G: **PASS**. Actual reader DTOs are captured; no invented `binding_valid`/`appointment_valid` export. A separate actual R1a payment demonstrates original-attempt ledger count zero while appointment money is positive. Distinct direct-refund and transaction-linked axes are retained, never netted to zero to authorize correction.

C01–C08, C10–C11: **PASS**, real independent psql sessions. Both winner orders are exercised where required; C10 uses three sessions. C11 includes actual bounded 40P01. Same-name resource contention demonstrates the inherited soft limitation: different staff may concurrently claim overlapping resource intervals; no new hard reservation guarantee is claimed.

C09: **NOT_PROVEN for unauthorized-role downgrade only**. Membership deletion and owner transfer passed in both orders. The unchanged `business_members_role_check` admits only owner/admin, both authorized here. An attempted employee downgrade actually failed 23514 in the preserved earlier run. No constraint was relaxed to fabricate the case.

D09's overflow successor is SOURCE-PROVEN through the explicit pre-addition guard. A legitimate current revision of 9223372036854775807 cannot be built in bounded time without bypassing integrity; direct MAX assignment is refused. This subcase is not labeled PASS.

## Financial and recovery boundaries

Ordered digests cover operation, attempt, events, all ledger/refunds, obligations, invoices and receipts around maintenance/rejection/replay. Sanctioned fences are verified separately: REQUESTED→FAILED and one event; money remains unchanged. Whole parent/resource/operation/attempt after-state is asserted. No lifecycle command collects again or creates invoices/receipts. Explicit synthetic payments/projector calls are fixture/compatibility witnesses with separate baselines, not lifecycle side effects.

Original commit_v1 after customer correction returns inherited UNKNOWN/recorded=false; that is HOLD, never whole-appointment zero. Non-original admin read_v1 found:false is not absence. Observability is attempt-scoped. Replacement close metadata can drift under existing guards; the test characterizes that constructible limitation and proves it cannot authorize a direct correction. Original immutable identities and all real constraints are retained.

## Failures and limitations retained

All iteration failures remain in the run archives. They include fixture/SQL-harness errors (argument order, deposit admission mismatch, missing required email/location, reserved alias, assumed reconciliation id), session cleanup double-close, the unconstructible downgrade, and an incorrect buffer test oracle. The buffer oracle was corrected to the protected validator's actual proposed-interval behavior; its body was not changed.

One implementation defect found by expanded digest checks was corrected: repeated no-appointment close had changed operation.updated_at. The final implementation returns EXISTING without writing in that case. A newly added dependency posture assertion initially assumed SQL-language helpers were plpgsql; it was corrected to their exact source languages and then passed. No failing result was relabeled as passing.

The final run has zero harness failures and a stopped cluster. The two NOT_PROVEN subcases remain visible; therefore the conservative overall disposition remains LOCAL_PROOF_INCOMPLETE, not a blanket all-proof PASS.

## Validation and remaining gates

Local new-JavaScript syntax, Python in-memory compile and changed-file ESLint: PASS (zero lint errors/warnings; shared dependency tooling emitted its React auto-detection environment notice). Release-control config: PASS. No application build/typecheck or full application suite was run locally for this SQL-only change; GitHub CI on the exact Draft PR supplies its own separate evidence. No old proof suite was rerun. CI results belong in the delivery report and PR status, not assumed here.

A1/A2 trusted appointment-wide evidence composition, UNKNOWN/HOLD UI labels, real emit/bridge/outer-delivery containment and application wiring: NOT_RUN / separately gated. #153 permission cutover, #132 follow-on release requirements, hosted Staging catalog/role validation and Production release: held. Technician deposits remain HELD. No automatic specialist dispatch.

Next: Darshan/ChatGPT reconcile the Draft PR and manually dispatch Claude Level-3 implementation/proof review, explicitly adjudicating D09/C09 limits. No merge, hosted SQL application, provider/worker/communications activation or deployment is authorized by this package.
