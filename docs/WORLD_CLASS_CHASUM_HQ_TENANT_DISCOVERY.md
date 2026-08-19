# World Class — Chasum HQ tenant discovery (internal pilot)

**Program:** Chasum World Class Program  
**Mode:** Discovery / forensic audit **only**  
**Branch:** `cursor/world-class-portal-foundation`  
**Branch tip at discovery start:** `3807e42`  
**Production:** locked — `https://chasum.vercel.app` (`4eecbec`)  
**Preview:** `https://chasum-git-cursor-world-class-portal-fo-5c653e-renovisionappcom.vercel.app`  
**Database:** Preview ↔ Production **share Supabase**  
**Migrations 034 / 035 / 036:** remain **unapplied**  
**Chasum HQ tenant creation:** **NOT PERFORMED**  
**Phase 6.3 implementation:** **NOT STARTED**  
**Phase 6.4:** **NOT STARTED**  
**Product code changed:** **NONE**  
**DB impact:** **NONE**  
**Production impact:** **NONE**

Do **not** treat this document as permission to create the tenant or to implement product code.

---

## Naming lock (read first)

| Name | What it is | What it is not |
|------|------------|----------------|
| **Chasum HQ (this discovery)** | A **normal product tenant** (`businesses` row) used by Chasum to operate Chasum: CRM, demos, onboarding calls, support sessions | Not Microsoft 365. Not a special-case schema. Not Platform Admin. |
| **Existing `/dashboard/hq` + `/owner`** | **Platform Admin / Control Centre** for the SaaS (`requirePlatformOwner`, `platform_admins`, `PLATFORM_OWNER_EMAILS`) | Not the Chasum HQ business tenant. Today the product **misnames** this surface “HQ”. |
| **GVM Baby World** | External service-business pilot tenant | Must not be mutated to “become” Chasum HQ |

Architectural rule: **no** `if business === "Chasum"`, **no** owner-email bypasses, **no** hard-coded unlimited plan. If HQ needs a capability, it belongs in the **normal** product (or a **generic** tenant class such as customer / internal / test).

Existing platform UI docs: [`HQ_ARCHITECTURE.md`](./HQ_ARCHITECTURE.md) — that file describes **Platform Admin**, not this tenant.

---

## Launch pilot model (strategy)

1. **GVM Baby World** — real service-business pilot  
2. **Chasum HQ** — real internal SaaS-operations tenant (same architecture as customers)  
3. Stabilize both through daily use  
4. Then controlled external onboarding  

---

## A. Current tenant architecture

Canonical tenant = row in `businesses`. Almost every operating table has `business_id` → `businesses(id)` ON DELETE CASCADE (appointments restrict on service/staff/customer).

**Ownership keys (two layers):**

1. **Primary owner:** `businesses.owner_id` → `auth.users`. Unique index `businesses_one_per_owner_idx` (**one primary business per auth user** — migration `007`).
2. **Co-owner membership:** `business_members` (migration `032`) — `role in ('owner','admin')`, unique `(business_id, user_id)`. Writes are **service-role only**.

`is_business_owner(bid)` (SECURITY DEFINER): `owner_id = auth.uid()` **OR** member with owner/admin role.

**Do not confuse with** `memberships` (migration `020`) — that is a **customer membership product catalog**, not team access.

### Tenant isolation matrix

