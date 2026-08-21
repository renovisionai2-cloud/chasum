import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOCATION_INTERVAL_INHERIT_ERROR } from "@/lib/booking/interval-sync";

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

import { updateBusinessBookingSettings } from "@/lib/actions/business-management";

type Op = {
  table: string;
  method: "update" | "select";
  payload?: unknown;
  filters: Array<{ type: "eq" | "in"; column: string; value: unknown }>;
};

function bookingForm(interval: number) {
  const data = new FormData();
  data.set("appointment_interval_minutes", String(interval));
  data.set("booking_limit_days", "60");
  data.set("min_notice_minutes", "0");
  data.set("cancellation_window_hours", "24");
  data.set("booking_confirmation_mode", "auto");
  data.set("online_booking_enabled", "on");
  return data;
}

function mockClient(options?: {
  locationRows?: { id: string }[];
  locationListError?: { message: string } | null;
  windowUpdateError?: { message: string } | null;
  intervalUpdateError?: { message: string } | null;
  businessUpdateError?: { message: string } | null;
}) {
  const ops: Op[] = [];
  const locations = options?.locationRows ?? [{ id: "loc-a" }, { id: "loc-b" }];

  function chain(table: string) {
    let current: Op | null = null;
    const c: Record<string, unknown> = {};
    const resultFor = (method: "update" | "select") => {
      if (table === "locations" && method === "select") {
        return {
          data: options?.locationListError ? null : locations,
          error: options?.locationListError ?? null,
        };
      }
      if (table === "businesses" && method === "update") {
        return { data: null, error: options?.businessUpdateError ?? null };
      }
      if (table === "location_settings" && method === "update") {
        const payload = current?.payload as
          | { appointment_interval_minutes?: number; booking_limit_days?: number }
          | undefined;
        if (
          payload?.appointment_interval_minutes != null &&
          payload.booking_limit_days == null
        ) {
          return { data: null, error: options?.intervalUpdateError ?? null };
        }
        return { data: null, error: options?.windowUpdateError ?? null };
      }
      return { data: null, error: null };
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

  createClient.mockResolvedValue({
    from: (table: string) => chain(table),
  });

  return { ops };
}

describe("updateBusinessBookingSettings business-default cascade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrCreateBusiness.mockResolvedValue({
      id: "biz-1",
      appointment_interval_minutes: 30,
      booking_limit_days: 60,
    });
  });

  it("updates the business default and inherited locations, preserving overrides", async () => {
    const { ops } = mockClient();
    const result = await updateBusinessBookingSettings({}, bookingForm(15));

    expect(result).toEqual({ success: "Booking settings saved." });

    const businessUpdate = ops.find(
      (op) => op.table === "businesses" && op.method === "update",
    );
    expect(businessUpdate?.payload).toEqual(
      expect.objectContaining({ appointment_interval_minutes: 15 }),
    );

    const intervalCascade = ops.find(
      (op) =>
        op.table === "location_settings" &&
        op.method === "update" &&
        (op.payload as { appointment_interval_minutes?: number })
          ?.appointment_interval_minutes === 15 &&
        (op.payload as { booking_limit_days?: number }).booking_limit_days ==
          null,
    );
    expect(intervalCascade?.filters).toEqual(
      expect.arrayContaining([
        { type: "in", column: "location_id", value: ["loc-a", "loc-b"] },
        { type: "eq", column: "appointment_interval_minutes", value: 30 },
      ]),
    );
  });

  it("returns an error instead of success when the intended cascade fails", async () => {
    mockClient({
      intervalUpdateError: { message: "write failed" },
    });

    const result = await updateBusinessBookingSettings({}, bookingForm(15));
    expect(result).toEqual({ error: LOCATION_INTERVAL_INHERIT_ERROR });
    expect(result).not.toHaveProperty("success");
  });
});
