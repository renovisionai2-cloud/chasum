# World Class Marketing ↔ Product Parity

**Chapter:** 0 — Audit Completion Addendum  
**Branch:** `cursor/world-class-portal-foundation`  
**Production baseline:** `4eecbec` · https://chasum.vercel.app · tag `phase-0-gvm-production-2026-08-04`  
**Claim authority:** [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md)  
**Locked marketing pages:** Pricing, Roadmap, Meet Summer, Resources (Private Alpha / Security / Status) — **do not change copy in this chapter**  
**Method:** Inspected every `app/(marketing)/*` route, `lib/marketing/*`, landing components, nav/footer, FAQs, plan cards, workflows, dormant constants  
**Mode:** Document conflicts only — no marketing or product code changes  

---

## Locked owner decisions (approved with Chapter 0)

1. Online Payments — only genuinely connected/tested workflows.  
2. Inventory — Roadmap/Coming Soon (not available Business capability).  
3. Summer — Early Access / Private Alpha (not full vision as Available Today).  
4. Memberships — Beta/Incomplete until verified.  
5. Core multi-location available where proven; franchise-scale future.  
6. Staff limits need UI + server enforcement; migration separate.  
7. Business location marketing limit = **six** (do not silently change DB).  
8. Never render unsupported IMPACT_STATS / TESTIMONIALS.  
9. Start Free honesty → marketing-parity chapter.  
10. Calls & Texting only with plan + providers.  
11. Paid/API areas need full-stack enforcement over time.  
12. Education not fully supported until workflows + tests complete.


## Classification vocabulary (this matrix)

| Code | Meaning |
|------|---------|
| AVAILABLE AND VERIFIED | Present, real data, aligned with Truth Matrix, known tested |
| AVAILABLE BUT UNVERIFIED | Present but Chapter 0 did not re-verify end-to-end |
| PARTIALLY IMPLEMENTED | Real but narrower than the claim |
| UI ONLY | Surface exists without backing workflow |
| BACKEND ONLY | Data/API without marketed UX |
| BETA / PRIVATE ALPHA / COMING SOON / ROADMAP | As disclosed (or should be) |
| AMBIGUOUS MARKETING CLAIM | Visitor could reasonably believe it is fully available now |
| NOT IMPLEMENTED | No usable product |
| MARKETING-PRODUCT CONFLICT | Marketing status disagrees with product or Truth Matrix |

**Verify column:** `Open` until Chapter 13 sign-off.

---

## Audit coverage

| Marketing route | Live? | Primary claim sources | Approx. inventorable promises |
|-----------------|-------|----------------------|-------------------------------|
| `/` | Yes | `app/(marketing)/page.tsx`, hero, connected OS, summer-intro, homepage-industries, trust, private-alpha-invite | ~18 |
| `/platform` | Yes | `platform-page.ts`, `PLATFORM_MODULES` | ~20 |
| `/product-tour` | Yes | `product-tour-page.ts`, `PLATFORM_MODULES` | ~16 |
| `/meet-summer` | Yes | `flagship-summer.ts` (live); `meet-summer.ts` CH7 dormant | ~25 live |
| `/industries` | Yes | `homepage.INDUSTRIES` + chips (overview only; **no** `/industries/[slug]`) | 11 industries × solution + 9 chips ≈ 110+ |
| `/pricing` | Yes | `pricing.ts` catalog × 4 plans + FAQ + workflow | ~45+ |
| `/roadmap` | Yes | `roadmap.ts` 9+7+6 cards | 22 |
| `/private-alpha` | Yes | `resources-private-alpha.ts` | ~12 |
| `/security` | Yes | `resources-security.ts` | ~10 |
| `/status` | Yes | `resources-status.ts` | 6 services |
| `/apply` | Yes | `alpha.ts` + apply form | low |
| `/contact` | Yes | contact CTAs | low |
| `/terms`, `/privacy` | Yes | legal + Early Access / Stripe when enabled | low |
| Nav / Footer | Layout | `header.tsx`, `footer.tsx`, `lib/constants.ts` | links + blurbs |
| Dormant (not mounted) | No | `IMPACT_STATS`, `TESTIMONIALS`, `LOGO_CLOUD`, Comparison, FAQ components, `MEET_SUMMER_CH7` | latent risk |

