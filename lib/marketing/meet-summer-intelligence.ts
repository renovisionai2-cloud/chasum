import type { SessionMemory } from "@/lib/website-concierge/types";

export type UnderstandingField = {
  id: string;
  label: string;
  value: string | null;
  discovered: boolean;
};

export type ThinkingCue = {
  id: string;
  label: string;
};

/**
 * Live Business Understanding fields — derived from Session Memory / Discovery.
 */
export function buildUnderstandingFields(
  memory: SessionMemory,
): UnderstandingField[] {
  const businessLabel =
    memory.businessType !== "unknown"
      ? formatBusinessType(memory.businessType)
      : null;

  const recommendations =
    memory.recommendationsMade.length > 0
      ? memory.recommendationsMade
          .slice(0, 4)
          .map(formatRecommendation)
          .join(" · ")
      : null;

  return [
    {
      id: "business",
      label: "Business",
      value: businessLabel,
      discovered: !!businessLabel,
    },
    {
      id: "employees",
      label: "Employees",
      value: memory.employeeCount,
      discovered: !!memory.employeeCount,
    },
    {
      id: "locations",
      label: "Locations",
      value: memory.locationCount,
      discovered: !!memory.locationCount,
    },
    {
      id: "software",
      label: "Current software",
      value: memory.currentSoftware,
      discovered: !!memory.currentSoftware,
    },
    {
      id: "pain",
      label: "Pain point",
      value: memory.challenges[0] ?? null,
      discovered: memory.challenges.length > 0,
    },
    {
      id: "goals",
      label: "Goal",
      value: memory.goals[0] ?? memory.growthPlans,
      discovered: memory.goals.length > 0 || !!memory.growthPlans,
    },
    {
      id: "recommendations",
      label: "Recommendations",
      value: recommendations,
      discovered: !!recommendations,
    },
  ];
}

/**
 * Genuine reasoning cues from discovery state — labels match Visible Intelligence.
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

  if (memory.challenges.length > 0 || memory.goals.length > 0) {
    cues.push({
      id: "recognize-patterns",
      label: "Recognizing patterns…",
    });
  }

  if (memory.currentSoftware) {
    cues.push({
      id: "compare-workflows",
      label: "Comparing workflows…",
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
      label: "Preparing recommendations…",
    });
    cues.push({
      id: "personalized-guidance",
      label: "Building personalized guidance…",
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

function formatRecommendation(id: string): string {
  return id
    .replace(/^challenge-/, "")
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
