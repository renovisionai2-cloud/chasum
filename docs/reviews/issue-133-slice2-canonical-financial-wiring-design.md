# Issue #133 Slice 2 — canonical financial truth and durable booking recovery

**Status: SLICE2_CORRECTED_DESIGN_READY_FOR_EXACT_CANDIDATE_REVIEW.**
**Authority:** Product Owner approved consolidated DESIGN CORRECTIONS ONLY. Runtime implementation, test-code changes, migrations/SQL, hosted actions, financial execution, activation, #153 changes, push/merge/deploy and Production/GVM mutation are NOT authorized.

**Primary launch objective:** resolve the GVM technician CAD50 deposit / booking-confirmation discrepancy through one recoverable booking/payment identity and truthful operator evidence. This document prepares that work; it does not resolve the incident or resume technicians.

**PRODUCT OWNER DECISION — E1-B APPROVED FOR CHASUM V1.** Employee “Completed service value” is completed-only operational appointment/service value. Commission is unavailable/not configured, never $0. No commission engine or GVM-specific compensation policy is included. No outstanding E1 decision remains.

Correction provenance: frozen reviewed HEAD `90f098071c441c6cb1e4cef913e5d37d9ab93c12`, tree `c8f07ab167a997e43269c988e76ed970514c9e98`, parent `495bce4713a0b03c916c4cb83aae89b7136524c3`; prior design SHA-256 `7952e3e8d27770bfe191c085a26f3dc5aefc1d98b64c4ecb5005194101c70696`, 54,729 bytes. Starting identity and clean worktree verified for this correction. Governing instruction: `/tmp/chasum-slice2-codex-corrections.txt`; supplied evidence: `/tmp/chasum-slice2-claude-output.txt`, `/tmp/chasum-slice2-grok-high-output.txt`, `/tmp/chasum-slice2-grok-fast-output.txt`, `/tmp/chasum-slice2-sol-output.txt`. The approved synthesis supersedes older reviewer requests to leave E1 open, build compensation policy now, or permit ordinary pagination to claim EXACT. These temporary files are local review evidence, not hosted-action authority.

Targeted Claude delta correction: supplied verdict `SLICE2_CORRECTED_DESIGN_NEEDS_CORRECTIONS` identifies only documentary blockers B6 (Reports gift/membership source ownership) and B7 (shared Money render boundary); implementation-time requirements I1–I5 are preserved below. This delta starts from verified clean HEAD `97bc1d6a0dc8f25cc1f7963645cddcd3b0b12bcd`, tree `dcf7053e1a9fedbfd1a5f0d533ba21b11cdc6d12`, parent `90f098071c441c6cb1e4cef913e5d37d9ab93c12`, design SHA-256 `36b702ecd3b2226bd0f830e7d27f85fa3ffd92ec205443d272ba7d66ca0455ce`, 70,965 bytes. No fresh independent review or runtime acceptance is claimed.

Accepted C03 closeout `6a2fbd4bc569430baf86fd17d57b49b65f645699` remains preserved. Run `HV133-158-20261009-C03-9b8c5783` is CONNECTED_BACKEND_PASS / CONNECTED_STAGING_C03_ACCEPTED_WITH_NONBLOCKING_LIMITATIONS: one CAD50 manual E-Transfer deposit, confirmed appointment, partial invoice, unsent receipt, CRM event and four COMPLETE obligations, canonical RECORDED/COMPLETE. It is accepted only for that backend path. C01/C02/C03 are CONSUMED; never rerun/reuse or clean up retained evidence/state. C03 admission remains disabled.

## 1. Launch classification and separate implementation slices

Both slices are **LAUNCH REQUIRED**, each with a separate exact implementation, review and acceptance gate. “Build now” means only after its future Product Owner implementation approval. Neither this design nor 2A alone earns GVM Operational Acceptance.

### Slice 2A — Financial truth + recovery visibility

- One shared server-only canonical collected-money aggregate and EXACT / HELD / UNKNOWN propagation.
- Reporting, Commerce, Command Centre, Reception, Calendar, Chase, CRM and Summer money truth correction; remove/hold/relabel false financial claims.
- Canonical operator-state DTO and read-only recovery visibility infrastructure; preserve money versus synchronization versus communications distinctions.
- E1-B completed-only operational service value and unavailable/not-configured commission.
- No live canonical booking writer, communications or worker activation; no migration or #153 cutover.

### Slice 2B — Durable booking writer cutover

- Fresh Booking Sheet / Quick Appointment create wiring to accepted #158 durable operations, including staged inline-customer bootstrap.
- Mandatory server-side same-operation/same-attempt resume, opaque browser recovery reference lifecycle, canonical post-submit reread and Book Another identity rotation.
- Explicit authorized operation-bound projector convergence without a worker; default-closed booking-event suppression at the durable create seam.
- Server-only Business-scoped operation-admission/readiness seam, default CLOSED; synthetic enablement and any real-Business activation require later exact gates.
- Public/session/legacy booking behavior and edit-booking updateAppointment remain unchanged. No Production/GVM activation follows implementation acceptance.

Acceptance target across both slices: supported manual CAD booking payments yield one consistent collected-money/state answer across Booking Sheet / Quick Appointment, Commerce/Command Centre, Reporting, CRM/account views and Summer; unsupported or incomplete buckets hold, and uncertain responses never invite duplicate collection. Risk if deferred remains RED for financial trust / AMBER for general breadth.

### Deferred boundaries

DESIGN FOR NOW / BUILD LATER: global event_sequence privacy hardening while it stays server-internal; automated projection workers; broader refund/provider support; immutable collection-location attribution; evidence-schema flag echoes; tenant-configurable compensation. No commission engine is required for GVM Operational Acceptance.

BACKLOG / OUTSIDE THIS SLICE: #152 historical USD repair, provider integration, autonomous Summer financial ACT, transfers/merges/offboarding, broad Reporting/Calendar/Reception redesign, communications activation, gift-card/membership accounting and accounting revenue recognition.

### Competitive Product Gate

**NOT_APPLICABLE to this documentation-only correction:** product behavior and corrections are already approved, and no material feature is being implemented here. The existing `docs/reviews/issue-134-booking-deposit-competitive-gate.md` governs the later bounded booking/recovery work: one coherent flow, explicit money/synchronization states, same-identity recovery and no recollection after uncertainty. Its parity floor, proposed Chasum advantage and switching reason must be demonstrated in later product acceptance; source/tests alone do not establish superiority. No repeat broad research is needed. Material new product behavior beyond this contract requires Program Lead reconciliation and its applicable competitive gate.

## 2. Current source map

