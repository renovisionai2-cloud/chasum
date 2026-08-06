# World Class Implementation Blueprint

**Program:** Chasum World Class Execution Program  
**Chapter:** 0 — Repository and Product Audit  
**Branch:** `cursor/world-class-portal-foundation`  
**Head at audit:** `0496196` (docs) · shell `d86e398` · Production baseline `4eecbec` / `phase-0-gvm-production-2026-08-04`  
**Mode:** Audit — no Production deploy, no migrations 034–036, no live data changes  

---

## Golden rule

**Protect the core engine; improve the experience.**

Phase 0 GVM workflows (assigned-employee booking, exclusive tax, deposits, receipts, confirmations, business notifications, timezone, resend) are stable. World Class work improves shell, clarity, parity honesty, and workflows without rewriting financial/email/calendar engines.

---

## Sources of truth

| Source | Role |
|--------|------|
| `docs/CURRENT_PROJECT_STATE.md` | Session handoff (refresh carefully) |
| `docs/company/CHASUM_BIBLE.md` | Constitution |
| `docs/marketing/PRODUCT_TRUTH_MATRIX.md` | Public claim authority |
| Marketing locks (`*_V1_LOCK.md`) | Frozen marketing pages — claim fixes need PO |
| `docs/product/23_DESIGN_SYSTEM_V1.md` | UI contract |
| `lib/dashboard/nav.ts` | Phase 1 portal IA (already shipped on branch) |
| This blueprint + Chapter 0 matrices | World Class execution plan |

---

## What already exists on this branch

| Commit | Content |
|--------|---------|
| `6019630` | Chapter 1-style foundation audit docs (prior naming) |
| `d86e398` | Portal shell IA, command entry, terminology, mobile nav |
| `0496196` | Phase 1 Preview deployment report |

**Note on numbering:** Prior docs called portal shell “Phase 1.” This Execution Program calls the **audit** Chapter 0 and **design system + foundation** Chapter 1. Shell work already delivered maps to **Execution Chapter 1 (partial)** — remaining Chapter 1 work is formalizing DS tokens/components and finishing foundation gaps from the audit matrices.

---

## Protected Phase 0 systems (do not regress)

| System | Primary paths |
|--------|----------------|
| Financials | `lib/commerce/booking-financials.ts`, `edit-booking-payment-summary.ts` |
| Receipts / payments | `lib/commerce/receipts.ts`, `payments.ts`, `invoices.ts` |
| Notifications | `lib/notifications/booking-delivery.ts`, `lib/actions/notification-retry.ts` |
| Timezone | `lib/communications/appointment-datetime.ts`, `lib/locale.ts` |
| Email branding | `lib/communications/tenant-email-branding.ts` |

---

## Database policy

| Migrations | Policy |
|------------|--------|
| ≤033 (incl. commerce 030/031, Private Alpha 032/033) | Already part of Production lineage where applied — do not rewrite history |
| **034, 035, 036** | **Do not apply** without explicit PO approval (optional staff, intervals, resources) |

Preview and Production **share Supabase** — no experimental schema on shared DB.

---

## Execution chapters (this program)

| Ch | Name | Status after Chapter 0 |
|----|------|------------------------|
| 0 | Repository and product audit | **This deliverable** |
| 1 | Design system and portal foundation | Shell largely done (`d86e398`); formalize DS + remaining foundation |
| 2 | Command Centre | Not started |
| 3 | Reception and calendar | Not started (preserve engine) |
| 4 | Customers | Not started |
| 5 | Appointment workspace | Not started |
| 6 | Sales, payments, invoices, receipts | Not started (preserve Phase 0 math) |
| 7 | Communications | Not started |
| 8 | Employees and team | Not started |
| 9 | Business setup and settings | Not started |
| 10 | Business intelligence | Not started |
| 11 | Growth and retention | Not started |
| 12 | Summer AI Business Manager | Not started |
| 13 | Marketing parity completion | Matrix started in Chapter 0 |
| 14 | Industry readiness | Matrix started in Chapter 0 |
| 15 | Full platform QA | Not started |

Each chapter: audit → implement → test → Preview → report → **stop for review**.

---

## Critical risks discovered in Chapter 0

1. **Marketing vs Truth:** “Online Payments,” Inventory on Business plan, Summer “Available Today,” Memberships “Coming Soon” vs live hub, Multi-location “Future Vision” vs live.  
2. **Entitlements:** Staff limits claimed but uncapped; many Pro features not gated on Free; Business locations claim 6 vs catalog 10.  
3. **AI theatre:** Placeholder AI workforce roles; Summer automation language overreaches Early Access.  
4. **Dormant fake social proof** in `lib/marketing/homepage.ts` (unused on live `/` but dangerous if remounted).  
5. **Shared DB** — Preview experiments can affect Production data if write paths are used carelessly.

---

## Companion Chapter 0 documents

- [`WORLD_CLASS_DESIGN_SYSTEM.md`](./WORLD_CLASS_DESIGN_SYSTEM.md)  
- [`WORLD_CLASS_ROUTE_AND_NAVIGATION_MAP.md`](./WORLD_CLASS_ROUTE_AND_NAVIGATION_MAP.md)  
- [`WORLD_CLASS_MARKETING_PRODUCT_PARITY.md`](./WORLD_CLASS_MARKETING_PRODUCT_PARITY.md)  
- [`WORLD_CLASS_PLAN_ENTITLEMENT_MATRIX.md`](./WORLD_CLASS_PLAN_ENTITLEMENT_MATRIX.md)  
- [`WORLD_CLASS_INDUSTRY_READINESS_MATRIX.md`](./WORLD_CLASS_INDUSTRY_READINESS_MATRIX.md)  
- [`WORLD_CLASS_TESTING_MATRIX.md`](./WORLD_CLASS_TESTING_MATRIX.md)  
- [`WORLD_CLASS_RELEASE_LOG.md`](./WORLD_CLASS_RELEASE_LOG.md)  

---

## Next step after review

Begin **Execution Chapter 1** only after PO approval of these matrices: formalize DS documentation against `23_DESIGN_SYSTEM_V1`, close remaining shell gaps, **do not** redesign Command Centre (Chapter 2) yet.
