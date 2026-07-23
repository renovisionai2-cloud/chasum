import type {
  BusinessType,
  MarketingPageId,
  SessionMemory,
} from "@/lib/website-concierge/types";

export const SESSION_STORAGE_KEY = "chasum.website-concierge.v1";

export function createEmptySessionMemory(): SessionMemory {
  return {
    businessType: "unknown",
    visitorName: null,
    interests: [],
    pagesVisited: [],
    previousQuestions: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadSessionMemory(): SessionMemory {
  if (typeof window === "undefined") return createEmptySessionMemory();
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
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

export function applyMemoryPatch(
  memory: SessionMemory,
  patch?: Partial<
    Pick<SessionMemory, "businessType" | "visitorName" | "interests">
  >,
): SessionMemory {
  if (!patch) return memory;
  const interests = patch.interests
    ? uniqueStrings([...memory.interests, ...patch.interests])
    : memory.interests;
  return {
    ...memory,
    businessType: patch.businessType ?? memory.businessType,
    visitorName:
      patch.visitorName !== undefined ? patch.visitorName : memory.visitorName,
    interests,
    updatedAt: new Date().toISOString(),
  };
}

const BUSINESS_PATTERNS: Array<{ type: BusinessType; pattern: RegExp }> = [
  { type: "ultrasound", pattern: /\b(ultrasound|sonograph|baby\s*world|gender\s*reveal)\b/i },
  { type: "salon", pattern: /\b(salon|hair\s*stylist|barber|beauty\s*salon)\b/i },
  { type: "spa", pattern: /\b(spa|massage|esthetician|med\s*spa)\b/i },
  { type: "clinic", pattern: /\b(clinic|medical|wellness\s*clinic|chiro)\b/i },
  { type: "dental", pattern: /\b(dental|dentist|orthodont)\b/i },
  { type: "fitness", pattern: /\b(gym|fitness|personal\s*train|pilates|yoga\s*studio)\b/i },
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
  if (/\b(schedul|calendar|book|appoint)\b/i.test(text)) interests.push("scheduling");
  if (/\b(crm|client|customer)\b/i.test(text)) interests.push("crm");
  if (/\b(ai|summer|chase|automat)\b/i.test(text)) interests.push("ai");
  if (/\b(market|campaign|sms|email)\b/i.test(text)) interests.push("marketing");
  if (/\b(payment|invoice|gift\s*card)\b/i.test(text)) interests.push("payments");
  if (/\b(demo|walkthrough|tour)\b/i.test(text)) interests.push("demo");
  if (/\b(alpha|apply|early\s*access)\b/i.test(text)) interests.push("private-alpha");
  return interests;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean))];
}
