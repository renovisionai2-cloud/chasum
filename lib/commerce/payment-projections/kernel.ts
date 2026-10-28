import "server-only";
import { requireBusiness, requireUser } from "@/lib/actions/business";
import { createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";
import { projectionKinds, projectionResultSchema } from "./types";
import type { ProjectionDependencies, ProjectionRequest, ProjectionResult } from "./types";

const rpcNames = {
  appointment_cache: "project_payment_appointment_cache_v1",
  invoice_settlement: "project_payment_invoice_settlement_v1",
  customer_payment_events: "project_payment_customer_payment_events_v1",
  receipt: "project_payment_receipt_v1",
} as const;

const dependencies: ProjectionDependencies = {
  async resolveBusinessId() {
    await requireUser();
    return (await requireBusiness()).id;
  },
  async rpc(name, args) {
    return await createServiceClient({ requestTimeoutMs: 10_000 }).rpc(name, args);
  },
};

// Unwired. Database admission is mandatory even when a trusted server invokes this.
// No automatic retries: uncertain transport requires rereading this SAME obligation.
export async function projectPaymentObligation(
  request: ProjectionRequest,
  deps: ProjectionDependencies = dependencies,
): Promise<ProjectionResult> {
  const input = z.object({ attemptId: z.uuid(), kind: z.enum(projectionKinds) }).strict().parse(request);
  const businessId = z.uuid().parse(await deps.resolveBusinessId());
  const unknown: ProjectionResult = { outcome: "UNKNOWN", business_id: businessId, attempt_id: input.attemptId, projection_kind: input.kind };
  try {
    const response = await deps.rpc(rpcNames[input.kind], { p_business_id: businessId, p_attempt_id: input.attemptId });
    if (response.error) return unknown;
    const parsed = projectionResultSchema.safeParse(response.data);
    if (!parsed.success || parsed.data.business_id !== businessId || parsed.data.attempt_id !== input.attemptId || parsed.data.projection_kind !== input.kind) return unknown;
    const result = parsed.data;
    if (["APPLIED", "VERIFIED"].includes(result.outcome) &&
      (!["COMPLETE", "NOT_REQUIRED"].includes(result.state ?? "") || result.failure_code != null)) return unknown;
    if (result.outcome === "FAILED" && (result.state !== "FAILED" || !result.failure_code)) return unknown;
    if (result.outcome === "VERIFICATION_MISMATCH" && (!["COMPLETE", "NOT_REQUIRED"].includes(result.state ?? "") || !result.failure_code)) return unknown;
    return result;
  } catch { return unknown; }
}
