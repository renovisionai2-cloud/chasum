# Reception #173 — local Preview build footer correction

Date: 2026-10-27. Scope: Darshan's bounded local implementation authorization.
Competitive Product Gate: NOT_APPLICABLE — correction to an explicitly locked diagnostic UI contract.

## Identity and scope

- Repository: `renovisionai2-cloud/chasum`.
- Worktree: `/Users/darshan/.codex/worktrees/reception-production-isolated-release/chasum`.
- Branch: `codex/reception-production-isolated-release`.
- Starting HEAD: `feda74b59f283ed4715d2b77b048d7367e87a286`.
- Starting tree: `677c0cf042d196461d432415b7caa5199db5bf77`.
- Starting direct parent: `2d9b78fff3abb18f675c049d1ac0f2e49d6751ad`.
- Production behavioral baseline: `664fbc734c4103d78484c6b3828849a6605a562f` (source comparison only; no Production request).
- This directory belongs to the one new local direct-child commit containing it. Obtain its immutable SHA/tree from Git; a commit cannot embed its own hash.
- Only application delta: `components/system/preview-build-badge.tsx`, Git blob `13213b0bf8873c3fe87b2a9ea13e4884a1d78031`.
- Read `source-parity.json`, `remote-identities.json`, `isolation.json` and the enclosing commit's complete changed-file list.

## Implementation

The existing dashboard mount is unchanged. A 53px normal-flow footer replaces the fixed brown z-80 overlay. It uses existing border, text and focus tokens, a 44px-high native Build details link, and no fixed/sticky/absolute positioning or z-index. A local tablet-only bottom margin (`2rem + safe-area-inset-bottom`, reset at desktop) compensates for the existing shell's tablet padding while leaving all shell/navigation source untouched. It adds no viewport-height spacer.

Display requires a successful HTTP response, JSON object, explicit `production: false`, environment `preview` or `development`, a valid 40-character Git SHA and a matching seven-character short SHA. Production, contradictory flags, absent identity, malformed JSON and network/HTTP failure render nothing. Development without an actual commit also renders nothing. The component does not guess an environment or fabricate `local`; it stores only the verified short SHA/environment and performs one read per ordinary mount. Parent rerenders neither duplicate it nor refetch. React development Strict Mode can replay mount effects as usual.

Build details is a native keyboard-accessible link to `/api/build-info`. That endpoint is byte-identical to the parent and Production: blob `ffdc68c2462cba0160eb57be6a18da39de180aaf`. Its full SHA, environment/ref fields and no-store behavior are unchanged. No personal/session/ref data is rendered by the footer, and no mutation or persistence is added.

## Validation and commands

All commands ran in the isolated worktree. No dependency/configuration installation or change. Console logs have trailing whitespace and final blank lines normalized for Git hygiene; diagnostics and results are retained.
Installed runtime: Next 16.3.6, React 19.2.4, Vitest 4.1.10, Playwright 1.61.1.
The installed Next use-client guide and established source-of-truth documents were read before implementation.

1. `npm test -- tests/unit/system/preview-build-badge.test.tsx`
   - Unchanged-parent counterfactual: 21 failed / 5 passed; `unit-before.log`.
   - Corrected final source: 26 passed; `unit-after.log`.
2. `npm test -- tests/unit/system/preview-build-badge.test.tsx tests/unit/dashboard/top-nav-containment.test.tsx tests/unit/dashboard/shell-containment.test.ts tests/unit/dashboard/mobile-workspace-scope.test.tsx tests/unit/dashboard/portal-nav.test.ts tests/unit/calendar/calendar-date-retention.test.tsx tests/unit/calendar/calendar-booking-selection.test.tsx tests/unit/calendar/reception-production-compatibility.test.tsx tests/unit/booking/booking-sheet-payment-submit.test.tsx tests/unit/ui/sheet-focus-stability.test.tsx`
   - 10 files / 126 tests passed; `focused-tests.log`. Includes the 26 badge tests, not 126 additional tests.
3. `CHASUM_BADGE_EVIDENCE=docs/validation/reception-production-isolated/preview-badge npm test -- tests/unit/dashboard/preview-build-badge-containment.test.tsx`
   - 20 local Chromium cases passed; `containment.log` and `containment-results.json`.
   - Run after a successful build for real application fonts. Evidence emission is optional; the test fixture lives entirely in the allowed new test file and reuses the unchanged accepted synthetic Calendar fixture.
4. `npm run typecheck` — exit 0; `typecheck.log`.
5. `npx eslint components/system/preview-build-badge.tsx tests/unit/system/preview-build-badge.test.tsx tests/unit/dashboard/preview-build-badge-containment.test.tsx scripts/verify-reception-isolation.mjs` — exit 0, no diagnostics; `changed-lint.log`.
6. `npm run build` — exit 0, Next production build successful; `build.log`. Existing middleware-convention deprecation warning remains.
7. `node --test tests/release-control/*.test.mjs` — 10 passed, no failures/skips; `release-tests.log`.
8. `node scripts/verify-release-control-config.mjs` — exit 0; `release-config.log`.
9. `node scripts/verify-reception-isolation.mjs` — exit 0; `isolation.json`.
10. `git diff --check` and staged diff hygiene — clean. Exact scope/ancestry/parity checks are recorded in `source-parity.json`.

