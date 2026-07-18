# Chasum Founder Audit

**Version:** 1.0 · 2026-07-18  
**Lens:** CEO / founder inheriting the company — not engineering  
**Question:** Would I confidently launch to paying customers next month?

---

## Executive answer

**No — not as open, self-serve, paid SaaS.**

**Yes — as a private alpha with 1–3 design partners**, on free or manually invoiced terms, *if* marketing stops selling a product we cannot yet collect money for honestly.

| Mode | Launch next month? |
|------|--------------------|
| Open self-serve ($79 / $149 checkout) | **No** |
| Closed paid beta with live Stripe + legal + honest copy | **Not next month** (needs ~60–90 days) |
| Private alpha / GVM-style dogfood (free or invoice outside app) | **Yes**, with claim discipline |

The ops product (book → calendar → CRM → public book) is strong enough to help a real business.  
The **website currently sells a venture SaaS** (AI Workforce, paid plans, enterprise security, social proof) that the company cannot yet fulfill commercially.

---

## Would I charge customers?

### What I would charge for
- Scheduling that does not double-book
- Public online booking
- CRM + front-desk booking sheet
- Email confirmations (when Resend is configured)
- Summer + Chase as **grounded assistants**, honestly scoped

### What I would not take money for yet
- “AI Business Operating System with a full AI Workforce”
- Professional / Business plan entitlements (priority support, dedicated support, team collaboration)
- Card deposits / Stripe checkout as a finished journey
- SaaS subscription upgrades that mint **mock** invoices
- Social proof that is illustrative fiction

**Founder rule:** If a customer disputes a charge by opening the product and the marketing site side by side, we lose. Today we would lose.

---

## Product

| Judgment | Detail |
|----------|--------|
| Core job-to-be-done | Help service businesses run appointments, clients, and front desk |
| Product-market fit signal | Strong for single-owner ops (ultrasound / salon / clinic style) |
| Completeness for paid use | Ops core ~85–90%; platform story ~65–70% |
| Risk | Customers buy the **story**, then discover roster placeholders, mock billing, thin support |

**Verdict:** Ship as **“Chasum Scheduling + CRM + AI assistants (Summer & Chase)”** — not as a finished OS with a full AI company inside.

---

## Positioning

**Current brand line:** “AI Business Operating System” / “Run your business. Let AI handle the rest.”

| Strength | Weakness |
|----------|----------|
| Category ambition is venture-scale | Overshoots what ships today |
| Differentiates vs Fresha/Square as “OS + AI employees” | Landing still stars **Emma**; product stars **Summer** |
| Comparison table tries to be honest | Social proof and impact counters are placeholders |

**Reposition for private alpha (recommended):**

> Chasum is the operating system for appointment-based businesses — calendar, booking, CRM, and two AI teammates (Summer at the front desk, Chase on operations). Built with a design partner. Expanding carefully.

Save “full AI Workforce” for when Maya / Leo / etc. do real work.

---

## Pricing

Published: Free · Professional **$79/mo** · Business **$149/mo** · Enterprise custom.

| Issue | Why it matters |
|-------|----------------|
| CTAs imply checkout | Signup writes plan preference; **no Stripe Checkout** |
| Mock billing mints “paid” invoices | Trust and accounting landmines |
| Feature lists promise support tiers | No support product exists |
| “No credit card required · Cancel anytime” | Fine for free; dishonest next to paid CTAs without billing |

**Founder pricing stance for next 30 days:**

1. Keep **Free** for private alpha  
2. Replace paid CTAs with **“Request design partner access” / Contact sales**  
3. Or show prices as **“Coming soon — design partners invited”**  
4. Charge design partners via **manual Stripe Invoice / ACH / retainer** outside the fake in-app upgrade

Do not turn on self-serve paid until Stripe Billing is live end-to-end.

---

## Marketing

| Asset | Status | Founder call |
|-------|--------|--------------|
| Hero / OS positioning | Strong craft | Narrow AI claims |
| Testimonials | Illustrative placeholders | Remove or hard-label until real |
| Logo cloud | Fictional brands | Remove |
| Impact counters (240+ businesses, $2.4M, 14 countries) | Illustrative | Remove for any paid acquisition |
| Emma / Try Emma Free | Brand drift vs Summer | Align to Summer |
| Waitlist | None — open signup | Prefer invite-only for alpha |

**Marketing is a liability until it matches the product.** Pretty pages that overclaim destroy CAC efficiency later (refunds, churn, bad reviews).

---

## Sales

| Motion | Readiness |
|--------|-----------|
| Self-serve PLG | Premature — monetization mock |
| Founder-led sales | Ready — demo + GVM/design partner script |
| Sales collateral | Thin — no one-pager of honest capabilities |
| Demo CTA | `mailto:sales@chasum.app` — workable for alpha |
| Pipeline / CRM for leads | Not productized |

**Next month sales model:** Founder closes 1–3 design partners. No SDRs. No paid ads until legal + billing + claim hygiene.

