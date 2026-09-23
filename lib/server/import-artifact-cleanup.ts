import "server-only";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { ARTIFACT_REQUEST_TIMEOUT_MS, artifactBoundary, artifactRpc, CLEANUP_BATCH_SIZE, deleteArtifactObject } from "./import-artifact-storage";

type Service = ReturnType<typeof createServiceClient>;
const claimSchema = z.object({
  id: z.uuid(), lease_token: z.uuid(), raw_object_key: z.string(),
  reviewed_object_key: z.string().nullable(), raw_due: z.boolean(), reviewed_due: z.boolean(),
});

/** Internal worker. Caller supplies the authorized service client; no generic
 * route, keys or identities can be supplied from a browser.
 */
export async function cleanupArtifactBatch(service: Service, artifactId?: string) {
  const claims = z.array(claimSchema).max(CLEANUP_BATCH_SIZE).parse(await artifactRpc(service, "c1_claim_cleanup", {
    p_limit: artifactId ? 1 : CLEANUP_BATCH_SIZE, p_artifact: artifactId ?? null,
  }));
  const result = { claimed: claims.length, confirmed: 0, failed: 0 };
  // Bounded concurrency; each claim is independent and raw/reviewed successes
  // are persisted separately. A failure never aborts unrelated artifact cleanup.
  for (let offset = 0; offset < claims.length; offset += 5) {
    await Promise.all(claims.slice(offset, offset + 5).map(async claim => {
      const rawDeleted = claim.raw_due && await deleteArtifactObject(service, claim.raw_object_key);
      const reviewedDeleted = claim.reviewed_due && claim.reviewed_object_key !== null
        && await deleteArtifactObject(service, claim.reviewed_object_key);
      try {
        await artifactRpc(service, "c1_finish_cleanup", {
          p_artifact: claim.id, p_token: claim.lease_token,
          p_raw_deleted: rawDeleted, p_reviewed_deleted: reviewedDeleted,
        });
        if ((!claim.raw_due || rawDeleted) && (!claim.reviewed_due || reviewedDeleted)) result.confirmed++;
        else result.failed++;
      } catch { result.failed++; }
    }));
  }
  return result;
}

/** Dedicated cron only; its route MUST verify CRON_SECRET before invoking. */
export async function cleanupImportArtifacts() {
  return artifactBoundary(() => cleanupArtifactBatch(createServiceClient({ requestTimeoutMs: ARTIFACT_REQUEST_TIMEOUT_MS })));
}
