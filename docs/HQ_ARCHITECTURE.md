# `/dashboard/hq` architecture (legacy founder-only surface)

**CURRENT NAMING (2026-08-24 PO ruling):** **Chasum HQ** is a **normal business tenant** used to operate Chasum itself. It is **not** this surface.

**This document** describes **`/dashboard/hq`**, which is a **LEGACY / FOUNDER-ONLY SURFACE — NAMING/DISPOSITION TO BE RESOLVED.** Do not describe `/dashboard/hq` as Chasum HQ product architecture. Do **not** redesign, delete, or expand it until a later PO decision (move into `/owner`, relabel, or retire).

Platform Admin / Control Centre direction: [`OWNER_PLATFORM.md`](./OWNER_PLATFORM.md) (`/owner`).
Handoff: [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md).

**Surface:** `/dashboard/hq`  
**Audience:** Founder / platform owners only (`requirePlatformOwner`)  
**Not** customer-facing. **Not** the Chasum HQ tenant.

---

## Purpose (historical — this surface)

This founder-only view was built as an internal operating console: pipeline, partner health, product readiness, roadmap, and launch percentages — in one premium CEO view. That product intent, if retained, belongs under **Platform Admin (`/owner`)** or a relabeled surface — **not** under the name Chasum HQ.

---

## Stack

| Layer | Path |
|-------|------|
| Page | `app/(dashboard)/dashboard/hq/page.tsx` |
| UI | `components/hq/hq-workspace.tsx` |
| Snapshot | `lib/hq/snapshot.ts` → `getHqSnapshot()` |
| Types | `lib/hq/types.ts` |
| Seed | `lib/hq/seed.ts` (pipeline, bugs, roadmap until persisted) |
| Live metrics | `lib/owner/data.ts` → `getOwnerOverviewMetrics()` when available |

---

## Auth

1. User must be signed in (dashboard layout).  
2. `getHqSnapshot()` calls `requirePlatformOwner()` — env `PLATFORM_OWNER_EMAILS` or `platform_admins`.  
3. Non-owners redirect away from `/dashboard/hq` (same gate family as `/owner`).
4. Sidebar shows an **HQ** label only when `showHq` is true (legacy label; not the Chasum HQ tenant).

---

## Data sources

| Domain | Today | Next |
|--------|-------|------|
| MRR / businesses / health | Live Owner metrics | — |
| Bookings (7d) | Live `appointments` count when service role works | — |
| Applications pipeline | Seed | Persist apply form → `design_partner_applications` |
| Partner health rows | Seed | Derive from tenant activity tables |
| Bugs / feature requests | Seed | Linear/GitHub sync or internal table |
| Roadmap / releases | Seed + changelog | Product OS |
| Launch % | Curated from founder audit | Checklist-driven |

---

## Sections

1. Executive Dashboard — 10 KPI cards  
2. Design Partner Pipeline — stage counts + applications table  
3. Customer Health — per-partner risk matrix  
4. Product Health — readiness, bugs, requests  
5. Roadmap Progress — completed / current / next / future  
6. Release Notes  
7. Launch Readiness — Private Alpha / Closed Beta / Public Launch rings  

---

## Design language

Quiet density: hairline borders, uppercase micro-labels, large numerals, muted tables — closer to Linear/Stripe admin than marketing gradients.

---

## Related

- **Private Alpha Management:** `/dashboard/hq/private-alpha` — see `docs/PRIVATE_ALPHA_ARCHITECTURE.md`

## Screenshots

See `docs/hq/screenshots/` for executive, roadmap/launch, and full-page captures.
