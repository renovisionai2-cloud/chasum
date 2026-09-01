import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecoveryErrorPage from "@/app/auth/recovery-error/page";
import { FORGOT_PASSWORD_PATH, LOGIN_PATH } from "@/lib/auth/recovery";

vi.mock("@/components/brand/logo", () => ({
  Logo: () => <div>Chasum</div>,
}));

describe("recovery-error page", () => {
  it("shows a Chasum recovery message without raw Supabase codes", () => {
    const { container } = render(<RecoveryErrorPage />);
    const text = container.textContent ?? "";

    expect(
      screen.getByText("Your password reset link is invalid or has expired."),
    ).toBeInTheDocument();
    expect(text).not.toMatch(/otp_expired/i);
    expect(text).not.toMatch(/access_denied/i);
    expect(text).not.toMatch(/auth_callback_failed/i);
  });

  it("offers a request-new-link action to forgot-password", () => {
    render(<RecoveryErrorPage />);
    const requestLink = screen.getByRole("link", {
      name: /request a new reset link/i,
    });
    expect(requestLink).toHaveAttribute("href", FORGOT_PASSWORD_PATH);
    expect(FORGOT_PASSWORD_PATH).toBe("/forgot-password");
  });

  it("optionally offers return to sign in", () => {
    render(<RecoveryErrorPage />);
    expect(
      screen.getByRole("link", { name: /return to sign in/i }),
    ).toHaveAttribute("href", LOGIN_PATH);
  });
});
