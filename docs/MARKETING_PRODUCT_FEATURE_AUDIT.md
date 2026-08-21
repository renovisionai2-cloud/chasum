# Marketing ↔ Product Feature Audit

**Status:** Post-deployment audit after marketing site promote to GVM testing URL  
**Deployed URL:** https://chasum.vercel.app  
**Source branch:** `cursor/phase-3-integrations`  
**Commit:** `1d368a8` (`1d368a827215d7285fdea834138d537548844a83`)  
**Deployment ID:** `dpl_H6JLmkWoKqbRuKu58baBEYXKzyeo`  
**Audit date:** 2026-07-30  
**Sources of truth:** Approved Pricing (`lib/marketing/pricing.ts`), Product Truth Matrix, Roadmap / Resources locks  

**Method notes**

- Marketing pages were HTTP + browser smoke-tested on production.
- Protected dashboard routes correctly redirect unauthenticated users to `/login` (307).
- **Authenticated GVM portal workflows were not executed in this session** (no design-partner credentials in the agent environment). Mark those rows **GVM test: Untested** until an operator confirms with a live GVM login.
- “Built” requires a real customer workflow—not merely a screen route.

---

## Legend

| Field | Values |
| --- | --- |
| Built status | Built / Partial / Not Built |
| Functional status | Working / Broken / Untested |
| Priority | Critical / High / Medium / Low |

---

## Feature matrix

