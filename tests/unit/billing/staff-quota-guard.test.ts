import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrCreateBusiness = vi.fn();
const requireUser = vi.fn();
const supabaseFrom = vi.fn();
const insertStaff = vi.fn();
const updateStaffRow = vi.fn();
const deleteStaffRow = vi.fn();
const recordedIsActiveEq: unknown[] = [];

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
    auth: {
      getUser: async () => ({ data: { user: { id: "user-1" } } }),
    },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/employees/service", () => ({
  logStaffActivity: vi.fn(),
  getEmployeeProfile: vi.fn(),
  listCustomRoles: vi.fn(),
  listDepartments: vi.fn(),
}));

import { createStaff, updateStaff } from "@/lib/actions/staff";
import {
  bulkUpdateEmployeeStatus,
  updateEmployeeProfile,
} from "@/lib/actions/employees";
import { ensureOwnerAsBookableStaff } from "@/lib/actions/onboarding";
import {
  assertCanActivateStaff,
  countBusinessStaff,
} from "@/lib/billing/staff-quota";

type StaffRow = { id: string; is_active: boolean };

function locationChain() {
  const query: Record<string, unknown> = {};
  const self = () => query;
  query.select = self;
  query.eq = self;
  query.maybeSingle = async () => ({ data: { id: "loc-1" }, error: null });
  query.single = async () => ({ data: { id: "loc-1" }, error: null });
  query.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) =>
    Promise.resolve({ data: { id: "loc-1" }, error: null }).then(
      onFulfilled,
      onRejected,
    );
  return query;
}

function junctionChain() {
  const query: Record<string, unknown> = {};
  const self = () => query;
  query.select = self;
  query.insert = self;
  query.update = self;
  query.delete = self;
  query.eq = self;
  query.in = self;
  query.upsert = self;
  query.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
  return query;
}

function staffChain(opts: {
  activeCount: number;
  unfilteredCount?: number;
  rows?: StaffRow[];
}) {
  const query: Record<string, unknown> = {};
  const state = {
    eqs: [] as Array<[string, unknown]>,
    inIds: null as string[] | null,
    usedIlike: false,
  };
  const self = () => query;
  query.select = self;
  query.insert = (...args: unknown[]) => {
    insertStaff(...args);
    return query;
  };
  query.update = (...args: unknown[]) => {
    updateStaffRow(...args);
    return query;
  };
  query.delete = () => {
    deleteStaffRow();
    return query;
  };
  query.upsert = self;
  query.eq = (col: string, val: unknown) => {
    state.eqs.push([col, val]);
    if (col === "is_active") recordedIsActiveEq.push(val);
    return query;
  };
  query.in = (_col: string, ids: string[]) => {
    state.inIds = ids;
    return query;
  };
  query.ilike = () => {
    state.usedIlike = true;
    return query;
  };
  query.maybeSingle = async () => {
    if (state.usedIlike) return { data: null, error: null };
    return { data: { id: "staff-existing" }, error: null };
  };
  query.single = async () => ({ data: { id: "staff-new" }, error: null });
  query.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => {
    if (state.inIds) {
      const rows = (opts.rows ?? []).filter((row) =>
        state.inIds!.includes(row.id),
      );
      return Promise.resolve({ data: rows, error: null }).then(
        onFulfilled,
        onRejected,
      );
    }
    const filteredActive = state.eqs.some(
      ([col, val]) => col === "is_active" && val === true,
    );
    const count = filteredActive
      ? opts.activeCount
      : (opts.unfilteredCount ?? opts.activeCount);
    return Promise.resolve({ count, error: null, data: [] }).then(
      onFulfilled,
      onRejected,
    );
  };
  return query;
}

function mockTables(opts: {
  activeCount: number;
  unfilteredCount?: number;
  rows?: StaffRow[];
}) {
  supabaseFrom.mockImplementation((table: string) => {
    if (table === "staff") return staffChain(opts);
    if (table === "locations") return locationChain();
    if (table === "staff_services" || table === "staff_locations") {
      return junctionChain();
    }
    return locationChain();
  });
}

function staffForm() {
  const data = new FormData();
  data.set("name", "Alex Rivera");
  data.set("location_id", "loc-1");
  return data;
}