**Routes audited:** 14 customer-facing marketing routes (+ shared layout nav/footer).  
**Individual industry pages:** **0** (overview only).  
**Homepage Education tile:** present on `/` only; **not** in `INDUSTRIES` / `/industries`.

---

## Critical claim resolution (A–H)

### A. Online Payments

| Field | Finding |
|-------|---------|
| **Where promised** | Pricing catalog `payments` = “Online Payments” (Pro+); Pricing workflow “Accept payments securely.”; Roadmap Available Today “Payments — Collect payments and deposits…”; Homepage Connected OS Payments = Available Today; Industries chips “Payments”; Platform/Product Tour payment/ledger language; Status “Payment integrations” Configuration Required |
| **Plans** | Professional, Business, Enterprise (`pricing.ts`); Free = false |
| **Connected processing** | **Manual ledger Available Today** (`lib/commerce/providers/manual.ts`). Stripe PaymentIntent / client secret path exists; **Stripe Elements card collection Coming Next** (Truth Matrix). |
| **Sync of invoices / deposits / refunds / receipts / balances** | Phase 0 GVM path: deposits, taxes, receipts, payment records, invoice relationships **exist and must stay protected**. Depth and “online card” UX are not fully marketed-accurate. |
| **Claim broader than implementation?** | **Yes.** “Online Payments” + “Accept payments securely” imply card/online checkout; product is manual-first + Elements incomplete. |
| **Classification** | MARKETING-PRODUCT CONFLICT / PARTIALLY IMPLEMENTED |
| **Severity** | Critical |
| **Resolution** | **OWNER DECISION REQUIRED:** (1) narrow marketing wording to “Record payments & deposits” / manual Available + card Coming Next, or (2) complete Elements (Ch 6) then keep claim. Locked pages need PO. |
| **Chapter** | 6, 13 |

### B. Inventory

| Field | Finding |
|-------|---------|
| **Marketing locations** | Pricing Business+ `inventory` “Inventory Management” note “Available where applicable.”; Roadmap **Coming Soon** “Inventory Management”; Concierge pricing knowledge echoes Business inventory |
| **Product** | `buildInventoryPlaceholder()` in `lib/reports/compute.ts` — **no** inventory data model, API, entitlement gate, or real UI |
| **“Where applicable” clear enough?** | **No** — still listed as a Business plan inclusion on a locked Pricing page |
| **Classification** | MARKETING-PRODUCT CONFLICT / NOT IMPLEMENTED |
| **Severity** | Critical |
| **Resolution** | **OWNER DECISION REQUIRED:** implement real inventory (Ch 10+), or move Pricing claim to Coming Soon / remove from Business card (PO unlock), or beta-label with explicit non-availability |
| **Chapter** | 10, 13 |

### C. Summer “Available Today”

| Field | Finding |
|-------|---------|
| **Where “available now”** | Roadmap Available Today card “Summer AI Business Manager” (no Early Access qualifier); Pricing includes Summer on Pro+; Meet Summer hero as AI Business Manager; homepage Summer Early Access badge elsewhere |
| **What Summer does today** | Website Concierge / product guide; in-app Early Access assistance (`/dashboard/ai-workforce/summer`); grounded scheduling recommendations; **not** autonomous business management; voice = not available (FAQ) |
| **Live / limited / placeholder / conceptual** | Live: website concierge, Early Access in-app guidance. Limited: automation language. Placeholder/conceptual: full AI Reception voice, autonomous ops, invented BI |
| **Overclaim** | Roadmap status vs Truth “Early Access”; “automate repetitive work” / staff training language overreaches |
| **Classification** | MARKETING-PRODUCT CONFLICT (status vocab) / PARTIALLY IMPLEMENTED (product) |
| **Severity** | Critical |
| **Resolution** | **OWNER DECISION REQUIRED:** align Roadmap Summer to Early Access **or** redefine Truth Matrix — do not guess |
| **Chapter** | 12, 13 |

