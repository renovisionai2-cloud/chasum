# World Class — Staging grant alignment + Auth pre-cutover

**Program:** Chasum World Class Program  
**Task:** Staging-only GRANT alignment and Auth URL configuration  
**Branch:** `cursor/world-class-portal-foundation`  
**Production:** locked — `https://chasum.vercel.app`  
**Preview:** still on **Production** Supabase (this task did **not** change Vercel)  
**Staging ref:** `wnfahklzaxirftyskctd`  
**Production ref:** `kxcydvhswkuzepwzzinq` (catalog reads only)

`.env.local` was not used. No secrets are recorded here.

---

## A. Staging target verification

| Check | Result |
|-------|--------|
| `.env.staging.local` | Present, gitignored (`.env*`) |
| `CHASUM_SUPABASE_TARGET` | `staging` |
| URL ref | `wnfahklzaxirftyskctd` |
| Is Production `kxcydvhswkuzepwzzinq` | **No** |
| SQL / Auth PATCH target | Staging only |

---

## B. Production-vs-Staging grant diff (before alignment)

Schema `USAGE` for `anon` / `authenticated` / `service_role` on `public`, `storage`, and `graphql_public` already matched (**USAGE yes, CREATE no**). Storage table DML already matched. No `public` sequences on either side.

| OBJECT | PRODUCTION GRANT | STAGING GRANT (before) | REQUIRED FOR CHASUM? | SAFE TO ALIGN? | RISK |
|--------|------------------|------------------------|----------------------|----------------|------|
| `public` schema USAGE | USAGE to API roles | Same | Yes | Already aligned | None |
| All `public` tables DML (`anon`) | `SELECT/INSERT/UPDATE/DELETE` (plus TRUNCATE from default ACL) | No SELECT/INSERT/UPDATE/DELETE (TRUNCATE only) | **SELECT required** for public booking reads via PostgREST. INSERT/UPDATE/DELETE for `anon` are **not** used after `003` (writes go through security-definer RPCs); Production still grants them because RLS denies the writes. | Yes — grant `arwd`; do **not** newly GRANT TRUNCATE | GRANT without RLS would leak; **RLS remains enabled** |
| All `public` tables DML (`authenticated`) | Full `arwd` | Missing on 63/71 tables (commerce/members had partial GRANTs from SQL) | **Yes** — dashboard uses anon key + user JWT (`authenticated`) | Yes | RLS still row-filters |
| All `public` tables DML (`service_role`) | Full `arwd` | Missing on 63/71 tables | **Yes** — `createServiceClient()` | Yes | Service role bypasses RLS **after** GRANT; same as Production |
| `public` sequences | n/a (none) | n/a | Not currently | Align **default** privileges only | Low |
| `postgres` default privileges on `public` tables | `anon/authenticated/service_role=arwdDxtm` | `anon/authenticated/service_role=Dxtm` only | Yes — future migrations created as `postgres` | Yes — GRANT `arwd` so future tables match | Same as Production |
| `postgres` default privileges on functions | EXECUTE to API roles | EXECUTE to `postgres` only | Helpful for future RPCs | Yes | Does not revoke existing per-function GRANTs |
| Storage `objects` / `buckets` | API-role DML present | Same | Already OK | No change | None |
| TRUNCATE (`D`) | Present on Production | Already present on Staging | **No** — app never truncates; TRUNCATE ignores RLS | **Not newly granted**; not revoked | Left as-is |

**Smallest application model:** PostgREST table `SELECT/INSERT/UPDATE/DELETE` for `authenticated` and `service_role`; `SELECT` for `anon`; schema USAGE (already present); RPC `EXECUTE` already granted in migrations `003`/`008`/`013`/`026`. Staging was aligned to Production’s `arwd` for all three API roles so Preview behaves like today’s Production app. RLS remains the row-level boundary.

---

## C. Exact Staging grant / default-privilege SQL applied

