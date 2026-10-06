# HV134 RUN02 — partial hosted validation; stopped with retained synthetic records

## Current verdict
RUN02 executed the exact approved v2 package and stopped after synthetic writes. It is NOT a complete hosted-kernel PASS and is NOT zero-write. No automatic retry, cleanup, follow-on financial RPC or Production/GVM operation occurred during reconciliation. Run01 and Run02 evidence are retained unchanged. R1a remains unwired/default-off; no technician resumption, #135 release, merge, #153 closure or GVM Operational Acceptance.

Run ID `HV134-20261006-R1A-02`; aggregate `9b96fdda79170f23cf467082187123d8651a85fb3c91d6d9cc3600583f8ab968`; source HEAD `9fa613626196c0e3dd130465ef5818a7ab8d38ce`. The runner passed its gate at 2026-10-06T14:36:32.729Z and stopped at 14:36:55.273Z with exit1. These are original runner events, not inferred from the user's screenshot.

## Executed proof and limits
- Persisted MATCH: exact hash/target, role/transport probe, transaction-read-only and prerequisite preflight, Auth absence, 2 synthetic Auth actors, 53 normal tenant/provisioning rows, zero-message containment, authenticated legacy NULL-linked INSERT/UPDATE/DELETE rollback, negative/atomic rollback cases, and R1 visible-before-check reassignment diagnostic. The latter does not solve concurrent customer reassignment.
- D1 deposit and repeat/conflict assertions and D2 acknowledged-commit suppression/recovery assertions completed by source control flow before the F1 stage was reached. Their complete RPC replies were not persisted individually; do not present those as retained wire-response evidence.
- Native original DB logs prove both F1 workers waited concurrently. Holder P0001/HV134_CONCURRENCY_WITNESS_TIMEOUT caused holder rollback; the already-dispatched workers then acquired locks. One real F1 financial effect committed.
- Original exact worker RECORDED+REPLAY replies were not preserved. The runner calls holder.result() before worker.result(); the first exception discarded their result collection. No full concurrency-oracle PASS is claimed.
- N1 admission and the runner's final containment/reconciliation stages were NOT RUN. Coordinator subsequently performed separate read-only reconciliation; that does not retroactively convert missing runner stages into PASS.

## Independent native read-only retained-state reconciliation
Observed on governed Staging `wnfahklzaxirftyskctd` at 14:38–14:47 UTC, 2026-10-06. No active HV134 transactions remained. Two synthetic Auth users and two identities remain; two new normal tenants have 53 parent/provisioning rows. Current financial rows total27, yielding80 retained public rows, not the original planned82.

| Case | Attempt | Retained authoritative ledger | State |
|---|---|---|---|
| D1 CAD50 e-transfer deposit | c49d40f5-dfa6-417c-b1cf-25712e5b58d6 | 84eb8017-b1e4-49d6-9c47-ef7084cbc163 | ACCEPTED |
| D2 legitimate CAD50 cash payment | b5451223-c034-4efa-ac2d-47442cdadea1 | 04048de5-a9bb-4772-897b-73027366d893 | ACCEPTED |
| F1 CAD80 full manual debit | 869de0be-05fa-45b6-85cc-2e57dfc41840 | 1a0a40f1-7b77-4fb4-9266-004da77c5676 | ACCEPTED |
| R1 CAD13 mismatch-control request | 652cfd32-b42c-49a4-b4ff-ce4df47c1891 | None | REQUESTED |
| N1 CAD25 customer-only request | Not created | None | NOT RUN |

Three ledger records total CAD180. All links are unique; zero tuple mismatches across Business/customer/appointment/amount/currency/kind/method/provider/success state. These are synthetic manual records, not bank/card-provider charges. Eight events:4 REQUESTED+3 ACCEPTED+1 KEY_CONFLICT. Twelve obligations remain PENDING. Sequence last_value11/is_called=true; gaps1,2 correspond to outer rollback and7 to the repeated-conflict default. No sequence reset.

Both appointment caches remain paid0/refunded0. A1 price10000/payment_status deposit_required; A2 price8000/unpaid; both restored to the original synthetic CustomerA1. Synthetic invoices/lines/receipts/customer-payment mirrors are zero. This is recorded money with pending synchronization, not an acceptable activated workflow.

