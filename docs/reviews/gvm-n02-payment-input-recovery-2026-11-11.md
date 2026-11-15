# GVM-N02 payment input recovery — 2026-11-11

Status: **LOCAL CANDIDATE / INDEPENDENT AUDIT PENDING / RELEASE HELD**.
Owner: Codex, sole primary implementer. Product Owner: Darshan. No specialist dispatched.
Competitive Product Gate: **NOT_APPLICABLE** — bounded correction of the locked custom-payment editor; no new payment workflow or financial policy. Classification: **LAUNCH REQUIRED**, normal technician payment editing is part of the financial workflow.

## Authority and identity

Darshan authorized local investigation, integration and testing, then explicitly permitted a local two-parent integration commit. No remote publication or GitHub merge is authorized.

- Repository: `renovisionai2-cloud/chasum`.
- Verified main / first parent: `e6d89424f303b562f6cc1586b898ec104653d4bc`.
- Existing Draft PR #165 / second parent: `f25ce228d974195fa8d77f7cd36de81e0de0f943`.
- New worktree: `/Users/darshan/.codex/worktrees/gvm-n02-payment-input-recovery/chasum`.
- New branch: `codex/gvm-n02-payment-input-recovery`.
- Protected Draft PR #191: `39709ba82301bf0d7ce04afd5cc2d7cb20a14d71`.
- Protected Draft PR #164: `e76839182e5255102fe15e1bd9b0085d2b382057`.
- Original N06 checkout: `f8c836370967473a2c46a08be8f4abfb750dae85`.

Both main and #165 are retained as actual parents, without rebase, squash or cherry-pick. The merge has no conflicts. The payment component on main is byte-identical to #165's parent, so its original correction transfers without reinterpretation. The immutable final candidate SHA/tree and source/evidence hashes are recorded in the separate LOCAL ONLY candidate manifest and final delivery report, avoiding a self-referential commit restamp.

## Bounded change

Only `components/booking/booking-payment-section.tsx` changes in application source. PR #165's transient editing string, decimal text input, blur formatting, parent synchronization and Enter suppression are retained. Its eleven tests are preserved verbatim as the initial test block.

A reproduced numerical boundary defect is additionally corrected: converting the whole decimal to a Number before multiplying could lose a cent at large values, publish an unsafe integer, or turn an overflowing paste into zero. Separate whole/fraction integer parsing, safe-integer rejection and quotient/remainder formatting preserve exact cents. This is a representability guard, **not an appointment-total cap, a database-range guarantee or financial-policy decision**. Invalid text is ignored using the existing editor behavior.

Six additional editor/submission cases, four synthetic action-to-writer cases and sixteen real-browser cases supplement the original tests. The browser fixture bundles the actual component with the repository's existing Vite tooling, uses built Chasum CSS/fonts, blocks external/non-GET requests, and submits only to an in-memory form capture. The action tests reuse the in-memory financial database fake; no real database, provider, notification or financial record is touched.

## Validation

Local runtime: macOS, Node **26.7.0**, Next **16.3.6**, React **19.2.4**, Vitest **4.1.10**. Dependencies were privately copied from the existing #191 integration worktree; package/lockfiles match main, and no dependency or environment file changed.

| Check | Result |
| --- | --- |
| Original #165 focused tests on current main | 11/11 PASS |
| Added boundary tests before correction | 4 reproduced failures, 13 passed; retained as diagnostic evidence |
| Final focused amount tests | 17/17 PASS |
| Synthetic unchanged action-to-writer tests | 4/4 PASS, including characterization of the unresolved overpayment behavior |
| Focused + adjacent serial suite | 105 files / 1,268 tests PASS / zero failed / zero skipped; includes the 17 + 4 cases above |
| Browser matrix | 16/16 PASS: Chromium + WebKit, 320/390/834/1280px, light/dark |
| Typecheck | PASS |
| Changed-source/test lint | PASS |
| Repository lint | 29 errors / 11 warnings; all affected files byte-identical to main; NOT GREEN |
| Local Next production build | PASS; no deployment |
| Release configuration validator | PASS |
| Offline release-control tests | 10/10 PASS |
| Diff whitespace and protected-source checks | PASS |

Browser cases verify clear/retype, `75.00`, `10.25`, `0.01`, `.5`, `10.` + blur, native copy/paste, invalid text/extra precision, arrow/Delete middle edits and caret location, Enter suppression, captured submission, tax/deposit/pricing hidden fields, method/note/receipt, deposit/full/custom/none modes and external parent updates. All measured amount/method/note/radio/receipt label controls are 44px high. No page overflow, page/console errors, external requests or domain writes occurred. Representative Chromium light and WebKit dark phone screenshots were visually inspected.

The first matrix exposed the harness's Home-key assumption on macOS WebKit. A portable arrow-key sequence fixed the test while preserving its assertions; all final cases execute without skips, retries, global timeout increases or application changes. Earlier harness-development failures remain in the evidence. Desktop WebKit at phone widths is **not physical iPhone/iPad acceptance** or an on-screen decimal-keyboard/zoom proof. Full authenticated Booking Sheet/Quick Appointment device acceptance and hosted Linux/Node22 CI were not run under this local-only dispatch.

