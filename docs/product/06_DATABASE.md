# Database (Product Lens)

How data is organized for businesses, clients, and appointments.

## Core entities

| Entity | Purpose | Owner-facing name |
|--------|---------|-------------------|
| `businesses` | Tenant root | Business / Settings |
| `locations` | Physical sites under a business | Location switcher |
| `location_settings` | Booking rules per location | Settings → Booking |
| `location_hours` | Open hours per location | Settings → Hours |
| `subscription_plans` | Plan-based location limits | Billing (future) |
| `services` | What you sell (per location) | Services |
| `staff` | Who delivers (per location) | Staff |
| `customers` | Who books (shared) | Clients |
| `appointments` | Scheduled visits (per location) | Calendar |
| `business_hours` | Legacy business-level hours | (mirrored to default location) |
| `holidays` | Closed dates (all or one location) | Settings → Holidays |
| `availability` | Blocked time (per location) | Settings → Blocked time |

## One business per owner

Migration `007_one_business_per_owner.sql` enforces **UNIQUE(owner_id)**. Each authenticated account has exactly one primary business.

Bootstrap: `ensure_business_for_owner()` RPC (idempotent under concurrent requests). Creates default location via `create_default_location()`.

## Multi-location (Phase 5)

- Every existing business received a **default location** on migration (`008`)
- `staff`, `services`, `appointments`, `availability` require `location_id`
- `customers` stay at `business_id` only — shared across locations
- Scheduling RPCs accept optional `p_location_id` (defaults to default location)

## Business profile (Sprint 2)

`businesses` includes production profile fields: `logo_url`, `phone`, `email`, `website`, address columns, `booking_policy`, `social_links` (jsonb). Services add `online_booking` and `preparation_instructions`. Staff add `biography` and `qualifications`. Migration: `011_sprint2_gvm_go_live.sql`.

## Appointment lifecycle

```
pending → confirmed → completed
                   ↘ cancelled
                   ↘ no_show
```

Cancelled appointments immediately free their slot in availability queries.

## Scheduling constraints (DB-enforced)

- Staff double-booking: GiST exclusion constraint on active appointments (per location scope in RPCs)
- Slot validation: `validate_appointment_slot` RPC (buffers, location hours, blocks, external calendar)
- Public booking: SECURITY DEFINER RPCs (no direct PII exposure)

## Integrations data

| Table | Purpose |
|-------|---------|
| `calendar_connections` | Google / Outlook OAuth per staff |
| `external_events` | Busy time from external calendars |
| `notifications` / `notification_logs` | Email/SMS audit trail |
| `api_keys` / `webhook_endpoints` | Developer platform |
| `waitlists` | Auto-notify on cancellation |
| `recurring_rules` | Repeating appointments |
| `background_jobs` | Async processing queue |

## Full reference

Table columns, indexes, RLS policies, and migration history: [`../DATABASE.md`](../DATABASE.md).

Migrations: `supabase/migrations/001`–`011`.
