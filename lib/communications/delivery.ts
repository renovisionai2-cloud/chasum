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
import { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/observability/logger";
import { inspectSendIntent, runDurableSend, type DurableSendResult, type ProviderOutcome, type SendReliabilityContext } from "@/lib/communications/send-intent";

function isMarketingTemplate(templateKey: string): boolean {
  return templateKey.startsWith("marketing.");
}

/** Marketing consent cannot be bypassed by skipPreferenceCheck. Missing customer fails closed. */
async function marketingConsentDenied(input: {
  businessId: string;
  templateKey: string;
  customerId?: string | null;
}): Promise<boolean> {
  if (!isMarketingTemplate(input.templateKey)) return false;
  const business = await loadBusinessCommPreferences(input.businessId, true);
  if (!business.marketingEmailEnabled) return true;
  if (!input.customerId) return true;
  const customer = await loadCustomerCommPreferences(
    input.businessId,
    input.customerId,
    true,
  );
  return customer.marketing !== true;
}

function withDeliveryEntity(input: {
  reliability?: SendReliabilityContext;
  templateKey: string;
  appointmentId?: string | null;
  context: AppointmentTemplateContext;
}): SendReliabilityContext | undefined {
  if (!input.reliability || input.reliability.entityType || input.reliability.entityId) return input.reliability;
  const receiptId = (input.context as AppointmentTemplateContext & { receiptId?: string }).receiptId;
  if (input.templateKey === "commerce.receipt" && receiptId) {
    return { ...input.reliability, entityType: "receipt", entityId: receiptId };
  }
  if (input.appointmentId) return { ...input.reliability, entityType: "appointment", entityId: input.appointmentId };
  return input.reliability;
}

async function logDelivery(input: {
  businessId: string;
  channel: "email" | "sms";
  recipient: string;
  templateKey: string;
  status: "pending" | "sent" | "failed" | "skipped" | "delivered";
  appointmentId?: string | null;
  customerId?: string | null;
  jobId?: string | null;
  attempt?: number;
  provider?: string;
  providerMessageId?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  include029Fields?: boolean;
}): Promise<boolean> {
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
    provider_response: input.metadata ?? null,
    error_message: input.errorMessage ?? null,
    sent_at:
      input.status === "sent" || input.status === "delivered"
        ? new Date().toISOString()
        : null,
  };
  // The compatibility path must persist sent evidence even before 029 exists.
  // Reliable worker/inline execution is separately gated on verified 029.
  if (input.include029Fields) {
    if (input.customerId) row.customer_id = input.customerId;
    if (input.jobId) row.job_id = input.jobId;
    if (input.attempt) row.attempt = input.attempt;
  }

  try {
    const { error } = await supabase.from("notification_logs").insert(row);
    if (error) logger.error("worker_reliability", "delivery_log_write_failed", {
      businessId: input.businessId, jobId: input.jobId,
    });
    return !error;
  } catch {
    logger.error("worker_reliability", "delivery_log_write_unconfirmed", {
      businessId: input.businessId, jobId: input.jobId,
    });
    return false;
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
  reliability?: SendReliabilityContext;
}): Promise<SendResult> {
  input.reliability = withDeliveryEntity(input);
  if (input.reliability) {
    const existing = await inspectSendIntent({ ...input, channel: "email", reliability: input.reliability });
    if (existing) return finishDelivery(input, "email", { key: input.templateKey, text: "" }, existing);
  }
  const audience =
    input.templateKey === "appointment.business" ||
    input.templateKey === "appointment.staff" ||
    input.templateKey.startsWith("staff.") ||
    input.templateKey.startsWith("business.")
      ? ("business" as const)
      : ("customer" as const);

  const {
    loadTenantEmailBranding,
    toBrandingContext,
    formatFromHeader,
  } = await import("@/lib/communications/tenant-email-branding");
  const { resolveEmailFromAddress } = await import(
    "@/lib/communications/email-from"
  );
  const tenant = await loadTenantEmailBranding(input.businessId, audience);

  if (await marketingConsentDenied(input)) {
    await logDelivery({
      businessId: input.businessId,
      channel: "email",
      recipient: input.to,
      templateKey: input.templateKey,
      status: "skipped",
      appointmentId: input.appointmentId,
      customerId: input.customerId,
      errorMessage: "Marketing disabled by consent.",
    });
    return { ok: false, skipped: true, error: "Marketing disabled by consent." };
  }

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
      await logDelivery({
        businessId: input.businessId,
        channel: "email",
        recipient: input.to,
        templateKey: input.templateKey,
        status: "skipped",
        appointmentId: input.appointmentId,
        customerId: input.customerId,
        errorMessage: "Email disabled by preferences.",
      });
      return { ok: false, skipped: true, error: "Email disabled by preferences." };
    }
  }

  const branding = tenant
    ? toBrandingContext(tenant)
    : {
        businessName: input.context.businessName,
        supportEmail: null,
        optOutFooter: null,
        // Prefer context branding when tenant row failed to load.
        showChasumBranding:
          input.context.branding?.showChasumBranding ?? true,
        chasumBrandingStyle:
          input.context.branding?.chasumBrandingStyle ??
          ("powered_by" as const),
      };

  if (!tenant) {
    console.warn(
      "[email] tenant branding unresolved; using context fallback",
      { businessId: input.businessId, templateKey: input.templateKey },
    );
  }

  input.context = {
    ...input.context,
    businessName: tenant?.businessName ?? input.context.businessName,
    branding: {
      ...branding,
      businessName:
        tenant?.businessName ??
        input.context.branding?.businessName ??
        input.context.businessName,
      logoUrl: tenant?.logoUrl ?? input.context.branding?.logoUrl ?? null,
      primaryColor:
        tenant?.primaryColor ?? input.context.branding?.primaryColor ?? null,
      supportEmail:
        tenant?.supportEmail ?? input.context.branding?.supportEmail ?? null,
      supportPhone:
        tenant?.supportPhone ?? input.context.branding?.supportPhone ?? null,
      websiteUrl:
        tenant?.websiteUrl ?? input.context.branding?.websiteUrl ?? null,
      optOutFooter: tenant?.footerText ?? branding.optOutFooter,
      showChasumBranding:
        tenant?.showChasumBranding ??
        input.context.branding?.showChasumBranding ??
        true,
      chasumBrandingStyle:
        tenant?.chasumBrandingStyle ??
        input.context.branding?.chasumBrandingStyle ??
        "powered_by",
    },
  };

  const template = renderEmailTemplate(input.templateKey, input.context);
  const fromHeader =
    tenant?.fromHeader ||
    formatFromHeader(
      tenant?.businessName || input.context.businessName || "Chasum",
      resolveEmailFromAddress().from,
    );
  const send = (idempotencyKey?: string) => providerSendEmail({
    to: input.to,
    subject: template.subject ?? input.context.businessName,
    html: template.html ?? `<p>${template.text}</p>`,
    text: template.text,
    from: fromHeader,
    replyTo: tenant?.replyToAddress ?? undefined,
    attachments: input.attachments,
    idempotencyKey,
  });
  const result = await invokeProvider(input, "email", send);
  return finishDelivery(input, "email", template, result);
}

