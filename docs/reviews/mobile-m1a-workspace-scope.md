# M1A — mobile workspace scope implementation evidence

Date: 2026-09-29. Current status: **PRODUCTION ACCEPTED / CLOSED**. Exact hosted-tested runtime candidate remains `26a4b328ea2b7de1fbf70cc3c28aa1ce23c24329`; Production squash merge is `2733729ebbf65442cf55eb53b4962aa672535617`.

Branch: `codex/m1a-mobile-workspace-scope`. Base: `ea575bb183abd5fb38cab6348494becd6b25e7e3`.

## Production acceptance closeout — 2026-09-29

PR #118 was Product Owner-approved and squash-merged to `main` as `2733729ebbf65442cf55eb53b4962aa672535617` (tree `cdce0b0b8425672bd9361563b20bb4fa6035d0f4`). Automatic Vercel Production deployment `dpl_3gC2c7oAfXGdXJ4avdNpfPH7daT5` completed successfully. Direct Production `/api/build-info` returned the exact merge SHA on `main`, `env=production`, `production=true`; `/api/health` returned HTTP 200 / `ok=true`.

Claude Opus 5 High Development Control Tower mechanically verified that the Production merge tree is byte-identical to docs-closeout commit `3784c781b878107fa6da7628f837e50f33bdfb45` and differs from hosted-tested runtime candidate `26a4b328...` only in six Markdown files. All executable/runtime/config/test subtrees and root runtime/config files are identical, so the Production application code is exactly the code that earned authenticated hosted acceptance.

Fresh Production evidence:
- Vercel deployment and GitHub Production deployment reconcile to merge `2733729e...`.
- Quality push run on the exact Production SHA passed **1,665 tests / 36 skipped / 0 failed**, including the real-Chromium containment test (2/2, 76.4s).
- Real authenticated GVM Production source was safely inspected without mutation: `gvmbabyworld@gmail.com`, Brampton workspace selected, Burlington/Brampton/Caledonia plus All Locations present, phone M1A control present, tablet/desktop selector present, and containment class `md:block` live with old `sm:block` absent.
- Safe authenticated route reads for Centre, Reception, Customers and Payments retained GVM identity and Brampton workspace; no sign-in, cross-tenant or booking redirect occurred.
- Fresh read-only Production data showed GVM at 3 active Locations, 14 Services, 42 service-location rows, 3 Staff, 9 staff-location rows, 25 staff-service rows and zero cross-business mismatches. Claude independently corroborated the live three-Location/three-Staff/fourteen-Service relationship state via the anon RLS-gated public-booking payload.
- No Production booking, customer, appointment, Staff, Service, Location, payment or invoice mutation; no SQL write, migration, schema/RLS/Auth change; no rollback.

Claude final Production verdict: **B — PRODUCTION ACCEPTED / M1A CLOSED, WITH NON-BLOCKING LIMITATIONS**. No further Production probe is required and rollback is not indicated.

Recorded non-blocking limitations:
1. Authenticated Production dashboard markup is operator-observed because the dashboard is auth-gated from Claude.
2. Exact 42/9/25 join-row counts and zero cross-business result are operator-attested read-only observations, directionally corroborated by public booking and structurally outside M1A's blast radius.
3. Safari/macOS security controls blocked scripted Production clicks/scrollWidth; deterministic exact-SHA Chromium containment and byte-identical hosted interaction evidence carry the proof.
4. No Chasum HQ tenant exists in Production; single-location behavior remains covered by authenticated hosted acceptance and the single-location CI branch.
5. `quality.yml` does not run build/lint; Vercel is the deployed-bundler proof.
6. Business=10 historical seed/source versus canonical application Business=6 remains separate entitlement-truth debt.
7. The ~1s `router.refresh()` settle window remains intentional/no-second-scope-store behavior and future polish only.
8. Production Sentry remains OFF by standing posture.

**M1A is closed. The broader GVM technician mobile program is not.** Next governed gate: M1B preparation only. M1C/M2A/M2B/M3/M4/M5 remain open/preserved.

