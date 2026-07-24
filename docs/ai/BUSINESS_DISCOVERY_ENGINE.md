# Business Discovery Engine

**Status:** Phase 4 — marketing website Summer  
**Scope:** Public Chasum marketing website only (`lib/website-concierge`).  
**Not in scope:** Authenticated app, CRM, Dashboard, Calendar, Commerce, Reception, Reports, GVM, OpenAI.

## Purpose

Transform Summer from a reactive FAQ concierge into an **AI Business Consultant** that:

1. Proactively discovers the visitor's business
2. Understands challenges and goals
3. Personalizes recommendations via the Knowledge Engine
4. Offers a personalized product tour

The objective is not merely to answer questions — it is to **understand the business**.

## The Summer Principle

Discovery turns must follow [`SUMMER_PRINCIPLE.md`](./SUMMER_PRINCIPLE.md):

**Understand → Explain → Ask → Think → Recommend → Confirm → Continue**

Never ask a bare question. Each discovery field includes `why`, `helps`, and `willDo`, composed by `formatDiscoveryAsk()`.

## Architecture

```
Visitor message
      │
      ▼
┌─────────────────────────────┐
│  Business Discovery Engine  │  lib/website-concierge/discovery/
│  extract → branch → ask/rec │
└─────────────┬───────────────┘
              │
     owns turn? ──yes──► consultant reply (question / recs / tour offer)
              │
             no
              ▼
┌─────────────────────────────┐
│     Knowledge Engine        │  retrieve + compose
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│  Prompt Builder + Provider  │  provider-agnostic (placeholder today)
│  Registry                   │
└─────────────────────────────┘
              ▼
         Session Memory
```

Continues to use:

| Layer | Role |
|-------|------|
| Knowledge Engine | Product truth + personalized tour content |
| Session Memory | Discovery profile + never re-ask |
| Prompt Builder | Consultant personality + memory context |
| Provider Registry | Placeholder now; future LLM providers plug in without changing discovery |

## Modules

| Path | Responsibility |
|------|----------------|
| `discovery/types.ts` | Field ids, phases, turn result contracts |
| `discovery/fields.ts` | Field catalog (questions, chips, skipWhen, priority) |
| `discovery/extract.ts` | Soft NL extractors (type, team, software, volume, …) |
| `discovery/next-question.ts` | Dynamic next field + recommendation gates |
| `discovery/recommendations.ts` | Industry playbooks → Knowledge queries → personalized copy |
| `discovery/engine.ts` | Turn orchestration |

Wired in `conversation.ts`: Discovery runs first; Knowledge Engine owns product Q&A and tours.

## Conversation flow

1. **Opening** — Greeting invites business context (page-aware).
2. **Discovering** — Ask one natural question at a time; acknowledge what was shared.
3. **Intelligent follow-ups** — e.g. “I use Picktime” → “What would you most like to improve compared with Picktime?”
4. **Recommending** — When business type + a signal (challenge / software / goals) exist, generate personalized recommendations and offer a tour.
5. **Touring / open** — Knowledge Engine tour or free product Q&A; discovery facts stay in memory.

Not a fixed questionnaire. Branching uses:

- `skipWhen` (e.g. skip location count for solo operators)
- Priority + soft preferences (challenges after software or business type)
- `discoveryAskedIds` so the same question is never asked twice
- Product-looking messages bypass discovery and go to Knowledge Engine

## Discovery fields (learned gradually)

- Business type
- Number of employees
- Number of locations
- Current scheduling software
- Monthly appointment volume
- Biggest operational challenges
- Business goals
- Growth plans

Plus session staples: visitor name, interests, recommendations already made.

## Recommendation flow

1. Build a retrieval query from profile (type + challenges + software + playbook topics).
2. `retrieveKnowledge` pulls grounded articles.
3. Industry playbooks (ultrasound, salon, spa, clinic, default) rank topic suggestions.
4. Format consultant copy + offer:  
   *“Based on what you've shared, I'd like to show you the parts of Chasum that will help your business most.”*

Examples:

- **Ultrasound** → AI Reception, CRM, Deposits, Packages, Gift Certificates, Revenue Reporting
- **Salon** → Staff Scheduling, Online Booking, Deposits, Retention, Marketing

## Personality

Professional · Friendly · Curious · Helpful · Honest  
Never pushy · Never overly sales-focused · Feels like an experienced business consultant.

## Session Memory (v2)

Storage key: `chasum.website-concierge.v2` (migrates from v1 on read).

New fields: `employeeCount`, `locationCount`, `currentSoftware`, `monthlyVolume`, `challenges`, `goals`, `growthPlans`, `discoveryAskedIds`, `recommendationsMade`, `discoveryPhase`, `pendingFollowUpId`.

## Future Business Brain integration

This engine is intentionally reusable:

| Future surface | How it reuses discovery |
|----------------|-------------------------|
| Website Summer | Current — marketing consultant |
| Sales AI | Same fields + CRM handoff payload |
| Onboarding AI | Prefill workspace from discovery profile |
| Business Brain | Seed industry brain + operating assumptions |

Do **not** hardcode UI answers. Keep extractors, field catalog, and recommendation playbooks provider-independent so any model provider can consume the same memory + prompt structure.

## Related docs

- [`AI_IDENTITY.md`](./AI_IDENTITY.md)
- [`WEBSITE_CONCIERGE.md`](./WEBSITE_CONCIERGE.md)
- [`KNOWLEDGE_ENGINE.md`](./KNOWLEDGE_ENGINE.md)
- [`MEET_SUMMER_EXPERIENCE.md`](./MEET_SUMMER_EXPERIENCE.md)
