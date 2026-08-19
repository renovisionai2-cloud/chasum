import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  appointmentCollectibleMoneyFromStamps,
  appointmentCollectionAction,
  appointmentCollectionFacingLabel,
  collectibleRemainingBalanceCents,
} from "@/lib/commerce/money-contract";
import { recordedDeliveryStatus } from "@/lib/commerce/document-delivery-truth";
import {
  bookingChannelActionLabel,
  historicalApplicableChannelStatus,
  isRecordedSuccessStatus,
  isResendActionStatus,
  mapNotificationLogStatus,
} from "@/lib/notifications/booking-channel-status";
import { bookingChannelNotificationFeedback } from "@/lib/notifications/booking-notification-feedback";
import {
  businessRefundNotificationAction,
  businessRefundNotificationFeedback,
} from "@/lib/notifications/refund-notification-action";
import { formatNotificationStatus } from "@/lib/notifications/status-labels";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function loadStatusFn() {
  const src = read("lib/notifications/booking-delivery.ts");
  const start = src.indexOf(
    "export async function loadAppointmentCommunicationStatus",
  );
  const end = src.indexOf(
    "export async function failStaleNotificationJobs",
    start,
  );
  return src.slice(start, end);
}

/** Sum Dindial Elite Package — paid in full, no refund (Preview). */
const sumPaidInFull = {
  price_cents: 23600,
  tax_cents: 3068,
  amount_paid_cents: 26668,
  amount_refunded_cents: 0,
  deposit_cents: 5000,
  payment_status: "fully_paid",
  status: "confirmed",
};

/** Chase Dindial Ultimate 2 Visit Package — voluntary $50 refund. */
const chasePartiallyRefunded = {
  price_cents: 29900,
  tax_cents: 3887,
  amount_paid_cents: 33787,
  amount_refunded_cents: 5000,
  deposit_cents: 5000,
  payment_status: "partially_paid",
  status: "confirmed",
};

