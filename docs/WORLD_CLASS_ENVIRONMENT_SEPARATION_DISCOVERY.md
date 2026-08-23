# World Class — Environment Separation Discovery (Staging / Production)

**Program:** Chasum World Class Program  
**Mode:** Discovery **only** — no Staging init, no Vercel env change, no SQL, no data copy  
**Branch:** `cursor/world-class-portal-foundation`  
**Production:** locked — `https://chasum.vercel.app` (`4eecbec`)  
**Preview:** `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app`  
**Current database wiring (at discovery):** Preview **and** Production still use the **live Production** Supabase project  
**LIVE CONTRACT (2026-08-23 SUPERSEDES):** Preview → Staging `wnfahklzaxirftyskctd`; Production → Production `kxcydvhswkuzepwzzinq`. This file remains the discovery record from when Staging was empty.  
**New project (PO-created, empty):** **Chasum Staging** — Canada (Central), Healthy  
**Staging security at creation:** Data API ON · automatically expose new tables **OFF** · automatic RLS for new public tables **ON**  
**Chasum HQ tenant:** **NOT CREATED**  
**Phase 6.3 implementation:** **NOT STARTED**  
**Phase 6.4:** **NOT STARTED**  
**Migrations 034 / 035 / 036:** remain **unapplied** (Production and, until a later Staging-only test, must stay unapplied)  
**DB impact from this discovery:** **NONE**  
**Production impact from this discovery:** **NONE**  
**Secrets:** names only — never paste keys, JWTs, or database passwords

Do **not** treat this document as permission to initialize Staging, connect Vercel, or apply SQL.

---

## Current vs target

```
TODAY
Vercel Production  ──┐
Vercel Preview     ──┴──►  Production Supabase  (live GVM + all tenants)

TARGET
Vercel Production  ──────►  Production Supabase
Vercel Preview     ──────►  Staging Supabase (empty until initialized)
```

Purpose of Staging: World Class development, migrations, RLS tests, later Chasum HQ **pilot**, controlled test data, commerce/refund tests, tenant tests. **Never** a copy of Production GVM customers.

---

## A. Current Supabase env-variable map

The Next.js app does **not** use `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_DB_URL`, or `SUPABASE_URL`. It uses the Data API via `@supabase/ssr` / `@supabase/supabase-js`.

Project ref is derived only as the hostname of `NEXT_PUBLIC_SUPABASE_URL` (e.g. Management API in `scripts/sync-supabase-email-templates.mjs`). JWT secret lives inside the anon/service keys issued **per project** — do not mix Production keys with Staging URL.

| VARIABLE | WHERE USED | CLIENT / SERVER | SECRET? | PROD | PREVIEW (today) | LOCAL | RISK IF WRONG PROJECT |
|----------|------------|-----------------|---------|------|-----------------|-------|------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/env.ts` `getSupabaseEnv`; browser + server clients; verify/audit scripts | Both (public) | No (URL) | Required | Required (currently **Production** URL) | Required | Entire app talks to the wrong database. Auth cookies/JWT will not validate across projects. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as URL | Both (public, RLS applies) | **Key material** — treat as sensitive | Required | Required | Required | Auth/API fail or, if mixed with the other project's URL, unpredictable errors. Never pair Staging URL with Production anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/service.ts`; cron/jobs; Platform Admin; verify scripts | Server only | **Yes — bypasses RLS** | Required | Required today | Required for jobs/scripts | **Critical.** Service role of Production used from Preview **is the current shared-DB risk.** Staging must get **Staging** service role only. |
| `SUPABASE_ACCESS_TOKEN` | `scripts/sync-supabase-email-templates.mjs` only | Local script | Yes (personal PAT) | Not on Vercel | Not on Vercel | Optional | PAT can PATCH Auth config on **whichever project ref the URL implies**. Point at Staging when syncing Staging templates. |
| `DATABASE_URL` / `DIRECT_URL` / `SUPABASE_DB_URL` / `SUPABASE_URL` | **Not used** in app | — | Yes if set | Not required | Not required | Not required | If someone adds them later for CLI, a Production URI would allow schema/data access. Do not put Production DB URIs in Preview. |
| Supabase JWT / `JWT_SECRET` | Not an app env var; embedded in project API keys | — | Yes | Implicit | Implicit | Implicit | Keys are project-specific. |
| Storage | Bucket name `business-assets` in code (`lib/actions/uploads.ts`); policies in migration `013` | Server via user session | Policies | Required bucket | Same today | Same | Staging needs an **empty** bucket, not Production files. |

