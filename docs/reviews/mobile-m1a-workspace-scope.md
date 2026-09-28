# M1A — mobile workspace scope implementation evidence

Date: 2026-09-28. Status: **READY FOR CLAUDE AUDIT**, not merge or runtime acceptance.

Branch: `codex/m1a-mobile-workspace-scope`. Base: `ea575bb183abd5fb38cab6348494becd6b25e7e3`.

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
