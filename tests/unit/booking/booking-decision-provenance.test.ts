import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  bookingDecisionAccess,
  bookingFactsFromValues,
  firstMissingDecision,
  isIntentionallyResolved,
  nextRequiredDecision,
  type BookingDecisionProvenance,
} from "@/components/booking-sheet/booking-workflow";

const empty = bookingFactsFromValues({
  customerId: null,
  serviceId: "",
  needsNamedEmployee: true,
  date: "2026-08-08",
  slot: null,
  slotValid: false,
  paymentAcknowledged: false,
  success: false,
  customerResolved: false,
  serviceResolved: false,
  employeeResolved: false,
  datetimeResolved: false,
});

describe("Booking decision provenance", () => {
  it("value presence does not automatically equal resolved", () => {
    expect(isIntentionallyResolved("preference", true)).toBe(false);
    expect(isIntentionallyResolved("default", true)).toBe(false);
    expect(isIntentionallyResolved("none", true)).toBe(false);
    expect(isIntentionallyResolved("user_selected", true)).toBe(true);
    expect(isIntentionallyResolved("entry_context", true)).toBe(true);
    expect(isIntentionallyResolved("valid_draft", true)).toBe(true);
    expect(isIntentionallyResolved("user_selected", false)).toBe(false);
  });

  it("distinguishes intentional entry context from stale preference provenance", () => {
    const resolving: BookingDecisionProvenance[] = [
      "user_selected",
      "entry_context",
      "valid_draft",
      "appointment",
    ];
    const nonResolving: BookingDecisionProvenance[] = [
      "preference",
      "default",
      "none",
    ];
    for (const p of resolving) {
      expect(isIntentionallyResolved(p, true)).toBe(true);
    }
    for (const p of nonResolving) {
      expect(isIntentionallyResolved(p, true)).toBe(false);
    }
  });

  it("PO video: after customer only, next required is Service — not Date & time", () => {
    const afterAna = bookingFactsFromValues({
      ...empty,
      customerId: "ana",
      customerResolved: true,
      // Stale/preference-shaped values must NOT count as resolved.
      serviceId: "svc-from-prefs",
      serviceResolved: false,
      needsNamedEmployee: false,
      employeeResolved: false,
    });
    expect(firstMissingDecision(afterAna)).toBe("service");
    expect(nextRequiredDecision(afterAna)).toBe("service");
    expect(bookingDecisionAccess("datetime", afterAna).accessible).toBe(false);
    expect(bookingDecisionAccess("payment", afterAna).accessible).toBe(false);
    expect(bookingDecisionAccess("review", afterAna).accessible).toBe(false);
  });

  it("Customer → Service → Employee → Date & time → Payment → Review", () => {
    let facts = bookingFactsFromValues({
      ...empty,
      customerId: "ana",
      customerResolved: true,
    });
    expect(firstMissingDecision(facts)).toBe("service");

    facts = {
      ...facts,
      serviceId: "premium",
      serviceResolved: true,
      needsNamedEmployee: true,
      employeeResolved: false,
    };
    expect(firstMissingDecision(facts)).toBe("employee");
    expect(bookingDecisionAccess("datetime", facts).accessible).toBe(false);

    facts = {
      ...facts,
      needsNamedEmployee: false,
      employeeResolved: true,
    };
    expect(firstMissingDecision(facts)).toBe("datetime");
    expect(bookingDecisionAccess("payment", facts).accessible).toBe(false);

    facts = {
      ...facts,
      slot: "2026-08-07T19:30:00.000Z",
      slotValid: true,
      datetimeResolved: true,
    };
    expect(firstMissingDecision(facts)).toBe("payment");
    expect(bookingDecisionAccess("review", facts).accessible).toBe(false);

    facts = { ...facts, paymentAcknowledged: true };
    expect(firstMissingDecision(facts)).toBe("review");
    expect(bookingDecisionAccess("review", facts).accessible).toBe(true);
  });

  it("missing Service blocks Date & time forward progression", () => {
    const facts = bookingFactsFromValues({
      ...empty,
      customerId: "c1",
      customerResolved: true,
      employeeResolved: true,
      needsNamedEmployee: false,
    });
    expect(bookingDecisionAccess("datetime", facts)).toEqual({
      accessible: false,
      reason: "Choose a service first",
    });
  });

  it("missing Employee blocks Date & time", () => {
    const facts = bookingFactsFromValues({
      ...empty,
      customerId: "c1",
      customerResolved: true,
      serviceId: "s1",
      serviceResolved: true,
      needsNamedEmployee: true,
      employeeResolved: false,
    });
    expect(bookingDecisionAccess("datetime", facts)).toEqual({
      accessible: false,
      reason: "Choose an employee first",
    });
  });

  it("incomplete appointment blocks Payment and Review", () => {
    const noTime = bookingFactsFromValues({
      ...empty,
      customerId: "c1",
      customerResolved: true,
      serviceId: "s1",
      serviceResolved: true,
      needsNamedEmployee: false,
      employeeResolved: true,
    });
    expect(bookingDecisionAccess("payment", noTime).accessible).toBe(false);
    expect(bookingDecisionAccess("review", noTime).accessible).toBe(false);

    const unpaid = {
      ...noTime,
      slot: "2026-08-08T13:00:00.000Z",
      slotValid: true,
      datetimeResolved: true,
    };
    expect(bookingDecisionAccess("payment", unpaid).accessible).toBe(true);
    expect(bookingDecisionAccess("review", unpaid).accessible).toBe(false);
  });

  it("intentional CRM customer prefill counts as resolved", () => {
    const facts = bookingFactsFromValues({
      ...empty,
      customerId: "ana",
      customerResolved: true,
    });
    expect(firstMissingDecision(facts)).toBe("service");
    expect(bookingDecisionAccess("service", facts).accessible).toBe(true);
  });

  it("intentional calendar context can remain resolved", () => {
    const facts = bookingFactsFromValues({
      ...empty,
      customerId: "c1",
      customerResolved: true,
      serviceId: "s1",
      serviceResolved: true,
      needsNamedEmployee: false,
      employeeResolved: true,
      slot: "2026-08-08T15:00:00.000Z",
      slotValid: true,
      datetimeResolved: true,
    });
    expect(firstMissingDecision(facts)).toBe("payment");
    expect(bookingDecisionAccess("datetime", facts).accessible).toBe(true);
  });

  it("stale/default values do not count as intentional resolution", () => {
    const facts = bookingFactsFromValues({
      customerId: "c1",
      serviceId: "stale-svc",
      needsNamedEmployee: false,
      date: "2026-08-08",
      slot: "2026-08-08T13:00:00.000Z",
      slotValid: true,
      paymentAcknowledged: false,
      success: false,
      customerResolved: true,
      serviceResolved: false,
      employeeResolved: false,
      datetimeResolved: false,
    });
    expect(firstMissingDecision(facts)).toBe("service");
    expect(bookingDecisionAccess("datetime", facts).accessible).toBe(false);
  });
});

