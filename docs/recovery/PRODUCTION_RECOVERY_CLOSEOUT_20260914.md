# Production recovery closeout — 2026-09-14

**PRODUCTION RECOVERY = CLOSED. Phase 5 = IN PROGRESS.**

## Authority and evidence boundary

This is the canonical restamp of accepted recovery reports and control-tower closure, not a fresh Production investigation. This reconciliation executes no SQL, browser campaign, provider send or worker call. Read-only Vercel mapping/alias checks support safe non-main Git publication only.

## Post-release addendum — 2026-09-14

PR #32 is **MERGED / ACCEPTED**. Canonical main and accepted Production Git SHA are `8df29d298c196a2431c86a8cea4af1e5bfec09fd`; accepted deployment is `dpl_3wENSHQrTUnu6VkaqjE7coJ4kjbn`. Canonical GitHub source of truth is **RESTORED** and Production release **ACCEPTED**. These are accepted 2026-09-14 release identities, not permanent architectural constants; future serving truth comes from the actual environment/current release record.

All three Production aliases align to the new deployment. Unauthenticated git-main alias 302 → Vercel SSO is intentionally protected behavior, accepted by the supplied Product Owner/control-tower closeout; it is not a fresh application-render pass. Primary application health and non-submit GVM flow passed in the release checks. Staging unchanged. Recovery CLOSED; hold OFF; Cron enabled; webhooks OFF. No new Production inspection occurs in this documentation task.

Canonical source of truth is main + canonical /docs. Preservation refs below are historical evidence, not current execution instructions.

## Historical accepted recovery state — before PR #32 release

- Production deployment: `dpl_EFp5585EcR3rmgmJH9wZ5rhpspRc`.
- Serving commit: `dbbe4502365858d4194f197b9ac22afe8d259c14`; parent `19d86a265fd6eecbc2da4b66c5ad508a0b93f6b5`.
- Supabase: `kxcydvhswkuzepwzzinq`. Hold OFF. Cron ENABLED, `*/5 * * * *`, `/api/cron/process-jobs`. Worker reliability ACCEPTED/CLOSED; worker webhooks OFF/absent.
- Accepted queue snapshot: 581 total, 12 completed, 568 cancelled, one held pending webhook, zero processing/failed. Send-intent ledger: one accepted. These are closeout snapshots, not promises of perpetual row counts.
- Package A accepted in Production: purpose record `20260913232447_package_a_existing_appointment_interval_correction`. Four-function correction; no numerical 026 replay.
- Canonical GVM business `a04e1d65-eeb9-4d72-a5bf-739a9038bb91`, Main/Burlington location `ebe0b761-a207-4ca7-96ed-ad835a06e2cc`; America/Toronto at both levels; CAD.
- Early Gender: duration 30, cleanup 5; existing trigger maintained updated_at. Elite Pro and second visit remain 45 + 5. No appointment-time rewrite.
- 034/035/036 locked/unapplied. 040 unexecuted on Production. 041 accepted/retained unchanged. Live installed state outranks incomplete migration-history attribution.

## Final exposure acceptance

First hold-removal attempt was safely rolled back after a public render Gateway Timeout (digest `3742706650`, request `vrd2s-1789348441035-76aff221045d`). Root cause remains unproven; historical P2, not an active recovery blocker. It was not established as a Package A or service-timing defect.

Final retry approval: `CHASUM-PO-20260913-PROD-HOLD-REMOVAL-FINAL-RETRY`. Hold OFF published at 2026-09-14T14:04:44.918Z, version 4. Three normal public GET renders returned HTTP 200, serverless MISS, with no correlated application error:

| UTC | Request ID | Result |
| --- | --- | --- |
| 14:05:12.976 | `g4pg6-1789394712976-ab304f5eaa9c` | PASS |
| 14:10:28.619 | `6rl7p-1789395028619-29892222ec23` | PASS |
| 14:15:44.474 | `7cwt4-1789395344474-fc2e6231bd6a` | PASS |

Named-staff Early Gender availability loaded for September 15 (139 slots, 09:00–20:30). Read-only availability action returned 200; no booking submitted. Sixteen before/after table fingerprints matched. Health/configuration success is not represented as a database-connectivity test. Cron and webhooks were unchanged.

## Canonical history

Historical pre-reconciliation main `476af17bfd06113281df0b5c33f995ccb26f5fff` is an ancestor of historical recovery Production; that recovery commit is an ancestor of Package A. Preserve exact objects without rewriting:

- `recovery/production-serving-20260914` → `dbbe4502365858d4194f197b9ac22afe8d259c14`.
- `recovery/package-a-availability-20260914` → `a855e7733a0687de580c8fa3f861b389a476c926`.
- Corrected Package A technical state: `d524d1d1a90536258208bbec4559aa827b3759a0`.
- `0e4c0536f021a44d52dc151220de42265b03ce78` is HISTORICAL FAILED / SUPERSEDED evidence, never the active target.

PR #32 started from that historical main and selectively ported final runtime, not ancestry; it is now merged. [File classification](./RECONCILIATION_FILE_CLASSIFICATION.json) accounts for every main-to-Production changed path. No unrelated marketing/auth-recovery branch is merged. Historical live-test runners and operational runbooks remain available on the exact preservation refs; they are not current execution instructions.

## Schema artifacts, not execution authority

Historical 026 remains byte-identical. Package A [forward](../../sql/recovery/A_production_availability_engine_realign.sql) and [rollback](../../sql/recovery/A_production_availability_engine_rollback.sql) are preserved with SHA-256:

- Forward: `84863ad305bd98b01e817a43153f3344e816c5994c32f7b8452e2c09aac94fdf`.
- Rollback: `07185c31460d999dbeb698e8544f8048bf233a0669c74854d4f87d5c2d947201`.
- Historical 026: `37b19fb00c95994b5c8c05d143b7fc668b1d032c665ed3ce43aba8a33caea0a8`.

040 is preserved byte-for-byte only as a historical regression fixture under tests/fixtures/recovery, outside the migration directory. 041 and the accepted ledger/consent schema artifacts retain their serving-commit bytes. None is authorized for execution by this PR. Do not bulk-apply migration history.

## Remaining operational work

First legitimate GVM booking plus customer confirmation AND business new-booking email remains operational validation. HQ dogfood continues; outside Private Alpha not started; Gate B NOT MET. Recovery closure does not declare Phase 5 complete.

No GVM website, Picktime or Google Business cutover occurred. Chasum has not been declared sole intake. Future work remains balanced across Core Operations, Commercial SaaS, Intelligence and Validation; see [launch tracker](../LAUNCH_READINESS.md) and [master tasks](../company/MASTER_TASKS.md).
