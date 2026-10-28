# HV134 retained-cohort continuation C01

**Status:** PREPARED ONLY / NOT AUTHORIZED TO EXECUTE  
**Continuation:** `HV134-20261006-C01`  
**Target:** governed Staging `wnfahklzaxirftyskctd` only  
**Competitive Product Gate:** NOT_APPLICABLE — internal tooling for locked financial-integrity behavior  
**Launch classification:** LAUNCH REQUIRED validation dependency

This directory is a new standalone continuation package. It does not modify or replace Run01, Run02, either original evidence file, either applied migration, application code, permissions, Auth, or the retained cohort. Authoring and offline tests make no hosted call.

## Product Owner execution decision

Execution would create **one additional synthetic CAD1 manual cash ledger effect** against the existing synthetic Business A / Customer A1. It is not a card, bank, or provider charge. It also admits the previously planned N1 CAD25 customer-only request but deliberately leaves N1 `REQUESTED` with no ledger.

The CAD1 effect is proposed test scope and is **not authorized by this package or by its authoring approval**. A future user gate must say all of the following plainly:

> I approve exact package SHA-256 `<aggregate>` for the one fixed continuation `HV134-20261006-C01` on Staging `wnfahklzaxirftyskctd`. I understand it proposes one new synthetic CAD1 manual cash ledger effect (no real charge) and one CAD25 N1 request-only record. The original F1 wire replies remain irretrievably missing; this run cannot recreate or substitute them. This customer-only C1 does not prove the appointment-customer binding race or full workflow.

Only after that exact approval may an operator set the dedicated Management credential in `HV134_C01_STAGING_MANAGEMENT_TOKEN` and invoke:

```text
python3 docs/validation/issue-134-r1a-continuation/harness.py \
  --execute \
  --approved-package-hash <exact-approved-aggregate> \
  --continuation-id HV134-20261006-C01
```

No Auth/service-role key is accepted or needed. There is no arbitrary target, cleanup, reset, retry, resume, or force option. The evidence directory is created exclusively as `evidence/HV134-20261006-C01`; an existing directory blocks reuse.

## Package identity

The exact members are the sorted `package_members` array in `manifest.json`. For each member:

1. read its exact bytes;
2. compute lowercase hexadecimal SHA-256;
3. append to the aggregate hash stream: UTF-8 member path, one NUL byte, the 64 ASCII digest bytes, then one LF byte.

The SHA-256 of that complete stream is the aggregate package identity. Default invocation prints every member digest and the aggregate, then exits 2 without reading environment variables, creating evidence, or constructing a network adapter. The approval must use that printed aggregate; changing any member invalidates it.

The harness also hashes the immutable old v2 package, both Run02 original evidence files, the stopped-run review/reconciliation, and both migration sources before reading the execution environment. Hosted preflight separately verifies both applied SQL hashes and both installed function-body hashes.

## Fixed retained scope

The manifest pins every actor, Business, Location, Customer, Appointment, Service, Staff, old attempt, and old ledger identity. Current required state is:

- 53 parent rows + 27 financial rows = 80 public rows;
- 4 attempts / 8 events / 3 linked ledgers totalling CAD180 / 12 PENDING obligations;
- sequence `11`, `is_called=true`;
- D1, D2, and F1 accepted exactly once; R1 remains requested;
- N1 and the new C1 key are absent;
- two original Auth users and identities remain;
- cohort jobs and send intents are zero.

The harness never calls D1, D2, F1, R1, their conflicts, tenant provisioning, Auth Admin, a provider, a worker, or an application route. It never creates a parent row. N1 is last and is unreachable unless the complete C1 witness, exact reply pair, and fresh durable reconciliation all pass.

### New C1

- key `13400000-0000-4000-8000-000000000006`;
- Business A / Customer A1 / no appointment;
- customer-billing manual cash payment, CAD100 minor units;
- admitted once, then exactly two overlapping commit requests;
- required replies: exactly `RECORDED` + `REPLAY`, same attempt and transaction UUID;
- required durable result: one accepted attempt, two events, one CAD1 ledger, four obligations — three `PENDING`, and customer-only `appointment_cache` `NOT_REQUIRED`.

### Existing N1

- original key `13400000-0000-4000-8000-000000000004`;
- Business A / Customer A1 / no appointment;
- CAD2500, manual `other`;
- admitted only after C1 fully passes;
- stays `REQUESTED`; never committed.

