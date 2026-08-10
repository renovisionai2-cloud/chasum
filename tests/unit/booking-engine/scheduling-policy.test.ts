import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyPolicyChecks,
  BookingFacade,
  distinguishesIntervalFromDuration,
  explanationForCode,
  mapRpcErrorToConflict,
  resolveSchedulingPolicy,
  type AvailabilityContext,
} from "@/lib/booking-engine";
import { resolveBookingIntervalMinutes } from "@/lib/booking/interval";

const baseContext = {
  businessId: "b1",
  locationId: "l1",
  serviceId: "s1",
  staffId: "e1",
  channel: "staff" as const,
  timezone: "America/Toronto",
  intervalMinutes: 15,
  durationMinutes: 30,
  cleanupMinutes: 5,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 10,
  minNoticeMinutes: 120,
  maxBookingDaysAhead: 90,
  maxAppointmentsPerDay: 20,
  allowDoubleBooking: false,
  acceptOnlineBookings: true,
  bookingVisibility: "online" as const,
  confirmationMode: null,
  priorityScheduling: 0,
  serviceActive: true,
  staffActive: true,
  composedAt: "2026-08-10T12:00:00.000Z",
} satisfies AvailabilityContext;

describe("Phase 5.1 — SchedulingPolicy & availability truth", () => {
  it("resolves SchedulingPolicy from AvailabilityContext without inventing values", () => {
    const policy = resolveSchedulingPolicy(baseContext);
    expect(policy.bookingIntervalMinutes).toBe(15);
    expect(policy.serviceDurationMinutes).toBe(30);
    expect(policy.bufferAfterMinutes).toBe(10);
    expect(policy.cleanupMinutes).toBe(5);
    expect(policy.minimumNoticeMinutes).toBe(120);
    expect(policy.maximumAdvanceDays).toBe(90);
    expect(policy.dailyCap).toBe(20);
    expect(policy.timezone).toBe("America/Toronto");
    expect(policy.channel).toBe("staff");
    expect(BookingFacade.resolvePolicy(baseContext)).toEqual(policy);
  });

  it("distinguishes booking interval from service duration", () => {
    expect(distinguishesIntervalFromDuration(resolveSchedulingPolicy(baseContext))).toBe(
      true,
    );
    const same = resolveSchedulingPolicy({
      ...baseContext,
      intervalMinutes: 30,
      durationMinutes: 30,
    });
    expect(distinguishesIntervalFromDuration(same)).toBe(false);
    expect(
      resolveBookingIntervalMinutes({
        locationInterval: 5,
        businessInterval: 30,
      }),
    ).toBe(5);
    expect(
      resolveBookingIntervalMinutes({
        locationInterval: null,
        businessInterval: 15,
      }),
    ).toBe(15);
  });

  it("propagates channel, timezone, and location via policy snapshot", () => {
    const publicPolicy = resolveSchedulingPolicy({
      ...baseContext,
      channel: "public",
      timezone: "America/Vancouver",
      locationId: "loc-van",
    });
    expect(publicPolicy.channel).toBe("public");
    expect(publicPolicy.timezone).toBe("America/Vancouver");
  });

  it("applyPolicyChecks emits MIN_NOTICE and MAX_AHEAD truthfully", () => {
    const now = new Date("2026-08-10T12:00:00.000Z");
    const tooSoon = applyPolicyChecks(
      baseContext,
      "2026-08-10T12:30:00.000Z",
      now,
    );
    expect(tooSoon[0]?.code).toBe("MIN_NOTICE");
    const tooFar = applyPolicyChecks(
      baseContext,
      "2027-01-01T15:00:00.000Z",
      now,
    );
    expect(tooFar[0]?.code).toBe("MAX_AHEAD");
  });

  it("maps proven conflict codes and keeps unknown text UNMAPPED", () => {
    expect(mapRpcErrorToConflict("overlaps an existing appointment").code).toBe(
      "STAFF_BUSY",
    );
    expect(mapRpcErrorToConflict("Staff on vacation").code).toBe("VACATION");
    expect(mapRpcErrorToConflict("lunch break conflict").code).toBe("LUNCH_BLOCK");
    expect(mapRpcErrorToConflict("business is closed today").code).toBe("CLOSURE");
    expect(mapRpcErrorToConflict("outside working hours").code).toBe("OUTSIDE_HOURS");
    expect(mapRpcErrorToConflict("minimum notice required").code).toBe("MIN_NOTICE");
    expect(mapRpcErrorToConflict("too far ahead").code).toBe("MAX_AHEAD");
    expect(mapRpcErrorToConflict("daily appointment limit").code).toBe("DAILY_CAP");
    expect(mapRpcErrorToConflict("employee not assigned to service").code).toBe(
      "NOT_QUALIFIED",
    );
    expect(mapRpcErrorToConflict("not available for online booking").code).toBe(
      "CHANNEL_FORBIDDEN",
    );
    expect(mapRpcErrorToConflict("totally novel failure").code).toBe("UNMAPPED");
  });

  it("explanations are grounded for structured codes", () => {
    expect(explanationForCode("STAFF_BUSY")).toMatch(/already booked/i);
    expect(explanationForCode("OUTSIDE_HOURS")).toMatch(/working hours/i);
    expect(explanationForCode("MIN_NOTICE")).toMatch(/too soon/i);
    expect(explanationForCode("CLOSURE")).toMatch(/closed/i);
  });

  it("does not introduce TypeScript slot generation", () => {
    const query = readFileSync(
      join(process.cwd(), "lib/booking-engine/availability/query.ts"),
      "utf8",
    );
    const policy = readFileSync(
      join(process.cwd(), "lib/booking-engine/availability/policy.ts"),
      "utf8",
    );
    expect(query).toContain('rpc("get_available_slots"');
    expect(policy).toContain("NOT a second slot engine");
    expect(policy).not.toMatch(/rpc\(["']get_available_slots/);
  });

  it("documents unsupported rules without fabricating enforcement", () => {
    const engineDoc = readFileSync(
      join(process.cwd(), "docs/WORLD_CLASS_CALENDAR_BOOKING_ENGINE.md"),
      "utf8",
    );
    expect(engineDoc).toMatch(/EMPTY TIME ≠ AVAILABLE TIME|EMPTY TIME != AVAILABLE TIME/);
    expect(engineDoc).toMatch(/Scheduling capability matrix|CURRENT.*PARTIAL/i);
    expect(engineDoc).toMatch(/DATABASE GAP|Phase 5\.1/);
  });
});
