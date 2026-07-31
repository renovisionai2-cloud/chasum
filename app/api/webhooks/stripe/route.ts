import { NextResponse } from "next/server";
import { finalizeStripePaymentIntent } from "@/lib/commerce/payments";
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
 * Stripe webhook ingress — verifies signature, then reconciles PaymentIntents
 * into the commerce ledger (appointment / invoice / receipt sync).
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

  let event: {
    id?: string;
    type?: string;
    data?: { object?: { id?: string; object?: string; status?: string } };
  };
  try {
    event = JSON.parse(body) as typeof event;
  } catch (error) {
    await capturePaymentFailure(error, { provider: "stripe" });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  logger.info("stripe-webhook", "event received", {
    eventId: event.id,
    type: event.type,
  });

  if (
    event.type === "payment_intent.succeeded" &&
    event.data?.object?.object === "payment_intent" &&
    event.data.object.id
  ) {
    try {
      const result = await finalizeStripePaymentIntent({
        providerPaymentIntentId: event.data.object.id,
      });
      if (!result.ok) {
        logger.warn("stripe-webhook", "finalize skipped or failed", {
          eventId: event.id,
          paymentIntentId: event.data.object.id,
          error: result.error,
        });
      } else {
        logger.info("stripe-webhook", "payment finalized", {
          eventId: event.id,
          paymentIntentId: event.data.object.id,
        });
      }
    } catch (error) {
      await capturePaymentFailure(error, {
        provider: "stripe",
        eventId: event.id,
      });
      logger.error("stripe-webhook", "finalize threw", {
        eventId: event.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json(
    { received: true },
    { headers: rateLimitHeaders(limit) },
  );
}
