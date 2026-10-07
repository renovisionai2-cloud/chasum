Verifying the new HEAD, evidence hash, and that the approved source artifacts are unchanged.HEAD, evidence hash, the frozen package, and the 6,529-byte migration all verify, with no code drift. Reading the native evidence.Evidence is internally consistent. Now the Sol report and the new documentation diff for continuity truth.The docs evidence copy is byte-identical to the native evidence. Reading the continuity diff and new result doc.Continuity updates are truthful with prior states explicitly marked historical. Reading the new result doc and Sol report.Final integrity cross-check: re-deriving the applied function body hash from source and confirming accepted evidence is untouched.```
CONTROL-TOWER REPORT — INDEPENDENT STAGING APPLICATION RESULT / DOCUMENTATION REVIEW
Issue #134 / PR157 · continues accepted application-plan review session 3d8a2773-53b0-4dcf-bd9a-9a486582d09d
Scope: actual application result + documentation ONLY. Foundation/R1a/C01 and the accepted local proof
were not restarted or reopened. The reviewed source plan was not redone.

================================================================================
VERDICT: STAGING_SCHEMA_APPLICATION_ACCEPTED
================================================================================
Within the exact reviewed scope — governed Staging schema application of the approved 6,529-byte
migration, verified by fresh read-only pre/post checks — I find no contradiction and no HOLD.
This is NOT GVM Operational Acceptance, NOT technician resumption, NOT hosted behavior/workflow
acceptance, and NOT application-code deployment. It is schema-application acceptance only.

================================================================================
1. IDENTITIES I RECOMPUTED MYSELF (direct local verification)
================================================================================
source HEAD          2d95cd2158b931310a8de754baaa2c9cfbe4407d  ✓ as required
                     (2d95cd2 "docs: publish accepted #134 proof and reviewed Staging application gate",
                      parent 732e382 — the HEAD of my prior plan review)
migration            fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524
                     supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql
                     6,529 bytes / 186 lines — unchanged, byte-for-byte the artifact I reviewed.
frozen package       PLAN.md        5d2113ba4ba7234f9dc0a7cd974162ad9756612817ac89cdca935a4e22d10115
                     preflight.sql  5f970db8d557e23c68ef587156a16425286c5d421fa288dd0e03bfd3399de64e
                     manifest.json  c8e64d3616a81d9c51f7dd179d2f59566fb7343cac46f9ad16ae7eeb28828855
                     audit          6abdd6ff1ed79e4a7ca6c21c625c26f29b45397b2bb41b5dc8606dfecc4ae4ba
                     All identical to my final delta review. The frozen package was not mutated.
native evidence      b272c73746f7730343badb5a3422914f91721356c65346e15d92126daedc6504 ✓ matches stated
                     The repository copy docs/reviews/evidence/issue-134-attribution-staging-application.json
                     is byte-identical to the /tmp original (same SHA, parsed JSON equal). No divergence
                     between the published record and the evidence it cites.
accepted evidence    local summary cb0b975a…62418 and C01 evidence.jsonl b452e9f8…92a94 both UNCHANGED.
source cleanliness   `git diff HEAD` over supabase/ lib/ tests/ scripts/ is EMPTY. Application code,
                     migration, tests and verifier are unchanged. Uncommitted work is documentation only
                     (5 continuity files, 1 new result doc, 1 evidence JSON).

DECISIVE INDEPENDENT CORROBORATION. I re-derived, from the approved migration's own bytes, the body
hash of the function the postcheck reports as created in Staging:
  derived from source  3bfb91b068cc9422af4c17df1ed45a37119fe948be33a611e1d61cdf9aa2c2d2
  hosted postcheck     3bfb91b068cc9422af4c17df1ed45a37119fe948be33a611e1d61cdf9aa2c2d2  ✓ equal
and likewise the preserved accepted guard body from the foundation migration source:
  derived from source  20d443ae21823633aa97d9560b37a1816127e814da25d23e96412eb375b90e79
  hosted postcheck     20d443ae21823633aa97d9560b37a1816127e814da25d23e96412eb375b90e79  ✓ equal
This is the honest form of the "unchanged submitted migration" proof: the stored statement and created
object hash-match the reviewed source independently. I make NO claim about SQL transport bytes; I did
not capture transport and do not assert it.

================================================================================
2. DIRECT REVIEW vs SUPPLIED OBSERVATION — PROVENANCE BOUNDARY PRESERVED
================================================================================
DIRECTLY VERIFIED BY ME (local files/git/hash only): every identity in section 1; internal consistency
and arithmetic of the evidence; truthfulness of the documentation diff; absence of code drift.
SUPPLIED COORDINATOR OBSERVATION (normalized selected transcription of native get_project /
execute_sql / apply_migration responses — NOT raw transport bytes, NOT my database execution): all
hosted catalogue/data values, the before/after comparison of the 20 full-table digests and 18+4
fingerprints, PRE_APPLY_ABSENT and POST_APPLY_EXACT, and `success:true`. I did not observe the database.
I executed no SQL, no verifier, no test, no build, no cluster; contacted no Supabase/GitHub/provider/
Production/GVM endpoint; read no secrets or .supabase; mutated/committed/pushed nothing; opened no
subagent; bypassed no restriction.

================================================================================
3. ADJUDICATION OF EACH REQUIRED CHECK
================================================================================
POST_APPLY_EXACT ...................... ✓ returned, after PRE_APPLY_ABSENT at 16:59:15Z/17:00:58Z and an
   immediate 17:01:41Z lock+source recheck showing zero candidate history and zero competing locks.
   Apply at 17:04-postcheck boundary: calls=1, no_retry=true, `success:true`. Single apply honored.
Single history statement/hash ........ ✓ exactly one stored statement, statement_count 1,
   statement_bytes 6529, statement_sha256 fd673cbf…3e7524 under 20261007170242.
12→13 rows, prior digest unchanged ... ✓ and this is the strongest preservation proof in the package:
   post-apply history_prior_sha256 = 865a9ec00fa6fa67d5321e0e9946423ff76111737a7522068574742ce3e18dd9
   is IDENTICAL to the pre-apply history_all_sha256. The 12 pre-existing rows are bit-identical; the
   only delta is the single new candidate row (all_sha256 moved to c1714d4a…7386, as it must).
   foundation_exact and r1a_exact remained true. No renaming or replay of history occurred.
New constraint properties ............ ✓ unique key appointments_id_business_customer_financial_key on
   (id, business_id, customer_id), validated, not deferrable, backing index unique+valid+ready.
   ✓ composite FK commerce_transactions_appt_business_customer_financial_fk,
   (appointment_id, business_id, customer_id) → (id, business_id, customer_id), validated, not
   deferrable, confmatchtype 's', confupdtype 'r', confdeltype 'a' = MATCH SIMPLE / UPDATE RESTRICT /
   DELETE NO ACTION. Exactly the reviewed source semantics, not transposed.
New function properties .............. ✓ body hash source-derived (above), security_invoker true,
   proconfig ["search_path=pg_catalog, pg_temp"], owner postgres, acl {postgres=X/postgres}. EXECUTE
   false for PUBLIC, anon, authenticated and service_role — the migration's REVOKE took effect.
New trigger properties ............... ✓ enabled 'O', tgtype 27 (ROW|BEFORE|DELETE|UPDATE = 1+2+8+16),
   non-internal, on commerce_transactions, bound to the new function; guard order is
   [attempt_guard, legacy_appointment_attribution_guard] so the accepted guard still fires first.
Old guards and privileges preserved .. ✓ accepted_guard_exact and accepted_guard_trigger_exact true;
   old appointment FK still exact (ON DELETE SET NULL) and coexists with the new NO ACTION FK as
   designed; all five accepted function bodies unchanged with prosecdef false, identical search_path
   and acl {postgres=X,service_role=X}; relation owner/RLS true/FORCE-RLS false unchanged on all five
   relations with identical ACL strings; policies count 2 at sha fb5a9c72…a9dc unchanged; prior target
   triggers count 2 at sha abc6ddae…63ce8 — the same value I verified pre-apply at 16:43 in my delta
   review, which is exactly why that comparator was built to exclude only the candidate; event-sequence
   ACL unchanged with anon/authenticated UPDATE still false. No privilege was widened.
No data/obligation processing ........ ✓ 18/18 old-cohort + 4/4 noncohort fingerprints equal; Run02
   27 rows at 42ed8dff…dd0de equal; all 20 full relevant-table count/digests unchanged; retained cohort
   still 90 rows (53 parents + 37 financial); obligations still 16 = 15 PENDING + 1 NOT_REQUIRED with
   c1_not_required_appointment_cache true. Nothing was processed, completed or advanced.
No financial retry ................... ✓ attempts remained 6 (4 ACCEPTED / 2 REQUESTED) — the two
   REQUESTED attempts were neither retried nor advanced; events remained 11 (6 REQUESTED / 4 ACCEPTED /
   1 KEY_CONFLICT) with no new conflict; sequence still last_value 14 / is_called true, so no event row
   was generated; 4 linked CAD ledgers still total exactly 18,100 cents. Zero tuple, identity and
   duplicate-parent mismatches across 5 appointment-linked rows.
Correct expected index growth ........ ✓ and the arithmetic closes exactly: valid+ready indexes 15→16
   (one new); appointments index_bytes 114,688→131,072 (+16,384) and total_bytes 163,840→180,224
   (+16,384), equal to the reported new_index_bytes 16,384. Growth is wholly attributable to the single
   unique backing index — no unexplained storage or object delta.
Schema-only, not full workflow ....... ✓ consistently stated in the evidence limits, the result doc and
   all four continuity files. No hosted DML/PostgREST/UI/payment/projection/provider test is claimed.
Version mapping ...................... ✓ hosted 20261007170242 maps to source filename 20261007012529 by
   exact 6,529 bytes and fd673cbf…3e7524. Neither the source file nor history was renamed to align
   timestamps — the same divergence pattern already true of foundation and R1a. Correct handling.

================================================================================
4. CONTINUITY DOCUMENTATION — REVIEWED FOR TRUTH
================================================================================
Accurate and properly layered. Each of CHANGELOG, CURRENT_PROJECT_STATE, LATEST_HANDOFF,
ENVIRONMENT_MANIFEST and the issue review now leads with the applied state, cites the same migration
SHA / package audit / hosted version / evidence SHA that I recomputed, and carries "Do not reapply."
New state and prior dated states are explicitly separated: the earlier gate text is retained under
"Preparation history — superseded", "Historical preparation record" and "Historical authoring-time
package status … retained only as chronology", and the 14:11–14:21, 16:11, 16:29 and 16:43 reads remain
distinct historical observations rather than being merged or restated as current. The dated
2026-10-03 / PR131 Production serving evidence is correctly left untouched with no new Production claim.
Every document discloses schema-only scope, R1a unwired/default-off, and the open holds. The frozen
package's authoring-time status is correctly described as superseded rather than edited, avoiding hash
churn. The one status now stale is "independent result review pending" in all five documents — this
report resolves it; no other correction is required.

================================================================================
5. MATERIAL LIMITS OF THIS ACCEPTANCE
================================================================================
- Evidence is a normalized SELECTED coordinator transcription, not raw transport bytes and not my own
  database observation. Complete native responses live only on the originating conversation surface.
- Pre and post reads are separate read-only snapshots at distinct timestamps, not one globally frozen
  snapshot; they bound the apply window, not all time.
- Scoped rows and scoped security only. This is explicitly NOT a whole-database or provider security
  audit, and I make no such claim.
- No hosted DML, PostgREST, UI, booking/payment, projection, worker or provider behavior was tested.
- Hosted 17.6 vs the accepted local 17.11 minimal synthetic fixture remains a disclosed limitation and
  confers no database-upgrade authority.
- Live consequence now active even with R1a default-off: legacy rows with NULL payment_attempt_id and
  non-NULL appointment_id have frozen business/customer/appointment attribution and are refused on
  DELETE. Legacy NULL/NULL rows remain the bounded #153 residual, with SEQ-ACL-1.
- Open and unaffected: #153/SEQ-ACL-1 cutover, #133 observability, #135 release, historical USD rows,
  retained-cohort worker eligibility, replacement writers/projections, application-code deployment,
  technician resumption, Production/GVM, and GVM Operational Acceptance (unearned).
- Separate and unwaived: Vercel build/Preview and PR157 CI; merge to main (which authorizes nothing in
  Production per the #136 invariant); and the governed release-production.yml path with an allowlisted
  exact SHA in deny-all release/candidates.json plus protected production-release approval verified via
  /api/build-info against the exact promoted deployment identity.

================================================================================
6. PRECISE NEXT ALREADY-AUTHORIZED READ-ONLY / DESIGN / PREPARATION ACTION
================================================================================
Toward connected GVM acceptance, the next step needs no new approval because it executes nothing:
  Author a bounded, read-only #153 closure and connected-behavior design package — covering the legacy
  NULL-attempt/NULL-appointment durability gap and SEQ-ACL-1 — that states the intended invariant, the
  exact objects or runtime changes it would require, its pre/post read-only verification contract in
  the same style as the now-proven preflight chunks, and its explicit non-goals. Pair it with a
  read-only review of what #133 observability must emit for connected acceptance to be measurable.
Permitted within that step: local file/git/hash/source inspection and document authoring only.
Excluded until a real gate: any hosted DML or behavior test, R1a wiring or activation, flag/permission
change, obligation processing, application deployment, PR merge, Production/GVM action, and technician
resumption. The stale PR body remains untouched; do not retry previously blocked PR operations.
RECOMMENDATION ON APPROVALS: request no new Product Owner authorization now. The design and read-only
preparation above should proceed and complete first; seek approval only when a genuinely consequential
execution or implementation gate requires it, and then for one exactly specified, bounded action.
```

