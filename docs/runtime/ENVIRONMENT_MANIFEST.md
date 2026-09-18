# Chasum — Environment Manifest

**Record owner:** ChatGPT Control Tower. **Prepared:** 2026-09-17. **P45 Production observation reconciled:** 2026-09-18 from accepted comment 5722300751 only.
**Mode:** Manually reconciled, redacted observation seed. NOT an automatically refreshed inventory.
**Authority:** Runtime observations and their limits only. [Current board](../CURRENT_PROJECT_STATE.md) owns task/acceptance state; [handoff](../handoffs/LATEST_HANDOFF.md) owns continuity procedure.

## Evidence and classification contract

Keep expected and observed values separate. Every field needs a source, evidence time and classification:
- **MATCH:** observed agrees with an explicit expectation at the recorded time only.
- **INTENTIONAL DIFFERENCE:** documented, approved difference with rationale; not an explanation invented to excuse drift.
- **DRIFT:** reliable observation conflicts with expectation. Preserve both values.
- **UNKNOWN:** insufficient, missing, stale or inaccessible evidence; null is not false or zero.
- **BLOCK RELEASE:** a release-critical failure or missing requirement prevents the specific proposed release. Do not apply it indiscriminately to unrelated work.

A recorded MATCH never authorizes a release or substitutes for fresh preflight. The dated records below retain their historical classification; they must be refreshed before reliance in a new release. Never silently learn an approved baseline from whatever happens to be serving.

**Health limitation:** `app/api/health/route.ts` checks configuration getters and flags. `supabase=true` and `serviceRole=true` indicate configuration presence, not a successful database query. `email=configured` does not prove delivery; `cronSecret=configured` does not prove cron or worker execution. The endpoint performs no active database/provider probe. These health values prove configuration presence only. They do NOT prove database binding, provider delivery or worker execution.

### Evidence sources

