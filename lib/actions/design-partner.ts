"use server";

import { getEmailFromAddress, getResendApiKey } from "@/lib/env";
import {
  readDesignPartnerSubmission,
  serverErrorFromApplyErrors,
  validateDesignPartnerSubmission,
} from "@/lib/marketing/apply-validation";
import { logger } from "@/lib/observability/logger";

export type DesignPartnerState = {
  ok?: boolean;
  error?: string;
};

/**
 * Private Alpha lead capture only.
 * Form field `preferred_plan` is acquisition intent for the lead email only.
 * Must never mutate billed product plan, billing state, provider state, or entitlements.
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

  logger.info("design-partner", "application received", {
    businessName,
    industry,
    preferredPlan: payload.preferredPlan,
    email,
  });

  const apiKey = getResendApiKey();
  if (apiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: getEmailFromAddress(),
        to: ["sales@chasumai.com"],
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
    } catch (error) {
      logger.error("design-partner", "email send failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      // Still accept — founder can recover from logs; do not lose the lead UX.
    }
  }

  return { ok: true };
}
