/**
 * Delivery — sendEmail / sendSMS public API + CRM timeline sync.
 */

import {
  providerSendEmail,
  providerSendSms,
} from "@/lib/communications/providers";
import {
  channelAllowed,
  loadBusinessCommPreferences,
  loadCustomerCommPreferences,
} from "@/lib/communications/preferences";
import {
  renderEmailTemplate,
  renderSmsTemplate,
} from "@/lib/communications/templates";
import {
  appendCrmTimeline,
  writeCommsAudit,
} from "@/lib/communications/timeline";
import type {
  AppointmentTemplateContext,
  SendResult,
} from "@/lib/communications/types";
import { isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createServiceClient } from "@/lib/supabase/service";

async function logDelivery(input: {
  businessId: string;
  channel: "email" | "sms";
  recipient: string;
  templateKey: string;
  status: "sent" | "failed" | "skipped" | "delivered";
  appointmentId?: string | null;
  customerId?: string | null;
  jobId?: string | null;
  attempt?: number;
  provider?: string;
  providerMessageId?: string;
  errorMessage?: string;
}) {
  const supabase = createServiceClient();
  const row: Record<string, unknown> = {
    business_id: input.businessId,
    appointment_id: input.appointmentId ?? null,
    channel: input.channel,
    recipient: input.recipient,
    template_key: input.templateKey,
    status: input.status === "delivered" ? "sent" : input.status,
    provider: input.provider ?? null,
    provider_message_id: input.providerMessageId ?? null,
    error_message: input.errorMessage ?? null,
    sent_at:
      input.status === "sent" || input.status === "delivered"
        ? new Date().toISOString()
        : null,
  };
  if (input.customerId) row.customer_id = input.customerId;
  if (input.jobId) row.job_id = input.jobId;
  if (input.attempt) row.attempt = input.attempt;

  const { error } = await supabase.from("notification_logs").insert(row);
  if (error && !isSoftSchemaFallbackAllowed(error.message)) {
    // Retry minimal columns
    await supabase.from("notification_logs").insert({
      business_id: input.businessId,
      appointment_id: input.appointmentId ?? null,
      channel: input.channel,
      recipient: input.recipient,
      template_key: input.templateKey,
      status: input.status === "delivered" ? "sent" : input.status,
      provider_message_id: input.providerMessageId ?? null,
      error_message: input.errorMessage ?? null,
      sent_at: row.sent_at,
    });
  }
}

export async function sendEmail(input: {
  businessId: string;
  to: string;
  templateKey: string;
  context: AppointmentTemplateContext;
  customerId?: string | null;
  appointmentId?: string | null;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
  skipPreferenceCheck?: boolean;
}): Promise<SendResult> {
  if (!input.skipPreferenceCheck) {
    const prefs = await loadBusinessCommPreferences(input.businessId, true);
    const customerPrefs = input.customerId
      ? await loadCustomerCommPreferences(
          input.businessId,
          input.customerId,
          true,
        )
      : null;
    if (
      !channelAllowed({
        channel: "email",
        business: prefs,
        customer: customerPrefs,
        marketing: input.templateKey.startsWith("marketing."),
      })
    ) {
      return { ok: false, skipped: true, error: "Email disabled by preferences." };
    }
    input.context = {
      ...input.context,
      branding: {
        businessName: input.context.businessName,
        optOutFooter: prefs.optOutFooter,
        supportEmail: prefs.notificationEmail,
      },
    };
  }

  const template = renderEmailTemplate(input.templateKey, input.context);
  const result = await providerSendEmail({
    to: input.to,
    subject: template.subject ?? input.context.businessName,
    html: template.html ?? `<p>${template.text}</p>`,
    text: template.text,
    attachments: input.attachments,
  });

  await logDelivery({
    businessId: input.businessId,
    channel: "email",
    recipient: input.to,
    templateKey: template.key,
    status: result.success ? "sent" : "failed",
    appointmentId: input.appointmentId,
    customerId: input.customerId,
    provider: result.provider,
    providerMessageId: result.messageId,
    errorMessage: result.error,
  });

  await appendCrmTimeline({
    businessId: input.businessId,
    customerId: input.customerId,
    appointmentId: input.appointmentId,
    channel: "email",
    status: result.success ? "sent" : "failed",
    subject: template.subject,
    body: template.text,
    recipient: input.to,
    provider: result.provider,
    providerMessageId: result.messageId,
    metadata: { templateKey: template.key },
  });

  await writeCommsAudit({
    businessId: input.businessId,
    action: result.success ? "email.sent" : "email.failed",
    channel: "email",
    templateKey: template.key,
    recipient: input.to,
    summary: result.success
      ? `Email sent: ${template.key}`
      : `Email failed: ${result.error ?? "unknown"}`,
  });

  return {
    ok: result.success,
    messageId: result.messageId,
    error: result.error,
    provider: result.provider,
  };
}

export async function sendSMS(input: {
  businessId: string;
  to: string;
  templateKey: string;
  context: AppointmentTemplateContext;
  customerId?: string | null;
  appointmentId?: string | null;
  skipPreferenceCheck?: boolean;
}): Promise<SendResult> {
  if (!input.skipPreferenceCheck) {
    const prefs = await loadBusinessCommPreferences(input.businessId, true);
    const customerPrefs = input.customerId
      ? await loadCustomerCommPreferences(
          input.businessId,
          input.customerId,
          true,
        )
      : null;
    if (
      !channelAllowed({
        channel: "sms",
        business: prefs,
        customer: customerPrefs,
      })
    ) {
      return { ok: false, skipped: true, error: "SMS disabled by preferences." };
    }
  }

  const template = renderSmsTemplate(input.templateKey, input.context);
  const result = await providerSendSms({
    to: input.to,
    body: template.text,
  });

  if (result.skipped) {
    await logDelivery({
      businessId: input.businessId,
      channel: "sms",
      recipient: input.to,
      templateKey: template.key,
      status: "skipped",
      appointmentId: input.appointmentId,
      customerId: input.customerId,
      provider: result.provider,
      errorMessage: result.error,
    });
    return { ok: true, skipped: true, provider: result.provider };
  }

  await logDelivery({
    businessId: input.businessId,
    channel: "sms",
    recipient: input.to,
    templateKey: template.key,
    status: result.success ? "sent" : "failed",
    appointmentId: input.appointmentId,
    customerId: input.customerId,
    provider: result.provider,
    providerMessageId: result.messageId,
    errorMessage: result.error,
  });

  await appendCrmTimeline({
    businessId: input.businessId,
    customerId: input.customerId,
    appointmentId: input.appointmentId,
    channel: "sms",
    status: result.success ? "sent" : "failed",
    body: template.text,
    recipient: input.to,
    provider: result.provider,
    providerMessageId: result.messageId,
    metadata: { templateKey: template.key },
  });

  await writeCommsAudit({
    businessId: input.businessId,
    action: result.success ? "sms.sent" : "sms.failed",
    channel: "sms",
    templateKey: template.key,
    recipient: input.to,
    summary: result.success
      ? `SMS sent: ${template.key}`
      : `SMS failed: ${result.error ?? "unknown"}`,
  });

  return {
    ok: result.success,
    messageId: result.messageId,
    error: result.error,
    provider: result.provider,
    skipped: result.skipped,
  };
}
