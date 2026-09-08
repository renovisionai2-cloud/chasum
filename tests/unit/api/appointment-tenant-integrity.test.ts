// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { http, HttpResponse } from "msw";
import { server } from "../../msw/server";

vi.mock("server-only", () => ({}));
const event = vi.hoisted(() => vi.fn());
vi.mock("@/lib/integrations/notifications/orchestrator", () => ({ handleAppointmentEvent: event }));
vi.mock("@/lib/observability/logger", () => ({ captureBookingFailure: vi.fn() }));
vi.mock("@/lib/api/guard", () => ({
  requireApiAuth: async () => ({ businessId: A, scopes: ["write"], keyId: "test-key" }),
  isApiAuth: () => true,
}));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => client }));
import { POST, GET as LIST } from "@/app/api/v1/appointments/route";
import { PATCH, GET } from "@/app/api/v1/appointments/[id]/route";
import { createAppointmentBodySchema, patchAppointmentBodySchema } from "@/lib/validation/schemas";

const url = "https://appointment-api.test";
const client = createClient(url, "unit-test-only", { auth: { persistSession: false, autoRefreshToken: false } });
const uuid = (n: number) => `aaaaaaaa-aaaa-4aaa-8aaa-${n.toString().padStart(12, "0")}`;
const A = uuid(1), B = uuid(2), L = uuid(3), C = uuid(4), S = uuid(5), T = uuid(6), AP = uuid(7);
const requestBody = { location_id: L, customer_id: C, service_id: S, staff_id: T,
  start_time: "2026-09-20T14:00:00.000Z", end_time: "2026-09-20T14:30:00.000Z" };
type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let writes: Row[];
let rpcCalls: Row[];
let reads: URL[];
let referenceFailure: string | undefined;
let slotError: string | undefined;
let insertError: boolean;
let race: boolean;

function matches(row: Row, params: URLSearchParams) {
  return [...params].every(([key, value]) => {
    if (["select", "limit", "order"].includes(key) || key.includes(".")) return true;
    if (value.startsWith("eq.")) return String(row[key]).toLowerCase() === value.slice(3).toLowerCase();
    return true;
  });
}
function embed(row: Row, params: URLSearchParams) {
  const result = { ...row };
  for (const [alias, table] of [["customer", "customers"], ["service", "services"], ["staff", "staff"]]) {
    if (!params.get("select")?.includes(`${alias}:`)) continue;
    const related = tables[table].find((r) => r.id === row[`${alias}_id`]);
    const scope = params.get(`${alias}.business_id`);
    result[alias] = related && (!scope || scope === `eq.${related.business_id}`)
      ? { id: related.id, name: related.name, ...(alias === "customer" ? { email: related.email } : {}) } : null;
  }
  return result;
}
function req(body: unknown, method = "POST") {
  return new NextRequest("https://local.test/api/v1/appointments", { method, body: JSON.stringify(body) });
}
function patch(body: unknown, id = AP) { return PATCH(req(body, "PATCH"), { params: Promise.resolve({ id }) }); }
function get(id = AP) { return GET(new NextRequest("https://local.test/api/v1/appointments"), { params: Promise.resolve({ id }) }); }
function noSideEffects() { expect(writes).toEqual([]); expect(event).not.toHaveBeenCalled(); }
function foreign(table: string) { return tables[table].find((r) => r.business_id === B)!.id; }

beforeEach(() => {
  writes = []; rpcCalls = []; reads = [];
  referenceFailure = undefined; slotError = undefined; insertError = false; race = false;
  event.mockReset();
  tables = {
    locations: [{ id: L, business_id: A, is_active: true }],
    customers: [{ id: C, business_id: A, name: "Own Customer", email: "own@example.invalid" }, { id: uuid(8), business_id: A, name: "Replacement" }],
    services: [{ id: S, business_id: A, is_active: true }],
    staff: [{ id: T, business_id: A, is_active: true }],
    appointments: [{ id: AP, business_id: A, ...requestBody, status: "pending", updated_at: "2026-09-08T00:00:00.123456+00:00" }],
  };
  ["locations", "customers", "services", "staff"].forEach((table, i) => tables[table].push({
    id: uuid(20 + i), business_id: B, is_active: true, name: "FOREIGN PII", email: "foreign@example.invalid",
  }));
  server.use(http.all(`${url}/rest/v1/*`, async ({ request }) => {
    const u = new URL(request.url);
    const table = u.pathname.split("/").at(-1)!;
    if (table === "validate_appointment_slot") {
      rpcCalls.push(await request.json() as Row);
      return slotError ? HttpResponse.json({ message: slotError }, { status: 400 }) : HttpResponse.json(null);
    }
    if (request.method === "GET") {
      reads.push(u);
      if (table === referenceFailure) return HttpResponse.json({ message: "private database details" }, { status: 500 });
      const rows = tables[table].filter((r) => matches(r, u.searchParams)).slice(0, Number(u.searchParams.get("limit") ?? 1000)).map((r) => embed(r, u.searchParams));
      return HttpResponse.json(request.headers.get("accept")?.includes("vnd.pgrst.object") ? rows[0] ?? null : rows);
    }
    if (request.method === "POST") {
      if (insertError) return HttpResponse.json({ message: "insert failed" }, { status: 400 });
      const row = { id: uuid(50), ...await request.json() as Row };
      tables[table].push(row); writes.push(row);
      return HttpResponse.json(row, { status: 201 });
    }
    if (request.method === "PATCH") {
      const body = await request.json() as Row;
      const rows = race ? [] : tables[table].filter((r) => matches(r, u.searchParams));
      rows.forEach((r) => { Object.assign(r, body); writes.push({ ...r }); });
      return HttpResponse.json(rows);
    }
    throw new Error(`Unexpected test request ${request.method} ${u.pathname}`);
  }));
});

