# OPERATION GVM — Friction Report

**Mission:** Treat GVM Baby World as a brand-new Chasum customer and walk the real product — no invented business data, no redesign, no premature fixes.  
**Partner:** Founding Design Partner #001 — GVM Baby World  
**Method:** Live product walk on a signed-in empty/near-empty tenant + code-path review of the 25-step journey.  
**Date:** 2026-07-18  
**Status:** Identify only — do not fix in this pass.

Screenshots: [`docs/operation-gvm/screenshots/`](./operation-gvm/screenshots/)  
Playbook: [`GVM_ONBOARDING_CHECKLIST.md`](./GVM_ONBOARDING_CHECKLIST.md)

---

## Executive verdict

A motivated operator **can** configure Chasum into a working clinic OS, but a brand-new customer **will not** discover the correct order without a human guide.

First login lands on an **ops dashboard**, not a setup journey. The business is silently named **“My Business”** with a **machine slug**, Overview pushes **book / AI / reports** before services and staff exist, and several money/AI surfaces either stub, mislead, or duplicate Settings vs Business.

**For GVM go-live:** use the onboarding checklist with a founder present. Do not hand them `/dashboard` alone.

| Severity | Count |
|----------|------:|
| Critical | 6 |
| High | 10 |
| Medium | 12 |
| Low | 6 |

---

## Journey status (25 steps)

| # | Step | Observed | Blocker notes |
|---|------|----------|---------------|
| 1 | Account creation | Partial | Marketing pushes `/apply` (no account). `/signup` still works — messaging split. |
| 2 | Business creation | Silent | `getOrCreateBusiness()` — no wizard. |
| 3 | Business profile | Usable | Defaults wrong (“My Business”). Dual editors. |
| 4 | Branding | Usable | Split Business ↔ Settings. |
| 5 | Business hours | Usable | Default Mon–Fri; Sat/Sun closed → zero slots. |
| 6 | Locations | Usable | Default “Main” auto-created. |
| 7 | Services | Usable | Empty state OK; test “P4 Service…” pollution risk. |
| 8 | Employees | Usable | Owner not auto-bookable; heavy HR surface. |
| 9 | Booking settings | Usable | Double-booking flag is a no-op preference. |
| 10 | Communications | Partial | Toggles ahead of SMS/push readiness. |
| 11 | Commerce | Partial | Manual payments work; Booking Sheet collect stubs. |
| 12 | Summer config | Usable | Defaults off; AI panel copy says “Phase 4 later”. |
| 13 | Chase config | Usable | Buried under Business → AI; dual routes. |
| 14 | Public booking | Usable | Blocked until services **and** staff; ugly slug risk. |
| 15 | Create customers | Usable | Email required. |
| 16 | Create appointments | Hard | Needs staff hours open that day. |
| 17 | Reschedule | Usable | After booking exists. |
| 18 | Cancel | Usable | |
| 19 | Complete | Usable | Booking Sheet. |
| 20 | Collect payment | Broken in context | Sheet toasts stub; real path is Payments/CRM. |
| 21 | Invoice | Usable | Payments hub. |
| 22 | Receipt | Usable | Payments/CRM. |
| 23 | Reports | Usable | Empty zeros — OK if expected. |
| 24 | Chase dashboard | Usable | Sparse + occasional misleading calm copy. |
| 25 | Ask Summer | Usable | After enable + knowledge; answers “My Business” until renamed. |

---

## Issues

### Critical

#### GVM-C1 — No first-run onboarding wizard / checklist
| | |
|--|--|
| **Screen** | `/dashboard` Overview |
| **Problem** | First login shows ops KPIs (0s), AI summary, and quick actions to book / AI Command Center. No “Set up your business” path. |
| **Recommendation** | Add a dismissible Setup checklist (profile → hours → services → staff → booking link) before ops chrome. |
| **Customer impact** | Partner feels lost; public page stays broken while they poke Calendar. |
| **Effort** | M (3–5 days) |

#### GVM-C2 — Silent business defaults are unprofessional
| | |
|--|--|
| **Screen** | Overview, Business Profile, public `/book/{slug}` |
| **Problem** | Auto-create yields name **“My Business”**, location **“… — Main”**, slug from email prefix (e.g. `prod-auth-1783…`). Live public page branded “My Business”. |
| **Recommendation** | Force rename + slug on first visit; suggest slug from business name; never default slug from opaque emails. |
| **Customer impact** | Shame if link shared early; SEO/brand damage. |
| **Effort** | S–M (1–3 days) |

