import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act, useLayoutEffect, useState, type ComponentProps, type ReactElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReceptionPanel } from "@/components/reception/reception-panel";
import {
  MIN_CALENDAR_SIDE_BY_SIDE_PX,
  PANEL_STANDARD_PX,
  receptionWorkspaceLayout,
} from "@/lib/reception/panel-layout";
import type { Customer } from "@/lib/types/booking";

const formState = vi.hoisted(() => ({ mounts: 0 }));

const selectedCustomer = vi.hoisted(
  (): Customer => ({
    id: "cust_1",
    business_id: "biz_1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: null,
    notes: null,
    tags: [],
    referral_source: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }),
);

vi.mock("server-only", () => ({}));

vi.mock("@/components/reception/customer-search", () => ({
  CustomerSearch: ({
    onSelect,
  }: {
    onSelect: (customer: Customer) => void;
  }) => (
    <button type="button" onClick={() => onSelect(selectedCustomer)}>
      Select Ada
    </button>
  ),
}));

vi.mock("@/components/reception/customer-preview", () => ({
  CustomerPreview: () => <div data-testid="customer-preview" />,
}));

vi.mock("@/components/reception/next-slot-card", () => ({
  NextSlotCard: () => null,
}));

vi.mock("@/components/reception/today-notes", () => ({
  TodayNotes: () => null,
}));

vi.mock("@/components/reception/ai-suggestions-card", () => ({
  AiSuggestionsCard: () => null,
}));

vi.mock("@/components/reception/reception-waitlist-panel", () => ({
  ReceptionWaitlistPanel: () => null,
}));

vi.mock("@/components/reception/quick-appointment", () => ({
  QuickAppointmentForm: function QuickAppointmentForm(props: {
    preselectedCustomerId?: string;
  }) {
    const [mountId, setMountId] = useState<number | null>(null);
    const [notes, setNotes] = useState("keep-this-draft");
    useLayoutEffect(() => {
      formState.mounts += 1;
      setMountId(formState.mounts);
    }, []);
    return (
      <div
        data-testid="quick-appointment-form"
        data-mount={mountId == null ? "" : String(mountId)}
      >
        <span data-testid="preselected-customer">
          {props.preselectedCustomerId ?? ""}
        </span>
        <textarea
          aria-label="Booking notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
    );
  },
}));

afterEach(() => {
  cleanup();
});

function mockViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  window.matchMedia = (query: string) => {
    const min = /min-width:\s*(\d+)/.exec(query);
    const matches = min ? width >= Number(min[1]) : false;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    };
  };
}

function panelProps(): ComponentProps<typeof ReceptionPanel> {
  return {
    customers: [],
    services: [],
    staff: [],
    locations: [],
    insights: [],
    open: true,
    onOpenChange: () => undefined,
    onBooked: () => undefined,
    onOpenFullDialog: () => undefined,
  };
}

function renderPanel(extra?: Partial<ComponentProps<typeof ReceptionPanel>>) {
  return render(<ReceptionPanel {...panelProps()} {...extra} />);
}

function ReceptionWorkspace({ width }: { width: number }): ReactElement {
  mockViewport(width);
  const layout = receptionWorkspaceLayout(width);
  return (
    <div data-testid="reception-row" className="flex flex-col gap-4 lg:flex-row">
      <div
        data-testid="calendar-pane"
        data-calendar-contract={layout.calendarWidthPx}
        className="min-w-0 flex-1"
      >
        calendar
      </div>
      <ReceptionPanel
        customers={[]}
        services={[]}
        staff={[]}
        locations={[]}
        insights={[]}
        open
        onOpenChange={() => undefined}
        onBooked={() => undefined}
        onOpenFullDialog={() => undefined}
      />
    </div>
  );
}

