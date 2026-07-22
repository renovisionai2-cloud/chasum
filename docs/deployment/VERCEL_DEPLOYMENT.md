# Vercel Deployment — Chasum

**Status:** Canonical checklist for deploying Chasum on Vercel  
**Audience:** Founders / engineers configuring production after first deploy  
**Related:** [`.env.example`](../../.env.example), [`docs/GVM_GO_LIVE.md`](../GVM_GO_LIVE.md), [`lib/env.ts`](../../lib/env.ts), [`scripts/verify-production-env.mjs`](../../scripts/verify-production-env.mjs)

This document lists every environment variable Chasum uses, where each value comes from, which Vercel environments need it, and what else must be configured besides env vars.

**Hands-on click path (exact entry order):** [`VERCEL_SETUP_WALKTHROUGH.md`](./VERCEL_SETUP_WALKTHROUGH.md)

**Never paste secret values into git, chat, or this file.** Names only.

---

## Current state

| Item | Status |
|------|--------|
| App deployed on Vercel | Live (configure env next) |
| Environment variables on Vercel | Not configured yet |
| Framework | Next.js 16 (App Router) — Vercel-native |
| Cron | Declared in `vercel.json` → `/api/cron/process-jobs` every 5 minutes |

Until required env vars are set, auth, dashboard data, cron, and transactional email will not work correctly. `/api/health` will return `ok: false` in production.

---

## Quick start (minimum to boot)

Add these in **Vercel → Project → Settings → Environment Variables**, then **Redeploy**.

| Variable | Environments |
|----------|----------------|
| `NEXT_PUBLIC_APP_URL` | Production (Preview optional — see notes) |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development |
| `CRON_SECRET` | Production (Preview if you invoke cron manually) |
| `RESEND_API_KEY` | Production, Preview (if testing email) |
| `EMAIL_FROM` | Production, Preview (if testing email) |
| `PLATFORM_OWNER_EMAILS` | Production (Preview if testing `/owner`) |

