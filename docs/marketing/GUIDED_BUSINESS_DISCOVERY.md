# Guided Business Discovery (Phase 8.1)

Transforms Business Discovery from a selection screen into the beginning of a conversation with Summer.

Marketing UI only. Engines unchanged: Business Discovery Engine, Knowledge Engine, Session Memory, Provider Registry. No OpenAI.

## Conversation philosophy

The visitor should never feel like they are completing a form.

They should feel they have just met Summer — calm, confident, intelligent.

Primary emotional goal:

> I'm not filling out software. I'm talking with an intelligent business advisor.

## Progressive reveal system

Owned by `FlagshipDiscovery` (`components/marketing/flagship-summer/flagship-discovery.tsx`).

| Phase | What appears |
| --- | --- |
| `intro` | Summer orb + spoken lines, one at a time |
| `question` | “What type of business do you own?” |
| `choices` | Category cards stagger in; accordion starts collapsed |
| `ack` | Summer acknowledges the selection |
| `committed` | Existing `onSelect` → `send()` Discovery flow continues |

Awakening is no longer a separate journey section — it lives inside guided discovery.

## Animation timeline

Constants: `FS_GUIDED` in `lib/marketing/flagship-summer.ts`.

| Moment | Timing |
| --- | --- |
| Intro lines | `lineGapMs` (900ms) between sentences |
| Pause before question | `questionPauseMs` (1100ms) after last line |
| Pause before choices | `choicesPauseMs` (750ms) after question |
| Category stagger | `categoryStaggerMs` (100ms) each |
| Ack lines | `ackGapMs` (900ms) between |
| Commit to engine | `ackCommitMs` (1000ms) after final ack line |

Motion vocabulary: fade, soft slide, opacity, elevation, glow. No bounce. No flashy effects.

`prefers-reduced-motion: reduce` skips the sequence and shows the question + all categories immediately; acknowledgment commits without delay.

## UX principles

1. Reveal only what is needed next
2. One open category at a time (premium accordion)
3. Acknowledge before asking more — never jump-cut to the next form field
4. Generous whitespace, glass cards, soft blue accent lighting
5. Selection still feels conversational even though it triggers the same Discovery Engine prompt

## Integration

Selection path unchanged after acknowledgment:

`selectIndustry` → ack sequence → `onSelect(prompt, id)` → `FlagshipExperience.send(prompt)` → Session Memory / Discovery / Knowledge / Provider Registry.

## Future expansion

- Additional spoken intros per industry after selection
- Soft typing indicator before Summer’s next discovery question
- Shared timeline tokens for other Meet Summer chapters
- Optional voice-over (user-initiated) locked to the same beat sheet
