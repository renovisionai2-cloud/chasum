# #133/#158 connected Staging backend validation V2 — prepared only

Status: **PREPARED_ONLY_NOT_RUN**. Classification: **LAUNCH REQUIRED**.
BUILD NOW means this package only. There is no hosted execution authorization.

Competitive Product Gate: **ALREADY SATISFIED FOR THIS CONTRACT / NO NEW RESEARCH REQUIRED**.
The applicable checkpoint is `docs/reviews/issue-134-booking-deposit-competitive-gate.md`.

## Immutable authoring baseline and accepted prerequisites

Repository `renovisionai2-cloud/chasum`, branch `codex/issue-133-projection-observability`.
Authoring HEAD `51f7c3ab77fa91810454bebb77ea1479ced119ee`, tree
`bae891c8e4b38a20c164feead0ab17e0d02a91eb`. The worktree was clean before authoring.
Only the seven paths authorized for this task may change.

The current board and latest handoff supersede historical prepared/unapplied wording:
#158 LOCAL_DATABASE_PROOF_6_ACCEPTED and ISSUE158_STAGING_SCHEMA_APPLICATION_ACCEPTED;
#133 SLICE1_DATABASE_PROOF2_ACCEPTED, ISSUE133_STAGING_PREFLIGHT_ACCEPTED_FOR_APPLICATION_GATE,
and ISSUE133_STAGING_SCHEMA_APPLICATION_ACCEPTED. None is reopened or rerun.

The exact hosted chain is pinned in `manifest.json`: Foundation `20261005032107`,
R1a `20261005170446`, Attribution `20261007170242`, #158 `20261009035548`,
#133 `20261009133204`. For each, preflight requires one matching version/name,
one statement, exact statement bytes and SHA-256. Local source paths/hashes are
also pinned; this package contains no migration application or ledger write.

Both backends remain unwired/default-off. This package is the first proposed
connected hosted behavioral gate; installation and offline tests are not behavioral acceptance.

## Run identity, members and deterministic seal

The sole proposed run is `HV133-158-20261009-C02-5776d6c8`, targeting only
`wnfahklzaxirftyskctd`. The fixed HTTPS Management query and project-metadata routes
and Auth Admin create-user route all use that exact ref. No target override exists.

Executable-package inventory:

- `PLAN.md`
- `fixture.json`
- `hosted_validation.py`
- `tests/test_hosted_validation.py`
- `manifest.json` (seal envelope)

The first four are content members: their exact bytes and SHA-256 are in
`manifest.members`. `manifest.package_files` enumerates all five. The envelope
cannot contain its own raw hash/size without a self-reference cycle. Its identity
is instead the aggregate: remove only `aggregate_sha256`, serialize the remaining
manifest object as UTF-8 JSON with sorted keys, no insignificant whitespace,
`ensure_ascii=False`, then hash the bytes of
`CHASUM-CONNECTED-STAGING-v1` + one LF + that canonical JSON. The envelope's raw
bytes/SHA are reported externally in the delivery report. All metadata, source
pins, function contracts, run ID and four content hashes are bound by this seal.
Supporting review and changelog are outside the execution package.

Any member/source drift, wrong hash, run, target or reused evidence directory
refuses execution. A changed fixture requires a new reviewed package identity.
Do not reseal to conceal a failed run or change accepted expectations.

## Bounded synthetic case

ONE new normal Business: Velunora 5776d6c8 Governed Synthetic. All emails and the
website use `.invalid`; the phone is a fictional 555-01xx number. No real contacts.
The fixture supplies six unique UUIDs: existing customer, service, staff, booking
operation, attempt key and an uncreated nonmember actor for read-only negatives.
The accepted APIs generate the Auth owner, Business/default location, attempt,
appointment, transaction and projection document IDs. Capture each exactly once;
never replace those IDs or retry creation after uncertain responses.

One existing synthetic customer, one normal location/settings/hours, one staff
member with normal hours and service/location assignments, one service:
CAD100 subtotal, zero tax, CAD50 required deposit. Stable canonical vocabulary:
`booking_sheet`, `deposit` payment mode/kind, `e_transfer`, `manual`, `cad`.
No package, room, resources, discount, refund, optional staff or provider tender.
Fixed booking: 2026-11-18 15:00–16:00 UTC (10:00–11:00 Toronto). Preflight rejects
execution within one hour of the start or later. Expiry requires a new reviewed
fixture, not runtime date/key rotation. This proves backend persistence, not UI
availability or a complete scheduling-engine workflow.