### D. Memberships

| Field | Finding |
|-------|---------|
| **Coming Soon** | Roadmap `Memberships & Service Packages` |
| **Live portal** | Business Hub tab `memberships` — CRUD via `lib/actions/business-management.ts` (`listMemberships`, save, `deleteMembership`); `components/business/business-hub.tsx` |
| **Completeness** | Operator CRUD **partial/complete for directory-style memberships**; not full membership OS (recurring billing, class capacity, portal purchase) |
| **Conflict source** | `roadmap.ts` Coming Soon vs `PLATFORM_MODULES` / Gyms copy implying live vs hub CRUD |
| **Classification** | MARKETING-PRODUCT CONFLICT |
| **Severity** | Critical |
| **Resolution** | **OWNER DECISION REQUIRED:** move Roadmap card to Available Today (with honest depth), or hide/limit hub until roadmap true |
| **Chapter** | 9, 11, 13 |

### E. Multi-location

| Field | Finding |
|-------|---------|
| **Future Vision** | Roadmap “Multi-location Management” |
| **Available Today** | Truth Matrix; Pricing location limits; Industries chip; homepage FAQ; location CRUD + booking scope |
| **Functionality** | Locations create/list, plan quotas via `can_add_location`, calendar/services/staff location scope — **operational** for Private Alpha / GVM |
| **Plan limits** | Free 1 · Pro 3 · Business **marketing 6 / catalog-DB 10** · Enterprise unlimited · Private Alpha RPC can bypass |
| **Which claims correct?** | Truth + Pricing “current entitlement” correct direction; Roadmap Future Vision **misleading** |
| **Classification** | MARKETING-PRODUCT CONFLICT |
| **Severity** | Critical |
| **Resolution** | **OWNER DECISION REQUIRED:** move Roadmap card to Available Today (or rename Future Vision to franchise-scale multi-org) |
| **Chapter** | 9, 13 |

### F. Staff limits

| Plan | Promised | UI enforcement | Server/API | Bypass |
|------|----------|----------------|------------|--------|
| Free | 1 | **None** | **None** (`createStaff` uncapped) | Yes |
| Professional | Up to 3 | **None** | **None** | Yes |
| Business / Enterprise | Unlimited | N/A | N/A | N/A |
| FAQ | “clear upgrade prompt” | **Not found** | — | — |

| Classification | Marketing-only / **Not enforced** |
| Severity | High |
| Resolution | **OWNER DECISION REQUIRED** before DB/RPC (shared Supabase) — Ch 8, 13 |
| Downgrade | Not implemented / not tested |

### G. Business location limit — 6 vs 10

| Source | Value |
|--------|-------|
| `lib/marketing/pricing.ts` Business `location_limit` | **Up to 6** |
| Pricing FAQ | **up to 6 locations** |
| Concierge pricing knowledge | **up to 6** |
| `lib/billing/catalog.ts` `FALLBACK_PLANS.business.maxLocations` | **10** |
| `supabase/migrations/008_phase5_multi_location.sql` | **10** |
| `supabase/migrations/015_billing_phase1.sql` | **10** |

**Do not choose a new limit in Chapter 0.**  
**OWNER DECISION REQUIRED:** align marketing to 10, or catalog/DB to 6 (migration needs separate PO — not in this addendum).  
Severity: High · Chapter 9, 13

### H. Dormant marketing data

| Constant | File | Visible on live pages? | Contents risk | Treatment |
|----------|------|------------------------|---------------|-----------|
| `IMPACT_STATS` | `lib/marketing/homepage.ts` | **No** — only `impact-counters.tsx`, **unmounted** | Fake scale (240+ businesses, $2.4M+, 14 countries) | Quarantine / delete before remount; violates Truth non-claims |
| `TESTIMONIALS` | same | **No** — `testimonials.tsx` unmounted | Invented people/companies; memberships social proof | Same |
| `LOGO_CLOUD` | same | **No** — `logo-cloud.tsx` unmounted | Fake brand names | Same |
| `MEET_SUMMER_CH7` | `meet-summer.ts` | **No** (flagship experience used instead) | “AI Receptionist Today” conflict | Keep dormant or delete; do not remount |
| `TRUSTED_STATS` | homepage.ts | Check mounts — softer internal counts | Lower risk if framed as product structure | Verify before reuse |

