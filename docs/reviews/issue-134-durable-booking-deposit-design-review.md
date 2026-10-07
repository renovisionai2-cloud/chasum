# Issue #134 — durable booking/deposit prepared-only implementation gate

**Status: READY_FOR_PO_IMPLEMENTATION_GATE — NO IMPLEMENTATION AUTHORIZED.**

## Exact contract and review identity

- [Final contract](issue-134-durable-booking-deposit-contract.md): SHA-256 `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d`, 782 lines.
- [Competitive Product Gate](issue-134-booking-deposit-competitive-gate.md): SHA-256 `bd0d2e2a7fa42f6d122e02618e8959968d37f54c5b3f57232e769d47101d2ad5`.
- Authoring source baseline: `0b3f071511e14a7c77541e80f039862fc71f924a`; observed main: `31115e6a51b71fc097c279d205065d80e0be3573`.
- [Claude final exact-contract review](evidence/issue-134-durable-booking-design/claude-final-contract.md): SHA-256 `7bb4e1faf32abce7f6e38f9586d300409ef443f2f8fc6968693f0ea13f307ed6`; verdict **READY_FOR_PO_IMPLEMENTATION_GATE**, no required correction remains.
- [Grok corrected-core challenge](evidence/issue-134-durable-booking-design/grok-corrected-core.md): SHA-256 `c69b6d6182c6c7d7f5eb484d71a5647be4b676542a8a56cc27fbc10f9574b8f2`; verdict **CHALLENGE_PASS** on core contract `6fc97806d1e409fdfba18976568f5a573e8e62366b0621ae0a6687553d90cbae`.
- [Exact reviewed core](evidence/issue-134-durable-booking-design/reviewed-core-contract.md) is preserved at that hash. It is a superseded proposal, not current implementation authority. Claude reviewed the final +35-line private-reader/guard/policy clarification delta at the final contract hash above. Do not describe Grok's earlier hash as an exact-byte review of the final file.

The final design's authoring-time independent-review-pending wording is superseded by this external exact-byte review only. Do not edit reviewed contract bytes to restamp status. No migration file or runtime candidate has been authored by this task.

## Proposed first implementation slice

The concrete gap is durable fresh-booking recovery. The current app creates an appointment and then calls the legacy payment writer; the accepted R1a remains unwired. Its existing commit RPC rejects a non-NULL `booking_operation_id`, so merely enabling it would not implement this design. The proposal reuses the accepted attempt/event/ledger/obligation primitives and adds a narrow booking-operation path without replacing the accepted RPCs or editing applied SQL.

Contract section 13 is the exact proposed **16-path allowlist: 11 new and five existing**. Section 7 names **23 schema deltas: one registry table, one appointment column, eight constraints, three indexes, eight functions and two triggers**. The NEW migration must receive a CLI-generated timestamp only after authoring approval; no invented filename is an approved migration.

The prepared kernel would provide stable request identities, atomic inline-customer/attempt admission, an operation-tagged original appointment INSERT, same-operation recovery, safe attempt binding, explicit no-payment outcome, fenced closure and specialized manual payment commit. The first slice includes private canonical exact/history readers with one-snapshot checks and authorization; public #133/Summer reporting remains a later adapter over this same truth.

The candidate stays **unwired/default-off**. Neither Booking Sheet, Quick Appointment nor `createAppointment()` is wired or redesigned in this first implementation; current no-operation callers and their weak dedupe remain unchanged. New money would create four PENDING obligations in isolated local proofs, not perform invoice/receipt/CRM/cache projections or send communications. PENDING is never completed synchronization.

## Material design corrections resolved before this gate

The initial proposal was not accepted as ready. Grok's concrete counterexamples and coordinator reconciliation exposed circular inline-customer fingerprinting, an untagged/incorrect-role appointment insert/fallback risk, contradictory lock order, an unfenced pricing/slot replacement path, and an ambiguous saved-appointment/unrecorded-payment outcome. The corrected contract resolves them with stable preallocated identity, operation-first replay, original non-NULL operation-tagged service persistence after the existing validator, exact zero-value handling, consistent advisory/row ordering, terminal booking closure and **PAYMENT_RECOVERY_REQUIRED**. None of these findings was a new observed Production incident or a failure of an accepted proof.

Claude required retention/index disclosure and an explicit first-slice private reader. Those were resolved. The final delta also makes legacy NULL-operation paths return before new privileged guard checks and preserves repeated authorized no-ledger customer correction after CLOSED without reviving an old payment. All appointment-linked ledger history, including later separate payments, blocks customer reassignment. CLOSED controls booking eligibility only; ledger/attempt/obligation records remain financial truth.

A deterministic conflict or a temporarily absent snapshot never authorizes a fresh key while the original request may still commit. Replacement requires a verified committed close with zero appointment and zero ledger. A completed no-payment booking remains recoverable after a lost response; history is not limited to unresolved attempts. Raw RECORDED money and downstream synchronization are separate facts.

