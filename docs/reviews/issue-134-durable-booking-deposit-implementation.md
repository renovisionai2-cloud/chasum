# Issue #134 / #158 durable booking-operation implementation

Date: 2026-10-07
Status: PREPARED ONLY / UNWIRED / DEFAULT-OFF / NOT APPLIED
Product Owner authorization: Issue #158 exact prepared-only implementation under the reviewed #134 contract

## Candidate identity

- Branch: `codex/issue-158-durable-booking-operation`
- Authorized starting commit / parent: `afafc855634dc8d53b2a3cdf554ce1060c96a1b2`
- Remote-main observation at reconciliation: `31115e6a51b71fc097c279d205065d80e0be3573`
- Exact reviewed contract SHA-256: `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d`
- Exact implementation candidate commit: `5f9af16422310428852d343f65f140591d2dac86`
- Exact implementation candidate tree: `7b90c1a989a0ab159119c6bbabb830055d61c660`
- Candidate parent: `afafc855634dc8d53b2a3cdf554ce1060c96a1b2`

The candidate commit contains the 15 code, migration, test, proof, and changelog paths. This report is the 16th approved path and is committed afterward so it can record a real immutable candidate commit/tree; a Git object cannot embed its own hash.

## First disposable-local database proof — run once, failed

**DATABASE PROOF: RUN ONCE, FAILED**

**SECOND DATABASE PROOF: NOT RUN**

The first Product-Owner-authorized disposable-local run used corrected candidate `b1f54b81b740a088b331f5ddbfd33a0c54c2dd09` / tree `ff4384f591a6d18982f7321cbb1923786629e277` on PostgreSQL `17.11 (Homebrew)`. Retained evidence is timestamped `2026-10-07T20:20:04–05-0400` and remains outside the repository in the system temporary evidence directory identified as `chasum-issue134-durable-evidence-8QXkp7`. No credentials or machine-sensitive evidence contents are copied into this report.

The run stopped in the SQL contract's golden-path `persist_booking_operation_appointment_v1` call with PostgreSQL status 3:

> `null value in column "id" of relation "appointments" violates not-null constraint`

The failing row had a null appointment ID because the accepted synthetic foundation fixture declares `appointments.id uuid primary key` without the UUID default used by the production schema and existing application appointment inserts. This is classified as a synthetic proof-fixture mismatch, not currently a product migration defect. The Issue #158 migration was not changed. The allowlisted contract fixture now models the production convention locally with:

```sql
alter table public.appointments
  alter column id set default gen_random_uuid();
```

Corrected proof-source SHA-256: `d32455b8ec6f6de154e89468ff606c59417bdaa47e2f7ccb9c4e4ed5335aa7aa`.

Before the stop, the run genuinely passed the 23-delta schema inventory, protected pre-existing fixture digests, the TypeScript/PostgreSQL nested-resource fingerprint vector, and changed-tuple `KEY_CONFLICT` determinism/idempotency. The repaired `issue134_fingerprint` helper executed successfully through admission. These assertions remain intact.

The proof stopped before runtime execution of history cursor order/`next_cursor`/sub-millisecond boundaries, cross-/foreign-tenant denial, two equal-value attempt keys, lost-response recovery at all four committed boundaries, known rollback versus `UNKNOWN`, and NULL-staff same-operation concurrency. Those deeper Section 14 vectors remain runtime-unproven; database proof has not passed.

Post-fixture-correction offline validation passed: focused Issue #158 suites (5 files / 47 tests), scoped booking/booking-engine/commerce/migration/notification suites (75 files / 695 tests), `npm run typecheck`, verifier `node --check`, verifier help/no-argument/wrong-argument/extra-argument gates (`0/2/2/2`), `git diff --check`, exact two-path allowlist verification, and protected source/migration hash verification. Changed-path ESLint is not applicable because this correction changes no TypeScript or JavaScript path. PostgreSQL and the verifier confirmation path were not run during the correction.

