# Chasum — Latest Development Handoff

**Updated:** 2026-09-17 by ChatGPT Control Tower. **Owner:** Control Tower.
**Purpose:** Recover the next action in 5–10 minutes without historical chat access.
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md). This handoff explains that board; it does not own a second current-state table.
**Implementation status:** Documentation foundation candidate. Automatic environment collection is NOT IMPLEMENTED. Publication to main and independent cold-start acceptance are separate gates; inspect the PR state rather than assuming either has occurred.

## A. Current control-tower state

Phase 5, Production Pin and Design-Partner Pilot Stabilization, remains IN PROGRESS.
Omitted-status preservation is scoped but blocked BEFORE implementation by a Codex-reported usage-limit/approval-tool failure. No source edit, test, branch, commit or PR resulted from that run. The underlying denial transcript was not supplied; a capacity report is not safety approval or evidence of an application incident.

PR #43 and its PR #44 documentation restamp are accepted and closed. Do not create another restamp merely to chase a changing docs-merge SHA. This continuity foundation is a separately requested permanent process improvement, not a reopening of either PR.

The current board owns task/branch/PR identity. The [manifest](../runtime/ENVIRONMENT_MANIFEST.md) owns environment observations. Read actual GitHub PR state, not stale instructions in a merged PR description. Legacy open PRs are not automatically the next task.

## B. Recent completed work

| Work | Accepted scope | Evidence |
| --- | --- | --- |
| PR #41 | Cancelled terminal; notes-editable only; canonical explicit-confirmation cancellation preserved. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/41), [historical board](archive/CURRENT_PROJECT_STATE_20260917_PRE_CONTINUITY.md). |
| PR #43 | Completion/no-show events require real transitions; retained status + moved range emits rescheduled with previous start/end; unchanged range emits updated. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/43), [changelog](../CHANGELOG.md). |
| PR #44 | Only current-state/changelog docs changed; reviewed and merged trees equal; application files unchanged. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/44), manifest P44 observation. |

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

**Task:** OMITTED-STATUS PRESERVATION. **Owner:** Codex. **Model:** Terra intended. **Risk:** Level 2. **Authority:** bounded feature-branch implementation already directed; no Production merge or hosted mutation authorized.

Start from freshly verified canonical main. Last observed main is on the board. If it advanced, report the delta and reconcile the implementation base before proceeding; never reset/force-push to satisfy an old handoff or create duplicate work. The report's `71b7c26...` resume instruction is stale; the current accepted starting observation is `47189b0...`.

Known cause: updateBooking initially falls back to existing.status, but `!intent.requestedStatus` then invokes a resolver that returns only pending/confirmed. Missing FormData status can be null despite a type assertion. This predates PR #43.

Source evidence already inspected: the ordinary Booking Sheet includes a hidden status input initialized from the appointment; Quick Actions explicitly supply status. No normal-UI omission or Production occurrence is demonstrated. Do not restart a broad caller audit or redesign the UI.

Scope: `lib/booking-engine/mutations/update.ts`, focused mutation tests, and a concise candidate changelog entry. Read only relevant sections of `availability/compose.ts`, `types.ts`, `lib/actions/appointments.ts`, and test harnesses. Add a failing regression using the real resolver and captured update payloads, then make the smallest update-only correction. Cover absent/null status with completed/no_show and other affected valid operational statuses. Preserve pending/confirmed, explicit transitions, cancellation guards, first-transition precedence, reschedule timestamps, audit actions, tenant filters and money columns. Do not alter shared create-booking policy.

Pass: regression becomes green; adjacent cancellation/event tests and required type/lint/build/diff checks reported; unmerged PR with exact base/head and evidence limits. Then Control Tower exact-candidate review, risk-appropriate audit/validation, separate PO release approval, acceptance/restamp, and Phase 5 exit assessment.

Other risks remain separate: cross-account Auth TD-H10; configuration TD-H11; observability, onboarding/import and commercial team/RBAC readiness. Completed/no-show terminality, restoration, no-op suppression, API/Summer divergence and event-ledger/concurrency redesign are deferred. No new Production P1 incident is established by this continuity work.

## E. Environment state

Read the manifest. Do not create another live inventory of deployments, queue counts, flags or migrations. This documentation task performed no database/provider/Auth/configuration mutation or privileged live verification. Staging SHA/deployment and restricted runtime fields remain UNKNOWN, not failed or healthy by assumption.

Protect GVM, normal HQ, the Staging evidence appointments and historical queues. No synthetic GVM Production booking, worker invocation, queue cleanup, migration replay, credential work or alias movement is authorized.

## F. Agent governance — PO locked

ChatGPT = Control Tower / Product & Development Lead: scope, strategy, drafting, source reconciliation and sequencing.
Codex = PRIMARY ENGINEERING AGENT and sole implementer of an engineering task.
Claude = large-context reviewer / independent auditor where risk warrants.
Momentic = repeatable browser/workflow regression.
Cursor = local/authenticated/device-specific exception with a real advantage, not the default engineer.

One primary implementer per task. Do not move a denied action between tools to bypass its control. Darshan should make genuine PO decisions, not reconstruct state or perform unnecessary technical diagnostics.

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
EXACT NEXT TASK with Codex primary, Terra intended for ordinary engineering,
Claude risk-appropriate reviewer, Momentic browser regression and Cursor only
for a real local/authenticated exception. Preserve credit and approval controls.
If these files exist only on an unmerged continuity PR, inspect its exact head
as proposed material alongside canonical main; do not call it merged authority.
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
