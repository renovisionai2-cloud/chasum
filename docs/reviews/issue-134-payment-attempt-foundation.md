# Issue #134 — prepared payment-attempt foundation

**Status: PREPARED ONLY / NOT APPLIED.** Author: Codex, sole implementer. Date: 2026-10-04. Working candidate remains on the existing `codex/issue-151-phase-a-financial-safety` branch; no branch switch, commit, push or PR publication. This document describes a candidate, not an application/release approval.

## Authority, source and scope

The [Product Owner authorization](https://github.com/renovisionai2-cloud/chasum/issues/134#issuecomment-5983295092) allows design, additive migration authoring and offline contracts only. Issue #134 body and all ten current comment records were retrieved; the current authorization and supplied Level-3 conclusions supersede earlier preflight-only scope. The earlier consolidated investigation is background, not an instruction to rerun live checks.

Entry verification: local HEAD `0cb3af52320c8863aa326afd8d1d61190ffa4210`; local `origin/main` and fresh GitHub connector `main` both `31115e6a51b71fc097c279d205065d80e0be3573`. Both tracked trees were exactly `e9f617c0d0830c29fc2493dd55be4d403b04147f`; `git status --porcelain=v1` was empty before editing. Shell remote lookup failed DNS; the independent GitHub commit read succeeded. No reset/checkout/switch was performed.

**Phase A / PR #154 and #135: MERGED TO MAIN / NOT PRODUCTION ACCEPTED.** #131 remains canonical Production under the supplied governed evidence; no new runtime probe is claimed. #133/#134 remain active. #152 owns the six historical GVM USD-coded rows; #153 owns broad ACL/FORCE-RLS hardening. M1C/M2/Time Blocker remain held. **GVM OPERATIONAL ACCEPTANCE is NOT earned.**

Competitive Product Gate **NOT_APPLICABLE** for this bounded internal financial-integrity foundation: behavior/invariants are already locked by Control Tower and Level-3 preflight; no customer/operator workflow is being implemented. No new product strategy or market comparison is needed for schema authoring. Future material workflow acceptance retains the product gate.

Read inputs include AGENTS, Current Project State, Latest Handoff, Environment Manifest, Chasum Bible, Product Principles, and the financial-truth launch gate in `docs/LAUNCH_READINESS.md` section 7. Relevant exact source: migrations `001`, `020`, `028`, `030`, `031`, recent timestamped migrations, `lib/commerce/payments.ts`, `lib/actions/appointments.ts`, and existing migration/payment contracts. Phase A tenant predicates/affected-row proof, webhook CAS, recorded-but-sync-failed results, fail-closed booking currency, non-financial receipt/email failures and Option A uncertainty all remain untouched.

Supplied Control Tower preflight is sufficient input here: Production 13 transactions (11 succeeded / 2 partially refunded), no detected cache divergence across seven appointments, duplicate groups, over-refunds or stale requires_action; GVM ledger/mirror counts 11/11; six USD-coded rows belong to #152. Staging was similarly clean in bounded checks. Existing RLS is enabled, FORCE false, with broad ACLs under #153. These are supplied observations, not fresh schema verification or permission to connect.

## Minimum schema decision

Migration: `supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql`. The inspected latest prior file is `20260924150219_issue_73_package_c3_commit_cutover.sql`. The new UTC timestamp follows the current convention; no historical file is renumbered or modified. No Supabase CLI command was used. Exact prepared migration SHA-256: `bca0bd8929c2d48c2840ce55dcd98e42990d858a11361f75cc21e86695abc971`; Git blob (computed without writing an object): `6f8e8318f5bd7bd51e2bb801a2158e5bbb2e999b`.

| Object | Minimum purpose and contents |
| --- | --- |
| `commerce_payment_attempts` | UUID PK; Business + opaque UUID attempt key; required versioned fingerprint; bounded original source; customer; nullable appointment/booking operation/actor; kind, integer minor-unit amount, explicit currency/method/provider route; nullable gift-card UUID; execution state, recovery disposition, bounded failure class/code; created/updated/resolved timestamps. |
| `commerce_transactions.payment_attempt_id` | Nullable UUID with unique constraint and composite same-Business FK. This is the sole durable transaction linkage; transaction ID is recovered by this unique key. Existing rows remain NULL. |
| `commerce_payment_attempt_events` | UUID event ID; Business + attempt FK; bounded event type; required money observation; optional paired projection kind/state; bounded failure class/code; occurrence time. No mutable payload. |
| `commerce_payment_reconciliation` | Business + attempt linked to the ledger; PK `(attempt_id, projection_kind)`; one of four projection kinds; pending/complete/failed/not-required, bounded failure code and timestamps. |

Use text CHECK constraints rather than PostgreSQL enum types: small allowlists remain reviewable and future extension avoids shared enum lifecycle changes. UUID attempt keys exclude free-text/PII keys and are distinct from the attempt row UUID. Amount uses the existing ledger's positive integer range; `none` has exactly zero with NULL method/route. Currency is required lowercase three-letter text, **no default**; runtime must additionally validate the supported Business currency and minor-unit semantics. Currency syntax does not activate every currency or region.

`actor_id` is an immutable opaque authenticated-user identifier when available, not assigned appointment staff. No Auth FK: account deletion must not erase or null financial attribution; server authorization must verify the actor at admission. UUIDs remain confidential tenant identifiers, not anonymous data. Gift-card method requires its tenant-bound internal UUID; raw redeemable code is never stored. Store credit is identified by customer + Business; no second credit-account identity exists in the current schema.

Excluded deliberately: redundant `attempt.transaction_id`, duplicated current ledger/money status, duplicated aggregate sync state, notes/description/raw errors/JSON, UI session ID, provider secrets/payment-intent copy, generic task payloads, worker leases/backoff, arbitrary provider routing, refund/void/adjustment attempts and communication jobs. Existing ledger provider references remain the output identity. Provider admission/recovery must use a stable provider idempotency identity before any future provider call; this migration does not enable provider execution. The first runtime scope must separately gate stored-value balance movement as well as money recording.

No `requested_invoice_id` in v1: this fingerprint identifies a payment for an appointment/booking operation/customer. A direct invoice-selection intent is **unsupported by v1 admission**, not silently omitted from its hash. Supporting that existing optional API selector later requires a reviewed fingerprint/schema extension with a same-Business invoice FK. The writer must validate any derived invoice binding (including same Business/customer/appointment) and preserve Phase A's unverifiable-existing-invoice behavior; this foundation does not decide invoice issuance policy.

## State and recovery contract

The three concepts remain separate. Current execution is stored on the attempt; current money is derived from the linked canonical ledger; per-projection synchronization is stored in obligations. Event `money_state` is a historical observation, never a replacement ledger.

| Dimension | Contract |
| --- | --- |
| Execution | `REQUESTED` is durably admitted normalized intent before effects; `ACCEPTED` authorizes execution after server validation; `FAILED` records an execution/admission failure without claiming no money; `SKIPPED` records explicit valid `none` intent. Successful acceptance stays ACCEPTED; ledger/obligations express its outcome. |
| Money | Linked `succeeded`, `partially_refunded`, `refunded` means RECORDED (original effect exists; refunded status is not fresh spend). Linked `pending` / `requires_action` means PENDING / REQUIRES_ACTION, never collected money. Failed/canceled ledger outcomes require definitive provider evidence in the future writer before NOT_RECORDED. |
| Missing or conflicting proof | No ledger after an ACCEPTED execution, unavailable/untruncated-unproven lookup, unresolved failure, or conflicting state means UNKNOWN / recover. A valid REQUESTED before execution or SKIPPED can mean NOT_RECORDED only under the future admission transaction contract. No inference from amount/time/description. |
| Recovery | Default `RECOVER` is conservative. `DO_NOT_RETRY` prohibits new collection. `NEW_ATTEMPT_ALLOWED` is valid only for FAILED and requires positive definitive-no-effect proof in the canonical writer. It cannot override a present ledger effect or an unresolved provider result. |
| Resolution | `resolved_at` is outcome-resolution time, not proof all projections or communication finished. Timestamps are written with the future transition; they do not arbitrate dedupe or order financial authority. |

The foundation constrains shapes/identities, not every transition. It intentionally contains no admission RPC, transition engine or automatic event producer. A service-role caller can still set advisory fields inconsistently; the future canonical reader must prefer ledger truth and return UNKNOWN on disagreement. Do not expose these tables directly to clients or translate FAILED into “NOT RECORDED / try again.” N-2: omitted completeness proof must never imply certainty. Absence of a ledger row is not proof a provider did nothing.

Later runtime sequence (design only):

1. Authorize actor/Business and validate normalized input. In one short DB transaction admit `(business_id, attempt_key)` with fingerprint and REQUESTED event. Resolve a concurrent key collision by reading the original row; compare fingerprint **before returning or acting**. Preserve identity across response loss/restart.
2. Lock original attempt and accept once with ACCEPTED evidence before effects. For create booking, bind an exact durable booking operation to the created appointment. `booking_operation_id` is immutable, indexed but not unique: one booking may have legitimate later attempts. It is not a booking dedupe table or proven creation-recovery implementation.
3. No external network call inside a DB transaction. Provider idempotency/admission/recovery is a separately reviewed runtime step. Unknown provider response stays UNKNOWN under the same attempt identity.
4. In a short transaction, create the linked ledger row, persist outcome event and all four projection obligations together. Conflicting ledger INSERT rolls back; never insert an unlinked row and attach it later. Pending/provider-action rows reserve the same ledger identity; finalization later transitions it and creates obligations atomically.
5. Reconcile projections from the authoritative ledger, not read/add/write deltas. Lock affected appointment/invoice/customer projection targets in a deterministic order across different attempts. Persist projection completion and event in the same transaction as each financial projection. A worker crash before commit retries the same obligation; a crash after commit recovers its result.
6. Lost response/reload reads the tenant-authorized original attempt/ledger/obligations. Same key + same fingerprint replays/reconciles the original result. Same key + changed fingerprint is an explicit conflict; no silent update/cached wrong result. Definitive corrected intent or a legitimate second equal-value payment uses a new logical key after the no-effect/complete-result boundary. #135's session key is not reused as the durable attempt key.

## Fingerprint v1

Runtime hashing is **not implemented**. The migration stores `v1:` plus 64 lowercase hex SHA-256 characters and freezes that value and its stored request inputs. It cannot prove the caller hashed correctly. The future server, never the browser alone, must compute/verify this canonical tuple in this exact order:

`["chasum.payment-attempt", 1, business_id, customer_id, target_kind, target_id, amount_cents, currency, method, payment_kind, provider_route, gift_card_id]`

Canonical bytes: UTF-8 JSON array; no whitespace/BOM; canonical lowercase hyphenated UUID strings; base-10 integer amount with no leading zeros/decimal/exponent; lowercase trimmed supported currency; exact bounded method/kind/route strings; absent nullable elements use JSON `null`, never empty strings or omitted positions. Hash these bytes, prefix `v1:`. Future runtime must publish fixed cross-language test vectors before activation.

Target discriminator: `appointment` + original appointment UUID for an existing appointment; `booking_operation` + durable booking-operation UUID for creation; `customer` + NULL target ID for customer-level money (customer already included). Resolve/replay a booking operation using the same discriminator after the appointment is bound; generated appointment identity does not change the original request hash. If booking_operation_id is supplied, that mode takes precedence and the server must reject unrelated appointment bindings.

Source/surface and actor are original attribution, excluded from the financial fingerprint so authorized recovery across surfaces/actors is possible. Exclude notes, description, names/contact details, timestamps, UI session, receipt/email selection and provider-generated output identity. Internal gift-card UUID is included only for gift-card redemption; store credit uses the customer identity. The provider route IS intent: a manual card record and an external card charge must conflict under the same attempt key. No free-form route/account orchestration is introduced; future connected-account routing must extend the intent contract if relevant.

## Database guarantees and tenant integrity

- `UNIQUE(business_id, attempt_key)` admits at most one row per tenant/key. Fingerprint is required and immutable. Equal amounts under different keys remain valid; there is no amount/time/session/description unique index.
- A single nullable ledger `payment_attempt_id` is globally UNIQUE, hence one attempt links at most one ledger row and a ledger row names at most one attempt. NULLs preserve all historical transactions. A guard rejects every link update, including NULL-to-UUID, freezing attribution and prohibiting backfill. Linked transaction UUID and original request tuple cannot change; linked row deletion is rejected.
- Existing customers, appointments and gift_cards receive only additive `(id,business_id)` unique keys. New composite FKs enforce same-Business customer/appointment/instrument. They prevent later tenant reparenting/deletion of referenced parents. No existing ACL/RLS policy is relaxed.
- Ledger FK enforces attempt Business; the guarded tuple also enforces matching customer, appointment, amount, currency, method, kind and provider route. Only ACCEPTED requests may insert linked rows; unresolved booking-operation attempts cannot insert before appointment binding.
- Appointment can bind NULL-to-UUID once only when a durable booking operation exists; otherwise it is immutable. Same-Business FK is mechanical; proof that the appointment belongs to that exact booking operation/customer is still the future server writer's responsibility. This is not a new appointment-customer-wide constraint or booking-operation registry.
- Events have same-Business attempt FKs. Obligations have same-Business FK directly to the ledger's unique `(payment_attempt_id,business_id)` pair, so no obligation can point at another tenant or an unlinked transaction.
- The attempt row remains durable even after resolution. New-table DELETE/TRUNCATE is not granted to service_role; request/history guards block normal row mutation. Ledger TRUNCATE without CASCADE is blocked by the reconciliation FK, even if empty; CASCADE also requires revoked new-table TRUNCATE privileges. This consequence is mechanically necessary for the foundation, not general #153 hardening.

**Scope of the invariant:** uniqueness protects rows opting into this linkage. Existing unlinked writers and old broad ledger grants remain operational until governed runtime cutover/#153. It does not prohibit an old writer from inserting another unlinked payment. This candidate therefore does **not** claim deployed at-most-once payment behavior, end-to-end exactly-once charging, or safe retry in the current UI. Superuser/DDL owners can disable guards; this is not tamper-proof accounting storage.

## #133 events and reconciliation

Include bounded events **now**, in the shared foundation. Current-state columns alone lose prior requested/accepted/failed/skipped and recovery/sync history. No separate generic audit platform is introduced. Event IDs identify evidence occurrences, not payment attempts; future writers should reuse an event ID for a retried evidence append. Occurrence time/UUID ordering is only display ordering, not a total causal ordering or financial authority. Transaction identity is obtained through the immutable ledger link; event money_state preserves the historical observation without a second mutable transaction pointer.

Events support valid normalized payment intentions, explicit valid `none`/SKIPPED and admitted failures. They do **not** yet capture requests that fail before Business/customer/currency/amount can be safely normalized. Later #133 must provide bounded pre-admission rejection/transport observability without raw FormData, invented currency/customer or fake payment attempts. Disclosures, Summer tools, Reporting re-source and all event-producing runtime work are deferred.

Include durable obligations **now**: otherwise the next writer could commit money and crash before recording what remains to synchronize. The four bounded kinds are appointment cache, invoice settlement, customer_payment_events mirror, and receipt generation. No generic workflow engine, leases, automatic retries or workers are added. Future worker claiming/scheduling is separately implemented against these durable rows.

All four rows must be created atomically for qualifying committed money, including explicit NOT_REQUIRED when a projection has no applicable target. **Missing obligations mean UNKNOWN**, never complete/not required. There is no aggregate `sync_status` default that can silently certify missing work. The future reader must prove exactly four applicable decisions and validate current ledger/target truth. Existing historical transactions with NULL attempt linkage are outside this guarantee; no completeness/lifetime backfill is inferred.

Financial synchronization aggregates appointment cache, invoice settlement and CRM mirror only. **Receipt failure never changes recorded money or financial synchronization**; it is separate document status. Communications remain their own send-intent system and are not an obligation kind here. Do not execute email/SMS/provider calls inside a financial transaction. Receipt uniqueness, number allocation, safe issuance and delivery retry still need their later runtime/constraint review.

## RLS, grants and read boundaries

RLS is enabled on all three new public tables, with no public/anon/authenticated policies or grants. Explicit REVOKE clears inherited defaults; service_role receives SELECT/INSERT and only necessary mutable-column UPDATE on attempts/obligations. Events are SELECT/INSERT only plus append-only guard. No DELETE/TRUNCATE or delegation privileges. There is no owner/staff UI need yet, so do not add speculative direct financial reads; future server paths authorize tenant/actor and filter Business. Summer consumes that same authorized read contract.

All three new functions are SECURITY INVOKER trigger guards with fixed `search_path = pg_catalog, pg_temp`, schema-qualified relations and narrow EXECUTE grants to service_role only. They contain no row writes or RPC payment operation. Trigger invocation is separate from direct function EXECUTE permission. The existing ledger's broad authenticated grants cover new columns too; its guard expressly rejects any non-service_role operation on linked rows. NULL-linked legacy actions return before attempt access, retaining Phase A behavior. The future atomic writer must preserve the service_role invoker context; an ordinary postgres-owned SECURITY DEFINER writer would fail this guard and must not be used as a bypass. Direct postgres maintenance of linked rows is intentionally rejected by this role check; any future maintenance exception needs review.

No FORCE RLS, existing-table GRANT/REVOKE, helper replacement, legacy policy rewrite or #153 general cleanup. Service role bypasses RLS and therefore still requires explicit server authorization; a privileged key is not tenant authorization. Current official references checked: [Supabase RLS/grants](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html). The [Supabase changelog](https://supabase.com/changelog) was checked; the recent minor-release breaking-change notice concerns features not introduced here. No platform upgrade performed.

## Compatibility, application gate and rollback

Only DDL and pure guards. No historical INSERT/UPDATE/DELETE, inferred attempts, USD repair, schema-default currency, existing required column or data rewrite. Ledger linkage is nullable without a default. Existing indexes/migrations remain unchanged; redundant tenant-key indexes and nullable-link indexes do scan/build, so this is not a zero-lock migration. Unique tenant keys cannot introduce duplicate-pair failures where existing UUID PKs hold. Exact deployed constraint names/privileges/schema compatibility still need authorized pre-application verification; supplied row counts do not prove that compatibility.

For a future application, execute this exact reviewed file atomically with the repository's authorized transaction-capable runner. `SET LOCAL` lock/statement timeouts bound blocking (5s/30s). Regular unique constraints require locks on existing tables; timeout aborts instead of waiting indefinitely. Empty new FK tables need no historical relationship backfill, and NULL ledger links skip FK matching. Do not silently replace failed statements with IF EXISTS/NOT VALID or use a non-atomic runner. Check actual Staging sizes, lock budget and migration ledger at that later gate; no such connection is made here.

Prepared-only rollback: discard/revise the uncommitted new candidate files and the bounded documentation edits after review; never touch runtime/history to make them fit. No SQL rollback is needed because nothing was applied.

Hypothetical failed later Staging application: an atomic error/timeout rolls the entire DDL transaction back; independently verify schema/migration ledger afterward under that gate. If a runner committed partial DDL or any linked data exists, stop and preserve evidence; do not replay blindly or drop financial rows. Before runtime adoption, an approved reverse migration could remove only verified-empty new child objects, guards, nullable link and newly introduced indexes/keys in dependency order. After any adoption, prefer a reviewed forward correction and disable new admissions while preserving recovery/ledger evidence. No destructive Production rollback automation is authored.

New RESTRICT references intentionally prevent routine deletion/reparenting of referenced financial subjects. There is no purge/cascade/retention scheduler. Product Owner retention/anonymization policy must be decided before destructive deletion or runtime retention promises, not guessed in this foundation.

## Validation and evidence

Offline contracts: `tests/unit/migrations/issue134-payment-attempt-foundation.test.ts`. They cover required fingerprint/key, currency without default, nullable unique ledger link, immutable identifiers, no amount dedupe, same-Business FKs, state separation, bounded events/obligations, RLS/grants/fixed invoker path, no data/backfill/apply commands and prepared scope preservation. The scope assertion intentionally locks this prepared candidate to the authorized baseline and must be explicitly retired/re-scoped when later runtime work is authorized.

Executed validation:

| Check | Result |
| --- | --- |
| New foundation static contracts | **12/12 PASS**. |
| New + existing migration/DB-source contracts | **7 files / 62 tests PASS**, zero failures/skips. Includes all migration contracts and booking RLS/public-RPC/financial-integrity contracts. |
| Existing payment/booking regressions | **5 files / 89 tests PASS**, zero failures/skips: Phase A payment safety, appointment payment outcome, Booking Sheet submit guard, payment/receipt retry, commerce recorded-outcome. |
| Typecheck | `npm run typecheck -- --incremental false` **PASS**. |
| New TypeScript lint | `npx --no-install eslint tests/unit/migrations/issue134-payment-attempt-foundation.test.ts` **PASS**, no diagnostics. |
| Diff/scope | `git diff --check` **PASS**; exactly six allowed candidate files; runtime/config/old migrations/Environment Manifest unchanged. |
| Full SQL parser / PostgreSQL execution | **NOT RUN**. No standalone SQL parser was found in the inspected repository dependencies or Python modules; available repository SQL checks are static Vitest contracts. No migration may be applied even to a disposable DB in this task. |
| Build/full application suite/browser/live workflow | **NOT RUN**: zero application changes; focused offline regressions/typecheck used. No runtime acceptance claimed. |

The Node test runner emitted its existing experimental localStorage warning; Git/Python emitted sandbox temporary-directory warnings. All listed checks exited successfully. Static SQL inspection is not PostgreSQL execution proof; the repository's disposable-Postgres scripts execute migrations and are deliberately NOT RUN. `scripts/verify-commerce-engine.mjs` creates/deletes a ledger row and is deliberately NOT RUN. There is no approved live or disposable migration application in this task.

Weak-dedupe preservation: `lib/actions/appointments.ts` remains byte-identical to main (SHA-256 `30b4de20b6a4b95706e971dabcfaa71965c087d5a1d8ffbceea8159a1d82d6ca`). Its exact 435-byte lookup/session-key block retains SHA-256 `7ef95c88162e09eff801a036e60013e43521bd2a1ed596dfda5b579ec243396e`. Booking Sheet and current Phase A runtime files are unchanged. Environment Manifest remains byte-identical (SHA-256 `b80a46f96ec07ce185bdf08dc08e12fac8f01f5e6b875521c060a5b7dd11ff7f`).

Negative execution evidence: tools used for source/GitHub/docs reads, local file authoring and offline tests only. No Supabase/database connector, SQL execution, DB connection, migration apply/push/reset/link, test fixture creation, build deployment, provider request, commit, push or PR creation. Reading a migration and checking its text is not executing it. No current deployed migration-ledger claim is manufactured; NOT APPLIED describes this session's zero-application activity. Environment Manifest is deliberately unchanged.

## Review and next gate

Two engineering read-only reviews are COMPLETED; source feedback on NULL checks and transaction identity was reconciled, and final SQL/design/test/continuity consistency review found no actionable findings. This is not Claude and is not independent Level-3 acceptance. Claude audit is **PLANNED / NOT DISPATCHED**; there is no positive execution evidence and no request to contact Claude in this task. Control Tower must manually dispatch: “Claude, independently audit the exact uncommitted Issue #134 prepared-only foundation migration, contract tests and design against main 31115e6a…; challenge keys, NULLs, concurrency, same-Business integrity, grants, state truth, recovery and compatibility. Do not apply or publish. Return Level-3 findings and verdict.” Review is the next gate, not a blocker to preparing this authorized candidate.

Remaining runtime gates: fingerprint test vectors and server admission/replay/conflict; booking-operation durability; atomic linked writer/outcome/obligation commits; provider idempotency/recovery; stored-value debit integrity; deterministic projection locking; receipts; #133 pre-admission/event/disclosure coverage; Reporting/Summer ledger reads; old-writer cutover and #153 ACL handling; approved disposable/Staging SQL/RLS/concurrency/crash/fault tests. Test matrix must include equal second amount, changed fingerprint, parallel same key, key recovery after restart, lost provider/ledger response, cross-tenant insert/reparent, pending/requires_action, binding races, every projection failure, and incomplete evidence. No normal GVM workflow acceptance follows from this candidate.

Genuine Product Owner decisions remain: authorization to apply the audited exact migration to the selected environment; later runtime scope/activation; approved Staging fixtures/fault injection; retention/anonymization and invoice issuance if behavior changes; exact Production release and GVM Operational Acceptance. No new Product Owner product decision is needed to review this prepared candidate. No commit/push/PR is authorized.

Recommendation: **READY FOR CONTROL TOWER REVIEW / CLAUDE LEVEL-3 AUDIT**, with the offline checks above passing; **not ready or authorized for migration application/runtime activation/Production release**.