| Surface | Exact source / function | Current truth source | Classification | Risk if unchanged | Slice 2 treatment |
| --- | --- | --- | --- | --- | --- |
| Canonical payment attempt reader | lib/commerce/payment-observability/reader.ts — readPaymentObservability | #133 canonical RPC read_payment_observability_v1 | Canonical, unwired | Trusted truth exists but operators do not consume it | Wrap in a narrow operator DTO and make it authoritative after submit/replay/reload |
| Canonical payment types | lib/commerce/payment-observability/types.ts | attempt, ledger, obligations, operator_state, synchronization | Canonical internal | Raw event sequence/internal fields could leak if exposed directly | Keep server-internal; operator DTO omits event sequence and unnecessary internals |
| Canonical booking operation reader | lib/commerce/booking-operations/kernel.ts — readBookingOperationCanonical / listBookingOperationHistory | #158 durable operation reader | Canonical, unwired | Lost response/reload cannot currently resume from existing UI identity alone | 2A provides safe read-only state; 2B MUST add a server-side resume primitive loading persisted request/details from opaque references |
| Prepared durable booking writers | lib/commerce/booking-operations/kernel.ts — runPreparedBookingSheetOperation / runPreparedQuickAppointmentOperation | accepted #158 durable operation kernel | Prepared/unwired | Current app create path remains legacy split booking + payment behavior | Future implementation must wire only through reviewed canonical path; dependent on prerequisite stack |
| Current app booking mutation | lib/actions/appointments.ts — createAppointment | createBooking then optional post-booking payment logic | Legacy application writer | Appointment can succeed before optional payment path; result/retry semantics are not the accepted C03 operation contract | 2B wires the fresh create operation through the durable adapter under its separate gate; 2A does not activate this writer |
| Booking Sheet UI | components/booking-sheet/booking-sheet.tsx | createAppointment/updateAppointment + payment_idempotency_key | Legacy UI entry | Can only reason from action result/cache, not canonical recovery read | Preserve layout; store/retain operation/payment recovery identity and render canonical operator state |
| Quick Appointment UI | components/reception/quick-appointment.tsx | createAppointment + payment_idempotency_key | Legacy UI entry | Same uncertain-response/reload gap | Same canonical recovery adapter and state component; no separate financial logic |
| Booking payment summary | components/booking-sheet/payments-section.tsx | appointment.payment_status/cache | Derived projection/cache | Cache can lag canonical money/synchronization | Keep as display summary only; recovery/action decisions come from canonical operator DTO |
| Appointment drawer | components/day-view/appointment-drawer.tsx | appointment.payment_status/cache | Derived projection/cache | Can look authoritative when synchronization is incomplete | Display cache with bounded wording; no recovery decision from cache alone |
| Reports action | lib/actions/reports.ts — getReportsBundle | customer_payment_events + appointment rows | Legacy/projection/appointment mix | CRM mirror or appointment price can become financial authority | Re-source financial collected-money fields to one canonical aggregate |
| Reports compute | lib/reports/compute.ts — buildRevenueBreakdown / buildFinancial / buildCustomerReport | buildRevenueBreakdown uses raw appointment/service price; buildFinancial mixes payment-event projection with appointment-recognized money and appointment columns; buildCustomerReport uses hybrid customer_payment_events with appointment/catalog-price fallback | Legacy financial formula | Multiple “revenue” definitions; refund/outstanding ambiguity | Separate operational appointment metrics from canonical collected-money report inputs; preserve the explicit legacy-field inventory in section 4.1 |
| Commerce dashboard | lib/commerce/dashboard.ts — getCommerceDashboardSnapshot | commerce_transactions plus private sumSucceededPayments, invoices/refunds/appointment fallbacks | Partly canonical but parallel formula | Creates second ledger formula and lacks explicit multi-currency/HOLD contract | Consume the same shared canonical aggregate; retain non-revenue invoice/deposit presentation separately |
| Command Centre | lib/actions/command-centre.ts — getCommandCentreSnapshot | Commerce snapshot revenueTodayCents exposed as collectedTodayCents | Consumer of partly canonical value | Depends on dashboard formula correctness | Continue consuming Commerce snapshot only after snapshot is backed by shared aggregate |
| Reception brief | lib/actions/reception.ts — getReceptionBrief | completed appointments × service price | Legacy appointment revenue | “Today’s revenue” can disagree with actual money collected | Replace financial claim with canonical collected-money bucket or explicit held/unavailable state; appointment volume remains appointment-derived |
| Morning Brief | lib/actions/morning-brief.ts — getMorningBrief | appointment/utilization revenue and deltas | Legacy appointment revenue | Summer/operator recommendation may be based on non-money estimates | Use canonical aggregate for money claims; retain utilization/visit metrics separately |
| Appointment revenue helper | lib/commerce/recognize.ts — appointmentRecognizedCents / sumRecognizedRevenueCents | completed/payment-status appointment cache/catalog fallback | Operational/legacy | Comment/usage can imply financial authority | Restrict to operational “service value/visit value” semantics or deprecate for money totals; never feed collected-revenue surfaces |
| CRM profile insights | lib/crm/service.ts — buildInsights | completed appointments × service price | Legacy estimated spend | False lifetime revenue/spend certainty | Lifetime monetary values become unknown unless completeness is proven; keep visit/preference metrics |
| CRM timeline | lib/crm/service.ts — payment event load/build | customer_payment_events | Projection/display | Double-count risk if treated as ledger | Keep for timeline display; link/correlate to transaction where available; never sum as financial authority |
| Summer CRM knowledge | lib/crm/ai-knowledge.ts — getSummerCrmSnapshot / getChaseCrmAnalytics | CRM appointment-derived spend | Legacy estimated spend | AI can confidently state invented lifetime money | Replace money claims with canonical/Option-A truth; visit-based segmentation may remain |
| CRM AI renderer | lib/crm/ai.ts | formats Summer/Chase lifetime spend/high-value results | Consumer of legacy estimate | Produces authoritative-looking false money statements | Support unknown/held money; do not format null/held as $0 |
| Customer commerce account | lib/commerce/customer-account.ts — getCustomerCommerceAccount / getSummerCommerceSnapshot | transactions + invoices + appointments, with completeness checks | Governed Option A | Correct cautious model can be bypassed by other CRM/Summer paths | Preserve; reuse its unknown/source-disagreement semantics |
| Customer account projection | lib/commerce/customer-account-projection.ts — projectCustomerAccountTotals | cross-source reconciliation | Governed Option A | None if preserved | Keep lifetime paid/spend/deposits unknown; current balance only on complete agreeing sources |
| Receipt email context | lib/commerce/receipts.ts | receipt -> transaction -> appointment | Canonical transaction-bound context | Future UI may assume receipt.invoice_id direct link | Keep accepted independence; operator/accounting lookup traverses receipt -> transaction -> invoice |
| Projection wrapper | lib/commerce/payment-projections/kernel.ts — projectPaymentObligation | #133 projector RPCs + admission | Canonical, unwired | Premature worker wiring could sweep retained cohorts | No worker in Slice 2; explicit projections only under later governed acceptance |
| Reception customer preview | lib/actions/customers.ts lifetimeRevenue → components/reception/customer-preview.tsx | completed appointments × service price | Legacy monetary claim | Reception displays a customer Revenue value that can disagree with ledger truth | Monetary lifetime value becomes UNKNOWN under Option A; keep non-money customer/visit metrics |
| CRM Chase hint | lib/crm/chase-hints.ts lifetimeRevenue threshold | appointment-derived CRM insight | Legacy monetary segmentation | A false money estimate can drive “high-value customer” recommendations | Remove monetary threshold until complete canonical history exists; keep visit/recency segmentation |
| Employee performance | lib/employees/service.ts lifetimeRevenue + lib/employees/types.ts → components/employees/employee-performance.tsx | appointmentRecognizedCents | Legacy staff monetary claim | Employee Lifetime revenue can contradict canonical collected money | E1-B locked: completed-only operational Completed service value on existing appointment/service-price basis; no collected-money or commission inference |
| Reports employee commission | lib/reports/compute.ts commissionCents | appointment-derived report revenue | Staff-pay-adjacent legacy formula | Commission can be derived from a noncanonical money base | E1-B locked: unavailable/not configured, no numeric commission and never $0 |
| Chase revenue pace | lib/booking-engine/queries/range.ts utilization revenue → lib/chase/analytics.ts / lib/chase/insights.ts / lib/chase/types.ts | service/catalog appointment value | Legacy monetary KPI | Chase can say revenue up/down from non-ledger value | Re-source money KPI to canonical aggregate or explicitly relabel as operational service value |
| Calendar dashboard money | lib/actions/appointments.ts dashboard stats → app/(dashboard)/dashboard/calendar/page.tsx → lib/dashboard/insights.ts | sumRecognizedRevenueDollars | Legacy monetary KPI | Calendar can say Completed revenue today from appointment estimates | Re-source money fields to canonical aggregate; operational appointment metrics remain separate |
| Chase workspace | components/chase/chase-ops-workspace.tsx | numeric Chase/Commerce revenue fields | Consumer | Can render held/legacy values as exact currency | Propagate EXACT/HELD/UNKNOWN; never format held as zero |
| CRM monetary types/UI | lib/crm/types.ts + components/crm/customer-insights.tsx + components/crm/chase-crm-panel.tsx | numeric lifetime revenue/spend | Legacy numeric-only contract | UI cannot represent Option-A unknown truth | Make monetary fields nullable/held-aware and render truthful unknown state |
| Communications create seam | lib/booking-engine/mutations/create.ts — createBooking / emitBookingEvent; lib/booking-engine/events/emit.ts; lib/actions/appointments.ts — deliverBookingNotifications / sendPaymentReceiptNow | createBooking emits appointment.created before the durable payment flow finishes | Separate accepted domain | Skipping action delivery helpers alone still allows bridge inserts and enqueues | 2B MUST suppress lifecycle event emission only for durable persistence with an explicit capability/default-closed signal; legacy/session/public effects remain unchanged; prove zero downstream effects |
| Inline customer bootstrap | components/booking-sheet/customer-section.tsx; components/booking-sheet/booking-sheet.tsx; components/reception/quick-appointment.tsx | inline customer created before durable operation | Legacy early write | Retry/reload can duplicate or orphan a customer before booking | 2B stages draft locally and passes canonical inlineCustomerId through accepted bootstrap; preserve match-required selection |
| Durable request and admission | lib/commerce/booking-operations/kernel.ts; lib/commerce/booking-operations/types.ts | runner requires original request plus IDs; production dependency admissionEnabled=false | Prepared server-only | Opaque browser IDs alone cannot resume the full runner | Mandatory persisted-request resume and separate default-CLOSED server-only Business admission seam |
| Financial transport types | lib/commerce/types.ts — CommerceDashboardSnapshot / ChaseCommerceMetrics; lib/dashboard/command-centre.ts — CommandCentreMoneyView; components/dashboard/command-centre.tsx | numeric-only money contracts | Consumer boundary | HELD/null can become $0, NaN, blank certainty or crash | Shared leaf result types and bounded adapters carry explicit state through renderers |
| Shared formatter | lib/commerce/money.ts — formatMoneyCents / normalizeCurrency | numeric cents formatter; unknown currency can fall back to usd | Presentation only | Passing null coerces to zero; raw currency fallback invents evidence | State-aware callers/adapter format only EXACT supported currency; never classify evidence with normalization |
| Shared money renderer | components/ui/money.tsx — Money | cents formatter, otherwise formatMoneyDollars(dollars ?? 0, currency) | Shared numeric render boundary | Absent/unknown amount can render as $0 | 2A MUST CHANGE: accept EXACT / HELD / UNKNOWN; only EXACT reaches numeric formatting, HELD/UNKNOWN render status text; preserve ordinary exact-money callers |
| Summer tool/orchestration | lib/summer/tools.ts; lib/summer/orchestrator.ts | Commerce, CRM and brief numeric inputs and prose | Financial consumer | Partial re-source leaves independent or overconfident money advice | Canonical/HELD/UNKNOWN through UNDERSTAND/EXPLAIN/RECOMMEND/AUDIT; financial ACT closed |
| CRM action/export boundary | lib/actions/crm.ts; lib/commerce/index.ts; lib/commerce/customer-account.ts | CRM and Summer payloads / Commerce exports | Consumer transport | Types or exports can drop explicit state | Propagate shared canonical/Option-A result without reintroducing numeric defaults |
| Refund contradiction evidence | lib/commerce/refunds.ts; commerce_refunds and linked appointment amount_refunded_cents | refund record can precede later transaction/cache synchronization | Evidence, not extra collected-money source | Transaction may still be succeeded despite refund evidence | Any relevant refund evidence or contradictory positive appointment refund cache HOLDS affected bucket; no automatic netting |
| Reports gift/membership figures | lib/actions/reports.ts owns giftCardRevenueCents / membershipRevenueCents and CSV labels; lib/reports/compute.ts + lib/reports/types.ts carry Executive values; components/reports/reports-hub.tsx renders them | gift-card liability consumption and active-membership price | Non-collected commercial/document metrics | Liability consumption and membership price can be mistaken for collected cash, including CSV “Membership Revenue ($)” / “Gift Card Revenue ($)” | Reports owns explicit non-collected relabelling or HELD/removal from collected views; CSV labels must not continue to say “Revenue” for noncanonical collected-money values; no accounting redesign |

