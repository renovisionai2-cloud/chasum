import type {
  DiscoveryField,
  DiscoveryProfileView,
} from "@/lib/website-concierge/discovery/types";

/**
 * Small controlled vocabulary for marketing discovery copy.
 * Families only — not a vertical rules engine.
 */
export type VocabFamily =
  | "legal"
  | "healthcare"
  | "appointment"
  | "automotive"
  | "home"
  | "professional"
  | "neutral";

export type DiscoveryVocab = {
  family: VocabFamily;
  customer: string;
  activity: string;
  volumeWhy: string;
  volumeHelps: string;
  volumeWillDo: string;
  volumeQuestion: string;
  employeeWhy: string;
  locationHelps: string;
  softwareQuestion: string;
  softwareSuggestions: string[];
  challengeSuggestions: string[];
  goalWhy: string;
  goalSuggestions: string[];
  softwareImproveSuggestions: string[];
  volumeCue: string;
};

const RANGES = ["Under 50", "50–200", "200–500", "500+"] as const;

const APPOINTMENT: DiscoveryVocab = {
  family: "appointment",
  customer: "client",
  activity: "appointment",
  volumeWhy:
    "Appointment volume drives no-show risk, desk load, and how much automation actually helps.",
  volumeHelps:
    "It calibrates recommendations to your real throughput — not a hypothetical busy clinic.",
  volumeWillDo:
    "I'll weigh volume when suggesting reception, deposits, and reporting depth.",
  volumeQuestion: "About how many appointments do you book in a typical month?",
  employeeWhy:
    "Team size changes how reception, scheduling, and handoffs should feel day to day.",
  locationHelps:
    "It keeps me from recommending tools that only work well for a single front desk.",
  softwareQuestion:
    "What do you use today for scheduling or booking — if anything?",
  softwareSuggestions: ["Picktime", "Fresha", "Square", "Spreadsheets", "Nothing yet"],
  challengeSuggestions: [
    "No-shows",
    "Front desk overload",
    "Rebooking",
    "Reporting",
    "Staff scheduling",
  ],
  goalWhy:
    "Success looks different for every operator — fewer no-shows, less admin, clearer numbers.",
  goalSuggestions: [
    "Fewer no-shows",
    "Less admin time",
    "More bookings",
    "Clearer reporting",
  ],
  softwareImproveSuggestions: [
    "Fewer no-shows",
    "Less admin time",
    "Better reporting",
    "Online booking",
  ],
  volumeCue: "Understanding appointment volume…",
};

const HEALTHCARE: DiscoveryVocab = {
  ...APPOINTMENT,
  family: "healthcare",
  customer: "patient",
  activity: "visit",
  volumeHelps:
    "It calibrates recommendations to your real throughput — not a hypothetical template.",
  volumeQuestion: "About how many patient visits do you book in a typical month?",
};

const LEGAL: DiscoveryVocab = {
  family: "legal",
  customer: "client",
  activity: "consultation",
  volumeWhy:
    "Activity level helps me understand how much coordination your team handles.",
  volumeHelps:
    "It calibrates recommendations to how the firm actually runs — not a one-size template.",
  volumeWillDo:
    "I'll weigh that activity when suggesting intake, follow-up, billing, and reporting depth.",
  volumeQuestion:
    "Roughly how many new client inquiries, consultations, or active matters does your firm manage in a typical month?",
  employeeWhy:
    "Team size changes how intake, coverage, and handoffs should feel day to day.",
  locationHelps:
    "It keeps me from recommending tools that only work well for a single office.",
  softwareQuestion:
    "What do you use today to run the firm — practice management, email, spreadsheets — if anything?",
  softwareSuggestions: [
    "Practice management software",
    "Spreadsheets",
    "Email / calendar",
    "Nothing yet",
  ],
  challengeSuggestions: [
    "Admin overload",
    "Client follow-up",
    "Reporting",
    "Billing / collections",
    "Intake",
  ],
  goalWhy:
    "Success looks different for every firm — less admin, clearer follow-up, stronger intake, cleaner numbers.",
  goalSuggestions: [
    "More clients",
    "Improve client intake",
    "Less admin time",
    "Improve follow-up",
  ],
  softwareImproveSuggestions: [
    "Less admin time",
    "Better reporting",
    "Faster follow-up",
    "Clearer billing",
  ],
  volumeCue: "Understanding firm activity…",
};

