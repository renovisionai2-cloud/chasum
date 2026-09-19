# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.
**Snapshot date:** 2026-09-19. **Updated by:** Cursor (PR #55 Production source-of-truth closeout; Control Tower remains board owner).
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations, not permanent HEADs.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. |
| Current Git main | Freshly query `origin/main`. A later docs-only merge may advance Git main / Vercel build SHA without changing the executable application tree. Do not restamp merely to chase that SHA. |
| Last runtime-verified Production application baseline | `fc9a302a1a2e6feedd550478264d97eec9216b29` (PR #55 squash-merge). Previous application baseline `cd735943518fda25be0bcc7e9f697b09b29fca9a` (PR #52) is historical. |
| Last accepted Production serving observation | SHA `fc9a302…`; `dpl_4ef8swfREjLjcgQyZDtuJx31K4fu`; unique `https://chasum-bxotnq0i1-renovisionappcom.vercel.app`; target production; ref main; READY / success; alias `https://chasum.vercel.app`. Evidence 5744330411 / 5744361600. Details: [manifest](runtime/ENVIRONMENT_MANIFEST.md). |
| Current Staging SHA / deployment | UNKNOWN; do not copy Preview or Production identity here. HQ Phase 5 connected-chain dogfood was Staging/Preview evidence, not Production. |
| Active phase / status | World Class Phase 5 — Production Pin and Design-Partner Pilot Stabilization / IN PROGRESS. |
| HQ connected-chain Phase 5 gate | **MET** (Issue #47 comment 5737101477). |
| Remaining Phase 5 gate ONLY | Legitimate GVM Production booking + customer confirmation email once + business new-booking email once. Do not create a synthetic GVM Production booking. Dual-email observation is still waiting; health is not delivery proof. |
| Current product-engineering state | Issue #54 remains **OPEN**. Trusted Operator Access V1 is **PRODUCTION VERIFIED**. PR #55 **MERGED / CLOSED** (2026-09-19T18:19:57Z; approved head `30ae664b36fb45892497dd89360de6e7654d6967`; squash `fc9a302…`). No real GVM grant. |
| Active product-engineering PR / branch | None. Remaining #54 work is a Product Owner grant decision, not an engineering implementation PR. |
| Primary engineer / model / risk | PRIMARY NORMAL OWNER: Codex. No current Cursor engineering fallback. RISK: remaining #54 work is a Level 3 Auth/membership Production grant and is **not** authorized. |
| What just completed | PR #55 merged and Production-runtime verified (5744330411 / 5744361600 / Issue #54 5744362262). Read-only landing/login HTTP 200; no Production sign-in; no GVM session. PR #52/#51, #50/#46, #49/#48 remain CLOSED / PRODUCTION VERIFIED. HQ connected-chain gate MET. |
| Accepted / locked | One multi-tenant platform; GVM and HQ normal tenants; cancelled terminal and notes-only; exclusive-tax invoices (#48); omitted-status (#46); customer billing truth (#51). Trusted Admin V1 = `business_members.role = admin` = full access inside one business during Private Alpha. Not employee RBAC, receptionist access, or Platform Admin. True employee login/RBAC remains DESIGN FOR NOW / BUILD LATER. |
| Must not reopen | PR #37/#39/#41/#43/#44/#45/#49/#50/#52/#55, Issue #46/#48/#49/#51, Production recovery, password-reset completion, absent new contradictory evidence. Do not reopen #55 application work; #54 stays open for the separate real GVM grant. |
| Blockers | Real GVM Trusted Admin grant is **not** authorized. Continuity collector SPECIFIED / NOT IMPLEMENTED. Issue #53 is parallel and must not ship inside the GVM grant. Two hosted UX limitations are **not** grant blockers and are not claimed fixed: revoke/ban can land `/login` instead of authenticated `/access-denied`; used magiclink replay can leave `?error=auth_callback_failed` on an already-authenticated User B tab (User A not restored). |
| Current P1 items | No new Production P1 incident. Remaining #54 work is the real GVM grant after separate PO approval. |
| Deferred | True employee login/RBAC (DESIGN FOR NOW / BUILD LATER); tenant switcher; staff.user_id commercial login; residual owner_id-only RLS (non-blocking for GVM cutover); completed/no-show terminality; no-op suppression; API/Summer alignment; event ledger/concurrency; TD-H10; TD-H11; PR #55 Preview/Staging config cleanup (IMPORTANT SECURITY/CONFIG HYGIENE / POST-RELEASE SAFE / SEPARATE CONTROLLED NON-PRODUCTION CLEANUP). See [handoff](handoffs/LATEST_HANDOFF.md). |
| Exact next substantive gate | Separate Product Owner decision for the REAL GVM Trusted Admin grant. Do not grant a real GVM operator without that approval. Do not use historical grant scripts / Production SQL / Auth dashboard mutation. |
| Pass condition | Remaining #54 pass: separate PO approval → in-product `owner_id` Trusted Admin flow only → GVM operator login/iPad → GVM tenant only → `/owner` denied → operational surfaces → genuine GVM operation → legitimate Production booking + dual-email observation. Do not claim a GVM grant or Phase 5 completion because #55 is Production verified. |
| After pass | Phase 5 still ends only at legitimate GVM dual-email observation. Do not mark Phase 5 complete because #55 is Production verified. |
| Product Owner input | YES before any real GVM Trusted Admin invitation or consequential Production Auth/membership change. Real GVM approval has **not** been given. |
| Parallel control work | Issue #53 launch safety / branch protection is parallel and must not ship inside the GVM grant. Continuity collector remains SPECIFIED / NOT IMPLEMENTED and Codex-owned. Codex remains primary normal engineer. |

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md) for exact scope, governance and bootstrap;
read [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md) for observed runtime evidence and UNKNOWNs.
Use [Launch Readiness](LAUNCH_READINESS.md) for exit gates and [Master Roadmap](company/MASTER_ROADMAP.md) for sequence.

The superseded long board is preserved byte-for-byte in the [historical snapshot](handoffs/archive/CURRENT_PROJECT_STATE_20260917_PRE_CONTINUITY.md).
It is evidence, not an execution queue. Its embedded relative links refer to the original repository layout;
use its [immutable original](https://github.com/renovisionai2-cloud/chasum/blob/47189b0f0a244bce5fd601bb76adda1a22a52255/docs/CURRENT_PROJECT_STATE.md) when following them.
The old `71b7c26...` restart instruction is superseded; never reset main to satisfy an old handoff.

**Size budget:** approximately one page of control fields, at most 800 words. Move history, not decisions, out of this board.
