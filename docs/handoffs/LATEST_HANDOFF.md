# Chasum — Latest Development Handoff

**Updated:** 2026-09-19 by Cursor (temporary #54 / PR #55 hosted-acceptance source-of-truth docs closeout). **Owner:** Control Tower.
**Purpose:** Recover the next action in 5–10 minutes without historical chat access.
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md). This handoff explains that board; it does not own a second current-state table.
**Implementation status:** Issue #51 / PR #52 is CLOSED / PRODUCTION VERIFIED. Issue #48 / PR #49 and Issue #46 / PR #50 remain CLOSED / PRODUCTION VERIFIED. HQ connected-chain Phase 5 gate is MET. Automatic environment collection remains SPECIFIED / NOT IMPLEMENTED. Issue #54 / PR #55 application code is technically release-ready on `a773772309aab9604cd46ba07cb2ca69f3c51989` after hosted Preview/Staging acceptance **B — PASS WITH NON-BLOCKING LIMITATIONS**. PR #55 remains OPEN / UNMERGED and is not Production-authorized. Issue #54 remains OPEN. Issue #53 is parallel release-governance work and is not this PR.

## A. Current control-tower state

Phase 5, Production Pin and Design-Partner Pilot Stabilization, remains IN PROGRESS.
Issue #54 Trusted Operator Access V1 / PR #55, branch `feat/trusted-operator-access-v1`, remains OPEN / UNMERGED and is not Production-authorized. Hosted Preview/Staging acceptance on exact application HEAD `a773772309aab9604cd46ba07cb2ca69f3c51989` is **B — PASS WITH NON-BLOCKING LIMITATIONS** (5744195939 / 5744211544). Critical results passed: Preview runtime identity, Staging Supabase only, fresh Resend, token-hash callback, User A→B replacement in the same browser, correct Chasum HQ landing, no auto-create, no Sam's Auto / GVM / cross-tenant leakage, `/owner` denied, `/dashboard/hq` protected, operational surfaces loaded, delegated Trusted Admin could not manage Trusted Access, revoke blocked tenant data, re-invite reused the same Auth identity with exactly one membership, cross-tenant invite refused, final disposable Trusted Admin revoked, no Production/GVM mutation. Application code is technically release-ready. Product Owner has **not** approved Production merge/deploy or a real GVM grant. Issue #51 / PR #52, Issue #46 / PR #50 and Issue #48 / PR #49 are CLOSED / PRODUCTION VERIFIED and must not be reopened. Issue #53 is parallel and must not be implemented in the #54 PR.

PR #43, PR #44, PR #45, PR #49, PR #50 and PR #52 are accepted and closed. Do not create another restamp merely to chase a changing docs-merge SHA. PR #45 established the permanent continuity foundation; later main now includes the accepted PR #52 runtime. Current accepted main/Production SHA is `cd735943518fda25be0bcc7e9f697b09b29fca9a`.

HQ connected-chain Phase 5 gate: MET. Phase 5 overall waits ONLY for the next legitimate GVM Production booking plus customer confirmation email once and business new-booking email once. Dual-email observation is still waiting. Do not create a synthetic GVM Production booking. Do not send a real GVM Trusted Admin invite from this candidate.

The current board owns task/branch/PR identity. The [manifest](../runtime/ENVIRONMENT_MANIFEST.md) owns environment observations. Read actual GitHub PR state, not stale instructions in a merged PR description. Legacy open PRs are not automatically the next task. True employee RBAC remains DESIGN FOR NOW / BUILD LATER; #54 is not commercial RBAC.

## B. Recent completed work

