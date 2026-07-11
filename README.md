# Chasum

AI-powered appointment booking SaaS — faster, cleaner, and easier to use.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Auth)
- **Stripe** (Phase 2+)
- **Vercel** (Deployment)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — from your [Supabase project settings](https://supabase.com/dashboard)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project settings
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for local dev

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (marketing)/     # Landing page
  (auth)/          # Login, signup, forgot password
  (dashboard)/     # Protected dashboard routes
components/
  ui/              # Reusable UI primitives
  landing/         # Marketing page sections
  auth/            # Auth form components
  dashboard/       # Dashboard layout & widgets
  layout/          # Theme toggle, scripts
lib/
  supabase/        # Supabase client utilities
  actions/         # Server actions
  utils.ts         # Shared utilities
providers/         # React context providers
```

## Phase 1 (Complete)

- Beautiful landing page with hero, features, pricing, and CTA
- Authentication (sign up, login, forgot password) via Supabase
- Dashboard layout with sidebar navigation
- Responsive mobile navigation
- Dark / light mode with no flash on load
- Reusable component library

## Phase 2 (Upcoming)

- Appointment management
- Booking pages
- Calendar sync
- Stripe billing
