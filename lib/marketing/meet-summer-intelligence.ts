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
 * Presentation only; does not change discovery logic.
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
 * Genuine reasoning cues from current discovery state — not random fake thinking.
 * Steps reflect what Summer already knows / is about to do next.
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
      id: "connect-business",
      label: `Connecting context for ${formatBusinessType(memory.businessType)}…`,
    });
  }

  if (memory.previousQuestions.length > 0 || memory.visitorName) {
    cues.push({
      id: "connect-previous",
      label: "Connecting previous information…",
    });
  }

  if (memory.currentSoftware) {
    cues.push({
      id: "compare-workflows",
      label: `Comparing workflows with ${memory.currentSoftware}…`,
    });
  }

  if (memory.challenges.length > 0 || memory.goals.length > 0) {
    cues.push({
      id: "identify-patterns",
      label: "Identifying patterns…",
    });
  }

  if (
    memory.discoveryPhase === "recommending" ||
    memory.recommendationsMade.length > 0 ||
    (memory.businessType !== "unknown" && memory.challenges.length > 0)
  ) {
    cues.push({
      id: "build-recommendations",
      label: "Building recommendations…",
    });
  }

  if (
    memory.discoveryPhase === "touring" ||
    memory.tourStepId ||
    memory.recommendationsMade.length > 0
  ) {
    cues.push({
      id: "prepare-tour",
      label: "Preparing a personalized tour…",
    });
  }

  if (cues.length < 2) {
    cues.push({
      id: "prepare-response",
      label: "Preparing a thoughtful response…",
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
