# Issue #134 — next connected booking/payment preparation

**Status: PLAN_ACCEPTED_FOR_PREPARATION — NOT IMPLEMENTATION-READY.**
**Source baseline:** `d749687969641638a575dd1d0d883b9fe86b1451`.
**Scope:** read-only source mapping and next-step design sequencing. No database read or write, code/test/migration change, activation, deployment, or accepted-proof rerun occurred in this task.

## Decision in plain English

The next launch-relevant work is a bounded **durable fresh-booking operation and canonical manual-deposit handoff** contract for Booking Sheet and Quick Appointment. Do not reapply the accepted attribution migration or restart its local proof. First decide exactly how a booking request is persisted/recovered and handed to the existing accepted payment-attempt engine. Implementation is not yet authorized.

The current application still calls the legacy writer: the prepared manual-payment function has no application callers and its production dependencies keep admission disabled. Appointment creation precedes the separate payment action; the current appointment-scoped description/amount dedupe cannot reliably recover the original appointment after a lost create response. These are source-confirmed integration gaps, not a failed accepted schema proof or a newly reproduced Production incident.

## Bounded contract to finish next — no Product Owner approval required to prepare

1. One stable booking-operation identity must recover the same appointment and intended payment after a timeout, refresh, partial commit or lost response. The design must settle identity generation, persistence, authorization and lookup; server-only generation is not yet a locked choice.
2. Define the immutable Business/customer/currency/amount/method tuple, one-time operation-to-appointment binding, explicit no-payment behavior, same-attempt replay, and a genuinely separate later equal-value payment. Preserve the weak current dedupe until the replacement is proven.
3. Define idempotent ledger-to-appointment/invoice/receipt/CRM synchronization, authoritative operator outcomes and safe recovery. A committed payment must never be represented as absent merely because a downstream step failed. Raw kernel RECORDED establishes the financial effect; full synchronization is a separate fact, not a relabeling of ledger truth.
4. Reuse #133's accepted attempt/event truth to explain what was requested, what persisted, what failed and what communication is authorized. Do not create a competing financial audit state. Define Summer's read-only explanation contract over the same records.
5. Map #153 least-privilege and legacy NULL/NULL durability dependencies to the actual replacement writers. Do not revoke grants before their callers are replaced and tested. Separate targeted SEQ-ACL-1 from broad FORCE-RLS/default-ACL redesign. No permissions change occurs in this preparation.
6. Prepare the fault matrix, synthetic data and communication-containment plan, exact proposed file/object allowlist and independent design review. Exclude the existing 90-row/CAD181 cohort and its pending obligations from new test processing.

## Control Tower reconciliation of the independent review

Claude's verdict is **PLAN_ACCEPTED_FOR_PREPARATION**, not an implementation approval. The returned review is preserved below. Its three concrete corrections are adopted for the forthcoming design:

- Before implementation of any material booking/payment operator-flow change, complete the Competitive Product Gate. This read-only source/dependency map did not create a new UX or claim competitive readiness. Record a bounded parity floor, deliberate Chasum advantage and acceptance contract before assigning such implementation; do not expand this into a general competitor program.
- The engineer report's section 5 citation ending `20261004190345_issue_134_payment_attempt_foundation.sql` is a typo. The correct accepted source is `20261004190341_issue_134_payment_attempt_foundation.sql`. The original report remains preserved verbatim; no incorrect path is authoritative.
- Reuse the already-applied `booking_operation_id`, partial index, request immutability and one-time NULL-to-appointment binding primitives. Do not assume another attempts-table schema change is needed. Any genuinely new operation registry/RPC must be justified by the bounded design, not presumed.

Additional sequencing precision: items deferred from this **first slice** are not automatically safe to omit from launch or technician acceptance. Communications and every supported activated payment path still require their applicable reviewed proof. The sequence in the raw engineer report must not be read as permission to perform real GVM transactions before a controlled Production release: governed Staging acceptance precedes separate exact-candidate Production authorization/release, followed by controlled GVM operational verification and an explicit resumption decision. No existing hold is waived. The actual activated writer inventory, not simply five source labels, defines any later permission-cutover prerequisites.

## What remains undecided

The exact durable-operation mechanism and whether any new table is required; how loss of the first response is recovered; generation/rotation of operation and payment keys; exact source mapping for each booking surface; explicit no-payment transition; synchronous versus separately owned recoverable projection execution; document numbering/idempotency and communication eligibility; exact #133 reader/transport fields; and the independently reviewed implementation allowlist. These are design deliverables, not blockers requiring Darshan to choose technical details now.

## Next genuine Product Owner gate

