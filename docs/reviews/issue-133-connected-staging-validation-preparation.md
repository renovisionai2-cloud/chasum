# #133/#158 connected Staging validation preparation

Status: **C01 EXECUTED THROUGH ZERO-WRITE PREFLIGHT ONLY / STOP_ZERO_WRITES / NO MUTATION / IMMUTABLE; NARROW V2 PREPARATION NEXT**.
Classification: **LAUNCH REQUIRED**. BUILD NOW: package preparation only.

## Authority and source reconciliation

Authoring branch: `codex/issue-133-projection-observability`.
Starting HEAD `c13fe6b39e0eb17b00300771c31a1337b2801945`;
tree `27afb2825cf900eec4c025df9b77e1699a5c2670`.
The worktree was clean before authoring. This delivery changes exactly the seven
user-approved package/report/changelog paths; no product, migration or runtime file.

The current project board and latest handoff establish #158 proof6/schema acceptance
and #133 proof2/preflight/schema acceptance. The two contract/implementation pairs,
#134 connected-runtime preparation and hosted-validation plans, and all three prior
R1a validation packages were reconciled. Earlier prepared/unapplied historical text
is not reinterpreted as current deployment state. No accepted proof was reopened.

Hosted prerequisites are the already-installed Foundation, R1a, Attribution, #158
and #133, pinned by exact versions/names/statement sizes/hashes in the manifest.
The source-backed function inventory uses the latest accepted definition: in particular
#133's replacement `commit_manual_payment_attempt_v1`, without changing #158's specialized
`commit_booking_operation_manual_payment_v1`. The source files themselves are untouched.

Competitive Product Gate: **ALREADY SATISFIED FOR THIS CONTRACT / NO NEW RESEARCH REQUIRED**.
Reference: `issue-134-booking-deposit-competitive-gate.md`. No new competitor research.

## Prepared deliverable

Package: `docs/validation/issue-133-connected-staging/`.
Proposed run: `HV133-158-20261009-C01-72d9f02a`.
Sole future target: `wnfahklzaxirftyskctd`.
The five-file execution package has four content-hashed members and a canonical
manifest seal envelope. PLAN documents the self-reference-free algorithm. The manifest
pins 25 relevant function bodies/signatures/security configurations and source privileges.
The final report supplies the raw manifest hash/size as external evidence.

The runner prepares a single new normal tenant using `decide_business_identity`,
one new synthetic Auth owner, one default location/settings/hours, one staff/service
assignment and one existing synthetic customer. It never selects the retained cohort
as input. Caller-owned UUIDs are pre-generated; server-owned IDs are captured once from
accepted APIs. Contacts use `.invalid`; the fixed fictional phone must pass the full
conservative identity-collision gate. An overlap produces STOP, not relaxed matching.

The exact connected chain is CAD100 service/zero tax/CAD50 manual E-Transfer deposit,
source `booking_sheet`, using bootstrap → persist → bind → canonical commit → four
explicit projectors → both canonical readers → exact successful-path replay → negative
reader authorization → explicit admission disable. No worker or application UI is called.

Commercial assertions cover unchanged appointment terms, recorded CAD50, four obligations,
INV-0001 partial/balance5000 with one line, transaction invoice linkage, one exact CRM
mirror, independent RCT-0001 invoice_id NULL/not_sent and both document counters at2.
Both readers must resolve the same identities with their accepted recovery/recorded states.
Synthetic arrays and pre-existing non-synthetic full-row digests are compared, not just counts.

## Safety and evidence controls

The first future hosted operation is read-only SQL with terminal rollback. Before any
Auth write, it checks the migration chain, function bodies/security/ACLs, required columns
and privileges, collision/containment dependencies, and the exact retained census. A
separate read-only probe requires literal service_role; fixed-route project metadata
independently confirms ID and healthy status. No alternate target/transport is offered.

Auth/fixture creation and all subsequent mutations remain unexecuted. Future evidence
uses an exclusive run directory, append/fsync JSONL, hash-linked records and credential
redaction. Existing rows appear only as deterministic count/digest aggregates; full
synthetic responses/snapshots are retained. Unknown/lost write responses stop as
STOP_AFTER_WRITES. There is no automatic repair, cleanup, retry, key rotation or finally
mutation. A failed run may leave admission enabled; external workers must remain held
pending separate governed containment. Successful completion requires persisted disabled
admission with the original watermark, retained fixture, and unchanged non-test digests.

## Offline validation and limitations

Offline checks: Python syntax/AST, JSON parsing, package/member/source sealing, source
signature and last-explicit-grant checks, SQL construction, 32 unit/static tests with
in-memory fake responses and failure injection, and Git whitespace/scope checks.
The tests trap network use in fake orchestration and trap credential-key reads for help/
refusal. No positive CLI execution, SQL execution, database process, credential probe,
Management/Auth call, accepted-proof rerun, or application build is part of this task.

