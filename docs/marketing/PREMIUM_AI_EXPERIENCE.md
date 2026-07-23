# Premium AI Experience — Meet Summer

**Status:** Complete experience rebuild  
**Route:** `/meet-summer`  
**Scope:** Public marketing website only  

## Design philosophy

Most AI companies try to make AI feel human.  
**Chasum should make AI feel intelligent.**

Visitors should constantly feel that Summer is:

- understanding  
- remembering  
- connecting information  
- recognizing patterns  
- building recommendations  
- thinking before responding  

The interface communicates intelligence visually.

Do **not** make Summer feel like customer support, live chat, a floating widget, or an FAQ assistant.

Visitors should feel they are interacting with the **intelligence layer of an AI Business Operating System**.

Emotional close:

> “I've never seen business software introduced like this.”

## Visitor journey (story chapters)

| Chapter | Experience |
|---------|------------|
| **01 Meet Summer** | Cinematic hero — huge type, minimal copy. Headline: *The Intelligence Behind Every Business Decision.* |
| **02 Summer Appears** | Summer enters with a natural introduction (not a chat widget open). |
| **03 Business Discovery** | One question at a time via Business Discovery Engine. |
| **04 Visible Intelligence** | Animated reasoning cues derived from Session Memory / Discovery. |
| **05 Business Understanding** | Live side panel of discovered facts (business, employees, software, pain, recommendations). |
| **06 Personalized Recommendations** | Discovery-driven recommendations with reasoning (Knowledge Engine grounded). |
| **07 AI Business Operating System** | Today → Next → Future roadmap. |
| **08 Private Alpha** | Existing `DesignPartnerForm` — natural conclusion, not the destination. |

Chapters 02–06 share one intelligence surface (`SummerWorkspace`).

## Page architecture

```text
Chapter 01  cinematic hero
     ↓
Chapters 02–06  experience shell
     ├── conversation (Summer appears + discovery + recommendations)
     ├── visible intelligence list
     └── business understanding panel
     ↓
Chapter 07  OS roadmap
     ↓
Chapter 08  Private Alpha form
```

### Reused (do not rewrite)

- Business Discovery Engine  
- Knowledge Engine  
- Session Memory  
- Provider Registry  

### Presentation files

- `app/(marketing)/meet-summer/page.tsx`  
- `lib/marketing/meet-summer.ts`  
- `lib/marketing/meet-summer-intelligence.ts`  
- `components/website-concierge/summer-workspace.tsx`  
- `components/website-concierge/summer-embedded-panel.tsx`  
- `components/website-concierge/summer-understanding-panel.tsx`  
- `components/website-concierge/summer-thinking-viz.tsx`  
- `app/globals.css` (`.msx-*` experience styles)

## Visual language

- Cinematic layouts, generous whitespace, large typography  
- Elegant motion via `Reveal` / `PageFade` (respect `prefers-reduced-motion`)  
- Soft gradients and glass where appropriate  
- Primary blue accent (`--primary`)  
- New namespace: `.msx` (Meet Summer Experience) — prior hero hierarchy intentionally discarded  

## Success criteria

A visitor should immediately understand:

- Summer is not a chatbot  
- Summer is not an AI receptionist alone  
- Summer is an AI Business Assistant  
- Chasum is an AI Business Operating System  
- The AI understands businesses  
- The AI helps owners make better decisions  

## Future enhancements

- Scroll-linked chapter progress  
- Stronger recommendation “because…” narrative cards when Discovery phase is `recommending`  
- Industry-specific cinematic variants  
- Optional ambient audio / reduced-motion-safe depth layers  

## Related

- [`FLAGSHIP_MEET_SUMMER.md`](./FLAGSHIP_MEET_SUMMER.md)  
- [`PREMIUM_CONVERSATION_EXPERIENCE.md`](./PREMIUM_CONVERSATION_EXPERIENCE.md)  
- [`../ai/MEET_SUMMER_EXPERIENCE.md`](../ai/MEET_SUMMER_EXPERIENCE.md)  
- [`../ai/BUSINESS_DISCOVERY_ENGINE.md`](../ai/BUSINESS_DISCOVERY_ENGINE.md)  
- [`../ai/AI_IDENTITY.md`](../ai/AI_IDENTITY.md)  
