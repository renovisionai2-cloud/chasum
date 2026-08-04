/**
 * Platform-wide tenant email branding — business-primary identity,
 * verified technical sender on chasumai.com, plan-gated Chasum footer.
 */

import { BRAND_NAME } from "@/lib/brand/assets";
import {
  planAllowsRemoveBranding,
  type PlanGateBusiness,
} from "@/lib/billing/plan-features";
import {
  extractEmailAddress,
  resolveEmailFromAddress,
} from "@/lib/communications/email-from";
import type { BrandingContext } from "@/lib/communications/types";
import { getAppUrl } from "@/lib/env";

export type TenantEmailAudience = "customer" | "business" | "staff";

export type TenantEmailBusinessInput = PlanGateBusiness & {
  name: string;
  email?: string | null;
  notification_email?: string | null;
  phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  brand_color?: string | null;
  accent_color?: string | null;
  email_signature?: string | null;
  communications_opt_out_footer?: string | null;
};

export type TenantEmailBranding = {
  businessName: string;
  displaySenderName: string;
  /** Full From header, e.g. `GVM Baby World <notifications@chasumai.com>` */
  fromHeader: string;
  technicalAddress: string;
  replyToAddress: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  websiteUrl: string | null;
  showChasumBranding: boolean;
  chasumBrandingStyle: "powered_by" | "product_context" | "none";
  footerText: string;
};

export { planAllowsRemoveBranding };

/** Sanitize display name for email headers — no newlines or angle brackets. */
export function sanitizeEmailDisplayName(
  raw: string | null | undefined,
  fallback = BRAND_NAME,
): string {
  const cleaned = String(raw ?? "")
    .replace(/[\r\n\0<>"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 78);
  return cleaned || fallback;
}

export function formatFromHeader(
  displayName: string,
  technicalAddress: string,
): string {
  const name = sanitizeEmailDisplayName(displayName);
  const address =
    extractEmailAddress(technicalAddress) ?? "notifications@chasumai.com";
  // RFC 5322: display names with spaces or specials must be quoted.
  const needsQuotes = /[\s,;:@()[\]\\]/.test(name) || name.length === 0;
  const encoded = needsQuotes
    ? `"${name.replace(/\\/g, "\\\\").replace(/"/g, "")}"`
    : name;
  return `${encoded} <${address}>`;
}

function absoluteAssetUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const value = url.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${getAppUrl()}${value}`;
  return value;
}

function resolveReplyTo(business: TenantEmailBusinessInput): string | null {
  const candidates = [business.notification_email, business.email]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  for (const candidate of candidates) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Resolve tenant branding for outbound email.
 * Technical sender stays on verified chasumai.com; visible name is the business.
 */
export function resolveTenantEmailBranding(
  business: TenantEmailBusinessInput,
  audience: TenantEmailAudience = "customer",
): TenantEmailBranding {
  const businessName = sanitizeEmailDisplayName(business.name, BRAND_NAME);
  const displaySenderName = businessName;
  const platform = resolveEmailFromAddress();
  const technicalAddress =
    extractEmailAddress(platform.from) ?? "notifications@chasumai.com";
  const fromHeader = formatFromHeader(displaySenderName, technicalAddress);
  const replyToAddress = resolveReplyTo(business);
  const rawSupport = replyToAddress || business.email?.trim() || null;
  const supportEmail =
    rawSupport && !/notifications@chasumai\.com/i.test(rawSupport)
      ? rawSupport
      : null;
  const canRemove = planAllowsRemoveBranding(business);

  let showChasumBranding = true;
  let chasumBrandingStyle: TenantEmailBranding["chasumBrandingStyle"] =
    "powered_by";
  let footerText = `Powered by ${BRAND_NAME}`;

  if (audience === "customer") {
    if (canRemove) {
      showChasumBranding = false;
      chasumBrandingStyle = "none";
      const custom =
        business.communications_opt_out_footer?.trim() ||
        business.email_signature?.trim() ||
        "";
      // Never keep platform footer copy when branding removal is entitled.
      footerText = /powered by chasum|sent by chasum|chasum ·/i.test(custom)
        ? [businessName, supportEmail, business.phone?.trim()]
            .filter(Boolean)
            .join(" · ")
        : custom ||
          [businessName, supportEmail, business.phone?.trim()]
            .filter(Boolean)
            .join(" · ");
    } else {
      footerText = `Powered by ${BRAND_NAME}`;
    }
  } else {
    showChasumBranding = true;
    chasumBrandingStyle = "product_context";
    footerText = `Sent via ${BRAND_NAME}`;
  }

  return {
    businessName,
    displaySenderName,
    fromHeader,
    technicalAddress,
    replyToAddress,
    logoUrl: absoluteAssetUrl(business.logo_url),
    primaryColor: business.brand_color?.trim() || null,
    accentColor: business.accent_color?.trim() || null,
    supportEmail,
    supportPhone: business.phone?.trim() || null,
    websiteUrl: business.website?.trim() || null,
    showChasumBranding,
    chasumBrandingStyle,
    footerText,
  };
}

/** Map resolver output into template BrandingContext. */
export function toBrandingContext(
  tenant: TenantEmailBranding,
): BrandingContext {
  return {
    businessName: tenant.businessName,
    primaryColor: tenant.primaryColor,
    logoUrl: tenant.logoUrl,
    supportEmail: tenant.supportEmail,
    supportPhone: tenant.supportPhone,
    websiteUrl: tenant.websiteUrl,
    optOutFooter: tenant.footerText,
    showChasumBranding: tenant.showChasumBranding,
    chasumBrandingStyle: tenant.chasumBrandingStyle,
  };
}

export async function loadTenantEmailBranding(
  businessId: string,
  audience: TenantEmailAudience = "customer",
): Promise<TenantEmailBranding | null> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = createServiceClient();

  // Prefer full select; fall back if optional branding columns are missing
  // (Preview/Production schema may lag migrations). Never fail open to
  // platform "Powered by Chasum" solely because of a missing column.
  const fullSelect = `name, email, notification_email, phone, website, logo_url,
       brand_color, accent_color, email_signature,
       communications_opt_out_footer, subscription_plan_key, private_alpha_enabled`;
  const safeSelect = `name, email, notification_email, phone, website, logo_url,
       brand_color, accent_color, email_signature,
       subscription_plan_key, private_alpha_enabled`;

  let data: Record<string, unknown> | null = null;
  let error: { message: string } | null = null;

  const full = await supabase
    .from("businesses")
    .select(fullSelect)
    .eq("id", businessId)
    .single();
  data = (full.data as Record<string, unknown> | null) ?? null;
  error = full.error;

  if (
    error &&
    /communications_opt_out_footer|email_signature|does not exist/i.test(
      error.message,
    )
  ) {
    const retry = await supabase
      .from("businesses")
      .select(safeSelect)
      .eq("id", businessId)
      .single();
    data = (retry.data as Record<string, unknown> | null) ?? null;
    error = retry.error;
  }

  if (error || !data) {
    console.warn("[email] tenant branding load failed", {
      businessId,
      error: error?.message,
    });
    return null;
  }
  return resolveTenantEmailBranding(data as TenantEmailBusinessInput, audience);
}
