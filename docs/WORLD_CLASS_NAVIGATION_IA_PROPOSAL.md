# World Class Navigation / Information Architecture Proposal

**Status:** Implemented  
**Pass:** Navigation + Command Discoverability  
**Branch:** `cursor/world-class-portal-foundation`  
**Authority:** Product Owner approved this proposal plus competitor-study refinements  
**Companion:** [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md) operator-journey acceptance rule  

Source of truth for the live portal is `lib/dashboard/nav.ts`. This document remains the approved IA record.

**Competitor-study refinements folded in:**

- Memberships / Gift Cards / Discounts / Locations / Chase surfaced via existing routes (no duplicate pages)
- Business setup (not “Business Hub”) in primary nav
- Hub Notifications → Booking notifications; Hub Automation → Business rules
- Duplicate Hub Services tab removed; old `?tab=services` redirects to Catalog Services
- ⌘K expanded for Packages, Memberships, Gift Cards, Invoices, Locations plus static settings jumps
- Five-slot mobile bar unchanged; new items live in grouped More
- Command Centre Chase insights and AI Command consolidation remain **DESIGN FOR NOW / BUILD LATER**

Do **not** add Taxes, Rooms, Categories, Custom Forms, Booking notifications, Business rules, Branding, or Documents as sidebar items.

---

## Current route map (evidence)

Source: `lib/dashboard/nav.ts`, `components/dashboard/sidebar.tsx`, `components/dashboard/mobile-bottom-nav.tsx`, `app/(dashboard)/dashboard/**/page.tsx`, Business Hub tabs, command registry.

### Sidebar groups (implemented)

| Group | Item | Route | Sidebar | Mobile primary | Direct link | Discoverability |
|-------|------|-------|---------|----------------|-------------|-----------------|
| Today | Command Centre | `/dashboard` | Yes | Yes (Centre) | Yes | GOOD |
| Today | Reception | `/dashboard/calendar` | Yes | Yes | Yes | GOOD |
| Customers | Customers | `/dashboard/clients` | Yes | Yes | Yes | GOOD |
| Team | Employees | `/dashboard/employees` | Yes | More | Yes | GOOD |
| Catalog | Services | `/dashboard/services` | Yes | More | Yes | GOOD |
| Catalog | Packages | `/dashboard/business?tab=packages` | Yes | More | Yes | GOOD |
| Catalog | Memberships | `/dashboard/business?tab=memberships` | Yes | More | Yes | GOOD — Preview / Coming Soon on destination |
| Money | Payments | `/dashboard/payments` | Yes | Yes | Yes | GOOD |
| Money | Gift Cards | `/dashboard/business?tab=giftcards` | Yes | More | Yes | GOOD |
| Money | Discounts | `/dashboard/business?tab=discounts` | Yes | More | Yes | GOOD |
| Operate | Reports | `/dashboard/reports` | Yes | More | Yes | GOOD |
| Operate | Automations | `/dashboard/automation` | Yes | More | Yes | GOOD |
| AI | Summer | `/dashboard/ai-workforce/summer` | Yes | Flagged primary but filtered out of 5-slot bar | Yes | GOOD on desktop; More / Ask Summer on mobile |
| AI | Chase | `/dashboard/workforce/chase` | Yes | More | Yes | GOOD |
| AI | AI Workforce | `/dashboard/ai-workforce` | Yes | More | Yes | GOOD |
| Business | Business setup | `/dashboard/business` | Yes | More | Yes | GOOD |
| Business | Locations | `/dashboard/business?tab=locations` | Yes | More | Yes | GOOD |
| Business | Communications | `/dashboard/notifications` | Yes | More | Yes | GOOD |
| Business | Integrations | `/dashboard/integrations` | Yes | More | Yes | GOOD |
| Account | Account & billing | `/dashboard/settings` | Yes | More | Yes | GOOD |
| Advanced | Developer | `/dashboard/developer` | Collapsed | More | Yes | ACCEPTABLE |
| Founder | Platform Admin | `/dashboard/hq` | Owner only | More if owner | Yes | GOOD for founders |

### Deferred / not in primary nav

| Feature | Route | Notes |
|---------|-------|--------|
| AI Command | `/dashboard/ai-workforce/command` | DESIGN FOR NOW / BUILD LATER |
| Taxes / Rooms / Categories / Custom forms / Booking notifications / Business rules | Hub tabs | Stay inside Business setup |
| Command Centre Chase insights | `/dashboard` | DESIGN FOR NOW / BUILD LATER |

---

## Business Hub tab map (implemented labels)

