# World Class Plan Entitlement Matrix

**Chapter:** 0  
**Claim source:** `lib/marketing/pricing.ts` (`PRICING_PLANS`) + Pricing lock  
**Runtime gates:** `lib/billing/plan-features.ts`, location quota RPC, SMS compose/queue, email branding  
**Private Alpha:** `private_alpha_enabled` elevates SMS + branding helpers toward Professional while billed key may stay starter  

---

## Plan snapshot (marketing)

| Plan | Staff claim | Locations claim | Highlights |
|------|-------------|-----------------|------------|
| Free (`starter`) | 1 | 1 | Booking, calendar, email, CRM; Chasum branding; no SMS |
| Professional | ≤3 | ≤3 | SMS, Summer, online payments, gift cards, remove branding, reporting |
| Business | Unlimited | **6** (marketing) | Analytics, API, inventory, priority support |
| Enterprise | Unlimited | Unlimited | White-glove / partnership services |

**DB catalog note:** Business `max_locations` in billing catalog / seeds is **10**, not 6 — mismatch.

---

## Entitlement validation matrix

| Plan | Feature | Claimed | UI gate | Server gate | Notes | Risk | Chapter |
|------|---------|---------|---------|-------------|-------|------|---------|
| Free | Online booking / calendar / email / CRM | Yes | — | — | Present | Low | — |
| Free | SMS | No | Compose blocked | `planIncludesSms` | Enforced | Low | — |
| Free | Staff = 1 | Yes | **None** | **None** (`createStaff` uncapped) | **Gap** | High | 8,13 |
| Free | Locations = 1 | Yes | Upgrade / dialog | `can_add_location` | Enforced | Low | — |
| Free | Chasum branding | Yes | Copy | `planAllowsRemoveBranding` false | Enforced on email | Low | — |
| Free | Payments / gift cards / Summer / reports | Excluded in comparison | **None** | **None** | **Gap** if Free tenant can open | High | 6,12,13 |
| Free | Remove branding | No | Informational | Server false | OK | Low | — |
| Pro | SMS + messaging | Yes | Allowed if Twilio | `planIncludesSms` | Config-dependent | Med | 7 |
| Pro | Staff ≤ 3 | Yes | **None** | **None** | **Gap** | High | 8,13 |
| Pro | Locations ≤ 3 | Yes | Quota UI | DB max 3 | Aligned | Low | — |
| Pro | Summer | Yes | No hard lock | No plan gate | Early Access product | Med | 12 |
| Pro | Online payments | Yes | No plan lock | No plan gate | Manual Available; card Coming Next | Critical claim | 6,13 |
| Pro | Gift cards | Yes | No plan lock | No plan gate | Operator hub works | Med | 11 |
| Pro | Remove branding | Yes | — | `planAllowsRemoveBranding` | OK | Low | — |
| Pro | Business Calls & Texting | Yes | — | Soft | Not hosted PBX | High claim | 7,13 |
| Business | Unlimited staff | Yes | — | — | Ungated; no staff login | High | 8 |
| Business | Locations ≤ 6 | Yes | Quota uses DB | DB **10** | **Claim vs catalog mismatch** | High | 9,13 |
| Business | Advanced analytics | Yes | — | — | Reports exist; “advanced” undefined | Med | 10 |
| Business | Inventory | Yes | Placeholder report | None | **Not real** | Critical | 10,13 |
| Business | API & integrations | Yes | Developer always visible | Not Business-gated | Gap | Med | 9,13 |
| Enterprise | Unlimited locations | Yes | — | null max | OK | Low | — |
| Enterprise | Custom permissions / security program | Partnership | — | Partial roles | Coming Next RBAC login | High | 8,13 |
| All | Private Alpha override | — | Elevates SMS/branding | Flag | Preserves plan key | — | — |

---

## Enforcement map

| Mechanism | Path |
|-----------|------|
| Feature helpers | `lib/billing/plan-features.ts` |
| Billing catalog | `lib/billing/catalog.ts` |
| Marketing claims | `lib/marketing/pricing.ts` |
| Location create | `lib/actions/location.ts` + RPC |
| SMS | `lib/actions/communications.ts`, queue, booking-delivery |
| Email branding | `lib/communications/tenant-email-branding.ts` |

---

## Chapter 0 conclusions

1. **Do not enforce new plan limits in DB without PO approval** (shared Supabase).  
2. Document and prioritize: staff caps, Free feature exposure, Business location 6 vs 10, Inventory claim, payment wording.  
3. UI-only gates are insufficient for money/comms — keep and extend **server** checks where architecture already supports them.  
4. No entitlement code changes in Chapter 0.  
