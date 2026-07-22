# Vercel Setup Walkthrough — Chasum

**Purpose:** Exact order to enter environment variables into Vercel, and where to click to find each value.  
**Companion catalog:** [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md)  
**Rule:** Never paste secret values into git, chat, or docs. Names and click paths only.

---

## Before you start

Have these tabs open:

1. [Vercel Dashboard](https://vercel.com/dashboard) → your Chasum project  
2. [Supabase Dashboard](https://supabase.com/dashboard) → your Chasum project  
3. [Resend Dashboard](https://resend.com) (create account if needed)  
4. Optional later: Twilio, Google Cloud, Azure, Stripe, Sentry, OpenAI

Also note your live app URL from Vercel (Domains), e.g. `https://your-project.vercel.app` or your custom domain.

---

## How to add a variable in Vercel (every step)

1. Open your project in Vercel.  
2. Go to **Settings → Environment Variables**.  
3. For each variable below:
   - **Key** = exact name from this guide  
   - **Value** = paste from the provider (do not share it)  
   - **Environments** = checkboxes listed in that step  
   - Click **Save**  
4. When all required vars are saved, go to **Deployments → ⋮ on latest → Redeploy**  
   (Required so `NEXT_PUBLIC_*` values are baked into the build.)

---

## Exact order — enter these first (required)

Do them in this order. Do not skip.

### 1. `NEXT_PUBLIC_APP_URL`

| | |
|--|--|
| **Where to find** | Vercel → Project → **Settings → Domains** (or the URL shown on the latest Production deployment). Use `https://…` with **no trailing slash**. |
| **If using custom domain** | Prefer the custom domain once DNS is connected. |
| **Environments** | Production ✓ · Preview ✓ · Development ✓ (Development can be `http://localhost:3000` if you use `vercel env pull`) |
| **Local mirror** | Same key in `.env.local` for local dev |

---

### 2. `NEXT_PUBLIC_SUPABASE_URL`

| | |
|--|--|
| **Where to find** | Supabase → select project → **Project Settings** (gear) → **API** → **Project URL** |
| **Looks like** | `https://xxxxxxxx.supabase.co` |
| **Environments** | Production ✓ · Preview ✓ · Development ✓ |

---

### 3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

| | |
|--|--|
| **Where to find** | Same page: Supabase → **Project Settings → API** → **Project API keys** → key labeled **`anon` `public`** |
| **Environments** | Production ✓ · Preview ✓ · Development ✓ |
| **Note** | This is the public client key (RLS still applies). Not the service role key. |

---

### 4. `SUPABASE_SERVICE_ROLE_KEY`

| | |
|--|--|
| **Where to find** | Same page: Supabase → **Project Settings → API** → **Project API keys** → key labeled **`service_role` `secret`** → Reveal / copy |
| **Environments** | Production ✓ · Preview ✓ · Development ✓ |
| **Warning** | Server-only. Never put this in client code or public docs. |

---

### 5. `CRON_SECRET`

| | |
|--|--|
| **Where to find** | You create it. Generate a long random string (password manager, or `openssl rand -hex 32` locally). |
| **Environments** | Production ✓ (required). Preview/Development optional. |
| **Why** | Protects `/api/cron/process-jobs`. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when this env var exists. |
| **Also** | Confirm **Settings → Cron Jobs** shows path `/api/cron/process-jobs` (from `vercel.json`). |

---

### 6. `RESEND_API_KEY`

| | |
|--|--|
| **Where to find** | [Resend](https://resend.com) → **API Keys** → **Create API Key** → copy once |
| **Environments** | Production ✓ · Preview ✓ (if you test email on previews) |
| **First-time setup** | Create a Resend account tied to your email; you will verify a sending domain next. |

---

### 7. `EMAIL_FROM`

| | |
|--|--|
| **Where to find** | You choose the from-address **after** verifying a domain in Resend → **Domains** → Add domain → complete DNS at your DNS host → wait until **Verified**. |
| **Format** | `Display Name <you@your-verified-domain.com>` |
| **Example shape** | `Chasum <notifications@yourdomain.com>` |
| **Environments** | Production ✓ · Preview ✓ (same as Resend key) |
| **Until domain is verified** | Resend may only allow sending to your own account email for testing — still set a from address Resend accepts. |

---

### 8. `PLATFORM_OWNER_EMAILS` (recommended now)

| | |
|--|--|
| **Where to find** | Your decision — comma-separated emails that should access `/owner` and HQ. |
| **Format** | `you@example.com,partner@example.com` (lowercase fine; commas, no spaces required but spaces are trimmed) |
| **Environments** | Production ✓ · Preview ✓ if testing owner console |

---

## Stop here and redeploy

1. Vercel → **Deployments** → Redeploy Production.  
2. Open `https://YOUR_DOMAIN/api/health`  
3. Expect `"ok": true` and `email` / `cronSecret` showing `configured`.

If `ok` is false, recheck steps 1–7 (especially Supabase + Resend + `CRON_SECRET`).

---

## After env vars — do these outside Vercel (required)

Still required for Chasum to run correctly:

| Order | Task | Where |
|------:|------|-------|
| A | Apply SQL migrations **001 → 029** | Supabase → **SQL Editor** or CLI against this project (`supabase/migrations/`) |
| B | Confirm storage bucket `business-assets` | Supabase → **Storage** |
| C | Set Auth Site URL | Supabase → **Authentication → URL Configuration** → **Site URL** = same as `NEXT_PUBLIC_APP_URL` |
| D | Allow redirect | Same page → **Redirect URLs** add `https://YOUR_DOMAIN/auth/callback` |
| E | Auth SMTP (password reset) | Supabase → **Authentication → SMTP** → enable custom SMTP using [Resend SMTP](https://resend.com/docs/send-with-supabase-smtp) (host/port/user/pass from Resend docs; sender aligned with `EMAIL_FROM`) |
| F | Smoke login | Open Production URL → Sign up / Log in → should reach `/dashboard` |

---

## Optional — add later (any order)

Only when you need the feature. Same Vercel **Environment Variables** UI.

| Variable(s) | Where to find |
|-------------|----------------|
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Twilio Console → Account SID / Auth Token; Phone Numbers → your E.164 number. Enable all three together. Environments: Production (and Preview if testing SMS). |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client. Redirect URI: `{APP_URL}/api/integrations/google/callback` |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` | Azure Portal → App registrations → Certificates & secrets. Redirect: `{APP_URL}/api/integrations/outlook/callback`. Tenant can be `common`. |
| `OPENAI_API_KEY`, `OPENAI_RECEPTIONIST_MODEL` | OpenAI → API keys. Model optional (default `gpt-4o-mini`). |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → API keys; Webhooks → endpoint `{APP_URL}/api/webhooks/stripe` → signing secret. |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Sentry → Project → Settings → Client Keys (DSN). |
| `RESEND_WEBHOOK_SECRET` | Resend → Webhooks → signing secret for `{APP_URL}/api/webhooks/resend`. |

**Do not add** `CHASUM_ALLOW_SOFT_SCHEMA` on Vercel.

**Do not add** `SUPABASE_ACCESS_TOKEN` to Vercel (local script only for email template sync).

---

## Copy/paste order checklist

Enter into Vercel in this sequence:

1. [ ] `NEXT_PUBLIC_APP_URL`  
2. [ ] `NEXT_PUBLIC_SUPABASE_URL`  
3. [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
4. [ ] `SUPABASE_SERVICE_ROLE_KEY`  
5. [ ] `CRON_SECRET`  
6. [ ] `RESEND_API_KEY`  
7. [ ] `EMAIL_FROM`  
8. [ ] `PLATFORM_OWNER_EMAILS`  
9. [ ] **Redeploy** Production  
10. [ ] Confirm `/api/health` → `ok: true`  
11. [ ] Supabase migrations + Auth URL + SMTP (table above)  
12. [ ] Optional providers as needed  

---

## Values you already have locally

If `.env.local` is already filled on your machine, you can copy **names you recognize** into Vercel manually (same values, never commit the file). Prefer copying from the provider dashboards if unsure which local file is production-correct.

To pull Vercel env into a local file later (optional):

```bash
vercel env pull .env.local
```

---

*See [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md) for the full variable catalog, Preview vs Production notes, and troubleshooting.*
