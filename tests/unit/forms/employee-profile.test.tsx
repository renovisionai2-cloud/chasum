import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ActionState } from "@/lib/types/booking";
import type { EmployeeProfile } from "@/lib/employees/types";
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

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => {
    const alt = props.alt ?? "";
    return <span data-testid="next-image">{alt}</span>;
  },
}));

vi.mock("@/lib/actions/employees", () => ({
  updateEmployeeProfile: vi.fn(),
  addEmployeeNoteAction: vi.fn(),
}));

vi.mock("@/lib/actions/staff-schedule", () => ({
  updateStaffWorkingHours: vi.fn(),
  addStaffVacation: vi.fn(),
  deleteStaffVacation: vi.fn(),
}));

vi.mock("@/lib/actions/staff-documents", () => ({
  addStaffDocument: vi.fn(),
  deleteStaffDocument: vi.fn(),
}));

import { EmployeeProfileView } from "@/components/employees/employee-profile";

function employee(overrides: Partial<EmployeeProfile> = {}): EmployeeProfile {
  return {
    id: "staff-1",
    business_id: "biz-1",
    location_id: "loc-1",
    default_location_id: "loc-1",
    name: "Ada Lovelace",
    first_name: "Ada",
    last_name: "Lovelace",
    preferred_name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "416-000-0000",
    title: "Lead",
    photo_url: null,
    biography: null,
    qualifications: null,
    color: "#2563EB",
    is_active: true,
    department_id: null,
    employment_status: "active",
    role_key: "employee",
    custom_role_id: null,
    permissions: [],
    hire_date: null,
    termination_date: null,
    notes: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    emergency_contact_relationship: null,
    pay_type: "hourly",
    hourly_rate_cents: 2500,
    salary_cents: null,
    commission_rate_bps: null,
    payroll_notes: null,
    user_id: null,
    booking_rules: {
      max_appointments_per_day: null,
      min_break_minutes: 0,
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
      accept_online_bookings: true,
      accept_new_clients: true,
      accept_walk_ins: false,
      priority_scheduling: 0,
      overtime_eligible: false,
    },
    created_at: "2026-08-21T00:00:00.000Z",
    updated_at: "2026-08-21T22:00:00.000Z",
    department: null,
    location: { id: "loc-1", name: "Main" },
    staff_services: [],
    staff_locations: [{ location_id: "loc-1", is_primary: true, location: { id: "loc-1", name: "Main" } }],
    hours: [],
    hour_segments: [],
    vacations: [],
    closures: [],
    documents: [],
    activity: [],
    performance: {
      completedAppointments: 0,
      upcomingAppointments: 0,
      cancelledAppointments: 0,
      noShowAppointments: 0,
      lifetimeRevenue: 0,
      completionRate: 0,
      noShowRate: 0,
    },
    availabilityBlocks: [],
    ...overrides,
  };
}

const location = {
  id: "loc-1",
  business_id: "biz-1",
  name: "Main",
  slug: "main",
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
  created_at: "2026-08-21T00:00:00.000Z",
  updated_at: "2026-08-21T00:00:00.000Z",
};

function renderProfile(row: EmployeeProfile) {
  return render(
    <ToastProvider>
      <EmployeeProfileView
        employee={row}
        services={[]}
        locations={[location]}
        departments={[]}
      />
    </ToastProvider>,
  );
}

describe("EmployeeProfileView post-save remount", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("shows persisted first name and inactive status after save even if React reset the fields", () => {
    const initial = employee({ first_name: "Ada", is_active: true });
    const { rerender } = renderProfile(initial);

    const firstName = screen.getByLabelText("First name") as HTMLInputElement;
    const status = screen.getByLabelText("Status") as HTMLSelectElement;
    fireEvent.change(firstName, { target: { value: "Augusta" } });
    fireEvent.change(status, { target: { value: "false" } });
    expect(firstName.value).toBe("Augusta");
    expect(status.value).toBe("false");

    firstName.value = "Ada";
    status.value = "true";
    expect(firstName.value).toBe("Ada");

    actionState.current = { success: "Employee profile saved." };
    const saved = employee({
      first_name: "Augusta",
      is_active: false,
      updated_at: "2026-08-21T22:05:00.000Z",
    });
    rerender(
      <ToastProvider>
        <EmployeeProfileView
          employee={saved}
          services={[]}
          locations={[location]}
          departments={[]}
        />
      </ToastProvider>,
    );

    expect((screen.getByLabelText("First name") as HTMLInputElement).value).toBe(
      "Augusta",
    );
    expect((screen.getByLabelText("Status") as HTMLSelectElement).value).toBe(
      "false",
    );
    expect(
      (screen.getByLabelText("First name") as HTMLInputElement).value,
    ).not.toBe("Ada");
  });
});
