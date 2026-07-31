# Resources v1 — LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED |
| **SECTION** | Resources (`/private-alpha`, `/security`, `/status`) |
| **VERSION** | Resources **v1** |
| **STATE** | **Locked** |
| **Approved** | 2026-07-30 |
| **Approved by** | Product Owner |

---

## Visual source of truth

Record the Preview URL after the Resources v1 polish deploy:

- Why Private Alpha: `{PREVIEW}/private-alpha`
- Security: `{PREVIEW}/security`
- Status: `{PREVIEW}/status`

Implementation sources:

- `lib/marketing/resources-private-alpha.ts`
- `lib/marketing/resources-security.ts`
- `lib/marketing/resources-status.ts`
- `components/landing/private-alpha-experience.tsx`
- `components/landing/security-experience.tsx`
- `components/landing/status-experience.tsx`
- `app/(marketing)/private-alpha/page.tsx`
- `app/(marketing)/security/page.tsx`
- `app/(marketing)/status/page.tsx`

---

## What is locked

The Resources experience — Why Private Alpha, Security, and System Status — including hero copy, sections, cards, status badges, layout, spacing, typography, icons, colors, animations, and responsive behavior — is the **approved baseline**.

Do **not** redesign or polish unless the product owner explicitly requests it, or status/security facts require an honest update.

### Page questions (do not dilute)

| Page | Question |
|------|----------|
| Why Private Alpha | Why should I join Chasum now? |
| Security | Can I trust Chasum with my business? |
| Status | Can I rely on Chasum? |

---

## Allowed changes only

1. Bug fixes  
2. Broken responsive layouts  
3. Accessibility fixes  
4. Manual status updates (`lib/marketing/resources-status.ts`) when services change  
5. Product-owner-requested copy or claim updates  

**No additional visual polish** without an explicit product-owner request.

---

## Related

- Pricing: [`PRICING_PAGE_V1_LOCK.md`](./PRICING_PAGE_V1_LOCK.md)
- Summer Onboarding: [`SUMMER_ONBOARDING_V1_LOCK.md`](./SUMMER_ONBOARDING_V1_LOCK.md)
- Roadmap: [`ROADMAP_V1_LOCK.md`](./ROADMAP_V1_LOCK.md)

Agent rule: `.cursor/rules/resources-lock.mdc`
