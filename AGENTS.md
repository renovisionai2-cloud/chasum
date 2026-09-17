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

Codex is the primary engineer; ChatGPT the Control Tower; Claude the independent
risk-appropriate reviewer; Momentic browser regression; Cursor a real
local/authenticated/device exception. One primary implementer per task.
The PO-locked policy supersedes historical Cursor-primary wording.
Intended model and actually available model are different facts; do not silently
escalate or circumvent approval/credit controls.

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
