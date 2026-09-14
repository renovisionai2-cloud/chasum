# COMPANY_MEMORY.md

**Status:** Living founder memory — read before every implementation session  
**Authority:** Operational priorities for the current chapter of Chasum  
**Constitution:** When values conflict, [`docs/company/CHASUM_BIBLE.md`](docs/company/CHASUM_BIBLE.md) wins.
**Handoff:** Current LOCKED / ACTIVE / BLOCKED / NEXT live in [`docs/CURRENT_PROJECT_STATE.md`](docs/CURRENT_PROJECT_STATE.md). That control board wins over older “GVM is the entire roadmap” language below.

---

## Mission

Build the world’s best **AI Business Operating System** for appointment-based service businesses.

Chasum is not booking software. Appointments are foundational; the product is the operating layer: calendar, CRM, employees, billing, reports, communications, Commercial SaaS lifecycle, and AI workforce sharing one business brain.

---

## Current chapter (2026-09-14 restamp)

PR #32 is **MERGED / ACCEPTED**. Canonical main and accepted Production Git SHA are `8df29d298c196a2431c86a8cea4af1e5bfec09fd`; accepted deployment is `dpl_3wENSHQrTUnu6VkaqjE7coJ4kjbn`. Canonical GitHub source of truth is **RESTORED** and Production release **ACCEPTED**. These are accepted 2026-09-14 release identities, not permanent architectural constants; future serving truth comes from the actual environment/current release record.

Recovery **CLOSED**; hold OFF, Cron enabled, webhooks OFF. Phase 5 **IN PROGRESS**; Gate A complete, Gate B NOT MET; Outside Private Alpha not started. Do not reopen recovery absent new contradictory runtime evidence.

Post-release locked execution queue:

1. GVM + Chasum HQ Phase 5 validation **in parallel**: observe a legitimate GVM booking with customer confirmation and business new-booking email, each exactly once; HQ dogfoods Command Centre, Reception, customers, service/staff and normal daily operations. Engineering must not wait idle for a GVM customer.
2. Outside Private Alpha readiness, including observability, switching/import capability and tenant onboarding/identity safety.
3. Commercial SaaS Gate B — explicit major post-Phase-5 priority; separately scoped and approved before implementation.
4. Summer Business Manager horizontal v1 — explicit major post-Phase-5 priority; separately scoped and approved before implementation.

Core Operations launch-required defect work continues throughout. GVM and HQ are validation tenants, not product forks; neither may dominate the roadmap.

Roadmap outcomes must stay balanced:

| Outcome | Role |
|---------|------|
| **A. Core Operations** | Scheduling, customers, staff, catalog, money, communications, reporting, workflows — strongest axis; Command Centre V1 is the operating home |
| **B. Commercial SaaS** | Currently **trails** Core Operations — remains **PARTIAL**. Phase 4A Gate A (Private Alpha billing honesty) is **COMPLETE**. Gate B is the explicit commercial chapter after Outside Private Alpha readiness and is required before commercially launchable v1. |
| **C. Intelligence** | **Summer = AI Business Manager** (positioning). Implementation is still strongest in booking / availability / CRM-grounded assist + grounded Command Centre facts — deepen without over-claiming |
| **D. Validation** | GVM Baby World and **Chasum HQ** are **normal tenants**. Working planning targets: Late Sep–Oct 2026 stable pilots. Momentic is complete regression infrastructure, not a roadmap track |

**Launch governance:** [`docs/LAUNCH_READINESS.md`](docs/LAUNCH_READINESS.md) — **18 workstreams**. Working targets (not public promises): GVM+HQ pilots Late Sep–Oct 2026; outside Private Alpha Oct–Nov 2026; commercially launchable v1 Dec 2026–Feb 2027. Commercial v1 does **not** require full AI autonomy. Preserve AI-operated architecture now. Native mobile is **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY** (working direction: React Native + Expo; final stack at native-app preflight). One reusable multi-tenant app — GVM and Chasum HQ are normal tenants, not forks.

**Chasum HQ** means the real normal business tenant used to operate Chasum itself — same architecture as outside customers. It is **not** `/owner` and **not** `/dashboard/hq`.

**`/owner`** is the Platform Admin / Control Centre direction.

**`/dashboard/hq`** is a legacy founder-only surface. Naming/disposition unresolved. Do not expand it.

