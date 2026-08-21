import { describe, expect, it } from "vitest";
import {
  allocateResources,
  maxConcurrentByResources,
  type BookingResource,
  type ServiceResourceRequirement,
} from "@/lib/booking/resources";
import { calendarDateInTimezone } from "@/lib/business/datetime";
import { bookingModeFromContext } from "@/lib/booking/booking-mode";

function room(id: string, name: string, capacity = 1): BookingResource {
  return {
    id,
    businessId: "b1",
    locationId: "loc1",
    name,
    type: "room",
    description: null,
    isActive: true,
    capacity,
    color: null,
    sortOrder: 0,
  };
}

const haircutReq: ServiceResourceRequirement = {
  serviceId: "svc1",
  resourceType: "chair",
  quantity: 1,
  eligibleResourceIds: [],
  allowAutomaticAssignment: true,
  allowManualSelection: true,
  allowAssignLater: false,
};

describe("resource allocation", () => {
  it("allows five simultaneous when five chairs free", () => {
    expect(
      maxConcurrentByResources({
        eligibleEmployeeCount: 5,
        freeResourceCapacity: 5,
      }),
    ).toBe(5);
  });

  it("limits by scarcer resource (4 staff, 2 rooms → 2)", () => {
    expect(
      maxConcurrentByResources({
        eligibleEmployeeCount: 4,
        freeResourceCapacity: 2,
      }),
    ).toBe(2);
  });

  it("rejects when required room is busy", () => {
    const rooms = [room("r1", "Ultrasound Room A"), room("r2", "Ultrasound Room B")];
    const req: ServiceResourceRequirement = {
      ...haircutReq,
      resourceType: "room",
      eligibleResourceIds: ["r1"],
    };
    const result = allocateResources({
      startIso: "2026-08-08T14:50:00.000Z",
      endIso: "2026-08-08T15:00:00.000Z",
      requirements: [req],
      resources: rooms,
      busy: [
        {
          resourceId: "r1",
          startIso: "2026-08-08T14:45:00.000Z",
          endIso: "2026-08-08T15:05:00.000Z",
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("automatically assigns an eligible free room", () => {
    const rooms = [room("r1", "Room A"), room("r2", "Room B")];
    const req: ServiceResourceRequirement = {
      ...haircutReq,
      resourceType: "room",
    };
    const result = allocateResources({
      startIso: "2026-08-08T14:50:00.000Z",
      endIso: "2026-08-08T15:00:00.000Z",
      requirements: [req],
      resources: rooms,
      busy: [
        {
          resourceId: "r1",
          startIso: "2026-08-08T14:50:00.000Z",
          endIso: "2026-08-08T15:00:00.000Z",
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.assignments[0]?.resourceId).toBe("r2");
    }
  });

  it("supports capacity > 1 for group rooms", () => {
    const studio = room("s1", "Group Studio", 3);
    const req: ServiceResourceRequirement = {
      ...haircutReq,
      resourceType: "room",
      quantity: 1,
    };
    const result = allocateResources({
      startIso: "2026-08-08T14:00:00.000Z",
      endIso: "2026-08-08T15:00:00.000Z",
      requirements: [req],
      resources: [studio],
      busy: [
        {
          resourceId: "s1",
          startIso: "2026-08-08T14:00:00.000Z",
          endIso: "2026-08-08T15:00:00.000Z",
          capacityUsed: 2,
        },
      ],
    });
    expect(result.ok).toBe(true);
  });
});

describe("calendarDateInTimezone", () => {
  it("keeps Toronto evening as the same calendar day", () => {
    // 10:50 AM Eastern on Aug 8 2026 = 14:50 UTC
    const iso = "2026-08-08T14:50:00.000Z";
    expect(calendarDateInTimezone(iso, "America/Toronto")).toBe("2026-08-08");
    expect(calendarDateInTimezone(iso, "America/New_York")).toBe("2026-08-08");
  });
});

describe("bookingModeFromContext", () => {
  it("separates confirmed, edit, and draft", () => {
    expect(
      bookingModeFromContext({ confirmedAppointmentId: "a1" }),
    ).toBe("confirmed");
    expect(bookingModeFromContext({ appointmentId: "a1" })).toBe("edit");
    expect(bookingModeFromContext({ hasUnsavedDraft: true })).toBe("draft");
    expect(bookingModeFromContext({})).toBe("new");
  });
});
