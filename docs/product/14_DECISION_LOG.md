# Decision Log

Record of significant product and architecture decisions.

## Format

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|

---

| 2026-10-29 | Record completed Reception #174 engineering acceptance and authorize only one local governance/documentation child of `bb1baf105232eb75e4cd7ee4f159cdb54237c360` | Independent engineering audits/browser correction accepted; genuine Ubuntu / Node 22 [Quality 40810221078](https://github.com/renovisionai2-cloud/chasum/actions/runs/40810221078) PASS: 2,385 passed / 0 failed / 36 historical PostgreSQL skips; 86/86 browser cases PASS, build/typecheck/Vercel/competitive gate PASS, protected Preview READY. PR remains Draft/unmerged. | Child is unpublished and not independently audited or GitHub-CI approved. Local correction → manually dispatched Claude delta audit → separate PO publication approval → exact-head GitHub checks → separate PO merge approval. No Production release or financial activation. |
| 2026-10-29 | Record the explicitly approved Quality total job timeout increase: 15 → 30 minutes | Real Chromium/WebKit CI requires the larger total job budget; navigation remains 30 seconds, setup 120 seconds, teardown 10 seconds. Coverage/assertions unchanged; no new skip/bypass introduced to obtain green. | Approved exception, already implemented in historical hardening `bd0e9fc73528373f304dbc9fb8c259bd9b7daa93`; no workflow edit in this task. Supersedes blanket historical “no timeout is increased” wording. |
| 2026-10-29 | Clarify, without superseding, the October 26 temporary Morning Brief decision | Reception-only `9f305c2f9a377b95aa1642a3dc69f70cc0cb4573` remains financially isolated against Production `664fbc734c4103d78484c6b3828849a6605a562f`; integration `bb1baf105232eb75e4cd7ee4f159cdb54237c360` preserves current-main financial/backend/Auth parity. Neither establishes new financial Production acceptance. Morning Brief remains nonfinancial: no unverified amounts/payment-chasing recommendations or invented EXACT/HELD states. | October 26 wording restored verbatim from `ab972feb946e264f2a669841efc2ab78ece35cec` (also identical at `9f305c2f`). Its then-pending audit status is historical; later candidate audits are accepted. No reader/writer/type/payment/invoice/receipt change authorized. Other inherited financial displays remain separate; GVM CAD $50 deposit collection HELD. |
| 2026-10-29 | Record the unresolved possible indirect merge/closure of PR #173 on a future true merge of #174 | Exact `9f305c2f` ancestry preserves source identity and historical audit, but [GitHub indirect merges](https://docs.github.com/en/pull-requests/reference/pull-request-merges#indirect-merges) can change PR status when commits become reachable from main. OPEN/UNMERGED status cannot be guaranteed. | **Darshan has NOT approved the consequence.** Explicit PO disposition required BEFORE main merge; no branch move, closure, Ready transition or merge authorized now. |
| 2026-10-28 | Preserve the independently audited Reception/M1C candidate as an exact ancestor of a bounded local true-merge integration; keep the combined integration tip separate from the Reception-only release SHA | Current main contains newer canonical financial, SQL and operational history that must be reconciled without rebuilding, squashing or rebasing accepted Reception ancestry. Exact candidate `9f305c2f` remains the only potential Reception-only release artifact unless separately superseded and audited. | Local integration authorized; independent integration audit, GitHub Quality, publication, merge and release remain separate Product Owner gates |
| 2026-10-26 | Temporary Production-compatible Reception Morning Brief: operational summaries retained, legacy financial amounts/counts and derived recommendations withheld, neutral payment-verification warning | Explicit PO authorization resolves the isolation preflight Class F presentation dependency without importing canonical financial readers/writers; local candidate only; canonical financial model remains the intended model | Approved temporary compatibility; independent delta review pending — [evidence](../validation/reception-production-isolated/README.md) |
| 2026-10-11 | Permanent Chasum Development manual-dispatch default, effective immediately: ChatGPT coordinates/prepares prompts → Darshan manually dispatches → specialists execute separately → Darshan returns consolidated reports → ChatGPT reconciles the next gate | Work approval does not authorize agent dispatch; substantial embedded specialist execution requires Darshan's explicit execution request. One bounded implementer; independent Claude review. Full reports in one markdown code block. See [AGENTS.md](../../AGENTS.md#permanent-manual-specialist-dispatch--product-owner-directive). | Active — Product Owner directive |
| 2026-09-14 | [Bible §7](../company/CHASUM_BIBLE.md#7-ai-philosophy): Summer is the canonical AI Business Manager / intelligence layer | Shared authoritative operating truth; legacy agent names do not override direction or create disconnected chatbot products | ✅ Active — PO locked direction |
| 2026-07 | Multi-tenant via `businesses` table + RLS | Supabase-native; simple owner model | ✅ Active |
| 2026-07 | Public booking via SECURITY DEFINER RPCs | Prevent PII leakage; single validation path | ✅ Active |
| 2026-07 | Phase 4 scheduling in PostgreSQL RPCs | One engine for dashboard, public, API | ✅ Shipped |
| 2026-07 | Defer custom SMTP until production testing | Free-tier Supabase template limits | ⏸ Deferred |
| 2026-07 | GVM Baby World as design partner / dogfood tenant | Real workflow validation before GA | ✅ Active |
| 2026-07 | One business per owner (UNIQUE `owner_id`) | Fix duplicate race from concurrent `getOrCreateBusiness` | ✅ Shipped (007) |
| 2026-07 | `ensure_business_for_owner` RPC for bootstrap | Idempotent under concurrent dashboard loads | ✅ Shipped (007) |
| 2026-07 | Keep `customers` table name; UI says "Clients" | Rename deferred to avoid migration churn | ⏸ Deferred |
| 2026-07 | Console fallback for email/SMS in dev | No API keys required for local dev | ✅ Active |
| 2026-07 | Next.js middleware (migrate to proxy later) | Next 16 deprecation acknowledged | 📋 Backlog |
| 2026-07 | Locations under `businesses`, not separate org table | Simpler migration; one owner = one org with N sites | ✅ Shipped (008) |
| 2026-07 | Customers business-scoped, ops location-scoped | Shared client history; staff/services per site | ✅ Shipped (008) |
| 2026-07 | Location limits from `subscription_plans` table | Avoid hard-coded caps; Stripe wiring later | ✅ Shipped (008) |
| 2026-07 | Active location via HTTP-only cookie | Server actions filter consistently | ✅ Shipped (008) |
| 2026-07 | GVM production slug `gvm-baby-world` | Stable public URL for website cutover | ✅ Shipped (Sprint 2) |
| 2026-07 | Business profile fields on `businesses` (logo, contact, policies, social) | Settings + public booking parity | ✅ Shipped (011) |

## Rejected

| Proposal | Reason rejected |
|----------|-----------------|
| Client-side slot generation for public booking | Diverges from dashboard; caused bugs |
| Multiple businesses per owner without org model | Duplicate data; no clear UX |
| Skip Phase 4 RPC before GVM go-live | Double-booking risk unacceptable |

## How to add entries

1. Add a row to this table in PR description or direct commit to `docs/product/`.
2. Link GitHub issue or ADR number if applicable.
