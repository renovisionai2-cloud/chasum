/**
 * Product Tour page story copy — Final Polish Sprint.
 * Presentation only; does not change product scope or routes.
 */

import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_MEET_SUMMER_LABEL,
  MEET_SUMMER_HREF,
} from "@/lib/marketing/alpha";

export type TourAiKind =
  | "Recommendation"
  | "Insight"
  | "Observation"
  | "Suggestion";

export const PRODUCT_TOUR_INTRO = {
  eyebrow: "Product Tour",
  headline: "One customer journey. One connected record.",
  lede: "From booking to payment and reporting, each step updates the same business—not another disconnected tool.",
  bridgeToShowcase:
    "Next, step into each department and see why it matters before you see how it works.",
} as const;

/**
 * Journey stops — why first, then how, with a quiet AI moment along the way.
 */
export const PRODUCT_TOUR_JOURNEY = [
  {
    step: "1",
    title: "Appointment requested",
    why: "Demand should never get lost between channels.",
    detail: "Online booking or reception begins the visit in one place.",
    moment: {
      kind: "Observation" as TourAiKind,
      text: "The request is recognized as the start of one shared customer record.",
    },
  },
  {
    step: "2",
    title: "Availability confirmed",
    why: "Invented openings create broken promises.",
    detail: "Chasum checks scheduling rules and real availability.",
    moment: {
      kind: "Suggestion" as TourAiKind,
      text: "Viable times come from the same engine staff and customers use.",
    },
  },
  {
    step: "3",
    title: "Customer record updated",
    why: "Context missing at the front desk slows every visit.",
    detail: "CRM history stays connected to the appointment.",
    moment: {
      kind: "Insight" as TourAiKind,
      text: "Prior visits and notes travel with the booking automatically.",
    },
  },
  {
    step: "4",
    title: "Confirmation and reminder sent",
    why: "Silence after booking is how no-shows begin.",
    detail: "Configured email or SMS keeps the customer informed.",
    moment: {
      kind: "Recommendation" as TourAiKind,
      text: "Follow-ups stay tied to the appointment and the customer profile.",
    },
  },
  {
    step: "5",
    title: "Service completed",
    why: "The day needs a clear record of what actually happened.",
    detail: "The appointment progresses through the business’s chosen workflow.",
    moment: {
      kind: "Observation" as TourAiKind,
      text: "Completion updates the same operating memory used everywhere else.",
    },
  },
  {
    step: "6",
    title: "Payment recorded",
    why: "Money and service history should never live in separate silos.",
    detail:
      "Deposits, balances and supported commerce events enter the ledger beside the visit.",
    moment: {
      kind: "Insight" as TourAiKind,
      text: "Payment context remains available on the customer and appointment.",
    },
  },
  {
    step: "7",
    title: "Reports updated",
    why: "Owners need truth about the day—not another export ritual.",
    detail: "Operational and financial reporting reflects recorded activity.",
    moment: {
      kind: "Recommendation" as TourAiKind,
      text: "Patterns surface from shared activity, not a disconnected spreadsheet.",
    },
  },
] as const;

export const PRODUCT_TOUR_SHOWCASE = {
  eyebrow: "Inside the tour",
  headline: "Why each capability matters",
  lede: "Choose a department. Start with why it exists—then see how Chasum brings it into one operating system.",
} as const;

/** WHY + quiet AI moment for each tour department stop. */
export const PRODUCT_TOUR_STOPS: Record<
  string,
  { why: string; moment: { kind: TourAiKind; text: string } }
> = {
  dashboard: {
    why: "A busy day needs one place that shows what deserves attention first.",
    moment: {
      kind: "Insight",
      text: "Operational signals gather here from every connected department.",
    },
  },
  summer: {
    why: "Customers and staff need intelligent help without invented availability.",
    moment: {
      kind: "Recommendation",
      text: "Summer answers from real hours, services and openings—then escalates to humans when needed.",
    },
  },
  crm: {
    why: "Every conversation is better when history arrives before the greeting.",
    moment: {
      kind: "Observation",
      text: "Notes, visits and payments stay on one timeline with the appointment.",
    },
  },
  calendar: {
    why: "Time is the business—openings must be real, shared and staff-aware.",
    moment: {
      kind: "Suggestion",
      text: "Capacity, rooms and people stay aligned in one schedule memory.",
    },
  },
  employees: {
    why: "Service quality depends on knowing who can work, where and when.",
    moment: {
      kind: "Insight",
      text: "Roles and assignments feed the same day the calendar is running.",
    },
  },
  business: {
    why: "Rules only help when every department reads the same configuration.",
    moment: {
      kind: "Observation",
      text: "Locations, services and policies become shared operating context.",
    },
  },
  reports: {
    why: "Decisions improve when performance is visible without rebuilding spreadsheets.",
    moment: {
      kind: "Recommendation",
      text: "KPIs reflect the same recorded activity the business already ran.",
    },
  },
  communication: {
    why: "Follow-ups fail when messages leave the customer record behind.",
    moment: {
      kind: "Suggestion",
      text: "Email and SMS actions stay attached to the person and the visit.",
    },
  },
  billing: {
    why: "Commerce should sit beside the work that created it—not in another system.",
    moment: {
      kind: "Insight",
      text: "Invoices and payments remain readable next to customer and service context.",
    },
  },
};

export const PRODUCT_TOUR_CONCLUSION = {
  eyebrow: "Ready when you are",
  headline: "This is the operating system your business has been missing.",
  body: "One journey. One memory. One intelligence coordinating the day—so you spend less time stitching tools together and more time running the business.",
  desire: "I want this operating system running my business.",
  primaryCta: {
    label: CTA_APPLY_LABEL,
    href: APPLY_HREF,
  },
  secondaryCta: {
    label: CTA_MEET_SUMMER_LABEL,
    href: MEET_SUMMER_HREF,
  },
} as const;