The source inventory must be rerun narrowly at implementation start to catch changes after this design commit. Newly discovered launch-critical money surfaces listed above are now inside the prepared scope; the preflight remains a regression guard, not permission for unrelated scope expansion.

## 3. Slice 2A canonical collected-money aggregate

### 3.1 Authority and shared module

One server-only aggregate over `commerce_transactions` supplies all collected-money KPIs. Proposed NEW modules (not present or created by this correction): `lib/commerce/financial-aggregate/types.ts`, `lib/commerce/financial-aggregate/reader.ts`, `lib/commerce/financial-aggregate/index.ts`.

Ledger amounts are the only collected-money amount source. `commerce_refunds`, linked appointment refund indicators and same-Business identity joins are mandatory contradiction/scope evidence, not alternative money formulas. CRM payment events, appointment paid/status caches, invoices, receipts, service/catalog prices and obligation completion cannot manufacture or erase recorded money.

Canonical labels say **Collected / Payments collected**, not accounting “Revenue.” Deposits are recorded collections, not evidence of earned accounting revenue. Do not add revenue-recognition logic.

### 3.2 Server authorization and period contract

FinancialAggregateRequest uses a trusted server-resolved Business, bounded period, optional customer/Location and expected raw currency, plus diagnostic purpose. Purpose never changes arithmetic. Authenticate the actor, resolve active Business server-side, authorize optional scope IDs, and apply immutable `business_id` filters to every evidence read/join. A browser-selected Business ID is never authority; service-role credentials never reach the browser. Same-Business customer, appointment, attempt and Location relationships must agree wherever applicable.

One reusable financial-period contract uses the Business IANA timezone and `commerce_transactions.occurred_at`, with UTC instants delimiting a half-open `[from, to)` interval. Today/week/month boundaries and prior-period comparisons use the same helper across Reports, Commerce, briefs and other consumers, including DST transitions. No server-local midnight or appointment `start_time` substitution. Appointment start remains the operational scheduling clock. Invalid/missing authority for timezone or period makes the financial read UNKNOWN rather than guessing a period.

### 3.3 Current appointment Location semantics

No immutable ledger Location exists. Location-scoped financial attribution is transaction -> same-Business appointment -> **CURRENT** `appointment.location_id` -> same-Business Location. A later appointment Location edit can move historical Location attribution. Disclose this meaning; do not label the result immutable “collected at Location” history.

Business-wide collected money may include supported unbound transactions. A Location-specific result is EXACT only when relevant positive rows have complete/coherent current appointment/Location attribution. Unbound, missing, cross-Business or contradictory links make the requested Location financial bucket HELD, not an unattributed numeric subtotal. Do not filter unknown-location evidence away before deciding completeness. Coherently other-Location rows can be excluded; unresolved attribution within the Business/period/customer envelope cannot be assumed unrelated. Never fall back to Business home/default or browser active Location. Immutable historical attribution needs a separate future architecture/migration gate, outside Slice 2.

### 3.4 Closed-world classification

A positive row contributes only if **all** conditions hold:

- `status === "succeeded"`, `provider === "manual"`, `kind` is `payment` or `deposit`;
- manual tender method is explicitly one of `cash`, `e_transfer`, `debit_card`, `credit_card`, `other`, matching the accepted `BookingManualMethod` contract; this records manual tender and does not activate or prove provider/bank processing;
- `amount_cents` is a positive integer safely representable for exact accumulation; overflow also prevents a numeric claim;
- raw stored currency is an existing supported key (section 3.6);
- all applicable same-Business customer/appointment/attempt joins are coherent; present canonical attempt attribution agrees with the accepted #133/#158 contract;
- no relevant refund evidence or contradictory appointment refund cache exists; required Location attribution is coherent.

Only coherently terminal `failed` and `canceled` non-collections may be excluded without HOLD. That exception requires evidence consistent with no recorded collection/refund/identity contradiction; it is not permission to ignore malformed or unsupported evidence.

All other evidence defaults to HELD: `pending`, `requires_action`, `refunded`, `partially_refunded`, unknown/null status, unsupported provider/kind/method, nonpositive/invalid amount, invalid currency or contradictory identity. `gift_card` and `store_credit` methods HOLD even if provider/manual, kind/payment and status/succeeded otherwise pass. Refund/void/adjustment/gift/store-credit kinds are unsupported. Do not silently omit unsupported rows.

**Refund veto:** any in-scope relevant `commerce_refunds` evidence HOLDS the affected bucket even when the original transaction still says succeeded. Include refunds linked to relevant transactions regardless of a later refund date/status; filtering to only succeeded refunds is insufficient. Also HOLD if linked `appointments.amount_refunded_cents > 0` contradicts an otherwise supported positive row. Missing/unreadable refund evidence prevents EXACT. No netting, refund reconciliation, writer change or historical repair is designed here.

Gift-card liability consumption and active-membership price are commercial/document metrics, not canonical collected cash. `lib/actions/reports.ts` owns `giftCardRevenueCents` / `membershipRevenueCents`; `lib/reports/compute.ts` and `lib/reports/types.ts` carry the Executive values, and `components/reports/reports-hub.tsx` renders them. Reports must explicitly relabel them as non-collected commercial/document metrics or mark them HELD/remove them from collected-money views. The CSV labels in `lib/actions/reports.ts`, currently “Membership Revenue ($)” and “Gift Card Revenue ($)”, must not continue to say “Revenue” when the value is not canonical collected money. No gift-card/membership accounting redesign is introduced.

### 3.5 Completeness and truthful result states

**EXACT requires a complete bounded single response/read with one consistent view of all evidence required for that result**, including refund veto and applicable joins. The later implementation must prove its selected existing read surface provides that view; independently timed reads cannot prove a common snapshot merely by all succeeding. If the existing surface cannot return complete consistent evidence, return UNKNOWN. No new RPC/migration is allowed for convenience.

**I1 — before coding 2A:** determine whether an existing source can return transactions, refund-veto evidence and appointment/Location attribution in one bounded consistent read. If it cannot, the honest v1 result is UNKNOWN for affected collected-money scopes unless a separately approved architecture/migration gate provides a DB-side aggregate. The future 2A Product Owner gate must disclose this visible consequence; do not promise numeric collected-money views before proving the read is feasible.

Multi-request ordinary PostgREST pagination, including exact counts or keyset pagination, cannot claim EXACT without snapshot isolation. Row caps, nested relation truncation, incomplete evidence scope, read errors, partial responses and count mismatch are UNKNOWN. “Latest N” is never an exact aggregate. A future DB-side aggregate/RPC for scale is a separate architecture/migration gate, not part of 2A/2B.

Result contract:

