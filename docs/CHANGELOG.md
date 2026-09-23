# Chasum Changelog

All notable changes to this project are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 2026-09-23 — Global go-to-market strategy lock

- Add one durable company strategy for **GLOBAL PRODUCT READINESS + GLOBAL DISCOVERY + DELIBERATE REGIONAL ACTIVATION**.
- Separate product readiness from market discovery while requiring all country/region marketing to consume governed readiness truth; **marketing must never outrun product truth**.
- Preserve future SEO/AEO/GEO discovery, country/industry/comparison content, assisted switching, Powered by Chasum, referrals, partners, review platforms, integrations, content and evidence-led paid acquisition without starting implementation now.
- Require a single Global Readiness-owned Market Readiness Matrix rather than a conflicting marketing availability list.
- Preserve Trinidad & Tobago and Guyana as candidate early international design-partner markets, with Jamaica and Barbados as possible Caribbean candidates subject to readiness/research; no launch authorization or permanent country order is created.


### 2026-09-23 — Global-by-design roadmap lock

- Make **GLOBAL ARCHITECTURE NOW. REGIONAL ACTIVATION DELIBERATELY.** a permanent Chasum constitutional principle.
- Core architecture must not silently hardcode Canada/U.S.-only assumptions for locale/language, timezone/DST, money, addresses, phone, tax, invoice/legal fields, payments, communications, consent/privacy/compliance or Summer context; regional behavior stays configurable/isolated.
- Insert the bounded **Global Readiness Foundation** after Outside Private Alpha readiness and before Commercial SaaS Gate B, Summer horizontal v1, native material implementation and broader regional/public expansion.
- This is governance/roadmap only; it does not start a global implementation project or interrupt current Issue #73 work.


### 2026-09-23 — Issue #73 Package B2 core (MERGED / STAGING + PRODUCTION ACCEPTED)

- PR #93 exact accepted head `84168a3c630550f040866700def2edcacdbd16c2` squash-merged as `06c7d502948a321b706ba07036724c9178e428e7`; Vercel Production deployment `dpl_HUcbeyiham9KTNftrZCB4QTinu2K` READY and direct build-info confirms the exact merge on Production.
- Add primary-owner-only, service-role governed import RPCs with authoritative snapshot/preview commitments, bounded atomic row/ref/audit batches, stable source identity and fenced lease recovery.
- Preserve exact future-appointment money without booking events or communications; create safe blank Locations, internal Services with enforced explicit commercial review, and Staff with immediately closed seeded hours.
- Production DB prerequisites were applied and verified DB-first before application deployment: B1 `20260923185926 / governed_import_foundation`, Staff quota `20260923190213 / issue_73_staff_quota_hardening`, B2 `20260923190501 / issue_73_package_b2_core`.
- Exact B2 migration `20260923210000_issue_73_package_b2_core.sql`, SHA-256 `0f051b80fbdca7e199b8382e7d400785d408d73c6799beba17de0591c79c6062`.
- Staging hosted synthetic acceptance passed owner authority, two-batch 65-row commit, begin-CAS, lease expiry/reclaim/fencing, readiness/closed-hours behavior, exact money, zero communications/job delta and full cleanup.
- All 31 existing Production Services were preserved as reviewed; all 14 GVM Services reviewed. GVM remained 3 Locations / 14 Services / 3 Staff / 9 Appointments. Production import runs/refs/outcomes remained zero and no synthetic Production import/customer/provider test was created.
- Governance incident retained: the B2 Staging migration had been applied earlier than its PO gate through a Supabase MCP management request; it was later detected/reconciled and not force-reapplied. Do not treat current schema as implicit authorization.
- Issue #73 remains open for the customer-facing Package C migration product. Next safe gate is read-only Product/Architecture/UX preflight; do not reopen B2 core absent contradictory evidence.


### 2026-09-23 — Issue #73 Staff quota hardening (MERGED / STAGING + PRODUCTION ACCEPTED)

- PR #92 exact accepted head `d13bbf164a321296f7fb7fd9c627904ecc41fba7` squash-merged as `18933a3268a57f01daf439b9d116b4672a002a1d`.
- Add guarded `subscription_plans.max_staff` values 1 / 3 / unlimited / unlimited and a Business-row-serialized Staff trigger for active INSERT and inactive→active UPDATE. Preserve grandfathered Staff and all non-consuming updates.
- Exact migration `20260923152046_issue_73_staff_quota_hardening.sql`, SHA-256 `e79b37d31d5aaf3e28ac48d18949e1dd892bdd0c7eb97f98492f0165e0fd7432`, accepted on Staging and Production. Production ledger: `20260923190213 / issue_73_staff_quota_hardening`.
- GVM remains a grandfathered Starter tenant with 3 active Staff against max 1; existing Staff were not removed/deactivated, but new active Staff/reactivation is blocked while at/above the finite cap.
- Map the controlled database quota error across existing Staff, employee and owner-onboarding writers; application/SQL parity and disposable PostgreSQL concurrency tests passed.


### 2026-09-23 — Multi-location Add Location template workflow (Issue #81 Stage 1C, MERGED / PRODUCTION ACCEPTED)

- PR #89 exact accepted head `457a6ab8da23c1104a81208338024511ab4f8115` squash-merged as `0a81084362ac43d076b35aa0cb463f4efd136afe`; Vercel Production deployment `dpl_8cgdg2JJJ984Y4jf5LFvPfrXHMV4` READY and direct build-info confirms the exact merge on Production.
- Add Location now offers Default Location — Recommended, Copy Another Location, and Start Blank; source-based setup snapshots concrete hours/settings and reuses Business Service Catalog rows through `service_locations` rather than duplicating Services.
- Staff assignment is deliberate and secondary-safe through `staff_locations`; Staff home/default Location is not moved. Resources remain explicit and are not copied or treated as public-booking authority.
- Location creation is atomic and concurrency-safe through the governed `create_location_from_template` path. Canonical location entitlement is starter 1 / professional 3 / business 6 / enterprise unlimited; existing over-limit tenants are preserved but cannot add until entitlement permits it.
- Exact migration `20260922210000_issue_81_stage_1c_location_template.sql` SHA-256 `6a4e3285382d1d1fbd9592af70ec1e2476ac8c9bec28cd0ba6a0e3287b3cb98f` is accepted on Staging and Production. Production ledger: `20260923135852 / issue_81_stage_1c_location_template`. Migrations 034–036 remain unapplied.
- Hosted desktop/tablet/mobile acceptance passed after a bounded shared Dialog stacking correction prevented fixed mobile navigation from intercepting modal actions at 390×844.
- GVM remained unchanged at 3 Locations / 14 Services / 3 Staff / 9 Appointments. As a grandfathered Starter tenant, GVM can continue operating existing Locations but cannot add another Location until its entitlement changes.
- Stage 2 location-level overrides and Stage 3 live inheritance remain DESIGN FOR NOW / BUILD LATER.


### 2026-09-22 — Multi-location relationship + public-booking convergence (Issue #81 Stage 1B, MERGED / PRODUCTION ACCEPTED)

- PR #87 exact audited candidate `7656bf6a163fa1708537c0f2cb7abf5088c3575b` squash-merged as `1d4ecc759076acb82da9f346ec05948e6e0194ca`; normal Vercel Production deployment SUCCESS.
- Service↔Location, Staff↔Location and Staff↔Service same-Business integrity is enforced below RLS; `services.business_id`, `staff.business_id` and `locations.business_id` are immutable.
- Relationship RLS/ACLs and booking RPC EXECUTE posture are normalized; public-safe relationship discovery uses narrow boolean SECURITY DEFINER helpers with pinned search_path and explicit grants.
- Public Service/Staff discovery, Booking Engine, Reception, slot validation and final public writer now share Stage-1 primary-or-explicit-mapping location truth; `staff_services` remains required and unmatched secondary Staff fails closed.
- Final public booking validates relationships before Customer mutation. Named Staff remains required; optional/unassigned Staff persistence and resource-aware booking remain out of scope.
- Exact migration `20260922050000_issue_81_stage_1b_relationship_booking_convergence.sql` SHA-256 `82d1a480f604833b38d89da5792e63db0cc3c061ec485580f4bd5df7b544ba6d` is accepted on Staging and Production. Production post-apply counts remain 31 / 10 / 56 relationship rows with zero cross-tenant links, zero orphans and zero missing primary mappings. Migrations 034–036 remain unapplied.
- Production smoke was read-only: real public-role discovery, slot generation and slot validation only. No manufactured GVM booking, Customer mutation or provider communication.


### 2026-09-21 — Operator Business Service Catalog (Issue #83 candidate)

- Services keeps the Business catalog visible and distinguishes offering status at the selected location; safe quick enablement adds a service_locations relationship without duplicating Service records.
- Calendar/Reception/client-profile Booking Sheet uses the same primary-or-explicit-membership rule, including location switching and Reception service sampling.
- Existing getServices callers outside this booking scope, public booking, staff eligibility, availability SQL and financial semantics remain unchanged. No migration or hosted data mutation. Not merged; hosted acceptance remains pending.
- Scope, call-site inventory and validation limitations: [Stage 1A implementation evidence](multi-location/ISSUE_83_STAGE_1A.md).


### 2026-09-20 — Customer confirmation location address + one-tap directions (Issue #62 candidate)

- Customer appointment emails now use the appointment's own location row for arrival information: customer-facing name, structured physical address, and a Google Maps search "Get directions" link when `address_line1` plus city or postal code is present.
- Applies to customer confirmation, reminder, reschedule, and cancellation HTML and plain text through one shared location helper. Staff and business appointment emails keep name-only location semantics (no customer directions CTA).
- Reminder/reschedule/cancellation plain text keep their existing opening sentence and append only timezone cue / Location / Address / Directions — they do not repeat a second Service/Provider/When block.
- Same-business location identity fails closed: matching `business_id` is required. Missing, blank, or foreign `business_id` omits customer location/address rather than inferring ownership.
- Date/time remains location → business → fallback timezone formatting. When the location timezone differs from the business timezone, customer emails add a concise "Times shown in {abbrev}." cue using the existing abbreviation helper.
- No schema migration, SMS change, ICS redesign, self-service cancel/reschedule, Maps API/geocoding, Production mutation, or provider/config change.

