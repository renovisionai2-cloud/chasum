# Design System

Product UX standards. Implementation detail: [`../UI_GUIDELINES.md`](../UI_GUIDELINES.md).

## Principles

1. **Clean and calm** — generous whitespace, minimal chrome
2. **Mobile-first** — booking and dashboard usable on phones
3. **Accessible by default** — keyboard, screen reader, focus management
4. **Feedback always** — loading, empty, error, and success on every action

## Brand feel

- Professional but warm (health/wellness, family services)
- Trustworthy for medical-adjacent services (ultrasound)
- Not corporate-generic; room for per-business branding (Phase 5)

## Key flows

| Flow | UX priority |
|------|-------------|
| Public booking | Minimal steps; large tap targets; clear service descriptions |
| Dashboard calendar | At-a-glance day; fast create/edit appointment |
| Settings | Grouped cards; save feedback per section |
| Empty states | Actionable ("Add your first service") not dead ends |

## Components (shared)

- `SlotPicker` — date + available time chips (dashboard + public)
- `Dialog` — appointment create/edit, mobile bottom-sheet
- `StatusBadge` — appointment status colors
- Toast system — CRUD feedback

## Typography & color

- **Font:** Geist Sans
- **Primary:** Blue `#2563eb` (light) / `#3b82f6` (dark)
- **Status colors:** pending amber, confirmed blue, cancelled red, completed green

## GVM Baby World notes

When configuring their public page:

- Service names should match what clients expect (2D, 3D/4D, Gender Reveal, etc.)
- Consider service descriptions with duration and prep instructions
- Photo/logo upload deferred to custom branding phase
