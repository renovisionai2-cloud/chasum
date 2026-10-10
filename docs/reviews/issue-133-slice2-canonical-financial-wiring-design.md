# Issue #133 Slice 2 — canonical financial truth, Reporting, CRM and operator wiring

**Status: SLICE2_DESIGN_READY_FOR_INDEPENDENT_REVIEW.**
**Authority:** design only; not implementation approval, not a runtime activation, not a financial execution gate and not a release gate.

This design is the smallest launch-safe bridge from the accepted #133/#158 connected backend proof into truthful Chasum operator, Reporting, CRM and Summer reads. It preserves the accepted backend contract and deliberately avoids a second financial formula, worker activation, provider activation and #153 permission cutover.

The accepted C03 run HV133-158-20261009-C03-9b8c5783 is CONSUMED and must never be rerun. C01/C02 remain consumed STOP_ZERO_WRITES history and must never be rerun or reused.

## 1. Status, launch classification and scope

### LAUNCH REQUIRED — BUILD NOW after independent review and Product Owner implementation approval

The following Slice 2 outcome is LAUNCH REQUIRED because Chasum cannot credibly launch a connected payment/booking workflow while different departments calculate “revenue” or payment truth differently:

- one canonical ledger aggregate over commerce_transactions for collected-money totals;
- Reporting financial totals re-sourced to that aggregate;
- operator booking/payment outcome and recovery state derived from the canonical #133 reader rather than appointment cache or mutation-return guesses;
- CRM payment timeline explicitly treated as projection/display rather than financial authority;
- Summer/Chase financial explanations consuming the same governed financial truth;
- truthful HOLD/UNKNOWN behavior for unsupported money shapes and incomplete historical knowledge.

Launch risk if deferred: **RED for financial trust / AMBER for general feature breadth.** The product can continue development, but commercial v1 must not present contradictory revenue, customer spend or payment-recovery answers as authoritative.

Acceptance condition: supported manual CAD booking payments show one consistent money truth across Booking Sheet / Quick Appointment outcome, Commerce/Command Centre, Reporting, CRM timeline/account views and Summer explanations; unsupported/ambiguous scopes hold instead of inventing totals; no duplicate collection is invited after uncertain responses.

### DESIGN FOR NOW / BUILD LATER

- raw global event_sequence privacy hardening, provided it remains internal and omitted from all tenant/operator DTOs;
- automated projection worker / queue activation;
- broader refund/provider/currency support beyond the accepted bounded positive set;
- evidence-schema enhancement to echo Business protection flags directly.

### BACKLOG / DEFER FOR THIS SLICE

