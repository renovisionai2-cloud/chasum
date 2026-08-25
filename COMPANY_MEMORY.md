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

## Current chapter (2026-08-25 restamp)

Post-break World Class resumption. Phase 1 navigation, Phase 2 staff plan honesty, and Phase 3 Command Centre V1 are **merged to `main`**. This restamp is documentation / governance only; **Phase 4A is not started**. Commercial SaaS Lifecycle remains **PARTIAL** after 4A unless Gate B (commercial-v1 paid billing) is also met.

Roadmap outcomes must stay balanced:

| Outcome | Role |
|---------|------|
| **A. Core Operations** | Scheduling, customers, staff, catalog, money, communications, reporting, workflows — strongest axis; Command Centre V1 is the operating home |
| **B. Commercial SaaS** | Currently **trails** Core Operations — remains **PARTIAL**. Recommended next product phase: **Phase 4A** lifecycle honesty (Private Alpha / design-partner billing). Gate B paid-provider billing is later and is required before commercially launchable v1. |
| **C. Intelligence** | **Summer = AI Business Manager** (positioning). Implementation is still strongest in booking / availability / CRM-grounded assist + grounded Command Centre facts — deepen without over-claiming |
| **D. Validation** | GVM Baby World and **Chasum HQ** are **normal tenants**. Working planning targets: Late Sep–Oct 2026 stable pilots. Momentic is complete regression infrastructure, not a roadmap track |

**Launch governance:** [`docs/LAUNCH_READINESS.md`](docs/LAUNCH_READINESS.md). Working targets (not public promises): GVM+HQ pilots Late Sep–Oct 2026; outside Private Alpha Oct–Nov 2026; commercially launchable v1 Dec 2026–Feb 2027.

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

## Engineering reminders

- Read Next.js docs under `node_modules/next/dist/docs/` before new App Router patterns.
- Multi-tenant: every business-owned row carries `business_id`; respect location scope.
- Preview uses Staging; Production uses Production.
- Soft-fail when optional migrations are missing.
- Surgical diffs — no drive-by refactors of unrelated modules.
- Level 3 (tenancy, auth/RLS, billing, booking architecture, navigation architecture, migrations, tenant identity, Production data): Claude independent pre-challenge before Cursor implementation.
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

*Last updated: 2026-08-24 — source-of-truth realignment (documentation only).*
