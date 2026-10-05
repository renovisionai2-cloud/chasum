# Chasum — Latest Development Handoff

**Updated:** 2026-10-05 for the Product-Owner-approved bounded #134 R1a audit corrections; no hosted or Production action. This section supersedes the earlier implementation-awaiting-authorization wording; historical accepted work remains closed.
**Purpose:** recover the next action in 5–10 minutes without old-chat reconstruction.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md), which owns the Chasum mission, the permanent Product Owner principle, the multi-location operating model, Summer doctrine, the World-Class Standard and current agent governance.

## 2026-10-05 — #134 R1a corrected candidate requires independent re-review

**CORRECTED PREPARED CANDIDATE / RE-REVIEW REQUIRED / UNWIRED / DEFAULT OFF / NOT APPLIED.** Product Owner authorized the bounded R1a corrections. Grok G-B and Claude B remain initial-candidate findings, not acceptance. CT-R1 reproduced REQUESTED+DO_NOT_RETRY creating a ledger; the corrected candidate now requires coherent recovery/evidence before any new effect, preserves valid ledger truth in UNKNOWN holds, validates every canonical Business/key/winner/RPC identity and proves overlapping commit replay. It still contains exactly the same two literal-service-role SECURITY INVOKER RPCs, an internal server-only kernel and no existing writer/UI wiring, projection worker, legacy schema or permission change. [Candidate record](../reviews/issue-134-r1a-manual-kernel.md); [governing reconciled contract](../reviews/issue-134-payment-attempt-foundation.md).

Migration: `supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql`, SHA-256 `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`. Foundation SHA `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47` and vector fixture SHA `842c4afaf3d68a2778dded613a1b57dd4775a4019a3465c5130a82cc5d2f9874` remain exact. Fresh PostgreSQL 17.11 execution as literal `service_role` passed the full focused contract and true two-process commit race. Focused tests passed 38/38; expanded commerce/migration/booking regressions 559/559; typecheck, targeted lint and diff-check passed. A broader run passed 1,896 tests but was not a suite PASS because two browser suites could not start without the uninstalled Playwright executable.

