# Production recovery state

**Status:** Canonical recovery facts that must not live only in chat  
**Authority:** Repository `/docs` plus hashed local operator packages under `/private/tmp`  
**Last updated:** 2026-09-10  
**Updated by:** Initial Production Cron restore **PASSED** 2026-09-10. Cron `/api/cron/process-jobs` **ENABLED** (`*/5 * * * *`) on serving `dpl_HLeaPWS86vixmStimVkfmqtvR8CH`. Hold **ON**. Webhooks **ABSENT**. N2 **LIVE**. Package B **COMPLETE**. Recovery **not complete**. Hold removal is a later separate decision.

This file records governed Production recovery facts. It does **not** authorize hold removal, webhook enablement, Package A, 034/035/036, or GVM technician testing. The 2026-09-10 initial Cron restore is recorded below as complete.

Canonical rollout sequence: [`docs/PRODUCTION_WORKER_RECOVERY_RUNBOOK.md`](./PRODUCTION_WORKER_RECOVERY_RUNBOOK.md).

---

## KNOWN / APPROVED

| Fact | Value |
|------|--------|
| Production Supabase | `kxcydvhswkuzepwzzinq` |
| Staging Supabase | `wnfahklzaxirftyskctd` |
| Production app pin / `main` | `476af17bfd06113281df0b5c33f995ccb26f5fff` |
| Audited hotfix **code** SHA | `358047676b5161bd684074d6999bc6677cff155d` (`codex/production-worker-reliability-hotfix`) |
| Audited hotfix **tree** | `5b72b1bacee8ba28760ed11c4cfd9d7d2c7a932e` |
| Deployment carrier SHA | `35cc40c49fdffb67adfe43227c16acf99db83936` (`deploy/worker-reliability-3580476`) |
| Deployment carrier parent | `358047676b5161bd684074d6999bc6677cff155d` |
| Deployment carrier tree | `5b72b1bacee8ba28760ed11c4cfd9d7d2c7a932e` (**identical** to audited code tree; empty metadata-only commit; **not** a new functional revision) |
| Carrier reason | Vercel `TEAM_ACCESS_REQUIRED` identity compatibility only. First CLI deploy `dpl_J6hgB4YPQH9CWAp8zTrxvnneCJB7` was blocked because git author `Darshan <darshan@mac.home>` has no GitHub/Vercel mapping. Carrier author is GitHub-mapped `renovisionai2-cloud <renovisionai2@gmail.com>`. Claude audit remains applicable to the identical tree. |
| Claude independent audit (hotfix tree `3580476`) | **B — APPROVED WITH BOUNDED PRE-PRODUCTION CONDITIONS**. **NO P0. NO P1. NO code correction required.** |
| Claude webhook-hold delta audit (`47c24ac`) | **B — APPROVED WITH BOUNDED DEPLOYMENT CONDITIONS**. **NO P0. NO P1. NO code correction required.** Outstanding pre-deploy condition (live Staging `job_type=neq.webhook` PostgREST proof) is **PASS**. |
| Claude tenant-integrity audit (`918e9cae`) | **B — APPROVED WITH BOUNDED DEPLOYMENT CONDITIONS**. **NO P0. NO P1. NO code correction required.** Audited SHA `918e9cae8bc069f96b84e4c1eb8bd8d63641bd74` / tree `cb151c93d1bac597eb991fbc3a1061f7483b13c2`. Hosted Staging/Preview producer proof **PASS**. Docs-only reconciliation applied onto this branch so recovery facts exist exactly once; functional files remain byte-identical to `918e9cae`. |
| Production 029 + ACL V2 | **COMMITTED AND VERIFIED** (approval `CHASUM-PO-20260905-PROD029-579-ACL-V2`) |
| Frozen recovery | 579 rows preserved; 11 completed; 568 cancelled; **no delete** |
| Production whole-project hold | **ON** (`Chasum Production Recovery Hold`, `rule_chasum_production_recovery_hold_PqG80Y`) |
| Production Cron `/api/cron/process-jobs` | **ENABLED** 2026-09-10 (`*/5 * * * *`; host `chasum-1qit0oy3i-renovisionappcom.vercel.app` / `dpl_HLeaPWS86vixmStimVkfmqtvR8CH`). Initial restore: scheduled GET 200s, `processed: 0`. |
| Worker invocation | **Manual invoke NOT authorized.** Scheduler-driven `/api/cron/process-jobs` is **ENABLED**. |
| Communications send | **NOT authorized** |
| `service_role.rolbypassrls` | **TRUE**. Do not `ALTER ROLE`. Do not add a V3 service-role RLS policy. |
| Production default table ACLs | Broad table DML for `anon` / `authenticated` / `service_role` owned by both `postgres` and `supabase_admin` is **known Production state, not new drift**. ACL V2 only normalized object privileges on `public.communications_audit_log`. Do **not** `ALTER DEFAULT PRIVILEGES` in this recovery. |
| Staging `communication_send_intents` schema | **COMMITTED** on Staging `wnfahklzaxirftyskctd` (table exists; owner `postgres`; unique `(business_id, intent_key)`; FORCE RLS; zero policies; `service_role` SELECT/INSERT/UPDATE; no DELETE; PUBLIC/anon/authenticated none) |
| Staging migration history | **RECONCILED** to governed version `20260905024239`. Generated `20260907190922` absent from applied history. |
| Staging live unique/CAS probe | **PASS** on synthetic rows only. Existing Staging queue left at **20 pending / 0 processing**. |
| Staging isolated application runtime | **PASS** against live `wnfahklzaxirftyskctd` using actual `claimBackgroundJob` / `processJob` / `runDurableSend` / `finalizeClaimedJob` / `markRelatedJobs` on synthetic rows only. Providers stubbed. `processPendingJobs` was **not** invoked. Existing queue fingerprint unchanged (pending sha256 `6918f1a71fd105fd8d5620b2ee9c7b59383465aa5e2a1a0be50e5b8dc37aeb36`). |
| Migrations 034 / 035 / 036 | **UNAPPLIED** (locked) |
| Phase 5 public named-staff booking | **STAGING-VERIFIED** on `cursor/phase-5-booking-path-convergence`; Production cutover **NOT AUTHORIZED** |
| Hotfix branch | `codex/production-worker-reliability-hotfix` (implementation `448969aa2dc1c12aab7b16ae9e672b7b70bf8882` parented on Production pin `476af17`; isolated-runtime lock `3580476`) |
| Send-intent migration SHA256 | `51bcf061763dd972be3ef7b6696a59de9230c75be4cebbc22971cca541efddbf` (`supabase/migrations/20260905024239_communication_send_intents.sql`) |
| Production `communication_send_intents` | **COMMITTED AND DATA-API VERIFIED** (Gate 1) |
| Production hotfix deploy (historical `3580476` tree) | Previous Ready carrier `dpl_J2LZfLWvvDF9MtCFN1WwnuH7j6pP` (`chasum-j6btoq0er-renovisionappcom.vercel.app`), SHA `35cc40c`, tree `5b72b1ba`. **Superseded.** No active Production alias remains on that tree. |
| Gate 5 webhook-hold Production deploy | Historical Ready `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb` (`47c24ac` / tree `461198bd`). **Superseded.** Immutable URL retained. |
| Tenant-integrity Production deploy | Historical Ready `dpl_HUvY9TtHdfzJTVHvGxJ6JFdJMLWF` (`chasum-njaw2b7qg-renovisionappcom.vercel.app`). gitCommitSha `bb1dbe604b5b2ed021c2c4a1059d6addd588cf63` (docs-only lineage of audited `918e9cae8bc069f96b84e4c1eb8bd8d63641bd74`). **Superseded as serving** by Package B `dpl_HLeaPWS86vixmStimVkfmqtvR8CH`. Immutable URL retained. Author `renovisionai2-cloud`. Source `cli`. Correct dardin.gvm Production-only `RESEND_API_KEY` (`9hF77dAtfP8TcG7S`, name **Chasum Production Runtime 2026-09-08 Correct**, domain `chasumai.com`) was baked into this deployment. |
| Active Production aliases | `chasum.vercel.app`, `chasum-renovisionappcom.vercel.app`, and `chasum-git-main-renovisionappcom.vercel.app` all → Package B `dpl_HLeaPWS86vixmStimVkfmqtvR8CH`. Prior serving `dpl_HUvY9TtHdfzJTVHvGxJ6JFdJMLWF` superseded; immutable URL retained. |
| `CHASUM_WORKER_RELIABILITY_ENABLED` | **true** on Production (`2lM2039GMKY8NK9g`) **and** a separate Preview-only row (`gDiNy9xDroUE41A8`). Development remains absent. |
| Gate 4 isolated Production synthetic | **PASS**. Marker `chasum-isolated-production-runtime-20260908`. Providers stubbed. `processClaimedJob` only. `processPendingJobs` never called. Pre/post 579-job id fingerprint `6dd23c8d499af1e43a97bf760ef5e99abfef3f05e15c322d5a7ec737ac428bfe`. Queue fingerprint sha256 `91fb161600101e1bef4d1f150ebc9698898a6f0a9526ba27ecae856b6a53ffe0`. Zero synthetic residue. Flag execution path proven because `processClaimedJob` requires `workerReliabilityEnabled()`. Webhook claim-only; external dispatch **not** certified. |
| Gate 5 classification (live Production) | **579** total; pending **0**; processing **0**; failed **0**; completed **11**; cancelled **568**. Ledger **0**. |
| Gate 5 legacy transactional disposition | **NO ELIGIBLE LEGACY-PROTOCOL TRANSACTIONAL BACKLOG EXISTS.** Pending email/SMS/reminder = **0**. Historical cancelled/completed rows were **not** mutated and were **not** bulk-stamped. |
| Gate 5 webhook backlog | pending **0**; processing **0**; failed **0**; completed **0**; cancelled **152**; due pending **0**. Other: `waitlist_notify` cancelled **64**. No `calendar_sync` / `recurring` rows. |
| `CHASUM_WORKER_WEBHOOKS_ENABLED` | Server-only. Exact `"true"` enables. **ABSENT** on Production, Preview, and Development after this deploy. Absent/false holds webhook jobs **out of** `processPendingJobs` candidate selection. **Must remain absent/false** through alias verification, transactional E2E, canary, and **initial Cron restore**. Turning webhooks on later is a **separate governed decision**. Webhook delivery idempotency remains **NOT solved**. |
| Gate 5 functional SHA | `47c24acb22db8d8da7cef9971357e1d26f87cffa` (`codex/production-worker-reliability-hotfix`). Tree `461198bd0b261ab38f39260d1f413dfa4f196f24`. **Deployed to Production** as `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`. Docs-only HEAD `7b08e16` was **not** deployed as a functional revision. Do not rewrite audited `3580476`. |
| Deployed transactional E2E | **PASS on Production `dpl_HUvY9Tt…` after Resend account cutover.** Marker `chasum-prod-tenant-integrity-e2e-20260908`. First canary against wrong-account key (`renovisionai2` / `auth.chasumai.com`) rejected. Correct-account key (`dardin.gvm` / verified `chasumai.com`) patched into existing env object `9hF77dAtfP8TcG7S` (Production-only). One additional worker attempt: email job `0f557d3e-…` **completed** (attempts 2); send-intent `16eeb227-…` **accepted** attempt 2, provider resend, `provider_message_id` present; webhook sibling held attempts 0. Historical 579 id fingerprint unchanged. No SMS. No second post-cutover invocation. |
| Live Staging `job_type=neq.webhook` PostgREST proof | **PASS** (2026-09-08). Target `wnfahklzaxirftyskctd`. Harness `scripts/run-staging-webhook-hold-runtime.mjs`. `CHASUM_WORKER_WEBHOOKS_ENABLED=false`. Providers stripped. `processPendingJobs` **not** invoked. Existing pending count **20** (12 reminder / 8 webhook). Independent fingerprint sha256 `6cee9ce8b54aed43283ae284e901ade24a9b0cd86a7eae2c800c0c33b7b58492` / idSha256 `21b4c321ff64dfe54e66c20e323f653448fda905bb73301cb5e2b9e552cb7491` unchanged pre/post. Synthetic residue **0**. |
| `SUPABASE_PROJECT_ID` in Production Vercel env | Contains Staging ref `wnfahklzaxirftyskctd`. **Unused** by `createServiceClient` / repo (zero references). Severity **P3**. Recommend **POST-RECOVERY CLEANUP**. Do not change Production env in Gate 5. |

