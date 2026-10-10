# #133 Slice 2A — local PostgREST I1 execution proof

**SLICE2A_I1_LOCAL_POSTGREST_PROOF_PASS.** Local query architecture proof only. No application implementation, hosted acceptance, Production/GVM acceptance or activation.

## Identity and evidence

Starting branch `codex/issue-133-projection-observability`, clean HEAD `cfe23e7fb4b8ec6b845d88b68a5c833aa976eee6`, tree `66b63661ab794855edf5578d556993aa4c28fe21`, parent `529587f682c2aceefcf2f364cc2feeb6851f0980`.
Design unchanged: SHA-256 `1f1a966c8466d6f124adab76a2bb188497c363a30d1f104df42c663d7eba029a`, 105,515 bytes.

Canonical successful local run: `2026-10-10T22:27:12.915Z`. Temporary evidence directory: `/private/tmp/chasum-i1-run-qFWGR5`. This directory is not durable release storage; the approved bounded synthetic response, plan and summary are copied unchanged alongside this record.

- Harness SHA-256: `1b6068e68b02493fb429c65a5e86254ac1c0cb66b5ddfd330cf1b16b75636c2b`.
- Raw HTTP body SHA-256: `93e498ed6f6c8970cbf337b489958a922963c0357e3ec2b305cf096988055d75`.
- Plan SHA-256: `089ff6af0b90de6115515e73d05792d23584d0645c5e7766402aa526ed24d28d`.
- PostgreSQL: `postgres (PostgreSQL) 17.11 (Homebrew)`.
- PostgREST: `PostgREST 16.4`, macOS ARM64 official binary.

