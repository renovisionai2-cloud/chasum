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

import { requireBusiness, requireUser } from "@/lib/actions/business";
import {
  listBookingOperationHistory,
  readBookingOperationCanonical,
  runBookingOperationKernel,
} from "@/lib/commerce/booking-operations/kernel";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  BookingOperationFoundSnapshot,
  BookingOperationKernelDependencies,
  BookingOperationRequest,
} from "@/lib/commerce/booking-operations/types";

const BUSINESS_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const LOCATION_ID = "33333333-3333-4333-8333-333333333333";
const SERVICE_ID = "44444444-4444-4444-8444-444444444444";
const STAFF_ID = "55555555-5555-4555-8555-555555555555";
const ACTOR_ID = "66666666-6666-4666-8666-666666666666";
const OPERATION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ATTEMPT_KEY = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const INLINE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ATTEMPT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const APPOINTMENT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const TRANSACTION_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";

function historyItem(createdAt: string) {
  return {
    operation_id: OPERATION_ID,
    appointment_id: null,
    attempt_id: ATTEMPT_ID,
    source: "booking_sheet",
    created_at: createdAt,
    updated_at: createdAt,
    lifecycle_state: "OPEN",
    close_reason: null,
    payment_mode: "deposit",
    execution_state: "REQUESTED",
    amount_cents: 5_000,
    currency: "cad",
    method: "cash",
    transaction_id: null,
    ledger_count: 0,
    operator_state: "PAYMENT_RECOVERY_REQUIRED",
    synchronization: "PENDING",
    recovery_action: "CREATE_APPOINTMENT",
  };
}

function request(
  overrides: Partial<BookingOperationRequest> = {},
): BookingOperationRequest {
  return {
    identities: {
      operationId: OPERATION_ID,
      attemptKey: ATTEMPT_KEY,
      inlineCustomerId: INLINE_ID,
    },
    source: "booking_sheet",
    customer: { mode: "existing", customerId: CUSTOMER_ID },
    booking: {
      channel: "staff",
      locationId: LOCATION_ID,
      serviceId: SERVICE_ID,
      staffId: STAFF_ID,
      requestedStart: "2026-10-08T14:00:00.000Z",
    },
    payment: { mode: "deposit", method: "cash" },
    ...overrides,
  };
}

function found(
  overrides: Partial<BookingOperationFoundSnapshot> = {},
): BookingOperationFoundSnapshot {
  return {
    operationId: OPERATION_ID,
    actorId: ACTOR_ID,
    source: "booking_sheet",
    lifecycleState: "APPOINTMENT_CREATED",
    closeReason: null,
    createdAt: "2026-10-08T13:59:00.000Z",
    updatedAt: "2026-10-08T14:00:00.000Z",
    appointmentId: APPOINTMENT_ID,
    appointmentSaved: true,
    attemptId: ATTEMPT_ID,
    executionState: "ACCEPTED",
    recoveryDisposition: "RECOVER",
    paymentMode: "deposit",
    paymentKind: "deposit",
    amountCents: 5_000,
    currency: "cad",
    method: "cash",
    failureClass: null,
    failureCode: null,
    attemptCreatedAt: "2026-10-08T13:59:00.000Z",
    attemptResolvedAt: "2026-10-08T14:00:00.000Z",
    events: [],
    transactionId: TRANSACTION_ID,
    ledgerCount: 1,
    rawRecorded: true,
    obligations: [
      "appointment_cache",
      "invoice_settlement",
      "customer_payment_events",
      "receipt",
    ].map((kind) => ({
      kind,
      state: "PENDING",
      failureCode: null,
      updatedAt: "2026-10-08T14:00:00.000Z",
      completedAt: null,
    })),
    operatorState: "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED",
    synchronization: "PENDING",
    recoveryAction: "REVIEW",
    communicationEligibility: "NOT_IMPLEMENTED",
    consistency: "SINGLE_STATEMENT_READ_COMMITTED",
    ...overrides,
  };
}

