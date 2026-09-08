# Production recovery state

**Status:** Canonical recovery facts that must not live only in chat  
**Authority:** Repository `/docs` plus hashed local operator packages under `/private/tmp`  
**Last updated:** 2026-09-07  
**Updated by:** Gate 5 legacy + webhook disposition (Cursor). Gate 4 remains **PASS**. Gate 5 implementation is on this branch and **requires a bounded independent delta audit before Production deployment**. Original Claude audit **B** covers audited tree `3580476` / carrier `35cc40c` only and does **not** automatically cover this webhook-hold delta. Production worker recovery is **not** complete. Cron remains **DISABLED**. Hold remains **ON**.

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
| Claude independent audit | **B — APPROVED WITH BOUNDED PRE-PRODUCTION CONDITIONS**. **NO P0. NO P1. NO code correction required.** |
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
| Production hotfix deploy | **READY** identical-tree flag-on carrier `dpl_J2LZfLWvvDF9MtCFN1WwnuH7j6pP` (`chasum-j6btoq0er-renovisionappcom.vercel.app`), SHA `35cc40c`. Tree equals audited `3580476`. Prior flag-off Ready revision `dpl_BhgnhWnrTvuPsgs7kLwz2VGwU44z` is historical only (no active alias). |
| Active Production aliases | `chasum.vercel.app`, `chasum-renovisionappcom.vercel.app`, and `chasum-git-main-renovisionappcom.vercel.app` all → `dpl_J2LZfLWvvDF9MtCFN1WwnuH7j6pP`. |
| `CHASUM_WORKER_RELIABILITY_ENABLED` | **true** (Production only). Preview/Development remain absent. |
| Gate 4 isolated Production synthetic | **PASS**. Marker `chasum-isolated-production-runtime-20260908`. Providers stubbed. `processClaimedJob` only. `processPendingJobs` never called. Pre/post 579-job id fingerprint `6dd23c8d499af1e43a97bf760ef5e99abfef3f05e15c322d5a7ec737ac428bfe`. Queue fingerprint sha256 `91fb161600101e1bef4d1f150ebc9698898a6f0a9526ba27ecae856b6a53ffe0`. Zero synthetic residue. Flag execution path proven because `processClaimedJob` requires `workerReliabilityEnabled()`. Webhook claim-only; external dispatch **not** certified. |
| Gate 5 classification (live Production) | **579** total; pending **0**; processing **0**; failed **0**; completed **11**; cancelled **568**. Ledger **0**. |
| Gate 5 legacy transactional disposition | **NO ELIGIBLE LEGACY-PROTOCOL TRANSACTIONAL BACKLOG EXISTS.** Pending email/SMS/reminder = **0**. Historical cancelled/completed rows were **not** mutated and were **not** bulk-stamped. |
| Gate 5 webhook backlog | pending **0**; processing **0**; failed **0**; completed **0**; cancelled **152**; due pending **0**. Other: `waitlist_notify` cancelled **64**. No `calendar_sync` / `recurring` rows. |
| `CHASUM_WORKER_WEBHOOKS_ENABLED` | Server-only. Exact `"true"` enables. Absent/false holds webhook jobs **out of** `processPendingJobs` candidate selection (no claim, attempts/status unchanged). Direct `claimBackgroundJob` on an explicit row remains available for tests. **Not deployed to Production yet.** Webhook delivery idempotency remains **NOT solved**. |
| Gate 5 functional SHA | Recorded after commit on `codex/production-worker-reliability-hotfix`. **Requires bounded independent delta audit before Production deployment.** Do not treat Claude audit **B** as covering this delta. |
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
- Do **not** deploy this Gate 5 delta to Production until a bounded independent audit passes.

---

## NEW / CHANGED (this slice)

- Gate 5 live Production classification: pending **0** / processing **0**. Disposition: **NO ELIGIBLE LEGACY-PROTOCOL TRANSACTIONAL BACKLOG EXISTS.** Historical 579 rows not mutated.
- Implemented `workerWebhooksEnabled()` / `CHASUM_WORKER_WEBHOOKS_ENABLED` default-off filter before claim in `selectPendingJobCandidates`. Staging synthetic proof: existing 20 pending jobs unchanged; `processPendingJobs` was **not** invoked against Staging.
- This is a **new functional code change after Claude's audit**. It requires a **bounded independent delta audit** before Production deployment.
- `SUPABASE_PROJECT_ID` Production env mismatch classified **P3** unused/stale. Not changed.

---

## UNRESOLVED / remaining controlled-rollout gates

Gate 1 is complete. Remaining items below are not authorized by this documentation slice.

1. **Gate 1** — **PASS** (PostgREST / Data API visibility of `communication_send_intents` verified).
2. **Gate 2** — **PASS** (identical-tree carrier deployed, flag-off, hosted boot, held worker).
3. **Gate 3** — **PASS** after Gate 3A alias reconciliation. Do not `ALTER ROLE`. Do not add V3 policies.
4. Controlled flag enablement (`true`) — **PASS**. Cron remains disabled; do not call `processPendingJobs`.
5. **Gate 4** — **PASS**. Isolated Production synthetic proof (marked rows, stubbed providers, `processClaimedJob` only, real-queue fingerprint unchanged).
6. **Gate 5** — **PASS (code + Staging).** Live Production legacy pending backlog = 0. Webhook hold implemented, not Production-deployed. **Bounded independent delta audit required** before Production deploy of this revision.
7. Deployed booking → job → worker → send-intent → test-inbox E2E on a governed target (no customer PII).
8. Bounded manual canary (no webhook jobs) before Cron.
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
- Do not set Production `CHASUM_WORKER_WEBHOOKS_ENABLED=true` in this recovery slice.
- Do not deploy the Gate 5 webhook-hold delta to Production until a bounded independent audit passes.
- GVM technician testing remains **deferred**. Do not mark GVM testing active.

---

## Next governed gate (not an authorization)

Bounded **independent delta audit** of the Gate 5 webhook-hold revision, then a separately governed Production deploy of that audited SHA (still hold ON, Cron DISABLED, `CHASUM_WORKER_WEBHOOKS_ENABLED` absent/false). Do not start deployed booking E2E or GVM testing in that deploy step unless ChatGPT explicitly opens it.

---

## Operator artifacts (local, not git)

| Path | Role |
|------|------|
| `/private/tmp/chasum-prod-029-v2-run.sh` | Production 029+ACL V2 apply wrapper (already used / committed) |
| `/private/tmp/chasum-production-029-repair-acl-v2/` | Locked V2 package |
| `/private/tmp/chasum-staging-send-intents-apply.sh` | Staging-only ledger apply wrapper (SQL already applied; do not re-run) |
| `/private/tmp/chasum-prod-hotfix-3580476/` | Git worktree for identical-tree carrier `35cc40c` |
| `/private/tmp/chasum-gate4-production-isolated/` | Temporary local Gate 4 runner / summary (not committed; no secrets) |
| `/private/tmp/chasum-staging-history-recon/` | Migration-history repair probes |
| `/private/tmp/chasum-staging-worker-runtime/` | Prior slice’s local/Staging SQL validation receipts (no secrets committed) |
| `/private/tmp/chasum-isolated-staging-runtime-summary.json` | Isolated application-runtime scenario summary (no PII; no secrets) |
