# Issue #134 — Staging attribution application result

**Status:** `STAGING_SCHEMA_APPLICATION_ACCEPTED`
**Target:** governed Staging project `wnfahklzaxirftyskctd` only
**Source HEAD:** `2d95cd2158b931310a8de754baaa2c9cfbe4407d`

## Authority and exact application

Darshan explicitly approved the final reviewed Staging-only gate. ChatGPT then used the native Supabase path to apply exactly once, with no retry:

- migration: `supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql`;
- source/payload SHA-256: `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`;
- size: 6,529 bytes / 186 lines;
- frozen package audit: `6abdd6ff1ed79e4a7ca6c21c625c26f29b45397b2bb41b5dc8606dfecc4ae4ba`;
- native response: `success: true`;
- hosted history: `20261007170242 / issue_134_appointment_financial_attribution`, exactly one stored 6,529-byte statement at the approved SHA.

The retained evidence is [a normalized selected coordinator transcription](evidence/issue-134-attribution-staging-application.json), SHA-256 `b272c73746f7730343badb5a3422914f91721356c65346e15d92126daedc6504`. It is not raw transport capture and not reviewer database execution. Claude subsequently completed the independent result review and returned `STAGING_SCHEMA_APPLICATION_ACCEPTED`, with no required correction. The evidence JSON retains its capture-time pending classification; this external result supersedes that status only, without changing its bytes.

## Native pre/post results

Preapply catalogue at `2026-10-07T16:59:15.935250Z`, data at `17:00:58.463234Z`, and immediate lock/source check at `17:01:41.868174Z` were read-only. They showed exact prerequisites, `PRE_APPLY_ABSENT`, zero candidate history and zero competing target locks.

Postapply catalogue at `17:04:22.453440Z` and data at `17:06:15.236808Z` were read-only and returned `POST_APPLY_EXACT`:

- exact validated unique key and valid/ready 16,384-byte backing index;
- exact validated immediate composite FK, `MATCH SIMPLE / UPDATE RESTRICT / DELETE NO ACTION`;
- exact invoker function body/search path with direct EXECUTE denied to PUBLIC/anon/authenticated/service_role;
- exact enabled noninternal trigger and accepted guard-first order;
- prior history, accepted functions, ACL/RLS/FORCE-RLS, policies, prior target triggers and sequence ACL unchanged;
- expected appointments index/total growth only: 114,688→131,072 and 163,840→180,224 bytes.

All 18 accepted old-cohort and four noncohort fingerprints, the 27-row Run02 financial digest and all 20 returned full relevant-table count/digests were unchanged. Tuple, identity and duplicate-parent mismatch counts remained zero. The retained cohort remained 90 rows: 53 parents + 37 financial, six attempts, 11 events, four linked CAD ledgers totalling 18,100 cents, 16 obligations (15 PENDING / one NOT_REQUIRED), sequence 14/called.

## Independent result review and precise limits

Claude continued the accepted application-plan review session and returned `STAGING_SCHEMA_APPLICATION_ACCEPTED`. Sol prepared only the documentation/evidence closeout; Claude independently checked source/evidence hashes, the documentation diff, and consistency of the supplied native observations. Neither agent reran SQL, tests, the accepted local proof, or a build. [Returned report, preserved verbatim](issue-134-staging-attribution-application-review.md), SHA-256 `439aa0bc3c50dbc9bfedaf4919b391327bb7e4cb59c3012ab8836997b81bd3a9`.

Coordinator qualifications: the unchanged prior-history fingerprint covers the selected version/name/statement-count/length/first-statement-hash representation returned by the reviewed query; it is not a bytewise audit of every migration-history metadata field. Preservation of payment and obligation state rests on the recorded counts and row digests, not the event sequence alone. Expected 16,384-byte index growth is a scoped catalogue/storage observation, not a whole-database claim. Native pre/post reads occurred in separate transactions; the reviewer used an explicitly selected normalized coordinator transcription, not an independent database session or raw transport capture.

The accepted local result and frozen application package remain byte-identical. The migration source filename and hosted migration version intentionally differ and are mapped by exact SQL bytes/hash, not renamed. The stale PR description must not override this current result or trigger another application.

## Limits and continuation

This is exact Staging schema-application evidence only. No hosted DML/PostgREST, UI, booking/payment, projection, worker, provider or full-workflow behavior was tested. R1a remains unwired/default-off. No retained obligation was processed; no fixture/payment, historical USD repair, permission/flag change, PR merge, Production/GVM action, #135 release or technician resumption occurred. #153/SEQ-ACL-1, #133, retained-worker eligibility, application-code deployment and operational acceptance remain open.

Next safe preparation is bounded read-only/design work on the #153 legacy NULL/NULL durability and SEQ-ACL-1 dependencies, replacement writer/projection and durable-booking recovery requirements, and #133 evidence for connected acceptance. Permissions must not be cut over before replacement paths are ready. Any new implementation, hosted behavioral test, activation or application deployment still requires its own applicable reviewed gate. No further Product Owner decision is required for this completed application.
