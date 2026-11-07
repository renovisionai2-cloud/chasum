// @vitest-environment node
import { createClient as makeClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: vi.fn(), emit: vi.fn(), audit: vi.fn(), refresh: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.refresh }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("@/lib/booking-engine/events", async (original) => ({ ...await original<object>(), emitBookingEvent: mocks.emit }));
vi.mock("@/lib/booking-engine/conflicts", async (original) => ({ ...await original<object>(), logAppointmentChange: mocks.audit }));
// Real actions, real requireBusiness/auth resolution, real engine and real availability module.
import { setAppointmentStatus, updateAppointment } from "@/lib/actions/appointments";
import { clearAvailabilityCache } from "@/lib/booking-engine/availability";
const NOW = "2026-10-25T16:00:00.000Z";
function appointment() {
  return {
    id: "appt", business_id: "biz", customer_id: "customer", service_id: "service",
    staff_id: "staff", location_id: "location", room_id: "room", notes: "Historical package notes",
    start_time: "2026-10-24T14:00:00+00:00", end_time: "2026-10-24T15:15:00+00:00",
    updated_at: "2026-10-24T13:00:00+00:00", status: "confirmed", booking_operation_id: null,
    price_cents: 10000, tax_cents: 1300, deposit_cents: 5000, amount_paid_cents: 5000,
    amount_refunded_cents: 0, payment_status: "partial", invoice_number: "INV-1",
  };
}
let row: Record<string, unknown>;
let workflow: string[] | null;
let catalogActive: boolean;
let minNotice: number;
let beforeWrite: (() => void) | undefined;
let writeMode: "normal" | "zero" | "denied" | "lost";
let requests: Array<{ path: string; method: string; url: URL; body: Record<string, unknown> }>;
let patches: Record<string, unknown>[];
let signedIn = true;
let ownsBusiness = true;
// Actual supabase-js/PostgREST query serialization; only HTTP/database persistence is synthetic.
async function offlineFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(String(input));
  const path = url.pathname.split("/").pop()!;
  const method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  requests.push({ path, method, url, body });
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
  if (url.pathname.includes("/rpc/")) {
    const message = Date.parse(body.p_start_time) <= Date.now()
      ? "Appointment must be in the future" : "Time slot not available";
    return json({ message, code: "P0001" }, 400);
  }
  const business = { id: "biz", appointment_status_workflow: workflow, timezone: "America/Toronto", min_notice_minutes: minNotice };
  const tables: Record<string, Record<string, unknown>[]> = {
    appointments: [row], businesses: [{ ...business, owner_id: ownsBusiness ? "operator" : "different-owner" }], business_members: [],
    services: [{ id: "service", business_id: "biz", location_id: "location", is_active: catalogActive, duration_minutes: 30 }],
    staff: [{ id: "staff", business_id: "biz", location_id: "location", is_active: catalogActive }],
    staff_services: [{ staff_id: "staff", service_id: "service" }],
    locations: [{ id: "location", business_id: "biz", timezone: "America/Toronto" }],
    location_settings: [], staff_locations: [], service_locations: [],
  };
  if (!(path in tables)) throw new Error(`Unexpected database access: ${path}`);
  if (method === "PATCH") {
    patches.push(body);
    beforeWrite?.(); beforeWrite = undefined;
    if (writeMode === "denied") return json({ message: "private database detail", code: "42501" }, 403);
  }
  const selected = tables[path].filter((record) => [...url.searchParams].every(([key, value]) => {
    if (["select", "order", "limit"].includes(key)) return true;
    if (value === "is.null") return record[key] == null;
    if (value.startsWith("eq.")) return String(record[key]) === value.slice(3);
    throw new Error(`Unhandled filter: ${key}=${value}`);
  }));
  if (method === "PATCH" && writeMode === "zero") selected.length = 0;
  if (method === "PATCH") for (const match of selected) Object.assign(match, body);
  if (method === "PATCH" && writeMode === "lost") return json({ message: "network response lost", code: "502" }, 502);
  const headers = new Headers(init?.headers);
  return json(headers.get("Accept")?.includes("vnd.pgrst.object") ? selected[0] ?? null : selected);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(NOW));
  row = appointment(); workflow = null; catalogActive = true; minNotice = 0;
  requests = []; patches = []; beforeWrite = undefined; writeMode = "normal";
  mocks.emit.mockReset().mockImplementation(async (event) => event); mocks.audit.mockReset().mockResolvedValue(undefined);
  signedIn = true; ownsBusiness = true;
  mocks.refresh.mockReset();
  const client = makeClient("https://n06.invalid", "synthetic-offline-key", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: offlineFetch } });
  vi.spyOn(client.auth, "getUser").mockImplementation(async () => ({ data: { user: signedIn ? { id: "operator", app_metadata: {} } : null }, error: null }) as never);
  mocks.client.mockResolvedValue(client); clearAvailabilityCache();
});
afterEach(() => { vi.useRealTimers(); });