No existing test assertions were changed. Repository-wide lint was not run or declared green. Historical inherited BookingSheet/shared Sheet lint remains recorded as three errors and one warning; those files are byte-identical to the accepted parent.

Development diagnostics are retained separately: `containment-initial.log`, `containment-boundary-diagnostic.log`, `containment-font-race.log`, `containment-scroll-timing.log`. The initial boundary run led to footer-local clearance. One run overlapped a build that removed test font assets; the harness now snapshots fonts before serving. Another measured before existing smooth scrolling completed; the final test uses an immediate scroll to the document end. These earlier attempts are not acceptance evidence. Final assertions remain strict: no overlap at the reachable page end, visible focus ring, readable navigation, actual link activation and no browser writes/errors/external requests.

## Responsive and accessibility evidence

Real Calendar/BookingSheet/DashboardShell components, actual application CSS and build fonts; deterministic local read fixtures; all non-loopback requests and all mutation actions rejected. Screenshots deliberately display synthetic SHA `0123456`; they are not hosted candidate-identity proof.

Both light and dark at:

| Width × height | Coverage |
| --- | --- |
| 390 × 844 | Mobile |
| 639 × 900 / 640 × 900 | Small navigation breakpoint |
| 767 × 900 / 768 × 900 | Tablet/Sheet breakpoint |
| 834 × 1112 | Tablet |
| 1023 × 900 / 1024 × 900 | Desktop navigation breakpoint |
| 1366 × 768 | Laptop |
| 1440 × 900 | Desktop |

All 20 cases: static position; auto z-index; footer after page content; 53px height; no horizontal document overflow; no diagnostic overlap with visible bottom navigation at the document end; minimum 11px clearance there; 44px link height; actual keyboard focus ring and Enter navigation to full synthetic build JSON; one component read plus one deliberate link navigation; no duplicate footer. Existing navigation remains fixed and content can naturally scroll behind it between positions.

Measured text contrast against the actual background: 9.45:1 light / 7.25:1 dark. Link: 16.92:1 light / 17.20:1 dark. These are focused contrast/keyboard checks, not a complete accessibility audit.

Canonical Booking Sheet starts closed, opens, accepts continuous Notes typing with focus intact, and closes with Escape. Tested visible Sheet controls are never covered by the diagnostic footer. No booking is submitted. Drawer opening is allowed to finish before capture and its Close control is hit-tested. The footer never covers Sign out. No real sign-out is performed.

28 PNGs: each required viewport (390, 834, 1366, 1440), each theme (light, dark), with `closed`, `footer-focused`, `booking-open`; additionally 390/834 `drawer`. File names are `<width>-<theme>-<state>.png`. Full inventory and SHA-256 hashes are in `SHA256SUMS`; it excludes only itself. Browser metrics record zero external requests, mutation attempts and page errors.

## Preserved limitations and next gate

- The inherited mobile/tablet drawer/bottom-navigation z-50 collision remains. All 14 below-desktop cases hit Primary navigation at the Sign out center. This is a separate account-access defect, not a full Sign out PASS. Account/avatar PR #128 is not integrated. Other existing floating controls are also untouched.
- Browser viewports are synthetic Chromium evidence, not physical iPhone/iPad or Safari acceptance. Darshan's previously supplied physical-iPhone acceptance for feda74b5 remains closed; this new footer has not received hosted/device acceptance.
- Prior Stage1 R1, isolation, #135 and date-retention independent audits remain accepted/closed. Calendar, CAL01, Booking Sheet, Notes, Morning Brief and Summer source remain unchanged. All 88 previously accepted isolation evidence files are byte-identical.
- Backend protected paths, Auth/tenant/RBAC, hooks, financial/booking writers, endpoint, dependencies and release controls remain unchanged. GVM CAD $50 deposit collection remains HELD.
- Fresh GitHub GETs show #173 still Draft/open/unmerged at feda74b5, with main conflicts and no Quality check on that published candidate. Main is still 80968d24dc1d87407205e54ccc949433ed39e8eb. Protected #171/#172/#164/#128 identities are in `remote-identities.json` and unchanged. This local task makes no remote mutation.
- Release controls retain exact-SHA authorization and deny-all registration (`candidates: []`); no release registration, alternative release path or Production eligibility is created.
- Next: Darshan manually dispatches Claude Opus 5 High for the new immutable commit's bounded delta audit against feda74b5. No automatic dispatch. Any later publication/protected Preview requires separate PO authorization. Future integration must preserve the audited SHA through a true merge commit and clear the independent main/Quality/release gates.

No push, PR update, merge/rebase/amend/squash, deployment, database/configuration/session change, worker activation or hosted data write was performed. The primary checkout and all other workstreams remain untouched. Local correction readiness is readiness for independent audit, not Production readiness.
