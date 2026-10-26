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

const operational = {
  todayAppointments: 9, staffWorking: 3, availableSlots: 17, waitlistCount: 2,
  noShows: 1, pendingConfirmations: 4, customersToday: 8,
  summer: { bookingsToday: 6, reschedulesToday: 5, confirmationsToday: 7 },
};

it.each([
  [987654.32, 8765, 7654, 6543, "Collect 8765 outstanding deposits"],
  [0, 0, null, 0, "Payments complete; revenue is up"],
  [-321.45, 12, -75, 12, "Revenue declined: chase overdue customers"],
] as const)("withholds legacy financial data even for zero/negative inputs (%s)",
  (todayRevenue, outstandingPayments, revenueDeltaPct, overdueCustomers, recommendation) => {
    const brief: MorningBriefData = { ...operational, todayRevenue, outstandingPayments,
      chase: { revenueDeltaPct, overdueCustomers, recommendation, availableSlots: 17 } };
    const { container } = render(<MorningBrief brief={brief} />);
    const disclosure = container.querySelector("details")!;
    const summary = disclosure.querySelector("summary")!;
    expect(disclosure).not.toHaveAttribute("open");
    expect(screen.getByText("Payment information not verified", { exact: true })).toBeVisible();
    for (const copy of ["9 appointments today", "4 pending confirmation", "1 no-shows", "2 waiting"]) {
      expect(screen.getByText(copy)).toBeVisible();
    }
    // Inspect all mounted content, including content hidden by the disclosure.
    expect(container.textContent).not.toMatch(/EXACT|HELD|UNKNOWN|[$%]|987654|8765|7654|6543|-321/);
    expect(container.textContent).not.toContain(recommendation);
    expect(container.textContent).not.toMatch(/Collected|Revenue|Outstanding|overdue/i);
    expect(screen.getByText("Review today’s appointments and availability.")).not.toBeVisible();
    fireEvent.click(summary);
    expect(disclosure).toHaveAttribute("open");
    expect(screen.getByText("Payment information not verified", { exact: true })).toBeVisible();
    expect(screen.getByText(/^Payment information not verified\. Financial amounts/)).toBeVisible();
    for (const label of ["Appointments", "Staff working", "Available slots", "Waitlist", "No-shows", "Pending confirmations"]) {
      expect(screen.getByText(label, { exact: true })).toBeVisible();
    }
    expect(screen.getByText("6 bookings · 5 reschedules · 7 confirmations")).toBeVisible();
    expect(screen.getByText("17 open slots")).toBeVisible();
    expect(screen.getByText("Review today’s appointments and availability.")).toBeVisible();
    fireEvent.click(summary);
    expect(disclosure).not.toHaveAttribute("open");
    expect(screen.getByText("Payment information not verified", { exact: true })).toBeVisible();
  });

it("does not read unverified financial fields or any unproven Chase recommendation", () => {
  const forbidden = () => { throw new Error("Unverified financial input consumed"); };
  const brief = { ...operational } as MorningBriefData;
  Object.defineProperties(brief, {
    todayRevenue: { get: forbidden }, outstandingPayments: { get: forbidden },
    chase: { get: forbidden },
  });
  const { container } = render(<MorningBrief brief={brief} />);
  fireEvent.click(container.querySelector("summary")!);
  expect(screen.getByText("6 bookings · 5 reschedules · 7 confirmations")).toBeVisible();
  expect(screen.getByText("Payment information not verified", { exact: true })).toBeVisible();
});