| Work | Accepted scope | Evidence |
| --- | --- | --- |
| PR #41 | Cancelled terminal; notes-editable only; canonical explicit-confirmation cancellation preserved. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/41), [historical board](archive/CURRENT_PROJECT_STATE_20260917_PRE_CONTINUITY.md). |
| PR #43 | Completion/no-show events require real transitions; retained status + moved range emits rescheduled with previous start/end; unchanged range emits updated. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/43), [changelog](../CHANGELOG.md). |
| PR #44 | Only current-state/changelog docs changed; reviewed and merged trees equal; application files unchanged. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/44), manifest P44 observation. |
| PR #45 | Permanent development continuity foundation. MERGED / ACCEPTED / CLOSED. Documentation only; collector remains SPECIFIED / NOT IMPLEMENTED. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/45), [release evidence](https://github.com/renovisionai2-cloud/chasum/pull/45#issuecomment-5722300751). |
| PR #49 / Issue #48 | Exclusive-tax invoice integrity. CLOSED / PRODUCTION VERIFIED. Hosted Staging financial chain WAIVED FOR THAT RELEASE ONLY / NOT DEMONSTRATED. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/49), [closeout](https://github.com/renovisionai2-cloud/chasum/issues/48#issuecomment-5736361422). |
| PR #50 / Issue #46 | Omitted-status preservation. CLOSED / PRODUCTION VERIFIED. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/50). |
| PR #52 / Issue #51 | Customer billing truth. CLOSED / PRODUCTION VERIFIED. Ordinary payments are not summarized as deposits when configured deposit is zero; Balance chip uses stored remaining. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/52). |

Prior validation: Codex reported 42 focused tests and static/build checks. Claude's corrected independent audit retained A — PASS, 39 selected tests and 601 broader tests across 58 files; the broad run retained aggregate output, not per-file results. ChatGPT inspected repository evidence, not those test executions. Do not repeat that investigation for orientation.

PR #43 hosted Staging lifecycle-mutation smoke was **NOT RUN / EXPLICITLY PO-WAIVED for that release only**. It was not passed and is not a future blanket waiver. PO explicitly accepted configured reschedule communications when completed/no_show status is retained but time changes. That did not introduce silent historical correction or establish distributed exactly-once/concurrency guarantees.

## C. Accepted decisions and source authority

| Rank | Document | Owns |
| --- | --- | --- |
| 1 | [CHASUM_BIBLE](../company/CHASUM_BIBLE.md) | Product/architecture constitution; deliberate PO-governed amendments. |
| 2 | [CURRENT_PROJECT_STATE](../CURRENT_PROJECT_STATE.md) | Sole current program board and exact NEXT. No competing CURRENT_STATE.md. |
| 3 | [ENVIRONMENT_MANIFEST](../runtime/ENVIRONMENT_MANIFEST.md) | Expected vs observed runtime facts, evidence age and differences. |
| 4 | This handoff | Recovery instructions, rationale and continuity governance. |
| 5 | [LAUNCH_READINESS](../LAUNCH_READINESS.md) | Launch-criticality, 18 workstreams and gates. |
| 6 | [MASTER_ROADMAP](../company/MASTER_ROADMAP.md) | Strategic sequence. |
| 7 | [MASTER_TASKS](../company/MASTER_TASKS.md) | Actionable backlog, not a competing release board. |
| 8 | [CHANGELOG](../CHANGELOG.md) | Completed history. |
| 9 | [TECHNICAL_DEBT](../TECHNICAL_DEBT.md) | Debt, not automatic execution authorization. |

COMPANY_MEMORY is durable product context. Historical release summaries and Cursor-primary language in older documents are superseded by the current board and PO-locked agent policy here. Archives are evidence, never current execution queues.

**Observation is not approval.** Fresh runtime/repository evidence wins when determining what exists. It cannot approve a policy change or legitimize an unauthorized deployment. On conflict, retain expected and observed values, mark DRIFT/UNKNOWN, isolate the affected unsafe action, reconcile the source-of-truth, and seek consequential approval when required. Never silently reset branches or rewrite accepted decisions to fit an observation.

Cancelled remains terminal and notes-editable only. First cancellation stays Quick Actions → confirmation → cancelAppointment → cancelBooking. Generic updateBooking must not become that route.

## D. Active risks and exact engineering continuation

**In-flight candidate (temporary Cursor fallback):** Issue #54 Trusted Operator Access V1, `feat/trusted-operator-access-v1`.
**PRIMARY NORMAL OWNER:** Codex.
**TEMPORARY EXECUTION OWNER:** Cursor.
**REASON:** Codex capacity unavailable.
**SCOPE:** documentation-only source-of-truth closeout for hosted acceptance B. Do not change application/runtime/test/package files. Do not merge.
**PASS CONDITION:** docs match hosted evidence 5744195939 / Control Tower 5744211544; application tree remains `a773772309aab9604cd46ba07cb2ca69f3c51989`; PR stays unmerged; Issue #54 stays open; no Production/GVM mutation.
Codex remains the permanent primary engineer. This candidate is unmerged and not a Production authorization. If Codex capacity returns during this task, Codex must not race or duplicate Issue #54. Codex resumes default ownership on the next engineering task.

