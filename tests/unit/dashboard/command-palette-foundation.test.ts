import { describe, expect, it } from "vitest";
import { COMMAND_REGISTRY, matchCommandRegistry } from "@/lib/command/registry";
import { COMMAND_PALETTE_EVENT } from "@/lib/reception/workflow-events";

describe("command palette registry (Phase 1 terminology)", () => {
  it("uses Customers and Reception wording", () => {
    expect(
      COMMAND_REGISTRY.some((c) => c.title === "Go to Customers"),
    ).toBe(true);
    expect(COMMAND_REGISTRY.some((c) => c.title === "Go to CRM")).toBe(false);
    expect(
      COMMAND_REGISTRY.some((c) => c.title === "Go to Reception"),
    ).toBe(true);
  });

  it("keeps Summer as AI Business Manager", () => {
    const summer = COMMAND_REGISTRY.find((c) => c.id === "go-summer");
    expect(summer?.subtitle).toMatch(/AI Business Manager/i);
    expect(summer?.href).toBe("/dashboard/ai-workforce/summer");
  });

  it("matches reception and customer keywords", () => {
    expect(matchCommandRegistry("reception").some((c) => c.id === "go-calendar")).toBe(
      true,
    );
    expect(matchCommandRegistry("customers").some((c) => c.id === "go-crm")).toBe(
      true,
    );
  });

  it("exports the open-palette event used by the header trigger", () => {
    expect(COMMAND_PALETTE_EVENT).toBe("chasum-open-command-palette");
  });
});
