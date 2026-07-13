# Chasum UI Guidelines

Design system reference for building consistent interfaces in Chasum.

---

## Design Principles

1. **Clean and calm** — generous whitespace, minimal chrome
2. **Mobile-first** — every screen works on 320px+ viewports
3. **Accessible by default** — keyboard, screen reader, and focus support
4. **Consistent rhythm** — shared spacing, typography, and component patterns
5. **Feedback always** — loading, empty, error, and success states on every interaction

---

## Typography & color

**Font:** Geist Sans (primary), Geist Mono (code)

**Brand marks:** The C (primary logo), The Spark (AI accent) — see `components/brand/marks.tsx`

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#f7f8fa` | Page background |
| `--foreground` | `#0c1222` | Primary text |
| `--card` | `#ffffff` | Card surfaces |
| `--primary` | `#1d4ed8` | Buttons, links, accents |
| `--spark` | `#0f766e` | AI / The Spark accent |
| `--muted` | `#eef1f6` | Subtle backgrounds |
| `--border` | `#e2e7ef` | Borders, dividers |
| `--destructive` | `#dc2626` | Errors, delete actions |
| `--success` | `#16a34a` | Success states |

### Dark Mode

Applied via `.dark` class on `<html>`. Primary shifts to `#3b82f6`; backgrounds to `#09090b`.

### Appointment Status Colors

| Status | Color |
|--------|-------|
| Pending | `#f59e0b` |
| Confirmed | `#2563eb` |
| Cancelled | `#ef4444` |
| Completed | `#22c55e` |
| No Show | `#71717a` |

Use `StatusBadge` from `components/ui/badge.tsx` — do not hardcode status colors in new code.

### Service & Staff Colors

Pick from predefined palettes in `lib/types/booking.ts`:

- `SERVICE_COLORS` — 8 options
- `STAFF_COLORS` — 8 options

Use the `ColorPicker` component for selection UI.

---

## Spacing & Layout

| Pattern | Value |
|---------|-------|
| Page padding | `px-4 py-5 md:px-6 md:py-7 lg:px-8` (via dashboard shell) |
| Section gap | `ds-page` (`space-y-8`) or `space-y-6` |
| Card grid gap | `gap-4` |
| Card padding | `p-5` to `p-6` |
| Form field gap | `space-y-2` (label + input), `space-y-4` (form sections) |
| Spacing tokens | `--space-1` … `--space-12` in `globals.css` |

### Dashboard Shell

- Fixed sidebar: `w-64`, hidden below `lg`
- Mobile drawer via `MobileSidebar`
- Top nav with hamburger on mobile
- Main content: `lg:pl-64`

### Responsive Breakpoints

Standard Tailwind defaults: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).

Common patterns:

- `flex-col sm:flex-row` — stack on mobile, row on desktop
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — responsive card grids
- `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` — stat cards

---

## Border Radius

| Element | Radius |
|---------|--------|
| Buttons, inputs | `rounded-xl` |
| Cards | `rounded-2xl` (via Card component) |
| Dialogs (desktop) | `rounded-2xl` |
| Dialogs (mobile) | `rounded-t-2xl` (bottom sheet) |
| Badges, tags | `rounded-full` or `rounded-lg` |
| Empty states | `rounded-2xl` |

---

## Components

### Page Structure

Every dashboard page follows:

```tsx
<div className="space-y-6">
  <PageHeader title="..." description="..." />
  {/* page content */}
</div>
```

Optional action buttons go in `PageHeader` `children`.

### Buttons

Use `Button` from `components/ui/button.tsx`.

| Variant | Usage |
|---------|-------|
| `primary` (default) | Primary actions, form submit |
| `outline` | Secondary actions, toolbar buttons |
| `ghost` | Tertiary, navigation |
| `secondary` | Alternative emphasis |

| Size | Usage |
|------|-------|
| `sm` | Inline actions, toolbar |
| `md` (default) | Standard buttons |
| `lg` | Hero CTAs, booking confirm |

For icon-only buttons, use `IconButton` with a required `label` prop for accessibility.

### Cards

