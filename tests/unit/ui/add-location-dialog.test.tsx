import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddLocationDialog } from "@/components/dashboard/add-location-dialog";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    refresh,
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/actions/location", () => ({
  createLocation: vi.fn(async () => ({})),
  assignStaffToLocation: vi.fn(async () => ({})),
}));

const setupContext = {
  sources: [
    {
      id: "loc-default",
      name: "Main Studio",
      isDefault: true,
      serviceCount: 7,
      openDayCount: 5,
      hourDayCount: 7,
      segmentCount: 2,
      settings: {
        appointmentIntervalMinutes: 15,
        bookingLimitDays: 90,
        maxDailyBookings: 20,
        cancellationPolicy: "24 hours",
        minBookingNoticeMinutes: 60,
        defaultTravelMinutes: 10,
        timezone: "America/Toronto",
      },
    },
    {
      id: "loc-branch",
      name: "West Branch",
      isDefault: false,
      serviceCount: 4,
      openDayCount: 4,
      hourDayCount: 7,
      segmentCount: 0,
      settings: {
        appointmentIntervalMinutes: 30,
        bookingLimitDays: 60,
        maxDailyBookings: null,
        cancellationPolicy: null,
        minBookingNoticeMinutes: 0,
        defaultTravelMinutes: 0,
        timezone: "America/Toronto",
      },
    },
  ],
  defaultLocationCount: 1,
  staff: [
    {
      id: "staff-1",
      name: "Alex Provider",
      homeLocationId: "loc-default",
      locationIds: ["loc-default"],
    },
  ],
};

function renderDialog() {
  return render(
    <AddLocationDialog
      open
      onOpenChange={vi.fn()}
      defaultTimezone="America/Toronto"
      setupContext={setupContext}
      canAdd
      planName="Business"
      maxLocations={6}
      blankDefaults={{
        appointmentIntervalMinutes: 20,
        bookingLimitDays: 45,
        maxDailyBookings: 12,
        cancellationPolicy: "24 hours",
      }}
    />,
  );
}

async function goToSetup() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Location name"), "Downtown");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  return user;
}

describe("Stage 1C Add Location workflow", () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
  });

  it("exposes accessible setup choices and truthful Start blank preview", async () => {
    renderDialog();
    expect(
      screen.getByRole("dialog", { name: "Add location" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Location name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close dialog" }),
    ).toBeInTheDocument();

    const user = await goToSetup();

    const defaultChoice = screen.getByRole("button", {
      name: /Default location/i,
    });
    const copyChoice = screen.getByRole("button", {
      name: /Copy another/i,
    });
    const blankChoice = screen.getByRole("button", {
      name: /Start blank/i,
    });

    expect(defaultChoice).toHaveAttribute("aria-pressed", "true");
    expect(copyChoice).toHaveAttribute("aria-pressed", "false");
    expect(blankChoice).toHaveAttribute("aria-pressed", "false");

    await user.click(blankChoice);
    expect(blankChoice).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Review setup" }));

    expect(screen.getByText("Start blank")).toBeInTheDocument();
    expect(screen.getByText("None copied")).toBeInTheDocument();
    expect(screen.getByText("Closed by default")).toBeInTheDocument();
    expect(
      screen.getByText(/Staff and rooms\/resources are not copied automatically/i),
    ).toBeInTheDocument();
  });

  it("previews an explicitly selected source as a copied snapshot", async () => {
    renderDialog();
    const user = await goToSetup();

    await user.click(screen.getByRole("button", { name: /Copy another/i }));
    fireEvent.change(screen.getByLabelText("Copy from"), {
      target: { value: "loc-branch" },
    });
    await user.click(screen.getByRole("button", { name: "Review setup" }));

    expect(screen.getByText("Copied from West Branch")).toBeInTheDocument();
    expect(screen.getByText("4 active services")).toBeInTheDocument();
    expect(screen.queryByText(/Inherited from/i)).not.toBeInTheDocument();
  });
});
