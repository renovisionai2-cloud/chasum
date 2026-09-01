# CURRENT_PROJECT_STATE.md

**Status:** Living project handoff — permanent source of truth for “where Chasum is right now”  
**Authority:** This repository and `/docs` are the source of truth. External chat history is not.  
**Update rule:** Refresh this file after every completed milestone (and when branch / commit / priorities materially change).  
**Last updated:** 2026-08-31  
**Updated by:** Auth recovery-error session hardening on `cursor/marketing-os-positioning` (failed password recovery no longer falls through to an unrelated signed-in dashboard). **Not in Production.** Safe Tenant Onboarding Gate unchanged. Homepage / Platform / Meet Summer / Product Tour / Industries / Roadmap / Pricing / Why Private Alpha / Apply / Contact / Security / Status remain PO locked. Login / Forgot Password are **not** PO locked. July 2026 Status/Resources Status state is superseded. Prior Security PO lock (`8a4be65`), Contact PO lock (`29b7048`), Apply PO lock (`c5a39b2`), Why Private Alpha PO lock (`0afaf38`), Pricing PO lock (`f44fea2`), Roadmap PO lock (`f6ffee1`), Industries PO lock (`d6209db`), and 2026-08-25 native-app governance restamp remain in force.

---

## Control board (start here)

### LOCKED / APPROVED

