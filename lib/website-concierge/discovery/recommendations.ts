import { resolveVocabFamily } from "@/lib/website-concierge/discovery/business-vocabulary";
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
  legal: [
    {
      topicId: "crm",
      title: "CRM & client intake",
      why: "Intake, matter context, and follow-up should live in one place — not across inboxes and spreadsheets.",
      query: "CRM follow-up intake",
    },
    {
      topicId: "reporting",
      title: "Executive Reports",
      why: "Firm owners usually want a clear picture of activity and revenue without assembling it by hand.",
      query: "revenue reporting analytics",
    },
    {
      topicId: "communications",
      title: "Client communications",
      why: "Routine client questions shouldn't scatter across inboxes and pull the team off billable work.",
      query: "communications follow-up",
    },
    {
      topicId: "ai-reception",
      title: "Coverage for routine inquiries",
      why: "When intake and follow-up pile up, covering the repetitive questions is usually the first time win.",
      query: "AI Reception",
    },
  ],
  professional: [
    {
      topicId: "crm",
      title: "CRM Intelligence",
      why: "Client context and follow-up should sit together so work doesn't live in inboxes.",
      query: "CRM follow-up",
    },
    {
      topicId: "reporting",
      title: "Executive Reports",
      why: "A clear view of activity and revenue beats assembling numbers by hand.",
      query: "revenue reporting analytics",
    },
    {
      topicId: "communications",
      title: "Client communications",
      why: "Keep routine client updates from scattering across tools.",
      query: "communications follow-up",
    },
    {
      topicId: "ai-reception",
      title: "Coverage for routine inquiries",
      why: "Repetitive client questions are usually the first place to recover time.",
      query: "AI Reception",
    },
  ],
  automotive: [
    {
      topicId: "crm",
      title: "CRM & follow-up",
      why: "Estimates and customer updates stick when history sits next to the job — not in a text thread.",
      query: "CRM follow-up",
    },
    {
      topicId: "reporting",
      title: "Executive Reports",
      why: "Shop owners need a clear view of volume and revenue without hunting across tools.",
      query: "revenue reporting analytics",
    },
    {
      topicId: "communications",
      title: "Customer updates",
      why: "Keeping customers informed on jobs is usually higher leverage than adding another calendar.",
      query: "communications follow-up",
    },
    {
      topicId: "ai-reception",
      title: "Coverage for routine inquiries",
      why: "Status questions and new-job intake shouldn't stall the floor.",
      query: "AI Reception",
    },
  ],
  home: [
    {
      topicId: "crm",
      title: "CRM & follow-up",
      why: "Leads, jobs, and follow-up should share one memory so estimates don't go cold.",
      query: "CRM follow-up",
    },
    {
      topicId: "reporting",
      title: "Executive Reports",
      why: "A clear view of jobs and revenue beats assembling the week by hand.",
      query: "revenue reporting analytics",
    },
    {
      topicId: "communications",
      title: "Customer communications",
      why: "Updates and follow-up should travel with the job — not live in a personal inbox.",
      query: "communications follow-up",
    },
    {
      topicId: "ai-reception",
      title: "Coverage for routine inquiries",
      why: "New-job questions and status checks are usually the first time win.",
      query: "AI Reception",
    },
  ],
  neutral: [
    {
      topicId: "crm",
      title: "CRM Intelligence",
      why: "Customer context should sit in one place so follow-up doesn't depend on whoever last checked email.",
      query: "CRM follow-up",
    },
    {
      topicId: "reporting",
      title: "Executive Reports",
      why: "A clear view of what is changing beats assembling numbers by hand.",
      query: "revenue reporting analytics",
    },
    {
      topicId: "communications",
      title: "Communications",
      why: "Routine customer updates shouldn't scatter across inboxes and tools.",
      query: "communications follow-up",
    },
    {
      topicId: "ai-reception",
      title: "Coverage for routine inquiries",
      why: "Repetitive questions are usually the first place to recover time — without assuming another industry's workflow.",
      query: "AI Reception",
    },
  ],
};

