import { requireSupabaseEnv } from "@/lib/env";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();
  // Next's mutable action/route cookie adapter exposes this internal marker;
  // its sealed Server Component adapter does not. Keep read-only rendering
  // tolerant, but never hide a failed write when mutation is supported.
  const cookiesAreMutable =
    (cookieStore as unknown as Record<symbol, unknown>)[
      Symbol.for("next.mutated.cookies")
    ] !== undefined;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch (error) {
          if (cookiesAreMutable) throw error;
          // Read-only Server Components cannot persist refreshed cookies.
        }
      },
    },
  });
}
