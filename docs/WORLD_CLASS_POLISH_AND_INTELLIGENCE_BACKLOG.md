# World Class Polish & Intelligence Backlog

**Status:** LOCKED — implementation-grade backlog (documentation only)  
**Source:** Full desktop portal review recommendations (World Class Program)  
**Authority:** This repository. Chat history is not the source of truth.  
**Branch:** `cursor/world-class-portal-foundation`  
**Production:** Untouched (`4eecbec`)  
**Mode:** Planning lock only — **do not implement in this commit**  
**Do not:** Redesign unrelated pages · rewrite booking/payment engines · run migrations · write shared DB · begin Phase 6.1 without PO

Canonical companion docs:

- [`WORLD_CLASS_IMPLEMENTATION_BLUEPRINT.md`](./WORLD_CLASS_IMPLEMENTATION_BLUEPRINT.md)  
- [`WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md`](./WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md)  
- [`WORLD_CLASS_MARKETING_PRODUCT_PARITY.md`](./WORLD_CLASS_MARKETING_PRODUCT_PARITY.md)  
- [`CURRENT_PROJECT_STATE.md`](./CURRENT_PROJECT_STATE.md)  

---

## Program after functional chapters

### World Class Polish & Intelligence Program

**When:** After functional World Class chapters stabilize (through Ch 12–15 as applicable).  
**Before:** Public launch.  
**Includes:**

1. Cross-portal visual hierarchy audit  
2. Spacing and typography audit  
3. Icon consistency  
4. Table and list modernization  
5. Charts and reporting polish  
6. Summer and Chase intelligence verification  
7. Loading, empty, success, and error states  
8. Responsive mobile audit  
9. Accessibility audit  
10. Performance audit  
11. Truthfulness and data-source audit  
12. Final industry readiness review  
13. Final marketing parity review  

| Tag | Meaning |
|-----|---------|
| **REQUIRED BEFORE LAUNCH** | Must be satisfied before public launch (may be progressive + final gate) |
| **FINAL POLISH** | Primarily verified/completed in the Polish & Intelligence Program |
| **PROGRESSIVE** | Applied chapter-by-chapter; final cross-portal check in Polish Program |

---

## Locked recommendations

### 1. Visual hierarchy — REQUIRED BEFORE LAUNCH · PROGRESSIVE + FINAL POLISH

The portal must not give every metric, card, action, and section equal visual weight.

| Requirement | Detail |
|-------------|--------|
| Primary / secondary / supporting | Clear content roles per viewport |
| Dominant action or insight | Most important operational action or insight is visually dominant |
| Reduce card repetition | Avoid decorative or redundant cards |
| Intentional design tools | Size, spacing, typography, contrast, grouping |
| Visual direction | Clean, bright, restrained Chasum language |
| Forbidden | Decorative dashboards; fake urgency |

**Chapter assignment:** Progressive in each page chapter (2–12). Final cross-portal verification in **Polish & Intelligence Program**.

---

### 2. Spacing and layout rhythm — REQUIRED BEFORE LAUNCH · PROGRESSIVE + FINAL POLISH

| Requirement | Detail |
|-------------|--------|
| Breathing room | Section spacing that reads calmly under operational load |
| Standardization | Page widths, card padding, section gaps, form density, alignment |
| Avoid compressed UX | Payments, Business, Reception, Reports, Customers must not feel spreadsheet-like |
| Responsive | Desktop, tablet, 430px, 375px |

**Chapter assignment:** Progressive per chapter. Final design-system audit in **Polish & Intelligence Program** / Ch 1 DS follow-through.

---

### 3. Premium icon system — REQUIRED BEFORE LAUNCH · FINAL POLISH (with DS)

| Requirement | Detail |
|-------------|--------|
| One family | Consistent icon set across portal |
| Standards | Size, stroke, badge containers, alignment, semantic usage |
| Remove inconsistency | No mismatched or generic decorative icons |
| Meaning only | Icons never decoration without meaning |

**Chapter assignment:** Design-system work (Ch 1 lineage) + **Polish & Intelligence Program**.

---

