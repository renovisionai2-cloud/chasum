"use server";

import { getEmailFromAddress, getResendApiKey } from "@/lib/env";
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
  const monthlyAppointments = required(formData, "monthly_appointments");
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
    !monthlyAppointments ||
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
    monthlyAppointments,
    email,
    phone: phone || "(not provided)",
    notes: notes || "(none)",
    submittedAt: new Date().toISOString(),
  };

  logger.info("design-partner", "application received", {
    businessName,
    industry,
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
          `Team size: ${employees}`,
          `Locations: ${locations}`,
          `Current software: ${currentSoftware}`,
          `Monthly appointments: ${monthlyAppointments}`,
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
