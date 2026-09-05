# Production worker reliability hotfix — independent audit handoff

Implementation is ready for independent audit, not Production release. Baseline is exactly `476af17bfd06113281df0b5c33f995ccb26f5fff`; branch is `codex/production-worker-reliability-hotfix`. The engineer verified detached HEAD at that baseline before creating the branch. The Phase 5 checkout was not used as a source of changes.

Review the branch diff against that exact baseline together with [the release contract](WORKER_RELIABILITY_HOTFIX.md) and [the machine-readable validation record](worker-reliability-validation.json). No migration was applied in this task. Production/Staging were not connected, SQL was not run against either, and no deployment, cron invocation, worker release or real communication occurred.

## Code boundaries to audit

| Area | Main files | Review question |
|---|---|---|
| Inline reconciliation | `lib/notifications/booking-delivery.ts` | Does accepted delivery remain accepted through every checked queue/log failure? Are only eligible matching tenant/occurrence twins updated? |
| Worker ownership | `lib/integrations/jobs/claim.ts`, `processor.ts` | Can only one conditional UPDATE own a due pending row, and can finalization write only under that ownership? |
| Durable reservation | `lib/communications/send-intent.ts` | Does a committed reservation always precede provider contact? Can only confirmed rejection acquire another attempt? |
| Provider truth | `lib/communications/delivery.ts`, `lib/integrations/providers/{email,sms,outcome}.ts` | Are timeouts, 408/409/5xx, unreadable responses and missing acceptance IDs held? Can log/audit failure trigger another call? |
| Occurrence identity | `intent-identity.ts`, queue/orchestrator/booking bridge | Do initial inline/queued twins share identity while distinct events remain distinct? Do reminders and waitlist child jobs preserve identity across repeated scheduling or parent retry? |
| Manual retry | `booking-delivery.ts`, `lib/commerce/receipts.ts`, `lib/communications/queue.ts`, notification retry action | Can an unknown manual occurrence be bypassed with a fresh UUID? Are holds scoped by tenant/entity/channel/template without blocking another appointment or receipt? |
| Schema and tenancy | Prepared migration and all service-client predicates | Are effective privileges restricted and the unique key tenant-scoped? Do entity/recipient bindings, claim predicates and context loading agree? |
| Activation/rollback | Release contract and default-off flag | Can mixed legacy/guarded producers bypass the ledger? Are retained legacy jobs and rollback ingress held explicitly? |

Receipt edits govern only communication identity, retry permission and email-status bookkeeping. No payment amount, transaction creation, invoice calculation or booking mutation logic was changed. The public-booking edit only passes the initial send occurrence to its existing notification call. No Phase 5 booking code or UI feature was imported.

## Test results

Final full suite: **518 passed, 1 failed, 519 total; 68 passed files, 1 failed file**. All **168 tests in the 13 added/updated hotfix test files passed**, including five real PostgreSQL queue tests. Ten new test files contribute 155 tests; the remaining three updated test files contain 13 existing regression cases.

| Test file (under `tests/`) | Passing cases |
|---|---:|
| `integration/worker-claim-postgres.test.ts` | 5 |
| `unit/commerce/payment-receipt-retry.test.ts` | 9 |
| `unit/commerce/receipt-reliability.test.ts` | 9 |
| `unit/communications/delivery-reliability.test.ts` | 10 |
| `unit/communications/provider-outcomes.test.ts` | 15 |
| `unit/communications/send-intent-schema.test.ts` | 6 |
| `unit/communications/send-intent.test.ts` | 19 |
| `unit/communications/waitlist-intent-reliability.test.ts` | 7 |
| `unit/communications/worker-reliability.test.ts` | 57 |
| `unit/notifications/business-resend-deposit.test.ts` | 2 |
| `unit/notifications/inline-delivery.test.ts` | 2 |
| `unit/notifications/inline-reliability.test.ts` | 19 |
| `unit/notifications/producer-identity.test.ts` | 8 |

Requirements A–C are exercised by inline/delivery tests, including accepted evidence with failed reconciliation and repeat invocation. D–E and L–N are covered by worker and real PostgreSQL claim tests. F–G and I–K are covered by durable send/worker failure injection. H is covered by distinct occurrences, channels, templates, tenants, entities, reminder times and waitlist parents/entries. O is covered by scoped claim/finalization, context checks, manual retry and tenant-separated intent tests.

