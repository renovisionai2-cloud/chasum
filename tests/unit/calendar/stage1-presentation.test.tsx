import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { MorningBrief } from "@/components/day-view/morning-brief";
import type { MorningBriefData } from "@/lib/actions/morning-brief";

afterEach(cleanup);

it("keeps every view and secondary action accessible through compact controls", () => {
  const change = vi.fn(), undo = vi.fn(), customer = vi.fn(), block = vi.fn();
  render(<CalendarToolbar view="day" date={new Date(2026, 9, 26)} colorMode="service"
    onViewChange={change} onDateChange={vi.fn()} onColorModeChange={vi.fn()} onNewAppointment={vi.fn()}
    onUndo={undo} onDuplicate={vi.fn()} canDuplicate={false} onNewCustomer={customer} onBlockTime={block} />);
  const views = screen.getByRole("combobox", { name: "Calendar view" });
  for (const value of ["day", "week", "month", "agenda", "timeline", "employees", "locations", "resource"]) {
    fireEvent.change(views, { target: { value } });
    expect(change).toHaveBeenLastCalledWith(value);
  }
  const more = screen.getByText("More actions").closest("details")!;
  more.open = true;
  expect(screen.getByRole("button", { name: "Duplicate" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(undo).toHaveBeenCalledOnce();
  expect(more.open).toBe(false);
  more.open = true;
  fireEvent.click(screen.getByRole("button", { name: "New Customer" }));
  expect(customer).toHaveBeenCalledOnce();
  more.open = true;
  fireEvent.click(screen.getByRole("button", { name: "Block time" }));
  expect(block).toHaveBeenCalledOnce();
  more.open = true;
  fireEvent.keyDown(more, { key: "Escape" });
  expect(more.open).toBe(false);
  expect(more.querySelector("summary")).toHaveFocus();
});

it.each(["HELD", "UNKNOWN"] as const)("keeps %s money and operational warnings visible when Morning Brief is collapsed", state => {
  const brief: MorningBriefData = {
    todayAppointments: 9, todayRevenue: { state, reason: "TEST_ONLY" }, staffWorking: 3,
    availableSlots: 0, waitlistCount: 2, noShows: 1, outstandingPayments: null,
    pendingConfirmations: 3, customersToday: 9,
    summer: { bookingsToday: 0, reschedulesToday: 0, confirmationsToday: 0 },
    chase: { revenueDeltaPct: null, recommendation: "Review confirmations", availableSlots: 0, overdueCustomers: 1 },
  };
  const { container } = render(<MorningBrief brief={brief} />);
  expect(container.querySelector("details")).not.toHaveAttribute("open");
  expect(screen.getByText("3 pending confirmation")).toBeVisible();
  expect(screen.getByText("2 waiting")).toBeVisible();
  expect(screen.getByText("1 no-shows")).toBeVisible();
  expect(screen.getByText(/^Payment state:/)).toBeVisible();
  expect(screen.getByText(/^Payment state:/)).toHaveTextContent(state === "HELD" ? "held — requires review" : "unverified");
  expect(screen.getByText("Review confirmations")).not.toBeVisible();
  fireEvent.click(container.querySelector("summary")!);
  expect(screen.getByText("Review confirmations")).toBeVisible();
});
