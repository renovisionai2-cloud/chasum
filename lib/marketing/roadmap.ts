/**
 * Public Roadmap — Product Truth aligned, benefit-first for business owners.
 * Status vocabulary stays on this page (not inside Pricing plan inclusions).
 */

export const ROADMAP_LAST_REVIEWED = "2026-07-30";

export const ROADMAP_EYEBROW = "Public roadmap";
export const ROADMAP_HEADLINE = "Built in the open. Evolving with design partners.";
export const ROADMAP_LEDE =
  "See what Chasum can do today, what we're refining with Private Alpha partners, and where the AI Business Operating System is headed next.";

export type RoadmapPhaseId =
  | "completed"
  | "in_progress"
  | "upcoming"
  | "future";

export type RoadmapPhase = {
  id: RoadmapPhaseId;
  title: string;
  badge: string;
  summary: string;
  /** Product Truth status label shown quietly */
  truthLabel: string;
  items: readonly { title: string; detail: string }[];
};

/**
 * Phases map to Product Truth:
 * Completed → Available Today
 * In Progress → Early Access
 * Upcoming → Coming Next
 * Future Vision → Future Vision
 */
export const ROADMAP_PHASES: readonly RoadmapPhase[] = [
  {
    id: "completed",
    title: "Completed",
    badge: "Available now",
    truthLabel: "Available Today",
    summary:
      "Foundations design partners use every day to run appointments, customers, and the front desk.",
    items: [
      {
        title: "One calendar for the whole day",
        detail:
          "Day View and Booking Sheet keep your front desk organized without juggling spreadsheets.",
      },
      {
        title: "Online booking with real openings",
        detail:
          "Customers book times that actually exist — Chasum never invents availability.",
      },
      {
        title: "Customer history in one place",
        detail:
          "Profiles, timelines, and notes stay connected to every visit.",
      },
      {
        title: "Team, services, and locations",
        detail:
          "Configure how your business actually works — staff, offerings, and places you serve.",
      },
      {
        title: "Confirmations and reminders",
        detail:
          "Email follow-through when messaging is configured for your business.",
      },
      {
        title: "Payments you can record today",
        detail:
          "Manual payment recording, gift certificates, and reports from real activity.",
      },
      {
        title: "Calendar assist when you connect it",
        detail:
          "Optional Google and Microsoft busy-time help; Apple via ICS subscribe.",
      },
    ],
  },
  {
    id: "in_progress",
    title: "In Progress",
    badge: "Evolving",
    truthLabel: "Early Access",
    summary:
      "Live with design partners and improving quickly — labelled honestly so nothing feels oversold.",
    items: [
      {
        title: "Summer — AI Business Manager",
        detail:
          "Helps you discover Chasum, get set up, answer customers, and guide daily work. AI Receptionist capabilities are part of that role.",
      },
      {
        title: "Chase — operations clarity",
        detail:
          "Read-only insights that surface what deserves attention — without inventing numbers.",
      },
      {
        title: "SMS when you're ready",
        detail:
          "Text delivery when Twilio and your plan settings are enabled.",
      },
      {
        title: "Invoices and commerce ledger",
        detail:
          "Operator invoices, receipts, and a ledger for supported payment types.",
      },
    ],
  },
  {
    id: "upcoming",
    title: "Upcoming",
    badge: "Next up",
    truthLabel: "Coming Next",
    summary:
      "Actively planned work that expands how you run and grow the business.",
    items: [
      {
        title: "Self-serve billing",
        detail:
          "Stripe subscription checkout when Private Alpha is ready for public plans.",
      },
      {
        title: "Card deposits at booking",
        detail:
          "Collect deposits in the Booking Sheet without leaving Chasum.",
      },
      {
        title: "Staff invites and shared login",
        detail:
          "Bring your team in with roles that match how you already operate.",
      },
      {
        title: "Alex — AI Scheduling",
        detail:
          "Smarter calendar protection and coordination as the next AI teammate.",
      },
      {
        title: "Deeper Summer and Chase channels",
        detail:
          "More grounded ways Summer helps and Chase forecasts — without theater.",
      },
    ],
  },
  {
    id: "future",
    title: "Future Vision",
    badge: "Long-term",
    truthLabel: "Future Vision",
    summary:
      "Direction we're building toward — not promised dates, and not available today.",
    items: [
      {
        title: "A fuller AI workforce",
        detail:
          "Maya for marketing intelligence, Leo for business advising, Sophia for customer success.",
      },
      {
        title: "Voice with Summer",
        detail:
          "A voice channel for Summer's AI Receptionist capability — reserved, not live yet.",
      },
      {
        title: "Native mobile",
        detail:
          "Reception-critical mobile experiences after the web product is hardened.",
      },
      {
        title: "Marketplace and franchise tooling",
        detail:
          "Advanced multi-business and marketplace capabilities for larger networks.",
      },
    ],
  },
] as const;
