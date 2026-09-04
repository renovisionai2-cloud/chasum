# Chasum Database

PostgreSQL via **Supabase** with Row Level Security (RLS) on every table. All tenant data is scoped by `business_id`.

---

## Migrations

Run in order in the Supabase SQL Editor or via `supabase db push`:

| File | Description |
|------|-------------|
| `001_booking_engine.sql` | Core tables, RLS policies, `is_business_owner()` helper |
| `002_booking_enhancements.sql` | Categories, buffers, staff schedules, holidays, `pending` status |
| `003_rls_hardening.sql` | Tenant indexes, PII policy removal, public booking RPCs |
| `004`–`011` | Integrations, scheduling engine, one-business-per-owner, multi-location, GVM profile |
| `012`–`013` | Public booking + storage / go-live |
| `014_owner_platform.sql` | Platform admins / owner console |
| `015_billing_phase1.sql` | Subscription events + invoices |
| `016_communication_center_phase1.sql` | Communication history + follow-ups |
| `017_employee_management.sql` | Departments, staff HR columns, documents, activity |
| `018_crm_department.sql` | Customer notes, payment events, CRM columns |
| `019_booking_engine_2.sql` | Booking resources, portal tokens, appointment commercial columns |
| `020_business_management.sql` | Categories, memberships, packages, gift cards, taxes, discounts |
| `021_reports_analytics.sql` | Report schedules + exports |
| `023_business_management_settings.sql` | Legal name, branding, booking policies, AI config, closures, documents |
| `024_services_module.sql` | Service catalog extensions, multi-location, staff price overrides, blackouts |
| `025_employees_module.sql` | Name parts, booking rules, custom roles, hour segments, closures, document licenses |
| `026_availability_engine.sql` | Enriched `get_available_slots` / `validate_appointment_slot` — lunch, split shifts, closures, blackouts, cleanup, notice, caps |
| `027_crm_phase_5_4.sql` | Marketing consent, membership link, note types |
| `028_commerce_platform.sql` | Client commerce: invoices, ledger, receipts, refunds, audit, appointment payment status |
| `029_communications_platform.sql` | Quiet hours, marketing prefs, notification priority/archive, job retry backoff, communications audit |
| `039_business_slug_aliases.sql` | Canonical slug + historical alias registry for public booking URLs |
| `040_book_public_appointment.sql` | Additive `book_public_appointment` SECURITY DEFINER RPC for public named-staff persistence. **Repo: present. Staging: APPLIED. Production: NOT APPLIED / not approved as part of this Phase 5 release state.** |
| `041_book_public_appointment_server_financials.sql` | Server-authoritative public booking financials (`CREATE OR REPLACE` of the 040 signature). Caller `p_price_cents` / `p_tax_cents` / `p_deposit_cents` are non-authoritative; persisted price/tax/deposit come from `services` + `tax_rates`. **Repo: present. Staging: APPLIED. Runtime verification: PASSED. Production: NOT APPLIED.** |

**Current requirement:** every environment must be at migration **026** before relying on the Availability Engine (lunch/closures/blackouts/cleanup enforced in SQL).

Migrations **034–036 remain UNAPPLIED** on Staging and Production.

- **034** — optional/unassigned staff. **Not required** for named-staff Phase 5. Any-staff / null `p_staff_id` remains **intentionally gated**.
- **035** — booking interval allowed values. Unapplied. Outside this Phase 5 release.
- **036** — booking resources. Unapplied; feature flag off. Outside this Phase 5 release.

`040` / `041` are additive and remain safe while 034–036 stay unapplied (`p_staff_id` is required). Do **not** apply 034–036 to “simplify” Phase 5. Do **not** apply 040/041 to Production from this documentation stamp.

---

## Entity Relationship

```
auth.users
    └── businesses (owner_id)
            ├── services
            ├── staff
            │       ├── staff_services (M:N with services)
            │       ├── staff_working_hours
            │       └── staff_vacations
            ├── business_hours
            ├── holidays
            ├── availability
            ├── customers
            └── appointments
                    ├── → service_id
                    ├── → staff_id
                    └── → customer_id
```

---

## Tables

### `businesses`

Tenant root. One business per owner (current model).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `owner_id` | uuid FK → auth.users | CASCADE delete |
| `name` | text | |
| `slug` | text UNIQUE | Public booking URL: `/book/{slug}` |
| `timezone` | text | Default `America/New_York` |
| `appointment_interval_minutes` | integer | Default 30 (migration 002) |
| `booking_limit_days` | integer | Default 60 |
| `cancellation_policy` | text | Nullable |
| `max_daily_bookings` | integer | Nullable |
| `logo_url` | text | Nullable (011) |
| `phone` / `email` / `website` | text | Nullable (011) |
| `address_line1` … `country` | text | Nullable (011) |
| `booking_policy` | text | Nullable (011) |
| `social_links` | jsonb | Default `{}` (011) |
| `created_at` / `updated_at` | timestamptz | Auto-updated via trigger |