## Final authenticated hosted acceptance — 2026-09-28

PR #118 remained **OPEN / DRAFT / UNMERGED** throughout acceptance. The exact runtime candidate was `26a4b328ea2b7de1fbf70cc3c28aa1ce23c24329` (tree `ea2f53f378e9552522c127ff062cccccd0fd1189`, parent `6b66fa2f91b9eaae021e5d0cb0979add1287e571`). Vercel exact-SHA status, Node 22 Quality and the competitive-product gate were green. The authenticated operator observed `/api/build-info` returning this exact SHA with `env=preview`, `ref=codex/m1a-mobile-workspace-scope`, `production=false`. Claude could not independently fetch the Vercel-protected endpoint, so that payload is operator-attested rather than auditor-verified; exact-SHA checks and deterministic Chromium containment independently corroborate it.

Hosted acceptance result: **PASS**.

- Representative single-location Chasum HQ was exercised on Centre, Reception, Customers, Payments and More/sidebar at 375, 390, 430, 639, 640–647, 767, 768, 820, 1024, 1366 and 1440. All required probes had zero horizontal overflow, a 64px header and simple static Location context with no unnecessary switcher or `All locations`.
- A stale already-open tab initially reproduced the historical 640–646 overflow because it retained old client assets. After a full authenticated reload, the DOM reflected the corrected `md:block` behavior and 639–647 were clean. The compiled-CSS Chromium containment test remains the load-bearing proof and independently fails the old frozen candidate.
- Product Owner approved the minimum temporary **Staging-only** multi-location fixture because no Staging Business had more than one active Location. Existing synthetic `Chasum Test Studio` was used after a rollback-only preflight proved the exact setup sequence.
- Temporary fixture delta only: one admin `business_members` row for the already-authenticated acceptance account; target plan `starter → professional`; one normal `create_location_from_template(..., setup_mode='blank')` Location; one `location_settings` row; seven `location_hours` rows; zero temporary `location_hour_segments`, `service_locations` and `staff_locations`; no appointment/customer/Service/Staff/payment/invoice/communication creation.
- Phone scope Sheet contained `All locations` plus both legitimate Locations. Body scroll lock/unlock and Escape focus restoration passed.
- With the phone Sheet open, 430→820 closed/unmounted it, restored body scrolling, removed the phone control and exposed exactly one tablet selector with no stale overlay.
- Named scope persisted Centre → Reception → Customers → Centre. A real A→B scope switch stayed on the current operational surface and launched no booking workflow.
- Reception `/dashboard/calendar?view=month&date=2026-09-28` remained byte-for-byte unchanged through real scope changes.
- `ALL` persisted Centre → Reception → Customers → Centre without workspace-presentation fallback to the default Location.
- Full multi-location matrix: four surfaces × 18 widths = **72 hosted combinations / 0 failure-like rows**. Every combination had zero horizontal overflow, 64px header and exactly one appropriate workspace selector.
- Existing tablet/desktop `LocationSwitcher` performed real named/ALL switching at 640, 767, 768, 820, 1024, 1366 and 1440 with final cookie and controlled-select value agreeing, Reception query preserved, and no booking dialog/query.
- The approximately 0.95–1.2s `router.refresh()` settling window is intentional and unit-pinned by the no-second-scope-store contract: the cookie updates first and server-provided presentation converges after refresh. A future trigger-level pending affordance is polish only and must not be pulled into M1A.

Fixture restoration: **PASS**. Teardown targeted only captured temporary IDs; restored the target plan `professional → starter`; restored the original `businesses.updated_at` exactly with transaction-scoped trigger suppression because the normal trigger force-sets `now()`; and performed no broad cleanup. A separate read-only reconciliation proved zero temporary residue, original Business/Location/member intact, target operational counts unchanged, and global relevant Staging counts exactly equal to the pre-fixture baseline. Browser-only scope cleanup returned the acceptance account to Chasum HQ. Production and GVM Production were untouched; no migration, schema, RLS or Auth-identity change occurred.

