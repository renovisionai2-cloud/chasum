// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { http, HttpResponse } from "msw";
import { server } from "../../msw/server";

vi.mock("server-only", () => ({}));
const effects = vi.hoisted(() => ({
  email: vi.fn(), sms: vi.fn(), webhook: vi.fn(), reminder: vi.fn(), calendarJob: vi.fn(),
  calendarPush: vi.fn(), calendarDelete: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
}));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => client }));
vi.mock("@/lib/env", () => ({ getResendApiKey: () => "local-stub", getTwilioConfig: () => ({ accountSid: "local-stub" }) }));
vi.mock("@/lib/integrations/jobs/queue", () => ({
  enqueueEmailJob: effects.email, enqueueSmsJob: effects.sms, enqueueWebhookJob: effects.webhook,
  enqueueReminderJobs: effects.reminder, enqueueCalendarSyncJob: effects.calendarJob,
}));
vi.mock("@/lib/integrations/calendar/sync", () => ({
  pushAppointmentToCalendars: effects.calendarPush, deleteAppointmentFromCalendars: effects.calendarDelete,
}));
vi.mock("@/lib/observability/logger", () => ({ logger: { info: effects.info, warn: effects.warn, error: effects.error } }));
import { handleAppointmentEvent } from "@/lib/integrations/notifications/orchestrator";

const url = "https://notification-integrity.test";
const client = createClient(url, "local-synthetic-only", { auth: { persistSession: false, autoRefreshToken: false } });
const uuid = (n: number) => `bbbbbbbb-bbbb-4bbb-8bbb-${n.toString().padStart(12, "0")}`;
const A = uuid(1), B = uuid(2), AP = uuid(3), C = uuid(4), S = uuid(5), T = uuid(6), L = uuid(7);
type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let mutations: Row[];
let reads: URL[];
let lookupError: string | undefined;
let afterLookup: ((table: string) => Promise<void> | void) | undefined;
const run = (event: "created" | "cancelled" | "updated" = "cancelled", businessId = A) => handleAppointmentEvent(AP, event, { businessId });
function noEffects() {
  expect(mutations).toEqual([]);
  for (const name of ["email", "sms", "webhook", "reminder", "calendarJob", "calendarPush", "calendarDelete"] as const) expect(effects[name]).not.toHaveBeenCalled();
}
function foreign(table: string) { return tables[table].find(r => r.business_id === B)!.id; }
const related = [["customer_id", "customers"], ["staff_id", "staff"], ["service_id", "services"], ["location_id", "locations"]];

beforeEach(() => {
  vi.resetAllMocks(); mutations = []; reads = []; lookupError = undefined; afterLookup = undefined;
  tables = {
    appointments: [{ id: AP, business_id: A, location_id: L, customer_id: C, staff_id: T, service_id: S,
      status: "confirmed", start_time: "2026-09-20T14:00:00Z", end_time: "2026-09-20T14:30:00Z" }],
    customers: [{ id: C, business_id: A, name: "Own Customer", email: "own-customer@example.invalid", phone: "+15555550100" }],
    services: [{ id: S, business_id: A, name: "Own Service", is_active: true }],
    staff: [{ id: T, business_id: A, name: "Own Staff", email: "own-staff@example.invalid", is_active: true }],
    locations: [{ id: L, business_id: A, name: "Own Location", is_active: true }],
    businesses: [{ id: A, name: "Own Business", email: "own-business@example.invalid", email_notifications_enabled: true,
      sms_notifications_enabled: true, owner_notifications_enabled: true, staff_notifications_enabled: true,
      reminder_hours_before: 720, private_alpha_enabled: true }],
    calendar_connections: [],
  };
  ["customers", "services", "staff", "locations"].forEach((table, i) => tables[table].push({
    id: uuid(20 + i), business_id: B, name: "FOREIGN_PRIVATE_NAME", email: "foreign-private@example.invalid", phone: "+15555559999", is_active: true,
  }));
  server.use(http.all(`${url}/rest/v1/*`, async ({ request }) => {
    const u = new URL(request.url), table = u.pathname.split("/").at(-1)!;
    if (request.method !== "GET") {
      mutations.push(await request.json() as Row); return HttpResponse.json(null);
    }
    reads.push(u);
    if (table === lookupError) return HttpResponse.json({ message: "FOREIGN_PRIVATE_NAME foreign-private@example.invalid" }, { status: 500 });
    const rows = tables[table].filter(r => [...u.searchParams].every(([key, value]) => !value.startsWith("eq.") || String(r[key]) === value.slice(3)));
    // Snapshot the query result before any simulated concurrent state change.
    const snapshot = structuredClone(rows);
    await afterLookup?.(table);
    return HttpResponse.json(request.headers.get("accept")?.includes("vnd.pgrst.object") ? snapshot[0] ?? null : snapshot);
  }));
});

