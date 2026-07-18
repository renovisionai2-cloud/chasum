# Chasum 30-Day Private Alpha Plan

**Version:** 1.0 · 2026-07-18  
**Goal:** Put **1–3 real businesses** on Chasum with founder warranty — **without** dishonest paid self-serve.  
**Success:** Partners run live bookings; we learn; we do not take automated subscription charges yet.

Companion: [FOUNDER_AUDIT.md](./FOUNDER_AUDIT.md) · [LAUNCH_RISK_REGISTER.md](./LAUNCH_RISK_REGISTER.md)

---

## North star (30 days)

> “A design partner can replace their old booking tool for daily operations, with me on speed dial — and the website no longer lies.”

**Non-goals this month:** paid ads, self-serve Professional checkout, hiring a support team, launching full AI Workforce marketing.

---

## Design partner criteria

| Must have | Nice to have | Avoid |
|-----------|--------------|-------|
| Appointment-based service business | Already unhappy with Picktime/Fresha/etc. | Complex multi-franchise |
| Single primary owner operator | Willing to give weekly feedback | Needs PCI card deposits day one |
| Can migrate or parallel-run for 2–4 weeks | Warm relationship (e.g. GVM) | Expects 24/7 SLA |

**Target count:** 1 ideal (GVM-style) → max 3. Quality over logos.

---

## Week 0 — Truth reset (Days 1–3)

**Founder owns marketing integrity.**

- [ ] Remove or hard-label illustrative testimonials, logo cloud, impact counters  
- [ ] Align landing AI story to **Summer + Chase** (retire Emma-as-hero or rename consistently)  
- [ ] Change Pricing CTAs: paid plans → **“Request access” / Contact sales** (or “Design partners only”)  
- [ ] Add footer links stubs or published drafts for Privacy + Terms (even v0.1)  
- [ ] Write 1-page **Design Partner Agreement** (scope, data, SLA, no automatic billing)  
- [ ] Create partner packet: what works / what doesn’t / how to get help  

**Exit:** A stranger reading the homepage cannot sue you for fiction.

---

## Week 1 — Partner zero live (Days 4–10)

- [ ] Confirm production env: Supabase migrations through latest, Resend, cron, `/api/health` green  
- [ ] White-glove setup: business, locations, services, staff, hours, public booking link  
- [ ] Parallel run: keep old tool 1–2 weeks if needed (see GVM go-live docs)  
- [ ] Smoke path with partner: public book → confirm email → Day View → CRM  
- [ ] Stand up **shared Slack/iMessage** channel; publish SLA (same-day response)  
- [ ] Baseline metric: appointments created in Chasum this week  

**Exit:** First live customer appointment booked through Chasum.

---

## Week 2 — Stabilize ops (Days 11–17)

- [ ] Daily check-in (15 min) for 5 days, then every other day  
- [ ] Log top 10 friction points (spreadsheet = analytics)  
- [ ] Fix only **alpha blockers** (booking broken, email missing, confusing copy) — no feature tourism  
- [ ] Train one backup person at the partner business on Day View + Booking Sheet  
- [ ] Verify quiet hours / reminder jobs if enabled  

**Exit:** Partner staff can run a full day without founder in the chair.

---

## Week 3 — Prove retention (Days 18–24)

- [ ] Partner uses Chasum as **primary** calendar for ≥5 consecutive business days  
- [ ] Capture one **real** quote (with permission) — replace a placeholder testimonial  
- [ ] Document time saved / no-show handling anecdotes (truthful only)  
- [ ] Review Commerce needs: cash/e-transfer recording vs card deposits  
- [ ] Decide: invite partner #2 only if partner #1 is green  

**Exit:** Written go/no-go for second design partner.

---

## Week 4 — Alpha readout (Days 25–30)

- [ ] Founder readout memo: what broke, what delighted, willingness-to-pay signal  
- [ ] Update risk register (close or re-rank items)  
- [ ] Price interview: “If billing were real, would $79 feel fair? Why/why not?”  
- [ ] Lock 90-day priorities from evidence (not roadmap romance)  
- [ ] Celebrate privately — do not publish fake scale metrics  

**Exit criteria for “private alpha succeeded”:**

1. ≥1 business live ≥2 weeks  
2. Homepage/pricing no longer overclaim  
3. Privacy + Terms published (v0.1+)  
4. Clear list of closed-beta gates (billing, support, Elements)  
5. At least one authentic partner quote  

---

## Weekly operating rhythm

| Cadence | Activity |
|---------|----------|
| Mon | Health check + partner agenda |
| Daily (early) | Skim failed jobs / email delivery |
| Wed | Friction log review → max 3 fixes |
| Fri | 30-min partner retro |
| Sun | Founder journal: keep / kill / postpone |

---

## Metrics (manual is fine)

| Metric | Target by Day 30 |
|--------|------------------|
| Design partners live | 1–3 |
| Appointments in Chasum | Trend up week-over-week |
| Sev-1 incidents | 0 unresolved > 24h |
| Founder hours in support | Tracked (expect high) |
| Fake social proof remaining on site | **0** |
| Automated SaaS charges | **0** |

---

## Communication templates (short)

**Partner invite:**  
“We’re inviting a few operators into a private alpha. You’ll get white-glove setup and direct access to me. Pricing is complimentary during alpha. The product is strong for booking/CRM; AI is Summer + Chase only; card checkout and full AI roster aren’t sold as done.”

**Public site (if asked):**  
“Chasum is in private alpha. Request access.”

---

## Budget (soft)

| Item | Notes |
|------|-------|
| Founder time | Primary cost — protect 50%+ calendar |
| Resend / Twilio / Supabase / Vercel | Normal infra |
| Legal draft | Privacy/Terms — cheap now, expensive later |
| Ads | **$0** |

---

## Explicit bans (30 days)

- Turning on MockBilling “paid” for real users  
- Publishing fictional logos/stats as proof  
- Running Meta/Google ads to `/pricing`  
- Promising dedicated support or 99.99% uptime  
- Expanding past 3 partners without readout  

---

## Handoff to 90-day plan

If Day 30 exit criteria pass → execute [90_DAY_EXECUTION_PLAN.md](./90_DAY_EXECUTION_PLAN.md) Phase A→B.  
If they fail → extend private alpha; do not “launch harder.”
