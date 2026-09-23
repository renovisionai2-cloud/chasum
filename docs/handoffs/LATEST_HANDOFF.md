# Chasum — Latest Development Handoff

**Updated:** 2026-09-23 by Codex for the authorized Issue #73 Package B2 core CODE-ONLY candidate. Accepted Stage 1C runtime records preserved.
**Purpose:** recover the next action in 5–10 minutes without old-chat reconstruction.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md).

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Current program phase:

**Outside Private Alpha readiness — IN PROGRESS.**

Accepted Stage 1C application-release baseline (dated runtime evidence):

`0a81084362ac43d076b35aa0cb463f4efd136afe`

This is PR #89 Stage 1C squash merge. Vercel Production deployment:

`dpl_8cgdg2JJJ984Y4jf5LFvPfrXHMV4`

is **READY** and direct `/api/build-info` reports the exact merge on `main`, `env=production`, `production=true`.

Production Sentry remains OFF.

Current Git main was verified at B2 entry as
`18933a3268a57f01daf439b9d116b4672a002a1d` (PR #92 Staff quota merge).
This task does not restamp the accepted Production runtime evidence above.

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

Staff quota:
- PR #92 MERGED as `18933a3268a57f01daf439b9d116b4672a002a1d`;
- Staging accepted per governed Issue #73;
- Production migration **NOT APPLIED**.

Package B2:
- PO-authorized core implementation is now a **CODE-ONLY candidate** on
  `codex/issue-73-package-b2-core`, exact base above;
- server-only session authority, owner-only service-role RPCs, reviewed row/target
  commitments, bounded atomic batches and fenced lease/recovery;
- internal Services with enforced commercial review, closed imported Location/
  Staff hours, exact-only future appointment money and no communications;
- [B2 engineering evidence](../import/ISSUE_73_PACKAGE_B2.md) records schema,
  operational behavior, privacy/recovery requirements and exact validation limits;
- no B2 hosted migration, merge, Production, GVM/HQ or real import occurred.

### Exact next safe gate

**Control Tower reconciliation of the exact Draft PR HEAD → independent Claude
Level-3 B2 candidate audit.** The earlier architecture audit does not replace this.

Execution truth: Codex implementation and supporting Codex review/tests executed.
Claude is **BLOCKED ON MANUAL DISPATCH**; no executable channel, accepted task/run
or returned candidate audit exists here. Darshan/Control Tower must send the exact
candidate and immutable audit prompt from the final delivery report. Supporting
Codex reviews are not that independent audit. Momentic/browser is PLANNED / NOT
DISPATCHED for later synthetic hosted acceptance.

Only after independent audit: separate PO Staging-apply decision, synthetic
hosted acceptance, separate merge decision, then later Production prerequisite
and rollout decisions. Production B1 and Staff-quota migrations remain unapplied.
Migrations 034–036 remain out of scope. Safe code review can continue now.

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

Current Git main / exact B2 base verified at entry:
18933a3268a57f01daf439b9d116b4672a002a1d
Accepted Stage 1C runtime baseline remains a separate dated record above.

Issue #81 Stage 1 is COMPLETE / MERGED / STAGING + PRODUCTION ACCEPTED.
Stage 2 overrides and Stage 3 live inheritance are deferred.
Migrations 034–036 remain unapplied.

Issue #73 remains ACTIVE:
Package A COMPLETE.
Package B1 MERGED + STAGING VERIFIED / PRODUCTION DB NOT APPLIED.
Staff quota MERGED + STAGING ACCEPTED / PRODUCTION migration NOT APPLIED.
Package B2 core is now a PO-authorized CODE-ONLY candidate; see B2 engineering note.

NEXT SAFE GATE:
B2 CODE-ONLY candidate: Control Tower reconciliation and independent Claude
Level-3 audit of exact Draft PR HEAD. Claude BLOCKED ON MANUAL DISPATCH; no
execution evidence. No hosted apply or merge authorized. A posted prompt is
not a running agent. Continue safe code review only.

Do not start Gate B or Summer horizontal-v1 before Outside Private Alpha readiness closes.
Proceed automatically through safe read-only gates; stop only for a genuine Product Owner decision.
```

Refresh this handoff after major releases, phase/incident closure, architecture/governance changes, every few significant PRs, or approximately weekly during heavy development.