const PROFESSIONAL: DiscoveryVocab = {
  ...LEGAL,
  family: "professional",
  volumeQuestion:
    "Roughly how many new client inquiries, consultations, or active engagements does your business manage in a typical month?",
  volumeHelps:
    "It calibrates recommendations to how the business actually runs — not a one-size template.",
  softwareQuestion:
    "What do you use today to run the business — if anything?",
  volumeCue: "Understanding client activity…",
};

const AUTOMOTIVE: DiscoveryVocab = {
  family: "automotive",
  customer: "customer",
  activity: "job",
  volumeWhy:
    "Service volume helps me understand how much coordination the shop handles.",
  volumeHelps:
    "It calibrates recommendations to real throughput — not a one-size template.",
  volumeWillDo:
    "I'll weigh that volume when suggesting estimates, customer updates, and reporting.",
  volumeQuestion:
    "About how many service jobs does the shop complete in a typical month?",
  employeeWhy:
    "Team size changes how the floor, estimates, and customer updates should feel day to day.",
  locationHelps:
    "It keeps me from recommending tools that only work well for a single bay or location.",
  softwareQuestion:
    "What do you use today for jobs, estimates, or customer updates — if anything?",
  softwareSuggestions: ["Shop management software", "Spreadsheets", "Nothing yet"],
  challengeSuggestions: [
    "Estimates and follow-up",
    "Customer updates",
    "Reporting",
    "Scheduling jobs",
    "Admin overload",
  ],
  goalWhy:
    "Success looks different for every shop — fewer bottlenecks, clearer updates, cleaner numbers.",
  goalSuggestions: [
    "More jobs",
    "Less admin time",
    "Clearer reporting",
    "Faster customer updates",
  ],
  softwareImproveSuggestions: [
    "Less admin time",
    "Better reporting",
    "Faster customer updates",
    "Clearer estimates",
  ],
  volumeCue: "Understanding service volume…",
};

const HOME: DiscoveryVocab = {
  family: "home",
  customer: "customer",
  activity: "job",
  volumeWhy:
    "Job volume helps me understand how much coordination the team handles.",
  volumeHelps:
    "It calibrates recommendations to real throughput — not a one-size template.",
  volumeWillDo:
    "I'll weigh that volume when suggesting scheduling, follow-up, and reporting.",
  volumeQuestion:
    "About how many jobs or service calls does the business handle in a typical month?",
  employeeWhy:
    "Crew size changes how dispatch, handoffs, and customer updates should feel day to day.",
  locationHelps:
    "It keeps me from recommending tools that only work well for a single crew or office.",
  softwareQuestion:
    "What do you use today for jobs, dispatch, or customer updates — if anything?",
  softwareSuggestions: ["Field service software", "Spreadsheets", "Nothing yet"],
  challengeSuggestions: [
    "Dispatch and scheduling",
    "Customer follow-up",
    "Reporting",
    "Estimates",
    "Admin overload",
  ],
  goalWhy:
    "Success looks different for every operator — more jobs, less admin, clearer follow-up.",
  goalSuggestions: [
    "More jobs",
    "Less admin time",
    "Clearer reporting",
    "Faster follow-up",
  ],
  softwareImproveSuggestions: [
    "Less admin time",
    "Better reporting",
    "Faster follow-up",
    "Clearer dispatch",
  ],
  volumeCue: "Understanding job volume…",
};

