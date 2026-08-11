import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BOOKING_ADAPTER_STATUS,
  BookingFacade,
  apiCreateIntent,
  explainConflict,
  explanationForCode,
  isUnmappedConflict,
  mapRpcErrorToConflict,
  publicCreateIntent,
  publicPreviewInput,
  receptionCreateIntent,
  receptionPreviewInput,
  staffCreateIntent,
  summerCreateIntent,
  summerPreviewInput,
  type BookingChannel,
  type BookingIntent,
  type PreviewSlotsInput,
  type SlotCandidate,
} from "@/lib/booking-engine";

const root = process.cwd();

describe("Chapter 5 Phase 5.0 — BookingFacade contracts", () => {
  it("exposes the canonical facade methods", () => {
    expect(typeof BookingFacade.previewSlots).toBe("function");
    expect(typeof BookingFacade.create).toBe("function");
    expect(typeof BookingFacade.update).toBe("function");
    expect(typeof BookingFacade.reschedule).toBe("function");
    expect(typeof BookingFacade.resize).toBe("function");
    expect(typeof BookingFacade.cancel).toBe("function");
    expect(typeof BookingFacade.validate).toBe("function");
    expect(typeof BookingFacade.composeContext).toBe("function");
  });

  it("BookingIntent requires an explicit channel", () => {
    const intent: BookingIntent = {
      channel: "staff",
      businessId: "b1",
      locationId: "l1",
      serviceId: "s1",
      staffId: "e1",
      customerId: "c1",
      requestedStart: "2026-08-10T15:00:00.000Z",
    };
    expect(intent.channel).toBe("staff");
    const channels: BookingChannel[] = [
      "staff",
      "reception",
      "public",
      "summer",
      "api",
    ];
    expect(channels).toContain(intent.channel);
  });

  it("channel adapters stamp the correct channel", () => {
    const base = {
      businessId: "b1",
      locationId: "l1",
      serviceId: "s1",
      staffId: "e1",
      requestedStart: "2026-08-10T15:00:00.000Z",
    };
    expect(staffCreateIntent(base).channel).toBe("staff");
    expect(receptionCreateIntent(base).channel).toBe("reception");
    expect(publicCreateIntent(base).channel).toBe("public");
    expect(summerCreateIntent(base).channel).toBe("summer");
    expect(apiCreateIntent(base).channel).toBe("api");
  });

  it("marks adapter maturity ACTIVE / PARTIAL / FUTURE", () => {
    expect(BOOKING_ADAPTER_STATUS.staff).toBe("ACTIVE");
    expect(BOOKING_ADAPTER_STATUS.reception).toBe("PARTIAL");
    expect(BOOKING_ADAPTER_STATUS.public).toBe("PARTIAL");
    expect(BOOKING_ADAPTER_STATUS.summer).toBe("ACTIVE");
    expect(BOOKING_ADAPTER_STATUS.api).toBe("PARTIAL");
  });

  it("preview input adapters never invent rules — only set channel", () => {
    const preview: Omit<PreviewSlotsInput, "channel"> = {
      businessId: "b1",
      locationId: "l1",
      serviceId: "s1",
      staffId: "e1",
      date: "2026-08-10",
    };
    expect(publicPreviewInput(preview)).toEqual({
      ...preview,
      channel: "public",
    });
    expect(receptionPreviewInput(preview).channel).toBe("reception");
    expect(summerPreviewInput(preview).channel).toBe("summer");
  });

  it("SlotCandidate is a stable UI-facing shape", () => {
    const slot: SlotCandidate = {
      start: "2026-08-10T15:00:00.000Z",
      end: "2026-08-10T15:30:00.000Z",
      staffId: "e1",
      locationId: "l1",
      serviceId: "s1",
      resourceIds: [],
      score: 80,
      reason: "AVAILABLE",
      warnings: [],
    };
    expect(slot.resourceIds).toEqual([]);
    expect(slot.reason).toBe("AVAILABLE");
  });

  it("maps structured RPC conflicts and keeps unmapped truthful", () => {
    expect(mapRpcErrorToConflict("overlaps an existing appointment").code).toBe(
      "STAFF_BUSY",
    );
    expect(mapRpcErrorToConflict("Staff on vacation").code).toBe("VACATION");
    expect(mapRpcErrorToConflict("lunch break conflict").code).toBe(
      "LUNCH_BLOCK",
    );
    const unmapped = mapRpcErrorToConflict("weird backend failure xyz");
    expect(unmapped.code).toBe("UNMAPPED");
    expect(isUnmappedConflict(unmapped)).toBe(true);
    expect(unmapped.details?.raw).toBe("weird backend failure xyz");
  });

  it("conflict explanation uses actual codes without inventing", () => {
    expect(
      explainConflict({
        code: "STAFF_BUSY",
        message: "This employee is already booked at that time.",
        severity: "error",
        recoverable: true,
      }),
    ).toBe("This employee is already booked at that time.");
    expect(explanationForCode("VACATION")).toMatch(/vacation/i);
    expect(
      explainConflict({
        code: "UNMAPPED",
        message: "weird backend failure xyz",
        severity: "error",
        recoverable: true,
      }),
    ).toBe("weird backend failure xyz");
  });

  it("facade previewSlots / create / reschedule / resize delegate to engine (no TS slot math)", () => {
    const facade = readFileSync(
      join(root, "lib/booking-engine/facade.ts"),
      "utf8",
    );
    const query = readFileSync(
      join(root, "lib/booking-engine/availability/query.ts"),
      "utf8",
    );
    expect(facade).toContain("previewSlots: previewAvailableSlots");
    expect(facade).toContain("create: createBooking");
    expect(facade).toContain("reschedule: rescheduleBooking");
    expect(facade).toContain("resize: resizeBooking");
    expect(facade).toContain("cancel: cancelBooking");
    expect(query).toContain('rpc("get_available_slots"');
    expect(query).toContain('rpc("validate_appointment_slot"');
    // No local slot-generation loops inventing starts.
    expect(query).not.toMatch(/for\s*\([^)]*interval[^)]*\)\s*\{[^}]*push/);
  });

  it("Summer adapter cannot bypass BookingFacade", () => {
    const summer = readFileSync(
      join(root, "lib/booking-engine/adapters/summer.ts"),
      "utf8",
    );
    expect(summer).toContain("BookingFacade.create");
    expect(summer).toContain("BookingFacade.previewSlots");
    expect(summer).not.toContain('from("appointments")');
    expect(summer).not.toContain(".rpc(");
  });

  it("public adapter does not invent booking rules", () => {
    const pub = readFileSync(
      join(root, "lib/booking-engine/adapters/public.ts"),
      "utf8",
    );
    expect(pub).toContain('channel: "public"');
    expect(pub).not.toContain("get_available_slots");
    expect(pub).not.toContain("duration");
  });

  it("does not introduce a migration/schema dependency in Phase 5.0 facade", () => {
    const facade = readFileSync(
      join(root, "lib/booking-engine/facade.ts"),
      "utf8",
    );
    expect(facade).not.toMatch(/034|035|036|migrate/i);
  });
});
