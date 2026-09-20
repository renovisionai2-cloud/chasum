# Chasum — Latest Development Handoff

**Updated:** 2026-09-20 by ChatGPT Control Tower after PR #76 / Issue #65 observability closeout.  
**Purpose:** recover the next action in 5–10 minutes without historical chat access.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md). This handoff explains that board; it does not own a competing current-state table.

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Current program phase:

**Outside Private Alpha readiness — IN PROGRESS.**

Current accepted application main at this restamp base:

`470785f997c456a325c2ad17a503660bc6eafebc`

Observability program:
- Issue #66 / PR #67 Phase A — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #69 / PR #70 B2 — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #68 / PR #74 B1 — **CLOSED / PRODUCTION ACCEPTED**;
- Issue #75 / PR #76 C1 privacy hardening — **CLOSED / PRODUCTION ACCEPTED**;
- parent Issue #65 — **CLOSED / COMPLETE**.

PR #76 Vercel Production status is SUCCESS. Control Tower could not freshly fetch Production `/api/build-info` / `/api/health`; latest endpoint identity remains UNKNOWN rather than inferred. Production Sentry remains OFF. No DSN, trace-sampling, source-map, Vercel environment, provider, migration/RLS/Auth, worker, provider-send or GVM/customer/tenant mutation occurred in the observability closeout.

Do not reopen observability merely for deeper APM ideas. Production Sentry activation is a separate later Product Owner gate.

## B. Current Outside Private Alpha queue

### NEXT — Issue #72: tenant identity and duplicate-prevention gate

Phase 0 source + competitive assessment is complete.

Verified risk:
ordinary zero-business authenticated users can currently reach `getOrCreateBusiness()` → `ensure_business_for_owner` through dashboard dependencies. Same-owner concurrency is protected, but the system does not enforce one Chasum tenant per real-world business across different user accounts.

Approved architecture direction:

Account verification  
→ membership/ownership resolution  
→ explicit **existing business / create new** intent  
→ conservative identity preflight  
→ ambiguity = STOP / Private Alpha review  
→ server-only atomic creation  
→ durable identity-decision audit  
→ setup/dashboard

Important invariants:
- authentication success must not silently imply tenant creation;
- Business → Locations remains the architecture;
- a second location never implies a new Business;
- same real-world business + new owner/email must not create another tenant;
- invited/Trusted Admin membership resolves before creation;
- discovery must not expose private tenant/owner data;
- fuzzy matching/KYC/automated merge are not v1 requirements.

### Level-3 approval boundary

App-layer UX/resolution work is bounded, but a fully launch-safe gate requires tenant-creation authorization changes:
1. stop ordinary authenticated direct Business INSERT;
2. close or replace authenticated execution of the create-capable `ensure_business_for_owner` path;
3. add a trusted server-only atomic creation primitive;
4. add a narrow durable tenant-identity decision audit.

This is **Level 3** because RLS/RPC/schema authorization controls tenant creation and cross-tenant safety.

**Product Owner approval is required before dispatching that Level-3 implementation.**
Approval to implement on a feature branch does **not** authorize applying a migration to Staging or Production. Migration application remains a later governed gate after code review/audit.

### AFTER #72 — Issue #73: governed switching/import readiness

Read-only architecture + competitive assessment is also complete.

Direction:
verified tenant → normalized source data → deterministic preview → explicit commit → idempotent source mapping → durable audit.

V1 entities:
locations, services, staff, staff-service assignments, customers, future appointments.

Do not build one importer per competitor. Do not use GVM service-role scripts as a commercial migration product. Summer may later explain/recommend mappings, but deterministic import truth remains authoritative.

## C. Program sequence

Outside Private Alpha readiness:
1. Observability / #65 — **COMPLETE**;
2. Tenant identity/onboarding safety / #72 — **NEXT**;
3. Governed switching/import / #73 — after #72 target identity is governed;
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

ChatGPT = Control Tower.  
Codex = primary engineer.  
Claude = independent large-context/high-risk auditor.  
Momentic = browser/workflow regression.  
Cursor = local/authenticated/device-specific fallback.

GPT-6 Astra effort:
- Light: simple/bounded/mechanical;
- Medium: normal engineering;
- High: difficult engineering only when Medium is insufficient;
- Extra High: justified Level-3 security/RLS/tenancy/financial work;
- Ultra: exceptional only.

For #72's RLS/RPC tenant-creation authorization slice, **Extra High is justified** by cross-tenant/identity safety. Do not use Ultra. If implementation is deliberately split, app-only UI/resolution work may remain Medium.

## F. Environment safety

Production:
- host remains `https://chasum.vercel.app`;
- Production Supabase ref `kxcydvhswkuzepwzzinq`;
- GVM normal tenant remains protected;
- do not manufacture bookings/provider sends;
- no #72 migration/RLS/Auth/tenant mutation without the later explicit environment-application gate.

Staging:
- expected canonical hostname `https://staging.chasumai.com`;
- Staging Supabase ref `wnfahklzaxirftyskctd`.

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

Accepted application restamp base:
470785f997c456a325c2ad17a503660bc6eafebc

Phase 5 is COMPLETE.
Issue #65 observability parent is CLOSED / COMPLETE.
PRs #67, #70, #74 and #76 are Production accepted.
Production Sentry remains OFF.

Current program phase:
Outside Private Alpha readiness.

NEXT:
Issue #72 — tenant identity and duplicate-prevention gate.
Architecture/competitive assessment is complete.
Level-3 tenant-creation RLS/RPC/schema hardening requires Product Owner approval
before implementation. Approval to code does not authorize Staging/Production
migration application.

After #72:
Issue #73 governed switching/import readiness.

Then:
Commercial SaaS Gate B → Summer Business Manager horizontal v1.

Do not reopen accepted observability work without contradictory evidence.
Do not start Gate B or Summer horizontal-v1 before Outside Private Alpha readiness closes.
Proceed automatically through safe gates; stop only for a genuine Product Owner decision.
```

Refresh this handoff after a major release/phase completion, high-risk incident closure, architecture/governance change, every few significant PRs, or approximately weekly during heavy development. Use one scoped restamp, not endless documentation churn.
