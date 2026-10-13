# #134 / #133 Slice 2B Phase 0 — durable appointment lifecycle readiness addendum

**Status: PROPOSED DESIGN — READY FOR INDEPENDENT LEVEL-3 DESIGN AUDIT.**
**Date:** 2026-10-12, America/Toronto. **Author:** Codex, primary implementer, documentation only.
**Authority:** Darshan's October 12 Phase 0 authorization selects **Option B — full operator lifecycle preservation**. That product direction is approved; this technical proposal is not yet independently accepted or authorized for implementation.
**Reviewer:** Claude Opus 5 High, to be manually dispatched by Darshan. No reviewer has been dispatched by this task.

## 1. Baseline, authority and precise supersession

Fresh GitHub verification before authoring:

| Identity | Verified value |
| --- | --- |
| Main | `ee270de960e6956f9e87c980bac670f574ff21fc` |
| Main tree | `82828c8786a5f4ec6b4ff0816256a10b0f78d645` |
| PR #159 | MERGED; financial integration squash `0bebe243e8fea17937171d74fd024c42ef9fe431` |
| PR #160 | MERGED; documentation closeout squash `ee270de960e6956f9e87c980bac670f574ff21fc` |
| #133 / #134 / #158 / #153 / #132 / #135 | OPEN; issue bodies are scope/history, not fresh execution authority |
| Production | Last accepted/observed baseline `664fbc734c4103d78484c6b3828849a6605a562f`; **not re-probed in this phase** |

Read [AGENTS](../../AGENTS.md), [Bible](../company/CHASUM_BIBLE.md), [current board](../CURRENT_PROJECT_STATE.md), [handoff](../handoffs/LATEST_HANDOFF.md), [environment record](../runtime/ENVIRONMENT_MANIFEST.md), [locked decision log](../product/14_DECISION_LOG.md), the two accepted contracts and the implementation/attribution/C03/I1/Slice 2A acceptance records linked below. No hosted database, browser, financial proof or retained fixture was accessed.

This addendum is the single proposed lifecycle correction. **On independent acceptance and Program Lead reconciliation**, it supersedes only:

- [Durable booking contract](issue-134-durable-booking-deposit-contract.md) §§7–8/13: the assumption that the existing appointment guard plus close path is sufficient for ordinary operational maintenance; creator-only recovery is not a requirement that every operational editor be the original creator.
- [Slice 2 design](issue-133-slice2-canonical-financial-wiring-design.md) §§6.4/11/12: recovery must read the existing operation before fresh-create validation, and full Option B cutover requires a separately gated lifecycle SQL amendment. The old **no-new-migration** application allowlist is not permission to implement this amendment there.

It does **not** supersede accepted identity, money, attribution, concurrency, projection, refund-witness, privacy, admission, communications-off, retained-evidence or release decisions. Neither accepted contract is edited. A proposed design is not applied SQL, runtime acceptance, a permission cutover or Production approval.

## 2. Exact source contradiction and accepted architecture

Source references below are repository-relative and pinned to the main SHA above; line numbers are navigation aids at that SHA.

| Source | Fact / implication |
| --- | --- |
| `supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql:334–485`, `guard_appointment_booking_operation_link_v1` | Linked guarded writes require literal `service_role`; Business/operation identity cannot change. Status may change only to canonical cancellation. Location/service/staff/time/notes/room/price/tax/deposit changes raise `BOOKING_OPERATION_ADMITTED_APPOINTMENT_IMMUTABLE` **regardless of payment state**. |
| Same migration, `appointments_booking_operation_guard` near line 2620 | Guarded columns include ordinary lifecycle fields. `appointment_resources` child changes need their own review; a parent-only guard does not itself protect a child relation. |
| `lib/actions/appointments.ts`: `updateAppointment`, `setAppointmentStatus`, `rescheduleAppointment`, `resizeAppointment`, `cancelAppointment`; corresponding `lib/booking-engine/mutations/{update,cancel,reschedule,resize}.ts` | Existing actions use session/RLS updates; they cannot perform linked operational edits under this guard. Merely switching their client to service role still leaves field prohibitions. |
| `lib/booking-engine/mutations/update.ts:18–20,145–183` | Cancelled is terminal; cancelled appointments may update notes only. Preserve this actual rule. |
| `lib/types/booking.ts:1–40`; migrations `001_booking_engine.sql:71`, `002_booking_enhancements.sql`, `031_commerce_finalize_and_arrival_workflow.sql:99–101` | Current application states are `pending`, `confirmed`, `arrived`, `waiting`, `in_progress`, `completed`, `cancelled`, `no_show`. Historical enum also contains `scheduled`. **Check in means `arrived`; `checked_in` is an event name, not a new appointment status.** No enum change is proposed. |
| `lib/commerce/booking-operations/kernel.ts:158–207` | Authority resolves, but `validateAndPrice` currently precedes the first canonical read. A persisted appointment can therefore be mistaken for a new slot conflict/past booking after response loss. |
| Same migration, `close_booking_operation_v1` | Serializes/fences cancellation and no-ledger customer correction, preserves terminal attempt truth, but requires the original actor and does not supply ordinary maintenance. |
| `20261007012529_issue_134_appointment_financial_attribution.sql` | Composite ledger FK `(appointment_id,business_id,customer_id)` preserves customer attribution; legacy guard blocks ledger unlink/delete. Scheduling fields are not financial identity keys. |
| `20261008210359_issue_133_payment_projection_observability.sql`: `payment_appointment_truth_v1`, `project_payment_obligation_v1` | Collected money comes from ledger evidence; projection totals read current appointment price/tax/deposit. Uncontrolled amount edits would change projection truth or contradict existing invoices. |
| `lib/commerce/financial-aggregate/reader.ts` | Location-scoped money is explicitly `CURRENT_APPOINTMENT_LOCATION`, not a historical collection-Location claim. |

Accepted create/bootstrap/bind/commit proofs remain valid within their original scope. [Proof/application record](issue-134-durable-booking-deposit-implementation.md), [attribution design/result](issue-134-appointment-financial-attribution.md), [C03 audit](issue-133-connected-staging-c03-review.md), [I1 result](../validation/issue-133-slice2a-postgrest-i1/RESULT.md), and [Slice 2A result](../validation/issue-133-slice2a-staging/RESULT.md) are preserved. New lifecycle behavior needs a new delta proof; no historical proof/run is reopened or relabeled.

## 3. Approved product direction and bounded parity gate

**Original financial evidence is immutable. Authorized operational state may evolve.**

