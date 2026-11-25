# GVM-N02 limited UI/currency candidate — LOCAL REVIEW ONLY

## November 25 authorized completion

This supplement supersedes the November 23 preparation blockers only for the authorized local corrections. The earlier report below remains historical evidence. Competitive Product Gate: NOT_APPLICABLE — bounded corrections to locked behavior; no new feature, currency policy or payment architecture.

Base: `b39b2e7ba579e58e0865c139ca1f2ee503c0e8ac`, tree `54e5b1d2b0d454e1a96ac4f7094f26825a68d069`, branch `codex/gvm-n02-production-only`. Historical Production ancestor: `ab4e41f530d2a2da65bda429407e0f84446f9fac`. Remote main freshly observed at `b85ba4a6ba51d81a144037ce6348a3deb63124fb`; it was not imported. Current Production identity was NOT accessed or verified. The immutable successor SHA/tree, source hashes and complete patches are in the external final evidence manifest to avoid a self-referential commit.

Worktree: `/Users/darshan/.codex/worktrees/gvm-n02-production-only/chasum`.
Evidence: `/Users/darshan/.codex/worktrees/gvm-n02-production-only/evidence/final-writer-20261125/`.
Prior blocked evidence: sibling `limited-ui-currency-20261125/`; preserved unchanged.

## Exact boundary and source preservation

- Accepted editor is byte-identical to PR #165 source `70cb4f05c6bf59baf2a90eae5a0d9883a0eee847`: SHA-256 `471907fc25f2e0cc7188f3efdded6c689c14145c38416804caa6eea854edab0f`.
- The five previously prepared currency/workflow/test files retain every recorded byte.
- `lib/actions/appointments.ts` supplies `currency: normalizeCurrency(business.currency)` through the existing helper import. No FX conversion or historical rewrite.
- The ONLY `lib/commerce/payments.ts` change is adding `.eq("business_id", businessId)` after `.eq("id", appointmentId)` on the UPDATE inside `syncAppointmentPayment`. Its scoped SELECT, calculations, ledger, invoice/receipt, provider/refund/store-credit and idempotency behavior are unchanged.
- The original `custom-payment-submission.test.ts`, all overpayment/int4 characterizations, browser test/harness, editor tests, teardown implementation/tests, package/lock files, release policy and deployment config remain byte-identical to the accepted base.
- New tenant-scoping test is `tests/unit/commerce/n02-appointment-business-scope.test.ts`. Four existing continuity/review documents receive bounded supplements. The Environment Manifest is unchanged because no hosted runtime was inspected or changed.
- The full historical-Production comparison is 19 files: three runtime files (editor, booking action, payment writer), two workflows, ten test/helper files and four documents. No N01/N04/N06/N07/N08/T07/T11–T12 or Issue #112 work is included.

## Verification and limitations

| Check | Actual outcome |
|---|---|
| Tenant negative control before writer fix | Expected FAIL: 2 fail / 1 pass; missing predicate and changed-Business row mutation reproduced |
| Focused writer/currency/editor/deposit/teardown | PASS 70/70 in six files |
| Adjacent regression | PASS 600/600 in 71 files, no skips; focused tests included, not additive |
| Original writer assertions | PASS 6/6 unchanged |
| New tenant-scoping suite | PASS 3/3 |
| Currency propagation/characterizations | PASS 9/9 |
| Editor / teardown / deposit-due-now | PASS 17 / 31 / 4, all included in the regression total |
| Chromium / WebKit responsive | PASS 8 each, 16 total; 320/390/834/1280px, light/dark |
| Browser isolation/geometry | Zero external requests, domain writes, page errors and overflow; tested controls >=44px |
| Real normal teardown | Both browsers and HTTP server completed; original 30s/10s/45s deadlines unchanged |
| Missing-binary controls | Two expected failed suites, exit 1; each reports 16 skipped assertions because setup deliberately fails; never counted as a functional PASS |
| Issue #136 tests | PASS 26/26, including 16 workflow/preservation tests |
| Release config / diff check | PASS |
| Focused lint / typecheck | PASS |
| Production build | First attempt exit 1 on Next.js upgrade reminder; identical retry exit 0 with warning retained |
| Linux/Node 22, hosted CI, physical devices, operator acceptance | NOT RUN |
| Hosted database, real transactions, Preview or Production action | NOT RUN / prohibited |

