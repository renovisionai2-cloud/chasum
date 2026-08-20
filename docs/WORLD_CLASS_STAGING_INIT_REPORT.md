# World Class — Staging initialization report (001–033)

**Program:** Chasum World Class Program  
**Task:** Initialize empty **Chasum Staging** by replaying migrations `001`–`033`  
**Mode:** **COMPLETE for approved SQL** — verification and schema-only compare done; **STOP** (no Preview cutover, no test tenants, no further SQL)  
**Branch:** `cursor/world-class-portal-foundation`  
**Production:** locked — `https://chasum.vercel.app`  
**Preview:** still on **Production** Supabase (no Vercel cutover)  
**Migrations 034 / 035 / 036:** **not applied**  
**Production SQL:** **NONE** (catalog `SELECT` only)  
**Production data copied:** **NO**  
**Chasum HQ created:** **NO**  
**GVM modified:** **NO**  
**Phase 6.3 / 6.4:** **NOT STARTED**

`.env.local` was not used. Secrets from `.env.staging.local` are not recorded here.

---

## A. `.env.staging.local` gitignore status

| Check | Result |
|-------|--------|
| Path | `/Users/darshan/chasum/.env.staging.local` (repository root) |
| Exists | **Yes** |
| Gitignored | **Yes** — `.gitignore` line 34: `.env*` |
| `git check-ignore` | `.gitignore:34:.env*	.env.staging.local` |
| Committed | **No** (must never be committed) |
| `.env.local` | Untouched; still present; **not used** |

---

## B. Staging target verification

| Check | Result |
|-------|--------|
| `CHASUM_SUPABASE_TARGET` | `staging` |
| Data API host | `wnfahklzaxirftyskctd.supabase.co` |
| Project ref | `wnfahklzaxirftyskctd` |
| Is Production ref `kxcydvhswkuzepwzzinq` | **No** |
| Management API name | **Chasum Staging** |
| Region | **`ca-central-1` (Canada Central)** |
| Project status | `ACTIVE_HEALTHY` |
| Created | `2026-08-18T18:37:28Z` |

SQL was sent only to `wnfahklzaxirftyskctd`.

---

## C. PAT verification

`GET /v1/projects` and `GET /v1/projects/wnfahklzaxirftyskctd` returned **200**. The PAT can list org projects (including Production by name/ref for identification only). **No Production writes.**

---

## D. PostgreSQL version

**Staging:** PostgreSQL **17.6** (`aarch64-unknown-linux-gnu`)  
**Production (read-only):** PostgreSQL **17.6** (`x86_64-pc-linux-gnu`)

Same major/minor. Architecture difference is **BENIGN**.

---

## E. Migration results 001–033

Applied sequentially via Management API `database/query` against **Staging only**. Stop-on-failure was armed; no failure occurred.

| File | Result |
|------|--------|
| `001_booking_engine.sql` | OK |
| `002_booking_enhancements.sql` | OK |
| `003_rls_hardening.sql` | OK |
| `004_phase3_integrations.sql` | OK |
| `005_phase4_scheduling_engine.sql` | OK |
| `006_deduplicate_businesses.sql` | **SKIPPED_COMMENTS_ONLY** (file has no executable SQL; equivalent to a no-op on empty Staging) |
| `007_one_business_per_owner.sql` | OK |
| `008_phase5_multi_location.sql` | OK |
| `009_phase5_drop_old_rpc_overloads.sql` | OK |
| `010_phase5_location_rls_hardening.sql` | OK |
| `011_sprint2_gvm_go_live.sql` | OK |
| `012_sprint7_public_booking.sql` | OK |
| `013_sprint8_gvm_go_live.sql` | OK |
| `014_owner_platform.sql` | OK |
| `015_billing_phase1.sql` | OK |
| `016_communication_center_phase1.sql` | OK |
| `017_employee_management.sql` | OK |
| `018_crm_department.sql` | OK |
| `019_booking_engine_2.sql` | OK |
| `020_business_management.sql` | OK |
| `021_reports_analytics.sql` | OK |
| `022_ai_receptionist.sql` | OK |
| `023_business_management_settings.sql` | OK |
| `024_services_module.sql` | OK |
| `025_employees_module.sql` | OK |
| `026_availability_engine.sql` | OK |
| `027_crm_phase_5_4.sql` | OK |
| `028_commerce_platform.sql` | OK |
| `029_communications_platform.sql` | OK |
| `030_repair_commerce_payment_columns.sql` | OK |
| `031_commerce_finalize_and_arrival_workflow.sql` | OK |
| `032_private_alpha_co_owners.sql` | OK |
| `033_private_alpha_co_owner_rls.sql` | OK |

