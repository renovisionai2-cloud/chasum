import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocationScope } from "@/lib/location/constants";
const mocks = vi.hoisted(() => ({
  scope: vi.fn(), locations: vi.fn(), active: vi.fn(), create: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: async () => ({ id: "business" }) }));
vi.mock("@/lib/actions/location", () => ({ getLocationScope: mocks.scope, getLocations: mocks.locations, getActiveLocationId: mocks.active }));
vi.mock("@/lib/booking-engine", () => ({ createBooking: mocks.create }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { createAppointment } from "@/lib/actions/appointments";
function form(location?: string) {
  const data = new FormData();
  Object.entries({ customer_id: "customer", service_id: "service", staff_id: "staff", start_time: "2026-10-01T12:00:00Z" }).forEach(([key, value]) => data.set(key, value));
  if (location !== undefined) data.set("location_id", location);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.scope.mockResolvedValue({ mode: "all" });
  mocks.locations.mockResolvedValue([{ id: "a", is_active: true }, { id: "b", is_active: true }]);
  // Stop after observing the engine boundary; no notification/payment/queue side effects.
  mocks.create.mockResolvedValue({ phase: "rollback", error: "engine boundary" });
});
describe("M1B server location guard", () => {
  it.each([undefined, "", "   "])("rejects multi-location ALL with empty Location (%s) before time parsing or effects", async (location) => {
    const data = form(location);
    data.set("start_time", "invalid time");
    data.set("payment_mode", "full");
    data.set("payment_amount_cents", "1000");
    expect(await createAppointment({}, data)).toEqual({ error: "Choose a location for this appointment before booking." });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.active).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("keeps customer/service validation ahead of Location resolution", async () => {
    expect(await createAppointment({}, new FormData())).toEqual({ error: "Customer and service are required." });
    expect(mocks.scope).not.toHaveBeenCalled();
    expect(mocks.locations).not.toHaveBeenCalled();
  });
  it("trims and preserves an explicitly submitted Location", async () => {
    await createAppointment({}, form("  b  "));
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ locationId: "b" }));
    expect(mocks.scope).not.toHaveBeenCalled();
  });
  it("resolves an empty Location from named workspace scope", async () => {
    mocks.scope.mockResolvedValue({ mode: "single", locationId: "b" });
    await createAppointment({}, form());
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ locationId: "b" }));
  });
  it.each<LocationScope>([{ mode: "all" }, { mode: "single", locationId: "stale" }])("uses the sole active Location regardless of scope %j", async (scope) => {
    mocks.scope.mockResolvedValue(scope);
    mocks.locations.mockResolvedValue([{ id: "sole", is_active: true }]);
    await createAppointment({}, form());
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ locationId: "sole" }));
    expect(mocks.active).not.toHaveBeenCalled();
  });
  it("rejects ALL with no active locations", async () => {
    mocks.locations.mockResolvedValue([]);
    expect(await createAppointment({}, form())).toHaveProperty("error", "Choose a location for this appointment before booking.");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("fails closed when a booking payment key is present but payment mode is missing", async () => {
    const data = form("b");
    data.set("payment_idempotency_key", "bs-test-key");
    expect(await createAppointment({}, data)).toEqual({
      error: "Payment selection could not be verified. Choose the payment option again before confirming.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("fails closed when a selected payment has no positive amount", async () => {
    const data = form("b");
    data.set("payment_idempotency_key", "bs-test-key");
    data.set("payment_mode", "deposit");
    data.set("payment_amount_cents", "0");
    data.set("payment_method", "e_transfer");
    expect(await createAppointment({}, data)).toEqual({
      error: "Payment amount could not be verified. Choose the payment option again before confirming.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("fails closed when a selected payment has no method", async () => {
    const data = form("b");
    data.set("payment_idempotency_key", "bs-test-key");
    data.set("payment_mode", "deposit");
    data.set("payment_amount_cents", "5000");
    expect(await createAppointment({}, data)).toEqual({
      error: "Payment method could not be verified. Choose the payment method again before confirming.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("accepts an explicit no-payment selection with a booking payment key", async () => {
    const data = form("b");
    data.set("payment_idempotency_key", "bs-test-key");
    data.set("payment_mode", "none");
    data.set("payment_amount_cents", "0");
    data.set("payment_method", "cash");
    await createAppointment({}, data);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ locationId: "b" }),
    );
  });

});
