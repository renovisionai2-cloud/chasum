import { NextResponse } from "next/server";
import { getTwilioConfig } from "@/lib/env";
import { logger, captureCommunicationFailure } from "@/lib/observability/logger";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";
import { verifyTwilioRequestSignature } from "@/lib/security/webhooks";
import { getAppUrl } from "@/lib/env";

/**
 * Twilio status callback — validates X-Twilio-Signature.
 */
export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const limit = checkRateLimit({
    key: `webhook:twilio:${ip}`,
    ...RATE_LIMITS.webhook,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const twilio = getTwilioConfig();
  if (!twilio) {
    return NextResponse.json(
      { error: "Twilio not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("x-twilio-signature") ?? "";
  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((value, key) => {
    params[key] = String(value);
  });

  const url = `${getAppUrl()}/api/webhooks/twilio`;
  if (
    !verifyTwilioRequestSignature(twilio.authToken, url, params, signature)
  ) {
    logger.warn("twilio-webhook", "signature verification failed", { ip });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    logger.info("twilio-webhook", "status received", {
      messageSid: params.MessageSid,
      status: params.MessageStatus,
    });
  } catch (error) {
    await captureCommunicationFailure(error, { provider: "twilio" });
  }

  return NextResponse.json(
    { received: true },
    { headers: rateLimitHeaders(limit) },
  );
}
