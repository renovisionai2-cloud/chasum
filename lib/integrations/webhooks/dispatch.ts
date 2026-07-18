import { createHmac } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyChasumWebhookSignature } from "@/lib/security/webhooks";
import { logger } from "@/lib/observability/logger";

function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export async function dispatchWebhooks(
  businessId: string,
  event: string,
  data: Record<string, unknown>,
) {
  const supabase = createServiceClient();

  const { data: endpoints } = await supabase
    .from("webhook_endpoints")
    .select("*")
    .eq("business_id", businessId)
    .eq("active", true);

  const payload = JSON.stringify({
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  for (const endpoint of endpoints ?? []) {
    if (endpoint.events.length > 0 && !endpoint.events.includes(event)) {
      continue;
    }

    const signature = signPayload(endpoint.secret, payload);

    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chasum-Event": event,
          "X-Chasum-Signature": signature,
          "User-Agent": "Chasum-Webhooks/1.0",
        },
        body: payload,
      });

      if (!res.ok) {
        logger.error("webhooks", `dispatch failed for ${endpoint.url}`, {
          status: res.status,
        });
      }
    } catch (err) {
      logger.error("webhooks", `dispatch error for ${endpoint.url}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function verifyWebhookSignature(
  secret: string,
  body: string,
  signature: string,
): boolean {
  return verifyChasumWebhookSignature(secret, body, signature);
}
