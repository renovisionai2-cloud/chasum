# Master Roadmap

**Status:** Official company roadmap  
**Parent:** [`CHASUM_BIBLE.md`](./CHASUM_BIBLE.md)  
**Active backlog:** [`MASTER_TASKS.md`](./MASTER_TASKS.md)  
**Detailed history:** [`../ROADMAP.md`](../ROADMAP.md), [`../CHANGELOG.md`](../CHANGELOG.md)

This is the durable map of what Chasum has completed and what comes next. Update this file when a major department or platform milestone ships or is re-sequenced.

---

## Completed

| Milestone | Notes |
|-----------|--------|
| **Authentication** | Supabase auth, callbacks, protected dashboard routes, password reset |
| **Owner Platform** | `/owner` — platform ops, businesses, trials, revenue, health, security |
| **Billing** | Plans (Free → Enterprise), customer billing UI, provider interface, invoices/events |
| **Communication Center** | Call / SMS / Email tooling, timeline, notes, follow-ups, pluggable providers |
| **Employee Management** | Directory, profiles, departments, schedules, payroll fields, documents, activity |
| **CRM** | Customer hub, profiles, timeline, notes, payments events, insights hooks |
| **Calendar & Booking Engine** | Reception calendar, slots engine, public booking, waitlist, portal, commercial fields |
| **Business Management** | Profile, locations, catalog commerce scaffolds, taxes, forms, automation rules |
| **Reports & Analytics** | Executive KPIs, revenue/ops/financial reports, export, schedules, BI snapshot |
| **AI Receptionist Phase 1** | Emma — grounded knowledge, real slots, booking handoff, escalation, CRM logging |

Also foundational (earlier phases): design system, multi-tenant schema + RLS, services/staff/clients, integrations (Google/Outlook/Apple calendars), notifications, automation jobs, developer API surface.

| Milestone | Notes |
|-----------|--------|
| **OS Kernel (Foundation Sprint)** | Shared revenue recognition, commerce + platform event buses, business operating context, locale/datetime helpers, responsive DS polish — see `COMPANY_MEMORY.md` + `docs/product/22_OS_KERNEL.md` |

---

## Future

Ordered as strategic themes — exact sprint order lives in [`MASTER_TASKS.md`](./MASTER_TASKS.md).

### AI Workforce

- Deepen Emma (channels, FAQs config, public widget)
- Alex Scheduler automation beyond recommendations
- Maya Marketing, Leo Advisor, Sophia Success, Noah Ops — assist → automate stages
- Command Center as real workforce coordination
- Voice calling (architected; not yet implemented)

### Inventory & Products

- Product catalog, stock levels, low-inventory alerts
- Retail / product sales tied to appointments and invoices
- Supplier orders
- Reports already reserved an Inventory section (future-ready)

### Marketing Automation

- Campaigns, segments, birthday/win-back flows
- Owner-approved sends only
- Tie to Communication Center and CRM

### Stripe

- Live subscription billing and customer payments
- Replace / augment mock billing provider
- Webhooks, customer portal, dunning

### Square

- In-person and omnichannel payments for service businesses
- POS-adjacent flows where relevant

### Native Mobile Apps

- iOS / Android for owners and staff (reception-critical workflows first)
- Push notifications

### Marketplace

- Templates, integrations, industry packs
- Partner extensions with tenant-safe APIs

### Enterprise

- Org hierarchies, multi-business admin, advanced roles/permissions
- SSO, audit exports, SLA-oriented controls
- Cross-location rollups already seeded in Reports / Business

### Version 2

- Platform-wide UX/architecture leap after V1 departments are production-hardened
- Deeper AI collaboration, marketplace, and mobile as first-class
- Any intentional design-system evolution happens here — not as drive-by redesigns

---

## Roadmap rules

1. Do not mark future items complete until lint, build, CHANGELOG, and tenant-safe shipping bar are met.
2. Prefer finishing a department’s production path over starting three half-built themes.
3. AI features must obey AI Philosophy in the Bible (no invented business data).
4. Keep [`../ROADMAP.md`](../ROADMAP.md) for phase-level engineering detail; keep **this** file as the company-facing source of truth for completed vs future.

---

*Chasum Company Operating System — Master Roadmap*
