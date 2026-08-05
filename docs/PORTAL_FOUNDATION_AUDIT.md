# Portal Foundation Audit

**Program:** Chasum World Class Program — Chapter 1  
**Branch:** `cursor/world-class-portal-foundation` @ `4eecbec`  
**Production baseline (protected):** https://chasum.vercel.app · tag `phase-0-gvm-production-2026-08-04`  
**Mode:** Audit and planning only — no code, deploy, migration, or data changes.

---

## 1. Executive summary

Chasum’s authenticated portal already runs a **credible service-business OS**: Reception, CRM, Services, Employees, Payments, communications, and tax-aware commerce are real enough that GVM can book assigned-employee appointments and record deposits on Production.

It does **not** yet feel like one World Class operating system. The shell is feature-dense; Business Settings is a mega-hub; booking and payment UIs are duplicated; Overview is a dashboard rather than a command centre; AI surfaces mix placeholders with live Early Access; and documentation has drifted behind Phase 0 Production.

**World Class Program posture:** extend Design System v1 and Phase 0 commerce/comms — do not rewrite the GVM booking/payment path.

---

## 2. Foundation audit (30 areas)

| # | Area | Finding | Severity |
|---|------|---------|----------|
| 1 | Navigation / IA | Flat 14-item sidebar; Business mega-tabs; Developer always visible; Reception label vs calendar URL | High |
| 2 | Portal shell | Solid dark sidebar + sticky header; inconsistent page headers | Medium |
| 3 | Visual hierarchy | Strong on Reception day view; weaker on Reports / AI roster | Medium |
| 4 | Typography | Geist + DS v1 roles exist; not uniformly applied | Medium |
| 5 | Spacing | `--space-*` tokens exist; page-level inconsistency | Medium |
| 6 | Colour | Bright primary blue; dark nav chrome; spark reserved for AI — generally aligned | Low |
| 7 | Icons | Lucide; mostly consistent | Low |
| 8 | Buttons | Shared `Button` variants; some one-off action clusters | Medium |
| 9 | Cards | `Card` / `StatCard` + ad-hoc panels | Medium |
| 10 | Tables / lists | Shared `Table`; CRM/Payments/Reports patterns diverge | Medium |
| 11 | Drawers / sheets | BookingSheet + AppointmentDrawer + reception panel | High |
| 12 | Modals | Dialog primitives good; risk of modal overload in Reception | Medium |
| 13 | Forms | `Field` / form-feedback exist; not universal | Medium |
| 14 | Filters | Ad-hoc per page | Medium |
| 15 | Search | Header “Search clients…” is a link, not global search | High |
| 16 | Command | ⌘K registry exists; underused as OS spine | Medium |
| 17 | Loading | Skeletons present; uneven coverage | Medium |
| 18 | Empty | `EmptyState` primitive; some soft-empty Reports | Medium |
| 19 | Error | Route `error.tsx` on dashboard/calendar; toast-heavy elsewhere | Medium |
| 20 | Success | Toasts + FormFooter; confirmation patterns vary | Medium |
| 21 | Toasts | Global ToastProvider | Low |
| 22 | Mobile | Sidebar drawer works; Reception dense on phone | High |
| 23 | Tablet | Split reception panel needs explicit tablet rules | Medium |
| 24 | Accessibility | Focus rings in DS; deep sheets need audit pass | Medium |
| 25 | Keyboard | Command palette + sheet traps; calendar keyboard incomplete | Medium |
| 26 | Perceived performance | Reception is heavy client surface | Medium |
| 27 | Terminology | Reception vs Calendar; CRM vs Customers; Staff vs Employees | High |
| 28 | Status labels | Appointment/payment labels improved in Phase 0; still multi-source | Medium |
| 29 | Plan gates | Locations/SMS/branding gated; Developer/Automation not | Medium |
| 30 | Cross-feature continuity | Customer→Booking→Payment→Receipt→Comms not one guided spine | High |

---

## 3. Major strengths

1. **Phase 0 GVM workflow integrity** — assigned-employee booking, exclusive HST, deposits, receipts, branding, timezone, resend controls.
2. **Shared financial resolver** — `booking-financials` / deposit due-now as single math authority.
3. **Design System v1 foundation** — tokens and primitives in `globals.css` + `components/ui/*`.
4. **Reception as operational heart** — day view + sheet + communications are close to “run the business today.”
5. **CRM depth** — profiles with commerce and booking entry points.
6. **Command palette scaffold** — right abstraction for Linear-like speed later.
7. **Brand V2 + marketing locks** — clear “do not redesign marketing” boundary while portal work proceeds.

---

## 4. Major weaknesses

1. **Fragmented operating spine** — customer, appointment, payment, receipt, and communication live on different islands.
2. **Duplicated booking editors** — BookingSheet, AppointmentDrawer, QuickAppointment.
3. **Business hub overload** — settings, catalog, commerce products, and automation in one place.
4. **Overview is not a command centre** — stats ≠ “what needs attention now.”
5. **Search is not search** — clients link masquerades as search.
6. **AI theater risk** — placeholders / “coming soon” save actions next to live Summer/Chase.
7. **Tenant IA pollution** — Developer and HQ-adjacent concepts in or near primary nav.
8. **Doc drift** — `CURRENT_PROJECT_STATE` last updated 2026-07-30; Phase 0 Production not reflected; MASTER_TASKS migration floors stale.

---

## 5. Inconsistencies and duplication

