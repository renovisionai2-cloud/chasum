# Premium AI Experience — Meet Summer (Phase 5)

**Status:** Marketing presentation sprint  
**Route:** `/meet-summer`  
**Scope:** Public marketing website only  

## Design philosophy

Meet Summer should feel like unveiling a new technology — closer to Apple, OpenAI, Stripe, Linear, Vercel, and Notion product launches than a dense SaaS feature page.

Every decision reinforces one message:

> Chasum is not another scheduling platform. It is the AI Business Operating System.

### Principles

- Generous whitespace and large typography
- One idea per section — chapters, not feature grids
- Premium glass, soft blue glow, and tasteful motion
- Conversation as the emotional centerpiece (real AI — never faked)
- Private Alpha application only as the final chapter

## Storytelling approach

| Chapter | Intent |
|---------|--------|
| Hero | Cinematic introduction — Meet Summer as brand signal |
| The Problem | Storage vs understanding |
| How Summer Thinks | Visual chain: Customers → Appointments → Employees → Revenue → Decisions |
| Business Memory | Timeline of learning over time |
| AI Business Operating System | Long-term vision — one brain, many roles |
| Experience Summer | Live conversation (Knowledge Engine + Discovery) |
| Roadmap | Premium vertical journey to the complete OS |
| Private Alpha | Existing `DesignPartnerForm` |

## Motion principles

- Prefer fade / soft translate reveals via existing `Reveal` + `PageFade`
- Hero atmosphere orbs drift slowly; disabled under `prefers-reduced-motion`
- Message enter + thinking dots in the conversation panel respect reduced motion
- Hover glow on OS role chips and glass focus ring — never distracting loops

## Visual language

| Token / class | Role |
|---------------|------|
| `.meet-summer-premium` | Page scope |
| `.meet-summer-brand-mark` | Hero brand (primary signal) |
| `.meet-summer-display` | Supporting hero line |
| `.meet-summer-glass` | Premium conversation shell |
| `.meet-summer-think-chain` | Decision graph |
| `.meet-summer-memory-rail` | Memory timeline |
| `.meet-summer-journey` | Roadmap journey |

Accent: Chasum primary blue (`--primary`). Avoid purple-on-white clichés and cream/serif terracotta tropes.

## Architecture (unchanged)

Do **not** modify:

- Knowledge Engine
- Business Discovery Engine
- Session Memory
- Prompt Builder
- Provider Registry
- Authenticated application / CRM / Dashboard / Calendar / Commerce / Reception / Reports / GVM

Presentation files:

- `app/(marketing)/meet-summer/page.tsx`
- `lib/marketing/meet-summer.ts`
- `components/website-concierge/summer-embedded-panel.tsx`
- `app/globals.css` (`.meet-summer-*` utilities)

## Future enhancements

- Optional scroll-linked chapter progress indicator
- Deeper product-tour deep links from suggested prompts
- Industry-specific narrative variants
- Lightweight WebGL / canvas atmosphere only if performance budget allows

## Related

- [`../ai/MEET_SUMMER_EXPERIENCE.md`](../ai/MEET_SUMMER_EXPERIENCE.md)
- [`../ai/AI_IDENTITY.md`](../ai/AI_IDENTITY.md)
- [`../ai/BUSINESS_DISCOVERY_ENGINE.md`](../ai/BUSINESS_DISCOVERY_ENGINE.md)