**32 applied + 1 comments-only skip. 0 failed. 034–036 not reached.**

Repo CLI `schema_migrations` history was **not** written (SQL was applied via Management API, not `supabase db push`). That is **BENIGN** for this method.

---

## F. Confirmation 034–036 NOT applied

| Marker | Staging | Production | Meaning |
|--------|---------|------------|---------|
| `appointments.staff_id` nullable | **NO** | **NO** | `034` not applied |
| `businesses_appointment_interval_minutes_check` | **absent** | **absent** | `035` not applied |
| `public.resources` | **absent** | **absent** | `036` not applied |

`appointment_resources` / `booking_resources` exist on **both** databases from **earlier** migrations, not from `036`.

---

## G. Schema / object inventory (Staging)

| Object | Count / status |
|--------|----------------|
| `public` tables | **71** (RLS enabled on **all 71**) |
| `public` views | **0** |
| `public` functions | **209** |
| `public` RLS policies | **87** |
| Non-internal `public` triggers | **29** |
| Extensions | Same set as Production (no name/version drift) |
| Seed data | `subscription_plans` = **4** (from `008`) |
| Tenant / ops data | `businesses` = 0, `locations` = 0, `customers` = 0, `appointments` = 0, `platform_admins` = 0 |
| Auth users | **0** |

Public tables (Staging):  
`ai_receptionist_conversations`, `ai_receptionist_messages`, `api_keys`, `appointment_attachments`, `appointment_change_log`, `appointment_resources`, `appointments`, `availability`, `background_jobs`, `billing_invoices`, `booking_resources`, `business_automation_rules`, `business_closures`, `business_documents`, `business_hours`, `business_members`, `businesses`, `calendar_connections`, `commerce_audit_log`, `commerce_invoice_lines`, `commerce_invoice_sequences`, `commerce_invoices`, `commerce_receipts`, `commerce_refunds`, `commerce_transactions`, `communication_follow_ups`, `communication_history`, `communications_audit_log`, `custom_form_templates`, `custom_roles`, `customer_documents`, `customer_notes`, `customer_payment_events`, `customer_portal_tokens`, `customers`, `departments`, `discount_codes`, `external_events`, `gift_cards`, `holidays`, `location_hour_segments`, `location_hours`, `location_settings`, `locations`, `memberships`, `notification_logs`, `notifications`, `platform_admins`, `platform_alerts`, `recurring_rules`, `report_exports`, `report_schedules`, `service_blackouts`, `service_categories`, `service_locations`, `service_packages`, `services`, `staff`, `staff_activity`, `staff_closures`, `staff_documents`, `staff_hour_segments`, `staff_locations`, `staff_services`, `staff_vacations`, `staff_working_hours`, `subscription_events`, `subscription_plans`, `tax_rates`, `waitlists`, `webhook_endpoints`.

---

## H. Data API status