- **G1:** Control Tower GitHub GET of `refs/heads/main` during the 2026-09-17 continuity restamp: `47189b0f0a244bce5fd601bb76adda1a22a52255`. Exact wall-clock time was not retained; no invented timestamp. Later superseded as serving identity by accepted P45.
- **P44:** Accepted Cursor PR #44 operator report: Production HTTP captures 2026-09-17T20:16:57Z–20:16:59Z; alias inspect 20:16:44Z. [Merged PR](https://github.com/renovisionai2-cloud/chasum/pull/44) and [commit](https://github.com/renovisionai2-cloud/chasum/commit/47189b0f0a244bce5fd601bb76adda1a22a52255) corroborate Git identity. Historical accepted observation; later superseded as serving identity by P45.
- **P45:** Accepted Cursor PR #45 release report comment 5722300751. No fresh Vercel/Supabase/Auth/provider/queue probing was performed for this PR #49 documentation reconciliation. Serving SHA `d5405cc456496e4b0fc908129d8a3fa6160aac8d`; deployment `dpl_6MgZPGrW8KmguXRCDx4UG6TZKyHt`; URL `https://chasum-6st2ikx62-renovisionappcom.vercel.app`; target production; branch/ref main; READY observation 2026-09-17T22:45:15Z; accepted HTTP window 2026-09-17T22:47:10Z–2026-09-17T22:47:12Z; aliases `https://chasum.vercel.app`, `https://chasum-renovisionappcom.vercel.app`.
- **P43:** [Accepted PR #43](https://github.com/renovisionai2-cloud/chasum/pull/43), [changelog](../CHANGELOG.md), and [historical board](../handoffs/archive/CURRENT_PROJECT_STATE_20260917_PRE_CONTINUITY.md).
- **C1:** Approved environment/tenant separation and historical configuration in that archived board. These are expectations/history, not fresh live measurements.

No database, Auth-admin, provider, queue, environment-variable inventory or live Vercel inspection was performed for this PR #49 documentation reconciliation. Restricted fields stay UNKNOWN. Git migrations, local env files and green deployment checks do not establish deployed configuration or database state. Continuity collector remains SPECIFIED / NOT IMPLEMENTED.

## Production

| Field | Expected / last observed | Classification | Evidence |
| --- | --- | --- | --- |
| Application URL | Expected and observed `https://chasum.vercel.app` | MATCH | P45 HTTP window |
| Serving Git SHA | Expected and observed `d5405cc456496e4b0fc908129d8a3fa6160aac8d` after PR #45 | MATCH | P45 build-info |
| Branch/ref; environment | Expected and observed `main`; `production`; production=true | MATCH | P45 |
| Vercel deployment ID | Accepted observation `dpl_6MgZPGrW8KmguXRCDx4UG6TZKyHt`; linked to expected release | MATCH | P45 inspect plus GitHub commit status |
| Deployment URL | `https://chasum-6st2ikx62-renovisionappcom.vercel.app` | MATCH | P45 linked deployment |
| Active aliases | Observed `chasum.vercel.app`, `chasum-renovisionappcom.vercel.app`; not claimed exhaustive | MATCH | P45 inspect; first alias HTTP-verified |
| Deployment readiness | Expected READY; observed READY at 2026-09-17T22:45:15Z | MATCH | P45 |
| Accepted application baseline vs serving | Application baseline `16bd0a6adda4190bd6cfb7402aa9e3fecfd4138e` vs serving `d5405cc...`; PR #45 documentation-only vs that baseline | INTENTIONAL DIFFERENCE | Accepted P43/P45 tree comparison; P45 non-documentation files identical to pre-merge `47189b0...` |
| Production SHA vs canonical main | Equal in P45 merge/serving observations; not a perpetual equality claim | MATCH | Separate dated Git/runtime observations in 5722300751 |
| Supabase project ref | Expected `kxcydvhswkuzepwzzinq`; live binding not measured here | UNKNOWN | C1; health does not disclose binding |
| Migration summary / applied hashes | Historical claims exist; current applied set not revalidated | UNKNOWN | Files in Git do not prove database state |
| Locked/unapplied migrations | 034/035/036 historically locked/unapplied; no migration, 029/ACL repair or bulk replay authorized here | UNKNOWN | C1; execution restrictions remain, live state unasserted |
| Schema compatibility | P45 reports softSchemaFallbacks=disabled; actual schema compatibility not probed | UNKNOWN | Configuration flag is not schema evidence |
| Cron state | Current schedule/enablement unverified; cronSecret presence alone insufficient | UNKNOWN | No worker or cron call |
| Worker state / freshness | No current execution/error/backlog measurement | UNKNOWN | Not queried |
| Webhook state | Historical OFF record not promoted to fresh state | UNKNOWN | C1; not queried |
| Relevant feature flags | P45 softSchemaFallbacks=disabled; remaining flags not captured | UNKNOWN | Partial flag evidence only |
| Hold/protection state | Prior recovery closed; current technical hold/protection settings not re-read | UNKNOWN | No new hold imposed; PO release gate remains |
| Auth Site URL | Configured value not captured | UNKNOWN | Application URL is not proof of Auth setting |
| Approved redirect fingerprint | Approved full set and current fingerprint unavailable | UNKNOWN | Not captured |
| Auth template fingerprints | Full template bytes/hashes unavailable; approved href retained below | UNKNOWN | No fabricated full-template hash |
| Communication provider presence | P45 email=configured; sms=optional_missing, consistent with baseline | MATCH | Presence only; no send/delivery proof |
| Other configuration presence | P45 cronSecret=configured; stripe/sentry=optional_missing | MATCH | Configuration probe only |
| Environment variables by name/target | Inventory not collected; never publish values | UNKNOWN | Not collected |
| Canonical tenant IDs | Expected GVM `a04e1d65-eeb9-4d72-a5bf-739a9038bb91`, slug `gvm-baby-world`; Production HQ ID unverified | UNKNOWN | C1; no live row inspection |
| Timezone/currency sanity | Expected GVM America/Toronto / CAD; current rows unqueried | UNKNOWN | C1 |
| Queue totals | Not measured | UNKNOWN | Do not substitute historical Staging counts |
| Health endpoint | P45 200; ok=true; production=true; checks.supabase/serviceRole true; email/cronSecret configured; sms/stripe/sentry optional_missing; softSchemaFallbacks=disabled; latencyMs=8 | MATCH | Configuration probe only; timestamp 2026-09-17T22:47:11.209Z; not DB/provider/worker proof |
| Route checks | `/`, `/login` 200; `/dashboard`, `/dashboard/calendar` 307 to login with encoded return path | MATCH | P45 22:47:10Z–22:47:12Z, no sign-in or redirect following |

## Staging

| Field | Expected / last observed | Classification | Evidence |
| --- | --- | --- | --- |
| Application URL | Expected `https://staging.chasumai.com`; not freshly fetched | UNKNOWN | C1 |
| Git SHA / branch/ref | No current serving observation | UNKNOWN | Never substitute a candidate Preview SHA |
| Vercel deployment / active aliases | Current bindings not inspected | UNKNOWN | Not inspected |
| Environment classification | Expected non-Production app using isolated Staging data; actual Vercel target must be observed | UNKNOWN | Do not infer from hostname |
| Supabase project ref | Expected `wnfahklzaxirftyskctd`; current binding unverified | UNKNOWN | C1 |
| Migration summary / locked-unapplied | Current applied set unknown; historical 034–036 restriction remains no-execution instruction | UNKNOWN | No SQL/management reads |
| Schema compatibility / feature flags | Current values not captured | UNKNOWN | Not probed |
| Cron / worker / webhook state | Current values not captured | UNKNOWN | Historical queue counts do not prove health |
| Hold/protection state | Current hosting/Auth protections not inspected | UNKNOWN | Never weaken protection to obtain a pass |
| Auth Site URL | Current configured value not captured | UNKNOWN | Do not assume from app URL |
| Redirect fingerprint / template hashes | Full approved sets/bytes and current hashes unavailable | UNKNOWN | Approved href retained below |
| Providers / variable name-target inventory | Current inventory unavailable | UNKNOWN | No provider tests or secret reads |
| Canonical tenant IDs | Expected HQ `724d9ecd-438d-439e-952e-2d8c4ab4486c`, slug `chasum-hq` | UNKNOWN | C1; Staging identity only |
| Timezone/currency sanity | Historical HQ workflow CAD / America/Toronto; current rows unqueried | UNKNOWN | Historical, not current acceptance |
| Queue totals | Current UNKNOWN; after PR #41: 60 total / 49 pending / 11 completed / 0 processing | UNKNOWN | Historical snapshot only |
| Protected evidence | `92803b48-e65a-48ec-b578-8187afc48542` historically cancelled; preserve appointment and historical queues | UNKNOWN | C1; not re-read or modified |
| Health endpoint | No current response | UNKNOWN | Not requested |
| SHA vs main / Production | Different SHAs can be intentional; no current comparison possible | UNKNOWN | Approval/rationale needed for intentional classification |

## Preview — one record per candidate

Preview is not one shared mutable identity. For each relevant candidate record the same fields as above: application URL, SHA, branch/ref, deployment ID, active aliases, classification, Supabase ref, migration/schema state, locked migrations, cron/worker/webhook/flags/protection, Auth Site URL/redirect/template fingerprints, provider presence, variable names/targets, tenant scope, timezone/currency, queues, health and comparison to approved base/main.

No omitted-status Preview was created by its reported blocked run. No meaningful Preview runtime inventory has been collected for this continuity candidate; all such fields are UNKNOWN until observed. Normal branch-push deployment activity is not acceptance. Expected data plane is isolated Staging, never Production; a Preview hostname or successful build does not prove that binding. Hosted lifecycle testing needs its own authorization. Never process inherited Staging queues to obtain a healthy-looking test.

## Approved Auth contract, not a full snapshot

Accepted recovery-template href:
`{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

These are placeholders, not secret values. This is not the complete template and no full-template fingerprint is claimed. A future authorized collector may hash exact UTF-8 template bytes using SHA-256 and a versioned canonical sorted redirect array, preserving wildcard and trailing-slash semantics. Store redacted fingerprints and evidence time only. Do not store passwords, keys, tokens, cookies, reset links, customer records or message bodies.

## Minimum automation follow-up — NOT IMPLEMENTED

Codex owns collector engineering, Terra intended, separately bounded from omitted-status preservation. First iteration: one dependency-light read-only collector and deterministic offline tests; reuse GitHub metadata, `/api/build-info` and `/api/health`. No new endpoint, CI, credentials or privileged Supabase adapter required. Existing scripts must be source-inspected before reuse; an audit/verify name does not guarantee read-only behavior.

Inputs: explicitly allowlisted repository/app origins and approved candidate/base expectations. Output: redacted local JSON for review, never automatic baseline acceptance, Markdown rewriting, commits or environment changes. Per-field schema: `expected`, `observed`, `classification`, `source`, `observed_at`, `reason`. Missing values remain null/UNKNOWN.

GETs only, bounded timeouts and response sizes, no redirects to unknown hosts, field allowlisting, and redacted errors. No shell evaluation, arbitrary URL fetches, database reads, Auth management calls, provider sends, cron routes or mutation APIs in v1. Verify full SHA/JSON/ref/environment contracts. SSO/login HTML, rate limits and network errors produce UNKNOWN, not assumed application incidents. Separate approved docs-only SHA differences from unexplained drift.

Tests: MATCH; approved difference; unexpected SHA/ref mismatch; missing/stale evidence; redirect/SSO; malformed/oversized response; timeout/429/5xx; sensitive values never printed; and no mutating calls. Release-critical unknown/failure blocks only an explicitly requested release gate. Do not claim to test data-plane binding from endpoints that do not expose it.

Privileged migration/Auth/queue adapters require separately approved scope and access. Timestamped redacted operator evidence is usable meanwhile. No auto-refresh, CI collector, scheduled job or background monitoring has been installed by this documentation task.
