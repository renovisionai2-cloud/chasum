# CURRENT_PROJECT_STATE.md

**Status:** Living project handoff — permanent source of truth for “where Chasum is right now”  
**Authority:** This repository and `/docs` are the source of truth. External chat history is not.  
**Update rule:** Refresh this file after every completed milestone (and when branch / commit / priorities materially change).  
**Last updated:** 2026-08-25
**Updated by:** World Class Phase 2 closeout + Phase 3 Command Centre preflight. Documentation only. No product implementation.

---

## Control board (start here)

### LOCKED / APPROVED

- **Vision:** Chasum is a world-class **AI Business Operating System** for service businesses — not merely a booking platform.
- **Architecture:** One reusable multi-tenant SaaS. Business → Location → Resources remains the structural direction. No tenant-specific product forks.
- **Chasum HQ:** A **real normal business tenant** used to operate Chasum itself. Same architecture as outside customers. **Not** the SaaS control plane. **Not** `/dashboard/hq`.
- **Platform Admin / Control Centre:** Separate control plane for tenants, subscriptions, trials, plans, billing/account health, support access, usage, entitlements, and platform operations. Current direction: **`/owner`**.
- **World Class grouped tenant nav:** PO-approved, **protected**, and **on `main`**. Phase 1 (PR #23) shipped grouped desktop navigation + mobile bottom navigation via Minimum Necessary Diff. `origin/cursor/world-class-portal-foundation` is **reference-only** — not a merge target and not a working baseline.
- **Environment isolation:** Preview → Staging Supabase `wnfahklzaxirftyskctd`. Production → Production Supabase `kxcydvhswkuzepwzzinq`. Production app: `https://chasum.vercel.app`. Production changes require explicit PO approval.
- **Tenant Identity Safety Gate:** Permanent. Canonical: [`docs/TENANT_IDENTITY_SAFETY_GATE.md`](./TENANT_IDENTITY_SAFETY_GATE.md).
- **Financial truth:** Client money must represent reality (paid, refunded, outstanding, deposit, invoice, receipt, tax, balance). Mock SaaS billing must not mint paid invoices.
- **Coming Soon honesty:** Do not market or nav-present unfinished capabilities as operational. [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md).
- **Momentic:** Setup **COMPLETE**. Supporting regression infrastructure only — not a standalone roadmap track.
- **GVM duplicate-tenant identity incident:** **CLOSED**. Not an active World Class blocker. Do not reopen.

### ACTIVE

- World Class Phase 1 — Navigation Foundation: **COMPLETE / MERGED TO MAIN** (PR #23, `ef88ef5`).
- World Class Phase 2 — Staff Plan Honesty: **COMPLETE / MERGED TO MAIN** (PR #25, `dd49b32`).
- World Class Phase 3 — Command Centre / Today experience: **PREFLIGHT APPROVED. Implementation NOT STARTED.**
- GVM operational validation remains important (first real appointment, production email path) but **is not the entire roadmap**.
- Balanced outcomes required: **A Core Operations · B Commercial SaaS · C Intelligence · D Validation**.

### BLOCKED / GATED

Genuine current gates only (not closed incidents):

- **`/dashboard/hq` disposition** gated on a later explicit PO decision (move into `/owner`, relabel, or retire). No new product work on that surface until then.
- **Track 3 database / RLS hardening** not implemented. Migrations **034–036 UNAPPLIED**. **037/038 APPLIED** on Staging and Production but **executable SQL missing from repo history**.
- **Paid self-serve SaaS conversion** gated on a real Stripe Billing provider (mock provider must refuse paid upgrades).
- **Production deploys** gated on explicit PO approval. **Do not infer that `main` is what Production is serving.**
- Booking **resources** (`036`) unapplied; feature flag off.

### NEXT

Do **not** automatically “finish GVM.” Strategic next:

1. **World Class Phase 3 (preflight approved, LEVEL 2, implementation not started):** **Command Centre / Today experience** — turn `/dashboard` into trusted operating intelligence + fast action. Continue from current `main` only. Claude pre-challenge is **not** required for the bounded V1. Claude **post-implementation review is required** before commit approval.
2. **Do not** merge or rebase `origin/cursor/world-class-portal-foundation`. Inspect it only as a reference for previously approved Command Centre ideas.
3. **Resume reusable product development** while protecting GVM operational trust.
4. **Rebalance subsequent work** across Commercial SaaS + Summer Intelligence + Core Operations. Do **not** start money-engine, tenancy, Reports redesign, or `/dashboard/hq` work in the Command Centre slice.

**GVM validation (separate — does not dominate the product roadmap):** remaining go-live craft in [`docs/GVM_GO_LIVE.md`](./GVM_GO_LIVE.md) — first real appointment, Resend SMTP / production email path. Identity incident is closed; follow-up identity debt stays separately tracked.

**Marketing (when directed):** Home page (`/`). Pricing, Meet Summer, Roadmap, Resources, Why Private Alpha, and Security remain locked.

---

## How to use this document

1. Start here at the beginning of every implementation session.
2. Follow linked docs for depth — do not invent product claims outside [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md).
3. When values conflict, [`docs/company/CHASUM_BIBLE.md`](./company/CHASUM_BIBLE.md) wins.
4. When **current-chapter priorities** conflict, **this control board** wins over older “Operation GVM is the entire roadmap” language in companion files.
5. After a milestone ships: update **Last completed work**, **Latest commit**, **Uncommitted work**, **Current milestone**, **NEXT**, and the date above.

### Companion entry points

| Doc | Role |
|-----|------|
| [`COMPANY_MEMORY.md`](../COMPANY_MEMORY.md) | Current-chapter priorities (balanced OS outcomes; GVM = validation partner) |
| [`docs/company/CHASUM_BIBLE.md`](./company/CHASUM_BIBLE.md) | Company constitution |
| [`docs/company/MASTER_ROADMAP.md`](./company/MASTER_ROADMAP.md) | Completed vs future strategic milestones |
| [`docs/company/MASTER_TASKS.md`](./company/MASTER_TASKS.md) | Active engineering backlog |
| [`docs/HQ_ARCHITECTURE.md`](./HQ_ARCHITECTURE.md) | **HISTORICAL / LEGACY naming** for `/dashboard/hq` — not Chasum HQ the tenant |
| [`docs/OWNER_PLATFORM.md`](./OWNER_PLATFORM.md) | Platform Admin / Control Centre (`/owner`) |
| [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md) | What may be claimed publicly |
| [`docs/marketing/PRICING_PAGE_V1_LOCK.md`](./marketing/PRICING_PAGE_V1_LOCK.md) | **Pricing page lock** — Official v1 approved baseline |
| [`docs/marketing/SUMMER_ONBOARDING_V1_LOCK.md`](./marketing/SUMMER_ONBOARDING_V1_LOCK.md) | **Summer Onboarding lock** — Meet Summer guided discovery v1 |
| [`docs/marketing/ROADMAP_V1_LOCK.md`](./marketing/ROADMAP_V1_LOCK.md) | **Roadmap lock** — Roadmap v1 approved baseline |
| [`docs/marketing/RESOURCES_V1_LOCK.md`](./marketing/RESOURCES_V1_LOCK.md) | **Resources lock** — Why Private Alpha, Security, Status v1 |
| [`docs/marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md`](./marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md) | **Why Private Alpha lock** — v1 approved baseline |
| [`docs/marketing/SECURITY_V1_LOCK.md`](./marketing/SECURITY_V1_LOCK.md) | **Security lock** — v1 approved baseline |
| [`docs/MARKETING_PRODUCT_FEATURE_AUDIT.md`](./MARKETING_PRODUCT_FEATURE_AUDIT.md) | Marketing ↔ product feature audit (post GVM URL deploy) |
| [`docs/marketing/HOMEPAGE_MASTER_SPECIFICATION.md`](./marketing/HOMEPAGE_MASTER_SPECIFICATION.md) | Home page (`/`) canonical front-door spec |
| [`docs/product/05_ARCHITECTURE.md`](./product/05_ARCHITECTURE.md) | Product architecture detail |
| [`docs/CHANGELOG.md`](./CHANGELOG.md) | Ship history |
| [`docs/TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md) | Debt register |

---

## Product in one paragraph

**Chasum** is a world-class **AI Business Operating System** for appointment-based service businesses — not “just booking software.” Scheduling is the foundation; the product is the operating layer: reception calendar, CRM, employees, locations, commerce, communications, reports, Commercial SaaS lifecycle, and an AI workforce that shares one business brain.

**Current go-to-market posture:** Private Alpha — invite-only design partners. Primary CTA is **Apply for Private Alpha** (`/apply`). Public self-serve billing is **not** open. First customers are expected to be **small and growing service businesses**.

**Validation tenants (normal businesses, not forks):**

- **GVM Baby World** — Founding Design Partner #001. Validates the reusable product in production. Authoritative tenant id `a04e1d65-eeb9-4d72-a5bf-739a9038bb91`, slug `gvm-baby-world`.
- **Chasum HQ** — Normal tenant used to dogfood Chasum by operating Chasum itself. Staging canonical slug `chasum-hq` (`724d9ecd-438d-439e-952e-2d8c4ab4486c`). Must not receive privileged shortcuts.

**Package / release:** `v0.2.0` (Next.js **16.2.10**, React 19). Next product release target remains documented as **v0.3.0** in [`docs/product/15_RELEASE_PLAN.md`](./product/15_RELEASE_PLAN.md); that file’s “first appointment / SMTP” items are **GVM validation**, not automatic product-roadmap domination.

---

## Naming: Chasum HQ vs Platform Admin vs `/dashboard/hq`

| Name | Meaning (authoritative) |
|------|-------------------------|
| **Chasum HQ** | A **normal tenant** (a real business inside Chasum) used to operate Chasum itself. Same multi-tenant architecture as GVM or any future customer. |
| **Platform Admin / Control Centre** | SaaS operator control plane. Current direction: **`/owner`**. Tenants, subscriptions, trials, plans, billing/account health, support, usage, entitlements, platform operations. |
| **`/dashboard/hq`** | **LEGACY / FOUNDER-ONLY SURFACE — NAMING/DISPOSITION TO BE RESOLVED.** Existing code/docs that call this “Chasum HQ” are **stale naming**. Do **not** describe `/dashboard/hq` as Chasum HQ product architecture. Do **not** redesign, delete, or expand it until a later PO decision: move into `/owner`, relabel, or retire. |

---

## World Class tenant navigation

**Status:** WORLD CLASS PHASE 1 — NAVIGATION FOUNDATION
**STATUS: COMPLETE / MERGED TO MAIN** (PR #23, squash `ef88ef57be040678d886d0a9b4d99c679d801128`)

Grouped tenant navigation and mobile navigation are now on `main`.

Preview/Staging acceptance passed:

- Authenticated desktop walkthrough passed
- Mobile 390×844 walkthrough passed
- Required route walk passed
- Momentic booking smoke passed (no customer / appointment / commerce / notification mutation)
- Production was **not** changed by Phase 1

The old World Class branch `origin/cursor/world-class-portal-foundation` (`c5aa36f`) is now **reference-only**, not a merge target and not a working baseline. Continue from current `main` only.

Approved groups (now shipping):

```
TODAY          Command Centre, Reception
CUSTOMERS      Customers
TEAM           Employees
CATALOG        Services, Packages, Memberships
MONEY          Payments, Gift Cards, Discounts
OPERATE        Reports, Automations
AI             Summer, Chase, AI Workforce
BUSINESS       Business setup, Locations, Communications, Integrations
ACCOUNT        Account & billing
```

Platform Admin remains separate (`/owner`). `/dashboard/hq` remains founder-only, labeled **HQ**.

| Reality | Location |
|---------|----------|
| Shipping implementation | `main` — `lib/dashboard/nav.ts`, grouped sidebar, `components/dashboard/mobile-bottom-nav.tsx` |
| Historical reference | `origin/cursor/world-class-portal-foundation` — remaining World Class work is **not** wholesale-mergeable |

Phase 1 follow-up debt (do **not** solve in a docs stamp):

- Business location limit: entitlement helper = 6 vs existing fallback/catalog = 10
- `/dashboard/hq` naming/disposition unresolved
- Dashboard React hydration warning #418
- Mobile visible label “Centre” accepted for this phase

---

## World Class Phase 2 — Staff Plan Honesty

**STATUS: COMPLETE / MERGED TO MAIN** (PR #25, squash `dd49b324a080b3ca41e003e6cacb747b32479d61`)

**Why this slice:** Commercial SaaS plan truth. Operators cannot create or reactivate more active staff than the plan includes. Reusable product honesty, not GVM-only architecture and not a decorative redesign.

Accepted product truth (`staff.is_active = true`):

| Plan | Active staff |
|------|----------------|
| Free | maximum **1** |
| Professional | maximum **3** |
| Business | **unlimited** |
| Enterprise | **unlimited**, unless a later explicit plan decision changes this |

Inactive staff remain stored on the business and **do not** consume an active seat.

**Active in Chasum** is the canonical UI term for `is_active`. It is **not** employment status, login access, roles/RBAC, or payroll state.

Server-side enforcement is authoritative (`staffQuotaForBusiness` / `assertCanActivateStaff` / `staffQuotaError`). UI gating (`StaffQuotaNotice`, Add employee / Add myself disabled at cap) is supportive only.

Validation accepted:

- Preview/Staging workflow acceptance passed
- Momentic booking smoke passed (no customer / appointment / commerce / notification mutation)
- Claude independent post-audit approved
- Production was **not** changed by Phase 2

Phase 2 follow-up debt (do **not** solve in Phase 3):

- Staff quota TOCTOU / concurrency race (two simultaneous activations could theoretically consume the last seat) — important follow-up, not blocking for Private Alpha
- Raw database-error passthrough on some staff action failures
- Bulk Activate is not proactively quota-disabled in the UI
- Directory filter still says “booking status” for `is_active`
- Add Myself remains empty-state-only
- Disabled-control explanation relies partly on title tooltip

---

## World Class Phase 3 — Command Centre / Today experience

**STATUS: PREFLIGHT APPROVED. IMPLEMENTATION NOT STARTED.**

**RISK:** LEVEL 2
**Claude pre-challenge:** NOT REQUIRED for the bounded V1.
**Claude post-implementation review:** REQUIRED before commit approval.
**Production:** protected. This stamp does not change Production or Staging application code or data.

**OBJECTIVE:** Make `/dashboard` (nav: Command Centre) the operational home of Chasum — trusted operating intelligence + fast action — not a decorative dashboard redesign and not a Reports duplicate.

It must answer:

1. What is happening today?
2. What needs attention?
3. What money needs attention?
4. What should I do next?

Unused capacity remains a Reception Morning Brief question in V1 (link there; do not invent a second utilization engine).

Approved V1 sections:

| Section | Contents |
|---------|----------|
| **TODAY** | Appointments today; next appointment; today’s schedule access |
| **ATTENTION** | Pending confirmations; cancellations today; outstanding balances / deposits; setup gaps where relevant |
| **MONEY** | Gross payments collected today; outstanding invoices / deposits from authoritative commerce data |
| **QUICK ACTIONS** | New appointment; new customer; Payments / outstanding; setup actions where incomplete |
| **SUMMER** | Grounded operational facts only |

**Money truth (locked):** Command Centre money must use `lib/commerce/dashboard.ts` → `getCommerceDashboardSnapshot()`. Cash must be labeled honestly, including **Gross payments collected**. Do **not** combine or equate this with appointment-recognized revenue. Do **not** redefine invoice, refund, or deposit math; do **not** change commerce ledger formulas or Reports money logic; do **not** create a mixed revenue/cash aggregate. If implementation requires that: **STOP — FINANCIAL SCOPE EXPANSION** (LEVEL 3 / Claude pre-challenge).

**Business timezone (locked):** Command Centre “today” means the business-local day via existing `lib/business/datetime.ts` helpers. Do **not** use server-local midnight for new Command Centre day calculations. Do **not** rewrite Reports/date architecture in this phase.

**Multi-location (locked):** Respect existing `getLocationScope`. Appointment metrics may be all locations or the selected/current location. Commerce money remains business-wide if that is what the Payments snapshot provides. The UI must make that distinction understandable. Do not fabricate location-specific money.

**Summer (locked):** Summer remains AI Business Manager. V1 may surface grounded facts from already-loaded authoritative data only (appointments today, next appointment, pending confirmations, outstanding count, setup gaps). Do **not** implement fabricated recommendations, unsupported outreach, utilization guesses, Sophia/Leo/Maya/Alex theater, new AI architecture, or autonomous financial actions.

**Recommended implementation branch (create only when implementation starts):** `cursor/world-class-command-centre`

Explicitly excluded from Phase 3:

- tenant-resolution rewrite, `lib/tenancy/*`
- booking-engine / booking-sheet rewrite
- Stripe SaaS lifecycle, RBAC, migrations
- `/dashboard/hq` disposition
- location-limit 6-vs-10
- staff quota TOCTOU fix
- Morning Brief rewrite, Chase rewrite
- old World Class wholesale merge
- deep Reports redesign
- full Summer architecture rewrite
- payroll/inventory placeholders

---

## Momentic

**Status:** COMPLETE — supporting regression infrastructure only.

| Item | Detail |
|------|--------|
| PR #20 | Safe Momentic baseline — merged |
| PR #21 | First real Preview/Staging booking smoke — merged (`web/chasum-test-studio-booking-smoke.test.yaml`) |
| Synthetic Staging tenant | **Chasum Test Studio** (Staging only; never Production) |
| Role | Regression canary for booking/availability paths |
| Not | A standalone roadmap track or a blocker of normal Chasum development |

---

## Summer / Intelligence

**Canonical positioning:** Summer = **AI Business Manager** (operating intelligence layer). Do not reposition strategy as “AI Receptionist only.” AI Receptionist is one capability inside the role.

**Implementation truth (do not over-claim):** Summer is currently strongest in booking, availability, CRM-grounded interactions, configured business knowledge, limited commerce awareness, and appointment actions (create / reschedule / cancel via the Booking Engine). It has **not** reached full AI Business Operating Manager depth (proactive recommendations and actions across the OS). Record that gap as roadmap work.

Chase remains Early Access, read-oriented. Additional roster roles (Alex, Maya, Leo, Sophia) are Coming Next / Future Vision.

---

## Commercial SaaS

**Maturity:** trails Core Operations. Do **not** mark complete.

Incomplete / not production-ready:

- Paid self-service subscription conversion
- Stripe-backed SaaS billing lifecycle
- Upgrade / downgrade / cancellation maturity
- Failed-payment / dunning recovery
- Remaining plan entitlement enforcement (location 6-vs-10 mismatch; other entitlements)
- Multi-staff permissions / RBAC
- Account lifecycle and usage / account-health depth

What exists: signup/auth, per-owner tenant bootstrap, plan keys, `private_alpha_enabled` feature elevation, **active-staff quota enforcement** (Phase 2), location caps, mock billing provider, paid-upgrade guard (refuses paid plans unless Stripe provider), `/dashboard/settings/billing`, `/owner` oversight surfaces.

---

## Current architecture

### Stack

| Layer | Choice |
|-------|--------|
| App framework | Next.js App Router (`next@16`), TypeScript |
| UI | React 19, Tailwind CSS v4, Design System v1 (`components/ui/*`) |
| Database | Supabase PostgreSQL + RLS (`supabase/migrations/`) |
| Auth | Supabase Auth + `@supabase/ssr` (cookies); `middleware.ts` |
| Hosting | Vercel (`vercel.json` crons) |
| Email / SMS | Resend / Twilio (console fallback when unset) |
| Calendars | Google + Microsoft OAuth; Apple via ICS |
| Payments | Commerce ledger **manual-first**; Stripe SaaS checkout Coming Next |
| Jobs | `background_jobs` + cron → `/api/cron/process-jobs` |
| Observability | Sentry (`instrumentation.ts`) |
| Tests | Vitest, Playwright, Momentic (Preview/Staging regression), verify scripts under `scripts/` |

Backend pattern: **Server Actions + Route Handlers** — no separate API server. Env contract: `.env.example`, `lib/env.ts`.

### Surfaces

| Surface | Audience | Paths |
|---------|----------|--------|
| Marketing site | Prospects / applicants | `app/(marketing)/*` — `/`, `/pricing`, `/platform`, `/product-tour`, `/industries`, `/meet-summer`, `/private-alpha`, `/apply`, `/roadmap`, … |
| Auth | Anyone | `app/(auth)/*`, `app/auth/callback` |
| Tenant product | Business owners (including GVM and Chasum HQ tenants) | `/dashboard/*` |
| Public booking / portal | End customers | `/book/[slug]`, `/portal/[token]` |
| Platform Admin / Control Centre | Chasum platform operators | `/owner/*` |
| Legacy founder-only surface | Founders / platform owners | `/dashboard/hq`, `/dashboard/hq/private-alpha` — **not** “Chasum HQ”; disposition unresolved |

### Key `lib/` domains

`booking-engine`, `commerce`, `crm`, `employees`, `communications`, `billing`, `reports`, `integrations`, `summer`, `chase`, `website-concierge`, `ai-workforce`, `ai-receptionist`, `marketing`, `hq` (legacy founder surface), `owner`, `os`, `business`, `supabase`, …

### AI systems (truth over theater)

| System | Role | Status posture |
|--------|------|----------------|
| **Summer (strategic)** | AI Business Manager | Positioning locked; implementation not yet full OS depth |
| **Summer (marketing)** | Website concierge / Meet Summer | Grounded Knowledge Engine |
| **Summer (in-app)** | Strongest as booking / availability / CRM-grounded assist | Early Access |
| **Chase** | Read-only ops insights | Early Access |
| **Emma** | Legacy alias for Summer reception path | Dual path still exists (debt) |
| Additional AI roles (Alex, etc.) | Roadmap | Coming Next / Future Vision |

Canonical claim language: [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md). Summer Principle: [`docs/ai/SUMMER_PRINCIPLE.md`](./ai/SUMMER_PRINCIPLE.md).

### OS kernel (foundation)

Shared money recognition, commerce + platform events, business operating context, locale/datetime — see [`COMPANY_MEMORY.md`](../COMPANY_MEMORY.md) and [`docs/product/22_OS_KERNEL.md`](./product/22_OS_KERNEL.md).

---

## Current milestone

**Working name:** World Class Phase 3 preflight approved — Command Centre / Today experience (implementation not started)

**Intent:**

1. Treat Chasum as an AI Business Operating System. Keep Core Operations, Commercial SaaS, Intelligence, and Validation in balance.
2. Use GVM and Chasum HQ as **normal tenants** to validate the reusable product — not as product forks or control planes.
3. Continue World Class from **current `main` only**. Do not return to `cursor/world-class-portal-foundation` as a working baseline.
4. Next product slice (Phase 3, not this documentation chapter): reimplement Command Centre V1 against current-main overview + existing commerce/appointment reads. Do not port the World Class money-engine, tenancy resolver, or Reports rewrite.

---

## Approved marketing pages (locks)

| Page | Version | Status | State | Visual source of truth |
|------|---------|--------|-------|------------------------|
| **Pricing** (`/pricing`) | Official Chasum Pricing Page **v1** | ✅ **APPROVED** | **Locked** | https://chasum-aw2cx9wbn-renovisionappcom.vercel.app/pricing |
| **Summer Onboarding** (`/meet-summer` guided) | Summer Onboarding **v1** | ✅ **APPROVED** | **Locked** | https://chasum-7o8esta4x-renovisionappcom.vercel.app/meet-summer |
| **Roadmap** (`/roadmap`) | Roadmap **v1** | ✅ **APPROVED** | **Locked** | https://chasum-rgp49w1xg-renovisionappcom.vercel.app/roadmap |
| **Resources** (`/status`) | Resources **v1** | ✅ **APPROVED** | **Locked** | https://chasum-2qwiq9hxp-renovisionappcom.vercel.app/status |
| **Why Private Alpha** (`/private-alpha`) | Why Private Alpha **v1** | ✅ **APPROVED · COMPLETE** | **Locked** | https://chasum-3lygrcwi7-renovisionappcom.vercel.app/private-alpha |
| **Security** (`/security`) | Security **v1** | ✅ **APPROVED · COMPLETE** | **Locked** | https://chasum-6vr9wmadu-renovisionappcom.vercel.app/security |

**Pricing is complete.** Design at the Pricing Preview URL is the approved baseline (implementation commit `83fbaed`). Do **not** revisit Pricing for redesign or visual polish unless the product owner explicitly requests it. Full lock rules: [`docs/marketing/PRICING_PAGE_V1_LOCK.md`](./marketing/PRICING_PAGE_V1_LOCK.md).

**Summer Onboarding is complete and locked** as the approved baseline for `/meet-summer` (category selection + consultation copy). Do **not** redesign or polish unless the product owner explicitly requests it. Full lock rules: [`docs/marketing/SUMMER_ONBOARDING_V1_LOCK.md`](./marketing/SUMMER_ONBOARDING_V1_LOCK.md).

**Roadmap is complete and locked** as Roadmap v1 — Available in Chasum Today / Coming Soon / Future Vision, Pricing-aligned. Do **not** redesign unless product changes require it. Full lock rules: [`docs/marketing/ROADMAP_V1_LOCK.md`](./marketing/ROADMAP_V1_LOCK.md).

**Resources is complete and locked** — Why Private Alpha, Security, and System Status. Full lock rules: [`docs/marketing/RESOURCES_V1_LOCK.md`](./marketing/RESOURCES_V1_LOCK.md), [`docs/marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md`](./marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md), [`docs/marketing/SECURITY_V1_LOCK.md`](./marketing/SECURITY_V1_LOCK.md).

**Next marketing surface:** Home page (`/`) when directed — Pricing, Summer Onboarding, Roadmap, and Resources are locked.

---

## Last completed work

### Most recent (2026-08-25) — World Class Phase 2 Staff Plan Honesty MERGED

- **PR #25** squash merge `dd49b324a080b3ca41e003e6cacb747b32479d61` — `feat: enforce active staff plan limits`
- Server-side active-staff quota on create / reactivate / bulk activate / Add myself / `ensureOwnerAsBookableStaff`
- Canonical helpers: `lib/billing/plan-entitlements.ts`, `lib/billing/staff-quota.ts`
- Employees UI: `StaffQuotaNotice`, gated Add employee / Add myself, **Active in Chasum** distinct from Employment status
- 24 focused quota tests + 58 focused/regression tests passed; Preview acceptance and Momentic booking smoke passed
- Claude independent post-audit approved
- Production not changed by Phase 2

### Immediately prior (2026-08-24) — World Class Phase 1 Navigation Foundation MERGED

- **PR #23** squash merge `ef88ef57be040678d886d0a9b4d99c679d801128` — `feat: integrate World Class navigation foundation`
- Grouped desktop tenant navigation + mobile bottom navigation now on `main`
- Shared nav model: `lib/dashboard/nav.ts`
- Current-main tenant resolution preserved (`app/(dashboard)/layout.tsx` unchanged)
- `/owner` remains separate; `/dashboard/hq` current founder-only behavior preserved (label **HQ**)
- Entitlement helper modules added (`lib/billing/plan-entitlements.ts`, `lib/billing/staff-quota.ts`) **without** mutation enforcement
- Selective integration only — World Class branch was **not** merged wholesale
- Preview/Staging acceptance: desktop, mobile 390×844, route walk, Momentic smoke PASS; no booking/customer/payment/notification mutation
- Production not changed by Phase 1

### Immediately prior (2026-08-24) — source-of-truth realignment

PO-reviewed strategic audit against then-`main` `be2cf6e1fbbaeb606eab33b4e2eac799ff459338`. Documentation restamp only (PR #22, `06f0534`). No app, database, or Production change.

### Immediately prior (2026-08-24) — Momentic regression (merged to main)

- **PR #20** — safe Momentic baseline (`231045a` / merge `8275686`)
- **PR #21** — Chasum Test Studio booking smoke (`be2cf6e`)
- Synthetic Staging tenant **Chasum Test Studio**; Preview must use Staging

### Immediately prior (2026-08-24) — GVM identity incident CLOSED in Production

- Migration 039 APPLIED + VERIFIED on Production (`kxcydvhswkuzepwzzinq`)
- PR #18 alias-aware booking DEPLOYED + VERIFIED; last **documented** Production serving commit `68e9a816a230636e693d0e10b9b8ae7f3beb1e62` at `https://chasum.vercel.app`
- Gate 6 forward remediation executed; `post_forward_ok = true`; rollback unused
- Tenant B `a04e1d65-eeb9-4d72-a5bf-739a9038bb91` is the permanent operational GVM tenant at `/book/gvm-baby-world`
- Alias `gvm-baby-world-ultrasound` → Tenant B (308 verified)
- Tenant A `079288f2-4f6f-49ca-86aa-5190ae2c83ad` retired at `/book/gvm-baby-world-retired-079288f2` (`staff_only`, not publicly bookable), not deleted
- World Class Program is no longer blocked by this incident
- Follow-up debt (not this closeout): 037/038 files missing from repo history; Production-mutating scripts need stronger business-id/environment assertions; onboarding duplicate detection; optional Tenant A legacy contact cleanup

Historical detail: [`docs/architecture/BUSINESS_SLUG_ALIASES.md`](./architecture/BUSINESS_SLUG_ALIASES.md).

### Prior on main (selected)

- Generic public booking slug aliases (`7f0f1cb`) — reusable infrastructure, not a GVM fork
- Production billing compatibility patch (`ef69815`) — paid-upgrade guard + service-role `subscription_events` writes. **On `main`.** Track 3 DB hardening still not implemented. Whether later `main` commits are on Production: **VERIFY BEFORE CLAIMING CURRENT**.
- PR #19 documentation closeout of the identity incident (`91ae760`)

### Historical marketing / GVM chapter (2026-07-30 and earlier)

Preserved for history — **not** current branch instructions:

- Production marketing deploy from then-branch `cursor/phase-3-integrations` @ `1d368a8`
- Locked marketing pages (Pricing, Summer Onboarding, Roadmap, Resources, Why Private Alpha, Security)
- Operation GVM Commerce Engine Finalization (migrations `030`/`031`)
- Premium Experience Sprints + OS Kernel foundation

---

## Active branch

```
main
```

Handoff SHA (local / `origin/main` at this stamp): `dd49b324a080b3ca41e003e6cacb747b32479d61`

**Obsolete as current working branch (historical only):**

- `cursor/gvm-identity-incident-closeout-7453` — merged (PR #19)
- `cursor/phase-3-integrations` — do not stay here for new work
- `cursor/production-billing-compatibility-7453` — merged onto `main` (`ef69815`)
- `cursor/world-class-portal-foundation` — **reference-only**; remaining World Class work must be reimplemented or selectively ported onto current `main`. **Not a merge target.**
- `cursor/world-class-navigation-integration` — merged via PR #23
- `cursor/world-class-staff-plan-honesty` — merged via PR #25

**Deploy policy:** This restamp is documentation only. It does not change Production or Staging application code or data.

---

## Latest commit (repository `main`)

| Field | Value |
|-------|--------|
| **`main` / `origin/main` SHA** | `dd49b324a080b3ca41e003e6cacb747b32479d61` |
| **Short** | `dd49b32` |
| **Subject** | `feat: enforce active staff plan limits (#25)` |
| **Date** | 2026-08-25 |

### Production deployed SHA — VERIFY BEFORE CLAIMING CURRENT

Do **not** infer that `main` (`dd49b32`) has been deployed to Production.

| Field | Value |
|-------|--------|
| **Last documented Production serving SHA** | `68e9a816a230636e693d0e10b9b8ae7f3beb1e62` (`68e9a81`) |
| **Context** | Identity-incident closeout recorded this as the PR #18 serving commit on `https://chasum.vercel.app` |
| **This restamp** | Did **not** re-verify Production. Treat Production SHA as **unverified relative to current `main`**. |

---

## Uncommitted work

None intended after this documentation PR. App code is unchanged. Production and Staging application data are untouched.

---

## Known issues / technical debt (keep visible)

Tracked in depth in [`docs/TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md). Snapshot — **do not solve in this restamp:**

- Migrations **034–036 UNAPPLIED**
- Migrations **037/038 APPLIED** on Staging and Production; **executable SQL missing from repo history**
- Remaining Track 3 / RLS hardening not implemented
- Dual communications stacks
- Dual Emma / Summer legacy path
- Dual Chase routes (`/dashboard/workforce/chase` and `/dashboard/ai-workforce/chase`)
- `create_public_appointment` vs Booking Engine write-path debt
- Booking resources migration `036` / feature flag pending
- Mock SaaS billing (`TD-C6`); paid self-serve Coming Soon
- Employee roles not fully enforced (`TD-H6`)
- Booking Sheet “collect payment” still partially stubbed
- `/dashboard/hq` legacy naming vs Chasum HQ tenant (disposition unresolved)
- **World Class Phase 1 follow-up (do not solve here):** Business location cap helper 6 vs catalog/fallback 10; dashboard React hydration #418; mobile visible label “Centre”
- **World Class Phase 2 follow-up (do not solve here):** staff quota TOCTOU race; raw DB-error passthrough; bulk Activate not proactively quota-disabled; directory “booking status” terminology; Add Myself empty-state-only
- Paid upgrades still route through Private Alpha `/apply`

### Product / validation (not automatic NEXT)

- Commercial SaaS lifecycle incomplete (see Commercial SaaS section)
- GVM: first real client appointment + production email SMTP still listed on go-live / release plan
- Public self-serve SaaS checkout not live — Private Alpha is intentional

### Marketing discipline

- Roadmap status labels (**Available Today / Early Access / Coming Next / Future Vision**) belong on Roadmap and truth matrix — **not** inside Pricing plan inclusions.
- Never market unsupported SLA, unfinished automation, or staff login as included.

---

## Current priorities

Locked order for this chapter:

1. **Source-of-truth accuracy** — this control board; do not implement from stale NEXT fields.
2. **World Class Phase 3 — Command Centre / Today experience** (preflight approved; implementation not started) — trusted operating home on current `main`.
3. **Reusable product development** — Core Operations + Commercial SaaS + Summer Intelligence, in balance.
4. **GVM operational trust** — protect the live design partner; remaining go-live items are validation, not the whole strategy.
5. **Chasum HQ dogfood** — operate Chasum through the **normal HQ tenant**, not through `/dashboard/hq`.
6. **Honest Private Alpha GTM** — locked marketing pages; Product Truth Matrix; Coming Soon stays honest.
7. **Charge-with-integrity path** — Stripe and self-serve only when operationally ready.

---

## Development roadmap

Roadmap outcomes must stay balanced:

| Outcome | Meaning |
|---------|---------|
| **A. Core Operations** | Scheduling, customers, staff, catalog, money, communications, reporting, workflows |
| **B. Commercial SaaS** | Signup, provisioning, onboarding, plans, entitlements, subscriptions, billing, lifecycle, permissions, support/recovery |
| **C. Intelligence** | Summer as AI Business Manager, Chase, AI Workforce — grounded in authoritative Chasum data |
| **D. Validation** | GVM, Chasum HQ tenant, future design partners, Preview/Staging regression (Momentic), human workflow trust |

### Completed (company view)

See [`docs/company/MASTER_ROADMAP.md`](./company/MASTER_ROADMAP.md). Highlights: Auth, Owner Platform, Billing UI, Communication Center, Employees, CRM, Calendar & Booking Engine, Business Management, Reports, AI Receptionist Phase 1, OS Kernel, Phase 3 Integrations, world-class marketing chapter, GVM identity closeout, Momentic baseline + smoke, **World Class Phase 1 navigation foundation**, **World Class Phase 2 staff plan honesty**.

### Near-term (do not treat as “GVM only”)

| Theme | Outcome |
|-------|---------|
| World Class Phase 1 | Grouped tenant nav + mobile nav **on main** (PR #23) |
| World Class Phase 2 | Staff plan honesty **on main** (PR #25) |
| World Class Phase 3 | Command Centre / Today experience — preflight approved, implementation not started |
| Commercial SaaS | Stripe-backed lifecycle; entitlements; RBAC — currently trailing |
| Summer Intelligence | Deepen toward Business Manager actions without inventing data |
| Core Operations craft | Reception/commerce/comms reliability |
| GVM validation | First real appointment + production email — listed separately |
| Track 3 | RLS/hardening when PO schedules; restore 037/038 SQL into repo |

Plans: [`docs/30_DAY_PRIVATE_ALPHA_PLAN.md`](./30_DAY_PRIVATE_ALPHA_PLAN.md), [`docs/90_DAY_EXECUTION_PLAN.md`](./90_DAY_EXECUTION_PLAN.md) — treat dates/items as historical planning unless restamped.

### Medium / future themes

From Master Roadmap — exact sprint order in [`docs/company/MASTER_TASKS.md`](./company/MASTER_TASKS.md):

- **AI Workforce** — Alex and later roles; Command Center as real coordination; voice later  
- **Inventory & Products**  
- **Marketing Automation**  
- **Square** (in-person payments)  
- **Native mobile** (reception-critical first)  
- **Marketplace**  
- **Enterprise** (org hierarchy, SSO, SLA-oriented controls)  
- **Version 2** — intentional UX/architecture leap only after V1 departments are hardened  

Do **not** start Inventory, Marketplace, native mobile, or V2 redesign unless explicitly requested.
Do **not** redesign or polish `/pricing`, `/meet-summer`, `/roadmap`, `/private-alpha`, `/security`, or `/status` unless the product owner explicitly requests it.

---

## Milestone update checklist

When a milestone completes, update this file:

- [ ] **Last updated** date  
- [ ] **Last completed work** (what + commit SHAs)  
- [ ] **Active branch** / sync status  
- [ ] **Latest commit** (`main` vs Production SHA called out separately)
- [ ] **Uncommitted work** (`git status`)
- [ ] **Control board** LOCKED / ACTIVE / BLOCKED / NEXT
- [ ] **Known issues** / **Priorities** if the chapter shifted  
- [ ] Cross-link `docs/CHANGELOG.md` entry when product behavior shipped  
- [ ] Commit this file with the milestone (or immediately after)

---

*This file is the handoff bridge. Deep truth lives in the linked docs; this page must stay short enough that a new session can re-orient in under five minutes.*
