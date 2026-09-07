# Production recovery state

**Status:** Canonical recovery facts that must not live only in chat  
**Authority:** Repository `/docs` plus hashed local operator packages under `/private/tmp`  
**Last updated:** 2026-09-07  
**Updated by:** Staging worker runtime validation (Cursor). Ledger/history remain committed. Worker process and booking send path are **not** fully runtime-certified.

This file records governed Production recovery and the next worker-reliability gate. It does **not** authorize Production deploys, Cron enablement, worker invocation, or GVM technician testing.

---

## KNOWN / APPROVED

| Fact | Value |
|------|--------|
| Production Supabase | `kxcydvhswkuzepwzzinq` |
| Staging Supabase | `wnfahklzaxirftyskctd` |
| Production app pin / `main` | `476af17bfd06113281df0b5c33f995ccb26f5fff` |
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
| Staging live unique/CAS probe | **PASS** on synthetic rows only: same `intent_key` allowed across two businesses; duplicate within one business rejected; first claim UPDATE won; second pending-predicate UPDATE returned zero rows; completed job not reclaimable; synthetic rows deleted after. Existing Staging queue left at **20 pending / 0 processing**. |
| Migrations 034 / 035 / 036 | **UNAPPLIED** (locked) |
| Phase 5 public named-staff booking | **STAGING-VERIFIED** on `cursor/phase-5-booking-path-convergence`; Production cutover **NOT AUTHORIZED** |
| Hotfix branch | `codex/production-worker-reliability-hotfix` (implementation `448969aa2dc1c12aab7b16ae9e672b7b70bf8882` parented on Production pin `476af17`) |
| Send-intent migration SHA256 | `51bcf061763dd972be3ef7b6696a59de9230c75be4cebbc22971cca541efddbf` (`supabase/migrations/20260905024239_communication_send_intents.sql`) |

`docs/CURRENT_PROJECT_STATE.md` (stamp 2026-09-04 / Phase 5) is **stale** relative to completed Production 029. Do not treat that file as the recovery ledger until a later governed restamp.

---

## NEW / CHANGED (this slice)

- Local worker/idempotency suite re-run: focused **165 passed / 5 skipped**, then worker-reliability file **61 passed** after adding unsupported-type and malformed-email cases. Full suite **515 passed / 1 failed / 5 skipped**. Failure remains unrelated `tests/unit/marketing/multi-business-selection.test.ts`. Five skips are opt-in local PostgreSQL claim tests (`CHASUM_RUN_LOCAL_PG_CLAIM_TEST=1`). TypeScript PASS. Changed-file ESLint PASS. `next build --webpack` PASS.
- Staging `processPendingJobs` was **not** invoked. Flag remains default-off. 20 pre-existing pending jobs were not claimed. No external email/SMS was sent.
- Hotfix application deploy to Staging/Preview: **not done**.
- Momentic MCP unavailable (auth timeout). Booking smoke was not run. Production browser targets were not used.

---

## UNRESOLVED

- Staging **app** runtime of this hotfix (Preview/Staging deploy with `CHASUM_WORKER_RELIABILITY_ENABLED=false`, then isolated flag-on synthetic worker): **not done**.
- Isolated Staging synthetic provider send (test inbox only) through `runDurableSend` / worker process: **not done**.
- Booking → appointment → job → worker → send-intent end-to-end on the hotfix revision: **not done**.
- Momentic Staging booking regression: **not run**.
- Opt-in local PostgreSQL claim rehearsal: **not re-run** this slice (requires dedicated socket DB with `communication_send_intents` absent).
- Production apply of the send-intent migration: **forbidden until a separate Production authorization gate**.
- Production deploy of the hotfix / flag enablement / Cron restore: **forbidden**.
- Production worker recovery: **not complete**.
- Webhook **dispatch** idempotency beyond atomic job claim: **not certified**.

---

## LOCKED DECISION

- Do not reopen Phase 5 accepted Staging booking work.
- Do not apply 034/035/036.
- Do not remove the Production hold or enable Production Cron from this slice.
- Do not invoke the Production worker or send Production communications.
- Do not invoke the Staging worker against the existing 20 pending jobs.
- Do not infer provider acceptance from timeouts; `sending`/`unknown` intents are not auto-reclaimed.
- GVM technician testing remains **deferred**. Do not mark GVM testing active.

---

## Next governed gate (not an authorization)

1. Deploy this hotfix to Staging/Preview only, flag **off**, drain, then an isolated flag-on synthetic worker against **new** test jobs with a stub or controlled test inbox. Do not process the existing 20 pending Staging jobs.
2. Bounded booking → communication proof on that deploy. Momentic `web/chasum-test-studio-booking-smoke.test.yaml` may be used only against a non-Production base URL and must not submit customer PII unless a governed test inbox exists.
3. Independent high-risk Production readiness audit.
4. Separate consequential Production authorization: hold remains; apply ledger to Production; deploy flag-off; verify; enable flag; isolated synthetic test; only then consider Cron.

---

## Operator artifacts (local, not git)

| Path | Role |
|------|------|
| `/private/tmp/chasum-prod-029-v2-run.sh` | Production 029+ACL V2 apply wrapper (already used / committed) |
| `/private/tmp/chasum-production-029-repair-acl-v2/` | Locked V2 package |
| `/private/tmp/chasum-staging-send-intents-apply.sh` | Staging-only ledger apply wrapper (SQL already applied; do not re-run) |
| `/private/tmp/chasum-worker-reliability-hotfix/` | Git worktree for `codex/production-worker-reliability-hotfix` |
| `/private/tmp/chasum-staging-history-recon/` | Migration-history repair probes |
| `/private/tmp/chasum-staging-worker-runtime/` | This slice’s local/Staging validation receipts (no secrets committed) |
