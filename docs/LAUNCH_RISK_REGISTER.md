# Chasum Launch Risk Register

**Version:** 1.0 · 2026-07-18  
**Owner:** Founder / CEO  
**Companion:** [FOUNDER_AUDIT.md](./FOUNDER_AUDIT.md)

Risks that would stop — or shame — charging customers.  
Not an engineering bug list; a **commercial integrity** register.

---

## Scoring

| Severity | Meaning |
|----------|---------|
| **Critical** | Do not take money / do not open paid self-serve until mitigated |
| **High** | Blocks credible closed beta expansion; fix before scaling invites |
| **Medium** | Hurts conversion, retention, or ops load; schedule in 90 days |
| **Low** | Polish / debt; watch but don’t stall alpha |

| Likelihood | Meaning |
|------------|---------|
| L | Likely within 30 days of paid exposure |
| M | Plausible under growth |
| S | Edge / later |

---

## Critical

| ID | Risk | Why it stops charging | Likelihood | Mitigation | Owner | Target |
|----|------|----------------------|------------|------------|-------|--------|
| R-C1 | **Mock SaaS billing** while Pricing sells $79/$149 | Customers “upgrade,” get fake invoices, discover no Stripe | L | Hide paid CTAs **or** ship Stripe Billing; never mint paid invoices in mock mode in prod | Founder + Eng | Before any paid self-serve |
| R-C2 | **Marketing overclaims** (AI Workforce, Emma-live, illustrative social proof) | Chargeback / refund / public callout; destroys trust | L | Remove placeholders; market Summer + Chase only; kill fake logos/stats | Founder + Marketing | Week 1 of alpha |
| R-C3 | **No Privacy Policy / Terms / DPA** | Legal exposure; payment processors / app stores / enterprise refuse | L | Draft + publish `/privacy` + `/terms`; short design-partner agreement | Founder + Counsel | Before first paid invoice |
| R-C4 | **Homepage “Enterprise security” + paid plans without security/support reality** | Misrepresentation | M | Soften claims; link real security practices when ready | Founder | Week 1 |

---

## High

| ID | Risk | Why it matters | Likelihood | Mitigation | Owner | Target |
|----|------|----------------|------------|------------|-------|--------|
| R-H1 | **Card payments incomplete** (Elements / Booking Sheet stub) | Operators expect deposits; journey dead-ends | L | Wire Collect → Commerce; or remove card language until Elements | Product | Days 30–60 |
| R-H2 | **Support promised on paid tiers; only mailto exists** | SLA breach on day one | L | Design-partner Slack + written SLA; strip “dedicated support” from public Pricing | Founder | Week 1 |
| R-H3 | **No help center / status page** | Every question hits founder; outages look like abandonment | M | Notion help (10 articles) + status lite (even manual) | Founder | Days 15–45 |
| R-H4 | **Cold onboarding without wizard** | Activation failure → “product doesn’t work” reviews | L | White-glove alpha; then Day-1 checklist in-app | CS / Product | Alpha ongoing |
| R-H5 | **Plan entitlements not enforced** | Can’t defend price fences; freeloading / confusion | M | Define Free vs Paid honestly; enforce 1–2 hard gates (locations / SMS) | Product | Days 45–90 |
| R-H6 | **Email deliverability / Resend misconfig** | Bookings confirm in app but customers never get email | M | Go-live checklist green; seed test to partner domain | Ops | Before partner cutover |
| R-H7 | **Single-owner vs “team” marketing** | Business plan buyers expect staff logins | M | Sell single-owner alpha; roadmap staff invites explicitly | Marketing | Week 1 |

---

## Medium

| ID | Risk | Why it matters | Likelihood | Mitigation | Owner | Target |
|----|------|----------------|------------|------------|-------|--------|
| R-M1 | **No funnel analytics** | Can’t learn; burn cash later | M | PostHog or equivalent on signup → first booking | Eng | Days 30–60 |
| R-M2 | **Dual AI branding (Emma vs Summer)** | Confused demos and docs | L | One name everywhere | Marketing | Week 2 |
| R-M3 | **Owner MRR estimated / mock** | Bad internal decisions | M | Separate “estimated” vs “Stripe cash” dashboards | Founder | Days 60–90 |
| R-M4 | **Multi-location / RBAC oversell** | Implementation regret | M | Scope contracts to locations/staff that work | Sales | Per deal |
| R-M5 | **SMS optional / easy to assume included** | Expectation gap | M | Explicit “email-first; SMS add-on” in partner packet | Sales | Week 1 |
| R-M6 | **Comparison page vs Fresha/Vagaro** | Credibility if cells drift | S | Quarterly honesty pass | Marketing | Ongoing |
| R-M7 | **No formal incident / backup runbook for customers** | Panic during outage | M | One-page IR + Supabase RPO note in partner packet | Ops | Day 30 |

---

## Low

| ID | Risk | Why it matters | Likelihood | Mitigation | Owner | Target |
|----|------|----------------|------------|------------|-------|--------|
| R-L1 | Placeholder waitlist UX in reception | Looks unfinished | S | Label roadmap | Product | Backlog |
| R-L2 | Dense mobile dashboards | Power-user friction | M | Alpha feedback → polish | Design | 90-day |
| R-L3 | Forecast stubs in Chase | Fine if labeled | S | Keep “extension only” labeling | Product | Ongoing |
| R-L4 | Brand asset churn in working tree | Noise | S | Ignore for launch | — | — |

---

## Risk heat (founder view)

```
CRITICAL ████████████  Mock billing · Overclaims · No legal · Softened security claims
HIGH     ████████░░    Payments UX · Support · Docs/status · Onboarding · Entitlements
MEDIUM   ████░░░░░░    Analytics · Naming · Scope control
LOW      ██░░░░░░░░    Polish
```

---

## Kill switches (pre-agreed)

If any of these are true in production, **stop paid acquisition** immediately:

1. Mock provider still writing “paid” subscription invoices for real customers  
2. A published testimonial/logo is challenged as fabricated  
3. A booking outage > 2 hours with no customer communication  
4. Card data ever logged or stored outside Stripe  

---

## Residual risk after private alpha (honest)

Even with mitigations, residual risk remains:

- Small-n bias (1–3 partners ≠ market)  
- Founder-bottleneck support  
- Vertical depth (one industry) may not transfer  

That is acceptable for venture learning. It is **not** acceptable to paper over with fake social proof.

---

## Review cadence

- **Weekly** during private alpha — founder reviews Critical/High  
- **Biweekly** in days 30–90 — full register  
- Update IDs when closed; never delete history (mark `Closed · date · note`)
