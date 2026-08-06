# World Class Testing Matrix

**Chapter:** 0 — Scaffold for continuous use  
**Rule:** Do not mark complete on appearance alone; verify data and workflow.  

---

## Environment

| Item | Value |
|------|--------|
| Production | https://chasum.vercel.app @ `4eecbec` |
| World Class Preview | https://chasum-f2djbjdae-renovisionappcom.vercel.app @ `d86e398` |
| Branch | `cursor/world-class-portal-foundation` |
| Shared DB | Yes — **read-only preferred** on Preview for audits; no test appointments in Chapter 0 |

---

## Page test template (copy per route)

| Field | Value |
|-------|--------|
| Route | |
| Purpose | |
| Roles | Owner / staff (future) |
| Plans | Free / Pro / Business / Enterprise / Private Alpha |
| Data deps | |
| Desktop | Pass / Fail / N/A |
| Mobile 375 / 430 | |
| Tablet | |
| Keyboard | |
| A11y | |
| Loading / Empty / Error / Permission | |
| Timezone | |
| Multi-location | |
| Regression risk | |
| Result | |
| Evidence | |
| Notes | |
| Approval | |

---

## Feature test template

| Field | Value |
|-------|--------|
| Feature | |
| Entry | |
| Preconditions | |
| Steps | |
| Expected / Actual | |
| Backend record | |
| Email/SMS | |
| Payment provider | |
| Cross-page | |
| Mobile | |
| Failure / permission / plan / industry | |
| Pass/Fail | |
| Bug / retest | |

---

## Mandatory regression scenarios (protect every chapter)

| # | Scenario | Owner chapter | Baseline |
|---|----------|---------------|----------|
| 1 | New customer | 4 | Open |
| 2 | Edit customer | 4 | Open |
| 3 | New booking (assigned employee) | 3,5 | Phase 0 OK |
| 4 | Package / service booking | 3,5 | Open |
| 5 | Taxes exclusive | 5,6 | Phase 0 OK |
| 6 | Deposits / due now / remaining | 5,6 | Phase 0 OK |
| 7 | Full / partial payment | 6 | Open |
| 8 | Invoice / receipt / refund | 6 | Open |
| 9 | Customer confirmation email | 7 | Phase 0 OK |
| 10 | Business new-booking email | 7 | Phase 0 OK |
| 11 | Resend (no duplicate tx) | 7 | Phase 0 OK |
| 12 | Calendar visibility | 3 | Open |
| 13 | Update / cancel / reschedule | 3,5 | Open |
| 14 | Business / Canadian timezone | 3,7 | Phase 0 OK |
| 15 | Multi-location booking | 3,9 | Open |
| 16 | Employee assignment | 3,8 | Open |
| 17 | Unassigned employee behavior | 3,8 | **Not prod-ready** — do not claim |
| 18 | Plan staff / location limits | 8,9,13 | Gaps documented |
| 19 | Add Location + upgrade prompt | 9 | Open |
| 20 | Mobile booking / customer / payment | 3,4,6 | Open |

---

## Chapter 0 baseline automated results

Recorded 2026-08-05 on branch tip before Chapter 0 commit (`0496196`); docs-only chapter does not change these baselines.

| Check | Result |
|-------|--------|
| Typecheck (`npm run typecheck`) | **Pass** (exit 0) |
| Lint (`npm run lint`) | **Pre-existing fail signal:** 54 problems (34 errors, 20 warnings). Includes prefer-const in app code, unused vars, and untracked brand scripts. **Not introduced by Chapter 0.** |
| Unit tests (`npm test`) | **266 passed, 1 failed** (53 files). Failure: `tests/unit/marketing/multi-business-selection.test.ts` — `shows all businessTypes in the understanding profile` (`business?.discovered` undefined). **Pre-existing / unrelated to Chapter 0 docs.** |
| Build (`npm run build`) | **Pass** (exit 0). Next.js 16.2.10 Turbopack; middleware→proxy deprecation warning only. |

---

## Shell smoke (Chapter 1 already shipped — retest after each chapter)

| Check | Result |
|-------|--------|
| Grouped nav visible | |
| Command opens (⌘K) not fake link | |
| HQ hidden for tenant | |
| Developer in Advanced | |
| Mobile bottom nav + More | |
| Summer entry | |  
