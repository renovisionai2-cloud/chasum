import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatMoneyCents, formatMoneyDollars } from "@/lib/commerce/money";
import {
  appointmentCollectionAction,
  appointmentOffersCollection,
  collectibleRemainingBalanceCents,
} from "@/lib/commerce/money-contract";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/booking";
import { appointmentStatusLabel } from "@/lib/dashboard/appointment-ops";
import { appointmentPriceCents } from "@/lib/commerce/recognize";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

const anaPaid = {
  price_cents: 22000,
  tax_cents: 2860,
  amount_paid_cents: 24860,
  amount_refunded_cents: 0,
  deposit_cents: 5000,
  payment_status: "fully_paid",
  status: "confirmed",
};

const anaPartial = {
  ...anaPaid,
  amount_paid_cents: 5000,
  payment_status: "deposit_paid",
};

describe("Phase 6.1C collection chrome", () => {
  it("hides Collect when collectible remaining is 0", () => {
    expect(collectibleRemainingBalanceCents(anaPaid)).toBe(0);
    expect(appointmentOffersCollection(anaPaid)).toBe(false);
    expect(appointmentCollectionAction(anaPaid)).toBe("paid_in_full");
  });

  it("keeps Collect when a partial balance remains", () => {
    expect(collectibleRemainingBalanceCents(anaPartial)).toBe(19860);
    expect(appointmentOffersCollection(anaPartial)).toBe(true);
    expect(appointmentCollectionAction(anaPartial)).toBe("collect");
  });

  it("does not label cancelled visits as paid in full", () => {
    expect(
      appointmentCollectionAction({ ...anaPartial, status: "cancelled" }),
    ).toBe("none");
  });

  it("appointment-native Collect surfaces consult collection action", () => {
    expect(read("components/day-view/appointment-drawer.tsx")).toContain(
      "appointmentCollectionAction",
    );
    expect(read("components/booking-sheet/payments-section.tsx")).toContain(
      "appointmentCollectionAction",
    );
    expect(read("components/booking-sheet/booking-sheet.tsx")).toContain(
      "canCollectPayment",
    );
    expect(read("components/crm/customer-quick-actions.tsx")).toContain(
      "hasOutstanding",
    );
  });
});

describe("Phase 6.1C customer money cents", () => {
  it("formats 24860 cents as CA$248.60, never CA$249", () => {
    const label = formatMoneyCents(24860, "cad");
    expect(label).toContain("248.60");
    expect(label).not.toContain("249");
    expect(formatMoneyDollars(248.6, "cad")).toContain("248.60");
  });

  it("Reports customers money formatter preserves cents", () => {
    const hub = read("components/reports/reports-hub.tsx");
    expect(hub).toContain("formatMoneyDollars");
    expect(hub).not.toContain("maximumFractionDigits: 0");
  });
});

describe("Phase 6.1C booked vs confirmed presentation", () => {
  it("maps stored confirmed to staff-facing Booked without changing the enum", () => {
    expect(APPOINTMENT_STATUS_LABELS.confirmed).toBe("Booked");
    expect(appointmentStatusLabel("confirmed")).toBe("Booked");
    expect(appointmentStatusLabel("pending")).toBe("Pending");
    expect(read("lib/types/booking.ts")).toMatch(/"confirmed"/);
  });

  it("quick-view activity uses the presentation label, not raw confirmed", () => {
    const drawer = read("components/day-view/appointment-drawer.tsx");
    expect(drawer).toContain("appointmentStatusLabel(appointment.status)");
    expect(drawer).not.toContain("appointment.status.replace");
  });
});

describe("Phase 6.1C collect copy and money semantics", () => {
  it("removes developer internal-ID copy from Collect Payment", () => {
    const src = read("components/commerce/collect-payment-workspace.tsx");
    expect(src).toContain(
      "Select the appointment, amount, and payment method.",
    );
    expect(src).not.toContain("No internal IDs");
  });

  it("preserves Ana gross vs recognized vs tax stamps", () => {
    expect(appointmentPriceCents(anaPaid)).toBe(22000);
    expect(anaPaid.tax_cents).toBe(2860);
    expect(anaPaid.amount_paid_cents).toBe(24860);
    expect(anaPaid.amount_paid_cents).not.toBe(appointmentPriceCents(anaPaid));
  });
});
