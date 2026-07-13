# Chasum Product Principles

## Purpose

This document defines the principles that guide every product decision for Chasum.

Whenever we design a new feature, change the architecture, or prioritize work, it should align with these principles.

These principles take precedence over convenience or short-term shortcuts.

Specialized guidance lives in:

- [17_PLATFORM_PRINCIPLES.md](./17_PLATFORM_PRINCIPLES.md) — architecture, modules, scale
- [18_UX_PRINCIPLES.md](./18_UX_PRINCIPLES.md) — clicks, typing, waiting, design quality
- [19_AI_PRINCIPLES.md](./19_AI_PRINCIPLES.md) — automation, recommendations, truthfulness

---

## 1. Build an AI Business Operating System

Chasum is not just an appointment booking platform.

Our mission is to build the world's most intelligent AI-powered Business Operating System for service-based businesses.

Appointments are only one component of the platform.

See also: [19_AI_PRINCIPLES.md](./19_AI_PRINCIPLES.md), [08_AI_WORKFORCE.md](./08_AI_WORKFORCE.md).

---

## 2. Think Enterprise From Day One

Every feature should be designed so it can scale from solo professional to enterprise organization.

Avoid architectural shortcuts that prevent long-term scalability.

Detailed platform rules: [17_PLATFORM_PRINCIPLES.md](./17_PLATFORM_PRINCIPLES.md).

---

## 3. Every Feature Must Save Time or Increase Revenue

Every feature should answer at least one question:

- Does it save businesses time?
- Does it generate more revenue?
- Does it improve customer experience?
- Does it reduce operational costs?

If not, it should be reconsidered.

---

## 4. Multi-Location Is A Core Feature

Every feature must work for one location, multiple locations, and enterprise organizations.

This should be considered during initial design rather than added later.

Platform detail: [17_PLATFORM_PRINCIPLES.md](./17_PLATFORM_PRINCIPLES.md), [10_MULTI_LOCATION.md](./10_MULTI_LOCATION.md).

---

## 5. Customers Belong To The Business

Customers should have a unified profile.

Their history should follow them across:

- locations
- staff members
- services

Businesses should always have a complete view of each customer.

---

## 6. Easy Migration Wins Customers

Businesses should be able to move from competitors with minimal effort.

Support importing customers, appointments, services, staff, memberships, packages, gift cards, and historical data.

Migration should become one of Chasum's competitive advantages.

See [12_CUSTOMER_MIGRATION.md](./12_CUSTOMER_MIGRATION.md).

---

## 7. Validate With Real Businesses

Every major feature should be tested internally using GVM Baby World Ultrasound before release.

Real workflows should guide product development.

See [02_NORTH_STAR.md](./02_NORTH_STAR.md).

---

## 8. Platform Before Features

Build strong foundations before adding new functionality.

Architecture → Database → Security → Performance → User Experience → Advanced Features.

Full stack: [17_PLATFORM_PRINCIPLES.md](./17_PLATFORM_PRINCIPLES.md).

---

## 9. Subscription Plans Unlock Growth

Every capability should support flexible packaging (locations, users, AI credits, marketing, automation, integrations, storage, reporting).

The platform should support future pricing changes without requiring architectural changes.

See [17_PLATFORM_PRINCIPLES.md](./17_PLATFORM_PRINCIPLES.md), [09_PRICING_AND_PLANS.md](./09_PRICING_AND_PLANS.md).

---

## 10. Decisions Must Be Documented

Every significant product or architectural decision should be recorded in the Decision Log.

Future development should be based on documented reasoning rather than memory.

See [14_DECISION_LOG.md](./14_DECISION_LOG.md).

---

## UX and AI (see dedicated docs)

| Topic | Document |
|-------|----------|
| Every click matters; reduce clicks, typing, waiting | [18_UX_PRINCIPLES.md](./18_UX_PRINCIPLES.md) |
| Beautiful design is a requirement | [18_UX_PRINCIPLES.md](./18_UX_PRINCIPLES.md) |
| AI removes work; recommends actions; never invents data | [19_AI_PRINCIPLES.md](./19_AI_PRINCIPLES.md) |

---

## Long-Term Vision

Chasum will become the AI Operating System for service businesses worldwide.

Businesses should be able to run nearly every aspect of their operations from a single platform, powered by intelligent automation, while maintaining a beautiful and intuitive user experience.

---

## Related

- Vision: [00_VISION.md](./00_VISION.md)
- Strategy: [01_PRODUCT_STRATEGY.md](./01_PRODUCT_STRATEGY.md)
- North star: [02_NORTH_STAR.md](./02_NORTH_STAR.md)
- Platform principles: [17_PLATFORM_PRINCIPLES.md](./17_PLATFORM_PRINCIPLES.md)
- UX principles: [18_UX_PRINCIPLES.md](./18_UX_PRINCIPLES.md)
- AI principles: [19_AI_PRINCIPLES.md](./19_AI_PRINCIPLES.md)
- Design system: [07_DESIGN_SYSTEM.md](./07_DESIGN_SYSTEM.md)
- AI workforce: [08_AI_WORKFORCE.md](./08_AI_WORKFORCE.md)
- Decision log: [14_DECISION_LOG.md](./14_DECISION_LOG.md)
