import type {
  BusinessType,
  DiscoveryFieldId,
  DiscoveryFollowUpId,
  MarketingPageId,
  SessionMemory,
} from "@/lib/website-concierge/types";

export const SESSION_STORAGE_KEY = "chasum.website-concierge.v2";

export function createEmptySessionMemory(): SessionMemory {
  return {
    businessType: "unknown",
    visitorName: null,
    interests: [],
    pagesVisited: [],
    previousQuestions: [],
    answeredArticleIds: [],
    lastTopicIds: [],
    tourStepId: null,
    employeeCount: null,
    locationCount: null,
    currentSoftware: null,
    monthlyVolume: null,
    challenges: [],
    goals: [],
    growthPlans: null,
    discoveryAskedIds: [],
    recommendationsMade: [],
    discoveryPhase: "opening",
    pendingFollowUpId: null,
    updatedAt: new Date().toISOString(),
  };
}

export function loadSessionMemory(): SessionMemory {
  if (typeof window === "undefined") return createEmptySessionMemory();
  try {
    const raw =
      window.sessionStorage.getItem(SESSION_STORAGE_KEY) ??
      window.sessionStorage.getItem("chasum.website-concierge.v1");
    if (!raw) return createEmptySessionMemory();
    const parsed = JSON.parse(raw) as Partial<SessionMemory>;
    return {
      ...createEmptySessionMemory(),
      ...parsed,
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      pagesVisited: Array.isArray(parsed.pagesVisited)
        ? parsed.pagesVisited
        : [],
      previousQuestions: Array.isArray(parsed.previousQuestions)
        ? parsed.previousQuestions
        : [],
      answeredArticleIds: Array.isArray(parsed.answeredArticleIds)
        ? parsed.answeredArticleIds
        : [],
      lastTopicIds: Array.isArray(parsed.lastTopicIds)
        ? parsed.lastTopicIds
        : [],
      tourStepId: parsed.tourStepId ?? null,
      employeeCount: parsed.employeeCount ?? null,
      locationCount: parsed.locationCount ?? null,
      currentSoftware: parsed.currentSoftware ?? null,
      monthlyVolume: parsed.monthlyVolume ?? null,
      challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      growthPlans: parsed.growthPlans ?? null,
      discoveryAskedIds: Array.isArray(parsed.discoveryAskedIds)
        ? (parsed.discoveryAskedIds as DiscoveryFieldId[])
        : [],
      recommendationsMade: Array.isArray(parsed.recommendationsMade)
        ? parsed.recommendationsMade
        : [],
      discoveryPhase: parsed.discoveryPhase ?? "opening",
      pendingFollowUpId:
        (parsed.pendingFollowUpId as DiscoveryFollowUpId | null) ?? null,
    };
  } catch {
    return createEmptySessionMemory();
  }
}

export function saveSessionMemory(memory: SessionMemory): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...memory, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // Ignore quota / private mode failures — conversation still works in-memory.
  }
}

export function recordPageVisit(
  memory: SessionMemory,
  pageId: MarketingPageId,
): SessionMemory {
  const pagesVisited = memory.pagesVisited.includes(pageId)
    ? memory.pagesVisited
    : [...memory.pagesVisited, pageId];
  return { ...memory, pagesVisited, updatedAt: new Date().toISOString() };
}

export function recordQuestion(
  memory: SessionMemory,
  question: string,
): SessionMemory {
  const trimmed = question.trim();
  if (!trimmed) return memory;
  const previousQuestions = [...memory.previousQuestions, trimmed].slice(-20);
  return { ...memory, previousQuestions, updatedAt: new Date().toISOString() };
}

type MemoryPatch = Partial<
  Pick<
    SessionMemory,
    | "businessType"
    | "visitorName"
    | "interests"
    | "answeredArticleIds"
    | "lastTopicIds"
    | "tourStepId"
    | "employeeCount"
    | "locationCount"
    | "currentSoftware"
    | "monthlyVolume"
    | "challenges"
    | "goals"
    | "growthPlans"
    | "discoveryAskedIds"
    | "recommendationsMade"
    | "discoveryPhase"
    | "pendingFollowUpId"
  >
>;

