# World Class — Safe Tenant Onboarding Gate

**Program:** Chasum World Class Program  
**Gate:** Authenticated zero-business users must not auto-create a tenant  
**Status:** Implemented on Preview branch — **Chasum HQ not created**  
**Branch:** `cursor/world-class-portal-foundation`  
**Production:** locked — `https://chasum.vercel.app` (`4eecbec`)  
**Preview:** `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app`  
**Staging Supabase:** `wnfahklzaxirftyskctd`  
**Production Supabase:** `kxcydvhswkuzepwzzinq`  
**Migrations 034 / 035 / 036:** remain **unapplied**  
**Chasum HQ tenant creation:** **NOT PERFORMED**  
**Phase 6.3:** **NOT STARTED**

---

## A. Root cause

An authenticated user with zero businesses could reach `/dashboard`. The dashboard layout called `getOrCreateBusiness()`, which called `ensure_business_for_owner()` and created a tenant from Auth `full_name` / `name` or **"My Business"**, with a slug from that name or the email prefix.

Authentication therefore meant tenant creation. That is unsafe for:

- a confirmed or unconfirmed Staging operator with zero businesses
- Platform Admin identities that must not receive a normal tenant merely because they signed in
- first-tenant quality (placeholder names, NY/USD defaults applied silently)

## B. Architecture implemented

```
Auth user
  → may have zero businesses
  → if accessible businesses exist → /dashboard (existing resolver + switcher)
  → if Platform Admin and zero businesses → /dashboard/hq (no tenant created)
  → otherwise → /onboarding/business
       → user submits a business name
       → ensure_business_for_owner(p_name = entered name)
       → required location / hours / settings via existing RPC
       → preferred_plan metadata mapped (Free → starter)
       → /dashboard
```

Retrieval and mutation are separated:

| Function | Behavior |
|----------|----------|
| `getBusiness()` | Authorized tenant or `null`. No insert. |
| `userHasAccessibleBusiness()` | Middleware/callback SELECT only. |
| `getOrCreateBusiness()` | **Require** an existing tenant; redirect to onboarding if none. **Does not create.** Name kept for existing loaders. |
| `createInitialBusinessAction()` | Explicit submit only. |

No Chasum-HQ-specific path. No hardcoded operator emails. No Stripe/billing rows. No fake staff/services/customers.

## C. Files changed

See the git commit on this branch. Primary product files:

- `lib/actions/business.ts` — retrieval-only require path
- `lib/actions/create-initial-business.ts` — explicit create
- `lib/actions/auth.ts` — post-auth destination without create
- `lib/supabase/middleware.ts` — login/dashboard/onboarding routing
- `app/(dashboard)/layout.tsx` — `getBusiness()` + onboarding redirect
- `app/auth/callback/route.ts`, `app/auth/confirm/route.ts`
- `app/(onboarding)/onboarding/business/page.tsx`
- `components/onboarding/create-business-form.tsx`
- `components/marketing/onboarding-plan-select.tsx` — duplicate plan copy

## STOP

Do **not** confirm `operations@chasumai.com`.  
Do **not** create Chasum HQ in this gate.  
The Product Owner reviews Preview, then explicitly onboards the first Staging tenant through `/onboarding/business`.
