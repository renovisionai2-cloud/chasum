# #133/#158 connected Staging V2 preparation after C01 STOP_ZERO_WRITES

Status: **PREPARED_ONLY_NOT_RUN — ready for independent review**.
**HOSTED V2 VALIDATION WAS NOT RUN.**

## Verified authoring state

Branch `codex/issue-133-projection-observability` was clean at exact HEAD
`51f7c3ab77fa91810454bebb77ea1479ced119ee`, tree
`bae891c8e4b38a20c164feead0ab17e0d02a91eb`, before authoring.
This task changes only the five new V2 package paths, this report, and CHANGELOG.
No accepted database proof, schema application, product implementation or financial
contract is reopened. No remote repository, hosted endpoint or credential was probed.

## Immutable C01 history

- Candidate: `75f511c13205040cd1d0ccb4272cbbb821c06232`.
- Aggregate: `2a212324eae2b610f7dda105931d78deef9bf02826507c1c4361d59a5d705090`.
- Run: `HV133-158-20261009-C01-72d9f02a`.
- Result: `STOP_ZERO_WRITES` at `project-identity`.
- Evidence SHA-256: `a16c19aed6778ea76789f6d35e263f140611148aae6074ccade548369b745ab8`.
- Evidence: `/Users/darshan/chasum-evidence/issue133-connected-staging/HV133-158-20261009-C01-72d9f02a/evidence.jsonl`.

The local evidence file was read only for its digest and six-record count; its bytes
remain untouched. The accepted independent review verified the hash chain. The current
board/handoff and supplied reconciliation establish successful zero-write preflight and
literal service_role READ ONLY probe, then opaque project-metadata failure, zero synthetic
or financial mutation, zero admission and unchanged retained cohort. No unknown money
outcome exists. No new live reconciliation or rerun is claimed here.

C01 did not retain sufficient detail to distinguish HTTP errors, timeout, TLS or network
failure. No specific retrospective cause is inferred. The source-of-truth record confirms
GET /v1/projects/{ref} is valid; the independent identity gate is retained. Original C01
package/evidence, run identity and fixture identities must never be reused or overwritten.

## Exact V2 correction

New package: `docs/validation/issue-133-connected-staging-v2/`.
Proposed run: `HV133-158-20261009-C02-5776d6c8`.
Only target: `wnfahklzaxirftyskctd`.
New Business: `Velunora 5776d6c8 Governed Synthetic`.
New slug: `velunora-hv133-5776d6c8`.
New owner/business/customer emails use suffix `5776d6c8` and `.invalid`.
New fictional phone: `+14165550184`. All six caller-owned UUIDs are fresh.
The fixed 2026-11-18 15:00–16:00 UTC slot retains the existing one-hour-before-start
expiry gate. No runtime date or identity rotation is permitted.

Only the fixed zero-write project metadata GET gains allowlisted diagnostics:
PROJECT_IDENTITY_HTTP_401 / HTTP_403 / HTTP_429 / HTTP_5XX / TIMEOUT / TLS_ERROR /
NETWORK_ERROR / INVALID_JSON / WRONG_PROJECT / UNHEALTHY, with the same prefix for
all codes. Other HTTP statuses map to HTTP_OTHER, and rejected redirects, oversized
responses or inconsistent transport envelopes map to RESPONSE_REJECTED.

The classifier uses integer HTTP status or exception types, including typed nested
URLError reasons and socket.timeout across supported Python versions. It never converts
remote exceptions to text or reads HTTP error bodies/headers. Text-only network reasons
remain NETWORK_ERROR; no heuristic parsing is used. Invalid JSON shape/encoding fails
closed. Successful metadata exposes only verified ID and ACTIVE_HEALTHY, discarding
unrelated account fields. Unknown diagnostic code input maps to a safe fixed code.

Run.stop adds reason_code only for these failures at project-identity before writes.
Status remains STOP_ZERO_WRITES, admission_may_remain_enabled=false, automatic_retry=false.
No Auth creation, tenant provisioning, admission, payment or projection follows. No
credential rotation, retry, alternate host or transport fallback is introduced.

