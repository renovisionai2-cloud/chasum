import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Location } from "@/lib/types/booking";
import { MobileWorkspaceScope } from "@/components/dashboard/mobile-workspace-scope";
import { DashboardTopNav } from "@/components/dashboard/sidebar";

const mocks = vi.hoisted(() => ({ setScope: vi.fn(), refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock("@/lib/actions/location", () => ({ setLocationScope: mocks.setScope }));
vi.mock("@/lib/actions/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/providers/theme-provider", () => ({ useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: mocks.push, replace: mocks.replace }),
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const location = (id: string, name: string, is_active = true): Location => ({
  id, name, is_active, business_id: "tenant-a", slug: id, timezone: "America/Toronto",
  is_default: id === "north", address_line1: null, address_line2: null, city: null,
  state: null, postal_code: null, phone: null, metadata: {}, created_at: "", updated_at: "",
});
const locations = [location("north", "North Studio"), location("south", "South Studio")];
let resize: (() => void) | undefined;
let desktop = false;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.setScope.mockResolvedValue(undefined);
  desktop = false;
  resize = undefined;
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    get matches() { return desktop; },
    addEventListener: (_: string, cb: () => void) => { resize = cb; },
    removeEventListener: vi.fn(),
  })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState({}, "", "/"); });

function open() { fireEvent.click(screen.getByRole("button", { name: /^Workspace location:/ })); }

describe("phone workspace scope", () => {
  it("integrates the real mobile control and sheet alongside the unchanged desktop selector", () => {
    render(<DashboardTopNav locations={locations} locationScope={{ mode: "single", locationId: "north" }}
      locationQuota={{ plan: null, currentCount: 2, canAdd: true }} onMenuOpen={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Workspace location: North Studio" });
    expect(trigger.parentElement).toHaveClass("sm:hidden");
    expect(screen.getByRole("combobox", { name: "Switch location" }).closest(".sm\\:flex")).toHaveClass("hidden");
    open();
    const dialog = screen.getByRole("dialog", { name: "Workspace location" });
    expect(document.querySelector("header")?.contains(dialog)).toBe(false);
    expect(within(dialog).getByRole("button", { name: "All locations" })).toBeInTheDocument();
    expect(within(dialog).queryByText(/Add location|Request plan change/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/appointment/i)).not.toBeInTheDocument();
  });

  it("shows All locations from server scope and excludes inactive choices", () => {
    render(<MobileWorkspaceScope locations={[...locations, location("old", "Closed", false)]} scope={{ mode: "all" }} />);
    expect(screen.getByRole("button", { name: "Workspace location: All locations" })).toBeInTheDocument();
    open();
    expect(screen.getByRole("button", { name: "All locations" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Closed")).not.toBeInTheDocument();
  });

  it("keeps single-location context static, including a legacy ALL cookie", () => {
    render(<MobileWorkspaceScope locations={[locations[0]]} scope={{ mode: "all" }} />);
    expect(screen.getByLabelText("Workspace location: North Studio")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("All locations")).not.toBeInTheDocument();
  });

  it("has no phantom default label when scope is unavailable", () => {
    const { rerender } = render(<MobileWorkspaceScope locations={locations} scope={{ mode: "single", locationId: "foreign" }} />);
    expect(screen.getByRole("button", { name: "Workspace location: Choose location" })).toBeInTheDocument();
    rerender(<MobileWorkspaceScope locations={[]} scope={{ mode: "all" }} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each(["/dashboard", "/dashboard/calendar?view=month&date=2026-09-28", "/dashboard/clients", "/dashboard/payments"])(
    "refreshes %s without navigation or optimistic scope", async (path) => {
      window.history.replaceState({}, "", path);
      const { rerender } = render(<MobileWorkspaceScope locations={locations} scope={{ mode: "single", locationId: "north" }} />);
      open();
      fireEvent.click(screen.getByRole("button", { name: "South Studio" }));
      await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
      expect(mocks.setScope).toHaveBeenCalledExactlyOnceWith("south");
      expect(mocks.push).not.toHaveBeenCalled();
      expect(mocks.replace).not.toHaveBeenCalled();
      expect(window.location.pathname + window.location.search).toBe(path);
      expect(screen.getByRole("button", { name: "Workspace location: North Studio" })).toBeInTheDocument();
      rerender(<MobileWorkspaceScope locations={locations} scope={{ mode: "single", locationId: "south" }} />);
      expect(screen.getByRole("button", { name: "Workspace location: South Studio" })).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    },
  );

  it("uses the canonical ALL value, waits for success and prevents repeated pending selection", async () => {
    let finish!: () => void;
    mocks.setScope.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    render(<MobileWorkspaceScope locations={locations} scope={{ mode: "single", locationId: "north" }} />);
    open();
    fireEvent.click(screen.getByRole("button", { name: "All locations" }));
    expect(screen.getByRole("status")).toHaveTextContent("Switching workspace");
    fireEvent.click(screen.getByRole("button", { name: "South Studio" }));
    expect(mocks.setScope).toHaveBeenCalledExactlyOnceWith("ALL");
    expect(mocks.refresh).not.toHaveBeenCalled();
    await act(async () => finish());
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Workspace location: North Studio" })).toHaveFocus();
  });

  it("keeps the previous scope and offers retry on a rejected setter", async () => {
    mocks.setScope.mockRejectedValueOnce(new Error("private backend detail"));
    render(<MobileWorkspaceScope locations={locations} scope={{ mode: "single", locationId: "north" }} />);
    open();
    fireEvent.click(screen.getByRole("button", { name: "South Studio" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not change workspace");
    expect(screen.queryByText(/private backend/)).not.toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "North Studio" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "South Studio" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
  });

  it("closes on current selection or Escape with focus restored and no setter call", () => {
    render(<MobileWorkspaceScope locations={locations} scope={{ mode: "single", locationId: "north" }} />);
    open();
    fireEvent.click(screen.getByRole("button", { name: "North Studio" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Workspace location: North Studio" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
    expect(mocks.setScope).not.toHaveBeenCalled();
  });

  it("dismisses the phone sheet at the tablet breakpoint and unlocks scrolling", () => {
    render(<MobileWorkspaceScope locations={locations} scope={{ mode: "all" }} />);
    open();
    expect(document.body.style.overflow).toBe("hidden");
    act(() => { desktop = true; resize?.(); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(mocks.setScope).not.toHaveBeenCalled();
  });
});
