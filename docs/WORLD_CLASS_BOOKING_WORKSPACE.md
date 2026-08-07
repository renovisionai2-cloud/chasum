# World Class — Booking Workspace UX Contract

**Branch:** `cursor/world-class-portal-foundation`  
**Surface:** New Appointment / Edit Appointment drawer (`BookingSheet`)  
**Production:** untouched (`4eecbec`)  
**Engines:** booking, availability, tax, deposit, payment, notification — **unchanged**

---

## Product distinction (locked)

| Mode | Experience |
|------|------------|
| **New Appointment** | Adaptive Booking Workspace — ask only what’s missing |
| **Existing Appointment** | Expandable Appointment Management Workspace — clarity, context, control |

Creation optimizes for **speed**. Management optimizes for **clarity / context / control**.  
Do not force these into the same layout.

**Existing appointment expand** (PO Preview video correction): desktop Expand/Collapse widens the sheet (~60–70vw, capped ~1180px) and switches to a multi-column management layout over the calendar. UI-only state — no DB persistence. Narrow/Standard/Wide remain removed.

## Adaptive architecture

```
Ask only what’s missing:
Customer → Service → Employee → Date & time → Payment → Review → Success
```

Entry context may skip known decisions:

| Entry | Typically known | Starts at |
|-------|-----------------|-----------|
| Global New Appointment | Business / location | Customer (or next missing) |
| Customer profile → Book | Customer (+ assigned staff when present) | Service |
| Calendar empty slot | Date, time (+ employee on day column) | Customer or Service |
| Reception draft / Quick Appointment | Draft fields | First missing |

One booking engine; only prefill differs.

## Workspace chrome

- Fixed header + compact progress  
- **Summary strip** of known facts (Change chips — not full completed stage cards)  
- **One** main decision area  
- Sticky footer: status · Back · Continue / Confirm  
- **More options** collapsed (notes, duration, location, source)  
- Silent grounded hints only — no Summer chat panel on create  
- Success state with confirmed notification/payment outcomes only  

## Benchmark principles (inspiration only — do not copy)

| Product | What they do well | What Chasum borrows | How Chasum differentiates |
|---------|-------------------|---------------------|---------------------------|
| **Calendly** | Round-robin / any available host reduces forced staff choice | Future “Any available professional” routing without rebuilding the workflow | Service businesses need eligibility, rooms, deposits — Chasum OS depth |
| **Fresha** | Book from calendar slot; any professional; waitlist recovery; deposit while booking | Context prefill; date+time as one decision; no dead-end availability | Truthful capabilities only — no fake waitlist/any-pro until engines exist |
| **Square Appointments** | Profiles + cards + history accelerate repeats | Returning customer context (upcoming, balance) only when it affects decisions | AI Business OS + Summer/Chase — not payments-first POS |
| **Mindbody** | Discovery → book → pay → visit → repeat; certainty after save | Success state with confirmation/payment outcomes | Honest pending/failed delivery — no theater |
| **Vagaro** | One engine across channels | Reception / Calendar / CRM / Command Centre → same sheet + engine | Shared OS kernel + commerce ledger |
| **Appointy** | Temporary slot hold during online payment | Documented future HELD → CONFIRMED / RELEASED | Not implemented while Preview shares Production DB |

## Future capabilities (documented — not in this chapter)

- Any available professional / automatic routing  
- Waitlist + next available recovery  
- Online payment slot holds  
- Repeat “Book again” from prior service/employee  
- Location + resource scheduling (Chapter 9)  

## Preserve

- Tax / deposit (`resolveBookingFinancials`)  
- Footer `payment_*` field names for `createAppointment`  
- Customer + business emails  
- Named employee required until optional-staff flag ships  
