# Phase 5 / 041 Production cutover — source of truth

**Approval:** `CHASUM-PO-20260911-PROD-PHASE5-041-DIRECT-CUTOVER`  
**Status:** CUTOVER MUTATION PHASE COMPLETE — READY FOR CURSOR SMOKE. Existing candidate promoted; two scheduled ticks passed; GVM Main timezone corrected. Hold ON, Cron ENABLED, webhooks OFF. Browser smoke and final passive observation remain pending.
**Last updated:** 2026-09-11 (successful existing-deployment promotion and timezone verification at 23:37 UTC)
**Do not edit** `supabase/migrations/041_book_public_appointment_server_financials.sql`.

This file records governed facts so they do not live only in chat. It does **not** authorize hold removal, webhook enablement, Cron disablement, 040, or 034/035/036.

---

## Approval and migration intent

| Fact | Value |
|------|--------|
| Product Owner approval | `CHASUM-PO-20260911-PROD-PHASE5-041-DIRECT-CUTOVER` |
| Production 040 | **Never executed.** Intentionally superseded for Production by 041. |
| Production 041 | **Applied directly** and **retained**. Do not reapply. |
| 041 file SHA256 | `c2aaf4971ff72845ed9e1a77fd6f6778abc20374529d1ad88ffbf8a4ea326ec6` |
| 034 / 035 / 036 | **Not executed.** Remain locked. |
| PostgREST discovery | **PASS** — `OPTIONS /rest/v1/rpc/book_public_appointment` HTTP 200; Allow includes `POST` and `OPTIONS`. No RPC invocation in this recapture. |
| `book_public_appointment` | Approved body verified in Production catalog; OPTIONS discovery accepted. Legacy `create_public_appointment` retained. Management OpenAPI is not required by the final gate. |

041 body contract (already verified; not re-applied): exists; approved 14-argument signature; `SECURITY DEFINER`; owner `postgres`; `search_path=public`; PUBLIC execute absent; anon/authenticated execute present; appointments RLS unchanged.

---

## First application-deploy attempt (rolled back)

| Fact | Value |
|------|--------|
| Candidate SHA | `6bf2aa068dcb6c7f196e06afa54d95dc8b75b880` |
| First Production deploy | `dpl_3EyinVKvEXC2gukeTU7jig6MSDvk` (`chasum-9dekigy9o-renovisionappcom.vercel.app`) |
| Outcome | Rolled back. Prior serving fleet restored. |
| Restored serving | `dpl_HLeaPWS86vixmStimVkfmqtvR8CH` (`chasum-1qit0oy3i-renovisionappcom.vercel.app`) |
| Canonical-alias HTTP 403 | **Expected recovery-hold denial**, not candidate health failure. Cursor independently attributed `/api/health` and `/api/build-info` 403s to `rule_chasum_production_recovery_hold_PqG80Y` (**Chasum Production Recovery Hold**, Domain Environment = Production Domains, deny). Requests did **not** reach Next.js. |

---

## Fresh recapture immediately before the second deploy

Captured 2026-09-11 after the rollback and before creating a second Production application deployment.

### Local

- Candidate worktree `/private/tmp/chasum-runtime-safety` HEAD **exactly** `6bf2aa068dcb6c7f196e06afa54d95dc8b75b880`.
- Clean worktree (no dirty tracked/untracked files).
- Clean `git archive` of that SHA can be built.

### Production application / Vercel

