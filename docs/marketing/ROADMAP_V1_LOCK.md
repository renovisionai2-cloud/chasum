# Roadmap — PO LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED / LOCKED |
| **SURFACE** | Marketing Website → Roadmap (`/roadmap`) |
| **VERSION** | Roadmap PO lock · 2026-08-27 |
| **STATE** | **Locked** |
| **Approved** | 2026-08-27 |
| **Approved by** | Product Owner |
| **Claude independent audit** | APPROVED — ROADMAP READY FOR PO LOCK |
| **Branch** | `cursor/marketing-os-positioning` |
| **Approved SHA** | `f6ffee11b04ef423c9ae912e2386d3e427f41fad` |
| **Approved Preview** | https://chasum-gm2bnzx3x-renovisionappcom.vercel.app/roadmap |
| **In Production?** | **No.** Do not treat this lock as a Production deploy. `origin/main` / Production pin remains `476af17bfd06113281df0b5c33f995ccb26f5fff`. |

---

## ROADMAP — PO LOCKED

Date: 2026-08-27  
SHA: `f6ffee11b04ef423c9ae912e2386d3e427f41fad`  
Preview URL: https://chasum-gm2bnzx3x-renovisionappcom.vercel.app/roadmap  
Claude: APPROVED  
PO: APPROVED  

---

## Approval evidence (2026-08-27)

- Cursor product-truth preflight completed
- Cursor implementation/testing completed
- PO rendered visual review completed
- ChatGPT rendered visual review completed
- Claude independent read-only audit completed
- Claude verdict: **APPROVED — ROADMAP READY FOR PO LOCK**
- Claude independently confirmed 106/106 marketing + concierge tests
- Claude independently confirmed 393/393 full-repository tests
- typecheck PASS
- lint PASS
- build PASS
- no P0 findings
- no P1 findings
- no P2 findings

This lock identifies the **exact SHA**, **exact surface**, **exact Preview**, **exact date**, Claude approval, and PO approval so this accepted generation cannot be confused with another Preview.

---

## Visual source of truth

Treat this Preview URL as the permanent visual reference for the locked Roadmap page:

**https://chasum-gm2bnzx3x-renovisionappcom.vercel.app/roadmap**

Implementation baseline commit for that Preview: **`f6ffee11b04ef423c9ae912e2386d3e427f41fad`** (*Soften three Roadmap phrases that sounded like internal engineering language.*).

This state lives on **`cursor/marketing-os-positioning`**. It is **not** merged to `main` and is **not** in Production.

Canonical copy source: `lib/marketing/roadmap.ts`. Render: `components/landing/roadmap-experience.tsx`. Page: `app/(marketing)/roadmap/page.tsx`.

---

## Historical v1 lock (superseded — do not restore)

Roadmap **v1** (2026-07-30) remains recorded for history and must **not** be restored:

| Field | Historical v1 value |
|-------|---------------------|
| Approved | 2026-07-30 |
| Preview | https://chasum-rgp49w1xg-renovisionappcom.vercel.app/roadmap |
| SHA | `a372028` |
| Public stages | Available in Chasum Today / Coming Soon / Future Vision |

That three-stage model is **superseded** by this 2026-08-27 current-generation PO lock.

---

## What is locked

Preserve:

- hero: “Building the AI operating system for service businesses.”
- four-stage maturity model:
  1. Available in Private Alpha
  2. In Development
  3. Coming Next
  4. Future Direction
- maturity progression: Future Direction → Coming Next → In Development → Available in Private Alpha
- Available in Private Alpha anchor grouping **THE OPERATING DAY**: Online Booking; Calendar & Scheduling; Command Centre; Summer, AI Business Manager
- Available in Private Alpha supporting group **CONNECTED AROUND IT**: Customers; Team & Employees; Locations; Payments & Financials; Gift Certificates; Memberships & Packages; Customer Communications; Reports
- In Development: Core Booking & Calendar Reliability; Online Payments & Commerce Depth
- Coming Next: Native Mobile Apps; Team Access; AI Workflow Automation
- Future Direction: AI Phone Calls; Inventory Management; Payroll; Marketing Campaigns; Advanced Multi-location Operations; Franchise Management; Customer Loyalty; Marketplace; Proactive Intelligence
- Summer remains AI Business Manager
- current Summer maturity remains assistive / human-controlled
- basic Locations separate from Advanced Multi-location Operations
- current operating automation separate from future AI Workflow Automation
- Native Mobile remains Coming Next after core stability
- no public dates
- no delivery promises for Future Direction
- no internal launch-health labels
- current visual hierarchy
- current stage navigation
- current responsive layout
- current Built With Our Customers close

Promote items only by changing `status` on `ROADMAP_ITEMS` in `lib/marketing/roadmap.ts` when the product owner explicitly directs:

`future_direction` → `coming_next` → `in_development` → `private_alpha`

---

## Product-truth qualifications to preserve

- **Online Booking:** usable in Private Alpha; reliability continues to improve
- **Team & Employees:** deeper team login and permissions come next
- **Locations:** basic multi-location support; not advanced operations
- **Payments & Financials:** manual-first / Early Access; broader online card collection still in development
- **Gift Certificates:** operator create/redeem; not a mature public storefront claim
- **Memberships & Packages:** operator configuration exists; deeper lifecycle continues to evolve
- **Customer Communications:** SMS plan/provider dependent; not AI phone service
- **Summer:** observe / understand / recommend; human remains in control; not autonomous operation
- **Native Mobile:** one reusable Chasum app; iOS/Android direction; after core stability; not tenant-specific apps
- **AI Workflow Automation:** act with approval / automate safely; not autonomous operation
- **Future Direction:** direction, not a delivery promise

---

## Do not regress Roadmap to

- “Building the Future of Business Management”
- Available in Chasum Today
- Coming Soon
- Future Vision
- “actively building” claims for features not currently active
- “next several years” blanket language
- generic Business Calls & Texting implying full telephony
- duplicate Workflow Automation cards
- basic Multi-location presented as distant future
- Memberships & Packages presented as entirely Coming Soon
- AI Business Insights presented as entirely multi-year future
- “hardening the operating system”
- “stabilize the operating system”
- “online card collection is still deepening”
- “we're just getting started”
- autonomous Summer claims
- speculative dates
- fake progress percentages/timelines

---

## Known Pricing audit debt — do not fix from Roadmap

Pricing still requires its own product-truth audit. Do **not** edit Pricing from this lock.

Known conflicts:

- Inventory shown in Pricing despite not being a current product
- Online Payments stronger in Pricing than current manual-first reality
- Invoicing represented differently
- Memberships & Packages absent from Pricing

---

## Allowed changes only

Future edits to Roadmap are permitted **only** for:

1. Bug fixes
2. Broken responsive layouts
3. Accessibility fixes
4. Product changes **explicitly requested by the product owner**
5. Claim updates required to stay aligned with Product Truth when the product owner directs

**No additional visual polish** without an explicit product-owner request.

Do **not** edit locked Homepage, Platform, Meet Summer, Product Tour, Industries, or Pricing as part of Roadmap work.

Agent rule: `.cursor/rules/roadmap-lock.mdc`

---

## Related

- Homepage, Platform, Meet Summer, Product Tour, and Industries rendered surfaces from the same marketing OS chapter are also **LOCKED** (see [`docs/CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md)). Those locks are **not** in Production.
- Product truth: [`PRODUCT_TRUTH_MATRIX.md`](./PRODUCT_TRUTH_MATRIX.md).
