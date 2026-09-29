# M1B — All-Locations Booking Location Guard

Status: **IMPLEMENTED / LOCAL VALIDATION COMPLETE / PENDING CLAUDE AUDIT + HOSTED ACCEPTANCE**

Local completion disposition: **COMPLETE**, 2026-09-29. Historical stop: strict lint L4 message-frame mismatch; Claude subsequently verified the ESLint message artifact and restamped the three diagnostics as inherited same-anchor debt. This is implementation evidence, not M1B acceptance, merge, hosted acceptance or Production acceptance.

## Authority and candidate

- Issue #120; branch `codex/m1b-all-locations-booking-guard`; worktree `/private/tmp/chasum-m1b-impl`.
- Exact base and verified pre-commit HEAD: `e729dea51ad4888736d09cda705bd317dc6a1055`. Final docs/commit/push pass is authorized against this base. Prior M1B edits were preserved; this pass changed no runtime or test file. The resulting commit identity and push outcome belong to the final delivery report.
- Latest supplied Claude Control-Tower verdict: **A — L-4 REFINED / CURRENT IMPLEMENTATION MAY PROCEED**. The earlier minimum-boundary restamp authorized the 11 runtime files below, including the four scope-transport files omitted from the original seven-file boundary. No strategy, Competitive Product Gate, C1–C11 or M1A reopening occurred.
- Fresh remote-main verification was attempted with `git ls-remote origin refs/heads/main`, but sandbox DNS could not resolve `github.com`. Remote main is therefore UNKNOWN for this pass; the exact local base/HEAD was verified. No reset or baseline acceptance was inferred.
- Accepted application baseline remains M1A PR #118, `2733729ebbf65442cf55eb53b4962aa672535617`, with accepted Quality **1,665 passed / 36 skipped / 0 failed**. Serving deployment was not re-probed or mutated. Historical board/handoff gate-preparation text is superseded for this local task by the supplied narrow dispatch; accepted release history is unchanged.

Competitive Product Gate for this docs-only finalization: **NOT_APPLICABLE** — no product behavior or strategy is being changed; the supplied implementation contract remains locked.

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

**C1–C11 complete locally.** Independent exact-commit audit and hosted acceptance remain pending.

- **C1:** Existing `LocationScope` from `lib/location/constants.ts`, required at each hop and at the resolver; no new scope type, optional/defaulted scope, null inference or edit to constants. Calendar → ReceptionWorkspace → CalendarClient → BookingSheet/ReceptionPanel → QuickAppointmentForm transports the canonical object. CRM uses the same type and `getLocationScope()`. Existing appointment and explicit draft Location retain precedence.
- **C2:** Submitted `location_id` is trimmed.
- **C3:** Missing-Location server guard runs after customer/service required validation and before appointment-time parsing, `createBooking` and side effects.
- **C4/C5:** Empty submission resolves the sole active Location, or the named workspace Location. Multi-location ALL requires an explicit choice and cannot consume preference/Business-default fallback. `getLocations()` already filters active rows. Global `getActiveLocationId` behavior is unchanged.
- **C6:** Quick Appointment shows Location before Service, an empty placeholder only until choice, honest disabled Service/Employee state, no Business-wide Staff leak, explicit Location booking eligibility/hint, null draft before choice and explicit ID afterward. Book Another in ALL returns to explicit choice; saved preference does not preselect.
- **C7:** Booking Sheet supports empty Location, preserves its existing submit guard, displays honest Service/Employee state and makes no availability request while empty.
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

The coordinator-supplied final validation results in the 2026-09-29 dispatch are authoritative for this docs-only pass. Runtime code and tests were not changed or rerun here; final Git integrity checks are performed before commit.

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

## Scope integrity and next gate

Final scope: exactly the 11 runtime files above, four modified existing tests, four new tests, and only `docs/reviews/mobile-m1b-booking-location-guard.md` plus `docs/CHANGELOG.md`. The five protected tests remain byte-identical to base. `lib/location/constants.ts`, `lib/actions/location.ts`, `lib/actions/booking-sheet.ts` and `lib/actions/scheduling.ts` remain unchanged; global `getActiveLocationId` behavior and C10 latent fallback implementations are unchanged.

No Staging/Production mutation, real booking, migration, SQL, schema, RLS, trigger, RPC or seed change; no `supabase/**` change. Summer #121 remains separate and untouched, and Summer is **not guarded by M1B**. CURRENT_PROJECT_STATE, LATEST_HANDOFF, ENVIRONMENT_MANIFEST and product docs remain unchanged; M1B is not accepted, merged or Production accepted.

Next gate: **independent Claude audit of the exact pushed commit**, then hosted Preview/Staging acceptance **only if cleared**. No external agent was dispatched in this pass; Claude audit is pending, not running. No merge, PR creation/advancement, deployment or later mobile-program work is authorized by this pass. If push is blocked by DNS/network, retain the local commit and stop for coordinator transport through the governed GitHub channel.
