# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.
**Snapshot date:** 2026-09-22. **Updated by:** ChatGPT Control Tower after Issue #81 Stage 1B governed merge + Staging/Production acceptance.
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations, not permanent HEADs.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. Connected chain: Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer intelligence. |
| Current Git main at this restamp base | `1d4ecc759076acb82da9f346ec05948e6e0194ca` — PR #87 Stage 1B squash-merged; normal Vercel Production deployment SUCCESS. This docs-only restamp will advance Git main without changing Stage 1B runtime behavior; freshly query remote main when resuming. |
| Latest accepted Production release | **Issue #81 Stage 1B / PR #87 — MERGED + PRODUCTION ACCEPTED.** Exact audited candidate `7656bf6a163fa1708537c0f2cb7abf5088c3575b`; squash merge `1d4ecc759076acb82da9f346ec05948e6e0194ca`; Vercel Production SUCCESS. Exact Stage 1B migration SHA-256 `82d1a480f604833b38d89da5792e63db0cc3c061ec485580f4bd5df7b544ba6d` applied to Staging and Production only after governed acceptance. Production Sentry remains OFF. |
| Last direct runtime-endpoint verified Production baseline | `ec03d36f39705024dfcc5b923ca87e42795f3743` directly observed at `/api/build-info` (main / production / production=true) during #72 closeout. No new endpoint check in Package A. |
| Phase 5 | **COMPLETE.** Genuine GVM Production booking + customer confirmation + business new-booking email acceptance is closed. HQ connected-chain evidence is accepted. Do not manufacture replacement Production tests. |
| Current program phase | **Outside Private Alpha readiness — IN PROGRESS.** |
| Observability / Issue #65 | **COMPLETE / CLOSED.** Provider-off observability foundation satisfies its own pass condition: server/client error capture, allowlist privacy boundary, support references, truthful worker-health visibility, provider-off safety and separately governed activation preflight. Do not create another observability phase merely because deeper APM is possible. |
| Current product-engineering state | **Issue #81 Stage 1B — COMPLETE / PRODUCTION ACCEPTED.** Public Service/Staff discovery, Staff-location eligibility, Booking Engine, Reception and booking RPCs now converge on primary-or-explicit-mapping location truth with `staff_services` required. Same-Business relationship guards, tenant-key immutability, hardened RLS/ACLs and normalized RPC grants are live in Staging + Production. Issue #73 Package B1 remains MERGED / STAGING VERIFIED / PRODUCTION DB NOT APPLIED; B2 remains NOT AUTHORIZED. |
| Main-branch governance | Ruleset `23730556` active on `main`: PR required; checks `Vercel` + `competitive-product-gate`; strict/up-to-date; force-push/deletion blocked; repository-admin bypass is PR-only. |
| Competitive Product Gate | Permanent governance. Material customer/operator features: establish competitor baseline, parity floor, Chasum advantage, UX/product contract and pass condition before implementation. |
| Issue #57 branded domain | **DEFERRED / DESIGN FOR NOW — BUILD LATER.** `chasum.vercel.app` remains the legitimate Private Alpha Production hostname. |
| Primary engineering governance | Codex = primary engineer. GPT-6 Astra effort: Light for simple/bounded, Medium for normal engineering, High only when Medium is insufficient, Extra High for justified Level-3 security/tenancy/financial work, Ultra exceptional. Claude = independent large-context/high-risk auditor. Momentic = browser regression. Cursor = local/authenticated/device-specific fallback. |
| Launch-required readiness gaps | **Issue #81 Stage 1C is next.** Stage 1B is closed/Production accepted. Stage 1C must design the world-class Add Location template/snapshot workflow on top of the accepted Business Service Catalog + Staff-location truth, without duplicating Services or blindly copying Staff/resources. **#73 governed switching/import readiness also remains open:** B1 Staging schema acceptance is complete; B2 writer remains NOT AUTHORIZED. Gate B follows Outside Private Alpha readiness. |
| Deferred / design-for-now | Production Sentry activation/source maps/deep APM, broader metrics, true employee RBAC implementation, tenant switcher, deeper Summer, Gate B until Outside Private Alpha readiness closes, native apps until start gate, branded Production domain, residual historical migration/security debt when specifically scoped. |
| Exact next substantive gate | **Issue #81 Stage 1C product/architecture preflight — READ-ONLY / DESIGN FIRST.** Reconcile the accepted Stage 1A/1B model with Add Location modes (Default location — Recommended / Copy another location / Start blank), snapshot hours/settings semantics, deliberate Staff/resource assignment, onboarding/UX, rollback and tenant-isolation impact. Stage 1C implementation is NOT authorized by this restamp; Package B2 remains blocked. |
| Product Owner input | Stage 1B merge + Production rollout approved and accepted. `staff.location_id` remains Stage-1 primary/home compatibility; `staff_locations` remains long-term works-at truth; `service_locations` is long-term offered-at truth. Stage 1C remains the next governed #81 stage: snapshot/copy workflow, no duplicate Service records, Business location limit 6 remains the current product direction, and Staff/resources must not be blindly copied. #73 B2 remains unauthorized. |

GVM and Chasum HQ remain normal tenants; Platform Admin remains separate at `/owner`.

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md) for exact scope, governance and bootstrap.
Read [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md) for observed runtime evidence and UNKNOWNs.
Use [Launch Readiness](LAUNCH_READINESS.md) for exit gates and [Master Roadmap](company/MASTER_ROADMAP.md) for strategic sequence.

The superseded long board remains in [historical snapshots](handoffs/archive/). Archives are evidence, never current execution queues. Do not reset branches or reopen accepted releases to satisfy stale handoff text.

**Size budget:** approximately one page of control fields, at most 800 words. Move history, not decisions, out of this board.
