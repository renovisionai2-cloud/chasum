# Phase 5 / recovery / timezone integration candidate

Date: 2026-09-11. Status: locally validated engineering candidate, NOT independently audited, NOT hosted-verified, NOT Production-approved. No migration or deployment was performed. This record does not restamp live operational state.

## Lineage and method

- Exact parent/base: `4c1f70f16d35248dbe83f5f94ef189669c5da4b4` (recovery/Package B).
- Branch: `codex/integrate-phase5-recovery-timezone`.
- Worktree: `/private/tmp/chasum-phase5-recovery-integration`.
- Accepted Phase 5 functional delta: `476af17bfd06113281df0b5c33f995ccb26f5fff` to `fd31b4f832a366672d422bde1ae04d0f02b5199c`.
- Complete timezone delta: `5bb59cb2bdf8c5bd3d7ed492f85e8717dbec258d` to `e8565fcbb29e20af342e99ceba0bb6b84031937d`, including `81811bad` and `682f3e3`.

Created a fresh clean worktree at the exact recovery base. Applied path-scoped functional patches only after checking recovery changes to those paths. Used three-way file comparisons and manual semantic reconciliation for overlaps. No whole-branch merge, bulk cherry-pick, or replacement of recovery files/documents with older lineage copies. Existing worktrees were not changed by this integration.

## Seven overlap resolutions

Paths below are repository-relative; tests are under `tests/unit`.

| File | Phase 5 / timezone intent | Recovery intent | Combined resolution | Evidence |
| --- | --- | --- | --- | --- |
| `lib/actions/public-booking.ts` | Named staff through explicit public RPC; one engine event; Public Booking label; location timezone summary | Durable initial send identity, tenant-safe orchestration and synchronous delivery | Remove old direct orchestrator call; real engine bridge supplies recovery identity/business scope; retain delivery with public channel | `booking/public-recovery-integration.test.ts`, `public-booking-orchestration-once.test.ts`, `public-booking-write-path.test.ts`, `public-slot-time-integrity.test.ts` |
| `lib/communications/events/booking-bridge.ts` | Propagate event channel | Required business scope and deterministic initial booking intent | Keep both recovery fields; add `bookingChannel: event.channel` | Combined integration test exercises real bridge/orchestrator; `notifications/producer-identity.test.ts` |
| `lib/communications/types.ts` | Optional BookingChannel template context | Delivery outcomes, reliability and reconciliation types | Add optional context field; retain recovery types | Typecheck; delivery/reliability suites |
| `lib/integrations/jobs/processor.ts` | Forward queued source into template context | Atomic/fenced claims, tenant-safe context, durable delivery, webhook default-off | Add only three lines carrying bookingChannel; recovery implementation otherwise unchanged | `communications/worker-reliability.test.ts`, `notifications/appointment-tenant-integrity.test.ts`, source-label tests |
| `lib/integrations/notifications/orchestrator.ts` | Queued business source reflects booking channel | Required businessId, tenant-safe reader, stable sendIntentId and audience preference handling | Add optional bookingChannel beside required businessId; preserve sendIntentId and all recovery guards | Combined integration test; notification tenant-integrity and audience-preference suites |
| `lib/notifications/booking-delivery.ts` | Optional source for synchronous business template | Provider outcomes, accepted intent evidence, checked reconciliation, consent and retry protection | Add optional context channel overlay only; preserve delivery body and recovery return semantics | Combined integration test; `notifications/inline-reliability.test.ts`, `communications/delivery-reliability.test.ts` |
| `lib/types/booking.ts` | Public summary timezone | Delivery state / reconciliationRequired contract | Add optional summary timezone; recovery fields retained | Typecheck; public date/time and delivery-status suites |

## Public persistence and communications contract

The alias-aware public action resolves the business, constructs `publicCreateIntent`, and explicitly supplies `publicBookingPersistence` to `createBooking`. Session/RLS persistence remains the default; a public channel alone does not select the RPC. Dashboard, duplicate and Summer paths retain session persistence. Any/null staff remains gated.

The public action contains no `handleAppointmentEvent` reference. After successful persistence, one engine event enters the real bridge; the bridge supplies businessId, bookingChannel and `initialBookingIntentId(appointmentId)` to the recovery orchestrator. It queues one booking webhook and creates one in-app notification for the tested success. Synchronous delivery uses the same logical customer/business identities as queued twins. Booking source remains Public Booking for the normal public path; customer template has no source row. Queueing a webhook does not authorize dispatch: the recovery worker gate remains default-off.

No ledger, claim, provider outcome, preference, tenant-context, receipt retry or webhook gate implementation was replaced. The queue processor delta is source propagation only. Recovery API tenant validation, cancellation idempotency, reconciliation failures, Package B consent compatibility and audience gates remain tested.

## Financial and migration contract

040 and 041 are copied byte-for-byte from accepted `fd31b4f`. They remain separate deployment requirements, not applied by this task. 041 derives catalog price, tax, deposit and payment status inside the RPC; supplied commercial parameters remain compatibility inputs rather than authority. Application values remain preview/compatibility values. This integration does not reinterpret the locked commercial contract.

- 040 SHA-256: `a28cbd219af9f69ee8b9946708e0000c9c64021dae544b92a484891302ff5865`.
- 041 SHA-256: `c2aaf4971ff72845ed9e1a77fd6f6778abc20374529d1ad88ffbf8a4ea326ec6`.

No existing migration was changed. 034–036 and Package A remain outside scope. No schema, RLS, ACL or database data was changed. Local SQL tests are contract/text/math checks, not a fresh PostgreSQL rehearsal; accepted Staging proof is inherited evidence, not rerun here.

## Time and carry-in behavior