Related non-Supabase vars that **must eventually differ** for Preview vs Production (see § I): `NEXT_PUBLIC_APP_URL` (auth redirects), `RESEND_API_KEY`, `TWILIO_*`, `STRIPE_*`, `CRON_SECRET` (can be distinct), Google/Microsoft OAuth redirect clients.

---

## B. Current Vercel environment assumptions

**The repo and historical checklists assume one Supabase project for Production, Preview, and Development.**

Evidence:

- `.env.example` header: “Set the same keys on the production host”
- `docs/deployment/VERCEL_DEPLOYMENT.md`: “Same project for all envs is fine for early GVM; use a staging project for Preview if preferred”
- `docs/deployment/GVM_VERCEL_COMPLETION_CHECKLIST.md`: copy the same three Supabase vars to Production, Preview, **and** Development
- No `CHASUM_SUPABASE_ENV` or project-ref guard exists
- `lib/env.ts` `isProductionRuntime()` is `VERCEL_ENV === "production"` **OR** `NODE_ENV === "production"`

**Vercel Preview builds use `NODE_ENV=production`.** Therefore Preview is treated as a **production runtime** for email/SMS fallbacks and cron auth: if `RESEND_API_KEY` is set, mail is really sent; if unset, mail is **disabled** (not console-logged). Vercel Cron in `vercel.json` runs on **Production** only (every 5 minutes → `/api/cron/process-jobs`).

`VERCEL_ENV` is read for:

- `isProductionRuntime()` / cron / email / SMS
- `/api/build-info` (`env`, `production` flag)
- `PreviewBuildBadge` (hidden when `env === "production"`)
- Sentry environment tag
- Auth URL localhost guard

`VERCEL_TARGET_ENV` is **not** used.

`NEXT_PUBLIC_*` values are **inlined at build time**. Changing Preview Supabase URL/anon key requires a **new Preview deployment**, not a cache warm.

**Variables that must differ after cutover**

| Variable | Production | Preview (target) |
|----------|------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production project | Staging project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon | Staging anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role | Staging service role |
| `NEXT_PUBLIC_APP_URL` | `https://chasum.vercel.app` | Stable Preview URL (or leave request-header override; Staging Auth **Site URL** must be Preview, not Production) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Live | **Separate** test key / never Production mailbox list |
| `TWILIO_*` | Live or unset | Unset or Twilio test |
| `STRIPE_SECRET_KEY` / webhook | Live only if card path enabled | **Test keys or unset** |
| Google/Microsoft OAuth | Production callback | Preview callback URIs |

Do **not** change Vercel in this discovery.

---

## C. Migration inventory

Repo path: `supabase/migrations/` (36 files). **No** `supabase/config.toml`, **no** `supabase/seed.sql`, **no** `supabase/functions`.

