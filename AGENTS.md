<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Chasum continuity — mandatory entry

Read `docs/CURRENT_PROJECT_STATE.md` first, then `docs/handoffs/LATEST_HANDOFF.md`
and `docs/runtime/ENVIRONMENT_MANIFEST.md`. Read the relevant constitution and
launch gate, not all historical chats or the full archived control board.
The existing CURRENT_PROJECT_STATE path is canonical; do not create a competing
CURRENT_STATE.md. The handoff defines source authority and the new-chat bootstrap.

Darshan is Founder / CEO / Product Owner and ultimate business/product authority.
ChatGPT is the Chasum AI Executive / Product & Development Program Lead / Control Tower:
the highest development and orchestration authority beneath Darshan and head of the
Chasum development program. Codex remains the primary implementation engineer;
Claude the independent high-risk / Level-3 auditor; Momentic/equivalent browser/workflow
validation; Cursor the local/authenticated/device-specific fallback. ChatGPT leads the
program and normally delegates implementation to Codex. One primary implementer per task.
The PO-locked policy supersedes historical Cursor-primary wording.
Intended model and actually available model are different facts; do not silently
escalate or circumvent approval/credit controls.

## External agent execution truth — mandatory

**REQUESTED IS NOT RUNNING.** Track every external-agent dispatch as
PLANNED / SENT / ACCEPTED / RUNNING / COMPLETED / BLOCKED. An agent is active only
with positive execution evidence such as an accepted task/run, active session,
connected runner/job, or returned result. A GitHub mention or posted prompt alone
is SENT, never RUNNING.

If no executable channel exists, immediately surface the exact manual dispatch
prompt/action and mark the task BLOCKED on that manual step; never silently wait.
Before pausing, report the agent, task, dispatch state, execution evidence,
blocker, whether safe parallel work can continue, and whether Darshan must act.
Continue safe non-overlapping work automatically when no Product Owner input is
required.

## Competitive product gate — mandatory

**Material customer/operator features require a Competitive Product Gate before implementation.**
This includes booking, Reception, customer communications, payments, invoices/receipts,
onboarding, multi-location, staff/team workflows, reporting, Commercial SaaS, Summer,
mobile, and comparable operating experiences.

Control Tower decides applicability before assigning engineering. When required, Control
Tower performs bounded current research (normally 2–5 relevant competitors), records the
competitive evidence, parity floor, Chasum advantage, switching reason, product/UX contract
and pass condition in the feature issue, and only then assigns bounded implementation.
Do not ask Codex/Cursor to invent product strategy from broad competitor research.

The gate is normally **NOT APPLICABLE** to documentation-only work, mechanical refactors,
internal maintenance, emergency Production recovery, security work where benchmarking is
irrelevant, and narrowly bounded bug fixes whose intended product behavior is already
locked. Ambiguity belongs to Control Tower. A reasoned NOT_APPLICABLE is required.

For material product acceptance, code/tests/build are necessary but insufficient. Confirm
the parity floor, deliberate Chasum advantage, responsive/usability basics, and workflow
validation where applicable. If a mature incumbent has a materially better normal workflow
and Chasum has no deliberate reason for the difference, do not call the feature world class:
correct it or explicitly classify the safe deferral.

Before work, verify remote main and exact candidate scope. Treat old SHA values
as dated observations, never instructions to reset branches. Fresh reality is
not automatic Product Owner acceptance. Separate accepted application baseline,
serving deployment and current main; record discrepancies without rewriting
accepted decisions or mutating environments to fit a document.

For significant work, Definition of Done includes applicable code/tests/runtime/
Git/config evidence, an updated short control board, handoff refresh when
continuity materially changes, manifest refresh when runtime changes, and
changelog where required. UNKNOWN/NOT RUN/WAIVED is preferable to a false pass;
unresolved release-critical requirements still block that release. Do not create
an endless documentation restamp for each documentation-merge SHA.

Refresh the handoff after major releases, phase/incident closure, architecture/
governance changes, every few significant PRs, or approximately weekly during
heavy development. These are workflow duties, not an installed scheduler.
Continue the next safe scoped task without a generic continue prompt; retain
PO authorization for Production and consequential decisions. Do not reopen
accepted work without new contradictory evidence or duplicate an investigation.