| Feature | Marketing page(s) | Pricing plan | Exact marketing promise | Portal route | Main component / service | Built | Functional | Plan entitlement | Provider / config | GVM test | Known issues | Priority | Recommended next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Online Booking | Pricing, Platform, Product Tour, Roadmap | Free+ | Customers book online from real availability | `/book/[slug]`, Reception | `lib/booking-engine/*`, `lib/actions/public-booking.ts` | Built | Untested | Included Free+ | Supabase | Untested | — | High | GVM: create public booking end-to-end |
| Calendar & Scheduling | Pricing, Home, Roadmap | Free+ | Manage appointments & staff schedules | `/dashboard/calendar` | Reception Day View + Booking Sheet | Built | Untested | Included Free+ | Supabase | Untested | Owner-centric; staff login Coming Next | High | GVM: open calendar, create/edit appointment |
| Email Confirmations & Reminders | Pricing, Roadmap | Free+ | Email confirmations/reminders | Jobs / messaging | Resend + job queue | Partial | Untested | Free+ | `RESEND_API_KEY`, `EMAIL_FROM` | Untested | Production Vercel env list showed Supabase keys only—Resend may be missing | Critical | Confirm Resend env on production; send test confirmation |
| Basic Customer Management (CRM) | Pricing, Roadmap | Free+ | Customer profiles, notes, history | `/dashboard/clients` | `lib/crm/*` | Built | Untested | Free+ | Supabase | Untested | — | High | GVM: open client list + record |
| Staff Members (limits) | Pricing | Free 1 / Pro 3 / Biz unlimited | Plan staff caps | `/dashboard/employees` | `lib/employees/*`, billing quotas | Partial | Untested | Soft limits in billing catalog | DB `max_*` | Untested | Staff login invites Coming Next; marketing vs enforcement gap | High | Verify quota enforcement UI + GVM staff count |
| Locations (limits) | Pricing | Free 1 / Pro 3 / Biz 6 / Ent unlimited | Plan location caps | Business / locations | `lib/actions/location.ts` | Partial | Untested | Catalog `maxLocations` | DB | Untested | **Mismatch:** marketing Business = 6 locations; billing fallback catalog = **10** | Critical | Align `FALLBACK_PLANS` / DB plans with Pricing (6) |
| Chasum Branding | Pricing | Free includes; Pro+ remove | Free shows branding; Pro removes | Public booking chrome | Branding flags | Partial | Untested | Pro+ `remove_branding` | App config | Untested | Confirm public booking footer behavior | Medium | Visual check Free vs Pro booking page |
| Remove Chasum Branding | Pricing | Professional+ | Remove Chasum branding | Settings / booking | Plan feature | Partial | Untested | Pro+ | — | Untested | — | Medium | Verify gated setting |
| SMS Reminders | Pricing, Roadmap (Available Today) | Professional+ | SMS reminders when configured | Communication / jobs | Twilio + `planIncludesSms` | Partial | Untested | Gated: Free blocked | `TWILIO_*` | Untested | Twilio may be absent from production Vercel env listing | Critical | Confirm Twilio production env; Free upgrade path |
| Business Calls & Texting | Pricing, Roadmap | Professional+ | Communication Center SMS/call activity; **not** Voice AI | `/dashboard/notifications` (comms) | Communications platform | Partial | Untested | Pro+ | Twilio | Untested | Voice AI must not appear as available | High | GVM: open Communication Center; verify Free blocked |
| Summer — AI Business Manager | Pricing, Meet Summer, Home | Professional+ | AI Business Manager (onboarding, questions, ops) | `/meet-summer`, `/dashboard/ai-workforce/summer` | Concierge + `lib/summer` | Partial | Working (marketing site) / Untested (in-app) | Pro+ marketed | Optional OpenAI | Untested (in-app) | Website Summer works without OpenAI on grounded path | High | GVM: open in-app Summer; confirm plan gate |
| Online Payments | Pricing, Roadmap | Professional+ | Accept payments/deposits | `/dashboard/payments` | `lib/commerce/*` (manual-first) | Partial | Untested | Pro+ marketed | Manual today; Stripe card Coming Next | Untested | Marketing “Online Payments” vs manual ledger — card Elements Coming Next | Critical | Document honest payment depth for GVM; test manual payment record |
| Gift Cards | Pricing, Roadmap | Professional+ | Sell/manage gift cards | Business hub gift cards | Commerce gift certificates | Partial | Untested | Pro+ | — | Untested | Operator UX Available Today; portal gift store limited | High | GVM: create + redeem gift certificate |
| Invoicing | Pricing (Pro+) | Professional+ | Invoicing | Payments / commerce | `lib/commerce/invoices.ts` | Partial | Untested | Pro+ | — | Untested | Early Access / evolving | Medium | GVM: create invoice from appointment |
| Basic Reporting | Pricing | Professional+ | Basic reporting | `/dashboard/reports` | `lib/reports/*` | Built | Untested | Pro+ | Recorded data | Untested | Soft-empty modules can look like $0 | High | GVM: open reports; confirm non-empty GVM data |
| Advanced Analytics | Pricing | Business+ | Advanced analytics | `/dashboard/reports` | Reports modules | Partial | Untested | Business+ | — | Untested | Depth vs “advanced” claim unclear | Medium | Define what “advanced” means vs basic |
| API & Integrations | Pricing | Business+ | API & integrations | `/dashboard/developer`, `/api/v1/*` | API keys + webhooks | Partial | Untested | Business+ | API keys | Untested | Available when enabled | Medium | Verify Business plan sees developer surface |
| Priority Support | Pricing | Business+ | Priority support | Process / contact | Ops | Not Built (product) | Untested | Partnership promise | — | Untested | Service commitment, not a portal feature | Low | Document as onboarding/process |
| Inventory Management | Pricing (Business), Roadmap Coming Soon | Business+ “where applicable” | Inventory where applicable | Reports inventory module? | Soft / incomplete | Not Built / Partial UI | Untested | Marketed Business | — | Untested | Product Truth: Coming Next / Future; soft-empty risk | Critical | Hide or clearly label “not available” in portal until built |
| Payroll | Roadmap Coming Soon; Employees fields | Not on Pricing cards as product | Roadmap: simplify payroll | `/dashboard/employees` fields | `payroll_notes` only | Not Built | Untested | N/A | — | Untested | Fields ≠ payroll product | High | Keep Roadmap Coming Soon; don’t surface as usable payroll |
| White-Glove / Success Manager / Custom Integrations / Enterprise Security / Custom Permissions / Volume Pricing | Pricing Enterprise | Enterprise | Partnership services | N/A / Owner HQ | Sales process | Not Built (in-app) | Untested | Enterprise | — | Untested | Correct as services, not self-serve | Low | Keep Contact Sales CTAs |
| Chase (ops insights) | Product / AI workforce | Early Access | Read-only insights | `/dashboard/workforce/chase` | `lib/chase` | Partial | Untested | Early Access | Supabase | Untested | — | Medium | GVM smoke open Chase |
| Voice / AI Phone Calls | Roadmap Coming Soon; Pricing FAQ | Not Available Today | Summer answers calls (future) | N/A | — | Not Built | Untested | Future | — | Untested | Must not appear live | High | Ensure no UI claims Voice live |
| Native Mobile Apps | Roadmap Coming Soon | Future | Manage from phone | N/A | — | Not Built | Untested | Future | — | Untested | — | Low | Keep Roadmap only |
| Stripe SaaS self-serve checkout | Pricing notes | All paid | Self-serve billing not open | Billing settings | Mock billing provider | Not Built | Untested | Apply / Demo CTAs | Stripe SaaS | Untested | Intentional Private Alpha | Medium | Keep Apply CTAs; don’t enable fake checkout |
| Team permissions / staff login | Pricing Enterprise custom permissions; employees | Partial | Roles / invites | Employees | Roles catalog | Partial | Untested | Invites Coming Next | — | Untested | Roles exist; invite enforcement incomplete | Critical | Do not market multi-staff login as complete |

