# World Class Plan Entitlement Matrix

**Chapter:** 0 — Audit Completion Addendum  
**Branch:** `cursor/world-class-portal-foundation`  
**Production baseline:** `4eecbec`  
**Claim source:** `lib/marketing/pricing.ts` (`PRICING_FEATURE_CATALOG`, `PRICING_PLANS`, FAQ)  
**Runtime:** `lib/billing/plan-features.ts`, `lib/billing/catalog.ts`, `lib/billing/plan-entitlements.ts`, `lib/billing/staff-quota.ts`, location RPC, SMS paths, email branding  
**Mode:** Chapter 0 addendum was evidence-only. Later World Class passes added **active-staff** and **application location** enforcement. **No Production/Staging SQL** in those passes. DB Business `max_locations` 10 → 6 remains **deferred**.  

---

## Enforcement legend

| Code | Meaning |
|------|---------|
| Marketing-only | Claimed on Pricing; no product gate |
| UI-only | Hidden/disabled control only — **not valid enforcement** |
| Server-enforced | Server/API/RPC blocks action |
| Fully enforced | UI + server aligned |
| Not enforced | Product usable contrary to plan claim |
| Conflicting | Sources disagree (marketing vs catalog/DB vs alpha) |
| Not testable w/o DB | Needs plan-row / RPC / shared-DB change to verify |

---

## Plan snapshot

| Plan | `planKey` | Staff claim | Locations claim | Catalog/DB `max_locations` |
|------|-----------|-------------|-----------------|----------------------------|
| Free | `starter` | **1 active** (server-enforced) | 1 | App 1 |
| Professional | `professional` | **Up to 3 active** (server-enforced) | Up to 3 | App 3 |
| Business | `business` | Unlimited **active** | **Up to 6** | App **6**; live DB seed still **10** — **DB 10 → 6 alignment deferred** |
| Enterprise | `enterprise` | Unlimited **active** | Unlimited | null |

**OWNER DECISION (locked):** Plan staff limits count **ACTIVE staff only** (`staff.is_active = true`). Inactive/former rows stay for history and do not occupy a seat. Creation and reactivation are both quota-guarded. Existing over-limit active rows are grandfathered (never auto-deleted or auto-deactivated). `employment_status` is a descriptive HR field and does **not** control entitlement seats. Do not auto-map employment status onto `is_active`.

**OWNER DECISION (locked):** Marketing / plan promise = **six** Business locations. Application catalog and `createLocation` now cap at **6**. **DB 10 → 6 alignment is deferred** to a future approved migration window. Do **not** apply `UPDATE subscription_plans SET max_locations = 6 WHERE plan_key = 'business'` and do **not** create a dedicated migration solely for this unless separately approved.

---

## Private Alpha override

| Behavior | Effect | Evidence |
|----------|--------|----------|
| `private_alpha_enabled` | Elevates SMS + branding helpers toward Professional | `plan-features.ts` |
| Billed key | May remain `starter` | comments / resolve |
| Locations | `can_add_location` **always true** (unlimited) | migration `032` RPC |
| Classification | **Conflicting** with “Professional clone” narrative | — |

---

## Feature × plan evidence matrix

Columns: Feature · Exact source · Visible promise · Nav visibility · Page access · Component access · Server/API · Data deps · Upgrade prompt · Downgrade · Existing data after downgrade · Mobile · Auto test · Manual · Status · Gap · Sev · Chapter

### Free foundations

