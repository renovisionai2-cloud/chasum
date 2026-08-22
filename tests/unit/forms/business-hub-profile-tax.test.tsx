import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ActionState, Business } from "@/lib/types/booking";
import type { TaxRate } from "@/lib/business/types";
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

function business(overrides: Partial<Business> = {}): Business {
  return {
    id: "biz-1",
    owner_id: "user-1",
    name: "Chasum HQ",
    slug: "chasum-hq",
    timezone: "America/Toronto",
    appointment_interval_minutes: 15,
    booking_limit_days: 60,
    cancellation_policy: null,
    max_daily_bookings: null,
    created_at: "2026-08-21T00:00:00.000Z",
    updated_at: "2026-08-21T22:00:00.000Z",
    ...overrides,
  };
}

function emptyHub(overrides: {
  business?: Business;
  taxRates?: TaxRate[];
  categories?: { id: string; business_id: string; name: string; description: string | null; icon: string | null; color: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }[];
  initialTab?: "profile" | "taxes" | "categories";
} = {}) {
  return (
    <ToastProvider>
      <BusinessHub
        business={overrides.business ?? business()}
        locations={[]}
        services={[]}
        categories={overrides.categories ?? []}
        resources={[]}
        memberships={[]}
        packages={[]}
        giftCards={[]}
        taxRates={overrides.taxRates ?? []}
        discounts={[]}
        forms={[]}
        automationRules={[]}
        hours={[]}
        holidays={[]}
        closures={[]}
        documents={[]}
        initialTab={overrides.initialTab ?? "profile"}
      />
    </ToastProvider>
  );
}

describe("Business Hub Profile post-save remount", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("shows the persisted name and phone after save even if React reset the fields", () => {
    const { rerender } = render(emptyHub({ business: business({ name: "Old Name", phone: "111" }) }));

    const name = screen.getByLabelText("Business name") as HTMLInputElement;
    const phone = screen.getByLabelText("Phone") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Chasum HQ" } });
    fireEvent.change(phone, { target: { value: "416-555-0100" } });

    name.value = "Old Name";
    phone.value = "111";
    expect(name.value).toBe("Old Name");

    actionState.current = { success: "Business profile saved." };
    rerender(
      emptyHub({
        business: business({
          name: "Chasum HQ",
          phone: "416-555-0100",
          updated_at: "2026-08-21T22:05:00.000Z",
        }),
      }),
    );

    expect((screen.getByLabelText("Business name") as HTMLInputElement).value).toBe(
      "Chasum HQ",
    );
    expect((screen.getByLabelText("Phone") as HTMLInputElement).value).toBe(
      "416-555-0100",
    );
    expect(
      (screen.getByLabelText("Business name") as HTMLInputElement).value,
    ).not.toBe("Old Name");
  });
});

describe("Business Hub Tax Rates post-save display", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("shows the persisted tax rate and remounts the add form empty", () => {
    const { rerender } = render(emptyHub({ initialTab: "taxes" }));

    const name = screen.getByPlaceholderText("Name (e.g. HST)") as HTMLInputElement;
    const rate = screen.getByPlaceholderText("Rate % (enter 13 for 13%)") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "HST" } });
    fireEvent.change(rate, { target: { value: "13" } });
    expect(name.value).toBe("HST");

    actionState.current = { success: "Tax rate saved." };
    rerender(
      emptyHub({
        initialTab: "taxes",
        taxRates: [
          {
            id: "tax-1",
            business_id: "biz-1",
            name: "HST",
            rate_bps: 1300,
            country: "CA",
            region: "ON",
            inclusive: false,
            is_default: true,
            is_active: true,
            created_at: "2026-08-21T22:05:00.000Z",
            updated_at: "2026-08-21T22:05:00.000Z",
          },
        ],
      }),
    );

    expect(screen.getByText("HST")).toBeInTheDocument();
    expect(screen.getByText(/13\.00% · Exclusive · Default/)).toBeInTheDocument();
    expect(
      (screen.getByPlaceholderText("Name (e.g. HST)") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (screen.getByPlaceholderText("Rate % (enter 13 for 13%)") as HTMLInputElement)
        .value,
    ).toBe("");
    expect(screen.queryByText("Old GST")).not.toBeInTheDocument();
  });
});

describe("Business Hub catalog add-form remount", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("clears the category add form after a new persisted category appears", () => {
    const { rerender } = render(emptyHub({ initialTab: "categories" }));
    const name = screen.getByPlaceholderText("Category name") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Massage" } });
    expect(name.value).toBe("Massage");

    actionState.current = { success: "Category saved." };
    rerender(
      emptyHub({
        initialTab: "categories",
        categories: [
          {
            id: "cat-1",
            business_id: "biz-1",
            name: "Massage",
            description: null,
            icon: null,
            color: "#64748b",
            sort_order: 0,
            is_active: true,
            created_at: "2026-08-21T22:05:00.000Z",
            updated_at: "2026-08-21T22:05:00.000Z",
          },
        ],
      }),
    );

    expect(screen.getByText("Massage")).toBeInTheDocument();
    expect(
      (screen.getByPlaceholderText("Category name") as HTMLInputElement).value,
    ).toBe("");
  });
});
