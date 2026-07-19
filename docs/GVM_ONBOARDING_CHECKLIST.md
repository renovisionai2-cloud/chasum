# GVM Onboarding Checklist

**Official Chasum onboarding playbook**  
**Design Partner:** #001 — GVM Baby World  
**Audience:** Founder / Customer Success (internal)  
**Rule:** Prefer empty states over invented data. Configure the product as the customer would.

Companion: [`OPERATION_GVM_REPORT.md`](./OPERATION_GVM_REPORT.md) · [`GVM_GO_LIVE.md`](./GVM_GO_LIVE.md)

---

## How to use this playbook

1. Provision a **clean** Chasum account for GVM (no leftover Phase/test data).
2. Sit with the operator and walk **in order**.
3. Check each box only when the operator can do it without engineering help.
4. Do **not** run seed scripts that invent patients, services, or revenue.
5. Capture the public booking URL only after name + slug are human-readable.

---

## Phase A — Account & tenant bootstrap

| # | Step | Where | Done | Notes |
|---|------|-------|------|-------|
| A1 | Application received | `/apply` | ☐ | Does **not** create an account |
| A2 | Founder provisions login | Internal | ☐ | Invite email / create user manually |
| A3 | Operator signs in | `/login` | ☐ | Confirm email if required |
| A4 | First dashboard load | `/dashboard` | ☐ | Silent `getOrCreateBusiness()` runs |
| A5 | Confirm tenant exists | Location switcher | ☐ | Default is often “My Business — Main” |

**Exit criteria:** Operator can sign in and see Overview. Business name is still wrong until Phase B.

---

## Phase B — Business identity

| # | Step | Where | Done | Notes |
|---|------|-------|------|-------|
| B1 | Set business name to **GVM Baby World** | `/dashboard/business` → Profile | ☐ | Prefer Business hub as source of truth |
| B2 | Set legal name / industry / type | Business → Profile | ☐ | Industry: medical imaging / maternity |
| B3 | Set timezone & currency | Business → Profile | ☐ | Match clinic reality (e.g. America/Toronto) |
| B4 | Set phone, email, website | Business → Profile | ☐ | Used on booking page + invoices |
| B5 | Set **booking slug** to `gvm-baby-world` | Business → Profile **or** Settings | ☐ | Must be memorable; never leave email-prefix slug |
| B6 | Upload logo (+ cover optional) | Business → Branding | ☐ | Also appears on invoices/receipts |
| B7 | Brand colors / booking headline / CTA | Business → Branding | ☐ | Avoid default purple if GVM brand differs |
| B8 | Physical address | `/dashboard/settings` | ☐ | Currently richer address fields live here |

**Exit criteria:** Public page title reads “Book with GVM Baby World”. Slug is `/book/gvm-baby-world`.

---

## Phase C — Hours & locations

| # | Step | Where | Done | Notes |
|---|------|-------|------|-------|
| C1 | Confirm default location name | Business → Locations | ☐ | Rename “Main” if needed |
| C2 | Set location hours (incl. weekend if clinic open) | Business → Hours **or** Settings | ☐ | Default seed is Mon–Fri 9–5 |
| C3 | Add holidays / closures | Business → Hours / Settings | ☐ | As needed |
| C4 | Multi-location? | Business → Locations | ☐ | Only if plan allows |

**Exit criteria:** Staff day view shows open hours on real clinic days (including Saturday if applicable).

---

## Phase D — Catalog & people (hard gate for booking)

| # | Step | Where | Done | Notes |
|---|------|-------|------|-------|
| D1 | Create real services (ultrasound packages, etc.) | `/dashboard/services` | ☐ | No “P4 Service…” leftovers |
| D2 | Set duration, price, visibility Online | Services | ☐ | |
| D3 | Categories (optional) | Services → Categories | ☐ | |
| D4 | Add employees / providers | `/dashboard/employees` | ☐ | Owner is **not** auto-added as bookable staff |
| D5 | Assign employees to services | Service edit dialog | ☐ | Required for bookable offerings |
| D6 | Confirm staff working hours | Employee profile / hours | ☐ | Must align with location hours |

**Exit criteria:** `/book/{slug}` shows real service names (not “Online booking is not available yet”).

---

## Phase E — Booking rules & public page

