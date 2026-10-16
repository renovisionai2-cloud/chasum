/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { quickCreateCustomer, createCustomer, createCrmCustomer } = vi.hoisted(
  () => ({
    quickCreateCustomer: vi.fn(),
    createCustomer: vi.fn(),
    createCrmCustomer: vi.fn(),
  }),
);

vi.mock("@/lib/actions/customers", () => ({
  quickCreateCustomer: (...args: unknown[]) => quickCreateCustomer(...args),
  createCustomer: (...args: unknown[]) => createCustomer(...args),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}));
vi.mock("@/lib/actions/crm", () => ({
  createCrmCustomer: (...args: unknown[]) => createCrmCustomer(...args),
}));
vi.mock("@/components/crm/customer-directory", () => ({
  CustomerDirectory: ({ onAdd }: { onAdd: () => void }) => (
    <button type="button" onClick={onAdd}>
      Open CRM add customer
    </button>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
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
import { CustomersManager } from "@/components/customers/customers-manager";
import { CrmManager } from "@/components/crm/crm-manager";
import { contactIdentityKey } from "@/lib/customers/contact-identity";

afterEach(() => {
  cleanup();
  quickCreateCustomer.mockReset();
  createCustomer.mockReset();
  createCrmCustomer.mockReset();
});

const HOUSEHOLD = {
  id: "existing",
  name: "Household",
  email: null,
  phone: "4165550100",
};

function renderQuickAdd() {
  return render(
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
}

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

describe("stale shared-phone warning is retired when the contact changes", () => {
  it("drops the chooser and its separate-person action after the phone changes", async () => {
    const user = userEvent.setup();
    quickCreateCustomer.mockResolvedValue({
      phoneMatches: [HOUSEHOLD],
      warnedContactKey: contactIdentityKey({ email: "", phone: "4165550100" }),
      error: "This phone number is already on file.",
    });

    renderQuickAdd();
    await user.type(screen.getByLabelText("Name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Save customer" }));

    expect(
      await screen.findByRole("button", { name: "Create separate person" }),
    ).toBeEnabled();

    await user.clear(screen.getByLabelText("Phone"));
    await user.type(screen.getByLabelText("Phone"), "4165550999");

    expect(
      screen.queryByRole("button", { name: "Create separate person" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Use this customer" }),
    ).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      /contact details changed/i,
    );
  });

  it("drops the chooser after only the email changes", async () => {
    const user = userEvent.setup();
    quickCreateCustomer.mockResolvedValue({
      phoneMatches: [HOUSEHOLD],
      warnedContactKey: contactIdentityKey({ email: "", phone: "4165550100" }),
      error: "This phone number is already on file.",
    });

    renderQuickAdd();
    await user.type(screen.getByLabelText("Name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Save customer" }));
    expect(
      await screen.findByRole("button", { name: "Create separate person" }),
    ).toBeEnabled();

    await user.type(screen.getByLabelText("Email"), "blair@example.invalid");

    expect(
      screen.queryByRole("button", { name: "Create separate person" }),
    ).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      /contact details changed/i,
    );
  });

  it("re-checks the new phone and surfaces that number's own duplicates", async () => {
    const user = userEvent.setup();
    const keyA = contactIdentityKey({ email: "", phone: "4165550100" });
    const keyB = contactIdentityKey({ email: "", phone: "4165550999" });
    quickCreateCustomer.mockResolvedValueOnce({
      phoneMatches: [HOUSEHOLD],
      warnedContactKey: keyA,
      error: "This phone number is already on file.",
    });

    renderQuickAdd();
    await user.type(screen.getByLabelText("Name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Save customer" }));
    expect(
      await screen.findByRole("button", { name: "Create separate person" }),
    ).toBeEnabled();

    await user.clear(screen.getByLabelText("Phone"));
    await user.type(screen.getByLabelText("Phone"), "4165550999");

    quickCreateCustomer.mockResolvedValueOnce({
      phoneMatches: [
        { id: "other", name: "Jo Vance", email: null, phone: "4165550999" },
      ],
      warnedContactKey: keyB,
      error: "This phone number is already on file.",
    });
    await user.click(screen.getByRole("button", { name: "Save customer" }));

    expect(await screen.findByText(/Jo Vance/)).toBeInTheDocument();
    expect(screen.queryByText(/Household/)).toBeNull();
    expect(quickCreateCustomer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        phone: "4165550999",
        createSeparatePerson: false,
        acknowledgedContactKey: undefined,
      }),
    );
  });

  it("ties the separate-person choice to the contact that produced the warning", async () => {
    const user = userEvent.setup();
    const keyA = contactIdentityKey({ email: "", phone: "4165550100" });
    quickCreateCustomer.mockResolvedValue({
      phoneMatches: [HOUSEHOLD],
      warnedContactKey: keyA,
      error: "This phone number is already on file.",
    });

    renderQuickAdd();
    await user.type(screen.getByLabelText("Name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Save customer" }));
    await user.click(
      await screen.findByRole("button", { name: "Create separate person" }),
    );

    expect(quickCreateCustomer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        phone: "4165550100",
        createSeparatePerson: true,
        acknowledgedContactKey: keyA,
      }),
    );
  });

  it("selects the real existing person instead of merging", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    quickCreateCustomer.mockResolvedValue({
      phoneMatches: [HOUSEHOLD],
      warnedContactKey: contactIdentityKey({ email: "", phone: "4165550100" }),
      error: "This phone number is already on file.",
    });

    render(
      <CustomerSection
        customers={[]}
        selected={null}
        onSelect={onSelect}
        onCustomersChange={vi.fn()}
        snapshot={null}
        snapshotLoading={false}
        initialShowQuickAdd
      />,
    );
    await user.type(screen.getByLabelText("Name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Save customer" }));
    await user.click(
      await screen.findByRole("button", { name: "Use this customer" }),
    );

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "existing", name: "Household" }),
    );
    expect(quickCreateCustomer).toHaveBeenCalledTimes(1);
  });
});