Full Option B is the intended launch contract: create/view, confirm, arrive/check in, wait/perform service, complete, no-show, cancel, reschedule/resize, reassign authorized staff/Location/resources, edit notes, and make financially safe service/customer corrections. A create-only or create/recover/cancel product is **not** accepted as a replacement for Option B. Default-off engineering milestones may be smaller; they do not earn operational acceptance.

Competitive Product Gate: new broad research is **NOT_APPLICABLE** to this bounded reconciliation of the PO-locked parity floor. Reuse the accepted #134 product checkpoint. Parity is normal service-business scheduling flexibility; Chasum's intended differentiator is durable booking/payment recovery with truthful money history while retaining that flexibility. Acceptance must demonstrate the complete operator journey on both entry surfaces, not just API success. No disputed competitive question needs new research here.

## 4. Immutable evidence versus evolving operational data

| Layer | Immutable / authoritative evidence | Allowed evolution |
| --- | --- | --- |
| Original operation | ID, Business, original actor/source/customer, request tuples/fingerprints, original Location/service/staff/time, tender/amount/currency and candidate identities | Existing lifecycle close metadata only through fenced close; never rewrite the original request to agree with an edit |
| Original payment attempt | Identity/key, admitted target/customer/amount/currency/method/provider and accepted terminal history | Existing legal REQUESTED→ACCEPTED/FAILED/SKIPPED transitions; terminal attempts never reopened; no reassignment to a different customer or operation |
| Collected money | `commerce_transactions`, protected identity/amount/tender facts and linked refund evidence | Only separately governed financial workflows; lifecycle writer never inserts/edits/deletes money, refunds, invoices, receipts or CRM money mirrors |
| Appointment | ID, Business, non-null operation link and retained financial attribution | Current status, scheduling/assignment, notes; conditional customer/service correction below; caches remain projection-owned |
| Commercial appointment basis | Price/tax/deposit used by existing projections | Frozen for ordinary lifecycle commands; amount-changing corrections require a separate financial-adjustment contract, even with zero recorded money |
| Operational audit | Command identity, initiating actor, exact Business/appointment/operation, revision, reason, bounded before/after facts, original money identities/state at decision time | Append only; original operation actor remains separate from later editor; no ledger repair masquerading as an operational correction |

Original booking Location remains in the operation. Current appointment Location may change. Historical transaction attribution remains exactly what was recorded: Business/customer/appointment plus any genuinely recorded evidence; do not manufacture a collection Location. Current operational reporting may move the appointment to its new Location and must retain the existing `CURRENT_APPOINTMENT_LOCATION` disclosure. Prior invoice/receipt facts stay unchanged. No retroactive historical Location backfill, revenue relocation claim or technician commission calculation is authorized.

A mutable operational service is not a rewrite of the purchased service in the original request/document. A same-commercial-basis correction must visibly preserve the agreed price/tax/deposit and audit the old/new service. A change requiring different tax treatment, amount, package allocation, deposit or currency is a financial adjustment, not this command. The invoice projector currently creates a generic “Appointment” line; do not claim it proves every future document is semantically compatible with a service correction.

## 5. Matrix vocabulary — binding for every row

Every row in §6 inherits all fourteen dimensions here; the row supplies the transition-specific values. This avoids twenty copies of the same security contract.

1. **Disposition:** ALLOW means through the conditional trusted writer, never a direct table permission. HOLD/BLOCK is a truthful refusal, not a silent reset.
2. **Actor O:** current authenticated Business owner or member with current `owner`/`admin` membership, consistent with accepted durable authority. An employee selected as appointment staff is not automatically an authorized editor. **Actor R:** original operation actor, still authorized as O, for create/recovery/bind/payment. **Actor F:** separately authorized financial workflow, not supplied by this phase. Other staff roles require their existing explicit capability to be proved or a separate grant decision; do not silently extend role semantics.
3. **Scope L:** server-resolved Business, exact linked appointment/operation/attempt, and authorized current Location; destination Location also required for any move. Business membership currently grants owner/admin Business-wide authority; the Location selector is UI context, not proof of a per-Location security grant. A restricted principal cannot expand scope by supplying IDs. Recheck tenant ownership/active assignment of every destination service/staff/room/resource/customer.
4. **Preconditions:** valid linked structure, explicit command, expected operational revision and current auth. For changing scheduling/assignment, authoritative availability excludes this appointment; validate only the changed operational context, not whether an unchanged historical booking could be created today.
5. **Immutable set I:** all original evidence in §4, Business/operation/appointment IDs, paid/refunded caches, all ledgers/documents and unmentioned fields.
6. **Mutable set:** exact allowlist in the row, in a single transaction; no arbitrary patch or raw column identifiers.
7. **Financial states:** preserve aggregate EXACT / HELD / UNKNOWN separately from operation `RECORDED`, `RECORDED_BUT_NOT_FULLY_SYNCHRONIZED`, `NOT_RECORDED`, `PAYMENT_RECOVERY_REQUIRED`, `UNKNOWN`. A coherent terminal zero-ledger result is not inferred from a failed/empty request. Scheduling success never means payment success.
8. **Writer W:** proposed lifecycle RPC family in §7; **C** is the existing create protocol with recovery-order correction; **X** is revised fenced close with old v1 compatibility. No alternate legacy fallback once linked.
9. **Locks K:** §8 operation advisory → original attempt → appointment → operation, followed only by bounded command-specific targets; compare revision after locks. No payment or projection call nested inside lifecycle mutation.
10. **Audit J:** one transactional, private command/effect record per accepted mutation key; APPLIED/NO_CHANGE replay does not create a second event. Bounded reason, actor, revision and before/after whitelist; no customer contact/payment secret payload. Rejected auth has no tenant data response. Nonfinancial rejection telemetry does not become a money event.
11. **Effects E:** lifecycle audit only; no email, receipt delivery, SMS, in-app notification, webhook, calendar, reminder, waitlist or provider work in the default-off milestone. Later communications activation is separately gated by #132 and stable command/event identity.
12. **Errors:** safe typed NOT_AUTHORIZED/STALE_REVISION/CONFLICT/FINANCIAL_REVIEW_REQUIRED/TERMINAL/UNKNOWN; no SQL/error/foreign-tenant detail. On uncertain transport, retain command/operation and reread, never imply rollback or invite recollection.
13. **Proof:** row test plus common security/replay/concurrency/privacy/zero-effects matrix in §12. These are future requirements, **NOT RUN**.
14. **PO decision:** Option B is locked. Rows marked “none” need technical audit and later implementation approval, not a new product choice. Financial-adjustment workflows and any capability expansion remain separately scoped, not silently implemented here.

