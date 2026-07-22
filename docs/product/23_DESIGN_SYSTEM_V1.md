# Chasum Design System v1

**Status:** Canonical UI contract for the AI Business Operating System  
**Parent:** [`COMPANY_MEMORY.md`](../../COMPANY_MEMORY.md)  
**Implementation:** `app/globals.css`, `components/ui/*`  
**Related:** [`07_DESIGN_SYSTEM.md`](./07_DESIGN_SYSTEM.md), [`../UI_GUIDELINES.md`](../UI_GUIDELINES.md), [`18_UX_PRINCIPLES.md`](./18_UX_PRINCIPLES.md)

This is the visual and interaction foundation every future page must follow.  
**Do not invent parallel patterns.** Extend these primitives.

---

## North star

Competitors ship features. Chasum wins on **experience**.

When an owner opens Chasum, the first impression should be:

> This feels like the future of business software.

Beautiful. Simple. Fast. Premium. Consistent.

Inspired by the craft bar of Stripe, Linear, Notion, and Apple HIG — not by cloning their UI.

---

## Principles

1. **One language** — same radius, type, motion, and feedback everywhere.
2. **Clarity over chrome** — what matters today, what needs attention, what to do next.
3. **Extend, don’t redesign** — evolve tokens and primitives; avoid one-off page styles.
4. **Empty states onboard** — never “No data.” Always a next step.
5. **Always feel responsive** — skeletons, transitions, and honest loading.
6. **Accessible by default** — focus rings, contrast, touch targets ≥ 40px, ARIA.
7. **Brand first on customer surfaces** — invoices, receipts, certificates, booking, email.

Operation GVM remains Priority #1 — polish must not regress validated workflows.

---

## Tokens

Defined in `app/globals.css`:

| Category | Tokens |
|----------|--------|
| Surfaces | `--background`, `--foreground`, `--card`, `--muted`, `--border` |
| Brand | `--primary` (blue), `--spark` (AI accent only) |
| Status | `--destructive`, `--success`, `--warning` |
| Elevation | `--shadow-xs` → `--shadow-lg` |
| Radius | `--radius-sm` / `--md` / `--lg` / `--xl` |
| Space | `--space-1` … `--space-12` (4px base) |
| Motion | `--ease-out`, `--duration-fast`, `--duration-normal` |

Utilities: `.ds-page`, `.ds-section-title`, `.ds-label`, `.ds-form-stack`, `.ds-field`, `.ds-table-scroll`, `.ds-safe-pad`, `.ds-focus-ring`, `.ds-nav-item*`, `.ds-card-interactive`.

---

## Typography

| Role | Style |
|------|--------|
| Page title | `text-2xl` / `md:text-[1.75rem]` semibold, tight tracking (`PageHeader`) |
| Section | `.ds-section-title` / `CardTitle` |
| KPI label | `.ds-label` uppercase tracked |
| Body | `text-sm` product · `text-base`+ marketing |
| Money | tabular nums via `Money` / `formatMoneyCents` |

Font: Geist Sans (UI), Geist Mono (codes).

---

## Component catalog

| Primitive | Path | Notes |
|-----------|------|--------|
| Button | `button.tsx` | `primary` `secondary` `outline` `ghost` `spark` `destructive` · touch-safe heights |
| Icon button | `icon-button.tsx` | Compact actions |
| Input / Select / Textarea | `input` `select` `textarea` | Shared focus ring · `aria-invalid` |
| Field | `field.tsx` | Label + hint + error composition |
| Label | `label.tsx` | |
| Checkbox | `checkbox.tsx` | |
| Card / StatCard | `card` `stat-card` | Interactive hover via `.ds-card-interactive` |
| Table | `table.tsx` | Horizontal scroll on narrow viewports |
| Dialog / Sheet | `dialog` `sheet` | Safe-area · focus trap · Escape |
| Tabs | `tabs.tsx` | |
| Badge / StatusBadge | `badge.tsx` | Appointment statuses |
| Alert / AlertMessage | `alert` `form-feedback` | Error + success |
| FormFooter | `form-feedback.tsx` | Pending + `aria-busy` |
| EmptyState | `empty-state.tsx` | `page` `panel` `inline` + CTA |
| Loading | `loading.tsx` | Spinner, Skeleton, PageLoader, Dashboard / Form / Table skeletons |
| PageHeader | `page-header.tsx` | Title, description, actions, optional eyebrow |
| Money | `money.tsx` | Business currency |
| Charts | `chart.tsx` | |

---

## Forms

Use `.ds-form-stack` for vertical rhythm.

```tsx
<Field label="Phone" htmlFor="phone" hint="Optional — used for SMS reminders">
  <Input id="phone" name="phone" />
</Field>
```

Rules:

- Label always visible (not placeholder-only).
- Hint for non-obvious fields; errors via `AlertMessage` or `Field` error.
- Submit uses `FormFooter` so pending state is consistent.
- Keyboard: logical tab order; dialogs trap focus.

---

## Empty states

Prefer guidance + one primary CTA:

| Bad | Good |
|-----|------|
| “No data.” | “Let’s add your first service.” |
| “Empty” | “Book your first appointment.” |
| “None” | “Create your first gift card.” |

Variants: `page` (module), `panel` (card), `inline` (nested).

---

## Loading

| Situation | Pattern |
|-----------|---------|
| Full route | `PageLoader` / `loading.tsx` |
| Dashboard | `DashboardSkeleton` |
| Forms / settings | `FormSkeleton` |
| Tables / lists | `TableSkeleton` / `ListSkeleton` |
| Buttons | `FormFooter` pending label + disabled |

Prefer skeletons over blank flashes. Honor `prefers-reduced-motion`.

---

## Customer-facing brand

Invoices, receipts, gift certificates, booking pages, and emails inherit:

- Business name, logo, brand/accent colors, currency, contact lines

Never ship technical config strings to customers (e.g. raw API key names).

---

## Mobile & accessibility

- Touch targets: controls ≥ 40–44px (`.touch-manipulation` on buttons).
- Dialogs: bottom sheet on small screens; safe-area padding.
- Tables: `.ds-table-scroll` / overflow-x on wrapper.
- Focus: visible ring (`ds-focus-ring` / `focus-visible:ring-2`).
- Contrast: use status tokens; avoid gray-on-gray body text.
- Icons in buttons: `aria-hidden` when text label present; icon-only needs `aria-label`.

---

## Motion

Use existing utilities:

- `animate-fade-in-up` for page sections / stat cards
- `animate-spark-pulse` for AI affordances only
- Short hover transitions on cards and buttons (`duration-200`)

Motion clarifies hierarchy — never decoration for its own sake.

---

## Checklist for new UI

- [ ] Uses existing `components/ui` primitives
- [ ] Empty / loading / error / success covered
- [ ] Money via `Money` or `formatMoneyCents`
- [ ] Works at 320px+, tablet, and desktop
- [ ] Focus rings and labels present
- [ ] No parallel one-off design language

---

*Premium Experience Sprint 1 — Design System v1.*
