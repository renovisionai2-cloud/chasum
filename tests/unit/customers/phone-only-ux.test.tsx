/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const quickCreateCustomer = vi.hoisted(() => vi.fn());

vi.mock("@/lib/actions/customers", () => ({
  quickCreateCustomer: (...args: unknown[]) => quickCreateCustomer(...args),
  updateCustomer: vi.fn(),
}));
vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock("@/components/reception/customer-search", () => ({
  CustomerSearch: () => <div>Customer search</div>,
}));
vi.mock("@/lib/reception/recent-customers", () => ({
  pushRecentCustomer: vi.fn(),
}));
vi.mock("@/lib/commerce/customer-account-projection", () => ({
  customerBalanceChipLabel: () => null,
}));

import { CustomerSection } from "@/components/booking-sheet/customer-section";

afterEach(() => {
  cleanup();
  quickCreateCustomer.mockReset();
});

describe("phone-only quick add workflow", () => {
  it("explains why a contact method is needed and offers an explicit shared-phone choice", async () => {
    const user = userEvent.setup();
    quickCreateCustomer.mockResolvedValue({
      phoneMatches: [
        {
          id: "existing",
          name: "Household",
          email: null,
          phone: "4165550100",
        },
      ],
      error: "This phone number is already on file.",
    });

    render(
      <CustomerSection
        customers={[]}
        selected={null}
        onSelect={vi.fn()}
        onCustomersChange={vi.fn()}
        snapshot={null}
        snapshotLoading={false}
        initialShowQuickAdd
      />,
    );

    const hint = screen.getByText(/either one is enough/i);
    expect(hint.id).toBe("bs-qc-contact-hint");
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-describedby",
      "bs-qc-contact-hint",
    );
    expect(screen.getByLabelText("Email")).not.toBeRequired();
    expect(screen.getByLabelText("Phone")).not.toBeRequired();

    await user.type(screen.getByLabelText("Name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Save customer" }));

    expect(await screen.findByRole("status")).toHaveTextContent(/not merged automatically/i);
    expect(screen.getByRole("button", { name: "Use this customer" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Create separate person" })).toBeEnabled();
    expect(quickCreateCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Blair",
        phone: "4165550100",
        createSeparatePerson: false,
      }),
    );
  });
});