`docs/CURRENT_PROJECT_STATE.md` (stamp 2026-08-25 / Phase 5) is **stale** relative to completed Production 029 and this worker-recovery chapter. Do not treat that file as the recovery ledger. Companion pointers to this file and the runbook were added for findability only; the control board was not restamped.

---

## SMS `skipPreferenceCheck` invariant

Any future Production direct-context SMS producer may set `payload.skipPreferenceCheck` **only** for a server-governed communication where bypassing customer opt-out / preferences is explicitly valid under the approved communication policy.

Normal appointment / customer SMS **must** continue to respect preferences.

Do **not** imply that arbitrary direct-context SMS may bypass consent. The isolated Staging harness used the flag only on uniquely marked synthetic jobs with stubbed providers.

---

## Webhook bounded treatment

- Job **claim atomicity** verified on Staging and in Gate 4 (one winner; stub dispatch only).
- External webhook delivery idempotency is **NOT certified**. Webhooks are **not** covered by `communication_send_intents`.
- Gate 5 implements server-only `CHASUM_WORKER_WEBHOOKS_ENABLED` (default OFF). `processPendingJobs` / `selectPendingJobCandidates` exclude `job_type=webhook` unless the value is exactly `"true"`. Held webhook rows stay pending; attempts and `started_at` are unchanged.
- Direct `claimBackgroundJob` on an explicit synthetic row remains available for isolated tests and does **not** enable the normal queue scan.
- Proper webhook delivery-idempotency remains **DESIGN FOR NOW / BUILD LATER**. Do not redesign webhook dispatch in this recovery.
- Live Staging PostgREST composition of `status=pending` + `scheduled_at` due + `next_retry_at` `.or(...)` + `.neq("job_type","webhook")` + `.order(...)` + `.limit(...)` is **PASS**. No enum/filter error. Synthetic webhook excluded; synthetic durable-v1 email included and processed on the isolated path only.
- `CHASUM_WORKER_WEBHOOKS_ENABLED` must remain absent/false through alias verification, transactional E2E, canary, and initial Cron restore. Turning webhooks on later requires a separate governed decision.
- Production deploy of `47c24ac` is **READY** (`dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`). Worker was **not** invoked. Webhook delivery idempotency remains unsolved.

