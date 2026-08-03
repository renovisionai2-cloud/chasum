/**
 * Platform resource model (rooms, chairs, equipment, etc.).
 * Persistence is feature-flagged and migrations remain unapplied until approved.
 */

export const RESOURCES_FEATURE_FLAG = "CHASUM_RESOURCES_ENABLED";

/** True only when explicitly enabled — default off for Preview safety. */
export function isResourcesFeatureEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const v = env.CHASUM_RESOURCES_ENABLED ?? env.NEXT_PUBLIC_CHASUM_RESOURCES_ENABLED;
  return v === "1" || v === "true";
}

export type ResourceType =
  | "room"
  | "chair"
  | "equipment"
  | "bay"
  | "vehicle"
  | "studio"
  | "booth"
  | "court"
  | "table"
  | "other";

export type BookingResource = {
  id: string;
  businessId: string;
  locationId: string;
  name: string;
  type: ResourceType;
  description: string | null;
  isActive: boolean;
  /** Concurrent appointments this resource can support. Default 1. */
  capacity: number;
  color: string | null;
  sortOrder: number;
};

export type ServiceResourceRequirement = {
  serviceId: string;
  resourceType: ResourceType;
  quantity: number;
  /** When empty, any active resource of the type at the location is eligible. */
  eligibleResourceIds: string[];
  allowAutomaticAssignment: boolean;
  allowManualSelection: boolean;
  allowAssignLater: boolean;
};

export type AppointmentResourceAssignment = {
  appointmentId: string;
  resourceId: string;
  source: "automatic" | "manual";
};

export type ResourceBusyBlock = {
  resourceId: string;
  startIso: string;
  endIso: string;
  capacityUsed?: number;
};

export type ResourceAllocationInput = {
  startIso: string;
  endIso: string;
  requirements: ServiceResourceRequirement[];
  resources: BookingResource[];
  busy: ResourceBusyBlock[];
  preferredResourceIds?: string[];
};

export type ResourceAllocationResult =
  | {
      ok: true;
      assignments: Array<{ resourceId: string; resourceType: ResourceType }>;
    }
  | {
      ok: false;
      reason: string;
      missingType?: ResourceType;
    };

function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Pure allocator: for each requirement, pick eligible resources with free
 * capacity for the full appointment window. Deterministic: preferred ids
 * first, then sortOrder, then name.
 */
export function allocateResources(
  input: ResourceAllocationInput,
): ResourceAllocationResult {
  const start = Date.parse(input.startIso);
  const end = Date.parse(input.endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { ok: false, reason: "Invalid appointment time range." };
  }

  const used = new Map<string, number>();
  const assignments: Array<{ resourceId: string; resourceType: ResourceType }> =
    [];

  for (const req of input.requirements) {
    const eligible = input.resources
      .filter(
        (r) =>
          r.isActive &&
          r.type === req.resourceType &&
          (req.eligibleResourceIds.length === 0 ||
            req.eligibleResourceIds.includes(r.id)),
      )
      .slice()
      .sort((a, b) => {
        const pref = input.preferredResourceIds ?? [];
        const ap = pref.indexOf(a.id);
        const bp = pref.indexOf(b.id);
        if (ap !== -1 || bp !== -1) {
          if (ap === -1) return 1;
          if (bp === -1) return -1;
          return ap - bp;
        }
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name);
      });

    let remaining = Math.max(1, req.quantity);
    for (const resource of eligible) {
      if (remaining <= 0) break;
      const busyLoad = input.busy
        .filter(
          (b) =>
            b.resourceId === resource.id &&
            overlaps(start, end, Date.parse(b.startIso), Date.parse(b.endIso)),
        )
        .reduce((sum, b) => sum + (b.capacityUsed ?? 1), 0);
      const already = used.get(resource.id) ?? 0;
      const free = Math.max(0, resource.capacity - busyLoad - already);
      if (free <= 0) continue;
      used.set(resource.id, already + 1);
      assignments.push({
        resourceId: resource.id,
        resourceType: resource.type,
      });
      remaining -= 1;
    }

    if (remaining > 0) {
      const label =
        req.resourceType === "room"
          ? "rooms"
          : req.resourceType === "chair"
            ? "chairs"
            : `${req.resourceType}s`;
      return {
        ok: false,
        reason: `No ${label} are available for this service at the selected time.`,
        missingType: req.resourceType,
      };
    }
  }

  return { ok: true, assignments };
}

/**
 * Concurrent booking capacity for a type: limited by the scarcer of
 * eligible employees vs free resource capacity (simplified pure check).
 */
export function maxConcurrentByResources(input: {
  eligibleEmployeeCount: number;
  freeResourceCapacity: number;
}): number {
  return Math.max(
    0,
    Math.min(input.eligibleEmployeeCount, input.freeResourceCapacity),
  );
}