Initial tests exposed an overbroad environment-read trap that also rejected argparse's
locale lookup. It was narrowed to credential keys while returning inert defaults for
locale/terminal lookups. Source review also corrected the draft's privilege inventory
against actual INSERT columns and the final GRANTs for Foundation trigger functions.
These are package-authoring corrections; accepted product source was not modified.

In-memory results prove package control flow/expected-response handling, not live PostgreSQL
semantics. Actual schema/function/catalog compatibility, tenant seed behavior, admission
watermark ordering, financial persistence and readers await the separate hosted gate.
SQL activity inspection is point-in-time; the operator's continuous writer/worker quiescence
attestation is required. Trigger source screening is not an exhaustive indirect-call proof.

The fixed fixture slot expires at the preflight's one-hour-before-start boundary. Any expired
fixture, unexpected trigger/ACL/schema, concurrent writer, retained-row drift or identity
collision must stop; a revised/repeated run needs new review and PO authorization.

No UI/responsive workflow, worker/claim loop, communications/provider behavior, #153 closure,
Reporting/CRM cutover, technician resumption, Production or GVM acceptance is claimed.

## Independent package audit and next governed action

Claude Opus 5 High independently audited this exact commit/seal and returned `CONNECTED_STAGING_PACKAGE_READY_FOR_PO_EXECUTION_GATE` with zero blockers and zero required corrections. The review accepted the exact seven-path scope, member hashes/sizes, canonical aggregate seal, source/function pins, zero-write preflight, network/credential containment, tenant provisioning, retained-cohort exclusion, writer-quiescence contract, admission lifecycle, #158 booking/payment sequence, #133 projection sequence, truth/privacy/replay oracles, communication/provider containment, no-cleanup behavior, evidence chain and all 32 offline tests.

The package is therefore ready only for Darshan's exact one-run execution decision: aggregate `2a212324eae2b610f7dda105931d78deef9bf02826507c1c4361d59a5d705090`, run `HV133-158-20261009-C01-72d9f02a`, target `wnfahklzaxirftyskctd`. **HOSTED VALIDATION WAS NOT RUN.** Continuous external writer/worker quiescence is a condition of execution. If execution ever returns `STOP_AFTER_WRITES`, the contract is preserve state/evidence, no retry/key rotation/cleanup/automatic admission disable, keep workers held, and seek a separate governed containment/reconciliation decision. Preparation, audit and a local commit authorize no hosted execution. No push, PR, merge, deployment, credential read, Staging/Production write, admission change, fixture creation or communication occurred.


## C01 actual execution result — STOP_ZERO_WRITES

Darshan approved exact aggregate `2a212324eae2b610f7dda105931d78deef9bf02826507c1c4361d59a5d705090`, run `HV133-158-20261009-C01-72d9f02a`, target `wnfahklzaxirftyskctd`. The runner created the exclusive evidence directory and recorded six valid hash-linked entries. Zero-write SQL preflight passed with the exact protected migration chain, source-backed function/security posture, privileges, collision checks, future slot, retained census and deterministic retained baseline. Literal service_role READ ONLY capability also passed. The next phase, Management `project-identity`, stopped with `STOP_ZERO_WRITES`; reason is intentionally opaque `transport failure; response may be lost; no retry`, and `admission_may_remain_enabled=false`. Evidence file SHA-256: `a16c19aed6778ea76789f6d35e263f140611148aae6074ccade548369b745ab8`.

Fresh native read-only reconciliation after the stop found zero fixture Auth owner/Business/customer/service/staff/booking-operation/attempt-key rows, zero projection-admission rows and unchanged retained census 6 attempts / 16 obligations / 15 PENDING / 1 NOT_REQUIRED. Accepted attempt/event/transaction digests remain unchanged. Therefore C01 created no synthetic or financial state and has no unknown money outcome. The C01 run ID is nevertheless consumed because its evidence directory exists and the package is intentionally single-shot. Do not rerun, overwrite or delete it.

Supabase's current Management API reference confirms `GET /v1/projects/{ref}` is a valid read-only endpoint. Because the approved runner intentionally collapses HTTP/network failures to an opaque transport error and stores no response body/status, C01 evidence cannot distinguish HTTP authorization/scope, rate-limit/service error or lower-level transport failure at that phase. Next safe work is a narrow prepared-only V2/new-run package that preserves the accepted financial/containment contract while making zero-write project-identity failure classification auditably specific without storing remote bodies or credentials. No hosted write is authorized until that new package is independently reviewed and Darshan separately approves it.
