# Customer Migration

Playbooks for moving businesses onto Chasum.

## GVM Baby World — Picktime migration

**Status:** In progress (first real customer).

### Phase 1 — Parallel run

1. Configure Chasum business (profile, hours, services, staff)
2. Keep Picktime active for live bookings
3. Test Chasum public booking with internal/test clients
4. Verify reminders and calendar sync

### Phase 2 — Cutover

1. Update website booking link → `/book/gvm-baby-world` (or final slug)
2. Embed widget on site (when embed ships) or link-only
3. Export Picktime client list → import to Chasum Clients
4. Block new Picktime bookings; honor existing Picktime appts until complete

### Phase 3 — Decommission

1. Cancel Picktime subscription
2. Archive Picktime export for records
3. Monitor first 2 weeks: no-shows, double-bookings, client feedback

## Data import (manual v1)

| Picktime export | Chasum target |
|-----------------|---------------|
| Client name, email, phone | `customers` |
| Service list | `services` (match duration/price) |
| Staff | `staff` + `staff_services` |
| Future appointments | `appointments` (manual or CSV script) |

Automated import tool: backlog item after GVM manual migration.

## Generic onboarding checklist

- [ ] Create account / sign in
- [ ] Business profile + slug
- [ ] Business hours + holidays
- [ ] Services (name, duration, price, buffers)
- [ ] Staff + service assignments + schedules
- [ ] Test appointment (dashboard)
- [ ] Test public booking
- [ ] Connect Google/Outlook calendar (optional)
- [ ] Configure email reminders (requires SMTP)
- [ ] Share public booking URL

## Verification before go-live

```bash
node scripts/audit-business-readiness.mjs
node scripts/verify-phase4-scheduling.mjs
```
