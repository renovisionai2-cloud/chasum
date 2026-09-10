# Package B — Communication consent compatibility

**Status:** Package B Production schema + app **COMPLETE** and **accepted**. Functional SHA `55905a4`. Production deploy `dpl_HLeaPWS86vixmStimVkfmqtvR8CH`. Staging A–H **PASSED**. Independent Claude pre-production verdict **A**. Mutation-based Production synthetic **NOT RUN — NO SAFE PRE-EXISTING PRODUCTION TEST TENANT** — **DESIGN FOR NOW / BUILD LATER**, **non-blocking** for Package B completion. No Production test tenant created. Overall Production recovery **not** complete. Hold **ON**. Cron **DISABLED**. Webhooks **OFF**. N2 still open. Package A separate. 034/035/036 blocked. Do not apply 027 wholesale.  
**Branch:** `cursor/package-b-communication-consent`  
**Does not** mark overall Production recovery complete. Does **not** restore Cron. Does **not** remove the Production hold.

## Purpose

Before the 2026-09-10 Package B Production rollout, Production `customers`
lacked `marketing_consent` / `marketing_consent_at`.
The preference loader SELECT of those columns failed as a whole, so
`preferred_communication_method` was dropped and a fail-loud schema error was
logged on every send. Transactional mail still proceeded; marketing failed closed.

Production now has both columns (schema **COMPLETE**, PostgREST **PASS**).
Existing Production rows read `marketing_consent=false` (consent not granted /
unknown historically, not explicit historical refusal) and `marketing_consent_at`
null. Application compatibility for an absent-column environment remains in
the Package B bytes.

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
- `lib/actions/crm.ts` / `lib/crm/customer-payload.ts` / `components/crm/customer-profile.tsx`:
  membership writes gated OFF. Create sets `marketing_consent_at` only when consent
  is granted. Updates distinguish **omit / grant / revoke** via
  `marketing_consent_intent` (Overview omits both consent columns; Marketing tab
  sends `intent=edit` plus a checkbox). Conditional UPDATE requires form-snapshot
  `expected_updated_at` + `id` + authenticated `business_id` and a returned row.
  Stale writes conflict; missing/foreign customers are not-found. Explicit
  grant/revoke still use sequential timestamp transitions. No extra SQL object.
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

That CLI file-upload Preview is historical. Provenance for publication is the git-linked Preview in the next section.

## Published revision + targeted validation (2026-09-09)

- Branch `cursor/package-b-communication-consent` published to `https://github.com/renovisionai2-cloud/chasum.git` (normal push, upstream set). No force push. Not merged to `main`.
- **Functional SHA** remains `77e40b61ec7239d563f072fab1cc7425590cd78b` (tree `5bbb9338dce20d47952496dde503278532fc3318`).
- Git-linked Preview created by that push: `dpl_4Pa3V1FfC9Kc5pqBzh4GzBS6Z1kg`
  (`chasum-4lbhm2h4z-renovisionappcom.vercel.app`), source `git`,
  `gitSource.sha` / `/api/build-info.commit` = `13854aa84251451b5eb8f9bb45213d493fa4a888`
  (`ref=cursor/package-b-communication-consent`, `env=preview`, `production=false`).
  Non-doc functional diff `77e40b61` → `13854aa` is empty (docs only). No Production alias.
- `/api/health` on that Preview: `email=missing`, `cronSecret=missing`,
  `sms=optional_missing`, `stripe=optional_missing`. Preview env names:
  `NEXT_PUBLIC_SUPABASE_URL` on Preview/staging; `CHASUM_WORKER_RELIABILITY_ENABLED` present;
  `RESEND_API_KEY`, `CRON_SECRET`, `CHASUM_WORKER_WEBHOOKS_ENABLED`, Twilio SID, Stripe secret **absent**.
