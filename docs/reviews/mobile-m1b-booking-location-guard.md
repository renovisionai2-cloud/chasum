# M1B — All-Locations Booking Location Guard

Status: **PRODUCTION ACCEPTED / CLOSED — Issue #120 completed; PR #122 merged.**

**M1B — All-Locations Booking Location Guard (Issue #120): PRODUCTION ACCEPTED / CLOSED / COMPLETED.** PR #122 squash-merged at `2026-09-30T00:21:41Z` as `3ac31c1a58732b8c3c4c34ef04ac19c7522565c0` (2026-09-29 Toronto). Merge tree `6d6097ad975b86e685ec161a82b742bb77e7f92b`; parent `e729dea51ad4888736d09cda705bd317dc6a1055`. Production deployment `dpl_AQDXaFxkSjJ4c2oX1CBZAjAk9jyX` is **READY / SUCCESS**, target `production`, unique URL `https://chasum-gb94c8tba-renovisionappcom.vercel.app`.

Direct Production `/api/build-info` HTTP 200: `commit=3ac31c1a58732b8c3c4c34ef04ac19c7522565c0`, `commitShort=3ac31c1`, `env=production`, `ref=main`, `production=true`. Direct `/api/health` HTTP 200: `ok=true`, `production=true`; `supabase=true`, `serviceRole=true`, `email=configured`, `cronSecret=configured`, `sms=optional_missing`, `stripe=optional_missing`, `sentry=optional_missing`, `softSchemaFallbacks=disabled`. Health proves configuration presence only, not active DB binding, provider delivery or worker execution. Public `/`, `/pricing`, `/status`, `/login`, `/book/gvm-baby-world` returned HTTP 200; `/status` rendered Operational. Merge-SHA Quality: **172 test files passed / 1 integration file skipped; 1,693 tests passed / 36 skipped / 0 failed**.

Authenticated real-GVM acceptance used existing account `gvmbabyworld@gmail.com` in the correct GVM Baby World tenant. Burlington, Brampton, Caledonia and All locations were visible. The operator deliberately switched Brampton → All locations; normal reload confirmed ALL persisted. A fresh Booking Sheet had empty Location / “Choose a location”, explicit Burlington/Brampton/Caledonia choices, Service and Employee disabled / “Choose a location first”, and Confirm appointment disabled. No customer, service, staff or time was chosen; no booking was created. The empty sheet was closed, workspace restored to **GVM Baby World Ultrasound Brampton**, and normal reload confirmed Brampton persisted, ALL no longer selected, Booking Sheet closed.

No Production tenant/database mutation, migration/schema/RLS/Auth/provider change or rollback occurred. Only operator workspace-scope cookie/UI state changed temporarily and was restored. Production DB counts were not queried for this spot-check. These are supplied accepted closeout observations; this documentation restamp performs no environment probe or action.

Historical final pre-merge Claude reconciliation verdict: **B — HOSTED ACCEPTANCE PASS WITH NON-BLOCKING LIMITATIONS / BOUNDED DOCS-ONLY CLOSEOUT AUTHORIZED. NO MERGE. NO PRODUCTION.**

## Historical pre-merge authority and candidate

This section preserves the pre-merge observation and authorization boundary; its open/draft and baseline statements are historical, superseded by Production acceptance above.

- Issue #120; branch `codex/m1b-all-locations-booking-guard`; worktree `/private/tmp/chasum-m1b-impl`.
- Exact hosted-tested runtime candidate and starting HEAD: `597a347194935617c556d2a6fa4006703d07bfcb`; tree `cc146e1657731c68c6e99c80b2079aa694ae0bc3`. Both were verified locally for this docs-only edit.
- Base/current remote main: `e729dea51ad4888736d09cda705bd317dc6a1055`, coordinator-verified in the final dispatch. This pass attempted `git ls-remote origin refs/heads/main`, but sandbox DNS could not resolve `github.com`; no independent remote re-verification is claimed.
- Draft PR #122: **OPEN / DRAFT / MERGEABLE**, per coordinator-supplied final reconciliation. Final Product Owner merge decision remains pending.
- Hosted Preview: `dpl_ByEk7WyfKqu1yHZoxvH5Eqx9oPC3`, https://chasum-94i2eshq3-renovisionappcom.vercel.app.
- Build identity pinned at both acceptance start and end: `commit=597a347194935617c556d2a6fa4006703d07bfcb`, `env=preview`, `ref=codex/m1b-all-locations-booking-guard`, `production=false`; no drift.
- Hosted results, latest governed checks and Claude's verdict below are the authoritative coordinator-supplied final record; this docs-only pass did not rerun hosted tests or query Staging/Production.
- Accepted application baseline remains M1A PR #118, `2733729ebbf65442cf55eb53b4962aa672535617`, with accepted Quality **1,665 passed / 36 skipped / 0 failed**. Serving deployment was not re-probed or mutated. Historical board/handoff gate-preparation text is superseded for this bounded task by the supplied final dispatch; accepted release history is unchanged.

Competitive Product Gate for this docs-only closeout: **NOT_APPLICABLE** — no product behavior or strategy changes; the implementation contract remains locked. The feature's latest competitive-product-gate result is SUCCESS, as recorded below.

## Exact runtime boundary

Core/behavior files:

1. `lib/booking/default-location.ts`
2. `lib/actions/appointments.ts`
3. `components/booking-sheet/booking-sheet.tsx`
4. `components/booking-sheet/appointment-section.tsx`
5. `components/reception/quick-appointment.tsx`
6. `components/crm/customer-profile.tsx`
7. `app/(dashboard)/dashboard/clients/[id]/page.tsx`

Control-Tower-restamped transport-only files:

8. `app/(dashboard)/dashboard/calendar/page.tsx`
9. `components/reception/reception-workspace.tsx`
10. `components/calendar/calendar-client.tsx`
11. `components/reception/reception-panel.tsx`

Files 8–11 only transport the required canonical scope, with type imports/required parameters where needed. CalendarClient locally derives `scope.mode === "single" ? scope.locationId : null` for its two existing consumers: readiness and BookingSheet remount key. No parallel nullable prop truth or transport-file layout, fetching, scheduling, reschedule, Next Available or waitlist redesign. The diff and scope transport tests confirm this boundary.

## Locked contract disposition

**C1–C11 complete locally; exact-commit audit and hosted acceptance reconciled under final verdict B.** A8 and A10 retain the accepted limitations recorded below. R1 corrects the contract numbering without changing behavior claims.

- **C1:** Existing `LocationScope` from `lib/location/constants.ts`, explicit required canonical discriminator/transport at each hop and at the resolver; no new scope type, optional/defaulted scope, null inference or edit to constants. Calendar → ReceptionWorkspace → CalendarClient → BookingSheet/ReceptionPanel → QuickAppointmentForm transports the canonical object. CRM uses the same type and `getLocationScope()`. Existing appointment and explicit draft Location retain precedence.
- **C2:** Submitted `location_id` is trimmed; whitespace-only input cannot pass as an explicit Location.
- **C3:** Missing-Location server guard runs after customer/service required validation and before appointment-time parsing, `createBooking` and side effects.
- **C4:** Exactly one ACTIVE Location is naturally used regardless of workspace scope. `getLocations()` already filters active rows.
- **C5:** Empty-location server discrimination: named single scope resolves its named active Location; ALL + exactly one active Location resolves that sole Location; ALL + more than one rejects with an actionable choose-Location error. No Business-default fallback; global `getActiveLocationId` behavior is unchanged.
- **C6:** Quick Appointment shows Location before Service, an empty placeholder only until choice, honest disabled Service/Employee state, no Business-wide Staff leak, explicit `canBook` eligibility/Location hint, no slot or availability request while empty, null draft before choice and explicit ID afterward. Book Another in ALL deterministically resets to explicit choice; saved preference does not preselect.
- **C7:** Booking Sheet shows a placeholder while Location is empty, preserves its existing submit guard, displays honest Service/Employee state and makes no availability request while empty; draft and saved appointment truth are preserved.
- **C8:** CRM page loads canonical scope and forwards it through CustomerProfileView to BookingSheet. Named/ALL resolution uses the same contract as Calendar.
- **C9:** Summer unchanged. **Summer bypasses `createAppointment` and is NOT guarded by M1B.** Issue #121 is separately approved/queued after M1B; it is not implemented here.
- **C10:** Latent fallback implementations in `lib/actions/booking-sheet.ts` and `lib/actions/scheduling.ts` are byte-unchanged. Focused UI tests verify they are unreachable while Location is empty.
- **C11: PASS.** `m1b-foreign-location.test.ts` exercises the real action/booking validation with a mocked database boundary; foreign-Business Location is rejected before persistence, RPC, events or revalidation. Existing Business-scoped Location read is asserted. No runtime isolation code was added. This is local regression evidence, not hosted database/RLS acceptance.

## Authorized test changes and preservation

Existing-test changes are confined to:

- **T-CAT-1:** `tests/unit/booking/default-location.test.ts` — canonical required scope and approved ALL/sole-active resolution expectations.
- **T-CAT-2:** `tests/unit/services/operator-catalog-ui.test.tsx`, `tests/unit/reception/reception-panel-stability.test.tsx` — required scope props.
- **T-CAT-3:** `tests/unit/booking/stage1b-convergence-source.test.ts` — final case only. First ten cases remain byte-identical to exact base. The final name covers explicit named inheritance, explicit multi-location ALL without silent inheritance, and authoritative appointment/draft truth. Assertions pin canonical type/required scope, page/workspace transport, both CalendarClient destinations, panel→Quick Appointment, both resolver inputs, and absence of all four retired strings. No skip/todo/only/conditional test was introduced.

The following two assertions are preserved exactly:

```ts
expect(sheet).toContain("appointmentLocationId: appointment?.location_id")
expect(sheet).toContain("draftLocationId: !appointment ? draft?.locationId : null")
```

Four new M1B files:

- `tests/unit/booking/m1b-foreign-location.test.ts`
- `tests/unit/booking/m1b-location-ui.test.tsx`
- `tests/unit/booking/m1b-scope-transport.test.tsx`
- `tests/unit/booking/m1b-server-guard.test.ts`

Five protected source-string tests remain byte-unchanged and passed together (**5 files / 25 tests / 0 failed / 0 skipped**):

- `tests/unit/booking/authenticated-create-booking-callers.test.ts`
- `tests/unit/booking/cancel-appointment-contract.test.ts`
- `tests/unit/booking/reception-reschedule-event-contract.test.ts`
- `tests/unit/communications/booking-source-label.test.ts`
- `tests/unit/booking/cancelled-terminal-contract.test.ts`

Byte comparisons and SHA-256 evidence: `/private/tmp/m1b-final-local/immutability.json`.

## Local validation — final authoritative restamp

The coordinator-supplied final validation results in the 2026-09-29 dispatch are authoritative for this docs-only pass. Runtime code and tests were not changed or rerun here; only documentation/Git integrity checks are performed here, with no commit authorized.

- **V1 lint: PASS under Claude-restamped L4**, as detailed below. All other 17 changed TS/TSX files have **0 errors / 0 warnings**, including all four new tests.
- **V2 one clean full suite from normal Mac Terminal: PASS** — **172 passed test files / 1 skipped integration test file; 1,693 passed tests / 36 skipped / 0 failed**.
- **V3 typecheck: PASS.**
- **V4 `git diff --check`: PASS**, also rechecked during finalization.
- **V5 protected tests: PASS**, all five byte-identical to exact base. Protected + C11 focused rerun: **6 files / 26 tests PASS**.
- **V6 C11: PASS** — foreign-Business `location_id` rejected before persistence/side effects; no runtime isolation code added.
- Stage-1B restamp: first ten cases byte-identical to base; final case only changed; both genuine invariant assertions above preserved exactly; canonical `LocationScope` transport and retired-nullable negative assertions added; no test weakening.

### Full-suite arithmetic and skips

Accepted baseline: **1,665 passed / 36 skipped / 0 failed**.

Four modified existing files, base → candidate:

- `stage1b-convergence-source.test.ts`: 11 → 11.
- `default-location.test.ts`: 5 → 10.
- `reception-panel-stability.test.tsx`: 5 → 5.
- `operator-catalog-ui.test.tsx`: 7 → 7.
- Total: **28 → 33 = +5**.

Four new M1B files:

- `m1b-server-guard.test.ts`: 9.
- `m1b-foreign-location.test.ts`: 1.
- `m1b-scope-transport.test.tsx`: 4.
- `m1b-location-ui.test.tsx`: 9.
- Total: **+23**.

Exact reconciliation: **+5 + +23 = +28; 1,665 + 28 = 1,693**.

Exactly **36 skipped tests**, all from `tests/integration/package-a-availability-postgres.test.ts`; no unexplained skip growth. The previously sandbox-blocked Chromium tests passed inside this clean full suite: `top-nav-containment` **2 PASS** and `customer-location-email-mobile` **1 PASS**. Earlier sandbox Mach-port failures and the separate browser-only run remain historical evidence, superseded for final suite acceptance by this clean normal-Terminal run.

### Restamped L4 — strict diagnostic-identity bijection

Historical disposition: the original strict message-frame comparison stopped on three Quick Appointment entries despite equal rule/severity counts. Claude verified the ESLint message artifact and adjudicated all three as inherited same-anchor debt. The refined L4 requires a **strict base↔candidate diagnostic-identity bijection**, preserving rule, severity, diagnostic identity/anchors and multiplicity while allowing the adjudicated requirement-driven frame differences below. Equal totals alone do not establish this gate.

Booking Sheet (`components/booking-sheet/booking-sheet.tsx`): base **2 errors / 1 warning**, candidate **2 errors / 1 warning**; **L1/L2/L3/L4 exact PASS**.

Quick Appointment (`components/reception/quick-appointment.tsx`): base **21 errors / 0 warnings**, candidate **21 errors / 0 warnings**; **L1/L2/L3 exact PASS**, restamped diagnostic-identity **L4 PASS**. Exactly three frame-differing inherited pairs, **no fourth pair**:

1. `react-hooks/preserve-manual-memoization` — first/last anchor: `[staffPool, serviceId, locationId],`; **C6(f)**. Historical frame changed from `}),` to `}) : [],` (base 262:17 → candidate 263:17).
2. `react-hooks/set-state-in-effect` — anchor: `setEligibleOverride(null);`; **C10 / C6**. Historical frame changed from `if (!serviceId) {` to `if (!serviceId || !locationId) {` (base 268:7 → candidate 269:7).
3. `react-hooks/refs` — first anchor: `bookingPhase === "draft" &&`; last anchor: `!submitGuardRef.current;`; **C6(d)**. Historical `canBook` frame gained `!!locationId &&` and its caret frame (base 526:5 → candidate 529:5).

No new diagnostic, no new rule, no increased count or severity, no lint suppression and no inherited React Compiler refactor. Aggregate inherited debt remains **23 errors / 1 warning** across the two files. All other changed TS/TSX files are clean.

Earlier local logs/comparison artifacts remain at `/private/tmp/m1b-final-local/`; they document the historical stop and must not be mistaken for the superseding coordinator-supplied final restamp.

## Governed CI and exact-candidate evidence — R3

Latest checks on `597a347194935617c556d2a6fa4006703d07bfcb`, per final reconciliation:

- **quality SUCCESS** — run `36601130940`, event `pull_request`.
- **competitive-product-gate latest SUCCESS**.
- **Vercel commit status SUCCESS**; **Vercel Preview Comments SUCCESS**.
- **exact-candidate-verification skipped ×2 — EXPECTED**, not failures. These are Issue-81 Stage1B/Stage1C verification workflows: their path filters matched, but job-level guards are pinned to `codex/issue-81-stage-1b` and `codex/issue-81-stage-1c`. M1B changes no migration/SQL/schema; `supabase/**` is unchanged.

`quality.yml` runs `npm ci`, typecheck, installs Chromium and runs `npm test`; it does **not** run `npm run build` or `npm run lint`. Vercel Preview success is deployed build proof. The exact-commit audit and restamped lint supply lint evidence, subject to the inherited-debt adjudication above. Preview build identity was pinned at start/end with no drift.

The latest competitive-gate SUCCESS followed two historical failures: first an initial PR metadata/checklist mismatch, then a correctly red gate while hosted-responsive/accessibility/workflow boxes remained unchecked. After real evidence completed, PR metadata was truthfully updated and the latest gate passed. Those PR-body metadata updates changed no code or SHA; this docs-only pass makes no PR-body update.

## Authenticated hosted acceptance

Evidence applies to the exact Preview candidate above. **A1–A7 and A9 PASS; A8 NOT EXECUTED / SEPARATELY GATED / accepted non-blocking limitation; A10 WAIVED / accepted.** No booking was confirmed.

- **A1 PASS:** Booking Sheet under ALL starts with Location empty and a choose-Location placeholder; Service/Employee and Confirm disabled; no preference/default/first-Location fallback.
- **A2 PASS:** Quick Appointment under ALL starts empty, with Location before Service and honest disabled state.
- **A3 PASS:** Explicit Main and Temp choices use Momentic Test Service; Staff options are exactly **Unassigned — assign later** and **Momentic Test Staff**, with no business-wide leak. Availability revalidated.
- **A4 PASS:** Named Temp workspace preselects Temp in fresh Booking Sheet and Quick Appointment.
- **A5 PASS:** Existing Sep 8 10:00 saved Main appointment preserves saved Location, Service, Staff, time and status under ALL.
- **A6 PASS:** Quick Appointment → full Booking Sheet preserves Temp; stale 12 PM time revalidates as unavailable and Confirm remains disabled.
- **A7 PASS:** CRM under ALL preselects the customer but leaves Location empty; named Temp preselects Temp and valid Service/Staff.
- **A8 NOT EXECUTED — accepted non-blocking limitation:** Requires a confirmed booking, which the Product Owner prohibited. Claude accepted deterministic real-component coverage plus A9's hosted proof of the underlying fresh-ALL/no-preference-reuse invariant. **No separate confirmed-booking gate is required before merge.** If a legitimate separately gated confirmed Staging appointment exists later, A8 may be observed opportunistically; backlog note only, not a PASS.
- **A9 PASS:** Main → ALL → Temp → ALL; choosing Temp in a draft under ALL leaves the workspace cookie ALL; fresh reopen starts with Location empty. Preference writes cannot leak into fresh ALL.
- **A10 WAIVED — accepted:** Real read-only Staging inventory proves Chasum HQ has exactly one active Location. No supported tenant/business switcher exists in the operator UI. Reaching HQ from the Test Studio acceptance session would require membership/session mutation outside the boundary. Deterministic sole-location coverage plus real read-only HQ inventory are accepted; no fake tenant.

A10 business-resolution correction, from `lib/actions/business.ts`: (1) owner/admin `business_members`, ordered by `created_at`, select the first `private_alpha_enabled` business; (2) otherwise the first owner/admin membership row by `created_at`; (3) otherwise `businesses.owner_id`. The earlier summary omitting `private_alpha_enabled` was incomplete.

### Responsive and accessibility/usability basics

- **390×844 PASS:** `scrollWidth/clientWidth=390/390`, no horizontal overflow; dialog fully inside viewport, `x=0 y=67.53125 w=390 h=776.46875`.
- **1024×768 PASS:** `1024/1024`; dialog `x=424 y=0 w=600 h=768`.
- **1440×900 PASS:** `1440/1440`; dialog `x=840 y=0 w=600 h=900`.

At all three viewports: one visible workspace control; ALL cookie/label; Location empty; Service/Employee disabled; Confirm disabled; Close/Confirm visible; dialog contained. **Accessibility/usability basics PASS; browser console errors 0; page errors 0.**

Evidence inventory on the local authorized Mac:

- `/private/tmp/m1b-hosted-acceptance/report.json`
- `/private/tmp/m1b-hosted-acceptance/responsive-report.json`
- A7/A9 and responsive screenshots under `/private/tmp/m1b-hosted-acceptance/`.

These are coordinator/implementer evidence artifacts, not independently accessible to Claude. Screenshots may contain incidental test-customer PII and must be reviewed before external attachment. No secrets are embedded in this record.

## Approved Staging fixture and teardown — R4

The Product Owner approved the temporary Test Studio fixture: one temporary admin membership, `starter → professional`, one canonical blank temporary Location, one settings row, seven hours, zero segments, one existing Service mapping and one existing Staff mapping. `staff_services` remained unchanged. No confirmed appointment, customer, Service, Staff, payment, invoice, communication or Auth identity was created.

Captured temporary rows were removed, `professional → starter` restored, and the original Business `updated_at` restored exactly. A separate post-teardown read-only reconciliation found zero temporary residue and the exact baseline.

**Evidence limitation:** Claude had no Staging DB credentials and did not independently verify teardown. Restoration is **coordinator/implementer-attested and logically/internally reconciled**, not independently audited by Claude.

The **M1B runtime candidate** contains no migration, SQL/schema/RLS/RPC/trigger/seed change. The hosted acceptance fixture/teardown involved approved Staging data writes. Teardown used transaction-scoped trigger suppression via `session_replication_role` only to restore the original Business `updated_at` exactly. Suppression was scoped to the teardown transaction, reverted before the database transaction committed, and follows the accepted M1A fixture-teardown precedent. No persistent schema/RLS/trigger-definition change resulted. No Production action occurred.

Final Staging reconciliation, coordinator/implementer-attested:

- **GLOBAL:** 4 businesses; 4 locations; 4 location_settings; 28 location_hours; 0 location_hour_segments; 1 business_members; 3 service_locations; 2 staff_locations; 3 staff_services; 11 appointments; 3 customers; 2 commerce_transactions; 1 commerce_invoice; 13 communication_history.
- **TEST STUDIO:** `starter`; `updated_at=2026-09-23T13:49:24.264145+00:00`; 1 Location / 1 active; 1 service_locations; 1 staff_locations; 1 staff_services; 7 appointments; 2 customers; 8 communications; temp Location residue 0; temp membership residue 0; operations→Test Studio membership residue 0.

## R2 — tracked deferral

**DESIGN / TECH-DEBT FOLLOW-UP — POST-M1B SAFE.** Issue **#123 — Tech debt — remove inert booking preferenceLocationId plumbing** tracks the cleanup. `preferenceLocationId` remains present/pass-through, but the resolver no longer reads it. Current behavior is regression-protected; A9 proves hosted preference writes cannot leak into fresh ALL. Removing it now would invalidate the exact hosted-tested runtime for zero product correctness gain. No #123 implementation is included.

## Historical pre-merge scope integrity and gate

The existing candidate comprises exactly the 11 runtime files above, four modified existing tests, four new tests, and the two documentation paths. The five protected tests remain byte-identical to base. `lib/location/constants.ts`, `lib/actions/location.ts`, `lib/actions/booking-sheet.ts` and `lib/actions/scheduling.ts` remain unchanged; global `getActiveLocationId` behavior and C10 latent fallback implementations are unchanged.

This closeout edits only `docs/reviews/mobile-m1b-booking-location-guard.md` and `docs/CHANGELOG.md` relative to runtime candidate `597a347194935617c556d2a6fa4006703d07bfcb`. No runtime, test, config, migration or `supabase/**` change. CURRENT_PROJECT_STATE, LATEST_HANDOFF, ENVIRONMENT_MANIFEST, product docs and other protected documents remain unchanged. Summer #121 and later mobile streams remain separate and untouched; Summer is **not guarded by M1B**.

**Historical pre-merge gate (superseded by Production acceptance): HOSTED ACCEPTANCE COMPLETE / PRE-MERGE DOCS-ONLY CLOSEOUT / NO MERGE / NO PRODUCTION.** PR #122 remains OPEN / DRAFT; M1B is not merged or Production accepted. This documentation restamp is the Control-Tower-authorized closeout record. After its single docs-only commit is created, E1–E5 equivalence and the required final-head checks must pass before the coordinator may return the **FINAL PRODUCT OWNER MERGE DECISION**. No hosted retest is required if that equivalence proof passes. No Staging/Production action or merge is authorized. Claude's completed final verdict is supplied evidence, not a newly running audit.

## Final accepted state and next slice

**PRODUCTION ACCEPTED / CLOSED.** Final docs-only pre-merge head `be343436e923093360351d61ccdb46e4993ab65e` has tree `6d6097ad975b86e685ec161a82b742bb77e7f92b`, identical to the squash merge. E1–E5 proved that only `docs/CHANGELOG.md` and this review changed from hosted runtime `597a347194935617c556d2a6fa4006703d07bfcb`; all pinned runtime/test/config subtrees and blobs were byte-identical. Claude’s pre-merge verdict B had no blocker. A8 remains NOT EXECUTED / accepted non-blocking limitation; A10 remains WAIVED / accepted, neither is relabeled PASS.

**Issue #121 — Summer: disclose booking Location before confirmation. PRODUCT OWNER APPROVED / PRE-BUILD COMPETITIVE PRODUCT GATE PASS / IMPLEMENTATION NOT STARTED. LAUNCH REQUIRED.** Next substantive gate is bounded display-only implementation on current main under the recorded competitive PASS: display the already-populated Location name on every Summer booking option and on successful booking confirmation.

Preflight source truth supplied for current main: `SummerBookingOption` has `locationId` and optional `locationName`; `lib/summer/tools.ts` already populates `locationName` from `knowledge.locations`; `components/summer/summer-reception-workspace.tsx` does not render it on option cards, and the confirmation banner does not separately disclose the selected option Location. Preferred architecture is UI-only using the already-selected option object; no Summer UI regression currently protects this.

Approved boundary: no orchestrator, Summer tools behavior, AI reasoning/prompt, Location-selection or booking-engine mutation-semantics change; no DB/schema/migration. Location selection under ALL remains M5 / Summer ACT-safety; Summer is not guarded by M1B. The recorded competitive principles are Jane’s explicit multi-location selection and booking/notification Location disclosure, and Fresha’s explicit Location in calendar workflow; do not copy competitors. Chasum’s advantage is deterministic Location from the exact option being submitted, never AI-generated Location prose. Launch rationale: Summer can cause a real booking mutation, so hiding the target branch before human confirmation risks multi-location operational trust.

Sequence: **M1B CLOSED → #121 → M1C → M2A → M2B → M3 → M4 → M5**. No #121 or #123 implementation is part of this restamp; M1C/M2A/M2B/M3/M4/M5 have not started. #123 — remove inert booking `preferenceLocationId` plumbing — remains **OPEN / POST-M1B SAFE / not an M1B blocker**. P2B remains paused; migrations 034–036 remain unapplied.

This post-acceptance restamp updates only the five authorized continuity Markdown files. Local HEAD/tree/parent match the supplied merge identity. Fresh remote-main verification was attempted but shell DNS could not resolve GitHub and the GitHub connector read was unavailable; remote main is supplied authority, not independently reverified here. No commit, push, merge, runtime/test/config edit, DB query or environment action is performed.