---

## NEW / CHANGED (this slice)

- Package B communication consent **Production schema + app COMPLETE** 2026-09-10 and **accepted as complete**. Functional SHA `55905a44364d261a96a87fc5a1e0cbed9c168ab0` (tree `9f1e916dcdd505e9a959a3795bfcf627973b2662`). Serving `dpl_HLeaPWS86vixmStimVkfmqtvR8CH`. Mutation-based Production synthetic **NOT RUN — NO SAFE PRE-EXISTING PRODUCTION TEST TENANT**; Program Lead classified this **DESIGN FOR NOW / BUILD LATER** (does **not** block Package B). No permanent Production test tenant was created. Hold **ON**. Webhooks **ABSENT**. Package A remains separate. 034/035/036 remain blocked. Do not apply 027 wholesale. See [`docs/PACKAGE_B_COMMUNICATION_CONSENT.md`](./PACKAGE_B_COMMUNICATION_CONSENT.md).
- Claude **N2 operational monitoring LIVE** 2026-09-10. Method: existing Vercel Runtime Logs / Vercel CLI `vercel logs` (59.1.4). No new vendor. No Sentry. Named owner: Darshan / Product Owner; backup: Chasum HQ operations.
- **Initial Production Cron restore PASSED** 2026-09-10 (PO-authorized). Enablement: `PATCH /v1/projects/prj_nUq0i5faNZTNYfQHSsLukYTW8ugm/crons` `{"enabled":true}` only; schedule unchanged `*/5 * * * *`; no `crons run`; no manual `processPendingJobs`. First scheduled execution 2026-09-10T19:55:37.499Z GET `/api/cron/process-jobs` HTTP 200 `processed:0` latencyMs 690 on `dpl_HLeaPWS…`. Observation through 20:25:36Z: seven consecutive 200s, all `processed:0`. Additional scheduled 200 at 20:30:37Z during docs recapture also `processed:0`. Queue recapture 2026-09-10T20:36:24Z idSha256 `480f98cf458af85045a874fdafa560fa4e505567fb6b318d7a052c4a41105bbb` unchanged. Held webhook `1060a548-…` attempts 0 / started_at null. Send-intent still only canary `16eeb227-…` accepted. N2 governed signals: none. Hold remained **ON** (public 403). Webhooks remained **ABSENT**. Cron **left ENABLED**. Recovery **not complete**. Hold removal **not** authorized.
- Implemented `workerWebhooksEnabled()` / `CHASUM_WORKER_WEBHOOKS_ENABLED` default-off filter before claim in `selectPendingJobCandidates`.
- Claude webhook-hold delta audit **B**. Live Staging `job_type=neq.webhook` PostgREST proof **PASS**.
- Production deploy of `47c24ac` **READY** as `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`. No carrier. Active fleet reconciled including git-main. Reliability **true**. Webhook flag **ABSENT**. Queue/ledger fingerprint unchanged (`idSha256` `6dd23c8d499af1e43a97bf760ef5e99abfef3f05e15c322d5a7ec737ac428bfe`). Webhook cancelled rows remain **152**. Cron **DISABLED**. Hold **ON**. GVM **deferred**.
- Deployed transactional E2E **HOLD (B)**. Producer-path location_id defect on `POST /api/v1/appointments`. No test appointment/customer/job created. No provider send. Canary not started. Cron not enabled.
- `SUPABASE_PROJECT_ID` Production env mismatch classified **P3** unused/stale. Not changed.
- **ENV SECURITY — Resend application runtime cutover (2026-09-08, corrected):** Wrong-account temporary key (`renovisionai2`, owns `auth.chasumai.com`) caused the first canary 403. Correct historical application-mail account is **dardin.gvm** (verified `chasumai.com`). Existing Vercel env object `9hF77dAtfP8TcG7S` was patched in place to the sending-access key named **Chasum Production Runtime 2026-09-08 Correct**, still `target: ["production"]`, `customEnvironmentIds: []`. No second Resend key was created in this cutover beyond the already-created correct-account key. Historical keys were **not** revoked. Old local token file left untouched. Preview/custom staging still do not receive `RESEND_API_KEY`. Baked into `dpl_HUvY9TtHdfzJTVHvGxJ6JFdJMLWF`. Governance: **VERIFY CURRENT STATE BEFORE CHANGING STATE.** **NO DUPLICATE INFRASTRUCTURE OR CREDENTIAL CREATION FOR TOOLING PROBLEMS.**
- Hosted **Staging tenant-integrity validation** of pinned tree `918e9cae` / `cb151c93` (branch `codex/appointment-api-tenant-integrity-fix`, author `renovisionai2-cloud`) on **Preview only**: `dpl_FnRsuu8WpGfPNxzp8iJj7BCkTjDo` (`chasum-lebw8it2b-renovisionappcom.vercel.app`), `target=preview`, `readyState=READY`, deployment `meta.gitCommitSha` = `918e9cae8bc069f96b84e4c1eb8bd8d63641bd74`. No Production deploy, no alias, no promotion.
- Preview hosted identity: Supabase ref **`wnfahklzaxirftyskctd`** (Staging); Production ref `kxcydvhswkuzepwzzinq` **absent**. `RESEND_API_KEY` **ABSENT from Preview** — the Resend Production-only cutover is intact and Preview cannot send. `CRON_SECRET`, `CHASUM_WORKER_WEBHOOKS_ENABLED`, `TWILIO_ACCOUNT_SID`, `STRIPE_SECRET_KEY` all absent from Preview. `CHASUM_WORKER_RELIABILITY_ENABLED` proven **true at runtime** by an enqueued payload carrying `sendIntentProtocol: "durable-v1"`.
- **Producer-path `location_id` defect is CLOSED on this tree.** Hosted `POST /api/v1/appointments` returned **201** and persisted `location_id`, leaving exactly **one** eligible pending `durable-v1` customer email job plus one **pending** webhook sibling. No inline send, no SQL bypass, no debug endpoint, no worker invocation. This clears the blocking condition recorded for item 7 below.
- Location contract proven on Preview: single active location + omitted `location_id` → **201** with the correct fallback; two active locations + omitted `location_id` → **400** `location_id is required when multiple active locations exist`, no write, no job; zero active locations → **400**, no write, no job.
- Tenant isolation proven on Preview: cross-tenant `customer_id` / `location_id` / `service_id` / `staff_id` on POST → **400** each, and on PATCH → **400** each with the row unchanged and no extra job. No foreign-tenant name or email appeared in any response body.
- Cancellation idempotence proven: PATCH `status=cancelled` twice and DELETE twice each produced exactly **one** cancellation occurrence (1 email + 1 webhook), with **0** additional jobs on repeat. Foreign-tenant appointment id and random UUID both returned **404** with no event. Two parallel DELETE on the same uncancelled row returned **200 + 409** (single winner) — race **PROVEN**, not merely unreproducible.
- Retained foreign-reference DELETE **fails closed** for all four references (`customer`, `staff`, `service`, `location`): **409** `Appointment requires data reconciliation`, appointment **not** cancelled, **0** new jobs, no foreign-tenant PII in the response.
- Staging queue non-regression: pre-existing **28** jobs (**20 pending** / **8 completed**) fingerprint `9ec3013affc24300cd5ff312c9436ed04987dab2ba8f500c45747fc363413cef` **identical** before fixtures and after cleanup. Appointment↔reference `business_id` mismatch counts **0** before and after. Marker residue **0**. `communication_send_intents` remained **0** — no provider send was attempted. The existing Staging pending jobs were **not** processed.

