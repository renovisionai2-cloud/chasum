# Issue #134 — prepared payment-attempt foundation

## 2026-10-05 — R1a runtime-writer contract ready for the Product Owner gate

**CONTRACT COMPLETE / GROK G-A PASS / CLAUDE W-A / PREPARED-ONLY IMPLEMENTATION NOT YET AUTHORIZED.** The Product Owner asked to continue the next governed runtime-writer gate from the accepted Staging application. That instruction authorized this bounded contract preparation, delegated source investigation, independent review and continuity publication. It did not authorize a new hosted migration, runtime activation, Production, GVM, or the consequential prepared runtime implementation scope now presented for approval.

### Authority and evidence identity

- Source investigated: `e9d1ccac7e2e8224d33cc906732d690a667b8c84`, tree `94dfe2963b63d7fff45c59ccf8da4dec467ef04c`, existing branch `codex/issue-134-payment-attempt-foundation`. ChatGPT freshly verified local/remote/PR identity, clean status and immutable migration hash. Main remains `31115e6a51b71fc097c279d205065d80e0be3573`.
- Corrected Sol contract, exact report-file SHA-256: `34b8bc0986ab0fc4afe6f559ea489715297229264bbeebd79f4d621f1d90469c`. Both final reviewers received these identical bytes. The report preserved below retains its authoring-time evidence limits; the governing qualifications here supersede them explicitly.
- GPT-5.6 Sol source investigation and correction: **COMPLETED**, Cursor session `bd8ded6e-4a38-4906-861e-e6552209b169`, reported model `GPT-5.6 Sol 272K High`.
- Grok independent source challenge + corrected-contract reconfirmation: **COMPLETED / G-A**, session `dd9080a3-911f-4d97-af92-7c52406195ca`, reported model `Grok 4.7 256K High`.
- Claude independent Level-3 source review + corrected-contract reconfirmation: **COMPLETED / W-A**, session `f965e5b2-b7c7-4a16-a360-dd13c69a897c`, reported model `Claude Opus 5 300K High`.
- Initial G-B/W-B contract findings were corrected and reconfirmed, not waived. Earlier foundation/G-A/A1/S-A acceptance was not repeated. The initial Sol plan-mode UI-plan/empty-final delivery was recovered in the same session; two empty-input reviewer launches were stopped and excluded. Only the nonempty original and corrected reports were valid review inputs.
- No application code, migration file, hosted data, permission, provider, environment configuration or release change occurred. Six new synthetic offline vector comparisons are the only new executed engineering proof; no runtime tests, local PostgreSQL writer test, hosted legacy DML smoke, or GVM workflow was executed.

### Reconciled next implementation proposal — R1a only

**LAUNCH REQUIRED dependency; not itself operational acceptance.** Competitive Product Gate **NOT_APPLICABLE** for this internal, unwired implementation of locked financial-integrity behavior. No UI redesign, supported-method removal or pricing/product restriction is proposed. Material operator workflow changes retain the separate product gate.

1. Author exactly two `SECURITY INVOKER` / literal `service_role` RPCs: `admit_payment_attempt_v1` and `commit_manual_payment_attempt_v1`. One additive follow-on migration file, with its filename generated at authoring by the repository CLI. Only these new functions and their bounded EXECUTE grants are allowed; no existing-table/column/grant/default-ACL changes. Fixed search path and qualified SQL remain required.
2. Add an **internal server-only, unwired** module for current-request authentication/Business resolution, normalized v1 intent, canonical admission/recovery reads, typed outcomes, and a default-off new-admission control. No current UI/Server Action/writer/provider route is modified. Allow only existing-customer/optional-existing-appointment manual payment/deposit using cash, debit_card, credit_card, e_transfer or other. All other modes and explicit invoice intent reject before admission.
3. Commit the ACCEPTED update, one linked succeeded manual ledger effect, outcome event and **exactly four durable obligations in one transaction**. The state update precedes the ledger INSERT inside that transaction; it never commits separately. Obligations remain PENDING except structurally absent appointment_cache for a customer-only target, which is NOT_REQUIRED with completed_at. Invoice absence never implies NOT_REQUIRED. No projection/document/communication completion is claimed.
4. Compare immutable normalized intent, not hash alone; current actor/Business is authorized per request, with appointment-to-customer binding rechecked. KEY_CONFLICT is a committed logical return with retry-idempotent evidence and an unchanged winning attempt. Same-key replay returns the original consistent ledger; inconsistent/missing accepted evidence returns UNKNOWN/hold, not a repair or another payment.
5. The flag prevents only new admissions. Admitted or ambiguous identities never fall back to legacy, including when disabled or when schema/RPC status is uncertain. Safe canonical recovery remains available; current legacy UI stays unwired and is not represented as protected by this kernel.
6. Publish literal cross-language vectors plus focused unit/static and disposable-local PostgreSQL proofs for the NEW kernel. Reusing the accepted foundation fixture as setup is permitted only after this prepared-only authoring is approved; it is not a mandate to repeat closed audits. All external calls/providers/hosted data remain off.

**Claude's three mandatory candidate conditions are binding:** (a) no flag activation before separately reviewed projection work is ready; (b) duplicate conflict-event races must resolve using conflict-safe insertion or bounded exception handling plus same-Business/attempt/type verification, returning the committed logical conflict rather than an uncaught unique violation; (c) execute new offline proofs as the literal service_role using actual applicable grants. Missing required table/column/sequence privilege is a STOP/report condition, never permission to broaden grants or fold in #153.

### Changes rejected or deferred during reconciliation

- Invoice/receipt/mirror uniqueness and receipt counters are **not R1a**. Existing-table constraints could change legacy behavior despite the new-writer flag. Any later schema must receive exact dependency/collision preflight and reviewed issuance/numbering semantics; do not impose one invoice per appointment silently.
- No skip or reconciliation-worker RPC in R1a. Ledger/obligation FK coupling requires the rows in one commit, not a projection worker in the same slice. Both reviewers explicitly accepted this narrower boundary.
- Payment fingerprint v1 already supports `booking_operation` plus operation UUID. A later separate booking-operation registry/fingerprint does not alone require payment v2. Claude withdrew the contrary earlier framing. Explicit invoice selection still needs separately reviewed v2. Fresh booking and no-payment recovery remain later implementation blockers, not accepted behavior.
- New Stripe collection is not a prerequisite for manual-first GVM acceptance. Recovery/idempotency must be proven before activating a real-provider route; no currently supported workflow may be silently removed to avoid acceptance. Stored-value/refund destination policy is a later explicit business decision, not decided here. No runtime void path is invented.
- SEQ-ACL-1 is tracked in #153. No sequence/default ACL correction is authorized. The hosted legacy NULL-linked authenticated INSERT/UPDATE/DELETE smoke remains NOT RUN and mandatory before adoption; #153 closes before permission cutover.

### Golden reference metadata and proof limits

Six synthetic compact-JSON UTF-8 byte strings and SHA-256 digests matched between Node `JSON.stringify`/`node:crypto` and Python compact `json.dumps`/`hashlib`. This was coordinator-run offline in a temporary directory, not an implemented runtime normalization/auth/database test. Standalone reference filename: `fingerprint-v1-reference-vectors.json`; exact file SHA-256: `842c4afaf3d68a2778dded613a1b57dd4775a4019a3465c5130a82cc5d2f9874`. This metadata supersedes the corrected Sol report's statement that the container hash was not supplied. Reviewers accepted the supplied provenance but did not claim to recompute it. PostgreSQL must not recompute the stored request fingerprint.

### Next genuine Product Owner decision and remaining finish line

**Approve prepared-only R1a authoring/offline proof on one governed dependent branch/PR based on the freshly reconciled #155 head.** Keep #155 Draft and do not put runtime implementation into the foundation PR. This proposal permits no migration application, hosted fixture, legacy smoke execution, current writer/UI wiring, projection/receipt/invoice/mirror schema, fresh booking, stored-value/refund/provider activation, #153 changes, merge, Production/GVM action, #135 release or technician resumption.

After that candidate's independent audit, hosted application/fixtures require a separate exact approval. The full path still requires deterministic projections and document/communication recovery; durable booking-operation/no-payment recovery; support for all activated payment/refund/invoice/provider paths; permission cutover; complete responsive Staging fault/concurrency/workflow acceptance; separately approved Production release; then genuine supported GVM operations proving consistent attempt → ledger → appointment → invoice/receipt → customer/business communication truth. **R1a, successful schema application and earlier Phase 5 acceptance do not earn GVM Operational Acceptance.**

<details>
<summary>Corrected Sol contract — exact reviewed input; qualifications above govern</summary>

