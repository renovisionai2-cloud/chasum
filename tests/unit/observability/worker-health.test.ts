import { describe, expect, it } from "vitest";
import {
  classifyWorkerJob,
  PENDING_OVERDUE_GRACE_MS,
  PROCESSING_STALE_MS,
} from "@/lib/observability/worker-health";

const now = new Date("2026-09-20T12:00:00.000Z");
const base = {
  job_type: "reminder",
  started_at: null,
  next_retry_at: null,
  cancelled_at: null,
};
const enabled = {
  now,
  workerReliabilityEnabled: true,
  workerWebhooksEnabled: true,
};

describe("worker health classifier", () => {
  it("distinguishes future, grace, and overdue pending work", () => {
    expect(
      classifyWorkerJob(
        { ...base, status: "pending", scheduled_at: "2026-09-20T12:01:00Z" },
        enabled,
      ),
    ).toBe("FUTURE_PENDING");
    expect(
      classifyWorkerJob(
        {
          ...base,
          status: "pending",
          scheduled_at: new Date(now.getTime() - 1_000).toISOString(),
        },
        enabled,
      ),
    ).toBe("PENDING_GRACE");
    expect(
      classifyWorkerJob(
        {
          ...base,
          status: "pending",
          scheduled_at: new Date(
            now.getTime() - PENDING_OVERDUE_GRACE_MS - 1,
          ).toISOString(),
        },
        enabled,
      ),
    ).toBe("OVERDUE_PENDING");
  });

  it("holds due work according to explicit worker policy", () => {
    const job = {
      ...base,
      status: "pending",
      scheduled_at: "2026-09-20T11:00:00Z",
    };
    expect(
      classifyWorkerJob(job, { ...enabled, workerReliabilityEnabled: false }),
    ).toBe("HELD_BY_CONFIG");
    expect(
      classifyWorkerJob(
        { ...job, job_type: "webhook" },
        { ...enabled, workerWebhooksEnabled: false },
      ),
    ).toBe("HELD_BY_CONFIG");
  });

  it("honors future retry scheduling even when the original schedule is old", () => {
    expect(
      classifyWorkerJob(
        {
          ...base,
          status: "pending",
          scheduled_at: "2026-09-20T10:00:00Z",
          next_retry_at: "2026-09-20T13:00:00Z",
        },
        enabled,
      ),
    ).toBe("FUTURE_PENDING");
  });

  it("classifies terminal and processing states", () => {
    expect(
      classifyWorkerJob(
        { ...base, status: "failed", scheduled_at: now.toISOString() },
        enabled,
      ),
    ).toBe("FAILED");
    expect(
      classifyWorkerJob(
        { ...base, status: "completed", scheduled_at: now.toISOString() },
        enabled,
      ),
    ).toBe("COMPLETED");
    expect(
      classifyWorkerJob(
        { ...base, status: "cancelled", scheduled_at: now.toISOString() },
        enabled,
      ),
    ).toBe("CANCELLED");
    expect(
      classifyWorkerJob(
        {
          ...base,
          status: "processing",
          scheduled_at: now.toISOString(),
          started_at: new Date(now.getTime() - 1_000).toISOString(),
        },
        enabled,
      ),
    ).toBe("FRESH_PROCESSING");
    expect(
      classifyWorkerJob(
        {
          ...base,
          status: "processing",
          scheduled_at: now.toISOString(),
          started_at: new Date(
            now.getTime() - PROCESSING_STALE_MS - 1,
          ).toISOString(),
        },
        enabled,
      ),
    ).toBe("STALE_PROCESSING");
  });

  it("returns INVALID for malformed timestamps, statuses, and job types", () => {
    expect(
      classifyWorkerJob(
        { ...base, status: "pending", scheduled_at: "not-a-date" },
        enabled,
      ),
    ).toBe("INVALID");
    expect(
      classifyWorkerJob(
        {
          ...base,
          status: "processing",
          scheduled_at: now.toISOString(),
          started_at: null,
        },
        enabled,
      ),
    ).toBe("INVALID");
    expect(
      classifyWorkerJob(
        { ...base, status: "unknown", scheduled_at: now.toISOString() },
        enabled,
      ),
    ).toBe("INVALID");
    expect(
      classifyWorkerJob(
        {
          ...base,
          job_type: "unknown_job_type",
          status: "pending",
          scheduled_at: now.toISOString(),
        },
        enabled,
      ),
    ).toBe("INVALID");
  });
});