| Tab | Key | Classification | Notes |
|-----|-----|----------------|-------|
| Profile | `profile` | A (business configuration) | Keep in Business setup. Settings also has a business profile form — duplicate. |
| Hours | `hours` | A | Business + closures. Settings also has **location** hours — different scope; rename in IA. |
| Booking | `booking` | A | Business-default cascade. Location scheduling stays under Settings / location. |
| Branding | `branding` | A | Business appearance. |
| Notifications | `notifications` | C / E | Relabeled **Booking notifications**. Distinct from Communications. |
| AI | `ai` | C | Remains in Business setup this slice. |
| Documents | `documents` | A | Business files. |
| Locations | `locations` | B | Sidebar under Business; Hub tab remains the page. |
| Services | `services` | F | **Removed.** `?tab=services` redirects to `/dashboard/services`. |
| Categories | `categories` | C | Hub tab with link to Catalog → Services. |
| Rooms & resources | `rooms` | B / C | Catalog or Business → Resources. Not a top-level dump. |
| Memberships | `memberships` | B + D | Catalog item beside Packages; Preview / Coming Soon. |
| Packages | `packages` | B | Already Catalog nav. Hub tab can remain as the page. |
| Gift cards | `giftcards` | B / C | Money (Payments-adjacent) or Catalog. Prefer Money. |
| Taxes | `taxes` | C | Money / Business finance. |
| Discounts | `discounts` | C | Money / Catalog promotions. Prefer Money. |
| Custom forms | `forms` | D | Stay in Business setup while incomplete, with Preview / Coming Soon. |
| Automation | `automation` | F | Relabeled **Business rules**. Not merged with `/dashboard/automation`. |

---

## Answers to locked IA questions

**A. Business label.** Recommend **Business setup** (not “Business Hub” in the sidebar). “Hub” is an internal metaphor. The page can keep a hub layout.

**B. Memberships.** Yes — Catalog beside Services and Packages, labeled Memberships, deep-linking the existing Hub tab, with Preview / Coming Soon.

**C. Gift cards.** Visible under **Money**, not Catalog. Operators look for stored value with Payments.

**D. Taxes.** **Business setup → Taxes** (deep link). Not sidebar top-level.

**E. Discounts.** **Money → Discounts** (deep link to Hub tab) or Business setup. Prefer Money next to gift cards.

**F. Locations.** **Business setup → Locations** (second-level / in-page), not a 25th sidebar item.

**G. Rooms & resources.** **Business setup → Rooms & resources** until Chapter 9; later Catalog/Resources if usage grows.

**H. Custom Forms while incomplete.** Keep in Business setup with Preview / Coming Soon. Do not promote to sidebar.

**I. Hub Services tab.** Retired. Catalog → Services is the operator home. Old `?tab=services` redirects.

**J. Two Automations?** **Two related concepts, not one system.** `/dashboard/automation` = waitlist + recurring appointments. Hub Automation = business automation rules. Relabel Hub to “Business rules” (or similar) rather than merging routes.

**K. Notifications vs Communications.** They should **coexist only with distinct jobs**: Communications = message center / delivery; Hub Notifications = booking event templates. Relabel Hub tab. Do not hide Communications.

**L. Billing.** Yes — remain under **Account & billing**. Do not mix SaaS billing with tenant Payments.

**M. Mobile More.** More opens the full grouped sidebar, so items exist, but Taxes / Locations / Memberships / Forms are **not predictable** from the five primary slots. Do not dump them into the bar. Teach More + clearer Business setup grouping.

---

## Approved navigation (implemented)

Prefer relabel, group, and deep link. No new nav framework.

| Group | Nav item | Route | Why | Mobile | Route reuse | Change type |
|-------|----------|-------|-----|--------|-------------|-------------|
| Today | Command Centre | `/dashboard` | Start the day | Primary | Reused | LABEL ONLY if shortened |
| Today | Reception | `/dashboard/calendar` | Run the book | Primary | Reused | NONE |
| Customers | Customers | `/dashboard/clients` | People they serve | Primary | Reused | GROUP MOVE (People → Customers) |
| Team | Employees | `/dashboard/employees` | Add/manage staff | More | Reused | GROUP MOVE (People → Team) |
| Catalog | Services | `/dashboard/services` | What is sold | More | Reused | NONE |
| Catalog | Packages | `/dashboard/business?tab=packages` | Bundles | More | Reused | NONE |
| Catalog | Memberships | `/dashboard/business?tab=memberships` | Recurring offers (preview) | More | Deep link | NEW NAV ITEM |
| Money | Payments | `/dashboard/payments` | Collect / ledger | Primary | Reused | NONE |
| Money | Gift cards | `/dashboard/business?tab=giftcards` | Stored value | More | Deep link | NEW NAV ITEM |
| Money | Discounts | `/dashboard/business?tab=discounts` | Promotions | More | Deep link | NEW NAV ITEM |
| Operate | Reports | `/dashboard/reports` | How the business is doing | More | Reused | GROUP MOVE (Insights → Operate) |
| Operate | Automations | `/dashboard/automation` | Waitlist / recurring | More | Reused | NONE |
| AI | Summer | `/dashboard/ai-workforce/summer` | AI Business Manager | More + Ask Summer rail | Reused | GROUP MOVE |
| AI | Chase | `/dashboard/workforce/chase` | Ops recommendations | More | Reused | NEW NAV ITEM (was hidden) |
| AI | AI Workforce | `/dashboard/ai-workforce` | Roster / other roles | More | Reused | NONE |
| Business | Business setup | `/dashboard/business` | Configure the company | More | Reused | LABEL ONLY |
| Business | Locations | `/dashboard/business?tab=locations` | Sites | More | Deep link | NEW NAV ITEM |
| Business | Communications | `/dashboard/notifications` | Message center | More | Reused | GROUP MOVE |
| Business | Integrations | `/dashboard/integrations` | Connect tools | More | Reused | GROUP MOVE |
| Account | Account & billing | `/dashboard/settings` | Plan, location hours/scheduling, profile duplicate to resolve later | More | Reused | NONE |
| Advanced | Developer | `/dashboard/developer` | API keys | More collapsed | Reused | NONE |
| Founder | Platform Admin | `/dashboard/hq` | Owner only | More if owner | Reused | NONE |

