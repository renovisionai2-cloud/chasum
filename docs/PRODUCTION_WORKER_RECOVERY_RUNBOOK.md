# Production worker recovery runbook

**Status:** Canonical Production rollout sequence after independent high-risk audit  
**Authority:** This file plus [`docs/PRODUCTION_RECOVERY_STATE.md`](./PRODUCTION_RECOVERY_STATE.md)  
**Last updated:** 2026-09-08  
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
| Ledger migration | `supabase/migrations/20260905024239_communication_send_intents.sql` |
| Migration SHA256 | `51bcf061763dd972be3ef7b6696a59de9230c75be4cebbc22971cca541efddbf` |
| Reliability flag | `CHASUM_WORKER_RELIABILITY_ENABLED` |
| Webhook dispatch gate | `CHASUM_WORKER_WEBHOOKS_ENABLED` (server-only; default OFF; exact `"true"` enables) |
| Worker Cron | `/api/cron/process-jobs` |
| Staging isolated application runtime | **PASS** (synthetic jobs, stubbed providers; existing 20 pending Staging jobs unchanged) |
| Gate 5 webhook-hold Staging proof | **PASS** (live PostgREST `job_type=neq.webhook` on enum with pending/due/or/order/limit; synthetic marked rows; `processPendingJobs` not invoked; existing 20 pending fingerprint unchanged; residue 0) |
| Gate 5 webhook-hold functional SHA | `47c24acb22db8d8da7cef9971357e1d26f87cffa` (tree `461198bd0b261ab38f39260d1f413dfa4f196f24`). Delta audit **B**. Live Staging condition **PASS**. Production deploy **not performed**. |

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

Bounded hold (implemented, **not Production-deployed**):

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

Claude webhook-hold delta audit = **B**. Live Staging PostgREST proof of `.neq("job_type","webhook")` on the enum column with existing pending/due/or/order/limit composition = **PASS** (2026-09-08; existing 20 pending fingerprint unchanged; synthetic residue 0; no real providers). Production deploy of `47c24ac` is still **not performed**.

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
| Production worker | **NOT RUNNING** |
| Production communications | **NOT AUTHORIZED** |
| Ledger on Production | **APPLIED** (Gate 1) |
| Hotfix on Production | **DEPLOYED** identical-tree carrier `35cc40c` / `dpl_J2LZfLWvvDF9MtCFN1WwnuH7j6pP` |
| Reliability flag on Production | **true** |
| Gates 1–4 | **PASS** |
| Gate 5 | **PASS (code + live Staging PostgREST proof); Production deploy of `47c24ac` not performed** |
| GVM technician testing | **DEFERRED** |

The next consequential action is a **separately governed Production deploy** of webhook-hold SHA `47c24acb22db8d8da7cef9971357e1d26f87cffa` with hold ON, Cron DISABLED, and `CHASUM_WORKER_WEBHOOKS_ENABLED` absent/false. This runbook does not grant that authorization.
