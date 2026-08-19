# World Class — Tenant Safety + Multi-Business Foundation

**Program:** Chasum World Class Program  
**Gate:** Tenant Safety + Multi-Business Foundation (discovery + **safe app-only implementation**)  
**Branch:** `cursor/world-class-portal-foundation`  
**Production:** locked — `https://chasum.vercel.app` (`4eecbec`)  
**Preview:** `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app`  
**Database:** Preview ↔ Production **share Supabase**  
**Migrations 034 / 035 / 036:** remain **unapplied**  
**Chasum HQ tenant creation:** **NOT PERFORMED**  
**Phase 6.3 implementation:** **NOT STARTED**  
**Phase 6.4:** **NOT STARTED**  
**DB / schema / RPC / RLS:** **not changed**

Canonical prior discovery: [`WORLD_CLASS_CHASUM_HQ_TENANT_DISCOVERY.md`](./WORLD_CLASS_CHASUM_HQ_TENANT_DISCOVERY.md).

---

## Naming lock

| Name | Meaning |
|------|---------|
| **Chasum HQ** | A **normal** `businesses` row (not created). CRM, demos, onboarding. No name/owner bypasses. |
| **Platform Admin / Control Centre** | `/dashboard/hq` + `/owner`. `requirePlatformOwner`. **Not** the HQ tenant. UI labels now say Platform Admin; routes unchanged. |
| **GVM Baby World** | Service-business pilot. Not mutated. |

SaaS subscriptions (`subscription_plan_key`, `billing_invoices`) stay separate from `commerce_*`.

---

## A. Security findings (ranked)

### CRITICAL

| ID | Finding | Why | App-only? |
|----|---------|-----|-----------|
| C1 | `businesses` policy `"Public can view businesses"` `USING (true)` (migration `001`) | Anon **and** authenticated clients can `SELECT` every business row. `select *` exposes every column the client asks for (name, slug, settings, plan, email, etc. as later columns were added). | **No.** Narrowing this is an RLS/schema change. Do not mask with UI filtering. |

### HIGH

| ID | Finding | Why | App-only? |
|----|---------|-----|-----------|
| H1 | Public `SELECT` on **active** `services` and **active** `staff` (`001`) | Any client can list catalog rows for **all** tenants, not only the slug being booked. Intentional for public booking, but it is cross-tenant catalog leakage. | **No** to fix at RLS. Public booking depends on catalog reads. Safer shape is slug-scoped RPC or public view — PO/DB. |
| H2 | Authenticated multi-membership + `is_business_owner` | A user who is owner/admin of two tenants can RLS-`SELECT` operational rows for **both**. Dashboard isolation is therefore **app `business_id` filter + resolver**, not RLS-alone. | Resolver + `.eq("business_id")` is app-only and **required**. It does not replace C1. |
| H3 | Stale `chasum_location_scope` cookie | A location UUID from tenant A used as a filter after switching to tenant B yields empty results (if loaders also filter `business_id`) or wrong-location UX. Before this gate, `getLocationScope` trusted the cookie UUID. | **Yes — implemented:** validate against current tenant locations; reset on switch. |
| H4 | Implicit first-business resolver (pre-this-gate) | `resolveBusinessForUser` / `ensure_business_for_owner` preferred Private Alpha membership then first membership then `owner_id`. A second authorized tenant was unreachable in the dashboard. | **Yes — implemented:** authorized list + cookie + `pickActiveBusiness`. RPC unchanged. |
| H5 | Platform Admin metrics count **all** businesses / appointments via service role | Future Chasum HQ commerce/appointments would inflate tenant counts, MRR proxies, and bookings-7d. Name-based exclusion is **forbidden**. | App-side exclusion by name: **unsafe**. Generic `account_class`: PO/schema. |

### MEDIUM

| ID | Finding | Notes |
|----|---------|-------|
| M1 | Public `business_hours` / some availability / holidays policies remain for booking | Needed for public booking; not PII. |
| M2 | `business_members` writes are **service-role only** | Operators cannot self-join a second tenant from the product UI. Attaching a user to HQ later is an ops/DB write. |
| M3 | Unique index `businesses_one_per_owner_idx` (`007`) | One **primary** `owner_id` per auth user. Second tenant cannot use the same `owner_id`. |
| M4 | Staff login RBAC stored, not enforced on dashboard | `staff` = workforce, not login identity. `business_members` = authenticated operator access. Full staff RBAC deferred. |
| M5 | `/dashboard/hq` and `/owner` use `createServiceClient()` after `requirePlatformOwner` | Correct for control plane. Must **not** spread into tenant product loaders. **Not changed.** |

