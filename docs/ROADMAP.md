# Chasum Roadmap

> **Product docs:** Strategy, north star, backlog, and release plan live in [`product/`](./product/).

Chasum is an AI-powered appointment booking SaaS platform (Calendly-like) for modern businesses. This document outlines completed phases and planned work.

---

## Phase 1 — Foundation ✅ Complete

**Goal:** Launch-ready shell with auth and marketing site.

| Deliverable | Status |
|-------------|--------|
| Landing page (hero, features, pricing) | ✅ |
| Design system (Tailwind v4, dark/light mode) | ✅ |
| Supabase authentication (signup, login, forgot/reset password) | ✅ |
| Auth callbacks (`/auth/callback`, `/auth/confirm`) | ✅ |
| Dashboard shell (sidebar, top nav, mobile drawer) | ✅ |
| Route protection via middleware | ✅ |
| Theme provider with SSR-safe hydration | ✅ |

---

## Phase 2 — Booking Engine ✅ Complete

**Goal:** Full appointment scheduling for business owners and public clients.

| Deliverable | Status |
|-------------|--------|
| Multi-tenant database schema (11 tables) | ✅ |
| Row Level Security on all tables | ✅ |
| Services CRUD (categories, buffers, pricing) | ✅ |
| Staff CRUD (schedules, vacations, service assignments) | ✅ |
| Clients CRUD (tags, notes, profile pages) | ✅ |
| Calendar (day / week / month views) | ✅ |
| Drag-to-reschedule (day view) | ✅ |
| Appointment CRUD with status workflow | ✅ |
| Business settings (hours, holidays, booking policy) | ✅ |
| Public booking page (`/book/[slug]`) | ✅ |
| Dashboard overview (stats, revenue, schedule) | ✅ |

---

## Architecture Review ✅ Complete

**Goal:** Harden the application before Phase 3.

| Deliverable | Status |
|-------------|--------|
| Shared UI components (toast, forms, dialogs) | ✅ |
| RLS hardening migration (`003_rls_hardening.sql`) | ✅ |
| SECURITY DEFINER RPCs for public booking | ✅ |
| Loading and error boundaries | ✅ |
| Accessibility improvements (ARIA, focus trap) | ✅ |
| Performance (batch queries, `router.refresh()`) | ✅ |
| Type consolidation (`StaffWithServices`, etc.) | ✅ |

**Prerequisite before production:** Run migration `003_rls_hardening.sql` in Supabase.

**Auth production prerequisite (deferred):** Authentication code is complete. Enable **custom SMTP in Supabase** (Resend recommended) and run `scripts/sync-supabase-email-templates.mjs` when ready for production email testing. Not required for local development beyond Supabase's default email limits.

---

## Phase 3 — Integrations & Communication ✅ Complete

**Goal:** Calendar sync, email/SMS, automation, and developer platform.

| Deliverable | Status |
|-------------|--------|
| Google Calendar OAuth + two-way sync | ✅ |
| Outlook Calendar (Microsoft Graph) | ✅ |
| Apple Calendar (.ics subscriptions) | ✅ |
| Per-staff calendar connections | ✅ |
| External calendar conflict detection | ✅ |
| Email templates (confirm, reminder, cancel, reschedule) | ✅ |
| Resend email provider (console fallback) | ✅ |
| Twilio SMS provider (console fallback) | ✅ |
| Notification center (in-app) | ✅ |
| Background job queue + cron processor | ✅ |
| Recurring appointments | ✅ |
| Waitlist with auto-notify on cancellation | ✅ |
| REST API v1 with API keys | ✅ |
| Webhooks with HMAC signatures | ✅ |
| Zapier / Make.com discovery endpoint | ✅ |
| Developer dashboard UI | ✅ |
| Migration `004_phase3_integrations.sql` | ✅ |

**Prerequisite:** Run migration `004` and configure env vars (see `.env.example`).

---

## Phase 4 — Core Scheduling Engine ✅ Complete

**Goal:** Unified availability and booking validation so a real business can operate reliably.

