# Chasum Changelog

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
