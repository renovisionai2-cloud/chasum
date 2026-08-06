# World Class Implementation Blueprint

**Program:** Chasum World Class Execution Program  
**Chapter:** 3 — Reception and Calendar (**complete — awaiting PO review**)  
**Branch:** `cursor/world-class-portal-foundation`  
**Chapter 3 docs:** [`WORLD_CLASS_RECEPTION_CALENDAR_BLUEPRINT.md`](./WORLD_CLASS_RECEPTION_CALENDAR_BLUEPRINT.md) · [`WORLD_CLASS_RECEPTION_CALENDAR_DATA_DICTIONARY.md`](./WORLD_CLASS_RECEPTION_CALENDAR_DATA_DICTIONARY.md)  
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
| 3 | Reception and calendar | **Complete — awaiting PO review** |
| 4 | Customers | Not started |
| 5 | Appointment workspace | Not started |
| 6 | Sales, payments, invoices, receipts | Not started |
| 7 | Communications | Not started |
| 8 | Employees and team | Not started |
| 9 | Business setup and settings | Not started |
| 10 | Business intelligence | Not started |
| 11 | Growth and retention | Not started |
| 12 | Summer AI Business Manager | Not started |
| 13 | Marketing parity completion | Matrix complete; fixes need PO (locks) |
| 14 | Industry readiness | Matrix complete; product work later |
| 15 | Full platform QA | Not started |

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

**Complete — awaiting PO review.** Reception + Calendar share LocationScope + appointment-ops SoT; Reception brief rebuilt; misleading slot/revenue KPIs removed; employee/status filters; payment readiness on day + mobile agenda; unassigned create remains gated. Data dictionary: [`WORLD_CLASS_RECEPTION_CALENDAR_DATA_DICTIONARY.md`](./WORLD_CLASS_RECEPTION_CALENDAR_DATA_DICTIONARY.md).

## Next step after PO approval

Begin **Execution Chapter 4 — Customers** only after PO approves Chapter 3. Do not start Chapter 4 until then.
