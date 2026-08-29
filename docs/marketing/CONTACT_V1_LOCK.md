# Contact — PO LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED / LOCKED |
| **SURFACE** | Marketing Website → Contact (`/contact`) |
| **VERSION** | Contact V1 PO lock · 2026-08-29 |
| **STATE** | **Locked** |
| **Approved** | 2026-08-29 |
| **Approved by** | Product Owner |
| **Claude independent audit** | APPROVED — CONTACT READY FOR PO LOCK |
| **PO visual evidence** | CONTACT VISUAL REVIEW — PASS |
| **Branch** | `cursor/marketing-os-positioning` |
| **Approved SHA** | `29b70486c3e7f3509616015359d609151ebfa53e` |
| **Apply lock documentation parent** | `3b3dbdf4af47b23f5af92036930424e487cc19d0` |
| **In Production?** | **No.** Do not treat this lock as a Production deploy. `origin/main` / Production pin remains `476af17bfd06113281df0b5c33f995ccb26f5fff`. |

---

## CONTACT — PO LOCKED

Date: 2026-08-29  
Approved SHA: `29b70486c3e7f3509616015359d609151ebfa53e`  
Claude: **APPROVED — CONTACT READY FOR PO LOCK**  
PO: **APPROVED**  
Visual: **CONTACT VISUAL REVIEW — PASS**

Status:

- Marketing branch only.
- Not merged to `main`.
- Not deployed to Production.

This file is the **only** canonical current Contact lock. No prior Contact lock file existed; nothing is superseded.

---

## Approval evidence (2026-08-29)

- PO / ChatGPT desktop visual review
- Cursor read-only Contact product-truth / routing preflight
- Cursor bounded Contact-local walkthrough truth + interactive-semantics + tests implementation
- PO rendered verification of the updated Contact page
- Independent Claude final pre-lock audit
- Claude verdict: **APPROVED — CONTACT READY FOR PO LOCK**
- PO visual evidence: **CONTACT VISUAL REVIEW — PASS**
- PO: **APPROVED**

Claude independently confirmed SHA `29b70486c3e7f3509616015359d609151ebfa53e` and:

- focused Contact tests: 8/8 PASS
- marketing + website-concierge: 22 files / 152 tests PASS
- full repo: 66 files / 439 tests PASS
- typecheck PASS
- changed-file lint PASS
- build PASS
- all 9 previously locked marketing surfaces unchanged
- shared `alpha.ts` CTA constants unchanged
- no Contact form / no server action / no false-success path
- routing and anchors correct
- Contact-local **Request a Walkthrough** correct
- shared **Schedule a Demo** protected

This lock identifies the **exact SHA**, **exact surface**, **exact date**, Claude approval, and PO approval so this accepted generation cannot be confused with another commit.

---

## Visual / implementation source of truth

The locked Contact baseline is commit **`29b70486c3e7f3509616015359d609151ebfa53e`** (*Make Contact walkthrough CTA a mailto request, not a scheduled demo.*) on **`cursor/marketing-os-positioning`**.

Apply PO-lock documentation parent: **`3b3dbdf4af47b23f5af92036930424e487cc19d0`**.

This state lives on **`cursor/marketing-os-positioning`**. It is **not** merged to `main` and is **not** in Production.

Canonical source: `app/(marketing)/contact/page.tsx`. Shared chrome (`MarketingDocPage`, header, footer, Ask Summer) is not uniquely owned by this lock; do not reopen locked pages from Contact work.

PO visual evidence recorded: hero hierarchy, four-card balance, Request a Walkthrough appearance, CTA visual consistency, helper text wrapping, Security card layout, footer, no obvious desktop clipping, no material Ask Summer obstruction.

---

## Locked Contact architecture

Contact is intentionally:

**ROUTING / LINK PAGE ONLY**

There is:

- no Contact form
- no Contact server action
- no Resend-backed Contact send
- no CRM
- no DB lead capture
- no calendar scheduler
- no false-success UI

Do **not** add these without a deliberate future product decision.

Apply remains the structured Private Alpha acquisition form.

---

## Locked Contact hero

Eyebrow:

**Contact Chasum**

Headline:

**Start with the conversation that fits you.**

Supporting copy:

**Applying for Private Alpha, looking for a product walkthrough, or already working with us? Choose the right path below.**

---

## Locked Contact paths

### 1. Private Alpha