### 4. Modern tables and operational lists — REQUIRED BEFORE LAUNCH · PROGRESSIVE + FINAL POLISH

**Surfaces:** Payments history, outstanding invoices, recent activity, customers, employees, communications, reports, schedules, documents, automation records.

| Requirement | Detail |
|-------------|--------|
| Row hierarchy | Modern, scannable rows |
| Status badges | Clear, accessible (not color-only) |
| Identity | Meaningful customer/staff identity |
| Payment method icons | Where appropriate and truthful |
| Interaction states | Hover, selected, focus, actions |
| Mobile | Responsive alternatives to dense grids |
| States | Loading, empty, error, unavailable |
| Avoid | Spreadsheet appearance |
| A11y | Keyboard navigation preserved |

**Chapter assignment:** Chapter-specific list/table redesigns (esp. Ch 4, 6, 7, 8, 10). Final consistency in **Polish & Intelligence Program**.

---

### 5. Summer and Chase intelligence — REQUIRED BEFORE LAUNCH (truth rules) · Summer/AI/BI chapters + FINAL INTELLIGENCE

| Role | Rule |
|------|------|
| **Summer** | AI Business Manager |
| **Chase** | AI Operations Manager concept — remain **Preview / Coming Later** until capabilities are real |

**Required future intelligence (grounded only):**

- Overdue deposits and balances  
- Customer follow-up recommendations  
- Approaching capacity constraints  
- Schedule gaps and cancellation opportunities  
- Explain business changes from grounded data  
- Next actions with confidence + source labels  
- Separate observed facts, calculations, recommendations, forecasts  
- Approval before consequential writes  
- Human control preserved  

**Forbidden:** Invented revenue, availability, capacity, customer intent, or task completion.

**Chapter assignment:** Ch 12 Summer · AI Workforce · Ch 10 Reports/BI · **Polish & Intelligence Program** (verification).

---

### 6. Deep appointment workspace — REQUIRED BEFORE LAUNCH · Ch 5 (+ 7, 9, AI)

Reception/Calendar must open an appointment into the connected customer journey without unnecessary navigation.

**Connected information:**

Customer profile · appointment details · service · employee · location · resource (when supported) · status · payment/balance · invoice/receipt · notes · forms/documents · communication history · past/upcoming visits · grounded AI recommendations  

**Chapter assignment:** **Ch 5** Appointment Workspace Depth · **Ch 7** Communications · **Ch 9** Business Structure Engine · later AI integration.

---

### 7. Business settings experience — REQUIRED BEFORE LAUNCH · Ch 9 + setup/polish

Evolve Business Settings into a **Business Setup and Configuration Centre**.

| Requirement | Detail |
|-------------|--------|
| Categories | Clear setup categories |
| Health | Configuration health + completion states (truthful only) |
| Domains | Locations/resources, payments/tax, booking, employees, communications, security, integrations |
| Summer | Recommendations grounded in configuration state |
| Disclosure | Progressive disclosure for advanced settings |
| Forbidden | Fabricated completion % or recommendations |

**Chapter assignment:** **Ch 9** Business Structure Engine · setup/readiness work · final visual polish.

---

### 8. Payments and financial intelligence — REQUIRED BEFORE LAUNCH · Ch 6 + Ch 10 + Intelligence

| Requirement | Detail |
|-------------|--------|
| Health | Collection health |
| Gross payments | Gross payments collected (do not relabel as revenue) |
| Visibility | Refunds, outstanding invoices, outstanding deposits, deposit success |
| Trends | Payment trends |
| Breakdowns | By service / employee / location **only** with verified SoT |
| Forecasts | Only with methodology + limitations disclosed |
| Separation | Do not mix appointment value with collected payments |

**Chapter assignment:** **Ch 6** Payments · **Ch 10** Reports/BI · **Polish & Intelligence Program**.

---

### 9. Command Centre evolution — REQUIRED BEFORE LAUNCH · Ch 2 enhancements + Intelligence

Owner’s trusted operating homepage.

**Morning:** Today’s schedule · attention · expected arrivals · payment collection needs · staffing context · communications failures · grounded Summer recommendations  