| # | Step | Where | Done | Notes |
|---|------|-------|------|-------|
| E1 | Slot interval, notice, cancel window | Business → Booking | ☐ | |
| E2 | Public booking access mode | Settings → Public booking access | ☐ | Usually “public” for GVM |
| E3 | Copy booking URL | Settings → Public booking page | ☐ | Verify host matches production `APP_URL` |
| E4 | Open public page as patient | `/book/gvm-baby-world` | ☐ | Select service → staff → time → details |
| E5 | Confirm branding on public page | Public page | ☐ | Logo, name, colors |

**Exit criteria:** A test patient can complete a public booking end-to-end on a real open day.

---

## Phase F — Communications

| # | Step | Where | Done | Notes |
|---|------|-------|------|-------|
| F1 | Enable email confirmations / reminders | Business → Notifications | ☐ | Requires Resend in production |
| F2 | Quiet hours / marketing toggles | Business → Notifications | ☐ | |
| F3 | Verify confirmation email on test booking | Inbox + `/dashboard/notifications` | ☐ | |
| F4 | SMS (optional) | Env + toggles | ☐ | Skip if GVM is email-only |

**Exit criteria:** At least one confirmation email delivers for a real booking.

---

## Phase G — Commerce

| # | Step | Where | Done | Notes |
|---|------|-------|------|-------|
| G1 | Decide payment methods (cash / e-transfer / card) | `/dashboard/payments` | ☐ | Stripe may be unset — manual is OK for alpha |
| G2 | Create CRM customer | `/dashboard/clients` | ☐ | Email currently required |
| G3 | Book appointment (Reception or public) | `/dashboard/calendar` | ☐ | |
| G4 | Complete appointment | Booking Sheet | ☐ | |
| G5 | Record payment | Payments **or** CRM Billing | ☐ | Do **not** rely on Booking Sheet Collect payment (stub) |
| G6 | Generate invoice | Payments | ☐ | |
| G7 | Generate / email receipt | Payments / CRM | ☐ | |

**Exit criteria:** One completed visit with payment + invoice/receipt recorded.

---

## Phase H — AI Workforce

| # | Step | Where | Done | Notes |
|---|------|-------|------|-------|
| H1 | Enable Summer | Business → AI | ☐ | Defaults **off** |
| H2 | Write business knowledge (hours, policies, prices rules) | Business → AI | ☐ | Facts only — no invented medical claims |
| H3 | Set greeting / tone / escalation | Business → AI | ☐ | |
| H4 | Ask Summer real questions | `/dashboard/ai-workforce/summer` | ☐ | Hours, services, next availability, book |
| H5 | Enable Chase | Business → AI | ☐ | Defaults **off** |
| H6 | Review Chase ops dashboard | `/dashboard/workforce/chase` | ☐ | Read-only insights |

**Exit criteria:** Summer answers from GVM data only; Chase shows real (even if sparse) metrics.

---

## Phase I — Ops verification (day-one readiness)

| # | Step | Where | Done | Notes |
|---|------|-------|------|-------|
| I1 | Reschedule appointment | Reception / Summer | ☐ | |
| I2 | Cancel appointment | Reception / Summer / portal | ☐ | |
| I3 | Run Reports | `/dashboard/reports` | ☐ | Expect sparse data early — OK |
| I4 | Train front desk on Reception shortcuts | Reception | ☐ | Or hide power-user chrome until trained |
| I5 | Parallel-run vs Picktime (if migrating) | Ops | ☐ | See `GVM_GO_LIVE.md` |

**Exit criteria:** Staff can book, change, complete, and take payment without calling engineering.

---

## Recommended session agenda (90 minutes)

| Time | Focus |
|------|-------|
| 0–10 | Login + rename business + slug |
| 10–25 | Hours + logo + contact |
| 25–45 | Services + employees + assignment |
| 45–60 | Public booking dry-run |
| 60–75 | One CRM customer + appointment + payment |
| 75–90 | Summer enable + 5 real questions; Chase glance |

---

## Do not do during onboarding

- Do not run demo seeders that invent patients or “P4 Service” names.
- Do not promise Stripe card capture in Booking Sheet until it works.
- Do not leave dual edits in Settings **and** Business without agreeing which is canonical.
- Do not share a booking URL that still contains `prod-auth-…` or wrong host/port.

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| GVM operator | | | |
| Chasum founder / CS | | | |
