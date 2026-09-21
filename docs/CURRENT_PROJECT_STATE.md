# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.
**Snapshot date:** 2026-09-21. **Updated by:** Codex under ChatGPT Control Tower’s Issue #72 acceptance restamp contract.
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations, not permanent HEADs.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. Connected chain: Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer intelligence. |
| Current Git main | `d6f6cd0481305c07d6c721cf3bb4b4cc147ac433` at this restamp. Accepted Issue #72 application candidate: `4c39652866117a4ce93b4f8193375c8816c2b582` on PR #78, not merged. A docs-only PR HEAD may advance without changing that application tree. |
| Latest accepted Production release | PR #76 / Issue #75: outbound Sentry privacy hardening + activation preflight. Merge `470785f997c456a325c2ad17a503660bc6eafebc`; Vercel Production SUCCESS. PR #74 / Issue #68 B1, PR #70 / Issue #69 B2 and PR #67 / Issue #66 Phase A are also Production accepted. Production Sentry remains OFF. |
| Last direct runtime-endpoint verified Production baseline | `3629004e05fb0a921ab96954ab701eb4a2f4cd5a` (PR #59 / Issue #58). Later accepted releases through PR #76 deployed successfully, but `/api/build-info` / `/api/health` were not freshly observable from Control Tower. Do not infer endpoint SHA. |
| Phase 5 | **COMPLETE.** Genuine GVM Production booking + customer confirmation + business new-booking email acceptance is closed. HQ connected-chain evidence is accepted. Do not manufacture replacement Production tests. |
| Current program phase | **Outside Private Alpha readiness — IN PROGRESS.** |
| Observability / Issue #65 | **COMPLETE / CLOSED.** Provider-off observability foundation satisfies its own pass condition: server/client error capture, allowlist privacy boundary, support references, truthful worker-health visibility, provider-off safety and separately governed activation preflight. Do not create another observability phase merely because deeper APM is possible. |
| Current product-engineering state | **Issue #72 — STAGING + HOSTED ACCEPTANCE COMPLETE / INDEPENDENT AUDIT PASS / PRODUCT OWNER MERGE + PRODUCTION ROLLOUT DECISION PENDING.** Membership-first resolution, explicit create/join intent, conservative ambiguity stop, server-only atomic creation and durable audit are implemented. Issue #72 is not closed. |
| Main-branch governance | Ruleset `23730556` active on `main`: PR required; checks `Vercel` + `competitive-product-gate`; strict/up-to-date; force-push/deletion blocked; repository-admin bypass is PR-only. |
| Competitive Product Gate | Permanent governance. Material customer/operator features: establish competitor baseline, parity floor, Chasum advantage, UX/product contract and pass condition before implementation. |
| Issue #57 branded domain | **DEFERRED / DESIGN FOR NOW — BUILD LATER.** `chasum.vercel.app` remains the legitimate Private Alpha Production hostname. |
| Primary engineering governance | Codex = primary engineer. GPT-6 Astra effort: Light for simple/bounded, Medium for normal engineering, High only when Medium is insufficient, Extra High for justified Level-3 security/tenancy/financial work, Ultra exceptional. Claude = independent large-context/high-risk auditor. Momentic = browser regression. Cursor = local/authenticated/device-specific fallback. |
| Launch-required readiness gaps | **#72 tenant identity/onboarding safety**, then **#73 governed switching/import readiness**. After Outside Private Alpha readiness: Commercial SaaS Gate B → Summer Business Manager horizontal v1. Practical RBAC remains a commercial-v1 gate before team claims. |
| Deferred / design-for-now | Production Sentry activation/source maps/deep APM, broader metrics, true employee RBAC implementation, tenant switcher, deeper Summer, Gate B until Outside Private Alpha readiness closes, native apps until start gate, branded Production domain, residual historical migration/security debt when specifically scoped. |
| Exact next substantive task | **Prepare the Product Owner decision for coordinated PR #78 merge and Production rollout.** After #72 Production closeout, #73 governed switching/import readiness is next. Do not begin Gate B. |
| Product Owner input | Implementation approved and complete; Staging migration separately approved, applied and accepted. Staging DB/RLS/RPC, hosted Playwright acceptance and independent audits passed. **Merge and Production rollout remain NOT authorized; Production migration NOT APPLIED.** Hosted Trusted Operator case not executed (no safe synthetic fixture); explicitly non-blocking. |

GVM and Chasum HQ remain normal tenants; Platform Admin remains separate at `/owner`.

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md) for exact scope, governance and bootstrap.
Read [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md) for observed runtime evidence and UNKNOWNs.
Use [Launch Readiness](LAUNCH_READINESS.md) for exit gates and [Master Roadmap](company/MASTER_ROADMAP.md) for strategic sequence.

The superseded long board remains in [historical snapshots](handoffs/archive/). Archives are evidence, never current execution queues. Do not reset branches or reopen accepted releases to satisfy stale handoff text.

**Size budget:** approximately one page of control fields, at most 800 words. Move history, not decisions, out of this board.