## 6. Full lifecycle decision matrix (A–T)

| ID / transition | Disposition; actor / scope; prerequisites | Mutable fields; immutable / financial conditions | Writer / concurrency / audit / effects | Safe error, required proof and remaining decision |
| --- | --- | --- | --- | --- |
| A — Creation | CONDITIONAL; R/L; genuinely new identity, admission open under a separate gate, tenant-valid selection and fresh commercial/availability checks | Initial appointment per immutable admitted tuple; one operation/customer/appointment/attempt, at most one money effect; no-payment is explicit SKIPPED | C; existing bootstrap identity locks then operation locks; existing financial events; E containment at create seam | INVALID/MATCH_REQUIRES_SELECTION/CONFLICT/UNKNOWN; prove zero-priced, package, no/full/deposit cases, #135, no duplicate rows. No new PO product decision |
| B — pending→confirmed | ALLOW; O/L; expected current status/revision; current workflow permits confirmation | status only; I; does not collect or change request_approval history | W status / K / J / E; no slot revalidation if tuple unchanged | STALE_REVISION/UNKNOWN; test past/current appointments and each financial state; none |
| C — confirmed→check in | ALLOW; O/L; check in is `arrived`; preserve optional waiting step | status only; I; recorded/unresolved money disclosed separately | W status / K / J / E | Safe stale/unknown; prove enum `arrived`, no `checked_in` insertion, configured workflow; none |
| D — arrived/waiting→in_progress→completed | ALLOW; O/L; workflow-enabled steps; direct arrived→completed permitted where workflow skips intermediate steps | status only; I; completed service value is not collected revenue; no implicit payment | W status / K / J / E | Safe stale/unknown; prove E1-B versus collected-money distinction, no hidden collect; none |
| E — No-show and mistaken status correction | CONDITIONAL; O/L; explicit no-show on noncancelled booking; corrective transition from completed/no_show requires intentional correction + reason | status only; I; no fee/refund/ledger mutation | W status / K / J / E | TERMINAL for cancelled; correction reason required. Prove correction versus ordinary progression; none; no automatic no-show inference/job |
| F — Cancellation | CONDITIONAL; O/L; exact existing appointment; fence outstanding original attempt; creator-only financial recovery remains separate | status→cancelled; allowed operation close metadata; REQUESTED→FAILED only with coherent zero-ledger evidence; accepted ledger always retained | X / K / J / E; repeated cancel no duplicate effect; cancel-before-commit yields no money, commit-before-cancel retains exact money | UNKNOWN if financial fence cannot be certified; show “cancelled; payment recorded” where true, no automatic refund. Prove both races and other authorized editor; none |
| G — Reschedule/date/end-time/resize | CONDITIONAL; O/L; noncancelled; original attempt conclusively terminal/bound; destination availability/timezone/DST/end>start checks | start/end only, or explicitly coupled allowed assignment fields; I; no repricing or new attempt; same appointment ID | W schedule / K / J / E; exclusion constraint remains final named-staff race guard | SLOT_CONFLICT/STALE_REVISION; test occupied original slot exclusion, :30/DST, same-appt replay, terminal money preserved; none |
| H — Staff reassignment | CONDITIONAL; O/L; settled original attempt; active qualified staff, service/Location mapping and availability; named staff still required | staff only or explicitly coupled schedule fields; I; no commission/history rewrite | W schedule / K / J / E | Invalid/foreign selection denied without disclosure; race with other bookings and retired staff; none |
| I — Location reassignment | CONDITIONAL; O authorized for old+new L; same Business, allowed service/staff/resources at target, settled attempt | current location plus explicit validated time/assignment changes; original Location and transaction history immutable; commercial/tax basis must remain valid | W schedule / K / J / E | FINANCIAL_REVIEW_REQUIRED if jurisdiction/commercial basis would change; test foreign/location scope and reporting label, projection replay; none for same-basis move |
| J — Room/resource changes | CONDITIONAL; O/L; noncancelled, settled attempt; tenant-valid applicable resources; canonical conflicts | room and exact appointment_resources set atomically; I; no child-table bypass | W schedule / K; ordered child changes after parent; J/E | CONFLICT/UNKNOWN; test child direct-write rejection, resource ordering and rollback. Existing room/unassigned soft checks are not a new hard reservation guarantee; see §8 |
| K — Operational notes | ALLOW; O/L; including cancelled/REQUESTED/client-money-UNKNOWN when structural auth is intact | notes only; I; preserve immutable original notes/package evidence; bounded note data remains tenant-private | W notes / K / J / E; original attempt state untouched | STALE_REVISION/UNKNOWN, notes saved does not settle payment; test cancelled notes and no money/cache changes; none |
| L — Service correction | CONDITIONAL; O/L; noncancelled, settled attempt, compatible service/staff/Location/duration; explicit reason and preserved commercial agreement | current service and explicitly validated schedule/assignments; original service/package/request and money I | W schedule with service-correction command / K / J / E | FINANCIAL_REVIEW_REQUIRED when amount/tax/deposit/package meaning changes; prove same-basis corrections before/after payment and incomplete projections. Distinct amount-changing workflow remains separately gated |
| M — Price/tax/deposit correction | BLOCK in ordinary lifecycle writer, even if no money; F only through separately specified adjustment workflow | No cents/currency/financial cache fields in W. Zero is a valid explicit price, not NULL. Existing quotes/documents never silently overwritten | No W mutation; separate adjustment identity, document/reconciliation and audit design required before its own implementation | “Use financial adjustment; booking/payment history will be retained.” Test forged amount fields rejected. PO/Program Lead must scope that financial workflow if required for launch; not permission to weaken this guard |
| N — Customer reassignment | CONDITIONAL; O/L; noncancelled; exact expected current customer; destination existing same-Business customer; **no appointment-linked ledger at all**, including later separate payment/refunded/failed-labelled history | current customer + existing close metadata only; original operation/attempt/customer remain intact; fence REQUESTED first in same transaction | X / K / J / E; repeated no-ledger correction allowed, never reopen terminal attempt; FK remains final attribution guard | Existing friendly financial-attribution error if any ledger, UNKNOWN if evidence incomplete; prove first/repeated/foreign correction, later-payment race; none |
| O — Any change after recorded payment | ALLOW B–K and same-basis L under their rules; original attempt ACCEPTED is not a permanent scheduling freeze | I; money survives status/assignment/time/cancel; N and ordinary M blocked; later legitimate new payment is separate and not an edit side effect | W/X / K / J / E; canonical reread without re-commit | “Payment recorded; synchronization pending” if needed. Prove same ledger/receipt/invoice identities through each edit; none |
| P — Change while money UNKNOWN/HELD or REQUESTED | CONDITIONAL: B–E/K may proceed without changing financial/booking target, if structure/auth certified; F only through authoritative fenced close; G–J/L/N HOLD until server can certify their preconditions | No new key, no amount/customer/service/slot change justified by UI uncertainty; notes/status success never clears money hold | W/X under K; canonical evidence first for financially material decision; J/E | “Payment outcome needs review; do not collect again.” Test response loss versus genuine contradictory money, deadlock/timeout, stale client UNKNOWN with server settled; none |
| Q — Projections incomplete | ALLOW otherwise eligible operations once original money/no-money terminal truth is certified; separate operation-bound convergence | I; do not reset COMPLETE obligations, rewrite invoice/receipt, zero caches or rerun collect; price/tax/deposit fixed | W/X then independent explicit convergence only under its admission; never nested projector under K; J/E | Disclose incomplete synchronization independent of appointment save; test each of four projector failure states and edit/projector races; none |
| R — Already cancelled | ALLOW notes-only; idempotent cancellation response; all other scheduling/status/service/customer changes BLOCK | notes only; cancellation terminal, no resurrection, no bind/create/commit on closed operation | W notes or X no-change / K / J only for actual notes change / E | TERMINAL. A genuinely new booking needs explicit new intent after original resolution and separate #132 communications handling; test all prohibited fields, including child resources; none |
| S — Operator edit versus payment commit | CONDITIONAL by serialized winner; status/notes do not rewrite tuple; scheduling/service requires resolved original attempt; cancel/customer can fence it | Original money identities I; commit first retains money, then eligible edit; cancel/customer first prevents old attempt from committing | K shared with original commit; no financial lock acquired after appointment by trigger; revision compares current state; J/E | STALE_REVISION/RECOVERY_REQUIRED/UNKNOWN, never guessed zero; prove both winner orders and later unrelated attempt contention; none |
| T — Cancel versus reschedule versus recovery | Exactly one current revision may win; cancellation terminal; reschedule only after terminal original attempt; recovery reads existing result and cannot restore original tuple | Same appointment/operation IDs; no old request overwrite; financial result survives cancellation | K + command replay/revision; loser rereads; recovery does not create again or replay stale edit; J/E | Stale/cancelled/unknown honest result; three-session races, delayed HTTP responses, command replay after newer revision; none |

