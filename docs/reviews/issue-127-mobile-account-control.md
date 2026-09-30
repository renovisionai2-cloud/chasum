# Issue #127 — M1C Mobile Account Control

**2026-09-30 — IMPLEMENTATION CANDIDATE / NO MERGE / NO PRODUCTION.**
Bounded implementation and zero-write local browser acceptance complete. Hosted Preview acceptance remains pending. This is not release acceptance.

## Authority and baseline

- Worktree: `/private/tmp/chasum-127-impl`.
- Branch: `codex/issue-127-mobile-account-control`.
- Exact base and unchanged HEAD: `b2ee664a2e2125473450254f79af39563cf18471`.
- Fresh GitHub `main` read at implementation entry returned that same SHA; initial worktree was clean.
- Product Owner explicitly authorized implementation under the prepared governed contract in the current dispatch. That authorization supersedes the earlier preparation-only wording in the issue and continuity documents; those documents are intentionally not restamped.
- [Issue #127](https://github.com/renovisionai2-cloud/chasum/issues/127) was read directly: Competitive Product Gate **PASS**, classification **LAUNCH REQUIRED**. Prepared evidence covers Jane, Fresha and Vagaro; no new product strategy or competitor research was undertaken.
- Parity floor: persistent interactive account access, exact signed-in identity and easy Sign out. Deliberate Chasum advantage: reuse the existing workspace identity and canonical server action without a parallel account system or Location side effect. The candidate implements this contract; hosted workflow acceptance remains pending.
- Accepted application baseline remains #121 `e8c307df07107736395f1b3b1f2d56bba3fec6be` per continuity records. Current main is a subsequent documentation commit; no serving deployment was probed or inferred from main.

## Exact five-file boundary

1. `components/dashboard/sidebar.tsx` — sole runtime change.
2. `tests/unit/dashboard/top-nav-containment.test.tsx`.
3. `tests/unit/dashboard/mobile-account-control.test.tsx`.
4. `docs/CHANGELOG.md`.
5. `docs/reviews/issue-127-mobile-account-control.md`.

The Account trigger replaces the inert badge, retaining its avatar/padding and hiding Account/email text below `md`. It supplies an exact identity-aware accessible name, `aria-haspopup="dialog"`, expanded state, focus ring and minimum 44px width/height. The existing header remains `h-16`. No header spacing or workspace selector logic changes.

The existing Sheet is portalled to `document.body`, matching the workspace Sheet pattern so the header's backdrop-filter containing block cannot constrain the overlay. Desktop width is capped at `md:max-w-sm`; mobile inherits the bottom Sheet. Content is only Account, Signed in as, exact supplied email and a full-width primary Sign out button. Long email text can wrap. Missing/empty email displays a truthful unavailable-identity message. Dismissal returns focus to the trigger.

Both Account and the unchanged sidebar use the same imported `<form action={signOut}>`. The canonical action still creates the server Supabase client when configured, calls `supabase.auth.signOut()` and redirects to `/login`. No action implementation or auth semantics changed. There is no Login/settings/billing link in the new panel.

## Validation

- `npm test -- tests/unit/dashboard/mobile-account-control.test.tsx`: initial **8/8 PASS**. Final run after adding separate undefined/empty identity cases: **9/9 PASS**.
- Final combined command: `npm test -- tests/unit/dashboard/mobile-account-control.test.tsx tests/unit/dashboard/portal-nav.test.ts tests/unit/dashboard/mobile-workspace-scope.test.tsx`: **3 files / 32 tests PASS / 0 failed / 0 skipped** (9 Account + 23 related navigation). `portal-nav.test.ts` was not edited.
- Real DashboardTopNav, DashboardSidebar, Sheet and Button rendered in Testing Library. Only external server-action, navigation and theme dependencies mocked. Tests prove exact accessible identity, interactive top-right placement, expanded state, real dialog title/content, prominent Sign out, portal placement, Escape/Close/overlay dismissal, focus entry/return, forward/reverse Tab trapping, normal body-scroll lock/restoration, unmount cleanup and sidebar fallback.
- React 19/jsdom successfully executes function form actions: actual clicks invoke the mocked canonical `signOut` once in both Account and sidebar tests. No source-contract workaround or runtime test accommodation was needed; no real sign-out occurs.
- Codex’s internal sandbox could not launch Chromium because macOS denied Mach-port registration (`MachPortRendezvousServer … Permission denied (1100)`). The exact same final containment test was then run through the authorized Mac process and **PASSed 2/2** cases.
- Containment retains the one-workspace-control invariant by counting only `select[aria-label="Switch location"]` and workspace-labelled dialog triggers. Both quota branches passed across 375, 390, 430, 639, 640–647, 767, 768, 820, 1024, 1366 and 1440px: **18 widths × 2 = 36 measured geometry combinations**. Every combination preserved 64px header height, zero horizontal overflow, usable Communications/Theme/Account controls, zero hit-test obstruction, zero pairwise overlap, Account ≥44×44 and compact ≤50px phone footprint, plus existing Add location / Request plan change behavior.
- `npm run typecheck`: **PASS**, exit 0.
- `npx eslint components/dashboard/sidebar.tsx tests/unit/dashboard/top-nav-containment.test.tsx tests/unit/dashboard/mobile-account-control.test.tsx`: **PASS**, exit 0; **0 errors / 0 warnings / no diagnostics**.
- `git diff --check`: **PASS**; five-file changed-path allowlist and base-byte comparison recorded at final verification.
- Test runner emits Node's environment warning: `ExperimentalWarning: localStorage is not available because --localstorage-file was not provided.` It does not fail component tests. Git emits a `DARWIN_USER_TEMP_DIR` warning and uses `/tmp`.
- Dependencies were reused through an ignored `node_modules` symlink to `/private/tmp/chasum-m1a/node_modules`; no package/lockfile changes or install. Installed Next.js forms/client-component guidance was read before coding.

## Boundary proof and non-goals

Final verification hashed every base-tracked file using Git blob framing and checked untracked paths: **1,271 files byte-identical / 3 tracked files changed / 2 new files**, exactly the five-path allowlist above. HEAD still equals the base. The entire `DashboardSidebar` function is byte-identical to the base, preserving its Signed in / Sign out fallback exactly.

Unchanged: `lib/actions/auth.ts`, `components/ui/sheet.tsx`, `components/dashboard/mobile-bottom-nav.tsx`, middleware/auth guards, Supabase/Auth configuration, schema/RLS/migrations, `lib/location`, Location actions, tenant/business/location state, all other runtime/source/configuration files, and the three continuity documents (`CURRENT_PROJECT_STATE`, `LATEST_HANDOFF`, `ENVIRONMENT_MANIFEST`).

No RBAC, employee/PIN switching, automatic logout, account/settings/billing architecture, M2A/M2B/M3/M4/M5, #123 or P2B work. No DB query/write, provider change, live sign-out, Staging/Production access, deployment, commit, push, PR or merge.

## Zero-write real-Chromium Account-panel acceptance

A temporary local harness under `/private/tmp/chasum-127-browser-harness` imports the exact worktree `DashboardTopNav`, uses compiled real Chasum CSS, and mocks only external server/navigation/auth/theme actions. It does not call Chasum, Supabase, Staging or Production. Evidence is stored under `/private/tmp/chasum-127-browser-evidence/`.

- **390×844 phone:** PASS. Header 64px; Account trigger **50×46px**; bottom Sheet **390px** wide and contained; deliberately long email wraps inside the panel; zero overflow.
- **1024×768 tablet:** PASS. Account trigger **220×46px**; compact **384px** right Sheet; long email contained; zero overflow.
- **1440×900 desktop:** PASS. Account trigger **220×46px**; **384px** right Sheet; zero overflow.
- All three: light/dark readable, focus enters Close, forward/reverse Tab trap passes, Escape and overlay close pass, focus returns to trigger, body scroll restores, console errors **0**, page errors **0**, `signOutCalled=false`.
- The first temporary harness run exposed only a missing local logo asset (`/brand-v2/svg/logo-icon.svg`) as a 404. After serving the actual repository asset, the exact same acceptance reran clean with zero console errors. No product code changed for that harness correction.

## Limits and coordinator continuation

The candidate remains an uncommitted implementation diff, not an accepted release. The full repository suite/build and governed PR Quality/Vercel checks have not yet run. Hosted Preview acceptance remains pending.

The unchanged Sheet restores body overflow to the default empty inline value. Tests establish lock/restoration for the normal dashboard state; they do not claim preservation of a pre-existing nonempty inline overflow value or simultaneous modal stacking. No shared primitive change is included.

After candidate commit/push, open a Draft PR and verify exact Preview identity. Hosted acceptance should open/close the Account panel only and must **not** click Sign out on a live or Production account. No Staging/Production data mutation is required.