| Issue | Evidence | Recommendation |
|-------|----------|----------------|
| Three booking UIs | BookingSheet, drawer, QuickAppointment | Consolidate around BookingSheet + thin inspect drawer |
| Services twice | `/services` + Business tabs | One catalog authority |
| Settings vs Business | TD-M1 | Consolidate settings IA |
| Automation twice | `/automation` + Business tab | Single Automation home |
| Staff vs Employees | Redirects remain | Terminology: Employees only |
| CRM vs Customers | Nav says CRM | Pick one customer-facing term |
| WaitlistPlaceholder orphan | Unused component | Remove |
| Legacy customers-manager | Unused | Remove |
| Payments vs CRM commerce | Two hubs | Shared financial activity component |
| Dual Summer/Emma paths | TD-M9 / debt register | Clarify AI reception product story |

---

## 6. Preserve / Improve / Consolidate / Replace / Remove

| Area | Class | Issue | Priority | Prod impact | DB impact | Preview-safe? |
|------|-------|-------|----------|-------------|-----------|---------------|
| Phase 0 booking/tax/deposit/receipt/email | **PRESERVE** | Must not regress | P0 | High if touched | None if preserved | Yes (regression tests) |
| Design System v1 tokens/primitives | **PRESERVE** / extend | Parallel styles still appear | P0 | Low | None | Yes |
| Reception day operations | **IMPROVE** | Density, mobile, continuity | P1 | Medium | None | Yes |
| Overview | **IMPROVE** | Not a command centre | P1 | Low | Read-only aggregates | Yes |
| Nav / shell IA | **IMPROVE** | Flat, overloaded | P1 | Medium (findability) | None | Yes |
| Booking editors | **CONSOLIDATE** | Triple UI | P1 | High if rushed | None | Yes |
| Business + Settings | **CONSOLIDATE** | Mega-hub | P2 | Medium | None | Yes |
| Payments + CRM commerce panels | **CONSOLIDATE** | Split financial truth UI | P1 | Medium | None | Yes |
| Notifications vs booking Communications | **CONSOLIDATE** | Dual mental models | P2 | Low | None | Yes |
| AI Workforce placeholders | **REPLACE** (later) | Theater risk | P3 | Low if gated | Possible later | Yes |
| Unused WaitlistPlaceholder / customers-manager | **REMOVE** | Dead code | P3 | None | None | Yes |
| Unassigned employee booking | **REPLACE** (future) | Not prod-ready | — | Do not enable | Migrations 034+ | Preview only |
| Healthcare/EMR | **N/A → future REPLACE/add** | Absent by design for v1 | Later | High compliance | High | Isolated workspace |

---

## 7. Benchmark findings (principles only)

| Benchmark | Take | Chasum application | Scope | Risk | DB? |
|-----------|------|--------------------|-------|------|-----|
| **Apple** | Restraint, hierarchy, craft | Fewer primary nav items; calm Overview | All | Low | No |
| **Stripe** | Financial trust, status clarity | Unified payment/receipt/invoice status language | All | Medium | No (UI first) |
| **Linear** | Speed, ⌘K, focused surfaces | Command centre + keyboard booking actions | All | Medium | No |
| **Notion** | Progressive disclosure | Collapse Business mega-tabs into nested settings | All | Medium | No |
| **OpenAI** | Contextual intelligence | Summer as side guidance, not a parallel OS | All | Medium | Later memory |
| **Framer** | Motion polish | DS motion tokens on shell transitions | All | Low | No |
| **Calendly** | Availability clarity | Public book already; Reception availability chrome | All | Low | No |
| **Jane** | Clinic practitioner workflows | Healthcare workspace (not universal) | Healthcare | High | Yes |
| **Vagaro / Fresha / Studio Pro** | Packages, memberships, staff | Elevate packages/memberships out of burial | Service businesses | Medium | Existing tables |
| **EMR/EHR** | Audit, consent, privacy | Healthcare workspace only; legal review required | Healthcare | Very high | Yes |

---

## 8. Risks and dependencies

- **Production regression** on GVM booking/payment/email if Reception/commerce touched carelessly.
- **Shared Supabase** — Preview and Production share data; no schema experiments without isolation plan.
- **Migrations 034–036** remain unapplied by policy — resources/optional staff stay Preview-only experiments.
- **Doc authority conflicts** — refresh CPS before large implementation chapters.
- **Compliance** — healthcare features require legal/privacy review before any PHI storage.
- **World Class vs marketing locks** — do not reopen Pricing / Meet Summer / Roadmap / Resources locks.

---

## 9. Recommended first implementation chapter

**Portal shell + navigation + design-system adoption pass (Phase 1 Foundation).**

**Why first (evidence-based):**
1. Every later chapter inherits IA and primitives.
2. Lowest database risk (mostly presentation / routing).
3. Directly addresses High findings: flat nav, fake search, terminology, shell consistency.
4. Does not require changing Phase 0 booking math or email delivery.

**Remain untouched in Chapter 1 implementation:**
- GVM Production workflows and shared financial resolver behaviour
- Customer confirmation / receipt / business notification templates (unless pure shell chrome)
- Migrations 034–036
- Healthcare/EMR
- Marketing locked pages
- Unrelated brand PDF/scripts/`tmp`

---

## Related deliverables

- [`PORTAL_ROUTE_INVENTORY.md`](./PORTAL_ROUTE_INVENTORY.md)
- [`WORLD_CLASS_PROGRAM_MASTER_PLAN.md`](./WORLD_CLASS_PROGRAM_MASTER_PLAN.md)
- [`WORLD_CLASS_DESIGN_PRINCIPLES.md`](./WORLD_CLASS_DESIGN_PRINCIPLES.md)
- [`WORLD_CLASS_IMPLEMENTATION_SEQUENCE.md`](./WORLD_CLASS_IMPLEMENTATION_SEQUENCE.md)
- [`HEALTHCARE_WORKSPACE_DIRECTION.md`](./HEALTHCARE_WORKSPACE_DIRECTION.md)
