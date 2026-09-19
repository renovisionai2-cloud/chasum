import { requireSupabaseEnv } from "@/lib/env";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { stringifySetCookie } from "cookie";
import { NextResponse } from "next/server";

type CookieWrite = {
  name: string;
  value: string;
  options: CookieOptions;
};

const ALLOWED_CACHE_HEADER_NAMES = new Set([
  "cache-control",
  "expires",
  "pragma",
]);

const DEFAULT_AUTH_CACHE_CONTROL = "private, no-store";

function parseCookieHeader(header: string): { name: string; value: string }[] {
  if (!header.trim()) return [];
  const cookies: { name: string; value: string }[] = [];
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    if (!name) continue;
    const raw = part.slice(idx + 1).trim();
    let value = raw;
    try {
      value = decodeURIComponent(raw);
    } catch {
      value = raw;
    }
    cookies.push({ name, value });
  }
  return cookies;
}

function isRemovalWrite(write: CookieWrite) {
  return write.value === "" || write.options.maxAge === 0;
}

function applyIncomingWrite(
  incoming: { name: string; value: string }[],
  write: CookieWrite,
) {
  for (let i = incoming.length - 1; i >= 0; i -= 1) {
    if (incoming[i].name === write.name) incoming.splice(i, 1);
  }
  if (!isRemovalWrite(write)) {
    incoming.push({ name: write.name, value: write.value });
  }
}

function appendCapturedCookies(response: NextResponse, writes: CookieWrite[]) {
  for (const write of writes) {
    response.headers.append(
      "Set-Cookie",
      stringifySetCookie(write.name, write.value, write.options),
    );
  }
}

function applySafeCacheHeaders(
  response: NextResponse,
  headers: Record<string, string>,
  hasAuthCookies: boolean,
) {
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value !== "string") continue;
    if (!ALLOWED_CACHE_HEADER_NAMES.has(key.toLowerCase())) continue;
    response.headers.set(key, value);
  }
  if (hasAuthCookies && !response.headers.has("cache-control")) {
    response.headers.set("Cache-Control", DEFAULT_AUTH_CACHE_CONTROL);
  }
}

/**
 * Callback-only SSR client. Cookie writes are captured in order and each is
 * appended as its own Set-Cookie header on the actual redirect. Do not emit
 * through ResponseCookies: Next 16 stores cookies in a name-only Map and
 * would collapse same-name clears with different domain/path.
 */
export function createAuthCallbackClient(request: Request) {
  const { url, anonKey } = requireSupabaseEnv();
  const incoming = parseCookieHeader(request.headers.get("cookie") ?? "");
  const capturedCookies: CookieWrite[] = [];
  const capturedHeaders: Record<string, string> = {};

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return incoming.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet, headers) {
        for (const cookie of cookiesToSet) {
          const write: CookieWrite = {
            name: cookie.name,
            value: cookie.value,
            options: { ...(cookie.options ?? {}) },
          };
          capturedCookies.push(write);
          applyIncomingWrite(incoming, write);
        }
        for (const [key, value] of Object.entries(headers ?? {})) {
          capturedHeaders[key] = value;
        }
      },
    },
  });

  function redirectWithAuthCookies(location: string) {
    const response = NextResponse.redirect(location);
    appendCapturedCookies(response, capturedCookies);
    applySafeCacheHeaders(
      response,
      capturedHeaders,
      capturedCookies.length > 0,
    );
    return response;
  }

  return { supabase, redirectWithAuthCookies };
}
