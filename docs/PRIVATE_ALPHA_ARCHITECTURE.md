# Private Alpha Management Platform

**CURRENT NAMING (2026-08-24 PO ruling):** This page lives under **`/dashboard/hq`**, which is a **legacy founder-only surface**. It is **not** “Chasum HQ” (Chasum HQ is a normal tenant). Do not expand `/dashboard/hq/*` until PO disposition. Control-plane direction: [`OWNER_PLATFORM.md`](./OWNER_PLATFORM.md). Handoff: [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md).

**Surface:** `/dashboard/hq/private-alpha`  
**Audience:** Founder / platform owners only (`requirePlatformOwner`)  
**Milestone:** 7 — Internal company operations  
**Not** customer-facing. **Not** the Chasum HQ tenant.

---

## Purpose

Operate the Private Alpha professionally for the four Founding Design Partners:

| Code | Company |
|------|---------|
| 001 | GVM Baby World |
| 002 | CarStar |
| 003 | Shoppers |
| 004 | Darshan's General Construction |

---

## Stack

| Layer | Path |
|-------|------|
| Page | `app/(dashboard)/dashboard/hq/private-alpha/page.tsx` |
| UI | `components/hq/private-alpha-workspace.tsx` |
| Snapshot | `lib/hq/private-alpha/snapshot.ts` |
| Types | `lib/hq/private-alpha/types.ts` |
| Seed | `lib/hq/private-alpha/seed.ts` |
| Parent (legacy founder surface) | `/dashboard/hq` |

---

## Auth

Same gate as `/dashboard/hq` (legacy founder surface): `requirePlatformOwner()` via `PLATFORM_OWNER_EMAILS` or `platform_admins`. Non-owners redirect to `/dashboard`. Not the Chasum HQ tenant.

---

## Modules

1. **Partner dossiers** — company, contact, status, WAU, bookings, revenue, CSAT, health, risk, meetings  
2. **Onboarding checklist** — Business Profile → Locations → Services → Employees → Hours → Branding → Communications → Commerce → Summer → Chase → Training → Go Live  
3. **Feedback board** — New / Under Review / Planned / In Progress / Completed / Rejected (+ roadmap links)  
4. **Support log** — severity Critical→Low; status Reported → Assigned → Resolved  
5. **Weekly founder review** — wins, problems, requests, health, usage per company  
6. **Founder notes** — owner-only confidential notes  

---

## Data sources

| Domain | Today | Next |
|--------|-------|------|
| Partner profiles & checklist | Seed | `design_partners` + checklist rows |
| Feedback | Seed | Persist + status transitions |
| Support | Seed | Ticketing table or Linear sync |
| Weekly report | Curated | Auto-draft from activity + tickets |
| Founder notes | Seed | Encrypted owner-scoped table |

---

## Design

Quiet Linear/Stripe admin density: hairline borders, uppercase micro-labels, dossier cards, kanban feedback columns.

---

## Screenshots

See `docs/hq/screenshots/private-alpha/`.