- EXACT: complete supported scope, explicit currency buckets containing collectedCents/paymentCount/depositCents/paymentCents. An empty, proven-complete supported scope is EXACT zero in the validated requested currency.
- HELD: unsupported/contradictory evidence in the **requested financial bucket**, with safe reasons and no canonical numeric total.
- UNKNOWN: incomplete/unavailable read or unproven authority/completeness, with safe reason and no numeric total. Known hold reasons may be retained diagnostically if completeness is also unknown; neither permits a number.

A held month does not disable unrelated operational reports; a held Location money bucket does not disable Business-wide counts. A supported currency bucket can be exact only when evidence permits complete isolation from held/unknown evidence. Never display an unofficial “supported rows” subtotal beside a HELD canonical number. #152 historical/unsupported shapes can HOLD affected periods until separately addressed; do not repair them in Slice 2.

### 3.6 Raw currency and numeric boundaries

The supported keys currently present in `lib/commerce/money.ts` (`CURRENCY_META` / `BUSINESS_CURRENCIES`) are `usd`, `cad`, `eur`, `gbp`, `aud`. Validate raw stored values against those keys; a three-letter regex alone is insufficient. Unknown, uppercase, whitespace-padded, malformed or unsupported stored values HOLD rather than being silently normalized. `normalizeCurrency()` may fall back to usd and MUST NOT classify canonical evidence. No silent USD fallback or cross-currency sum.

A multi-currency Business result may expose independently complete exact currency buckets. A single-number consumer must HOLD when multiple currencies or incompatible expected currency prevent one precise amount. Validate requested/default Business currency too. Empty-scope zero is allowed only with proven completeness and explicit valid currency, never as a catch/error default.

`CommerceDashboardSnapshot`, `ChaseCommerceMetrics`, `CommandCentreMoneyView`, Reports/CRM/Summer payloads and renderers must carry a shared discriminated EXACT/HELD/UNKNOWN leaf type or equivalent safe adapter. Held/unknown amounts are absent, not numeric placeholders. `formatMoneyCents` accepts a number and JavaScript null arithmetic can render zero; only EXACT values may reach it. State text must render in place of currency for unavailable values. No `value ?? 0`, NaN, blank certainty, crash, or export coercion is acceptable. Change a shared leaf boundary where needed rather than copying local money logic.

**B7 — shared render owner:** `components/ui/money.tsx` (`Money`) is a Slice 2A **MUST CHANGE** boundary. Today, when cents is absent it calls `formatMoneyDollars(dollars ?? 0, currency)`, so absent/unknown can display as $0. Make this existing component accept explicit EXACT / HELD / UNKNOWN semantics using the shared leaf type. HELD/UNKNOWN render readable status text, never $0, NaN or blank certainty; only EXACT may reach either numeric formatter. Null/absent amount without an explicit state becomes UNKNOWN, not an exact zero. Preserve ordinary exact-money callers with explicitly supplied valid cents/dollars, including genuine zero, through a compatible exact-input path; this does not classify canonical evidence or authorize a numeric fallback for held/unknown inputs. No unrelated component redesign or duplicated local state logic is needed. Keep `lib/commerce/money.ts` as raw numeric formatting/support metadata; `normalizeCurrency` must never classify canonical evidence. Future focused Money tests cover null/absent, HELD, UNKNOWN and EXACT rendering plus existing exact cents/dollars compatibility.

### 3.7 Historical Option A and one-formula rule

An exact bounded Chasum ledger period does not prove complete lifetime history. Customer lifetime spend/paid/deposits remain UNKNOWN under accepted Option A unless a separately accepted completeness proof exists. Current balance stays numeric only under the existing complete-source agreement contract. No import/backfill is included.

Reporting and Commerce use this one aggregate; Command Centre, Reception, Morning Brief, Calendar, Chase, CRM and Summer use its results/adapters. No replacement local sumSucceededPayments, CRM-event sum, or appointment-price financial formula is permitted. Operational appointment/service-value metrics stay separate.

## 4. Slice 2A Reporting and employee truth

### 4.1 Bounded financial inputs

`lib/actions/reports.ts` obtains the canonical aggregate for collected-money fields. `lib/reports/compute.ts` accepts explicit state instead of payment-event/appointment money substitutes. Source facts: `buildRevenueBreakdown` currently uses raw appointment/service prices; `buildCustomerReport` mixes customer_payment_events with appointment/catalog-price fallback. Neither is canonical collected-money truth.

**I2 — legacy `buildFinancial` field inventory:** payments/refunds/outstanding (`paymentsCents`, `refundsCents`, `outstandingCents`) are payment-event related; `invoicesCents` uses appointment-recognized money; `taxesCents`, `discountsCents` and `depositsCents` come from appointment columns. In particular, `deposit_cents` is a configured requirement, not collected money. These fields must not be silently interpreted as canonical Collected: re-source actual collected-money claims through the aggregate, or retain only explicitly non-collected operational/document semantics or HELD/UNKNOWN.

Business collected totals use the shared aggregate and Business financial clock. Operational appointment volume, completion/cancellation/no-show counts, popularity, employee counts and utilization remain available on their existing scheduling basis. No broad new financial attribution engine is included.

### 4.2 Dimensions, growth and Location

Service/employee/category financial breakdowns HOLD when complete canonical dimensional attribution is unavailable, or retain a clearly relabelled operational metric. Do not infer financial allocation from service price or current staff assignment. Staff reassignment is an additional reason not to treat collections as payroll attribution. Slice 2 does not create an immutable attribution/compensation engine.

Location money uses section 3.3's current appointment Location rule; existing `getLocationScope` / `withLocationFilter` operational behavior remains. Command Centre collected money remains explicitly **Business-wide**. Monetary growth/deltas require comparable EXACT periods/currencies; HELD/UNKNOWN inputs yield explicit unavailable growth, not zero or a made-up percentage.

### 4.3 E1-B employee contract

Only `status === "completed"` contributes to **Completed service value**, an operational, nonfinancial performance measure. Preserve the existing appointment/service-price value basis for completed rows; never substitute collected ledger amounts. Current `lib/employees/service.ts` computeFromRows adds appointmentRecognizedCents for non-cancel/no-show rows, and that helper can include paid-but-not-completed money. It is therefore unsuitable as-is: use/reuse the existing appointment/service-price basis with the completed-only predicate. Do not invent tax, tip, refund, deposit, partial-payment or compensation math.

**I3 — implementation value-basis disclosure, E1-B remains locked:** moving from `appointmentRecognizedCents` to the completed-only appointment/service-price basis can change values for completed-but-partially-paid rows. Also, `appointmentPriceCents` may fall back to current `service.price` when `price_cents` is null/zero. The future 2A gate must state the exact value-basis choice within the approved operational appointment/service-price contract and test completed-but-partially-paid rows plus null/zero stored-price fallback. Do not silently inherit helper behavior or reopen E1-B; this is a nonfinancial metric, with no compensation or collected-money inference.

Reports and Employee UI must not calculate/display numeric `commissionCents` in Slice 2. Commission is **Unavailable / Not configured**, never $0 for absent policy, and Completed service value is not a commission base. Section 14 records the approved decision; no new PO decision is required.

### 4.4 Actual export paths and scope

Current Reports exports are **CSV + browser print**, implemented through `lib/actions/reports.ts` and `components/reports/reports-hub.tsx`; this is not a server PDF/Excel generator. CSV and the printed view must preserve HELD/UNKNOWN, currency and scope explicitly, not numeric zero or blank certainty. Browser print-to-PDF inherits that view; no new PDF/Excel export feature is in scope.

ReportsBundle and relevant financial types support state and currency buckets. Layout/navigation/charts remain bounded to truth/disclosure corrections; no reporting product redesign.

## 5. CRM and customer timeline

### 5.1 customer_payment_events

customer_payment_events remains a CRM/timeline projection, not ledger authority.

The timeline may show:

- amount/currency/method/status;
- occurred_at;
- link/correlation to transaction where transaction_id is present.

It must not be independently summed for revenue, lifetime spend or “total paid”.

### 5.2 Lifetime spend and high-value segmentation

Current appointment-price-derived lifetimeRevenue, lifetimeSpend and averageLifetimeSpend in CRM/Summer are not financial truth.

Slice 2 rules:

- monetary lifetime spend remains UNKNOWN under Option A;
- customer profile must not render UNKNOWN as $0;
- “high value” may use non-financial visit frequency/recency until complete monetary history is proven;
- a monetary high-value segment must be held/hidden rather than computed from completed service prices;
- preferred service/staff/location, completed visit count and visit-based retention remain operational metrics.

**I5 — exact bounded threshold/default inventory:** `lib/crm/chase-hints.ts` uses `lifetimeRevenue >= 500`; `lib/crm/ai-knowledge.ts` uses `spend >= 200 OR visits >= 5`. Remove/hold the unsupported monetary thresholds while retaining visit-based segmentation, including the visits branch. Explicitly replace/guard the `retention.averageLifetimeSpend` zero-default so unknown lifetime spend stays UNKNOWN through payloads and rendering, never numeric 0. Tests must cover both thresholds and the retention default; no broader CRM redesign is authorized.

