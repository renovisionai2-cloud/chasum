# World Class — Booking Workspace UX Contract

**Branch:** `cursor/world-class-portal-foundation`  
**Surface:** New Appointment / Edit Appointment drawer (`BookingSheet`)  
**Production:** untouched (`4eecbec`)  
**Engines:** booking, availability, tax, deposit, payment, notification — **unchanged**

---

## Locked flow

```
Customer → Appointment → Time → Payment → Confirm
```

**Contract:** A normal booking must not require repeated long-page scrolling.

## Required IA

1. No Narrow / Standard / Wide layout controls for business users.
2. Compact progress: Customer → Appointment → Time → Review.
3. Customer search collapses after selection; history behind “View history”.
4. Service + Employee + Date grouped; duration compact with Edit duration.
5. Available times appear **immediately** after Date (no Price/Notes/Advanced between).
6. Notes behind “+ Add note”.
7. One selected-appointment summary after time is chosen.
8. One Payment card with projected language:
   - Total
   - Payment being recorded
   - Balance after confirmation
9. No duplicate Balance / Review financial walls on create.
10. Timeline / Summer secondary (Ask Summer / View customer history).
11. Sticky footer: status + Cancel + Confirm / Confirm & record $X.
12. Optional employee “Assign later” remains coming-soon until engine flag ships.

## Preserve

- Tax / deposit calculations (`resolveBookingFinancials`)
- Payment form field names (`payment_mode`, `payment_amount_cents`, …)
- Customer + business confirmation emails
- Reception / Calendar / CRM open the same `BookingSheet`
