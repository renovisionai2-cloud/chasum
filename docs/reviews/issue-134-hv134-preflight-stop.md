# Issue #134 — HV134 run-01 stop and corrected execution gate

**RUN 01 STOP_ZERO_WRITES; CORRECTED V2 CLAUDE HV2-A; NEW EXECUTION AWAITS EXACT PO APPROVAL.** The original exact run was Product-Owner approved. It is now a real stopped run, not an unused approval or a successful financial test.

## What actually happened

The hidden local Terminal input successfully supplied the scoped token. Original package `1bcd751c472161abfea08fc29e0624f9e2f29d02a9c198c5c82c643bc777001a` ran once as `HV134-20261005-R1A-01` from source `00a5d6eb5e14bae94f916d2d9d349ab264a0181e`.

At 2026-10-06 02:26:13.882 UTC the package gate matched. At 02:26:14.523 the literal-role transport probe passed (`literal_role=true`, `session_inherit=true`). At 02:26:15.274 the next database preflight returned HTTP400 and STOP_ZERO_WRITES. The runner exited 1 and preserved its evidence. Auth listing/creation, tenant provisioning, financial cases and communications stages were not reached.

**Confirmed original DB error:** 2026-10-06T02:26:15.236Z, application `hv134_preflight`, database role `supabase_read_only_user`, SQLSTATE `42501`, `permission denied for function tenant_identity_key`. This was retrieved from the original Staging PostgreSQL log, not inferred from the generic HTTP status. Native catalogue inspection confirms the restricted managed read-only role cannot execute that protected pure normalizer, whereas the intended privileged role/service_role can. The read_only=true Management route selected the restricted identity; the earlier read_only=false transport probe had succeeded.

This is a validation-harness preflight defect, not a bad token, missing token scope, or demonstrated payment corruption. No new token, password reset, wider grant, role alteration or migration is the remedy. No denied role/permission was bypassed or changed; a separate native attempt to SET the managed read-only role was denied and respected.

Native read-only post-stop reconciliation found zero exact synthetic Auth users and fixture Businesses, and zero attempts/events/obligations/linked ledger rows. It did not re-run a financial test. The run's SQL never reached a write stage.

## Evidence custody

Original logs remain unchanged under `docs/validation/issue-134-r1a/evidence/HV134-20261005-R1A-01/`:

- `evidence.jsonl`: 4 lines; SHA-256 `d1880c9feab20efcadb078f8e6f54e01446f9353fb98d892816338f959d12185`.
- `run-manifest.jsonl`: 2 lines; SHA-256 `47f53f09cc3fc552aa111e6d6be60c12ae46d54c1d9bbc7d89318d5d49b70726`.

No cleanup, sequence reset, original-package edit, evidence deletion or run-ID reuse occurred. These redacted records contain no credentials. The original package is retained separately from the corrected candidate.

## Prepared correction — not executed

Published package path: `docs/validation/issue-134-r1a-v2/`. Claude independent delta review **HV2-A** completed in session `7dd6c534-3ef7-4088-bf95-6e7cbdf145cc`; he independently reproduced original/candidate hashes and AST scope, not hosted execution. No remaining preparation blocker was found. Executable offline regression remains NOT RUN and is not called a PASS. Original package and original evidence remain in `docs/validation/issue-134-r1a/`.

Sol authored only an isolated preflight correction; diagnosis session `70994b8e-73b9-4d0d-a2de-ccfefc43fe3b`, correction session `32b1077c-ca87-4b13-aa40-e2f01d14d0ec`. The only changed Python top-level AST node is `readonly_preflight()`; the fixture, financial functions, main execution ordering, transport classes, retention, concurrency, endpoints and activation holds are unchanged.

The corrected preflight uses the already-intended privileged Management route explicitly, with `zero_write_probe=True`, while SQL immediately applies `SET TRANSACTION READ ONLY` and asserts the actual transaction is read-only. It also checks pure-normalizer EXECUTE and authenticated-role access, and tests every required table operation individually rather than using PostgreSQL's comma-list ANY semantics. It does not grant any privilege or weaken a failed check.

| Package member | SHA-256 |
|---|---|
| PLAN.md | b8d27816ef81166f9b45a74dcde8b3b256f5db401837e617c06efb29922fe489 |
| fixture.json | 037eee2063803b0a71d8d94f40fed3ec782c6e0b65555de4da5b44912029b117 |
| hosted_validation.py | 6dc3dbf2751f2e67b9e00ee4473c1f3a91135ceef3b1955d21d9f90a3e2611b4 |

