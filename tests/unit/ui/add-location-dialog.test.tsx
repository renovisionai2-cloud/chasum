import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocationSetupContext } from "@/lib/actions/location";
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

const setupContext: LocationSetupContext = {
  businessMinBookingNoticeMinutes: 45,
  sources: [
    {
      id: "loc-default",
      name: "Main Studio",
      isDefault: true,
      serviceCount: 7,
      openDayCount: 5,
      hourDayCount: 7,
      segmentCount: 2,
      weeklyHours: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        ranges: dayOfWeek === 0 || dayOfWeek === 6 ? [] : dayOfWeek === 2
          ? [{ openTime: "08:00:00", closeTime: "12:00:00" }, { openTime: "13:00:00", closeTime: "19:00:00" }]
          : [{ openTime: "09:00:00", closeTime: "17:00:00" }],
      })),
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
      weeklyHours: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        ranges: dayOfWeek >= 1 && dayOfWeek <= 4
          ? [{ openTime: "10:30:00", closeTime: "18:45:00" }] : [],
      })),
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
  await user.selectOptions(screen.getByLabelText("Timezone"), "America/Vancouver");
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
    expect(screen.getAllByText("None copied")).toHaveLength(2);
    expect(screen.getByText("Closed by default")).toBeInTheDocument();
    expect(screen.getByText("None assigned")).toBeInTheDocument();
    expect(screen.getByText("Business booking defaults")).toBeInTheDocument();
    expect(screen.getByText("20 minutes")).toBeInTheDocument();
    expect(screen.getByText("45 days")).toBeInTheDocument();
    expect(screen.getByText("45 minutes")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("24 hours")).toBeInTheDocument();
    expect(screen.getByText("America/Vancouver")).toBeInTheDocument();
    expect(screen.queryByText("Weekly hours")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Staff and rooms\/resources are not copied automatically/i),
    ).toBeInTheDocument();
  });

  it("shows all seven days, split ranges and copied settings in the new timezone", async () => {
    renderDialog();
    expect(screen.queryByLabelText(/slug/i)).not.toBeInTheDocument();
    const user = await goToSetup();
    await user.click(screen.getByRole("button", { name: "Review setup" }));
    expect(screen.getByText("Copied from Main Studio")).toBeInTheDocument();
    expect(screen.getByText("7 active services")).toBeInTheDocument();
    for (const day of ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
    const tuesday = screen.getByText("Tuesday").parentElement!;
    expect(within(tuesday).getByText("8:00 AM–12:00 PM, 1:00 PM–7:00 PM")).toBeInTheDocument();
    expect(screen.queryByText("8:00 AM–7:00 PM")).not.toBeInTheDocument();
    expect(screen.getAllByText("Closed")).toHaveLength(2);
    for (const value of ["15 minutes", "90 days", "60 minutes", "20", "24 hours", "10 minutes", "America/Vancouver"]) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
    expect(screen.queryByText("America/Toronto")).not.toBeInTheDocument();
    expect(document.querySelector('[name="slug"]')).toBeNull();
    const form = screen.getByRole("button", { name: "Create location" }).closest("form")!;
    const submitted = new FormData(form);
    expect(submitted.get("timezone")).toBe("America/Vancouver");
    expect(submitted.get("setup_mode")).toBe("default");
    expect(submitted.get("source_location_id")).toBe("loc-default");
    expect(submitted.has("slug")).toBe(false);
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
    expect(screen.getAllByText("10:30 AM–6:45 PM")).toHaveLength(4);
    expect(screen.getAllByText("Closed")).toHaveLength(3);
    expect(screen.getByText("0 minutes")).toBeInTheDocument();
    expect(screen.queryByText("Max daily bookings")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancellation policy")).not.toBeInTheDocument();
    expect(screen.queryByText("Default travel time")).not.toBeInTheDocument();
    expect(screen.getByText("America/Vancouver")).toBeInTheDocument();
  });
});
