# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.  
**Snapshot date:** 2026-09-29. **Updated by:** Chasum development team for M1A Production acceptance closeout. M1A is closed; the broader GVM technician mobile-correction program remains open.
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations; freshly query remote main/runtime before consequential work.

## Chasum mission

Chasum is being built to become **THE WORLD'S MOST INTELLIGENT AI-POWERED BUSINESS OPERATING SYSTEM FOR SERVICE-BASED BUSINESSES.**

It is **not** merely booking software, scheduling software, a CRM, payment software, an AI receptionist or a chatbot.

Connected operating chain:

Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer Intelligence.

Every meaningful product decision should strengthen this operating system.

## Permanent Product Owner principle

**CHASUM ADAPTS TO HOW THE BUSINESS OPERATES. THE BUSINESS SHOULD NOT HAVE TO REORGANIZE ITSELF TO FIT CHASUM.**

**GLOBAL ARCHITECTURE NOW. REGIONAL ACTIVATION DELIBERATELY.** Architecture must support differing operating models globally without requiring every regional capability to be activated before launch.

No tenant-specific application logic is authorized.

## Control board

**2026-09-29 M1A — Mobile Workspace Scope Control:** **PRODUCTION ACCEPTED / CLOSED.** PR #118 merged to `main` as `2733729ebbf65442cf55eb53b4962aa672535617` on 2026-09-29T00:28:22Z. Exact hosted-tested runtime candidate: `26a4b328ea2b7de1fbf70cc3c28aa1ce23c24329`; documentation-only closeout parent: `3784c781b878107fa6da7628f837e50f33bdfb45`. The Production squash tree `cdce0b0b8425672bd9361563b20bb4fa6035d0f4` is byte-identical to the docs-closeout tree, and every non-Markdown path is mechanically identical to the hosted-tested runtime candidate. Automatic Vercel Production deployment `dpl_3gC2c7oAfXGdXJ4avdNpfPH7daT5` completed successfully; `/api/build-info` returned the exact merge SHA on `main`, `env=production`, `production=true`; `/api/health` returned HTTP 200 / `ok=true`; Quality on the exact Production SHA passed **1,665 / 36 skipped / 0 failed**, including the real-Chromium containment test. Real GVM Production remained intact and no Production data mutation or manufactured booking occurred. Claude Opus 5 High Development Control Tower verdict: **B — PRODUCTION ACCEPTED / M1A CLOSED, WITH NON-BLOCKING LIMITATIONS**. No rollback and no further Production probe are required.

**The original GVM technician mobile program remains OPEN.** M1A is only the first bounded correction. Remaining approved sequence:
- **M1B — All-Locations Booking Location Guard:** next governed gate; NOT STARTED.
- **M1C — Mobile Account Control:** required.
- **M2A — Reception Phone Composition:** required.
- **M2B — Calendar Phone Progressive Disclosure:** required.
- **M3 — Command Centre: Up Next Across Your Business:** approved/in scope; final launch classification at exact candidate.
- **M4 — Assign Later Level-3 Architecture/Data-Integrity Program:** required before truthful Unassigned / Assign Later support.
- **M5 — Summer Operating Intelligence:** design for now / build later.