---

## Pricing plan entitlement audit

Source: approved Pricing page + `lib/marketing/pricing.ts`. Runtime catalog: `lib/billing/catalog.ts` + DB subscription rows.

### Free (`starter` / `free`)

| Expectation | Runtime finding | Status |
| --- | --- | --- |
| Online booking, calendar, email reminders, basic CRM | Present in product | Aligns (GVM Untested) |
| 1 staff, 1 location | Catalog maxLocations=1 | Aligns |
| No SMS | `planIncludesSms` false for starter/free | Aligns |
| No Business Calls & Texting | Marketed unavailable | Verify UI hide/gate |
| No Summer | Marketed Free excludes Summer | Verify in-app gate |
| No Online Payments / Gift Cards | Marketed unavailable | Verify nav/actions gated |
| Chasum branding on | Marketed | Verify public booking |

### Professional

| Expectation | Runtime finding | Status |
| --- | --- | --- |
| Everything in Free + Summer, SMS, Business messaging, Payments, Gift Cards, reporting, remove branding | Marketed | Partial depth (payments manual; SMS needs Twilio) |
| Up to 3 staff / 3 locations | Catalog maxLocations=3 | Aligns |
| SMS gated on Free | Implemented in `plan-features.ts` | Aligns |

### Business

| Expectation | Runtime finding | Status |
| --- | --- | --- |
| Everything in Professional + unlimited staff, 6 locations, advanced analytics, API, priority support, inventory where applicable | Marketing 6 locations | **Gap:** fallback billing catalog `maxLocations: 10` |
| Inventory | Soft / not fully built | **Overclaim risk** if portal shows usable inventory |

### Enterprise

| Expectation | Runtime finding | Status |
| --- | --- | --- |
| Custom onboarding, success manager, security review, integrations, volume pricing | Partnership / sales | Aligns as services |
| Unlimited locations | Catalog `null` | Aligns |

### Upgrade / downgrade

| Expectation | Runtime finding | Status |
| --- | --- | --- |
| Upgrades unlock features | `subscription-service` change plan paths exist; public self-serve checkout not live | Private Alpha: founder-assisted |
| Downgrades preserve customer data | Should not delete CRM/appointments | Untested — verify before any plan change on GVM |
| Portal must not expose unavailable features as fully usable | Soft-empty modules historically risky | **High** — inventory/payroll/reports |

---

## Deployment safety confirmation

| Check | Result |
| --- | --- |
| Branch contains approved marketing locks | Yes — tip `1d368a8` |
| Unrelated untracked files excluded | Yes — brand PDF/scripts/`tmp` not committed |
| Migration files changed vs `origin/main` | **None** — no Supabase migration deploy required |
| Destructive migrations | **None run** |
| Production env | `NEXT_PUBLIC_SUPABASE_URL`, anon key, service role, `NEXT_PUBLIC_APP_URL` present |
| Email/SMS/Stripe in Vercel env listing | **Not listed** in `vercel env ls production` output (may still exist under other names or need confirmation) |
| Database reset | **Not performed** — Vercel app deploy only |

---

## First five product issues recommended for repair (by severity)

1. **Critical — Production messaging providers:** Confirm `RESEND_*` / Twilio (and Stripe if needed) are present on production; without them Email/SMS promises fail for GVM.  
2. **Critical — Business location limit mismatch:** Marketing “Up to 6 Locations” vs billing fallback `maxLocations: 10`.  
3. **Critical — Inventory overclaim:** Business Pricing includes Inventory “where applicable” while product is not fully built—gate or label clearly.  
4. **Critical — Team login / RBAC:** Roles catalog without enforced invites—do not treat multi-staff login as complete.  
5. **High — Payments honesty:** “Online Payments” is manual-first; card Elements Coming Next—ensure GVM UI doesn’t imply live card checkout.

---

## Operator follow-up (GVM authenticated smoke)

Please confirm with a GVM login on https://chasum.vercel.app:

1. Dashboard loads with existing appointments/customers.  
2. Calendar, Clients, Payments, Gift Cards, Messages, Employees, Services, Reports still show prior test data.  
3. Logout / password-reset links work.  
4. No empty “$0” modules that look like broken live data.

Update this document’s **GVM test** column after that pass.
