import { FS_RECOMMENDATION_COPY } from "@/lib/marketing/flagship-summer";
import { resolveDiscoveryVocab } from "@/lib/website-concierge/discovery/business-vocabulary";
import type { SessionMemory } from "@/lib/website-concierge/types";

export type UnderstandingField = {
  id: string;
  label: string;
  value: string | null;
  discovered: boolean;
  /** Soft status when not yet discovered */
  pendingLabel?: string;
};

export type ThinkingCue = {
  id: string;
  label: string;
};

/**
 * Live Business Memory fields — Summer's working memory for the consultation.
 */
export function buildUnderstandingFields(
  memory: SessionMemory,
  options?: {
    businessOverride?: string | null;
    /** When true, always return the full profile scaffold */
    showPending?: boolean;
  },
): UnderstandingField[] {
  const selectedLabel =
    memory.businessTypes.length > 0
      ? memory.businessTypes.join(" · ")
      : null;

  const industryLabel =
    options?.businessOverride?.trim() || selectedLabel;

  // Customer-facing Business Type matches the selected label when present.
  // Internal enum (e.g. massage) stays in memory.businessType for compatibility.
  const businessTypeLabel =
    selectedLabel ??
    (memory.businessType !== "unknown"
      ? formatBusinessType(memory.businessType)
      : null);

  const preparingRecommendations =
    memory.discoveryPhase === "recommending" ||
    memory.discoveryPhase === "open" ||
    memory.recommendationsMade.length > 0;

  const fields: UnderstandingField[] = [
    {
      id: "industry",
      label: "Industry",
      value: industryLabel,
      discovered: !!industryLabel,
      pendingLabel: "Learning…",
    },
    {
      id: "businessType",
      label: "Business Type",
      value: businessTypeLabel ?? industryLabel,
      discovered: !!(businessTypeLabel || industryLabel),
      pendingLabel: "Learning…",
    },
    {
      id: "employees",
      label: "Team Size",
      value: memory.employeeCount,
      discovered: !!memory.employeeCount,
      pendingLabel: "Learning…",
    },
    {
      id: "locations",
      label: "Locations",
      value: memory.locationCount,
      discovered: !!memory.locationCount,
      pendingLabel: "Learning…",
    },
    {
      id: "goals",
      label: "Goals",
      value: memory.goals[0] ?? memory.growthPlans,
      discovered: memory.goals.length > 0 || !!memory.growthPlans,
      pendingLabel: "Learning…",
    },
    {
      id: "challenge",
      label: "Primary Challenge",
      value: memory.challenges[0] ?? null,
      discovered: memory.challenges.length > 0,
      pendingLabel: "Learning…",
    },
    {
      id: "recommendations",
      label: "Recommendations",
      value: preparingRecommendations ? "Ready" : null,
      discovered: preparingRecommendations,
      pendingLabel: "Preparing Recommendations…",
    },
  ];

  if (!options?.showPending) {
    return fields.filter((f) => f.discovered || f.id !== "recommendations");
  }

  return fields;
}

/**
 * Completed Business Memory rows for the Understanding Complete / Profile summary.
 * Goals included only when discovered. Recommendations excluded.
 */
export function buildBusinessProfileSummary(
  memory: SessionMemory,
  options?: { businessOverride?: string | null },
): UnderstandingField[] {
  return buildUnderstandingFields(memory, {
    businessOverride: options?.businessOverride ?? null,
    showPending: false,
  }).filter(
    (field) =>
      field.discovered &&
      field.id !== "recommendations" &&
      (field.id !== "goals" || !!field.value),
  );
}

/**
 * Genuine reasoning cues from discovery state — never invented facts.
 */
