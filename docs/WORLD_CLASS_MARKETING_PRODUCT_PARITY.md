# World Class Marketing ↔ Product Parity

**Chapter:** 0  
**Authority for claims:** [`docs/marketing/PRODUCT_TRUTH_MATRIX.md`](./marketing/PRODUCT_TRUTH_MATRIX.md)  
**Locked pages:** Pricing, Roadmap, Meet Summer, Resources, Security — PO required to change copy  
**Method:** Inspected `app/(marketing)/*`, `lib/marketing/*`, Truth Matrix, locks  

**Classification:** AVAILABLE NOW must work · UPCOMING/ROADMAP/BETA ok if disclosed · AMBIGUOUS = treat as promise  

---

## Executive mismatches (Critical / High)

| # | Issue | Marketing says | Product Truth / code | Risk | Chapter |
|---|--------|----------------|----------------------|------|---------|
| 1 | Online payments | Pricing “Online Payments” / “Accept payments securely” | Manual ledger Available; Stripe Elements Coming Next | Critical | 6, 13 |
| 2 | Inventory | Business plan includes Inventory | Reports placeholder; Roadmap Coming Soon | Critical | 10, 13 |
| 3 | Summer status | Roadmap Available Today | Truth: Early Access | Critical | 12, 13 |
| 4 | Memberships | Roadmap Coming Soon | Business hub CRUD live; Platform modules claim them | Critical | 9, 13 |
| 5 | Multi-location | Roadmap Future Vision | Truth + Pricing: Available Today | Critical | 9, 13 |
| 6 | Start Free | CTA “Start Free” → `/apply` | No public self-serve Free signup | High | 13 |
| 7 | Business Calls | Pricing Professional include | `tel:` + activity log; not hosted telephony | High | 7, 13 |
| 8 | Unlimited staff | Business Unlimited staff | Directory uncapped; staff login Coming Next | High | 8, 13 |
| 9 | AI Receptionist Today | Meet Summer CH7 | Conflicts with FS_ROADMAP; voice Future Vision | High | 12, 13 |
| 10 | Automate / staff training | Summer homepage / FAQ | Guidance Early Access, not full automation | High | 12 |
| 11 | Industries foundations | Chips include Payments + AI BM as Available Today | AI Early Access; vertical ≠ complete | High | 14 |
| 12 | Medical Clinics | Clinic foundations | Not EMR — must stay non-clinical | High | 14 |
| 13 | Dormant fake stats | `IMPACT_STATS` / `TESTIMONIALS` in homepage.ts | Invented; unused on live `/` but latent | Critical if remounted | 13 |
| 14 | Concierge knowledge | Mirrors Pricing inventory claims | Summer may repeat overclaims | High | 12, 13 |

---

## Parity matrix (priority rows)

