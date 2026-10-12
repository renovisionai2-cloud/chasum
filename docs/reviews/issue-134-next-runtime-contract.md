# Issue #134 — next runtime contract

**Status: DESIGN PROPOSAL / NOT IMPLEMENTED.**
**Decision requested:** approve the product invariant below and one bounded prepared-only implementation package. This does not authorize application, activation, hosted fixtures, workers, merge, release, Production/GVM access, or technician resumption.

## 1. Evidence boundary and recommendation

Repository HEAD is `88af990cd1ac929546692203a9e94a0a0719ce85`. C01 is accepted customer-only first-commit evidence, not appointment-reassignment evidence (`docs/reviews/issue-134-hv134-c01-result.md:18-29,43-50`). No hosted check was rerun; deployment prerequisites remain unverified.

The smallest consequential next package is **appointment/customer financial-attribution integrity**, prepared and proved locally but not applied. Today an operator update can replace `appointments.customer_id` (`lib/booking-engine/mutations/update.ts:213-229`) after a payment was recorded. R1a checks the appointment/customer pair at admission and commit (`supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql:70-87,275-296`), but those are check/use reads; no database relation ties the ledger’s customer to the appointment’s current customer. The accepted foundation deliberately identified that gap (`docs/reviews/issue-134-r1a-manual-kernel.md:50-57,173-177`).

**Recommendation:** choose a database-backed composite referential invariant, not a lock-only/check-only guard:

1. Add unique constraint `appointments_id_business_customer_financial_key` on `(id, business_id, customer_id)`.
2. Add immediate, nondeferrable, `MATCH SIMPLE`, `ON UPDATE RESTRICT`, **`ON DELETE NO ACTION`** constraint `commerce_transactions_appointment_business_customer_financial_fk` from `commerce_transactions(appointment_id, business_id, customer_id)` to that key. `MATCH SIMPLE` is required so a NULL `appointment_id` leaves legitimate customer-only transactions outside the relation.
3. Preserve the existing `commerce_transactions.appointment_id → appointments.id ON DELETE SET NULL` FK (`supabase/migrations/028_commerce_platform.sql:172-177`). Add only a narrow legacy-row guard; do not drop or replace an accepted constraint.
4. Add `SECURITY INVOKER` function `public.guard_legacy_commerce_transaction_appointment_attribution_v1()` and trigger `commerce_transactions_legacy_appointment_attribution_guard`, scoped exactly to `OLD.payment_attempt_id IS NULL AND OLD.appointment_id IS NOT NULL`. It freezes `(business_id, customer_id, appointment_id)` and rejects DELETE for those legacy appointment-linked rows. Canonical linked rows remain protected solely by accepted `commerce_transactions_attempt_guard` (`supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql:196-236,250-252`), unchanged.
5. Translate only the stable named failures described in section 5 into a fail-closed operator result: “This appointment has financial history, so its customer cannot be changed. Create a new appointment for the correct customer; handle any refund or reversal separately.”

No binding table or backfill is needed. The design depends on NOT NULL `commerce_transactions.business_id/customer_id` (`supabase/migrations/028_commerce_platform.sql:172-176`) and `appointments.business_id/customer_id` (`supabase/migrations/001_booking_engine.sql:79-85`); only `appointment_id` is nullable.

## 2. Product rule requiring Product Owner approval

| | Contract |
|---|---|
| Old behavior | A normal appointment edit may replace the customer even after an appointment-linked transaction exists. Ledger, invoice, receipt, CRM mirror, and communication attribution can then disagree with the appointment. |
| Proposed behavior | The first durable appointment-linked `commerce_transactions` row freezes the appointment/customer attribution and that ledger tuple. Staff, service, location, time, notes, status, invoice settlement, refunds, and communications are not frozen. Hard-deleting an appointment with ledger history is blocked; archive/cancel rather than erase. Financial-history cascades may also block customer or Business hard-deletion. |
| Now | Approve the invariant and prepared-only build. No database or UI behavior changes now. |
| Later | Prove compatibility and the operator error before application. A “move history,” merge, or correction workflow is not designed here. |
| Risk | A mistaken customer discovered after financial history exists cannot be fixed by silently editing or deleting the appointment. Preserve the original audit record, refund/reverse when actually required, and create/copy a correctly attributed appointment. Richer correction/offboarding is separate. |