| Check | Result |
|-------|--------|
| PostgREST `db_schema` | `public,graphql_public` (same as Production) |
| `max_rows` | 1000 (same) |
| OpenAPI via service_role | **200** — **71** public tables exposed, including `businesses` and `communications_audit_log` |
| Auto-expose OFF at create | Tables from SQL **are** in the schema cache |
| Anon `GET /rest/v1/businesses` | **401** `permission denied for table businesses` (hint: `GRANT SELECT … TO anon`) |

**Root cause:** table ACLs, not schema cache.

Staging `postgres`-owned tables have ACL `{postgres=arwdDxtm, anon=Dxtm, authenticated=Dxtm, service_role=Dxtm}` — **no SELECT/INSERT/UPDATE/DELETE** for API roles.

Production equivalent tables have `{postgres=arwdDxtm, anon=arwdDxtm, authenticated=arwdDxtm, service_role=arwdDxtm}`.

`postgres` **default privileges** on Staging `public` tables also omit `arwd` for `anon` / `authenticated` / `service_role`. Production defaults include them.

This is **REQUIRES STAGING CORRECTION** before Preview can use Staging. **Not applied in this task** (stop after report). Do not change Production.

Public booking RPCs (`get_available_slots`, etc.) **do** have `EXECUTE` for `anon` from the migration files.

---

## I. RLS baseline (not hardened)

| Check | Result |
|-------|--------|
| RLS enabled | All 71 Staging public tables (matches Production for the 70 shared tables) |
| Policy definition diffs on shared policies | **None** |
| Extra Staging policies | 2 on `communications_audit_log` (from `029`) |
| `"Public can view businesses"` | Present: `SELECT` `USING (true)` — **unchanged** (known World Class isolation gap; **not** hardened) |
| `rls_auto_enable()` | Present on Staging only — dashboard helper from “automatic RLS for new public tables” |

RLS was **not** tightened. Hardening remains a later Staging-only task **after** grants match Production and Auth exists.

---

## J. Storage status

| Check | Staging |
|-------|---------|
| Bucket | `business-assets`, **public** |
| Objects | **0** (empty; no Production files copied) |
| Policies | `Owners upload business assets` INSERT; `Public read business assets` SELECT; `Owners update own assets` UPDATE; `Owners delete own assets` DELETE |

Production also has a `business-assets` public bucket (names only; objects not listed).

---

## K. Schema-only Production comparison

Method: identical `information_schema` / `pg_catalog` queries. Production: **`read_only=true`**, catalog only. No `COPY`, no row export, no DML/DDL.

| Class | Staging | Production |
|-------|---------|------------|
| Public tables | 71 | 70 |
| Tables only on Staging | `communications_audit_log` | — |
| Tables only on Production | — | **none** |
| Shared column type/null/default diffs | **0** |
| Shared RLS policy text diffs | **0** |
| Extra Staging columns | 16 (all from repo `029`) | — |
| Extra Staging indexes | 5 (029 + related) | — |
| Function signatures only on Staging | `availability_block_reason(...)`, `rls_auto_enable()` | — |
| Shared function body diffs | 3 availability RPCs (`026` revision) | older bodies |
| Enum `job_status` | includes `retrying` | no `retrying` |

---

## L. Schema drift findings

| Finding | Class |
|---------|--------|
| Empty tenant/auth data; 4 `subscription_plans` seed rows | **EXPECTED** |
| PG 17.6 arch difference; no CLI `schema_migrations` rows for 001–033 | **BENIGN** |
| `rls_auto_enable()` on Staging | **BENIGN** |
| Staging has full repo `026` (`availability_block_reason` + 3 RPC bodies) and full repo `029` (audit table, quiet hours, marketing, job retry, membership FK, …); live Production does **not** | **REQUIRES REPO BASELINE REPAIR** — changelog/discovery treat `026`/`029` as Production-applied; live Production is **behind the repo**. Do **not** apply them to Production in this program step. Staging matches the **files**, which is correct for Preview-after-cutover. |
| Table GRANTs / default privileges: Staging API roles cannot DML; Production can | **REQUIRES STAGING CORRECTION** — next SQL on Staging should align `public` table/sequence ACLs (and default privileges) with Production **without** changing RLS policies |
| `"Public can view businesses" USING (true)` on both | **EXPECTED** baseline (later RLS-hardening gate) |
| Anything else unexplained | **none** requiring **UNKNOWN / PO REVIEW** beyond the documented Production-behind-`026`/`029` gap |