Commands and outputs are retained in `focused.log`, `regression.log/json`, `browser.log/json`, `release-tests.log`, `release-config.log`, `lint.log`, `typecheck.log`, `build.log`, `build-retry.log`, `scope-red.log` and the missing-browser logs/results. Exit files record actual command status. Browser screenshots and metrics are under `browser/`. The 600-regression command covers booking, booking-engine, commerce, reception, calendar, hooks and Sheet focus, excluding the separately executed real browser suite. Whole-repository lint/full test-suite acceptance is not claimed.

Currency evidence executes the real action and legacy writer against an in-memory PostgREST-shaped fixture. Known CAD/normalized CAD/USD values agree across provider input, transaction, customer event and operator success disclosure; untrusted form currency cannot choose denomination. Existing seeded rows remain unchanged. Five fallback characterizations explicitly show that missing/unsupported currency still defaults to USD; that is NOT evidence of USD denomination. Business-resolution failure reaches no writers. No hosted denomination qualification is inferred.

The new tenant tests exercise the real writer through its caller. They cover the authorized Business/appointment update, a foreign appointment rejected by the existing scoped SELECT, and a synthetic Business change between read and UPDATE. The last case fails before the correction and leaves the now-foreign row unchanged afterward. This does NOT establish hosted RLS, database concurrency or whole-payment rejection. The legacy writer may already have committed money and does not detect zero affected rows; those financial limitations remain unresolved.

The first missing-browser evidence wrapper expected an aggregate error title, but Vitest printed its child errors. Its initial result is retained as `missing-browser-initial-verifier.json`; the corrected interpretation uses the same logs, with no test changes or rerun. Chromium/HTTP cleanup completed in the missing-WebKit case; missing-resource cleanup errors remained fatal.

Local runtime: macOS Darwin 25.5.0 arm64, Node 26.7.0, Next 16.4.3, React 19.2.4, Playwright 1.61.1. CI is configured for Ubuntu/Node 22 and both engines with `--with-deps`; actual Linux/Node 22 execution remains a later CI gate.

Next.js compiled and generated all pages on the first build, then its agent-upgrade reminder exited 1. Installed `next/dist/lib/upgrade/nudge.js` implements a one-use normal-command retry; repeating the identical command produced exit 0 and the security warning. No config/env suppression, dependency upgrade or retry-receipt manipulation occurred. The emitted recommendation is to upgrade Next.js for a known security vulnerability. Advisory identity/applicability and remediation are NOT resolved by this task or by build PASS; separately scoped security review/upgrade is recommended before release. Existing middleware deprecation and Node localStorage warnings also remain. No automatic upgrade or agent was started.

## Release-control proof

The approved workflow changes install Chromium plus WebKit and build before the CSS-dependent browser tests. The new release tests compare all other release-workflow semantics to the accepted base digest `9cf7ec13ee58d51f6afc271594ef22db4c5c3e3678c378880021f164103bdd00`. Negative controls reject missing browser installation, skipped/soft-failing tests, reversed ordering, changed protected environment, trusted checkout/source verification, early secret exposure and rollback removal. Existing policy/ancestry/source and build-info tests still pass. This is local preservation proof, not fresh GitHub/Vercel configuration verification.

The trusted `control` checkout and approved `source` checkout remain separate; registration/expiry/ancestry rechecks, protected Production Environment, secret boundaries, pinned tooling and rollback behavior are unchanged. Candidate policy remains deny-all. Single-collaborator mandatory human review/CODEOWNER enforcement remains waived, not active two-person control. No workflow was dispatched.

## Financial holds and next gates

Reject-on-excess remains binding and unimplemented by this limited candidate. Overpayment, concurrent payment safety, cumulative int4 range, partial writes, stored-value denomination, store-credit lost updates, Stripe refund classification/idempotency/webhook finalization, missing automatic stored-value restoration, unproven broader lock order, refund-aware #133 projections and invoice/receipt consistency remain unresolved. Original unsafe characterizations remain passing demonstrations of risk, not acceptance. No Production financial-risk waiver exists.

