# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.
**Snapshot date:** 2026-09-22. **Updated by:** ChatGPT Control Tower after Issue #83 Stage 1A merge + Production application deployment acceptance.
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations, not permanent HEADs.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. Connected chain: Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer intelligence. |
| Current Git main at this restamp base | `88f6902e4688dc610ecba4e52ecc17d02ec25e9b` — PR #85 Stage 1A merged; normal Vercel Production deployment SUCCESS. This docs-only restamp will advance Git main again without changing application behavior; freshly query remote main when resuming. |
| Latest accepted Production release | PR #85 / Issue #83 Stage 1A operator Business Service Catalog convergence merged at `88f6902e4688dc610ecba4e52ecc17d02ec25e9b`; normal Vercel Production deployment SUCCESS. This release changes application/operator behavior only: no Supabase migration or tenant-data change. Public booking remains intentionally unchanged. Production Sentry remains OFF. |
| Last direct runtime-endpoint verified Production baseline | `ec03d36f39705024dfcc5b923ca87e42795f3743` directly observed at `/api/build-info` (main / production / production=true) during #72 closeout. No new endpoint check in Package A. |
| Phase 5 | **COMPLETE.** Genuine GVM Production booking + customer confirmation + business new-booking email acceptance is closed. HQ connected-chain evidence is accepted. Do not manufacture replacement Production tests. |
| Current program phase | **Outside Private Alpha readiness — IN PROGRESS.** |
| Observability / Issue #65 | **COMPLETE / CLOSED.** Provider-off observability foundation satisfies its own pass condition: server/client error capture, allowlist privacy boundary, support references, truthful worker-health visibility, provider-off safety and separately governed activation preflight. Do not create another observability phase merely because deeper APM is possible. |
| Current product-engineering state | **Issue #83 Stage 1A — MERGED / PRODUCTION ACCEPTED APPLICATION RELEASE.** Internal operator Services, Calendar/Booking Sheet, CRM Booking Sheet and Reception now use one Business Service Catalog with `service_locations` offered-at truth plus temporary primary-location compatibility. Public booking, Staff-location server convergence and availability SQL remain frozen for Stage 1B. Issue #73 Package B1 remains MERGED / STAGING VERIFIED / PRODUCTION DB NOT APPLIED; B2 remains NOT AUTHORIZED. |
| Main-branch governance | Ruleset `23730556` active on `main`: PR required; checks `Vercel` + `competitive-product-gate`; strict/up-to-date; force-push/deletion blocked; repository-admin bypass is PR-only. |
| Competitive Product Gate | Permanent governance. Material customer/operator features: establish competitor baseline, parity floor, Chasum advantage, UX/product contract and pass condition before implementation. |
| Issue #57 branded domain | **DEFERRED / DESIGN FOR NOW — BUILD LATER.** `chasum.vercel.app` remains the legitimate Private Alpha Production hostname. |
| Primary engineering governance | Codex = primary engineer. GPT-6 Astra effort: Light for simple/bounded, Medium for normal engineering, High only when Medium is insufficient, Extra High for justified Level-3 security/tenancy/financial work, Ultra exceptional. Claude = independent large-context/high-risk auditor. Momentic = browser regression. Cursor = local/authenticated/device-specific fallback. |
| Launch-required readiness gaps | **#73 governed switching/import readiness remains open.** Package B1 Staging schema acceptance is complete; B2 writer remains NOT AUTHORIZED. **Issue #81 Stage 1B remains separately gated**: before staff/public server convergence, same-Business relationship integrity/RLS must be hardened for `service_locations`, `staff_locations`, and `staff_services`; Staff-location and public convergence must ship together. Stage 1C remains later. Gate B follows Outside Private Alpha readiness. |
| Deferred / design-for-now | Production Sentry activation/source maps/deep APM, broader metrics, true employee RBAC implementation, tenant switcher, deeper Summer, Gate B until Outside Private Alpha readiness closes, native apps until start gate, branded Production domain, residual historical migration/security debt when specifically scoped. |
| Exact next substantive gate | **Issue #81 Stage 1B pre-implementation security/architecture gate — NOT STARTED / NOT AUTHORIZED.** First reconcile the required Level-3 same-Business RLS/integrity hardening for `service_locations`, `staff_locations`, and `staff_services`, then restate the staff-location server + public convergence release contract for Product Owner approval. Do not implement Stage 1B, Stage 1C or Package B2 from this restamp. |
| Product Owner input | #73 D1–D5 remain locked. Package A accepted; B1 merged and verified on Staging only; Production DB not applied; B2 NOT authorized. #81 Stage 1A is now accepted/merged. Stage 1B + public convergence must ship together and requires separate Level-3 approval; `staff.location_id` remains Stage-1 primary/home compatibility, `staff_locations` long-term works-at truth, missing secondary assignments fail conservatively. Stage 1C remains snapshot/copy, Business location limit 6. |

GVM and Chasum HQ remain normal tenants; Platform Admin remains separate at `/owner`.

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md) for exact scope, governance and bootstrap.
Read [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md) for observed runtime evidence and UNKNOWNs.
Use [Launch Readiness](LAUNCH_READINESS.md) for exit gates and [Master Roadmap](company/MASTER_ROADMAP.md) for strategic sequence.

The superseded long board remains in [historical snapshots](handoffs/archive/). Archives are evidence, never current execution queues. Do not reset branches or reopen accepted releases to satisfy stale handoff text.

**Size budget:** approximately one page of control fields, at most 800 words. Move history, not decisions, out of this board.
