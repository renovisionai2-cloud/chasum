import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DesignPartnerForm } from "@/components/landing/design-partner-form";

vi.mock("@/lib/actions/design-partner", () => ({
  submitDesignPartnerApplication: vi.fn(async () => ({ ok: true })),
}));

describe("DesignPartnerForm Apply inline validation", () => {
  it("shows required inline errors including Business Type after empty submit", async () => {
    const user = userEvent.setup();
    render(
      <DesignPartnerForm inlineValidation showRequiredMarkers />,
    );

    expect(screen.getByText("* Required")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /submit my application/i }),
    );

    expect(screen.getByText("Enter your business name.")).toBeInTheDocument();
    expect(screen.getByText("Select a business type.")).toBeInTheDocument();
    expect(screen.getByLabelText(/business name/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText(/business type/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText(/business type/i)).toHaveAttribute(
      "aria-describedby",
      "industry-error",
    );
    expect(document.activeElement).toBe(
      screen.getByLabelText(/business name/i),
    );

    const placeholder = screen.getByRole("option", {
      name: "Select a business type",
    });
    expect(placeholder).not.toBeDisabled();
    expect(placeholder).toHaveValue("");
  });

  it("preserves plan intent and entered values after a failed submit", async () => {
    const user = userEvent.setup();
    render(
      <DesignPartnerForm
        inlineValidation
        showRequiredMarkers
        initialPlan="professional"
      />,
    );

    await user.type(screen.getByLabelText(/business name/i), "Acme Spa");
    await user.click(
      screen.getByRole("button", { name: /submit my application/i }),
    );

    expect(screen.getByText(/interested plan/i)).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByDisplayValue("professional")).toHaveAttribute(
      "name",
      "preferred_plan",
    );
    expect(screen.getByLabelText(/business name/i)).toHaveValue("Acme Spa");
    expect(screen.getByText("Select a business type.")).toBeInTheDocument();
  });
});

describe("DesignPartnerForm Meet Summer defaults", () => {
  it("does not add Apply required markers, extra success copy, or an enabled empty option", () => {
    render(<DesignPartnerForm />);

    expect(screen.queryByText("* Required")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/does not create an account/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Approximate monthly appointments"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "Scheduling, CRM, front desk, payments, reporting…",
      ),
    ).toBeInTheDocument();

    const placeholder = screen.getByRole("option", {
      name: "Select a business type",
    });
    expect(placeholder).toBeDisabled();
    expect(placeholder).toHaveValue("");
  });
});