| Feature | Source | Promise | Nav | Page | Comp | Server | Data | Upgrade | Downgrade | Post-down | Mobile | Auto | Manual | Status | Gap | Sev | Ch |
|---------|--------|---------|-----|------|------|--------|------|---------|-----------|-----------|--------|------|--------|--------|-----|-----|-----|
| Online booking | catalog `online_booking` | Free+ | Public book | `/book/[slug]` | Booking UI | Booking engine | Appointments | N/A | Untested | Untested | Partial | Partial | GVM | Present | — | Low | — |
| Calendar | `calendar` | Free+ | Yes Reception | `/dashboard/calendar` | Calendar | Engine | Appts | N/A | Untested | Untested | Partial | Partial | GVM | Present | — | Low | 3 |
| Email confirmations | `email_reminders` | Free+ | Soft | Notifications | Delivery | Resend queue | Jobs | Config | Untested | Untested | Partial | Partial | GVM | Config-dep | Config | Low | 7 |
| Basic CRM | `customer_management` | Free+ | Customers | `/dashboard/clients` | CRM | CRM actions | Customers | N/A | Untested | Untested | Partial | Partial | Partial | Present | — | Low | 4 |
| Chasum branding | `chasum_branding` | Free yes | Soft | Email | Branding | `planAllowsRemoveBranding` false | Email | — | Untested | Untested | — | — | — | **Server-enforced** | — | Low | 9 |
| Staff = 1 **active** | `staff_limit` | 1 active | Employees open | Employees | Create / reactivate | **`evaluateStaffSeatRequest` + `countBusinessStaff` (`is_active = true`) + `createStaff` / `ensureOwnerAsBookableStaff` / `updateStaff` / `updateEmployeeProfile` / `bulkUpdateEmployeeStatus`** | staff.is_active | Apply for Professional | Untested | Grandfathered actives; inactive rows preserved | Partial | Yes | Partial | **Server-enforced** (create + reactivate) | Inactive rows do not occupy a seat | Low | 8 |
| Locations = 1 | `location_limit` | 1 | Business | Hub | Add location | `can_add_location` | locations | Yes UI | Untested | Untested | Partial | Partial | Partial | **Fully enforced** (vs DB max) | — | Low | 9 |
| SMS | excluded | No | Compose blocked | Clients | Dialog | `planIncludesSms` | Twilio | Upgrade copy | Untested | Untested | Partial | Partial | — | **Fully enforced** | — | Low | 7 |
| Invoicing | excluded | No | Payments open | Commerce | Invoice UI | **None** | invoices | None | Untested | Untested | Partial | — | — | **Not enforced** | Free can use | High | 6,13 |
| Payments | excluded | No | Payments open | Payments | Ledger | **None** | payments | None | Untested | Untested | Partial | — | — | **Not enforced** | Free can use | High | 6,13 |
| Gift cards | excluded | No | Business | Hub | Gift UI | **None** | gift cards | None | Untested | Untested | Partial | — | — | **Not enforced** | Free can use | High | 11,13 |
| Summer | excluded | No | Intelligence | Summer | Chat | **None** | summer | None | Untested | Untested | Partial | — | — | **Not enforced** | Free can open | High | 12,13 |
| Basic reporting | excluded | No | Reports | Reports | Charts | **None** | reports | None | Untested | Untested | Partial | — | — | **Not enforced** | Free can open | Med | 10,13 |
| Remove branding | excluded | No | — | Email | — | Helper false | — | — | — | — | — | — | — | **Server-enforced** | — | Low | 9 |

### Professional inclusions

| Feature | Source | Promise | Nav | Page | Comp | Server | Status | Gap | Sev | Ch |
|---------|--------|---------|-----|------|------|--------|--------|-----|-----|-----|
| SMS Reminders | `sms_reminders` | Pro+ | Yes if allowed | Comms / booking | Compose | **Yes** | Fully enforced (+ Twilio) | Config | Med | 7 |
| Business Calls & Texting | `business_messaging` | Pro+ | Communications | Inbox | Soft | Soft / not PBX | **Marketing-only stretch** | Hosted telephony absent | High | 7,13 |
| Summer | `summer` | Pro+ | Yes | Summer | UI | **None** | Not enforced vs Free | Plan gate | High | 12,13 |
| Online Payments | `payments` | Pro+ | Yes | Payments | Ledger | **None** plan; commerce open | Not enforced + claim depth | Elements Coming Next | Crit | 6,13 |
| Gift Cards | `gift_cards` | Pro+ | Business | Hub | CRUD | **None** | Not enforced vs Free | Gate | Med | 11,13 |
| Invoicing | `invoicing` | Pro+ | Soft | Commerce | Invoice | **None** | Not enforced vs Free | Gate + EA depth | Med | 6,13 |
| Basic Reporting | `basic_reporting` | Pro+ | Yes | Reports | — | **None** | Not enforced vs Free | Gate | Med | 10,13 |
| Remove branding | `remove_branding` | Pro+ | Soft | Email | — | **Yes** | Server-enforced | Public surfaces? | Low | 9 |
| Staff ≤ 3 **active** | `staff_limit` | Up to 3 active | Open | Employees | Create / reactivate | **Yes** | **Server-enforced** | Cap + FAQ prompt | Low | 8 |
| Locations ≤ 3 | `location_limit` | Up to 3 | Business | Hub | Add | **Yes** | Fully enforced | — | Low | 9 |

### Business inclusions

