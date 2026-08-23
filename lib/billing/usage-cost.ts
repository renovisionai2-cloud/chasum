/**
 * Internal usage/COGS helpers.
 * 1,000,000 micro-USD = $1.00 USD-equivalent provider cost.
 * Not customer billing. Not SaaS invoice amount. Not tenant commerce money.
 *
 * Future SMS (not implemented in Track 2):
 * - Twilio REST create: num_segments (provisional)
 * - Twilio status callback: NumSegments (reconciliation)
 * - One message != one segment. Append compensating events; never UPDATE usage_events.
 */

export const MICROS_PER_USD = BigInt(1000000);
export const MICROS_PER_CENT = BigInt(10000);

export const USAGE_KINDS = [
  "summer_input_tokens",
  "summer_output_tokens",
  "summer_action",
  "sms_segment",
  "email_send",
  "voice_minute",
  "document_page",
] as const;

export type UsageKind = (typeof USAGE_KINDS)[number];

export function isSubCentMicros(micros: bigint): boolean {
  return micros > BigInt(0) && micros < MICROS_PER_CENT;
}

/** Integer conversion only. Sub-cent values stay non-zero micros. */
export function usdMajorAndRemainder(micros: bigint): {
  dollars: bigint;
  remainderMicros: bigint;
} {
  if (micros < BigInt(0)) {
    throw new Error("estimated_cost_micros cannot be negative");
  }
  return {
    dollars: micros / MICROS_PER_USD,
    remainderMicros: micros % MICROS_PER_USD,
  };
}
