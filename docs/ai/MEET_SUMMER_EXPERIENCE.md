# Meet Summer Experience

**Status:** Phase 3 — public marketing introduction  
**Route:** `/meet-summer`  
**CTA constant:** `MEET_SUMMER_HREF` in `lib/marketing/alpha.ts`  
**Scope:** Marketing website only — no authenticated app changes

## Purpose

When a visitor clicks **Meet Summer**, they should feel they are meeting Chasum’s flagship AI Business Assistant — not immediately filling out a form. Private Alpha remains, but only after the story lands.

By the apply section, visitors should understand:

1. Who Summer is  
2. Why Summer exists  
3. How Summer helps businesses  
4. Why Summer is different from a traditional chatbot  

## Page architecture

| Section | Role in the story |
|---------|-------------------|
| Hero | Name + “Your AI Business Assistant” + Try Summer / Continue to Private Alpha |
| Introduction | Story beats (who / why / how / different) |
| What Summer can do today | Current Knowledge Engine capabilities |
| Inside Chasum | Future roles in the AI Business Operating System |
| Talk with Summer | Embedded concierge (`SummerEmbeddedPanel`) |
| Why businesses need Summer | Storage vs understanding |
| Roadmap | Today → Next → Future |
| Private Alpha | Existing `DesignPartnerForm` as final CTA |

**Files**

- `app/(marketing)/meet-summer/page.tsx` — page composition  
- `lib/marketing/meet-summer.ts` — narrative copy  
- `components/website-concierge/summer-embedded-panel.tsx` — inline chat UI  

Floating site-wide Summer is hidden on `/meet-summer` so the embedded panel is the focus (same session store / Knowledge Engine).

## Visitor journey

```text
Platform / Showcase “Meet Summer”
        ↓
   /meet-summer hero
        ↓
   Story → Today → Inside OS
        ↓
   Live chat (Knowledge Engine)
        ↓
   Need + Roadmap
        ↓
   Private Alpha application
```

Secondary path: hero “Continue to Private Alpha” jumps to `#private-alpha` without removing the story above.

## AI integration

Reuses existing website concierge stack — **no second AI**:

- Knowledge Engine  
- Session memory  
- Prompt builder  
- Provider registry (placeholder; OpenAI not wired)  
- Page awareness (`meet-summer` page id)  

## Future enhancements

- Deeper product-tour deep links from suggested prompts  
- Industry-specific Meet Summer variants  
- Optional OpenAI/Anthropic provider behind the same panel  
- Analytics on section scroll → apply conversion  

## Related docs

- [`AI_IDENTITY.md`](./AI_IDENTITY.md)  
- [`WEBSITE_CONCIERGE.md`](./WEBSITE_CONCIERGE.md)  
- [`KNOWLEDGE_ENGINE.md`](./KNOWLEDGE_ENGINE.md)  
- [`../product/30_CHASUM_BLUEPRINT.md`](../product/30_CHASUM_BLUEPRINT.md)  
