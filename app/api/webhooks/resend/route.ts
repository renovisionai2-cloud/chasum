import { NextResponse } from "next/server";
import { logger, captureCommunicationFailure } from "@/lib/observability/logger";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { verifyResendWebhookSignature } from "@/lib/security/webhooks";

/**
 * Resend delivery webhook — verifies Svix-style signatures.
 */
export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const limit = checkRateLimit({
    key: `webhook:resend:${ip}`,
    ...RATE_LIMITS.webhook,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Resend webhook secret not configured" },
      { status: 503 },
    );
  }

  const id = request.headers.get("svix-id") ?? "";
  const timestamp = request.headers.get("svix-timestamp") ?? "";
  const signature = request.headers.get("svix-signature") ?? "";
  const body = await request.text();

  if (
    !verifyResendWebhookSignature(secret, body, { id, timestamp, signature })
  ) {
    logger.warn("resend-webhook", "signature verification failed", { ip });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(body) as { type?: string };
    logger.info("resend-webhook", "event received", { type: event.type });
  } catch (error) {
    await captureCommunicationFailure(error, { provider: "resend" });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  return NextResponse.json(
    { received: true },
    { headers: rateLimitHeaders(limit) },
  );
}
