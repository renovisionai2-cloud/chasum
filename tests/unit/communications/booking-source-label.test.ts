import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { bookingSourceLabel } from "@/lib/communications/booking-source";
import { renderEmailTemplate } from "@/lib/communications/templates";

const base = {
  businessId: "biz",
  businessName: "Chasum Test Studio",
  customerName: "Brendan Dindial",
  staffName: "Momentic Test Staff",
  serviceName: "Momentic Test Service",
  startTime: "2026-09-08T16:00:00.000Z",
  endTime: "2026-09-08T16:30:00.000Z",
  timezone: "America/Toronto",
  locationName: "Chasum Test Studio — Main",
  appointmentTotalCents: 2500,
};

describe("business email booking source label", () => {
  it("does not label a public booking as Reception", () => {
    const rendered = renderEmailTemplate("appointment.business", {
      ...base,
      bookingChannel: "public",
    });
    expect(rendered.html).not.toMatch(/Booking source[\s\S]*Reception/);
    expect(rendered.html).toContain("Public Booking");
    expect(rendered.html).toContain("Booking source");
  });

  it("uses the Public Booking channel label for public/online bookings", () => {
    expect(bookingSourceLabel("public")).toBe("Public Booking");
    const rendered = renderEmailTemplate("appointment.business", {
      ...base,
      bookingChannel: "public",
    });
    expect(rendered.html).toContain(">Public Booking<");
  });

  it("preserves Reception for dashboard/staff and reception channels", () => {
    expect(bookingSourceLabel("staff")).toBe("Reception");
    expect(bookingSourceLabel("reception")).toBe("Reception");
    expect(bookingSourceLabel(undefined)).toBe("Reception");
    const rendered = renderEmailTemplate("appointment.business", {
      ...base,
      bookingChannel: "staff",
    });
    expect(rendered.html).toContain(">Reception<");
    expect(rendered.html).not.toContain("Public Booking");
  });

  it("does not add a booking source row to the customer confirmation email", () => {
    const rendered = renderEmailTemplate("appointment.confirmation", {
      ...base,
      bookingChannel: "public",
    });
    expect(rendered.subject).toMatch(/^You're booked —/);
    expect(rendered.html).not.toContain("Booking source");
    expect(rendered.html).not.toContain("Public Booking");
    expect(rendered.html).not.toContain("Reception");
  });
});

describe("public vs dashboard callers pass the Booking Engine channel", () => {
  it("public action stamps public onto deliverBookingNotifications and does not call handleAppointmentEvent", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/actions/public-booking.ts"),
      "utf8",
    );
    expect(src).toContain("deliverBookingNotifications(appointmentId");
    expect(src).toContain('bookingChannel: "public"');
    expect(src).not.toContain("handleAppointmentEvent");
    expect(src.match(/deliverBookingNotifications\(/g)?.length).toBe(1);
  });

  it("dashboard create stamps staff and still delivers notifications once", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/actions/appointments.ts"),
      "utf8",
    );
    expect(src).toContain("deliverBookingNotifications(appointmentId");
    expect(src).toContain('bookingChannel: "staff"');
    expect(src).not.toContain("handleAppointmentEvent");
    expect(src.match(/deliverBookingNotifications\(/g)?.length).toBe(1);
  });
});
