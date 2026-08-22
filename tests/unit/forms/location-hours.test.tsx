import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ActionState, LocationHours } from "@/lib/types/booking";
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
  updateLocationHours: vi.fn(),
  updateLocationSettings: vi.fn(),
}));

vi.mock("@/lib/actions/holidays", () => ({
  createHoliday: vi.fn(),
  deleteHoliday: vi.fn(),
}));

vi.mock("@/lib/actions/business-hours", () => ({
  updateBusinessProfile: vi.fn(),
}));

import { HoursSettingsPanel } from "@/components/business/hours-settings-panel";
import { LocationHoursForm } from "@/components/settings/settings-manager";

function hours(openTime = "09:00", mondayOpen = true): LocationHours[] {
  return [
    {
      id: "h-1",
      location_id: "loc-1",
      day_of_week: 1,
      is_open: mondayOpen,
      open_time: openTime,
      close_time: "17:00",
    },
  ];
}

describe("Location hours post-save remount", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("HoursSettingsPanel shows persisted Monday open time and closed checkbox", () => {
    const { rerender, container } = render(
      <ToastProvider>
        <HoursSettingsPanel hours={hours("09:00", true)} holidays={[]} closures={[]} />
      </ToastProvider>,
    );

    const openTime = container.querySelector(
      'input[name="day_1_open_time"]',
    ) as HTMLInputElement;
    const openToggle = container.querySelector(
      'input[name="day_1_open"]',
    ) as HTMLInputElement;
    fireEvent.change(openTime, { target: { value: "10:00" } });
    fireEvent.click(openToggle);
    expect(openToggle.checked).toBe(false);

    openTime.value = "09:00";
    openToggle.checked = true;

    actionState.current = { success: "Hours saved." };
    rerender(
      <ToastProvider>
        <HoursSettingsPanel hours={hours("10:00", false)} holidays={[]} closures={[]} />
      </ToastProvider>,
    );

    const savedTime = container.querySelector(
      'input[name="day_1_open_time"]',
    ) as HTMLInputElement;
    const savedToggle = container.querySelector(
      'input[name="day_1_open"]',
    ) as HTMLInputElement;
    expect(savedTime.value).toBe("10:00");
    expect(savedToggle.checked).toBe(false);
    expect(savedTime.value).not.toBe("09:00");
  });

  it("Settings LocationHoursForm remounts weekday time after save", () => {
    const { rerender, container } = render(
      <ToastProvider>
        <LocationHoursForm hours={hours("09:00")} locationName="Chasum HQ — Main" />
      </ToastProvider>,
    );
    expect(screen.getByText("Chasum HQ — Main")).toBeInTheDocument();

    const openTime = container.querySelector(
      'input[name="day_1_open_time"]',
    ) as HTMLInputElement;
    fireEvent.change(openTime, { target: { value: "08:30" } });
    openTime.value = "09:00";

    actionState.current = { success: "Hours saved." };
    rerender(
      <ToastProvider>
        <LocationHoursForm hours={hours("08:30")} locationName="Chasum HQ — Main" />
      </ToastProvider>,
    );

    expect(
      (container.querySelector('input[name="day_1_open_time"]') as HTMLInputElement)
        .value,
    ).toBe("08:30");
  });
});