function dependencies(
  overrides: Partial<BookingOperationKernelDependencies> = {},
): BookingOperationKernelDependencies {
  return {
    admissionEnabled: true,
    resolveAuthority: vi.fn().mockResolvedValue({
      actorId: ACTOR_ID,
      businessId: BUSINESS_ID,
      currency: "cad",
    }),
    validateAndPrice: vi.fn().mockResolvedValue({
      requestedEnd: "2026-10-08T15:00:00.000Z",
      requestedStatus: "confirmed",
      durationMinutes: 60,
      subtotalCents: 10_000,
      taxCents: 0,
      depositRequiredCents: 5_000,
      appointmentNotes: null,
    }),
    bootstrap: vi.fn().mockResolvedValue({
      kind: "ADMITTED",
      operationId: OPERATION_ID,
      customerId: CUSTOMER_ID,
      attemptId: ATTEMPT_ID,
      executionState: "REQUESTED",
    }),
    recoverAppointment: vi.fn().mockResolvedValue(null),
    createAppointment: vi.fn().mockResolvedValue({
      kind: "CREATED",
      appointmentId: APPOINTMENT_ID,
    }),
    bind: vi.fn().mockResolvedValue({
      kind: "BOUND",
      operationId: OPERATION_ID,
      appointmentId: APPOINTMENT_ID,
      attemptId: ATTEMPT_ID,
    }),
    close: vi.fn().mockResolvedValue({
      kind: "CLOSED",
      operationId: OPERATION_ID,
      appointmentId: null,
      attemptId: ATTEMPT_ID,
      recorded: false,
    }),
    commit: vi.fn().mockResolvedValue({
      kind: "RECORDED",
      attemptId: ATTEMPT_ID,
      transactionId: TRANSACTION_ID,
      recorded: true,
      synchronization: "PENDING",
    }),
    read: vi
      .fn()
      .mockResolvedValueOnce({ kind: "ABSENT" })
      .mockResolvedValue({ kind: "FOUND", snapshot: found() }),
    ...overrides,
  };
}

