# AI Workforce

**Status:** Strategic vision (long-term)  
**Audience:** Product, founders, partners — not an engineering spec  
**Related:** [08_AI_WORKFORCE.md](./08_AI_WORKFORCE.md) (earlier agent sketch), [19_AI_PRINCIPLES.md](./19_AI_PRINCIPLES.md)

---

# Purpose

Chasum is evolving beyond scheduling software into an **AI Business Operating System**.

Service businesses today juggle calendars, clients, staff, marketing, and growth across disconnected tools. Chasum’s long-term purpose is to become the single operating layer where owners manage **both human employees and AI employees** — with shared context, clear responsibilities, and measurable outcomes.

Appointments are foundational and remain critical. They are also **only one part of the vision**. The AI Workforce extends Chasum from “book and remind” into “run and grow the business every day.”

---

# Vision

Imagine a studio or clinic where the owner opens Chasum and sees not only today’s schedule, but a coordinated team of AI employees already working:

- The receptionist has answered common questions and filled open slots.
- The scheduler has protected buffers and reduced no-show risk.
- Customer success has reminded clients with the right prep instructions.
- Marketing has followed up after visits without sounding spammy.
- The revenue coach has flagged quiet days and suggested offers the owner can approve.
- The business advisor has summarized what worked this week — and why.

These AI employees work **alongside** business owners and staff. They do not replace the human craft of the service. They remove operational drag so people can focus on clients.

Over time, a proactive AI Workforce — that recommends, explains, and improves — becomes one of Chasum’s **largest competitive advantages**: harder to copy than a calendar UI, and more valuable every month the business stays on the platform.

---

# AI Workforce Principles

1. **AI removes work instead of creating work.**  
   If an AI feature adds dashboards, alerts, or chores without saving time, it is not ready.

2. **AI recommends actions instead of only recording information.**  
   Insight without a next step is incomplete. Prefer “do this / approve this / skip this.”

3. **AI never invents business data.**  
   Availability, prices, policies, hours, and client history come from Chasum’s system of record — never hallucinated.

4. **AI explains why it made a recommendation.**  
   Owners should understand the reason in plain language before they trust automation.

5. **Business owners remain in control.**  
   Policies, approvals, and kill-switches stay with the owner. Autonomy expands only with consent.

6. **Every AI employee has a clear responsibility.**  
   No vague “assistant that does everything.” Named roles, clear scope, clear success metrics.

7. **AI workers collaborate with each other when appropriate.**  
   Handoffs should feel like a well-run team, not isolated chatbots.

8. **AI should improve over time through business context and configuration.**  
   Industry, services, location hours, tone, and outcomes make each workforce smarter for *that* business — without requiring a separate product per vertical.

---

# Initial AI Employees

The first wave of the AI Workforce is six named employees. Each can ship in stages (assist → automate → collaborate) while sharing the same principles and data foundation.

---

## Emma — AI Receptionist

### Purpose

Be the always-on front desk: greet, answer common questions, capture interest, and route clients toward booking — without inventing answers the business has not configured.

### Primary responsibilities

- Respond to booking-page and messaging inquiries with business-approved FAQs
- Collect client contact details and intent (service, preferred times)
- Guide clients into the public booking flow or waitlist
- Escalate edge cases to a human (clinical questions, complaints, special requests)

### Future capabilities

- Multi-channel reception (web chat, SMS, eventually voice)
- Language preference and accessibility-aware communication
- Location-aware answers for multi-site businesses
- Soft qualification (e.g., gestational window for ultrasound) using configured rules only

### Success metrics

- Inquiry → booking conversion
- Time-to-first-response
- Escalation rate (healthy escalation is good; invented answers are not)
- Client satisfaction with first contact

### Interactions with other AI employees

- Hands qualified demand to **Alex** (Scheduler) for slot optimization
- Passes new clients to **Leo** (Customer Success) for confirmation and prep
- Surfaces recurring FAQ gaps to **Maya** (Business Advisor) and **Olivia** (Marketing)

---

## Alex — AI Scheduler

### Purpose

Protect the calendar: fill the right slots with the right services, respect buffers and staff capacity, and reduce double-booking and idle gaps — always through Chasum’s scheduling engine.

### Primary responsibilities

- Propose available times from real availability (never invented openings)
- Optimize packing of the day within owner-defined rules
- Suggest waitlist fills when cancellations free capacity
- Flag schedule risk (overbooked days, underutilized staff, buffer violations)

### Future capabilities

- Natural-language booking for owners and staff (“Fill Friday afternoon with gender reveals”)
- Smart reschedule proposals when clients cancel
- Multi-location load balancing within plan limits
- Preference learning within configured constraints (not medical advice)

### Success metrics