Applied **once** to `wnfahklzaxirftyskctd` only:

```sql
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on all tables in schema public
  to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables
  to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant usage, select on sequences
  to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant execute on functions
  to anon, authenticated, service_role;
```

Not applied: TRUNCATE grants, RLS changes, Production SQL, `034`/`035`/`036`.

After apply: **0** public tables missing SELECT or INSERT for `anon` / `authenticated` / `service_role`. RLS still **on** for all 71 public tables. Policy count still **87**. `"Public can view businesses"` still `SELECT` `USING (true)`.

---

## D. Data API verification (Staging, empty-row)

| Call | Result |
|------|--------|
| anon `GET /rest/v1/businesses?select=id&limit=0` | **200** `[]` (was 401 permission denied) |
| anon `GET /rest/v1/services?select=id&limit=0` | **200** `[]` |
| anon `GET /rest/v1/subscription_plans?select=*&limit=1` | **206** (4 seed plans; public SELECT policy) |
| anon `GET /rest/v1/appointments?select=id&limit=0` | **200** `[]` |
| anon `GET /rest/v1/customers?select=id&limit=0` | **200** `[]` (RLS, not GRANT, hides rows) |
| service_role `GET /rest/v1/businesses?select=id&limit=0` | **200** `[]` |
| service_role `GET /rest/v1/customers?select=id&limit=0` | **200** `[]` |
| service_role `GET /rest/v1/communications_audit_log?select=id&limit=0` | **200** `[]` |

Authenticated JWT was **not** minted (no Auth users created). Catalog `has_table_privilege('authenticated', …)` is true for DML. First signup after cutover is the live JWT test.

---

## E. RLS baseline confirmation

**Unchanged.** No `CREATE/DROP POLICY`. No `FORCE RLS` / disable. Public businesses / services / staff policies remain as `001`–`033` reproduced them.

---

## F. Auth Site URL result (Staging only)

**Before:** `http://localhost:3000`  
**After:** `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app`

Production Site URL remains `https://chasum.vercel.app`.

---

## G. Redirect allow-list result (Staging only)

```
https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app/**
https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app/auth/callback
http://localhost:3000/**
http://localhost:3000/auth/callback
```

Production allow-list **unchanged**: localhost callback + localhost `/**` + `https://chasum.vercel.app/auth/callback`.

---

## H. Password reset / auth callback

App contract (`lib/actions/auth.ts`, `app/auth/callback/route.ts`):

- Signup confirm: `{origin}/auth/callback?next=/dashboard`
- Password reset: `{origin}/auth/callback?next=/reset-password`
- Callback exchanges `code` or `token_hash`, then redirects to `/dashboard` or `/reset-password`

Staging allow-list covers Preview `/auth/callback` and `/**` (query `next=` included). Email confirmation remains **on** (`mailer_autoconfirm=false`). Signup still enabled.

---

## I. Default mailer status

Staging SMTP **not** configured (same as Production dashboard SMTP host = empty). Built-in Supabase mailer is acceptable for **internal** test mailboxes only. Do not copy Production users. Do not point Staging Auth at Production customer inboxes.

---

## J. 026 schema difference analysis

| Object | Staging | Production | Preview code | Class |
|--------|---------|------------|--------------|--------|
| `availability_block_reason(...)` | Present | Absent | Internal helper used by Staging RPCs | **SAFE IN STAGING** |
| `get_available_slots` / `slot_is_blocked` / `validate_appointment_slot` bodies | Repo `026` revision | Older bodies | `lib/booking-engine/availability/query.ts` calls `rpc("get_available_slots")` | **SAFE IN STAGING**; **PRODUCTION REPAIR LATER** |

---

## K. 029 schema difference analysis