Status protocol: normal forward workflow uses only the existing configured status set. Noncancelled `completed` and `no_show` are not newly made irrevocable: existing code treats only cancelled as terminal. Preserve authorized corrective status changes with explicit intent/reason and audit; do not invent an automatic reverse transition or financial effect. Historical `scheduled` is tolerated on legacy rows; no new durable command creates it. New-create `pending/confirmed` resolution is not reused to coerce an operational status to one of those two values.

## 7. Narrow trusted writer and proposed database interfaces

### 7.1 Two distinct authority domains

Server actions authenticate with the existing trusted session, resolve the current Business, check the appointment and allowed command, and obtain the server-only service client. They pass the **server-derived** actor and Business; browser IDs are selectors to revalidate, never authority. Every RPC independently checks current Business owner/admin membership and every relationship.

Original create/bind/payment/recovery retain original-actor equality. Operational maintenance may be performed by a different currently authorized O actor. Record both original creator and actual editor; never impersonate the original actor to satisfy v1 checks. A noncreator cannot acquire original tender details or resume/collect the creator's unresolved payment by invoking maintenance. Cancellation/customer correction may fence that attempt through explicit team-authorized lifecycle authority, with no payment execution.

Proposed functions remain SECURITY INVOKER, pinned `pg_catalog, pg_temp`, fully qualified relations, literal service-role entry check; EXECUTE only to service_role, revoked from PUBLIC/anon/authenticated. Existing server identity discipline is retained. No new browser table privileges, role memberships, RLS broadening or FORCE-RLS change. A `channel`, client boolean, user metadata, or transaction setting is never a bypass credential.

### 7.2 Proposed signatures — notation only, not executable SQL

Common typed command header H:
`business_id:uuid, operation_id:uuid, appointment_id:uuid, actor_id:uuid, mutation_id:uuid, expected_revision:bigint, reason:text`.

| Proposed interface | Exact additional inputs / permitted effect |
| --- | --- |
| `transition_booking_appointment_v2(H, target_status:appointment_status, correction:boolean)` | Status only; excludes cancelled (use close), rejects NULL/unsupported targets; correction cannot bypass terminal cancellation |
| `revise_booking_schedule_v2(H, command:text, location_id:uuid, service_id:uuid, staff_id:uuid, start:timestamptz, end:timestamptz, room_id:uuid-or-null, resource_ids:uuid[])` | Complete desired operational scheduling tuple; command constrained to RESCHEDULE/RESIZE/REASSIGN_STAFF/REASSIGN_LOCATION/RESOURCES/SERVICE_CORRECTION; unchanged fields must equal locked current tuple for that command. Explicitly coupled reassignment supported; no omitted-value/NULL ambiguity, arbitrary JSON patch, notes/status/cents/customer fields |
| `revise_booking_notes_v2(H, notes:text-or-null)` | Bounded current notes; cannot alter immutable package/request evidence |
| `close_booking_appointment_v2(H, command:text, expected_customer_id:uuid-or-null, replacement_customer_id:uuid-or-null)` | CANCEL or REASSIGN_CUSTOMER only; precise combinations, expected-current compare, terminal and zero-ledger restrictions in matrix |
| `read_booking_appointment_mutation_v2(business_id:uuid, appointment_id:uuid, actor_id:uuid, mutation_id:uuid)` | Authorized bounded operational result/revision, no tender PII; NOT_FOUND never licenses a new monetary identity |

Result contract: `APPLIED | REPLAY | NO_CHANGE | STALE_REVISION | CONFLICT | FINANCIAL_REVIEW_REQUIRED | TERMINAL | NOT_AUTHORIZED | UNKNOWN`, plus permitted appointment/operation/mutation IDs, current revision/status and safe canonical recovery reference. Exception/transport uncertainty maps to UNKNOWN outside the transaction. No raw table snapshots or global sequences reach ordinary clients. Money state comes from existing authorized canonical readers, not a second sum in the action.

### 7.3 Guard and audit mechanism

