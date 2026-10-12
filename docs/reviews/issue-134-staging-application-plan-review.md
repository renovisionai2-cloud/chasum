# Issue #134 — final Staging application-plan gate

**READY_FOR_STAGING_APPLICATION_APPROVAL / NOT AUTHORIZED TO APPLY / HOSTED MIGRATION UNAPPLIED.**

## Exact reviewed package

- Package: `docs/validation/issue-134-attribution-staging-application/`.
- Package audit SHA-256: `6abdd6ff1ed79e4a7ca6c21c625c26f29b45397b2bb41b5dc8606dfecc4ae4ba`.
- PLAN SHA-256: `5d2113ba4ba7234f9dc0a7cd974162ad9756612817ac89cdca935a4e22d10115`.
- Preflight SHA-256: `5f970db8d557e23c68ef587156a16425286c5d421fa288dd0e03bfd3399de64e`.
- Manifest SHA-256: `c8e64d3616a81d9c51f7dd179d2f59566fb7343cac46f9ad16ae7eeb28828855`.
- Immutable migration: `supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql`, 6,529 bytes / 186 lines, SHA-256 `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`.
- Preserved local-proof HEAD: `732e3821858826898e0c9ec80996e643f6cf0f2c`. Publication of this report changes documentation/evidence/read-only preparation only, not the migration, runtime, verifier or accepted financial tests.

This external final review supersedes only the authoring-time REVIEW_PENDING / catalogue-validation-pending status in the frozen package. Package bytes and their recorded observations are not edited after acceptance. No approval or application is inferred from review readiness.

## Team and executed preparation

Sol/Cursor was the sole preparation engineer, continuing session `05e3058c-3323-448d-b337-0bc23f3f505f` (reported GPT-5.6 Sol 272K High). Claude independently reviewed and delta-reviewed the application plan in session `3d8a2773-53b0-4dcf-bd9a-9a486582d09d` (reported Claude Opus 5 300K High No Thinking). The final verdict has no outstanding required correction. This was not another review or execution of the accepted local proof, foundation, R1a or C01. Grok was not dispatched; no unresolved architecture or concurrency-method dispute remained.

Coordinator native Supabase READ ONLY preparation used project `wnfahklzaxirftyskctd` only. The unchanged data chunk passed at **2026-10-07 16:29:22.098708 UTC**; the corrected catalogue chunk passed at **16:43:34.622352 UTC**. These are separate transactions and dated preparation evidence, not freshness for a later apply. [Normalized native result record](evidence/issue-134-attribution-staging-preparation.json), SHA-256 `156b18c2b181028d9ade7f084f54f484ce41ac5c2d4a8bdce91a0c525cd1b43d`, is a selected coordinator transcription, not raw transport bytes or reviewer database execution.

Data checks: all **18 old-cohort** and **four noncohort** fingerprints match their original serialization; all **90 retained synthetic public rows** remain accounted for (53 parents + 37 financial); six attempts, eleven events, four linked CAD ledgers totalling **18,100 cents**, sixteen obligations (15 PENDING / one NOT_REQUIRED), and sequence 14/called match. Identity and appointment/customer/Business tuple mismatch counts are zero. No retained financial records or obligations were processed, replayed or changed.

Catalogue checks: PostgreSQL **17.6**, READ ONLY, expected observer, candidate history and objects absent (`PRE_APPLY_ABSENT`), foundation/R1a stored SQL exact, required column nullability and old SET NULL FK exact, accepted guard body and its enabled event/function binding exact. No competing target locks at observation; all fifteen target indexes valid/ready. Appointments have 13 rows / 8,192 heap bytes / 114,688 index bytes; commerce_transactions has six rows / 8,192 heap bytes / 114,688 index bytes. Existing ACL/RLS/FORCE-RLS, policy, accepted-function and sequence state was captured without changing it. Small observed tables do not guarantee a later lock window.

