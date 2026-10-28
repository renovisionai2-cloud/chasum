# #134 / #133 Slice 2B D1 — lifecycle SQL implementation-contract freeze

**Status: PROPOSED — READY FOR FOCUSED INDEPENDENT AUDIT.**
**Date:** 2026-10-13, America/Toronto. **Author:** Codex, primary implementer. Darshan is Product Owner; ChatGPT reconciles; Darshan manually dispatches Claude Opus 5 High. This K-1–K-7 canonical recovery addendum is documentation only; no independent acceptance of these amended bytes is claimed.

## Baseline and authority

Freshly verified main: `233a2bebc5a4e4a8a787eccbb4b99a7769de0172`, tree `02e27310cca5dd2d32d583be64b600b39cef4dfa`, sole parent `4c1abb2f97353cc626de6113e49f881a4cfef2e9`. [PR #162](https://github.com/renovisionai2-cloud/chasum/pull/162) was squash-merged at `2026-10-13T15:53:31Z`; it is closed and must not be reused. Historical independent D1 acceptance: `D1_CONTRACT_ACCEPTED_FOR_PO_LOCAL_SQL_GATE`, K1–K4 PASS, candidate `13d5c7275583457181f71fd79808463069ce939b`, tree `e98246fd32eb8980eeb458ebfb1e0e8b0f36c372`, **prior document SHA-256 `0c9b15bb20a1baf84a0a47fbf7b3187a4739537e7068fc1c5c36a1bff54710f6`**. That acceptance applies to those historical bytes, not this amended document. The new document digest belongs in continuity records, outside this file.

The [Phase 0 addendum](issue-134-slice2b-lifecycle-readiness-addendum.md) remains unchanged at SHA-256 `89ac66c67e85f2cb53973ce7f9e30d9f44e71b9661d0658a48d339a70a2282db`. Its supplied acceptance remains `LEVEL3_DESIGN_ACCEPTED_FOR_PO_D1_FREEZE_GATE`, C1–C9 PASS, C10 SOUND/adopted, candidate `79e4d6d7af6058bdfce0abad3e32bc46b8cc043c`, tree `99ccd20e354560ee2f104569ace24bf8f87be2aa`, merged through PR #161. The prior D1 K1–K4 correction history remains in PR #162/Git; this addendum's hyphenated **K-1–K-7** identifiers designate the new recovery clarification, not a reopened staff/duration/retention design.

Option B full operator lifecycle remains approved. All signatures below are descriptive type notation, not executable declarations. Sources are pinned to the main above; hosted catalog/role state is **NOT QUERIED**. Production last verified `664fbc734c4103d78484c6b3828849a6605a562f` is historical, not re-probed. The prior local SQL task stopped on the post-customer-correction commit tuple check; its incomplete, untracked, unexecuted draft and evidence in `/private/tmp/chasum-slice2b-d1-local-sql` remain untouched. No SQL proof has run. This task does not resume implementation or authorize SQL, A1/A2, hosted work or activation.

Sources of authority: [AGENTS](../../AGENTS.md), [Bible](../company/CHASUM_BIBLE.md), [board](../CURRENT_PROJECT_STATE.md), [handoff](../handoffs/LATEST_HANDOFF.md), [environment manifest](../runtime/ENVIRONMENT_MANIFEST.md), [decision log](../product/14_DECISION_LOG.md), [changelog](../CHANGELOG.md), [durable booking contract](issue-134-durable-booking-deposit-contract.md), [financial wiring design](issue-133-slice2-canonical-financial-wiring-design.md), and accepted Phase 0. Protected financial contracts/migrations and Section T are unchanged. Competitive gate: NOT_APPLICABLE, documentation-only canonical recovery clarification with no implementation or activation.

### Supplied reconciliation and precise supersession

Claude's supplied independent reconciliation is **OPTION_A_SAFE_ONLY_AS_UNKNOWN_HOLD_UNTIL_A1A2**. It supersedes the earlier overly broad claim that `read_booking_operations_v1` alone could certify entire-appointment no-money truth. K-1–K-7 below clarify Sections C/I/K/L/R/S/U and their recovery references; they do not alter financial functions, expand Section T, downgrade Option B or self-certify new document bytes. Preserve original commit/close/read functions and original attempt/customer history in this task. The pre-existing Section T future v1 close-adapter scope is neither expanded nor executed.

Until separately implemented and independently accepted A1/A2 trusted evidence composition exists, exceptional post-correction recovery remains **UNKNOWN / HOLD**. More precise application classification is future work, not an existing enum, DTO or implemented feature. No failed/ambiguous read, original-attempt zero or recorded=false permits a new payment identity or collection.

### Focused source confirmation (static inspection, not runtime proof)

| Claim | Pinned source |
| --- | --- |
| Immutable operation customer; original INSERT customer match; correction admission metadata; historical ledger veto | `20261007203352_issue_134_durable_booking_operation.sql`: guard bodies at 240–475 and close at 1725–1783. |
| Three-way customer/original-actor check returns UNKNOWN before terminal NOT_COMMITTABLE | Same durable migration: 1949–1970, then 1997–2063; no transaction INSERT precedes this return. |
| Original-actor-only operation selection; original-attempt ledger relationship; omitted customer/replacement/refund evidence | Same durable migration: mode-one reader 2304–2474, especially ledger_rows join and explicit JSON construction. |
| Immutable attempt customer; independent appointment/attempt attribution constraints | `20261004190341_issue_134_payment_attempt_foundation.sql`: 171–196, 199–240; `20261007012529_issue_134_appointment_financial_attribution.sql`: 136–145. |
| Owner/admin observability; internal validity flags; actual JSON projection and service-only EXECUTE | `20261008210359_issue_133_payment_projection_observability.sql`: 648–729 and 744–745; internal flags 677–678, operator_state 703, exported JSON 716–725. |
| Existing application readers are not the future exceptional-recovery composition | `lib/commerce/booking-operations/kernel.ts::parseCanonicalPayload/readBookingOperationCanonical`; `lib/commerce/payment-observability/reader.ts::readPaymentObservability`; `lib/commerce/financial-aggregate/reader.ts::readFinancialAggregate`. |

## A. Existing schema/object inventory

All public relations below retain their current ownership, ACL and RLS. Source line numbers are navigation aids at the pinned main. No historical migration is edited.

| Object / source | Exact contract relevant to the amendment |
| --- | --- |
| `public.appointments`; `001_booking_engine.sql`, `008_phase5_multi_location.sql`, `019_booking_engine_2.sql`, commerce migrations | UUID `id`, non-null `business_id/customer_id`; operational `location_id/service_id/staff_id/start_time/end_time/status/notes/room_id`; commercial `price_cents/tax_cents/deposit_cents`; projection `amount_paid_cents/amount_refunded_cents/payment_status`; timestamps. Existing nullable fields remain nullable; new lifecycle scheduling requires named staff. |
| `public.appointment_status` | Current application vocabulary: pending, confirmed, arrived, waiting, in_progress, completed, cancelled, no_show. Historical scheduled exists; no new durable transition targets it. checked_in is not an enum status. `lib/types/booking.ts` is the workflow vocabulary. |
| `appointments_id_business_attempt_key` | Existing UNIQUE(id,business_id), foundation migration; reuse for journal tenant FK. |
| `appointments_id_business_customer_financial_key` | Existing UNIQUE(id,business_id,customer_id), attribution migration. Ledger composite FK protects customer attribution independently of guards. |
| `appointments_booking_operation_fk`, `appointments_booking_operation_key` | Composite operation/Business FK RESTRICT; unique (business_id,booking_operation_id) where link non-null. Exactly one appointment per operation; no unlink/relink/adoption. |
| `public.commerce_booking_operations`; durable migration lines 82–238 | Immutable original actor, Business/customer/request, scheduling/commercial/package/tender reference; mutable lifecycle_state/close_reason/replacement_customer_id/closed_at/updated_at only. Existing unique(id,business_id). OPEN → APPOINTMENT_CREATED → CLOSED, no reopening. |
| `public.commerce_payment_attempts` and events; foundation | Original amount/currency/customer/attempt key immutable; REQUESTED/ACCEPTED/FAILED/SKIPPED. Appointment FK `(appointment_id,business_id)` is **ON DELETE RESTRICT**. Original operation FK and one-attempt-per-operation unique index remain. Events append-only; no lifecycle event added to that enum-like text list. |
| `public.commerce_transactions`; attribution + foundation | Collected-money authority. Composite appointment/Business/customer FK plus attempt guard; all statuses/kinds are history for customer correction, not just successful deposits. |
| `public.commerce_refunds`; `028_commerce_platform.sql:289` | Independent transaction_id and appointment_id FKs, no composite refund-to-transaction tenant invariant. Existence veto must inspect both relationship axes without tenant/status filters hiding contradictions. |
| `public.appointment_resources`; `019_booking_engine_2.sql:80` | Only appointment_id and resource_id, composite PK; immediate validated appointment FK ON DELETE CASCADE, resource FK ON DELETE RESTRICT. No business_id. Existing owner policy derives authority through appointment. Default constraint identities `appointment_resources_appointment_id_fkey` / `appointment_resources_resource_id_fkey` must be confirmed structurally at proof time. |
| `public.booking_resources`; same migration | UUID id/Business, nullable location_id, resource_type room/equipment/vehicle/other, is_active, capacity. Room and child resources remain soft availability checks; no interval reservation redesign. |
| `public.businesses`, `public.business_members`; `032_private_alpha_co_owners.sql:23` | owner_id or member `(business_id,user_id)` with role owner/admin. Membership role/identity and owner assignment are mutable; not browser metadata authority. |
| locations/services/staff; relationship migration `20260922050000_issue_81_stage_1b_relationship_booking_convergence.sql` | Tenant-stable parents; primary location OR service_locations/staff_locations mappings; staff_services qualification. Preserve these rules, not an invented single-location-only staff rule. |
| `staff_services.price_override`, `staff_services.duration_override_minutes` | `024_services_module.sql:75`: nullable numeric(10,2) price override; `025_employees_module.sql:124`: nullable integer duration override. `services.price` is numeric(10,2), `001_booking_engine.sql:24`. Slot generation in the relationship migration line 338 resolves `coalesce(nullif(ss.duration_override_minutes, 0), s.duration_minutes)`; §I separates new-booking price configuration from frozen existing-appointment amounts. |
| Appointment parent FKs / Business deletion | `001_booking_engine.sql:81–84`: appointments.business_id → businesses.id ON DELETE CASCADE; appointments.customer_id → customers.id ON DELETE RESTRICT. `20260920230358_tenant_identity_gate.sql:24–25` retains authenticated DELETE policy **"Owners delete their businesses"**, using owner_id=auth.uid() or is_business_owner(id). This permits an authorized attempt, not guaranteed deletion through dependent integrity constraints. Existing commerce_booking_operations_business_fk is also RESTRICT (`20261007203352_issue_134_durable_booking_operation.sql:122–124`). See §H/R and D08. |
| `guard_appointment_booking_operation_link_v1()` / `appointments_booking_operation_guard` | Durable migration lines 334–475 / 2620. INVOKER, service-only linked writes, exact original INSERT tuple, blanket maintenance restrictions. Existing trigger INSERT or listed-column UPDATE; lacks DELETE and operational_revision. |
| `guard_commerce_booking_operation_v1()` / `commerce_booking_operations_guard` | Immutable request plus CLOSED cannot reopen; currently mutable close metadata is not a reusable mutation capability. |
| `public.close_booking_operation_v1(uuid,uuid,uuid,text,uuid,uuid,boolean)` | Durable migration lines 1624–1854. INVOKER/service-only/original actor. Returns outcome/operation_id/appointment_id/attempt_id/recorded. Five close reasons; preserves terminal attempt money. |
| Bootstrap/persist/bind/commit/read v1 | Same durable migration functions; preserve wire identity and money algorithms. `persist_booking_operation_appointment_v1` inserts parent then complete supplied admitted resources in one subtransaction; duplicate exception rolls back that subtransaction. |
| `validate_appointment_slot(uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid)` | Relationship migration lines 709–919: returns void, LANGUAGE plpgsql, **STABLE**, **SECURITY DEFINER**, **search_path=public**. Existing privileged read validator; sixth UUID argument excludes this appointment, seventh UUID explicitly selects the tenant-validated Location. Owner, EXECUTE grants, resolved dependencies/body hashes and no-write behavior require future catalog verification, not an assumed owner name. Preserve its existing identity/body/volatility/privileges; no new write or bypass path. Use after locks per §M/N; not for unchanged historical notes/status or canonical recovery. It calls get_available_slots but does not itself assert exact end-minus-start equality to the effective staff duration; §I adds that explicit lifecycle pairing check without rewriting this validator. |
| Existing projection functions | `20261008210359_issue_133_payment_projection_observability.sql`: `payment_appointment_truth_v1`, `project_payment_obligation_v1`; current commercial basis and ledger/refund evidence, four obligations. No lifecycle call into projector inside a transaction. |
| Existing triggers | `appointments_updated_at` BEFORE UPDATE invokes `set_updated_at`; financial table guards and FK triggers remain. Existing named-staff exclusion constraint remains authoritative for its supported overlap case. |
| Application boundaries | `lib/actions/appointments.ts`; engine mutations create/update/cancel/reschedule/resize; `lib/commerce/booking-operations/kernel.ts`; `lib/commerce/operator-financial-state.ts`; `lib/commerce/financial-aggregate/reader.ts`; `lib/booking-engine/events/emit.ts`. No application change in D1. |

Before future authoring/apply: verify every referenced column type/nullability, existing guard/function signature/body hash, FK key order/action/validation/deferrability, exclusion predicate, trigger enabled state, relation kind and exact ACL. No blind IF NOT EXISTS reconciliation. Existing/mismatched proposed names, partitions, unexpected rules/triggers or unexpected ownership require STOP. Historical source-to-hosted timestamps in the environment manifest are not instructions to reapply anything.

## B. Proposed new object identities

| Identity | Specification |
| --- | --- |
| `public.appointments.operational_revision` | bigint, non-null, default 0; `appointments_operational_revision_check`: nonnegative. Existing rows read as revision 0; no audit fabrication or rewrite of original columns. |
| `booking_lifecycle_private` | New non-API schema, owned by the governed migration owner (expected postgres), never exposed in PostgREST; no new database role. Collision abort. |
| `booking_lifecycle_private.appointment_mutations` | One private append-only journal/permit, §D. No second permit/outbox table. |
| Five public v2 RPC functions | Exact notation in §C; no overloads or defaults. |
| `booking_lifecycle_private.guard_appointment_mutation_v2()` → trigger | Validate INSERT and reject UPDATE/DELETE; journal trigger `appointment_mutations_guard`, BEFORE INSERT/UPDATE/DELETE. |
| `booking_lifecycle_private.guard_appointment_resource_v2()` → trigger | Child guard, §J; trigger `appointment_resources_lifecycle_guard`, BEFORE INSERT/UPDATE/DELETE. |
| `booking_lifecycle_private.close_operation_lifecycle_v2(...)` | Shared v1/v2 fenced close implementation, exact notation in §K. Private invoker helper, service-only; not a generic patch executor. |
| Existing public parent guard + trigger | Narrow replacement, §G/H/Q; existing function identity retained. |
| Existing public close_v1 | Body-only compatible replacement, §K. |

No new enum, role, provider object, payment table, projection schema or general-purpose patch RPC. Functions use fully qualified relations, types and helper names, pinned `pg_catalog, pg_temp`, no dynamic identifiers/SQL. New functions and replacements remain SECURITY INVOKER. Trigger functions rely on their actual invoking principal; special legacy branches precede the service-only maintenance branch.

## C. Exact RPC signatures and result contract

Notation: `?` means explicitly nullable value, not an optional argument. No argument defaults. Every H occurrence expands in this order:
`p_business_id:uuid, p_operation_id:uuid, p_appointment_id:uuid, p_actor_id:uuid, p_mutation_id:uuid, p_expected_revision:bigint, p_reason:text`.

| Function | Ordered parameters after H |
| --- | --- |
| `public.transition_booking_appointment_v2(H, ...)` | p_target_status:public.appointment_status, p_correction:boolean |
| `public.revise_booking_schedule_v2(H, ...)` | p_command:text, p_location_id:uuid, p_service_id:uuid, p_staff_id:uuid, p_start_time:timestamptz, p_end_time:timestamptz, p_room_id:uuid?, p_resource_ids:uuid[] |
| `public.revise_booking_notes_v2(H, ...)` | p_notes:text? |
| `public.close_booking_appointment_v2(H, ...)` | p_command:text, p_expected_customer_id:uuid?, p_replacement_customer_id:uuid? |
| `public.read_booking_appointment_mutation_v2(...)` | No H: p_business_id:uuid, p_appointment_id:uuid, p_actor_id:uuid, p_mutation_id:uuid |

All five return exactly one bounded record with these ordered fields:
`outcome:text, appointment_id:uuid?, operation_id:uuid?, mutation_id:uuid?, effect_revision:bigint?, current_revision:bigint?, current_status:public.appointment_status?, original_attempt_id:uuid?, recovery_required:boolean`.

Outcome set: APPLIED, REPLAY, NO_CHANGE, STALE_REVISION, CONFLICT, FINANCIAL_REVIEW_REQUIRED, TERMINAL, NOT_AUTHORIZED, PAYMENT_RECOVERY_REQUIRED, UNKNOWN. Read of an absent/unresolvable mutation is UNKNOWN, never a recollection permission. NOT_AUTHORIZED returns null identifiers/revisions/status, recovery_required=true; no existence or tenant leakage. UNKNOWN carries only previously authorized references. APPLIED effect_revision is the written successor; NO_CHANGE has null effect_revision; REPLAY returns the original effect_revision (possibly null) plus **current** revision/status. No notes/reasons, snapshots, global sequence, provider information or raw SQL error reaches the ordinary DTO. The later server adapter independently rereads canonical financial state; this is not a replacement financial aggregate.

Required non-null H fields; nonnegative expected_revision; p_reason trimmed, 1–500 Unicode characters, reject rather than truncate. Notes nullable and at most 10,000 characters. Normalize empty notes to null, preserving `updateBooking`'s existing empty-note behavior; do not trim nonempty note content. Explicit null clears notes. Compare normalized inputs for replay. Oversized existing before-image notes require a named hold rather than silent truncation. Finite timestamps, end>start. Resource array required, null elements rejected, duplicates rejected, canonical sorted UUID order; do not invent a smaller resource-count product limit. Bounds/encoding must be identical in command comparison and application adapter. UUID mutation uniqueness is scoped in §D; mutation is operational identity, never the financial attempt key.

Commands and allowed changes (all also advance revision on an actual effect):

| Command | Exact allowed operational fields |
| --- | --- |
| STATUS (transition RPC) | status; target cannot cancelled/scheduled. Forward workflow follows `businesses.appointment_status_workflow`, filtered to valid current statuses with the fallback in `lib/types/booking.ts::resolveAppointmentStatusWorkflow`; pending→confirmed remains explicit confirmation; explicit correction+reason for backward/mistaken completed/no_show transitions. cancelled never reopens. No collection/no-show fee. |
| NOTES | notes only, including cancelled and structurally coherent unresolved-money appointments |
| RESCHEDULE | start_time/end_time only; all supplied assignments must equal locked current tuple |
| RESIZE | end_time only; start and assignments equal current tuple |
| REASSIGN_STAFF | staff_id plus explicitly operator-selected start_time/end_time; unchanged Location/service/room/resources. A different staff price_override alone never reprices or invalidates the agreed amounts. Validate effective staff-service duration under §I; refuse an invalid unchanged interval, permit an explicitly requested valid coupled tuple, never silently resize/shift. |
| REASSIGN_LOCATION | location_id/staff_id/room_id/start_time/end_time/resource set; service unchanged; validate whole desired assignment |
| RESOURCES | room_id/resource set only |
| SERVICE_CORRECTION | service_id/staff_id/start_time/end_time/resource set/room_id; Location unchanged. Preserve frozen amounts and original purchase evidence; conservative service-level compatibility uses exact numeric(10,2) services.price comparison, not implicit cents conversion. Incompatible service/tax/deposit/package → FINANCIAL_REVIEW_REQUIRED. Validate explicit tuple against effective staff-service duration under §I. |
| CANCEL | status→cancelled and canonical operation/attempt fence; no resource deletion |
| REASSIGN_CUSTOMER | customer_id only plus canonical fence; exact expected current customer, §I |

CANCEL requires both customer arguments null. REASSIGN_CUSTOMER requires both non-null and p_cancel equivalence inside helper. Unknown command or extraneous changed field fails before any journal insertion. No arbitrary JSON patch, monetary inputs, customer creation, room reservation engine or null-staff enablement.

### N2 — exact nomenclature and bounded UNKNOWN/HOLD (K-3, K-4, K-7)

The existing SQL `close_booking_operation_v1` outcome **RECOVERY_REQUIRED** means the PRICING_CHANGED/SLOT_CONFLICT/OPERATOR_ABANDONED no-appointment fence cannot be taken because an appointment/history already exists. Preserve that wire value and its recorded field; it is not synonymous with absent/unrecorded payment and is not a new client enum. Phase 0 matrix S's recovery wording is read subject to this bounded evidence contract.

Four financial evidence axes must remain distinct:

| Axis | Required evidence | Existing operation reader scope |
| --- | --- | --- |
| A | Transactions associated with the original payment_attempt_id | `read_booking_operations_v1` mode `one` joins ledger rows through the original attempt, scoped to its Business; this is attempt-scoped evidence, subject to visibility/coherence checks. |
| B | All transactions associated with the appointment, including independent later attempts and legacy history | Not established by the original-attempt ledger_count. |
| C | Refunds directly associated with the appointment | Not returned by read_v1. |
| D | Refunds linked through transactions associated with the appointment | Not returned by read_v1. |

**Zero money recorded against the original booking-operation attempt does not mean the appointment has zero collected money.** It proves neither unpaid/uncollected status, outstanding balance, a new customer debt, absence of later independent payments/refunds nor permission to recollect. Incomplete, hidden, bounded or contradictory evidence cannot become EXACT. Keep EXACT / HELD / UNKNOWN separate from operational-save and synchronization outcomes (§R).

An eventual trusted attempt-scoped witness must establish exactly one original attempt; coherent SKIPPED or FAILED terminal history and valid event sequence; appropriate DO_NOT_RETRY and resolved timestamp; correct original-attempt ledger count; no original-attempt reconciliation contradiction; valid tenant/operation/appointment binding; and the correct CLOSED / CUSTOMER_REASSIGNED history where applicable. Missing or inconsistent evidence fails closed. These facts establish original-attempt truth only, never a completed appointment aggregate. A reader's zero count alone does not certify full visibility or these other predicates.

Even with coherent terminal original-attempt evidence, the exceptional overall operator recovery remains **UNKNOWN / HOLD** until complete trusted appointment-scoped evidence is available through separately accepted A1/A2. No new payment identity, automatic charge, second collection, auto-generated invoice/receipt, worker, customer/business communication or UNKNOWN-to-zero conversion follows. Existing source NOT_RECORDED labels remain scoped to their attempt; they are not renamed in SQL and are not evidence that the appointment is unpaid.

Future trusted normalization must distinguish recorded original-attempt evidence (and its obligation state), coherent terminal original-attempt evidence, unresolved original attempt, and missing/contradictory/authority-limited evidence. It must compose complete authorized appointment evidence before claiming whole-appointment financial truth; no precise automatic recovery is promised now. SQL errors 40001/40P01/55P03/57014 or lost HTTP responses cannot establish terminal no-money by spelling alone. The v2 result may use PAYMENT_RECOVERY_REQUIRED only where authoritative structural/attempt predicates certify that unresolved case; otherwise UNKNOWN. A successful fenced cancellation or operational save does not clear financial HOLD.

### Original actor and team-admin visibility (K-4)

`read_booking_operations_v1` mode `one` filters `operation.actor_id = p_actor_id` after current Business authority validation. A different authorized owner/admin can receive `found:false`; that is not proof of operation absence. `commit_booking_operation_manual_payment_v1` also returns UNKNOWN for a non-original actor before terminal classification. That result identifies neither absent money nor which financial condition failed. Ordinary owner/admin appointment-maintenance authority does not confer the original actor's financial recovery identity. Never impersonate/substitute the creator's actor ID or broaden v1 EXECUTE permissions to make a read succeed.

Existing `read_payment_observability_v1` is service-role-only infrastructure authorizing a currently valid Business owner/admin without requiring that caller to be the original booking actor. Its internal `binding_valid` and `appointment_valid` conditions affect `operator_state` but **are not exported JSON properties**. Do not invent DTO fields or external-payload assertions for them; UNKNOWN is not a unique diagnosis of either condition. A corrected appointment customer can make the internal appointment check false, so this reader is not an automatic recovery workaround. It returns attempt-level evidence, not complete appointment transactions/refunds. For another authorized actor, `attempt_key` is null by existing source; preserve that privacy boundary.

The following is a **future application/server conceptual model only**, not an implemented enum or change to §C's v2 SQL result vocabulary:

| Concept | Scope and boundary |
| --- | --- |
| RECORDED | Only with canonical evidence; identify the recorded attempt/transaction, never infer complete appointment balance from it. |
| TERMINAL_NO_MONEY_ON_ORIGINAL_ATTEMPT | Strictly attempt-scoped; never says the appointment is unpaid. |
| UNKNOWN_HOLD | Default for incomplete, contradictory or insufficiently visible evidence; no payment action. |
| OPERATION_RECOVERY_NOT_AVAILABLE_TO_THIS_ACTOR | Authority/visibility limitation; not absence or no payment. |

Customer-facing mappings and trusted composition require separate A1/A2 review/implementation/acceptance. Existing TypeScript `parseCanonicalPayload` maps `found:false` to ABSENT and some attempt terminal evidence to NOT_RECORDED; this addendum does not change it or claim it implements the future model. That existing mapping must not be reused as proof of absence or appointment-level zero in the exceptional path.

## D. Journal structure and constraints

`booking_lifecycle_private.appointment_mutations` columns:

| Columns | Type / value contract |
| --- | --- |
| business_id, appointment_id, operation_id, mutation_id, actor_id, original_attempt_id | uuid, all non-null; actor is the actual editor, original attempt is read under lock |
| origin | text, V2 or V1_CLOSE |
| command | text, exact command set in §C |
| transaction_id | xid8, non-null, assigned from pg_catalog.pg_current_xact_id() by the trusted routine; compare to that function inside guards, never xmin/backend PID/time/GUC |
| expected_revision, observed_revision, result_revision | bigint non-null, nonnegative; new successful/no-op command requires expected=observed; old replay bypasses stale comparison only after full original tuple comparison |
| effect_revision | bigint nullable; APPLIED equals result_revision; NO_CHANGE null |
| outcome | text restricted APPLIED / NO_CHANGE, not a pending/failure queue |
| reason | bounded text as §C |
| request | jsonb exact normalized command tuple, internally assembled, never arbitrary RPC input; includes H, command-specific inputs and origin |
| before_image, after_image | jsonb exact keys/types defined below; internally constructed from locked row/desired result |
| before_resource_ids, after_resource_ids | uuid[] non-null, sorted unique, no nulls |
| allowed_fields | text[] sorted unique; exactly the command allowlist actually changed, plus operational_revision for effects; NO_CHANGE empty |
| created_at | timestamptz non-null, transaction timestamp, finite, database-assigned |

Image keys: id, business_id, booking_operation_id, customer_id, location_id, service_id, staff_id, start_time, end_time, status, notes, room_id, price_cents, tax_cents, deposit_cents, operational_revision. UUIDs use lowercase canonical text, status its enum label, timestamps UTC ISO-8601 text with six fractional digits and Z (independent of session TimeZone/DateStyle), integers JSON numbers; comparison reconstructs the same object from actual OLD/NEW, preserving JSON null versus missing keys. For allowed_fields use the exact parent column names plus the virtual name `resource_ids` for a changed child set; this virtual field is matched against the two resource arrays, not an invented appointment column. A pure resource effect has allowed_fields resource_ids and operational_revision (and room_id only when actually changed). No contact details, original request payload, payment note, provider token or whole-row to_jsonb capture. Projection caches and updated_at are intentionally excluded and checked separately for no change during a lifecycle write.

Constraint identities and behavior:
- `appointment_mutations_pkey`: (business_id,appointment_id,mutation_id).
- `appointment_mutations_effect_key`: unique (business_id,appointment_id,effect_revision) where effect_revision non-null.
- `appointment_mutations_business_fk`: business_id → businesses.id, RESTRICT.
- `appointment_mutations_appointment_fk`: (appointment_id,business_id) → appointments(id,business_id), RESTRICT.
- `appointment_mutations_operation_fk`: (operation_id,business_id) → commerce_booking_operations(id,business_id), RESTRICT.
- `appointment_mutations_attempt_fk`: (original_attempt_id,business_id) → commerce_payment_attempts(id,business_id), RESTRICT.
- No actor FK that deletes/rewrites historic actor identity on Auth deletion; UUID plus insertion-time authority check is retained evidence.
- `appointment_mutations_revision_check`: APPLIED: expected=observed, result=observed+1, effect=result; NO_CHANGE: expected=observed=result, effect null, images and resource sets identical, allowed_fields empty.
- `appointment_mutations_shape_check`: exact origin/command/outcome vocabulary, object/array types, reason/notes/time constraints. Guard validates exact keys, actual preimage, same-operation linkage and actual changed-field set; a JSON type check alone is insufficient.
- `appointment_mutations_transaction_idx`: (transaction_id,business_id,appointment_id,observed_revision), bounded permit lookup; no identity sequence/global counter.

UPDATE/DELETE refused even for service_role; no truncate privilege to API roles. INSERT guard repeats actual actor/tenant/link, transaction and revision checks; NO_CHANGE row cannot authorize DML. Failed commands append no success row. One new v2 no-op key creates one NO_CHANGE row; replay creates zero. Same mutation key with different actor/command/tuple returns CONFLICT with zero writes. New mutations in the same transaction require new keys and successive observed revisions; record full tuples as well as any optional diagnostic digest, never authorize by digest alone.

Journal privacy: schema not API-exposed, service-only bounded reads through authorized RPC, no browser table access. Notes/reasons are sensitive retained operational evidence. Retain alongside the protected appointment; no cleanup/TTL, customer-contact duplication or external analytics export in this amendment. A future deletion/redaction/retention policy requires a separate governed design; never silently remove replay identity. Export only authorized bounded identifiers/results, not images.

## E. Strict revision successor — N1

Initial revision is exactly 0 for all existing/new appointments. Linked INSERT rejects a supplied nonzero revision. For every actual linked operational effect the parent guard requires **NEW.operational_revision = OLD.operational_revision + 1**, matching the APPLIED journal row, before/after images and effect uniqueness. Max-bigint revision refuses further effects rather than overflowing. Merely increasing/nondecreasing is insufficient.

No-op and replay leave revision unchanged. Projection-only cache writes leave it unchanged. Unlinked legacy writes leave revision at 0 and cannot adopt an operation link. A direct revision-only bump/reset/skip without the corresponding valid resource-only or parent effect is rejected. Old journal rows have the wrong transaction or pre-revision and cannot authorize a later write. After one R→R+1 effect, that row can no longer match OLD; there is no consumed flag or reusable closed-operation credential.

## F. Journal-as-permit execution protocol

One trusted RPC transaction performs, in order:
1. Literal service-role entry, typed input validation, current authority locks (§N), operation advisory and original attempt/appointment/operation locks (§M). Fresh decision reads after waits.
2. Authorize exact operation/appointment/Business and actor; find same mutation key. Same full request returns original effect plus current state with no writes. Differing request rejects. Only then compare expected revision.
3. Validate terminal/financial eligibility and proposed tuple; obtain exact current child set. A true no-op inserts one NO_CHANGE record and returns; no fence is silently performed under NO_CHANGE.
4. Construct before/after image and finite child deltas; append APPLIED journal row with this transaction's xid8. For close, fence metadata and eligible REQUESTED attempt within the same transaction using §K.
5. Delete only before-minus-after resource rows in UUID order; insert only after-minus-before in UUID order. Do not touch intersection rows. Each trigger checks current revision R and the exact row delta under the same permit.
6. Perform exactly one parent update to R+1, including for pure resource change. Parent guard matches all identities, actor authority, transaction, command, exact actual OLD/NEW, allowed changes and terminal/history checks. No UUID/GUC selects a permit by itself. Require exactly one matching permit.
7. Assert persisted parent image/revision and complete resource set equal the expected after-state; verify operation/attempt fence and unchanged commercial/financial identity. Any mismatch raises and rolls back all command writes; never return APPLIED from a caught partial-effect exception.

This is one journal/permit, no extra audit insert and no outbox. Resource PK plus disjoint permitted deltas prevents reinsert/delete churn; revision advancement closes the child-write window. Single-row guards deliberately do not assert the eventual complete set while it is being built. The final whole-set assertion is mandatory in the RPC. It is not a promise against a compromised service credential fabricating a journal and issuing arbitrary SQL: service_role is the existing trusted server writer, not an untrusted browser role. Direct service DML without a valid permit is nevertheless rejected. Never broaden this trust to authenticated or anon.

## G. Parent guard amendment

Replace only the body of `public.guard_appointment_booking_operation_link_v1()` and its event definition. Keep INVOKER and pinned search_path. Parent trigger observes INSERT; DELETE; and UPDATE naming id, business_id, booking_operation_id, customer_id, location_id, service_id, staff_id, start_time, end_time, status, notes, room_id, price_cents, tax_cents, deposit_cents, operational_revision.

Branch order:
- DELETE: §H before any literal service-role check, so upstream RI owner execution cannot bypass linked retention.
- Unlinked INSERT: revision must 0, then preserve legacy behavior. Unlinked→unlinked UPDATE: revision must remain 0; preserve legacy session/RLS behavior.
- Linked INSERT: preserve exact existing admitted OPEN operation/Business/customer/commercial/schedule/package-note match; require revision 0. No lifecycle journal entry needed for original creation.
- UPDATE: linking/unlinking/reparenting or changing id/Business is forbidden. Linked guarded no-change statements may return unchanged without a permit only if every guarded value is identical; changed lifecycle fields require literal service_role and §F. A changed cache alongside a lifecycle command is forbidden; timestamps may only follow existing set_updated_at behavior.
- customer change repeats §I fresh history check; cancellation requires exact CANCEL permit plus APPOINTMENT_CANCELLED metadata. All commercial fields remain unchanged for lifecycle edits. Original operation/customer/tender/attempt data never rewritten to match current row.

Keep cache-only projection updates outside this column-specific trigger so existing projectors do not require operational permits. No all-columns trigger that accidentally gates ordinary cache convergence. If another BEFORE trigger can alter protected fields without these UPDATE targets, catalog preflight must fail for review; no undocumented trigger path may bypass the contract.

## H. Linked DELETE prohibition

Every OLD row with non-null booking_operation_id raises the retained-history refusal before deletion, regardless of service/owner/admin/current_user, OPEN/unbound/SKIPPED/ACCEPTED/CLOSED or journal. No delete RPC or delete permit. The Business FK is ON DELETE CASCADE; a Business DELETE that reaches a linked appointment must be refused by this parent guard and roll back the entire statement. The customer FK is ON DELETE RESTRICT, **not a customer-to-appointment cascade**. Preserve that restriction, all downstream RESTRICT/attribution FKs and all retained history; no detach/delete escape.

The existing authenticated **"Owners delete their businesses"** policy authorizes eligible owner/admin deletion attempts (§A); it does not override retention. Do not promise that this pathway continues to succeed for a Business with linked appointments. Existing Business→operation RESTRICT protection can also reject first, depending on actual RI-trigger order; record the actual refusal rather than attributing every rejection to the new parent guard. D08 must separately establish cascade-guard coverage without disabling or weakening real constraints. This is an intentional integrity boundary with the offboarding implication in §R.

Legacy unlinked DELETE remains governed by existing RLS/FKs and financial-retention guards. This is a DELETE guarantee, not a promise that row triggers protect TRUNCATE, DDL, disabled triggers or a privileged administrator. Catalog/privilege prerequisites in §O/J must exclude those alternate capabilities from operational/API callers before activation; this amendment does not implement a general #153 permission cutover.

## I. Customer, financial and commercially neutral correction

### Historical admission invariants and their limits (K-2)

Source-level chain in the unchanged durable migration: (1) linked appointment INSERT must match the admitted operation customer; (2) `guard_commerce_booking_operation_v1` protects the original operation customer as immutable request evidence; (3) actual linked appointment customer change requires CLOSED / CUSTOMER_REASSIGNED and replacement_customer_id matching the new customer at update admission. The foundation attempt guard separately preserves original attempt customer identity. These are admission-time source invariants, not proof of immutable replacement metadata forever.

The existing `read_booking_operations_v1` mode `one` payload exposes neither `operation.replacement_customer_id` nor `appointment.customer_id`. Do not infer either value from the payload or invent a field. A later privileged replacement_customer_id-only change is not excluded by the operation immutable-request field list; subject to existing constraints, it is a bounded **unproven audit-fidelity concern**, not an observed runtime event. Characterize it later without weakening constraints. No operation-guard change is authorized here; stale close metadata remains insufficient lifecycle authority.

Historical `close_booking_operation_v1` refuses CUSTOMER_REASSIGNED when it observes transactions associated with that appointment in the Business. That protects observed already-recorded appointment money at correction time; it is not an all-time assertion of zero history, a substitute for the stronger future unfiltered/refund checks below, or proof that an independent later payment can never be recorded. Later independent payments belong to current appointment truth and require separate appointment-scoped evidence. Never reattribute earlier financial history.

### Future lifecycle correction requirements — unchanged

Actual customer change requires FOR UPDATE parent, fresh matching journal, exact expected customer, destination same Business, noncancelled state and all-history absence at **both** RPC decision and actual parent guard. Check unfiltered-by-Business/status/kind/date existence of transactions whose appointment_id is this appointment; refund rows whose appointment_id is this appointment; and refund rows whose transaction_id links through those transactions. Any linked foreign row is a contradiction and veto, with no foreign payload disclosure. An original attempt marked ACCEPTED, terminal/ledger mismatch, failed visibility or incomplete evidence also vetoes. Never call a refund zero or subtract it away to permit reassignment. Retain composite attribution FK as the concurrent insert barrier.

A valid change fences the original attempt/operation and only changes current appointment customer. Repeated no-history corrections may update close_reason/replacement_customer_id using a fresh key/revision/history check; preserve first closed_at. Stale CLOSED metadata is never authority. Any later ledger history blocks further correction. A competing independent ledger insertion either wins before the check and forbids correction, or conflicts with the key change and must fail/revalidate its old customer; no money follows the new customer silently.

Notes/status may operate while original payment is unresolved if structural identity is coherent; their success does not clear payment HOLD. Scheduling/staff/Location/resource/service correction requires original attempt terminal and safely bound, or a coherent permanently fenced terminal zero-money operation. No original commit should still be executable. Completed/no_show correction is explicit; cancelled remains notes-only. Projection failure alone does not prohibit an otherwise safe neutral edit.

**Existing appointment commercial amounts are frozen for ordinary lifecycle edits.** Preserve appointment.price_cents, tax_cents and deposit_cents, original booking-operation commercial/request/package evidence, collected ledger transactions, original payment attempt/tender history, and invoice/receipt identities. Staff price overrides are configuration inputs for applicable **new bookings**, not authority to replace an already-admitted agreement. For REASSIGN_STAFF, a different `staff_services.price_override` alone neither reprices nor financially invalidates the original agreement. Do not run a new booking-price calculation because staff_id changes; do not automatically collect/refund money, rewrite service/package purchase evidence or reopen an attempt. This rule does not authorize any new booking at an overridden price or change existing creation pricing.

SERVICE_CORRECTION retains conservative service-level compatibility: compare current and desired `services.price` as exact **numeric(10,2)** values, with no implicit numeric-to-cents conversion, plus tax_rate_bps and deposit_cents/deposit_required and established package meaning. Preserve agreed amounts even when an eligible current operational service changes; equal configuration is necessary, not proof that historical invoices/receipts or every package are interchangeable. Incompatible or malformed/ambiguous commercial/service/tax/deposit/package evidence returns **FINANCIAL_REVIEW_REQUIRED**. An operation carrying a package cannot silently switch to an unrelated component; reject absent established package compatibility. Location moves remain same-Business and preserve agreement/currency; known different tax/commercial context holds for financial review. Never derive historical tender from the new Location or rewrite generic invoice lines. Amount/document adjustments remain a separately governed design.

**Staff duration is operational validation, not repricing.** After §M authority/operation/catalog locks, reread the authoritative same-Business service/staff and qualified staff_services pair. Effective slot-generation duration is `coalesce(nullif(staff_services.duration_override_minutes, 0), services.duration_minutes)` (relationship migration line 338); null/zero override uses service duration. `lib/booking-engine/availability/compose.ts:264–280` separately uses a positive override and rejects effective durations below five minutes. Do not claim the paths agree for malformed negative overrides: contradictory/invalid configuration fails closed, never silently falls back to justify a lifecycle edit. For REASSIGN_STAFF and SERVICE_CORRECTION (also REASSIGN_LOCATION when changing staff), require the explicitly proposed start/end elapsed interval to equal the selected pair's valid effective duration, as well as the existing validator's scheduling rules. Its successful return alone is not an exact-duration assertion. RESCHEDULE/RESIZE keep their explicitly requested operational roles; this correction is not a new global ban on deliberate resize.

Preserve existing primary-or-mapped Location qualification and staff-service eligibility, named-staff overlap/exclusions, service/staff maximum before/after buffers, service cleanup, hours/closures/time off, applicable notice/booking-window limits and supported availability behavior. Resolve calendar timezone from Location/Business and retain the engine's timezone/DST and slot alignment rules; compare instants without silently normalizing the operator's selected time. Buffers/cleanup protect surrounding availability; they are not silently added to the customer-visible appointment duration. Use existing exclusion/daily-limit behavior for maintenance, not invented new-create restrictions.

**NO SILENT TIME CHANGE:** a changed duration never auto-resizes, shifts start/end or chooses another slot. Refuse an unchanged interval that is invalid for the replacement pairing. An explicit operator-selected valid coupled staff/service/start/end tuple may proceed only as one authorized, validated and journaled command on the same appointment; otherwise return safe CONFLICT/validation refusal before any journal/resource/parent effect. A separately requested governed reschedule/resize remains explicit and must not conceal an invalid coupled reassignment. Missing, unavailable, contradictory or foreign assignment evidence fails closed. All original financial evidence remains unchanged and no payment is collected again.

## J. Resource-child guard and N3 cascade resolution

### Ordinary and original-create paths

`guard_appointment_resource_v2()` is INVOKER; derive Business only from the parent. INSERT inspects NEW parent; DELETE inspects OLD; UPDATE inspects both. Linked child UPDATE (including reparenting into/out of linked parent) always refuses. A confirmed unlinked parent on every relevant side preserves legacy DML and existing RLS/FKs. For maintenance, room_id must identify an active same-Business room and each desired resource an active same-Business resource, with location_id either null (shared) or the desired appointment Location; do not treat resource capacity as a new hard reservation rule. Missing or RLS-hidden parents are not classified as unlinked.

For a linked existing parent, require literal service_role. Original INSERT is allowed only when parent revision=0, its operation is OPEN, the parent exactly matches original admitted tuple and NEW.resource_id belongs to the admitted sorted resource set, with the same Business/active-resource checks already performed by original persist (room type is checked for the separate room_id). Do not silently impose a new initial-create Location rule in this compatibility branch. This supports empty/one/multiple initial resources; no early whole-set assertion. No original-create permission for DELETE/UPDATE. Original persist already inserts the entire set transactionally; prove exact set and rollback without changing that algorithm.

Maintenance INSERT/DELETE requires the matching current-transaction APPLIED journal at revision R, correct command, and exact delta membership. Child guard authorization reads of operation/journal/resources are non-locking; it may acquire/reuse only parent FOR NO KEY UPDATE. It must not later take operation advisory/attempt/operation row locks, resource row locks or upgrade ordinary maintenance to FOR UPDATE. RPC already owns required target locks. Parent final revision bump plus final set assertion closes the command.

### Physically absent OLD parent: paired-invariant DELETE branch

Freeze this limited legacy cleanup exception; do not claim an unforgeable “cascade token” exists:
1. It applies only to child DELETE. INSERT/UPDATE with any missing parent fail closed.
2. The effective current_user must be a verified full-visibility role for the parent (superuser or effective BYPASSRLS, with SELECT). Missing rows under an ordinary RLS principal are UNKNOWN, not physical absence. No privilege escalation/helper is added for this read.
3. An actual parent lookup under that principal returns absent. Catching an ACL/RLS error and treating it as absent is forbidden.
4. Required deployment invariants: validated immediate CASCADE FK, no preexisting orphans, enabled parent DELETE protection, immutable linked ID/Business/link, enabled child guards, trusted schema owners and no operational ability to disable triggers or bypass integrity.
5. Under those invariants a physically deleted parent could only have been unlinked: a linked parent would have raised before deletion. Therefore return OLD for this DELETE without requiring literal service_role or a journal. This is an inference from paired invariants, not identity-based permission to delete a still-present linked child's row.

The branch also safely handles a direct deletion of a child left within the same legitimate legacy parent-delete statement/transaction; it does not need to distinguish that call from RI. Orphans created by privileged integrity bypass are outside the invariant and must block deployment, not be silently cleaned by the application. Parent RLS-hidden direct calls fail; service-role calls with a still-present linked parent enter the strict permit branch.

### RI principal and integrity capabilities

PostgreSQL 17 `RI_FKey_cascade_del` invokes `ri_PerformCheck` with the FK relation as query target. That routine switches effective UID to the **child relation owner** with local-user/no-force-RLS security context, executes the SPI DELETE, then restores UID. An INVOKER child trigger therefore sees that owner as current_user, not necessarily the original authenticated caller or service_role. This source fact explains why the exception must precede the service-role branch. Require the actual child owner also has full parent visibility and SELECT independently: **SECURITY_NOFORCE_RLS does not grant visibility into unrelated parent relations**; ownership of the child alone does not prove parent visibility. [PostgreSQL 17 RI source](https://raw.githubusercontent.com/postgres/postgres/REL_17_STABLE/src/backend/utils/adt/ri_triggers.c) (`RI_FKey_cascade_del`, `ri_PerformCheck`); [PG17 relation-specific RLS decision](https://raw.githubusercontent.com/postgres/postgres/REL_17_STABLE/src/backend/utils/misc/rls.c) (`check_enable_rls`, owner check before InNoForceRLSOperation).

`session_replication_role=replica` can suppress ordinary triggers/FKs; changing it requires superuser or parameter SET privilege. BYPASSRLS alone does **not** grant SET or table-owner DDL. Source inspection found no repository grant of SET on that parameter, but absence from migrations is not live privilege proof. **service_role inability to change it is a required future catalog and execution assertion, NOT a hosted fact established by D1.** Check superuser flag, direct/PUBLIC/inherited parameter ACLs, SET ROLE paths, SECURITY DEFINER wrappers and ownership/membership capable of disabling triggers or altering relations. anon/authenticated must likewise have no such path. Pre-existing TRUNCATE/trigger-DDL capabilities that defeat these invariants block activation and go to the separate security gate; do not silently revoke them here. [PG17 session defaults](https://www.postgresql.org/docs/17/runtime-config-client.html#GUC-SESSION-REPLICATION-ROLE), [PG17 ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html).

Future amendment enables its paired parent/child/journal guards ALWAYS as defense in depth; it does not change RI trigger definitions or grant parameter privileges. ALWAYS guards do not compensate for a compromised owner or missing FK integrity. pg_trigger_depth(), client GUCs, JWT claims, a guessed owner name or an RLS-empty SELECT are never authority. Required local proofs observe current_user in synthetic instrumentation and remove that instrumentation before final catalog assertions. With these explicit conditions the paired-invariant contract is implementable; hosted capability evidence and real execution remain separate blocking apply/activation gates.

## K. Existing v1 close compatibility

Preserve exact public signature from §A and return field order/types. V1 still requires original actor and current owner/admin authority; v2 team maintenance does not relax original financial recovery/commit authorization.

Private helper notation:
`booking_lifecycle_private.close_operation_lifecycle_v2(p_business_id:uuid,p_operation_id:uuid,p_actor_id:uuid,p_reason:text,p_expected_current_customer_id:uuid?,p_replacement_customer_id:uuid?,p_cancel:boolean,p_mutation_id:uuid?,p_expected_revision:bigint?,p_expected_appointment_id:uuid?,p_audit_reason:text,p_compatibility_v1:boolean)`.
Result: the five original v1 result fields followed by `mutation_id:uuid?, effect_revision:bigint?, current_revision:bigint?, current_status:public.appointment_status?, lifecycle_outcome:text`. V1 projects only its original five fields. V2 maps lifecycle_outcome to §C. Literal service-role entry and full authorization inside helper; compatibility=true additionally requires original actor, never permits impersonation. No generic close reason/column patch.

V1 passes null mutation/revision/expected-appointment, its bounded machine reason as audit reason, and compatibility=true; helper obtains current revision under K and generates a DB UUID only for a new actual effect, origin V1_CLOSE. V1 lacks modern optimistic concurrency: expected-current-customer remains mandatory. A repeated already-satisfied v1 close does not create another journal/effect; return existing wire semantics. V2 passes H's exact appointment/key/revision and human audit reason; the helper compares expected appointment to the resolved linked appointment under K before any write, and logs a new-key NO_CHANGE as §D. It is not truthful to promise client-key replay for v1's absent key.

**K-4 authority boundary:** the existing v1 close original-actor check remains, including in the previously allowed future adapter; ordinary v2 owner/admin lifecycle authority is not permission to act as that creator for commit/read recovery. Use the actual authorized actor, preserve actor-limited read semantics and apply §C's HOLD boundary. No close function, EXECUTE grant or financial recovery permission is changed in this documentation task.

Preserve five v1 reasons and outcomes CLOSED / EXISTING / RECOVERY_REQUIRED, all original IDs and recorded truth. No-appointment PRICING_CHANGED/SLOT_CONFLICT/OPERATOR_ABANDONED keeps original safe fence without a journal (there is no appointment). Existing-appointment cancellation uses APPOINTMENT_CANCELLED only. Existing-row pricing/slot/abandon returns RECOVERY_REQUIRED with no effect. Terminal attempt ACCEPTED/FAILED/SKIPPED remains unchanged. Coherent REQUESTED with zero history may become FAILED/DO_NOT_RETRY with the existing FAILED event once; reuse exact failure-class/code mapping. No other payment event/projection insertion.

For linked effects append journal before fence/parent effect and verify all under one transaction. Preserve first closed_at; shared routine permits repeated genuine no-history customer corrections but not reopening. An already-cancelled row qualifies for NO_CHANGE only if the canonical operation/attempt fence is already coherent; inconsistent cancelled/open/requested combinations return UNKNOWN, not a no-op success. V1 EXISTING can historically accompany a new allowed correction on an already-CLOSED operation: preserve that wire distinction while journal records the actual new effect. Do not infer NO_CHANGE from the word EXISTING alone.

## L. Original creation compatibility

Do not replace bootstrap, persist, bind, commit or canonical read bodies/signatures. Original parent INSERT matches admitted immutable tuple and revision0, including package note construction. Initial child INSERT follows §J. Original creation creates zero lifecycle journal rows. Empty/multiple sets must succeed exactly as before; induced child failure leaves no new parent/children. Persist recovery returns its existing appointment without restoring original scheduling fields. Later application canonical-first recovery must read existing appointment before new-create validation; D1 does not implement that adapter.

Binding and original payment commit retain original actor/customer/attempt semantics. Scheduling is disallowed until binding/terminal prerequisites ensure an old request cannot be used to overwrite/recollect. Customer correction closes the original operation, preserving original attempt/customer even when current customer differs; no attempt rebind. **K-1 clarification:** truthful financial replay is not necessarily outcome-label-identical replay. Inherited accepted `commit_booking_operation_manual_payment_v1` compares operation.customer_id, appointment.customer_id and attempt.customer_id before checking terminal evidence. After a legitimate no-history correction, the current appointment customer may differ while both historical customers remain unchanged. The original call can therefore return UNKNOWN / recorded=false before reaching terminal NOT_COMMITTABLE. This specific UNKNOWN branch writes no payment transaction; that is a fact about this invocation, not proof that no money exists elsewhere on the appointment. It authorizes no replacement attempt or collection. Preserve the original function and identities; do not bypass the check or equate recorded=false with appointment-level zero.

This exact inherited post-correction label difference is now an explicitly documented compatibility case for future D12-E, not an instruction to rewrite protected commit code or narrow customer correction. It remains UNKNOWN / HOLD under §C until A1/A2 is implemented and accepted; read_v1 alone does not certify axes B–D. Other incompatible tuple checks/financial contradictions remain blockers for review. No precise recovery adapter is implemented or accepted by this clarification.

## M. Lock graph and per-command strengths

K = exact existing advisory key `hashtextextended('booking-operation:' || operation_id::text, 0)` → original attempt FOR UPDATE → appointment row → operation FOR UPDATE. A pre-lock read may resolve IDs only; eligibility uses fresh reads after waits. Default READ COMMITTED; new lifecycle guards/RPCs needing fresh command snapshots are VOLATILE. **Do not change the existing STABLE slot validator.** Invoke it through a separate fresh database statement within the VOLATILE lifecycle function after all required authority, operation and scheduling/configuration locks have returned, not within the same statement that acquires/waits on those locks. A STABLE function uses its calling statement's snapshot; an earlier result/snapshot must not be reused after a lock wait. A new function call alone does not establish serialization, visibility under stronger isolation, or a universal availability guarantee. D11/C07/C11 must prove post-wait visibility, supported exclusion behavior and bounded failure; repeatable-read/serializable conflicts remain §P. [PG17 function volatility and snapshots](https://www.postgresql.org/docs/17/xfunc-volatility.html).

| Writer | Order and strength |
| --- | --- |
| Original bootstrap | Sorted customer email/phone advisory namespaces already in source → operation advisory → original insertion sequence; unchanged |
| Original persist | operation advisory → original attempt FOR UPDATE → operation FOR UPDATE → new parent and resources; unchanged |
| Bind / original payment commit | operation advisory → original attempt FOR UPDATE → appointment FOR UPDATE → operation FOR UPDATE; unchanged |
| Status/notes/schedule/staff/Location/room/resource/service correction | authority locks §N → K with appointment **FOR NO KEY UPDATE** → command-specific catalog locks → finite child mutations → parent update |
| Customer reassignment | authority → K with appointment **FOR UPDATE** → destination customer FOR SHARE → fresh all-history checks |
| Fenced cancellation with actual effect | authority → K with appointment **FOR UPDATE**, preserve terminal money and single fence |
| Already-cancelled coherent no-change | authority → operation advisory → attempt FOR UPDATE → appointment **FOR NO KEY UPDATE** → operation FOR UPDATE → verify coherent fence; no upgrade needed, no DML except new v2 NO_CHANGE journal |
| Projector | admission FOR SHARE → obligation FOR UPDATE → attempt FOR UPDATE → ledger FOR UPDATE → appointment FOR UPDATE → projection target/sequence; no operation advisory |
| Independent R1a payment | own attempt FOR UPDATE → ledger insert/its FK key-share on appointment (and existing checks); do not pretend it takes original operation advisory |
| Child guard | nonlocking operation/journal/resource reads and at most parent FOR NO KEY UPDATE; no later attempt, operation, advisory or target-row lock |

Cancellation chooses strong versus no-change path after operation advisory/attempt serialization and a fresh nonlocking parent read. If a purported no-change row does not remain coherent after the non-key lock, return UNKNOWN/STALE, do not upgrade late after taking operation. New cancellation takes the strong parent lock before operation. Original functions retain their source locks; v1 no-change may retain legacy strong locking unless the shared adapter demonstrably preserves semantics with the bounded fast path.

The new appointment.operational_revision must not participate in the appointment's referenced UNIQUE/FK keys. Existing referenced keys include ID, ID/Business and ID/Business/customer (§A); ordinary status/notes plus revision bump changes none of them. Catalog/index inspection and C02 must verify the actual update remains non-key, with no hidden key-changing trigger or newly key-bearing revision. Ordinary NOKEY parent locks are compatible with independent FK KEY SHARE, unlike FOR UPDATE. Same-original-attempt commit can still wait on its attempt lock; that is intentional and does not prove the independent-writer property. No lifecycle writer acquires ledger/obligation row locks, locks all later attempts, invokes a projector or makes network calls after K. The journal's FK checks to original operation/attempt reuse already-held rows.

Command catalog locks after K, consistent order: Locations sorted UUID; services sorted UUID; staff sorted UUID; qualifying service_locations, staff_locations, staff_services in that table order and sorted composite key; booking_resources sorted UUID. FOR SHARE prevents retirement/reassignment of selected existing rows during a command, including changes to the selected staff_services price/duration configuration. After those waits, reread effective duration and the explicit tuple under §I before the fresh validator statement; staff price differences alone remain commercially neutral. For a primary-location qualification lock that parent; for mapping qualification lock the chosen actual mapping. Missing evidence is failure, not a lock on an absent row. Current owner/membership locks are before K. Existing administrative relationship writers may still create complex wait graphs; inventory them in proof and enforce bounded timeout rather than claiming global deadlock freedom.

Room/resource soft availability is checked excluding the same appointment with half-open time overlap and noncancelled candidates, under current Booking Engine semantics; this does not serialize two distinct appointments competing for an unconstrained resource. Preserve named-staff exclusion as final supported race guard. No promise of a new universal room-capacity guarantee. [PG17 row lock compatibility](https://www.postgresql.org/docs/17/explicit-locking.html#LOCKING-ROWS).

## N. Tenant and actor authorization

Trusted later server action authenticates session, resolves Business and passes server-derived actor. RPC independently requires literal service_role and current `businesses.owner_id=actor` OR business_members owner/admin. Never trust browser Business, channel, user_metadata or selected staff as authority. No arbitrary staff-role expansion, no GVM exception.

Acquire Business row FOR SHARE before K (prevents owner change/delete); for non-owner authority acquire matching membership FOR SHARE and recheck role/Business/user. If owner path fails, a missing membership means denial, not absence-as-authority. Revocation/delete/update either completes first and denies, or waits until the authorized transaction completes. Observe this linearization in two sessions. Shared authority row locking must remain compatible with original creator reads/FK checks; new anti-deadlock claims require proof. Public read RPC also rechecks current authority, returns no tender/request/journal payload and offers no actor impersonation.

Every appointment, operation, original attempt and destination belongs to resolved Business. Validate all IDs independently, original link immutability, primary-or-mapped Location relationships, active destination service/staff/location/resources and staff-service qualification. Current original paid money does not need active catalog rows for notes/status/recovery. Use the existing STABLE/SECURITY DEFINER slot validator only for desired scheduling via the separate post-lock statement in §M, with sixth argument exclude=this appointment and seventh argument the explicit tenant-validated Location, never a guessed default. Independently enforce §I effective pairing/duration and commercial rules; do not infer duration equality or write authority from validator success. Public online-booking flags are not a new restriction on authenticated operational maintenance.

## O. ACL / RLS / capability contract

| Object / role | Exact intended privilege |
| --- | --- |
| New private schema | Owner governed migration role; service_role USAGE only. PUBLIC/anon/authenticated no USAGE/CREATE. Not API-exposed; no other application-role grant. |
| Journal | RLS enabled, no client policy, no FORCE change needed. Revoke all from PUBLIC/anon/authenticated/service_role then service_role SELECT/INSERT only; no UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER or sequence. Append-only trigger additionally rejects UPDATE/DELETE. |
| New public RPCs / private shared helper | EXECUTE service_role only; explicitly no PUBLIC/anon/authenticated EXECUTE; no overload escape. SECURITY INVOKER, full-qualified, pinned search_path. |
| Trigger functions | No PUBLIC/anon/authenticated EXECUTE; service-role EXECUTE where needed to match source conventions. Trigger invocation is not a public callable mutation API. Legacy trigger branches must not read private journal before deciding their allowed legacy path. |
| Existing parent/resources/financial tables | No broadened grants, policy changes, ownership or FORCE change. Existing required service DML/SELECT must already suffice, including new revision column via existing table UPDATE; if only column grants exist and revision unavailable, STOP for bounded reviewed grant decision rather than adding broad grants. |
| Owners and service role | Expected owners governed postgres/supabase_admin with proven visibility. service_role must be non-superuser, BYPASSRLS, not table/function/schema owner, without owner role escalation or schema CREATE/trigger-disable/parameter-SET route. Unknown capability is not PASS. |

BYPASSRLS is not table ACL, trigger bypass or superuser. Required SELECT must cover appointment/ledger/refund/operation/attempt/catalog/authority truth; hidden foreign-linked refund witnesses cannot become zero. #153 must preserve this boundary, six financial-reader FK hints and exact count. No #153 redesign in this amendment.

Future pre-apply/activation catalog gates must establish actual parameter ACL/membership closure and privileged definer routes; operational roles cannot SET session_replication_role, disable/replace guards, alter/drop guarded tables or TRUNCATE protected relations. A currently broad platform default is a finding, not authorization to silently change it here. Trigger ALWAYS posture alone does not solve TRUNCATE or owner compromise. Required environment hardening, if missing, is a separately governed blocker. D1 does not claim these hosted checks passed.

## P. Transaction and rollback semantics

One RPC transaction contains permit, any operation/attempt fence, finite resource deltas, one parent effect and final assertion. Validation/revision/conflict rejection before journal has zero durable deltas. Effect-time exceptions roll back all this command's writes; no APPLIED row survives without its effect through the trusted RPC. Earlier committed ledger/history survives every lifecycle failure. Serializable/repeatable-read conflict, deadlock, timeout and response loss preserve identities; future adapter reads the same command before retry, never collects again.

Future migration itself is one bounded transaction with 5-second lock_timeout and 30-second statement_timeout established before DDL; future RPC execution environment uses the same bounded ceilings before invoking the statement (do not assume setting statement_timeout midway through a function retroactively bounds the already-running statement). No network work, retries or silent timeout extension. Failed DDL/catalog assertions roll back; a committed operational amendment is not rolled back by deleting journals or restoring the blanket old guard after edits. Recovery is forward reviewed correction with admission held.

## Q. Trigger order and dependency graph

Dependency construction: verify prerequisite shapes/roles (including the unchanged privileged slot validator inventory below) → private schema and revision column/check → journal with tenant FKs/indexes/ACL → journal and child guard functions → shared close and public v2 functions → parent guard replacement → paired trigger definitions/ALWAYS → v1 adapter replacement → final catalog/privilege assertions. All in one future amendment; no committed gap with one side of the pair missing. No changes to prerequisite FK actions, immutable money guards or original function identities.

The existing `public.validate_appointment_slot(uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid)` is a read dependency, **not an amendment target**. Before implementation/apply, inventory exact argument/return types, LANGUAGE plpgsql, STABLE, SECURITY DEFINER, owner, search_path=public, EXECUTE ACL, body hash, resolved relations/functions and their ownership/privileges. Include get_available_slots, resolve_location_id, holiday/vacation and availability_block_reason dependencies, and actual runtime name resolution under the pinned path; catalog dependency records alone do not enumerate every PL/pgSQL body reference. Verify no-write behavior transitively, not merely the STABLE label. An unexpected owner, security mode, search path, body/dependency/grant drift or hidden write/bypass path **STOPs the future SQL gate**. Do not repair it by rewriting the validator, changing its grants or broadening §T. D11 must preserve its pre/post catalog identity and demonstrate separate post-lock statement visibility. No live owner/body/ACL result is claimed here.

Parent `appointments_booking_operation_guard` remains before `appointments_updated_at` alphabetically for the same BEFORE UPDATE event. Guard compares whitelisted values and requires lifecycle code not to touch projection caches; updated_at is existing trigger-managed metadata, not part of permit identity. Parent DELETE refusal precedes RI AFTER actions. Child guard runs BEFORE each row's FK checks/actions; original multi-row insert must not compare an incomplete set with the final desired set. No transition table or pg_trigger_depth authority. Catalog freeze includes all same-table triggers/order/function security modes and rules; unexpected pre/post mutators are blockers. [PG17 trigger ordering](https://www.postgresql.org/docs/17/sql-createtrigger.html).

No guard or SQL function emits application booking events, schedules jobs, sends notifications, or calls providers. Required future end-to-end application proof contains `emitBookingEvent()` before its lazy communications registration, preserves global legacy behavior, and contains outer booking/receipt delivery and cancellation waitlist. D1 SQL proof alone cannot certify unimplemented A1/A2 containment.

## R. Legacy compatibility boundary

Unlinked public, session/dashboard, Summer, API and recurring appointments retain existing RLS/mutations/communications. No adoption/backfill into operations, no rewrite of scheduled historical enum values, no optional employee feature enablement, no change to public booking RPCs. Linked rows reached through those writers still cannot evade the guard; no service-client or legacy fallback after a v2 failure.

**Affected existing Business deletion pathway:** "Owners delete their businesses" remains in force, but retention deliberately prevents success when a cascade reaches a durable-linked appointment. Existing RESTRICT dependencies may already refuse an attempt; do not describe either as a new deletion permission or guarantee. A separate unlinked legacy Business case retains existing policy/FK behavior, which can also refuse for independent dependencies. No unlinking appointments or erasing history to make deletion succeed.

**Business lifecycle — DESIGN FOR NOW / BUILD LATER:** subscription cancellation ends/changes the billing relationship, not tenant data; workspace deactivation restricts operational access while preserving history; tenant offboarding is a governed billing/access/export/support/retention process; permanent data deletion is a separate destructive operation subject to applicable privacy and retention requirements. Financial/audit records remain retained as required by applicable law and approved platform policy; no retention period or legal conclusion is invented here. Revisit launch requirements before commercial self-service cancellation or permanent deletion activation. This distinction authorizes no new offboarding workstream now. GVM Baby World and Chasum HQ remain ordinary tenants under the same rules; Platform Admin remains the separate protected control plane.

Original operation request and original Location/customer/attempt stay immutable even after current operational changes. Financial reporting retains CURRENT_APPOINTMENT_LOCATION semantics; no historical attribution is invented. Cancelled is terminal except notes; cancellation is not refund. EXACT/HELD/UNKNOWN, synchronization status, communication status and operational save result remain separate.

### Appointment payment truth is a separate permanent contract (K-7)

ZERO MONEY RECORDED AGAINST THE ORIGINAL BOOKING-OPERATION ATTEMPT **DOES NOT MEAN THE APPOINTMENT HAS ZERO COLLECTED MONEY**. It establishes neither appointment unpaid/uncollected status, outstanding balance, customer debt, absence of an independent later payment/refund, nor permission to collect again. An independent later manual payment may carry its own payment_attempt_id while remaining attached to the same appointment; characterize constructibility under unchanged constraints in D14-E/G rather than assuming every synthetic combination is valid.

Canonical appointment financial truth requires complete trusted appointment-scoped transactions and both refund-witness axes, with tenant/identity/completeness checks. Cached appointment payment fields are supporting data, never an independent substitute. Preserve EXACT / HELD / UNKNOWN; bounded, hidden, incomplete or contradictory results are not EXACT.

The existing `lib/commerce/financial-aggregate/reader.ts` demonstrates both refund witness joins, explicit FK hints, exact response count, identity checks and fail-closed confidence. It is a bounded, period-scoped Business/customer/Location aggregate rooted in transactions; it is **not** an already-built lifetime appointment recovery composition, and an empty root result alone does not establish standalone refund absence. Future A1/A2 may reuse established trusted service-role reads within current authority, but must prove all appointment evidence and snapshot/completeness semantics. This task creates no SQL reader, grant, permission or payment engine. Until that composition is separately accepted, exceptional recovery stays UNKNOWN / HOLD.

## S. Disposable PostgreSQL 17 delta-proof specification — NOT RUN

Use a fresh isolated PostgreSQL17 instance, recorded version/role model and no hosted credentials/network. Apply a verified dependency fixture followed by the five unchanged prerequisite migrations in order and exactly one future amendment. Pin every fixture and migration hash; where prerequisite schema is reconstructed, record that limitation rather than claiming Supabase equivalence. No #158 Proof6, #134 C01/Run02, connected C01/C02/C03, Slice2A I1 or retained A/B reuse/rerun. New deterministic synthetic UUIDs in a new run namespace, two Businesses and independent owner/admin/employee/anon principals; all contacts fictional and providers absent.

Each case starts from its own recorded synthetic snapshot. Ledger baselines include zero-money SKIPPED, OPEN/unbound REQUESTED, bound REQUESTED, ACCEPTED with exactly one ledger, independent later attempt/ledger, CLOSED/no-history, and refund witnesses on both axes including a foreign-linked contradiction. Four projection states use fresh obligations only. Capture role/current_user, actual row lock waits, outcome, exact row-count deltas, protected tuple digests, journal/revision, relation/trigger/ACL catalog and final rollback/success boundary.

Common oracle: successful ordinary effect = same 1 appointment/1 operation/1 original attempt; +1 APPLIED journal, revision+1, exact desired resources, zero ledger/receipt/invoice/CRM/obligation/communication changes. A valid fence may add exactly the existing one FAILED attempt event and REQUESTED→FAILED, never ledger. New-key no-op = +1 NO_CHANGE journal, revision unchanged. Same-key replay = all counts/digests unchanged, old effect plus current state. Rejection/forced failure = zero command deltas. Unauthorized output reveals no tenant payload.

| Proof ID / Phase0 matrix | Exact required cases and expected witness |
| --- | --- |
| D01 / A | Original create, zero-priced, service/package, SKIPPED/manual-deposit; revision0, no lifecycle journal; exactly admitted parent/resource set; existing bootstrap/bind/commit signatures unchanged. Do not rerun old proof package. |
| D02 / B–E | Confirm, arrive, wait/in_progress/complete, configured skips, no-show, deliberate backward correction with reason; status-only effect, no money. Past notes/status succeeds without new-create validator. cancelled/scheduled target misuse refuses. |
| D03 / F/R | Cancel before commit: one fence, no ledger; commit first: one ledger retained then cancel. Repeat/new-key cancel NO_CHANGE with no strong-parent upgrade; cancelled notes works, other edits refuse. Incoherent cancelled/open state UNKNOWN. |
| D04 / G–J | Reschedule/resize/staff/Location/room/resources; explicit :30 and timezone/DST values, correct self-exclusion and conflicting-other appointment; exact field allowlists, tenant mappings and named staff. Unsupported hard resource reservation guarantee not claimed. |
| D05 / K/L/M | **A:** same-service replacement staff with different numeric price_override, otherwise valid: allow neutral reassignment; price/tax/deposit, operation/attempt, ledger/tender and invoice/receipt/package evidence unchanged, no adjustment/recollection. **B:** different duration_override_minutes: invalid unchanged interval refused with zero deltas; explicit valid coupled revised interval allowed on same appointment, no silent time change/no financial change. Include null/zero fallback, buffers/cleanup, timezone/DST and malformed configuration refusal. **C:** incompatible Location or missing staff-service qualification: zero parent/resource/journal/financial effects. **D:** incompatible service-level price/tax/deposit/package: FINANCIAL_REVIEW_REQUIRED, zero amount adjustment; exact numeric(10,2) service price comparison, no cents conversion. Retain notes null/empty/bounds, same-basis service success, zero-value preservation, monetary/cache injection refusal and unchanged invoice/receipt identities. |
| D06 / N/O | First/repeated no-history customer corrections, exact expected-current compare, actor different from creator; original identities unchanged. Any original/later/legacy/failed-labelled/refunded ledger blocks; foreign/refund-axis witnesses veto without disclosure. |
| D07 / P/Q | REQUESTED/HELD/UNKNOWN permits only eligible notes/status; schedule holds until authoritative eligibility. Each projection incomplete/failed/complete state preserves money and documents; no COMPLETE reset. |
| D08 / U | Direct linked DELETE for OPEN/unbound/SKIPPED/ACCEPTED/CLOSED via service and authenticated owners: explicit retained-history refusal, bound FK protection distinguished from unbound guard. **New isolated synthetic Business:** exercise authenticated owner DELETE through "Owners delete their businesses"; when cascade reaches linked appointment, observe parent guard refusal and whole-statement rollback. Business/appointment/resources/original operation/attempt/ledger/refunds/invoice/receipt relationships all unchanged; no orphan/partial cascade; record actual refusal. Inventory competing Business→operation RESTRICT trigger order: a prior FK refusal proves whole-graph retention but is NOT a parent-cascade-guard PASS. Required cascade witness stays NOT PROVEN until exercised without weakening real constraints; direct parent-guard proof is separate, not a substitute. Separately characterize an unlinked legacy Business deletion under unchanged policy/FKs; do not promise success despite unrelated dependencies. |
| D09 / journal/N1 | Starts0, single effect1, next2; reset/skip/max-overflow refusal; wrong xid8/actor/Business/operation/appointment/command/field/image/revision permit; stale close metadata. Same transaction multiple keys advances successively; reused child/parent permit and cross-transaction replay cannot reapply. |
| D10 / resources/N3 | Initial empty/one/multiple sets; no whole-set early failure; linked direct INSERT/DELETE/UPDATE/reparent denied; remove/add deltas and final set exact; induced missing/extra row rollback. Legacy owner parent delete cascades under child owner; observe current_user; RLS-hidden parent never equals absent. Parent guard/FK disabled simulation makes preflight fail, not cleanup succeed. |
| D11 / ACL | New/replaced lifecycle functions retain INVOKER and exact signature/owner/search_path/grants; exact RLS/ALWAYS/constraints/indexes; anon/auth access and service direct no-permit writes denied; parameter SET, owner escalation, trigger disabling and TRUNCATE capability gates. **Existing validator exception:** exact seven-argument void/plpgsql/STABLE/SECURITY DEFINER/search_path=public contract, independently inventoried owner/ACL/resolved dependencies/body hash/no-write behavior, unchanged before/after. Instrument separate post-lock statement and actual wait to prove refreshed tenant/pairing/availability evidence (with C07/C11); explicit self-exclusion and Location, no hidden write. Unexpected security/owner/dependency drift or UNKNOWN fails the gate; do not turn the existing validator into INVOKER or rewrite it. |
| D12 / v1 | Five original reasons, original actor rejection/acceptance, expected customer mismatch, CLOSED/EXISTING/RECOVERY_REQUIRED shape, no-appt fences, terminal money unchanged, repeated CLOSED customer correction audit; no-op no duplicate effect. |
| D13 / failure | Inject journal/child/parent/final-assert errors and lock/statement timeout; all command writes roll back, existing money survives. Deliberate future migration assertion failure restores prior catalog/data; no historical migration change. |
| D14 / recovery/S/T/N2 | Lose response after permit/parent/commit boundaries; before commit rollback or after commit canonical same-key replay, exactly one effect. After a later revision old replay does not restore image/resources. SQL/source evidence characterizes recorded or terminal/unresolved original-attempt history and UNKNOWN; A1/A2 normalization/composition remains future application proof, subject to K-3/K-7 and D14-E/G. None permits blind recollection. |
| D15 / effects | SQL catalog contains no communication side-effect trigger; new transaction has zero background_jobs, send intents, notification/log, calendar/waitlist/provider artifacts. Later separate A1/A2 test must exercise real emit/bridge plus outer delivery; NOT PROVEN by SQL-only fixtures. |

### K-5 — additional future recovery witnesses (NOT RUN)

These extend D12/D14 and their shared evidence requirements; they do not replace D01–D15 or C01–C11. All are future fresh synthetic-local requirements, not executed tests or amended historical proof scripts.

| Case | LOCAL SQL/SOURCE PROVABLE acceptance oracle |
| --- | --- |
| D12-E | Legitimate no-history customer correction, then original-actor commit_v1 replay; separate coherent SKIPPED and fenced FAILED cases. Observe exact inherited UNKNOWN / recorded=false, zero transaction and other side-effect deltas from replay, immutable operation/attempt customers and identity, unchanged existing appointment money history. Do not expect NOT_COMMITTABLE after the three-way mismatch or infer zero appointment money. |
| D12-F | Original actor versus another currently authorized owner/admin: original-actor read_v1 visibility; non-original read_v1 found:false and commit_v1 UNKNOWN; existing read_payment_observability_v1 yields the permitted same-Business attempt payload with attempt_key null for non-original actor. Capture actual JSON keys, no exported binding_valid/appointment_valid. Include corrected-customer internal invalidity yielding UNKNOWN without asserting a unique cause from the payload. No impersonation or widened grants. |
| D14-E | Establish complete coherent terminal original-attempt evidence and its zero ledger count, then show why it cannot establish whole-appointment truth. If constructible under unchanged schema, independently record a separate later appointment payment: original-attempt ledger_count stays zero while appointment money is positive. Never label the appointment unpaid. If not constructible, record exact constraint/refusal and NOT_PROVEN for that witness, not a fabricated pass. |
| D14-F | Ledger-bearing customer correction refuses with zero command deltas and no reattribution. Original operation/customer/attempt and recorded financial history remain; original-actor commit_v1 replay preserves original transaction evidence and does not collect again. |
| D14-G | Characterize distinct commerce_transactions.appointment_id and payment_attempt_id relationships, including independent/alternative linked histories permitted by actual constraints and guards. Retain constraints; report constructibility, refusal or truthful NOT_PROVEN with exact reason, never a manufactured alternate history. |

Required supporting evidence: (A) original linked INSERT customer match; (B) original operation customer immutability; (C) original attempt customer immutability; (D) actual parent correction guard and replacement admission metadata; (E) read_v1 refund omissions on both axes; (F) exact observability JSON keys; (G) transitive financial visibility, same-Business authorization and foreign-data non-disclosure; (H) no new payment, invoice, receipt, worker or communications effect caused by correction/replay (D14-E's separately approved synthetic independent payment has its own explicit baseline/deltas); (I) actual COMMIT/ROLLBACK boundaries; (J) identical ordered financial digests where preservation is required; (K) possible replacement-metadata drift under unchanged constraints, distinguished from its admission-time invariant and never reused as permanent correction authority. Prove failed/ambiguous reads cause no payment action; unknown hidden evidence never counts as zero. No historical fixture/evidence reuse or guard weakening.

**FUTURE A1/A2 APPLICATION PROOF REQUIRED:** the conceptual four-state model, actor-unavailable presentation, trusted axes A–D composition, whole-appointment completeness, UNKNOWN/HOLD routing, safe customer-facing labels and no recollection/new identity/invoice/receipt/communications actions. These tests are not executable against an implementation supplied by this addendum, because none exists. SQL/source evidence alone cannot earn an application PASS, lift HOLD or reopen financial recovery authority.

### Required multi-session schedules (both winner orders unless noted)

| ID | Schedule / measured pass condition |
| --- | --- |
| C01 | Original payment commit holds attempt versus reschedule: serialized on original attempt; coherent settled result then eligible edit, or unresolved scheduling refusal. One ledger maximum. |
| C02 | Independent valid later-payment insertion versus notes/status plus operational_revision increment (verified outside referenced keys) held at parent NOKEY: FK KEY SHARE is not blocked by that parent lock. Distinguish original-attempt serialization and unrelated writer locks; capture pg_locks/wait event. |
| C03 | Customer FOR UPDATE versus later ledger insertion with old customer: ledger wins → correction refuses; correction wins → old attribution insertion fails/revalidates, no reattribution. Include legacy and R1a insertion. |
| C04 | Cancel versus commit: serialized winner outcomes in D03; no false no-money or second FAILED event. |
| C05 | Projector holding obligation→attempt→ledger→parent versus edit K: bounded completion without added reverse obligation/ledger acquisition; same invoice/receipt/ledger IDs. Inject each projection kind. |
| C06 | Two editors same revision: exactly one APPLIED, loser STALE, one revision increment; same-key race exactly one journal, other REPLAY. |
| C07 | Two distinct appointments rescheduling onto same named staff slot: supported exclusion chooses winner. Resource-only contention is characterized as existing soft checking, not silently treated as hard exclusive reservation. |
| C08 | Legacy parent deletion vs child insert; linked parent deletion vs child maintenance; FK/parent locks preserve invariant, linked never deleted; child guard no reverse attempt/advisory wait. |
| C09 | Membership revoke/owner transfer before or after SHARE authority locks: earlier revocation denies; later revocation waits for current authorized command. Test delete, downgrade and alternate owner path. |
| C10 | Three sessions cancel/reschedule/canonical recovery and delayed replay: coherent highest revision, terminal cancellation never resurrected, immutable money and identities. |
| C11 | Target retirement/mapping deletion/staff-duration change vs lifecycle change: actual post-lock fresh validator statement sees prior committed changes, or held qualifying row remains valid through command; explicit duration/tuple check is independently measured; observe bounded lock failures for incompatible admin order, no universal deadlock assertion. |

Proof output must include per-case PASS/FAIL/NOT_RUN, row IDs/counts, ordered protected digests, expected/actual rejection category, raw bounded lock timeline, journal pre/post match and actual COMMIT/ROLLBACK result. All tests remain NOT RUN in D1. Missing required case or a synthetic role model that masks deployment capabilities prevents proof acceptance.

## T. Future one-migration authoring allowlist

Exactly one newly generated migration, filename assigned only in separately authorized implementation. Allowed objects only:
1. appointments.operational_revision and its nonnegative constraint.
2. booking_lifecycle_private schema; appointment_mutations table, named PK/FKs/checks/indexes and exact private ACL/RLS.
3. Five public v2 functions in §C, private journal/resource guard functions and shared close helper in §B/K; narrowly required EXECUTE/USAGE grants for these new objects only.
4. Body replacement of guard_appointment_booking_operation_link_v1 and narrow redefinition of appointments_booking_operation_guard to include id/revision/DELETE; ALWAYS enablement of the three paired/new guard triggers.
5. appointment_mutations_guard and appointment_resources_lifecycle_guard.
6. Body-only compatible replacement of close_booking_operation_v1 with unchanged public signature/return shape/creator check.
7. Fail-closed pre/post catalog/role/constraint assertions and object comments, bounded transaction settings; no data repair/backfill or replay execution.

No replacement or privilege/volatility change to validate_appointment_slot or its existing dependencies. No other public table policy/grant, enum, original operation guard, bootstrap/persist/bind/commit/read body, projection function, original migration, role/parameter ACL, provider/worker/release control or application source may change. No broad grants to solve a failed prerequisite; request a separate scope review. Proof harness/scripts/tests are a separately enumerated disposable-local implementation deliverable, not content created in D1. #153/#132/A1/A2/optional employees/financial adjustment/room reservation/UI remain outside this allowlist.

## U. Independent audit checklist

- [ ] Main/squash parent/tree and accepted addendum hash match; protected files/evidence unchanged.
- [ ] Exact A–V covers Phase0 matrix A–U with no Option B downgrade or new payment architecture.
- [ ] N1 strict successor plus transaction/tuple-bound one-use permit, child deltas and no-op/replay contracts are implementable.
- [ ] N2 wire/operator translation does not mistake already-recorded or UNKNOWN money for safe collection.
- [ ] N3 paired invariant, owner execution, physical visibility, FK integrity and privilege gates are sound without pg_trigger_depth/GUC authority; distinguish source facts from unproven live capabilities.
- [ ] No anonymous/authenticated journal/RPC access; no new definer bypass or employee/team financial recovery expansion.
- [ ] Customer guard checks all history/refund axes and retained FK races; repeat CLOSED correction is fresh authority, not stale metadata.
- [ ] Original resource creation, unlinked cascades, v1 close semantics and projector cache writes remain compatible.
- [ ] K1 frozen existing amounts versus new-booking staff price configuration; effective duration, explicit coupled time, D05 A–D and exact numeric service comparison are consistent.
- [ ] K2 Business CASCADE/customer RESTRICT, owner DELETE impact, distinct offboarding concepts and truthful D08 rollback/guard witnesses are explicit.
- [ ] K3 unchanged privileged STABLE validator inventory, fresh post-lock statement and D11 dependency/no-write/visibility proof are explicit; K4 independently verified parent visibility and non-key revision remain bounded.
- [ ] Complete lock graph includes independent writers and authority/target rows; ordinary effects do not unnecessarily upgrade parent; no new reverse projector/child edge.
- [ ] Schema/object allowlist is sufficient and bounded; preexisting unsafe ACL/trigger drift stops rather than expanding #153 scope.
- [ ] Full real-PG future delta proof, failure and concurrency witnesses are testable; no accepted historical proof rerun or hosted equivalence claim.
- [ ] Privacy, communications containment boundary and later A1/A2 requirements remain explicit; D1 has no executable implementation or release authority.

### K-6 — focused canonical recovery audit additions

- [ ] K-1: inherited original terminal commit UNKNOWN/recorded=false after legitimate customer correction is described exactly; no transaction from that invocation is not proof of appointment-level zero.
- [ ] K-2: INSERT identity, immutable original operation/attempt and correction admission chain are source-grounded; replacement metadata drift is bounded/unproven; earlier ledger safeguards are not a permanent ban on independent later money.
- [ ] K-3/K-7: original-attempt axis A is distinct from appointment ledger axis B and both refund axes C/D; incomplete/hidden/bounded evidence never becomes EXACT or UNKNOWN-to-zero, no recollection or new payment identity.
- [ ] K-4: original actor and team-admin authority/visibility are separate; found:false is not absence; no impersonation or widened grants; binding_valid/appointment_valid are internal only, with no invented exported flags or unique UNKNOWN diagnosis.
- [ ] K-5: D12-E/F and D14-E/F/G plus A–K evidence extend existing D/C groups without historical proof changes; alternative-history and metadata witnesses may honestly remain NOT_PROVEN.
- [ ] A1/A2 classification/composition is deferred, not an implemented enum/DTO or accepted application proof; exceptional recovery remains UNKNOWN/HOLD without invoice/receipt/worker/communication effects.
- [ ] Protected commit/close/read/financial/validator functions and Section T remain unchanged by this addendum; Option B is not narrowed; privacy and complete same-Business evidence remain mandatory.

## V. Next Product Owner gate and remaining uncertainty

Darshan manually dispatches the **new documentation-only Draft PR**, exact HEAD/tree and amended document SHA-256, to Claude Opus 5 High for focused K-1–K-7 review. PR #162 remains merged and is not reopened/reused. The supplied reconciliation OPTION_A_SAFE_ONLY_AS_UNKNOWN_HOLD_UNTIL_A1A2 is recorded; acceptance of these new document bytes remains pending. ChatGPT reconciles the audit and next governing gate. No agent was dispatched.

The stopped local SQL worktree/draft stays untouched. This addendum authorizes no SQL implementation resumption, proof execution, A1/A2 work, hosted action or release. A later explicit bounded resumption must retain Section T and add the new local proof oracles; future A1/A2 has its own review/implementation/application-acceptance gate. Neither precise application recovery nor GVM operator acceptance follows from documentation or original-attempt evidence.

Remaining **unproven execution requirements**, not waived gates: actual hosted role/parameter/TRUNCATE/owner capabilities; dependency schema/trigger shape; journal/child/v1 compatibility in real PostgreSQL; multi-session lock behavior; commercial semantic compatibility for particular service/package/Location corrections; future application containment/error routing. Unsupported/ambiguous corrections fail closed. A contradiction during audit/proof blocks implementation/apply rather than introducing a new financial or permission engine. D1 does not supply an operational permission to alter schema owners or revoke platform privileges.

Accepted local/hosted histories (#158 Proof6, #134 C01, connected C01/C02/C03, I1, retained Slice2A A/B and Run02) remain closed, never rerun/reused/modified. No Production, Staging, GVM/HQ, worker/provider, communication or technician-deposit authorization. #153 and #132 remain separate release gates; Production is not inferred from main or Preview.

## Protected identities and validation record

| Protected file | SHA-256 |
| --- | --- |
| `issue-134-slice2b-lifecycle-readiness-addendum.md` | `89ac66c67e85f2cb53973ce7f9e30d9f44e71b9661d0658a48d339a70a2282db` |
| `issue-134-durable-booking-deposit-contract.md` | `29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d` |
| `issue-133-slice2-canonical-financial-wiring-design.md` | `1f1a966c8466d6f124adab76a2bb188497c363a30d1f104df42c663d7eba029a` |
| `20261004190341_issue_134_payment_attempt_foundation.sql` | `dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47` |
| `20261005154345_issue_134_r1a_manual_payment_kernel.sql` | `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7` |
| `20261007012529_issue_134_appointment_financial_attribution.sql` | `fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524` |
| `20261007203352_issue_134_durable_booking_operation.sql` | `01b10f8c629cc73b08d6c5849160836b90cbc87beb29d7c8b78857375fe2493b` |
| `20261008210359_issue_133_payment_projection_observability.sql` | `ca91f6cbe7b9aa3a2c1b0b1eec13c267b1364badac9bfe07c4366c3157006f56` |

Validation scope: source review, official PostgreSQL17 reference review, exact docs-only diff, local Markdown links, A–V/N1–N3 inventory, protected hashes and whitespace. No application tests/build or database proof executed locally. Remote CI/Preview results are reported separately for the published candidate, never substituted for PostgreSQL/security acceptance. No environment manifest update: no environment was changed or freshly observed by this task.
