// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SendIntent, SendIntentStore } from "@/lib/communications/send-intent";

type Row = Record<string, unknown>;
const state = vi.hoisted(() => ({
  appointment: null as Row | null,
  entries: [] as Row[],
  statusWriteFails: false,
  readFails: null as string | null,
  notificationFails: false,
  filters: [] as Array<{ table: string; column: string; value: unknown }>,
  enqueue: vi.fn(),
}));

vi.mock("@/lib/integrations/jobs/queue", () => ({ enqueueEmailJob: state.enqueue, enqueueJob: vi.fn() }));
vi.mock("@/lib/observability/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: (table: string) => {
    const filters: Array<(row: Row) => boolean> = [];
    let patch: Row | null = null;
    let inserted = false;
    let singular = false;
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => {
        state.filters.push({ table, column, value });
        filters.push((row) => row[column] === value);
        return query;
      },
      limit: () => query,
      maybeSingle: () => { singular = true; return query; },
      update: (value: Row) => { patch = value; return query; },
      insert: () => { inserted = true; return query; },
      then: (resolve: (value: unknown) => unknown) => {
        if (state.readFails === table && !patch && !inserted) {
          return Promise.resolve({ data: null, error: { message: "Synthetic read failure" } }).then(resolve);
        }
        if (inserted) {
          return Promise.resolve({ data: null, error: state.notificationFails ? { message: "Synthetic insert failure" } : null }).then(resolve);
        }
        const rows = table === "appointments" ? state.appointment ? [state.appointment] : [] : state.entries;
        const matches = rows.filter((row) => filters.every((filter) => filter(row)));
        if (patch) {
          if (state.statusWriteFails) return Promise.resolve({ data: null, error: { message: "Synthetic status failure" } }).then(resolve);
          for (const row of matches) Object.assign(row, patch);
        }
        return Promise.resolve({ data: structuredClone(singular ? matches[0] ?? null : matches), error: null }).then(resolve);
      },
    };
    return query;
  } }),
}));

import { notifyWaitlistForSlot } from "@/lib/integrations/automation/waitlist";
import { waitlistChildIntentId } from "@/lib/communications/intent-identity";
import { runDurableSend } from "@/lib/communications/send-intent";

const BUSINESS = "02000000-0000-4000-8000-000000000001";
const OTHER_BUSINESS = "02000000-0000-4000-8000-000000000002";
const APPOINTMENT = "05000000-0000-4000-8000-000000000001";
const CUSTOMER = "04000000-0000-4000-8000-000000000001";
const ENTRY = "06000000-0000-4000-8000-000000000001";
const PARENT = "10000000-0000-4000-8000-000000000001";
const OTHER_PARENT = "10000000-0000-4000-8000-000000000002";

beforeEach(() => {
  state.filters = [];
  state.statusWriteFails = false;
  state.readFails = null;
  state.notificationFails = false;
  state.enqueue.mockReset().mockResolvedValue("synthetic-child-job");
  state.appointment = { id: APPOINTMENT, business_id: BUSINESS, service_id: "synthetic-service", staff_id: null, start_time: "2026-09-05T10:00:00Z" };
  state.entries = [{
    id: ENTRY, business_id: BUSINESS, service_id: "synthetic-service", preferred_date: "2026-09-05",
    status: "waiting", customer_id: CUSTOMER,
    customer: { id: CUSTOMER, business_id: BUSINESS, name: "Synthetic waitlist recipient", email: "synthetic-waitlist@example.invalid" },
  }];
});