describe("POST tenant integrity", () => {
  it("persists explicit references and validates the same location before the event", async () => {
    event.mockImplementation(() => { expect(writes).toHaveLength(1); });
    const response = await POST(req({ ...requestBody, business_id: B, internal: "stripped" }));
    expect(response.status).toBe(201);
    expect((await response.json()).data).toMatchObject({ ...requestBody, business_id: A });
    expect(writes[0]).not.toHaveProperty("internal");
    expect(rpcCalls[0]).toMatchObject({ p_business_id: A, p_location_id: L, p_service_id: S, p_staff_id: T });
    expect(event).toHaveBeenCalledExactlyOnceWith(uuid(50), "created");
    expect(reads.filter((u) => !u.pathname.endsWith("appointments")).every((u) => u.searchParams.get("business_id") === `eq.${A}`)).toBe(true);
  });
  it.each([["customer_id", "customers"], ["location_id", "locations"], ["service_id", "services"], ["staff_id", "staff"]])("rejects foreign and unknown %s identically", async (field, table) => {
    const response = await POST(req({ ...requestBody, [field]: foreign(table) }));
    const absent = await POST(req({ ...requestBody, [field]: uuid(999) }));
    expect(response.status).toBe(400); expect(absent.status).toBe(400);
    expect(await response.json()).toEqual(await absent.json());
    expect(rpcCalls).toEqual([]); noSideEffects();
  });
  it.each(["location_id", "customer_id", "service_id", "staff_id"])("rejects malformed %s before database access", async (field) => {
    expect((await POST(req({ ...requestBody, [field]: "not-a-uuid" }))).status).toBe(400);
    expect(reads).toEqual([]); noSideEffects();
  });
  it("resolves only the sole active business location when omitted", async () => {
    tables.locations.push({ id: uuid(60), business_id: A, is_active: false, is_default: true });
    const response = await POST(req({ ...requestBody, location_id: undefined }));
    expect(response.status).toBe(201); expect(writes[0].location_id).toBe(L);
    expect(rpcCalls[0].p_location_id).toBe(L);
  });
  it("never guesses among multiple active locations, even with a default", async () => {
    tables.locations.push({ id: uuid(60), business_id: A, is_active: true, is_default: true });
    const response = await POST(req({ ...requestBody, location_id: undefined }));
    expect(response.status).toBe(400); expect((await response.json()).error).toContain("multiple active locations"); noSideEffects();
  });
  it("rejects zero active locations", async () => {
    tables.locations[0].is_active = false;
    expect((await POST(req({ ...requestBody, location_id: undefined }))).status).toBe(400); noSideEffects();
  });
  it.each(["locations", "services", "staff"])("rejects inactive %s", async (table) => {
    tables[table][0].is_active = false;
    expect((await POST(req(requestBody))).status).toBe(400); noSideEffects();
  });
  it("fails closed on lookup errors without disclosing database details", async () => {
    referenceFailure = "customers";
    const response = await POST(req(requestBody));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("private database"); noSideEffects();
  });
  it("does not write or emit when the scheduling RPC rejects the combination", async () => {
    slotError = "Time slot not available";
    expect((await POST(req(requestBody))).status).toBe(400); noSideEffects();
  });
  it("does not emit on insert failure", async () => {
    insertError = true;
    expect((await POST(req(requestBody))).status).toBe(400); noSideEffects();
  });
});

