# Slice 2A Staging validation — completed

SLICE2A_STAGING_VALIDATION_PASS_RETAINED_FIXTURE

## Accepted matrix

- A1: PASS — EXACT CAD 5000 collected/deposit cents.
- A2/A3/A4: PASS — generic HELD / REFUND_EVIDENCE_INCONSISTENT.
- Critical N1 cross-Business witness: PASS, metadata plus hosted behavior.
- Customer embed and six FK hints: PASS.
- Native-response refund privacy: PASS.
- B2 foreign-customer scope: PASS, UNKNOWN and no financial root read.
- SCALE month: PASS, exact count 1, returned 1, EXACT CAD 100 payment cents.
- SCALE year: PASS, exact count 1002, returned 1000, UNKNOWN / INCOMPLETE_FINANCIAL_EVIDENCE; no numeric subtotal.
- Temporary SCALE cleanup: PASS, 1002 transactions + customer + Business removed; Auth owner and identity absent.
- Operator regression: PASS, 3 files / 37 tests.
- Side-effect audit: PASS within documented database/request-path observation limits.
- Retained A/B post-SCALE reconciliation: PASS, full-row equality.
- Application candidate: UNCHANGED.

## Identity and method

Frozen application HEAD: cf1e3ae053110f9fc4823368f05dfd73606271f5
Tree: 85bc66e8791d6a9c685f117f344c99072a94daa4
Parent: 8b653b749a3c747fc5d3923b317978ec91bfe93a
Baseline evidence commit: 49a7d0a23af0cde7fa48fcec662000f5fa338dd8
Staging: wnfahklzaxirftyskctd

Temporary validation code loaded byte-checked candidate TypeScript, exposing only its private default read method for the existing dependency seam. The classifier, select string, PostgREST read logic and service client were unchanged. Actual hosted responses were captured before SDK/classifier mapping. No validation harness or mutation tooling is committed.

Deterministic SCALE now: 2026-10-11T16:00:00.000Z, America/Toronto.
Month range: 2026-10-01T04:00:00.000Z through 2026-10-12T04:00:00.000Z exclusive.
Year begins 2026-01-01T05:00:00.000Z and uses the same exclusive end.
Month HTTP 200 / Content-Range 0-0/1.
Year HTTP 206 / Content-Range 0-999/1002.
The observed cap supports the candidate's 1000-root request. Larger scopes deliberately return UNKNOWN, not a partial subtotal.

## Retention and cleanup history

Original run: HV133-SLICE2A-STAGING-R1-20261011T041448Z-130dbf2d.
Its A1–A4 proof passed; its original SCALE setup rolled back because Owner A already owned Business A.
The final PO gate authorized one separate temporary SCALE owner, respecting businesses_one_per_owner_idx.
No new A/B cohort was created. All A/B financial and support rows remain unchanged and governed by RETAINED_FIXTURE.md.

The operator interrupted execution before cleanup completion. Fresh checks established the entire temporary SCALE set remained. A subsequent cleanup transport error also produced no deletion. The final bounded transaction locked the SCALE Business/transactions, verified exact IDs, null financial links and all expected table counts, then deleted exactly the approved rows. Read-only checks proved zero SCALE rows; only then was the temporary owner deleted. Final SQL verified zero Auth users/identities for that owner.

## Local regression

npm test -- --run tests/unit/commerce/operator-financial-state.test.ts tests/unit/commerce/payment-observability-reader.test.ts tests/unit/reception/payment-result-disclosure.test.tsx

17 + 17 + 3 tests passed. RECORDED, RECORDED_BUT_NOT_FULLY_SYNCHRONIZED and UNKNOWN remain noncollectible; stale PENDING/RECOVER cannot supersede canonical recorded/COMPLETE state.

## Safety and limits

No Production, GVM, HQ, schema/migration/security change, application edit, browser/UI acceptance, Slice 2B, provider, worker, cron, communication, push, PR, merge or deployment. No external provider dashboard was queried. Run-scoped communication/job/document counts and inspected trigger paths showed no unexpected side effects.

GitHub #153 interface note: PENDING MANUAL GOVERNANCE RECORDING by Darshan/ChatGPT after implementation reconciliation.

Dependencies remain service-role BYPASSRLS, SELECT privileges and six FK hints. No embedded aggregate configuration is required.

Return this report to Darshan/ChatGPT for reconciliation. Do not begin Slice 2B, merge, deployment, Production work, GVM work, technician deposit resumption, or any additional hosted action without a new Product Owner gate.
