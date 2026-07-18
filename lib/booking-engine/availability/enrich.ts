import { addMinutes, parseISO } from "date-fns";
import { applyPolicyChecks } from "@/lib/booking-engine/availability/query-policy";
import {
  getAvailabilityExtensions,
  type AvailabilityExtensionContext,
} from "@/lib/booking-engine/availability/extensions";
import {
  compareSlotCandidates,
  scoreSlot,
} from "@/lib/booking-engine/availability/score";
import type {
  AvailabilityContext,
  PreviewSlotsInput,
  SlotCandidate,
} from "@/lib/booking-engine/types";

/**
 * Turn authoritative RPC starts into rich SlotCandidates.
 * Never invents times — only annotates / filters with composed policy.
 */
export async function enrichSlotCandidates(input: {
  starts: string[];
  preview: PreviewSlotsInput;
  context: AvailabilityContext;
}): Promise<SlotCandidate[]> {
  const extensions = getAvailabilityExtensions();
  const extCtx: AvailabilityExtensionContext = {
    input: input.preview,
    context: input.context,
    rpcStarts: input.starts,
  };

  const policyFiltered: string[] = [];
  for (const start of input.starts) {
    const conflicts = applyPolicyChecks(input.context, start);
    if (conflicts.length === 0) {
      policyFiltered.push(start);
    }
  }

  const total = policyFiltered.length;
  const candidates: SlotCandidate[] = [];

  for (let i = 0; i < policyFiltered.length; i += 1) {
    const start = policyFiltered[i]!;
    const end = addMinutes(
      parseISO(start),
      input.context.durationMinutes,
    ).toISOString();

    const { score, warnings } = scoreSlot({
      startIso: start,
      context: input.context,
      index: i,
      total,
    });

    let resourceIds: string[] = [];
    if (extensions.resolveSlotResources) {
      resourceIds = await extensions.resolveSlotResources(extCtx, start);
    }

    let candidate: SlotCandidate = {
      start,
      end,
      staffId: input.preview.staffId,
      locationId: input.preview.locationId,
      serviceId: input.preview.serviceId,
      resourceIds,
      score,
      reason: "AVAILABLE",
      warnings,
    };

    if (extensions.adjustSlotScore) {
      candidate = {
        ...candidate,
        score: await extensions.adjustSlotScore(candidate, extCtx),
      };
    }

    candidates.push(candidate);
  }

  candidates.sort(compareSlotCandidates);

  if (extensions.postProcessSlots) {
    return extensions.postProcessSlots(candidates, extCtx);
  }

  return candidates;
}