function activateStaffForm(id: string) {
  const data = new FormData();
  data.set("id", id);
  data.set("name", "Alex Rivera");
  data.set("location_id", "loc-1");
  data.set("is_active", "true");
  return data;
}

function deactivateStaffForm(id: string) {
  const data = new FormData();
  data.set("id", id);
  data.set("name", "Alex Rivera");
  data.set("location_id", "loc-1");
  data.set("is_active", "false");
  return data;
}

function employeeActivateForm(id: string) {
  const data = new FormData();
  data.set("id", id);
  data.set("first_name", "Alex");
  data.set("last_name", "Rivera");
  data.set("location_id", "loc-1");
  data.set("is_active", "true");
  return data;
}

describe("countBusinessStaff uses staff.is_active = true", () => {
  beforeEach(() => {
    supabaseFrom.mockReset();
    recordedIsActiveEq.length = 0;
  });

  it("counts only the active filter result, not inactive historical rows", async () => {
    mockTables({ activeCount: 1, unfilteredCount: 4 });
    const count = await countBusinessStaff(
      { from: (...args: unknown[]) => supabaseFrom(...args) },
      "biz-1",
    );
    expect(count).toBe(1);
    expect(recordedIsActiveEq).toContain(true);
  });
});

describe("assertCanActivateStaff reactivation guard", () => {
  beforeEach(() => {
    supabaseFrom.mockReset();
    recordedIsActiveEq.length = 0;
  });

  it("Free: 1 active + 1 inactive → reactivation blocked", async () => {
    mockTables({
      activeCount: 1,
      rows: [{ id: "inactive-1", is_active: false }],
    });
    const result = await assertCanActivateStaff(
      { from: (...args: unknown[]) => supabaseFrom(...args) },
      { id: "biz-1", subscription_plan_key: "starter" },
      ["inactive-1"],
    );
    expect(result?.error).toMatch(
      /You've reached the 1 active staff member included in Free/,
    );
  });

  it("Free: 0 active + 1 inactive → reactivation allowed", async () => {
    mockTables({
      activeCount: 0,
      unfilteredCount: 1,
      rows: [{ id: "inactive-1", is_active: false }],
    });
    const result = await assertCanActivateStaff(
      { from: (...args: unknown[]) => supabaseFrom(...args) },
      { id: "biz-1", subscription_plan_key: "starter" },
      ["inactive-1"],
    );
    expect(result).toBeNull();
  });

  it("Professional: 3 active + 1 inactive → reactivation blocked", async () => {
    mockTables({
      activeCount: 3,
      unfilteredCount: 4,
      rows: [{ id: "inactive-1", is_active: false }],
    });
    const result = await assertCanActivateStaff(
      { from: (...args: unknown[]) => supabaseFrom(...args) },
      { id: "biz-1", subscription_plan_key: "professional" },
      ["inactive-1"],
    );
    expect(result?.error).toMatch(
      /You've reached the 3 active staff members included in Professional/,
    );
  });

  it("Professional: 2 active + 1 inactive → reactivation allowed", async () => {
    mockTables({
      activeCount: 2,
      unfilteredCount: 3,
      rows: [{ id: "inactive-1", is_active: false }],
    });
    const result = await assertCanActivateStaff(
      { from: (...args: unknown[]) => supabaseFrom(...args) },
      { id: "biz-1", subscription_plan_key: "professional" },
      ["inactive-1"],
    );
    expect(result).toBeNull();
  });

  it("does not consume a seat when the row is already active", async () => {
    mockTables({
      activeCount: 1,
      rows: [{ id: "active-1", is_active: true }],
    });
    const result = await assertCanActivateStaff(
      { from: (...args: unknown[]) => supabaseFrom(...args) },
      { id: "biz-1", subscription_plan_key: "starter" },
      ["active-1"],
    );
    expect(result).toBeNull();
  });
});

