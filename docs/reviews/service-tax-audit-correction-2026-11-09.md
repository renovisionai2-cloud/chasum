# P1 service tax — bounded audit correction

Date: 2026-11-09. Owner: Codex, primary implementation engineer. **CONDITIONAL PASS for local engineering only; launch and Production correction remain blocked.** This report supersedes the implementation-status and next-gate statements in the preserved [original report](service-tax-integrity-2026-11-09.md). It does not supersede accepted financial or Product Owner decisions.

## Candidate and authority

- Worktree: `/Users/darshan/.codex/worktrees/service-tax-integrity-local/chasum`; branch `codex/service-tax-integrity-local`; uncommitted base `4a394a9f290dca9377d68f2c704b0338277625d8`.
- Original audited patch SHA-256: `b1c4a791e85cf32e98b90b0c7c56f1f14bb934ffddb800e6dfb3ffe30e237e9b`.
- Original [candidate manifest](../validation/service-tax-integrity-2026-11-09/candidate-manifest.json), 21 candidate files and all 85 original evidence-manifest entries verified before edits. Original evidence manifest SHA-256: `d0c909b6456b80fff813e4def34dc3ac7fa07dca0ef3aec10f6884dc4921abf6`.
- [Revised candidate manifest](../validation/service-tax-integrity-audit-correction-2026-11-09/candidate-manifest.json) binds the one final patch, complete file inventory and base. [Evidence manifest](../validation/service-tax-integrity-audit-correction-2026-11-09/evidence-manifest.json) binds supporting evidence. Evidence directories are deliberately outside the candidate patch to avoid recursive self-hashing.
- Preflight confirmed the existing worktree, ownership, branch/base, original patch and tracked/untracked inventory without drift. GitHub main freshly matched the expected base. No reset, commit, push, PR, CI dispatch or automatic specialist dispatch.
- The supplied audit reused a Cursor-hosted Claude session. Its findings are substantive technical evidence; **fresh-session independent review remains required**. The supplied audit summary/brief and all original candidate source are preserved under the revised evidence directory's `original/`. A separate full Claude transcript was not supplied; this package does not invent one.
- Competitive Product Gate: **NOT_APPLICABLE** to this bounded financial bug correction and operator containment. A future broader exemption/zero-rating product contract needs its own applicability decision. Launch classification remains P1 / LAUNCH REQUIRED / RED.
- Production source `ab4e41f530d2a2da65bda429407e0f84446f9fac` is the supplied/prior verified reference, distinct from main. No new hosted read was needed in this correction pass. No claim of fresh deployment-ID/alias proof.

## Audit findings C1–C7

### C1 — containment PASS; complete tax-treatment contract OPEN / LAUNCH REQUIRED

Removed the ignored Taxable checkbox. The local editor says: **“Tax exemptions are not currently supported. The tax rate above applies.”** Human percentages, business-rate inheritance and explicit-zero rejection are unchanged.

Updates omit `taxable` entirely, including compatibility retry, preserving either stored boolean and any concurrent edit. Creation explicitly retains the existing true default; absence of a disabled/removed checkbox cannot silently write false. Legacy forms that still submit the retired key fail before writing with “Refresh the service form. Tax exemption settings are not editable yet.” Compatibility retry still preserves tax_rate_bps and the create default. This is containment, not exemption support, a data backfill or a policy change.

Separate design decision required before launch: approve distinct inherit/custom taxable, exempt and zero-rated states; explicit-zero versus inheritance representation; policy provenance, jurisdiction and effective-date rules; and the meaning/transition of existing true/false values. Specify consistent service editor, session writer, public SQL/RPC, package, durable snapshot, invoice/receipt and notification behavior. Preserve historical cents and provenance; do not retroactively reprice. Include inclusive/exclusive and low-rate rounding, zero/default/free bookings, tenant/package ownership, concurrent edits and failure semantics in acceptance. Any schema/SQL migration or historical transition requires separate scope and approval. This report does not choose tax classifications or introduce that engine.

### C2 — PASS locally

Self-contained `service-tax-teardown.ts` starts Chromium and WebKit close concurrently, each with its own 30-second deadline, then attempts Vite close with a 10-second deadline. Hook budget is 45 seconds. Every result is explicitly completed/rejected/timed_out; a rejected undefined value cannot look like success. Synchronous throws and late promise rejection are handled; timers clear on every outcome. Structured resource and fixture BEGIN/COMPLETE/ERROR diagnostics distinguish timeout from confirmed close. Any failed close rejects teardown; timeout records terminationConfirmed=false, never a claim that the browser terminated.

