# Summer Onboarding v1 — LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED |
| **SCREEN** | Summer onboarding experience (Meet Summer guided discovery + consultation) |
| **ROUTE** | `/meet-summer` |
| **VERSION** | Summer Onboarding **v1** |
| **STATE** | **Locked** |
| **Approved** | 2026-07-30 |
| **Approved by** | Product Owner |

---

## What is locked

The Summer onboarding experience on `/meet-summer` — including category selection, consultation heading/subheading, challenge prompts, chips, Business Memory / “What I've Learned” panel chrome, layout, spacing, typography, icons, colors, animations, and responsive behavior — is the **approved baseline**.

Do **not** redesign or polish unless the product owner explicitly requests it.

Canonical copy sources:

- `lib/marketing/flagship-summer.ts` (`FS_AWAKENING`, `FS_GUIDED`, consultation helpers)
- Consultation challenge field: `lib/website-concierge/discovery/fields.ts` (`challenges`)
- UI: `components/marketing/flagship-summer/*`

### Approved consultation subheading (v1)

> I'd like to understand your business so I can personalize Chasum for you.

### Approved category helper (v1)

> Choose one or more categories. You can always update them later.

---

## Allowed changes only

1. Bug fixes  
2. Broken responsive layouts  
3. Accessibility fixes  
4. Product changes **explicitly requested by the product owner**  
5. Deferred TODOs (dynamic category acknowledgments; consultation typing sequence) — only when the product owner asks to implement them  

**No additional visual polish** without an explicit product-owner request.

---

## Related

- Pricing remains separately locked: [`PRICING_PAGE_V1_LOCK.md`](./PRICING_PAGE_V1_LOCK.md).

Agent rule: `.cursor/rules/summer-onboarding-lock.mdc`
