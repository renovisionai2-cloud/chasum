import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { deriveAppointmentPaymentStatus } from "@/lib/commerce/mappers";
import {
  appointmentCollectibleMoneyFromStamps,
  appointmentCollectionAction,
  appointmentCollectionFacingLabel,
  collectibleRemainingBalanceCents,
  remainingBalanceCents,
} from "@/lib/commerce/money-contract";
import { mapFrontDeskAppointment, ledgerReasonLabel } from "@/lib/commerce/front-desk";
import {
  composeRefundReason,
  validateStoredRefundReason,
} from "@/lib/commerce/refund-reason";
import {
  countDailyStatuses,
  paymentCollectionLabel,
  paymentReadinessFromStamps,
} from "@/lib/dashboard/appointment-ops";
import { planningAttentionLabel } from "@/lib/calendar/planning-density";
import { businessRefundNotificationAction } from "@/lib/notifications/refund-notification-action";
import { recordedDeliveryStatus } from "@/lib/commerce/document-delivery-truth";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

/** Chase Dindial Ultimate 2 Visit Package — verified Preview fixture. */
const chaseFullyPaidThenVoluntaryRefund = {
  price_cents: 29900,
  tax_cents: 3887,
  amount_paid_cents: 33787,
  amount_refunded_cents: 5000,
  deposit_cents: 5000,
  payment_status: "partially_paid",
  status: "confirmed",
};

const partialUnpaid = {
  price_cents: 29900,
  tax_cents: 3887,
  amount_paid_cents: 5000,
  amount_refunded_cents: 0,
  deposit_cents: 5000,
  payment_status: "deposit_paid",
  status: "confirmed",
};

const cancelledUnpaid = {
  ...partialUnpaid,
  amount_paid_cents: 0,
  payment_status: "unpaid",
  status: "cancelled",
};

describe("Phase 6.2B final PO correction — collectibility", () => {
  it("fully paid $337.87 + voluntary $50 refund: gross/refund/net audit, collectible $0", () => {
    const money = appointmentCollectibleMoneyFromStamps(
      chaseFullyPaidThenVoluntaryRefund,
    );
    expect(money.grossPaidCents).toBe(33787);
    expect(money.refundedCents).toBe(5000);
    expect(money.netPaidCents).toBe(28787);
    expect(remainingBalanceCents(chaseFullyPaidThenVoluntaryRefund)).toBe(5000);
    expect(money.collectibleRemainingBalanceCents).toBe(0);
    expect(collectibleRemainingBalanceCents(chaseFullyPaidThenVoluntaryRefund)).toBe(
      0,
    );
    expect(money.collectibleDepositDueNowCents).toBe(0);
    expect(appointmentCollectionAction(chaseFullyPaidThenVoluntaryRefund)).toBe(
      "paid_in_full",
    );
    expect(
      appointmentCollectionFacingLabel(chaseFullyPaidThenVoluntaryRefund),
    ).toBe("Partially refunded");
    expect(
      appointmentCollectionFacingLabel(chaseFullyPaidThenVoluntaryRefund),
    ).not.toBe("Outstanding balance");
    expect(
      deriveAppointmentPaymentStatus({
        priceCents: 33787,
        depositRequiredCents: 5000,
        amountPaidCents: 33787,
        amountRefundedCents: 5000,
      }),
    ).toBe("fully_paid");
  });

  it("does not generate outstanding-payment attention from the voluntary refund", () => {
    expect(
      paymentReadinessFromStamps(chaseFullyPaidThenVoluntaryRefund),
    ).toBe("paid");
    expect(
      paymentCollectionLabel({
        status: chaseFullyPaidThenVoluntaryRefund.status,
        paymentStatus: chaseFullyPaidThenVoluntaryRefund.payment_status,
        price_cents: chaseFullyPaidThenVoluntaryRefund.price_cents,
        tax_cents: chaseFullyPaidThenVoluntaryRefund.tax_cents,
        amount_paid_cents: chaseFullyPaidThenVoluntaryRefund.amount_paid_cents,
        amount_refunded_cents:
          chaseFullyPaidThenVoluntaryRefund.amount_refunded_cents,
      }),
    ).toBe("Paid");
    expect(
      planningAttentionLabel({
        status: chaseFullyPaidThenVoluntaryRefund.status,
        paymentStatus: chaseFullyPaidThenVoluntaryRefund.payment_status,
        price_cents: chaseFullyPaidThenVoluntaryRefund.price_cents,
        tax_cents: chaseFullyPaidThenVoluntaryRefund.tax_cents,
        amount_paid_cents: chaseFullyPaidThenVoluntaryRefund.amount_paid_cents,
        amount_refunded_cents:
          chaseFullyPaidThenVoluntaryRefund.amount_refunded_cents,
      }),
    ).toBeNull();
    const counts = countDailyStatuses([chaseFullyPaidThenVoluntaryRefund]);
    expect(counts.paymentAttention).toBe(0);
    const frontDesk = mapFrontDeskAppointment({
      id: "chase",
      customerId: "cust-chase",
      customerName: "Chase Dindial",
      serviceName: "Ultimate 2 Visit Package",
      startTime: "2026-08-19T13:45:00.000Z",
      timeZone: "America/Toronto",
      appointmentStatus: "confirmed",
      stamps: chaseFullyPaidThenVoluntaryRefund,
    });
    expect(frontDesk.remainingCents).toBe(0);
    expect(frontDesk.paymentStatusLabel).toBe("Partially refunded");
  });

  it("partial payment without refund remains collectible", () => {
    expect(collectibleRemainingBalanceCents(partialUnpaid)).toBe(28787);
    expect(appointmentCollectionAction(partialUnpaid)).toBe("collect");
    expect(appointmentCollectionFacingLabel(partialUnpaid)).toBe("Deposit paid");
    expect(paymentReadinessFromStamps(partialUnpaid)).toBe("balance_due");
    expect(
      paymentCollectionLabel({
        status: partialUnpaid.status,
        paymentStatus: partialUnpaid.payment_status,
        ...partialUnpaid,
      }),
    ).toBe("Balance due");
  });

  it("cancelled appointment collectibility remains 0", () => {
    expect(collectibleRemainingBalanceCents(cancelledUnpaid)).toBe(0);
    expect(appointmentCollectionAction(cancelledUnpaid)).toBe("none");
    expect(
      planningAttentionLabel({
        status: "cancelled",
        paymentStatus: "unpaid",
      }),
    ).toBeNull();
  });

  it("operating surfaces derive remaining from collectible remaining, not total − net", () => {
    const drawer = read("components/day-view/appointment-drawer.tsx");
    expect(drawer).toContain("collectibleRemainingBalanceCents");
    expect(drawer).toContain("appointmentCollectionFacingLabel");
    expect(drawer).not.toMatch(
      /remaining\s*=\s*Math\.max\(0,\s*appointmentTotal\s*-\s*netPaid\)/,
    );
    const sheet = read("components/booking-sheet/booking-sheet.tsx");
    expect(sheet).toContain("collectibleRemainingBalanceCents");
    expect(sheet).toContain("appointmentCollectionFacingLabel");
    const panel = read("components/booking-sheet/payments-section.tsx");
    expect(panel).toContain("collectibleRemainingBalanceCents");
    expect(panel).toContain("appointmentCollectionFacingLabel");
    const ops = read("lib/dashboard/appointment-ops.ts");
    expect(ops).toContain("paymentReadinessFromStamps");
    const payments = read("lib/commerce/payments.ts");
    expect(payments).toContain("collectibleRemainingBalanceCents");
    const brief = read("lib/actions/morning-brief.ts");
    expect(brief).toContain("paymentReadinessFromStamps");
  });
});

