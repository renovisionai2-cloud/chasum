import type { SessionMemory } from "@/lib/website-concierge/types";
import { FS_REASONING_STEPS } from "@/lib/marketing/flagship-summer";

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
  options?: {
    businessOverride?: string | null;
    /** When true, always return the full profile scaffold (ellipsis for empty) */
    showPending?: boolean;
  },
): UnderstandingField[] {
  const businessLabel =
    options?.businessOverride?.trim() ||
    (memory.businessType !== "unknown"
      ? formatBusinessType(memory.businessType)
      : null);

  const fields: UnderstandingField[] = [
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
      label: "Current Software",
      value: memory.currentSoftware,
      discovered: !!memory.currentSoftware,
    },
    {
      id: "pain",
      label: "Biggest Challenge",
      value: memory.challenges[0] ?? null,
      discovered: memory.challenges.length > 0,
    },
    {
      id: "goals",
      label: "Goals",
      value: memory.goals[0] ?? memory.growthPlans,
      discovered: memory.goals.length > 0 || !!memory.growthPlans,
    },
  ];

  if (!options?.showPending) {
    return fields;
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