**Not top-level:** Taxes, Rooms, Categories, Custom Forms, Hub Services, Hub Automation, Hub Notifications, Hub AI — remain inside Business setup (or Services) with clearer names.

**Sidebar budget:** ~16 tenant items in 7 groups — not 25 flat links. Memberships + Gift cards + Discounts + Locations + Chase are the only new *visible* entries; all reuse existing routes.

### Proposed Business setup interior (still one page)

Keep one `/dashboard/business` surface. Group tabs conceptually (labels only in a later pass):

1. **Company** — Profile, Branding, Documents, AI  
2. **Where & when** — Locations, Hours, Booking  
3. **Catalog extras** — Categories, Rooms & resources, Memberships (preview), Packages (or “Open Services”)  
4. **Money extras** — Taxes, Gift cards, Discounts  
5. **Incomplete / messaging** — Custom forms (preview), Booking notifications, Business rules  

Do not redesign Hub chrome in this pass.

---

## First-time owner paths (proposed IA)

| Goal | Expected path |
|------|----------------|
| 1. Add an employee | Team → Employees → add |
| 2. Create a service | Catalog → Services → add |
| 3. Create a package | Catalog → Packages |
| 4. Find Memberships | Catalog → Memberships (Preview / Coming Soon) |
| 5. Configure a location | Business setup → Locations |
| 6. Configure booking rules | Business setup → Booking |
| 7. Configure business hours | Business setup → Hours |
| 8. Configure taxes | Business setup → Taxes (in-page; not sidebar) |
| 9. Configure notifications | Business setup → Booking notifications **or** Business → Communications for inbox |
| 10. Connect integrations | Business → Integrations |
| 11. View payments | Money → Payments |
| 12. Understand billing | Account → Account & billing → Manage billing |
| 13. Use Summer | AI → Summer, or Ask Summer rail |
| 14. Find reports | Operate → Reports |
| 15. Find Custom Forms (incomplete) | Business setup → Custom forms, Preview / Coming Soon visible |

Paths 8–9 are still slightly nested; that is preferable to a 25-link sidebar. Chase becomes findable (was the surprising hole).

---

## Exact future paths (locked recommendation)

| Topic | Path |
|-------|------|
| Memberships | Catalog → Memberships → `/dashboard/business?tab=memberships` |
| Locations | Business setup → Locations → `/dashboard/business?tab=locations` |
| Taxes | Business setup → Taxes → `/dashboard/business?tab=taxes` |
| Communications | Business → Communications → `/dashboard/notifications` |

---

## Duplicate / colliding labels

| Collision | Verdict |
|-----------|---------|
| Services (nav) vs Hub Services | Same catalog; Hub tab should not compete |
| Automations vs Hub Automation | Two systems; relabel Hub |
| Communications vs Hub Notifications | Different jobs; relabel Hub |
| Settings business profile vs Hub Profile | Duplicate editors — later consolidation, not this pass |
| Settings location hours vs Hub Hours | Different scope (location vs business/closures) — keep both, name clearly |
| Account & billing vs Payments | SaaS vs tenant money — keep separate |
| Staff vs Employees | Redirect already; Employees wins |
| Platform Admin vs Chasum HQ tenant | Already documented; do not confuse |

---

## Hidden / remaining operator gaps

- AI Command — DESIGN FOR NOW / BUILD LATER
- Taxes, Rooms, Custom Forms — inside Business setup, not sidebar (intentional)
- Custom Forms completeness (Preview / Coming Soon)
- Command Centre Chase insights — DESIGN FOR NOW / BUILD LATER

---

## Mobile implications

Keep five primary slots. Do **not** add Memberships or Taxes to the bar.

More remains the complete grouped sidebar. Memberships / Gift Cards / Locations / Chase appear in More under their groups.

Ask Summer rail can stay; do not also consume a primary slot.

---

## Stop

This IA is implemented for navigation + command discoverability.

Do **not** start Command Centre expansion, AI Command consolidation, Commercial Foundation, staff_activity SQL, occupancy correction, or `/apply` persistence from this slice.