Then complete [Non-env configuration](#non-env-configuration-required).

Verify:

```bash
curl -sS https://<YOUR_VERCEL_DOMAIN>/api/health
# Expect: "ok": true, email + cronSecret "configured"
```

Local check against an exported env file (does not print secrets):

```bash
node scripts/verify-production-env.mjs
```

---

## Environment variable catalog

### Legend

| Column | Meaning |
|--------|---------|
| **Required** | App cannot run correctly in production without it |
| **Recommended** | Needed for GVM / real owner workflows soon after deploy |
| **Optional** | Feature works without it (degraded or disabled) |
| **Script-only** | Not needed on Vercel; local/CI scripts only |
| **Source** | Where you obtain the value today |
| **Prod / Preview / Dev** | Vercel environment toggles |

`NEXT_PUBLIC_*` values are inlined at **build time**. After changing them, trigger a new deployment.

---

### Required for production

| Variable | Source | Prod | Preview | Development | Notes |
|----------|--------|------|---------|-------------|-------|
| `NEXT_PUBLIC_APP_URL` | Your Vercel (or custom) HTTPS URL — also in `.env.local` locally | ✓ | ✓* | ✓ (localhost) | Canonical URL for auth redirects, emails, OAuth callbacks, Twilio webhook URL. Example production: `https://chasum.vercel.app` or custom domain. *Preview: either the stable preview domain or leave pointing at production carefully; add every used URL to Supabase Auth redirect allow-list. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL (also `.env.local`) | ✓ | ✓ | ✓ | Same project for all envs is fine for early GVM; use a staging project for Preview if preferred. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → `anon` `public` key (also `.env.local`) | ✓ | ✓ | ✓ | Safe for browser; RLS still applies. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → `service_role` secret (also `.env.local`) | ✓ | ✓ | ✓ | **Server only.** Never expose to the client. Required for cron / background jobs. |
| `CRON_SECRET` | Generate a long random secret (also `.env.local`). Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when this env var is set. | ✓ | ○ | ○ | Production returns **503** if missing, **401** if wrong. Cron jobs in `vercel.json` run on **Production** only. |
| `RESEND_API_KEY` | Resend dashboard → API Keys (also `.env.local`) | ✓ | ✓* | ○ | Production refuses to fake-send email. *Set on Preview if you test confirmations there. |
| `EMAIL_FROM` | Verified sender in Resend (domain DNS) — also `.env.local` | ✓ | ✓* | ○ | e.g. `Chasum <notifications@yourdomain.com>` or business-branded from address. Must match a verified Resend domain/identity. |

\* Preview recommended when that environment is used for QA with real email.

---

### Recommended (platform + auth mail)

| Variable | Source | Prod | Preview | Development | Notes |
|----------|--------|------|---------|-------------|-------|
| `PLATFORM_OWNER_EMAILS` | Founder decision — comma-separated emails (also `.env.local`) | ✓ | ○ | ○ | Gates `/owner` and HQ. Also seed `platform_admins` (migration `014`). Example shape: `you@chasum.app,ops@chasum.app`. |

**Supabase Auth SMTP** (not a Vercel env var): configure in **Supabase Dashboard → Authentication → SMTP** using Resend SMTP credentials so password-reset / signup mail works. Align sender with `EMAIL_FROM`.

---

### Optional — SMS (Twilio)

| Variable | Source | Prod | Preview | Development | Notes |
|----------|--------|------|---------|-------------|-------|
| `TWILIO_ACCOUNT_SID` | Twilio Console (also `.env.local`) | ○ | ○ | ○ | All three required together; otherwise SMS is skipped (not faked). |
| `TWILIO_AUTH_TOKEN` | Twilio Console | ○ | ○ | ○ | Also used to verify `/api/webhooks/twilio`. |
| `TWILIO_PHONE_NUMBER` | Twilio phone number (E.164) | ○ | ○ | ○ | From-number for outbound SMS. |

Configure Twilio status callback URL to `{NEXT_PUBLIC_APP_URL}/api/webhooks/twilio` when enabling SMS.

---

### Optional — calendar OAuth

| Variable | Source | Prod | Preview | Development | Notes |
|----------|--------|------|---------|-------------|-------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth client (also `.env.local`) | ○ | ○ | ○ | Redirect URI: `{APP_URL}/api/integrations/google/callback` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | ○ | ○ | ○ | |
| `MICROSOFT_CLIENT_ID` | Azure App Registration (also `.env.local`) | ○ | ○ | ○ | Redirect URI: `{APP_URL}/api/integrations/outlook/callback` |
| `MICROSOFT_CLIENT_SECRET` | Azure App Registration | ○ | ○ | ○ | |
| `MICROSOFT_TENANT_ID` | Azure tenant id, or `common` (default) | ○ | ○ | ○ | Defaults to `common` if unset. |

---

### Optional — AI Receptionist (Emma)

| Variable | Source | Prod | Preview | Development | Notes |
|----------|--------|------|---------|-------------|-------|
| `OPENAI_API_KEY` | OpenAI dashboard (also `.env.local`) | ○ | ○ | ○ | Without it, Emma uses the grounded Chasum-data provider only. |
| `OPENAI_RECEPTIONIST_MODEL` | OpenAI model id (optional override) | ○ | ○ | ○ | Defaults to `gpt-4o-mini`. |

---

### Optional — Stripe

| Variable | Source | Prod | Preview | Development | Notes |
|----------|--------|------|---------|-------------|-------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys | ○ | ○ | ○ | Optional until card checkout is fully enabled. Use test keys on Preview/Dev. |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → signing secret for `{APP_URL}/api/webhooks/stripe` | ○ | ○ | ○ | Required for webhook route to accept events. |

---

### Optional — observability & delivery webhooks

| Variable | Source | Prod | Preview | Development | Notes |
|----------|--------|------|---------|-------------|-------|
| `SENTRY_DSN` | Sentry project → Client Keys (DSN) | ○ | ○ | ○ | Server/edge capture. App no-ops if unset. |
| `NEXT_PUBLIC_SENTRY_DSN` | Same DSN or browser DSN | ○ | ○ | ○ | Browser/public; can mirror `SENTRY_DSN`. |
| `SENTRY_TRACES_SAMPLE_RATE` | Your choice (e.g. `0.1`) | ○ | ○ | ○ | Defaults to `0.1`. |
| `RESEND_WEBHOOK_SECRET` | Resend → Webhooks signing secret for `{APP_URL}/api/webhooks/resend` | ○ | ○ | ○ | Delivery/bounce status accuracy. |

---

### Do not enable in production

| Variable | Source | Prod | Preview | Development | Notes |
|----------|--------|------|---------|-------------|-------|
| `CHASUM_ALLOW_SOFT_SCHEMA` | Local opt-in only (`.env.local`) | ✗ | ✗ | ○ only if incomplete DB | Set to `1` only for intentional incomplete local DBs. **Leave unset on Vercel.** |

---

### Script-only (not for Vercel)

These are used by local/CI scripts. Do **not** need to be added to Vercel for the app to run.

| Variable | Source | Used by |
|----------|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens | `scripts/sync-supabase-email-templates.mjs` |
| `PLAYWRIGHT_BASE_URL` | Your choice | Playwright / `scripts/e2e-smoke.mjs` |
| `AUDIT_OWNER_EMAIL` | Your choice | `scripts/audit-business-readiness.mjs` |
| `CI` | CI provider | Playwright/Vitest behavior |

### Provided by Vercel automatically

| Variable | Notes |
|----------|-------|
| `VERCEL_ENV` | `production` \| `preview` \| `development` — used by `isProductionRuntime()` |
| `NODE_ENV` | `production` on Vercel builds/runtime |
| `NEXT_RUNTIME` | Set by Next.js (`nodejs` / `edge`) — not configured manually |

---

## Full name checklist (copy/paste into Vercel UI)

**Required**

- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `CRON_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`

**Recommended**

- [ ] `PLATFORM_OWNER_EMAILS`

**Optional**

- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE_NUMBER`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `MICROSOFT_CLIENT_ID`
- [ ] `MICROSOFT_CLIENT_SECRET`
- [ ] `MICROSOFT_TENANT_ID`
- [ ] `OPENAI_API_KEY`
- [ ] `OPENAI_RECEPTIONIST_MODEL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `SENTRY_DSN`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `SENTRY_TRACES_SAMPLE_RATE`
- [ ] `RESEND_WEBHOOK_SECRET`

**Never on Vercel production**

- [ ] ~~`CHASUM_ALLOW_SOFT_SCHEMA`~~ (must remain unset)

---

## Non-env configuration (required)

Environment variables alone are **not** enough.

| # | Task | Where | Why |
|---|------|-------|-----|
| 1 | Apply Supabase migrations **001 → 029** | Supabase SQL / CLI on the production project | Schema, RLS, RPCs, commerce, communications |
| 2 | Confirm storage bucket `business-assets` + RLS | Supabase Storage | Logos / uploads |
| 3 | Auth URL config | Supabase → Authentication → URL Configuration | **Site URL** = `NEXT_PUBLIC_APP_URL`; add `{APP_URL}/auth/callback` (and Preview URLs if used) to Redirect URLs |
| 4 | Auth custom SMTP via Resend | Supabase → Authentication → SMTP | Password reset / signup emails |
| 5 | Sync auth email templates (optional but recommended) | Local: `SUPABASE_ACCESS_TOKEN=… node scripts/sync-supabase-email-templates.mjs` | Branded recovery/confirm mail |
| 6 | Verify Resend domain DNS | Resend → Domains | So `EMAIL_FROM` can send |
| 7 | Confirm Vercel Cron | Vercel → Settings → Cron Jobs | Path `/api/cron/process-jobs`, schedule `*/5 * * * *` from `vercel.json`; requires `CRON_SECRET` |
| 8 | Custom domain (optional) | Vercel → Domains | Then update `NEXT_PUBLIC_APP_URL` + Supabase Site URL + OAuth redirect URIs + redeploy |
| 9 | Seed / verify GVM tenant | `node scripts/setup-gvm-baby-world.mjs` (with service role) | Operation GVM design partner |
| 10 | Platform owners | `PLATFORM_OWNER_EMAILS` + `platform_admins` rows | `/owner` access |

### Optional provider dashboards

| Provider | Configure |
|----------|-----------|
| Google OAuth | Authorized redirect `{APP_URL}/api/integrations/google/callback` |
| Microsoft OAuth | Redirect `{APP_URL}/api/integrations/outlook/callback` |
| Stripe | Webhook endpoint `{APP_URL}/api/webhooks/stripe` |
| Resend | Webhook `{APP_URL}/api/webhooks/resend` (if using delivery events) |
| Twilio | Status callback `{APP_URL}/api/webhooks/twilio` |
| Sentry | Create Next.js project; paste DSN(s) |

---

## Vercel project settings — readiness

### Verified in repo

| Setting | Repo value | Verdict |
|---------|------------|---------|
| Framework | Next.js | Ready — Vercel auto-detects |
| Build command | `next build` (`npm run build`) | Ready — default |
| Install command | `npm install` | Ready — default |
| Output | Next.js default (no static export) | Ready |
| `next.config.ts` | Minimal empty config | Ready — no special webpack/output overrides needed |
| `vercel.json` | Cron every 5 min → `/api/cron/process-jobs` | Ready |
| Node engines | Not pinned in `package.json` | OK — use Vercel default Node 20+ (or set Node 20/22 in Project Settings) |
| Middleware | `middleware.ts` present | Works on Vercel (Next may warn about future `proxy` rename — non-blocking) |

### Recommended Vercel UI settings

| Setting | Recommendation |
|---------|----------------|
| Root Directory | Repository root (`.`) |
| Node.js Version | **20.x** or **22.x** |
| Ignored Build Step | Leave default unless monorepo |
| Production Branch | Your release branch (e.g. `main` when promoted) |
| Automatic Deployments | On for Production + Preview |
| Environment Variables | Match tables above; mark secrets as Sensitive |
| Protection | Optional Password Protection for Preview only |

### After setting env vars

1. **Redeploy** Production (Required — especially for `NEXT_PUBLIC_*`).
2. Hit `/api/health` until `ok: true`.
3. Sign up / sign in once; confirm Supabase session + redirect to `/dashboard`.
4. Create a test appointment; confirm Resend delivery and `background_jobs` completion after cron.
5. Run `node scripts/verify-production-env.mjs` against a local copy of production env (never commit the file).

---

## Preview vs Production notes

| Topic | Guidance |
|-------|----------|
| Cron | Vercel Cron runs on **Production** deployments. Preview does not need cron for most QA. |
| Supabase | Prefer one production project early; add a staging project for Preview when data isolation matters. |
| Auth redirects | Every Preview URL used for login must be allow-listed in Supabase Redirect URLs, **or** always test auth against Production URL. |
| Stripe / Twilio | Use **test** credentials on Preview. |
| Soft schema | Never enable `CHASUM_ALLOW_SOFT_SCHEMA` on Preview or Production. |

---

## Post-deploy smoke checklist

| # | Check | Pass |
|---|-------|------|
| 1 | `GET /api/health` → `ok: true` | ☐ |
| 2 | Login / signup works; lands on `/dashboard` | ☐ |
| 3 | Dashboard loads business data (not blank auth errors) | ☐ |
| 4 | Book appointment → confirmation email via Resend | ☐ |
| 5 | Cron: jobs move `pending` → `completed` within ~5 minutes | ☐ |
| 6 | Password reset email (Supabase SMTP) arrives | ☐ |
| 7 | Public book page (if used) loads for tenant slug | ☐ |
| 8 | `/owner` opens for emails in `PLATFORM_OWNER_EMAILS` | ☐ |

Full GVM cutover: [`docs/GVM_GO_LIVE.md`](../GVM_GO_LIVE.md).

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `/api/health` `ok: false` | Missing Supabase, service role, Resend, or `CRON_SECRET` |
| Infinite login / redirect loop | Wrong `NEXT_PUBLIC_APP_URL` or Supabase Redirect URLs |
| “Supabase is not configured” | Missing `NEXT_PUBLIC_SUPABASE_*` (redeploy after adding) |
| Cron 503 | `CRON_SECRET` unset in Production |
| Cron 401 | Secret mismatch — Vercel env must match what cron sends |
| Emails never arrive | Missing `RESEND_API_KEY` / unverified `EMAIL_FROM` domain |
| Password reset missing | Supabase Auth SMTP not configured |
| Empty commerce / CRM tables | Migrations 027–029 not applied |

---

## Ownership

| Artifact | Path |
|----------|------|
| Env accessors | `lib/env.ts` |
| Example env file | `.env.example` |
| Env verifier | `scripts/verify-production-env.mjs` (`npm run verify:env`) |
| Cron config | `vercel.json` |
| Next config | `next.config.ts` |
| Health probe | `GET /api/health` |

---

*Created for first Vercel production wiring. Update this file when new env vars are introduced in `lib/env.ts` or `.env.example`.*