Commands (from the new worktree):

- `npm run test -- tests/unit/booking/custom-payment-amount-input.test.tsx --maxWorkers=1`
- `npm run test -- tests/unit/booking/custom-payment-submission.test.ts --maxWorkers=1`
- `CHASUM_N02_EVIDENCE=<local-output> npm run test -- tests/unit/booking/custom-payment-amount-browser.test.ts --maxWorkers=1`
- `npm run test -- tests/unit/booking tests/unit/commerce tests/unit/communications tests/unit/notifications tests/unit/access tests/unit/hooks tests/unit/reception/payment-result-disclosure.test.tsx tests/unit/api/appointment-tenant-integrity.test.ts --exclude tests/unit/booking/custom-payment-amount-browser.test.ts --maxWorkers=1` (browser matrix executed separately above).
- `npm run typecheck`; `npm run build`.
- `npx eslint components/booking/booking-payment-section.tsx tests/unit/booking/custom-payment-amount-input.test.tsx tests/unit/booking/custom-payment-amount-browser.test.ts tests/unit/booking/custom-payment-submission.test.ts tests/unit/booking/payment-input-browser/entry.tsx`.
- `npm run lint -- --format json` (inherited findings retained).
- `node scripts/verify-release-control-config.mjs`; `node --test tests/release-control/*.test.mjs`; `git diff --check`.

## Overpayment inconsistency — unresolved, no writer changes

Static trace and synthetic runtime evidence agree:

1. `lib/actions/appointments.ts:createAppointment` accepts positive custom cents and calls `createBooking` without a durable persistence strategy. Empty/zero custom amounts with the existing payment idempotency key fail before booking.
2. `lib/booking-engine/mutations/create.ts:createBooking` defaults to session persistence. The existing action subsequently calls `recordCommercePayment`; it does not route this payment through the durable SQL operation.
3. `lib/commerce/payments.ts:recordCommercePayment` requires positive safe integer cents but does not enforce appointment subtotal + tax as a payment ceiling. The in-memory test records **15,000 cents against 10,000 subtotal + 1,300 tax**, retaining the 15,000-cent transaction and appointment paid amount; the invoice balance becomes zero. This is characterization of existing behavior, not permission to collect an overpayment.
4. `supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql` lines 607–642 reject a non-none payment above subtotal + tax and enforce deposit/full equality. That SQL contract is source-inspected only; no migration, database or hosted SQL test was run.

No cap, clamp, credit, refund, tip, deposit exception or writer cutover was invented. No payment writer or SQL changed. The safe-integer editor bound does not resolve this discrepancy or the narrower database integer range. Existing weak booking/payment deduplication remains inherited; the idempotency fields/guards and adjacent tests are preserved, not upgraded to an exactly-once guarantee.

**Release remains HELD pending independent financial-risk review and a separately authorized policy/writer disposition.** This editor recovery is not GVM deposit acceptance.

## Protected boundaries and continuity

All application source outside the one payment component is byte-identical to verified main. Payment writers, booking idempotency, service prices, tax helpers, tenant enforcement, financial records, payment methods, communications, Summer, N06, SQL/migrations, dependency/config/release paths remain unchanged. PR #191's tax implementation and approved customer/internal wording are unchanged in its own protected branch/worktree; they are **not imported into this main-based candidate** and no combined tax acceptance is claimed. Main's existing communications remain byte-identical.

The main release registry is preserved exactly: it contains the historical `ab4e41f...` entry expiring `2026-11-10T23:00:00Z`; N02 is not registered. Do not describe the actual file as an empty registry. Production serving identity was not probed in this task; dated accepted observations remain historical. No runtime environment changed, so the Environment Manifest is unchanged. The short control board, handoff and changelog receive only this local N02 continuation.

LOCAL ONLY evidence is in `test-results/gvm-n02-recovery-2026-11-11/` under this worktree. It is ignored and not a committed Markdown-link target. It contains command logs, screenshots/metrics, source comparisons, lint baseline proof, immutable source patch, candidate identity and an evidence checksum manifest. No evidence is published.

## Next independent audit gate

State: **PLANNED / NOT DISPATCHED**. Darshan manually dispatches Claude Opus 5 High as independent high-risk reviewer. Audit the final immutable local SHA against main and original #165, verify both ancestry parents and the one-component application boundary, challenge decimal/caret/parent-state/integer-cent behavior, preserve all original eleven tests, reproduce bounded validation, inspect overpayment characterization and judge its release impact. Verify #191 tax/audience wording, #164, N06, Summer, writers and release controls remain untouched.

Use this report, AGENTS.md, Current Project State, Latest Handoff, Environment Manifest and the Chasum Bible as sources. Read-only audit only: no implementation, remote mutation, release, database/provider operation or specialist dispatch. Return the entire audit in one Markdown code block to Darshan for ChatGPT reconciliation. Publication, GitHub merge, hosted/device acceptance, any financial-policy/writer correction and Issue #136 exact-SHA Production approval remain separate gates.
