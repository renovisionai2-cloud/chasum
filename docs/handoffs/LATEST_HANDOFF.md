# Chasum — Latest Development Handoff

**Updated:** 2026-09-26 by Codex for the bounded Issue #106 pricing candidate, using the Product Owner / supervisor dispatch; prior accepted records preserved.
**Purpose:** recover the next action in 5–10 minutes without old-chat reconstruction.  
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md), which owns the Chasum mission, the permanent Product Owner principle, the multi-location operating model, Summer doctrine, the World-Class Standard and current agent governance.

## A. Current control-tower state

World Class Phase 5 is **COMPLETE**.

Current program phase:

**Issue #106 CAD pricing presentation candidate ACTIVE / NOT Production accepted.** PR #105 / Slice 0A is COMPLETE, merged and Production verified per PO/supervisor dispatch; base `7a3a62c6c0bae9358e43cc647a02f20df5d65372`, quality check REQUIRED (integration `15368`). No fresh hosted/runtime observation in this network-disabled clone. See section D.

Latest accepted **behavior-changing** Production application release:

`934fe4c2d93f165f1b03189995f97ea2b32b8f4b`

This is the PR #103 Issue #102 squash merge. Vercel Production deployment:

`J6UTXrUeV4YjxRUfQU5hpAydBCe9`

is **SUCCESS** / "Deployment has completed". Direct `/api/build-info` HTTP 200 confirmed this exact SHA on `main`, `env=production`, `production=true`. Direct `/api/health` HTTP 200 reported `ok=true`, with Supabase/service-role/email/CRON secret configured and soft schema fallback disabled — byte-identical to the pre-merge baseline on `93a4fc1`. The served public bundle confirmed the Production data plane as Supabase `kxcydvhswkuzepwzzinq`. Later documentation-only merges may advance Git/serving SHA without changing application behavior, so fresh runtime evidence wins for consequential work.

Production Sentry remains OFF.

