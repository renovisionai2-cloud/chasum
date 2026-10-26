// @vitest-environment node
import { createClient as makeClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), service: vi.fn(), email: vi.fn(), sms: vi.fn(), reminder: vi.fn(), webhook: vi.fn(), calendar: vi.fn(), push: vi.fn(), remove: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.session }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: mocks.service }));
vi.mock("@/lib/integrations/jobs/queue", () => ({ enqueueEmailJob: mocks.email, enqueueSmsJob: mocks.sms, enqueueReminderJobs: mocks.reminder, enqueueWebhookJob: mocks.webhook, enqueueCalendarSyncJob: mocks.calendar }));
vi.mock("@/lib/integrations/calendar/sync", () => ({ pushAppointmentToCalendars: mocks.push, deleteAppointmentFromCalendars: mocks.remove }));
vi.mock("@/lib/env", () => ({ getResendApiKey: () => "offline-only", getTwilioConfig: () => ({ accountSid: "offline-only" }) }));
import { updateBooking } from "@/lib/booking-engine/mutations/update";
import { onBookingEvent } from "@/lib/booking-engine/events";
import { readFinancialAggregate, type FinancialReaderDependencies } from "@/lib/commerce/financial-aggregate/reader";
import { singleFinancialAmount } from "@/lib/commerce/financial-aggregate/types";
import { appointmentRecognizedCents } from "@/lib/commerce/recognize";
import type { BookingDomainEvent } from "@/lib/booking-engine/types";

