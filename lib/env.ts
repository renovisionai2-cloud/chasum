/**
 * Returns the public app URL used for auth redirects.
 * Falls back to localhost during development.
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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
