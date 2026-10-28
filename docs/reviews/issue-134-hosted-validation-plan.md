# Issue #134 — hosted financial-validation execution gate

## Status and scope

**PLAN/PACKAGE PREPARED; HOSTED FINANCIAL EXECUTION NOT AUTHORIZED OR RUN.** The accepted continuation point is the #134 R1a Staging application, not GVM Operational Acceptance. This task performed source/design preparation, native read-only Staging metadata inspection, static parsing/hashing and independent reviews. No payment RPC, Auth-user creation, fixture/DML test, migration, provider send, activation, release or Production/GVM operation was executed.

Source investigated: `445b0b593b84e4b7b11fef9cda5157fd014eff21`, tree `77dd33a05badd053537cf542e7fad771185b6e7b`. Reviewed application code remains `888bac096778ed85171b880a816d2052d84c92a4`. Existing R1a SQL remains SHA-256 `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`, hosted as `20261005170446`; foundation remains `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`, hosted as `20261005032107`. Neither applied file was edited or replayed.

## Team and independent review

- GPT-5.6 Sol/Cursor authored and corrected the unexecuted package; primary preparation session `cdd7ecc2-7bf2-4282-8d7f-5925888adcd3`. The earlier source-design session was `687552e9-2199-4f68-9c99-062fd824d6de`.
- Grok completed an independent source-only safety/dependency challenge in session `72f9ea71-d832-4dae-bc60-b3cc2a172c9a`. It did not execute SQL or review an executed hosted test.
- Claude independently inspected the exact plan/manifest/runner, source dependencies and member hashes in session `bf12f7b2-350f-47ff-a4a5-eabf61d42fc3`. Initial HV-B findings were corrected, not waived. Final verdict: **HV-A — exact plan/package ready for the bounded PO execution gate, conditional on secure Staging access and exact approval**. The complete final report is retained below.
- ChatGPT coordinated scope, supplied native read-only catalogue evidence, reconciled the fixture/financial oracles, and independently parsed the Python AST/JSON and computed file/package hashes. No runner import or execution occurred. Prior code/foundation audits were not restarted.

Corrections include early full tenant-identity collision checks; safe containment before provisioning commit; fixed-host proxy-free/redirect-refusing HTTPS; all communication/fixture object checks before writes; accurate seeded-row and Auth-audit accounting; genuine bounded multi-session concurrency; immutable retained-cohort handling; and zero-write literal-role/COMMIT transport capability checks before Auth or fixture creation.

## Exact prepared package

Package directory: `docs/validation/issue-134-r1a/`.

| Member | SHA-256 |
|---|---|
| `PLAN.md` | `fe802526f9ca7f369c30d9f53e989d436cd903501f4e73ac865d32f08dd485c5` |
| `fixture.json` | `037eee2063803b0a71d8d94f40fed3ec782c6e0b65555de4da5b44912029b117` |
| `hosted_validation.py` | `b5cf568498211db786b551788885e8450e8b930686142b93d0911e7820d6b651` |

**Aggregate package SHA-256: `1bcd751c472161abfea08fc29e0624f9e2f29d02a9c198c5c82c643bc777001a`.** Ordered members are PLAN.md, fixture.json, hosted_validation.py; hash each member, then hash each `filename + NUL + lowercase member hash + newline` in that order. Review/continuity records are outside the three-member aggregate. Any package-byte change requires re-review/re-binding before execution.

The script is an unexecuted validation artifact, not application code. It refuses execution without `--execute`, the exact approved package hash and one approved run ID. Suggested single run ID: `HV134-20261005-R1A-01`. No dry run here is represented as hosted behavior.

## Proposed controlled footprint and truth

Future execution targets only `wnfahklzaxirftyskctd`. Two new non-delivering, confirmed synthetic Auth users are created through the supported Auth Admin API; two normal synthetic Businesses are created through the existing #72 identity gate, never direct Business insertion or GVM/HQ reuse. Containment settings are applied in the same provisioning transaction before commit. There are three customers, one inactive/internal Service, one inactive Staff, three explicit relationships, two confirmed future-dated financial-fixture appointments and the required normal location/hour/settings/identity seeds. These are direct financial fixtures, not proof that inactive Services/Staff can be booked through the UI.

