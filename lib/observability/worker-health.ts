import type { JobStatus, JobType } from "@/lib/types/integrations";

export const PENDING_OVERDUE_GRACE_MS = 15 * 60 * 1000;
export const PROCESSING_STALE_MS = 15 * 60 * 1000;

const KNOWN_JOB_TYPES = new Set<JobType>([
  "email",
  "sms",
  "calendar_sync",
  "webhook",
  "reminder",
  "recurring",
  "waitlist_notify",
]);

export type WorkerHealthState =
  | "FUTURE_PENDING"
  | "PENDING_GRACE"
  | "HELD_BY_CONFIG"
  | "OVERDUE_PENDING"
  | "FAILED"
  | "FRESH_PROCESSING"
  | "STALE_PROCESSING"
  | "COMPLETED"
  | "CANCELLED"
  | "INVALID";

export type WorkerHealthPolicy = {
  now: Date;
  workerReliabilityEnabled: boolean;
  workerWebhooksEnabled: boolean;
  pendingOverdueGraceMs?: number;
  processingStaleMs?: number;
};

export type WorkerHealthInput = {
  status: JobStatus | string;
  job_type: JobType | string;
  scheduled_at: string | null | undefined;
  started_at: string | null | undefined;
  next_retry_at: string | null | undefined;
  cancelled_at?: string | null | undefined;
};

function timestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Classify a queue row without reading environment variables or the database.
 * next_retry_at is authoritative when it moves eligibility into the future.
 */
export function classifyWorkerJob(
  job: WorkerHealthInput,
  policy: WorkerHealthPolicy,
): WorkerHealthState {
  if (!Number.isFinite(policy.now.getTime())) return "INVALID";
  if (!KNOWN_JOB_TYPES.has(job.job_type as JobType)) return "INVALID";
  if (job.cancelled_at != null) return "CANCELLED";

  switch (job.status) {
    case "failed":
      return "FAILED";
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return "CANCELLED";
    case "processing": {
      const started = timestamp(job.started_at);
      const now = policy.now.getTime();
      if (started === null || started > now) return "INVALID";
      return now - started > (policy.processingStaleMs ?? PROCESSING_STALE_MS)
        ? "STALE_PROCESSING"
        : "FRESH_PROCESSING";
    }
    case "pending": {
      const scheduled = timestamp(job.scheduled_at);
      const retryAt = timestamp(job.next_retry_at);
      if (
        scheduled === null ||
        (job.next_retry_at != null && retryAt === null)
      ) {
        return "INVALID";
      }

      const now = policy.now.getTime();
      const eligibleAt = Math.max(
        scheduled,
        retryAt ?? Number.NEGATIVE_INFINITY,
      );
      if (eligibleAt > now) return "FUTURE_PENDING";

      if (
        !policy.workerReliabilityEnabled ||
        (job.job_type === "webhook" && !policy.workerWebhooksEnabled)
      ) {
        return "HELD_BY_CONFIG";
      }

      const grace =
        policy.pendingOverdueGraceMs ?? PENDING_OVERDUE_GRACE_MS;
      return now - eligibleAt > grace ? "OVERDUE_PENDING" : "PENDING_GRACE";
    }
    default:
      return "INVALID";
  }
}
