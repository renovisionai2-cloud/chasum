# Issue #135 safety backport — local Reception candidate

## Authority and immutable source

Darshan explicitly authorized a bounded local backport of accepted Issue #135 / merged PR #150. The original audited Reception isolation commit is preserved as the direct parent: `ab972feb946e264f2a669841efc2ab78ece35cec`, tree `f2f0043369a1ce30eb880d8b05b30b3cf5f56ccb`. Branch remains `codex/reception-production-isolated-release`. This directory records the new correction; the parent evidence and original 19 screenshots are historical evidence for ab972feb, not a claim that its old file hashes describe the correction.

Accepted runtime `c45513c8cc3b7d4ab1a1188dc02c596558f60ff0`, PR #150 head `e5bcf398654cc3bed949707e5115c8bdb22b3585` and merged implementation `34dbd1518e1fe364cecaa5ad46576e93e9ed1afa` all have the same BookingSheet blob: `e9d743f32da93216161975ba9b94ce8674218169`.

The backported BookingSheet blob is `eddeb96020f74598c20c63ce6db3c5e48766f13f`, exactly matching the accepted combined #135/CAL01 file at `80968d24dc1d87407205e54ccc949433ed39e8eb`. Only the accepted guard insertions were applied to the audited local parent. No other application file changed. See `logs/source-proof.json`.

The user-provided independent verdicts for original Reception and the isolated parent are CLOSED. They were not rerun. This new delta awaits a separate manual independent audit.

## Guard behavior

The existing CAL01 eligibility and #131 created-appointment checks execute before claiming the create-only ref. The ref is claimed synchronously before dispatch, without waiting for React pending UI. The accepted action wrapper releases it only after a returned ActionState lacks appointmentId. A returned appointmentId retains the claim, including payment-failure outcomes. Rejection or absent/malformed null/undefined results do not clear it. There is no finally/reset-on-error path.

The existing BookingSheetSession unmount/remount resets the ref after close/reopen. No global lock is introduced. updateAppointment bypasses the create wrapper and guard. Server actions, FormData contracts, payment/tax/deposit calculations, invoices/receipts and communications are unchanged.

This is client-session duplicate prevention, not global exactly-once booking, financial idempotency or unknown-outcome recovery. A new session can submit again; an ambiguous result still requires existing operational handling.

## Focused tests

The accepted PR #150 test delta was ported without unrelated test changes. Additional tests cover ordinary successful deferred completion, ambiguous outcomes and CAL01 eligibility ordering.

| Required case | Evidence |
| --- | --- |
| Rapid double submit before pending renders | Accepted direct submit, requestSubmit and click + requestSubmit cases; exactly one create after the action queue settles |
| Native keyboard submission | Accepted Enter retry; Chromium Enter with same-click programmatic submit overlap |
| Deferred response | Calls checked during pending and after completion; no queued duplicate |
| Ordinary success | Deferred double submit closes normally with one create; new session can create again |
| Created appointment/payment failure | #131 alert and lock remain; transaction/no-transaction distinctions preserved |
| Known no-appointment response | Error ActionState and empty ActionState permit same-session retries; corrected Notes FormData verified |
| Thrown/null/undefined outcome | Actual guard wrapper tested with a test-only error observer retaining the same session; repeated submits remain blocked after pending clears |
| Close/reopen | Existing remount allows a new booking; browser verifies context and explicit service behavior |
| Editing | Immediate and subsequent legitimate update saves remain unguarded |
| CAL01 | Missing service and unresolved availability submissions dispatch nothing and do not claim; subsequently valid context submits once |
| Notes/payment fields | Notes focus tests unchanged; deposit/e-transfer payload and successful/failed payment presentation verified |

The error observer is confined to the unit test's React hook mock. It catches the actual action-wrapper rejection and retains the test session to examine the ref. Production React error-boundary recovery is not changed or newly claimed. Original guard tests execute the normal React hook path.

## Commands and outcomes

All commands ran locally from the existing isolated worktree.

