import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ActionState, Staff, StaffWorkingHours } from "@/lib/types/booking";
import type { CrmProfile } from "@/lib/crm/types";
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

vi.mock("@/lib/actions/crm", () => ({
  updateCrmCustomer: vi.fn(),
}));

vi.mock("@/lib/actions/staff-schedule", () => ({
  updateStaffWorkingHours: vi.fn(),
  addStaffVacation: vi.fn(),
  deleteStaffVacation: vi.fn(),
}));

import { CustomerMarketingForm } from "@/components/crm/customer-overview-read";
import { StaffScheduleDialog } from "@/components/staff/staff-schedule-dialog";

function profile(overrides: Partial<CrmProfile["customer"]> = {}): CrmProfile {
  return {
    customer: {
      id: "cust-1",
      business_id: "biz-1",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: null,
      notes: null,
      tags: ["Regular"],
      referral_source: "Google",
      first_name: "Jane",
      last_name: "Doe",
      is_vip: false,
      marketing_consent: false,
      loyalty_status: "standard",
      created_at: "2026-08-21T00:00:00.000Z",
      updated_at: "2026-08-21T22:00:00.000Z",
      ...overrides,
    },
    documents: [],
    notes: [],
    payments: [],
    communications: {
      history: [],
      followUps: [],
      emailHistory: [],
      smsHistory: [],
      reminderHistory: [],
      notes: [],
    },
    appointments: {
      all: [],
      upcoming: [],
      needsAttention: [],
      completed: [],
      cancelled: [],
      noShows: [],
      recurring: [],
    },
    timeline: [],
    insights: {
      lifetimeRevenue: 0,
      totalAppointments: 0,
      completedAppointments: 0,
      averageSpend: 0,
      noShowRate: 0,
      cancellationRate: 0,
      preferredEmployeeName: null,
      preferredServiceName: null,
      preferredLocationName: null,
      lastVisit: null,
      nextAppointment: null,
      upcomingCount: 0,
      cancellationCount: 0,
      noShowCount: 0,
    },
  };
}

const staff: Staff = {
  id: "staff-1",
  business_id: "biz-1",
  location_id: "loc-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  title: "Lead",
  photo_url: null,
  biography: null,
  qualifications: null,
  color: "#2563EB",
  is_active: true,
  created_at: "2026-08-21T00:00:00.000Z",
  updated_at: "2026-08-21T00:00:00.000Z",
};

function workingHours(start = "09:00", working = true): StaffWorkingHours[] {
  return [
    {
      id: "wh-1",
      staff_id: "staff-1",
      day_of_week: 1,
      is_working: working,
      start_time: start,
      end_time: "17:00",
      lunch_start_time: "12:00",
      lunch_end_time: "13:00",
      overtime_eligible: false,
    },
  ];
}

describe("CustomerMarketingForm post-save remount", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("shows persisted tags and marketing consent after save", () => {
    const { rerender } = render(
      <ToastProvider>
        <CustomerMarketingForm profile={profile()} memberships={[]} />
      </ToastProvider>,
    );
    const tags = screen.getByLabelText("Tags") as HTMLInputElement;
    const consent = screen.getByLabelText("Marketing consent") as HTMLInputElement;
    fireEvent.change(tags, { target: { value: "VIP, Regular" } });
    fireEvent.click(consent);
    tags.value = "Regular";
    consent.checked = false;

    actionState.current = { success: "Customer saved." };
    rerender(
      <ToastProvider>
        <CustomerMarketingForm
          profile={profile({
            tags: ["VIP", "Regular"],
            marketing_consent: true,
            updated_at: "2026-08-21T22:05:00.000Z",
          })}
          memberships={[]}
        />
      </ToastProvider>,
    );

    expect((screen.getByLabelText("Tags") as HTMLInputElement).value).toBe(
      "VIP, Regular",
    );
    expect((screen.getByLabelText("Marketing consent") as HTMLInputElement).checked).toBe(
      true,
    );
  });
});

describe("StaffScheduleDialog working hours post-save remount", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("remounts Monday start time after save while the dialog stays open", () => {
    const { rerender, container } = render(
      <ToastProvider>
        <StaffScheduleDialog
          open
          onClose={() => undefined}
          staff={staff}
          workingHours={workingHours("09:00")}
          vacations={[]}
        />
      </ToastProvider>,
    );
    const start = container.querySelector(
      'input[name="day_1_start"]',
    ) as HTMLInputElement;
    fireEvent.change(start, { target: { value: "10:00" } });
    start.value = "09:00";

    actionState.current = { success: "Hours saved." };
    rerender(
      <ToastProvider>
        <StaffScheduleDialog
          open
          onClose={() => undefined}
          staff={staff}
          workingHours={workingHours("10:00")}
          vacations={[]}
        />
      </ToastProvider>,
    );

    expect(
      (container.querySelector('input[name="day_1_start"]') as HTMLInputElement).value,
    ).toBe("10:00");
  });
});
