# Chasum — Latest Development Handoff

**Updated:** 2026-09-23 by ChatGPT Control Tower after Issue #81 Stage 1C governed merge + Production acceptance.  
**Purpose:** recover the next action in 5–10 minutes without old-chat reconstruction.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md).

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Current program phase:

**Outside Private Alpha readiness — IN PROGRESS.**

Application-release main at this restamp base:

`0a81084362ac43d076b35aa0cb463f4efd136afe`

This is PR #89 Stage 1C squash merge. Vercel Production deployment:

`dpl_8cgdg2JJJ984Y4jf5LFvPfrXHMV4`

is **READY** and direct `/api/build-info` reports the exact merge on `main`, `env=production`, `production=true`.

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

Issue #73 remains **ACTIVE**.

Package A:
- COMPLETE / accepted code foundation.

Package B1:
- code MERGED;
- exact migration `20260921203029_governed_import_foundation.sql`;
- SHA-256 `57b79680fdc60ad5789d90d1d9e6e9600b9b15fb84002687e86c1130acd4dc9f`;
- Staging APPLIED + VERIFIED;
- Production DB **NOT APPLIED**.

Package B2:
- **NOT AUTHORIZED**.

The former #81 semantic blocker is now resolved by accepted Stage 1, but this does **not** auto-authorize B2.

### Exact next safe gate

Proceed automatically with:

**Issue #73 Package B2 — READ-ONLY product / architecture / security preflight only.**

Reconcile:
- source-neutral import writer contract;
- accepted `service_locations` / `staff_locations` semantics;
- locations + hours/settings authority;
- dry-run/preview before commit;
- duplicate/idempotency rules;
- stable source IDs;
- stale target-reference handling;
- timezone/currency/status normalization;
- rollback/retry/finalization;
- audit outcome records;
- `created_by` lifecycle/offboarding;
- whether Production B1 migration is a prerequisite and when;
- Summer UNDERSTAND / EXPLAIN / RECOMMEND / ACT / AUDIT readiness.

Do **not** implement B2, apply Production B1, bulk-write operational records, connect competitor APIs, or mutate outside-customer data from this handoff.

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
6. live Issue #73 and current related PRs

Freshly query remote main and runtime before acting.

Application-release main at this restamp base:
0a81084362ac43d076b35aa0cb463f4efd136afe

Issue #81 Stage 1 is COMPLETE / MERGED / STAGING + PRODUCTION ACCEPTED.
Stage 2 overrides and Stage 3 live inheritance are deferred.
Migrations 034–036 remain unapplied.

Issue #73 remains ACTIVE:
Package A COMPLETE.
Package B1 MERGED + STAGING VERIFIED / PRODUCTION DB NOT APPLIED.
Package B2 NOT AUTHORIZED.

NEXT SAFE GATE:
Package B2 READ-ONLY product/architecture/security preflight only.

Do not start Gate B or Summer horizontal-v1 before Outside Private Alpha readiness closes.
Proceed automatically through safe read-only gates; stop only for a genuine Product Owner decision.
```

Refresh this handoff after major releases, phase/incident closure, architecture/governance changes, every few significant PRs, or approximately weekly during heavy development.
