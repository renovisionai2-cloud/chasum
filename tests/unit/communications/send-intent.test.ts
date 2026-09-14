// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/observability/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
import { createSendIntentStore, inspectUnresolvedSendIntent, runDurableSend, type SendIntent, type SendIntentStore } from "@/lib/communications/send-intent";
import { createServiceClient } from "@/lib/supabase/service";

class DurableStore implements SendIntentStore {
  rows = new Map<string, SendIntent>();
  failInsert = false;
  failBeforeState?: SendIntent["state"];
  failAfterState?: SendIntent["state"];
  zeroState?: SendIntent["state"];
  private key(row: Pick<SendIntent, "business_id" | "intent_key">) { return `${row.business_id}:${row.intent_key}`; }
  async insert(row: SendIntent) {
    if (this.failInsert) throw Error("injected reservation outage");
    if (this.rows.has(this.key(row))) return null;
    this.rows.set(this.key(row), structuredClone(row));
    return structuredClone(row);
  }
  async find(businessId: string, key: string) {
    return structuredClone(this.rows.get(`${businessId}:${key}`) ?? null);
  }
  async compareAndSet(before: SendIntent, changes: Partial<SendIntent>) {
    if (changes.state === this.failBeforeState) throw Error("injected before-write failure");
    if (changes.state === this.zeroState) return null;
    const row = this.rows.get(this.key(before));
    if (!row || row.owner_id !== before.owner_id || row.state !== before.state || row.attempt !== before.attempt) return null;
    const next = { ...row, ...changes };
    this.rows.set(this.key(before), next);
    if (changes.state === this.failAfterState) throw Error("injected lost write response");
    return structuredClone(next);
  }
}

const input = {
  businessId: "business-a", channel: "email" as const, templateKey: "appointment.confirmation",
  to: "fictional@example.invalid", reliability: { intentId: "occurrence-one", jobId: "job-one", source: "worker" as const, attempt: 1 },
};
const accepted = { success: true, provider: "test", messageId: "synthetic-message" };
const manualInput = { ...input, entityType: "appointment" as const, entityId: "appointment-one" };

describe("manual retry unresolved guard", () => {
  it("holds unresolved occurrences only in the same tenant, entity, channel and template", async () => {
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "prior-manual", state: "unknown", attempt: 1 }, error: null }),
    };
    vi.mocked(createServiceClient).mockReturnValue({ from: () => query } as never);
    expect(await inspectUnresolvedSendIntent(manualInput)).toMatchObject({
      deliveryState: "unknown", retrySafe: false, reconciliationRequired: true, providerCalled: false,
    });
    expect(query.eq).toHaveBeenCalledWith("business_id", input.businessId);
    expect(query.eq).toHaveBeenCalledWith("channel", input.channel);
    expect(query.eq).toHaveBeenCalledWith("template_key", input.templateKey);
    expect(query.eq).toHaveBeenCalledWith("entity_type", "appointment");
    expect(query.eq).toHaveBeenCalledWith("entity_id", "appointment-one");
    expect(query.in).toHaveBeenCalledWith("state", ["sending", "unknown"]);
  });

  it("fails closed on a read error and permits a new explicit occurrence only after a clear read", async () => {
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: { message: "unavailable" } })
        .mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(createServiceClient).mockReturnValue({ from: () => query } as never);
    expect(await inspectUnresolvedSendIntent(manualInput)).toMatchObject({ retrySafe: false, reconciliationRequired: true });
    expect(await inspectUnresolvedSendIntent(manualInput)).toBeNull();
  });

  it("an uncertain receipt does not suppress a different receipt for the same recipient", async () => {
    const row = { id: "prior", business_id: input.businessId, channel: "email", template_key: "commerce.receipt",
      entity_type: "receipt", entity_id: "receipt-one", state: "unknown", attempt: 1 };
    vi.mocked(createServiceClient).mockReturnValue({ from: () => {
      const filters: Array<(candidate: Record<string, unknown>) => boolean> = [];
      const query = {
        select: () => query, limit: () => query,
        eq: (column: string, value: unknown) => { filters.push((candidate) => candidate[column] === value); return query; },
        in: (column: string, values: unknown[]) => { filters.push((candidate) => values.includes(candidate[column])); return query; },
        maybeSingle: async () => ({ data: filters.every((filter) => filter(row)) ? row : null, error: null }),
      };
      return query;
    } } as never);
    const receipt = { ...manualInput, templateKey: "commerce.receipt", entityType: "receipt" as const, entityId: "receipt-one" };
    expect(await inspectUnresolvedSendIntent(receipt)).toMatchObject({ deliveryState: "unknown", retrySafe: false });
    expect(await inspectUnresolvedSendIntent({ ...receipt, entityId: "receipt-two" })).toBeNull();
    expect(await inspectUnresolvedSendIntent({ ...receipt, to: "changed@example.invalid" })).toMatchObject({ deliveryState: "unknown" });
  });
});
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => { resolve = r; });
  return { promise, resolve };
}

