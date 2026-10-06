# HV134 governed Staging kernel-validation package

**Status:** PREPARED ONLY / UNEXECUTED / CORRECTED FOR INDEPENDENT CLAUDE RE-REVIEW  
**Target:** Chasum Staging project `wnfahklzaxirftyskctd` only  
**Competitive Product Gate:** NOT_APPLICABLE — bounded validation of locked internal financial-integrity behavior  
**Execution authority:** not included. A separate Product Owner approval must name the exact aggregate package hash and one run identifier.

No test, runner, database, Auth, network, provider, browser, Git, repository, permission, or environment action was performed while preparing this package. The only authorized writes were these preparation artifacts under `/tmp/chasum-134-hosted-plan-5fxibaq7/package/`.

## 1. Package and fail-closed invocation

The package is complete:

- `PLAN.md` — scope, procedure, exact expectations, retention, and acceptance boundary.
- `fixture.json` — immutable synthetic identities, data, attempt keys, amounts, and ceilings.
- `hosted_validation.py` — standard-library coordinator using fixed Supabase Management SQL and Auth Admin HTTPS transports; it contains all SQL.

The runner defaults to refusal. It reads no execution environment and makes no external call unless all three are supplied:

```text
--execute
--approved-package-hash <exact aggregate SHA-256>
--run-id <exact approved identifier>
```

At execution it recomputes the aggregate package hash over the exact three files, validates the supplied run identifier, creates a new local evidence directory with exclusive creation, then performs every read-only preflight before the first write. It has no cleanup, grant, DDL, retry-after-ambiguity, Production, or arbitrary-target mode.

Execution secrets are accepted only through dedicated variables:

- `HV134_STAGING_MANAGEMENT_TOKEN`
- `HV134_STAGING_SERVICE_ROLE_KEY`

No direct PostgreSQL DSN/password is used. SQL is sent only to `POST https://api.supabase.com/v1/projects/wnfahklzaxirftyskctd/database/query` with JSON `{query, read_only}` and only documented HTTP 200/201 success accepted. Auth Admin is pinned separately to `https://wnfahklzaxirftyskctd.supabase.co/auth/v1/admin/...`. Both transports disable inherited proxies and redirects and use the default verified TLS context. Tokens are read from process environment only after the execute/hash/run-id gate; `.env`, `.pgpass`, and service files are never read. Tokens, SQL, raw errors, and credential-bearing responses are never logged.

Before any Auth call or possible write, a dedicated capability probe uses that exact Management endpoint with `read_only=false` so it exercises the same write-capable transport route as the financial operations. Its package-authored SQL is nevertheless enclosed by `BEGIN READ ONLY`, then performs `SET LOCAL ROLE service_role`, checks in the following statement that `current_user` is literally `service_role` and that `session_user` has `rolinherit`, executes `RESET ROLE`, and commits. Exactly one JSON object with both booleans true is required. HTTP, SQL, transaction, result-shape, or value failure is `STOP_ZERO_WRITES`; the probe invokes no application/financial function and creates no record.

**Known execution-access prerequisite:** an authorized direct DB-host TCP attempt failed with `No route to host`; the available Management token returned HTTP 401 on a strictly read-only probe. No SQL/Auth was sent by the direct-host attempt and no SQL executed through the unauthorized token. Before execution, the user must securely refresh/provision a Stage-authorized `HV134_STAGING_MANAGEMENT_TOKEN`. This is credential access, not a product/code-plan decision; it does not justify password resets, weaker security, partial Auth creation, or Production access. The exact corrected bytes still require Claude re-review and a hash-bound run approval.

## 2. Source and supplied hosted truth

The immutable applied inputs are:

- foundation hosted history `20261005032107 / issue_134_payment_attempt_foundation`, SQL SHA-256 `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`;
- R1a hosted history `20261005170446 / issue_134_r1a_manual_payment_kernel`, SQL SHA-256 `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`;
- admission body SHA-256 `110485eb1eb2a86fd2eec72507fdf8beb7304aae92251ddef598162d05dd5847`;
- commit body SHA-256 `e6acc9a31613b2f039305cf5169871e9b433839b4077b83d0858246194f46b15`.