- historical USD repair (#152);
- provider card/payment integration;
- autonomous Summer financial actions;
- financial transfer/merge/offboarding;
- broad Reporting redesign;
- calendar or Reception redesign;
- communications automation.

### Competitive Product Gate

The existing approved docs/reviews/issue-134-booking-deposit-competitive-gate.md remains applicable to the Booking Sheet / Quick Appointment payment and recovery experience. Slice 2 preserves that contract: clear booking/payment identity, no recollection after uncertain money state, one coherent operator flow and explicit money-versus-synchronization status.

No fresh competitive research is required for this bounded truthful wiring. A materially new Reporting dashboard, payment dashboard redesign, or new operator workflow beyond truthful state/recovery would require a fresh Competitive Product Gate before implementation.

## 2. Current source map

| Surface | Exact source / function | Current truth source | Classification | Risk if unchanged | Slice 2 treatment |
| --- | --- | --- | --- | --- | --- |
| Canonical payment attempt reader | lib/commerce/payment-observability/reader.ts — readPaymentObservability | #133 canonical RPC read_payment_observability_v1 | Canonical, unwired | Trusted truth exists but operators do not consume it | Wrap in a narrow operator DTO and make it authoritative after submit/replay/reload |
| Canonical payment types | lib/commerce/payment-observability/types.ts | attempt, ledger, obligations, operator_state, synchronization | Canonical internal | Raw event sequence/internal fields could leak if exposed directly | Keep server-internal; operator DTO omits event sequence and unnecessary internals |
| Canonical booking operation reader | lib/commerce/booking-operations/kernel.ts — readBookingOperationCanonical / listBookingOperationHistory | #158 durable operation reader | Canonical, unwired | Lost response/reload cannot currently resume from existing UI identity alone | Add a same-identity recovery adapter; never mint a new payment identity merely because response was lost |
| Prepared durable booking writers | lib/commerce/booking-operations/kernel.ts — runPreparedBookingSheetOperation / runPreparedQuickAppointmentOperation | accepted #158 durable operation kernel | Prepared/unwired | Current app create path remains legacy split booking + payment behavior | Future implementation must wire only through reviewed canonical path; dependent on prerequisite stack |
| Current app booking mutation | lib/actions/appointments.ts — createAppointment | createBooking then optional post-booking payment logic | Legacy application writer | Appointment can succeed before optional payment path; result/retry semantics are not the accepted C03 operation contract | Replace the fresh-booking payment branch with the prepared durable-operation adapter under a separately approved implementation |
| Booking Sheet UI | components/booking-sheet/booking-sheet.tsx | createAppointment/updateAppointment + payment_idempotency_key | Legacy UI entry | Can only reason from action result/cache, not canonical recovery read | Preserve layout; store/retain operation/payment recovery identity and render canonical operator state |
| Quick Appointment UI | components/reception/quick-appointment.tsx | createAppointment + payment_idempotency_key | Legacy UI entry | Same uncertain-response/reload gap | Same canonical recovery adapter and state component; no separate financial logic |
| Booking payment summary | components/booking-sheet/payments-section.tsx | appointment.payment_status/cache | Derived projection/cache | Cache can lag canonical money/synchronization | Keep as display summary only; recovery/action decisions come from canonical operator DTO |
| Appointment drawer | components/day-view/appointment-drawer.tsx | appointment.payment_status/cache | Derived projection/cache | Can look authoritative when synchronization is incomplete | Display cache with bounded wording; no recovery decision from cache alone |
| Reports action | lib/actions/reports.ts — getReportsBundle | customer_payment_events + appointment rows | Legacy/projection/appointment mix | CRM mirror or appointment price can become financial authority | Re-source financial collected-money fields to one canonical aggregate |
| Reports compute | lib/reports/compute.ts — buildRevenueBreakdown / buildFinancial | appointment recognized revenue + payment-event projection | Legacy financial formula | Multiple “revenue” definitions; refund/outstanding ambiguity | Separate operational appointment metrics from canonical collected-money report inputs |
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
| Employee performance | lib/employees/service.ts lifetimeRevenue + lib/employees/types.ts → components/employees/employee-performance.tsx | appointmentRecognizedCents | Legacy staff monetary claim | Employee Lifetime revenue can contradict canonical collected money | Subject to Product Owner decision E1 in section 14; never leave current label/formula silently |
| Reports employee commission | lib/reports/compute.ts commissionCents | appointment-derived report revenue | Staff-pay-adjacent legacy formula | Commission can be derived from a noncanonical money base | Subject to Product Owner decision E1; HELD unless the approved basis is provably satisfied |
| Chase revenue pace | lib/booking-engine/queries/range.ts utilization revenue → lib/chase/analytics.ts / lib/chase/insights.ts / lib/chase/types.ts | service/catalog appointment value | Legacy monetary KPI | Chase can say revenue up/down from non-ledger value | Re-source money KPI to canonical aggregate or explicitly relabel as nonfinancial service value |
| Calendar dashboard money | lib/actions/appointments.ts dashboard stats → app/(dashboard)/dashboard/calendar/page.tsx → lib/dashboard/insights.ts | sumRecognizedRevenueDollars | Legacy monetary KPI | Calendar can say Completed revenue today from appointment estimates | Re-source money fields to canonical aggregate; operational appointment metrics remain separate |
| Chase workspace | components/chase/chase-ops-workspace.tsx | numeric Chase/Commerce revenue fields | Consumer | Can render held/legacy values as exact currency | Propagate EXACT/HELD/UNKNOWN; never format held as zero |
| CRM monetary types/UI | lib/crm/types.ts + components/crm/customer-insights.tsx + components/crm/chase-crm-panel.tsx | numeric lifetime revenue/spend | Legacy numeric-only contract | UI cannot represent Option-A unknown truth | Make monetary fields nullable/held-aware and render truthful unknown state |
| Communications | lib/actions/appointments.ts calls deliverBookingNotifications and optional sendPaymentReceiptNow; lib/booking-engine/events/emit.ts installs communications booking bridge | existing booking event + delivery pipeline | Separate accepted domain | New canonical fresh-booking path could create provider/send effects before communications acceptance | MUST have a server-controlled default-closed canonical-flow communication boundary; legacy normal booking delivery remains untouched until separate activation. Slice 2 acceptance must prove zero send/provider side effects |

The source inventory must be rerun narrowly at implementation start to catch changes after this design commit. Newly discovered launch-critical money surfaces listed above are now inside the prepared scope; the preflight remains a regression guard, not permission for unrelated scope expansion.

## 3. One canonical financial aggregate contract

### 3.1 Authority

Create one shared server-only financial aggregate layer over public.commerce_transactions. Suggested module family:

- lib/commerce/financial-aggregate/types.ts — NEW
- lib/commerce/financial-aggregate/reader.ts — NEW
- lib/commerce/financial-aggregate/index.ts — NEW

The exact final filenames are an implementation detail within the prepared allowlist; the architecture is not: **every financial collected-money KPI must consume one aggregate implementation.**

The aggregate is financial authority for supported recorded money. It does not infer money from:

- customer_payment_events;
- appointments.amount_paid_cents / payment_status;
- invoice.amount_paid_cents;
- receipts;
- completed appointment prices;
- service catalog prices;
- reconciliation obligation completion.

Those are projections, documents or operational facts.

### 3.2 Input contract

FinancialAggregateRequest:

- businessId — required;
- from / to — optional bounded time interval over commerce_transactions.occurred_at;
- customerId — optional;
- locationId — optional;
- expectedCurrency — optional when caller requires one Business currency;
- purpose — reporting / dashboard / reception / customer / summer, for diagnostics only; it must not change math.

All reads are Business-scoped first. The aggregate is server-only: resolve the authenticated actor and Business first, then use a trusted server/service client with an explicit immutable business_id filter on every ledger/appointment read. The browser never supplies authority by choosing a businessId, and no browser receives a service-role credential. This follows the accepted private #133 reader pattern and keeps the aggregate independent of later #153 browser-ACL revocation. Cross-tenant tests are mandatory.

### 3.3 Location truth

Location attribution comes only through a transaction’s appointment_id joined to appointments.location_id for the same Business.

Rules:

- a transaction with a valid appointment link may contribute to that appointment Location;
- a customer-only transaction with appointment_id NULL is Business-level only and must not be silently assigned to the active/default Location;
- a Location-scoped request excludes Business-level/unattributed money from the numeric Location total and returns a held/unattributed indicator if such rows are material to the requested financial question;
- mismatched Business/appointment/location evidence fails closed to HELD.

This preserves the existing multi-location architecture and avoids adding location_id to the ledger in Slice 2.

### 3.4 Supported positive revenue set

For launch Slice 2, a transaction is positively includable only when all applicable conditions are true:

- business_id matches the requested Business;
- status = succeeded;
- provider = manual;
- kind is payment or deposit;
- currency is valid lowercase ISO-style three-letter data and remains explicit;
- amount_cents is a valid positive integer;
- when payment_attempt_id is present for the canonical flow, its accepted #133/#158 identity/attribution remains coherent;
- any required Location join is coherent.

This mirrors the bounded manual-ledger contract already accepted by #133/C03. It does not silently “learn” unsupported money.

### 3.5 HOLD / UNKNOWN set

If the requested scope contains a transaction whose financial treatment is not explicitly supported, the aggregate does not silently include it, silently omit it, or net it. It returns HELD/UNKNOWN for the affected financial scope.

This includes, until separately designed and accepted:

- provider other than manual;
- refund, void, adjustment, store_credit or gift_card kinds;
- partially_refunded/refunded or other unsupported statuses;
- unsupported provider state;
- malformed or conflicting currency;
- cross-currency scope where the consumer requires one numeric total;
- attribution contradiction;
- rows whose treatment depends on incomplete historical semantics.

A HELD result may still include diagnostic counts/categories without exposing cross-tenant details.

**Scope completeness is mandatory.** EXACT is impossible unless the reader proves it observed the complete requested ledger scope. The implementation must use either SQL-side aggregation or an exact-count/paginated read that continues until every row is consumed. Any row-limit truncation, pagination cut-off, count mismatch, partial page, query error or inability to prove completeness returns UNKNOWN. In particular, the current dashboard-style “latest N rows” pattern can never produce an EXACT aggregate.

### 3.6 Currency contract

Never add different currencies together.

Ledger classification uses the raw stored currency and the explicit supported Business-currency set. lib/commerce/money.ts normalizeCurrency() is presentation normalization only; because it can coerce unknown values to usd, it MUST NOT classify canonical ledger rows. Unknown/malformed stored currency is HELD.

Return:

- status = EXACT with one or more currencyBuckets only when every row in the requested scope is supported **and the requested scope is proven complete**;
- each bucket = { currency, collectedCents, paymentCount, depositCents, paymentCents };
- status = HELD with holdReasons when unsupported/ambiguous rows affect the requested scope;
- status = UNKNOWN when the read itself is incomplete/unavailable or authority cannot be established.

A caller requiring one Business currency may display one numeric amount only when:

- aggregate status = EXACT;
- exactly one currency bucket matches the requested Business currency;
- no hold reason exists.

Otherwise it renders a truthful “Needs review / unavailable” state rather than zero.

### 3.7 Historical completeness and Product Owner Option A

The aggregate can be authoritative for **the rows it reads in an explicit bounded scope**. It does not prove that Chasum contains complete lifetime history.

Therefore:

- current/period collected-money Reporting may become canonical for supported Chasum ledger history in the requested period;
- customer “lifetime spend / lifetime paid / lifetime deposits” remain UNKNOWN under Option A unless a separately accepted completeness proof exists;
- current outstanding balance may remain numeric only under the existing complete-source agreement contract;
- no import/backfill/historical repair is part of Slice 2.

### 3.8 One formula rule

The shared reader/aggregator is called by Reporting and Commerce dashboard. Reception, Command Centre, Morning Brief, CRM and Summer consume those canonical results or a shared adapter—not copied filters/reducers.

No new local sumSucceededPayments, customer-payment-event sum, or appointment-price “financial revenue” formula is permitted.

## 4. Reporting re-source

### 4.1 Financial collected-money KPIs

lib/actions/reports.ts must obtain the canonical aggregate for the Report scope instead of treating customer_payment_events as money authority.

lib/reports/compute.ts must stop using payment-event projection or appointment recognized-revenue math for fields labelled as collected revenue/payments. It may continue computing non-financial operational metrics such as:

- appointment volume;
- completion/cancellation/no-show rates;
- service popularity by bookings;
- employee appointment counts;
- utilization.

Financial charts/KPIs must accept canonical aggregate values and a status (EXACT / HELD / UNKNOWN).

### 4.2 Existing “revenue by service/employee/category” fields

Because commerce_transactions does not directly carry service/staff/category, these breakdowns may only be financial when each supported transaction can safely join through its same-Business appointment to the corresponding stored appointment/service/staff evidence.

If that source mapping is incomplete or a row is Business-level/unattributed, the affected breakdown is HELD—not backfilled from service list price.

No current chart is allowed to keep an appointment-price estimate under a label that implies collected financial revenue. A bounded copy change such as “Booked service value” may preserve an operational metric only if Product/UX review confirms the label is unambiguous.

### 4.3 Multi-currency

ReportsBundle and relevant report types must support held/multi-currency state. A single $/CAD-looking number is prohibited if multiple currency buckets exist or the scope is HELD.

### 4.4 Location

Existing getLocationScope / withLocationFilter semantics remain. Financial Location totals filter by the canonical appointment relationship, not by guessing active Location for unlinked transactions.

The current Command Centre collected-money card is deliberately Business-wide, not active-Location-only. Slice 2 preserves that disclosure and scope. Introducing Location scoping there would be a separate product behavior change.

### 4.5 Commission, growth and exports

- lib/reports/compute.ts employee commission is staff-pay-adjacent and may not continue to derive from appointment-price “revenue.” Its final basis is Product Owner decision E1 in section 14; until that basis is proven, commission is HELD/unavailable rather than calculated from a noncanonical number.
- buildLocationReports growthPct must be HELD-aware whenever its monetary input is HELD/UNKNOWN.
- CSV/PDF/export paths in lib/actions/reports.ts must preserve HELD/UNKNOWN explicitly; they may not export 0 where financial truth is unavailable.

### 4.6 No accidental report redesign

Slice 2 changes truth sources and bounded disclosure only. It does not redesign Reports navigation, charts, schedules, CSV/PDF breadth or inventory/report feature scope.

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

## 6. Operator financial state and recovery

### 6.1 Canonical operator DTO

Create a server-only adapter over readPaymentObservability plus the durable booking-operation reader. Suggested new module:

- lib/commerce/operator-financial-state.ts — NEW.

It returns only operator-needed fields, for example:

- operationId / attemptId where needed for same-identity recovery;
- operatorState;
- synchronization;
- moneyRecorded boolean/unknown;
- amount/currency/method/payment kind when canonical;
- appointmentId;
- safe obligation summary;
- allowed next action;
- receipt/invoice relationship summary;
- user-safe explanation.

It does **not** expose raw global event sequence, internal failure payloads, service-role details, provider internals, or data from another Business.

### 6.2 State authority

The canonical #133 operator_state is authoritative:

- NOT_RECORDED — confirmed no ledger money under the canonical attempt; no recovery collection unless the surrounding booking contract permits a new attempt.
- PAYMENT_RECOVERY_REQUIRED — attempt REQUESTED/RECOVER with no ledger; resume/check the same identity, do not invent a new key.
- RECORDED_BUT_NOT_FULLY_SYNCHRONIZED — money is recorded; no recollection. Show downstream sync/recovery work separately.
- RECORDED — one accepted ledger plus complete/not-required obligations; payment is recorded and synchronization complete.
- UNKNOWN — hold. Tell the operator to check/recover the same identity; never instruct recollection.

recovery_disposition is supporting evidence only. It never overrides operator_state.

### 6.3 Stale replay response

A mutation/RPC replay may return synchronization=PENDING after the authoritative reader is COMPLETE. UI/actions must therefore:

1. treat mutation return as dispatch result, not final financial state;
2. immediately read the canonical attempt/operation after any success, replay, ambiguous response or reload;
3. render the canonical reader result;
4. never downgrade canonical RECORDED/COMPLETE because an earlier return said PENDING.

No applied SQL migration is edited merely to make the replay response prettier.

### 6.4 Lost response and reload

The client keeps a bounded recovery reference for the in-progress fresh booking. The reference may contain canonical operation/attempt identifiers and idempotency identity, but never customer/payment PII or credentials.

On lost response/reload:

- read the same operation/attempt;
- if canonical state proves appointment/payment, hydrate the existing result;
- if PAYMENT_RECOVERY_REQUIRED, resume the same identity under the accepted kernel;
- if UNKNOWN, hold and do not collect again;
- only a deliberate separate later payment creates a different payment identity.

Implementation must define safe storage lifetime/clearing rules and prove that “Book another” rotates identity intentionally.

### 6.5 Booking Sheet / Quick Appointment UX

Preserve current Booking Sheet and Quick Appointment composition. Add only truthful state/recovery disclosure:

- “Payment recorded”;
- “Payment recorded — finishing invoice/receipt sync”;
- “Payment status needs review — do not collect again”;
- confirmed not-recorded / recoverable state when canonical evidence permits.

Appointment payment_status remains a presentation cache, not the authority for retry/recovery.

Payment, document synchronization and communications delivery are three different states.

### 6.6 Responsive acceptance

The same state/action semantics must pass:

- 390×844 mobile;
- 768×1024 tablet;
- 1280×800 laptop;
- 1440×900 desktop.

No lost Location/customer selection, unexpected route change, duplicate submit, obscured action, horizontal overflow or inaccessible color-only state.

### 6.7 Mandatory communications containment

The relevant current source is known:

- lib/actions/appointments.ts invokes deliverBookingNotifications after a successful create;
- the same action can invoke sendPaymentReceiptNow when receipt delivery was requested;
- lib/booking-engine/events/emit.ts installs the communications booking bridge.

Therefore communications containment is **MUST CHANGE / MUST PROVE**, not an optional preflight.

For the new canonical/durable-operation branch introduced by Slice 2:

1. communication/provider effects are default-closed and are not part of payment success;
2. the canonical financial branch must not call deliverBookingNotifications or sendPaymentReceiptNow during Slice 2 acceptance;
3. the existing legacy/normal booking notification behavior remains unchanged for Businesses still on the legacy path;
4. canonical real-Business activation stays default-off behind the existing admission/readiness boundary until a separate communications integration acceptance reconnects booking confirmations safely;
5. the Staging synthetic acceptance Business has notifications/marketing/public booking disabled and receipt send unrequested;
6. tests assert zero booking bridge/send-intent/provider/receipt-send effect for the canonical Slice 2 acceptance path.

This is containment, not communications redesign or activation.

## 7. Summer readiness

### UNDERSTAND — BUILD NOW

Summer may read:

- canonical period aggregate;
- canonical #133 attempt/operator state;
- canonical booking operation;
- current customer account source-agreement state;
- invoice/receipt projection status.

It must understand “money recorded” separately from “documents synchronized” and “communications delivered”.

### EXPLAIN — BUILD NOW

Summer may explain:

- what amount was recorded, when, method/currency and linked appointment when canonical;
- whether invoice/receipt/CRM projections are complete;
- why a scope is HELD/UNKNOWN;
- why lifetime customer spend is unknown even when current balance is known.

It must not quote customer_payment_events or appointment price as an alternative money truth.

### RECOMMEND — BOUNDED BUILD NOW

Summer may recommend safe human actions such as:

- review the same payment attempt;
- finish a failed projection when a separately authorized operator path exists;
- do not recollect because money is already recorded;
- reconcile a held unsupported money shape.

Recommendations never execute money.

### ACT — BUILD LATER

No autonomous payment, refund, recovery, invoice mutation, provider send or projection worker action in Slice 2.

### AUDIT — BUILD NOW

Summer explanations/recommendations cite the same canonical aggregate/attempt/operation evidence used by operators. No separate AI financial state is stored.

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
- server RPC/browser EXECUTE posture after cutover;
- service_role bypass behavior and SECURITY DEFINER/INVOKER ownership/search_path requirements.

### Must wait for #153 or its separately accepted cutover

- revoking legacy writes relied upon by still-active surfaces;
- FORCE RLS changes;
- default ACL correction;
- sequence ACL changes;
- replacement-writer-only enforcement in Production;
- real-Business worker activation dependent on those permissions.

No #153 SQL/migration belongs in the Slice 2 implementation PR unless independent review proves safe separation impossible and the Product Owner explicitly approves a combined architecture. Current design expects separation.

## 9. Worker and admission boundary

No projection worker is required for Slice 2.

During implementation/Preview/Staging acceptance:

- real-Business admission remains default-off;
- retained historical cohorts remain excluded/gated;
- no background sweep of PENDING obligations;
- explicit projector calls are allowed only inside a separately approved controlled acceptance fixture/flow;
- no automatic retry on uncertain money/projection transport.

Before any worker can activate:

1. replacement writer inventory is complete;
2. #153 cutover dependencies are independently accepted;
3. retained cohorts are durably excluded;
4. admission/watermark semantics are accepted for real Businesses;
5. concurrent/failure/recovery matrix passes;
6. communication/provider boundaries are separately accepted;
7. Product Owner grants an exact activation gate.

## 10. event_sequence privacy

Current source trace found event sequence inside the private server-side payment-observability schema but no current browser/tenant consumer.

Classification: **DESIGN FOR NOW / BUILD LATER**.

Slice 2 must:

- omit raw sequence from the new operator DTO;
- avoid adding it to Reports/CRM/Summer/browser props;
- add a source/unit regression proving the operator mapper does not expose sequence.

If implementation-time inventory finds an existing tenant/browser surface that renders raw sequence, that becomes a LAUNCH REQUIRED bounded privacy correction before Slice 2 acceptance. Do not infer an exploit from the sequence ACL alone.

## 11. Exact proposed future implementation allowlist

This is a proposed prepared-only implementation scope for later Product Owner approval. It is not authorized by this design.

### MUST CHANGE / ADD

**Canonical aggregate and safety**

1. lib/commerce/financial-aggregate/types.ts — NEW canonical aggregate request/result/EXACT/HELD/UNKNOWN contract.
2. lib/commerce/financial-aggregate/reader.ts — NEW server-only Business-scoped complete ledger reader/aggregate; explicit raw-currency validation; no truncated EXACT.
3. lib/commerce/financial-aggregate/index.ts — NEW exports.
4. tests/unit/commerce/financial-aggregate.test.ts — NEW positive-set, completeness, currency, location, unsupported-shape and cross-tenant contract.

**Reporting / Commerce / Command Centre**

5. lib/actions/reports.ts — re-source financial inputs, remove customer_payment_events as authority, make exports HELD-aware.
6. lib/reports/compute.ts — canonical financial inputs; HELD-aware revenue breakdown/location growth; employee commission follows PO decision E1.
7. lib/reports/types.ts — EXACT/HELD/UNKNOWN and multi-currency representation.
8. components/reports/reports-hub.tsx — render held/multi-currency financial truth without fake zero; no redesign.
9. lib/commerce/dashboard.ts — replace local sumSucceededPayments/truncated money math with shared complete aggregate.
10. tests/unit/commerce/financial-dashboard.test.ts — NEW shared aggregate/dashboard truth regression.
11. components/commerce/payments-dashboard.tsx — held/multi-currency propagation.
12. lib/actions/command-centre.ts — propagate canonical Commerce snapshot while preserving Business-wide collected-money scope/copy.
13. lib/actions/commerce.ts — only the bounded type propagation needed by its second getCommerceDashboardSnapshot consumer.

**Reception / Calendar / Chase money claims**

14. lib/actions/reception.ts + components/reception/business-brief.tsx — canonical/held Today money.
15. lib/actions/morning-brief.ts + components/day-view/morning-brief.tsx — canonical/held financial brief; keep utilization separate.
16. lib/actions/appointments.ts — both: (a) re-source its dashboard stats monetary fields and (b) wire fresh-booking canonical operation/result/recovery with mandatory default-closed communication boundary; edit-booking semantics stay intact.
17. app/(dashboard)/dashboard/calendar/page.tsx + lib/dashboard/insights.ts — propagate canonical/held Calendar financial summary; never say exact “Completed revenue” from appointment price.
18. lib/booking-engine/queries/range.ts — stop exporting appointment/catalog-price monetary “revenue” as financial authority; preserve utilization counts. Any remaining value must be explicitly operational service value.
19. lib/chase/analytics.ts + lib/chase/insights.ts + lib/chase/types.ts + components/chase/chase-ops-workspace.tsx — canonical/held money KPIs and revenue deltas; no catalog-price money claim.
20. focused existing Chase/Reception/Calendar tests plus new held-state cases.

**CRM / customer / employee money claims**

21. lib/crm/service.ts + lib/crm/types.ts — lifetime monetary fields unknown/held under Option A; visit/preference metrics preserved; timeline remains projection-only.
22. lib/crm/ai-knowledge.ts + lib/crm/ai.ts — Summer/Chase money claims consume canonical/Option-A truth and render unknown honestly.
23. components/crm/customer-insights.tsx + components/crm/chase-crm-panel.tsx — no fabricated lifetime spend.
24. lib/crm/chase-hints.ts — remove money threshold based on appointment-derived lifetimeRevenue; retain visit/recency hints.
25. lib/actions/customers.ts + components/reception/customer-preview.tsx — remove appointment-price customer Revenue claim; show unknown or non-money visit metric.
26. lib/employees/service.ts + lib/employees/types.ts + components/employees/employee-performance.tsx — implement PO decision E1; no silent appointment-price “Lifetime revenue.”
27. tests/unit/commerce/customer-account.test.ts + tests/unit/commerce/customer-account-unknown.test.tsx and focused CRM/employee/customer-preview tests — preserve Option A and prove no numeric fake certainty.

**Operator recovery / privacy / communications containment**

28. lib/commerce/operator-financial-state.ts — NEW safe canonical #133/#158 operator adapter; omit raw event_sequence and provider/internal detail.
29. tests/unit/commerce/operator-financial-state.test.ts — NEW canonical state, stale replay, RECOVER-vs-RECORDED, same-identity recovery and privacy contract.
30. components/booking-sheet/booking-sheet.tsx — bounded recovery reference, same-identity read/recovery and canonical operator disclosure.
31. components/reception/quick-appointment.tsx — same canonical recovery/state wiring.
32. tests/unit/reception/payment-result-disclosure.test.tsx — canonical state, lost response, reload, duplicate click, no-recollect and communication containment.
33. components/booking-sheet/payments-section.tsx — only the bounded state/disclosure propagation required by Booking Sheet; no parallel recovery logic.
34. lib/commerce/recognize.ts — update its misleading cross-domain “single source of truth” authoring comment and restrict it explicitly to operational service/visit value; no financial money consumer may call it after Slice 2.

Every path above is included because it currently produces, transports or renders a launch-critical money claim or the canonical recovery path. Implementation preflight may remove a path only with proof that it is unreachable/unused and no operator/customer/Summer financial claim remains.

### MAY CHANGE — only with demonstrated implementation need

- components/day-view/appointment-drawer.tsx — bounded cache/disclosure wording; never recovery authority.
- a dedicated new lib/commerce/booking-operations/recovery.ts or a bounded extension to lib/commerce/booking-operations/kernel.ts — only if source proof shows same-identity reload recovery cannot be implemented safely through the existing prepared operation/read primitives. It must reuse the existing operation/attempt; no new identity or migration.
- additional focused test files where the existing test location is absent; document the exact replacement before implementation.
- lib/notifications/booking-delivery.ts and lib/booking-engine/events/emit.ts — source/test instrumentation only if needed to prove the default-closed canonical path; do not redesign or activate Communications.

The preflight must not expand beyond a newly proven launch-critical money surface without Program Lead reconciliation.

### MUST NOT CHANGE IN SLICE 2

- any existing applied #133/#158/#134 migration;
- any new database migration by default;
- #153 ACL/RLS/FORCE-RLS/default-ACL/sequence migration;
- commerce receipt independence contract;
- refund/provider writers;
- communication/provider adapters or activation;
- worker/claim loop activation;
- Production release files/policy;
- GVM/Chasum HQ tenant data;
- #152 historical USD data;
- C01/C02/C03 packages/evidence or retained C03 synthetic state;
- multi-location relationship architecture;
- M1A/M1B/#121 accepted behavior.

### Migration ruling

**Default: NO NEW MIGRATION.** Existing accepted #133/#158 schema is sufficient for the read/adapter design.

A new migration becomes a new architecture gate, not an implementation convenience. In particular, do not modify the applied replay RPC solely to change its stale synchronization return; canonical reader authority resolves that safely in Slice 2.

### Stacked dependency ruling

Live main is currently 31115e6a51b71fc097c279d205065d80e0be3573 while this branch contains the accepted-but-unmerged #133/#158/#134 prerequisite stack.

Slice 2 implementation is **stack-dependent**. It consumes schema/runtime objects supplied by the prerequisite stack, including commerce_booking_operations, customer_payment_events.transaction_id, the #133 projector/reader RPCs and #158 durable-operation functions. It must not be cherry-picked or merged to main ahead of those foundations **or deployed to an environment before their governed migration/application sequence**; doing so is a functional runtime break, not merely a governance violation. A main merge is not Production authority.

## 12. Acceptance matrix for a future implementation

| Gate | Required proof |
| --- | --- |
| Aggregate unit contract | succeeded manual payment/deposit exact; unsupported provider/kind/status/refund/void/adjustment/store-credit/gift-card => HELD; read error => UNKNOWN; no cross-currency sum |
| Completeness | exact-count/pagination or SQL aggregate proves the entire requested scope was consumed; truncation, row cap, count mismatch, partial page or pagination cut-off => UNKNOWN, never EXACT |
| Currency | CAD exact; two currencies produce separate buckets / held single-currency consumer; malformed/ambiguous currency held; normalizeCurrency() cannot coerce canonical ledger evidence |
| Location | appointment-linked transaction attributed to stored Location; Business-level transaction not guessed into active Location; cross-Business/mismatched link held |
| Reporting | financial KPIs match canonical aggregate; customer_payment_events divergence cannot change totals; operational appointment KPIs remain unchanged; service/employee/category/location breakdowns HOLD when attribution is incomplete; location growth is HOLD-aware; commission follows PO decision E1 |
| Reports export | CSV/PDF/export does not turn HELD/UNKNOWN into 0 or a fabricated numeric value |
| Dashboard / Command Centre | same aggregate identity/value; no independent money reducer; existing Business-wide Command Centre money scope/disclosure preserved |
| CRM | timeline may differ/miss projection without changing ledger total; no double count; monetary lifetime spend remains unknown under Option A; customer preview and Chase hints do not use appointment-price money |
| Employee financial surface | Employee Lifetime revenue / commission follows PO decision E1; no appointment/catalog-price money survives under a financial label |
| Calendar / Reception / Chase | customer preview Revenue, Business Brief Today revenue, Calendar Completed revenue, Chase today/delta/top-spender claims all use canonical/held truth or an explicitly nonfinancial label approved under E1/product review |
| Customer account | complete agreeing current sources may show balance; truncated/missing/disagreeing sources fail closed |
| Receipt | receipt with invoice_id NULL resolves receipt -> transaction -> invoice correctly |
| Operator happy path | canonical RECORDED/COMPLETE displayed after accepted payment |
| Projection pending | RECORDED_BUT_NOT_FULLY_SYNCHRONIZED says money recorded / do not recollect |
| Lost response | reload/read same identity; no new attempt/payment key |
| Replay | stale mutation PENDING cannot downgrade later canonical COMPLETE |
| Recovery disposition | RECOVER on settled attempt cannot create recovery action when operator_state=RECORDED |
| Duplicate click | one booking operation/payment identity/effect; second UI dispatch blocked or canonical replayed |
| Deliberate second payment | distinct payment identity required; no accidental same-key reuse |
| UNKNOWN | clear hold/do-not-recollect guidance |
| Event privacy | operator/browser DTO contains no raw event_sequence |
| Tenant isolation | other Business cannot read operation/attempt/aggregate; no service-role client exposure |
| Communication | canonical/durable Slice 2 branch never calls deliverBookingNotifications or sendPaymentReceiptNow; booking bridge/send intents/provider/receipt-send deltas remain zero on the synthetic acceptance Business; legacy normal-booking communications path remains unchanged |
| Retained cohort | old attempts/obligations remain excluded; no sweep/worker |
| Summer | same canonical amount/state as operator; unknown/held explained, never invented |
| Responsive | 390×844, 768×1024, 1280×800, 1440×900; no overflow/occlusion/lost selections; keyboard/focus/text states |
| Local/disposable DB | only if aggregate join/filter semantics cannot be fully proven with unit fixtures; no accepted hosted financial proof rerun |
| Hosted Staging | separately prepared synthetic/operator acceptance after implementation review and PO gate; no C03 reuse |
| Production/GVM | NOT part of Slice 2 implementation acceptance; separate governed release and real-use gate |

## 13. Non-goals and regression guards

Must not change:

- GVM Baby World architecture/data during development;
- Chasum HQ’s status as a normal tenant;
- future-tenant reusable behavior;
- accepted invoice/receipt accounting contract;
- receipt independence from direct invoice_id;
- accepted multi-location service/staff relationship truth;
- M1A, M1B, #121 mobile/location behavior;
- booking/calendar navigation architecture;
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
- a missing CRM projection cannot erase recorded revenue;
- a complete CRM projection cannot create revenue absent canonical ledger;
- document synchronization cannot determine whether money exists;
- UI cannot convert HELD/UNKNOWN into numeric zero or an instruction to recollect;
- Summer cannot create a parallel financial truth.

## 14. Genuine Product Owner decisions

One genuine Product Owner decision is required at the future implementation gate.

### E1 — Employee “revenue” and commission basis

Current source uses appointment/service-value math for Employee “Lifetime revenue” and for Reports commission. The accepted #133 contract says financial revenue authority is canonical ledger truth, so the current formula cannot silently survive under a money label.

Two defensible product contracts remain:

**Option A — canonical collected-money basis.** Employee financial revenue and commission are calculated only from supported canonical ledger transactions attributable through transaction -> same-Business appointment -> staff. Unsupported/held/cross-currency/unattributed scopes hold rather than guessing.

- Advantage: one financial truth; strongest Stripe-like discipline.
- Tradeoff: “commission” follows collected money rather than completed-service value and may remain unavailable for unsupported scopes.

**Option B — explicitly operational service-value basis.** Rename the current appointment-derived metric so it is plainly nonfinancial (for example “Completed service value”), and do not call it revenue. Monetary commission remains HELD/not calculated until a separate commission-basis contract is approved.

- Advantage: preserves a useful staff-performance measure without pretending it is collected money.
- Tradeoff: staff performance has no financial commission number until a later approved rule.

**Program Lead recommendation for the implementation gate:** choose Option A only if Chasum intends commission to mean commission on collected money; otherwise choose Option B and keep commission held. The design does not silently make this business-policy decision.

No other Product Owner design decision is needed. Existing accepted decisions already resolve ledger authority, CRM projection-only status, Option A historical incompleteness, receipt independence, no workers/providers/communications activation, #153 separation, retained-cohort exclusion, C03 consumption and no Production/GVM authority.

Routine engineering clarifications now locked by this corrected design:

- canonical ledger currency classification uses raw stored currency, never normalizeCurrency() coercion;
- canonical aggregate uses a server-only authorized Business context and trusted service client with immutable business_id filtering;
- existing Command Centre collected-money scope remains Business-wide;
- the exact current communication hooks are known and default-closed on the canonical branch;
- CSV/export and all money-bearing types must represent HELD/UNKNOWN explicitly.

The future implementation approval remains consequential and must be explicit after independent review. A materially new UI/dashboard redesign still requires a fresh Competitive Product Gate.

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

## 16. Exact next gate

**SLICE2_DESIGN_READY_FOR_INDEPENDENT_REVIEW**

Next action:

1. Independent Claude high-risk source/design review of this exact document and exact commit.
2. Reconcile any corrections without expanding scope.
3. Only after independent acceptance, prepare one exact Product Owner implementation gate with the final path allowlist and tests.
4. No implementation before that Product Owner approval.
5. No hosted financial execution, #153 cutover, worker/provider activation, Production or GVM action follows from design acceptance.

This design is not implementation approval, merge approval, Staging mutation authority or Production release authority.