The first read-only catalogue query failed with SQLSTATE 42725 (`text ||` internal `char`) and is not represented as a pass. It was corrected without modifying the migration or accepted proof. Positive old-trigger validation, a nullable absent-new-function lookup and historical Git-ref provenance were corrected before final review. Earlier 14:11–14:21, preliminary 16:11, data 16:29 and catalogue 16:43 observations remain distinct records, not timestamps rewritten to agree. No safety-blocked PR-body update or old blocked preparation operation was repeated.

## Accepted proof retained without rerun

[Exact accepted local evidence](evidence/issue-134-attribution-local-accepted/summary.json) remains SHA-256 `cb0b975a9e67751207ee602c50b8f91b2c5dd400376153a37827d33e93562418`; the reviewed original logs, identities and Claude result were copied byte-for-byte, excluding private HOME/passfiles and PGDATA. The original local proof remains accepted: eleven sections, four interleavings and the 5,020ms timeout at the preflight read before ADD CONSTRAINT. Local PostgreSQL 17.11/minimal synthetic fixtures are not hosted 17.6 or full-workflow equivalence. No further local run was requested or executed.

## Next genuine Product Owner gate

Authorize only the exact unchanged migration once to governed Staging `wnfahklzaxirftyskctd`, after fresh execution of both read-only chunks and immediate lock/source rechecks. Keep five-second per-lock-wait and thirty-second per-statement limits. Apply nothing on this report; do not bundle DML, fixture creation, payments, providers, workers, projection processing, existing permission changes, application-code deployment or a second apply. Unknown outcomes require read-only reconciliation and HOLD, never an automatic retry. A committed correction requires separately reviewed forward work, not deletion of history.

Post-application acceptance requires exact migration-history/source identity, both constraints/backing index, function body/posture and new trigger, and preserved prior security/catalogue/data comparisons. The backing index, internal RI triggers and one migration-history entry are expected dependencies, not unrelated additions. This is schema-application acceptance only. The rule immediately constrains legacy appointment-linked attribution/deletion even with R1a default-off; it does not deploy the operator message in update.ts or activate canonical writers.

Production and GVM were not contacted or changed. #152 historical six USD rows, #153/SEQ-ACL-1, #133, #135 Production release, retained-cohort worker eligibility, invoice/receipt/customer/communication projection recovery and supported responsive operator workflows remain open. PRs stay governed/unmerged; technician deposits/payments stay held. **GVM Operational Acceptance is not earned.** Future build, main-merge and governed Production release gates are separate, not waived by this schema-only preparation.

## Publication hygiene

The staged whitespace check reports only original padding in the hash-bound raw `postgres.log` / `sql.stdout.log` and the two intentional Markdown hard-break lines (3 and 4) in the exact reviewed PLAN.md. Those bytes are preserved rather than rewritten after hashing/review. All other authored documentation and read-only query diffs pass the check. No runtime/code/test/schema gate is waived and no full-diff whitespace-clean claim is made.

## Returned final independent report (preserved verbatim)

