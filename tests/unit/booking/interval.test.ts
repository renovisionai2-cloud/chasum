import { describe, expect, it } from "vitest";
import {
  DEFAULT_BOOKING_INTERVAL_MINUTES,
  isOnBookingInterval,
  normalizeBookingIntervalMinutes,
  resolveBookingIntervalMinutes,
  snapOffsetToIntervalMinutes,
} from "@/lib/booking/interval";

describe("booking interval", () => {
  it("defaults to 30 to preserve existing tenant behaviour", () => {
    expect(DEFAULT_BOOKING_INTERVAL_MINUTES).toBe(30);
    expect(normalizeBookingIntervalMinutes(undefined)).toBe(30);
    expect(resolveBookingIntervalMinutes({})).toBe(30);
  });

  it("accepts platform-supported intervals including 5 minutes", () => {
    for (const n of [5, 10, 15, 20, 30, 45, 60]) {
      expect(normalizeBookingIntervalMinutes(n)).toBe(n);
    }
  });

  it("prefers location interval over business", () => {
    expect(
      resolveBookingIntervalMinutes({
        locationInterval: 5,
        businessInterval: 30,
      }),
    ).toBe(5);
  });

  it("snaps hour-row offsets to 5-minute boundaries", () => {
    // Midway through the first 5 minutes of a 60px hour → near 0
    expect(snapOffsetToIntervalMinutes(2, 60, 5)).toBe(0);
    // ~ halfway in hour → 30
    expect(snapOffsetToIntervalMinutes(30, 60, 5)).toBe(30);
    // ~ 9/60 → 10 minutes
    expect(snapOffsetToIntervalMinutes(9, 60, 5)).toBe(10);
  });

  it("detects times already on the interval without rounding", () => {
    const d = new Date(2026, 7, 3, 9, 5, 0);
    expect(isOnBookingInterval(d, 5)).toBe(true);
    expect(isOnBookingInterval(d, 30)).toBe(false);
  });
});
