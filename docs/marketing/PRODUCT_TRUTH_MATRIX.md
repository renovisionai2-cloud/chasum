# Product Truth Matrix

**Status:** Canonical marketing claim reference — Private Alpha  
**Last reviewed:** 2026-08-22  
**Rule:** If a capability cannot be verified in code, do not market it as Available Today.

Status vocabulary (only):

| Label | Meaning |
| --- | --- |
| **Available Today** | Stable enough for design partners now |
| **Early Access** | Real and usable; still evolving with partners |
| **Coming Next** | Actively planned or being built; not usable today |
| **Future Vision** | Long-term direction; no delivery promise |

---

## Capability matrix

| Capability | Status | Evidence | Config / limits | Approved public wording |
| --- | --- | --- | --- | --- |
| Calendar & booking | Available Today | `lib/booking-engine/*`, Reception calendar | Supabase | Manage appointments and availability from Reception |
| Public booking | Available Today | `app/book/[slug]`, `lib/actions/public-booking.ts` | Public/invite mode | Online booking uses real availability—never invented slots |
| Reception | Available Today | `/dashboard/calendar`, Day View + Booking Sheet | Owner-centric today | Front-desk workflow for the operating day |
| CRM | Available Today | `lib/crm/*`, `/dashboard/clients` | Owner CRM access until staff login | Customer profiles, notes, and history in one place |
| Customer timelines | Available Today | `components/crm/customer-timeline.tsx` | Depends on recorded events | Activity stays connected to the customer record |
| Employees & staff mgmt | Available Today | `lib/employees/*`, `/dashboard/employees` | **Active staff only (`staff.is_active`):** Free 1 / Professional 3 / Business+ unlimited; server-enforced on create and reactivation; inactive/former rows preserved and do not occupy a seat; existing over-limit actives grandfathered. `employment_status` is descriptive HR copy and does **not** control seats. | Configure employees, roles catalog, schedules |
| Multi-location | Available Today | `lib/actions/location.ts`, plan quotas | Free 1 / Professional 3 / Business **6** / Enterprise unlimited (app catalog; live DB Business seed still **10** — **DB 10 → 6 alignment deferred**) | Support one or many locations per plan |
| Email confirmations/reminders | Available Today* | Resend + job queue | `RESEND_API_KEY`, `EMAIL_FROM` | *When messaging is configured |
| SMS | Early Access | Twilio provider + plan gate | `TWILIO_*`, Professional+ | SMS when enabled for the plan and provider |
| Manual payments | Available Today | `lib/commerce/providers/manual.ts` | — | Record cash, e-transfer, offline card, store credit |
| Deposits (manual) | Available Today | Commerce deposit kinds + service fields | — | Record deposits against appointments |
| Card deposits / Stripe Elements | Coming Next | Roadmap + incomplete Elements path | Stripe keys | Card collection in Booking Sheet — Coming Next |
| Gift certificates | Available Today | Business hub gift cards | Operator UX; portal UX limited | Create and redeem gift certificates in Business |
| Invoices | Early Access | `lib/commerce/invoices.ts` | — | Operator invoices from appointments (evolving) |
| Receipts | Early Access | `lib/commerce/receipts.ts` | Resend for email | Receipts from recorded transactions |
| Commerce ledger | Early Access | `lib/commerce/*`, Payments dashboard | Manual-first | One financial record for supported payment types |
| Revenue reports | Available Today | `/dashboard/reports`, `lib/reports/*` | Uses recorded data | Appointments, revenue, and activity reports |
| Google Calendar | Available Today* | OAuth adapter + sync jobs | `GOOGLE_CLIENT_*` | Optional external busy assist; Chasum remains source of truth |
| Microsoft/Outlook | Available Today* | Outlook OAuth adapter | `MICROSOFT_CLIENT_*` | Optional external busy assist |
| Apple Calendar | Available Today (ICS) | ICS feed route; no OAuth bi-di | Feed token | Subscribe via ICS—not full two-way sync like Google/Outlook |
| Stripe SaaS checkout | Coming Next | Mock billing provider | — | Public self-serve billing not available |
| API & webhooks | Available Today* | `/api/v1/*`, outbound webhooks | API keys; Business plan marketed | Developer API and outbound webhooks when enabled |
| Waitlist | Available Today | Waitlist tables + Reception UI | Messaging for notify | Waitlist when enabled on the business |
| Team invitations / RBAC login | Coming Next | Roles catalog exists; invites not enforced | — | Multi-staff login Coming Next |
| Summer (website) | Early Access | Website Concierge / Meet Summer | No OpenAI required for grounded path | Summer — Chasum’s AI Business Manager (website concierge & product guide; AI Receptionist is one capability) |
| Summer (in-app) | Early Access | `/dashboard/ai-workforce/summer`, `lib/summer` | Optional OpenAI | AI Business Manager — reception/booking assistance grounded in configured business data |
| Chase | Early Access | `/dashboard/workforce/chase`, `lib/chase` | Supabase data | Read-only operational insights and summaries |
| AI scheduling (Alex) | Coming Next | Roster placeholder | — | AI Scheduling — Coming Next |
| AI marketing (Maya) | Future Vision | Roster / marketing only | — | Marketing Intelligence — Future Vision |
| Business advisor (Leo) | Future Vision | Marketing only | — | Business Advisor — Future Vision |
| Customer success AI (Sophia) | Future Vision | Marketing only | — | Customer Success AI — Future Vision |
| Voice receptionist | Coming Soon | Explicit FAQ/roadmap | — | AI Phone Calls — Coming Soon (not Business Calls & Texting) |
| Service packages | Available Today | Hub packages + booking `package_id` | Redemption depth still evolving | Prepaid service packages |
| Memberships | Coming Soon | Hub catalog CRUD + Preview / Coming Soon notice | Catalog preview/configuration only; recurring billing, redemption, and booking integration are **not** operational | Recurring memberships — Coming Soon |
| Inventory Management | Coming Soon | Reports placeholder only | Not an operational workflow | Inventory — Coming Soon |
| Native mobile apps | Future Vision | Roadmap only | — | Web product today |
| Marketplace / franchise | Future Vision | Roadmap only | — | Not available |

\* Configuration-dependent: operational only when providers and environment are set.

---

## Explicit non-claims

- Chasum is **not** an electronic medical record (EMR).
- Chasum does **not** autonomously run the business.
- Summer is **not** only an “AI receptionist.” She is Chasum’s **AI Business Manager**; AI Receptionist is one capability within that role.
- Chase does **not** invent KPIs or write back operational changes.
- Apple Calendar is **not** claimed as full OAuth parity with Google/Outlook.
- Do not publish invented testimonials, logos, or customer counts.

## Unresolved questions

1. Portal gift-card UX vs operator gift cards — keep operator Available Today; avoid portal “live gift store” claims.
2. Depth of API plan gating vs marketing Business feature list — label API as Available Today for Business when keys exist; avoid “unlimited automation.”
3. sales@chasum.app monitoring — prefer `/contact` walkthrough path; mailto remains fallback until ops confirms mailbox.
4. **PRODUCT OWNER DECISION REQUIRED — SAAS SUBSCRIPTION CURRENCY.** Public plan prices remain `$79` / `$149` without USD or CAD until locked. Tenant operational currency (e.g. Chasum HQ = CAD) is separate.
