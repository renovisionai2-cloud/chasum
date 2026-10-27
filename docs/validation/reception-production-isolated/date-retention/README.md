# Reception #173 selected-date retention correction

## Authority and immutable baseline

Darshan's October 26, 2026 bounded local implementation brief authorizes one direct-child commit of `2d9b78fff3abb18f675c049d1ac0f2e49d6751ad` (tree `4ba84b5b5651ab01fcaf2c6f8718f404ead9eaa2`). Branch/worktree: `codex/reception-production-isolated-release`, `/Users/darshan/.codex/worktrees/reception-production-isolated-release/chasum`. The enclosing commit supplies the final immutable HEAD/tree; it must retain that direct parent. No amend/rebase/squash, publication, PR update, deployment, data/config change or agent dispatch is authorized.

Ancestry remains Production `664fbc734c4103d78484c6b3828849a6605a562f` → isolated Reception `ab972feb946e264f2a669841efc2ab78ece35cec` → accepted #135 backport `2d9b78fff3abb18f675c049d1ac0f2e49d6751ad` → this correction. Initial worktree was clean. Read-only GitHub metadata confirms main `80968d24dc1d87407205e54ccc949433ed39e8eb`; Draft PR #173 remains at the older 2d9b78ff candidate. Protected PR #171/#172/#164 identities are unchanged in `logs/remote-identities.json`. No Production or Preview runtime/data was accessed.

Source-of-truth entry documents, the installed Next 16.3.6 useRouter guide, existing isolation/Issue #135 evidence and the accepted root-cause report were reconciled. The original Reception, isolation and #135 audits remain accepted and closed under the supplied PO instructions. Competitive Product Gate: NOT_APPLICABLE — narrowly bounded bug fix with locked expected behavior.

## Application delta

Only `components/calendar/calendar-client.tsx` changes: three added lines / 37 removed lines.

- `handleViewChange` serializes the selected `date`.
- `handleDateChange` serializes the requested `newDate`.
- Remove the now-unused client `getRange` and its six date-fns range imports.
- Preserve state setters, URL shape, router.replace with scroll:false, timezone formatting, all JSX, filters, server calculations and the workspace key.

Corrected entire-file Git blob: `5e07c8f4551775d44c3ea2966d7bb4fab0b2c076`. The isolation verifier now pins that exact blob instead of the original #171 client blob; all other exact-design/integration/control comparisons remain enforced. It additionally allowlists the two new test files. This is a narrow explicit exception, not removal of client verification or release-control relaxation.

## Real navigation and remount proof

The new component suite calls the actual CalendarPage, obtains its actual keyed ReceptionWorkspace tree, renders the real CalendarClient/Toolbar/views, invokes controls, consumes their real serialized router URL, calls CalendarPage again and lets React reconcile its returned key. DOM input identity proves changed-key remounts. Read/action boundaries are synthetic; unrelated dialogs are inert in this suite. Canonical BookingSheet integration is covered separately by the browser and existing tests.

Fixed clock `2026-10-26T12:00:00Z`; operational timezone America/Toronto. Today selects October 26. Three Day→Week→Day round trips retain `date=2026-10-26`, the Week title remains `Oct 25 – Oct 31, 2026`, and the final Day title is `Monday, Oct 26`.

Actual server getAppointments arguments:
- Day: `2026-10-26T04:00:00.000Z` through `2026-10-27T03:59:59.999Z`.
- Week/Agenda: `2026-10-25T04:00:00.000Z` through `2026-11-08T04:59:59.999Z` (existing two-week query retained).
- Month: `2026-10-01T04:00:00.000Z` through `2026-11-01T03:59:59.999Z`.

Before application editing, the new suite failed 12 navigation cases against exact 2d9b78ff and passed 10 controls (`logs/unit-before.txt`). After correction, all 22 passed. Equivalent selected-date vs Sunday/month-first server query ranges are asserted equal; CalendarPage itself is byte-identical.

## Cross-view and integration matrix

