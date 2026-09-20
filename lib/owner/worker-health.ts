import { requirePlatformOwner } from "@/lib/owner/auth";
import {
  classifyWorkerJob,
  type WorkerHealthInput,
  type WorkerHealthPolicy,
  type WorkerHealthState,
} from "@/lib/observability/worker-health";
import {
  workerReliabilityEnabled,
  workerWebhooksEnabled,
} from "@/lib/communications/reliability-config";
import { createServiceClient } from "@/lib/supabase/service";

export type OwnerWorkerHealthCounts = {
  futurePending: number;
  pendingGrace: number;
  heldByConfig: number;
  overduePending: number;
  failed: number;
  freshProcessing: number;
  staleProcessing: number;
  invalid: number;
};

export type OwnerWorkerHealthSnapshot =
  | {
      available: true;
      counts: OwnerWorkerHealthCounts;
      totalJobs: number;
      oldestOverdueAt: string | null;
      errorCode: null;
    }
  | {
      available: false;
      counts: null;
      totalJobs: null;
      oldestOverdueAt: null;
      errorCode: "worker_health_unavailable";
    };

const JOB_SELECT =
  "status, job_type, scheduled_at, started_at, next_retry_at, cancelled_at";

function emptyCounts(): OwnerWorkerHealthCounts {
  return {
    futurePending: 0,
    pendingGrace: 0,
    heldByConfig: 0,
    overduePending: 0,
    failed: 0,
    freshProcessing: 0,
    staleProcessing: 0,
    invalid: 0,
  };
}

function incrementState(
  counts: OwnerWorkerHealthCounts,
  state: WorkerHealthState,
): void {
  switch (state) {
    case "FUTURE_PENDING":
      counts.futurePending += 1;
      break;
    case "PENDING_GRACE":
      counts.pendingGrace += 1;
      break;
    case "HELD_BY_CONFIG":
      counts.heldByConfig += 1;
      break;
    case "OVERDUE_PENDING":
      counts.overduePending += 1;
      break;
    case "FAILED":
      counts.failed += 1;
      break;
    case "FRESH_PROCESSING":
      counts.freshProcessing += 1;
      break;
    case "STALE_PROCESSING":
      counts.staleProcessing += 1;
      break;
    case "INVALID":
      counts.invalid += 1;
      break;
    case "COMPLETED":
    case "CANCELLED":
      break;
  }
}

function effectiveEligibilityAt(row: WorkerHealthInput): number | null {
  const scheduled = row.scheduled_at ? Date.parse(row.scheduled_at) : Number.NaN;
  if (!Number.isFinite(scheduled)) return null;

  if (row.next_retry_at == null) return scheduled;
  const retryAt = Date.parse(row.next_retry_at);
  if (!Number.isFinite(retryAt)) return null;
  return Math.max(scheduled, retryAt);
}

export function summarizeOwnerWorkerHealth(
  rows: WorkerHealthInput[],
  policy: WorkerHealthPolicy,
): OwnerWorkerHealthSnapshot {
  const counts = emptyCounts();
  let oldestOverdueMs: number | null = null;

  for (const row of rows) {
    const state = classifyWorkerJob(row, policy);
    incrementState(counts, state);

    if (state === "OVERDUE_PENDING") {
      const eligibleAt = effectiveEligibilityAt(row);
      if (
        eligibleAt !== null &&
        (oldestOverdueMs === null || eligibleAt < oldestOverdueMs)
      ) {
        oldestOverdueMs = eligibleAt;
      }
    }
  }

  return {
    available: true,
    counts,
    totalJobs: rows.length,
    oldestOverdueAt:
      oldestOverdueMs === null ? null : new Date(oldestOverdueMs).toISOString(),
    errorCode: null,
  };
}

export function unavailableOwnerWorkerHealth(): OwnerWorkerHealthSnapshot {
  return {
    available: false,
    counts: null,
    totalJobs: null,
    oldestOverdueAt: null,
    errorCode: "worker_health_unavailable",
  };
}

export async function getOwnerWorkerHealthSnapshot(): Promise<OwnerWorkerHealthSnapshot> {
  await requirePlatformOwner();

  try {
    const service = createServiceClient();
    const rows: WorkerHealthInput[] = [];
    const pageSize = 1000;

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await service
        .from("background_jobs")
        .select(JOB_SELECT)
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) return unavailableOwnerWorkerHealth();

      const page = (data ?? []) as WorkerHealthInput[];
      rows.push(...page);
      if (page.length < pageSize) break;
    }

    return summarizeOwnerWorkerHealth(rows, {
      now: new Date(),
      workerReliabilityEnabled: workerReliabilityEnabled(),
      workerWebhooksEnabled: workerWebhooksEnabled(),
    });
  } catch {
    return unavailableOwnerWorkerHealth();
  }
}
