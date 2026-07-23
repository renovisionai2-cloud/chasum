/**
 * Returns the public app URL used for auth redirects.
 * Prefers NEXT_PUBLIC_APP_URL, then Vercel host, then localhost.
 * Always absolute (with protocol) and without a trailing slash.
 */
export function getAppUrl(): string {
  const raw =
    firstNonEmpty(
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ) ?? "http://localhost:3000";

  let url = raw.trim().replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Never use localhost for auth redirects on a live Vercel deploy.
  if (
    (process.env.VERCEL_ENV === "production" ||
      process.env.VERCEL_ENV === "preview" ||
      process.env.NODE_ENV === "production") &&
    /localhost|127\.0\.0\.1/i.test(url)
  ) {
    const vercelHost =
      process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    if (vercelHost) {
      url = `https://${vercelHost.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}`;
    }
  }

  return url;
}

/**
 * Prefer the live request host for auth email redirects so a baked-in
 * NEXT_PUBLIC_APP_URL (or localhost) cannot poison production reset links.
 */
export function getAppUrlFromRequestHeaders(headerList: Headers): string | null {
  const host = (
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    ""
  )
    .split(",")[0]
    ?.trim();

  if (!host || /localhost|127\.0\.0\.1/i.test(host)) {
    return null;
  }

  const proto = (
    headerList.get("x-forwarded-proto") ||
    "https"
  )
    .split(",")[0]
    ?.trim() || "https";

  return `${proto}://${host}`.replace(/\/+$/, "");
}

/**
 * Supabase JS expects the project origin only (https://xxx.supabase.co).
 * If the env value includes /rest/v1 (or other API prefixes), Auth calls hit
 * PostgREST and fail with: "Invalid path specified in request URL".
 */
export function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
    return parsed.origin;
  } catch {
    return trimmed
      .replace(/\/+$/, "")
      .replace(/\/(rest|auth|storage|functions|realtime|graphql)\/v1$/i, "");
  }
}

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return null;
}

/** True on Vercel/production deploys (not local Next.js). */
export function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

/** Keeps post-auth `next` paths relative and safe. */
export function sanitizeAuthNextPath(next: string | null | undefined): string {
  const value = (next ?? "/dashboard").trim() || "/dashboard";
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("://")
  ) {
    return "/dashboard";
  }
  return value;
}

/**
 * Builds the Supabase auth callback URL with an optional post-auth redirect.
 * Example: https://chasum.vercel.app/auth/callback?next=%2Freset-password
 */
export function getAuthCallbackUrl(next = "/dashboard"): string {
  const path = sanitizeAuthNextPath(next);
  return `${getAppUrl()}/auth/callback?next=${encodeURIComponent(path)}`;
}

/**
 * Password-recovery redirectTo for resetPasswordForEmail.
 * Existing app route is /reset-password (not /auth/update-password).
 * Pass `originOverride` (e.g. from request headers) to avoid env drift.
 */
export function getPasswordResetRedirectUrl(originOverride?: string | null): string {
  if (originOverride && /^https?:\/\//i.test(originOverride)) {
    const origin = originOverride.replace(/\/+$/, "");
    return `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
  }
  return getAuthCallbackUrl("/reset-password");
}

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

/**
 * Returns Supabase credentials when configured, otherwise null.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || !anonKey) {
    return null;
  }

  return { url: normalizeSupabaseUrl(rawUrl), anonKey };
}

/**
 * Returns Supabase credentials or throws with a clear setup message.
 */
export function requireSupabaseEnv(): SupabaseEnv {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
    );
  }

  return env;
}

export function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

export function requireServiceRoleKey(): string {
  const key = getServiceRoleKey();
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for background jobs.");
  }
  return key;
}

export function getCronSecret(): string | null {
  return process.env.CRON_SECRET ?? null;
}

export function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY ?? null;
}

export function getEmailFromAddress(): string {
  return process.env.EMAIL_FROM ?? "Chasum <notifications@chasum.app>";
}

export function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !phoneNumber) return null;
  return { accountSid, authToken, phoneNumber };
}

/** Optional OpenAI key for Emma AI Receptionist (falls back to grounded provider). */
export function getOpenAiApiKey(): string | null {
  return process.env.OPENAI_API_KEY ?? null;
}

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function getMicrosoftOAuthConfig() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID ?? "common";
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, tenantId };
}

/** Comma-separated emails allowed to access /owner (platform super admins). */
export function getPlatformOwnerEmails(): string[] {
  const raw = process.env.PLATFORM_OWNER_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Stripe secret for PaymentIntents / webhooks (optional until card checkout ships). */
export function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY ?? null;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

export function getSentryDsn(): string | null {
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? null;
}
