import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardShell } from "@/components/dashboard/shell";
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


describe("Reception Account submit protection", () => {
  it.each(["{Enter}", " "])("opens from keyboard %s without an action", async (key) => {
    const user = userEvent.setup();
    const trigger = renderTopNav(email);
    trigger.focus();
    await user.keyboard(key);
    expect(screen.getByRole("dialog", { name: "Account" })).toBeInTheDocument();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("releases the local claim after an immediately settled non-redirecting action", async () => {
    const user = userEvent.setup();
    const trigger = renderTopNav(email);
    await user.click(trigger);
    const button = within(screen.getByRole("dialog", { name: "Account" })).getByRole("button", { name: "Sign out", exact: true });
    await user.click(button);
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(button).toBeEnabled());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("preserves the panel node and focused action on parent rerenders", async () => {
    const view = render(<DashboardTopNav userEmail={email} locations={[]} locationScope={{ mode: "all" }} locationQuota={{ plan: null, currentCount: 0, canAdd: false }} />);
    fireEvent.click(screen.getByRole("button", { name: `Account, signed in as ${email}` }));
    const panel = screen.getByRole("dialog", { name: "Account" });
    await waitFor(() => expect(within(panel).getByRole("button", { name: "Close", exact: true })).toHaveFocus());
    const signOut = within(panel).getByRole("button", { name: "Sign out" });
    signOut.focus();
    view.rerender(<DashboardTopNav userEmail={email} locations={[]} locationScope={{ mode: "all" }} locationQuota={{ plan: null, currentCount: 0, canAdd: false }} />);
    expect(screen.getByRole("dialog", { name: "Account" })).toBe(panel);
    expect(signOut).toHaveFocus();
  });

  it.each(["submit burst", "pointer", "keyboard"])("guards %s through a deferred canonical action and restores controls after settlement", async (method) => {
    let finish!: () => void;
    mocks.signOut.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    const trigger = renderTopNav(email);
    await user.click(trigger);
    const panel = screen.getByRole("dialog", { name: "Account" });
    const button = within(panel).getByRole("button", { name: "Sign out", exact: true });
    const form = button.closest("form")!;
    if (method === "submit burst") {
      // Same React batch: the ref must protect the gap before pending paints.
      act(() => { fireEvent.submit(form); fireEvent.submit(form); fireEvent.submit(form); });
    } else if (method === "pointer") {
      await user.dblClick(button);
    } else {
      button.focus();
      await user.keyboard("{Enter}{Enter} ");
    }
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Signing out…");
    expect(screen.getByRole("status")).toHaveTextContent("Signing out. Please wait…");
    const close = within(panel).getByRole("button", { name: "Close", exact: true });
    expect(close).toHaveFocus();
    await user.tab(); expect(close).toHaveFocus();
    await user.tab({ shift: true }); expect(close).toHaveFocus();
    fireEvent.submit(form); // Enter/requestSubmit-style repeat while pending.
    await user.keyboard("{Escape}");
    await user.click(close);
    await user.click(screen.getByRole("button", { name: "Close panel", exact: true }));
    expect(screen.getByRole("dialog", { name: "Account" })).toBe(panel);
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/successfully signed out/i)).not.toBeInTheDocument();
    await act(async () => finish());
    await waitFor(() => expect(button).toBeEnabled());
    expect(button).toHaveTextContent("Sign out");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
    expect(mocks.setScope).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});


describe("Reception mobile navigation drawer", () => {
  let desktop: boolean;
  let listeners: Set<() => void>;
  beforeEach(() => {
    desktop = false;
    listeners = new Set();
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      get matches() { return desktop; },
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    })));
  });
  afterEach(() => { vi.unstubAllGlobals(); document.body.style.overflow = ""; });
  function shell() {
    return render(<DashboardShell userEmail={email} locations={[]} locationScope={{ mode: "all" }} locationQuota={{ plan: null, currentCount: 0, canAdd: false }}><button>Background action</button></DashboardShell>);
  }
  it.each(["Open menu", "More navigation"])("opens from %s, contains focus and restores the invoking control", async (name) => {
    document.body.style.overflow = "clip";
    shell();
    const trigger = screen.getByRole("button", { name, exact: true });
    fireEvent.click(trigger); // Includes Safari-style activation without pre-focusing.
    const drawer = screen.getByRole("dialog", { name: "Dashboard navigation" });
    const close = within(drawer).getByRole("button", { name: "Close menu" });
    const logout = within(drawer).getByRole("button", { name: "Sign out" });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.querySelector('nav[aria-label="Primary"]')).toHaveProperty("inert", true);
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true }); expect(logout).toHaveFocus();
    fireEvent.keyDown(logout, { key: "Tab" }); expect(close).toHaveFocus();
    screen.getByRole("button", { name: "Background action" }).focus();
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("clip");
    expect(document.querySelector('nav[aria-label="Primary"]')).not.toHaveProperty("inert", true);
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.setScope).not.toHaveBeenCalled();
  });
  it.each(["Close menu", "backdrop", "navigation"])("dismisses via %s without sign-out", (method) => {
    shell(); const trigger = screen.getByRole("button", { name: "More navigation" }); fireEvent.click(trigger);
    const drawer = screen.getByRole("dialog", { name: "Dashboard navigation" });
    if (method === "Close menu") fireEvent.click(within(drawer).getByRole("button", { name: method }));
    else if (method === "backdrop") fireEvent.click(document.querySelector('#portal-mobile-nav > [aria-hidden="true"]')!);
    else fireEvent.click(within(within(drawer).getByRole("navigation", { name: "Dashboard" })).getAllByRole("link")[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus(); expect(document.body.style.overflow).toBe("");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("does not refocus on shell rerender and cleans up on unmount", () => {
    document.body.style.overflow = "scroll";
    const view = shell(); fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Dashboard navigation" });
    const logout = within(drawer).getByRole("button", { name: "Sign out" }); logout.focus();
    view.rerender(<DashboardShell userEmail={email} locations={[]} locationScope={{ mode: "all" }} locationQuota={{ plan: null, currentCount: 0, canAdd: false }}><button>Changed background</button></DashboardShell>);
    expect(screen.getByRole("dialog", { name: "Dashboard navigation" })).toBe(drawer);
    expect(logout).toHaveFocus();
    view.unmount(); expect(document.body.style.overflow).toBe("scroll"); expect(listeners.size).toBe(0);
  });
  it("closes across 1024px and restores focus to visible Account instead of hidden More", () => {
    shell(); fireEvent.click(screen.getByRole("button", { name: "More navigation" }));
    act(() => { desktop = true; for (const listener of listeners) listener(); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Account, signed in as ${email}` })).toHaveFocus();
    expect(document.body.style.overflow).toBe(""); expect(listeners.size).toBe(0);
  });
});
