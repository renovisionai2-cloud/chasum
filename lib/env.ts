/**
 * Returns the public app URL used for auth redirects.
 * Falls back to localhost during development.
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** True on Vercel/production deploys (not local Next.js). */
export function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

/**
 * Builds the Supabase auth callback URL with an optional post-auth redirect.
 */
export function getAuthCallbackUrl(next = "/dashboard"): string {
  return `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

/**
 * Returns Supabase credentials when configured, otherwise null.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
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
