# #133/#158 connected Staging V3 preparation

Status: **PREPARED_ONLY_NOT_RUN — offline checks PASS; independent review pending.**
**NO Product Owner C03 execution approval yet. No hosted execution occurred.**

## Scope and source authority

Local package authoring only, from the accepted V2 package, preserved C02 evidence,
credential-security review package, and the Product Owner's latest locked facts.
C01/C02 are consumed STOP_ZERO_WRITES and must never be rerun/reused. The accepted
#158 Proof #6, #133 Proof #2 and once-applied protected Staging migrations remain closed.
The current board records C02's later stop; the handoff's older C02-not-run wording is
historical. This preparation does not restamp either file or the environment manifest.

Competitive Product Gate: **NOT_APPLICABLE** to this internal capability-gate correction.
The inherited accepted product/financial contract is unchanged. No new customer feature,
pricing, business rule, migration, RLS/ACL, application runtime or release change exists.

Before authoring: branch `codex/issue-133-projection-observability`, clean worktree;
HEAD `72be50fd93bd3f4dca4be97cfc01c72d01fc7f49`,
tree `63128196547ab52acebec5f0321a1e30e32922a4`,
parent `cf1a03cc90f0ec207875fe585ecf9499ea3c46f5`.
After package authoring / before the one authorized local commit, source HEAD/tree/parent
remain those same three identities. Only the five V3 files and this report are new.
Cached local `origin/main` is `31115e6a51b71fc097c279d205065d80e0be3573`;
remote-main freshness is **NOT VERIFIED** because hosted GitHub access is prohibited.
No reset, fetch, pull, push, issue/PR operation or environment reconciliation occurred.

The final delivery records the actual commit/tree/parent and post-commit status (or the
exact local commit blocker). A containing commit/tree hash cannot be embedded in this
report without changing that hash; the authoring source identities above are literal,
not fabricated candidate identities. The candidate's expected parent is the source HEAD.

## Fresh C03 identity

- Run: `HV133-158-20261009-C03-9b8c5783`.
- Fixed project: `wnfahklzaxirftyskctd` / Chasum Staging only.
- Business: `Orivessa 9b8c5783 Governed Synthetic`.
- Slug: `orivessa-hv133-9b8c5783`.
- Owner email: `owner-9b8c5783@hv133.invalid`.
- Business email: `business-9b8c5783@hv133.invalid`.
- Customer email: `customer-9b8c5783@hv133.invalid`.
- Fictional phone: `+14165550163`.
- Website: `https://9b8c5783.hv133.invalid`.
- Fixed slot remains 2026-11-18 15:00–16:00 UTC; one-hour expiry gate unchanged.

Fresh caller-owned UUIDs (none overlaps C01 or C02):

- customer: `3467c324-b032-4a90-b941-fe1a171a769b`.
- service: `72724a4f-578b-417d-93af-74631bd18393`.
- staff: `80a35537-912f-4d19-9f2c-59f494340b75`.
- operation: `3641fd8a-c223-445a-be66-79da3f8c927f`.
- attempt_key: `953576f8-ff6e-4e45-8b1e-be2a6918b3ec`.
- nonmember: `a36d8298-166d-4cf4-86f8-9edc6987850c`.

Server-generated identities retain the V2 capture-once contract. No Auth owner,
Business, tenant, fixture, evidence run directory, session or hosted record was created.
Random run/fixture generation used local randomness only and accessed no credential.

## Exact package seal

Aggregate SHA-256: `3653c35027a98ff86e647e737252dbd97353da959ad075be2c91c367919002e9`.

Algorithm unchanged: remove only `aggregate_sha256` from the manifest object; serialize
all remaining fields as UTF-8 JSON with sorted keys, separators `(',', ':')`,
`ensure_ascii=False`; prepend `CHASUM-CONNECTED-STAGING-v1` plus one LF; SHA-256 the bytes.
The four content members are bound by exact raw bytes/hash. The manifest is the canonical
seal envelope; its raw bytes/hash are reported here, outside that envelope, avoiding
self-reference. The preparation report is not an executable package member.