Failure injection includes failure before and after log persistence, accepted-result write failure and lost acknowledgement, thrown provider response, unknown response, failed queue finalization, lost ownership, and failed inline twin reconciliation. Tests retain the store between invocations to demonstrate that replay skips the provider. These tests simulate process failure boundaries; they do not claim an OS process-kill or live-provider test.

The one full-suite failure is `tests/unit/marketing/multi-business-selection.test.ts:60`, “shows all businessTypes in the understanding profile”: `business?.discovered` is undefined instead of true. It reproduces on an isolated `git archive` of the exact Production baseline using the same installed dependencies: three tests passed and the same test failed. Source blobs were verified against baseline. No marketing fix was bundled.

Changed-file ESLint with `--max-warnings=0` passed. `npx tsc --noEmit` passed. `npm run build -- --webpack` passed, including its TypeScript check and 37 static pages; the final build reports only the existing middleware deprecation warning. The first build was blocked by sandbox DNS for public Google Fonts; an approved credential-free public font download enabled the build. No service credentials or runtime environment files were used. Full-repository lint still has the baseline's 30 errors in unrelated UI; the baseline has 13 warnings, with fewer warnings in this patch after removing unused bindings. See exact final counts in the JSON record.

## Concurrency evidence and limits

The real PostgreSQL test runs two actual `processPendingJobs(1)` calls. A barrier stops each after both have SELECTed the same pending row, then permits both guarded UPDATEs against PostgreSQL. Asserted returned-row counts are `[0, 1]`; only one worker reaches the stub delivery function, attempts increments once, and the row finishes completed. Additional tests change eligibility/status after the stale read and replace the ownership token before finalization.

These tests use a query adapter translating the application's actual Supabase predicates to SQL on a fixed local Unix socket. They use fresh synthetic rows in `rehearsal_worker_claim`, cloned from an already-existing synthetic post-029 rehearsal database. This task did not apply 029 or any new migration. The tests assert that the new ledger table is absent. PostgreSQL was stopped after validation.

The ledger's own uniqueness, role privileges/RLS and PostgREST semantics remain **unexecuted**. Six migration tests inspect source only. Shared-store unit concurrency tests exercise the reservation algorithm, not PostgreSQL's new table. Do not upgrade this evidence into a claim that the ledger migration passed a database rehearsal.

## Exact commands and retained evidence

Hotfix working directory: `/private/tmp/chasum-worker-reliability-hotfix`.

- Full suite: `python3 /private/tmp/chasum-worker-hotfix-evidence/run_validation.py all-tests npm test -- --reporter=verbose`. The runner supplies a credential-free whitelist and sets `CHASUM_RUN_LOCAL_PG_CLAIM_TEST=1` only for this run.
- Typecheck: `python3 /private/tmp/chasum-worker-hotfix-evidence/run_validation.py typecheck npx tsc --noEmit`.
- Final build: `python3 /private/tmp/chasum-worker-hotfix-evidence/run_validation.py build-final npm run build -- --webpack`.
- Final lint: `python3 /private/tmp/chasum-worker-hotfix-evidence/run_validation.py lint-final npm run lint`.
- Changed-file lint uses `npx eslint --max-warnings=0` with every added/changed TypeScript file; its exact argument list is in the JSON record.
- Baseline comparison: `/opt/homebrew/bin/node node_modules/vitest/vitest.mjs run tests/unit/marketing/multi-business-selection.test.ts` and `/opt/homebrew/bin/npm run lint` in `/private/tmp/chasum-worker-baseline-validation`.
- `git diff --check` passed.

Raw stdout/stderr, commands, timestamps, baseline proof and hashes remain in `/private/tmp/chasum-worker-hotfix-evidence/`. The JSON record retains their hashes and summarized receipts in Git. Temporary raw files must be preserved in the approved release-evidence location before they are relied on for release; this task does not upload them or contact another reviewer.

## Required next decision

Claude should audit the immutable hotfix commit against the exact baseline, report concurrency/idempotency/tenant and failure-state findings, and assess the prepared migration independently. ChatGPT and Darshan should review that audit before authorizing a **new disposable ledger migration rehearsal**. That future rehearsal must cover concurrent reservation/rejection retry, effective roles/RLS, entity isolation and the actual PostgREST access path.

After those gates, environment-specific approval is still required for the locked 029/historical repair, the new migration, deployment, isolated synthetic worker invocation, and eventual worker release. Unknown sends and stranded owners require evidence-based reconciliation; there is no elapsed-time permission to resend. Calendar/webhook/recurring and in-app fanout side effects are not given an exactly-once guarantee. Existing worker and historical queue holds remain in force; this handoff does not self-approve Production.
