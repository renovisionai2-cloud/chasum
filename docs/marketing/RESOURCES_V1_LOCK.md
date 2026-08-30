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
| `/private-alpha` | ✅ **APPROVED / LOCKED** · Why Private Alpha PO lock · 2026-08-27 | **Locked** | Branch `cursor/marketing-os-positioning` @ `0afaf3829e00063407eabb9a2d955403527ff754` — **not Production**. Canonical: [`WHY_PRIVATE_ALPHA_V1_LOCK.md`](./WHY_PRIVATE_ALPHA_V1_LOCK.md). July 2026 Preview `10a9e53` is **superseded**. |
| `/security` | ✅ **APPROVED / LOCKED** · Security PO lock · 2026-08-30 | **Locked** | Branch `cursor/marketing-os-positioning` @ `8a4be655edd74c5cd7875d68acf93b476ac553fe` — **not Production**. Canonical: [`SECURITY_V1_LOCK.md`](./SECURITY_V1_LOCK.md). July 2026 Preview `4013db0` is **superseded**. |
| `/status` | ✅ **APPROVED / LOCKED** · Status PO lock · 2026-08-30 | **Locked** | Branch `cursor/marketing-os-positioning` @ `c855324caa0a973326018ab703254d4f8305fc0e` — **not Production**. Canonical: [`STATUS_V1_LOCK.md`](./STATUS_V1_LOCK.md). July 2026 Preview is **superseded**. |

Why Private Alpha detail lock: [`WHY_PRIVATE_ALPHA_V1_LOCK.md`](./WHY_PRIVATE_ALPHA_V1_LOCK.md)  
Security detail lock: [`SECURITY_V1_LOCK.md`](./SECURITY_V1_LOCK.md)  
Status detail lock: [`STATUS_V1_LOCK.md`](./STATUS_V1_LOCK.md)

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

**Status** is locked at the 2026-08-30 current-generation PO lock (`c855324caa0a973326018ab703254d4f8305fc0e`). The July 2026 Status Preview is **superseded**. **Security** is locked at the 2026-08-30 current-generation PO lock (`8a4be655edd74c5cd7875d68acf93b476ac553fe`). **Why Private Alpha** is locked at the 2026-08-27 current-generation PO lock (`0afaf3829e00063407eabb9a2d955403527ff754`). Do **not** restore the July 2026 Status, Security, or Why Private Alpha Previews as current product-truth. Full Status lock: [`STATUS_V1_LOCK.md`](./STATUS_V1_LOCK.md). Full Security lock: [`SECURITY_V1_LOCK.md`](./SECURITY_V1_LOCK.md). Full Why Private Alpha lock: [`WHY_PRIVATE_ALPHA_V1_LOCK.md`](./WHY_PRIVATE_ALPHA_V1_LOCK.md).

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
6. Genuine manual Status truth updates (`lib/marketing/resources-status.ts`) after reviewing rows, Known Issues, and planned maintenance — see [`STATUS_V1_LOCK.md`](./STATUS_V1_LOCK.md)

**No redesigns or visual polish** without an explicit product-owner request.

---

## Related

- Status: [`STATUS_V1_LOCK.md`](./STATUS_V1_LOCK.md)
- Why Private Alpha: [`WHY_PRIVATE_ALPHA_V1_LOCK.md`](./WHY_PRIVATE_ALPHA_V1_LOCK.md)
- Security: [`SECURITY_V1_LOCK.md`](./SECURITY_V1_LOCK.md)
- Apply: [`APPLY_V1_LOCK.md`](./APPLY_V1_LOCK.md)
- Contact: [`CONTACT_V1_LOCK.md`](./CONTACT_V1_LOCK.md)
- Pricing: [`PRICING_V1_LOCK.md`](./PRICING_V1_LOCK.md) (current). Historical July Pricing: [`PRICING_PAGE_V1_LOCK.md`](./PRICING_PAGE_V1_LOCK.md).
- Summer Onboarding: [`SUMMER_ONBOARDING_V1_LOCK.md`](./SUMMER_ONBOARDING_V1_LOCK.md)
- Roadmap: [`ROADMAP_V1_LOCK.md`](./ROADMAP_V1_LOCK.md)

Agent rule: `.cursor/rules/resources-lock.mdc`