describe("appointment event tenant integrity", () => {
  it.each(related)("blocks foreign and missing %s before any notification/enqueue/provider side effect", async (field, table) => {
    tables.appointments[0][field] = foreign(table);
    await expect(run()).rejects.toThrow("Appointment requires data reconciliation"); noEffects();
    tables.appointments[0][field] = uuid(999);
    await expect(run()).rejects.toThrow("Appointment requires data reconciliation"); noEffects();
    expect(effects.warn).toHaveBeenCalledWith("notifications", "appointment_reconciliation_required", { appointmentId: AP, businessId: A });
    expect(JSON.stringify([effects.info.mock.calls, effects.warn.mock.calls, effects.error.mock.calls])).not.toMatch(/FOREIGN_PRIVATE_NAME|foreign-private@example.invalid|15555559999/);
  });
  it("blocks mixed historical mismatches before all partial side effects", async () => {
    for (const [field, table] of related) tables.appointments[0][field] = foreign(table);
    await expect(run("created")).rejects.toThrow("Appointment requires data reconciliation"); noEffects();
  });
  it.each(["appointments", "customers", "staff", "services", "locations"])("sanitizes %s lookup failures and produces no effects", async table => {
    lookupError = table;
    await expect(run()).rejects.toThrow("Unable to load appointment notification context"); noEffects();
    expect(JSON.stringify([effects.info.mock.calls, effects.warn.mock.calls, effects.error.mock.calls])).not.toContain("FOREIGN_PRIVATE_NAME");
  });
  it.each(["location_id", "customer_id", "service_id"])("rejects null required %s without resolving a substitute", async field => {
    tables.appointments[0][field] = null;
    await expect(run()).rejects.toThrow("Appointment requires data reconciliation"); noEffects();
  });
  it("rejects an absent staff field instead of treating it as intentionally unassigned", async () => {
    delete tables.appointments[0].staff_id;
    await expect(run()).rejects.toThrow("Appointment requires data reconciliation"); noEffects();
  });
  it("cannot invoke events for another business's otherwise-valid appointment", async () => {
    await run("cancelled", B); noEffects();
    expect(reads).toHaveLength(1);
  });
  it("keeps missing appointments a no-op", async () => {
    tables.appointments = [];
    await run(); noEffects();
  });
  it("preserves valid cancellation recipients and business identity across all immediate sinks", async () => {
    await run();
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatchObject({ business_id: A, body: "Own Customer — Own Service with Own Staff" });
    expect(effects.email.mock.calls.map(c => c[1].recipient)).toEqual(["own-customer@example.invalid", "own-staff@example.invalid", "own-business@example.invalid"]);
    expect(effects.sms).toHaveBeenCalledWith(A, expect.objectContaining({ recipient: "+15555550100" }));
    expect(effects.webhook).toHaveBeenCalledWith(A, "appointment.cancelled", expect.objectContaining({ appointmentId: AP }));
    expect(effects.calendarDelete).toHaveBeenCalledExactlyOnceWith(AP, A);
    expect(effects.calendarPush).not.toHaveBeenCalled();
    expect(reads.filter(u => ["customers", "services", "staff", "locations"].some(t => u.pathname.endsWith(`/${t}`))).every(u => u.searchParams.get("business_id") === `eq.${A}`)).toBe(true);
  });
  it("preserves inactive same-business historical names and recipients", async () => {
    for (const table of ["services", "staff", "locations"]) tables[table][0].is_active = false;
    await run(); expect(effects.email).toHaveBeenCalledTimes(3);
  });
  it("preserves explicit unassigned staff in the shared loader without inventing staff identity", async () => {
    tables.appointments[0].staff_id = null;
    await run("created");
    expect(effects.email.mock.calls.map(c => c[1].recipient)).toEqual(["own-customer@example.invalid", "own-business@example.invalid"]);
    expect(mutations[0].body).toBe("Own Customer — Own Service with To be assigned");
    expect(reads.some(u => u.pathname.endsWith("/staff"))).toBe(false);
    expect(effects.calendarPush).toHaveBeenCalledWith(expect.objectContaining({ staff: null }), "Own Business");
  });
  it("passes the validated snapshot to calendars even if the appointment reference later changes", async () => {
    effects.email.mockImplementationOnce(async () => { tables.appointments[0].customer_id = foreign("customers"); });
    await run("created");
    const context = effects.calendarPush.mock.calls[0][0];
    expect(context.customer.email).toBe("own-customer@example.invalid");
    expect(context.appointment.customer_id).toBe(C);
    expect(reads.filter(u => u.pathname.endsWith("/appointments"))).toHaveLength(1);
  });
  it("waits for every reference check before the first notification", async () => {
    let checked = 0;
    afterLookup = async table => {
      if (["customers", "services", "staff", "locations"].includes(table)) { noEffects(); checked++; }
    };
    effects.email.mockImplementation(() => { expect(checked).toBe(4); });
    await run(); expect(checked).toBe(4);
  });
});