describe("Phase 6.2B historical communications truth", () => {
  it("booked appointment + valid customer recipient + no send record is Not recorded", () => {
    expect(historicalApplicableChannelStatus(null)).toBe("not_recorded");
    expect(historicalApplicableChannelStatus(undefined)).toBe("not_recorded");
    expect(formatNotificationStatus("not_recorded")).toBe("Not recorded");
    expect(formatNotificationStatus("not_applicable")).toBe("Not applicable");
    expect(bookingChannelActionLabel("customer_email", "not_recorded")).toBe(
      "Send confirmation",
    );
    const load = loadStatusFn();
    expect(load).toContain("historicalApplicableChannelStatus(log?.status)");
    expect(load).toContain("No customer confirmation was recorded");
    expect(load).not.toMatch(
      /customer_email[\s\S]*status: log \? mapLogStatus\(log\.status\) : "not_applicable"/,
    );
  });

  it("booked appointment + valid business recipient + no send record is Not recorded", () => {
    expect(bookingChannelActionLabel("business_email", "not_recorded")).toBe(
      "Send business notification",
    );
    const load = loadStatusFn();
    expect(load).toContain("No business confirmation was recorded");
  });

  it("assigned staff + valid email + no send record is Not recorded, not Skipped", () => {
    expect(historicalApplicableChannelStatus(null)).not.toBe("skipped");
    expect(bookingChannelActionLabel("staff_email", "not_recorded")).toBe(
      "Send staff notification",
    );
    const load = loadStatusFn();
    expect(load).toContain("No staff notification was recorded");
    expect(load).not.toContain(': "skipped"');
  });

  it("refund channels stay Not applicable when no refund exists", () => {
    const load = loadStatusFn();
    expect(load).toContain('channel: "customer_refund_email"');
    expect(load).toContain("No refund has been processed for this appointment.");
    expect(load).toContain('status: "not_applicable"');
    const action = businessRefundNotificationAction({
      refundExists: false,
      status: "not_applicable",
      hasRecipient: true,
      emailConfigured: true,
    });
    expect(action.canRetry).toBe(false);
    expect(action.actionLabel).toBeNull();
  });

  it("Sent remains Sent only from delivery truth", () => {
    expect(mapNotificationLogStatus("sent")).toBe("sent");
    expect(formatNotificationStatus("sent")).toBe("Sent");
    expect(isRecordedSuccessStatus("sent")).toBe(true);
    expect(
      recordedDeliveryStatus({
        hasRecipient: true,
        logStatus: "sent",
        rowEmailStatus: null,
      }),
    ).toBe("sent");
    expect(
      recordedDeliveryStatus({
        hasRecipient: true,
        logStatus: null,
        rowEmailStatus: null,
      }),
    ).toBe("never_sent");
    expect(historicalApplicableChannelStatus("sent")).toBe("sent");
    expect(bookingChannelActionLabel("customer_email", "sent")).toBe(
      "Resend confirmation",
    );
  });

  it("delivered, queued, skipped-by-policy, and failed stay distinct", () => {
    expect(mapNotificationLogStatus("delivered")).toBe("delivered");
    expect(formatNotificationStatus("delivered")).toBe("Delivered");
    expect(mapNotificationLogStatus("queued")).toBe("queued");
    expect(formatNotificationStatus("queued")).toBe("Queued");
    expect(mapNotificationLogStatus("skipped")).toBe("skipped");
    expect(formatNotificationStatus("skipped")).toBe("Skipped");
    expect(mapNotificationLogStatus("failed")).toBe("failed");
    expect(formatNotificationStatus("failed")).toBe("Failed");
    expect(isResendActionStatus("failed")).toBe(true);
    expect(isResendActionStatus("not_recorded")).toBe(false);
  });

  it("explicit first send is available and does not auto-send on render", () => {
    const load = loadStatusFn();
    expect(load).not.toContain("sendEmail(");
    expect(load).not.toContain("sendChannelEmail(");
    expect(load).not.toContain("sendSMS(");
    expect(load).not.toContain("sendRefund");
    const retry = read("lib/notifications/booking-delivery.ts");
    expect(retry).toContain("forceResend: true");
    const ui = read(
      "components/booking-sheet/booking-communications-section.tsx",
    );
    expect(ui).toContain('item.status !== "not_applicable"');
    expect(ui).toContain("bookingChannelActionLabel");
  });

  it("first-send success copy is distinct from resend; failures never claim sent", () => {
    expect(
      bookingChannelNotificationFeedback({
        channel: "customer_email",
        kind: "first",
        resultStatus: "sent",
      }).success,
    ).toBe("Customer confirmation sent.");
    expect(
      bookingChannelNotificationFeedback({
        channel: "customer_email",
        kind: "resend",
        resultStatus: "sent",
      }).success,
    ).toBe("Customer confirmation resent.");
    expect(
      bookingChannelNotificationFeedback({
        channel: "business_email",
        kind: "first",
        resultStatus: "sent",
      }).success,
    ).toBe("Business confirmation sent.");
    expect(
      bookingChannelNotificationFeedback({
        channel: "staff_email",
        kind: "first",
        resultStatus: "sent",
      }).success,
    ).toBe("Staff notification sent.");
    const failedFirst = bookingChannelNotificationFeedback({
      channel: "customer_email",
      kind: "first",
      resultStatus: "failed",
      detail: "Mailbox rejected.",
    });
    expect(failedFirst.success).toBeUndefined();
    expect(failedFirst.error).toBe("Mailbox rejected.");
    const failedResend = bookingChannelNotificationFeedback({
      channel: "staff_email",
      kind: "resend",
      resultStatus: "failed",
      detail: "Mailbox rejected.",
    });
    expect(failedResend.success).toBeUndefined();
    expect(
      businessRefundNotificationFeedback({
        kind: "first",
        resultStatus: "failed",
        detail: "Mailbox rejected.",
      }).success,
    ).toBeUndefined();
    const retry = read("lib/actions/notification-retry.ts");
    expect(retry).toContain("bookingChannelNotificationFeedback");
    expect(retry).toContain("businessRefundNotificationFeedback");
    expect(retry).toContain('kind: report.attemptKind === "resend" ? "resend" : "first"');
  });

  it("Chase partially-refunded money behavior remains unchanged", () => {
    const money = appointmentCollectibleMoneyFromStamps(chasePartiallyRefunded);
    expect(money.grossPaidCents).toBe(33787);
    expect(money.refundedCents).toBe(5000);
    expect(money.netPaidCents).toBe(28787);
    expect(money.collectibleRemainingBalanceCents).toBe(0);
    expect(appointmentCollectionAction(chasePartiallyRefunded)).toBe(
      "paid_in_full",
    );
    expect(appointmentCollectionFacingLabel(chasePartiallyRefunded)).toBe(
      "Partially refunded",
    );
  });

  it("Sum paid-in-full money behavior remains unchanged", () => {
    expect(collectibleRemainingBalanceCents(sumPaidInFull)).toBe(0);
    expect(appointmentCollectionAction(sumPaidInFull)).toBe("paid_in_full");
    expect(appointmentCollectionFacingLabel(sumPaidInFull)).toBe("Paid in full");
  });
});
