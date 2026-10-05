import "server-only";

import { requireBusiness, requireUser } from "@/lib/actions/business";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import {
  assertCanonicalUuid,
  normalizeR1aManualIntent,
} from "./normalize";
import { mapAdmissionRpcResult, mapCommitRpcResult } from "./mappers";
import type {
  AdmissionOutcome,
  CommitOutcome,
  ManualPaymentAttemptRequest,
  ManualPaymentAttemptResult,
  NormalizedPaymentIntentV1,
  PaymentAttemptAuthority,
  PaymentAttemptStoredIdentity,
} from "./types";

type RecoveryResult =
  | { kind: "FOUND"; attempt: PaymentAttemptStoredIdentity }
  | { kind: "ABSENT" }
  | { kind: "UNKNOWN"; reason: string };

export type PaymentAttemptKernelDependencies = {
  admissionEnabled: boolean;
  resolveAuthority(): Promise<PaymentAttemptAuthority>;
  validateBinding(
    authority: PaymentAttemptAuthority,
    intent: NormalizedPaymentIntentV1,
  ): Promise<boolean>;
  recover(businessId: string, attemptKey: string): Promise<RecoveryResult>;
  admit(input: {
    authority: PaymentAttemptAuthority;
    request: ManualPaymentAttemptRequest;
    intent: NormalizedPaymentIntentV1;
    attemptKey: string;
  }): Promise<AdmissionOutcome>;
  commit(businessId: string, attemptId: string): Promise<CommitOutcome>;
};

export async function runManualPaymentAttemptKernel(
  request: ManualPaymentAttemptRequest,
  dependencies: PaymentAttemptKernelDependencies,
): Promise<ManualPaymentAttemptResult> {
  let attemptKey: string;
  try {
    attemptKey = assertCanonicalUuid(request.attemptKey, "attemptKey");
  } catch (error) {
    return {
      kind: "INVALID",
      reason: error instanceof Error ? error.message : "Invalid attempt identity.",
    };
  }
  const authority = await dependencies.resolveAuthority();
  let intent: NormalizedPaymentIntentV1;
  try {
    intent = normalizeR1aManualIntent(authority, request);
  } catch (error) {
    return {
      kind: "INVALID",
      reason: error instanceof Error ? error.message : "Invalid payment intent.",
    };
  }

  if (!(await dependencies.validateBinding(authority, intent))) {
    return {
      kind: "INVALID",
      reason: "Customer or appointment binding is not authorized.",
    };
  }

  const recovery = await dependencies.recover(
    authority.businessId,
    attemptKey,
  );
  if (recovery.kind === "UNKNOWN") {
    return {
      kind: "UNKNOWN",
      attemptId: null,
      transactionId: null,
      recorded: false,
      synchronization: "UNKNOWN",
      reason: recovery.reason,
    };
  }
  if (recovery.kind === "ABSENT" && !dependencies.admissionEnabled) {
    return { kind: "NOT_ADMITTED_DISABLED" };
  }

  const admission = await dependencies.admit({
    authority,
    request,
    intent,
    attemptKey,
  });
  if (admission.kind === "UNKNOWN" || admission.kind === "KEY_CONFLICT") {
    return admission;
  }

  return dependencies.commit(authority.businessId, admission.attemptId);
}

async function resolveCurrentAuthority(): Promise<PaymentAttemptAuthority> {
  const user = await requireUser();
  const business = await requireBusiness();
  const currency = business.currency?.trim().toLowerCase() ?? "";
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new Error("The active Business currency is not configured.");
  }
  return {
    actorId: assertCanonicalUuid(user.id, "actorId"),
    businessId: assertCanonicalUuid(business.id, "businessId"),
    currency,
  };
}

async function validateCurrentBinding(
  authority: PaymentAttemptAuthority,
  intent: NormalizedPaymentIntentV1,
): Promise<boolean> {
  const supabase = await createClient();
  const customer = await supabase
    .from("customers")
    .select("id")
    .eq("id", intent.customerId)
    .eq("business_id", authority.businessId)
    .maybeSingle();
  if (customer.error || !customer.data) return false;
  if (intent.target === "customer") return true;
  if (intent.target !== "appointment" || !intent.targetId) return false;

  const appointment = await supabase
    .from("appointments")
    .select("id, customer_id")
    .eq("id", intent.targetId)
    .eq("business_id", authority.businessId)
    .eq("customer_id", intent.customerId)
    .maybeSingle();
  return !appointment.error && Boolean(appointment.data);
}

function createProductionDependencies(): PaymentAttemptKernelDependencies {
  let serviceClient: ReturnType<typeof createServiceClient> | null = null;
  const service = () => {
    serviceClient ??= createServiceClient({ requestTimeoutMs: 10_000 });
    return serviceClient;
  };

  return {
    // FLAG ACTIVATION FOR APPLICATION TRAFFIC IS PROHIBITED until the separately
    // reviewed projection/workflow gate. R1a remains inert and unwired.
    admissionEnabled: false,
    resolveAuthority: resolveCurrentAuthority,
    validateBinding: validateCurrentBinding,
    async recover(businessId, attemptKey) {
      const { data, error } = await service()
        .from("commerce_payment_attempts")
        .select("id, business_id, attempt_key, execution_state")
        .eq("business_id", businessId)
        .eq("attempt_key", attemptKey)
        .maybeSingle();
      if (error) {
        return {
          kind: "UNKNOWN",
          reason: `Canonical recovery is uncertain: ${error.message}`,
        };
      }
      if (!data) return { kind: "ABSENT" };
      if (
        typeof data.id !== "string" ||
        typeof data.business_id !== "string" ||
        typeof data.attempt_key !== "string" ||
        !["REQUESTED", "ACCEPTED", "FAILED", "SKIPPED"].includes(
          String(data.execution_state),
        )
      ) {
        return {
          kind: "UNKNOWN",
          reason: "Canonical recovery returned an invalid identity.",
        };
      }
      return {
        kind: "FOUND",
        attempt: data as PaymentAttemptStoredIdentity,
      };
    },
    async admit({ authority, request, intent, attemptKey }) {
      const { data, error } = await service().rpc("admit_payment_attempt_v1", {
        p_business_id: authority.businessId,
        p_attempt_key: attemptKey,
        p_request_fingerprint: intent.fingerprint,
        p_source: request.source,
        p_customer_id: intent.customerId,
        p_appointment_id:
          intent.target === "appointment" ? intent.targetId : null,
        p_actor_id: authority.actorId,
        p_payment_kind: intent.paymentKind,
        p_amount_cents: intent.amountCents,
        p_currency: intent.currency,
        p_method: intent.method,
        p_provider_route: intent.providerRoute,
      });
      return mapAdmissionRpcResult(data, error);
    },
    async commit(businessId, attemptId) {
      const { data, error } = await service().rpc(
        "commit_manual_payment_attempt_v1",
        {
          p_business_id: businessId,
          p_attempt_id: attemptId,
        },
      );
      return mapCommitRpcResult(data, error);
    },
  };
}

export async function recordPreparedManualPaymentAttempt(
  request: ManualPaymentAttemptRequest,
): Promise<ManualPaymentAttemptResult> {
  return runManualPaymentAttemptKernel(request, createProductionDependencies());
}
