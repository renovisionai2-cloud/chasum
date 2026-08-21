import { describe, expect, it } from "vitest";
import {
  durationFromAppointmentTimes,
  durationIntegrityConflict,
  endIsoFromStartAndDuration,
  resolveBookingDuration,
} from "@/lib/booking/resolved-duration";
import {
  bookingDraftFromPartial,
  mergeBookingDraft,
} from "@/lib/booking/booking-draft";

describe("resolveBookingDuration", () => {
  it("prefers saved appointment duration over service", () => {
    const r = resolveBookingDuration({
      appointmentDurationMinutes: 20,
      serviceDurationMinutes: 10,
      overrideMinutes: 15,
    });
    expect(r).toEqual({
      minutes: 20,
      source: "appointment",
      serviceDefaultMinutes: 10,
    });
  });

  it("uses override when not editing", () => {
    const r = resolveBookingDuration({
      overrideMinutes: 25,
      serviceDurationMinutes: 10,
    });
    expect(r.minutes).toBe(25);
    expect(r.source).toBe("override");
  });

  it("uses package item then service", () => {
    expect(
      resolveBookingDuration({
        packageItemDurationMinutes: 45,
        serviceDurationMinutes: 10,
      }).minutes,
    ).toBe(45);
    expect(
      resolveBookingDuration({
        serviceDurationMinutes: 10,
      }),
    ).toEqual({
      minutes: 10,
      source: "service",
      serviceDefaultMinutes: 10,
    });
  });

  it("never silently falls back to 30", () => {
    const r = resolveBookingDuration({});
    expect(r.minutes).toBeNull();
    expect(r.source).toBe("unresolved");
  });

  it("covers common service lengths on various intervals (integrity)", () => {
    for (const minutes of [10, 15, 20, 30, 45, 60]) {
      const r = resolveBookingDuration({ serviceDurationMinutes: minutes });
      expect(r.minutes).toBe(minutes);
      expect(r.source).toBe("service");
    }
  });
});

describe("durationFromAppointmentTimes / endIso", () => {
  it("derives 10 minutes from 10:40–10:50", () => {
    const start = "2026-08-09T14:40:00.000Z";
    const end = "2026-08-09T14:50:00.000Z";
    expect(durationFromAppointmentTimes(start, end)).toBe(10);
    expect(endIsoFromStartAndDuration(start, 10)).toBe(end);
  });
});

describe("durationIntegrityConflict", () => {
  it("flags form 30 vs resolved service 10", () => {
    const resolved = resolveBookingDuration({ serviceDurationMinutes: 10 });
    expect(
      durationIntegrityConflict({
        formDurationMinutes: 30,
        resolved,
      }),
    ).toBe(true);
    expect(
      durationIntegrityConflict({
        formDurationMinutes: 10,
        resolved,
      }),
    ).toBe(false);
  });
});

describe("booking draft transfer", () => {
  it("preserves 10-minute service draft from Quick Appointment fields", () => {
    const draft = bookingDraftFromPartial({
      customerId: "c1",
      serviceId: "svc-10",
      locationId: "loc1",
      staffId: "staff1",
      date: "2026-08-09",
      startIso: "2026-08-09T14:40:00.000Z",
      durationMinutes: 10,
      durationSource: "service",
    });
    expect(draft.durationMinutes).toBe(10);
    expect(draft.serviceId).toBe("svc-10");

    const intoSheet = mergeBookingDraft(
      { serviceId: "other", durationMinutes: 30 },
      draft,
    );
    expect(intoSheet.serviceId).toBe("svc-10");
    expect(intoSheet.durationMinutes).toBe(10);
    expect(intoSheet.startIso).toBe("2026-08-09T14:40:00.000Z");
  });

  it("transfers custom overridden duration", () => {
    const draft = bookingDraftFromPartial({
      serviceId: "svc-10",
      durationMinutes: 20,
      durationSource: "override",
      durationIsOverride: true,
    });
    expect(draft.durationMinutes).toBe(20);
    expect(draft.durationIsOverride).toBe(true);
  });
});