Propose one private append-only lifecycle command journal and one `appointments.operational_revision` counter (initial 0). Use a private/non-API schema with explicit access controls and RLS defense in depth; no browser access or sequence privileges. No new role is needed. Journal rows have same-Business composite references, unique `(business_id, appointment_id, mutation_id)` and unique applied-effect revision (no-op records do not consume a revision), retain the canonical bounded command tuple (not only its hash), actor, operation, expected/result revision, transaction identity, reason and exact whitelisted pre/post images. Notes are sensitive tenant operational data: restrict access and bound retention with retained appointment history; do not copy contact details or full arbitrary payloads.

RPC acquires K, rechecks authority and state, and checks prior mutation identity **before** expected-revision rejection. Same ID/same tuple returns original effect evidence plus current state; same ID/different tuple rejects. An old successful command replay never reapplies its old after-image over a newer revision. A no-op has a replayable result and no extra revision/notification.

For an actual mutation, RPC constructs a transaction-bound journal permit from validated current/desired fields, inserts it, and updates appointment + resources + revision in the same transaction. The replacement guard still enforces immutable identities/amounts and legal transitions, and requires an exact matching current-transaction permit, before revision and post-image. It must not accept a caller-supplied GUC/session flag as permission. A final in-transaction assertion verifies the effect matches the journal; failure rolls back **both**. This unifies reliable audit and command replay instead of relying on existing best-effort `logAppointmentChange` after commit.

The service role remains a trusted server principal, not an adversary this mechanism can magically constrain: it has existing privileged capabilities. Browser/authenticated callers cannot create permits or execute W. Direct service-role guarded UPDATE without a validated matching permit is rejected. The guard rechecks actor/tenant/field-set/terminal/financial conditions so a journal entry is not a generic “allow all” token. No dynamic SQL. Same transaction identity alone is insufficient; exact tuple, revision, command and relationship checks are mandatory.

Keep the INSERT branch and legacy NULL/NULL branch of the original guard unchanged. Add/update a narrowly scoped guard on `appointment_resources` so direct child mutation cannot evade linked-parent rules; it locks the parent but never later waits for an attempt or operation lock. Permit check is same-transaction and exact resource delta. Avoid a new guard on unrelated legacy resources. Preserve original atomic creation: `persist_booking_operation_appointment_v1` inserts the operation-tagged parent and the admitted resource set in one transaction. The child guard must explicitly recognize that original creation case (service-only, OPEN original operation, exact original parent/resource tuple) without requiring a later maintenance permit. It must not authorize arbitrary additions, UPDATE or DELETE merely because the operation is OPEN. Initial-resource integrity and after-bind/after-close direct writes are separate mandatory proof cases; if this cannot be expressed without a small persistence-body compatibility amendment, identify and re-review that exact delta before expanding the frozen SQL allowlist.

Existing `close_booking_operation_v1` needs a narrowly replaced body in the **new migration**, preserving its signature, original-actor check, terminal results and accepted fencing algorithm, while participating in the same journal/revision discipline. Share an internal fenced-close implementation with v2; internal EXECUTE is private/server-only, never a public generic mutation primitive. The v1 adapter's expected-current customer condition remains required; its legacy call has no optimistic revision argument and therefore reads current state under K rather than claiming modern stale-edit protection. Existing pricing/slot/abandon close without an appointment creates no appointment mutation record. v2 changes maintenance actor authorization, not the financial commit actor rule.

No original bootstrap, persistence, bind or money-commit algorithm is redesigned. Reader transport may expose operational revision/current status separately from original request. Old replay must never require current scheduling fields to equal the initial request after a valid edit; original bootstrap request identity still must match exactly.

## 8. Locks, transactions and concurrency obligations

Preserve actual source lock paths; do not invent one global lock order that existing functions do not use:

- Bootstrap: sorted customer email/phone advisory locks → operation advisory lock → new-row insert order.
- Existing persist: operation advisory → original attempt → operation; appointment does not yet exist.
- Existing bind/close/commit and proposed W/X: operation advisory → original attempt → existing appointment → operation. Use the exact existing `booking-operation:` advisory namespace.
- Existing projector: admission shared lock → obligation → attempt → ledger → appointment → aggregate/target/sequence. It does **not** take the operation advisory lock.

W/X must not acquire obligation/ledger row locks or invoke projectors after holding attempt/appointment. After serializing, use a complete authoritative read for eligibility; do not wait on another payment attempt after locking appointment. Later independent payment writers may have their own attempt before appointment, so “lock all related attempts after the appointment” would add a reverse edge. Customer changes rely on the preserved composite attribution FK and appointment lock as well as the zero-ledger check; a concurrent ledger insert either wins and blocks reassignment, or loses the FK race and fails without reassignment of financial history. Test legacy and durable later-payment writers, not only the original attempt.

At default READ COMMITTED, acquire locks first and perform decision reads afterward; use a new command snapshot after waits. At stronger isolation, serialization failure is a rollback/UNKNOWN transport result needing same-identity recovery, not justification for stale classification. PostgreSQL row/advisory locks and transaction-snapshot semantics support this approach, but do not prove this application's deadlock freedom: [PostgreSQL 17 locking](https://www.postgresql.org/docs/17/explicit-locking.html), [transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html).

Auth membership/ownership and destination catalog/assignment reads must be revalidated transactionally, with stable authorization rows locked before K where the future implementation needs revocation serialization. Do not hold those locks while calling network validation. Their exact row modes and sorted multi-Location/resource order must be inventoried against existing administration writers in the SQL implementation review; no new permission promise based on a stale browser session. Admission disables new creates, not authorized recovery/maintenance of already durable appointments.

Operational validation divides into three cases: notes/status do not rerun new-create future-slot/catalog checks; schedule/assignment/service corrections validate the desired current tuple excluding the same appointment; monetary adjustment is refused. Database-side tenant/assignment checks and authoritative slot validation remain mandatory for W; server preflight is helpful but not authoritative. Keep named-staff exclusion protection. Current room/resource/unassigned checks are soft checks; this proposal does not upgrade them to a proven interval reservation lock or enable optional staff. If normal-room concurrency acceptance requires stronger reservation guarantees, record that separate blocker rather than claiming this amendment supplies them.

One lifecycle command, audit, revision, appointment/resource effect and any close fence form one transaction. An exception, failed validation, conflict or audit failure leaves none of that command committed. Earlier committed money is never rolled back by a later lifecycle failure. Use bounded lock/statement timeouts (proposed 5s/30s, subject to local proof); never silently increase. Deadlock/timeout/connection loss preserves identifiers, canonical reread and no blind retry. A network timeout does not prove the server transaction failed.

