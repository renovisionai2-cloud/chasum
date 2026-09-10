# Production worker recovery runbook

**Status:** Canonical Production rollout sequence after independent high-risk audit  
**Authority:** This file plus [`docs/PRODUCTION_RECOVERY_STATE.md`](./PRODUCTION_RECOVERY_STATE.md)  
**Last updated:** 2026-09-08  
**Updated by:** Correct dardin.gvm Resend cutover. Serving `dpl_HUvY9TtHdfzJTVHvGxJ6JFdJMLWF` / SHA `bb1dbe6` (functional = `918e9cae`). Synthetic retry **accepted**. Cron **DISABLED**. Hold **ON**. N2 not live. N4 blocks 034.  
**This file does not authorize Production execution.** It records the required gates. A later consequential Production authorization is still required before any step below is performed.

Code/contract for the hotfix itself remains [`docs/WORKER_RELIABILITY_HOTFIX.md`](./WORKER_RELIABILITY_HOTFIX.md). Do not treat that contract, this runbook, or chat history as permission to apply, deploy, enable flags, invoke the worker, restore Cron, or remove the Production hold.

---

## Immutable targets

| Item | Value |
|------|--------|
| Production Supabase | `kxcydvhswkuzepwzzinq` |
| Staging Supabase | `wnfahklzaxirftyskctd` |
| Production app pin / `main` | `476af17bfd06113281df0b5c33f995ccb26f5fff` |
| Audited hotfix **code** SHA | `358047676b5161bd684074d6999bc6677cff155d` |
| Audited hotfix **tree** | `5b72b1bacee8ba28760ed11c4cfd9d7d2c7a932e` |
| Deployment carrier SHA | `35cc40c49fdffb67adfe43227c16acf99db83936` |
| Deployment carrier branch | `deploy/worker-reliability-3580476` |
| Deployment carrier invariant | carrier tree **==** audited code tree; empty metadata-only commit; **not** a new functional revision; Claude audit remains applicable |
| Branch (code/docs) | `codex/production-worker-reliability-hotfix` |
| Repository | `renovisionai2-cloud/chasum` |
| Claude audit (hotfix tree `3580476`) | **B — APPROVED WITH BOUNDED PRE-PRODUCTION CONDITIONS**. NO P0. NO P1. NO code correction required. |
| Claude webhook-hold delta audit (`47c24ac`) | **B — APPROVED WITH BOUNDED DEPLOYMENT CONDITIONS**. NO P0. NO P1. NO code correction required. Live Staging `job_type=neq.webhook` PostgREST condition **PASS**. |
| Claude tenant-integrity audit (`918e9cae`) | **B — APPROVED WITH BOUNDED DEPLOYMENT CONDITIONS**. NO P0. NO P1. NO code correction required. Tree `cb151c93d1bac597eb991fbc3a1061f7483b13c2`. Docs-only reconciliation; functional files byte-identical to audited SHA. |
| Ledger migration | `supabase/migrations/20260905024239_communication_send_intents.sql` |
| Migration SHA256 | `51bcf061763dd972be3ef7b6696a59de9230c75be4cebbc22971cca541efddbf` |
| Reliability flag | `CHASUM_WORKER_RELIABILITY_ENABLED` |
| Webhook dispatch gate | `CHASUM_WORKER_WEBHOOKS_ENABLED` (server-only; default OFF; exact `"true"` enables) |
| Worker Cron | `/api/cron/process-jobs` |
| Staging isolated application runtime | **PASS** (synthetic jobs, stubbed providers; existing 20 pending Staging jobs unchanged) |
| Gate 5 webhook-hold Staging proof | **PASS** (live PostgREST `job_type=neq.webhook` on enum with pending/due/or/order/limit; synthetic marked rows; `processPendingJobs` not invoked; existing 20 pending fingerprint unchanged; residue 0) |
| Gate 5 webhook-hold functional SHA | `47c24acb22db8d8da7cef9971357e1d26f87cffa` (tree `461198bd0b261ab38f39260d1f413dfa4f196f24`). Delta audit **B**. Live Staging condition **PASS**. Production deploy **READY** `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`. No carrier. |