- `npm test -- tests/unit/booking/booking-sheet-payment-submit.test.tsx tests/unit/calendar/calendar-booking-selection.test.tsx tests/unit/ui/sheet-focus-stability.test.tsx` — PASS, 3 files / 45 tests. See `logs/guard-tests.txt`.
- `npm test -- tests/unit/booking/appointment-payment-outcome.test.ts tests/unit/booking/create-booking-persistence.test.ts tests/unit/booking/book-public-appointment-financial-integrity.test.ts tests/unit/booking/cancelled-booking-sheet-terminal.test.tsx tests/unit/booking/m1b-server-guard.test.ts tests/unit/booking/m1b-foreign-location.test.ts tests/unit/booking/eligible-staff.test.ts tests/unit/commerce/booking-financials.test.ts tests/unit/commerce/booking-pricing.test.ts tests/unit/commerce/receipt-reliability.test.ts tests/unit/auth/permissions-and-validation.test.ts tests/unit/api/appointment-tenant-integrity.test.ts tests/unit/communications/delivery-preference-gates.test.ts tests/unit/calendar/reception-production-compatibility.test.tsx` — PASS, 14 files / 180 tests. See `logs/negative-controls.txt`.
- `npm run typecheck` — PASS, including final added tests. See `logs/typecheck.txt`.
- `node_modules/.bin/eslint components/booking-sheet/booking-sheet.tsx tests/unit/booking/booking-sheet-payment-submit.test.tsx tests/unit/calendar/calendar-booking-selection.test.tsx tests/unit/calendar/isolated-browser/run.mjs tests/unit/calendar/isolated-browser/submit.mjs scripts/verify-reception-isolation.mjs` — NOT GREEN: inherited 2 BookingSheet errors / 1 warning, no new diagnostics. See `logs/lint.txt`.
- Exact parent BookingSheet supplied to `node_modules/.bin/eslint --stdin --stdin-filename components/booking-sheet/booking-sheet.tsx` — same 2 errors / 1 warning. See `logs/lint-parent.txt`. The prior shared Sheet's additional inherited error remains outside this unchanged file scope; it was not repaired or suppressed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` — PASS. No application changes followed the build. Existing middleware deprecation remains. See `logs/build.txt`.
- `node scripts/verify-release-control-config.mjs` — PASS. See `logs/release-config.txt`.
- `node --test tests/release-control/*.test.mjs` — PASS, 10/10. See `logs/release-tests.txt`.
- `node scripts/verify-reception-isolation.mjs` — PASS. Only two test paths were added to its allowlist; no protected application path or release policy was weakened. See `logs/isolation.json`.
- `node tests/unit/calendar/isolated-browser/run.mjs docs/validation/reception-production-isolated/issue135 issue135` — PASS: desktop 1366×768 and tablet touch 834×1112. See `logs/browser.txt` and `issue135-results.json`.
- Staged and final `git diff --check` — PASS.

Total final unit/component coverage for this delta: 17 files / 225 tests passed. No full prior visual audit or PostgreSQL campaign was repeated. During test development, a civil-date assertion was corrected to inspect the existing date UI rather than invent a date field in footer FormData. Browser startup/customer-selection timeouts were resolved in the fixture with bounded startup waits and supported keyboard selection; no application change was used to bypass a failing test.

## Browser boundary and evidence

The existing local fixture renders the actual Calendar and canonical Sheet. Only its in-memory create mock receives submitted FormData. Non-loopback traffic and all unapproved actions are rejected. No real booking/payment is created.

Each viewport records exactly three intentional synthetic calls: one known failure, one corrected retry with a created-appointment/payment-failure result, and one successful new session. Repeated immediate/native submissions produce no additional calls. Correct date/time/staff/Location/service/Notes/deposit FormData is recorded. Both contexts have zero page errors, zero unapproved writes and zero external requests.

`issue135-desktop-locked.png` and `issue135-tablet-touch-locked.png` show the preserved #131 payment-failure alert and disabled appointment-booked state. They are local synthetic evidence, not hosted financial acceptance. Physical-device Safari was not retested.

## Isolation and governance

Production behavioral baseline remains `664fbc734c4103d78484c6b3828849a6605a562f`. All lib/, supabase/, app/, providers, hooks, middleware/proxy, package metadata, release controls/policies and Reception visual files are unchanged from the audited parent. Morning Brief and shared Sheet match the parent exactly. Current release registration remains deny-all. No hosted configuration/credential change was made.

Original PR #171, N06 #172 and finance #164 remain Draft/open/unmerged at their protected SHAs; read-only evidence is in `logs/protected-identities.json`. No related workstream was modified.

The new immutable SHA must receive a focused independent delta audit. Later integration must retain it through a TRUE MERGE COMMIT, become main-reachable and receive approved exact-SHA registration and separate Production authorization. Squash/rebase must not replace the artifact. This task performs none of those steps.

GVM CAD $50 deposit collection remains HELD. No push, PR mutation, merge, deployment, hosted SQL/data change, real communication or automatic specialist dispatch occurred. Stop for Darshan's manual Claude delta-audit gate.