| File | Believed on Production | Notes |
|------|------------------------|-------|
| `001_booking_engine.sql` | Yes | Core tables, `appointment_status` enum, public businesses SELECT |
| `002_booking_enhancements.sql` | Yes | Hours/vacation; `ALTER TYPE … pending` |
| `003_rls_hardening.sql` | Yes | Drops public customer/appointment SELECT; public booking RPCs |
| `004_phase3_integrations.sql` | Yes | Jobs, notifications, calendars, webhooks |
| `005_phase4_scheduling_engine.sql` | Yes | `btree_gist`; slot RPCs |
| `006_deduplicate_businesses.sql` | Applied as file / **SQL is comments only** | No-op on empty DB; documentation of a one-time cleanup |
| `007_one_business_per_owner.sql` | Yes | **Live DELETE** of duplicate empty businesses + unique `owner_id`; on empty Staging the DELETE is a no-op |
| `008_phase5_multi_location.sql` | Yes | `subscription_plans` **seed rows**; locations; RPC overloads |
| `009_phase5_drop_old_rpc_overloads.sql` | Yes | Drops pre-location signatures |
| `010_phase5_location_rls_hardening.sql` | Yes | Drops public location SELECT; public location RPCs |
| `011_sprint2_gvm_go_live.sql` | Yes | Profile columns |
| `012_sprint7_public_booking.sql` | Yes | `lookup_booking_customer` |
| `013_sprint8_gvm_go_live.sql` | Yes | Booking modes; **storage bucket `business-assets`** |
| `014_owner_platform.sql` | Yes | `platform_admins`, `platform_alerts` |
| `015_billing_phase1.sql` | Yes | SaaS `billing_invoices` / events |
| `016_communication_center_phase1.sql` | Yes | History / follow-ups |
| `017_employee_management.sql` | Yes | Departments, staff locations/docs |
| `018_crm_department.sql` | Yes | Notes, payment events |
| `019_booking_engine_2.sql` | Yes | Resources-lite, portal tokens; enum `yearly` |
| `020_business_management.sql` | Yes | Categories, packages, tax, discounts |
| `021_reports_analytics.sql` | Yes | Schedules/exports |
| `022_ai_receptionist.sql` | Yes | Conversations/messages |
| `023_business_management_settings.sql` | Yes | Closures, documents, hour segments |
| `024_services_module.sql` | Yes | Service locations/blackouts |
| `025_employees_module.sql` | Yes | Custom roles, staff closures |
| `026_availability_engine.sql` | Yes | Replaces slot RPCs |
| `027_crm_phase_5_4.sql` | Yes | Consent, note types |
| `028_commerce_platform.sql` | Yes | Ledger tables |
| `029_communications_platform.sql` | Yes | Audit; job_status values |
| `030_repair_commerce_payment_columns.sql` | Yes (repair after partial 028) | Idempotent `IF NOT EXISTS` |
| `031_commerce_finalize_and_arrival_workflow.sql` | Yes | Arrival enum values; sequences |
| `032_private_alpha_co_owners.sql` | Yes | `business_members`; `is_business_owner` |
| `033_private_alpha_co_owner_rls.sql` | Yes | Manage policies use `is_business_owner` |
| `034_optional_appointment_staff.sql` | **UNAPPLIED** | Would drop `staff_id NOT NULL` |
| `035_booking_interval_allowed_values.sql` | **UNAPPLIED** | Data UPDATE + check constraints |
| `036_booking_resources.sql` | **UNAPPLIED** | File is commented DDL + `select 1;` (no-op if accidentally applied) |

**Manual / dashboard SQL not fully represented**

- Changelog: `NOTIFY pgrst` after commerce grants (PostgREST cache) — operational, not a migration file.
- GVM checklist (2026-07-22): Production had **partial 028** until `030` repair. Repo now contains 028+030+031; empty Staging replay of 001–033 should not need that emergency path.
- Auth Site URL, redirect allow-list, SMTP, email templates: **dashboard / Management API**, not SQL.
- Possible extra dashboard-created policies, grants, or columns: **unverifiable without a schema-only compare** (not executed here).

---

## D. Production schema reconstruction confidence

**CONDITIONAL**

A brand-new Staging database can **likely** reconstruct the **accepted Production public schema** by replaying **`001`–`033` only**, then creating the empty `business-assets` bucket (included in `013`).

It cannot reconstruct:

- `auth.users` / sessions (must stay empty and separate)
- Production storage objects
- Dashboard Auth/SMTP/redirect settings
- Live GVM rows (must **not** be copied)
- Uncommitted dashboard tweaks (unknown drift)

**Do not** replay `034`–`036` as part of the initial Staging baseline if the goal is Production-parity. After baseline + Preview cutover, `034`/`035` become the **first Staging-only migration tests**. `036` is currently a no-op.

---

## E. Schema drift findings

| Gap | Severity | Implication for Staging init |
|-----|----------|------------------------------|
| No `schema_migrations` proof in-repo of what Production actually ran | High | Need a one-time **schema-only** compare after replay (no data) |
| `006` is comments-only; `007` contains a real DELETE | Medium | Empty Staging: DELETE no-ops; unique index still required |
| `ALTER TYPE … ADD VALUE` in `002`, `019`, `029`, `031` | Medium | Fails inside a transaction on PostgreSQL &lt; 15. New Supabase projects are typically PG 15+. If CLI wraps each file in a transaction and PG is older, apply those files outside a transaction |
| `030`/`031` duplicate some `028` objects with `IF NOT EXISTS` | Low | Replay-safe |
| Proposed atomic invoice RPC / unique invoice-appointment indexes | Documented in 6.3 — **not in migrations** | Do not invent them during Staging init |
| `btree_gist` in `005` | Required | Must be allowed on Staging (standard) |
| PostgREST “automatically expose new tables = OFF” | Config | After migrations, confirm `public` tables are exposed as on Production (Data API). May need dashboard check — **do not guess**; verify before Preview cutover |
| No views / materialized views in migrations | — | App does not depend on them |
| No pg_cron / Edge Functions in repo | — | Jobs are Next.js + `background_jobs` |

