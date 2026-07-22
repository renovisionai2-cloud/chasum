# AI Principles

## Purpose

How artificial intelligence should behave inside Chasum.

AI is a core part of the Business Operating System — not a chat novelty. Product vision: [08_AI_WORKFORCE.md](./08_AI_WORKFORCE.md). Top-level product rules: [16_PRODUCT_PRINCIPLES.md](./16_PRODUCT_PRINCIPLES.md).

---

## 1. AI Should Remove Work

Artificial intelligence should automate repetitive work so owners and staff spend time on service delivery, not admin.

Examples:

- answering calls
- booking appointments
- reminders
- follow-ups
- marketing
- scheduling
- reporting
- forecasting
- customer communication

AI should simplify operations rather than add complexity, dashboards of noise, or extra steps to “use AI.”

---

## 2. AI Should Become Smarter Over Time

- Learn from real outcomes: completed appointments, no-shows, cancellations, preferred staff, busy hours.
- Improve recommendations with usage — not static rules alone.
- Prefer measurable improvement (fewer no-shows, faster booking, less owner time) over flashy demos.
- Respect privacy and tenant boundaries while improving models or heuristics.

---

## 3. AI Should Recommend Actions, Not Just Record Data

Chasum’s AI should help the business **do** the next right thing:

- Suggest open slots, follow-ups, or reminder timing
- Flag at-risk appointments or underused capacity
- Draft communications the owner can approve
- Surface insights that lead to a clear action

Recording history is table stakes. Intelligence means proposing and, when authorized, executing work.

---

## 4. AI Should Never Invent Availability or Business Data

- Slot suggestions and bookings must use the same scheduling engine as humans (`get_available_slots`, `validate_appointment_slot`).
- AI must never invent free times, customers, prices, or appointments.
- When uncertain, ask or refuse — do not hallucinate business truth.
- Automation is measured by completed appointments and fewer no-shows, not by message volume.

---

## Related

- Product principles: [16_PRODUCT_PRINCIPLES.md](./16_PRODUCT_PRINCIPLES.md)
- AI workforce: [08_AI_WORKFORCE.md](./08_AI_WORKFORCE.md)
- Architecture (scheduling engine): [05_ARCHITECTURE.md](./05_ARCHITECTURE.md)
- OS kernel (events, memory, money SSoT): [22_OS_KERNEL.md](./22_OS_KERNEL.md)
- Platform principles: [17_PLATFORM_PRINCIPLES.md](./17_PLATFORM_PRINCIPLES.md)
- Company memory: [../../COMPANY_MEMORY.md](../../COMPANY_MEMORY.md)
