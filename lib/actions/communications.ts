"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getCommunicationService } from "@/lib/communication/service";
import type { CustomerCommunicationBundle } from "@/lib/communication/types";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

function revalidateCustomer(customerId: string) {
  revalidatePath(`/dashboard/clients/${customerId}`);
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/calendar");
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getCustomerCommunications(
  customerId: string,
): Promise<CustomerCommunicationBundle> {
  const business = await getOrCreateBusiness();
  return getCommunicationService().listForCustomer(business.id, customerId);
}

export async function logQuickCallAction(input: {
  customerId: string;
  appointmentId?: string | null;
  phone: string;
}): Promise<ActionState & { deepLink?: string }> {
  const business = await getOrCreateBusiness();
  const userId = await currentUserId();
  const result = await getCommunicationService().sendAndLog("call", {
    businessId: business.id,
    customerId: input.customerId,
    appointmentId: input.appointmentId,
    to: input.phone,
    body: "Outbound call initiated",
    createdBy: userId,
  });

  revalidateCustomer(input.customerId);
  if (!result.success) {
    return { error: result.error ?? "Could not start call." };
  }
  return {
    success: "Call logged.",
    deepLink: result.deepLink,
  };
}

export async function sendCustomerSmsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState & { deepLink?: string }> {
  const customerId = String(formData.get("customer_id") ?? "");
  const appointmentId = String(formData.get("appointment_id") ?? "") || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!customerId || !phone || !body) {
    return { error: "Phone and message are required." };
  }

  const business = await getOrCreateBusiness();
  const {
    planIncludesSms,
    SMS_PLAN_UPGRADE_MESSAGE,
    SMS_PROVIDER_MISSING_MESSAGE,
  } = await import("@/lib/billing/plan-features");
  const { isSmsDeliverable } = await import(
    "@/lib/integrations/providers/sms"
  );

  if (!planIncludesSms(business.subscription_plan_key)) {
    return { error: SMS_PLAN_UPGRADE_MESSAGE };
  }

  if (!isSmsDeliverable()) {
    return { error: SMS_PROVIDER_MISSING_MESSAGE };
  }

  const userId = await currentUserId();
  const result = await getCommunicationService().sendAndLog("sms", {
    businessId: business.id,
    customerId,
    appointmentId,
    to: phone,
    body,
    createdBy: userId,
  });

  revalidateCustomer(customerId);

  if (!result.success) {
    return {
      error:
        result.error ??
        "SMS was not delivered. Check Twilio configuration and the phone number.",
      deepLink: result.deepLink,
    };
  }

  return { success: "Text sent.", deepLink: result.deepLink };
}

export async function sendCustomerEmailAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState & { deepLink?: string }> {
  const customerId = String(formData.get("customer_id") ?? "");
  const appointmentId = String(formData.get("appointment_id") ?? "") || null;
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!customerId || !email || !body) {
    return { error: "Email and message are required." };
  }

  const business = await getOrCreateBusiness();
  const { isEmailDeliverable } = await import(
    "@/lib/integrations/providers/email"
  );
  const { getEmailFromAddress } = await import("@/lib/env");

  if (!isEmailDeliverable()) {
    return {
      error: `Email cannot be sent: RESEND_API_KEY is not configured (from ${getEmailFromAddress()}).`,
    };
  }

  const userId = await currentUserId();
  const result = await getCommunicationService().sendAndLog("email", {
    businessId: business.id,
    customerId,
    appointmentId,
    to: email,
    subject: subject || "Message from your provider",
    body,
    createdBy: userId,
  });

  revalidateCustomer(customerId);

  if (!result.success) {
    const provider =
      "provider" in result && typeof result.provider === "string"
        ? result.provider
        : null;
    const providerHint = provider ? ` Provider: ${provider}.` : "";
    return {
      error: `${result.error ?? "Failed to send email."}${providerHint}`,
      deepLink: result.deepLink,
    };
  }

  return { success: "Email sent.", deepLink: result.deepLink };
}

export async function addInternalNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const customerId = String(formData.get("customer_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const syncProfile = formData.get("sync_profile") === "on";

  if (!customerId || !body) {
    return { error: "Note cannot be empty." };
  }

  const business = await getOrCreateBusiness();
  const userId = await currentUserId();
  const supabase = await createClient();

  const record = await getCommunicationService().log({
    businessId: business.id,
    customerId,
    channel: "note",
    direction: "internal",
    status: "logged",
    body,
    provider: "internal",
    createdBy: userId,
  });

  if (!record) {
    return {
      error:
        "Could not save note. Apply migration 016_communication_center_phase1 if you have not yet.",
    };
  }

  if (syncProfile) {
    await supabase
      .from("customers")
      .update({ notes: body })
      .eq("id", customerId)
      .eq("business_id", business.id);
  }

  revalidateCustomer(customerId);
  return { success: "Note saved." };
}

export async function createFollowUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const customerId = String(formData.get("customer_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const dueAtRaw = String(formData.get("due_at") ?? "").trim();

  if (!customerId || !title || !dueAtRaw) {
    return { error: "Title and due date are required." };
  }

  const dueAt = new Date(dueAtRaw);
  if (Number.isNaN(dueAt.getTime())) {
    return { error: "Invalid due date." };
  }

  const business = await getOrCreateBusiness();
  const userId = await currentUserId();
  const followUp = await getCommunicationService().createFollowUp({
    businessId: business.id,
    customerId,
    title,
    body: body || null,
    dueAt: dueAt.toISOString(),
    createdBy: userId,
  });

  if (!followUp) {
    return {
      error:
        "Could not create follow-up. Apply migration 016_communication_center_phase1 if needed.",
    };
  }

  revalidateCustomer(customerId);
  return { success: "Follow-up reminder created." };
}

export async function completeFollowUpAction(
  followUpId: string,
  customerId: string,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const updated = await getCommunicationService().updateFollowUpStatus(
    business.id,
    followUpId,
    "completed",
  );
  if (!updated) return { error: "Could not complete follow-up." };
  revalidateCustomer(customerId);
  return { success: "Follow-up completed." };
}

export async function cancelFollowUpAction(
  followUpId: string,
  customerId: string,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const updated = await getCommunicationService().updateFollowUpStatus(
    business.id,
    followUpId,
    "cancelled",
  );
  if (!updated) return { error: "Could not cancel follow-up." };
  revalidateCustomer(customerId);
  return { success: "Follow-up cancelled." };
}

/** Log a device deep-link action (sms:/mailto:) after the user opens it. */
export async function logDeviceLinkAction(input: {
  customerId: string;
  appointmentId?: string | null;
  channel: "sms" | "email";
  recipient: string;
  subject?: string;
  body?: string;
}): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const userId = await currentUserId();
  await getCommunicationService().log({
    businessId: business.id,
    customerId: input.customerId,
    appointmentId: input.appointmentId,
    channel: input.channel,
    direction: "outbound",
    status: "logged",
    subject: input.subject ?? null,
    body: input.body ?? null,
    recipient: input.recipient,
    provider: input.channel === "sms" ? "sms_link" : "mailto",
    createdBy: userId,
  });
  revalidateCustomer(input.customerId);
  return { success: "Communication logged." };
}
