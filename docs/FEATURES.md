# Chasum Features

Current feature inventory as of **v0.1.0** (Phase 2 + architecture review complete).

---

## Marketing & Auth

### Landing Page (`/`)

- Hero section with CTA
- Feature highlights
- Pricing tiers (UI only — billing not yet integrated)
- Dark / light mode support

### Authentication

| Feature | Route |
|---------|-------|
| Sign up | `/signup` |
| Log in | `/login` |
| Forgot password | `/forgot-password` |
| Reset password | `/reset-password` |
| OAuth callback | `/auth/callback` |
| Email confirmation | `/auth/callback` (token_hash + verifyOtp) |

- Session managed via Supabase Auth + `@supabase/ssr`
- Email confirmation uses SSR token-hash links to `/auth/callback` (not implicit `#access_token` redirects)
- OAuth and other code-based flows still use `exchangeCodeForSession()` on `/auth/callback`
- Protected routes redirect unauthenticated users to `/login`
- Graceful handling when Supabase env vars are missing

---

## Dashboard

### Overview (`/dashboard`)

- Today's appointment count
- This week's appointment count
- Monthly revenue (from completed appointments)
- Total clients + new clients this month
- Today's schedule list with status badges
- Upcoming appointments (next 5)
- Quick actions: new appointment, add client, open calendar

### Calendar (`/dashboard/calendar`)

| View | Capabilities |
|------|-------------|
| Day | Hourly grid, current-time indicator, drag reschedule |
| Week | Multi-day overview, click slot to create |
| Month | Month grid, click day to drill into day view |

- Appointment blocks colored by service
- Status colors: pending, confirmed, cancelled, completed, no-show
- Create / edit / cancel appointments via dialog
- Conflict detection on create, update, and reschedule
- Empty state when no services or staff configured

### Services (`/dashboard/services`)

- Create, edit, delete services
- Fields: name, description, category, duration, price, buffers, color, active flag
- Categories: General, Consultation, Treatment, Follow-up, Package, Other
- Card grid layout with inline actions

### Staff (`/dashboard/staff`)

- Create, edit, delete staff members
- Assign services per staff member
- Photo URL, title, email, color
- Per-staff working hours (7-day grid)
- Vacation / time-off management
- Active / inactive toggle

### Clients (`/dashboard/clients`)

- Create, edit, delete clients
- Search by name or email
- Tags (comma-separated)
- Notes field
- Client profile page (`/dashboard/clients/[id]`) with appointment history

> **Note:** UI label is "Clients"; database table is `customers`.

### Settings (`/dashboard/settings`)

| Section | Fields |
|---------|--------|
| Business profile | Name, booking URL slug, timezone, public link preview |
| Business hours | 7-day open/close grid |
| Booking settings | Interval, booking limit days, max daily bookings, cancellation policy |
| Holidays | Named dates, recurring annually option |

---

## Public Booking

### Booking Page (`/book/[slug]`)

Multi-step flow:

1. **Choose service** — active services with duration and price
2. **Choose provider** — staff filtered by service assignment
3. **Pick date & time** — available slots based on business hours and existing appointments
4. **Enter details** — name, email, phone (optional), notes (optional)
5. **Confirmation** — success screen with appointment summary

- Slots generated server-side with conflict checking
- Customer upserted by email per business
- Appointments created as `confirmed` via SECURITY DEFINER RPC
- Unavailable state when business has no services or staff

---

## Cross-Cutting Features

### Theme

- Light and dark mode
- System preference detection
- SSR-safe via `useSyncExternalStore`
- Persisted in `localStorage`

### Notifications

- Toast system (success, error, info)
- Auto-dismiss after 4 seconds
- Used on all CRUD operations and calendar actions

### Loading States

- Dashboard skeleton loader
- Public booking page loader
- Inline pending states on form submissions
- Slot loading indicator during availability fetch

### Error Handling

- Dashboard error boundary with retry
- Form-level error messages (`AlertMessage`)
- Server action `{ error, success }` pattern throughout

### Accessibility

- Dialog focus trap and Escape to close
- `aria-label` on icon buttons
- `role="alert"` / `role="status"` on feedback messages
- Color picker radiogroup semantics

### Mobile

- Responsive dashboard with mobile sidebar drawer
- Bottom-sheet dialogs on small screens
- Stacked card layouts on narrow viewports

---

## Not Yet Implemented

| Feature | Planned Phase |
|---------|---------------|
| Stripe payments & subscriptions | Phase 3 |
| Google / Outlook calendar sync | Phase 3 |
| Email & SMS reminders | Phase 3 |
| AI scheduling assistant | Phase 4 |
| Multi-user staff login | Phase 4 |
| Embeddable booking widget | Phase 4 |
| Custom domain / white-label | Phase 4 |
| Client self-service portal | Phase 4 |
| Availability overrides in slot engine | Phase 3 |
| Real-time calendar updates | Phase 3 |
