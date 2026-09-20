# Product Principles

**Status:** Mandatory feature filter  
**Authority:** Every feature must align with these principles before design or code.  
**Parent:** [`CHASUM_BIBLE.md`](./CHASUM_BIBLE.md)

When prioritizing or reviewing work, ask: does this follow the principles below? If not, change the design or drop the feature.

---

## Core outcomes

### 1. Save businesses time

Every feature should reduce admin, clicks, waiting, or context-switching for owners and staff.

**Test:** After using this, does a typical day get shorter or calmer?

### 2. Help businesses make money

Prefer features that fill the calendar, raise show rates, increase rebooking, improve conversion, or unlock higher-value services — without dark patterns.

**Test:** Can we explain the revenue or retention path in one sentence?

### 3. Reduce stress

Front desk and owners are interrupted constantly. Software should lower anxiety: clear states, honest availability, reliable reminders, easy escalations.

**Test:** Does this remove a worry, or create a new one?

### 4. AI should reduce work

AI employees remove repetitive work and recommend next actions. They must not create dashboards of chores, invent data, or demand babysitting.

**Test:** Does AI leave a human with less to do, and a clear approve/skip path?

---

## Experience principles

### 5. Simplicity over complexity

Ship the obvious path first. Advanced options come after the default is excellent.

### 6. Mobile first

Reception, booking assists, and owner checks happen on phones. Layouts and actions must work with thumbs and imperfect connectivity.

### 7. Fast

Perceive speed: quick navigation, lean queries, no unnecessary round-trips, responsive UI feedback.

### 8. Beautiful

Craft matters. Extend the Chasum design system; do not dump generic UI or redesign without intent.

### 9. Accessible

Keyboard, focus, labels, contrast, and readable empty/error states are part of “done.”

### 10. Enterprise ready

Design for single location today and multi-location / multi-business / multi-tenant enterprise tomorrow. Avoid dead-end schemas and one-off hacks.

---

## Platform principles (summary)

- **One operating system** — Departments integrate (CRM ↔ Calendar ↔ Communication ↔ Billing ↔ Reports ↔ AI).
- **Truthful data** — Never invent slots, prices, policies, or customer facts.
- **Owner control** — Automation expands with consent.
- **Extend, don’t redesign** — Preserve visual language unless a redesign is the task.
- **Multi-tenant always** — `business_id`, RLS, location scope.
- **Production bar** — Lint, build, CHANGELOG, commit, push (see [`MASTER_TASKS.md`](./MASTER_TASKS.md)).

---

## Competitive Product Gate

Material customer/operator work must pass a bounded competitive-product review **before implementation**, not after a real tenant discovers an obvious incumbent advantage.

### Applicability

**Required** for material workflows such as booking, Reception, customer communications, payments, invoices/receipts, onboarding, multi-location, staff/team operations, reporting, Commercial SaaS, Summer, mobile, and other experiences a customer or operator uses to run the business.

Normally **not applicable** to documentation-only changes, mechanical refactors, internal maintenance, emergency Production recovery, security fixes where benchmarking is irrelevant, and narrowly bounded bug fixes whose intended behavior is already locked. Control Tower decides ambiguous cases and records the reason.

### Control Tower pre-build contract

For a required gate, Control Tower owns product strategy and records:

- **Feature**
- **User / operator job**
- **Relevant competitors** — only those that materially inform this workflow
- **Competitive evidence** — what mature products currently provide
- **Parity floor** — what Chasum must provide so switching is not a downgrade
- **Current Chasum gap**
- **Chasum advantage** — what we deliberately make better
- **Why would a customer switch?**
- **UX / product contract**
- **Architectural requirements**
- **Out of scope**
- **Launch classification**
- **Pass condition**
- **Competitive gate:** PASS / FAIL / NOT APPLICABLE

Typical research is **2–5 relevant competitors**, using current evidence. ChatGPT Control Tower owns targeted product research; Claude may perform a large-context product audit when useful; Codex implements; Momentic validates workflows; Cursor handles bounded local/authenticated execution or capacity fallback. Do not burn engineering credits on broad competitive exploration.

### Switching test

Ask:

> A business already uses a mature incumbent. If they see the Chasum workflow side by side, why would switching feel like an upgrade?

Credible answers include fewer steps, clearer operation, better mobile use, more complete customer information, stronger financial truth, better multi-location operation, safer automation, faster onboarding/switching, or Summer understanding and acting across the connected business.

“Chasum also has the feature” is not an advantage.

### Acceptance rule

For material customer/operator work, tests and builds passing are necessary but not sufficient. Acceptance must establish:

1. **Does it work and remain reliable?**
2. **Is it simple and responsive?**
3. **Does it meet the parity floor for the normal workflow?**
4. **What is the deliberate Chasum advantage?**
5. **Did the actual workflow validation support the product contract?**

If a mature competitor clearly provides a materially better normal workflow and Chasum has no deliberate reason for the difference, the feature is **not world class yet**. Correct it or explicitly classify the gap and why it is safe to defer.

This gate does **not** mean matching every competitor feature. Essential workflows need credible parity; strategic Chasum differentiators need meaningful advantage; non-strategic breadth may be consciously deferred.

---

## Feature decision checklist

Before building, the feature should pass **at least two** of:

- [ ] Saves time  
- [ ] Makes money  
- [ ] Reduces stress  
- [ ] Improves customer experience  
- [ ] Reduces operational cost  
- [ ] Enables enterprise scale  

And **all** of:

- [ ] Aligns with AI / multi-tenant / UI rules in the Bible  
- [ ] Has loading, empty, and error states  
- [ ] Does not break existing modules unnecessarily  

---

## Related deep docs

- [`../product/16_PRODUCT_PRINCIPLES.md`](../product/16_PRODUCT_PRINCIPLES.md)
- [`../product/17_PLATFORM_PRINCIPLES.md`](../product/17_PLATFORM_PRINCIPLES.md)
- [`../product/18_UX_PRINCIPLES.md`](../product/18_UX_PRINCIPLES.md)
- [`../product/19_AI_PRINCIPLES.md`](../product/19_AI_PRINCIPLES.md)

---

*Chasum Company Operating System — Product Principles*
