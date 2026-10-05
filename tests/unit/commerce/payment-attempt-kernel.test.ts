// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/actions/business", () => ({
  requireBusiness: vi.fn(),
  requireUser: vi.fn(),
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import {
  runManualPaymentAttemptKernel,
  type PaymentAttemptKernelDependencies,
} from "@/lib/commerce/payment-attempts/kernel";
import {
  mapAdmissionRpcResult,
  mapCommitRpcResult,
} from "@/lib/commerce/payment-attempts/mappers";
import type { ManualPaymentAttemptRequest } from "@/lib/commerce/payment-attempts/types";

const BUSINESS_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const APPOINTMENT_ID = "33333333-3333-4333-8333-333333333333";
const ATTEMPT_KEY = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ATTEMPT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const TRANSACTION_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OTHER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const request: ManualPaymentAttemptRequest = {
  attemptKey: ATTEMPT_KEY,
  source: "collect_payment",
  customerId: CUSTOMER_ID,
  target: "appointment",
  appointmentId: APPOINTMENT_ID,
  amountCents: 5000,
  method: "cash",
  paymentKind: "payment",
};

function dependencies(
  overrides: Partial<PaymentAttemptKernelDependencies> = {},
): PaymentAttemptKernelDependencies {
  return {
    admissionEnabled: true,
    resolveAuthority: vi.fn().mockResolvedValue({
      actorId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      businessId: BUSINESS_ID,
      currency: "cad",
    }),
    validateBinding: vi.fn().mockResolvedValue(true),
    recover: vi.fn().mockResolvedValue({ kind: "ABSENT" }),
    admit: vi.fn().mockResolvedValue({
      kind: "ADMITTED",
      attemptId: ATTEMPT_ID,
      executionState: "REQUESTED",
    }),
    commit: vi.fn().mockResolvedValue({
      kind: "RECORDED",
      attemptId: ATTEMPT_ID,
      transactionId: TRANSACTION_ID,
      recorded: true,
      synchronization: "PENDING",
    }),
    ...overrides,
  };
}

