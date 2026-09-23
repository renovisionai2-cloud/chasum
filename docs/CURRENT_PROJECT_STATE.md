# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.  
**Snapshot date:** 2026-09-23. **Updated by:** Codex for PO-authorized Issue #73 Package C1 code-only candidate; accepted B2 release unchanged.
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations; freshly query remote main/runtime before consequential work.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. Connected chain: Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer intelligence. |
| Latest accepted behavior-changing application release | `06c7d502948a321b706ba07036724c9178e428e7` — PR #93 Package B2 core squash merge. Vercel Production deployment `dpl_HUcbeyiham9KTNftrZCB4QTinu2K` READY and direct `/api/build-info` confirmed this exact behavior-changing release at acceptance. Later documentation-only merges may advance Git/serving SHA without changing application behavior; freshly query main/runtime before consequential work. |
| Latest accepted Production release | **Issue #73 Package B2 core / PR #93 — MERGED + STAGING + PRODUCTION ACCEPTED.** Exact accepted PR head `84168a3c630550f040866700def2edcacdbd16c2`; squash merge `06c7d502948a321b706ba07036724c9178e428e7`; Production deployment `dpl_HUcbeyiham9KTNftrZCB4QTinu2K` READY. DB-first Production prerequisites B1 → Staff quota → B2 were applied/verified before the application deployment. |
| Stage 1C database release | Exact migration `20260922210000_issue_81_stage_1c_location_template.sql`, Git blob `748e9d0f6dd9d5796839b6a234222593d2f25bc2`, SHA-256 `6a4e3285382d1d1fbd9592af70ec1e2476ac8c9bec28cd0ba6a0e3287b3cb98f`, applied/accepted on Staging and Production. Production ledger: `20260923135852 / issue_81_stage_1c_location_template`. 034–036 remain unapplied. |
| Phase 5 | **COMPLETE.** Genuine GVM Production booking + customer confirmation + business new-booking email acceptance remains closed. Do not manufacture replacement Production tests. |
| Current program phase | **Outside Private Alpha readiness — IN PROGRESS.** |
| Issue #81 multi-location Stage 1 | **COMPLETE / PRODUCTION ACCEPTED.** Stage 1A Business Service Catalog, Stage 1B Service/Staff/location/public-booking convergence and Stage 1C atomic Add Location snapshot/template workflow are live. One Business Service Catalog; `service_locations` = offered-at truth; `staff_locations` = works-at truth; primary/home fields remain compatibility only. |
| Location entitlement | Canonical live limits: starter 1 / professional 3 / business 6 / enterprise unlimited. GVM remains a normal Starter tenant with 3 existing Locations grandfathered; `can_add_location=false` until entitlement changes. Existing GVM rows were not rewritten by Stage 1C. |
| Observability / Issue #65 | **COMPLETE / CLOSED.** Production Sentry remains OFF. |
| Issue #72 tenant identity | **CLOSED / PRODUCTION ACCEPTED.** Do not reopen absent contradictory evidence. |
| Issue #73 governed switching/import | **ACTIVE.** Package A COMPLETE. Package B1 MERGED + STAGING + PRODUCTION ACCEPTED. Staff quota PR #92 MERGED + STAGING + PRODUCTION ACCEPTED. Package B2 core PR #93 MERGED + STAGING + PRODUCTION ACCEPTED; see [engineering evidence](import/ISSUE_73_PACKAGE_B2.md). Issue remains open because the customer-facing migration product / Package C is not yet implemented. |
| Main-branch governance | Ruleset `23730556`: PR required; required checks include Vercel + competitive-product-gate; strict/up-to-date; force-push/deletion blocked; admin bypass PR-only. |
| Competitive Product Gate | Permanent for material customer/operator features. |
| Primary engineering governance | Codex = primary engineer; ChatGPT = Control Tower; Claude = independent high-risk auditor; Momentic/equivalent = browser/workflow validation; Cursor = local/authenticated/device-specific fallback. |
| Deferred / design-for-now | Stage 2 location overrides, Stage 3 live inheritance, resource-aware booking, durable Summer action provenance, true employee RBAC, tenant switcher, Production Sentry activation, native apps, branded domain, residual historical security/migration debt when specifically scoped. |
| Package C1 candidate | **IMPLEMENTED / LOCAL VALIDATION / NOT MERGED / NOT HOSTED-APPLIED.** PO authorized private artifact foundation only on `codex/issue-73-package-c1-artifacts`, base `68d944a8fb0cad282bb5df7b6100c490785d53de`. [C1 evidence and gaps](import/ISSUE_73_PACKAGE_C1.md). Guided self-service, one CSV/run, locked raw24h/reviewed72h+terminal1h retention; reminders remain default-OFF C3 scope. Global-by-design preserved. |
| Exact next substantive gate | **Independent Claude Level-3 audit of exact C1 candidate**, reconciled by Control Tower. Claude dispatch PLANNED / NOT SENT / NOT RUNNING; manual dispatch prompt in C1 doc. Supporting Codex review is not that audit. C2/C3 and Package C overall remain incomplete. |
| Product Owner input | C1 code/local validation/Draft PR authorized. No merge, hosted migration/Storage, Staging/Production/GVM/HQ mutation or real files authorized. Branch automatic Git deployment disabled pending DB-first gate: migration/Storage → verify → application. Control Tower/Darshan must dispatch the independent audit, then separately authorize hosted work. |

GVM Baby World and Chasum HQ remain normal tenants. Platform Admin remains separate at `/owner`.

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md), then [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md), then the live active Issue/PR. Current GitHub/runtime evidence wins over stale handoff text.

**Size budget:** keep this board short; move history, not decisions, elsewhere.
