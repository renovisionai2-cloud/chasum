import { describe, expect, it } from "vitest";
import { COMMAND_REGISTRY, matchCommandRegistry } from "@/lib/command/registry";
import { COMMAND_PALETTE_EVENT } from "@/lib/reception/workflow-events";

describe("command palette registry (Chapter 1 foundation)", () => {
  it("uses Customers and Reception wording", () => {
    expect(
      COMMAND_REGISTRY.some((c) => c.title === "Go to Customers"),
    ).toBe(true);
    expect(COMMAND_REGISTRY.some((c) => c.title === "Go to CRM")).toBe(false);
    expect(
      COMMAND_REGISTRY.some((c) => c.title === "Go to Reception"),
    ).toBe(true);
  });

  it("navigates to Command Centre at /dashboard", () => {
    const centre = COMMAND_REGISTRY.find((c) => c.id === "go-overview");
    expect(centre?.title).toBe("Go to Command Centre");
    expect(centre?.href).toBe("/dashboard");
  });

  it("keeps Summer as AI Business Manager Early Access", () => {
    const summer = COMMAND_REGISTRY.find((c) => c.id === "go-summer");
    expect(summer?.subtitle).toMatch(/AI Business Manager/i);
    expect(summer?.subtitle).toMatch(/Early Access/i);
    expect(summer?.href).toBe("/dashboard/ai-workforce/summer");
    expect(summer?.keywords).not.toContain("receptionist");
  });

  it("exposes Communications and real booking action", () => {
    expect(
      COMMAND_REGISTRY.some((c) => c.id === "go-communications"),
    ).toBe(true);
    const book = COMMAND_REGISTRY.find((c) => c.id === "book-customer");
    expect(book?.href).toContain("/dashboard/calendar");
    expect(book?.href).toContain("book=1");
  });

  it("marks HQ commands as owner-only", () => {
    expect(COMMAND_REGISTRY.find((c) => c.id === "go-hq")?.ownerOnly).toBe(
      true,
    );
    expect(
      COMMAND_REGISTRY.find((c) => c.id === "go-private-alpha")?.ownerOnly,
    ).toBe(true);
  });

  it("matches reception and customer keywords", () => {
    expect(matchCommandRegistry("reception").some((c) => c.id === "go-calendar")).toBe(
      true,
    );
    expect(matchCommandRegistry("customers").some((c) => c.id === "go-crm")).toBe(
      true,
    );
    expect(
      matchCommandRegistry("command centre").some((c) => c.id === "go-overview"),
    ).toBe(true);
  });

  it("exports the open-palette event used by the header trigger", () => {
    expect(COMMAND_PALETTE_EVENT).toBe("chasum-open-command-palette");
  });
});
