# World Class — Preview → Staging cutover STOP

**Program:** Chasum World Class Program  
**Task:** Connect Vercel **Preview only** to Chasum Staging  
**Status:** **STOPPED — Vercel access not available in this agent environment**  
**Branch:** `cursor/world-class-portal-foundation`  
**Production:** locked — `https://chasum.vercel.app` (`4eecbec`)  
**Preview alias:** `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app`  
**Production Supabase:** `kxcydvhswkuzepwzzinq`  
**Staging Supabase:** `wnfahklzaxirftyskctd`

**This agent did not change any Vercel environment variables.**  
**This agent did not redeploy Preview.**  
**This agent did not create Auth users or businesses.**

---

## Why stopped

| Check | Result |
|-------|--------|
| Vercel CLI | Installed **59.1.4**, **logged out** (`vercel whoami`) |
| Vercel project link (`.vercel/`) | Absent |
| `VERCEL_TOKEN` in process env / `.env.staging.local` | Absent |
| GitHub CLI | Keyring token invalid — cannot use `gh` as a Vercel back door |
| Preview HTTP | **302** to `https://vercel.com/sso-api?...` — **Deployment Protection (SSO)** is on. Unauthenticated curl cannot read `/api/build-info` or `/api/health` on Preview |
| Production HTTP | Public. `/api/health` `ok: true`. `/book/gvm-baby-world` **200** title **Book with GVM Baby World Ultrasound** |

PO authorization for Preview-only env change is recorded. Execution requires a logged-in Vercel session (dashboard or `vercel login`).

---

## Current vs intended contract

```
CURRENT (unchanged)
Vercel Production  ──┐
Vercel Preview     ──┴──►  Production Supabase  kxcydvhswkuzepwzzinq

INTENDED (after PO completes the steps below)
Vercel Production  ──────►  Production Supabase  kxcydvhswkuzepwzzinq
Vercel Preview     ──────►  Staging Supabase     wnfahklzaxirftyskctd
Local World Class  ──────►  Staging via .env.staging.local
```

Migrations: git file → Staging → Preview PO test → explicit Production authorization → Production.

---

## External integration preflight (from code + Production health)

Preview env **names/scopes were not readable** without Vercel login. Historical GVM checklists copied the **same** keys to Production, Preview, and Development. Production `/api/health` (public):

| Variable | Production public check | PRODUCTION VALUE CURRENTLY AVAILABLE TO PREVIEW? | SAFE TO KEEP ON PREVIEW? | MUST UNSET? | MUST REPLACE WITH TEST? |
|----------|-------------------------|--------------------------------------------------|--------------------------|-------------|-------------------------|
| `RESEND_API_KEY` | email **configured** | **Likely yes** if the var is scoped to Preview or All Environments | **No** — Preview `NODE_ENV=production` so Resend **really sends** | **Yes**, unless a dedicated Staging/test Resend key exists | Staging/test key **or unset** |
| `EMAIL_FROM` / `RESEND_FROM` / `DEFAULT_FROM_EMAIL` | used with Resend | Follows Resend | Only if Resend is test/unset | Unset or Staging-safe sender | Staging-safe sender if using test Resend |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | SMS **optional_missing** on Production | Unknown; if present on Preview, **unsafe** | **No** | **Yes** if present | Do not add |
| `STRIPE_SECRET_KEY` | stripe **optional_missing** | Unknown; `sk_live_` must never be on Preview | **No** if live | **Yes** if live | `sk_test_` only or unset |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | not in health | Same as secret | **No** if live `pk_live_` | **Yes** if live | `pk_test_` or unset |
| `STRIPE_WEBHOOK_SECRET` | not in health | Production webhook must not hit Preview | **No** | **Yes** if Production secret | Test webhook or unset |
| `CRON_SECRET` | configured on Production | Cron in `vercel.json` runs on **Production only** | Preview can keep or omit | Optional | Not required for this cutover |
| `GOOGLE_CLIENT_*` / `MICROSOFT_CLIENT_*` | calendar OAuth | If Preview uses Production clients, callbacks hit Production Site URL | Do not test calendar on Preview until redirect URIs include Preview | Leave unused | Separate Preview clients later |
| `OPENAI_API_KEY` | optional Emma | Low customer-contact risk | Optional | No | Optional |
| `SENTRY_DSN` | optional_missing on Production | Low | Optional | No | Optional |

