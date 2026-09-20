# Chasum — Latest Development Handoff

**Updated:** 2026-09-20 by ChatGPT Control Tower.  
**Purpose:** recover the next action in 5–10 minutes without historical chat access.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md). This handoff explains that board; it does not own a competing current-state table.

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Current program phase:

**Outside Private Alpha readiness — IN PROGRESS.**

Current Git / accepted release state:
- current application main at this restamp base: `170f0f2608d0e3ed343bafdd4367efdcb604b8a2`;
- PR #67 / Issue #66 Observability Phase A: **CLOSED / PRODUCTION ACCEPTED**;
- PR #70 / Issue #69 Observability Phase B2: **CLOSED / PRODUCTION ACCEPTED**;
- Issue #65 observability parent: **OPEN**;
- Issue #68 / B1: **ACTIVE / Codex-owned**;
- no B1 PR exists yet;
- remote B1 branch remains at pre-B2 base `d56de47121a81e5f87e42ade718c4c3d8efe14f4` intentionally because Codex may hold local uncommitted work.

PR #67 established safe observability primitives:
- allowlist-first telemetry context;
- non-identifying support references;
- config-aware worker-health classifier;
- logger/Sentry context sanitization;
- no Sentry provider activation.

PR #70 added read-only Platform Admin worker-health visibility:
- owner-authorized background-job health projection;
- stable ordered pagination;
- truthful HELD_BY_CONFIG vs overdue semantics;
- unavailable != zero;
- top-level Platform Health reflects real worker-health problems;
- Sentry presence copy does not claim provider health;
- platform_alerts is explicitly historical/manual;
- no job/config/provider/GVM mutation.

Vercel Production succeeded for both accepted releases. No newer direct `/api/build-info` / `/api/health` serving-endpoint observation supersedes the previously accepted PR #59 direct runtime baseline; preserve that distinction.

Issue #57 branded-domain cutover remains **DEFERRED / DESIGN FOR NOW — BUILD LATER**. `chasum.vercel.app` remains the legitimate Private Alpha Production hostname.

Repository ruleset `23730556` remains active on `main`. Every PR requires `Vercel` + `competitive-product-gate`; internal observability/docs work may use reasoned `NOT_APPLICABLE`.

## B. Recent completed work

| Work | Final state |
| --- | --- |
| Issue #47 | Phase 5 CLOSED / COMPLETE after genuine GVM booking + dual-email observation. |
| Issue #54 / PR #55 | Trusted Operator Access V1 PRODUCTION VERIFIED; real GVM operational access accepted; issue closed. |
| Issue #58 / PR #59 | Reception viewport/stability CLOSED / PRODUCTION ACCEPTED. |
| Issue #60 / PR #61 | Competitive Product Gate governance CLOSED / ACTIVE. |
| Issue #62 / PR #63 | Customer location address + one-tap directions CLOSED / PRODUCTION ACCEPTED. |
| Issue #53 | Main branch governed release ruleset CLOSED / ACTIVE. |
| Issue #66 / PR #67 | Observability Phase A CLOSED / PRODUCTION ACCEPTED. Safe telemetry context, support references, worker classifier, logger/Sentry sanitizer; no provider activation. |
| Issue #69 / PR #70 | Observability Phase B2 CLOSED / PRODUCTION ACCEPTED. Read-only Platform Admin worker-health visibility with truthful operator semantics. |
| Issue #57 | Branded Production domain deliberately DEFERRED. |

Do not reopen these absent new contradictory evidence.

Earlier accepted #46/#48/#51 money/state work also remains closed.

## C. Accepted source authority

| Rank | Document | Owns |
| --- | --- | --- |
| 1 | [CHASUM_BIBLE](../company/CHASUM_BIBLE.md) | Product/architecture constitution. |
| 2 | [CURRENT_PROJECT_STATE](../CURRENT_PROJECT_STATE.md) | Sole current program board and exact NEXT. |
| 3 | [ENVIRONMENT_MANIFEST](../runtime/ENVIRONMENT_MANIFEST.md) | Runtime/environment observations and limits. |
| 4 | This handoff | Recovery instructions and execution continuity. |
| 5 | [LAUNCH_READINESS](../LAUNCH_READINESS.md) | Launch-criticality and readiness gates. |
| 6 | [MASTER_ROADMAP](../company/MASTER_ROADMAP.md) | Strategic sequence. |
| 7 | [MASTER_TASKS](../company/MASTER_TASKS.md) | Actionable backlog. |
| 8 | [CHANGELOG](../CHANGELOG.md) | Completed history. |
| 9 | [TECHNICAL_DEBT](../TECHNICAL_DEBT.md) | Debt; not automatic authorization. |

Observation is not approval. Fresh evidence can establish what exists; it cannot retroactively authorize a policy or Production mutation.

## D. Exact next engineering continuation

