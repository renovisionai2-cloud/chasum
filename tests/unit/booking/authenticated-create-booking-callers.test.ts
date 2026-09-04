import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("authenticated createBooking callers stay on the session writer", () => {
  it("does not route dashboard appointment create through the public RPC", () => {
    const src = source("lib/actions/appointments.ts");
    expect(src).toContain("await createBooking({");
    expect(src).not.toContain("publicBookingPersistence");
    expect(src).not.toContain("book_public_appointment");
    expect(src).not.toContain('kind: "public_rpc"');
    expect(src).toContain('channel: "staff"');
  });

  it("does not route duplicate appointment through the public RPC", () => {
    const src = source("lib/actions/booking-engine.ts");
    expect(src).toContain("await createBooking({");
    expect(src).not.toContain("publicBookingPersistence");
    expect(src).not.toContain("book_public_appointment");
    expect(src).toContain('channel: "staff"');
  });

  it("does not route authenticated Summer create through the public RPC", () => {
    const src = source("lib/booking-engine/adapters/summer.ts");
    expect(src).toContain("return createBooking(summerCreateIntent(input));");
    expect(src).not.toContain("publicBookingPersistence");
    expect(src).not.toContain("book_public_appointment");
  });

  it("does not wire the API channel to the public RPC", () => {
    const src = source("lib/booking-engine/adapters/api.ts");
    expect(src).not.toContain("createBooking");
    expect(src).not.toContain("publicBookingPersistence");
    expect(src).not.toContain("book_public_appointment");
  });

  it("does not infer privileged persistence from intent.channel inside createBooking", () => {
    const src = source("lib/booking-engine/mutations/create.ts");
    expect(src).not.toMatch(/intent\.channel\s*===\s*["']public["']/);
    expect(src).not.toContain("createServiceClient");
    expect(src).not.toContain("bypassRls");
    expect(src).not.toContain("@/lib/supabase/service");
    expect(src).toContain("isPublicRpcPersistence");
    expect(src).toContain('rpc("book_public_appointment"');
  });

  it("does not let the public action call handleAppointmentEvent directly", () => {
    const src = source("lib/actions/public-booking.ts");
    expect(src).not.toContain("handleAppointmentEvent");
    expect(src).not.toContain("notifications/orchestrator");
    expect(src).toContain("deliverBookingNotifications");
  });

  it("keeps dashboard create on one createBooking pass plus deliverBookingNotifications", () => {
    const src = source("lib/actions/appointments.ts");
    expect(src).not.toContain("handleAppointmentEvent");
    expect(src).not.toContain("notifications/orchestrator");
    expect(src).toContain("await createBooking({");
    expect(src).toContain("deliverBookingNotifications");
    expect(src.match(/deliverBookingNotifications\(/g)?.length).toBe(1);
  });
});
