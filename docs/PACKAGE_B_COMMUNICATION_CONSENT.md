# Package B — Communication consent compatibility

**Status:** Staging / code implementation **validated**. **Production rollout is NOT authorized.**  
**Branch:** `cursor/package-b-communication-consent`  
**Does not** mark Production repaired. Does **not** restore Cron. Does **not** deploy Production.

## Purpose

Production `customers` currently lacks `marketing_consent` / `marketing_consent_at`.
The preference loader SELECT of those columns fails as a whole, so
`preferred_communication_method` is dropped and a fail-loud schema error is
logged on every send. Transactional mail still proceeds; marketing fails closed.

Package B is combined schema + application compatibility:

- add **only** the two consent columns
- keep preference reads working when the columns are absent
- stop CRM writes from sending gated `membership_id`
- stop CRM missing-column fallback from stripping valid consent fields

## Schema scope

File: `supabase/migrations/20260909140000_communication_consent_compatibility.sql`

```
BEGIN;
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;
COMMIT;
```

`NOTIFY pgrst` is documented **after** COMMIT, not inside the transaction.

Not 027. Does not fill 026–033. No membership, note types, document categories,
policies, grants, ACL, or backfill beyond `DEFAULT false`.

Staging already has these columns (historical 027 effects). Staging schema was
**not** mutated for this package. PostgREST on Staging already sees:

- `marketing_consent` boolean, default false, required
- `marketing_consent_at` timestamptz, nullable
- `membership_id` is present on Staging from historical 027; Package B does
  **not** write it and does **not** drop it

## Application

- `lib/communications/preferences.ts`: full SELECT; on a `marketing_consent`
  missing-column error only, narrow re-SELECT without that column, force
  `marketing=false`, preserve `preferred_communication_method`, structured
  rate-limited **warn** (no error/Sentry spam). Genuine DB errors keep
  transactional email/SMS available, marketing false, error + capture.
  Both primary and compatibility reads are scoped by `id` + `business_id`.
- `lib/actions/crm.ts` / `lib/crm/customer-payload.ts`: membership writes gated
  OFF. Create sets `marketing_consent_at` only when consent is granted.
  Updates read the current row scoped by `id` + authenticated `business_id`,
  then apply transitions: false→true stamps now; true→false clears; true→true
  and false→false preserve exactly (no rotation on unrelated profile edits).
- Business/staff appointment emails: orchestrator enqueue sets
  `skipPreferenceCheck: true` for `appointment.business` / `appointment.staff`.
  The worker appointment path now forwards that flag into `sendEmail`.
  Customer `appointment.confirmation` / reminder / cancellation / reschedule
  still honor customer preferences.
- Marketing hard gate: `sendEmail` / `sendSMS` deny any `marketing.*` template
  unless business marketing is enabled AND customer consent is true, **even
  when `skipPreferenceCheck=true`**. Missing customer fails closed.
- Missing-column CRM fallback still strips **only** the named missing column(s).

## Membership

DESIGN FOR NOW / BUILD LATER. Future: `memberships UNIQUE (business_id, id)` and
`customers FOREIGN KEY (business_id, membership_id) REFERENCES memberships (business_id, id)
ON DELETE SET NULL`, plus application `membership.business_id == customer.business_id`.
Not implemented here. Gate remains OFF.

## Staging validation evidence (2026-09-09)

- Target: Staging Supabase `wnfahklzaxirftyskctd` only. Production was not
  contacted. Staging schema was not altered.
- Known `chasum-test-studio` customer `marketing_consent=false`,
  `preferred_communication_method=null` (null is a real stored value). Live
  `loadCustomerCommPreferences` returned `preferredMethod=null`, `marketing=false`,
  transactional email allowed.
- Synthetic customer: consent false persists (`marketing_consent_at` null);
  consent true persists with timestamp; false again clears timestamp;
  `preferred_communication_method=email` preserved; `membership_id` not written
  (remained null). Residue cleaned.
- Live loader on synthetic `preferred=email`: preferred preserved, email on,
  SMS suppressed, marketing false. `channelAllowed` transactional email true;
  marketing email false (business `marketing_email_enabled=false` and consent
  false). Foreign `business_id` + same customer id returned empty-row
  fail-closed prefs (`preferredMethod=null`, `marketing=false`).
- `background_jobs` count 28 (20 pending / 8 completed). idSha256
  `c73fe449e797467f824143eac6b71406e5ed2d2b784dcac9e2556e948aa07dbe` unchanged
  vs the earlier Staging snapshot. This package's synthetic rows did not add,
  delete, or mutate jobs. Worker was **not** invoked. No provider send.
- Automated: Package B unit tests pass; communications / notifications /
  tenant-integrity regressions pass. `tsc --noEmit` clean. ESLint clean on
  touched files. One pre-existing unrelated marketing-site unit test remains
  red on HEAD (`multi-business-selection`).

Preview deploy identity is recorded below. Production application and Production
schema remain untouched.

## Preview-only deploy (bounded fixes, 2026-09-09)

- Functional SHA `77e40b61ec7239d563f072fab1cc7425590cd78b`
- Preview `dpl_7MxfwRvg8iRqLdX9wCudfZ3AK962`
  (`chasum-67o7easd4-renovisionappcom.vercel.app`), `target=preview`,
  `readyState=READY`. No Production alias. Not promoted.
- `/api/build-info`: `env=preview`, `production=false`
- `/api/health`: `email=missing`, `cronSecret=missing`, `sms=optional_missing`,
  `stripe=optional_missing` (Preview cannot send)
- Preview env names: `NEXT_PUBLIC_SUPABASE_URL` bound to **Preview, staging**;
  `RESEND_API_KEY`, `CRON_SECRET`, `CHASUM_WORKER_WEBHOOKS_ENABLED`,
  `TWILIO_ACCOUNT_SID`, `STRIPE_SECRET_KEY` **absent**. Reliability flag present.
- Staging live revalidation (service-scoped `id`+`business_id` reads/writes using
  `consentTimestampForUpdate`): original `marketing_consent_at` preserved on
  unrelated update; false clears timestamp; true stamps a new value. Synthetic
  `preferred=sms` suppresses customer email; marketing remains denied. Residue 0.
  Job idSha256 `c73fe449e797467f824143eac6b71406e5ed2d2b784dcac9e2556e948aa07dbe`
  unchanged. Worker not invoked.

Prior Preview `dpl_5AjSrE9TBdRLBBvtQZ7m44iQc8WZ` hosted a Package B
`POST /api/v1/appointments` **201** with pending confirmation (no marketing
jobs, residue cleaned). It is not Production.

## Future Production sequence (not authorized)

1. Schema transaction of this file only
2. COMMIT
3. `NOTIFY pgrst, 'reload schema';`
4. Verify PostgREST sees the columns
5. Deploy this application
6. Synthetic verification

Do not apply 027 wholesale. Do not apply 034 / 035 / 036.

Package A remains separate. Claude N2 monitoring remains not live.
Production is **not** marked repaired.
