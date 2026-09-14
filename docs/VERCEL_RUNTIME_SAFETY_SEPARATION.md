# Vercel runtime identity and hosted safety

> Current-state override (2026-09-14): the implementation below is part of accepted Production `dbbe450`; recovery is CLOSED. Older unapplied/held/pre-release statements describe their historical validation stage. See [canonical closeout](./recovery/PRODUCTION_RECOVERY_CLOSEOUT_20260914.md). This document grants no execution authority.

2026-09-11 — local correction on exact accepted integration base `e81a34dd3f3026363beb4b998409686e803f853a`. No deployment, database, or platform configuration change. Hosted verification remains **OPEN** pending focused independent audit and a separately authorized new Preview.

## Inherited P2

Historical Preview `dpl_EsNHmz18YhCRptd2EKSLx8JvUgCw` returned health 503 with production=true, Supabase/service role configured, and email/Cron missing. The inherited helper conflated optimized NODE_ENV=production builds with actual Vercel Production. That deployment remains unchanged historical evidence.

A helper-only correction was rejected during impact review: it would have removed Preview's missing-Cron-secret denial and selected console-success email/SMS providers. The approved bounded extension separates identity from safeguards.

## Contract and complete caller inventory

`lib/env.ts::getRuntimeEnvironment` uses a present VERCEL_ENV as authoritative: production, preview, or development. Unrecognized values (including empty) return unknown and remain guarded. Only when absent does NODE_ENV=production select production; other NODE_ENV values select development.

`isProductionRuntime` checks actual production identity. `requiresHostedSafetyGuards` is true except for recognized development runtimes.

| Consumer | Contract |
| --- | --- |
| `app/api/health/route.ts` | Existing isProductionRuntime call; actual Production requires Supabase, service role, email and Cron. Preview requires Supabase/service role. Route source unchanged. |
| `app/api/cron/process-jobs/route.ts` | Hosted guards: missing secret 503; missing/wrong bearer 401; correct bearer can proceed. Error text generalized to “this runtime.” |
| `lib/integrations/providers/email.ts` | Configured Resend retained; missing credentials disabled on Production/Preview/unknown. Console only on recognized development. |
| `lib/integrations/providers/sms.ts` | Same safeguard for Twilio; disabled missing-provider result remains unsuccessful/skipped. |
| `app/(owner)/owner/settings/page.tsx` | Displays runtime identity directly, including preview. Owner auth unchanged. |

No helper callers in payment logic or schema fallback. No worker claiming, send-intent, tenant, booking, calendar, migration, financial or provider transport logic changed. Local development/test console behavior remains; VERCEL_ENV=development overrides optimized build mode as approved. Non-Vercel production remains guarded.

## Local evidence

- Two new test files: `tests/unit/env/runtime-safety.test.ts` (25 cases), `runtime-routes.test.ts` (27 cases). Real helpers, providers and route handlers; worker mocked, fetch blocked, synthetic settings only. No real worker or provider invocation.
- Identity/safeguards: six required combinations plus unknown and empty VERCEL_ENV.
- Health: Preview 200, incomplete Production 503, complete Production 200; Preview still rejects absent Supabase/service-role configuration.
- Both Cron methods: hosted missing secret, wrong/missing bearer, correct bearer to stub only; local behavior and unknown fail-closed coverage.
- Provider matrix: hosted missing credentials never return synthetic success; local console preserved. Configured Preview selects real provider implementations without sending. Existing provider-outcomes mock updated for renamed safety dependency.
- Owner UI uses the tested helper directly; no page-level rendering test or hosted UI claim.
- Focused environment + existing provider outcomes: 4 files / 78 tests passed.
- Booking, booking-engine, calendar, communications, notifications and env: 50 files / 492 tests passed.
- Timezone matrix: 6 files / 52 tests passed separately in America/Toronto, Pacific/Auckland, America/Los_Angeles and UTC.
- Full unit suite: 858 passed / 1 failed. The marketing multi-business-selection discovered-field failure was reproduced on untouched exact e81a34d (3 passed / same 1 failed). Unrelated debt remains separate.
- TypeScript, changed-file eslint, production-mode webpack build and diff check passed. Build retains middleware deprecation / Supabase Edge-runtime warnings.

No Production/Staging access, migration, provider send, worker/Cron invocation, environment-variable configuration change, webhook/hold/bypass change, push, merge, or deployment. Test environment stubs are process-local only. Recovery history and accepted Phase 5 work are not restamped.