Supplied coordinator evidence says attempts/events/obligations/linked ledger are zero; the two functions are invoker, fixed-path, and service-role-only; and the live fixture columns, RLS, privileges, trigger inventory, identity function, and sequence settings match the package assumptions. Before any Auth call, the runner verifies the exact package hash, Management authorization, migration/function hashes, full schema/privilege/plan prerequisites, and the exact all-source #72 identity predicate. Both planned names intentionally omit the common `Chasum` brand token. Supplied evidence is not fixture execution.

## 3. Exact synthetic scope

Two exact `.invalid` Auth emails are preflighted as absent, then created through supported Supabase Auth Admin `createUser` semantics (`email_confirm=true`) with random opaque no-log passwords generated only in memory. There is no invitation, recovery, phone, provider-message, direct `auth.users` insert, pre-existing-user mutation, or automatic Auth deletion. A timeout/connection loss during account creation is an ambiguous write and immediately stops without retry; any account already created is retained.

Each returned actor UUID is recorded once in the append-only run manifest. Each actor must be confirmed active, verified, non-anonymous, unbanned, with one email identity and no Business ownership/membership/operator marker. A single database transaction then:

1. invokes service-role-only `decide_business_identity(..., 'create_new', ...)` once for each actor;
2. requires exact `created` results and captures the generated Business UUIDs once;
3. before commit, sets CAD/Toronto, disables email/SMS/owner/staff/marketing notifications, disables online booking, sets `staff_only`, clears `notification_email`, and removes the generated Location phone;
4. inserts customer, Service, Staff, and Appointment UUIDs generated once in Python and appended once to the manifest; no name/time lookup discovers those IDs. Governed Business/Location IDs are captured only by exact actor ownership, Business identity, and default-Location identity.

No existing personal, GVM, HQ, or Test Studio tenant is used. Collisions, `existing`, `ambiguous`, `review_required`, malformed results, or extra rows stop the transaction. Business and Location rows remain visible under current public policies, so they contain only synthetic `.invalid`/non-personal metadata; a hidden slug is not treated as privacy. The Service is explicitly inactive, internal, offline, and unreviewed; Staff is inactive, offline, has no user/email/phone, and all seven trigger-generated working-hour rows are retained and closed. Relationships exist only to satisfy appointment source integrity. This is direct kernel validation, not booking-availability acceptance.

### Exact retained-row ceiling

Public provisioning is **53 rows**:

- two normal tenant seeds: 2 Businesses + 14 business hours + 2 Locations + 2 settings + 14 location hours + 2 identity decisions = 36;
- fixture: 3 Customers + 1 Service + 1 Staff + 7 staff working hours + 3 relationship rows + 2 Appointments = 17.

Retained financial evidence is **29 rows**: 5 attempts + 9 events + 3 linked ledger rows + 12 obligations. Total retained public rows remain **82**. Auth must add exactly two users and two email identities. Auth platform audit records are observed and reported separately using global count/latest diagnostics; no fixed “at most two” assertion or combined all-schema ceiling is invented.

## 4. Read-only preflight before any write

The runner must establish all of the following or stop with zero write:

1. exact fixed Management endpoint/ref, accepted 200/201 response, Stage-authorized token, and actual package/source hashes; failure/401/403/network error means `STOP_ZERO_WRITES`;
2. exact Auth emails absent in database and then through bounded Admin-user pagination;
3. exact migration versions/names/statement hashes, function-body hashes, invoker/fixed-path/EXECUTE boundaries, plus the explicit READ ONLY/write-capable-route probe proving cross-statement literal `service_role` and `session_user.rolinherit`;
4. every table, column, table/column/sequence privilege used later, including invoice/receipt/CRM diagnostics and `staff_working_hours` UPDATE;
5. active `starter` plan, exact #72 function, all-source phone/email/website/name-location/brand-location/slug predicate yielding zero candidates for both identities;
6. zero pre-existing synthetic rows, `business_members`, and slug aliases; no dispatch trigger;
7. all communication/containment tables, including `communication_follow_ups` and `communications_audit_log`; tenant counts plus global count/latest diagnostics;
8. no `pg_cron` table, current R1a zero adoption, exact sequence configuration/current state, PostgreSQL 17, and observer catalogue visibility.