| Feature | Source | Promise | Nav | Page | Comp | Server | Status | Gap | Sev | Ch |
|---------|--------|---------|-----|------|------|--------|--------|-----|-----|-----|
| Unlimited **active** staff | staff_limit | Unlimited active | Open | Employees | — | N/A | Present directory; login Coming Next | Staff login | High | 8 |
| Locations ≤ 6 | location_limit | Up to 6 | Business | Hub | Add | App catalog **6** (DB seed still 10) | **App-enforced 6** | **DB 10 → 6 deferred** | Low | 9 |
| Advanced Analytics | `advanced_analytics` | Biz+ | Reports | Same UI | — | **None** | Marketing-only vs “basic” | Definition | Med | 10,13 |
| API & Integrations | `api_integrations` | Biz+ / Private Alpha | Developer Advanced (hidden when gated) | `/dashboard/developer` redirects if unauthorized | Keys | **Partial** — nav + page gate via `planAllowsApiIntegrations`; key-create server enforcement remaining | Partial | Server key ACL | Med | 9,13 |
| Inventory | `inventory` | Coming Soon | Reports tab **hidden** | Placeholder | Placeholder | **None** | **Coming Soon** (Pricing aligned) | Do not implement this pass | Low | 10 |
| Priority Support | `priority_support` | Biz+ | — | — | — | Process | Marketing-only | Ops | Med | 13 |

### Enterprise partnership features

| Feature | Promise | Status | Gap | Sev | Ch |
|---------|---------|--------|-----|-----|-----|
| White-glove onboarding | Ent | Marketing-only / process | Ops | Med | 13 |
| Dedicated success manager | Ent | Marketing-only | Ops | Med | 13 |
| Custom integrations | Ent | Marketing-only / bespoke | Delivery | Med | 13 |
| Enterprise security | Ent | Partial product + process | Program definition | High | 13 |
| Custom permissions | Ent | Roles catalog; login Coming Next | RBAC | High | 8,13 |
| Volume pricing | Ent | Marketing-only | Sales | Low | 13 |
| Unlimited locations | Ent | Server null max | — | Low | 9 |

---

## Mechanisms map

| Mechanism | Path |
|-----------|------|
| Feature helpers | `lib/billing/plan-features.ts` |
| Catalog fallback | `lib/billing/catalog.ts` |
| Marketing claims | `lib/marketing/pricing.ts` |
| Staff create / reactivate | `lib/actions/staff.ts`, `lib/actions/employees.ts`, `lib/actions/onboarding.ts` — **active-only cap** via `lib/billing/staff-quota.ts` |
| Location create | `lib/actions/location.ts` + application catalog cap **6** (`can_add_location` may still return true) |
| SMS | `lib/actions/communications.ts`, queue, booking-delivery, orchestrator |
| Email branding | `lib/communications/tenant-email-branding.ts` |
| Inventory placeholder | `lib/reports/compute.ts` `buildInventoryPlaceholder` |

---

## What is actually gated today

1. **SMS** — Fully enforced (plan + Alpha + Twilio).  
2. **Email remove-branding** — Server-enforced.  
3. **Location create quota** — Application-enforced against canonical catalog (Free 1 / Professional 3 / Business **6** / Enterprise unlimited). Live DB Business `max_locations` remains **10**; **DB 10 → 6 alignment is deferred**. Private Alpha RPC `can_add_location` may still return true.  
4. **Active staff quota** — Server-enforced. Counts `staff.is_active = true` only (`employment_status` does not control seats). Free 1 / Professional 3 / Business and Enterprise unlimited. Create and inactive→active reactivation are both blocked at capacity, including multi-row bulk reactivation (atomic: all-or-nothing). Inactive historical rows are preserved and do not occupy a seat. Existing over-limit active rows are grandfathered.

Other marketed plan-exclusive capabilities remain **Not enforced** or **Marketing-only**, or **Conflicting**.

---

## Quality rule (entitlements)

- A hidden button is **not** enforcement.  
- New staff/location/money gates that need RPC/migrations are **Not testable without DB changes** on shared Supabase — require PO before Chapter implementation.  
- No entitlement changes in Chapter 0.

---

## Counts (Addendum)

| Metric | Count |
|--------|------:|
| Pricing feature IDs inventoried | 24 |
| Plans | 4 |
| Features with server enforcement | 4 families (SMS, branding, locations, **active staff**) |
| Critical entitlement gaps | Inventory claim; Online Payments depth; ungated Free Pro features |
| Owner decisions | **Staff = active only (locked)**; **Business locations app 6 / DB 10 deferred**; Inventory fate; SaaS currency |
