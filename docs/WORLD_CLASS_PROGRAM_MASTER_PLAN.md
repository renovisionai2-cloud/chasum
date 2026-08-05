# World Class Program Master Plan

**Program:** Chasum World Class Program  
**Chapter 1 deliverable:** Portal Foundation Audit (planning only)  
**Protected Production:** `4eecbec` · tag `phase-0-gvm-production-2026-08-04` · https://chasum.vercel.app  
**Working branch:** `cursor/world-class-portal-foundation`  
**Companions:** [`PORTAL_FOUNDATION_AUDIT.md`](./PORTAL_FOUNDATION_AUDIT.md) · [`PORTAL_ROUTE_INVENTORY.md`](./PORTAL_ROUTE_INVENTORY.md) · [`WORLD_CLASS_DESIGN_PRINCIPLES.md`](./WORLD_CLASS_DESIGN_PRINCIPLES.md) · [`WORLD_CLASS_IMPLEMENTATION_SEQUENCE.md`](./WORLD_CLASS_IMPLEMENTATION_SEQUENCE.md) · [`HEALTHCARE_WORKSPACE_DIRECTION.md`](./HEALTHCARE_WORKSPACE_DIRECTION.md)

---

## Vision

Make the authenticated Chasum portal feel like **one AI Business Operating System**: premium, calm, intelligent, fast, and trustworthy — connected from Customer → Booking → Appointment → Staff → Payment → Invoice → Receipt → Communication → Follow-up → Reporting.

Preserve Phase 0 GVM production excellence. Extend Design System v1. Do not fork the product into disconnected modules.

---

## Recommended future portal shell

### Primary navigation groups

| Group | Items (proposed) | Notes |
|-------|------------------|-------|
| **Today** | Overview, Reception | Run the business now |
| **People** | Customers, Employees | CRM + team |
| **Offer** | Services, (Packages / Memberships when elevated) | Catalog |
| **Money** | Payments (Invoices / Receipts as subviews) | Commerce |
| **Grow** | Reports, Automation | Insight + systems |
| **Intelligence** | Summer (primary AI entry) | Not a 12-role dumping ground |
| **Configure** | Business, Settings, Integrations | Progressive disclosure |
| **Advanced** | Developer, Notifications (or Inbox under Today) | Demote for most tenants |

### Shell chrome

| Element | Recommendation |
|---------|----------------|
| **Header** | Business name context, location switcher, real search/command, notifications, user menu |
| **Search / Command** | Header opens ⌘K; unified customer/employee/appointment/action search |
| **Notifications** | Bell → inbox; deep-link into appointment Communications |
| **Business switcher** | When multi-business access exists; else hide |
| **Location switcher** | Keep; clarify “all locations” vs single |
| **Staff/user menu** | Profile, theme, sign out, help (add Help later) |
| **Summer entry** | Header spark + nav Intelligence group |
| **Quick-create** | Book, Add customer, Record payment — command + FAB on mobile Reception |
| **Mobile** | Bottom or drawer nav with Today / People / Money priority |
| **Tablet** | Collapsible side panel on Reception |
| **Page titles** | Always `PageHeader` |
| **Breadcrumbs** | Detail routes only (Customer → Profile; Employee → Profile) |
| **Drawers/modals** | Sheet for edit; dialog for confirm; inspect drawer read-first |

### Connected journey (IA spine)

```
Customer → Booking → Appointment → Staff → Payment → Invoice → Receipt → Communication → Follow-up → Reporting
```

Every object page should expose **next-step links** along this spine (not only global nav).

---

## Phased master plan

### Phase 1 — Portal Foundation

| Field | Content |
|-------|---------|
| **Objective** | One shell language: nav IA, header/command, DS adoption |
| **User outcome** | Owners find work faster; portal feels calmer and more premium |
| **Problems** | Flat nav, fake search, terminology, inconsistent chrome |
| **Scope** | Shell, nav groups, command/search entry, PageHeader/empty/loading pass, remove confirmed dead UI |
| **Preserve** | Phase 0 booking/payment/email; DS tokens |
| **Improve** | Nav, header, terminology, primitive adoption |
| **Consolidate** | Nav labels (Staff→Employees) |
| **Replace** | None of core ops |
| **Remove** | Confirmed unused components only |
| **Dependencies** | DS v1, audit docs approved |
| **Database** | None |
| **Migrations** | None |
| **Security** | Auth shell unchanged |
| **Production risk** | Medium (findability) — mitigate with Preview + GVM smoke |
| **Preview plan** | Desktop/tablet/mobile shell; command; nav to Reception/CRM/Payments |
| **Acceptance** | See Implementation Sequence |
| **Complexity** | **Large** |
| **Order** | **1 — first** |

### Phase 2 — Overview and Business Command Centre

| Field | Content |
|-------|---------|
| **Objective** | Overview answers: what needs attention today? |
| **User outcome** | Start the day without hunting |
| **Problems** | Stats without action; weak continuity |
| **Scope** | Attention queue (no-shows risk, unpaid deposits, failed emails, open balance), quick-create, Summer teaser |
| **Preserve** | Setup checklist (refine) |
| **Improve** | Hierarchy, empty/loading |
| **Consolidate** | Insights sources |
| **DB** | Read aggregates only initially |
| **Prod risk** | Low |
| **Complexity** | **Medium** |
| **Order** | 2 |