- Utilization rate (booked vs. available)
- No-show and late-cancel impact after interventions
- Time from inquiry to confirmed appointment
- Zero invented slots / zero engine bypasses

### Interactions with other AI employees

- Receives demand from **Emma**
- Triggers **Leo** for reminders and prep after confirmations
- Feeds utilization patterns to **Ethan** (Revenue) and **Maya** (Advisor)

---

## Maya — AI Business Advisor

### Purpose

Turn Chasum activity into clear weekly guidance: what happened, what it means, and what to do next — so owners spend less time guessing.

### Primary responsibilities

- Summarize appointments, revenue from completed visits, no-shows, and new clients
- Highlight anomalies (quiet days, rising cancellations, hotspot services)
- Recommend a short prioritized action list for the owner
- Explain recommendations with evidence from the business’s own data

### Future capabilities

- Goal tracking (e.g., weekly completed appointments north star)
- Location and staff comparisons for multi-site operators
- Scenario planning (“If you add Saturday hours…”) using historical patterns
- Industry benchmarks when enough anonymized cohort data exists

### Success metrics

- Owner weekly engagement with advisor summaries
- Actions accepted vs. dismissed
- Improvement on accepted recommendations over time
- Time saved vs. manual reporting

### Interactions with other AI employees

- Consumes outcomes from **Alex**, **Leo**, **Olivia**, and **Ethan**
- Suggests campaigns for **Olivia** and coaching focus for **Ethan**
- Informs policy questions that **Emma** should answer consistently

---

## Olivia — AI Marketing Manager

### Purpose

Help the business stay top-of-mind and fill the funnel ethically — using real client and service context, not spray-and-pray messaging.

### Primary responsibilities

- Suggest post-visit follow-ups and seasonal campaigns tied to services
- Draft message copy for owner approval (tone matched to brand settings)
- Identify underbooked windows worth promoting
- Track which outreach correlates with bookings (attribution within Chasum)

### Future capabilities

- Review request workflows after completed appointments
- Social content drafts grounded in real service catalog
- Segmented offers (e.g., first-time vs. returning clients)
- Multi-location campaign variants

### Success metrics

- Campaign → booking conversion (approved sends only)
- Opt-out / complaint rate
- Fill rate for targeted quiet windows
- Owner approval latency (drafts should be easy to accept)

### Interactions with other AI employees

- Triggers after **Leo** confirms a completed visit journey
- Coordinates with **Ethan** on upsell timing
- Reports results to **Maya**

---

## Leo — Customer Success Manager

### Purpose

Make every booked visit feel cared for: confirmations, reminders, preparation, and recovery when plans change — reducing no-shows and anxiety.

### Primary responsibilities

- Send confirmations and reminders through configured channels
- Attach service-specific prep instructions (from real service data)
- Handle reschedule/cancel intents within policy
- Spot clients who may need a human touch (repeat no-shows, complaints)

### Future capabilities

- Personalized reminder timing based on historical show rates
- Intake / questionnaire collection before the visit
- Post-visit satisfaction check-ins
- Waitlist nurturing with respectful cadence

### Success metrics

- No-show rate before vs. after Leo interventions
- Reminder delivery success
- Reschedule completion without owner intervention (within policy)
- Client-reported clarity of prep instructions

### Interactions with other AI employees

- Activated when **Alex** / booking confirms an appointment
- Hands completed visits to **Olivia** and **Ethan** for appropriate follow-up
- Escalates policy or edge cases toward human staff and **Maya** insights

---

## Ethan — Revenue Coach

### Purpose

Help the business earn more from capacity it already has — through packaging, timing, and upsell suggestions the owner controls — never by inventing prices.

### Primary responsibilities

- Identify underused capacity and high-demand services
- Suggest add-ons and package pairings from the real catalog
- Flag pricing/configuration inconsistencies for owner review
- Recommend focus weeks (e.g., promote a slow service) with expected rationale

### Future capabilities

- Package and membership recommendations
- Location-level revenue coaching for multi-site plans
- Experiment design (A/B offers) with clear stop rules
- Integration with future billing / deposits features

### Success metrics

- Revenue per available hour
- Attach rate for approved upsell prompts
- Quiet-slot fill after coach campaigns
- Owner trust (accepted vs. overridden suggestions)

### Interactions with other AI employees

- Uses schedule health from **Alex** and visit completion from **Leo**
- Partners with **Olivia** on offer messaging
- Rolls results into **Maya**’s advisory loop

---

# Future AI Workforce

As Chasum expands, additional AI employees will join the same framework. Reserved roles include:

| Future AI employee | Focus (product intent) |
|--------------------|------------------------|
| **Inventory Manager** | Consumables, kits, and stock tied to services |
| **Operations Manager** | Day-of runbooks, room/equipment readiness |
| **HR Manager** | Staffing patterns, time-off coordination (non-legal) |
| **Financial Advisor** | Cashflow views, deposits, payout readiness |
| **Compliance Manager** | Policy checklists and audit-friendly logs |
| **Training Coach** | Onboarding staff to Chasum workflows |
| **Quality Assurance Manager** | Service consistency and client outcome signals |
| **Sales Manager** | Outbound and inbound pipeline for high-ticket services |
| **Review Manager** | Reputation and review response workflows |
| **Social Media Manager** | Channel-specific content grounded in real offerings |
| **Franchise Manager** | Cross-location standards and brand consistency |
| **Enterprise Operations Manager** | Org-wide controls for large multi-site operators |

**Note:** Additional AI employees will be added as Chasum expands into new industries and as subscription tiers unlock deeper automation. Roles stay configuration-driven — not one-off products per vertical.

---

# Industry Adaptation

The AI Workforce is a **shared framework**. Industry fit comes from configuration, catalogs, policies, and tone — not from forked products.

Examples of the same employees, differently configured:

| Industry | Example configuration emphasis |
|----------|--------------------------------|
| **Medical / wellness** | Strict FAQs, intake forms, compliance-minded reminders |
| **Automotive** | Bay/technician capacity, service packages, wait estimates |
| **Beauty** | Stylist preferences, add-on retail, rebooking cadence |
| **Fitness** | Class capacity, memberships, no-show policies |
| **Home services** | Travel windows, job duration buffers, on-site prep |
| **Professional services** | Consultation types, document intake, follow-up tasks |
| **Education** | Sessions, cohorts, parent/student communications |
| **Pet care** | Pet profiles, vaccine notes (owner-provided), visit types |
| **Hospitality** | Party size, experiences, seasonal demand |

GVM Baby World Ultrasound is the first deep design partner; the workforce design must generalize beyond elective ultrasound without losing vertical excellence.

---

# AI Collaboration

AI employees should hand off work like a real team. A typical journey:

```
Emma (Receptionist) books / qualifies demand
        ↓
Alex (Scheduler) optimizes the calendar
        ↓
Leo (Customer Success) sends confirmations & reminders
        ↓
Olivia (Marketing) follows up after the visit
        ↓
Ethan (Revenue Coach) identifies upsell opportunities
        ↓
Maya (Business Advisor) reports results and next actions
```

Collaboration rules:

- Each handoff carries **structured context** (client, service, location, appointment) — not vague chat history alone.
- Downstream employees may **propose** actions; owner policy decides what runs automatically.
- Conflicts (e.g., marketing wants a blast on a closed holiday) defer to system data and owner settings.
- Collaboration is visible in an audit-friendly activity trail so humans can trust the team.

---

# Subscription Strategy

Different subscription plans unlock different AI employees and advanced capabilities. Exact packaging will evolve; pricing should remain **configurable** (plan catalog / entitlements), not hard-coded in product logic.

Illustrative ladder:

| Plan | AI Workforce intent |
|------|---------------------|
| **Starter** | Core assistance — e.g., Leo reminders + light Emma help on the booking page |
| **Professional** | Scheduling intelligence — Alex + deeper Leo automation |
| **Growth** | Growth loop — Olivia + Ethan with owner approval workflows |
| **Enterprise** | Full collaboration — Maya across locations, advanced controls, future franchise/enterprise roles |

Principles for packaging:

- Unlock **roles and autonomy levels**, not mystery “AI credits” without clarity
- Higher tiers earn more **proactive** behavior and cross-employee collaboration
- Multi-location and enterprise plans align AI workforce limits with [09_PRICING_AND_PLANS.md](./09_PRICING_AND_PLANS.md) and [11_ENTERPRISE.md](./11_ENTERPRISE.md)

---

# Long-Term Roadmap

The AI Workforce matures in layers:

```
AI Assistance
     ↓
AI Automation
     ↓
AI Collaboration
     ↓
AI Decision Support
     ↓
Autonomous Business Operations
```

| Stage | What it means for owners |
|-------|--------------------------|
| **AI Assistance** | Drafts, suggestions, explanations — human executes |
| **AI Automation** | Trusted tasks run within policy (reminders, waitlist notify) |
| **AI Collaboration** | Named employees hand off work across the journey |
| **AI Decision Support** | Prioritized recommendations with clear rationale and impact |
| **Autonomous Business Operations** | Broader day-to-day ops run with oversight, audit, and easy override |

Progression is earned with reliability, explainability, and owner confidence — not rushed for demo theater.

---

# North Star

Chasum’s goal is not simply to become the best scheduling platform.

**Our goal is to become the world’s leading AI Business Operating System for service-based businesses.**

Appointments are only the first step.

The AI Workforce will eventually help businesses **operate, grow, and make better decisions every day** — with humans and AI employees working from one platform, one source of truth, and one shared standard of trust.