| Table / entity | Tenant key | Ownership key | Access check | RLS or app | Risks |
|----------------|------------|---------------|--------------|------------|-------|
| `businesses` | `id` | `owner_id` + `business_members` | `is_business_owner(id)` for manage | **RLS** manage; **public SELECT `using (true)` still exists** (`001`) | **HIGH** — any client can list tenant rows (name, slug, settings columns exposed by SELECT *) |
| `business_members` | `business_id` | `user_id` | Own row or owner | RLS select; writes service-role | Cannot self-join a second tenant from the UI |
| `locations` / hours / settings | `business_id` / via location | owner | `is_business_owner` | RLS (public location SELECT dropped in `010`) | App also filters `business_id`; cookie validated against tenant |
| `services`, `staff`, `staff_services` | `business_id` | owner | owner manage | RLS; **public SELECT active services/staff** (`001`) | Catalog leakage by design for public booking |
| `customers` | `business_id` | owner | owner | RLS; public customer SELECT **dropped** (`003`) | Unique `(business_id, email)` — person-centric |
| `appointments` | `business_id` | owner | owner | RLS; public appt SELECT **dropped**; public via SECURITY DEFINER RPC | `staff_id` still **NOT NULL** (034 unapplied) |
| Commerce: invoices, receipts, transactions, refunds | `business_id` | owner | `is_business_owner` | RLS (`028`+) | App loaders also `.eq("business_id")` |
| `notification_logs`, comms, follow-ups | `business_id` | owner | owner | RLS | |
| `business_hours`, holidays, availability | `business_id` | owner | owner | RLS; some public hours (`001`/`002`) | Needed for public booking |
| Settings columns | on `businesses` | owner | owner update | RLS | Public SELECT may expose policies/email |
| Plan | `businesses.subscription_plan_key` → `subscription_plans` | owner | owner | RLS + `can_add_location` RPC | Staff limits **not** server-enforced |
| SaaS billing | `billing_invoices`, `subscription_events`, Stripe ids on `businesses` | owner | `is_business_owner` (`033`) | RLS | Mock provider; not commerce ledger |
| Onboarding | implicit: first dashboard hit | `getOrCreateBusiness` | auth | **App + RPC** | Auto-creates tenant — see B |
| `platform_admins` | none (platform) | env/DB allowlist | `requirePlatformOwner` | **No client RLS policies**; service-role | Platform Admin, not tenant |
| Owner/`/dashboard/hq` metrics | **all** `businesses` / `appointments` | platform owner | app gate | **Service role bypasses RLS** | HQ tenant appointments would pollute “bookings 7d” / business counts |

Dashboard loaders additionally scope with `getOrCreateBusiness()` then `.eq("business_id", business.id)`. Cookie `chasum_location_scope` is **not** a tenant key; `setLocationScope` verifies the location belongs to the resolved business.

---

## B. Business creation architecture

**Happy path today**

1. `signUp` (`lib/actions/auth.ts`) → `auth.users` + optional `user_metadata.preferred_plan` / `full_name`. Confirmation email from **Supabase Auth** (not a business notification).
2. First authenticated `/dashboard` layout calls `getOrCreateBusiness()`.
3. Resolver: Private Alpha membership → any `business_members` owner/admin → `businesses.owner_id` (`maybeSingle`).
4. If none: RPC `ensure_business_for_owner(name, slug)`:
   - INSERT `businesses` (`owner_id`, `name`, `slug`) — defaults: timezone **`America/New_York`**, currency **`usd`**, plan **`starter`**, `subscription_status` **`active`**
   - INSERT `business_hours` Mon–Fri 09:00–17:00
   - `create_default_location` named `{name} — Main` (no address required)
5. App may set `appointment_interval_minutes = 15` only if `isPlaceholderBusiness`.
6. App may copy `preferred_plan` → `subscription_plan_key`.

**No** automatic: staff row, services, Stripe customer, commerce invoices, GVM data, welcome email from Chasum templates.

| Step | Classification |
|------|----------------|
| Signup | **SAFE** (auth only) |
| Auto tenant on first dashboard | **PARTIAL** — works; defaults NY/USD; placeholder name |
| Owner assignment | **SAFE** (`owner_id` = auth.uid) |
| Default location | **SAFE** — logical name, address nullable |
| Timezone / currency / type | **PARTIAL** — must be edited after create (HQ wants Toronto/CAD/Software) |
| Plan | **PARTIAL** — starter unless metadata; Private Alpha flag separate |
| Subscription / Stripe | **MISSING** live; mock billing exists |
| Employees | **MISSING** until `ensureOwnerAsBookableStaff` or hub |
| Services | **MISSING** until created |
| Notifications | **PARTIAL** — columns default on; no send on create |
| Booking | **PARTIAL** — public mode defaults; onboarding wants a bookable staff + service |
| Second business for same user | **BROKEN / SPECIAL-CASE** — unique `owner_id`; resolver returns the **existing** tenant (would return **GVM**, not create HQ) |
| Hard-coded Chasum tenant | **MISSING** (correct — do not add) |

**A new business can be created through normal UI only for an auth user who does not already own or co-own a business.** Creating HQ while the operator already owns GVM **cannot** use this path.

---

## C. User → business membership architecture

```
auth.users
  ├── businesses.owner_id     (exactly one, unique index)
  └── business_members.user_id  (many rows possible in schema)
         └── businesses (co-owner)
staff.user_id                 (not used for login — “later”)
```

