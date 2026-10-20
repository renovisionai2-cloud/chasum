# CHASUM GVM-FIN-A1B — approved fixture correction and complete-run evidence

## Verdict
GVM_FIN_A1B_BLOCKED — EVIDENCE/CONTRACT, not missing approval or a new execution failure. The authorized full invocation reached the end with exit 0 and no assertion failures, but the unchanged runner explicitly returns LOCAL_PROOF_INCOMPLETE. Required D09 and C09 subcases remain NOT_PROVEN. No claim of complete proof, independent acceptance, Production readiness or GVM operational acceptance.

## Authority and source
Darshan explicitly approved only availability-cases.mjs correction and ONE new fresh PostgreSQL 17 invocation. Starting remote PR #164 HEAD 8c0a2c92ea7da3438016e1aeaa90c09fe6b93720 / tree b5e5b93535a5a31f38946785487af312a59ff037, OPEN/DRAFT. Main 80968d24dc1d87407205e54ccc949433ed39e8eb unchanged; not merged/rebased. Starting accepted local parser commit 5ea8bccb5b50d5d550b018cfc18f044e6b277617 / tree 6e80f3f3023112eda0b80550388dfcb0fd98e3e8 preserved.
New tested local HEAD 1ecdd9bd40a413859ad045209dbf1cbb69f8f9a4, tree d7c357e9ab58e1e093b7a838111e12a761441eea; parent 5ea8bccb5b50d5d550b018cfc18f044e6b277617. Existing detached checkout /private/tmp/chasum-fin-a1 reused safely. Only availability-cases.mjs changed: +5/-4, generated foreignLocation, one Location owned by ids.other with valid name/slug/UTC timezone, foreign service and staff both reference it. All code after setup byte-identical; parser source/test byte-identical to accepted local source. No primary fixture or assertion changes.

## Static proof and preservation
PASS: in-memory capture of actual runAvailability setup verifies distinct UUIDs, foreign Business ownership, both metadata references, exactly three foreignLocation uses, and no NULL inserts. No PostgreSQL invoked by this test. All 39 parser tests PASS. Node syntax/diff/scope checks PASS. Prior archive and every member verified. All 787 previous evidence files preserved (including 98 historical tracked files and the A1 raw/package files).
D1 SHA256 0caf4f79ce43088520313728b4d3cd77758b0aa066f8f2f776f4714f9ebff6ed.
Migration SHA256 3c5179f29f53678ec51798d6fb2929448cba98cf64bd7c44a1d6c796e56eb3a1.
Protected hashes verified before and after. No lifecycle SQL, migration, generator, oracle, application, RLS/grant or release changes.

## One-run isolation
Run 53740c40-e5ff-42e1-acca-9c6c654b1b1f; 2026-10-20T00:58:07.627Z–2026-10-20T00:58:28.785Z UTC (October 19 America/Toronto).
PostgreSQL 17.11 / 170011, fresh PGDATA /private/tmp/chasum-d1-pg17-YaWBjs/pgdata; private socket /private/tmp/chasum-d1-pg17-YaWBjs/socket; TCP listen_addresses empty. Scrubbed process and child environments, empty pgpass/service files, explicit local socket connections, zero public tables before dependencies. Synthetic Businesses only; no hosted database or credentials. ONE invocation; no second run. 99-stop.log confirms clean stop, PID/socket absent, independent OS and pg_ctl checks confirm no server running.

## Fresh capability matrix
All 28 PASS with preimage, expected SQLSTATE 55000, distinct rollback backend and catalog equality: 16 direct-role, 4 PUBLIC, 8 inherited/SET ROLE cases. Full 28-case inventory in review.json. No historical credit transferred.

## Dedicated availability inventory
- qualified-neutral-service-staff-correction: PASS
- mapped-location-correction: PASS
- existing-service-before-conflict: PASS
- existing-service-before-boundary: PASS
- existing-service-after-conflict: PASS
- existing-service-after-boundary: PASS
- existing-staff-before-conflict: PASS
- existing-staff-before-boundary: PASS
- existing-staff-after-conflict: PASS
- existing-staff-after-boundary: PASS
- greatest-before-not-sum-conflict: PASS
- greatest-before-not-sum-boundary: PASS
- greatest-after-not-sum-conflict: PASS
- greatest-after-not-sum-boundary: PASS
- existing-service-cleanup-conflict: PASS
- existing-service-cleanup-boundary: PASS
- after-plus-cleanup-conflict: PASS
- after-plus-cleanup-boundary: PASS
- raw-named-staff-overlap: PASS
- raw-left-half-open: PASS
- raw-right-half-open: PASS
- self-without-exclusion: PASS
- self-excluded: PASS
- cancelled-does-not-reserve: PASS
- configured-double-booking-validator: PASS
- configured-double-booking-physical-exclusion: PASS
- missing-service_id-null: NOT_PROVEN
- missing-service_id-nonexistent: NOT_PROVEN
- missing-staff_id-null: NOT_PROVEN
- missing-staff_id-nonexistent: NOT_PROVEN
- foreign-service_id-raw-overlap: PASS
- foreign-service_id-buffer-isolation: PASS
- foreign-staff_id-raw-overlap: PASS
- foreign-staff_id-buffer-isolation: PASS
- staff-duration: PASS
- service-duration: PASS
- service-qualification: PASS
- location-mapping: PASS
- service-conflict: PASS
- cleanup-10:30-lifecycle: PASS
- cleanup-10:35-lifecycle: PASS
- overlapping-self-reschedule: PASS
- DST-spring: PASS
- DST-fall: PASS

