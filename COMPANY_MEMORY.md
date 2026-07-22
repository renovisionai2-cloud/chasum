# COMPANY_MEMORY.md

**Status:** Living founder memory — read before every implementation session  
**Authority:** Operational priorities for the current chapter of Chasum  
**Constitution:** When values conflict, [`docs/company/CHASUM_BIBLE.md`](docs/company/CHASUM_BIBLE.md) wins.

---

## Mission

Build the world’s best **AI Business Operating System** for appointment-based service businesses.

Chasum is not booking software. Appointments are foundational; the product is the operating layer: calendar, CRM, employees, billing, reports, communications, and AI workforce sharing one business brain.

---

## Current priority (locked)

**Operation GVM remains Priority #1.**

Continue refining the platform from real validation with **GVM Baby World** (Founding Design Partner #001).

- Do not build random features.
- Do not introduce feature creep.
- Prefer reliability, synchronization, and OS-quality craft over new modules.

Recent GVM sprints: deployment readiness, partner bug fixes, business validation (payments, billing, reports, packages, currency, gift certificates).

---

## Operating system principles

1. **One Business Brain** — Customer, Appointment, Employee, Location, Service, Package, Payment, Invoice, Gift Card, and Report share one data model and one source of truth for money and time.
2. **Truth over theater** — No invented availability, prices, or AI facts. Empty states beat fake readiness.
3. **AI-ready, not AI-theater** — Prepare event layers and business memory before shipping new AI capabilities. Summer and Chase consume grounded context only.
4. **Global-ready foundation** — Currency, language, timezone, and locale helpers exist before translations.
5. **Beautiful on every device** — Reception and owner workflows must work on phone, tablet, and desktop.
6. **Extend, don’t redesign** — Preserve the design system unless a deliberate redesign is requested.

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
- Soft-fail when optional migrations are missing.
- Surgical diffs — no drive-by refactors of unrelated modules.
- **Extend, don’t redesign** — Premium Experience polish uses Design System v1; no parallel UI languages.

---

## Decision log (this chapter)

| Decision | Why |
|----------|-----|
| Single revenue recognition helper | GVM reports and CRM showed conflicting $0 / revenue formulas |
| Commerce events mirror booking events | Future Summer/Chase need one event vocabulary without building AI yet |
| BusinessOperatingContext facade | One memory shape for AI; no new AI features |
| Locale/datetime helpers without i18n catalogs | Global-ready architecture; translate later |
| Operation GVM still #1 | Design partner truth > roadmap novelty |
| Design System v1 before more features | Experience quality compounds; competitors win on features, we win on craft |

---

*Last updated: Premium Experience Sprint 2 — Craftsmanship.*
