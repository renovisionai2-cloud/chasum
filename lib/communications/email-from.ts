/**
 * Centralized Resend sender resolution.
 * Verified platform domain: chasumai.com — never silently use chasum.app.
 */

export const VERIFIED_PLATFORM_EMAIL_FROM =
  "Chasum <notifications@chasumai.com>";

/** Domains authorized to send transactional mail via Resend. */
export const APPROVED_SENDER_DOMAINS = ["chasumai.com"] as const;

const BLOCKED_LEGACY_DOMAINS = ["chasum.app"] as const;

export type ResolvedEmailFrom = {
  from: string;
  domain: string;
  source: "env" | "platform_fallback";
};

export function extractEmailAddress(from: string): string | null {
  const angle = from.match(/<([^>]+)>/);
  const raw = (angle?.[1] ?? from).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return null;
  return raw.toLowerCase();
}

export function extractSenderDomain(from: string): string | null {
  const address = extractEmailAddress(from);
  if (!address) return null;
  return address.split("@")[1] ?? null;
}

export function isApprovedSenderDomain(domain: string | null | undefined): boolean {
  if (!domain) return false;
  const normalized = domain.toLowerCase();
  return (APPROVED_SENDER_DOMAINS as readonly string[]).includes(normalized);
}

export function isBlockedLegacySenderDomain(
  domain: string | null | undefined,
): boolean {
  if (!domain) return false;
  return (BLOCKED_LEGACY_DOMAINS as readonly string[]).includes(
    domain.toLowerCase(),
  );
}

/**
 * Resolve the From address for outbound email.
 * Prefers EMAIL_FROM / RESEND_FROM / DEFAULT_FROM_EMAIL when the domain is approved.
 * Otherwise uses the verified platform fallback (chasumai.com).
 * Never returns a chasum.app address.
 */
export function resolveEmailFromAddress(
  env: NodeJS.ProcessEnv = process.env,
): ResolvedEmailFrom {
  const candidates = [
    env.EMAIL_FROM,
    env.RESEND_FROM,
    env.DEFAULT_FROM_EMAIL,
  ]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  for (const candidate of candidates) {
    const domain = extractSenderDomain(candidate);
    if (isBlockedLegacySenderDomain(domain)) {
      continue;
    }
    if (isApprovedSenderDomain(domain)) {
      return { from: candidate, domain: domain!, source: "env" };
    }
  }

  return {
    from: VERIFIED_PLATFORM_EMAIL_FROM,
    domain: "chasumai.com",
    source: "platform_fallback",
  };
}

/**
 * Validate a From address before calling Resend.
 * Returns a sanitized error string when invalid.
 */
export function validateEmailFromAddress(from: string): string | null {
  const domain = extractSenderDomain(from);
  if (!domain) {
    return "Email sender address is invalid. Configure EMAIL_FROM with a verified domain.";
  }
  if (isBlockedLegacySenderDomain(domain)) {
    return `Email sender domain ${domain} is not authorized. Use a verified chasumai.com address.`;
  }
  if (!isApprovedSenderDomain(domain)) {
    return `Email sender domain ${domain} is not an approved Chasum sender domain. Use notifications@chasumai.com.`;
  }
  return null;
}