**PRIMARY NORMAL ENGINEER:** Codex.  
**Control Tower:** ChatGPT.  
**Independent auditor:** Claude.  
**Browser regression:** Momentic where UI/authenticated flows warrant.  
**Cursor:** fallback/local authenticated operator when justified.

### Active task

**Issue #68 / Observability Phase B1 — ACTIVE / Codex-owned.**

B1 scope:
- supported Next.js server request-error hook;
- client-safe instrumentation foundation;
- error-boundary convergence;
- safe structured log-message policy;
- safe intent/send-intent correlation standardization;
- DSN-present mocked Sentry sanitization coverage;
- no Production Sentry/provider activation.

### Continuous-execution rule

Do not wait for Product Owner to say “continue” between technical gates.

When Codex returns:
1. inspect its exact local base/head/delta;
2. preserve local work;
3. compare old B1 base `d56de471…` vs current main `170f0f260…`;
4. reconcile only non-overlapping B1 changes onto current main;
5. preserve PR #70/B2 behavior and rerun B2 worker-health tests;
6. open/update one B1 PR;
7. run focused tests, typecheck, changed-file lint, build, diff-check, Vercel and competitive gate;
8. use Momentic/browser regression if error-boundary/authenticated UI changed materially;
9. send the exact reconciled head to Claude;
10. bring Product Owner only the genuine merge or consequential Production-config decision.

### B2 regression truths that B1 must preserve

- `/owner/health` is Platform Admin, not Chasum HQ;
- owner authorization precedes service-role worker-health reads;
- background_jobs health read is classification-field-only and ordered by stable id before pagination;
- no queue mutation;
- HELD_BY_CONFIG stays distinct from overdue;
- future/grace/config-held work does not create false incidents;
- unavailable health never renders fake zeros;
- top-level System status cannot claim Healthy on unavailable/overdue/failed/stale/invalid worker state;
- Sentry configured != provider healthy;
- platform_alerts remains historical/manual;
- no customer/provider payload content in health UI.

### Stop only for a real Product Owner decision

Stop for:
- B1 merge approval;
- Production Sentry/provider/config activation;
- migration/RLS/Auth/tenant/billing/Production-data decisions;
- a material architecture conflict.

Otherwise continue automatically.

After B1, parent #65 should reconcile whether any Production telemetry-provider activation is actually launch-required now versus separately gated. Outside Private Alpha readiness then continues with tenant onboarding/identity safety and governed switching/import capability. Commercial SaaS Gate B remains later.

## E. Environment safety

Production:
- host remains `https://chasum.vercel.app`;
- Production Supabase ref `kxcydvhswkuzepwzzinq`;
- GVM normal tenant remains protected;
- do not manufacture bookings or provider sends for routine checks.

Staging:
- expected canonical hostname `https://staging.chasumai.com`;
- Staging Supabase ref `wnfahklzaxirftyskctd`;
- preserve accepted evidence appointments/queues unless a task explicitly authorizes mutation.

Historical Preview acceptance credentials:
- PR #63 temporary acceptance key is permanently revoked and no longer referenced by PR #63 Preview;
- two historical PR #55 Preview Resend keys still exist in the Resend inventory and are separate security-hygiene items. Do not revoke them without explicit Product Owner confirmation and a dependency check.

No current migration replay, RLS rewrite, Production Auth dashboard mutation, worker cleanup or branded-domain cutover is authorized by this handoff.

## F. Locked product truths

- one reusable multi-tenant SaaS platform;
- GVM Baby World and Chasum HQ are normal tenants;
- Platform Admin / Control Centre is separate;
- Business → Location → Resources / Staff / Services / Operations;
- Summer = AI Business Manager, not a receptionist-only chatbot;
- Trusted Admin V1 = broad normal-tenant admin during Private Alpha, not Platform Admin and not the final employee permission model;
- annual pricing principle = pay for 10 months, receive 2 months free;
- pricing hypotheses remain configurable;
- `chasumai.com` branded app cutover is deferred;
- Production is never a development environment.

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

Current restamp base before this docs PR:
ef9d2799c5f39abbcd1e3478f828f5f3443d54ea

Phase 5 is COMPLETE.
Issues #47, #54, #58, #60, #62 and #53 are closed/accepted.
Issue #57 branded-domain cutover is deferred.

Main is governed by ruleset 23730556.
Every PR needs Vercel + competitive-product-gate.
Non-product PRs use a concrete NOT_APPLICABLE reason.

NEXT:
Outside Private Alpha readiness — read-only Production observability /
error visibility / trace-correlation assessment and bounded implementation plan.

Do not restart Phase 5 or branded-domain work.
Do not manufacture Production bookings/emails.
Do not start Gate B or Summer horizontal-v1 implementation yet.
Proceed with the next safe scoped action; stop only for a real Product Owner
decision or consequential Production/config approval.
```

Refresh this handoff after a major release/phase completion, high-risk incident closure, architecture/governance change, every few significant PRs, or approximately weekly during heavy development. Use one scoped restamp, not endless documentation churn.