No grant/default/runtime/schema change is permitted. Any unresolved credential, authorization, TLS, response-shape, catalogue, privilege, plan, identity, or collision result stops before Auth creation.

## 5. Executed phases if separately approved

### A. Provision and contain

Create the two Auth actors, then execute the one governed provisioning transaction above. Reconcile exact IDs/counts and zero tenant-scoped rows in:

`background_jobs`, `communication_follow_ups`, `communication_history`, `communication_send_intents`, `communications_audit_log`, `notification_logs`, `notifications`, `calendar_connections`, `external_events`, and `commerce_receipts`.

All tenant-scoped counts must remain zero. Global counts and latest timestamps are captured before/after as diagnostics, not hard-failed because unrelated workers may legitimately move global state and `background_jobs.business_id` is nullable. No application action, booking RPC, worker, cron, webhook, calendar sync, queue processor, receipt/invoice helper, or provider entry point is called. Disabled settings are defense in depth; no-send is bounded to package architecture, not independent provider proof.

### B. Hosted authenticated legacy NULL-link smoke

One transaction sets literal `authenticated` plus Actor A request claims, inserts one CAD 1.00 succeeded manual `commerce_transactions` row with `payment_attempt_id=NULL`, updates only its description, deletes it, and rolls back. Every operation must affect one row. Fresh reads must show no durable ledger or attempt/communication delta.

This proves hosted SQL role/RLS/trigger compatibility only. Injected SQL claims are not Auth sign-in, JWT transport, PostgREST, Server Action, API, UI, or deployed-writer proof.

### C. Negative, rollback, and mismatch cases

- Cross-Business customer admission: exact `23503 / PAYMENT_ATTEMPT_CUSTOMER_BINDING_INVALID`, no row.
- Uppercase `CAD`: exact RPC-shape rejection. This does not prove server-helper supported-Business-currency validation; that remains accepted offline helper evidence.
- `payment_kind='none'`, amount 0, NULL method/route: exact R1a rejection. It is not durable fresh-booking/no-payment recovery proof.
- Atomic rollback: key `...0090`, CAD 9.00; admit and commit, observe one ledger/two events/four obligations inside the transaction, then outer rollback; fresh session finds none.
- Retained mismatch sample R1: key `...0005`, CAD 13.00. Admit durably against Appointment A2/Customer A1. In a rollback-only authenticated transaction reassign A2 to Customer A2, switch to service role, require commit `UNKNOWN/recorded=false`, and roll back. R1 remains REQUESTED with one NOT_RECORDED event and no effect.

The outer rollback proves transaction atomicity of this exact success path. It does not simulate every internal statement fault; unavailable fault seams remain NOT RUN.

### D. Retained matrix

- D1 `...0001`: CAD 50.00 e-transfer deposit. `ADMITTED -> RECORDED`, identical `EXISTING -> REPLAY`; one attempt/ledger and four obligations.
- D1 conflict: same key, CAD 50.01. Two calls return the same KEY_CONFLICT event UUID. Only one conflict row is retained; the second `INSERT ... ON CONFLICT DO NOTHING` still evaluates the identity default.
- D2 `...0002`: separate equal CAD 50.00 cash payment. The runner verifies the commit session returned success, deliberately withholds that result from the simulated caller, then recovers in a fresh session and requires REPLAY with the same transaction UUID. This is acknowledged-COMMIT response suppression, not a network outage or crash test.
- F1 `...0003`: CAD 80.00 debit-card manual payment. Admit once. One independent Management request starts a transaction, locks only F1, changes its unique `application_name` to READY, and performs at most 100 paced 0.1-second observations. A separate read-only request must see READY before two independent threaded worker requests are dispatched. The holder’s recursive blocker check accepts direct or indirect chains only when both named workers resolve to its PID; otherwise it raises and rolls back. Holder budget is 12 seconds, workers 20 seconds, HTTP 30 seconds. On failure, no new business request is dispatched and outstanding bounded requests are awaited. Evidence persists both exact outcomes and the shared attempt/transaction UUIDs.
- N1 `...0004`: customer-only CAD 25.00 `other`; admit and intentionally do not commit. It remains one REQUESTED/NOT_RECORDED sample with no ledger/obligations.