Employee `staff` rows are **operational**, not authenticated users. RBAC permissions are stored on `staff` and **not enforced on dashboard login** (`hasPermission` comment: “Owner always passes; staff permissions checked when multi-staff login ships”).

`business_members` roles: `owner` | `admin` only — not sales/support.

---

## D. Multi-business switching truth

| Capability | Status |
|------------|--------|
| Multiple `business_members` rows per user | Schema **allows** |
| Resolver picks **one** tenant | Deterministic: first Private Alpha, else earliest membership, else primary owned |
| Business selector UI | **MISSING** |
| Persisted selected business | **MISSING** (no cookie/session tenant id) |
| Login redirect | Always `/dashboard` → that one resolved tenant |
| Server actions / loaders | `getOrCreateBusiness()` — single tenant |
| Calendar / payments / reports / settings | Same single resolved `business.id` |

If the founder needs GVM **and** Chasum HQ, the product **cannot switch tenants today**. `getOrCreateBusiness` would keep landing on GVM (or whichever membership sorts first).

---

## E. Inherited multi-business-selection test failure

**File:** `tests/unit/marketing/multi-business-selection.test.ts`  
**Assertion:** `fields.find((f) => f.id === "business")` → `discovered === true`  
**Current code:** `buildUnderstandingFields` (`lib/marketing/meet-summer-intelligence.ts`) emits `id: "industry"` and `id: "businessType"`, **not** `id: "business"`.

**Classification:** **Test-only / marketing Meet Summer copy.** Not tenant isolation. Not RLS. Do **not** treat as a blocker for HQ creation. Do **not** fix in this discovery.

---

## F–G. Tenant isolation / RLS findings

Authenticated **customer-tenant** data (customers, appointments, payments, invoices, staff management, settings updates, notifications) is scoped by `is_business_owner` **and** app `business_id` filters. A user of Business A should **not** mutate Business B operational data through dashboard actions, given current resolver + RLS.

| Finding | Rating |
|---------|--------|
| `businesses` public SELECT `using (true)` — catalog/settings leakage | **HIGH** |
| Public SELECT active services/staff | **MEDIUM** (intentional for `/book/[slug]`) |
| Platform Owner `/owner` + `/dashboard/hq` service-role reads **all** tenants | **HIGH** if mistaken for “HQ tenant”; expected for Platform Admin — **must stay gated** |
| Location cookie forged to another tenant’s UUID | **LOW** — `setLocationScope` checks `business_id`; mutations use resolved business |
| UI-only plan gates (Payments, Summer, staff count) | **MEDIUM** entitlement honesty, not cross-tenant |
| SECURITY DEFINER public booking RPCs | **MEDIUM** — must stay slug/business_id scoped (existing) |
| `getOrCreateBusiness` creating a tenant on first visit | **HIGH** operational risk on shared DB, not cross-read |
| Staff RBAC unenforced | **MEDIUM** (same-tenant over-privilege once multi-login exists) |
| No evidence dashboard loaders omit `business_id` in favor of cookie-only tenant | — |

**Critical cross-tenant risks before HQ create (shared DB):**

1. Creating a public slug `chasum` would expose `/book/chasum` on **Production and Preview** immediately.  
2. Platform Admin appointment counts would mix GVM + HQ.  
3. Using the GVM owner login would **not** create HQ — it would **open GVM**.

No repair in this task.

---

## H. Chasum HQ business-type fit

Proposed tenant: name **Chasum**, workspace **Chasum HQ**, type Software/SaaS, CAD, America/Toronto, owner = Chasum owner account.

| Use | Fit |
|-----|-----|
| CRM people (contacts, notes, timeline, crm_status including `lead`) | **IMPLEMENTED** (person-centric) |
| Leads / prospects / subscribed businesses as **organizations** | **MISSING** — would require **general** CRM companies (not Chasum-only) |
| Appointments: demo, onboarding, training, CS, support | **IMPLEMENTED** as Services + Appointments if staff + location exist |
| Team directory | **PARTIAL** — `staff` + titles; roles are salon/clinic-shaped |
| Communications | **IMPLEMENTED** (email confirmations/reminders); SMS plan-gated |
| Customer history | **IMPLEMENTED** per person |
| Summer as HQ AI manager | **PARTIAL** — exists; plan gate not fully enforced; not SaaS-CRM aware |
| Service-business assumptions | Hours, bookable staff, location required, appointment staff required, onboarding “add a service”, payment surfaces always present |
| Fake SaaS MRR inside this tenant | **Must not** — that is Platform Admin |

