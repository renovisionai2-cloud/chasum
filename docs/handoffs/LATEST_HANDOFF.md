# Chasum — Latest Development Handoff

**Updated:** 2026-09-23 by Codex for PO-authorized Issue #73 Package C1 code-only delivery; accepted B2 Staging/Production state preserved.
**Purpose:** recover the next action in 5–10 minutes without old-chat reconstruction.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md).

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Current program phase:

**Outside Private Alpha readiness — IN PROGRESS.**

Latest accepted **behavior-changing** Production application release:

`06c7d502948a321b706ba07036724c9178e428e7`

This is PR #93 Package B2 core squash merge. Vercel Production deployment:

`dpl_HUcbeyiham9KTNftrZCB4QTinu2K`

is **READY**. Direct `/api/build-info` confirmed this exact behavior-changing merge at acceptance. Later documentation-only merges may advance Git/serving SHA without changing application behavior, so fresh main/runtime evidence wins for consequential work. Direct `/api/health` HTTP 200 reported `ok=true`; health remains configuration-presence evidence only.

Production Sentry remains OFF.

## B. Issue #81 multi-location Stage 1 — COMPLETE / PRODUCTION ACCEPTED

Stage 1A, Stage 1B and Stage 1C are now accepted.

### Accepted architecture

- one Business Service Catalog;
- `service_locations` = Service offered-at truth;
- `staff_locations` = Staff works-at truth;
- `services.location_id` / `staff.location_id` remain primary/home compatibility during Stage 1;
- concrete `location_settings` / `location_hours` remain operational scheduling truth;
- public booking uses converged Location + Service + Staff + staff_services rules;
- Add Location uses snapshot/copy, **not live inheritance**;
- no duplicate Service rows;
- Staff is assigned deliberately;
- resources are not copied or treated as public-booking authority in Stage 1.

### Stage 1C release

Exact accepted PR head:

`457a6ab8da23c1104a81208338024511ab4f8115`

Squash merge:

`0a81084362ac43d076b35aa0cb463f4efd136afe`

Exact migration:

`supabase/migrations/20260922210000_issue_81_stage_1c_location_template.sql`

Git blob:

`748e9d0f6dd9d5796839b6a234222593d2f25bc2`

SHA-256:

`6a4e3285382d1d1fbd9592af70ec1e2476ac8c9bec28cd0ba6a0e3287b3cb98f`

Production ledger:

`20260923135852 / issue_81_stage_1c_location_template`

Staging and Production accepted.

Canonical location entitlement is now live:

- starter = 1
- professional = 3
- business = 6
- enterprise = unlimited

GVM remains a normal Starter tenant with 3 existing Locations grandfathered. Existing GVM rows remain intact; `can_add_location=false` until entitlement changes.

Hosted responsive acceptance:
- desktop PASS;
- tablet PASS;
- mobile 390×844 PASS after bounded Dialog stacking correction;
- mobile real create → deliberate Staff assignment → finish PASS;
- cleanup restored Test Studio baseline exactly.

Migrations 034–036 remain unapplied.

Stage 2 location overrides and Stage 3 live inheritance remain **DESIGN FOR NOW / BUILD LATER**.

## C. Issue #73 governed switching/import

Issue #73 remains **ACTIVE** because the customer-facing migration product is not complete.

Package A:
- COMPLETE / accepted deterministic preview foundation.

Package B1:
- MERGED;
- exact migration `20260921203029_governed_import_foundation.sql`;
- SHA-256 `57b79680fdc60ad5789d90d1d9e6e9600b9b15fb84002687e86c1130acd4dc9f`;
- Staging APPLIED + VERIFIED;
- Production APPLIED + VERIFIED as ledger `20260923185926 / governed_import_foundation`.

Staff quota:
- PR #92 MERGED;
- exact migration `20260923152046_issue_73_staff_quota_hardening.sql`;
- SHA-256 `e79b37d31d5aaf3e28ac48d18949e1dd892bdd0c7eb97f98492f0165e0fd7432`;
- Staging APPLIED + VERIFIED;
- Production APPLIED + VERIFIED as ledger `20260923190213 / issue_73_staff_quota_hardening`;
- GVM remains a grandfathered Starter tenant with 3 active Staff against max 1; existing Staff were not removed/deactivated.

Package B2 core:
- exact accepted PR head `84168a3c630550f040866700def2edcacdbd16c2`;
- squash merge / current main `06c7d502948a321b706ba07036724c9178e428e7`;
- exact migration `20260923210000_issue_73_package_b2_core.sql`;
- SHA-256 `0f051b80fbdca7e199b8382e7d400785d408d73c6799beba17de0591c79c6062`;
- Staging APPLIED + hosted synthetic acceptance PASS;
- Production APPLIED + VERIFIED as ledger `20260923190501 / issue_73_package_b2_core`;
- Production application deployment `dpl_HUcbeyiham9KTNftrZCB4QTinu2K` READY;
- all 31 existing Production Services preserved as reviewed; all 14 GVM Services reviewed;
- B1/B2 import tables remain empty in Production; no synthetic Production import/customer/provider test was created;
- GVM remains 3 Locations / 14 Services / 3 Staff / 9 Appointments;
- migrations 034–036 remain unapplied.