**Evening:** Completed activity · gross payments collected · cancellations/no-shows · outstanding follow-up · tomorrow’s readiness · unresolved issues  

All content: truthful data + business timezone.

**Chapter assignment:** Command Centre enhancements after supporting chapters exist · **Polish & Intelligence Program**.

---

### 10. Richer reports and charts — REQUIRED BEFORE LAUNCH · Ch 10

Trends · comparisons · time-range controls · location/employee scope · definitions/calculation notes · empty/unavailable · accessible charts · export/scheduled reports where supported  

**Forbidden:** Decorative charts; unsupported forecasts.

**Chapter assignment:** **Ch 10** Reports and Business Intelligence.

---

### 11. Customer profile depth — REQUIRED BEFORE LAUNCH · Ch 4 (+ 7, commerce)

Contact · visit history · upcoming appointments · payment/invoice history · outstanding balances · notes · forms · documents · communication timeline · preferences · tags · assigned employee · location history · packages/memberships/gift cards/loyalty **only where supported** · grounded AI summary with source links  

**Chapter assignment:** **Ch 4** Customers · **Ch 7** Communications · relevant commerce/package chapters.

---

### 12. Mobile experience — REQUIRED BEFORE LAUNCH · EVERY CHAPTER + FINAL AUDIT

Responsive nav · mobile Reception agenda · appointment workspace · customer profiles · payments/checkout · touch-friendly actions · no horizontal overflow · sheets/drawers/bottom nav · **375px and 430px** testing  

Avoid requiring difficult Preview authentication as the permanent mobile testing workflow.

**Chapter assignment:** Mobile acceptance criteria in **every chapter** · dedicated mobile audit in **Polish & Intelligence Program**.

---

### 13. Micro-interactions and motion — FINAL POLISH

Thoughtful hover, focus, loading, success, transitions · restrained motion · reduced-motion support · no excessive animation · no effects that slow ops work  

**Chapter assignment:** **Polish & Intelligence Program** after page architecture stabilizes.

---

### 14. System states — REQUIRED BEFORE LAUNCH · PROGRESSIVE + FINAL AUDIT

Every important surface: Loading · Empty · Zero · Unavailable · Permission denied · Error · Partial data · Success · Confirmation · Destructive warning  

**Rule:** Zero must never be shown when the actual value is unavailable.

**Chapter assignment:** Progressive by chapter · final system-state audit in **Polish & Intelligence Program**.

---

### 15. Polish & Intelligence Program — REQUIRED BEFORE LAUNCH (as final gate)

Formal program after functional World Class chapters. See section above.

**Chapter assignment:** Post Ch 4–15 functional spine · before public launch. Track as program milestone (not a substitute for chapter work).

---

## Master assignment matrix

| # | Recommendation | Primary chapters | Launch gate | Final polish |
|---|----------------|------------------|-------------|--------------|
| 1 | Visual hierarchy | Each page chapter | Yes | Yes |
| 2 | Spacing / rhythm | Each page chapter + DS | Yes | Yes |
| 3 | Icon system | DS + Polish Program | Yes | Yes |
| 4 | Tables / lists | 4, 6, 7, 8, 10 (+ others) | Yes | Yes |
| 5 | Summer / Chase intelligence | 12, AI Workforce, 10 | Yes (truth) | Yes (verify) |
| 6 | Deep appointment workspace | **5**, 7, 9, AI | Yes | Partial |
| 7 | Business settings centre | **9**, setup | Yes | Yes |
| 8 | Payments / financial intelligence | **6**, **10** | Yes | Yes |
| 9 | Command Centre evolution | 2 follow-ons + Intelligence | Yes | Yes |
| 10 | Reports / charts | **10** | Yes | Yes |
| 11 | Customer profile depth | **4**, 7, commerce | Yes | Advanced in Ch4 correction (read-first Overview + Edit sheet; remaining depth Ch7/commerce) |
| 12 | Mobile experience | Every chapter | Yes | Yes (audit) |
| 13 | Micro-interactions / motion | Polish Program | Soft | Yes |
| 14 | System states | Every chapter | Yes | Yes (audit) |
| 15 | Polish & Intelligence Program | Post-functional | Yes | Yes |