describe("PATCH tenant integrity", () => {
  it("allows same-business customer reassignment", async () => {
    expect((await patch({ customer_id: uuid(8) })).status).toBe(200);
    expect(tables.appointments[0].customer_id).toBe(uuid(8));
    expect(rpcCalls).toEqual([]); expect(event).toHaveBeenCalledExactlyOnceWith(AP, "updated");
  });
  it.each([["customer_id", "customers"], ["location_id", "locations"], ["service_id", "services"], ["staff_id", "staff"]])("rejects foreign %s and preserves the original without events", async (field, table) => {
    const before = structuredClone(tables.appointments);
    const response = await patch({ [field]: foreign(table) });
    const absent = await patch({ [field]: uuid(999) });
    expect(response.status).toBe(400); expect(await response.json()).toEqual(await absent.json());
    expect(tables.appointments).toEqual(before); noSideEffects();
  });
  it.each(["location_id", "customer_id", "service_id", "staff_id"])("rejects malformed PATCH %s", async (field) => {
    expect((await patch({ [field]: "not-a-uuid" })).status).toBe(400); noSideEffects();
  });
  it("revalidates effective schedule/location and excludes the appointment", async () => {
    const start = "2026-09-21T14:00:00Z";
    expect((await patch({ start_time: start })).status).toBe(200);
    expect(rpcCalls[0]).toMatchObject({ p_start_time: start, p_end_time: requestBody.end_time, p_location_id: L, p_exclude_appointment_id: AP });
  });
  it("does not update or emit on invalid scheduling change", async () => {
    slotError = "Time slot not available";
    const before = structuredClone(tables.appointments);
    expect((await patch({ staff_id: T, start_time: "2026-09-21T14:00:00Z" })).status).toBe(400);
    expect(tables.appointments).toEqual(before); noSideEffects();
  });
  it("revalidates reactivation of a cancelled appointment", async () => {
    tables.appointments[0].status = "cancelled";
    expect((await patch({ status: "confirmed" })).status).toBe(200); expect(rpcCalls).toHaveLength(1);
  });
  it("keeps historical notes and cancellation available with retained inactive references", async () => {
    tables.locations[0].is_active = false; tables.services[0].is_active = false; tables.staff[0].is_active = false;
    tables.appointments[0].start_time = "2025-01-01T14:00:00Z";
    expect((await patch({ notes: "history", status: "cancelled" })).status).toBe(200);
    expect(rpcCalls).toEqual([]); expect(event).toHaveBeenCalledExactlyOnceWith(AP, "cancelled");
  });
  it("recognizes equivalent UUID representations as unchanged", async () => {
    tables.services[0].is_active = false;
    expect((await patch({ service_id: S.toUpperCase(), notes: "same schedule" })).status).toBe(200);
    expect(rpcCalls).toEqual([]);
  });
  it.each([
    "Sep 20 2026 17:00:00 GMT+3",
    "2026-09-20T14:00:00.000100Z",
    "2026-09-20T10:00:00-04:00",
  ])("validates changed timestamp representations without lossy JavaScript comparison: %s", async (start) => {
    expect(Date.parse(start)).toBe(Date.parse(requestBody.start_time));
    slotError = "Time slot not available";
    const before = structuredClone(tables.appointments);
    expect((await patch({ start_time: start })).status).toBe(400);
    expect(rpcCalls[0]).toMatchObject({ p_start_time: start, p_location_id: L, p_exclude_appointment_id: AP });
    expect(tables.appointments).toEqual(before); noSideEffects();
  });
  it("rejects a retained foreign customer before notification dereference", async () => {
    tables.appointments[0].customer_id = foreign("customers");
    expect((await patch({ notes: "unsafe history" })).status).toBe(400); noSideEffects();
  });
  it("rejects a foreign appointment without reading its references", async () => {
    tables.appointments[0].business_id = B;
    expect((await patch({ customer_id: C })).status).toBe(404);
    expect(reads).toHaveLength(1); noSideEffects();
  });
  it("rejects an optimistic update race without an event", async () => {
    race = true;
    expect((await patch({ notes: "racing edit" })).status).toBe(409); noSideEffects();
  });
  it("rejects mass assignment and empty bodies", async () => {
    expect((await patch({ business_id: B })).status).toBe(400);
    expect((await patch({})).status).toBe(400); noSideEffects();
  });
});

describe("embedded reads and schema contracts", () => {
  it("retains location_id in both schemas and strips POST unknown keys", () => {
    const parsed = createAppointmentBodySchema.parse({ ...requestBody, business_id: B, arbitrary: true });
    expect(parsed.location_id).toBe(L); expect(parsed).not.toHaveProperty("business_id"); expect(parsed).not.toHaveProperty("arbitrary");
    expect(patchAppointmentBodySchema.parse({ location_id: L })).toEqual({ location_id: L });
  });
  it("keeps the own-customer read shape", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect((await response.json()).data.customer).toEqual({ id: C, name: "Own Customer", email: "own@example.invalid" });
  });
  it.each(["customer", "service", "staff"])("does not return foreign %s data from historical invalid references", async (alias) => {
    tables.appointments[0][`${alias}_id`] = foreign(alias === "customer" ? "customers" : alias === "service" ? "services" : "staff");
    const detail = await get();
    expect((await detail.json()).data[alias]).toBeNull();
    const list = await LIST(new NextRequest("https://local.test/api/v1/appointments"));
    expect((await list.json()).data[0][alias]).toBeNull();
    expect(reads.every((u) => u.searchParams.get(`${alias}.business_id`) === `eq.${A}`)).toBe(true);
  });
  it("does not expose foreign parent appointments", async () => {
    tables.appointments[0].business_id = B;
    expect((await get()).status).toBe(404);
    expect((await (await LIST(new NextRequest("https://local.test/api/v1/appointments"))).json()).data).toEqual([]);
  });
});
