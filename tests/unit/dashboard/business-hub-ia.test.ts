import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  RETIRED_BUSINESS_HUB_SERVICES_TAB,
  parseBusinessHubTab,
} from "@/lib/dashboard/business-hub-tabs";

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Business setup hub IA", () => {
  it("relabels Notifications and Automation without merging systems", () => {
    const hub = read("components/business/business-hub.tsx");
    expect(hub).toMatch(/label:\s*"Booking notifications"/);
    expect(hub).toMatch(/label:\s*"Business rules"/);
    expect(hub).not.toMatch(/label:\s*"Notifications"/);
    expect(hub).not.toMatch(/key:\s*"automation", label:\s*"Automation"/);
    expect(hub).toMatch(/key:\s*"notifications"/);
    expect(hub).toMatch(/key:\s*"automation"/);
    const automationsPage = read(
      "app/(dashboard)/dashboard/automation/page.tsx",
    );
    expect(automationsPage).toMatch(/Automations/);
  });

  it("removes the duplicate Hub Services tab and redirects old URLs", () => {
    const hub = read("components/business/business-hub.tsx");
    expect(hub).not.toMatch(/key:\s*"services"/);
    expect(hub).toMatch(/key:\s*"categories"/);
    expect(hub).toMatch(/Catalog → Services/);
    const page = read("app/(dashboard)/dashboard/business/page.tsx");
    expect(page).toContain("RETIRED_BUSINESS_HUB_SERVICES_TAB");
    expect(page).toContain('redirect("/dashboard/services")');
    expect(RETIRED_BUSINESS_HUB_SERVICES_TAB).toBe("services");
    expect(parseBusinessHubTab("services")).toBeNull();
    expect(parseBusinessHubTab("hours")).toBe("hours");
  });

  it("keeps Memberships and Custom Forms Preview / Coming Soon", () => {
    const hub = read("components/business/business-hub.tsx");
    expect(hub).toMatch(/MEMBERSHIPS_STATUS_LABEL/);
    expect(hub).toMatch(/MEMBERSHIPS_PREVIEW_NOTICE/);
    expect(hub).toMatch(/CUSTOM_FORMS_STATUS_LABEL/);
    expect(hub).toMatch(/CUSTOM_FORMS_PREVIEW_NOTICE/);
  });

  it("syncs selected hub tabs to the URL", () => {
    const hub = read("components/business/business-hub.tsx");
    expect(hub).toMatch(/router\.replace\(businessHubHref/);
    expect(hub).toMatch(/parseBusinessHubTab\(tabQuery\)/);
  });

  it("titles the workspace Business setup", () => {
    const page = read("app/(dashboard)/dashboard/business/page.tsx");
    expect(page).toMatch(/title: "Business setup"/);
    expect(page).toMatch(/title="Business setup"/);
  });
});
