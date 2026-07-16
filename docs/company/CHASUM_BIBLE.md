# The Chasum Bible

**Status:** Constitution — mandatory reading before every development session  
**Location:** `docs/company/CHASUM_BIBLE.md`  
**Authority:** Highest. When other docs conflict, this document wins unless explicitly amended here.

This is the Constitution of Chasum. It defines who we are, what we build, how we build it, and what “done” means. Every future agent, engineer, designer, and founder session starts here.

---

## 1. Mission

Build the world’s most intelligent **AI-powered Business Operating System** for service-based businesses — so owners spend less time on admin and more time serving customers and growing revenue.

Appointments are foundational. They are not the whole product.

---

## 2. Vision

A clinic, salon, studio, garage, or enterprise network opens Chasum and runs the business from one place:

- Human staff and AI employees share the same context
- Calendar, CRM, communication, billing, reports, and operations stay multi-tenant and location-aware
- AI removes work, recommends actions, never invents business data, and keeps the owner in control
- Single location → multi-location → multi-business → enterprise scales without rewrites

Chasum is not “another booking tool.” Chasum is the operating layer for modern service businesses.

---

## 3. Company Values

1. **Owners first** — Every feature must help the person who runs the business.
2. **Truth over theater** — Prefer empty states and honest limits over fake data, fake AI, or fake readiness.
3. **Time is sacred** — Save clicks, typing, waiting, and cognitive load.
4. **Revenue with integrity** — Help businesses make money without dark patterns.
5. **Enterprise from day one** — Design for scale even when shipping for a solo shop.
6. **Stewardship** — Multi-tenant data is sacred; security and isolation are non-negotiable.
7. **Craft** — Beautiful, fast, accessible software is a product requirement, not polish.
8. **Document what lasts** — Decisions that guide years belong in writing.

---

## 4. Product Philosophy

- **AI Business Operating System** — Appointments, CRM, employees, communication, reports, billing, and AI workforce are one platform.
- **Departments, not random pages** — Features ship as coherent departments (CRM, Business, Reports, Employees, Reception) that integrate.
- **Save time or make money** — If a feature does neither (and does not reduce stress or improve CX), reconsider it.
- **Simplicity over complexity** — Prefer one clear flow over five advanced options.
- **Configuration over hardcoding** — Business knowledge (hours, services, staff, policies) comes from Chasum data.
- **Extend, don’t redesign** — Preserve the existing design system and branding unless a deliberate redesign is requested.
- **No breaking multi-tenant FKs** — Additive migrations, soft fallbacks when tables are missing, location scope respected.
- **Mobile-first operations** — Reception and owner workflows must work on phones and tablets.
- **Owner control** — Automation expands with consent; kill-switches and approvals matter.

Related: [`PRODUCT_PRINCIPLES.md`](./PRODUCT_PRINCIPLES.md), [`../product/16_PRODUCT_PRINCIPLES.md`](../product/16_PRODUCT_PRINCIPLES.md).

---

## 5. Engineering Standards

- **Stack:** TypeScript, Next.js (read `node_modules/next/dist/docs/` for this version’s APIs), Supabase (Auth, Postgres, RLS), Tailwind design system.
- **Server actions** for mutations; clear `"use server"` boundaries; revalidate the right paths.
- **Multi-tenant by default:** every business-owned row carries `business_id`; RLS via `is_business_owner` (and future staff auth).
- **Location-aware:** respect `getLocationScope` / `withLocationFilter` where ops data is location-scoped.
- **Additive SQL migrations** only (`NNN_name.sql`); never destroy tenant data for convenience.
- **Soft-fail** when optional migrations are not applied — UI remains usable with guidance.
- **No invented availability, prices, policies, or client facts** — especially in AI and calendar.
- **Providers are pluggable** — email, SMS, billing, AI, calendars: interface + stub/fallback + real adapter.
- **Do not modify unrelated modules** — surgical diffs; no drive-by refactors.
- **Read Next.js deprecations** before using training-data patterns that may be outdated.

---

## 6. UI / UX Standards

- Extend the existing Chasum design system (`ds-page`, `PageHeader`, `Card`, `StatCard`, `EmptyState`, pill tabs, form feedback).
- **Do not redesign** existing UI or branding unless explicitly requested.
- Dark mode and light mode must both work.
- Loading, empty, and error states are required for every interactive surface.
- Prefer one job per section; reduce clutter; keep reception and dashboards scannable.
- Accessible: keyboard, focus rings, labels, sufficient contrast.
- Mobile responsive; touch targets usable at reception.
- Charts and KPIs are presentational via shared primitives — no one-off chart libraries without need.

Related: [`../UI_GUIDELINES.md`](../UI_GUIDELINES.md), [`../product/07_DESIGN_SYSTEM.md`](../product/07_DESIGN_SYSTEM.md), [`../product/18_UX_PRINCIPLES.md`](../product/18_UX_PRINCIPLES.md).

---

## 7. AI Philosophy

AI employees are **teammates with jobs**, not chatbots.

