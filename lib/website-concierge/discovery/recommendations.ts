import type { KnowledgeEntry } from "@/lib/website-concierge/knowledge/types";
import type { DiscoveryProfileView } from "@/lib/website-concierge/discovery/types";

export type PersonalizedRecommendation = {
  topicId: string;
  title: string;
  why: string;
  articleIds: string[];
};

/**
 * Industry + pain-point playbooks that feed Knowledge Engine retrieval.
 * Recommendations stay personalized; article bodies come from the Knowledge Engine.
 */
const INDUSTRY_PLAYBOOKS: Record<
  string,
  Array<{ topicId: string; title: string; why: string; query: string }>
> = {
  ultrasound: [
    {
      topicId: "ai-reception",
      title: "AI Reception",
      why: "Ultrasound studios often lose evenings and weekends when the front desk is closed — Summer can cover those calls.",
      query: "AI Reception after-hours booking ultrasound",
    },
    {
      topicId: "crm",
      title: "CRM & follow-up",
      why: "Pregnancy timelines create natural follow-up windows; CRM keeps those moments from slipping.",
      query: "CRM retention follow-up appointments",
    },
    {
      topicId: "deposits",
      title: "Deposits",
      why: "Specialty sessions benefit from deposits so no-shows hurt less.",
      query: "deposits no-shows booking",
    },
    {
      topicId: "packages",
      title: "Packages",
      why: "Multi-visit packages fit maternity and keepsake journeys.",
      query: "packages gift certificates commerce",
    },
    {
      topicId: "gift-certificates",
      title: "Gift certificates",
      why: "Gift certificates are a common ultrasound referral and holiday driver.",
      query: "gift certificates",
    },
    {
      topicId: "revenue-reporting",
      title: "Revenue reporting",
      why: "Owners usually want session mix and deposit clarity without spreadsheet gymnastics.",
      query: "revenue reporting analytics",
    },
  ],
  salon: [
    {
      topicId: "staff-scheduling",
      title: "Staff scheduling",
      why: "Salons live and die on who is on the floor — scheduling should match demand.",
      query: "staff scheduling calendar",
    },
    {
      topicId: "online-booking",
      title: "Online booking",
      why: "Clients expect to book after hours; online booking fills the gaps.",
      query: "online booking calendar",
    },
    {
      topicId: "deposits",
      title: "Deposits",
      why: "Deposits reduce no-shows on longer color and bridal appointments.",
      query: "deposits no-shows",
    },
    {
      topicId: "retention",
      title: "Customer retention",
      why: "Rebooking and follow-up keep chairs full without constant outreach from you.",
      query: "CRM retention rebooking",
    },
    {
      topicId: "marketing",
      title: "Marketing",
      why: "When operations are steady, light marketing tools help fill soft days.",
      query: "marketing campaigns retention",
    },
  ],
  spa: [
    {
      topicId: "online-booking",
      title: "Online booking",
      why: "Spas convert well when guests can self-book treatments and packages.",
      query: "online booking packages",
    },
    {
      topicId: "packages",
      title: "Packages",
      why: "Treatment series and memberships map cleanly to packages.",
      query: "packages commerce",
    },
    {
      topicId: "ai-reception",
      title: "AI Reception",
      why: "Front desk load drops when routine booking questions are handled for you.",
      query: "AI Reception",
    },
    {
      topicId: "deposits",
      title: "Deposits",
      why: "Longer spa blocks protect revenue with deposits.",
      query: "deposits",
    },
  ],
  clinic: [
    {
      topicId: "ai-reception",
      title: "AI Reception",
      why: "Clinics often need reliable intake coverage without adding headcount.",
      query: "AI Reception",
    },
    {
      topicId: "crm",
      title: "CRM",
      why: "Patient follow-up and recall work best when CRM is tied to the calendar.",
      query: "CRM follow-up",
    },
    {
      topicId: "reporting",
      title: "Reporting",
      why: "Owners need clear utilization and revenue without hunting across tools.",
      query: "revenue reporting",
    },
    {
      topicId: "deposits",
      title: "Deposits / prepay",
      why: "Prepay and deposits stabilize cash flow on elective visits.",
      query: "deposits payments",
    },
  ],
  default: [
    {
      topicId: "calendar",
      title: "Scheduling & booking",
      why: "A dependable calendar is usually the foundation for everything else.",
      query: "calendar booking",
    },
    {
      topicId: "ai-reception",
      title: "AI Reception",
      why: "Many appointment businesses free the most time by covering routine calls.",
      query: "AI Reception",
    },
    {
      topicId: "crm",
      title: "CRM",
      why: "Keeping customer history next to the schedule helps retention.",
      query: "CRM",
    },
    {
      topicId: "deposits",
      title: "Deposits",
      why: "Deposits are a practical lever against no-shows.",
      query: "deposits",
    },
  ],
};

