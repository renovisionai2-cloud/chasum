import { cleanup, render, screen } from "@testing-library/react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../msw/server";
import { queryAppointmentsInRange } from "@/lib/booking-engine/queries/range";
import { DayAgendaList } from "@/components/day-view/day-control-center";
import { DayAppointmentCard } from "@/components/day-view/appointment-card";
import { parseCalendarDateParam } from "@/lib/calendar/date-param";
import type { AppointmentWithRelations } from "@/lib/types/booking";

// Real PostgREST query builder; only HTTP is intercepted. No live credentials or DB.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createSupabaseClient("https://calendar-query.test", "local-fixture-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }),
}));
const startIso = "2026-09-11T04:00:00.000Z";
const endIso = "2026-09-12T03:59:59.999Z";
const input = { businessId: "business-a", startIso, endIso };
const row = (id: string, start: string, end: string, overrides = {}) => ({
  id, business_id: "business-a", location_id: "main", start_time: start, end_time: end,
  status: "confirmed", customer: { name: id }, service: { name: "Test Service", color: "#123456" },
  staff: null, location: { id: "main", name: "Main" }, ...overrides,
});
const fixtures = [
  row("inside", "2026-09-11T16:00Z", "2026-09-11T17:00Z"),
  row("carry", "2026-09-11T03:30Z", "2026-09-11T04:30Z"),
  row("spanning", "2026-09-10T03:30Z", "2026-09-13T04:30Z"),
  row("ends-at-start", "2026-09-11T03:00Z", startIso),
  row("ended-before", "2026-09-11T02:00Z", "2026-09-11T03:00Z"),
  row("starts-after", "2026-09-12T04:00Z", "2026-09-12T05:00Z"),
  row("starts-at-end", endIso, "2026-09-12T05:00Z"),
  row("other-business", "2026-09-11T03:30Z", "2026-09-11T04:30Z", { business_id: "business-b" }),
  row("other-location", "2026-09-11T03:30Z", "2026-09-11T04:30Z", { location_id: "other" }),
  row("cancelled", "2026-09-11T16:00Z", "2026-09-11T17:00Z", { status: "cancelled" }),
];
let requestUrl: URL;
beforeEach(() => {
  server.use(http.get("https://calendar-query.test/rest/v1/appointments", ({ request }) => {
    requestUrl = new URL(request.url);
    // Evaluate the actual emitted filters, not a preprogrammed expected response.
    let rows = [...fixtures];
    for (const [column, filter] of requestUrl.searchParams) {
      if (column === "select" || column === "order") continue;
      const split = filter.indexOf(".");
      const op = filter.slice(0, split), value = filter.slice(split + 1);
      rows = rows.filter(item => {
        const actual = item[column as keyof typeof item];
        if (op === "eq") return actual === value;
        const a = Date.parse(String(actual)), b = Date.parse(value);
        if (op === "gt") return a > b;
        if (op === "gte") return a >= b;
        if (op === "lte") return a <= b;
        throw new Error(`Unexpected test filter: ${column}/${op}`);
      });
    }
    if (requestUrl.searchParams.get("order") === "start_time.asc") {
      rows.sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time));
    }
    return HttpResponse.json(rows);
  }));
});
afterEach(cleanup);

describe("queryAppointmentsInRange through the installed Supabase client", () => {
  it.each([
    ["inside", true], ["carry", true], ["spanning", true],
    ["ends-at-start", false], ["ended-before", false], ["starts-after", false],
    ["starts-at-end", true], ["other-business", false],
  ])("%s inclusion is %s", async (id, included) => {
    const rows = await queryAppointmentsInRange(input);
    expect(rows.some(item => item.id === id)).toBe(included);
  });
  it("preserves tenant fencing, relationship selection, ordering and status behavior", async () => {
    const rows = await queryAppointmentsInRange(input);
    expect(requestUrl.searchParams.get("business_id")).toBe("eq.business-a");
    expect(requestUrl.searchParams.get("start_time")).toBe(`lte.${endIso}`);
    expect(requestUrl.searchParams.get("end_time")).toBe(`gt.${startIso}`);
    expect(requestUrl.searchParams.get("order")).toBe("start_time.asc");
    expect(requestUrl.searchParams.get("status")).toBeNull();
    for (const relation of ["service:services(", "staff:staff(", "customer:customers(", "location:locations("]) {
      expect(requestUrl.searchParams.get("select")).toContain(relation);
    }
    expect(rows.some(item => item.id === "cancelled")).toBe(true);
    const times = rows.map(item => Date.parse(item.start_time));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
  it("preserves single-location filtering for carry-in appointments", async () => {
    const rows = await queryAppointmentsInRange({ ...input, scope: { mode: "single", locationId: "main" } });
    expect(requestUrl.searchParams.get("location_id")).toBe("eq.main");
    expect(rows.some(item => item.id === "carry")).toBe(true);
    expect(rows.some(item => item.id === "other-location")).toBe(false);
    expect(rows.some(item => item.id === "other-business")).toBe(false);
  });
  it("All Locations includes both locations but never another business", async () => {
    const rows = await queryAppointmentsInRange({ ...input, scope: { mode: "all" } });
    expect(requestUrl.searchParams.get("location_id")).toBeNull();
    expect(rows.some(item => item.id === "carry")).toBe(true);
    expect(rows.some(item => item.id === "other-location")).toBe(true);
    expect(rows.some(item => item.id === "other-business")).toBe(false);
  });
  it("feeds loaded overnight carry-in data into the real day list and clips a spanning grid card", async () => {
    const rows = await queryAppointmentsInRange(input) as AppointmentWithRelations[];
    const day = parseCalendarDateParam("2026-09-11");
    render(<DayAgendaList date={day} timezone="America/Toronto" appointments={rows} onSelectAppointment={vi.fn()} />);
    expect(screen.getByRole("button", { name: /11:30 PM · carry/ })).toBeVisible();
    cleanup();
    const spanning = rows.find(item => item.id === "spanning")!;
    render(<DayAppointmentCard day={day} timezone="America/Toronto" appointment={spanning} onSelect={vi.fn()} />);
    const card = screen.getByRole("button");
    expect(card.style.top).toBe("0%");
    expect(card.style.height).toBe("100%");
  });
  it("continues to propagate query errors", async () => {
    server.use(http.get("https://calendar-query.test/rest/v1/appointments", () =>
      HttpResponse.json({ message: "test query failure" }, { status: 400 })));
    await expect(queryAppointmentsInRange(input)).rejects.toThrow("test query failure");
  });
});
