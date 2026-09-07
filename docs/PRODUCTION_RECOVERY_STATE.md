# Production recovery state

**Status:** Canonical recovery facts that must not live only in chat  
**Authority:** Repository `/docs` plus hashed local operator packages under `/private/tmp`  
**Last updated:** 2026-09-07  
**Updated by:** Pre-Production runbook lock (Cursor). Claude audit **B — APPROVED WITH BOUNDED PRE-PRODUCTION CONDITIONS**. Isolated Staging application runtime remains **PASS**. Production worker recovery is **not** complete.

This file records governed Production recovery facts. It does **not** authorize Production deploys, Cron enablement, worker invocation, flag enablement, hold removal, or GVM technician testing.

Canonical rollout sequence: [`docs/PRODUCTION_WORKER_RECOVERY_RUNBOOK.md`](./PRODUCTION_WORKER_RECOVERY_RUNBOOK.md).

---

## KNOWN / APPROVED

| Fact | Value |
|------|--------|
| Production Supabase | `kxcydvhswkuzepwzzinq` |
| Staging Supabase | `wnfahklzaxirftyskctd` |
| Production app pin / `main` | `476af17bfd06113281df0b5c33f995ccb26f5fff` |
| Audited hotfix HEAD | `358047676b5161bd684074d6999bc6677cff155d` (`codex/production-worker-reliability-hotfix`) |
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
| Production `communication_send_intents` | **NOT APPLIED** |
| Production hotfix deploy | **NOT DEPLOYED** |

`docs/CURRENT_PROJECT_STATE.md` (stamp 2026-08-25 / Phase 5) is **stale** relative to completed Production 029 and this worker-recovery chapter. Do not treat that file as the recovery ledger. Companion pointers to this file and the runbook were added for findability only; the control board was not restamped.

---

## SMS `skipPreferenceCheck` invariant

Any future Production direct-context SMS producer may set `payload.skipPreferenceCheck` **only** for a server-governed communication where bypassing customer opt-out / preferences is explicitly valid under the approved communication policy.

Normal appointment / customer SMS **must** continue to respect preferences.

Do **not** imply that arbitrary direct-context SMS may bypass consent. The isolated Staging harness used the flag only on uniquely marked synthetic jobs with stubbed providers.

---

## Webhook bounded treatment

- Job **claim atomicity** verified on Staging (one winner; stub dispatch only).
- External webhook delivery idempotency is **NOT certified**. Webhooks are **not** covered by `communication_send_intents`.
- Initial Production worker recovery must **hold webhook jobs from external dispatch**. Preferred treatment: exclude / hold webhook jobs during the first worker recovery.
- Proper webhook delivery-idempotency remains **DESIGN FOR NOW / BUILD LATER**. Do not redesign webhook dispatch in this recovery.

---

## NEW / CHANGED (this slice)

- Claude audit of immutable hotfix `358047676b5161bd684074d6999bc6677cff155d`: **B**, no P0, no P1, no code correction.
- Canonical Production rollout sequence locked in [`docs/PRODUCTION_WORKER_RECOVERY_RUNBOOK.md`](./PRODUCTION_WORKER_RECOVERY_RUNBOOK.md).
- Required gates recorded: (1) PostgREST / Data API ledger visibility after SQL COMMIT; (2) hosted flag-off boot of the exact audited revision; (3) pre-flag-on RLS/grant/fleet check; (4) isolated Production synthetic proof using the Staging harness safety design; (5) legacy durable-v1 protocol disposition plus webhook hold before any normal processing / Cron restore.
- This documentation slice did not apply, deploy, enable, invoke, or communicate.

---

## UNRESOLVED / remaining controlled-rollout gates

None of the following has started. None is authorized by this file.

1. **Gate 1** — Apply send-intent ledger to Production `kxcydvhswkuzepwzzinq` only, then prove PostgREST visibility.
2. **Gate 2** — Deploy audited hotfix with `CHASUM_WORKER_RELIABILITY_ENABLED=false`; prove hosted boot, held worker, no queue processing, no communications.
3. **Gate 3** — Read-only pre-flag-on RLS / grants / mixed-fleet check. Do not `ALTER ROLE`. Do not add V3 policies.
4. Controlled flag enablement (`true`); Cron remains disabled; do not call `processPendingJobs`.
5. **Gate 4** — Isolated Production synthetic proof (marked rows, stubbed providers, `processClaimedJob` only, real-queue fingerprint unchanged).
6. **Gate 5** — Classify legacy pending email/SMS/reminder jobs missing `sendIntentProtocol = durable-v1`; choose a governed disposition; keep webhooks held from external dispatch.
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
- Do not remove the Production hold or enable Production Cron from this documentation slice.
- Do not invoke the Production worker or send Production communications.
- Do not invoke the Staging worker against the existing 20 pending jobs.
- Do not infer provider acceptance from timeouts; `sending`/`unknown` intents are not auto-reclaimed.
- Do not silently process legacy jobs that lack `durable-v1`.
- Do not dispatch webhooks during initial Production worker recovery.
- GVM technician testing remains **deferred**. Do not mark GVM testing active.

---

## Next governed gate (not an authorization)

Separate consequential **Production authorization** to begin runbook step B: apply only `20260905024239_communication_send_intents.sql` to Production `kxcydvhswkuzepwzzinq`, then Gate 1 PostgREST visibility.

Until that authorization exists: hold ON, Cron DISABLED, worker stopped, no communications, hotfix not deployed, flag not enabled.

---

## Operator artifacts (local, not git)

| Path | Role |
|------|------|
| `/private/tmp/chasum-prod-029-v2-run.sh` | Production 029+ACL V2 apply wrapper (already used / committed) |
| `/private/tmp/chasum-production-029-repair-acl-v2/` | Locked V2 package |
| `/private/tmp/chasum-staging-send-intents-apply.sh` | Staging-only ledger apply wrapper (SQL already applied; do not re-run) |
| `/private/tmp/chasum-worker-reliability-hotfix/` | Git worktree for `codex/production-worker-reliability-hotfix` |
| `/private/tmp/chasum-staging-history-recon/` | Migration-history repair probes |
| `/private/tmp/chasum-staging-worker-runtime/` | Prior slice’s local/Staging SQL validation receipts (no secrets committed) |
| `/private/tmp/chasum-isolated-staging-runtime-summary.json` | Isolated application-runtime scenario summary (no PII; no secrets) |