Containment flags remain CAD/Toronto, all notifications/marketing/public booking off, staff_only, no notification_email; Staff and Service inactive. All tenant-scoped jobs, notifications, send intents, follow-ups, history/audit, calendar rows and receipts are zero. Global count/latest timestamps for all ten monitored communication/document tables exactly match the runner preflight diagnostics. No sending endpoint was invoked by this task; these data checks are not an independent provider-network audit.

Four pre-existing noncohort baselines exactly match preflight: Businesses4 / 7fc3e1697a000ca2620ecc661e151073; Customers3 / 35d24c7d31b9ff7c098653ff5c9ec84e; Appointments11 / 2fc6bcb1fb8600261ed23ee6fb992f74; Transactions2 / 411372ed782289a869775cd2f87dd94c. No broader all-table unchanged claim is made. Both applied migration stored-SQL hashes remain unchanged.

## Diagnosed harness defects
The holder obtains its lock with effective service_role, then also observes pg_stat_activity under service_role. The PostgreSQL worker connections log in as postgres. Fresh catalogues: service_role is not superuser and lacks pg_read_all_stats/postgres privileges, despite having SELECT on pg_stat_activity. A bounded native READ ONLY role-visibility check confirmed postgres-login state/query/wait fields are masked under this effective role. The source's wait_event_type='Lock' predicate therefore cannot see the two workers. Increasing timeout is not the correction.

The original native logs at 14:36:46.864/47.027 show w1 PID775762 and w2 PID775763 waiting; holder PID775760 raises the witness timeout at14:36:55.205; the workers acquire their locks at .205/.206. No historical activity-view snapshot exists; the original log, source and current visibility reproduction jointly support the diagnosis.

Second defect: the holder exception prevents persistence of already-completed worker results. Future result collection must record each dispatched outcome independently before deciding overall PASS/STOP. Neither defect justifies widening grants or changing the payment functions. Source guidance: PostgreSQL17 monitoring-stats, Viewing Statistics, https://www.postgresql.org/docs/17/monitoring-stats.html .

## Retention and next prerequisite
Do not run v1/v2 again, recreate synthetic tenants, repeat D1/D2/F1, revive R1, delete history or reset sequences. F1 is already ACCEPTED: replay cannot reproduce a fresh first commit. Missing exact worker replies remain missing; do not waive the documented oracle.

Any future executor must be a separately reviewed retained-cohort continuation, not the original provisioning run. If a fresh first-commit concurrency demonstration requires an additional synthetic payment, that is a new financial effect requiring explicit Product Owner scope approval. No such additional effect is authorized or has been created. A proposed follow-on authoring dispatch was blocked by a tool safety control; it was not retried or routed through another execution channel. No follow-on execution package or hash-bound gate is ready in this reconciliation. Read-only adjudication continued separately.

Existing unresolved operational dependencies remain: appointment-customer attribution invariant; #153/SEQ-ACL-1 permission cutover; idempotent appointment/invoice/receipt/CRM/communication work; authenticated operator and responsive workflow acceptance; governed Production release. Future projection/communication activation must explicitly account for this retained synthetic cohort rather than automatically processing its pending obligations.

## Independent adjudication

Claude session `baa35595-3b95-4926-8d28-9b17bf3d5142`: PARTIAL, PROVENANCE-BOUNDED STOPPED-RUN RECORD accepted as such; NOT a hosted-kernel PASS. Direct source/run-file inspection plus review of supplied coordinator native observations. No reviewer SQL or test execution. The fresh first-commit returned-outcome requirement remains open and is not waived. Sol diagnosis session `994bb720-2a05-416c-a1e6-d5453c7ff78d` was also source-only.

<details>
<summary>Claude complete independent report</summary>

