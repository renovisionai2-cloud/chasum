// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resetRateLimitStore } from "@/lib/security/rate-limit";
import type { AvailabilityContext } from "@/lib/booking-engine/types";

vi.mock("server-only", () => ({}));
const effects = vi.hoisted(() => ({ provider: vi.fn(), orchestrator: vi.fn(), validate: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/booking/slug-alias-lookup", () => ({ getPublicBusinessBySlug: async () => business }));
vi.mock("@/lib/observability/logger", () => ({ captureBookingFailure: vi.fn(), logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/observability/sentry", () => ({ captureMessage: vi.fn() }));
vi.mock("@/lib/booking-engine/availability", async original => ({
  ...await original<typeof import("@/lib/booking-engine/availability")>(), validateBooking: effects.validate,
}));
vi.mock("@/lib/booking-engine/conflicts", async original => ({
  ...await original<typeof import("@/lib/booking-engine/conflicts")>(),
  findRoomConflicts: vi.fn().mockResolvedValue([]), logAppointmentChange: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/integrations/notifications/orchestrator", async original => {
  const actual = await original<typeof import("@/lib/integrations/notifications/orchestrator")>();
  effects.orchestrator.mockImplementation(actual.handleAppointmentEvent);
  return { ...actual, handleAppointmentEvent: effects.orchestrator };
});
// Only the provider boundary is stubbed: templates, preferences, delivery and ledger run for real.
vi.mock("@/lib/communications/providers", () => ({ providerSendEmail: effects.provider, providerSendSms: vi.fn() }));
vi.mock("@/lib/integrations/calendar/sync", () => ({ pushAppointmentToCalendars: vi.fn(), deleteAppointmentFromCalendars: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => db }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db }));
vi.mock("@/lib/env", () => ({
  getResendApiKey: () => "local-provider-stub", getTwilioConfig: () => null,
  getEmailFromAddress: () => "sender@example.invalid", getAppUrl: () => "https://example.invalid",
}));

import { bookAppointment } from "@/lib/actions/public-booking";
import { deliverBookingNotifications } from "@/lib/notifications/booking-delivery";
import { initialBookingIntentId } from "@/lib/communications/intent-identity";
import { sendIntentKey } from "@/lib/communications/send-intent";
import { sendEmail } from "@/lib/communications/delivery";
import { loadAppointmentNotifyContext } from "@/lib/notifications/booking-delivery";
import { onBookingEvent } from "@/lib/booking-engine/events/emit";

// Storage adapter supplies deterministic fixtures and records real application writes.
// This is not a PostgreSQL atomicity/concurrency rehearsal.
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let rows: Record<string, Row[]>;
let failPersistence = false;
let preferenceReads: { table: string; select: string }[];
let observedEvents: string[];
const business = {
  id: "business-a", name: "Test Studio", slug: "test-studio", public_booking_mode: "public",
  booking_invite_code: null, timezone: "America/Toronto", email: "business@example.invalid",
  notification_email: "business@example.invalid", email_notifications_enabled: true,
  sms_notifications_enabled: false, owner_notifications_enabled: true, staff_notifications_enabled: false,
  marketing_email_enabled: true, quiet_hours_start: null, quiet_hours_end: null,
  subscription_plan_key: "starter", private_alpha_enabled: true,
};
const appointment = () => ({
  id: "appointment-a", business_id: business.id, service_id: "service-a", staff_id: "staff-a",
  customer_id: "customer-a", location_id: "location-a", status: "confirmed",
  start_time: "2030-09-11T16:30:00.000Z", end_time: "2030-09-11T17:00:00.000Z",
  price_cents: 2500, tax_cents: 0, deposit_cents: 0, amount_paid_cents: 0,
  business, customer: rows.customers[0], service: rows.services[0], staff: rows.staff[0], location: rows.locations[0],
});
const db = {
  async rpc(name: string, args: Row) {
    expect(name).toBe("book_public_appointment");
    expect(args).toMatchObject({ p_business_id: business.id, p_staff_id: "staff-a", p_service_id: "service-a", p_location_id: "location-a" });
    if (failPersistence) return { data: null, error: { message: "Time slot unavailable" } };
    rows.appointments.push(appointment());
    return { data: "appointment-a", error: null };
  },
  from(table: string) {
    const predicates: ((row: Row) => boolean)[] = [];
    let inserted: Row | undefined, updates: Row | undefined, single = false, selected = "";
    const run = () => {
      rows[table] ??= [];
      preferenceReads.push({ table, select: selected });
      if (inserted) {
        if (table === "communication_send_intents" && rows[table].some(r => r.business_id === inserted!.business_id && r.intent_key === inserted!.intent_key)) {
          return { data: null, error: { code: "23505", message: "duplicate intent" } };
        }
        const row = { id: `${table}-${rows[table].length}`, ...(table === "background_jobs" ? { status: "pending", attempts: 0 } : {}), ...inserted };
        rows[table].push(row);
        return { data: single ? { ...row } : [{ ...row }], error: null };
      }
      const found = rows[table].filter(r => predicates.every(p => p(r)));
      if (updates) found.forEach(r => Object.assign(r, updates));
      return { data: single ? found[0] ? { ...found[0] } : null : found.map(r => ({ ...r })), error: null };
    };
    const query = {
      select(value: string) { selected = value; return query; },
      eq(key: string, value: unknown) { predicates.push(r => r[key] === value); return query; },
      in(key: string, values: unknown[]) { predicates.push(r => values.includes(r[key])); return query; },
      contains(key: string, value: Row) { predicates.push(r => Object.entries(value).every(([k, v]) => r[key]?.[k] === v)); return query; },
      insert(value: Row) { inserted = value; return query; },
      update(value: Row) { updates = value; return query; },
      order() { return query; }, limit() { return query; },
      single() { single = true; return Promise.resolve(run()); },
      maybeSingle() { single = true; return Promise.resolve(run()); },
      then(resolve: (result: ReturnType<typeof run>) => unknown) { return Promise.resolve(run()).then(resolve); },
    };
    return query;
  },
};
const context: AvailabilityContext = {
  businessId: business.id, locationId: "location-a", serviceId: "service-a", staffId: "staff-a",
  channel: "public", timezone: "America/Toronto", intervalMinutes: 30, durationMinutes: 30,
  cleanupMinutes: 0, bufferBeforeMinutes: 0, bufferAfterMinutes: 0, minNoticeMinutes: null,
  maxBookingDaysAhead: null, maxAppointmentsPerDay: null, allowDoubleBooking: false,
  acceptOnlineBookings: true, bookingVisibility: "online", confirmationMode: "inherit",
  priorityScheduling: 0, serviceActive: true, staffActive: true, composedAt: "2030-09-10T12:00:00Z",
};
function form() {
  const fd = new FormData();
  for (const [key, value] of Object.entries({ slug: "test-studio", location_id: "location-a", service_id: "service-a", staff_id: "staff-a", any_staff: "0", start_time: "2030-09-11T16:30:00Z", customer_name: "Test Customer", customer_email: "customer@example.invalid" })) fd.set(key, value);
  return fd;
}
onBookingEvent(event => { observedEvents.push(event.type); });
beforeEach(() => {
  resetRateLimitStore(); vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "true");
  vi.stubEnv("CHASUM_WORKER_WEBHOOKS_ENABLED", "false");
  failPersistence = false; observedEvents = []; preferenceReads = [];
  rows = {
    businesses: [{ ...business }], appointments: [], background_jobs: [], communication_send_intents: [], notifications: [], notification_logs: [],
    services: [{ id: "service-a", business_id: business.id, location_id: "location-a", name: "Test Service", duration_minutes: 30, price: 25, is_active: true, online_booking: true, deposit_cents: 0, deposit_required: false }],
    staff: [{ id: "staff-a", business_id: business.id, name: "Test Staff", is_active: true, accept_online_bookings: true, email: null }],
    customers: [{ id: "customer-a", business_id: business.id, name: "Test Customer", email: "customer@example.invalid", phone: null, preferred_communication_method: "email", marketing_consent: false }],
    locations: [{ id: "location-a", business_id: business.id, name: "Main", timezone: "America/Toronto" }],
  };
  effects.validate.mockResolvedValue({ ok: true, context, endTime: "2030-09-11T17:00:00.000Z" });
  effects.orchestrator.mockClear(); effects.provider.mockReset();
  effects.provider.mockImplementation(async () => ({ success: true, provider: "local-stub", messageId: `message-${effects.provider.mock.calls.length}` }));
});
afterEach(() => vi.unstubAllEnvs());

describe("combined public booking and recovery communications", () => {
  it("creates once, enters recovery once, and shares durable customer/business identities with queued twins", async () => {
    const result = await bookAppointment({}, form());
    expect(result.error).toBeUndefined(); expect(result.appointmentId).toBe("appointment-a");
    expect(rows.appointments).toHaveLength(1);
    expect(observedEvents.filter(e => e === "appointment.created")).toHaveLength(1);
    const occurrence = initialBookingIntentId("appointment-a");
    expect(effects.orchestrator).toHaveBeenCalledExactlyOnceWith("appointment-a", "confirmed", expect.objectContaining({ businessId: business.id, bookingChannel: "public", sendIntentId: occurrence }));
    expect(rows.notifications).toHaveLength(1);
    expect(rows.background_jobs.filter(r => r.job_type === "webhook" && r.payload.event === "appointment.created")).toHaveLength(1);
    const emails = rows.background_jobs.filter(r => r.job_type === "email");
    expect(emails).toHaveLength(2);
    expect(emails.every(r => r.payload.sendIntentId === occurrence && r.payload.sendIntentProtocol === "durable-v1" && r.status === "completed")).toBe(true);
    expect(emails.find(r => r.payload.templateKey === "appointment.business")?.payload.bookingSource).toBe("public");
    expect(rows.communication_send_intents).toHaveLength(2);
    for (const template of ["appointment.confirmation", "appointment.business"]) {
      expect(rows.communication_send_intents.find(r => r.template_key === template)).toMatchObject({ business_id: business.id, entity_type: "appointment", entity_id: "appointment-a", state: "accepted", intent_key: sendIntentKey(occurrence, "email", template) });
    }
    expect(effects.provider).toHaveBeenCalledTimes(2);
    const businessSend = effects.provider.mock.calls.find(([p]) => p.to === "business@example.invalid")![0];
    expect(businessSend.html).toContain("Public Booking"); expect(businessSend.html).not.toContain(">Reception<");
    const customerSend = effects.provider.mock.calls.find(([p]) => p.to === "customer@example.invalid")![0];
    expect(customerSend.html).not.toContain("Booking source");
    expect(preferenceReads.some(r => r.table === "customers" && r.select.includes("marketing_consent"))).toBe(true);
    expect(result.notifications?.filter(r => r.status === "sent")).toHaveLength(2);
    // Replay the queued send inputs through real delivery: accepted ledger prevents provider re-call.
    const ctx = (await loadAppointmentNotifyContext("appointment-a"))!;
    for (const job of emails) {
      const replay = await sendEmail({ businessId: business.id, to: job.payload.recipient, templateKey: job.payload.templateKey,
        appointmentId: "appointment-a", customerId: "customer-a", context: { ...ctx, bookingChannel: job.payload.bookingSource },
        skipPreferenceCheck: job.payload.skipPreferenceCheck,
        reliability: { intentId: occurrence, source: "worker", jobId: job.id, attempt: 1 } });
      expect(replay).toMatchObject({ ok: true, duplicateSuppressed: true });
    }
    await deliverBookingNotifications("appointment-a", { bookingChannel: "public" });
    expect(effects.provider).toHaveBeenCalledTimes(2);
  });
  it("honors customer communication preferences without suppressing the business audience", async () => {
    rows.customers[0].preferred_communication_method = "call";
    const result = await bookAppointment({}, form());
    expect(result.appointmentId).toBe("appointment-a");
    expect(effects.provider).toHaveBeenCalledTimes(1);
    expect(effects.provider.mock.calls[0][0].to).toBe("business@example.invalid");
    expect(result.notifications?.find(r => r.channel === "customer_email")?.status).not.toBe("sent");
    expect(rows.communication_send_intents.map(r => r.template_key)).toEqual(["appointment.business"]);
  });
  it("keeps persistence failure free of events, queued effects and provider sends", async () => {
    failPersistence = true;
    const result = await bookAppointment({}, form());
    expect(result.error).toMatch(/time slot/i);
    expect(rows.appointments).toHaveLength(0); expect(rows.background_jobs).toHaveLength(0);
    expect(rows.notifications).toHaveLength(0); expect(rows.communication_send_intents).toHaveLength(0);
    expect(effects.orchestrator).not.toHaveBeenCalled(); expect(effects.provider).not.toHaveBeenCalled();
    expect(observedEvents).toHaveLength(0);
  });
  it("retains the source guard against direct public action orchestration", () => {
    expect(readFileSync(new URL("../../../lib/actions/public-booking.ts", import.meta.url), "utf8")).not.toContain("handleAppointmentEvent");
  });
});