## Future authorization and execution guard

Do not run now. Independent review and Darshan's separate exact-package/run
execution authorization are required. Before any authorized invocation, retain
external evidence that no app client, worker or operator will write to the new
fixture Business during this run. Do not log in as the fixture owner, publish its
slug, or start a worker. The new owner has an opaque random password held only
in memory during the create-user request; no login/session/invite occurs.

In a future authorized process only, an operator supplies Staging-scoped
`HV133_STAGING_MANAGEMENT_TOKEN` and `HV133_STAGING_SERVICE_ROLE_KEY` through the
process environment. No credential files, `.env`, passfiles or CLI config are read.
Do not put secrets in argv, shell history, output or audit files. No credential
access is performed during preparation, import, help or refusal checks.

Future command shape (not an instruction or authorization to execute):

    python3 docs/validation/issue-133-connected-staging-v2/hosted_validation.py \
      --execute --package-sha <independently-approved-aggregate-sha256> \
      --run-id HV133-158-20261009-C02-5776d6c8 \
      --project-ref wnfahklzaxirftyskctd --writer-quiescence-confirmed

There is no resume, automatic retry, phase skipping, cleanup, alternate project,
worker invocation, provider endpoint or transport fallback. HTTPS certificate
verification is mandatory. Proxy inheritance and redirects are disabled; requests
are limited to 45 seconds and 4 MB replies. SQL lock timeout is 5 seconds,
statement timeout 30 seconds (15 seconds for authorization negatives).

## Exact future phase order and evidence

1. **First hosted operation: zero-write SQL preflight.** REPEATABLE READ READ ONLY,
   terminal ROLLBACK. Confirm exact hosted chain, catalog function body/signature,
   definer/invoker/search_path/owner and browser/service execution posture; required
   column write privileges and table SELECT privileges; fixed identity collision
   checks including conservative business/location phone, email, website/subdomain,
   legal/trading name + city/region and alias matches. Require communication tables,
   no pg_cron relation and no enabled dispatch-shaped triggers on relevant tables.
   Confirm the six-attempt/16-obligation retained census and zero operations,
   admission, operation links and receipt sequences. Any unknown/missing value stops.
2. Before Auth mutation, separately probe literal `service_role` in READ ONLY SQL
   and require `current_user=service_role`, `transaction_read_only=on`. The Management
   transport uses `read_only:false` because its alternate restricted role lacks
   required inspection privileges; SQL explicitly enforces READ ONLY. Verify project
   metadata independently via fixed Management GET: exact ID and ACTIVE_HEALTHY.
   A present contradictory database project GUC aborts; absent GUC is not identity proof.
3. Create one confirmed synthetic Auth owner through fixed Auth Admin, with no send
   endpoint. Independently verify its SQL identity, zero sessions/memberships.
4. One service-role transaction calls `decide_business_identity(create_new,...)`,
   demands `created`, disables notification/marketing/public-booking flags and clears
   notification recipient, then provisions the minimum parents. It requires the normal
   seven business hours, seven location hours, one settings row and seven staff hours.
   Any ambiguity/failed seed rolls this transaction back. The separately-created Auth
   owner may remain after failure: retain it; do not delete or create a replacement.
5. Capture fresh repeatable-read counts + SHA-256 of **full rows** in all 14 financial
   tables required by the contract, communication tables and parent/mapping tables.
   Ordering uses row JSON text under C collation. Exclude only the new Business (or
   joined children of its parents). Require equality with the zero-write baseline.
   Thus retained rows with unchanged counts but changed values cannot pass. No existing
   tenant rows or PII are output: only counts/digests. Synthetic full rows may be retained.
6. Prove all synthetic financial arrays empty, no owner sessions/other memberships,
   no other admission, zero tenant communication rows, no customer/provider references,
   and contained Business flags. An activity query checks visible SQL targeting the
   Business/actor. This is a point-in-time supplement, not proof against future hidden
   writers; the external quiescence attestation remains mandatory throughout.
7. Call only `set_payment_projection_admission_v1(B,true)`. Retain returned Business,
   enabled=true and server watermark. No direct admission DML/backdating is permitted.
