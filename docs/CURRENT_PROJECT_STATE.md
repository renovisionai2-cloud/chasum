# CURRENT_PROJECT_STATE.md

**Status:** Living project handoff — permanent source of truth for “where Chasum is right now”  
**Authority:** This repository and `/docs` are the source of truth. External chat history is not.  
**Update rule:** Refresh this file after every completed milestone (and when branch / commit / priorities materially change).  
**Last updated:** 2026-08-07  
**Updated by:** World Class Execution Program — Chapter 4 Adaptive Booking Workspace (Preview; Production unchanged)  

---

## How to use this document

1. Start here at the beginning of every implementation session.
2. Follow linked docs for depth — do not invent product claims outside [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md).
3. When values conflict, [`docs/company/CHASUM_BIBLE.md`](./company/CHASUM_BIBLE.md) wins.
4. When priorities conflict for the current chapter, [`COMPANY_MEMORY.md`](../COMPANY_MEMORY.md) wins.
5. After a milestone ships: update **Last completed work**, **Latest commit**, **Uncommitted work**, **Current milestone**, **Next recommended task**, and the date above.

### Companion entry points

| Doc | Role |
|-----|------|
| [`COMPANY_MEMORY.md`](../COMPANY_MEMORY.md) | Current-chapter priorities (Operation GVM #1) |
| [`docs/company/CHASUM_BIBLE.md`](./company/CHASUM_BIBLE.md) | Company constitution |
| [`docs/company/MASTER_ROADMAP.md`](./company/MASTER_ROADMAP.md) | Completed vs future strategic milestones |
| [`docs/company/MASTER_TASKS.md`](./company/MASTER_TASKS.md) | Active engineering backlog |
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
| [`docs/WORLD_CLASS_IMPLEMENTATION_BLUEPRINT.md`](./WORLD_CLASS_IMPLEMENTATION_BLUEPRINT.md) | World Class execution blueprint |
| [`docs/WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md`](./WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md) | **Locked** portal polish & intelligence backlog (post-review) |
| [`docs/WORLD_CLASS_MARKETING_PARITY.md`](./WORLD_CLASS_MARKETING_PARITY.md) | Marketing parity pointer + polish implications |
| [`docs/WORLD_CLASS_MARKETING_PRODUCT_PARITY.md`](./WORLD_CLASS_MARKETING_PRODUCT_PARITY.md) | Marketing ↔ product parity matrix |
| [`docs/WORLD_CLASS_PLAN_ENTITLEMENT_MATRIX.md`](./WORLD_CLASS_PLAN_ENTITLEMENT_MATRIX.md) | Pricing entitlement gaps |
| [`docs/WORLD_CLASS_INDUSTRY_READINESS_MATRIX.md`](./WORLD_CLASS_INDUSTRY_READINESS_MATRIX.md) | Industry readiness |
| [`docs/WORLD_CLASS_RELEASE_LOG.md`](./WORLD_CLASS_RELEASE_LOG.md) | World Class Preview release log |
| [`docs/WORLD_CLASS_CUSTOMER_WORKSPACE_BLUEPRINT.md`](./WORLD_CLASS_CUSTOMER_WORKSPACE_BLUEPRINT.md) | Chapter 4 Customer Workspace blueprint |
| [`docs/WORLD_CLASS_BOOKING_WORKSPACE.md`](./WORLD_CLASS_BOOKING_WORKSPACE.md) | Chapter 4 Booking Workspace UX contract |

---

## Product in one paragraph

**Chasum** is an **AI Business Operating System** for appointment-based service businesses — not “just booking software.” Scheduling is the foundation; the product is the operating layer: reception calendar, CRM, employees, locations, commerce, communications, reports, and an AI workforce that shares one business brain.

**Current go-to-market posture:** Private Alpha — invite-only design partners. Primary CTA is **Apply for Private Alpha** (`/apply`). Public self-serve billing is **not** open. First customers are expected to be **small and growing service businesses**.

**Founding design partner #1:** GVM Baby World Ultrasound — **Operation GVM** remains locked Priority #1.

**Package / release:** `v0.2.0` (Next.js **16.2.10**, React 19). Next product release target: **v0.3.0 — GVM Go-Live** ([`docs/product/15_RELEASE_PLAN.md`](./product/15_RELEASE_PLAN.md)).

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
| Tests | Vitest, Playwright, verify scripts under `scripts/` |

Backend pattern: **Server Actions + Route Handlers** — no separate API server. Env contract: `.env.example`, `lib/env.ts`.

### Surfaces

| Surface | Audience | Paths |
|---------|----------|--------|
| Marketing site | Prospects / applicants | `app/(marketing)/*` — `/`, `/pricing`, `/platform`, `/product-tour`, `/industries`, `/meet-summer`, `/private-alpha`, `/apply`, `/roadmap`, … |
| Auth | Anyone | `app/(auth)/*`, `app/auth/callback` |
| Tenant product | Business owners | `/dashboard/*` |
| Public booking / portal | End customers | `/book/[slug]`, `/portal/[token]` |
| Owner platform | Chasum super-admins | `/owner/*` |
| Internal HQ | Founders | `/dashboard/hq`, `/dashboard/hq/private-alpha` |

### Key `lib/` domains

`booking-engine`, `commerce`, `crm`, `employees`, `communications`, `billing`, `reports`, `integrations`, `summer`, `chase`, `website-concierge`, `ai-workforce`, `ai-receptionist`, `marketing`, `hq`, `owner`, `os`, `business`, `supabase`, …

### AI systems (truth over theater)

| System | Role | Status posture |
|--------|------|----------------|
| **Summer (marketing)** | Website concierge / Meet Summer | Grounded Knowledge Engine |
| **Summer (in-app)** | Reception / booking assist | Early Access |
| **Chase** | Read-only ops insights | Early Access |
| **Emma (AI Receptionist)** | Grounded receptionist Phase 1 | Shipped foundation; deepen next |
| Additional AI roles (Alex, etc.) | Roadmap | Coming Next / Future Vision |

Canonical claim language: [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md). Summer Principle: [`docs/ai/SUMMER_PRINCIPLE.md`](./ai/SUMMER_PRINCIPLE.md).

### OS kernel (foundation)

Shared money recognition, commerce + platform events, business operating context, locale/datetime — see [`COMPANY_MEMORY.md`](../COMPANY_MEMORY.md) and [`docs/product/22_OS_KERNEL.md`](./product/22_OS_KERNEL.md).

---

## Current milestone

**Working name:** World Class Execution Program + protected Phase 0 GVM Production  

**Intent:**

1. Keep **Production** on `4eecbec` / tag `phase-0-gvm-production-2026-08-04` (https://chasum.vercel.app) — GVM assigned-employee booking, tax, deposits, receipts, emails, timezone, resend.
2. Advance **World Class** only on `cursor/world-class-portal-foundation` via **Vercel Preview** — Chapters 0–2 approved/locked; Chapter 3 delivered; Chapter 4 Customer Workspace + Booking Workspace final correction delivered — awaiting PO before Chapter 5.
3. Do **not** apply migrations **034–036**; do not merge/deploy World Class to Production until chapter approval.
4. Marketing locks remain locked — claim fixes require PO (see parity matrix **OWNER DECISION REQUIRED** items).

**Summer title (locked):** AI Business Manager — not Receptionist / chatbot / Emma in customer-facing copy.

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

**✅ Why Private Alpha — COMPLETE** · Status: **Locked** · Visual SoT: https://chasum-3lygrcwi7-renovisionappcom.vercel.app/private-alpha

**✅ Security — COMPLETE** · Status: **Locked** · Visual SoT: https://chasum-6vr9wmadu-renovisionappcom.vercel.app/security

**Next marketing surface:** Home page (`/`) when directed — Pricing, Summer Onboarding, Roadmap, and Resources are locked.

---

## Last completed work

### Most recent (2026-08-07)

**World Class Execution — Chapter 4 Adaptive Booking Workspace**

- Ask-only-what’s-missing decisions; summary strip; one decision area; success state
- Unified date & time panel; payment checkout; More options; silent hints
- Context prefill (CRM customer, calendar slot via `defaultDate`, drafts)
- Benchmark principles documented; no fake any-pro / waitlist / slot hold
- Contract: [`WORLD_CLASS_BOOKING_WORKSPACE.md`](./WORLD_CLASS_BOOKING_WORKSPACE.md)

### Immediately prior (2026-08-07)

**World Class Execution — Chapter 4 Booking Workspace final acceptance**

- True progressive stages (predecessor to adaptive workspace)

### Immediately prior (2026-08-06)

**World Class Execution — Chapter 4 correction & premium polish**

- Directory: tight operational columns, Clear filters, mobile Filters sheet, CRM status vs derived segments
- Customer overview health (avg spend Unavailable without commerce rollup); Chase observations grounded only
- Profile: read-first Overview + Edit sheet; Book / Message / Collect + More; Messages tab label
- Billing sections; Insights “Completed service list value”; Summer Observed vs Recommendations
- Data dictionary + docs updated
- **Production untouched · no migrations 034–036 · engines unchanged**

### Immediately prior (2026-08-06)

**World Class Execution — Chapter 4 Customer Workspace**

- Redesigned Customers directory + payment summary + profile workspace
- Feature commit `3793ec6` · stamp `6c5d939`

### Immediately prior (2026-08-06)

**World Class — lock portal review recommendations (docs only)**

- Created `docs/WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md` — permanent chapter-assigned backlog
- Created `docs/WORLD_CLASS_MARKETING_PARITY.md` pointer + marketing implications
- Formal **Polish & Intelligence Program** recorded as required pre-launch gate
- **No UI / engine / Production work in that docs commit**

### Immediately prior (2026-08-06)

**World Class Execution — Chapter 3 correction pass**

- Business-TZ week/month/agenda ranges via `getCalendarViewRange`
- Unassigned create: disabled “Assign later — coming soon” (flag off)
- Employee filter: All → named A–Z → Unassigned
- Chase: capacity/revenue Unavailable (no fake zeros)
- Resources empty state + Locations/Resources architecture (Ch9)

### Immediately prior (2026-08-06)

**World Class Execution — Chapter 3 Reception and Calendar**

- Shared `appointment-ops` SoT; Reception Morning Brief; calendar filters; payment readiness
- Docs: Reception/Calendar blueprint + data dictionary
- Feature commit `4b4a29e` · Preview https://chasum-76u5xrh9c-renovisionappcom.vercel.app

### Immediately prior (2026-08-06)

**Chapter 2 blocker — outstanding invoices SoT**

- Reports outstanding invoices use commerce SoT

### Immediately prior (2026-08-06)

**World Class Execution — Chapter 2 correction pass**

- Reconciled appointments today (exclude no_show + business TZ) across CC / Reception / Reports
- Standardized **Gross payments collected** (commerce SoT; refunds not subtracted); Reports executive aligned
- Attention areas label; softer cancellation attention copy
- Summer portal identity → AI Business Manager; AI Workforce Future Vision / Preview
- Reports: hide Inventory tab; hide Membership revenue; Automations/Customers titles; Developer nav+page gate

### Immediately prior (2026-08-05)

**World Class Execution — Chapter 2 Command Centre**

- Redesigned `/dashboard` as action-first Command Centre
- Data dictionary: `docs/WORLD_CLASS_COMMAND_CENTRE_DATA_DICTIONARY.md`
- Preview: https://chasum-q4yk6yain-renovisionappcom.vercel.app @ `20e0c89`

### Immediately prior (2026-08-05)

**World Class Execution — Chapter 0 Audit Completion Addendum (docs only)**

- Branch `cursor/world-class-portal-foundation`
- Expanded marketing-product parity (14 routes, critical dossiers A–H), plan entitlement evidence, industry source inventory (11 + Education tile), quality-debt baseline, cross-doc consistency
- Shell Preview: https://chasum-f2djbjdae-renovisionappcom.vercel.app (`d86e398`)
- Untracked excluded: brand PDF, brand scripts, `tmp/`

### Immediately prior (2026-08-05)

**World Class Execution — Chapter 0 initial audit docs**

- Commits `27cd0b3` / `f8e1c33` — initial matrices + SHA stamp

### Immediately prior (2026-08-04)

**Phase 0 GVM Production + World Class portal shell Preview**

- Production: `4eecbec` · `phase-0-gvm-production-2026-08-04`
- Portal foundation shell: `d86e398` on World Class branch (Preview only)

### Immediately prior (2026-07-30)

**Production deploy — approved marketing site → https://chasum.vercel.app**

- Branch `cursor/phase-3-integrations` @ `1d368a8` → deployment `dpl_H6JLmkWoKqbRuKu58baBEYXKzyeo`
- No Supabase migrations in deploy delta; GVM DB not reset
- Marketing HTTP smoke: all approved public pages 200
- Authenticated GVM portal smoke: pending operator login (auth gate verified)
- Audit: [`docs/MARKETING_PRODUCT_FEATURE_AUDIT.md`](./MARKETING_PRODUCT_FEATURE_AUDIT.md)

### Immediately prior (same day)

**✅ Security v1 — COMPLETE and locked**

- Final hero headline: “Security Designed Around Your Business” (supporting copy unchanged)
- Lock doc: `SECURITY_V1_LOCK.md`
- Allowed only: bugs, a11y, mobile responsiveness, performance, minor wording

### Immediately prior (same day)

**✅ Why Private Alpha v1 — COMPLETE and locked**

- Product-owner approved; production-ready
- Visual SoT: https://chasum-3lygrcwi7-renovisionappcom.vercel.app/private-alpha (commit `10a9e53`)
- Lock docs: `WHY_PRIVATE_ALPHA_V1_LOCK.md` + Resources lock updated
- Allowed only: bugs, a11y, responsive, performance, minor wording

### Immediately prior (same day)

**Why Private Alpha — final messaging + visual polish (pre-lock)**

- Partnership storytelling, premium journey, tightened spacing, CTA frame
- Left unlocked until product-owner approval

### Immediately prior (same day)

**Resources v1 — Security & Status locked; Private Alpha initially shipped**

- Why Private Alpha / Security / Status premium experiences
- Security + Status locked earlier; Private Alpha finalized later

### Immediately prior (same day)

**Roadmap v1 — finalized, approved, and locked**

- Renamed section to **Available in Chasum Today**; Pricing-aligned (Business Calls & Texting, SMS Reminders moved from Coming Soon)
- Replaced Business Text Messaging with **AI Workflow Automation**
- Business-outcome card copy pass; lock docs + agent rule

### Immediately prior (same day)

**Roadmap — ground-up redesign (business owners)**

- Replaced timeline / phase language with Available Today → Coming Soon → Future Vision + Built With Our Customers
- Apple-inspired feature cards; no Now/Next/Later, no developer release notes

### Immediately prior (same day)

**Summer Onboarding v1 — finalized & locked**

- Final consultation subheading: “I'd like to understand your business so I can personalize Chasum for you.”
- Lock docs refreshed for full Meet Summer onboarding experience

### Immediately prior (same chapter)

| Commit | Work |
|--------|------|
| `83fbaed` | Finalized Pricing page (Official Pricing Page v1 baseline) |
| Summer / AI Manager | Summer positioned as AI Business Manager across marketing |
| `8dfce34` / later | Summer Onboarding lock + consultation copy refinements |

### Immediately prior (same chapter)

| Commit | Work |
|--------|------|
| `83fbaed` | Finalized Pricing page with shared plan data (approved Official v1 baseline) |
| `7df9749` | Post-baseline polish — **superseded / rolled back** to match approved Preview |
| `c4d1d5e` | Pricing small-business-first copy |
| `c637984` / `cc40e78` | Pricing Final Customer Clarity Cleanup |
| `97c2904` | Pricing Customer-Facing Accuracy Cleanup |
| `c983ead` | World-Class Pricing Experience |
| Earlier on branch | Industries, Signature Experience, Platform / Product Tour / Meet Summer, homepage living interface |

### Product chapter (documented in CHANGELOG, not always tip-of-branch)

- Operation GVM — Commerce Engine Finalization (migrations `030`/`031`, gift certificates, arrival workflow)
- Premium Experience Sprints 1–2 (Design System v1 + craftsmanship)
- OS Kernel foundation sprint

---

## Active branch

```
cursor/world-class-portal-foundation
```

- Base: Production-approved `4eecbec` (+ World Class commits).
- Tracks `origin/cursor/world-class-portal-foundation`.
- **`main` / Production** remain on Phase 0 tag unless PO promotes a chapter.
- Legacy product branch `cursor/phase-3-integrations` preceded the Production FF to `4eecbec`.

**Deploy policy:** World Class → **Preview only**. Never Production without explicit PO approval.

---

## Latest commit

| Field | Value |
|-------|--------|
| **SHA** | `32a9ce1396a7d88e2097b7ad0d2c70d99bf7a35d` |
| **Short** | `32a9ce1` |
| **Subject** | feat: Chapter 4 adaptive booking workspace |
| **Prior tip** | `6ebcd13` |
| **Chapter 4 Customer Workspace** | `3793ec6` / polish `0052bc3` |
| **Branch Preview alias** | https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app |
| **Production SHA** | `4eecbec0f0f04532ae0294132d07183b6e64f23f` |

---

## Uncommitted work

As of last update:

| Path | Notes |
|------|--------|
| `docs/brand/CHASUM.pdf` | Untracked — leave out of product commits unless intentionally shipping brand assets |
| `scripts/rebuild-brand-*.mjs` / `refine-brand-six.mjs` | Untracked brand tooling |
| `tmp/` | Local screenshots / scratch — do not commit |

---

## Next recommended task

**Priority order:**

1. **PO review of Chapter 4** — Customer Workspace + Booking Workspace Preview before Chapter 5.
2. Treat [`WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md`](./WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md) as locked deliverables — apply progressive items during later chapters.
3. **Operation GVM Production** — remain protected.
4. Marketing claim fixes only with **explicit PO** (locked pages).

Do **not** start Chapter 5 until PO approves.  
Do **not** start Inventory product, Marketplace, native mobile, EMR, or migrations 034–036 unless explicitly requested.  
Do **not** redesign locked marketing pages unless the product owner explicitly requests it.

---

## Known issues

Tracked in depth in [`docs/TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md), [`docs/LAUNCH_RISK_REGISTER.md`](./LAUNCH_RISK_REGISTER.md), and product audits. Snapshot:

### Product / go-live

- Public self-serve SaaS checkout not live (mock billing provider) — Private Alpha is intentional.
- Multi-staff login / RBAC invites — Coming Next (roles catalog exists; enforcement incomplete).
- GVM: first real client appointment + production email SMTP still open on release plan.
- Booking Sheet “collect payment” still partially stubbed relative to full Commerce.

### Engineering debt (open)

- Dual communications stacks (`lib/communications/*` vs orchestrator).
- Mock SaaS billing (`TD-C6`).
- Employee roles not fully enforced (`TD-H6`).
- Portal / ICS tokens not hashed like API keys.
- Next.js `middleware.ts` → `proxy` deprecation warning.
- Soft-empty reports for unbuilt modules can look like “$0” instead of “unavailable.”
- Legacy Emma + Summer dual reception paths still coexist.

### Marketing discipline

- Roadmap status labels (**Available Today / Early Access / Coming Next / Future Vision**) belong on Roadmap and truth matrix — **not** inside Pricing plan inclusions.
- Never market unsupported SLA, unfinished automation, or staff login as included.

---

## Current priorities

Locked order for this chapter:

1. **Operation GVM** — reliability, synchronization, commerce truth, reception craft for the live design partner.
2. **Honest Private Alpha GTM** — Apply / Demo CTAs; pricing that small businesses understand; Product Truth Matrix compliance.
3. **OS-quality foundation** — one business brain; truth over theater; extend Design System v1 (no drive-by redesigns).
4. **AI depth without theater** — deepen Summer / Chase / Emma only with grounded context; no invented availability or prices.
5. **Charge-with-integrity path** — Stripe and self-serve only when operationally ready (see 30/90-day plans).

---

## Development roadmap

### Completed (company view)

See full table in [`docs/company/MASTER_ROADMAP.md`](./company/MASTER_ROADMAP.md). Highlights:

- Auth, Owner Platform, Billing UI, Communication Center, Employees, CRM  
- Calendar & Booking Engine, Business Management, Reports  
- AI Receptionist Phase 1 (Emma)  
- OS Kernel foundation  
- Phase 3 Integrations (calendars, email/SMS, jobs, developer API surface) — engineering history in [`docs/ROADMAP.md`](./ROADMAP.md)  
- World-class marketing site chapter (homepage → Meet Summer → Platform → Product Tour → Industries → Pricing)

### Near-term (v0.3.0 / Private Alpha)

| Theme | Outcome |
|-------|---------|
| GVM Go-Live | Real appointments week; Picktime cutover path; production email |
| Stripe (when ready) | Live provider behind existing billing interface |
| Staff login | Invite + RBAC enforcement |
| Emma deepen | FAQ/config storage; public booking assist channel |
| Messaging | Resend/Twilio verified in staging/production |

Plans: [`docs/30_DAY_PRIVATE_ALPHA_PLAN.md`](./30_DAY_PRIVATE_ALPHA_PLAN.md), [`docs/90_DAY_EXECUTION_PLAN.md`](./90_DAY_EXECUTION_PLAN.md).

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

---

## Milestone update checklist

When a milestone completes, update this file:

- [ ] **Last updated** date  
- [ ] **Last completed work** (what + commit SHAs)  
- [ ] **Active branch** / sync status  
- [ ] **Latest commit**  
- [ ] **Uncommitted work** (`git status`)  
- [ ] **Current milestone** name/intent if changed  
- [ ] **Next recommended task**  
- [ ] **Known issues** / **Priorities** if the chapter shifted  
- [ ] Cross-link `docs/CHANGELOG.md` entry when product behavior shipped  
- [ ] Commit this file with the milestone (or immediately after)

---

*This file is the handoff bridge. Deep truth lives in the linked docs; this page must stay short enough that a new session can re-orient in under five minutes.*