export async function sendSMS(input: {
  businessId: string;
  to: string;
  templateKey: string;
  context: AppointmentTemplateContext;
  customerId?: string | null;
  appointmentId?: string | null;
  skipPreferenceCheck?: boolean;
  reliability?: SendReliabilityContext;
}): Promise<SendResult> {
  input.reliability = withDeliveryEntity(input);
  if (input.reliability) {
    const existing = await inspectSendIntent({ ...input, channel: "sms", reliability: input.reliability });
    if (existing) return finishDelivery(input, "sms", { key: input.templateKey, text: "" }, existing);
  }
  if (await marketingConsentDenied(input)) {
    await logDelivery({
      businessId: input.businessId,
      channel: "sms",
      recipient: input.to,
      templateKey: input.templateKey,
      status: "skipped",
      appointmentId: input.appointmentId,
      customerId: input.customerId,
      errorMessage: "Marketing disabled by consent.",
    });
    return { ok: false, skipped: true, error: "Marketing disabled by consent." };
  }
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
      await logDelivery({
        businessId: input.businessId,
        channel: "sms",
        recipient: input.to,
        templateKey: input.templateKey,
        status: "skipped",
        appointmentId: input.appointmentId,
        customerId: input.customerId,
        errorMessage: "SMS disabled by preferences.",
      });
      return { ok: false, skipped: true, error: "SMS disabled by preferences." };
    }
  }

  const template = renderSmsTemplate(input.templateKey, input.context);
  const result = await invokeProvider(input, "sms", () => providerSendSms({
    to: input.to,
    body: template.text,
  }));
  return finishDelivery(input, "sms", template, result);
}