describe("ReceptionPanel viewport stability", () => {
  beforeEach(() => {
    formState.mounts = 0;
    mockViewport(1366);
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("does not offer expand/wide or drag-resize controls", () => {
    renderPanel();
    expect(
      screen.queryByRole("button", { name: "Expand reception panel" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Standard reception panel width" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("separator", { name: "Resize reception panel" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close reception panel" }),
    ).toBeInTheDocument();
  });

  it("uses a stable standard width in side-by-side mode at 1366", () => {
    render(<ReceptionWorkspace width={1366} />);
    const panel = screen.getByTestId("reception-panel");
    expect(panel).toHaveAttribute("data-layout-mode", "side-by-side");
    expect(panel).toHaveAttribute("data-panel-width", String(PANEL_STANDARD_PX));
    expect(screen.getByTestId("calendar-pane")).toHaveAttribute(
      "data-calendar-contract",
      "550",
    );
    expect(550).toBeGreaterThanOrEqual(MIN_CALENDAR_SIDE_BY_SIDE_PX);
  });

  it("leaves the calendar full main width in overlay mode at 1024", () => {
    render(<ReceptionWorkspace width={1024} />);
    const panel = screen.getByTestId("reception-panel");
    expect(panel).toHaveAttribute("data-layout-mode", "overlay");
    expect(panel).toHaveAttribute("data-panel-width", String(PANEL_STANDARD_PX));
    expect(screen.getByTestId("reception-flex-slot")).toHaveAttribute(
      "data-occupies-flex",
      "false",
    );
    expect(screen.getByTestId("reception-flex-slot").className).toContain(
      "fixed",
    );
    expect(screen.getByTestId("calendar-pane")).toHaveAttribute(
      "data-calendar-contract",
      "704",
    );
  });

  it("preserves booking draft state when presentation switches from side-by-side to overlay", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ReceptionWorkspace width={1366} />);

    await user.click(screen.getByRole("button", { name: "Select Ada" }));
    const notes = screen.getByLabelText("Booking notes");
    await user.clear(notes);
    await user.type(notes, "color-formula-kept");

    expect(screen.getByTestId("preselected-customer")).toHaveTextContent(
      "cust_1",
    );
    const mountAfterCustomer = screen
      .getByTestId("quick-appointment-form")
      .getAttribute("data-mount");
    const mountsAfterDraft = formState.mounts;

    rerender(<ReceptionWorkspace width={1024} />);
    window.dispatchEvent(new Event("resize"));

    await waitFor(() => {
      expect(screen.getByTestId("reception-panel")).toHaveAttribute(
        "data-layout-mode",
        "overlay",
      );
    });
    expect(screen.getByTestId("preselected-customer")).toHaveTextContent(
      "cust_1",
    );
    expect(screen.getByLabelText("Booking notes")).toHaveValue(
      "color-formula-kept",
    );
    expect(screen.getByTestId("quick-appointment-form")).toHaveAttribute(
      "data-mount",
      mountAfterCustomer,
    );
    expect(formState.mounts).toBe(mountsAfterDraft);
  });

  it("SSR markup is the 1366 side-by-side shell even when window is 1024, then hydrates and syncs overlay", async () => {
    mockViewport(1024);
    const tree = <ReceptionPanel {...panelProps()} />;
    const markup = renderToString(tree);
    expect(markup).toContain('data-layout-mode="side-by-side"');
    expect(markup).toContain('data-occupies-flex="true"');
    expect(markup).not.toContain('data-layout-mode="overlay"');

    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = markup;

    const hydrationErrors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const text = args.map(String).join(" ");
      if (/hydrat/i.test(text)) hydrationErrors.push(text);
      originalError.apply(console, args);
    };

    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, tree);
      });
      await waitFor(() => {
        expect(
          container.querySelector("[data-layout-mode]")?.getAttribute(
            "data-layout-mode",
          ),
        ).toBe("overlay");
      });
      expect(hydrationErrors).toEqual([]);
    } finally {
      console.error = originalError;
      await act(async () => {
        root?.unmount();
      });
      container.remove();
    }
  });
});