**Severity if remounted:** Critical · Chapter 13 · **OWNER DECISION REQUIRED** on quarantine vs delete

---

## Parity matrix — priority & comprehensive rows

Column key: Route · Source · Section · Claim · Category · Plan · Industry · Visitor status · Portal · Product · Real data · Backend · Auto test · Manual · Mobile · Mismatch · Severity · Resolution · Chapter · Verify · Class

### Homepage `/`

| Route | Source | Section | Claim | Category | Plan | Ind. | Status shown | Portal | Product | Real | BE | Auto | Manual | Mobile | Mismatch | Sev | Resolution | Ch | Verify | Class |
|-------|--------|---------|-------|----------|------|------|--------------|--------|---------|------|----|------|--------|--------|----------|-----|------------|----|--------|-------|
| `/` | `hero.tsx` | Hero | Connects scheduling, customers, communication, payments, reporting, AI | OS | All | — | Implied now | Dashboard | Partial OS | Mixed | Soft | — | Partial | Partial | Payments/AI depth | Med | Qualifiers / Truth | 13 | Open | AMBIGUOUS MARKETING CLAIM |
| `/` | `connected-operating-system.tsx` | Payments row | Payments Available Today | Payments | All | — | Available Today | `/dashboard/payments` | Manual AT; card Coming Next | Manual | Soft | Partial | Partial | Partial | Overbroad “online” | Crit | PO wording or Ch6 | 6,13 | Open | MARKETING-PRODUCT CONFLICT |
| `/` | same | AI row | AI Assistance Early Access | Summer | — | — | Early Access | Summer routes | EA | EA | Soft | Partial | Partial | Partial | OK vs Truth | Low | Keep | 12 | Open | BETA / PRIVATE ALPHA |
| `/` | `summer-intro.tsx` | Body | Automate repetitive work… grow every day + Early Access badge | Summer | — | — | Early Access | Summer | Guidance EA | EA | Soft | — | — | Partial | Automate overreach | High | Soften copy (PO) | 12,13 | Open | AMBIGUOUS MARKETING CLAIM |
| `/` | `homepage-industries.tsx` | Tiles | 10 category tiles incl. **Education** | Industry | — | Mixed | Soft | — | Education not on `/industries` | — | — | — | — | Partial | Taxonomy drift | Med | Align lists | 14 | Open | AMBIGUOUS MARKETING CLAIM |
| `/` | `private-alpha-invite.tsx` | CTA | Apply Private Alpha | Process | Alpha | — | Process | `/apply` | Process | — | — | — | — | OK | — | Low | Keep | — | OK | PRIVATE ALPHA |
| `/` | OG metadata | Meta | Payments + AI in one OS | OS | — | — | Implied | — | Partial | Mixed | — | — | — | — | Soft overclaim | Med | Align meta | 13 | Open | AMBIGUOUS MARKETING CLAIM |

### Pricing `/pricing`

