// @vitest-environment node
import { createClient as makeClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UpdateBookingIntent } from "@/lib/booking-engine/types";

const mocks = vi.hoisted(() => ({ client: vi.fn(), emit: vi.fn(), audit: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@/lib/booking-engine/events", async (original) => ({ ...await original<object>(), emitBookingEvent: mocks.emit }));
vi.mock("@/lib/booking-engine/conflicts", async (original) => ({ ...await original<object>(), logAppointmentChange: mocks.audit }));
import { updateBooking } from "@/lib/booking-engine/mutations/update";
import { createBooking } from "@/lib/booking-engine/mutations/create";
import { rescheduleBooking } from "@/lib/booking-engine/mutations/reschedule";
import { resizeBooking } from "@/lib/booking-engine/mutations/resize";
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
function intent(changes: Partial<UpdateBookingIntent> = {}): UpdateBookingIntent {
  return {
    operation: "status-only", channel: "staff", businessId: "biz", appointmentId: "appt",
    customerId: row.customer_id as string, serviceId: row.service_id as string, staffId: row.staff_id as string,
    locationId: row.location_id as string, requestedStart: row.start_time as string,
    requestedEnd: row.end_time as string, notes: row.notes as string, requestedStatus: "completed", ...changes,
  };
}
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
    appointments: [row], businesses: [business],
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
  const client = makeClient("https://n06.invalid", "synthetic-offline-key", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: offlineFetch } });
  mocks.client.mockResolvedValue(client); clearAvailabilityCache();
});
afterEach(() => { vi.useRealTimers(); });

