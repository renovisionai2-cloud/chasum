# #134 fresh-booking/manual-deposit Competitive Product Gate

Status: CONTROL-TOWER RESEARCH AND PROPOSED PRODUCT CONTRACT COMPLETE; implementation and product acceptance NOT granted.
Prepared 2026-10-07 by ChatGPT Program Lead. Scope: Booking Sheet and Quick Appointment only. LAUNCH REQUIRED reliability; no platform redesign.

## Public evidence (official documentation, read 2026-10-07)

Fresha: https://www.fresha.com/help-center/knowledge-base/payments/100638-collect-deposits-in-store
The documented desktop/mobile new-appointment flow takes a client and service, deposit amount or percentage, save-and-pay and payment method; it links the collected deposit to the booking. It also documents confirming without collecting a deposit. Documentation observation, not a hands-on UX or backend audit.

Vagaro: https://support.vagaro.com/hc/en-us/articles/17733270662427-Manually-Collect-a-Customer-Deposit-From-the-Calendar
The documented phone/computer calendar flow supports collecting a deposit while booking, with amount/method selection, payment status icons and an emailed receipt after collection. In-house collection does not require its online-shopping feature. No claim about its internal idempotency or fault recovery follows.

Jane: https://jane.app/guide/online-booking-pre-payments
Jane distinguishes a prepayment from allocation to an invoice: its billing view labels prepayments pending until applied. Its online prepayment policy is not the same as administrative booking; the guide directs admin users to partial payment/prepayment workflows. Do not copy an online-only or Arrived-first workflow into Chasum's administrative GVM flow, and do not import Jane's pending terminology as proof money is absent.

Stripe engineering benchmark, not an appointment competitor: https://docs.stripe.com/api/idempotent_requests
Its documented API uses stable client-generated keys to recognize retries, compares original parameters and can return the saved status/body for the same key. Do not copy its key-expiry or error-caching policy into Chasum without a justified contract; no Stripe integration is being added.

## Parity floor and deliberate Chasum target (proposed design, not measured superiority)
- Keep booking, customer, Business/location, service, payment choice and resulting status in one coherent operator flow. Manual recording must not require online customer booking, a stored card or a false appointment-status change.
- Preserve the approved booking UI/navigation and location/customer defaults; add only bounded recovery/outcome behavior. Supported desktop/laptop/tablet/mobile surfaces must communicate the same financial truth without relying on a vanishing toast.
- Show Business-authoritative currency, amount and method before submission; offer explicit no-payment/deposit/full choices. A configured deposit is not received money. Manual E-Transfer means an operator records tender, not a bank API transfer or verification.
- Intended Chasum advantage: one recoverable booking-operation identity spanning appointment and payment, with explicit money-recorded versus downstream-sync/communication state. This is a target, not a claim competitors lack recovery.
- Switching reason to prove: the operator can recover a lost save response and see what remains unfinished without recreating appointments, recollecting a deposit or asking a developer to infer what happened.
- No new UI dashboard, calendar redesign, auto-charge, payment provider, balance transfer, customer merge, recurring booking, multi-service bundle, pricing or messaging expansion in the first slice.

## Required acceptance contract before activation
For a synthetic standard-price CAD100 service: record CAD50 E-Transfer deposit, CAD100 full payment, and no payment now; later a deliberate second equal CAD50 payment uses a different payment identity. Existing reusable tenant model only, including GVM-like and HQ-like synthetic configurations, never those real tenants.
Save twice or lose a response: same request recovers same booking/payment, changed request under same key conflicts explicitly; changed location/customer/currency/price must not silently reattribute history. Book-another deliberately rotates identity; reload preserves recovery reference without storing customer/payment PII in browser storage.
Money status and synchronization status are separate: NOT RECORDED; RECORDED with sync complete; RECORDED with sync pending/failed; UNKNOWN means status check/same-identity recovery, never an instruction to recollect. No-payment is an explicit non-payment outcome, never treated as failed payment.
Check responsive operator states at mobile 390x844, tablet 768x1024, laptop 1280x800 and desktop 1440x900 (proposed test sizes, not completed tests). No lost customer/location selection, no unexpected new-booking navigation, focus/keyboard/double-click handling, accessible text not color-only, one coherent recovery action rather than raw technical errors.
Initial financial tests: no external communications, no provider calls; document/communication readiness remains a distinct required later gate, not skipped for launch. Existing 90-row/CAD181 retained cohort and pending obligations default-excluded.
Read-only Summer explanation must derive from the same attempt/ledger/obligation evidence and acknowledge unknowns. No separate AI financial state, no autonomous financial action in this slice.

## Review status and limits
This record fulfills the bounded research/proposed product checkpoint for contract preparation only. Engineering reviewer must assess consistency; actual product/UX acceptance remains NOT RUN. Public documentation does not demonstrate failure behavior, accessibility or concurrency correctness. No competitive claim is inferred from absence of documentation.