Prior accepted behavior-changing releases remain historically valid and are not rewritten: `93a4fc13bed2fb2bf6cb00ead8050878aad1adb9` (PR #100 Package C) and `35f8da7644fed8dfa46f70c3151610b6ae4f9dfa` (PR #97 Package C1).

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

### Stage-1 convergence completed by Issue #102

Issue #102 closed the last Stage-1 read-model gap without rewriting the accepted Stage 1 history above. It was legitimate post-acceptance contradictory operator evidence from real GVM Production use: Services reported "Offered here" at secondary Locations while Reception simultaneously demanded "add at least one service and one bookable employee", because Command Centre still read the legacy `services.location_id` scope.

Accepted outcome, live in Production at `934fe4c`:

- Command Centre, Services, Employees, Reception, Booking Sheet and public booking all read the same relationship truth (`service_locations` / `staff_locations` / `staff_services`).
- The permissive "Staff with null `location_id` works everywhere" fallback was **removed**; booking readiness is now stricter, never looser.
- `lib/booking/location-readiness.ts` models four states — `no-services`, `no-staff`, `no-service-staff-overlap`, `ready` — each naming the actual missing relationship.
- Booking Location precedence is contract-locked: existing appointment → explicit draft → active workspace → user preference → Business default.
- Shared modal Sheet raised above persistent mobile navigation (`z-[60]` vs nav `z-50`).

Identity: audited candidate `af535ec9f1e86af0da59c7e199218af26a24a134`; hosted-accepted parent `5421facf97da019a1e2b375a541f25877145d6ef`; squash merge `934fe4c2d93f165f1b03189995f97ea2b32b8f4b` whose Git tree hash is byte-identical to the audited candidate (`4fd479460dd98a8a99a780d6ae182d2521b96972`). No migration, SQL, schema or RLS change. Issue #102 is **CLOSED / PRODUCTION ACCEPTED**.

### GVM Production relationship-data correction — COMPLETE / ACCEPTED

A separate governed Production **DATA** action, distinct from the software release. Shipping Issue #102 alone did not restore GVM bookability; it made the application state the true blocker. This correction supplied the missing relationships.

Executed scope, additive only:

- 6 additive non-primary `staff_locations` rows — Bobita Singh, Darshan Dindial and Summer Dindial each to Brampton **and** Caledonia.
- 2 additive non-primary Caledonia `service_locations` rows — "2nd visit of ultimate package" and "Elite Pro Package".
- **No** updates, **no** deletes, **no** `staff_services` changes, **no** home/default Location changes, **no** migrations, **no** schema/RLS changes.

Accepted post-correction state: Burlington 14 Services / 3 bookable Staff / 3 matched Staff; Brampton 14 / 3 / 3; Caledonia 14 / 3 / 3. All three readiness states = `ready`. **0 of 42** Service/Location combinations lack eligible Staff. Burlington remains home/default for all three Staff. `staff_services` unchanged at 25. Exact IDs and rollback keys are in the [Environment Manifest](../runtime/ENVIRONMENT_MANIFEST.md) `GVM-DATA-2026-09-26` record.

**GVM exposed the problem. GVM is not the architecture.** No tenant-specific application logic is authorized.

## C. Issue #73 governed switching/import — CLOSED / COMPLETED

Issue #73 is **CLOSED / COMPLETED** (2026-09-25). The customer-facing migration product is complete: Package A, B1, staff quota, B2 core, C1, C2 and C3 are all done, with Package C released to Production via PR #100 (`93a4fc13bed2fb2bf6cb00ead8050878aad1adb9`).

**Do not resume Package C2 or C3 preflight work.** The previous "Package C2 READ-ONLY preflight" next-action recorded in this handoff was already superseded by live GitHub and was removed on 2026-09-26. Do not reopen absent contradictory evidence.

Accepted package history is retained below for continuity.

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

## D. Exact next governed gate

**ISSUE #106 CANDIDATE REVIEW / HOSTED ACCEPTANCE.**

One primary implementer: Codex, supervised by ChatGPT AI Executive; Claude Control Tower remains reviewer. Isolated branch `codex/issue-106-pricing-truth` at supplied base `7a3a62c6c0bae9358e43cc647a02f20df5d65372`. PR #105 is closed; do not reopen it or PR #3/#13/#16. No competing pricing work is authorized.

Locked CAD pricing: standard Professional 79/month, 790/year; Business 149/month, 1,490/year. First 25 businesses signing up for Alpha: fixed lifetime recurring Professional 59/month, 590/year; Business 129/month, 1,290/year. Annual totals are paid upfront for 12 months. Exact framing: “Pay for 10 months and receive 2 months free.” Leading offer: “Save twice: lifetime Alpha pricing, plus two months FREE when you pay annually.” Explain the 240/year lifetime saving at monthly rates first, then additional annual saving 118/258; combined savings 358/498 against 12 regular monthly payments. Monthly Alpha does not get two months free. Enrollment and cancellation/rejoin/transfer/plan-change/tax terms remain undecided; a tenant Alpha flag never proves offer eligibility.

Competitive Product Gate REQUIRED; supervisor completed the pre-build contract in Issue #106 comment `5848862526` (2026-09-26). Preserve CAD, cadence, upfront annual total and distinct savings; existing features and routes remain intact. Pure shared representation only; no runtime catalog override, checkout, assignment, historical-invoice relabeling or entitlement change. BillingManager remains unchanged; hosted authenticated acceptance is not claimed.

Next: supervisor inspects exact files/patch, publishes the candidate, verifies hosted Node 22 quality CI and Preview, and arranges independent review plus browser/responsive acceptance. Local Node is 26.7.0; local evidence does not replace hosted CI. Candidate is **NOT Production accepted**. Merge/activation and Production operations are expressly unauthorized. No new PO pricing decision is needed for candidate preparation. The environment manifest retains dated runtime evidence; this task does not mutate runtime.

## E. Other accepted program state

- Observability / Issue #65 — **CLOSED / COMPLETE**. Production Sentry remains OFF.
- Issue #72 tenant identity — **CLOSED / PRODUCTION ACCEPTED**.
- Phase 5 GVM booking/communications acceptance — **COMPLETE**.
- Issue #73 governed switching/import — **CLOSED / COMPLETED**.
- Issue #102 multi-location readiness truth — **CLOSED / PRODUCTION ACCEPTED**.
- GVM Production relationship-data correction — **COMPLETE / ACCEPTED**.
- Issue #57 branded domain — **OPEN but DEFERRED** by Product Owner decision `5745462206`. `https://chasum.vercel.app` remains the Private Alpha Production hostname; `https://staging.chasumai.com` remains Staging. `chasumai.com` / `www.chasumai.com` were attached Vercel-side before the stop; GoDaddy DNS, Supabase Auth Site URL, Production `NEXT_PUBLIC_APP_URL` and redeploy were NOT changed. Preserve Microsoft 365 and Resend mail DNS.
- PR #105 / Slice 0A: COMPLETE / merged / Production verified; stale assertions corrected; quality REQUIRED (integration `15368`) alongside Vercel + competitive-product-gate, per PO/supervisor dispatch. Remaining non-blocking debt: pre-existing React-Compiler lint debt in `quick-appointment.tsx` / `sheet.tsx`; a 36px Employee-profile control below the Chasum ≥40px touch floor.
- Dependency findings: PR #105 disclosed npm's 25 findings (3 low / 8 moderate / 13 high / 1 critical) on the unchanged lockfile. Runtime reachability/exploitability **UNASSESSED**; read-only triage pending. This is not evidence of compromise or dependency-fix/upgrade authorization. No audit/network/upgrade work in #106.
- GVM and Chasum HQ remain normal tenants. Platform Admin / Control Centre remains a separate protected control plane at `/owner`; Chasum HQ is **not** Platform Admin.

## F. Agent governance — current model

Do not blindly restore historical agent assignments if they are stale.

- **Darshan** = Founder / CEO / Product Owner.
- **ChatGPT** = Chasum AI Executive & Chief Product/Technology Adviser.
- **Claude Opus** = Development Control Tower.
- **Codex** = Primary Engineering Implementer.
- **Grok** = World-Class Product / Architecture Challenger.
- **Independent audit** = assigned separately according to risk.

One primary implementer per task. Claude becoming Development Control Tower does **not** automatically make Claude the normal implementation engineer. Live GitHub/repository/runtime truth remains authoritative over stale handoffs. Closed/accepted work stays closed absent contradictory evidence.

The World-Class / Mission / Summer / Competitive re-anchor happens **once per major Chasum chapter**, not every few hours. Re-open strategic review only on new contradictory evidence, material divergence from the accepted contract, materially stale competitive evidence, or explicit Product Owner reconsideration.

## G. New-chat bootstrap

```text
Repository: renovisionai2-cloud/chasum. This is not a fresh project.

Read:
1. docs/CURRENT_PROJECT_STATE.md
2. docs/handoffs/LATEST_HANDOFF.md
3. docs/runtime/ENVIRONMENT_MANIFEST.md
4. docs/company/CHASUM_BIBLE.md
5. docs/company/PRODUCT_PRINCIPLES.md
6. docs/company/GLOBAL_GO_TO_MARKET.md
7. live GitHub Issues and PRs

Freshly query remote main/runtime and live GitHub before acting.

MISSION: Chasum is becoming THE WORLD'S MOST INTELLIGENT AI-POWERED BUSINESS
OPERATING SYSTEM FOR SERVICE-BASED BUSINESSES. Not booking software, not a
scheduler, not a CRM, not a payment tool, not an AI receptionist, not a chatbot.
Connected chain: Customer -> Booking -> Appointment -> Staff -> Location ->
Service -> Payment -> Invoice -> Receipt -> Communication -> Follow-up ->
Reporting -> Automation -> Summer Intelligence.

PERMANENT PRINCIPLE:
CHASUM ADAPTS TO HOW THE BUSINESS OPERATES.
THE BUSINESS SHOULD NOT HAVE TO REORGANIZE ITSELF TO FIT CHASUM.
GLOBAL ARCHITECTURE NOW. REGIONAL ACTIVATION DELIBERATELY.
No tenant-specific application logic is authorized.

MULTI-LOCATION OPERATING MODEL (governing architecture):
Business -> Locations. One Business Service Catalog; each Service offered at
ONE/SOME/ALL Locations. Each Staff member works at ONE/SOME/ALL Locations.
Each Staff member provides ONE/SOME/ALL Services. Bookability at a Location =
Service offered there + Staff permitted there + Staff provides it + applicable
hours/availability. service_locations / staff_locations / staff_services carry
operating truth. Home/default Location and legacy primary Service Location are
metadata only and never mean "only here". GVM exposed the problem; GVM is not
the architecture.

SUMMER = AI BUSINESS MANAGER:
UNDERSTAND -> EXPLAIN -> RECOMMEND -> ACT safely with permission -> AUDIT ->
later AUTOMATE SAFELY -> later OPERATE PROACTIVELY. Do not bolt an AI label onto
conventional SaaS. Multi-location UNDERSTAND/EXPLAIN/RECOMMEND are supported;
ACT is blocked by the Employee assigned-location persistence gap.

WORLD-CLASS STANDARD (do not copy these products):
Apple simplicity/clarity/polish; Stripe truth/reliability/financial confidence;
Linear speed/hierarchy/efficient workflows; Notion flexibility/adaptable
business structure; OpenAI intelligence; Framer visual quality; Calendly
scheduling simplicity; Jane workflow trust/usability; Fresha/Vagaro operational
breadth. Standing question: "If a mature service business sees Chasum beside its
existing software, why does Chasum feel like an upgrade?" Passing tests means
technically credible, NOT world class. Always ask both "Does it work safely?"
and "Would a real business prefer this experience to the mature software it
already uses?"

Latest accepted behavior-changing Production application release:
934fe4c2d93f165f1b03189995f97ea2b32b8f4b   (PR #103, Issue #102)

Issue #81 Stage 1 COMPLETE / Production accepted.
Issue #73 CLOSED / COMPLETED - do NOT resume Package C2 or C3.
Issue #102 CLOSED / PRODUCTION ACCEPTED.
GVM Production relationship-data correction COMPLETE / ACCEPTED.
Issue #57 branded domain OPEN but DEFERRED by PO decision 5745462206.
Migrations 034-036 remain unapplied.

NEXT GATE:
Issue #106 CAD pricing candidate review / hosted acceptance. PR #105 is COMPLETE
and Production verified; quality REQUIRED (integration 15368). #106 is NOT
Production accepted. Supervisor publishes exact candidate and arranges hosted
Node 22 CI / Preview and independent review. Merge and activation NOT authorized.
See section D for locked prices/copy and undecided enrollment/continuity terms.

AGENT GOVERNANCE: Darshan = Product Owner. ChatGPT = AI Executive & Chief
Product/Technology Adviser. Claude Opus = Development Control Tower. Codex =
Primary Engineering Implementer. Grok = World-Class Product/Architecture
Challenger. Independent audit assigned separately by risk. One primary
implementer per task; Control Tower is not automatically the implementer.

Re-anchor Mission/World-Class/Summer/Competitive ONCE PER MAJOR CHAPTER, not
every few hours.

REQUESTED IS NOT RUNNING remains mandatory for all external-agent dispatch.
Proceed automatically through safe read-only gates; stop only for a genuine
Product Owner decision.
```

Refresh this handoff after major releases, phase/incident closure, architecture/governance changes, every few significant PRs, or approximately weekly during heavy development.