export function applyMemoryPatch(
  memory: SessionMemory,
  patch?: MemoryPatch,
): SessionMemory {
  if (!patch) return memory;
  const interests = patch.interests
    ? uniqueStrings([...memory.interests, ...patch.interests])
    : memory.interests;
  const challenges = patch.challenges
    ? uniquePreserve([...memory.challenges, ...patch.challenges])
    : memory.challenges;
  const goals = patch.goals
    ? uniquePreserve([...memory.goals, ...patch.goals])
    : memory.goals;
  const discoveryAskedIds = patch.discoveryAskedIds
    ? ([
        ...new Set([...memory.discoveryAskedIds, ...patch.discoveryAskedIds]),
      ] as DiscoveryFieldId[])
    : memory.discoveryAskedIds;
  const recommendationsMade = patch.recommendationsMade
    ? uniquePreserve([
        ...memory.recommendationsMade,
        ...patch.recommendationsMade,
      ])
    : memory.recommendationsMade;

  return {
    ...memory,
    businessType: patch.businessType ?? memory.businessType,
    visitorName:
      patch.visitorName !== undefined ? patch.visitorName : memory.visitorName,
    interests,
    answeredArticleIds: patch.answeredArticleIds ?? memory.answeredArticleIds,
    lastTopicIds: patch.lastTopicIds ?? memory.lastTopicIds,
    tourStepId:
      patch.tourStepId !== undefined ? patch.tourStepId : memory.tourStepId,
    employeeCount: patch.employeeCount ?? memory.employeeCount,
    locationCount: patch.locationCount ?? memory.locationCount,
    currentSoftware: patch.currentSoftware ?? memory.currentSoftware,
    monthlyVolume: patch.monthlyVolume ?? memory.monthlyVolume,
    challenges,
    goals,
    growthPlans: patch.growthPlans ?? memory.growthPlans,
    discoveryAskedIds,
    recommendationsMade,
    discoveryPhase: patch.discoveryPhase ?? memory.discoveryPhase,
    pendingFollowUpId:
      patch.pendingFollowUpId !== undefined
        ? patch.pendingFollowUpId
        : memory.pendingFollowUpId,
    updatedAt: new Date().toISOString(),
  };
}

const BUSINESS_PATTERNS: Array<{ type: BusinessType; pattern: RegExp }> = [
  {
    type: "ultrasound",
    pattern: /\b(ultrasound|sonograph|baby\s*world|gender\s*reveal)\b/i,
  },
  { type: "barbershop", pattern: /\b(barbershop|barber)\b/i },
  { type: "salon", pattern: /\b(salon|hair\s*stylist|beauty\s*salon)\b/i },
  { type: "spa", pattern: /\b(spa|med\s*spa|esthetician)\b/i },
  { type: "massage", pattern: /\b(massage|bodywork)\b/i },
  { type: "chiropractic", pattern: /\b(chiropractic|chiropractor)\b/i },
  {
    type: "physiotherapy",
    pattern: /\b(physiotherapy|physio|physical\s*therap)\b/i,
  },
  { type: "dental", pattern: /\b(dental|dentist|orthodont)\b/i },
  { type: "veterinary", pattern: /\b(veterinar|vet\s*clinic|\bvets?\b)\b/i },
  {
    type: "pet_grooming",
    pattern: /\b(pet\s*groom|dog\s*groom|cat\s*groom|groomer)\b/i,
  },
  { type: "clinic", pattern: /\b(clinic|medical|wellness\s*clinic)\b/i },
  {
    type: "fitness",
    pattern: /\b(gym|fitness|personal\s*train|pilates|yoga\s*studio)\b/i,
  },
  { type: "consulting", pattern: /\b(consult|coach|advisor|freelance)\b/i },
];

export function inferBusinessTypeFromText(text: string): BusinessType | null {
  for (const { type, pattern } of BUSINESS_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  if (/\b(other|general|service\s*business)\b/i.test(text)) return "other";
  return null;
}

export function inferNameFromText(text: string): string | null {
  const m =
    text.match(/\b(?:i'?m|i am|my name is|this is)\s+([A-Z][a-z]{1,24})\b/) ||
    text.match(/\b(?:i'?m|i am|my name is|this is)\s+([a-z]{2,24})\b/i);
  if (!m?.[1]) return null;
  const name = m[1];
  if (/^(a|an|the|we|our|looking|interested|here)$/i.test(name)) return null;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function inferInterestsFromText(text: string): string[] {
  const interests: string[] = [];
  if (/\b(pric|plan|cost|subscription)\b/i.test(text)) interests.push("pricing");
  if (/\b(schedul|calendar|book|appoint)\b/i.test(text)) {
    interests.push("scheduling");
  }
  if (/\b(crm|client|customer)\b/i.test(text)) interests.push("crm");
  if (/\b(ai|summer|chase|automat)\b/i.test(text)) interests.push("ai");
  if (/\b(market|campaign|sms|email)\b/i.test(text)) interests.push("marketing");
  if (/\b(payment|invoice|gift\s*card|deposit)\b/i.test(text)) {
    interests.push("payments");
  }
  if (/\b(demo|walkthrough|tour)\b/i.test(text)) interests.push("demo");
  if (/\b(alpha|apply|early\s*access)\b/i.test(text)) {
    interests.push("private-alpha");
  }
  if (/\b(fresha|vagaro|square|mindbody|picktime|compar)\b/i.test(text)) {
    interests.push("competitive");
  }
  return interests;
}

function uniqueStrings(values: string[]): string[] {
  return [
    ...new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean)),
  ];
}

function uniquePreserve(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v.trim());
  }
  return out;
}
