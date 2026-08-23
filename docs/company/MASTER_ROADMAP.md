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

### Database Release Automation

**Classification: DESIGN FOR NOW / BUILD LATER. Do not implement now.**

Manual SQL execution, environment confirmation, screenshots, prechecks, postchecks, and smoke tests are appropriate during sensitive migration cleanup, but must not become Chasum’s permanent database deployment process.

Long-term goal: a disciplined automated database release pipeline that preserves the current safety level while reducing manual Product Owner intervention.

Minimum future scope:

1. Explicit environment identity verification (Production and Staging must be impossible to confuse)
2. Migration state tracking per environment
3. Staging-first migration execution
4. Automated dependency / preflight checks
5. Transaction-safe execution where supported
6. Automated post-migration verification (tables, columns, constraints, triggers, RLS, grants, expected row counts, no unintended backfill)
7. Application smoke-test hooks
8. Production approval gate
9. Migration drift detection
10. Rollback / forward-recovery playbook
11. Audit log (migration, environment, commit, approver, execution time, verification result)
12. Prevent unsafe sequential CLI apply (`supabase db push` / `supabase migration up`) while gaps such as 034–036 exist

Canonical architecture note: [`../WORLD_CLASS_COMMERCIAL_FOUNDATION.md`](../WORLD_CLASS_COMMERCIAL_FOUNDATION.md).

### Marketing website audit follow-up

**Active workstream. Do not implement in the Track 2 closeout.** Locked pages still require explicit PO.

P0:

- Pricing should not imply Inventory is currently available if it remains Coming Soon
- Clarify current vs future multi-location capability

P1:

- Meet Summer should more strongly communicate Summer as the AI Business Manager
- Marketing currently undersells CRM, payments, scheduling integrity, and the connected operating model
- The website should communicate the connected Chasum operating journey rather than reading primarily like booking software

Also preserve:

- sitemap P1
- robots P2
- structured-data follow-up
- Private Alpha → future self-serve CTA transition
- annual pricing “Save 20%” reconciliation before final public pricing lock

Canonical: [`../WORLD_CLASS_MARKETING_PRODUCT_PARITY.md`](../WORLD_CLASS_MARKETING_PRODUCT_PARITY.md), [`../MARKETING_PRODUCT_FEATURE_AUDIT.md`](../MARKETING_PRODUCT_FEATURE_AUDIT.md).

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