Normal correction remains available before a ledger row exists. `NO ACTION` coexists with old `SET NULL`: if `SET NULL` runs first, the canonical or legacy BEFORE trigger rejects unlinking; if the composite check runs first, it rejects deletion. Either order rejects, and row-delete guards still prohibit teardown. Dropping the old FK is unnecessary; contrary evidence would be a new scope question.

## 3. Exact states and records

- `REQUESTED`: no ledger exists under R1a, so it does **not** freeze attribution. Reassignment may commit; a later commit under the old tuple must fail/return UNKNOWN without money.
- `FAILED` or `SKIPPED` payment attempt with no ledger: no freeze. A contradictory attempt with a ledger is an integrity hold, never a permission to reassign or retry.
- `ACCEPTED`: R1a inserts the succeeded ledger in the same transaction (`supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql:451-528`); that ledger freezes attribution.
- `pending` / `requires_action` ledger: freezes because provider outcome may complete later.
- `succeeded`, `partially_refunded`, `refunded`, successful refund/void/reversal records: freeze permanently. Full refund does not rewrite who owned the original appointment/payment.
- Legacy NULL-attempt-linked transaction with a non-NULL appointment, including `failed` or `canceled`: the new guard freezes its tuple and rejects deletion because it remains durable financial/provider evidence.
- Legacy customer-only row (`payment_attempt_id IS NULL`, `appointment_id IS NULL`): no appointment freeze. A NULL→matching appointment attachment is explicitly allowed and checked by the composite FK; after attachment, the legacy guard freezes the tuple.
- Canonical customer-only row: the accepted guard already rejects DELETE whenever `payment_attempt_id IS NOT NULL` (`supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql:200-204`). C01 is customer-only but attempt-linked, so it is already delete-protected; this design neither repairs nor reopens C01.
- Invoice, receipt, `customer_payment_events`, audit/event, and communication rows do not independently choose attribution. They must derive from the immutable canonical transaction. Their mismatches block later projection gates; they never rewrite the ledger or appointment to “repair” history.

Foundation/R1a attempt links, guards, functions, obligations, invoker posture, and default-off module remain unchanged (`supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql:99-169,171-279`; `lib/commerce/payment-attempts/kernel.ts:274-349`).

**Open #153 residual:** a legacy customer-only row with both links NULL remains mutable/deletable under current legacy permissions and can be cascade-deleted through `customers.business_id`/`commerce_transactions.customer_id` or Business deletion. That exact legacy-only exposure is outside this appointment-specific package and blocks activation/cutover. This proposal makes no entire-ledger durability claim, and the narrow guard does not close #153.

## 4. Both transaction orderings and PostgreSQL semantics

At `READ COMMITTED`, each command starts with a new snapshot; an earlier successful binding `SELECT` does not certify a later `INSERT`. Therefore application rechecks alone cannot close the race.

**Payment first.** The ledger insert’s foreign-key check takes a key-share lock on the referenced appointment triple. Because `customer_id` is part of the referenced unique key, a concurrent reassignment is key-changing: it waits, then fails after the ledger commits. This does not claim that `FOR KEY SHARE` protects arbitrary non-key columns.

**Reassignment first.** If reassignment commits before the ledger insert’s FK check, the old `(appointment,business,customer)` parent no longer exists and the insert fails. R1a’s ACCEPTED update, ledger, event, and four obligations are one transaction, so all roll back. If reassignment is uncommitted, the FK check waits; reassignment commit causes failure, rollback permits the payment transaction to continue. No ordering can commit a ledger/customer tuple that disagrees with the appointment.

A lock-only design cannot stop reassignment after commit; a check-only trigger retains the snapshot hazard. The composite FK supplies concurrent locking and the durable invariant.

The two analyzed paths have no direct cycle: R1a reaches attempt row → ledger insert → referenced appointment key, while an appointment edit reaches only the appointment. This is not a global no-deadlock proof. Future projectors must lock one obligation first, then targets in deterministic key order, and never acquire an attempt lock after a target lock.

Recovery remains exact-identity and fail-closed. A returned SQLSTATE `40P01` or `40001`, or a returned lock error with confirmed transaction rollback, may re-enter **canonical recovery for the same attempt key only**, subject to its existing `recovery_disposition`; it is not permission to recollect or mint a key. A client/network timeout or missing response is UNKNOWN because commit may have occurred: hold, recover the same attempt, and never automatically retry the financial effect. `DO_NOT_RETRY` and inconsistent evidence remain holds. Local proof must distinguish known rollback from unknown timeout.

