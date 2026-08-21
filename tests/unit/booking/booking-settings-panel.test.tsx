import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ActionState, Business } from "@/lib/types/booking";
import { ToastProvider } from "@/providers/toast-provider";

const actionState: { current: ActionState } = { current: {} };

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: () => [actionState.current, vi.fn(), false],
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/lib/actions/business-management", () => ({
  updateBusinessBookingSettings: vi.fn(),
}));

import { BookingSettingsPanel } from "@/components/business/booking-settings-panel";

function business(overrides: Partial<Business> = {}): Business {
  return {
    id: "biz-1",
    owner_id: "user-1",
    name: "Chasum HQ",
    slug: "chasum-hq",
    timezone: "America/Toronto",
    appointment_interval_minutes: 30,
    booking_limit_days: 60,
    cancellation_policy: null,
    max_daily_bookings: null,
    min_notice_minutes: 0,
    cancellation_window_hours: 24,
    booking_confirmation_mode: "auto",
    reschedule_policy: null,
    online_booking_enabled: true,
    waitlist_enabled: true,
    created_at: "2026-08-21T00:00:00.000Z",
    updated_at: "2026-08-21T22:00:00.000Z",
    ...overrides,
  };
}

function renderPanel(row: Business) {
  return render(
    <ToastProvider>
      <BookingSettingsPanel business={row} />
    </ToastProvider>,
  );
}

function intervalSelect() {
  return screen.getByLabelText("Booking time interval") as HTMLSelectElement;
}

function daysInput() {
  return screen.getByLabelText("Maximum future booking (days)") as HTMLInputElement;
}

describe("BookingSettingsPanel post-save remount", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("shows persisted 15 after a successful save even if React reset the uncontrolled fields", () => {
    const initial = business({
      appointment_interval_minutes: 30,
      booking_limit_days: 60,
    });
    const { rerender } = renderPanel(initial);

    fireEvent.change(intervalSelect(), { target: { value: "15" } });
    fireEvent.change(daysInput(), { target: { value: "90" } });
    expect(intervalSelect().value).toBe("15");
    expect(daysInput().value).toBe("90");

    // React 19 successful form-action reset restores mount-time defaultValues.
    intervalSelect().value = "30";
    daysInput().value = "60";
    expect(intervalSelect().value).toBe("30");
    expect(daysInput().value).toBe("60");

    actionState.current = { success: "Booking settings saved." };
    const saved = business({
      appointment_interval_minutes: 15,
      booking_limit_days: 90,
      updated_at: "2026-08-21T22:05:00.000Z",
    });
    rerender(
      <ToastProvider>
        <BookingSettingsPanel business={saved} />
      </ToastProvider>,
    );

    expect(intervalSelect().value).toBe("15");
    expect(daysInput().value).toBe("90");
    expect(intervalSelect().value).not.toBe("30");
    expect(
      screen.getAllByText("Booking settings saved.").length,
    ).toBeGreaterThan(0);
  });
});
