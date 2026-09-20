# Chasum — Latest Development Handoff

**Updated:** 2026-09-20 by ChatGPT Control Tower.  
**Purpose:** recover the next action in 5–10 minutes without historical chat access.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md). This handoff explains that board; it does not own a competing current-state table.

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Issue #47 closed after genuine GVM Production use satisfied the final Phase 5 gate. Accepted evidence includes:
- GVM desktop acceptance PASS;
- GVM iPhone acceptance PASS;
- legitimate Production Reception booking;
- customer confirmation email observed;
- business new-booking email observed;
- no synthetic Production booking;
- no tenant-identity contradiction.

Issue #54 is also **CLOSED / COMPLETED**. Trusted Operator Access V1 remains the supported reusable tenant-admin path for Private Alpha; it is not Platform Admin and not the final commercial employee-RBAC model.

Current program phase:

**Outside Private Alpha readiness — IN PROGRESS.**

The current roadmap order is:

Outside Private Alpha readiness  
→ Commercial SaaS Gate B  
→ Summer Business Manager horizontal v1

Core Operations launch-required defects may continue throughout. GVM and Chasum HQ remain real validation tenants, not product forks and not the entire roadmap.

### Current Git / release state

Fresh restamp base:

`ef9d2799c5f39abbcd1e3478f828f5f3443d54ea`

This is PR #63’s squash merge.

PR #63 / Issue #62 is **PRODUCTION ACCEPTED / CLOSED**:
- customer confirmation/reminder/reschedule/cancellation now use the appointment’s own same-business location address;
- eligible addresses get one-tap Google Maps directions;
- staff/business/SMS semantics remain bounded;
- final Staging acceptance used a real internal email through Resend and actual inbox inspection;
- temporary Staging address restored;
- temporary PR #63 Vercel secret removed;
- temporary Resend acceptance key permanently revoked after PO confirmation;
- Production Resend credentials unchanged.

For PR #63 Production closeout, Vercel reported deployment completed and Production GVM tenant/schema/address state was read-only verified. Control Tower’s tool path could not freshly fetch Production `/api/build-info` / `/api/health`; those endpoint values are not claimed for that release.

Last Production release with direct runtime-endpoint verification remains PR #59 / Issue #58:
`3629004e05fb0a921ab96954ab701eb4a2f4cd5a`

That release verified Production build-info/health, GVM tenant identity and true 1366/1024/1180 Reception viewport behavior.

### Repository governance

Issue #60 / PR #61 is **CLOSED / governance active**.

Competitive Product Gate is durable repository policy:
- material customer/operator work = REQUIRED;
- documentation/governance/maintenance/recovery/security and other non-product work may use reasoned NOT_APPLICABLE;
- workflow runs on PR events without product/category filtering;
- validator mechanically enforces the declaration.

Issue #53 is **CLOSED / COMPLETED**.

Repository ruleset:
`23730556` — **Chasum main governed release**

Current behavior:
- target: `main` only;
- PR required;
- approving reviews = 0;
- review-thread resolution required;
- required checks: `Vercel`, `competitive-product-gate`;
- branch must be up to date;
- force-push blocked;
- deletion blocked;
- repository-admin bypass = PR-only.

GitHub adds `require_extra_approval_for_unattributed_changes=true` by default. GitHub documents that this has no effect when required approvals = 0, so it does not materially change the approved policy.

### Branded domain

Issue #57 is **DEFERRED / DESIGN FOR NOW — BUILD LATER**.

Product Owner comment 5745462206 supersedes the earlier cutover approval:
- `https://chasum.vercel.app` remains the legitimate Private Alpha Production hostname;
- `https://staging.chasumai.com` remains Staging;
- public DNS/Auth/env cutover is not authorized now;
- dormant Vercel apex/www attachment may remain until future cutover;
- Microsoft 365 / Resend / mail DNS remain untouched.

Do not restart Issue #57 without a fresh launch-stage decision and preflight.

## B. Recent completed work

| Work | Final state |
| --- | --- |
| Issue #47 | Phase 5 CLOSED / COMPLETE after genuine GVM booking + dual-email observation. |
| Issue #54 / PR #55 | Trusted Operator Access V1 PRODUCTION VERIFIED; real GVM operational access accepted; issue closed. |
| Issue #58 / PR #59 | Reception viewport/stability CLOSED / PRODUCTION ACCEPTED. |
| Issue #60 / PR #61 | Competitive Product Gate governance CLOSED / ACTIVE. |
| Issue #62 / PR #63 | Customer location address + one-tap directions CLOSED / PRODUCTION ACCEPTED. |
| Issue #53 | Main branch governed release ruleset CLOSED / ACTIVE. |
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
**Independent auditor:** Claude where risk warrants.  
**Browser regression:** Momentic.  
**Cursor:** fallback/local authenticated operator when justified.

### Exact next substantive task

**Outside Private Alpha readiness — Production observability / error visibility / trace-correlation assessment and bounded implementation plan.**

Why first:
- once outside design partners are invited, failures cannot depend on manual “Gateway Timeout” archaeology;
- current Launch Readiness explicitly requires meaningful Production error visibility before broader Outside Private Alpha;
- observability is infrastructure/readiness work and can begin without waiting on onboarding/import implementation;
- this should be scoped before adding a vendor or mutating Production.

Start read-only.

Required assessment:
1. current Sentry/OpenTelemetry/logging code and dependencies;
2. current Production configuration presence/absence that can be observed safely;
3. what Vercel runtime logs already provide;
4. correlation IDs/request IDs currently propagated or missing;
5. tenant/business context that can be logged safely without leaking PII/secrets;
6. client + server error coverage needed for booking/auth/commerce/communications;
7. minimum launch-safe alerting/error-triage path;
8. whether Sentry, OTel, Vercel-native logging, or a bounded combination best fits v1;
9. cost/vendor-lock-in and privacy implications;
10. exact Production/config approval required before implementation.

Competitive Product Gate:
normally **NOT_APPLICABLE** for this internal observability/readiness task; give a concrete reason in any PR.

Do not install or enable a new Production vendor merely because it is available. First produce the bounded architecture and acceptance contract.

### Other Outside Private Alpha readiness work after/alongside observability

- tenant onboarding / identity safety acceptance;
- switching/import/migration as a product capability for customers, staff, services and future appointments;
- Summer-assisted migration/onboarding remains an opportunity, not a reason to expand Summer before the readiness contract is clear.

Commercial SaaS Gate B remains after Outside Private Alpha readiness and requires separate LEVEL 3 scope/approval.

Practical staff login/RBAC is still a commercial-v1 gate before team claims; do not silently equate Private Alpha Trusted Admin with final RBAC.

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