**Resend if unset:** Auth signup/reset uses **Supabase’s built-in mailer** (already configured on Staging; Site URL = Preview). App transactional email (receipts, reminders, Chase) uses `DisabledEmailProvider` and **fails honestly** — it does not fake “sent”. That is the recommended Preview strategy until a Staging Resend key exists.

Do **not** send a test email to any GVM customer.

---

## Product Owner — click-by-click (Preview only)

Do **not** paste secrets into chat. Copy Staging keys from `.env.staging.local` or Supabase → **Chasum Staging** → Settings → API.

### 1. Open env settings

1. Sign in at [vercel.com](https://vercel.com) as the Chasum project owner.  
2. Open the **chasum** project (the one that serves `chasum.vercel.app`).  
3. **Settings → Environment Variables**.  
4. In the list, note each variable’s **Name** and **Environment** chips only (`Production` / `Preview` / `Development`). Do not screenshot values.

### 2. Prove Production will stay untouched

For every variable you will change:

- If it currently has **Production** (or **All Environments** / no environment restriction): **do not edit that row in place.**  
- **Create a new Preview-only row**, or **remove Preview from a shared row** first so Production keeps the old value, then add a **Preview-only** replacement.

Required proof before Save: the Production chip still exists on the **unchanged** Production values for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

### 3. Preview-only Supabase + app URL

| VARIABLE | TARGET SCOPE | OLD PROJECT CLASS | NEW PROJECT CLASS |
|----------|--------------|-------------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Preview only** | Production (`kxcydvhswkuzepwzzinq`) | Staging (`wnfahklzaxirftyskctd`) → `https://wnfahklzaxirftyskctd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Preview only** | Production | Staging publishable/anon key (keep the **name** `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Preview only** | Production | Staging service-role / secret key (keep the **name**) |
| `NEXT_PUBLIC_APP_URL` | **Preview only** | Often Production URL | `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app` |

Keep application env **names**. Do not rename to `SUPABASE_PUBLISHABLE_KEY`.

### 4. Preview-only side-effect vars

| VARIABLE | Preview action |
|----------|----------------|
| `RESEND_API_KEY` | Remove Preview from Production row; **do not** add Preview unless you have a test Resend key |
| `EMAIL_FROM` / related | Preview: unset or Staging-safe; never Production customer From if Resend stays live |
| `TWILIO_*` | Remove Preview if present |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Remove Preview if live; test-mode only if you add anything |

### 5. Save and redeploy **Preview**

1. Confirm no Production row was edited.  
2. **Deployments** → the latest **Preview** for `cursor/world-class-portal-foundation` → **Redeploy** (or push this branch after the diagnostic commit so GitHub builds a new Preview).  
3. Do **not** Promote to Production.

### 6. Verify (after SSO)

Preview is behind Vercel SSO. Open the Preview URL while logged into Vercel, then:

1. `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app/api/build-info`  
   Expect: `"env":"preview"`, `"supabaseProjectRef":"wnfahklzaxirftyskctd"`, `"production":false`.  
   Must **not** be `kxcydvhswkuzepwzzinq`.  
2. `/login` should load Chasum login (empty Staging — **no GVM calendar data**).  
3. Production `https://chasum.vercel.app/book/gvm-baby-world` still **Book with GVM Baby World Ultrasound**.

If Preview still shows live GVM operational data: **STOP** — Production credentials are still on Preview.

### 7. Auth test — stop before `/dashboard`

`app/(dashboard)/layout.tsx` calls `getOrCreateBusiness()` → RPC `ensure_business_for_owner`. **Any authenticated visit to `/dashboard` creates a business.**

Allowed without further PO: signup + email confirm + `/login` for **one internal** Staging user.  
**Do not open `/dashboard` until PO authorizes creating that first Staging business** (not GVM Test, not Chasum HQ).

---

## Diagnostic added in this repo (not yet on Preview until redeploy)

`GET /api/build-info` now returns public `supabaseProjectRef` from `NEXT_PUBLIC_SUPABASE_URL` hostname. No keys.

---

## Locks held

| Item | Status |
|------|--------|
| Production Vercel env | **Unchanged** |
| Production Supabase | **Unchanged** |
| Production Auth / RLS | **Unchanged** |
| GVM Test / Chasum HQ | **Not created** |
| 034 / 035 / 036 | **Unapplied** |
| RLS hardening | **Not started** |
| Phase 6.3 / 6.4 | **Not started** |
| Preview cutover | **Not executed** |
