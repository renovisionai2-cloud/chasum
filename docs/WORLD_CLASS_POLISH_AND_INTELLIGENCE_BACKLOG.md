# World Class Polish & Intelligence Backlog

**Status:** LOCKED — implementation-grade backlog (documentation only)  
**Source:** Full desktop portal review recommendations (World Class Program)  
**Authority:** This repository. Chat history is not the source of truth.  
**Branch:** `cursor/world-class-portal-foundation`  
**Production:** Untouched (`4eecbec`)  
**Mode:** Planning lock only — **do not implement in this commit**  
**Do not:** Redesign unrelated pages · alter booking/payment engines · run migrations · write shared DB · begin Chapter 5  

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
- **Chapter 4 delivered + correction polish in progress / complete on Preview**

---

## Revision

| Date | Change |
|------|--------|
| 2026-08-06 | Initial lock from full desktop portal review recommendations |
