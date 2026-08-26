# Product Tour — PO LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED / LOCKED |
| **SURFACE** | Marketing Website → Product Tour (`/product-tour`) |
| **VERSION** | Product Tour PO lock · 2026-08-26 |
| **STATE** | **Locked** |
| **Approved** | 2026-08-26 |
| **Approved by** | Product Owner |
| **Claude independent audit** | APPROVED — PRODUCT TOUR READY FOR PO LOCK |
| **Branch** | `cursor/marketing-os-positioning` |
| **Approved SHA** | `7bb5e3fba54fe8dc36ae1e94a29196030802dcee` |
| **Approved Preview** | https://chasum-nh8vmcsd8-renovisionappcom.vercel.app |
| **In Production?** | **No.** Do not treat this lock as a Production deploy. `origin/main` / Production pin remains `476af17bfd06113281df0b5c33f995ccb26f5fff`. |

---

## Approval evidence (2026-08-26)

- Cursor implementation/testing complete
- PO rendered video review complete
- ChatGPT visual review complete
- Claude independent read-only audit complete
- Claude verdict: **APPROVED — PRODUCT TOUR READY FOR PO LOCK**
- Claude independently confirmed 91/91 targeted tests
- Claude independently confirmed 378/378 full repository tests
- typecheck PASS
- lint PASS
- build PASS
- no P0 findings
- no P1 findings

This lock identifies the **exact SHA**, **exact surface**, **exact Preview**, **exact date**, and **PO approval status** so this accepted generation cannot be confused with another Preview.

---

## Visual source of truth

Treat this Preview URL as the permanent visual reference for the locked Product Tour:

**https://chasum-nh8vmcsd8-renovisionappcom.vercel.app**

Implementation baseline commit for that Preview: **`7bb5e3fba54fe8dc36ae1e94a29196030802dcee`** (*Focus Product Tour journey on one active stage and quiet the showcase hierarchy.*).

This state lives on **`cursor/marketing-os-positioning`**. It is **not** merged to `main` and is **not** in Production.

---

## What is locked

Preserve:

- “One customer journey. One connected record.”
- Chasum positioned as an AI Business Operating System, not standalone booking software
- seven-stage connected customer journey
- rail + single active-stage detail architecture
- current-generation operating areas: Command Centre, Reception, Customers, Employees, Payments, Reports, Communications, Summer
- “area” terminology rather than “department”
- selector ↔ heading ↔ mock chrome ↔ mock navigation synchronization
- `Chasum · {selected area}` mock chrome
- “Illustrative demo data · not a live tenant”
- current Product Tour showcase hierarchy
- current responsive journey behavior
- final CTA: “This is the operating system your business has been missing.”
- Private Alpha truthfulness
- AI maturity / product-truth boundaries

Do **not** regress Product Tour to:

- Dashboard / Overview
- CRM
- Calendar
- Business
- Billing
- Communication
- AI Workforce
- fake `app.chasum.com` URLs
- seven dense paragraph columns
- scheduler-first positioning

---

## Allowed changes only

Future edits to Product Tour are permitted **only** for:

1. Bug fixes
2. Broken responsive layouts
3. Accessibility fixes
4. Product changes **explicitly requested by the product owner**

**No additional visual polish** without an explicit product-owner request.

---

## Related

- Homepage, Platform, and Meet Summer rendered surfaces from the same 2026-08-26 marketing OS chapter are also **LOCKED** (see [`docs/CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md)). Those locks are **not** in Production.
- Older Summer Onboarding v1 lock (guided discovery, 2026-07-30) remains: [`SUMMER_ONBOARDING_V1_LOCK.md`](./SUMMER_ONBOARDING_V1_LOCK.md).