```markdown
# Issue #134 — Corrected R1a Runtime-Writer Contract

## 1. Authority, identity and status

**Observed baseline.** Repository identity remains `/Users/darshan/chasum-worktrees/issue-134-foundation`, branch `codex/issue-134-payment-attempt-foundation`, HEAD `e9d1ccac7e2e8224d33cc906732d690a667b8c84`; supplied clean tree `94dfe2963b63d7fff45c59ccf8da4dec467ef04c`. The accepted immutable foundation is `supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql`, SHA-256 `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`, applied only to governed Staging as history `20261005032107`.

This report revises the contract only. No code, migration, branch, test, database, MCP, provider, network, Production or GVM action occurred. Competitive Product Gate remains **NOT_APPLICABLE**: R1a is an internal financial-integrity kernel implementing locked behavior, with no operator workflow or UX change.

**Approval boundary.** The scope below is the coordinator’s corrected proposal. It is **not yet Product Owner authorization**. R1a authoring may start only after explicit PO approval.

## 2. Correction dispositions

| Review point | Corrected disposition |
|---|---|
| G-B invoice/receipt/mirror DDL | Removed from R1a. No existing-table uniqueness, counter, invoice, receipt or mirror mutation. Those belong to separately reviewed R1b/later gates. |
| G-B kill switch | Flag gates new admission only. Existing or ambiguous canonical identities remain recoverable and can never fall through to legacy. |
| G-B KEY_CONFLICT rollback | Corrected: KEY_CONFLICT is a committed logical result. Its idempotent event survives because the RPC returns rather than raises. |
| G-B reconciliation worker | Removed. R1a creates durable obligations only; it performs no projection synchronization. |
| Claude B1 indivisibility | Settled: the ledger and exactly four obligations commit together because the obligation FK requires the linked ledger. PENDING means durable unfinished work, not completion. |
| Claude B4 ordering/binding | Locked below: same-transaction ACCEPTED update precedes linked ledger insert; every lookup is Business-scoped and appointment customer binding is checked. |
| Claude B5 composite keys | Deferred with all R1b existing-table schema work. R1a does not create dependent receipt/mirror FKs. |
| Claude B6 fresh booking | Payment fingerprint v1 remains valid for `booking_operation` + UUID. A separate future booking-operation registry/fingerprint is required, but payment v2 is not required solely for that discriminator. |
| Sequence privilege disagreement | Unresolved by design in R1a. No sequence/default-ACL grant change or fresh hosted claim. Exact effective privilege is tested at the later governed application/fixture gate. |
| Vector gap | Closed for reference values: six Node/Python byte-and-digest matches are supplied. The enclosing vector artifact’s filename/exact-byte file hash was not supplied, so no container hash is invented. R1a authoring must save the literal artifact and record its SHA-256. |

## 3. Exact R1a boundary

R1a is an **inactive, manual-payment kernel**. It adds no user-facing wiring and changes no current writer route.

Admission allowlist:

- target: existing customer, optionally one existing appointment;
- target discriminator: `customer` or `appointment`;
- kinds: `payment` or `deposit`;
- methods: `cash`, `debit_card`, `credit_card`, `e_transfer`, `other`;
- provider route: `manual`;
- explicit invoice selector: prohibited before admission;
- gift card, store credit, `none`, booking-operation integration, refund, void, adjustment and Stripe route: prohibited in R1a.

Cards remain available in current product behavior. R1a merely represents a manual card record distinctly from a future real provider charge. No currently supported method is disabled to manufacture acceptance.

### File-category allowlist

On a new dependent branch/PR from the reconciled #155 head, after PO authorization only:

1. **One new additive migration**, created using the repository’s migration CLI at authoring time; no filename is pre-invented.
2. **New server-only files under one bounded payment-attempt domain directory in `lib/commerce/`** for:
   - v1 normalization and fingerprinting;
   - per-request authenticated authorization context;
   - admission/recovery reads;
   - default-off new-admission gate;
   - typed RPC result mapping.
3. **One literal offline vector fixture** under the test fixture tree.
4. **New focused unit/migration contract tests** under `tests/unit/commerce/` and `tests/unit/migrations/`.
5. **One new focused disposable-PostgreSQL R1a contract fixture/verifier**, reusing the accepted foundation/disposable setup without rerunning prior foundation audits.
6. Bounded R1a review/continuity documentation.

Forbidden files/categories include existing Server Actions, components, booking actions, current commerce payment/refund/invoice/receipt/provider implementations, communications, environment manifests, release controls, existing migrations and #155 foundation source. No expansion of PR #155 and no competing foundation branch.

## 4. Allowed SQL objects and permissions

The follow-on migration may create exactly two functions:

1. `public.admit_payment_attempt_v1(...)`
2. `public.commit_manual_payment_attempt_v1(...)`

Both must be:

- `LANGUAGE plpgsql SECURITY INVOKER`;
- fixed `search_path = pg_catalog, pg_temp`;
- fully schema-qualified internally;
- `EXECUTE` revoked from PUBLIC, `anon` and `authenticated`;
- executable only by `service_role`;
- free of external calls and dynamic arbitrary SQL.

R1a adds no table, column, index, constraint, policy, trigger, sequence, default privilege, broad grant/revoke or historical data change. It does not alter the applied foundation. It does not clean up #153 or SEQ-ACL-1.

## 5. Admission, identity and conflict contract

Before any service-client call, the server helper must reauthenticate and resolve the current actor and Business through the existing session guards represented by `lib/actions/business.ts:7-18` and `:64-84`. Because those functions are request-cached, “reauthorize every time” means once per incoming request, before every privileged recovery/admission/commit flow.

The helper validates:

- customer `(id,business_id)`;
- optional appointment `(id,business_id)`;
- appointment `customer_id` equals the requested customer;
- supported Business currency and normalized minor-unit amount;
- R1a target/kind/method/manual-route allowlist;
- absence of explicit `invoice_id`.

It computes the exact frozen v1 tuple and fingerprint. PostgreSQL stores but does not independently recompute that hash. Original `source` and `actor_id` remain immutable attribution and are excluded from equality; recovery by another currently authorized actor/surface remains possible.

`admit_payment_attempt_v1` performs one transaction:

1. attempt insert-or-winner lookup on `(business_id,attempt_key)`;
2. first admission appends one REQUESTED/NOT_RECORDED event;
3. replay locks/reads the winner and compares authoritative stored tuple columns—not merely the caller hash;
4. equal tuple returns the existing attempt;
5. any tuple difference, including equal fingerprint with changed tuple, appends a retry-idempotent KEY_CONFLICT event and returns `KEY_CONFLICT`.

Conflict evidence uses a stable event UUID derived server-side from the winner identity and conflicting canonical tuple. If that UUID exists, the RPC must verify the row has the same Business, attempt and `KEY_CONFLICT` type. Any mismatch is an integrity failure. KEY_CONFLICT does not mutate winner execution/recovery/failure fields and never automatically creates a new key. A legitimate equal-value second payment requires a deliberately new attempt UUID.

Expected replay/conflict outcomes return normally and commit. Unexpected database failures raise, roll back the open transaction and become infrastructure/transport uncertainty.

## 6. Atomic manual commit and replay

`commit_manual_payment_attempt_v1` accepts only Business and attempt identity plus bounded evidence identity. It must not accept caller-supplied amount, currency, customer, appointment, method, kind or provider as ledger authority. Those values come from the locked immutable attempt.

For a REQUESTED attempt, one database transaction must:

1. lock the attempt;
2. revalidate Business/customer and optional appointment customer+Business binding;
3. confirm no linked ledger already exists;
4. update `execution_state` to `ACCEPTED`;
5. insert one linked `succeeded` `commerce_transactions` row using the stored money tuple, `provider='manual'`, deterministic attempt-derived manual reference and `payment_attempt_id`;
6. append ACCEPTED/RECORDED evidence;
7. insert exactly four reconciliation obligations;
8. commit once.

The ACCEPTED update occurs before the ledger INSERT, satisfying the foundation guard at `20261004190341…sql:215-233`, but it is not separately committed. Any later statement failure rolls back the state update, ledger, event and obligations together.

Obligations:

| Target | appointment_cache | invoice_settlement | customer_payment_events | receipt |
|---|---|---|---|---|
| Existing appointment | PENDING | PENDING | PENDING | PENDING |
| Customer-only payment | NOT_REQUIRED with `completed_at` | PENDING | PENDING | PENDING |

No invoice row does **not** prove invoice settlement is unnecessary because the existing flow may issue one. PENDING deliberately means durable unfinished work. R1a returns `recorded=true`, the ledger identity and `synchronization=PENDING`; it never reports financial synchronization or receipt completion.

An ACCEPTED attempt with a consistent linked ledger and exactly the expected four obligations is replay: return the existing identity without writes. ACCEPTED with missing/inconsistent ledger or obligations is UNKNOWN/integrity hold—never fabricate, repair or issue another effect. FAILED or SKIPPED attempts are not revived in R1a. The foundation’s legal future `FAILED -> ACCEPTED` recovery remains preserved for later design.

## 7. Gate and recovery semantics

The default-off flag applies only to **new** admission.

For a presented attempt key, the server first performs authorized canonical recovery lookup:

- existing canonical identity: recover/replay through the kernel even if new admission is disabled;
- lookup/RPC/schema uncertainty: return UNKNOWN/hold;
- confirmed absent identity plus disabled flag: return NOT_ADMITTED_DISABLED;
- enabled plus confirmed absent: admission may proceed.

Once a key is admitted or admission outcome is ambiguous, this code must never invoke `recordCommercePayment`, the Booking Sheet weak match at `lib/actions/appointments.ts:491-503`, or any other legacy writer. Disabling suspends new admissions but preserves safe recovery and commit replay.

Current UI and Server Actions remain completely unwired and unchanged. Therefore existing runtime writers retain only their current guarantees and are not claimed canonical-safe.

## 8. Golden vectors

The literal fixture must preserve all six supplied canonical byte strings and fingerprints:

- appointment cash payment: `v1:62b88626d90f2cbc0080a219aa5d27cdf521dc94400d81ab337ac4fe4fcdfb12`
- appointment e-transfer deposit: `v1:ceb00e5af4adffa434780286eeffefc3f6db1c20881e5c6d6c8540f7a76631ef`
- booking-operation deposit: `v1:8f3669d21d737e6bfb4579d958115c4646af83d35b4b0efc2a023e1f2a128aba`
- customer cash payment: `v1:0c73f4d1f1c9e2e9be0d14f8dc1d47cf5ee07de80ab44084a4f3e234b10e40e4`
- appointment none: `v1:62d306e5c12998634dd9b74f2c63aab831381a77b4de5131e32dcfd6ec1002d9`
- gift-card design reference: `v1:4be365d45d50bef731b332022a0a7483b5f6e61c9c0402ba6a6a45bddee414ae`

The final two and booking-operation vectors are contract references, not R1a-admissible modes. Supplied evidence proves only Node/Python compact-JSON byte/hash agreement, not runtime normalization, authorization or database behavior.

## 9. Offline proof and stop criteria

Required local proofs on new R1a code only:

- all six vectors and malformed-normalization rejection;
- per-request actor/Business/customer/appointment-customer binding;
- same-key concurrent admission and one REQUESTED event;
- committed, deduplicated KEY_CONFLICT across retry;
- two deliberate keys with equal-value payments;
- source/actor-independent replay with current actor reauthorization;
- rejection before admission of explicit invoice and every non-R1a mode;
- atomic rollback before commit and lost response after commit;
- ACCEPTED replay from ledger plus exactly four obligations;
- inconsistent/missing ledger or obligation produces UNKNOWN;
- flag-off, missing-RPC and ambiguous-schema canonical routing;
- obligations remain pending and result never claims synchronization;
- existing rows unchanged;
- literal service-role invoker boundary.

Stop immediately if the candidate changes current writer/UI routes, adds an unlisted SQL object, mutates existing grants/defaults/data, changes the immutable foundation, generates a second effect after uncertainty, or cannot prove rollback/replay behavior. No hosted application follows automatically.

## 10. Finite path to GVM acceptance

1. PO authorizes prepared-only R1a authoring/offline proof.
2. Exact candidate receives Grok challenge and independent Level-3 review.
3. Separate PO gate decides follow-on migration application and isolated Staging kernel fixtures.
4. Mandatory hosted authenticated NULL-linked legacy INSERT/UPDATE/DELETE smoke passes before adoption.
5. Separately reviewed R1b/later gates settle projections, exact composite keys, collision preflight, invoices, mirrors, receipt documents/counters and communications recovery.
6. Fresh booking adds a narrow immutable booking-operation fingerprint/registry and durable appointment binding while retaining payment v1’s `booking_operation` discriminator; no generic workflow platform or availability rewrite.
7. Stored value, refund policy, explicit-invoice v2 and real-provider recovery are separately completed before activating those paths. Gift/store refund destination remains a genuine later PO policy question. Stripe recovery is required before its configured real-provider route activates, not before manual-first GVM acceptance.
8. #153/SEQ-ACL-1 closes before permission cutover.
9. Full responsive Staging workflows prove Booking Sheet, Quick Appointment, Payments, Customer Billing, refunds where supported, no-payment/public booking, receipt recovery and customer/business emails each once.
10. Separately approved governed Production release precedes genuine GVM Operational Acceptance. No manufactured Production booking.

## 11. Next genuine Product Owner gate

**Coordinator proposal awaiting PO approval:** authorize a new dependent branch/PR for prepared-only R1a authoring and offline proofs exactly as bounded above.

Explicitly withheld: expansion of #155, migration application, hosted fixtures, legacy smoke execution, UI/action wiring, current writer routing, projections, receipt/invoice/mirror schema, fresh booking, stored value, refunds, Stripe, #153 changes, merge, Production and GVM acceptance.
```