| Route | Source | Section | Claim | Category | Plan | Ind. | Status | Portal | Product | Real | BE | Auto | Manual | Mobile | Mismatch | Sev | Resolution | Ch | Verify | Class |
|-------|--------|---------|-------|----------|------|------|--------|--------|---------|------|----|------|--------|--------|----------|-----|------------|----|--------|-------|
| `/pricing` | `pricing.ts` | Catalog | Online Payments | Payments | Pro+ | — | Included now | Payments | Manual AT; Elements Coming Next | Manual | **None** plan gate | Partial | Partial | Partial | Name vs depth | Crit | PO | 6,13 | Open | MARKETING-PRODUCT CONFLICT |
| `/pricing` | same | Workflow | Accept payments securely | Payments | Narrative | — | Now | Payments | Partial | Manual | Soft | — | — | Partial | Overbroad | Crit | PO | 6,13 | Open | AMBIGUOUS MARKETING CLAIM |
| `/pricing` | same | Free card | Booking, calendar, email, CRM, 1 staff, 1 loc, branding | Core | Free | — | Now | Multiple | Core yes; staff uncapped | Yes | Loc yes; staff **no** | Partial | GVM | Partial | Staff ungated | High | Enforce or change claim | 8,13 | Open | PARTIALLY IMPLEMENTED |
| `/pricing` | same | Free CTA | Start Free → `/apply` | CTA | Free | — | Self-serve tone | Apply | No public Free signup | N/A | — | — | — | OK | Self-serve illusion | High | CTA honesty (PO) | 13 | Open | AMBIGUOUS MARKETING CLAIM |
| `/pricing` | same | Free unavailable | No invoicing / SMS / business messaging | Comms | Free | — | Excluded | — | SMS gated; invoicing **not** plan-gated | Mixed | SMS yes | — | — | — | Invoicing exposure | High | Gate or change claim | 6,7,13 | Open | PARTIALLY IMPLEMENTED |
| `/pricing` | same | Pro | Summer AI Business Manager | Summer | Pro+ | — | Included | Summer | Early Access | EA | **None** | Partial | Partial | Partial | Status + ungated Free | High | Gate + EA label | 12,13 | Open | PARTIALLY IMPLEMENTED |
| `/pricing` | same | Pro | SMS Reminders | SMS | Pro+ | — | Included | Comms | EA + Twilio | Config | **Yes** `planIncludesSms` | Partial | Partial | Partial | Config dep. | Med | Keep + config honesty | 7 | Open | AVAILABLE BUT UNVERIFIED |
| `/pricing` | same | Pro | Business Calls & Texting | Comms | Pro+ | — | Included | Comms | `tel:` + SMS activity; not hosted PBX | Logs | Soft | — | — | Partial | Scope | High | Clarify (PO) | 7,13 | Open | AMBIGUOUS MARKETING CLAIM |
| `/pricing` | same | Pro | Gift Cards | Commerce | Pro+ | — | Included | Business hub | Operator CRUD | Yes | **None** plan | Partial | Partial | Partial | Free can open | Med | Gate | 6,11,13 | Open | AVAILABLE BUT UNVERIFIED |
| `/pricing` | same | Pro | Invoicing | Commerce | Pro+ | — | Included | Commerce | Early Access | Evolving | **None** | Partial | Partial | Partial | Depth + Free access | Med | Gate + depth | 6,13 | Open | PARTIALLY IMPLEMENTED |
| `/pricing` | same | Pro | Basic Reporting | BI | Pro+ | — | Included | Reports | Revenue reports AT | Yes | **None** | Partial | Partial | Partial | Free access | Med | Gate | 10,13 | Open | AVAILABLE BUT UNVERIFIED |
| `/pricing` | same | Pro | Remove Chasum Branding | Brand | Pro+ | — | Included | Email | Email branding | Yes | **Yes** | Partial | — | — | Public book brand depth | Low | Keep email gate | 9 | Open | AVAILABLE BUT UNVERIFIED |
| `/pricing` | same | Pro staff/loc | Up to 3 staff / 3 locations | Limits | Pro | — | Now | Emp / Loc | Loc enforced; staff **not** | Mixed | Loc yes | — | — | — | Staff | High | Enforce staff | 8,13 | Open | PARTIALLY IMPLEMENTED |
| `/pricing` | same | Business | Inventory Management | Inventory | Biz+ | — | Included | Reports placeholder | **Not real** | No | None | — | — | — | Sold but missing | Crit | PO | 10,13 | Open | NOT IMPLEMENTED |
| `/pricing` | same | Business | Advanced Analytics | BI | Biz+ | — | Included | Reports | Same reports; “advanced” undefined | Partial | None | — | — | Partial | Naming | Med | Define or rename | 10,13 | Open | AMBIGUOUS MARKETING CLAIM |
| `/pricing` | same | Business | API & Integrations | API | Biz+ | — | Included | Developer | API keys exist | Keys | **Not** plan-gated | Partial | — | — | Free/Pro can open | Med | Gate | 9,13 | Open | PARTIALLY IMPLEMENTED |
| `/pricing` | same | Business | Priority Support | Support | Biz+ | — | Included | — | Process | — | — | — | — | — | Ops | Med | Ops definition | 13 | Open | PRIVATE ALPHA |
| `/pricing` | same | Business loc | Up to 6 locations | Limits | Biz | — | Now | Locations | DB/catalog **10** | Yes | Quota uses DB | — | — | — | 6 vs 10 | High | **OWNER DECISION** | 9,13 | Open | MARKETING-PRODUCT CONFLICT |
| `/pricing` | same | Business staff | Unlimited staff | Limits | Biz | — | Now | Employees | Directory uncapped; login Coming Next | Dir | None | — | — | — | Login gap | High | Honesty | 8,13 | Open | PARTIALLY IMPLEMENTED |
| `/pricing` | same | Enterprise | White-glove, success mgr, custom integrations, enterprise security, custom permissions, volume pricing | Ent | Ent | — | Partnership | Mixed | Process / partial roles | Mixed | Soft | — | — | — | Overclaim risk | High | Partnership framing | 13 | Open | PRIVATE ALPHA |
| `/pricing` | same | FAQ | Staff/location upgrade prompt; Biz 6 locs | Limits | — | — | Now | — | Loc prompt exists; staff prompt **missing**; 6 vs 10 | — | Loc | — | — | — | Staff FAQ false; 6 | High | Fix after PO | 8,9,13 | Open | MARKETING-PRODUCT CONFLICT |

