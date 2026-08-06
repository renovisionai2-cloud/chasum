# World Class Route and Navigation Map

**Chapter:** 0  
**Nav source:** `lib/dashboard/nav.ts` (shipped in `d86e398`)  
**Inventory companion:** [`PORTAL_ROUTE_INVENTORY.md`](./PORTAL_ROUTE_INVENTORY.md)  

---

## Shell

| Layer | Path |
|-------|------|
| Layout | `app/(dashboard)/layout.tsx` |
| Shell | `components/dashboard/shell.tsx` |
| Sidebar / top nav | `components/dashboard/sidebar.tsx` |
| Command palette | `components/command-palette/command-palette.tsx` |
| Command registry | `lib/command/registry.ts` |

---

## Grouped navigation (presentation)

| Group | Items | Routes |
|-------|-------|--------|
| Today | Overview, Reception | `/dashboard`, `/dashboard/calendar` |
| People | Customers, Employees | `/dashboard/clients`, `/dashboard/employees` |
| Catalog | Services, Packages | `/dashboard/services`, `/dashboard/business?tab=packages` |
| Money | Payments | `/dashboard/payments` |
| Insights | Reports, Automations | `/dashboard/reports`, `/dashboard/automation` |
| Intelligence | Summer, AI Workforce | `/dashboard/ai-workforce/summer`, `/dashboard/ai-workforce` |
| Settings | Business, Integrations, Account & billing, Communications | `/dashboard/business`, `/integrations`, `/settings`, `/notifications` |
| Advanced | Developer (collapsed) | `/dashboard/developer` |
| Owner | HQ | `/dashboard/hq` (owner only) |

**Label choices:** Catalog (not Offer), Insights (not Grow), Customers (not CRM), Communications (not Notifications), Reception (calendar URL preserved).

---

## Full route map and maturity

| Route | Purpose | Maturity | Future chapter |
|-------|---------|----------|----------------|
| `/dashboard` | Overview | Partial | Ch 2 Command Centre |
| `/dashboard/calendar` | Reception | Strong (GVM path) | Ch 3 |
| `/dashboard/appointments` | Redirect → calendar | — | — |
| `/dashboard/clients` | Customer list | Strong | Ch 4 |
| `/dashboard/clients/[id]` | Customer profile | Strong | Ch 4 |
| `/dashboard/payments` | Payments hub | Strong | Ch 6 |
| `/dashboard/services` | Services | Strong | Ch 9 |
| `/dashboard/business` | Business mega-hub | Partial | Ch 9 |
| `/dashboard/employees` | Team | Strong | Ch 8 |
| `/dashboard/employees/[id]` | Profile (+ payroll placeholder) | Partial | Ch 8 |
| `/dashboard/staff*` | Redirect → employees | Legacy | — |
| `/dashboard/reports` | Reports | Partial | Ch 10 |
| `/dashboard/ai-workforce*` | AI surfaces | Partial / Early Access | Ch 12 |
| `/dashboard/workforce/chase` | Chase | Partial | Ch 12 |
| `/dashboard/notifications` | Communications inbox | Partial | Ch 7 |
| `/dashboard/integrations` | Calendar sync | Partial | Ch 9 |
| `/dashboard/automation` | Automations | Partial | Ch 11 |
| `/dashboard/developer` | API keys | Complete-ish | Demote / entitlement |
| `/dashboard/settings*` | Account & billing | Partial | Ch 9 |
| `/dashboard/hq*` | Founder HQ | Owner | Out of tenant IA |
| `/portal/[token]` | Customer self-serve | Scaffold | Later |
| `/book/[slug]` | Public booking | Strong | Protect |
| `/owner/*` | Platform owner | Separate shell | Out of tenant IA |

**No top-level routes yet:** dedicated invoices, receipts, refunds, payroll, locations, resources, help, onboarding — embedded in hubs.

---

## Operating journey (target mapping)

```
Customer → Booking → Appointment → Employee → Service → Payment → Invoice → Receipt → Communication → Follow-up → Reporting → Intelligence
```

| Journey step | Primary surface today |
|--------------|----------------------|
| Customer | `/dashboard/clients` |
| Booking / Appointment | Reception + BookingSheet |
| Employee | Employees + appointment assignment |
| Payment / Invoice / Receipt | Payments + CRM commerce + BookingSheet |
| Communication | Communications + booking retry |
| Reporting | Reports |
| Intelligence | Summer (Early Access) |

---

## Compatibility rules

- Preserve routes; prefer label/IA changes.  
- Do not delete functional routes in early chapters.  
- Redirects (`appointments`, `staff`) stay.  
- HQ never shown to ordinary tenants.  
- Developer stays Advanced / collapsed.  
