# UX Principles

## Purpose

How Chasum should feel and behave for owners, staff, and clients.

These principles take precedence over decorative complexity. Visual implementation detail lives in [07_DESIGN_SYSTEM.md](./07_DESIGN_SYSTEM.md) and [`../UI_GUIDELINES.md`](../UI_GUIDELINES.md).

---

## 1. Every Click Matters

Owners and clients are busy. Every interaction should earn its place.

Ask of every flow:

- Can this be done in fewer steps?
- Is this click required, or habit from a denser UI?
- Does the next action feel obvious without reading a wall of text?

If a task routinely takes more clicks than a competitor for the same outcome, treat it as a UX defect.

---

## 2. Reduce Clicks

- Prefer progressive disclosure over long wizards when possible.
- Put primary actions where the eye already is.
- Avoid nested confirmations for safe, reversible actions.
- Booking a public appointment should stay under a few clear steps.

---

## 3. Reduce Typing

- Prefill known data (returning customers, last staff, default location).
- Prefer selection (slots, services, locations) over free text when the set is known.
- Support defaults and smart suggestions so owners are not re-entering the same values.
- Capture only what the business needs to deliver the appointment.

---

## 4. Reduce Waiting

- Fast perceived performance: optimistic feedback, clear loading states.
- Never leave the user unsure whether something is saving or booking.
- Dashboard lists and calendars should feel snappy on mobile and desktop.
- Background work (emails, sync) should not block the next owner action.

---

## 5. Beautiful Design Is A Product Requirement

Chasum should feel premium.

Design goals:

- Modern
- Clean
- Elegant
- Fast
- Consistent
- Minimal
- Delightful

Every screen should feel professionally designed — not “good enough for an MVP.”

---

## 6. Honest Surfaces

- Empty states tell the owner what to do next.
- Errors are actionable; booking failures are never silent.
- Public booking should feel like the business’s brand, not a generic demo.
- Feedback always: loading, empty, error, and success on every meaningful action.

---

## Related

- Product principles: [16_PRODUCT_PRINCIPLES.md](./16_PRODUCT_PRINCIPLES.md)
- Design system: [07_DESIGN_SYSTEM.md](./07_DESIGN_SYSTEM.md)
- UI guidelines: [`../UI_GUIDELINES.md`](../UI_GUIDELINES.md)
