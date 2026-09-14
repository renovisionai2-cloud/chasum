// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { http, HttpResponse } from "msw";
import { server } from "../../msw/server";
import type { AppointmentNotificationContext } from "@/lib/integrations/notifications/appointment-context";

const adapter = vi.hoisted(() => ({ createEvent: vi.fn(), updateEvent: vi.fn(), deleteEvent: vi.fn(), refreshAccessToken: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => client }));
vi.mock("@/lib/integrations/calendar", () => ({ getCalendarAdapter: () => adapter }));
vi.mock("@/lib/integrations/calendar/apple", () => ({ generateAppleIcsSecret: vi.fn() }));
import { pushAppointmentToCalendars, deleteAppointmentFromCalendars } from "@/lib/integrations/calendar/sync";

const url = "https://calendar-integrity.test";
const client = createClient(url, "local-synthetic-key", { auth: { persistSession: false, autoRefreshToken: false } });
const uuid = (n: number) => `cccccccc-cccc-4ccc-8ccc-${n.toString().padStart(12, "0")}`;
const A = uuid(1), B = uuid(2), AP = uuid(3), T = uuid(4);
let context: AppointmentNotificationContext;
let reads: URL[];
let deleted: string[];
let connections: Record<string, unknown>[];
beforeEach(() => {
  vi.resetAllMocks(); reads = []; deleted = [];
  adapter.createEvent.mockResolvedValue({ externalEventId: "created-synthetic" });
  context = {
    appointment: { id: AP, business_id: A, location_id: uuid(5), customer_id: uuid(6), service_id: uuid(7), staff_id: T,
      status: "confirmed", start_time: "2026-09-20T14:00:00Z", end_time: "2026-09-20T14:30:00Z" },
    customer: { id: uuid(6), name: "Own Customer", email: "own@example.invalid", phone: null },
    service: { id: uuid(7), name: "Own Service" }, staff: { id: T, name: "Own Staff", email: null }, location: { id: uuid(5), name: "Own Location" },
  };
  connections = [
    { id: uuid(8), business_id: A, staff_id: null, provider: "google", sync_enabled: true, sync_direction: "outbound", access_token: "OWN_SYNTHETIC_TOKEN", refresh_token: null, token_expires_at: null, provider_calendar_id: "own-calendar" },
    { id: uuid(9), business_id: B, staff_id: null, provider: "google", sync_enabled: true, sync_direction: "outbound", access_token: "FOREIGN_SYNTHETIC_TOKEN", refresh_token: null, token_expires_at: null, provider_calendar_id: "foreign-calendar" },
  ];
  server.use(http.all(`${url}/rest/v1/*`, async ({ request }) => {
    const u = new URL(request.url), table = u.pathname.split("/").at(-1)!;
    if (request.method === "GET") {
      reads.push(u);
      if (table === "appointments") throw new Error("Calendar must not re-read appointment relations");
      if (table === "calendar_connections") {
        const rows = connections.filter(c => [...u.searchParams].every(([key, value]) => !value.startsWith("eq.") || String(c[key]) === value.slice(3)));
        return HttpResponse.json(rows);
      }
      if (table === "external_events") {
        if (u.searchParams.get("select")?.includes("connection:")) {
          const scope = u.searchParams.get("connection.business_id");
          const rows = connections.filter(c => !scope || scope === `eq.${c.business_id}`).map(c => ({ id: c.id, external_event_id: `${c.business_id}-event`, connection: c }));
          return HttpResponse.json(rows);
        }
        return HttpResponse.json([]);
      }
    }
    if (request.method === "DELETE") deleted.push(u.searchParams.get("id")!);
    return HttpResponse.json(null);
  }));
});

it("pushes only the validated names/recipient snapshot without another appointment read", async () => {
  await pushAppointmentToCalendars(context, "Own Business");
  expect(adapter.createEvent).toHaveBeenCalledExactlyOnceWith("OWN_SYNTHETIC_TOKEN", "own-calendar", {
    title: "Own Service — Own Customer", description: "Staff: Own Staff\nBusiness: Own Business",
    startTime: context.appointment.start_time, endTime: context.appointment.end_time, attendees: ["own@example.invalid"],
  });
  expect(reads.some(u => u.pathname.endsWith("/appointments"))).toBe(false);
  expect(adapter.refreshAccessToken).not.toHaveBeenCalled();
});

it("excludes foreign calendar connections before cancellation provider or token operations", async () => {
  await deleteAppointmentFromCalendars(AP, A);
  expect(adapter.deleteEvent).toHaveBeenCalledExactlyOnceWith("OWN_SYNTHETIC_TOKEN", "own-calendar", `${A}-event`);
  expect(adapter.refreshAccessToken).not.toHaveBeenCalled();
  expect(deleted).toEqual([`eq.${uuid(8)}`]);
  expect(reads[0].searchParams.get("select")).toContain("calendar_connections!inner");
  expect(reads[0].searchParams.get("connection.business_id")).toBe(`eq.${A}`);
});

it("uses only shared calendar connections and a safe label for explicit unassigned staff", async () => {
  context.appointment.staff_id = null; context.staff = null;
  await pushAppointmentToCalendars(context, "Own Business");
  expect(reads[0].searchParams.get("staff_id")).toBe("is.null");
  expect(reads[0].searchParams.has("or")).toBe(false);
  expect(adapter.createEvent.mock.calls[0][2].description).toBe("Staff: To be assigned\nBusiness: Own Business");
});

it("does not push a cancelled appointment", async () => {
  context.appointment.status = "cancelled";
  await pushAppointmentToCalendars(context, "Own Business");
  expect(reads).toEqual([]); expect(adapter.createEvent).not.toHaveBeenCalled(); expect(adapter.updateEvent).not.toHaveBeenCalled();
});