---

## F. Auth requirements

App auth (`lib/actions/auth.ts`):

- Email + password `signUp` / `signInWithPassword`
- Password reset via `resetPasswordForEmail` → `/auth/callback?next=/reset-password`
- Signup confirmation copy assumes email confirm may be on
- **No** Google/Apple **login** OAuth (Google/Microsoft env vars are **calendar** integrations)
- **No** magic-link product path beyond Supabase mailer templates
- Invitation to a second tenant is `business_members` (service-role), not Auth Invite

**Must be configured separately on Staging (dashboard):**

| Setting | Staging requirement |
|---------|---------------------|
| Site URL | Preview origin, **not** `https://chasum.vercel.app` |
| Redirect URLs | Preview `/auth/callback`, `/reset-password`, local `http://localhost:3000/**` if local uses Staging |
| Email confirmation | Match Production **or** explicitly disable for faster QA — PO decision |
| SMTP | Staging Resend SMTP (or Supabase default mail — volume-limited). **Do not** point at Production customer inboxes |
| Email templates | Re-run `scripts/sync-supabase-email-templates.mjs` with **Staging** URL + PAT so links use Staging Site URL |
| JWT | Automatic per project |
| Users | **Empty.** Sign up new test users. Never copy `auth.users` or passwords |

Production Auth users must remain Production-only.

---

## G. Storage requirements

**Yes — Supabase Storage is used.**

| Item | Detail |
|------|--------|
| Bucket | `business-assets` (public) — `013` |
| Paths | `{business_id}/{folder}/{timestamp}-{filename}` |
| Isolation | First folder = business id; RLS policies check owner |
| Staging | Create **empty** equivalent bucket (comes with `013` insert). **Do not** copy Production files |

---

## H. Functions / jobs requirements

| Mechanism | Exists? | Staging |
|-----------|---------|---------|
| Supabase Edge Functions | **No** repo functions | Do not deploy |
| `pg_cron` | **Not** in migrations | Do not enable unless later required |
| DB triggers | Many `updated_at` / seed triggers in SQL | Created by migrations |
| `background_jobs` | Table + Next.js processor | Staging table empty until app enqueues |
| Vercel Cron | Production only, 5 min, `/api/cron/process-jobs` | Preview will **not** process jobs unless invoked manually. For Staging email/SMS tests, either hit Preview cron with `CRON_SECRET` or accept no automatic reminders |
| Auth hooks | Templates via Management API only | Configure Staging Auth; do not copy Production hooks |
| Realtime | Not used as a product subscription | Optional; default off is fine |

Job types (processor): email, SMS, calendar sync, webhooks, recurring, waitlist. **All can contact the real world** if Staging has Production Resend/Twilio and real addresses.

---

## I. External integration requirements

| INTEGRATION | PRODUCTION CONFIG | STAGING REQUIREMENT | SAFE TEST MODE? | SEPARATE SECRET? | RISK OF CONTACTING REAL CUSTOMERS |
|-------------|-------------------|---------------------|-----------------|------------------|-----------------------------------|
| Resend (app email) | `RESEND_API_KEY`, `EMAIL_FROM` | Test API key **or** omit (Preview then **fails** send because runtime is “production”) | Resend test; only `@example` / team inboxes | **Yes** | **High** if Production key + copied GVM emails |
| Resend (Auth SMTP) | Dashboard SMTP | Separate SMTP / default | Yes | **Yes** | **High** if Site URL/templates still Production |
| Twilio | Optional trio | Unset or test credentials | Twilio magic numbers | **Yes** | **High** if live SID + real phones |
| Stripe | Optional; SaaS billing is **MockBillingProvider**; commerce has a Stripe REST helper | Unset or `sk_test_` + test webhook | Stripe test mode | **Yes** | **High** if live `sk_live_` on Preview |
| Stripe webhooks | `/api/webhooks/stripe` | Do **not** point Production Stripe at Preview | Test endpoint | **Yes** | Production events must not hit Staging ledger |
| Google / Microsoft calendar | OAuth client + callbacks | Separate redirect URIs for Preview | Use test calendars | Prefer separate clients | Can write test calendars only |
| Vercel | Production + Preview env | Preview-only Staging keys | n/a | n/a | Mis-set env = Production DB from Preview |
| Sentry | Optional DSN | Same or separate project | n/a | Optional | No customer PII by design if we don't send payloads |
| OpenAI | Optional Emma | Optional; no customer SMS | n/a | Optional | Low |
| Customer webhooks table | Per-tenant URLs | Only test endpoints in seed | n/a | n/a | Don't seed Production URLs |