Darshan's next gate is manual independent Claude exact-candidate delta audit: preserve editor/five pending files, prove the one-predicate writer boundary and negative controls, review currency fallback limits, workflow safety/evidence, financial disclosure and rollback compatibility. Prior architecture audits remain closed and were not rerun. No specialist was dispatched.

Preview publication requires that audit, applicable local evidence, separate PO authorization and the existing protected PR/CI process. Confirm exact Preview source SHA/deployment and separate authenticated operator/device acceptance; READY is not operator PASS. No new Preview URL exists.

Production remains HELD for fresh serving identity, exact-source ancestry reconciliation, required CI/Preview evidence, explicit financial-risk and security review, exact-SHA Issue #136 registration, protected PO approval and compatible rollback. A reviewed true merge must preserve the isolated candidate SHA if integration is later authorized; do not substitute current main or a squash replacement.

Rollback planning retains historical source `ab4e41f530d2a2da65bda429407e0f84446f9fac` and deployment `dpl_Gs291Rjqc3NXqHgFACeqqVeeWwZy` only as dated evidence. Freshly verify the canonical alias, exact prior deployment/source and `/api/build-info` before release; STOP and reconcile any difference. Use only the governed protected release/recovery mechanism, then independently verify restored alias/deployment and build-info. Unknown/failed restoration retains the incident hold. No ad hoc promotion, main reset, financial-data restoration, payment replay or customer communication. A code rollback cannot repair financial records, and restoring the old source also restores the old currency/predicate behavior.

No hosted access/SQL, migration, financial/customer operation, publication, merge, deployment, release allowlisting, automatic agent dispatch or unrelated implementation occurred.

---

# Preserved November 23 historical report

# GVM-N02 Production-isolated candidate — HELD

Prepared 2026-11-23 Toronto / 2026-11-24 UTC. Local synthetic QA only.
Competitive Product Gate: NOT_APPLICABLE — the accepted payment-editor correction is already locked; no new financial policy or workflow is designed.

## Exact source boundary

- Production parent: `ab4e41f530d2a2da65bda429407e0f84446f9fac`, tree `5530cfe7984f16f9f0ac2aeb3c978b925f33d39c`.
- Verified canonical alias: `https://chasum.vercel.app`.
- Alias deployment: `dpl_Gs291Rjqc3NXqHgFACeqqVeeWwZy`, unique URL `https://chasum-4vfb7ao69-renovisionappcom.vercel.app`, READY / production.
- Direct build-info: exact parent SHA, short `ab4e41f`, ref `main`, env `production`, production `true`.
- Accepted N02 source: `70cb4f05c6bf59baf2a90eae5a0d9883a0eee847` from merged PR #165 (merge `85c29d3f39c2b0a82c7f3d1f36f8e5476f0a6a01`).
- Observed remote main: `b85ba4a6ba51d81a144037ce6348a3deb63124fb`. It is not the serving baseline or this candidate.
- Branch: `codex/gvm-n02-production-only`. Candidate identity is the immutable commit containing this report; final local evidence manifest records its full SHA/tree without a self-referential commit.
- Sole runtime change: `components/booking/booking-payment-section.tsx`, byte-identical to accepted source blob `360355176c6249c64694b1c3d71257d94730caa7`; SHA-256 `471907fc25f2e0cc7188f3efdded6c689c14145c38416804caa6eea854edab0f`.
- Transient text permits clear/retype/paste/caret editing; integer cents remain canonical; formatting occurs on blur; parent/mode/pricing synchronization and Enter suppression are preserved.
- Application APIs, writers, React/Next dependencies, taxes, deposits, financial history, invoices, receipts, permissions, RLS, Reception, Calendar, N03/N05 and release controls are unchanged.
- No N01/N04/N06/N07/N08/T07/T11–T12 code is imported.

## Local verification