### LOW

| ID | Finding |
|----|---------|
| L1 | Historical seed/roadmap strings still say “Chasum HQ Founder OS” inside Platform Admin seed data. |
| L2 | Routes `/dashboard/hq` and `/owner` keep legacy paths (staged rename later). |
| L3 | Inherited marketing unit test `tests/unit/marketing/multi-business-selection.test.ts` (`id: "business"` vs `industry` / `businessType`) — **not** tenant isolation; not fixed here. |

### Entity isolation matrix (re-audit)

Tenant key is `business_id` unless noted. “Owner” = `is_business_owner` (primary `owner_id` **or** `business_members` owner/admin).

| Entity | Tenant key | SELECT | INSERT/UPDATE/DELETE | App filter | Service-role |
|--------|------------|--------|----------------------|------------|--------------|
| `businesses` | `id` | **Public `USING (true)`** + owners manage | Owners manage (`033` uses `is_business_owner`) | Dashboard uses authorized resolver; **must not** treat public SELECT as authorization | Platform Admin overview |
| `business_members` | `business_id` | Own row or owner | Service-role only | Resolver reads memberships | Ops attach members |
| `customers` | `business_id` | Owner (public SELECT **dropped** `003`) | Owner | `getOrCreateBusiness` + `.eq` | Public booking RPCs |
| `appointments` | `business_id` | Owner (public SELECT **dropped** `003`) | Owner | Resolver + `.eq` | Public booking RPCs |
| `staff` / employees | `business_id` | Owner manage; **public active staff** | Owner | Resolver + `.eq` | No extra in product path |
| `locations` | `business_id` | Owner (`010` dropped public SELECT) | Owner | Resolver + `.eq`; cookie validated | Public location RPCs |
| `services` | `business_id` | Owner manage; **public active services** | Owner | Resolver + `.eq` | Public booking |
| `commerce_transactions` / invoices / receipts / refunds | `business_id` | Owner (`028`) | Owner | Resolver + `.eq` | Refund email lookup (existing) |
| Reports / BI | `business_id` | Owner | Owner | `getReportsBundle` → resolver | No |
| Business settings | columns on `businesses` + settings tables | See businesses SELECT **C1** | Owner | Resolver | No |
| `notification_logs` | `business_id` | Owner (`004`) | Owner insert | Resolver; retry uses resolver | Service-role policy exists for jobs |
| Platform Admin metrics | **none** (all tenants) | N/A | N/A | `requirePlatformOwner` | **Yes — bypasses RLS** |

---

## B. `businesses` SELECT policy analysis

| Question | Answer |
|----------|--------|
| Which policy? | `"Public can view businesses"` in `supabase/migrations/001_booking_engine.sql`. Never dropped. `033` replaced **manage** only. |
| Which columns? | Policy is table-wide. Whatever the client `select`s is readable, including later-added settings/plan/email columns. |
| Anon can read all businesses? | **Yes.** |
| Authenticated can read all businesses? | **Yes** (OR with owner manage). |
| Required for public booking? | **Slug lookup is required.** `getBusinessBySlug` → `/book/[slug]` and `lib/actions/public-booking.ts`. Full-table `USING (true)` is **stronger than slug lookup**. |
| Can lookup be narrowed? | **Yes, but only via RLS/view/RPC** (e.g. `SELECT` where `slug = requested` or a public metadata view). **PO/DB gate.** |
| Public vs private data? | Should be separated: public metadata (name, slug, timezone, booking-facing) vs private (email, plan, internal settings). **Not done** — needs schema/RLS. |
| Correcting it? | **Requires RLS/schema/RPC. Not applied.** |

App-only rule implemented: a client-supplied `business_id` is **never** treated as authorized just because `SELECT` succeeded.

Public booking still uses `getBusinessBySlug` (unauthenticated). Dashboard must not use slug lookup to activate a tenant.

---

## C. RLS changes required (PO / database gate — not applied)

1. Replace `"Public can view businesses" USING (true)` with slug-scoped SELECT and/or a public metadata view.  
2. Optionally narrow public active `services` / `staff` to the business being booked (RPC already used for locations).  
3. Do **not** relax RLS to make the switcher work.  
4. Do **not** apply 034 / 035 / 036 for this gate.

---

## D. App-only isolation improvements (this gate)

1. Canonical **authorized-business list** from `owner_id` rows ∪ `business_members` owner/admin.  
2. Canonical **active-business resolver** (`pickActiveBusiness` + cookie).  
3. HttpOnly cookie `chasum_active_business`.  
4. `setActiveBusinessAction` rejects unauthorized ids.  
5. Location cookie reset/validation on switch and on read.  
6. Dashboard loaders already calling `getOrCreateBusiness()` now inherit the selected tenant.  
7. Platform Admin **UI labels** (routes unchanged).  
8. Switcher only when `authorized.length > 1` — no fake tenants.

