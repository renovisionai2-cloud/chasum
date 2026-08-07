# World Class — Booking Workspace UX Contract

**Branch:** `cursor/world-class-portal-foundation`  
**Surface:** New Appointment / Edit Appointment drawer (`BookingSheet`)  
**Production:** untouched (`4eecbec`)  
**Engines:** booking, availability, tax, deposit, payment, notification — **unchanged**

---

## Acceptance lock

**Chapter 4 Booking Workspace passed only after true progressive workflow acceptance.**

Labels alone are not enough. Create booking must behave as real workflow stages — not one long vertical form.

## Locked flow

```
Customer → Appointment → Time → Payment → Confirm
```

**Contract:** A normal booking must not require repeated long-page scrolling.  
**Contract:** Only the **active** stage is expanded. Completed stages collapse to compact summaries with **Change**. Upcoming stages stay locked.

## Required IA

1. No Narrow / Standard / Wide layout controls for business users.
2. Progress: Customer → Appointment → Time → Payment → Confirm.
3. Selecting a customer advances to Appointment; search collapses.
4. Completing service + employee + date advances to Time (no manual hunt).
5. Time step shows the availability **grid** immediately (`alwaysExpanded` / `workspaceMode`).
6. Selecting a time advances to Payment.
7. Payment is one decision card: Appointment total + Deposit required + four choices; details progressive; projected balance after choice.
8. Continue → Confirm review (financial + notifications). Confirm CTA in sticky footer.
9. Sticky footer: status left; Cancel + Continue/Confirm right.
10. History / Summer / Notes / Advanced secondary — never interrupt the path.
11. Prefer step changes over long auto-scroll.
12. Optional employee “Assign later” remains coming-soon until engine flag ships.
13. Edit appointment may retain denser layout; create must stay progressive.

## Preserve

- Tax / deposit calculations (`resolveBookingFinancials`)
- Payment form field names (`payment_mode`, `payment_amount_cents`, …) in the sticky footer form
- Customer + business confirmation emails
- Reception / Calendar / CRM open the same `BookingSheet`