Failure cleanup behaved as designed: the verifier confirmed shutdown, removed owned PGDATA through its dual-marker safety fence, and retained failure evidence outside the repository. No Staging, Production, GVM, hosted service, credential, provider, permission, projection, communication, UI, worker, or historical financial action occurred. Any second database run requires a fresh governed Product Owner gate.

## Bounded correction after independent audit

Claude independently returned `CORRECTIONS_REQUIRED_BEFORE_DATABASE_PROOF` for two bounded blockers. Darshan authorized correction within the existing Issue #158 allowlist at report HEAD `a293faa316784781a72fae60ac6dc00e7ed85ae5`; the implementation candidate under review remains the historical parent candidate `5f9af16422310428852d343f65f140591d2dac86`.

The correction changes exactly these five approved paths:

1. `lib/commerce/booking-operations/kernel.ts`
2. `tests/unit/commerce/booking-operation-kernel.test.ts`
3. `tests/postgres/issue-134-durable-booking-operation-contract.sql`
4. `scripts/verify-issue134-durable-booking-operation-postgres.mjs`
5. `docs/reviews/issue-134-durable-booking-deposit-implementation.md`

No migration, UI, action wiring, permission, configuration, provider, projection, communication, worker, accepted evidence, Staging, Production, GVM, or historical financial-record path changed.

Corrected source identities before the final documentation commit:

- `lib/commerce/booking-operations/kernel.ts`: SHA-256 `824e42146827d084caf701f0fc5d00d58b98c7748f7ca159c164f9f01b2e2634`
- `tests/unit/commerce/booking-operation-kernel.test.ts`: SHA-256 `d2dd3d860a1d5a58e7eb79ea779e9379a1d266c31586680ad1dbf47b967f5693`
- `tests/postgres/issue-134-durable-booking-operation-contract.sql`: SHA-256 `0f4f3ae3681d421cf8162f43082678f3f233d27762ea966b441ee790f947fa6d`
- `scripts/verify-issue134-durable-booking-operation-postgres.mjs`: SHA-256 `239981e3170dbdff5ec967581bd2b8ec7c359dd83c591aa65940d579441661c5`

The exact corrected branch commit and tree are recorded in the final delivery handoff immediately after the single authorized correction commit. They cannot be embedded into this same commit without changing both identities; unlike the original report-only child, this correction is intentionally one commit.

### B1 resolution — lossless history cursor

`decodeCursor()` now validates the exact PostgreSQL timestamp string with a bounded RFC 3339/PostgreSQL shape, real calendar/date/time/offset ranges, and parse validity, then returns the original bytes unchanged. It no longer reconstructs the cursor boundary with `Date.toISOString()`, so six-digit PostgreSQL fractional precision survives the base64url cursor and the `(attention_rank, created_at, id)` comparison. `encodeCursor()` applies the same fail-closed timestamp validation.

Focused reader tests drive two boundaries inside the same millisecond (`.123456` and `.123455`) through encode, decode, and successive pagination RPC arguments; they prove the encoded cursors remain distinct and the exact strings reach PostgreSQL unchanged. A malformed calendar date is rejected before the canonical reader is called.

### B2 resolution — complete Section 14 proof vectors

The disposable SQL contract and owned-cluster verifier now add executable coverage for every audit gap:

