# CTA and Route Map

**Status:** Canonical public CTA destinations  
**Source of truth:** `lib/marketing/alpha.ts`

| Purpose | Label | Destination |
| --- | --- | --- |
| Primary acquisition | Apply for Private Alpha | `/apply` |
| Product experience | Meet Summer | `/meet-summer` |
| Sales conversation | Book a Walkthrough | `/contact#walkthrough` |
| Existing customer | Log in | `/login` |

Deprecated / do not use as primary CTAs:

- Request Early Access → use Apply for Private Alpha
- Explore Chasum → use Meet Summer or Platform anchors
- Experience the Product → remove or replace with Meet Summer
- Contact Sales → Book a Walkthrough / Discuss your setup

Secondary allowed labels with distinct destinations:

- Why Private Alpha? → `/private-alpha`
- View the AI roadmap / Public roadmap → `/roadmap`
- See how Chasum works → `/#how-it-works`
- Contact Support → `/contact#support`
- Report a Security Concern → `/security#report`

All primary CTAs must be real links (or verified actions), keyboard accessible, and covered by route tests.