### 2026-09-19 — Competitive Product Gate governance (Issue #60 candidate)

- Make competitor/parity review a mandatory pre-build gate for material customer/operator features rather than a chat-memory convention.
- `AGENTS.md` now assigns gate applicability and bounded competitor research to Control Tower before engineering assignment; explicit exemptions remain available for documentation, maintenance, recovery, relevant security work, and already-defined narrow fixes.
- Reuse `docs/company/PRODUCT_PRINCIPLES.md` as the canonical detailed gate: evidence, parity floor, Chasum advantage, switching test, product contract and world-class acceptance.
- Add a material-product GitHub issue form, PR acceptance template, and a mechanical PR-body check. Automation validates that the gate was completed (or reasoned NOT_APPLICABLE); it does not judge product-analysis quality.
- No application runtime, Production, tenant, Auth, RLS, schema, booking, financial or provider behavior changes in this governance candidate.

### 2026-09-19 — Trusted Operator Access V1 Production closeout (PR #55, MERGED)

PR #55 Trusted Operator Access V1 is **MERGED / CLOSED** (2026-09-19T18:19:57Z). Approved PR head before merge: `30ae664b36fb45892497dd89360de6e7654d6967`. Last runtime-verified Production application baseline / squash-merge SHA: `fc9a302a1a2e6feedd550478264d97eec9216b29`. Previous Production application SHA: `cd735943518fda25be0bcc7e9f697b09b29fca9a`. Production deployment `dpl_4ef8swfREjLjcgQyZDtuJx31K4fu` READY / success, target production, ref main; primary alias `https://chasum.vercel.app`. Runtime verification 5744330411; Control Tower Production acceptance 5744361600. No Supabase migrations, RLS SQL, schema files, `vercel.json`, GitHub workflow, Production Auth/env, or GVM tenant mutation in the `cd73594…fc9a302` release. No real GVM operator was invited. Issue #54 remains OPEN. Phase 5 remains IN PROGRESS. Do not restamp merely to chase a later documentation-only merge SHA.

### 2026-09-19 — Trusted Operator hosted Preview/Staging acceptance (PR #55)

Hosted Preview/Staging acceptance on application HEAD `a773772309aab9604cd46ba07cb2ca69f3c51989` is **B — PASS WITH NON-BLOCKING LIMITATIONS** (PR comment 5744195939; Control Tower 5744211544). User A→B session replacement succeeded; revoke, re-invite (same Auth identity, one membership), and cross-tenant refusal passed; the disposable test Trusted Admin was revoked. Two UX limitations remain documented and unfixed: revoke/ban can land at `/login` instead of authenticated `/access-denied`; replaying a used one-time magiclink can leave `?error=auth_callback_failed` on an already-authenticated dashboard tab. Neither restored User A nor leaked tenants. No Production/GVM mutation. Historical unmerged-candidate record; Production closeout is the entry above.

### 2026-09-19 — Auth callback ordered Set-Cookie forwarding (PR #55 amendment)

Callback helper now appends every Supabase `setAll` write as its own `Set-Cookie` header via `cookie@1.1.1` `stringifySetCookie`, including `partitioned`/`priority` and same-name clears with different domain/path. Next.js `ResponseCookies` is not used for emission because it collapses cookies by name. Hosted acceptance remains IN PROGRESS / not PASS. No Production/GVM mutation. Unmerged candidate.

### 2026-09-19 — Auth callback session-cookie propagation (PR #55 amendment)

`/auth/callback` now uses a callback-specific SSR helper that copies Supabase `setAll` cookie writes (including chunked names and removals) and safe cache headers onto the actual `NextResponse.redirect`. Token-hash invite/resend link generation is unchanged. Hosted Preview/Staging proved the token-hash email and callback redirect, then failed because User A remained signed in after User B's magiclink — cookies were not on the outgoing redirect. Controlled acceptance remains IN PROGRESS / not PASS. No Production/GVM mutation. Unmerged candidate.

### 2026-09-19 — Trusted Operator token-hash callback (PR #55 amendment)

Trusted Admin invite/resend emails now send a Chasum `/auth/callback?token_hash=...&type=invite|magiclink&next=/dashboard` URL instead of Supabase `properties.action_link`. `generateLink()` still runs; missing `hashed_token` or an unexpected `verification_type` fails closed without sending email. Existing `/auth/callback` `verifyOtp` path is reused. That link-generation change passed hosted email/callback verification; the remaining hosted blocker is session-cookie propagation on the callback redirect. No Production/GVM mutation. Unmerged candidate.

### 2026-09-18 — Trusted Operator Access V1 (Issue #54 candidate)

Primary owners can invite a Trusted Admin (`business_members.role = admin`) into the current business. Invite ordering commits Auth `app_metadata.chasum_operator` and membership before generating a non-auto-sent action link, then delivers it through the server-only Chasum system-email path. `getOrCreateBusiness()` fail-closes to `/access-denied` when the operator marker is present and no membership resolves, so revoked or pending operators cannot auto-create a tenant. Authority is `businesses.owner_id` only. No migration, RLS change, new role, Platform Admin write, real GVM invite, or Production mutation. True employee RBAC remains DESIGN FOR NOW / BUILD LATER. Unmerged candidate.

Logs (`membership.invited` / `resent` / `revoked` / `failed`) are structured application logs, not a durable queryable membership audit ledger. Residual owner_id-only RLS on `communication_history`, `communication_follow_ups`, and `business-assets` is unchanged and classified non-blocking for GVM booking cutover.

### 2026-09-18 — Customer billing truth (Issue #51 / PR #52, CLOSED / PRODUCTION VERIFIED)

Customer Billing no longer treats `deposit_cents = 0` as “use net paid,” so ordinary cash payments are not summarized as deposits. True configured deposits still populate the deposit total. The Booking Sheet / CRM header Balance chip now counts remaining appointment money (stored `price_cents + tax_cents − net paid`) instead of “deposit < catalog price,” so a fully paid / $0 invoice no longer shows `1 due`. Non-invoiced taxable remaining uses stored tax only. Ledger, invoices, receipts, and #48 arithmetic are unchanged. Squash-merged as `cd735943518fda25be0bcc7e9f697b09b29fca9a`; Production `dpl_8yRCE7hjaRNMEdURgBthh1SkY9gm`. Do not reopen #51.

### 2026-09-18 — Omitted-status preservation (Issue #46 / PR #50, CLOSED / PRODUCTION VERIFIED)

`updateBooking` preserves an existing valid appointment status when `requestedStatus` is omitted or null. Squash-merged as `30d7de3419a74f9f15159ff304545e7e46a5093d`; Production `dpl_AeqBfh1AhN3uyv66WJLu5vtyVm33`. Do not reopen #46.

### 2026-09-18 — Invoice exclusive-tax integrity (Issue #48 / PR #49, CLOSED / PRODUCTION VERIFIED)

`createInvoiceForAppointment` now treats stored `appointments.price_cents` as the tax-exclusive subtotal and adds stored `tax_cents` for the invoice/line total, balance, and paid/partial/open status. Explicit stored `price_cents = 0` is preserved; catalog fallback remains only for null/absent stored price. `discount_cents` and recorded `amount_paid_cents` keep pre-candidate extraction semantics (passthrough only; no new discount or payment-normalization policy). Existing invoices are not rewritten. Squash-merged as `d4529afcb49372961e2f02f35b7e51cdff4012bf`; Production `dpl_4GfV2vY4Yov9fx1mQobCFWUz6n2k` READY after Vercel incident recovery. Hosted Staging financial chain WAIVED FOR THAT RELEASE ONLY / NOT DEMONSTRATED.

### 2026-09-17 — Permanent development continuity foundation

- Preserve `docs/CURRENT_PROJECT_STATE.md` as the short current program board and archive its prior contents unchanged.
- Add `docs/handoffs/LATEST_HANDOFF.md`, `docs/runtime/ENVIRONMENT_MANIFEST.md`, source precedence, agent/credit policy, bootstrap instructions and continuity refresh duties in `AGENTS.md`.
- Environment manifest is a manually reconciled seed; read-only collection automation is specified, not implemented. Unknowns and evidence limits remain explicit. Omitted-status preservation remains the separate Codex engineering task; no runtime or environment change.

### 2026-09-17 — PR #43 completed/no-show occurrence integrity (CLOSED / PRODUCTION ACCEPTED)

Candidate `01c33191d08c8dbcbb5849c7a53f040f8b807eb2` squash-merged as `16bd0a6adda4190bd6cfb7402aa9e3fecfd4138e`; automatic Production deployment `dpl_A6L82nvXbYk8mNo7zDrMgocCd1w1` READY. Production alias build-info/health and unauthenticated route gates passed at 19:18:22–19:18:24Z. `appointment.completed` / `appointment.no_show` now require real status transitions and retain precedence over simultaneous range changes; retained-status range changes emit `appointment.rescheduled` with `previousStartTime` / `previousEndTime`, otherwise `appointment.updated`. Audit update/reschedule contract and cancellation protections unchanged.

Corrected Claude A — PASS and prior deterministic validation accepted with provenance/limitations recorded in CURRENT_PROJECT_STATE. Hosted Staging lifecycle smoke NOT RUN / explicitly PO-waived. PO accepted existing reschedule communications for retained completed/no_show time changes. No schema, data, communications-mapping or API PATCH change. Phase 5 IN PROGRESS; GVM awaits its next legitimate booking. Control Tower accepted the runtime release. This separate documentation-only restamp requires review and separate merge approval. Later documentation revisions may advance main and the serving deployment without changing the accepted PR #43 runtime baseline; current serving identity must be checked.

### 2026-09-17 — Cancelled appointment terminal-state integrity (PR #41, Production accepted)

