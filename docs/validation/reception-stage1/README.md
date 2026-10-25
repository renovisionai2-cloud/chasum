# Reception Stage 1 review evidence

## R1 correction after independent audit

Claude's audit of `facddb9f143fde86d033183ea6dee2cdf2196bf1` required visible payment/notes indicators on short cards. The bounded correction and dense-schedule evidence are in [R1 evidence](r1/README.md). All 23 original screenshots below remain byte-for-byte unchanged and describe that audited candidate. The original full-suite result below is historical; R1 runs focused regressions and awaits independent delta review.

This candidate makes Reception calendar-first using Darshan's October 25, 2026 implementation authorization and four approved visual references. It is ready for a manually dispatched independent Claude review after the Draft PR is available. Merge, hosted acceptance and Production release remain separate gates.

The base is `80968d24dc1d87407205e54ccc949433ed39e8eb`, tree `e1f5d0f1bedfc5f6143e6a31f7989a7ea467dae3`. The older primary checkout was preserved. The design archive SHA-256 is `57f50cffa682fb55192f4775c5a42081ad90d1d4f680f66655f379ee5249e399`.

## Product changes

Reception starts with the Calendar and a compact toolbar. The existing closed-by-default behavior remains. All eight calendar views are available through a labelled native select; date jump, service/staff display filters, color legend and secondary actions use disclosure. The Reception tools trigger shares the toolbar so its closed state no longer reserves a separate column.

Morning Brief follows the Calendar and is collapsed initially. Its summary retains pending confirmations, no-shows, waiting customers and held/unverified payment warnings. The original detail content and financial values remain intact. Summer has a visible link in the Reception heading.

Day columns have a 224px minimum and scroll inside the calendar. Staff headings remain visible while scrolling. An empty Unassigned column no longer occupies space; appointments without assigned staff still receive that column. Appointment cards use restrained fills, readable identity/time/duration and text status. Hover/focus expands dense cards without shortening long appointments or masking resize previews; the visible chevron and existing appointment details action expose full information on touch. Mobile agenda cards show staff, end time, duration and text status.

The canonical Booking Sheet, its 600px standard/820px wide presets, remembered resizing, payment form and N03 focus effect are unchanged. Calendar slot/date-only creation, appointment details, CAL01 draft retention and canonical Location scope remain intact. The mockup's three-step form was not introduced. The existing shared navigation and official brand assets are retained.

## Validation

- Exact lockfile installed offline; Next.js 16.3.6.
- Full Vitest suite: 204 files passed, 1 skipped; 2,214 tests passed, 36 existing skips, zero failures.
- Focused Calendar/Booking/Reception/Sheet suite: 54 files, 424 tests passed before the final broader suite.
- Standalone TypeScript, targeted ESLint, production build and diff whitespace checks passed.
- Existing release-control configuration verification and all 10 release-control tests passed; no release was initiated.
- Existing CAL01 browser harness: desktop/tablet/phone PASS, including real retained Quick Appointment form, hidden/inert focus, Month keyboard/touch, date-only creation and named/All Location booking behavior.
- Stage 1 browser harness: four viewport classes; exact Day slot time/staff/Location, mobile date-only time, all view modes, date navigation, service/staff display filters and reset, existing appointment details, Notes caret/focus, standard/wide Sheet width, body scroll restoration, named → All → South → North Location switching, explicit unresolved All-Location booking, Reception close focus, five-item mobile navigation, dark mode, sticky staff headings and long-card hover/resize geometry.
- Every browser context blocks non-loopback requests and rejects unapproved server actions. Results report zero page errors, zero attempted writes and no document horizontal overflow.

## Screenshot matrix

These are local Chromium renders of the actual Reception page, dashboard shell, Calendar, Booking Sheet, global styles and fonts from the successful Next build. Server boundaries use identical synthetic data. They are not hosted or physical-device evidence.

| Viewport | Before closed | Before open | After closed | After open |
| --- | --- | --- | --- | --- |
| Desktop 1440 × 900 | [Image](before-desktop-closed.png) | [Image](before-desktop-open.png) | [Image](after-desktop-closed.png) | [Image](after-desktop-open.png) |
| Laptop 1366 × 768 | [Image](before-laptop-closed.png) | [Image](before-laptop-open.png) | [Image](after-laptop-closed.png) | [Image](after-laptop-open.png) |
| Tablet 834 × 1112 | [Image](before-tablet-closed.png) | [Image](before-tablet-open.png) | [Image](after-tablet-closed.png) | [Image](after-tablet-open.png) |
| iPhone viewport 390 × 844 | [Image](before-iphone-closed.png) | [Image](before-iphone-open.png) | [Image](after-iphone-closed.png) | [Image](after-iphone-open.png) |

Additional evidence includes four dark-mode screenshots and three calendar detail crops. `manifest.json` records screenshot hashes, source hashes, dependency versions and the exact baseline.

## Reproduction

From the candidate checkout:

```sh
npm ci
npm run build
node tests/unit/calendar/stage1-browser/run.mjs /private/tmp/reception-stage1-review after
node tests/unit/calendar/browser/run.mjs /private/tmp/reception-cal01-review
```

For baseline capture, export the exact base with `git archive`, copy only `tests/unit/calendar/stage1-browser/` from the candidate into that export, and use the same locked dependencies. Run the Stage 1 harness there with phase `before` and `CHASUM_STAGE1_FONT_BUILD` set to the candidate's absolute `.next/static` directory. Application layout/font source is unchanged. The harness requires actual build fonts and fails if they are unavailable.

The harness simulates Next navigation and server reads in memory. Its read-only data adapters and synthetic Location selection do not exercise cookies, authentication or hosted database access. Existing server and Location contracts are covered separately by repository tests.

## Limits and review gate

The mockup's desktop split form is reconciled with the approved canonical overlay Sheet. Real booking controls retain comfortable widths and internal scrolling. The Calendar displays fewer hours simultaneously than a static mockup to preserve readable cards. Dense/overlapping or long-text cards use expansion and existing details; the grid remains scrollable. Shared sidebar/header navigation is preserved instead of redesigning other dashboard pages.

Week/Month view switching retains the existing range-start normalization. That is distinct from preserving date/view/Location when closing a booking sheet.

Physical iPhone/iPad, hosted authenticated workflow, real booking persistence, provider delivery and financial acceptance are NOT RUN. Actual Momentic execution is NOT RUN; equivalent local browser workflow evidence is supplied. No Production, database, tenant, payment/ledger, booking-engine, Auth/RLS, Vercel or Supabase configuration changes occurred. GVM technician deposits remain HELD.

Darshan manually dispatches Claude Opus 5 High to review the exact Draft PR. No automatic specialist dispatch, merge, deployment or promotion is authorized.