---

## Explicit non-goals for this lock commit

- No UI redesigns in this commit  
- No booking-engine or payment-logic changes  
- No Production deploy / alias / branch changes  
- No migrations 034–036  
- No shared database writes  
- **Chapter 4 PO-accepted** — Booking Workspace architecture and core interaction flow PO-accepted on Preview after hands-on testing (`4da237c`). Customer Workspace + Adaptive Booking + expandable management + micro-interaction + slot density + progress/Book another + Front-Desk Speed + decision provenance / required-sequence included.
- Remaining Chapter 4 visual refinements are **preserved here** and are **not** reasons to reopen Chapter 4 architecture: motion polish · typography · spacing · stronger information hierarchy · action styling consistency · appointment-management visual refinement · final micro-interactions
- **Chapter 6 Phase 6.2B implemented (historical communications truth) — not PO-accepted** (`0a5001c`). Unique appointment/transaction indexes remain PO/database decisions. Historical USD cleanup remains a PO decision. Package entitlement is not built. Do not start Phase 6.3.
- **Chapter 6 Phase 6.2A = PO ACCEPTED** after hands-on Preview E2E (RCT-0006). Do not reopen 6.2A money or booking contracts.
- **Chapter 6 Phase 6.1 PO-accepted.** Do not reopen 6.1 money contract.
- **Chapter 6 Phase 6.1B implemented — awaiting PO hands-on review.** Phase 6.1 is **not** PO-accepted. Do not start Phase 6.2.
- **Chapter 6 Phase 6.1A implemented — awaiting PO hands-on review.** Phase 6.1 is **not** PO-accepted. Do not start Phase 6.2.
- **Chapter 6 Phase 6.1 implemented** — Front-desk Collect Payment (Customer → Appointment → Payment). Internal IDs are not staff-facing. Do not reopen 6.0B.
- **Chapter 6 Phase 6.0A implemented** — Collectibility + calendar cancel sync.
- **Chapter 6 Phase 6.0 implemented** — Money contract. Do not start Phase 6.1, Stripe Elements, invoice/receipt workspace redesign, or Chapter 7. Payments intelligence polish remains this backlog.
- **Chapter 5 Phase 5.3 PO-accepted** — Week/Month Planning Intelligence + Safe Engine Convergence PO-accepted after hands-on Preview review (`caef495` / tip `284d726`). Do not reopen Phase 5.3 for remaining polish. No Phase 5.4.
- Remaining Phase 5.3 visual / polish items are **preserved here** and are **not** reasons to reopen the accepted surface: repeated Week "New Appointment" CTA treatment · Reception summary/header compression · **Today Operating Centre vs selected calendar planning date must be visually unmistakable (final polish)** · Week/Month typography refinement · Week/Month contrast refinement · final appointment-row/card styling · premium select/filter/menu styling · Agenda/Timeline refinement · global Business Settings hierarchy/density · Employee workspace polish · final motion and micro-interactions · loading/empty/error-state final polish · keyboard drag/resize accessibility · final responsive refinement
- Known architectural gaps remain **documented, not solved**: `staff_locations` not fully authoritative in RPC · API POST / non-cancel PATCH remain PARTIAL · public named create intentionally retains `create_public_appointment` · calendar undo remains FUTURE · keyboard drag/resize not implemented · enriched RPC conflict payloads not started · resource concurrency / `RESOURCE_BUSY` not implemented · optional staff enablement not started · migrations 034 / 035 / 036 remain unapplied · resource scheduling productization remains FUTURE · `CHASUM_OPTIONAL_STAFF_ENABLED` remains disabled
- **Chapter 5 Phase 5.2 PO-accepted** — Calendar Day View and shared Reception calendar operating surface PO-accepted after hands-on Preview review (`e88f22d` / lock `5756a45`). Do not reopen Phase 5.2 for remaining polish.
- Remaining Phase 5.2 visual / intelligence refinements are **preserved here** and are **not** reasons to reopen the accepted surface: further Reception header/operational-summary compression · typography refinement · appointment-card final visual polish · Agenda/Timeline refinement · premium select/filter/menu styling · final motion and micro-interactions · loading/empty/error-state final polish · `staff_locations` RPC multi-location gap · keyboard drag/resize accessibility · resource scheduling remains FUTURE
- **Chapter 5 Phase 5.1** — Availability Truth (SchedulingPolicy / capability matrix); DB gaps documented only
- Locked usability: revisitable decisions; no silent dead clicks; Book another = fresh in-workspace; current decision must dominate; VALUE≠RESOLVED; provenance-aware adaptive skip