Selected location timezone governs Single Location; business timezone governs All Locations. Civil dates remain YYYY-MM-DD; display, range boundaries, calendar grouping/positioning, Today/navigation, now marker, drag/drop and resize use the operational zone. DST gaps and ambiguous endpoints fail safely. Public chips, slot requests/clocks, review and confirmation retain selected-time integrity.

`queryAppointmentsInRange` uses `business_id = current business AND end_time > startIso AND start_time <= endIso`, retaining location scope, relationships, status behavior and ordering. `queryUtilizationProjection` is byte-identical to the recovery base. Returned carry-in/spanning rows and cross-day clipping are covered by real query-builder/component tests with synthetic HTTP responses.

## Special combined regression

`tests/unit/booking/public-recovery-integration.test.ts`: four passing cases. Real public action, createBooking/public RPC adapter, event emitter, bridge, forwarding orchestrator spy, tenant-safe context reader, queue, preferences, templates, delivery and send-intent store/protocol run together. Supabase storage/RPC, availability, calendar/network, provider and platform boundaries use local fixtures/stubs. No provider or database is contacted.

Success proves one appointment result, one created event, one orchestrator pass, one webhook job, one in-app notification, two accepted logical email intents, two provider-stub calls, correct business/template/entity/occurrence identity, durable-v1 queued twins reconciled completed, Public Booking rendering, and real preference lookup. Replaying queued delivery inputs and inline delivery suppresses additional provider calls. Additional cases prove customer preference suppression without suppressing business audience, no effects on persistence failure, and no direct action orchestration reference.

This is an integration-level unit test, not a live PostgreSQL concurrency/atomicity test or actual worker invocation. Worker claiming and recovery failure boundaries remain covered by the separate recovery suites. The inherited Phase 5 orchestration test was adapted for the recovery server-only marker and tenant-safe flat context fixture; real engine/emitter/bridge/orchestrator remain exercised.

## Local validation

All commands ran in the isolated integration worktree unless marked baseline.

| Gate | Result |
| --- | --- |
| Focused union (booking, booking-engine, calendar, communications, notifications, actions, API, commerce, integrations, Supabase errors) | 59 files / 607 tests passed |
| Booking | 19 files / 131 tests passed |
| Calendar | 5 files / 49 tests passed |
| Booking-engine | 2 files / 5 tests passed |
| API tenant integrity | 1 file / 70 tests passed |
| CRM consent actions | 1 file / 35 tests passed |
| Communications | 13 files / 184 tests passed |
| Notifications | 8 files / 60 tests passed |
| Commerce/receipts | 8 files / 66 tests passed |
| Calendar integration tenant guards | 1 file / 4 tests passed |
| Supabase error classification | 1 file / 3 tests passed |
| Timezone matrix | 6 files / 52 tests passed separately in America/Toronto, Pacific/Auckland, America/Los_Angeles and UTC |
| Full unit suite | 89 files passed / 1 failed; 806 tests passed / 1 failed |
| TypeScript (`npm run typecheck`) | Passed, including after build |
| Changed-scope eslint | One existing appointment-drawer set-state-in-effect error; no new diagnostics |
| Repository eslint | 30 errors / 8 warnings vs untouched recovery 30 errors / 9 warnings; normalized diagnostics contain no additions |
| Local production-mode build (`npm run build -- --webpack`) | Passed; Google Fonts required network outside sandbox; no deployment |
| `git diff --check` | Passed |

The sole full-unit failure is `tests/unit/marketing/multi-business-selection.test.ts:60`, expected discovered=true, received undefined. It was independently reproduced on untouched exact recovery `4c1f70f` (3 passing / 1 failing case in that file). Repository lint was also rerun there; the removed warning is CalendarClient's old effect date dependency. Unrelated code was not fixed. Build reports middleware deprecation and Supabase Edge-runtime warnings; font transport retries eventually succeeded. No live integration test, browser login, hosted test or worker was invoked.

## Operational truth and remaining gates

These five recovery documents are byte-identical to `4c1f70f`: CURRENT_PROJECT_STATE, LAUNCH_READINESS, PRODUCTION_RECOVERY_STATE, PRODUCTION_WORKER_RECOVERY_RUNBOOK and PACKAGE_B_COMMUNICATION_CONSENT. Older Phase 5/timezone copies were not applied. Per supplied control-tower state: Package B complete; hold ON; Cron ENABLED; webhooks OFF/absent; N2 monitoring LIVE; overall recovery NOT complete. These are supplied facts, not fresh live verification.

Open launch-required configuration reconciliation: canonical GVM business timezone America/Toronto versus Burlington/Main location America/New_York. Do not change configuration here. Selected-location precedence makes this a separately governed pre-exposure check.

Earlier authenticated smoke tested the preserved retired shell, not canonical operational GVM. Canonical account smoke remains outstanding. No identity query, login, reset, membership or tenant change was performed. The duplicate-tenant incident remains closed.

No new P0/P1 integration defect identified by local checks. Existing lint/test debt, midnight refresh of public chips and broader utilization/shared Booking Sheet questions remain separately bounded. No new Summer feature work.

## Publication and next action

The candidate is to be committed locally on the feature branch for independent audit. Remote push is held: local `vercel.json` supplies no branch deployment-disable rule and the Vercel read-only connector is not connected, so this task cannot establish that a Git push would avoid automatic Preview deployment. No push attempt or deployment-setting change was made. The task explicitly prohibits automatic Preview deployment; conditional push authorization does not override that boundary.

ChatGPT/designated technical operator should establish an approved no-deploy publication path before any push. Claude can audit the exact local commit meanwhile. Independent audit precedes separately governed hosted Momentic validation. No Production PR, merge, migration, deploy, worker, webhook, hold change or communication is authorized by this candidate.
