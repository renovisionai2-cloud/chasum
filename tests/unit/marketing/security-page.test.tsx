import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { SecurityExperience } from "@/components/landing/security-experience";
import { CONTACT_HREF, STATUS_HREF } from "@/lib/marketing/alpha";
import {
  SECURITY_CARDS,
  SECURITY_TRANSPARENCY,
} from "@/lib/marketing/resources-security";

const SECURITY_COPY = path.join(
  process.cwd(),
  "lib/marketing/resources-security.ts",
);
const SECURITY_EXPERIENCE = path.join(
  process.cwd(),
  "components/landing/security-experience.tsx",
);
const SECURITY_PAGE = path.join(
  process.cwd(),
  "app/(marketing)/security/page.tsx",
);

const FORBIDDEN_COMPLIANCE =
  /SOC\s*2|SOC\s*1|ISO\s*27001|PCI\s*DSS|HIPAA|PIPEDA|GDPR|CCPA|PHIPA|HITECH|CSA\s*STAR|penetration tested|certified|compliant|audited/i;

describe("Security page product-truth", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    class IntersectionObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      configurable: true,
      value: IntersectionObserverMock,
    });
  });

  it("renders the six corrected card titles", () => {
    render(<SecurityExperience />);
    expect(
      screen.getByRole("heading", { name: "Secure Authentication" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Protected Business Data" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Encrypted Connections" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Trusted Infrastructure" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Managed Data Infrastructure" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Continuous Security Improvements",
      }),
    ).toBeInTheDocument();
  });

  it("uses the approved Secure Authentication wording", () => {
    render(<SecurityExperience />);
    expect(
      screen.getByText(
        "Accounts use Supabase-powered authentication with secure sign-in and session handling.",
      ),
    ).toBeInTheDocument();
  });

  it("uses conservative Protected Business Data wording", () => {
    render(<SecurityExperience />);
    expect(
      screen.getByText(
        "Business data is organized within its own workspace, with access controls designed to keep it separate from other businesses.",
      ),
    ).toBeInTheDocument();
  });

  it("narrows Encrypted Connections to HTTPS to Chasum", () => {
    render(<SecurityExperience />);
    expect(
      screen.getByText("Connections to Chasum use HTTPS."),
    ).toBeInTheDocument();
  });

  it("keeps Trusted Infrastructure generic and omits Stripe, Twilio, and Sentry", () => {
    render(<SecurityExperience />);
    expect(
      screen.getByText(
        "Chasum uses established cloud providers for hosting, authentication, data storage, and communications.",
      ),
    ).toBeInTheDocument();

    const copy = readFileSync(SECURITY_COPY, "utf8");
    const experience = readFileSync(SECURITY_EXPERIENCE, "utf8");
    const page = readFileSync(SECURITY_PAGE, "utf8");
    for (const source of [copy, experience, page]) {
      expect(source).not.toMatch(/\bStripe\b/);
      expect(source).not.toMatch(/\bTwilio\b/);
      expect(source).not.toMatch(/\bSentry\b/);
    }
  });

  it("replaces Automatic Backups with Managed Data Infrastructure without backup claims", () => {
    render(<SecurityExperience />);
    expect(
      screen.queryByRole("heading", { name: "Automatic Backups" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Managed Data Infrastructure" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Business data is stored using managed cloud infrastructure.",
      ),
    ).toBeInTheDocument();

    const dataCard = SECURITY_CARDS.find(
      (card) => card.title === "Managed Data Infrastructure",
    );
    expect(dataCard).toBeDefined();
    expect(dataCard?.detail.toLowerCase()).not.toMatch(
      /backup|backups|pitr|point-in-time|rpo|rto/,
    );
  });

  it("preserves Private Alpha Transparency bullets and closing note", () => {
    render(<SecurityExperience />);
    expect(
      screen.getByText("We don't claim certifications we haven't earned."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We continuously improve security as Chasum grows."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We follow responsible engineering practices."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We value transparency over marketing language."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Private Alpha is not a finished enterprise security program. Production-critical guarantees, when needed, are confirmed in writing during onboarding—not as vague public promises.",
      ),
    ).toBeInTheDocument();

    expect(SECURITY_TRANSPARENCY.points).toEqual([
      "We don't claim certifications we haven't earned.",
      "We continuously improve security as Chasum grows.",
      "We follow responsible engineering practices.",
      "We value transparency over marketing language.",
    ]);
    expect(SECURITY_TRANSPARENCY.note).toBe(
      "Private Alpha is not a finished enterprise security program. Production-critical guarantees, when needed, are confirmed in writing during onboarding—not as vague public promises.",
    );
  });

  it("keeps Status and Contact Support destinations", () => {
    render(<SecurityExperience />);
    expect(
      screen.getByRole("link", { name: "View System Status" }),
    ).toHaveAttribute("href", STATUS_HREF);
    expect(STATUS_HREF).toBe("/status");
    expect(
      screen.getByRole("link", { name: "Contact Support" }),
    ).toHaveAttribute("href", `${CONTACT_HREF}#support`);
    expect(`${CONTACT_HREF}#support`).toBe("/contact#support");
  });

  it("does not nest buttons inside Security CTA links", () => {
    const { container } = render(<SecurityExperience />);
    const support = container.querySelector(
      '[aria-labelledby="security-support-heading"]',
    );
    expect(support).not.toBeNull();
    expect(
      within(support as HTMLElement).queryAllByRole("button").length,
    ).toBe(0);
    expect(container.querySelectorAll("a button, button a").length).toBe(0);

    const source = readFileSync(SECURITY_EXPERIENCE, "utf8");
    expect(source).not.toContain("<Button");
  });

  it("does not introduce certification or compliance claims", () => {
    const copy = readFileSync(SECURITY_COPY, "utf8");
    const experience = readFileSync(SECURITY_EXPERIENCE, "utf8");
    const page = readFileSync(SECURITY_PAGE, "utf8");
    expect(copy).not.toMatch(FORBIDDEN_COMPLIANCE);
    expect(experience).not.toMatch(FORBIDDEN_COMPLIANCE);
    expect(page).not.toMatch(FORBIDDEN_COMPLIANCE);
  });
});
