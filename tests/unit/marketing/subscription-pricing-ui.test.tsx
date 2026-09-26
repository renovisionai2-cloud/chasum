import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Pricing } from "@/components/landing/pricing";

// jsdom has no media queries; exercise the real page in reduced-motion mode.
beforeEach(() => vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
  matches: true,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pricing page subscription presentation", () => {
  it("keeps the native toggle keyboard-operable with clear annual payment and unchanged links", async () => {
    const user = userEvent.setup();
    render(<Pricing />);
    const group = screen.getByRole("group", { name: "Billing period" });
    const monthly = within(group).getByRole("button", { name: "Monthly" });
    const yearly = within(group).getByRole("button", { name: "Yearly" });
    expect(yearly.querySelector("span")).not.toBeInTheDocument();
    expect(within(yearly).queryByText("2 months free")).not.toBeInTheDocument();
    expect(within(group).getByText("Pay for 10 months and receive 2 months free.")).toBeVisible();
    expect(monthly).toHaveAttribute("aria-pressed", "true");
    expect(yearly).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByText("Pay for 10 months and receive 2 months free.").length).toBeGreaterThan(0);
    const professional = screen.getByRole("heading", { name: "Professional" }).closest("article")!;
    expect(within(professional).getByText("CAD $79")).toBeVisible();
    monthly.focus();
    await user.tab();
    expect(yearly).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(yearly).toHaveAttribute("aria-pressed", "true");
    expect(monthly).toHaveAttribute("aria-pressed", "false");
    expect(within(professional).getByText("CAD $790")).toBeVisible();
    expect(within(professional).getByText("/year")).toBeVisible();
    expect(within(professional).getByText("Paid upfront for 12 months.")).toBeVisible();
    const business = screen.getByRole("heading", { name: "Business" }).closest("article")!;
    expect(within(business).getByText("CAD $1,490")).toBeVisible();
    await user.tab({ shift: true });
    await user.keyboard(" ");
    expect(monthly).toHaveAttribute("aria-pressed", "true");
    expect(within(professional).getByText("CAD $79")).toBeVisible();
    expect(within(business).getByText("CAD $149")).toBeVisible();
    for (const label of ["Start Professional", "Choose Business", "Apply for Private Alpha"]) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", "/apply");
    }
    for (const link of screen.getAllByRole("link", { name: "Start Free" })) expect(link).toHaveAttribute("href", "/apply");
    expect(screen.getByRole("link", { name: "Contact Sales" })).toHaveAttribute("href", "/contact#walkthrough");
    expect(screen.getByRole("link", { name: "Join the Private Alpha" })).toHaveAttribute("href", "/private-alpha");
    expect(screen.getByText(/Online self-serve billing isn’t open yet/)).toBeVisible();
  });

  it("separates the first-25 lifetime offer and its two savings from standard prices", () => {
    render(<Pricing />);
    const alpha = screen.getByRole("region", { name: "Save twice: lifetime Alpha pricing, plus two months FREE when you pay annually." });
    expect(alpha).toHaveAttribute("id", "private-alpha");
    expect(within(alpha).getByText(/first 25 businesses signing up for Alpha/)).toBeVisible();
    expect(within(alpha).getByText("Pay for 10 months and receive 2 months free.")).toBeVisible();
    for (const [name, monthly, annual, extra, combined, regular, regularMonthly] of [
      ["Professional", "CAD $59", "CAD $590", "CAD $118", "CAD $358", "CAD $948", "CAD $79"],
      ["Business", "CAD $129", "CAD $1,290", "CAD $258", "CAD $498", "CAD $1,788", "CAD $149"],
    ]) {
      const card = within(alpha).getByRole("heading", { name: `${name} Alpha` }).closest("article")!;
      expect(card).toHaveTextContent(`${monthly}/month`);
      expect(within(card).getByText(`CAD $20/month less than the regular ${regularMonthly}/month.`)).toBeVisible();
      expect(card).toHaveTextContent(`${annual}/year`);
      expect(card).toHaveTextContent("Paid upfront for 12 months");
      expect(card).toHaveTextContent("Lifetime recurring prices");
      const savings = within(card).getAllByRole("listitem");
      expect(savings[0]).toHaveTextContent("CAD $240/year");
      expect(savings[0]).toHaveTextContent("at monthly rates");
      expect(savings[1]).toHaveTextContent(`${extra}/year`);
      expect(savings[1]).toHaveTextContent("when paid annually");
      expect(card).toHaveTextContent(`${combined}/year total savings`);
      expect(card).toHaveTextContent(`vs 12 regular monthly payments (${regular})`);
    }
    expect(alpha).toHaveTextContent("The two free months apply only when you pay annually.");
    expect(alpha).toHaveTextContent("Same plans and features");
    expect(within(alpha).getAllByRole("link")).toHaveLength(1);
    expect(alpha).not.toHaveTextContent(/grandfathered|remaining places|20%|continuous payment|one-time license|tax included/i);
  });
});
