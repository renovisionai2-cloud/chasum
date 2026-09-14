# Worker candidate-selection retry — local only

> Current-state override (2026-09-14): the implementation below is part of accepted Production `dbbe450`; recovery is CLOSED. Older unapplied/held/pre-release statements describe their historical validation stage. See [canonical closeout](./recovery/PRODUCTION_RECOVERY_CLOSEOUT_20260914.md). This document grants no execution authority.

2026-09-12. LAUNCH REQUIRED / BUILD NOW. No Production deployment or mutation.

## Source and scope

Base `19d86a265fd6eecbc2da4b66c5ad508a0b93f6b5` preserves all local recovery history. Its only differences from deployed functional SHA `6bf2aa068dcb6c7f196e06afa54d95dc8b75b880` are three recovery Markdown files. Branch: `codex/worker-candidate-selection-transient-retry`.

Recurring Gateway Timeout failures supersede the isolated-transient interpretation. An intermittent candidate SELECT dependency failure is plausible, not proven. No code here claims vendor root cause.

Only `selectPendingJobCandidates` gets retry/deadline behavior. Each retry builds a fresh GET with identical now/filter/order/limit/webhook eligibility. Installed supabase/postgrest-js 2.110.2 supports `.retry(false)` and `.abortSignal(signal)`. Its default internal GET retries must be disabled here to enforce exactly two HTTP attempts total. No global client changes.

5s per attempt is more than five times the largest sampled healthy empty-tick latency (886ms); 250ms deterministic backoff gives a selection budget about 10.25s, excluding event-loop scheduling. Fluid compute was enabled in prior read-only evidence. [Vercel documents a 300s default](https://vercel.com/docs/functions/configuring-functions/duration); exact deployed override was not exposed in the prior API reads and must be confirmed during hosted verification. This does not change route maxDuration or grant a deadline/retry to post-claim work.

AbortController cancels the request. A deadline race also bounds an uncooperative read promise; it cannot initiate mutations. Timers are cleared on success/error, and no background retry remains. Non-transient errors terminate immediately; final transient failure throws. The Cron route is unchanged: no fabricated HTTP 200/processed=0 on failure, no 500→503 contract change.

SQLSTATE/PGRST semantic codes and HTTP4xx are non-transient. HTTP502/503/504, exact Gateway Timeout/fetch-failure messages and allowlisted transport codes may retry. Unclassified failures do not retry. Telemetry emits only normalized classification, validated code/status, stage, attempt, retry/exhaustion/recovery and durations. Raw details are deliberately omitted.

## Tests and gates

Tests use the real installed PostgREST builder and real Cron route/processPendingJobs, with synthetic fetch responses and claim/provider boundaries stubbed. They assert actual fetch count, stable query strings, webhook filter, timeout abort and timer cleanup. The existing worker state-machine tests retain their assertions; query-adapter methods were added to support the SDK interface. The opt-in PostgreSQL adapter gets the same interface-only update; no migration/database execution is required by this change.

No hosted proof is claimed. Independent audit and one separately governed Preview remain required before any Production proposal. Production remains on 6bf2aa0 with hold ON, Cron ENABLED, webhooks OFF and 041 retained. Authenticated canonical smoke remains deferred and hold removal unapproved.

## Local validation results

- New candidate-selection suite: 32 cases, using real SDK GETs against a synthetic fetch stub. Fault injection traverses the real Cron handler and real worker selector; no Production endpoint is contacted.
- Grouped communications/notifications/environment/Cron/booking/booking-engine/calendar regression: 51 files, 524 tests PASS. Existing worker reliability suite: 71 tests PASS.
- Full suite: 890 PASS, one known marketing failure, 10 skipped opt-in cases across five files. The same marketing discovered-field assertion was reproduced on unchanged base 19d86a2 (3 PASS / 1 FAIL). No claim of fresh disposable PostgreSQL execution is made.
- TypeScript and changed-scope ESLint PASS. Webpack production build PASS after permitting Google Fonts network access; initial sandbox build failed only on font downloads. Existing Edge-runtime/middleware warnings remain. No Production environment file was copied into this worktree.
- git diff --check PASS. No dependency, route contract, migration, claim, provider or ledger implementation changes.