- **AUTHENTICATED HOSTED ACTION (as of this 2026-09-09 publish):** **NOT RUN / BLOCKED** at that date. Superseded by **PASSED** evidence in [Authenticated hosted CRM A–H (2026-09-10)](#authenticated-hosted-crm-a-h-2026-09-10).
  Consent-timestamp transitions also remain **LOCAL/MOCK PASS** (`updateCrmCustomer` unit tests) and
  **LIVE STAGING DB PASS** (helper `consentTimestampForUpdate` + scoped service-role writes).
  Those helper writes are **not** hosted `updateCrmCustomer` evidence.
- **HOSTED PRODUCER** on `dpl_4Pa3V1Ff…` against Staging `wnfahklzaxirftyskctd`
  (`chasum-test-studio`, preferred=sms synthetic customer): `POST /api/v1/appointments` **201**.
  Jobs: confirmation email (`skipPreferenceCheck` absent/false); business email
  (`skipPreferenceCheck=true`); future email+SMS reminders (no skip flag); webhook
  `appointment.created` (no skip flag). No staff email (studio `staff_notifications_enabled=false`
  and staff email empty). No customer SMS job (studio `sms_notifications_enabled=false`).
  No `marketing.*` jobs. `membership_id` remained null. Webhook left pending; global queue
  was not processed.
- **ISOLATED RUNTIME WITH PROVIDER STUBS PASS** (`claimBackgroundJob` → `processClaimedJob`
  on tracked IDs only; providers stubbed; `processPendingJobs` not called):
  preferred=sms confirmation email → no email provider call, `delivery_skipped`;
  business email → one stub provider call, completed; inserted staff email with
  `skipPreferenceCheck=true` → one stub call; inserted confirmation SMS without skip →
  no SMS provider call (business SMS disabled). Live `sendEmail`/`sendSMS` `marketing.*`
  with `skipPreferenceCheck=true` → zero provider calls (consent false / missing customer /
  studio marketing off).
- **LOCAL/MOCK PASS** (newly run): marketing SMS skipPreferenceCheck cases; disabled
  owner/staff notification settings do not enqueue business/staff jobs.
- Pre-existing Staging queue: **28** rows (**20 pending / 8 completed**).
  idSha256 `c73fe449e797467f824143eac6b71406e5ed2d2b784dcac9e2556e948aa07dbe`
  (row membership). Full-state hash
  `9f668c55a88d9320a10d329c972f422cb39cddc04e0b2a50ef88e72b0367e62a`
  covering id, business_id, job_type, status, attempts, scheduled_at, next_retry_at,
  cancelled_at, started_at, completed_at. Both identical after scoped cleanup.
  Synthetic residue 0. Worker not invoked globally. No provider send.

## Consent revocation preservation (2026-09-09)

Claude’s prior fix-delta verdict **A — FIX DELTA APPROVED; HOSTED CRM ACCEPTANCE STILL REQUIRED** is preserved for sequential timestamps, audience separation, marketing hard gate, two-column SQL, and published source. Program Lead classified stale-form consent restoration as a bounded **P2** before Production rollout (Claude had labeled it P3).

Contract:
- Overview/profile save omits `marketing_consent` and `marketing_consent_at`.
- Marketing tab sends `marketing_consent_intent=edit`. Checked checkbox = grant; omitted checkbox = revoke. `formData.has("marketing_consent")` is not used as the presence signal.
- Updates require exact form-snapshot `expected_updated_at` (Staging trigger already exists on `customers`; microsecond `timestamptz` eq returns 0 rows when stale).
- Conditional write is `.eq(id).eq(business_id).eq(updated_at)` plus `.select("id")`; zero rows → conflict, not success.
- Missing-schema retry keeps the version predicate and cannot convert a failed consent write into a claimed grant/revoke.
- Form `key={id:updated_at}` remounts so a refresh cannot pair a new version with stale checkbox state.

Evidence:
- **LOCAL/MOCK PASS:** `tests/unit/actions/crm-consent.test.ts` (31 passed), including stale two-tab restore, concurrent grant timestamp, zero-row, foreign customer, and compatibility-guard cases.
- **LIVE STAGING DB PASS (trigger only):** synthetic probe showed `updated_at` changes on UPDATE; stale `updated_at` eq returns 0 rows; exact string eq updates; residue 0. Not an authenticated CRM action.
- **AUTHENTICATED HOSTED ACTION (as of this 2026-09-09 correction):** **NOT RUN / BLOCKED** at that date. Superseded by **PASSED** evidence in [Authenticated hosted CRM A–H (2026-09-10)](#authenticated-hosted-crm-a-h-2026-09-10).

No additional schema object. Worker, orchestrator, marketing delivery guard, and the two-column SQL file were not modified.

## P3-a consent error guard (2026-09-09)

Claude’s `fd8beb5e` verdict **A — CORRECTION APPROVED; AUTHENTICATED HOSTED CRM ACCEPTANCE STILL REQUIRED** remains the approval for the stale-form correction. Independent Claude then audited `fd8beb5e` → functional SHA `55905a44364d261a96a87fc5a1e0cbed9c168ab0` (tree `9f1e916dcdd505e9a959a3795bfcf627973b2662`) and returned **A — FINAL PACKAGE B PRE-PRODUCTION TECHNICAL GATES APPROVED**. No P0/P1/P2 and no new P3. The P3-a asymmetric-schema silent-success defect is **fixed**. Focused CRM consent tests **35/35 passed**. Hosted A–H **PASSED** on `55905a4` (below).

Abnormal-schema defense only (not reproduced by dropping Staging columns): if `marketing_consent` exists but `marketing_consent_at` is absent, a required consent SELECT could fail and the action previously fell through, saved other fields, and returned success without applying grant/revoke.

Invariant: an explicit grant/revoke must not report success if the required consent read or write failed, or if either consent field would be dropped by compatibility fallback. Profile-only Overview saves may still omit both consent columns.

**LOCAL/MOCK PASS:** `tests/unit/actions/crm-consent.test.ts` now **35 passed**, including SELECT/UPDATE missing `marketing_consent` and `marketing_consent_at` for grant and revoke.

## Authenticated hosted CRM A-H (2026-09-10)

**Verdict:** **PASSED.** Real hosted CRM UI / server-action path on Git-linked Preview against Staging. Not a service-role substitute. Does **not** authorize Production rollout. Independent Claude approval of `55905a4` is recorded separately below.

| Control | Value |
|---------|--------|
| Functional SHA | `55905a44364d261a96a87fc5a1e0cbed9c168ab0` |
| Preview | `dpl_e5RZDyCHvU44tjo2pJFD84c6NCd5` (`https://chasum-782b6ieif-renovisionappcom.vercel.app`), `target=preview`, `production=false` |
| Staging Supabase | `wnfahklzaxirftyskctd` |
| Tenant | Chasum Test Studio `73c78c46-4b97-4880-82a1-901eff429c47` (`chasum-test-studio`) |
| Production | `kxcydvhswkuzepwzzinq` unused |

Cases (hosted `updateCrmCustomer` forms only):

| Case | Result |
|------|--------|
| A Intentional Marketing grant | **PASS** — `marketing_consent=true`, T1 recorded |
| B Unrelated Overview save | **PASS** — consent true, `marketing_consent_at` exactly T1 |
| C Save after refresh/remount | **PASS** — succeeded; T1 preserved; no stale-version conflict |
| D Deliberate revoke | **PASS** — `marketing_consent=false`, `marketing_consent_at=null` |
| E Regrant | **PASS** — consent true, new T2, T2 ≠ T1 |
| F Stale Overview after newer revoke | **PASS** — conflict/rejection; consent remained false/null |
| G Stale checked Marketing after newer revoke | **PASS** — conflict/rejection; revocation remained false/null |
| H Foreign-tenant synthetic update | **PASS** — safe rejection equivalent to “Customer not found.”; neither tenant row mutated |

Queue before writes and after scoped cleanup (canonical sorted-ID comma join / full-state `|` fields `\n` rows):

- 28 rows, 20 pending / 8 completed
- idSha256 `c73fe449e797467f824143eac6b71406e5ed2d2b784dcac9e2556e948aa07dbe`
- stateSha256 `9f668c55a88d9320a10d329c972f422cb39cddc04e0b2a50ef88e72b0367e62a`

Both matched the established prior fingerprints. Worker, Cron, webhook delivery, provider email/SMS, and booking flow were **not** invoked.

Cleanup: 2 marked synthetic fixtures removed. Zero residue. GVM Baby World and Chasum HQ untouched.

**Remaining Production boundary:** Mutation-based Production synthetic **NOT RUN — NO SAFE PRE-EXISTING PRODUCTION TEST TENANT** (GVM forbidden; no HQ; do not use `prod-auth-…` / “My Business”). Program Lead classified this gap **DESIGN FOR NOW / BUILD LATER**; it does **not** block Package B completion. No permanent Production test tenant was created. Hosted CRM UI under the whole-project hold was **not** used and the hold was **not** weakened. Overall Production recovery is **not** complete. Hold **ON**. Cron **DISABLED**. Webhooks **OFF / absent**. N2 still open. Package A, N2, and migrations 034/035/036 remain separate. Do not apply 027 wholesale.

## Independent Claude final audit (2026-09-10)

**Verdict:** **A — FINAL PACKAGE B PRE-PRODUCTION TECHNICAL GATES APPROVED**

| Control | Value |
|---------|--------|
| Audited functional SHA | `55905a44364d261a96a87fc5a1e0cbed9c168ab0` |
| Functional tree | `9f1e916dcdd505e9a959a3795bfcf627973b2662` |
| Audit span | `fd8beb5e` → `55905a4` |
| Defects | No P0/P1/P2; no new P3 |
| P3-a | Asymmetric-schema silent-success defect **fixed** |
| Focused CRM consent tests | **35/35 passed** |
| Hosted A–H | **PASSED** on `55905a4` |
| Pre-production technical gates | **COMPLETE** |
| Production rollout | Claude verdict does **not** itself authorize rollout. PO authorized 2026-09-10. Dashboard SQL Editor resume: schema **COMPLETE**, PostgREST **PASS**, app deploy **COMPLETE**. Mutating synthetic **NOT RUN** and **non-blocking** (DESIGN FOR NOW / BUILD LATER). |

Hold **ON**. Cron **DISABLED**. Package A and N2 remain separate. 034/035/036 remain blocked. Do not apply 027 wholesale.

## Production rollout (2026-09-10)

Operator method for this Package B slice only: authenticated Supabase Dashboard SQL Editor as `postgres` on project `kxcydvhswkuzepwzzinq`. This does **not** change the session-mode psql requirement for 029 or other session-oriented packages.

| Control | Result |
|---------|--------|
| SQL identity | `current_database=postgres`, `current_user=postgres`, `session_user=postgres`, `server_version=17.6` |
| `customers_updated_at` | `BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION set_updated_at()` — unchanged |
| Two-column schema | **COMPLETE** (`marketing_consent` boolean NOT NULL default false; `marketing_consent_at` timestamptz nullable) |
| Existing rows | 26 unchanged; `marketing_consent=false` means consent **not granted / unknown historically**, not explicit historical refusal; all `marketing_consent_at` null; `true_count=0` |
| PostgREST | **PASS** — both columns selectable; OpenAPI recognizes both; no `42703`; no `membership_id` |
| Application | **COMPLETE** `dpl_HLeaPWS86vixmStimVkfmqtvR8CH` / source SHA `57b2fce` (docs-only successor of functional `55905a4` / tree `9f1e916…`; non-doc diff empty). Aliases: `chasum.vercel.app`, `chasum-renovisionappcom.vercel.app`, `chasum-git-main-renovisionappcom.vercel.app` |
| Queue | Unchanged 581 / idSha256 `480f98cf458af85045a874fdafa560fa4e505567fb6b318d7a052c4a41105bbb`; pending webhook `1060a548-…` attempts 0; canary email completed attempts 2 |
| Mutation-based Production synthetic | **NOT RUN — NO SAFE PRE-EXISTING PRODUCTION TEST TENANT**. **DESIGN FOR NOW / BUILD LATER**; does **not** block Package B completion. No Production test tenant created. |
| Hold / Cron / webhooks | **ON** / **DISABLED** / **ABSENT**. No provider send. No worker invoke. |

Do not apply 027 wholesale. Do not apply 034 / 035 / 036.

Package A remains separate. Claude N2 monitoring remains not live.
Production is **not** marked repaired.
