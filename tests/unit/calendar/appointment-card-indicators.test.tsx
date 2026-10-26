import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { DayAppointmentCard } from "@/components/day-view/appointment-card";
import { customer, service, staff } from "./cal01-fixtures";
import type { AppointmentWithRelations } from "@/lib/types/booking";

const appointment = {
  id: "synthetic-short", start_time: "2026-10-26T13:00:00Z", end_time: "2026-10-26T13:15:00Z",
  status: "confirmed", customer, service, staff, staff_id: staff.id, price_cents: 1000, deposit_cents: 0,
  notes: "PRIVATE_SYNTHETIC_NOTE_MUST_NOT_LEAK",
} as AppointmentWithRelations;
afterEach(cleanup);

it.each([
  { due: true, notes: true }, { due: true, notes: false },
  { due: false, notes: true }, { due: false, notes: false },
])("exposes only truthful payment/notes indicators: %j", ({ due, notes }) => {
  render(<DayAppointmentCard appointment={{ ...appointment, deposit_cents: due ? 0 : 1000, notes: notes ? appointment.notes : "  " }}
    timezone="America/Toronto" onSelect={vi.fn()} />);
  const card = screen.getByRole("button", { name: /Test Customer/ });
  for (const [label, enabled] of [["Payment due", due], ["Has notes", notes]] as const) {
    expect(card.getAttribute("aria-label")?.includes(label)).toBe(enabled);
    expect(card.title.includes(label)).toBe(enabled);
    if (enabled) expect(screen.getByTitle(label)).toBeVisible();
    else expect(screen.queryByTitle(label)).toBeNull();
  }
  expect(card).toHaveAccessibleName(/9:00 AM to 9:15 AM, 15 minutes, confirmed/);
  expect(card).not.toHaveAccessibleName(/PRIVATE_SYNTHETIC/);
  expect(card.title).not.toContain("PRIVATE_SYNTHETIC");
});

it.each([
  { status: "completed" }, { status: "cancelled" }, { price_cents: null }, { price_cents: 0 },
] as Partial<AppointmentWithRelations>[])("does not introduce a false payment warning for %j", overrides => {
  render(<DayAppointmentCard appointment={{ ...appointment, ...overrides }} onSelect={vi.fn()} />);
  const card = screen.getByRole("button", { name: /Test Customer/ });
  expect(card).not.toHaveAccessibleName(/Payment due/);
  expect(card.title).not.toContain("Payment due");
  expect(screen.queryByTitle("Payment due")).toBeNull();
  expect(card).toHaveAccessibleName(/Has notes/);
});

it("keeps pointer/keyboard opening and drag payloads on a flagged short card", async () => {
  const onSelect = vi.fn(), setData = vi.fn();
  render(<DayAppointmentCard appointment={appointment} onSelect={onSelect} draggable />);
  const card = screen.getByRole("button", { name: /Payment due, Has notes/ });
  fireEvent.click(screen.getByTitle("Has notes"));
  expect(onSelect).toHaveBeenLastCalledWith(appointment);
  card.focus();
  await userEvent.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledTimes(2);
  fireEvent.dragStart(card, { dataTransfer: { setData } });
  expect(setData).toHaveBeenCalledWith("appointmentId", "synthetic-short");
  expect(setData).toHaveBeenCalledWith("duration", "15");
  expect(card).toHaveAttribute("data-interacting", "true");
  fireEvent.dragEnd(card);
  expect(card).not.toHaveAttribute("data-interacting");
});
