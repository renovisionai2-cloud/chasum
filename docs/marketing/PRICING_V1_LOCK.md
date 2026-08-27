# Pricing — PO LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED / LOCKED |
| **SURFACE** | Marketing Website → Pricing (`/pricing`) |
| **VERSION** | Pricing PO lock · 2026-08-27 |
| **STATE** | **Locked** |
| **Approved** | 2026-08-27 |
| **Approved by** | Product Owner |
| **Claude independent audit** | APPROVED — PRICING READY FOR PO LOCK |
| **Branch** | `cursor/marketing-os-positioning` |
| **Approved SHA** | `f44fea23e80e14abddd0cf2279b8e199cbc4fb6d` |
| **Implementation parent** | `82c4ea0f960fa6806a3b44bac059f05118594295` |
| **In Production?** | **No.** Do not treat this lock as a Production deploy. `origin/main` / Production pin remains `476af17bfd06113281df0b5c33f995ccb26f5fff`. |

---

## PRICING — PO LOCKED

Date: 2026-08-27  
Approved SHA: `f44fea23e80e14abddd0cf2279b8e199cbc4fb6d`  
Claude: **APPROVED — PRICING READY FOR PO LOCK**  
PO: **APPROVED**  

Status:

- Marketing branch only.
- Not merged to `main`.
- Not deployed to Production.

---

## Approval evidence (2026-08-27)

- Product-truth preflight completed
- Claude pre-challenge completed
- Reconciled implementation completed
- Manual validation completed
- Pricing visual PO review completed
- Annual pricing visual verification completed
- Selected-plan Apply handoff verification completed
- FAQ visual PO review completed
- Claude independent pre-lock audit completed
- Claude verdict: **APPROVED — PRICING READY FOR PO LOCK**
- PO: **APPROVED**

This lock identifies the **exact SHA**, **exact surface**, **exact date**, Claude approval, and PO approval so this accepted generation cannot be confused with another commit.

---

## Visual / implementation source of truth

The locked Pricing commercial-truth baseline is commit **`f44fea23e80e14abddd0cf2279b8e199cbc4fb6d`** (*Polish Pricing FAQ copy without changing commercial truth.*) on **`cursor/marketing-os-positioning`**.

Commercial-truth implementation parent: **`82c4ea0f960fa6806a3b44bac059f05118594295`** (*Align Pricing with commercial truth.*).

This state lives on **`cursor/marketing-os-positioning`**. It is **not** merged to `main` and is **not** in Production.

Canonical copy source: `lib/marketing/pricing.ts`. Render: `components/landing/pricing.tsx`, `components/marketing/pricing-plan-cards.tsx`, `components/marketing/pricing-billing-toggle.tsx`. Page: `app/(marketing)/pricing/page.tsx`.

---

## Historical July 2026 lock (superseded — do not restore)

Official Chasum Pricing Page v1 (2026-07-30) remains recorded for history and must **not** be restored as the current commercial-truth baseline:

| Field | Historical v1 value |
|-------|---------------------|
| Approved | 2026-07-30 |
| Preview | https://chasum-aw2cx9wbn-renovisionappcom.vercel.app/pricing |
| SHA | `83fbaed` |
| Canonical file | [`PRICING_PAGE_V1_LOCK.md`](./PRICING_PAGE_V1_LOCK.md) |

That 2026-07-30 visual lock is **superseded** by this 2026-08-27 current-generation PO lock.

---

## Locked commercial truth

### Free — $0

- Online Booking
- Calendar
- Email Confirmations & Reminders
- Basic Customer Management
- 1 Staff Member
- 1 Location
- Chasum Branding

### Professional — $79/month · $790/year

- Summer — AI Business Manager
- SMS Reminders
- Customer Communications
- Payments & Financials — Manual-first / Early Access
- Gift Certificates
- Invoicing — Early Access
- Up to 3 Staff Members
- Up to 3 Locations
- Basic Reporting
- Remove Chasum Branding

### Business — $149/month · $1,490/year

- Includes Professional
- Unlimited Staff
- Up to 6 Locations
- Reporting & Insights
- API & Integrations
- Priority Support

### Enterprise — Custom

- Larger organizations / franchises / chains may be target customers
- Commercial / custom support tier
- No claim that Franchise Management software is currently shipped
- No claim that Custom Permissions is currently shipped

---

## Locked annual rule

Pay for 10 months and receive 12 months of service.

Customer-facing wording: **Save 2 months**

- Professional: `$79 × 10 = $790/year`
- Business: `$149 × 10 = $1,490/year`

Do **not** restore:

- 20%
- SAVE 20%
- $63/month yearly
- $119/month yearly
- $59 Professional
- $590 Professional

---

## Locked commercial / product boundaries

- Public self-serve billing is not open.
- Plan CTAs are acquisition / application actions: Apply for Free, Apply for Professional, Apply for Business, Contact Sales.
- Selected plan on Apply is acquisition intent only.
- Apply does not mutate `subscription_plan_key`, billing, provider state, or entitlements.
- Summer = AI Business Manager.
- Summer is not positioned as an AI Receptionist.
- AI / voice phone calling is not currently available.
- Customer Communications does not mean hosted business telephony.
- Payments & Financials is Manual-first / Early Access.
- Broader online card collection remains in development.
- Gift Certificates operator create/redeem exists; no mature public storefront claim.
- Inventory Management is Future Direction and is not included in current Pricing.
- Memberships & Packages plan entitlement remains undecided and therefore omitted from Pricing.
- Business public / commercial location limit remains 6.
- Public SaaS subscription currency remains unresolved; bare `$` remains intentional.
- Invoicing runtime entitlement gating is separate debt and is not implied by Pricing.
- Franchise targeting does not imply Franchise Management software.

---

## Deferred / non-blocking debt — do not fix from this lock

1. **Business 6-vs-10 runtime / catalog / DB reconciliation** — public/commercial = 6; separate Level 3 engineering task.
2. **SaaS subscription currency** — not yet locked; bare `$` remains current public treatment.
3. **Memberships & Packages plan boundary** — product capability exists; Pricing entitlement not yet decided.
4. **Invoicing runtime plan enforcement** — not part of this Pricing marketing lock.
5. **Public self-serve billing** — remains closed.
6. **Meet Summer embedded Apply-form vocabulary** — older “appointments / CRM” vocabulary remains on the already-locked Meet Summer embedded form; cross-page consistency debt only. Do **not** reopen Meet Summer from this lock.
7. **Unused Pricing export** — `PRICING_FINAL_SECONDARY_CTA`; harmless P3 cleanup debt.

---

## Allowed changes only

Future edits to Pricing are permitted **only** for:

1. Bug fixes
2. Broken responsive layouts
3. Accessibility fixes
4. Product changes **explicitly requested by the product owner**
5. Claim updates required to stay aligned with Product Truth when the product owner directs

**No additional visual polish** without an explicit product-owner request.

Do **not** edit locked Homepage, Platform, Meet Summer, Product Tour, Industries, or Roadmap as part of Pricing work.

Agent rule: `.cursor/rules/pricing-page-lock.mdc`

---

## Related

- Homepage, Platform, Meet Summer, Product Tour, Industries, and Roadmap rendered surfaces from the same marketing OS chapter are also **LOCKED** (see [`docs/CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md)). Those locks are **not** in Production.
- Product truth: [`PRODUCT_TRUTH_MATRIX.md`](./PRODUCT_TRUTH_MATRIX.md).
