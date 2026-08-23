# Business slug aliases

Generic platform capability: **immutable tenant id** vs **human-readable public booking URL**.

This is not GVM-specific. No production GVM slug rows are inserted by the migration.

## Model

| Field | Role |
|-------|------|
| `businesses.id` | Authoritative tenant identity |
| `businesses.slug` | Current canonical public booking slug (`/book/{slug}`) |
| `business_slug_aliases.slug` | Retired public slug; unique; immutable; points at `business_id` |

## Resolution (`/book/[slug]`)

1. `businesses.slug = requested`
2. If hit → render
3. Else `business_slug_aliases.slug = requested`
4. If hit → load `business_id` → read **current** `businesses.slug` → `permanentRedirect` to `/book/{canonical}`
5. Else `notFound()`

No alias chains. Alias → `business_id` → current slug only.

## Redirect status

`permanentRedirect()` from Next.js App Router emits **HTTP 308**. That is the framework’s permanent-redirect primitive (not 301). It is semantically acceptable for a retired public URL. This code does not fake a 301.

## Canonical metadata

`generateMetadata` always sets `alternates.canonical` to `/book/{businesses.slug}` (current slug), never the requested alias.

## Call sites

| Site | Behavior |
|------|----------|
| `app/book/[slug]/page.tsx` | Alias-aware; 308 to canonical |
| `lib/actions/public-booking.ts` | Alias-aware so POSTs to a retired slug still mutate the same `business_id` |
| `lib/actions/scheduling.ts` `getPublicAvailableSlots` | Alias-aware |
| `getBusinessBySlug` | **Canonical only** — dashboard/internal current-slug lookup |

## Uniqueness

Enforced in PostgreSQL:

- unique `businesses.slug`
- unique `business_slug_aliases.slug`
- trigger: alias cannot equal any current `businesses.slug`
- trigger: current slug cannot equal another tenant’s alias
- slug rename automatically records the previous slug as an alias
- alias `slug` / `business_id` cannot be updated
- trigger functions are `SECURITY DEFINER` with `search_path = public, pg_temp` so authenticated profile saves (which always SET slug) do not need client INSERT/DELETE on aliases
- writes to either namespace take a transaction-scoped `pg_advisory_xact_lock` hashed from the slug so concurrent `businesses.slug` and alias claims cannot both pass EXISTS checks
- same-tenant reclaim (`foo` → `bar` → `foo`) deletes the alias row for `foo` because `foo` is canonical again — the identifier is not unreserved, it is current. That is the narrow exception to alias-row immutability.

## Staging / Production

Migration `039_business_slug_aliases.sql` must **not** be applied to Production in this incident. Staging only after review. GVM Production slug switch is a separate Product Owner data approval.
