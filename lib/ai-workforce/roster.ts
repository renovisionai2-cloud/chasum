import type { AiActivityItem, AiEmployee } from "@/lib/ai-workforce/types";

/**
 * Canonical Sprint 4 AI Workforce roster.
 * Placeholder intelligence only — no live model calls.
 * Aligns with product principles in docs/product/20_AI_WORKFORCE.md
 * (named roles, owner control, no invented business data).
 */
export const AI_EMPLOYEES: AiEmployee[] = [
  {
    id: "emma",
    slug: "emma",
    name: "Emma",
    role: "AI Receptionist",
    shortRole: "Receptionist",
    status: "online",
    tasksCompletedToday: 0,
    summary:
      "Always-on front desk. Greets clients, answers configured FAQs, and routes people into booking — without inventing answers.",
    responsibilities: [
      "Respond to booking-page inquiries with approved FAQs",
      "Capture client intent and contact details",
      "Guide visitors into public booking or waitlist",
      "Escalate edge cases to your human team",
    ],
    futureCapabilities: [
      "Multi-channel chat and SMS reception",
      "Location-aware answers for multi-site businesses",
      "Soft qualification using your configured rules only",
    ],
    metrics: [
      {
        label: "Inquiries handled",
        value: "Live",
        hint: "Phase 1 console + Command Center",
      },
      {
        label: "Booking assists",
        value: "Ready",
        hint: "Routes to public booking + real slots",
      },
      {
        label: "Escalations",
        value: "Ready",
        hint: "CRM log + Communication follow-ups",
      },
    ],
    accent: "primary",
  },
  {
    id: "alex",
    slug: "alex",
    name: "Alex",
    role: "AI Scheduler",
    shortRole: "Scheduler",
    status: "idle",
    tasksCompletedToday: 0,
    summary:
      "Protects the calendar. Proposes real availability from Chasum’s scheduling engine — never invented openings.",
    responsibilities: [
      "Propose available times from live slots",
      "Respect buffers, staff capacity, and location hours",
      "Suggest waitlist fills when cancellations free capacity",
      "Flag schedule risk for owner review",
    ],
    futureCapabilities: [
      "Natural-language booking for owners",
      "Smart reschedule proposals",
      "Multi-location load balancing",
    ],
    metrics: [
      { label: "Slots proposed", value: "—", hint: "Uses get_available_slots" },
      { label: "Waitlist fills", value: "—", hint: "Awaiting activation" },
      { label: "Conflicts prevented", value: "—", hint: "Engine-enforced" },
    ],
    accent: "spark",
  },
  {
    id: "maya",
    slug: "maya",
    name: "Maya",
    role: "AI Marketing Manager",
    shortRole: "Marketing",
    status: "idle",
    tasksCompletedToday: 0,
    summary:
      "Helps fill the funnel ethically — drafts outreach tied to your real services, always awaiting your approval before send.",
    responsibilities: [
      "Suggest post-visit and seasonal follow-ups",
      "Draft message copy for owner approval",
      "Identify underbooked windows worth promoting",
      "Track which approved outreach correlates with bookings",
    ],
    futureCapabilities: [
      "Review-request workflows after completed visits",
      "Segmented offers for first-time vs returning clients",
      "Multi-location campaign variants",
    ],
    metrics: [
      { label: "Drafts ready", value: "—", hint: "Owner approval required" },
      { label: "Campaigns sent", value: "—", hint: "Awaiting activation" },
      { label: "Quiet slots filled", value: "—", hint: "When live" },
    ],
    accent: "warning",
  },
  {
    id: "leo",
    slug: "leo",
    name: "Leo",
    role: "AI Business Advisor",
    shortRole: "Advisor",
    status: "online",
    tasksCompletedToday: 0,
    summary:
      "Turns Chasum activity into clear guidance: what happened, why it matters, and what to do next.",
    responsibilities: [
      "Summarize appointments, revenue, and no-shows",
      "Highlight anomalies with plain-language explanations",
      "Recommend a short prioritized action list",
      "Ground every recommendation in your business data",
    ],
    futureCapabilities: [
      "Goal tracking against your north-star metric",
      "Location and staff comparisons",
      "Scenario planning from historical patterns",
    ],
    metrics: [
      { label: "Insights ready", value: "—", hint: "Awaiting activation" },
      { label: "Actions accepted", value: "—", hint: "Owner in control" },
      { label: "Weekly briefings", value: "—", hint: "Coming soon" },
    ],
    accent: "success",
  },
  {
    id: "sophia",
    slug: "sophia",
    name: "Sophia",
    role: "AI Customer Success",
    shortRole: "Success",
    status: "idle",
    tasksCompletedToday: 0,
    summary:
      "Makes every booked visit feel cared for — confirmations, reminders, and prep from your real service data.",
    responsibilities: [
      "Send confirmations and reminders through configured channels",
      "Attach service-specific preparation instructions",
      "Handle reschedule intents within your policies",
      "Flag clients who may need a human touch",
    ],
    futureCapabilities: [
      "Personalized reminder timing from show history",
      "Pre-visit intake collection",
      "Post-visit satisfaction check-ins",
    ],
    metrics: [
      { label: "Reminders queued", value: "—", hint: "Uses notification stack" },
      { label: "No-show impact", value: "—", hint: "Measured when live" },
      { label: "Policy escalations", value: "—", hint: "Owner control" },
    ],
    accent: "primary",
  },
  {
    id: "noah",
    slug: "noah",
    name: "Noah",
    role: "AI Operations Manager",
    shortRole: "Operations",
    status: "idle",
    tasksCompletedToday: 0,
    summary:
      "Keeps day-of operations tidy — runbooks, readiness checks, and cross-employee coordination as the workforce matures.",
    responsibilities: [
      "Surface day-of operational checklists",
      "Coordinate handoffs between AI employees",
      "Flag configuration gaps that block automation",
      "Keep an audit-friendly trail of workforce actions",
    ],
    futureCapabilities: [
      "Room and equipment readiness (industry packs)",
      "Franchise / multi-site ops standards",
      "Autonomous ops within owner-approved policies",
    ],
    metrics: [
      { label: "Handoffs", value: "—", hint: "Collaboration layer" },
      { label: "Gaps flagged", value: "—", hint: "Awaiting activation" },
      { label: "Runbooks ready", value: "—", hint: "Coming soon" },
    ],
    accent: "spark",
  },
];