[Official release](https://github.com/PostgREST/postgrest/releases/tag/v16.4): archive SHA-256 `5720fbde4a19ade9fb189791615c84beb9f0e58201b1b6d17fe3b698faf60776`; binary SHA-256 `325628d6bc975251c2952c1275e969b8dc57f88db32dfb82c4c6597cebcd260b`. Downloaded outside the repository; no Homebrew/package installation. The binary uses the already-installed PostgreSQL libpq through a child-only `DYLD_LIBRARY_PATH`.

## Reproduce explicitly; never runs in default tests or CI

From the exact worktree, with that official binary available locally:

```sh
CHASUM_SLICE2A_I1_LOCAL_PROOF=1 \
I1_POSTGREST_BIN=/private/tmp/chasum-i1-postgrest/v16.4/postgrest \
I1_LIBPQ_DIR=/opt/homebrew/opt/postgresql@17/lib/postgresql \
node scripts/verify-issue133-slice2a-postgrest-i1.mjs
```

The script downloads nothing. It verifies the design and binary identities, creates a fresh owned cluster, emits a new temporary evidence directory, stops both processes and removes only its marker-owned PGDATA. It never overwrites the committed evidence. PostgreSQL has TCP disabled and uses a private Unix socket; HTTP binds to 127.0.0.1 on a temporary port. Child environments exclude ambient Chasum/PG/PostgREST credentials and configuration. No application imports or build are required.

## Schema and principal

Applied 43 unchanged real migrations: existing numbered 001–036, 039 and 041, followed by the #134 attempt foundation, R1a kernel, attribution, durable-booking operation and #133 projection migration. Exact filenames/hashes are in `evidence.json`. There are no numbered 037/038/040 files in this candidate's selected numbered migration set. This is the relevant repository dependency baseline, not a claim that every later unrelated migration or hosted schema is reproduced.

Only external Supabase platform prerequisites (`auth.users`, auth helpers and storage scaffolding) are locally modeled. Application tables, constraints, policies, enums, triggers and FK topology come from unchanged migrations; no simplified commerce/appointment replacement schema or disabled constraint/trigger is used. The earlier #133 fixture harness was inspected but not run or reused.

The dedicated local `i1_reader` is NOSUPERUSER + BYPASSRLS with explicit schema usage and SELECT on the five read relations. No hosted role/grant parity is claimed. Fixture seeding uses local admin/service-role DML and accepted-attempt states solely to test relationship reads; it does not prove payment-writer/history semantics or execute providers.

## Fixtures and exact query

All fixture identities use the fictional `a1332000-0000-4000-8000-` namespace. Business A ends `000000000001`; B ends `000000000002`. Four A roots end 101–104, with separate appointments 201–204 and attempts 301–304. Foreign root ends 109.

| Case | Transaction witness | Appointment witness |
| --- | --- | --- |
| Clean | 0 | 0 |
| Same-Business transaction refund | 1 | 0 |
| Cross-Business transaction refund | 1 | 0 |
| Appointment-only refund | 0 | 1 |

Two cross-Business refund rows and two appointment-only refund rows were seeded to exercise limit=1. Appointment-only refunds reference the foreign transaction, not any A root transaction. Refunds have `failed` status, `rejected` approval and timestamps outside the root period; no refund-attribute filters suppress them. Foreign root is excluded.

ONE data GET on `commerce_transactions`, Business A filter, `[2032-01-01T00:00:00Z, 2032-02-01T00:00:00Z)`, `order=id.asc`, root limit 100, `Prefer: count=exact`. The exact select and encoded query are in `evidence.json`.

Working explicit hints:

- Transaction witness: `commerce_refunds_transaction_id_fkey`.
- Appointment witness: `commerce_refunds_appointment_id_fkey`.
- Root appointment: `commerce_transactions_appt_business_customer_financial_fk`.
- Current Location: `appointments_location_id_fkey`.
- Attempt: `commerce_transactions_attempt_business_fk`.

Aliases: `transaction_witness`, `appointment`, `appointment_witness`, `current_location`, `attempt`. Limits: `transaction_witness.limit=1` and `appointment.appointment_witness.limit=1`. No `count()`, `!inner`, anti-join or root-filtering existence predicate.

## P1–P9

| Predicate | Result | Evidence |
| --- | --- | --- |
| P1 | PASS | HTTP 200, valid array, no PostgREST error |
| P2 | PASS | Exact four A root IDs retained; B root excluded |
| P3 | PASS | Both applicable witness keys present on every root |
| P4 | PASS | Arrays throughout; clean case has two empty arrays |
| P5 | PASS | Same-Business, cross-Business and appointment-only contradictions detected; relevant arrays length 1 |
| P6 | PASS | Exactly one permitted field per witness object; equals authorized parent key |
| P7 | PASS | Exact raw response scanned before mapping; forbidden values absent and witness keys allowlisted |
| P8 | PASS | Coherent attempt, appointment and current Location returned in that same response |
| P9 | PASS | One generated data statement; one top-level plan; exact Content-Range 0-3/4 matches four rows |

C1–C6 all pass. N1–N4 deliberately mutate response copies on BOTH axes: omitted key, null/non-array, wrong join key and extra attribute all yield UNKNOWN/invalid proof. Root-count mismatch, partial row set and response failure also yield UNKNOWN. N5–N7 confirm disabled aggregates and absence of count()/root-filtering witness syntax.

## Raw privacy and one-statement evidence

`raw-response.json` is the exact raw HTTP body, not a sanitized domain object. Forbidden scans include B's UUID, foreign customer/actor/transaction UUIDs, every refund UUID, amount `987654321`, currency `zzq`, reason/provider/reference/metadata canaries, approval `rejected`, status `failed` and refund date `2047-06-17`. None appears. Witness key allowlists additionally exclude every non-join-key attribute, including timestamps, creator, invoice and refund type. Authorized root amount/currency/IDs are intentionally retained and are not refund disclosure.

[Official plan support](https://docs.postgrest.org/en/v16/references/configuration.html#db-plan-enabled) is enabled only locally. `plan.txt` captures the SAME URL and count preference with `Accept: application/vnd.pgrst.plan+json; for="application/json"; options=verbose`. It is one top-level PostgreSQL plan containing all five relations, two refund scans and nested Limit nodes. PostgreSQL logging independently counted one `WITH pgrst_source AS` data statement. The separate EXPLAIN request inspects the same query; it supplies no additional financial data to the response. Internal SQL Aggregate nodes do not require the disabled PostgREST embedded-aggregate feature.

Effective `db-aggregates-enabled=false`, `db-plan-enabled=true`, `db-config=false`, explicit five-table SELECT and complete non-secret effective configuration are recorded in `evidence.json`.

## Validation, cleanup and limitations

Temporary feasibility run passed, then the finalized harness rerun passed all P1–P9/N1–N7 with confirmed cleanup. One preliminary fixture-seeding run failed because its service lacked the required location_id; service/staff fixture locations were supplied, with no schema changes. No failing query/privacy result was bypassed. The official archive was checksum-verified before execution.

Node syntax and JSON/hash checks pass for the proof package. Full whitespace checking flags exactly three native trailing spaces in the raw HTTP body at its row separators; these bytes are deliberately preserved rather than sanitizing raw evidence. All other proof paths pass whitespace checks. This is a documented artifact-format exception, not a failed query or a claimed clean full diff check. A clean invocation of the committed script is required as the final reproducibility check; its separate run result belongs in the delivery report. No application tests/typecheck/build are claimed.

Canonical run cleanup: PostgREST stopped, PostgreSQL stopped (pg_ctl status confirms not running), owned PGDATA removed. All work is synthetic/local. Local proof does not prove hosted PostgREST version/configuration/grant parity, auth boundary implementation, production scale or application acceptance. Unexpected behavior must become UNKNOWN, not absence or EXACT.

GitHub #153 interface note: PENDING MANUAL GOVERNANCE RECORDING by Darshan/ChatGPT after implementation reconciliation.

Dependencies remain BYPASSRLS visibility, SELECT, FK topology and explicit hints; no aggregate-config dependency. No #153 changes. No Staging, Production, GVM, application implementation, new migration/RPC, Slice 2B, worker/provider/communications, C01/C02/C03 reuse, push, PR, merge or deployment.

Return to Darshan/ChatGPT for the separate application-implementation dispatch. Proof PASS does not authorize beginning application work in this session.
