import { differenceInMinutes, parseISO } from "date-fns";
import type {
  AvailabilityContext,
  SlotCandidate,
  SlotWarning,
} from "@/lib/booking-engine/types";

/**
 * Availability score 0–100.
 * Higher = preferred for Summer / reception “next best” ranking.
 */
export function scoreSlot(input: {
  startIso: string;
  context: AvailabilityContext;
  index: number;
  total: number;
  now?: Date;
}): { score: number; warnings: SlotWarning[] } {
  const now = input.now ?? new Date();
  const start = parseISO(input.startIso);
  const minutesFromNow = Math.max(0, differenceInMinutes(start, now));
  const warnings: SlotWarning[] = [];

  let score = 55;

  // Priority scheduling (Employees module)
  score += Math.min(25, Math.max(0, input.context.priorityScheduling) * 5);

  // Prefer sooner slots slightly (without crushing later options)
  const earliness = Math.max(0, 20 - Math.floor(minutesFromNow / 60));
  score += earliness;

  // Scarcity: fewer total slots → boost remaining
  if (input.total > 0 && input.total <= 3) {
    score += 8;
    warnings.push({
      code: "LIMITED_AVAILABILITY",
      message: "Limited availability for this day.",
    });
  } else if (input.total > 0 && input.index >= input.total - 2) {
    warnings.push({
      code: "LIMITED_AVAILABILITY",
      message: "Few openings remain later in the day.",
    });
  }

  if (minutesFromNow > 0 && minutesFromNow < 120) {
    warnings.push({
      code: "SHORT_NOTICE",
      message: "This slot starts within two hours.",
    });
  }

  if (input.context.priorityScheduling > 0) {
    warnings.push({
      code: "PRIORITY_STAFF",
      message: "Preferred employee for this service.",
    });
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, warnings };
}

export function compareSlotCandidates(a: SlotCandidate, b: SlotCandidate): number {
  if (b.score !== a.score) return b.score - a.score;
  return new Date(a.start).getTime() - new Date(b.start).getTime();
}