Bottom line: **STAGING_SCHEMA_APPLICATION_ACCEPTED** — I found no contradiction within the reviewed scope.

The strongest independent check available to me without touching the database: I re-derived the created function's body hash from the approved migration's own bytes and it equals what the hosted postcheck reports (`3bfb91b0…c2d2`), as does the preserved accepted guard derived from the foundation migration (`20d443ae…90e79`). That corroborates the applied object came from the exact reviewed source without my needing to claim any transport capture — which I explicitly do not claim.

The cleanest preservation proof in the evidence is the history digest: the post-apply `history_prior_sha256` is identical to the pre-apply `history_all_sha256` (`865a9ec0…18dd9`), so the 12 pre-existing rows are bit-identical and the only delta is the single new row. Index growth also closes exactly — 15→16 indexes with both `index_bytes` and `total_bytes` up precisely 16,384, matching the reported new index size, so there's no unexplained object or storage delta. And nothing was processed: attempts stayed 6, events 11, and the sequence stayed at 14/called, which rules out any financial retry or obligation advance.

Verified locally: HEAD is `2d95cd2`, the migration is unchanged at 6,529 bytes/`fd673cbf…7524`, the frozen package hashes are identical to my delta review, `git diff HEAD` over `supabase/ lib/ tests/ scripts/` is empty, and the published evidence JSON in the repo is byte-identical to the `/tmp` original.

Two things to keep in view: the hosted version `20261007170242` must stay mapped to source `20261007012529` by bytes and hash rather than renamed, and the legacy attribution/delete restriction is now live even with R1a default-off, with NULL/NULL rows still the bounded #153 residual. The only stale text left is "independent result review pending" in the five continuity docs, which this report resolves.

For next steps I'd keep it approval-free: author the read-only #153 closure and connected-behavior design package with its verification contract, plus a read-only look at what #133 must emit for connected acceptance to be measurable. I'd hold off on any new authorization request until a real execution gate needs one.