If the target environment is not Production `kxcydvhswkuzepwzzinq`, **STOP**.

---

## Locked exclusions

Do **not**:

- bulk-apply pending repository migrations
- apply 034 / 035 / 036
- `ALTER ROLE` / change `service_role.rolbypassrls`
- add a V3 service-role RLS policy on `communication_send_intents`
- `ALTER DEFAULT PRIVILEGES`
- globally enable the Staging worker over the existing 20 pending Staging jobs
- call `processPendingJobs` during isolated synthetic proof
- send customer/business communications during recovery
- process webhook jobs for external dispatch during initial worker recovery
- begin GVM technician testing until this recovery closes
- treat deployment success, SQL COMMIT, or flag enablement as completion

Webhook delivery-idempotency remains **DESIGN FOR NOW / BUILD LATER**. Do not redesign webhook dispatch in this recovery.

---

## A. Production maintenance state

Before any Production rollout step, all of the following must remain true:

- whole-project Production hold **ON** (`Chasum Production Recovery Hold`)
- Production Cron `/api/cron/process-jobs` **DISABLED**
- worker **stopped** / not invoked
- no customer or business communications sent
- exact Production project ref is `kxcydvhswkuzepwzzinq`
- work being rolled out is audited hotfix **code** `358047676b5161bd684074d6999bc6677cff155d` (Production deploy identity may be identical-tree carrier `35cc40c49fdffb67adfe43227c16acf99db83936`; tree must match)

This maintenance state stays in force through gates 1–5, isolated proof, legacy/webhook disposition, deployed E2E, and the manual canary. Cron restore and hold removal are later, separately governed steps.

---

## B. Production ledger migration

Apply **only** `20260905024239_communication_send_intents.sql` after confirming SHA256
`51bcf061763dd972be3ef7b6696a59de9230c75be4cebbc22971cca541efddbf`.

Immediately verify in SQL:

- `public.communication_send_intents` exists
- expected columns and unique `(business_id, intent_key)`
- RLS enabled
- FORCE RLS enabled
- zero policies
- `service_role` SELECT / INSERT / UPDATE
- `service_role` **no DELETE**
- PUBLIC / `anon` / `authenticated` **none**

### Required Gate 1 — PostgREST schema visibility

SQL COMMIT is not enough. Positively verify that PostgREST / the Data API sees `communication_send_intents` and required columns using the **service-role server path**.

Do not assume automatic schema-cache reload succeeded.

If Data API visibility fails: **HOLD**. Do not enable the reliability flag. Do not deploy as if the ledger were usable.

---

## C. Flag-off hotfix deployment

Deploy the **identical-tree deployment carrier** `35cc40c49fdffb67adfe43227c16acf99db83936` whose tree is exactly `358047676b5161bd684074d6999bc6677cff155d^{tree}` (`5b72b1bacee8ba28760ed11c4cfd9d7d2c7a932e`).

The carrier exists only so Vercel can associate a GitHub-mapped commit author (`renovisionai2-cloud <renovisionai2@gmail.com>`). It contains **no file changes**. Do not treat it as a new functional revision. Do not amend or rewrite audited `3580476`.

First CLI deploy of `3580476` itself (`dpl_J6hgB4YPQH9CWAp8zTrxvnneCJB7`) was blocked (`TEAM_ACCESS_REQUIRED`) because `Darshan <darshan@mac.home>` does not map to a GitHub/Vercel identity.

```
CHASUM_WORKER_RELIABILITY_ENABLED=false
```

Cron remains **DISABLED**. Do not invoke the worker.

### Required Gate 2 — Hosted flag-off boot

After deployment, verify:

- deployed git revision is the carrier SHA, **and** carrier tree equals audited `3580476` tree
- hosted application boots
- health / route sanity check passes
- worker endpoint remains held / inert
- no background queue processing
- no communications sent

Deployment success alone is **not** sufficient.

---

## D. Pre-flag-on Production check

### Required Gate 3

Read-only verify **all** of:

- `service_role.rolbypassrls = TRUE` (known Production state; do **not** `ALTER ROLE`)
- `communication_send_intents` FORCE RLS **ON**
- zero policies
- `service_role` grants exactly SELECT / INSERT / UPDATE
- `service_role` has **no DELETE**
- PUBLIC / `anon` / `authenticated` none
- every **active** Production alias, custom domain, project Production target, and Cron host is the identical-tree carrier of audited hotfix `358047676b5161bd684074d6999bc6677cff155d` (currently `35cc40c` / `dpl_BhgnhWnrTvuPsgs7kLwz2VGwU44z`)
- no rolling mixed-version fleet remains
- historical immutable Vercel deployment URLs are **not** active fleet unless an alias, scheduler, or custom domain still selects them

If any **active** alias/scheduler/custom domain mismatch: **HOLD**. Do not enable the flag. Do not create V3 RLS policies.

### Production deploy / alias controls

- No ad-hoc no-git CLI Production deploys.
- A Production deploy must record immutable commit SHA **and** tree SHA, with tree-equivalence to the audited code, before `vercel deploy --prod`.
- After every Production deployment, re-check all active Production aliases, custom domains, project Production target, and Cron host.
- Gate 3A (2026-09-07): reassigned `chasum-git-main-renovisionappcom.vercel.app` from pre-hotfix `dpl_HrPeWj7AC3HGpwK6fEesbFys7M1Y` (`476af17`) to carrier `dpl_BhgnhWnrTvuPsgs7kLwz2VGwU44z`. Old deployment was not deleted.
- Gate 5 deploy (2026-09-08): `vercel deploy --prod --yes --force` of detached worktree `47c24ac` → `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`. git-main was then reassigned with `vercel alias set dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb chasum-git-main-renovisionappcom.vercel.app`. Prior Ready `dpl_J2LZfLWvvDF9MtCFN1WwnuH7j6pP` was not deleted.

---

## E. Controlled flag enablement

Only after Gate 3 passes, enable:

```
CHASUM_WORKER_RELIABILITY_ENABLED=true
```

Cron remains **DISABLED**. Do **not** invoke `processPendingJobs`.

---

## F. Isolated Production synthetic proof

### Required Gate 4

Use the **same safety design** as the accepted Staging isolated harness
(`scripts/run-staging-isolated-worker-runtime.mjs` +
`tests/integration/staging-isolated-worker-runtime.test.ts`):

- uniquely marked synthetic rows only
- provider credentials absent or stubbed
- no real email / SMS / webhook provider
- `claimBackgroundJob` on an explicit synthetic job id
- `processClaimedJob` only
- **NEVER** `processPendingJobs`
- before/after fingerprint of the real Production queue
- synthetic cleanup only
- zero mutation of pre-existing jobs
- zero real communication

Do not invent a looser Production test.

If the real Production queue fingerprint changes unexpectedly: **HOLD**.

---

## G. Legacy protocol + webhook disposition

### Required Gate 5

Before any normal worker processing or Cron restore, classify **all** existing eligible Production jobs.

### Legacy transactional jobs

Live Production classification at Gate 5 (`2026-09-08T00:27:51Z`):

- pending email / SMS / reminder = **0**
- pending missing `sendIntentProtocol = durable-v1` = **0**

Governed disposition:

**NO ELIGIBLE LEGACY-PROTOCOL TRANSACTIONAL BACKLOG EXISTS.**

Do not mutate the 579 historical rows. Do not bulk-stamp old payloads.

If pending legacy transactional work appears later, hold those jobs for reconciliation (`legacy_send_intent_missing`). Do not silently process them.

### Webhook jobs

