"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId } from "@/lib/actions/location";
import { handleSummerTurn } from "@/lib/summer/orchestrator";
import {
  summerConfirmBooking,
  summerConfirmCancel,
  summerConfirmReschedule,
  summerLookupCustomer,
} from "@/lib/summer/tools";
import type {
  SummerBookingOption,
  SummerTurnResult,
} from "@/lib/summer/types";
import { revalidatePath } from "next/cache";

function revalidateSummer(customerId?: string) {
  revalidatePath("/dashboard/ai-workforce");
  revalidatePath("/dashboard/ai-workforce/summer");
  revalidatePath("/dashboard/ai-workforce/emma");
  revalidatePath("/dashboard/ai-workforce/command");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/clients");
  if (customerId) revalidatePath(`/dashboard/clients/${customerId}`);
}

export async function sendSummerMessage(input: {
  message: string;
  conversationId?: string | null;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorPhone?: string | null;
  customerId?: string | null;
}): Promise<SummerTurnResult> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const result = await handleSummerTurn({
    businessId: business.id,
    locationId,
    conversationId: input.conversationId,
    message: input.message,
    visitorName: input.visitorName,
    visitorEmail: input.visitorEmail,
    visitorPhone: input.visitorPhone,
    customerId: input.customerId,
  });
  revalidateSummer(input.customerId ?? undefined);
  return result;
}

export async function confirmSummerBookingAction(input: {
  option: SummerBookingOption;
  customerId: string;
  conversationId?: string | null;
  notes?: string | null;
}): Promise<{
  ok: boolean;
  appointmentId?: string;
  error?: string;
  conflicts?: Array<{ code?: string; message: string }>;
  reply: string;
}> {
  const business = await getOrCreateBusiness();
  const result = await summerConfirmBooking({
    businessId: business.id,
    locationId: input.option.locationId,
    serviceId: input.option.serviceId,
    staffId: input.option.staffId,
    customerId: input.customerId,
    startIso: input.option.startIso,
    notes: input.notes,
  });

  revalidateSummer(input.customerId);

  if (result.ok) {
    return {
      ok: true,
      appointmentId: result.appointmentId,
      reply: `Confirmed — ${input.option.serviceName} with ${input.option.staffName} on ${input.option.dateLabel} at ${input.option.timeLabel}. Booked through the Booking Engine.`,
    };
  }

  return {
    ok: false,
    error: result.error,
    conflicts: result.conflicts.map((c) => ({
      code: c.code,
      message: c.message,
    })),
    reply: `I couldn't complete that booking: ${result.error}. ${
      result.conflicts[0]?.message ?? "Please pick another opening or escalate to staff."
    }`,
  };
}

export async function cancelSummerAppointmentAction(input: {
  appointmentId: string;
  customerId?: string | null;
}): Promise<{ ok: boolean; error?: string; reply: string }> {
  const business = await getOrCreateBusiness();
  const result = await summerConfirmCancel({
    businessId: business.id,
    appointmentId: input.appointmentId,
    customerId: input.customerId,
  });
  revalidateSummer(input.customerId ?? undefined);
  if (result.ok) {
    return {
      ok: true,
      reply: "Appointment cancelled through the Booking Engine.",
    };
  }
  return {
    ok: false,
    error: result.error,
    reply: `Cancellation failed: ${result.error}`,
  };
}

export async function rescheduleSummerAppointmentAction(input: {
  appointmentId: string;
  option: SummerBookingOption;
  customerId?: string | null;
}): Promise<{
  ok: boolean;
  error?: string;
  conflicts?: Array<{ code?: string; message: string }>;
  reply: string;
}> {
  const business = await getOrCreateBusiness();
  const result = await summerConfirmReschedule({
    businessId: business.id,
    appointmentId: input.appointmentId,
    startIso: input.option.startIso,
    staffId: input.option.staffId,
    locationId: input.option.locationId,
    customerId: input.customerId,
  });
  revalidateSummer(input.customerId ?? undefined);
  if (result.ok) {
    return {
      ok: true,
      reply: `Rescheduled to ${input.option.dateLabel} at ${input.option.timeLabel} with ${input.option.staffName}.`,
    };
  }
  return {
    ok: false,
    error: result.error,
    conflicts: result.conflicts.map((c) => ({
      code: c.code,
      message: c.message,
    })),
    reply: `Reschedule failed: ${result.error}`,
  };
}

export async function summerRecognizeCustomerAction(input: {
  email?: string | null;
  phone?: string | null;
  customerId?: string | null;
}) {
  const business = await getOrCreateBusiness();
  return summerLookupCustomer({
    businessId: business.id,
    email: input.email,
    phone: input.phone,
    customerId: input.customerId,
  });
}
