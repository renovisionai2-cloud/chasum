# Issue #121 — Summer Location disclosure

**Status: IMPLEMENTATION CANDIDATE / REAL-CHROMIUM ACCEPTANCE PASS / DRAFT PR #125 / NO MERGE / NO PRODUCTION.**

- Base: `f70229098ddf18443ae74c6456d35239824280e0`.
- Exact runtime/test candidate: `9d8bf216749a64ea5dbf569256e3809df43c92b6`; tree `445aedfea3742471a31f10c4e2799120afcf75e5`; parent = exact base.
- Branch: `codex/issue-121-summer-location-disclosure`; Draft PR #125.
- Worktree: `/private/tmp/chasum-121-impl`.
- Remote `main` independently verified at the base through the GitHub connector before candidate commit/push. No branch reset or environment reconciliation was performed.
- Product Owner approved; **LAUNCH REQUIRED**; [pre-build Competitive Product Gate PASS](https://github.com/renovisionai2-cloud/chasum/issues/121#issuecomment-5901896273). M1B remains Production accepted/closed. This candidate is not acceptance or release closeout.

## Contract and implementation

The parity floor is visible target Location before confirmation and the same Location after successful booking. Chasum's deliberate advantage is deterministic disclosure from the exact option submitted, independent of AI prose.

Every shared `SummerBookingOption` card now renders `Location · {opt.locationName}` when supplied, after Service/date/time/Staff and before the confirmation affordance. Reschedule cards inherit this display through the same rendering. Secondary text preserves the existing hierarchy and responsive grid; Location text can wrap, and the confirmation text container has `min-w-0` and word wrapping.

The existing booking handler still passes `option` unchanged to `confirmSummerBookingAction`. Only after `result.ok`, it saves `option.locationName ?? null` on that message's local `ChatLine.confirmationLocationName`. The success block renders that name separately from `result.reply` inside the existing polite chat log; no nested live region is added. An absent name produces no disclosure or invented fallback. No server return contract or domain type changed. Reschedule/cancel confirmation data flow remains unchanged.

## Exact boundary

1. `components/summer/summer-reception-workspace.tsx` — sole runtime change.
2. `tests/unit/summer/summer-location-disclosure.test.tsx` — real component regression coverage.
3. `docs/CHANGELOG.md` — candidate entry.
4. `docs/reviews/issue-121-summer-location-disclosure.md` — this evidence record.

The test renders the real workspace and mocks only server actions, plus jsdom's missing `scrollIntoView` browser API. It submits a typed message and receives a resolved customer ID. Coverage proves:

- A concrete Location ID with “Brampton Test Location” is visible with Location context before booking, alongside Service/date/time/Staff.
- Clicking the option calls the confirmation action once with the original frozen object by identity, retaining all fields including Location ID/name and bypassing customer recognition.
- A successful reply containing no Location name still produces a separate, visible disclosure in the success block.
- Selecting Brampton from multiple options does not substitute another option's Location.
- Missing `locationName` invents no fallback before or after confirmation.
- Entering the existing reschedule flow displays Location on its shared option card without invoking a booking mutation.

## Validation

| Check | Result |
| --- | --- |
| `npm test -- tests/unit/summer/summer-location-disclosure.test.tsx` | PASS: 1 file, 4 tests, 0 failures |
| `npm test -- tests/unit/summer tests/unit/marketing/meet-summer-intelligence.test.ts tests/unit/marketing/meet-summer-routing.test.ts tests/unit/marketing/summer-intelligence-pacing.test.ts tests/unit/website-concierge/summer-principle.test.ts` | PASS: 6 files, 24 tests including the 4 new tests, 0 failures |
| `npm run typecheck` | PASS, exit 0, no diagnostics |
| `./node_modules/.bin/eslint components/summer/summer-reception-workspace.tsx tests/unit/summer/summer-location-disclosure.test.tsx` | PASS, exit 0, zero errors/warnings/diagnostics |
| `git diff --check` | PASS |
| Runtime candidate boundary (`git diff --name-only f70229098ddf18443ae74c6456d35239824280e0 9d8bf216749a64ea5dbf569256e3809df43c92b6`) | Exactly the four allowlisted files; candidate committed/pushed on Draft PR #125 |
| Protected paths and all other tracked files compared with base | Unchanged |
| Exact-SHA governed Quality on `9d8bf216...` | PASS |
| Exact-SHA Vercel Preview | READY / SUCCESS — deployment `dpl_5ZyFHaDEy5Tt5fM2ZnoyUJPG4iTQ` |
| Real-Chromium responsive / workflow acceptance | PASS at 390×844, 1024×768, 1440×900; option → confirmation workflow, light/dark, 0 horizontal overflow, 0 console errors, 0 page errors |

Dependency setup reused the existing `/private/tmp/chasum-m1a/node_modules` through an ignored worktree symlink after byte-comparing lockfiles. No package, lockfile or configuration edits/install occurred. The installed Next.js client-component and Vitest guides were read before implementation. Tests emit Node's non-failing experimental localStorage warning (`--localstorage-file` not provided).

### Zero-write real-Chromium acceptance

Because a genuine `sendSummerMessage()` call persists Summer conversation/message rows and may create communication/follow-up state, no live Staging/Production Summer message was sent solely for acceptance. Instead, an ephemeral browser harness under `/private/tmp/chasum-121-browser-harness` imported the exact candidate `SummerReceptionWorkspace`, compiled the real Chasum `app/globals.css`, and mocked only Summer server actions. The harness served localhost static assets only and made no Chasum, Supabase, Staging or Production network request.

Evidence: `/private/tmp/chasum-121-browser-evidence/report.json`, `report.md`, and phone/tablet/desktop screenshots.

- **390×844 phone:** PASS, `scrollWidth/clientWidth=390/390`, 0px overflow. A deliberately long Location name wrapped to two lines inside the option and successful confirmation without clipping.
- **1024×768 tablet:** PASS, `1024/1024`, 0px overflow.
- **1440×900 desktop:** PASS, `1440/1440`, 0px overflow.
- Dark mode: PASS at all three sizes with 0 overflow.
- Exact selected option remained unchanged through confirmation: `locationId`, `locationName`, Service, Staff, customer and conversation identifiers matched the deterministic option/input.
- Existing chat log live-region semantics were preserved: one `role="log"`; no nested `role="status"` was introduced.
- Browser console errors: **0**; page errors: **0**.

This satisfies the responsive, accessibility/usability-basics and equivalent-workflow acceptance for the bounded UI behavior without manufacturing persistent Summer data. A real hosted Summer message/booking was intentionally not used because it would be a write, not a read-only validation.

Non-blocking limitation: the zero-write acceptance validates the exact candidate component with real compiled application CSS and real Chromium, but not a live authenticated Staging Summer conversation because that would create data. The governed Preview build itself is READY on the exact runtime candidate. Existing typecheck configuration excludes tests; Vitest executes the new test and ESLint checks it.

## Explicit non-goals and preservation proof

The base diff and untracked inventory contain only the four paths above. There are zero changes to `lib/summer/**` (including types, tools and orchestrator), `lib/actions/summer.ts`, `lib/booking-engine/**`, `supabase/**`, package/config/CI files, or any other runtime module. No prompt/model/intent, availability, mutation, Location choice/defaulting, `getActiveLocationId()`, workspace Location behavior, customer recognition, Auth/provider, schema/RLS/migration or M5 autonomy/ACT semantics changed.

`docs/CURRENT_PROJECT_STATE.md`, `docs/handoffs/LATEST_HANDOFF.md` and `docs/runtime/ENVIRONMENT_MANIFEST.md` remain untouched pending acceptance/release closeout. Issue #123 and M1C/M2A/M2B/M3/M4/M5 remain outside this task; P2B remains paused.

No real booking, database access, or Staging/Production application access occurred. The exact candidate was committed/pushed and Draft PR #125 opened so governed Quality/Vercel could run. No merge or Production deployment occurred.