describe("N06 real engine status-only operation", () => {
  it.each(["confirmed", "arrived", "waiting", "in_progress"])("A/B/K completes historical %s without checking changed catalog/hours", async (status) => {
    row.status = status; catalogActive = false; minNotice = 999999;
    const before = structuredClone(row);
    expect((await updateBooking(intent())).phase).toBe("success");
    expect(row).toEqual({ ...before, status: "completed" });
    expect(patches).toEqual([{ status: "completed" }]);
    expect(requests.every((r) => ["appointments", "businesses"].includes(r.path))).toBe(true);
    expect(mocks.emit).toHaveBeenCalledOnce(); expect(mocks.audit).toHaveBeenCalledOnce();
  });
  it.each([
    ["before start", "2026-10-25T16:00:00.001Z", false],
    ["exact start", NOW, true],
    ["during service", "2026-10-25T15:59:59.999Z", true],
    ["at end", "2026-10-25T15:00:00.000Z", true],
  ])("E Policy B: %s", async (_label, start, allowed) => {
    row.start_time = start; row.end_time = _label === "at end" ? NOW : "2026-10-25T17:00:00.000Z";
    const result = await updateBooking(intent());
    expect(result.phase === "success").toBe(allowed);
    expect(patches).toHaveLength(allowed ? 1 : 0);
    if (!allowed) expect(result.error).toMatch(/before their scheduled start/);
  });
  it("C repeated completion is a no-op without another event/audit/write", async () => {
    await updateBooking(intent());
    const result = await updateBooking(intent());
    expect(result).toMatchObject({ phase: "success", events: [] });
    expect(patches).toHaveLength(1); expect(mocks.emit).toHaveBeenCalledOnce(); expect(mocks.audit).toHaveBeenCalledOnce();
  });
  it("D rejects cancelled and unknown/durable-linked state, including repeat completed", async () => {
    for (const state of [{ status: "cancelled" }, { status: "confirmed", booking_operation_id: "operation" }, { status: "completed", booking_operation_id: "operation" }]) {
      row = { ...appointment(), ...state };
      expect((await updateBooking(intent())).phase).toBe("rollback");
    }
    expect(patches).toEqual([]); expect(mocks.emit).not.toHaveBeenCalled();
  });
  it.each(["cancelled", "no_show", "rescheduled", "notes", "customer", "payment", "linked"])("D/K conditional update rejects concurrent %s", async (change) => {
    beforeWrite = () => {
      if (change === "rescheduled") row.start_time = "2026-10-26T14:00:00Z";
      else if (change === "notes") row.notes = "Concurrent note";
      else if (change === "customer") row.customer_id = "other";
      else if (change === "linked") row.booking_operation_id = "operation";
      else if (change === "payment") { row.amount_paid_cents = 10000; row.updated_at = NOW; }
      else row.status = change;
    };
    expect((await updateBooking(intent())).phase).toBe("conflict");
    expect(row.status).not.toBe("completed"); expect(mocks.emit).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("concurrent completion has one winner; the zero-row loser must refresh", async () => {
    const results = await Promise.all([updateBooking(intent()), updateBooking(intent())]);
    expect(results.map((r) => r.phase).sort()).toEqual(["conflict", "success"]);
    expect(mocks.emit).toHaveBeenCalledOnce(); expect(mocks.audit).toHaveBeenCalledOnce();
  });
  it.each(["zero", "denied", "lost"] as const)("zero/error/unknown response (%s) never reports success or dispatches", async (mode) => {
    writeMode = mode; const result = await updateBooking(intent());
    expect(result.phase).not.toBe("success"); expect(result.error).not.toMatch(/private database/);
    expect(mocks.emit).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
    if (mode === "lost") { expect(row.status).toBe("completed"); expect((await updateBooking(intent())).events).toEqual([]); }
  });
  it.each(["emit", "audit"] as const)("post-write %s rejection acknowledges the saved status", async (step) => {
    mocks[step].mockRejectedValueOnce(new Error("private failure"));
    const result = await updateBooking(intent());
    expect(result).toMatchObject({ phase: "success", warning: expect.stringContaining("status saved") });
    expect(row.status).toBe("completed"); expect(mocks.audit).toHaveBeenCalledOnce();
    expect((await updateBooking(intent())).events).toEqual([]); expect(mocks.emit).toHaveBeenCalledOnce();
  });
  it("J scopes reads/writes by Business and denies foreign/missing rows", async () => {
    const result = await updateBooking(intent({ businessId: "foreign" }));
    expect(result.error).toBe("Appointment not found."); expect(patches).toEqual([]);
    expect(requests[0].url.searchParams.get("business_id")).toBe("eq.foreign");
  });
  it.each([
    { requestedStart: "2026-10-24T14:01:00Z" }, { requestedEnd: "2026-10-24T15:16:00Z" },
    { staffId: "other" }, { locationId: "other" }, { serviceId: "other" }, { customerId: "other" },
    { roomId: "other" }, { resourceIds: ["resource"] }, { durationMinutes: 30 }, { notes: "edited" },
    { priceCents: 1 }, { depositCents: 1 }, { taxCents: 1 }, { packageId: "package" },
    { customerId: null }, { requestedStart: "invalid", durationMinutes: 75 }, { requestedEnd: "" },
    { durationMinutes: 0 }, { durationMinutes: -1 }, { durationMinutes: NaN },
    { requestedEnd: undefined, durationMinutes: Number.MAX_VALUE },
    { durableOperation: {} }, { channel: "api" }, { operation: "bogus" },
  ])("L refuses extraneous/changed input %j without partial effects", async (change) => {
    const before = structuredClone(row);
    expect((await updateBooking(intent(change as Partial<UpdateBookingIntent>))).phase).toBe("rollback");
    expect(row).toEqual(before); expect(patches).toEqual([]); expect(mocks.emit).not.toHaveBeenCalled();
  });
  it("preserves historical duration override, room and equivalent timestamp representations", async () => {
    const before = structuredClone(row);
    expect((await updateBooking(intent({ durationMinutes: 75, roomId: "room", requestedStart: "2026-10-24T10:00:00-04:00", requestedEnd: "2026-10-24T11:15:00-04:00" }))).phase).toBe("success");
    expect(row).toEqual({ ...before, status: "completed" });
  });
  it("keeps pre-#158 ordinary schema compatible without querying a nonexistent link column", async () => {
    delete row.booking_operation_id;
    expect((await updateBooking(intent())).phase).toBe("success");
    expect(requests.find((r) => r.method === "PATCH")!.url.searchParams.has("booking_operation_id")).toBe(false);
  });
  it("enforces the configured forward workflow, with no implicit completed/no-show correction", async () => {
    workflow = ["confirmed", "arrived"];
    expect((await updateBooking(intent())).phase).toBe("rollback");
    workflow = null; row.status = "no_show";
    expect((await updateBooking(intent())).phase).toBe("rollback");
    expect((await updateBooking(intent({ requestedStatus: "forged" as never }))).phase).toBe("rollback");
    expect(patches).toEqual([]);
  });
  it.each(["update", "create", "reschedule", "resize"])("negative control: %s still reaches the real validator and RPC", async (operation) => {
    const ordinary = intent(); delete ordinary.operation;
    const result = operation === "update" ? await updateBooking(ordinary)
      : operation === "create" ? await createBooking(ordinary)
      : operation === "reschedule" ? await rescheduleBooking({ channel: "staff", businessId: "biz", appointmentId: "appt", requestedStart: row.start_time as string })
      : await resizeBooking({ channel: "staff", businessId: "biz", appointmentId: "appt", requestedEnd: row.end_time as string });
    expect(result.error).toBe("Appointment must be in the future");
    expect(requests.some((r) => r.path === "validate_appointment_slot")).toBe(true);
    expect(patches).toEqual([]);
  });
  it("negative control: mixed form edits still enforce minimum notice and future availability", async () => {
    const ordinary = intent({ requestedStart: "2026-10-25T16:10:00Z", requestedEnd: "2026-10-25T17:00:00Z" }); delete ordinary.operation;
    minNotice = 60;
    expect((await updateBooking(ordinary)).error).toMatch(/60 minutes notice/);
    minNotice = 0; clearAvailabilityCache();
    expect((await updateBooking(ordinary)).error).toMatch(/time slot is not available/i);
    expect(patches).toEqual([]);
  });
});
