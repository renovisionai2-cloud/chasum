import type {
  CommunicationsPreferences,
  CustomerCommPreferences,
} from "@/lib/communications/types";
import { isMissingSchemaError, logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** True when `now` falls inside quiet hours (supports overnight windows). */
export function isWithinQuietHours(
  now: Date,
  start: string | null,
  end: string | null,
): boolean {
  const s = parseTimeToMinutes(start);
  const e = parseTimeToMinutes(end);
  if (s == null || e == null) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  if (s === e) return false;
  if (s < e) return mins >= s && mins < e;
  return mins >= s || mins < e;
}

/** Schedule just after quiet hours end if currently quiet. */
export function deferPastQuietHours(
  scheduledAt: Date,
  start: string | null,
  end: string | null,
): Date {
  if (!isWithinQuietHours(scheduledAt, start, end)) return scheduledAt;
  const e = parseTimeToMinutes(end);
  if (e == null) return scheduledAt;
  const next = new Date(scheduledAt);
  next.setHours(Math.floor(e / 60), e % 60, 0, 0);
  if (next <= scheduledAt) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export async function loadBusinessCommPreferences(
  businessId: string,
  useServiceClient = false,
): Promise<CommunicationsPreferences> {
  const supabase = useServiceClient
    ? createServiceClient()
    : await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, email_notifications_enabled, sms_notifications_enabled, reminder_hours_before, notification_email, marketing_email_enabled, quiet_hours_start, quiet_hours_end, communications_opt_out_footer, name",
    )
    .eq("id", businessId)
    .maybeSingle();

  if (error && !isMissingSchemaError(error.message)) {
    // Fallback select without new columns
    const { data: fallback } = await supabase
      .from("businesses")
      .select(
        "id, email_notifications_enabled, sms_notifications_enabled, reminder_hours_before, notification_email",
      )
      .eq("id", businessId)
      .maybeSingle();

    return {
      businessId,
      emailEnabled: Boolean(fallback?.email_notifications_enabled ?? true),
      smsEnabled: Boolean(fallback?.sms_notifications_enabled ?? false),
      marketingEmailEnabled: false,
      reminderHoursBefore: Number(fallback?.reminder_hours_before ?? 24),
      notificationEmail: (fallback?.notification_email as string) ?? null,
      quietHoursStart: null,
      quietHoursEnd: null,
      optOutFooter: null,
    };
  }

  return {
    businessId,
    emailEnabled: Boolean(data?.email_notifications_enabled ?? true),
    smsEnabled: Boolean(data?.sms_notifications_enabled ?? false),
    marketingEmailEnabled: Boolean(data?.marketing_email_enabled ?? false),
    reminderHoursBefore: Number(data?.reminder_hours_before ?? 24),
    notificationEmail: (data?.notification_email as string) ?? null,
    quietHoursStart: data?.quiet_hours_start
      ? String(data.quiet_hours_start).slice(0, 5)
      : null,
    quietHoursEnd: data?.quiet_hours_end
      ? String(data.quiet_hours_end).slice(0, 5)
      : null,
    optOutFooter: (data?.communications_opt_out_footer as string) ?? null,
  };
}

export async function loadCustomerCommPreferences(
  businessId: string,
  customerId: string,
  useServiceClient = false,
): Promise<CustomerCommPreferences> {
  const supabase = useServiceClient
    ? createServiceClient()
    : await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, preferred_communication_method, marketing_consent, email, phone",
    )
    .eq("id", customerId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    if (!isMissingSchemaError(error.message)) {
      logQueryError("comms.customer.prefs", error.message);
    }
    return {
      customerId,
      email: true,
      sms: true,
      marketing: false,
      preferredMethod: null,
    };
  }

  const preferred = (data?.preferred_communication_method as string) ?? null;
  return {
    customerId,
    email: preferred !== "sms" && preferred !== "call",
    sms: preferred !== "email",
    marketing: Boolean(data?.marketing_consent),
    preferredMethod: preferred,
  };
}

export function channelAllowed(input: {
  channel: "email" | "sms";
  business: CommunicationsPreferences;
  customer?: CustomerCommPreferences | null;
  marketing?: boolean;
}): boolean {
  if (input.channel === "email" && !input.business.emailEnabled) return false;
  if (input.channel === "sms" && !input.business.smsEnabled) return false;
  if (input.marketing && !input.business.marketingEmailEnabled) return false;
  if (input.marketing && input.customer && !input.customer.marketing) {
    return false;
  }
  if (input.customer) {
    if (input.channel === "email" && !input.customer.email) return false;
    if (input.channel === "sms" && !input.customer.sms) return false;
  }
  return true;
}
