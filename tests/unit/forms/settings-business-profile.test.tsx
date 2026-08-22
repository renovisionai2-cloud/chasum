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

vi.mock("@/lib/actions/business-hours", () => ({
  updateBusinessProfile: vi.fn(),
}));

vi.mock("@/lib/actions/uploads", () => ({
  uploadBusinessAsset: vi.fn(),
}));

import { SettingsBusinessProfileForm } from "@/components/settings/settings-manager";

function business(overrides: Partial<Business> = {}): Business {
  return {
    id: "biz-1",
    owner_id: "user-1",
    name: "Old Name",
    slug: "chasum-hq",
    timezone: "America/Toronto",
    appointment_interval_minutes: 15,
    booking_limit_days: 60,
    cancellation_policy: "Cancel 24 hours ahead",
    max_daily_bookings: null,
    public_booking_mode: "public",
    created_at: "2026-08-21T00:00:00.000Z",
    updated_at: "2026-08-21T22:00:00.000Z",
    ...overrides,
  };
}

function renderForm(row: Business) {
  return render(
    <ToastProvider>
      <SettingsBusinessProfileForm business={row} />
    </ToastProvider>,
  );
}

describe("Settings Business Profile post-save remount", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("shows persisted name and invite-only mode after save even if React reset the fields", () => {
    const { rerender } = renderForm(business());
    const name = screen.getByLabelText("Business name") as HTMLInputElement;
    const mode = screen.getByLabelText("Public booking access") as HTMLSelectElement;
    fireEvent.change(name, { target: { value: "Chasum HQ" } });
    fireEvent.change(mode, { target: { value: "invite_only" } });

    name.value = "Old Name";
    mode.value = "public";

    actionState.current = { success: "Business profile saved." };
    rerender(
      <ToastProvider>
        <SettingsBusinessProfileForm
          business={business({
            name: "Chasum HQ",
            public_booking_mode: "invite_only",
            updated_at: "2026-08-21T22:05:00.000Z",
          })}
        />
      </ToastProvider>,
    );

    expect((screen.getByLabelText("Business name") as HTMLInputElement).value).toBe(
      "Chasum HQ",
    );
    expect(
      (screen.getByLabelText("Public booking access") as HTMLSelectElement).value,
    ).toBe("invite_only");
    expect(
      (screen.getByLabelText("Business name") as HTMLInputElement).value,
    ).not.toBe("Old Name");
  });
});