---

## I. CRM organization vs person gap

Current `customers`: person fields, unique email per tenant, tags, notes, `crm_status` lead/active/vip, assigned staff, timeline via appointments/comms/commerce.

**Not supported:** organization records, people ↔ company, multiple contacts per company, primary contact, title/role on a company, company-level appointments.

Workaround (abuse): one customer named “ABC Salon Inc.” + notes listing Jane — **not** recommended; breaks email uniqueness and history.

This is a **future general CRM capability** (B2B / family / pet-guardian adjacent), not a Chasum-only feature.

---

## J. Location model fit

Every tenant is forced to have a default location (`create_default_location`). Address fields are **nullable**. Name can be `Chasum HQ` or `Virtual / Online`. Timezone copied from business.

| Surface | Physical address required? |
|---------|----------------------------|
| Calendar / booking / employees / services | Location **id** required; address not |
| Taxes | Business/location tax config — not street |
| Email templates | May show location name; empty address OK |
| Reports / payments | Location scope cookie |
| Customer-facing booking | Location picker; one virtual site is fine |
| `getLocationScope` | Throws if **zero** locations — default create prevents that |

**SAFE** to use a logical location. Do not invent a second location system. Optional later: `metadata.kind = virtual` (generic).

---

## K. Services / appointments fit

| Need | Today |
|------|--------|
| Free ($0) service | **Allowed** (`price` default 0) |
| Zero tax | **Allowed** if no tax rate / 0 bps |
| Virtual | Location name only; no video product |
| Assigned team member | **Required** (`appointments.staff_id` NOT NULL; 034 unapplied) |
| Schedule + email confirm | **IMPLEMENTED** |
| Customer history | **IMPLEMENTED** |
| Forced paid commerce | Collect hidden when collectible remaining $0 (6.2B). Payments nav still visible. Invoice not auto-created. |

Use `public_booking_mode = staff_only` so HQ demos are not a public booking site.

---

## L. Team / RBAC fit

| Role wanted | Current | Class |
|-------------|---------|--------|
| Owner | `staff.role_key` owner + `businesses.owner_id` | **IMPLEMENTED** (auth) |
| Admin | staff + `business_members.admin` | **PARTIAL** |
| Sales / CS / Support / Operations / Engineer / Finance | title text only | **MISSING** as roles |
| Permission matrix | Stored, **not enforced** on login | **UNSAFE** for a SaaS ops team sharing one login; **PARTIAL** as catalog |

Do not implement RBAC here. Chapter 8 (Employees) is the general place.

---

## M–N. Subscription billing vs customer commerce

**Separation is architectural policy and is already documented in the money engine.** Do **not** merge.

| | Customer commerce | Chasum SaaS billing |
|--|-------------------|---------------------|
| Tables | `commerce_transactions`, `commerce_invoices`, `commerce_receipts`, `commerce_refunds` | `subscription_plans`, `businesses.subscription_*` / Stripe ids, `billing_invoices`, `subscription_events` |
| Meaning | GVM (or HQ) charging **its** customers | Chasum charging **tenant businesses** |
| Stripe | Manual tenders / future 6.4 for **customer** pay | `getBillingProvider()` is **MockBillingProvider**; live Stripe “Coming Next” |
| HQ tenant using commerce | Optional $0 demos; do not book Chasum SaaS invoices here | HQ’s own Chasum plan belongs on `businesses.subscription_plan_key` |

---

## O. Plan / entitlement truth

Catalog: Free=`starter`, Professional, Business, Enterprise. Location cap via `can_add_location` (Private Alpha → **unlimited**). Staff cap **marketing-only**. Payments / invoicing / Summer / reports **not** server-enforced vs Free. SMS + email branding **are** gated. Business location marketing 6 vs DB 10 — known conflict.

**HQ should use the generic mechanisms already in the product:**

- Assign `subscription_plan_key` (e.g. `professional` or `business`) via the same billing fields customers will use, **or**
- Set `private_alpha_enabled` (design-partner override — **not** name-based) if billed plan should stay Free while features unlock.

**Do not** recommend unlimited because the business is named Chasum.

If internal/test tenants must be excluded from SaaS MRR, add a **generic** `businesses.account_class` (or similar): `customer` \| `internal` \| `test` — Platform Admin metrics filter on that. **Schema = PO + future migration; do not apply now.**