#### GVM-C3 — Public booking hard-blocked until services **and** staff
| | |
|--|--|
| **Screen** | `/book/[slug]` |
| **Problem** | Empty catalog returns soft “Online booking is not available yet” with no owner-facing checklist of *why*. Owner not auto-added as bookable staff. |
| **Recommendation** | Owner empty-state: “Add 1 service + 1 employee”; optional “I am the provider” one-click. |
| **Customer impact** | Think product is broken after “setup”. |
| **Effort** | S (1–2 days) |

#### GVM-C4 — Booking Sheet “Collect payment” is a stub
| | |
|--|--|
| **Screen** | Reception Booking Sheet |
| **Problem** | `onCollectPayment` only toasts: “Open CRM payments to collect — Stripe arrives soon.” |
| **Recommendation** | Either deep-link to Payments/CRM collect flow or hide the action until Stripe/manual collect works in-sheet. |
| **Customer impact** | Front desk loses trust at the money moment. |
| **Effort** | M (wire existing commerce) / L (Stripe Elements) |

#### GVM-C5 — Apply path does not create an account
| | |
|--|--|
| **Screen** | `/apply` → thank you |
| **Problem** | Private Alpha acquisition ends in email-to-founder. Partner still needs manual provisioning. Login footer still offers `/signup` (“Start scheduling smarter in minutes”). |
| **Recommendation** | Founder playbook for invite; or gated invite-only signup. Align login/signup copy with Alpha. |
| **Customer impact** | “I applied — where’s my account?” |
| **Effort** | S (process) / M (invite signup) |

#### GVM-C6 — Overview React hydration error in live session
| | |
|--|--|
| **Screen** | `/dashboard` |
| **Problem** | Dev overlay reported hydration mismatch in `DashboardOverview` (time/greeting path). “1 Issue” badge visible to operator. |
| **Recommendation** | Fix SSR/client time formatting; never show Next.js issue chrome to customers in prod. |
| **Customer impact** | Looks unstable on day one. |
| **Effort** | S (≤1 day) |

---

### High

#### GVM-H1 — Dual configuration: Business hub vs Settings
| | |
|--|--|
| **Screen** | `/dashboard/business` vs `/dashboard/settings` |
| **Problem** | Profile, hours, branding, booking access edited in two places with overlapping fields. |
| **Recommendation** | One canonical “Setup” surface; Settings for account/billing only — or clear “advanced” labels. |
| **Customer impact** | Edits “don’t stick” / confusion. |
| **Effort** | M–L |

#### GVM-H2 — Business hub tab overload (16+ tabs)
| | |
|--|--|
| **Screen** | `/dashboard/business` |
| **Problem** | Profile…Automation including Memberships, Gift cards, Taxes before day-one needs. |
| **Recommendation** | Progressive disclosure: Essentials vs Catalog vs Commerce extras. |
| **Customer impact** | Paralysis; skips Hours/Staff. |
| **Effort** | M |

#### GVM-H3 — Overview tip omits staff requirement
| | |
|--|--|
| **Screen** | Overview empty week tip |
| **Problem** | Tip says share booking link once hours **and services** are set — misses employees. |
| **Recommendation** | Tip: hours + services + staff. |
| **Customer impact** | Public page still unavailable. |
| **Effort** | XS |

#### GVM-H4 — Default hours hide Saturday/Sunday
| | |
|--|--|
| **Screen** | Reception Day View |
| **Problem** | Seed Mon–Fri 9–5. Live Sat walk: staff “Off today”, “No available times”, “0 open slots” while “Staff working: 2”. |
| **Recommendation** | Prompt to set weekend hours; fix “Staff working” to mean on-shift today. |
| **Customer impact** | Can’t book on open clinic Saturdays. |
| **Effort** | S |

#### GVM-H5 — Misleading Chase calm copy on empty day
| | |
|--|--|
| **Screen** | Reception Morning Brief |
| **Problem** | “Schedule looks steady — keep confirming pending bookings” with 0 appointments. |
| **Recommendation** | Empty-state copy only; never invent steadiness. |
| **Customer impact** | Distrust AI. |
| **Effort** | XS |

