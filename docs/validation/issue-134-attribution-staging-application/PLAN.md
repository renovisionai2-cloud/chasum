# Issue #134 — governed Staging attribution application gate

**Status:** PREPARED / INDEPENDENT REVIEW PENDING / NOT AUTHORIZED TO APPLY  
**Target:** governed Staging Supabase project `wnfahklzaxirftyskctd` only  
**Competitive Product Gate:** NOT_APPLICABLE — additive enforcement of an accepted financial-integrity invariant, with no new customer/operator workflow.

## 1. Exact immutable candidate

The only future hosted write proposed by this package is the exact repository file:

- `supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql`
- recomputed size: **6,529 bytes / 186 lines**
- SHA-256 `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`
- reviewed source HEAD/tree `732e3821858826898e0c9ec80996e643f6cf0f2c` / `c02e740f6eabecabcc961674623620e87fcbf4a3`

Do not edit, wrap, rename, regenerate, split, or combine these bytes. A hosted migration version may differ from source filename `20261007012529`; map it by exact name, statement bytes, and SHA-256. Never rename/replay history to align timestamps.

The migration is one atomic transaction with `lock_timeout='5s'` per lock wait and `statement_timeout='30s'` per statement—not a whole-transaction wall-clock bound. It has no DML/backfill and adds exactly four named objects: two constraints, one `SECURITY INVOKER` function, and one trigger. Expected dependencies are the unique constraint's backing index, PostgreSQL's internal RI triggers for the FK, and one migration-history entry; they are not unrelated additions. It changes no existing ACL, RLS/FORCE-RLS policy, sequence/default ACL, payment kernel, worker, flag, or application deployment.

## 2. Accepted local proof and limits

Claude independently returned `LOCAL_DATABASE_PROOF_ACCEPTED` for retained evidence `chasum-issue134-attribution-evidence-WNClqF`, summary SHA-256 `cb0b975a9e67751207ee602c50b8f91b2c5dd400376153a37827d33e93562418`. On a disposable minimal PostgreSQL 17.11 fixture, all 11 attribution sections and four true multi-session interleavings passed; returned responses plus durable state checks support the scoped outcomes. Source identities matched before/after, cleanup passed, and the local migration completed in 23ms.

The 5,020ms lock-timeout fired in the migration preflight read before `ADD CONSTRAINT`, proving the first lock-acquisition point and atomic rollback—not a mid-DDL timeout. Local 17.11/minimal-fixture timing does not bound hosted 17.6 scale, lock duration, RLS composition, or workflow behavior. No local rerun is required.

## 3. Dated hosted observations and corrected-package status

- Earlier coordinator-supplied native READ ONLY observations genuinely ran from 2026-10-07 14:11:29.973933Z through 14:21:28.487580Z. They reported PostgreSQL 17.6, accepted foundation/R1a SQL, required schema/security posture, zero mismatches/collisions/target locks, 13 appointments/six ledgers globally, and retained-cohort counts; the exact accepted parent snapshots matched 14/14. This remains separate dated history.
- A later coordinator-supplied preliminary catalogue observation at 2026-10-07T16:11:49.606823Z was the only hosted snapshot supplied to the initial package reviewer. It was preliminary, actor-supplied evidence—not reviewer execution and not final catalogue preflight.
- Coordinator execution of the initial package then returned `42725 operator is not unique: text || "char"` in chunk 01's policy fingerprint. Therefore the reviewer's source-only “executable gate sound” wording is not a runtime PASS and no catalogue gate passed. The initial package remains archived unchanged outside this source package.
- Initial chunk 02, SHA-256 `0f1d25963292340be887002fcbf53089bdd38e0ea5a990a40789c3af04845411`, completed READ ONLY at 2026-10-07T16:29:22.098708Z: all 18 accepted old-cohort and four noncohort fingerprints, Run02 aggregate, 90-row retained identity/counts, tuple compatibility and sequence checks passed. This is a bounded data-query PASS only; no mutation or local-proof rerun occurred.

The corrected chunk 01 has not run. Fresh final catalogue validation is **PENDING**, and all observations above remain non-authorizing preparation evidence.

## 4. Required pre-apply stop gate

Run each numbered `preflight.sql` chunk separately through the native read-only Staging path and retain its one JSON result. Confirm the fixed project ref outside SQL. Never submit the whole multi-result file once to an adapter that returns only the final result.

Immediately before a future apply, all must be true:

1. PostgreSQL major 17; explicit read-only transaction; expected privileged observer; 5s per-lock-wait and 30s per-statement budgets.
2. Foundation `20261005032107` / `dee700ae…ee3a47` and R1a `20261005170446` / `4b7e3855…5ee7` remain exact.
3. Candidate history and all four candidate objects are absent. Partial presence is collision/HOLD.
4. Required UUID/nullability shape, old immediate validated `MATCH SIMPLE / UPDATE NO ACTION / DELETE SET NULL` FK, accepted guard body/posture, and accepted `commerce_transactions_attempt_guard` trigger are exact: target table, enabled `O`, noninternal, `BEFORE INSERT/UPDATE/DELETE FOR EACH ROW` (`tgtype=31`), and exact function binding.
5. Zero missing appointments, Business/customer tuple mismatches, or duplicate parent triples. Offending synthetic IDs are identified if nonzero; there is no repair/waiver path.
6. No competing lock on `appointments` or `commerce_transactions`. Do not kill sessions or widen budgets; stop and choose a later reviewed window.
7. Record fresh relation/index sizes, ACL/RLS/FORCE-RLS/policies, accepted function bodies/ACLs, event-sequence ACL, and the noninternal pre-existing target-trigger baseline excluding only the proposed trigger. Preserve trigger bindings/enablement. Index-byte growth from the new unique index is expected and must not be treated as immutable data.
8. All 18 accepted old-cohort `[count, md5]` fingerprints and four noncohort fingerprints match their original `snapshot_expression`/`noncohort_expression` algorithms.
9. Current retained state is exactly 90 rows: 53 parents + 37 financial; six attempts, 11 events, four linked CAD ledgers/18,100 cents, 16 obligations (15 `PENDING`, one `NOT_REQUIRED`), sequence 14/called.
10. Capture fresh current retained and full relevant-table digests as the before baseline; do not replace historical accepted fingerprints with them.

Any mismatch, NULL/UNKNOWN, timeout, permission error, lock conflict, or source drift is **STOP / retain evidence / no apply / no automatic retry**. Do not kill/cancel sessions or widen budgets.

The discarded draft aggregate parent comparison is not a gate: historical `171f5508…c88f` used different label/serialization provenance, while a reimplementation returned `022e8451…045a`. Exact accepted per-table `row_to_json` fingerprints matched 14/14; this was a query-comparator defect, not data drift. Old evidence remains immutable.

## 5. Future application — explicit Product Owner approval required

Only after independent review of this package, fresh preflight PASS, and explicit Product Owner approval naming the target and exact migration hash:

1. Recompute source bytes/hash.
2. Recheck target locks immediately before submission.
3. Apply the exact 6,529 bytes once through the governed native Supabase Staging migration path.
4. Bundle no fixture, DML, smoke write, Auth/provider call, worker, projection, grant, flag, or second apply.
5. On known pre-commit failure, rely on atomic rollback and stop.
6. On timeout/unknown response, perform read-only history/catalogue reconciliation; never retry blindly.
7. After a verified commit, use only a separately reviewed/approved forward correction if needed—never destructive rollback of audited history.

## 6. Required post-apply read-only acceptance

Rerun both numbered chunks and compare with the retained before results. Require:

- exactly one candidate history row, one 6,529-byte statement, exact migration SHA, and recorded hosted version;
- `appointments_id_business_customer_financial_key` exact/validated with valid ready backing index;
- `commerce_transactions_appt_business_customer_financial_fk` exact columns/reference, validated, immediate/nondeferrable, `MATCH SIMPLE`, update restrict, delete no action;
- new function body SHA-256 `3bfb91b068cc9422af4c17df1ed45a37119fe948be33a611e1d61cdf9aa2c2d2`, invoker posture, exact `search_path=pg_catalog, pg_temp`, and no direct EXECUTE for PUBLIC/anon/authenticated/service_role;
- exact enabled trigger definition and alphabetical order after the accepted guard;
- accepted guard trigger remains exact and all other pre-existing noninternal target-trigger bindings/enablement remain equal to the retained before baseline;
- all prior function bodies/ACLs, relation ACL/RLS/FORCE-RLS, policies, sequence ACL, prior history, retained fingerprints/counts, tuple compatibility, and full relevant-table digests unchanged;
- only the four named objects, required unique backing index/internal RI triggers, and one migration-history entry are added; no broad security or data delta. Relation/index sizes are observations, not immutable-data comparators.

Do not fabricate PASS from catalogue presence alone. This is schema-application acceptance, not hosted DML/PostgREST, application mapping, UI, projection, worker, provider, or full-workflow proof.

## 7. Immediate behavior and permanent holds

After application, legacy rows with `payment_attempt_id IS NULL AND appointment_id IS NOT NULL` immediately freeze Business/customer/appointment attribution and reject DELETE, even while R1a remains default-off. Canonical rows remain owned by the accepted guard; an RI cascade may first return exact `42501 PAYMENT_ATTEMPT_SERVER_ONLY`. The schema-only gate does not deploy `update.ts`.

Legacy NULL-attempt/NULL-appointment durability and SEQ-ACL-1 remain open under #153 before cutover. #133, #135 release, historical USD rows, retained-cohort worker exclusion, replacement writers/projections, technician resumption, Production/GVM, and GVM Operational Acceptance remain held.
