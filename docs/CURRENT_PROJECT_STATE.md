# Chasum — Current Project State

**READ FIRST.** Sole current program board; no separate `CURRENT_STATE.md`.
**Snapshot date:** 2026-09-20. **Updated by:** ChatGPT Control Tower (post-observability Phase A + B2 Production acceptance).
**Repository:** `renovisionai2-cloud/chasum`. Values below are dated observations, not permanent HEADs.

| Control field | Current record |
| --- | --- |
| Project / product position | Chasum — world-class AI Business Operating System for service businesses. |
| Current Git main | Freshly query `origin/main`. Restamp base: `170f0f2608d0e3ed343bafdd4367efdcb604b8a2` (PR #70 squash merge). A later docs-only merge may advance Git main without changing application behavior. |
| Latest accepted Production release | PR #70 / Issue #69: read-only worker-health projection + truthful Platform Admin Health visibility. Merge `170f0f2608d0e3ed343bafdd4367efdcb604b8a2`; Vercel Production SUCCESS. PR #67 / Issue #66 Phase A observability primitives are also Production accepted. No Sentry provider activation/config mutation occurred in either release. |
| Last direct runtime-endpoint verified Production baseline | `3629004e05fb0a921ab96954ab701eb4a2f4cd5a` (PR #59 / Issue #58). Production `/api/build-info`, `/api/health`, GVM tenant identity and true viewport Reception checks passed. |
| Phase 5 | **COMPLETE.** Issue #47 closed after genuine GVM Production use satisfied the final gate: legitimate booking + customer confirmation email + business new-booking email, with desktop/iPhone operator acceptance. No synthetic Production booking was used. |
| Current program phase | **Outside Private Alpha readiness — IN PROGRESS.** Phase 5 validation is finished; do not continue treating GVM/HQ as blockers to starting launch-readiness work. |
| Current product-engineering state | Parent Issue #65 observability readiness remains OPEN. Phase A (#66 / PR #67) and B2 (#69 / PR #70) are CLOSED / PRODUCTION ACCEPTED. Issue #68 / B1 is ACTIVE / Codex-owned; no B1 PR exists yet. Its remote branch remains intentionally unmoved while Codex may hold local uncommitted work. |
| Main-branch governance | Ruleset `23730556` — **Chasum main governed release** — active on `main`. PR required; approvals 0; review-thread resolution required; checks `Vercel` + `competitive-product-gate`; strict/up-to-date; force-push/deletion blocked; repository-admin bypass is PR-only. GitHub’s default unattributed-Copilot extra-approval flag is inert because required approvals = 0. |
| Competitive Product Gate | ACTIVE on all PR categories. Material customer/operator work uses REQUIRED; docs/governance/maintenance/recovery/security and other non-product work may use reasoned NOT_APPLICABLE. |
| Issue #57 branded domain | **DEFERRED / DESIGN FOR NOW — BUILD LATER.** Product Owner decision 5745462206 supersedes the earlier cutover approval. `chasum.vercel.app` remains the legitimate Private Alpha Production hostname. Dormant Vercel apex/www attachment may remain; no DNS/Auth/env cutover is authorized. |
| Temporary PR #63 credential | Fresh sending-only, domain-restricted Resend key used for final Staging acceptance was removed from PR #63 Preview and permanently revoked after Product Owner confirmation. Production Resend credentials were unchanged. |
| Primary engineer / model / risk | PRIMARY NORMAL OWNER: Codex. Cursor is fallback/local authenticated operator only when justified. Claude is independent auditor where risk warrants. Momentic handles browser regression. |
| Current P1 items | No new Production P1 incident established. |
| Launch-required readiness gaps | Finish Issue #68 / B1 framework error capture + client-safe integration; then separately govern any Production Sentry/provider activation. Tenant onboarding & identity safety and governed switching/import capability remain later Outside Private Alpha readiness gaps. Commercial Gate B and practical RBAC remain separate later launch gates. |
| Deferred / design-for-now | True employee login/RBAC design, tenant switcher, deeper Summer Business Manager, Gate B paid billing, native apps, branded Production domain, residual owner_id-only RLS debt, TD-H10/TD-H11, continuity collector. |
| Exact next substantive task | **Issue #68 / Observability Phase B1 — ACTIVE / Codex-owned.** Preserve Codex local work, reconcile non-overlapping B1 changes onto current main `170f0f2608d0e3ed343bafdd4367efdcb604b8a2`, rerun B2 regression checks, Preview/Vercel/tests, then Claude audit. Bring Product Owner only the genuine merge decision. |
| Product Owner input | **Not required right now.** Required at the B1 merge gate or before consequential Production Sentry/provider/config activation, migrations/RLS/Auth/tenant/billing/Production-data changes. |

## Continue without reconstructing history

Read [Latest Handoff](handoffs/LATEST_HANDOFF.md) for exact scope, governance and bootstrap.
Read [Environment Manifest](runtime/ENVIRONMENT_MANIFEST.md) for observed runtime evidence and UNKNOWNs.
Use [Launch Readiness](LAUNCH_READINESS.md) for exit gates and [Master Roadmap](company/MASTER_ROADMAP.md) for sequence.

The superseded long board remains in [historical snapshots](handoffs/archive/). Archives are evidence, never current execution queues. Do not reset branches or reopen accepted releases to satisfy stale handoff text.

**Size budget:** approximately one page of control fields, at most 800 words. Move history, not decisions, out of this board.