**Not done (would be masking C1):** hiding businesses in the UI while RLS still allows `SELECT *`.

---

## E. Canonical active-business contract

**Client-provided `business_id` is never trusted by itself.**

| Question | Rule |
|----------|------|
| List of businesses | `listAuthorizedBusinesses()`: `businesses.owner_id = user` ∪ `business_members` where `user_id` and `role in (owner, admin)`. |
| Selection | Cookie if that id is in the list; else Private Alpha membership (historical); else earliest authorized. |
| Persistence | HttpOnly cookie `chasum_active_business` (same options as location cookie). Not a security boundary. |
| Server components | `getOrCreateBusiness()` (React `cache` per request). Layout calls it **before** listing authorized so first-run create is visible. |
| Server actions | Same `getOrCreateBusiness()` / `listAuthorizedBusinesses()`. Switch action does **not** trust the posted id without `isAuthorizedBusinessId`. |
| API routes | Unchanged; tenant product APIs already use server auth. Do not add client business id as sole scope. |
| Background jobs | Continue to use stored `business_id` on the job/notification row. Switcher does not rewrite those rows. |
| Location | Child of active business. See § I. |
| Access revoked | Cookie id missing from list → fallback. |
| Business deleted | Same fallback. |
| Exactly one business | No switcher; resolver returns that tenant. Create path unchanged when list is empty. |
| Multiple businesses | Switcher + cookie. |
| First onboarding | Empty authorized set → existing `ensure_business_for_owner` RPC (placeholder interval / preferred plan unchanged). RPC itself is **not** modified. |
| Platform Admin users | Still a **normal** tenant operator in `/dashboard`. They do **not** get every customer tenant in the switcher. Control plane remains `/dashboard/hq` + `/owner` via `requirePlatformOwner`. |

One resolver: `getOrCreateBusiness` / `getBusiness` / `listAuthorizedBusinesses` in `lib/actions/business.ts` + pure helpers in `lib/tenancy/*`.

---

## F. Authorized-business list design

`mergeAuthorizedBusinesses({ owned, memberships })`:

- Primary `owner_id` wins if the same id also appears as a member.  
- Membership-only tenants (HQ later, if a different `owner_id` is used) appear with access `owner` or `admin`.  
- Sort: `sortAt` then id.  
- Roles other than owner/admin are ignored (staff table remains workforce).

---

## G. Persisted selection design

| Item | Value |
|------|--------|
| Cookie | `chasum_active_business` |
| Flags | `httpOnly`, `path=/`, `sameSite=lax`, 1 year |
| Write | Only `setActiveBusinessAction` after authorization |
| Invalid cookie | Ignored; deterministic fallback; not rewritten until next switch |
| Security | Cookie is a preference. Authorization is the membership/owner set. |

---

## H. Business switcher design

- Placement: dashboard **header**, beside location switcher (`DashboardTopNav`). Existing `Select`.  
- Visible only when the user has **more than one** authorized business.  
- Current tenant is the select value.  
- Switch → `setActiveBusinessAction` → cookie + location reset → `revalidatePath("/dashboard", "layout")` → `router.refresh()`.  
- Unauthorized id → error, no cookie write.  
- Mobile: same header control (not hidden on small screens). Accessible `aria-label="Switch business"`.  
- No invented tenants.

---

## I. Location reset behavior

`ACTIVE BUSINESS` → allowed locations → active location.

On switch:

1. Load active locations for the **new** business id (already authorized).  
2. Keep previous cookie only if it is still a location of that business, or `ALL` when the new tenant has >1 locations.  
3. Otherwise default location (or clear cookie).  
4. **Never** reuse another tenant’s location UUID.

On every dashboard read, `getLocationScope` uses `resolveLocationScopeForBusiness` so a leftover cookie cannot stay active.

---

## J. Owner vs `business_members` recommendation

**Do not change `businesses_one_per_owner_idx` without PO.**

**Recommended path for GVM + future Chasum HQ + later businesses (no schema now):**

| Tenant | Identity |
|--------|----------|
| GVM Baby World | Keep current `owner_id` = operator |
| Chasum HQ (future) | **Different canonical owner identity** (platform/ops user or dedicated HQ owner) **plus** the human operator on `business_members` as `owner`/`admin` |
| Further tenants | Same membership pattern **or** later PO decision to allow multiple `owner_id` rows |

**Tradeoffs**