describe("waitlist child send intent continuity", () => {
  it("reuses the child intent after enqueue succeeded but status persistence failed", async () => {
    state.statusWriteFails = true;
    await expect(notifyWaitlistForSlot(BUSINESS, APPOINTMENT, PARENT)).rejects.toThrow("waitlist_status_write_unconfirmed");
    expect(state.entries[0].status).toBe("waiting");
    expect(state.enqueue).toHaveBeenCalledTimes(1);
    state.statusWriteFails = false;
    await notifyWaitlistForSlot(BUSINESS, APPOINTMENT, PARENT);
    expect(state.enqueue).toHaveBeenCalledTimes(2);
    const first = state.enqueue.mock.calls[0][1] as Row;
    const second = state.enqueue.mock.calls[1][1] as Row;
    expect(first.sendIntentId).toBe(waitlistChildIntentId(PARENT, ENTRY));
    expect(second.sendIntentId).toBe(first.sendIntentId);
    expect(second).toMatchObject({ parentJobId: PARENT, waitlistEntryId: ENTRY, recipient: "synthetic-waitlist@example.invalid" });
    expect(state.entries[0].status).toBe("notified");
    expect(state.filters).toContainEqual({ table: "appointments", column: "business_id", value: BUSINESS });
    expect(state.filters.filter((filter) => filter.table === "waitlists" && filter.column === "business_id").length).toBe(4);

    // The producer really created two queue payloads. Feed BOTH through the real
    // durable send implementation using distinct child job IDs and shared
    // persistence, proving that stable identity prevents provider duplication.
    const rows = new Map<string, SendIntent>();
    const store: SendIntentStore = {
      async insert(row) {
        const key = `${row.business_id}/${row.intent_key}`;
        if (rows.has(key)) return null;
        rows.set(key, structuredClone(row));
        return structuredClone(row);
      },
      async find(businessId, key) {
        return structuredClone(rows.get(`${businessId}/${key}`) ?? null);
      },
      async compareAndSet(before, changes) {
        const row = rows.get(`${before.business_id}/${before.intent_key}`);
        if (!row || row.id !== before.id || row.state !== before.state ||
            row.owner_id !== before.owner_id || row.attempt !== before.attempt) return null;
        Object.assign(row, structuredClone(changes));
        return structuredClone(row);
      },
    };
    const provider = vi.fn().mockResolvedValue({ success: true, provider: "synthetic-local", messageId: "synthetic-message-id" });
    const results = [];
    for (const [index, payload] of [first, second].entries()) {
      results.push(await runDurableSend({
        businessId: BUSINESS, channel: "email", templateKey: String(payload.templateKey),
        to: String(payload.recipient),
        reliability: {
          intentId: String(payload.sendIntentId), source: "worker", attempt: 1,
          jobId: `20000000-0000-4000-8000-00000000000${index + 1}`,
        },
      }, provider, store));
    }
    expect(provider).toHaveBeenCalledTimes(1);
    expect(rows.size).toBe(1);
    expect(results[0]).toMatchObject({ success: true, providerCalled: true, deliveryState: "accepted" });
    expect(results[1]).toMatchObject({ success: true, providerCalled: false, duplicateSuppressed: true, deliveryState: "accepted" });
  });

  it("keeps distinct parent jobs and waitlist entries as distinct occurrences", async () => {
    expect(waitlistChildIntentId(PARENT, ENTRY)).not.toBe(waitlistChildIntentId(OTHER_PARENT, ENTRY));
    expect(waitlistChildIntentId(PARENT, ENTRY)).not.toBe(waitlistChildIntentId(PARENT, "06000000-0000-4000-8000-000000000002"));
    expect(waitlistChildIntentId(PARENT, ENTRY)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    state.statusWriteFails = true;
    await expect(notifyWaitlistForSlot(BUSINESS, APPOINTMENT, PARENT)).rejects.toThrow();
    await expect(notifyWaitlistForSlot(BUSINESS, APPOINTMENT, OTHER_PARENT)).rejects.toThrow();
    expect(state.enqueue.mock.calls[0][1].sendIntentId).not.toBe(state.enqueue.mock.calls[1][1].sendIntentId);
  });

  it("does not enqueue a foreign tenant appointment", async () => {
    state.appointment!.business_id = OTHER_BUSINESS;
    await notifyWaitlistForSlot(BUSINESS, APPOINTMENT, PARENT);
    expect(state.enqueue).not.toHaveBeenCalled();
  });

  it("does not send to a cross-tenant waitlist customer", async () => {
    (state.entries[0].customer as Row).business_id = OTHER_BUSINESS;
    await expect(notifyWaitlistForSlot(BUSINESS, APPOINTMENT, PARENT)).rejects.toThrow("waitlist_customer_tenant_or_recipient_unverified");
    expect(state.enqueue).not.toHaveBeenCalled();
  });

  it.each(["appointments", "waitlists"])("checks %s read errors before child enqueue", async (table) => {
    state.readFails = table;
    await expect(notifyWaitlistForSlot(BUSINESS, APPOINTMENT, PARENT)).rejects.toThrow(/waitlist_.*_read_failed/);
    expect(state.enqueue).not.toHaveBeenCalled();
  });

  it("surfaces notification persistence failure after the checked status transition", async () => {
    state.notificationFails = true;
    await expect(notifyWaitlistForSlot(BUSINESS, APPOINTMENT, PARENT)).rejects.toThrow("waitlist_notification_write_failed");
    expect(state.entries[0].status).toBe("notified");
    expect(state.enqueue).toHaveBeenCalledTimes(1);
    state.notificationFails = false;
    await notifyWaitlistForSlot(BUSINESS, APPOINTMENT, PARENT);
    expect(state.enqueue).toHaveBeenCalledTimes(1);
  });
});
