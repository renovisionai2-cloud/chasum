import { describe, expect, it } from "vitest";
import {
  businessBookingFormRevision,
  locationSchedulingFormRevision,
  persistedBookingFormRevision,
} from "@/lib/booking/settings-form-revision";

describe("persistedBookingFormRevision", () => {
  it("changes when any persisted part changes", () => {
    const before = persistedBookingFormRevision([30, 60, "auto"]);
    const after = persistedBookingFormRevision([15, 60, "auto"]);
    expect(before).not.toBe(after);
  });

  it("treats null and undefined as empty so missing optionals stay stable", () => {
    expect(persistedBookingFormRevision([null, 15])).toBe(
      persistedBookingFormRevision([undefined, 15]),
    );
  });
});

describe("businessBookingFormRevision", () => {
  it("includes updated_at when present so a timestamp bump remounts even if values match", () => {
    const first = businessBookingFormRevision({
      updatedAt: "2026-08-21T22:00:00.000Z",
      appointmentIntervalMinutes: 15,
      bookingLimitDays: 60,
    });
    const second = businessBookingFormRevision({
      updatedAt: "2026-08-21T22:01:00.000Z",
      appointmentIntervalMinutes: 15,
      bookingLimitDays: 60,
    });
    expect(first).not.toBe(second);
  });

  it("still changes when interval changes even without updated_at", () => {
    expect(
      businessBookingFormRevision({ appointmentIntervalMinutes: 30 }),
    ).not.toBe(
      businessBookingFormRevision({ appointmentIntervalMinutes: 15 }),
    );
  });
});

describe("locationSchedulingFormRevision", () => {
  it("does not depend on updated_at because location_settings has no bump trigger", () => {
    const first = locationSchedulingFormRevision({
      appointmentIntervalMinutes: 15,
      bookingLimitDays: 60,
    });
    const second = locationSchedulingFormRevision({
      appointmentIntervalMinutes: 30,
      bookingLimitDays: 60,
    });
    expect(first).not.toBe(second);
  });
});