Nine focused tests cover success/concurrency/order, rejected undefined/null/Error, synchronous throw undefined, two stalled browsers plus stalled Vite, late rejection, Vite rejected undefined and throwing diagnostics. The stalled case reaches Vite at 30 seconds and fails by 40 seconds under controlled timers. All 12 original responsive cases remain, with additional assertions that the ignored checkbox is absent and the containment copy is visible. The protected #190 helper is not imported; its separately reported false-PASS defect remains outside this task. The 64 Reception cases and their fixture are unchanged.

### C3 — column-existence precondition SATISFIED by supplied independent observation

Darshan supplied the separately verified read-only Production schema result: appointments.price_cents, tax_cents, deposit_cents, payment_status and amount_paid_cents all exist. No repeat query was performed. This is not a new assertion about RLS, deployed writer behavior, transaction atomicity, legal treatment or approval to write. The fail-closed refusal to strip financial columns remains intact.

### C4 — neutral label PASS; genuine-mismatch copy decision OPEN

Unknown historical rate/name provenance, or metadata that contradicts internally consistent saved cents, now produces neutral **“Tax”** with the saved tax amount. It does not produce “Financial review” solely because a rate cannot be verified. Both booking-delivery and receipt context producers leave historical rate/name null. Supported explicitly supplied metadata still uses the existing rounding consistency guard; arithmetic agreement alone is not evidence of historical provenance.

The existing local candidate still renders “Financial review: Financial amounts need review.” for actual total arithmetic mismatch. That wording is **not approved for release**. Proposed replacement, for Product Owner review only:
- Customer heading: **“Appointment total”**. Message: **“Please contact [Business name] to confirm the appointment total.”**
- Operator heading: **“Amount mismatch”**. Message: **“The stored subtotal and tax do not match the displayed appointment total. Review the original financial records before correcting the amount or collecting a balance.”**

Exact current trigger: subtotal and tax are present, nonnegative safe integers; the template-resolved total is present; total !== subtotal + tax. Appointment templates resolve total from appointmentTotalCents, then amountCents, then subtotal plus tax. Receipt templates resolve total from appointmentTotalCents, then subtotal plus tax, then amountCents. Missing rate/name alone is never this trigger. Missing subtotal/tax means arithmetic is unverified, not proven inconsistent. No amount is repaired, recast as paid or changed by the warning; receipt amount-received remains its recorded value. Proposal is not implemented, approved or sent. Approving audience-specific copy requires a later bounded implementation and template regression pass; no outbound workflow is activated here.

### C5 — PASS locally

Removed today's tax catalog lookup and rounded tax/subtotal inference from `buildReceiptEmailContext`; taxRateBps and taxLabel remain null. No monetary expression, receipt/payment writer, status transition or send invocation changed.

Five tests exercise the real receipt context and template with synthetic read-only records: contradictory current13% versus stored15 cents; stored1508 cents even when today's13% numerically matches; no active catalog (previously inferred a ratio); missing subtotal/total; and wrong-tenant refusal before transaction reads. Recorded receipt5000, subtotal11600, stored tax15 or1508, total11615 or13108, paid/deposit5000 and remaining balance are preserved. No tax_rates query occurs and no mock row changes. Red proof before the fix was four failing assertions/one passing tenant test; all five pass after the fix. Synthetic red output is retained as expected regression reproduction, not a final failure.

### C6 — PASS locally

Source search found `bpsFromPercentInput` only at its unused export before removal and no source/test callers afterward. Removed that invalid-to-zero conversion. Strict percentage parsing/action rejection remain; malformed, negative, out-of-range, unrepresentable-precision and ambiguous input still fail closed. No replacement permissive conversion was introduced.

### C7 — OPEN; acceptance boundaries unchanged

All new evidence is local macOS / Node26.7.0 / Next16.3.6 with synthetic I/O. Linux Node22 exact-candidate CI, real iPhone/iPad, Safari-specific device behavior, operator acceptance, fresh-session independent audit and Production runtime validation have not run. They are not implied by local PASS. Full lint's previously observed29 errors/11 warnings were in unchanged baseline files; changed-file lint is the scoped fresh check, not a claim of repository-wide lint acceptance.

