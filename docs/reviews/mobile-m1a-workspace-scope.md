# M1A — mobile workspace scope implementation evidence

Date: 2026-09-28. Current continuation status: **VALIDATED / LOCAL PACKAGING AUTHORIZED**. Original implementation evidence below remains historical, not correction acceptance.

Branch: `codex/m1a-mobile-workspace-scope`. Base: `ea575bb183abd5fb38cab6348494becd6b25e7e3`.

## Bounded containment continuation — 2026-09-28

Frozen starting HEAD: `3ac87e68130d0264b6c6f18f92e4a9f7e8b47096`; same branch retained. Fresh GitHub connector read of `main` returned `ea575bb183abd5fb38cab6348494becd6b25e7e3`. Accepted application baseline and serving deployment records were not changed or re-queried.

PO-supplied evidence supersedes the earlier broad local responsive claim: authenticated Preview proved 640–646px overflow, and a live pre-M1A-class simulation reproduced it. This continuation does not repeat that investigation. Competitive Product Gate: **NOT_APPLICABLE**, narrowly bounded correction of an established layout defect with locked product behavior.

The only runtime edit is `UserBadge` account label/email visibility in `sidebar.tsx`: `sm:block` → `md:block`. This retains the existing compact badge through 767px and restores the existing expanded identity at 768px. Location context, Request plan change, notifications, theme, and existing Account & billing navigation are unchanged. All phone classes, scope actions, Sheet lifecycle, Reception, booking code, dependencies and configuration remain unchanged.

The new `tests/unit/dashboard/top-nav-containment.test.tsx` is included without further modification. It renders the actual header with compiled application CSS in Chromium, checks both quota branches, and retains all requested widths: **375, 390, 430, 639, 640, 641, 642, 643, 644, 645, 646, 647, 767, 768, 820, 1024, 1366, 1440**. It checks zero overflow, 64px height, exactly one visible selector, unobstructed controls at 640–767px, plan/add-location visibility at ≥640px, notifications and theme visibility.

Authoritative external validation, supplied by the Product Owner on 2026-09-28, ran outside the Codex sandbox on this same corrected working tree. It supersedes the prior browser-validation blocker and incomplete full-suite result:

- **Corrected worktree PASS:** `npm test -- tests/unit/dashboard/top-nav-containment.test.tsx` — one file, two tests passed, exit 0.
- **Old frozen HEAD FAILS as intended:** a detached worktree at `3ac87e68130d0264b6c6f18f92e4a9f7e8b47096` received ONLY the new test file. The `canAdd=false` case failed with `640px overflow: expected 64 to be 0`; one test failed and one passed. This proves the regression test distinguishes the old broken behavior from the correction.
- **Full suite PASS:** `npm test` — 168 files passed, one skipped (169); **1,665 tests passed, 36 skipped (1,701), zero failures**. React act, Supabase multi-client and localStorage experimental warnings were pre-existing/non-blocking; no candidate-related failure remained.
- **PASS:** `npm run typecheck`; `npx eslint components/dashboard/sidebar.tsx tests/unit/dashboard/top-nav-containment.test.tsx` (clean output); `git diff --check`.

Final Codex rerun, recorded separately from that external evidence:

- `npm test -- tests/unit/dashboard/top-nav-containment.test.tsx tests/unit/dashboard/mobile-workspace-scope.test.tsx` — exit 1 in the sandbox: mobile workspace scope **12 passed**; containment browser setup failed with macOS `bootstrap_check_in ... Permission denied (1100)` before assertions, reporting two skipped tests and one failed file. This is a local execution limitation, not a reversal of the authoritative external containment PASS. Log: `/private/tmp/chasum-m1a-final-focused.log`.
- `npm run typecheck` — **PASS**, exit 0. Changed-file ESLint for the two files above — **PASS**, exit 0, clean output. `git diff --check` — **PASS**.
- Build and hosted CI were not rerun for this correction. No runtime or test changes were made during finalization.

**Hosted acceptance remains PENDING for the NEW corrected exact candidate.** External Chromium geometry validation is not authenticated hosted Preview acceptance, cross-route persistence proof, or interactive workflow acceptance. The earlier Preview defect finding is not corrected-candidate acceptance. No push, merge, deployment, Staging/Production mutation or M1B work. No database, migration, booking, dependency or configuration change. The environment manifest remains unchanged because no serving environment/configuration changed.

**Prior sandbox commit attempt (historical):** `git add` failed before staging or committing: Git could not create `/Users/darshan/chasum/.git/worktrees/chasum-m1a/index.lock` (`Operation not permitted`). The worktree Git metadata was outside that sandbox's writable roots; that attempt created no commit or tree. The Product Owner subsequently authorized local packaging of exactly the five bounded files on the same branch, with message `fix: contain tablet transition header`, without pushing. The packaging report records the resulting commit, tree, exact parent and clean-worktree verification. Validation evidence above is preserved; re-audit and hosted acceptance remain pending.

