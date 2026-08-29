import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import ContactPage from "@/app/(marketing)/contact/page";
import {
  APPLY_HREF,
  CTA_DEMO_LABEL,
  DEMO_HREF,
  DEMO_MAILTO_FALLBACK,
  SECURITY_HREF,
} from "@/lib/marketing/alpha";

const CONTACT_PAGE = path.join(
  process.cwd(),
  "app/(marketing)/contact/page.tsx",
);

const WALKTHROUGH_MAILTO =
  "mailto:sales@chasumai.com?subject=Chasum%20Private%20Alpha%20Walkthrough";
const SUPPORT_MAILTO =
  "mailto:sales@chasumai.com?subject=Chasum%20Design%20Partner%20Support";
const SECURITY_MAILTO =
  "mailto:sales@chasumai.com?subject=Chasum%20Security%20Concern";

describe("Contact page routing truth", () => {
  it("renders the four contact paths", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("heading", { name: "Private Alpha" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Product Walkthrough" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Existing Design Partner" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Security Concern" }),
    ).toBeInTheDocument();
  });

  it("keeps the Product Walkthrough anchor, local CTA label, and mailto", () => {
    const { container } = render(<ContactPage />);
    const section = container.querySelector("#walkthrough");
    expect(section).not.toBeNull();
    expect(section).toHaveAttribute("id", "walkthrough");

    const cta = within(section as HTMLElement).getByRole("link", {
      name: "Request a Walkthrough",
    });
    expect(cta.tagName).toBe("A");
    expect(cta).toHaveAttribute("href", WALKTHROUGH_MAILTO);
    expect(cta).toHaveAttribute("href", DEMO_MAILTO_FALLBACK);
    expect(cta.querySelector("button")).toBeNull();
  });

  it("keeps the Existing Design Partner anchor and support mailto", () => {
    const { container } = render(<ContactPage />);
    const section = container.querySelector("#support");
    expect(section).not.toBeNull();
    expect(section).toHaveAttribute("id", "support");

    const cta = within(section as HTMLElement).getByRole("link", {
      name: "Contact Support",
    });
    expect(cta).toHaveAttribute("href", SUPPORT_MAILTO);
    expect(cta.querySelector("button")).toBeNull();
  });

  it("keeps the Security Concern mailto and overview route", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("link", { name: "Report a Security Concern" }),
    ).toHaveAttribute("href", SECURITY_MAILTO);
    expect(
      screen.getByRole("link", { name: "Security overview" }),
    ).toHaveAttribute("href", SECURITY_HREF);
    expect(SECURITY_HREF).toBe("/security");
  });

  it("routes Private Alpha Apply CTAs to /apply", () => {
    render(<ContactPage />);
    const applyLinks = screen.getAllByRole("link", {
      name: "Apply for Private Alpha",
    });
    expect(applyLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of applyLinks) {
      expect(link).toHaveAttribute("href", APPLY_HREF);
    }
    expect(APPLY_HREF).toBe("/apply");
  });

  it("is a routing page with no form and no design-partner server action", () => {
    const { container } = render(<ContactPage />);
    expect(container.querySelector("form")).toBeNull();

    const source = readFileSync(CONTACT_PAGE, "utf8");
    expect(source).not.toMatch(/<form[\s>]/i);
    expect(source).not.toMatch(
      /design-partner|submitDesignPartnerApplication/,
    );
    expect(source).not.toMatch(/\bResend\b/);
  });

  it("does not nest buttons inside Contact card CTA anchors", () => {
    const { container } = render(<ContactPage />);
    const nested = container.querySelectorAll("a button, button a");
    expect(nested.length).toBe(0);

    const source = readFileSync(CONTACT_PAGE, "utf8");
    expect(source).not.toContain("<Button");
    expect(source).not.toMatch(/<Link[^>]*>[\s\S]*?<Button/);
    expect(source).not.toMatch(/<a[^>]*>[\s\S]*?<Button/);
  });

  it("does not reuse the shared Schedule a Demo label on Contact", () => {
    const source = readFileSync(CONTACT_PAGE, "utf8");
    expect(source).not.toContain("CTA_DEMO_LABEL");
    expect(source).not.toContain("Schedule a Demo");
    expect(source).toContain("Request a Walkthrough");
    expect(CTA_DEMO_LABEL).toBe("Schedule a Demo");
    expect(DEMO_HREF).toBe("/contact#walkthrough");
  });
});
