# #133/#158 connected Staging backend validation V3 — prepared only

Status: **PREPARED_ONLY_NOT_RUN**. Classification: **LAUNCH REQUIRED**.
BUILD NOW means this package only. There is no hosted execution authorization.

Competitive Product Gate: **NOT_APPLICABLE to this internal access-gate/package correction**; no customer or
operator behavior changes. The inherited product contract remains unchanged.
The applicable checkpoint is `docs/reviews/issue-134-booking-deposit-competitive-gate.md`.

## Immutable authoring baseline and accepted prerequisites

Repository `renovisionai2-cloud/chasum`, branch `codex/issue-133-projection-observability`.
Authoring HEAD `72be50fd93bd3f4dca4be97cfc01c72d01fc7f49`, tree
`63128196547ab52acebec5f0321a1e30e32922a4`. The worktree was clean before authoring.
Parent `cf1a03cc90f0ec207875fe585ecf9499ea3c46f5`. Only the five new V3 package
files and its preparation report may change. No remote main/runtime query is authorized;
local cached origin/main is a dated observation, not fresh remote verification.

The current board and accepted [#133 implementation review](../../reviews/issue-133-projection-observability-implementation.md)
supersede historical prepared/unapplied wording:
#158 LOCAL_DATABASE_PROOF_6_ACCEPTED and ISSUE158_STAGING_SCHEMA_APPLICATION_ACCEPTED;
#133 SLICE1_DATABASE_PROOF2_ACCEPTED, ISSUE133_STAGING_PREFLIGHT_ACCEPTED_FOR_APPLICATION_GATE,
and ISSUE133_STAGING_SCHEMA_APPLICATION_ACCEPTED. None is reopened or rerun.

The exact hosted chain is pinned in `manifest.json`: Foundation `20261005032107`,
R1a `20261005170446`, Attribution `20261007170242`, #158 `20261009035548`,
#133 `20261009133204`. For each, preflight requires one matching version/name,
one statement, exact statement bytes and SHA-256. Local source paths/hashes are
also pinned; authoring this package applies no migration and performs no ledger write.

Both backends remain unwired/default-off. This fresh package proposes a
connected hosted behavioral gate; installation and offline tests are not behavioral acceptance.

## Run identity, members and deterministic seal

The sole proposed run is `HV133-158-20261009-C03-9b8c5783`, targeting only
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
The supporting preparation report is outside the execution package. No continuity or
changelog restamp occurs before independent review and gate reconciliation.

Any member/source drift, wrong hash, run, target or reused evidence directory
refuses execution. A changed fixture requires a new reviewed package identity.
Do not reseal to conceal a failed run or change accepted expectations.

## Bounded synthetic case

ONE new normal Business: Orivessa 9b8c5783 Governed Synthetic. All emails and the
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

There is no resume, automatic retry, phase skipping, cleanup, alternate project,
worker invocation, provider endpoint or transport fallback. HTTPS certificate
verification is mandatory. Proxy inheritance and redirects are disabled; requests
are limited to 45 seconds and 4 MB replies. SQL lock timeout is 5 seconds,
statement timeout 30 seconds (15 seconds for authorization negatives).

## Credential contract — creation-time attestation (C1)

The Product Owner supplied the creation-time non-secret scope facts. The creation-time
attestation is satisfied; the token itself and screenshots are not copied or inspected.
The Management credential contract is:

- created manually by Product Owner Darshan via Supabase Dashboard;
- creation date: 2026-10-09;
- exact creation minute was not independently retained; no exact minute is asserted;
- scoped PAT;
- exact resource = `wnfahklzaxirftyskctd` / Chasum Staging only;
- Database Read-write;
- Project Settings Read;
- 7-day expiry at creation;
- no other Management capabilities;
- no Production project scope;
- same-token identity GET mandatory before the RW capability gate and any write.

The independent security design review returned ACCEPTED_WITH_CORRECTIONS, not C03
execution approval. C1 is satisfied by the supplied attestation; C2 is implemented by
this package's new pre-Auth gate; C3 is the privacy trade recorded below. Same-project
GET proves access/identity, not absence of other scope: exclusivity relies on creation-time
attestation. The separate Auth service-role credential remains endpoint-bound and unchanged.
No MCP fallback, alternative principal, split-principal substitute or token rotation exists.

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
3. **management-database-read-write-capability (C2), before owner/Auth creation.**
   The same Management bearer posts to the same fixed `/database/query` route with
   `read_only:false`. A dedicated bounded transaction starts with BEGIN, sets local
   lock timeout 5s and statement timeout 30s, reads only the built-in
   `pg_catalog.current_setting('transaction_read_only')` into a JSON evidence object,
   then explicitly ROLLBACKs. It neither forces READ ONLY nor forces READ WRITE.
   Only the exact object `{"transaction_read_only":"off"}` passes. No table is touched;
   no INSERT/UPDATE/DELETE/DDL, temporary object, sequence, application RPC or COMMIT.
   The exact static SQL is in `management_database_read_write_probe()`.

   Transport/envelope/JSON/schema/value failure or read-only state yields the fixed
   allowlisted reason `MANAGEMENT_DATABASE_RW_CAPABILITY_UNPROVEN`, STOP_ZERO_WRITES,
   admission_may_remain_enabled=false, automatic_retry=false. Gate dispatch records only
   its SQL hash and mutation_possible=false; only validated fixed evidence is retained.
   No write flag is set and no owner is created. No retry or fallback is permitted.
   Both earlier READ ONLY gates remain mandatory and byte-identical to V2.

   This establishes observed non-read-only transaction mode, together with creation-time
   Database Read-write attestation and prior privilege inspection. It is not a mutating
   canary or a guarantee that every subsequent DML succeeds. Supplied local API evidence
   establishes no contrary behavior; runtime response is unverified. If independent
   review finds this introspection insufficient for the route, STOP preparation/execution
   approval and report that blocker; never invent a mutating proof.
4. Create one confirmed synthetic Auth owner through fixed Auth Admin, with no send
   endpoint. Independently verify its SQL identity, zero sessions/memberships.
5. One service-role transaction calls `decide_business_identity(create_new,...)`,
   demands `created`, disables notification/marketing/public-booking flags and clears
   notification recipient, then provisions the minimum parents. It requires the normal
   seven business hours, seven location hours, one settings row and seven staff hours.
   Any ambiguity/failed seed rolls this transaction back. The separately-created Auth
   owner may remain after failure: retain it; do not delete or create a replacement.
6. Capture fresh repeatable-read counts + SHA-256 of **full rows** in all 14 financial
   tables required by the contract, communication tables and parent/mapping tables.
   Ordering uses row JSON text under C collation. Exclude only the new Business (or
   joined children of its parents). Require equality with the zero-write baseline.
   Thus retained rows with unchanged counts but changed values cannot pass. No existing
   tenant rows or PII are output: only counts/digests. Synthetic full rows may be retained.
7. Prove all synthetic financial arrays empty, no owner sessions/other memberships,
   no other admission, zero tenant communication rows, no customer/provider references,
   and contained Business flags. An activity query checks visible SQL targeting the
   Business/actor. This is a point-in-time supplement, not proof against future hidden
   writers; the external quiescence attestation remains mandatory throughout.
8. Call only `set_payment_projection_admission_v1(B,true)`. Retain returned Business,
   enabled=true and server watermark. No direct admission DML/backdating is permitted.
9. Bootstrap → persist → bind with the exact source signatures/argument order recorded
   in the manifest. Require ADMITTED → CREATED → BOUND, same stable identities, one
   REQUESTED/RECOVER attempt, one appointment, no money/obligations/projections, one
   REQUESTED event. Attempt creation must be strictly later than the server watermark.
   Read both canonical readers; #133 must say PAYMENT_RECOVERY_REQUIRED.
10. Commit only the bound attempt via `commit_booking_operation_manual_payment_v1`:
   RECORDED, recorded=true, one ACCEPTED attempt and manual CAD50 transaction, four
   PENDING obligations and exactly REQUESTED/ACCEPTED events. #133 reader must say
   RECORDED_BUT_NOT_FULLY_SYNCHRONIZED. No cache/document inference substitutes for ledger.
11. Invoke appointment_cache → invoice_settlement → customer_payment_events → receipt,
    explicitly, without a worker. Each must return APPLIED/COMPLETE for the same IDs.
    Recheck containment and non-synthetic baselines after every projector.
12. Verify cache paid5000/refunded0/deposit_paid while price10000/tax0/deposit5000 are
    unchanged. One INV-0001 partial invoice: subtotal10000/tax0/total10000/paid5000/
    refunded0/balance5000, one coherent line; canonical transaction links to it. One
    exact CRM ledger mirror. One RCT-0001,5000,cad,e_transfer,not_sent,emailed_at NULL,
    **invoice_id NULL** by the accepted independence contract. Both sequences next2.
    Four COMPLETE obligations, four projection events (six lifecycle/events total).
    #133 reader RECORDED; #158 reader resolves the same operation/attempt/appointment/
    ledger. Reject forbidden PII/provider-internal reader fields.
13. **Deliberate successful-path idempotency probe**, not retry after failure:
    same bootstrap/persist/bind identities return EXISTING, same commit REPLAY/PENDING,
    same four projectors VERIFIED/COMPLETE. Compare full synthetic financial arrays
    and canonical SHA before/after; document counters/events/targets must be byte-stable.
14. Nonmember UUID calls both readers in READ ONLY transactions. Only 42501 denial is
    expected; no existence detail is accepted. No second tenant or Auth user is created.
15. Re-read final canonical truth, then setter(B,false). Require same watermark,
    enabled=false, exactly the one synthetic admission row and no others. Reconcile
    all retained digests and synthetic financial rows, excluding only the intended
    admission-row disable transition from the synthetic byte-stability comparison.
16. Retain all synthetic parents, financial records and disabled admission for audit.
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

The V3 offline suite is `tests/test_hosted_validation.py` (standard-library unittest).
It traps sockets and credential environment reads before importing the inert module,
never invokes the executable entry point, never executes SQL and never runs financial
routines or a financial test workflow. It uses in-memory responses only up to the Auth
boundary; even the successful gate path is deliberately halted before owner dispatch.
Financial/commercial and post-owner behavior are compared byte-for-byte/AST to V2.
It also checks fixed routes, endpoint-bound credentials, prior gate preservation,
phase order, failed capability responses, diagnostic privacy, fresh identities,
predecessor seals/evidence hash chains, source pins and exclusive single-shot evidence.
No accepted local proof is rerun. C01/C02 code is read as text only, not executed.
Live schema/body/grant compatibility remains a future gate; any mismatch stops.

Future execution is limited to the connected backend chain. It does NOT establish Booking Sheet
or Quick Appointment responsive UI acceptance; desktop/tablet/mobile workflow acceptance;
worker/claim-loop behavior; communications; provider behavior; #153 closure; Reporting/CRM
runtime cutover; Production; GVM; or technician resumption. Those remain separate gates.

**HOSTED V3 VALIDATION WAS NOT RUN.**

## C01/C02 preservation and privacy trade (C3)

Both predecessors are consumed STOP_ZERO_WRITES runs and must never be reused/rerun.
The manifest binds the ordered predecessor chain, exact package-member sizes/hashes,
run/aggregate/candidate identities, and evidence paths/sizes/hashes for both:

| Run | Aggregate | Evidence SHA-256 |
| --- | --- | --- |
| HV133-158-20261009-C01-72d9f02a | 2a212324eae2b610f7dda105931d78deef9bf02826507c1c4361d59a5d705090 | a16c19aed6778ea76789f6d35e263f140611148aae6074ccade548369b745ab8 |
| HV133-158-20261009-C02-5776d6c8 | 75b839ffa18696663a817ab8e390202db66812a5e5ee348c4b149b8a9b169539 | 19a833b4bf73b1eec798dcade86e26b69407a3cd97db711e50b3f79714921fd6 |

C01 candidate `75f511c13205040cd1d0ccb4272cbbb821c06232`; C02 candidate
`b74316e8d6dd89c4c4ff0032f71158148e6324b5`. C01's opaque project-identity failure
cannot be diagnosed retrospectively. C02 passed zero-write preflight and literal
service_role READ ONLY, then stopped at project-identity with PROJECT_IDENTITY_HTTP_403.
The accepted post-stop reconciliation found zero C02 mutation and no unknown money state.
The old credential had Database Read-write but lacked Project Settings Read, per the
Product Owner's supplied non-secret reconciliation. No credential is recovered to
re-diagnose the old runs; no historical evidence is rewritten.

Current Supabase scoped-token 403 responses may contain a `missing_permissions` array.
The runner intentionally does not retain raw response body/header/token/account text.
Repeat 403 therefore remains bounded to allowlisted status/type classification. This is
an accepted privacy trade, not an oversight. No raw error-body parsing is added in C03.
Project identity still classifies integer HTTP status or exception types only; no raw
exception text, body, headers or missing_permissions details enter evidence. Its successful
response retains only the exact project ID and ACTIVE_HEALTHY. The new capability gate
uses its single fixed allowlisted failure code; other SQL/Auth errors remain opaque.

All commercial, tenant, admission, booking, projection, reader, replay, retained-cohort
exclusion and STOP_AFTER_WRITES retention routines are unchanged from V2. New identities
use the same fixed future slot and one-hour expiry gate; no runtime date/key rotation.
No worker, #153, communications/provider, Production/GVM or technician authority follows.

## Exact next gate

Claude Opus 5 High must independently review the exact V3 local candidate commit/tree,
seal/member hashes, predecessor preservation, C1/C2/C3 corrections, same-token order,
zero-mutation SQL and fail-closed privacy tests. No Claude review was dispatched by this
local-only authoring task. Intended result: CONNECTED_STAGING_V3_PACKAGE_READY_FOR_PO_EXECUTION_GATE
or explicit blockers/corrections. ChatGPT then reconciles that review before Darshan's
separate exact C03 execution decision. **NO Product Owner C03 execution approval yet.**
