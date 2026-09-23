# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.  
**Snapshot date:** 2026-09-23. **Updated by:** Codex for the authorized Issue #73 Package B2 core CODE-ONLY candidate; accepted runtime records preserved.
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations; freshly query remote main/runtime before consequential work.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. Connected chain: Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer intelligence. |
| Current Git main verified at B2 entry | `18933a3268a57f01daf439b9d116b4672a002a1d` — PR #92 Staff quota merged. This is the exact B2 base. Accepted Stage 1C runtime evidence below remains dated; current Git is not automatic runtime acceptance. |
| Latest accepted Production release | **Issue #81 Stage 1C / PR #89 — MERGED + PRODUCTION ACCEPTED.** Exact accepted PR head `457a6ab8da23c1104a81208338024511ab4f8115`; squash merge `0a81084362ac43d076b35aa0cb463f4efd136afe`. Direct `/api/build-info` HTTP 200 reports that exact merge on `main` / production. |
| Stage 1C database release | Exact migration `20260922210000_issue_81_stage_1c_location_template.sql`, Git blob `748e9d0f6dd9d5796839b6a234222593d2f25bc2`, SHA-256 `6a4e3285382d1d1fbd9592af70ec1e2476ac8c9bec28cd0ba6a0e3287b3cb98f`, applied/accepted on Staging and Production. Production ledger: `20260923135852 / issue_81_stage_1c_location_template`. 034–036 remain unapplied. |
| Phase 5 | **COMPLETE.** Genuine GVM Production booking + customer confirmation + business new-booking email acceptance remains closed. Do not manufacture replacement Production tests. |
| Current program phase | **Outside Private Alpha readiness — IN PROGRESS.** |
| Issue #81 multi-location Stage 1 | **COMPLETE / PRODUCTION ACCEPTED.** Stage 1A Business Service Catalog, Stage 1B Service/Staff/location/public-booking convergence and Stage 1C atomic Add Location snapshot/template workflow are live. One Business Service Catalog; `service_locations` = offered-at truth; `staff_locations` = works-at truth; primary/home fields remain compatibility only. |
| Location entitlement | Canonical live limits: starter 1 / professional 3 / business 6 / enterprise unlimited. GVM remains a normal Starter tenant with 3 existing Locations grandfathered; `can_add_location=false` until entitlement changes. Existing GVM rows were not rewritten by Stage 1C. |
| Observability / Issue #65 | **COMPLETE / CLOSED.** Production Sentry remains OFF. |
| Issue #72 tenant identity | **CLOSED / PRODUCTION ACCEPTED.** Do not reopen absent contradictory evidence. |
| Issue #73 governed switching/import | **ACTIVE.** Package A COMPLETE. B1 MERGED + Staging VERIFIED; Production B1 NOT APPLIED. Staff quota PR #92 MERGED + Staging accepted; Production migration NOT APPLIED. PO-authorized B2 core is a **CODE-ONLY candidate** on `codex/issue-73-package-b2-core`; see [engineering evidence](import/ISSUE_73_PACKAGE_B2.md). No B2 hosted apply or merge. |
| Main-branch governance | Ruleset `23730556`: PR required; required checks include Vercel + competitive-product-gate; strict/up-to-date; force-push/deletion blocked; admin bypass PR-only. |
| Competitive Product Gate | Permanent for material customer/operator features. |
| Primary engineering governance | Codex = primary engineer; ChatGPT = Control Tower; Claude = independent high-risk auditor; Momentic/equivalent = browser/workflow validation; Cursor = local/authenticated/device-specific fallback. |
| Deferred / design-for-now | Stage 2 location overrides, Stage 3 live inheritance, resource-aware booking, durable Summer action provenance, true employee RBAC, tenant switcher, Production Sentry activation, native apps, branded domain, residual historical security/migration debt when specifically scoped. |
| Exact next substantive gate | **Control Tower exact-candidate reconciliation → Claude independent Level-3 B2 candidate audit.** Claude BLOCKED ON MANUAL DISPATCH; no accepted task/run/result in this session. Hosted Staging apply requires a separate PO decision after audit. |
| Product Owner input | B2 implementation/code/local validation/Draft PR authorized. Darshan/Control Tower must manually dispatch the exact candidate to Claude next. No Production, GVM/HQ, real import, hosted migration or merge authority. |

GVM Baby World and Chasum HQ remain normal tenants. Platform Admin remains separate at `/owner`.

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md), then [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md), then the live active Issue/PR. Current GitHub/runtime evidence wins over stale handoff text.

**Size budget:** keep this board short; move history, not decisions, elsewhere.
