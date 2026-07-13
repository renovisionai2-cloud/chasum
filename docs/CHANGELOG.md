# Chasum Changelog

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added (Milestone 1.4 — Production Readiness)

- Calendar polish: overlap packing, half-hour drop ghosts, richer appointment cards, today/now highlights, smooth scroll to current time
- Customer profile + reception preview: preferred staff/service/location from history, visits/revenue snapshot, profile deep link
- Reception shortcuts (`/`, `N`, `B`, `W`, `T`, `I`) and calendar refresh indicator
- `docs/PRODUCTION_READINESS.md` go-live checklist for GVM Baby World

### Added (Milestone 1.3 — Workflow Optimization)

- Floating Quick Actions on Reception: New Customer, Book Appointment, Walk-In, Block Time, Add Internal Note
- Global command palette (⌘/Ctrl+K) searching customers, staff, services, appointments, and dashboard pages
- Customer search keyboard navigation (arrows, Enter selects first/highlighted, Escape clears)
- Booking preferences remembered locally (service, staff, location); autofocus on first fields
- Quick dialogs for new customer, block time, and internal notes without leaving the calendar

### Added (Milestone 1.1 — Reception Workspace)

- Reception workspace on Calendar: Business Brief KPIs from live data only
- Docked reception panel: customer search, profile preview, quick add, quick appointment, next available slot
- Preferred staff/location derived from appointment history (never invented)
- Today's notes (device-local), waitlist placeholder, AI Suggestions (empty: "No recommendations available.")
- Calendar polish: sticky time column & day headers, color legend, smoother DnD/resize, optimistic reschedule/resize
- `getReceptionBrief` + `getNextAvailableSlot` via existing scheduling engine

### Added (Sprint 8 — GVM Baby World Go-Live)

- Business profile: logo/cover file upload (Supabase Storage), public booking access modes
- Booking modes: Staff Only, Request Approval, Public, Invite Only — enforced on `/book/[slug]`
- Services: internal notes, per-service cancellation policy; server-side `online_booking` guard
- Customers: referral source, document uploads (`customer_documents` + storage)
- Dashboard: Today's revenue KPI, recent clients/bookings, business alerts from notifications
- Public booking: cover hero, business contact footer; request-approval creates pending appointments
- Migration `013_sprint8_gvm_go_live.sql`

### Added (Sprint 7 — Public Booking Experience)

- Premium multi-step public booking: service → optional staff (or any available) → date → time → customer info → review → confirmation
- Business description on booking page + Settings field; migration `012_sprint7_public_booking.sql`
- Returning-customer lookup by email (`lookup_booking_customer` RPC) with welcome-back prefill
- Confirmation screen: reference number, booking summary, cancellation policy, Download .ics, Google Calendar
- Confirmation / staff / business emails attach `appointment.ics` (Resend when configured)
- `getPublicSlotOptions` merges real `get_available_slots` across staff — never invents times
- Public book path revalidates dashboard calendar, overview, clients, appointments, and staff

### Changed (Sprint 7)

- `bookAppointment` returns structured summary + reference for the confirmation UI
- Email provider payload supports attachments

### Added (Sprint 6 — Booking Engine 2.0)

- Appointment modal: customer search/create, service, staff, location, date, SlotPicker, duration, notes, status
- Calendar: color by service or staff; week-view drag reschedule; resize handle to change duration (`resizeAppointment`)
- Customer profile metrics: total visits, lifetime revenue, no-shows, cancellations; upcoming vs history lists
- Alex AI Scheduler: `getAlexAvailabilityRecommendations` via real `get_available_slots` only (Command Center + Alex detail panel)
- Never invents appointment times — empty messaging when no slots exist

### Changed (Sprint 6)

- Create/update appointments accept location, duration override, and status
- Reschedule preserves existing duration; dashboard slot fetch accepts location scope
- Calendar page loads locations for the appointment dialog

### Added (Sprint 5 — Premium Dashboard Experience)

- Personalized Overview hero (greeting, date, today’s appointments/revenue/pending, AI summary from real metrics only)
- KPI cards with prior-period comparison when data exists, sparklines, hover motion
- Premium quick-action cards including AI Command Center
- “Today’s recommendations” panel driven by evidence-based rules (`lib/dashboard/insights.ts`) — empty state when none apply
- Richer empty states (primary + secondary CTAs, tips) and Overview skeleton via Suspense

### Changed (Sprint 5)

- Overview layout hierarchy, spacing, and micro-interactions aligned to Sprint 3 design system
- `getDashboardStats` extended with yesterday / prior-week / prior-month / pending / today revenue (read-only metrics; no booking logic changes)

