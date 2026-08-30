# Apply — PO LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED / LOCKED |
| **SURFACE** | Marketing Website → Apply (`/apply`) |
| **VERSION** | Apply V1 PO lock · 2026-08-29 |
| **STATE** | **Locked** |
| **Approved** | 2026-08-29 |
| **Approved by** | Product Owner |
| **Claude independent audit** | APPROVED — APPLY READY FOR PO LOCK |
| **Branch** | `cursor/marketing-os-positioning` |
| **Approved SHA** | `c5a39b2d97b4eb59c50f353a7e3be8806085cac0` |
| **Why Private Alpha lock documentation parent** | `b1b9d0a02bf69e6ed5464a2b54148ad6916044e2` |
| **In Production?** | **No.** Do not treat this lock as a Production deploy. `origin/main` / Production pin remains `476af17bfd06113281df0b5c33f995ccb26f5fff`. |

---

## APPLY — PO LOCKED

Date: 2026-08-29  
Approved SHA: `c5a39b2d97b4eb59c50f353a7e3be8806085cac0`  
Claude: **APPROVED — APPLY READY FOR PO LOCK**  
PO: **APPROVED**  

Status:

- Marketing branch only.
- Not merged to `main`.
- Not deployed to Production.

This file is the **only** canonical current Apply lock. No prior Apply lock file existed; nothing is superseded except the earlier **false-success Preview result**, which is **not** current truth.

---

## Approval evidence (2026-08-29)

- PO / ChatGPT rendered desktop review
- Professional plan handoff test
- Business plan handoff test
- Empty-submit validation test
- Business Type validation test
- Successful submission test
- Delivery-failure manual test
- Preview `RESEND_API_KEY` configuration correction (presence only — secret value is not documented)
- Fresh Preview redeploy (stale Preview replaced for testing)
- End-to-end delivery verification to the Chasum Sales inbox
- Cursor bounded validation / accessibility implementation
- Cursor bounded lead-delivery reliability implementation
- Independent Claude final pre-lock audit
- Claude verdict: **APPROVED — APPLY READY FOR PO LOCK**
- PO: **APPROVED**

This lock identifies the **exact SHA**, **exact surface**, **exact date**, Claude approval, and PO approval so this accepted generation cannot be confused with another commit.

---

## Visual / implementation source of truth

The locked Apply baseline is commit **`c5a39b2d97b4eb59c50f353a7e3be8806085cac0`** (*Fail Apply success unless Resend accepts the lead email.*) on **`cursor/marketing-os-positioning`**.

Why Private Alpha PO-lock documentation parent: **`b1b9d0a02bf69e6ed5464a2b54148ad6916044e2`**.

This state lives on **`cursor/marketing-os-positioning`**. It is **not** merged to `main` and is **not** in Production.

Canonical sources: `app/(marketing)/apply/page.tsx`, `components/landing/design-partner-form.tsx`, `lib/actions/design-partner.ts`, `lib/marketing/apply-validation.ts`.

---

## Locked Apply positioning

Headline:

**Tell us how your business works.**

Approved positioning concept:

one connected operating system—not another disconnected scheduler

Apply is the Private Alpha / Design Partner **acquisition funnel**.

It is **lead capture only**.

It must **not** create:

- account
- tenant
- subscription
- trial
- Stripe customer
- billing state
- entitlement
- onboarding state

---

## Locked field contract

**Required**

- Business name
- Business type
- Team size
- Number of locations
- Current scheduling or business software
- Approximate monthly customer activity
- What would you most like to improve?
- Work email

**Optional**

- Phone number
- Anything else we should know?

**Conditional / hidden**

- `preferred_plan`

---

## Locked Business Type truth

Business Type is **REQUIRED**.

Approved behavior:

- empty default option
- empty string rejected
- unknown value rejected server-side
- approved known values accepted
- taxonomy unchanged in this lock

Do **not** make Business Type optional.

---

## Locked validation UX

Apply uses:

- `* Required` note
- `*` on required labels
- `· optional` on optional labels
- inline field-specific errors
- first-invalid-field focus
- `aria-invalid`
- `aria-describedby`
- entered-value preservation
- preferred-plan preservation
- server authoritative validation

Browser-native validation is **not** the primary Apply UX.

Apply-specific markers / inline validation / success clarification must remain **scoped to Apply**.

---

## Locked plan-intent truth

Approved:

`/apply?plan=professional`  
→ Interested plan: Professional  
→ `preferred_plan=professional`  
→ lead email includes professional

`/apply?plan=business`  
→ Interested plan: Business  
→ `preferred_plan=business`  
→ lead email includes business