- Serving deployment still `dpl_HLeaPWS86vixmStimVkfmqtvR8CH`.
- All three Production aliases inspect to that deployment: `chasum.vercel.app`, `chasum-renovisionappcom.vercel.app`, `chasum-git-main-renovisionappcom.vercel.app`.
- Hold **ON**: Firewall enabled; 1 active custom rule; canonical alias `/api/health` and `/api/build-info` HTTP **403**.
- Cron **ENABLED**: `disabledAt` null; schedule `*/5 * * * *`; path `/api/cron/process-jobs`; `deploymentId` = `dpl_HLeaPWS86vixmStimVkfmqtvR8CH`; host `chasum-1qit0oy3i-renovisionappcom.vercel.app`. Recent scheduled ticks HTTP 200 `processed:0`.
- `CHASUM_WORKER_RELIABILITY_ENABLED` **present** on Production (object `2lM2039GMKY8NK9g`; unchanged since enablement).
- `CHASUM_WORKER_WEBHOOKS_ENABLED` **absent**.
- Production env names present: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`.
- `autoAssignCustomDomains` currently **false** (rollback leftover). Git-main alias still required explicit reconciliation on the next forward deploy.

### Database (`kxcydvhswkuzepwzzinq`)

- 041 RPC still present (OpenAPI + OPTIONS). 040 was not executed.
- Held webhook `1060a548-7518-4e8f-8741-302400d55d4c`: **pending**, `attempts=0`, `started_at=NULL`.
- Queue: processing **0**, failed **0**. Only pending row is the held webhook.
- Canonical GVM business `a04e1d65-eeb9-4d72-a5bf-739a9038bb91` timezone **America/Toronto**.
- Main/Burlington location `ebe0b761-a207-4ca7-96ed-ad835a06e2cc` timezone **America/New_York** (timezone cutover still pending at the start of this attempt).

### N2

- `--level error` last 24h: empty.
- Recent Production runtime: info only. No `appointment_reconciliation_required`. No appointment-route 5xx. No error-level `scope=worker` / `scope=notifications`.

---

## Second application-deploy attempt (rolled back — Cron did not auto-align)

Executed 2026-09-11 under the same approval. Artifact was a clean `git archive` of exact SHA `6bf2aa068dcb6c7f196e06afa54d95dc8b75b880` plus minimum `.vercel/project.json` only. This docs commit was **not** deployed.

| Fact | Value |
|------|--------|
| Archive deploy started | 2026-09-11T21:54:09Z |
| New deployment | `dpl_7VR1peGzMg3gA2PYxXZ8Ag1AEbV8` |
| Immutable URL | `https://chasum-lg11i5hf2-renovisionappcom.vercel.app` |
| READY / target | READY / `production` |
| Provenance | CLI `--meta gitCommitSha=6bf2aa068dcb6c7f196e06afa54d95dc8b75b880` |
| Immediate auto-alias | Only `chasum-renovisionappcom.vercel.app` moved. `chasum.vercel.app` and git-main remained on `dpl_HLeaP…` (`autoAssignCustomDomains` was **false**). |
| Alias reconciliation | `vercel alias set` of both remaining Production aliases onto `chasum-lg11i5hf2-renovisionappcom.vercel.app` at 21:58:35Z–21:58:37Z. Re-read **3/3 MATCH** new deployment. `staging.chasumai.com` not modified. |
| Canonical-alias 403 | **Expected hold denial.** `https://chasum.vercel.app/api/health` and `/api/build-info` HTTP 403, `server: Vercel`, `x-vercel-mitigated: deny`. Firewall still Enabled; custom rule **Chasum Production Recovery Hold** `rule_chasum_production_recovery_hold_PqG80Y` Deny/Enabled. |
| Immutable-host `/api/health` | **PASS** via existing `vercel curl` Deployment Protection automation (no new credential). HTTP 200 `ok=true` `production=true` `supabase=true` `serviceRole=true` `email=configured` `cronSecret=configured` `softSchemaFallbacks=disabled`. Optional SMS/Stripe/Sentry `optional_missing` (not failures). |
| Immutable-host `/api/build-info` | **PASS** HTTP 200 `env=production` `production=true`. `commit`/`ref` null on the archive deploy (SHA recorded in Vercel deployment meta instead). |
| Cron after alias 3/3 | **DID NOT AUTO-ALIGN.** `enabled=true`, `disabledAt=null`, schedule `*/5 * * * *`, path `/api/cron/process-jobs`, but `deploymentId` remained `dpl_HLeaPWS86vixmStimVkfmqtvR8CH` and host remained `chasum-1qit0oy3i-renovisionappcom.vercel.app`. `targets.production` also remained `dpl_HLeaP…`. |
| Promote probe | `vercel promote dpl_7VR1…` returned **409** “already the current production deployment” while `GET /v9/projects/…` still showed `targets.production` + Cron on `dpl_HLeaP…`. No Cron PATCH was performed. |
| Scheduled ticks on new host | **NOT RUN / NOT ACCEPTABLE.** Cron never targeted the new deployment. No manual `crons run`. |
| Application cutover | **FAIL** at Step 5. Timezone / trigger / fingerprint steps **not executed**. |
| Approved rollback | `vercel rollback dpl_HLeaPWS86vixmStimVkfmqtvR8CH` 2026-09-11T22:04:04Z–22:04:07Z. |

