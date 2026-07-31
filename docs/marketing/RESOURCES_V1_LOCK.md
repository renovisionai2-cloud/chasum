# Resources v1 — LOCK (partial)

| Field | Value |
|-------|--------|
| **STATUS** | Partial — see routes below |
| **SECTION** | Resources |
| **VERSION** | Resources **v1** |
| **Approved by** | Product Owner |

---

## Route lock status

| Route | Status | State |
|-------|--------|-------|
| `/security` | ✅ APPROVED | **Locked** |
| `/status` | ✅ APPROVED | **Locked** |
| `/private-alpha` | ⏳ Pending review | **Not locked** |

Why Private Alpha received a product-owner-directed messaging redesign after the initial Resources v1 ship. **Do not lock `/private-alpha` until the product owner reviews and approves.**

---

## Visual source of truth (locked routes)

Security + Status baseline Preview:

**https://chasum-2qwiq9hxp-renovisionappcom.vercel.app**

- Security: https://chasum-2qwiq9hxp-renovisionappcom.vercel.app/security
- Status: https://chasum-2qwiq9hxp-renovisionappcom.vercel.app/status

Implementation sources (locked):

- `lib/marketing/resources-security.ts`
- `lib/marketing/resources-status.ts`
- `components/landing/security-experience.tsx`
- `components/landing/status-experience.tsx`
- `app/(marketing)/security/page.tsx`
- `app/(marketing)/status/page.tsx`

Why Private Alpha (in review):

- `lib/marketing/resources-private-alpha.ts`
- `components/landing/private-alpha-experience.tsx`
- `app/(marketing)/private-alpha/page.tsx`

---

## What is locked

**Security** and **System Status** — including hero copy, sections, cards, status badges, layout, spacing, typography, icons, colors, animations, and responsive behavior.

Do **not** redesign or polish those routes unless the product owner explicitly requests it, or status/security facts require an honest update.

### Page questions

| Page | Question |
|------|----------|
| Why Private Alpha | Why should I join Chasum now? *(pending approval)* |
| Security | Can I trust Chasum with my business? |
| Status | Can I rely on Chasum? |

---

## Allowed changes only (locked routes)

1. Bug fixes  
2. Broken responsive layouts  
3. Accessibility fixes  
4. Manual status updates (`lib/marketing/resources-status.ts`) when services change  
5. Product-owner-requested copy or claim updates  

---

## Related

- Pricing: [`PRICING_PAGE_V1_LOCK.md`](./PRICING_PAGE_V1_LOCK.md)
- Summer Onboarding: [`SUMMER_ONBOARDING_V1_LOCK.md`](./SUMMER_ONBOARDING_V1_LOCK.md)
- Roadmap: [`ROADMAP_V1_LOCK.md`](./ROADMAP_V1_LOCK.md)

Agent rule: `.cursor/rules/resources-lock.mdc`
