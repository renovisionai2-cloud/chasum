import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrCreateBusiness = vi.fn();
const createClient = vi.fn();

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: (...args: unknown[]) => getOrCreateBusiness(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => ({ value: "loc-a" }),
  }),
}));

import { updateLocationSettings } from "@/lib/actions/location";

type Op = {
  table: string;
  method: string;
  payload?: unknown;
  filters: Array<{ type: string; column: string; value: unknown }>;
};

function thenableChain(
  ops: Op[],
  table: string,
  result: { data?: unknown; error?: unknown },
) {
  let current: Op | null = null;
  const chain: Record<string, unknown> = {};
  chain.select = (columns?: string) => {
    current = { table, method: "select", payload: columns, filters: [] };
    ops.push(current);
    return chain;
  };
  chain.update = (payload: unknown) => {
    current = { table, method: "update", payload, filters: [] };
    ops.push(current);
    return chain;
  };
  chain.eq = (column: string, value: unknown) => {
    current?.filters.push({ type: "eq", column, value });
    return chain;
  };
  chain.in = (column: string, value: unknown) => {
    current?.filters.push({ type: "in", column, value });
    return chain;
  };
  chain.order = () => chain;
  chain.maybeSingle = async () => result;
  chain.single = async () => result;
  chain.then = (
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

function mockClient(
  locations: {
    id: string;
    is_default?: boolean;
    is_active?: boolean;
    name?: string;
    business_id?: string;
  }[],
) {
  const ops: Op[] = [];
  const active =
    locations.find((row) => row.id === "loc-a") ?? locations[0] ?? null;

  createClient.mockResolvedValue({
    from: (table: string) => {
      if (table === "locations") {
        const chain = thenableChain(ops, "locations", {
          data: locations,
          error: null,
        });
        chain.maybeSingle = async () => ({
          data: active ? { id: active.id } : null,
          error: null,
        });
        chain.single = async () => ({
          data: active ? { id: active.id } : null,
          error: null,
        });
        return chain;
      }
      if (table === "location_settings") {
        return thenableChain(ops, "location_settings", {
          data: null,
          error: null,
        });
      }
      if (table === "businesses") {
        return thenableChain(ops, "businesses", {
          error: { message: "businesses table should not be written" },
        });
      }
      return thenableChain(ops, table, {
        error: { message: `unexpected table ${table}` },
      });
    },
  });

  return { ops };
}

function schedulingForm(interval: number) {
  const data = new FormData();
  data.set("appointment_interval_minutes", String(interval));
  data.set("booking_limit_days", "60");
  return data;
}

function locationIntervalUpdates(ops: Op[]) {
  return ops.filter(
    (op) =>
      op.table === "location_settings" &&
      op.method === "update" &&
      Boolean(
        (op.payload as { appointment_interval_minutes?: number } | undefined)
          ?.appointment_interval_minutes,
      ),
  );
}

describe("updateLocationSettings is location-scoped", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      appointment_interval_minutes: 30,
    });
  });

  it("changes only Location A to 15 when A and B both matched the business default of 30", async () => {
    const { ops } = mockClient([
      {
        id: "loc-a",
        is_default: true,
        is_active: true,
        name: "Main",
        business_id: "biz-1",
      },
      {
        id: "loc-b",
        is_default: false,
        is_active: true,
        name: "East",
        business_id: "biz-1",
      },
    ]);

    const result = await updateLocationSettings({}, schedulingForm(15));
    expect(result).toEqual({
      success: "Location scheduling settings updated.",
    });

    const intervalUpdates = locationIntervalUpdates(ops);
    expect(intervalUpdates).toHaveLength(1);
    expect(intervalUpdates[0]?.payload).toEqual(
      expect.objectContaining({ appointment_interval_minutes: 15 }),
    );
    expect(intervalUpdates[0]?.filters).toEqual(
      expect.arrayContaining([
        { type: "eq", column: "location_id", value: "loc-a" },
      ]),
    );
    expect(
      ops.some((op) => op.filters.some((filter) => filter.type === "in")),
    ).toBe(false);
    expect(ops.some((op) => op.table === "businesses")).toBe(false);
  });

  it("does not change the business default when Location A is already an override", async () => {
    const { ops } = mockClient([
      {
        id: "loc-a",
        is_default: true,
        is_active: true,
        name: "Main",
        business_id: "biz-1",
      },
    ]);
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      appointment_interval_minutes: 30,
    });

    const result = await updateLocationSettings({}, schedulingForm(15));
    expect(result).toEqual({
      success: "Location scheduling settings updated.",
    });
    expect(ops.some((op) => op.table === "businesses")).toBe(false);
    expect(locationIntervalUpdates(ops)[0]?.filters).toEqual(
      expect.arrayContaining([
        { type: "eq", column: "location_id", value: "loc-a" },
      ]),
    );
  });

  it("never performs businesses.update for interval changes", async () => {
    const { ops } = mockClient([
      {
        id: "loc-a",
        is_default: true,
        is_active: true,
        name: "Main",
        business_id: "biz-1",
      },
    ]);

    await updateLocationSettings({}, schedulingForm(15));
    expect(
      ops.some((op) => op.table === "businesses" && op.method === "update"),
    ).toBe(false);
  });
});
