import { randomUUID } from "node:crypto";
import { logger } from "@/lib/observability/logger";
import type { createServiceClient } from "@/lib/supabase/service";
import type { BackgroundJob } from "@/lib/types/integrations";

export const WORKER_CLAIM_PREFIX = "worker_claim:";
export const SAFE_RETRY_PREFIX = "retry_safe:";
export const RECONCILIATION_REQUIRED_PREFIX = "reconciliation_required:";

export type ClaimedBackgroundJob = BackgroundJob & {
  status: "processing";
  started_at: string;
  error_message: string;
};

export type JobFinalization = {
  status: "completed" | "failed" | "pending";
  completed_at: string | null;
  error_message: string | null;
  next_retry_at: string | null;
  scheduled_at?: string;
};

type ServiceClient = ReturnType<typeof createServiceClient>;

/**
 * One database UPDATE owns the job. Both workers may read the same candidate;
 * only an UPDATE whose eligibility/attempt predicates still match can return it.
 * No RPC or new columns are needed. This requires the separately governed 029.
 */
export async function claimBackgroundJob(
  client: ServiceClient,
  candidate: BackgroundJob,
  now = new Date(),
): Promise<ClaimedBackgroundJob | null> {
  const at = now.toISOString();
  if (
    candidate.status !== "pending" ||
    candidate.cancelled_at != null ||
    !Number.isInteger(candidate.attempts) ||
    candidate.attempts < 0 ||
    !Number.isInteger(candidate.max_attempts) ||
    candidate.attempts >= candidate.max_attempts ||
    !Number.isFinite(Date.parse(candidate.scheduled_at)) ||
    Date.parse(candidate.scheduled_at) > now.getTime() ||
    (candidate.next_retry_at != null &&
      (!Number.isFinite(Date.parse(candidate.next_retry_at)) ||
        Date.parse(candidate.next_retry_at) > now.getTime()))
  ) {
    return null;
  }

  const claimId = randomUUID();
  let update = client
    .from("background_jobs")
    .update({
      status: "processing",
      attempts: candidate.attempts + 1,
      started_at: at,
      error_message: `${WORKER_CLAIM_PREFIX}${claimId}`,
    })
    .eq("id", candidate.id)
    .eq("status", "pending")
    .eq("attempts", candidate.attempts)
    .eq("max_attempts", candidate.max_attempts)
    .is("cancelled_at", null)
    .lte("scheduled_at", at)
    .or(`next_retry_at.is.null,next_retry_at.lte.${at}`);
  update = candidate.business_id == null
    ? update.is("business_id", null)
    : update.eq("business_id", candidate.business_id);
  const { data, error } = await Promise.resolve(update.select("*")).catch(() => {
    logger.error("worker", "claim_persistence_failed", {
      jobId: candidate.id, businessId: candidate.business_id, claimId,
      databaseCode: "transport_failure",
    });
    throw new Error(`Worker claim could not be confirmed for job ${candidate.id}.`);
  });

  if (error) {
    logger.error("worker", "claim_persistence_failed", {
      jobId: candidate.id,
      businessId: candidate.business_id,
      claimId,
      databaseCode: error.code,
    });
    throw new Error(`Worker claim could not be confirmed for job ${candidate.id}.`);
  }
  if (!data?.length) return null;
  if (data.length !== 1) throw new Error("Worker claim returned an invalid row count.");
  const claimed = data[0] as ClaimedBackgroundJob;
  if (
    claimed.id !== candidate.id ||
    claimed.business_id !== candidate.business_id ||
    claimed.status !== "processing" ||
    claimed.attempts !== candidate.attempts + 1 ||
    claimed.error_message !== `${WORKER_CLAIM_PREFIX}${claimId}` ||
    !claimed.started_at
  ) {
    throw new Error("Worker claim response did not match the acquired ownership.");
  }
  logger.info("worker", "job_claimed", {
    jobId: claimed.id,
    businessId: claimed.business_id,
    claimId,
    attempt: claimed.attempts,
  });
  return claimed;
}

/** Checked and fenced: losing ownership must never overwrite another outcome. */
export async function finalizeClaimedJob(
  client: ServiceClient,
  claim: ClaimedBackgroundJob,
  result: JobFinalization,
): Promise<void> {
  let update = client
    .from("background_jobs")
    .update(result)
    .eq("id", claim.id)
    .eq("status", "processing")
    .eq("attempts", claim.attempts)
    .eq("started_at", claim.started_at)
    .eq("error_message", claim.error_message);
  update = claim.business_id == null
    ? update.is("business_id", null)
    : update.eq("business_id", claim.business_id);
  const { data, error } = await Promise.resolve(update.select("id")).catch(() => {
    logger.error("worker", "job_finalization_unconfirmed", {
      jobId: claim.id, businessId: claim.business_id,
      claimId: claim.error_message.slice(WORKER_CLAIM_PREFIX.length),
      attempt: claim.attempts, intendedStatus: result.status,
      databaseCode: "transport_failure",
    });
    throw new Error(`Worker finalization requires reconciliation for job ${claim.id}.`);
  });
  if (error || data?.length !== 1 || data[0].id !== claim.id) {
    logger.error("worker", "job_finalization_unconfirmed", {
      jobId: claim.id,
      businessId: claim.business_id,
      claimId: claim.error_message.slice(WORKER_CLAIM_PREFIX.length),
      attempt: claim.attempts,
      intendedStatus: result.status,
      databaseCode: error?.code ?? null,
      affectedRows: data?.length ?? null,
    });
    throw new Error(`Worker finalization requires reconciliation for job ${claim.id}.`);
  }
  logger.info("worker", "job_finalized", {
    jobId: claim.id,
    businessId: claim.business_id,
    claimId: claim.error_message.slice(WORKER_CLAIM_PREFIX.length),
    attempt: claim.attempts,
    status: result.status,
  });
}
