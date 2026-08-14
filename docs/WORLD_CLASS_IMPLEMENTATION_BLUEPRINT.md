# World Class Implementation Blueprint

**Program:** Chasum World Class Execution Program  
**Chapter:** 6 — Sales, Payments, Invoices & Receipts (**Phase 6.1A implemented — 6.1 not PO-accepted**; 6.0B PO-accepted)  
**Branch:** `cursor/world-class-portal-foundation`  
**Chapter 3 commit:** `4b4a29e` · Preview https://chasum-76u5xrh9c-renovisionappcom.vercel.app  
**Chapter 2 tip (approved):** `0f1f423`  
**Chapter 2 feature commit:** `20e0c89` · Preview https://chasum-q4yk6yain-renovisionappcom.vercel.app  
**Chapter 1 tip (approved):** `3682717` · Preview https://chasum-9j1con47j-renovisionappcom.vercel.app  
**Production baseline:** `4eecbec0f0f04532ae0294132d07183b6e64f23f` · tag `phase-0-gvm-production-2026-08-04` · https://chasum.vercel.app  
**Mode:** Preview-only product work on World Class branch — no Production deploy, no migrations **034–036**, no live destructive data, no marketing content edits, **do not start Chapter 4 until PO approves Chapter 3**  

---

## Golden rule

**Protect the core engine; improve the experience.**

Phase 0 GVM workflows (assigned-employee booking, exclusive tax, deposits, receipts, confirmations, business notifications, timezone, resend) are stable.

---

## Chapter numbering (locked for this program)

| Ch | Name | Status |
|----|------|--------|
| 0 | Repository and product audit | Complete (approved foundation for program) |
| 1 | Design system and portal foundation | **Approved** (`3682717`) |
| 2 | Command Centre | **Approved** (`0f1f423` tip) |
| 3 | Reception and calendar | **Correction pass — awaiting PO review** |
| 4 | Customers + Booking Workspace | **PO-accepted** (`4da237c`) — architecture + core interaction flow locked |
| 5 | Calendar & Booking Engine | **Phase 5.2 PO-accepted**; **Phase 5.3 PO-accepted** (`caef495` / tip `284d726`) |
| 6 | Sales, payments, invoices, receipts | **Phase 6.0B PO-accepted. Phase 6.1 not PO-accepted. Phase 6.1A implemented — awaiting PO hands-on review.** 6.2 / 6.3 / 6.4 not started. |
| 7 | Communications | Not started |
| 8 | Employees and team | Not started |
| 9 | **Business Structure Engine** (locations, resources, service requirements) | Not started — architecture documented |
| 10 | Business intelligence | Not started |
| 11 | Growth and retention | Not started |
| 12 | Summer AI Business Manager | Not started |
| 13 | Marketing parity completion | Matrix complete; fixes need PO (locks) |
| 14 | Industry readiness | Matrix complete; product work later |
| 15 | Full platform QA | Not started |
| — | **World Class Polish & Intelligence Program** | Locked backlog — after functional chapters; required before public launch |

**Polish & Intelligence backlog (locked):** [`WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md`](./WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md) — visual hierarchy, spacing, icons, tables, Summer/Chase intelligence, appointment depth, business setup centre, payments intelligence, Command Centre evolution, reports, customer depth, mobile, motion, system states. Progressive by chapter; final gate before launch.

**Prior naming:** Docs that say “Phase 1 portal foundation” = Execution **Chapter 1 (partial)**.

**Review gate:** Each chapter → audit → implement → test → Preview → report → **stop for review**. Do not begin Ch N+1 until Ch N approved.

---

## Database & Production restrictions

| Restriction | Policy |
|-------------|--------|
| Shared Supabase Preview ↔ Production | No experimental writes; prefer read-only audits |
| Migrations **034, 035, 036** | **Do not apply** without explicit PO |
| Production branch / alias / deploy | **Do not touch** |
| Live GVM data | **Do not modify** |

---

## Critical risks (Addendum)

See full dossiers in [`WORLD_CLASS_MARKETING_PRODUCT_PARITY.md`](./WORLD_CLASS_MARKETING_PRODUCT_PARITY.md) § A–H.

1. Online Payments wording vs manual + Elements Coming Next  
2. Inventory on Business Pricing vs Coming Soon vs placeholder  
3. Summer Roadmap Available Today vs Early Access  
4. Memberships Coming Soon vs live Business Hub CRUD  
5. Multi-location Future Vision vs live + Truth  
6. Staff limits marketed, **not enforced**  
7. Business locations **6 vs 10** — **OWNER DECISION REQUIRED**  
8. Dormant `IMPACT_STATS` / `TESTIMONIALS` / `LOGO_CLOUD` remount risk  