## Verification

See the revised [evidence README](../validation/service-tax-integrity-audit-correction-2026-11-09/README.md), validation-results.json and preserved command logs for exact counts, commands, exit status and browser teardown records. Focused correction suite: 6 files /78 tests PASS. Typecheck, lint of all 11 correction code/test files, Production build and release-control config plus10 Node tests PASS. The expanded scoped run includes the original financial, booking, communications, services and notifications coverage plus all64 Reception and12 service-editor cases, new teardown/receipt tests and release-control Vitest tests.

The expanded run completed: **108 files /1,285 tests PASS, zero failures or skips**, including all64 Reception and all12 service-editor browser cases. Actual service teardown logged both concurrent browser BEGIN events, both COMPLETE outcomes, Vite BEGIN/COMPLETE and FIXTURE_TEARDOWN_COMPLETE. No claim that a simulated timed-out close terminated its process; actual closes and negative-path timer evidence are separate. No tests, assertions or skips were removed to obtain a pass. Git diff whitespace/integrity, original evidence retention, patch reverse applicability and complete tracked/untracked inventory are bound in the revised package.

## Exact delta and preserved scope

The revised manifest's purpose/status entries enumerate every final candidate file. changes-from-audited.json and changes-from-audited.diff separately identify the correction delta against the original21-file snapshot (or base for newly touched files).

Correction code/test files:
- components/services/services-manager.tsx — remove ignored Taxable control; state limitation.
- lib/actions/services.ts — retain create default, preserve update boolean, reject retired submissions.
- lib/commerce/receipts.ts — remove unsupported receipt rate/name attribution only.
- lib/commerce/stored-tax-display.ts — neutral label without rate-only warning.
- lib/commerce/tax-rate-percent.ts — delete unused fail-open export.
- tests/unit/services/service-tax-action.test.ts — flag/default/compatibility/retired-input preservation.
- tests/unit/services/service-tax-responsive.test.ts — bounded teardown and additional containment assertions; original12 cases retained.
- tests/unit/services/service-tax-teardown.ts — fixture-local bounded cleanup.
- tests/unit/services/service-tax-teardown.test.ts — nine meaningful success/negative cleanup tests.
- tests/unit/commerce/receipt-tax-provenance.test.ts — five real-context rendering/tenant regressions.
- tests/unit/communications/stored-tax-consistency.test.ts — neutral rate-only rendering; amount/rounding cases retained.

Continuity delta: docs/CURRENT_PROJECT_STATE.md, docs/handoffs/LATEST_HANDOFF.md, docs/runtime/ENVIRONMENT_MANIFEST.md and docs/CHANGELOG.md plus this report. Original implementation report, percentage editor, accepted session repricing/quote rejection, booking tests, notification context correction, rendering integration and commercial-readiness fixtures remain byte-identical to the audited candidate.

## Product Owner decisions, launch blockers and next authorization

Accepted #48 invoice behavior, #133/#134 financial work, EXACT / HELD / UNKNOWN, held deposits, public RPC and durable snapshots are not reopened. No SQL, migration, release registry/workflow, protected #190/#188/#187 or immutable N06 changes. Main is not automatically the accepted Production hotfix source. GVM service override, original appointment, ledger, invoice, receipt, sent email/SMS and all hosted data remain unchanged.

Remaining launch/release blockers: complete taxable/exempt/zero-rated contract; approval and implementation of genuine-mismatch copy; historical provenance/disclosure requirements; prior catalog concurrency/default-selection/source-strategy questions; fresh-session exact-candidate independent review; Linux Node22 CI and required device/operator acceptance; and separate approved service correction/historical reconciliation. This patch neither fixes the existing13-bps configuration nor establishes customer liability.

**Next authorization:** Darshan manually authorizes and dispatches a fresh independent Claude session to audit the exact revised patch/base/manifests. State is PLANNED, not SENT/ACCEPTED/RUNNING; no agent was launched. Separately obtain PO decisions on mismatch copy and the broader launch-required tax contract. Publication/commit/push, source/backport selection, exact-SHA release registration and protected Environment approval, data correction, historical reconciliation and customer communication each retain their later distinct gates. No further engineering authority is inferred from completion of this local pass.

