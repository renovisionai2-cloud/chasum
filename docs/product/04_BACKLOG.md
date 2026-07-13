# Backlog

Prioritized product + engineering work. Use GitHub issues with `[roadmap]` or `[backlog]` labels.

## P0 — GVM Baby World go-live

| Item | Type | Notes |
|------|------|-------|
| ~~Configure GVM business profile + slug~~ | Product | ✅ `/book/gvm-baby-world` |
| ~~Add ultrasound services (5 types)~~ | Product | ✅ Duration, price, buffers, prep, online booking |
| ~~Add staff + assign services~~ | Product | ✅ Owner as provider; bio/quals/location |
| ~~Set business hours~~ | Product | ✅ Mon–Fri 9–5 (Studio location) |
| ~~Public booking end-to-end test~~ | Product | ✅ `verify-sprint2-gvm-go-live.mjs` |
| First real appointment | Product | Dashboard or public — real client |
| Resend SMTP in Supabase | Ops | Production email templates |

## P1 — Post-go-live polish

| Item | Type | Notes |
|------|------|-------|
| Stripe billing | Feature | Plans in [09_PRICING_AND_PLANS.md](./09_PRICING_AND_PLANS.md) |
| Embeddable widget | Feature | Replace Picktime embed on GVM site |
| Email reminder tuning | Feature | 24h / 1h before appointment |
| E2E tests (Playwright) | Engineering | Critical booking paths |
| CI/CD (GitHub Actions) | Engineering | Lint, build, verify scripts |

## P2 — Growth features

| Item | Type | Notes |
|------|------|-------|
| AI scheduling assistant | Feature | See [08_AI_WORKFORCE.md](./08_AI_WORKFORCE.md) |
| Multi-staff login | Feature | Roles: owner, admin, staff |
| Analytics dashboard | Feature | Conversion, no-shows, revenue |
| Client self-service portal | Feature | Reschedule / cancel link |
| Custom domain | Feature | `book.gvmbabyworld.com` |

## P3 — Technical debt

| Item | Notes |
|------|-------|
| Rename `customers` → `clients` in DB | UI already says Clients |
| Middleware → proxy (Next.js 16) | Deprecation warning |
| Supabase Realtime calendar | Live updates without refresh |
| Generated Supabase TypeScript types | Type safety |
| Zod on server actions | Input validation |

## Icebox

See [99_IDEA_PARKING_LOT.md](./99_IDEA_PARKING_LOT.md).