describe("Phase 6.2B final PO correction — business refund first send", () => {
  it("existing refund with no business-email attempt exposes Send, not silent Not requested", () => {
    const action = businessRefundNotificationAction({
      refundExists: true,
      status: "not_requested",
      hasRecipient: true,
      emailConfigured: true,
    });
    expect(action.canRetry).toBe(true);
    expect(action.actionLabel).toBe("Send business refund notification");
    const comms = read("components/booking-sheet/booking-communications-section.tsx");
    expect(comms).toContain("Send business refund notification");
    const delivery = read("lib/notifications/booking-delivery.ts");
    expect(delivery).toContain("businessRefundNotificationAction");
  });

  it("failed business refund email is not Sent and remains retryable", () => {
    const action = businessRefundNotificationAction({
      refundExists: true,
      status: "failed",
      hasRecipient: true,
      emailConfigured: true,
    });
    expect(action.canRetry).toBe(true);
    expect(action.actionLabel).toBe("Resend business refund notification");
    expect(
      recordedDeliveryStatus({
        hasRecipient: true,
        logStatus: "failed",
      }),
    ).toBe("failed");
  });

  it("already-sent business refund notification does not auto-send; resend is explicit", () => {
    const action = businessRefundNotificationAction({
      refundExists: true,
      status: "sent",
      hasRecipient: true,
      emailConfigured: true,
    });
    expect(action.canRetry).toBe(true);
    expect(action.actionLabel).toBe("Resend business refund notification");
    const refundEmail = read("lib/commerce/refund-email.ts");
    expect(refundEmail).toContain("forceResend");
    expect(refundEmail).toMatch(
      /!input\.forceResend[\s\S]*business_email_status[\s\S]*Already sent/,
    );
    const delivery = read("lib/notifications/booking-delivery.ts");
    expect(delivery).toContain("forceResend: true");
  });
});

describe("Phase 6.2B final PO correction — historical reason na", () => {
  it("may render historical Reason: na and still rejects na for new refunds", () => {
    expect(ledgerReasonLabel("Reason: na")).toBe("na");
    expect(validateStoredRefundReason("na").ok).toBe(false);
    expect(composeRefundReason({ code: "na" }).ok).toBe(false);
    expect(composeRefundReason({ code: "other", detail: "na" }).ok).toBe(false);
  });
});