describe("createStaff server-side staff quota", () => {
  beforeEach(() => {
    getOrCreateBusiness.mockReset();
    requireUser.mockReset();
    supabaseFrom.mockReset();
    insertStaff.mockReset();
    updateStaffRow.mockReset();
    deleteStaffRow.mockReset();
    recordedIsActiveEq.length = 0;
  });

  it("Free: 0 active → create allowed", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    mockTables({ activeCount: 0, unfilteredCount: 0 });

    const result = await createStaff({}, staffForm());
    expect(result.error).toBeUndefined();
    expect(result.success).toBeTruthy();
    expect(insertStaff).toHaveBeenCalled();
    expect(recordedIsActiveEq).toContain(true);
  });

  it("Free: 1 active → create blocked", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    mockTables({ activeCount: 1, unfilteredCount: 1 });

    const result = await createStaff({}, staffForm());
    expect(result.error).toMatch(
      /You've reached the 1 active staff member included in Free/,
    );
    expect(result.error).toMatch(/apply for Professional/i);
    expect(insertStaff).not.toHaveBeenCalled();
  });

  it("Free: 1 inactive / 0 active → create allowed", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    mockTables({ activeCount: 0, unfilteredCount: 1 });

    const result = await createStaff({}, staffForm());
    expect(result.error).toBeUndefined();
    expect(insertStaff).toHaveBeenCalled();
  });

  it("Free: 1 active + historical inactive → create blocked only because active count = 1", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    mockTables({ activeCount: 1, unfilteredCount: 3 });

    const result = await createStaff({}, staffForm());
    expect(result.error).toMatch(
      /You've reached the 1 active staff member included in Free/,
    );
    expect(insertStaff).not.toHaveBeenCalled();
    expect(deleteStaffRow).not.toHaveBeenCalled();
  });

  it("Professional: 2 active + any inactive → create allowed", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "professional",
    });
    mockTables({ activeCount: 2, unfilteredCount: 5 });

    const result = await createStaff({}, staffForm());
    expect(result.error).toBeUndefined();
    expect(insertStaff).toHaveBeenCalled();
  });

  it("Professional: 3 active + any inactive → create blocked", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "professional",
    });
    mockTables({ activeCount: 3, unfilteredCount: 6 });

    const result = await createStaff({}, staffForm());
    expect(result.error).toMatch(
      /You've reached the 3 active staff members included in Professional/,
    );
    expect(insertStaff).not.toHaveBeenCalled();
  });

  it("Business: active count unrestricted", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "business",
    });
    mockTables({ activeCount: 40, unfilteredCount: 40 });

    const result = await createStaff({}, staffForm());
    expect(result.error).toBeUndefined();
    expect(insertStaff).toHaveBeenCalled();
  });

  it("Enterprise: active count unrestricted", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "enterprise",
    });
    mockTables({ activeCount: 200, unfilteredCount: 200 });

    const result = await createStaff({}, staffForm());
    expect(result.error).toBeUndefined();
    expect(insertStaff).toHaveBeenCalled();
  });

  it("does not delete existing over-limit rows — it only rejects the new insert", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    mockTables({ activeCount: 4, unfilteredCount: 4 });

    const result = await createStaff({}, staffForm());
    expect(result.error).toBeTruthy();
    expect(insertStaff).not.toHaveBeenCalled();
    expect(deleteStaffRow).not.toHaveBeenCalled();
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

  it("does not insert the owner when Free is already at 1 active staff", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    mockTables({ activeCount: 1, unfilteredCount: 1 });

    const result = await ensureOwnerAsBookableStaff();
    expect(result.error).toMatch(
      /You've reached the 1 active staff member included in Free/,
    );
    expect(insertStaff).not.toHaveBeenCalled();
  });
});

describe("deactivation frees an active seat without deleting history", () => {
  beforeEach(() => {
    getOrCreateBusiness.mockReset();
    supabaseFrom.mockReset();
    insertStaff.mockReset();
    updateStaffRow.mockReset();
    deleteStaffRow.mockReset();
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
  });

  it("allows active → inactive at the Free cap and does not delete the row", async () => {
    mockTables({
      activeCount: 1,
      unfilteredCount: 2,
      rows: [{ id: "active-1", is_active: true }],
    });

    const result = await updateStaff({}, deactivateStaffForm("active-1"));
    expect(result.error).toBeUndefined();
    expect(result.success).toBeTruthy();
    expect(updateStaffRow).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
    );
    expect(deleteStaffRow).not.toHaveBeenCalled();
  });
});

