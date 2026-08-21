import { describe, expect, it } from "vitest";
import {
  OPTIONAL_STAFF_PERSISTENCE_ENABLED,
  RECEPTION_EMPLOYEE_REQUIRED_MESSAGE,
  assertNamedStaffRequired,
  isUnassignedStaffSelection,
} from "@/lib/booking/optional-staff";

describe("optional staff capability", () => {
  it("treats empty and unassigned as unassigned selections", () => {
    expect(isUnassignedStaffSelection("")).toBe(true);
    expect(isUnassignedStaffSelection("unassigned")).toBe(true);
    expect(isUnassignedStaffSelection("  ")).toBe(true);
    expect(isUnassignedStaffSelection("staff-1")).toBe(false);
  });

  it("blocks unassigned persistence with a user-friendly message while 034 is off", () => {
    // Default in test/dev without env flag.
    expect(OPTIONAL_STAFF_PERSISTENCE_ENABLED).toBe(false);
    expect(assertNamedStaffRequired(null, "reception")).toBe(
      RECEPTION_EMPLOYEE_REQUIRED_MESSAGE,
    );
    expect(assertNamedStaffRequired("staff-1", "reception")).toBeNull();
    expect(assertNamedStaffRequired("", "staff")).not.toMatch(/034|schema|staff_id/i);
  });
});