const CHALLENGE_QUERIES: Record<string, string> = {
  "no-shows": "deposits reminders no-shows",
  "front-desk overload": "AI Reception",
  rebooking: "CRM retention rebooking",
  reporting: "revenue reporting analytics",
  "staff scheduling": "staff scheduling calendar",
  "scheduling reliability": "calendar booking",
};

export function playbookForBusinessType(businessType: string) {
  const key = businessType.toLowerCase();
  if (key.includes("ultrasound") || key.includes("elective")) {
    return INDUSTRY_PLAYBOOKS.ultrasound;
  }
  if (key.includes("salon") || key.includes("barber") || key.includes("beauty")) {
    return INDUSTRY_PLAYBOOKS.salon;
  }
  if (key.includes("spa") || key.includes("wellness") || key.includes("massage")) {
    return INDUSTRY_PLAYBOOKS.spa;
  }
  if (key.includes("clinic") || key.includes("medical") || key.includes("dental")) {
    return INDUSTRY_PLAYBOOKS.clinic;
  }
  return INDUSTRY_PLAYBOOKS.default;
}

export function buildRecommendationQuery(
  profile: DiscoveryProfileView,
): string {
  const parts: string[] = [];
  if (profile.businessType !== "unknown") parts.push(profile.businessType);
  for (const c of profile.challenges) {
    parts.push(CHALLENGE_QUERIES[c] ?? c);
  }
  for (const g of profile.goals) parts.push(g);
  if (profile.currentSoftware) {
    parts.push(profile.currentSoftware, "competitive migration");
  }
  const playbook = playbookForBusinessType(profile.businessType);
  parts.push(...playbook.slice(0, 3).map((p) => p.query));
  return parts.join(" ");
}

export function buildPersonalizedRecommendations(
  profile: DiscoveryProfileView,
  articles: KnowledgeEntry[],
  limit = 4,
): PersonalizedRecommendation[] {
  const playbook = playbookForBusinessType(profile.businessType);
  const already = new Set(profile.recommendationsMade);
  const recs: PersonalizedRecommendation[] = [];

  for (const item of playbook) {
    if (already.has(item.topicId)) continue;
    const matched = articles.filter((a) =>
      a.tags.some((t) => item.query.toLowerCase().includes(t)) ||
      item.query.toLowerCase().split(/\s+/).some((w) =>
        a.title.toLowerCase().includes(w) ||
        a.summary.toLowerCase().includes(w) ||
        a.tags.includes(w),
      ),
    );
    recs.push({
      topicId: item.topicId,
      title: item.title,
      why: personalizeWhy(item.why, profile),
      articleIds: matched.slice(0, 2).map((a) => a.id),
    });
    if (recs.length >= limit) break;
  }

  // Challenge-driven boosts
  for (const challenge of profile.challenges) {
    if (recs.length >= limit) break;
    const topicId = `challenge-${challenge}`;
    if (already.has(topicId) || recs.some((r) => r.topicId === topicId)) continue;
    const q = CHALLENGE_QUERIES[challenge] ?? challenge;
    const matched = articles.filter((a) =>
      q.split(/\s+/).some((w) =>
        a.title.toLowerCase().includes(w) || a.tags.includes(w),
      ),
    );
    if (!matched.length) continue;
    recs.push({
      topicId,
      title: matched[0]!.title,
      why: `You mentioned ${challenge} — this is usually where Chasum helps first.`,
      articleIds: matched.slice(0, 2).map((a) => a.id),
    });
  }

  return recs.slice(0, limit);
}

function personalizeWhy(base: string, profile: DiscoveryProfileView): string {
  const bits: string[] = [base];
  if (profile.currentSoftware) {
    bits.push(
      `Especially useful if you're comparing options beyond ${profile.currentSoftware}.`,
    );
  }
  if (profile.employeeCount === "Just me") {
    bits.push("As a solo operator, time saved here compounds quickly.");
  }
  return bits.join(" ");
}

export function formatRecommendationsMessage(
  profile: DiscoveryProfileView,
  recs: PersonalizedRecommendation[],
): string {
  const name = profile.visitorName ? `${profile.visitorName}, ` : "";
  const biz =
    profile.businessType !== "unknown"
      ? `for a ${profile.businessType}`
      : "for your business";

  const lines = recs.map((r, i) => `${i + 1}. **${r.title}** — ${r.why}`);

  return [
    `${name}based on what you've shared ${biz}, here's where Chasum tends to help most:`,
    "",
    ...lines,
    "",
    "I'd like to show you the parts of Chasum that will help your business most — want a short personalized tour?",
  ].join("\n");
}