CTA: **Apply for Private Alpha**  
Destination: `/apply`

### 2. Product Walkthrough

Anchor: `id="walkthrough"`  
Approved Contact-local CTA: **Request a Walkthrough**  
Destination: `mailto:sales@chasumai.com?subject=Chasum%20Private%20Alpha%20Walkthrough`  
Helper: **Opens email to sales@chasumai.com. Prefer applying first?**  
Secondary: **Apply for Private Alpha** → `/apply`

### 3. Existing Design Partner

Anchor: `id="support"`  
CTA: **Contact Support**  
Destination: `mailto:sales@chasumai.com?subject=Chasum%20Design%20Partner%20Support`

This is general current-alpha support routing.

It is **NOT** the Pricing Business-tier “Priority Support” entitlement.

### 4. Security Concern

CTA: **Report a Security Concern**  
Destination: `mailto:sales@chasumai.com?subject=Chasum%20Security%20Concern`  
Secondary: **Security overview** → `/security`

Back to home remains `/`.

Do **not** change these destinations as part of Contact lock work.

---

## Locked walkthrough truth

Contact itself must use:

**Request a Walkthrough**

because the current Contact behavior is **mailto handoff**, not:

- calendar booking
- Calendly
- Cal.com
- Microsoft Bookings
- automatic scheduling

Do **not** change Contact back to “Schedule a Demo” unless real scheduling capability is deliberately introduced later.

---

## Shared demo wording protection

Shared:

`CTA_DEMO_LABEL = "Schedule a Demo"`

remains protected on already-locked surfaces.

Contact must **NOT** modify the shared constant as part of its lock.

Known deferred shared debt:

locked-page “Schedule a Demo”  
→ `/contact#walkthrough`  
→ Contact walkthrough card  
→ mailto request

Do **not** reopen those locked pages during this Contact lock stamp.

---

## Locked inbox truth

Current Contact routing uses **sales@chasumai.com** for:

- walkthrough requests
- design partner support
- security concerns

Do **not** change this during the lock stamp.

Do **not** invent or switch to `support@`, `security@`, `press@`, `partnerships@`, `billing@`, or `careers@` without a separate approved routing decision.

---

## Locked interactive semantics

Contact card CTAs must remain **one interactive element** each.

Approved:

- internal routes → `Link`
- mailto routes → `<a>`
- visual button styling applied directly to the link/anchor

Do **not** reintroduce:

- anchor wrapping button
- button wrapping anchor

---

## Locked accessibility

Preserve:

- one h1
- logical h2 card headings
- descriptive CTA text
- keyboard-accessible links
- visible focus ring
- mailto actions as links
- internal routes as links
- no nested Contact CTA interactions

---

## Deferred / non-blocking debt — do not fix from this lock

1. `support@chasumai.com` unused
2. Header Support → `/contact` rather than `#support`
3. no Partnerships / Press / General cards
4. Ask Summer 390 FAB overlap risk
5. concierge “book a walkthrough” wording
6. metadata “book a product walkthrough”
7. no source / plan context in mailto
8. nested Link/Button debt in locked shared header/nav
9. shared locked “Schedule a Demo” wording
10. no real calendar scheduler
11. no Contact form
12. no CRM / DB Contact capture

These are **not** Contact lock blockers.

---

## Allowed changes only

Future edits to Contact are permitted **only** for:

1. Bug fixes
2. Broken responsive layouts
3. Accessibility fixes
4. Product changes **explicitly requested by the product owner**
5. Claim or routing-truth updates required to stay aligned with Product Truth when the product owner directs

**No additional visual polish** without an explicit product-owner request.

Do **not** edit locked Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, or Apply as part of Contact work.

Agent rule: `.cursor/rules/contact-lock.mdc`

---

## Related

- Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, and Apply rendered surfaces from the same marketing OS chapter are also **LOCKED** (see [`docs/CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md)). Those locks are **not** in Production.
- Apply: [`APPLY_V1_LOCK.md`](./APPLY_V1_LOCK.md)
- Why Private Alpha: [`WHY_PRIVATE_ALPHA_V1_LOCK.md`](./WHY_PRIVATE_ALPHA_V1_LOCK.md)
- Pricing: [`PRICING_V1_LOCK.md`](./PRICING_V1_LOCK.md)
- Product truth: [`PRODUCT_TRUTH_MATRIX.md`](./PRODUCT_TRUTH_MATRIX.md)
