# North Star

## Metric

**Appointments successfully completed per active business per month** — booked in Chasum, showed up, marked completed.

Supporting metrics:

- Public booking conversion (visit → confirmed appointment)
- No-show rate (before vs. after reminders)
- Time to first booking (signup → first real appointment)
- Owner weekly active use (calendar + at least one action)

## Guiding principle

> **If GVM Baby World can't run their Friday schedule on Chasum, we're not ready to ship it.**

Dogfood the product with a real ultrasound studio before optimizing for hypothetical users.

## Current milestone

**Book a real ultrasound appointment in Chasum instead of Picktime.**

Checklist for GVM Baby World:

- [ ] Business profile: GVM Baby World Ultrasound
- [ ] Staff: owner/operator
- [ ] Services: 2D, Gender Reveal, 3D/4D, 5D HDLive, Heartbeat Recording
- [ ] Business hours configured
- [ ] First real appointment created in dashboard
- [ ] Public booking page live and tested
- [ ] Client receives confirmation (email when SMTP live)

## Quality bar

| Area | Bar |
|------|-----|
| Scheduling | Zero double-bookings; dashboard and public slots always match |
| Data | One business per owner; no orphaned tenant data |
| UX | Mobile-usable booking flow; < 3 min to book as a client |
| Ops | Migrations applied; verification scripts pass before release |