- **Vision:** Chasum is a world-class **AI Business Operating System** for service businesses — not merely a booking platform.
- **Architecture:** One reusable multi-tenant SaaS. Business → Location → Resources remains the structural direction. No tenant-specific product forks.
- **Chasum HQ:** A **real normal business tenant** used to operate Chasum itself. Same architecture as outside customers. **Not** the SaaS control plane. **Not** `/dashboard/hq`.
- **Platform Admin / Control Centre:** Separate control plane for tenants, subscriptions, trials, plans, billing/account health, support access, usage, entitlements, and platform operations. Current direction: **`/owner`**.
- **World Class grouped tenant nav:** PO-approved, **protected**, and **on `main`**. Phase 1 (PR #23) shipped grouped desktop navigation + mobile bottom navigation via Minimum Necessary Diff. `origin/cursor/world-class-portal-foundation` is **reference-only** — not a merge target and not a working baseline.
- **Environment isolation:** Preview → Staging Supabase `wnfahklzaxirftyskctd`. Production → Production Supabase `kxcydvhswkuzepwzzinq`. Production app: `https://chasum.vercel.app`. Production changes require explicit PO approval.
- **Tenant Identity Safety Gate:** Permanent. Canonical: [`docs/TENANT_IDENTITY_SAFETY_GATE.md`](./TENANT_IDENTITY_SAFETY_GATE.md). **Restored on this branch (2026-08-31):** authentication and dashboard navigation do not create tenants. Normal zero-business → `/onboarding/business`. Platform Admin zero-business → `/owner`. Existing business → `/dashboard`. Tenant creation is explicit onboarding submit only. `/dashboard/hq` is not the Platform Admin default and is not the Chasum HQ tenant.
- **Financial truth:** Client money must represent reality (paid, refunded, outstanding, deposit, invoice, receipt, tax, balance). Mock SaaS billing must not mint paid invoices.
- **Coming Soon honesty:** Do not market or nav-present unfinished capabilities as operational. [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md).
- **Momentic:** Setup **COMPLETE**. Supporting regression infrastructure only — not a standalone roadmap track.
- **Launch-criticality governance:** [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md) — **18 workstreams**. Planning targets are not public promises. Launch criticality does not override quality. Permanent **AI Operating-System Preservation Check** sits beside launch criticality, world-class quality, and next-generation advantage.
- **Native mobile / App Store:** **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY** (workstream 18). One reusable multi-tenant Chasum app. GVM, Chasum HQ, and future businesses are normal tenants — no mobile forks. Working technical direction: **React Native + Expo**. Final stack: **TO BE CONFIRMED DURING NATIVE APP PREFLIGHT**. Begin material implementation after the Native App Start Gate, early enough for iOS/Android testing **before broader public launch**. Not Phase 5. Commercial v1 does **not** currently require App Store / Play apps.
- **GVM duplicate-tenant identity incident:** **CLOSED**. Not an active World Class blocker. Do not reopen.
- **Marketing website PO review (branch only — not Production):** Homepage — **LOCKED**; Platform — **LOCKED**; Meet Summer — **LOCKED**; Product Tour — **LOCKED**; Industries — **LOCKED**; Roadmap — **LOCKED**; Pricing — **LOCKED**; Why Private Alpha — **LOCKED**; Apply — **LOCKED**; Contact — **LOCKED**; Security — **LOCKED**; Status — **LOCKED**. Status PO lock SHA `c855324caa0a973326018ab703254d4f8305fc0e`. Full lock: [`docs/marketing/STATUS_V1_LOCK.md`](./marketing/STATUS_V1_LOCK.md). July 2026 Status/Resources Status state is superseded. Security remains locked at `8a4be655edd74c5cd7875d68acf93b476ac553fe`. Contact remains locked at `29b70486c3e7f3509616015359d609151ebfa53e`. Apply remains locked at `c5a39b2d97b4eb59c50f353a7e3be8806085cac0`. Why Private Alpha remains locked at `0afaf3829e00063407eabb9a2d955403527ff754`. Pricing remains locked at `f44fea23e80e14abddd0cf2279b8e199cbc4fb6d`. Roadmap remains locked at `f6ffee11b04ef423c9ae912e2386d3e427f41fad`. Industries remains locked at `d6209db7dfa0bb532408142b0a05a2f22774a95f`. Product Tour remains locked at `7bb5e3fba54fe8dc36ae1e94a29196030802dcee`. Homepage remains locked at `6f5a31e1a822ff8c0e0cf177a451bb2821019c52`. Platform remains locked at `fe65db7f3c934644aec6158f257f2921079c93b7`. Meet Summer remains locked at `3949b9941a60d284ca02b0358c41e9e8890b66bd`. Do not restore Official Pricing Page v1 (`83fbaed`), Roadmap v1, July 2026 Why Private Alpha v1 (`10a9e53`), July 2026 Security v1, or July 2026 Status.

### ACTIVE

- World Class Phase 1 — Navigation Foundation: **COMPLETE / MERGED TO MAIN** (PR #23, `ef88ef5`).
- World Class Phase 2 — Staff Plan Honesty: **COMPLETE / MERGED TO MAIN** (PR #25, `dd49b32`).
- World Class Phase 3 — Command Centre / Today experience: **COMPLETE / MERGED TO MAIN** (PR #27, `0c61a8d`).
- World Class Phase 4A — Commercial SaaS Lifecycle Honesty: **COMPLETE / MERGED TO MAIN** (PR #29, `f6517a1`). Gate A complete. Commercial SaaS Lifecycle remains **PARTIAL**. Gate B **NOT MET**.
- Launch schedule + launch-criticality governance: **ADOPTED** — [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md).
- GVM operational validation remains important (first real appointment, production email path) but **is not the entire roadmap**.
- Balanced outcomes required: **A Core Operations · B Commercial SaaS · C Intelligence · D Validation**.
- **Safe Tenant Onboarding Gate:** restored on `cursor/marketing-os-positioning` (not Production). Login is not PO locked.
- **Auth recovery-error session hardening:** failed password recovery routes to `/auth/recovery-error` instead of an unrelated signed-in dashboard (not Production). Login / Forgot Password are not PO locked.

### BLOCKED / GATED

Genuine current gates only (not closed incidents):

- **`/dashboard/hq` disposition** gated on a later explicit PO decision (move into `/owner`, relabel, or retire). No new product work on that surface until then.
- **Track 3 database / RLS hardening** not implemented. Migrations **034–036 UNAPPLIED**. **037/038 APPLIED** on Staging and Production but **executable SQL missing from repo history**.
- **Paid self-serve SaaS conversion** gated on a real Stripe Billing provider (mock provider must refuse paid upgrades).
- **Production deploys** gated on explicit PO approval. **Do not infer that `main` is what Production is serving.**
- Booking **resources** (`036`) unapplied; feature flag off.

### NEXT

Do **not** automatically “finish GVM” as a product rewrite. Do **not** start Gate B, RBAC, Summer expansion, `/owner` expansion, or native apps in this chapter.

Strategic next (from the launch tracker):

1. **World Class Phase 5 (PREFLIGHT REQUIRED / NOT STARTED):** **Production Pin and Design-Partner Pilot Stabilization** — workstreams 17 + 14 + 15. Verify Production SHA vs `main` `f6517a1`; GVM real booking+confirmation; HQ dogfood as a normal tenant. Unblocks outside Private Alpha (workstream 16). Capture mobile-web friction, owner/staff mobile patterns, notification needs, native-benefit workflows, Summer mobile use cases, and architecture issues that could complicate native later (workstream 18). Do **not** start native implementation. See [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md).
2. **Do not start Gate B.** Commercial v1 paid-provider billing remains LEVEL 3, later, Claude pre-challenge required.
3. **Do not** merge or rebase `origin/cursor/world-class-portal-foundation`.
4. **Do not** fix DashboardTopNav tablet overflow, tenancy, booking-engine, commerce formulas, `/dashboard/hq`, RBAC, Summer architecture, or native apps in the next bounded slice unless the tracker reclassifies them.

**GVM validation (separate — does not dominate the product roadmap):** remaining go-live craft in [`docs/GVM_GO_LIVE.md`](./GVM_GO_LIVE.md) — first real appointment, Resend SMTP / production email path. Identity incident is closed; follow-up identity debt stays separately tracked.

**Marketing (when directed):** Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, Apply, Contact, Security, and Status are **PO LOCKED** on `cursor/marketing-os-positioning` — **not in Production**. See **Approved marketing pages (locks)** below.

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
| [`docs/marketing/PRICING_V1_LOCK.md`](./marketing/PRICING_V1_LOCK.md) | **Pricing PO lock** — 2026-08-27 SHA `f44fea2` (branch; not Production) |
| [`docs/marketing/PRICING_PAGE_V1_LOCK.md`](./marketing/PRICING_PAGE_V1_LOCK.md) | **Historical** Official Pricing Page v1 (2026-07-30) — superseded; do not restore |
| [`docs/marketing/SUMMER_ONBOARDING_V1_LOCK.md`](./marketing/SUMMER_ONBOARDING_V1_LOCK.md) | **Summer Onboarding lock** — Meet Summer guided discovery v1 |
| [`docs/marketing/ROADMAP_V1_LOCK.md`](./marketing/ROADMAP_V1_LOCK.md) | **Roadmap PO lock** — 2026-08-27 SHA `f6ffee1` (branch; not Production) |
| [`docs/marketing/RESOURCES_V1_LOCK.md`](./marketing/RESOURCES_V1_LOCK.md) | **Resources lock** — Status, Security, and Why Private Alpha point to current-generation PO locks; July Status superseded |
| [`docs/marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md`](./marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md) | **Why Private Alpha PO lock** — 2026-08-27 SHA `0afaf38` (branch; not Production) |
| [`docs/marketing/APPLY_V1_LOCK.md`](./marketing/APPLY_V1_LOCK.md) | **Apply PO lock** — 2026-08-29 SHA `c5a39b2` (branch; not Production) |
| [`docs/marketing/CONTACT_V1_LOCK.md`](./marketing/CONTACT_V1_LOCK.md) | **Contact PO lock** — 2026-08-29 SHA `29b7048` (branch; not Production) |
| [`docs/marketing/SECURITY_V1_LOCK.md`](./marketing/SECURITY_V1_LOCK.md) | **Security PO lock** — 2026-08-30 SHA `8a4be65` (branch; not Production). July 2026 v1 superseded |
| [`docs/marketing/STATUS_V1_LOCK.md`](./marketing/STATUS_V1_LOCK.md) | **Status PO lock** — 2026-08-30 SHA `c855324` (branch; not Production). July 2026 Resources Status superseded |
| [`docs/marketing/PRODUCT_TOUR_V1_LOCK.md`](./marketing/PRODUCT_TOUR_V1_LOCK.md) | **Product Tour PO lock** — 2026-08-26 SHA `7bb5e3f` (branch; not Production) |
| [`docs/marketing/INDUSTRIES_V1_LOCK.md`](./marketing/INDUSTRIES_V1_LOCK.md) | **Industries PO lock** — 2026-08-26 SHA `d6209db` (branch; not Production) |
| [`docs/MARKETING_PRODUCT_FEATURE_AUDIT.md`](./MARKETING_PRODUCT_FEATURE_AUDIT.md) | Marketing ↔ product feature audit (post GVM URL deploy) |
| [`docs/marketing/HOMEPAGE_MASTER_SPECIFICATION.md`](./marketing/HOMEPAGE_MASTER_SPECIFICATION.md) | Home page (`/`) canonical front-door spec |
| [`docs/product/05_ARCHITECTURE.md`](./product/05_ARCHITECTURE.md) | Product architecture detail |
| [`docs/CHANGELOG.md`](./CHANGELOG.md) | Ship history |
| [`docs/TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md) | Debt register |
| [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md) | **Launch-criticality tracker** — **18 workstreams**; Phase 5 preflight; Private Alpha vs commercial-v1 billing gates; native mobile **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY**; AI OS preservation check |

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

Phase 2 follow-up debt (do **not** solve in this stamp):

- Staff quota TOCTOU / concurrency race (two simultaneous activations could theoretically consume the last seat) — important follow-up, not blocking for Private Alpha
- Raw database-error passthrough on some staff action failures
- Bulk Activate is not proactively quota-disabled in the UI
- Directory filter still says “booking status” for `is_active`
- Add Myself remains empty-state-only
- Disabled-control explanation relies partly on title tooltip

---

## World Class Phase 3 — Command Centre / Today experience

**STATUS: COMPLETE / MERGED TO MAIN** (PR #27, squash `0c61a8d28f83e3347425d9a1bca41188b5f94ed1`)

**OBJECTIVE (accepted):** `/dashboard` is the Command Centre V1 — trusted operating home, not a decorative dashboard and not a Reports duplicate.

Accepted outcome:

- Header, Today, Attention, Money, Quick Actions, Summer
- Trusted Today: appointments today, next appointment, active schedule (`isActiveBooking`; cancelled / no-show excluded from the working list)
- Grounded Attention: pending confirmations, cancellations today, outstanding invoices/deposits, setup gaps
- Money from `lib/commerce/dashboard.ts` → `getCommerceDashboardSnapshot()`; UI **Gross payments collected today** (not appointment-recognized revenue); outstanding invoices and deposits shown as separate snapshot fields
- Business-local Today via `lib/business/datetime.ts`
- Appointment metrics respect `getLocationScope()`; commerce money is business-wide and labeled honestly
- Quick Actions use existing routes; setup checklist preserved when incomplete
- Summer facts grounded in the same snapshot only (no fabricated recommendations, no Sophia/Leo/Maya/Alex theater)
- Mobile (~390) and desktop Command Centre verified; Phase 1 navigation intact
- Claude independent post-audit: **APPROVED**
- Momentic booking canary PASS (no customer / appointment / payment creation)
- No financial formula changes, no migrations, no tenancy changes
- Production untouched during development/validation

**Money truth (still locked):** Do not combine Gross payments collected with appointment-recognized revenue. Do not redefine invoice, refund, or deposit math.

**Business timezone (still locked):** Command Centre “today” remains the business-local day.

Phase 3 follow-up (do **not** solve in the launch-governance stamp):

- Pre-existing **DashboardTopNav** horizontal overflow at approximately **768–1024px** (at 820px: viewport 820, `document.scrollWidth` 844). Command Centre `.ds-page` right edge 820; Today’s schedule CardHeader 819. Same 844px min-width on `/dashboard/employees` and `/dashboard/payments`. Classification: **PRE-EXISTING SHELL**. **IMPORTANT BUT POST-LAUNCH SAFE**. Current launch risk **GREEN**. Reassess only if pilot testing proves it materially blocks a key tablet workflow.
- Staff quota TOCTOU, location 6-vs-10, `/dashboard/hq` disposition remain earlier-phase debt.

---

## Working launch schedule (planning targets, not public promises)

Canonical tracker: [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md).

1. GVM + Chasum HQ stable pilot use — **Late September–October 2026**
2. Selected outside Private Alpha — **October–November 2026**
3. Commercially launchable Chasum v1 — **December 2026–February 2027**
4. Broader public launch — **February–April 2027**
5. Fuller world-class AI Business Operating System vision — **Mid/Late 2027 onward**

**Governing rule:** Build what Chasum needs to launch trustworthily first. Launch criticality does not override quality. We defer unnecessary breadth; we do not defer reliability, trust, financial truth, security, usability, workflow quality, responsive quality on key workflows, architectural correctness, tenant isolation, or professional polish required for customer confidence.

**LAUNCH REQUIRED** is not “valuable / World Class / competitive.” It needs a specific safety, commercial, operational, legal/security, customer-trust, platform reliability, or product-positioning reason that prevents launch.

Commercial v1 target health at this stamp: **AMBER** (see tracker).

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

**Maturity:** trails Core Operations. Status remains **PARTIAL**. Do **not** mark complete after Phase 4A.

**Private Alpha billing readiness (Gate A / Phase 4A):** **COMPLETE** (PR #29). Honesty + `/owner` design-partner plan assignment + documented manual billing. Does **not** complete this workstream.

**Commercial v1 billing readiness (Gate B):** **NOT MET**. Required later. Do **not** start in this chapter. Live provider / webhooks / schema / migrations / Production subscription data = LEVEL 3 + Claude pre-challenge before implementation.

Incomplete / not production-ready:

- Paid self-service subscription conversion (Gate B)
- Payment-provider SaaS billing lifecycle (Gate B)
- Upgrade / downgrade / cancellation maturity (Gate B)
- Failed-payment / dunning recovery (Gate B)
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
| Auth | Anyone | `app/(auth)/*`, `app/auth/callback`, `app/auth/recovery-error` |
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

**Working name:** World Class Phase 4A **COMPLETE / MERGED TO MAIN** (PR #29). Next: World Class Phase 5 — Production Pin and Design-Partner Pilot Stabilization — **PREFLIGHT REQUIRED / NOT STARTED**. Commercial SaaS Lifecycle remains **PARTIAL**. Gate B **NOT MET**.

**Intent:**

1. Treat Chasum as an AI Business Operating System. Keep Core Operations, Commercial SaaS, Intelligence, and Validation in balance.
2. Use GVM and Chasum HQ as **normal tenants** to validate the reusable product — not as product forks or control planes.
3. Continue from **current `main` only**. Do not return to `cursor/world-class-portal-foundation` as a working baseline.
4. Sequence later product work from [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md). Phase 4A is complete. Commercial SaaS Lifecycle remains **PARTIAL** until Gate B is also met. Do **not** start Gate B, RBAC, Summer expansion, `/owner` expansion, or native apps in this stamp. Commercial v1 does **not** require full AI autonomy; preserve the AI-operated architecture now.

---

## Approved marketing pages (locks)

| Page | Version | Status | State | Visual source of truth |
|------|---------|--------|-------|------------------------|
| **Pricing** (`/pricing`) | Pricing PO lock · 2026-08-27 | ✅ **APPROVED / LOCKED** | **Locked** | Branch `cursor/marketing-os-positioning` @ `f44fea23e80e14abddd0cf2279b8e199cbc4fb6d` — **not Production** |
| **Summer Onboarding** (`/meet-summer` guided) | Summer Onboarding **v1** | ✅ **APPROVED** | **Locked** | https://chasum-7o8esta4x-renovisionappcom.vercel.app/meet-summer |
| **Roadmap** (`/roadmap`) | Roadmap PO lock · 2026-08-27 | ✅ **APPROVED / LOCKED** | **Locked** | https://chasum-gm2bnzx3x-renovisionappcom.vercel.app/roadmap @ `f6ffee11b04ef423c9ae912e2386d3e427f41fad` — **not Production** |
| **Status** (`/status`) | Status V1 PO lock · 2026-08-30 | ✅ **APPROVED / LOCKED** | **Locked** | Branch `cursor/marketing-os-positioning` @ `c855324caa0a973326018ab703254d4f8305fc0e` — **not Production**. July 2026 Preview is **superseded**. |
| **Why Private Alpha** (`/private-alpha`) | Why Private Alpha PO lock · 2026-08-27 | ✅ **APPROVED / LOCKED** | **Locked** | Branch `cursor/marketing-os-positioning` @ `0afaf3829e00063407eabb9a2d955403527ff754` — **not Production** |
| **Apply** (`/apply`) | Apply V1 PO lock · 2026-08-29 | ✅ **APPROVED / LOCKED** | **Locked** | Branch `cursor/marketing-os-positioning` @ `c5a39b2d97b4eb59c50f353a7e3be8806085cac0` — **not Production** |
| **Contact** (`/contact`) | Contact V1 PO lock · 2026-08-29 | ✅ **APPROVED / LOCKED** | **Locked** | Branch `cursor/marketing-os-positioning` @ `29b70486c3e7f3509616015359d609151ebfa53e` — **not Production** |
| **Security** (`/security`) | Security V1 PO lock · 2026-08-30 | ✅ **APPROVED / LOCKED** | **Locked** | Branch `cursor/marketing-os-positioning` @ `8a4be655edd74c5cd7875d68acf93b476ac553fe` — **not Production**. July 2026 Preview is **superseded**. |
| **Homepage** (`/`) | Marketing OS positioning · 2026-08-26 | ✅ **APPROVED / LOCKED** | **Locked** | Branch `cursor/marketing-os-positioning` @ `6f5a31e1a822ff8c0e0cf177a451bb2821019c52` — **not Production** |
| **Platform** (`/platform`) | Marketing OS positioning · 2026-08-26 | ✅ **APPROVED / LOCKED** | **Locked** | Branch `cursor/marketing-os-positioning` @ `fe65db7f3c934644aec6158f257f2921079c93b7` — **not Production** |
| **Meet Summer** (`/meet-summer` rendered) | Marketing OS positioning · 2026-08-26 | ✅ **APPROVED / LOCKED** | **Locked** | Branch `cursor/marketing-os-positioning` @ `3949b9941a60d284ca02b0358c41e9e8890b66bd` — **not Production** |
| **Product Tour** (`/product-tour`) | Product Tour PO lock · 2026-08-26 | ✅ **APPROVED / LOCKED** | **Locked** | https://chasum-nh8vmcsd8-renovisionappcom.vercel.app @ `7bb5e3fba54fe8dc36ae1e94a29196030802dcee` — **not Production** |
| **Industries** (`/industries`) | Industries PO lock · 2026-08-26 | ✅ **APPROVED / LOCKED** | **Locked** | https://chasum-day6aj97i-renovisionappcom.vercel.app @ `d6209db7dfa0bb532408142b0a05a2f22774a95f` — **not Production** |

**Pricing is complete and locked** as the current-generation commercial-truth baseline for `/pricing` (2026-08-27). Official Pricing Page **v1** (2026-07-30, `83fbaed`) is **superseded** and must not be restored. Do **not** redesign or polish unless the product owner explicitly requests it. This lock is **not** in Production. Full lock rules: [`docs/marketing/PRICING_V1_LOCK.md`](./marketing/PRICING_V1_LOCK.md).

**Summer Onboarding is complete and locked** as the approved baseline for `/meet-summer` (category selection + consultation copy). Do **not** redesign or polish unless the product owner explicitly requests it. Full lock rules: [`docs/marketing/SUMMER_ONBOARDING_V1_LOCK.md`](./marketing/SUMMER_ONBOARDING_V1_LOCK.md). The 2026-08-26 Meet Summer **rendered-surface** lock below is additive; it does not replace this 2026-07-30 onboarding lock.

**Roadmap is complete and locked** as the current-generation four-stage product-truth baseline for `/roadmap` (2026-08-27). Roadmap **v1** (Available in Chasum Today / Coming Soon / Future Vision) is **superseded** and must not be restored. Do **not** redesign or polish unless the product owner explicitly requests it. This lock is **not** in Production. Full lock rules: [`docs/marketing/ROADMAP_V1_LOCK.md`](./marketing/ROADMAP_V1_LOCK.md).

**Why Private Alpha is complete and locked** as the current-generation Design Partner program baseline for `/private-alpha` (2026-08-27). Why Private Alpha **v1** (2026-07-30, `10a9e53`) is **superseded** and must not be restored. Do **not** redesign or polish unless the product owner explicitly requests it. This lock is **not** in Production. Full lock rules: [`docs/marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md`](./marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md).

**Apply is complete and locked** as the current-generation Private Alpha / Design Partner acquisition funnel for `/apply` (2026-08-29). Lead capture only. Success requires verified Resend acceptance. Do **not** redesign, reopen false success, or polish unless the product owner explicitly requests it. This lock is **not** in Production. Full lock rules: [`docs/marketing/APPLY_V1_LOCK.md`](./marketing/APPLY_V1_LOCK.md).

**Contact is complete and locked** as the current-generation routing / link page for `/contact` (2026-08-29). No form. No server action. Contact-local walkthrough CTA is **Request a Walkthrough** (mailto). Do **not** redesign, add a scheduler/form, or polish unless the product owner explicitly requests it. This lock is **not** in Production. Full lock rules: [`docs/marketing/CONTACT_V1_LOCK.md`](./marketing/CONTACT_V1_LOCK.md).

**Security is complete and locked** as the current-generation product-truth baseline for `/security` (2026-08-30). Security **v1** (2026-07-30, `4013db0`) is **superseded** and must not be restored. Do **not** restore Stripe/Twilio as unqualified current infrastructure, Automatic Backups, or certification claims. This lock is **not** in Production. Full lock rules: [`docs/marketing/SECURITY_V1_LOCK.md`](./marketing/SECURITY_V1_LOCK.md).

**Status is complete and locked** as the current-generation manually reviewed operations-truth baseline for `/status` (2026-08-30). July 2026 Resources Status is **superseded** and must not be restored. Public booking is **Limited**. Do **not** restore Operational public booking, empty Known Issues, or “Last updated: 2026-07-30” as current truth. This lock is **not** in Production. Full lock rules: [`docs/marketing/STATUS_V1_LOCK.md`](./marketing/STATUS_V1_LOCK.md).

**Resources umbrella** continues to index Why Private Alpha, Security, and Status. Canonical Status lock is the 2026-08-30 PO lock above. Full umbrella: [`docs/marketing/RESOURCES_V1_LOCK.md`](./marketing/RESOURCES_V1_LOCK.md).

### Marketing OS positioning — 2026-08-26 PO review (branch; not Production)

| Surface | Status | SHA | Preview / pin | Date | Claude | PO |
|---------|--------|-----|----------------|------|--------|-----|
| Homepage (`/`) | **LOCKED** | `6f5a31e1a822ff8c0e0cf177a451bb2821019c52` | `cursor/marketing-os-positioning` | 2026-08-26 | — | APPROVED |
| Platform (`/platform`) | **LOCKED** | `fe65db7f3c934644aec6158f257f2921079c93b7` | `cursor/marketing-os-positioning` | 2026-08-26 | — | APPROVED |
| Meet Summer (`/meet-summer`) | **LOCKED** | `3949b9941a60d284ca02b0358c41e9e8890b66bd` | `cursor/marketing-os-positioning` | 2026-08-26 | — | APPROVED |
| Product Tour (`/product-tour`) | **LOCKED** | `7bb5e3fba54fe8dc36ae1e94a29196030802dcee` | https://chasum-nh8vmcsd8-renovisionappcom.vercel.app | 2026-08-26 | APPROVED | APPROVED |
| Industries (`/industries`) | **LOCKED** | `d6209db7dfa0bb532408142b0a05a2f22774a95f` | https://chasum-day6aj97i-renovisionappcom.vercel.app | 2026-08-26 | APPROVED | APPROVED |
| Roadmap (`/roadmap`) | **LOCKED** | `f6ffee11b04ef423c9ae912e2386d3e427f41fad` | https://chasum-gm2bnzx3x-renovisionappcom.vercel.app/roadmap | 2026-08-27 | APPROVED | APPROVED |
| Pricing (`/pricing`) | **LOCKED** | `f44fea23e80e14abddd0cf2279b8e199cbc4fb6d` | `cursor/marketing-os-positioning` | 2026-08-27 | APPROVED | APPROVED |
| Why Private Alpha (`/private-alpha`) | **LOCKED** | `0afaf3829e00063407eabb9a2d955403527ff754` | `cursor/marketing-os-positioning` | 2026-08-27 | APPROVED | APPROVED |
| Apply (`/apply`) | **LOCKED** | `c5a39b2d97b4eb59c50f353a7e3be8806085cac0` | `cursor/marketing-os-positioning` | 2026-08-29 | APPROVED | APPROVED |
| Contact (`/contact`) | **LOCKED** | `29b70486c3e7f3509616015359d609151ebfa53e` | `cursor/marketing-os-positioning` | 2026-08-29 | APPROVED | APPROVED |
| Security (`/security`) | **LOCKED** | `8a4be655edd74c5cd7875d68acf93b476ac553fe` | `cursor/marketing-os-positioning` | 2026-08-30 | APPROVED | APPROVED |
| Status (`/status`) | **LOCKED** | `c855324caa0a973326018ab703254d4f8305fc0e` | `cursor/marketing-os-positioning` | 2026-08-30 | APPROVED | APPROVED |

**STATUS — PO LOCKED**  
Date: 2026-08-30  
SHA: `c855324caa0a973326018ab703254d4f8305fc0e`  
Claude: APPROVED — STATUS READY FOR PO LOCK  
PO: APPROVED  
Visual: STATUS PO VISUAL REVIEW — PASS  

Full Status lock rules: [`docs/marketing/STATUS_V1_LOCK.md`](./marketing/STATUS_V1_LOCK.md). July 2026 Resources Status is superseded.

**SECURITY — PO LOCKED**  
Date: 2026-08-30  
SHA: `8a4be655edd74c5cd7875d68acf93b476ac553fe`  
Claude: APPROVED — SECURITY READY FOR PO LOCK  
PO: APPROVED  
Visual: SECURITY PO VISUAL REVIEW — PASS  

Full Security lock rules: [`docs/marketing/SECURITY_V1_LOCK.md`](./marketing/SECURITY_V1_LOCK.md). July 2026 Security v1 is superseded.

**CONTACT — PO LOCKED**  
Date: 2026-08-29  
SHA: `29b70486c3e7f3509616015359d609151ebfa53e`  
Claude: APPROVED — CONTACT READY FOR PO LOCK  
PO: APPROVED  
Visual: CONTACT VISUAL REVIEW — PASS  

Full Contact lock rules: [`docs/marketing/CONTACT_V1_LOCK.md`](./marketing/CONTACT_V1_LOCK.md).

**APPLY — PO LOCKED**  
Date: 2026-08-29  
SHA: `c5a39b2d97b4eb59c50f353a7e3be8806085cac0`  
Claude: APPROVED — APPLY READY FOR PO LOCK  
PO: APPROVED  

Full Apply lock rules: [`docs/marketing/APPLY_V1_LOCK.md`](./marketing/APPLY_V1_LOCK.md).

**WHY PRIVATE ALPHA — PO LOCKED**  
Date: 2026-08-27  
SHA: `0afaf3829e00063407eabb9a2d955403527ff754`  
Claude: APPROVED — WHY PRIVATE ALPHA READY FOR PO LOCK  
PO: APPROVED  

Full Why Private Alpha lock rules: [`docs/marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md`](./marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md).

**PRICING — PO LOCKED**  
Date: 2026-08-27  
SHA: `f44fea23e80e14abddd0cf2279b8e199cbc4fb6d`  
Claude: APPROVED — PRICING READY FOR PO LOCK  
PO: APPROVED  

Full Pricing lock rules: [`docs/marketing/PRICING_V1_LOCK.md`](./marketing/PRICING_V1_LOCK.md).

**ROADMAP — PO LOCKED**  
Date: 2026-08-27  
SHA: `f6ffee11b04ef423c9ae912e2386d3e427f41fad`  
Preview URL: https://chasum-gm2bnzx3x-renovisionappcom.vercel.app/roadmap  
Claude: APPROVED  
PO: APPROVED  

Full Roadmap lock rules: [`docs/marketing/ROADMAP_V1_LOCK.md`](./marketing/ROADMAP_V1_LOCK.md).

**INDUSTRIES — PO LOCKED**  
Date: 2026-08-26  
SHA: `d6209db7dfa0bb532408142b0a05a2f22774a95f`  
Preview URL: https://chasum-day6aj97i-renovisionappcom.vercel.app  
Claude: APPROVED  
PO: APPROVED  

Full Industries lock rules: [`docs/marketing/INDUSTRIES_V1_LOCK.md`](./marketing/INDUSTRIES_V1_LOCK.md).

**PRODUCT TOUR — PO LOCKED**  
Date: 2026-08-26  
SHA: `7bb5e3fba54fe8dc36ae1e94a29196030802dcee`  
Preview URL: https://chasum-nh8vmcsd8-renovisionappcom.vercel.app  
Claude: APPROVED  
PO: APPROVED  

Full Product Tour lock rules: [`docs/marketing/PRODUCT_TOUR_V1_LOCK.md`](./marketing/PRODUCT_TOUR_V1_LOCK.md).

These twelve surfaces are **not** in Production. `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`.

**Next marketing surface:** Not directed in this stamp. Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, Apply, Contact, Security, and Status are locked on this branch. Summer Onboarding remains previously locked. Do **not** restore Official Pricing Page v1, July 2026 Why Private Alpha v1, July 2026 Security v1, or July 2026 Status.

---

## Last completed work

### Most recent (2026-08-31) — Auth recovery-error session hardening (branch only)

- Failed password recovery no longer redirects to `/login` (middleware would send an already-signed-in unrelated session to `/dashboard`).
- Dedicated `/auth/recovery-error` shows a Chasum-branded expired-link message, “Request a new reset link” → `/forgot-password`, and optional “Return to sign in”.
- Successful recovery still routes to `/reset-password`. User A’s unrelated session is preserved on recovery failure; identities are not switched.
- Safe Tenant Onboarding Gate, `/owner`, GVM, and Chasum HQ routing are unchanged. Login / Forgot Password are **not** PO locked. **Not in Production.**
- `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`

### 2026-08-31 — Safe Tenant Onboarding Gate restored (branch only)

- PO approved restoring explicit zero-business onboarding and `/owner` as the zero-business Platform Admin destination.
- Silent `getOrCreateBusiness` / dashboard-layout tenant creation removed. `ensure_business_for_owner` is called only from `createInitialBusinessAction`.
- Routes: existing business → `/dashboard`; normal zero-business → `/onboarding/business`; Platform Admin zero-business → `/owner`.
- Login `signIn` sanitizes redirects with `sanitizeAuthNextPath` then applies the onboarding gate.
- `/signup` may still create an Auth user; it no longer silently creates a tenant. Public signup vs Private Alpha Apply remains deferred P2.
- Recovery-session edge case (User A session visible after User B OTP failure) was **not** changed — deferred Level 3.
- Login is **not** PO locked. Twelve marketing surfaces remain locked. **Not in Production.**
- `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`

### 2026-08-30 — Status PO lock stamped (documentation only)

- **STATUS — PO LOCKED**
- Date: 2026-08-30
- Surface: Marketing Website → System Status (`/status`)
- Branch: `cursor/marketing-os-positioning`
- SHA: `c855324caa0a973326018ab703254d4f8305fc0e`
- Security lock documentation parent: `bd61abd6f46e8db2621dcd7ed9a861849f558546`
- Claude: APPROVED — STATUS READY FOR PO LOCK
- PO: APPROVED
- Visual: STATUS PO VISUAL REVIEW — PASS
- July 2026 Resources Status superseded; Public booking Limited; Known Issues discloses specific-staff confirmation failure; static/manual model preserved
- Marketing review state: Homepage — **LOCKED**; Platform — **LOCKED**; Meet Summer — **LOCKED**; Product Tour — **LOCKED**; Industries — **LOCKED**; Roadmap — **LOCKED**; Pricing — **LOCKED**; Why Private Alpha — **LOCKED**; Apply — **LOCKED**; Contact — **LOCKED**; Security — **LOCKED**; Status — **LOCKED**
- Canonical lock: [`docs/marketing/STATUS_V1_LOCK.md`](./marketing/STATUS_V1_LOCK.md)
- `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`

### 2026-08-30 — Security PO lock stamped (documentation only)

- **SECURITY — PO LOCKED**
- Date: 2026-08-30
- Surface: Marketing Website → Security (`/security`)
- Branch: `cursor/marketing-os-positioning`
- SHA: `8a4be655edd74c5cd7875d68acf93b476ac553fe`
- Contact lock documentation parent: `902087b22568eab5817568ef78e0caa1191d57fc`
- Claude: APPROVED — SECURITY READY FOR PO LOCK
- PO: APPROVED
- Visual: SECURITY PO VISUAL REVIEW — PASS
- July 2026 Security v1 (`4013db0`) superseded; Stripe/Twilio and Automatic Backups P1 claims resolved; no certification overclaims
- Marketing review state: Homepage — **LOCKED**; Platform — **LOCKED**; Meet Summer — **LOCKED**; Product Tour — **LOCKED**; Industries — **LOCKED**; Roadmap — **LOCKED**; Pricing — **LOCKED**; Why Private Alpha — **LOCKED**; Apply — **LOCKED**; Contact — **LOCKED**; Security — **LOCKED**
- Canonical lock: [`docs/marketing/SECURITY_V1_LOCK.md`](./marketing/SECURITY_V1_LOCK.md)
- `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`

### 2026-08-29 — Contact PO lock stamped (documentation only)

- **CONTACT — PO LOCKED**
- Date: 2026-08-29
- Surface: Marketing Website → Contact (`/contact`)
- Branch: `cursor/marketing-os-positioning`
- SHA: `29b70486c3e7f3509616015359d609151ebfa53e`
- Apply lock documentation parent: `3b3dbdf4af47b23f5af92036930424e487cc19d0`
- Claude: APPROVED — CONTACT READY FOR PO LOCK
- PO: APPROVED
- Visual: CONTACT VISUAL REVIEW — PASS
- Routing / link page only; Contact-local CTA **Request a Walkthrough** (mailto); shared `CTA_DEMO_LABEL` protected
- Marketing review state: Homepage — **LOCKED**; Platform — **LOCKED**; Meet Summer — **LOCKED**; Product Tour — **LOCKED**; Industries — **LOCKED**; Roadmap — **LOCKED**; Pricing — **LOCKED**; Why Private Alpha — **LOCKED**; Apply — **LOCKED**; Contact — **LOCKED**
- Canonical lock: [`docs/marketing/CONTACT_V1_LOCK.md`](./marketing/CONTACT_V1_LOCK.md)
- `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`

### 2026-08-29 — Apply PO lock stamped (documentation only)

- **APPLY — PO LOCKED**
- Date: 2026-08-29
- Surface: Marketing Website → Apply (`/apply`)
- Branch: `cursor/marketing-os-positioning`
- SHA: `c5a39b2d97b4eb59c50f353a7e3be8806085cac0`
- Why Private Alpha lock documentation parent: `b1b9d0a02bf69e6ed5464a2b54148ad6916044e2`
- Claude: APPROVED — APPLY READY FOR PO LOCK
- PO: APPROVED
- End-to-end Preview delivery to sales@chasumai.com verified after Preview `RESEND_API_KEY` presence correction and fresh redeploy
- False-success Preview result is not current truth and is prohibited
- Marketing review state: Homepage — **LOCKED**; Platform — **LOCKED**; Meet Summer — **LOCKED**; Product Tour — **LOCKED**; Industries — **LOCKED**; Roadmap — **LOCKED**; Pricing — **LOCKED**; Why Private Alpha — **LOCKED**; Apply — **LOCKED**
- Canonical lock: [`docs/marketing/APPLY_V1_LOCK.md`](./marketing/APPLY_V1_LOCK.md)
- `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`

### 2026-08-27 — Why Private Alpha PO lock stamped (documentation only)

- **WHY PRIVATE ALPHA — PO LOCKED**
- Date: 2026-08-27
- Surface: Marketing Website → Why Private Alpha (`/private-alpha`)
- Branch: `cursor/marketing-os-positioning`
- SHA: `0afaf3829e00063407eabb9a2d955403527ff754`
- Implementation parent: `cc1fe6bd0756f903953e3656c7bd09ca1ee998e6`
- Claude: APPROVED — WHY PRIVATE ALPHA READY FOR PO LOCK
- PO: APPROVED
- Marketing review state: Homepage — **LOCKED**; Platform — **LOCKED**; Meet Summer — **LOCKED**; Product Tour — **LOCKED**; Industries — **LOCKED**; Roadmap — **LOCKED**; Pricing — **LOCKED**; Why Private Alpha — **LOCKED**
- Canonical lock: [`docs/marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md`](./marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md)
- July 2026 Why Private Alpha v1 (`10a9e53`) is superseded; do not restore
- **Not merged. Not in Production.** `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`.

### Immediately prior (2026-08-27) — Pricing PO lock stamped (documentation only)

- **PRICING — PO LOCKED**
- Date: 2026-08-27
- Surface: Marketing Website → Pricing (`/pricing`)
- Branch: `cursor/marketing-os-positioning`
- SHA: `f44fea23e80e14abddd0cf2279b8e199cbc4fb6d`
- Implementation parent: `82c4ea0f960fa6806a3b44bac059f05118594295`
- Claude: APPROVED — PRICING READY FOR PO LOCK
- PO: APPROVED
- Marketing review state: Homepage — **LOCKED**; Platform — **LOCKED**; Meet Summer — **LOCKED**; Product Tour — **LOCKED**; Industries — **LOCKED**; Roadmap — **LOCKED**; Pricing — **LOCKED**
- Canonical lock: [`docs/marketing/PRICING_V1_LOCK.md`](./marketing/PRICING_V1_LOCK.md)
- **Not merged. Not in Production.** `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`.

### Immediately prior (2026-08-27) — Roadmap PO lock stamped (documentation only)

- **ROADMAP — PO LOCKED**
- Date: 2026-08-27
- Surface: Marketing Website → Roadmap (`/roadmap`)
- Branch: `cursor/marketing-os-positioning`
- SHA: `f6ffee11b04ef423c9ae912e2386d3e427f41fad`
- Preview URL: https://chasum-gm2bnzx3x-renovisionappcom.vercel.app/roadmap
- Claude: APPROVED — ROADMAP READY FOR PO LOCK
- PO: APPROVED
- Marketing review state: Homepage — **LOCKED**; Platform — **LOCKED**; Meet Summer — **LOCKED**; Product Tour — **LOCKED**; Industries — **LOCKED**; Roadmap — **LOCKED**
- Canonical lock: [`docs/marketing/ROADMAP_V1_LOCK.md`](./marketing/ROADMAP_V1_LOCK.md)
- Pricing conflicts remain tracked for the next audit. Pricing was not edited.
- **Not merged. Not in Production.** `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`.

### Immediately prior (2026-08-26) — Industries PO lock stamped (documentation only)

- **INDUSTRIES — PO LOCKED**
- Date: 2026-08-26
- Surface: Marketing Website → Industries (`/industries`)
- Branch: `cursor/marketing-os-positioning`
- SHA: `d6209db7dfa0bb532408142b0a05a2f22774a95f`
- Preview URL: https://chasum-day6aj97i-renovisionappcom.vercel.app
- Claude: APPROVED — INDUSTRIES READY FOR PO LOCK
- PO: APPROVED
- Marketing review state: Homepage — **LOCKED**; Platform — **LOCKED**; Meet Summer — **LOCKED**; Product Tour — **LOCKED**; Industries — **LOCKED**
- Canonical lock: [`docs/marketing/INDUSTRIES_V1_LOCK.md`](./marketing/INDUSTRIES_V1_LOCK.md)
- **Not merged. Not in Production.** `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`.

### Earlier (2026-08-26) — Product Tour PO lock stamped (documentation only)

- **PRODUCT TOUR — PO LOCKED**
- Date: 2026-08-26
- Surface: Marketing Website → Product Tour (`/product-tour`)
- Branch: `cursor/marketing-os-positioning`
- SHA: `7bb5e3fba54fe8dc36ae1e94a29196030802dcee`
- Preview URL: https://chasum-nh8vmcsd8-renovisionappcom.vercel.app
- Claude: APPROVED — PRODUCT TOUR READY FOR PO LOCK
- PO: APPROVED
- Marketing review state: Homepage — **LOCKED**; Platform — **LOCKED**; Meet Summer — **LOCKED**; Product Tour — **LOCKED**
- Canonical lock: [`docs/marketing/PRODUCT_TOUR_V1_LOCK.md`](./marketing/PRODUCT_TOUR_V1_LOCK.md)
- **Not merged. Not in Production.** `origin/main` remains `476af17bfd06113281df0b5c33f995ccb26f5fff`.

### Immediately prior (2026-08-25) — World Class Phase 4A Commercial SaaS Lifecycle Honesty MERGED

- **PR #29** squash merge `f6517a17504667b58799a3202e43f5ec145643a1` — `feat: make Private Alpha SaaS billing truthful`
- Signup cannot grant paid `subscription_plan_key`; new tenants begin Free / starter; `preferred_plan` remains intent only
- Tenant mock billing lifecycle locked; plan-change UX is truthful Private Alpha request; canonical Free display
- Product Plan separate from Private Alpha access; `/owner` plan + Private Alpha visibility; bounded starter/professional assignment after `requirePlatformOwner`
- `subscription_events` audit; no Stripe/provider state; no `billing_invoices`; list-price metrics labeled as estimates
- Claude independent post-audit approved; Momentic booking canary passed
- Production and Staging tenant plans **not** mutated; no migrations
- Commercial SaaS remains **PARTIAL**; Gate A **COMPLETE**; Gate B **NOT MET**
- Non-blocking debt preserved: TD-M11 (plan update + event insert non-atomic); TD-L6 (unused `productPlanKeyForNewBusiness`)

### Immediately prior (2026-08-25) — World Class Phase 3 Command Centre MERGED

- **PR #27** squash merge `0c61a8d28f83e3347425d9a1bca41188b5f94ed1` — `feat: build World Class command centre`
- `/dashboard` is Command Centre V1 (Today, Attention, Money, Quick Actions, Summer)
- Authoritative money: `getCommerceDashboardSnapshot()`; **Gross payments collected today**
- Business-local Today; location-scoped appointments; business-wide money labeled honestly
- Grounded Summer facts only; setup path preserved
- Claude post-audit approved; Momentic booking canary passed
- Production not changed by Phase 3 development/validation

### Immediately prior (2026-08-25) — World Class Phase 2 Staff Plan Honesty MERGED

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
cursor/marketing-os-positioning
```

Marketing OS positioning, the Product Tour PO lock (`7bb5e3fba54fe8dc36ae1e94a29196030802dcee`), the Industries PO lock (`d6209db7dfa0bb532408142b0a05a2f22774a95f`), the Roadmap PO lock (`f6ffee11b04ef423c9ae912e2386d3e427f41fad`), the Pricing PO lock (`f44fea23e80e14abddd0cf2279b8e199cbc4fb6d`), the Why Private Alpha PO lock (`0afaf3829e00063407eabb9a2d955403527ff754`), and the Apply PO lock (`c5a39b2d97b4eb59c50f353a7e3be8806085cac0`) live on this branch. **Not merged to `main`.** **Not in Production.**

World Class Phases 1–4A remain merged to `main`. Phase 5 remains PREFLIGHT REQUIRED / NOT STARTED. Do **not** merge or rebase `origin/cursor/world-class-portal-foundation`.

**Obsolete as current working branch (historical only):**

- `cursor/gvm-identity-incident-closeout-7453` — merged (PR #19)
- `cursor/phase-3-integrations` — do not stay here for new work
- `cursor/production-billing-compatibility-7453` — merged onto `main` (`ef69815`)
- `cursor/world-class-portal-foundation` — **reference-only**; remaining World Class work must be reimplemented or selectively ported onto current `main`. **Not a merge target.**
- `cursor/world-class-navigation-integration` — merged via PR #23
- `cursor/world-class-staff-plan-honesty` — merged via PR #25
- `cursor/world-class-command-centre` — merged via PR #27
- `cursor/world-class-phase-4a-saas-honesty` — merged via PR #29

**Deploy policy:** This restamp is documentation only. It does not change Production or Staging application code or data.

---

## Latest commit (repository `main`)

| Field | Value |
|-------|--------|
| **`main` / `origin/main` SHA** | `476af17bfd06113281df0b5c33f995ccb26f5fff` |
| **Short** | `476af17` |
| **Subject** | `docs: restore pre-launch native app strategy (#31)` |
| **Date** | 2026-08-26 |

Status PO lock application SHA `c855324caa0a973326018ab703254d4f8305fc0e`, Security PO lock application SHA `8a4be655edd74c5cd7875d68acf93b476ac553fe`, Apply PO lock application SHA `c5a39b2d97b4eb59c50f353a7e3be8806085cac0`, Contact PO lock application SHA `29b70486c3e7f3509616015359d609151ebfa53e`, Why Private Alpha PO lock application SHA `0afaf3829e00063407eabb9a2d955403527ff754`, Pricing PO lock application SHA `f44fea23e80e14abddd0cf2279b8e199cbc4fb6d`, Roadmap PO lock application SHA `f6ffee11b04ef423c9ae912e2386d3e427f41fad`, Industries PO lock application SHA `d6209db7dfa0bb532408142b0a05a2f22774a95f`, and Product Tour PO lock application SHA `7bb5e3fba54fe8dc36ae1e94a29196030802dcee` are on `cursor/marketing-os-positioning` only. They are **not** on `main`.

### Production deployed SHA — VERIFY BEFORE CLAIMING CURRENT

Do **not** infer that `main` (`476af17`) has been deployed to Production. This stamp does **not** deploy Production.

| Field | Value |
|-------|--------|
| **Last documented Production serving SHA** | `68e9a816a230636e693d0e10b9b8ae7f3beb1e62` (`68e9a81`) |
| **Context** | Identity-incident closeout recorded this as the PR #18 serving commit on `https://chasum.vercel.app` |
| **This restamp** | Did **not** re-verify Production. Treat Production SHA as **unverified relative to current `main`**. |

---

## Uncommitted work

None expected after the auth recovery-error session hardening commit on this branch.

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
- `/owner` plan assign + `subscription_events` non-atomic (**TD-M11**, planned hardening)
- `productPlanKeyForNewBusiness()` unused in app code (**TD-L6**, P3 cleanup)
- Booking Sheet “collect payment” still partially stubbed
- `/dashboard/hq` legacy naming vs Chasum HQ tenant (disposition unresolved). Zero-business Platform Admins go to `/owner`, not `/dashboard/hq`.
- Public `/signup` vs Private Alpha Apply acquisition (deferred P2 product-truth). Auth users no longer get a silent tenant.
- Auth recovery-error session hardening is on this branch only — **not in Production** until an explicit deploy. Production can still show User A’s dashboard after a failed User B recovery until then.
- **World Class Phase 1 follow-up (do not solve here):** Business location cap helper 6 vs catalog/fallback 10; dashboard React hydration #418; mobile visible label “Centre”
- **World Class Phase 2 follow-up (do not solve here):** staff quota TOCTOU race; raw DB-error passthrough; bulk Activate not proactively quota-disabled; directory “booking status” terminology; Add Myself empty-state-only
- **World Class Phase 3 follow-up (do not solve here):** pre-existing DashboardTopNav overflow ~768–1024px — IMPORTANT BUT POST-LAUNCH SAFE; launch risk GREEN
- Paid upgrades still route through Private Alpha `/apply`

### Product / validation (not automatic NEXT)

- Commercial SaaS lifecycle incomplete (see Commercial SaaS section)
- GVM: first real client appointment + production email SMTP still listed on go-live / release plan
- Public self-serve SaaS checkout not live — Private Alpha is intentional

### Marketing discipline

- Roadmap status labels (**Available in Private Alpha / In Development / Coming Next / Future Direction**) belong on Roadmap — **not** inside Pricing plan inclusions. **Pricing deferred debt (do not fix from this lock):** Business 6-vs-10 runtime/catalog/DB; SaaS subscription currency unlocked (bare `$`); Memberships & Packages plan entitlement undecided; Invoicing runtime plan enforcement; public self-serve billing closed; Meet Summer embedded Apply-form vocabulary; unused `PRICING_FINAL_SECONDARY_CTA`.
- **Why Private Alpha deferred debt (do not fix from this lock):** shared Schedule a Demo → `/contact#walkthrough` (no self-serve calendar); optional Apply source tracking; Meet Summer embedded Apply-form vocabulary; mixed-generation copy on already-locked pages; Ask Summer 390 overlap unconfirmed; internal benefit icon key `founder`.
- **Apply deferred debt (do not fix from this lock):** no applicant confirmation email; no DB/CRM application persistence; no provider retry queue; no CAPTCHA/honeypot/rate limit; Ask Summer 390px FAB overlap risk; Business Type taxonomy cleanup; duplicate Veterinary wording; “Other Appointment-Based Business” wording; Meet Summer historical CRM/front-desk vocabulary; shared Schedule a Demo route debt; Business 6-vs-10 runtime/catalog/DB debt; public self-serve billing remains closed. Preview requires `RESEND_API_KEY` for truthful delivery testing (do not document the secret).
- **Contact deferred debt (do not fix from this lock):** `support@chasumai.com` unused; Header Support → `/contact` rather than `#support`; no Partnerships/Press/General cards; Ask Summer 390 FAB overlap risk; concierge “book a walkthrough” wording; metadata “book a product walkthrough”; no source/plan context in mailto; nested Link/Button debt in locked shared header/nav; shared locked “Schedule a Demo” wording; no real calendar scheduler; no Contact form; no CRM/DB Contact capture.
- **Security deferred debt (do not fix from this lock):** Track 3 RLS incomplete; migrations 034–036 unapplied unless live state later says otherwise; 037/038 SQL absent from Git; no formal backup/restore runbook; no verified PITR/RPO/RTO; Stripe SaaS billing mock; Twilio optional/configuration-dependent; Sentry unverified; no proven Chasum-configured CSP/HSTS; no security@ inbox; Platform Admin/service-role privileged access by design; public catalog policies by design; shared header nested Link/Button debt; Ask Summer 390 FAB; security tooling maturity (CodeQL/Dependabot/SAST/pentest) remains future work. The page no longer overclaims these.
- **Status deferred debt (do not fix from this lock):** named/specific-staff public booking defect still not merged to Production; optional/unassigned employee not Production-ready; `background_jobs.next_retry_at` live Production state unverified; migrations 034–036 unapplied unless later evidence says otherwise; 037/038 SQL absent from Git; Track 3 RLS incomplete; live email/SMS/Stripe Production configuration not fully verified; no live monitoring; no incident history; no uptime/SLA tooling; shared header nested Link/Button debt; Ask Summer 390 FAB; Production serving-SHA uncertainty; explicit service/status aria pairing deferred; Status not specially mapped in concierge page-awareness. The page now accurately represents known current truth.
- Never market unsupported SLA, unfinished automation, or staff login as included.

---

## Current priorities

Locked order for this chapter:

1. **Source-of-truth accuracy** — this control board + [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md).
2. **Phase 5 preflight — not started.** Production Pin and Design-Partner Pilot Stabilization (workstreams 17 + 14 + 15). Capture mobile friction and AI OS gaps. Do **not** implement in this stamp.
3. **Do not start Gate B.** Commercial SaaS remains **PARTIAL**; Gate B (commercial-v1 paid billing) is a later LEVEL 3 slice.
4. **Reusable product development** — Core Operations + Commercial SaaS + Summer Intelligence, in balance, sequenced by launch-criticality.
5. **GVM operational trust** — protect the live design partner; remaining go-live items are validation, not the whole strategy.
6. **Chasum HQ dogfood** — operate Chasum through the **normal HQ tenant**, not through `/dashboard/hq`.
7. **Honest Private Alpha GTM** — locked marketing pages (Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, Apply, Contact, Security, Status on branch). Next marketing surface not directed in this stamp. Product Truth Matrix.
8. **Charge-with-integrity path** — Stripe and self-serve only when operationally ready.

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

See [`docs/company/MASTER_ROADMAP.md`](./company/MASTER_ROADMAP.md). Highlights: Auth, Owner Platform, Billing UI, Communication Center, Employees, CRM, Calendar & Booking Engine, Business Management, Reports, AI Receptionist Phase 1, OS Kernel, Phase 3 Integrations, world-class marketing chapter, GVM identity closeout, Momentic baseline + smoke, **World Class Phase 1 navigation foundation**, **World Class Phase 2 staff plan honesty**, **World Class Phase 3 Command Centre V1**, **World Class Phase 4A Commercial SaaS Lifecycle Honesty (Gate A)**.

Surfaces listed as “completed” on the Master Roadmap mean the department exists — not that Commercial SaaS / RBAC / Stripe are launch-complete. Maturity lives in [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md).

### Near-term (do not treat as “GVM only”)

| Theme | Outcome |
|-------|---------|
| World Class Phase 1 | Grouped tenant nav + mobile nav **on main** (PR #23) |
| World Class Phase 2 | Staff plan honesty **on main** (PR #25) |
| World Class Phase 3 | Command Centre / Today experience **on main** (PR #27) |
| World Class Phase 4A | Commercial SaaS Lifecycle Honesty **on main** (PR #29). Gate A **COMPLETE**. Workstream 4 stays **PARTIAL**. |
| Commercial SaaS | Trailing; remains **PARTIAL**. **Gate B** = commercial-v1 paid-provider billing — later, not next. |
| Next phase (preflight) | **Phase 5** Production Pin and Design-Partner Pilot Stabilization — **NOT STARTED** |
| GVM / HQ validation | Inside Phase 5 — Late Sep–Oct 2026 stable pilot use |
| Summer Intelligence | Deepen toward Business Manager actions later — **not** the next phase |
| Core Operations craft | Reception/commerce/comms reliability as targeted defects inside Phase 5, not a rewrite |
| Track 3 | RLS/hardening when PO schedules; restore 037/038 SQL into repo |

Plans: [`docs/30_DAY_PRIVATE_ALPHA_PLAN.md`](./30_DAY_PRIVATE_ALPHA_PLAN.md), [`docs/90_DAY_EXECUTION_PLAN.md`](./90_DAY_EXECUTION_PLAN.md) — treat dates/items as historical planning unless restamped.

### Medium / future themes

From Master Roadmap — exact sprint order in [`docs/company/MASTER_TASKS.md`](./company/MASTER_TASKS.md):

- **AI Workforce** — Alex and later roles; Command Center as real coordination; voice later  
- **Inventory & Products**  
- **Marketing Automation**  
- **Square** (in-person payments)  
- **Native mobile** — workstream 18: **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY**; working direction React Native + Expo; final stack at native-app preflight; one reusable multi-tenant app
- **Marketplace**  
- **Enterprise** (org hierarchy, SSO, SLA-oriented controls)  
- **Version 2** — intentional UX/architecture leap only after V1 departments are hardened  

Do **not** start Inventory, Marketplace, native mobile **implementation**, or V2 redesign in this chapter. Native remains planned (workstream 18) for after the Native App Start Gate and **before broader public launch**.
Do **not** redesign or polish `/pricing`, `/meet-summer`, `/private-alpha`, `/security`, `/status`, `/`, `/platform`, `/product-tour`, `/industries`, or `/roadmap` unless the product owner explicitly requests it.

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