Webhook external delivery is **not** protected by `communication_send_intents`.

Claim atomicity was verified on Staging and Gate 4. External webhook delivery idempotency is **not certified**.

Live Production webhook backlog at Gate 5: pending **0**, processing **0**, failed **0**, completed **0**, cancelled **152**, due pending **0**.

Bounded hold (**Production-deployed** as `47c24ac` / `dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`; webhook flag **ABSENT**):

```
CHASUM_WORKER_WEBHOOKS_ENABLED
```

Absent / not exactly `"true"`: `selectPendingJobCandidates` / `processPendingJobs` exclude `job_type=webhook` **before claim**. Status, attempts, and `started_at` stay unchanged. Direct `claimBackgroundJob` on an explicit row remains available for isolated tests.

**Standing rule:** `CHASUM_WORKER_WEBHOOKS_ENABLED` must remain **absent/false** through:

- Production delta deployment of `47c24ac`
- alias verification
- transactional E2E
- canary
- **initial Cron restore**

Turning webhooks on later requires a **separate governed decision**. Do not enable the webhook gate by default.

Claude webhook-hold delta audit = **B**. Live Staging PostgREST proof of `.neq("job_type","webhook")` on the enum column with existing pending/due/or/order/limit composition = **PASS** (2026-09-08; existing 20 pending fingerprint unchanged; synthetic residue 0; no real providers). Production deploy of `47c24ac` is **READY** (`dpl_HUvurr39Dxwt8iqDwTA6u9G9A7Rb`). Worker was **not** invoked. Webhook delivery idempotency remains unsolved.

---

## H. Deployed end-to-end proof

Before Cron restore, run one bounded proof on a governed deployed target:

booking → background job → worker → send-intent → provider / test endpoint

Use a controlled test identity / inbox. No customer PII.

Prove:

- correct job protocol (`durable-v1`)
- exactly one transactional send
- accepted ledger state
- job finalization
- duplicate suppression

Momentic: run the bounded booking regression if the connector is restored. Momentic unavailability alone is not a blocker.

**2026-09-08 status: producer half PASS on Staging/Preview (`918e9cae` / `dpl_FnRsuu8WpGfPNxzp8iJj7BCkTjDo`); worker/send half HOLD.** Hosted `POST /api/v1/appointments` on that Preview persists `location_id` and enqueues one pending `durable-v1` customer email plus a held webhook sibling. No worker invocation, no provider send, `communication_send_intents` stayed 0. Production serving `47c24ac` / `dpl_HUvurr39` was **not** redeployed and still has the old producer defect. Do not Production-deploy `918e9cae` from this slice. Do not SQL-bypass. Do not add a debug endpoint. Do not enable scheduled Cron.

**Resend env:** `RESEND_API_KEY` id `9hF77dAtfP8TcG7S` is Production-only after the 2026-09-08 cutover. Preview is provider-disabled. Supabase Auth SMTP was already configured and was not changed. Historical Resend keys were not revoked. Serving Production still uses its baked legacy key until a later Production deploy.

---

## I. Manual canary before Cron

Recommended controlled recovery step, not an authorization:

After legacy / webhook gating is in place, run **one** bounded manual canary worker batch. Verify every claimed job and result. Do **not** process webhook jobs in this initial canary.

---

## J. Cron restore

Only after gates 1–5, isolated Production proof, legacy/webhook disposition, deployed E2E, and the manual canary pass, **consider** enabling Production Cron `/api/cron/process-jobs`.

Cron restoration is a **separate governed decision**. Passing earlier gates does not self-approve Cron.

---

## K. Production hold removal

Whole-project Production hold is removed **LAST**, and only after:

- ledger verified (SQL + Gate 1 Data API)
- hotfix hosted and verified (Gate 2)
- reliability flag verified (Gate 3 then controlled enablement)
- isolated Production proof clean (Gate 4)
- legacy pending jobs dispositioned (Gate 5)
- webhooks safely held / gated (Gate 5)
- deployed E2E passes
- canary passes
- Cron runs clean
- internal smoke / regression passes