After the bounded design and applicable competitive checkpoint are complete and independently reviewed, request approval for one exact **prepared-only implementation candidate and local proofs**. That approval must not silently include Staging application, hosted synthetic financial tests, writer/worker activation, permissions cutover, a PR merge, Production/GVM changes or technician resumption. Later consequential actions retain their own applicable gates.

**No approval is requested by this preparation-plan record.** This record is not the finished design contract. The accepted Staging application remains closed and must not be rerun.

## Preservation and delegation

Sol/Cursor continued the existing sole preparation channel; Claude independently reviewed the source-grounded sequencing plan. Both returned consolidated reports, with only local file/git reads. Codex was not retried under the previously established credit limitation; no competing implementation or Grok dispatch was necessary for this source/dependency map. The coordinator made only the documentation publication below. Production/GVM, historical six USD transactions, #135 release, retained C01/Run02 evidence and pending obligations remain unchanged. Source baseline references and dated database observations remain explicitly distinct.

## Source investigation report — preserved verbatim

```markdown
# #134 Next Connected Financial Step — Source-Grounded Plan

**Repository inspected:** `/Users/darshan/chasum-worktrees/issue-134-appointment-financial-attribution`  
**Exact HEAD:** `d749687969641638a575dd1d0d883b9fe86b1451`  
**Working tree:** only untracked `.supabase/`, left unread and untouched.  
**Executed:** file/git reads only. No SQL, database, network, tests, build, worker, provider, subagent, edit, commit, push, or PR operation. This plan has not received independent audit.

## 1. Accepted layer versus missing usable flow

The accepted Staging layer is schema/integrity only: foundation, R1a, and appointment attribution are applied; the latest migration is accepted under hosted version `20261007170242` and SHA-256 `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524` (`docs/reviews/issue-134-staging-attribution-application-result.md:5-45`). It protects the retained 90-row/CAD181 cohort and freezes durable appointment/customer attribution.

It does not create a wired payment workflow. `recordPreparedManualPaymentAttempt()` exists, but production dependencies keep new admission disabled (`lib/commerce/payment-attempts/kernel.ts:274-356`), and no application caller uses it. Current payment surfaces still call the legacy `recordCommercePayment()` writer, which directly inserts `commerce_transactions` without `payment_attempt_id` (`lib/commerce/payments.ts:225-470`). Therefore schema presence cannot establish booking, deposit, projection, or operator acceptance.

## 2. #153 and SEQ-ACL-1

The immediate launch-relevant #153 invariant is precise: no active post-cutover writer may continue creating mutable legacy transactions with both `payment_attempt_id` and `appointment_id` NULL. Those rows remain outside the new appointment relation and can still be updated/deleted or disappear through customer/Business cascades (`supabase/migrations/028_commerce_platform.sql:172-177`; `docs/reviews/issue-134-next-runtime-contract.md:41-48`).

Permissions must not be revoked while current writers depend on them. Replacement writers and recovery must land first; only then may a coordinated cutover remove legacy UPDATE/DELETE capabilities.

SEQ-ACL-1 is separate least-privilege work: the identity sequence inherited anon/authenticated `USAGE + SELECT`, but not UPDATE; new tables remain inaccessible (`docs/handoffs/LATEST_HANDOFF.md:55-63`). This does not prove an API exploit and is not the same as the launch invariant. FORCE-RLS, owner-policy, and default-ACL hardening are broader follow-ups, not prerequisites to invent into this candidate. Existing RLS remains enabled but not forced. Older SECURITY DEFINER wording is not authoritative; accepted R1a remains service-role `SECURITY INVOKER` with restricted EXECUTE (`supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql:231-258,534-545`).

## 3. Bounded write-entry map

Source-confirmed current paths are:

- **Booking Sheet and Quick Appointment:** both submit `createAppointment()`. The appointment commits first, then optional payment executes separately (`lib/actions/appointments.ts:346-478,529-650`). Their client keys are ephemeral strings such as `bs-*` and `qb-*`, not canonical UUIDs (`components/booking-sheet/booking-sheet.tsx:351-361,991-1025`; `components/reception/quick-appointment.tsx:202-210,1131-1146`).
- **Existing-appointment collection:** Payments Dashboard accepts an optional appointment ID and calls `recordPaymentAction()` (`components/commerce/payments-dashboard.tsx:90-100,210-270`; `lib/actions/commerce.ts:61-126`).
- **Customer-only payment:** Customer Billing calls the same action with customer identity and no appointment (`components/commerce/customer-commerce-panel.tsx:20-120`). CRM delegates to it (`lib/actions/crm.ts:370-377`).
- **Gift card/store credit:** `recordCommercePayment()` directly adjusts balances after ledger insertion (`lib/commerce/payments.ts:280-337,474-505`); gift-certificate redemption also calls that legacy writer (`lib/actions/business-management.ts:530-587`).
- **Refunds:** create refund and ledger rows, then update appointment, invoice, and CRM projections (`lib/commerce/refunds.ts:18-299`).
- **Stripe finalization/webhook dependency:** changes a pending transaction to succeeded and then performs downstream synchronization (`lib/commerce/payments.ts:600-729`).

The five canonical source names are defined (`lib/commerce/payment-attempts/types.ts:3-9`), but the current actions do not supply them to R1a. Exact mapping of every UI occurrence to those source values remains design work.

## 4. Fresh-booking identity is not solved

R1a correctly supports same-key recovery for an existing customer/appointment and distinguishes a deliberate second equal-value payment by a new attempt UUID (`lib/commerce/payment-attempts/kernel.ts:45-229`). The database foundation also anticipated `booking_operation_id` and allows exactly one later NULL→appointment binding (`supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql:24-60,170-193`).

But R1a normalization currently rejects `booking_operation`; it accepts only existing customer or appointment targets (`lib/commerce/payment-attempts/normalize.ts:113-157`). No durable booking-operation registry or appointment idempotency binding exists. Current dedupe searches only the newly created appointment’s transactions for equal amount plus a description marker (`lib/actions/appointments.ts:478-503`). It cannot recover the appointment after a lost create response, and the Quick Appointment “book another” flow resets the UI while retaining the same ref value (`components/reception/quick-appointment.tsx:438-452`).

Therefore new-booking identity needs a dedicated bounded design. Preserve the weak dedupe until its replacement is proven; do not remove it early.

## 5. Projection and operator contract

Canonical completion must proceed:

`ledger → appointment cache → invoice settlement → receipt → CRM payment event → communications`

R1a currently creates four durable obligations—appointment cache, invoice settlement, customer payment events, and receipt—and reports synchronization `PENDING` (`supabase/migrations/20261004190345_issue_134_payment_attempt_foundation.sql:144-170`; `supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql:353-427`).

Operator outcomes must be derived from attempt, ledger, events, and obligations:

- **NOT RECORDED:** durable evidence proves no ledger and a safe terminal/non-admitted outcome.
- **RECORDED:** exactly one matching ledger and every required projection is COMPLETE or explicitly NOT_REQUIRED.
- **RECORDED BUT NOT FULLY SYNCHRONIZED:** ledger exists, but one or more required projections are PENDING/FAILED.
- **UNKNOWN:** transport, identity, or evidence consistency is unresolved; hold and recover the same attempt—never recollect.

Current invoice, receipt, CRM, and communication code remains a dependency, not canonical completion proof (`lib/commerce/invoices.ts:52-280`; `lib/commerce/receipts.ts:245-330,386-585`). Communications must stay off during initial canonical workflow proof; worker reliability is exact opt-in only (`lib/communications/reliability-config.ts:1-13`). Existing records and 15 PENDING obligations must not be replayed as tests.

## 6. #133 and Summer

#133 must project the existing canonical truth: requested source/mode/amount/method/actor, attempt identity, resulting ledger identity, outcome/reason, projection state, and timestamps. Those fields already belong across attempts and append-only events (`supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql:24-59,106-140`). Do not create a parallel log that can disagree.

Minimum evidence is one coherent chain from REQUESTED through ACCEPTED or a named non-recorded/unknown result, followed by obligation transitions. Summer currently reads aggregate appointment/invoice/transaction sources and intentionally reports unknown on unavailable or disagreeing data (`lib/commerce/customer-account.ts:30-138`; `lib/summer/orchestrator.ts:208-239`). It is not ready to explain canonical attempt/projection status until that reader consumes #133 truth.

## 7. Smallest next candidate

**BUILD NOW:** no runtime or schema change under this authorization.

**DESIGN NOW, BUILD LATER — recommended:** one bounded “durable fresh-booking operation and canonical manual-deposit handoff” contract for Booking Sheet and Quick Appointment only. It must define:

1. server-generated canonical operation/attempt UUID ownership;
2. idempotent appointment creation/recovery after partial commit or lost response;
3. immutable Business/customer/payment tuple and one-time operation→appointment binding;
4. explicit no-payment outcome;
5. same-attempt recovery versus deliberate new equal-value payment;
6. synchronous or separately owned idempotent projection behavior and the four operator outcomes;
7. communications disabled and retained cohort default-excluded.

Likely touched categories are a new additive booking-operation schema/RPC package, `lib/actions/appointments.ts`, both booking UIs, and `lib/commerce/payment-attempts/{types,normalize,kernel}.ts`, plus focused contract/fault tests. Exact objects and allowlist require the design review; they are not ready to invent here.

**DEFER:** broad five-source cutover, #153 revocation, SEQ/default-ACL hardening, Stripe/webhook replacement, gift-card/store-credit canonicalization, refunds, worker activation, communications, Production, and historical reconstruction.

## 8. Gate sequence

The team can prepare the exact design, source map, outcome table, fault matrix, proposed allowlist, and synthetic verification plan now without Darshan acting.

Then: independent design review → explicit PO approval for one exact prepared-only implementation package → offline/unit and disposable-local database proof → independent implementation review → separate PO-approved Staging application/deployment and fresh synthetic workflow test with communications off → operator validation of all four states → replacement of all five writers → #153/SEQ-ACL-1 cutover review and approval → separately governed real-customer/technician acceptance → Production release gate.

The next genuine PO approval should authorize only the exact fresh-booking operation implementation allowlist and local proof. It must not authorize activation, hosted payment, permission revocation, technician resumption, Production, or GVM operation.
```

