# World Class Plan Entitlement Matrix

**Chapter:** 0 — Audit Completion Addendum  
**Branch:** `cursor/world-class-portal-foundation`  
**Production baseline:** `4eecbec`  
**Claim source:** `lib/marketing/pricing.ts` (`PRICING_FEATURE_CATALOG`, `PRICING_PLANS`, FAQ)  
**Runtime:** `lib/billing/plan-features.ts`, `lib/billing/catalog.ts`, location RPC, SMS paths, email branding  
**Mode:** Evidence only — **no entitlement code or DB changes** in this addendum  

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
| Free | `starter` | 1 | 1 | 1 |
| Professional | `professional` | Up to 3 | Up to 3 | 3 |
| Business | `business` | Unlimited | **Up to 6** | **10** ← conflict |
| Enterprise | `enterprise` | Unlimited | Unlimited | null |

**OWNER DECISION (locked):** Marketing / plan promise = **six** Business locations. Catalog/DB still shows **10** — do **not** silently change DB in Chapter 1; propose alignment migration separately for PO.

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
| Staff = 1 | `staff_limit` | 1 | Employees open | Employees | Create staff | **None** | staff table | **Missing** | Untested | Untested | Partial | **None** | — | **Marketing-only / Not enforced** | Cap + prompt | High | 8,13 |
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
| Staff ≤ 3 | `staff_limit` | Up to 3 | Open | Employees | Create | **None** | Marketing-only | Cap + FAQ prompt | High | 8,13 |
| Locations ≤ 3 | `location_limit` | Up to 3 | Business | Hub | Add | **Yes** | Fully enforced | — | Low | 9 |

### Business inclusions

| Feature | Source | Promise | Nav | Page | Comp | Server | Status | Gap | Sev | Ch |
|---------|--------|---------|-----|------|------|--------|--------|-----|-----|-----|
| Unlimited staff | staff_limit | Unlimited | Open | Employees | — | N/A | Present directory; login Coming Next | Staff login | High | 8 |
| Locations ≤ 6 | location_limit | Up to 6 | Business | Hub | Add | Uses **DB 10** | **Conflicting** | 6 vs 10 | High | 9,13 |
| Advanced Analytics | `advanced_analytics` | Biz+ | Reports | Same UI | — | **None** | Marketing-only vs “basic” | Definition | Med | 10,13 |
| API & Integrations | `api_integrations` | Biz+ / Private Alpha | Developer Advanced (hidden when gated) | `/dashboard/developer` redirects if unauthorized | Keys | **Partial** — nav + page gate via `planAllowsApiIntegrations`; key-create server enforcement remaining | Partial | Server key ACL | Med | 9,13 |
| Inventory | `inventory` | Biz+ | Reports tab **hidden** (Coming Soon) | Placeholder code remains | Placeholder | **None** | **Hidden from UI** (Ch2 correction) | Product or delist | Crit | 10,13 |
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
| Location create | `lib/actions/location.ts` + `can_add_location` |
| Staff create | `lib/actions/staff.ts` — **no cap** |
| SMS | `lib/actions/communications.ts`, queue, booking-delivery, orchestrator |
| Email branding | `lib/communications/tenant-email-branding.ts` |
| Inventory placeholder | `lib/reports/compute.ts` `buildInventoryPlaceholder` |

---

## What is actually gated today

1. **SMS** — Fully enforced (plan + Alpha + Twilio).  
2. **Email remove-branding** — Server-enforced.  
3. **Location create quota** — Server-enforced against `subscription_plans.max_locations` (with Alpha unlimited bypass).  

Everything else marketed as plan-exclusive is **Not enforced** or **Marketing-only**, or **Conflicting**.

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
| Features with server enforcement | 3 families (SMS, branding, locations) |
| Critical entitlement gaps | Inventory claim; Online Payments depth; ungated Free Pro features |
| Owner decisions | Business 6 vs 10; whether to enforce staff; Inventory fate |