---

## M. Do 001–033 reconstruct the accepted Production schema?

**No — not an exact match.**

They reconstruct the **repository schema through `033`**. That schema is a **superset** of live Production:

- Every Production public table exists on Staging.
- Shared columns, constraints (except 029 extras), and shared RLS policy text match.
- Staging additionally has `026`/`029` objects that live Production never fully received.
- Staging is **missing Production-style table GRANTs**, so it is not application-ready yet.

---

## N. Remaining Auth configuration

Staging Auth is still **project defaults**:

| Setting | Staging now | Needed before Preview cutover |
|---------|-------------|-------------------------------|
| Site URL | `http://localhost:3000` | Preview origin (not `https://chasum.vercel.app`) |
| Redirect allow list | **empty** | Preview `/auth/callback`, `/reset-password`; optional `http://localhost:3000/**` |
| Email confirmation | on (`mailer_autoconfirm=false`) | Match Production **or** PO disable for QA |
| SMTP | not configured | Staging/test mailer; do not use Production customer inboxes |
| Templates | default Supabase copy | Re-run template sync **against Staging** |
| Users | empty | Sign up new test users only — **never** copy Production `auth.users` |
| OAuth (Google/Apple login) | disabled | Keep disabled (calendar OAuth is separate) |

Production Site URL remains `https://chasum.vercel.app` with existing local + Production redirects. **Unchanged.**

---

## O. Remaining external-integration configuration

Not configured in this task. Preview still uses Production Vercel env.

Before Preview→Staging cutover (later PO task):

- Dedicated Staging Resend key **or** omit (Preview `NODE_ENV=production` will **fail** send, not fake it)
- Twilio unset or test
- Stripe unset or `sk_test_` — no Production webhook to Preview
- Calendar OAuth redirect URIs for Preview if those paths are tested

---

## P. Preview cutover readiness

**NO**

Blockers: Staging table GRANTs; Auth Site URL / redirects; Preview Vercel env still Production; no PO approval to change Preview env.

---

## Q. Test-data readiness

**NO**

No Auth users, no GRANTs for the app roles, no PO authorization to create **GVM Test** or **Chasum HQ**.

---

## R. RLS-hardening readiness on Staging

**NO**

Baseline must first include Production-equivalent GRANTs and remain the current policy set (including public business SELECT). Hardening is a later Staging-only task.

---

## S. Production DB impact

**NONE** (catalog reads only)

## T. Production application impact

**NONE**

## U. GVM impact

**NONE**

## V. Production data copied

**NO**

## W. Chasum HQ created

**NO**

## X. Phase 6.3 implementation

**NOT STARTED**

## Y. Phase 6.4

**NOT STARTED**

---

## Z. Files modified

- `docs/WORLD_CLASS_STAGING_INIT_REPORT.md` (this report)
- `.env.staging.local` — **local only, gitignored, not committed**

No application code, no Production config, no Vercel env.

---

## Environment contract (still locked)

| Surface | Database |
|---------|----------|
| Production (`https://chasum.vercel.app`) | Production Supabase **only** |
| Preview | Production Supabase **until** a later PO-approved cutover |
| Staging project `wnfahklzaxirftyskctd` | Schema `001`–`033` present; **not** wired to Preview yet |
| Migrations | Staging first → PO test → explicit Production approval → Production |

**Recommended next Staging-only step (not executed):** GRANT/default-privilege repair to match Production table ACLs, then Auth Site URL / redirects. Still **do not** connect Vercel Preview until PO explicitly orders cutover.