describe("N06 real action-to-engine boundary", () => {
  it.each(["confirmed", "arrived"])("completes past %s despite now-inactive catalog", async (status) => {
    row.status = status; catalogActive = false; minNotice = 99999;
    const before = structuredClone(row);
    const result = await setAppointmentStatus("appt", "completed");
    expect(result.success).toBeDefined(); expect(result.error).toBeUndefined();
    expect(row).toEqual({ ...before, status: "completed" });
    expect(patches).toEqual([{ status: "completed" }]);
    expect(requests.some((r) => r.path === "services" || r.path === "validate_appointment_slot")).toBe(false);
    expect(mocks.emit).toHaveBeenCalledOnce();
    expect(mocks.refresh).toHaveBeenCalledWith("/dashboard/calendar");
  });
  it("same ID/status retry reaches a no-op and does not send completion twice", async () => {
    await setAppointmentStatus("appt", "completed");
    expect((await setAppointmentStatus("appt", "completed")).success).toBeDefined();
    expect(patches).toHaveLength(1); expect(mocks.emit).toHaveBeenCalledOnce();
  });
  it("the status-dropdown Save still traverses real scheduling validation", async () => {
    const form = new FormData();
    for (const [key, value] of Object.entries({ id: "appt", customer_id: "customer", service_id: "service", staff_id: "staff", location_id: "location", start_time: row.start_time, status: "completed", notes: "edited notes", duration_minutes: "75" })) form.set(key, String(value));
    const result = await updateAppointment({}, form);
    expect(result.error).toBe("Appointment must be in the future");
    expect(requests.some((r) => r.path === "validate_appointment_slot")).toBe(true);
    expect(patches).toEqual([]); expect(row.notes).toBe("Historical package notes");
  });
  it("authenticates before loading an appointment", async () => {
    signedIn = false;
    await expect(setAppointmentStatus("appt", "completed")).rejects.toThrow("redirect:/login");
    expect(requests.some((r) => r.path === "appointments")).toBe(false);
  });
  it("J denies a signed-in user with no authorized Business before reading appointments", async () => {
    ownsBusiness = false;
    await expect(setAppointmentStatus("appt", "completed")).rejects.toThrow("redirect:/onboarding/business");
    expect(requests.some((r) => r.path === "appointments")).toBe(false);
    expect(patches).toEqual([]);
  });
  it("J rejects a different Business's appointment without exposing it", async () => {
    row.business_id = "foreign";
    expect(await setAppointmentStatus("appt", "completed")).toEqual({ error: "Appointment not found." });
    expect(patches).toEqual([]); expect(mocks.emit).not.toHaveBeenCalled();
  });
  it("rejects unknown status and cancelled rows before any write", async () => {
    expect((await setAppointmentStatus("appt", "forged" as never)).error).toMatch(/valid appointment status/);
    row.status = "cancelled";
    expect((await setAppointmentStatus("appt", "completed")).error).toMatch(/terminal/);
    expect(patches).toEqual([]);
  });
  it("blocks before start without invoking the scheduling RPC", async () => {
    row.start_time = "2026-10-26T14:00:00Z"; row.end_time = "2026-10-26T15:00:00Z";
    expect((await setAppointmentStatus("appt", "completed")).error).toMatch(/before their scheduled start/);
    expect(patches).toEqual([]);
    expect(requests.some((r) => r.path === "validate_appointment_slot")).toBe(false);
  });
  it("reports zero-row and uncertain write outcomes without successful refresh", async () => {
    writeMode = "zero";
    const result = await setAppointmentStatus("appt", "completed");
    expect(result.success).toBeUndefined(); expect(result.error).toMatch(/Reload/);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("reports committed status separately from follow-up failure", async () => {
    mocks.emit.mockRejectedValueOnce(new Error("private failure"));
    const result = await setAppointmentStatus("appt", "completed");
    expect(result).toEqual({ appointmentId: "appt", error: expect.stringContaining("status saved") });
    expect(row.status).toBe("completed");
    await setAppointmentStatus("appt", "completed"); expect(mocks.emit).toHaveBeenCalledOnce();
  });
  it("reports refresh failure without implying rollback or replaying completion", async () => {
    mocks.refresh.mockImplementationOnce(() => { throw new Error("private refresh error"); });
    const result = await setAppointmentStatus("appt", "completed");
    expect(result.error).toMatch(/status saved.*screen could not refresh/);
    expect(result.error).not.toMatch(/private/); expect(row.status).toBe("completed");
    await setAppointmentStatus("appt", "completed"); expect(mocks.emit).toHaveBeenCalledOnce();
  });
});