**Goal:** Staging must never charge a real card, SMS a real customer, email a real customer, or process Production Stripe webhooks.

---

## J. Safe staging data policy

**Do not copy Production GVM (or any live) customer data.**

Prefer **normal app workflows** after Preview→Staging cutover:

| Data | How |
|------|-----|
| Operator user | Sign up on Staging Auth (new password) |
| First business | Dashboard `getOrCreateBusiness` / onboarding — name it **GVM Test** (not the live GVM slug `gvm-baby-world` unless PO wants a **new** empty slug and understands public booking SEO) |
| Employees / services / locations | Business settings UI |
| Customers | Manual test identities owned by the PO/team (`+staging@` inboxes, Twilio test numbers) |
| Appointments / deposits / invoices / receipts / refunds | Reception + Payments UI (accepted money formulas unchanged) |
| Communications | Same UI; recipients = test only |
| Chasum HQ | **Later**, after tenant-safety DB gates, **on Staging first** |
| `subscription_plans` | Created by migration `008` seed — not customer data |
| `platform_admins` | Insert **test** founder emails via service role **after** Auth users exist — or rely on `PLATFORM_OWNER_EMAILS` env |

**Not** a SQL dump. **Not** `scripts/setup-gvm-baby-world.mjs` against Production. That script uses whatever URL is in env — **dangerous** until env is Staging-only and PO authorizes a **new** test tenant.

Migration seed: only `subscription_plans` (already). No GVM fixtures in SQL.

---

## K. Recommended Staging schema initialization method

**Option A (recommended): Replay repository migrations `001`–`033` onto empty Staging. Stop before `034`.**

Then optionally **verify** with a Production **schema-only** dump of `public` (no data, no `auth.users`, no storage objects) as a **diff**, not as the primary restore.

---

## L. Why that method is preferred

| Option | Correctness | Repro | Risk | Drift | Secrets | Data copy | CI | Verdict |
|--------|-------------|-------|------|-------|---------|-----------|-----|---------|
| **A. Replay 001–033** | High if files match Production | High | Medium (enum txn; expose-tables setting) | Detect with later diff | SQL has no secrets | None | Best long-term | **Choose** |
| B. Schema-only dump restore | Highest snapshot fidelity | Lower (opaque dump) | Medium (wrong flags could include data) | Hides how we got here | Dump may include owners/ACLs | If mis-flagged, **catastrophic** | Weaker | Verification only |
| C. Baseline then continue | Good **after** A exists | High | Low | Managed | Low | None | Good | Future workflow |
| D. CLI pull/repair | Needs `config.toml` + linked project | Medium | Linking Production by mistake | Depends | CLI login token | Pull can include extras | Later | After Staging exists |

Replay is the only method that also **documents** how Staging was born. Dump-restore as the *first* action is how teams accidentally clone Production.

---

## M. Future migration workflow

```
DEVELOPMENT (branch)
  create migration file in supabase/migrations/
      ↓
STAGING (apply + Preview against Staging)
  PO tests on Preview
      ↓
PO ACCEPTANCE
      ↓
PRODUCTION (explicit PO + apply same file to Production Supabase)
```

| Step | Rule |
|------|------|
| Create | In git on World Class branch. Never “SQL editor only” on Production |
| First apply | **Staging only** |
| Preview | Already pointed at Staging (after cutover) |
| PO | Hands-on Preview. No Production apply from chat |
| Promote | Same file, same checksum, Production SQL/CLI, then Production deploy if app depends on it |
| Rollback | Prefer forward-fix. Destructive down-migrations need explicit PO. App rollback ≠ DB rollback |
| Who applies Production DB | **PO or designated operator only.** Agents/CI do not apply Production SQL unless PO explicitly orders it |

**034 / 035 / 036** stay unapplied on Production until this workflow is live and each file is Staging-tested.

---