PostgreSQL 17 references: [explicit locking](https://www.postgresql.org/docs/17/explicit-locking.html), [transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html), [row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html). Referential checks do not depend on caller-visible RLS rows. `FORCE RLS` does not restrict `service_role`/`BYPASSRLS` or replace grants/authorization.

## 5. Prepared-only implementation allowlist

Only:

- `supabase/migrations/<CLI_TIMESTAMP>_issue_134_appointment_financial_attribution.sql` — one new additive migration;
- `lib/booking-engine/mutations/update.ts` — named FK-error mapping only;
- `tests/unit/migrations/issue134-appointment-financial-attribution.test.ts`;
- `tests/unit/booking/update-booking-financial-attribution.test.ts`;
- `tests/postgres/issue-134-appointment-financial-attribution-contract.sql`;
- `scripts/verify-issue134-appointment-financial-attribution-postgres.mjs`;
- `docs/reviews/issue-134-appointment-financial-attribution.md` and `docs/CHANGELOG.md`.

Exact new SQL objects are the two named constraints, function `public.guard_legacy_commerce_transaction_appointment_attribution_v1()`, and trigger `commerce_transactions_legacy_appointment_attribution_guard`. PostgreSQL fires same-event triggers alphabetically: accepted `commerce_transactions_attempt_guard` runs first; the legacy trigger runs second. For canonical rows, the accepted guard retains its existing errors and the new function immediately returns because `OLD.payment_attempt_id IS NOT NULL`. For legacy appointment-linked rows, the accepted guard permits the NULL-linked operation and the new guard raises:

- `LEGACY_APPOINTMENT_LEDGER_ATTRIBUTION_IMMUTABLE`, SQLSTATE `23514`, for changing `business_id`, `customer_id`, or `appointment_id`;
- `LEGACY_APPOINTMENT_LEDGER_DELETE_FORBIDDEN`, SQLSTATE `23514`, for DELETE.

The booking mutation maps only SQLSTATE `23503` plus constraint `commerce_transactions_appointment_business_customer_financial_fk` to the customer-change message. Direct ledger tooling may map the two exact legacy identifiers, never arbitrary `23514`. The migration must contain no DML/backfill and must fail atomically on mismatch or lock timeout. Revoke direct EXECUTE on the new trigger function from PUBLIC, `anon`, `authenticated`, and `service_role`; trigger invocation remains available. Add no function grant and make no existing table, sequence, or default-ACL change.

**Must not change:** either applied #134 migration; `lib/commerce/payment-attempts/**`; R1a RPCs, flags, or admission tuple; current payment/refund/invoice/receipt/provider writers; RLS policies, FORCE RLS, table/sequence/default ACLs; #153 objects; workers; communication delivery; release controls; or any retained evidence. No SECURITY DEFINER canonical writer is introduced.

## 6. Compatibility and local gate

Application preflight must count, identify, and stop on any appointment-linked transaction whose Business/customer differs from its appointment; no repair, deletion, reassignment, or waiver is permitted. It must inspect trigger/constraint collisions, table/index size, unique-index build and validation cost, lock/statement budgets, and direct mutation paths. Currency is irrelevant: CAD and any supported currency behave identically; the historical six USD rows remain untouched. Cross-tenant triples fail, same-tenant matching triples pass, and customer-only NULLs remain valid.

Four actual scripts delete appointments and are compatibility sources only—never execute them against hosted data here: `scripts/audit-phase5-production.mjs:387-389`, `scripts/verify-sprint2-gvm-go-live.mjs:287-293`, `scripts/verify-phase4-scheduling.mjs:500-509`, and `scripts/audit-business-functional.mjs:156-160`. Their synthetic cleanup succeeds only when no protected ledger exists; otherwise rejection is expected.

| Proof before application | Required result |
|---|---|
| Static scope/object/SECURITY INVOKER checks | Exact allowlist; accepted files byte-identical |
| Local positive and negative order A/B interleavings at READ COMMITTED | One valid final ordering; no mismatch; known rollback vs unknown response classified |
| REQUESTED/FAILED/SKIPPED/customer-only matrix | Reassignment allowed when no ledger exists |
| Pending/succeeded/refunded/reversed/canonical/legacy matrix | Correct accepted-vs-new guard owns each deterministic rejection |
| Other appointment edits | Continue normally |
| NULL legacy transition and residual | Customer-only NULL→matching appointment allowed then frozen; NULL/NULL legacy #153 gap remains explicit |
| Tenant/RLS/direct-writer roles | FK/guard applies to authenticated and service-role DML; no privilege widening |
| Index/lock budget | Bounded UNIQUE build/FK validation cost and timeout behavior proved locally |
| Existing-data fixture | Zero mismatches; zero existing-row mutation |
| Regression | R1a focused suites and normal booking/payment/refund transitions pass; historical legacy CRUD pass remains history, while newly forbidden legacy reattribution/DELETE are EXPECTED REJECTIONS |

Installing the guard immediately changes legacy appointment-linked identity/DELETE behavior even while R1a admission remains off; therefore a separately reviewed Staging compatibility/application gate is mandatory. It must preserve all existing 90 synthetic public rows, CAD181 across four linked ledgers, six attempts, eleven events, and sixteen obligations byte-for-byte, with exact before/after identities and digests. The 15 PENDING obligations and retained REQUESTED cohort receive no eligibility marker and must never be selected merely because future workers turn on.

## 7. Safe finish order; #153 reconciliation

1. **Invariant candidate:** prepare, locally prove, and independently audit this exact package; later apply to Staging only through a separate reviewed compatibility/application gate.
2. **Replacement path readiness:** before any UI activation, build durable fresh-booking/booking-operation and payment-attempt identity; idempotent appointment-cache, `customer_payment_events`, invoice, receipt, and communication projections; explicit default-deny worker eligibility for post-cutover attempts; and #133 canonical requested mode/amount/method/source/actor/attempt/result/reason/timestamps. Existing approved invoice/receipt behavior remains the product contract; missing identity, collision, and compatibility mechanics are implementation gates, not permission to reopen approved issuance or receipt rules.
3. **Coordinated Staging cutover:** design/author #153 in parallel, but do not remove current legacy permissions while active surfaces still depend on them. Only after replacement writers, projections, fresh-booking recovery, and all five sources—Booking Sheet, Quick Appointment, Collect payment, Customer Billing, Payments dashboard (`lib/commerce/payment-attempts/types.ts:3-9`)—are ready and fault-tested may #153 revoke legacy broad UPDATE/DELETE, resolve owner-policy/FORCE-RLS applicability and SEQ-ACL-1, and cut traffic over together. Its older “SECURITY DEFINER writers” wording is superseded here: accepted R1a remains service-role `SECURITY INVOKER`.
4. **Acceptance/release:** complete responsive operator workflows, exact-attempt recovery/fault cases, document/send-intent recovery, Reporting/Summer canonical reads, governed Production release, then real supported GVM operations.

This invariant is necessary but is not operational acceptance. Bookings, deposits, invoices, receipts, customer/business communications, refunds where supported, projections, permission cutover, and disclosure remain held.

Competitive Product Gate is **NOT_APPLICABLE** to this internal integrity package and narrow fail-closed error: it implements a PO-approved invariant without a new workflow or UI. Separate current competitor research is required before designing a material correction/transfer/merge operator experience or changing invoice/refund semantics.

Summer can **UNDERSTAND** immutable attempt→ledger→appointment/customer evidence, **EXPLAIN** recorded money versus pending projections, and **RECOMMEND** the safe correction path. Summer must not **ACT** on frozen attribution or pending cohort without explicit authority. **AUDIT** consumes the same canonical events, ledger, obligations, and #133 result truth—never reconstructed guesses.

## 8. Genuine stop gate

Product Owner approval is required for: **(a)** the concrete rule that any durable appointment-linked ledger record permanently freezes appointment/customer attribution, blocks appointment hard-delete, and may block related customer/Business teardown; and **(b)** the exact prepared-only allowlist. Approval authorizes local implementation/proof only. It does not authorize migration application, hosted validation, #153 changes, projection execution, activation, merge/release, Production/GVM action, or GVM Operational Acceptance.

**Actual status:** corrected design only; no tests/build/browser/SQL/hosted checks run and no environment or non-proposal source changed. Independent review of this corrected revision is pending.