</details>

<details>
<summary>Grok final corrected-contract report — G-A</summary>

```markdown
# Issue #134 corrected R1a — final reconfirmation

**Verdict: G-A corrected-contract PASS. W-A ready for the bounded prepared-only implementation Product Owner gate.** This is approval-readiness of contract `34b8bc0986ab0fc4afe6f559ea489715297229264bbeebd79f4d621f1d90469c` only. It is not Product Owner authorization, runtime acceptance, hosted proof, Production, or GVM.

## Boundary accepted

The first stage is exactly two invoker RPCs, `admit_payment_attempt_v1` and `commit_manual_payment_attempt_v1`, plus an unwired server-only module and offline kernel proof. The prior three/four-RPC recommendation is withdrawn for R1a. Skip and reconcile stay out. Receipt, invoice, and mirror DDL stay out. No global uniqueness, no current route or UI change, no existing-table grant change.

That split is safe for this stage. The obligation FK requires the linked ledger row, so the ledger insert and exactly four obligation rows belong in one commit. `PENDING` is durable unfinished work. It does not require a projection worker, and it does not report financial synchronization or receipt completion. `appointment_cache = NOT_REQUIRED` with `completed_at` is valid only for a customer-only target, which has no appointment. Invoice absence stays `PENDING` on both targets, because no invoice row is proof that settlement will never be required. Later R1b owns projection, documents, counters, and communications recovery.

## Correction dispositions

| Point | Disposition |
|---|---|
| Invoice/receipt/mirror DDL and global constraints | Accepted as removed. |
| Kill switch | Accepted. The flag blocks new admission only. |
| KEY_CONFLICT | Accepted. Logical return commits one idempotent event; the winner’s execution, recovery, and failure fields stay unchanged. A raise remains only an unexpected-fault rollback. |
| Reconcile worker | Accepted as removed from R1a. |
| Same-transaction order | Accepted. Lock, revalidate binding, confirm no ledger, update `ACCEPTED`, insert the linked succeeded manual ledger row, append evidence, insert four obligations, then one commit. A later statement failure rolls the state change back with the effect. |
| Binding | Accepted. Each incoming request re-resolves actor and Business once through the session guards before any service-role call, then checks customer `(id, business_id)` and, when present, appointment `(id, business_id)` plus `customer_id`. Commit repeats that binding from the stored attempt and rejects caller-supplied money fields. |
| Payment v1 `booking_operation` | Accepted and not overridden. The v1 discriminator plus operation UUID stays. A later booking registry is a separate fingerprint. It does not by itself require payment v2. Explicit invoice intent still requires reviewed v2. Fresh booking, `none`, gift, store credit, refund, void, and Stripe are reference or later scope, not R1a-admissible. |
| Sequence / existing privileges | Accepted as a candidate stop, not a #153 change. The offline verifier must execute both RPCs as literal `service_role`. If current grants cannot insert the attempt, event, linked ledger, or four obligations, or cannot update `execution_state`, the candidate stops. It must not add table, sequence, or default ACL privileges. |
| Vectors | Closed for this gate by the supplied metadata below. That metadata is not runtime, authorization, or database proof. |

## Required checks

Committed KEY_CONFLICT evidence, immutable winner, per-request authorization, tenant/customer/appointment binding, ACCEPTED-before-ledger with no intermediate commit, four durable obligations, no false synchronization, and no legacy fallthrough for an admitted or ambiguous key are specified tightly enough to author. Confirmed absence with the flag off returns `NOT_ADMITTED_DISABLED`. Lookup, RPC, or schema uncertainty returns UNKNOWN/hold. An inconsistent ACCEPTED ledger or obligation set is an integrity hold: no repair and no second effect. `FAILED → ACCEPTED` stays later design. #153/SEQ-ACL-1 and the hosted authenticated NULL-linked legacy INSERT/UPDATE/DELETE smoke remain mandatory before adoption and are outside this authorization. Applied foundation SHA `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47` stays immutable.

Section 2’s sentence that the vector container hash was not supplied is superseded by coordinator metadata: `/tmp/chasum-134-runtime-gate-k_5i5hpm/fingerprint-v1-reference-vectors.json`, standalone SHA-256 `842c4afaf3d68a2778dded613a1b57dd4775a4019a3465c5130a82cc5d2f9874`, six Node/Python byte-and-digest matches. No Product Owner investigation remains on that artifact. Authoring must save that literal file; the recorded SHA must equal the value above.

## Remaining blocker

None for this prepared-only contract gate.

## Next genuine Product Owner gate

Authorize one new dependent branch from the reconciled #155 head to author prepared-only R1a exactly as bounded: the two functions, the unwired `lib/commerce/` payment-attempt module, the literal vector fixture at the SHA above, focused unit/migration tests, one disposable PostgreSQL R1a verifier, and bounded review notes.

Withheld: expanding #155, applying the migration, hosted fixtures, legacy smoke execution, UI or action wiring, projection work, receipt/invoice/mirror schema, fresh booking, stored value, refund policy, Stripe, #153 changes, merge, Production, and GVM.

## Limits

No source was re-opened in this pass. No hash was recomputed here. No test, database, MCP, network, git, or implementation action was run. Disposable or hosted `service_role` privilege results are still unexecuted; a privilege failure later stops the candidate and does not expand this gate. Full workflow acceptance remains the later manual-first path: supported booking and payment surfaces, response-loss recovery, receipts, both booking emails, and authoritative displays, with real-provider recovery required only before that provider route is activated.
```

</details>

<details>
<summary>Claude final corrected-contract report — W-A</summary>

