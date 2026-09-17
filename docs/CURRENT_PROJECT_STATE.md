# CURRENT_PROJECT_STATE.md

**Status:** Living project handoff — permanent source of truth for “where Chasum is right now”  
**Authority:** This repository and `/docs` are the source of truth. External chat history is not.  
**Update rule:** Refresh this file after every completed milestone (and when branch / commit / priorities materially change).  
**Last updated:** 2026-09-16
**Updated by:** Cursor — PR #39 Production closeout restamp. Documentation only. Cancellation confirmation P1 CLOSED / PRODUCTION ACCEPTED. Repeated-cancel waitlist idempotency P1 CLOSED / PRODUCTION ACCEPTED. Reception reschedule-notification P1 remains CLOSED / PRODUCTION ACCEPTED. Broader Production recovery remains CLOSED. Auth recovery remains CLOSED. Phase 5 IN PROGRESS. Planning windows, 18 workstreams, pricing, native direction and tenant architecture unchanged.

---

## Accepted PR #39 Production closeout — 2026-09-16

**CANCELLATION CONFIRMATION P1 = CLOSED / PRODUCTION ACCEPTED.**
**REPEATED-CANCEL WAITLIST IDEMPOTENCY P1 = CLOSED / PRODUCTION ACCEPTED.**
**Reception reschedule-notification P1 remains CLOSED / PRODUCTION ACCEPTED.**
**Production recovery remains CLOSED. Auth recovery remains CLOSED.** Do not conflate these programs. Do not reopen either cancellation P1 unless new contradictory runtime evidence appears.

Keep these three identities distinct. Do not hard-code a future docs-merge SHA; that would immediately stale this restamp.

| Concept | Identity |
| --- | --- |
| Current GitHub source of truth | Repository `main` HEAD. **main at this docs restamp base:** `0f0c376cdc2a0d7e80da94859f37ec918acf16d6`. After this docs PR merges, GitHub main will advance to a new documentation-only merge commit. That does not change accepted PR #39 runtime behavior. |
| Accepted PR #39 runtime / Production release baseline | `0f0c376cdc2a0d7e80da94859f37ec918acf16d6` on `dpl_E4CgoSXtXuVNavH3xuphDAYDyBHA` |
| Docs restamp vehicle | this docs-only PR / `docs/pr39-production-closeout` |

Current serving identity must be verified from `/api/build-info` rather than inferred from an older milestone SHA.

