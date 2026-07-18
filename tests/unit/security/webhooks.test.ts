import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  verifyChasumWebhookSignature,
  verifyStripeWebhookSignature,
  verifyTwilioRequestSignature,
} from "@/lib/security/webhooks";

describe("webhook verification", () => {
  it("verifies Chasum HMAC signatures", () => {
    const secret = "whsec_test";
    const body = JSON.stringify({ event: "appointment.created" });
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyChasumWebhookSignature(secret, body, signature)).toBe(true);
    expect(verifyChasumWebhookSignature(secret, body, "deadbeef")).toBe(false);
  });

  it("verifies Stripe signature headers", () => {
    const secret = "whsec_stripe";
    const body = '{"id":"evt_1"}';
    const timestamp = 1_700_000_000;
    const v1 = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");
    const header = `t=${timestamp},v1=${v1}`;
    expect(
      verifyStripeWebhookSignature(secret, body, header, 300, timestamp),
    ).toBe(true);
    expect(
      verifyStripeWebhookSignature(secret, body, header, 300, timestamp + 10_000),
    ).toBe(false);
  });

  it("verifies Twilio request signatures", () => {
    const token = "auth_token";
    const url = "https://example.com/api/webhooks/twilio";
    const params = { MessageSid: "SM123", MessageStatus: "delivered" };
    const sorted =
      url +
      Object.keys(params)
        .sort()
        .reduce((acc, key) => acc + key + params[key as keyof typeof params], "");
    const signature = createHmac("sha1", token)
      .update(Buffer.from(sorted, "utf-8"))
      .digest("base64");
    expect(verifyTwilioRequestSignature(token, url, params, signature)).toBe(
      true,
    );
  });
});
