# Decision Log

Record of significant product and architecture decisions.

## Format

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|

---

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
