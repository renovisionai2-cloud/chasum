# World Class — Chapter 4 Customer Workspace Blueprint

**Branch:** `cursor/world-class-portal-foundation`  
**Routes:** `/dashboard/clients`, `/dashboard/clients/[id]` (nav: Customers)  
**Production:** untouched (`4eecbec`)  
**Engines:** booking + payment engines unchanged; no migrations 034–036  

---

## Goal

Turn Customers from an address book into a Customer Workspace that answers:

Who is this? What have they booked? What do they owe? What have they purchased? What conversations occurred? What should I do next?

## Architecture

| Layer | Role |
|-------|------|
| `getCrmDirectory` | Customer list + derived last visit / next / outstanding from appointments |
| `loadCrmProfile` | Profile buckets, notes, documents, timeline, insights |
| `loadCustomerCommerceAccount` | Commerce SoT for collected / outstanding / invoices / gift cards |
| `directory-metrics.ts` | Pure helpers for list enrichment |
| `payment-summary.ts` | Pure view-model for payment summary card |
| UI | `CustomerDirectory`, `CustomerProfileView`, `CustomerPaymentSummary`, notes/docs/timeline |

## Truth rules

- **Collected** = commerce gross payments collected — never labeled revenue.
- **Completed booking value** on Insights = appointment list prices — not payments collected.
- Packages: honest empty until ownership is linked.
- Summer: Observed Facts vs Recommendations; no fabricated actions.

## Empty / loading

- Directory and profile `loading.tsx` → `DashboardSkeleton`
- Appointments, notes, documents, timeline use professional empty states
- Partial data: metrics zero / null when appointment query fails — never invent

## Out of scope (honest limitations)

- Customer package ownership ledger UI
- Phone call logging (future)
- Fabricated VIP spend or fake communications
- Production deploy / shared DB writes / migrations 034–036