- same-key changed-tuple admission returns exact `KEY_CONFLICT`; the conflict event ID is recomputed from the documented deterministic tuple, its full financial classification is checked, and a second conflict replay leaves exactly one event;
- three rank-0 history rows include a same-timestamp UUID tie and a one-microsecond boundary; real non-null cursors paginate them in `attention_rank`, `created_at DESC`, `id DESC` order without skips or duplicates and preserve the six-digit cursor timestamp. Fixture-only timestamp seeding uses transaction-local `session_replication_role=replica` and positively asserts restoration to `origin` before reader proof;
- a second synthetic Business/customer proves wrong-actor reader, close, and commit denial, authorized foreign-tenant nonvisibility, and an `UNKNOWN` foreign-Business commit with byte-stable full-row digests across attempts, events, ledger, and obligations;
- two distinct attempt keys admit equal CAD50 payment intents under separate operation identities, with distinct operation IDs and request fingerprints;
- four deliberately discarded-response sessions commit bootstrap, appointment, bind, and money boundaries, discard stdout, terminate the client only after the session is observed sleeping after explicit `COMMIT`, classify the transport result as `UNKNOWN`, and then recover by canonical same-identity read before replay. Every stage checks the original attempt key, one operation/attempt, zero-or-one appointment as appropriate, zero-or-one ledger as appropriate, same-row replay, the exact durable transaction ID, and four—not duplicated—obligations after money commit. A separate explicit rollback proves zero durable operation/attempt/appointment/ledger effect. Evidence marks `recollectionInvited=false`;
- a bounded same-operation appointment race with `staff_id NULL` witnesses the first session after insert and the second blocked on the advisory lock, then requires exact `CREATED` plus `EXISTING`, the same appointment ID in both replies, and exactly one NULL-staff appointment row.

The verifier retains its exact confirmation flag, fixed PostgreSQL 17 binaries, loopback-only/socket-disabled cluster, minimal sanitized child environment, before/after source identities, append-only phase/concurrency evidence, confirmed stop, and dual-marker cleanup fence.

### Correction validation

- Focused Issue #158 suites — PASS, 5 files / 47 tests.
- Relevant booking/booking-engine/commerce/migration/customer/notification suites — PASS, 75 files / 695 tests.
- `npm run typecheck` — PASS.
- ESLint over every corrected TypeScript/JavaScript path — PASS.
- `node --check scripts/verify-issue134-durable-booking-operation-postgres.mjs` — PASS.
- Verifier `--help`, no-argument, wrong-argument, and extra-argument gates — PASS; statuses `0,2,2,2`, and every non-exact invocation refused before PostgreSQL binary inspection.
- `npx next build --webpack` — PASS; optimized production compilation, TypeScript, and 37/37 static pages completed.
- `git diff --check` — PASS.
- Allowlist and protected-hash checks — PASS.

Migration identity remains byte-identical: SHA-256 `805f49255069cf0cc0e831bd45986218246e982acdc35e75d8b25d91212cb727`, exactly `80,473` bytes.

Protected hashes remain byte-identical:

- Foundation: `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`
- R1a: `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`
- Attribution: `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`
- Approved contract: `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d`

**DATABASE PROOF: RUN ONCE, FAILED**

**SECOND DATABASE PROOF: NOT RUN**

The first governed run reached PostgreSQL and stopped on the synthetic `appointments.id` default mismatch documented above. It did not apply the product migration to any shared or hosted environment.

## Exact changed paths

1. `supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql`
2. `lib/booking-engine/types.ts`
3. `lib/booking-engine/persistence.ts`
4. `lib/booking-engine/mutations/create.ts`
5. `lib/commerce/booking-operations/types.ts`
6. `lib/commerce/booking-operations/normalize.ts`
7. `lib/commerce/booking-operations/kernel.ts`
8. `lib/commerce/booking-operations/index.ts`
9. `tests/unit/booking/create-booking-persistence.test.ts`
10. `tests/unit/commerce/booking-operation-normalization.test.ts`
11. `tests/unit/commerce/booking-operation-kernel.test.ts`
12. `tests/unit/migrations/issue134-durable-booking-operation.test.ts`
13. `tests/postgres/issue-134-durable-booking-operation-contract.sql`
14. `scripts/verify-issue134-durable-booking-operation-postgres.mjs`
15. `docs/reviews/issue-134-durable-booking-deposit-implementation.md`
16. `docs/CHANGELOG.md`

No path outside the Section 13 allowlist changed.

## Migration identity

