# Architecture (Product View)

How Chasum is structured for reliability, multi-tenancy, and future AI.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React, Tailwind v4 |
| Backend | Next.js Server Actions + Route Handlers |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (SSR cookies) |
| Email | Resend (console fallback in dev) |
| SMS | Twilio (console fallback in dev) |
| Jobs | `background_jobs` table + cron route |

## Multi-tenancy model

```
auth.users
  └── businesses (1 per owner, UNIQUE owner_id)
        ├── subscription_plan_key → subscription_plans
        ├── locations[] (default location auto-created)
        │     ├── location_settings, location_hours
        │     ├── staff, services, appointments, availability
        ├── customers (business-scoped, shared across locations)
        ├── business_hours (legacy; mirrored to default location on migrate)
        ├── holidays (business-wide or location-specific)
        └── integrations (calendar, API keys, webhooks)
```

Every authenticated action scopes via `getOrCreateBusiness()` → `business.id`.

Active dashboard scope: cookie `chasum_location_scope` (location UUID or `ALL`).

Public routes scope by slug → `business.id` → optional `location_id` in RPCs.

## Scheduling engine (core differentiator)

All slot queries and validation go through PostgreSQL RPCs:

| RPC | Used by |
|-----|---------|
| `get_available_slots` | Dashboard SlotPicker, public booking (optional `p_location_id`) |
| `validate_appointment_slot` | Create, update, reschedule, API |
| `create_public_appointment` | Public booking |
| `can_add_location` | Add location workflow (plan limits) |
| `create_default_location` | Migration + `ensure_business_for_owner` |
| `ensure_business_for_owner` | Atomic business bootstrap |

**Rule:** No duplicated client-side slot generation for booking.

## Integration boundaries

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Dashboard  │────▶│ Server layer │────▶│  Supabase   │
│ Public book │     │ + RPCs       │     │  PostgreSQL │
│  REST API   │     └──────────────┘     └─────────────┘
└─────────────┘              │
                             ▼
                    ┌──────────────────┐
                    │ Google / Outlook │
                    │ Resend / Twilio  │
                    │ Webhooks / Zapier│
                    └──────────────────┘
```

## Verification scripts

| Script | Purpose |
|--------|---------|
| `verify-phase4-scheduling.mjs` | Scheduling engine E2E |
| `verify-phase5-multi-location.mjs` | Multi-location schema + migration |
| `verify-business-concurrency.mjs` | No duplicate businesses under race |
| `audit-business-readiness.mjs` | DB integrity before production data |
| `cleanup-duplicate-businesses.mjs` | One-time duplicate removal |

## Engineering detail

Full schema and RPC docs: [`../DATABASE.md`](../DATABASE.md), [`../API.md`](../API.md).

OS kernel (money recognition, domain events, business memory, locale): [`22_OS_KERNEL.md`](./22_OS_KERNEL.md). Founder memory: [`../../COMPANY_MEMORY.md`](../../COMPANY_MEMORY.md).
