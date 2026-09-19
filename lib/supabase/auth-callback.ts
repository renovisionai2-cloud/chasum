import { requireSupabaseEnv } from "@/lib/env";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
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

function toNextCookieOptions(options: CookieOptions | undefined) {
  if (!options) return {};
  const next: {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: boolean | "lax" | "strict" | "none";
  } = {};
  if (typeof options.path === "string") next.path = options.path;
  if (typeof options.domain === "string") next.domain = options.domain;
  if (typeof options.maxAge === "number") next.maxAge = options.maxAge;
  if (options.expires instanceof Date) next.expires = options.expires;
  if (typeof options.httpOnly === "boolean") next.httpOnly = options.httpOnly;
  if (typeof options.secure === "boolean") next.secure = options.secure;
  if (
    options.sameSite === true ||
    options.sameSite === false ||
    options.sameSite === "lax" ||
    options.sameSite === "strict" ||
    options.sameSite === "none"
  ) {
    next.sameSite = options.sameSite;
  }
  return next;
}

function applyCapturedCookies(response: NextResponse, writes: CookieWrite[]) {
  for (const write of writes) {
    response.cookies.set(
      write.name,
      write.value,
      toNextCookieOptions(write.options),
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
 * Callback-only SSR client. Cookie writes are captured and applied to the
 * actual NextResponse.redirect returned to the browser. Do not use the
 * generic server client for /auth/callback — its setAll mutates cookieStore
 * without attaching Set-Cookie to the outgoing redirect.
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
          const capturedIndex = capturedCookies.findIndex(
            (existing) => existing.name === write.name,
          );
          if (capturedIndex >= 0) capturedCookies[capturedIndex] = write;
          else capturedCookies.push(write);

          const incomingIndex = incoming.findIndex(
            (existing) => existing.name === write.name,
          );
          const removing =
            write.value === "" || write.options.maxAge === 0;
          if (removing) {
            if (incomingIndex >= 0) incoming.splice(incomingIndex, 1);
          } else if (incomingIndex >= 0) {
            incoming[incomingIndex] = {
              name: write.name,
              value: write.value,
            };
          } else {
            incoming.push({ name: write.name, value: write.value });
          }
        }
        for (const [key, value] of Object.entries(headers ?? {})) {
          capturedHeaders[key] = value;
        }
      },
    },
  });

  function redirectWithAuthCookies(location: string) {
    const response = NextResponse.redirect(location);
    applyCapturedCookies(response, capturedCookies);
    applySafeCacheHeaders(
      response,
      capturedHeaders,
      capturedCookies.length > 0,
    );
    return response;
  }

  return { supabase, redirectWithAuthCookies };
}