Expected bounded final state is 90 public rows (53 parent + 37 financial), 6 attempts, 11 events, 4 ledgers totalling CAD181, 16 obligations (15 `PENDING`, one C1 appointment-cache `NOT_REQUIRED`), and sequence `14` with original gaps preserved.

## Observer and concurrency correction

The writer and observer are deliberately separate within the holder transaction:

1. the holder enters as the original Management observer `postgres`;
2. `SET LOCAL ROLE service_role`;
3. lock only the exact newly admitted C1 attempt;
4. `RESET ROLE` while retaining that transaction and row lock;
5. clear the statistics snapshot on every poll and observe as `postgres`.

Before C1 admission, a read-only advisory-lock exercise creates a real service-role waiter and requires the observer to see its non-null `state`, `query`, `usename`, `wait_event_type='Lock'`, `wait_event='advisory'`, and blocker identity. Membership or `SELECT` on `pg_stat_activity` alone is not accepted. Failure or masking stops before any payment dispatch. No grant or DDL is used.

Every dispatched request gets independent append-only start/finish records: request label, UTC start/finish, monotonic duration, HTTP status, backend identity when returned, sanitized synthetic result/witness, timeout/error classification, and COMMIT acknowledgment or `UNKNOWN`. No token, SQL text, provider body, or raw error body is logged.

Holder failure cannot discard worker replies. Once workers are dispatched, all bounded futures are awaited independently. Any holder/worker timeout, malformed result, identity mismatch, or uncertainty stops new dispatch, preserves sibling records, and triggers fresh read-only reconciliation. It never claims zero writes after dispatch.

The acceptance checks are separate:

1. privileged observer witness;
2. exact caller-visible `RECORDED` + `REPLAY` reply pair;
3. fresh durable attempt/event/ledger/obligation reconciliation.
4. exact reply attempt/transaction identities cross-checked against the durable read.

An HTTP/COMMIT acknowledgment without the durable read is not a pass. A durable ledger without both exact replies is not a pass.

## Preservation and fail-closed checks

Before mutation the harness:

- verifies exact package/source/evidence bytes locally;
- uses only the fixed Management origin with system CA/hostname verification, no inherited proxy and no redirect;
- enforces SQL `READ ONLY` for protected reads through the privileged Management route;
- checks observer/writer identity, actual wait visibility, SQL/function hashes, invoker/search-path/ACL/RLS boundaries, sequence configuration, exact Auth/parent/financial identities and counts, claims, containment, and C1/N1 absence;
- captures full-row count/digest snapshots for every pre-existing cohort parent and financial table;
- verifies the four original noncohort count/digest baselines.

After C1 dispatch and at final reconciliation, every pre-existing cohort full-row digest and every original noncohort baseline must be byte-for-byte unchanged. Any unexplained drift stops. Output is append-only in the new run directory.

## Truthful stop and pass boundary

If a write-capable request times out or loses its response, its COMMIT acknowledgment is `UNKNOWN`; no automatic retry occurs. The harness awaits already dispatched siblings, then reconciles read-only. N1 is never reached on a C1 failure or uncertainty.

A C01 pass proves only a fresh customer-only same-key manual commit produced caller-visible `RECORDED` + `REPLAY` with one durable CAD1 effect, followed by N1 request-only admission. It does **not** recover the original F1 returned pair, prove appointment binding/reassignment safety, activate R1a, process projections, prove invoices/receipts/CRM/communications, exercise UI/actions/providers, or establish full workflow, Production, GVM, technician, or operational acceptance.

Run01 and Run02 remain immutable. F1 remains a single accepted CAD80 effect whose original exact returned pair is missing. `REPLAY + REPLAY` against F1 is not and must never be presented as fresh first-commit proof.

## Offline validation

Pure standard-library checks:

```text
python3 -m unittest discover \
  -s docs/validation/issue-134-r1a-continuation/tests \
  -p 'test_*.py' -v
python3 -m py_compile \
  docs/validation/issue-134-r1a-continuation/harness.py \
  docs/validation/issue-134-r1a-continuation/sql_contract.py \
  docs/validation/issue-134-r1a-continuation/tests/test_harness.py
python3 docs/validation/issue-134-r1a-continuation/harness.py
```

The tests use deterministic fakes only. They cover role/observer ordering, masked-observer refusal before payment dispatch, holder failure with sibling retention, one-worker timeout with sibling retention, malformed/mismatched identities, durable verification after HTTP acknowledgment, N1 suppression on concurrency failure, no existing-cohort redispatch, scope/digest drift, exact count arithmetic, and refusal before environment/network access.
