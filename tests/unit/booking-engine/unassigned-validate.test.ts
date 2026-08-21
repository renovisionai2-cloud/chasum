import { describe, expect, it } from "vitest";
import { UNASSIGNED_SERVICE_SELECT } from "@/lib/booking-engine/availability/query";

describe("unassigned booking service select", () => {
  it("uses services.min_booking_notice_minutes (not businesses.min_notice_minutes)", () => {
    expect(UNASSIGNED_SERVICE_SELECT).toContain("min_booking_notice_minutes");
    // A bare min_notice_minutes on services makes PostgREST fail and was
    // incorrectly mapped to "Service is not available."
    expect(UNASSIGNED_SERVICE_SELECT.split(",").map((s) => s.trim())).not.toContain(
      "min_notice_minutes",
    );
  });

  it("loads location_id so unassigned validation can check service location eligibility", () => {
    expect(UNASSIGNED_SERVICE_SELECT).toContain("location_id");
    expect(UNASSIGNED_SERVICE_SELECT).toContain("is_active");
  });
});
