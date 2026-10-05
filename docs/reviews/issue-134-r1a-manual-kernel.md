# Issue #134 — R1a manual-payment kernel

**Status:** PREPARED ONLY / UNWIRED / NOT APPLIED / NEW ADMISSION DEFAULT OFF
**Competitive Product Gate:** NOT_APPLICABLE — internal implementation of locked integrity behavior; no UI or product workflow change.
**Launch dependency:** REQUIRED. This candidate is not operational acceptance.

## Prepared candidate

R1a adds one CLI-generated additive migration,
`20261005154345_issue_134_r1a_manual_payment_kernel.sql`, SHA-256
`cb7d89f7f9646f103777713331323bca38be21493f761053cc50c2edc6b9e778`.
It creates exactly two `SECURITY INVOKER` functions with fixed
`pg_catalog, pg_temp` search paths:

- `admit_payment_attempt_v1`
- `commit_manual_payment_attempt_v1`

Only `service_role` receives EXECUTE. The migration changes no table, column,
index, constraint, trigger, policy, sequence, default ACL, existing table
privilege or data. The accepted foundation remains byte-identical at SHA-256
`dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`.

The new `lib/commerce/payment-attempts/` module imports `server-only`, resolves
the current actor and Business through the existing request-cached session
guards, derives Business currency, verifies customer/appointment binding and
uses a default-off admission control. It is not a Server Action or route and no
existing writer, booking action, UI, provider or worker imports it.

## Locked behavior

Generic fingerprint v1 normalization preserves all six literal reference
vectors. The fixture is byte-identical to the reviewed artifact at SHA-256
`842c4afaf3d68a2778dded613a1b57dd4775a4019a3465c5130a82cc5d2f9874`.
R1a admits only existing-customer/optional-existing-appointment manual
payment/deposit intents using cash, debit card, credit card, e-transfer or
other. Invoice intent, booking-operation, none, gift/store credit,
refund/void/adjustment and Stripe are rejected before privileged admission.

Admission inserts the winner and exactly one REQUESTED event atomically.
Replay compares immutable tuple columns rather than trusting the fingerprint.
A changed tuple, including one carrying an equal hash, returns a committed
KEY_CONFLICT with stable server-derived evidence; duplicate evidence races
re-read and verify Business, attempt and event type.

Commit locks and revalidates the stored attempt, updates it to ACCEPTED before
inserting one linked succeeded manual ledger row, appends ACCEPTED evidence and
inserts exactly four obligations in one transaction. All remain PENDING except
customer-only `appointment_cache`, which is NOT_REQUIRED with `completed_at`.
Results never claim synchronization or receipt completion. Consistent replays
return the original ledger identity without writes; missing or inconsistent
ledger/events/obligations return UNKNOWN without repair. FAILED and SKIPPED are
not revived.

## Local proof and privilege provenance

A fresh PostgreSQL 17.11 cluster bound only to `127.0.0.1` executed the
foundation as setup, the complete R1a migration and the focused contract as
literal `service_role`; it was stopped and removed afterward. The verifier
rejects every nonlocal/query/fragment URL and strips every inherited `PG*`
variable from synchronous and concurrent `psql` children.

The fixture models only required existing privileges: migration 031's
`service_role` commerce-ledger DML, foundation grants on attempts/events/
reconciliation, existing binding-table reads and the accepted inherited
identity-sequence privilege. The R1a migration grants no table, column or
sequence access. Local execution found no missing privilege.

Proof covered service-role boundaries, tenant/customer/appointment binding,
same-key concurrency, committed conflict and duplicate-event race, equal-value
new-key payments, rollback before transaction completion, lost-response
replay, no false synchronization, customer-only obligations, missing/tampered
evidence holds, terminal FAILED/SKIPPED behavior and unchanged legacy data.
Focused and payment/booking regressions passed 59 files / 518 tests; typecheck,
targeted lint and diff-check passed.

## Withheld and next gate

No hosted database, provider, environment, migration application, UI/action
wiring, projection worker, invoice/receipt/mirror schema, #153 correction,
merge, Production, GVM, #135 release, historical repair or workflow activation
occurred. Build was not run because the requested safe local proof excludes
build-time environment/provider uncertainty.

**Flag activation for application traffic remains prohibited.** The next gate
is coordinator scope reconciliation followed by Grok challenge and independent
Claude Level-3 candidate review. Only after that may a separate Product Owner
gate consider migration application and isolated hosted fixtures. Hosted legacy
NULL-linked DML smoke, #153 closure before permission cutover, projections,
full workflow acceptance, governed Production release and GVM Operational
Acceptance remain later requirements.
