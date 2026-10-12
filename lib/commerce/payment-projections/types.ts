import { z } from "zod";

export const projectionKinds = ["appointment_cache", "invoice_settlement", "customer_payment_events", "receipt"] as const;
export type ProjectionKind = (typeof projectionKinds)[number];
export const projectionResultSchema = z.object({
  outcome: z.enum(["NOT_ADMITTED", "UNKNOWN", "APPLIED", "VERIFIED", "VERIFICATION_MISMATCH", "FAILED"]),
  business_id: z.uuid(), attempt_id: z.uuid(), projection_kind: z.enum(projectionKinds),
  state: z.enum(["PENDING", "FAILED", "COMPLETE", "NOT_REQUIRED"]).optional(),
  target_id: z.uuid().nullable().optional(),
  failure_code: z.enum(["PROJECTION_FAILED", "PROJECTION_UNCERTAIN"]).nullable().optional(),
}).strict();
export type ProjectionResult = z.infer<typeof projectionResultSchema>;
export type ProjectionRequest = { attemptId: string; kind: ProjectionKind };
export type ProjectionDependencies = {
  resolveBusinessId(): Promise<string>;
  rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
};
