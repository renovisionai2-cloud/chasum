# Chasum Blueprint — AI Business Operating System

**Status:** Product blueprint (Phase 1)  
**Scope:** Documentation and architecture vision only — no implementation, database, API, or UI work in this sprint.

## Purpose

Chasum’s long-term vision is to become the world’s best **AI Business Operating System** for appointment-based service businesses — ultrasound studios, salons, clinics, spas, and similar operators whose revenue runs through booked time, people, and relationships.

Today Chasum stores and operates the business. Over time it must **understand** the business, surface the right decision on every screen, and compound that understanding year after year through shared business memory and a connected knowledge graph.

This document defines that destination. It does not prescribe schemas, models, or shipping dates.

---

## 1. The Business Brain

Chasum should evolve from a system that **stores business data** into a system that **understands the business**.

Storage answers: *What happened?*  
Understanding answers: *What does this mean for the business — and what should we do next?*

### Future capabilities

The Business Brain should eventually be able to:

- Understand **revenue changes** — not only totals, but why revenue moved up or down
- Understand **employee performance** — patterns of utilization, rebooking, and service quality signals
- Identify **best-selling services and packages**
- Identify **inactive customers** who used to book and stopped
- Identify **successful marketing campaigns** versus noise
- Identify **underbooked days** and empty capacity
- Identify **highest-value customers** by lifetime contribution and relationship strength

### Understanding vs reporting

This is **business understanding**, not reporting.

| Reporting | Business understanding |
|-----------|------------------------|
| Charts and tables of what occurred | Interpretation of what those facts imply |
| Metrics the owner already has to interpret | Meaning attached to change, risk, and opportunity |
| Historical snapshot | Continuous model of how *this* business behaves |
| Leaves the decision to the human alone | Frames the next useful action |

Reports remain necessary. The Business Brain sits above them: it turns operational truth into judgment the operator can act on.

---

## 2. Decision Driven Screens

Every primary screen should answer **one business question**. If a screen cannot state its question in one sentence, it is not finished.

| Screen | Business question |
|--------|-------------------|
| **Dashboard** | What should I focus on today? |
| **CRM** | What should I know before speaking with this customer? |
| **Calendar** | How can I maximize today’s schedule? |
| **Reports** | What changed? |
| **Marketing** | Who should I contact today? |
| **Employees** | Who needs coaching? |

### Design implications (vision only)

- Lead with the answer to the question; secondary detail supports it.
- Avoid dumping every metric into every view.
- Prefer one clear focus over many competing callouts.
- When AI assists later, it must serve the same question the screen owns — not invent a second agenda.

---

## 3. AI Roles

Future AI in Chasum is **role-specific**, not a single generic chatbot over the product.

### Reception AI

Handles front-of-house work: booking conversations, reschedules, FAQs, reminders, and polite escalation when judgment or policy requires a human.

### Manager AI

Supports day-to-day operations: schedule health, staffing pressure, no-show risk, service mix, and coaching cues for the floor.

### Owner AI

Speaks to the whole business: revenue direction, capacity, growth levers, risk, and priorities across locations when applicable.

### Marketing AI

Focuses on who to reach, when, and why — reactivation, packages, promotions, and campaign learnings grounded in real booking outcomes.

### Future expansion

Additional roles may appear as the OS deepens (e.g. finance-oriented or multi-location coordinator assistants). New roles must still attach to the same Business Brain.

### One brain, different permissions

All AI roles **share one Business Brain**. They differ by **permissions, scope, and voice**:

- Same underlying understanding of customers, schedule, money, and history
- Different access to sensitive actions and data
- Different defaults for what they propose versus what they may execute

No role becomes a separate silo of “truth.” Permission boundaries enforce safety; the brain preserves coherence.

---

## 4. Business Memory

Chasum should maintain **long-term business learning** — memory of how this business behaves across seasons and years, not only the last thirty days of rows.

### Examples of what memory retains

- **Seasonal promotions** — what ran, when, and what booking or revenue response followed
- **Gift certificates** — issuance, redemption patterns, and lift around holidays or campaigns
- **Package trends** — which bundles sell, renew, or stall
- **Customer behaviour** — visit cadence, preferred services, cancellation habits, referral tendencies
- **Marketing history** — channels, offers, audiences, and outcomes
- **Business habits** — how the owner actually runs the shop (hours flex, favorite staff pairings, typical promo rhythm)

### Compounding intelligence

Chasum should become **smarter every year** for each business:

- Year one: accurate operations and clean history
- Year two: recognized seasonality and repeatable playbooks
- Year three and beyond: stronger predictions, sharper priorities, and fewer repeated mistakes

Memory is not a dump of logs. It is curated, business-meaningful learning that the Business Brain and AI roles can reuse.

---

## 5. Business Knowledge Graph

Future AI reasoning depends on a **connected business graph** — entities linked by real operational relationships, not isolated tables viewed in isolation.

Conceptual chain (illustrative, not a schema):

```text
Customer
  ↓
Appointments
  ↓
Packages
  ↓
Employees
  ↓
Revenue
  ↓
Marketing
  ↓
Reviews
  ↓
Referrals
  ↓
Gift Cards
  ↓
Invoices
  ↓
Business Health
```

### Why this matters

- A customer is not only a CRM row; they sit inside appointments, packages, spend, campaigns, and referrals.
- Revenue is not only a ledger total; it is the outcome of people, time, offers, and trust.
- Business health is not a single KPI; it is the emergent state of the whole graph.

This graph is the **foundation for future AI reasoning**: explanations, recommendations, and role-specific assistants must traverse these connections rather than guess from a single screen’s local data.

---

## Out of scope for Blueprint Phase 1

- No new features
- No UI changes
- No AI implementation
- No changes to Summer or Chase
- No database migrations
- No new APIs

Subsequent phases may translate this blueprint into principles, specs, and eventually systems. Until then, this document is the product north reference for the AI Business Operating System destination.
