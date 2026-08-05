# Portal Route Inventory

**Program:** Chasum World Class Program — Chapter 1  
**Branch:** `cursor/world-class-portal-foundation`  
**Baseline commit:** `4eecbec0f0f04532ae0294132d07183b6e64f23f` (`phase-0-gvm-production-2026-08-04`)  
**Scope:** Authenticated tenant business portal (`/dashboard/*`). Customer magic-link portal (`/portal/[token]`) and platform Owner/HQ noted separately.  
**Mode:** Audit only — no implementation.

---

## Navigation source of truth

| Source | Path | Notes |
|--------|------|-------|
| Sidebar + mobile | `lib/constants.ts` → `DASHBOARD_NAV` | Rendered by `components/dashboard/sidebar.tsx` |
| Top header | `DashboardTopNav` in same sidebar file | Search shortcut, location switcher, notifications, theme, account badge |
| Command palette | `lib/command/registry.ts` + `components/command-palette/` | ⌘K / Ctrl+K |
| Shell | `components/dashboard/shell.tsx` | Sidebar + top nav + mobile drawer + command palette |
| Layout | `app/(dashboard)/layout.tsx` | Auth gate, locations, quota, HQ flag |

---

## Primary nav (as shipped)

| Label | Route | Maturity |
|-------|-------|----------|
| Overview | `/dashboard` | Partial — real stats + setup checklist |
| Reception | `/dashboard/calendar` | Strong for GVM assigned-employee day workflow |
| CRM | `/dashboard/clients` | Strong directory + profiles |
| Payments | `/dashboard/payments` | Strong ledger ops; invoices/receipts/refunds embedded |
| Services | `/dashboard/services` | Strong catalog |
| Business | `/dashboard/business` | Mega-hub (many tabs; IA smell) |
| Employees | `/dashboard/employees` | Strong directory + profiles |
| Reports | `/dashboard/reports` | Partial — soft-empty / inventory placeholder |
| AI Workforce | `/dashboard/ai-workforce` | Early Access / placeholders for some roles |
| Notifications | `/dashboard/notifications` | Partial — delivery inbox |
| Integrations | `/dashboard/integrations` | Partial — calendar sync |
| Automation | `/dashboard/automation` | Partial — recurring + waitlist |
| Developer | `/dashboard/developer` | Complete for API keys; **tenant-visible** (IA concern) |
| Settings | `/dashboard/settings` | Partial — overlaps Business hub |
| HQ | `/dashboard/hq` | Owner-only prepend |

---

## Full route inventory

### Overview

| Field | Detail |
|-------|--------|
| **Route** | `/dashboard` |
| **Page** | `app/(dashboard)/dashboard/page.tsx` → `components/dashboard/overview.tsx` |
| **Purpose** | Today snapshot, setup progress, quick links |
| **Primary user** | Owner / receptionist |
| **Maturity** | Partial |
| **Data** | Appointment/commerce aggregates + `lib/onboarding/setup-progress.ts` |
| **Actions** | Navigate to Reception, CRM, complete setup items |
| **States** | Loading via `dashboard/loading.tsx`; empty via setup checklist |
| **Responsive** | Grid cards; usable on mobile |
| **Concerns** | Not yet a true command centre; weak continuity into financial/comms outcomes |

### Reception / Calendar

| Field | Detail |
|-------|--------|
| **Route** | `/dashboard/calendar` (nav label **Reception**) |
| **Also** | `/dashboard/appointments` → redirect to calendar |
| **Components** | `ReceptionWorkspace`, `CalendarClient`, day-view, `BookingSheet`, `AppointmentDrawer`, `QuickAppointment`, waitlist panel |
| **Purpose** | Operate the day: book, inspect, edit, collect deposit, communicate |
| **Primary user** | Reception / owner |
| **Maturity** | Strong for Phase 0 GVM assigned-employee path |
| **Data** | Appointments, services, staff, locations, commerce, notifications |
| **Major surfaces** | BookingSheet (canonical edit), AppointmentDrawer (inspect), ReceptionPanel QuickAppointment (inline create) |
| **Concerns** | Three overlapping booking UIs; unassigned-employee path not production-ready; resources gated off |

### CRM

| Field | Detail |
|-------|--------|
| **Routes** | `/dashboard/clients`, `/dashboard/clients/[id]` |
| **Components** | `components/crm/*` |
| **Purpose** | Customer directory, profile, commerce panel, book from profile |
| **Maturity** | Strong |
| **Actions** | Create/edit customer, book, compose message (SMS gated), view invoices/receipts |
| **Legacy** | `components/customers/customers-manager.tsx` appears unused |
| **Concerns** | Terminology CRM vs Customers; commerce context split from Payments page |