40 PASS / 4 NOT_PROVEN. Missing service/staff null/nonexistent anomalies were refused by unchanged NOT NULL/FK constraints; the anomalous runtime fallback remains NOT_PROVEN, as explicitly allowed by the harness/contract. Foreign service/staff raw overlap and buffer isolation PASS with valid foreign metadata setup. Cleanup 10:30 returned CONFLICT without effect; 10:35 returned APPLIED with exact revision/journal/time and money preservation. Spring/fall DST both observed 1,800 elapsed seconds and rollback preservation. No disabled constraints.

## Lifecycle and concurrency inventory
- D01: PASS
- D02: PASS
- D03: PASS
- D04: PASS
- D05: PASS
- D06: PASS
- D07: PASS
- D08: PASS
- D09: NOT_PROVEN
- D10: PASS
- D11: PASS
- D12: PASS
- D13: PASS
- D14: PASS
- D15: PASS
- C01: PASS
- C02: PASS
- C03: PASS
- C04: PASS
- C05: PASS
- C06: PASS
- C07: PASS
- C08: PASS
- C09: NOT_PROVEN
- C10: PASS
- C11: PASS
- D12-E: PASS
- D12-F: PASS
- D14-E: PASS
- D14-F: PASS
- D14-G: PASS

157 subcase assertions recorded; verbatim list in review.json. Actual session schedules and lock observations preserved in raw observations.jsonl and logs. C09 membership deletion and owner transfer executed both winner orders; the missing downgrade case is not credited. No entire-group upgrade of partial proof.

## Final invariants
Protected function catalog PASS; final catalog equality PASS. Actual non-super session authenticator -> service_role reported super=false and OWNER_ESCALATION_DENIED. Final background_jobs, calendar_connections, notification_logs, notifications, waitlists and webhook_endpoints counts all zero. Completed D12-E/F and D14-E/F/G prove the recorded local financial/customer/tenant/replay distinctions; UNKNOWN is not inferred zero/unpaid. Actual application A1/A2 orchestration and hosted privilege equivalence remain NOT_RUN and separately scoped.

## Remaining mandatory proof limits
D09: Revision 0/1/2, reset/skip/MAX assignment and malformed permits are refused at runtime. A legitimate current revision of INT64_MAX cannot be constructed without ~9e18 valid edits or weakening guards; actual successor overflow branch is SOURCE-PROVEN only.
Source: final-cases.mjs:40; migration overflow guards at lines 419/514/653/811. Direct MAX assignment rejection does not execute the legitimate successor-overflow branch.
C09: Deletion and owner transfer executed both orders. Downgrade to an unauthorized membership role cannot be constructed: unchanged business_members_role_check admits only owner/admin. The attempted employee downgrade was rejected in run 640c9cf9; no constraint was changed.
Source: concurrency.mjs:141–142. Its reference to old run 640c9cf9 is historical wording in the unchanged runner; no fresh downgrade rejection is claimed here.

These are EVIDENCE/CONTRACT limits, not newly demonstrated SQL/harness defects. Under the dispatch's rule that incomplete required cases prevent complete proof, no full PASS or source push is permitted. Smallest next action is a bounded ChatGPT/PO disposition of these two named proof obligations: approve a specific non-weakening proof method, or explicitly adjudicate acceptance of documented source/structural evidence. No automatic waiver, code change or rerun. Any additional source path or full invocation needs new authorization. No broad redesign proposed.

## Evidence integrity
1260 untouched raw runner files retained in ../53740c40-e5ff-42e1-acca-9c6c654b1b1f/.
raw-evidence.zip: 1272 members; fixed member timestamps, deterministic order, member SHA256 checked after archive creation; no physical cluster included.
Archive SHA256 9e8548c648c0adae4b984cb423468446ac054395baf1c718697cc4e684a50c2e.
MEMBER_SHA256.json aggregate SHA256 d3e0cfdd6e9d58f39f7e0f04c5bf90f3cdb0529ab3f878e5fa5d5bb14bba49ff.
Includes raw evidence, static/parser logs, source diff/identity, server log/config and historical preservation manifest. review.json carries all case statuses and limits. SHA256SUMS covers report/review/archive. Prior A1 archive remains d5b77fbce98ac2d10a2e457f0baaecba9a5911cace902de3cf3793c8bb347752 unchanged.

## Delivery boundary
Local source commit/evidence preserved, no push under conditional complete-proof success rule. PR #164 stays Draft/unmerged at original remote head. A truthful evidence-only PR note may link this local package and disclose the unresolved gate. No Production/Staging/GVM/HQ/database access, hosted migration, financial activation, payment/provider/worker activity, communications, historical repair, merge, deploy or specialist dispatch. GVM deposits HELD.

Next: ChatGPT reconciliation; manually dispatched narrow Claude review may assess the evidence and two limitations, but complete-proof audit readiness is not claimed. Subsequent application financial workflow, hosted/security, device, communications and Production/GVM gates remain separate.