## 9. Financial, customer and projection compatibility

- Original terminal money is unchanged across every successful lifecycle command. A cancellation is not a refund. Status completed/no_show does not create a charge or erase a deposit. HELD/UNKNOWN never becomes zero.
- No cents/payment-status/amount-paid/refunded field is accepted by W. Existing projection cache updates remain in their existing unguarded-by-lifecycle financial column set; they do not increment operational revision or create an operational journal entry. Avoid an all-columns trigger that would break projectors.
- A request with no payment uses SKIPPED history, not an absent attempt. Financially neutral operational edits require settled original target for scheduling, but do not reopen/re-bootstrap it. Later money must use an intentional separately authorized attempt, never an edit-triggered automatic collection.
- A price/tax/deposit change can invalidate existing invoice/projection truth even with no collected money. Therefore a separate financial-adjustment document/workflow is required: explicit authority, before/after agreement, original preserved quote, invoice/credit/rebill rules, outstanding-balance/refund handling, currency constraints, document identity and concurrency. None exists by assertion in this addendum. Do not use cancel+recreate as a hidden financial transfer workaround. Program Lead must schedule this dependency if launch requires amount-changing edits.
- Service correction under unchanged agreed commercial basis does not rewrite existing invoice lines or receipts. Location move must not silently change the tax jurisdiction/agreement. Incompatibility is a named financial-review hold, not a guessed new catalog price.
- Customer correction checks **all** appointment-linked ledger history, not just original attempt or succeeded rows. Once any exists, refuse customer reassignment; refunds do not erase that history. Original customer/attempt remains traceable after allowed no-ledger correction. Customer merge, transfer of money and delete/cascade are outside scope. Preserve friendly deletion/history-retention behavior and the composite FK.
- Projection failures are separable from appointment maintenance and money settlement. Eligible scheduling/status/notes may proceed while synchronization is incomplete; explicit later convergence is restricted to that operation/attempt and existing admission/watermark. No worker scan or resetting COMPLETE obligations. Canonical reread outranks stale replay PENDING or `recovery_disposition=RECOVER`.
- Cross-editor operational view does not expose the creator's private recovery payload. If the existing creator-only financial reader cannot serve an authorized colleague's maintenance decision, the W server transaction decides the narrow predicate and returns a safe state; it does not impersonate the creator or grant broad private history reads. Full team payment recovery remains outside scope.

## 10. Recovery correction and replacement criterion

Required order for every create retry/resume:

1. Authenticate the current actor and resolve Business; validate only opaque identity syntax/ownership first.
2. Canonically read operation, operation-tagged appointment, attempt/ledger/events and binding under the existing authorized reader. Contradiction/truncation/foreign reference/error returns HOLD/UNKNOWN.
3. If an appointment exists, recover it by original identity; never subject it to new-create availability, future-date or current catalog checks, and never restore its old scheduling tuple. Bind only the same appointment if safely unbound; settled attempt means read, not collect. CLOSED lifecycle cannot be resurrected. A lost result after a later operator edit must return current appointment state and original financial result separately.
4. If an operation exists but no appointment, resume from the protected persisted original request and attempt identity, never browser-reconstructed PII. Before any still-needed insertion, validate current feasibility and fresh authoritative commercial snapshot; changed price/slot fences the old operation using the existing safe close semantics, without silently changing its request. “Only new create” means a genuinely new appointment insertion, not mere response recovery of an existing row.
5. If no operation is visible, ABSENT is only a snapshot result. With the intact original request, same-identity advisory-serialized bootstrap may safely resume; with lost original request, stay UNKNOWN/HOLD. No new key, new customer or collect-again instruction.

Opaque browser storage holds only operation/attempt/inline-customer references partitioned by account/Business context. Server resume loads protected original request/attempt key; ordinary DTO omits notes, customer PII, raw tuples/fingerprints, provider payloads and both raw sequence values. Logout clears local visibility without claiming server cancellation. Preserve #135's synchronous guard across pointer/keyboard/requestSubmit overlaps and ambiguous results; no unconditional error/finally reset.

**Exact safe identity rotation criteria:**

- A new request has positively never been dispatched (local state before network dispatch), and its old identities cannot be reused by another admitted request; or
- Canonical serialized close has committed for the original operation, permanently fencing future create/commit with those identities, with the result reconciled; any saved cancelled appointment/recorded money remains visible; or
- The original operation's result is canonically resolved and the operator deliberately selects **Book Another**, meaning a distinct booking, not retry/replace/repair of the old one. Retain the old result and rotate all three identities together.

An ABSENT read, elapsed time, disabled new admission, aborted browser fetch, two matching empty reads, no recent transactions, or taking/releasing an advisory lock **without a persistent fence** is not a safe replacement criterion: a delayed request could execute later. The current schema provides no absent-operation tombstone. This proposal does not add one or promise automatic recovery when all original references/request are lost. Such cases require governed investigation/HOLD; a later durable absent-key fence would need a separate proof and design gate.

## 11. Migration boundary, older appointments and rollout

A future **new** migration is necessary for full linked-appointment Option B. Its narrow proposed scope:

- Add operational revision and private lifecycle command journal with tenant FKs, unique replay/effect keys and explicit restricted ACL/RLS.
- Narrowly replace `guard_appointment_booking_operation_link_v1`; preserve insert/original identity/commercial protections and legacy NULL/NULL branch.
- Add typed v2 lifecycle RPCs and private shared close/validation helpers; narrow v1 close-body compatibility replacement; guard linked resource children.
- No change to appointment enum, original request/attempt/ledger immutability, financial-attribution FK, old migration bytes/history, broad table policies, #153 permission cutover, projection admission, provider or worker infrastructure.

Exact object names/schema placement, signatures, ACL inventory, authorization-row lock modes and resource-trigger graph must be frozen in the later SQL implementation contract and independently reviewed before writing SQL. This phase provides the architecture and typed interfaces, **not executable DDL or a migration filename**.

Older unlinked appointments keep existing session/RLS behavior; no backfill/adoption into operations and no interpretation of historical `scheduled` as a new durable status. Linked rows initially have revision 0; later migration application must prove original columns/evidence unchanged and no per-row audit fabrication. Existing operation-linked create/close/recovery clients retain wire compatibility. Old direct operational writers remain rejected on linked rows until explicit routing exists; fallback to session writes is prohibited.