### `services`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid FK | CASCADE |
| `name` | text | |
| `description` | text | Nullable |
| `category` | text | Nullable |
| `duration_minutes` | integer | CHECK > 0 |
| `price` | numeric(10,2) | Default 0 |
| `color` | text | Hex, default `#2563eb` |
| `buffer_before_minutes` | integer | Default 0 |
| `buffer_after_minutes` | integer | Default 0 |
| `is_active` | boolean | Default true |
| `online_booking` | boolean | Default true (011) |
| `preparation_instructions` | text | Nullable (011) |

### `staff`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid FK | CASCADE |
| `name` | text | |
| `email` | text | Nullable |
| `title` | text | Nullable |
| `photo_url` | text | Nullable |
| `biography` | text | Nullable (011) |
| `qualifications` | text | Nullable (011) |
| `color` | text | Hex |
| `is_active` | boolean | Default true |

### `staff_services`

Many-to-many join between staff and services.

| Column | Type |
|--------|------|
| `staff_id` | uuid FK → staff |
| `service_id` | uuid FK → services |
| PK | (`staff_id`, `service_id`) |

### `business_hours`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `day_of_week` | integer | 0=Sun … 6=Sat |
| `is_open` | boolean | |
| `open_time` / `close_time` | time | |
| UNIQUE | | (`business_id`, `day_of_week`) |

### `customers`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `name` | text | |
| `email` | text | |
| `phone` | text | Nullable |
| `notes` | text | Nullable |
| `tags` | text[] | Default `{}` |
| UNIQUE | | (`business_id`, `email`) |

### `appointments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `service_id` | uuid FK | RESTRICT |
| `staff_id` | uuid FK | RESTRICT |
| `customer_id` | uuid FK | RESTRICT |
| `start_time` / `end_time` | timestamptz | |
| `status` | appointment_status | See enum below |
| `notes` | text | Nullable |

**Indexes:**

- `(business_id, start_time)`
- `(staff_id, start_time)`

### `staff_working_hours`

| Column | Type | Notes |
|--------|------|-------|
| `staff_id` | uuid FK | CASCADE |
| `day_of_week` | integer | 0–6 |
| `is_working` | boolean | |
| `start_time` / `end_time` | time | |
| UNIQUE | | (`staff_id`, `day_of_week`) |

### `staff_vacations`

| Column | Type | Notes |
|--------|------|-------|
| `staff_id` | uuid FK | CASCADE |
| `start_date` / `end_date` | date | CHECK end ≥ start |
| `reason` | text | Nullable |

### `holidays`

| Column | Type | Notes |
|--------|------|-------|
| `business_id` | uuid FK | CASCADE |
| `name` | text | |
| `date` | date | |
| `is_recurring` | boolean | Default false |
| UNIQUE | | (`business_id`, `date`) |

### `availability`

Override blocks for staff or business-wide. **Not yet used in application code.**

| Column | Type | Notes |
|--------|------|-------|
| `business_id` | uuid FK | |
| `staff_id` | uuid FK | Nullable (business-wide if null) |
| `start_time` / `end_time` | timestamptz | |
| `is_available` | boolean | Default false (block) |
| `notes` | text | Nullable |

---

## Enums

### `appointment_status`

```
pending | confirmed | cancelled | completed | no_show
```

Legacy `scheduled` values were migrated to `pending` in migration 002.

---

## Helper Functions

### `is_business_owner(bid uuid) → boolean`

SECURITY DEFINER. Returns true if `auth.uid()` owns the business. Used in all owner RLS policies.

### `set_updated_at()`

Trigger function. Sets `updated_at = now()` on UPDATE for businesses, services, staff, customers, appointments.

---

## Public Booking RPCs (Migration 003)

These SECURITY DEFINER functions replace direct anon access to PII tables.

### `get_public_appointments(p_business_id, p_start, p_end)`

Returns `{ start_time, end_time, staff_id, status }` for non-cancelled appointments in range. Used for slot availability.

### `upsert_booking_customer(p_business_id, p_name, p_email, p_phone)`

Finds customer by `(business_id, email)` case-insensitive. Updates name/phone if exists; inserts otherwise. Returns customer UUID.

### `create_public_appointment(...)`

Validates business, service, staff, and customer belong to the same tenant. Checks for time conflicts. Inserts appointment with status `confirmed`. Returns appointment UUID.

**Legacy.** Retained in the database for rollback only. Public booking no longer calls this RPC.

