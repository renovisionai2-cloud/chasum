# Roadmap v1 — LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED |
| **PAGE** | Roadmap (`/roadmap`) |
| **VERSION** | Roadmap **v1** |
| **STATE** | **Locked** |
| **Approved** | 2026-07-30 |
| **Approved by** | Product Owner |

---

## Visual source of truth

Treat the latest approved Preview for `/roadmap` as the visual reference once recorded after the Roadmap v1 polish deploy. Implementation sources:

- `lib/marketing/roadmap.ts`
- `components/landing/roadmap-experience.tsx`
- `app/(marketing)/roadmap/page.tsx`

---

## What is locked

The public Roadmap experience — hero, **Available in Chasum Today**, **Coming Soon**, **Future Vision**, **Built With Our Customers**, card copy, layout, spacing, typography, icons, colors, animations, and responsive behavior — is the **approved baseline**.

Do **not** redesign or polish unless the product owner explicitly requests it, or product changes require claim updates (especially to stay aligned with Pricing).

### Consistency rule

Roadmap **Available in Chasum Today** must stay consistent with approved Pricing inclusions. Features included on Professional (and above) such as **Business Calls & Texting** and **SMS Reminders** belong in Available Today—not Coming Soon.

**AI Phone Calls** (Voice AI) remains Coming Soon / Future direction and must not be confused with Business Calls & Texting.

---

## Allowed changes only

1. Bug fixes  
2. Broken responsive layouts  
3. Accessibility fixes  
4. Product changes **explicitly requested by the product owner**  
5. Claim updates required to stay aligned with Pricing / Product Truth when the product owner directs  

**No additional visual polish** without an explicit product-owner request.

---

## Related

- Pricing locked: [`PRICING_PAGE_V1_LOCK.md`](./PRICING_PAGE_V1_LOCK.md)
- Summer Onboarding locked: [`SUMMER_ONBOARDING_V1_LOCK.md`](./SUMMER_ONBOARDING_V1_LOCK.md)

Agent rule: `.cursor/rules/roadmap-lock.mdc`