```markdown
# CLAUDE — Final Independent Gate Verdict: Corrected R1a Contract
Contract hash as supplied: 34b8bc0986ab0fc4afe6f559ea489715297229264bbeebd79f4d621f1d90469c

## VERDICT: W-A — ready for a bounded prepared-only implementation PO gate

No remaining blocker. The corrected contract is internally consistent, strictly smaller
than my earlier recommendation, and consistent with the accepted foundation as I inspected
it earlier in this session. Three authoring constraints below are conditions on the
candidate, not contract defects. G-A/G-B is Grok's to issue; I make no claim about it.

## Boundary decision: ACCEPTED

I explicitly accept the two-RPC boundary (`admit` + `commit_manual`) with an unwired
server-only module and offline proof, and I withdraw my prior three/four-RPC shape as a
requirement. The reasoning holds: obligations FK the linked ledger row created in the same
transaction, so no projection worker is needed to insert them, and `PENDING` with
`completed_at` NULL satisfies the foundation's completion check. Dropping the skip RPC is
coherent because `payment_kind='none'` is outside the R1a allowlist. Removing all
legacy invoice/receipt/mirror DDL also dissolves my B1 and B5: those were objections to
constraints that would have changed live legacy behavior and to FKs needing composite
keys. With no existing-table DDL, neither applies. My B1 split recommendation is satisfied
by a narrower R1a than I proposed.

## Correction dispositions

- **B2 KEY_CONFLICT (accepted).** Committed logical result, winner untouched, retry-
  idempotent via a server-derived event UUID. Correct. The winner must not receive a
  `failure_code`, and §5 says so.
- **B3 kill switch (accepted).** Recovery-first lookup, `NOT_ADMITTED_DISABLED` only on a
  confirmed-absent identity, UNKNOWN/hold on uncertainty, and an explicit prohibition on
  reaching `recordCommercePayment` or the weak appointment match. This is the correct
  resolution.
- **B4 ordering/binding (accepted).** Same-transaction ACCEPTED update before the linked
  ledger insert with no intermediate commit, Business-scoped lookups, appointment-to-
  customer binding revalidated inside the commit RPC. Correct, and necessary because no
  database constraint ties an attempt's appointment to its customer.
- **B6 fresh booking (conceded).** I accept the settlement against the accepted source:
  payment fingerprint v1 already carries the `booking_operation` discriminator, so a later
  registry does not by itself require payment v2. I withdraw the v2-for-booking framing.
  What survives is narrower and unchanged by this concession: the booking-operation
  registry, its own immutable fingerprint, the durable appointment preallocation and the
  NULL→value appointment binding path remain unsettled and excluded from R1a. Explicit
  invoice intent still requires a separately reviewed v2.
- **Sequence privilege (accepted as unresolved by design).** Correct to leave open with no
  grant change and no fresh hosted claim.
- **Vector artifact (accepted as metadata).** I record the supplied path and standalone
  file SHA-256 `842c4afa…9874` and the Node/Python byte-and-digest agreement as a
  coordinator offline observation. It supersedes only the missing-metadata statement. I
  did not and cannot verify the file, its bytes, or any of the six digests in this
  read-only turn, and it is not normalization, authorization or database testing. No PO
  decision is implicated.

## Requested specific confirmations

Committed KEY_CONFLICT with immutable winner: satisfied. Per-request authorization plus
tenant/customer/appointment binding: satisfied, with the request-cached clarification
stated honestly. Same-transaction ACCEPTED-before-ledger with no intermediate commit:
satisfied. Four durable obligations with no false synchronization: satisfied, including
`NOT_REQUIRED` carrying `completed_at` as the foundation's check requires, and
`synchronization=PENDING` never reported as settlement. Admitted or ambiguous identity
never falling to legacy even with the flag off: satisfied. No existing schema or
permission change: satisfied; R1a creates only two functions and no table, column, index,
constraint, trigger, policy, sequence, default privilege or data change. No
invoice-absence⇒`NOT_REQUIRED` inference: satisfied and explicitly reasoned. Deferred
policy decisions are minimal, and the finish line stays manual-first with no supported
method disabled and no new pricing or product restriction.

## Three authoring constraints (candidate conditions, not blockers)

1. **Activation remains prohibited until projections exist.** R1a deliberately produces
   obligations nothing processes. Because the module is unwired and the flag defaults off,
   this is inert, but the candidate must state that enabling the flag is not permitted
   before the separately reviewed projection work; otherwise committed money would sit
   behind permanently PENDING projections.
2. **Handle the duplicate-event race.** The derived KEY_CONFLICT event UUID dedupes via
   the events primary key, so a concurrent identical conflict will raise a unique
   violation. That must be caught, re-read, verified for the same Business, attempt and
   event type, and returned as a committed KEY_CONFLICT, or the committed-result semantics
   break under concurrency.
3. **Prove privileges; never broaden them.** The attempt-side grants are column-scoped, so
   the ACCEPTED update must touch only granted columns. Add a stop criterion: if authoring
   finds any required existing-table or column privilege absent, stop and report rather
   than adding a grant, altering defaults, or touching #153/SEQ-ACL-1.

## Exact next genuine PO gate

Authorize only prepared-only R1a authoring and offline proofs on a new dependent
branch/PR from the reconciled #155 head, within the stated file-category and SQL
allowlists. Withheld: expansion of #155, migration application, hosted fixtures, the
mandatory hosted legacy NULL-linked authenticated DML smoke, UI/action wiring, current
writer routing, projections, receipt/invoice/mirror schema, fresh booking, stored value,
refunds, Stripe, #153 changes, merge, Production and GVM acceptance.

## Limits

Contract-text review only. No tools, source re-inspection, hosted checks, tests, database
or network calls in this turn; earlier findings are reused, not re-verified. I verified no
supplied hash, including the contract and vector artifact hashes, and the legacy DML smoke
remains NOT RUN. This is approval-readiness for a document, not PO authorization, code
acceptance, or any runtime, Production or GVM acceptance.
```

</details>

<details>
<summary>Literal offline fingerprint reference file — preserve exact bytes when extracted</summary>

```json
{
  "status": "OFFLINE REFERENCE VECTORS ONLY \u2014 NOT RUNTIME IMPLEMENTATION OR DB TEST",
  "source": "Locked v1 tuple at e9d1ccac7e2e8224d33cc906732d690a667b8c84 docs/reviews/issue-134-payment-attempt-foundation.md",
  "verification": "Node JSON.stringify + node:crypto independently compared to Python json.dumps compact UTF-8 + hashlib.sha256. Six exact byte/hash matches. No database, provider, network or tenant data used. Normalization, source/actor exclusion, authorization and application behavior remain future runtime tests.",
  "vectors": [
    {
      "name": "appointment-cash-payment",
      "tuple": [
        "chasum.payment-attempt",
        1,
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        "appointment",
        "33333333-3333-4333-8333-333333333333",
        5000,
        "cad",
        "cash",
        "payment",
        "manual",
        null
      ],
      "canonical_utf8": "[\"chasum.payment-attempt\",1,\"11111111-1111-4111-8111-111111111111\",\"22222222-2222-4222-8222-222222222222\",\"appointment\",\"33333333-3333-4333-8333-333333333333\",5000,\"cad\",\"cash\",\"payment\",\"manual\",null]",
      "sha256": "62b88626d90f2cbc0080a219aa5d27cdf521dc94400d81ab337ac4fe4fcdfb12",
      "fingerprint": "v1:62b88626d90f2cbc0080a219aa5d27cdf521dc94400d81ab337ac4fe4fcdfb12"
    },
    {
      "name": "appointment-etransfer-deposit",
      "tuple": [
        "chasum.payment-attempt",
        1,
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        "appointment",
        "33333333-3333-4333-8333-333333333333",
        5000,
        "cad",
        "e_transfer",
        "deposit",
        "manual",
        null
      ],
      "canonical_utf8": "[\"chasum.payment-attempt\",1,\"11111111-1111-4111-8111-111111111111\",\"22222222-2222-4222-8222-222222222222\",\"appointment\",\"33333333-3333-4333-8333-333333333333\",5000,\"cad\",\"e_transfer\",\"deposit\",\"manual\",null]",
      "sha256": "ceb00e5af4adffa434780286eeffefc3f6db1c20881e5c6d6c8540f7a76631ef",
      "fingerprint": "v1:ceb00e5af4adffa434780286eeffefc3f6db1c20881e5c6d6c8540f7a76631ef"
    },
    {
      "name": "booking-operation-deposit",
      "tuple": [
        "chasum.payment-attempt",
        1,
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        "booking_operation",
        "44444444-4444-4444-8444-444444444444",
        5000,
        "cad",
        "e_transfer",
        "deposit",
        "manual",
        null
      ],
      "canonical_utf8": "[\"chasum.payment-attempt\",1,\"11111111-1111-4111-8111-111111111111\",\"22222222-2222-4222-8222-222222222222\",\"booking_operation\",\"44444444-4444-4444-8444-444444444444\",5000,\"cad\",\"e_transfer\",\"deposit\",\"manual\",null]",
      "sha256": "8f3669d21d737e6bfb4579d958115c4646af83d35b4b0efc2a023e1f2a128aba",
      "fingerprint": "v1:8f3669d21d737e6bfb4579d958115c4646af83d35b4b0efc2a023e1f2a128aba"
    },
    {
      "name": "customer-cash-payment",
      "tuple": [
        "chasum.payment-attempt",
        1,
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        "customer",
        null,
        5000,
        "cad",
        "cash",
        "payment",
        "manual",
        null
      ],
      "canonical_utf8": "[\"chasum.payment-attempt\",1,\"11111111-1111-4111-8111-111111111111\",\"22222222-2222-4222-8222-222222222222\",\"customer\",null,5000,\"cad\",\"cash\",\"payment\",\"manual\",null]",
      "sha256": "0c73f4d1f1c9e2e9be0d14f8dc1d47cf5ee07de80ab44084a4f3e234b10e40e4",
      "fingerprint": "v1:0c73f4d1f1c9e2e9be0d14f8dc1d47cf5ee07de80ab44084a4f3e234b10e40e4"
    },
    {
      "name": "appointment-none",
      "tuple": [
        "chasum.payment-attempt",
        1,
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        "appointment",
        "33333333-3333-4333-8333-333333333333",
        0,
        "cad",
        null,
        "none",
        null,
        null
      ],
      "canonical_utf8": "[\"chasum.payment-attempt\",1,\"11111111-1111-4111-8111-111111111111\",\"22222222-2222-4222-8222-222222222222\",\"appointment\",\"33333333-3333-4333-8333-333333333333\",0,\"cad\",null,\"none\",null,null]",
      "sha256": "62d306e5c12998634dd9b74f2c63aab831381a77b4de5131e32dcfd6ec1002d9",
      "fingerprint": "v1:62d306e5c12998634dd9b74f2c63aab831381a77b4de5131e32dcfd6ec1002d9"
    },
    {
      "name": "gift-card-design-only",
      "tuple": [
        "chasum.payment-attempt",
        1,
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        "appointment",
        "33333333-3333-4333-8333-333333333333",
        5000,
        "cad",
        "gift_card",
        "payment",
        "manual",
        "55555555-5555-4555-8555-555555555555"
      ],
      "canonical_utf8": "[\"chasum.payment-attempt\",1,\"11111111-1111-4111-8111-111111111111\",\"22222222-2222-4222-8222-222222222222\",\"appointment\",\"33333333-3333-4333-8333-333333333333\",5000,\"cad\",\"gift_card\",\"payment\",\"manual\",\"55555555-5555-4555-8555-555555555555\"]",
      "sha256": "4be365d45d50bef731b332022a0a7483b5f6e61c9c0402ba6a6a45bddee414ae",
      "fingerprint": "v1:4be365d45d50bef731b332022a0a7483b5f6e61c9c0402ba6a6a45bddee414ae"
    }
  ]
}
```

</details>

## Governed Staging application — 2026-10-04 23:21 Toronto

**2026-10-04 23:21 America/Toronto — Issue #134 foundation APPLIED TO GOVERNED STAGING ONLY.** Product Owner explicitly approved the exact migration. Native Supabase application succeeded once on `wnfahklzaxirftyskctd`; hosted history is `20261005032107 / issue_134_payment_attempt_foundation` (2026-10-05 UTC). [Application evidence](https://github.com/renovisionai2-cloud/chasum/pull/155#issuecomment-5987566406).

Applied source remains `supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql`, reviewed head `fc83ae4b14d3a806be942a82afb4e9ffefb44241`, tree `5cb58423d3a6ce0af8ff5e5c70cb7168e92513eb`. The stored 15,667-byte SQL independently hashes to `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`. **Do not edit the applied source or reapply because the hosted timestamp differs.** This continuity restamp is documentation-only and does not change the applied candidate identity.

