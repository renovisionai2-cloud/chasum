"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { retryPaymentReceiptForAppointment } from "@/lib/commerce/receipts";
import {
  retryBookingNotification,
  loadAppointmentCommunicationStatus,
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
            ? result.skippedDuplicate
              ? "Payment receipt already sent."
              : "Payment receipt sent."
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
            status: result.status === "not_applicable" || result.status === "no_recipient"
              ? result.status === "no_recipient"
                ? "no_recipient"
                : "not_applicable"
              : result.status,
            label: "Payment receipt",
            detail: result.detail,
            canRetry: result.status === "failed" || result.status === "sent",
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
      success: "Notification resent.",
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

/** Load communication channel status for Edit Booking (read-only). */
export async function loadAppointmentCommunicationsAction(
  appointmentId: string,
): Promise<{
  items: BookingNotificationItem[];
  error?: string;
}> {
  const id = appointmentId.trim();
  if (!id) return { items: [], error: "Appointment is required." };
  try {
    const business = await getOrCreateBusiness();
    void business;
    const report = await loadAppointmentCommunicationStatus(id);
    return { items: report.items };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Could not load communications.",
    };
  }
}
