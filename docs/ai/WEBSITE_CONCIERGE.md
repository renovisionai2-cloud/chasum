# Website Concierge (Marketing Summer)

**Status:** Phase 2 — Knowledge Engine + placeholder provider  
**Surface:** Public marketing website only (`app/(marketing)/*`)  
**Not in scope:** Dashboard, CRM, Calendar, Reception, Payments, or in-app Summer (`lib/summer`, `components/summer`)

## Vision

Summer is the first experience every visitor has with Chasum on the marketing site: an intelligent AI consultant, not a scripted chatbot. Phase 1 shipped the floating UI and module boundary. **Phase 2 adds the Knowledge Engine** — see [`KNOWLEDGE_ENGINE.md`](./KNOWLEDGE_ENGINE.md).

## Architecture

```text
UI (components/website-concierge)
        ↓
Conversation orchestrator (lib/website-concierge/conversation.ts)
        ↓
┌───────────────┬─────────────────┬──────────────────┐
│ Context Engine│ Prompt Builder  │ Session Memory   │
│ page + memory │ system/user     │ sessionStorage   │
└───────┬───────┴────────┬────────┴────────┬─────────┘
        │                │                 │
        ▼                ▼                 ▼
   Page Awareness   AI Provider      Knowledge Base
   (pathname→page)  (swappable)      (curated articles)
```

| Module | Path | Responsibility |
|--------|------|----------------|
| **UI** | `components/website-concierge/*` | Floating widget, collapse/expand, session-scoped chat chrome |
| **Conversation State** | `use-concierge-conversation.ts` + `conversation.ts` | Messages, pending, turn orchestration |
| **Context Engine** | `context-engine.ts` | Assemble page + memory + recent transcript |
| **Prompt Builder** | `prompt-builder.ts` | Provider-agnostic system/user prompt + hints |
| **AI Provider** | `providers/*` | `ConciergeProvider` interface; Phase 1 = placeholder |
| **Knowledge Base** | `knowledge-base.ts` | Curated marketing articles + search |
| **Page Awareness** | `page-awareness.ts` | Map pathname → page goals / greeting |
| **Session Memory** | `session-memory.ts` | Business type, name, interests, pages, questions |

Shared contracts live in `lib/website-concierge/types.ts` and are exported from `lib/website-concierge/index.ts`.

## Components

- `SummerWebsiteConcierge` — floating panel + launcher; mounted only in `app/(marketing)/layout.tsx`
- `useConciergeConversation` — client hook for open state, hydration, send loop

Responses are **not** hardcoded in the UI. The UI calls `runConciergeTurn()`, which builds context/prompt and asks the provider.

## Data flow

1. Visitor lands on a marketing page → layout mounts Summer.
2. Page Awareness resolves `pageId` (home, pricing, about, contact, apply, features, general).
3. Session Memory loads from `sessionStorage`, records the page visit.
4. If the transcript is empty, a page-aware greeting is seeded as an assistant message.
5. On send: record question → Context Engine → Prompt Builder → Provider → assistant message + memory patch → persist memory.
6. Collapsed/open preference is also stored for the browser session.

## Page awareness

| Page | Typical routes | Concierge focus |
|------|----------------|-----------------|
| Home | `/` | Welcome, business type, tour, explain Chasum |
| Features | paths containing `feature` (future) | Explain / recommend capabilities |
| Pricing | `/pricing` | Plans, recommendation, pricing Q&A |
| About | `/private-alpha`, `/roadmap`, `/security` | Vision, AI Business OS |
| Contact | `/contact` | Help before sales, walkthrough |
| Apply | `/apply` | Private Alpha expectations |

## AI placeholder

`getConciergeProvider("placeholder")` returns knowledge-grounded responses.  
`getConciergeProvider("openai")` is reserved and currently falls back to the same placeholder — **OpenAI is not integrated in Phase 1**.

To add a real model later:

1. Implement `ConciergeProvider` (e.g. `providers/openai.ts`).
2. Register it in `providers/index.ts`.
3. Keep UI + `runConciergeTurn` unchanged.

## Future expansion

The same module boundaries are intended to power additional roles without redesign:

- Summer (marketing + later product surfaces)
- Chase
- Marketing AI
- Reception AI
- CEO / Owner AI

They should share prompt/context/provider patterns and diverge on **permissions, knowledge scope, and tools** — aligning with the Business Brain vision in `docs/product/30_CHASUM_BLUEPRINT.md`.

## Quality bar

- Marketing-only mount (no dashboard/auth/booking layout changes)
- No edits to in-app Summer
- Typecheck / ESLint / production build must pass