Grok **G-A PASS** and Claude **A1** on that exact prepared candidate are complete. Do not restart them. Post-write read-only SQL verified 54 validated constraints, 17 valid/ready indexes, 3 matching SECURITY INVOKER guard bodies, 4 enabled triggers, RLS on all 3 new tables, expected same-Business keys/FKs, generated event ordering/financial classification and zero new-table PUBLIC/anon/authenticated privileges. All 66 checked catalogue/history entries share transaction xmin `4575`. New attempts/events/reconciliation/linked-ledger counts are all zero. All seven checked existing data tables and all 10 prior migration-history rows retain identical digests/counts. Fresh-session timeout defaults are lock `0`, statement `2min`; no reused-session RESET proof is claimed.

**SEQ-ACL-1 / Issue #153:** the identity sequence inherited postgres-owned public-schema defaults granting anon/authenticated `USAGE + SELECT`, not UPDATE. The new tables remain inaccessible to those roles. No exploit/API reachability or sequence calls were tested. This separate least-privilege finding was recorded, not silently corrected; no additional grant/default-ACL/schema mutation is authorized.

**Post-application independent review:** **COMPLETE — Claude S-A: exact Staging schema application ACCEPTED with bounded SEQ-ACL-1 follow-up in #153; no immediate corrective DDL gate.** Claude independently inspected source/identity and reviewed supplied live SQL evidence; Claude did not query Staging or reproduce hosted writes. Session `e4424f59-4662-4eca-8294-0fad6fab508f`.. This is a new read-only review of Staging evidence and SEQ-ACL-1, not a rerun of the completed foundation audits.

**Before runtime adoption:** require an explicitly governed hosted Staging authenticated INSERT/UPDATE/DELETE smoke with NULL `payment_attempt_id`, because the new trigger also runs on legacy writers. The local PostgreSQL proof remains valid but is not a hosted write test. Confirm linked writes execute as `service_role`; #153 permission closure and all existing runtime/fault/concurrency gates remain open. No hosted DML acceptance was run in this schema-only task.

**Next gate:** separately bounded #134 runtime-writer/admission/replay/reconciliation contract and the necessary permission-hardening disposition. Runtime implementation/application and any corrective migration require their own governed authorization. PR #155 remains DRAFT/UNMERGED. Phase A/#135 remain MERGED TO MAIN / NOT PRODUCTION ACCEPTED; `main` remains `31115e6a51b71fc097c279d205065d80e0be3573`. Prior accepted #131 Production baseline remains `664fbc734c4103d78484c6b3828849a6605a562f`; Production was not contacted or changed in this Staging application task. No provider activation, #133 completion, historical USD repair, weak-dedupe removal, technician resumption or GVM Operational Acceptance. M1C/M2/Time Blocker remain held.

### Control Tower reconciliation of the post-application review

**S-A accepted for schema application only.** This carries no runtime/Production/GVM acceptance. No immediate corrective DDL was performed or required for the inert Staging foundation. SEQ-ACL-1 is real least-privilege debt before permission cutover, not permission to broaden #153 automatically.

Qualifications to the reviewer wording below: the sequence default source predates this migration, but the newly created sequence does carry those inherited grants; do not describe the new object as having no privilege gap. `pg_sequences.last_value = NULL` is an observed unused-state indicator, not a universal historical proof against every possible sequence operation. The tool trace contains no nextval/setval call, and no public API exploitability was tested. Any wider default-ACL correction requires its own dependency review, independent audit and PO authorization; a global default change is not pre-approved by this review. Service-role sequence privileges must be decided/tested in that scoped work, not silently revoked now.

Claude's independent source inspection identified hosted legacy NULL-linked ledger writes as an unexercised acceptance surface; that smoke is mandatory before runtime adoption and was NOT performed under the schema-only approval. Supplied catalogue/hash/data-digest evidence and independent source review are explicitly separate evidence sources.

<details>
<summary>Claude post-application report — returned in one block, preserved verbatim</summary>

```
CLAUDE — INDEPENDENT POST-APPLICATION REVIEW (Issue #134, governed Staging)
Scope: new Staging application evidence + SEQ-ACL-1 only. Foundation/Grok/A1 work closed, not re-reviewed.

VERDICT: S-A — application ACCEPTED as an exact schema application, with one explicitly bounded
follow-up (SEQ-ACL-1) tracked in Issue #153. No immediate corrective gate is required.
This is schema-application acceptance ONLY. It is not runtime, writer, GVM, or Production acceptance.

EVIDENCE PROVENANCE
- MY OWN SOURCE INSPECTION (no DB, no Supabase, no network): HEAD fc83ae4b…, tree 5cb58423…, clean.
  Local SHA-256 of supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql =
  dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47, 15667 bytes — byte-identical to the
  reported hosted ledger statements[1] digest and size. Independent exactness confirmation.
  I verified in-file: 7 attempt UPDATE columns (appointment_id, execution_state, recovery_disposition,
  failure_class, failure_code, updated_at, resolved_at) and 4 reconciliation UPDATE columns
  (state, failure_code, updated_at, completed_at) — matches supplied ACL evidence; no table-level
  UPDATE/DELETE/TRUNCATE granted; no wrapper/BEGIN/COMMIT; RLS enabled on all three tables.
  I also confirmed the file contains ZERO sequence GRANT/REVOKE statements, and that
  event_sequence is the only identity/serial sequence in the entire migration set.
- SUPPLIED LIVE EVIDENCE (ChatGPT, not independently reproduced by me): tool SUCCESS, ledger
  20261005032107, single xmin 4575 across 66 objects, 54 validated constraints, 17 valid indexes,
  4 triggers, 3 function-body SHA matches, zero new rows, seven unchanged before/after digests,
  pg_default_acl == actual sequence ACL, pg_depend identity ownership, pg_sequences.last_value NULL.

SEQ-ACL-1 — ACTUAL vs THEORETICAL CONSEQUENCE
Actual consequence today: none observed. last_value NULL proves no nextval ran. The ACL is provably
inherited platform default (pg_default_acl exactly equals actual ACL; migration grants nothing), so
Issue #134 did not introduce a privilege. UPDATE is false for anon/authenticated/service_role, so
setval — the only sequence operation that could break monotonic forensic ordering — is denied to all
three roles. event_sequence is UNIQUE, so duplicates cannot persist. Identity sequences are advanced
by the server during INSERT, and anon/authenticated hold zero privileges on all three new tables, so
no row can be written by them regardless.
Theoretical consequence, if some role could call nextval/currval/read last_value: sequence
advancement producing numbering gaps, plus a weak cross-tenant aggregate event-volume read. Gaps are
already non-preventable (identity sequences are non-transactional), and event_sequence is forensic
ordering, not money authority. I make NO claim about public API reachability or exploitability.
Characterization: a least-privilege completeness gap that falls short of the migration's own stated
"Do not rely on inherited defaults" principle — real, nameable, and non-financial. It is strictly
smaller than the already-known broad authenticated ledger DML (031 grants
select/insert/update/delete on commerce_transactions to authenticated), which #153 already owns as a
cutover prerequisite. Holding acceptance for the lesser gap while the greater one is an accepted
tracked precondition would be inconsistent.

SMALLEST SAFE NEXT GATE (do not expand, do not touch the applied migration)
1. Leave the applied migration unmodified. No corrective DDL now.
2. Keep SEQ-ACL-1 recorded in #153 as a scoped line item: REVOKE ALL on that sequence from
   anon/authenticated (+ decide service_role, which needs no sequence privilege for identity inserts),
   and fix the schema default so future sequences do not inherit it. Separately designed, audited,
   PO-approved — bundled with #153, not hotfixed.

MANDATORY HOLDS BEFORE RUNTIME ADOPTION / PRODUCTION
A. HIGHEST-PRIORITY UNEXERCISED SURFACE (my source finding, not in the supplied evidence): the new
   BEFORE INSERT OR UPDATE OR DELETE trigger commerce_transactions_attempt_guard fires for EVERY
   ledger writer. lib/commerce/payments.ts and lib/commerce/refunds.ts insert/update
   commerce_transactions via lib/supabase/server createClient() — i.e. as authenticated, not
   service_role. By source the NULL-link path returns early before the current_user check, so legacy
   writes should be unaffected, and this was proven on local PG 17.11 — but the supplied Staging
   evidence is all-static (zero rows, identical digests) and contains NO write test. Require one
   Staging legacy-ledger write/update/delete smoke test as authenticated with payment_attempt_id NULL
   before any runtime adoption.
B. Confirm the future canonical writer's effective DB role is literally service_role (createServiceClient
   path). Guards reject postgres-owned and authenticated linked DML by design.
C. #153 closure of broad authenticated ledger DML remains the permission-cutover precondition.
D. Runtime gates already named in docs/reviews remain open; none are discharged here.

NOT AUTHORIZED / NOT CLAIMED: PR merge, deployment, Production access, runtime activation, GVM
operational acceptance, whole-project security pass, or any expansion of the PO's Staging-only approval.
```

</details>

## Historical prepared-foundation design and validation

The material below records the already completed pre-application design/validation. Its prepared-only and next-audit wording is historical and superseded by the application record above. The migration SQL itself stays immutable.

