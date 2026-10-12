import "server-only";
import { z } from "zod";
import { requireBusiness, requireUser } from "@/lib/actions/business";
import { createServiceClient } from "@/lib/supabase/service";
import { paymentSnapshotSchema } from "./types";
import type { PaymentReadRequest, PaymentReadResult, PaymentReaderDependencies } from "./types";

const requestSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("one"), attemptId: z.uuid() }).strict(),
  z.object({ mode: z.literal("history"), cursor: z.string().regex(/^[0-9a-f]+$/).max(1024).optional(), limit: z.number().int().min(1).max(50).optional() }).strict(),
]);
const defaults: PaymentReaderDependencies = {
  async resolveAuthority() {
    const actor = await requireUser();
    const business = await requireBusiness();
    return { businessId: business.id, actorId: actor.id };
  },
  async rpc(args) { return await createServiceClient({ requestTimeoutMs: 10_000 }).rpc("read_payment_observability_v1", args); },
};

// Read-only, unwired, no revenue calculation and no automatic recovery action.
export async function readPaymentObservability(request: PaymentReadRequest, deps: PaymentReaderDependencies = defaults): Promise<PaymentReadResult> {
  const input = requestSchema.parse(request);
  let authority;
  try { authority = z.object({ businessId: z.uuid(), actorId: z.uuid() }).parse(await deps.resolveAuthority()); }
  catch { return { kind: "NOT_AUTHORIZED" }; }
  try {
    const response = await deps.rpc({ p_business_id: authority.businessId, p_actor_id: authority.actorId,
      p_mode: input.mode, p_attempt_id: input.mode === "one" ? input.attemptId : null,
      p_cursor: input.mode === "history" ? input.cursor ?? null : null,
      p_limit: input.mode === "history" ? input.limit ?? 25 : 1 });
    if (response.error) {
      const error = z.object({ code: z.string() }).safeParse(response.error);
      return { kind: error.success && error.data.code === "42501" ? "NOT_AUTHORIZED" : "UNKNOWN" };
    }
    const parsed = paymentSnapshotSchema.safeParse(response.data);
    if (!parsed.success || parsed.data.business_id !== authority.businessId) return { kind: "UNKNOWN" };
    const snapshot = parsed.data;
    if (input.mode === "one" && (snapshot.rows.length > 1 || snapshot.next_cursor !== null || snapshot.rows.some(row => row.attempt_id !== input.attemptId))) return { kind: "UNKNOWN" };
    if (input.mode === "history" && snapshot.rows.length > (input.limit ?? 25)) return { kind: "UNKNOWN" };
    if (new Set(snapshot.rows.map(row => row.attempt_id)).size !== snapshot.rows.length) return { kind: "UNKNOWN" };
    for (const row of snapshot.rows) {
      if (row.events.some((event, i) => i > 0 && row.events[i - 1].sequence >= event.sequence) ||
        new Set(row.obligations.map(o => o.kind)).size !== row.obligations.length) return { kind: "UNKNOWN" };
      if (row.operator_state === "UNKNOWN" && row.synchronization !== "UNKNOWN") return { kind: "UNKNOWN" };
      if (row.operator_state === "NOT_RECORDED" && (row.ledger_count !== 0 || row.ledger !== null || !["FAILED", "SKIPPED"].includes(row.execution_state) || row.synchronization !== "NOT_REQUIRED")) return { kind: "UNKNOWN" };
      if (row.operator_state === "PAYMENT_RECOVERY_REQUIRED" && (row.execution_state !== "REQUESTED" || row.recovery_disposition !== "RECOVER" || row.ledger_count !== 0 || row.ledger !== null || row.synchronization !== "PENDING")) return { kind: "UNKNOWN" };
      if (row.operator_state === "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED" && (row.synchronization !== "PENDING" || !row.obligations.some(o => ["PENDING", "FAILED"].includes(o.state)))) return { kind: "UNKNOWN" };
      if (row.operator_state.startsWith("RECORDED") && (row.execution_state !== "ACCEPTED" || row.ledger_count !== 1 || !row.ledger || row.obligations.length !== 4 ||
        row.ledger.amount_cents !== row.amount_cents || row.ledger.currency !== row.currency || row.ledger.appointment_id !== row.appointment_id || row.ledger.method !== row.method || row.ledger.kind !== row.payment_kind || row.ledger.provider !== row.provider_route || row.ledger.status !== "succeeded")) return { kind: "UNKNOWN" };
      if (row.operator_state === "RECORDED" && (row.synchronization !== "COMPLETE" || row.obligations.some(o => !["COMPLETE", "NOT_REQUIRED"].includes(o.state)))) return { kind: "UNKNOWN" };
    }
    return { kind: "SNAPSHOT", snapshot };
  } catch { return { kind: "UNKNOWN" }; }
}
