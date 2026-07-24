# Guided Business Discovery

Transforms Meet Summer Business Discovery into a true AI consultation — UX, conversation, and presentation only.

Engines unchanged: Business Discovery Engine, Knowledge Engine, Session Memory schema extensions for multi-business labels, Provider Registry. No OpenAI. No authenticated-app changes.

## Conversation philosophy

Summer does not collect information. Summer understands businesses.

Every ask follows **The Summer Principle** ([`../ai/SUMMER_PRINCIPLE.md`](../ai/SUMMER_PRINCIPLE.md)).

Sequence: **Understand → Explain → Ask → Think → Recommend → Confirm → Continue**

## Fast pacing rules

Motion must feel premium **and** quick. Prefer 150–300ms fades with short card stagger. Avoid long cinematic delays, word-by-word reveals, and sentence-by-sentence waiting.

### Hero timing (`FlagshipHero` / `.fs-hero-seq`)

| Time | Group |
| --- | --- |
| 0ms | Background / ambient glow |
| 150ms | Summer orb |
| 300ms | Brand + headline together |
| 500ms | Supporting copy as one group |
| 700ms | “Begin the Experience” CTA |

Fully usable within ~1–1.5s. Exit transition ~420ms, then discovery fades in.

### Begin Experience → discovery (`FlagshipDiscovery`)

- One smooth hero → journey fade (veil ~400ms).
- Introduction appears as **one coordinated block** (`FS_AWAKENING.greeting` + `body`) — not line-by-line.
- Question + category cards usable within ~1s after click (`introFadeMs` / `readyMs` / `categoryStaggerMs` ≈ 55ms).
- Full category set visible within ~500–700ms of ready.

Copy: `FS_AWAKENING`, `FS_GUIDED` in `lib/marketing/flagship-summer.ts`.

## Editable multi-business selection

Industries are **never locked or greyed out** after a click. Toggle freely:

- Click Ultrasound → selected
- Click Dental → Ultrasound stays if multi-select; both can be selected
- Click Ultrasound again → removes it
- Changing categories preserves existing selections (chips + session memory)

### Confirmation flow

Do **not** auto-advance on first industry click.

1. Select one or more industries (checkmarks)
2. Optional: **Choose from another category** / **← Back to Categories** (keeps chips)
3. **Continue with my selections** (disabled until ≥1 selection)

Continue calls `refineUnderstanding` with `fsBuildMultiPrompt()` so Summer acknowledges the full set and prior contradictory transcript turns are replaced.

### Selected summary

Persistent chips:

```
Your businesses:
[Medical Clinic ×] [Ultrasound ×]
```

Remove via ×; profile and memory update immediately.

## Session memory

`SessionMemory.businessTypes: string[]` stores display labels.

- First selection informs primary `businessType` (engine compatibility) via `inferBusinessTypeFromText`.
- `setBusinessSelections()` updates labels live before Continue.
- `refineUnderstanding(prompt, { businessTypes })` reseeds memory then runs the existing Discovery turn.
- `pauseConsultationKeepBusinesses()` clears consult transcript facts but **keeps** `businessTypes` when returning to categories.

Live profile (`buildUnderstandingFields`) shows joined labels: `Medical Clinic · Ultrasound`.

## Integration path

```
multi-select industries (editable)
  → Continue with my selections
  → refineUnderstanding(multi prompt, businessTypes)
  → Session Memory / Discovery / Knowledge / Provider Registry
  → consultation scene (evolving transcript + woven profile)
```

## Accessibility

- Keyboard-focusable industry toggles (`aria-pressed`)
- Chip remove buttons with labeled names
- `prefers-reduced-motion` skips stagger delays
- Continue disabled state announced via native button disabled

## Future AI integration

- Richer multi-business acknowledgment templates from Knowledge
- Shared motion timeline tokens across Meet Summer chapters