- Day→Week/Month/Agenda→Day and repeated switching: PASS.
- Advanced Timeline/Employees/Locations/Resources round trips: PASS.
- Today and explicit picker dates in Week/Month/Agenda: PASS.
- Week next/previous retains Monday; year boundary Dec 28→Jan 4: PASS.
- Month-end date-fns clamping Jan 31→Feb 28→Jan 28: PASS, intentionally not an inverse to Jan 31.
- Explicit Month day selection intentionally changes date: PASS.
- Sunday Oct 25, Dec 31/Jan 1, spring DST Mar 8, fall DST Nov 1: PASS.
- Component/server-page scenarios run under Toronto, UTC and Los Angeles process timezones; local browser timezone Los Angeles with Toronto operational settings: PASS. This is a synthetic boundary simulation, not a hosted two-process Next/browser acceptance claim.
- Week deep-link reload retains Oct 26: PASS in each browser viewport.
- Named Location survives view changes and reaches the canonical Sheet: PASS. The Location switch writes only the in-memory fixture preference.
- Slot after navigation retains Oct 26 / 12:30 Toronto (`16:30Z`) / selected staff / Location on desktop/laptop/tablet: PASS.
- Mobile date-only Add retains Oct 26/Location with no invented time or staff: PASS.
- Sheet initially closed; Escape and header Close restore selected Day/date; continuous Notes focus: PASS.
- Morning Brief warning remains visible; existing compatibility tests suppress unverified financial values: PASS.
- New navigation/browser scenarios invoke zero domain mutation actions; no booking/payment/cancellation submission, hosted request or database action.

### Filter limitation — preserved existing behavior

Service/staff selections survive opening and closing BookingSheet in the same Calendar session. Changing view remounts ReceptionWorkspace and resets these component-local filters, exactly as the starting candidate does. Both useState initializers and the workspace key are unchanged; browser evidence explicitly records the reset. Do not describe this as cross-view filter persistence. Retaining filters across keyed remounts would require a separately authorized state-ownership change; it is not part of the two-handler selected-date correction. Location scope persists independently.

## Commands and results

All commands below ran from the specified isolated worktree. No test was disabled or weakened. Node v26.7.0, Next 16.3.6, React 19.2.4, Vitest 4.1.10.

1. Baseline: `TZ=America/Toronto npm test -- tests/unit/calendar/calendar-date-retention.test.tsx` — expected RED, 12 failed / 10 passed, before application correction; `logs/unit-before.txt`.
2. Corrected new suite: same command — PASS 22/22; `logs/unit-toronto.txt`.
3. `TZ=UTC npm test -- tests/unit/calendar/calendar-date-retention.test.tsx` — PASS 22/22; `logs/unit-utc.txt`.
4. `TZ=America/Los_Angeles npm test -- tests/unit/calendar/calendar-date-retention.test.tsx` — PASS 22/22; `logs/unit-los-angeles.txt`.
5. Final focused run — PASS 16 files / 224 tests, no failures/skips; `logs/focused-final.txt`. Exact command:

    TZ=America/Toronto npm test -- tests/unit/calendar/calendar-date-retention.test.tsx tests/unit/calendar/reception-date.test.tsx tests/unit/calendar/reception-production-compatibility.test.tsx tests/unit/calendar/calendar-booking-selection.test.tsx tests/unit/calendar/operational-calendar.test.tsx tests/unit/calendar/business-date-correctness.test.ts tests/unit/calendar/date-param.test.ts tests/unit/calendar/range-query.test.tsx tests/unit/calendar/reception-origin.test.ts tests/unit/booking/booking-sheet-payment-submit.test.tsx tests/unit/ui/sheet-focus-stability.test.tsx tests/unit/reception/reception-panel-stability.test.tsx tests/unit/booking/m1b-server-guard.test.ts tests/unit/booking/m1b-foreign-location.test.ts tests/unit/auth/permissions-and-validation.test.ts tests/unit/api/appointment-tenant-integrity.test.ts

6. `npm run typecheck` — PASS; `logs/typecheck.txt`. Final build also typechecked the final TS source/tests.
7. Changed-file lint — PASS, zero errors/warnings; `logs/lint-final.txt`. Exact command:

    node_modules/.bin/eslint components/calendar/calendar-client.tsx tests/unit/calendar/calendar-date-retention.test.tsx tests/unit/calendar/isolated-browser/date-retention.mjs tests/unit/calendar/isolated-browser/run.mjs scripts/verify-reception-isolation.mjs