---

## Onboarding

| Step | Reality |
|------|---------|
| Signup | Works |
| Email confirm | Depends on Supabase SMTP |
| First business | Auto-created — no guided wizard |
| Time-to-first-booking | Hours for a trained operator; days for a cold SMB |
| Empty states | Exist; not a curated “Day 1 success path” |

**For private alpha:** White-glove onboarding is the product. Budget **4–8 founder hours per business** in week one. Do not expect self-serve activation.

---

## Billing

| Layer | Status |
|-------|--------|
| SaaS subscriptions | **Mock** — Postgres only |
| Customer card collect (tenant) | Incomplete (Elements / toast stubs) |
| Manual commerce ledger | Real enough for cash / e-transfer recording |
| Invoices / receipts (commerce) | Schema-dependent; not a reason to sell “payments platform” |

**Hard stop:** No automatic card charges for Chasum subscriptions until a real BillingProvider replaces MockBillingProvider and Pricing CTAs match it.

---

## Support

| Promise | Reality |
|---------|---------|
| Priority / dedicated support on paid plans | **mailto:** sales only |
| Help center | None |
| Status page | None |
| Ticketing | Owner “support” = failed notifications, not customer tickets |

**Alpha support SLA (commit this in writing to partners):**

- Response: same business day (founder Slack/email)  
- Severity-1 booking outage: 2-hour acknowledgment  
- No 24/7 claim

---

## Documentation

| Audience | Status |
|----------|--------|
| Public help site | Missing |
| Privacy / Terms | Missing as routes |
| Internal product/API docs | Strong in-repo |
| GVM / go-live runbooks | Strong — use them |

**Alpha docs minimum:** 5-page partner packet (what works, what doesn’t, how to book, how to get help, data handling).

---

## Legal

**Absent product surfaces:** Privacy Policy, Terms of Service, Cookie policy, DPA.

Without these:

- Do not run paid ads  
- Do not take subscription cards  
- Do not process EU personal data at scale  
- Design partners need at least a short **design-partner agreement** + privacy summary

This is a **Critical** launch gate for any money, not a “nice lawyer later” item.

---

## Security (founder view)

Engineering hardening (rate limits, RLS, fail-loud schema) improved trust for alpha.  
Founder still owns:

- Who has production access  
- Incident response contact  
- Clear statement: we do not store card numbers  
- No overclaim of “Enterprise security” on the homepage until a security page exists

---

## Analytics

No acquisition / activation funnel instrumentation found (PostHog/GA/etc.).

**Blind spots:** signup → setup → first booking → week-2 retention.

For private alpha, a **weekly manual scorecard** (spreadsheet) is enough. For venture-scale open beta, instrument before spend.

---

## Customer Success

Owner platform exists for platform ops.  
True CS (health scores, QBRs, expansion) does not.

**Alpha CS = founder CS:** weekly check-in, one success metric per partner (e.g. % of appointments booked in Chasum vs old tool).

---

## Operations

| Area | Alpha readiness |
|------|-----------------|
| Deploy / health | Viable with runbooks |
| Comms (email) | Requires Resend + cron green |
| Multi-staff | Not ready — sell single-owner |
| Multi-location | Partial — don’t oversell |
| Status / on-call | Founder phone |

---

## Everything that would stop me from charging (summary)

See [LAUNCH_RISK_REGISTER.md](./LAUNCH_RISK_REGISTER.md) for the ranked register.

**Top five:**

1. Mock SaaS billing behind paid pricing CTAs  
2. Marketing fiction (social proof + AI Workforce overclaim)  
3. No Privacy / Terms  
4. Support promises without a support system  
5. Card payment journey incomplete while “payments” appears in the product story  

---

## Venture narrative vs truth

| Pitch | Truth |
|-------|-------|
| AI-native OS for SMBs | Vertical ops platform with two real AI surfaces |
| Self-serve SaaS | Founder-led design partner motion |
| Expansion via AI Workforce | Expansion via booking depth + honesty first |
| $79–$149 ACV path | Unproven until billing + retention exist |

Investors will fund the ambition. **Customers will fund the calendar.** Sequence correctly.

---

## Companions

- [LAUNCH_RISK_REGISTER.md](./LAUNCH_RISK_REGISTER.md)  
- [30_DAY_PRIVATE_ALPHA_PLAN.md](./30_DAY_PRIVATE_ALPHA_PLAN.md)  
- [90_DAY_EXECUTION_PLAN.md](./90_DAY_EXECUTION_PLAN.md)  
- [PRODUCTION_SCORECARD.md](./PRODUCTION_SCORECARD.md) (engineering lens)  
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)  

---

## Final founder note

I would be proud to put a real clinic on Chasum’s booking engine next month under my personal warranty.  
I would be embarrassed to put a credit card form under “Start Professional” tomorrow.

**Earn the right to charge by telling the truth, signing legal basics, and delivering weekly value to a handful of operators — then turn on billing.**
