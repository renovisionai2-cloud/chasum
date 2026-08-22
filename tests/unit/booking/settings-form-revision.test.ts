import { describe, expect, it } from "vitest";
import {
  businessBookingFormRevision,
  locationHoursFormRevision,
  locationSchedulingFormRevision,
  persistedBookingFormRevision,
  staffWorkingHoursFormRevision,
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

  it("does not collide when free-text contains the old pipe separator", () => {
    expect(persistedBookingFormRevision(["a|b", "c"])).not.toBe(
      persistedBookingFormRevision(["a", "b|c"]),
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

describe("locationHoursFormRevision", () => {
  it("changes when a weekday open time changes", () => {
    const monday = {
      day_of_week: 1,
      is_open: true,
      open_time: "09:00",
      close_time: "17:00",
    };
    expect(
      locationHoursFormRevision([monday]),
    ).not.toBe(
      locationHoursFormRevision([{ ...monday, open_time: "10:00" }]),
    );
  });
});

describe("staffWorkingHoursFormRevision", () => {
  it("changes when lunch or overtime fields change", () => {
    const monday = {
      day_of_week: 1,
      is_working: true,
      start_time: "09:00",
      end_time: "17:00",
      lunch_start_time: "12:00",
      lunch_end_time: "13:00",
      overtime_eligible: false,
    };
    expect(staffWorkingHoursFormRevision([monday])).not.toBe(
      staffWorkingHoursFormRevision([{ ...monday, overtime_eligible: true }]),
    );
  });
});
