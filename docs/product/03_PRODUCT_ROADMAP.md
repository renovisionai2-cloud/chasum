# Product Roadmap

High-level phases. Detailed engineering status: [`../ROADMAP.md`](../ROADMAP.md).

## Shipped

| Phase | Theme | Outcome |
|-------|-------|---------|
| **1** | Foundation | Auth, marketing site, dashboard shell |
| **2** | Booking engine | Services, staff, calendar, public booking |
| **—** | Architecture review | RLS hardening, shared UI, performance |
| **3** | Integrations | Calendar sync, email/SMS, API, webhooks, waitlist |
| **4** | Scheduling engine | Unified `get_available_slots`, SlotPicker, conflict prevention |
| **4b** | Tenant integrity | One business per owner, idempotent `ensure_business_for_owner` |
| **5** | Multi-location foundation | Locations, shared customers, plan limits, location switcher |
| **Sprint 1** | Brand Integration | Official C + Spark marks, design tokens, UI primitives |
| **Sprint 2** | GVM Baby World go-live | Production tenant profile, ultrasound catalog, staff profiles, booking E2E |

## In progress

| Milestone | Owner | Target |
|-----------|-------|--------|
| Custom SMTP (Resend) | Ops | Production auth + appointment emails |
| First real client appointment | Product + GVM | Cutover from Picktime |

## Planned

### Phase 6 — Monetization & AI

- Stripe subscriptions and plan limits (billing integration)
- AI scheduling assistant
- Multi-staff login and roles
- Analytics dashboard
- Embeddable booking widget
- Custom branding / domain
- Client self-service portal

### Phase 7 — Scale

- Enterprise features (see [11_ENTERPRISE.md](./11_ENTERPRISE.md))
- Mobile app (staff calendar)
- Supabase Realtime live calendar
- Departments, rooms, equipment (extends location metadata)

## Version targets

| Version | Scope |
|---------|-------|
| `0.2.0` | Phase 3 + 4 |
| `0.2.5` | Phase 5 multi-location foundation |
| `0.2.6` | Sprint 1 brand + Sprint 2 GVM go-live (current) |
| `0.3.0` | GVM live traffic + Stripe + production SMTP |
| `1.0.0` | GA with billing, AI assistant, embed widget |
