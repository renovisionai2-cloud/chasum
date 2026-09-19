# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.
**Snapshot date:** 2026-09-19. **Updated by:** Cursor (temporary Issue #54 / PR #55 hosted-acceptance source-of-truth docs closeout; Control Tower remains board owner).
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations, not permanent HEADs.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. |
| Current accepted main / Production SHA | `cd735943518fda25be0bcc7e9f697b09b29fca9a` (PR #52 squash-merge). Verify remote HEAD before later work. |
| Accepted Production application baseline | PR #52 runtime on main: `cd735943518fda25be0bcc7e9f697b09b29fca9a`. |
| Last accepted Production serving SHA | `cd735943518fda25be0bcc7e9f697b09b29fca9a` |
| Last accepted Production deployment | `dpl_8yRCE7hjaRNMEdURgBthh1SkY9gm`; details and evidence limits in [manifest](runtime/ENVIRONMENT_MANIFEST.md). |
| Current Staging SHA / deployment | UNKNOWN; do not copy a candidate Preview or Production identity into these fields. HQ Phase 5 connected-chain dogfood was Staging/Preview evidence, not Production. |
| Active phase / status | World Class Phase 5 — Production Pin and Design-Partner Pilot Stabilization / IN PROGRESS. |
| HQ connected-chain Phase 5 gate | **MET** (Issue #47 comment 5737101477). |
| Remaining Phase 5 gate ONLY | Legitimate GVM Production booking + customer confirmation email once + business new-booking email once. Do not create a synthetic GVM Production booking. Dual-email observation is still waiting; configuration health is not delivery proof. |
| Current product-engineering task | ISSUE #54 / PR #55 Trusted Operator Access V1. Application code technically release-ready on `a773772309aab9604cd46ba07cb2ca69f3c51989`. Hosted Preview/Staging acceptance: **B — PASS WITH NON-BLOCKING LIMITATIONS**. UNMERGED; Production merge NOT authorized. No real GVM grant. |
| Active engineering PR / branch | `feat/trusted-operator-access-v1`. OPEN / UNMERGED. Not Production-authorized. |
| Primary engineer / model / risk | PRIMARY NORMAL OWNER: Codex. TEMPORARY EXECUTION OWNER for this #54 candidate: Cursor. REASON: Codex capacity unavailable. RISK: Level 3 auth / tenancy / membership. |
| What just completed | PR #55 hosted Preview/Staging acceptance B — PASS WITH NON-BLOCKING LIMITATIONS on application HEAD `a773772309aab9604cd46ba07cb2ca69f3c51989` (PR comment 5744195939; Control Tower 5744211544). User A→B session replacement, HQ landing, revoke/re-invite/cross-tenant, and final disposable Trusted Admin revoke passed. PR #52 / Issue #51, PR #50 / Issue #46 and PR #49 / Issue #48 remain CLOSED / PRODUCTION VERIFIED. HQ connected-chain Phase 5 gate MET. |
| Accepted / locked | One multi-tenant platform; GVM and HQ normal tenants; cancelled terminal and notes-only; exclusive-tax invoice integrity (#48); omitted-status preservation (#46); customer billing truth (#51). Trusted Admin V1 = `business_members.role = admin` = full access inside one business during Private Alpha. Not employee RBAC, receptionist access, or Platform Admin. |
| Must not reopen | PR #37/#39/#41/#43/#44/#45/#49/#50/#52, Issue #46/#48/#49/#51, Production recovery, password-reset completion, absent new contradictory evidence. |
| Blockers | PR #55 remains OPEN / UNMERGED. Application code is technically release-ready; Production merge/deploy is **not** authorized until explicit Product Owner approval. Real GVM grant is separately unauthorized. Continuity collector remains SPECIFIED / NOT IMPLEMENTED. Issue #53 is parallel, not this PR. Two hosted UX limitations are **not** Production blockers and are not claimed fixed: revoke/ban can land `/login` instead of authenticated `/access-denied` (HQ data still blocked); used magiclink replay can leave `?error=auth_callback_failed` on an already-authenticated User B tab (User A was not restored). |
| Current P1 items | No new Production P1 incident is established. #54 is Phase 5 launch-required, not a hosted grant. |
| Deferred | True employee login/RBAC (DESIGN FOR NOW / BUILD LATER); tenant switcher; staff.user_id commercial login; communication_history / communication_follow_ups / business-assets owner_id-only RLS (non-blocking for GVM cutover); completed/no-show terminality/restoration; no-op suppression; API/Summer alignment; event ledger/concurrency; cross-account Auth TD-H10; configuration TD-H11. See [handoff](handoffs/LATEST_HANDOFF.md). |
| Exact next task | Control Tower exact docs-delta review → Product Owner Production merge/deploy decision. Do not merge, deploy, or grant a real GVM operator without that PO approval. |
| Pass condition | Hosted Preview/Staging acceptance already recorded B. Remaining #54 sequence: docs-delta review → PO Production merge/deploy approval → verify Production serving SHA → separate PO approval for the REAL GVM Trusted Admin grant via in-product flow only → GVM operator login → legitimate Production booking + dual-email observation. |
| After pass | Phase 5 still ends only at legitimate GVM dual-email observation. Do not mark Phase 5 complete because hosted #55 passed. |
| Product Owner input | NO to start already-scoped implementation or documentation preparation. YES for Production-triggering merge, real GVM invite, or consequential Auth/membership/configuration changes. |
| Parallel control work | Issue #53 launch safety / branch protection is parallel and must not ship in this PR. Continuity collector remains SPECIFIED / NOT IMPLEMENTED and Codex-owned. Codex remains primary normal engineer; Cursor is temporary #54 execution owner only because Codex capacity is unavailable. |

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md) for exact scope, governance and bootstrap;
read [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md) for observed runtime evidence and UNKNOWNs.
Use [Launch Readiness](LAUNCH_READINESS.md) for exit gates and [Master Roadmap](company/MASTER_ROADMAP.md) for sequence.

The superseded long board is preserved byte-for-byte in the [historical snapshot](handoffs/archive/CURRENT_PROJECT_STATE_20260917_PRE_CONTINUITY.md).
It is evidence, not an execution queue. Its embedded relative links refer to the original repository layout;
use its [immutable original](https://github.com/renovisionai2-cloud/chasum/blob/47189b0f0a244bce5fd601bb76adda1a22a52255/docs/CURRENT_PROJECT_STATE.md) when following them.
The old `71b7c26...` restart instruction is superseded; never reset main to satisfy an old handoff.

**Size budget:** approximately one page of control fields, at most 800 words. Move history, not decisions, out of this board.