### Payments / financial ops

| Field | Detail |
|-------|--------|
| **Route** | `/dashboard/payments` only |
| **Missing routes** | No `/invoices`, `/receipts`, `/refunds` |
| **Components** | `PaymentsDashboard`, plus BookingSheet payment sections, CRM `CustomerCommercePanel` |
| **Purpose** | Record payments, refunds, invoices; list activity |
| **Maturity** | Strong for manual POS / deposit workflows (Phase 0) |
| **Concerns** | Financial journey fragmented across Payments, CRM, Booking Sheet, drawer |

### Services

| Field | Detail |
|-------|--------|
| **Route** | `/dashboard/services` |
| **Also** | Business hub tabs for services/categories |
| **Maturity** | Strong |
| **Concerns** | Duplicated management surfaces (Services page vs Business tabs) |

### Business hub

| Field | Detail |
|-------|--------|
| **Route** | `/dashboard/business` |
| **Tabs** | Profile, Hours, Booking, Branding, Notifications, AI, Documents, Locations, Services, Categories, Rooms & resources, Memberships, Packages, Gift cards, Taxes, Discounts, Custom forms, Automation |
| **Maturity** | Partial — powerful but overloaded |
| **Concerns** | Settings vs Business duplication (TD-M1); packages/memberships/gift cards have no primary nav |

### Employees

| Field | Detail |
|-------|--------|
| **Routes** | `/dashboard/employees`, `/dashboard/employees/[id]` |
| **Redirects** | `/dashboard/staff*` → employees |
| **Payroll** | Profile tab only — placeholder (“Future payroll…”) |
| **Maturity** | Strong directory; payroll placeholder |

### Reports

| Field | Detail |
|-------|--------|
| **Route** | `/dashboard/reports` |
| **Tabs** | Executive, Revenue, Appointments, Customers, Employees, Services, Locations, Financial, Inventory, Export, Scheduled |
| **Maturity** | Partial — inventory placeholder; soft-empty patterns |
| **No** | `/dashboard/analytics` |

### AI Workforce / Summer / Chase

| Route | Purpose | Maturity |
|-------|---------|----------|
| `/dashboard/ai-workforce` | Roster | Early Access / placeholders |
| `/dashboard/ai-workforce/summer` | Summer workspace | Early Access |
| `/dashboard/ai-workforce/command` | Command center | Early Access |
| `/dashboard/workforce/chase` | Chase ops | Early Access |
| `/dashboard/ai-workforce/[slug]` | Role pages | Mixed redirects / placeholders |

### Notifications / Integrations / Automation / Developer / Settings

| Route | Maturity | Notes |
|-------|----------|-------|
| `/dashboard/notifications` | Partial | Inbox; booking-level Communications also exist |
| `/dashboard/integrations` | Partial | Calendar connections |
| `/dashboard/automation` | Partial | Also Business tab |
| `/dashboard/developer` | Complete-ish | Always in tenant nav |
| `/dashboard/settings` | Partial | Overlaps Business |
| `/dashboard/settings/billing` | Partial | Plan / subscription |

### HQ (platform)

| Route | Gate | Notes |
|-------|------|-------|
| `/dashboard/hq` | Platform owner | Founder HQ |
| `/dashboard/hq/private-alpha` | Platform owner | Private Alpha ops |

### Absent as dedicated portal routes

Packages · Memberships · Gift cards · Payroll · Locations · Resources · Invoices · Receipts · Refunds · Analytics · Onboarding · Account/profile · Help/support · Healthcare/EMR

---

## Customer self-service portal (adjacent)

| Route | File | Maturity |
|-------|------|----------|
| `/portal/[token]` | `app/portal/[token]/page.tsx` | Scaffold — appointments; memberships/packages/gift cards “Coming soon” |

Not the World Class tenant shell target for Chapter 1, but part of the end-to-end customer journey.

---

## Platform Owner (out of tenant IA)

`/owner/*` — separate shell (`components/owner/shell.tsx`). Do not merge into tenant navigation.

---

## Classification hint (detail in audit)

| Area | Hint |
|------|------|
| Reception + BookingSheet + commerce resolver | **PRESERVE** core |
| Overview | **IMPROVE** → command centre |
| Business mega-hub + Settings overlap | **CONSOLIDATE** |
| Three booking editors | **CONSOLIDATE** |
| Unused customers-manager / WaitlistPlaceholder | **REMOVE** candidates |
| Developer in primary nav for all tenants | **IMPROVE** / relocate |
| Healthcare | **N/A** — future workspace |
