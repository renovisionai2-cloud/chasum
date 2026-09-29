# Multi-Location

## Status

**Stage 1 complete / Production accepted; Issue #102 read-model convergence complete.** Single-location businesses remain simple through their default Location. Multi-location operating truth uses explicit relationship tables rather than treating home/legacy Location metadata as exclusive scope.

## Governing model

```text
BUSINESS
  ├── LOCATIONS
  ├── BUSINESS SERVICE CATALOG
  │     └── each Service may be offered at ONE / SOME / ALL Locations
  ├── STAFF
  │     └── each Staff member may work at ONE / SOME / ALL Locations
  └── CUSTOMERS
        └── business-scoped, shared across Locations

Service offered at Location  -> service_locations
Staff works at Location      -> staff_locations
Staff provides Service       -> staff_services
Appointments / availability  -> Location-aware operational records
```

Bookability at a selected Location requires all relevant operating truth:

1. Service is offered at the Location.
2. Staff is allowed at the Location.
3. Staff provides the Service.
4. Location/business hours, staff availability, conflicts and other operating rules pass.

`service_locations`, `staff_locations` and `staff_services` are the canonical relationship truth.

`services.location_id` and `staff.location_id` remain primary/home/compatibility metadata during Stage 1. They do **not** mean “only offered here” or “only works here.”

Issue #102 completed read-model convergence so Command Centre, Services, Employees, Reception, Booking Sheet and public booking consume this relationship truth consistently.

## Workspace scope

- Canonical cookie: `chasum_location_scope`.
- Values: a Location UUID or `ALL`.
- Smartphone M1A uses the canonical `setLocationScope()` action and a phone workspace Sheet.
- At `sm`/tablet and above, the existing top-nav `LocationSwitcher` remains the selector.
- Single-location tenants show simple static Location context rather than unnecessary switching controls.
- `ALL` means business-wide **workspace presentation**. Mutation/default-location semantics are separately governed; the known new-appointment ALL guard belongs to M1B, not M1A.

Customers and customer history remain business-wide unless a specific workflow intentionally scopes them.

## Public booking

- Single Location: default/simple Location experience.
- Multiple Locations: Location selection/deep-link behavior uses explicit relationship truth.
- Public bookability requires the same Service/Staff/Location relationship checks used by the operating system.
- Scheduling RPCs remain Location-aware and validate availability rather than inventing times.

## Add Location — Stage 1C

`create_location_from_template()` is the accepted atomic Add Location workflow.

Setup modes:

- **Default** — snapshot from the active default Location.
- **Copy** — snapshot from an explicitly selected active Location.
- **Start Blank** — create valid Location settings/hours without copying Service or Staff relationships.

Stage 1C uses snapshot/copy semantics, **not live inheritance**. Staff assignment remains deliberate. Stage 2 Location overrides and Stage 3 live inheritance remain later work.

## Location entitlements

Current canonical application / Stage-1C limits:

| Plan | Max active Locations |
| --- | ---: |
| Starter / Free | 1 |
| Professional | 3 |
| Business | 6 |
| Enterprise | unlimited |

Current application entitlement logic is represented by `PLAN_LOCATION_LIMITS`; creation is also protected by the database `locations_enforce_plan_quota` trigger. `can_add_location()` remains part of the capability/read path but is not the sole enforcement mechanism.

### Source/history reconciliation note

Historical Phase-5 seed/source material and comments still contain an older Business limit of **10**, while the accepted current application/Stage-1C limit is **6**. Later Stage-1C accepted runtime/database records use 6.

This is a separate **entitlements-truth source/history follow-up**. Do not silently change seeds, entitlement code, RPCs, triggers, migrations or live data as part of M1A documentation closeout.

## Future extensions

Design now / build later:

- Stage 2 Location overrides
- Stage 3 live inheritance
- bulk relationship controls
- resource-aware booking
- cross-Location staff conflict visualization
- saved calendar filters/presets
- durable Summer action provenance and safe ACT paths

`locations.metadata` / `location_settings.metadata` remain available for future structured extensions where appropriate; metadata must not replace explicit operating relationship truth.

## Historical foundation

Phase 5 migrations established Locations and Location-aware scheduling, including:

- `008_phase5_multi_location.sql`
- `009_phase5_drop_old_rpc_overloads.sql`

Later Stage 1B/1C and Issue #102 hardened and converged that foundation. For current truth, prefer `docs/CURRENT_PROJECT_STATE.md`, this document, and the dated acceptance records in `docs/runtime/ENVIRONMENT_MANIFEST.md` over older Phase-5-only assumptions.