| Option | Pros | Cons |
|--------|------|------|
| Membership on a second tenant (recommended) | Works with current unique owner index and `is_business_owner`; switcher now supports it | Membership insert is service-role; HQ still a real `businesses` row on shared DB |
| Relax one-owner-per-user unique index | One login can `owner_id` many tenants | Schema + RLS/RPC review; `ensure_business_for_owner` still “one owned row” semantics |
| Fake second login | Avoids unique index | Hides a product limitation; **not recommended** except explicit temporary pilot-only PO |

**RBAC (not built here):** `business_members` is sufficient for authenticated multi-business **operator** access. `staff` stays operational workforce. Do not add Chasum staff as employees of every customer tenant.

---

## K. Cross-surface audit

Core dashboard actions already call `getOrCreateBusiness()` then `.eq("business_id", business.id)`. After this gate they follow the **selected** authorized tenant.

| Surface | Risk after switch | Status |
|---------|-------------------|--------|
| Overview / Command Centre | First-membership | **Converged** via resolver |
| Reception / Calendar Day Week Month | Stale location | **Converged** + location reset |
| Customers / customer detail | First-membership | **Converged** |
| Booking / appointments | Wrong tenant create | **Converged** |
| Payments / invoices / receipts / refunds | Cross-tenant money | **Converged**; money formulas **unchanged** |
| Reports | Cross-tenant BI | **Converged** |
| Employees / locations / services / packages / business settings | First-membership | **Converged** |
| Communications / notification retry | Wrong branding | Retry uses resolver `business.id`; job rows keep stored `business_id` (switch does not mutate logs) |
| Summer / Chase | Resolver | **Converged** where they call `getOrCreateBusiness` |
| Platform Admin | All-tenant service role | **Unchanged by design** — not a tenant surface |
| Public `/book/[slug]` | Must stay slug-based | **Unchanged** (`getBusinessBySlug`) |

Remaining HIGH (not app-maskable): C1 public `businesses` SELECT; H1 public catalog SELECT; H5 metrics if HQ is created.

---

## L. Platform Admin naming recommendation

**UI label first, route later (implemented).**

| Surface | Before | After |
|---------|--------|--------|
| Nav | HQ | **Platform Admin** |
| Page title / metadata / workspace | Chasum HQ | **Platform Admin** |
| Command palette | Open Chasum HQ | **Open Platform Admin** |
| Routes | `/dashboard/hq`, `/owner` | **unchanged** |

Staged route rename (`/dashboard/platform-admin`) later — would break bookmarks. Documented in [`HQ_ARCHITECTURE.md`](./HQ_ARCHITECTURE.md).

---

## M. Metric contamination findings

`getOwnerOverviewMetrics()` / `countRecentAppointments()` use **service role** and count **all** `businesses` / recent `appointments`. No `account_class`.

| Metric | Discriminates internal vs customer? |
|--------|-------------------------------------|
| Tenant / active / trial / plan / MRR/ARR / churn / signups | **No** |
| Location / staff counts (owner health) | **No** (all tenants) |
| Bookings 7d on Platform Admin snapshot | **No** (all appointments) |

**Temporary app-side exclusion:** only safe with a **generic** stored class, not `name === "Chasum"`. **Do not add `account_class` in this phase.** Creating HQ **before** that flag (or an accepted KPI waiver) will pollute SaaS metrics.

---

## Implementation split

### A. Safe app-only (done)

Resolver, cookie, switcher, location reset, Platform Admin labels, unit tests.

### B. DB/RLS/RPC requiring PO (not done)

C1 public businesses SELECT; optional public catalog narrowing; `account_class`; relax owner uniqueness; membership insert tooling; 034–036; any RPC change including `ensure_business_for_owner`.

### C. Deferred World Class

Full staff login RBAC; impersonation; route rename; org CRM; Phase 6.3 / 6.4; HQ tenant creation.

---

## N. Files changed

See git commits. Feature: `lib/tenancy/*`, `lib/actions/business.ts`, `lib/actions/tenancy.ts`, `lib/actions/location.ts`, dashboard shell/header/switcher, Platform Admin labels, unit tests. Docs: this file and stamps.

---

## O. Tests added/changed

- `tests/unit/tenancy/authorize.test.ts`  
- `tests/unit/tenancy/location-reset.test.ts`  
- `tests/unit/tenancy/resolver-contract.test.ts`  
- `tests/unit/dashboard/portal-nav.test.ts` (Platform Admin title)

**RLS live integration tests:** not run. Shared Production database. Limitation documented.

---

## P–S. Verification (this gate)

