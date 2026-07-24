# Flagship Summer Implementation

**Status:** Complete replacement of Meet Summer marketing page  
**Route:** `/meet-summer`  
**Commit theme:** Operation Summer – Flagship Experience  

## Storytelling philosophy

The page unfolds like a movie — not a dashboard, not a chat widget, not documentation.

Visitors discover Summer gradually. Emotional goal:

> “I just met the future.”

Design language follows the attached creative storyboard (mood, typography, glass, orb identity) **without** recreating it as one giant storyboard layout. Implementation is a **premium scrolling journey**.

## Visitor journey

| Scene | Section | Behavior |
|-------|---------|----------|
| 01 | Hero only | Full viewport. Meet Summer. CTA: Begin the Experience. No chat/cards/forms. |
| — | Transition | Hero fades/scales; journey reveals (no route change). |
| 02 | Summer awakens | Abstract orb + calm introduction. |
| 03 | Business discovery | Premium industry cards → Business Discovery Engine. |
| 04 | Visible intelligence | Thinking checklist (no spinners). |
| 05 | Business understanding | Live profile from Session Memory. |
| 06 | Recommendations | Outcome-focused cards from Discovery/playbook. |
| 07 | Intelligence editorial | Traditional software vs Summer. |
| 08 | Roadmap | Vertical inspirational timeline. |
| 09 | Private Alpha | Existing `DesignPartnerForm` — invite, not pressure. |

## Visual architecture

- Namespace: `.fs-*` in `app/globals.css`
- Atmosphere: cinematic navy, ambient particles, soft blue horizon glow
- Summer identity: `SummerOrb` — neural light sphere (not a mascot)
- Cards: glass borders, large radius, minimal chrome
- Motion: fade / slide / subtle scale via `Reveal`; orb breathe/spin; reduced-motion safe

## Component architecture

```text
app/(marketing)/meet-summer/page.tsx
 └─ FlagshipExperience
     ├─ FlagshipHero
     └─ journey
         ├─ FlagshipAwakening + SummerOrb
         ├─ FlagshipDiscovery
         ├─ FlagshipThinking
         ├─ FlagshipConversation (follow-up after card select)
         ├─ FlagshipUnderstanding
         ├─ FlagshipRecommendations
         ├─ FlagshipIntelligence
         ├─ FlagshipRoadmap
         └─ FlagshipAlpha → DesignPartnerForm
```

Copy: `lib/marketing/flagship-summer.ts`  
Intelligence helpers: `lib/marketing/meet-summer-intelligence.ts`

## Engines (unchanged)

- Knowledge Engine  
- Business Discovery Engine  
- Session Memory  
- Provider Registry  

No OpenAI. No authenticated app / CRM / Calendar / Commerce / GVM changes.

## Motion system

| Motion | Use |
|--------|-----|
| Hero exit | opacity + slight scale before journey |
| Reveal | staggered chapter entrance |
| Orb active | soft breathe + ring spin while thinking |
| Profile cards | fade-up when discovered |
| Chat bubbles | fade-up |

No bounce. No gimmicks.

## Responsive strategy

- Hero remains single composition on all breakpoints  
- Discovery: 2 → 3 → 5 column card grid  
- Profile / recommendations: 1 → 2 → 3/4 columns  
- Alpha: stacked invite + form → split on large screens  
- Conversation is a calm follow-up surface after discovery — never a floating support widget  

## Future AI integrations

- Stronger “because Picktime + reporting…” recommendation narrative when Discovery phase is `recommending`  
- Optional scroll-linked scene progress  
- Provider swap (LLM) behind existing registry without redesigning scenes  

## Related

- [`PREMIUM_AI_EXPERIENCE.md`](./PREMIUM_AI_EXPERIENCE.md)  
- [`FLAGSHIP_MEET_SUMMER.md`](./FLAGSHIP_MEET_SUMMER.md)  
- [`../ai/BUSINESS_DISCOVERY_ENGINE.md`](../ai/BUSINESS_DISCOVERY_ENGINE.md)  
- [`../ai/AI_IDENTITY.md`](../ai/AI_IDENTITY.md)  
