# Operation GVM — Vercel Deployment Completion Checklist

**Date verified:** 2026-07-22  
**Goal:** GVM Baby World can open Chasum on an iPad from the live Vercel URL.  
**Rule:** Do not re-apply migrations 001–029 in full. Use the repair step below only where gaps were found.

Companion guides: [`VERCEL_SETUP_WALKTHROUGH.md`](./VERCEL_SETUP_WALKTHROUGH.md), [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md)

---

## Verification results (already checked)

| Check | Result |
|-------|--------|
| Repo migrations `001`–`029` present | Yes (29 files) |
| Core tables (appointments, customers, businesses, locations, jobs, CRM, employees, packages, gift cards) | Present |
| Communications platform (`029`) | Present |
| Commerce ledger tables (`028` invoices/transactions/receipts/refunds) | Present |
| Appointment payment columns from `028` (`payment_status`, `amount_paid_cents`, …) | **Missing — repair required** |
| Customer store-credit columns from `028` | **Missing — repair required** |
| `commerce_invoice_sequences` | **Missing — repair required** |
| Storage bucket `business-assets` | **Exists (public)** |
| GVM tenant `slug=gvm-baby-world` | **Exists** |
| `vercel.json` cron `/api/cron/process-jobs` every 5 minutes | **Correct in repo** |
| Supabase Auth Site URL / Redirect URLs | **Must verify manually** (dashboard) |
| Local `.env.local` ready for production Vercel copy | **Partial** (see below) |
| Live Vercel `/api/health` | **Blocked until env vars + redeploy** |

**Do not re-run migrations 001–029.** Commerce tables already exist. Running them again is unnecessary. Run only the repair file `030_repair_commerce_payment_columns.sql` once (safe / idempotent).

---

## A. Values you must copy manually into Vercel

Open **Vercel → your Chasum project → Settings → Environment Variables**.  
Enter in this order. Never paste secrets into chat or git.

### Copy from Vercel

| # | Variable | Where to copy from | Environments |
|---|----------|--------------------|--------------|
| 1 | `NEXT_PUBLIC_APP_URL` | Vercel → **Settings → Domains** → your live `https://…` URL (**no trailing slash**). Do **not** use `http://localhost:3000`. | Production, Preview, Development |

### Copy from Supabase

| # | Variable | Where to copy from | Environments |
|---|----------|--------------------|--------------|
| 2 | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → **Project Settings → API → Project URL** | Production, Preview, Development |
| 3 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → **`anon` `public`** | Production, Preview, Development |
| 4 | `SUPABASE_SERVICE_ROLE_KEY` | Same page → **`service_role` `secret`** (Reveal) | Production, Preview, Development |

These three already exist in your local `.env.local` — you can copy from there **or** from the Supabase dashboard. Prefer the dashboard if unsure.

### Create yourself

| # | Variable | How | Environments |
|---|----------|-----|--------------|
| 5 | `CRON_SECRET` | Generate a long random password (password manager, or run `openssl rand -hex 32` on your Mac). Save it somewhere safe. | Production |

### Copy from Resend

| # | Variable | Where to copy from | Environments |
|---|----------|--------------------|--------------|
| 6 | `RESEND_API_KEY` | Resend → **API Keys → Create API Key** | Production (+ Preview if testing email) |
| 7 | `EMAIL_FROM` | After Resend → **Domains** is verified: e.g. `GVM Baby World <bookings@yourdomain.com>` or `Chasum <notifications@yourdomain.com>` | Same as Resend |

### Decide yourself

| # | Variable | Value | Environments |
|---|----------|-------|--------------|
| 8 | `PLATFORM_OWNER_EMAILS` | Your login email(s), comma-separated (who can open Chasum Owner/HQ) | Production |

**Optional for day-one GVM (skip for now):** Twilio, Google/Microsoft calendar, OpenAI, Stripe, Sentry.

**Do not add on Vercel:** `CHASUM_ALLOW_SOFT_SCHEMA`

---

## B. Database repair (one-time — not a full re-migration)

1. Open Supabase → **SQL Editor**.  
2. Open the file in this repo: `supabase/migrations/030_repair_commerce_payment_columns.sql`  
3. Paste and **Run** once.  
4. It only adds missing payment columns / invoice sequence. It will not wipe data.

In plain language: payments and invoices need a few missing “status” fields on appointments and customers. This patch finishes that safely.