**Authority:** Control Tower hosted acceptance 5744211544; hosted evidence 5744195939; implementation authority 5738099117; token-hash callback 5742803473; session-cookie propagation 5743594318; ordered Set-Cookie forwarding 5743814476. Cursor design 5737958434. Architecture review 5738005189. Claude independent audit 5738066916 / final audit 5743974268. **Risk:** Level 3. No Production merge or real GVM grant authorized. Controlled Staging test Trusted Admin `chasum1215+pr55ta@gmail.com` is **REVOKED**: Auth identity remains; no active Chasum HQ Trusted Admin membership; no manual Auth-user delete or metadata edit.

Non-blocking hosted limitations (security PASS; not Production blockers; not claimed fixed):
1. UX / state-reporting: after revoke/ban, User B landed `/login` rather than authenticated `/access-denied`. HQ data was unavailable; no auto-create; no cross-tenant access.
2. One-time-link replay UX: replaying a used magiclink can leave `?error=auth_callback_failed` on an already-authenticated User B dashboard tab. User A was not restored; first valid replacement succeeded.

Start from freshly verified canonical main `cd735943518fda25be0bcc7e9f697b09b29fca9a`. If it advanced, report the delta and reconcile the implementation base before proceeding; never reset/force-push to satisfy an old handoff or create duplicate work. Older `30d7de3...` / Issue #51 resume instructions are stale for current start.

Locked product truth: Trusted Admin is full tenant-admin access inside one Chasum business during Private Alpha. It is not receptionist access, employee permission checkboxes, Platform Admin, or `/owner`. True employee RBAC remains DESIGN FOR NOW / BUILD LATER.

Remaining Issue #54 sequence: Control Tower exact docs-delta review → Product Owner Production merge/deploy approval → controlled Production deployment → verify exact Production serving SHA/runtime → separate Product Owner approval for the REAL GVM Trusted Admin grant → in-product Trusted Admin flow only → GVM operator/iPad login acceptance → real GVM operation → legitimate Production booking → customer confirmation exactly once → business new-booking email exactly once → Phase 5 closeout if clean. No historical grant script. No manual Production SQL/Auth edits. Do not mark Phase 5 complete because hosted #55 passed.

Other risks remain separate: GVM legitimate Production booking + dual-email observation (passive wait); Issue #53 branch protection; residual owner_id-only RLS on communication_history / communication_follow_ups / business-assets (non-blocking unless Calendar/Reception/customer-search/booking unexpectedly fail); cross-account Auth TD-H10; configuration TD-H11. No new Production P1 incident is established by this continuity work.

## E. Environment state

Read the manifest. Do not create another live inventory of deployments, queue counts, flags or migrations. This documentation task performed no database/provider/Auth/configuration mutation or privileged live verification. Staging SHA/deployment and restricted runtime fields remain UNKNOWN, not failed or healthy by assumption.

Protect GVM, normal HQ, the Staging evidence appointments and historical queues. No synthetic GVM Production booking, real GVM Trusted Admin invite, worker invocation, queue cleanup, migration replay, credential work or alias movement is authorized. Temporary NON-PRODUCTION acceptance configuration still exists and must not be removed in this docs closeout: branch-scoped Preview `RESEND_API_KEY`, branch-scoped Preview `NEXT_PUBLIC_APP_URL`, and a Staging Auth redirect allowlist entry for the PR #55 Preview alias. Preferred later cleanup is a separate controlled task after Production release is verified and no further PR #55 hosted retest is needed. Do not touch Production configuration. True employee RBAC remains DESIGN FOR NOW / BUILD LATER.

## F. Agent governance — PO locked (NO-IDLE / AGENT FALLBACK)