The retained public footprint is exactly **82 rows**: 53 fixture/provisioning rows including seven Staff-hour rows, plus 29 financial rows (5 attempts, 9 events, 3 linked transactions, 12 obligations). Two Auth users and two identities are separately counted; platform-generated Auth audit records are observed separately, not assigned an invented fixed ceiling. The three synthetic manual ledger records total CAD180: 5000-cent E-Transfer deposit, separate 5000-cent cash payment, and 8000-cent manual debit full payment. No real transfer/card charge occurs.

Cases cover same-key replay/conflict, a legitimate second equal-value payment, genuine overlapping commit sessions, acknowledged-COMMIT response suppression/recovery, durable REQUESTED/no-effect evidence, invalid requests, cross-tenant binding rejection, rollback-only atomicity and visible-before-check reassignment, plus authenticated legacy NULL-linked INSERT/UPDATE/DELETE in a rolled-back transaction. Twelve identity-sequence default evaluations are budgeted, including rolled-back and conflict-default gaps; no sequence reset is allowed.

Current expected truth is **recorded ledger + synchronization PENDING**, unchanged appointment caches, and zero invoice/receipt/CRM-mirror/communication rows. This is not an acceptable activated operator workflow and must not be certified as one. The full numeric per-layer future oracle, including No payment now, invoice/cache/CRM synchronization, receipt/delivery failure and safe retries, is PLAN sections 7/10. Future cases remain NOT IMPLEMENTED/NOT RUN; they are not waived. SQL role/JWT-sub checks are not real sign-in/PostgREST/UI proof; SQL lowercase currency shape is not the server helper's supported-Business-currency proof.

## Newly reconciled binding and security facts

Native read-only Staging catalogue checks found actual service-role SELECT and UPDATE, including UPDATE of `appointments.customer_id`. The earlier inference that a row lock necessarily needs a new grant is therefore not supported for present Staging. The applied SQL still performs an unlocked parent-binding check: the race remains real. `FOR KEY SHARE` cannot protect ordinary non-key customer reassignment. A stronger row lock only protects its transaction; an enduring attribution invariant and legitimate correction contract are also required before activation. No lock/guard/migration was implemented here and no committed corruption reproduction is authorized.

Current isolated tests can use verified existing privileges without silently fixing #153. Financial direct-write bypass closure, specific event-sequence ACL disposition, retained service privileges and FORCE-RLS applicability must be settled before canonical permission cutover/activation. Unrelated schema-wide defaults/hardening remain separate reviewed work. No whole-platform security pass is claimed.

## Communications, faults and retention

Only fixed Staging Management SQL and supported Auth Admin identity calls are permitted. No application booking/payment orchestration, provider, webhook, worker, queue-drain or send endpoint is called. Notification/marketing flags are off, online booking disabled/staff-only, service/staff inactive, contacts synthetic. `.invalid` addresses are only a backstop, not the no-send proof. Tenant-scoped communication/queue/follow-up/audit rows must remain zero; global counts/times are recorded diagnostically because unrelated workers may run.

The concurrency harness uses only the synthetic attempt's row lock and bounded independent SQL requests, with positive blocked-session evidence. It adds no stored function, trigger or schema object. Acknowledged-commit suppression is not an actual provider outage/crash claim. Outer rollback is not proof of every unavailable internal worker fault seam.

Retain committed attempts/events/ledger/obligations and their parent fixtures. No DELETE/TRUNCATE of financial history, trigger/RLS disabling, setval, renumbering or cosmetic cleanup. Only explicitly uncommitted diagnostic operations roll back. A future worker activation must explicitly gate the retained cohort rather than silently process its pending obligations. Unexpected identity/hash/privilege/row/result/communication behavior stops new dispatch and preserves evidence; no automatic replay outside the exact plan, repair or re-keying is permitted.

## Concrete execution-access blocker

The native Supabase connector still supports read-only Staging inspection. The separate multi-session runner needs a valid local Staging-authorized Management API credential. A read-only request using the saved local token returned **HTTP401**; no SQL or Auth operation ran. A direct database TCP attempt also returned **No route to host**, before any credential or SQL was sent. Therefore the final package uses fixed-host Management HTTPS rather than requesting a database password or weakening transport protection.