### Roadmap `/roadmap`

| Route | Source | Section | Claim | Class | Sev | Resolution | Ch | Verify |
|-------|--------|---------|-------|-------|-----|------------|----|--------|
| `/roadmap` | `roadmap.ts` | Available Today | Online Booking | AVAILABLE BUT UNVERIFIED | Low | Keep | — | Open |
| `/roadmap` | same | Available Today | Calendar & Scheduling | AVAILABLE BUT UNVERIFIED → **Chapter 3 deepened** Reception/Calendar ops (Preview) | Low | Keep + portal note | 3 | Preview |
| `/roadmap` | same | Available Today | Customer Management | AVAILABLE BUT UNVERIFIED | Low | Keep | 4 | Open |
| `/roadmap` | same | Available Today | **Summer AI Business Manager** (no EA) | MARKETING-PRODUCT CONFLICT | Crit | Align EA | 12,13 | Open |
| `/roadmap` | same | Available Today | **Payments** collect payments/deposits | MARKETING-PRODUCT CONFLICT | Crit | Narrow or complete card | 6,13 | Open |
| `/roadmap` | same | Available Today | Gift Cards | AVAILABLE BUT UNVERIFIED | Med | Keep + portal depth note | 11 | Open |
| `/roadmap` | same | Available Today | Email Notifications | AVAILABLE BUT UNVERIFIED | Low | Config dep. | 7 | Open |
| `/roadmap` | same | Available Today | Business Calls & Texting | AMBIGUOUS MARKETING CLAIM | High | Scope honesty | 7,13 | Open |
| `/roadmap` | same | Available Today | SMS Reminders | PARTIALLY IMPLEMENTED | Med | Plan+Twilio | 7 | Open |
| `/roadmap` | same | Coming Soon | AI Phone Calls | ROADMAP | Low | Keep | 12 | OK |
| `/roadmap` | same | Coming Soon | AI Workflow Automation | ROADMAP | Low | Keep | 12 | OK |
| `/roadmap` | same | Coming Soon | **Inventory** | MARKETING-PRODUCT CONFLICT vs Pricing | Crit | PO | 10,13 | Open |
| `/roadmap` | same | Coming Soon | Payroll | ROADMAP / UI placeholder | Med | Keep Coming Soon | 8 | Open |
| `/roadmap` | same | Coming Soon | Marketing Campaigns | ROADMAP | Low | Keep | 11 | OK |
| `/roadmap` | same | Coming Soon | **Memberships & Service Packages** | MARKETING-PRODUCT CONFLICT (hub live) | Crit | PO | 9,11,13 | Open |
| `/roadmap` | same | Coming Soon | Native Mobile Apps | ROADMAP | Low | Keep | — | OK |
| `/roadmap` | same | Future Vision | AI Business Insights | ROADMAP | Low | Keep | 10 | OK |
| `/roadmap` | same | Future Vision | **Multi-location Management** | MARKETING-PRODUCT CONFLICT | Crit | Move to Available / rename | 9,13 | Open |
| `/roadmap` | same | Future Vision | Franchise / Workflow Automation / Loyalty / Marketplace | ROADMAP | Low | Keep | — | OK |

