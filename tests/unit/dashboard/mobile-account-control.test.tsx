import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardSidebar, DashboardTopNav } from "@/components/dashboard/sidebar";

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), setScope: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock("@/lib/actions/auth", () => ({ signOut: mocks.signOut }));
vi.mock("@/lib/actions/location", () => ({ setLocationScope: mocks.setScope }));
vi.mock("@/providers/theme-provider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }),
  usePathname: () => "/dashboard/calendar",
  useSearchParams: () => new URLSearchParams("view=day&date=2026-09-30"),
}));

const email = "Exact.Operator+mobile@example.test";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signOut.mockResolvedValue(undefined);
});
afterEach(() => cleanup());

function renderTopNav(userEmail: string | undefined) {
  render(<DashboardTopNav
    userEmail={userEmail}
    locations={[]}
    locationScope={{ mode: "all" }}
    locationQuota={{ plan: null, currentCount: 0, canAdd: false }}
  />);
  return screen.getByRole("button", {
    name: userEmail ? `Account, signed in as ${userEmail}` : "Account",
    exact: true,
  });
}

describe("mobile Account control", () => {
  it("opens the real Account Sheet with exact identity and a prominent canonical Sign out form", async () => {
    const user = userEvent.setup();
    const trigger = renderTopNav(email);
    expect(document.querySelector("header")?.lastElementChild?.lastElementChild).toBe(trigger);
    expect(trigger).toHaveAttribute("type", "button");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: "Account" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByRole("heading", { name: "Account" })).toBeVisible();
    expect(within(dialog).getByText("Signed in as", { exact: true })).toBeVisible();
    expect(within(dialog).getByText(email, { exact: true })).toBeVisible();
    expect(document.querySelector("header")?.contains(dialog)).toBe(false);
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    const signOut = within(dialog).getByRole("button", { name: "Sign out", exact: true });
    expect(signOut).toBeVisible();
    expect(signOut).toHaveAttribute("type", "submit");
    expect(signOut).toHaveClass("w-full", "min-h-11", "bg-primary");
    expect(signOut.closest("form")).not.toBeNull();
    expect(within(dialog).queryByRole("link")).not.toBeInTheDocument();
    expect(mocks.signOut).not.toHaveBeenCalled();

    await user.click(signOut);
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(mocks.signOut.mock.calls[0][0]).toBeInstanceOf(FormData);
    expect(mocks.setScope).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it.each(["Escape", "Close", "overlay"])("closes via %s, restores scrolling and returns focus", async (method) => {
    const user = userEvent.setup();
    const trigger = renderTopNav(email);
    const originalOverflow = document.body.style.overflow;
    expect(originalOverflow).toBe("");
    await user.click(trigger);
    expect(document.body.style.overflow).toBe("hidden");
    const dialog = screen.getByRole("dialog", { name: "Account" });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Close", exact: true })).toHaveFocus());

    if (method === "Escape") await user.keyboard("{Escape}");
    else await user.click(screen.getByRole("button", { name: method === "overlay" ? "Close panel" : "Close", exact: true }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe(originalOverflow);
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.setScope).not.toHaveBeenCalled();
  });

  it("inherits Sheet focus entry and traps forward and reverse Tab within the panel", async () => {
    const user = userEvent.setup();
    const trigger = renderTopNav(email);
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Account" });
    const close = within(dialog).getByRole("button", { name: "Close", exact: true });
    const signOut = within(dialog).getByRole("button", { name: "Sign out", exact: true });
    await waitFor(() => expect(close).toHaveFocus());
    await user.tab();
    expect(signOut).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(signOut).toHaveFocus();
  });

  it.each([undefined, ""])("truthfully handles an absent email (%s) without inventing an identity", (missingEmail) => {
    const trigger = renderTopNav(missingEmail);
    expect(trigger).toHaveAccessibleName("Account");
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Account" });
    expect(within(dialog).getByText("Signed-in account identity is unavailable.")).toBeVisible();
    expect(within(dialog).queryByText(/@/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  it("unlocks body scrolling when an open Account control unmounts", () => {
    fireEvent.click(renderTopNav(email));
    expect(document.body.style.overflow).toBe("hidden");
    cleanup();
    expect(document.body.style.overflow).toBe("");
  });

  it("preserves the real sidebar Signed in identity and canonical Sign out fallback", async () => {
    const user = userEvent.setup();
    render(<DashboardSidebar userEmail={email} />);
    expect(screen.getByText("Signed in", { exact: true })).toBeVisible();
    expect(screen.getByText(email, { exact: true })).toBeVisible();
    const signOut = screen.getByRole("button", { name: "Sign out", exact: true });
    expect(signOut.closest("form")).not.toBeNull();
    await user.click(signOut);
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
  });
});
