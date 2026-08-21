import { describe, expect, it } from "vitest";
import {
  LOCATION_INTERVAL_INHERIT_ERROR,
  propagateInheritedBookingInterval,
} from "@/lib/booking/interval-sync";

type Op = {
  table: string;
  method: "update" | "select";
  payload?: unknown;
  filters: Array<{ type: "eq" | "in"; column: string; value: unknown }>;
};

function createFakeSupabase(options?: {
  selectData?: Record<string, unknown>;
  updateErrors?: Record<string, { message: string } | null>;
}) {
  const ops: Op[] = [];

  function chain(table: string) {
    let current: Op | null = null;
    const c: Record<string, unknown> = {};
    const resultFor = (method: "update" | "select") => {
      if (method === "select") {
        return { data: options?.selectData?.[table] ?? [], error: null };
      }
      return { data: null, error: options?.updateErrors?.[table] ?? null };
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

describe("propagateInheritedBookingInterval — business default cascade", () => {
  it("updates inherited location A at 30 to 15 and leaves override B at 45 unmatched", async () => {
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

  it("returns an error instead of success when the cascade write fails", async () => {
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

  it("does not write when the business interval is unchanged", async () => {
    const supabase = createFakeSupabase();
    const result = await propagateInheritedBookingInterval(supabase, {
      locationIds: ["loc-a", "loc-b"],
      previousInterval: 15,
      nextInterval: 15,
    });
    expect(result.error).toBeUndefined();
    expect(supabase.ops).toHaveLength(0);
  });
});