8. Bootstrap → persist → bind with the exact source signatures/argument order recorded
   in the manifest. Require ADMITTED → CREATED → BOUND, same stable identities, one
   REQUESTED/RECOVER attempt, one appointment, no money/obligations/projections, one
   REQUESTED event. Attempt creation must be strictly later than the server watermark.
   Read both canonical readers; #133 must say PAYMENT_RECOVERY_REQUIRED.
9. Commit only the bound attempt via `commit_booking_operation_manual_payment_v1`:
   RECORDED, recorded=true, one ACCEPTED attempt and manual CAD50 transaction, four
   PENDING obligations and exactly REQUESTED/ACCEPTED events. #133 reader must say
   RECORDED_BUT_NOT_FULLY_SYNCHRONIZED. No cache/document inference substitutes for ledger.
10. Invoke appointment_cache → invoice_settlement → customer_payment_events → receipt,
    explicitly, without a worker. Each must return APPLIED/COMPLETE for the same IDs.
    Recheck containment and non-synthetic baselines after every projector.
11. Verify cache paid5000/refunded0/deposit_paid while price10000/tax0/deposit5000 are
    unchanged. One INV-0001 partial invoice: subtotal10000/tax0/total10000/paid5000/
    refunded0/balance5000, one coherent line; canonical transaction links to it. One
    exact CRM ledger mirror. One RCT-0001,5000,cad,e_transfer,not_sent,emailed_at NULL,
    **invoice_id NULL** by the accepted independence contract. Both sequences next2.
    Four COMPLETE obligations, four projection events (six lifecycle/events total).
    #133 reader RECORDED; #158 reader resolves the same operation/attempt/appointment/
    ledger. Reject forbidden PII/provider-internal reader fields.
12. **Deliberate successful-path idempotency probe**, not retry after failure:
    same bootstrap/persist/bind identities return EXISTING, same commit REPLAY/PENDING,
    same four projectors VERIFIED/COMPLETE. Compare full synthetic financial arrays
    and canonical SHA before/after; document counters/events/targets must be byte-stable.
13. Nonmember UUID calls both readers in READ ONLY transactions. Only 42501 denial is
    expected; no existence detail is accepted. No second tenant or Auth user is created.
14. Re-read final canonical truth, then setter(B,false). Require same watermark,
    enabled=false, exactly the one synthetic admission row and no others. Reconcile
    all retained digests and synthetic financial rows, excluding only the intended
    admission-row disable transition from the synthetic byte-stability comparison.
15. Retain all synthetic parents, financial records and disabled admission for audit.
    No deletion, truncation, sequence reset, renumbering or history repair.

## Communications/provider isolation and limitations

No application action or notification bridge is called. Fixed network destinations
allow only Staging Management and Auth Admin, not Stripe, banking, email/SMS or worker
routes. Tenant-scoped background jobs, follow-ups, send intents, communication audit,
logs/history, notifications, calendar connections and webhook endpoints must stay zero.
Existing external-event rows are also included in retained digests. Receipt remains
not_sent. This manual E-Transfer records an operator assertion; it does not verify a bank.

No source regex can prove the absence of every indirect, externally configured trigger
or future writer. Catalog/source checks, normal-fixture isolation, flags, fixed transport,
zero side-effect snapshots and the operator-maintained quiescence gate work together.
Unknown deployment drift is a STOP, not authority to change ACLs/schema/configuration.
The package does not disable platform-wide infrastructure or inspect stored secrets.

## Single-shot failure and retention

Before dispatching the first Auth write, mark mutation possible. A timeout, truncated
response or lost reply after that point is STOP_AFTER_WRITES, even if commit is unknown.
Before then: STOP_ZERO_WRITES. Stop labels and last phase are recorded without raw
HTTP error bodies or credentials. No automatic rerun, key rotation, tenant replacement,
repair, cleanup or even finally-block admission disable follows a failure. If failure
occurs after enable, admission may remain enabled: keep external workers held and seek
separate governed containment/reconciliation. A later run needs fresh identities,
reviewed package binding and PO approval. Do not reinterpret the intentional positive
replay phase as permission to retry failed writes.

