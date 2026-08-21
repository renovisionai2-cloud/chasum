import { describe, expect, it } from "vitest";
import {
  applyLocationSchedulingInterval,
  BUSINESS_INTERVAL_SAVE_ERROR,
  isFollowingBusinessInterval,
  LOCATION_INTERVAL_INHERIT_ERROR,
  locationIntervalChangeTouchesBusiness,
  propagateInheritedBookingInterval,
  saveBusinessBookingInterval,
} from "@/lib/booking/interval-sync";

type Op = {
  table: string;
  method: "update" | "select";
  payload?: unknown;
  filters: Array<{ type: "eq" | "in"; column: string; value: unknown }>;
};

function createFakeSupabase(options?: {
  selectData?: Record<string, unknown>;
  updateErrors?: Record<string, { message: string } | null | Array<{ message: string } | null>>;
}) {
  const ops: Op[] = [];
  const updateCounts: Record<string, number> = {};

  function chain(table: string) {
    let current: Op | null = null;
    const c: Record<string, unknown> = {};
    const resultFor = (method: "update" | "select") => {
      if (method === "select") {
        return { data: options?.selectData?.[table] ?? [], error: null };
      }
      const configured = options?.updateErrors?.[table];
      const count = updateCounts[table] ?? 0;
      updateCounts[table] = count + 1;
      if (Array.isArray(configured)) {
        return { data: null, error: configured[count] ?? null };
      }
      return { data: null, error: configured ?? null };
    };
    c.update = (payload: unknown) => {
      current = { table, method: "update", payload, filters: [] };
      ops.push(current);
      return c;
    };
    c.select = (columns: string) => {
      current = { table, method: "select", payload: columns, filters: [] };
      ops.push(current);
      return c;
    };
    c.eq = (column: string, value: unknown) => {
      current?.filters.push({ type: "eq", column, value });
      return c;
    };
    c.in = (column: string, value: unknown) => {
      current?.filters.push({ type: "in", column, value });
      return c;
    };
    c.then = (
      resolve?: (value: unknown) => unknown,
      reject?: (reason: unknown) => unknown,
    ) =>
      Promise.resolve(resultFor(current?.method ?? "select")).then(
        resolve,
        reject,
      );
    return c;
  }

  return {
    ops,
    from: (table: string) => chain(table),
  };
}

describe("location interval inheritance decisions", () => {
  it("treats matching business and location intervals as inherited", () => {
    expect(isFollowingBusinessInterval(30, 30)).toBe(true);
    expect(isFollowingBusinessInterval(30, 15)).toBe(false);
  });

  it("touches the business default only when an inherited location changes", () => {
    expect(
      locationIntervalChangeTouchesBusiness({
        businessInterval: 30,
        currentLocationInterval: 30,
        nextInterval: 15,
      }),
    ).toBe(true);
    expect(
      locationIntervalChangeTouchesBusiness({
        businessInterval: 30,
        currentLocationInterval: 45,
        nextInterval: 15,
      }),
    ).toBe(false);
    expect(
      locationIntervalChangeTouchesBusiness({
        businessInterval: 30,
        currentLocationInterval: 15,
        nextInterval: 15,
      }),
    ).toBe(false);
  });
});

describe("propagateInheritedBookingInterval", () => {
  it("updates only locations still on the previous business default", async () => {
    const supabase = createFakeSupabase();
    const result = await propagateInheritedBookingInterval(supabase, {
      locationIds: ["loc-a", "loc-b"],
      previousInterval: 30,
      nextInterval: 15,
    });
    expect(result.error).toBeUndefined();
    expect(supabase.ops[0]).toMatchObject({
      table: "location_settings",
      method: "update",
      payload: { appointment_interval_minutes: 15 },
    });
    expect(supabase.ops[0]?.filters).toEqual(
      expect.arrayContaining([
        { type: "in", column: "location_id", value: ["loc-a", "loc-b"] },
        { type: "eq", column: "appointment_interval_minutes", value: 30 },
      ]),
    );
  });

  it("surfaces inheritance failure instead of succeeding silently", async () => {
    const supabase = createFakeSupabase({
      updateErrors: { location_settings: { message: "write failed" } },
    });
    const result = await propagateInheritedBookingInterval(supabase, {
      locationIds: ["loc-a"],
      previousInterval: 30,
      nextInterval: 15,
    });
    expect(result.error).toBe(LOCATION_INTERVAL_INHERIT_ERROR);
  });
});