#### GVM-H6 — Shared booking URL can show wrong host/port
| | |
|--|--|
| **Screen** | Settings → Public booking page |
| **Problem** | Live session showed `http://localhost:3001/book/...` while app served on `:3000`. |
| **Recommendation** | Derive from request origin or enforce correct `NEXT_PUBLIC_APP_URL`; warn when mismatch. |
| **Customer impact** | Broken shared links. |
| **Effort** | S |

#### GVM-H7 — AI settings copy contradicts live Summer
| | |
|--|--|
| **Screen** | Business → AI |
| **Problem** | “Runtime AI features ship in later Phase 4 modules” while Summer chat is live. |
| **Recommendation** | Delete outdated Phase 4 disclaimer; link to Summer workspace. |
| **Customer impact** | Won’t enable Summer. |
| **Effort** | XS |

#### GVM-H8 — Summer & Chase default off with no prompt
| | |
|--|--|
| **Screen** | Business → AI / AI Workforce |
| **Problem** | `DEFAULT_AI_SETTINGS` disables both; Overview still pushes AI Command Center. |
| **Recommendation** | Setup step: “Turn on Summer” after catalog exists. |
| **Customer impact** | AI feels vaporware. |
| **Effort** | S |

#### GVM-H9 — Double-booking control is dishonest
| | |
|--|--|
| **Screen** | Business → Booking |
| **Problem** | Checkbox stored but calendar still prevents conflicts (“until Phase 4…”). |
| **Recommendation** | Remove or disable with “Coming soon”. |
| **Customer impact** | False expectation. |
| **Effort** | XS |

#### GVM-H10 — Payments Record form asks for Customer ID
| | |
|--|--|
| **Screen** | `/dashboard/payments` |
| **Problem** | Manual record flow expects IDs; new users think in names. “Open Chase” can be read as bank. |
| **Recommendation** | Customer search picker; rename Chase link “Chase insights”. |
| **Customer impact** | Abandons payment recording. |
| **Effort** | S–M |

---

### Medium

#### GVM-M1 — Sidebar density for day-one
| | |
|--|--|
| **Screen** | Shell nav |
| **Problem** | 14 items including Developer, Automation, Integrations before first booking. |
| **Recommendation** | Progressive nav until go-live checklist complete. |
| **Impact / Effort** | Overwhelm / M |

#### GVM-M2 — “Upgrade to Professional” on empty account
| | |
|--|--|
| **Screen** | Top nav |
| **Problem** | Monetization CTA before setup complete. |
| **Recommendation** | Hide until checklist done or partner plan flagged. |
| **Impact / Effort** | Distracting / S |

#### GVM-M3 — Services duplicated in Business hub + Services page
| | |
|--|--|
| **Screen** | Business → Services vs `/dashboard/services` |
| **Problem** | Two catalogs. |
| **Recommendation** | Single source; hub links out. |
| **Impact / Effort** | Confusion / S |

#### GVM-M4 — Employees product is HR-heavy
| | |
|--|--|
| **Screen** | `/dashboard/employees` |
| **Problem** | First hire faces payroll/docs/permissions weight. |
| **Recommendation** | “Add bookable provider” simplified create. |
| **Impact / Effort** | Slow first hire / M |

#### GVM-M5 — CRM requires email
| | |
|--|--|
| **Screen** | Add customer |
| **Problem** | Email required — phone-only patients blocked. |
| **Recommendation** | Email or phone required. |
| **Impact / Effort** | Can’t file walk-ins cleanly / S |

#### GVM-M6 — Reception power-user chrome
| | |
|--|--|
| **Screen** | Reception |
| **Problem** | `/ search · N new · B book · W walk-in` without teaching. |
| **Recommendation** | First-run coach marks or collapse advanced. |
| **Impact / Effort** | Intimidating / S |

#### GVM-M7 — Communications oversell
| | |
|--|--|
| **Screen** | Business → Notifications |
| **Problem** | Channel toggles imply SMS/push/WhatsApp readiness; adapters stubbed. |
| **Recommendation** | Label “Email ready / SMS needs Twilio”. |
| **Impact / Effort** | Broken expectations / S |

#### GVM-M8 — Commerce vs SaaS billing naming
| | |
|--|--|
| **Screen** | Payments vs Settings → Billing |
| **Problem** | Two “billing” concepts. |
| **Recommendation** | “Patient payments” vs “Chasum subscription”. |
| **Impact / Effort** | Support tickets / S |

