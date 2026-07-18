import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticateApiKey, requireScope } from "@/lib/api/auth";
import {
  apiError,
  apiForbidden,
  apiUnauthorized,
} from "@/lib/api/response";
import type { ApiScope } from "@/lib/types/integrations";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

type ApiAuth = {
  businessId: string;
  scopes: ApiScope[];
  keyId: string;
};

/**
 * Authenticate API key + enforce per-key rate limit.
 * Returns auth context or a NextResponse error.
 */
export async function requireApiAuth(
  request: NextRequest,
  scope: ApiScope,
): Promise<ApiAuth | NextResponse> {
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) return apiUnauthorized();
  if (!requireScope(auth.scopes, scope)) return apiForbidden();

  const ip = clientIpFromHeaders(request.headers);
  const limit = checkRateLimit({
    key: `api:${auth.keyId}:${ip}`,
    ...RATE_LIMITS.apiKey,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  return auth;
}

export function isApiAuth(
  value: ApiAuth | NextResponse,
): value is ApiAuth {
  return !(value instanceof NextResponse) && "businessId" in value;
}

export function apiValidationError(message: string) {
  return apiError(message, 400);
}
