import type {
  DiscoveryField,
  DiscoveryFieldId,
  DiscoveryProfileView,
} from "@/lib/website-concierge/discovery/types";

/**
 * Field catalog — order is preference, not a rigid script.
 * Branching / skipWhen keep the conversation from feeling like a form.
 */
export const DISCOVERY_FIELDS: DiscoveryField[] = [
  {
    id: "business_type",
    priority: 100,
    question:
      "To tailor this to you — what kind of appointment-based business do you run?",
    suggestions: [
      "Ultrasound studio",
      "Salon",
      "Spa",
      "Clinic",
      "Something else",
    ],
  },
  {
    id: "employee_count",
    priority: 80,
    question: "Roughly how many people are on your team today?",
    suggestions: ["Just me", "2–5", "6–20", "20+"],
  },
  {
    id: "location_count",
    priority: 75,
    question: "Do you operate from one location, or more than one?",
    suggestions: ["One location", "2–3 locations", "4+ locations"],
    skipWhen: (p) =>
      p.employeeCount === "Just me" || p.employeeCount === "1",
  },
  {
    id: "current_software",
    priority: 70,
    question:
      "What do you use today for scheduling or booking — if anything?",
    suggestions: ["Picktime", "Fresha", "Square", "Spreadsheets", "Nothing yet"],
  },
  {
    id: "monthly_volume",
    priority: 60,
    question: "About how many appointments do you book in a typical month?",
    suggestions: ["Under 50", "50–200", "200–500", "500+"],
  },
  {
    id: "challenges",
    priority: 90,
    question:
      "What feels hardest right now — no-shows, front desk load, rebooking, reporting, or something else?",
    suggestions: [
      "No-shows",
      "Front desk overload",
      "Rebooking",
      "Reporting",
      "Staff scheduling",
    ],
  },
  {
    id: "goals",
    priority: 55,
    question: "If Chasum worked well for you, what would success look like in 90 days?",
    suggestions: [
      "Fewer no-shows",
      "Less admin time",
      "More bookings",
      "Clearer reporting",
    ],
  },
  {
    id: "growth_plans",
    priority: 40,
    question: "Are you focused on stabilizing what you have, or growing — new staff, locations, or services?",
    suggestions: ["Stabilize", "Grow staff", "Add location", "Expand services"],
    skipWhen: (p) => p.goals.length === 0 && p.challenges.length === 0,
  },
];

export function fieldById(id: DiscoveryFieldId): DiscoveryField | undefined {
  return DISCOVERY_FIELDS.find((f) => f.id === id);
}

export function isFieldKnown(
  id: DiscoveryFieldId,
  profile: DiscoveryProfileView,
): boolean {
  switch (id) {
    case "business_type":
      return profile.businessType !== "unknown";
    case "employee_count":
      return !!profile.employeeCount;
    case "location_count":
      return !!profile.locationCount;
    case "current_software":
      return !!profile.currentSoftware;
    case "monthly_volume":
      return !!profile.monthlyVolume;
    case "challenges":
      return profile.challenges.length > 0;
    case "goals":
      return profile.goals.length > 0;
    case "growth_plans":
      return !!profile.growthPlans;
    default:
      return true;
  }
}

export function knownFieldCount(profile: DiscoveryProfileView): number {
  return DISCOVERY_FIELDS.filter((f) => isFieldKnown(f.id, profile)).length;
}