Evidence directory: `/Users/darshan/.codex/worktrees/gvm-n02-production-only/evidence/`.
Final evidence manifest records hashes of the complete patch, changed files, logs and browser artifacts.

| Check | Result | Evidence / limit |
|---|---|---|
| Exact runtime isolation and accepted component identity | PASS | One runtime file; all other tracked pre-existing runtime/config paths unchanged |
| Typecheck | PASS | `typecheck.log`; inherited tsconfig excludes tests |
| Build | PASS | `build-local-deps.log`; Next 16.4.3, React/React DOM 19.2.4, Zod 4.6.6, macOS Node 26.7.0 |
| Focused lint | PASS | `final-focused-lint.log`; component and all seven test/helper files |
| N02 editor | PASS 17/17 | Original accepted tests unchanged; included in regression run |
| N02 teardown | PASS 31/31 | Original accepted tests unchanged; included in regression run |
| N02 writer and boundary cases | FAIL 1 / PASS 5 | `n02-writer-boundaries.log`; CAD expectation remains intact |
| Adjacent synthetic regression | FAIL 1 / PASS 587, 69 files | `regression.log`; booking/booking-engine/commerce/Reception/Calendar/focus/hooks/release config |
| Chromium + WebKit | PASS 16/16 | `browser.log`, screenshots and `browser/browser-metrics.json`; 320/390/834/1280px, light/dark |
| Browser isolation | PASS | Zero external requests, domain writes, page errors and overflow; controls minimum 44px; real engine teardown completed |
| Release config / standalone release tests | PASS / PASS 10/10 | `release-config.log`, `release-tests.log`; no release invocation |
| Hosted CI, exact new Preview and authenticated operator acceptance | NOT RUN | Publication blocked by financial gate |
| Physical iPhone/iPad/decimal keyboard | NOT RUN | Browser emulation is not physical-device proof |
| Production or customer transaction | NOT RUN | Prohibited |

The first writer invocation lacked its accepted test-only helper; the helper was added unchanged. The first build rejected a dependency symlink outside the worktree; dependencies were copied locally, with package/lock files unchanged. Initial failure logs are retained. No application change was made to cure setup or financial failures.

The build emitted a Next.js security upgrade reminder and middleware deprecation warning. No dependency upgrade or middleware change is included. Advisory identity/applicability requires separate review; build PASS does not discharge it.

## Financial gate — publication and release HELD

1. **Overpayment:** the unchanged action/writer records 15,000 cents against an 11,300-cent appointment/invoice in the synthetic stateful fixture; invoice balance clamps to zero. The new editor makes this inherited unsafe path easier to reach. No overpayment policy, tip/credit/refund accounting or historical correction is authorized.
2. **PostgreSQL range:** source migrations declare integer/int4 money columns. Editor safe-integer checks permit values above 2,147,483,647 cents. Both 2,147,483,647 and 2,147,483,648 reach mocked provider/transaction/appointment writers. The fake is NOT PostgreSQL; it does not establish hosted insertion success or actual current schema. Input and cumulative aggregate range safety remain unresolved.
3. **Production-base currency incompatibility:** the accepted CAD writer test fails because this parent's `createAppointment` omits `currency`, while `recordCommercePayment` defaults to USD. Accepted N02 source's surrounding main contains a currency correction; copying it would change an additional runtime file and breach this task. The original CAD assertion remains failing, not weakened. No claim is made about existing customer records.
4. Invoice/receipt/payment-history discrepancies remain unresolved. Unchanged code and synthetic regression are preservation evidence, not financial-integrity acceptance.

Smallest separate PO decision: authorize a bounded financial-safety design/candidate for verified tenant currency propagation and fail-closed amount/remaining-balance/int4 aggregate validation at trusted writer boundaries, with explicit overpayment policy and independently reviewed invoice/receipt consequences. An editor-only cap cannot establish writer or concurrency safety. Do not import the wider main branch or activate a durable kernel/schema as an incidental fix.

## Repository governance and publication prerequisites

Fresh read-only checks verified ruleset 23730556 active: Vercel(8329), competitive-product-gate(15368), quality(15368), strict checks, PR requirement, thread resolution, force-push/deletion protection. Required approving reviews remain zero and CODEOWNER enforcement remains waived for the single-human model.