| Check | Result |
|-------|--------|
| Targeted tenancy + nav tests | Pass |
| Full `vitest run` | 748 passed; **1 inherited fail** `tests/unit/marketing/multi-business-selection.test.ts` (Meet Summer field `id: "business"` — not this work) |
| `tsc --noEmit` | Pass |
| eslint on touched app files | Pass |
| `next build` | Pass |

---

## T. DB impact

**NONE.** No migration applied. No RLS/schema/RPC change. No tenant rows created.

---

## U. Production impact

**None intentional.** Preview and Production share the database; this commit is **app-only** on the World Class Preview branch. Production alias remains `4eecbec`. Cookie is ignored by Production until this code is deployed there (it is not).

---

## V. GVM impact

**No GVM record writes.** Single-business GVM login: no switcher, same resolver fallback as a one-tenant operator. Public GVM booking slug path unchanged.

---

## W. Chasum HQ tenant created?

**NO.**

---

## X. Chasum HQ readiness

**CONDITIONAL.**

App-level switching exists. HQ still must **not** be created until PO accepts the remaining blockers.

### Blockers

1. **C1** public `businesses` SELECT still open.  
2. Shared Preview/Production DB — creating HQ is a **Production-visible** tenant.  
3. Owner strategy: unique `owner_id` vs membership attach (service-role write).  
4. **H5** metric contamination without `account_class` or an explicit KPI waiver.  
5. Public catalog SELECT (H1) still lists all active services/staff.  
6. Rollback of a created tenant on shared DB is a production-risk delete.  
7. HQ settings plan (CAD, America/Toronto, Virtual/Online or Chasum HQ location, staff-only booking, $0 services) is **defined** but **not applied** (no tenant).  
8. Live RLS was not integration-tested against Production.

### Criteria checklist

| Criterion | State |
|-----------|--------|
| Tenant isolation acceptable | **No** for C1; operational tables remain owner-scoped |
| Active-business resolver | **Yes** (app) |
| Switcher if needed | **Yes** (app; needs membership row for a second tenant) |
| Owner/member strategy | **Recommended, not executed** |
| Location context safe | **Yes** (app) |
| No GVM cross-tenant bleed | **App filters yes; RLS C1/H1 remain** |
| Platform Admin conceptually separate | **Yes** (labels) |
| Shared DB risk | **Explicitly unresolved** |
| Rollback procedure | Revert Preview app commits; cookies become inert. **Created tenant rows would still need a PO-approved delete.** |
| HQ settings plan | Documented; not created |

---

## Y. Remaining PO decisions

1. Accept Production-visible HQ tenant on shared Supabase **or** isolate Preview DB.  
2. Narrow `"Public can view businesses"`.  
3. Keep unique owner index **or** allow multiple `owner_id`.  
4. Canonical owner identity for HQ vs membership for the GVM operator.  
5. Add generic `account_class` (or waive KPI mixing).  
6. Whether public services/staff SELECT should be slug-scoped.  
7. When to rename `/dashboard/hq` routes.  
8. When to start Phase 6.3 implementation (still **not** this gate).

---

## Z. Remaining DB/schema/RPC blockers

- C1 businesses public SELECT  
- Optional public catalog narrowing  
- `account_class` (if chosen)  
- `businesses_one_per_owner_idx` (if multiple owned businesses chosen)  
- `ensure_business_for_owner` still ignores the active-business cookie (app no longer calls it when any authorized tenant exists)  
- Membership inserts remain service-role  
- Migrations 034 / 035 / 036 still unapplied (unrelated; do not use this gate to apply them)

---

## AA. Phase 6.3 implementation status

**NOT STARTED.**

---

## AB. Phase 6.4 status

**NOT STARTED.**

---

## AC–AG. Git / Preview

| | |
|--|--|
| **AC Feature commit** | `e6dc026e777c843d3a927829e841931c0cf977bd` |
| **AD Documentation commit** | this documentation commit |
| **AE Branch tip** | this documentation commit (after docs land) |
| **AF Push** | recorded in the chat closeout |
| **AG Preview** | https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app |

---

## Rollback (app-only)

1. Revert the feature commit on this branch (or pin Preview to previous SHA).  
2. Cookie `chasum_active_business` is then unused.  
3. No database rollback required for this gate.

---

## Future Chasum HQ settings plan (not applied)

- Currency: CAD  
- Timezone: America/Toronto  
- Location: Virtual/Online **or** “Chasum HQ”  
- Booking: staff-only initially  
- Services: $0 initial  

Do not create the tenant in this phase.

---

*End of Tenant Safety + Multi-Business Foundation report. Stop. Do not create Chasum HQ. Do not start Phase 6.3 implementation.*