---

## Phase 6.1 PO findings — backlog only (do not implement in 6.1A)

Recorded from Preview hands-on. Not in Phase 6.1A scope except as documentation.

| ID | Finding |
|----|---------|
| A | Account & billing navigation/content overlaps Business Profile — future information-architecture consolidation. |
| B | Packages sidebar opens a Business-styled settings surface; Packages should become a clearer first-class catalog workspace. |
| C | Service names containing “Package” coexist with real package objects — terminology confusion. |
| D | Reports has many equal-weight tabs and needs future information architecture / hierarchy refinement. |
| E | Automations empty states duplicate actions (Add to waitlist / Add rule). |
| F | Summer workspace is visually underutilized — richer AI operating-surface treatment belongs in its dedicated chapter. |
| G | AI Workforce shows planned Coming Later specialists while some “Open” controls may imply availability; readiness messaging must remain honest. |
| H | Calendar integrations must not visually overpromise two-way sync unless each integration is genuinely operational. |
| I | Developer / API / Webhook / Zapier / Make surfaces must reflect real launch readiness and security. |
| J | Large-screen density / empty-canvas balance remains part of global polish. |
| K | Appointment editor top **Collect** and lower **Collect payment** both open `CollectPaymentWorkspace` when a balance remains — duplication polish later. Both now hide / show Paid in full when remaining is 0. |
| L | Reception morning-brief KPI still titled “Payment due” while per-appointment copy uses “Balance due” after a deposit — wording only; collectibility unchanged. |
| M | ~~Account-level Collect form~~ **Closed in 6.1D** — generic Record payment removed; unallocated writes rejected. Gift-card redeem on that form deferred (not a wallet). |

---

## Revision