describe("Booking provenance contracts (sheet)", () => {
  const root = process.cwd();
  const booking = readFileSync(
    join(root, "components/booking-sheet/booking-sheet.tsx"),
    "utf8",
  );
  const strip = readFileSync(
    join(root, "components/booking-sheet/booking-summary-strip.tsx"),
    "utf8",
  );
  const button = readFileSync(join(root, "components/ui/button.tsx"), "utf8");

  it("does not hydrate service/staff from reception prefs into resolving create state", () => {
    expect(booking).toContain("NOT intentional resolution");
    expect(booking).not.toMatch(
      /prefs\.serviceId[\s\S]{0,80}locationServices\.some/,
    );
    expect(booking).not.toMatch(/prefs\.staffId && eligible/);
    expect(booking).toContain("isIntentionallyResolved");
    expect(booking).toContain("serviceProvenance");
    expect(booking).toContain("staffProvenance");
    expect(booking).toContain('setServiceProvenance("user_selected")');
    expect(booking).toContain('setStaffProvenance("user_selected")');
  });

  it("Book Another clears decision provenance/state", () => {
    const start = booking.indexOf("onBookAnother={() => {");
    const end = booking.indexOf("onDone={onClose}", start);
    const block = booking.slice(start, end);
    expect(block).toContain('setCustomerProvenance("none")');
    expect(block).toContain('setServiceProvenance("none")');
    expect(block).toContain('setStaffProvenance("none")');
    expect(block).toContain('setDatetimeProvenance("none")');
    expect(block).toContain('setServiceId("")');
    expect(block).toContain("setSelectedCustomer(null)");
  });

  it("Change control uses subtle interactive styling before hover", () => {
    expect(button).toContain('subtle:');
    expect(strip).toContain('variant="subtle"');
    expect(strip).toContain("Change");
    expect(strip).not.toMatch(/variant="ghost"[\s\S]{0,80}Change/);
  });

  it("known progress checkmarks use intentional resolution flags", () => {
    expect(booking).toContain("customer: customerResolved");
    expect(booking).toContain("service: serviceResolved");
    expect(booking).toContain("employee: employeeResolved");
    expect(booking).toContain("datetime: datetimeResolved");
  });
});