### 5.3 Customer account disagreement

Preserve projectCustomerAccountTotals behavior:

- no Math.max or heuristic winner across disagreeing sources;
- source disagreement remains visible;
- current outstanding is numeric only when complete, untruncated appointment/invoice/transaction sources agree;
- lifetime totals stay null/unknown.

### 5.4 Receipt relationship

The accepted canonical contract permits commerce_receipts.invoice_id = NULL. Any operator/accounting view requiring an invoice uses:

receipt.transaction_id -> commerce_transactions.id -> commerce_transactions.invoice_id -> commerce_invoices.id.

Do not add a direct receipt-invoice requirement or migrate accepted evidence in Slice 2.

## 6. Operator state: 2A visibility, 2B durable recovery

### 6.1 Shared client-safe DTO (2A)

A server-only adapter over `readPaymentObservability` and `readBookingOperationCanonical` supplies the canonical operator view. Proposed NEW `lib/commerce/operator-financial-state.ts` maps only necessary opaque operation/attempt references, operatorState, synchronization, moneyRecorded (including unknown), canonical amount/currency/method/kind, appointment reference, safe obligation/document summary, allowed next action and user-safe explanation. Browser-consumable type definitions must be safe leaf types, not imports that pull server-only modules into clients.

Omit raw event_sequence / events[].sequence from both payment-observability and booking-operation reader/history results, plus internal failure payloads, provider internals, credentials and other-Business data. Neither reader's event sequence may reach the browser/operator DTO. Receipt-to-invoice lookup follows receipt -> transaction -> invoice; direct receipt.invoice_id may remain NULL.

### 6.2 Canonical state authority

- NOT_RECORDED: canonical evidence confirms no money under this attempt. This alone is not blanket permission to mint a new attempt; apply the accepted operation/fingerprint/terminal rules.
- PAYMENT_RECOVERY_REQUIRED: resume/check the SAME operation and SAME attempt only when persisted/request fingerprint remains compatible.
- RECORDED_BUT_NOT_FULLY_SYNCHRONIZED: money exists; no recollection. Document/cache/CRM convergence is separate work.
- RECORDED: money exists and required synchronization is complete/not-required; no payment retry.
- UNKNOWN: HOLD / DO NOT RECOLLECT / DO NOT MINT NEW KEY. Check the same identity until authoritative resolution.

`recovery_disposition=RECOVER` never overrides RECORDED or otherwise authorizes collection by itself. Payment, synchronization and communications are three separate states. Explicit no-payment remains a non-payment outcome, not a failed payment.

### 6.3 Mandatory reread after every uncertain or terminal dispatch (2B)

After success, replay, KEY_CONFLICT, timeout, transport failure, mutation PENDING, close/reopen or reload, read the canonical SAME identity. The mutation return is a dispatch result, never final financial authority. Stale mutation PENDING must not downgrade canonical RECORDED/COMPLETE. If the reread fails, hold; an optimistic success/error string cannot unlock collection.

Changed payment fingerprint while the original may commit => HOLD, not a new attempt. Canonical state and accepted compatibility/closure rules decide next actions. Preserve #135: do not blindly clear `createSubmitGuardRef` on error; after uncertain dispatch, canonical read is the unlock/next-action authority.

### 6.4 Mandatory server-side same-operation resume (2B)

The current prepared runner needs the full original request and IDs; opaque browser recovery storage is intentionally insufficient to reconstruct it. A bounded server-side resume primitive in the existing `lib/commerce/booking-operations/kernel.ts` or proposed NEW `lib/commerce/booking-operations/recovery.ts` is **MUST CHANGE/ADD**, not optional:

1. Authenticate actor and resolve active Business server-side; browser-selected business_id is never accepted as authority.
2. Receive only opaque operation/attempt reference, validate its Business/actor access and identity relationship.
3. Load persisted operation request/details server-side from the accepted durable state; do not ask the browser to persist or resend PII for recovery. Missing/incompatible durable evidence means HOLD/UNKNOWN, not fabricated defaults.
4. Reconcile/resume only that operation and attempt through accepted kernel rules; no new attempt, customer or operation identity on timeout/conflict.
5. Perform the canonical reread and return only the client-safe DTO.

Reuse the accepted durable registry/functions and fingerprints. **NO NEW MIGRATION.** If implementation proves persisted state cannot safely support this contract, report that specific architecture blocker for separate review; do not silently add schema or weaken identity safety.

### 6.5 Recovery reference and submit lifecycle (2B)

Persist only opaque recovery reference/IDs in tab/session-scoped storage before dispatch, with server validation binding it to the current Business/actor. Keep it through timeout, close/reopen and reload while nonterminal. Do not store customer/payment PII, amounts, original requests or credentials in browser storage. Clear on logout/account-context change to prevent cross-context reuse; this does not cancel server state. Clear a current-context reference only after canonical terminal resolution or explicitly safe abandonment under accepted operation rules.

Book Another must be blocked while outcome is unresolved; once safe, clear/rotate **operation ID, attempt/payment identity and inline-customer UUID** together. A deliberate later equal-value payment gets a distinct identity only after the prior attempt is canonically settled/not-recorded under approved rules. A changed amount on a possibly committing operation is never Book Another authorization.

Retain #135's five established duplicate-submit/retry cases (section 12), synchronous submit guard, explicit Book Another reset, Location/customer choices and current navigation. No generic finally/error guard reset.

### 6.6 Inline customer durable bootstrap (2B)

Current Booking Sheet/customer section and Quick Appointment create inline customers before durable booking. In the new durable create branch, stage the draft locally and pass it with the canonical inlineCustomerId through accepted durable bootstrap. Do not create/delete a temporary customer. Match-required preserves the draft and requires selection through existing customer search; no silent duplicate creation. General CRM create and edit-booking behavior remain unchanged. Customer UUID rotates only with a safely new operation, not each render/retry.

### 6.7 Communications suppression at createBooking (2B)

The durable kernel calls `createBooking()` in `lib/booking-engine/mutations/create.ts`, which emits `appointment.created` through `emitBookingEvent`. `lib/booking-engine/events/emit.ts` installs the Communications bridge. It can insert notifications and enqueue send/reminder/webhook/calendar effects before payment closure. Skipping only `deliverBookingNotifications` / `sendPaymentReceiptNow` in the outer action is insufficient.

**MUST CHANGE:** an explicit persistence capability/default-closed signal suppresses lifecycle event emission **only for durable-operation persistence at the booking-engine create seam**. Carry it through the typed durable path; a channel-name heuristic is not an acceptable guard. Preserve normal legacy/session/public booking events and delivery behavior. Do not globally disable Communications.

The durable branch also skips outer booking delivery and receipt-send helpers. Synthetic acceptance must prove zero event-bridge invocations, notifications, send jobs/intents, email/SMS/provider calls, receipt send, reminders, webhooks and calendar-sync effects. Synthetic flags alone do not prove containment. Future communication activation follows canonical operation/payment closure and separate acceptance; `communication_eligibility="NOT_IMPLEMENTED"` is not delivery readiness.

### 6.8 Admission and explicit convergence (2B)

Current production dependency is hardcoded `admissionEnabled=false`. Define the server-only Business-scoped operation-admission/readiness seam needed for later synthetic UI acceptance; default CLOSED, browser cannot enable it. It may remain hardcoded false until a separately reviewed resolver is installed. Operation admission is separate from projection admission, worker activation and communication activation. No migration, Business enablement or new settings UI is authorized here.

Later approved synthetic operation execution uses an explicit operation/attempt-bound projector convergence path under existing projection admission/watermark rules, then canonical reread. Do not sweep obligations or call projectors from reads, Summer or recommendations. Failure/unknown convergence preserves recorded money and same identity. No worker is needed; real-Business enablement remains a later exact gate.

### 6.9 Bounded UI and responsive contract

Keep current Booking Sheet / Quick Appointment composition with persistent text such as “Payment recorded,” “Payment recorded — finishing invoice/receipt sync,” or “Payment status needs review — do not collect again.” Recovery routes through one canonical adapter. Appointment payment caches are display only.

The retained appointment drawer must disclose derived payment/cache state. Empty/failed recent-transaction reads do not prove no money exists. It cannot decide recovery from cache or maintain duplicate recovery logic; route to canonical operator state.

Acceptance at 390x844, 768x1024, 1280x800 and 1440x900 includes keyboard/focus, readable text states, no color-only certainty, no overflow/occluded actions, and no lost Location/customer selection or unexpected navigation.

## 7. Slice 2A Summer canonical truth

Real consumers include `lib/summer/tools.ts`, `lib/summer/orchestrator.ts`, `lib/crm/ai-knowledge.ts`, `lib/crm/ai.ts`, `lib/crm/chase-hints.ts` and the Commerce Summer snapshot in `lib/commerce/customer-account.ts`. Their payload/export/action boundaries must preserve canonical state, not just change visible dashboard labels.

