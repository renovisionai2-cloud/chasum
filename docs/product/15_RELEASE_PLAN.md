# Release Plan

## Current release

**v0.2.0** — Phase 3 (integrations) + Phase 4 (scheduling engine)

### Release criteria (met)

- [x] Migrations 001–007 applied
- [x] `verify-phase4-scheduling.mjs` passes
- [x] `verify-business-concurrency.mjs` passes
- [x] `audit-business-readiness.mjs` passes
- [x] `npm run lint` + `npm run build` pass
- [x] One business per owner enforced

### Known gaps before production traffic

- [ ] Custom SMTP (Resend) configured in Supabase
- [ ] Production env vars set (see `.env.example`)
- [x] GVM Baby World configured with real services
- [ ] First real appointment booked end-to-end

---

## Next release: v0.3.0 — GVM Go-Live

**Target:** When GVM runs a full week of real appointments on Chasum.

### Scope

- ~~GVM business configuration (production data)~~ ✅ Sprint 2
- Picktime cutover ([12_CUSTOMER_MIGRATION.md](./12_CUSTOMER_MIGRATION.md))
- Resend SMTP live
- Stripe billing (optional for v0.3.0 if GVM is comped)

### Release criteria

- [ ] GVM public booking URL live on marketing site
- [ ] ≥1 real client appointment booked via public flow
- [ ] Email confirmation delivered (not console)
- [ ] Owner confirms calendar matches studio schedule
- [ ] No duplicate business rows under load
- [ ] Rollback plan documented (revert to Picktime link)

---

## v1.0.0 — General Availability

**Target:** Q1 2027 (see [03_PRODUCT_ROADMAP.md](./03_PRODUCT_ROADMAP.md))

### Scope

- Stripe self-serve billing
- AI scheduling assistant (MVP)
- Embeddable widget
- Custom domain
- E2E test suite in CI
- Second paying customer beyond GVM

### GA criteria

- 99.5% uptime over 30 days
- Support playbook + docs site
- Security review complete
- Onboarding < 30 minutes for typical SMB

---

## Hotfix process

1. Branch from `main`
2. Fix + verify scripts relevant to change
3. Deploy via hosting provider
4. Note in [`../CHANGELOG.md`](../CHANGELOG.md)