Management SQL and Auth failure handling remain opaque, including uncertain write outcomes.
The fixed three-endpoint allowlist, GET/Management-token binding, proxy/redirect refusal,
verified TLS, 45-second timeout and response cap remain intact.

## Preserved contracts and sealing

Offline source comparison requires every existing function/method except
Transport.request, Transport.project_identity and Run.execute to remain byte-identical
to C01. The only added runner elements are socket timeout support and the bounded
ProjectIdentityStop/classifier definitions. Source pins, function inventory, hosted
migration chain and required privilege inventory remain exactly equal to C01.

Commercial truth is unchanged: CAD100 subtotal, zero tax, CAD50 deposit, booking_sheet,
deposit, e_transfer, manual, cad. Tenant provisioning, admission/watermark, fingerprints,
bootstrap/persist/bind/commit, projector order, invoice/receipt/CRM truth, readers, replay,
negative authorization, communication containment, retention and successful disable are
unchanged. No worker, #153, Reporting/CRM cutover, provider or communication work is added.

The V2 manifest binds its new authoring baseline, new fixture/run, target, members and
predecessor provenance through the existing self-reference-free aggregate algorithm.
Four content members are byte/SHA-bound; the manifest envelope is bound canonically and
its raw bytes/hash are reported externally. No execution timestamp is invented.

## Offline validation

58 tests PASS: all 32 C01 tests carried forward, plus 26 V2 checks. New coverage exercises
real V2 metadata transport/classification with an in-memory opener and fake preflight;
network sockets are trapped. Each injected failure proves one dispatch, bounded evidence,
STOP_ZERO_WRITES, no Auth/tenant write and no retry. Secret/body/header/account sentinels
must not appear in evidence. HTTP error-body reads raise a test failure. Success requires
all prior gates before Auth. Write errors remain opaque. Original single-shot evidence,
source pins, retained-row hashes, privacy, watermark, replay and disable tests remain.

Python AST/compile, JSON parsing, manifest/member/source hashes, whitespace and seven-path
scope checks pass. No positive CLI invocation, hosted call, credential access, SQL execution,
local database proof, migration application, worker or provider send occurred.

## Limitations and next gate

Offline tests validate the prepared runner and failure classification, not hosted behavior.
The next execution can still stop for access, network, fixture expiry/collision, schema or
retained-data drift. Bounded diagnostics intentionally omit bodies, headers and account
information. They do not diagnose C01 retroactively or authorize credential/config changes.
Continuous writer/worker quiescence, protected evidence retention and all inherited gates
remain mandatory. Failure after admission enable retains state and requires separate
governed containment; there is still no finally-block mutation or automatic recovery.

Competitive Product Gate: **ALREADY SATISFIED FOR THIS CONTRACT / NO NEW RESEARCH REQUIRED**.

Next: independent review of this exact local V2 candidate and seal, then Control Tower
reconciliation and fresh Product Owner authorization for this exact new run. No push, PR,
merge, deployment, hosted execution, Production/GVM action or technician resumption is
approved or performed by package preparation.


## Independent V2 package audit

Claude Opus 5 High independently returned `CONNECTED_STAGING_V2_PACKAGE_READY_FOR_PO_EXECUTION_GATE` with zero blockers and zero required corrections. It verified commit/tree/parent, exact seven-path scope, original C01 package/evidence preservation, fresh fixture/run identities, all member hashes/sizes, aggregate `75b839ffa18696663a817ab8e390202db66812a5e5ee348c4b149b8a9b169539`, the bounded project-identity diagnostic implementation and privacy properties, no-retry/zero-write ordering, byte-preserved financial/behavioral C01 contract, unchanged source/function/privilege pins, retained-cohort exclusion, evidence/single-shot controls, and 58/58 offline tests. Claude also independently confirmed diagnostic reason codes are derived only from numeric HTTP status / exception types and that no response body/header/token/raw exception text can enter evidence.

The exact next gate is Darshan's Product Owner decision for one C02 run: `HV133-158-20261009-C02-5776d6c8` against `wnfahklzaxirftyskctd`, aggregate `75b839ffa18696663a817ab8e390202db66812a5e5ee348c4b149b8a9b169539`. **HOSTED V2 VALIDATION WAS NOT RUN.** C01 remains immutable and must not be rerun.