| Deliverable | Status |
|-------------|--------|
| `get_available_slots` RPC (timezone, hours, staff schedules, holidays, buffers, limits) | ✅ |
| `validate_appointment_slot` RPC (shared by dashboard, public booking, API) | ✅ |
| DB exclusion constraint (prevent staff double-booking) | ✅ |
| Hardened `create_public_appointment` | ✅ |
| Availability block CRUD + settings UI | ✅ |
| Auto-seed staff working hours on create | ✅ |
| Shared `SlotPicker` UI (dashboard + public booking) | ✅ |
| Dashboard appointment dialog slot selection | ✅ |
| Drag-to-reschedule via available slots | ✅ |
| Verification script (`scripts/verify-phase4-scheduling.mjs`) | ✅ |
| Migration `005_phase4_scheduling_engine.sql` | ✅ |

**Prerequisite:** Run migrations `001`–`005` in Supabase (`npx supabase db push`).

**Verify:** `node scripts/verify-phase4-scheduling.mjs`

---

## Phase 5 — Multi-Location Foundation ✅ Shipped

**Goal:** Support multiple physical sites per business without breaking single-location tenants.

| Deliverable | Status |
|-------------|--------|
| `locations`, `location_settings`, `location_hours` tables | ✅ |
| `subscription_plans` + `can_add_location()` (config-driven limits) | ✅ |
| `location_id` on staff, services, appointments, availability | ✅ |
| Default location backfill for existing businesses | ✅ |
| Scheduling RPCs with `p_location_id` | ✅ |
| Dashboard location switcher + Add Location | ✅ |
| Location-scoped settings, calendar, staff, services, reports | ✅ |
| Shared customers across locations | ✅ |
| Public booking location picker + `?location=` slug | ✅ |
| Migrations `008`, `009` | ✅ |
| Verification script (`scripts/verify-phase5-multi-location.mjs`) | ✅ |

**Verify:** `node scripts/verify-phase5-multi-location.mjs`

---

## Phase 6 — Monetization & AI 🔜 Planned

**Goal:** Differentiate with intelligence and scale features.

| Deliverable | Notes |
|-------------|-------|
| Stripe billing (wire `subscription_plans` to payments) | Plan limits already in DB |
| AI scheduling assistant | Natural-language booking, smart slot suggestions |
| Multi-staff login & roles | Owner, admin, staff permissions |
| Team inbox & notifications | Real-time appointment alerts |
| Analytics dashboard | Conversion, no-show rates, revenue trends |
| Embeddable booking widget | `<script>` embed for external sites |
| Custom branding | Logo, colors, custom domain |
| Client self-service portal | Reschedule / cancel without login |
| Mobile app (React Native) | Staff-facing mobile calendar |

---

## Phase 5 (legacy roadmap — Monetization) — superseded

The product roadmap renumbered monetization to Phase 6 after multi-location was prioritized. See [`docs/product/03_PRODUCT_ROADMAP.md`](./product/03_PRODUCT_ROADMAP.md).

## Phase 4 (legacy roadmap items, deferred)

The items below were previously listed under Phase 4 and remain planned for later phases:

| Deliverable | Notes |
|-------------|-------|
| Waitlist & auto-fill | Partially shipped in Phase 3 |
| API for third-party integrations | REST API v1 shipped in Phase 3 |

---

## Technical Debt Backlog

| Item | Phase |
|------|-------|
| Rename `customers` → `clients` in database | 3+ |
| Migrate middleware → proxy (Next.js 16 deprecation) | 3 |
| Calendar tab ARIA roles | 3 |
| Skip-navigation link | 3 |
| Supabase Realtime for live calendar | 3 |
| E2E test suite (Playwright) | 3 |
| CI/CD pipeline (GitHub Actions) | 3 |

---

## Version Targets

| Version | Target | Scope |
|---------|--------|-------|
| `0.1.0` | Shipped | Phase 1 + 2 + architecture review |
| `0.2.0` | Current | Phase 3 integrations & communication |
| `0.3.0` | Q4 2026 | Stripe billing + calendar webhooks |
| `1.0.0` | Q1 2027 | GA with AI features |

---

## How to Contribute to the Roadmap

1. Open a GitHub issue with the `[roadmap]` label.
2. Reference the phase and deliverable.
3. Discuss scope before starting implementation.
4. Phase 3 work should not begin until migration `003` is applied in all environments.
