# OS Kernel Architecture

**Status:** Foundation for the AI Business Operating System  
**Parent:** [`COMPANY_MEMORY.md`](../../COMPANY_MEMORY.md), [`CHASUM_BIBLE.md`](../company/CHASUM_BIBLE.md)  
**Related:** [`05_ARCHITECTURE.md`](./05_ARCHITECTURE.md), [`19_AI_PRINCIPLES.md`](./19_AI_PRINCIPLES.md)

This document describes the **kernel** layers that every module and future AI employee must use. It is intentionally thin — architecture, not product features.

---

## Why this exists

Operation GVM exposed conflicting money math, duplicated day boundaries, and siloed “snapshots” for Summer vs Chase. The Foundation Sprint locks one business brain before more AI surface area.

**Rule:** Prefer shared helpers over local formulas. Prefer events over silent side effects. Prefer request cache over duplicate fetches.

---

## One Business Brain

| Domain | Source of truth |
|--------|-----------------|
| Scheduling / slots | Booking Engine + Postgres RPCs |
| Money recognition | `lib/commerce/recognize.ts` |
| Money display | `lib/commerce/money.ts` + `components/ui/money.tsx` |
| Customer billing aggregate | `lib/commerce/customer-account.ts` |
| Reports KPIs | `lib/reports/compute.ts` (uses recognize) |
| Business memory | `lib/business/context.ts` |

If a customer books, pays, or completes an appointment, CRM billing, dashboards, and reports must reflect the **same** recognition rules.

---

## Event layer (AI-ready)

```
Booking mutations ──▶ booking-engine/events ──┐
                                              ├──▶ lib/os/events (platform bus)
Commerce writes ────▶ commerce/events ────────┘
```

| Bus | Path | Examples |
|-----|------|----------|
| Booking | `lib/booking-engine/events/` | `appointment.created`, `cancelled`, `completed` |
| Commerce | `lib/commerce/events.ts` | `payment.received`, `deposit.received`, `invoice.generated`, `gift_certificate.sold` |
| Platform | `lib/os/events.ts` | Unified vocabulary + `PLATFORM_EVENT_CATALOG` |

**Not built yet:** durable outbox, Redis, AI subscribers. The in-process buses are the contract Summer and Chase will attach to.

---

## Business memory

`getBusinessOperatingContext()` returns a read-only snapshot:

- Profile (currency, language, locale, timezone, brand, logo)
- Policies and communication preferences
- Locations, services, packages, employee counts
- Active location scope

Use `businessContextToPromptBlock()` for grounded prompt text. **No AI calls** live in this module.

---

## International foundation

| Concern | Module |
|---------|--------|
| Locale (BCP-47) | `lib/locale.ts` |
| Business-day boundaries | `lib/business/datetime.ts` |
| Currencies | `lib/commerce/money.ts` |

Translations / message catalogs are deferred. Formatters are ready for global expansion.

---

## Performance

Request-level React `cache()` on:

- `getOrCreateBusiness` / location scope (existing)
- `getReportsBundle`
- `loadBusinessKnowledge`
- `getBusinessOperatingContext`

Chase / dashboard / reports in one RSC tree should not triple-fetch the same aggregations.

---

## Design system (responsive)

Primitives in `components/ui/` — Dialog, Sheet, Table, Button, Money, EmptyState, etc.

Foundation polish:

- Safe-area aware dialogs
- Touch-friendly control heights
- Horizontal table scroll on narrow viewports
- `.ds-page`, `.ds-table-scroll`, `.ds-form-stack`, `.ds-safe-pad` utilities

---

## Decision log

| Decision | Why |
|----------|-----|
| Recognize revenue on completed **or** paid | GVM books/pays without always marking completed |
| Commerce events separate from audit log | Audit is durable history; events are reactive OS signals |
| Context facade over merging Summer+Chase | Avoid rewriting AI; give them one memory shape first |
| No i18n catalogs yet | Global-ready formatters without premature translation debt |

---

*Foundation Sprint — AI Operating System kernel.*