```tsx
<Card className="border-border/60">
  <CardHeader>
    <CardTitle>...</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

Use `border-border/60` for subtle card borders throughout the app.

### Dialogs

Use `Dialog` from `components/ui/dialog.tsx`:

- Focus trap on open
- Escape to close
- Click overlay to close
- Bottom sheet on mobile, centered modal on `sm+`
- Form footer via `FormFooter` component

### Forms

| Component | Purpose |
|-----------|---------|
| `Label` + `Input` / `Select` / `Textarea` | Standard fields |
| `AlertMessage` | Inline error/success feedback |
| `FormFooter` | Cancel + submit button row |
| `ColorPicker` | Color radio group |
| `WorkingHoursGrid` | 7-day hours editor |

Form submission pattern:

```tsx
const [state, formAction, pending] = useActionState(action, {} as ActionState);
useFormAction(state, undefined, onClose);
```

### Empty States

Use `EmptyState` from `components/ui/page-header.tsx`:

```tsx
<EmptyState
  title="No items yet"
  description="Helpful context about what to do next."
/>
```

Every list/grid page must have an empty state. Nested empty states (inside cards) can use inline muted text instead.

### Loading States

| Component | Usage |
|-----------|---------|
| `DashboardSkeleton` | Dashboard route loading.tsx |
| `PageLoader` | Full-page loading (public booking) |
| `Spinner` | Inline loading indicator |
| Button `disabled` + label change | Form submission pending |

### Toasts

```tsx
const { toast } = useToast();
toast("Saved successfully.", "success");
toast("Something went wrong.", "error");
```

Use for delete confirmations results, calendar reschedule, and any action not tied to a visible form.

---

## Icons

**Library:** Lucide React (`lucide-react`)

- Size in buttons: `h-4 w-4`
- Size in inline text: `h-3.5 w-3.5`
- Always add `aria-hidden="true"` on decorative icons
- Never use an icon button without `aria-label`

---

## Accessibility Checklist

- [ ] All interactive elements are keyboard reachable
- [ ] Icon buttons have `aria-label`
- [ ] Form errors use `role="alert"`
- [ ] Success messages use `role="status"`
- [ ] Dialogs have `role="dialog"`, `aria-modal`, `aria-labelledby`
- [ ] Focus moves into dialog on open, trapped while open
- [ ] Color is not the only indicator of state (use text labels/badges)
- [ ] Inputs have associated `<Label htmlFor="...">`
- [ ] Search inputs have `aria-label` when no visible label

---

## Dark Mode

- Toggle via theme provider (stored in `localStorage`)
- Use semantic tokens (`bg-background`, `text-foreground`, `bg-card`) — never hardcode `#fff` or `#000`
- Test both modes when adding new components
- `ThemeScript` in `<head>` prevents flash of wrong theme

---

## Animation

Defined in `globals.css`:

- `fade-in-up` — entrance animation for marketing sections
- `animate-pulse` — skeleton loaders
- `animate-spin` — spinner
- Button press: `active:scale-[0.98]`
- Card hover: `transition-colors hover:border-primary/30`

Keep animations subtle. No animation on reduced-motion preference (future improvement).

---

## Do's and Don'ts

### Do

- Use shared components from `components/ui/`
- Use `router.refresh()` after mutations
- Show toast feedback on delete and async actions
- Match existing page layout patterns
- Use `EmptyState` on list pages

### Don't

- Use `window.location.reload()`
- Use `alert()` for user feedback
- Hardcode hex colors for status (use `StatusBadge`)
- Create one-off dialog implementations
- Skip loading/pending states on forms
- Add comments that merely restate what code does

---

## File Organization

```
components/
  ui/           ← Design system primitives (no business logic)
  forms/        ← Shared form blocks (WorkingHoursGrid, etc.)
  {feature}/    ← Feature-specific components (calendar/, staff/, etc.)
  dashboard/    ← Shell, sidebar, overview
  layout/       ← Marketing layout, theme script
hooks/          ← useFormAction, useRefresh
providers/      ← ThemeProvider, ToastProvider
```

New UI primitives go in `components/ui/`. Feature components compose primitives — they do not define new base styles.