Next gate: Claude narrow re-audit of the exact local correction commit, followed by separately authorized hosted acceptance of that exact candidate. Claude re-audit is **PLANNED**, not dispatched or running; no execution evidence exists. This finalization authorizes a local commit only; do not push, merge, deploy, begin M1B or reopen the broad mobile investigation.

## Implementation boundary

`components/dashboard/mobile-workspace-scope.tsx` adds a phone-only scope indicator and selector to `DashboardTopNav`. The current server-provided `LocationScope` is the selected value. No optimistic location store, browser storage, alternate cookie, or booking event is introduced.

Multiple active locations expose a 44px-minimum trigger and 48px-minimum choices including All locations. One active location renders static context without plan/add-location actions. Long names truncate in the header and wrap in the sheet. The existing Sheet is portalled to `document.body` to escape the header's backdrop-filter containing block; its z-index 60 is above bottom navigation at 50. Escape/current selection restores trigger focus. Resizing to 640px or greater closes the phone sheet and releases body scrolling.

Selection calls existing `setLocationScope()` and `router.refresh()` without push/replace. The unchanged setter verifies location ownership against the authenticated business, writes `chasum_location_scope` (HTTP-only, path `/`, UUID or `ALL`), and revalidates the dashboard layout. Unit tests exercise this actual setter with mocked infrastructure, including foreign-location rejection and ALL round-trip.

Only `sidebar.tsx` changes existing runtime code. Its spacing changes are below `sm`; the header remains 64px. `location-switcher.tsx`, `shell.tsx`, `mobile-bottom-nav.tsx`, `nav.ts`, `lib/actions/location.ts` and all booking code remain unchanged. The bottom nav stays Centre | Reception | Customers | Payments | More. No tenant-specific branches or data identifiers.

## Verification

- Focused UI + required dashboard/Reception unit files: 47 passed across five files.
- Additional actual canonical-setter contract: 3 passed (tenant-scoped lookup, cookie/options/revalidation, rejection, ALL parser round-trip).
- Full suite before the additional three tests: 166 files passed, one skipped; 1,660 tests passed, 36 optional database tests skipped. No failing test remained after permitting local Chromium launch.
- Typecheck and changed-file ESLint passed. `git diff --check` passed.
- Required `e2e/reception-panel-viewport.spec.ts`: all five tests passed. This existing test uses synthetic geometry, not hosted authentication.
- `next build --webpack`: passed. Default `npm run build` could not complete because Turbopack's CSS subprocess was denied a local port even on retry; the initial sandboxed attempt also could not fetch Google Fonts. No source/configuration was changed to conceal this limitation.
- Local runtime used Node 26.7; hosted CI uses Node 22 and was not run in this delivery.

## Responsive evidence and limits

A disposable local Vite fixture imports the actual DashboardShell, TopNav, both scope controls, Sheet, MobileSidebar, bottom navigation, ThemeProvider and application CSS. Next routing/server transport and CommandPalette are stubbed; operational page bodies are representative placeholders. The fixture has no hosted connection or credentials. Its local-only HTTP-only scope cookie simulates refresh/navigation transport; it is not proof of a hosted Next Server Action session.

Widths: **375, 390, 430, 640, 767, 820, 1024, 1366, 1440**. Thirty-six shell checks across Centre, Reception, Customers and Payments found no horizontal overflow, a 64px header, and exactly one visible scope control. Phone trigger widths were 137/152/192px with height 44px at 375/390/430px. Long location names remained contained.

Local interaction checks passed:

- Named location and All locations each persisted through Centre → Reception → Customers → Payments → Centre.
- `/dashboard/calendar?view=month&date=2026-09-28` remained unchanged while switching scope.
- Tablet and desktop native selectors remained usable; mobile selector was absent there.
- Single-location phone context had no switcher or All locations choice.
- More opened the unchanged sidebar. The scope sheet was outside the header, above bottom navigation, and Shift+Tab wrapped from Close to the last choice. Tablet resize dismissed it.

Ephemeral evidence: `/private/tmp/chasum-m1a-ui/evidence/` (measurements, surface results and screenshots). These local artifacts are not durable hosted acceptance evidence. The signed-in Production tab was not inspected or used; a broad browser inventory was rejected by automatic review and replaced with an explicitly isolated localhost tab.

## Independent review / next gate

Review the feature branch before merge. Authenticated branch-Preview validation remains **PENDING**: repeat the approved named/ALL navigation sequence and Reception query check against representative single/multi-location accounts, without hosted data mutation. No Preview was provisioned or authenticated for this local implementation delivery. Standard Turbopack/Node 22 CI should also be confirmed before release acceptance.

No database, migrations, RLS, relationship tables, booking engine, availability, billing, entitlements, auth architecture, account behavior or hosted environment configuration changed. Issue #102 / Stage 1B / Stage 1C remain locked. M1B, M1C and later mobile work are not implemented. The product direction relies on the explicitly approved M1A preflight; this task does not introduce a new product strategy.