---

## UNRESOLVED / remaining controlled-rollout gates

Gate 1 is complete. Remaining items below are not authorized by this documentation slice.

1. **Gate 1** — **PASS** (PostgREST / Data API visibility of `communication_send_intents` verified).
2. **Gate 2** — **PASS** (identical-tree carrier deployed, flag-off, hosted boot, held worker).
3. **Gate 3** — **PASS** after Gate 3A alias reconciliation. Do not `ALTER ROLE`. Do not add V3 policies.
4. Controlled flag enablement (`true`) — **PASS**. Cron remains disabled; do not call `processPendingJobs`.
5. **Gate 4** — **PASS**. Isolated Production synthetic proof (marked rows, stubbed providers, `processClaimedJob` only, real-queue fingerprint unchanged).
6. **Gate 5** — **PASS (code + live Staging proof + Production deploy of webhook-hold, then tenant-integrity SHA).** Live Production legacy 579 fingerprint unchanged. Webhook flag **ABSENT**. Reliability **true**. Hold ON. Cron DISABLED.
7. Deployed booking → job → worker → send-intent → test-inbox E2E. **PASS after correct-account Resend cutover.** Producer + N3 already PASS. First provider attempt rejected (wrong Resend account). Governed retry on `dpl_HUvY9Tt…` accepted exactly once. Eligible pending transactional retry is now **empty**.
8. Bounded manual canary (no webhook jobs) before Cron. **PASS.** Webhook sibling remains pending/held (`attempts=0`). Provider exactly-once **PASS** on the governed retry.
9. Separate decision to restore Production Cron. **PASS (initial restore 2026-09-10).** Cron **ENABLED** `*/5 * * * *`. Gate 9(a) N2 **LIVE**. Gate 9(b) Package B **COMPLETE**. Gate 9(c) pre/post/observation recaptures **PASS** (fingerprint unchanged). Webhook gate remains absent/false. Hold remains **ON**. This does **not** remove the hold and does **not** enable webhooks.
10. Production hold removal **last** (still **not** authorized).
11. GVM technician validation **only after recovery closes**.
12. Momentic booking regression: deferred if the connector remains unavailable; not a sole blocker.

