# Public AI Identity — Summer

**Status:** Brand standard for the public marketing website  
**Official name:** **Summer — Chasum's AI Business Assistant**

## Standard

On the public marketing website, Chasum presents **one** AI identity:

> **Summer — Chasum's AI Business Assistant**

Summer represents:

- AI Website Concierge
- AI Receptionist (product assist)
- Product Guide
- Future Business Assistant
- Future Executive Assistant

Do **not** introduce additional AI names on the marketing site unless intentionally designed later. **Chase** may appear as the Early Access operations companion alongside Summer; she is not a substitute public identity.

## Naming rules (marketing)

| Use | Avoid on marketing |
|-----|---------------------|
| Summer | Emma (legacy marketing name) |
| AI Business Assistant | Competing hero titles for other assistants |
| Summer & Chase (Early Access) | Invented third “live” AI employees |

## Surfaces covered

- Landing / platform modules / product tour demos
- Embedded marketing dashboard mock (`DashboardPreview` — address bar must show `/dashboard/ai-workforce/summer`, never `/dashboard/emma`)
- AI Workforce marketing section
- FAQ and homepage copy
- Website Concierge widget (`components/website-concierge`)
- Meet Summer experience (`/meet-summer` — see [`MEET_SUMMER_EXPERIENCE.md`](./MEET_SUMMER_EXPERIENCE.md))
- Knowledge Engine copy (`lib/website-concierge`)

Demo chrome constants live in `lib/marketing/demo.ts`.

## Authenticated application

In-app routes and code may still reference legacy **Emma** paths (redirects, receptionist service history). Those are product/engineering concerns — not the public brand. Public marketing must not star Emma.

## Related docs

- [`WEBSITE_CONCIERGE.md`](./WEBSITE_CONCIERGE.md)
- [`KNOWLEDGE_ENGINE.md`](./KNOWLEDGE_ENGINE.md)
- [`BUSINESS_DISCOVERY_ENGINE.md`](./BUSINESS_DISCOVERY_ENGINE.md)
- [`MEET_SUMMER_EXPERIENCE.md`](./MEET_SUMMER_EXPERIENCE.md)
- [`PREMIUM_AI_EXPERIENCE.md`](../marketing/PREMIUM_AI_EXPERIENCE.md)
- [`PREMIUM_CONVERSATION_EXPERIENCE.md`](../marketing/PREMIUM_CONVERSATION_EXPERIENCE.md)
- [`FLAGSHIP_MEET_SUMMER.md`](../marketing/FLAGSHIP_MEET_SUMMER.md)
- [`FLAGSHIP_SUMMER_IMPLEMENTATION.md`](../marketing/FLAGSHIP_SUMMER_IMPLEMENTATION.md)
- [`../product/30_CHASUM_BLUEPRINT.md`](../product/30_CHASUM_BLUEPRINT.md)