Aggregate: `9b96fdda79170f23cf467082187123d8651a85fb3c91d6d9cc3600583f8ab968`. Member order and aggregate algorithm are unchanged. Proposed new run: `HV134-20261006-R1A-02`. Original fixture identities may be reused only after a new absence preflight, because run01 created none.

## Verification and limitations

Coordinator static parsing, hashing, fixture byte comparison and AST scope comparison passed. An authored offline regression command was denied in the Sol environment and NOT RUN; it was not bypassed. No revised runner import/main/financial execution occurred. A separate native read-only catalogue audit found all 52 individually checked table privileges present, plus authenticated SET ability and appointment customer UPDATE. A native read-only pure-helper design probe returned read-only transaction, helper access and expected synthetic-name normalization all true. These are direct catalogue/SQL diagnostic observations, not the revised package's HTTP protocol test or financial acceptance.

Statements in the candidate PLAN about no database operation during preparation describe Sol's artifact authoring; the coordinator separately performed the explicitly disclosed native read-only diagnostics. No updated application code, migration, permission, RLS, fixture or financial data resulted.

Standard staged whitespace checking flags exactly three intentional Markdown hard-break lines (3–5) in the byte-bound copied PLAN. Those reviewed bytes are preserved rather than silently rehashed for formatting. The check excluding only that PLAN passes for all other files; no clean full whitespace-check result is claimed.

## Next exact gate and preserved boundaries

A new exact-hash Product Owner approval is required before any revised financial run. The previous approval names the original bytes/run01 and is not silently transferred to v2. Do not rerun run01 or edit away its failure. All new zero-write preflights remain mandatory before Auth/fixtures.

The proposed financial scope is unchanged: two normal synthetic tenants, CAD50 E-Transfer deposit, legitimate separate CAD50 payment, CAD80 full manual payment, bounded replay/concurrency/legacy comparison and 82 planned retained public rows. None of those records exists from run01. No activation, merge, Production/GVM, #135 release, historical USD repair, #153 change or technician resumption is authorized. Appointment-customer binding, financial permission cutover, projections/documents/communications and complete supported workflow acceptance remain open. GVM OPERATIONAL ACCEPTANCE is not earned.

## Independent final review

<details>
<summary>Claude HV2-A final delta review; source/static provenance and qualifications preserved</summary>

I'll review the candidate correction package now, starting with the diagnostic directory inputs.Worktree confirmed at `00a5d6e` with only untracked evidence. Now verifying hashes independently and reading the diagnostic inputs.All three member hashes match independently. Now verifying the original package identity and the aggregate derivation.Original member hashes match Sol's preserved values exactly. The aggregate derivation didn't reproduce with my first three guesses — let me find the canonical algorithm.Found the canonical aggregate algorithm in the original review. Verifying both aggregates independently.Both aggregates reproduce exactly under the canonical algorithm. Now running my own independent AST comparison rather than trusting the coordinator's claim.My independent AST agrees: 68 top-level nodes on both sides, nothing added or removed, only `readonly_preflight` changed. The critical question now is whether `zero_write_probe` is a pre-existing approved transport parameter or newly invented.`zero_write_probe` is pre-existing in the original at lines 209/271 and already used at line 429 — the probe that succeeded. Let me read the transport guards in full.Transport guards confirm `zero_write_probe=True` forces `write_started` to stay False. Let me check the already-proven probe at line 429 to compare its SQL pattern.The proven probe used `begin read only;` on the same route — Sol deviated to `begin; set transaction read only;`. Let me scan the candidate's full preflight SQL for write verbs and verify the read-only boundary.Zero write verbs, no `set role`, exactly one `begin;`/`set transaction read only`/`rollback;`. Let me verify prologue adjacency and read the PLAN diff.Now the most important "no silent weakening" check: did any original assertion key get dropped from the required-true list?Let me verify no comma-separated privilege lists remain anywhere, and confirm the repo and run-01 evidence are untouched.I've completed the delta review. Verdict: **HV2-A**, scope-limited, with conditional gates.