ChatGPT = Control Tower / Product & Development Lead: scope, strategy, drafting, source reconciliation and sequencing.
Codex = PRIMARY NORMAL ENGINEERING IMPLEMENTER.
Claude = large-context reviewer / independent auditor where risk warrants.
Momentic = repeatable browser/workflow regression.

If Codex is genuinely unavailable because of capacity/credit/service limits, Control Tower may temporarily transfer ONE fully bounded critical-path implementation to Cursor when:
- architecture is already decided;
- scope is fully specified;
- tests/pass condition are known;
- waiting would unnecessarily block Chasum;
- Cursor can execute safely.

Record for that transfer: PRIMARY NORMAL OWNER: Codex; TEMPORARY EXECUTION OWNER: Cursor; REASON: Codex capacity unavailable; SCOPE: exact task; PASS CONDITION: exact task.

ONE PRIMARY IMPLEMENTER PER TASK remains mandatory. Codex and Cursor must never race the same task. Once Cursor takes a bounded fallback implementation, Cursor owns that candidate through bounded delivery/amendments unless Control Tower explicitly stops it. When capacity returns, Codex resumes default ownership on the NEXT task.

This policy supersedes older wording that Cursor may be used only for local/authenticated/device-specific exceptions, and older “Codex sole implementer with no fallback” wording.

Do not move a denied action between tools to bypass its control. Darshan should make genuine PO decisions, not reconstruct state or perform unnecessary technical diagnostics.

## G. Codex credit policy

Luna: necessary mechanical/simple repository tasks. Terra: default engineering. Sol: genuinely complex engineering after justified escalation. Astra/highest: exceptional severity/complexity, not importance alone. Use the cheapest capable model; record intended and actual model separately. Do not silently map model names, escalate, or repeatedly troubleshoot a picker.

Do not spend Codex on rewriting, strategy, competitor research, handoffs, whole-history reconstruction, documentation formatting, repeated investigations or Momentic-suitable browser checks. ChatGPT prepares bounded facts; Codex implements. A credit block reduces optional work, not ownership or safety. Continue useful approved review/planning/docs in another lane without claiming blocked code is running. Do not repeatedly submit work against an unchanged execution block.

Every engineering assignment states PRIMARY AGENT, MODEL, RISK, OBJECTIVE, KNOWN FACTS, FILES/SURFACES, REQUIRED BEHAVIOR, OUT OF SCOPE, TESTS and PASS CONDITION. Stop at pass. Return actual changes/checks/result/risks in ONE SINGLE final markdown code block.

## H. Roadmap position

Chasum is one reusable world-class AI Business Operating System: Customer → Booking → Appointment → Staff → Location → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Automation → Summer intelligence.
GVM is a normal validation tenant; HQ a normal dogfood tenant; Platform Admin is `/owner`, not HQ or legacy `/dashboard/hq`.

Balance Core Operations, Commercial SaaS, Intelligence/Summer and Validation. Phase 5 → Outside Private Alpha readiness (observability, onboarding and switching/import) → Commercial SaaS Gate B → Summer Business Manager horizontal v1. Gate A complete is not Gate B complete. Later implementation remains separately scoped; one pilot or booking must not consume the roadmap.

Phase 5 exit: accepted Production identity; legitimate GVM booking with customer/business emails each once; HQ connected-operation evidence as a normal tenant; no P0 tenant/money-truth failure in accepted workflows; captured mobile/grounded-AI gaps. Reuse accepted evidence. Do not add full billing/RBAC/native/autonomous-AI completion as Phase 5 criteria. GVM's external event remains waiting, not a freeze on other safe work.

Competitors: Fresha, Jane, Vagaro, Calendly, Square Appointments, Mangomint, Boulevard, GlossGenius, Mindbody, Booksy. Ask: Why would an existing customer leave their current software and move to Chasum? These are benchmarks, not an uncontrolled feature-copying mandate.

## I. Commercial destination

Chasum must become commercially self-service and should not require Darshan or engineers to manually provision each business.
Plans remain Free / Professional / Business / Enterprise; annual principle is pay for 10 months and receive 2 free, not 20% off. Pricing stays configurable. No new pricing decision here.

## J. Summer direction

