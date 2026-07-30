# CURRENT_PROJECT_STATE.md

**Status:** Living project handoff — permanent source of truth for “where Chasum is right now”  
**Authority:** This repository and `/docs` are the source of truth. External chat history is not.  
**Update rule:** Refresh this file after every completed milestone (and when branch / commit / priorities materially change).  
**Last updated:** 2026-07-30  
**Updated by:** Summer Onboarding v1 finalized + Roadmap premium rebuild

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
| [`docs/marketing/HOMEPAGE_MASTER_SPECIFICATION.md`](./marketing/HOMEPAGE_MASTER_SPECIFICATION.md) | Home page (`/`) canonical front-door spec |
| [`docs/product/05_ARCHITECTURE.md`](./product/05_ARCHITECTURE.md) | Product architecture detail |
| [`docs/CHANGELOG.md`](./CHANGELOG.md) | Ship history |
| [`docs/TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md) | Debt register |

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

**Working name:** Private Alpha — World-class marketing site + Operation GVM hardening  

**Intent:**

1. Keep **Operation GVM** as the product truth source (reliability, commerce, reception craft).
2. Present an honest, premium public site that converts small service businesses into Private Alpha applicants — without mixing Roadmap status language into Pricing inclusions.
3. Stay on branch `cursor/phase-3-integrations` until a coherent release slice is ready to merge to `main`.

**Release name (company backlog):** Company OS + AI Receptionist foundation — see [`docs/company/MASTER_TASKS.md`](./company/MASTER_TASKS.md).

---

## Approved marketing pages (locks)

| Page | Version | Status | State | Visual source of truth |
|------|---------|--------|-------|------------------------|
| **Pricing** (`/pricing`) | Official Chasum Pricing Page **v1** | ✅ **APPROVED** | **Locked** | https://chasum-aw2cx9wbn-renovisionappcom.vercel.app/pricing |
| **Summer Onboarding** (`/meet-summer` guided) | Summer Onboarding **v1** | ✅ **APPROVED** | **Locked** | https://chasum-7o8esta4x-renovisionappcom.vercel.app/meet-summer |

**Pricing is complete.** Design at the Pricing Preview URL is the approved baseline (implementation commit `83fbaed`). Do **not** revisit Pricing for redesign or visual polish unless the product owner explicitly requests it. Full lock rules: [`docs/marketing/PRICING_PAGE_V1_LOCK.md`](./marketing/PRICING_PAGE_V1_LOCK.md).

**Summer Onboarding is complete and locked** as the approved baseline for `/meet-summer` (category selection + consultation copy). Do **not** redesign or polish unless the product owner explicitly requests it. Full lock rules: [`docs/marketing/SUMMER_ONBOARDING_V1_LOCK.md`](./marketing/SUMMER_ONBOARDING_V1_LOCK.md).

**Next marketing surface:** continue refining **Roadmap** (`/roadmap`) until product-owner approval.

---

## Last completed work

### Most recent (2026-07-30)

**Summer Onboarding v1 — finalized & locked; Roadmap premium rebuild started**

- Final consultation subheading: “I'd like to understand your business so I can personalize Chasum for you.”
- Lock docs refreshed for full Meet Summer onboarding experience
- Public Roadmap rebuilt as a benefit-first vertical timeline (Completed → In Progress → Upcoming → Future Vision), Product Truth aligned

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
cursor/phase-3-integrations
```

- Tracks `origin/cursor/phase-3-integrations` (in sync as of last push).
- Base branch for merges: **`main`**.
- Tip of `main` (for orientation): `37778de` — *Operation Summer – Fast Pacing & Multi-Business Selection* (this feature branch is many commits ahead with marketing + product work).

**Deploy policy (recent marketing work):** Preview deploys only unless Production is explicitly requested.

---

## Latest commit

| Field | Value |
|-------|--------|
| **SHA** | `805f3671405b29cece10d0a9481996c5ad774081` |
| **Short** | `805f367` |
| **Subject** | Lock Official Chasum Pricing Page v1 + restore approved baseline |
| **Date** | 2026-07-30 |

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

**Priority order (do not skip #1 for novelty):**

1. **Operation GVM (Priority #1)** — Close remaining go-live blockers from [`docs/GVM_GO_LIVE.md`](./GVM_GO_LIVE.md) and [`docs/product/04_BACKLOG.md`](./product/04_BACKLOG.md) P0: first real appointment, Resend SMTP in Supabase, production email path.
2. **Roadmap (`/roadmap`)** — Premium timeline in progress; seek product-owner approval. Keep claims aligned with [`PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md). **Pricing and Summer Onboarding are locked — do not reopen.**
3. **Home page (`/`)** — Later marketing chapter when directed.
4. **Engineering hardening (from MASTER_TASKS)** — migrations verified per env; Emma FAQ/config storage; staff login enforcement; Stripe provider behind existing billing interface when ready.

Do **not** start Inventory, Marketplace, native mobile, or V2 redesign unless explicitly requested.  
Do **not** redesign or polish `/pricing` unless the product owner explicitly requests it.

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
