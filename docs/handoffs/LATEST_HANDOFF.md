# Chasum — Latest Development Handoff

**Updated:** 2026-09-22 by ChatGPT Control Tower after Issue #83 Stage 1A merge + Production application deployment acceptance.
**Purpose:** recover the next action in 5–10 minutes without historical chat access.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md). This handoff explains that board; it does not own a competing current-state table.

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Current program phase:

**Outside Private Alpha readiness — IN PROGRESS.**

Application-release main at this restamp base: `88f6902e4688dc610ecba4e52ecc17d02ec25e9b` (PR #85 Stage 1A merged; normal Vercel Production deployment SUCCESS). This docs-only restamp will advance Git main without changing application behavior.

Issue #72 / PR #78 is merged and Production accepted. Issue #73 is active.

Observability program:
- Issue #66 / PR #67 Phase A — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #69 / PR #70 B2 — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #68 / PR #74 B1 — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #75 / PR #76 C1 privacy hardening — **CLOSED / PRODUCTION ACCEPTED**;
- parent Issue #65 — **CLOSED / COMPLETE**.

Observability remains COMPLETE and Production Sentry OFF. Issue #72 closeout directly verified Production build `ec03d36...`. PR #79 Package A merged at `ea2fbe18...` and its automatic Vercel Production deployment is SUCCESS; no live import/write path exists.

Do not reopen observability merely for deeper APM ideas. Production Sentry activation is a separate later Product Owner gate.

## B. Current Outside Private Alpha queue

### CURRENT — Stage 1A accepted / Stage 1B separately gated / #73 B1 accepted foundation

Issue #72 is CLOSED / PRODUCTION ACCEPTED. PR #78 merged at
`ec03d36f39705024dfcc5b923ca87e42795f3743`. Migration
`20260920230358 / tenant_identity_gate` is applied/accepted in Production and
Staging. Refreshed existing-GVM dashboard acceptance passed with unchanged
4 Businesses / 4 Locations / 1 membership / 0 identity decisions.

Package A remains **COMPLETE / PRODUCTION ACCEPTED CODE FOUNDATION**. PR #82 Package B1 is merged at
`6b095cbf8c42664a44398c01b2b19ff2e1f15c40`. The exact audited migration
`20260921203029_governed_import_foundation.sql` (SHA-256
`57b79680fdc60ad5789d90d1d9e6e9600b9b15fb84002687e86c1130acd4dc9f`) is
**APPLIED + VERIFIED on Staging only**. Hosted Staging verification confirmed the three empty import tables, RLS + FORCE RLS, zero policies, service_role SELECT-only, helper SECURITY INVOKER/pinned search_path and revoked API EXECUTE. Production Supabase has NOT received B1. B2 operational writer remains NOT AUTHORIZED.

Issue #83 Stage 1A operator Business Service Catalog convergence is **MERGED / PRODUCTION ACCEPTED APPLICATION RELEASE** at `88f6902e4688dc610ecba4e52ecc17d02ec25e9b`. Services, Calendar/Booking Sheet, CRM Booking Sheet and Reception now use the shared Business catalog / `service_locations` offered-at rule internally; no Service duplication. Governed hosted acceptance passed after the package/location empty-state correction. Test Studio temporary fixture/Auth cleanup was exact: pre/post fingerprint `c1844210672164d00546d8fc222f940d`. Stage 1A made no Supabase migration or Production tenant-data change. Public booking remains frozen until Stage 1B.

Before Stage 1B, Level-3 same-Business relationship integrity/RLS hardening is mandatory for `service_locations`, `staff_locations`, and `staff_services`. Stage 1B implementation is NOT AUTHORIZED; Staff-location server convergence and public Service convergence must ship together under a separate PO gate. Stage 1C remains later; Package B2 remains blocked.

Locked decisions: no valid email = unsupported; staff required; exact financial
truth with revised D3 (NONE/representable EXACT only; reconciliation stays REVIEW/BLOCK, no new payment status); private temporary input and safe durable
outcomes later; required source account key. Summer is advisory, never a second
write authority. Do not build competitor-specific write engines.

GVM and HQ remain normal tenants; Platform Admin is separate. Business →
Locations and #72 membership-first identity remain unchanged.

## C. Program sequence

Outside Private Alpha readiness:
1. Observability / #65 — **COMPLETE**;
2. Tenant identity/onboarding safety / #72 — **CLOSED / PRODUCTION ACCEPTED**;
3. Governed switching/import / #73 — **ACTIVE — Package A COMPLETE; B1 MERGED + STAGING VERIFIED / PRODUCTION DB NOT APPLIED; B2 NOT AUTHORIZED**;
4. onboard at least one selected outside design partner without developer-only tenant surgery and without P0 tenant/money-truth regression.

Then:
**Commercial SaaS Gate B**
→ **Summer Business Manager horizontal v1**
→ continued launch hardening
→ broader commercial/public launch.

Core Operations defects continue when real evidence appears. GVM and HQ remain validation tenants, not product forks and not the whole roadmap.

## D. Product / competitive anchor

Chasum is a **world-class AI Business Operating System for service businesses**, not merely booking software.

Connected operating chain:
Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer Intelligence.

Competitive Product Gate is permanent for material customer/operator work. Relevant benchmark set includes Fresha, Jane, Vagaro, Calendly, Square Appointments, Mangomint, Boulevard, GlossGenius, Mindbody and Booksy. Extract mature workflow principles; do not copy products.

Summer remains the core intelligence differentiator:

UNDERSTAND → EXPLAIN → RECOMMEND → ACT SAFELY → AUDIT.

## E. Agent / Astra governance

Darshan = Founder / CEO / Product Owner; final merge/Production authority.
ChatGPT = Control Tower / product and development program lead.
Codex = primary engineer.  
Claude = independent large-context/high-risk auditor.  
Momentic = browser/workflow regression; Issue #72 hosted acceptance used the approved non-recording Playwright equivalent because Momentic 3.52.0 retained protected-preview headers in artifacts.
Cursor = local/authenticated/device-specific fallback.

GPT-6 Astra effort:
- Light: simple/bounded/mechanical;
- Medium: normal engineering;
- High: difficult engineering only when Medium is insufficient;
- Extra High: justified Level-3 security/RLS/tenancy/financial work;
- Ultra: exceptional only.

Issue #72 implementation/high-risk audits and Issue #73 Package A/B1 implementation/audits are complete. B1 is merged and Staging-verified; Production DB application remains separately governed. B2 is not authorized. Do not reopen accepted Package A/B1 work absent contradictory evidence.

## F. Environment safety

Production:
- host remains `https://chasum.vercel.app`;
- Production Supabase ref `kxcydvhswkuzepwzzinq`;
- GVM normal tenant remains protected;
- do not manufacture bookings/provider sends;
- Issue #72 migration APPLIED / ACCEPTED; Package A/B1 repository changes merged. B1 migration is NOT APPLIED to Production; B2 remains NOT authorized.

Staging:
- expected canonical hostname `https://staging.chasumai.com`;
- Staging Supabase ref `wnfahklzaxirftyskctd`; Issue #72 and B1 migrations APPLIED / acceptance PASS. B1 ledger name is `governed_import_foundation` with hosted generated version `20260921220118`; repository filename remains `20260921203029_governed_import_foundation.sql`, exact SQL hash verified.
- Accepted Preview: `https://chasum-git-feat-tenant-identity-duplica-64c5c5-renovisionappcom.vercel.app`; data plane Staging.
- No further #72 Staging mutation is authorized unless needed by a newly identified blocker; this handoff is not an execution grant.

Issue #57 branded-domain cutover remains deferred.

## G. New-chat bootstrap

```text
Repository: renovisionai2-cloud/chasum. This is not a fresh project.

Read:
1. docs/CURRENT_PROJECT_STATE.md
2. docs/handoffs/LATEST_HANDOFF.md
3. docs/runtime/ENVIRONMENT_MANIFEST.md
4. relevant docs/company/CHASUM_BIBLE.md
5. docs/LAUNCH_READINESS.md

Freshly query remote main and active PR/issue state.

Application-release main at this restamp base:
88f6902e4688dc610ecba4e52ecc17d02ec25e9b

Phase 5 and observability COMPLETE. Production Sentry OFF.
Issue #72 CLOSED / PRODUCTION ACCEPTED.
Current phase: Outside Private Alpha readiness — IN PROGRESS.
NEXT GATE: Issue #81 Stage 1B Level-3 security/architecture preflight only — same-Business relationship RLS/integrity + combined Staff-location server/public convergence contract. Stage 1B implementation is NOT authorized yet.
Stage 1A is MERGED / PRODUCTION ACCEPTED. Public booking remains unchanged until the separately approved Stage 1B release. Stage 1C and B2 remain blocked.
B1 is MERGED + STAGING VERIFIED / PRODUCTION DB NOT APPLIED; do NOT start B2.
Package A is merged/accepted and contains no environment mutation, UI, upload or import commit.

Then:
Commercial SaaS Gate B → Summer Business Manager horizontal v1.

Do not reopen accepted observability work without contradictory evidence.
Do not start Gate B or Summer horizontal-v1 before Outside Private Alpha readiness closes.
Proceed automatically through safe gates; stop only for a genuine Product Owner decision.
```

Refresh this handoff after a major release/phase completion, high-risk incident closure, architecture/governance change, every few significant PRs, or approximately weekly during heavy development. Use one scoped restamp, not endless documentation churn.