| Date | Change |
|------|--------|
| 2026-08-18 | Chapter 6 Phase 6.2B historical communications truth (`0a5001c`). Missing booking logs are Not recorded, not Not applicable/Skipped. 6.2B not PO-accepted. Phase 6.3 NOT STARTED. |
| 2026-08-18 | Chapter 6 Phase 6.2B first-send copy (`bb655e5`). First send “sent.” vs resend “resent.”; failures do not claim success. 6.2B not PO-accepted. Phase 6.3 NOT STARTED. |
| 2026-08-18 | Chapter 6 Phase 6.2B final PO correction (`022837f`). Collectible remaining on appointment operating surfaces; first-send business refund notification; historical `na` unchanged. 6.2B not PO-accepted. Phase 6.3 NOT STARTED. |
| 2026-08-18 | Chapter 6 Phase 6.2B PO closeout (`cb0a809`). Business refund notification, structured refund reasons, staff/customer email copy, mobile stacked rows, package-catalog forensic. 6.2B not PO-accepted. Phase 6.3 NOT STARTED. |
| 2026-08-18 | Chapter 6 Phase 6.2B forensic closeout (`5d30df8`). CAD deposits, booked-month window, gross cash after partial refund, voluntary refund collectibility, staff notification copy. 6.2B not PO-accepted. Phase 6.3 NOT STARTED. |
| 2026-08-18 | Chapter 6 Phase 6.2B document integrity (`8f21f77`). 6.2B not PO-accepted. Phase 6.3 NOT STARTED. |
| 2026-08-18 | Chapter 6 Phase 6.2A **PO ACCEPTED** after Preview E2E (RCT-0006). Phase 6.2B STARTING. Phase 6.3 NOT STARTED. |
| 2026-08-18 | Chapter 6 Phase 6.2A booking/payment UX closeout. 6.2A not PO-accepted. 6.2B not started. |
| 2026-08-17 | Chapter 6 Phase 6.2A closeout — document integrity. 6.2A not PO-accepted. 6.2B not started. |
| 2026-08-15 | Chapter 6 Phase 6.1D Final Integrity Closeout. Phase 6.1 not PO-accepted. Phase 6.2 not started. |
| 2026-08-15 | Chapter 6 Phase 6.1C Final Closeout. Phase 6.1 not PO-accepted. Phase 6.2 not started. |
| 2026-08-13 | Chapter 6 Phase 6.1 Front-Desk Payments Operating Surface implemented — awaiting PO hands-on review. Phase 6.2 not started. |
| 2026-08-13 | Chapter 6 Phase 6.0B — Cross-View Calendar Synchronization + Transaction-Linked Refund Flow — PO accepted after hands-on Preview testing. Cancellation and refund customer emails confirmed. Phase 6.1 not started. |
| 2026-08-13 | Chapter 6 Phase 6.0B refund confirmation email correction — awaiting PO hands-on review. Phase 6.1 not started. |
| 2026-08-12 | Chapter 6 Phase 6.0B Cross-View Calendar Sync + Transaction-Linked Refund — awaiting PO hands-on review. Phase 6.1 not started. |
| 2026-08-12 | Chapter 6 Phase 6.0A Appointment Lifecycle + Collectibility Integrity — awaiting PO hands-on review. Phase 6.1 not started. |
| 2026-08-11 | Chapter 6 Phase 6.0 Money Contract implemented on Preview — awaiting PO review. Phase 6.1 not started. Payments visual polish remains backlog. |
| 2026-08-11 | Chapter 5 Phase 5.3 — Week/Month Planning Intelligence + Safe Engine Convergence — PO accepted after hands-on Preview review. Deferred polish and architectural gaps preserved. |
| 2026-08-11 | Chapter 5 Phase 5.3 — Week/Month Planning Intelligence + Safe Engine Convergence (PO-narrowed). Enriched RPC / resources / optional staff remain deferred. |
| 2026-08-11 | Chapter 5 Phase 5.2 — Calendar Day View and shared Reception calendar operating surface — PO accepted after hands-on Preview review. Deferred polish preserved. |
| 2026-08-11 | Chapter 5 Phase 5.2 shared canvas — Primary Reception calendar views share one full operating canvas. Day, Week and Month must not use inconsistent page-width constraints. |
| 2026-08-11 | Chapter 5 Phase 5.2 final density correction — Day View must use the available operating workspace rather than leave large unused desktop space |
| 2026-08-11 | Chapter 5 Phase 5.2 Day View Operating Surface Correction (schedule-first; no idle rail; toolbar hierarchy; PO visual pending) |
| 2026-08-10 | Chapter 5 Phase 5.2 Day View implemented (geometry; lanes; cards; mobile; no migrations; PO visual pending) |
| 2026-08-10 | Chapter 5 Phase 5.1 Availability Truth started (policy; no Day View; no migrations) |
| 2026-08-10 | Chapter 5 Phase 5.0 Engine Contract Foundation started (facade; no Day View) |
| 2026-08-10 | Chapter 4 Booking Workspace PO-accepted on Preview (`4da237c`); visual polish remains backlog-only |
| 2026-08-09 | Chapter 4 Booking state integrity — decision provenance & required sequence |
| 2026-08-09 | Chapter 4 Final Booking Interaction & Front-Desk Speed Pass |
| 2026-08-09 | Booking progress navigation + Book another success-action fix |
| 2026-08-07 | Date & Time slot density — present booking-increment starts + More times |
| 2026-08-07 | Booking micro-interaction correction — money input + View Appointment exact ID |
| 2026-08-07 | Existing Appointment expandable management (PO video) |
| 2026-08-07 | Chapter 4 Adaptive Booking Workspace — ask-only-missing + benchmarks |
| 2026-08-07 | Chapter 4 Booking Workspace final acceptance — true progressive stages required |
| 2026-08-07 | Chapter 4 Booking Workspace UX contract locked (`WORLD_CLASS_BOOKING_WORKSPACE.md`) |
| 2026-08-06 | Initial lock from full desktop portal review recommendations |
