# Summer Onboarding v1 — LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED |
| **SCREEN** | Summer onboarding (Meet Summer guided discovery) |
| **ROUTE** | `/meet-summer` (category selection / guided intro) |
| **VERSION** | Summer Onboarding **v1** |
| **STATE** | **Locked** |
| **Approved** | 2026-07-30 |
| **Visual source of truth** | https://chasum-7o8esta4x-renovisionappcom.vercel.app/meet-summer |

---

## What is locked

The Summer onboarding introduction and category-selection screen — including layout, spacing, typography, icons, category cards, colors, animations, responsive behavior, and approved copy — must not be redesigned or polished unless the product owner explicitly requests it.

Canonical copy source: `lib/marketing/flagship-summer.ts` (`FS_AWAKENING`, `FS_GUIDED`).

### Approved helper line (v1)

> Choose one or more categories. You can always update them later.

---

## Allowed changes only

1. Bug fixes  
2. Broken responsive layouts  
3. Accessibility fixes  
4. Product changes **explicitly requested by the product owner**  
5. The deferred dynamic category-response enhancement noted in `FS_GUIDED` TODO — only when the product owner asks to implement it  

**No additional visual polish** without an explicit product-owner request.

---

## Related (not locked by this document alone)

- Full Meet Summer flagship experience beyond this onboarding screen may still receive product-owner-directed updates.  
- Pricing remains separately locked: [`PRICING_PAGE_V1_LOCK.md`](./PRICING_PAGE_V1_LOCK.md).

Agent rule: `.cursor/rules/summer-onboarding-lock.mdc`
