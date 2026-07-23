# Meet Summer Experience

**Status:** Phase 3+ — public marketing introduction (Phase 5 premium presentation)  
**Route:** `/meet-summer`  
**CTA constant:** `MEET_SUMMER_HREF` in `lib/marketing/alpha.ts`  
**Scope:** Marketing website only — no authenticated app changes  
**Presentation:** See [`../marketing/PREMIUM_AI_EXPERIENCE.md`](../marketing/PREMIUM_AI_EXPERIENCE.md)

## Purpose

When a visitor clicks **Meet Summer**, they should feel they are meeting Chasum’s flagship AI Business Assistant — not immediately filling out a form. Private Alpha remains, but only after the story lands.

### Addition 1 — Tell a story, don’t build another feature

This page should feel like visitors are being introduced to one of Chasum’s **flagship products**. It tells a story — not simply a list of features.

By the time visitors reach the Private Alpha application, they should clearly understand:

1. Who Summer is  
2. Why Summer exists  
3. How Summer helps businesses  
4. Why Summer is different from a traditional chatbot  

The **Vision** section (`#vision`) carries that promise in prose; later sections are chapters of the same story, not a disconnected feature catalog.

## Routing (critical)

| Label | Must go to | Must NOT go to |
|-------|------------|----------------|
| Meet Summer | `/meet-summer` (`MEET_SUMMER_HREF`) | `/apply` |
| Apply for Private Alpha | `/apply` or `#private-alpha` on Meet Summer | — |

Production must deploy a build that includes `app/(marketing)/meet-summer/page.tsx`. If Production tracks `main` while Phase 3 only exists on a feature branch, Meet Summer CTAs on `main` still point at `/apply` and the new experience never appears.

## Page architecture

| Section | Role in the story |
|---------|-------------------|
| Hero | Name + “Your AI Business Assistant” + Try Summer / Continue to Private Alpha |
| Vision | Flagship introduction + four story chapters (who / why / how / different) |
| What Summer can do today | Chapter · how the story starts on the public site |
| Inside Chasum | Chapter · AI Business Operating System roles |
| Talk with Summer | Embedded concierge (`SummerEmbeddedPanel`) |
| Why businesses need Summer | Chapter · storage vs understanding |
| Roadmap | Today → Next → Future |
| Private Alpha | Existing `DesignPartnerForm` — end of the introduction |

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
   Vision story (who / why / how / different)
        ↓
   Chapters: Today → Inside OS → Live chat → Need → Roadmap
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
