# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.  
**Snapshot date:** 2026-09-23. **Updated by:** ChatGPT Control Tower for Issue #73 Package C1 Staging + Production acceptance.
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations; freshly query remote main/runtime before consequential work.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. Connected chain: Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer intelligence. |
| Latest accepted behavior-changing application release | `35f8da7644fed8dfa46f70c3151610b6ae4f9dfa` — PR #97 Package C1 squash merge. Vercel Production deployment `dpl_2G4VhsqnzyFBxxLE8czcM2dhes3y` READY; direct `/api/build-info` confirmed this exact SHA on `main`, `env=production`, `production=true`. Later documentation-only merges may advance Git/serving SHA without changing application behavior; freshly query main/runtime before consequential work. |
| Latest accepted Production release | **Issue #73 Package C1 / PR #97 — MERGED + STAGING + PRODUCTION ACCEPTED.** Exact release-candidate head `266afa531f34d8dd2578b869be060ff58d7b5616`; squash merge `35f8da7644fed8dfa46f70c3151610b6ae4f9dfa`; Production deployment `dpl_2G4VhsqnzyFBxxLE8czcM2dhes3y` READY. C1 database/private-Storage migration was applied and verified DB-first before application deployment. |
| Stage 1C database release | Exact migration `20260922210000_issue_81_stage_1c_location_template.sql`, Git blob `748e9d0f6dd9d5796839b6a234222593d2f25bc2`, SHA-256 `6a4e3285382d1d1fbd9592af70ec1e2476ac8c9bec28cd0ba6a0e3287b3cb98f`, applied/accepted on Staging and Production. Production ledger: `20260923135852 / issue_81_stage_1c_location_template`. 034–036 remain unapplied. |
| Phase 5 | **COMPLETE.** Genuine GVM Production booking + customer confirmation + business new-booking email acceptance remains closed. Do not manufacture replacement Production tests. |
| Current program phase | **Outside Private Alpha readiness — IN PROGRESS.** |
| Issue #81 multi-location Stage 1 | **COMPLETE / PRODUCTION ACCEPTED.** Stage 1A Business Service Catalog, Stage 1B Service/Staff/location/public-booking convergence and Stage 1C atomic Add Location snapshot/template workflow are live. One Business Service Catalog; `service_locations` = offered-at truth; `staff_locations` = works-at truth; primary/home fields remain compatibility only. |
| Location entitlement | Canonical live limits: starter 1 / professional 3 / business 6 / enterprise unlimited. GVM remains a normal Starter tenant with 3 existing Locations grandfathered; `can_add_location=false` until entitlement changes. Existing GVM rows were not rewritten by Stage 1C. |
| Observability / Issue #65 | **COMPLETE / CLOSED.** Production Sentry remains OFF. |
| Issue #72 tenant identity | **CLOSED / PRODUCTION ACCEPTED.** Do not reopen absent contradictory evidence. |
| Issue #73 governed switching/import | **ACTIVE.** Package A COMPLETE. B1 MERGED + STAGING + PRODUCTION ACCEPTED. Staff quota MERGED + STAGING + PRODUCTION ACCEPTED. B2 core MERGED + STAGING + PRODUCTION ACCEPTED. **Package C1 MERGED + STAGING + PRODUCTION ACCEPTED.** Issue remains open because the customer-facing migration product still requires C2 mapping/review and C3 commit/results/cutover. |
| Main-branch governance | Ruleset `23730556`: PR required; required checks include Vercel + competitive-product-gate; strict/up-to-date; force-push/deletion blocked; admin bypass PR-only. |
| Competitive Product Gate | Permanent for material customer/operator features. |
| Primary engineering governance | Codex = primary engineer; ChatGPT = Control Tower; Claude = independent high-risk auditor; Momentic/equivalent = browser/workflow validation; Cursor = local/authenticated/device-specific fallback. |
| Deferred / design-for-now | Stage 2 location overrides, Stage 3 live inheritance, resource-aware booking, durable Summer action provenance, true employee RBAC, tenant switcher, Production Sentry activation, native apps, branded domain, residual historical security/migration debt when specifically scoped. |
| Package C1 private artifact foundation | **COMPLETE / MERGED / STAGING + PRODUCTION ACCEPTED.** PR #97 release candidate `266afa531f34d8dd2578b869be060ff58d7b5616`; squash merge `35f8da7644fed8dfa46f70c3151610b6ae4f9dfa`. Migration `20260923205834_issue_73_package_c1_private_artifacts.sql`, SHA-256 `c5bab138294b84de40e9644fcd604594db94b2d917a8f1b5dc601b58d9542089`; Production ledger `20260923232629`. Private `import-artifacts` bucket live/empty; no real import data created. [C1 evidence](import/ISSUE_73_PACKAGE_C1.md). |
| Exact next substantive gate | **Issue #73 Package C2 — READ-ONLY product / architecture / security / UX preflight.** Define the CSV adapter/parser, source reuse, deterministic field mapping, preview/review workspace, exact reviewed-plan freeze integration, privacy-safe rows-needing-attention export, responsive/mobile/accessibility contract and global-by-design parsing boundaries. C2 implementation remains NOT AUTHORIZED until the preflight and independent audit are reconciled. |
| Product Owner input | No Product Owner input is required for the next **read-only C2 preflight**. Any C2 implementation, hosted upload/mapping workflow, real customer/source file, C3 reminder takeover, merge/Production release or broader migration claim remains separately governed. |

GVM Baby World and Chasum HQ remain normal tenants. Platform Admin remains separate at `/owner`.

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md), then [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md), then the live active Issue/PR. Current GitHub/runtime evidence wins over stale handoff text.

**Size budget:** keep this board short; move history, not decisions, elsewhere.
