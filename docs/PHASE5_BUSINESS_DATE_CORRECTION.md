# Phase 5 operational date correction

> Current-state override (2026-09-14): the implementation below is part of accepted Production `dbbe450`; recovery is CLOSED. Older unapplied/held/pre-release statements describe their historical validation stage. See [canonical closeout](./recovery/PRODUCTION_RECOVERY_CLOSEOUT_20260914.md). This document grants no execution authority.

Current status (2026-09-11): this correction, including the final `e8565fc` carry-in query, is now incorporated into the local recovery-based `codex/integrate-phase5-recovery-timezone` candidate. See [the integration record](https://github.com/renovisionai2-cloud/chasum/blob/dbbe4502365858d4194f197b9ac22afe8d259c14/docs/PHASE5_RECOVERY_TIMEZONE_INTEGRATION.md) for combined validation and the next gate. Not independently audited, hosted-verified or Production-approved.

The sections below are the historical timezone implementation/validation record, originally on `codex/phase5-business-timezone-date-correctness` from `5bb59cb`. Their references to the next integration task, prior SELECT-only evidence and earlier test counts describe those checkpoints, not new actions or current validation. The `fd31b4f` → `5bb59cb` diff contains only CHANGELOG, CURRENT_PROJECT_STATE, DATABASE and LAUNCH_READINESS documentation.

## Contract and implementation

A public booking uses selected location timezone, then business timezone, through the existing `getBusinessTimezone` resolver. Existing legacy handling for missing/invalid timezone configuration is unchanged; no tenant-specific timezone or offsets were added. Civil dates remain YYYY-MM-DD. `lib/business/datetime.ts` now supplies civil arithmetic/labels/chips and conversion to query boundaries. UTC inside civil arithmetic is an explicit Gregorian calculation frame, not a transported booking instant. The existing IANA formatter determines the business day. Query boundaries locate the first instant of the requested local date, accounting for variable-length DST days.

The public page previously initialized date state and generated 14 chips from browser-local Date/format/addDays. Its slot selector, review and confirmation also formatted instants in the browser zone. The server now supplies a single initial instant for SSR/hydration agreement. The selected location determines the 14 chips and date minimum; changing location resets date and selection. Slot lookup receives the selected date string unchanged. Available-time clocks and morning/afternoon/evening groups use the operational timezone. Review and confirmation format the stored instant in that zone. Confirmation timezone comes from the existing tenant-scoped location lookup, with business fallback.

The chip window uses the initial page instant; a page left open across operational midnight requires refresh to advance the window. Server availability validation remains authoritative.

Booking Engine `previewAvailableSlots` forwards the date to `get_available_slots` as `p_date`. Migration 026 resolves location/business timezone and builds slots with `AT TIME ZONE`. Neither that SQL nor the engine was changed. The selected slot ISO remains the hidden `start_time` and is parsed unchanged by the accepted public write path. No persistence, financial, idempotency, or notification-orchestration changes were made.

Reception previously passed `range.start.toISOString()` from server-local midnight to `new Date(initialDate)` in the browser: `2026-09-11T00:00Z` is September 10 in Toronto. It now transports the civil date, reconstructing a local UI-only Date adapter for legacy date-fns components without serializing that adapter as an appointment instant. Today uses the resolved operational timezone. URL legacy instants are resolved in that zone; valid date-only URLs stay date-only. Invalid civil values fall back safely. Server query boundaries use the selected location from existing location scope, or business timezone for All locations. Day overlays consume that same civil day. A keyed workspace updates on URL/view/timezone changes.

## Reception continuation (2026-09-11)

The resolved operational timezone is explicitly passed through day/staff, week, month, agenda, timeline, resource/location lists, appointment cards, drawer, drop zones and now marker. Single Location uses its timezone; All Locations uses the business timezone. Civil Date adapters remain UI-only. Appointment labels and placement use IANA wall-clock components; supplied cross-midnight blocks are grouped/clipped against operational dates. The existing 15 hour rows (7:00 through 21:00) are preserved. Their exclusive axis end is now 22:00, matching positioning and resize percentages (previously 15 rows shared a 14-hour percentage denominator).

Drop targets resolve the selected civil date/hour/minute to an actual instant. Gaps and repeated local times are rejected with a message; this single-axis v1 UI does not guess which occurrence to use. Resize applies a wall-clock delta to the existing end, rejects ambiguous/nonexistent endpoints, and retains the existing minimum-duration check. Instant durations remain unchanged on moves. The availability request uses the appointment location's local date, even when the combined grid uses the business zone. A drop must match the exact requested available instant; the old nearest-slot fallback was removed. Month-to-day navigation now round-trips the selected civil date through the URL. Quick-create entry carries an operational instant instead of treating the civil adapter as one.

The 682f3e3 checkpoint closed the browser-timezone dependency in the bounded grid/interaction surfaces without changing the Booking Engine. The final closeout below now also corrects the calendar read query; mutation behavior remains unchanged.

### Final local carry-in closeout (2026-09-11)

The control tower explicitly authorized the remaining calendar read-model correction. `queryAppointmentsInRange` now selects `business_id = current business AND start_time <= endIso AND end_time > startIso`, preserving the inclusive requested end and excluding appointments ending exactly at the start. Existing location scope, relationship selection, status behavior and start_time ordering remain unchanged. This is one predicate replacement; `queryUtilizationProjection` and every mutation path are unchanged.

The prior start-only defect existed in both Phase 5 and recovery lineages. Carry-in and fully spanning appointments now reach the UI. Local regression tests execute the real read function and installed Supabase/PostgREST builder with MSW-intercepted synthetic HTTP responses; they assert emitted predicates and exercise real day-list/card rendering with returned rows. The existing visible hour window remains unchanged: an overnight appointment outside grid hours is still available in the day list; spanning grid blocks clip to the visible window.

The bounded local timezone/carry-in code P2 is closed subject to the recorded local validation. Hosted acceptance and combined-lineage validation remain outstanding. Morning Brief/statistics and broader shared Booking Sheet behavior are not newly audited by this closeout. The public chip window still needs refresh after operational midnight.

## Bounded GVM reconciliation

The continuation explicitly authorized SELECT-only Production inspection. The account lookup succeeded; memberships were empty and the primary-owner fallback selected the preserved retired shell. Its New York timezone, USD currency, staff-only/online-disabled settings, Studio location and staff matched the supplied dashboard smoke observations. Canonical GVM remains distinct, public/online-enabled, CAD, with business timezone Toronto and Main location timezone New York. No account/member/configuration data was changed. Exact authorized identity evidence is in the task report, not a Production data dump committed to Git.

`resolveBusinessForUser` is unchanged across the inspected Phase 5 and recovery tips: earliest private-alpha owner/admin membership, then earliest owner/admin membership, then primary owner_id. With no memberships, the observed shell selection is explained by ownership. The browser was not reopened; classification combines current database evidence, unchanged resolver source and supplied runtime observations.

The historical duplicate-tenant incident remains CLOSED. Its accepted disposition expressly preserved the shell. No tenant cleanup or access correction is implied or authorized.

## Verification and next gates

Focused coverage includes four separate runtime TZ processes (Toronto, Auckland, Los Angeles, UTC), fixed instants, location override/null fallback, midnight, both DST transitions, 14 consecutive chips, Auckland and fractional-offset query boundaries, real wizard slot request/review/hidden-ISO wiring, and Reception toolbar Today/jump behavior. Existing booking/RPC/040/041/orchestration suites remain required.

Next governed engineering task: prepare the combined integration candidate from the accepted recovery/Package B lineage, preserving all locked protections and these local corrections. Independent audit remains required before hosted acceptance. Local P2 closure does not establish Production readiness. At one fixed instant verify Toronto/Auckland public dates agree for the same operational location; verify location override, date chips, :30 slot/review/confirmation presentation, Reception default/Today/jump and scope changes, desktop/tablet/mobile. Existing named-staff staging regression stays within its safe harness; no mutating booking was run here. Do not infer hosted acceptance from unit tests.

Production received only the explicitly authorized SELECT queries in the continuation. No deploy, migration, booking, communication, or data mutation occurred. 034–036 remain out. 040/041 and the accepted Phase 5 persistence/financial/notification paths remain locked. P3 currency symbols, truncation, labels, soft-404 and identity cleanup are excluded.

## Initial checkpoint validation (81811bad, 2026-09-11)

- Booking/calendar: 23 files, 152 tests passed.
- Focused date/component matrix: 17 tests passed separately under each of America/Toronto, Pacific/Auckland, America/Los_Angeles and UTC.
- Full suite: 456 passed, 1 failed. The identical `multi-business-selection.test.ts:60` failure was reproduced on untouched `5bb59cb` (3 passed, 1 failed in that baseline file).
- Typecheck passed.
- Changed TypeScript scope eslint: 0 errors, 1 existing CalendarClient missing-effect-dependency warning, reproduced on baseline.
- Webpack production build (`npm run build -- --webpack`) passed with no Production credentials. Default Turbopack build could not resolve the existing dependency symlink outside the isolated worktree; the supported Webpack alternative was used. Font downloads required outside-sandbox build execution. Existing middleware deprecation / Supabase Edge compatibility warnings were not changed.
- `git diff --check` passed. No migration or Booking Engine file changed.

## Lineage and documentation handoff

This branch is not a deployable Production candidate. Base is Phase 5 `5bb59cb`, not the recovery/Package B lineage. Common ancestor with recovery `4c1f70f` is `476af17`. `fd31b4f` to `5bb59cb` and `55905a4` to `4c1f70f` have documentation-only differences; the latter retains Package B fail-closed consent fixes and worker reliability.

Seven non-document application overlaps between Phase 5 and recovery require semantic integration: `lib/actions/public-booking.ts`, `lib/communications/events/booking-bridge.ts`, `lib/communications/types.ts`, `lib/integrations/jobs/processor.ts`, `lib/integrations/notifications/orchestrator.ts`, `lib/notifications/booking-delivery.ts`, and `lib/types/booking.ts`. The timezone checkpoint overlaps recovery specifically in public-booking.ts and booking.ts. Current Reception-only code changes do not overlap recovery code.

Use a freshly verified accepted recovery/Package B tip as the future integration base (of supplied refs, `4c1f70f`). Apply/reconcile accepted Phase 5 behavior onto it, preserving durable intent identity, tenant fencing, provider outcome/reconciliation handling, manual-retry safety and consent gates. Preserve the bridge as the only public orchestration entry; recovery's old explicit public action call must not be restored. Carry Public Booking channel propagation alongside businessId/sendIntentId, then apply timezone corrections. Run the combined booking, finance, consent, worker and timezone suites before independent integration audit and hosted validation. Do not bulk-apply migrations or merge whole stale files.

Documentation classification: this dedicated document is SAFE TO PRESERVE after these corrections. The two dated checkpoint additions in CURRENT_PROJECT_STATE and LAUNCH_READINESS SHOULD BE REVERTED FROM THIS BRANCH and have been removed; their underlying older full documents MUST BE RECONCILED LATER, never selected wholesale in a conflict. No current Production recovery facts were rewritten here. Per the control-tower facts, Package B complete, Cron enabled, hold ON, webhooks OFF, N2 live and recovery overall incomplete must remain protected until independently superseded. No live operational status check was attempted.

Continuation validation results are recorded in the final task report. Both this checkpoint and 81811bad require independent review and integration; neither authorizes push, merge, hosted acceptance or Production cutover.

## Continuation validation (682f3e3)

- Booking/calendar: 24 files, 168 tests passed.
- Operational timezone matrix: 5 files, 38 tests passed in each of Toronto, Auckland, Los Angeles and UTC; includes real component rendering, drop callbacks and resize pointer handlers. These are local jsdom/process-timezone tests, not hosted browser or database mutations.
- Full suite: 472 passed, one unchanged baseline marketing failure (`multi-business-selection.test.ts:60`, previously reproduced at 5bb59cb).
- Typecheck passed. Webpack production build passed locally; no deploy or Production credentials.
- Changed-scope lint: one existing `react-hooks/set-state-in-effect` error in appointment-drawer.tsx, independently reproduced in the untouched original worktree. All other changed TypeScript files lint clean. The old CalendarClient dependency warning was resolved by including the operational date/timezone dependencies used by its listener.
- Diff whitespace checks passed. No migration, Booking Engine, communications, financial or consent implementation file changed in this continuation.

## Canonical login and configuration follow-up

One authorized Production SELECT identified the existing canonical owner's login email and confirmed its email-confirmed indicator. The minimum account result is provided in the task report, not copied into repository documentation. No login, recovery action, auth mutation or additional membership search was performed.

The earlier authenticated smoke using the retired-shell account remains useful general read-only authenticated-surface evidence. It does NOT establish canonical operational GVM dashboard state. The duplicate-tenant incident remains CLOSED; canonical GVM authenticated smoke remains outstanding before final hold-removal acceptance. No smoke was run in this closeout.

LAUNCH-REQUIRED CONFIGURATION RECONCILIATION — NOT A CODE DEFECT: prior live evidence shows canonical GVM business timezone America/Toronto and Burlington/Main location timezone America/New_York. The v1 selected-location precedence is intentional. Before eventual Production exposure, reconcile the location to the Product Owner-approved operational timezone through a separately governed change. No Production configuration mutation is authorized or performed here.

Utilization/reporting overlap semantics remain a separate question, not a dependency of this calendar correction. Do not silently apply calendar overlap rules to financial/utilization projections.

## Final local closeout validation

- Focused real-client range-query regression: 13 tests passed, including returned carry-in rows rendered by the real calendar components. The HTTP/database boundary is synthetic; this is not a live Postgres or RLS test.
- Booking/calendar suite: 25 files / 181 tests passed.
- Complete local calendar/timezone plus public-date matrix: 6 files / 51 tests passed separately in America/Toronto, Pacific/Auckland, America/Los_Angeles and UTC.
- Full suite: 485 passed / 1 unchanged baseline marketing failure.
- TypeScript and changed-scope lint passed. Existing appointment-drawer lint debt is untouched.
- Production webpack build passed locally; no deployment. Diff whitespace check passed.
- Utilization function verified byte-identical; no write/mutation function, schema, migration, tenant/location scope implementation, status filter or relationship selection changed.

Result: local timezone/carry-in P2 closed. Next is the separately governed combined integration candidate, not Production exposure. Canonical-location configuration reconciliation, canonical authenticated smoke, independent audit and hosted acceptance remain gates.