8. `node_modules/.bin/eslint components/booking-sheet/booking-sheet.tsx components/ui/sheet.tsx` — inherited NOT GREEN, 3 errors / 1 warning; `logs/inherited-lint.txt`. BookingSheet lines 457/796 set-state-in-effect, line748 unused _next; shared Sheet line80 set-state-in-effect. Both files are byte-identical to parent. No broad lint-green claim.
9. `NEXT_TELEMETRY_DISABLED=1 npm run build` — PASS; `logs/build.txt`. Existing middleware deprecation remains; no application changes followed this build.
10. `node scripts/verify-release-control-config.mjs` — PASS; `logs/release-config.txt`.
11. `node --test tests/release-control/*.test.mjs` — PASS 10/10; `logs/release-tests.txt`.
12. `node scripts/verify-reception-isolation.mjs` — PASS; `logs/isolation.json`.
13. `node tests/unit/calendar/isolated-browser/run.mjs docs/validation/reception-production-isolated/date-retention date-retention` — PASS, 35 transitions in each of four viewports (140 total); `logs/browser-pass.txt`, `date-retention-results.json`.
14. `git diff --check` and `git diff --cached --check` — PASS during final staging/commit verification.

New text logs have terminal trailing whitespace/line endings normalized for Git diff hygiene; test outcomes and diagnostics are retained. Earlier local harness attempts are retained as diagnostic logs. Initial geometry sampled entrance animation; the next compared viewport Y after browser auto-scroll. The final scenario awaits fonts/finite animations and compares document coordinates without relaxing the tolerance. A duplicate accessible Close name was resolved by selecting the actual header aria-label. Two unused test mock parameters were removed for clean lint. These were test-harness corrections; application scope stayed unchanged. Historical accepted tests, screenshots and logs were never edited.

## Responsive evidence

12 PNGs, real application CSS/fonts and synthetic data:
- desktop 1440×900: desktop-week.png, desktop-day-closed.png, desktop-day-open.png.
- laptop 1366×768: laptop-week.png, laptop-day-closed.png, laptop-day-open.png.
- tablet 834×1112: tablet-week.png, tablet-day-closed.png, tablet-day-open.png.
- mobile 390×844: mobile-week.png, mobile-day-closed.png, mobile-day-open.png.

All four passed: controls visible, stable document positioning after settled navigation, no page-wide horizontal overflow, Sheet closed by default, open/close preserved, zero page errors, zero unapproved action attempts and zero non-loopback requests. Mobile Week keeps its existing internal horizontal scrolling. Images were visually inspected for Day closed/open at all four widths and Week at tablet/mobile; this does not reopen the historical full visual audit.

This is Chromium emulation. Physical iPhone/iPad/Safari and exact-candidate hosted Preview retesting are NOT RUN and require a later separately authorized gate.

## Safety, source parity and next gate

`logs/source-parity.json` proves exactly one changed application file, eight critical byte-identical component/server files, all 52 previously tracked validation files unchanged, Production-equivalent backend/financial/Auth/DB paths, and unchanged release controls. BookingSheet/#135 Git blob remains `eddeb96020f74598c20c63ce6db3c5e48766f13f`. Morning Brief still withholds unverified amounts and reads no canonical financial subsystem. No unrelated N01/N02/N06/N07/N08/T01–T12 or financial proof work is mixed into this delta. GVM CAD $50 deposit collection remains HELD.

Verdict: A — RECEPTION_DATE_RETENTION_CORRECTION_READY_FOR_AUDIT. This is local focused-delta audit readiness, not hosted acceptance or release readiness. Existing cross-view filter reset is explicitly preserved, not fixed.

Darshan/Program Lead reconcile this report, then separately authorize/manual-dispatch an independent Claude Opus 5 High delta audit of the enclosing commit against direct parent 2d9b78ff. No automatic dispatch. Later GitHub publication/PR update, protected Preview/device acceptance, true-merge integration retaining the exact audited SHA, candidate registration and Production deployment each require separate authorization. The candidate remains non-main-reachable and release policy deny-all. Existing #173 main conflicts and missing hosted Quality are separate unresolved release issues, not repaired here.