Cancelled appointments are terminal (D1) and notes-editable only (D2). Booking Sheet, Quick Actions, `setAppointmentStatus`, `updateAppointment`, `updateBooking`, and API PATCH must not restore a cancelled appointment to an active or other lifecycle status. Operational fields stay locked; notes may change. Generic active→cancelled via `updateBooking` is blocked on the UI/server path. Canonical staff cancellation remains Quick Actions → Cancel → explicit confirmation → Cancel appointment → `cancelAppointment` → `cancelBooking` (PR #39 path preserved). A notes-only save must not emit `appointment.cancelled`, enqueue cancellation communications / webhook / in-app notification / `waitlist_notify`, change schedule, or resurrect the appointment.

Accepted candidate `6dca0983882a1dde475fd6422b60731af761eec1`. Accepted PR #41 runtime / Production release SHA `35ba43fd3c9c7e854ea11d558571e8456ed43079`. Production accepted on `dpl_42gbuqefLzJm12gBiLzDXPxcis2J`. Claude independent audit **A — PASS**. Hosted Staging UI acceptance PASS by explicit Product Owner re-scope (enqueue-only). Live authenticated API smoke deferred because Chasum HQ had no governed Staging API key; no API key was created; the API contract remains covered by behavioral tests + Claude audit. Production verification PASS (read-only). Do not document hosted or Production provider email delivery. No migration, schema, config, or data migration. GitHub main HEAD may later advance through documentation-only restamps without changing that accepted runtime.

### 2026-09-16 — Cancellation confirmation + waitlist idempotency (PR #39, Production accepted)

Booking Sheet Quick Actions → Cancel now opens confirmation dialog **Cancel appointment?** Safe action **Keep appointment**; destructive action **Cancel appointment**. The first Cancel click does not cancel. Keep / Escape / backdrop / X close with no cancellation. Explicit destructive confirmation is required. Cancelled appointments do not expose Booking Sheet Quick Actions Cancel.

First real cancellation writes cancelled status, emits `appointment.cancelled`, records audit `cancel`, runs normal communications orchestration, and enqueues `waitlist_notify` once. Already-cancelled `cancelBooking` is a success no-op (no appointment write, no audit, no `appointment.cancelled`). `cancelAppointment` enqueues `waitlist_notify` only when `result.events` contains `appointment.cancelled`. No new schema column. No queue-level dedupe hack. No migration, schema, config, or data migration.

Accepted candidate `10b3d627c31438eca046263b67b1800f0a287311`. Accepted PR #39 runtime / Production release SHA `0f0c376cdc2a0d7e80da94859f37ec918acf16d6`. Production accepted on `dpl_E4CgoSXtXuVNavH3xuphDAYDyBHA`. Claude independent audit **A — PASS**. Hosted Staging acceptance PASS (enqueue-only). Production verification PASS (read-only). Do not document hosted or Production provider email delivery. GitHub main HEAD may later advance through documentation-only restamps without changing that accepted runtime.

### 2026-09-16 — Reception scheduled-range reschedule semantics (PR #37, Production accepted)

Reception Edit booking remains BookingSheet → `updateAppointment` → `updateBooking` → canonical Booking Engine event path. A material customer-visible appointment range change — **start or end** — now emits `appointment.rescheduled` with truthful `previousStartTime` and `previousEndTime`. Ordinary non-time edits remain `appointment.updated`. Existing communications orchestration is reused; no Reception-specific second notification implementation. Audit action for a range change is `reschedule`. No migration, config, or data migration.

Accepted candidate `dce6f9cd8ff8494ed0176c2977a25ede0135f44e`. Accepted PR #37 runtime / Production release SHA `f36a7aaf7d5b601c2fa2c914cb89d125cf18eab2`. Production accepted on `dpl_3zx6E7Ck22xYNdHTxiJ6xBVk9U2M`. Hosted Staging acceptance was **enqueue-only**; the three new reschedule email jobs were not proven delivered or Sent. GitHub main HEAD may later advance through documentation-only restamps without changing that accepted runtime.

### 2026-09-16 — Password recovery closeout + Phase 5 resume (docs only)

Staging password recovery **PASS / CLOSED / FROZEN**. Production password-reset completion **P1 CLOSED / ACCEPTED** after the authorized href-only Reset Password template change and one GVM Production acceptance test. Accepted href on Staging and Production:

`{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

Broader historical Production recovery program remains **CLOSED**. Phase 5 **resumes**. Account A/B cross-session recovery (TD-H10) and Production `NEXT_PUBLIC_SUPABASE_URL` `/rest/v1/` (TD-H11) remain separate. State-ambiguity prevention is governed and non-blocking to Phase 5. Documentation only; no application, Auth, Vercel, or database mutation in this restamp.

### 2026-09-15 — Password reset callback failure UX (code only)

Login now explains `error=auth_callback_failed` (“That reset link didn't work or has expired”) with a link to `/forgot-password`. `/auth/callback` emits safe failure classifications (`code_exchange_failed`, `otp_verify_failed`, `missing_auth_params`) without logging codes, hashes, or raw query strings. Regression tests cover recovery token_hash success/failure, unauthenticated `/reset-password`, login error UX, and email-confirm `type=email`. Merged to canonical main as PR #35 (`4f7da8fbadf9ab882be07b0112bee0c53d74913c`).

**Template follow-through (accepted 2026-09-16, not in PR #35):** Staging then Production Reset Password href was changed under explicit PO authorization from `{{ .ConfirmationURL }}` to the token_hash callback pattern. That Auth configuration is now accepted current truth. The remaining Account A/B cross-session gap is **not** this closed P1.

### 2026-09-14 — Services phone layout

Use explicit single-column grids below the tablet breakpoint so Services filters and cards fit the phone viewport. Edit/Delete actions and pagination remain visible without changing service or pagination behavior.

### 2026-09-14 — post-release canonical closeout and locked priorities

PR #32 merged as `8df29d298c196a2431c86a8cea4af1e5bfec09fd`; canonical main restored and Production release accepted on `dpl_3wENSHQrTUnu6VkaqjE7coJ4kjbn`. All three Production aliases aligned. Protected git-main SSO interception is accepted expected Vercel protection, not a claimed application smoke pass. Recovery remains CLOSED; Phase 5 IN PROGRESS.

PO locked the five priorities: this restamp → GVM + HQ validation in parallel → Outside Private Alpha readiness → Commercial SaaS Gate B → Summer Business Manager horizontal v1. Observability, switching/import capability and the commercial-v1 team/RBAC decision are explicit readiness work. Bible §7 amended minimally to establish Summer as canonical intelligence; recorded in the [decision log](./product/14_DECISION_LOG.md). Native eight-domain start gate, React Native + Expo working direction, 18 workstreams and planning windows preserved. Documentation only; no runtime or environment change.


### 2026-09-14 — post-recovery canonical reconciliation (review only)

Production recovery CLOSED on serving `dbbe450`; worker reliability, Package A and final 3/3 public exposure accepted. Exact recovery refs preserved without rewriting; accepted final runtime and regression contracts selectively ported onto main `476af17` for review. No merge or Production release. Current-state, launch, task, GVM and agent-governance docs restamped; Phase 5 IN PROGRESS, Gate B NOT MET. [Closeout](./recovery/PRODUCTION_RECOVERY_CLOSEOUT_20260914.md) records evidence and remaining legitimate-booking dual-email validation.

040 is historical fixture-only; 041/ledger/consent and Package A artifacts retained, not executed. Historical 026 unchanged. No pricing, auth-recovery, roadmap-window or Production configuration change.


### Changed (World Class Phase 4A — Commercial SaaS Lifecycle Honesty)

**STATUS:** COMPLETE / MERGED TO MAIN (PR #29, `f6517a1`)

- Signup no longer writes paid `subscription_plan_key` from `preferred_plan`; new tenants stay on Free
- Tenant Account & billing is Private Alpha arrangement truth; mock upgrade/downgrade/cancel controls removed
- In-product capacity CTAs request Professional / plan change via `/apply`
- `/owner` shows product plan and Private Alpha status; can assign Free or Professional with `subscription_events` audit
- Owner list-price metrics labeled as estimates, not collected revenue
- Commercial SaaS Lifecycle remains **PARTIAL**; Private Alpha Gate A **COMPLETE**; commercial v1 paid billing / Gate B **NOT MET**
- Non-blocking: `/owner` assign + `subscription_events` non-atomic (TD-M11); `productPlanKeyForNewBusiness()` unused (TD-L6)

### Documented (World Class Phase 4A closeout + Phase 5 preflight)

- Phase 4A marked **COMPLETE / MERGED TO MAIN** (PR #29, `f6517a1`)
- Next recommended phase: **World Class Phase 5 — Production Pin and Design-Partner Pilot Stabilization** — PREFLIGHT REQUIRED / NOT STARTED
- Gate B remains later; Commercial SaaS Lifecycle remains **PARTIAL**
- Tracker expanded to **18 workstreams**; Native Mobile / App Store Readiness later restamped as **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY** (see follow-up)
- Permanent **AI Operating-System Preservation Check** added; full AI autonomy is Mid/Late 2027+ destination, not commercial-v1 acceptance

### Documented (Native-app strategy governance correction)

- Workstream 18 classification corrected: **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY**
- Native App Start Gate recorded (eight core stability areas)
- Working technical direction: React Native + Expo; final stack confirmed at native-app preflight
- One reusable multi-tenant mobile product; GVM / HQ / future businesses are normal tenants
- Phase 5 remains PREFLIGHT REQUIRED / NOT STARTED; no native implementation in this stamp

### Added (World Class Phase 3 — Command Centre V1)

- `/dashboard` is Command Centre V1: Header, Today, Attention, Money, Quick Actions, Summer (PR #27, `0c61a8d`)
- Business-local Today; next appointment; active schedule; grounded attention; setup path preserved
- Money: `getCommerceDashboardSnapshot()`; **Gross payments collected today** ≠ appointment-recognized revenue
- Location-scoped appointments; business-wide commerce labeled honestly; grounded Summer facts only

### Added (World Class Phase 1 — Navigation Foundation)

- Grouped tenant dashboard navigation and mobile bottom navigation merged to `main` (PR #23, `ef88ef5`)
- Shared nav model: `lib/dashboard/nav.ts`; HQ remains founder-only labeled “HQ”; `/owner` stays outside tenant nav
- Plan/staff entitlement helpers added without mutation enforcement (Phase 2 follow-up)

### Added (World Class Phase 2 — Staff Plan Honesty)

- Active-staff plan limits enforced server-side and gated in Employees UI (PR #25, `dd49b32`)
- Free = 1 / Professional = 3 / Business and Enterprise unlimited **active** staff (`is_active = true`); inactive staff do not consume seats
- Canonical UI: **Active in Chasum** ≠ Employment status / login / RBAC / payroll

### Documented (World Class Phase 3 closeout + launch readiness)

- Phase 3 Command Centre marked complete on `main`
- Working planning targets and launch-criticality tracker: `docs/LAUNCH_READINESS.md`
- Commercial SaaS remains **PARTIAL**; Phase 4A (Private Alpha billing honesty) is distinct from Gate B (commercial-v1 paid billing)
- Pre-existing DashboardTopNav ~768–1024px overflow recorded as IMPORTANT BUT POST-LAUNCH SAFE (GREEN)

### Documented (World Class Phase 3 Command Centre preflight — superseded)

- Preflight selected Command Centre / Today experience. **Implemented and merged in PR #27.**

### Changed (Marketing — Roadmap + Summer Onboarding)

- Summer consultation subheading finalized; Summer Onboarding **v1** lock docs refreshed as baseline
- Public `/roadmap` rebuilt as a premium vertical timeline (Completed / In Progress / Upcoming / Future Vision) with benefit-first copy

### Locked (Marketing — Summer Onboarding v1)

- Product owner approved Summer Onboarding **v1** on `/meet-summer` guided discovery
- Final helper copy: “Choose one or more categories. You can always update them later.”
- Docs: `docs/marketing/SUMMER_ONBOARDING_V1_LOCK.md`; agent rule `.cursor/rules/summer-onboarding-lock.mdc`
- Next marketing surface in sequence: Roadmap (`/roadmap`)

### Locked (Marketing — Official Pricing Page v1)

- Product owner approved Official Chasum Pricing Page **v1** (Preview: https://chasum-aw2cx9wbn-renovisionappcom.vercel.app/pricing)
- Implementation restored to approved baseline (`83fbaed`); page is **locked** — bug/a11y/product-owner updates only
- Docs: `docs/marketing/PRICING_PAGE_V1_LOCK.md`; agent rule `.cursor/rules/pricing-page-lock.mdc`

### Fixed (Operation GVM — Commerce Engine Finalization)

- Root cause: `commerce_transactions` missing from Postgres / PostgREST schema cache — applied commerce platform + grants + `NOTIFY pgrst`
- Appointment payment columns (`payment_status`, `amount_paid_cents`, …) and store credit columns restored
- Gift certificate redemption now writes the commerce ledger and is selectable in customer billing
- Arrival workflow: Booked / Arrived / Waiting / In Progress (+ configurable `appointment_status_workflow`)
- Migrations `030`/`031`; verify script `scripts/verify-commerce-engine.mjs`

### Changed (Premium Experience Sprint 2 — Craftsmanship)

- Dashboard hierarchy: clearer hero CTAs, quieter attention chips, less duplicate quick actions
- Premium tables: sticky headers wired into reports; friendlier payments ledger (no raw IDs)
- Toasts & sheets: safe-area, alert role on errors, generic sheet chrome
- Success / empty / status copy: calmer staff language; customer CRM “Email receipt”
- Customer-facing invoices, receipts, and email templates: warmer tone, brand-forward closings
- Operator errors: no migration jargon in payment/invoice/refund messages
- Subtle page enter + card shadow transitions (respects reduced motion)

### Added (Vercel deployment docs)

- `docs/deployment/VERCEL_DEPLOYMENT.md` — full env catalog
- `docs/deployment/VERCEL_SETUP_WALKTHROUGH.md` — click-path entry order
- `docs/deployment/GVM_VERCEL_COMPLETION_CHECKLIST.md` — verified status + GVM iPad go-live steps
- `supabase/migrations/030_repair_commerce_payment_columns.sql` — idempotent repair for partial 028 gaps

### Added (Premium Experience Sprint 1)

- Design System v1 documented (`docs/product/23_DESIGN_SYSTEM_V1.md`)
- `Field` form primitive; form skeletons; shimmer loading; tab a11y
- Onboarding-forward empty states (customers, services, employees, packages, gift cards)
- Dashboard clarity: currency-aware revenue, attention chips, “Today’s focus”
- Premium invoice/receipt formatting with business currency and thank-you close

### Added (Foundation Sprint — AI Operating System kernel)

- `COMPANY_MEMORY.md` — living founder memory (Operation GVM still Priority #1)
- Shared revenue recognition (`lib/commerce/recognize.ts`) used by reports, dashboard, employees
- Commerce + platform event buses (`lib/commerce/events.ts`, `lib/os/events.ts`) for future Summer/Chase
- Business operating context / memory facade (`lib/business/context.ts`)
- Locale + business-day helpers (`lib/locale.ts`, `lib/business/datetime.ts`)
- Design-system responsive polish (dialog safe-area, touch targets, table scroll, OS CSS utilities)
- Docs: [`docs/product/22_OS_KERNEL.md`](./product/22_OS_KERNEL.md)

### Fixed (Operation GVM — Customer Validation Bug Fix Sprint 2)

- SMS: Free/starter plan blocks Send SMS with upgrade copy (no fake “Sending…” success); Twilio skip/failure returns errors; stub Message toasts use info
- Email: clearer Resend rejection diagnostics (SMTP/iCloud-style errors); CRM compose refuses to claim success without RESEND_API_KEY; console-only sends are not reported as delivered
- Gift cards: printable branded gift certificate with preview, print/save-as-PDF, HTML download, and email via Communications

### Fixed (Operation GVM — Bug Fix Sprint 1)

- Dashboard load: request-scoped `cache()` for business, locations, and location scope to stop repeated auth/RPC waterfalls
- Save toasts: `useFormAction` + toast provider dedupe — no more repeated success blinks after refresh
- Email/SMS: real provider names in logs; permanent failure (not silent complete) when context/phone/config missing; clearer Resend/Twilio errors
- Locations: Edit dialog for name/address/phone; hub shows plan location quota instead of “unlimited”
- Starter plan location limit copy clarifies quota and upgrade path

### Changed (Operation GVM Sprint 2 — deployment readiness)

- Business: slug reserved/ugly-name validation, live `/book/{slug}` helper, weekend-hours warning
- Services: no $0 price default, staff-assignment hints, clearer empty state
- Employees: provider-first create copy, auto-check sole service, schedule empty → Edit schedule CTA
- Bookings: new appointments default to **confirmed**
- CRM: phone-aware search copy, timeline empty CTAs (book / add note)
- Payments: customer picker + Collect payment query prefills, human status labels, Chase insights link
- Summer: incomplete-knowledge banner with setup links (never invents missing facts)
- Chase: empty insights show actionable get-started guidance instead of misleading “steady”

### Changed (GVM go-live readiness — onboarding & friction)

- Overview shows a **Get operational** setup checklist until profile, hours, services, and staff are ready; quick actions switch to setup tasks
- Clearer public booking empty state (lists missing service/staff); calendar setup links to Employees
- **Add myself as provider** one-click on empty Employees
- Booking Sheet / Day View Collect payment deep-links to Payments (no stub toast)
- Settings booking URL uses the current browser origin; AI settings no longer claim “Phase 4 later”
- Double-booking toggle marked coming soon; Chase empty-day copy no longer claims a “steady” schedule
- CRM create accepts phone-only walk-ins; signup copy aligned to Private Alpha
- Business hub warns when name/slug still look like placeholders
- New-tenant slug prefers human name over opaque email local-parts

### Added (Operation GVM — Founding Partner #001)

- Live onboarding friction audit: `docs/OPERATION_GVM_REPORT.md`
- Official onboarding playbook: `docs/GVM_ONBOARDING_CHECKLIST.md`
- Journey screenshots: `docs/operation-gvm/screenshots/`

### Added (Milestone 7 — Private Alpha Management Platform)

- Internal ops surface at `/dashboard/hq/private-alpha` for four Founding Design Partners
- Partner dossiers, 12-step onboarding checklist, feedback board, support log, weekly founder review, owner-only notes
- Architecture: `docs/PRIVATE_ALPHA_ARCHITECTURE.md`

### Added (Chasum HQ — Founder Operating System)

- Internal founder dashboard at `/dashboard/hq` (platform owners only)
- Executive KPIs, design-partner pipeline, customer health, revenue, product health, bugs, feature requests, roadmap, release notes, launch readiness rings
- Live Owner metrics when available; curated seed for pipeline/bugs/roadmap until persisted
- Architecture: `docs/HQ_ARCHITECTURE.md`

### Changed (Private Alpha marketing readiness)

- Public CTAs now route to Apply / Request Early Access (`/apply`) instead of “Start Free” self-serve signup
- Homepage removes fictional logos, impact counters, and placeholder testimonials; Private Alpha invite section instead
- AI Workforce marketing centers Summer & Chase as Early Access; other roles labeled Coming Next / Future Vision
- New public pages: `/roadmap`, `/apply`, `/private-alpha`, `/privacy`, `/terms`, `/security`, `/status`, `/contact`
- Footer trust links: Privacy, Terms, Security, Roadmap, Status, Contact
- Pricing CTAs apply for design partner access; founding pricing copy for Private Alpha

### Added (Milestone 6.1 — Production Hardening)

- Vitest + React Testing Library + MSW unit/integration suite; Playwright e2e smoke
- CI quality gates template (`docs/ci/github-actions-ci.yml`) — lint, typecheck, unit tests, build, e2e must pass (copy to `.github/workflows/ci.yml` when the deploy token has `workflow` scope)
- Rate limiting on public booking, `/api/v1/*`, cron, Zapier discovery, health, inbound webhooks
- Zod schemas for API appointment/customer bodies; PATCH appointments no longer mass-assigns
- Soft schema fallbacks disabled by default (`CHASUM_ALLOW_SOFT_SCHEMA=1` opt-in only)
- Structured JSON logger + optional Sentry (`instrumentation.ts`, failure capture for booking/payment/comms)
- Inbound webhook routes with signature verification: Stripe, Resend, Twilio
- Health check exposes stripe/sentry/soft-schema status + latency

### Added (Milestone 5 / Phase 5.8 — Communications Platform)

- Migration `029_communications_platform.sql` — quiet hours, marketing toggle, notification priority/archive, job backoff, communications audit log
- `lib/communications/` public API: `sendEmail`, `sendSMS`, `queueNotification`, `cancelNotification`, `retryNotification`, `previewTemplate`
- Provider abstraction (Resend email, Twilio SMS); templates with Business branding; CRM timeline mirroring
- Booking Engine event bridge so Summer/staff/API confirmations flow through Communications
- Notification Center filters (unread/archived/priority/search); Chase delivery metrics; Commerce receipt email queue

### Added (Milestone 4 / Phase 5.7 — Commerce Platform)

- Migration `028_commerce_platform.sql` — invoices, lines, transactions ledger, receipts, refunds, audit log, appointment payment status, store credit
- Provider abstraction (`lib/commerce/providers`) with Stripe (PaymentIntent refs only) + manual methods; never stores card numbers
- Payments dashboard at `/dashboard/payments`; CRM Billing tab; booking sheet payment status
- Summer `commerce` intent (balances/invoices — never charges); Chase commerce KPIs
- Command palette “Open Payments”

### Added (Phase 5.6 — Chase Operations Manager)

- Chase operations workspace at `/dashboard/workforce/chase` (alias `/dashboard/ai-workforce/chase`)
- `lib/chase/` read-only aggregator: KPIs, prioritized insights, grounded alerts, customer/employee/booking analytics, Summer daily activity, forecast extension hooks only
- Composes Morning Brief, Reports, CRM Chase analytics, Booking Engine utilization — never invents metrics; never mutates data
- Command palette “Open Chase”; AI Workforce roster prefers Chase (Noah redirects)

### Added (Phase 5.5 — Summer AI Receptionist)

- Summer reception workspace at `/dashboard/ai-workforce/summer` — conversation, suggestions, booking cards, confirmations, conflicts, escalation
- `lib/summer/` orchestrator + tools: intents for book/reschedule/cancel/CRM lookup; mutations only via `adapters/summer` (Booking Engine); slots only via Availability Engine
- CRM recognition via `getSummerCrmSnapshot`; business answers from Business / Services / Employees knowledge
- Command Center + roster prefer Summer (Emma redirects to Summer)

### Added (Phase 5.4 — Customer Relationship Management)

- Migration `027_crm_phase_5_4.sql` — marketing consent, membership link, note types, document categories
- CRM quick actions on customer profile (Book / Reschedule / Cancel / Collect / Message / Email / Print / Timeline / Ask Summer) wired to Booking Sheet
- Chase directory analytics (overdue follow-up, high-value, inactive, retention) + Summer/Chase read-only CRM projections
- Note types (general / warning / medical / service), document categories, marketing consent + membership on profiles
- Faster ⌘K / directory customer search (preferred name, tags, phone digit matching)

### Added (Phase 5.3 — Unified Booking Sheet)

- Right-drawer / mobile bottom-sheet Booking Sheet: Customer, Appointment, Availability, Payments, Timeline, Summer assistant, quick actions
- Shared `Sheet` primitive with focus trap, Escape close, sticky save bar
- `previewBookingSheetAvailability` + customer snapshot actions via Booking / Availability engines
- Calendar + Reception full editor open Booking Sheet (`AppointmentDialog` is a thin alias)
- Channel registry for staff, reception, public, Summer, API, mobile

### Added (Phase 5.2 — Day View Control Center)

- Morning Brief strip: appointments, revenue, staff working, open slots, waitlist, no-shows, outstanding payments, Summer activity, Chase recommendations
- Multi-employee Day View columns with lunch/hours/vacation overlays, drag across staff, resize, optimistic updates
- Appointment drawer with quick actions (check-in, complete, payment, reschedule, cancel, CRM, message, Ask Summer)
- Command registry (`lib/command/registry.ts`) wired into ⌘K / Ctrl+K palette
- Default Reception view is Day; mobile falls back to agenda mode

### Fixed (Phase 5.2)

- Reception Customer Search `useSyncExternalStore` returned a new array from `getSnapshot` every read, causing Maximum update depth exceeded on the calendar page

### Added (Phase 5.1 — Availability Engine)

- Migration `026_availability_engine.sql` — enriched `get_available_slots` / `validate_appointment_slot` with lunch, split shifts, business/staff closures, service blackouts, cleanup buffers, min notice, max window, per-day caps, and double-booking policy
- Rich `SlotCandidate` contract: start/end, employee, location, resources, score, reason, warnings
- Memoized `composeAvailabilityContext`, scoring, and extension hooks for future calendar sync / travel / recurring / waitlist
- All channels continue through `previewAvailableSlots()` (SQL authoritative; React never invents slots)

### Added (Phase 5.0 — Booking Engine Foundation)

- `lib/booking-engine/` facade: `createBooking`, `updateBooking`, `rescheduleBooking`, `resizeBooking`, `cancelBooking`, `previewAvailableSlots`, `validateBooking`
- Strongly typed `BookingIntent`, `AvailabilityContext`, structured conflict codes, domain event contracts, and optimistic `MutationResult` phases
- Channel adapters for staff, reception, public, Summer, and API; Chase read projections via `queryUtilizationProjection`
- Appointment server actions and scheduling helpers route through the facade (SQL RPCs remain authoritative)

### Added (Phase 4 — Complete Employees Module Foundation)

- Migration `025_employees_module.sql` — first/last/preferred names, booking rules, custom roles, service duration overrides, lunch/overtime hours, hour segments, staff closures, license documents
- Employees directory: sort, pagination, bulk activate/deactivate; profile booking rules + service price/duration overrides; richer AI knowledge export for Summer/Chase

### Added (Phase 4 — Complete Services Module Foundation)

- Migration `024_services_module.sql` — cleanup time, sort order, taxable/deposit flags, booking visibility & confirmation modes, availability windows, `service_locations`, `staff_services.price_override`, `service_blackouts`, example category seeds
- Services dashboard: full CRUD with search/filters/sort/pagination, category management with drag-reorder, employee & location assignment, blackouts, and AI knowledge exposure of richer service fields

### Added (Phase 4 — Complete Business Module Foundation)

- Migration `023_business_management_settings.sql` — legal identity, language, branding colors, booking policies, notification targets, Summer/Chase AI config JSON, business closures, documents, hour segments
- Business hub tabs for Hours, Booking, Branding, Notifications, AI, and Documents with full Supabase persistence

### Fixed (Phase 4 — Fix Existing Errors)

- Applied outstanding Supabase migrations **012 → 022** on the linked project (clears missing `departments`, `booking_resources`, `report_schedules`, and related columns)
- Softened schema-gap logging via `lib/supabase/errors.ts`; reports queries fall back when optional columns are unavailable
- Documented migration floor through `022` in `DATABASE.md` / `GVM_GO_LIVE.md`

### Changed (Brand V2 integration)

- Made `/public/brand-v2/` the single source of truth (svg / png / favicon / social / source)
- Pointed all app brand references through `lib/brand/assets.ts` to Brand V2 paths; legacy `/public/brand/` and root favicon/OG files are no longer referenced
- Regenerated favicons, PWA icons, App Router icons, and Open Graph from Brand V2 masters

### Changed (Brand integration complete)

- Wired official Chasum brand pack (SVG/PNG) into web assets: C Mark, spark, wordmark, horizontal/full lockups, favicon package, apple/android icons, and `/og-image.png`
- Restored `@/components/brand/*` as the single React logo source; updated root metadata (icons, Open Graph, Twitter, robots, theme-color) and PWA manifest
- Added branded `not-found` and `global-error` surfaces using the official Logo component

### Changed (Public marketing website — Launch polish sprint)

- Premium motion and micro-interactions: smoother scroll reveals, FAQ accordion height animation, nav underline/dropdown transitions, card/button hover-active-focus states, product-frame lift
- Dashboard demos: live status badge, chart bar motion, Emma typing cursor; section `content-visibility` for paint performance; reduced-motion coverage expanded
- Accessibility: visible focus rings on marketing controls, FAQ ARIA accordion, hero heading landmark; light copy clarity pass without layout changes

### Changed (Public marketing website — V3 world-class brand experience)

- Complete creative redesign of the marketing experience: cinematic product-first hero, enterprise navigation (Platform / Product / Solutions / Customers / Resources / Pricing / Support), immersive dark sections, and story-led section rhythm
- Platform and Product Tour rebuilt around live software experiences; Industries, Journey, AI Workforce, Stories, Comparison, Pricing, FAQ, and final CTA redesigned for premium contrast and hierarchy
- Brand colors, messaging sources, and section content preserved — presentation and composition challenged throughout

### Changed (Public marketing website — Premium visual polish pass)

- Introduced an alternating surface rhythm so no two adjacent sections feel identical: a calm light-gray gradient (`marketing-surface-tint`) on Trusted, Platform, Industries, Testimonials, and Pricing; base surface elsewhere; softer hairline dividers replace hard 1px borders
- Standardized section typography with a shared scale (`marketing-eyebrow`, `marketing-h2` up to ~48px, `marketing-lede`) for stronger, more confident hierarchy and consistent spacing rhythm
- Refined elevation with layered, soft shadows (`marketing-elevate`/`marketing-elevate-lg`) and premium card hover lift; unified radii toward `--radius-lg`/`--radius-xl`; larger final-CTA headline
- Structure, copy, layout, brand colors, and messaging unchanged; light and dark modes verified

### Changed (Public marketing website — Phase 1 keynote hero)

- Scrapped the previous hero and rebuilt it as an Apple-keynote composition: monumental headline (up to ~110px), cinematic floating product bezel with depth/glass/ambient light, denser live dashboard surface, custom pill CTAs, and quiet trust lines
- Hierarchy locked to headline → product → CTA → trust; supporting sentence moved below the product so it never competes; removed template chrome (live-demo badge, generic button shells, busy hero graphics)
- Brand colors and core messaging preserved; no other sections redesigned

### Changed (Public marketing website — Phase 3)

- Replaced static department previews with live interactive demos: animated charts, changing appointments, growing revenue, notifications, AI typing responses, and status updates (respects reduced motion)
- Added impact counters (Businesses, Appointments, Revenue, Hours saved, Countries), logo cloud placeholders, and an 8-story testimonial section with photo placeholders and results chips
- Soft page-load fade-in; dashboard previews animate into place; premium icon treatments on Platform modules; larger tour tap targets and more breathing room across sections
- Mobile-safe tour tabs (no horizontal page scroll); kept brand, auth, and dashboard app code untouched

### Changed (Public marketing website — Phase 2.2)

- Refined the existing visual system with a softly animated hero atmosphere, stronger type hierarchy, floating dashboard stage, animated statistics, trust badges, and smoother CTA interactions
- Upgraded the product tour to nine departments (Dashboard, AI Receptionist, CRM, Calendar, Employees, Business, Reports, Communication, Billing) with remembered selection, synchronized copy/benefits, and animated product-surface transitions
- Expanded department previews into larger, distinct dashboard surfaces based on the real Chasum product structure, including dedicated CRM, Communication, Reports, and Billing views
- Enlarged industry cards with industry-specific icons, premium hover motion, and retained expandable challenge/solution/module details
- Featured Emma as available today with a dedicated AI Receptionist experience; added avatars, specialties, availability, status, and descriptions for the planned AI workforce
- Added subtle navigation, comparison, pricing, card, and final-CTA micro-interactions while respecting `prefers-reduced-motion`

### Changed (Public marketing website — Phase 2)

- Sticky glassmorphic nav with scroll spy, smooth section scrolling, and active-link highlighting
- Hero: animated stats, floating dashboard preview, primary Start Free / secondary Book Demo hierarchy
- Interactive platform showcase with clickable department tabs (AI Receptionist, CRM, Calendar, Employees, Business, Reports, Communication, Billing) that update the dashboard preview
- Expandable industry cards (challenges, how Chasum helps, recommended modules)
- Visual customer-journey timeline with connected steps through payment and reports
- Comparison table readability (sticky capability column, highlighted Chasum column); pricing/FAQ/final CTA polish with subtle motion
- Tasteful reveal/count-up/card-lift animations with `prefers-reduced-motion` respect; no auth or dashboard app changes

### Changed (Public marketing website — Phase 1)

- Rebuilt homepage storytelling around real Chasum departments (AI Receptionist, CRM, Calendar, Employees, Business, Reports, Communication, Billing, AI Workforce)
- New sections: Trusted platform, Platform overview, interactive dashboard showcase, industries, customer journey, AI Workforce (Coming Soon), honest competitor comparison scaffold, expanded FAQ, stronger final CTA
- Kept brand colors, logo, typography, and pricing plans; presentational dashboard preview mirrors product UI without changing auth or dashboard code
- Updated marketing nav/footer anchors for the new structure

### Fixed

- Signup page no longer imports `resolveInitialPlan` from the client `SignUpForm` module — moved to shared `lib/marketing/pricing.ts` so server pages can resolve `?plan=` without a Client/Server boundary error

### Added (Company Operating System)

- Permanent company docs in `docs/company/` — mandatory reading before development sessions
- `CHASUM_BIBLE.md` — constitution (mission, vision, values, engineering/UI/AI/security/multi-tenant standards, production & release rules)
- `PRODUCT_PRINCIPLES.md` — feature decision filter (time, money, stress, AI, mobile, enterprise)
- `MASTER_ROADMAP.md` — official completed departments + future themes
- `MASTER_TASKS.md` — active backlog, sprint focus, lint/build/CHANGELOG/commit/push rules

### Added (AI Receptionist Phase 1 — Emma)

- Production foundation for Emma as an AI employee (not a generic chatbot): grounded answers from Chasum hours, services, employees, locations, and policies
- Availability recommendations and booking-flow handoff via the scheduling engine + public booking URL (never invents times)
- Escalation to staff with Communication Center follow-ups + CRM notes / `channel: "ai"` timeline logging when a customer is linked
- Reusable provider layer (`emma_grounded` default, optional OpenAI via `OPENAI_API_KEY`) with conversation history store
- Migration `022_ai_receptionist.sql` — multi-tenant conversations/messages; `voice` channel reserved (not implemented)
- Practice console on `/dashboard/ai-workforce/emma` + Command Center routing; integrates CRM, Calendar, Business, Employees, Communication, Reports surfaces without redesign

### Added (Reports & Analytics Department)

- Business Intelligence hub at `/dashboard/reports` — Executive, Revenue, Appointments, Customers, Employees, Services, Locations, Financial, Inventory (future-ready), Export, Scheduled
- Executive KPIs: revenue (today/week/month/year), appointments, new/returning customers, active employees, outstanding invoices, membership & gift card revenue
- Breakdowns by employee, location, service, category; booking trends, peak hours/days, CLV, retention, birthdays, top/inactive customers
- Employee productivity + commission estimates; location occupancy/growth; financial invoices/payments/refunds/taxes/discounts/deposits
- CSV export (Excel-compatible), print/PDF, scheduled email report CRUD
- Migration `021_reports_analytics.sql` — `report_schedules` + `report_exports` (multi-tenant)
- Shared `getBusinessIntelligenceSnapshot()` for Owner Platform, Business Dashboard, and future AI Workforce
- Dashboard nav: Reports (extends existing design system; location-scoped; no breaking changes)

### Added (Business Management Department)

- Business hub at `/dashboard/business` — control center for how each tenant operates (single/multi location, multi-business, enterprise-ready)
- Profile: name, logo, cover, description, industry, website, email, phone, tax number, currency, timezone, address, social links
- Catalog ops: service categories (CRUD/sort/icon/color), rooms & resources, links into Services / Settings hours / Employees / Automation
- Commerce scaffolds: memberships (weekly/monthly/yearly, limited/unlimited), packages (prepaid visits, expiry, transfer), gift cards (issue + redeem)
- Taxes (inclusive/exclusive by country/region), discount/promo codes, custom form templates (consent/medical/intake/waiver + e-sign flag), automation rules
- Migration `020_business_management.sql` — additive multi-tenant tables + business profile columns; soft-fallback when migrations not yet applied
- Dashboard nav: Business entry (extends existing design system; no UI redesign)

### Added (Calendar & Booking Engine 2.0)

- Extended calendar views: Agenda, Timeline, Employees, Locations, Resources (alongside Day/Week/Month)
- Drag/drop undo + appointment duplicate on Reception calendar
- Migration `019_booking_engine_2.sql` — rooms/resources, commercial appointment fields (price/tax/discount/deposit/invoice), attachments, internal notes, custom fields, change log, customer portal tokens, waitlist priority/location, recurring yearly + location
- Customer portal at `/portal/[token]` — upcoming/past appointments, cancel, invoice/deposit display; memberships/packages/gift cards scaffold
- Reception waitlist panel (priority queue) replaces placeholder
- Recurring generator hardened: location_id + slot validation
- Booking engine module (`lib/booking-engine/*`) for CRM/Communication/Billing/Employees integration without breaking multi-tenant FKs

### Added (CRM Department)

- Full CRM hub at `/dashboard/clients` (nav label: CRM) — directory with search, status, location, assigned employee, tags, recently active
- Customer profiles with photo, name fields, emergency contact, preferred communication, status, assignments
- Unified timeline: appointments, calls, SMS, email, notes, documents, payments, cancellations, no-shows
- Appointment history buckets: upcoming, completed, cancelled, no-shows, recurring
- Reuses Communication Center + documents; CRM notes (pinned/private); insights + marketing/loyalty fields
- Spark AI stub provider for future summarize / inactive / top spenders / birthday campaigns
- Migration `018_crm_department.sql` — CRM columns, `customer_notes`, `customer_payment_events`, document signing readiness

### Added (Employee Management Department)

- Full Employee Management module at `/dashboard/employees` (legacy `/dashboard/staff` redirects)
- Employee Directory with search and filters (status, department, location)
- Employee Profile: photo, contact, emergency contact, role & permissions, locations, services, working hours, vacation, availability, payroll & commission, documents, performance dashboard, activity timeline, notes
- Migration `017_employee_management.sql` — departments, HR columns on `staff`, `staff_locations`, `staff_documents`, `staff_activity`
- Role/permission catalog ready for multi-staff login, payroll, AI Workforce, and time clock (`lib/employees/*`)
- Reusable components under `components/employees/`

### Added (Communication Center Phase 1)

- Customer profile communication tools: Call / Text / Email, copy phone & email, Open Maps
- Communication Center on client profiles — timeline, email/SMS/reminder history, internal notes, follow-up reminders
- Appointment dialog Quick Call / Quick Text / Quick Email (booking engine unchanged)
- `communication_history` + `communication_follow_ups` tables (migration `016_communication_center_phase1.sql`)
- Pluggable communication service (`lib/communication/*`) ready for Twilio, Resend, push, WhatsApp, and AI adapters
- Optional customer `address` field for Maps

### Added (Billing Phase 1)

- Subscription foundation for Free, Professional, Business, Enterprise (catalog + list prices)
- Customer Billing page at `/dashboard/settings/billing` — current plan, trial, renewal, upgrade/downgrade/cancel, history, invoice download
- Mock billing provider + `BillingProvider` interface ready for Stripe swap (`lib/billing/*`)
- Migration `015_billing_phase1.sql` — billing interval, periods, `subscription_events`, `billing_invoices`
- Owner metrics: active subscriptions, 30d churn, revenue chart (layout unchanged)

### Added (Owner Platform — Phase 1)

- Secure `/owner` dashboard for Chasum platform owners only (separate from customer `/dashboard`)
- Pages: Overview, Businesses, Subscriptions, Revenue, Free Trials, Support, Platform Health, Security, Settings
- Overview metrics: total/active/trial/paid businesses, MRR/ARR estimates, signups, recent activity, system health, alerts
- Authorization via `PLATFORM_OWNER_EMAILS` and/or `platform_admins` table; service-role reads after gate
- Migration `014_owner_platform.sql` (admins, alerts, subscription status/trial fields, plan list prices)
- Docs: `docs/OWNER_PLATFORM.md`

### Changed (Pricing & marketing messaging)

- Headline: “Simple pricing that grows with your business.”
- Subhead: Start free / upgrade when ready / no hidden fees / no appointment commissions
- Plans: Free, Professional (⭐ Most Popular), Business, Enterprise with new taglines, descriptions, and CTAs
- Shared constants in `lib/marketing/pricing.ts`; reusable `PlanCards`, upgrade modal, onboarding plan select
- Free-plan limit prompt: congratulatory Professional upgrade message + CTA
- Dedicated `/pricing` page; signup plan selection; location quota upgrade entry points

### Added (GVM Baby World — Production Launch)

- `docs/GVM_GO_LIVE.md` — deployment, env, verification, smoke test, cutover, parallel run, rollback, future roadmap
- `GET /api/health` — production readiness probe (no secrets exposed)
- `scripts/verify-production-env.mjs` + `npm run verify:env`
- Production hardening: cron requires `CRON_SECRET` in production; failed emails retry; production never fake-sends email/SMS via console

### Changed (GVM Baby World — Production Launch)

- Email/SMS providers: Resend required in production; Twilio optional (skipped when unset)
- Job processor throws on failed email/SMS delivery so queue retries
- `.env.example` and `PRODUCTION_READINESS.md` smoke checklist expanded (confirm → complete → history → revenue)

### Changed (Sprint 3 — Reception Workspace Premium)

- Customer search: match highlighting, Esc closes list first, empty/loading polish, recent customers
- Fastest new customer: first/last name, phone formatting, email validation, notes, Enter field flow, success animation, returns to booking (`N` opens inline create)
- Booking: remembered service/staff, ⌘Enter one-click save, richer confirmation toast, inline “still need” / ready hints
- Customer profile panel: upcoming, history, notes, revenue, last visit, preferred staff/service, skeleton loading
- Reception layout: spacing, hierarchy, hover/focus, micro-animations (no brand asset or color token changes)

### Changed (Brand V1.0 — FINAL / FROZEN)

- Official Brand Identity Board locked as sole visual source of truth
- Production assets: `logo-full`, `logo-horizontal`, `logo-stacked`, `wordmark`, `logo-icon`, `spark`, favicon, apple/manifest/app icons
- C Mark (center node + trail), custom open A + Primary AI dot, Spark with accent dots
- App icons on Dark Navy `#0B1324`; dashboard sidebar Dark Navy + light lockup
- Landing, auth, emails, loaders, metadata, PWA use official assets only

### Changed (Sprint 2 — Reception Workspace Excellence)

- Instant customer search: local seed filter, server fallback, recent customers, clear control, loading spinner
- Faster booking: selected-customer chip, remembered service/staff, inline validation, richer book/cancel toasts
- Reception panel hierarchy, shortcuts labels, AI Suggestions use Spark mark (AI-only)
- Spark pulse animation with glow + reduced-motion support

### Changed (Official Brand — The C Mark)

- Locked Option 01 “The C Mark” as the permanent Chasum logo; assets in `/public/brand/`
- Single `Logo` / `LogoMark` component (`components/brand/logo.tsx`) used across landing, dashboard, auth, booking, loaders
- Favicon, Apple touch icon, PWA manifest, and root metadata point at brand assets
- Transactional emails include branded header logo + footer
- Brand guidelines: `docs/BRAND_GUIDELINES.md`

### Added (Milestone 1.4 — Production Readiness)

- Calendar polish: overlap packing, half-hour drop ghosts, richer appointment cards, today/now highlights, smooth scroll to current time
- Customer profile + reception preview: preferred staff/service/location from history, visits/revenue snapshot, profile deep link
- Reception shortcuts (`/`, `N`, `B`, `W`, `T`, `I`) and calendar refresh indicator
- `docs/PRODUCTION_READINESS.md` go-live checklist for GVM Baby World

### Added (Milestone 1.3 — Workflow Optimization)

- Floating Quick Actions on Reception: New Customer, Book Appointment, Walk-In, Block Time, Add Internal Note
- Global command palette (⌘/Ctrl+K) searching customers, staff, services, appointments, and dashboard pages
- Customer search keyboard navigation (arrows, Enter selects first/highlighted, Escape clears)
- Booking preferences remembered locally (service, staff, location); autofocus on first fields
- Quick dialogs for new customer, block time, and internal notes without leaving the calendar

### Added (Milestone 1.1 — Reception Workspace)

- Reception workspace on Calendar: Business Brief KPIs from live data only
- Docked reception panel: customer search, profile preview, quick add, quick appointment, next available slot
- Preferred staff/location derived from appointment history (never invented)
- Today's notes (device-local), waitlist placeholder, AI Suggestions (empty: "No recommendations available.")
- Calendar polish: sticky time column & day headers, color legend, smoother DnD/resize, optimistic reschedule/resize
- `getReceptionBrief` + `getNextAvailableSlot` via existing scheduling engine

### Added (Sprint 8 — GVM Baby World Go-Live)

- Business profile: logo/cover file upload (Supabase Storage), public booking access modes
- Booking modes: Staff Only, Request Approval, Public, Invite Only — enforced on `/book/[slug]`
- Services: internal notes, per-service cancellation policy; server-side `online_booking` guard
- Customers: referral source, document uploads (`customer_documents` + storage)
- Dashboard: Today's revenue KPI, recent clients/bookings, business alerts from notifications
- Public booking: cover hero, business contact footer; request-approval creates pending appointments
- Migration `013_sprint8_gvm_go_live.sql`

### Added (Sprint 7 — Public Booking Experience)

- Premium multi-step public booking: service → optional staff (or any available) → date → time → customer info → review → confirmation
- Business description on booking page + Settings field; migration `012_sprint7_public_booking.sql`
- Returning-customer lookup by email (`lookup_booking_customer` RPC) with welcome-back prefill
- Confirmation screen: reference number, booking summary, cancellation policy, Download .ics, Google Calendar
- Confirmation / staff / business emails attach `appointment.ics` (Resend when configured)
- `getPublicSlotOptions` merges real `get_available_slots` across staff — never invents times
- Public book path revalidates dashboard calendar, overview, clients, appointments, and staff

### Changed (Sprint 7)

- `bookAppointment` returns structured summary + reference for the confirmation UI
- Email provider payload supports attachments

### Added (Sprint 6 — Booking Engine 2.0)

- Appointment modal: customer search/create, service, staff, location, date, SlotPicker, duration, notes, status
- Calendar: color by service or staff; week-view drag reschedule; resize handle to change duration (`resizeAppointment`)
- Customer profile metrics: total visits, lifetime revenue, no-shows, cancellations; upcoming vs history lists
- Alex AI Scheduler: `getAlexAvailabilityRecommendations` via real `get_available_slots` only (Command Center + Alex detail panel)
- Never invents appointment times — empty messaging when no slots exist

### Changed (Sprint 6)

- Create/update appointments accept location, duration override, and status
- Reschedule preserves existing duration; dashboard slot fetch accepts location scope
- Calendar page loads locations for the appointment dialog

### Added (Sprint 5 — Premium Dashboard Experience)

- Personalized Overview hero (greeting, date, today’s appointments/revenue/pending, AI summary from real metrics only)
- KPI cards with prior-period comparison when data exists, sparklines, hover motion
- Premium quick-action cards including AI Command Center
- “Today’s recommendations” panel driven by evidence-based rules (`lib/dashboard/insights.ts`) — empty state when none apply
- Richer empty states (primary + secondary CTAs, tips) and Overview skeleton via Suspense

### Changed (Sprint 5)

- Overview layout hierarchy, spacing, and micro-interactions aligned to Sprint 3 design system
- `getDashboardStats` extended with yesterday / prior-week / prior-month / pending / today revenue (read-only metrics; no booking logic changes)

### Added (Sprint 4 — AI Workforce)

- Dashboard section **AI Workforce** (`/dashboard/ai-workforce`) with employee grid, status, tasks, and quick actions
- Named AI employees (preview): Emma, Alex, Maya, Leo, Sophia, Noah
- Activity feed timeline with preview system events
- Employee detail pages with Overview, Metrics, Activity, Settings, and Future tabs
- AI Command Center conversational shell (`/dashboard/ai-workforce/command`) with placeholder intelligence
- Reusable components under `components/ai-workforce/` and roster types in `lib/ai-workforce/`

### Changed (Sprint 4)

- Sidebar includes AI Workforce (Sparkles) between Staff and Notifications

### Added (Sprint 3 — Premium Dashboard & Design System)

- Design tokens: spacing scale, `--radius-xl`, motion easing; `.ds-*` surface/nav utilities
- Shared primitives: `StatCard`, `Checkbox`, enhanced `EmptyState` (page/panel/inline), `WeekBars` chart
- Overview redesign: KPI cards with sparklines, weekly volume chart, quick actions, polished schedule/client panels
- Premium navigation: sidebar active states, client search shortcut, notifications bell, refined location switcher & account badge
- Empty states with primary CTAs across services, staff, clients, calendar setup, automation, developer, and client profile

### Changed (Sprint 3)

- Dashboard shell spacing and card surfaces unified; dual topbar page title removed in favor of content `PageHeader`
- Calendar views use design-system radius and shadow tokens

### Added (Sprint 2 — GVM Baby World Go-Live)

- Migration `011_sprint2_gvm_go_live.sql`: business logo/contact/address/policies/`social_links`; service `online_booking` + `preparation_instructions`; staff `biography` + `qualifications`
- Polished Settings profile: logo, phone, email, website, address, timezone, booking & cancellation policies, social links
- Services: online booking toggle, preparation instructions, buffer display; Ultrasound category
- Staff: photo URL, biography, qualifications, assigned location, working-hours summary
- Public booking shows business logo, prep instructions, staff photo/bio/quals, booking + cancellation policies
- Production setup: `scripts/setup-gvm-baby-world.mjs` (idempotent; no demo customers/appointments)
- Verification: `scripts/verify-sprint2-gvm-go-live.mjs` (25 checks, temporary book + cleanup)

### Changed (Sprint 2)

- First production tenant renamed to **GVM Baby World Ultrasound** (`/book/gvm-baby-world`)
- Default location labeled **Studio**; five elective ultrasound services configured with duration, price, color, buffers, prep
- Audit scripts prefer slug `gvm-baby-world`

### Added (Sprint 1 — Brand Integration)

- Official brand marks: Option 01 “The C” (`ChasumMark`) and Option 02 “The Spark” (`SparkMark`)
- Design tokens for spark accent, elevation shadows, and radius scale in `app/globals.css`
- Reusable UI primitives: `table`, `alert`, `chart`; expanded `button` / `badge` variants
- Brand applied across landing, auth, dashboard chrome, public booking, loaders, and empty states

### Changed (Sprint 1)

- Logo and product chrome use The C lettermark instead of the temporary grid icon
- Marketing copy positioned as AI Business Operating System
- Tag/status accent palette avoids purple bias; AI moments use teal Spark

### Added (Phase 5 — Multi-Location Foundation)

- Migration `008_phase5_multi_location.sql`: `locations`, `location_settings`, `location_hours`, `subscription_plans`; `location_id` on staff/services/appointments/availability; default location backfill for all businesses
- Migration `009_phase5_drop_old_rpc_overloads.sql`: remove pre-Phase-5 RPC signatures that conflicted with location-aware functions
- `lib/actions/location.ts`, `lib/location/constants.ts`: location CRUD, scope cookie, plan quota via `can_add_location`
- Dashboard location switcher (current location / all locations) and Add Location workflow
- Location-scoped settings (hours, booking policy), staff, services, calendar, and overview stats
- Public booking location picker and `?location=<slug>` deep link
- Shared customers with cross-location appointment history
- `scripts/verify-phase5-multi-location.mjs` (14 checks)

### Changed (Phase 5)

- Scheduling RPCs accept optional `p_location_id`; use `location_hours` and `location_settings` when present
- `ensure_business_for_owner` seeds default location for new businesses
- Phase 4 verification script updated for `location_id` on test fixtures

### Fixed

- Email confirmation now completes via `/auth/callback` using Supabase SSR token-hash flow (`verifyOtp`) instead of implicit `#access_token` redirects to the landing page
- Added `scripts/sync-supabase-email-templates.mjs` to configure Supabase confirmation and recovery email templates

### Production requirements (auth)

Authentication code is complete for development and staging. **Custom SMTP is the only remaining production requirement** before email confirmation and password reset can be verified end-to-end in production:

1. Configure custom SMTP in Supabase (recommended: [Resend](https://resend.com/docs/send-with-smtp)) — required on free-tier projects created after June 2026 to unlock auth email template editing
2. Run `node scripts/sync-supabase-email-templates.mjs` to apply token-hash callback templates
3. Verify signup, confirmation, login, and password reset against a real inbox

Resend is not configured yet; enable custom SMTP when ready for production testing.

### Added (Phase 4 — Core Scheduling Engine)

- Migration `005_phase4_scheduling_engine.sql`: unified `get_available_slots` and `validate_appointment_slot` RPCs, staff double-booking exclusion constraint, default staff hours seeding
- `lib/actions/scheduling.ts` and `lib/actions/availability.ts` for slot validation and time blocks
- Shared `components/scheduling/slot-picker.tsx` used by dashboard appointment dialog and public booking
- Public booking, dashboard appointments, calendar drag-reschedule, and API v1 POST all use the same scheduling RPCs
- Settings UI for blocked time (business-wide or per-staff)
- `scripts/verify-phase4-scheduling.mjs` end-to-end scheduling verification (19 checks)

### Changed (Phase 4)

- Dashboard appointment form replaces manual date/time inputs with available slot selection
- Fixed migration `002` enum update that blocked `supabase db push` on PostgreSQL

### Planned (Phase 5)

- Stripe subscriptions and billing
- AI scheduling assistant
- Generated Supabase TypeScript types
- Zod validation on server actions

---

## [0.2.0] — 2026-07-11

Phase 3: Integrations & Communication platform.

### Added

- **Calendar:** Google OAuth, Outlook OAuth, Apple .ics feeds, per-staff connections, two-way sync, external conflict detection
- **Email:** Resend provider with 6 reusable HTML templates; console fallback for dev
- **SMS:** Twilio provider with reminder/cancel/reschedule messages; console fallback
- **Notifications:** In-app notification center, delivery logs, orchestrator wired to all appointment lifecycle events
- **Automation:** Recurring appointment rules, waitlist with auto-notify on cancellation
- **Jobs:** `background_jobs` queue, cron processor (`/api/cron/process-jobs`), email/SMS/calendar/webhook queues
- **Developer platform:** REST API v1, API key auth, webhooks with HMAC, Zapier/Make discovery endpoint
- **Dashboard:** Integrations, Notifications, Automation, Developer pages
- Migration `004_phase3_integrations.sql` (9 new tables)
- `docs/REST_API.md` — complete API documentation

### Dependencies

- `resend`, `twilio`, `googleapis`, `ical-generator`, `zod`

---

## [0.1.0] — 2026-07-10

Architecture review release. Phase 1 + Phase 2 complete.

### Added — Architecture Review

- Toast notification system (`ToastProvider`)
- `useFormAction` and `useRefresh` hooks for form feedback
- Shared UI: `AlertMessage`, `FormFooter`, `IconButton`, `ColorPicker`, `WorkingHoursGrid`
- Loading skeletons: `DashboardSkeleton`, `PageLoader`, `Spinner`
- Dashboard `loading.tsx` and `error.tsx` boundaries
- Public booking `loading.tsx`
- Migration `003_rls_hardening.sql` with tenant indexes and SECURITY DEFINER RPCs
- `getAllStaffSchedules()` batch query for staff page
- Consolidated `StaffWithServices` and `StaffScheduleMap` types
- Dialog accessibility: focus trap, ARIA attributes, Escape to close
- Empty states on overview schedule and holidays settings

### Changed — Architecture Review

- Refactored staff, services, clients, and settings managers to shared patterns
- Replaced `window.location.reload()` with `router.refresh()` everywhere
- Public booking now uses RPCs (`upsert_booking_customer`, `create_public_appointment`)
- Public appointment reads via `get_public_appointments` RPC
- Settings hours form uses shared `WorkingHoursGrid`
- Calendar reschedule and delete actions show toasts instead of alerts
- Exported `ButtonProps` from button component

### Security

- Removed permissive anon SELECT/INSERT policies on `customers` and `appointments`
- Public PII access scoped through SECURITY DEFINER functions with business_id validation

---

## [0.1.0-beta.2] — 2026-07-10

Phase 2 completion: full booking engine.

### Added

- Calendar day, week, and month views with status colors
- Current-time indicator in day view
- Drag-to-reschedule in day view
- Appointment create, edit, cancel, and reschedule with conflict detection
- Client profile page with appointment history (`/dashboard/clients/[id]`)
- Customer tags and notes
- Staff working hours and vacation management
- Business holidays and booking policy settings
- Service categories, buffer times, and pricing
- Staff photo URL and title fields
- Dashboard overview: stats, revenue card, today's schedule, upcoming appointments
- Migration `002_booking_enhancements.sql`
- `pending` appointment status (replaces legacy `scheduled`)

---

## [0.1.0-beta.1] — 2026-07-10

Phase 2 core: booking engine foundation.

### Added

- Database schema: businesses, services, staff, customers, appointments, business_hours
- Row Level Security on all core tables
- `is_business_owner()` helper function
- Services CRUD (`/dashboard/services`)
- Staff CRUD with service assignments (`/dashboard/staff`)
- Clients CRUD with search (`/dashboard/clients`)
- Calendar page with week view (`/dashboard/calendar`)
- Public booking page multi-step flow (`/book/[slug]`)
- Server actions for all booking entities
- Migration `001_booking_engine.sql`
- Slot generation utility with business hours and conflict awareness

---

## [0.1.0-alpha.2] — 2026-07-10

Phase 1 completion: auth and dashboard shell.

### Added

- Reset password flow (`/reset-password`)
- Supabase auth callbacks (`/auth/callback`, `/auth/confirm`)
- Dashboard top navigation bar
- User email display in sidebar and top nav
- Sign out action

### Fixed

- ThemeProvider SSR crash (switched to `useSyncExternalStore`)
- Graceful Supabase env var handling via `getSupabaseEnv()`

---

## [0.1.0-alpha.1] — 2026-07-10

Phase 1 foundation.

### Added

- Landing page with hero, features, and pricing sections
- Supabase authentication: signup, login, forgot password
- Dashboard layout with responsive sidebar navigation
- Mobile sidebar drawer
- Route protection middleware
- Dark / light theme with system preference detection
- Design system: Button, Input, Label, Card, Dialog, Badge, Tabs, Select, Textarea
- Logo component
- Geist font integration
- Tailwind CSS v4 with CSS custom properties
- `.env.example` with Supabase and app URL variables

---

## [0.0.1] — 2026-07-10

### Added

- Initial Next.js 16 project scaffold (Create Next App)
- TypeScript strict mode
- ESLint with `eslint-config-next`

---

## Migration Guide

### Upgrading to 0.1.0

1. Pull latest `main`
2. Run `npm install`
3. Apply Supabase migrations in order:
   - `001_booking_engine.sql`
   - `002_booking_enhancements.sql`
   - `003_rls_hardening.sql`
4. Set environment variables per `.env.example`
5. Run `npm run build` to verify

### Breaking Changes

None for application code. Database migration `003` removes direct anon access to `customers` and `appointments` — public booking requires RPCs (already integrated in app code as of `f0ffaf7`).

---

## Commit Reference

| Version | Commit | Description |
|---------|--------|-------------|
| 0.1.0 | `f0ffaf7` | Architecture review |
| 0.1.0-beta.2 | `3418413` | Phase 2 complete |
| 0.1.0-beta.1 | `7065f37` | Phase 2 core |
| 0.1.0-alpha.2 | `7785a1c` | Phase 1 complete |
| 0.1.0-alpha.1 | `68f0a00`–`2e70c11` | Phase 1 foundation |
| 0.0.1 | `fb3af81` | Initial scaffold |

[Unreleased]: https://github.com/renovisionai2-cloud/chasum/compare/f0ffaf7...HEAD
[0.1.0]: https://github.com/renovisionai2-cloud/chasum/compare/3418413...f0ffaf7
[0.1.0-beta.2]: https://github.com/renovisionai2-cloud/chasum/compare/7065f37...3418413
[0.1.0-beta.1]: https://github.com/renovisionai2-cloud/chasum/compare/7785a1c...7065f37
[0.1.0-alpha.2]: https://github.com/renovisionai2-cloud/chasum/compare/68f0a00...7785a1c
[0.1.0-alpha.1]: https://github.com/renovisionai2-cloud/chasum/compare/fb3af81...68f0a00
[0.0.1]: https://github.com/renovisionai2-cloud/chasum/commit/fb3af81