---

## P. Platform Admin boundary

Already exists, misnamed HQ:

- `/owner/*` — businesses, subscriptions, trials, security, support placeholder  
- `/dashboard/hq` — executive seed + live tenant counts  
- `/dashboard/hq/private-alpha` — design-partner ops seed  
- Auth: `PLATFORM_OWNER_EMAILS` + `platform_admins`

**Future Platform Admin (not this tenant):** tenants, owners, plans, trials, entitlements, health, usage, billing failures, MRR/ARR, churn, support access, security, audited impersonation.

**Do not build Platform Admin in a HQ-tenant workstream.** **Do not** put pipeline/MRR inside the Chasum HQ **business** calendar.

---

## Q. Support-access future architecture

**Missing:** impersonation, time-limited grants, read-only support mode, owner-approved access, support audit trail.

**Must not:** add Chasum employees as ordinary `staff` / `business_members` of every customer tenant.

That belongs to **Platform Admin**, with service-role + audit log, never to the HQ CRM.

Today’s founder `/owner` service-role overview is **not** a substitute (too broad, not per-ticket, not customer-approved).

---

## R. Creation transaction map (do not execute)

If a **new auth user** with no business hit `/dashboard`:

| Step | Table | Record | Side effect | Email? | Billing? | GVM risk | Rollback |
|------|-------|--------|-------------|--------|----------|----------|----------|
| 1 | `auth.users` | User | Session | Auth confirm (signup) | No | None | Delete auth user (ops) |
| 2 | `businesses` | Tenant | Unique slug; public row | No | Plan starter / preferred_plan | **None** if different `owner_id` | DELETE business CASCADE (dangerous on shared prod) |
| 3 | `business_hours` | 7 rows | — | No | No | None | Cascade |
| 4 | `locations` + settings + hours | Default “{name} — Main” | `/book/{slug}` exists | No | Counts toward location quota | None | Cascade |
| 5 | Optional interval update | businesses / location_settings | Placeholder only | No | No | Skipped if named | Update |
| 6 | Optional plan key | businesses | Feature gates | No | Mock only | None | Update |
| 7 | Later: staff/services/appts | staff, services, appointments | Confirmations **would** email | **Yes** on first real booking comms | Commerce if paid | None if isolated owner | Harder |

If **GVM owner** hits create:

| Step | Result |
|------|--------|
| `ensure_business_for_owner` / resolver | **Returns GVM** — **no new row** |
| Unique `owner_id` | Blocks a second owned business |

SQL insert of a second `owner_id` duplicate → unique violation. Direct Supabase as service-role **could** violate product invariants and would still be **live on Production**.

---

## S. Safest future tenant creation method

**Preference:** same architecture customers use — **signup / first dashboard** — **after** prerequisites (section AD).

**Not safest now:** SQL, seed scripts, or service-role inserts on the shared Production database.

**Also not:** “admin script that special-cases Chasum.”

**When multi-business exists:** create HQ as a second `businesses` row + `business_members` for the operator, with a **tenant switcher**, without dropping data from GVM.

Until then, HQ creation requires a **dedicated auth user** as `owner_id` **or** a schema change to allow multiple owned businesses (PO + migration — **stop, do not apply**).

---

## T–W. Minimum viable Chasum HQ pilot

**Ready now** (as a normal tenant, after safe create): CRM people + notes/timeline; Services (`Product Demo`, `Onboarding Session`, …) at $0; Appointments assigned to bookable staff; Email confirmations; Team as `staff`; Command Centre / Reception / Calendar; `staff_only` public booking; communications log.

**Needs small generalization:** timezone/currency at create; `account_class` for metrics; tenant switcher; CRM company/contacts; virtual location metadata; role catalog labels (sales/support) without fake RBAC; rename Platform Admin away from “HQ”.

**Future World Class phase:** org CRM; multi-business membership UX; staff login RBAC; Platform Admin support impersonation; live SaaS Stripe; Summer HQ playbooks; aging/collections (6.3); online customer pay (6.4).

**Not appropriate for HQ tenant:** SaaS MRR dashboards, tenant billing failures, impersonation, mixing GVM ultrasound commerce into HQ, hard-coded entitlements.

---

## X. External customer graduation criteria (not perfection)

**GVM:** booking reliability; location truth; staff scheduling; payment/refund/invoice integrity (6.2B accepted); customer/business/staff comms; reporting that matches Payments; daily Reception use.

