# Chasum

AI-powered appointment booking SaaS — faster, cleaner, and easier to use.

## Setup

```bash
npm install
cp .env.example .env.local
# Add Supabase credentials, then run both migrations in SQL Editor:
# 1. supabase/migrations/001_booking_engine.sql
# 2. supabase/migrations/002_booking_enhancements.sql
npm run dev
```

## Phase 2 — Complete Booking Engine

### Calendar
- Day, week, and month views
- Color-coded appointment status
- Current time indicator
- Drag-and-drop reschedule (day view)
- Appointment create, edit, cancel, reschedule

### Services
- CRUD with category, duration, price
- Buffer time before/after appointments

### Staff
- CRUD with profile photo URL
- Per-staff working hours and vacation days
- Service assignments

### Business Settings
- Business hours, timezone, booking URL
- Appointment intervals and booking limits
- Cancellation policy
- Holiday management

### Customers
- Database with search and tags
- Customer profile with appointment history

### Public Booking
- Multi-step flow at `/book/[slug]`
- Service → staff → date/time → contact → confirmation
- Availability engine with conflict detection

### Dashboard
- Today's schedule and upcoming appointments
- Revenue card (from completed appointments)
- New clients widget and quick actions

## Tech Stack

Next.js 16 · TypeScript · Tailwind CSS v4 · Supabase · Vercel
