import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ActionState, Business } from "@/lib/types/booking";
import {
  CUSTOM_FORMS_PREVIEW_NOTICE,
  CUSTOM_FORMS_STATUS_LABEL,
} from "@/lib/business/custom-forms-truth";
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

describe("Custom Forms product truth", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("keeps Custom Forms as Preview / Coming Soon without claiming capture", () => {
    expect(CUSTOM_FORMS_STATUS_LABEL).toBe("Preview / Coming Soon");
    expect(CUSTOM_FORMS_PREVIEW_NOTICE).toMatch(/preview/i);
    expect(CUSTOM_FORMS_PREVIEW_NOTICE).toMatch(
      /Customer submission capture is not operational yet/,
    );
    expect(CUSTOM_FORMS_PREVIEW_NOTICE).not.toMatch(
      /submission capture (is|are) (live|operational|available)/i,
    );
    expect(CUSTOM_FORMS_PREVIEW_NOTICE).not.toMatch(/electronic signature ready/i);
  });

  it("shows the notice on the Custom forms hub tab", () => {
    render(
      <ToastProvider>
        <BusinessHub
          business={business()}
          locations={[]}
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
          initialTab="forms"
        />
      </ToastProvider>,
    );
    expect(screen.getAllByText(/Preview \/ Coming Soon/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Customer submission capture is not operational yet/).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/electronic signature ready/i)).not.toBeInTheDocument();
  });
});
