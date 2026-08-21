import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ActionState, LocationSettings } from "@/lib/types/booking";
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

vi.mock("@/lib/actions/location", () => ({
  updateLocationSettings: vi.fn(),
  updateLocationHours: vi.fn(),
}));

import { LocationSchedulingRulesForm } from "@/components/settings/settings-manager";

function settings(overrides: Partial<LocationSettings> = {}): LocationSettings {
  return {
    location_id: "loc-main",
    appointment_interval_minutes: 15,
    booking_limit_days: 60,
    max_daily_bookings: null,
    cancellation_policy: null,
    metadata: {},
    created_at: "2026-08-21T00:00:00.000Z",
    updated_at: "2026-08-21T00:00:00.000Z",
    ...overrides,
  };
}

function renderForm(row: LocationSettings, businessInterval = 15) {
  return render(
    <ToastProvider>
      <LocationSchedulingRulesForm
        settings={row}
        locationName="Chasum HQ — Main"
        businessIntervalMinutes={businessInterval}
      />
    </ToastProvider>,
  );
}

function intervalSelect() {
  return screen.getByLabelText("Booking time interval") as HTMLSelectElement;
}

function daysInput() {
  return screen.getByLabelText("Booking limit (days ahead)") as HTMLInputElement;
}

describe("LocationSchedulingRulesForm post-save remount", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("keeps the location override visible after save + refreshed props", () => {
    const initial = settings({ appointment_interval_minutes: 15 });
    const { rerender } = renderForm(initial, 15);

    fireEvent.change(intervalSelect(), { target: { value: "30" } });
    fireEvent.change(daysInput(), { target: { value: "45" } });
    expect(intervalSelect().value).toBe("30");

    intervalSelect().value = "15";
    daysInput().value = "60";
    expect(intervalSelect().value).toBe("15");

    actionState.current = {
      success: "Location scheduling settings updated.",
    };
    const saved = settings({
      appointment_interval_minutes: 30,
      booking_limit_days: 45,
    });
    rerender(
      <ToastProvider>
        <LocationSchedulingRulesForm
          settings={saved}
          locationName="Chasum HQ — Main"
          businessIntervalMinutes={15}
        />
      </ToastProvider>,
    );

    expect(intervalSelect().value).toBe("30");
    expect(daysInput().value).toBe("45");
    expect(
      screen.getAllByText("Location scheduling settings updated.").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/These settings apply only to Chasum HQ — Main/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Change business-wide defaults/i }),
    ).toHaveAttribute("href", "/dashboard/business?tab=booking");
    expect(
      screen.queryByRole("button", { name: /Save booking settings/i }),
    ).not.toBeInTheDocument();
  });
});
