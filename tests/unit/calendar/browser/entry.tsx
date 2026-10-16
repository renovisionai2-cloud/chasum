// Synthetic-only: run through run.mjs, which replaces every server action and blocks hosted traffic.
import { createRoot } from "react-dom/client";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { location, customer, service, staff } from "../cal01-fixtures";
import type { CalendarView } from "@/lib/types/booking";
import "@/app/globals.css";
const params = new URLSearchParams(locationSearch());
function locationSearch() { return window.location.search; }
const other = { ...location, id: "loc2", name: "Other Location", is_default: false };
const otherService = { ...service, id: "svc2", name: "Other Service", location_id: "loc2", service_locations: [{ location_id: "loc2" }] };
const appointment = {
  id: "synthetic-appointment", business_id: "biz", customer_id: "cust", service_id: "svc", staff_id: "staff", location_id: "loc",
  customer, service, staff, status: "confirmed" as const, notes: null,
  start_time: "2026-10-20T16:30:00.000Z", end_time: "2026-10-20T17:00:00.000Z", created_at: "2026-01-01", updated_at: "2026-01-01",
};
createRoot(document.getElementById("root")!).render(
  <main className="p-3 md:p-6">
    <h1 className="mb-4 text-xl font-semibold">CAL01 synthetic calendar — no hosted connection</h1>
    <CalendarClient initialDate="2026-10-20" initialView={(params.get("view") || "day") as CalendarView}
      appointments={params.has("existing") ? [appointment] : []}
      locations={[location, other]} services={[service, otherService]} staff={[staff]} customers={[customer]}
      scope={params.has("all") ? { mode: "all" } : { mode: "single", locationId: "loc" }}
      timezone="America/Toronto" appointmentIntervalMinutes={30} />
  </main>,
);
