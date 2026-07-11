# Chasum API

Chasum uses **Next.js Server Actions** (`"use server"`) instead of REST endpoints for all data mutations and most reads. Auth routes use Next.js Route Handlers.

---

## Architecture

```
Browser (Client Components)
    │
    ├── useActionState → Server Actions (lib/actions/*)
    │                       │
    │                       ├── Supabase Client (server)
    │                       └── revalidatePath()
    │
    └── Server Components → Server Actions / Supabase (direct)
```

All authenticated actions call `getOrCreateBusiness()` to scope queries to the current tenant.

### Response Shape

Every mutation returns:

```typescript
type ActionState = {
  error?: string;
  success?: string;
};
```

Read functions return typed data or throw on Supabase errors.

---

## Auth Actions

**File:** `lib/actions/auth.ts`

| Function | Input | Description |
|----------|-------|-------------|
| `signUp(prev, formData)` | `email`, `password`, `full_name` | Create account, redirect to dashboard |
| `signIn(prev, formData)` | `email`, `password` | Sign in, redirect to dashboard |
| `resetPassword(prev, formData)` | `email` | Send password reset email |
| `updatePassword(prev, formData)` | `password`, `confirm_password` | Set new password after reset link |
| `signOut()` | — | Clear session, redirect to `/login` |

### Route Handlers

| Route | Method | Description |
|-------|--------|-------------|
| `/auth/callback` | GET | OAuth / magic link callback |
| `/auth/confirm` | GET | Email confirmation handler |

---

## Business Actions

**File:** `lib/actions/business.ts`

| Function | Auth | Returns | Description |
|----------|------|---------|-------------|
| `requireUser()` | Required | `User` | Redirects to `/login` if unauthenticated |
| `getBusiness()` | Required | `Business \| null` | Current user's business |
| `getOrCreateBusiness()` | Required | `Business` | Get or auto-create with default hours |
| `getBusinessBySlug(slug)` | Public | `Business \| null` | Lookup for public booking page |

---

## Business Hours & Profile

**File:** `lib/actions/business-hours.ts`

| Function | Input | Description |
|----------|-------|-------------|
| `getBusinessHours()` | — | All 7 days for current business |
| `updateBusinessHours(prev, formData)` | `day_{n}_open`, `day_{n}_open_time`, `day_{n}_close_time` | Update weekly hours |
| `updateBusinessProfile(prev, formData)` | `name`, `slug`, `timezone` | Update business profile |
| `getPublicBusinessHours(businessId)` | UUID | Public read for booking |

---

## Services

**File:** `lib/actions/services.ts`

| Function | Input | Description |
|----------|-------|-------------|
| `getServices()` | — | All services for current business |
| `createService(prev, formData)` | `name`, `description`, `category`, `duration_minutes`, `price`, `buffer_before_minutes`, `buffer_after_minutes`, `color` | Create service |
| `updateService(prev, formData)` | Above + `id`, `is_active` | Update service |
| `deleteService(id)` | UUID | Delete service |
| `getPublicServices(businessId)` | UUID | Active services for public booking |

**Revalidates:** `/dashboard/services`, `/dashboard/calendar`

---

## Staff

**File:** `lib/actions/staff.ts`

| Function | Input | Description |
|----------|-------|-------------|
| `getStaff()` | — | Staff with `staff_services` join |
| `createStaff(prev, formData)` | `name`, `email`, `title`, `photo_url`, `color`, `service_ids[]` | Create staff + assignments |
| `updateStaff(prev, formData)` | Above + `id`, `is_active` | Update staff + reassign services |
| `deleteStaff(id)` | UUID | Delete staff |
| `getPublicStaff(businessId, serviceId?)` | UUID, optional UUID | Active staff, optionally filtered by service |

**Revalidates:** `/dashboard/staff`, `/dashboard/calendar`

---

## Staff Schedule

**File:** `lib/actions/staff-schedule.ts`

| Function | Input | Description |
|----------|-------|-------------|
| `getStaffWorkingHours(staffId)` | UUID | 7-day schedule for one staff member |
| `getStaffVacations(staffId)` | UUID | Vacation list for one staff member |
| `getAllStaffSchedules(staffIds[])` | UUID[] | Batch fetch hours + vacations (optimized) |
| `updateStaffWorkingHours(prev, formData)` | `staff_id`, `day_{n}_working`, `day_{n}_start`, `day_{n}_end` | Update working hours |
| `addStaffVacation(prev, formData)` | `staff_id`, `start_date`, `end_date`, `reason` | Add vacation |
| `deleteStaffVacation(id)` | UUID | Remove vacation |
| `getPublicStaffWorkingHours(staffId)` | UUID | Public read |
| `getPublicStaffVacations(staffId)` | UUID | Public read |