type DeliveryInput = {
  businessId: string;
  to: string;
  templateKey: string;
  appointmentId?: string | null;
  customerId?: string | null;
  reliability?: SendReliabilityContext;
};

async function invokeProvider(
  input: DeliveryInput,
  channel: "email" | "sms",
  send: (key?: string) => Promise<ProviderOutcome>,
): Promise<DurableSendResult> {
  if (input.reliability) return runDurableSend({ ...input, channel, reliability: input.reliability }, send);
  // Compatibility path while the worker is held, and unrelated direct callers.
  try {
    const result = await send();
    return { ...result, deliveryState: result.success ? "accepted" : result.retrySafe || result.skipped ? "rejected" : "unknown",
      reconciliationRequired: !result.success && !result.retrySafe && !result.skipped,
      duplicateSuppressed: false, providerCalled: true };
  } catch {
    return { success: false, provider: "unresolved", error: "Provider acceptance is unknown; reconciliation required.",
      retrySafe: false, deliveryState: "unknown", reconciliationRequired: true,
      duplicateSuppressed: false, providerCalled: true };
  }
}

async function finishDelivery(
  input: DeliveryInput,
  channel: "email" | "sms",
  template: { key: string; text: string; subject?: string },
  result: DurableSendResult,
): Promise<SendResult> {
  let reconciliationRequired = result.reconciliationRequired;
  // Existing acceptance is authoritative. Replays do not create duplicate logs.
  if (result.providerCalled) {
    const status = result.success ? "sent" : result.skipped ? "skipped" : result.deliveryState === "unknown" ? "pending" : "failed";
    const metadata = {
      templateKey: template.key, sendIntentId: result.intentId,
      deliveryState: result.deliveryState, providerCalled: result.providerCalled,
      jobId: input.reliability?.jobId, jobAttempt: input.reliability?.attempt,
    };
    try {
      const logged = await logDelivery({ businessId: input.businessId, channel, recipient: input.to,
        templateKey: template.key, status, appointmentId: input.appointmentId,
        customerId: input.customerId, jobId: input.reliability?.jobId,
        attempt: input.reliability?.attempt, provider: result.provider,
        providerMessageId: result.messageId, errorMessage: result.error, metadata,
        include029Fields: Boolean(input.reliability) });
      if (!logged) reconciliationRequired = true;
      const timeline = await appendCrmTimeline({ businessId: input.businessId,
        customerId: input.customerId, appointmentId: input.appointmentId, channel, status,
        subject: template.subject, body: template.text, recipient: input.to,
        provider: result.provider, providerMessageId: result.messageId, metadata });
      if (timeline === false) reconciliationRequired = true;
      const audited = await writeCommsAudit({ businessId: input.businessId,
        action: `${channel}.${result.success ? "sent" : result.skipped ? "skipped" : result.deliveryState === "unknown" ? "acceptance_unknown" : "failed"}`,
        channel, templateKey: template.key, recipient: input.to,
        entityType: input.reliability?.jobId ? "background_job" : "send_intent",
        entityId: input.reliability?.jobId ?? result.intentId,
        summary: result.success ? `Provider accepted ${template.key}` : `Delivery outcome: ${result.deliveryState}`,
        metadata });
      if (audited === false) reconciliationRequired = true;
    } catch {
      // Provider outcome must survive every post-send bookkeeping failure.
      reconciliationRequired = true;
    }
  }
  if (reconciliationRequired) logger.error("worker_reliability", "delivery_reconciliation_required", {
    businessId: input.businessId, jobId: input.reliability?.jobId, intentId: result.intentId,
    deliveryState: result.deliveryState, providerCalled: result.providerCalled,
  });
  return { ok: result.success, messageId: result.messageId, error: result.error, skipped: result.skipped,
    provider: result.provider, deliveryState: result.deliveryState, retrySafe: result.retrySafe,
    reconciliationRequired, duplicateSuppressed: result.duplicateSuppressed, intentId: result.intentId };
}