Summer = AI Business Manager / intelligence layer. UNDERSTAND → EXPLAIN → RECOMMEND → ACT SAFELY → AUDIT. Shared authoritative tenant facts and permissioned actions, not a standalone receptionist or chatbot. Implementation is not claimed to have reached the full destination.

## K. Mobile direction

React Native + Expo is the working direction; confirm the final stack at native preflight. One shared multi-tenant iOS/Android application. Begin material native work only after sufficient stability in Booking/Calendar, Customers/CRM, Payments/Refunds, Invoices/Receipts, Employees/Locations, Communications, Permissions/Auth and Summer. Sufficiently stable does not mean feature-complete. No native implementation in this task.

## Refresh duties and continuity Definition of Done

Control Tower owns the concise board and handoff. Engineer supplies exact candidate/test evidence. Release operator supplies redacted timestamped runtime evidence. PO owns consequential decisions. Significant work is not complete until applicable code/test/runtime/Git/config evidence, board, handoff, manifest and changelog are reconciled. Explicitly mark NOT APPLICABLE, NOT RUN, WAIVED or UNKNOWN rather than inventing passes; unknown release-critical requirements still block that release.

Refresh this handoff after a major release/phase completion, high-risk incident closure, architecture/governance change, every few significant PRs, or approximately weekly during heavy development. Refresh the board at task transitions/blockers and manifest when runtime changes. These are workflow duties, not an installed scheduler.

Use one scoped restamp, not endless docs-merge restamps. Observations have timestamps; current main and serving identity are verified when needed, never predicted using a future merge SHA. Keep this handoff about 2,500 words or less.

Normal sequence: PLAN → IMPLEMENT → TEST → AUDIT IF REQUIRED → ACCEPT → RESTAMP → NEXT TASK. Continue the next safe scoped action without waiting for a generic continue; stop for real decisions or required Production approval, not merely because a PR finished.

## L. New-chat bootstrap

```text
CHASUM DEVELOPMENT — CONTINUE FROM REPOSITORY STATE
Repository: renovisionai2-cloud/chasum. This is not a fresh project.
Read docs/CURRENT_PROJECT_STATE.md first, docs/handoffs/LATEST_HANDOFF.md,
then docs/runtime/ENVIRONMENT_MANIFEST.md. Read the relevant constitution in
docs/company/CHASUM_BIBLE.md and current gate in docs/LAUNCH_READINESS.md.
Do not read the full archive or historical chats to get started.
Inspect current remote main and relevant active PR identities read-only.
Compare exact commits, evidence times and runtime observations. Missing/stale
observations are UNKNOWN, not passes. Accepted application baseline, last
serving SHA and current main are distinct. Current repo/runtime evidence wins
about observed reality, not about approval of a changed policy. Record and
reconcile conflicts; never reset main or mutate environments to fit a handoff.
Do not reopen accepted work without contradictory evidence. Continue from
EXACT NEXT TASK with Codex as PRIMARY NORMAL ENGINEERING IMPLEMENTER,
Terra intended for ordinary engineering, Claude risk-appropriate reviewer,
and Momentic browser regression. If Codex is genuinely capacity-blocked,
Control Tower may temporarily transfer ONE fully bounded critical-path
implementation to Cursor (one implementer; no racing). Preserve credit and
approval controls. Issue #48 / PR #49 and Issue #46 / PR #50 are CLOSED /
PRODUCTION VERIFIED. HQ connected-chain Phase 5 gate is MET. Issue #51 /
PR #52 is CLOSED / PRODUCTION VERIFIED. Issue #53 is parallel and not this
task. PR #45 continuity foundation remains merged/accepted; do not treat
either as a draft.
FIRST RESPONSE:
CURRENT MAIN:
CURRENT PRODUCTION: [accepted application baseline / last serving observation]
CURRENT STAGING: [observed values or UNKNOWN]
CURRENT PHASE:
CURRENT ACTIVE PR: [product engineering vs parallel documentation task]
LAST ACCEPTED WORK:
NEXT TASK:
PRIMARY AGENT:
MODEL: [intended / actually reported]
PASS CONDITION:
ANY STATE DRIFT: [evidence, not assumptions]
Then take the next safe scoped action without a generic continue. Ask only for
genuine Product Owner decisions or required Production authorization.
```