Commercial SaaS Gate B / P2B remains paused and preserved while the Product Owner intentionally continues the mobile correction program. Do not reinterpret M1A closure as permission to resume P2B or as completion of the mobile program.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. See mission above. |
| Latest accepted behavior-changing application release | `2733729ebbf65442cf55eb53b4962aa672535617` — PR #118 M1A Mobile Workspace Scope Control **MERGED / PRODUCTION ACCEPTED**. Production deployment `dpl_3gC2c7oAfXGdXJ4avdNpfPH7daT5` READY/SUCCESS; `/api/build-info` confirmed the exact merge on `main`, `env=production`, `production=true`; `/api/health` HTTP 200 / `ok=true`; Quality on the exact SHA passed 1,665 tests / 36 skipped / 0 failed. No schema, migration, RLS, Auth or Production tenant-data mutation; no booking manufactured. |
| Prior accepted application release | `d2820c26238b98420f6942958743ba46ca8a54f5` — PR #114 bounded Next.js 16.3.6 security update, Production accepted. Issue #102 / PR #103 remains separately closed / Production accepted in the historical records below. |
| Issue #102 multi-location readiness truth | **CLOSED / PRODUCTION ACCEPTED** (2026-09-26). Converged Command Centre, Services, Employees, Reception, Booking Sheet and public booking onto one relationship truth; removed the legacy `services.location_id` Command Centre reader; removed the permissive "Staff with null `location_id` works everywhere" fallback; added `getLocationBookingReadiness()` four-state model; raised shared modal Sheet above persistent mobile navigation. Booking Location precedence: existing appointment → explicit draft → active workspace → user preference → Business default. |
| GVM Production relationship-data correction | **COMPLETE / ACCEPTED** (2026-09-26). Separate governed Production DATA action, distinct from the software release. See the multi-location operating model below and the [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md) `GVM-DATA-2026-09-26` record. |
| Stage 1C database release | Exact migration `20260922210000_issue_81_stage_1c_location_template.sql`, Git blob `748e9d0f6dd9d5796839b6a234222593d2f25bc2`, SHA-256 `6a4e3285382d1d1fbd9592af70ec1e2476ac8c9bec28cd0ba6a0e3287b3cb98f`, applied/accepted on Staging and Production. Production ledger: `20260923135852 / issue_81_stage_1c_location_template`. 034–036 remain unapplied. |
| Phase 5 | **COMPLETE.** Genuine GVM Production booking + customer confirmation + business new-booking email acceptance remains closed. Do not manufacture replacement Production tests. |
| Current program phase | **Mobile World-Class Correction Program — M1B governed gate preparation.** M1A is Production accepted / closed. M1B implementation has NOT started. M1C/M2A/M2B/M3/M4/M5 remain preserved/open. P2B remains paused/preserved by Product Owner sequencing. |
| Slice 0A / PR #105 | **COMPLETE / MERGED / Production verified** per live PO/supervisor dispatch. Base `7a3a62c6c0bae9358e43cc647a02f20df5d65372`; quality check **REQUIRED** (integration `15368`). Do not reopen #105 or PR #3/#13/#16. |
| Issue #106 / PR #107 pricing | **COMPLETE / Production accepted at `1b11ade`**, per PO/supervisor dispatch. Locked CAD presentation below remains accepted; separate commercial terms/activation are not inferred. |
| PR #111 / P2A | **Independently accepted; still Draft at `dbdcfea`.** Preserve candidate and review; no code imported into #113. |
| Issue #112 / P2B preparation | **PAUSED / PRESERVED.** Existing evidence/approvals remain intact, but the Product Owner has explicitly directed the active continuation to the mobile program after M1A closeout. Do not resume P2B automatically. |
| Issue #81 multi-location Stage 1 | **COMPLETE / PRODUCTION ACCEPTED.** Stage 1A Business Service Catalog, Stage 1B Service/Staff/location/public-booking convergence and Stage 1C atomic Add Location snapshot/template workflow are live. Issue #102 completed the remaining Stage-1 read-model convergence without rewriting this accepted history. |
| Location entitlement | Canonical application/Stage-1C limits: starter 1 / professional 3 / business 6 / enterprise unlimited. GVM remains a normal Starter tenant with 3 existing Locations grandfathered; `can_add_location=false` until entitlement changes. Historical Phase-5 source/seed material still contains Business=10 while later accepted app/Stage-1C truth is 6; track that source/history divergence separately and do not change entitlement behavior inside M1A. |
| Observability / Issue #65 | **COMPLETE / CLOSED.** Production Sentry remains OFF. |
| Issue #72 tenant identity | **CLOSED / PRODUCTION ACCEPTED.** Do not reopen absent contradictory evidence. |
| Issue #73 governed switching/import | **CLOSED / COMPLETED** (2026-09-25). Package A, B1, staff quota, B2 core, C1, C2 and C3 are all complete; Package C released to Production via PR #100 (`93a4fc13bed2fb2bf6cb00ead8050878aad1adb9`). Do not resume C2 or C3 preflight work — the prior "Package C2 READ-ONLY preflight" next-action is superseded and was removed from this board on 2026-09-26. |
| Issue #57 branded Production domain | **OPEN but DEFERRED** by accepted Product Owner decision `5745462206` (2026-09-19). `https://chasum.vercel.app` remains the Private Alpha Production hostname; `https://staging.chasumai.com` remains Staging. A partial Vercel-side apex/`www` attachment was recorded before the stop; GoDaddy DNS, Supabase Auth Site URL, Production `NEXT_PUBLIC_APP_URL` and redeploy were NOT changed. Do not resume without the Product Owner reversing the deferral. |
| Main-branch governance | Ruleset `23730556`: PR required; required checks are Vercel + competitive-product-gate + quality (integration `15368`, per PO/supervisor dispatch); strict/up-to-date; force-push/deletion blocked; `required_approving_review_count=0`; `required_review_thread_resolution=true`. PR #105 provides the Node 22 unit-test/typecheck quality workflow; this clone uses Node 26.7.0. |
| Competitive Product Gate | Permanent for material customer/operator features. |
| Known product gap | **Employee "Assigned locations" persistence path — IMPORTANT BUT POST-LAUNCH SAFE.** See below. |
| Deferred / design-for-now | Stage 2 location overrides, Stage 3 live inheritance, bulk multi-location assignment controls, resource-aware booking, durable Summer action provenance, true employee RBAC, tenant switcher, Production Sentry activation, native apps, branded domain (Issue #57), residual historical security/migration debt when specifically scoped. |
| Known non-blocking debt | PR #105 closed the two stale test assertions and established required quality CI. Local #113 comparison: 29 pre-existing lint errors and 8 warnings, including `quick-appointment.tsx` / `sheet.tsx`; the new Next lint rule adds two warnings for existing internal `window.location.href` navigation (`app/global-error.tsx:54`, `components/day-view/appointment-drawer.tsx:370`); a 36px Employee-profile control below the Chasum ≥40px touch floor. |
| Dependency findings / pending triage | **#109 residual analysis OPEN.** Dated baseline: 25 npm package entries (3 low / 8 moderate / 13 high / 1 critical), omit-dev 9 (0 / 2 / 6 / 1). #113 candidate: 22 (3 / 8 / 11 / 0), omit-dev 5 (0 / 2 / 3 / 0). Next no longer appears in the candidate audit; Momentic sharp 0.35.3 and other residuals remain. These are package entries, not independent CVEs or proof of exposure/compromise. September 30 release check is future follow-up, not installed or scheduled. |
| Exact next substantive gate | **M1B — All-Locations Booking Location Guard: governed gate preparation only.** Before implementation, reconcile current source-of-truth and exact mutation paths, run the REQUIRED Competitive Product Gate, confirm the product/UX contract, regression boundary, tenant implications and test/hosted-acceptance plan, then return the bounded implementation gate. Do NOT start implementation automatically. |
| Product Owner input | Product Owner approved PR #118 merge, required controlled non-destructive Production verification, and explicitly directed that M1A closeout preserve the full technician mobile program and return next to the M1B governed gate. No Production data mutation, rollback or M1B implementation is authorized by this closeout. |

**Issue #106 locked pricing (CAD):** Standard Professional 79/month or 790/year; Business 149/month or 1,490/year. First 25 businesses signing up for Alpha: fixed lifetime recurring Professional 59/month or 590/year; Business 129/month or 1,290/year. Annual totals are paid upfront for 12 months. “Pay for 10 months and receive 2 months free.” Leading offer: “Save twice: lifetime Alpha pricing, plus two months FREE when you pay annually.” First saving at monthly rates: 240/year on either plan; additional Alpha annual saving: 118/258; combined savings vs 12 regular monthly payments: 358/498. Monthly Alpha alone does not include the two free months. Same product/entitlements; no checkout, assignment or runtime catalog change. Competitive gate REQUIRED, pre-build source: Issue #106 comment `5848862526`.

GVM Baby World and Chasum HQ remain normal tenants. Platform Admin / Control Centre remains a separate protected SaaS control plane at `/owner`; Chasum HQ is **not** Platform Admin.

## Permanent multi-tenant multi-location operating model

Governing architecture. GVM exposed the problem; **GVM is not the architecture.**

```
BUSINESS                → LOCATIONS
BUSINESS SERVICE CATALOG→ each Service may be offered at ONE / SOME / ALL Locations
STAFF                   → each Staff member may work at ONE / SOME / ALL Locations
STAFF ↔ SERVICE         → each Staff member may provide ONE / SOME / ALL Services
```

**Bookability at a selected Location requires all of:** Service offered there; Staff permitted to work there; Staff provides that Service; applicable hours / availability / operating rules.

- `service_locations` = offered-at operating truth. `staff_locations` = works-at operating truth. `staff_services` = provides operating truth. **Relationship tables carry operating truth.**
- Home/default Location is metadata/default behavior. It must **NOT** automatically mean "Staff can only work here."
- Primary/legacy Service Location (`services.location_id`) is metadata/compatibility state. It must **NOT** automatically mean "Service can only be offered here."
- Readiness is modelled in four states by `lib/booking/location-readiness.ts`: `no-services`, `no-staff`, `no-service-staff-overlap`, `ready`. Each names the actual missing relationship rather than showing a generic setup failure.

## Summer — AI Business Manager

Summer is the AI Business Manager / intelligence layer, maturing through:

**UNDERSTAND → EXPLAIN → RECOMMEND → ACT safely with permission → AUDIT → later AUTOMATE SAFELY → later OPERATE PROACTIVELY.**

Do not bolt an AI label onto conventional SaaS. Architect deterministic operating truth so Summer can safely operate across it.

For multi-location specifically: UNDERSTAND / EXPLAIN / RECOMMEND are now supported by explicit relationship truth and readiness states. **ACT remains constrained by the Employee assigned-location persistence gap below** — a deterministic additive write path is a prerequisite for Summer ACT on multi-location, not merely operator convenience.

## Permanent World-Class Standard

Durable Chasum acceptance lens. **Do not copy these products.**

| Reference | Quality Chasum must match |
| --- | --- |
| Apple | simplicity / clarity / polish |
| Stripe | truth / reliability / financial confidence |
| Linear | speed / hierarchy / efficient workflows |
| Notion | flexibility / adaptable business structure |
| OpenAI | intelligence |
| Framer | visual quality |
| Calendly | scheduling simplicity |
| Jane | workflow trust / usability |
| Fresha / Vagaro | operational breadth |

Standing question: **"If a mature service business sees Chasum beside its existing software, why does Chasum feel like an upgrade?"**

Hard principle: **passing tests means technically credible. It does NOT by itself mean world class.** Always ask both *"Does it work safely?"* **and** *"Would a real business prefer this experience to the mature software it already uses?"*

## Known product gap — Employee "Assigned locations" persistence

**Classification: IMPORTANT BUT POST-LAUNCH SAFE.** Recorded, not scheduled. Do not implement without authorization.

The Employee profile already contains an **"Assigned locations"** multi-select, pre-checked from current assignments. The problem is its persistence path in `lib/actions/employees.ts`:

- destructive delete-and-reinsert of `staff_locations`;
- destructive replacement behavior around `staff_services` in the same save flow;
- can write `staff.location_id`, i.e. can move home/default Location.

This creates safety and clarity risk. Genuinely additive actions exist but are unreachable for existing Staff at existing Locations: `assignStaffToLocation()` is reachable only from the Add Location dialog, and the additive path in `lib/actions/staff.ts` only runs on employee creation. The Services side is already correct — `enableServiceAtLocation()` is additive, idempotent and tenant-validated.

Likely future direction: make the existing control safely additive / explicit-remove rather than delete-all-and-reinsert; separate operating truth from home/default metadata clearly; design one deterministic write path that future bulk multi-location controls **and** Summer ACT can reuse.

## World-class UX observations to preserve

**Strength.** Chasum distinguishes `no-services`, `no-staff`, `no-service-staff-overlap` and `ready`, and explains the actual missing relationship rather than showing a generic setup failure.

**Gap.** Steady-state multi-location relationship truth is less visible once everything is configured — the model is mostly taught through empty states. The Employee profile also risks conceptual ambiguity between **Primary location**, **Default location** and **Assigned locations**; the operating/bookability truth must eventually be clearer.

These are observations, not authorized feature work.

## Major-chapter re-anchor

The World-Class / Mission / Summer / Competitive re-anchor should occur **ONCE PER MAJOR CHASUM CHAPTER** at the appropriate governing point. Do not repeatedly rerun broad strategic or competitor analysis every few hours.

Re-open the strategic review only when: new contradictory evidence appears; implementation materially diverges from the accepted contract; relevant competitive evidence is materially stale; or the Product Owner explicitly reconsiders a locked decision.

This preserves strategic consistency without creating development paralysis.

## Agent governance — current model

Do not blindly restore historical agent assignments if they are stale.

- **Darshan** — Founder / CEO / Product Owner.
- **ChatGPT** — coordinator / continuity / Product Owner decision preparation / source-of-truth reconciliation, beneath Darshan.
- **Claude** — Development Control Tower for the current mobile workflow: architecture reconciliation, risk/gate judgment and high-risk review.
- **Codex** — Primary Engineering Implementer.
- **Grok** — World-Class Product / Architecture Challenger.
- **Independent audit** — assigned separately according to risk.

One primary implementer per task. Codex remains the primary implementer; the current PO-locked assignment supersedes historical Control Tower wording. Live GitHub/repository/runtime truth remains authoritative over stale handoffs. Closed/accepted work stays closed absent contradictory evidence.

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md), then [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md), then live GitHub Issues/PRs. Current GitHub/runtime evidence wins over stale handoff text.

**Size budget:** keep this board short; move history, not decisions, elsewhere.