Free may remain supported where the current implementation already allows it.

Invalid / tampered values are discarded.

Apply plan intent is **acquisition context only**.

It must never become:

- `subscription_plan_key`
- billing state
- subscription
- entitlement
- trial
- tenant
- account

---

## Locked delivery truth

Lead recipient: **sales@chasumai.com**

Observed successful sender: **notifications@chasumai.com**

Applicant work email: **Reply-To**

Current architecture:

Apply → server validation → Resend → Chasum Sales inbox

No DB application row.  
No CRM.  
No account.  
No subscription.

Preview requires `RESEND_API_KEY` for truthful Apply delivery testing. Do **not** document or expose the secret value.

---

## Locked success contract

Success UI may appear **only** after verified provider acceptance.

Required success path:

validation passes  
→ Resend send attempted  
→ provider returns accepted result with message id  
→ action returns success  
→ UI shows **Application received**

If delivery fails:

- no success card
- form remains visible
- entered values remain where practical
- preferred plan remains
- retry remains available
- form-level error appears

Approved failure copy:

**We couldn’t send your application right now. Please try again. If the problem continues, contact sales@chasumai.com.**

---

## Locked failure modes — fail closed

All must fail closed. **No false-success path may be reintroduced.**

- missing `RESEND_API_KEY`
- provider throw
- provider rejection
- missing message id
- unexpected delivery failure

The earlier false-success Preview result (success card without inbox delivery) is **not** current truth and must not be restored.

---

## Locked success state

**Application received**

Thank you. We review every Private Alpha application personally and will contact you using the details provided. Meanwhile, read why we run a Private Alpha.

Clarification:

**Submitting an application does not create an account or guarantee acceptance.**

Do **not** add response-time guarantees.

---

## Manual end-to-end PO evidence

Final fresh Preview verification confirmed:

- Apply submitted successfully
- success card rendered
- corresponding email arrived in the Chasum Sales inbox
- business data preserved
- Business Type preserved
- Business plan intent preserved
- applicant email / phone preserved
- submitted timestamp present

Performed only after:

- `RESEND_API_KEY` was made available to Preview
- the candidate was freshly redeployed
- the old stale Preview deployment was replaced for testing

---

## Shared Meet Summer truth

`DesignPartnerForm` remains shared.

Apply-specific markers / inline validation / success clarification must remain scoped to Apply.

Locked Meet Summer rendered copy / layout / form presentation remains protected.

Shared server-side delivery truth may remain fail-closed.

Do **not** reopen Meet Summer from Apply work.

---

## Deferred / non-blocking debt — do not fix from this lock

1. No applicant confirmation email
2. No DB / CRM application persistence
3. No provider retry queue
4. No CAPTCHA / honeypot / rate limit
5. Ask Summer 390px FAB overlap risk
6. Business Type taxonomy cleanup
7. Duplicate Veterinary wording
8. “Other Appointment-Based Business” wording
9. Meet Summer historical CRM / front-desk vocabulary
10. Shared Schedule a Demo route debt
11. Business 6-vs-10 runtime / catalog / DB debt
12. Public self-serve billing remains closed

Also: Preview requires `RESEND_API_KEY` for truthful Apply delivery testing (presence only; never document the secret).

---

## Allowed changes only

Future edits to Apply are permitted **only** for:

1. Bug fixes
2. Broken responsive layouts
3. Accessibility fixes
4. Product changes **explicitly requested by the product owner**
5. Claim or delivery-truth updates required to stay aligned with Product Truth when the product owner directs

**No additional visual polish** without an explicit product-owner request.

Do **not** edit locked Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, Contact, Security, or Status as part of Apply work.

Agent rule: `.cursor/rules/apply-lock.mdc`

---

## Related

- Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, Contact, Security, and Status rendered surfaces from the same marketing OS chapter are also **LOCKED** (see [`docs/CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md)). Those locks are **not** in Production.
- Status: [`STATUS_V1_LOCK.md`](./STATUS_V1_LOCK.md)
- Security: [`SECURITY_V1_LOCK.md`](./SECURITY_V1_LOCK.md)
- Contact: [`CONTACT_V1_LOCK.md`](./CONTACT_V1_LOCK.md)
- Why Private Alpha: [`WHY_PRIVATE_ALPHA_V1_LOCK.md`](./WHY_PRIVATE_ALPHA_V1_LOCK.md)
- Pricing: [`PRICING_V1_LOCK.md`](./PRICING_V1_LOCK.md)
- Product truth: [`PRODUCT_TRUTH_MATRIX.md`](./PRODUCT_TRUTH_MATRIX.md)