### Restored safe state after second-attempt rollback

Captured 2026-09-11T22:04:25Z.

- Serving `dpl_HLeaPWS86vixmStimVkfmqtvR8CH` (`chasum-1qit0oy3i-renovisionappcom.vercel.app`).
- Production aliases **3/3** inspect to that deployment.
- `targets.production` = `dpl_HLeaP…`.
- Cron **ENABLED**, `disabledAt` null, `deploymentId` = `dpl_HLeaP…`, host `chasum-1qit0oy3i-renovisionappcom.vercel.app`, schedule `*/5 * * * *`, path `/api/cron/process-jobs`.
- `autoAssignCustomDomains` now **true** (restored by the rollback).
- Hold **ON** (same recovery-hold rule). Canonical `/api/health` HTTP 403 `x-vercel-mitigated: deny`.
- Webhook flag **absent**. Reliability env **present**.
- 041 OPTIONS discovery still **PASS**. 040 never executed.
- Held webhook `1060a548-7518-4e8f-8741-302400d55d4c`: pending, attempts=0, started_at null.
- Queue: 581 rows; processing 0; failed 0; only pending row is the held webhook.
- GVM business timezone still **America/Toronto**. Main/Burlington location timezone still **America/New_York**.
- N2 `--level error` 24h on restored serving deploy: empty. No `appointment_reconciliation_required`.
- `staging.chasumai.com` remained a separate Staging-target deployment.

---

## Historical pending state after the second-attempt rollback (superseded below)

- A later Production application deployment of SHA `6bf2aa0` that also auto-aligns Cron/`targets.production` (do **not** PATCH Cron).
- Two scheduled Cron ticks on that intended new deployment.
- GVM location timezone `America/New_York` → `America/Toronto`.
- Cursor smoke (Path A: immutable Production URL). Final observation.

Hold remains **ON**. Cron remains **ENABLED**. Webhooks remain **OFF**. 041 remains **retained**. This file’s later docs-only commit must **not** be deployed.


---

## Final existing-deployment promotion and timezone correction — 2026-09-11

Authority: `CHASUM-PO-20260911-PROD-PHASE5-041-DIRECT-CUTOVER`, with direct user authorization for promotion, conditional guarded timezone UPDATE, and failure rollback. Earlier failed attempts above remain historical evidence.

### Intermediate promotion / rollback

An intermediate promotion around 22:14 UTC proved that `vercel promote` moved the true Production target, Cron and all three aliases without a rebuild. Required verification was blocked by automatic approval review applying older access restrictions; the approved rollback restored the old fleet. Subsequent explicit read-only authorization established immutable-host health/build-info PASS at 22:18 UTC and verified 041, queue/ledger, and location safety. A later promotion attempt was blocked before execution until direct mutation authorization superseded the read-only stop. No new deployment resulted from these promotion attempts.

### Final application acceptance

- Existing deployment: `dpl_7VR1peGzMg3gA2PYxXZ8Ag1AEbV8`.
- Immutable URL: `https://chasum-lg11i5hf2-renovisionappcom.vercel.app`.
- Exact functional SHA: `6bf2aa068dcb6c7f196e06afa54d95dc8b75b880` (deployment metadata; archive build-info commit/ref are null).
- Supported `vercel promote` succeeded; alignment verified at **23:29:27 UTC**. No rebuild or new deployment.
- `targets.production`, Cron deploymentId/host, and all three Production aliases identify the candidate. No manual alias action or Cron PATCH required. Staging alias unchanged.
- `autoAssignCustomDomains`: false before promotion, true afterward; no direct setting mutation.
- This closes the control-plane mismatch from the second deploy: alias assignment alone had not moved `targets.production` or Cron. Promotion is the supported cutover operation after rollback.
- Prior deployment-bound health at **22:18:04 UTC** remains applicable: HTTP 200, ok/production/supabase/serviceRole true, email/cronSecret configured, soft-schema fallback disabled. Build-info HTTP 200, env=production. No redundant post-promotion health requirement.
- Canonical alias 403 remains the intended recovery-hold denial under the accepted attribution; hold not weakened.