No table-wide lock is used in kernel validation. The only table locks are the existing bounded locks inside governed #72 provisioning.

## 6. Sequence accounting

Preflight and final reconciliation capture `seqstart/seqmin/seqincrement/seqcache/seqcycle`, direct `last_value`, and `is_called`. Never infer untouched history solely from nullable `pg_sequences.last_value`; never call `setval` or reset the sequence.

Exactly **12** defaults must be evaluated:

- 9 retained events;
- 2 rolled-back atomicity events (sequence movement is nontransactional);
- 1 duplicate D1 conflict insert whose identity default is evaluated before conflict resolution.

With increment 1/cache 1, expected direct post-state is:

- if pre `is_called=false`: `post_last_value = pre_last_value + 11`;
- if pre `is_called=true`: `post_last_value = pre_last_value + 12`;
- post `is_called=true`.

Any other movement is `INVESTIGATE/STOP`, not proof of corrupt financial data, because an unrelated caller may have consumed sequence values.

## 7. Twelve-requirement current/future matrix

| # | Requirement/scenario | Required future-run observation (not executed) | Future supported-workflow finish line |
|---|---|---|---|
| 1 | Legacy NULL-linked writer | INSERT/UPDATE/DELETE rollback must pass at SQL role/RLS layer | Deployed authenticated writer/API smoke after cutover |
| 2 | Cross-tenant/customer binding | Fail closed, no attempt/effect | All activated surfaces retain tenant authority |
| 3 | Currency | Lowercase-shape RPC check; CAD committed | Server helper validates supported Business currency on every route |
| 4 | No payment now | Unsupported/no-call diagnostic only | Durable booking-operation/no-payment recovery; no duplicate booking/payment |
| 5 | Pre-commit rollback | Exact outer rollback, two sequence gaps | Scoped application/worker fault seams prove each internal failure boundary |
| 6 | Reassignment mismatch | Pre-check UNKNOWN; R1 retained NOT RECORDED | New reviewed invariant/guard and legitimate correction contract |
| 7 | D1 first payment | ACCEPTED, one ledger, four PENDING obligations | Cache/invoice/CRM complete; receipt handled separately |
| 8 | Replay/key conflict | Same tuple replays; changed tuple stable KEY_CONFLICT | Operator discloses original result/conflict safely |
| 9 | Legitimate equal second payment | New key creates exactly one independent ledger | UI requires deliberate correction/second-payment intent |
| 10 | Response loss | Acknowledged commit suppressed; new-session REPLAY | Real request transport/restart recovery on every activated route |
| 11 | Concurrent same-key commit | Real overlap; exactly RECORDED + REPLAY | Re-run after binding fix and projection locking |
| 12 | N1 retained request | REQUESTED/NOT_RECORDED, no effect | Operator recovery/expiry policy without inventing money truth |

For D1/D2/F1, present status is **RECORDED NOT SYNCED**. Appointment cache remains unchanged; no invoice, invoice line, receipt, CRM mirror, operator/UI projection, communication, or provider call exists. Those are deferred because R1a cannot implement them, not waived. Current R1a does not satisfy fresh booking, public booking, Quick Appointment UI, Booking Sheet UI, Payments UI, Customer Billing UI, invoice/receipt delivery, responsive workflow, or Production acceptance.

## 8. Reassignment blocker and lock reconciliation