Rollout: prepare additive schema + default-closed application compatibility, independently review, local delta proof, separately approved Staging schema gate, then new synthetic operator acceptance before any real-Business cutover. No migration is applied under this document. On deployment rollback, close new admission/maintenance UI gates and retain schema/audit/evidence; do not restore the old blanket guard blindly after edits or delete journals. Existing same-identity read/recovery remains available under authorized paths. If future schema application fails, transaction rollback must leave original objects/rows intact; sequence consumption, if any, is not promised reversible. After committed effects, recovery is a forward reviewed correction, never erasing history.

## 12. New proof and regression requirements — NOT EXECUTED

Local PostgreSQL proof must use a fresh disposable synthetic cohort and real unchanged prerequisite migrations plus the separately authored amendment. Do not rerun accepted proof6/C01/C02/C03/I1/Slice 2A packages or use retained cohorts. Capture exact bytes, catalog/ACL/trigger checks and multi-session witnesses.

| Proof group | Required new evidence |
| --- | --- |
| Matrix A–T | Each row's success/refusal, immutable hashes/IDs, journal/revision and zero side effects; skipped states cannot be claimed passed |
| Authority | Browser anon/authenticated RPC and direct guarded/child writes denied; wrong Business/Location/staff/service/customer/resource rejected; revoked actor denied; authorized second owner/admin maintenance works without original-actor impersonation or payment-recovery access |
| Guard integrity | Direct service update without permit denied; forged/old-transaction/wrong-field/wrong-revision permit rejected; no-op/same-key replay/different-key stale update; original INSERT and legacy NULL/NULL unchanged; caches still project |
| Status | Existing enum only, workflow skip/correction, past appointment status changes, cancelled notes-only, no accidental new-create validation |
| Scheduling | Existing appointment excluded from conflict, two separate bookings conflict correctly, change time/staff/Location/room/service with retained money and truthful original/current attribution; resource child rollback; optional staff stays gated |
| Customer/financial | Original/later/legacy ledger blocks reassignment; repeated no-ledger close corrections safe; refund evidence never authorizes reassignment; all cents/cache injection rejected; no stale invoice/receipt rewrite |
| Concurrency | Edit vs original commit both orders; cancellation vs commit both orders; correction vs later independent ledger insert both orders; edit vs projector both orders; cancel/reschedule/recovery three-session races; two editors same revision; auth revocation; child writes; bounded waits and deliberate timeout |
| Projection truth | All four projections incomplete/failed/complete before and after neutral edits; same document IDs and paid totals; no COMPLETE reset; no response PENDING overriding canonical COMPLETE; no false EXACT from hidden refund witnesses |
| Recovery | HTTP loss after every boundary; existing appointment in past/original occupied slot/changed catalog still recovered; missing original browser request uses server persistence; before-bootstrap ABSENT never permits new identity; old mutation replay after later edit never restores old fields |
| Atomicity | Induced guard/audit/resource failure rolls back command/close fence together; prior committed ledger survives; failed migration rolls back DDL; no duplicate journal effect or appointment |
| Legacy boundaries | Existing public booking, Summer, API/recurring and session dashboard routes unchanged where not linked; a linked row cannot evade W through a legacy route; existing Collect payment escape paths identified/held, not silently trusted |
| Communications | Real create/event bridge and outer delivery seam observed: zero notifications/jobs/send intents/provider calls/receipt sends/calendar/reminders/waitlist; status/cancel/reschedule/replay failures also zero. Audit journal is not a communication outbox |

Later application regressions: focused commerce/booking/lifecycle/security tests, #135's five accepted overlap/same-sheet retry cases and edit behavior, typecheck, changed-file lint, build and diff checks. Full Booking Sheet and Quick Appointment at 390×844, 768×1024, 1280×800 and 1440×900: keyboard/focus restoration, visible pending/unknown/saved-money states, no overflow or lost selected Location/customer, deliberate Book Another. All are future gates; no tests/build/database proof ran in Phase 0.

## 13. Phase 1 dependencies and minimal implementation milestones

| Dependency | Independent default-closed preparation? | Lifecycle relationship |
| --- | --- | --- |
| Authoritative package/service pricing, fresh catalog/tax/deposit comparison, explicit free service | Yes | New-create truth; do not reprice existing recovered appointment |
| Payment-mode compatibility, same operation identities, no eager inline customer | Yes | Original money invariants remain unchanged |
| Canonical-first opaque recovery, safe DTO/history, #135 browser guard | Yes | Must recognize current operational revision/closed state; no original tuple restoration |
| Durable-only appointment.created suppression and outer receipt/booking delivery suppression | Yes | Extend equivalent containment to lifecycle/cancellation waitlist; no global legacy disable |
| Business-scoped admission / retained evidence exclusions | Yes | Default closed; enabling creates or maintenance is separate from projection/worker/communication admission |
| Operation-bound projection convergence | Yes, existing financial contract | Neutral edits preserve commercial basis; never call within lifecycle transaction or sweep retained work |
| Legacy collection escape-route protection | Yes, inventory/guards | Activation blocker: UNKNOWN cannot route to a legacy second collection; no permission cutover hidden here |
| Normal linked appointment lifecycle | **Requires proposed amendment** | Existing SQL rejects required operations; no service-client workaround |
| Amount-changing corrections | Separate financial-adjustment design | Ordinary lifecycle remains nonfinancial; no silent invoice/ledger rewrite |

Proposed bounded milestones, each needing its own dispatch:

1. **D0 (this delivery):** new addendum + three minimal continuity pointers; documentation-only Draft PR; independent Claude audit and Program Lead reconciliation.
2. **D1:** freeze narrow new SQL/typed writer delta and tests; local implementation/proof only after exact approval. No historical migration edits, #153 work, provider/worker or live database work. Validate all lifecycle and resource guard paths, v1 compatibility and projection lock interaction.
3. **A1:** separately approved default-closed server adapters/recovery/authoritative prices/admission/communications containment. Independent work may be prepared while D1 is reviewed; cannot be activated as full Option B before D1 passes.
4. **A2:** default-closed Full Booking Sheet + Quick Appointment wiring and operational actions routing, canonical disclosure/history/focus and safe customer-retention errors. No redesign of existing global booking engine or financial kernel.
5. **S1:** exact new synthetic Staging migration/application/UI package, exclusion of every retained cohort and separate PO execution approval. Demonstrate full Option B and money survival, not only create/recover/cancel. No accepted historical proof rerun.
6. **R1:** independent release audit; #153 trusted-reader/permission dependencies, unsafe legacy writer inventory, #132 communications sequencing/identity and separate communication acceptance, exact release gate and GVM operational acceptance. Workers/providers/technician deposits remain held unless separately authorized.