const NEUTRAL: DiscoveryVocab = {
  family: "neutral",
  customer: "customer",
  activity: "work",
  volumeWhy:
    "Activity level helps me understand how much coordination the business handles.",
  volumeHelps:
    "It calibrates recommendations to real throughput — not a one-size industry template.",
  volumeWillDo:
    "I'll weigh that activity when suggesting follow-up, operations, and reporting depth.",
  volumeQuestion:
    "About how much customer activity does the business handle in a typical month?",
  employeeWhy:
    "Team size changes how coverage, handoffs, and day-to-day operations should feel.",
  locationHelps:
    "It keeps me from recommending tools that only work well for a single site.",
  softwareQuestion: "What do you use today to run the business — if anything?",
  softwareSuggestions: ["Industry software", "Spreadsheets", "Nothing yet"],
  challengeSuggestions: [
    "Admin overload",
    "Follow-up",
    "Reporting",
    "Scheduling",
    "Customer communication",
  ],
  goalWhy:
    "Success looks different for every operator — less admin, clearer follow-up, cleaner numbers.",
  goalSuggestions: [
    "More customers",
    "Less admin time",
    "Clearer reporting",
    "Faster follow-up",
  ],
  softwareImproveSuggestions: [
    "Less admin time",
    "Better reporting",
    "Faster follow-up",
    "Clearer operations",
  ],
  volumeCue: "Understanding business activity…",
};

const FAMILY_VOCAB: Record<VocabFamily, DiscoveryVocab> = {
  legal: LEGAL,
  healthcare: HEALTHCARE,
  appointment: APPOINTMENT,
  automotive: AUTOMOTIVE,
  home: HOME,
  professional: PROFESSIONAL,
  neutral: NEUTRAL,
};

export function familyFromText(text: string): VocabFamily {
  const t = text.toLowerCase();
  if (/\blaw\b|attorney|legal|law_firm/.test(t)) return "legal";
  if (/auto|collision|tire shop|automotive/.test(t)) return "automotive";
  if (
    /hvac|plumb|electr|landscap|paint|cleaning|home service|handyman/.test(t)
  ) {
    return "home";
  }
  if (
    /ultrasound|clinic|dental|chiro|physio|medical|healthcare|optometr|osteopath|psychology|counsell|family practice|walk-?in/.test(
      t,
    )
  ) {
    return "healthcare";
  }
  if (
    /salon|spa|massage|barber|lash|brow|tattoo|gym|yoga|pilates|fitness/.test(t)
  ) {
    return "appointment";
  }
  if (/account|consult|insurance|real estate/.test(t)) return "professional";
  return "neutral";
}

export function resolveVocabFamily(input: {
  businessType?: string;
  businessTypes?: string[];
}): VocabFamily {
  const labels = (input.businessTypes ?? []).map((l) => l.trim()).filter(Boolean);
  const families = new Set<VocabFamily>();
  for (const label of labels) {
    families.add(familyFromText(label));
  }
  if (input.businessType && input.businessType !== "unknown") {
    families.add(familyFromText(input.businessType.replace(/_/g, " ")));
  }
  if (families.size === 0) return "appointment";
  if (families.size === 1) return [...families][0]!;
  const meaningful = [...families].filter((f) => f !== "neutral");
  if (meaningful.length === 1) return meaningful[0]!;
  return "neutral";
}

export function resolveDiscoveryVocab(input: {
  businessType?: string;
  businessTypes?: string[];
}): DiscoveryVocab {
  return FAMILY_VOCAB[resolveVocabFamily(input)];
}

export function contextualizeDiscoveryField(
  field: DiscoveryField,
  profile: Pick<DiscoveryProfileView, "businessType" | "businessTypes">,
): DiscoveryField {
  const vocab = resolveDiscoveryVocab(profile);
  if (field.id === "monthly_volume") {
    return {
      ...field,
      why: vocab.volumeWhy,
      helps: vocab.volumeHelps,
      willDo: vocab.volumeWillDo,
      question: vocab.volumeQuestion,
      suggestions: [...RANGES],
    };
  }
  if (field.id === "employee_count") {
    return { ...field, why: vocab.employeeWhy };
  }
  if (field.id === "location_count") {
    return { ...field, helps: vocab.locationHelps };
  }
  if (field.id === "current_software") {
    return {
      ...field,
      question: vocab.softwareQuestion,
      suggestions: vocab.softwareSuggestions,
    };
  }
  if (field.id === "challenges") {
    return { ...field, suggestions: vocab.challengeSuggestions };
  }
  if (field.id === "goals") {
    return {
      ...field,
      why: vocab.goalWhy,
      suggestions: vocab.goalSuggestions,
    };
  }
  return field;
}

export { RANGES as VOLUME_RANGES };
