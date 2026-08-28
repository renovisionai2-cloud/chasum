"use server";

import { getEmailFromAddress, getResendApiKey } from "@/lib/env";
import {
  APPLY_DELIVERY_ERROR,
  readDesignPartnerSubmission,
  serverErrorFromApplyErrors,
  validateDesignPartnerSubmission,
} from "@/lib/marketing/apply-validation";
import { logger } from "@/lib/observability/logger";

export type DesignPartnerState = {
  ok?: boolean;
  error?: string;
};

const SALES_INBOX = "sales@chasumai.com";

function deliveryFailure(
  context: Record<string, unknown>,
): DesignPartnerState {
  logger.error("design-partner", "email send failed", context);
  return { error: APPLY_DELIVERY_ERROR };
}

/**
 * Private Alpha lead capture only.
 * Form field `preferred_plan` is acquisition intent for the lead email only.
 * Must never mutate billed product plan, billing state, provider state, or entitlements.
 * Success requires Resend to accept the sales lead email.
 */
export async function submitDesignPartnerApplication(
  _prev: DesignPartnerState,
  formData: FormData,
): Promise<DesignPartnerState> {
  const data = readDesignPartnerSubmission(formData);
  const result = validateDesignPartnerSubmission(data);

  if (!result.ok) {
    return { error: serverErrorFromApplyErrors(data, result.errors) };
  }

  const {
    businessName,
    industry,
    employees,
    locations,
    currentSoftware,
    painPoint,
    monthlyActivity,
    preferredPlan,
    email,
    phone,
    notes,
  } = data;

  const payload = {
    businessName,
    industry,
    employees,
    locations,
    currentSoftware,
    painPoint,
    monthlyActivity,
    preferredPlan: preferredPlan || "(not provided)",
    email,
    phone: phone || "(not provided)",
    notes: notes || "(none)",
    submittedAt: new Date().toISOString(),
  };

  const apiKey = getResendApiKey();
  if (!apiKey) {
    return deliveryFailure({
      reason: "missing_api_key",
      businessName,
      preferredPlan: payload.preferredPlan,
    });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data: sent, error } = await resend.emails.send({
      from: getEmailFromAddress(),
      to: [SALES_INBOX],
      replyTo: email,
      subject: `Private Alpha application — ${businessName}`,
      text: [
        "New Chasum Private Alpha / Design Partner application",
        "",
        `Business: ${businessName}`,
        `Business type: ${industry}`,
        `Interested plan: ${payload.preferredPlan}`,
        `Team size: ${employees}`,
        `Locations: ${locations}`,
        `Current software: ${currentSoftware}`,
        `Monthly customer activity: ${monthlyActivity}`,
        `Improve: ${painPoint}`,
        `Email: ${email}`,
        `Phone: ${phone || "(not provided)"}`,
        `Notes: ${notes || "(none)"}`,
        `Submitted: ${payload.submittedAt}`,
      ].join("\n"),
    });

    if (error || !sent?.id) {
      return deliveryFailure({
        reason: "provider_rejected",
        businessName,
        preferredPlan: payload.preferredPlan,
        errorName: error?.name ?? "missing_id",
        statusCode: error?.statusCode ?? null,
        error: error?.message ?? "Resend did not return an email id.",
      });
    }

    logger.info("design-partner", "application delivered", {
      businessName,
      industry,
      preferredPlan: payload.preferredPlan,
      messageId: sent.id,
    });

    return { ok: true };
  } catch (error) {
    return deliveryFailure({
      reason: "provider_throw",
      businessName,
      preferredPlan: payload.preferredPlan,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
