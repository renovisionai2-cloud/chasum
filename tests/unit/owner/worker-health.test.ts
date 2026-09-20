import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkerHealthInput } from "@/lib/observability/worker-health";

const requirePlatformOwner = vi.fn();
const createServiceClient = vi.fn();
const workerReliabilityEnabled = vi.fn();
const workerWebhooksEnabled = vi.fn();

vi.mock("@/lib/owner/auth", () => ({
  requirePlatformOwner: (...args: unknown[]) => requirePlatformOwner(...args),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: (...args: unknown[]) => createServiceClient(...args),
}));

vi.mock("@/lib/communications/reliability-config", () => ({
  workerReliabilityEnabled: () => workerReliabilityEnabled(),
  workerWebhooksEnabled: () => workerWebhooksEnabled(),
}));

import {
  getOwnerWorkerHealthSnapshot,
  summarizeOwnerWorkerHealth,
  unavailableOwnerWorkerHealth,
} from "@/lib/owner/worker-health";

const now = new Date("2026-09-20T12:00:00.000Z");

const enabled = {
  now,
  workerReliabilityEnabled: true,
  workerWebhooksEnabled: true,
};

function row(
  overrides: Partial<WorkerHealthInput> = {},
): WorkerHealthInput {
  return {
    status: "pending",
    job_type: "reminder",
    scheduled_at: "2026-09-20T11:00:00.000Z",
    started_at: null,
    next_retry_at: null,
    cancelled_at: null,
    ...overrides,
  };
}

describe("owner worker-health projection", () => {
  beforeEach(() => {
    requirePlatformOwner.mockReset();
    createServiceClient.mockReset();
    workerReliabilityEnabled.mockReset();
    workerWebhooksEnabled.mockReset();
  });

  it("aggregates truthful active worker states", () => {
    const snapshot = summarizeOwnerWorkerHealth(
      [
        row({ scheduled_at: "2026-09-20T11:00:00.000Z" }),
        row({ scheduled_at: "2026-09-20T11:59:00.000Z" }),
        row({ scheduled_at: "2026-09-20T13:00:00.000Z" }),
        row({ status: "failed" }),
        row({
          status: "processing",
          started_at: "2026-09-20T11:30:00.000Z",
        }),
        row({
          status: "processing",
          started_at: "2026-09-20T11:59:00.000Z",
        }),
        row({ status: "completed" }),
        row({ status: "cancelled" }),
        row({ job_type: "unknown_job_type" }),
      ],
      enabled,
    );

    expect(snapshot.available).toBe(true);
    if (!snapshot.available) throw new Error("expected available snapshot");

    expect(snapshot.counts).toEqual({
      futurePending: 1,
      pendingGrace: 1,
      heldByConfig: 0,
      overduePending: 1,
      failed: 1,
      freshProcessing: 1,
      staleProcessing: 1,
      invalid: 1,
    });
    expect(snapshot.totalJobs).toBe(9);
    expect(snapshot.oldestOverdueAt).toBe("2026-09-20T11:00:00.000Z");
  });

  it("classifies due work as held when global reliability is disabled", () => {
    const snapshot = summarizeOwnerWorkerHealth(
      [row()],
      { ...enabled, workerReliabilityEnabled: false },
    );

    expect(snapshot.available).toBe(true);
    if (!snapshot.available) throw new Error("expected available snapshot");
    expect(snapshot.counts.heldByConfig).toBe(1);
    expect(snapshot.counts.overduePending).toBe(0);
  });

  it("classifies due webhooks as held when webhook processing is disabled", () => {
    const snapshot = summarizeOwnerWorkerHealth(
      [row({ job_type: "webhook" })],
      { ...enabled, workerWebhooksEnabled: false },
    );

    expect(snapshot.available).toBe(true);
    if (!snapshot.available) throw new Error("expected available snapshot");
    expect(snapshot.counts.heldByConfig).toBe(1);
    expect(snapshot.counts.overduePending).toBe(0);
  });

  it("keeps future retry work out of overdue counts", () => {
    const snapshot = summarizeOwnerWorkerHealth(
      [
        row({
          scheduled_at: "2026-09-20T09:00:00.000Z",
          next_retry_at: "2026-09-20T13:00:00.000Z",
        }),
      ],
      enabled,
    );

    expect(snapshot.available).toBe(true);
    if (!snapshot.available) throw new Error("expected available snapshot");
    expect(snapshot.counts.futurePending).toBe(1);
    expect(snapshot.counts.overduePending).toBe(0);
  });

  it("uses retry eligibility for the oldest-overdue timestamp", () => {
    const snapshot = summarizeOwnerWorkerHealth(
      [
        row({
          scheduled_at: "2026-09-20T08:00:00.000Z",
          next_retry_at: "2026-09-20T10:30:00.000Z",
        }),
        row({ scheduled_at: "2026-09-20T10:00:00.000Z" }),
      ],
      enabled,
    );

    expect(snapshot.available).toBe(true);
    if (!snapshot.available) throw new Error("expected available snapshot");
    expect(snapshot.oldestOverdueAt).toBe("2026-09-20T10:00:00.000Z");
  });

  it("returns explicit unavailable state instead of fake zero counts", () => {
    expect(unavailableOwnerWorkerHealth()).toEqual({
      available: false,
      counts: null,
      totalJobs: null,
      oldestOverdueAt: null,
      errorCode: "worker_health_unavailable",
    });
  });

  it("does not project payload or customer content", () => {
    const sensitive = {
      ...row(),
      payload: {
        customerEmail: "private@example.com",
        notes: "private",
      },
      recipient: "private@example.com",
    };

    const snapshot = summarizeOwnerWorkerHealth([sensitive], enabled);
    const serialized = JSON.stringify(snapshot);

    expect(serialized).not.toContain("private@example.com");
    expect(serialized).not.toContain("notes");
    expect(serialized).not.toContain("payload");
  });

  it("orders background_jobs by id before offset pagination", async () => {
    const calls: string[] = [];
    requirePlatformOwner.mockResolvedValue({ user: { id: "owner-1" } });
    workerReliabilityEnabled.mockReturnValue(true);
    workerWebhooksEnabled.mockReturnValue(true);

    const builder = {
      select(columns: string) {
        calls.push(`select:${columns}`);
        return this;
      },
      order(column: string, options: { ascending: boolean }) {
        calls.push(`order:${column}:${String(options.ascending)}`);
        return this;
      },
      range(from: number, to: number) {
        calls.push(`range:${from}:${to}`);
        return Promise.resolve({ data: [row()], error: null });
      },
    };

    createServiceClient.mockReturnValue({
      from(table: string) {
        calls.push(`from:${table}`);
        return builder;
      },
    });

    const snapshot = await getOwnerWorkerHealthSnapshot();

    expect(snapshot.available).toBe(true);
    expect(calls).toEqual([
      "from:background_jobs",
      "select:status, job_type, scheduled_at, started_at, next_retry_at, cancelled_at",
      "order:id:true",
      "range:0:999",
    ]);
  });
});
