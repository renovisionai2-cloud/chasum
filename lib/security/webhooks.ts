import { createHmac, timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Chasum outbound webhook HMAC (sha256 hex). */
export function verifyChasumWebhookSignature(
  secret: string,
  body: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return safeEqual(expected, signature);
}

/**
 * Stripe-style signature header: `t=timestamp,v1=signature`
 * Uses HMAC-SHA256 of `${timestamp}.${body}` with the webhook secret.
 */
export function verifyStripeWebhookSignature(
  secret: string,
  body: string,
  signatureHeader: string,
  toleranceSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim() ?? "", v?.trim() ?? ""];
    }),
  );
  const timestamp = Number(parts.t);
  const v1 = parts.v1;
  if (!timestamp || !v1 || Number.isNaN(timestamp)) return false;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return safeEqual(expected, v1);
}

/** Resend svix-style: `svix-id`, `svix-timestamp`, `svix-signature` (v1,base64). */
export function verifyResendWebhookSignature(
  secret: string,
  body: string,
  headers: {
    id: string;
    timestamp: string;
    signature: string;
  },
  toleranceSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const ts = Number(headers.timestamp);
  if (!headers.id || Number.isNaN(ts)) return false;
  if (Math.abs(nowSeconds - ts) > toleranceSeconds) return false;

  const signedContent = `${headers.id}.${headers.timestamp}.${body}`;
  // Resend/Svix secrets are often `whsec_...` base64; accept raw secret too.
  const key = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice(6), "base64")
    : Buffer.from(secret);

  const expected = createHmac("sha256", key)
    .update(signedContent)
    .digest("base64");

  const candidates = headers.signature
    .split(" ")
    .map((part) => part.replace(/^v1,/, "").trim())
    .filter(Boolean);

  return candidates.some((sig) => safeEqual(sig, expected));
}

/** Twilio request validation (HMAC-SHA1 of URL + sorted params). */
export function verifyTwilioRequestSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string,
): boolean {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = createHmac("sha1", authToken)
    .update(Buffer.from(sorted, "utf-8"))
    .digest("base64");
  return safeEqual(expected, signature);
}