describe("durable send-intent failure boundaries", () => {
  let store: DurableStore;
  beforeEach(() => { store = new DurableStore(); });

  it("commits ownership before provider and records acceptance", async () => {
    const provider = vi.fn(async (key: string) => {
      const row = [...store.rows.values()][0];
      expect(row.state).toBe("sending");
      expect(key).toBe(`chasum/${row.id}/1`);
      return accepted;
    });
    const result = await runDurableSend(input, provider, store);
    expect(result).toMatchObject({ success: true, deliveryState: "accepted", reconciliationRequired: false });
    expect([...store.rows.values()][0]).toMatchObject({ state: "accepted", provider_message_id: "synthetic-message" });
  });

  it("does not call provider when reservation cannot be confirmed", async () => {
    store.failInsert = true;
    const provider = vi.fn();
    expect(await runDurableSend(input, provider, store)).toMatchObject({ success: false, retrySafe: false, providerCalled: false });
    expect(provider).not.toHaveBeenCalled();
  });

  it("suppresses concurrent inline/worker overlap before provider returns", async () => {
    const started = deferred(); const release = deferred();
    const provider = vi.fn(async () => { started.resolve(); await release.promise; return accepted; });
    const first = runDurableSend(input, provider, store);
    await started.promise;
    const second = await runDurableSend({ ...input, reliability: { ...input.reliability, source: "inline" } }, provider, store);
    expect(second).toMatchObject({ deliveryState: "unknown", retrySafe: false, duplicateSuppressed: true, providerCalled: false });
    release.resolve(); await first;
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("retained DB state suppresses same job in a reconstructed service instance", async () => {
    const provider = vi.fn(async () => accepted);
    await runDurableSend(input, provider, store);
    const reconstructed: SendIntentStore = {
      insert: store.insert.bind(store), find: store.find.bind(store), compareAndSet: store.compareAndSet.bind(store),
    };
    const replay = await runDurableSend(input, provider, reconstructed);
    expect(replay).toMatchObject({ success: true, duplicateSuppressed: true, providerCalled: false });
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("provider acceptance followed by failed acceptance persistence stays successful and blocks replay", async () => {
    store.failBeforeState = "accepted";
    const provider = vi.fn(async () => accepted);
    expect(await runDurableSend(input, provider, store)).toMatchObject({ success: true, reconciliationRequired: true });
    expect([...store.rows.values()][0].state).toBe("sending");
    store.failBeforeState = undefined;
    expect(await runDurableSend(input, provider, store)).toMatchObject({ success: false, deliveryState: "unknown", retrySafe: false });
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("acceptance persisted but response lost is recovered without another provider call", async () => {
    store.failAfterState = "accepted";
    const provider = vi.fn(async () => accepted);
    expect(await runDurableSend(input, provider, store)).toMatchObject({ success: true, reconciliationRequired: true });
    store.failAfterState = undefined;
    expect(await runDurableSend(input, provider, store)).toMatchObject({ success: true, duplicateSuppressed: true });
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("zero affected acceptance rows is observable and never retry-safe", async () => {
    store.zeroState = "accepted";
    const result = await runDurableSend(input, async () => accepted, store);
    expect(result).toMatchObject({ success: true, reconciliationRequired: true, retrySafe: false });
  });

  it("thrown provider outcome remains unknown across process recreation", async () => {
    const provider = vi.fn(async () => { throw Error("accepted then connection reset"); });
    expect(await runDurableSend(input, provider, store)).toMatchObject({ deliveryState: "unknown", retrySafe: false });
    expect([...store.rows.values()][0].state).toBe("unknown");
    await runDurableSend(input, provider, store);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("confirmed failure retries with a new owned attempt", async () => {
    const provider = vi.fn().mockResolvedValueOnce({ success: false, provider: "test", retrySafe: true }).mockResolvedValueOnce(accepted);
    expect(await runDurableSend(input, provider, store)).toMatchObject({ deliveryState: "rejected", retrySafe: true });
    expect(await runDurableSend(input, provider, store)).toMatchObject({ success: true, intentAttempt: 2 });
    expect(provider.mock.calls[0][0]).not.toBe(provider.mock.calls[1][0]);
    expect([...store.rows.values()][0].attempt).toBe(2);
  });

  it("failed rejection persistence cannot authorize a retry", async () => {
    store.failBeforeState = "rejected";
    const provider = vi.fn(async () => ({ success: false, provider: "test", retrySafe: true }));
    expect(await runDurableSend(input, provider, store)).toMatchObject({ retrySafe: false, reconciliationRequired: true });
    store.failBeforeState = undefined;
    await runDurableSend(input, provider, store);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("only one contender owns a retry after confirmed rejection", async () => {
    await runDurableSend(input, async () => ({ success: false, provider: "test", retrySafe: true }), store);
    const provider = vi.fn(async () => accepted);
    await Promise.all([runDurableSend(input, provider, store), runDurableSend(input, provider, store)]);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("does not suppress legitimately distinct occurrences, channels, templates or tenants", async () => {
    const provider = vi.fn(async () => accepted);
    await runDurableSend(input, provider, store);
    await runDurableSend({ ...input, reliability: { ...input.reliability, intentId: "occurrence-two" } }, provider, store);
    await runDurableSend({ ...input, channel: "sms" }, provider, store);
    await runDurableSend({ ...input, templateKey: "appointment.staff" }, provider, store);
    await runDurableSend({ ...input, businessId: "business-b" }, provider, store);
    expect(provider).toHaveBeenCalledTimes(5);
  });

  it("changed recipient on the same occurrence is held, not silently sent again", async () => {
    const provider = vi.fn(async () => accepted);
    await runDurableSend(input, provider, store);
    expect(await runDurableSend({ ...input, to: "changed@example.invalid" }, provider, store)).toMatchObject({ error: "send_intent_identity_changed", retrySafe: false });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(JSON.stringify([...store.rows.values()])).not.toContain("@example.invalid");
  });

  it("has no time-based reclaim even beyond the provider idempotency window", async () => {
    store.failBeforeState = "accepted";
    const provider = vi.fn(async () => accepted);
    await runDurableSend(input, provider, store);
    for (const row of store.rows.values()) row.updated_at = "2000-01-01T00:00:00Z";
    store.failBeforeState = undefined;
    expect(await runDurableSend(input, provider, store)).toMatchObject({ providerCalled: false, retrySafe: false });
    expect(provider).toHaveBeenCalledTimes(1);
  });
});

describe("Supabase intent storage adapter", () => {
  it("checks database errors rather than treating missing rows as reservation success", async () => {
    vi.mocked(createServiceClient).mockReturnValue({ from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { code: "42P01" } }) }) }) }) } as never);
    await expect(createSendIntentStore().insert({} as SendIntent)).rejects.toThrow("intent_reservation_write_failed");
  });
  it("fences transitions by tenant, key, state, owner and attempt and checks zero rows", async () => {
    const filters: unknown[] = [];
    const chain = { eq: (key: string, value: unknown) => { filters.push([key, value]); return chain; }, select: () => chain, maybeSingle: async () => ({ data: null, error: null }) };
    vi.mocked(createServiceClient).mockReturnValue({ from: () => ({ update: () => chain }) } as never);
    const row = { id: "row", business_id: "tenant", intent_key: "key", state: "sending", owner_id: "owner", attempt: 2 } as SendIntent;
    expect(await createSendIntentStore().compareAndSet(row, { state: "accepted" })).toBeNull();
    expect(filters).toEqual([["id", "row"], ["business_id", "tenant"], ["intent_key", "key"], ["state", "sending"], ["owner_id", "owner"], ["attempt", 2]]);
  });
});
