import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mocks = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock("@/lib/actions/tenant-identity", () => ({
  submitBusinessIdentity: mocks.submit,
}));
import { BusinessIdentityForm } from "@/components/onboarding/business-identity-form";
beforeEach(() => mocks.submit.mockReset());
describe("business identity onboarding", () => {
  it("requires an explicit choice and shows no business discovery records", () => {
    render(<BusinessIdentityForm />);
    expect(
      screen.getByRole("button", { name: "Continue with existing business" }),
    ).toBeDisabled();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.queryByLabelText("Business email")).toBeNull();
  });
  it("existing-business choice leads to manual access without a new business", async () => {
    mocks.submit.mockResolvedValue({ existing: true });
    const user = userEvent.setup();
    render(<BusinessIdentityForm />);
    await user.click(
      screen.getByLabelText("My business is already on Chasum / I need access"),
    );
    await user.click(
      screen.getByRole("button", { name: "Continue with existing business" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Get access to your existing business",
      }),
    ).toBeInTheDocument();
    expect(mocks.submit.mock.calls[0][1].get("intent")).toBe("join_existing");
    expect(
      screen.getByRole("link", { name: "Contact Chasum Support" }),
    ).toHaveAttribute("href", "/contact");
  });
  it("new business requires identity details and preserves billing truth", () => {
    render(<BusinessIdentityForm />);
    fireEvent.click(screen.getByLabelText("Create a new business"));
    expect(screen.getByLabelText("Business name")).toBeRequired();
    expect(screen.getByRole("checkbox")).toBeRequired();
    expect(
      screen.getByText(/paid-plan preference does not activate billing/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm and create business" }),
    ).toBeEnabled();
  });
  it("review state has no override or create-again control", async () => {
    mocks.submit.mockResolvedValue({ review: true });
    render(<BusinessIdentityForm />);
    fireEvent.click(
      screen.getByLabelText("My business is already on Chasum / I need access"),
    );
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Continue with existing business" })
        .closest("form")!,
    );
    expect(
      await screen.findByRole("heading", {
        name: "Let’s confirm your business identity",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