Production worker recovery: **not complete**.

---

## LOCKED DECISION

- Do not reopen Phase 5 accepted Staging booking work.
- Do not apply 034/035/036.
- Do not perform ad-hoc no-git CLI Production deploys.
- Do not remove the Production hold. Initial Cron restore is complete; hold removal is a later governed decision.
- Do not disable the restored Production Cron unless a governed N2 / queue / webhook-claim hard stop requires it.
- Do not invoke `processPendingJobs` / `vercel crons run` / `POST …/crons/run` manually. Worker traffic must remain scheduler-driven through `/api/cron/process-jobs`.
- Do not set Production `CHASUM_WORKER_WEBHOOKS_ENABLED=true`. Keep it absent/false. Do not claim or cancel pending webhook `1060a548-7518-4e8f-8741-302400d55d4c`.
- Do not invoke the Staging worker against the existing 20 pending jobs.
- Do not infer provider acceptance from timeouts; `sending`/`unknown` intents are not auto-reclaimed.
- Do not silently process legacy jobs that lack `durable-v1`.
- Do not dispatch webhooks. Webhook delivery idempotency remains unsolved.
- GVM technician testing remains **deferred**. Do not mark GVM testing active.

---

## Next governed gate (not an authorization)

Initial Production Cron restore is **complete**. Cron remains **ENABLED**. Do **not** remove the Production hold. Do **not** enable webhooks. Continue documented N2 human cadence. Package B remains **COMPLETE**. **N4 hard gate:** before 034/035/036, `schedulingChanged` and DELETE `hasReferences` in `app/api/v1/appointments/[id]/route.ts` must be null-staff-safe. GVM remains deferred. Governance: **VERIFY CURRENT STATE BEFORE CHANGING STATE.** **NO DUPLICATE INFRASTRUCTURE OR CREDENTIAL CREATION FOR TOOLING PROBLEMS.**