| Object | Staging | Production | Preview code | Class |
|--------|---------|------------|--------------|--------|
| `communications_audit_log` + RLS | Present | Absent | `lib/communications/timeline.ts` inserts | **SAFE IN STAGING**; **PRODUCTION REPAIR LATER** |
| `businesses.quiet_hours_*`, `marketing_email_enabled`, `communications_opt_out_footer` | Present | Absent | Settings + preferences; branding has a missing-column fallback | **SAFE IN STAGING**; **PRODUCTION REPAIR LATER** |
| `customers.marketing_consent*`, `membership_id`; `customer_notes.note_type` | Present | Absent | CRM UI; some writes already tolerate missing columns | **SAFE IN STAGING**; **PRODUCTION REPAIR LATER** |
| `background_jobs.next_retry_at` / `cancelled_at`; `job_status.retrying` | Present | Absent | Job processor filters `next_retry_at` | **SAFE IN STAGING**; **PRODUCTION REPAIR LATER** |
| Notification archive/priority/customer_id columns | Present | Absent | Notifications module | **SAFE IN STAGING**; **PRODUCTION REPAIR LATER** |

---

## L. Do 026/029 differences block Preview cutover?

**No.** Preview **code on this branch expects the repo schema**. Staging has it; live Production does not. Cutting Preview → Staging **removes** the current Production schema-lag fallbacks. Production still needs a later explicit `026`/`029` baseline repair — **not** this task.

---

## M. `.env.staging.local` gitignore

**Confirmed.** `.gitignore` `.env*`. `git check-ignore` matches. Not committed.

---

## N–U. Locks

| | |
|--|--|
| **N** Production impact | **NONE** |
| **O** Production DB changes | **NONE** |
| **P** Production Auth changes | **NONE** (GET compared before/after; identical) |
| **Q** GVM impact | **NONE** |
| **R** Production data copied | **NO** |
| **S** Chasum HQ created | **NO** |
| **T** GVM Test created | **NO** |
| **U** 034 / 035 / 036 applied | **NO** (`staff_id` still NOT NULL; no `resources`; no interval checks) |

---

## V. Preview cutover performed

**NO**

---

## W. Preview cutover readiness

**CONDITIONAL**

Staging DB + Auth URLs are application-ready. Cutover still requires an explicit **Preview-only** Vercel env change (not done) and non-Production messaging/billing keys on Preview.

---

## X. Exact blockers if not fully YES

1. Vercel Preview env still points at **Production** Supabase (intentional; not changed).  
2. If Preview keeps Production `RESEND_API_KEY` / Twilio / live Stripe after a Supabase swap, Preview (`NODE_ENV=production`) can still contact the real world. Those Preview env values must be test/unset **in the same cutover**.  
3. No Auth user exists yet — first internal signup is the live `authenticated` JWT test.  
4. Email templates still default Supabase copy (Site URL will fill `{{ .SiteURL }}`; branded sync is optional).  
5. Do not create GVM Test / Chasum HQ until after cutover verification.

---

## Y. Next Preview-only Vercel env changes (do not execute)

Change **Preview** environment only (not Production, not Development unless local will use Staging):

| Variable | Set to |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wnfahklzaxirftyskctd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging anon key (from Chasum Staging API settings / `.env.staging.local`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging service role (same source) |
| `NEXT_PUBLIC_APP_URL` | `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app` |

Also on Preview, in the same change-set:

- `RESEND_API_KEY` — Staging/test key **or unset** (do not leave Production)  
- `TWILIO_*` — unset or test  
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — unset or `sk_test_` / test webhook  
- Leave Production Vercel env **untouched**

Redeploy Preview after env change. Then sign up **one internal** user on Staging Auth.

---

## Z. Phase 6.3

**NOT STARTED**

## AA. Phase 6.4

**NOT STARTED**

## AB. Files changed

- `docs/WORLD_CLASS_STAGING_GRANT_AUTH_REPORT.md` (this file)

No application code. No Production config. No Vercel env.

---

*Stop. Do not connect Vercel Preview until the Product Owner explicitly orders the Preview-only env cutover.*