const CHALLENGE_QUERIES: Record<string, string> = {
  "no-shows": "deposits reminders no-shows",
  "front-desk overload": "AI Reception",
  "admin overload": "AI Reception CRM",
  rebooking: "CRM retention rebooking",
  "follow-up": "CRM follow-up",
  "client follow-up": "CRM follow-up",
  reporting: "revenue reporting analytics",
  "staff scheduling": "staff scheduling calendar",
  "scheduling reliability": "calendar booking",
  "billing / collections": "payments reporting billing",
  intake: "CRM intake follow-up",
  "estimates and follow-up": "CRM estimates follow-up",
  "customer updates": "communications follow-up",
  "customer communication": "communications follow-up",
  "dispatch and scheduling": "calendar dispatch",
  "scheduling jobs": "calendar jobs",
};

type Playbook = (typeof INDUSTRY_PLAYBOOKS)[string];

export function playbookForProfile(
  profile: Pick<DiscoveryProfileView, "businessType" | "businessTypes">,
): Playbook {
  const family = resolveVocabFamily(profile);
  const blob = [
    profile.businessType,
    ...(profile.businessTypes ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (family === "neutral") {
    return INDUSTRY_PLAYBOOKS.neutral;
  }
  if (family === "healthcare") {
    if (blob.includes("ultrasound") || blob.includes("elective")) {
      return INDUSTRY_PLAYBOOKS.ultrasound;
    }
    return INDUSTRY_PLAYBOOKS.clinic;
  }
  if (family === "appointment") {
    if (blob.includes("salon") || blob.includes("barber") || blob.includes("beauty")) {
      return INDUSTRY_PLAYBOOKS.salon;
    }
    if (blob.includes("spa") || blob.includes("wellness") || blob.includes("massage")) {
      return INDUSTRY_PLAYBOOKS.spa;
    }
    return INDUSTRY_PLAYBOOKS.default;
  }
  if (family === "legal") return INDUSTRY_PLAYBOOKS.legal;
  if (family === "professional") return INDUSTRY_PLAYBOOKS.professional;
  if (family === "automotive") return INDUSTRY_PLAYBOOKS.automotive;
  if (family === "home") return INDUSTRY_PLAYBOOKS.home;
  return INDUSTRY_PLAYBOOKS.default;
}

export function playbookForBusinessType(
  businessType: string,
  businessTypes: string[] = [],
) {
  return playbookForProfile({ businessType, businessTypes });
}

export function buildRecommendationQuery(
  profile: DiscoveryProfileView,
): string {
  const parts: string[] = [];
  if (profile.businessTypes.length) {
    parts.push(...profile.businessTypes);
  } else if (profile.businessType !== "unknown") {
    parts.push(profile.businessType);
  }
  for (const c of profile.challenges) {
    parts.push(CHALLENGE_QUERIES[c.toLowerCase()] ?? c);
  }
  for (const g of profile.goals) parts.push(g);
  if (profile.currentSoftware) {
    parts.push(profile.currentSoftware, "competitive migration");
  }
  const playbook = playbookForProfile(profile);
  parts.push(...playbook.slice(0, 3).map((p) => p.query));
  return parts.join(" ");
}

export function buildPersonalizedRecommendations(
  profile: DiscoveryProfileView,
  articles: KnowledgeEntry[],
  limit = 4,
): PersonalizedRecommendation[] {
  const playbook = playbookForProfile(profile);
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
    const q = CHALLENGE_QUERIES[challenge.toLowerCase()] ?? challenge;
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

function operatingPhrase(profile: DiscoveryProfileView): string {
  if (profile.businessTypes.length === 1) {
    return `your ${profile.businessTypes[0]!.toLowerCase()}`;
  }
  if (profile.businessTypes.length > 1) {
    return "these businesses";
  }
  if (profile.businessType !== "unknown") {
    return `your ${profile.businessType.replace(/_/g, " ")}`;
  }
  return "your business";
}

export function formatRecommendationsMessage(
  profile: DiscoveryProfileView,
  recs: PersonalizedRecommendation[],
): string {
  const name = profile.visitorName ? `${profile.visitorName}, ` : "";
  const lines = recs.map((r, i) => `${i + 1}. **${r.title}** — ${r.why}`);

  return [
    `${name}Thank you. I now have a good understanding of how ${operatingPhrase(profile)} operates.`,
    "I already see several opportunities where Chasum can reduce manual work and improve your daily operations.",
    "",
    "Here's where I'd start:",
    "",
    ...lines,
    "",
    "Let me show you what I would recommend first — want a short personalized tour?",
  ].join("\n");
}
