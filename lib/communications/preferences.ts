import type {
  CommunicationsPreferences,
  CustomerCommPreferences,
} from "@/lib/communications/types";
import { logger } from "@/lib/observability/logger";
import { captureMessage } from "@/lib/observability/sentry";
import {
  isMarketingConsentColumnMissing,
  isSoftSchemaFallbackAllowed,
  logQueryError,
} from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const CUSTOMER_PREFS_FULL =
  "id, preferred_communication_method, marketing_consent, email, phone";
const CUSTOMER_PREFS_COMPAT =
  "id, preferred_communication_method, email, phone";

const COMPAT_WARN_SCOPE = "comms.customer.prefs";
const COMPAT_WARN_MESSAGE =
  "marketing_consent column missing; using compatibility read";
const COMPAT_WARN_INTERVAL_MS = 60_000;
let lastCompatWarnAt = 0;

function warnMarketingConsentCompat(detail: string): void {
  const now = Date.now();
  if (now - lastCompatWarnAt < COMPAT_WARN_INTERVAL_MS) return;
  lastCompatWarnAt = now;
  logger.warn(COMPAT_WARN_SCOPE, COMPAT_WARN_MESSAGE, { message: detail });
}

/** Test-only: reset the compatibility-warning rate limit. */
export function resetMarketingConsentCompatWarnForTests(): void {
  lastCompatWarnAt = 0;
}

type CustomerPrefRow = {
  id?: string;
  preferred_communication_method?: string | null;
  marketing_consent?: boolean | null;
  email?: string | null;
  phone?: string | null;
};

export function deriveCustomerChannelPreferences(
  row: CustomerPrefRow | null | undefined,
  options: { customerId: string; marketing: boolean },
): CustomerCommPreferences {
  const preferred = (row?.preferred_communication_method as string | null) ?? null;
  const hasEmail = Boolean(String(row?.email ?? "").trim());
  const hasPhone = Boolean(String(row?.phone ?? "").trim());
  return {
    customerId: options.customerId,
    preferredMethod: preferred,
    email: hasEmail && preferred !== "sms" && preferred !== "call",
    sms: hasPhone && preferred !== "email" && preferred !== "call",
    marketing: options.marketing,
  };
}

function transactionalUnavailablePrefs(customerId: string): CustomerCommPreferences {
  return {
    customerId,
    email: true,
    sms: true,
    marketing: false,
    preferredMethod: null,
  };
}

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

  if (error && !isSoftSchemaFallbackAllowed(error.message)) {
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

  const readCustomer = (select: string) =>
    supabase
      .from("customers")
      .select(select)
      .eq("id", customerId)
      .eq("business_id", businessId)
      .maybeSingle();

  const { data, error } = await readCustomer(CUSTOMER_PREFS_FULL);

  if (!error) {
    if (!data) return transactionalUnavailablePrefs(customerId);
    return deriveCustomerChannelPreferences(data as CustomerPrefRow, {
      customerId,
      marketing: Boolean((data as CustomerPrefRow).marketing_consent),
    });
  }

  if (isMarketingConsentColumnMissing(error.message)) {
    warnMarketingConsentCompat(error.message);
    const fallback = await readCustomer(CUSTOMER_PREFS_COMPAT);
    if (fallback.error) {
      logQueryError(COMPAT_WARN_SCOPE, fallback.error.message);
      captureMessage(
        `[${COMPAT_WARN_SCOPE}] preference compatibility read failed`,
        "error",
        { message: fallback.error.message },
      );
      return transactionalUnavailablePrefs(customerId);
    }
    if (!fallback.data) return transactionalUnavailablePrefs(customerId);
    return deriveCustomerChannelPreferences(fallback.data as CustomerPrefRow, {
      customerId,
      marketing: false,
    });
  }

  if (!isSoftSchemaFallbackAllowed(error.message)) {
    logQueryError(COMPAT_WARN_SCOPE, error.message);
    captureMessage(`[${COMPAT_WARN_SCOPE}] preference read failed`, "error", {
      message: error.message,
    });
  }
  return transactionalUnavailablePrefs(customerId);
}

export function channelAllowed(input: {
  channel: "email" | "sms";
  business: CommunicationsPreferences;
  customer?: CustomerCommPreferences | null;
  marketing?: boolean;
}): boolean {
  if (input.channel === "email" && !input.business.emailEnabled) return false;
  if (input.channel === "sms" && !input.business.smsEnabled) return false;
  if (input.marketing) {
    if (!input.business.marketingEmailEnabled) return false;
    if (!input.customer?.marketing) return false;
  }
  if (input.customer) {
    if (input.channel === "email" && !input.customer.email) return false;
    if (input.channel === "sms" && !input.customer.sms) return false;
  }
  return true;
}