```markdown
# HV134 PREFLIGHT CORRECTION — INDEPENDENT HIGH-RISK DELTA REVIEW
**Verdict: HV2-A — ready for a NEW exact PO hash gate; scope-limited. NOT execution approval.**
Reviewer: Claude (independent Development Control). Mode: STRICT READ-ONLY / STATIC.
Scope: delta only. No foundation/R1a/full-plan re-audit, per instruction.

## 1. Identity verification (independently recomputed, not accepted on report)
Source worktree `/Users/darshan/chasum-worktrees/issue-134-r1a-manual-kernel` HEAD
`00a5d6eb5e14bae94f916d2d9d349ab264a0181e`; `git status` shows only untracked
`docs/validation/issue-134-r1a/evidence/`. No repository mutation.

I recovered the canonical aggregate algorithm from the ACCEPTED original review
(`docs/reviews/issue-134-hosted-validation-plan.md:28`): ordered members PLAN.md,
fixture.json, hosted_validation.py; hash each member, then hash
`filename + NUL + lowercase member hash + newline`. Recomputed both aggregates:

- Original aggregate `1bcd751c472161abfea08fc29e0624f9e2f29d02a9c198c5c82c643bc777001a` — **REPRODUCED EXACTLY**
- Candidate aggregate `9b96fdda79170f23cf467082187123d8651a85fb3c91d6d9cc3600583f8ab968` — **REPRODUCED EXACTLY**

Candidate members (recomputed): PLAN `b8d27816ef81166f9b45a74dcde8b3b256f5db401837e617c06efb29922fe489`;
fixture `037eee2063803b0a71d8d94f40fed3ec782c6e0b65555de4da5b44912029b117`;
runner `6dc3dbf2751f2e67b9e00ee4473c1f3a91135ceef3b1955d21d9f90a3e2611b4`.
Original members (recomputed, equal to run-manifest): PLAN `fe802526f9ca7f369c30d9f53e989d436cd903501f4e73ac865d32f08dd485c5`;
fixture identical `037eee…b117`; runner `b5cf568498211db786b551788885e8450e8b930686142b93d0911e7820d6b651`.
`cmp` proves fixture.json byte-identical. All supplied hashes CONFIRMED; this is
stronger than the coordinator's claim because the binding rule itself reproduces.

## 2. Independent AST delta (not trusting coordinator)
My own top-level AST comparison: 68 nodes both sides; ONLY-IN-ORIG `[]`; ONLY-IN-CAND `[]`;
CHANGED = `[('FunctionDef','readonly_preflight')]`. Confirms: no financial routine, `main`,
fixture loader, `ManagementSQL` transport, `Evidence`, or `q()` quoting changed.

## 3. Root cause: privilege/route, NOT credential — CONFIRMED
Original `readonly_preflight` called `one_json(..., read_only=True)`. Management
`read_only=true` selects `supabase_read_only_user`, which lacks EXECUTE on the protected
pure helper `tenant_identity_key(text,text)`, invoked by `identity_is_clear()`. Native log
`42501` at `2026-10-06T02:26:15.236Z`, app `hv134_preflight`, is consistent with the exact
runner SQL. Evidence shows gate MATCH and `literal-role-transport-probe` MATCH with
`management_read_only_flag:false` BEFORE the stop — token and service_role transport worked.
Root cause is transport identity selection, not credential, schema, column, application or
payment failure. **No application/payment defect is established.**

## 4. Correction cannot write or bypass protected grants
- `zero_write_probe` is **pre-existing** in the ORIGINAL approved runner (params at lines
  209/271; already used at line 429 by the PO-approved probe that executed successfully).
  It is not newly invented capability.
- Line 225 raises `Stop` if `zero_write_probe and read_only`. `read_only=False` is therefore
  **forced by the already-approved transport contract**, not a discretionary loosening.
- Line 229: `write_started` is set only when `not read_only and not zero_write_probe`. With
  `zero_write_probe=True` it stays **False**, so preflight failures still classify
  `STOP_ZERO_WRITES`, preserving original zero-write evidence semantics. Line 227 forbids the
  probe after any possible write; preflight (line 1481) precedes `write_started=True` (1497).
- Static token scan of the entire candidate `readonly_preflight` (lines 442–785): `insert/
  update/delete/truncate/drop/create/alter/grant/revoke/perform/copy/merge/nextval/
  set role/set local role/commit` = **0 occurrences**. Exactly one `begin;`, one
  `set transaction read only`, one `rollback;`. No GRANT/DDL/migration anywhere.
- No grant to `supabase_read_only_user`; no SET ROLE retry through the denied identity; no new
  credential. The denied native SET ROLE diagnostic was respected and not reattempted.

## 5. Fail-closed read-only state
Prologue is `begin;` immediately followed by `set transaction read only;` (verified adjacent,
only `set application_name` precedes outside the transaction), with required assertion
`'transaction_read_only', current_setting('transaction_read_only')='on'`.
`assert_true_map` uses `result.get(key) is not True` — missing, null, or false fails closed
before any Auth/financial call. Transaction ends in `rollback;`, never `commit`.

## 6. No silent weakening
All **25** original required-true keys retained (DROPPED = `[]`); **4** added:
`transaction_read_only`, `authenticated_set_role`, `tenant_identity_key_execute`,
`authenticated_appointment_acl`. No duplicates. False/negative ACL and inheritance assertions
retained identically (`not has_function_privilege` 2→2; `not exists` 10→10).
Comma-list `has_*_privilege` ANY-semantics instances: original **15** → candidate **0**;
each required operation is now a separate conjunct. This is strictly stricter and corrects a
genuine latent weakness (PostgreSQL comma lists mean ANY, not ALL).
Response redaction preserved; no provider-body parser or raw HTTP body logging added.
Injection surface unchanged: interpolations still route through `q()` and the fixture is
byte-identical and hash-bound.

## 7. Run gating and evidence integrity
Run `HV134-20261005-R1A-01` remains STOPPED/consumed; evidence and run-manifest mtimes
`2026-10-05T22:26:15` predate candidate authoring (22:32–22:35) and are unmodified.
PLAN correctly records the original package/run immutable and proposes only
`HV134-20261006-R1A-02`. Deleting the stale token/`No route to host` prerequisite is factually
correct, since run -01 authenticated successfully. This preserves the previous approval scope
and does **not** silently widen permissions.

## 8. Checks vs supplied data — disclosure
Coordinator's native read-only catalogue observations (0 synthetic Auth users, 0 fixture
businesses, 0 attempts/events/obligations/linked ledger; 52 privileges true, missing=[];
helper EXECUTE true) are **supplied, not independently reverified by me** — I executed no SQL,
DB, MCP, network, token, env, or runner operation. They are catalogue/state observations, not
rerun protocol and not Auth/financial proof.
**Sol's offline regression suite (`offline-regression.py`, outside the three-member package)
was DENIED and is NOT RUN.** I did not retry or bypass it. No executable test PASS exists or is
claimed. My work is read/hash/AST/diff only.

## 9. Observations (non-blocking)
- The empirically proven form on this exact route was `begin read only;` (line 411). The
  candidate adopts `begin; set transaction read only;`, semantically equivalent but unproven on
  this route with offline tests NOT RUN. Mitigated: any failure yields HTTP 400 →
  `STOP_ZERO_WRITES`, or the assertion stops before writes.
- `tenant_identity_key_execute` sits in the same `jsonb_build_object` as the helper calls, so an
  absent grant still errors (42501) rather than returning false. It adds evidence value but
  cannot pre-empt that failure. Still fail-closed; no weakening.

## 10. Conditional gates before any execution
1. Fresh exact PO approval naming aggregate `9b96fdda…8ab968` and ONLY run
   `HV134-20261006-R1A-02`. Approval of `1bcd751c…7001a` must NOT be reused.
2. Re-verify the three member hashes at launch; any byte change voids this review.
3. Preferably obtain an authorized offline regression execution; absent it, record executable
   tests as NOT RUN.
4. Run -01 evidence remains immutable; -02 writes a new evidence directory.

No hosted acceptance, runtime activation, UI/full-chain, binding/#153/projection or
full-workflow claim is made; those original limitations remain unchanged. No product redesign
demanded. This is preparation review only — it does not authorize hosted execution,
credentials access, retry, Production, or GVM action.
```

The correction is sound and genuinely narrower than the original in privilege checking. Three findings carried the most weight for me:

The `read_only=False` flag looks alarming but is actually **forced** by the existing approved transport contract — line 225 raises `Stop` if `zero_write_probe` is combined with `read_only=True`. And because `write_started` only flips when `not read_only and not zero_write_probe`, the zero-write evidence classification is preserved. This route was already exercised and PO-approved in run -01.

The privilege-list fix is a real latent-bug correction, not cosmetic: PostgreSQL comma lists like `'SELECT,INSERT'` mean **any**, not **all**, so the original's 15 instances could have passed with partial grants. The candidate reduces that to zero.

The one thing I'd flag for your judgment is that Sol switched from `begin read only;` (empirically proven on this exact route in run -01) to `begin; set transaction read only;`. It's semantically equivalent and strictly better verified via the new assertion, but it's unproven on the route and the offline suite was denied, so it remains NOT RUN. Failure is fail-closed either way, which is why I treated it as a conditional gate rather than a blocker.

</details>
