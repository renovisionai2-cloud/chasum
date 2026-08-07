# World Class — Customer Workspace Data Dictionary

**Branch:** `cursor/world-class-portal-foundation`  
**Routes:** `/dashboard/clients`, `/dashboard/clients/[id]`  
**Engines:** unchanged — booking / payment / invoice / receipt / communication loaders preserved  

---

## Metric definitions

| Term | Definition | Source type |
|------|------------|-------------|
| **Active customer** | `crm_status` is `active` or legacy `vip` | Persisted CRM status |
| **Inactive customer** | `crm_status` is `inactive` | Persisted CRM status |
| **Lead** | `crm_status` is `lead` | Persisted CRM status |
| **Archived** | `crm_status` is `archived` | Persisted CRM status |
| **VIP** | `is_vip = true` **or** legacy `crm_status = vip` | Derived segment (+ legacy persisted status) |
| **New** | Created within last 30 days (quick filter) | Derived |
| **New this month** | `created_at` falls in current calendar month | Derived |
| **Recent** | `last_activity_at` (or `updated_at`) within last 7 days | Derived |
| **Balance due** | Directory `outstanding_balance_cents` &gt; 0 from appointment price − net paid | Derived appointment data |
| **Returning this month** | ≥2 completed visits **and** `last_visit_at` in current month | Derived appointment data |
| **Average spend (directory)** | Not loaded from commerce for the full directory | **Unavailable** (must not show `$0`) |
| **Avg transaction (profile)** | Mean of succeeded commerce timeline amounts | Commerce ledger |
| **Outstanding (profile payment summary)** | `CustomerCommerceAccount.outstandingBalanceCents` | Commerce ledger |
| **Outstanding (directory)** | Sum of unpaid appointment balances for the customer | Derived appointment data |
| **Collected** | Gross payments collected (`totalPaidCents`) | Commerce ledger |
| **Deposit** | Deposits paid on the commerce account | Commerce ledger |
| **Open invoice** | Invoice status in `open` / `partial` / `overdue` | Commerce ledger |
| **Completed service list value** | Sum of completed appointment service list prices (insights `lifetimeRevenue` field name legacy) | Derived appointment data — **not revenue**, **not** payments collected |
| **Cancellation rate** | Cancelled ÷ (completed + cancelled + no-show) | Derived appointment data |
| **No-show rate** | No-show ÷ (completed + cancelled + no-show) | Derived appointment data |
| **Returning customer** | Used in overview as “Returning this month” when visit history supports it | Derived |

## Balance consistency

| Surface | Calculation |
|---------|-------------|
| Directory Outstanding | Appointment-derived unpaid balance (may exist before invoices) |
| Profile Payment summary Outstanding | Commerce ledger outstanding |
| Billing “Outstanding balance” | Same commerce account as payment summary |
| Billing “Remaining balance” | Commerce remaining (may differ when deposits / store credit apply) |
| Invoice Balance | Per-invoice `balanceCents` from commerce |

These may differ. Do not silently merge appointment-derived and invoice balances.

## CRM status vs segments (UI)

**Persisted CRM status filter / edit:** Lead, Active, Inactive, Archived (+ legacy VIP status kept in edit for stored rows).

**Derived quick segments:** VIP, New, Recent, Balance due.

## Recommendations vs facts

| Kind | Rule |
|------|------|
| Observed facts | Only from customer, appointment, communication, commerce records |
| Recommendations | Optional suggestions; never auto-executed; require staff approval |
| Unavailable | Missing calculation — never display as verified `0` / `$0` |
