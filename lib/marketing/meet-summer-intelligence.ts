import type { SessionMemory } from "@/lib/website-concierge/types";
import { FS_REASONING_STEPS } from "@/lib/marketing/flagship-summer";

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
  const industryLabel =
    options?.businessOverride?.trim() ||
    (memory.businessTypes.length > 0
      ? memory.businessTypes.join(" · ")
      : null);

  const businessTypeLabel =
    memory.businessType !== "unknown"
      ? formatBusinessType(memory.businessType)
      : null;

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
      label: "Employees",
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
 * Genuine reasoning cues from discovery state — never invented facts.
 */
export function buildThinkingCues(memory: SessionMemory): ThinkingCue[] {
  const cues: ThinkingCue[] = [];

  if (memory.businessType === "unknown") {
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

  if (memory.employeeCount || memory.monthlyVolume) {
    cues.push({
      id: "appointment-volume",
      label: FS_REASONING_STEPS[0],
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
    (memory.businessType !== "unknown" &&
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