const uid = (n: number) => `a1332000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const businessId = uid(1), customerId = uid(2), appointmentId = uid(3), locationId = uid(4), staffId = uid(5), serviceId = uid(6);
const NOW = "2026-10-25T16:00:00.000Z";
function fixture() {
  return { id: appointmentId, business_id: businessId, customer_id: customerId, service_id: serviceId, staff_id: staffId,
    location_id: locationId, room_id: uid(7), notes: "Keep historical notes", status: "confirmed",
    start_time: "2026-10-24T14:00:00+00:00", end_time: "2026-10-24T15:15:00+00:00", updated_at: "2026-10-24T13:00:00Z",
    booking_operation_id: null, price_cents: 10000, tax_cents: 1300, deposit_cents: 5000,
    amount_paid_cents: 5000, amount_refunded_cents: 0, payment_status: "partial", invoice_number: "INV-EXISTING" };
}
let row: ReturnType<typeof fixture>;
let logs: Record<string, unknown>[], notifications: Record<string, unknown>[], events: BookingDomainEvent[];
let accesses: Array<{ table: string; method: string; role: string; body: unknown }>;
let unexpected: string[];
let unsubscribe: () => void;
// Real Supabase serialization, event dispatcher, communications bridge, notification
// orchestrator/context, audit helper and reporting functions; no network/providers.
async function offlineFetch(role: string, input: RequestInfo | URL, init?: RequestInit) {
  const url = new URL(String(input)), table = url.pathname.split("/").pop()!, method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : null;
  accesses.push({ table, method, role, body });
  const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  if (method === "POST" && table === "notifications" && role === "communications") { notifications.push(body); return json(null); }
  if (method === "POST" && table === "appointment_change_log" && role === "session") { logs.push(body); return json(null); }
  if (method === "PATCH" && table === "appointments" && role === "session") {
    expect(body).toEqual({ status: "completed" }); Object.assign(row, body); return json({ id: row.id, status: row.status });
  }
  const tables: Record<string, Record<string, unknown>[]> = {
    appointments: [row],
    businesses: [{ id: businessId, name: "Synthetic Business", appointment_status_workflow: null,
      email: "owner@invalid.test", email_notifications_enabled: true, sms_notifications_enabled: true,
      staff_notifications_enabled: true, owner_notifications_enabled: true, subscription_plan_key: "scale", private_alpha_enabled: true }],
    customers: [{ id: customerId, business_id: businessId, name: "Synthetic customer", email: "customer@invalid.test", phone: "+10000000000" }],
    services: [{ id: serviceId, business_id: businessId, name: "Historical service", price: 100 }],
    staff: [{ id: staffId, business_id: businessId, name: "Synthetic staff", email: "staff@invalid.test" }],
    locations: [{ id: locationId, business_id: businessId, name: "Synthetic location" }],
    calendar_connections: [{ id: uid(8), business_id: businessId, sync_enabled: true }],
  };
  if (method !== "GET" || !(table in tables)) { unexpected.push(`${role}:${method}:${table}`); throw new Error("Unexpected I/O"); }
  const selected = tables[table].filter((record) => [...url.searchParams].every(([key, value]) => key === "select" || (value.startsWith("eq.") && String(record[key]) === value.slice(3))));
  return json(new Headers(init?.headers).get("Accept")?.includes("vnd.pgrst.object") ? selected[0] ?? null : selected);
}
function complete() {
  return updateBooking({ operation: "status-only", channel: "staff", businessId, appointmentId,
    customerId, serviceId, staffId, locationId, requestedStart: row.start_time, requestedEnd: row.end_time, notes: row.notes, requestedStatus: "completed" });
}
function ledger(kind = "deposit", amount = 5000) {
  return { id: uid(10), business_id: businessId, customer_id: customerId, appointment_id: appointmentId, payment_attempt_id: null,
    occurred_at: NOW, amount_cents: amount, currency: "cad", status: "succeeded", provider: "manual", kind, method: "cash",
    customer: { id: customerId, business_id: businessId },
    appointment: { id: appointmentId, business_id: businessId, customer_id: customerId, location_id: locationId, amount_refunded_cents: 0,
      current_location: { id: locationId, business_id: businessId }, appointment_witness: [] },
    attempt: null, transaction_witness: [] };
}
function money(data: unknown[], error: unknown = null) {
  const dependencies: FinancialReaderDependencies = { resolveAuthority: async () => ({ businessId, actorId: uid(20), timezone: "America/Toronto", currency: "cad" }),
    now: () => new Date(NOW), read: async () => ({ data, count: data.length, error }) };
  return readFinancialAggregate({ period: "today" }, dependencies);
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(NOW)); vi.clearAllMocks();
  row = fixture(); logs = []; notifications = []; events = []; accesses = []; unexpected = [];
  for (const [role, factory] of [["session", mocks.session], ["communications", mocks.service]] as const) {
    const client = makeClient("https://n06.invalid", "offline-only", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => offlineFetch(role, input, init) } });
    factory.mockReturnValue(client);
  }
  unsubscribe = onBookingEvent((event) => { events.push(event); });
});
afterEach(() => { unsubscribe(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("N06 F–I/M real completion effects with offline persistence/provider boundaries", () => {
  it.each(["paid", "unpaid", "deposit"])("preserves %s money, resources, invoice/receipt/attempt identities and communications", async (mode) => {
    const paid = mode === "paid" ? 11300 : mode === "unpaid" ? 0 : 5000;
    row.amount_paid_cents = paid; row.payment_status = mode === "paid" ? "paid" : mode === "unpaid" ? "unpaid" : "partial";
    const records = { ledger: paid ? [ledger(mode === "deposit" ? "deposit" : "payment", paid)] : [],
      invoices: [{ id: uid(30), number: "INV-EXISTING", total: 11300, balance: 11300 - paid }],
      receipts: paid ? [{ id: uid(31), number: "RECEIPT-EXISTING", amount: paid, sentAt: NOW }] : [],
      attempts: paid ? [{ id: uid(32), state: "ACCEPTED", amount: paid, currency: "cad" }] : [],
      resources: [{ appointment_id: appointmentId, resource_id: uid(33) }], refunds: [] };
    const before = structuredClone({ row, records }); const beforeMoney = await money(records.ledger);
    expect(singleFinancialAmount(beforeMoney)).toMatchObject({ state: "EXACT", cents: paid });
    expect(appointmentRecognizedCents(row)).toBe(0);
    expect(await complete()).toMatchObject({ phase: "success", events: [{ type: "appointment.completed" }] });
    expect(row).toEqual({ ...before.row, status: "completed" }); expect(records).toEqual(before.records);
    expect(await money(records.ledger)).toEqual(beforeMoney);
    expect(appointmentRecognizedCents(row)).toBe(10000); // operational service value only
    expect(logs).toHaveLength(1); expect(logs[0]).toMatchObject({ business_id: businessId, appointment_id: appointmentId, action: "update",
      before_state: { status: "confirmed" }, after_state: { status: "completed", start_time: before.row.start_time, end_time: before.row.end_time } });
    expect(events).toHaveLength(1); expect(events[0]).toMatchObject({ type: "appointment.completed", businessId, appointmentId });
    expect(notifications).toHaveLength(1); expect(notifications[0]).toMatchObject({ title: "Appointment updated", metadata: { event: "updated", appointmentId } });
    expect(mocks.webhook).toHaveBeenCalledExactlyOnceWith(businessId, "appointment.updated", { appointmentId, startTime: row.start_time, endTime: row.end_time, status: "completed" });
    expect(mocks.calendar).toHaveBeenCalledOnce(); expect(mocks.push).toHaveBeenCalledOnce();
    expect((await complete()).events).toEqual([]);
    expect(events).toHaveLength(1); expect(logs).toHaveLength(1); expect(notifications).toHaveLength(1);
    expect(mocks.webhook).toHaveBeenCalledOnce(); expect(mocks.calendar).toHaveBeenCalledOnce(); expect(mocks.push).toHaveBeenCalledOnce();
    for (const effect of [mocks.email, mocks.sms, mocks.reminder, mocks.remove]) expect(effect).not.toHaveBeenCalled();
    expect(accesses.filter((a) => a.method === "PATCH")).toEqual([{ table: "appointments", method: "PATCH", role: "session", body: { status: "completed" } }]);
    expect(unexpected).toEqual([]);
  });
  it.each(["HELD", "UNKNOWN"])("preserves %s financial truth across operational completion", async (state) => {
    const data = [{ ...ledger(), ...(state === "HELD" ? { status: "pending" } : {}) }];
    const error = state === "UNKNOWN" ? { message: "offline read unavailable" } : null;
    const before = await money(data, error); expect(before.state).toBe(state);
    expect((await complete()).phase).toBe("success"); expect(await money(data, error)).toEqual(before);
    expect(unexpected).toEqual([]);
  });
  it("documents the inherited non-transactional handler-failure limit without replay on retry", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.webhook.mockRejectedValueOnce(new Error("synthetic downstream failure"));
    const result = await complete();
    expect(result).toMatchObject({ phase: "success" }); expect(result.warning).toBeUndefined();
    expect(row.status).toBe("completed"); expect(logs).toHaveLength(1);
    expect(consoleError).toHaveBeenCalledWith("[booking-engine] event handler failed:", expect.any(Error));
    expect((await complete()).events).toEqual([]); expect(mocks.webhook).toHaveBeenCalledOnce();
  });
});
