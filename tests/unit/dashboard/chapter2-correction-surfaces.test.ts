import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Summer portal identity", () => {
  it("customer-facing Summer workspace does not call Summer an AI receptionist", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "components/summer/summer-reception-workspace.tsx",
      ),
      "utf8",
    );
    expect(src).toMatch(/AI Business Manager/);
    expect(src).not.toMatch(/AI receptionist/i);
  });

  it("Summer orchestrator default greeting uses AI Business Manager", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/summer/orchestrator.ts"),
      "utf8",
    );
    expect(src).toMatch(/AI Business Manager/);
    expect(src).not.toMatch(/AI receptionist/i);
  });
});

describe("Financial terminology surfaces", () => {
  it("Payments dashboard uses gross payments collected language", () => {
    const src = readFileSync(
      join(process.cwd(), "components/commerce/payments-dashboard.tsx"),
      "utf8",
    );
    expect(src).toMatch(/Gross payments collected today/);
    expect(src).not.toMatch(/label="Revenue today"/);
  });

  it("Chase commerce cards use gross payments collected, not revenue", () => {
    const src = readFileSync(
      join(process.cwd(), "components/chase/chase-ops-workspace.tsx"),
      "utf8",
    );
    expect(src).toMatch(/Gross payments collected today/);
    expect(src).not.toMatch(/label="Revenue today"/);
  });

  it("Reports executive cards use payments collected language", () => {
    const src = readFileSync(
      join(process.cwd(), "components/reports/reports-hub.tsx"),
      "utf8",
    );
    expect(src).toMatch(/Gross payments collected today/);
    expect(src).not.toMatch(/title="Revenue today"/);
    expect(src).not.toMatch(/\{ key: "inventory", label: "Inventory" \}/);
    expect(src).not.toMatch(/title="Membership revenue"/);
  });

  it("Reports outstanding invoices use commerce SoT, not legacy pending payment events", () => {
    const reportsAction = readFileSync(
      join(process.cwd(), "lib/actions/reports.ts"),
      "utf8",
    );
    expect(reportsAction).toMatch(
      /outstandingInvoicesCents = commerceSnap\.outstandingInvoicesCents/,
    );
    expect(reportsAction).not.toMatch(
      /outstandingInvoicesCents = payments\s*\n\s*\.filter\(\(p\) => p\.status === "pending"\)/,
    );
    const paymentsUi = readFileSync(
      join(process.cwd(), "components/commerce/payments-dashboard.tsx"),
      "utf8",
    );
    expect(paymentsUi).toMatch(/outstandingInvoicesCents/);
    const cc = readFileSync(
      join(process.cwd(), "lib/actions/command-centre.ts"),
      "utf8",
    );
    expect(cc).toMatch(/commerce\.outstandingInvoicesCount/);
  });

  it("Command Centre attention areas are not labeled outstanding actions", () => {
    const src = readFileSync(
      join(process.cwd(), "components/dashboard/command-centre.tsx"),
      "utf8",
    );
    expect(src).toMatch(/Attention areas/);
    expect(src).not.toMatch(/title="Outstanding actions"/);
  });
});

describe("Automations page title", () => {
  it("uses Automations plural", () => {
    const src = readFileSync(
      join(process.cwd(), "app/(dashboard)/dashboard/automation/page.tsx"),
      "utf8",
    );
    expect(src).toMatch(/title: "Automations"/);
    expect(src).toMatch(/title="Automations"/);
  });
});

describe("AI Workforce truthful status", () => {
  it("discloses preview status and does not show fake Available now KPI", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "components/ai-workforce/workforce-dashboard.tsx",
      ),
      "utf8",
    );
    expect(src).toMatch(/Future Vision|Coming Later|Preview/i);
    expect(src).toMatch(/Summer is the only/);
    expect(src).not.toMatch(/title="Available now"/);
    expect(src).not.toMatch(/AI_ACTIVITY_PREVIEW/);
  });
});
