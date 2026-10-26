# Reception Production-compatible isolated local candidate

> Historical isolated-parent evidence: application/test hashes and results below belong to `ab972feb946e264f2a669841efc2ab78ece35cec`. The authorized direct-child Issue #135 guard correction and its new evidence are recorded in [issue135/README.md](issue135/README.md). The parent and its original screenshots remain preserved.

## Scope and identity

Authorized by Darshan on 2026-10-26 for local implementation/testing only. Branch: `codex/reception-production-isolated-release`. The enclosing commit is the immutable local candidate; use `git rev-parse HEAD HEAD^{tree}` for its identity. No push, PR mutation, hosted deployment, data change, provider action or automatic agent dispatch is authorized.

- Production application/base: `664fbc734c4103d78484c6b3828849a6605a562f`.
- Production tree: `a45bcb6356c70ec108721f539e68eb67e47c99cb`.
- Serving deployment: `dpl_9Rfvssq3k8WHV6D6TFpkUtJDGuGF` / `chasum.vercel.app`.
- Verified remote main: `80968d24dc1d87407205e54ccc949433ed39e8eb`.
- Approved PR #171: `7eca5899abc1d44d65205f144dc7e32307008f79`; tree `39e2bc4c87fd144ad16e97cc9bbf4005657250fa`.
- Protected PR #172: `b440f053fbb521ab414bea6e937071f1a9e3e7ed`.
- Protected PR #164: `e76839182e5255102fe15e1bd9b0085d2b382057`.

Fresh read-only identity and ruleset evidence: `logs/remote-identities.json`; public build identity: `logs/production-build-info.json`. Only public serving metadata was read; no Production tenant data was accessed. The primary checkout and all existing worktrees are preserved.

## Dependency reconciliation and provenance

The earlier Class F dependency was Morning Brief's canonical FinancialAmount contract on main/PR #171 versus Production's numeric legacy contract. The explicit temporary PO decision resolves this within one presentation component. No new material Class F runtime/database dependency was found.

- A: nine visual/composition files match the approved PR #171 blobs exactly, including CalendarClient/ReceptionPanel with their essential CAL01 behavior. Morning Brief retains the approved disclosure/layout with the authorized financial presentation exception.
- B: CalendarViews and AppointmentSection match approved CAL01. BookingSheet receives only the `80968d2^..80968d2` CAL01 hunks, adapted around Production context. Later duplicate-submit/payment/read-model/recovery changes from main are excluded. Explicit Calendar selection retains exact date/time/staff/Location, requires explicit service selection and current matching availability; non-Calendar paths retain Production behavior.
- C: shared Sheet matches the accepted Notes correction exactly: a stable ref calls the latest close handler while focus/body-scroll setup depends on open state, not every new callback identity.
- D: 12 current-main governance/control/test files match main exactly. Deny-all candidate registration, exact-SHA authorization, protected Environment approval, trusted control checkout, source/build verification, main Git deployment suppression and rollback protections are preserved. No hosted configuration was changed.
- E: all unrelated financial/operational work is excluded. All `lib`, `supabase`, providers, API/Auth routes, middleware, dependencies and global branding/CSS remain identical to Production.

Run `node scripts/verify-reception-isolation.mjs` to verify the allowlist, exact design/control blobs and protected boundaries. `logs/source-boundary.json` records the result. The changed application inventory is exactly 14 files; there are no financial engine, appointment writer, invoice/receipt, communication, Auth/RBAC, migration or RLS changes.

## Approved Morning Brief compatibility

The component consumes only operational fields. Appointments, staff working, availability, confirmations, no-shows, waitlist and Summer activity retain their original server-calculated values. The server action and its numeric data contract remain byte-identical to Production.

Revenue/collected amounts, outstanding counts, growth percentages, overdue counts and all unproven legacy Chase recommendation strings are omitted. No EXACT/HELD/UNKNOWN FinancialAmount state is created. “Payment information not verified” is always present in the summary and explained in the expanded view. Chase shows the neutral “Review today’s appointments and availability.” and the existing operational available-slot count.

The separate Reception Suggestions input was traced to Production `buildDashboardInsights`, which receives appointment/customer counts only. Its genuinely nonfinancial recommendations and Summer architecture remain intact. Existing appointment-card Due/Notes indicators, booking payment controls and payment behavior retain Production meaning; this change is the explicitly approved Morning Brief compatibility treatment, not financial acceptance.

`reception-production-compatibility.test.tsx` is a separate new test suite: positive, zero and negative legacy financial values; hidden and expanded content; disclosure; visible warning; retained operational/Summer fields; and throwing getters that fail if financial fields or legacy Chase are consumed. Original PR #171 tests/worktree remain unchanged.

## Validation and commands

Run from the isolated worktree. Existing dependencies were cloned locally from the approved Reception checkout, with identical package.json/package-lock.json and Next 16.3.6; no credential or .env files were copied.