The protected `production-release` Environment still names the PO reviewer and protected branches. Repository `vercel.json` retains `git.deploymentEnabled.main=false`. Fresh main policy contains only the prior baseline entry, expired 2026-11-10T23:00:00Z; it does not authorize this candidate. Candidate's own policy remains inherited deny-all. Nothing was changed.

Vercel project SSO remains enabled (`all_except_custom_domains`); project Node setting reports 24.x. Local Node is 26.7.0; Quality requests Node 22. Hosted dependency/OS/runtime evidence is NOT established locally. The connector's project response did not expose effective Production source-policy enforcement; Issue #136's CLI-only evidence is historical and requires fresh revalidation before any future release.

The inherited Quality workflow builds no CSS before tests and installs only Chromium. The added accepted N02 browser suite requires a build first and both Chromium/WebKit. Future publication therefore also requires a separately scoped CI compatibility decision, preserving the approved N02 teardown deadlines and existing controls. No workflow was changed, no CI was dispatched and no Preview was created to bypass these blockers.

Issue #136 exact-SHA ancestry gate also matters: this direct Production child is not current main ancestry. If later approved, integrate by a reviewed TRUE MERGE preserving this exact candidate SHA as an ancestor, then separately register that exact isolated SHA. Neither a current-main deployment nor a squash-created replacement SHA silently satisfies this plan.

## Exact-source rollback plan — design only

Rollback anchor is `ab4e41f530d2a2da65bda429407e0f84446f9fac` / `dpl_Gs291Rjqc3NXqHgFACeqqVeeWwZy` in project `prj_nUq0i5faNZTNYfQHSsLukYTW8ugm`, team `team_aw5zzy06cLSM8sEcqriJ5CIM`.

1. Before any separately approved release, independently read the canonical alias, prior deployment source/target and build-info. Require exact anchor match. If any differs, STOP and obtain a reconciled PO decision; never silently replace this anchor.
2. Future release authorization must identify the exact candidate SHA, unexpired registry entry, Quality/build evidence, protected Environment approval, this previous deployment and the allowed recovery action. Verify current credential capability/expiry without exposing secrets.
3. Use only the existing governed release workflow. Its failure handler uses pinned CLI `vercel rollback <prior_id>` in the protected release context. Planned exact target is the ID above; no rollback command was run here.
4. After rollback, independently require alias `chasum.vercel.app` to resolve to that exact previous deployment and direct `/api/build-info` to match the anchor SHA/short SHA, main ref, production env and true flag. READY or command exit alone is insufficient.
5. If rollback command, alias or build-info verification fails, STOP; retain the recovery hold and evidence, report unknown serving state, and require incident/PO direction. Do not retry release or promote another artifact.
6. If rollback leaves an alias-assignment hold, any later release must acknowledge its exact held deployment through the existing protected workflow. Do not casually clear the hold.
7. Code rollback changes deployment/alias only. Never reverse payments, delete/recreate bookings, edit balances/taxes/invoices/receipts, replay sends, mutate tenants, or roll back data to match old code. Any activity during a future exposure window requires separately governed financial reconciliation. A code rollback cannot repair financial data.

## Independent and Product Owner gates

Darshan may manually dispatch Claude for a bounded audit of this exact isolated commit: source isolation, editor semantics, Production component/dependency compatibility, original tests plus additions, the retained CAD failure, overpayment/range characterizations, unchanged N03/N05/submit guards, CI/ancestry prerequisites and rollback controls. No agent was dispatched and no completed PR #165 audit is reopened.

Next genuine gate is the separate bounded financial-safety/CI decision above, not migration or Production approval. Later gates: independent exact-candidate review; safe governed Draft/CI/protected Preview with source identity; operator/device acceptance; reviewed ancestry-preserving integration; separate exact-SHA registration and PO protected Production approval. All remain HELD.

No push, PR publication, merge, deploy, promotion, allowlist change, customer test, charge, hosted SQL, migration, billing activation, provider send or tenant-data mutation occurred.
