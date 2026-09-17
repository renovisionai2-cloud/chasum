import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AppointmentSection } from "@/components/booking-sheet/appointment-section";
import { QuickActionsMenu } from "@/components/booking-sheet/quick-actions-menu";
import type { Location, Service } from "@/lib/types/booking";

afterEach(() => {
  cleanup();
});

const noop = () => undefined;

describe("cancelled Booking Sheet terminal UI", () => {
  it("does not offer Arrived, Complete, Reschedule, or Cancel for a cancelled appointment", async () => {
    const user = userEvent.setup();
    render(
      <QuickActionsMenu
        isEditing
        canCancel={false}
        terminalCancelled
        onCheckIn={noop}
        onComplete={noop}
        onCancel={noop}
        onReschedule={noop}
        onDuplicate={noop}
        onCollectPayment={noop}
        onPrint={noop}
        onMessage={noop}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Quick actions" }));
    expect(screen.queryByRole("menuitem", { name: "Arrived" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Complete" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Reschedule" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toBeInTheDocument();
  });

  it("locks operational fields and keeps notes editable when cancelled", () => {
    const service: Service = {
      id: "svc-1",
      business_id: "biz-1",
      location_id: "loc-1",
      name: "Cut",
      description: null,
      category: null,
      duration_minutes: 45,
      price: 0,
      color: "#000",
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
      is_active: true,
      online_booking: true,
      preparation_instructions: null,
      internal_notes: null,
      cancellation_policy: null,
      created_at: "2026-09-16T00:00:00.000Z",
      updated_at: "2026-09-16T00:00:00.000Z",
    };
    const location: Location = {
      id: "loc-1",
      business_id: "biz-1",
      name: "HQ",
      slug: "hq",
      timezone: "America/Toronto",
      is_default: true,
      is_active: true,
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      postal_code: null,
      phone: null,
      metadata: {},
      created_at: "2026-09-16T00:00:00.000Z",
      updated_at: "2026-09-16T00:00:00.000Z",
    };

    render(
      <AppointmentSection
        services={[service]}
        packages={[]}
        staff={[]}
        locations={[location]}
        offerType="service"
        packageId=""
        serviceId="svc-1"
        staffId=""
        locationId="loc-1"
        date="2026-09-17"
        durationMinutes={45}
        status="cancelled"
        notes="keep this"
        bookingSource="Reception"
        locked
        onOfferTypeChange={noop}
        onPackageChange={noop}
        onServiceChange={noop}
        onStaffChange={noop}
        onLocationChange={noop}
        onDateChange={noop}
        onDurationChange={noop}
        onStatusChange={noop}
        onNotesChange={noop}
      />,
    );

    expect(screen.getByLabelText("Status")).toBeDisabled();
    expect(screen.getByLabelText("Status")).toHaveValue("cancelled");
    expect(screen.queryByRole("option", { name: "Booked" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Service")).toBeDisabled();
    expect(screen.getByLabelText("Employee")).toBeDisabled();
    expect(screen.getByLabelText("Date")).toBeDisabled();
    expect(screen.getByLabelText("Notes")).not.toBeDisabled();
    expect(screen.queryByRole("button", { name: "Adjust duration" })).not.toBeInTheDocument();
  });

  it("does not offer Cancelled as a generic active status choice", async () => {
    const service: Service = {
      id: "svc-1",
      business_id: "biz-1",
      location_id: "loc-1",
      name: "Cut",
      description: null,
      category: null,
      duration_minutes: 45,
      price: 0,
      color: "#000",
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
      is_active: true,
      online_booking: true,
      preparation_instructions: null,
      internal_notes: null,
      cancellation_policy: null,
      created_at: "2026-09-16T00:00:00.000Z",
      updated_at: "2026-09-16T00:00:00.000Z",
    };
    const location: Location = {
      id: "loc-1",
      business_id: "biz-1",
      name: "HQ",
      slug: "hq",
      timezone: "America/Toronto",
      is_default: true,
      is_active: true,
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      postal_code: null,
      phone: null,
      metadata: {},
      created_at: "2026-09-16T00:00:00.000Z",
      updated_at: "2026-09-16T00:00:00.000Z",
    };

    render(
      <AppointmentSection
        services={[service]}
        packages={[]}
        staff={[]}
        locations={[location]}
        offerType="service"
        packageId=""
        serviceId="svc-1"
        staffId=""
        locationId="loc-1"
        date="2026-09-17"
        durationMinutes={45}
        status="confirmed"
        notes=""
        bookingSource="Reception"
        onOfferTypeChange={noop}
        onPackageChange={noop}
        onServiceChange={noop}
        onStaffChange={noop}
        onLocationChange={noop}
        onDateChange={noop}
        onDurationChange={noop}
        onStatusChange={noop}
        onNotesChange={noop}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /advanced/i }));
    const status = screen.getByLabelText("Status");
    expect(status).not.toBeDisabled();
    expect(status).toHaveValue("confirmed");
    expect(
      screen.queryByRole("option", { name: "Cancelled" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Arrived" })).toBeInTheDocument();
  });
});
