# M1C — Reception-compatible local descendant

## Identity and scope

Base/direct parent: `d3b20b5445baa40c2aa6bb0fb0e375c1ee55bc00`.
Base tree: `4019321cfc88c52f451ce773fd08a3e55206f7b9`.
Local branch: `codex/m1c-reception-account-local`.
Worktree: `/Users/darshan/.codex/worktrees/m1c-reception-account-local/chasum`.
The new HEAD/tree are reported by Git and the final delivery report; this document does not attempt to embed its own future commit hash.

Only runtime change: `components/dashboard/sidebar.tsx`.
Reference-only M1C: PR #128 `b352729c2a0c3106989aed7ecfde36ec667866a1`. Its AccountControl/import/mount presentation is selectively reused; none of its newer-main ancestry or older shared Sheet is imported. The original DashboardSidebar function/form and all nine original M1C component test bodies remain intact.

## Account contract and pending behavior

The real Account button retains the compact header design and >=44px target. The body-portalled, shared audited Sheet contains Account, exact supplied email/unavailable fallback, and the existing `<form action={signOut}>`. It uses no new router, tenant, session, Auth or data layer.

A component-local ref synchronously claims the first submit, preventing another submit before React pending paints. React useFormStatus supplies the canonical form lifecycle. The submit control is disabled with “Signing out…”/live pending copy; pointer repeats cannot blur onto the disabled control. A bounded Account-only Tab handler keeps focus on Close while the submit is disabled, without modifying the shared Sheet. The panel remains mounted/open while pending so Close/Escape/backdrop cannot reset the claim. After a non-redirecting mock action settles, controls/dismissal recover. No success message or session-revocation guarantee is fabricated.

This protects normal UI submission in this mounted Account form. It is not server-side exactly-once execution, cross-tab locking or an Auth redesign. Real sign-out was never invoked. The canonical action still uses the SDK default global scope and ignores returned errors; /login redirection alone is not proof of complete global revocation. That inherited Auth limitation requires separate authorization and acceptance.

## Drawer correction

Drawer z-55 now sits above unchanged bottom navigation z-50 and below audited Sheets z-60. Safe-area padding applies only to the mobile sidebar instance. Its viewport height uses dvh with a vh fallback; header/footer do not shrink and the navigation region can scroll. Close uses explicit light foreground/focus styling on the dark drawer.

The drawer records both existing invokers, including touch activation without browser focus; enters/traps focus, makes background siblings inert while preserving their previous values, and returns focus without scrolling. It uses a stable close reference, restores the previous body overflow value, and closes at the 1024px desktop breakpoint. When the mobile invoker disappears, focus returns to visible Account. No shell, bottom-nav, Button or shared Sheet source changed.

## Validation and evidence

Final results: 303 focused tests in 22 files PASS; 64 new Chromium/WebKit cases PASS; preserved Preview-footer 20 cases and header-containment 2 cases (42 width/quota combinations) PASS in the earlier combined run; 10 release-control tests PASS. Typecheck, changed-file lint, normal Turbopack build, isolation, release configuration and diff hygiene PASS. The 56 new screenshots are enumerated in `changed-files.log`.

`results.json` records exact commands, exit codes, counts, source parity and artifact hashes. `browser-results.json` contains measured Chromium/WebKit states. Logs and screenshots in this directory belong only to this new candidate; historical Reception evidence is unchanged. New console logs have terminal carriage returns, trailing spaces and final blank lines normalized for Git diff hygiene; diagnostic messages and outcomes are retained.

The browser fixture imports actual DashboardShell, Account/drawer, CalendarPage, BookingSheet, global CSS and build fonts. Server actions/navigation are replaced inside the test loader. All non-loopback requests and non-GET traffic are rejected. The explicitly exercised Location switch changes only in-memory synthetic fixture state; Auth and domain mutations are rejected. The displayed build identity is a fixed synthetic fixture value, never deployed-candidate evidence.

Responsive matrix: 320/375/390/639/640/647/767/768/834/1023/1024/1366/1440px plus 667x320 and 844x390 landscape; light/dark; Chromium/WebKit; one/multiple Locations and wrapped identity. Chromium mobile cases use CDP's actual safe-area-inset override of 34px; WebKit checks its desktop-runner zero inset and viewport resizing, not physical device toolbars. Additional cases exercise short/long identities, local Location retention, four Calendar views and nested Week scrolling.

The original header-containment and Preview-footer tests remain preserved. The new resize assertion waits for React cleanup after CSS hides the drawer, rather than treating immediate aria-role disappearance as completed effect cleanup. No assertions were removed to obtain a PASS.

## Limits and next gate

- Local browser emulation is not physical iPhone/iPad or screen-reader acceptance.
- The separate intermittent post-login Safari horizontal shift is not claimed fixed.
- Shared Sheet is unchanged, including its existing default-inline-overflow restoration and lack of a general stacked-modal manager. Sequential Account/Booking workflows are covered.
- Original global lint status is not reclassified; only changed-file lint is asserted by the final recorded result.
- A dependency symlink initially failed the normal Turbopack filesystem boundary. The exact installed dependency tree was cloned locally without installation/package/lock changes, then the normal build was rerun. No deployment/config changes were made.
- Independent Claude delta audit must be manually dispatched by Darshan after delivery. No push, PR edit, deployment or release registration is authorized.
- Current-main conflict resolution/true-merge review, missing Quality, exact-SHA registration, protected Production approval, hosted/device acceptance and controlled rollout remain separate gates. GVM CAD $50 remains HELD.