**Revalidates:** `/dashboard/staff`

---

## Customers (Clients)

**File:** `lib/actions/customers.ts`

| Function | Input | Description |
|----------|-------|-------------|
| `getCustomers(search?)` | Optional string | List clients, optional search |
| `createCustomer(prev, formData)` | `name`, `email`, `phone`, `tags`, `notes` | Create client |
| `updateCustomer(prev, formData)` | Above + `id` | Update client |
| `deleteCustomer(id)` | UUID | Delete client |
| `getCustomerProfile(id)` | UUID | Client + appointment history |

**Revalidates:** `/dashboard/clients`

---

## Appointments

**File:** `lib/actions/appointments.ts`

| Function | Input | Description |
|----------|-------|-------------|
| `getAppointments(start, end)` | ISO timestamps | Appointments in range with relations |
| `getDashboardStats()` | — | Today/week counts, revenue, upcoming, new clients |
| `createAppointment(prev, formData)` | `customer_id`, `service_id`, `staff_id`, `date`, `time`, `notes` | Create with conflict check |
| `updateAppointment(prev, formData)` | Above + `id`, `status` | Update with conflict check |
| `cancelAppointment(id)` | UUID | Set status to `cancelled` |
| `rescheduleAppointment(id, newStartTime)` | UUID, ISO timestamp | Move appointment with conflict check |
| `getPublicAppointments(businessId, start, end)` | UUID, ISO timestamps | Via RPC `get_public_appointments` |

**Revalidates:** `/dashboard/calendar`, `/dashboard`

### Conflict Detection

Checks overlapping non-cancelled appointments for the same staff, including service buffer times on create/update.

---

## Holidays & Booking Settings

**File:** `lib/actions/holidays.ts`

| Function | Input | Description |
|----------|-------|-------------|
| `getHolidays()` | — | All holidays for current business |
| `createHoliday(prev, formData)` | `name`, `date`, `is_recurring` | Add holiday |
| `deleteHoliday(id)` | UUID | Remove holiday |
| `getPublicHolidays(businessId)` | UUID | Public read |
| `updateBusinessSettings(prev, formData)` | `appointment_interval_minutes`, `booking_limit_days`, `max_daily_bookings`, `cancellation_policy` | Booking policy |

**Revalidates:** `/dashboard/settings`

---

## Public Booking

**File:** `lib/actions/public-booking.ts`

| Function | Input | Description |
|----------|-------|-------------|
| `getAvailableSlots(slug, serviceId, staffId, date)` | Slug, UUIDs, `YYYY-MM-DD` | Returns ISO timestamp array of open slots |
| `bookAppointment(prev, formData)` | `slug`, `service_id`, `staff_id`, `start_time`, `customer_name`, `customer_email`, `customer_phone`, `notes` | Full booking flow via RPCs |

### Booking Flow (Internal)

1. Resolve business by slug
2. Validate service is active
3. `upsert_booking_customer` RPC → customer UUID
4. `create_public_appointment` RPC → appointment UUID (with conflict check)

---

## Supabase RPCs

Called from server actions; not directly from the browser.

| RPC | Parameters | Returns |
|-----|------------|---------|
| `get_public_appointments` | `p_business_id`, `p_start`, `p_end` | `{ start_time, end_time, staff_id, status }[]` |
| `upsert_booking_customer` | `p_business_id`, `p_name`, `p_email`, `p_phone` | `uuid` |
| `create_public_appointment` | `p_business_id`, `p_service_id`, `p_staff_id`, `p_customer_id`, `p_start_time`, `p_end_time`, `p_notes` | `uuid` |

See [DATABASE.md](./DATABASE.md) for RPC implementation details.

---

## Client Hooks

**File:** `hooks/use-form-action.ts`

| Hook / Function | Description |
|-----------------|-------------|
| `useRefresh()` | Returns `router.refresh()` callback |
| `useFormAction(state, onSuccess?, onClose?)` | Toast + refresh on form success/error |
| `confirmDelete(message)` | Browser confirm dialog wrapper |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL (for auth redirects, booking links) |

---

## Error Handling Conventions

1. **Validation errors** — returned as `{ error: "message" }`, never thrown
2. **Database errors** — Supabase error message passed to client
3. **Read failures** — thrown as `new Error(error.message)` (caught by error boundary)
4. **Auth failures** — redirect to `/login` or return form error
5. **Not found** — `notFound()` in page components

---

## Future API (Phase 3+)

Planned additions not yet implemented:

- REST API with API keys for third-party integrations
- Stripe webhook route handlers
- Google Calendar OAuth callback routes
- Email/SMS webhook handlers (delivery status)
