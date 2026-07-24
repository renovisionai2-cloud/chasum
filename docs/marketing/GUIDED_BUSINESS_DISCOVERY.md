# Guided Business Discovery (Phase 8)

Transforms Meet Summer Business Discovery into a true AI consultation — UX, conversation, and presentation only.

Engines unchanged: Business Discovery Engine, Knowledge Engine, Session Memory, Provider Registry. No OpenAI. No authenticated-app changes.

## Conversation philosophy

Summer does not collect information. Summer understands businesses.

Every ask follows **The Summer Principle** ([`../ai/SUMMER_PRINCIPLE.md`](../ai/SUMMER_PRINCIPLE.md)):

> Never ask without explaining why it matters, how the answer helps, and what Summer will do with it.

Sequence: **Understand → Explain → Ask → Think → Recommend → Confirm → Continue**

The visitor should never feel like they are completing a software form. They should leave thinking:

> This AI actually understands my business.

Principles:

1. Reveal only the next beat
2. Speak in calm, complete sentences
3. Acknowledge before advancing
4. Show reasoning without spinners
5. Grow a live profile from real Session Memory — never invent facts

## Progressive reveal

Owned by `FlagshipDiscovery`.

| Phase | Experience |
| --- | --- |
| `intro` | Summer speaks line-by-line |
| `question` | “What type of business do you own?” |
| `choices` | Category cards stagger in; one accordion open at a time |
| `ack` | Personalized acknowledgment beat sheet |
| `intelligence` | Visible intelligence checklist → Ready. |
| `committed` | `onSelect` → existing `send()` Discovery flow |

Copy & timing: `FS_AWAKENING`, `FS_GUIDED`, `fsBuildAckLines()` in `lib/marketing/flagship-summer.ts`.

## Business profile architecture

`FlagshipUnderstanding` (live panel) sits beside the conversation in `fs-consult`.

Fields (populated gradually from Session Memory):

- Business
- Employees
- Locations
- Current Software
- Biggest Challenge
- Goals

Undiscovered fields render as `…` with muted styling. Discovered fields animate in with a check. Optional `industryLabel` seeds Business before memory settles.

Helpers: `buildUnderstandingFields()` in `lib/marketing/meet-summer-intelligence.ts`.

## Intelligence visualization

Two surfaces, both checklist-based (never spinners):

1. **Post-selection moment** — `FS_GUIDED.intelligenceSteps` inside discovery
2. **Mid-conversation reasoning** — compact `FlagshipThinking` while `pending`, driven by `buildThinkingCues()` / `FS_REASONING_STEPS` from actual memory

## Recommendation strategy

`FlagshipRecommendations` waits until Discovery has enough signal (engine recommendations or challenges + known business type).

Framing: outcomes first — title + why grounded in business impact (`FS_RECS_INTRO`, `FS_RECOMMENDATION_COPY`).

## Private Alpha

`FlagshipAlpha` uses a personal Summer invitation (`FS_ALPHA`) rather than a generic CTA, then the existing Design Partner form.

## Integration path

```
select industry
  → acknowledgment lines
  → intelligence checklist
  → onSelect(prompt, id)
  → FlagshipExperience.send(prompt)
  → Session Memory / Discovery / Knowledge / Provider Registry
  → live profile + conversation chips
  → recommendations when ready
  → Private Alpha invite
```

## Future AI integration

- Richer industry-specific acknowledgment templates
- Shared motion timeline tokens across Meet Summer chapters
- Optional user-initiated audio tied to the same beat sheet
- Deeper playbook cues in Visible Intelligence without changing marketing ownership of engines
