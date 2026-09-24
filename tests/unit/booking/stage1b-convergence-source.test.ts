import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Issue #81 Stage 1B application convergence", () => {
  it("public Service discovery loads service_locations and uses offered-at truth", () => {
    const text = source("lib/actions/services.ts");
    const section = text.slice(text.indexOf("export async function getPublicServices"));
    expect(section).toContain("service_locations(location_id)");
    expect(section).toContain("isServiceOfferedAtLocation(service, locationId)");
  });

  it("public Staff discovery loads staff_locations and filters online-bookable Staff", () => {
    const text = source("lib/actions/staff.ts");
    const section = text.slice(text.indexOf("export async function getPublicStaff"));
    expect(section).toContain("staff_locations(location_id)");
    expect(section).toContain('.eq("accept_online_bookings", true)');
    expect(section).toContain("filterEligibleBookingStaff");
  });

  it("public booking UI uses the same Service and Staff location predicates", () => {
    const text = source("components/booking/public-booking-page.tsx");
    expect(text).toContain("isServiceOfferedAtLocation(service, selectedLocation.id)");
    expect(text).toContain("isStaffEligibleForLocation(member, selectedLocation.id)");
  });

  it("public slot generation re-resolves Staff server-side instead of trusting browser relationships", () => {
    const text = source("lib/actions/public-booking.ts");
    const section = text.slice(
      text.indexOf("export async function getPublicSlotOptions"),
      text.indexOf("export async function lookupPublicCustomer"),
    );
    expect(section).toContain('.from("staff")');
    expect(section).toContain("staff_locations(location_id)");
    expect(section).toContain('.eq("accept_online_bookings", true)');
    expect(section).not.toMatch(/\bstaff\s*:/);
  });

  it("Booking Engine composes all three governed relationships", () => {
    const text = source("lib/booking-engine/availability/compose.ts");
    expect(text).toContain('.from("service_locations")');
    expect(text).toContain('.from("staff_locations")');
    expect(text).toContain('.from("staff_services")');
    expect(text).toContain("This service is not offered at the selected location.");
    expect(text).toContain("This employee does not work at the selected location.");
    expect(text).toContain("Employee is not assigned to this service.");
  });

  it("Reception filters Business-wide Staff before applying the brief cap", () => {
    const text = source("lib/actions/reception.ts");
    expect(text).toContain("filterEligibleBookingStaff");
    expect(text).toContain("}).slice(0, 5)");
    expect(text).not.toContain('.eq("location_id", locationId)\n      .eq("is_active", true)\n      .limit(5)');
  });

  it("optional/unassigned Staff persistence remains disabled", () => {
    const text = source("lib/actions/public-booking.ts");
    expect(text).toContain('assertNamedStaffRequired(null, "public")');
  });

  it("operator Employee and Service assignment readers preserve secondary relationship truth", () => {
    const employeesPage = source("app/(dashboard)/dashboard/employees/page.tsx");
    const employeeProfilePage = source("app/(dashboard)/dashboard/employees/[id]/page.tsx");
    const staffActions = source("lib/actions/staff.ts");

    expect(employeesPage).toContain("getOperatorServiceCatalog");
    expect(employeeProfilePage).toContain("getOperatorServiceCatalog");

    const assignmentSection = staffActions.slice(
      staffActions.indexOf("export async function getStaffForAssignment"),
      staffActions.indexOf("async function resolveStaffLocationId"),
    );
    expect(assignmentSection).toContain("staff_locations(location_id)");
    expect(assignmentSection).toContain("filterStaffByLocationScope");
    expect(assignmentSection).not.toContain("withLocationFilter(query, scope)");
  });

  it("public booking explains location relationship gaps instead of presenting impossible choices", () => {
    const text = source("components/booking/public-booking-page.tsx");
    expect(text).toContain("No online services are offered at this location yet.");
    expect(text).toContain("No bookable staff are assigned to this service at this location.");
    expect(text).toContain("availableStaff.length === 0");
  });


  it("never treats missing Staff location truth as permission to work everywhere", () => {
    const text = source("lib/actions/staff.ts");
    const section = text.slice(
      text.indexOf("function filterStaffByLocationScope"),
      text.indexOf("export async function getEligibleStaffForBooking"),
    );
    expect(section).toContain("member.location_id === locationId");
    expect(section).toContain("staff_locations");
    expect(section).not.toContain("member.location_id == null");
    expect(section).not.toContain('member.location_id === ""');
  });

});