Verifying the corrected package hashes and recomputing the audit, then reading the correction reports and native evidence.All five hashes match exactly, and chunk 02 is byte-identical (25,495 bytes, same SHA) — confirming no rerun is needed. Chunk 01 grew from 21,089 to 24,692 bytes. Reading the correction reports and native evidence.The evidence confirms the defect was exactly at the `polcmd` concatenation I read and did not flag — a real miss on my part. Verifying the corrected source constructs now.The `42725` root cause is fixed at both the source CTE (line 435) and the concatenation (line 653), with defensive casts added throughout. Reading the new positive-check and state logic.Both corrections verify. Final sweep for hidden DML on the changed file, plus the corrected PLAN sections.All corrections verify, including F2 — which was resolved correctly as four distinct real reads, not the clock error I inferred. Final integrity checks on inputs and working tree.```
CLAUDE — FINAL SAME-PLAN DELTA REVIEW (READ ONLY) · Issue #134 / PR157
Continues session 3d8a2773-53b0-4dcf-bd9a-9a486582d09d; initial review /tmp/chasum-134-final-plan-claude-rm6lzhun/review.md.
Scope: corrected Staging application package + supplied native preparation evidence ONLY.
LOCAL_DATABASE_PROOF_ACCEPTED, foundation/R1a/C01, 11 sections/interleavings/timeout: NOT rerun, NOT reopened.

=== VERDICT ===
READY_FOR_STAGING_APPLICATION_APPROVAL — no outstanding required correction.
Both findings from my initial review (F1 git-ref pin, F2 observation provenance) are resolved, my
earlier minor trigger-enumeration gap is now closed, and the one real runtime defect the coordinator
found is fixed at source and confirmed by an actual successful native read-only execution.

=== HASHES I RECOMPUTED MYSELF (all MATCH) ===
PLAN.md        5d2113ba4ba7234f9dc0a7cd974162ad9756612817ac89cdca935a4e22d10115
preflight.sql  5f970db8d557e23c68ef587156a16425286c5d421fa288dd0e03bfd3399de64e
manifest.json  c8e64d3616a81d9c51f7dd179d2f59566fb7343cac46f9ad16ae7eeb28828855
package audit  6abdd6ff1ed79e4a7ca6c21c625c26f29b45397b2bb41b5dc8606dfecc4ae4ba
  reproduced bit-exactly via the manifest's own non-self-referential canonicalization; the value
  recomputed, the value stored in manifest.audit, and the value you supplied all three agree.
chunk_01 lines 12-664    6ba2c60d63a218da3b6101255a5ff7dd4da0c06556dd9567c95e5e6177bb96c5 (24,692 B)
chunk_02 lines 671-1363  0f1d25963292340be887002fcbf53089bdd38e0ea5a990a40789c3af04845411 (25,495 B)
  chunk_02 is BYTE-IDENTICAL to the version I reviewed initially (same SHA, same 25,495 bytes), so my
  prior source analysis of it carries over unchanged and no rerun is required for this review.
migration      fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524 · 6,529 B / 186 lines
evidence JSON  156b18c2b181028d9ade7f084f54f484ce41ac5c2d4a8bdce91a0c525cd1b43d
HEAD 732e3821858826898e0c9ec80996e643f6cf0f2c. `git diff HEAD` over supabase/ lib/ tests/ scripts/ is
EMPTY: no financial, runtime, migration, test, or accepted-proof byte changed. Only docs/query-only
preparation is uncommitted. All 9 accepted_local_evidence files and all 9 immutable_inputs MATCH.

=== CORRECTION TO MY OWN PRIOR REVIEW (stated once, no waiver) ===
My initial "executable gate sound" conclusion was source-only and was WRONG as a runtime claim. The
coordinator's real chunk 01 call failed with PostgreSQL 42725 `operator is not unique: text || "char"`
at the policy fingerprint concatenation. I had read that exact expression and did not flag that
pg_policy.polcmd is type "char", so `text || "char"` is ambiguous. No catalogue PASS existed at that
time. The failure was a read-only parse/resolution error with no mutation, which the evidence records
honestly and which the package preserves under the original erroring SHA 9830be27…3f545.
Separately, my F2 was also wrong: the 14:11–14:21 window was NOT a mislabeled 16:11 clock error. The
package now records four DISTINCT real reads — 14:11:29.973933Z–14:21:28.487580Z (dated history),
16:11:49.606823Z (preliminary, the only snapshot given to me initially), 16:29:22.098708Z (data), and
16:43:34.622352Z (corrected catalogue). I do not treat these as one record or as a clock discrepancy.

=== THE FIX, VERIFIED AT SOURCE ===
polcmd is now cast twice: at the source CTE (`policy_row.polcmd::text`) and again at the concatenation
(`polcmd::text || '|'`). The 42725 cause is eliminated. Defensive `::text` casts were added across the
history, schema-mismatch, trigger-fingerprint and enablement expressions (tgenabled was the other
latent "char" concatenation risk). Evidence: the corrected chunk 01 at the reviewed SHA
6ba2c60d…bb96c5 returned PRE_APPLY_CATALOGUE_PASS at 16:43:34.622352Z with read_only true, 17.6,
server17 true, postgres/postgres, 5s/30s budgets.

=== REQUIRED REVIEW ITEMS — ALL VERIFIED ===
Corrected dynamic before/after catalogue logic. `object_state` still resolves PRE_APPLY_ABSENT /
POST_APPLY_EXACT / PARTIAL_OR_MISMATCH inside one rerunnable artifact, so the same two chunks run
before and after with no edit between runs. Partial presence cannot read as pass.
Expected-absent is FALSE, never UNKNOWN. Pre-apply, `count(*)=2 and bool_and(empty)` → false (not
NULL); candidate_function_posture wraps bool_and in coalesce(...,false). The new-function bindings use
to_regprocedure() in BOTH places, so expected absence yields NULL/no-row rather than an eager 42883
parse failure — this is the absent-function fix and it is complete. Prerequisite functions correctly
retain strict `::regprocedure` (accepted guard plus the five accepted kernel functions), where a hard
error is the right STOP signal. Evidence confirms the asymmetry behaves as designed: candidate_exact
false, candidate_function null, candidate_constraints/triggers [] — reported as expected absence.
Positive accepted-trigger check now exists and is genuinely positive, not absence-of-problems:
count=1 AND relation_oid=commerce_transactions AND enabled='O' AND NOT internal AND tgtype=31
(ROW|BEFORE|INSERT|UPDATE|DELETE = 1+2+4+8+16, correct for the accepted attempt guard) AND function_oid
strictly bound to guard_commerce_attempt_ledger_link(). Evidence: accepted_guard_trigger_exact true.
This closes the minor enumeration gap I raised initially: `prior_target_triggers` now enumerates ALL
noninternal triggers on commerce_transactions excluding ONLY the proposed trigger name, with count,
full rows, and a sha256 over name/enabled/type/function schema+name+args/tgargs/tgattr/WHEN. Because
the candidate is the sole exclusion, this fingerprint is invariant across apply — a correct pre/post
comparator. Evidence: count 2, sha abc6ddae…63ce8, [attempt_guard, commerce_transactions_updated_at].
Same accepted baseline algorithms. chunk_02 is byte-identical, so the 18 old-cohort and four noncohort
fingerprints still use their original snapshot_expression/noncohort_expression row_to_json
serialization, and the authoritative per-table C01 serialization is unchanged. Old evidence untouched.
No hidden DML. Full keyword sweep of the corrected 1,363-line file returns ZERO occurrences of
insert/update/delete/create/alter/drop/grant/revoke/truncate/copy/vacuum/analyze/nextval/setval/merge/
do $$/pg_sleep/dblink/pg_terminate/pg_cancel/commit. Exactly 2 `begin read only;` and 2 `rollback;`,
so everything executable is inside a declared-read-only, discarded transaction. Confirmed by runtime:
transaction_read_only true on both chunks, and the 42725 failure mutated nothing.
Exact target / no activation. Project ref pinned to wnfahklzaxirftyskctd in both chunks and confirmed
out-of-band; the migration contains no DML, backfill, flag write, worker or projection enqueue; PLAN §5
forbids bundling fixture/DML/smoke write/provider or Auth call/grant/flag/second apply.
Locks, stop, no auto-retry, read-only unknown reconciliation. target_locks excludes own backend and
reported other_lock_count 0 with no rows. automatic_retry false; unknown → READ_ONLY_RECONCILE_AND_HOLD;
pre-commit failure → atomic rollback and stop; post-commit → separately reviewed FORWARD correction
only, never destructive rollback of audited history. Contention resolves by choosing a later reviewed
window, never by widening budgets or killing sessions.
Immediate legacy restriction confirmed and correctly bounded. The guard passes through when
`old.payment_attempt_id is not null OR old.appointment_id is null`, so legacy rows with NULL attempt
AND non-NULL appointment immediately freeze business/customer/appointment attribution and are refused
on DELETE, independent of R1a remaining default-off. Legacy NULL/NULL rows fall into the pass-through
branch and stay open as the #153 residual, with SEQ-ACL-1, and are not silently claimed as covered.
Post-apply expected matching and preserved prior state. Required: one history row, one 6,529-byte
statement at the exact SHA; both constraints exact/validated with a valid+ready backing index; function
body 3bfb91b068cc9422af4c17df1ed45a37119fe948be33a611e1d61cdf9aa2c2d2 (which I re-derived from the
migration's own 585-byte body) with invoker posture, exact search_path, and no EXECUTE for
PUBLIC/anon/authenticated/service_role; the enabled trigger ordered after the accepted guard. Prior
state captured for invariance: relation ACL/RLS/FORCE-RLS, 2 policies (sha fb5a9c72…a9dc), five
accepted function bodies/ACLs — including guard_commerce_attempt_ledger_link
20d443ae21823633aa97d9560b37a1816127e814da25d23e96412eb375b90e79, matching what I derived from the
foundation migration source, so hosted catalogue and local source agree — event-sequence ACL with
per-role USAGE/SELECT/UPDATE, prior-trigger baseline, history prior_rows_sha256, and full-table digests.
Clarifications I asked for are now explicit in PLAN: the backing index, internal RI triggers and the
single history entry are expected dependencies of the four named objects rather than unrelated
additions; 5s is per lock wait and 30s per statement, NOT a whole-transaction wall-clock bound; and
index-byte growth from the new unique index is an expected observation, not an immutable comparator.
Baseline data at 16:29 (chunk 02, PASS): 18/18 old-cohort and 4/4 noncohort fingerprints equal, Run02
27 rows at 42ed8dff…dd0de, 90 retained records (53 parents + 37 financial), 6 attempts (4 ACCEPTED /
2 REQUESTED), 11 events (6/4/1), 4 linked CAD ledgers totalling exactly 18,100 cents, 16 obligations
(15 PENDING / 1 NOT_REQUIRED), sequence 14/is_called, zero identity mismatches, and zero tuple
mismatches / duplicate parent triples across 5 appointment-linked rows. Catalogue at 16:43: history 12
rows with candidate absent, foundation and R1a exact, schema columns all exact, old FK exact
(`FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL`), all 15 target indexes
valid and ready, RLS enabled and FORCE-RLS off on all five relations.

=== PROVENANCE QUALIFICATIONS AND READINESS LIMITS ===
The native evidence is the coordinator's honestly normalized transcription of execute_sql results — NOT
raw tool-response bytes, NOT an unedited transport capture, and NOT my own database execution. I ran no
SQL, no verifier, no tests, no build, no database, hosted, network or credential call, no subagent, and
made no edit, commit, push, PR, worker, flag, or permission change; I did not access .supabase and did
not repeat any safety-blocked operation.
The 16:29 data read and 16:43 catalogue read are different timestamps in different transactions: they
are a sound PRE-APPLY BASELINE, not a frozen or current-at-apply snapshot, and they establish NO
freshness for a later apply. Fresh execution of BOTH chunks immediately before any approved apply is
mandatory. Hosted 17.6 versus local 17.11/minimal synthetic fixture remains a disclosed limitation
conferring no database-upgrade authority. The in-package authoring-time REVIEW_PENDING status is
superseded by this external final review; I deliberately did not touch it, to avoid hash churn.
This is schema-application readiness only — not hosted DML/PostgREST, application mapping, UI,
projection, worker, provider, or full-workflow proof. Still separate and unwaived: Vercel build/Preview
and PR157 CI; merge to main (which authorizes nothing in Production per the #136 invariant); the
governed release-production.yml path with an allowlisted exact SHA in deny-all release/candidates.json
plus protected production-release PO approval verified via /api/build-info; and #153/SEQ-ACL-1, #133,
#135, historical USD, retained-cohort worker eligibility, replacement writers/projections, technician
resumption, Production/GVM and GVM Operational Acceptance. No new user/operator/customer workflow is
authorized. Competitive Product Gate NOT_APPLICABLE remains correct: additive enforcement of an
already-accepted financial-integrity invariant with no new workflow.

=== EXACT PRODUCT OWNER GATE (approval only — do NOT apply now) ===
Nothing may be applied on this review. The single next step is explicit PO authorization naming:
  target   governed Staging project wnfahklzaxirftyskctd ONLY (Production and GVM prohibited)
  artifact supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql
  sha256   fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524 · 6,529 B / 186 lines
  package  audit 6abdd6ff…e4ba (PLAN 5d2113ba…0115, preflight 5f970db8…de64e, manifest c8e64d36…8855)
  method   native Supabase apply_migration, ONE atomic apply, ONCE, unmodified bytes, no rename/replay
Then, in order: recompute source bytes/hash; run chunk_01 and chunk_02 SEPARATELY through the native
read-only path and retain each single JSON result, requiring PRE_APPLY_ABSENT, foundation/R1a exact,
candidate history and all four objects absent, old FK and accepted guard plus its trigger binding
exact, prior-trigger and policy fingerprints unchanged, zero mismatches/duplicate triples/competing
locks, 18+4 fingerprints matched and the 90-row shape; recheck target locks immediately before
submission; apply once with nothing bundled; then rerun both chunks and require POST_APPLY_EXACT with
all prior ACL/RLS/policy/sequence/function/history/data values preserved (sizes excepted). Catalogue
presence alone is not a pass. Any deviation returns to STOP/HOLD and a new review.
```