A securely configured `HV134_STAGING_MANAGEMENT_TOKEN`, plus the exact Stage service-role key for later synthetic Auth provisioning, must pass the package's zero-write capability/preflight checks. No credential value was printed, embedded, committed or sent to another origin. Do not paste credentials into chat. Credential refresh alone does not change the reviewed package or authorize a test; it does not require another design approval if the bytes remain identical.

## Exact next gate

**Plan accepted; actual execution AWAITING secure-access preflight and explicit PO authorization** Actual execution remains blocked by secure access and explicit Product Owner approval of the exact aggregate/run ID. Approval must include the two synthetic Auth users, two normal synthetic tenants, bounded committed financial cohort and deliberate audit retention; it must not include runtime activation, hosted UI/full-chain claims, schema/ACL changes, merges, #135 release, historical USD repair, Production/GVM action or technician resumption.

Both PR155/PR156 remain Draft/unmerged. Main stays separate from the previously accepted Production baseline. GVM OPERATIONAL ACCEPTANCE remains unearned and requires complete supported booking/payment/document/communication truth, safe retry/recovery, binding/permission closure, independent responsive Staging workflow evidence and a separately approved Production release.

## Review provenance qualification

Statements in the reviewer report describing the probe as "proven" mean its static design/wiring was inspected, not that it was executed. Both the report and this record explicitly state the probe, hosted test and Auth provisioning have NOT RUN. The current service-key presence is not a completed Auth Admin authentication test.

<details>
<summary>Claude final exact-package report — preserved verbatim</summary>