### Platform & Product Tour

| Route | Source | Claim | Class | Sev | Ch | Verify |
|-------|--------|-------|-------|-----|----|--------|
| `/platform` | `PLATFORM_MODULES` business | Memberships, packages, gift cards in Business Management | MARKETING-PRODUCT CONFLICT vs Roadmap memberships | High | 9,13 | Open |
| `/platform` | billing module | Manual commerce today; self-serve Coming Next | AVAILABLE AND VERIFIED (honest) | Low | — | OK |
| `/platform` | employees | Staff login Coming Next | AVAILABLE AND VERIFIED (honest) | Low | 8 | OK |
| `/platform` | summer | Early Access AI BM | PARTIALLY IMPLEMENTED | Med | 12 | Open |
| `/product-tour` | journey step | Payment recorded / ledger | PARTIALLY IMPLEMENTED | Med | 6 | Open |
| `/product-tour` | modules | Same PLATFORM_MODULES memberships | MARKETING-PRODUCT CONFLICT | High | 13 | Open |

### Meet Summer `/meet-summer`

| Route | Source | Claim | Class | Sev | Ch | Verify |
|-------|--------|-------|-------|-----|----|--------|
| `/meet-summer` | `FS_ROADMAP` | Today: Website Concierge; Next: AI Reception… | PARTIALLY IMPLEMENTED (honest-ish) | Med | 12 | Open |
| `/meet-summer` | hero / awaken | AI Business Manager helps set up / recommend / guide | PARTIALLY IMPLEMENTED | Med | 12 | Open |
| `/meet-summer` | dormant CH7 | AI Receptionist Today | MARKETING-PRODUCT CONFLICT (latent) | High if remounted | 12,13 | Open |
| `/meet-summer` | FAQ path | Voice not available | AVAILABLE AND VERIFIED | Low | — | OK |

### Industries `/industries` (grouped chips)

**Grouped row (identical wording × 11 industries):** capability chips `CORE_CHASUM_CAPABILITIES` — AI Business Manager · Appointment Scheduling · CRM · Customer Communication · Team Coordination · **Payments** · Reporting · Business Memory · **Multi-location** — framed as Available Today / Early Access foundations with status “Private Alpha · Available Today foundations”.

| Chip | Class | Sev | Notes |
|------|-------|-----|-------|
| Appointment Scheduling / CRM / Communication / Team | AVAILABLE BUT UNVERIFIED | Low–Med | Generic OS — not industry-complete |
| Payments | MARKETING-PRODUCT CONFLICT | High | Same as Online Payments dossier |
| Multi-location | AVAILABLE BUT UNVERIFIED vs Roadmap FV conflict | Crit (status conflict elsewhere) | Product live; Roadmap wrong |
| AI Business Manager | PARTIALLY IMPLEMENTED | High | Early Access |
| Business Memory | AMBIGUOUS MARKETING CLAIM | Med | Session/business memory limited |
| Reporting | AVAILABLE BUT UNVERIFIED | Med | Foundations |

**Per-industry solution claims (individual rows condensed):**

