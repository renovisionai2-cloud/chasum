import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import { inspectPublicBookingStartTime } from "@/lib/booking/public-write-path";
import { formatTime } from "@/lib/calendar/utils";
import { snapDateToBookingInterval } from "@/lib/booking/interval";

const PAGE_SOURCE = readFileSync(
  join(process.cwd(), "components/booking/public-booking-page.tsx"),
  "utf8",
);

/**
 * 12:10 PM America/Toronto on Friday 28 Aug 2026 is 16:10 UTC (EDT).
 * This is diagnostic evidence only — no time-display fix lives here.
 */
const SELECTED_SLOT_START = "2026-08-28T16:10:00.000Z";

describe("public booking 12:10 time-integrity diagnostic", () => {
  it("keeps the selected slot ISO as the hidden form start_time", () => {
    expect(PAGE_SOURCE).toContain(
      '<input type="hidden" name="start_time" value={selectedSlot.start} />',
    );
  });

  it("Review formats selectedSlot.start with formatTime — not a noon placeholder", () => {
    expect(PAGE_SOURCE).toContain(
      '{format(parseISO(selectedSlot.start), "EEEE, MMM d")} at{" "}',
    );
    expect(PAGE_SOURCE).toContain("{formatTime(parseISO(selectedSlot.start))}");
    expect(PAGE_SOURCE).not.toContain(
      'formatTime(parseISO(`${selectedDate}T12:00:00`))',
    );
  });

  it("does not snap public Review/submit times to the booking interval", () => {
    expect(PAGE_SOURCE).not.toContain("snapDateToBookingInterval");
  });

  it("preserves :10 minutes from selected ISO through server parse", () => {
    const selectedSlotStart = SELECTED_SLOT_START;
    const hiddenFormStartTime = selectedSlotStart;
    const server = inspectPublicBookingStartTime(hiddenFormStartTime);

    expect(hiddenFormStartTime).toBe(selectedSlotStart);
    expect(server.raw).toBe(SELECTED_SLOT_START);
    expect(server.iso).toBe("2026-08-28T16:10:00.000Z");
    expect(server.utcMinutes).toBe(10);
    expect(formatTime(parseISO(selectedSlotStart))).toMatch(/:10/);
  });

  it("interval snap of a local 12:10 with a 30-minute grid becomes :00 — Review does not do that", () => {
    const localTwelveTen = new Date(2026, 7, 28, 12, 10, 0, 0);
    const snapped = snapDateToBookingInterval(localTwelveTen, 30);
    expect(snapped.getMinutes()).toBe(0);
    expect(snapped.getHours()).toBe(12);
    expect(inspectPublicBookingStartTime(SELECTED_SLOT_START).utcMinutes).toBe(
      10,
    );
  });

  it("preserves 12:30 selected ISO minutes through server parse", () => {
    const twelveThirty = "2026-08-28T16:30:00.000Z";
    const server = inspectPublicBookingStartTime(twelveThirty);
    expect(server.iso).toBe(twelveThirty);
    expect(server.utcMinutes).toBe(30);
    expect(formatTime(parseISO(twelveThirty))).toMatch(/:30/);
  });
});
