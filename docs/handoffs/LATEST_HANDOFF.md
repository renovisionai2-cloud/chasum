# Chasum — Latest Development Handoff

**Updated:** 2026-09-21 by Codex under ChatGPT Control Tower’s Issue #72 acceptance restamp contract.
**Purpose:** recover the next action in 5–10 minutes without historical chat access.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md). This handoff explains that board; it does not own a competing current-state table.

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Current program phase:

**Outside Private Alpha readiness — IN PROGRESS.**

Git main at this restamp: `d6f6cd0481305c07d6c721cf3bb4b4cc147ac433`.

Accepted Issue #72 application candidate: `4c39652866117a4ce93b4f8193375c8816c2b582` on **OPEN / UNMERGED PR #78**. A later documentation-restamp HEAD is not a newly audited application candidate.

Observability program:
- Issue #66 / PR #67 Phase A — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #69 / PR #70 B2 — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #68 / PR #74 B1 — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #75 / PR #76 C1 privacy hardening — **CLOSED / PRODUCTION ACCEPTED**;
- parent Issue #65 — **CLOSED / COMPLETE**.

PR #76 Vercel Production status is SUCCESS. Control Tower could not freshly fetch Production `/api/build-info` / `/api/health`; latest endpoint identity remains UNKNOWN rather than inferred. Production Sentry remains OFF. No DSN, trace-sampling, source-map, Vercel environment, provider, migration/RLS/Auth, worker, provider-send or GVM/customer/tenant mutation occurred in the observability closeout.

Do not reopen observability merely for deeper APM ideas. Production Sentry activation is a separate later Product Owner gate.

## B. Current Outside Private Alpha queue

### CURRENT GATE — Issue #72: Product Owner merge / Production rollout decision

Implementation is complete on PR #78. Account verification → membership/ownership resolution → explicit existing-business/create-new intent → conservative ambiguity preflight → STOP / Private Alpha review or server-only atomic creation → durable decision audit → dashboard.

Completed gates:
- Initial independent Level-3 audit and focused helper-privilege re-audit: **PASS**.
- Separately approved migration `20260920230358_tenant_identity_gate`: **APPLIED TO STAGING ONLY**; ledger reconciled to `20260920230358 / tenant_identity_gate`.
- Live Staging DB/RLS/RPC acceptance: **PASS**.
- Hosted Preview acceptance: **PASS** at application candidate `4c39652866117a4ce93b4f8193375c8816c2b582`.
- Post-create dashboard/onboarding router-cache loop: **FIXED / ACCEPTED**.
- Focused independent Claude audit: **A — PASS FOR PRODUCT OWNER MERGE/ROLLOUT DECISION AFTER DOCUMENTATION RESTAMP**.
- Synthetic cleanup restored 4 Businesses / 4 Locations / 1 membership / 0 identity decisions.

Hosted Trusted Operator scenario was not executed because no safe synthetic fixture was available; this is explicitly **NON-BLOCKING**.

**PR #78 is unmerged. Production migration is unapplied. Merge, Production sequencing and controlled Production acceptance need Darshan’s explicit decision. Issue #72 is not closed.**

Important invariants remain:
- Authentication/dashboard reads never create tenants.
- Business → Locations; a second location does not imply a new Business.
- Existing membership resolves first; ambiguous identity never silently creates or grants access.
- Discovery exposes no private tenant/owner records.
- GVM and Chasum HQ remain normal tenants; Platform Admin is separate at `/owner`.
- Fuzzy matching/KYC/automated merge remain out of scope.

### AFTER #72 PRODUCTION CLOSEOUT — Issue #73: governed switching/import readiness

Read-only architecture + competitive assessment is also complete.

Direction:
verified tenant → normalized source data → deterministic preview → explicit commit → idempotent source mapping → durable audit.

V1 entities:
locations, services, staff, staff-service assignments, customers, future appointments.

Do not build one importer per competitor. Do not use GVM service-role scripts as a commercial migration product. Summer may later explain/recommend mappings, but deterministic import truth remains authoritative.

## C. Program sequence

Outside Private Alpha readiness:
1. Observability / #65 — **COMPLETE**;
2. Tenant identity/onboarding safety / #72 — **ACCEPTANCE/AUDIT COMPLETE; PO MERGE + PRODUCTION ROLLOUT DECISION PENDING**;
3. Governed switching/import / #73 — after #72 Production closeout;
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

Issue #72 implementation and high-risk audits are complete. This documentation-only restamp is Light; any future material security correction is separately scoped. Do not reopen implementation or escalate effort merely to restamp status.

## F. Environment safety

Production:
- host remains `https://chasum.vercel.app`;
- Production Supabase ref `kxcydvhswkuzepwzzinq`;
- GVM normal tenant remains protected;
- do not manufacture bookings/provider sends;
- Issue #72 migration NOT APPLIED; no Production migration or PR merge without explicit Product Owner decision.

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

Git main at documentation restamp:
d6f6cd0481305c07d6c721cf3bb4b4cc147ac433
Accepted Issue #72 application candidate (PR #78, unmerged):
4c39652866117a4ce93b4f8193375c8816c2b582

Phase 5 is COMPLETE.
Issue #65 observability parent is CLOSED / COMPLETE.
PRs #67, #70, #74 and #76 are Production accepted.
Production Sentry remains OFF.

Current program phase:
Outside Private Alpha readiness.

NEXT:
Prepare Darshan’s coordinated PR #78 merge / Production rollout decision.
Issue #72 implementation, Staging migration, DB/RLS/RPC and hosted acceptance,
router-cache correction and independent audit are complete.
Production migration remains unapplied. PR #78 remains unmerged.
No further Staging mutation absent a newly identified blocker.

After #72 Production closeout:
Issue #73 governed switching/import readiness.

Then:
Commercial SaaS Gate B → Summer Business Manager horizontal v1.

Do not reopen accepted observability work without contradictory evidence.
Do not start Gate B or Summer horizontal-v1 before Outside Private Alpha readiness closes.
Proceed automatically through safe gates; stop only for a genuine Product Owner decision.
```

Refresh this handoff after a major release/phase completion, high-risk incident closure, architecture/governance change, every few significant PRs, or approximately weekly during heavy development. Use one scoped restamp, not endless documentation churn.
