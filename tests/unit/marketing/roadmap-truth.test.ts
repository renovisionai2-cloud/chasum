import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ROADMAP_CLOSING,
  ROADMAP_HERO,
  ROADMAP_ITEMS,
  ROADMAP_STAGES,
  ROADMAP_STATUS_ORDER,
  roadmapItemsByStatus,
} from "@/lib/marketing/roadmap";
import { INDUSTRIES_HERO } from "@/lib/marketing/industries-page";
import { CHASUM_CATEGORY_SHORT } from "@/lib/marketing/os-positioning";
import { PLATFORM_STORY } from "@/lib/marketing/platform-page";
import { PRODUCT_TOUR_INTRO } from "@/lib/marketing/product-tour-page";

const PUBLIC_COPY = [
  ROADMAP_HERO.headline,
  ROADMAP_HERO.lede,
  ...ROADMAP_STATUS_ORDER.flatMap((status) => [
    ROADMAP_STAGES[status].title,
    ROADMAP_STAGES[status].subtitle,
  ]),
  ...ROADMAP_ITEMS.flatMap((item) => [
    item.title,
    item.description,
    item.qualification ?? "",
  ]),
  ...ROADMAP_CLOSING.paragraphs,
].join("\n");

describe("Roadmap current-generation product truth", () => {
  it("uses the approved four-stage model and OS hero", () => {
    expect(ROADMAP_STATUS_ORDER).toEqual([
      "private_alpha",
      "in_development",
      "coming_next",
      "future_direction",
    ]);
    expect(ROADMAP_STAGES.private_alpha.title).toBe(
      "Available in Private Alpha",
    );
    expect(ROADMAP_STAGES.in_development.title).toBe("In Development");
    expect(ROADMAP_STAGES.coming_next.title).toBe("Coming Next");
    expect(ROADMAP_STAGES.future_direction.title).toBe("Future Direction");
    expect(ROADMAP_HERO.headline).toBe(
      "Building the AI operating system for service businesses.",
    );
    expect(ROADMAP_HERO.lede).toMatch(/alongside real service businesses/i);
    expect(ROADMAP_HERO.lede).toMatch(/not trends/i);
  });

  it("does not restore the previous three-stage model or GA overclaim", () => {
    expect(PUBLIC_COPY).not.toMatch(/Available in Chasum Today/i);
    expect(PUBLIC_COPY).not.toMatch(/Coming Soon/i);
    expect(PUBLIC_COPY).not.toMatch(/Future Vision/i);
    expect(PUBLIC_COPY).not.toMatch(
      /Building the Future of Business Management/i,
    );
    expect(PUBLIC_COPY).not.toMatch(/actively building/i);
    expect(PUBLIC_COPY).not.toMatch(/several years/i);
    expect(PUBLIC_COPY).not.toMatch(/\bAMBER\b/);
    expect(PUBLIC_COPY).not.toMatch(
      /Late September|October 2026|December 2026|February 2027|Mid\/Late 2027/i,
    );
    expect(ROADMAP_CLOSING.paragraphs.join(" ")).not.toMatch(
      /just getting started/i,
    );
  });

  it("keeps a controlled Private Alpha grid and living status on every item", () => {
    const available = roadmapItemsByStatus("private_alpha");
    const developing = roadmapItemsByStatus("in_development");
    const next = roadmapItemsByStatus("coming_next");
    const future = roadmapItemsByStatus("future_direction");

    expect(available.map((item) => item.title)).toEqual([
      "Online Booking",
      "Calendar & Scheduling",
      "Customers",
      "Team & Employees",
      "Locations",
      "Payments & Financials",
      "Gift Certificates",
      "Memberships & Packages",
      "Customer Communications",
      "Reports",
      "Command Centre",
      "Summer, AI Business Manager",
    ]);
    expect(available.length).toBeGreaterThanOrEqual(10);
    expect(available.length).toBeLessThanOrEqual(12);
    expect(developing.map((item) => item.title)).toEqual([
      "Core Booking & Calendar Reliability",
      "Online Payments & Commerce Depth",
    ]);
    expect(developing.length).toBeGreaterThanOrEqual(2);
    expect(developing.length).toBeLessThanOrEqual(4);
    expect(next.map((item) => item.title)).toEqual([
      "Native Mobile Apps",
      "Team Access",
      "AI Workflow Automation",
    ]);
    expect(future.map((item) => item.title)).toEqual([
      "AI Phone Calls",
      "Inventory Management",
      "Payroll",
      "Marketing Campaigns",
      "Advanced Multi-location Operations",
      "Franchise Management",
      "Customer Loyalty",
      "Marketplace",
      "Proactive Intelligence",
    ]);

    const ids = ROADMAP_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    const titles = ROADMAP_ITEMS.map((item) => item.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("keeps booking, payments, communications, and Summer honest", () => {
    const booking = ROADMAP_ITEMS.find((item) => item.id === "online-booking");
    expect(booking?.qualification).toMatch(/reliability continues to improve/i);

    const payments = ROADMAP_ITEMS.find(
      (item) => item.id === "payments-financials",
    );
    expect(payments?.description).toMatch(/invoices and receipts/i);
    expect(payments?.qualification).toMatch(/manual-first/i);
    expect(payments?.qualification).toMatch(/card collection/i);

    const communications = ROADMAP_ITEMS.find(
      (item) => item.id === "customer-communications",
    );
    expect(communications?.description).toMatch(/sms reminders/i);
    expect(communications?.qualification).toMatch(/eligible plan/i);
    expect(communications?.qualification).toMatch(/not ai phone/i);

    const summer = ROADMAP_ITEMS.find((item) => item.id === "summer");
    expect(summer?.title).toMatch(/AI Business Manager/i);
    expect(summer?.description).toMatch(/observes, understands, and recommends/i);
    expect(summer?.qualification).toMatch(/not autonomous/i);
    expect(PUBLIC_COPY).not.toMatch(/autonomous operation today/i);
  });

  it("places memberships, locations, native, and automation at the truthful stage", () => {
    expect(
      ROADMAP_ITEMS.find((item) => item.id === "memberships-packages")?.status,
    ).toBe("private_alpha");
    expect(ROADMAP_ITEMS.find((item) => item.id === "locations")?.status).toBe(
      "private_alpha",
    );
    expect(
      ROADMAP_ITEMS.find((item) => item.id === "advanced-multi-location")
        ?.status,
    ).toBe("future_direction");
    expect(
      ROADMAP_ITEMS.find((item) => item.id === "native-mobile-apps")?.status,
    ).toBe("coming_next");
    expect(PUBLIC_COPY).not.toMatch(/React Native|Expo/i);

    const automationTitles = ROADMAP_ITEMS.filter((item) =>
      /workflow automation/i.test(item.title),
    );
    expect(automationTitles).toHaveLength(1);
    expect(automationTitles[0]?.status).toBe("coming_next");
    expect(ROADMAP_ITEMS.some((item) => item.title === "Workflow Automation")).toBe(
      false,
    );
    expect(
      ROADMAP_ITEMS.some((item) => item.title === "AI Business Insights"),
    ).toBe(false);
    expect(
      ROADMAP_ITEMS.some((item) => item.title === "Multi-location Management"),
    ).toBe(false);
  });

  it("does not leak internal engineering language or inventory overclaim", () => {
    expect(PUBLIC_COPY).not.toMatch(
      /create_public_appointment|Phase 5|RPC|12:10|Gate B|AMBER/i,
    );
    expect(
      ROADMAP_ITEMS.find((item) => item.id === "inventory-management")?.status,
    ).toBe("future_direction");
    expect(
      ROADMAP_ITEMS.find((item) => item.id === "ai-phone-calls")?.status,
    ).toBe("future_direction");
  });

  it("renders from typed status and preserves locked neighboring surfaces", () => {
    const experience = readFileSync(
      path.join(process.cwd(), "components/landing/roadmap-experience.tsx"),
      "utf8",
    );
    const data = readFileSync(
      path.join(process.cwd(), "lib/marketing/roadmap.ts"),
      "utf8",
    );
    expect(experience).toContain("roadmapItemsByStatus");
    expect(experience).toContain("ROADMAP_STATUS_ORDER");
    expect(data).toContain("type RoadmapStatus");
    expect(data).toContain("future_direction → coming_next → in_development → private_alpha");

    expect(CHASUM_CATEGORY_SHORT).toBe(
      "The AI Business Operating System for Service Businesses",
    );
    expect(PLATFORM_STORY.headline).toMatch(/one intelligent operating system/i);
    expect(PRODUCT_TOUR_INTRO.headline).toBe(
      "One customer journey. One connected record.",
    );
    expect(INDUSTRIES_HERO.headline).toBe(
      "Built around the way service businesses actually work.",
    );
  });
});