- **UNDERSTAND:** consume canonical aggregate/attempt/operation state and governed current-account completeness; distinguish money, synchronization and delivery.
- **EXPLAIN:** state amount/time/method/currency only when canonical; explain HELD/UNKNOWN, pending projections and unknown lifetime history. No alternative appointment-price/CRM-event money truth.
- **RECOMMEND:** bounded human review of the same identity. Never recommend collection/deposit when operator state is RECORDED, RECORDED_BUT_NOT_FULLY_SYNCHRONIZED or UNKNOWN. Never treat communication_eligibility=NOT_IMPLEMENTED as send readiness.
- **ACT:** financial actions remain CLOSED. No autonomous payment/refund/recovery, invoice mutation, provider send, admission setter or projectPaymentObligation call.
- **AUDIT:** cite the same canonical evidence/state used by operators; no private AI financial state or unofficial subtotal.

Suggestions can describe pending synchronization, but cannot execute projectors/admission or bypass the separately authorized operator path. No worker/retry is activated by a Summer read or recommendation.

## 8. #153 security dependency map

#153 remains a separate security/permission program.

### Safe before #153 cutover

Provided current trusted server boundaries remain unchanged, Slice 2 may prepare/read-wire:

- the server-only canonical financial aggregate;
- the canonical #133/#158 readers;
- operator disclosure/recovery adapters;
- Reports/CRM/Summer reads through trusted server code;
- focused tests proving no service-role or raw financial-table authority reaches the browser.

This does **not** mean broad legacy ACL posture is accepted for launch.

### Must remain tracked for #153

- customer_payment_events.transaction_id inherited legacy table privileges;
- SEQ-ACL-1: global event sequence anon/authenticated USAGE+SELECT due default ACL, UPDATE=false;
- financial tables with broader-than-desired ACL/default-ACL/FORCE-RLS posture;
- legacy NULL-attempt / NULL-appointment / deletion and mutation residuals already identified in #134/#153 work;
- replacement writer inventory for all supported active write paths;
- server RPC/browser EXECUTE posture after cutover, including the source-confirmed invoice-sequence/browser privilege issue;
- service_role bypass behavior and SECURITY DEFINER/INVOKER ownership/search_path requirements.

### Must wait for #153 or its separately accepted cutover

- revoking legacy writes relied upon by still-active surfaces;
- FORCE RLS changes;
- default ACL correction;
- sequence ACL changes;
- replacement-writer-only enforcement in Production;
- real-Business worker activation dependent on those permissions.

**No #153 permission migration or cutover belongs in Slice 2A/2B.** Server read/adapters may precede it with actor/Business authorization and immutable business_id scope; real-Business writer/permission cutover remains separately governed. A newly proven inability to separate is a future architecture blocker, not permission to combine work here.

## 9. Worker and admission boundary

No worker activation in 2A or 2B. Real-Business operation admission stays default-off, and projection admission remains independently governed. C03 is retained with admission disabled; all retained historical cohorts remain excluded. No background sweep of PENDING obligations or automatic retry on uncertain money/projection transport is permitted. Explicit projector convergence belongs only to the exact separately authorized operation-bound acceptance flow in section 6.8.

Existing five-minute Vercel cron / background-worker infrastructure is a later activation consideration, not absence of infrastructure. Preserve `vercel.json` and `app/api/cron/process-jobs/route.ts`; no cron/feature gate is enabled by this design. Before future worker activation: complete replacement-writer inventory, independently accepted #153 dependencies, durable retained-cohort exclusion, accepted admission/watermark semantics, concurrency/failure/recovery proof, separate communications/provider acceptance, explicit runtime cron/feature gates and exact Product Owner activation approval are required. Summer and recommendation paths cannot invoke projectors or admission setters.

## 10. event_sequence privacy

Current source trace found event sequence inside the private server-side payment-observability schema but no current browser/tenant consumer.

Classification: **DESIGN FOR NOW / BUILD LATER**.

Slice 2 must:

- omit raw sequence from the new operator DTO;
- avoid adding it to Reports/CRM/Summer/browser props;
- add a source/unit regression proving the operator mapper does not expose sequence from **both** the payment-observability reader and booking-operation reader/history results (I4); neither may reach any browser/operator DTO.

If implementation-time inventory finds an existing tenant/browser surface that renders raw sequence, that becomes a LAUNCH REQUIRED bounded privacy correction before Slice 2 acceptance. Do not infer an exploit from the sequence ACL alone.

## 11. Proposed future implementation allowlists — separate 2A / 2B gates

These are design-only candidate paths, not edit permission in this task. **Only this design file changes now.** Existing paths below must exist; paths explicitly marked **NEW** are proposed future files and must remain absent in this correction. Use shared leaf types/adapters rather than repeated local truth logic. A path needed by both slices has separate bounded responsibilities.

### Slice 2A — MUST CHANGE / ADD

- **NEW** `lib/commerce/financial-aggregate/types.ts`, `lib/commerce/financial-aggregate/reader.ts`, `lib/commerce/financial-aggregate/index.ts`: server-authorized complete consistent evidence, closed-world predicate, currency/period/Location/refund truth. **NEW** `tests/unit/commerce/financial-aggregate.test.ts` proves the contract.
- `lib/actions/reports.ts`, `lib/reports/compute.ts`, `lib/reports/types.ts`, `components/reports/reports-hub.tsx`: canonical Collected fields, bounded/held dimensions and growth, E1-B, CSV + browser-print states; explicitly hold/relabel giftCardRevenueCents / membershipRevenueCents as non-collected or remove them from collected-money views. CSV “Membership Revenue ($)” / “Gift Card Revenue ($)” must not retain “Revenue” labels for noncanonical collected-money values. Preserve I2's explicit legacy-field distinctions.
- `lib/commerce/dashboard.ts`, `lib/commerce/types.ts`, `components/commerce/payments-dashboard.tsx`, `lib/actions/commerce.ts`, `lib/commerce/index.ts`: remove parallel dashboard money reducer and propagate canonical types/export surface. **NEW** `tests/unit/commerce/financial-dashboard.test.ts`.
- `components/ui/money.tsx` — `Money`: **MUST CHANGE** shared EXACT / HELD / UNKNOWN rendering boundary; numeric formatting only for EXACT, explicit status for null/HELD/UNKNOWN, compatible ordinary exact cents/dollars callers. **NEW** `tests/unit/ui/money.test.tsx`: focused null/absent, HELD, UNKNOWN, EXACT and genuine-zero/ordinary-caller rendering coverage.
- `lib/actions/command-centre.ts`, `lib/dashboard/command-centre.ts`, `components/dashboard/command-centre.tsx`: CommandCentreMoneyView/render propagation; preserve Business-wide scope/disclosure.
- `lib/actions/reception.ts`, `components/reception/business-brief.tsx`, `lib/actions/morning-brief.ts`, `components/day-view/morning-brief.tsx`: canonical/held money, separate operational counts/utilization.
- `lib/actions/appointments.ts` (2A dashboard-stat money only), `app/(dashboard)/dashboard/calendar/page.tsx`, `lib/dashboard/insights.ts`: canonical/held calendar money; no 2A booking writer activation.
- `lib/booking-engine/queries/range.ts`, `lib/chase/analytics.ts`, `lib/chase/insights.ts`, `lib/chase/types.ts`, `components/chase/chase-ops-workspace.tsx`: distinguish operational service value from financial money and propagate canonical/held KPIs/deltas.
- `lib/crm/service.ts`, `lib/crm/types.ts`, `lib/actions/crm.ts`, `lib/crm/ai-knowledge.ts`, `lib/crm/ai.ts`, `lib/crm/chase-hints.ts`, `components/crm/customer-insights.tsx`, `components/crm/chase-crm-panel.tsx`: Option-A lifetime unknown, timeline projection only, visit-based hints, safe payloads/formatting.
- `lib/actions/customers.ts`, `components/reception/customer-preview.tsx`: unknown lifetime money and preserved operational visits.
- `lib/employees/service.ts`, `lib/employees/types.ts`, `components/employees/employee-performance.tsx`, `lib/commerce/recognize.ts`: E1-B completed-only service-price value, remove misleading financial-authority wording/use; no numeric commission.
- `lib/summer/tools.ts`, `lib/summer/orchestrator.ts`, `lib/commerce/customer-account.ts`: canonical/held wording/status through actual Summer consumers, preserving Option-A reconciliation.
- **NEW** `lib/commerce/operator-financial-state.ts`, **NEW** `tests/unit/commerce/operator-financial-state.test.ts`: canonical read-only DTO, authority/privacy/status mapping; safe shared client type boundary as needed in existing Commerce leaf types.
- `components/day-view/appointment-drawer.tsx`, `components/booking-sheet/payments-section.tsx`: retained launch surfaces get bounded non-authoritative cache wording/canonical-state routing, no independent recovery or 2A writer activation.
- `tests/unit/commerce/customer-account.test.ts`, `tests/unit/commerce/customer-account-unknown.test.tsx`: preserve current Option A. Existing focused Reports/CRM/Summer/Command Centre/employee tests gain state/formatter coverage at the later gate; exact additions must be named before implementation.

