# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.
**Snapshot date:** 2026-09-20. **Updated by:** ChatGPT Control Tower (post-PR #76 / Issue #65 observability closeout).
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations, not permanent HEADs.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. Connected chain: Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer intelligence. |
| Current Git main | Freshly query `origin/main`. Restamp application base: `470785f997c456a325c2ad17a503660bc6eafebc` (PR #76 squash merge). A later docs-only merge may advance Git main without changing application behavior. |
| Latest accepted Production release | PR #76 / Issue #75: outbound Sentry privacy hardening + activation preflight. Merge `470785f997c456a325c2ad17a503660bc6eafebc`; Vercel Production SUCCESS. PR #74 / Issue #68 B1, PR #70 / Issue #69 B2 and PR #67 / Issue #66 Phase A are also Production accepted. Production Sentry remains OFF. |
| Last direct runtime-endpoint verified Production baseline | `3629004e05fb0a921ab96954ab701eb4a2f4cd5a` (PR #59 / Issue #58). Later accepted releases through PR #76 deployed successfully, but `/api/build-info` / `/api/health` were not freshly observable from Control Tower. Do not infer endpoint SHA. |
| Phase 5 | **COMPLETE.** Genuine GVM Production booking + customer confirmation + business new-booking email acceptance is closed. HQ connected-chain evidence is accepted. Do not manufacture replacement Production tests. |
| Current program phase | **Outside Private Alpha readiness — IN PROGRESS.** |
| Observability / Issue #65 | **COMPLETE / CLOSED.** Provider-off observability foundation satisfies its own pass condition: server/client error capture, allowlist privacy boundary, support references, truthful worker-health visibility, provider-off safety and separately governed activation preflight. Do not create another observability phase merely because deeper APM is possible. |
| Current product-engineering state | **Issue #72 — tenant identity and duplicate-prevention gate — FEATURE-BRANCH IMPLEMENTATION / INDEPENDENT AUDIT PENDING.** Phase 0 architecture/competitive assessment is complete. The trustworthy direction is membership-first resolution + explicit create/join intent + conservative ambiguity stop + server-only tenant creation + durable audit. |
| Main-branch governance | Ruleset `23730556` active on `main`: PR required; checks `Vercel` + `competitive-product-gate`; strict/up-to-date; force-push/deletion blocked; repository-admin bypass is PR-only. |
| Competitive Product Gate | Permanent governance. Material customer/operator features: establish competitor baseline, parity floor, Chasum advantage, UX/product contract and pass condition before implementation. |
| Issue #57 branded domain | **DEFERRED / DESIGN FOR NOW — BUILD LATER.** `chasum.vercel.app` remains the legitimate Private Alpha Production hostname. |
| Primary engineering governance | Codex = primary engineer. GPT-6 Astra effort: Light for simple/bounded, Medium for normal engineering, High only when Medium is insufficient, Extra High for justified Level-3 security/tenancy/financial work, Ultra exceptional. Claude = independent large-context/high-risk auditor. Momentic = browser regression. Cursor = local/authenticated/device-specific fallback. |
| Launch-required readiness gaps | **#72 tenant identity/onboarding safety**, then **#73 governed switching/import readiness**. After Outside Private Alpha readiness: Commercial SaaS Gate B → Summer Business Manager horizontal v1. Practical RBAC remains a commercial-v1 gate before team claims. |
| Deferred / design-for-now | Production Sentry activation/source maps/deep APM, broader metrics, true employee RBAC implementation, tenant switcher, deeper Summer, Gate B until Outside Private Alpha readiness closes, native apps until start gate, branded Production domain, residual historical migration/security debt when specifically scoped. |
| Exact next substantive task | **Issue #72 implementation gate.** Architecture and competitor assessment are complete. App-only portions are Level 2, but the launch-safe invariant requires Level-3 tenant-creation authorization hardening: RLS/INSERT posture, create-capable RPC closure/replacement, server-only atomic creation path and durable tenant-identity decision audit. |
| Product Owner input | **Feature-branch implementation APPROVED** on Issue #72. New migration code and disposable local validation only; migration NOT APPLIED to Staging/Production. Independent Level-3 audit, merge, hosted runtime acceptance and environment application remain separate gates. |

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md) for exact scope, governance and bootstrap.
Read [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md) for observed runtime evidence and UNKNOWNs.
Use [Launch Readiness](LAUNCH_READINESS.md) for exit gates and [Master Roadmap](company/MASTER_ROADMAP.md) for strategic sequence.

The superseded long board remains in [historical snapshots](handoffs/archive/). Archives are evidence, never current execution queues. Do not reset branches or reopen accepted releases to satisfy stale handoff text.

**Size budget:** approximately one page of control fields, at most 800 words. Move history, not decisions, out of this board.