No hosted DB/provider/environment/Production/GVM action or hosted DML acceptance occurred. R1a is not imported by a current action or route; admission is hard default-off and application-traffic activation is prohibited before separately reviewed projection/workflow readiness. Binding-table SELECT and sequence rights remain modeled local assumptions pending exact hosted preflight; migration 031 does supply ledger DML. Appointment-customer reassignment after the binding read is an explicit pre-adoption race gate; no row-lock or privilege widening was added. Next: coordinator scope reconciliation, fresh Grok challenge and independent Claude Level-3 re-review. A later exact Product Owner gate is required for migration application and isolated hosted fixtures. Keep [PR #155](https://github.com/renovisionai2-cloud/chasum/pull/155) / [PR #156](https://github.com/renovisionai2-cloud/chasum/pull/156) Draft; #153/SEQ-ACL-1 and hosted privilege/legacy NULL-linked smoke remain prerequisites before cutover/adoption. #135/Phase A remain not Production released; six historical USD rows untouched; technician payments/GVM Operational Acceptance still held.

## 2026-10-04 — #134 foundation applied to governed Staging

**2026-10-04 23:21 America/Toronto — Issue #134 foundation APPLIED TO GOVERNED STAGING ONLY.** Product Owner explicitly approved the exact migration. Native Supabase application succeeded once on `wnfahklzaxirftyskctd`; hosted history is `20261005032107 / issue_134_payment_attempt_foundation` (2026-10-05 UTC). [Application evidence](https://github.com/renovisionai2-cloud/chasum/pull/155#issuecomment-5987566406).

Applied source remains `supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql`, reviewed head `fc83ae4b14d3a806be942a82afb4e9ffefb44241`, tree `5cb58423d3a6ce0af8ff5e5c70cb7168e92513eb`. The stored 15,667-byte SQL independently hashes to `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`. **Do not edit the applied source or reapply because the hosted timestamp differs.** This continuity restamp is documentation-only and does not change the applied candidate identity.

Grok **G-A PASS** and Claude **A1** on that exact prepared candidate are complete. Do not restart them. Post-write read-only SQL verified 54 validated constraints, 17 valid/ready indexes, 3 matching SECURITY INVOKER guard bodies, 4 enabled triggers, RLS on all 3 new tables, expected same-Business keys/FKs, generated event ordering/financial classification and zero new-table PUBLIC/anon/authenticated privileges. All 66 checked catalogue/history entries share transaction xmin `4575`. New attempts/events/reconciliation/linked-ledger counts are all zero. All seven checked existing data tables and all 10 prior migration-history rows retain identical digests/counts. Fresh-session timeout defaults are lock `0`, statement `2min`; no reused-session RESET proof is claimed.

**SEQ-ACL-1 / Issue #153:** the identity sequence inherited postgres-owned public-schema defaults granting anon/authenticated `USAGE + SELECT`, not UPDATE. The new tables remain inaccessible to those roles. No exploit/API reachability or sequence calls were tested. This separate least-privilege finding was recorded, not silently corrected; no additional grant/default-ACL/schema mutation is authorized.

**Post-application independent review:** **COMPLETE — Claude S-A: exact Staging schema application ACCEPTED with bounded SEQ-ACL-1 follow-up in #153; no immediate corrective DDL gate.** Claude independently inspected source/identity and reviewed supplied live SQL evidence; Claude did not query Staging or reproduce hosted writes. Session `e4424f59-4662-4eca-8294-0fad6fab508f`.. This is a new read-only review of Staging evidence and SEQ-ACL-1, not a rerun of the completed foundation audits.

**Before runtime adoption:** require an explicitly governed hosted Staging authenticated INSERT/UPDATE/DELETE smoke with NULL `payment_attempt_id`, because the new trigger also runs on legacy writers. The local PostgreSQL proof remains valid but is not a hosted write test. Confirm linked writes execute as `service_role`; #153 permission closure and all existing runtime/fault/concurrency gates remain open. No hosted DML acceptance was run in this schema-only task.

**Next gate (refined by the 2026-10-05 contract above):** Product Owner authorization for prepared-only R1a authoring/offline proof; broader runtime and permission-hardening gates remain separate. Runtime implementation/application and any corrective migration require their own governed authorization. PR #155 remains DRAFT/UNMERGED. Phase A/#135 remain MERGED TO MAIN / NOT PRODUCTION ACCEPTED; `main` remains `31115e6a51b71fc097c279d205065d80e0be3573`. Prior accepted #131 Production baseline remains `664fbc734c4103d78484c6b3828849a6605a562f`; Production was not contacted or changed in this Staging application task. No provider activation, #133 completion, historical USD repair, weak-dedupe removal, technician resumption or GVM Operational Acceptance. M1C/M2/Time Blocker remain held.


## 2026-10-03 — First governed real Production release proof

**Historical pre-restamp Git main at the release closeout:** `120ea6cb2fd5c8fd9013753284a29a9a821333c2`. This was later than the serving application SHA because post-#131 main changes were release-governance/authorization metadata; application/runtime trees were byte-identical to #131. This is a dated observation, not the #135 candidate identity.

**Canonical Production:** exact approved #131 SHA `664fbc734c4103d78484c6b3828849a6605a562f`, deployment `dpl_9Rfvssq3k8WHV6D6TFpkUtJDGuGF`, governed workflow run `37128562995`, READY / target production.

**Canonical verification:** `/api/build-info` reports exact `664fbc…`, `ref=main`, `env=production`, `production=true`; `/api/health` returned HTTP 200 / `ok=true`. Public `/`, `/login`, `/status`, `/book/gvm-baby-world` returned 200. Existing authenticated Production session loaded Command Centre, Reception/Calendar and Payments with no login redirect.

**Issue #136:** COMPLETE / CLOSED. Its architecture is now proven on the real Chasum project: merge remains distinct from release; candidate/ancestry/expiry checks passed; Product Owner protected-Environment approval gated Production credentials; exact candidate tests/build passed; canonical exact-SHA verification passed; no rollback/restoration was invoked. Historical deployment object `6788186484` remains the original stopped pre-#136 defect record, not release evidence.

**#131 / #129:** PRODUCTION ACCEPTED. This closes only the proven Full Booking Sheet payment-intent/outcome deployment gap. No manufactured GVM Production booking was created. The complete technician incident remains open.

**GVM integrity after release:** expected tenant owner identity matches; 3 active Locations / 3 active Staff; 9 staff-location / 43 service-location / 27 staff-service relationships; zero cross-tenant mismatches; zero offered-service coverage gaps. A 15th Service created on 2026-10-01 before release explains the evolved relationship counts. Read-only release-window checks found zero GVM appointment/customer/payment/invoice/Location/Service/Staff mutations caused by the release.

## A. Current control-tower state

**Issue #121 — Summer Location Disclosure: PRODUCTION ACCEPTED / CLOSED / COMPLETED.** Competitive Product Gate **PASS**; **LAUNCH REQUIRED**. PR #125 squash-merged at `2026-09-30T01:38:22Z` as `e8c307df07107736395f1b3b1f2d56bba3fec6be`, the prior accepted behavior-changing application release before #131. Merge tree `17f396dfcb63afc7ccc237a9e7060ef46abbcbbf`; parent `f70229098ddf18443ae74c6456d35239824280e0`. Production deployment `dpl_8LUVxEeFtL8JuwLgUxCDL8xBFbZT`, target `production`, **READY / SUCCESS**; unique URL `https://chasum-4hcdc8wwh-renovisionappcom.vercel.app`.

Direct Production `/api/build-info` HTTP 200: `commit=e8c307df07107736395f1b3b1f2d56bba3fec6be`, `commitShort=e8c307d`, `env=production`, `ref=main`, `production=true`. `/api/health` HTTP 200: `ok=true`, `production=true`; `supabase=true`, `serviceRole=true`, `email=configured`, `cronSecret=configured`, `sms=optional_missing`, `stripe=optional_missing`, `sentry=optional_missing`, `softSchemaFallbacks=disabled`. Health proves configuration presence only, not active DB binding, provider delivery or worker execution. Public `/`, `/pricing`, `/status`, `/login`, `/book/gvm-baby-world` returned HTTP 200. Merge-SHA Quality: **173 test files passed / 1 skipped; 1,697 tests passed / 36 skipped / 0 failed**.

Authenticated real-GVM **read-only** Production spot-check used the existing Safari session for `gvmbabyworld@gmail.com`, correct GVM Baby World tenant, workspace **GVM Baby World Ultrasound Brampton** throughout. Only `/dashboard/ai-workforce/summer` was loaded for the check: Summer, “AI Business Manager” and “Message Summer” input rendered with no login redirect. **No Summer message was typed/sent, no booking or Summer conversation/message/follow-up acceptance data was created.** Safari was restored to `/dashboard/calendar?view=day&date=2026-09-29`, still Brampton. No actual Production option card generation or live Summer mutation workflow is claimed: source inspection proved `sendSummerMessage()` / `handleSummerTurn` persists `ai_receptionist` conversation/message rows and may create communication/follow-up state.

Accepted zero-write Chromium evidence uses exact runtime candidate `9d8bf216749a64ea5dbf569256e3809df43c92b6` (tree `445aedfea3742471a31f10c4e2799120afcf75e5`) and compiled real Chasum CSS, localhost only, server actions mocked, no Chasum/Supabase/Staging/Production network. **390×844 / 1024×768 / 1440×900 PASS**, light/dark, zero horizontal overflow, contained long Location wrapping, exact option `locationId`/`locationName` preserved, one existing `role=log` / no nested `role=status`, zero console/page errors. Final pre-merge evidence head `0fdb23bb3096b56df486416f202ab009538fe7c5` has the exact merge tree and runtime candidate as parent. Its one-commit delta changes only `docs/CHANGELOG.md` and `docs/reviews/issue-121-summer-location-disclosure.md`; **zero non-doc/runtime/test/config delta** carries this acceptance into the release.

Production/browser/Quality observations above were verified during the governed release and are being recorded here; this documentation task performs no new environment action. Local Git confirms merge and final-head tree/parent identities and the two-file delta. A fresh GitHub connector read confirms canonical `main = e8c307df07107736395f1b3b1f2d56bba3fec6be`. No Production DB counts are claimed or queried. This restamp performs no runtime, DB, Staging or Production action.

**Historical 2026-10-03 continuation (superseded by the #134 foundation gate above):** #130 is **CLOSED / COMPLETED, Outcome B**; PR #148 closed unmerged. #135 Full Booking Sheet pre-result duplicate-submit guard is the **active bounded candidate on PR #150, clear for Control Tower merge gate**. Claude independent high-risk audit completed 2026-10-03 with **A — PASS / CLEAR FOR CONTROL TOWER MERGE GATE**, no blocking findings; exact audited head/tree and non-blocking notes are recorded in section D. Merge execution remains governed by the Product Owner/Control Tower workflow; Production remains separately gated. #134 + #133 remain separate Level-3 payment integrity / observability work. **M1C/M2 remain behind the incident sequence; #149 is future M2A/M2B feedback, CAPTURE ONLY / DO NOT IMPLEMENT.** See section D.

### Preserved M1B accepted history

**M1B — All-Locations Booking Location Guard (Issue #120): PRODUCTION ACCEPTED / CLOSED / COMPLETED.** PR #122 squash-merged at `2026-09-30T00:21:41Z` as `3ac31c1a58732b8c3c4c34ef04ac19c7522565c0` (2026-09-29 Toronto). Merge tree `6d6097ad975b86e685ec161a82b742bb77e7f92b`; parent `e729dea51ad4888736d09cda705bd317dc6a1055`. Production deployment `dpl_AQDXaFxkSjJ4c2oX1CBZAjAk9jyX` is **READY / SUCCESS**, target `production`, unique URL `https://chasum-gb94c8tba-renovisionappcom.vercel.app`.

Direct Production `/api/build-info` HTTP 200: `commit=3ac31c1a58732b8c3c4c34ef04ac19c7522565c0`, `commitShort=3ac31c1`, `env=production`, `ref=main`, `production=true`. Direct `/api/health` HTTP 200: `ok=true`, `production=true`; `supabase=true`, `serviceRole=true`, `email=configured`, `cronSecret=configured`, `sms=optional_missing`, `stripe=optional_missing`, `sentry=optional_missing`, `softSchemaFallbacks=disabled`. Health proves configuration presence only, not active DB binding, provider delivery or worker execution. Public `/`, `/pricing`, `/status`, `/login`, `/book/gvm-baby-world` returned HTTP 200; `/status` rendered Operational. Merge-SHA Quality: **172 test files passed / 1 integration file skipped; 1,693 tests passed / 36 skipped / 0 failed**.

Authenticated real-GVM acceptance used existing account `gvmbabyworld@gmail.com` in the correct GVM Baby World tenant. Burlington, Brampton, Caledonia and All locations were visible. The operator deliberately switched Brampton → All locations; normal reload confirmed ALL persisted. A fresh Booking Sheet had empty Location / “Choose a location”, explicit Burlington/Brampton/Caledonia choices, Service and Employee disabled / “Choose a location first”, and Confirm appointment disabled. No customer, service, staff or time was chosen; no booking was created. The empty sheet was closed, workspace restored to **GVM Baby World Ultrasound Brampton**, and normal reload confirmed Brampton persisted, ALL no longer selected, Booking Sheet closed.

No Production tenant/database mutation, migration/schema/RLS/Auth/provider change or rollback occurred. Only operator workspace-scope cookie/UI state changed temporarily and was restored. Production DB counts were not queried for this spot-check. These are supplied accepted closeout observations; this documentation restamp performs no environment probe or action.

**Historical M1B continuation was #121; #121 is now closed as recorded above.**

### Preserved M1A accepted history

**M1A — Mobile Workspace Scope Control is PRODUCTION ACCEPTED / CLOSED.**

PR #118 merged to `main` as `2733729ebbf65442cf55eb53b4962aa672535617` on 2026-09-29T00:28:22Z. Exact hosted-tested runtime candidate was `26a4b328ea2b7de1fbf70cc3c28aa1ce23c24329`. The merge tree `cdce0b0b8425672bd9361563b20bb4fa6035d0f4` is byte-identical to the docs-closeout tree and differs from the hosted-tested runtime only in six Markdown files; all executable/runtime/config/test subtrees are mechanically reconciled. Automatic Vercel Production deployment `dpl_3gC2c7oAfXGdXJ4avdNpfPH7daT5` completed successfully. Direct Production `/api/build-info` and `/api/health` passed, and Quality on the exact Production SHA passed **1,665 / 36 skipped / 0 failed** including the Chromium containment test. Real GVM Production retained Burlington/Brampton/Caledonia and the accepted relationship truth; no Production booking or data mutation was manufactured. Claude Opus 5 High Development Control Tower verdict: **B — PRODUCTION ACCEPTED / M1A CLOSED, WITH NON-BLOCKING LIMITATIONS**; no further Production probe or rollback is required.

**The GVM technician mobile correction program remains open.** Preserved mobile sequence, behind the current financial-integrity gate above:
M1B CLOSED → #121 CLOSED → M1C Mobile Account Control → M2A Reception Phone Composition → M2B Calendar Phone Progressive Disclosure → M3 Command Centre Up Next Across Your Business → M4 Assign Later Level-3 architecture/data-integrity → M5 Summer Operating Intelligence (design now/build later).

Commercial SaaS Gate B / P2B is **PAUSED / PRESERVED** by Product Owner sequencing. Do not resume it automatically while the mobile program is the active continuation.

Prior accepted Production application release: `2733729ebbf65442cf55eb53b4962aa672535617` (PR #118 M1A). Production deployment `dpl_3gC2c7oAfXGdXJ4avdNpfPH7daT5` SUCCESS; exact build identity and health verified.

Prior accepted #102 runtime observation, preserved as history:

`934fe4c2d93f165f1b03189995f97ea2b32b8f4b`

This is the PR #103 Issue #102 squash merge. Vercel Production deployment:

`J6UTXrUeV4YjxRUfQU5hpAydBCe9`

is **SUCCESS** / "Deployment has completed". Direct `/api/build-info` HTTP 200 confirmed this exact SHA on `main`, `env=production`, `production=true`. Direct `/api/health` HTTP 200 reported `ok=true`, with Supabase/service-role/email/CRON secret configured and soft schema fallback disabled — byte-identical to the pre-merge baseline on `93a4fc1`. The served public bundle confirmed the Production data plane as Supabase `kxcydvhswkuzepwzzinq`. Later documentation-only merges may advance Git/serving SHA without changing application behavior, so fresh runtime evidence wins for consequential work.

Production Sentry remains OFF.

Prior accepted behavior-changing releases remain historically valid and are not rewritten: `93a4fc13bed2fb2bf6cb00ead8050878aad1adb9` (PR #100 Package C) and `35f8da7644fed8dfa46f70c3151610b6ae4f9dfa` (PR #97 Package C1).

## B. Issue #81 multi-location Stage 1 — COMPLETE / PRODUCTION ACCEPTED

Stage 1A, Stage 1B and Stage 1C are now accepted.

### Accepted architecture

- one Business Service Catalog;
- `service_locations` = Service offered-at truth;
- `staff_locations` = Staff works-at truth;
- `services.location_id` / `staff.location_id` remain primary/home compatibility during Stage 1;
- concrete `location_settings` / `location_hours` remain operational scheduling truth;
- public booking uses converged Location + Service + Staff + staff_services rules;
- Add Location uses snapshot/copy, **not live inheritance**;
- no duplicate Service rows;
- Staff is assigned deliberately;
- resources are not copied or treated as public-booking authority in Stage 1.

### Stage 1C release

Exact accepted PR head:

`457a6ab8da23c1104a81208338024511ab4f8115`

Squash merge:

`0a81084362ac43d076b35aa0cb463f4efd136afe`

Exact migration:

`supabase/migrations/20260922210000_issue_81_stage_1c_location_template.sql`

Git blob:

`748e9d0f6dd9d5796839b6a234222593d2f25bc2`

SHA-256:

`6a4e3285382d1d1fbd9592af70ec1e2476ac8c9bec28cd0ba6a0e3287b3cb98f`

Production ledger:

`20260923135852 / issue_81_stage_1c_location_template`

Staging and Production accepted.

Canonical location entitlement is now live:

- starter = 1
- professional = 3
- business = 6
- enterprise = unlimited

GVM remains a normal Starter tenant with 3 existing Locations grandfathered. Existing GVM rows remain intact; `can_add_location=false` until entitlement changes.

Hosted responsive acceptance:
- desktop PASS;
- tablet PASS;
- mobile 390×844 PASS after bounded Dialog stacking correction;
- mobile real create → deliberate Staff assignment → finish PASS;
- cleanup restored Test Studio baseline exactly.

Migrations 034–036 remain unapplied.

Stage 2 location overrides and Stage 3 live inheritance remain **DESIGN FOR NOW / BUILD LATER**.

### Stage-1 convergence completed by Issue #102

Issue #102 closed the last Stage-1 read-model gap without rewriting the accepted Stage 1 history above. It was legitimate post-acceptance contradictory operator evidence from real GVM Production use: Services reported "Offered here" at secondary Locations while Reception simultaneously demanded "add at least one service and one bookable employee", because Command Centre still read the legacy `services.location_id` scope.

Accepted outcome, live in Production at `934fe4c`:

- Command Centre, Services, Employees, Reception, Booking Sheet and public booking all read the same relationship truth (`service_locations` / `staff_locations` / `staff_services`).
- The permissive "Staff with null `location_id` works everywhere" fallback was **removed**; booking readiness is now stricter, never looser.
- `lib/booking/location-readiness.ts` models four states — `no-services`, `no-staff`, `no-service-staff-overlap`, `ready` — each naming the actual missing relationship.
- Historical #102 Booking Location precedence: existing appointment → explicit draft → active workspace → user preference → Business default. M1B now supersedes fresh-booking fallback in multi-location ALL with explicit choice; saved appointment/draft truth and sole-active behavior remain.
- Shared modal Sheet raised above persistent mobile navigation (`z-[60]` vs nav `z-50`).

Identity: audited candidate `af535ec9f1e86af0da59c7e199218af26a24a134`; hosted-accepted parent `5421facf97da019a1e2b375a541f25877145d6ef`; squash merge `934fe4c2d93f165f1b03189995f97ea2b32b8f4b` whose Git tree hash is byte-identical to the audited candidate (`4fd479460dd98a8a99a780d6ae182d2521b96972`). No migration, SQL, schema or RLS change. Issue #102 is **CLOSED / PRODUCTION ACCEPTED**.

### GVM Production relationship-data correction — COMPLETE / ACCEPTED

A separate governed Production **DATA** action, distinct from the software release. Shipping Issue #102 alone did not restore GVM bookability; it made the application state the true blocker. This correction supplied the missing relationships.

Executed scope, additive only:

- 6 additive non-primary `staff_locations` rows — Bobita Singh, Darshan Dindial and Summer Dindial each to Brampton **and** Caledonia.
- 2 additive non-primary Caledonia `service_locations` rows — "2nd visit of ultimate package" and "Elite Pro Package".
- **No** updates, **no** deletes, **no** `staff_services` changes, **no** home/default Location changes, **no** migrations, **no** schema/RLS changes.

Accepted post-correction state: Burlington 14 Services / 3 bookable Staff / 3 matched Staff; Brampton 14 / 3 / 3; Caledonia 14 / 3 / 3. All three readiness states = `ready`. **0 of 42** Service/Location combinations lack eligible Staff. Burlington remains home/default for all three Staff. `staff_services` unchanged at 25. Exact IDs and rollback keys are in the [Environment Manifest](../runtime/ENVIRONMENT_MANIFEST.md) `GVM-DATA-2026-09-26` record.

**GVM exposed the problem. GVM is not the architecture.** No tenant-specific application logic is authorized.

## C. Issue #73 governed switching/import — CLOSED / COMPLETED

Issue #73 is **CLOSED / COMPLETED** (2026-09-25). The customer-facing migration product is complete: Package A, B1, staff quota, B2 core, C1, C2 and C3 are all done, with Package C released to Production via PR #100 (`93a4fc13bed2fb2bf6cb00ead8050878aad1adb9`).

**Do not resume Package C2 or C3 preflight work.** The previous "Package C2 READ-ONLY preflight" next-action recorded in this handoff was already superseded by live GitHub and was removed on 2026-09-26. Do not reopen absent contradictory evidence.

Accepted package history is retained below for continuity.

Package A:
- COMPLETE / accepted deterministic preview foundation.

Package B1:
- MERGED / STAGING + PRODUCTION ACCEPTED.
- Production ledger `20260923185926 / governed_import_foundation`.

Staff quota:
- MERGED / STAGING + PRODUCTION ACCEPTED.
- Production ledger `20260923190213 / issue_73_staff_quota_hardening`.
- GVM remains grandfathered Starter with 3 active Staff against max 1; existing Staff were not removed/deactivated.

Package B2 core:
- MERGED / STAGING + PRODUCTION ACCEPTED.
- accepted release `06c7d502948a321b706ba07036724c9178e428e7`.
- Production ledger `20260923190501 / issue_73_package_b2_core`.
- exact migration SHA-256 `0f051b80fbdca7e199b8382e7d400785d408d73c6799beba17de0591c79c6062`.

Package C1 private artifact security foundation:
- **MERGED / STAGING + PRODUCTION ACCEPTED**.
- exact pre-merge release candidate `266afa531f34d8dd2578b869be060ff58d7b5616`.
- squash merge / accepted application release `35f8da7644fed8dfa46f70c3151610b6ae4f9dfa`.
- Production deployment `dpl_2G4VhsqnzyFBxxLE8czcM2dhes3y` READY.
- exact migration `20260923205834_issue_73_package_c1_private_artifacts.sql`.
- SHA-256 `c5bab138294b84de40e9644fcd604594db94b2d917a8f1b5dc601b58d9542089`.
- Production ledger `20260923232629 / issue_73_package_c1_private_artifacts`.
- private `import-artifacts` bucket live with `public=false`; Production remains 0 C1 sources / 0 artifacts / 0 bucket objects.
- RLS/FORCE RLS, zero client policies, service-role-only C1 RPC execution and no direct anon/authenticated table access verified.
- hosted Staging acceptance proved signed-upload exact-path behavior, replay/upsert resistance, private direct-access denial, owner-only authority, actual-byte verification, reviewed-plan fidelity, B2 bind while committing, concurrent cleanup fencing and hard reviewed-plan expiry.
- hosted Supabase missing-object shape `status=400/statusCode="404"` was discovered, narrowly corrected and independently audited before acceptance.
- final Staging synthetic teardown restored sources/artifacts/runs/refs/outcomes/bucket objects/synthetic users/businesses to zero.
- Production post-deploy: GVM unchanged 3 Locations / 14 Services / 3 Staff / 9 Appointments; background_jobs 611; communication_send_intents 17; import runs/refs/outcomes 0 / 0 / 0.
- no real Production import/source/customer artifact was created.

Locked Package C Product Owner decisions remain:
- Private Alpha migration = guided self-service, primary Business owner authorizes/commits;
- one uploaded CSV per governed run, with deterministic related-row expansion allowed;
- raw artifact max 24h, reviewed artifact terminal+~1h / hard 72h fail-closed retention;
- C3 reminder takeover is explicit per-run owner opt-in, default OFF.

## D. Historical 2026-10-03 gate — current continuation is #134 foundation above

**Issue #130 — CLOSED / COMPLETED, Outcome B.** Supplied Control Tower evidence records the governed real-iPhone non-Production Quick Appointment pass: `deposit` / `5000` / `e_transfer` survived state and submitted FormData, returned `payment=recorded`, and matched Staging persistence. All exact temporary Staging fixture/artifact rows were cleaned to zero; PR #148 closed unmerged. No Production/GVM/schema/Auth mutation occurred. This clean instrumented pass narrows hypotheses; it does not prove or fix the original loss mechanism.

**Issue #135 / PR #150 — ACTIVE CANDIDATE / CLEAR FOR CONTROL TOWER MERGE GATE.** Branch `codex/issue-135-duplicate-submit`, base `cd919ea681961e0f4ed5327a5da767d1782a639f`. The create-only session guard blocks immediate duplicate dispatch, releases on a returned no-appointment result, and resets on close/reopen; edit saves and the #131 result lock remain intact. Competitive Product Gate **NOT_APPLICABLE** for this bounded integrity correction. Local focused 14/14 and broader booking/payment 392/392 tests and typecheck PASS; targeted lint retains the base's 2 errors / 1 warning. Control Tower independently reports `npm run build` PASS / exit 0 and full unit suite PASS / exit 0: **178 files passed / 1 skipped; 1,734 tests passed / 36 skipped / 0 failed (1,770 total)**. These additional results are supplied evidence, not new runs by this documentation reconciliation.

**Independent Claude high-risk audit: COMPLETED 2026-10-03.** Supplied audit result for exact head `c45513c8cc3b7d4ab1a1188dc02c596558f60ff0`, tree `190897b4502f435d65a66862a51abc40644e314a`: **A — PASS / CLEAR FOR CONTROL TOWER MERGE GATE**, with no blocking findings and no blocking correction required. Claude requires no additional browser acceptance and no Product Owner decision for the technical merge gate.

Non-blocking audit notes: the post-throw conservative lock now depends explicitly on `createSubmitGuardRef`; do not clear it on an error path. Issue #134 must account for per-session `payment_idempotency_key` reuse on a legitimate corrected retry. The changelog now attributes five new cases failing on base with two create calls to Claude: three immediate-overlap cases and both same-sheet retry cases.

**Historical next action (superseded):** Control Tower docs-only commit / PR #150 update, then Product Owner/Control Tower governed merge action. This documentation session must not commit, push, update the PR, merge, deploy, mutate environments or alter release controls. No #135 merge or Production acceptance/release is implied; Production remains separately gated by the governed release workflow and Product Owner approval.

Incident sequence: **#131 PRODUCTION ACCEPTED → #130 CLOSED Outcome B → #135 / PR #150 audit A / clear for Control Tower merge gate → #134/#133 separate Level-3 payment integrity + observability work → final GVM operational acceptance.** M1C remains NOT STARTED and M2 stays behind this sequence. **Issue #149: CAPTURE ONLY / DO NOT IMPLEMENT** — future M2A/M2B Calendar-first Reception and progressive disclosure Product Owner feedback. #123 remains OPEN / POST-M1B SAFE / deferred tech debt; P2B remains PAUSED; migrations 034–036 remain unapplied; Issue #57 remains separately DEFERRED.

## E. Other accepted program state

- Observability / Issue #65 — **CLOSED / COMPLETE**. Production Sentry remains OFF.
- Issue #72 tenant identity — **CLOSED / PRODUCTION ACCEPTED**.
- Phase 5 GVM booking/communications acceptance — **COMPLETE**.
- Issue #73 governed switching/import — **CLOSED / COMPLETED**.
- Issue #102 multi-location readiness truth — **CLOSED / PRODUCTION ACCEPTED**.
- GVM Production relationship-data correction — **COMPLETE / ACCEPTED**.
- Issue #57 branded domain — **OPEN but DEFERRED** by Product Owner decision `5745462206`. `https://chasum.vercel.app` remains the Private Alpha Production hostname; `https://staging.chasumai.com` remains Staging. `chasumai.com` / `www.chasumai.com` were attached Vercel-side before the stop; GoDaddy DNS, Supabase Auth Site URL, Production `NEXT_PUBLIC_APP_URL` and redeploy were NOT changed. Preserve Microsoft 365 and Resend mail DNS.
- PR #105 / Slice 0A: COMPLETE / merged / Production verified; stale assertions corrected; quality REQUIRED (integration `15368`) alongside Vercel + competitive-product-gate, per PO/supervisor dispatch. Remaining non-blocking debt: pre-existing React-Compiler lint debt in `quick-appointment.tsx` / `sheet.tsx`; a 36px Employee-profile control below the Chasum ≥40px touch floor.
- Dependency findings: **#109 remains OPEN** after prior applicability triage. Dated baseline audits: 25 full (3 low / 8 moderate / 13 high / 1 critical), 9 omit-dev (0 / 2 / 6 / 1). #113 candidate: 22 full (3 / 8 / 11 / 0), 5 omit-dev (0 / 2 / 3 / 0); both audit commands exit 1 for residual findings. Next is absent from the candidate advisory entries; separate Momentic sharp 0.35.3 remains affected. Package-entry counts are not independent CVEs, runtime reachability or compromise evidence. September 30 release remains a future follow-up, not installed or automated.
- GVM and Chasum HQ remain normal tenants. Platform Admin / Control Centre remains a separate protected control plane at `/owner`; Chasum HQ is **not** Platform Admin.

## F. Agent governance — current model

Do not blindly restore historical agent assignments if they are stale.

- **Darshan** = Founder / CEO / Product Owner.
- **ChatGPT** = Chasum AI Executive / Product & Development Program Lead / Control Tower, beneath Darshan.
- **Claude** = independent high-risk / Level-3 auditor.
- **Codex** = Primary Engineering Implementer.
- **Momentic/equivalent** = browser/workflow validation; **Cursor** = local/authenticated/device-specific fallback.
- **Independent audit** = assigned separately according to risk.

One primary implementer per task. Codex remains primary implementer; the current PO-locked assignment supersedes historical Control Tower wording. Live GitHub/repository/runtime truth remains authoritative over stale handoffs. Closed/accepted work stays closed absent contradictory evidence.

The World-Class / Mission / Summer / Competitive re-anchor happens **once per major Chasum chapter**, not every few hours. Re-open strategic review only on new contradictory evidence, material divergence from the accepted contract, materially stale competitive evidence, or explicit Product Owner reconsideration.

## G. New-chat bootstrap

```text
Repository: renovisionai2-cloud/chasum. This is not a fresh project.

Read:
1. docs/CURRENT_PROJECT_STATE.md
2. docs/handoffs/LATEST_HANDOFF.md
3. docs/runtime/ENVIRONMENT_MANIFEST.md
4. docs/company/CHASUM_BIBLE.md
5. docs/company/PRODUCT_PRINCIPLES.md
6. docs/company/GLOBAL_GO_TO_MARKET.md
7. live GitHub Issues and PRs

Freshly query remote main/runtime and live GitHub before acting.

MISSION: Chasum is becoming THE WORLD'S MOST INTELLIGENT AI-POWERED BUSINESS
OPERATING SYSTEM FOR SERVICE-BASED BUSINESSES. Not booking software, not a
scheduler, not a CRM, not a payment tool, not an AI receptionist, not a chatbot.
Connected chain: Customer -> Booking -> Appointment -> Staff -> Location ->
Service -> Payment -> Invoice -> Receipt -> Communication -> Follow-up ->
Reporting -> Automation -> Summer Intelligence.

PERMANENT PRINCIPLE:
CHASUM ADAPTS TO HOW THE BUSINESS OPERATES.
THE BUSINESS SHOULD NOT HAVE TO REORGANIZE ITSELF TO FIT CHASUM.
GLOBAL ARCHITECTURE NOW. REGIONAL ACTIVATION DELIBERATELY.
No tenant-specific application logic is authorized.

MULTI-LOCATION OPERATING MODEL (governing architecture):
Business -> Locations. One Business Service Catalog; each Service offered at
ONE/SOME/ALL Locations. Each Staff member works at ONE/SOME/ALL Locations.
Each Staff member provides ONE/SOME/ALL Services. Bookability at a Location =
Service offered there + Staff permitted there + Staff provides it + applicable
hours/availability. service_locations / staff_locations / staff_services carry
operating truth. Home/default Location and legacy primary Service Location are
metadata only and never mean "only here". GVM exposed the problem; GVM is not
the architecture.

SUMMER = AI BUSINESS MANAGER:
UNDERSTAND -> EXPLAIN -> RECOMMEND -> ACT safely with permission -> AUDIT ->
later AUTOMATE SAFELY -> later OPERATE PROACTIVELY. Do not bolt an AI label onto
conventional SaaS. Multi-location UNDERSTAND/EXPLAIN/RECOMMEND are supported;
ACT is blocked by the Employee assigned-location persistence gap.

WORLD-CLASS STANDARD (do not copy these products):
Apple simplicity/clarity/polish; Stripe truth/reliability/financial confidence;
Linear speed/hierarchy/efficient workflows; Notion flexibility/adaptable
business structure; OpenAI intelligence; Framer visual quality; Calendly
scheduling simplicity; Jane workflow trust/usability; Fresha/Vagaro operational
breadth. Standing question: "If a mature service business sees Chasum beside its
existing software, why does Chasum feel like an upgrade?" Passing tests means
technically credible, NOT world class. Always ask both "Does it work safely?"
and "Would a real business prefer this experience to the mature software it
already uses?"

Latest accepted behavior-changing Production application release:
664fbc734c4103d78484c6b3828849a6605a562f   (PR #131 / #129, governed Production accepted)
PR #125 / #121 at e8c307df07107736395f1b3b1f2d56bba3fec6be remains accepted history.
Prior #102/PR #103 acceptance at 934fe4c remains historical and valid.

Issue #81 Stage 1 COMPLETE / Production accepted.
Issue #73 CLOSED / COMPLETED - do NOT resume Package C2 or C3.
Issue #102 CLOSED / PRODUCTION ACCEPTED.
GVM Production relationship-data correction COMPLETE / ACCEPTED.
Issue #57 branded domain OPEN but DEFERRED by PO decision 5745462206.
Migrations 034-036 remain unapplied.

NEXT GATE:
#131 PRODUCTION ACCEPTED; #130 CLOSED Outcome B.
#135 / PR #150 and Phase A / PR #154 are MERGED TO MAIN / NOT PRODUCTION ACCEPTED.
Base main / design source: 31115e6a51b71fc097c279d205065d80e0be3573.
#134 payment-attempt foundation is PREPARED ONLY / NOT APPLIED.
Draft PR #155 on branch codex/issue-134-payment-attempt-foundation is the
governed prepared-only candidate; see PR #155 for the exact current head.
Read docs/reviews/issue-134-payment-attempt-foundation.md and the exact migration
20261004190341_issue_134_payment_attempt_foundation.sql before review.
Claude Level-3 Verdict B received; R-1 through R-7 corrected and R-8 through R-10 recorded.
Next: READY FOR GROK 4.7 HIGH FINAL RE-CHALLENGE.
PO Option A remains approved: lifetime paid/spend/deposits Unknown; current balances
numeric only with successful complete agreeing sources. Weak booking dedupe remains.
Migration passed a fresh temporary localhost-only PostgreSQL 17.11 execution proof;
it remains NOT APPLIED to any Chasum environment. No Supabase/Staging/Production/GVM
connection/mutation, live fixture, provider operation or deployment occurred. No runtime
writer, #133 disclosure or Reporting re-source implemented.
Migration application requires a separate future Product Owner gate.
Then separate PO migration/application gate -> #134 canonical writer/retry/reconciliation
-> #133 durable observability/disclosure -> Reporting re-source -> approved isolated
Staging fault/concurrency acceptance -> separately approved Production release
-> GVM OPERATIONAL ACCEPTANCE.
Six historical GVM USD rows UNCHANGED / #152; broad ACL/FORCE-RLS #153 separate.
Environment Manifest and release controls unchanged. No Production deployment authorized.
GVM OPERATIONAL ACCEPTANCE NOT earned; normal technician payment/deposit workflows held.
M1C/M2/Time Blocker held; #149 CAPTURE ONLY; #123 deferred; P2B PAUSED.
N-2 fail-closed completeness and N-3 non-booking USD fallback remain later runtime inputs.

AGENT GOVERNANCE: Darshan = Founder / CEO / Product Owner and ultimate business authority.
ChatGPT = Chasum AI Executive / Product & Development Program Lead / Control Tower.
Codex = sole primary implementer. Claude = independent high-risk / Level-3 auditor.
Momentic/equivalent = browser/workflow validation; Cursor = local/authenticated/device fallback.

Re-anchor Mission/World-Class/Summer/Competitive ONCE PER MAJOR CHAPTER, not
every few hours.

REQUESTED IS NOT RUNNING remains mandatory for all external-agent dispatch.
Proceed automatically through safe read-only gates; stop only for a genuine
Product Owner decision.
```

Refresh this handoff after major releases, phase/incident closure, architecture/governance changes, every few significant PRs, or approximately weekly during heavy development.
