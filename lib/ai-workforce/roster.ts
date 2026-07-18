import type { AiActivityItem, AiEmployee } from "@/lib/ai-workforce/types";

/**
 * Canonical Sprint 4 AI Workforce roster.
 * Placeholder intelligence only — no live model calls.
 * Aligns with product principles in docs/product/20_AI_WORKFORCE.md
 * (named roles, owner control, no invented business data).
 */
export const AI_EMPLOYEES: AiEmployee[] = [
  {
    id: "summer",
    slug: "summer",
    name: "Summer",
    role: "AI Receptionist",
    shortRole: "Receptionist",
    status: "online",
    tasksCompletedToday: 0,
    summary:
      "Digital front desk. Books, reschedules, and cancels through the Booking Engine, answers from live business data, and escalates when a human is needed — never invents times or prices.",
    responsibilities: [
      "Book, reschedule, and cancel via Booking Engine",
      "Preview openings via Availability Engine only",
      "Answer hours, services, employees, locations, and policies",
      "Recognize returning guests from CRM",
      "Escalate when availability, policy, or a human is required",
    ],
    futureCapabilities: [
      "Multi-channel SMS and voice reception",
      "Prior conversation memory across visits",
      "Soft qualification using configured rules only",
    ],
    metrics: [
      {
        label: "Reception workspace",
        value: "Live",
        hint: "/dashboard/ai-workforce/summer",
      },
      {
        label: "Booking channel",
        value: "summer",
        hint: "Booking Engine adapter",
      },
      {
        label: "Escalations",
        value: "Ready",
        hint: "CRM follow-ups + communication log",
      },
    ],
    accent: "primary",
  },
  {
    id: "emma",
    slug: "emma",
    name: "Emma",
    role: "AI Receptionist (legacy)",
    shortRole: "Receptionist",
    status: "online",
    tasksCompletedToday: 0,
    summary:
      "Legacy name for Summer. Use the Summer reception workspace for production booking flows.",
    responsibilities: [
      "Redirects to Summer reception workspace",
      "Shares conversation history tables with Summer",
    ],
    futureCapabilities: [],
    metrics: [
      {
        label: "Alias",
        value: "Summer",
        hint: "Prefer /ai-workforce/summer",
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
    id: "chase",
    slug: "chase",
    name: "Chase",
    role: "AI Operations Manager",
    shortRole: "Operations",
    status: "online",
    tasksCompletedToday: 0,
    summary:
      "Sits beside the owner. Monitors performance, utilization, retention, and capacity — recommends actions, never changes data automatically.",
    responsibilities: [
      "Surface KPIs from Booking Engine, CRM, and Reports",
      "Prioritize insights (high / medium / low)",
      "Alert on closures, low capacity, and cancellation risk",
      "Include Summer operational events in daily summaries",
      "Reserve forecasting hooks without inventing predictions",
    ],
    futureCapabilities: [
      "Revenue and capacity forecasting providers",
      "Seasonal demand models",
      "Live booking-event subscriptions",
    ],
    metrics: [
      {
        label: "Ops workspace",
        value: "Live",
        hint: "/dashboard/workforce/chase",
      },
      {
        label: "Mutations",
        value: "None",
        hint: "Recommend only",
      },
      {
        label: "Forecasting",
        value: "Hooks",
        hint: "Models not enabled",
      },
    ],
    accent: "spark",
  },
  {
    id: "noah",
    slug: "noah",
    name: "Noah",
    role: "AI Operations Manager (legacy)",
    shortRole: "Operations",
    status: "idle",
    tasksCompletedToday: 0,
    summary:
      "Legacy name for Chase. Use the Chase operations workspace for production analytics.",
    responsibilities: ["Redirects to Chase operations workspace"],
    futureCapabilities: [],
    metrics: [
      {
        label: "Alias",
        value: "Chase",
        hint: "Prefer /workforce/chase",
      },
    ],
    accent: "spark",
  },
];

/** Preview activity for UI architecture — not live business events. */
export const AI_ACTIVITY_PREVIEW: AiActivityItem[] = [
  {
    id: "act-1",
    employeeId: "chase",
    kind: "system",
    title: "Chase operations workspace live",
    description:
      "Chase aggregates utilization, CRM, reports, and Summer change-log activity — never invents metrics.",
    createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    preview: true,
  },
  {
    id: "act-2",
    employeeId: "summer",
    kind: "recommendation",
    title: "Summer reception workspace live",
    description:
      "Summer books through the Booking Engine and answers only from configured business data.",
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
