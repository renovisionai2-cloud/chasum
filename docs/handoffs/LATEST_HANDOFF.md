# Chasum — Latest Development Handoff

**Updated:** 2026-09-21 by Codex under ChatGPT Control Tower’s Issue #73 Package A contract.
**Purpose:** recover the next action in 5–10 minutes without historical chat access.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md). This handoff explains that board; it does not own a competing current-state table.

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Current program phase:

**Outside Private Alpha readiness — IN PROGRESS.**

Git main at this restamp: `ec03d36f39705024dfcc5b923ca87e42795f3743`.

Issue #72 / PR #78 is merged and Production accepted. Issue #73 is active.

Observability program:
- Issue #66 / PR #67 Phase A — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #69 / PR #70 B2 — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #68 / PR #74 B1 — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #75 / PR #76 C1 privacy hardening — **CLOSED / PRODUCTION ACCEPTED**;
- parent Issue #65 — **CLOSED / COMPLETE**.

Observability remains COMPLETE and Production Sentry OFF. Issue #72 closeout directly verified Production build `ec03d36...`; no environment probe is part of Package A.

Do not reopen observability merely for deeper APM ideas. Production Sentry activation is a separate later Product Owner gate.

## B. Current Outside Private Alpha queue

### CURRENT — Issue #73 Package A

Issue #72 is CLOSED / PRODUCTION ACCEPTED. PR #78 merged at
`ec03d36f39705024dfcc5b923ca87e42795f3743`. Migration
`20260920230358 / tenant_identity_gate` is applied/accepted in Production and
Staging. Refreshed existing-GVM dashboard acceptance passed with unchanged
4 Businesses / 4 Locations / 1 membership / 0 identity decisions.

Package A is the additive pure domain, normalization, validation, duplicate and
dependency analysis, deterministic preview and SHA-256 contract. See
[Package A](../import/ISSUE_73_PACKAGE_A.md). No persistence, migration, upload,
UI or operational write is authorized. Package B needs separate Level-3 approval.

Locked decisions: no valid email = unsupported; staff required; exact financial
truth or explicit reconciliation; private temporary input and safe durable
outcomes later; required source account key. Summer is advisory, never a second
write authority. Do not build competitor-specific write engines.

GVM and HQ remain normal tenants; Platform Admin is separate. Business →
Locations and #72 membership-first identity remain unchanged.

## C. Program sequence

Outside Private Alpha readiness:
1. Observability / #65 — **COMPLETE**;
2. Tenant identity/onboarding safety / #72 — **CLOSED / PRODUCTION ACCEPTED**;
3. Governed switching/import / #73 — **ACTIVE — Package A candidate**;
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

Issue #72 implementation and high-risk audits are complete. Package A pure domain implementation is Medium; any future material security correction is separately scoped. Do not reopen implementation or escalate effort merely to restamp status.

## F. Environment safety

Production:
- host remains `https://chasum.vercel.app`;
- Production Supabase ref `kxcydvhswkuzepwzzinq`;
- GVM normal tenant remains protected;
- do not manufacture bookings/provider sends;
- Issue #72 migration APPLIED / ACCEPTED; Package A grants no further environment action.

Staging:
- expected canonical hostname `https://staging.chasumai.com`;
- Staging Supabase ref `wnfahklzaxirftyskctd`; Issue #72 migration APPLIED and acceptance PASS.
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

Current main / accepted Production:
ec03d36f39705024dfcc5b923ca87e42795f3743

Phase 5 and observability COMPLETE. Production Sentry OFF.
Issue #72 CLOSED / PRODUCTION ACCEPTED.
Current phase: Outside Private Alpha readiness — IN PROGRESS.
NEXT: review #73 Package A pure preview candidate.
Package B database/write work requires separate Level-3 PO approval.
No environment mutation, UI, upload or import commit in Package A.

Then:
Commercial SaaS Gate B → Summer Business Manager horizontal v1.

Do not reopen accepted observability work without contradictory evidence.
Do not start Gate B or Summer horizontal-v1 before Outside Private Alpha readiness closes.
Proceed automatically through safe gates; stop only for a genuine Product Owner decision.
```

Refresh this handoff after a major release/phase completion, high-risk incident closure, architecture/governance change, every few significant PRs, or approximately weekly during heavy development. Use one scoped restamp, not endless documentation churn.
