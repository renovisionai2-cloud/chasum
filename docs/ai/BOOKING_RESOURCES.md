# Booking resources (platform architecture)

Status: **prepared only**. Migration `036_booking_resources.sql` is **unapplied**.
Feature flag: `CHASUM_RESOURCES_ENABLED` / `NEXT_PUBLIC_CHASUM_RESOURCES_ENABLED` (default **off**).

## Goals

- Support concurrent bookings when enough **employees** and **physical resources** are free.
- Automatic resource assignment by default; optional manual selection.
- Generic resource types (room, chair, equipment, …) — not industry-specific code.

## Domain

See `lib/booking/resources.ts`:

- `BookingResource`
- `ServiceResourceRequirement`
- `AppointmentResourceAssignment`
- `allocateResources()` (pure)
- `maxConcurrentByResources()` (pure)

## What works without migration

- TypeScript contracts and pure allocation tests
- Feature flag stays off → no production UI for resources

## What requires migration approval

- Persisting resources / requirements / appointment_resources
- Availability engine intersection with resource busy blocks
- Resource calendar views
- Confirmation emails including assigned room/chair

## Future

- Multi-employee per appointment (assistant) — model for later; not exposed now

## Booking Sheet width preference

Stored separately from Reception panel:

- Reception: `chasum.receptionPanelWidthPx`
- Booking Sheet: `chasum.bookingSheetWidthPx`
