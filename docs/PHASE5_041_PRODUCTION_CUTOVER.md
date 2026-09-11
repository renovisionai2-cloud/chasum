# Phase 5 / 041 Production cutover — source of truth

**Approval:** `CHASUM-PO-20260911-PROD-PHASE5-041-DIRECT-CUTOVER`  
**Status:** Partial Production fact. Migration 041 is committed and retained. Two application-deploy attempts of `6bf2aa0` were rolled back. Application/timezone cutover remains pending.  
**Last updated:** 2026-09-11 (second-attempt deploy + Cron-alignment rollback)  
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
| `book_public_appointment` | Present in Production OpenAPI. Legacy `create_public_appointment` retained. |

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

## Still pending after the second-attempt rollback

- A later Production application deployment of SHA `6bf2aa0` that also auto-aligns Cron/`targets.production` (do **not** PATCH Cron).
- Two scheduled Cron ticks on that intended new deployment.
- GVM location timezone `America/New_York` → `America/Toronto`.
- Cursor smoke (Path A: immutable Production URL). Final observation.

Hold remains **ON**. Cron remains **ENABLED**. Webhooks remain **OFF**. 041 remains **retained**. This file’s later docs-only commit must **not** be deployed.
