import "server-only";

import { requireBusiness, requireUser } from "@/lib/actions/business";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import {
  assertCanonicalUuid,
  assertSupportedBusinessCurrency,
  isCanonicalUuid,
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

  let bindingIsValid: boolean;
  try {
    bindingIsValid = await dependencies.validateBinding(authority, intent);
  } catch {
    return {
      kind: "UNKNOWN",
      attemptId: null,
      transactionId: null,
      recorded: false,
      synchronization: "UNKNOWN",
      reason: "Customer or appointment binding is uncertain.",
    };
  }
  if (!bindingIsValid) {
    return {
      kind: "INVALID",
      reason: "Customer or appointment binding is not authorized.",
    };
  }

  let recovery: RecoveryResult;
  try {
    recovery = await dependencies.recover(authority.businessId, attemptKey);
  } catch {
    return {
      kind: "UNKNOWN",
      attemptId: null,
      transactionId: null,
      recorded: false,
      synchronization: "UNKNOWN",
      reason: "Canonical recovery transport is uncertain.",
    };
  }
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
  if (
    recovery.kind === "FOUND" &&
    (!isCanonicalUuid(recovery.attempt.id) ||
      !isCanonicalUuid(recovery.attempt.business_id) ||
      !isCanonicalUuid(recovery.attempt.attempt_key) ||
      recovery.attempt.business_id !== authority.businessId ||
      recovery.attempt.attempt_key !== attemptKey)
  ) {
    return {
      kind: "UNKNOWN",
      attemptId: null,
      transactionId: null,
      recorded: false,
      synchronization: "UNKNOWN",
      reason: "Canonical recovery returned a mismatched identity.",
    };
  }
  if (recovery.kind === "ABSENT" && !dependencies.admissionEnabled) {
    return { kind: "NOT_ADMITTED_DISABLED" };
  }

  let admission: AdmissionOutcome;
  try {
    admission = await dependencies.admit({
      authority,
      request,
      intent,
      attemptKey,
    });
  } catch {
    return {
      kind: "UNKNOWN",
      reason: "Canonical admission transport is uncertain.",
    };
  }
  if (admission.kind === "UNKNOWN") {
    return admission;
  }
  if (admission.kind === "KEY_CONFLICT") {
    if (
      !isCanonicalUuid(admission.attemptId) ||
      !isCanonicalUuid(admission.conflictEventId) ||
      (recovery.kind === "FOUND" &&
        admission.attemptId !== recovery.attempt.id)
    ) {
      return {
        kind: "UNKNOWN",
        reason: "Conflict admission returned a mismatched identity.",
      };
    }
    return admission;
  }

  if (
    !isCanonicalUuid(admission.attemptId) ||
    (recovery.kind === "FOUND" &&
      (admission.kind !== "EXISTING" ||
        admission.attemptId !== recovery.attempt.id))
  ) {
    return {
      kind: "UNKNOWN",
      attemptId: null,
      transactionId: null,
      recorded: false,
      synchronization: "UNKNOWN",
      reason: "Admission returned a mismatched winner identity.",
    };
  }

  let commit: CommitOutcome;
  try {
    commit = await dependencies.commit(
      authority.businessId,
      admission.attemptId,
    );
  } catch {
    return {
      kind: "UNKNOWN",
      attemptId: admission.attemptId,
      transactionId: null,
      recorded: false,
      synchronization: "UNKNOWN",
      reason: "Commit transport is uncertain.",
    };
  }
  if (
    commit.attemptId !== null &&
    commit.attemptId !== admission.attemptId
  ) {
    return {
      kind: "UNKNOWN",
      attemptId: admission.attemptId,
      transactionId: null,
      recorded: false,
      synchronization: "UNKNOWN",
      reason: "Commit returned a mismatched attempt identity.",
    };
  }
  if (
    ((commit.kind === "RECORDED" || commit.kind === "REPLAY") &&
      (!isCanonicalUuid(commit.attemptId) ||
        !isCanonicalUuid(commit.transactionId))) ||
    (commit.kind === "NOT_COMMITTABLE" &&
      !isCanonicalUuid(commit.attemptId)) ||
    (commit.kind === "UNKNOWN" &&
      commit.recorded &&
      (!isCanonicalUuid(commit.attemptId) ||
        !isCanonicalUuid(commit.transactionId)))
  ) {
    return {
      kind: "UNKNOWN",
      attemptId: admission.attemptId,
      transactionId: null,
      recorded: false,
      synchronization: "UNKNOWN",
      reason: "Commit returned malformed evidence identities.",
    };
  }
  return commit;
}

async function resolveCurrentAuthority(): Promise<PaymentAttemptAuthority> {
  const user = await requireUser();
  const business = await requireBusiness();
  const currency = assertSupportedBusinessCurrency(business.currency ?? "");
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
  if (customer.error) {
    throw new Error("Customer binding lookup is uncertain.");
  }
  if (!customer.data) return false;
  if (intent.target === "customer") return true;
  if (intent.target !== "appointment" || !intent.targetId) return false;

  const appointment = await supabase
    .from("appointments")
    .select("id, customer_id")
    .eq("id", intent.targetId)
    .eq("business_id", authority.businessId)
    .eq("customer_id", intent.customerId)
    .maybeSingle();
  if (appointment.error) {
    throw new Error("Appointment binding lookup is uncertain.");
  }
  return Boolean(appointment.data);
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
        !isCanonicalUuid(data.id) ||
        !isCanonicalUuid(data.business_id) ||
        !isCanonicalUuid(data.attempt_key) ||
        data.business_id !== businessId ||
        data.attempt_key !== attemptKey ||
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
      return mapCommitRpcResult(data, error, attemptId);
    },
  };
}

export async function recordPreparedManualPaymentAttempt(
  request: ManualPaymentAttemptRequest,
): Promise<ManualPaymentAttemptResult> {
  return runManualPaymentAttemptKernel(request, createProductionDependencies());
}
