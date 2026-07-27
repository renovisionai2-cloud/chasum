# CTA and Route Map

**Status:** Canonical public CTA destinations  
**Source of truth:** `lib/marketing/alpha.ts`

| Purpose | Label | Destination |
| --- | --- | --- |
| Primary acquisition | Apply for Private Alpha | `/apply` |
| Product experience | Meet Summer | `/meet-summer` |
| Homepage journey | Start with Summer | `/meet-summer` |
| Platform deep-dive | Explore the Platform | `/platform` |
| Product tour | Product Tour | `/product-tour` |
| Industries | Explore all industries | `/industries` |
| Pricing | Pricing | `/pricing` |
| Sales conversation | Book a Walkthrough | `/contact#walkthrough` |
| Existing customer | Log in | `/login` |

Primary navigation (`lib/constants.ts` `NAV_LINKS`):

| Label | Destination |
| --- | --- |
| Home | `/` |
| Meet Summer | `/meet-summer` |
| Platform | `/platform` |
| Product Tour | `/product-tour` |
| Industries | `/industries` |
| Roadmap | `/roadmap` |
| Pricing | `/pricing` |

Deprecated / do not use as primary CTAs:

- Request Early Access → use Apply for Private Alpha
- Explore Chasum → use Meet Summer or Platform
- Experience the Product → use Product Tour or Meet Summer
- Contact Sales → Book a Walkthrough / Discuss your setup
- Homepage hash destinations `/#platform`, `/#pricing`, `/#how-it-works` as primary nav

Secondary allowed labels with distinct destinations:

- Why Private Alpha? → `/private-alpha`
- View the AI roadmap / Public roadmap → `/roadmap`
- Contact Support → `/contact` (Support)
- Report a Security Concern → `/security#report`

Active navigation rules: `lib/marketing/nav-active.ts` — only the current route (or genuine child section route) may appear active. Pricing must not remain highlighted on Contact or Support.

All primary CTAs must be real links (or verified actions), keyboard accessible, and covered by route tests.