describe("prepared durable booking-operation kernel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("executes the admitted operation in the contract order and returns raw money separately from synchronization", async () => {
    const order: string[] = [];
    const deps = dependencies({
      resolveAuthority: vi.fn(async () => {
        order.push("authority");
        return { actorId: ACTOR_ID, businessId: BUSINESS_ID, currency: "cad" };
      }),
      validateAndPrice: vi.fn(async () => {
        order.push("validate");
        return {
          requestedEnd: "2026-10-08T15:00:00.000Z",
          requestedStatus: "confirmed",
          durationMinutes: 60,
          subtotalCents: 10_000,
          taxCents: 0,
          depositRequiredCents: 5_000,
          appointmentNotes: null,
        };
      }),
      read: vi.fn(async () => {
        order.push("read");
        return order.filter((value) => value === "read").length === 1
          ? { kind: "ABSENT" as const }
          : { kind: "FOUND" as const, snapshot: found() };
      }),
      bootstrap: vi.fn(async () => {
        order.push("bootstrap");
        return {
          kind: "ADMITTED" as const,
          operationId: OPERATION_ID,
          customerId: CUSTOMER_ID,
          attemptId: ATTEMPT_ID,
          executionState: "REQUESTED" as const,
        };
      }),
      recoverAppointment: vi.fn(async () => {
        order.push("recover");
        return null;
      }),
      createAppointment: vi.fn(async () => {
        order.push("create");
        return { kind: "CREATED" as const, appointmentId: APPOINTMENT_ID };
      }),
      bind: vi.fn(async () => {
        order.push("bind");
        return {
          kind: "BOUND" as const,
          operationId: OPERATION_ID,
          appointmentId: APPOINTMENT_ID,
          attemptId: ATTEMPT_ID,
        };
      }),
      commit: vi.fn(async () => {
        order.push("commit");
        return {
          kind: "RECORDED" as const,
          attemptId: ATTEMPT_ID,
          transactionId: TRANSACTION_ID,
          recorded: true as const,
          synchronization: "PENDING" as const,
        };
      }),
    });

    await expect(runBookingOperationKernel(request(), deps)).resolves.toEqual({
      kind: "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED",
      operationId: OPERATION_ID,
      appointmentId: APPOINTMENT_ID,
      attemptId: ATTEMPT_ID,
      transactionId: TRANSACTION_ID,
      appointmentSaved: true,
      reason: null,
    });
    expect(order).toEqual([
      "authority",
      "validate",
      "read",
      "bootstrap",
      "recover",
      "create",
      "bind",
      "commit",
      "read",
    ]);
  });

  it.each(["FAILED", "SKIPPED"] as const)("preserves %s terminal truth after a cancellation race without retrying money", async (state) => {
    const skipped = state === "SKIPPED";
    const terminal = found({
      lifecycleState: "CLOSED", closeReason: "APPOINTMENT_CANCELLED",
      executionState: state, recoveryDisposition: "DO_NOT_RETRY",
      paymentMode: skipped ? "none" : "deposit", paymentKind: skipped ? "none" : "deposit",
      amountCents: skipped ? 0 : 5000, method: skipped ? null : "cash",
      failureClass: skipped ? null : "CONFLICT", failureCode: skipped ? null : "KEY_CONFLICT",
      transactionId: null, ledgerCount: 0, rawRecorded: false, obligations: [],
      operatorState: "NOT_RECORDED", synchronization: "NOT_REQUIRED", recoveryAction: "NONE",
    });
    const deps = dependencies({
      recoverAppointment: vi.fn().mockResolvedValue(APPOINTMENT_ID),
      commit: vi.fn().mockResolvedValue({ kind: "NOT_COMMITTABLE", attemptId: ATTEMPT_ID,
        transactionId: null, recorded: false, synchronization: "UNKNOWN" }),
      read: vi.fn().mockResolvedValueOnce({ kind: "ABSENT" })
        .mockResolvedValue({ kind: "FOUND", snapshot: terminal }),
    });
    await expect(runBookingOperationKernel(skipped ? request({ payment: { mode: "none" } }) : request(), deps))
      .resolves.toMatchObject({ kind: "NOT_RECORDED", transactionId: null, reason: "APPOINTMENT_CANCELLED" });
    expect(deps.commit).toHaveBeenCalledTimes(skipped ? 0 : 1);
    expect(deps.bootstrap).toHaveBeenCalledTimes(1);
    expect(deps.createAppointment).not.toHaveBeenCalled();
    expect(deps.close).not.toHaveBeenCalled();
  });

  it("preserves recorded replay truth after cancellation without a second payment call", async () => {
    const deps = dependencies({
      recoverAppointment: vi.fn().mockResolvedValue(APPOINTMENT_ID),
      commit: vi.fn().mockResolvedValue({ kind: "REPLAY", attemptId: ATTEMPT_ID,
        transactionId: TRANSACTION_ID, recorded: true, synchronization: "PENDING" }),
      read: vi.fn().mockResolvedValueOnce({ kind: "ABSENT" })
        .mockResolvedValue({ kind: "FOUND", snapshot: found({ lifecycleState: "CLOSED", closeReason: "APPOINTMENT_CANCELLED" }) }),
    });
    await expect(runBookingOperationKernel(request(), deps)).resolves.toMatchObject({
      kind: "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED", transactionId: TRANSACTION_ID,
    });
    expect(deps.commit).toHaveBeenCalledTimes(1);
    expect(deps.bootstrap).toHaveBeenCalledTimes(1);
    expect(deps.createAppointment).not.toHaveBeenCalled();
  });

  it("blocks only confirmed-absent admission while default-off", async () => {
    const deps = dependencies({ admissionEnabled: false });
    await expect(runBookingOperationKernel(request(), deps)).resolves.toEqual({
      kind: "NOT_ADMITTED_DISABLED",
    });
    expect(deps.bootstrap).not.toHaveBeenCalled();
    expect(deps.createAppointment).not.toHaveBeenCalled();
    expect(deps.commit).not.toHaveBeenCalled();
  });

  it("recovers the same existing operation while admission remains disabled", async () => {
    const deps = dependencies({
      admissionEnabled: false,
      read: vi
        .fn()
        .mockResolvedValueOnce({ kind: "FOUND", snapshot: found({
          executionState: "REQUESTED",
          transactionId: null,
          ledgerCount: 0,
          obligations: [],
          operatorState: "PAYMENT_RECOVERY_REQUIRED",
          recoveryAction: "COMMIT_PAYMENT",
        }) })
        .mockResolvedValue({ kind: "FOUND", snapshot: found() }),
      bootstrap: vi.fn().mockResolvedValue({
        kind: "EXISTING",
        operationId: OPERATION_ID,
        customerId: CUSTOMER_ID,
        attemptId: ATTEMPT_ID,
        executionState: "REQUESTED",
      }),
      recoverAppointment: vi.fn().mockResolvedValue(APPOINTMENT_ID),
    });
    await expect(
      runBookingOperationKernel(request(), deps),
    ).resolves.toMatchObject({
      kind: "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED",
      operationId: OPERATION_ID,
    });
    expect(deps.createAppointment).not.toHaveBeenCalled();
    expect(deps.commit).toHaveBeenCalledWith(
      expect.objectContaining({ identities: expect.objectContaining({ operationId: OPERATION_ID }) }),
      ATTEMPT_ID,
    );
  });

  it("persists explicit no-payment, binds the appointment, and never commits money", async () => {
    const deps = dependencies({
      read: vi
        .fn()
        .mockResolvedValueOnce({ kind: "ABSENT" })
        .mockResolvedValue({
          kind: "FOUND",
          snapshot: found({
            executionState: "SKIPPED",
            recoveryDisposition: "DO_NOT_RETRY",
            paymentMode: "none",
            paymentKind: "none",
            amountCents: 0,
            method: null,
            transactionId: null,
            ledgerCount: 0,
            rawRecorded: false,
            obligations: [],
            operatorState: "NOT_RECORDED",
            synchronization: "NOT_REQUIRED",
            recoveryAction: "NONE",
          }),
        }),
    });
    await expect(
      runBookingOperationKernel(
        request({ payment: { mode: "none" } }),
        deps,
      ),
    ).resolves.toMatchObject({
      kind: "NOT_RECORDED",
      appointmentSaved: true,
      transactionId: null,
      reason: "NO_PAYMENT_REQUESTED",
    });
    expect(deps.commit).not.toHaveBeenCalled();
  });

  it("recovers a lost appointment response by operation identity before binding", async () => {
    const recover = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(APPOINTMENT_ID);
    const deps = dependencies({
      recoverAppointment: recover,
      createAppointment: vi.fn().mockResolvedValue({
        kind: "UNKNOWN",
        reason: "response lost",
      }),
    });
    await expect(
      runBookingOperationKernel(request(), deps),
    ).resolves.toMatchObject({
      kind: "RECORDED_BUT_NOT_FULLY_SYNCHRONIZED",
      appointmentId: APPOINTMENT_ID,
    });
    expect(recover).toHaveBeenCalledTimes(2);
    expect(deps.bind).toHaveBeenCalledOnce();
  });

  it("fences a known slot failure and returns durable zero-ledger closure truth", async () => {
    const closed = found({
      lifecycleState: "CLOSED",
      closeReason: "SLOT_CONFLICT",
      appointmentId: null,
      appointmentSaved: false,
      executionState: "FAILED",
      recoveryDisposition: "DO_NOT_RETRY",
      failureClass: "CONFLICT",
      failureCode: "KEY_CONFLICT",
      transactionId: null,
      ledgerCount: 0,
      rawRecorded: false,
      obligations: [],
      operatorState: "NOT_RECORDED",
      synchronization: "NOT_REQUIRED",
      recoveryAction: "NONE",
    });
    const deps = dependencies({
      createAppointment: vi.fn().mockResolvedValue({
        kind: "CONFLICT",
        reason: "SLOT_CONFLICT",
      }),
      read: vi
        .fn()
        .mockResolvedValueOnce({ kind: "ABSENT" })
        .mockResolvedValue({ kind: "FOUND", snapshot: closed }),
    });
    await expect(
      runBookingOperationKernel(request(), deps),
    ).resolves.toMatchObject({
      kind: "NOT_RECORDED",
      appointmentSaved: false,
      reason: "SLOT_CONFLICT",
    });
    expect(deps.close).toHaveBeenCalledWith(
      expect.anything(),
      "SLOT_CONFLICT",
    );
    expect(deps.bind).not.toHaveBeenCalled();
    expect(deps.commit).not.toHaveBeenCalled();
  });

  it("returns match-required and key conflict without appointment or money writes", async () => {
    for (const bootstrap of [
      { kind: "CUSTOMER_MATCH_REQUIRES_SELECTION" as const },
      {
        kind: "KEY_CONFLICT" as const,
        operationId: OPERATION_ID,
        attemptId: ATTEMPT_ID,
        conflictEventId: "99999999-9999-4999-8999-999999999999",
      },
    ]) {
      const deps = dependencies({
        bootstrap: vi.fn().mockResolvedValue(bootstrap),
      });
      const result = await runBookingOperationKernel(request(), deps);
      expect(result.kind).toBe(
        bootstrap.kind === "KEY_CONFLICT"
          ? "KEY_CONFLICT"
          : "CUSTOMER_MATCH_REQUIRES_SELECTION",
      );
      expect(deps.createAppointment).not.toHaveBeenCalled();
      expect(deps.commit).not.toHaveBeenCalled();
    }
  });

  it.each([
    "read",
    "bootstrap",
    "recoverAppointment",
    "createAppointment",
    "bind",
    "commit",
  ] as const)("maps a %s transport fault to UNKNOWN without rotating identity", async (stage) => {
    const deps = dependencies({
      [stage]: vi.fn().mockRejectedValue(new Error("transport")),
    });
    const result = await runBookingOperationKernel(request(), deps);
    expect(result).toMatchObject({ kind: "UNKNOWN", operationId: OPERATION_ID });
  });

  it("does not swallow authentication control flow", async () => {
    const redirect = new Error("NEXT_REDIRECT");
    const deps = dependencies({
      resolveAuthority: vi.fn().mockRejectedValue(redirect),
    });
    await expect(runBookingOperationKernel(request(), deps)).rejects.toBe(
      redirect,
    );
  });
});