Future evidence directory is fixed in the manifest, outside Git. Exclusive creation
prevents overwriting/reusing a run. JSONL records are append-only, fsynced, mode600,
in a mode700 run directory, with sequence, previous-record SHA and observed timestamp.
No execution timestamps are authored now. Known credentials are redacted. Raw synthetic
responses/snapshots, source/hosted metadata, retained digests, replay digests and final
reconciliation are retained. Protect the evidence store with governed access/retention;
copy it with checksums to the approved durable operations store after the future run.
Do not commit hosted evidence or credentials into this package.

## Offline checks and later gates

Allowed preparation check:

    PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
      -s docs/validation/issue-133-connected-staging-v2/tests -v

Tests use in-memory fake responses for orchestration and failure injection, standard
library unit checks for SQL construction/source signatures/fingerprints, safe help/
refusal, and temporary fictional evidence files. They do not execute SQL, validate live
ACLs, contact Auth/Management, run a positive CLI invocation or claim database proof.
No accepted local proof is rerun. Live schema/body/grant compatibility is checked only
by the future zero-write gate; a mismatch stops before fixture creation.

This validates ONLY the connected backend chain. It does NOT establish Booking Sheet
or Quick Appointment responsive UI acceptance; desktop/tablet/mobile workflow acceptance;
worker/claim-loop behavior; communications; provider behavior; #153 closure; Reporting/CRM
runtime cutover; Production; GVM; or technician resumption. Those remain separate gates.

**HOSTED V2 VALIDATION WAS NOT RUN.**

## C01 preservation and narrow V2 diagnostics

C01 is immutable historical STOP_ZERO_WRITES evidence, not a candidate for retry:

- Candidate: `75f511c13205040cd1d0ccb4272cbbb821c06232`.
- Aggregate: `2a212324eae2b610f7dda105931d78deef9bf02826507c1c4361d59a5d705090`.
- Run: `HV133-158-20261009-C01-72d9f02a`.
- Evidence SHA: `a16c19aed6778ea76789f6d35e263f140611148aae6074ccade548369b745ab8`.
- Evidence: `/Users/darshan/chasum-evidence/issue133-connected-staging/HV133-158-20261009-C01-72d9f02a/evidence.jsonl`.

The original directory and evidence must never be overwritten, deleted or reused.
The supplied six-record result proves successful SQL preflight and literal service_role
READ ONLY probe, followed by an opaque project-identity transport stop. The accepted
post-stop reconciliation found zero fixture/admission mutation and unchanged retained
financial state. There is no unknown money outcome. The original evidence cannot identify
401/403/429/5xx, timeout, TLS or other network failures; V2 makes no retrospective diagnosis.
The source-of-truth documentation confirms GET /v1/projects/{ref} is a valid endpoint.

V2 retains that independent gate. Only errors for the fixed zero-write project metadata
GET gain allowlisted diagnostics. Codes distinguish HTTP_401, HTTP_403, HTTP_429, HTTP_5XX,
TIMEOUT, TLS_ERROR, NETWORK_ERROR, INVALID_JSON, WRONG_PROJECT and UNHEALTHY (each prefixed
PROJECT_IDENTITY_). Other HTTP status becomes HTTP_OTHER; a rejected redirect, oversized
response or inconsistent transport response becomes RESPONSE_REJECTED. Valid JSON of the
wrong structural type also becomes INVALID_JSON. These are bounded categories, not copied
remote text. Classification uses only integer status or exception types, including typed
URLError reasons. Text-only URLError reasons stay NETWORK_ERROR; no message parsing.

On failure evidence contains status=STOP_ZERO_WRITES, last_phase=project-identity,
reason_code=<allowlisted code>, admission_may_remain_enabled=false, automatic_retry=false.
No body, headers, cookies, token, account information or raw exception string is retained.
The successful response still exposes only the verified fixed ID and ACTIVE_HEALTHY.
All Management SQL/Auth failures retain the original opaque behavior. Timeout/size limits,
GET/Bearer Management-token binding, HTTPS verification, proxy/redirect refusal and fixed
endpoints are unchanged. No retry, alternative transport or credential rotation is added.

All commercial, tenant, admission, booking, projection, reader, replay and retention code
is carried forward unchanged; offline tests compare its source to C01. V2 uses fresh
identities and the same fixed future slot with the existing one-hour expiry gate. No date
rotation occurs at runtime. Independent review and fresh exact-run PO approval are required.