- Created only through the installed CLI path after checking `npx supabase migration new --help`.
- Filename: `supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql`
- Size: `80,473` bytes
- SHA-256: `805f49255069cf0cc0e831bd45986218246e982acdc35e75d8b25d91212cb727`
- State: authored only; never applied.

The migration supplies exactly the locked 23 deltas: one registry table, one appointment column, eight named constraints, three indexes, eight SECURITY INVOKER functions, and two triggers. It retains the accepted prior booking-attempt index and does not alter existing RLS policies or applied migrations.

## Contract coverage

- Stable opaque operation, attempt-key, and inline-customer UUID creation and all-three rotation are implemented.
- Customer, booking, and payment tuples use fixed-order UTF-8 JSON and SHA-256 fingerprints. PostgreSQL recomputes all three before new admission or replay; a fixed multi-resource cross-language vector covers nested-array whitespace.
- Bootstrap provides operation-first replay, full stored-column/attempt comparison, deterministic key-conflict evidence, sorted email/phone advisory locking, safe tenant-scoped inline matching, and same-transaction customer/operation/attempt/event creation.
- Existing booking validation, status, duration, room/resource, package, pricing, tax, and named/optional-staff behavior remain authoritative. `createBooking()` revalidates and accepts the opaque injected durable writer only through an explicit persistence strategy.
- Original appointment insertion carries the operation ID and exact validated commercial fields, including zero; appointment/resource insertion is atomic and the compatibility fallback is unavailable to the durable branch.
- Binding is one-time and identity checked. No-payment persists REQUESTED plus SKIPPED with zero ledger/obligations and returns an explicit `NO_PAYMENT_REQUESTED` operator reason.
- The specialized manual commit verifies tenant, actor, lifecycle, bound identities, tender, exact zero/one evidence, one REQUESTED event, one exact ledger, one ACCEPTED event, and four PENDING obligations before returning recorded truth.
- Close/create and close/commit use the common operation advisory fence and canonical attempt → appointment → operation row-lock order. Pricing/slot/abandonment, cancellation, repeated CLOSED zero-ledger customer correction, and appointment-linked ledger protection are represented.
- Private exact/history readers reauthorize current user and Business on every call, fail closed on malformed identity/count/tuple/state evidence, distinguish raw recording from synchronization, return same-identity recovery actions, and omit request/PII internals from history.
- Production dependencies keep new admission `false`. Booking Sheet, Quick Appointment, and current `createAppointment()` callers are not wired to the new kernel; the existing weak booking dedupe and current callers remain unchanged.

## Proof package

- SQL contract source: `tests/postgres/issue-134-durable-booking-operation-contract.sql`
- Human runner: `scripts/verify-issue134-durable-booking-operation-postgres.mjs`
- Static migration/verifier contract: `tests/unit/migrations/issue134-durable-booking-operation.test.ts`

The runner requires exactly `--confirm-disposable-local`, uses fixed PostgreSQL 17 Homebrew binaries, an owned loopback-only temporary cluster, a minimal sanitized child environment, before/after source hashes, phase recording, concurrency-response capture, confirmed shutdown, and two matching ownership markers before PGDATA removal. The SQL fixture loads immutable foundation/R1a/attribution sources, checks their digests, verifies schema/ACL inventory, and is authored to exercise replay, inline identity races, appointment races, commit races, both close/create orders, both close/commit orders, no-payment, repeated correction, ledger protection, reader privacy, and revocation. The first run stopped before the deeper scenarios and does not prove them.

Argument refusal, fixture source, phase capture, concurrency capture, cleanup logic, and JavaScript syntax were checked offline. The exact confirmation flag was supplied once for the governed failed run; it was not supplied during this fixture correction, and no second run occurred.

**DATABASE PROOF: RUN ONCE, FAILED**

**SECOND DATABASE PROOF: NOT RUN**

The runtime failure and surviving/unexecuted proof boundaries are recorded above. A second human-operated run requires a fresh governed gate.

## Commands and results

