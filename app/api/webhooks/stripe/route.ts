import { NextResponse } from "next/server";
import { getStripeWebhookSecret } from "@/lib/env";
import { logger, capturePaymentFailure } from "@/lib/observability/logger";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { verifyStripeWebhookSignature } from "@/lib/security/webhooks";

/**
 * Stripe webhook ingress — verifies signature before acknowledging events.
 * Full PaymentIntent reconciliation lands with Elements checkout; this hardens the endpoint now.
 */
export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const limit = checkRateLimit({
    key: `webhook:stripe:${ip}`,
    ...RATE_LIMITS.webhook,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const secret = getStripeWebhookSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe webhook secret not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await request.text();
  if (!verifyStripeWebhookSignature(secret, body, signature)) {
    logger.warn("stripe-webhook", "signature verification failed", { ip });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { id?: string; type?: string };
  try {
    event = JSON.parse(body) as { id?: string; type?: string };
  } catch (error) {
    await capturePaymentFailure(error, { provider: "stripe" });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  logger.info("stripe-webhook", "event received", {
    eventId: event.id,
    type: event.type,
  });

  // Acknowledge; domain handlers expand with Commerce Milestone follow-ups.
  return NextResponse.json(
    { received: true },
    { headers: rateLimitHeaders(limit) },
  );
}
