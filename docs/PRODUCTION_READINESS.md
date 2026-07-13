# Production Readiness — GVM Baby World

Checklist for replacing Picktime with Chasum for daily front-desk operations.
Last updated: Milestone 1.4 (2026-07-13).

**Rule:** Never invent availability, prices, preferences, or client data. Prefer empty states over fabricated values.

---

## Reception workflows

| Flow | Status | Notes |
|------|--------|-------|
| New customer | ✅ Ready | FAB / `N`, Clients page, quick-add in panel & appointment dialog |
| Returning customer | ✅ Ready | Instant search + preview + open full profile |
| Quick booking | ✅ Ready | Panel form uses real `get_available_slots` / create appointment |
| Walk-in booking | ✅ Ready | FAB / `W` → today-focused quick book |
| Reschedule | ✅ Ready | Drag-and-drop; snaps to :00/:30 then nearest valid slot |
| Cancel appointment | ✅ Ready | Full appointment dialog (confirm required) |
| Search customer | ✅ Ready | Reception search + Clients list + ⌘K palette |
| Block time | ✅ Ready | FAB / `T` → availability block |
| Internal notes | ✅ Ready | Device-local today notes (not multi-device sync) |

---

## Calendar

| Check | Status | Notes |
|-------|--------|-------|
| Day / week / month views | ✅ | Sticky headers & time column |
| Current time indicator | ✅ | Scrolls into view on today |
| Today highlight | ✅ | Day header, week column, month cell |
| Overlap readability | ✅ | Side-by-side packing for concurrent appointments |
| Drag-and-drop feedback | ✅ | Drop half-hour ghost + drag opacity |
| Hover / tooltips | ✅ | Hover scale + native title summary |
| Empty day messaging | ✅ | Shown in day view header |

---

## Customer profile

| Field | Status | Source |
|-------|--------|--------|
| Upcoming appointments | ✅ | Live appointments |
| Appointment history | ✅ | Live appointments |
| Lifetime visits | ✅ | Completed count only |
| Lifetime revenue | ✅ | Sum of completed service prices |
| Cancellation history | ✅ | Cancelled list |
| No-shows | ✅ | No-show list |
| Preferred staff | ✅ | Mode from non-cancelled history (never invented) |
| Preferred service | ✅ | Mode from history |
| Preferred location | ✅ | Mode from history |
| Referral source | ✅ | Stored field when present |
| Internal notes | ✅ | Customer `notes` |
| Documents | ✅ | Uploads when storage configured |

---

## Business operations

| Check | Status | Notes |
|-------|--------|-------|
| Create / edit / delete customer | ✅ | Clients manager |
| Book appointment | ✅ | Dashboard + public (policy permitting) |
| Move appointment | ✅ | Calendar DnD / reschedule action |
| Cancel appointment | ✅ | Dialog |
| Staff availability | ✅ | Working hours + blocks + scheduling RPCs |
| Booking policies | ✅ | Settings; shown on public booking |
| Public booking | ✅ | `/book/[slug]` when mode is public / request / invite |
| Staff-only booking | ✅ | Public page + server action blocked |
| Notifications | ⚠️ Partial | In-app center ready; email/SMS need production SMTP/Twilio |
| Search (global) | ✅ | ⌘K customers, staff, services, appointments, pages |

---

## Incomplete / known gaps (flag before go-live)

| Item | Severity | Mitigation |
|------|----------|------------|
| Production SMTP / Resend | High for email confirmations | Configure Resend (or SMTP) before patient emails |
| Twilio SMS | Medium | Optional; configure if SMS reminders required |
| Waitlist in Reception panel | Low | Placeholder → Automation page |
| AI Suggestions beyond rule insights | Low | Evidence-only; empty when no rules fire |
| Today’s notes sync across devices | Low | Device-local by design for now |
| Overlap conflict prevention UI | Low | Engine still validates on save; DnD finds nearest legal slot |
| Automated E2E suite | Medium | Manual checklist below until Playwright lands |
| Multi-staff login / roles | Out of scope | Single owner/admin session for MVP |

---

## Keyboard shortcuts (Reception)

| Key | Action |
|-----|--------|
| `/` or `F` | Focus customer search |
| `N` | New customer |
| `B` | Book appointment (panel) |
| `W` | Walk-in |
| `T` | Block time |
| `I` | Add internal note |
| `⌘/Ctrl+K` | Command palette |
| `Esc` | Close dialogs / menu / clear search |

Ignored while typing in inputs, textareas, selects, or dialogs.

---

## Manual smoke test (run before daily cutover)

1. Create a test customer (FAB or Clients).
2. Search and open preview → open full profile.
3. Book via Quick appointment using a real slot.
4. Drag the appointment to a new time; confirm toast success.
5. Open appointment → cancel; confirm removal on calendar.
6. Walk-in shortcut → book for today.
7. Toggle public booking mode to Staff Only → confirm `/book/[slug]` blocked.
8. Toggle back to Public → complete a test public booking.
9. Confirm notification rows appear after booking (and email if provider configured).
10. ⌘K → jump to client, service, and an appointment.

---

## Go / No-go

**Go** when: smoke test passes, SMTP configured if email is required, staff trained on shortcuts, Picktime parallel day optional.

**No-go** if: scheduling RPCs fail, staff-only gate broken, or customer create/book/cancel regressions.

See also: [`docs/ROADMAP.md`](./ROADMAP.md), [`docs/CHANGELOG.md`](./CHANGELOG.md).
