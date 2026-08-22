import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrivateAlphaWorkspace } from "@/components/hq/private-alpha-workspace";
import {
  HQ_FOUNDER_PREVIEW_NOTICE,
  HQ_FOUNDER_PREVIEW_STATUS_LABEL,
} from "@/lib/hq/founder-preview-truth";
import type { PrivateAlphaSnapshot } from "@/lib/hq/private-alpha/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const snapshot: PrivateAlphaSnapshot = {
  generatedAt: "2026-08-22T12:00:00.000Z",
  partners: [],
  feedback: [],
  support: [],
  weeklyReport: {
    weekOf: "2026-08-18",
    summary: "Seeded weekly summary for founder review.",
    companies: [],
  },
  founderNotes: [],
  totals: {
    partners: 0,
    active: 0,
    onboarding: 0,
    atRisk: 0,
    openSupport: 0,
    openFeedback: 0,
    avgHealth: 0,
  },
};

describe("HQ founder preview honesty", () => {
  it("discloses seeded operating data and does not claim a live system of record", () => {
    expect(HQ_FOUNDER_PREVIEW_STATUS_LABEL).toBe("Founder Preview");
    expect(HQ_FOUNDER_PREVIEW_NOTICE).toMatch(/seeded operating data/i);
    expect(HQ_FOUNDER_PREVIEW_NOTICE).toMatch(/not a live system of record/i);
    expect(HQ_FOUNDER_PREVIEW_NOTICE).not.toMatch(/live production metrics/i);
    expect(HQ_FOUNDER_PREVIEW_NOTICE).not.toMatch(/system of record for all tenants/i);
  });

  it("shows the Founder Preview disclosure on Private Alpha", () => {
    render(<PrivateAlphaWorkspace snapshot={snapshot} />);
    expect(screen.getAllByText(/Founder Preview/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/seeded operating data/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/not a live system of record/i).length).toBeGreaterThan(0);
  });

  it("keeps the same honesty treatment on Platform Admin HQ", () => {
    const src = readFileSync(
      join(process.cwd(), "components/hq/hq-workspace.tsx"),
      "utf8",
    );
    expect(src).toContain("HQ_FOUNDER_PREVIEW_NOTICE");
    expect(src).toContain("HQ_FOUNDER_PREVIEW_STATUS_LABEL");
    expect(src).not.toMatch(/live system of record for all tenants/i);
  });
});
