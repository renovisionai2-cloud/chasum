# Roadmap — current-generation product truth

| Field | Value |
|-------|--------|
| **STATUS** | Current-generation implementation · **pending PO visual review** |
| **PAGE** | Roadmap (`/roadmap`) |
| **VERSION** | Four-stage product-truth model |
| **STATE** | Not visually locked. Do not treat as Production. |
| **Stage model approved** | 2026-08-27 |
| **Approved by** | Product Owner (stage model and product-truth map) |
| **Branch** | `cursor/marketing-os-positioning` |

Roadmap **v1** (Available in Chasum Today / Coming Soon / Future Vision) is **superseded**. Do not restore that three-stage model.

This file is **not** a visual lock. Visual lock happens only after PO rendered review.

---

## Public stage model

1. **Available in Private Alpha** — usable with design partners today; still improving. Not public GA.
2. **In Development** — work materially underway now.
3. **Coming Next** — approved near-term after current stability work. No public dates.
4. **Future Direction** — longer-term expansion. Direction, not a delivery promise.

Promote items by changing `status` on `ROADMAP_ITEMS` in `lib/marketing/roadmap.ts`:

`future_direction` → `coming_next` → `in_development` → `private_alpha`

---

## Implementation sources

- `lib/marketing/roadmap.ts`
- `components/landing/roadmap-experience.tsx`
- `app/(marketing)/roadmap/page.tsx`

---

## Consistency

Follow current product truth. Do **not** silently reproduce stale Pricing claims (Inventory as a built product; “Online Payments” as broadly available card collection). Pricing is audited separately.

Memberships & Packages remain Available in Private Alpha to stay consistent with locked Industries.

AI Phone Calls must not be confused with Customer Communications.

---

## Allowed changes only (after PO visual lock)

Until PO visually locks this generation, product-truth and responsive fixes requested by the PO are allowed on `/roadmap` only.

After lock, allow only:

1. Bug fixes
2. Broken responsive layouts
3. Accessibility fixes
4. Product changes **explicitly requested by the product owner**
5. Claim updates required to stay aligned with Product Truth when the product owner directs

Do **not** edit locked Homepage, Platform, Meet Summer, Product Tour, Industries, or Pricing as part of Roadmap work.

Agent rule: `.cursor/rules/roadmap-lock.mdc`