### Phase 3 — Calendar and Reception

| Field | Content |
|-------|---------|
| **Objective** | One Reception operating surface |
| **User outcome** | Book → inspect → edit → pay → message without confusion |
| **Problems** | Triple booking UI; mobile density |
| **Scope** | Consolidate editors; tablet/mobile Reception; keep Phase 0 financials |
| **Preserve** | BookingSheet as canonical edit; financial resolver; assigned-employee path |
| **Consolidate** | QuickAppointment + Drawer into thin create/inspect |
| **Replace** | Do not enable unassigned staff in Production |
| **DB** | Avoid 034–036 unless Preview experiment approved |
| **Prod risk** | **High** |
| **Complexity** | **Very Large** |
| **Order** | 3 |

### Phase 4 — Customer CRM

| Field | Content |
|-------|---------|
| **Objective** | Customer as hub of the operating spine |
| **User outcome** | From profile: book, pay, message, see history |
| **Problems** | CRM vs Payments split; terminology |
| **Scope** | Profile timeline, shared financial activity, messaging |
| **Preserve** | CrmManager / profile depth |
| **Remove** | Legacy unused customers-manager if confirmed |
| **Complexity** | **Large** |
| **Order** | 4 |

### Phase 5 — Commerce and Financial Operations

| Field | Content |
|-------|---------|
| **Objective** | Stripe-like financial trust in UI |
| **User outcome** | Clear payment/invoice/receipt/refund status everywhere |
| **Problems** | Fragmented money UIs |
| **Scope** | Shared financial summary component; Payments subviews; never orphan deposit wording |
| **Preserve** | Phase 0 resolver, receipts binding, resend safety |
| **DB** | Prefer none; ledger already exists |
| **Prod risk** | High if math touched — **don’t** |
| **Complexity** | **Large** |
| **Order** | 5 |

### Phase 6 — Employees, Locations and Resources

| Field | Content |
|-------|---------|
| **Objective** | Clear team + place + room model |
| **User outcome** | Schedule staff; manage locations; optional resources |
| **Problems** | Locations buried; resources flagged off; payroll placeholder |
| **Scope** | Locations IA; honest payroll placeholder or hide; resources Preview-only |
| **Migrations** | 036 only if approved Preview experiment |
| **Complexity** | **Large** |
| **Order** | 6 |

### Phase 7 — Communications

| Field | Content |
|-------|---------|
| **Objective** | One communications story |
| **User outcome** | See what sent; retry safely; trust branding |
| **Preserve** | Phase 0 email branding, timezone, resend no-duplicates |
| **Consolidate** | Notifications centre + appointment Communications |
| **Complexity** | **Medium** |
| **Order** | 7 |

### Phase 8 — Summer AI Business Manager

| Field | Content |
|-------|---------|
| **Objective** | Summer as contextual OS intelligence |
| **User outcome** | Ask/act with business context — no theater |
| **Problems** | Placeholder AI roles; dual Emma/Summer paths |
| **Scope** | Promote Summer entry; gate unfinished agents; Summer Principle everywhere |
| **DB** | Session/memory later |
| **Complexity** | **Large** |
| **Order** | 8 |

### Phase 9 — Reporting, Automation and Growth

| Field | Content |
|-------|---------|
| **Objective** | Honest analytics + useful automation |
| **User outcome** | Trust numbers; automate reminders/waitlist without mystery |
| **Problems** | Soft-empty reports; inventory placeholder |
| **Scope** | Remove fake certainty; scheduled exports when real |
| **Complexity** | **Large** |
| **Order** | 9 |

### Phase 10 — Healthcare Workspace and EMR Direction

| Field | Content |
|-------|---------|
| **Objective** | Optional clinical workspace architecture |
| **User outcome** | Clinics get intake/consent/notes **after** compliance approval |
| **Scope** | See [`HEALTHCARE_WORKSPACE_DIRECTION.md`](./HEALTHCARE_WORKSPACE_DIRECTION.md) |
| **DB** | **High** — new schemas |
| **Security** | **Very high** |
| **Complexity** | **Very Large** |
| **Order** | 10 |

### Phase 11 — Performance, Accessibility and Mobile

| Field | Content |
|-------|---------|
| **Objective** | Fast, accessible, mobile-excellent OS |
| **Scope** | Reception perf, a11y audit, keyboard, reduced motion |
| **Complexity** | **Large** |
| **Order** | 11 |

### Phase 12 — Production Readiness and Launch

| Field | Content |
|-------|---------|
| **Objective** | Controlled Production promote of approved World Class chapters |
| **Scope** | Tag, build-info verify, GVM smoke, no 034–036 unless approved, update CPS |
| **Complexity** | **Medium** |
| **Order** | 12 |

---

## Global constraints (all phases)

1. Do not deploy Production without explicit PO approval.  
2. Do not apply migrations 034, 035, or 036 without explicit approval.  
3. Do not modify shared Supabase historical GVM data for experiments.  
4. Do not mix brand PDF/scripts/`tmp` into product PRs.  
5. New World Class work stays on feature branches → Preview until approved.  
6. Marketing locks remain locked.  
7. Optional/unassigned employee booking is **not** Production-ready.

---

## Success definition

The portal feels like **one connected operating system**. A new receptionist can run Customer → Book → Pay → Receipt → Message without asking “which menu holds the truth?”