Bottom line: **READY_FOR_STAGING_APPLICATION_APPROVAL with no outstanding required correction.** All five package hashes plus the evidence hash reproduce exactly, including the package audit via the manifest's own canonicalization, and `git diff HEAD` over `supabase/ lib/ tests/ scripts/` is empty — no financial, migration, or accepted-proof byte moved.

Two things worth your attention, both now resolved:

The coordinator's real execution caught a genuine defect my source-only review missed. I read the `polcmd` concatenation and failed to notice that `pg_policy.polcmd` is type `"char"`, making `text || "char"` ambiguous — PostgreSQL `42725`. My earlier "executable gate sound" wording was not a runtime pass and the package now records that honestly. The fix casts `polcmd::text` at both the source CTE and the concatenation, plus defensive casts on the other latent `"char"` site (`tgenabled`), and the corrected chunk 01 then succeeded at 16:43:34Z with `PRE_APPLY_CATALOGUE_PASS`.

My F2 was also wrong, and the correction is better than what I proposed: the 14:11–14:21 window was not a mislabeled 16:11: there are four distinct real reads, now provenanced separately. I've recorded them as distinct rather than merging them.

The corrected package also closes the minor gap I'd flagged: `prior_target_triggers` now fingerprints every noninternal trigger on `commerce_transactions`, excluding only the proposed one, which makes it invariant across apply. The new positive accepted-trigger check (`tgtype=31`, non-internal, strictly bound) is a real positive assertion, and the new-function bindings use `to_regprocedure()` in both places so expected absence returns false rather than erroring — while prerequisite functions correctly keep strict casts.

One limit to carry into your decision: the 16:29 and 16:43 reads are different transactions and establish a sound pre-apply baseline, not freshness. Fresh runs of both chunks are mandatory immediately before any apply, and nothing may be applied until you authorize it.