### Slice 2B — MUST CHANGE / ADD

- `lib/actions/appointments.ts`: only fresh create's durable operation adapter, canonical reread and default-closed communications; preserve edit-booking updateAppointment and legacy/session/public semantics.
- `lib/commerce/booking-operations/kernel.ts`, `lib/commerce/booking-operations/types.ts`: same-identity persisted-request resume, canonical response, explicit admission/readiness interface and operation-bound convergence. Proposed **NEW** `lib/commerce/booking-operations/recovery.ts` may house the mandatory resume logic instead of enlarging kernel; functionality is mandatory, module choice is bounded implementation detail.
- `lib/booking-engine/mutations/create.ts`, `lib/booking-engine/types.ts`: explicit typed durable-persistence capability suppressing lifecycle event emission at createBooking. No broad channel heuristic or global communications disable.
- `components/booking-sheet/booking-sheet.tsx`, `components/booking-sheet/customer-section.tsx`, `components/reception/quick-appointment.tsx`: staged inline customer, durable bootstrap, opaque recovery persistence/resume, canonical reread, #135 guard, Book Another rotation and shared disclosure.
- `components/booking-sheet/payments-section.tsx`, `lib/commerce/operator-financial-state.ts` (NEW in 2A): only required shared state/action propagation; no second recovery formula.
- `tests/unit/reception/payment-result-disclosure.test.tsx`: canonical outcome/lost response and no recollection. Proposed **NEW** `tests/unit/commerce/booking-operation-recovery.test.ts`, **NEW** `tests/unit/booking-sheet/durable-booking-recovery.test.tsx`, **NEW** `tests/unit/commerce/durable-booking-communications.test.ts`: same-identity server resume, inline match/bootstrap, browser lifecycle/#135 cases and zero-effect create-seam proof. These tests are future requirements, not files created now.

### MAY CHANGE — only on demonstrated bounded need

- `lib/commerce/money.ts`: expose/reuse raw supported-key metadata only if needed; keep raw numeric formatting and unrelated formatting semantics. State-aware rendering belongs to `components/ui/money.tsx`; never make `normalizeCurrency` classify canonical evidence.
- `lib/booking-engine/events/emit.ts`, `lib/notifications/booking-delivery.ts`: bounded instrumentation only if needed for zero-effect tests; no delivery redesign/activation.
- Existing focused test locations or a narrowly named shared financial-period helper: record exact path/responsibility at the later per-slice gate. No unrelated source expansion. A listed path may be dropped only with proof no reachable money/recovery consumer requires change.

### MUST NOT CHANGE / NO NEW MIGRATION

- Any existing/applied #133/#158/#134 migration, or any new migration/SQL/RPC for this slice.
- #153 ACL/RLS/FORCE-RLS/default-ACL/sequence controls; #152 historical USD data; refund/provider writers; receipt independence; multi-location relationships; M1A/M1B/#121 accepted behavior.
- Communications/provider adapters or activation, worker loops/cron activation, real GVM/Chasum HQ data, C01/C02/C03 packages/evidence/retained state.
- `release/candidates.json`, `.github/workflows/release-production.yml`, other Production release controls.

**Migration ruling: NO NEW MIGRATION.** Reuse accepted #133/#158 schema. Do not change applied replay SQL to cosmetically replace stale PENDING; canonical read resolves authority. Any future DB aggregate, immutable collection Location or newly proven schema insufficiency needs a separate architecture/migration gate outside 2A/2B.

### Prerequisite stack and evidence freshness

The earlier source review observed main at `31115e6a51b71fc097c279d205065d80e0be3573`; it is a dated observation, not a current-main assertion. On 2026-10-10, read-only `git ls-remote origin refs/heads/main` failed because github.com could not resolve. Remote-main freshness remains UNKNOWN; no reset/fetch/environment mutation is inferred or required for this frozen documentation correction. #131 remains the accepted Production application baseline in continuity evidence; current serving identity was not reverified here.

Both slices are stack-dependent on accepted-but-unmerged #133/#158/#134 foundations, including commerce_booking_operations, customer_payment_events.transaction_id, canonical readers/projectors and durable operation functions. Do not cherry-pick/merge ahead of foundations or deploy before the governed schema/application sequence. Later implementation preflight narrowly refreshes affected source/remote scope; no repeat broad investigation now. Main merge is never Production authorization; exact allowlisted SHA and protected production-release PO approval remain required.

## 12. Future per-slice acceptance matrix — NOT RUN by this correction

### 2A truth and visibility

- **I1 pre-coding feasibility / PO disclosure:** identify the existing bounded consistent read that returns transactions + refund veto + appointment/Location attribution together. If none is feasible, disclose that affected collected-money scopes will visibly be UNKNOWN in v1 unless a separate architecture/migration gate approves a DB-side aggregate. Do not code around this with independent reads or silently expand 2A's no-migration scope.
- **Aggregate:** succeeded/manual/payment-or-deposit with supported tender and coherent identities is EXACT only on complete evidence. Coherent failed/canceled non-collections exclude; pending/requires_action/refunded/partially_refunded/unknown status, unsupported provider/kind/method, invalid amount/currency/identity HOLD. Test gift_card/store_credit methods on otherwise valid succeeded payments.
- **Refund veto:** relevant commerce_refunds row with still-succeeded transaction, refund outside transaction period, non-succeeded refund evidence and positive contradictory appointment amount_refunded_cents all HOLD. Unreadable refund evidence is UNKNOWN. No netting.
- **Completeness:** complete bounded consistent single read, empty exact zero; cap/truncation/error/incomplete nested evidence UNKNOWN. Multi-request count/keyset/ordinary pagination never proves EXACT. No new migration/RPC.
- **Currency/time:** all five raw supported keys; malformed/uppercase/unsupported strings never normalize to USD; separate currency buckets and held single-number view. Business-timezone midnight/DST and [from,to) boundaries agree across Reports/Commerce/briefs, unaffected by appointment start_time/server timezone.
- **Location:** supported unbound money can be Business-wide exact but HOLDS requested Location result; missing/cross-Business/contradictory links HOLD. Current appointment-location edits move historical attribution as disclosed. No default/home fallback or filtering away unresolved evidence.
- **Reporting/dimensions (I2):** canonical Collected totals; divergent CRM events/prices cannot change them; counts/popularity/utilization remain. Prove legacy `buildFinancial` payments/refunds/outstanding remain identified as payment-event related, `invoicesCents` as appointment-recognized money, and `taxesCents` / `discountsCents` / `depositsCents` as appointment-column values; configured `deposit_cents` is not collected money. No silent Collected interpretation. Unsupported financial dimensions HOLD/relabel without attribution engine. Held bucket has no unofficial subtotal and does not disable unrelated operational reports. Growth requires comparable exact inputs.
- **E1-B (I3):** paid-but-not-completed rows contribute zero to the operational service-value measure; completed rows use the explicitly stated appointment/service-price basis, not collected amount. The 2A gate must disclose/test the change for completed-but-partially-paid rows when replacing `appointmentRecognizedCents`, and `appointmentPriceCents` fallback to current `service.price` for null/zero `price_cents`; no silently inherited basis. Commission always unavailable/not configured, never numeric $0. Staff reassignment introduces no payroll logic. E1-B remains approved and closed.
- **Transport/render/export (B6):** CommerceDashboardSnapshot, ChaseCommerceMetrics, CommandCentreMoneyView, Reports/CRM/Summer payloads, shared formatter callers, CSV and browser print preserve HELD/UNKNOWN and currency. No null-to-zero, NaN, blank certainty or crash. Reports gift-card liability consumption / active-membership price are explicitly non-collected or HELD/removed; CSV “Membership Revenue ($)” / “Gift Card Revenue ($)” must not continue saying “Revenue” for noncanonical collected-money values.
- **Shared Money renderer (B7):** `components/ui/money.tsx` accepts EXACT / HELD / UNKNOWN. Focused tests prove null/absent amount becomes UNKNOWN status, HELD/UNKNOWN render status text without invoking numeric formatting, and valid EXACT values alone format numerically, including true zero. Existing ordinary exact cents/dollars callers stay usable. Never render unknown as $0/NaN/blank certainty; `lib/commerce/money.ts` stays raw numeric formatting and `normalizeCurrency` never classifies evidence.
- **CRM/accounts/documents (I5):** payment timeline remains display; no double count; lifetime spend stays UNKNOWN under Option A. Remove/hold `lib/crm/chase-hints.ts`'s `lifetimeRevenue >= 500` and `lib/crm/ai-knowledge.ts`'s `spend >= 200` monetary branches; retain visit-based segmentation, including `visits >= 5`. Test `retention.averageLifetimeSpend` zero-default handling so unknown never renders as 0. Current balance requires complete agreeing sources; disagreement/truncation holds. NULL receipt.invoice_id resolves via transaction -> invoice. No CRM redesign.
- **Operator/privacy (I4):** canonical state, safe next action and RECOVER-vs-RECORDED authority; explicit omission regressions cover **both** payment-observability reader event sequence and booking-operation reader/history event sequence. Neither events[].sequence/raw sequence reaches a browser/operator DTO; no credentials, internal payloads or cross-Business data.
- **Summer/drawer:** actual tools/orchestrator/CRM/Commerce consumers share truth; financial ACT/projector/admission paths closed. No collection recommendation for RECORDED, RECORDED_BUT_NOT_FULLY_SYNCHRONIZED or UNKNOWN. Empty/failed drawer transaction list cannot imply no money; derived cache never drives recovery.