```markdown
# CLAUDE — INDEPENDENT READ-ONLY ADJUDICATION, HV134 RUN02 (STOPPED RUN)

**Scope:** review of one stopped partial run. Not a rerun of the closed foundation, R1a authoring, or
Staging schema-application audits. No file, repo, permission, hosted, shell, network, or credential
action was taken; no `.env`/secret/clipboard/screenshot was read. No runner, prompt, SQL, or test was
authored or executed.

**VERDICT: PARTIAL, PROVENANCE-BOUNDED STOPPED-RUN RECORD — ACCEPTED AS SUCH.
NOT a LIMITED HOSTED R1a KERNEL PASS. NOT zero-write. NO GVM or activation acceptance.
No evidence reset, no provisioning replay, no retry recommended.**

## 1. Provenance and partial-proof verdict

**Directly verified by me (local, read-only):** HEAD `9fa613626196c0e3dd130465ef5818a7ab8d38ce`.
Run manifest records aggregate `9b96fdda…8ab968` with member hashes `PLAN.md b8d27816…`,
`fixture.json 037eee20…`, `hosted_validation.py 6dc3dbf2…`; evidence `gate` line shows
approved == computed hash, run `HV134-20261006-R1A-02`, target `wnfahklzaxirftyskctd`, so the exact
approved package was the thing that ran. `evidence.jsonl` is 13 append-only lines ending
`concurrency-holder / STOP_PRESERVE / "Management SQL HTTP 400"` then `run-stop`;
`run-manifest.jsonl` is 7 lines ending `STOPPED_PRESERVE_ALL_EVIDENCE`. Direct preflight record:
sequence `last_value=1, is_called=false`; four pre-existing baseline count+digest pairs
(businesses 4/`7fc3e169…`, customers 3/`35d24c7d…`, appointments 11/`2fc6bcb1…`, transactions
2/`411372ed…`); `exact_emails_absent=true`; two actors created, `provider_send_invoked=false`;
`public_provisioning_rows=53`; all tenant-scoped containment counts zero; legacy NULL-link durable
delta 0 with `api_or_signin_proof=false`; `r1-precheck` UNKNOWN/`recorded=false`,
`adoption_blocker_cleared=false`; `d2-response-suppressed` for attempt `b5451223…`.

**Supplied only (coordinator reconciliation and native logs; I did not reproduce them):** the 80-row
public census, four attempts / eight events / three ledgers / twelve PENDING obligations, post
sequence `11/is_called=true`, unchanged baselines and applied SQL hashes, D1 `c49d40f5…`/ledger
`84eb8017…`, F1 `869de0be…`/ledger `1a0a40f1…`, worker PIDs 775762/775763 waiting ShareLock and
tuple lock, holder PID 775760 raising `P0001 HV134_CONCURRENCY_WITNESS_TIMEOUT` at 14:36:55.205Z,
and the native role check (login `postgres`, effective `service_role`, `pg_read_all_stats=false`,
state/wait fields not visible).

**Independent arithmetic cross-check (mine, from the package against the supplied census):** PLAN §6
budgets 12 sequence defaults (9 retained events + 2 rolled-back + 1 conflict). The supplied eight
durable events plus the same 2 rolled-back plus 1 conflict equals exactly 11 `nextval` calls, which
from `last_value=1/is_called=false` lands precisely on `11/is_called=true`. Retained financial rows
27 versus the planned 29, and events 8 versus 9, differ by exactly one attempt and one event — N1.
Three independent counters therefore reconcile with a single omission and no unaccounted monetary
effect. This corroborates the supplied census; it does not substitute for it.

**Source-verified defects.** `hosted_validation.py:1167` issues `set local role service_role` before
the witness loop, whose predicate at 1177–1179 and 1191–1192 requires `wait_event_type='Lock'` on
*other* sessions' rows. The approved preflight at line 682 checks only
`has_table_privilege(current_user,'pg_catalog.pg_stat_activity','SELECT')` and never tests
`pg_read_all_stats` membership — the supplied "preflight only checked table SELECT" claim is
accurate against source. Masking is the strongly supported cause but remains **inferred**: the masked
hosted rows were never captured, and the supplied native check is a present-time observation under
the same role pair, not the historical snapshot. Separately, lines 1270–1271 call `holder.result()`
before any `worker.result()` and the handler re-raises, so a holder exception deterministically
discards both already-completed worker replies; the `["RECORDED","REPLAY"]` assertion at line 1277
never executed. Both defects are proven from source, not assumed.

**Cannot be certified.** Caller-visible concurrency outcomes; the shared attempt/transaction identity
as *returned*; D1's `ADMITTED→RECORDED`, `EXISTING→REPLAY` and two-call stable `KEY_CONFLICT`
payloads; D2's post-suppression `EXISTING→REPLAY`; N1; post-kernel containment and final
reconciliation (never called); any ceiling assertion; the exact null wait fields. Progress-implies-pass
reasoning for D1/D2 is credible from the in-code assertions but is control-flow inference, not
persisted evidence, and must never be reported as observed payloads.

**Retention gap to record:** D1 and F1 attempt/ledger identities appear in neither `evidence.jsonl`
nor `run-manifest.jsonl`. Two of the three durable ledger effects are identified only by supplied
reconciliation plus live hosted state; only D2 and R1 (`652cfd32…`, 1300) are in local immutable
evidence.

## 2. Fresh first-commit RECORDED+REPLAY — REMAINS OPEN

Yes, requirement 11 stays open. What is proven is real overlap on one locked row and exactly one
durable F1 ledger with four obligations — the money-safety half (no double charge). What is missing is
the operator-disclosure half: the returned outcome pair. One durable ledger is equally consistent with
RECORDED+REPLAY and with RECORDED plus a second worker that aborted without durable effect; the
absence of a durable `NOT_RECORDED` event is weak corroboration, since a lock-timeout or HTTP failure
would leave no event at all. Overlap logs and one ledger are therefore insufficient. Retained F1 can
now only REPLAY, so this requirement cannot be closed from the existing cohort.

## 3. Retention, no-retry, activation holds

Retain everything, unchanged: two Auth users and identities, two Businesses, 53 provisioning rows, 27
financial rows (80 public total, under ceiling), 12 PENDING obligations, sequence at 11/is_called=true,
both run01 and run02 evidence directories and their package hashes. No delete, anonymize, truncate,
`setval`, trigger/RLS disable, row edit, or "repair". Do not re-dispatch provisioning, Auth creation,
legacy, negative, D1, D2, F1, or conflict calls; the single-run authorization is consumed and stopped.
N1 remains unadmitted and may not be admitted under this audit. PLAN §9's exclusion duty is now a live
hazard: the twelve PENDING obligations exist in Staging, so any projection, reconciliation, or
communication worker must explicitly exclude or gate this cohort before activation. R1a stays
unwired/default-off; #153, the appointment-customer binding race, projections/documents/communications,
full workflow, Production, and GVM Operational Acceptance all remain open. No grant to
`service_role` or `supabase_read_only_user` is endorsed.

Continuity note: the board and handoff still describe run02 as awaiting execution and are stale for
this run. Correcting them is Control Tower's action, not mine.

## 4. Smallest next prerequisite (design terms only)

Before any further hosted dispatch: have Control Tower record this adjudication, then prepare a new
exact-hash package whose *only* substantive changes are harness instrumentation — (a) the activity
witness must be read by an observer identity that can actually see other sessions' wait fields, i.e.
the row lock is taken under `service_role` but the role is restored before observation, with the
transaction and lock retained; (b) the preflight must verify that observer capability positively and
fail closed, rather than only table SELECT; (c) every dispatched request's reply must be collected and
persisted independently so no single failure discards sibling evidence; (d) witness, worker outcomes,
and durable reconciliation must remain three separate assertions. No grant, schema, migration,
fixture, runtime, or ceiling change is needed or endorsed. Note the witness observer is test
instrumentation; a privileged observer proves the race occurred and makes no claim about runtime
visibility.

## 5. Financial-effect boundary

Any fresh first-commit concurrency proof requires a new attempt key, which creates an additional
synthetic ledger effect and obligations outside the approved RUN02 fixture and ceilings.
**That is a separate Product Owner decision and is NOT authorized by this read-only audit.** This
adjudication assigns no new financial effect.

TESTS NOT RUN. No SQL, network, Auth, provider, browser, or runner execution; no file changed.
```

</details>