| Scheduled tick | Request ID | Deployment / host | Result |
| --- | --- | --- | --- |
| 23:30 UTC; application log `2026-09-11T23:30:37.892Z` | `cbcvw-1789169436204-7ac4db27614d` | `dpl_7VR1peGzMg3gA2PYxXZ8Ag1AEbV8` / `chasum-lg11i5hf2-renovisionappcom.vercel.app` | GET `/api/cron/process-jobs`, HTTP 200, processed=0 |
| 23:35 UTC; application log `2026-09-11T23:35:36.873Z` | `kb968-1789169736109-4b1ace99fb6a` | Same exact deployment / host | GET `/api/cron/process-jobs`, HTTP 200, processed=0 |

Both request records correlate with processed-jobs application logs. Bounded error/fatal, appointment-reconciliation and appointment API 5xx searches returned zero results before the timezone write and after it. Reliability true; webhook flag absent. No manual worker/Cron invocation or provider send. Two ticks establish worker-path acceptance, not provider delivery or complete browser acceptance.

### Exact timezone mutation and proof

Fresh pre-write SQL at **23:36:34 UTC** confirmed zero non-internal `public.locations` triggers and the expected business/location relationship. The exact guarded UPDATE returned **one row** for location `ebe0b761-a207-4ca7-96ed-ad835a06e2cc`, business `a04e1d65-eeb9-4d72-a5bf-739a9038bb91`, changing only timezone `America/New_York` → `America/Toronto`.

Post-write SQL at **23:37:10 UTC** confirmed:

- Business timezone unchanged: America/Toronto; Main location now America/Toronto; IDs unchanged.
- Canonical appointment count 4; ordered id/start_time/end_time fingerprint unchanged: `d3cb4ab0887014e490024324ed57ac46`.
- All 3 other location rows unchanged; full-row fingerprint `2d5a88428d105c33450ba4130a564172` matched pre/post.
- No appointment write was issued; stored appointment instants unchanged.
- Queue remains 581: completed 12, cancelled 568, pending 1, processing 0, failed 0. Selected-field fingerprint unchanged: `ba8be1e71c7e7e8a3a63376ceed94514`.
- Ledger remains one accepted intent; fingerprint unchanged: `30a9ffb292a8b582d4eb0b5906f850e7`.
- Held webhook `1060a548-7518-4e8f-8741-302400d55d4c`: pending, attempts=0, started_at=NULL.

Queue fingerprint spelling above is the live value; the later execution attachment contained a truncated transcription. This was not queue drift.

### Database and protection invariants

041 was installed directly earlier on 2026-09-11, catalog-verified at 20:18 UTC and rechecked later; never reapplied during promotion. Its immutable SHA256 remains `c2aaf4971ff72845ed9e1a77fd6f6778abc20374529d1ad88ffbf8a4ea326ec6`. 040 intentionally never executed; 034/035/036 untouched. Final 041 body, grants, tenant checks and appointment RLS retained. No booking/RPC write probe.

Final Vercel verification: candidate is the true Production target; 3/3 aliases and Cron aligned; auto-assignment true; hold ON; Cron ENABLED (`*/5 * * * *`); reliability true; webhooks absent/OFF; Staging alias unchanged.

### Required handoff — STOP

**CUTOVER MUTATION PHASE COMPLETE — READY FOR CURSOR SMOKE.** Cursor canonical authenticated read-only smoke is PENDING. Final passive observation is PENDING and was not started. No booking submission, hold removal, webhook enablement, browser smoke, or Git push/main merge occurred. This docs-only local revision must not be deployed as another functional revision.