Governance incident retained:
- the B2 Staging migration had been applied earlier than its PO gate through a Supabase MCP management request;
- Control Tower later detected/reconciled the state and did not force/reapply it;
- authorized hosted synthetic acceptance subsequently passed with complete cleanup;
- preserve **REQUESTED IS NOT RUNNING** and explicit mutation gates; do not infer authorization from current schema.

### Exact next safe gate

**Issue #73 Package C1 — code-only candidate → independent Level-3 audit.**

PO approved C1 implementation after the Claude Package C architecture verdict and
four reconciled decisions: guided self-service with primary-owner authority;
one uploaded CSV per run; raw24h/reviewed72h plus terminal1h retention; later C3
per-run reminder opt-in default OFF. This supersedes the earlier read-only gate.

Existing branch `codex/issue-73-package-c1-artifacts`, exact base
`68d944a8fb0cad282bb5df7b6100c490785d53de`; no new branch. C1 adds private sources,
artifacts/bucket, owner upload/verification/freeze/read/binding seams and fenced
cleanup cron. [C1 implementation, local evidence, hosted gaps and manual audit
prompt](../import/ISSUE_73_PACKAGE_C1.md) is the candidate authority. C1 is NOT
merged, Staging accepted or Production accepted. Package C is not complete.

Control Tower must reconcile the delivered immutable HEAD and dispatch Claude's
independent code audit. State: PLANNED / NOT SENT / NOT RUNNING; no executable
Claude channel or accepted run evidence in this session. Manual dispatch is the
next blocker requiring Control Tower/Darshan. Supporting Codex reviews/tests
completed; safe review can continue. Hosted work remains separately PO-gated.

DB-first: apply exact C1 migration/Storage only after separate authorization,
verify, then deploy application. This branch's automatic Git deployment is
disabled in vercel.json until that gate. No hosted migration, Storage bucket,
Staging/Production/GVM/HQ data or configuration was changed; runtime manifest
remains the dated accepted record. Full-suite marketing failure was reproduced
on exact base and has no changed C1 dependency; see evidence doc.

Do **not** re-run B2 preflight, create a second import writer, connect source APIs, import real customer data, or start Production onboarding from this handoff.

## D. Other accepted program state

- Observability / Issue #65 — **CLOSED / COMPLETE**.
- Issue #72 tenant identity — **CLOSED / PRODUCTION ACCEPTED**.
- Phase 5 GVM booking/communications acceptance — **COMPLETE**.
- Issue #57 branded domain — **DEFERRED**.
- GVM and Chasum HQ remain normal tenants.
- Platform Admin remains separate at `/owner`.

## E. Agent governance

- Darshan = Founder / CEO / Product Owner.
- ChatGPT = Control Tower / product + development program lead.
- Codex = primary engineer.
- Claude = independent Level-3/high-risk auditor.
- Momentic/equivalent = browser/workflow regression.
- Cursor = local/authenticated/device-specific fallback.

One primary implementer per task. Closed/accepted work stays closed absent contradictory evidence.

## F. New-chat bootstrap

```text
Repository: renovisionai2-cloud/chasum. This is not a fresh project.

Read:
1. docs/CURRENT_PROJECT_STATE.md
2. docs/handoffs/LATEST_HANDOFF.md
3. docs/runtime/ENVIRONMENT_MANIFEST.md
4. docs/company/CHASUM_BIBLE.md
5. docs/company/PRODUCT_PRINCIPLES.md
6. live Issue #73

Freshly query remote main/runtime before acting.

Accepted behavior-changing Production application release:
06c7d502948a321b706ba07036724c9178e428e7

Documentation-only merges may have advanced current Git/serving SHA; freshly query both.

Issue #81 Stage 1 is COMPLETE / STAGING + PRODUCTION ACCEPTED.
Migrations 034–036 remain unapplied.

Issue #73 remains ACTIVE:
Package A COMPLETE.
Package B1 MERGED / STAGING + PRODUCTION ACCEPTED.
Staff quota MERGED / STAGING + PRODUCTION ACCEPTED.
Package B2 core MERGED / STAGING + PRODUCTION ACCEPTED.

NEXT SAFE GATE:
Package C1 CODE-ONLY candidate independent Claude Level-3 implementation audit.
Read docs/import/ISSUE_73_PACKAGE_C1.md; bind audit to delivered exact HEAD and
migration hash. Control Tower/Darshan manually dispatches; no Claude run exists.
C2/C3, hosted apply/storage, merge and Production remain unauthorized here.
Do not reopen accepted B2. DB migration/Storage first, verify, application second.

REQUESTED IS NOT RUNNING remains mandatory for all external-agent dispatch.
Proceed automatically through safe read-only gates; stop only for a genuine Product Owner decision.
```

Refresh this handoff after major releases, phase/incident closure, architecture/governance changes, every few significant PRs, or approximately weekly during heavy development.
