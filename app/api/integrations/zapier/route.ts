import { NextResponse } from "next/server";
import { WEBHOOK_EVENTS } from "@/lib/types/integrations";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

/**
 * Zapier / Make.com integration catalog.
 * Discovery is public but rate-limited; actions require API keys on /api/v1/*.
 */
export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const limit = checkRateLimit({
    key: `zapier:${ip}`,
    ...RATE_LIMITS.zapier,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  return NextResponse.json(
    {
      name: "Chasum",
      version: "1.0.0",
      description: "Appointment booking platform",
      triggers: WEBHOOK_EVENTS.map((event) => ({
        key: event,
        label: event.replace(".", " — ").replace(/^\w/, (c) => c.toUpperCase()),
        type: "webhook",
      })),
      actions: [
        {
          key: "create_appointment",
          label: "Create Appointment",
          method: "POST",
          path: "/api/v1/appointments",
        },
        {
          key: "list_appointments",
          label: "List Appointments",
          method: "GET",
          path: "/api/v1/appointments",
        },
        {
          key: "list_customers",
          label: "List Customers",
          method: "GET",
          path: "/api/v1/customers",
        },
        {
          key: "list_services",
          label: "List Services",
          method: "GET",
          path: "/api/v1/services",
        },
      ],
      authentication: {
        type: "api_key",
        header: "Authorization",
        format: "Bearer chsm_...",
      },
      documentation: "/docs/API.md",
    },
    { headers: rateLimitHeaders(limit) },
  );
}
