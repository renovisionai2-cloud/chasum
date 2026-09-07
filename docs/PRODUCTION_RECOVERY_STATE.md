# Production recovery state

**Status:** Canonical recovery facts that must not live only in chat  
**Authority:** Repository `/docs` plus hashed local operator packages under `/private/tmp`  
**Last updated:** 2026-09-07  
**Updated by:** Staging migration-history reconciliation (Cursor). Physical send-intent schema was already committed; history metadata repaired to the governed version.

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
| Staging migration history | **RECONCILED** to governed version `20260905024239`. Generated remote identity `20260907190922` was marked `reverted` (absent from applied history). Physical schema **unchanged** during repair. |
| Migrations 034 / 035 / 036 | **UNAPPLIED** (locked) |
| Phase 5 public named-staff booking | **STAGING-VERIFIED** on `cursor/phase-5-booking-path-convergence`; Production cutover **NOT AUTHORIZED** |
| Hotfix branch | `codex/production-worker-reliability-hotfix` HEAD `32538a5aaabe06e764d63c3eb373a18a71316438` (hotfix `448969aa2dc1c12aab7b16ae9e672b7b70bf8882` parented on Production pin `476af17`) |
| Send-intent migration SHA256 | `51bcf061763dd972be3ef7b6696a59de9230c75be4cebbc22971cca541efddbf` (`supabase/migrations/20260905024239_communication_send_intents.sql`) |

`docs/CURRENT_PROJECT_STATE.md` (stamp 2026-09-04 / Phase 5) is **stale** relative to completed Production 029. Do not treat that file as the recovery ledger until a later governed restamp.

---

## NEW / CHANGED (this slice)

- Staging send-intent SQL had already been applied and schema/security verified. The connected apply recorded history as `20260907190922 communication_send_intents` instead of the governed filename timestamp.
- CLI `supabase migration repair` (metadata only): `20260907190922` → `reverted`, then `20260905024239` → `applied`.
- Post-repair remote history: `20260905024239` local=remote. `20260907190922` absent. Table/owner/constraints/RLS/FORCE RLS/policies/privileges identical to the pre-repair probe.
- Production was not targeted. Hotfix was not deployed. Worker was not invoked. No communications were sent.
- Worker claim is a conditional `UPDATE` (pending + tenant + attempts + schedule/retry + cancellation fences). Processing jobs are not stolen by timeout.
- `markRelatedJobs` no longer swallows errors as success; failed twin reconciliation returns `reconciliationRequired` and blocks retry.
- `CHASUM_WORKER_RELIABILITY_ENABLED` defaults **false**. Flag-off keeps the worker held.
- Local Vitest (prior slice): **515 passed / 1 failed / 5 skipped**. The failure is the known unrelated marketing test `tests/unit/marketing/multi-business-selection.test.ts`.

---

## UNRESOLVED

- Staging app deploy of the hotfix: **not done**.
- Staging worker runtime validation (synthetic send / duplicate / retry / claim): **not done**. This is the next governed Staging step.
- Momentic worker-adjacent regression: **not run**.
- Production apply of the send-intent migration: **forbidden until a separate Production authorization gate**.
- Production deploy of the hotfix / flag enablement / Cron restore: **forbidden**.
- Production worker recovery: **not complete**. Do not mark it complete from this Staging history repair.
- Webhook **dispatch** idempotency beyond atomic job claim: **not certified** by this hotfix (email/SMS/reminder durable send is).

---

## LOCKED DECISION

- Do not reopen Phase 5 accepted Staging booking work.
- Do not apply 034/035/036.
- Do not remove the Production hold or enable Production Cron from this slice.
- Do not invoke the Production worker or send Production communications.
- Do not infer provider acceptance from timeouts; `sending`/`unknown` intents are not auto-reclaimed.
- GVM technician testing remains **deferred** until Production is reopened and stable under a later governed gate.

---

## Next governed gate (not an authorization)

1. Staging worker runtime validation on `wnfahklzaxirftyskctd` only: deploy or Preview the hotfix with `CHASUM_WORKER_RELIABILITY_ENABLED=false`, then isolated synthetic send + duplicate/retry/claim proofs. No Production worker.
2. Separate consequential Production authorization: hold remains; apply ledger to Production; deploy flag-off; verify; enable flag; isolated synthetic test; only then consider Cron.

---

## Operator artifacts (local, not git)

| Path | Role |
|------|------|
| `/private/tmp/chasum-prod-029-v2-run.sh` | Production 029+ACL V2 apply wrapper (already used / committed) |
| `/private/tmp/chasum-production-029-repair-acl-v2/` | Locked V2 package |
| `/private/tmp/chasum-staging-send-intents-apply.sh` | Staging-only ledger apply wrapper (SQL already applied; do not re-run) |
| `/private/tmp/chasum-worker-reliability-hotfix/` | Git worktree for `codex/production-worker-reliability-hotfix` |
| `/private/tmp/chasum-staging-history-recon/` | Local before/after migration-list and catalog probes from this repair |