describe("Clients workspace shared-phone chooser", () => {
  it("warns, offers the real record, and binds the separate-person choice", async () => {
    const user = userEvent.setup();
    const warnedContactKey = contactIdentityKey({
      email: "",
      phone: "4165550100",
    });
    createCustomer.mockResolvedValue({
      error: "This phone number is already on file.",
      phoneMatches: [HOUSEHOLD],
      warnedContactKey,
    });

    render(<CustomersManager customers={[]} />);
    await user.click(
      screen.getAllByRole("button", { name: /Add client/i })[0],
    );
    await user.type(screen.getByLabelText("Name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText(/not merged automatically/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Use this customer" }),
    ).toHaveAttribute("href", "/dashboard/clients/existing");

    createCustomer.mockResolvedValue({ success: "Client added." });
    await user.click(
      screen.getByRole("button", { name: "Create separate person" }),
    );

    const submitted = createCustomer.mock.calls.at(-1)?.[1] as FormData;
    expect(submitted.get("acknowledged_contact")).toBe(warnedContactKey);
    expect(submitted.get("phone")).toBe("4165550100");
  });

  it("retires the chooser when the operator edits the phone", async () => {
    const user = userEvent.setup();
    createCustomer.mockResolvedValue({
      error: "This phone number is already on file.",
      phoneMatches: [HOUSEHOLD],
      warnedContactKey: contactIdentityKey({ email: "", phone: "4165550100" }),
    });

    render(<CustomersManager customers={[]} />);
    await user.click(
      screen.getAllByRole("button", { name: /Add client/i })[0],
    );
    await user.type(screen.getByLabelText("Name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText(/not merged automatically/i)).toBeVisible();

    await user.type(screen.getByLabelText("Phone"), "9");

    expect(
      screen.queryByRole("button", { name: "Create separate person" }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: "Use this customer" })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      /contact details changed/i,
    );
  });

  it("does not carry the acknowledgement into an ordinary save", async () => {
    const user = userEvent.setup();
    createCustomer.mockResolvedValue({
      error: "This phone number is already on file.",
      phoneMatches: [HOUSEHOLD],
      warnedContactKey: contactIdentityKey({ email: "", phone: "4165550100" }),
    });

    render(<CustomersManager customers={[]} />);
    await user.click(
      screen.getAllByRole("button", { name: /Add client/i })[0],
    );
    await user.type(screen.getByLabelText("Name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(
      await screen.findByRole("button", { name: "Create separate person" }),
    );
    await waitFor(() => expect(createCustomer).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(createCustomer).toHaveBeenCalledTimes(3));
    const submitted = createCustomer.mock.calls.at(-1)?.[1] as FormData;
    expect(submitted.get("acknowledged_contact")).toBeNull();
  });
});

describe("CRM workspace shared-phone chooser", () => {
  it("warns, offers the real record, and binds the separate-person choice", async () => {
    const user = userEvent.setup();
    const warnedContactKey = contactIdentityKey({
      email: "",
      phone: "4165550100",
    });
    createCrmCustomer.mockResolvedValue({
      error: "This phone number is already on file.",
      phoneMatches: [HOUSEHOLD],
      warnedContactKey,
    });

    render(<CrmManager customers={[]} staff={[]} locations={[]} />);
    await user.click(screen.getByRole("button", { name: "Open CRM add customer" }));
    await user.type(screen.getByLabelText("First name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Add customer" }));

    expect(await screen.findByText(/not merged automatically/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Use this customer" }),
    ).toHaveAttribute("href", "/dashboard/clients/existing");

    await user.click(
      screen.getByRole("button", { name: "Create separate person" }),
    );

    const submitted = createCrmCustomer.mock.calls.at(-1)?.[1] as FormData;
    expect(submitted.get("acknowledged_contact")).toBe(warnedContactKey);
    expect(submitted.get("phone")).toBe("4165550100");
  });

  it("retires the chooser when the operator edits the phone", async () => {
    const user = userEvent.setup();
    createCrmCustomer.mockResolvedValue({
      error: "This phone number is already on file.",
      phoneMatches: [HOUSEHOLD],
      warnedContactKey: contactIdentityKey({ email: "", phone: "4165550100" }),
    });

    render(<CrmManager customers={[]} staff={[]} locations={[]} />);
    await user.click(screen.getByRole("button", { name: "Open CRM add customer" }));
    await user.type(screen.getByLabelText("First name"), "Blair");
    await user.type(screen.getByLabelText("Phone"), "4165550100");
    await user.click(screen.getByRole("button", { name: "Add customer" }));
    expect(await screen.findByText(/not merged automatically/i)).toBeVisible();

    await user.type(screen.getByLabelText("Phone"), "9");

    expect(
      screen.queryByRole("button", { name: "Create separate person" }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: "Use this customer" })).toBeNull();
  });
});