describe("private canonical booking-operation readers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUser).mockResolvedValue({ id: ACTOR_ID } as never);
    vi.mocked(requireBusiness).mockResolvedValue({
      id: BUSINESS_ID,
      currency: "cad",
    } as never);
  });

  it("classifies an operation-tagged but unbound appointment as same-attempt binding recovery", async () => {
    vi.mocked(createServiceClient).mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: [{
          payload: {
            found: true,
            operation: {
              id: OPERATION_ID,
              actor_id: ACTOR_ID,
              source: "booking_sheet",
              lifecycle_state: "OPEN",
              close_reason: null,
              payment_mode: "deposit",
              created_at: "2026-10-08T13:59:00.000Z",
              updated_at: "2026-10-08T14:00:00.000Z",
            },
            appointment: {
              id: APPOINTMENT_ID,
              booking_operation_id: OPERATION_ID,
              status: "confirmed",
            },
            appointment_count: 1,
            attempt: {
              id: ATTEMPT_ID,
              booking_operation_id: OPERATION_ID,
              appointment_id: null,
              execution_state: "REQUESTED",
              recovery_disposition: "RECOVER",
              payment_kind: "deposit",
              amount_cents: 5_000,
              currency: "cad",
              method: "cash",
              provider_route: "manual",
              failure_class: null,
              failure_code: null,
              created_at: "2026-10-08T13:59:00.000Z",
              resolved_at: null,
            },
            attempt_count: 1,
            events: [{
              id: "99999999-9999-4999-8999-999999999999",
              sequence: 1,
              type: "REQUESTED",
              money_state: "NOT_RECORDED",
              failure_class: null,
              failure_code: null,
              occurred_at: "2026-10-08T13:59:00.000Z",
            }],
            ledger: null,
            ledger_count: 0,
            obligations: [],
          },
        }],
        error: null,
      }),
    } as never);

    await expect(readBookingOperationCanonical(OPERATION_ID)).resolves.toMatchObject({
      kind: "FOUND",
      snapshot: {
        operatorState: "PAYMENT_RECOVERY_REQUIRED",
        recoveryAction: "BIND_APPOINTMENT",
        rawRecorded: false,
        communicationEligibility: "NOT_IMPLEMENTED",
      },
    });
  });

  it("fails closed on malformed history summaries instead of coercing financial fields", async () => {
    vi.mocked(createServiceClient).mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: [{
          payload: {
            items: [{
              operation_id: OPERATION_ID,
              appointment_id: null,
              attempt_id: ATTEMPT_ID,
              source: "booking_sheet",
              created_at: "2026-10-08T13:59:00.000Z",
              updated_at: "2026-10-08T14:00:00.000Z",
              lifecycle_state: "OPEN",
              close_reason: null,
              payment_mode: "deposit",
              execution_state: "REQUESTED",
              amount_cents: "5000",
              currency: "cad",
              method: "cash",
              transaction_id: null,
              ledger_count: 0,
              operator_state: "PAYMENT_RECOVERY_REQUIRED",
              synchronization: "PENDING",
              recovery_action: "CREATE_APPOINTMENT",
            }],
            next_cursor: null,
          },
        }],
        error: null,
      }),
    } as never);

    await expect(listBookingOperationHistory()).resolves.toEqual({
      kind: "UNKNOWN",
      reason: "History summary is malformed.",
    });
  });

  it("round-trips distinct sub-millisecond cursor boundaries without reducing PostgreSQL precision", async () => {
    const firstBoundary = "2026-10-08T13:59:00.123456+00:00";
    const secondBoundary = "2026-10-08T13:59:00.123455+00:00";
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{
          payload: {
            items: [historyItem(firstBoundary)],
            next_cursor: {
              attention_rank: 0,
              created_at: firstBoundary,
              id: OPERATION_ID,
            },
          },
        }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{
          payload: {
            items: [historyItem(secondBoundary)],
            next_cursor: {
              attention_rank: 0,
              created_at: secondBoundary,
              id: OPERATION_ID,
            },
          },
        }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ payload: { items: [], next_cursor: null } }],
        error: null,
      });
    vi.mocked(createServiceClient).mockReturnValue({ rpc } as never);

    const firstPage = await listBookingOperationHistory({ limit: 1 });
    expect(firstPage.kind).toBe("PAGE");
    if (firstPage.kind !== "PAGE") throw new Error("expected first page");

    const secondPage = await listBookingOperationHistory({
      cursor: firstPage.nextCursor ?? undefined,
      limit: 1,
    });
    expect(secondPage.kind).toBe("PAGE");
    if (secondPage.kind !== "PAGE") throw new Error("expected second page");
    expect(secondPage.nextCursor).not.toBe(firstPage.nextCursor);

    await listBookingOperationHistory({
      cursor: secondPage.nextCursor ?? undefined,
      limit: 1,
    });

    expect(rpc).toHaveBeenNthCalledWith(
      2,
      "read_booking_operations_v1",
      expect.objectContaining({
        p_cursor_attention_rank: 0,
        p_cursor_created_at: firstBoundary,
        p_cursor_id: OPERATION_ID,
      }),
    );
    expect(rpc).toHaveBeenNthCalledWith(
      3,
      "read_booking_operations_v1",
      expect.objectContaining({
        p_cursor_attention_rank: 0,
        p_cursor_created_at: secondBoundary,
        p_cursor_id: OPERATION_ID,
      }),
    );
  });

  it("rejects malformed cursor timestamps before calling the canonical reader", async () => {
    const malformedCursor = Buffer.from(
      JSON.stringify({
        attentionRank: 0,
        createdAt: "2026-02-31T13:59:00.123456+00:00",
        id: OPERATION_ID,
      }),
      "utf8",
    ).toString("base64url");

    await expect(
      listBookingOperationHistory({ cursor: malformedCursor as never }),
    ).resolves.toEqual({
      kind: "UNKNOWN",
      reason: "History cursor is invalid.",
    });
    expect(createServiceClient).not.toHaveBeenCalled();
  });
});
