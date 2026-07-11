# Chasum

AI-powered appointment booking SaaS — faster, cleaner, and easier to use.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Auth + Database + Storage)
- **Stripe** (Phase 3+)
- **Vercel** (Deployment)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

3. Run the database migration in Supabase → SQL Editor:

```
supabase/migrations/001_booking_engine.sql
```

4. In Supabase → Authentication → URL Configuration, add these **Redirect URLs**:

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/reset-password
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (marketing)/         # Landing page
  (auth)/              # Login, signup, forgot/reset password
  (dashboard)/         # Protected dashboard routes
  book/[slug]/         # Public booking page
  auth/                # Supabase OAuth & email callbacks
components/
  ui/                  # Reusable UI primitives
  calendar/            # Day/week/month calendar views
  booking/             # Public booking flow
  services/            # Service management
  staff/               # Staff management
  customers/           # Client database
  settings/            # Business profile & hours
lib/
  supabase/            # Supabase client utilities
  actions/             # Server actions
  calendar/            # Calendar date utilities
  types/               # TypeScript types
supabase/migrations/   # Database schema
```

## Phase 1 (Complete)

- Premium landing page
- Authentication (sign up, login, forgot/reset password)
- Dashboard with sidebar + top navigation
- Dark / light mode
- Route protection

## Phase 2 (Complete)

- **Calendar** — day, week, and month views with appointment CRUD
- **Services** — create, edit, delete services with pricing and duration
- **Staff** — manage team members and assign services
- **Business hours** — configure weekly availability
- **Clients** — customer database with search
- **Public booking page** — `/book/[slug]` multi-step booking flow
- **Availability engine** — conflict detection and slot generation

## Phase 3 (Upcoming)

- Stripe subscriptions
- Calendar sync (Google, Outlook)
- Email/SMS reminders
- Analytics dashboard