All paths below are relative to `docs/validation/issue-133-connected-staging-v3/`.

| Member | Bytes | SHA-256 |
| --- | ---: | --- |
| `PLAN.md` | 21767 | `4b8f142ddab22df7feb5dbbdb4bbf4644080ce93fa14029723fd69c84a28e617` |
| `fixture.json` | 1380 | `6c434e0e15dc75f7468f591022cc355f7395870e32db62fc2f8ee616ffbf8ce1` |
| `hosted_validation.py` | 52622 | `b11ab0e612220c0fd28fe1cc72dfbb6181c0cdf1f039b25f73f9570161a6daef` |
| `manifest.json` | 38164 | `4fc90a0384ec962806eb1f41c1092b683898e7c1d275fc851f9d518221172c27` |
| `tests/test_hosted_validation.py` | 25121 | `a922f45febd3de8915b403d5f086dbe871d647a5cd678779d2baeefb0038271b` |

## Exact V2 delta and corrections

Runner delta only:

1. Add the fixed phase constant, fixed-code stop type and static RW probe SQL.
2. Add `Transport.management_database_read_write_capability()`; it calls the existing
   Management query transport with the same bearer, validates before evidence recording,
   accepts only `{"transaction_read_only":"off"}`, and returns that fixed safe object.
3. Insert one guarded single-shot dispatch/response after project-identity and before
   owner:dispatch / writes=True. Add its bounded reason_code to zero-write stop evidence.
4. Correct one Transport.sql comment about caller-selected transaction mode; its AST is unchanged.

The probe uses BEGIN; SET LOCAL lock_timeout=5s / statement_timeout=30s;
SELECT built-in pg_catalog.jsonb_build_object/current_setting(transaction_read_only);
explicit ROLLBACK. It does not force READ ONLY or READ WRITE. Request read_only=false
is inherited. No table access, application RPC, sequence advancement, temporary object,
INSERT/UPDATE/DELETE/DDL or COMMIT exists in the probe. Only an exact off result passes.
Malformed transport/envelope/JSON/schema/value or read-only mode yields
`MANAGEMENT_DATABASE_RW_CAPABILITY_UNPROVEN`, STOP_ZERO_WRITES,
admission_may_remain_enabled=false, automatic_retry=false; no write flag or Auth admission.
The response is checked before recording, so unexpected response fields are discarded.

All other existing functions/methods are byte-identical, apart from that comment.
Run._execute and Run.execute become exactly V2 after removing the specified insertion.
Whole-module AST comparison permits only these exact changes. The original preflight,
literal service_role READ ONLY probe, same-token identity GET, financial/business routines,
retained-cohort exclusions, STOP_AFTER_WRITES preservation, endpoint binding, no-retry/
no-fallback policy and exclusive/fsynced evidence controls are unchanged. Financial semantics
changed: **NO**. CAD100 subtotal, zero tax, CAD50 deposit, booking_sheet/deposit/e_transfer/
manual/cad; all provisioning, projection, reader, replay and retention semantics remain V2.

Package-only delta: fresh run/contact/UUID identities; new authoring provenance;
ordered C01+C02 predecessor records and exact immutable package/evidence pins; new manifest
seal; PLAN corrections C1/C2/C3; a bounded offline gate/source test suite. The V2 financial
simulation suite is not executed or carried into the C03 test workflow. Static byte/AST
comparison preserves the financial contract without running a financial test.

C1: Product Owner creation-time scope attestation is accepted as supplied non-secret facts.
The credential was created manually by Product Owner Darshan via Supabase Dashboard;
creation date: 2026-10-09. The exact creation minute was not independently retained;
no exact minute is asserted. PLAN and this report retain scoped PAT, exact resource
`wnfahklzaxirftyskctd` / Chasum Staging only, Database Read-write, Project Settings Read,
7-day expiry at creation, no other Management capabilities, no Production project scope,
and same-token identity GET mandatory before the RW capability gate and any write.
No token value/fragment, screenshot or credential
shell command is copied, printed, recovered or stored. No secret store was read.