## Independent review — preserved verbatim

Reading the plan and confirming the stated baseline.Baseline confirmed at `d749687`. Reading the plan.Verifying the plan's source citations — these determine whether "source facts" are genuinely distinct from proposals.Confirmed one citation typo and that the five canonical source names and the `booking_operation` rejection are accurate. Checking the remaining load-bearing claims.Checking whether the foundation already provides `booking_operation_id`, which affects how much new schema the candidate really needs.```
INDEPENDENT NEXT-STEP SEQUENCING REVIEW — #134 connected financial step
Reviewed: /private/tmp/chasum-134-next-connected-plan-zxf4s1of/sol-report.md
Baseline verified locally: HEAD d749687969641638a575dd1d0d883b9fe86b1451 (d749687 "docs: record
accepted #134 Staging attribution application"); working tree clean except untracked .supabase/,
which I did not read. READ ONLY file/git inspection only — no SQL, database, tests, build, network,
provider, credential, hosted, Production/GVM access, no writes, and no agent dispatch. Accepted
local proof, C01, foundation and R1a reviews remain CLOSED and were not re-audited. Native counts
cited in the plan are dated source-recorded observations, not fresh reviewer queries.

VERDICT: PLAN_ACCEPTED_FOR_PREPARATION

The plan is sound as a dependency/design plan and reaches the correct central conclusion. It is not
implementation-ready and does not claim to be; declaring otherwise would be false. No new Product
Owner gate is needed for the read-only design work it proposes.

IS THE SMALLEST CANDIDATE READY, OR DOES NEW-BOOKING INTENT NEED DESIGN FIRST?
Design first — the plan is right, and the source confirms it. `recordPreparedManualPaymentAttempt`
appears exactly once in the repository, its own definition at `lib/commerce/payment-attempts/kernel.ts:353`,
so it has zero application callers. Production dependencies set `admissionEnabled: false` with an
explicit prohibition comment, so R1a is genuinely inert. `lib/commerce/payments.ts` contains zero
occurrences of `payment_attempt_id`, confirming the legacy writer still inserts unlinked ledger rows.
`normalize.ts` admits `booking_operation` in its shape guard (line 27) but the R1a normalizer rejects
it (lines 118-119, "must be an existing customer or appointment") — the plan's nuance is accurate.
Current dedupe is `listTransactions` scoped to the newly created appointment matching succeeded +
equal `amountCents` + `description.includes(key)`, and client keys are ephemeral `qb-`/`bs-` strings
(lines 209 / 360), not canonical UUIDs. That cannot recover a lost create response. Correctly, the
plan says preserve the weak dedupe until its replacement is proven.

SEQUENCING, SEPARATION AND ACCOUNTING — ALL SATISFIED
#153 cutover is correctly sequenced after replacement writers ("Permissions must not be revoked while
current writers depend on them"), and §8 places revocation after all five writers are replaced. The
NULL/NULL durability invariant is properly grounded: `028_commerce_platform.sql` shows `business_id`
and `customer_id` with ON DELETE CASCADE and `appointment_id` ON DELETE SET NULL, so unlinked rows can
indeed be mutated or vanish. SEQ-ACL-1 is kept distinct as least-privilege work, is explicitly not
claimed as a proven API exploit, and FORCE-RLS/owner-policy/default-ACL hardening are explicitly
excluded as broader follow-ups rather than invented prerequisites — exactly the separation required.
Same-attempt replay versus a deliberate second equal-value payment is accounted for (§4, §7.5);
post-commit partial success has a named state (RECORDED BUT NOT FULLY SYNCHRONIZED); UNKNOWN instructs
hold-and-recover the same attempt and never recollect, so there are no false duplicate-retry
instructions. Projections, the four obligation kinds, communications-off (verified: exact `=== "true"`
opt-in in `lib/communications/reliability-config.ts`) and retained-cohort/15-PENDING exclusion are all
handled. #133 correctly projects existing attempt/event truth with "do not create a parallel log that
can disagree," and Summer is correctly described as not ready until its reader consumes that truth.
I found no conflict with locked product or tenant decisions; the candidate is generic, not
tenant-specific.

CONCRETE CORRECTIONS (three)
C1 — Competitive Product Gate is missing from the §8 sequence. A fresh-booking deposit flow with
operator outcome states is a material customer/operator feature, so the gate applies and Control Tower
must record the parity floor, deliberate Chasum advantage, switching reason, product/UX contract and
pass condition BEFORE bounded implementation is assigned. Insert it ahead of the PO implementation
approval, not after. A reasoned NOT_APPLICABLE is not available for new booking/payment workflow.
C2 — §5 cites `supabase/migrations/20261004190345_issue_134_payment_attempt_foundation.sql:144-170`.
No such file exists; the real file is `20261004190341`. §4 cites it correctly, so this is a typo, but
it must be fixed because the plan's authority rests on exact citations.
C3 — §7 overstates new schema need. The foundation already provides `booking_operation_id uuid`
(line 35), a partial index on `(business_id, booking_operation_id) where not null` (line 94), request
immutability covering `booking_operation_id` (lines 181-185), the one-time NULL→appointment binding
gated on `booking_operation_id is not null` (line 190), and ledger-link anticipation of unbound
operations (line 228) — all applied and accepted in Staging. The design must state which primitives
already exist versus what is genuinely new (likely only a durable operation registry, normalizer/kernel
acceptance of the `booking_operation` target, and the RPC), so the candidate is not sized larger than
reality and possibly needs no attempts-table schema change at all.

REMAINING UNKNOWNS (to resolve in design, not now)
Exact mapping of every UI occurrence to the five canonical source names (`types.ts:3-9`, confirmed:
booking_sheet, quick_appointment, collect_payment, customer_billing, payments_dashboard); whether any
new table is required beyond reusing `booking_operation_id`; whether projections are synchronous or
separately owned and idempotent — the plan leaves this as either/or and it must be decided; the #133
field and transport contract plus Summer's reader cutover point; and SEQ-ACL-1 exploitability, which
remains unproven and rests on a dated observation.

PRECISE IMMEDIATE ACTION
Proceed with read-only preparation only, with no new PO approval: have Control Tower produce the
Competitive Product Gate record (C1) and author the bounded "durable fresh-booking operation and
canonical manual-deposit handoff" design covering the seven §7 clauses, with the source map, operator
outcome table, fault matrix, proposed file allowlist, and synthetic verification plan, applying C2 and
C3. Then independent design review. Seek the next PO authorization only when that design is complete
and an actual implementation gate requires it, scoped to the exact allowlist plus disposable-local
proof — never activation, hosted payment, permission revocation, technician resumption, Production
or GVM. No work beyond preparing that gate is authorized.
```

Verdict: **PLAN_ACCEPTED_FOR_PREPARATION**. The plan's core judgment is correct and the source backs it — new-booking durable intent genuinely needs a bounded design before any implementation, so it is not implementation-ready and doesn't pretend to be.

The claims I spot-checked held up. `recordPreparedManualPaymentAttempt` has exactly one occurrence in the repo (its own definition), confirming zero callers; `admissionEnabled: false` makes R1a genuinely inert; `payments.ts` has no `payment_attempt_id` at all; and the `booking_operation` nuance is precise — the shape guard admits it while the R1a normalizer rejects it. The `028_commerce_platform.sql` cascade claim is real, which is what makes the #153 durability concern legitimate rather than theoretical.

Three concrete corrections, one of which matters most: the gate sequence omits the **Competitive Product Gate**. A fresh-booking deposit flow with operator outcome states is squarely a material customer/operator feature, so the parity floor and Chasum advantage must be recorded before implementation is assigned, not after. The other two are a citation typo (`20261004190345` doesn't exist; it's `20261004190341`) and an oversizing issue — the foundation already ships `booking_operation_id`, its partial index, request immutability, and the one-time NULL→appointment binding, so the candidate may need no attempts-table schema change at all.

I did not re-audit the closed proofs, and no approval is needed for the read-only design work recommended next.
