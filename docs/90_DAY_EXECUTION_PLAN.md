# Chasum 90-Day Execution Plan

**Version:** 1.0 · 2026-07-18  
**Intent:** Path from private alpha → credible closed beta → *option* to charge  
**Lens:** Founder / venture SaaS sequencing — product honesty before growth spend  

Companions: [FOUNDER_AUDIT.md](./FOUNDER_AUDIT.md) · [30_DAY_PRIVATE_ALPHA_PLAN.md](./30_DAY_PRIVATE_ALPHA_PLAN.md) · [LAUNCH_RISK_REGISTER.md](./LAUNCH_RISK_REGISTER.md)

---

## Outcome by Day 90

You can look an operator in the eye and say:

1. What Chasum does today (precisely)  
2. What it costs (and collect that money for real)  
3. How they get help  
4. How their data is handled  

…without flinching.

**Stretch:** 5–15 closed-beta businesses, first **real** MRR (even if small).  
**Floor:** 1–3 design partners retained + Stripe Billing in staging/prod + legal live.

---

## Phases

```mermaid
flowchart LR
  A[Days 1–30 Private Alpha] --> B[Days 31–60 Closed Beta Ready]
  B --> C[Days 61–90 Charge with Integrity]
```

---

## Phase A — Days 1–30: Private Alpha

**Execute:** [30_DAY_PRIVATE_ALPHA_PLAN.md](./30_DAY_PRIVATE_ALPHA_PLAN.md)

| Theme | Deliverable |
|-------|-------------|
| Truth | Marketing claim hygiene |
| Legal | Privacy + Terms v0.1 |
| Partners | 1–3 live design partners |
| Learning | Friction log + WTP interview |
| Money | Still manual / complimentary |

**Gate to Phase B:** Alpha exit criteria met (see 30-day plan).

---

## Phase B — Days 31–60: Closed Beta Ready

### B1. Monetization honesty (Critical path)

- [ ] Replace MockBillingProvider with **Stripe Billing** (Checkout or Customer Portal)  
- [ ] Pricing CTAs only enabled when checkout works in production  
- [ ] No mock “paid” invoices in production  
- [ ] Free plan remains; paid plan entitlements documented and at least partially enforced  

**Founder check:** Upgrade yourself with a real card; refund yourself; screenshot the Stripe dashboard.

### B2. Payments for operators (High)

- [ ] Booking Sheet “Collect” → Commerce path (no toast limbo)  
- [ ] Decide: card deposits in beta or cash/e-transfer only — **market accordingly**  
- [ ] If cards: Stripe Elements or Checkout Session + webhook reconciliation  

### B3. Support & docs (High)

- [ ] Help center lite (Notion or `/help`): setup, booking, calendar, CRM, billing FAQ  
- [ ] Status page lite (Even manual “All systems normal” with update timestamp)  
- [ ] Support inbox + triage (email or Intercom-lite)  
- [ ] Remove “dedicated support” from Pricing unless staffed  

### B4. Onboarding (High)

- [ ] Day-1 checklist in-app (services, hours, staff, publish booking link)  
- [ ] Optional setup wizard for cold signups  
- [ ] Invite-only mode for closed beta (disable open spam signups if needed)  

### B5. Analytics (Medium)

- [ ] Instrument: signup, business created, first service, first booking, upgrade click  
- [ ] Weekly funnel review becomes a habit  

### B6. Positioning lock

- [ ] Final public narrative: Summer + Chase + ops OS  
- [ ] AI Workforce roster page labeled roadmap unless roles are real  
- [ ] One authentic case study (design partner)  

**Gate to Phase C:**

| Gate | Pass condition |
|------|----------------|
| Billing | Live Stripe path for subscription |
| Legal | Privacy + Terms linked in footer |
| Claims | Zero fictional social proof |
| Support | Documented channel + <24h first response target |
| Partners | ≥2 active or 1 very deep + waitlist of invites |

---

## Phase C — Days 61–90: Charge with Integrity

### C1. First real revenue

- [ ] Convert design partners to paid **or** close 3–10 closed-beta paid seats  
- [ ] Prefer annual or monthly Stripe; avoid custom PDF chaos unless Enterprise  
- [ ] Track cash MRR separately from “estimated” owner metrics  

### C2. Closed beta expansion

- [ ] Invite list (warm intros only) — no paid acquisition yet  
- [ ] Cap concurrent customers to what founder CS can hold (rule of thumb: ≤15 until hire)  
- [ ] Written acceptance criteria per invite (industry, size, single-owner)  

### C3. Product depth (only if revenue path is honest)

Priority order (founder):

1. Reliability of booking + email  
2. Staff invite / basic RBAC (unlocks Business plan truth)  
3. Card deposits if partners demand them  
4. Deeper AI only after ops trust  

### C4. Venture hygiene

- [ ] Update pitch: traction = real operators + real $ (even tiny)  
- [ ] Kill vanity metrics permanently  
- [ ] Decide Series narrative: vertical wedge vs horizontal OS — pick one for 6 months  

### C5. Open beta decision (end of Day 90)

| If… | Then… |
|-----|-------|
| Billing works, ≥5 paying or strongly committed, support load manageable | Plan open beta (+ light content/SEO, still careful ads) |
| Billing works but activation weak | Stay closed; fix onboarding |
| Billing still mock / claims drift back | **Do not open** — repeat Phase B |

---

## Resourcing (lean)

| Role | Days 1–30 | Days 31–90 |
|------|-----------|------------|
| Founder | 70% CS + sales, 30% product triage | 40% CS, 30% sales, 30% strategy |
| Engineering | Stabilization only | Billing + payments + onboarding |
| Design | Claim hygiene | Onboarding / help |
| Counsel | Privacy/Terms | DPA lite if needed |
| Marketing hire | **No** | Maybe contractor for case study |

---

## Budget priorities (90 days)

1. Legal basics  
2. Stripe go-live  
3. Founder time (opportunity cost)  
4. Help center  
5. Analytics  
6. **Not:** brand films, conference booths, AI hype campaigns  

---

## OKRs (suggested)

### Objective 1 — Earn the right to charge  
- KR: 0 fictional social proof on marketing site  
- KR: Stripe subscription path live  
- KR: Privacy + Terms published  

### Objective 2 — Prove operators stay  
- KR: ≥1 partner primary-calendar for 30+ days  
- KR: Week-4 retention interview score ≥7/10 “would be upset if Chasum disappeared”  

### Objective 3 — First honest revenue  
- KR: ≥$1 of real Stripe-cleared subscription revenue **or** signed paid pilot LOI  
- KR: Support CSAT informal ≥ positive from all alpha partners  

---

## Anti-OKRs (do not optimize)

- Homepage traffic  
- Waitlist vanity size  
- Number of AI employee names on a slide  
- Feature count vs Fresha  

---

## Calendar snapshot

| Window | Focus |
|--------|--------|
| Days 1–7 | Truth + legal draft + partner zero setup |
| Days 8–30 | Stabilize + learn |
| Days 31–45 | Stripe Billing + help lite |
| Days 46–60 | Onboarding + Elements decision + case study |
| Days 61–75 | First paid conversions (closed) |
| Days 76–90 | Expand carefully + open-beta go/no-go |

---

## Decision log (keep this updated)

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-18 | No open paid self-serve next month | Mock billing + claim/legal gaps |
| 2026-07-18 | Private alpha first | Ops core strong enough for design partners |

---

## One-line strategy

**Tell the truth, serve a few operators obsessively, collect real money only when Stripe and legal are real — then grow.**