Future source allowlist candidates (not permission to edit now): `lib/actions/appointments.ts`, `lib/booking-engine/mutations/{create,update,cancel,reschedule,resize}.ts`, explicit persistence/types seams, `lib/commerce/booking-operations/{kernel,types,index}.ts` and narrowly new lifecycle/recovery modules, operator DTO/actions, the two booking surfaces and their necessary customer/payment subcomponents, a single new lifecycle migration plus delta proofs. Exact paths must be finalized at D1/A1; no unrelated refactor, migration edits or application implementation enters this PR.

## 14. Risks, unresolved assumptions and decisions

| Classification | Finding / required treatment |
| --- | --- |
| Launch blocker, source-confirmed | Existing linked-appointment guard is incompatible with Option B; full operator activation stays closed until the amendment and application routing pass |
| High-risk proposed mechanism, unproven | Transaction-bound journal/guard, child guard, v1 close adapter and auth-row locking need the exact new PostgreSQL delta proof; a prose lock graph is not concurrency PASS |
| Launch dependency | #153 must preserve trusted reader BYPASSRLS/SELECT, six explicit FK hints, full count and foreign-refund contradiction visibility. No false EXACT after a permission change; no #153 code/SQL here |
| Launch communications gate | #132 old/replacement identity and inline-confirmation/queued-cancellation ordering remain open. Silent synthetic containment is not a release-ready customer communication experience |
| Intentional financial restriction | Amount/currency/tax/deposit changes require separate adjustment/document design. Program Lead must scope that work if it is required for launch; no PO choice about ordinary Option B remains unresolved |
| Existing limitation | Current room/resource and unassigned overlap checks are soft; optional staff remains gated. Do not advertise stronger capacity guarantees without a separate proven rule |
| Existing recovery limitation | Lost request with absent/unfenced operation remains HOLD. Automatic absent-key recovery is not promised |
| Permission boundary | Owner/admin team maintenance proposed; arbitrary staff delegation and team takeover of original payment recovery are not implicitly approved |
| Privacy / operational evidence | Private journal retains bounded reasons/notes; implementation gate must set appropriate access/retention and avoid browser/global-sequence leaks |
| Acceptance limit | No implementation, SQL, runtime, independent acceptance or Production readiness established by this document |

**Remaining PO decisions:** no further product selection is needed between Option A and Option B; B is explicitly selected. The precise technical proposal now needs independent audit, then bounded implementation approval. Any requested amount-changing financial-adjustment scope or additional staff/payment delegation is a distinct consequential decision, not a reason to weaken this lifecycle contract or silently downgrade Option B.

## 15. Independent audit checklist and final authorization gate

Claude's exact candidate review must answer all of the following:

- [ ] Original operation/attempt/customer/tender/ledger and applied migration bytes preserved; only identified lifecycle/recovery assumptions superseded.
- [ ] Matrix A–T supplies every actor/scope/precondition/immutable/mutable/money/writer/lock/audit/effects/error/test/decision dimension via §§5–6.
- [ ] Correct existing status vocabulary, configured workflow, explicit correction and cancelled notes-only terminal behavior.
- [ ] Team operational authority cannot become creator impersonation, private financial disclosure or service-role capability in the browser.
- [ ] Narrow RPCs, exact current-transaction journal permit, protected child relation and guard remain independently restrictive; no generic patch/GUC bypass.
- [ ] Lock graph includes existing projection order, later independent payment writers, revocation, child triggers and v1 close compatibility; no unproven global deadlock claim.
- [ ] Cancellation and no-ledger customer correction preserve FK attribution, terminal attempts and truthful money; any ledger history blocks reassignment.
- [ ] Scheduling and same-basis service edits preserve commercial values/documents and original versus current Location semantics; financial adjustments remain distinct.
- [ ] Canonical-first recovery cannot conflict with itself, overwrite later edits, re-collect, mint replacement keys from ABSENT, or promise a missing fence.
- [ ] Incomplete projections/HELD/UNKNOWN disclosed separately from operational save; no zero substitution, invoice rewrite or retained-obligation sweep.
- [ ] Legacy NULL/NULL behavior, new-create inserts and accepted financial projection cache writes preserved; old clients fail closed rather than silently falling back.
- [ ] Durable create/lifecycle effects contained, including outer cancellation waitlist; #132/#153 gates and all retained cohorts preserved.
- [ ] Future new migration/delta proof/application milestones are bounded, separately authorized and do not rerun accepted historical proofs.
- [ ] No new product downgrade, automatic specialist dispatch, independent acceptance or Production authority asserted.

Gate: Darshan manually sends the exact Draft PR commit and addendum hash to Claude Opus 5 High; Claude returns a consolidated independent report; Darshan returns it to ChatGPT for reconciliation. Only then may Darshan approve an exact D1/A1 implementation contract. Draft PR creation and even a later documentation merge authorize **no application/SQL implementation, hosted activation or Production release**.

## 16. Protected identities and validation record

Read-only SHA-256 verification at the starting main tree:

| Protected source | SHA-256 |
| --- | --- |
| `issue-134-durable-booking-deposit-contract.md` | `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d` |
| `issue-133-slice2-canonical-financial-wiring-design.md` | `1f1a966c8466d6f124adab76a2bb188497c363a30d1f104df42c663d7eba029a` |
| `20261004190341_issue_134_payment_attempt_foundation.sql` | `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47` |
| `20261005154345_issue_134_r1a_manual_payment_kernel.sql` | `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7` |
| `20261007012529_issue_134_appointment_financial_attribution.sql` | `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524` |
| `20261007203352_issue_134_durable_booking_operation.sql` | `01b10f8c629cc73b08d6c5849160836b90cbc87beb29d7c8b78857375fe2493b` |
| `20261008210359_issue_133_payment_projection_observability.sql` | `ca91f6cbe7b9aa3a2c1b0b1eec13c267b1364badac9bfe07c4366c3157006f56` |

Source-to-hosted migration mappings remain those in the unchanged environment manifest; do not rename, reapply or fabricate ledger history. Historical validation/evidence trees, AGENTS, locked decision log and environment manifest are unchanged.

Phase 0 verification is documentation/source validation: current GitHub baseline, exact diff allowlist, protected byte comparison, matrix coverage, local link existence and whitespace checks. No application tests, build, PostgreSQL proof, hosted SQL, credential/fixture read, provider/worker, communication, GVM/HQ operation or deployment ran. Only local documentation/Git work and the authorized branch/Draft PR publication belong to this delivery.
