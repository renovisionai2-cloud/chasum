# Chasum — Latest Development Handoff

**Updated:** 2026-09-23 by ChatGPT Control Tower for Issue #73 Package C1 Staging + Production acceptance and C2 continuation.
**Purpose:** recover the next action in 5–10 minutes without old-chat reconstruction.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md).

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Current program phase:

**Outside Private Alpha readiness — IN PROGRESS.**

Latest accepted **behavior-changing** Production application release:

`35f8da7644fed8dfa46f70c3151610b6ae4f9dfa`

This is PR #97 Package C1 squash merge. Vercel Production deployment:

`dpl_2G4VhsqnzyFBxxLE8czcM2dhes3y`

is **READY**. Direct `/api/build-info` HTTP 200 confirmed the exact merge on `main`, `env=production`, `production=true`. Direct `/api/health` HTTP 200 reported `ok=true`, with Supabase/service-role/email/CRON secret configured and soft schema fallback disabled. Later documentation-only merges may advance Git/serving SHA without changing application behavior, so fresh runtime evidence wins for consequential work.

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
- MERGED / STAGING + PRODUCTION ACCEPTED.
- Production ledger `20260923185926 / governed_import_foundation`.

Staff quota:
- MERGED / STAGING + PRODUCTION ACCEPTED.
- Production ledger `20260923190213 / issue_73_staff_quota_hardening`.
- GVM remains grandfathered Starter with 3 active Staff against max 1; existing Staff were not removed/deactivated.

Package B2 core:
- MERGED / STAGING + PRODUCTION ACCEPTED.
- accepted release `06c7d502948a321b706ba07036724c9178e428e7`.
- Production ledger `20260923190501 / issue_73_package_b2_core`.
- exact migration SHA-256 `0f051b80fbdca7e199b8382e7d400785d408d73c6799beba17de0591c79c6062`.

Package C1 private artifact security foundation:
- **MERGED / STAGING + PRODUCTION ACCEPTED**.
- exact pre-merge release candidate `266afa531f34d8dd2578b869be060ff58d7b5616`.
- squash merge / accepted application release `35f8da7644fed8dfa46f70c3151610b6ae4f9dfa`.
- Production deployment `dpl_2G4VhsqnzyFBxxLE8czcM2dhes3y` READY.
- exact migration `20260923205834_issue_73_package_c1_private_artifacts.sql`.
- SHA-256 `c5bab138294b84de40e9644fcd604594db94b2d917a8f1b5dc601b58d9542089`.
- Production ledger `20260923232629 / issue_73_package_c1_private_artifacts`.
- private `import-artifacts` bucket live with `public=false`; Production remains 0 C1 sources / 0 artifacts / 0 bucket objects.
- RLS/FORCE RLS, zero client policies, service-role-only C1 RPC execution and no direct anon/authenticated table access verified.
- hosted Staging acceptance proved signed-upload exact-path behavior, replay/upsert resistance, private direct-access denial, owner-only authority, actual-byte verification, reviewed-plan fidelity, B2 bind while committing, concurrent cleanup fencing and hard reviewed-plan expiry.
- hosted Supabase missing-object shape `status=400/statusCode="404"` was discovered, narrowly corrected and independently audited before acceptance.
- final Staging synthetic teardown restored sources/artifacts/runs/refs/outcomes/bucket objects/synthetic users/businesses to zero.
- Production post-deploy: GVM unchanged 3 Locations / 14 Services / 3 Staff / 9 Appointments; background_jobs 611; communication_send_intents 17; import runs/refs/outcomes 0 / 0 / 0.
- no real Production import/source/customer artifact was created.

Locked Package C Product Owner decisions remain:
- Private Alpha migration = guided self-service, primary Business owner authorizes/commits;
- one uploaded CSV per governed run, with deterministic related-row expansion allowed;
- raw artifact max 24h, reviewed artifact terminal+~1h / hard 72h fail-closed retention;
- C3 reminder takeover is explicit per-run owner opt-in, default OFF.

### Exact next safe gate

**Issue #73 Package C2 — READ-ONLY product / architecture / security / UX preflight.**

Reconcile the smallest launch-required mapping/review layer on top of accepted A/B1/B2/C1:

- UTF-8 CSV adapter and bounded parsing;
- source identity selection/reuse;
- deterministic header/field mapping;
- explicit date/time interpretation;
- reference mapping for Location / Service / Staff / Customer;
- Package A preview integration;
- review categories CREATE / LINK / SKIP / REVIEW / BLOCK;
- exact reviewed-plan freeze into C1;
- privacy-safe client-only rows-needing-attention export with spreadsheet-formula escaping;
- mobile/tablet/desktop mapping UX and accessibility;
- global-by-design boundaries for locale/date/currency/address/phone without implementing the later Global Readiness Foundation.

Do **not** implement C2 until the preflight is reconciled and independently audited. Do not reopen C1 absent contradictory evidence.

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
6. docs/company/GLOBAL_GO_TO_MARKET.md
7. live Issue #73

Freshly query remote main/runtime before acting.

Latest accepted behavior-changing Production application release:
35f8da7644fed8dfa46f70c3151610b6ae4f9dfa

Issue #81 Stage 1 COMPLETE / Production accepted.
Migrations 034–036 remain unapplied.

Issue #73 remains ACTIVE:
Package A COMPLETE.
B1 MERGED / STAGING + PRODUCTION ACCEPTED.
Staff quota MERGED / STAGING + PRODUCTION ACCEPTED.
B2 core MERGED / STAGING + PRODUCTION ACCEPTED.
C1 private artifact foundation MERGED / STAGING + PRODUCTION ACCEPTED.

NEXT SAFE GATE:
Package C2 READ-ONLY product/architecture/security/UX preflight only.
Define CSV parsing, source reuse, deterministic mapping, preview/review,
reviewed-plan freeze integration, privacy-safe client-only error export,
responsive/accessibility and global-by-design parsing boundaries.
Do not implement C2 until preflight + independent audit are reconciled.

REQUESTED IS NOT RUNNING remains mandatory for all external-agent dispatch.
Proceed automatically through safe read-only gates; stop only for a genuine Product Owner decision.
```

Refresh this handoff after major releases, phase/incident closure, architecture/governance changes, every few significant PRs, or approximately weekly during heavy development.
