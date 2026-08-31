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
- `getBusiness()` / `getOrCreateBusiness()` are **retrieval-only**. They never insert. Zero-business dashboard access redirects instead of creating a tenant.
- Explicit first-tenant creation is only `createInitialBusinessAction()` on `/onboarding/business` (name, timezone, currency), which calls `ensure_business_for_owner` after re-checking that the user has no accessible business. Signup plan intent is **not** written to `subscription_plan_key`.
- Routing (PO 2026-08-31): existing business → `/dashboard`; normal zero-business → `/onboarding/business`; Platform Admin zero-business → `/owner`. `/dashboard/hq` is **not** the Platform Admin default and is **not** the Chasum HQ tenant.
- These helpers still do **not** detect same-real-world-business duplicates across users.

## What is deliberately not built here

A fuzzy identity-matching service during onboarding. That is DESIGN FOR NOW / BUILD LATER. A low-risk UI hint (“an existing business may already match”) may be added later without expanding this patch.

## Future deletion

Do not delete `business_slug_aliases` rows to free a slug for another tenant. `ON DELETE RESTRICT` on `business_id` means a business row cannot be removed while aliases exist. Any future archive flow must keep historical public identifiers reserved.

## GVM duplicate-tenant incident — CLOSED (2026-08-24)

Production remediated + verified. This incident **no longer blocks the World Class Program**.

**Authoritative operational GVM (Tenant B)**

- `businesses.id`: `a04e1d65-eeb9-4d72-a5bf-739a9038bb91`
- Canonical slug: `gvm-baby-world`
- Public URL: `https://chasum.vercel.app/book/gvm-baby-world`
- Historical alias: `gvm-baby-world-ultrasound` → this `business_id` → 308 to `/book/gvm-baby-world`
- All operational rows remained on this id. None were moved.

**Retired shell (Tenant A)**

- `businesses.id`: `079288f2-4f6f-49ca-86aa-5190ae2c83ad`
- Slug: `gvm-baby-world-retired-079288f2`
- `public_booking_mode = staff_only`; `online_booking_enabled = false`
- Preserved; not deleted. Its existing customer was not moved.

Gate 6 forward executed (`post_forward_ok = true`). Emergency data rollback exists and was **not** executed. After the data switch, do **not** restore pre-alias-aware code unless that controlled data rollback runs first.

Follow-up prevention work (duplicate-business safeguards, onboarding detection, script environment assertions, optional Tenant A contact cleanup) is **separately tracked** and is not part of this closeout.