- `npx supabase migration new --help` — PASS; CLI help checked before authoring.
- `npx supabase migration new issue_134_durable_booking_operation` — PASS; generated the sole migration filename above.
- `npm test -- tests/unit/commerce/booking-operation-kernel.test.ts tests/unit/migrations/issue134-durable-booking-operation.test.ts tests/unit/commerce/booking-operation-normalization.test.ts tests/unit/booking/create-booking-persistence.test.ts tests/unit/booking/authenticated-create-booking-callers.test.ts` — PASS, 5 files / 45 tests.
- `npm test -- --exclude tests/unit/dashboard/top-nav-containment.test.tsx --exclude tests/unit/communications/customer-location-email-mobile.test.ts` — PASS, 190 files passed, 1 skipped; 1,959 tests passed, 36 skipped.
- `npm test` — PARTIAL: 1,957 tests passed and 39 skipped; only two untouched browser suites failed because the Playwright Chromium executable is absent. The earlier introduced persistence-privilege guard failure was corrected before the final runs.
- `npm run typecheck` — PASS.
- Scoped ESLint over every changed TypeScript/JavaScript path — PASS.
- `npm run lint` — BASELINE FAILURE: 29 errors and 10 warnings, all in untouched UI/integration files; no changed path was reported.
- `npm run build` — ENVIRONMENT BLOCKED before compilation: Turbopack rejected this worktree's `node_modules` symlink because it points outside Turbopack's filesystem root.
- `npx next build --webpack` — PASS on the final source candidate; optimized production compilation, type validation, static generation, and route output completed.
- `node --check scripts/verify-issue134-durable-booking-operation-postgres.mjs` — PASS.
- Verifier `--help`, no-argument, wrong-argument, and extra-argument checks — PASS; every non-exact invocation refused before PostgreSQL binary use.
- `git diff --check` / cached equivalent — PASS.
- Static hash and path checks — PASS.
- First governed disposable-local PostgreSQL 17.11 run — FAILED at the golden-path appointment insert because the synthetic fixture lacked the production `appointments.id` UUID default; verifier shutdown/owned-PGDATA cleanup PASS.

Source evidence remains in the changed focused tests, static migration test, SQL proof source, verifier source, this report, and the local task transcript. Failed-run evidence remains outside the repository in the retained system temporary evidence directory identified above.

## Preservation and boundaries

Protected hashes after implementation:

- Foundation migration: `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`
- R1a migration: `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`
- Attribution migration: `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`
- Reviewed contract: `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d`

Applied foundation, R1a, and attribution migrations are byte-preserved. Accepted local, C01, Run 02, Staging application, and other historical evidence files are untouched. No credential, passfile, `.env`, or `.supabase` file was directly inspected, printed, or added to evidence.

There was no hosted database access, migration application, projection processing, invoice/receipt/CRM write, communication, provider call, worker activation, public Summer/#133 adapter, permission/RLS cutover, #153 action, retained-cohort processing, historical financial change, Staging/Production/GVM action, deployment, push, PR mutation, merge, #135 release, or technician resumption.

## Remaining limitations and next gate

- Database proof has run once and failed in the synthetic fixture before the golden path completed. The fixture default is corrected, but runtime behavior/concurrency and the deeper Section 14 vectors remain unproven until a separately authorized second disposable-local run; static checks are not a substitute.
- The backend is intentionally unusable for new admissions while `admissionEnabled` is `false` and no current surface calls its prepared entrypoints.
- Projection, operator UI, identity storage on target surfaces, #133/Summer reporting, communications, retention messaging, #153 cutover, and permission tightening remain separately governed follow-ons.
- The default Turbopack command remains unusable in this symlinked worktree; the supported webpack build passed.
- Repository-wide lint and the two Chromium-dependent tests retain the pre-existing/environment blockers recorded above.

No scope reconciliation blocker required an out-of-allowlist change. The next database action is a fresh governed Product Owner gate for a second disposable-local run after review of this proof-fixture-only correction.