Claude Opus 5 High Development Control Tower final verdict: **B — CLEAR TO CLOSE OUT WITH NON-BLOCKING LIMITATIONS**. No runtime correction or repeat broad audit is required. Documentation-only closeout may proceed; after that M1A may be presented to Darshan for the **FINAL PRODUCT OWNER MERGE DECISION**. This does not authorize merge, Production, M1B, M1C, M2A/M2B, migration 034 or Commercial SaaS P2B.

### Non-blocking limitations / follow-ups

1. Protected Preview `/api/build-info` is operator-attested from Claude's environment; exact-SHA Vercel/check-run evidence and deterministic CI corroborate it.
2. Preserve the stale-client-assets episode as historical context, not a current-candidate regression.
3. Hosted multi-location testing used Professional at 2/3 Locations (`canAdd=true`); hosted single-location HQ covered the harder `canAdd=false` transition composition, and CI covers both branches at all 18 widths.
4. The ~1s refresh settle window has no trigger-level pending affordance after the Sheet closes; correctness is preserved and future polish is outside M1A/M1B.
5. Transaction-scoped trigger suppression is exceptional fixture-teardown technique, not normal application behavior.
6. Earlier review text saying “no push” or “Claude re-audit planned” is historical and superseded.
7. `quality.yml` is not build evidence; Vercel Preview is the deployed-bundler proof.
8. Existing cosmetic accessibility notes remain non-blocking: single-location roleless `aria-label`, Sheet option semantics, and the pre-existing 40px Sheet close control.
9. `playwright-core` direct-dependency hardening remains future repository maintenance, not M1A.

Separate follow-up: historical Phase-5 seed/source material still contains Business=10 while current canonical application/Stage-1C Location entitlement is Business=6. Record and reconcile this source/history divergence separately; do not silently change entitlement code, migrations, triggers, RPCs or live data in M1A.

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

**Historical pre-acceptance note (superseded):** at this point in the correction history the corrected candidate had not yet received authenticated hosted acceptance. Final hosted acceptance and exact Staging restoration are recorded above. No merge or Production action occurred; M1B remained untouched.

**Prior sandbox commit attempt (historical):** `git add` failed before staging or committing: Git could not create `/Users/darshan/chasum/.git/worktrees/chasum-m1a/index.lock` (`Operation not permitted`). The worktree Git metadata was outside that sandbox's writable roots; that attempt created no commit or tree. The Product Owner subsequently authorized local packaging of exactly the five bounded files on the same branch, with message `fix: contain tablet transition header`, without pushing. The packaging report records the resulting commit, tree, exact parent and clean-worktree verification. Validation evidence above is preserved; re-audit and hosted acceptance remain pending.

Historical next-gate note (superseded): the narrow Claude correction re-audit and authenticated hosted acceptance are complete. Current gate is the Product Owner's final decision on Draft PR #118 after documentation-only closeout. Do not merge, deploy Production or begin M1B without explicit Product Owner approval.

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

## Independent review / final gate

Claude's original M1A audit, narrow correction-delta re-audit and final Development Control-Tower evidence review are complete. Final verdict: **B — CLEAR TO CLOSE OUT WITH NON-BLOCKING LIMITATIONS**. Authenticated hosted branch-Preview acceptance is complete on exact runtime candidate `26a4b328ea2b7de1fbf70cc3c28aa1ce23c24329`; the temporary multi-location Staging fixture was restored exactly and independently reconciled.

No database schema, migrations, RLS, booking engine, availability or Auth architecture changed as part of M1A. The temporary Staging fixture was acceptance-only DML under explicit Product Owner approval and is fully removed. Issue #102 / Stage 1B / Stage 1C remain locked. M1B, M1C and later mobile work are not implemented.

**Current next gate:** **M1B — All-Locations Booking Location Guard, governed gate preparation only.** M1A is Production accepted / closed. Do not rerun M1A, start M1B implementation automatically, resume P2B automatically or begin later mobile streams without their own gates.