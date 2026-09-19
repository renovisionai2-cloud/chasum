# Chasum — Latest Development Handoff

**Updated:** 2026-09-19 by Cursor (temporary PR #55 Production release source-of-truth docs closeout). **Owner:** Control Tower.
**Purpose:** Recover the next action in 5–10 minutes without historical chat access.
**First read:** [Current Project State](../CURRENT_PROJECT_STATE.md). This handoff explains that board; it does not own a second current-state table.
**Implementation status:** Issue #51 / PR #52, Issue #48 / PR #49, and Issue #46 / PR #50 remain CLOSED / PRODUCTION VERIFIED. HQ connected-chain Phase 5 gate is MET. Automatic environment collection remains SPECIFIED / NOT IMPLEMENTED. PR #55 Trusted Operator Access V1 is **MERGED / CLOSED**. Last runtime-verified Production application baseline is `fc9a302a1a2e6feedd550478264d97eec9216b29`. Issue #54 remains OPEN because the real GVM Trusted Admin grant has not been authorized. Issue #53 is parallel release-governance work and is not this PR.

## A. Current control-tower state

Phase 5 remains IN PROGRESS. PR #55 is MERGED / CLOSED (2026-09-19T18:19:57Z; approved head `30ae664b36fb45892497dd89360de6e7654d6967`; squash / last runtime-verified application SHA `fc9a302a1a2e6feedd550478264d97eec9216b29`). Previous Production application SHA `cd735943518fda25be0bcc7e9f697b09b29fca9a`. Production `dpl_4ef8swfREjLjcgQyZDtuJx31K4fu` READY / success, target production, ref main; unique `https://chasum-bxotnq0i1-renovisionappcom.vercel.app`; alias `https://chasum.vercel.app`. Evidence: 5744330411 / 5744361600 / Issue #54 5744362262.

Hosted Preview/Staging B (5744195939 / 5744211544) is historical. Its two UX limitations are backlog, not grant blockers, and are not claimed fixed. Issue #54 remains OPEN: application implementation is PRODUCTION VERIFIED; the real GVM Trusted Admin grant is **not** authorized. No real GVM operator was invited. Do not reopen #52/#51, #50/#46, or #49/#48. Issue #53 is parallel and must not ship here.

Do not restamp merely to chase a docs-merge SHA. Freshly query remote main; a later documentation-only merge may advance Git main / Vercel build SHA without changing the executable application tree. Do not treat `cd73594…` as current canonical main. Do not self-reference this documentation commit’s SHA.

HQ connected-chain gate: MET. Trusted Operator Production implementation: VERIFIED. Immediate remaining prerequisite: real GVM operator access approval + login acceptance. Phase 5 still ends only at a legitimate GVM Production booking plus customer confirmation email once and business new-booking email once. Dual-email observation is still waiting. Do not create a synthetic GVM Production booking or send a real GVM invite from this closeout.

The board owns task/PR identity. The [manifest](../runtime/ENVIRONMENT_MANIFEST.md) owns environment observations. Read actual GitHub PR state. True employee RBAC remains DESIGN FOR NOW / BUILD LATER; #54 is not commercial RBAC.

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
| PR #55 / Issue #54 (implementation) | Trusted Operator Access V1. MERGED / CLOSED / PRODUCTION VERIFIED. Last runtime-verified application SHA `fc9a302…`. No migrations/RLS/config mutation. No real GVM grant. Issue #54 stays OPEN for the grant decision. | [PR](https://github.com/renovisionai2-cloud/chasum/pull/55), [runtime](https://github.com/renovisionai2-cloud/chasum/pull/55#issuecomment-5744330411), [Control Tower](https://github.com/renovisionai2-cloud/chasum/pull/55#issuecomment-5744361600). |

Prior validation and the PR #43 hosted-Staging waiver remain as previously accepted; do not repeat that investigation for orientation.

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

**In-flight candidate (temporary Cursor fallback):** documentation-only Production closeout for PR #55, branch `docs/pr55-production-closeout`.
**PRIMARY NORMAL OWNER:** Codex.
**TEMPORARY EXECUTION OWNER:** Cursor.
**REASON:** Codex capacity unavailable.
**SCOPE:** documentation only. Do not change application/runtime/test/package files. Do not merge this docs PR. Do not grant GVM access. Do not re-probe Production.
**PASS CONDITION:** docs match Production evidence 5744330411 / Control Tower 5744361600 / Issue #54 5744362262; application/runtime/test/package trees identical to `fc9a302a1a2e6feedd550478264d97eec9216b29`; Issue #54 stays open; no real GVM grant; no Production mutation.
Codex remains the permanent primary engineer. If Codex capacity returns during this task, Codex must not race or duplicate this closeout. Codex resumes default ownership on the next engineering task.

**Authority:** 5744361600 / 5744330411 / Issue #54 5744362262; hosted 5744211544 / 5744195939; implementation 5738099117; token-hash 5742803473; session cookies 5743594318; ordered Set-Cookie 5743814476; Claude 5738066916 / 5743974268. **Risk:** Level 3 release documentation. No real GVM grant authorized. Staging test Trusted Admin `chasum1215+pr55ta@gmail.com` remains **REVOKED** (Auth identity remains; no active HQ membership; no manual Auth delete or metadata edit).

Non-blocking hosted limitations (security PASS; not grant blockers; not claimed fixed):
1. Revoke/ban UX: lost tenant access and landed `/login` rather than authenticated `/access-denied`.
2. Used magiclink replay UX: can leave `?error=auth_callback_failed` on an already-authenticated User B dashboard tab. User A was not restored. No tenant leakage.

Start by freshly querying `origin/main`. Preserve `fc9a302a1a2e6feedd550478264d97eec9216b29` as the last runtime-verified Production application baseline. A later docs-only merge advancing Git main is expected and is not an application-baseline change. Older `cd73594…` / `30d7de3…` start instructions are stale. Never reset/force-push to satisfy an old handoff.

Locked product truth: Trusted Admin V1 = `business_members.role = admin` with broad tenant-admin access inside one business during Private Alpha. Not receptionist access, employee checkboxes, Platform Admin, or `/owner`. True employee login/RBAC remains DESIGN FOR NOW / BUILD LATER.

Locked future #54 sequence after this docs closeout is reviewed and merged under separate PO approval:
PO explicitly approves real GVM Trusted Admin grant → verify Production runtime / tenant identity → IN-PRODUCT Trusted Admin workflow only → `owner_id` authority only → invite the intended real GVM operator → fresh Chasum email → operator login/iPad acceptance → GVM tenant only → `/owner` denied → operational surfaces → genuine GVM operation → legitimate Production booking → customer confirmation exactly once → business new-booking email exactly once → Phase 5 closeout if clean.

Never use historical grant scripts, manual Production SQL, Auth metadata editing, or Supabase dashboard user mutation. Do not mark Phase 5 complete because #55 is Production verified.

Other separate risks: GVM dual-email observation (wait until grant); Issue #53; residual owner_id-only RLS on communication_history / communication_follow_ups / business-assets; TD-H10; TD-H11. No new Production P1 incident is established here.

## E. Environment state

Read the manifest. Do not create another live inventory of deployments, queue counts, flags or migrations. This documentation task performed no Production GET, database/provider/Auth/configuration mutation, or privileged live verification. Staging SHA/deployment and restricted runtime fields remain UNKNOWN, not failed or healthy by assumption.

Protect GVM, normal HQ, the Staging evidence appointments and historical queues. No synthetic GVM Production booking, real GVM Trusted Admin invite, worker invocation, queue cleanup, migration replay, credential work or alias movement is authorized.

Temporary NON-PRODUCTION PR #55 acceptance configuration may still exist and must not be removed in this docs closeout: branch-scoped Preview `RESEND_API_KEY`, branch-scoped Preview `NEXT_PUBLIC_APP_URL`, and a Staging Auth redirect allowlist entry for the old PR #55 Preview alias. Production release is now verified and no further PR #55 hosted retest is currently required. Later removal is IMPORTANT SECURITY/CONFIG HYGIENE / POST-RELEASE SAFE / SEPARATE CONTROLLED NON-PRODUCTION CLEANUP. Do not mix that cleanup into this documentation PR. Do not touch Production configuration. True employee RBAC remains DESIGN FOR NOW / BUILD LATER.

The `cd73594…fc9a302` release included application/docs/tests/package dependency changes and NO Supabase migrations, RLS SQL, schema migration files, `vercel.json` change, GitHub workflow change, Production Auth config change, Production env mutation, or GVM tenant mutation.

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

Use one scoped restamp, not endless docs-merge restamps. Observations have timestamps; current main and serving identity are verified when needed, never predicted using a future merge SHA. Distinguish last runtime-verified Production application baseline from current Git main. Keep this handoff about 2,500 words or less.

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
observations are UNKNOWN, not passes. Last runtime-verified Production
application baseline is fc9a302a1a2e6feedd550478264d97eec9216b29 (PR #55).
Current Git main must be freshly queried and may later advance through
documentation-only merges without changing that application baseline.
Do not treat cd73594 as current canonical main. Do not restamp merely to
chase a docs-only merge SHA. Current repo/runtime evidence wins about
observed reality, not about approval of a changed policy. Record and
reconcile conflicts; never reset main or mutate environments to fit a
handoff. Do not reopen accepted work without contradictory evidence.
Continue from EXACT NEXT TASK with Codex as PRIMARY NORMAL ENGINEERING
IMPLEMENTER, Terra intended for ordinary engineering, Claude
risk-appropriate reviewer, and Momentic browser regression. If Codex is
genuinely capacity-blocked, Control Tower may temporarily transfer ONE
fully bounded critical-path implementation to Cursor (one implementer;
no racing). Preserve credit and approval controls. Issue #48 / PR #49,
Issue #46 / PR #50, and Issue #51 / PR #52 are CLOSED / PRODUCTION
VERIFIED. HQ connected-chain Phase 5 gate is MET. PR #55 is MERGED /
CLOSED / PRODUCTION VERIFIED. Issue #54 remains OPEN. No real GVM
Trusted Admin grant yet. Issue #53 is parallel and not this task.
PR #45 continuity foundation remains merged/accepted.
FIRST RESPONSE:
CURRENT MAIN: [freshly queried remote HEAD]
CURRENT PRODUCTION: [last runtime-verified application baseline fc9a302 /
last serving observation]
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
