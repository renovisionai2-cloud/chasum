# Knowledge Engine

**Status:** Phase 2 — structured knowledge + retrieval for marketing Summer  
**Surface:** Public marketing website only  
**Not in scope:** OpenAI/Anthropic/Gemini integration, authenticated app, in-app Summer

## Purpose

The Knowledge Engine turns Summer from a thin concierge into a **product expert** grounded in curated Chasum knowledge. Future model providers (OpenAI, Anthropic, Gemini, local) consume the same retrieval pack without UI redesign.

## Architecture

```text
Visitor message
      ↓
Conversation orchestrator
      ↓
Knowledge Engine (intent → retrieve → compose / tour)
      ↓
Prompt Builder (system + retrieved ground truth)
      ↓
AI Provider (placeholder today → LLM tomorrow)
      ↓
Session Memory (answered ids, tour step, interests)
```

| Piece | Path |
|-------|------|
| Catalog | `lib/website-concierge/knowledge/*` |
| Engine | `lib/website-concierge/knowledge-engine.ts` |
| Prompt | `lib/website-concierge/prompt-builder.ts` |
| Provider registry | `lib/website-concierge/providers/index.ts` |
| Concierge docs | `docs/ai/WEBSITE_CONCIERGE.md` |

## Knowledge structure

Categories:

1. **Company** — mission, vision, AI Business Operating System, why Chasum exists, story  
2. **Features** — booking, CRM, calendar, payments, deposits, gift certificates, packages, reports, employees, multi-location, portal, AI  
3. **Industries** — ultrasound, spa, salon, massage, chiropractic, physiotherapy, dental, veterinary, pet grooming, barbershop  
4. **Pricing** — plans, comparison, trial/explore, upgrades, Private Alpha  
5. **Competitive** — philosophy vs Fresha, Vagaro, Jane, GlossGenius, Boulevard, Booksy, Square, Mindbody (no competitor bashing)  
6. **FAQ** — security, privacy, data ownership, imports, mobile, payments, support, customization, AI  
7. **Tour** — guided two-minute path: Dashboard → Booking → CRM → Payments → Reports → AI vision  

Each entry has: `id`, `category`, `title`, `summary`, `body`, `tags`, optional `industries`, `followUps`, `relatedIds`.

## Retrieval flow

1. **Intent detect** — tour / competitive / pricing / faq / industry / feature / company / unknown  
2. **Score catalog** — tag overlap, body tokens, industry match, category boost  
3. **Diversity** — down-rank `answeredArticleIds` and `lastTopicIds` to avoid repetition  
4. **Confidence** — high / medium / low; low → admit unknown + recommend another topic  
5. **Compose** — body + intelligent follow-up; tour mode advances on “start the tour” / “next”  
6. **Pack for providers** — `KnowledgeRetrieval` + `groundedDraft` on `ConciergeCompletionRequest`

Placeholder provider uses `groundedDraft`. Future LLMs should ignore the draft and generate from `prompt` + `retrieval` only.

## Conversation improvements

- Remembers previous questions (`previousQuestions`)  
- Tracks covered articles (`answeredArticleIds`) to reduce repeats  
- Asks follow-ups from entry metadata  
- Admits when knowledge is weak  
- Recommends alternate topics  
- Guided product tour with session `tourStepId`

## Future AI integration

`getConciergeProvider()` accepts: `placeholder` | `openai` | `anthropic` | `gemini` | `local`.

Non-placeholder ids currently fall back to the Knowledge Engine draft provider. To wire a model:

1. Implement `ConciergeProvider` reading `request.prompt` + `request.retrieval`  
2. Register in `providers/index.ts`  
3. Keep UI + `runConciergeTurn` unchanged  

This engine is intended as the foundation for Summer, Chase, Marketing AI, Reception AI, and Owner/CEO AI — same retrieval patterns, different permissions and tools later.

## Quality bar

- No authenticated app changes  
- No OpenAI keys required  
- Typecheck / ESLint / production build must pass  