| Industry | Extra claim in solution | Class | Readiness pointer | Ch |
|----------|-------------------------|-------|-------------------|-----|
| Medical Clinics | Patient communication; **not EMR** | PARTIALLY IMPLEMENTED | Non-clinical foundations only | 14 |
| Legal Services | Consultations, billing | AVAILABLE BUT UNVERIFIED | Config | 14 |
| Salons | Payments + daily ops | AVAILABLE BUT UNVERIFIED | Config | 14 |
| Spas | Rooms coordination | PARTIALLY IMPLEMENTED | Resources mig blocked | 14 |
| Gyms | **Memberships** in solution | MARKETING-PRODUCT CONFLICT / PARTIAL | Memberships hub vs class capacity | 14 |
| Home & Field | Estimate visits, crew, jobs | PARTIALLY IMPLEMENTED | Needs job/field OS | 14 |
| Automotive | Shop appointments across shop | PARTIALLY IMPLEMENTED | Not RO/parts system | 14 |
| Professional Services | Polished booking + CRM | AVAILABLE BUT UNVERIFIED | Config | 14 |
| Photography | Deposits + sessions | AVAILABLE BUT UNVERIFIED | Config | 14 |
| Pet Services | Recurring visits | PARTIALLY IMPLEMENTED | Config | 14 |
| Cleaning | Recurring routes, crews | PARTIALLY IMPLEMENTED | Field ops gap | 14 |

### Resources / legal / nav

| Route | Claim | Class | Sev | Ch |
|-------|-------|-------|-----|----|
| `/private-alpha` | Early Access / Design Partner benefits | PRIVATE ALPHA | Low | — |
| `/security` | Stripe among trusted providers | PARTIALLY IMPLEMENTED | Med | 13 |
| `/status` | Payment integrations Configuration Required | AVAILABLE AND VERIFIED | Low | — |
| `/privacy` | Stripe when enabled | AVAILABLE AND VERIFIED | Low | — |
| `/terms` | Early Access may change; no public self-serve billing | AVAILABLE AND VERIFIED | Low | — |
| Nav/Footer | Links only + Private Alpha framing | AVAILABLE AND VERIFIED | Low | — |
| Dormant IMPACT/TESTIMONIALS | Invented proof | NOT IMPLEMENTED / conflict if remounted | Crit if remounted | 13 |

---

## Chapter 2 note — Command Centre (product, not marketing)

In-app `/dashboard` Command Centre (plus correction pass):

- Labels money as **Gross payments collected** (commerce succeeded deposits/payments; refunds not subtracted)
- Appointments today shared definition excludes cancelled / no-show (business TZ)
- Summer block / workspace = **AI Business Manager · Early Access** (no “AI receptionist” in portal Summer surfaces)
- AI Workforce page = Future Vision / Preview — Summer Early Access only; no fake online/task/activity KPIs
- Reports: Inventory tab hidden; Membership revenue hidden; executive payments align with commerce
- Does not remount IMPACT_STATS / testimonials

Marketing locks unchanged. Remaining Online Payments / Inventory / Summer Available Today conflicts stay open for Chapters 6/12/13.

---

## Resolution rules (Chapter 13 — after PO)

1. Do **not** silently delete marketing claims without PO (locks).  
2. Do **not** fake portal features.  
3. Prefer product completion **or** clear status disclosure.  
4. Quarantine dormant invented social proof before any remount.  
5. Mark **OWNER DECISION REQUIRED** items — do not guess limits or status vocabulary.

---

## Counts (Addendum)

| Metric | Count |
|--------|------:|
| Marketing routes audited | 14 (+ layout) |
| Roadmap cards inventoried | 22 |
| Pricing feature IDs | 24 catalog features × 4 plans (comparison) |
| Industries on `/industries` | 11 |
| Homepage industry tiles | 10 (incl. Education) |
| Critical mismatches (A–H core) | 8 dossiers · 5 critical status conflicts |
| High mismatches (non-critical but material) | ≥10 (staff ungated, Calls scope, Start Free, Free feature exposure, API ungated, etc.) |