All three are granted to `anon` and `authenticated`.

### `book_public_appointment(...)` (Migrations 040 + 041)

Narrow SECURITY DEFINER writer for unauthenticated public named-staff booking.

**Apply state:** **Staging APPLIED** (`wnfahklzaxirftyskctd`) — 040 then 041. **041 runtime-verified on Staging (P2-1 CLOSED ON STAGING).** **Production NOT APPLIED** (`kxcydvhswkuzepwzzinq`). Not Production-approved as part of this Phase 5 release state.

- Revalidates business, location, service, staff (active, accepts online booking, offers the service), and customer tenant membership in the database
- Upserts the customer via `upsert_booking_customer` then inserts the appointment in the same transaction
- Reuses `validate_appointment_slot(...)` and maps `exclusion_violation` to a friendly slot error
- Accepts only `pending` or `confirmed` into an `appointment_status` typed variable (does not reproduce the legacy `v_status text` enum defect)
- Requires `p_staff_id` (any-staff / optional staff remains gated while 034 is unapplied)
- `REVOKE ALL ... FROM PUBLIC`; `GRANT EXECUTE` to `anon` and `authenticated` only
- Does **not** grant table privileges, alter appointments RLS, FORCE RLS, or default privileges
- **041:** same PostgREST signature as 040. Caller `p_price_cents` / `p_tax_cents` / `p_deposit_cents` are accepted and **ignored**. Persisted commercial truth is derived from trusted `services` (price, deposit, tax_rate_bps) and `tax_rates`

Public browser clients must not supply `business_id`. The public server action resolves the tenant from the booking slug (`getPublicBusinessBySlug`) and passes `business.id`.

**API / future unauthenticated Summer / SMS / voice must not use this RPC** without a separate Level 3 review. The v1 API keeps its own privilege boundary. Authenticated dashboard, duplicate-appointment, and authenticated Summer flows continue to use session/RLS `createBooking` inserts.

---

## Row Level Security

RLS is enabled on all 11 tables.

### Owner Policies

Authenticated business owners have full CRUD on their tenant data via `is_business_owner(business_id)` or staff-ownership subqueries.

### Public Policies

| Table | Anon Access |
|-------|-------------|
| `businesses` | SELECT (all) |
| `services` | SELECT (active only) |
| `staff` | SELECT (active only) |
| `staff_services` | SELECT (all) |
| `business_hours` | SELECT (all) |
| `staff_working_hours` | SELECT (all) |
| `staff_vacations` | SELECT (all) |
| `holidays` | SELECT (all) |
| `availability` | SELECT (all) |
| `customers` | **RPC only** (migration 003) |
| `appointments` | **Direct writes remain RLS denied.** Public booking persists through the narrow SECURITY DEFINER RPC `book_public_appointment` (**040+041 APPLIED Staging; not Production**). Legacy `create_public_appointment` remains for rollback only. Owner dashboard writes continue through `is_business_owner(business_id)`. |

### Appointments RLS is Level 3

Changes to `appointments` RLS, policies, FORCE RLS, or table-level GRANT/REVOKE are **Level 3**. Do not add an anon INSERT policy, disable RLS, or FORCE RLS without a compatible SECURITY DEFINER / BYPASSRLS path and an explicit PO + Claude review.

CI asserts this posture from migration SQL (`tests/unit/booking/appointments-rls-posture.test.ts`). That check does not query a live database. Staging runtime verification of 040/041 RLS posture is **PASSED**. Production apply remains a future governed cutover.

### Known Gap

Public SELECT on catalog tables (services, staff, hours) allows cross-tenant enumeration. Phase 3 will consolidate into a single `get_public_booking_context(slug)` RPC.

---

## Multi-Tenant Isolation Model

```
┌─────────────────────────────────────────┐
│  auth.users                              │
│    └── businesses (1:1 owner today)     │
│          └── all child rows via         │
│              business_id FK + RLS       │
└─────────────────────────────────────────┘
```

Every query from server actions scopes by `getOrCreateBusiness()` → `business.id`. Public routes scope by slug lookup → `business.id` → RPC parameters.

---

## TypeScript Types

Manual types live in `lib/types/booking.ts`. Key exports:

- `Business`, `Service`, `Staff`, `StaffWithServices`
- `Customer`, `Appointment`, `AppointmentWithRelations`
- `BusinessHours`, `Holiday`, `StaffWorkingHours`, `StaffVacation`
- `AppointmentStatus`, `ActionState`, `CalendarView`
- Constants: `DAY_NAMES`, `SERVICE_COLORS`, `STAFF_COLORS`, etc.

**Recommended:** Generate types with `supabase gen types typescript` in Phase 3.