export function buildThinkingCues(memory: SessionMemory): ThinkingCue[] {
  const cues: ThinkingCue[] = [];

  if (memory.businessType === "unknown" && memory.businessTypes.length === 0) {
    cues.push({
      id: "understand-business",
      label: "Understanding your business…",
    });
  } else {
    cues.push({
      id: "load-industry",
      label: "Loading industry knowledge…",
    });
  }

  if (
    memory.employeeCount ||
    memory.monthlyVolume ||
    memory.businessType !== "unknown" ||
    memory.businessTypes.length > 0
  ) {
    cues.push({
      id: "activity-volume",
      label: resolveDiscoveryVocab(memory).volumeCue,
    });
  }

  if (memory.challenges.length > 0 || memory.goals.length > 0) {
    cues.push({
      id: "recognize-patterns",
      label: "Finding opportunities…",
    });
  }

  if (memory.currentSoftware) {
    cues.push({
      id: "compare-workflows",
      label: "Comparing industry benchmarks…",
    });
  }

  if (
    memory.discoveryPhase === "recommending" ||
    memory.recommendationsMade.length > 0 ||
    ((memory.businessType !== "unknown" || memory.businessTypes.length > 0) &&
      (memory.challenges.length > 0 || !!memory.currentSoftware))
  ) {
    cues.push({
      id: "prepare-recommendations",
      label: "Building recommendations…",
    });
  }

  if (cues.length < 2) {
    cues.push({
      id: "recognize-patterns-soft",
      label: "Recognizing patterns…",
    });
  }

  return cues;
}

function formatBusinessType(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type RecTone = "blue" | "purple" | "teal" | "amber";

const FAMILY_REC_COPY: Partial<
  Record<
    string,
    Record<string, { title: string; why: string; tone: RecTone }>
  >
> = {
  legal: {
    "ai-reception": {
      title: "Coverage for routine inquiries",
      why: "Keep routine client questions from scattering across inboxes and pulling the team off billable work.",
      tone: "blue",
    },
    crm: {
      title: "CRM Intelligence",
      why: "So intake, matter context, and follow-up live in one place — not across inboxes and spreadsheets.",
      tone: "purple",
    },
    reporting: {
      title: "Executive Reports",
      why: "To see what is changing in the firm without assembling it by hand.",
      tone: "teal",
    },
    "revenue-reporting": {
      title: "Executive Reports",
      why: "To see what is changing in the firm without assembling it by hand.",
      tone: "teal",
    },
    communications: {
      title: "Client communications",
      why: "So client updates travel with the matter — not a booking calendar.",
      tone: "blue",
    },
    marketing: {
      title: "Stay in touch",
      why: "To follow up with clients and inquiries without treating the firm like a scheduler.",
      tone: "amber",
    },
    calendar: {
      title: "Intake coordination",
      why: "To keep consultations and follow-up organized around how the firm actually works.",
      tone: "blue",
    },
    deposits: {
      title: "Billing follow-through",
      why: "Helpful when collections are the issue — not as a generic no-show tool.",
      tone: "amber",
    },
  },
  automotive: {
    "ai-reception": {
      title: "Coverage for routine inquiries",
      why: "Status questions and new-job intake shouldn't stall the floor.",
      tone: "blue",
    },
    crm: {
      title: "CRM Intelligence",
      why: "So estimates, jobs, and customer history sit together.",
      tone: "purple",
    },
    communications: {
      title: "Customer updates",
      why: "Keeping customers informed on jobs is usually higher leverage than another calendar.",
      tone: "blue",
    },
    marketing: {
      title: "Stay in touch",
      why: "To follow up on estimates and past jobs.",
      tone: "amber",
    },
  },
  home: {
    marketing: {
      title: "Stay in touch",
      why: "To follow up on leads and jobs.",
      tone: "amber",
    },
  },
  professional: {
    marketing: {
      title: "Stay in touch",
      why: "To follow up with clients and inquiries without a scheduler script.",
      tone: "amber",
    },
  },
  neutral: {
    "ai-reception": {
      title: "Coverage for routine inquiries",
      why: "Repetitive questions are usually the first place to recover time — without assuming another industry's workflow.",
      tone: "blue",
    },
    marketing: {
      title: "Stay in touch",
      why: "To follow up with the right people — not fill a generic appointment book.",
      tone: "amber",
    },
    calendar: {
      title: "Coordination",
      why: "To keep work organized across the businesses you selected.",
      tone: "blue",
    },
    deposits: {
      title: "Payments follow-through",
      why: "Only when collections actually matter for how these businesses run.",
      tone: "amber",
    },
  },
};

export function presentFlagshipRecommendation(
  topicId: string,
  memory: SessionMemory,
): { title: string; why: string; tone: RecTone } {
  const family = resolveDiscoveryVocab(memory).family;
  const overlay = FAMILY_REC_COPY[family]?.[topicId];
  if (overlay) return overlay;

  const copy = FS_RECOMMENDATION_COPY[topicId];
  if (copy) return copy;

  return {
    title: topicId
      .split(/[-_]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" "),
    why: "Grounded in what you shared about how your business runs.",
    tone: "blue",
  };
}
