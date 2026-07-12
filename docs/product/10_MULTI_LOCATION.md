# Multi-Location

## Status

**Shipped — Phase 5 (Foundation).** Single-location businesses continue to work via auto-created default location.

## Model

```
businesses (org / tenant root, 1 per owner)
  ├── subscription_plan_key → subscription_plans.max_locations
  ├── locations[] (physical sites)
  │     ├── location_settings (interval, booking window, daily cap)
  │     ├── location_hours (open/close per day)
  │     ├── staff (location-scoped)
  │     ├── services (location-scoped)
  │     ├── appointments (location-scoped)
  │     └── availability blocks (location-scoped)
  └── customers (business-scoped, shared across locations)
```

## Dashboard behavior

- **Location switcher** in top nav: current location or "All locations"
- Cookie `chasum_location_scope`: location UUID or `ALL`
- Calendar, staff, services, settings, and reports filter by active scope
- Customers and client history remain business-wide

## Public booking

- Single location: unchanged UX (default location used)
- Multiple locations: location picker step; `?location=<slug>` deep-links
- Slots validated via `get_available_slots(..., p_location_id)`

## Subscription limits

Location caps come from `subscription_plans`, not hard-coded app logic:

| Plan | Max locations |
|------|---------------|
| starter | 1 |
| professional | 3 |
| business | 10 |
| enterprise | unlimited |

Enforced by `can_add_location()` RPC at create time.

## Future extensions (metadata-ready)

`locations.metadata` and `location_settings.metadata` JSONB reserved for:

- Departments
- Rooms
- Equipment
- Inventory
- Franchises / enterprise HQ views

## Migration

`008_phase5_multi_location.sql`:

- Creates tables + backfills default location per business
- Adds `location_id` to operational tables
- Updates scheduling RPCs with optional `p_location_id`

Verification: `node scripts/verify-phase5-multi-location.mjs`