describe("saveBusinessBookingInterval", () => {
  it("sets business 15 and inherited location A 15 while leaving override B at 45", async () => {
    const supabase = createFakeSupabase({
      selectData: {
        locations: [{ id: "loc-a" }, { id: "loc-b" }],
      },
    });
    const result = await saveBusinessBookingInterval(supabase, {
      businessId: "biz-1",
      previousInterval: 30,
      nextInterval: 15,
    });
    expect(result.error).toBeUndefined();
    expect(supabase.ops[0]).toMatchObject({
      table: "businesses",
      method: "update",
      payload: { appointment_interval_minutes: 15 },
    });
    expect(supabase.ops[0]?.filters).toContainEqual({
      type: "eq",
      column: "id",
      value: "biz-1",
    });
    const inherit = supabase.ops.find(
      (op) =>
        op.table === "location_settings" &&
        op.method === "update" &&
        (op.payload as { appointment_interval_minutes?: number })
          .appointment_interval_minutes === 15,
    );
    expect(inherit?.filters).toEqual(
      expect.arrayContaining([
        { type: "in", column: "location_id", value: ["loc-a", "loc-b"] },
        { type: "eq", column: "appointment_interval_minutes", value: 30 },
      ]),
    );
  });

  it("does not report success when the business update fails", async () => {
    const supabase = createFakeSupabase({
      updateErrors: { businesses: { message: "denied" } },
    });
    const result = await saveBusinessBookingInterval(supabase, {
      businessId: "biz-1",
      previousInterval: 30,
      nextInterval: 15,
    });
    expect(result.error).toBe(BUSINESS_INTERVAL_SAVE_ERROR);
    expect(
      supabase.ops.some((op) => op.table === "location_settings"),
    ).toBe(false);
  });
});

describe("applyLocationSchedulingInterval — Settings scheduling rules", () => {
  it("inherited location A at 30 becoming 15 also updates the business default", async () => {
    const supabase = createFakeSupabase({
      selectData: { locations: [{ id: "loc-a" }] },
    });
    const result = await applyLocationSchedulingInterval(supabase, {
      businessId: "biz-1",
      locationId: "loc-a",
      businessInterval: 30,
      currentLocationInterval: 30,
      nextInterval: 15,
      locationPatch: { appointment_interval_minutes: 15 },
    });
    expect(result.error).toBeUndefined();
    expect(result.touchedBusiness).toBe(true);
    expect(supabase.ops[0]).toMatchObject({
      table: "businesses",
      payload: { appointment_interval_minutes: 15 },
    });
  });

  it("does not change the business default when location B is already an override", async () => {
    const supabase = createFakeSupabase();
    const result = await applyLocationSchedulingInterval(supabase, {
      businessId: "biz-1",
      locationId: "loc-b",
      businessInterval: 30,
      currentLocationInterval: 45,
      nextInterval: 15,
      locationPatch: { appointment_interval_minutes: 15 },
    });
    expect(result.error).toBeUndefined();
    expect(result.touchedBusiness).toBe(false);
    expect(supabase.ops.some((op) => op.table === "businesses")).toBe(false);
    expect(supabase.ops[0]).toMatchObject({
      table: "location_settings",
      payload: { appointment_interval_minutes: 15 },
    });
    expect(supabase.ops[0]?.filters).toContainEqual({
      type: "eq",
      column: "location_id",
      value: "loc-b",
    });
  });

  it("does not report success when only the location write would succeed after a business failure", async () => {
    const supabase = createFakeSupabase({
      updateErrors: { businesses: { message: "denied" } },
    });
    const result = await applyLocationSchedulingInterval(supabase, {
      businessId: "biz-1",
      locationId: "loc-a",
      businessInterval: 30,
      currentLocationInterval: 30,
      nextInterval: 15,
      locationPatch: { appointment_interval_minutes: 15 },
    });
    expect(result.error).toBe(BUSINESS_INTERVAL_SAVE_ERROR);
    expect(
      supabase.ops.some(
        (op) =>
          op.table === "location_settings" &&
          (op.payload as { appointment_interval_minutes?: number })
            .appointment_interval_minutes === 15 &&
          op.filters.some((filter) => filter.column === "location_id" && filter.value === "loc-a"),
      ),
    ).toBe(false);
  });

  it("surfaces location inheritance failure instead of a success message", async () => {
    const supabase = createFakeSupabase({
      selectData: { locations: [{ id: "loc-a" }] },
      updateErrors: { location_settings: { message: "inherit failed" } },
    });
    const result = await applyLocationSchedulingInterval(supabase, {
      businessId: "biz-1",
      locationId: "loc-a",
      businessInterval: 30,
      currentLocationInterval: 30,
      nextInterval: 15,
      locationPatch: { appointment_interval_minutes: 15 },
    });
    expect(result.error).toBe(LOCATION_INTERVAL_INHERIT_ERROR);
  });
});