| Marketing page | Section | Exact promise | Plan/audience | Claimed as | Product route | Status | Real data | Tested | Mobile | Missing | Risk | Chapter | Verify |
|----------------|---------|---------------|---------------|------------|---------------|--------|-----------|--------|--------|---------|------|---------|--------|
| Pricing | Catalog | Online Payments | Pro+ | Now | `/dashboard/payments` | Partial | Manual | Partial | Partial | Card UX; claim hygiene | Critical | 6,13 | Open |
| Pricing | Workflow | Accept payments securely | All | Now | Payments | Partial | Manual | Partial | Partial | Qualifier | Critical | 6,13 | Open |
| Pricing | Free card | Booking, calendar, email, CRM, 1 staff, 1 loc | Free | Now | Calendar/CRM/book | Complete* | Yes | Yes | Partial | Staff limit ungated | Med | 8,13 | Open |
| Pricing | CTA | Start Free | Public | Now | `/apply` | Ambiguous | N/A | — | — | Self-serve | High | 13 | Open |
| Pricing | Pro | Summer AI Business Manager | Pro+ | Included | Summer routes | Partial EA | EA | Partial | Partial | Status label | High | 12,13 | Open |
| Pricing | Pro | SMS Reminders | Pro+ | Included | Twilio path | Partial EA | Config | Partial | Partial | Config + plan | Med | 7,13 | Open |
| Pricing | Pro | Business Calls & Texting | Pro+ | Included | Contact + SMS | Partial | Logs | Partial | Partial | Scope honesty | High | 7,13 | Open |
| Pricing | Pro | Gift Cards | Pro+ | Included | Business hub | Complete ops | Yes | Partial | Partial | Portal limited | Med | 6,11 | Open |
| Pricing | Pro | Invoicing | Pro+ | Included | Commerce | Partial EA | Evolving | Partial | Partial | Depth | Med | 6 | Open |
| Pricing | Business | Inventory Management | Biz+ | Included | Reports placeholder | Missing | No | — | — | Product or delist | Critical | 10,13 | Open |
| Pricing | Business | Advanced Analytics | Biz+ | Included | Reports | Partial | Yes | Partial | Partial | Naming | Med | 10 | Open |
| Pricing | Business | API & Integrations | Biz+ | Included | Developer | Partial | Keys | Partial | — | Not plan-gated | Med | 9,13 | Open |
| Pricing | Business | Unlimited Staff | Biz | Included | Employees | Partial | Directory | — | — | No staff login | High | 8 | Open |
| Pricing | Enterprise | Enterprise Security / Custom Permissions | Ent | Partnership | Security / roles | Partial | Mixed | — | — | Honesty | High | 13 | Open |
| Roadmap | Available | Payments | All | Today | Payments | Partial | Manual | — | — | Sync Truth | High | 13 | Open |
| Roadmap | Available | Summer | All | Today | Summer | Partial EA | EA | — | — | Status vocab | Critical | 13 | Open |
| Roadmap | Available | Calls & Texting | Paid | Today | Comms | Partial | Mixed | — | — | Scope | High | 13 | Open |
| Roadmap | Coming Soon | Inventory | Future | Soon | Placeholder | Missing | No | — | — | vs Pricing | Critical | 13 | Open |
| Roadmap | Coming Soon | Memberships & Packages | Future | Soon | Business hub | Live CRUD | Yes | Partial | — | Status wrong | Critical | 13 | Open |
| Roadmap | Future | Multi-location | Future | Vision | Locations | Live | Yes | Yes | Partial | Demotes live | Critical | 13 | Open |
| Homepage | OS | Scheduling…payments…AI | Public | Implied | Dashboard | Partial | Mixed | — | — | Qualifiers | Med | 13 | Open |
| Homepage | Summer | Automate repetitive work | Public | EA footnote | Summer | Overreach | EA | — | — | Bounds | High | 12 | Open |
| Homepage | Industries | Education tile | Public | — | Industries | Missing on `/industries` | — | — | — | Taxonomy | Med | 14 | Open |
| Platform | Modules | Memberships/packages in Business | Public | Implied now | Business hub | Live | Yes | — | — | vs Roadmap | High | 13 | Open |
| Platform | Modules | Staff login Coming Next | Public | Honest | Employees | Honest | — | — | — | Keep | Low | — | OK |
| Meet Summer | CH7 | AI Receptionist Today | Public | Today | Concierge | Conflict | Chat EA | — | — | Vocab | High | 12 | Open |
| Meet Summer | FAQ | Voice not available | Public | Not yet | — | Correct | No | — | — | Keep | Low | — | OK |
| Industries | All | Available Today foundations + Payments/AI chips | All | Foundations | Shared OS | Partial | Mixed | — | — | Honesty | High | 14 | Open |
| Industries | Medical | Clinic ops | Medical | Foundations | OS | Partial non-EMR | No PHI | — | — | Non-claim | High | 14 | Open |
| Private Alpha | Benefits | Early access / onboarding | Partners | Process | Apply | Process | — | — | — | Ops | Low | — | OK |
| Security | Cards | Stripe among trusted providers | Public | Infra | Env | Partial Stripe UX | Config | — | — | Wording | Med | 13 | Open |
| Status | Services | Email/SMS/Payments Configuration Required | Partners | Manual | Providers | Aligned | Config | — | — | Keep | Low | — | OK |
| Truth Matrix | Card deposits | Coming Next | — | Coming Next | Commerce | Incomplete | — | — | — | Authority | — | OK |
| Truth Matrix | No fake testimonials | Non-claim | — | — | Dormant data | Violated if remounted | Fake | — | — | Quarantine | Critical | 13 | Open |

\*Foundations = works for Private Alpha / GVM path; not every plan edge case.

---

## Resolution rules (Chapter 13)

1. Do **not** silently delete marketing claims.  
2. Do **not** fake portal features.  
3. Prefer product completion **or** clear status disclosure (PO for locked pages).  
4. Quarantine dormant `IMPACT_STATS` / `TESTIMONIALS` / unused social proof.  

---

## Lower-risk / aligned (summary)

Public booking + availability · Reception/calendar · CRM · Multi-location in Pricing/Truth · Gift certificates (operator) · Revenue report foundations · Calendar integrations caveats · Private Alpha / no self-serve notes · Security transparency · Status Configuration Required · Platform “illustrative” disclaimers · Non-EMR FAQ.  