C2: new pre-Auth capability gate above. Local source/API evidence does not contradict the
requested introspection design. This proves observed transaction mode when eventually run,
in combination with creation-time scope attestation and unchanged privilege inspection;
it is not a mutating canary or a guarantee every subsequent DML will succeed. Runtime/API
behavior remains **NOT VERIFIED**. If independent review establishes insufficiency, stop
and report the blocker; do not replace it with a mutating proof.

C3: scoped-token HTTP403 may include missing_permissions. PLAN explicitly accepts the
privacy trade: discard raw response bodies/headers/token/account/exception text; retain
only bounded allowlisted status/type classification (and the new gate's fixed code).
No raw HTTP error-body parsing is added. No MCP or split-principal substitute exists.

Earlier local closeout corrected one PLAN source attribution: #133 acceptance is
recorded in the accepted implementation review, while the handoff retains older wording.
The final C1 correction records creator, creation method/date and the unretained exact
creation minute in both PLAN and this report. The existing offline assertion now checks
these attestation facts in both documents. Runner and fixture bytes remain unchanged;
the member hashes and package aggregate were recomputed for this correction.

## Offline verification

**23 tests PASS / 0 failures / 0 errors**, final C1 correction/post-reseal run 1.465s, exit 0.
The attestation assertion checks both PLAN and this report, including creator, creation
method/date and the explicit absence of an independently retained exact creation minute.
Invocation: `PYTHONDONTWRITEBYTECODE=1 TMPDIR=/private/tmp python3 -m unittest discover -s docs/validation/issue-133-connected-staging-v3/tests -v`.
Python AST/compile and JSON/seal/member/source-pin checks PASS. Exact six-file Git scope
and unchanged runner/fixture bytes PASS. C01/C02 package/evidence preservation PASS in
the offline suite and a separate read-only check against manifest pins and Git HEAD.
The secret-shape scan across all six scoped files found zero matches for scoped PAT,
Supabase key, JWT, private-key, common provider/GitHub token, literal credential/Bearer
and credential-URL patterns; explicit fictional test sentinels are excluded. This is a
bounded shape scan, not proof that every possible secret format can be detected.

The tests install socket/HTTP/environment traps before inert import; the executable entry
point is never invoked. The successful mock gate halts before owner:dispatch, before any
Auth call or financial routine. Rejected results prove zero write/admission flags and one
request, strict order, bounded diagnostics and no fallback. HTTP-body read counters remain
zero, including bodies containing missing_permissions. Malformed and extra fields never
enter evidence. Endpoint headers use fictional sentinels only. Temporary fictional evidence
is created solely under the local temporary directory and verifies exclusive directory,
0600/0700 modes, redaction and hash chains; the real evidence directory is read-only input.

No financial test, accepted database proof, hosted SQL, migration application, credential use,
Auth/tenant creation, worker/provider invocation, Supabase/Vercel/GitHub hosted contact,
Staging/Production/GVM mutation or release action occurred. Application lint/build are
NOT RUN: no application/Next.js code changed; the scoped Python/JSON checks apply here.

## C01/C02 preservation proof

Before/after hashes and byte counts match all ten original package files below. The test
suite also recomputes both original canonical aggregates and both six-record evidence
hash chains, without importing or executing either consumed runner. Both stop records
remain STOP_ZERO_WRITES with no admission. C02 retains PROJECT_IDENTITY_HTTP_403.
The earlier accepted post-stop reconciliation (not repeated here) proves no C02 mutation
and no unknown money outcome. Original source files and evidence remain untouched.

| Original path under docs/validation | Bytes | SHA-256 before = after |
| --- | ---: | --- |
| `issue-133-connected-staging/PLAN.md` | 15349 | `f91b0235031b032018b3e1900db80d69f0add9e260592cf934463e3912e7c358` |
| `issue-133-connected-staging/fixture.json` | 1380 | `01b81a50b983f0a2da7618d78c57768e8138c89418164de8f5530edd90f4f6f6` |
| `issue-133-connected-staging/hosted_validation.py` | 48092 | `6e0a45557cd2f78f082ee4c828aa71b66f92f6db42ee9597e7c2656c5c458856` |
| `issue-133-connected-staging/manifest.json` | 33837 | `28f85ae8f3d16938ae6ae2d706ceecb55e8a89f668d80b03eff88a1dcace6afd` |
| `issue-133-connected-staging/tests/test_hosted_validation.py` | 26218 | `18f784e61953d3e0cea41b7ad77b6fd12283644123b4b8313539ea4bc4df7878` |
| `issue-133-connected-staging-v2/PLAN.md` | 18185 | `fc1f435effc1277fc94b2db465cb6b3c52fcefd0687a6e021a66a1875a5ecd65` |
| `issue-133-connected-staging-v2/fixture.json` | 1380 | `ed6bb86f23cdf60a526acc4fd1964eeda1e653e6ec53e1d68cecab041cf843b8` |
| `issue-133-connected-staging-v2/hosted_validation.py` | 50743 | `1f867689f2fa1d45da2c9f7a6da19c3e5bb12078453835b36783516c9ffb30b4` |
| `issue-133-connected-staging-v2/manifest.json` | 34126 | `eeb34541502221da240b099b0eee3d49548675d9636ce868fa7cc0f3d10a588a` |
| `issue-133-connected-staging-v2/tests/test_hosted_validation.py` | 34064 | `a3c358b037163d7ae1307fd5df3cf1ecdb62c4483247a681f0aede111f73e868` |

- C01 aggregate: `2a212324eae2b610f7dda105931d78deef9bf02826507c1c4361d59a5d705090`;
  run `HV133-158-20261009-C01-72d9f02a`; evidence 39,827 bytes / 6 records;
  SHA `a16c19aed6778ea76789f6d35e263f140611148aae6074ccade548369b745ab8`.
- C02 aggregate: `75b839ffa18696663a817ab8e390202db66812a5e5ee348c4b149b8a9b169539`;
  run `HV133-158-20261009-C02-5776d6c8`; evidence 40,103 bytes / 6 records;
  SHA `19a833b4bf73b1eec798dcade86e26b69407a3cd97db711e50b3f79714921fd6`.

Exact local evidence paths are pinned in manifest.predecessors. No new C03 evidence
exists. CURRENT_PROJECT_STATE, LATEST_HANDOFF, ENVIRONMENT_MANIFEST, C01/C02 preparation
reports and every application/migration/release-control file are unchanged.

## Next independent-review gate and limits

Internal Codex read-only design/delta check: **COMPLETED**, returned review evidence;
this is not Claude's independent high-risk acceptance. No implementation/runtime blocker
was identified locally. Offline checks do not establish hosted readiness or close #133/#158.
Access expiry, route behavior, transport failure, fixture expiry/collision and schema/
retained-row drift remain fail-closed future risks. No financial semantics were expanded.

Claude Opus 5 High independent review: **PLANNED / NOT SENT / NOT RUNNING**. This task
forbids external dispatch; no executable Claude channel is available in this session.
The review is blocked on authorized manual dispatch after exact candidate identity is
available. Darshan or ChatGPT Program Lead must provide the following bounded prompt:

> Independently review the exact local C03 candidate commit/tree/parent and package aggregate
> `3653c35027a98ff86e647e737252dbd97353da959ad075be2c91c367919002e9` for run
> `HV133-158-20261009-C03-9b8c5783`, target `wnfahklzaxirftyskctd`, using this
> report and docs/validation/issue-133-connected-staging-v3. Verify C1 scope attestation,
> C2 zero-mutation RW introspection sufficiency and pre-Auth fail-closed order, C3 privacy,
> unchanged financial/retention semantics, C01/C02 immutability and offline checks. Read-only
> local review only; no credential access, hosted contact, SQL execution or financial tests.
> Return CONNECTED_STAGING_V3_PACKAGE_READY_FOR_PO_EXECUTION_GATE or precise blockers/corrections.

ChatGPT then reconciles Claude's exact-candidate review; only afterward may Darshan make
any separate exact-run execution decision. **NO Product Owner C03 execution approval yet.**
No safe runtime/financial parallel work is authorized; local package review may proceed.
