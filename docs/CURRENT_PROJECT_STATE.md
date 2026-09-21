# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.
**Snapshot date:** 2026-09-21. **Updated by:** ChatGPT Control Tower after Issue #73 Package B1 merge + Staging acceptance.
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations, not permanent HEADs.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. Connected chain: Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer intelligence. |
| Current Git main | `6b095cbf8c42664a44398c01b2b19ff2e1f15c40` — PR #82 Package B1 merged; Issue #72 remains CLOSED / PRODUCTION ACCEPTED; Issue #73 remains open. |
| Latest accepted Production release | PR #82 / Issue #73 Package B1 repository foundation merged at `6b095cbf8c42664a44398c01b2b19ff2e1f15c40`; normal Vercel Production deployment SUCCESS. B1 adds private persistence/audit schema code only; Production Supabase has NOT received the B1 migration. Production Sentry remains OFF. |
| Last direct runtime-endpoint verified Production baseline | `ec03d36f39705024dfcc5b923ca87e42795f3743` directly observed at `/api/build-info` (main / production / production=true) during #72 closeout. No new endpoint check in Package A. |
| Phase 5 | **COMPLETE.** Genuine GVM Production booking + customer confirmation + business new-booking email acceptance is closed. HQ connected-chain evidence is accepted. Do not manufacture replacement Production tests. |
| Current program phase | **Outside Private Alpha readiness — IN PROGRESS.** |
| Observability / Issue #65 | **COMPLETE / CLOSED.** Provider-off observability foundation satisfies its own pass condition: server/client error capture, allowlist privacy boundary, support references, truthful worker-health visibility, provider-off safety and separately governed activation preflight. Do not create another observability phase merely because deeper APM is possible. |
| Current product-engineering state | **Issue #73 Package A — COMPLETE / PRODUCTION ACCEPTED CODE FOUNDATION. Package B1 — MERGED / STAGING APPLIED + VERIFIED / PRODUCTION DB NOT APPLIED.** No operational import writes exist; B2 remains NOT AUTHORIZED. Issue #81 multi-location semantics are PO-locked and must govern future B2. |
| Main-branch governance | Ruleset `23730556` active on `main`: PR required; checks `Vercel` + `competitive-product-gate`; strict/up-to-date; force-push/deletion blocked; repository-admin bypass is PR-only. |
| Competitive Product Gate | Permanent governance. Material customer/operator features: establish competitor baseline, parity floor, Chasum advantage, UX/product contract and pass condition before implementation. |
| Issue #57 branded domain | **DEFERRED / DESIGN FOR NOW — BUILD LATER.** `chasum.vercel.app` remains the legitimate Private Alpha Production hostname. |
| Primary engineering governance | Codex = primary engineer. GPT-6 Astra effort: Light for simple/bounded, Medium for normal engineering, High only when Medium is insufficient, Extra High for justified Level-3 security/tenancy/financial work, Ultra exceptional. Claude = independent large-context/high-risk auditor. Momentic = browser regression. Cursor = local/authenticated/device-specific fallback. |
| Launch-required readiness gaps | **#73 governed switching/import readiness.** Package B1 Level-3 audit is accepted and Staging schema acceptance is complete. B2 writer remains NOT AUTHORIZED; Package C UX/controlled acceptance still follows. Issue #81/#83 multi-location convergence is P1 before credible multi-location claims. Gate B follows Outside Private Alpha readiness. |
| Deferred / design-for-now | Production Sentry activation/source maps/deep APM, broader metrics, true employee RBAC implementation, tenant switcher, deeper Summer, Gate B until Outside Private Alpha readiness closes, native apps until start gate, branded Production domain, residual historical migration/security debt when specifically scoped. |
| Exact next substantive task | **Issue #83 Stage 1A-Operator — Business Service Catalog / `service_locations` convergence across Services, Reception and Booking Sheet.** Public booking and availability SQL remain unchanged until Stage 1B. B2 and Gate B remain blocked. |
| Product Owner input | #73 D1–D5 locked: valid-email customers only; staff required; revised D3: NONE/representable EXACT only, reconciliation remains REVIEW/BLOCK; temporary private raw data + durable safe outcomes; required source account key. Package A accepted; B1 merged and verified on Staging only; Production DB not applied; B2 NOT authorized. #81 Stage 1A operator-only, Stage 1B+public convergence together, Stage 1C snapshot/copy, Business location limit 6. |

GVM and Chasum HQ remain normal tenants; Platform Admin remains separate at `/owner`.

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md) for exact scope, governance and bootstrap.
Read [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md) for observed runtime evidence and UNKNOWNs.
Use [Launch Readiness](LAUNCH_READINESS.md) for exit gates and [Master Roadmap](company/MASTER_ROADMAP.md) for strategic sequence.

The superseded long board remains in [historical snapshots](handoffs/archive/). Archives are evidence, never current execution queues. Do not reset branches or reopen accepted releases to satisfy stale handoff text.

**Size budget:** approximately one page of control fields, at most 800 words. Move history, not decisions, out of this board.
