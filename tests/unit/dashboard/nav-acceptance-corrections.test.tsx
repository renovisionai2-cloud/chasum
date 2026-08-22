import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ActionState, Business, Location } from "@/lib/types/booking";
import { ToastProvider } from "@/providers/toast-provider";
import { DASHBOARD_NAV } from "@/lib/dashboard/nav";

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
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/business",
}));

vi.mock("@/lib/actions/business-management", () => ({
  updateBusinessManagementProfile: vi.fn(),
  upsertServiceCategory: vi.fn(),
  upsertBookingResource: vi.fn(),
  upsertMembership: vi.fn(),
  upsertPackage: vi.fn(),
  createGiftCard: vi.fn(),
  redeemGiftCard: vi.fn(),
  upsertTaxRate: vi.fn(),
  upsertDiscountCode: vi.fn(),
  upsertFormTemplate: vi.fn(),
  upsertAutomationRule: vi.fn(),
  deleteServiceCategory: vi.fn(),
  deleteBookingResource: vi.fn(),
  deleteMembership: vi.fn(),
  deletePackage: vi.fn(),
  deleteTaxRate: vi.fn(),
  deleteDiscountCode: vi.fn(),
  deleteFormTemplate: vi.fn(),
  deleteAutomationRule: vi.fn(),
  createBusinessClosure: vi.fn(),
  deleteBusinessClosure: vi.fn(),
  updateBusinessBookingSettings: vi.fn(),
  updateBusinessNotificationSettings: vi.fn(),
  updateBusinessBrandingSettings: vi.fn(),
  updateBusinessAiSettings: vi.fn(),
  emailGiftCertificateAction: vi.fn(),
  loadGiftCertificate: vi.fn(),
  addBusinessDocument: vi.fn(),
  deleteBusinessDocument: vi.fn(),
}));

vi.mock("@/lib/actions/location", () => ({
  updateLocationHours: vi.fn(),
  updateLocationSettings: vi.fn(),
  createLocation: vi.fn(),
  updateLocationFromForm: vi.fn(),
}));

vi.mock("@/lib/actions/holidays", () => ({
  createHoliday: vi.fn(),
  deleteHoliday: vi.fn(),
}));

vi.mock("@/lib/actions/uploads", () => ({
  uploadBusinessAsset: vi.fn(),
}));

import { BusinessHub } from "@/components/business/business-hub";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

function business(overrides: Partial<Business> = {}): Business {
  return {
    id: "biz-1",
    owner_id: "user-1",
    name: "Chasum HQ",
    slug: "chasum-hq",
    timezone: "America/Toronto",
    currency: "cad",
    appointment_interval_minutes: 15,
    booking_limit_days: 60,
    cancellation_policy: null,
    max_daily_bookings: null,
    created_at: "2026-08-21T00:00:00.000Z",
    updated_at: "2026-08-21T22:00:00.000Z",
    ...overrides,
  };
}

function location(overrides: Partial<Location> = {}): Location {
  return {
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
    ...overrides,
  };
}

function hub(args: {
  canAdd: boolean;
  initialTab?: "locations" | "memberships" | "categories";
}) {
  return (
    <ToastProvider>
      <BusinessHub
        business={business()}
        locations={[location()]}
        locationQuota={{
          plan: { name: "Free", max_locations: args.canAdd ? 3 : 1 },
          currentCount: args.canAdd ? 0 : 1,
          canAdd: args.canAdd,
        }}
        services={[]}
        categories={[]}
        resources={[]}
        memberships={[]}
        packages={[]}
        giftCards={[]}
        taxRates={[]}
        discounts={[]}
        forms={[]}
        automationRules={[]}
        hours={[]}
        holidays={[]}
        closures={[]}
        documents={[]}
        initialTab={args.initialTab ?? "locations"}
      />
    </ToastProvider>
  );
}

describe("navigation acceptance corrections", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("hides direct Add Location actions at quota and keeps apply", () => {
    render(hub({ canAdd: false, initialTab: "locations" }));
    expect(screen.queryByRole("button", { name: "Add Location" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Apply for Professional/i }),
    ).toHaveAttribute("href", "/apply");
    expect(screen.getByText(/Location limit reached/i)).toBeInTheDocument();
  });

  it("keeps Add Location available when quota allows it", () => {
    render(
      hub({
        canAdd: true,
        initialTab: "locations",
      }),
    );
    const addButtons = screen.getAllByRole("button", { name: "Add Location" });
    expect(addButtons.length).toBeGreaterThan(0);
    expect(addButtons.every((button) => !(button as HTMLButtonElement).disabled)).toBe(
      true,
    );
  });

  it("labels Business setup overflow as More and lists every section", () => {
    render(hub({ canAdd: false, initialTab: "memberships" }));
    expect(
      screen.getByRole("button", {
        name: /More Business setup sections/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab", { name: "Memberships" }).length).toBeGreaterThan(
      0,
    );
  });

  it("keeps membership name off identity autocomplete and destination truth visible", () => {
    render(hub({ canAdd: false, initialTab: "memberships" }));
    const name = screen.getByLabelText("Membership name") as HTMLInputElement;
    expect(name).toHaveAttribute("autocomplete", "off");
    expect(name.getAttribute("name")).toBe("name");
    expect(screen.getByText(/Preview \/ Coming Soon/)).toBeInTheDocument();
  });

  it("exposes understandable labels on category add controls", () => {
    render(hub({ canAdd: false, initialTab: "categories" }));
    expect(screen.getByLabelText("Category name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Icon key")).toBeInTheDocument();
    expect(screen.getByLabelText("Color")).toBeInTheDocument();
    expect(screen.getByLabelText("Display order")).toBeInTheDocument();
  });

  it("keeps Memberships nav label and a text Preview indicator", () => {
    const memberships = DASHBOARD_NAV.find((i) => i.label === "Memberships");
    expect(memberships?.badge).toBe("Preview");
    expect(memberships?.label).toBe("Memberships");
    render(<DashboardSidebar />);
    expect(
      screen.getByRole("link", { name: "Memberships, Preview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });
});
