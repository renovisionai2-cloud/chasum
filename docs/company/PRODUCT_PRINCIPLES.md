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
