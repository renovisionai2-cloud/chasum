# Production recovery state

**Status:** Canonical recovery facts that must not live only in chat  
**Authority:** Repository `/docs` plus hashed local operator packages under `/private/tmp`  
**Last updated:** 2026-09-08  
**Updated by:** Deployed transactional E2E attempt (Cursor). Verdict **H — OTHER SAFETY HOLD**. No test event created. No worker invocation. No provider send. Functional SHA `47c24ac` / tree `461198bd` remains **READY** on Production as `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`. Reliability **true**. Webhook flag **ABSENT**. Queue/ledger unchanged (579 / ledger 0). Cron **DISABLED**. Hold **ON**. GVM **deferred**. Canary is **not** next.

This file records governed Production recovery facts. It does **not** authorize Production deploys, Cron enablement, worker invocation, flag enablement, hold removal, or GVM technician testing.

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
| Production 029 + ACL V2 | **COMMITTED AND VERIFIED** (approval `CHASUM-PO-20260905-PROD029-579-ACL-V2`) |
| Frozen recovery | 579 rows preserved; 11 completed; 568 cancelled; **no delete** |
| Production whole-project hold | **ON** (`Chasum Production Recovery Hold`, `rule_chasum_production_recovery_hold_PqG80Y`) |
| Production Cron `/api/cron/process-jobs` | **DISABLED** |
| Worker invocation | **NOT authorized** |
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
| Gate 5 webhook-hold Production deploy | **READY** `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb` (`chasum-l0wyqu6yw-renovisionappcom.vercel.app`). gitCommitSha `47c24acb22db8d8da7cef9971357e1d26f87cffa`. Functional tree `461198bd0b261ab38f39260d1f413dfa4f196f24`. Author `renovisionai2-cloud <renovisionai2@gmail.com>`. Source `cli`. **No metadata-only carrier** (GitHub login mapped; no `TEAM_ACCESS_REQUIRED`). Rolling release **none**. |
| Active Production aliases | `chasum.vercel.app`, `chasum-renovisionappcom.vercel.app`, and `chasum-git-main-renovisionappcom.vercel.app` all → `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`. Cron host `chasum-l0wyqu6yw-renovisionappcom.vercel.app`. git-main was reassigned with the Gate 3A minimum alias procedure. |
| `CHASUM_WORKER_RELIABILITY_ENABLED` | **true** (Production only). Preview/Development remain absent. |
| Gate 4 isolated Production synthetic | **PASS**. Marker `chasum-isolated-production-runtime-20260908`. Providers stubbed. `processClaimedJob` only. `processPendingJobs` never called. Pre/post 579-job id fingerprint `6dd23c8d499af1e43a97bf760ef5e99abfef3f05e15c322d5a7ec737ac428bfe`. Queue fingerprint sha256 `91fb161600101e1bef4d1f150ebc9698898a6f0a9526ba27ecae856b6a53ffe0`. Zero synthetic residue. Flag execution path proven because `processClaimedJob` requires `workerReliabilityEnabled()`. Webhook claim-only; external dispatch **not** certified. |
| Gate 5 classification (live Production) | **579** total; pending **0**; processing **0**; failed **0**; completed **11**; cancelled **568**. Ledger **0**. |
| Gate 5 legacy transactional disposition | **NO ELIGIBLE LEGACY-PROTOCOL TRANSACTIONAL BACKLOG EXISTS.** Pending email/SMS/reminder = **0**. Historical cancelled/completed rows were **not** mutated and were **not** bulk-stamped. |
| Gate 5 webhook backlog | pending **0**; processing **0**; failed **0**; completed **0**; cancelled **152**; due pending **0**. Other: `waitlist_notify` cancelled **64**. No `calendar_sync` / `recurring` rows. |
| `CHASUM_WORKER_WEBHOOKS_ENABLED` | Server-only. Exact `"true"` enables. **ABSENT** on Production, Preview, and Development after this deploy. Absent/false holds webhook jobs **out of** `processPendingJobs` candidate selection. **Must remain absent/false** through alias verification, transactional E2E, canary, and **initial Cron restore**. Turning webhooks on later is a **separate governed decision**. Webhook delivery idempotency remains **NOT solved**. |
| Gate 5 functional SHA | `47c24acb22db8d8da7cef9971357e1d26f87cffa` (`codex/production-worker-reliability-hotfix`). Tree `461198bd0b261ab38f39260d1f413dfa4f196f24`. **Deployed to Production** as `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`. Docs-only HEAD `7b08e16` was **not** deployed as a functional revision. Do not rewrite audited `3580476`. |
| Deployed transactional E2E | **HOLD (H)**. 2026-09-08. Safe EMAIL path selected: hosted `POST /api/v1/appointments` on synthetic tenant `dac7c837-2f8e-40b5-99d4-b46c0081a13a` (“My Business” / P4 shell), operator plus-address inbox class only. **No event created.** Blocker: local runner cannot materialize Production Sensitive `RESEND_API_KEY` (`vercel env run` empty; `vercel env pull` non-secret sentinel for all Sensitive keys). Hosted `/api/health` reports `email: configured`. The only hosted worker entry is `/api/cron/process-jobs` → `processPendingJobs` (forbidden). No existing single-job hosted process route. Creating a pending Production email without a process path was refused. `processPendingJobs` not called. Webhook jobs not processed. Historical `idSha256` `6dd23c8d499af1e43a97bf760ef5e99abfef3f05e15c322d5a7ec737ac428bfe` unchanged. Ledger **0**. Webhook cancelled **152**. |
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

