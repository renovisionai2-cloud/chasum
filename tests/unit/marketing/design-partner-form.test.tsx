import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APPLY_DELIVERY_ERROR } from "@/lib/marketing/apply-validation";

const { submitMock } = vi.hoisted(() => ({
  submitMock: vi.fn(async () => ({ ok: true as const })),
}));

vi.mock("@/lib/actions/design-partner", () => ({
  submitDesignPartnerApplication: submitMock,
}));

import { DesignPartnerForm } from "@/components/landing/design-partner-form";

async function fillRequiredApplyFields(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.type(screen.getByLabelText(/business name/i), "Acme Spa");
  await user.selectOptions(screen.getByLabelText(/business type/i), "Hair Salon");
  await user.type(screen.getByLabelText(/team size/i), "6–20");
  await user.type(screen.getByLabelText(/number of locations/i), "2");
  await user.type(
    screen.getByLabelText(/current scheduling or business software/i),
    "Fresha",
  );
  await user.type(
    screen.getByLabelText(/approximate monthly/i),
    "120 visits",
  );
  await user.type(
    screen.getByLabelText(/what would you most like to improve/i),
    "Scheduling",
  );
  await user.type(screen.getByLabelText(/work email/i), "owner@example.com");
}

describe("DesignPartnerForm Apply inline validation", () => {
  beforeEach(() => {
    submitMock.mockReset();
    submitMock.mockResolvedValue({ ok: true });
  });

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
    expect(submitMock).not.toHaveBeenCalled();

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

  it("does not show success when delivery fails and keeps plan intent", async () => {
    submitMock.mockResolvedValue({ error: APPLY_DELIVERY_ERROR });
    const user = userEvent.setup();
    render(
      <DesignPartnerForm
        inlineValidation
        showRequiredMarkers
        initialPlan="professional"
        successNote="Submitting an application does not create an account or guarantee acceptance."
      />,
    );

    await fillRequiredApplyFields(user);
    await user.click(
      screen.getByRole("button", { name: /submit my application/i }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(APPLY_DELIVERY_ERROR);
    expect(
      screen.queryByRole("heading", { name: /application received/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByDisplayValue("professional")).toHaveAttribute(
      "name",
      "preferred_plan",
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/business name/i)).toHaveValue("Acme Spa");
    });
    expect(
      screen.getByRole("button", { name: /submit my application/i }),
    ).toBeEnabled();
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
