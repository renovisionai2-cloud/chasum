"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { retryPaymentReceiptForAppointment } from "@/lib/commerce/receipts";
import {
  retryBookingNotification,
  type BookingNotificationItem,
} from "@/lib/notifications/booking-delivery";
import type { ActionState } from "@/lib/types/booking";

/**
 * Retry a single notification channel for an existing appointment.
 * Never creates another appointment or another payment.
 */
export async function retryAppointmentNotification(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const appointmentId = String(formData.get("appointment_id") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim() as
    BookingNotificationItem["channel"] | "payment_receipt";

  if (!appointmentId) {
    return { error: "Appointment is required to retry notifications." };
  }

  if (channel === "payment_receipt") {
    try {
      const result = await retryPaymentReceiptForAppointment({
        businessId: business.id,
        appointmentId,
      });
      return {
        success:
          result.status === "sent"
            ? "Payment receipt sent."
            : result.status === "failed"
              ? undefined
              : "Payment receipt retry finished.",
        error:
          result.status === "failed"
            ? result.detail ?? "Payment receipt failed."
            : undefined,
        appointmentId,
        notifications: [
          {
            channel: "payment_receipt",
            status: result.status,
            label: "Payment receipt",
            detail: result.detail,
            canRetry: result.status === "failed",
          },
        ],
      };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message.slice(0, 200)
            : "Receipt retry failed.",
        appointmentId,
        notifications: [
          {
            channel: "payment_receipt",
            status: "failed",
            label: "Payment receipt",
            detail: "Receipt retry failed.",
            canRetry: true,
          },
        ],
      };
    }
  }

  if (
    channel !== "customer_email" &&
    channel !== "customer_sms" &&
    channel !== "business_email" &&
    channel !== "staff_email"
  ) {
    return { error: "Unknown notification channel." };
  }

  try {
    const report = await retryBookingNotification({ appointmentId, channel });
    return {
      success: "Notification retry finished.",
      appointmentId,
      notifications: report.items,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Retry failed.",
      appointmentId,
    };
  }
}