The applied SQL has a check/use gap: it reads `appointments.customer_id` without a row lock, and no FK ties attempt `(appointment_id, customer_id, business_id)` to the appointment’s current customer.

PostgreSQL 17 requires UPDATE privilege for every row-locking SELECT. Live Staging already gives service role applicable UPDATE, including `customer_id`; therefore no new grant is needed solely for the present lock. `FOR KEY SHARE` is not sufficient because it does not block an ordinary non-key `customer_id` update. `FOR SHARE`, `FOR NO KEY UPDATE`, or `FOR UPDATE` can protect only the transaction interval. A reassignment after commit still requires an invariant/guard and a legitimate correction workflow. Any eventual migration must be new, separately reviewed, and #153’s future minimal grant design must preserve whichever lock privilege is chosen.

This package’s rollback-only pre-check deliberately excludes the vulnerable concurrent reassignment interleaving. It cannot clear the adoption blocker.

## 9. Retention, stop, and acceptance

Retain both Auth actors, both Businesses, all parent fixture rows, five attempts, nine events, three linked ledger rows, and twelve obligations for audit. Do not delete, anonymize, truncate, reset sequences, disable triggers/RLS, alter rows, or “repair” an unexpected result. There is no automatic teardown. On any unexpected or ambiguous outcome, stop all further dispatch, preserve evidence, and do not retry except the exact planned replay/conflict calls.

Append-only `evidence.jsonl` and `run-manifest.jsonl` contain stable event keys, UTC times, package/run IDs, generated UUIDs, expected/observed counts, redacted failures, and no secrets/query text/passwords. Existing unrelated Staging rows are never copied into evidence.

Before any future projection or communication worker is activated, its candidate-selection contract must explicitly exclude or deliberately gate the retained HV134 cohort; the twelve PENDING obligations must never be silently processed as normal work.

The strongest possible title after an exact pass is:

**LIMITED HOSTED R1a KERNEL PASS / LEGACY NULL-LINK DB COMPATIBILITY PASS / END-TO-END NOT IMPLEMENTED / ADOPTION BLOCKED BY REASSIGNMENT RACE AND #153**

A pass does not authorize activation, permission changes, schema correction, projection/document/communication work, PR merge, Production, GVM, #135 release, historical repair, technician resumption, or GVM Operational Acceptance. Before any supported release: implement and review the reassignment invariant; complete #153 permission cutover; build idempotent cache/invoice/CRM/receipt/communication projections; activate all intended supported routes; run independent responsive hosted Staging fault/concurrency/workflow acceptance; and obtain separately governed Production approval.

## 10. Complete operating-chain acceptance oracle — later, NOT executable under HV134

The following are required future results for the same monetary examples, not claims about current R1a functionality and not permission to activate it. Amounts are CAD minor units with the fixture's explicit zero tax. These semantic invoice/document expectations must be reconciled with the later reviewed implementation; no new invoice status enum or numbering policy is silently introduced.