GVM technician validation starts **only after this recovery closes**.

---

## SMS `skipPreferenceCheck` invariant

Direct-context SMS may set `payload.skipPreferenceCheck` **only** for a server-governed communication where bypassing customer opt-out / preferences is explicitly valid under the approved communication policy.

Normal appointment / customer SMS **must** continue to respect preferences.

Do **not** treat arbitrary direct-context SMS as licensed to bypass consent. The isolated Staging harness used the flag only on synthetic marked jobs with stubbed providers.

---

## Current recovery posture (not complete)

| Control | State |
|---------|--------|
| Production hold | **ON** |
| Production Cron | **DISABLED** |
| Production worker | **NOT RUNNING** (governed retry completed 2026-09-09T01:20:57Z; do not repeat) |
| Production communications | **NOT AUTHORIZED** beyond the completed synthetic canary |
| Ledger on Production | **APPLIED** (Gate 1). One synthetic **accepted** send-intent retained as evidence. |
| Tenant-integrity on Production | **DEPLOYED** docs-reconciled SHA `bb1dbe6` / audited functional `918e9cae` / `dpl_HUvY9TtHdfzJTVHvGxJ6JFdJMLWF`. Prior `dpl_C2s6ktqd` has **no active alias**. |
| Reliability flag on Production | **true** |
| Webhook gate on Production | **ABSENT** (must remain absent/false through E2E, canary, initial Cron restore) |
| Gates 1–4 | **PASS** |
| Gate 5 | **PASS (code + live Staging PostgREST proof + Production deploy + fleet reconciled)** |
| GVM technician testing | **DEFERRED** |
| Deployed transactional E2E | **PASS** after correct-account Resend cutover (job completed, intent accepted, webhook held) |
| Appointment tenant-integrity tree `918e9cae` | **DEPLOYED TO PRODUCTION** as docs-reconciled HEAD `bb1dbe6` / `dpl_HUvY9Tt…`. Functional files byte-identical. |
| Claude N2 monitoring | **NOT LIVE.** Signals exist in Vercel Runtime Logs. No Sentry DSN. No alert destination configured. |
| Claude N4 (034) | **HARD GATE.** `schedulingChanged` / DELETE `hasReferences` must be null-staff-safe before 034/035/036. Not implemented in this slice. |
| Package B communication consent | **PRE-PRODUCTION TECHNICAL GATES COMPLETE**. PO authorized bounded Production rollout 2026-09-10. Execution **STOPPED** at SQL identity (no session-mode postgres access). Production schema/app **unchanged** (`dpl_HUvY9Tt…` / `bb1dbe6`; consent columns still absent). Hold **ON**. Cron **DISABLED**. Package A and N2 remain separate. 034/035/036 blocked. Do not apply 027 wholesale. See [`docs/PACKAGE_B_COMMUNICATION_CONSENT.md`](./PACKAGE_B_COMMUNICATION_CONSENT.md). |

---

## Staging/Preview tenant-integrity validation of `918e9cae` (evidence, not authorization)

Pinned tree `918e9cae` / `cb151c93` (branch `codex/appointment-api-tenant-integrity-fix`) was deployed to **Preview only** as `dpl_FnRsuu8WpGfPNxzp8iJj7BCkTjDo` (`chasum-lebw8it2b-renovisionappcom.vercel.app`, `target=preview`, `readyState=READY`, `meta.gitCommitSha` `918e9cae8bc069f96b84e4c1eb8bd8d63641bd74`) and exercised against Staging Supabase `wnfahklzaxirftyskctd`.

