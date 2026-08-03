"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  retryBookingNotification,
  type BookingNotificationItem,
} from "@/lib/notifications/booking-delivery";
import type { ActionState } from "@/lib/types/booking";

/**
 * Retry a single notification channel for an existing appointment.
 * Never creates another appointment.
 */
export async function retryAppointmentNotification(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await getOrCreateBusiness();
  const appointmentId = String(formData.get("appointment_id") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim() as
    BookingNotificationItem["channel"];

  if (!appointmentId) {
    return { error: "Appointment is required to retry notifications." };
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