- Gate 5 live Production classification: pending **0** / processing **0**. Disposition: **NO ELIGIBLE LEGACY-PROTOCOL TRANSACTIONAL BACKLOG EXISTS.** Historical 579 rows not mutated.
- Implemented `workerWebhooksEnabled()` / `CHASUM_WORKER_WEBHOOKS_ENABLED` default-off filter before claim in `selectPendingJobCandidates`.
- Claude webhook-hold delta audit **B**. Live Staging `job_type=neq.webhook` PostgREST proof **PASS**.
- Production deploy of `47c24ac` **READY** as `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`. No carrier. Active fleet reconciled including git-main. Reliability **true**. Webhook flag **ABSENT**. Queue/ledger fingerprint unchanged (`idSha256` `6dd23c8d499af1e43a97bf760ef5e99abfef3f05e15c322d5a7ec737ac428bfe`). Webhook cancelled rows remain **152**. Cron **DISABLED**. Hold **ON**. GVM **deferred**.
- Deployed transactional E2E **HOLD (H)**. No test appointment/customer/job created. No provider send. Canary not started.
- `SUPABASE_PROJECT_ID` Production env mismatch classified **P3** unused/stale. Not changed.

---

## UNRESOLVED / remaining controlled-rollout gates

Gate 1 is complete. Remaining items below are not authorized by this documentation slice.

1. **Gate 1** — **PASS** (PostgREST / Data API visibility of `communication_send_intents` verified).
2. **Gate 2** — **PASS** (identical-tree carrier deployed, flag-off, hosted boot, held worker).
3. **Gate 3** — **PASS** after Gate 3A alias reconciliation. Do not `ALTER ROLE`. Do not add V3 policies.
4. Controlled flag enablement (`true`) — **PASS**. Cron remains disabled; do not call `processPendingJobs`.
5. **Gate 4** — **PASS**. Isolated Production synthetic proof (marked rows, stubbed providers, `processClaimedJob` only, real-queue fingerprint unchanged).
6. **Gate 5** — **PASS (code + live Staging proof + Production deploy).** Live Production legacy pending backlog = 0. Claude delta audit **B**. Webhook-hold tree `47c24ac` / `461198bd` is hosted on Production with webhook flag **ABSENT**, reliability **true**, hold ON, Cron DISABLED. Worker not invoked.
7. Deployed booking → job → worker → send-intent → test-inbox E2E on a governed target (no customer PII). **HOLD (H).** Retry only when Production provider credentials can be used on the explicit `claimBackgroundJob` → `processClaimedJob` path without `processPendingJobs`, a new debug endpoint, hold removal, or Cron enablement.
8. Bounded manual canary (no webhook jobs) before Cron. **Not started.** Requires E2E **PASS**.
9. Separate decision to restore Production Cron.
10. Production hold removal **last**.
11. GVM technician validation **only after recovery closes**.
12. Momentic booking regression: deferred if the connector remains unavailable; not a sole blocker.

Production worker recovery: **not complete**.

---

## LOCKED DECISION

- Do not reopen Phase 5 accepted Staging booking work.
- Do not apply 034/035/036.
- Do not perform ad-hoc no-git CLI Production deploys.
- Do not remove the Production hold or enable Production Cron from this documentation slice.
- Do not invoke the Production worker or send Production communications.
- Do not invoke the Staging worker against the existing 20 pending jobs.
- Do not infer provider acceptance from timeouts; `sending`/`unknown` intents are not auto-reclaimed.
- Do not silently process legacy jobs that lack `durable-v1`.
- Do not dispatch webhooks during initial Production worker recovery.
- Do not set Production `CHASUM_WORKER_WEBHOOKS_ENABLED=true` in this recovery slice. Keep it absent/false through E2E, canary, and initial Cron restore.
- Do not invoke `processPendingJobs` / the normal Production worker from this slice. Do not add a hosted single-job debug endpoint to bypass this hold.
- GVM technician testing remains **deferred**. Do not mark GVM testing active.

---

## Next governed gate (not an authorization)

Retry the **bounded deployed transactional E2E** after the provider-credential blocker is resolved. Do **not** start the manual canary. Hold remains ON. Cron remains DISABLED. `CHASUM_WORKER_WEBHOOKS_ENABLED` remains absent/false. Do not call `processPendingJobs`. Do not process webhook jobs. Do not start GVM testing unless ChatGPT explicitly opens it.

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
