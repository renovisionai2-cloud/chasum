"use server";

import { getEmailFromAddress, getResendApiKey } from "@/lib/env";
import { isApplyPlanIntentId } from "@/lib/marketing/pricing";
import { logger } from "@/lib/observability/logger";

export type DesignPartnerState = {
  ok?: boolean;
  error?: string;
};

function required(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/**
 * Private Alpha lead capture only.
 * Must never mutate billed product plan, billing state, provider state, or entitlements.
 */
export async function submitDesignPartnerApplication(
  _prev: DesignPartnerState,
  formData: FormData,
): Promise<DesignPartnerState> {
  const businessName = required(formData, "business_name");
  const industry = required(formData, "industry");
  const employees = required(formData, "employees");
  const locations = required(formData, "locations");
  const currentSoftware = required(formData, "current_software");
  const painPoint = required(formData, "pain_point");
  const monthlyActivity =
    required(formData, "monthly_activity") ||
    required(formData, "monthly_appointments");
  const preferredPlanRaw = optional(formData, "preferred_plan");
  const preferredPlan = isApplyPlanIntentId(preferredPlanRaw)
    ? preferredPlanRaw
    : "";
  const email = required(formData, "email");
  const phone = optional(formData, "phone");
  const notes = optional(formData, "notes");

  if (
    !businessName ||
    !industry ||
    !employees ||
    !locations ||
    !currentSoftware ||
    !painPoint ||
    !monthlyActivity ||
    !email
  ) {
    return { error: "Please complete all required fields." };
  }

  if (!email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

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
