// @vitest-environment node
/**
 * GVM-N01 / Issue #167 — consume-time queued email recipient safety.
 *
 * Phase 1 makes customers.email nullable and stops writing manufactured
 * `phone.<digits>@chasum.local` addresses. Jobs enqueued by older builds can
 * still carry such an address in payload.recipient, so the worker revalidates
 * the saved recipient before it reaches a provider.
 *
 * Everything here is synthetic: no queue, provider, database or hosted access.
 * The real processor runs against isolated mocks so the private
 * requireEligibleEmailRecipient boundary is exercised rather than re-declared.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const BUSINESS_ID = "11670000-0000-4000-8000-000000000001";
const OTHER_BUSINESS_ID = "11670000-0000-4000-8000-0000000000ff";
const CUSTOMER_ID = "11670000-0000-4000-8000-000000000002";
const SEND_INTENT_ID = "11670000-0000-4000-8000-000000000003";
const RECEIPT_ID = "11670000-0000-4000-8000-000000000004";
const JOB_ID = "11670000-0000-4000-8000-000000000005";

const FAKE_RECIPIENT = "phone.4165550100@chasum.local";
const GENUINE_RECIPIENT = "real.person@example.invalid";

const {
  sendEmail,
  sendSMS,
  receiptUpdates,
  customerRows,
  customerReadError,
  finalizations,
} = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  sendSMS: vi.fn(),
  receiptUpdates: [] as Array<Record<string, unknown>>,
  customerRows: {
    current: [] as Array<{ id: string; business_id: string }>,
  },
  customerReadError: { current: null as { message: string } | null },
  finalizations: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/communications", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
  sendSMS: (...args: unknown[]) => sendSMS(...args),
  computeBackoffMs: () => 1000,
}));

vi.mock("@/lib/communications/reliability-config", () => ({
  workerReliabilityEnabled: () => true,
  workerWebhooksEnabled: () => false,
}));

vi.mock("@/lib/observability/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Only the terminal write is replaced; the claim markers stay real so the
// finalization assertions use the production prefixes.
vi.mock("@/lib/integrations/jobs/claim", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/integrations/jobs/claim")
  >();
  return {
    ...actual,
    claimBackgroundJob: vi.fn(),
    finalizeClaimedJob: vi.fn(async (_client, _job, finalization) => {
      finalizations.push(finalization as Record<string, unknown>);
    }),
  };
});

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "customers") {
        const filters: Record<string, string> = {};
        const query = {
          select: () => query,
          eq(key: string, value: string) {
            filters[key] = value;
            return query;
          },
          maybeSingle: async () => {
            if (customerReadError.current) {
              return { data: null, error: customerReadError.current };
            }
            const found =
              customerRows.current.find(
                (row) =>
                  row.id === filters.id &&
                  row.business_id === filters.business_id,
              ) ?? null;
            return { data: found, error: null };
          },
        };
        return query;
      }
      if (table === "commerce_receipts") {
        return {
          update(patch: Record<string, unknown>) {
            receiptUpdates.push(patch);
            const query = {
              eq: () => query,
              select: async () => ({ data: [{ id: RECEIPT_ID }], error: null }),
            };
            return query;
          },
        };
      }
      throw new Error(`Unexpected table in synthetic test: ${table}`);
    },
  }),
}));

import { PermanentDeliverySkip } from "@/lib/communications/errors";
import {
  RECONCILIATION_REQUIRED_PREFIX,
  WORKER_CLAIM_PREFIX,
  type ClaimedBackgroundJob,
} from "@/lib/integrations/jobs/claim";
import { processClaimedJob, processJob } from "@/lib/integrations/jobs/processor";

function directContext(customerEmail: string | null) {
  return {
    businessId: BUSINESS_ID,
    businessName: "Synthetic Studio",
    customerId: CUSTOMER_ID,
    customerName: "Synthetic Customer",
    customerEmail,
    customerPhone: "4165550100",
    staffName: "To be assigned",
    serviceName: "Receipt",
    startTime: "2026-10-16T15:00:00.000Z",
    timezone: "America/Toronto",
    receiptId: RECEIPT_ID,
  };
}

function queuedEmailJob(options: {
  recipient?: string;
  customerEmail: string | null;
  businessId?: string;
  contextBusinessId?: string;
}): ClaimedBackgroundJob {
  const payload: Record<string, unknown> = {
    templateKey: "commerce.receipt",
    sendIntentProtocol: "durable-v1",
    sendIntentId: SEND_INTENT_ID,
    businessId: options.businessId ?? BUSINESS_ID,
    customerId: CUSTOMER_ID,
    receiptId: RECEIPT_ID,
    directContext: {
      ...directContext(options.customerEmail),
      businessId: options.contextBusinessId ?? BUSINESS_ID,
    },
  };
  if (options.recipient !== undefined) payload.recipient = options.recipient;

  return {
    id: JOB_ID,
    business_id: options.businessId ?? BUSINESS_ID,
    job_type: "email",
    status: "processing",
    attempts: 1,
    max_attempts: 3,
    scheduled_at: "2026-10-16T15:00:00.000Z",
    started_at: "2026-10-16T15:00:01.000Z",
    error_message: `${WORKER_CLAIM_PREFIX}${JOB_ID}`,
    next_retry_at: null,
    completed_at: null,
    payload,
  } as unknown as ClaimedBackgroundJob;
}

function acceptedSend() {
  return {
    ok: true,
    deliveryState: "accepted" as const,
    intentId: SEND_INTENT_ID,
    messageId: "synthetic-message",
  };
}

describe("queued email recipient eligibility at consume time", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    receiptUpdates.length = 0;
    finalizations.length = 0;
    customerReadError.current = null;
    customerRows.current = [{ id: CUSTOMER_ID, business_id: BUSINESS_ID }];
    sendEmail.mockResolvedValue(acceptedSend());
  });

  it("CASE A — retires a stored phone.*@chasum.local recipient without calling the provider", async () => {
    const job = queuedEmailJob({
      recipient: FAKE_RECIPIENT,
      customerEmail: null,
    });

    await expect(processJob(job)).rejects.toBeInstanceOf(PermanentDeliverySkip);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendSMS).not.toHaveBeenCalled();
    // The receipt status writer must not record a delivery outcome.
    expect(receiptUpdates).toEqual([]);
  });

  it("CASE A — finalizes as a permanent skip with no retry and no sent status", async () => {
    const job = queuedEmailJob({
      recipient: FAKE_RECIPIENT,
      customerEmail: null,
    });

    const succeeded = await processClaimedJob(
      {} as unknown as Parameters<typeof processClaimedJob>[0],
      job,
    );

    expect(succeeded).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(receiptUpdates).toEqual([]);
    expect(finalizations).toHaveLength(1);
    const [finalization] = finalizations;
    expect(finalization.status).toBe("failed");
    expect(finalization.next_retry_at).toBeNull();
    expect(finalization.error_message).toBe(
      "delivery_skipped:delivery_skipped_before_provider",
    );
    expect(String(finalization.error_message)).not.toContain(
      RECONCILIATION_REQUIRED_PREFIX,
    );
    expect(finalization.completed_at).not.toBeNull();
  });

  it("CASE B — skips before the provider when the stored recipient is absent and the fallback is ineligible", async () => {
    const job = queuedEmailJob({ customerEmail: null });

    await expect(processJob(job)).rejects.toBeInstanceOf(PermanentDeliverySkip);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(receiptUpdates).toEqual([]);
  });

  it("CASE B — also skips when the fallback itself is a legacy placeholder", async () => {
    const job = queuedEmailJob({
      customerEmail: "phone.4165559999@chasum.local",
    });

    await expect(processJob(job)).rejects.toBeInstanceOf(PermanentDeliverySkip);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("CASE C — sends to the normalized eligible fallback when no recipient was stored", async () => {
    const job = queuedEmailJob({ customerEmail: "Real.Person@Example.invalid" });

    await processJob(job);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [args] = sendEmail.mock.calls[0] as [Record<string, unknown>];
    expect(args.to).toBe(GENUINE_RECIPIENT);
    expect(args.businessId).toBe(BUSINESS_ID);
    expect(args.customerId).toBe(CUSTOMER_ID);
    // The queued send-intent identity is carried through unchanged.
    expect(args.reliability).toEqual(
      expect.objectContaining({
        intentId: SEND_INTENT_ID,
        jobId: JOB_ID,
        source: "worker",
      }),
    );
  });

  it("CASE D — rejects a stored fake recipient instead of redirecting to the genuine fallback", async () => {
    const job = queuedEmailJob({
      recipient: FAKE_RECIPIENT,
      customerEmail: GENUINE_RECIPIENT,
    });

    await expect(processJob(job)).rejects.toBeInstanceOf(PermanentDeliverySkip);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(receiptUpdates).toEqual([]);
    expect(JSON.stringify(sendEmail.mock.calls)).not.toContain(
      GENUINE_RECIPIENT,
    );
  });

  it("verifies the job's tenant before any recipient is resolved or sent", async () => {
    const job = queuedEmailJob({
      recipient: GENUINE_RECIPIENT,
      customerEmail: GENUINE_RECIPIENT,
      contextBusinessId: OTHER_BUSINESS_ID,
    });

    await expect(processJob(job)).rejects.toThrow(/context_tenant_mismatch/);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("refuses to send when the customer row cannot be confirmed in the job's business", async () => {
    customerRows.current = [];
    const job = queuedEmailJob({
      recipient: GENUINE_RECIPIENT,
      customerEmail: GENUINE_RECIPIENT,
    });

    await expect(processJob(job)).rejects.toThrow(
      /customer_tenant_unverified/,
    );

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("holds an UNKNOWN delivery state for reconciliation instead of claiming sent or retrying", async () => {
    sendEmail.mockResolvedValue({
      ok: false,
      deliveryState: "unknown",
      retrySafe: false,
      intentId: SEND_INTENT_ID,
    });
    const job = queuedEmailJob({ recipient: GENUINE_RECIPIENT, customerEmail: null });

    const succeeded = await processClaimedJob(
      {} as unknown as Parameters<typeof processClaimedJob>[0],
      job,
    );

    expect(succeeded).toBe(false);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(finalizations).toHaveLength(1);
    const [finalization] = finalizations;
    expect(finalization.status).toBe("failed");
    expect(finalization.next_retry_at).toBeNull();
    expect(String(finalization.error_message)).toContain(
      RECONCILIATION_REQUIRED_PREFIX,
    );
    // An unknown provider outcome must never be written back as a receipt status.
    expect(receiptUpdates).toEqual([]);
  });

  it("does not resolve a recipient for a legacy job with no durable send intent", async () => {
    const job = queuedEmailJob({
      recipient: GENUINE_RECIPIENT,
      customerEmail: GENUINE_RECIPIENT,
    });
    delete (job.payload as Record<string, unknown>).sendIntentId;

    await expect(processJob(job)).rejects.toThrow(
      /legacy_send_intent_missing/,
    );

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("refuses a payload whose businessId disagrees with the job's tenant", async () => {
    const job = queuedEmailJob({
      recipient: GENUINE_RECIPIENT,
      customerEmail: GENUINE_RECIPIENT,
    });
    (job.payload as Record<string, unknown>).businessId = OTHER_BUSINESS_ID;

    await expect(processJob(job)).rejects.toThrow(/payload_tenant_mismatch/);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("records a genuine accepted send as the receipt's sent status exactly once", async () => {
    const job = queuedEmailJob({ customerEmail: GENUINE_RECIPIENT });

    await processJob(job);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(receiptUpdates).toHaveLength(1);
    expect(receiptUpdates[0]).toEqual(
      expect.objectContaining({ email_status: "sent" }),
    );
  });
});