/** Preview activity for UI architecture — not live business events. */
export const AI_ACTIVITY_PREVIEW: AiActivityItem[] = [
  {
    id: "act-1",
    employeeId: "noah",
    kind: "system",
    title: "AI Workforce module ready",
    description:
      "Your AI employees are configured and waiting for activation. No client data was invented.",
    createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    preview: true,
  },
  {
    id: "act-2",
    employeeId: "emma",
    kind: "recommendation",
    title: "Reception FAQ draft available",
    description:
      "Emma can answer from your Settings policies once FAQs are published. Review before going live.",
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    preview: true,
  },
  {
    id: "act-3",
    employeeId: "alex",
    kind: "insight",
    title: "Scheduler connected to availability engine",
    description:
      "Alex will only propose times from get_available_slots — never invented openings.",
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    preview: true,
  },
  {
    id: "act-4",
    employeeId: "leo",
    kind: "insight",
    title: "Advisor briefing template prepared",
    description:
      "Leo will summarize real appointments, revenue, and no-shows when weekly briefs activate.",
    createdAt: new Date(Date.now() - 5 * 60 * 60_000).toISOString(),
    preview: true,
  },
  {
    id: "act-5",
    employeeId: "sophia",
    kind: "automation",
    title: "Reminder workflow mapped",
    description:
      "Sophia will use your service preparation instructions and notification channels when enabled.",
    createdAt: new Date(Date.now() - 26 * 60 * 60_000).toISOString(),
    preview: true,
  },
  {
    id: "act-6",
    employeeId: "maya",
    kind: "handoff",
    title: "Marketing awaits owner approval",
    description:
      "Maya drafts only. Sends stay off until you approve — owners remain in control.",
    createdAt: new Date(Date.now() - 30 * 60 * 60_000).toISOString(),
    preview: true,
  },
];

export function getAiEmployee(slug: string): AiEmployee | undefined {
  return AI_EMPLOYEES.find((e) => e.slug === slug);
}

export function getEmployeeActivity(employeeId: string): AiActivityItem[] {
  return AI_ACTIVITY_PREVIEW.filter((a) => a.employeeId === employeeId);
}