describe("reactivation cannot bypass the server-side quota", () => {
  beforeEach(() => {
    getOrCreateBusiness.mockReset();
    supabaseFrom.mockReset();
    insertStaff.mockReset();
    updateStaffRow.mockReset();
    deleteStaffRow.mockReset();
  });

  it("blocks a direct updateStaff reactivation on Free when 1 active already exists", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    mockTables({
      activeCount: 1,
      unfilteredCount: 2,
      rows: [{ id: "inactive-1", is_active: false }],
    });

    const result = await updateStaff({}, activateStaffForm("inactive-1"));
    expect(result.error).toMatch(
      /You've reached the 1 active staff member included in Free/,
    );
    expect(updateStaffRow).not.toHaveBeenCalled();
  });

  it("allows updateStaff reactivation on Free when 0 active remain", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "starter",
    });
    mockTables({
      activeCount: 0,
      unfilteredCount: 1,
      rows: [{ id: "inactive-1", is_active: false }],
    });

    const result = await updateStaff({}, activateStaffForm("inactive-1"));
    expect(result.error).toBeUndefined();
    expect(updateStaffRow).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true }),
    );
  });

  it("blocks a direct updateEmployeeProfile reactivation on Professional at 3 active", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "professional",
    });
    mockTables({
      activeCount: 3,
      unfilteredCount: 4,
      rows: [{ id: "inactive-1", is_active: false }],
    });

    const result = await updateEmployeeProfile(
      {},
      employeeActivateForm("inactive-1"),
    );
    expect(result.error).toMatch(
      /You've reached the 3 active staff members included in Professional/,
    );
    expect(updateStaffRow).not.toHaveBeenCalled();
  });

  it("blocks a direct bulkUpdateEmployeeStatus activation on Professional at 3 active", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "professional",
    });
    mockTables({
      activeCount: 3,
      unfilteredCount: 4,
      rows: [{ id: "inactive-1", is_active: false }],
    });

    const result = await bulkUpdateEmployeeStatus(["inactive-1"], true);
    expect(result.error).toMatch(
      /You've reached the 3 active staff members included in Professional/,
    );
    expect(updateStaffRow).not.toHaveBeenCalled();
  });

  it("allows bulk deactivation without a quota check and without deleting rows", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "professional",
    });
    mockTables({
      activeCount: 3,
      rows: [{ id: "active-1", is_active: true }],
    });

    const result = await bulkUpdateEmployeeStatus(["active-1"], false);
    expect(result.error).toBeUndefined();
    expect(updateStaffRow).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
    );
    expect(deleteStaffRow).not.toHaveBeenCalled();
  });

  it("blocks a multi-row bulk reactivation atomically when requested seats exceed remaining capacity", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "professional",
    });
    mockTables({
      activeCount: 2,
      unfilteredCount: 5,
      rows: [
        { id: "inactive-1", is_active: false },
        { id: "inactive-2", is_active: false },
        { id: "inactive-3", is_active: false },
      ],
    });

    const result = await bulkUpdateEmployeeStatus(
      ["inactive-1", "inactive-2", "inactive-3"],
      true,
    );
    expect(result.error).toMatch(
      /You've reached the 3 active staff members included in Professional/,
    );
    expect(updateStaffRow).not.toHaveBeenCalled();
    expect(deleteStaffRow).not.toHaveBeenCalled();
  });

  it("allows a multi-row bulk reactivation that fits remaining active seats", async () => {
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      subscription_plan_key: "professional",
    });
    mockTables({
      activeCount: 1,
      unfilteredCount: 3,
      rows: [
        { id: "inactive-1", is_active: false },
        { id: "inactive-2", is_active: false },
      ],
    });

    const result = await bulkUpdateEmployeeStatus(
      ["inactive-1", "inactive-2"],
      true,
    );
    expect(result.error).toBeUndefined();
    expect(result.success).toMatch(/Activated 2/);
    expect(updateStaffRow).toHaveBeenCalledTimes(1);
    expect(updateStaffRow).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true }),
    );
  });
});