#### GVM-M9 — Test data pollution risk
| | |
|--|--|
| **Screen** | Services, Employees, public book |
| **Problem** | Live tenant showed `P4 Service A/B`, `P4 Staff One/Two` from prior tests. |
| **Recommendation** | Clean-tenant guarantee for design partners; purge scripts; never seed demo names into partner DBs. |
| **Impact / Effort** | Looks fake / S (process) |

#### GVM-M10 — Public booking progress bar unlabeled
| | |
|--|--|
| **Screen** | `/book/[slug]` |
| **Problem** | Segment bar without step labels. |
| **Recommendation** | Label steps (Service → Staff → Time → Details…). |
| **Impact / Effort** | Mild anxiety / S |

#### GVM-M11 — Summer guest fields feel like a lab
| | |
|--|--|
| **Screen** | Summer workspace |
| **Problem** | Guest name/email/phone above chat — staff may not understand CRM lookup. |
| **Recommendation** | Helper: “Optional — identify the caller”. |
| **Impact / Effort** | Underuse / XS |

#### GVM-M12 — Reports Inventory vapor
| | |
|--|--|
| **Screen** | `/dashboard/reports` |
| **Problem** | Inventory tab “coming soon”. |
| **Recommendation** | Hide until real. |
| **Impact / Effort** | Trust / XS |

---

### Low

#### GVM-L1 — Greeting uses truncated technical identity (“Prod.”)
#### GVM-L2 — Signed-in email shown as raw `prod-auth-…@…` in chrome
#### GVM-L3 — Global “Search clients…” while on Services
#### GVM-L4 — AI Workforce roster may show unfinished agent cards
#### GVM-L5 — Apply submit below fold on short viewports (scroll not obvious)
#### GVM-L6 — Default brand accent historically purple-biased (verify GVM brand fit)

---

## Prioritized improvement list (do in this order)

### P0 — Before GVM unsupervised use
1. **GVM-C2** First-run rename + human slug  
2. **GVM-C3** Staff+services gate explained + “I am the provider”  
3. **GVM-C1** Setup checklist on Overview  
4. **GVM-C4** Fix or hide Collect payment  
5. **GVM-C6** Hydration / issue badge  
6. **GVM-H6** Correct public booking URL host  
7. **GVM-H3** Tip includes staff  
8. **GVM-H7** Remove Phase 4 AI lie  

### P1 — First week with GVM
9. **GVM-H1 / H2** Collapse dual settings + tab overload  
10. **GVM-H4** Weekend hours + honest “staff working”  
11. **GVM-H5** Empty Chase/Reception copy  
12. **GVM-H8** Prompt to enable Summer/Chase  
13. **GVM-H10** Payment customer picker  
14. **GVM-C5** Invite/provision playbook alignment  
15. **GVM-M5** Phone-only CRM customers  
16. **GVM-M9** Clean-tenant policy for partners  

### P2 — Polish
17. Progressive nav (**M1**), rename billing concepts (**M8**), Reception coach (**M6**), public step labels (**M10**), hide Inventory (**M12**)

---

## What already feels premium (keep)

- Apply page tone and restraint  
- Business page description: configure before Calendar/CRM/Summer  
- Services empty-state framing (“source of truth…”)  
- Payments honesty: “Stripe key not set (manual methods active)”  
- Summer grounded-knowledge + guardrails panel  
- Public booking visual calm (once real names/logos exist)

---

## Screenshots index

| File | Capture |
|------|---------|
| `gvm-01-apply.png` | `/apply` acquisition |
| `gvm-02-empty-overview.png` | First-run Overview (“My Business”, zeros, no checklist) |
| `gvm-03-business-profile.png` | Profile defaults + many tabs |
| `gvm-04-services.png` | Services (note test-name risk) |
| `gvm-05-reception.png` | Day view / off-hours friction |
| `gvm-06-public-booking.png` | Public book as “My Business” |
| `gvm-07-summer.png` | Summer chat + grounded knowledge |
| `gvm-08-payments.png` | Commerce manual / Stripe unset |

---

## Explicit non-goals for this pass

- No feature builds  
- No redesign of Reception or Business hub  
- No seeding of fake GVM patients or revenue  
- No Picktime cutover (see `GVM_GO_LIVE.md` when ready)

**Next action after review:** founder prioritizes P0 list → schedule GVM onboarding session with [`GVM_ONBOARDING_CHECKLIST.md`](./GVM_ONBOARDING_CHECKLIST.md).
