import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrCreateBusiness = vi.fn();
const supabaseFrom = vi.fn();
const insertLocation = vi.fn();
const rpc = vi.fn();
let locationRows: Array<{ id: string; is_default: boolean; is_active: boolean }> =
  [];

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: (...args: unknown[]) => getOrCreateBusiness(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (...args: unknown[]) => supabaseFrom(...args),
    rpc: (...args: unknown[]) => rpc(...args),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: vi.fn(),
  }),
}));

import { createLocation } from "@/lib/actions/location";

function mutableChain(rows: unknown[]) {
  const query: Record<string, unknown> = {};
  const self = () => query;
  query.select = self;
  query.eq = self;
  query.order = self;
  query.maybeSingle = async () => ({ data: rows[0] ?? null, error: null });
  query.single = async () => ({ data: { id: "loc-new" }, error: null });
  query.insert = (...args: unknown[]) => {
    insertLocation(...args);
    return query;
  };
  query.upsert = self;
  query.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve({ data: rows, error: null }).then(onFulfilled, onRejected);
  return query;
}

function locationForm() {
  const data = new FormData();
  data.set("name", "Second Studio");
  return data;
}

function rows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `loc-${i}`,
    is_default: i === 0,
    is_active: true,
  }));
}

describe("createLocation application-layer catalog cap", () => {
  beforeEach(() => {
    getOrCreateBusiness.mockReset();
    supabaseFrom.mockReset();
    insertLocation.mockReset();
    rpc.mockReset();
    locationRows = [];
    rpc.mockResolvedValue({ data: true });
    supabaseFrom.mockImplementation((table: string) => {
      if (table === "locations") return mutableChain(locationRows);
      if (table === "location_settings" || table === "location_hours") {
        return mutableChain([]);
      }
      if (table === "subscription_plans") {
        return mutableChain([
          {
            plan_key: "business",
            name: "Business",
            max_locations: 10,
          },
        ]);
      }
      return mutableChain([]);
    });
  });

  it("blocks Business at 6 even when the RPC/DB would allow 10", async () => {
    locationRows = rows(6);
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "business",
      timezone: "America/Toronto",
    });

    const result = await createLocation({}, locationForm());
    expect(result.error).toMatch(
      /You've reached the 6 locations included in Business/,
    );
    expect(insertLocation).not.toHaveBeenCalled();
  });

  it("allows Business to add a sixth location", async () => {
    locationRows = rows(5);
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "business",
      timezone: "America/Toronto",
    });

    const result = await createLocation({}, locationForm());
    expect(result.error).toBeUndefined();
    expect(result.success).toMatch(/created/);
    expect(insertLocation).toHaveBeenCalled();
  });

  it("blocks Free at 1 location", async () => {
    locationRows = rows(1);
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });

    const result = await createLocation({}, locationForm());
    expect(result.error).toMatch(
      /You've reached the 1 location included in Free/,
    );
    expect(insertLocation).not.toHaveBeenCalled();
  });

  it("blocks Professional at 3 locations", async () => {
    locationRows = rows(3);
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "professional",
    });

    const result = await createLocation({}, locationForm());
    expect(result.error).toMatch(
      /You've reached the 3 locations included in Professional/,
    );
  });

  it("does not cap Enterprise", async () => {
    locationRows = rows(12);
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "enterprise",
      timezone: "America/Toronto",
    });

    const result = await createLocation({}, locationForm());
    expect(result.error).toBeUndefined();
    expect(insertLocation).toHaveBeenCalled();
  });
});
