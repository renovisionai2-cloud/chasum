import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrCreateBusiness = vi.fn();
const requireUser = vi.fn();
const supabaseFrom = vi.fn();
const insertStaff = vi.fn();

vi.mock("@/lib/actions/business", () => ({
  getOrCreateBusiness: (...args: unknown[]) => getOrCreateBusiness(...args),
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/actions/location", () => ({
  getActiveLocationId: async () => "loc-1",
  getLocationScope: async () => ({ mode: "all", locationId: null }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (...args: unknown[]) => supabaseFrom(...args),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createStaff } from "@/lib/actions/staff";
import { ensureOwnerAsBookableStaff } from "@/lib/actions/onboarding";

function chain(result: Record<string, unknown>) {
  const query: Record<string, unknown> = {};
  const self = () => query;
  query.select = self;
  query.insert = (...args: unknown[]) => {
    insertStaff(...args);
    return query;
  };
  query.upsert = self;
  query.eq = self;
  query.ilike = self;
  query.maybeSingle = async () => result;
  query.single = async () => result;
  query.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return query;
}

function staffForm() {
  const data = new FormData();
  data.set("name", "Alex Rivera");
  data.set("location_id", "loc-1");
  return data;
}

describe("createStaff server-side staff quota", () => {
  beforeEach(() => {
    getOrCreateBusiness.mockReset();
    requireUser.mockReset();
    supabaseFrom.mockReset();
    insertStaff.mockReset();
  });

  it("blocks a direct createStaff call on Free when one staff row already exists", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    supabaseFrom.mockImplementation((table: string) => {
      if (table === "staff") return chain({ count: 1, error: null, data: [] });
      if (table === "locations") {
        return chain({ data: { id: "loc-1" }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await createStaff({}, staffForm());
    expect(result.error).toMatch(
      /You've reached the 1 staff member included in Free/,
    );
    expect(result.error).toMatch(/Apply for Professional/);
    expect(insertStaff).not.toHaveBeenCalled();
  });

  it("allows the first Free staff member", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    supabaseFrom.mockImplementation((table: string) => {
      if (table === "staff") {
        return chain({
          count: 0,
          error: null,
          data: { id: "staff-1" },
        });
      }
      if (table === "locations") {
        return chain({ data: { id: "loc-1" }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await createStaff({}, staffForm());
    expect(result.error).toBeUndefined();
    expect(result.success).toBeTruthy();
    expect(insertStaff).toHaveBeenCalled();
  });

  it("blocks Professional at 3 existing staff", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "professional",
    });
    supabaseFrom.mockImplementation((table: string) => {
      if (table === "staff") return chain({ count: 3, error: null, data: [] });
      if (table === "locations") {
        return chain({ data: { id: "loc-1" }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await createStaff({}, staffForm());
    expect(result.error).toMatch(
      /You've reached the 3 staff members included in Professional/,
    );
    expect(insertStaff).not.toHaveBeenCalled();
  });

  it("allows Business to add more than 3 staff", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "business",
    });
    supabaseFrom.mockImplementation((table: string) => {
      if (table === "staff") {
        return chain({
          count: 4,
          error: null,
          data: { id: "staff-5" },
        });
      }
      if (table === "locations") {
        return chain({ data: { id: "loc-1" }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await createStaff({}, staffForm());
    expect(result.error).toBeUndefined();
    expect(insertStaff).toHaveBeenCalled();
  });

  it("does not delete existing over-limit rows — it only rejects the new insert", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    supabaseFrom.mockImplementation((table: string) => {
      if (table === "staff") return chain({ count: 4, error: null, data: [] });
      if (table === "locations") {
        return chain({ data: { id: "loc-1" }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await createStaff({}, staffForm());
    expect(result.error).toBeTruthy();
    expect(insertStaff).not.toHaveBeenCalled();
    expect(supabaseFrom).not.toHaveBeenCalledWith("staff_delete");
  });
});

describe("ensureOwnerAsBookableStaff respects the same quota", () => {
  beforeEach(() => {
    getOrCreateBusiness.mockReset();
    requireUser.mockReset();
    supabaseFrom.mockReset();
    insertStaff.mockReset();
    requireUser.mockResolvedValue({
      email: "owner@example.com",
      user_metadata: { full_name: "Owner Operator" },
    });
  });

  it("does not insert the owner when Free is already at 1 staff", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    supabaseFrom.mockImplementation((table: string) => {
      if (table === "staff") {
        return chain({
          count: 1,
          error: null,
          data: null,
        });
      }
      return chain({ data: null, error: null });
    });

    const result = await ensureOwnerAsBookableStaff();
    expect(result.error).toMatch(
      /You've reached the 1 staff member included in Free/,
    );
    expect(insertStaff).not.toHaveBeenCalled();
  });
});