**Chasum HQ:** lead/contact management (person-level at least); demo + onboarding + CS calls on the calendar; team actually using it; follow-up via real comms logs; no accidental public booking; no metric pollution into Platform Admin.

**Rule:** do not sell a workflow neither pilot can operate (e.g. B2B company CRM, staff RBAC, self-serve SaaS billing, payment links).

---

## Y. PO decisions required

1. Rename existing `/dashboard/hq` to Platform Admin / Control Centre vs keep the label and call the tenant something else (e.g. “Chasum Operations”).  
2. How can one operator use GVM **and** HQ? Dedicated auth user vs multi-business membership (schema + switcher).  
3. Isolated Preview database vs accept shared-DB tenant visible on Production.  
4. Generic `account_class` (or equivalent) before HQ exists, so metrics stay clean.  
5. HQ billed plan vs `private_alpha_enabled` (no name bypass).  
6. Public booking mode default for internal tenants.  
7. Whether org/company CRM is in scope before external B2B sales.  
8. Who is `owner_id` for HQ (must not steal GVM).  
9. Slug (`chasum` vs `chasum-hq`) knowing `/book/{slug}` is production-visible.  
10. Support impersonation timeline (Platform Admin chapter, not HQ tenant).

---

## Z. Required DB/schema changes (recommendation only — **not applied**)

| Change | Needed to *create* HQ as second tenant for GVM owner? | Apply now? |
|--------|------------------------------------------------------|------------|
| Relax/replace `businesses_one_per_owner_idx` + switcher | **Yes**, if same user owns both | **NO** |
| `businesses.account_class` | For metric separation | **NO** — app filter can wait; cleaner with column |
| Unique indexes 034–036 / commerce RPCs | Unrelated | **NO** |
| Company/contact tables | For true B2B CRM | **NO** |
| Impersonation tables | Platform Admin | **NO** |

---

## AA. What can remain app-only

- Naming/docs split HQ tenant vs Platform Admin  
- Post-create settings: timezone Toronto, currency CAD, `business_type`, `public_booking_mode=staff_only`, $0 services  
- Using `private_alpha_enabled` or plan_key already on `businesses`  
- Person-level CRM for pilot contacts  
- $0 appointment workflows  

---

## AB. Risks before creating Chasum HQ

- Shared Supabase → Production sees the tenant immediately  
- Unique owner → GVM owner cannot own HQ  
- No tenant switcher → wrong workspace  
- Public `/book/chasum`  
- Auth/business emails once appointments exist  
- Platform Admin KPIs mix HQ + GVM  
- Accidental `getOrCreateBusiness` side effects  
- Naming collision with `/dashboard/hq`  
- Treating HQ commerce as Chasum MRR  

---

## AC. Can Chasum HQ be created NOW?

**NO** as an immediate create. After Tenant Safety + Multi-Business Foundation ([`WORLD_CLASS_TENANT_SAFETY_FOUNDATION.md`](./WORLD_CLASS_TENANT_SAFETY_FOUNDATION.md)): **CONDITIONAL**.

App-level switcher/resolver exist. Remaining blockers: public `businesses` SELECT, shared Preview/Production DB, owner uniqueness vs membership attach, Platform Admin metric mixing, no `account_class`. **Tenant was not created.**

---

## AD. Exact prerequisites before creation

1. PO accepts this discovery and the naming split.  
2. Decide Preview DB isolation **or** explicitly accept Production visibility.  
3. Decide owner identity so **GVM is not reused or overwritten**.  
4. Ship or explicitly waive **multi-business switcher** if one human must operate both.  
5. Set create-time timezone/currency/type/booking mode (app settings OK).  
6. Prefer generic internal-account flag before trusting Platform Admin KPIs.  
7. Do **not** apply 034–036 for this.  
8. Do **not** start Phase 6.3/6.4 as a side effect.  
9. First bookings use staff-only + $0 services; confirm notification recipients.  
10. Rollback plan agreed (shared DB deletes are production-risk).

---

## AE–AI. Task lock

| | |
|--|--|
| **AE** | DB impact from this discovery = **NONE** |
| **AF** | Production impact = **NONE** |
| **AG** | Chasum HQ tenant creation = **NOT PERFORMED** |
| **AH** | Phase 6.3 implementation = **NOT STARTED** |
| **AI** | Phase 6.4 = **NOT STARTED** |

---

*End of discovery. No product code. No tenant. No migrations.*
