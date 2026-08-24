# Business slug aliases

Generic platform capability: **immutable tenant id** vs **human-readable public booking URL**.

This is not GVM-specific. Migration 039 inserts **no** tenant-specific rows. The GVM Production slug switch was a **separate** Product Owner data change (Gate 6, 2026-08-24) and is now **closed**.

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

Migration `039_business_slug_aliases.sql` is **APPLIED + VERIFIED on Production** (`kxcydvhswkuzepwzzinq`). PR #18 alias-aware booking is **DEPLOYED + VERIFIED** at serving commit `68e9a816a230636e693d0e10b9b8ae7f3beb1e62` (`https://chasum.vercel.app`).

The committed migration must keep uppercase `TG_OP` literals (`tg_op = 'UPDATE'`).

### GVM Production identity (CLOSED — 2026-08-24)

Gate 6 forward remediation executed successfully (`post_forward_ok = true`). Rollback was **not** used.

| Tenant | `businesses.id` | Current slug | Public booking |
|--------|-----------------|--------------|----------------|
| **B — operational GVM (authoritative)** | `a04e1d65-eeb9-4d72-a5bf-739a9038bb91` | `gvm-baby-world` | Canonical `https://chasum.vercel.app/book/gvm-baby-world` |
| **A — retired shell (preserved)** | `079288f2-4f6f-49ca-86aa-5190ae2c83ad` | `gvm-baby-world-retired-079288f2` | `public_booking_mode = staff_only`, `online_booking_enabled = false`; not deleted |

Historical alias: `gvm-baby-world-ultrasound` → Tenant B → 308 to `/book/gvm-baby-world` (verified). No `gvm-baby-world` alias. Operational rows stayed on Tenant B; none were moved. Tenant A’s customer was not moved.

After this data switch, bare rollback to pre-alias-aware code is **not** permitted unless the controlled data rollback runs first.

This incident **no longer blocks the World Class Program**.

### Staging TG_OP correction (2026-08-23)

Live Staging validation found that `tg_op = 'update'` never matches. PostgreSQL sets `TG_OP` to `INSERT` / `UPDATE` / `DELETE` / `TRUNCATE` (uppercase). After the trigger functions were corrected to `tg_op = 'UPDATE'`:

- authenticated Business Profile save succeeded
- a valid slug rename recorded the previous slug as an alias
- `businesses.id` stayed stable
- `/book/{old-slug}` redirected to `/book/{canonical}`

Chasum HQ Staging was restored to canonical slug `chasum-hq` (`businesses.id` `724d9ecd-438d-439e-952e-2d8c4ab4486c`). `chasum-hq-test` remains a historical alias. `/book/chasum-hq-test` redirects to `/book/chasum-hq`.