### Added (Sprint 4 — AI Workforce)

- Dashboard section **AI Workforce** (`/dashboard/ai-workforce`) with employee grid, status, tasks, and quick actions
- Named AI employees (preview): Emma, Alex, Maya, Leo, Sophia, Noah
- Activity feed timeline with preview system events
- Employee detail pages with Overview, Metrics, Activity, Settings, and Future tabs
- AI Command Center conversational shell (`/dashboard/ai-workforce/command`) with placeholder intelligence
- Reusable components under `components/ai-workforce/` and roster types in `lib/ai-workforce/`

### Changed (Sprint 4)

- Sidebar includes AI Workforce (Sparkles) between Staff and Notifications

### Added (Sprint 3 — Premium Dashboard & Design System)

- Design tokens: spacing scale, `--radius-xl`, motion easing; `.ds-*` surface/nav utilities
- Shared primitives: `StatCard`, `Checkbox`, enhanced `EmptyState` (page/panel/inline), `WeekBars` chart
- Overview redesign: KPI cards with sparklines, weekly volume chart, quick actions, polished schedule/client panels
- Premium navigation: sidebar active states, client search shortcut, notifications bell, refined location switcher & account badge
- Empty states with primary CTAs across services, staff, clients, calendar setup, automation, developer, and client profile

### Changed (Sprint 3)

- Dashboard shell spacing and card surfaces unified; dual topbar page title removed in favor of content `PageHeader`
- Calendar views use design-system radius and shadow tokens

### Added (Sprint 2 — GVM Baby World Go-Live)

- Migration `011_sprint2_gvm_go_live.sql`: business logo/contact/address/policies/`social_links`; service `online_booking` + `preparation_instructions`; staff `biography` + `qualifications`
- Polished Settings profile: logo, phone, email, website, address, timezone, booking & cancellation policies, social links
- Services: online booking toggle, preparation instructions, buffer display; Ultrasound category
- Staff: photo URL, biography, qualifications, assigned location, working-hours summary
- Public booking shows business logo, prep instructions, staff photo/bio/quals, booking + cancellation policies
- Production setup: `scripts/setup-gvm-baby-world.mjs` (idempotent; no demo customers/appointments)
- Verification: `scripts/verify-sprint2-gvm-go-live.mjs` (25 checks, temporary book + cleanup)

### Changed (Sprint 2)

- First production tenant renamed to **GVM Baby World Ultrasound** (`/book/gvm-baby-world`)
- Default location labeled **Studio**; five elective ultrasound services configured with duration, price, color, buffers, prep
- Audit scripts prefer slug `gvm-baby-world`

### Added (Sprint 1 — Brand Integration)

- Official brand marks: Option 01 “The C” (`ChasumMark`) and Option 02 “The Spark” (`SparkMark`)
- Design tokens for spark accent, elevation shadows, and radius scale in `app/globals.css`
- Reusable UI primitives: `table`, `alert`, `chart`; expanded `button` / `badge` variants
- Brand applied across landing, auth, dashboard chrome, public booking, loaders, and empty states

### Changed (Sprint 1)

- Logo and product chrome use The C lettermark instead of the temporary grid icon
- Marketing copy positioned as AI Business Operating System
- Tag/status accent palette avoids purple bias; AI moments use teal Spark

### Added (Phase 5 — Multi-Location Foundation)

- Migration `008_phase5_multi_location.sql`: `locations`, `location_settings`, `location_hours`, `subscription_plans`; `location_id` on staff/services/appointments/availability; default location backfill for all businesses
- Migration `009_phase5_drop_old_rpc_overloads.sql`: remove pre-Phase-5 RPC signatures that conflicted with location-aware functions
- `lib/actions/location.ts`, `lib/location/constants.ts`: location CRUD, scope cookie, plan quota via `can_add_location`
- Dashboard location switcher (current location / all locations) and Add Location workflow
- Location-scoped settings (hours, booking policy), staff, services, calendar, and overview stats
- Public booking location picker and `?location=<slug>` deep link
- Shared customers with cross-location appointment history
- `scripts/verify-phase5-multi-location.mjs` (14 checks)

### Changed (Phase 5)

- Scheduling RPCs accept optional `p_location_id`; use `location_hours` and `location_settings` when present
- `ensure_business_for_owner` seeds default location for new businesses
- Phase 4 verification script updated for `location_id` on test fixtures

### Fixed

