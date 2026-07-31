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

## Route lock status

| Route | Status | State | Visual source of truth |
|-------|--------|-------|------------------------|
| `/private-alpha` | ✅ APPROVED · COMPLETE | **Locked** | https://chasum-3lygrcwi7-renovisionappcom.vercel.app/private-alpha |
| `/security` | ✅ APPROVED · COMPLETE | **Locked** | https://chasum-6vr9wmadu-renovisionappcom.vercel.app/security |
| `/status` | ✅ APPROVED | **Locked** | https://chasum-2qwiq9hxp-renovisionappcom.vercel.app/status |

Why Private Alpha detail lock: [`WHY_PRIVATE_ALPHA_V1_LOCK.md`](./WHY_PRIVATE_ALPHA_V1_LOCK.md)  
Security detail lock: [`SECURITY_V1_LOCK.md`](./SECURITY_V1_LOCK.md)

---

## Implementation sources

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

The full Resources experience — Why Private Alpha, Security, and System Status — including hero copy, sections, cards, journey, status badges, layout, spacing, typography, icons, colors, animations, and responsive behavior.

Do **not** redesign or polish unless the product owner explicitly requests it, or status facts require an honest update.

### Page questions (do not dilute)

| Page | Question |
|------|----------|
| Why Private Alpha | Why should I join Chasum now? |
| Security | Can I trust Chasum with my business? |
| Status | Can I rely on Chasum? |

---

## Allowed changes only

1. Bug fixes  
2. Accessibility improvements  
3. Responsive / mobile improvements  
4. Performance improvements  
5. Minor wording corrections  
6. Manual status updates (`lib/marketing/resources-status.ts`) when services change  

**No redesigns or visual polish** without an explicit product-owner request.

---

## Related

- Why Private Alpha: [`WHY_PRIVATE_ALPHA_V1_LOCK.md`](./WHY_PRIVATE_ALPHA_V1_LOCK.md)
- Pricing: [`PRICING_PAGE_V1_LOCK.md`](./PRICING_PAGE_V1_LOCK.md)
- Summer Onboarding: [`SUMMER_ONBOARDING_V1_LOCK.md`](./SUMMER_ONBOARDING_V1_LOCK.md)
- Roadmap: [`ROADMAP_V1_LOCK.md`](./ROADMAP_V1_LOCK.md)

Agent rule: `.cursor/rules/resources-lock.mdc`
