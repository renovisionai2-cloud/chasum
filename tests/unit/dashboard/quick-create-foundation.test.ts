import { describe, expect, it } from "vitest";
import { QUICK_CREATE_ACTIONS } from "@/lib/dashboard/quick-create";

describe("quick create foundation", () => {
  it("exposes only real create workflows", () => {
    expect(QUICK_CREATE_ACTIONS.map((a) => a.label)).toEqual([
      "Book appointment",
      "Add customer",
      "Record payment",
    ]);
    expect(
      QUICK_CREATE_ACTIONS.every((a) => a.href.startsWith("/dashboard/")),
    ).toBe(true);
    expect(
      QUICK_CREATE_ACTIONS.find((a) => a.label === "Book appointment")?.href,
    ).toContain("book=1");
  });
});