### 2B durable create and recovery

- **Booking outcomes:** supported synthetic CAD100 service with CAD50 E-Transfer deposit, full payment and explicit no-payment outcomes; one operation/customer/appointment/attempt and at most one money effect per identity. C03 provides historical evidence only and is never rerun.
- **Reread authority:** success/replay/KEY_CONFLICT/timeout/transport failure/mutation PENDING all canonical-reread the same identity; stale PENDING never downgrades COMPLETE. RECOVER alone cannot permit collection after RECORDED.
- **Server resume:** opaque-reference-only recovery authenticates actor, resolves Business, loads persisted original request/details and resumes same operation/attempt. Unauthorized Business/actor, mismatched references or fingerprint change HOLD/deny; no browser business_id authority or new key on uncertainty.
- **Lifecycle:** reference persisted before dispatch, retained across timeout/close/reopen/reload, cleared only on safe terminal/abandonment or logout/account-context isolation. No PII in storage. Book Another safely rotates operation/attempt/inline-customer IDs; later deliberate equal-value payment is distinct only after prior canonical resolution.
- **#135:** preserve all five accepted overlap/same-sheet retry cases, not only double-click; no blind createSubmitGuardRef error/finally reset. Canonical read controls unlock after ambiguous dispatch. Preserve current navigation/Location/customer selection.
- **Inline customer:** local staged draft, accepted durable bootstrap UUID, replay reuse and match-required retaining draft/using existing search. No eager temporary create/delete; general CRM create/edit-booking unchanged.
- **Communications:** source and execution tests prove suppression at createBooking durable persistence before bridge effects; zero bridge, notifications, send jobs/intents, email/SMS/provider, receipt-send, reminders, webhooks and calendar sync. Legacy/session/public booking communications remain unchanged.
- **Admission/convergence:** server-only Business seam defaults CLOSED, browser cannot enable; operation admission independent of projection/worker/communications. Later approved synthetic flow explicitly projects only its own obligations, rereads canonical truth and preserves money on sync failure. No worker, sweep, Summer projector or admission call.

### Shared gates

- M1A/M1B/#121 location/mobile behavior, #135, public booking, edit-booking updateAppointment, normal GVM-like/HQ-like synthetic tenants and future tenant architecture remain preserved.
- Responsive/accessibility acceptance: 390x844, 768x1024, 1280x800, 1440x900; no overflow, occlusion, lost selections, color-only status or keyboard/focus regression. Demonstrate competitive parity floor and intended recovery advantage, not just code/tests/build.
- Focused tests/type/build checks are future implementation evidence. No runtime/test-code change or test execution is claimed by this documentation correction. Local/disposable DB proof only under its later appropriate gate if source/unit evidence is insufficient; no new schema or accepted-proof rerun.
- Hosted synthetic/operator acceptance requires a fresh exact package and PO execution gate after implementation review. No C01/C02/C03 reuse/cleanup; retained cohorts excluded and C03 admission remains disabled.
- #152 repair, #153 cutover, worker/provider/communications activation, Production/GVM and technician resumption remain outside these acceptance claims. Release candidate/workflow controls must be unchanged.

## 13. Non-goals and regression guards

Must not change:

- GVM Baby World architecture/data during development;
- Chasum HQ’s status as a normal tenant;
- future-tenant reusable behavior;
- accepted invoice/receipt accounting contract;
- receipt independence from direct invoice_id;
- accepted multi-location service/staff relationship truth;
- M1A, M1B, #121 mobile/location behavior;
- booking/calendar navigation architecture, #135 five duplicate-submit/retry cases and never-clear-on-error guard;
- public booking and edit-booking updateAppointment path;
- legacy/session/public communications behavior outside explicit durable-create suppression;
- release/candidates.json and .github/workflows/release-production.yml;
- payment provider integration;
- communications activation;
- worker activation;
- #152 historical USD repair;
- #153 permission cutover;
- Production state;
- C03 retained synthetic evidence/state;
- C01/C02/C03 evidence or run identity;
- C01/C02/C03 execution — never rerun.

Regression rules:

- one Business cannot influence another Business aggregate;
- location scope cannot fall back to home/default for ledger rows without appointment location truth;
- a missing CRM projection cannot erase recorded collected money;
- a complete CRM projection cannot create collected money absent canonical ledger;
- document synchronization cannot determine whether money exists;
- UI cannot convert HELD/UNKNOWN into numeric zero or an instruction to recollect;
- Summer cannot create a parallel financial truth.

## 14. Product Owner decisions — locked

**PRODUCT OWNER DECISION — E1-B APPROVED FOR CHASUM V1.** No outstanding E1 decision. No new consequential product decision is introduced by this correction.

Employee Completed service value is completed-only operational appointment/service-price value. The paid-but-not-completed behavior of appointmentRecognizedCents must not survive under that label. Do not silently change the amount basis to ledger collections or add tax/tip/refund/deposit/partial-payment calculations. This is neither accounting revenue, collected money nor a commission base.

No numeric commission in Slice 2: unavailable/not configured, NEVER $0 for absent policy. Future tenant-configurable compensation may address taxes, tips, deposits, partial payments, refunds/clawbacks, discounts, timing, employee attribution and multi-staff policy, but is DESIGN FOR NOW / BUILD LATER. No GVM-specific rule, Option-C engine or payroll attribution is included, and a full commission system is not required for GVM Operational Acceptance.

Approved 2A/2B separation and design correction do not grant implementation. Each slice still needs its final exact Product Owner implementation gate following independent review. Existing ledger authority, Option A, receipt independence, #153 separation, no activation, C03 consumption/retention and governed release decisions remain locked. New architecture blockers, if actually demonstrated later, must be stated specifically; do not invent a routine PO decision now.

## 15. World-class, Summer and commercial check

### Trust and speed

The operator sees one answer to the most important question: “Was the money recorded?” The system recovers the same identity instead of asking the operator to guess, re-enter or recollect. Reports, CRM and Summer stop disagreeing.

That is stronger than adding more payment features because it makes the existing workflow dependable.

### Stripe-like financial discipline

- one ledger authority;
- idempotent identity;
- unsupported shapes fail closed;
- currencies never silently combine;
- projections cannot manufacture/erase money;
- uncertainty produces hold/recovery, not recollection.

### Summer advancement

Summer UNDERSTAND/EXPLAIN/RECOMMEND consumes the same business truth as humans, with auditability and explicit unknowns. ACT remains permissioned future work. This advances the AI Business Manager direction without turning Summer into a chatbot with its own private financial math.

### Commercial launch

Classification: **LAUNCH REQUIRED** for trustworthy financial operation.

Deferring it creates a high retrofit risk: every additional report/AI/CRM consumer built on legacy appointment-price or CRM-mirror money would deepen a second-truth architecture and make later migration more dangerous.

## 16. Exact next gate and current delivery boundary

1. **Claude Opus 5 High exact-candidate review** of the corrected document and local commit/tree/hash is next. Prior reviews are correction evidence, not acceptance of the new candidate. No new Claude execution/result is claimed by this document.
2. Reconcile bounded design deltas without another routine approval; targeted Grok/Cursor delta checks only if useful after Claude.
3. After independent design acceptance, prepare separate final Product Owner implementation gates for 2A and 2B with exact paths/tests. The 2A gate explicitly carries I1–I5 from section 12, including pre-coding consistent-read feasibility and the visible UNKNOWN consequence, the legacy `buildFinancial` inventory, the disclosed/tested E1-B operational value basis, omission of both readers' event sequences, and the CRM monetary thresholds/retention zero-default. **Implementation NOT authorized now.**
4. Design acceptance does not authorize hosted financial execution, migrations/SQL, #153 cutover, workers/providers/communications, push/merge/deploy, Production/GVM or technician resumption.

The present correction edits this document only and records its approved design; it does not update control board/handoff/manifest/changelog or mutate accepted runtime evidence. Local diff/path/scope validation and the one authorized documentation commit are the delivery evidence. The GVM technician CAD50 deposit/confirmation discrepancy remains the primary open operational objective.

This design is not implementation approval, merge approval, Staging mutation authority or Production release authority.

SLICE2_CORRECTED_DESIGN_READY_FOR_EXACT_CANDIDATE_REVIEW