| Control | Observed on Preview |
|---------|---------------------|
| Supabase project | `wnfahklzaxirftyskctd` (Staging); Production ref `kxcydvhswkuzepwzzinq` absent |
| `RESEND_API_KEY` | **ABSENT from Preview** — Production-only cutover intact; Preview cannot send |
| `CHASUM_WORKER_RELIABILITY_ENABLED` | **true** (proven at runtime by `sendIntentProtocol: "durable-v1"` on an enqueued job) |
| `CHASUM_WORKER_WEBHOOKS_ENABLED` | **ABSENT** — webhook jobs enqueued and stayed `pending` |
| `CRON_SECRET` / Twilio / Stripe | absent from Preview |
| Worker | **NOT INVOKED**; `processPendingJobs` not called |
| `communication_send_intents` | **0** throughout — no provider send attempted |

Proven behaviours: `location_id` persisted on create; single-active-location fallback; multi-location ambiguity rejected `400`; zero-active-location rejected `400`; all four cross-tenant references rejected `400` on both POST and PATCH with the row unchanged; cancellation idempotent across repeated PATCH and DELETE (exactly one occurrence, `0` duplicate jobs); foreign-tenant and unknown ids `404`; concurrent DELETE resolved `200 + 409`; retained foreign-reference DELETE **fails closed** `409 Appointment requires data reconciliation` with the appointment left uncancelled and `0` jobs. No foreign-tenant name or email appeared in any response body.

Non-regression: the **28** pre-existing Staging jobs (**20 pending** / **8 completed**) fingerprint `9ec3013affc24300cd5ff312c9436ed04987dab2ba8f500c45747fc363413cef` was **identical** before fixtures and after cleanup; appointment↔reference `business_id` mismatch counts stayed **0**; synthetic marker residue **0**. The existing Staging pending jobs were **not** processed.

**Scope limit.** This is a Staging/Preview producer-path proof only. It does **not** authorize a Production deploy of `918e9cae`, Cron restoration, hold removal, worker invocation, webhook dispatch, or GVM testing.

## Production tenant-integrity canary (2026-09-08)

Serving `dpl_HUvY9TtHdfzJTVHvGxJ6JFdJMLWF` after in-place Production-only `RESEND_API_KEY` rotation to the dardin.gvm sending key **Chasum Production Runtime 2026-09-08 Correct** (verified domain `chasumai.com`; env object `9hF77dAtfP8TcG7S` unchanged). Marker `chasum-prod-tenant-integrity-e2e-20260908`. One additional `POST /v1/projects/…/crons/run` at 2026-09-09T01:20:51Z; schedule remained **DISABLED**. Hosted GET `/api/cron/process-jobs` HTTP 200, `processed: 1`. Email job `0f557d3e-7716-4ff8-9e48-8f0bb26192f3` **completed**, attempts 2, `completed_at` set. Send-intent `16eeb227-51ed-4578-a2c8-37034af39863` **accepted**, attempt 2, source worker, provider resend, `provider_message_id` `28797784-a1e5-4bcd-b567-958f0ac38d15`. Webhook `1060a548-…` still pending attempts 0. Historical 579 id fingerprint unchanged. No SMS. No duplicate synthetic email job. `customers.marketing_consent` fail-loud warning **still occurred** and was **not** fixed.

**N2:** Prefer existing Vercel Runtime Logs. Query/filter: `appointment_reconciliation_required`; production appointment-route 5xx; nested JSON `scope=worker` / `scope=notifications`. Destination: not configured. Test method: `vercel logs <deployment> --query 'appointment_reconciliation_required'` / `--level error`. Live: **no**. Do not add a new vendor. Optional existing `SENTRY_DSN` remains unset (`/api/health` sentry optional_missing). Cron restoration is **NOT approved**.

Do **not** enable scheduled Cron. Hold ON. Webhook gate absent/false. Do not apply 034/035/036 until N4. Do not revoke historical Resend keys. Do not create another Resend key. Governance: **VERIFY CURRENT STATE BEFORE CHANGING STATE.** **NO DUPLICATE INFRASTRUCTURE OR CREDENTIAL CREATION FOR TOOLING PROBLEMS.**
