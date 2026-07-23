import type { DiscoveryExtraction } from "@/lib/website-concierge/discovery/types";
import {
  inferBusinessTypeFromText,
  inferNameFromText,
} from "@/lib/website-concierge/session-memory";

/**
 * Soft extractors — pull discovery facts from natural language without a form.
 */
export function extractDiscoveryFacts(text: string): DiscoveryExtraction {
  const t = text.trim();
  const out: DiscoveryExtraction = {};

  const businessType = inferBusinessTypeFromText(t);
  if (businessType) out.businessType = businessType;

  const name = inferNameFromText(t);
  if (name) out.visitorName = name;

  const employees = extractEmployeeCount(t);
  if (employees) out.employeeCount = employees;

  const locations = extractLocationCount(t);
  if (locations) out.locationCount = locations;

  const software = extractSoftware(t);
  if (software) out.currentSoftware = software;

  const volume = extractMonthlyVolume(t);
  if (volume) out.monthlyVolume = volume;

  const challenges = extractChallenges(t);
  if (challenges.length) out.challenges = challenges;

  const goals = extractGoals(t);
  if (goals.length) out.goals = goals;

  const growth = extractGrowth(t);
  if (growth) out.growthPlans = growth;

  const interests = [...(out.challenges ?? []), ...(out.goals ?? [])];
  if (software) interests.push("competitive", software.toLowerCase());
  if (interests.length) out.interests = interests;

  return out;
}

function extractEmployeeCount(text: string): string | null {
  if (/\b(just\s*me|only\s*me|solo|myself|one\s*person)\b/i.test(text)) {
    return "Just me";
  }
  if (/\b(2\s*[-–to]+\s*5|2-5|few\s*people|small\s*team)\b/i.test(text)) {
    return "2–5";
  }
  if (/\b(6\s*[-–to]+\s*20|6-20)\b/i.test(text)) return "6–20";
  if (/\b(20\+|more\s*than\s*20|twenty\s*\+|large\s*team)\b/i.test(text)) {
    return "20+";
  }
  const n = text.match(/\b(\d{1,3})\s*(people|employees|staff|team\s*members)\b/i);
  if (n?.[1]) {
    const count = Number(n[1]);
    if (count <= 1) return "Just me";
    if (count <= 5) return "2–5";
    if (count <= 20) return "6–20";
    return "20+";
  }
  return null;
}

function extractLocationCount(text: string): string | null {
  if (/\b(one\s*location|single\s*(site|shop|studio)|just\s*one)\b/i.test(text)) {
    return "One location";
  }
  if (/\b(2\s*[-–to]+\s*3|two\s*or\s*three|a\s*few\s*locations)\b/i.test(text)) {
    return "2–3 locations";
  }
  if (/\b(4\+|four\s*\+|many\s*locations|multi[- ]?location)\b/i.test(text)) {
    return "4+ locations";
  }
  const n = text.match(/\b(\d+)\s*locations?\b/i);
  if (n?.[1]) {
    const count = Number(n[1]);
    if (count <= 1) return "One location";
    if (count <= 3) return "2–3 locations";
    return "4+ locations";
  }
  return null;
}

function extractSoftware(text: string): string | null {
  const known: Array<{ name: string; pattern: RegExp }> = [
    { name: "Picktime", pattern: /\bpicktime\b/i },
    { name: "Fresha", pattern: /\bfresha\b/i },
    { name: "Vagaro", pattern: /\bvagaro\b/i },
    { name: "Square", pattern: /\bsquare(\s*appointments)?\b/i },
    { name: "Mindbody", pattern: /\bmind\s*body|mindbody\b/i },
    { name: "Booksy", pattern: /\bbooksy\b/i },
    { name: "Jane", pattern: /\bjane\b/i },
    { name: "Calendly", pattern: /\bcalendly\b/i },
    { name: "Spreadsheets", pattern: /\b(spreadsheet|excel|google\s*sheets)\b/i },
    { name: "Nothing yet", pattern: /\b(nothing|no\s*software|pen\s*and\s*paper|phone\s*only)\b/i },
  ];
  for (const k of known) {
    if (k.pattern.test(text)) return k.name;
  }
  const m = text.match(
    /\b(?:use|using|on|with)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)?)\b/,
  );
  if (m?.[1] && !/^(I|We|The|Our|My)$/i.test(m[1])) return m[1];
  return null;
}