## N. RLS hardening staging sequence

**Confirmed**, with one addition (public booking baseline **before** policy change):

1. Establish Staging schema (`001`–`033`)  
2. Connect Preview → Staging (cutover checklist)  
3. Test **current** public booking + dashboard (including known public `businesses` SELECT)  
4. Apply proposed RLS hardening **on Staging only**  
5. Retest public booking, slug lookup, dashboard, switcher  
6. PO approve  
7. Promote **that exact** policy change to Production  

Do not “fix” Production RLS from Preview while they still share a database. This discovery does **not** modify RLS.

---

## O. Chasum HQ staging sequence

**Yes — this is the right architecture.**

1. Tenant-safety DB gates still CONDITIONAL (public businesses SELECT, `account_class`, owner uniqueness) — see [`WORLD_CLASS_TENANT_SAFETY_FOUNDATION.md`](./WORLD_CLASS_TENANT_SAFETY_FOUNDATION.md)  
2. Create **Chasum HQ as a normal tenant on Staging** after Preview uses Staging  
3. Test onboarding, multi-business membership + switcher, CAD / America/Toronto, staff-only, $0 services  
4. Dogfood  
5. Only later create a **deliberate** Production HQ tenant (Production-visible; PO accepts metric mixing or `account_class`)

**No HQ creation now** (Staging or Production).

---

## P. Preview → Staging connection design

After schema + Auth + empty bucket + safe secrets:

Set **Preview-only** (not Production) Vercel env:

- Staging `NEXT_PUBLIC_SUPABASE_URL`
- Staging `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Staging `SUPABASE_SERVICE_ROLE_KEY`
- Preview `NEXT_PUBLIC_APP_URL` = Preview origin (recommended)
- Staging-safe Resend/Twilio/Stripe (or omit Twilio/Stripe)

Redeploy Preview. Confirm `/api/build-info` commit + `env: preview`. Confirm `/api/health` supabase+serviceRole.

---

## Q. Production → Production connection confirmation

**Production Vercel must keep Production Supabase URL, anon key, and service role unchanged.**

Never edit Production env as part of Preview cutover. Never “copy env to all environments” after Staging keys exist.

---

## R. Local development recommendation

**For current team size: use Staging remotely, not local Supabase.**

There is no `config.toml` / Docker workflow in-repo. Standing up local Postgres would delay the split.

| Local `.env.local` | Rule |
|--------------------|------|
| After Staging exists | Point local at **Staging** |
| Until then | Treat local like today — **high risk** of hitting Production; prefer not to run destructive scripts |
| Never | Production service role on a laptop for World Class experiments |

Optional later: local Supabase for offline work. Not required to start.

---

## S. Environment safety guards (recommend only — not implemented)

Smallest useful set:

1. **Preview badge** (already): commit + `VERCEL_ENV`  
2. **Future** `CHASUM_SUPABASE_TARGET=production\|staging` — fail Preview boot if target is `staging` but URL hostname equals the **known Production** project host (compare hostnames, never log keys)  
3. **Vercel UI discipline:** Staging keys = Preview (+ Development); Production keys = Production only; disable “all environments”  
4. **Do not** put Production service role in Preview after cutover  
5. Optional dashboard banner: “Staging data” when target is staging  
6. Scripts (`setup-gvm-baby-world`, `cleanup-duplicate-businesses`, `grant-gvm-private-alpha-owner`) must refuse to run unless an explicit `CHASUM_ALLOW_PROD_SCRIPTS=1` — **future code**, not this discovery

`isProductionRuntime()` treating Preview as production for email is **correct for not console-faking**, and **dangerous** if Production Resend remains on Preview. Fix by **secrets split**, not by silently console-logging on Preview.

---

## T. Exact cutover checklist (future — do not execute now)

### Pre-cutover

- [ ] Production Vercel env **untouched**; Production URL still Production Supabase  
- [ ] Staging project empty; Data API on; auto-expose off noted  
- [ ] Replay **`001`–`033` only** on Staging; record timestamps  
- [ ] Confirm `034`–`036` **not** applied  
- [ ] Empty `business-assets` bucket present  
- [ ] Schema-only diff vs Production `public` (optional but strongly recommended)  
- [ ] Staging Auth: Site URL = Preview; redirects; SMTP; templates synced with Staging URL  
- [ ] Staging secrets: separate Resend; Twilio unset or test; Stripe unset or `sk_test_`  
- [ ] No Production data copied  
- [ ] Test user can be created **on Staging Auth** (signup) without Preview cutover, via dashboard, **or** wait until Preview is connected  
- [ ] `CHASUM_ALLOW_SOFT_SCHEMA` **unset** on Vercel  

### Cutover

- [ ] Change **Preview-only** Supabase URL / anon / service role to Staging  
- [ ] Set Preview `NEXT_PUBLIC_APP_URL` if required  
- [ ] Trigger **new** Preview deployment (required for `NEXT_PUBLIC_*`)  
- [ ] Do not change Production env  

### Validation (Preview)

- [ ] `/api/build-info` — preview, expected commit  
- [ ] `/api/health` — supabase + serviceRole; email configured only if Staging Resend set  
- [ ] Login with **Staging** user (Production password must fail)  
- [ ] Business resolution / switcher (single test tenant)  
- [ ] Calendar, Customers, Booking, Payments, invoices, refunds, Reports, notifications  
- [ ] Public `/book/{test-slug}`  
- [ ] Confirm **Production** GVM booking still on Production URL  

### Do not

- Copy GVM  
- Create Chasum HQ  
- Apply 034–036  
- Start Phase 6.3  

---

## U. Exact rollback checklist

If Preview cutover fails:

- [ ] Restore **Preview-only** Vercel env to previous Production Supabase URL/keys  
- [ ] Redeploy Preview  
- [ ] **Never** change Production env to Staging  
- [ ] Staging SQL can remain; it is unused until the next attempt  
- [ ] Do not delete Production data  
- [ ] Do not “fix” by copying Production into Staging  

---

## V. PO decisions required

1. Approve **replay `001`–`033`** on empty Staging (Option A).  
2. Approve **schema-only Production dump for diff** (no data) — yes/no.  
3. Staging Auth: confirm-email on or off.  
4. Preview `NEXT_PUBLIC_APP_URL`: Preview host vs keep Production URL (Auth Site URL must still be Preview).  
5. Dedicated Resend (and optional Twilio/Stripe test) for Preview.  
6. Local `.env.local` may point at Staging after init — confirm.  
7. When to **connect** Preview (only after T pre-cutover).  
8. First Staging tenant name/slug (**GVM Test**, not live GVM clone).  
9. When 034/035 may be Staging-tested (after cutover).  
10. Platform Admin emails on Staging (`PLATFORM_OWNER_EMAILS` can stay the same emails; Auth users are different).

---

## W. Whether Staging is ready to be initialized

**CONDITIONAL**

Empty project exists and is the right region. Initialization is **not** started. Ready **after** PO accepts Option A, Auth plan, and no-data-copy rule — still a **future** operator action, not this task.

---

## X. Exact blockers before initialization

1. PO written approval to run SQL on **Staging only**.  
2. Operator access to Staging SQL (dashboard or CLI linked **only** to Staging).  
3. Confirmation auto-expose / Data API will show `public` tables after replay.  
4. Plan for `ALTER TYPE` if Staging Postgres version &lt; 15.  
5. Auth/SMTP/template plan (can follow schema, but Preview must not connect before Auth Site URL is Preview).  
6. Separate integration secrets ready **before** Preview cutover (schema init can precede secrets).  

---

## Y. Whether Preview should be connected yet

**NO**

Preview still correctly (for now) uses Production Supabase until Staging schema + Auth exist. Connecting an empty Staging project would take the World Class Preview **offline** for GVM-shaped testing without a reconstructed schema.

---

## Z–AD. Locks

| | |
|--|--|
| **Z** | DB impact from **this** discovery = **NONE** |
| **AA** | Production impact = **NONE** |
| **AB** | Chasum HQ tenant = **NOT CREATED** |
| **AC** | Phase 6.3 implementation = **NOT STARTED** |
| **AD** | Phase 6.4 = **NOT STARTED** |

---

## AE–AI. Git / Preview

| | |
|--|--|
| **AE Files** | This discovery document + stamps + lock test |
| **AF Documentation commit** | this commit |
| **AG Branch tip** | this commit |
| **AH Push** | recorded in the chat closeout |
| **AI Preview** | https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app |

---

*End of Environment Separation discovery. Do not initialize Staging. Do not connect Vercel. Do not apply migrations. Do not copy Production data. Do not create Chasum HQ. Stop for Product Owner review.*