| Future scenario | Attempt and authoritative ledger | Appointment, invoice and customer mirror | Receipt, operator and communication truth |
|---|---|---|---|
| 5000 E-Transfer deposit on A1 (total10000) | One accepted logical attempt; one succeeded deposit ledger row5000 CAD/e_transfer | Appointment paid5000/refunded0, deposit satisfied, remaining5000. Applicable invoice total10000/paid5000/balance5000. Exactly one transaction-linked mirror for5000. | One original receipt for that transaction/5000; operator shows recorded deposit and remaining5000 only when financial sources agree. Later authorized booking communication uses committed truth, not a stale unpaid cache. |
| Legitimate second5000 payment on A1 | New deliberate attempt key; a second ledger5000. Gross ledger total10000, not5000 or15000. | Paid10000/balance0; applicable invoice paid10000/balance0; exactly two transaction-linked mirrors, one per original payment. | Two original transaction receipts, each5000; no duplicate receipt for a replay. No new-booking notification merely because another payment is recorded. |
| Full8000 manual payment on A2 | One accepted attempt and one succeeded8000 ledger row | Paid8000/balance0; applicable invoice total8000/paid8000/balance0; one8000 mirror | One8000 receipt; operator money status recorded. Communications follow separately approved occurrence policy, never fabricate a new booking. |
| Explicit No payment now on a fresh booking | Valid future no-payment intent is durably SKIPPED/DO_NOT_RETRY, with no monetary ledger. Booking operation recovers one appointment. | Paid0; original amount due remains; no payment-generated settlement or paid mirror. Any independently valid unpaid invoice stays unpaid. | No payment receipt or paid claim. Customer confirmation and business new-booking notification each have one stable occurrence; actual delivery proof requires a later allowlisted send gate. Current R1a rejects none and cannot prove this row. |
| Same-key duplicate, concurrency or response loss | Original attempt/transaction identity reused; no additional ledger effect | Reconciliation idempotent: no additive cache/invoice total or duplicate mirror | Original receipt/send occurrence reused. A deliberate resend has its own governed occurrence, not another payment. |
| Failed before admission or no committed effect | No fabricated accepted attempt/ledger; retained valid REQUESTED evidence may exist; uncertainty is not definitive permission to collect again | No paid cache/settlement/mirror fabricated | Operator distinguishes confirmed no-effect from UNKNOWN. No receipt or paid communication without money evidence. Pre-admission observability remains #133 work. |
| Authoritative commit followed by projection failure | Ledger remains recorded exactly once | Failed/incomplete financial obligation remains PENDING/FAILED; totals cannot be certified synchronized. Same obligation recovery recomputes from complete ledger and commits projection+completion together. | Operator shows recorded money with synchronization pending/failed and safe recovery, not 'payment failed, collect again'. No second collection. |
| Receipt or delivery failure after financial synchronization | Recorded ledger and completed financial obligations remain true | Appointment/invoice/mirror retain correct paid truth | Receipt failure affects document status only; email/SMS failure affects delivery only. Neither reverses payment or reopens financial collection. |

Future fault tests must independently pause/fail appointment-cache, invoice-settlement, customer-mirror, receipt-generation and delivery stages using an allowlisted test-cohort dependency seam. For each financial projection, test failure before its transaction commit and response loss after commit; retry must reuse its identity and produce one correct projection. Financial transactions contain no external sends. Receipt retries must prove original-document uniqueness; communication retries must reconcile the existing send intent/provider outcome before another send. These seams and workers do not exist in R1a and are NOT authorized by the present run. No shared-schema fault triggers, manufactured provider failures, evidence corruption or blanket queue processing are permitted.

Customer lifetime totals remain UNKNOWN where locked Option A completeness is unproven; the synthetic ledger sum is not permission to change lifetime-reporting policy. Summer must eventually consume the same tenant-authorized ledger/obligation/document/send evidence, not a separate AI money state. No AI action is enabled here.

## 11. #153 / SEQ-ACL-1 decision boundary

| Gate | Required disposition |
|---|---|
| This isolated hosted kernel/legacy comparison | Verify actual grants, role context, installed function/guard identity, RLS and zero unexpected exposure drift. Missing access is STOP, never GRANT. Existing broad legacy authenticated DML and sequence defaults are measured, not exploited or silently changed. Their current existence does not by itself block this restricted comparison. |
| Canonical-writer activation / permission cutover | Close the scoped financial-ledger direct-write bypass, keep only reviewed mutation paths, resolve the specific new event-sequence ACL exposure, prove retained needed service privileges, settle FORCE-RLS applicability, and pass negative tenant/role tests. Also close the independent appointment-customer attribution invariant and projection/workflow blockers. Do not infer these from a kernel PASS. |
| Later separately tracked hardening | Unrelated schema-wide default-ACL cleanup, unrelated function warnings and broad FORCE-RLS rollout can remain separately tracked after their applicability/dependency assessment. This does not waive the object-specific financial cutover requirements or authorize a global defaults change. Any separation from #153 must be explicitly recorded; no whole-platform security PASS is claimed. |
