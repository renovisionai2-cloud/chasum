# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.
**Snapshot date:** 2026-09-19. **Updated by:** Cursor (temporary Issue #54 / PR #55 auth callback session-cookie propagation amendment; Control Tower remains board owner).
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
| Current product-engineering task | ISSUE #54 Trusted Operator Access V1 / UNMERGED CANDIDATE. |
| Active engineering PR / branch | `feat/trusted-operator-access-v1`. Unmerged; not Production-authorized. No real GVM invite. |
| Primary engineer / model / risk | PRIMARY NORMAL OWNER: Codex. TEMPORARY EXECUTION OWNER for this #54 candidate: Cursor. REASON: Codex capacity unavailable. RISK: Level 3 auth / tenancy / membership. |
| What just completed | PR #52 / Issue #51: CLOSED / PRODUCTION VERIFIED. PR #50 / Issue #46 and PR #49 / Issue #48 remain CLOSED / PRODUCTION VERIFIED. HQ connected-chain Phase 5 gate MET. |
| Accepted / locked | One multi-tenant platform; GVM and HQ normal tenants; cancelled terminal and notes-only; exclusive-tax invoice integrity (#48); omitted-status preservation (#46); customer billing truth (#51). Trusted Admin V1 = `business_members.role = admin` = full access inside one business during Private Alpha. Not employee RBAC, receptionist access, or Platform Admin. |
| Must not reopen | PR #37/#39/#41/#43/#44/#45/#49/#50/#52, Issue #46/#48/#49/#51, Production recovery, password-reset completion, absent new contradictory evidence. |
| Blockers | PR #55 / Issue #54 remains UNMERGED and not Production-authorized. Controlled NON-PRODUCTION Preview/Staging acceptance is IN PROGRESS: token-hash invite/resend emails and `/auth/callback` verify succeeded hosted; current blocker is callback session-cookie propagation so User B replaces User A. A preserved Incognito HQ owner session exists. Continuity collector remains SPECIFIED / NOT IMPLEMENTED. No Production/GVM mutation occurred. Issue #53 is parallel release-governance work, not this PR. |
| Current P1 items | No new Production P1 incident is established. #54 is Phase 5 launch-required, not a hosted grant. |
| Deferred | True employee login/RBAC (DESIGN FOR NOW / BUILD LATER); tenant switcher; staff.user_id commercial login; communication_history / communication_follow_ups / business-assets owner_id-only RLS (non-blocking for GVM cutover); completed/no-show terminality/restoration; no-op suppression; API/Summer alignment; event ledger/concurrency; cross-account Auth TD-H10; configuration TD-H11. See [handoff](handoffs/LATEST_HANDOFF.md). |
| Exact next task | After this session-cookie propagation amendment: Control Tower exact-delta review → independent audit → resume Preview/Staging hosted acceptance on the new HEAD. Do not claim hosted acceptance PASS. No Production authorization. No real GVM grant. |
| Pass condition | Primary-owner-only invite/resend/revoke; membership + `app_metadata.chasum_operator` committed before any human-clickable link; fail-closed tenant auto-create when the marker is present; Platform Admin and other-tenant targets rejected; revoke deletes membership then bans via installed `ban_duration`; re-invite unbans with `'none'`; no migration/RLS/role change; focused + adjacent checks green. |
| After pass | Exact-candidate review; independent audit; Preview/Staging acceptance; separate PO approval before any real GVM operator invite. Remaining Phase 5 sequence still ends at legitimate GVM dual-email observation. |
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