## Disclosed product and retention consequences

The approved principle that customer correction remains possible before durable ledger history is preserved, including repeated correction. For future operation-linked appointments it uses an atomic close/correction route rather than an unchecked direct update; that route and friendly operator handling must be connected before activation.

Admitted operation/attempt history is retained even for no-payment or failed bookings. Existing attempt FKs already restrict customer/Business deletion; the proposed registry adds its own reference. An unwired migration with zero registry rows introduces no new populated-registry deletion failure by itself. After future activation, destructive customer/Business deletion can be blocked by retained request history even when no money was collected. The activation gate must supply the specified friendly retained-history message, never erase or cascade away evidence. No retention expiry or historical cleanup is silently authorized.

The accepted nonunique attempt booking-operation index stays in place alongside the new unique index; temporary overlap is deliberate, with any later removal separately governed. Existing named/unassigned staff and room/availability checks are preserved, not claimed newly serialized for different independent bookings. Global CRM quick-create dedupe and cross-actor takeover are not solved by this slice.

## Competitive and operational contract

The Program Lead completed bounded current official-documentation checks for Fresha, Vagaro and Jane, with Stripe idempotency guidance as an engineering reference. This is a proposed parity/acceptance checkpoint, not a hands-on competitor audit or claim competitors lack recovery. The target is a coherent booking/deposit flow with authoritative amount/currency/method, durable same-request recovery and clear money-versus-sync status; the contract prohibits unrelated navigation, calendar or branding redesign.

Future operator acceptance covers desktop/laptop/tablet/mobile and no-payment, deposit, full/custom, same-request replay/conflict, legitimate later equal payment, lost response at each commit, changed pricing/customer, revoked authority and downstream failure/recovery. The CAD100 example explicitly has final payable CAD100 with zero-tax fixture and CAD50 deposit. No such new functional/UX test ran here.

## Delegation and verification actually performed

Sol/Cursor was the sole author, session `05e3058c-3323-448d-b337-0bc23f3f505f` (reported GPT-5.6 Sol 272K High). Grok was the independent financial/idempotency challenger, session `faa637d7-f975-4d5d-af7c-ab1c751edaa2` (reported Grok 4.7 256K High). Claude was independent final reviewer, session `3d8a2773-53b0-4dcf-bd9a-9a486582d09d` (reported Claude Opus 5 300K High No Thinking). Codex's previously established credit limit was not retried. Reviewer roles stayed separate; no agent created a competing implementation.

Actually performed: repository/file/hash reads, bounded public documentation research, contract authoring and independent source/design reviews, followed by documentation publication. Final source, contract and report hashes were recomputed. Proposed signatures, lifecycle/lock mechanisms and RPC behavior are **NOT RUN**. No tests/build/typecheck/verifier/SQL/database call, migration generation/application, credential access, hosted financial test or accepted-proof rerun occurred. No secret or `.supabase/` content was read or committed.

Claude's non-blocking N1 calls `index.ts` 'existing' in the prose meaning already included in the proposed allowlist; section 13 correctly classifies that path as NEW. The exact 16-path inventory governs. Do not churn the reviewed hash for this label nit. Any excerpt claiming 'no code exists' means no NEW slice code was authored, not absence of the pre-existing application.

## Exact next Product Owner decision

Recommend authorizing one **prepared-only implementation** on a new governed dependent branch/PR from the freshly reconciled published continuation, bounded to contract sections 7/13 and local proof obligations in section 14. Include only one NEW unapplied migration, the 16-path code/test/report allowlist, new-object security posture and focused/scoped quality gates. Source-independent local database proof must follow reviewed new test source and the existing human-owned execution boundary; never bypass the denied agent-sandbox bootstrap. No Terminal command is required to approve this design.

The later implementation must prove the new contract rather than repeat closed local/C01/attribution proofs merely for confidence. Normal quality gates are not waived. Missing functional evidence is NOT RUN, not a pass. Return the independently audited exact implementation candidate before a separate hosted application/validation gate.

## Permanent holds and finite continuation

Accepted Staging attribution application remains closed at hosted `20261007170242`, source SHA `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524`. Accepted local and C01/Run02 evidence remain unchanged. No shared retained 90-row/CAD181 cohort or its pending obligations may be processed as a new test.

No UI/current-action wiring, public #133/Summer reporting, projection implementation, communication/provider activity, flags, existing permission changes, #153 cutover, PR merge, #135 Production release, historical USD repair, Production/GVM action or technician resumption follows from this gate. The actual active writer inventory must be ready before permission removal; five source labels are not a complete call graph.

After this prepared/local slice: separately reviewed projections and reporting, operator wiring and connected Staging fault/recovery/communication proof, actual-writer/#153 readiness, an exact-candidate controlled Production authorization/release, then controlled GVM operational verification and explicit resumption. **GVM Operational Acceptance is not earned.** The final connected booking→attempt→ledger→appointment→invoice→receipt→communications contract remains required.
