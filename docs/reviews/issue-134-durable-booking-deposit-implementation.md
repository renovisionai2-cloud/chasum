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

The runner requires exactly `--confirm-disposable-local`, uses fixed PostgreSQL 17 Homebrew binaries, an owned loopback-only temporary cluster, a minimal sanitized child environment, before/after source hashes, phase recording, concurrency-response capture, confirmed shutdown, and two matching ownership markers before PGDATA removal. The SQL fixture loads immutable foundation/R1a/attribution sources, checks their digests, verifies schema/ACL inventory, and exercises replay, inline identity races, appointment races, commit races, both close/create orders, both close/commit orders, no-payment, repeated correction, ledger protection, reader privacy, and revocation.

Argument refusal, fixture source, phase capture, concurrency capture, cleanup logic, and JavaScript syntax were checked offline. The confirmation flag was never supplied alone.

**DATABASE PROOF: NOT RUN**

PostgreSQL was not launched and neither the new nor any older database verifier was executed. Runtime SQL proof must remain human-operated until independent exact-candidate source review is complete.

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

Evidence is retained in the changed focused tests, static migration test, SQL proof source, verifier source, this report, and the local Cursor task transcript. No separate database evidence directory exists because database proof was not run.

## Preservation and boundaries

Protected hashes after implementation:

- Foundation migration: `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`
- R1a migration: `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`
- Attribution migration: `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`
- Reviewed contract: `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d`

Applied foundation, R1a, and attribution migrations are byte-preserved. Accepted local, C01, Run 02, Staging application, and other historical evidence files are untouched. No credential, passfile, `.env`, or `.supabase` file was directly inspected, printed, or added to evidence.

There was no hosted database access, migration application, projection processing, invoice/receipt/CRM write, communication, provider call, worker activation, public Summer/#133 adapter, permission/RLS cutover, #153 action, retained-cohort processing, historical financial change, Staging/Production/GVM action, deployment, push, PR mutation, merge, #135 release, or technician resumption.

## Remaining limitations and next gate

- Database syntax/behavior/concurrency remains unproven until the independently reviewed human disposable-local run; static checks are not a substitute.
- The backend is intentionally unusable for new admissions while `admissionEnabled` is `false` and no current surface calls its prepared entrypoints.
- Projection, operator UI, identity storage on target surfaces, #133/Summer reporting, communications, retention messaging, #153 cutover, and permission tightening remain separately governed follow-ons.
- The default Turbopack command remains unusable in this symlinked worktree; the supported webpack build passed.
- Repository-wide lint and the two Chromium-dependent tests retain the pre-existing/environment blockers recorded above.

No scope reconciliation blocker required an out-of-allowlist change. The next action is Claude's independent exact-candidate review, followed by Product Owner-controlled human disposable-local proof only if that review accepts the new source.