---

## C. Supabase Auth (manual — required for iPad login)

Supabase → **Authentication → URL Configuration**:

| Setting | Set to |
|---------|--------|
| **Site URL** | Exactly the same as `NEXT_PUBLIC_APP_URL` (your Vercel `https://…`) |
| **Redirect URLs** | Add `https://YOUR-VERCEL-DOMAIN/auth/callback` |

Supabase → **Authentication → SMTP** (for password reset emails):

- Turn on custom SMTP using Resend’s SMTP settings.  
- Sender should match your `EMAIL_FROM` domain.

Without this, staff may log in, but “forgot password” will not work reliably.

---

## D. After env vars are saved — redeploy & verify health

### Redeploy

1. Vercel → **Deployments**  
2. Open the **⋮** menu on the latest Production deployment  
3. Click **Redeploy** (confirm)  
4. Wait until status is **Ready**

You must redeploy after adding `NEXT_PUBLIC_*` variables, or the live site will still behave as if they are missing.

### Verify health

On a computer or iPad Safari, open:

```text
https://YOUR-VERCEL-DOMAIN/api/health
```

You want a page of JSON that includes:

- `"ok": true`
- `"email": "configured"`
- `"cronSecret": "configured"`
- `"supabase": true` (or similar checks showing Supabase ready)

If `"ok": false`, one of the required env vars is still missing — recheck section A and redeploy again.

### Verify GVM can open the product

| Check | URL / action |
|-------|----------------|
| Marketing / home loads | `https://YOUR-VERCEL-DOMAIN/` |
| Login | `https://YOUR-VERCEL-DOMAIN/login` — sign in with the GVM owner account |
| Dashboard (reception) | Lands on `/dashboard` — calendar / today view usable on iPad |
| Public booking (optional) | `https://YOUR-VERCEL-DOMAIN/book/gvm-baby-world` |

---

## E. Final checkbox list

### Environment variables (Vercel)

- [ ] `NEXT_PUBLIC_APP_URL` = live HTTPS Vercel URL (not localhost)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `CRON_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] `PLATFORM_OWNER_EMAILS`
- [ ] Production environment checked for each
- [ ] Redeployed after saving

### Database & storage

- [ ] Confirmed **not** re-applying 001–029 in full
- [ ] Ran `030_repair_commerce_payment_columns.sql` once
- [ ] `business-assets` bucket present (already verified ✓)
- [ ] GVM business `gvm-baby-world` present (already verified ✓)

### Auth & email

- [ ] Supabase Site URL = Vercel URL
- [ ] Redirect URL includes `/auth/callback`
- [ ] Resend domain verified
- [ ] Supabase Auth SMTP configured with Resend

### Cron & health

- [ ] Vercel Cron Jobs shows `/api/cron/process-jobs` (from `vercel.json`)
- [ ] `/api/health` returns `"ok": true`
- [ ] Test login on iPad Safari
- [ ] Book or open an existing appointment once (smoke test)
- [ ] Confirmation email arrives (proves Resend + cron path)

---

## F. What “production-ready for GVM iPad” means

Ready when:

1. Staff open the Vercel URL on the iPad, log in, and see the GVM calendar/dashboard.  
2. Booking and customer lookups work without error screens.  
3. Appointment emails can send (Resend configured).  
4. Background reminders/jobs can run (cron + `CRON_SECRET`).  
5. Payment status can be tracked (repair SQL applied).

Not required for day-one iPad reception: SMS (Twilio), card charging (Stripe), Google/Outlook sync, Sentry, AI receptionist OpenAI key.

---

## G. If something fails (plain language)

| What you see | Likely fix |
|--------------|------------|
| Site says Supabase not configured | Env vars missing or forgot to **Redeploy** |
| Login loops / returns to login | Site URL / redirect URL in Supabase doesn’t match Vercel URL |
| `/api/health` not ok | Missing Resend, cron secret, or Supabase keys |
| Emails never arrive | Add `RESEND_API_KEY` + verify domain + set `EMAIL_FROM` |
| Payments / balance look broken | Run repair SQL `030` once |
| Cron never processes jobs | Confirm `CRON_SECRET` on Production and Cron Jobs enabled |

---

*Verified against live Supabase project linked from local `.env.local` on 2026-07-22. No secret values are stored in this document.*
