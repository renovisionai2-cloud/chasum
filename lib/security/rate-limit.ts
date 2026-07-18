/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-instance / beta. Replace with Redis/Upstash for multi-region.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  /** Unique key (e.g. `public-book:ip:1.2.3.4`) */
  key: string;
  /** Max requests in the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
  /** Injected clock for tests */
  now?: number;
};

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now();
  const existing = buckets.get(options.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(options.key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetAt,
      limit: options.limit,
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      limit: options.limit,
    };
  }

  existing.count += 1;
  buckets.set(options.key, existing);
  return {
    allowed: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
    limit: options.limit,
  };
}

/** Test helper */
export function resetRateLimitStore(): void {
  buckets.clear();
}

/** Presets used across public surfaces */
export const RATE_LIMITS = {
  publicBooking: { limit: 30, windowMs: 60_000 },
  publicSlots: { limit: 60, windowMs: 60_000 },
  publicLookup: { limit: 20, windowMs: 60_000 },
  apiKey: { limit: 120, windowMs: 60_000 },
  cron: { limit: 30, windowMs: 60_000 },
  webhook: { limit: 100, windowMs: 60_000 },
  zapier: { limit: 30, windowMs: 60_000 },
} as const;

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
