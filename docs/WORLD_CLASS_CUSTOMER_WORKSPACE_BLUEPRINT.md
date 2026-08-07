# World Class — Chapter 4 Customer Workspace Blueprint

**Branch:** `cursor/world-class-portal-foundation`  
**Routes:** `/dashboard/clients`, `/dashboard/clients/[id]` (nav: Customers)  
**Production:** untouched (`4eecbec`)  
**Engines:** booking + payment engines unchanged; no migrations 034–036  
**Data dictionary:** [`WORLD_CLASS_CUSTOMER_WORKSPACE_DATA_DICTIONARY.md`](./WORLD_CLASS_CUSTOMER_WORKSPACE_DATA_DICTIONARY.md)

---

## Goal

Turn Customers into a premium customer operating workspace — calm, financially clear, read-first profiles, truthful metrics.

## Architecture

| Layer | Role |
|-------|------|
| `getCrmDirectory` | Customer list + derived last visit / next / outstanding from appointments |
| `buildCustomerHealthSummary` | Directory health counts; average spend **Unavailable** without commerce rollup |
| `loadCrmProfile` | Profile buckets, notes, documents, timeline, insights |
| `loadCustomerCommerceAccount` | Commerce SoT for collected / outstanding / invoices / gift cards |
| `directory-metrics.ts` | Pure helpers for list enrichment |
| `payment-summary.ts` | Pure view-model for payment summary card |
| UI | Overview health panel, tight directory, read-first Overview + Edit sheet, payment summary, billing sections |

## Directory

- Desktop operational columns: Customer · Status · Employee · Location · Last · Next · Outstanding · chevron
- Quick segments (derived): All / Active / Inactive / VIP / New / Recent / Balance due
- CRM status dropdown (persisted): Lead / Active / Inactive / Archived
- Mobile Filters sheet for secondary filters
- Clear filters when any filter active

## Profile

- Header: identity, status, tags, next appointment, balance due, primary actions + More menu
- Overview: read-first identity / relationship / important details; **Edit profile** opens sheet
- Tabs: Overview · Appointments · Billing · Messages · Notes · Documents · Timeline · Insights · Marketing · Summer
- Payment summary: one source note — commerce ledger
- Insights: “Completed service list value” (not revenue); rates with “X of Y” context
- Summer: Observed facts vs Recommendations visually separated

## Truth rules

- Missing average spend → **Unavailable**, never `$0`
- Directory outstanding ≠ always equal to commerce outstanding (documented)
- Packages: honest empty until ownership is linked
- No fabricated messages or AI claims

## Empty / loading

- Directory and profile `loading.tsx` → `DashboardSkeleton`
- Compact appointment empty states
- Partial data: Unavailable / — — never invent

## Out of scope

- Customer package ownership ledger UI
- Phone call logging
- Production deploy / shared DB writes / migrations 034–036
- Chapter 5