**World Class grouped nav** is PO-approved and **on `main`** (Phase 1, PR #23). `origin/cursor/world-class-portal-foundation` is **reference-only**.

**GVM duplicate-tenant identity incident is CLOSED.** Tenant Identity Safety Gate remains permanent. Remaining GVM go-live items (first real appointment, production email) are **validation**, not automatic domination of the backlog.

---

## Operating system principles

1. **One Business Brain** — Customer, Appointment, Employee, Location, Service, Package, Payment, Invoice, Gift Card, and Report share one data model and one source of truth for money and time.
2. **Truth over theater** — No invented availability, prices, or AI facts. Empty states beat fake readiness. Coming Soon stays Coming Soon.
3. **AI-ready, not AI-theater** — Prepare event layers and business memory before shipping new AI capabilities. Summer and Chase consume grounded context only.
4. **Global-ready foundation** — Currency, language, timezone, and locale helpers exist before translations.
5. **Beautiful on every device** — Reception and owner workflows must work on phone, tablet, and desktop.
6. **Extend, don’t redesign** — Preserve the design system unless a deliberate redesign is requested.
7. **No tenant forks** — GVM-specific and HQ-specific needs become configuration where possible.

---

## Foundation map (kernel)

| Concern | Module |
|---------|--------|
| Money recognition + formatting | `lib/commerce/recognize.ts`, `lib/commerce/money.ts` |
| Booking domain events | `lib/booking-engine/events/` |
| Commerce domain events | `lib/commerce/events/` |
| Platform event types (AI-ready) | `lib/os/events.ts` |
| Business memory / context | `lib/business/context.ts` |
| Locale / datetime | `lib/locale.ts`, `lib/business/datetime.ts` |
| Scheduling truth | Booking Engine + Postgres RPCs |
| Design System v1 | `docs/product/23_DESIGN_SYSTEM_V1.md`, `components/ui/*` |
| Craftsmanship (Sprint 2) | Dashboards, tables, toasts/sheets, customer docs, operator copy |

---

## Agent operating model

Darshan = Founder / CEO / Product Owner. ChatGPT = control tower / Product & Development Program Lead. Codex = DEFAULT primary implementation engineer. Cursor = situational engineer when local/auth/device environment offers a real advantage. Claude = independent auditor for higher-risk work. Momentic = browser/workflow regression. One primary implementer per task.

## Engineering reminders

- Read Next.js docs under `node_modules/next/dist/docs/` before new App Router patterns.
- Multi-tenant: every business-owned row carries `business_id`; respect location scope.
- Preview uses Staging; Production uses Production.
- Soft-fail when optional migrations are missing.
- Surgical diffs — no drive-by refactors of unrelated modules.
- Level 3 (tenancy, auth/RLS, billing, booking architecture, navigation architecture, migrations, tenant identity, Production data): Claude independent pre-challenge before primary-engineer implementation.
- **Extend, don’t redesign** — Premium Experience polish uses Design System v1; no parallel UI languages.

---

## Decision log (this chapter)

| Decision | Why |
|----------|-----|
| Single revenue recognition helper | GVM reports and CRM showed conflicting $0 / revenue formulas |
| Commerce events mirror booking events | Future Summer/Chase need one event vocabulary without building AI yet |
| BusinessOperatingContext facade | One memory shape for AI; no new AI features |
| Locale/datetime helpers without i18n catalogs | Global-ready architecture; translate later |
| Design System v1 before more features | Experience quality compounds; competitors win on features, we win on craft |
| Chasum HQ = normal tenant | Dogfood the reusable product; control plane stays `/owner` |
| `/dashboard/hq` = legacy surface | Avoid expanding a misnamed founder console until PO disposition |
| World Class grouped nav on `main` | Protect IA; Phase 1 shipped via pre-challenge + minimum diff (PR #23) |
| GVM identity incident closed | Process gate remains; incident is not a World Class blocker |
| Commercial SaaS trails Core Operations | Do not mark billing lifecycle / RBAC / dunning complete |
| Summer = Business Manager; implementation lags | Keep strategy; document the gap honestly |

### Historical (superseded as current instruction)

**Former lock:** “Operation GVM remains Priority #1” as the entire chapter. **Now:** GVM remains a critical validation tenant; it must not consume the whole roadmap. See [`docs/CURRENT_PROJECT_STATE.md`](docs/CURRENT_PROJECT_STATE.md) NEXT.

---

*Last updated: 2026-09-14 — post-release source-of-truth and locked roadmap restamp.*
