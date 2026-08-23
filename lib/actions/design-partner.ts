"use server";

import {
  DESIGN_PARTNER_APPLICATIONS_TABLE,
  designPartnerNotificationText,
  isDesignPartnerApplicationsTableMissing,
  parseDesignPartnerApplication,
  toDesignPartnerApplicationRow,
} from "@/lib/apply/design-partner-application";
import { getEmailFromAddress, getResendApiKey } from "@/lib/env";
import { logger } from "@/lib/observability/logger";

export type DesignPartnerState = {
  ok?: boolean;
  error?: string;
};

type PersistResult =
  | { ok: true; id: string | null; tableReady: true }
  | { ok: true; id: null; tableReady: false }
  | { ok: false; error: string };

async function persistDesignPartnerApplication(
  row: ReturnType<typeof toDesignPartnerApplicationRow>,
): Promise<PersistResult> {
  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from(DESIGN_PARTNER_APPLICATIONS_TABLE)
      .insert(row)
      .select("id")
      .single();

    if (error) {
      if (isDesignPartnerApplicationsTableMissing(error)) {
        logger.error("design-partner", "037 unapplied — persist skipped", {
          message: error.message,
          code: error.code,
        });
        return { ok: true, id: null, tableReady: false };
      }
      logger.error("design-partner", "persist failed", {
        error: error.message,
      });
      return {
        ok: false,
        error: "Application could not be saved. Please try again.",
      };
    }

    return {
      ok: true,
      id: data?.id ? String(data.id) : null,
      tableReady: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isDesignPartnerApplicationsTableMissing(error)) {
      logger.error("design-partner", "037 unapplied — persist skipped", {
        message,
      });
      return { ok: true, id: null, tableReady: false };
    }
    logger.error("design-partner", "persist failed", { error: message });
    return {
      ok: false,
      error: "Application could not be saved. Please try again.",
    };
  }
}

async function notifyDesignPartnerApplication(input: {
  businessName: string;
  industry: string;
  employees: string;
  locations: string;
  currentSoftware: string;
  monthlyAppointments: string;
  painPoint: string;
  email: string;
  phone: string;
  notes: string;
}): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    logger.info("design-partner", "email skipped — Resend is not configured");
    return "skipped";
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const submittedAt = new Date().toISOString();
    const result = await resend.emails.send({
      from: getEmailFromAddress(),
      to: ["sales@chasum.app"],
      replyTo: input.email,
      subject: `Private Alpha application — ${input.businessName}`,
      text: designPartnerNotificationText(input, submittedAt),
    });
    if (result.error) {
      logger.error("design-partner", "email send failed", {
        error: result.error.message,
      });
      return "failed";
    }
    logger.info("design-partner", "email sent", {
      businessName: input.businessName,
    });
    return "sent";
  } catch (error) {
    logger.error("design-partner", "email send failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return "failed";
  }
}

export async function submitDesignPartnerApplication(
  _prev: DesignPartnerState,
  formData: FormData,
): Promise<DesignPartnerState> {
  const parsed = parseDesignPartnerApplication(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const row = toDesignPartnerApplicationRow(parsed.value);
  const persisted = await persistDesignPartnerApplication(row);
  if (!persisted.ok) {
    return { error: persisted.error };
  }

  logger.info("design-partner", "application received", {
    businessName: parsed.value.businessName,
    industry: parsed.value.industry,
    email: parsed.value.email,
    applicationId: persisted.id,
    tableReady: persisted.tableReady,
  });

  await notifyDesignPartnerApplication(parsed.value);

  return { ok: true };
}
