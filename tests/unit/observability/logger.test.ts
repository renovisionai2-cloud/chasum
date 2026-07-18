import { describe, expect, it } from "vitest";
import { logger } from "@/lib/observability/logger";

describe("structured logger", () => {
  it("emits without throwing", () => {
    expect(() =>
      logger.info("test", "hello", { bookingId: "b1", password: "secret" }),
    ).not.toThrow();
  });
});
