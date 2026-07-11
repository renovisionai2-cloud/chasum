# Chasum Roadmap

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

---

## Phase 3 — Monetization & Integrations 🔜 Planned

**Goal:** Revenue, external calendars, and automated communications.

| Deliverable | Priority | Notes |
|-------------|----------|-------|
| Stripe subscriptions & billing | High | Free / Pro / Business tiers |
| Stripe Connect for per-appointment payments | Medium | Optional add-on |
| Google Calendar sync (two-way) | High | OAuth + webhook |
| Outlook / Microsoft 365 sync | Medium | Graph API |
| Email confirmations & reminders | High | Resend or SendGrid |
| SMS reminders | Medium | Twilio |
| `availability` table integration | Medium | Block/extra hours in slot engine |
| Public catalog RLS via single RPC | High | Close cross-tenant enumeration gap |
| Generated Supabase TypeScript types | Medium | Replace manual types |
| Zod validation on server actions | Medium | Replace FormData casts |

---

## Phase 4 — Growth & AI 🔮 Future

**Goal:** Differentiate with intelligence and scale features.

| Deliverable | Notes |
|-------------|-------|
| AI scheduling assistant | Natural-language booking, smart slot suggestions |
| Multi-staff login & roles | Owner, admin, staff permissions |
| Team inbox & notifications | Real-time appointment alerts |
| Analytics dashboard | Conversion, no-show rates, revenue trends |
| Embeddable booking widget | `<script>` embed for external sites |
| Custom branding | Logo, colors, custom domain |
| Waitlist & auto-fill | Fill cancelled slots automatically |
| Client self-service portal | Reschedule / cancel without login |
| API for third-party integrations | REST or GraphQL public API |
| Mobile app (React Native) | Staff-facing mobile calendar |

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
| `0.1.0` | Current | Phase 1 + 2 + architecture review |
| `0.2.0` | Q3 2026 | Phase 3 core (Stripe + email) |
| `0.3.0` | Q4 2026 | Calendar sync + SMS |
| `1.0.0` | Q1 2027 | GA with AI features |

---

## How to Contribute to the Roadmap

1. Open a GitHub issue with the `[roadmap]` label.
2. Reference the phase and deliverable.
3. Discuss scope before starting implementation.
4. Phase 3 work should not begin until migration `003` is applied in all environments.
