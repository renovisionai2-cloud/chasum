# Why Private Alpha — PO LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED / LOCKED |
| **SURFACE** | Marketing Website → Why Private Alpha (`/private-alpha`) |
| **VERSION** | Why Private Alpha PO lock · 2026-08-27 |
| **STATE** | **Locked** |
| **Approved** | 2026-08-27 |
| **Approved by** | Product Owner |
| **Claude independent audit** | APPROVED — WHY PRIVATE ALPHA READY FOR PO LOCK |
| **Branch** | `cursor/marketing-os-positioning` |
| **Approved SHA** | `0afaf3829e00063407eabb9a2d955403527ff754` |
| **Implementation parent** | `cc1fe6bd0756f903953e3656c7bd09ca1ee998e6` |
| **In Production?** | **No.** Do not treat this lock as a Production deploy. `origin/main` / Production pin remains `476af17bfd06113281df0b5c33f995ccb26f5fff`. |

---

## WHY PRIVATE ALPHA — PO LOCKED

Date: 2026-08-27  
Approved SHA: `0afaf3829e00063407eabb9a2d955403527ff754`  
Claude: **APPROVED — WHY PRIVATE ALPHA READY FOR PO LOCK**  
PO: **APPROVED**  

Status:

- Marketing branch only.
- Not merged to `main`.
- Not deployed to Production.

---

## Approval evidence (2026-08-27)

- PO / ChatGPT desktop visual review completed
- Cursor read-only product-truth / conversion preflight completed
- ChatGPT reconciliation completed
- Bounded Level 2 implementation completed
- PO visual re-review completed
- Claude independent pre-lock audit completed
- Claude verdict: **APPROVED — WHY PRIVATE ALPHA READY FOR PO LOCK**
- PO: **APPROVED**

This lock identifies the **exact SHA**, **exact surface**, **exact date**, Claude approval, and PO approval so this accepted generation cannot be confused with another commit.

---

## Visual / implementation source of truth

The locked Why Private Alpha baseline is commit **`0afaf3829e00063407eabb9a2d955403527ff754`** (*Align Why Private Alpha copy with OS positioning and program-support truth.*) on **`cursor/marketing-os-positioning`**.

Implementation parent (Pricing PO-lock documentation HEAD): **`cc1fe6bd0756f903953e3656c7bd09ca1ee998e6`**.

This state lives on **`cursor/marketing-os-positioning`**. It is **not** merged to `main` and is **not** in Production.

Canonical copy source: `lib/marketing/resources-private-alpha.ts`. Render: `components/landing/private-alpha-experience.tsx`. Page: `app/(marketing)/private-alpha/page.tsx`.

---

## Historical July 2026 lock (superseded — do not restore)

Why Private Alpha **v1** (2026-07-30) remains recorded for history and must **not** be restored as the current product-truth baseline:

| Field | Historical v1 value |
|-------|---------------------|
| Approved | 2026-07-30 |
| Preview | https://chasum-3lygrcwi7-renovisionappcom.vercel.app/private-alpha |
| SHA | `10a9e53` |
| Headline | “Build the Future of Business Management With Us” |

That 2026-07-30 visual lock is **superseded** by this 2026-08-27 current-generation PO lock. This file is the **only** authoritative Why Private Alpha lock.

---

## Locked page positioning

Headline:

**Help Shape the AI Operating System for Service Businesses.**

Private Alpha is a controlled Design Partner program for real service businesses.

It is **not**:

- a fifth pricing plan
- public GA access
- a generic beta-testing program
- unpaid QA
- a guarantee of acceptance
- a guarantee of requested feature delivery

Preserve current section order:

1. Hero
2. Why We're Starting Small
3. What Design Partners Receive
4. How Private Alpha Works
5. Who We're Looking For
6. Our Commitment
7. Final CTA

Final CTA headline remains:

**We're Not Looking for Thousands of Businesses.  
We're Looking for the Right Businesses.**

---

## Locked Design Partner benefits

| Benefit | Locked truth |
|---------|----------------|
| Early Access | Accepted Design Partners may use Chasum before broader public launch. |
| Direct Product Influence | Feedback helps shape priorities. Does not control the Roadmap. |
| Direct Team Support | Program-level Design Partner support. Does **not** redefine Pricing Business **Priority Support**. |
| Personal Onboarding | Guided setup of the current product. Does not imply unlimited custom development. |
| Help Shape Summer | Feedback may improve workflows, product behavior, priorities, and intelligence usefulness. Does not imply direct model training or autonomy. |
| Direct Access to the Chasum Team | Personal/direct relationship with the people building Chasum. Does not promise a permanent universal founder SLA. |

---

## Locked Private Alpha flow

Apply → Meet Our Team → Personal Setup → Use Chasum → Share Feedback → Watch Chasum Improve

| Step | Interpretation |
|------|----------------|
| Apply | Lead capture only |
| Meet Our Team | Review / conversation; not self-serve calendar scheduling |
| Personal Setup | For accepted partners; guided onboarding |
| Use Chasum | Real operational use |
| Share Feedback | Practical workflow feedback |
| Watch Chasum Improve | Feedback informs ongoing improvements; no guaranteed feature delivery; no automatic access to all Roadmap items |

---

## Locked CTA truth

- **Apply for Private Alpha** → `/apply` — acquisition intent only. Must **not** create a subscription, billing/provider state, entitlement mutation, tenant, or account merely from the marketing CTA click.
- **Schedule a Demo** → `/contact#walkthrough` — known deferred shared debt: walkthrough/contact flow, not self-serve calendar scheduling. Do **not** change the shared demo label from Why Private Alpha work.

---

## Locked Summer truth

Summer = AI Business Manager.

Do **not** introduce:

- AI Receptionist as category identity
- AI phone calling
- autonomous execution
- direct model-training claims

---

## Deferred / non-blocking debt — do not fix from this lock

1. Shared Schedule a Demo route (`/contact#walkthrough`; no self-serve calendar booking yet).
2. Optional Apply source tracking — not required now.
3. Meet Summer embedded Apply-form vocabulary — older wording remains on the locked Meet Summer surface; do **not** reopen Meet Summer.
4. Mixed-generation copy on already-locked pages — unrelated to this page.
5. Business 6-vs-10 runtime / catalog / DB reconciliation — separate Level 3 task.
6. Public self-serve billing remains closed.
7. Ask Summer potential 390px overlap — not visually reproduced; do not fix speculatively.
8. Internal benefit icon key `founder` — not user-visible; P3 only.

---

## Allowed changes only

Future edits to Why Private Alpha are permitted **only** for:

1. Bug fixes
2. Broken responsive layouts
3. Accessibility fixes
4. Product changes **explicitly requested by the product owner**
5. Claim updates required to stay aligned with Product Truth when the product owner directs

**No additional visual polish** without an explicit product-owner request.

Do **not** edit locked Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, or Pricing as part of Why Private Alpha work.

Agent rule: `.cursor/rules/resources-lock.mdc`

---

## Related

- Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, and Pricing rendered surfaces from the same marketing OS chapter are also **LOCKED** (see [`docs/CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md)). Those locks are **not** in Production.
- Resources Security / Status remain on their July 2026 locks: [`RESOURCES_V1_LOCK.md`](./RESOURCES_V1_LOCK.md), [`SECURITY_V1_LOCK.md`](./SECURITY_V1_LOCK.md).
- Product truth: [`PRODUCT_TRUTH_MATRIX.md`](./PRODUCT_TRUTH_MATRIX.md).