1. AI removes work instead of creating work.
2. AI recommends actions, not only dashboards.
3. AI never invents business data — hours, slots, prices, policies, and history come from Chasum.
4. AI explains recommendations in plain language.
5. Owners remain in control (assist → automate → collaborate only with consent).
6. Every AI employee has a named role and clear success metrics (Emma, Alex, Maya, Leo, Sophia, Noah, …).
7. AI workers may hand off to each other and to humans.
8. Voice, SMS, and channels may be architected early; do not claim capabilities that are not shipped.
9. Multi-tenant isolation applies to prompts, logs, and tools — no cross-business leakage.
10. Escalation to humans is a feature, not a failure.

Related: [`../product/19_AI_PRINCIPLES.md`](../product/19_AI_PRINCIPLES.md), [`../product/20_AI_WORKFORCE.md`](../product/20_AI_WORKFORCE.md).

---

## 8. Security Standards

- Authentication via Supabase Auth; protect dashboard and owner routes.
- **RLS on all tenant tables**; never expose service role to the browser.
- Secrets only in env (`lib/env.ts` getters); never commit `.env.local` or keys.
- Platform Owner (`/owner`) is separate from customer dashboard; gate by platform admin rules.
- Validate inputs on the server; least privilege on RPCs (`SECURITY DEFINER` carefully).
- Log safely — no secrets in logs; be careful with PII in AI transcripts.
- Prefer fail-closed for money, booking writes, and admin actions.

---

## 9. Multi-tenant Rules

| Rule | Requirement |
|------|-------------|
| Tenant key | `business_id` on business-owned data |
| Isolation | RLS + server queries scoped to the current business |
| Locations | Support single, multi-location, and “all locations” scope |
| Multi-business / enterprise | Architecture must not block future org hierarchies |
| Public booking | SECURITY DEFINER / controlled RPCs; never leak other tenants |
| Migrations | Additive; soft-fallback in app when tables missing |
| AI / reports / CRM | Always filter by `business_id` (and location when applicable) |
| No cross-tenant joins | for convenience or analytics without explicit platform-owner tooling |

---

## 10. Coding Standards

- Match existing file structure, naming, and patterns before inventing new ones.
- Prefer reuse (`lib/actions/*`, shared UI, existing services) over parallel stacks.
- Keep functions focused; avoid huge unrelated files in one PR.
- Types live near domains (`lib/*/types.ts`); don’t weaken types to silence errors.
- Comments only for non-obvious intent; no noisy narrating comments.
- User-facing copy: clear, calm, professional — no fake “AI magic” claims.
- Git: commit when asked; concise why-focused messages; no secrets; no force-push to main.

---

## 11. Definition of Production Ready

A feature is production ready only when:

1. It works for real multi-tenant data (not hardcoded demos).
2. Loading, empty, and error states exist.
3. Authorization and tenant isolation are correct.
4. It respects location scope where relevant.
5. It does not invent availability, prices, or customer facts.
6. `npm run lint` and `npm run build` pass.
7. `docs/CHANGELOG.md` is updated.
8. Migrations (if any) are additive and documented.
9. Mobile and dark mode are acceptable.
10. Rollback or soft-fallback path exists if a migration is not yet applied.
11. Docs that own the area are updated when behavior becomes lasting policy.

Related: [`../PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md).

---

## 12. Release Process

1. Implement against principles and roadmap ([`MASTER_ROADMAP.md`](./MASTER_ROADMAP.md), [`MASTER_TASKS.md`](./MASTER_TASKS.md)).
2. Run **lint** and **build**; fix all issues introduced.
3. Update **CHANGELOG**.
4. **Commit** with a clear message (why over what).
5. **Push** the feature branch.
6. Open / update PR toward `main` when the release slice is ready.
7. Apply required Supabase migrations in each environment before relying on new tables.
8. Verify critical paths (auth, booking, tenant isolation) after merge/deploy.

---

## 13. Testing Standards

- Prefer real scheduling engine and real queries over mocked fantasy data for availability.
- Manually verify: happy path, empty state, error/soft-fail, dark mode, narrow viewport.
- Protect regressions in tenant filters and RLS assumptions.
- Do not merge knowingly broken lint/build.
- Add automated tests when they lock critical contracts (auth, billing, slots) without slowing the team on pure UI churn.

---

## 14. Documentation Standards

| Doc | Role |
|-----|------|
| **`docs/company/CHASUM_BIBLE.md`** | Constitution (this file) |
| **`docs/company/PRODUCT_PRINCIPLES.md`** | Feature decision filter |
| **`docs/company/MASTER_ROADMAP.md`** | Official completed + future roadmap |
| **`docs/company/MASTER_TASKS.md`** | Active backlog and sprint rules |
| `docs/CHANGELOG.md` | What shipped |
| `docs/product/*` | Deep product strategy and modules |
| `docs/DATABASE.md`, `docs/API.md`, etc. | Technical references |

**Rules:**

- Company OS docs are mandatory reading before development sessions.
- Prefer updating the company OS when a rule becomes permanent.
- Keep docs accurate; delete or mark obsolete claims.
- Documentation-only changes still get CHANGELOG entries when they establish lasting process.

---

## Amendment

Amend this Bible deliberately. Record material changes in `docs/CHANGELOG.md` and, if needed, [`../product/14_DECISION_LOG.md`](../product/14_DECISION_LOG.md).

---

*Chasum Company Operating System — Constitution*
