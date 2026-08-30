import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { StatusExperience } from "@/components/landing/status-experience";
import { CONTACT_HREF } from "@/lib/marketing/alpha";
import {
  STATUS_ISSUES,
  STATUS_LAST_UPDATED,
  STATUS_LEGEND,
  STATUS_MAINTENANCE,
  STATUS_SERVICES,
} from "@/lib/marketing/resources-status";

const STATUS_COPY = path.join(
  process.cwd(),
  "lib/marketing/resources-status.ts",
);
const STATUS_EXPERIENCE = path.join(
  process.cwd(),
  "components/landing/status-experience.tsx",
);
const STATUS_PAGE = path.join(
  process.cwd(),
  "app/(marketing)/status/page.tsx",
);

const FORBIDDEN_MONITORING =
  /99\.9%|99\.5%|uptime guarantee|\bSLA\b|24\/7 monitoring|real-time monitoring|continuous monitoring|Statuspage\.io|Better Uptime|PagerDuty/i;

const FORBIDDEN_INTERNALS =
  /create_public_appointment|migration 013|appointment_status|f8478a8|cursor\/phase-5-booking-path-convergence/i;

function serviceRow(name: string) {
  const label = screen.getByText(name);
  const row = label.closest("li");
  expect(row).not.toBeNull();
  return row as HTMLElement;
}

describe("Status page product-truth", () => {
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

  it("renders Application and dashboard as Operational", () => {
    render(<StatusExperience />);
    expect(
      within(serviceRow("Application and dashboard")).getByText("Operational"),
    ).toBeInTheDocument();
    expect(STATUS_SERVICES[0]).toMatchObject({
      name: "Application and dashboard",
      status: "Operational",
    });
  });

  it("renders Public booking as Limited", () => {
    render(<StatusExperience />);
    expect(
      within(serviceRow("Public booking")).getByText("Limited"),
    ).toBeInTheDocument();
    expect(STATUS_SERVICES[1]).toMatchObject({
      name: "Public booking",
      status: "Limited",
    });
  });

  it("renders Database and authentication as Operational", () => {
    render(<StatusExperience />);
    expect(
      within(serviceRow("Database and authentication")).getByText(
        "Operational",
      ),
    ).toBeInTheDocument();
    expect(STATUS_SERVICES[2]).toMatchObject({
      name: "Database and authentication",
      status: "Operational",
    });
  });

  it("renders Customer email delivery as Configuration Required", () => {
    render(<StatusExperience />);
    expect(
      within(serviceRow("Customer email delivery")).getByText(
        "Configuration Required",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Customer email delivery depends on platform email configuration and each business’s messaging settings.",
      ),
    ).toBeInTheDocument();
  });

  it("renders SMS delivery as Configuration Required", () => {
    render(<StatusExperience />);
    expect(
      within(serviceRow("SMS delivery")).getByText("Configuration Required"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "SMS delivery depends on business messaging configuration and plan eligibility.",
      ),
    ).toBeInTheDocument();
  });

  it("renders Customer payment integrations as Configuration Required", () => {
    render(<StatusExperience />);
    expect(
      within(serviceRow("Customer payment integrations")).getByText(
        "Configuration Required",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Customer payment collection depends on the business’s payment setup.",
      ),
    ).toBeInTheDocument();
  });

  it("uses the corrected Operational legend", () => {
    render(<StatusExperience />);
    expect(
      screen.getByText(
        "No known service interruption as of the last manual review.",
      ),
    ).toBeInTheDocument();
    expect(
      STATUS_LEGEND.find((item) => item.status === "Operational")?.meaning,
    ).toBe("No known service interruption as of the last manual review.");
  });

  it("renders Last manually reviewed and does not keep the stale 2026-07-30 stamp", () => {
    render(<StatusExperience />);
    expect(screen.getByText(/Last manually reviewed:/)).toBeInTheDocument();
    expect(screen.getByText(STATUS_LAST_UPDATED)).toBeInTheDocument();
    expect(STATUS_LAST_UPDATED).not.toBe("2026-07-30");
    expect(screen.queryByText("2026-07-30")).not.toBeInTheDocument();

    const copy = readFileSync(STATUS_COPY, "utf8");
    const experience = readFileSync(STATUS_EXPERIENCE, "utf8");
    expect(copy).not.toContain("2026-07-30");
    expect(experience).not.toContain("2026-07-30");
    expect(experience).toContain("Last manually reviewed:");
  });

  it("lists the approved public-booking known issue without internals", () => {
    render(<StatusExperience />);
    expect(
      screen.getByText(
        "Public bookings that require selecting a specific staff member may fail during confirmation, and no appointment is created in that case. A fix is in progress.",
      ),
    ).toBeInTheDocument();
    expect(STATUS_ISSUES.body).toBe(
      "Public bookings that require selecting a specific staff member may fail during confirmation, and no appointment is created in that case. A fix is in progress.",
    );
    expect(screen.queryByText(/platform-wide issues/i)).not.toBeInTheDocument();

    const copy = readFileSync(STATUS_COPY, "utf8");
    const experience = readFileSync(STATUS_EXPERIENCE, "utf8");
    const page = readFileSync(STATUS_PAGE, "utf8");
    for (const source of [copy, experience, page]) {
      expect(source).not.toMatch(FORBIDDEN_INTERNALS);
    }
  });

  it("keeps Planned Maintenance truthful", () => {
    render(<StatusExperience />);
    expect(
      screen.getByRole("heading", { name: "Planned Maintenance" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No planned maintenance is scheduled at this time. When maintenance is planned, it will be listed here.",
      ),
    ).toBeInTheDocument();
    expect(STATUS_MAINTENANCE.body).toContain(
      "No planned maintenance is scheduled at this time.",
    );
  });

  it("keeps Contact Support on /contact#support", () => {
    render(<StatusExperience />);
    expect(
      screen.getByRole("link", { name: "Contact Support" }),
    ).toHaveAttribute("href", `${CONTACT_HREF}#support`);
    expect(`${CONTACT_HREF}#support`).toBe("/contact#support");
  });

  it("does not nest buttons inside the Status CTA link", () => {
    const { container } = render(<StatusExperience />);
    const support = container.querySelector(
      '[aria-labelledby="status-support-heading"]',
    );
    expect(support).not.toBeNull();
    expect(
      within(support as HTMLElement).queryAllByRole("button").length,
    ).toBe(0);
    expect(container.querySelectorAll("a button, button a").length).toBe(0);

    const source = readFileSync(STATUS_EXPERIENCE, "utf8");
    expect(source).not.toContain("<Button");
  });

  it("does not introduce uptime, SLA, or live-monitoring claims", () => {
    const copy = readFileSync(STATUS_COPY, "utf8");
    const experience = readFileSync(STATUS_EXPERIENCE, "utf8");
    const page = readFileSync(STATUS_PAGE, "utf8");
    expect(copy).not.toMatch(FORBIDDEN_MONITORING);
    expect(experience).not.toMatch(FORBIDDEN_MONITORING);
    expect(page).not.toMatch(FORBIDDEN_MONITORING);
    expect(copy).toContain(
      "During Private Alpha, this page is manually reviewed and updated as needed.",
    );
  });
});
