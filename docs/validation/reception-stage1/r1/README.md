# Reception Stage 1 — R1 correction

R1 corrects the operator-visibility finding from Claude's independent audit of PR #171 at `facddb9f143fde86d033183ea6dee2cdf2196bf1` (tree `ec21adcfb961e60fc75b7e01337e15cd7a137001`). Darshan authorized one bounded correction on the existing branch, with no merge or release. The canonical Sheet, service-name disclosure policy and all 23 original screenshots are preserved.

## Correction and reproduced evidence

The card's unchanged `paymentDue` and `hasNotes` conditions now supply “Payment due” and “Has notes” to its accessible name and title, without including note contents. A compact Due badge and Notes icon occupy the first visible row. Short cards retain textual status beside their time/duration, with reduced vertical padding; no time-position, height, drag or resize calculation changed.

The dense fixture also exposed the sticky time rail sliding away at the far-right columns. A one-line Day grid container correction (`w-max min-w-full`) gives the sticky rail the full staff-grid width as its containing block. This remains a presentation change; the 224px staff minimum and internal scrolling are preserved.

The audited source was exported with `git archive`; only the current synthetic harness was copied into that export. Its application sources were verified against the audited Git blobs. The same fixture on that source reproduces clipped Due/Notes flags and the escaping time rail. The corrected source passes both checks.

| Case | Duration | Height before / after | Original indicators | Corrected indicators |
| --- | --- | --- | --- | --- |
| Long-name overlapping card | 5 minutes | 40px / 40px | Due and Note clipped | Due and Notes visible |
| Payment only | 15 minutes | 40px / 40px | Due clipped | Due visible |
| Notes only | 30 minutes | 42.5px / 42.5px | Note clipped | Notes visible |
| Both flags, ordinary card | 5 minutes | 40px / 40px | Both clipped | Both visible |

All four cards also retain identical percentage top/height values. The 40px minimum is existing behavior, not an R1 duration expansion. Full long names and complete times/status remain available through the accessible name, title and existing details; narrow overlapping cards cannot display all text simultaneously at rest.

Example accessible name:

> Alexandria Montgomery-Wellington, Consultation, 9:00 AM to 9:05 AM, 5 minutes, confirmed, Payment due, Has notes. Open appointment details

No private note content appears in the name or title. Completed/cancelled/zero-price/unknown-price/paid cases do not gain false payment warnings.

## Focused screenshots

| Evidence | Screenshot |
| --- | --- |
| Audited source, tablet touch fixture | [Before](r1-before-tablet-touch.png) |
| Corrected tablet, light, no hover/focus | [After light](r1-tablet-touch-light.png) |
| Corrected tablet, dark | [After dark](r1-tablet-touch-dark.png) |
| Corrected laptop, far-right staff columns | [Horizontal scroll](r1-laptop-scrolled.png) |

These four additional images use local Chromium and in-memory synthetic data. The dense fixture contains 10 staff and 31 appointments. The grid has a 2320px scroll width: 1276px horizontal travel on laptop and 1536px on tablet, with no document-level horizontal overflow. Staff headings and the time rail remain visible. Both overlapping appointments open the correct existing details through keyboard and touch.

`r1-dense-before.json` and `r1-dense-after.json` include indicator clipping/hit-test results, accessible names, geometry, hover/focus state and scroll checks. The tablet reports `(hover: none)`. `r1-results.json` records the existing Stage 1 workflow regressions across all four viewport classes. Every context rejects unapproved server actions and blocks non-loopback traffic; all results show zero page errors and zero attempted writes.

## Validation

- Focused Vitest: 14 files / 129 tests PASS, including nine new indicator/action cases, CAL01 selection/navigation, display filters, Location transport, Booking Notes focus and Reception containment.
- Stage 1 browser regressions: desktop, laptop, tablet and iPhone PASS, including slot context, Location switching, Notes caret, Sheet widths, body scroll and long-card resize geometry.
- Dense browser correction: laptop mouse/keyboard and tablet touch/no-hover PASS, light/dark screenshots inspected.
- Audited-source reproduction: expected clipped flags and time-rail failure reproduced; ordinary original screenshots preserved.
- Final targeted ESLint, standalone TypeScript, production build and diff checks PASS.
- Full local suite and historical database proofs were not rerun. The original full-suite result belongs to the audited candidate; GitHub Quality may run the broader suite automatically.

Existing middleware deprecation and Node localStorage warnings remain unchanged. Evidence logs have ANSI formatting and trailing whitespace normalized.

## R2 — expected skips

Both Issue #81 workflows use the job `exact-candidate-verification`, gated respectively on `github.head_ref == 'codex/issue-81-stage-1b'` and `github.head_ref == 'codex/issue-81-stage-1c'`. PR #171 uses `codex/reception-stage1-calendar-first`, so both skips are expected and unrelated. They are SKIPPED, not passed; neither workflow was changed or manually rerun.

## Reproduction and remaining gate

After installing the locked dependencies and building, run `node tests/unit/calendar/stage1-browser/run.mjs /private/tmp/reception-r1-review r1`. It executes dense validation and existing Stage 1 browser regressions without replacing the original screenshots. To reproduce the audited source, export the audited commit, copy only the current Stage 1 harness, use the same dependencies, set `CHASUM_STAGE1_FONT_BUILD` to the candidate's absolute `.next/static` directory and run with phase `r1-before`.

The R1 manifest hashes corrected source and new evidence, links the audited commit and verifies preservation of all 23 original images. The parent manifest's original source hashes are explicitly tied to the audited commit.

Physical-device, hosted authenticated/persistent booking, provider and financial acceptance are NOT RUN. This correction does not authorize merge, manual deployment, promotion or Production. No booking-engine, financial calculation/writer, tenant/Auth/RLS, database, canonical Sheet, shared Sheet, release-control or hosted configuration changes occurred. The technician deposit hold remains in place. Stop for Darshan's manually dispatched independent delta audit; no automatic Claude dispatch.
