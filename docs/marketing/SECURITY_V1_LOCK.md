# Security v1 — LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED · **COMPLETE** |
| **PAGE** | Security (`/security`) |
| **VERSION** | Security **v1** |
| **STATE** | **Locked** |
| **Approved** | 2026-07-30 |
| **Approved by** | Product Owner |

---

## Visual source of truth

Approved headline (final polish before lock):

> Security Designed Around Your Business

Supporting copy (unchanged):

> Your business data matters. Chasum is designed with careful safeguards from the start—so you can focus on customers with confidence.

Record the Preview that includes this headline as the visual reference after the lock deploy. Layout/cards baseline previously: https://chasum-2qwiq9hxp-renovisionappcom.vercel.app/security

Implementation sources:

- `lib/marketing/resources-security.ts`
- `components/landing/security-experience.tsx`
- `app/(marketing)/security/page.tsx`

---

## What is locked

Do **not** redesign:

- Hero section (headline + supporting text)
- Security feature cards
- Private Alpha Transparency section
- Support / CTA section
- Typography, colors, spacing, animations, and responsive layout language

Treat this page as **production-ready**.

---

## Allowed changes only

1. Bug fixes  
2. Accessibility improvements  
3. Mobile responsiveness improvements  
4. Performance improvements  
5. Minor wording corrections  

**No redesigns** without an explicit product-owner request.

---

## Related

- Resources: [`RESOURCES_V1_LOCK.md`](./RESOURCES_V1_LOCK.md)
- Why Private Alpha: [`WHY_PRIVATE_ALPHA_V1_LOCK.md`](./WHY_PRIVATE_ALPHA_V1_LOCK.md)

Agent rule: `.cursor/rules/resources-lock.mdc`