- Email confirmation now completes via `/auth/callback` using Supabase SSR token-hash flow (`verifyOtp`) instead of implicit `#access_token` redirects to the landing page
- Added `scripts/sync-supabase-email-templates.mjs` to configure Supabase confirmation and recovery email templates

### Production requirements (auth)

Authentication code is complete for development and staging. **Custom SMTP is the only remaining production requirement** before email confirmation and password reset can be verified end-to-end in production:

1. Configure custom SMTP in Supabase (recommended: [Resend](https://resend.com/docs/send-with-smtp)) — required on free-tier projects created after June 2026 to unlock auth email template editing
2. Run `node scripts/sync-supabase-email-templates.mjs` to apply token-hash callback templates
3. Verify signup, confirmation, login, and password reset against a real inbox

Resend is not configured yet; enable custom SMTP when ready for production testing.

### Added (Phase 4 — Core Scheduling Engine)

- Migration `005_phase4_scheduling_engine.sql`: unified `get_available_slots` and `validate_appointment_slot` RPCs, staff double-booking exclusion constraint, default staff hours seeding
- `lib/actions/scheduling.ts` and `lib/actions/availability.ts` for slot validation and time blocks
- Shared `components/scheduling/slot-picker.tsx` used by dashboard appointment dialog and public booking
- Public booking, dashboard appointments, calendar drag-reschedule, and API v1 POST all use the same scheduling RPCs
- Settings UI for blocked time (business-wide or per-staff)
- `scripts/verify-phase4-scheduling.mjs` end-to-end scheduling verification (19 checks)

### Changed (Phase 4)

- Dashboard appointment form replaces manual date/time inputs with available slot selection
- Fixed migration `002` enum update that blocked `supabase db push` on PostgreSQL

### Planned (Phase 5)

- Stripe subscriptions and billing
- AI scheduling assistant
- Generated Supabase TypeScript types
- Zod validation on server actions

---

## [0.2.0] — 2026-07-11

Phase 3: Integrations & Communication platform.

### Added

- **Calendar:** Google OAuth, Outlook OAuth, Apple .ics feeds, per-staff connections, two-way sync, external conflict detection
- **Email:** Resend provider with 6 reusable HTML templates; console fallback for dev
- **SMS:** Twilio provider with reminder/cancel/reschedule messages; console fallback
- **Notifications:** In-app notification center, delivery logs, orchestrator wired to all appointment lifecycle events
- **Automation:** Recurring appointment rules, waitlist with auto-notify on cancellation
- **Jobs:** `background_jobs` queue, cron processor (`/api/cron/process-jobs`), email/SMS/calendar/webhook queues
- **Developer platform:** REST API v1, API key auth, webhooks with HMAC, Zapier/Make discovery endpoint
- **Dashboard:** Integrations, Notifications, Automation, Developer pages
- Migration `004_phase3_integrations.sql` (9 new tables)
- `docs/REST_API.md` — complete API documentation

### Dependencies

- `resend`, `twilio`, `googleapis`, `ical-generator`, `zod`

---

## [0.1.0] — 2026-07-10

Architecture review release. Phase 1 + Phase 2 complete.

### Added — Architecture Review

- Toast notification system (`ToastProvider`)
- `useFormAction` and `useRefresh` hooks for form feedback
- Shared UI: `AlertMessage`, `FormFooter`, `IconButton`, `ColorPicker`, `WorkingHoursGrid`
- Loading skeletons: `DashboardSkeleton`, `PageLoader`, `Spinner`
- Dashboard `loading.tsx` and `error.tsx` boundaries
- Public booking `loading.tsx`
- Migration `003_rls_hardening.sql` with tenant indexes and SECURITY DEFINER RPCs
- `getAllStaffSchedules()` batch query for staff page
- Consolidated `StaffWithServices` and `StaffScheduleMap` types
- Dialog accessibility: focus trap, ARIA attributes, Escape to close
- Empty states on overview schedule and holidays settings

### Changed — Architecture Review

- Refactored staff, services, clients, and settings managers to shared patterns
- Replaced `window.location.reload()` with `router.refresh()` everywhere
- Public booking now uses RPCs (`upsert_booking_customer`, `create_public_appointment`)
- Public appointment reads via `get_public_appointments` RPC
- Settings hours form uses shared `WorkingHoursGrid`
- Calendar reschedule and delete actions show toasts instead of alerts
- Exported `ButtonProps` from button component

### Security

- Removed permissive anon SELECT/INSERT policies on `customers` and `appointments`
- Public PII access scoped through SECURITY DEFINER functions with business_id validation

---

## [0.1.0-beta.2] — 2026-07-10

Phase 2 completion: full booking engine.

### Added

- Calendar day, week, and month views with status colors
- Current-time indicator in day view
- Drag-to-reschedule in day view
- Appointment create, edit, cancel, and reschedule with conflict detection
- Client profile page with appointment history (`/dashboard/clients/[id]`)
- Customer tags and notes
- Staff working hours and vacation management
- Business holidays and booking policy settings
- Service categories, buffer times, and pricing
- Staff photo URL and title fields
- Dashboard overview: stats, revenue card, today's schedule, upcoming appointments
- Migration `002_booking_enhancements.sql`
- `pending` appointment status (replaces legacy `scheduled`)

---

## [0.1.0-beta.1] — 2026-07-10

Phase 2 core: booking engine foundation.

### Added

- Database schema: businesses, services, staff, customers, appointments, business_hours
- Row Level Security on all core tables
- `is_business_owner()` helper function
- Services CRUD (`/dashboard/services`)
- Staff CRUD with service assignments (`/dashboard/staff`)
- Clients CRUD with search (`/dashboard/clients`)
- Calendar page with week view (`/dashboard/calendar`)
- Public booking page multi-step flow (`/book/[slug]`)
- Server actions for all booking entities
- Migration `001_booking_engine.sql`
- Slot generation utility with business hours and conflict awareness

---

## [0.1.0-alpha.2] — 2026-07-10

Phase 1 completion: auth and dashboard shell.

### Added

- Reset password flow (`/reset-password`)
- Supabase auth callbacks (`/auth/callback`, `/auth/confirm`)
- Dashboard top navigation bar
- User email display in sidebar and top nav
- Sign out action

### Fixed

- ThemeProvider SSR crash (switched to `useSyncExternalStore`)
- Graceful Supabase env var handling via `getSupabaseEnv()`

---

## [0.1.0-alpha.1] — 2026-07-10

Phase 1 foundation.

### Added

- Landing page with hero, features, and pricing sections
- Supabase authentication: signup, login, forgot password
- Dashboard layout with responsive sidebar navigation
- Mobile sidebar drawer
- Route protection middleware
- Dark / light theme with system preference detection
- Design system: Button, Input, Label, Card, Dialog, Badge, Tabs, Select, Textarea
- Logo component
- Geist font integration
- Tailwind CSS v4 with CSS custom properties
- `.env.example` with Supabase and app URL variables

---

## [0.0.1] — 2026-07-10

### Added

- Initial Next.js 16 project scaffold (Create Next App)
- TypeScript strict mode
- ESLint with `eslint-config-next`

---

## Migration Guide

### Upgrading to 0.1.0

1. Pull latest `main`
2. Run `npm install`
3. Apply Supabase migrations in order:
   - `001_booking_engine.sql`
   - `002_booking_enhancements.sql`
   - `003_rls_hardening.sql`
4. Set environment variables per `.env.example`
5. Run `npm run build` to verify

### Breaking Changes

None for application code. Database migration `003` removes direct anon access to `customers` and `appointments` — public booking requires RPCs (already integrated in app code as of `f0ffaf7`).

---

## Commit Reference

| Version | Commit | Description |
|---------|--------|-------------|
| 0.1.0 | `f0ffaf7` | Architecture review |
| 0.1.0-beta.2 | `3418413` | Phase 2 complete |
| 0.1.0-beta.1 | `7065f37` | Phase 2 core |
| 0.1.0-alpha.2 | `7785a1c` | Phase 1 complete |
| 0.1.0-alpha.1 | `68f0a00`–`2e70c11` | Phase 1 foundation |
| 0.0.1 | `fb3af81` | Initial scaffold |

[Unreleased]: https://github.com/renovisionai2-cloud/chasum/compare/f0ffaf7...HEAD
[0.1.0]: https://github.com/renovisionai2-cloud/chasum/compare/3418413...f0ffaf7
[0.1.0-beta.2]: https://github.com/renovisionai2-cloud/chasum/compare/7065f37...3418413
[0.1.0-beta.1]: https://github.com/renovisionai2-cloud/chasum/compare/7785a1c...7065f37
[0.1.0-alpha.2]: https://github.com/renovisionai2-cloud/chasum/compare/68f0a00...7785a1c
[0.1.0-alpha.1]: https://github.com/renovisionai2-cloud/chasum/compare/fb3af81...68f0a00
[0.0.1]: https://github.com/renovisionai2-cloud/chasum/commit/fb3af81
