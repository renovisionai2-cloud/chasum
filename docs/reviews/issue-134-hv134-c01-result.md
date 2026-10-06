# Issue #134 — HV134 C01 actual result

## Verdict

**C01 EXECUTED / LIMITED_HOSTED_C01_PASS / CLAUDE ACCEPTED.**

This is a bounded hosted Staging result for continuation `HV134-20261006-C01`, not GVM Operational Acceptance. The accepted source package aggregate remains `3469a233362a77d6a28e3cf45cd7e3d655720bd20ed4bae23411c093591bc6bc`; all five package members and all nine immutable source pins match. The preparation record remains unchanged at [the C01 gate review](issue-134-hv134-continuation-c01.md).

## Evidence identity and provenance

- Original append-only evidence: [`../validation/issue-134-r1a-continuation/evidence/HV134-20261006-C01/evidence.jsonl`](../validation/issue-134-r1a-continuation/evidence/HV134-20261006-C01/evidence.jsonl), exactly 38 lines, SHA-256 `b452e9f8f850571989526b36bacbcf3868daff6e240b4d4ec1dac42a6e292a94`.
- Execution evidence spans `2026-10-06T17:56:42.147Z` through `17:56:56.371Z`. The final record is `LIMITED_HOSTED_C01_PASS`.
- Coordinator native database corroboration is dated `2026-10-06T18:00:10.778193Z`, with a final containment check through approximately `18:02 UTC`; these are supplied completed-task observations, not database reads rerun by this closeout. The redacted durable summary is [recorded here](evidence/issue-134-c01-result-readonly.json).
- Published PR #156 records: [actual result](https://github.com/renovisionai2-cloud/chasum/pull/156#issuecomment-6022416266) and [independent adjudication](https://github.com/renovisionai2-cloud/chasum/pull/156#issuecomment-6022434550).

## Actual bounded result

The observer precheck first recorded a negative read, then positively witnessed a real service-role advisory-lock waiter and its blocker. The C1 holder subsequently witnessed two real workers: one blocked directly and one indirectly through the recursive blocker chain.

Both saved worker replies identify attempt `d211130f-02a9-47c5-a14a-6f91e7c08480` and transaction `4c2dd317-f6e0-418a-bda1-ff13250ae712`, with exactly one `RECORDED` and one `REPLAY`. A separate durable read then proved one accepted C1 attempt, two events, one CAD1 manual cash ledger effect, four obligations, and reply-to-durable identity agreement.

Only after those four checks matched did N1 admit as request-only. Final bounded state:

- 90 public rows: 53 original parents plus 37 financial rows;
- 6 attempts / 11 events / 4 linked ledgers totalling CAD181;
- 16 obligations: 15 `PENDING` and one customer-only appointment-cache `NOT_REQUIRED`;
- sequence `14`, `is_called=true`;
- C1 `ACCEPTED`; N1 and retained R1 `REQUESTED`;
- two retained synthetic Auth users and identities;
- zero tuple mismatches, unique attempt links, and no active test session in the dated native read.

All 18 old-cohort snapshots and all four explicitly checked noncohort baselines remained unchanged. This is scoped preservation evidence only. It is **not** a claim that every table or the whole database was unchanged.

## Independent Claude adjudication

The accepted independent report was produced as a Claude Ask/read-only review from the supplied result bundle (`/tmp/chasum-c01-result-review-jtlq_k0o/claude-report.md` plus `coordinator-native-summary.json`). Claude read the exact 38-line evidence, package contract and implementation, preparation review, continuity records and supplied native summary. Claude performed no SQL, network call, mutation or execution and classified the result:

> LEGITIMATE LIMITED_HOSTED_C01_PASS — ACCEPTED WITHIN ITS THREE DECLARED LIMITS.

Claude tied the direct/indirect wait witness to the two returned backend identities, verified the exact reply pair and separate durable reconciliation, checked arithmetic and ordering, and accepted the native summary only as supplied coordinator corroboration. Claude could not independently recompute hashes because its Ask-mode shell calls were refused; this closeout independently recomputed the evidence SHA, package aggregate, five member hashes and all nine immutable pins. The report also noted untimestamped assertion records and the formerly untracked evidence directory as documentary provenance limitations; committing the byte-identical evidence closes the latter.

## Limits and remaining gates

- Run02 remains **STOPPED / PARTIAL**. Its original F1 `RECORDED` + `REPLAY` replies remain missing; C01 does not recreate or replace them.
- C1 is customer-only and has no appointment. There is no appointment-customer binding/reassignment proof.
- No complete booking/payment/invoice/receipt/CRM/communications, UI/operator, responsive or provider workflow was exercised.
- R1a remains unwired/default-off. #153/SEQ-ACL-1, projection/disclosure work and permission cutover remain open.
- No Production or GVM action occurred, no technician workflow is accepted, and **GVM Operational Acceptance is not earned**.
- The retained synthetic cohort must be explicitly gated/excluded before any worker activation.

The C01 concurrency-oracle harness question is closed. Do not rerun C01 or start another payment. The next runtime/product task remains separately governed and is not started by this factual closeout.
