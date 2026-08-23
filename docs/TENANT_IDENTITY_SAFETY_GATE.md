# Tenant Identity Safety Gate

**Status:** Platform invariant  
**Applies to:** Every Chasum tenant (GVM Baby World, Chasum HQ, future businesses)

## Rule

Before any **real** business is:

- created
- re-onboarded
- promoted
- granted Private Alpha
- reassigned
- renamed
- targeted by Production setup automation

the operator / process **must** verify whether an authoritative existing tenant already represents that real-world business.

If ambiguity remains: **STOP**. A second tenant must not be created for the same real-world business without explicit Product Owner approval.

## Minimum checks

1. Immutable `businesses.id` when known.
2. Existing `business_members` for the operator.
3. Current `businesses.slug`.
4. Historical `business_slug_aliases.slug`.
5. Similar business name during Private Alpha manual review.
6. Existing operational data (customers, appointments, commerce).

Slug and display name are **not** identity.

## What this repo enforces now

- `businesses.id` remains the tenant key for customers, appointments, commerce, staff, services, locations, memberships, and notifications.
- Public booking URLs resolve `businesses.slug` first, then a one-hop `business_slug_aliases` lookup to that same `business_id`.
- Historical slugs cannot be hijacked by another tenant (unique alias slug + cross-table exclusion).
- `getOrCreateBusiness()` / `ensure_business_for_owner` still create a tenant only when the signed-in user has no membership and no owned row. They do **not** detect same-real-world-business duplicates across users.

## What is deliberately not built here

A fuzzy identity-matching service during onboarding. That is DESIGN FOR NOW / BUILD LATER. A low-risk UI hint (“an existing business may already match”) may be added later without expanding this patch.

## Future deletion

Do not delete `business_slug_aliases` rows to free a slug for another tenant. `ON DELETE RESTRICT` on `business_id` means a business row cannot be removed while aliases exist. Any future archive flow must keep historical public identifiers reserved.