---

## Baseline quality debt (do not fix in Chapter 0)

Recorded on branch tip `f8e1c33` / re-verified during Addendum. **Docs-only commits must not change these numbers.**

### Permanent quality rule (all future chapters)

> **No future chapter may introduce additional lint errors, warnings, failing tests, type-check failures, or build failures.**  
> Each chapter delivery report must list: **Baseline inherited failures** · **Newly introduced failures** · **Resolved inherited failures**.

### Typecheck / build

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npm run build` | Pass (Next 16.2.10; middleware→proxy deprecation warning only) |

### Exact failing test

| Field | Value |
|-------|--------|
| File | `tests/unit/marketing/multi-business-selection.test.ts` |
| Case | `multi-business selection helpers > shows all businessTypes in the understanding profile` |
| Assertion | `expect(business?.discovered).toBe(true)` — received `undefined` |
| Suite snapshot | **266 passed, 1 failed** (53 files) |
| Chapter 0 impact | **None** (pre-existing; marketing helper) |
| Recommended remediation chapter | 13 (marketing honesty) or dedicated test-fix slice with PO |

### Lint baseline by category

Total: **54 problems (34 errors, 20 warnings)** — predate Chapter 0 product work; **unchanged by docs**.

| Rule / pattern | Severity | Occurrences | File count (approx.) | Predates Ch 0? | Affects Ch 1 shell files? | Remediation chapter |
|----------------|----------|-------------|----------------------|----------------|---------------------------|---------------------|
| React Compiler / hooks: setState synchronously in effect (“cascading renders”) | error | 15 | ~10 (booking-sheet, day-view, reception, dashboard shell, ui/sheet, date-field, …) | Yes | **Yes** — `components/dashboard/command-trigger.tsx`, `sidebar.tsx` | 1 (shell) + 3 (reception) — fix when touching files |
| React Compiler / hooks: Cannot access refs during render | error | 13 | reception `quick-appointment.tsx` heavy + related | Yes | Indirect (reception) | 3 |
| `prefer-const` | error | 2 | `lib/actions/staff.ts` | Yes | No | 8 |
| Impure function during render | error | 2 | reception / related | Yes | No | 3 |
| Variable used before declared | error | 1 | `quick-appointment.tsx` | Yes | No | 3 |
| Existing memoization could not be preserved | error | 1 | reception | Yes | No | 3 |
| `@typescript-eslint/no-unused-vars` | warning | 19 | booking-sheet, providers, booking-delivery, **untracked brand scripts** | Yes | Partial | 3–7; brand scripts stay untracked |
| `react-hooks/exhaustive-deps` | warning | 1 | `calendar-client.tsx` | Yes | No | 3 |

**Note:** Untracked brand scripts (`scripts/rebuild-brand-*.mjs`, `refine-brand-six.mjs`) contribute unused-var warnings when lint scans them; they remain **excluded from git** per program policy.

---

## Untracked files (excluded — do not commit)

- `docs/brand/CHASUM.pdf`  
- `scripts/rebuild-brand-from-board.mjs`  
- `scripts/rebuild-brand-v2-clean.mjs`  
- `scripts/refine-brand-six.mjs`  
- `tmp/`  

---

## Companion Chapter 0 documents

- [`WORLD_CLASS_DESIGN_SYSTEM.md`](./WORLD_CLASS_DESIGN_SYSTEM.md)  
- [`WORLD_CLASS_ROUTE_AND_NAVIGATION_MAP.md`](./WORLD_CLASS_ROUTE_AND_NAVIGATION_MAP.md)  
- [`WORLD_CLASS_MARKETING_PRODUCT_PARITY.md`](./WORLD_CLASS_MARKETING_PRODUCT_PARITY.md)  
- [`WORLD_CLASS_PLAN_ENTITLEMENT_MATRIX.md`](./WORLD_CLASS_PLAN_ENTITLEMENT_MATRIX.md)  
- [`WORLD_CLASS_INDUSTRY_READINESS_MATRIX.md`](./WORLD_CLASS_INDUSTRY_READINESS_MATRIX.md)  
- [`WORLD_CLASS_TESTING_MATRIX.md`](./WORLD_CLASS_TESTING_MATRIX.md)  
- [`WORLD_CLASS_RELEASE_LOG.md`](./WORLD_CLASS_RELEASE_LOG.md)  
- [`WORLD_CLASS_COMMAND_CENTRE_DATA_DICTIONARY.md`](./WORLD_CLASS_COMMAND_CENTRE_DATA_DICTIONARY.md)  

---

## Chapter 1 status

**Approved** at `3682717`. DS tokens, shell a11y, Command Centre label, command/quick-create, Summer Early Access chrome.

## Chapter 2 status

**Approved & locked** at tip `0f1f423`. Command Centre action-first daily operating view; commerce SoT for money; appointments-today shared helpers.

## Chapter 3 status

**Correction pass complete.** Business-TZ ranges for day/week/month; unassigned create shows coming-soon (disabled); employee filter order fixed; Chase capacity/revenue Unavailable; Resources empty state truthful; architecture doc for Chapter 9. Data dictionary: [`WORLD_CLASS_RECEPTION_CALENDAR_DATA_DICTIONARY.md`](./WORLD_CLASS_RECEPTION_CALENDAR_DATA_DICTIONARY.md). Locations/Resources: [`WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md`](./WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md).

## Chapter 4 status

**Chapter 4 Booking Workspace architecture and core interaction flow PO-accepted on Preview after hands-on testing** (accepted tip `4da237c`). Product distinction and provenance locked in [`WORLD_CLASS_BOOKING_WORKSPACE.md`](./WORLD_CLASS_BOOKING_WORKSPACE.md). Remaining visual polish stays in the Polish & Intelligence backlog — not architecture reopen.

## Chapter 5 status

**Phase 5.2 PO-accepted.** **Chapter 5 Phase 5.3 — Week/Month Planning Intelligence + Safe Engine Convergence — PO accepted after hands-on Preview review** (`caef495` / tip `284d726`). Architecture: [`WORLD_CLASS_CALENDAR_BOOKING_ENGINE.md`](./WORLD_CLASS_CALENDAR_BOOKING_ENGINE.md). Enriched RPC payloads, resource productization, and optional staff remain deferred. No Phase 5.4.

## Chapter 6 status

**Phase 6.0B PO-accepted.** **Phase 6.1 — Front-Desk Payments Operating Surface implemented — awaiting PO hands-on review.** Lock: Customer → Appointment → Payment. Internal IDs are not normal user input. One money engine. No Stripe Elements. No migrations. Phase 6.2 not started.

Sequence: 6.0 foundation → 6.0A collectibility → **6.0B calendar sync + refund UX** → 6.1 front-desk payments surface → 6.2 invoice & receipt workspace → 6.3 refunds / outstanding / follow-up → 6.4 online payment completion (PO-gated).

## Next step after Chapter 6 Phase 6.1

Await **PO hands-on review of Phase 6.1**. Do **not** start Phase 6.2. Do **not** start Chapter 7.
### Locked usability principles (post-booking + money + navigation + speed)

1. Monetary fields must behave like normal high-quality editable inputs and must not fight the user's cursor.
2. View Appointment after booking must open the exact appointment that was just created.
3. Chasum must never require the user to search for an entity that the current workflow already knows.
4. Completed or context-prefilled booking decisions must be directly revisitable.
5. Unavailable booking stages must visibly communicate that they are unavailable; never silent dead clicks.
6. The current booking decision must visually dominate; the next action must be obvious.

## Chapter 9 — Business Structure Engine (planning)

Expand beyond “basic setup” into:

- Location CRUD, archive, hours, timezone, contacts, staff, services, taxes, notifications, plan limits  
- Resource CRUD, types, location relationships, availability, blocking, maintenance  
- Service booking requirements (person / place / equipment combinations)  
- Capacity and multi-resource conflicts  
- Permissions  

**Do not implement in Chapters 3–8.** Architecture locked in [`WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md`](./WORLD_CLASS_LOCATIONS_RESOURCES_ARCHITECTURE.md) as **REQUIRED BEFORE PUBLIC LAUNCH**.

## World Class Polish & Intelligence Program (locked)

After functional chapters, run the formal **Polish & Intelligence Program** documented in [`WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md`](./WORLD_CLASS_POLISH_AND_INTELLIGENCE_BACKLOG.md).

Includes cross-portal hierarchy, spacing, icons, tables, charts, Summer/Chase verification, system states, mobile, a11y, performance, truthfulness, industry readiness, and marketing parity.

This is **planning-locked now**; implementation is **not** started by this documentation commit.
