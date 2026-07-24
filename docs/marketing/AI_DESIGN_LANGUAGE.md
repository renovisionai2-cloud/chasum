# AI Design Language (Phase 9)

Permanent visual identity for Chasum’s Meet Summer experience and future AI surfaces.

Marketing / product design only. Engines unchanged.

## Visual philosophy

Visitors should never feel like they are using software.

They should feel like they are meeting intelligence.

Everything communicates:

- Calm
- Confidence
- Intelligence

Never busy. Never cluttered. Never SaaS.

Inspiration (feeling, not imitation): Apple, OpenAI, Claude, Notion, Arc, Linear.

## Layout principles

1. One emotional center — the Summer orb
2. Progressive disclosure — never show everything at once
3. Choose a path — floating category cards, not accordions or settings panels
4. Generous whitespace — airy, modern, light
5. Depth through lighting — not through dense borders or dashboards

## Color & lighting

| Token | Role |
| --- | --- |
| Soft white canvas (`#f5f8fc` → `#eef3fb`) | Base field |
| Blue ambient gradients | Intelligence / atmosphere |
| Glass surfaces (`rgb(255 255 255 / 0.8)` + blur) | Cards, panels, chat |
| Soft blue accents (`#2563eb`, `#60a5fa`) | Focus, CTA, orb light |
| Ink (`#0f172a`, `#334155`, `#64748b`) | Typography hierarchy |

Avoid harsh black marketing backgrounds for Meet Summer.

## Lighting system

- Soft volumetric blooms behind the orb
- Horizon wash at the bottom of the hero
- Sparse particle field (CSS, not canvas)
- Cards cast floating blue-tinted shadows

## Motion system

Apple-keynote pacing. Nothing appears instantly.

Hero sequence → spoken intro → Summer Principle explanation → question → path cards stagger upward → industry chips reveal → acknowledgment → visible intelligence → continue.

Easing: `--fs-ease` / `--fs-ease-soft` (calm ease-out). No bounce.

Respect `prefers-reduced-motion`.

## Card system

**Path cards** (categories):

- Icon + name + short blurb
- Glass + soft border + floating shadow
- Hover: gentle elevation
- Selecting a path reveals industries — not an accordion expand

**Industry chips**:

- Appear only after a path is chosen
- Soft glass panel; radio-style selection

## Typography

- Large, confident display for brand / questions
- Soft body for explanations (Summer Principle: why / helps / willDo)
- Uppercase kickers with wide tracking for section labels

## Spacing

Prefer padding over rules. Prefer one clear composition per viewport. Prefer fewer, larger elements over denser grids.

## The orb

Summer’s identity. Improve, never replace.

- Breathe, float, soft pulse
- Cast ambient light into the canvas
- Emotional center of hero and guided intro

## Future design rules

1. New Meet Summer chapters must use `.fs` tokens — do not invent parallel dark themes
2. Never reintroduce accordion bars for discovery paths
3. Every ask follows The Summer Principle (`docs/ai/SUMMER_PRINCIPLE.md`)
4. Prefer CSS lighting over heavy illustration chrome
5. Authenticated app may diverge; public AI experiences should feel like this language

## Related

- [`SUMMER_PRINCIPLE.md`](../ai/SUMMER_PRINCIPLE.md)
- [`GUIDED_BUSINESS_DISCOVERY.md`](./GUIDED_BUSINESS_DISCOVERY.md)
- [`FLAGSHIP_HERO_EXPERIENCE.md`](./FLAGSHIP_HERO_EXPERIENCE.md)