function extractMonthlyVolume(text: string): string | null {
  if (/\b(under\s*50|less\s*than\s*50|< ?50)\b/i.test(text)) return "Under 50";
  if (/\b(50\s*[-–to]+\s*200|50-200)\b/i.test(text)) return "50–200";
  if (/\b(200\s*[-–to]+\s*500|200-500)\b/i.test(text)) return "200–500";
  if (/\b(500\+|more\s*than\s*500|hundreds)\b/i.test(text)) return "500+";
  const n = text.match(/\b(\d{2,4})\s*(appointments|bookings|visits)\s*(a|per)?\s*month\b/i);
  if (n?.[1]) {
    const v = Number(n[1]);
    if (v < 50) return "Under 50";
    if (v <= 200) return "50–200";
    if (v <= 500) return "200–500";
    return "500+";
  }
  return null;
}

function extractChallenges(text: string): string[] {
  const found: string[] = [];
  if (/\b(no[- ]?shows?|cancellations?)\b/i.test(text)) found.push("no-shows");
  if (/\b(front\s*desk|reception|phone\s*calls|admin)\b/i.test(text)) {
    found.push("front-desk overload");
  }
  if (/\b(rebook|retention|follow[- ]?ups?)\b/i.test(text)) found.push("rebooking");
  if (/\b(report|analytics|visibility|numbers)\b/i.test(text)) found.push("reporting");
  if (/\b(staff\s*schedul|who\s*works|utilization)\b/i.test(text)) {
    found.push("staff scheduling");
  }
  if (/\b(double[- ]?book|availability|calendar\s*chaos)\b/i.test(text)) {
    found.push("scheduling reliability");
  }
  return found;
}

function extractGoals(text: string): string[] {
  const found: string[] = [];
  if (/\b(fewer\s*no[- ]?shows|reduce\s*no[- ]?shows)\b/i.test(text)) {
    found.push("fewer no-shows");
  }
  if (/\b(less\s*admin|save\s*time|automate)\b/i.test(text)) {
    found.push("less admin time");
  }
  if (/\b(more\s*bookings?|grow\s*revenue|fill\s*the\s*(book|calendar))\b/i.test(text)) {
    found.push("more bookings");
  }
  if (/\b(clearer\s*report|better\s*insight|understand\s*numbers)\b/i.test(text)) {
    found.push("clearer reporting");
  }
  return found;
}

function extractGrowth(text: string): string | null {
  if (/\b(stabilize|maintain|steady|keep\s*up)\b/i.test(text)) return "Stabilize";
  if (/\b(hire|grow\s*staff|more\s*(employees|stylists|techs))\b/i.test(text)) {
    return "Grow staff";
  }
  if (/\b(second\s*location|new\s*location|expand\s*locations)\b/i.test(text)) {
    return "Add location";
  }
  if (/\b(new\s*services?|expand\s*menu|more\s*offerings)\b/i.test(text)) {
    return "Expand services";
  }
  return null;
}

/** Detect desire for product Q&A vs discovery chat */
export function looksLikeProductQuestion(text: string): boolean {
  return /\b(what\s+is|how\s+(does|do|much|is)|explain|tell\s+me\s+about|pricing|price|plan|feature|tour|demo|differ|vs\.?|versus|compare|security|privacy)\b/i.test(
    text,
  );
}

export function looksLikeTourRequest(text: string): boolean {
  return /\b(tour|show\s+me|walk\s*me|guide\s+me)\b/i.test(text);
}