---

## Operator artifacts (local, not git)

| Path | Role |
|------|------|
| `/private/tmp/chasum-prod-029-v2-run.sh` | Production 029+ACL V2 apply wrapper (already used / committed) |
| `/private/tmp/chasum-production-029-repair-acl-v2/` | Locked V2 package |
| `/private/tmp/chasum-staging-send-intents-apply.sh` | Staging-only ledger apply wrapper (SQL already applied; do not re-run) |
| `/private/tmp/chasum-prod-hotfix-47c24ac/` | Detached worktree pinned to functional SHA `47c24ac` used for this Production deploy |
| `/private/tmp/chasum-gate4-production-isolated/` | Temporary local Gate 4 runner / summary (not committed; no secrets) |
| `/private/tmp/chasum-staging-history-recon/` | Migration-history repair probes |
| `/private/tmp/chasum-staging-worker-runtime/` | Prior slice’s local/Staging SQL validation receipts (no secrets committed) |
| `/private/tmp/chasum-isolated-staging-runtime-summary.json` | Isolated application-runtime scenario summary (no PII; no secrets) |
| `/private/tmp/chasum-appointment-api-tenant-integrity/` | Detached worktree pinned to `918e9cae` / tree `cb151c93` used for the Preview-only tenant-integrity validation |
| `/private/tmp/chasum-appt-integrity-918e9cae/` | Phase 8–21 evidence, baseline/fingerprint JSON and marker-scoped cleanup scripts (no secrets; synthetic `@example.invalid` only) |
