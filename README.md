# Chasum

AI-powered appointment booking SaaS — faster, cleaner, and easier to use.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Auth + Database + Storage)
- **Stripe** (Phase 2+)
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

3. In Supabase → Authentication → URL Configuration, add these **Redirect URLs**:

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/reset-password
```

For production, add your Vercel domain with the same paths.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (marketing)/       # Landing page
  (auth)/              # Login, signup, forgot/reset password
  (dashboard)/         # Protected dashboard routes
  auth/                # Supabase OAuth & email callbacks
components/
  ui/                  # Reusable UI primitives
  landing/             # Marketing page sections
  auth/                # Auth form components
  dashboard/           # Shell, sidebar, top nav
  layout/              # Theme toggle, scripts
lib/
  supabase/            # Supabase client utilities
  actions/             # Server actions
  env.ts               # App URL helpers
  utils.ts             # Shared utilities
providers/             # React context providers
middleware.ts          # Route protection
```

## Phase 1 (Complete)

- Premium landing page with hero, features, pricing, and CTA
- Authentication: sign up, login, forgot password, reset password
- Supabase auth callbacks for email confirmation and password recovery
- Dashboard with sidebar + top navigation (responsive)
- Dark / light mode with no flash on load
- Route protection for authenticated pages
- Reusable component library

## Phase 2 (Awaiting approval)

- Appointment management
- Public booking pages
- Calendar sync
- Stripe subscriptions
