# World Class Route and Navigation Map

**Chapter:** 1 — Design system and portal foundation  
**Branch:** `cursor/world-class-portal-foundation`  
**Production baseline:** `4eecbec`  
**Nav source:** `lib/dashboard/nav.ts`  
**Shell:** `d86e398` + Chapter 1 polish  
**Migrations 034–036:** Do not apply · Shared Supabase: no experimental schema  

---

## Shell

| Layer | Path |
|-------|------|
| Layout | `app/(dashboard)/layout.tsx` |
| Shell | `components/dashboard/shell.tsx` (skip link + `#portal-main`) |
| Sidebar / top nav | `components/dashboard/sidebar.tsx` |
| Mobile bottom nav | `components/dashboard/mobile-bottom-nav.tsx` |
| Command palette | `components/command-palette/command-palette.tsx` |
| Command registry | `lib/command/registry.ts` |
| Quick create | `lib/dashboard/quick-create.ts` |

---

## Grouped navigation (presentation)

| Group | Items | Routes |
|-------|-------|--------|
| Today | **Command Centre**, Reception | `/dashboard`, `/dashboard/calendar` |
| People | Customers, Employees | `/dashboard/clients`, `/dashboard/employees` |
| Catalog | Services, Packages | `/dashboard/services`, `/dashboard/business?tab=packages` |
| Money | Payments | `/dashboard/payments` |
| Insights | Reports, Automations | `/dashboard/reports`, `/dashboard/automation` |
| Intelligence | Summer (Early Access), AI Workforce | `/dashboard/ai-workforce/summer`, `/dashboard/ai-workforce` |
| Settings | Business, Integrations, Account & billing, Communications | `/dashboard/business`, `/integrations`, `/settings`, `/notifications` |
| Advanced | Developer (collapsed) | `/dashboard/developer` |
| Owner | HQ | `/dashboard/hq` (owner only) |

**Command Centre** is a **label** on `/dashboard` — page depth is **Chapter 2**. Do not invent empty fake destinations.

**Mobile:** Command Centre uses `mobileLabel: "Centre"`; Summer stays out of bottom bar (header / More menu).

---

## Product concepts ↔ routes

| Concept | Current truthful route | Status |
|---------|------------------------|--------|
| Command Centre | `/dashboard` | Label live; depth Ch 2 |
| Reception / Calendar | `/dashboard/calendar` | **Chapter 3** — Day = operating centre; Week/Month = planning; Resources empty → Business Locations |
| Customers | `/dashboard/clients` | Strong |
| Sales and Payments | `/dashboard/payments` | Strong (manual-first honesty) |
| Communications | `/dashboard/notifications` | Partial |
| Employees and Team | `/dashboard/employees` | Strong directory |
| Business Operations | `/dashboard/business` | Mega-hub · Locations tab is current location management (Ch9 expands Resources) |
| Business Intelligence | `/dashboard/reports` | Partial |
| Growth | Automations / packages / gift cards in hubs | Partial — no fake Growth page |
| Summer | `/dashboard/ai-workforce/summer` | Early Access |
| Setup and Settings | Business + Settings | Partial |
| First-business onboarding | `/onboarding/business` | Authenticated zero-business gateway; no auto-create |

---

## Command palette (real actions)

- Navigate: Command Centre, Reception, Customers, Payments, Communications, Employees, Business, Reports, Services, Summer, Chase, AI Workforce  
- Actions: Book appointment, Search Customer/Employee (directory)  
- Owner-only filtered server-side: HQ, Private Alpha  
- Live DB search: customers, staff, services, appointments (existing architecture)  

---

## Compatibility rules

- Preserve routes; prefer label/IA changes.  
- Redirects (`appointments`, `staff`) stay.  
- HQ never shown to ordinary tenants.  
- Developer stays Advanced / collapsed.  
- No competing navigation systems.  