describe("prepared manual payment-attempt kernel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves current authority and binding before privileged recovery", async () => {
    const order: string[] = [];
    const deps = dependencies({
      resolveAuthority: vi.fn(async () => {
        order.push("authority");
        return {
          actorId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          businessId: BUSINESS_ID,
          currency: "cad",
        };
      }),
      validateBinding: vi.fn(async () => {
        order.push("binding");
        return true;
      }),
      recover: vi.fn(async () => {
        order.push("recovery");
        return { kind: "ABSENT" };
      }),
    });

    const result = await runManualPaymentAttemptKernel(request, deps);
    expect(order).toEqual(["authority", "binding", "recovery"]);
    expect(result).toMatchObject({
      kind: "RECORDED",
      recorded: true,
      synchronization: "PENDING",
    });
  });

  it("blocks only confirmed-absent new admission when disabled", async () => {
    const deps = dependencies({ admissionEnabled: false });
    await expect(runManualPaymentAttemptKernel(request, deps)).resolves.toEqual({
      kind: "NOT_ADMITTED_DISABLED",
    });
    expect(deps.admit).not.toHaveBeenCalled();
    expect(deps.commit).not.toHaveBeenCalled();
  });

  it("recovers an existing identity and commits even when admission is disabled", async () => {
    const deps = dependencies({
      admissionEnabled: false,
      recover: vi.fn().mockResolvedValue({
        kind: "FOUND",
        attempt: {
          id: ATTEMPT_ID,
          business_id: BUSINESS_ID,
          attempt_key: ATTEMPT_KEY,
          execution_state: "REQUESTED",
        },
      }),
      admit: vi.fn().mockResolvedValue({
        kind: "EXISTING",
        attemptId: ATTEMPT_ID,
        executionState: "REQUESTED",
      }),
    });
    const result = await runManualPaymentAttemptKernel(request, deps);
    expect(result.kind).toBe("RECORDED");
    expect(deps.admit).toHaveBeenCalledOnce();
    expect(deps.commit).toHaveBeenCalledWith(BUSINESS_ID, ATTEMPT_ID);
  });

  it("holds schema/read uncertainty and never invokes admission or legacy fallback", async () => {
    const deps = dependencies({
      recover: vi.fn().mockResolvedValue({
        kind: "UNKNOWN",
        reason: "schema unavailable",
      }),
    });
    await expect(
      runManualPaymentAttemptKernel(request, deps),
    ).resolves.toMatchObject({
      kind: "UNKNOWN",
      recorded: false,
      synchronization: "UNKNOWN",
    });
    expect(deps.admit).not.toHaveBeenCalled();
    expect(deps.commit).not.toHaveBeenCalled();
  });

  it("rejects tenant/customer/appointment binding before recovery", async () => {
    const deps = dependencies({
      validateBinding: vi.fn().mockResolvedValue(false),
    });
    await expect(runManualPaymentAttemptKernel(request, deps)).resolves.toEqual({
      kind: "INVALID",
      reason: "Customer or appointment binding is not authorized.",
    });
    expect(deps.recover).not.toHaveBeenCalled();
    expect(deps.admit).not.toHaveBeenCalled();
  });

  it("returns committed KEY_CONFLICT evidence without committing money", async () => {
    const deps = dependencies({
      admit: vi.fn().mockResolvedValue({
        kind: "KEY_CONFLICT",
        attemptId: ATTEMPT_ID,
        executionState: "ACCEPTED",
        conflictEventId: "eeeeeeee-eeee-5eee-aeee-eeeeeeeeeeee",
      }),
    });
    await expect(
      runManualPaymentAttemptKernel(request, deps),
    ).resolves.toMatchObject({
      kind: "KEY_CONFLICT",
      attemptId: ATTEMPT_ID,
    });
    expect(deps.commit).not.toHaveBeenCalled();
  });

  it("excludes source and current actor from the financial fingerprint", async () => {
    const captured: string[] = [];
    const first = dependencies({
      admissionEnabled: false,
      recover: vi.fn().mockResolvedValue({
        kind: "FOUND",
        attempt: {
          id: ATTEMPT_ID,
          business_id: BUSINESS_ID,
          attempt_key: ATTEMPT_KEY,
          execution_state: "ACCEPTED",
        },
      }),
      admit: vi.fn(async ({ intent }) => {
        captured.push(intent.fingerprint);
        return {
          kind: "EXISTING",
          attemptId: ATTEMPT_ID,
          executionState: "ACCEPTED",
        };
      }),
    });
    const second = dependencies({
      admissionEnabled: false,
      resolveAuthority: vi.fn().mockResolvedValue({
        actorId: OTHER_ID,
        businessId: BUSINESS_ID,
        currency: "cad",
      }),
      recover: vi.fn().mockResolvedValue({
        kind: "FOUND",
        attempt: {
          id: ATTEMPT_ID,
          business_id: BUSINESS_ID,
          attempt_key: ATTEMPT_KEY,
          execution_state: "ACCEPTED",
        },
      }),
      admit: vi.fn(async ({ intent }) => {
        captured.push(intent.fingerprint);
        return {
          kind: "EXISTING",
          attemptId: ATTEMPT_ID,
          executionState: "ACCEPTED",
        };
      }),
    });
    await expect(
      runManualPaymentAttemptKernel(request, first),
    ).resolves.toMatchObject({ kind: "RECORDED" });
    await expect(runManualPaymentAttemptKernel(
      { ...request, source: "payments_dashboard" },
      second,
    )).resolves.toMatchObject({ kind: "RECORDED" });
    expect(captured).toHaveLength(2);
    expect(captured[0]).toBe(captured[1]);
    expect(first.resolveAuthority).toHaveBeenCalledOnce();
    expect(second.resolveAuthority).toHaveBeenCalledOnce();
    expect(first.admit).toHaveReturned();
    expect(second.admit).toHaveReturned();
  });

  it.each([
    {
      label: "Business",
      attempt: {
        id: ATTEMPT_ID,
        business_id: OTHER_ID,
        attempt_key: ATTEMPT_KEY,
        execution_state: "REQUESTED" as const,
      },
    },
    {
      label: "key",
      attempt: {
        id: ATTEMPT_ID,
        business_id: BUSINESS_ID,
        attempt_key: OTHER_ID,
        execution_state: "REQUESTED" as const,
      },
    },
    {
      label: "malformed id",
      attempt: {
        id: "not-a-uuid",
        business_id: BUSINESS_ID,
        attempt_key: ATTEMPT_KEY,
        execution_state: "REQUESTED" as const,
      },
    },
  ])(
    "holds a mismatched recovered $label and cannot bypass flag-off",
    async ({ attempt }) => {
      const deps = dependencies({
        admissionEnabled: false,
        recover: vi.fn().mockResolvedValue({ kind: "FOUND", attempt }),
      });
      await expect(
        runManualPaymentAttemptKernel(request, deps),
      ).resolves.toMatchObject({
        kind: "UNKNOWN",
        recorded: false,
      });
      expect(deps.admit).not.toHaveBeenCalled();
      expect(deps.commit).not.toHaveBeenCalled();
    },
  );

  it("holds admission winner drift from the recovered attempt", async () => {
    const deps = dependencies({
      admissionEnabled: false,
      recover: vi.fn().mockResolvedValue({
        kind: "FOUND",
        attempt: {
          id: ATTEMPT_ID,
          business_id: BUSINESS_ID,
          attempt_key: ATTEMPT_KEY,
          execution_state: "REQUESTED",
        },
      }),
      admit: vi.fn().mockResolvedValue({
        kind: "EXISTING",
        attemptId: OTHER_ID,
        executionState: "REQUESTED",
      }),
    });
    await expect(
      runManualPaymentAttemptKernel(request, deps),
    ).resolves.toMatchObject({ kind: "UNKNOWN", recorded: false });
    expect(deps.commit).not.toHaveBeenCalled();
  });

  it("holds mismatched or malformed commit evidence without certifying money", async () => {
    const mismatched = dependencies({
      commit: vi.fn().mockResolvedValue({
        kind: "RECORDED",
        attemptId: OTHER_ID,
        transactionId: TRANSACTION_ID,
        recorded: true,
        synchronization: "PENDING",
      }),
    });
    await expect(
      runManualPaymentAttemptKernel(request, mismatched),
    ).resolves.toMatchObject({
      kind: "UNKNOWN",
      attemptId: ATTEMPT_ID,
      transactionId: null,
      recorded: false,
    });

    const malformed = dependencies({
      commit: vi.fn().mockResolvedValue({
        kind: "RECORDED",
        attemptId: ATTEMPT_ID,
        transactionId: "bad",
        recorded: true,
        synchronization: "PENDING",
      }),
    });
    await expect(
      runManualPaymentAttemptKernel(request, malformed),
    ).resolves.toMatchObject({
      kind: "UNKNOWN",
      recorded: false,
    });
  });

  it("maps only explicit matching ledger-backed UNKNOWN as recorded", () => {
    expect(
      mapCommitRpcResult(
        [{
          outcome: "UNKNOWN",
          attempt_id: ATTEMPT_ID,
          transaction_id: TRANSACTION_ID,
          recorded: true,
          synchronization: "UNKNOWN",
        }],
        null,
        ATTEMPT_ID,
      ),
    ).toMatchObject({
      kind: "UNKNOWN",
      attemptId: ATTEMPT_ID,
      transactionId: TRANSACTION_ID,
      recorded: true,
    });
    expect(
      mapCommitRpcResult(
        [{
          outcome: "UNKNOWN",
          attempt_id: ATTEMPT_ID,
          transaction_id: "malformed",
          recorded: true,
          synchronization: "UNKNOWN",
        }],
        null,
        ATTEMPT_ID,
      ),
    ).toMatchObject({
      kind: "UNKNOWN",
      transactionId: null,
      recorded: false,
    });
    expect(
      mapCommitRpcResult(
        [{
          outcome: "RECORDED",
          attempt_id: OTHER_ID,
          transaction_id: TRANSACTION_ID,
          recorded: true,
          synchronization: "PENDING",
        }],
        null,
        ATTEMPT_ID,
      ),
    ).toMatchObject({ kind: "UNKNOWN", recorded: false });
  });

  it("rejects malformed admission RPC identities", () => {
    expect(
      mapAdmissionRpcResult([{
        outcome: "EXISTING",
        attempt_id: "malformed",
        execution_state: "REQUESTED",
        conflict_event_id: null,
      }], null),
    ).toMatchObject({ kind: "UNKNOWN" });
    expect(
      mapAdmissionRpcResult([{
        outcome: "KEY_CONFLICT",
        attempt_id: ATTEMPT_ID,
        execution_state: "REQUESTED",
        conflict_event_id: "malformed",
      }], null),
    ).toMatchObject({ kind: "UNKNOWN" });
  });

  it.each(["binding", "recovery", "admission", "commit"])(
    "maps %s transport throws to typed UNKNOWN",
    async (stage) => {
      const deps = dependencies({
        ...(stage === "binding"
          ? { validateBinding: vi.fn().mockRejectedValue(new Error("transport")) }
          : {}),
        ...(stage === "recovery"
          ? { recover: vi.fn().mockRejectedValue(new Error("transport")) }
          : {}),
        ...(stage === "admission"
          ? { admit: vi.fn().mockRejectedValue(new Error("transport")) }
          : {}),
        ...(stage === "commit"
          ? { commit: vi.fn().mockRejectedValue(new Error("transport")) }
          : {}),
      });
      await expect(
        runManualPaymentAttemptKernel(request, deps),
      ).resolves.toMatchObject({ kind: "UNKNOWN" });
    },
  );

  it("does not swallow authentication/authorization control flow", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    const deps = dependencies({
      resolveAuthority: vi.fn().mockRejectedValue(redirect),
    });
    await expect(runManualPaymentAttemptKernel(request, deps)).rejects.toBe(
      redirect,
    );
  });

  it("rejects malformed identity and prohibited modes without privileged calls", async () => {
    const deps = dependencies();
    await expect(
      runManualPaymentAttemptKernel({ ...request, attemptKey: "bad" }, deps),
    ).resolves.toMatchObject({ kind: "INVALID" });
    await expect(
      runManualPaymentAttemptKernel(
        { ...request, explicitInvoiceIntent: true },
        deps,
      ),
    ).resolves.toMatchObject({ kind: "INVALID" });
    await expect(
      runManualPaymentAttemptKernel(
        { ...request, providerRoute: "stripe" },
        deps,
      ),
    ).resolves.toMatchObject({ kind: "INVALID" });
    expect(deps.recover).not.toHaveBeenCalled();
    expect(deps.admit).not.toHaveBeenCalled();
  });
});
