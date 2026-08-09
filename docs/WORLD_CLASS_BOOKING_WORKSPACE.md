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

### Booking decision provenance (locked)

A value being present in booking state does **not** by itself mean the decision is resolved.

| Concept | Meaning |
|---------|---------|
| **Accessible** | May the receptionist open this decision? |
| **Resolved** | Is there a valid, **intentionally** resolved value? |
| **Required** | Must this decision be resolved before forward progress? |
| **Provenance** | Why does the value exist? |

**Resolving provenance:** `user_selected` · `entry_context` · `valid_draft` · `appointment`  
**Non-resolving:** `preference` · `default` · `none` (and any silent catalog/prefs hydrate)

Canonical forward progression: `firstMissingDecision` / `nextRequiredDecision` — first **required** and **not intentionally resolved**.

Reception last-used prefs may remain for **location** operating context only. Prefs must **not** silently resolve Service or Employee on generic New Appointment.

### Entry-point state matrix

| Entry | Intentional prefill (RESOLVED when valid) | Not resolving |
|-------|-------------------------------------------|---------------|
| **Command Centre → New Appointment** (`?book=1`) | Business / location operating context | Last-used service/staff prefs; today date default without slot |
| **CRM Customer → Book** | Customer (`entry_context`) | — |
| **Calendar empty slot / column** | Only explicitly supplied slot / staff / draft fields | Unrelated stale sheet state |
| **Reception Quick Appointment draft** | Draft fields (`valid_draft`) | Prefs |
| **Book Another** | Fresh booking; safe location context only | Prior customer/service/employee/time/payment/appointment id/success |

Invalidation (existing engine rules): service change may clear employee eligibility, slot, pricing/payment projection; employee change clears slot; date/time updates slot/review.

### Entry context may skip known decisions

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
- **View Appointment** opens the exact created appointment via the Existing Appointment Management Workspace (same `openEdit` path as calendar selection) — never dumps the user to hunt on the calendar  
- **Monetary amount fields** use plain editable drafts while focused; normalize on blur — never fight the caret with per-keystroke currency reformatting  
- **Date & time** presents useful start times on the business booking increment — not an endless dump of raw availability granularity; dense days use “More times”  
- **Progress stages** that are completed or context-prefilled are real navigation controls; unavailable stages are visibly disabled (never silent dead clicks)  
- **Book another** starts a fresh appointment inside the same workspace; View Appointment / Book Another / Done remain distinct  
- **Front-desk speed:** active decision dominates; compact completed summary; short selection beat then advance; payment modes use unmistakable selected chrome; no redundant time Continue  

## Locked usability principles

1. Monetary fields must behave like normal high-quality editable inputs and must not fight the user's cursor.
2. View Appointment after booking must open the exact appointment that was just created.
3. Chasum must never require the user to search for an entity that the current workflow already knows.
4. Chasum presents useful appointment start times, not raw availability granularity.
5. Completed or context-prefilled booking decisions must be directly revisitable.
6. Unavailable booking stages must visibly communicate that they are unavailable; Chasum must never use silent dead clicks.
7. Book another starts a fresh appointment inside the current workspace.
8. View Appointment, Book Another, and Done have distinct guaranteed behaviors.
9. The current booking decision must visually dominate; completed facts stay compact; the next action must be obvious without hunting.
10. Adaptive booking may skip only decisions that are intentionally and validly resolved.
11. A value being present does not by itself mean that a booking decision is resolved.
12. Accessible, resolved, required, and provenance are distinct workflow concepts.
13. Required unresolved decisions determine normal forward progression.
14. Chasum must not silently choose required business decisions and present them as user-completed.
15. Interactive controls must be visually distinguishable from static text before hover (`Button` variant `subtle` for Change/Edit/View/Manage on booking surfaces; global rollout later).
16. Booking transitions must preserve spatial continuity: selection → acknowledgement → next decision (no multi-stage jump; avoid unnecessary full-sheet scroll).

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
