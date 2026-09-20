# Chasum — Environment Manifest

**Record owner:** ChatGPT Control Tower. **Prepared:** 2026-09-17; **current reconciliation:** 2026-09-20 after Phase 5 completion, PR #59 direct Production verification, PR #63 Production acceptance, Issue #53 repository governance, and PR #63 temporary-credential cleanup. This manifest preserves dated observations and their limits; it is not an automatic inventory.
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
- **P52:** Accepted Cursor PR #52 Production closeout comment 5737683070. Historical serving SHA `cd735943518fda25be0bcc7e9f697b09b29fca9a`; deployment `dpl_8yRCE7hjaRNMEdURgBthh1SkY9gm`; target production; branch/ref main; READY; primary alias `https://chasum.vercel.app`. Health is configuration-presence only. **Historical; superseded as serving identity by P55-PROD.** Do not delete.
- **P55:** PR #55 hosted Preview/Staging acceptance comment 5744195939 and Control Tower acceptance 5744211544. Dated NON-PRODUCTION observation. Exact tested application HEAD `a773772309aab9604cd46ba07cb2ca69f3c51989`; Preview alias `chasum-git-feat-trusted-operator-access-v1-renovisionappcom.vercel.app`; unique deployment `chasum-dfigrczx4-renovisionappcom.vercel.app`; Staging data plane `wnfahklzaxirftyskctd`. Verdict B — PASS WITH NON-BLOCKING LIMITATIONS. Retain as historical Preview/Staging evidence. Later Production serving identity is P55-PROD.
- **P55-PROD:** Accepted Cursor PR #55 Production runtime verification 5744330411 and Control Tower Production acceptance 5744361600. Last runtime-verified Production application baseline `fc9a302a1a2e6feedd550478264d97eec9216b29`; approved PR head before merge `30ae664b36fb45892497dd89360de6e7654d6967`; merge `2026-09-19T18:19:57Z`; deployment `dpl_4ef8swfREjLjcgQyZDtuJx31K4fu`; unique URL `https://chasum-bxotnq0i1-renovisionappcom.vercel.app`; target production; branch/ref main; READY / success; primary alias `https://chasum.vercel.app`; additional observed alias `https://chasum-renovisionappcom.vercel.app`. Exact `/api/build-info` HTTP 200: `{"commit":"fc9a302a1a2e6feedd550478264d97eec9216b29","commitShort":"fc9a302","env":"production","ref":"main","production":true}`. Exact `/api/health` HTTP 200: `{"ok":true,"production":true,"checks":{"supabase":true,"serviceRole":true,"email":"configured","cronSecret":"configured","sms":"optional_missing","stripe":"optional_missing","sentry":"optional_missing","softSchemaFallbacks":"disabled"},"latencyMs":0,"timestamp":"2026-09-19T18:24:21.429Z"}`. Health is configuration-presence only. This documentation closeout copies that already-accepted serving observation; it did not re-probe Production. A later documentation-only merge may advance Git main / Vercel build SHA without changing the executable application tree; do not restamp merely to chase that SHA.
- **P59-PROD:** Issue #58 / PR #59 accepted Production verification 5747334261 / 5747352377. Exact Production `/api/build-info` observed `commit=3629004e05fb0a921ab96954ab701eb4a2f4cd5a`, `env=production`, `ref=main`, `production=true`; `/api/health` HTTP 200 with configuration-presence checks only. Existing authorized GVM session verified correct tenant/location and no HQ/Platform Admin leakage. True 1366×768, 1024×768 and 1180×820 Reception/calendar containment passed. No synthetic booking, email/SMS send, Auth/config/tenant or Production data mutation.
- **P63-PREVIEW:** PR #63 final controlled Preview/Staging acceptance comment 5750298567. Exact candidate `5988f4aef037cf376c6c5085e7ab1e713ef4f260`; Preview target; Staging data plane `wnfahklzaxirftyskctd`; one internal customer confirmation accepted by Resend and observed in inbox; test address/directions/timezone/content passed; temporary Staging address restored; branch-scoped Preview `RESEND_API_KEY` removed.
- **P63-PROD:** Issue #62 Control Tower Production acceptance 5750358757. PR #63 squash merge/current accepted application release `ef9d2799c5f39abbcd1e3478f828f5f3443d54ea`; Vercel commit status SUCCESS / “Deployment has completed”; current merged source verified; Production Supabase `kxcydvhswkuzepwzzinq` read-only inspected; GVM tenant identity, structured location schema and real Burlington address intact. No migration, booking, customer email or Production configuration/provider/data mutation. **Limitation:** Control Tower could not freshly fetch Production `/api/build-info` or `/api/health` for this release, so latest serving-endpoint identity is UNKNOWN rather than inferred.
- **R53:** Issue #53 ruleset acceptance 5750446328. Repository ruleset `23730556` (“Chasum main governed release”) active on `main`: PR required, approvals 0, review-thread resolution, required checks `Vercel` + `competitive-product-gate`, strict/up-to-date, force-push/deletion blocked, repository-admin bypass PR-only. Repository governance only; no application/runtime mutation.
- **C63-KEY:** PR #63 cleanup comment 5750376106. Temporary Resend key `Chasum PR63 Preview Acceptance 2026-09-20` permanently revoked after branch env removal. Follow-up inventory no longer contained that key; Production Resend credentials remained present and unchanged.
- **P50:** Accepted Cursor PR #50 Production closeout comment 5736696975. Historical serving SHA `30d7de3419a74f9f15159ff304545e7e46a5093d`; deployment `dpl_AeqBfh1AhN3uyv66WJLu5vtyVm33`. Superseded as serving identity by accepted P52.
- **P49:** Accepted Cursor PR #49 post-incident recheck comment 5736348282 and Control Tower closeout 5736361422. Historical serving SHA `d4529afcb49372961e2f02f35b7e51cdff4012bf`; deployment `dpl_4GfV2vY4Yov9fx1mQobCFWUz6n2k`. Superseded as serving identity by accepted P50.
- **P45:** Accepted Cursor PR #45 release report comment 5722300751. Historical serving SHA `d5405cc456496e4b0fc908129d8a3fa6160aac8d`; deployment `dpl_6MgZPGrW8KmguXRCDx4UG6TZKyHt`. Superseded as serving identity by accepted P49, then P50.
- **P43:** [Accepted PR #43](https://github.com/renovisionai2-cloud/chasum/pull/43), [changelog](../CHANGELOG.md), and [historical board](../handoffs/archive/CURRENT_PROJECT_STATE_20260917_PRE_CONTINUITY.md).
- **C1:** Approved environment/tenant separation and historical configuration in that archived board. These are expectations/history, not fresh live measurements.

Current 2026-09-20 reconciliation uses only accepted evidence above. Phase 5 is COMPLETE (Issue #47 / #54 closeout), but that does not turn Staging evidence into Production evidence. PR #63 established current GVM tenant/location schema/address truth through read-only Production queries, while its Production diagnostic endpoints remained inaccessible to Control Tower; preserve that distinction. Continuity collector remains SPECIFIED / NOT IMPLEMENTED. Historical PR #55 Preview/Staging configuration may still exist; two PR #55-named Resend API keys were still present in the provider inventory during PR #63 cleanup and require separate dependency review + Product Owner confirmation before irreversible revocation.

## 2026-09-20 current reconciliation

- Restamp application base before this docs-only PR: `ef9d2799c5f39abbcd1e3478f828f5f3443d54ea`.
- Phase 5: **COMPLETE** through genuine GVM Production use; do not manufacture replacement evidence.
- Latest directly observed Production runtime endpoint identity: `3629004e05fb0a921ab96954ab701eb4a2f4cd5a` (P59-PROD).
- Latest accepted application release: `ef9d2799c5f39abbcd1e3478f828f5f3443d54ea` (P63-PROD). Vercel deployment status and Production data-plane/schema checks passed; latest `/api/build-info` / `/api/health` were not freshly observed.
- Current Private Alpha Production hostname remains `https://chasum.vercel.app`. Issue #57 branded-domain cutover is deferred by Product Owner decision 5745462206.
- Main branch is ruleset-governed (R53).
- PR #63 temporary acceptance key is permanently revoked (C63-KEY).

## Production

| Field | Expected / last observed | Classification | Evidence |
| --- | --- | --- | --- |
| Application URL | Expected and observed `https://chasum.vercel.app` | MATCH | P55-PROD alias copied from 5744330411 |
| Serving Git SHA | Last directly observed via Production `/api/build-info`: `3629004e05fb0a921ab96954ab701eb4a2f4cd5a` (PR #59). Later accepted release `ef9d2799c5f39abbcd1e3478f828f5f3443d54ea` deployed successfully, but its serving endpoint was not freshly observed. | UNKNOWN (latest serving endpoint) | P59-PROD direct endpoint; P63-PROD release acceptance |
| Branch/ref; environment | Last directly observed `main`; `production`; production=true on P59-PROD. Latest P63 release is on Git `main`, but runtime endpoint fields were not freshly observed. | UNKNOWN (latest endpoint) | P59-PROD + P63-PROD |
| Vercel deployment ID | Latest PR #63 Production deployment ID was not captured by Control Tower; GitHub/Vercel status on merge commit reported deployment completed. | UNKNOWN | P63-PROD |
| Deployment URL | Unique `https://chasum-bxotnq0i1-renovisionappcom.vercel.app`; primary alias is the accepted serving URL | MATCH | P55-PROD |
| Active aliases | Observed `chasum.vercel.app` and `chasum-renovisionappcom.vercel.app`; not claimed exhaustive | MATCH | P55-PROD; primary alias is `chasum.vercel.app` |
| Deployment readiness | PR #63 merge commit reported Vercel SUCCESS / “Deployment has completed.” | MATCH (deployment status only) | P63-PROD |
| Accepted application baseline vs serving | Latest accepted application release is `ef9d2799…`; last directly observed serving endpoint identity is `3629004…`. Do not infer endpoint equality from deployment status alone. | UNKNOWN (latest serving endpoint) | P59-PROD + P63-PROD |
| Production SHA vs canonical main | Git main at restamp base = `ef9d2799…`; PR #63 Vercel deployment completed. Latest Production endpoint SHA not freshly observed. | UNKNOWN (latest endpoint) | P63-PROD |
| Supabase project ref | Production project `kxcydvhswkuzepwzzinq` directly used for read-only PR #63 closeout queries. | MATCH (data-plane project queried) | P63-PROD |
| Migration summary / applied hashes | Historical claims exist; current applied set not revalidated. The `cd73594…fc9a302` release included no migration/RLS/schema files. | UNKNOWN | Files in Git do not prove database state |
| Locked/unapplied migrations | 034/035/036 historically locked/unapplied; no migration, 029/ACL repair or bulk replay authorized here | UNKNOWN | C1; execution restrictions remain, live state unasserted |
| Schema compatibility | Last recorded P55-PROD softSchemaFallbacks=disabled | UNKNOWN | Configuration flag is not schema evidence |
| Cron state | Current schedule/enablement unverified; cronSecret presence alone insufficient | UNKNOWN | No worker or cron call |
| Worker state / freshness | No current execution/error/backlog measurement | UNKNOWN | Not queried |
| Webhook state | Historical OFF record not promoted to fresh state | UNKNOWN | C1; not queried |
| Relevant feature flags | Last recorded P55-PROD softSchemaFallbacks=disabled; remaining flags not captured | UNKNOWN | Partial flag evidence only |
| Hold/protection state | Prior recovery closed; current technical hold/protection settings not re-read | UNKNOWN | No new hold imposed; PO GVM-grant gate remains |
| Auth Site URL | Configured value not captured | UNKNOWN | Application URL is not proof of Auth setting |
| Approved redirect fingerprint | Approved full set and current fingerprint unavailable | UNKNOWN | Not captured |
| Auth template fingerprints | Full template bytes/hashes unavailable; approved href retained below | UNKNOWN | No fabricated full-template hash |
| Communication provider presence | Last recorded P55-PROD email=configured; sms=optional_missing | MATCH (presence only) | P55-PROD health; no send/delivery proof |
| Other configuration presence | Last recorded P55-PROD cronSecret=configured; stripe/sentry=optional_missing; supabase/serviceRole=true | MATCH (presence only) | P55-PROD health; configuration probe only |
| Environment variables by name/target | Inventory not collected; never publish values | UNKNOWN | Not collected |
| Canonical tenant IDs | GVM `a04e1d65-eeb9-4d72-a5bf-739a9038bb91`, slug `gvm-baby-world` observed in Production read-only query. Production HQ ID remains unverified here. | MATCH for GVM / UNKNOWN HQ | P63-PROD |
| Timezone/currency sanity | GVM `America/Toronto` / CAD observed in Production read-only query. | MATCH | P63-PROD |
| Queue totals | Not measured | UNKNOWN | Do not substitute historical Staging counts |
| Health endpoint | Last directly observed HTTP 200 on PR #59 Production verification; configuration-presence only. No fresh PR #63 Production health response from Control Tower. | UNKNOWN (latest) | P59-PROD direct; P63-PROD limitation |
| Route checks | PR #59 Production verification exercised authenticated GVM dashboard/calendar/Reception at true viewports. No new synthetic booking/provider send. PR #63 closeout did not repeat browser runtime routes. | MATCH for P59 observation / UNKNOWN latest | P59-PROD + P63-PROD |
| Hosted Staging financial chain (#48) | WAIVED FOR THAT RELEASE ONLY / NOT DEMONSTRATED | INTENTIONAL DIFFERENCE | 5736361422; not a permanent waiver |

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
| HQ Phase 5 connected-chain dogfood | MET on Staging/Preview only (Issue #47 comment 5737101477). Not a Production observation. | INTENTIONAL DIFFERENCE | Staging/Preview evidence; do not copy into Production identity |

## Preview — one record per candidate

Preview is not one shared mutable identity. For each relevant candidate record the same fields as above: application URL, SHA, branch/ref, deployment ID, active aliases, classification, Supabase ref, migration/schema state, locked migrations, cron/worker/webhook/flags/protection, Auth Site URL/redirect/template fingerprints, provider presence, variable names/targets, tenant scope, timezone/currency, queues, health and comparison to approved base/main.

Controlled NON-PRODUCTION Preview/Staging acceptance for PR #63 is **PASS** (P63-PREVIEW): exact candidate `5988f4aef037cf376c6c5085e7ab1e713ef4f260`, Preview environment, Staging data plane `wnfahklzaxirftyskctd`. One internal customer confirmation was accepted by Resend and observed in inbox with the test appointment’s location name, physical address, Google Maps directions and correct America/Toronto time. The temporary Staging location address was restored exactly, the PR #63 branch-scoped Vercel `RESEND_API_KEY` was removed, and the dedicated temporary Resend key was later permanently revoked (C63-KEY). No Production/GVM mutation or send occurred in that acceptance.

Controlled NON-PRODUCTION Preview/Staging acceptance for PR #55 on exact application HEAD `a773772309aab9604cd46ba07cb2ca69f3c51989` is **B — PASS WITH NON-BLOCKING LIMITATIONS** (5744195939 / 5744211544). Preview alias `https://chasum-git-feat-trusted-operator-access-v1-renovisionappcom.vercel.app` served `commit=a773772309aab9604cd46ba07cb2ca69f3c51989`, `env=preview`, `production=false`, `ref=feat/trusted-operator-access-v1`; health `email=configured`. Data plane was Staging `wnfahklzaxirftyskctd`, never Production `kxcydvhswkuzepwzzinq`. Critical hosted results passed: User A→B session replacement, correct Chasum HQ landing, no auto-create, no Sam's Auto / GVM / cross-tenant leakage, `/owner` denied, `/dashboard/hq` protected, operational surfaces loaded, delegated Trusted Admin could not manage Trusted Access, revoke/re-invite/cross-tenant controls, final disposable Trusted Admin revoked. Non-blocking UX limitations (security PASS, not claimed fixed): revoke/ban can land at `/login` instead of authenticated `/access-denied`; used one-time magiclink replay can leave `?error=auth_callback_failed` on an already-authenticated User B tab. Final Staging test Trusted Admin `chasum1215+pr55ta@gmail.com` is **REVOKED** (Auth identity remains; no active HQ Trusted Admin membership; no manual Auth delete or metadata edit). Temporary NON-PRODUCTION acceptance configuration may still exist and was not removed in this documentation closeout: branch-scoped Preview `RESEND_API_KEY`, branch-scoped Preview `NEXT_PUBLIC_APP_URL`, and a Staging Auth redirect allowlist entry for this Preview alias. Later removal is IMPORTANT SECURITY/CONFIG HYGIENE / POST-RELEASE SAFE / SEPARATE CONTROLLED NON-PRODUCTION CLEANUP. Production release is now verified (P55-PROD) and no further PR #55 hosted retest is currently required. Do not treat a Preview hostname or successful build as Production serving identity. Never process inherited Staging queues to obtain a healthy-looking test.

HQ Phase 5 connected-chain dogfood (Issue #47 comment 5737101477) was Staging/Preview evidence on an earlier current-tree Preview. It is not Production serving identity and must not be copied into the Production table.

## Approved Auth contract, not a full snapshot

Accepted recovery-template href:
`{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

These are placeholders, not secret values. This is not the complete template and no full-template fingerprint is claimed. A future authorized collector may hash exact UTF-8 template bytes using SHA-256 and a versioned canonical sorted redirect array, preserving wildcard and trailing-slash semantics. Store redacted fingerprints and evidence time only. Do not store passwords, keys, tokens, cookies, reset links, customer records or message bodies.

## Minimum automation follow-up — NOT IMPLEMENTED

Codex owns collector engineering, Terra intended, separately bounded from Trusted Operator Access V1. First iteration: one dependency-light read-only collector and deterministic offline tests; reuse GitHub metadata, `/api/build-info` and `/api/health`. No new endpoint, CI, credentials or privileged Supabase adapter required. Existing scripts must be source-inspected before reuse; an audit/verify name does not guarantee read-only behavior.

Inputs: explicitly allowlisted repository/app origins and approved candidate/base expectations. Output: redacted local JSON for review, never automatic baseline acceptance, Markdown rewriting, commits or environment changes. Per-field schema: `expected`, `observed`, `classification`, `source`, `observed_at`, `reason`. Missing values remain null/UNKNOWN.

GETs only, bounded timeouts and response sizes, no redirects to unknown hosts, field allowlisting, and redacted errors. No shell evaluation, arbitrary URL fetches, database reads, Auth management calls, provider sends, cron routes or mutation APIs in v1. Verify full SHA/JSON/ref/environment contracts. SSO/login HTML, rate limits and network errors produce UNKNOWN, not assumed application incidents. Separate approved docs-only SHA differences from unexplained drift.

Tests: MATCH; approved difference; unexpected SHA/ref mismatch; missing/stale evidence; redirect/SSO; malformed/oversized response; timeout/429/5xx; sensitive values never printed; and no mutating calls. Release-critical unknown/failure blocks only an explicitly requested release gate. Do not claim to test data-plane binding from endpoints that do not expose it.

Privileged migration/Auth/queue adapters require separately approved scope and access. Timestamped redacted operator evidence is usable meanwhile. No auto-refresh, CI collector, scheduled job or background monitoring has been installed by this documentation task.
