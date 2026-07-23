# Premium Conversation Experience — Meet Summer (Phase 6)

**Status:** Marketing presentation sprint  
**Route:** `/meet-summer`  
**Scope:** Public marketing website only  

## Intent

Visitors should feel they are meeting an **AI Business Assistant** — the intelligence layer of an AI Business Operating System — not opening live chat or customer support.

> “This software understands businesses.”  
> — not —  
> “This website has a chatbot.”

## Visual architecture

```text
Hero (brand + promise)
        │
        ▼
┌──────────────────────────────────────────────┐
│  SummerWorkspace (focal point)               │
│  ┌─────────────────────┐ ┌─────────────────┐ │
│  │ Conversation glass  │ │ Business        │ │
│  │ + Thinking viz      │ │ Understanding   │ │
│  └─────────────────────┘ └─────────────────┘ │
└──────────────────────────────────────────────┘
        │
        ▼
Story chapters → First impression → Private Alpha
```

| Surface | File |
|---------|------|
| Page composition | `app/(marketing)/meet-summer/page.tsx` |
| Workspace shell | `components/website-concierge/summer-workspace.tsx` |
| Conversation | `components/website-concierge/summer-embedded-panel.tsx` |
| Understanding panel | `components/website-concierge/summer-understanding-panel.tsx` |
| Thinking visualization | `components/website-concierge/summer-thinking-viz.tsx` |
| Intelligence helpers | `lib/marketing/meet-summer-intelligence.ts` |

## Conversation layout

- Large centered AI workspace in the hero (not a floating widget)
- Glass shell, soft blue glow, generous message spacing
- Summer opens with a consultant-style introduction (page greeting)
- Suggested prompts lean into Discovery (“I run an ultrasound clinic”, “We use Picktime”)
- Live **Business Understanding** panel mirrors Session Memory as facts are discovered
- **AI Thinking Visualization** cycles cues derived from Discovery state while pending

## Animation system

| Motion | Behavior | Reduced motion |
|--------|----------|----------------|
| Message enter | Soft fade/translate | Instant |
| Understanding pop | Field highlight on discovery | Instant |
| Thinking cues | Rotate genuine reasoning labels | Show first cue only |
| Intel pulse | Subtle breathe on reasoning badge | Static |

Engines unchanged: Knowledge Engine, Business Discovery Engine, Session Memory, Provider Registry. No OpenAI.

## First impression chapter

Near the end, a short list crystallizes the 10-second promise:

- AI Business Operating System
- Not a support chatbot
- Understands businesses
- Helps owners decide
- Intelligence, not menus

## Future enhancements

- Persist understanding-panel “just discovered” highlights across turns
- Optional chapter progress indicator synced to scroll
- Deeper tour deep-links from recommendation chips
- Split workspace density presets for tablet vs desktop

## Related

- [`PREMIUM_AI_EXPERIENCE.md`](./PREMIUM_AI_EXPERIENCE.md)
- [`../ai/MEET_SUMMER_EXPERIENCE.md`](../ai/MEET_SUMMER_EXPERIENCE.md)
- [`../ai/BUSINESS_DISCOVERY_ENGINE.md`](../ai/BUSINESS_DISCOVERY_ENGINE.md)