| Command | Result | Evidence |
| --- | --- | --- |
| `npm test -- tests/unit` | PASS: 182 files / 1,766 tests; no unit skips/failures | logs/unit.txt |
| `npm run typecheck` | PASS | logs/typecheck.txt |
| Changed-file `node_modules/.bin/eslint` (exact path list in log) | NOT GREEN: 3 existing errors / 1 warning; zero additional diagnostics | logs/lint.txt |
| `git show 664fbc7:<path>` supplied to `node_modules/.bin/eslint --stdin --stdin-filename <path>` for BookingSheet and Sheet | Same 3 errors / 1 warning reproduced on exact Production | logs/lint-production-baseline.txt |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | PASS with existing middleware deprecation | logs/build.txt |
| `node scripts/verify-release-control-config.mjs` | PASS | logs/release-config.txt |
| `node --test tests/release-control/*.test.mjs` | PASS: 10 / 10; includes approved ancestor, policy/expiry/ancestry rejection, exact serving identity | logs/release-tests.txt |
| `node scripts/verify-reception-isolation.mjs` | PASS: bounded source and no backend/financial drift | logs/source-boundary.json |
| `node tests/unit/calendar/isolated-browser/run.mjs docs/validation/reception-production-isolated/screenshots after` | PASS: 4 widths, zero page errors/writes/page overflow | logs/browser.txt; screenshots/after-results.json |
| `git diff --check` / staged diff check | PASS | final commit verification |

The broad unit suite includes Production booking validation/persistence/payment/cancellation/receipt/communications negative controls, tenant/Location and Auth/RBAC checks, plus CAL01 selection, Reception scope transport, appointment cards and Notes focus. No SQL or hosted integration suites were executed. Local server actions are mocked/in-memory; browser transport rejects all non-loopback URLs and unapproved actions.

All four widths exercise calendar views/date navigation, filters, appointment details, named/ALL/named Location switching, closed-by-default panel, Sheet opening/closing, date/time context, Notes caret, scroll lock, width presets, dark mode, responsive containment and native Morning Brief disclosure (including keyboard Enter). Browser data includes financial sentinel values and copy, verified absent from Morning Brief.

## Screenshots and design preservation

19 new PNGs use actual application components, CSS and built Inter/JetBrains fonts with synthetic data. Desktop 1440×900, laptop 1366×768, tablet 834×1112 and mobile 390×844 each have closed, open, expanded-brief and dark captures. Three larger widths additionally have appointment-card captures. See `screenshots/` and the SHA-256 manifest.

Nine approved visual files are exact PR #171 blobs. Chasum marks, shell, global CSS, fonts, mobile Location selector and bottom navigation remain unchanged from Production. Accepted original design/Claude R1/R2 evidence remains on PR #171 under `docs/validation/reception-stage1/`; no competitor research or original audit was repeated. The authorized Morning Brief has six operational metric cards instead of financial cards, the neutral warning and neutral Chase copy. Its native collapsed disclosure, compact typography, spacing and secondary Summer placement remain recognizable.

Physical iPhone Safari/device and authenticated hosted acceptance were NOT RUN. Local Chromium emulation is not physical-device proof. Future hosted acceptance requires separate authorization.

## Governed eventual integration path

This local commit is not currently on main ancestry and is not registered for release. It must be rejected by current release controls. Main protection requires up-to-date Vercel, competitive-product-gate and quality checks, and resolved review threads. Mandatory human/CODEOWNER approval is currently waived; CODEOWNERS alone is not active two-person control.

The established workflow explicitly supports an approved ancestor of current main and checks out that exact immutable source separately from trusted current-main release controls. The active ruleset permits merge commits and does not require linear history. A later separately authorized PR/integration can retain this isolated commit in main ancestry via a normal merge while reconciling main's financial Morning Brief changes at the integration tip. Squashing/rebasing away the isolated SHA would lose that identity and require a newly reviewed candidate. The approved isolated ancestor, not the financial main tip, would be the release source. This uses the existing guarded workflow; no special release path or financial import into this candidate is necessary.

After independent delta review, PO authorization would still be required for publication (which can trigger Preview), protected integration, exact-SHA candidate registration with expiry, Production Environment approval and exact-source/build/serving verification. None of these actions is performed or implicitly approved here. This is local candidate readiness only, not current release eligibility or Production readiness.

## Limitations and next gate

Changed-file lint is transparently NOT GREEN: BookingSheet has two pre-existing set-state-in-effect errors and one unused-variable warning; Sheet has one pre-existing set-state-in-effect error. Production-baseline reproduction confirms no new diagnostics; no lint/test rules were disabled and no payment effect was refactored out of scope. Build's existing middleware deprecation and Node localStorage warnings are preserved.

Backend/schema/live provider behavior is preserved by byte identity and local negative controls, not by new hosted claims. Original dense-card/device limitations remain. Main advances or serving-source changes require a fresh bounded reconciliation before any future release action. GVM CAD $50 deposit collection remains HELD.

Next gate: Darshan manually dispatches independent Claude Opus 5 High review of this immutable local compatibility/composition delta, including the documented lint baseline and governed ancestry path. No automatic dispatch, push, PR, merge or deployment follows this report.
