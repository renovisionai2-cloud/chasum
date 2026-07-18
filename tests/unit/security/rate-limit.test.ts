import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimitStore,
} from "@/lib/security/rate-limit";

describe("rate limit", () => {
  beforeEach(() => resetRateLimitStore());

  it("allows requests under the limit", () => {
    const first = checkRateLimit({
      key: "t1",
      limit: 2,
      windowMs: 60_000,
      now: 1_000,
    });
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);

    const second = checkRateLimit({
      key: "t1",
      limit: 2,
      windowMs: 60_000,
      now: 1_100,
    });
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it("blocks when limit exceeded", () => {
    checkRateLimit({ key: "t2", limit: 1, windowMs: 60_000, now: 1_000 });
    const blocked = checkRateLimit({
      key: "t2",
      limit: 1,
      windowMs: 60_000,
      now: 1_100,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after window", () => {
    checkRateLimit({ key: "t3", limit: 1, windowMs: 1_000, now: 1_000 });
    const after = checkRateLimit({
      key: "t3",
      limit: 1,
      windowMs: 1_000,
      now: 2_100,
    });
    expect(after.allowed).toBe(true);
  });
});