```markdown
# CLAUDE — FINAL C1-ONLY RECONFIRMATION, #134 HOSTED VALIDATION PACKAGE

**VERDICT: HV-A — plan/package READY for the bounded PO execution gate,
CONDITIONAL on (a) a securely refreshed Stage-authorized Management token and
(b) exact hash-bound Product Owner approval. No remaining engineering blocker.**

Execution is **not** ready and **nothing has run**. No test, probe, SQL, Auth,
Management, network, provider, MCP, import, or repository action occurred in this
review; I performed read, hash, and static analysis only. `package/` still
contains exactly the three files and no `evidence/` directory, consistent with a
wholly unexecuted package.

## Exact identity (independently recomputed)

| Member | Bytes | SHA-256 |
|---|---|---|
| `PLAN.md` | 26438 | `fe802526f9ca7f369c30d9f53e989d436cd903501f4e73ac865d32f08dd485c5` |
| `fixture.json` | 6862 | `037eee2063803b0a71d8d94f40fed3ec782c6e0b65555de4da5b44912029b117` |
| `hosted_validation.py` | 82713 | `b5cf568498211db786b551788885e8450e8b930686142b93d0911e7820d6b651` |

**Aggregate = `1bcd751c472161abfea08fc29e0624f9e2f29d02a9c198c5c82c643bc777001a`**
— matches the supplied value and `package-identity-c1.json` exactly.
`fixture.json` is byte-identical to the previously reviewed revision, so the
financial matrix, amounts, keys, and ceilings are provably untouched. Only
`PLAN.md` (+807 B) and the runner (+2715 B) changed, which accounts fully for the
probe, the new parameter plumbing, and the per-failure classification blocks —
leaving no room for unreviewed change.

## C1 correction — CLOSED, and it closes more than I asked for

`literal_role_transport_probe()` is the **first** Management call in `main()`,
before `readonly_preflight`, before `auth.list_users()`, and before any Auth
creation. Its SQL opens `BEGIN READ ONLY`, performs `SET LOCAL ROLE service_role`,
and in the *following* statement asserts `current_user = 'service_role'` and
`rolinherit` for `session_user`, then `RESET ROLE` and `COMMIT`, requiring exactly
one JSON object with both booleans true.

This is precisely targeted:

- **Cross-statement role persistence** — the role is set in one statement and
  checked in the next, which is the only way to prove that `SET LOCAL ROLE`
  survives statement boundaries inside a single Management `{query}` body. Every
  financial RPC depends on this, and nothing previously probed it.
- **`session_user`, not `current_user`, is the correct subject for `rolinherit`.**
  `SET ROLE` does not change `session_user`, so the login role's INHERIT
  attribute is exactly what governs the inherited-privilege reads that
  `containment()` and `final_reconciliation()` perform without a role switch.
  That was the second half of C1 and it is now proven.
- **It also closes my earlier residual #2.** Because the probe is sent with
  transport `read_only=false` and is multi-statement with explicit
  `begin … commit` and a non-final row-returning `select`, it now exercises the
  write-capable route's whole-transaction/COMMIT result shape **at zero write**.
  Previously that shape was first confirmed only at `provision`, after two
  retained Auth users. That gap is gone.

Fail-closed wiring is correct. `request()` sets `write_started = True` only when
`not read_only and not zero_write_probe`, so the probe exercises the write route
while leaving the transport state unwritten; consequently HTTP/401, oversized
response, shape drift, timeout, one-result failure, and boolean mismatch all
classify as `STOP_ZERO_WRITES`. Two guards prevent misuse: a probe may not be
`read_only=True` (it would not test the right route) and may not run after a
possible write. The explicit `read_only=False` bypasses the auto-inference, which
would have agreed anyway.

**PLAN text matches the code.** §1 and §4 item 3 describe the write-capable route,
the database-side `BEGIN READ ONLY` boundary, the literal `service_role` and
`session_user.rolinherit` assertions, the single expected result, and the
`STOP_ZERO_WRITES` behaviour, with no stronger claim than the code supports.

## Previously accepted scope preserved

Verified intact: B1 identity predicate (`identity_a_clear`/`identity_b_clear`);
B2 transport (`ProxyHandler({})`, `NoRedirect()`, `ssl.create_default_context()`,
200/201 only); B3 `communication_follow_ups` and `communications_audit_log`
throughout with `required_tables` still exactly 10; B4 tenant-zero asserts plus
non-failing global count/latest diagnostics; B5 full preflight surface; B7 holder
12 s versus worker 20 s with `pg_stat_clear_snapshot()` and the recursive blocker
chain; B8 Python-generated fixture UUIDs, `business_members`/`business_slug_aliases`
at 0, persisted concurrency outcomes, observe-and-report Auth audit diagnostics,
and the retained-cohort worker gate. Counts unchanged (5 attempts, 9 events, 12
obligations all PENDING, 3 ledger, 53/82 rows, 12 sequence evaluations). Only
`GET` and `POST` exist; the single `DELETE` is still the rolled-back legacy
specimen. PLAN §10–§11 are byte-identical to `future-oracles.md`, so the future
numeric oracles and the narrow #153 financial-cutover boundary are unchanged.

## Honest limitations the PO should carry

1. **The access blocker is real and unresolved.** The saved token returned HTTP
   401 and direct DB TCP gave `No route to host`. The probe has not run; its
   guarantees are design-level until it does. This is a credential fact to
   disclose — not licence to reset passwords, weaken TLS, create actors first, or
   touch Production.
2. **`BEGIN READ ONLY` in the probe is belt-and-braces.** If the Management API
   wraps its own transaction, the nested `begin read only` would warn rather than
   apply; zero-write still holds because every probe statement
   (`SET`/`SELECT`/`RESET`/`COMMIT`) is intrinsically non-writing.
3. **Single-shot.** Any Stop after admission — including a concurrency witness
   timeout — is fail-closed but permanent: §9 forbids retry and the keys, emails,
   and slugs are consumed. A re-run needs a new fixture and a new hash-bound
   approval.
4. **Unchanged open items.** The appointment-customer reassignment race and #153
   remain pre-adoption blockers; end-to-end, browser, and build proof remain NOT
   RUN integration debt; no invoice/receipt/cache/CRM/UI/communication success is
   claimed.

## Gate

Bind `1bcd751c472161abfea08fc29e0624f9e2f29d02a9c198c5c82c643bc777001a` to one
`HV134-…` run identifier and authorize a single run, effective only once a valid
Stage-authorized Management token and the exact Stage service-role key are
securely available. The strongest achievable outcome remains the PLAN §9 title.
This review is not execution authorization and asserts no PASS.
```
</details>