| Item | Accepted state |
| --- | --- |
| PR #39 | **MERGED / PRODUCTION ACCEPTED** — `fix: confirm cancel and skip waitlist on already-cancelled no-op` |
| Accepted candidate | `10b3d627c31438eca046263b67b1800f0a287311` |
| Accepted PR #39 runtime / Production release SHA | `0f0c376cdc2a0d7e80da94859f37ec918acf16d6` |
| Production deployment | `dpl_E4CgoSXtXuVNavH3xuphDAYDyBHA` |
| Production app | `https://chasum.vercel.app` |
| Production Supabase | `kxcydvhswkuzepwzzinq` |
| Staging app | `https://staging.chasumai.com` |
| Staging Supabase | `wnfahklzaxirftyskctd` |
| Production `/api/build-info` | `commit=0f0c376cdc2a0d7e80da94859f37ec918acf16d6`, `env=production`, `ref=main`, `production=true` |
| Production `/api/health` | HTTP 200, `ok=true`, `production=true`, `supabase=true`, `serviceRole=true`, `email=configured`, `cronSecret=configured`, `softSchemaFallbacks=disabled` |
| Optional health (not PR #39 regressions) | `sms=optional_missing`, `stripe=optional_missing`, `sentry=optional_missing` |

**Product behavior now accepted**

Booking Sheet Quick Actions Cancel is confirmation-gated. The first Cancel click does **not** cancel.

- Quick Actions → Cancel opens dialog **Cancel appointment?**
- Safe action: **Keep appointment** (also Escape / backdrop / X) — zero mutation
- Destructive action: **Cancel appointment** — required for the one real cancellation
- Cancelled appointments do **not** expose Booking Sheet Quick Actions Cancel

First real cancellation: status → cancelled; `appointment.cancelled` emitted; audit `cancel`; normal communications orchestration; `waitlist_notify` enqueued **once**.

Already-cancelled `cancelBooking` no-op: success contract preserved; no appointment write; no audit; no `appointment.cancelled` event. `cancelAppointment` enqueues `waitlist_notify` **only when** `result.events` contains `appointment.cancelled`. No new schema column. No queue-level dedupe hack. The existing domain event is the discriminator.

**Candidate validation:** focused 8 files / 34 tests PASS; combined 53 files / 486 tests PASS; typecheck PASS; changed-file lint PASS except unchanged pre-existing Booking Sheet lint debt; build PASS; `git diff --check` PASS. Claude independent audit: **A — PASS**. No further code fix after Claude audit.

**Hosted Staging acceptance (enqueue-only)** on exact candidate `10b3d627`: one authorized HQ create then one explicit cancellation of appointment `7987a27b-ee30-4a39-97e2-3c5ea2c16dcb`. Created Thu 17 Sep 2026 10:00–10:45 AM America/Toronto, 45 minutes, $0, no payment, existing customer Darshan Phase 5 Test, note `Phase 5 PR39 cancellation acceptance`. Previously cancelled HQ appointment `72163056-6577-4e29-828a-2276ebd2975a` exposed no actionable Quick Actions Cancel. First Cancel click opened confirmation with ZERO mutation; Keep appointment ZERO mutation; explicit Cancel appointment once; same id; confirmed → cancelled; start/end/duration/details unchanged; audit `cancel` once; `appointment.cancelled` once; one in-app “Appointment cancelled”; cancellation job delta exactly 3 email + 1 webhook + 1 `waitlist_notify`; all jobs left pending/unprocessed (`attempts=0`); all pre-existing queue rows unchanged; 10:00 slot released; Cancel no longer offered afterward; no second cancellation; no financial / unrelated-tenant / Production mutation. **The evidence appointment remains cancelled on Staging. Do not delete, restore, or clean it up.** **Do not document creation or cancellation emails as delivered or Sent.**

**Create occurrence jobs (unprocessed):** 3 email + 1 `appointment.created` webhook. **Cancellation occurrence jobs (unprocessed):** 3 email + 1 `appointment.cancelled` webhook + 1 `waitlist_notify`.

**Staging queue (operational debt, not a PR #39 failure):** the accepted hosted run ended with **40 pending/due** Staging jobs (historical debt plus PR #37 / earlier cancellation-validation artifacts plus this create/cancel set). None of the new PR #39 jobs were processed. Historical/unrelated rows unchanged. Do not process, delete, rewrite, or clean up those rows in this restamp. Not a Production incident. Bounded Staging queue/worker health follow-up.

**Production verification:** PASS, read-only. No Production appointment, customer, cancellation test, queue, email, webhook, waitlist, SQL, Auth, env, billing, payment/refund/invoice/receipt, or manual alias mutation. Authenticated Reception smoke was not required; protected routes correctly redirected to login.

**Phase 5 remains IN PROGRESS.** HQ accepted lifecycle evidence now includes: (1) normal booking dogfood — ACCEPTED; (2) customer/business/staff booking notifications — accepted for initial dogfood; (3) reschedule lifecycle — PRODUCTION ACCEPTED; (4) cancellation mechanical lifecycle — ACCEPTED; (5) cancellation confirmation P1 — CLOSED / PRODUCTION ACCEPTED; (6) repeated-cancel waitlist idempotency P1 — CLOSED / PRODUCTION ACCEPTED. Do **not** call Phase 5 complete. GVM still waits for the next legitimate real Production booking for operational exactly-once customer confirmation + business new-booking email observation. Do not manufacture a GVM Production booking. Engineering must not idle while waiting for GVM.

**Next governed product work (not authorized by this restamp):** HQ booking, reschedule, and cancellation lifecycle slices are now accepted. ChatGPT control tower / Product Owner will select the next bounded Phase 5 lifecycle slice after this source-of-truth restamp. GVM legitimate booking observation continues passively in parallel. Engineering does not idle waiting for GVM. Do not automatically start completed/no_show policy changes, Commercial SaaS Gate B, Summer expansion, Platform Admin expansion, native app work, or queue cleanup.

See [`docs/CHANGELOG.md`](./CHANGELOG.md).

## Historical: Accepted PR #37 Production closeout — 2026-09-16

**RECEPTION RESCHEDULE NOTIFICATION P1 = CLOSED / PRODUCTION ACCEPTED.**
**Production recovery remains CLOSED. Auth recovery remains CLOSED.** Do not conflate these programs. Do not reopen the Reception P1 unless new contradictory runtime evidence appears. Latest accepted product release is **PR #39** (see above). PR #37 identities below remain historical evidence.

Keep these three identities distinct. Do not hard-code a future docs-merge SHA; that would immediately stale this restamp.

| Concept | Identity |
| --- | --- |
| Current GitHub source of truth | Repository `main` HEAD. |
| Latest accepted PRODUCT RELEASE BASELINE | PR #39: `0f0c376cdc2a0d7e80da94859f37ec918acf16d6` on `dpl_E4CgoSXtXuVNavH3xuphDAYDyBHA`. |
| Accepted PR #37 runtime / Production release baseline | `f36a7aaf7d5b601c2fa2c914cb89d125cf18eab2` on `dpl_3zx6E7Ck22xYNdHTxiJ6xBVk9U2M` |
| Docs restamp vehicle (historical) | PR #38 / `docs/pr37-production-closeout` |

Current serving identity is not permanently pinned by this historical row and must be verified from `/api/build-info` rather than inferred from an older milestone SHA. Do not describe `0f0c376` as permanent current serving identity.

| Item | Accepted state |
| --- | --- |
| PR #37 | **MERGED / PRODUCTION ACCEPTED** — `fix: emit rescheduled when Reception save moves appointment time` |
| Accepted candidate | `dce6f9cd8ff8494ed0176c2977a25ede0135f44e` |
| Accepted PR #37 runtime / Production release SHA | `f36a7aaf7d5b601c2fa2c914cb89d125cf18eab2` |
| Production deployment | `dpl_3zx6E7Ck22xYNdHTxiJ6xBVk9U2M` |
| Production app | `https://chasum.vercel.app` |
| Production Supabase | `kxcydvhswkuzepwzzinq` |
| Staging app | `https://staging.chasumai.com` |
| Staging Supabase | `wnfahklzaxirftyskctd` |
| Production `/api/build-info` | `commit=f36a7aaf7d5b601c2fa2c914cb89d125cf18eab2`, `env=production`, `ref=main`, `production=true` |
| Production `/api/health` | HTTP 200, `ok=true`, `production=true`, `supabase=true`, `serviceRole=true`, `email=configured`, `cronSecret=configured` |
| Optional health (not PR #37 regressions) | `sms=optional_missing`, `stripe=optional_missing`, `sentry=optional_missing` |

**Product behavior now accepted**

Reception Edit booking remains BookingSheet → `updateAppointment` → `updateBooking` → canonical Booking Engine event path. No Reception-specific second notification implementation.

- Material customer-visible scheduled **range** change (start **or** end) → `appointment.rescheduled`
- Ordinary non-time edit → `appointment.updated`
- Lifecycle precedence: cancelled path → completed → no_show → range change → ordinary update
- Reschedule events carry truthful previous-range context: `previousStartTime` + `previousEndTime`
- Existing communications orchestration is reused
- Audit action for a range change: `reschedule`
- Tenant/business scoping, appointment identity, availability validation, and financial columns remain preserved

**Candidate validation:** focused 31; booking 155; communications 220; notifications 62; combined 437; typecheck PASS; changed-file lint PASS; build PASS; `git diff --check` PASS. Claude corrected-candidate re-audit: **A — PASS**.

**Hosted Staging acceptance (enqueue-only)** on Preview `dce6f9c`: one authorized HQ end-time-only Reception save of appointment `72163056-6577-4e29-828a-2276ebd2975a`. Before: Thu 17 Sep 2026 9:00–9:45 AM America/Toronto (45 min). After: 9:00–9:30 AM (30 min). Start unchanged; same appointment id, customer, service, staff, location; $0 preserved. Evidence: `appointment.rescheduled`; audit `reschedule`; in-app “Appointment rescheduled”; Summer reschedules 0 → 1; exactly 3 new **pending** email jobs (customer `appointment.reschedule`, business `appointment.business`, staff `appointment.staff`) sharing one new sendIntent occurrence; customer job carried `previousStartTime` + `previousEndTime`; one canonical `appointment.rescheduled` webhook; 0 new SMS/reminder/calendar_sync/recurring/waitlist jobs; historical due-queue fingerprint unchanged. **Do not document those three emails as delivered or Sent.** No provider-send proof was performed.

**Staging queue (operational debt, not a PR #37 failure):** before acceptance, 22 historical due pending jobs (12 reminder, 10 webhook). Acceptance added 3 pending email + 1 pending webhook. None were processed. Do not process, delete, rewrite, or clean up those rows in this restamp. Not a Production incident. Bounded Staging queue/worker health follow-up.

**Staging email capability (separate):** current test environment does not expose a dedicated Staging-only `RESEND_API_KEY` suitable for independent provider-send acceptance. Claude classification: important before Outside Private Alpha; not a blocker for continued internal GVM/HQ Phase 5 validation. No credential was created or copied here.

**Production verification:** PASS, read-only. No Production appointment, customer, queue, email, SQL, Auth, env, billing, or manual alias mutation. Authenticated Reception/CRM/GVM smoke was not performed because no canonical Production session existed; protected routes correctly redirected to login. That is not a PR #37 defect.

**Phase 5 remains IN PROGRESS.** HQ first normal booking dogfood ACCEPTED (customer confirmation, business new-booking notification, staff notification per enabled setting). Reception reschedule lifecycle defect FIXED / PRODUCTION ACCEPTED. Hosted-acceptance appointment currently has Staging range Thu 17 Sep 2026 9:00–9:30 AM ET. GVM still waits for the next legitimate real Production booking for operational exactly-once confirmation/business-notification evidence. Do not manufacture a GVM Production booking. Engineering must not idle while waiting for GVM.

**Then-next governed product work (historical):** cancellation testing was the next HQ lifecycle candidate after this restamp. That slice is now **PR #39 CLOSED / PRODUCTION ACCEPTED** (see the PR #39 closeout above). Do not treat cancellation testing as current NEXT.

See [`docs/CHANGELOG.md`](./CHANGELOG.md).

## Accepted Auth closeout + Phase 5 resume — 2026-09-16

Historical Auth-closeout restamp (then-canonical main `4f7da8fbadf9ab882be07b0112bee0c53d74913c`, PR #35 squash). Latest accepted product release is PR #39 (`0f0c376cdc2a0d7e80da94859f37ec918acf16d6` on `dpl_E4CgoSXtXuVNavH3xuphDAYDyBHA`). Historical accepted PR #37 runtime / Production release baseline remains `f36a7aaf7d5b601c2fa2c914cb89d125cf18eab2`. Current GitHub main identity is repository HEAD and may advance through documentation-only restamps without changing accepted runtime. Production app: `https://chasum.vercel.app`. Production Supabase: `kxcydvhswkuzepwzzinq`. Staging app: `https://staging.chasumai.com`. Staging Supabase: `wnfahklzaxirftyskctd`.

**Broader historical Production recovery program = CLOSED.** Completing the separate Auth P1 does **not** reopen it.

| Item | Accepted state |
| --- | --- |
| Staging password recovery | **PASS / CLOSED / FROZEN** |
| Staging host / deploy / SHA | `https://staging.chasumai.com` / `dpl_5kQZyE2PiHRunvfnPB3xUjPDUFW2` / `7b8abcf30dcb421b03c0a93220dc9f459fa0fcab` |
| Production password-reset completion | **P1 CLOSED / ACCEPTED** |
| Accepted recovery email href (Staging + Production Reset Password) | `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password` |
| Production template mutation | Href-only under explicit PO authorization. Subject/copy preserved. No Site URL, redirect-list, SMTP, Resend, DNS, Auth-user admin, application-code, Vercel, database, migration, tenant, Cron/worker/webhook, or billing change. |
| Production acceptance path | forgot-password → `/recover` 200 `user_recovery_requested` → email → token_hash `/auth/callback` → `/reset-password` → one password update → authenticated GVM Baby World dashboard. No `pkce_code_verifier_not_found`, no `code_exchange_failed`, no GoTrue `/verify` PKCE dependency. |
| Further Staging Auth testing | **Not required** unless new contradictory evidence appears. |

**Do not implement in this restamp (separate remaining items):**

- Account A / Account B cross-session recovery gap — Sept. 1 Staging hardening is not fully on current main. Failed Account B recovery while Account A is authenticated can reach `/login?error=auth_callback_failed` then guest-only middleware and land on Account A `/dashboard`. `/forgot-password` remains guest-only on current main. Security/correct-account context: the signed-in operator can remain Account A after Account B’s recovery link fails. **Separate bounded Auth follow-up. Not the closed reset-completion P1. Not a Staging Auth reopen. Not a Phase 5 blocker.** Tracked as TD-H10.
- Production `NEXT_PUBLIC_SUPABASE_URL` currently contains `/rest/v1/`. App normalization protected the accepted `/recover` path. **Not the closed Auth P1 root cause. Separate configuration cleanup (TD-H11). Do not fix now.**

**State-ambiguity governance (locked improvements, not a new blocking program):** recent slowdown has been driven substantially by state ambiguity across code, configuration, deployments, environments, branches, migrations, runtime, and documentation — not merely ordinary product bugs. Required improvements, introduced in bounded slices **alongside** Phase 5 and completed to the required level **before Outside Private Alpha**: (1) Automated Environment / Release Manifest; (2) permanent launch-critical regression suite; (3) mandatory Staging → acceptance → main disposition; (4) structured observability + Sentry/release correlation; (5) CI/CD-driven release reconciliation.

Permanent rules: no Production runtime code without canonical GitHub representation; no accepted Staging fix left outside main without explicit disposition; no Production release without exact-SHA Staging acceptance; no unexplained environment drift; no configuration changes without before/after evidence and rollback; no reopening accepted work without contradictory current evidence; one primary implementer per task; source-of-truth restamp is part of Definition of Done; Production is never the development environment.

**Phase 5 resumes.** Prevention work is **not** a Phase 5 blocker. Locked execution remains: (1) GVM + Chasum HQ Phase 5 validation in parallel; (2) Outside Private Alpha readiness; (3) Commercial SaaS Gate B; (4) Summer Business Manager horizontal v1.

This documentation does not authorize implementation, Auth/config mutation, or Production changes.

## Accepted post-release state — 2026-09-14

**PRODUCTION RECOVERY = CLOSED. Phase 5 = IN PROGRESS, not complete.**
This restamp records accepted recovery evidence; it does not rerun Production validation.
See [closeout and evidence provenance](./recovery/PRODUCTION_RECOVERY_CLOSEOUT_20260914.md).
Historical 2026-09-14 pin identities below are recovery-closeout evidence, not a claim that Production never moved afterward. Latest accepted product release is PR #39 (`0f0c376cdc2a0d7e80da94859f37ec918acf16d6` on `dpl_E4CgoSXtXuVNavH3xuphDAYDyBHA`). Historical accepted PR #37 runtime remains `f36a7aaf7d5b601c2fa2c914cb89d125cf18eab2`. Current GitHub main identity is repository HEAD.

| Item | Accepted state |
| --- | --- |
| Production deployment | `dpl_3wENSHQrTUnu6VkaqjE7coJ4kjbn` |
| Canonical main / Production Git SHA | `8df29d298c196a2431c86a8cea4af1e5bfec09fd` |
| Production Supabase | `kxcydvhswkuzepwzzinq` |
| Recovery hold | OFF |
| Cron | ENABLED; `*/5 * * * *`; `/api/cron/process-jobs` |
| Worker reliability / webhooks | ACCEPTED / CLOSED; worker webhooks OFF / absent |
| Package A | ACCEPTED; Production record `20260913232447_package_a_existing_appointment_interval_correction` |
| Canonical GVM business | `a04e1d65-eeb9-4d72-a5bf-739a9038bb91` — normal tenant |
| GVM Main/Burlington location | `ebe0b761-a207-4ca7-96ed-ad835a06e2cc` |
| GVM business/location timezone; currency | America/Toronto / America/Toronto; CAD |
| Early Gender service | 30-minute duration + 5-minute cleanup |
| Final public exposure | 3/3 bounded renders PASS |
| Prior public Gateway Timeout | Historical P2; root cause unproven; not an active recovery blocker |
| Migration gates | 034/035/036 locked/unapplied; 040 unexecuted on Production; 041 accepted/unmodified |

Production pin/recovery acceptance is complete. GVM public/authenticated stabilization is substantially validated. First legitimate GVM booking plus customer confirmation and business new-booking email remain operational validation. Chasum HQ dogfood continues as a normal tenant; `/owner` is Platform Admin. Outside Private Alpha has not started. Commercial SaaS Gate B is NOT MET.

PR #32 is **MERGED / ACCEPTED**. Canonical main and accepted Production Git SHA are `8df29d298c196a2431c86a8cea4af1e5bfec09fd`; accepted deployment is `dpl_3wENSHQrTUnu6VkaqjE7coJ4kjbn`. Canonical GitHub source of truth is **RESTORED** and Production release **ACCEPTED**. These are accepted 2026-09-14 release identities, not permanent architectural constants; future serving truth comes from the actual environment/current release record.

All three Production aliases — `chasum.vercel.app`, `chasum-renovisionappcom.vercel.app`, and `chasum-git-main-renovisionappcom.vercel.app` — align to that deployment. The git-main alias is intentionally protected: unauthenticated HTTP 302 → Vercel SSO is expected security behavior, not an application failure. Staging remains isolated and unchanged. This acceptance is the supplied Product Owner/control-tower closeout; no fresh protected-alias application pass is claimed. Recovery remains CLOSED unless new contradictory runtime evidence appears.

Historical recovery refs preserve exact evidence; they are not current execution instructions. Canonical source of truth is main + canonical /docs.

## Control board (start here)

### LOCKED / APPROVED

- **Vision:** Chasum is a world-class **AI Business Operating System** for service businesses — not merely a booking platform.
- **Architecture:** One reusable multi-tenant SaaS. Business → Location → Resources remains the structural direction. No tenant-specific product forks.
- **Chasum HQ:** A **real normal business tenant** used to operate Chasum itself. Same architecture as outside customers. **Not** the SaaS control plane. **Not** `/dashboard/hq`.
- **Platform Admin / Control Centre:** Separate control plane for tenants, subscriptions, trials, plans, billing/account health, support access, usage, entitlements, and platform operations. Current direction: **`/owner`**.
- **World Class grouped tenant nav:** PO-approved, **protected**, and **on `main`**. Phase 1 (PR #23) shipped grouped desktop navigation + mobile bottom navigation via Minimum Necessary Diff. `origin/cursor/world-class-portal-foundation` is **reference-only** — not a merge target and not a working baseline.
- **Environment isolation:** Preview → Staging Supabase `wnfahklzaxirftyskctd`. Production → Production Supabase `kxcydvhswkuzepwzzinq`. Production app: `https://chasum.vercel.app`. Production changes require explicit PO approval.
- **Tenant Identity Safety Gate:** Permanent. Canonical: [`docs/TENANT_IDENTITY_SAFETY_GATE.md`](./TENANT_IDENTITY_SAFETY_GATE.md).
- **Financial truth:** Client money must represent reality (paid, refunded, outstanding, deposit, invoice, receipt, tax, balance). Mock SaaS billing must not mint paid invoices.
- **Coming Soon honesty:** Do not market or nav-present unfinished capabilities as operational. [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md).
- **Momentic:** Setup **COMPLETE**. Supporting regression infrastructure only — not a standalone roadmap track.
- **Launch-criticality governance:** [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md) — **18 workstreams**. Planning targets are not public promises. Launch criticality does not override quality. Permanent **AI Operating-System Preservation Check** sits beside launch criticality, world-class quality, and next-generation advantage.
- **Native mobile / App Store:** **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY** (workstream 18). One reusable multi-tenant Chasum app. GVM, Chasum HQ, and future businesses are normal tenants — no mobile forks. Working technical direction: **React Native + Expo**. Final stack: **TO BE CONFIRMED DURING NATIVE APP PREFLIGHT**. Begin material implementation after the Native App Start Gate, early enough for iOS/Android testing **before broader public launch**. Not Phase 5. Commercial v1 does **not** currently require App Store / Play apps.
- **GVM duplicate-tenant identity incident:** **CLOSED**. Not an active World Class blocker. Do not reopen.
- **Staging password recovery:** **PASS / CLOSED / FROZEN**. Token_hash Reset Password template accepted. No further Staging Auth testing unless new contradictory evidence appears.
- **Production password-reset completion P1:** **CLOSED / ACCEPTED**. Live Reset Password href is the token_hash callback pattern. Do not reopen without contradictory current evidence.
- **Reception reschedule-notification P1:** **CLOSED / PRODUCTION ACCEPTED** (PR #37). Material start **or** end range change is `appointment.rescheduled` with truthful `previousStartTime` / `previousEndTime`. Do not reopen without contradictory current evidence.
- **Cancellation confirmation P1:** **CLOSED / PRODUCTION ACCEPTED** (PR #39). Booking Sheet Quick Actions → Cancel opens confirmation; Keep / Escape / backdrop / X do not cancel; explicit **Cancel appointment** is required. Do not reopen without contradictory current evidence.
- **Repeated-cancel waitlist idempotency P1:** **CLOSED / PRODUCTION ACCEPTED** (PR #39). `waitlist_notify` enqueues only when `appointment.cancelled` actually occurred. Do not reopen without contradictory current evidence.
- **State-ambiguity prevention:** governed (manifest, regression suite, Staging→main disposition, observability, CI/CD reconciliation). **Not** a Phase 5 blocker; bounded slices alongside Phase 5, required before Outside Private Alpha.

### ACTIVE

- World Class Phase 1 — Navigation Foundation: **COMPLETE / MERGED TO MAIN** (PR #23, `ef88ef5`).
- World Class Phase 2 — Staff Plan Honesty: **COMPLETE / MERGED TO MAIN** (PR #25, `dd49b32`).
- World Class Phase 3 — Command Centre / Today experience: **COMPLETE / MERGED TO MAIN** (PR #27, `0c61a8d`).
- World Class Phase 4A — Commercial SaaS Lifecycle Honesty: **COMPLETE / MERGED TO MAIN** (PR #29, `f6517a1`). Gate A complete. Commercial SaaS Lifecycle remains **PARTIAL**. Gate B **NOT MET**.
- Launch schedule + launch-criticality governance: **ADOPTED** — [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md).
- GVM operational validation remains important (first real appointment, production email path) but **is not the entire roadmap**.
- Balanced outcomes required: **A Core Operations · B Commercial SaaS · C Intelligence · D Validation**.

### BLOCKED / GATED

Genuine current gates only (not closed incidents):

- **`/dashboard/hq` disposition** gated on a later explicit PO decision (move into `/owner`, relabel, or retire). No new product work on that surface until then.
- **Track 3 database / RLS hardening** not implemented. Migrations **034–036 UNAPPLIED**. **037/038 APPLIED** on Staging and Production but **executable SQL missing from repo history**.
- **Paid self-serve SaaS conversion** gated on a real Stripe Billing provider (mock provider must refuse paid upgrades).
- **Production deploys** gated on explicit PO approval. **Do not infer that `main` is what Production is serving.**
- Booking **resources** (`036`) unapplied; feature flag off.

### NEXT

Do **not** automatically “finish GVM” as a product rewrite. Do **not** start Gate B, RBAC, Summer expansion, `/owner` expansion, or native apps in this chapter.

1. GVM + Chasum HQ Phase 5 validation **in parallel**. HQ booking, reschedule, and cancellation lifecycle slices are now accepted. ChatGPT control tower / Product Owner will select the next bounded Phase 5 lifecycle slice after this source-of-truth restamp. GVM still waits for the next legitimate Production booking for exactly-once confirmation/business-notification evidence — observe passively; do not manufacture a GVM booking. Engineering must not wait idle for a GVM customer.
2. Outside Private Alpha readiness, including observability, switching/import capability and tenant onboarding/identity safety.
3. Commercial SaaS Gate B — explicit major post-Phase-5 priority; separately scoped and approved before implementation.
4. Summer Business Manager horizontal v1 — explicit major post-Phase-5 priority; separately scoped and approved before implementation.

Core Operations launch-required defect work continues throughout. GVM and HQ are validation tenants, not product forks; neither may dominate the roadmap.

This documentation does not authorize implementation or Production changes.

**GVM validation (separate — does not dominate the product roadmap):** remaining go-live craft in [`docs/GVM_GO_LIVE.md`](./GVM_GO_LIVE.md) — first legitimate appointment + customer/business email operational validation. Identity incident is closed; follow-up identity debt stays separately tracked.

**Marketing (when directed):** Home page (`/`). Pricing, Meet Summer, Roadmap, Resources, Why Private Alpha, and Security remain locked.

---

## How to use this document

1. Start here at the beginning of every implementation session.
2. Follow linked docs for depth — do not invent product claims outside [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md).
3. When values conflict, [`docs/company/CHASUM_BIBLE.md`](./company/CHASUM_BIBLE.md) wins.
4. When **current-chapter priorities** conflict, **this control board** wins over older “Operation GVM is the entire roadmap” language in companion files.
5. After a milestone ships: update **Last completed work**, **Latest commit**, **Uncommitted work**, **Current milestone**, **NEXT**, and the date above.

### Companion entry points

| Doc | Role |
|-----|------|
| [`COMPANY_MEMORY.md`](../COMPANY_MEMORY.md) | Current-chapter priorities (balanced OS outcomes; GVM = validation partner) |
| [`docs/company/CHASUM_BIBLE.md`](./company/CHASUM_BIBLE.md) | Company constitution |
| [`docs/company/MASTER_ROADMAP.md`](./company/MASTER_ROADMAP.md) | Completed vs future strategic milestones |
| [`docs/company/MASTER_TASKS.md`](./company/MASTER_TASKS.md) | Active engineering backlog |
| [`docs/HQ_ARCHITECTURE.md`](./HQ_ARCHITECTURE.md) | **HISTORICAL / LEGACY naming** for `/dashboard/hq` — not Chasum HQ the tenant |
| [`docs/OWNER_PLATFORM.md`](./OWNER_PLATFORM.md) | Platform Admin / Control Centre (`/owner`) |
| [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md) | What may be claimed publicly |
| [`docs/marketing/PRICING_PAGE_V1_LOCK.md`](./marketing/PRICING_PAGE_V1_LOCK.md) | **Pricing page lock** — Official v1 approved baseline |
| [`docs/marketing/SUMMER_ONBOARDING_V1_LOCK.md`](./marketing/SUMMER_ONBOARDING_V1_LOCK.md) | **Summer Onboarding lock** — Meet Summer guided discovery v1 |
| [`docs/marketing/ROADMAP_V1_LOCK.md`](./marketing/ROADMAP_V1_LOCK.md) | **Roadmap lock** — Roadmap v1 approved baseline |
| [`docs/marketing/RESOURCES_V1_LOCK.md`](./marketing/RESOURCES_V1_LOCK.md) | **Resources lock** — Why Private Alpha, Security, Status v1 |
| [`docs/marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md`](./marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md) | **Why Private Alpha lock** — v1 approved baseline |
| [`docs/marketing/SECURITY_V1_LOCK.md`](./marketing/SECURITY_V1_LOCK.md) | **Security lock** — v1 approved baseline |
| [`docs/MARKETING_PRODUCT_FEATURE_AUDIT.md`](./MARKETING_PRODUCT_FEATURE_AUDIT.md) | Marketing ↔ product feature audit (post GVM URL deploy) |
| [`docs/marketing/HOMEPAGE_MASTER_SPECIFICATION.md`](./marketing/HOMEPAGE_MASTER_SPECIFICATION.md) | Home page (`/`) canonical front-door spec |
| [`docs/product/05_ARCHITECTURE.md`](./product/05_ARCHITECTURE.md) | Product architecture detail |
| [`docs/CHANGELOG.md`](./CHANGELOG.md) | Ship history |
| [`docs/TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md) | Debt register |
| [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md) | **Launch-criticality tracker** — **18 workstreams**; Phase 5 stabilization; Private Alpha vs commercial-v1 billing gates; native mobile **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY**; AI OS preservation check |

---

## Product in one paragraph

**Chasum** is a world-class **AI Business Operating System** for appointment-based service businesses — not “just booking software.” Scheduling is the foundation; the product is the operating layer: reception calendar, CRM, employees, locations, commerce, communications, reports, Commercial SaaS lifecycle, and an AI workforce that shares one business brain.

**Current go-to-market posture:** Private Alpha — invite-only design partners. Primary CTA is **Apply for Private Alpha** (`/apply`). Public self-serve billing is **not** open. First customers are expected to be **small and growing service businesses**.

**Validation tenants (normal businesses, not forks):**

- **GVM Baby World** — Founding Design Partner #001. Validates the reusable product in production. Authoritative tenant id `a04e1d65-eeb9-4d72-a5bf-739a9038bb91`, slug `gvm-baby-world`.
- **Chasum HQ** — Normal tenant used to dogfood Chasum by operating Chasum itself. Staging canonical slug `chasum-hq` (`724d9ecd-438d-439e-952e-2d8c4ab4486c`). Must not receive privileged shortcuts.

**Package / release:** `v0.2.0` (Next.js **16.2.10**, React 19). Next product release target remains documented as **v0.3.0** in [`docs/product/15_RELEASE_PLAN.md`](./product/15_RELEASE_PLAN.md); that file’s “first appointment / SMTP” items are **GVM validation**, not automatic product-roadmap domination.

---

## Naming: Chasum HQ vs Platform Admin vs `/dashboard/hq`

| Name | Meaning (authoritative) |
|------|-------------------------|
| **Chasum HQ** | A **normal tenant** (a real business inside Chasum) used to operate Chasum itself. Same multi-tenant architecture as GVM or any future customer. |
| **Platform Admin / Control Centre** | SaaS operator control plane. Current direction: **`/owner`**. Tenants, subscriptions, trials, plans, billing/account health, support, usage, entitlements, platform operations. |
| **`/dashboard/hq`** | **LEGACY / FOUNDER-ONLY SURFACE — NAMING/DISPOSITION TO BE RESOLVED.** Existing code/docs that call this “Chasum HQ” are **stale naming**. Do **not** describe `/dashboard/hq` as Chasum HQ product architecture. Do **not** redesign, delete, or expand it until a later PO decision: move into `/owner`, relabel, or retire. |

---

## World Class tenant navigation

**Status:** WORLD CLASS PHASE 1 — NAVIGATION FOUNDATION
**STATUS: COMPLETE / MERGED TO MAIN** (PR #23, squash `ef88ef57be040678d886d0a9b4d99c679d801128`)

Grouped tenant navigation and mobile navigation are now on `main`.

Preview/Staging acceptance passed:

- Authenticated desktop walkthrough passed
- Mobile 390×844 walkthrough passed
- Required route walk passed
- Momentic booking smoke passed (no customer / appointment / commerce / notification mutation)
- Production was **not** changed by Phase 1

The old World Class branch `origin/cursor/world-class-portal-foundation` (`c5aa36f`) is now **reference-only**, not a merge target and not a working baseline. Continue from current `main` only.

Approved groups (now shipping):

```
TODAY          Command Centre, Reception
CUSTOMERS      Customers
TEAM           Employees
CATALOG        Services, Packages, Memberships
MONEY          Payments, Gift Cards, Discounts
OPERATE        Reports, Automations
AI             Summer, Chase, AI Workforce
BUSINESS       Business setup, Locations, Communications, Integrations
ACCOUNT        Account & billing
```

Platform Admin remains separate (`/owner`). `/dashboard/hq` remains founder-only, labeled **HQ**.

| Reality | Location |
|---------|----------|
| Shipping implementation | `main` — `lib/dashboard/nav.ts`, grouped sidebar, `components/dashboard/mobile-bottom-nav.tsx` |
| Historical reference | `origin/cursor/world-class-portal-foundation` — remaining World Class work is **not** wholesale-mergeable |

Phase 1 follow-up debt (do **not** solve in a docs stamp):

- Business location limit: entitlement helper = 6 vs existing fallback/catalog = 10
- `/dashboard/hq` naming/disposition unresolved
- Dashboard React hydration warning #418
- Mobile visible label “Centre” accepted for this phase

---

## World Class Phase 2 — Staff Plan Honesty

**STATUS: COMPLETE / MERGED TO MAIN** (PR #25, squash `dd49b324a080b3ca41e003e6cacb747b32479d61`)

**Why this slice:** Commercial SaaS plan truth. Operators cannot create or reactivate more active staff than the plan includes. Reusable product honesty, not GVM-only architecture and not a decorative redesign.

Accepted product truth (`staff.is_active = true`):

| Plan | Active staff |
|------|----------------|
| Free | maximum **1** |
| Professional | maximum **3** |
| Business | **unlimited** |
| Enterprise | **unlimited**, unless a later explicit plan decision changes this |

Inactive staff remain stored on the business and **do not** consume an active seat.

**Active in Chasum** is the canonical UI term for `is_active`. It is **not** employment status, login access, roles/RBAC, or payroll state.

Server-side enforcement is authoritative (`staffQuotaForBusiness` / `assertCanActivateStaff` / `staffQuotaError`). UI gating (`StaffQuotaNotice`, Add employee / Add myself disabled at cap) is supportive only.

Validation accepted:

- Preview/Staging workflow acceptance passed
- Momentic booking smoke passed (no customer / appointment / commerce / notification mutation)
- Claude independent post-audit approved
- Production was **not** changed by Phase 2

Phase 2 follow-up debt (do **not** solve in this stamp):

- Staff quota TOCTOU / concurrency race (two simultaneous activations could theoretically consume the last seat) — important follow-up, not blocking for Private Alpha
- Raw database-error passthrough on some staff action failures
- Bulk Activate is not proactively quota-disabled in the UI
- Directory filter still says “booking status” for `is_active`
- Add Myself remains empty-state-only
- Disabled-control explanation relies partly on title tooltip

---

## World Class Phase 3 — Command Centre / Today experience

**STATUS: COMPLETE / MERGED TO MAIN** (PR #27, squash `0c61a8d28f83e3347425d9a1bca41188b5f94ed1`)

**OBJECTIVE (accepted):** `/dashboard` is the Command Centre V1 — trusted operating home, not a decorative dashboard and not a Reports duplicate.

Accepted outcome:

- Header, Today, Attention, Money, Quick Actions, Summer
- Trusted Today: appointments today, next appointment, active schedule (`isActiveBooking`; cancelled / no-show excluded from the working list)
- Grounded Attention: pending confirmations, cancellations today, outstanding invoices/deposits, setup gaps
- Money from `lib/commerce/dashboard.ts` → `getCommerceDashboardSnapshot()`; UI **Gross payments collected today** (not appointment-recognized revenue); outstanding invoices and deposits shown as separate snapshot fields
- Business-local Today via `lib/business/datetime.ts`
- Appointment metrics respect `getLocationScope()`; commerce money is business-wide and labeled honestly
- Quick Actions use existing routes; setup checklist preserved when incomplete
- Summer facts grounded in the same snapshot only (no fabricated recommendations, no Sophia/Leo/Maya/Alex theater)
- Mobile (~390) and desktop Command Centre verified; Phase 1 navigation intact
- Claude independent post-audit: **APPROVED**
- Momentic booking canary PASS (no customer / appointment / payment creation)
- No financial formula changes, no migrations, no tenancy changes
- Production untouched during development/validation

**Money truth (still locked):** Do not combine Gross payments collected with appointment-recognized revenue. Do not redefine invoice, refund, or deposit math.

**Business timezone (still locked):** Command Centre “today” remains the business-local day.

Phase 3 follow-up (do **not** solve in the launch-governance stamp):

- Pre-existing **DashboardTopNav** horizontal overflow at approximately **768–1024px** (at 820px: viewport 820, `document.scrollWidth` 844). Command Centre `.ds-page` right edge 820; Today’s schedule CardHeader 819. Same 844px min-width on `/dashboard/employees` and `/dashboard/payments`. Classification: **PRE-EXISTING SHELL**. **IMPORTANT BUT POST-LAUNCH SAFE**. Current launch risk **GREEN**. Reassess only if pilot testing proves it materially blocks a key tablet workflow.
- Staff quota TOCTOU, location 6-vs-10, `/dashboard/hq` disposition remain earlier-phase debt.

---

## Working launch schedule (planning targets, not public promises)

Canonical tracker: [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md).

1. GVM + Chasum HQ stable pilot use — **Late September–October 2026**
2. Selected outside Private Alpha — **October–November 2026**
3. Commercially launchable Chasum v1 — **December 2026–February 2027**
4. Broader public launch — **February–April 2027**
5. Fuller world-class AI Business Operating System vision — **Mid/Late 2027 onward**

**Governing rule:** Build what Chasum needs to launch trustworthily first. Launch criticality does not override quality. We defer unnecessary breadth; we do not defer reliability, trust, financial truth, security, usability, workflow quality, responsive quality on key workflows, architectural correctness, tenant isolation, or professional polish required for customer confidence.

**LAUNCH REQUIRED** is not “valuable / World Class / competitive.” It needs a specific safety, commercial, operational, legal/security, customer-trust, platform reliability, or product-positioning reason that prevents launch.

Commercial v1 target health at this stamp: **AMBER** (see tracker).

---

## Momentic

**Status:** COMPLETE — supporting regression infrastructure only.

| Item | Detail |
|------|--------|
| PR #20 | Safe Momentic baseline — merged |
| PR #21 | First real Preview/Staging booking smoke — merged (`web/chasum-test-studio-booking-smoke.test.yaml`) |
| Synthetic Staging tenant | **Chasum Test Studio** (Staging only; never Production) |
| Role | Regression canary for booking/availability paths |
| Not | A standalone roadmap track or a blocker of normal Chasum development |

---

## Summer / Intelligence

**Canonical positioning:** Summer = **AI Business Manager** (operating intelligence layer). Do not reposition strategy as “AI Receptionist only.” AI Receptionist is one capability inside the role.

**Implementation truth (do not over-claim):** Summer is currently strongest in booking, availability, CRM-grounded interactions, configured business knowledge, limited commerce awareness, and appointment actions (create / reschedule / cancel via the Booking Engine). It has **not** reached full AI Business Operating Manager depth (proactive recommendations and actions across the OS). Record that gap as roadmap work.

Chase remains Early Access, read-oriented. Additional roster roles (Alex, Maya, Leo, Sophia) are Coming Next / Future Vision.

---

## Commercial SaaS

**Maturity:** trails Core Operations. Status remains **PARTIAL**. Do **not** mark complete after Phase 4A.

**Private Alpha billing readiness (Gate A / Phase 4A):** **COMPLETE** (PR #29). Honesty + `/owner` design-partner plan assignment + documented manual billing. Does **not** complete this workstream.

**Commercial v1 billing readiness (Gate B):** **NOT MET**. Explicit priority after Outside Private Alpha readiness. Do **not** start in this chapter. Live provider / webhooks / schema / migrations / Production subscription data = LEVEL 3 + Claude pre-challenge before implementation.

Incomplete / not production-ready:

- Paid self-service subscription conversion (Gate B)
- Payment-provider SaaS billing lifecycle (Gate B)
- Upgrade / downgrade / cancellation maturity (Gate B)
- Failed-payment / dunning recovery (Gate B)
- Remaining plan entitlement enforcement (location 6-vs-10 mismatch; other entitlements)
- Multi-staff permissions / RBAC
- Account lifecycle and usage / account-health depth

What exists: signup/auth, per-owner tenant bootstrap, plan keys, `private_alpha_enabled` feature elevation, **active-staff quota enforcement** (Phase 2), location caps, mock billing provider, paid-upgrade guard (refuses paid plans unless Stripe provider), `/dashboard/settings/billing`, `/owner` oversight surfaces.

---

## Current architecture

### Stack

| Layer | Choice |
|-------|--------|
| App framework | Next.js App Router (`next@16`), TypeScript |
| UI | React 19, Tailwind CSS v4, Design System v1 (`components/ui/*`) |
| Database | Supabase PostgreSQL + RLS (`supabase/migrations/`) |
| Auth | Supabase Auth + `@supabase/ssr` (cookies); `middleware.ts` |
| Hosting | Vercel (`vercel.json` crons) |
| Email / SMS | Resend / Twilio (console fallback when unset) |
| Calendars | Google + Microsoft OAuth; Apple via ICS |
| Payments | Commerce ledger **manual-first**; Stripe SaaS checkout Coming Next |
| Jobs | `background_jobs` + cron → `/api/cron/process-jobs` |
| Observability | Sentry (`instrumentation.ts`) |
| Tests | Vitest, Playwright, Momentic (Preview/Staging regression), verify scripts under `scripts/` |

Backend pattern: **Server Actions + Route Handlers** — no separate API server. Env contract: `.env.example`, `lib/env.ts`.

### Surfaces

| Surface | Audience | Paths |
|---------|----------|--------|
| Marketing site | Prospects / applicants | `app/(marketing)/*` — `/`, `/pricing`, `/platform`, `/product-tour`, `/industries`, `/meet-summer`, `/private-alpha`, `/apply`, `/roadmap`, … |
| Auth | Anyone | `app/(auth)/*`, `app/auth/callback` |
| Tenant product | Business owners (including GVM and Chasum HQ tenants) | `/dashboard/*` |
| Public booking / portal | End customers | `/book/[slug]`, `/portal/[token]` |
| Platform Admin / Control Centre | Chasum platform operators | `/owner/*` |
| Legacy founder-only surface | Founders / platform owners | `/dashboard/hq`, `/dashboard/hq/private-alpha` — **not** “Chasum HQ”; disposition unresolved |

### Key `lib/` domains

`booking-engine`, `commerce`, `crm`, `employees`, `communications`, `billing`, `reports`, `integrations`, `summer`, `chase`, `website-concierge`, `ai-workforce`, `ai-receptionist`, `marketing`, `hq` (legacy founder surface), `owner`, `os`, `business`, `supabase`, …

### AI systems (truth over theater)

| System | Role | Status posture |
|--------|------|----------------|
| **Summer (strategic)** | AI Business Manager | Positioning locked; implementation not yet full OS depth |
| **Summer (marketing)** | Website concierge / Meet Summer | Grounded Knowledge Engine |
| **Summer (in-app)** | Strongest as booking / availability / CRM-grounded assist | Early Access |
| **Chase** | Read-only ops insights | Early Access |
| **Emma** | Legacy alias for Summer reception path | Dual path still exists (debt) |
| Additional AI roles (Alex, etc.) | Roadmap | Coming Next / Future Vision |

Canonical claim language: [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md). Summer Principle: [`docs/ai/SUMMER_PRINCIPLE.md`](./ai/SUMMER_PRINCIPLE.md).

### OS kernel (foundation)

Shared money recognition, commerce + platform events, business operating context, locale/datetime — see [`COMPANY_MEMORY.md`](../COMPANY_MEMORY.md) and [`docs/product/22_OS_KERNEL.md`](./product/22_OS_KERNEL.md).

---

## Current milestone

**Working name:** World Class Phase 4A **COMPLETE / MERGED TO MAIN** (PR #29). Current: World Class Phase 5 — Production Pin and Design-Partner Pilot Stabilization — **IN PROGRESS**. HQ booking, reschedule (PR #37), and cancellation confirmation + waitlist idempotency (PR #39) **PRODUCTION ACCEPTED**. Do **not** call Phase 5 complete. Commercial SaaS Lifecycle remains **PARTIAL**. Gate B **NOT MET**.

**Intent:**

1. Treat Chasum as an AI Business Operating System. Keep Core Operations, Commercial SaaS, Intelligence, and Validation in balance.
2. Use GVM and Chasum HQ as **normal tenants** to validate the reusable product — not as product forks or control planes.
3. Continue from **current `main` only**. Do not return to `cursor/world-class-portal-foundation` as a working baseline.
4. Sequence the locked post-Phase-5 product chapters from [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md). Phase 4A is complete. Commercial SaaS Lifecycle remains **PARTIAL** until Gate B is also met. Do **not** start Gate B, RBAC, Summer expansion, `/owner` expansion, or native apps in this stamp. Commercial v1 does **not** require full AI autonomy; preserve the AI-operated architecture now.

---

## Approved marketing pages (locks)

| Page | Version | Status | State | Visual source of truth |
|------|---------|--------|-------|------------------------|
| **Pricing** (`/pricing`) | Official Chasum Pricing Page **v1** | ✅ **APPROVED** | **Locked** | https://chasum-aw2cx9wbn-renovisionappcom.vercel.app/pricing |
| **Summer Onboarding** (`/meet-summer` guided) | Summer Onboarding **v1** | ✅ **APPROVED** | **Locked** | https://chasum-7o8esta4x-renovisionappcom.vercel.app/meet-summer |
| **Roadmap** (`/roadmap`) | Roadmap **v1** | ✅ **APPROVED** | **Locked** | https://chasum-rgp49w1xg-renovisionappcom.vercel.app/roadmap |
| **Resources** (`/status`) | Resources **v1** | ✅ **APPROVED** | **Locked** | https://chasum-2qwiq9hxp-renovisionappcom.vercel.app/status |
| **Why Private Alpha** (`/private-alpha`) | Why Private Alpha **v1** | ✅ **APPROVED · COMPLETE** | **Locked** | https://chasum-3lygrcwi7-renovisionappcom.vercel.app/private-alpha |
| **Security** (`/security`) | Security **v1** | ✅ **APPROVED · COMPLETE** | **Locked** | https://chasum-6vr9wmadu-renovisionappcom.vercel.app/security |

**Pricing is complete.** Design at the Pricing Preview URL is the approved baseline (implementation commit `83fbaed`). Do **not** revisit Pricing for redesign or visual polish unless the product owner explicitly requests it. Full lock rules: [`docs/marketing/PRICING_PAGE_V1_LOCK.md`](./marketing/PRICING_PAGE_V1_LOCK.md).

**Summer Onboarding is complete and locked** as the approved baseline for `/meet-summer` (category selection + consultation copy). Do **not** redesign or polish unless the product owner explicitly requests it. Full lock rules: [`docs/marketing/SUMMER_ONBOARDING_V1_LOCK.md`](./marketing/SUMMER_ONBOARDING_V1_LOCK.md).

**Roadmap is complete and locked** as Roadmap v1 — Available in Chasum Today / Coming Soon / Future Vision, Pricing-aligned. Do **not** redesign unless product changes require it. Full lock rules: [`docs/marketing/ROADMAP_V1_LOCK.md`](./marketing/ROADMAP_V1_LOCK.md).

**Resources is complete and locked** — Why Private Alpha, Security, and System Status. Full lock rules: [`docs/marketing/RESOURCES_V1_LOCK.md`](./marketing/RESOURCES_V1_LOCK.md), [`docs/marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md`](./marketing/WHY_PRIVATE_ALPHA_V1_LOCK.md), [`docs/marketing/SECURITY_V1_LOCK.md`](./marketing/SECURITY_V1_LOCK.md).

**Next marketing surface:** Home page (`/`) when directed — Pricing, Summer Onboarding, Roadmap, and Resources are locked.

---

## Last completed work

### Most recent (2026-09-16) — PR #39 cancellation confirmation + waitlist idempotency PRODUCTION ACCEPTED

PR #39 **MERGED / PRODUCTION ACCEPTED**. Accepted candidate `10b3d627c31438eca046263b67b1800f0a287311`. Accepted PR #39 runtime / Production release SHA `0f0c376cdc2a0d7e80da94859f37ec918acf16d6`. Production deployment `dpl_E4CgoSXtXuVNavH3xuphDAYDyBHA`. Booking Sheet Quick Actions → Cancel opens confirmation (`Keep appointment` / `Cancel appointment`); first click does not cancel; cancelled appointments hide Quick Actions Cancel. `waitlist_notify` enqueues only when `appointment.cancelled` actually occurred. Hosted Staging acceptance was **enqueue-only** (appointment `7987a27b-ee30-4a39-97e2-3c5ea2c16dcb`, 10:00–10:45 AM ET, left cancelled). Cancellation job delta 3 email + 1 webhook + 1 waitlist, all unprocessed. Production verification PASS, read-only. Cancellation confirmation P1 and repeated-cancel waitlist idempotency P1 **CLOSED**. Phase 5 **IN PROGRESS**. No migration, schema, config, or data migration. Changelog: [`docs/CHANGELOG.md`](./CHANGELOG.md).

### Historical (2026-09-16) — PR #37 Reception reschedule notifications PRODUCTION ACCEPTED

PR #37 **MERGED / PRODUCTION ACCEPTED**. Accepted PR #37 runtime / Production release SHA `f36a7aaf7d5b601c2fa2c914cb89d125cf18eab2`. Accepted candidate `dce6f9cd8ff8494ed0176c2977a25ede0135f44e`. Production deployment `dpl_3zx6E7Ck22xYNdHTxiJ6xBVk9U2M`. Reception Edit booking remains BookingSheet → `updateAppointment` → `updateBooking` → Booking Engine. Start **or** end customer-visible range change emits `appointment.rescheduled` with truthful `previousStartTime` / `previousEndTime` and audit `reschedule`; ordinary non-time edits remain `appointment.updated`. Existing communications orchestration reused. Hosted Staging acceptance was **enqueue-only** (appointment `72163056-6577-4e29-828a-2276ebd2975a`, 9:00–9:45 → 9:00–9:30 AM ET); three new email jobs were **not** proven Sent. Production verification PASS, read-only. Reception reschedule-notification P1 **CLOSED**. Phase 5 **IN PROGRESS**. No migration, config, or data migration. Changelog: [`docs/CHANGELOG.md`](./CHANGELOG.md).

### Historical (2026-09-16) — password recovery closeout (docs restamp)

Then-canonical main `4f7da8fbadf9ab882be07b0112bee0c53d74913c`. Staging Auth **PASS / CLOSED / FROZEN**. Production password-reset completion **P1 CLOSED** after href-only template change + one GVM acceptance test. Broader Production recovery remains **CLOSED**. Cross-session Auth gap and Production `/rest/v1/` env debt remain separate (TD-H10 / TD-H11). Documentation only at that restamp.

### Historical (2026-09-14) — PR #32 release accepted

PR #32 is **MERGED / ACCEPTED**. Canonical main and accepted Production Git SHA are `8df29d298c196a2431c86a8cea4af1e5bfec09fd`; accepted deployment is `dpl_3wENSHQrTUnu6VkaqjE7coJ4kjbn`. Canonical GitHub source of truth is **RESTORED** and Production release **ACCEPTED**. These are accepted 2026-09-14 release identities, not permanent architectural constants; future serving truth comes from the actual environment/current release record.

All three Production aliases aligned; protected git-main SSO behavior accepted. Recovery CLOSED; Phase 5 IN PROGRESS. GVM dual-email observation and HQ dogfood proceed in parallel. See [closeout](./recovery/PRODUCTION_RECOVERY_CLOSEOUT_20260914.md).

### Historical (2026-08-25) — World Class Phase 4A Commercial SaaS Lifecycle Honesty MERGED

- **PR #29** squash merge `f6517a17504667b58799a3202e43f5ec145643a1` — `feat: make Private Alpha SaaS billing truthful`
- Signup cannot grant paid `subscription_plan_key`; new tenants begin Free / starter; `preferred_plan` remains intent only
- Tenant mock billing lifecycle locked; plan-change UX is truthful Private Alpha request; canonical Free display
- Product Plan separate from Private Alpha access; `/owner` plan + Private Alpha visibility; bounded starter/professional assignment after `requirePlatformOwner`
- `subscription_events` audit; no Stripe/provider state; no `billing_invoices`; list-price metrics labeled as estimates
- Claude independent post-audit approved; Momentic booking canary passed
- Production and Staging tenant plans **not** mutated; no migrations
- Commercial SaaS remains **PARTIAL**; Gate A **COMPLETE**; Gate B **NOT MET**
- Non-blocking debt preserved: TD-M11 (plan update + event insert non-atomic); TD-L6 (unused `productPlanKeyForNewBusiness`)

### Immediately prior (2026-08-25) — World Class Phase 3 Command Centre MERGED

- **PR #27** squash merge `0c61a8d28f83e3347425d9a1bca41188b5f94ed1` — `feat: build World Class command centre`
- `/dashboard` is Command Centre V1 (Today, Attention, Money, Quick Actions, Summer)
- Authoritative money: `getCommerceDashboardSnapshot()`; **Gross payments collected today**
- Business-local Today; location-scoped appointments; business-wide money labeled honestly
- Grounded Summer facts only; setup path preserved
- Claude post-audit approved; Momentic booking canary passed
- Production not changed by Phase 3 development/validation

### Immediately prior (2026-08-25) — World Class Phase 2 Staff Plan Honesty MERGED

- **PR #25** squash merge `dd49b324a080b3ca41e003e6cacb747b32479d61` — `feat: enforce active staff plan limits`
- Server-side active-staff quota on create / reactivate / bulk activate / Add myself / `ensureOwnerAsBookableStaff`
- Canonical helpers: `lib/billing/plan-entitlements.ts`, `lib/billing/staff-quota.ts`
- Employees UI: `StaffQuotaNotice`, gated Add employee / Add myself, **Active in Chasum** distinct from Employment status
- 24 focused quota tests + 58 focused/regression tests passed; Preview acceptance and Momentic booking smoke passed
- Claude independent post-audit approved
- Production not changed by Phase 2

### Immediately prior (2026-08-24) — World Class Phase 1 Navigation Foundation MERGED

- **PR #23** squash merge `ef88ef57be040678d886d0a9b4d99c679d801128` — `feat: integrate World Class navigation foundation`
- Grouped desktop tenant navigation + mobile bottom navigation now on `main`
- Shared nav model: `lib/dashboard/nav.ts`
- Current-main tenant resolution preserved (`app/(dashboard)/layout.tsx` unchanged)
- `/owner` remains separate; `/dashboard/hq` current founder-only behavior preserved (label **HQ**)
- Entitlement helper modules added (`lib/billing/plan-entitlements.ts`, `lib/billing/staff-quota.ts`) **without** mutation enforcement
- Selective integration only — World Class branch was **not** merged wholesale
- Preview/Staging acceptance: desktop, mobile 390×844, route walk, Momentic smoke PASS; no booking/customer/payment/notification mutation
- Production not changed by Phase 1

### Immediately prior (2026-08-24) — source-of-truth realignment

PO-reviewed strategic audit against then-`main` `be2cf6e1fbbaeb606eab33b4e2eac799ff459338`. Documentation restamp only (PR #22, `06f0534`). No app, database, or Production change.

### Immediately prior (2026-08-24) — Momentic regression (merged to main)

- **PR #20** — safe Momentic baseline (`231045a` / merge `8275686`)
- **PR #21** — Chasum Test Studio booking smoke (`be2cf6e`)
- Synthetic Staging tenant **Chasum Test Studio**; Preview must use Staging

### Immediately prior (2026-08-24) — GVM identity incident CLOSED in Production

- Migration 039 APPLIED + VERIFIED on Production (`kxcydvhswkuzepwzzinq`)
- PR #18 alias-aware booking DEPLOYED + VERIFIED; last **documented** Production serving commit `68e9a816a230636e693d0e10b9b8ae7f3beb1e62` at `https://chasum.vercel.app`
- Gate 6 forward remediation executed; `post_forward_ok = true`; rollback unused
- Tenant B `a04e1d65-eeb9-4d72-a5bf-739a9038bb91` is the permanent operational GVM tenant at `/book/gvm-baby-world`
- Alias `gvm-baby-world-ultrasound` → Tenant B (308 verified)
- Tenant A `079288f2-4f6f-49ca-86aa-5190ae2c83ad` retired at `/book/gvm-baby-world-retired-079288f2` (`staff_only`, not publicly bookable), not deleted
- World Class Program is no longer blocked by this incident
- Follow-up debt (not this closeout): 037/038 files missing from repo history; Production-mutating scripts need stronger business-id/environment assertions; onboarding duplicate detection; optional Tenant A legacy contact cleanup

Historical detail: [`docs/architecture/BUSINESS_SLUG_ALIASES.md`](./architecture/BUSINESS_SLUG_ALIASES.md).

### Prior on main (selected)

- Generic public booking slug aliases (`7f0f1cb`) — reusable infrastructure, not a GVM fork
- Production billing compatibility patch (`ef69815`) — paid-upgrade guard + service-role `subscription_events` writes. **On `main`.** Track 3 DB hardening still not implemented. Historical recovery serving `dbbe450` includes this ancestry; see the September 14 closeout.
- PR #19 documentation closeout of the identity incident (`91ae760`)

### Historical marketing / GVM chapter (2026-07-30 and earlier)

Preserved for history — **not** current branch instructions:

- Production marketing deploy from then-branch `cursor/phase-3-integrations` @ `1d368a8`
- Locked marketing pages (Pricing, Summer Onboarding, Roadmap, Resources, Why Private Alpha, Security)
- Operation GVM Commerce Engine Finalization (migrations `030`/`031`)
- Premium Experience Sprints + OS Kernel foundation

---

## Repository workflow / reconciliation provenance

PR #32 used `codex/post-recovery-source-of-truth-reconciliation` from baseline main `476af17bfd06113281df0b5c33f995ccb26f5fff`. For subsequent approved work, branch from the then-current canonical main; do not treat the reconciliation branch as the standing product-development branch. PR #32 merged as `8df29d298c196a2431c86a8cea4af1e5bfec09fd`; the audited tree equality passed.

**Obsolete as current working branch (historical only):**

- `cursor/gvm-identity-incident-closeout-7453` — merged (PR #19)
- `cursor/phase-3-integrations` — do not stay here for new work
- `cursor/production-billing-compatibility-7453` — merged onto `main` (`ef69815`)
- `cursor/world-class-portal-foundation` — **reference-only**; remaining World Class work must be reimplemented or selectively ported onto current `main`. **Not a merge target.**
- `cursor/world-class-navigation-integration` — merged via PR #23
- `cursor/world-class-staff-plan-honesty` — merged via PR #25
- `cursor/world-class-command-centre` — merged via PR #27
- `cursor/world-class-phase-4a-saas-honesty` — merged via PR #29

**Deploy policy:** Accepted runtime and docs reconciliation only. Incidental ordinary Preview deployments from approved non-main pushes are permitted. No Production/Staging deployment or data change.

---

## Latest repository / deployment state

**Current GitHub source of truth:** repository `main` HEAD. Verify with `git rev-parse origin/main`. **main at this docs restamp base:** `0f0c376cdc2a0d7e80da94859f37ec918acf16d6`. After this docs PR merges, GitHub main will advance to a new documentation-only merge commit. Do not treat `0f0c376` as permanent main HEAD. Documentation-only restamps do not change accepted PR #39 runtime behavior.

**Accepted PR #39 runtime / Production release baseline:** `0f0c376cdc2a0d7e80da94859f37ec918acf16d6` on `https://chasum.vercel.app` (`dpl_E4CgoSXtXuVNavH3xuphDAYDyBHA`). Current serving identity must be verified from `/api/build-info` rather than inferred from an older milestone SHA.

**Docs restamp vehicle:** this docs-only PR / `docs/pr39-production-closeout`. Historical PR #37 runtime remains `f36a7aa` on `dpl_3zx6E7Ck22xYNdHTxiJ6xBVk9U2M`; historical docs restamp vehicle was PR #38 / `docs/pr37-production-closeout`.

Staging `https://staging.chasumai.com` remains isolated (`dpl_5kQZyE2PiHRunvfnPB3xUjPDUFW2` / `7b8abcf` was the accepted Staging Auth E2E pin).

PR #32 remains the **2026-09-14 recovery-closeout** identity: then-canonical SHA `8df29d298c196a2431c86a8cea4af1e5bfec09fd`, deployment `dpl_3wENSHQrTUnu6VkaqjE7coJ4kjbn`. Those are accepted historical pin facts, not a claim that GitHub main never moved. Future serving truth comes from the actual environment/current release record.

Prior recovery deployment `dpl_EFp5585EcR3rmgmJH9wZ5rhpspRc` / `dbbe450` is historical evidence. This documentation restamp authorizes **no** Production, Staging, Auth, Vercel, or database change.

## Worktree status

**Docs restamp vehicle:** this docs-only PR / `docs/pr39-production-closeout`. **main at this docs restamp base:** `0f0c376cdc2a0d7e80da94859f37ec918acf16d6`. Documentation only. Do not hard-code the future docs-PR merge SHA.

Uncommitted work is session-specific: inspect `git status`. PR #32 remains the historical 2026-09-14 reconciliation vehicle, not a permanent uncommitted task. `.momentic-mcp/` is local untracked tooling and must not be committed.

---

## Known issues / technical debt (keep visible)

Tracked in depth in [`docs/TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md). Snapshot — **do not solve in this restamp:**

- Migrations **034–036 UNAPPLIED**
- Migrations **037/038 APPLIED** on Staging and Production; **executable SQL missing from repo history**
- Remaining Track 3 / RLS hardening not implemented
- Dual communications stacks
- Dual Emma / Summer legacy path
- Dual Chase routes (`/dashboard/workforce/chase` and `/dashboard/ai-workforce/chase`)
- `create_public_appointment` vs Booking Engine write-path debt
- Booking resources migration `036` / feature flag pending
- Mock SaaS billing (`TD-C6`); paid self-serve Coming Soon
- `/owner` plan assign + `subscription_events` non-atomic (**TD-M11**, planned hardening)
- `productPlanKeyForNewBusiness()` unused in app code (**TD-L6**, P3 cleanup)
- Booking Sheet “collect payment” still partially stubbed
- `/dashboard/hq` legacy naming vs Chasum HQ tenant (disposition unresolved)
- **World Class Phase 1 follow-up (do not solve here):** Business location cap helper 6 vs catalog/fallback 10; dashboard React hydration #418; mobile visible label “Centre”
- **World Class Phase 2 follow-up (do not solve here):** staff quota TOCTOU race; raw DB-error passthrough; bulk Activate not proactively quota-disabled; directory “booking status” terminology; Add Myself empty-state-only
- **World Class Phase 3 follow-up (do not solve here):** pre-existing DashboardTopNav overflow ~768–1024px — IMPORTANT BUT POST-LAUNCH SAFE; launch risk GREEN
- Paid upgrades still route through Private Alpha `/apply`
- **TD-H9 CLOSED:** Production/Staging Reset Password href is the accepted token_hash callback pattern (2026-09-16). Do not reopen the completion P1 without contradictory evidence.
- **TD-H10 (do not solve here):** Account A / Account B cross-session recovery on current main — security/correct-account follow-up; not the closed P1; not a Phase 5 blocker.
- **TD-H11 (do not solve here):** Production `NEXT_PUBLIC_SUPABASE_URL` includes `/rest/v1/`; app normalization currently protects Auth; separate env cleanup.
- **P2 (do not solve here):** completed / no_show cancellation policy remains an unresolved lifecycle product-contract question. Do not silently change policy.
- **P2 (do not solve here):** calendar `resize.ts` end-time-only semantics remain separate and out of PR #37 / PR #39.
- **P2 (do not solve here):** completed / no_show audit action still uses generic update semantics.
- **P3 (do not solve here):** Week/Month retained cancelled blocks do not explicitly label “Cancelled”; appointment drawer may show disabled Cancel while Booking Sheet hides it; Communications bell cancellation row surfacing; Summer chip cancellation count/copy; existing Booking Sheet lint debt. Route naming truth: Reception lives at `/dashboard/calendar` and CRM at `/dashboard/clients` — do not create new routes from this restamp.
- **P3 (do not solve here):** Reception day-view timezone rendering; jump-to-date / range-heading mismatch; Staging health `production:true` / `cronSecret` missing observation; dedicated SMS `previousEndTime` test absent while HQ SMS is OFF.
- **Staging queue/worker health (do not solve here):** **40 pending/due** Staging jobs after the PR #39 hosted acceptance (historical debt plus PR #37 / earlier cancellation-validation artifacts plus PR #39 create 3 email + 1 created webhook and cancel 3 email + 1 cancelled webhook + 1 waitlist_notify). All new PR #39 jobs remained pending, `attempts=0`, unprocessed. Bounded operational follow-up. Not a PR #39 failure. Not a Production incident. Do not process or rewrite those rows from this restamp.
- **Staging Resend capability (do not solve here):** no dedicated Staging-only `RESEND_API_KEY` for independent provider-send acceptance. Important before Outside Private Alpha; not a blocker for continued internal GVM/HQ Phase 5 validation. No credential copy.

### Product / validation (not automatic NEXT)

- Commercial SaaS lifecycle incomplete (see Commercial SaaS section)
- GVM: first legitimate client appointment + dual-email operational validation still waiting (do not manufacture). HQ booking, reschedule, and cancellation lifecycle slices are now accepted.
- Public self-serve SaaS checkout not live — Private Alpha is intentional

### Marketing discipline

- Roadmap status labels (**Available Today / Early Access / Coming Next / Future Vision**) belong on Roadmap and truth matrix — **not** inside Pricing plan inclusions.
- Never market unsupported SLA, unfinished automation, or staff login as included.

---

## Current priorities

Locked post-release order (Phase 5 **IN PROGRESS**; Auth P1, Reception reschedule-notification P1, and PR #39 cancellation P1 closeouts do not insert a new first chapter):

1. GVM + Chasum HQ Phase 5 validation **in parallel**. HQ booking, reschedule, and cancellation lifecycle slices are now accepted. ChatGPT control tower / Product Owner will select the next bounded Phase 5 lifecycle slice after this source-of-truth restamp. GVM still waits for the next legitimate Production booking for exactly-once confirmation/business-notification evidence — observe passively; do not manufacture a GVM booking. Engineering must not wait idle for a GVM customer.
2. Outside Private Alpha readiness, including observability, switching/import capability and tenant onboarding/identity safety.
3. Commercial SaaS Gate B — explicit major post-Phase-5 priority; separately scoped and approved before implementation.
4. Summer Business Manager horizontal v1 — explicit major post-Phase-5 priority; separately scoped and approved before implementation.

Highest-leverage state-ambiguity prevention (manifest, regression suite, Staging→main disposition, observability, CI/CD reconciliation) is introduced in **bounded slices alongside Phase 5** and completed to the required level **before Outside Private Alpha**. It is **not** a Phase 5 blocker.

Core Operations launch-required defect work continues throughout. GVM and HQ are validation tenants, not product forks; neither may dominate the roadmap.

---

## Development roadmap

Roadmap outcomes must stay balanced:

| Outcome | Meaning |
|---------|---------|
| **A. Core Operations** | Scheduling, customers, staff, catalog, money, communications, reporting, workflows |
| **B. Commercial SaaS** | Signup, provisioning, onboarding, plans, entitlements, subscriptions, billing, lifecycle, permissions, support/recovery |
| **C. Intelligence** | Summer as AI Business Manager, Chase, AI Workforce — grounded in authoritative Chasum data |
| **D. Validation** | GVM, Chasum HQ tenant, future design partners, Preview/Staging regression (Momentic), human workflow trust |

### Completed (company view)

See [`docs/company/MASTER_ROADMAP.md`](./company/MASTER_ROADMAP.md). Highlights: Auth, Owner Platform, Billing UI, Communication Center, Employees, CRM, Calendar & Booking Engine, Business Management, Reports, AI Receptionist Phase 1, OS Kernel, Phase 3 Integrations, world-class marketing chapter, GVM identity closeout, Momentic baseline + smoke, **World Class Phase 1 navigation foundation**, **World Class Phase 2 staff plan honesty**, **World Class Phase 3 Command Centre V1**, **World Class Phase 4A Commercial SaaS Lifecycle Honesty (Gate A)**.

Surfaces listed as “completed” on the Master Roadmap mean the department exists — not that Commercial SaaS / RBAC / Stripe are launch-complete. Maturity lives in [`docs/LAUNCH_READINESS.md`](./LAUNCH_READINESS.md).

### Near-term (do not treat as “GVM only”)

| Theme | Outcome |
|-------|---------|
| World Class Phase 1 | Grouped tenant nav + mobile nav **on main** (PR #23) |
| World Class Phase 2 | Staff plan honesty **on main** (PR #25) |
| World Class Phase 3 | Command Centre / Today experience **on main** (PR #27) |
| World Class Phase 4A | Commercial SaaS Lifecycle Honesty **on main** (PR #29). Gate A **COMPLETE**. Workstream 4 stays **PARTIAL**. |
| Commercial SaaS | Trailing; remains **PARTIAL**. **Gate B** = explicit commercial-v1 paid-provider chapter after Outside Private Alpha readiness. |
| Current phase | **Phase 5** Production Pin and Design-Partner Pilot Stabilization — **IN PROGRESS** |
| GVM / HQ validation | Inside Phase 5 — Late Sep–Oct 2026 stable pilot use |
| Summer Intelligence | Summer Business Manager horizontal v1 — explicit chapter after Gate B; no implementation in this restamp |
| Core Operations craft | Reception/commerce/comms reliability as targeted defects inside Phase 5, not a rewrite |
| Track 3 | RLS/hardening when PO schedules; restore 037/038 SQL into repo |

Plans: [`docs/30_DAY_PRIVATE_ALPHA_PLAN.md`](./30_DAY_PRIVATE_ALPHA_PLAN.md), [`docs/90_DAY_EXECUTION_PLAN.md`](./90_DAY_EXECUTION_PLAN.md) — treat dates/items as historical planning unless restamped.

### Medium / future themes

From Master Roadmap — exact sprint order in [`docs/company/MASTER_TASKS.md`](./company/MASTER_TASKS.md):

- **AI Workforce** — Alex and later roles; Command Center as real coordination; voice later  
- **Inventory & Products**  
- **Marketing Automation**  
- **Square** (in-person payments)  
- **Native mobile** — workstream 18: **DESIGN NOW / PRE-LAUNCH BUILD AFTER CORE STABILITY**; working direction React Native + Expo; final stack at native-app preflight; one reusable multi-tenant app
- **Marketplace**  
- **Enterprise** (org hierarchy, SSO, SLA-oriented controls)  
- **Version 2** — intentional UX/architecture leap only after V1 departments are hardened  

Do **not** start Inventory, Marketplace, native mobile **implementation**, or V2 redesign in this chapter. Native remains planned (workstream 18) for after the Native App Start Gate and **before broader public launch**.
Do **not** redesign or polish `/pricing`, `/meet-summer`, `/roadmap`, `/private-alpha`, `/security`, or `/status` unless the product owner explicitly requests it.

---

## Milestone update checklist

When a milestone completes, update this file:

- [ ] **Last updated** date  
- [ ] **Last completed work** (what + commit SHAs)  
- [ ] **Active branch** / sync status  
- [ ] **Latest commit** (`main` vs Production SHA called out separately)
- [ ] **Uncommitted work** (`git status`)
- [ ] **Control board** LOCKED / ACTIVE / BLOCKED / NEXT
- [ ] **Known issues** / **Priorities** if the chapter shifted  
- [ ] Cross-link `docs/CHANGELOG.md` entry when product behavior shipped  
- [ ] Commit this file with the milestone (or immediately after)

---

*This file is the handoff bridge. Deep truth lives in the linked docs; this page must stay short enough that a new session can re-orient in under five minutes.*