**Status: PREPARED ONLY / NOT APPLIED.** Alternate correction implementer: GPT-5.6 Sol in Cursor. Date: 2026-10-04. [Draft PR #155](https://github.com/renovisionai2-cloud/chasum/pull/155) on branch `codex/issue-134-payment-attempt-foundation` is the governed prepared-only candidate; see PR #155 for the exact current head. No merge or Chasum database/environment application is claimed. This document describes a candidate, not an application/release approval.

## Authority, source and scope

The [Product Owner authorization](https://github.com/renovisionai2-cloud/chasum/issues/134#issuecomment-5983295092) allows design, additive migration authoring and offline contracts only. Issue #134 body and all ten current comment records were retrieved; the current authorization and supplied Level-3 conclusions supersede earlier preflight-only scope. The earlier consolidated investigation is background, not an instruction to rerun live checks.

Historical Grok-correction entry record: starting HEAD `70a71823d14028d9fa5bed3210bca5d10838f413`, tree `399cdcd6cffff546e1e70c2f41d27c9c3dbf2bf7`, and pre-correction migration SHA-256 `e872ea2cf5002a4f289fd6f938970bb7dbe606851776e1aa8a3cdf9535b0688f`. These are dated provenance, not the current candidate identity. Base main / design source remains `31115e6a51b71fc097c279d205065d80e0be3573`.

**Phase A / PR #154 and #135: MERGED TO MAIN / NOT PRODUCTION ACCEPTED.** #131 remains canonical Production under the supplied governed evidence; no new runtime probe is claimed. #133/#134 remain active. #152 owns the six historical GVM USD-coded rows; #153 owns broad ACL/FORCE-RLS hardening. M1C/M2/Time Blocker remain held. **GVM OPERATIONAL ACCEPTANCE is NOT earned.**

Competitive Product Gate **NOT_APPLICABLE** for this bounded internal financial-integrity foundation: behavior/invariants are already locked by Control Tower and Level-3 preflight; no customer/operator workflow is being implemented. No new product strategy or market comparison is needed for schema authoring. Future material workflow acceptance retains the product gate.

Read inputs include AGENTS, Current Project State, Latest Handoff, Environment Manifest, Chasum Bible, Product Principles, and the financial-truth launch gate in `docs/LAUNCH_READINESS.md` section 7. Relevant exact source: migrations `001`, `020`, `028`, `030`, `031`, recent timestamped migrations, `lib/commerce/payments.ts`, `lib/actions/appointments.ts`, and existing migration/payment contracts. Phase A tenant predicates/affected-row proof, webhook CAS, recorded-but-sync-failed results, fail-closed booking currency, non-financial receipt/email failures and Option A uncertainty all remain untouched.

Supplied Control Tower preflight is sufficient input here: Production 13 transactions (11 succeeded / 2 partially refunded), no detected cache divergence across seven appointments, duplicate groups, over-refunds or stale requires_action; GVM ledger/mirror counts 11/11; six USD-coded rows belong to #152. Staging was similarly clean in bounded checks. Existing RLS is enabled, FORCE false, with broad ACLs under #153. These are supplied observations, not fresh schema verification or permission to connect.

## Claude correction dispositions

| Requirement | Disposition |
| --- | --- |
| R-1 | **IMPLEMENTED / PROVED.** `ACCEPTED` and `SKIPPED` are execution-state terminal; `REQUESTED` transitions remain available and `FAILED -> ACCEPTED` is allowed for evidence-based recovery. |
| R-2 | **IMPLEMENTED / PROVED.** Migration uses session `SET lock_timeout = '5s'` and `SET statement_timeout = '30s'`, immediately asserts both effective values, and resets both at the very end; it contains no `SET LOCAL`, `BEGIN` or `COMMIT`. |
| R-3 | **IMPLEMENTED / PROVED LOCALLY.** The local-only verifier rejects non-loopback authority hosts and every query string/fragment. A fresh temporary PostgreSQL 17.11 cluster bound to `127.0.0.1` passed all 20 grouped apply/object/behavior/role/legacy/concurrency proofs and was stopped and removed. No Chasum environment was contacted. |
| R-4 | **DOCUMENTED FAIL-CLOSED CONTRACT.** Explicit invoice selection is unsupported by v1 and must be rejected, never ignored. The legacy `invoice_id` path remains on the legacy writer until a separately reviewed v2 schema/fingerprint extension. |
| R-5 | **DOCUMENTED AUTHORITATIVE COMPARISON.** The normalized financial-intent columns represented by the canonical fingerprint tuple are authoritative for replay/conflict. Fingerprint is only a version marker/fast path; any tuple mismatch is `KEY_CONFLICT`, including equal-fingerprint mismatch. Original source/actor attribution remains immutable evidence but is deliberately excluded from financial-intent equality so authorized cross-surface/actor recovery remains possible. |
| R-6 | **IMPLEMENTED / PROVED.** Events use a unique generated-always identity `event_sequence`; history indexing and ordering use it rather than display time. |
| R-7 | **IMPLEMENTED / PROVED.** `is_financial` is stored-generated as `projection_kind <> 'receipt'`: receipt is false and all three financial projection kinds are true. |
| R-8 | **DOCUMENTED / PROVED AT ROLE BOUNDARY.** Canonical writer and reconciliation worker must execute as `service_role`; authenticated linked DML is rejected. `pg_cron`/postgres-owned execution is excluded unless separately reviewed. |
| R-9 | **RECONCILED.** The branch and Draft PR #155 exist. Draft PR #155 is the governed prepared-only candidate; see PR #155 for the exact current head. `8df8c15a873df9d7f80c9ff0c33ef525863346e7` is retained only as the pre-correction starting identity. |
| R-10 | **RECORDED PRECONDITION / NOT IMPLEMENTED HERE.** [Issue #153](https://github.com/renovisionai2-cloud/chasum/issues/153) is open; its permission closure is required before canonical-writer cutover, while this foundation performs no broad ACL/FORCE-RLS change. |

## Grok challenge correction dispositions

| Finding | Disposition |
| --- | --- |
| G1 verifier endpoint override | **CORRECTED / PROVED.** The parser rejects any query string or fragment in addition to enforcing PostgreSQL protocol and loopback authority. All four supplied `host`, `hostaddr`, `service` and fragment cases are parser/guard self-tests and were separately invoked with no PostgreSQL execution. |
| H1 libpq environment override | **CORRECTED / PROVED.** Every synchronous and asynchronous `psql` child receives a sanitized environment that preserves normal non-`PG` values and strips every inherited key beginning with `PG` case-insensitively, with no exceptions. A poisoned-parent self-test covers `PGHOSTADDR`, `PGHOST`, `PGSERVICE`, `PGSERVICEFILE`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGOPTIONS`, `PGPASSFILE`, `PGSYSCONFDIR` and a future-shaped `PG*` key before any PostgreSQL execution; it makes no remote connection. |
| G2 session timeout cleanup | **CORRECTED / PROVED.** Session `SET` remains at the top, an immediate PostgreSQL `DO` block asserts 5s/30s, and final `RESET lock_timeout; RESET statement_timeout;` restores fixture-captured pre-migration defaults after successful apply. All DDL remains protected before reset. |
| G3 terminal advisory concern | **INTENTIONAL / DOCUMENTED / STATICALLY LOCKED.** R-1 terminality applies only to `execution_state`; permitted advisory fields may still change. Ledger truth wins, contradiction forces UNKNOWN/review, and the future canonical writer owns coherent transition updates. No broader field freeze was added. |

## Minimum schema decision

Migration: `supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql`. The inspected latest prior file is `20260924150219_issue_73_package_c3_commit_cutover.sql`. The new UTC timestamp follows the current convention; no historical file is renumbered or modified. No Supabase CLI command was used. Exact Grok-corrected migration SHA-256: `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`; Git blob (computed without writing an object): `f6a9b0587ddcb8c6f9efc9b902c63f3d423517a3`.

| Object | Minimum purpose and contents |
| --- | --- |
| `commerce_payment_attempts` | UUID PK; Business + opaque UUID attempt key; required versioned fingerprint; bounded original source; customer; nullable appointment/booking operation/actor; kind, integer minor-unit amount, explicit currency/method/provider route; nullable gift-card UUID; execution state, recovery disposition, bounded failure class/code; created/updated/resolved timestamps. |
| `commerce_transactions.payment_attempt_id` | Nullable UUID with unique constraint and composite same-Business FK. This is the sole durable transaction linkage; transaction ID is recovered by this unique key. Existing rows remain NULL. |
| `commerce_payment_attempt_events` | UUID event ID; Business + attempt FK; bounded event type; required money observation; optional paired projection kind/state; bounded failure class/code; occurrence time. No mutable payload. |
| `commerce_payment_reconciliation` | Business + attempt linked to the ledger; PK `(attempt_id, projection_kind)`; one of four projection kinds; pending/complete/failed/not-required, bounded failure code and timestamps. |

Use text CHECK constraints rather than PostgreSQL enum types: small allowlists remain reviewable and future extension avoids shared enum lifecycle changes. UUID attempt keys exclude free-text/PII keys and are distinct from the attempt row UUID. Amount uses the existing ledger's positive integer range; `none` has exactly zero with NULL method/route. Currency is required lowercase three-letter text, **no default**; runtime must additionally validate the supported Business currency and minor-unit semantics. Currency syntax does not activate every currency or region.

`actor_id` is an immutable opaque authenticated-user identifier when available, not assigned appointment staff. No Auth FK: account deletion must not erase or null financial attribution; server authorization must verify the actor at admission. UUIDs remain confidential tenant identifiers, not anonymous data. Gift-card method requires its tenant-bound internal UUID; raw redeemable code is never stored. Store credit is identified by customer + Business; no second credit-account identity exists in the current schema.

Excluded deliberately: redundant `attempt.transaction_id`, duplicated current ledger/money status, duplicated aggregate sync state, notes/description/raw errors/JSON, UI session ID, provider secrets/payment-intent copy, generic task payloads, worker leases/backoff, arbitrary provider routing, refund/void/adjustment attempts and communication jobs. Existing ledger provider references remain the output identity. Provider admission/recovery must use a stable provider idempotency identity before any future provider call; this migration does not enable provider execution. The first runtime scope must separately gate stored-value balance movement as well as money recording.

No `requested_invoice_id` in v1: this fingerprint identifies a payment for an appointment/booking operation/customer. The v1 canonical writer **MUST fail closed on direct invoice intent**: it must reject every explicit `invoice_id` or requested-invoice selector it cannot represent, never ignore it, and never replay one explicit invoice intent across a differing selector. The current legacy action path that accepts `invoice_id` remains on the legacy writer until a separately reviewed v2 exists. That v2 requires `requested_invoice_id` in the attempt schema and fingerprint tuple plus a `commerce_invoices(id,business_id)` composite key/FK. No invoice schema addition is authorized in this foundation. Any later writer must validate a derived invoice binding (including same Business/customer/appointment) and preserve Phase A's unverifiable-existing-invoice behavior; this foundation does not decide invoice issuance policy.

## State and recovery contract

The three concepts remain separate. Current execution is stored on the attempt; current money is derived from the linked canonical ledger; per-projection synchronization is stored in obligations. Event `money_state` is a historical observation, never a replacement ledger.

| Dimension | Contract |
| --- | --- |
| Execution | `REQUESTED` is durably admitted normalized intent before effects; `ACCEPTED` authorizes execution after server validation; `FAILED` records an execution/admission failure without claiming no money; `SKIPPED` records explicit valid `none` intent. `ACCEPTED` and `SKIPPED` are database-terminal (`PAYMENT_ATTEMPT_STATE_TERMINAL`, SQLSTATE `23514`). `REQUESTED -> ACCEPTED/FAILED/SKIPPED` remains allowed, and `FAILED -> ACCEPTED` remains allowed for later evidence-based recovery. No broader state machine is introduced. |
| Money | Linked `succeeded`, `partially_refunded`, `refunded` means RECORDED (original effect exists; refunded status is not fresh spend). Linked `pending` / `requires_action` means PENDING / REQUIRES_ACTION, never collected money. Failed/canceled ledger outcomes require definitive provider evidence in the future writer before NOT_RECORDED. |
| Missing or conflicting proof | No ledger after an ACCEPTED execution, unavailable/untruncated-unproven lookup, unresolved failure, or conflicting state means UNKNOWN / recover. A valid REQUESTED before execution or SKIPPED can mean NOT_RECORDED only under the future admission transaction contract. No inference from amount/time/description. |
| Recovery | Default `RECOVER` is conservative. `DO_NOT_RETRY` prohibits new collection. `NEW_ATTEMPT_ALLOWED` is valid only for FAILED and requires positive definitive-no-effect proof in the canonical writer. It cannot override a present ledger effect or an unresolved provider result. |
| Resolution | `resolved_at` is outcome-resolution time, not proof all projections or communication finished. Timestamps are written with the future transition; they do not arbitrate dedupe or order financial authority. |

The foundation constrains shapes/identities, not every transition. Terminality applies to `execution_state` only, not every advisory field: where grants/checks permit, service-role may still update recovery, failure and resolution fields after ACCEPTED/SKIPPED. This is intentional foundation scope, not permission to reinterpret money. Contradictory advisory fields never override ledger truth and must force UNKNOWN / review. The future canonical writer owns coherent transition updates; the future canonical reader must prefer ledger truth. The migration intentionally contains no admission RPC, transition engine or automatic event producer. Do not expose these tables directly to clients or translate FAILED into “NOT RECORDED / try again.” N-2: omitted completeness proof must never imply certainty. Absence of a ledger row is not proof a provider did nothing.

Later runtime sequence (design only):

1. Authorize actor/Business and validate normalized input. In one short DB transaction admit `(business_id, attempt_key)` with fingerprint and REQUESTED event. Resolve a concurrent key collision by reading the original row and comparing the normalized stored financial-intent tuple **before returning or acting**. Those tuple columns are authoritative for same-key equality/conflict. `request_fingerprint` is only a version marker and fast path: an equal fingerprint with any differing tuple column is `KEY_CONFLICT` plus a writer-bug alarm, never replay. The database must not recompute the hash. Preserve identity across response loss/restart.
2. Lock original attempt and accept once with ACCEPTED evidence before effects. For create booking, bind an exact durable booking operation to the created appointment. `booking_operation_id` is immutable, indexed but not unique: one booking may have legitimate later attempts. It is not a booking dedupe table or proven creation-recovery implementation.
3. No external network call inside a DB transaction. Provider idempotency/admission/recovery is a separately reviewed runtime step. Unknown provider response stays UNKNOWN under the same attempt identity.
4. In a short transaction, create the linked ledger row, persist outcome event and all four projection obligations together. Conflicting ledger INSERT rolls back; never insert an unlinked row and attach it later. Pending/provider-action rows reserve the same ledger identity; finalization later transitions it and creates obligations atomically.
5. Reconcile projections from the authoritative ledger, not read/add/write deltas. Lock affected appointment/invoice/customer projection targets in a deterministic order across different attempts. Persist projection completion and event in the same transaction as each financial projection. A worker crash before commit retries the same obligation; a crash after commit recovers its result.
6. Lost response/reload reads the tenant-authorized original attempt/ledger/obligations. Same key replays only when every authoritative normalized financial-intent tuple column is equal; fingerprint equality is not sufficient. Any tuple-column difference is an explicit `KEY_CONFLICT`, including the writer-bug alarm case where the fingerprint is equal. Original `source`/`actor_id` attribution is preserved but is not part of financial-intent equality. Definitive corrected intent or a legitimate second equal-value payment uses a new logical key after the no-effect/complete-result boundary. #135's session key is not reused as the durable attempt key.

## Fingerprint v1

Runtime hashing is **not implemented**. The migration stores `v1:` plus 64 lowercase hex SHA-256 characters and freezes that value and its stored request inputs. It cannot prove the caller hashed correctly. The normalized stored financial-intent tuple below is the authoritative equality/conflict evidence; the fingerprint is a version marker and fast path only. Equal fingerprint plus any differing tuple value is `KEY_CONFLICT` and a writer-bug alarm, never replay. The database must not recompute the hash. The future server, never the browser alone, must compute/verify this canonical tuple in this exact order:

`["chasum.payment-attempt", 1, business_id, customer_id, target_kind, target_id, amount_cents, currency, method, payment_kind, provider_route, gift_card_id]`

Canonical bytes: UTF-8 JSON array; no whitespace/BOM; canonical lowercase hyphenated UUID strings; base-10 integer amount with no leading zeros/decimal/exponent; lowercase trimmed supported currency; exact bounded method/kind/route strings; absent nullable elements use JSON `null`, never empty strings or omitted positions. Hash these bytes, prefix `v1:`. Future runtime must publish fixed cross-language test vectors before activation.

Target discriminator: `appointment` + original appointment UUID for an existing appointment; `booking_operation` + durable booking-operation UUID for creation; `customer` + NULL target ID for customer-level money (customer already included). Resolve/replay a booking operation using the same discriminator after the appointment is bound; generated appointment identity does not change the original request hash. If booking_operation_id is supplied, that mode takes precedence and the server must reject unrelated appointment bindings.

Source/surface and actor are original attribution, excluded from the financial fingerprint so authorized recovery across surfaces/actors is possible. Exclude notes, description, names/contact details, timestamps, UI session, receipt/email selection and provider-generated output identity. Internal gift-card UUID is included only for gift-card redemption; store credit uses the customer identity. The provider route IS intent: a manual card record and an external card charge must conflict under the same attempt key. No free-form route/account orchestration is introduced; future connected-account routing must extend the intent contract if relevant.

## Database guarantees and tenant integrity

- `UNIQUE(business_id, attempt_key)` admits at most one row per tenant/key. Fingerprint is required and immutable. Equal amounts under different keys remain valid; there is no amount/time/session/description unique index.
- A single nullable ledger `payment_attempt_id` is globally UNIQUE, hence one attempt links at most one ledger row and a ledger row names at most one attempt. NULLs preserve all historical transactions. A guard rejects every link update, including NULL-to-UUID, freezing attribution and prohibiting backfill. Linked transaction UUID and original request tuple cannot change; linked row deletion is rejected.
- Existing customers, appointments and gift_cards receive only additive `(id,business_id)` unique keys. New composite FKs enforce same-Business customer/appointment/instrument. They prevent later tenant reparenting/deletion of referenced parents. No existing ACL/RLS policy is relaxed.
- Ledger FK enforces attempt Business; the guarded tuple also enforces matching customer, appointment, amount, currency, method, kind and provider route. Only ACCEPTED requests may insert linked rows; unresolved booking-operation attempts cannot insert before appointment binding.
- Appointment can bind NULL-to-UUID once only when a durable booking operation exists; otherwise it is immutable. Same-Business FK is mechanical; proof that the appointment belongs to that exact booking operation/customer is still the future server writer's responsibility. This is not a new appointment-customer-wide constraint or booking-operation registry.
- Events have same-Business attempt FKs. Obligations have same-Business FK directly to the ledger's unique `(payment_attempt_id,business_id)` pair, so no obligation can point at another tenant or an unlinked transaction.
- The attempt row remains durable even after resolution. New-table DELETE/TRUNCATE is not granted to service_role; request/history guards block normal row mutation. Ledger TRUNCATE without CASCADE is blocked by the reconciliation FK, even if empty; CASCADE also requires revoked new-table TRUNCATE privileges. This consequence is mechanically necessary for the foundation, not general #153 hardening.

**Scope of the invariant:** uniqueness protects rows opting into this linkage. Existing unlinked writers and old broad ledger grants remain operational until governed runtime cutover. [Issue #153](https://github.com/renovisionai2-cloud/chasum/issues/153) closure of broad authenticated DML on `commerce_transactions` is a named permission-cutover precondition; it is not implemented here. The foundation does not prohibit an old writer from inserting another unlinked payment. This candidate therefore does **not** claim deployed at-most-once payment behavior, end-to-end exactly-once charging, or safe retry in the current UI. Superuser/DDL owners can disable guards; this is not tamper-proof accounting storage.

## #133 events and reconciliation

Include bounded events **now**, in the shared foundation. Current-state columns alone lose prior requested/accepted/failed/skipped and recovery/sync history. No separate generic audit platform is introduced. `event_sequence bigint generated always as identity` supplies deterministic monotonic forensic ordering and drives the history index. `occurred_at` is display time only. Neither sequence nor display time is financial authority. Event IDs identify evidence occurrences, not payment attempts; future writers should reuse an event ID for a retried evidence append. Transaction identity is obtained through the immutable ledger link; event money_state preserves the historical observation without a second mutable transaction pointer.

Events support valid normalized payment intentions, explicit valid `none`/SKIPPED and admitted failures. They do **not** yet capture requests that fail before Business/customer/currency/amount can be safely normalized. Later #133 must provide bounded pre-admission rejection/transport observability without raw FormData, invented currency/customer or fake payment attempts. Disclosures, Summer tools, Reporting re-source and all event-producing runtime work are deferred.

Include durable obligations **now**: otherwise the next writer could commit money and crash before recording what remains to synchronize. The four bounded kinds are appointment cache, invoice settlement, customer_payment_events mirror, and receipt generation. No generic workflow engine, leases, automatic retries or workers are added. Future worker claiming/scheduling is separately implemented against these durable rows.

All four rows must be created atomically for qualifying committed money, including explicit NOT_REQUIRED when a projection has no applicable target. **Missing obligations mean UNKNOWN**, never complete/not required. There is no aggregate `sync_status` default that can silently certify missing work. The future reader must prove exactly four applicable decisions and validate current ledger/target truth. Existing historical transactions with NULL attempt linkage are outside this guarantee; no completeness/lifetime backfill is inferred.

Financial synchronization aggregates appointment cache, invoice settlement and CRM mirror only. `is_financial boolean generated always as (projection_kind <> 'receipt') stored` makes this classification mechanical. Financial synchronization MUST exclude receipt mechanically by filtering `is_financial = true`; it must not maintain a second hand-written kind list. **Receipt failure never changes recorded money or financial synchronization**; receipt remains a durable obligation with separate document status. Communications remain their own send-intent system and are not an obligation kind here. Do not execute email/SMS/provider calls inside a financial transaction. Receipt uniqueness, number allocation, safe issuance and delivery retry still need their later runtime/constraint review.

## RLS, grants and read boundaries

RLS is enabled on all three new public tables, with no public/anon/authenticated policies or grants. Explicit REVOKE clears inherited defaults; service_role receives SELECT/INSERT and only necessary mutable-column UPDATE on attempts/obligations. Events are SELECT/INSERT only plus append-only guard. No DELETE/TRUNCATE or delegation privileges. There is no owner/staff UI need yet, so do not add speculative direct financial reads; future server paths authorize tenant/actor and filter Business. Summer consumes that same authorized read contract.

All three new functions are SECURITY INVOKER trigger guards with fixed `search_path = pg_catalog, pg_temp`, schema-qualified relations and narrow EXECUTE grants to service_role only. They contain no row writes or RPC payment operation. Trigger invocation is separate from direct function EXECUTE permission. The existing ledger's broad authenticated grants cover new columns too; its guard expressly rejects any non-service_role operation on linked rows. NULL-linked legacy actions return before attempt access, retaining Phase A behavior. The canonical writer and reconciliation worker **must execute in service_role context**. `pg_cron`/postgres-owned execution is excluded unless separately reviewed; it is not an implicit privileged bypass. Direct postgres maintenance of linked rows is intentionally rejected by this role check; any future maintenance exception needs review.

No FORCE RLS, existing-table GRANT/REVOKE, helper replacement, legacy policy rewrite or #153 general cleanup. Service role bypasses RLS and therefore still requires explicit server authorization; a privileged key is not tenant authorization. Current official references checked: [Supabase RLS/grants](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html). The [Supabase changelog](https://supabase.com/changelog) was checked; the recent minor-release breaking-change notice concerns features not introduced here. No platform upgrade performed.

## Compatibility, application gate and rollback

Only DDL and pure guards. No historical INSERT/UPDATE/DELETE, inferred attempts, USD repair, schema-default currency, existing required column or data rewrite. Ledger linkage is nullable without a default. Existing indexes/migrations remain unchanged; redundant tenant-key indexes and nullable-link indexes do scan/build, so this is not a zero-lock migration. Unique tenant keys cannot introduce duplicate-pair failures where existing UUID PKs hold. Exact deployed constraint names/privileges/schema compatibility still need authorized pre-application verification; supplied row counts do not prove that compatibility.

For a future application, execute this exact reviewed file atomically with the repository's authorized transaction-capable runner. Session `SET lock_timeout = '5s'` and `SET statement_timeout = '30s'` are effective even when the runner has not opened an explicit transaction; an immediate `DO` assertion fails if either value is ineffective. Final RESET statements return a successfully reused session to its configured timeout defaults only after all protected DDL/grant work. This file deliberately does not add `BEGIN`/`COMMIT`. Regular unique constraints require locks on existing tables; timeout aborts instead of waiting indefinitely. Empty new FK tables need no historical relationship backfill, and NULL ledger links skip FK matching. Do not silently replace failed statements with IF EXISTS/NOT VALID or use a non-atomic runner. Check actual Staging sizes, lock budget and migration ledger at that later gate; no live connection is made here.

Prepared-only rollback: discard or revise the prepared candidate files and bounded documentation after review; never touch runtime/history to make them fit. No SQL rollback is needed because nothing was applied.

Hypothetical failed later Staging application: an atomic error/timeout rolls the entire DDL transaction back; independently verify schema/migration ledger afterward under that gate. If a runner committed partial DDL or any linked data exists, stop and preserve evidence; do not replay blindly or drop financial rows. Before runtime adoption, an approved reverse migration could remove only verified-empty new child objects, guards, nullable link and newly introduced indexes/keys in dependency order. After any adoption, prefer a reviewed forward correction and disable new admissions while preserving recovery/ledger evidence. No destructive Production rollback automation is authored.

New RESTRICT references intentionally prevent routine deletion/reparenting of referenced financial subjects. There is no purge/cascade/retention scheduler. Customer retention/anonymization policy is a later Product Owner decision required **before canonical-writer cutover**; it is not a blocker to applying this prepared foundation migration.

## Validation and evidence

Offline contracts: `tests/unit/migrations/issue134-payment-attempt-foundation.test.ts`. They cover required fingerprint/key, currency without default, nullable unique ledger link, immutable identifiers, no amount dedupe, same-Business FKs, state separation, bounded events/obligations, RLS/grants/fixed invoker path, no data/backfill/apply commands and prepared scope preservation. The scope assertion intentionally locks this prepared candidate to the authorized baseline and must be explicitly retired/re-scoped when later runtime work is authorized.

Executed validation:

| Check | Result |
| --- | --- |
| New foundation static contracts | **18/18 PASS** (included in the 7-file run below), including deny-all inherited `PG*` child-environment sanitization, poison self-test coverage, endpoint-override strings, timeout SET/assert/RESET, SET LOCAL rejection and G3 design wording. |
| New + existing migration/DB-source contracts | **7 files / 73 tests PASS**, zero failures/skips. Includes all migration contracts and booking RLS/public-RPC/financial-integrity contracts. |
| Existing payment/booking regressions | **5 files / 89 tests PASS**, zero failures/skips: Phase A payment safety, appointment payment outcome, Booking Sheet submit guard, payment/receipt retry, commerce recorded-outcome. |
| Typecheck | `npm run typecheck -- --incremental false` **PASS**. |
| Changed JS/TS lint | `npx --no-install eslint tests/unit/migrations/issue134-payment-attempt-foundation.test.ts scripts/verify-issue134-disposable-postgres.mjs` **PASS**, zero diagnostics. |
| Diff/scope | `git diff --check` **PASS**; exactly nine allowed candidate files; runtime/config/old migrations/Environment Manifest unchanged. |
| Disposable PostgreSQL execution | **PASS** on fresh local Homebrew PostgreSQL **17.11**, URL shape `postgresql://127.0.0.1:<ephemeral-port>/issue134` with credentials redacted. Before PostgreSQL execution, the poisoned-parent self-test proved all inherited `PG*` connection/config inputs stripped while `PATH` and a non-`PG` sentinel were preserved. Exact migration applied cleanly in one session; immediate 5s/30s assertion passed; both settings matched fixture-captured pre-migration defaults after final RESET; no timeout warning; **20/20 grouped object/behavior/host/concurrency proofs PASS**. All four supplied query/fragment endpoint overrides were refused before PostgreSQL execution. Two concurrent linked inserts for one attempt produced exactly one winner. Cluster stopped and removed after proof. |
| Build/full application suite/browser/live workflow | **NOT RUN**: zero application changes; focused offline regressions/typecheck used. No runtime acceptance claimed. |

The Node test runner emitted its existing experimental localStorage warning. All listed checks exited successfully. `scripts/verify-commerce-engine.mjs` was deliberately NOT RUN. The local disposable execution proof is not a Chasum environment application and confers no Staging/Production/runtime acceptance.

Weak-dedupe preservation: `lib/actions/appointments.ts` remains byte-identical to main (SHA-256 `30b4de20b6a4b95706e971dabcfaa71965c087d5a1d8ffbceea8159a1d82d6ca`). Its exact 435-byte lookup/session-key block retains SHA-256 `7ef95c88162e09eff801a036e60013e43521bd2a1ed596dfda5b579ec243396e`. Booking Sheet and current Phase A runtime files are unchanged. Environment Manifest remains byte-identical (SHA-256 `b80a46f96ec07ce185bdf08dc08e12fac8f01f5e6b875521c060a5b7dd11ff7f`).

Negative live-environment evidence: no Supabase connector/CLI, remote `DATABASE_URL`, Staging, Production, GVM, provider, deployment or merge operation was used during correction and validation. The only SQL connection was `ISSUE134_DATABASE_URL` to a freshly initialized temporary cluster bound to `127.0.0.1`; the verifier mechanically rejects every hostname except `localhost`, `127.0.0.1` and `::1`, rejects every query string or fragment, and supplies every `psql` child a deny-all inherited-`PG*` environment with no `PG*` exceptions. The exact migration and synthetic fixture/contract ran there only, and the cluster was stopped and removed afterward. No current deployed migration-ledger claim is manufactured; migration remains **PREPARED ONLY / NOT APPLIED** to any Chasum environment. Environment Manifest is deliberately unchanged.

## Review and next gate

Claude independent Level-3 audit is **COMPLETED** with supplied **Verdict B — required corrections before publication**. The prior alternate pass implemented approved R-1 through R-7 and recorded R-8 through R-10. The Grok pass corrected G1/G2 and documented/proved the intentional G3 boundary without redesigning the architecture; this final bounded pass adds H1 child-environment hardening and durable publication wording. Grok final re-challenge is not yet complete.

Remaining runtime gates: fingerprint test vectors and server admission/replay/conflict; booking-operation durability; atomic linked writer/outcome/obligation commits; provider idempotency/recovery; stored-value debit integrity; deterministic projection locking; receipts; #133 pre-admission/event/disclosure coverage; Reporting/Summer ledger reads; old-writer cutover and #153 permission closure; approved Staging RLS/concurrency/crash/fault tests. Test matrix must include changed fingerprint, parallel same key, key recovery after restart, lost provider/ledger response, binding races, every projection failure and incomplete evidence. The disposable-local foundation proof does not substitute for those hosted/runtime gates. No normal GVM workflow acceptance follows from this candidate.

Genuine Product Owner decisions remain: authorization to apply the audited exact migration to the selected environment; later runtime scope/activation; approved Staging fixtures/fault injection; retention/anonymization and invoice issuance if behavior changes; exact Production release and GVM Operational Acceptance. No new Product Owner product decision is needed to review this prepared candidate. No merge, migration application, runtime activation or Production release is claimed.

Recommendation: **READY FOR GROK 4.7 HIGH FINAL RE-CHALLENGE**; not ready or authorized for migration application, runtime activation or Production release.
