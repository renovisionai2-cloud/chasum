import type {
  DiscoveryField,
  DiscoveryFieldId,
  DiscoveryProfileView,
} from "@/lib/website-concierge/discovery/types";

/**
 * Field catalog — order is preference, not a rigid script.
 * Each field follows The Summer Principle: why → helps → willDo → question.
 * @see docs/ai/SUMMER_PRINCIPLE.md
 */
export const DISCOVERY_FIELDS: DiscoveryField[] = [
  {
    id: "business_type",
    priority: 100,
    why: "Different businesses run on different rhythms — an ultrasound clinic is not a salon.",
    helps: "Knowing your type lets me speak your language instead of generic software talk.",
    willDo: "I'll use it to load the right industry patterns before I recommend anything.",
    question:
      "What kind of appointment-based business do you run?",
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
    why: "Team size changes how reception, scheduling, and handoffs should feel day to day.",
    helps: "It tells me whether you need solo simplicity or multi-staff coordination.",
    willDo: "I'll tailor the next questions and later recommendations to your scale — not a one-size stack.",
    question: "Roughly how many people are on your team today?",
    suggestions: ["Just me", "2–5", "6–20", "20+"],
  },
  {
    id: "location_count",
    priority: 75,
    why: "One location and multi-location businesses have very different calendars and reporting needs.",
    helps: "It keeps me from recommending tools that only work well for a single front desk.",
    willDo: "I'll factor location complexity into workflow and reporting suggestions.",
    question: "Do you operate from one location, or more than one?",
    suggestions: ["One location", "2–3 locations", "4+ locations"],
    skipWhen: (p) =>
      p.employeeCount === "Just me" || p.employeeCount === "1",
  },
  {
    id: "current_software",
    priority: 70,
    why: "What you use today shapes what is painful — and what is worth migrating.",
    helps: "It lets me compare against real workflows instead of pitching features in the abstract.",
    willDo: "I'll note gaps and only recommend changes that improve on your current setup.",
    question:
      "What do you use today for scheduling or booking — if anything?",
    suggestions: ["Picktime", "Fresha", "Square", "Spreadsheets", "Nothing yet"],
  },
  {
    id: "monthly_volume",
    priority: 60,
    why: "Appointment volume drives no-show risk, desk load, and how much automation actually helps.",
    helps: "It calibrates recommendations to your real throughput — not a hypothetical busy clinic.",
    willDo: "I'll weigh volume when suggesting reception, deposits, and reporting depth.",
    question: "About how many appointments do you book in a typical month?",
    suggestions: ["Under 50", "50–200", "200–500", "500+"],
  },
  {
    id: "challenges",
    priority: 90,
    why: "The right next step depends on what hurts most right now — not a feature checklist.",
    helps: "Your biggest challenge becomes the lens for every recommendation I make.",
    willDo: "I'll prioritize outcomes that relieve that pressure first.",
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
    why: "Success looks different for every operator — fewer no-shows, less admin, clearer numbers.",
    helps: "A concrete goal keeps recommendations honest and measurable.",
    willDo: "I'll frame suggestions against that 90-day picture so we can confirm fit together.",
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
    why: "Stabilizing and growing need different systems — adding staff is not the same as adding a location.",
    helps: "It tells me whether to optimize what you have or prepare for expansion.",
    willDo: "I'll align recommendations with the path you're actually on.",
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
