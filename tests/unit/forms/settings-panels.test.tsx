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

vi.mock("@/lib/actions/business-management", () => ({
  updateBusinessNotificationSettings: vi.fn(),
  updateBusinessBrandingSettings: vi.fn(),
  updateBusinessAiSettings: vi.fn(),
}));

vi.mock("@/lib/actions/uploads", () => ({
  uploadBusinessAsset: vi.fn(),
}));

import { NotificationSettingsPanel } from "@/components/business/notification-settings-panel";
import { BrandingSettingsPanel } from "@/components/business/branding-settings-panel";
import { AiSettingsPanel } from "@/components/business/ai-settings-panel";

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
    email_notifications_enabled: true,
    reminder_hours_before: 24,
    brand_color: "#2563EB",
    email_signature: "Old signature",
    booking_page_branding: { headline: "Old headline", show_logo: true },
    ai_settings: {
      summer: {
        enabled: false,
        greeting: "Hi",
        tone: "professional",
        escalation: "",
        business_knowledge: "",
      },
    },
    ...overrides,
  };
}

describe("Notification / Branding / AI post-save remount", () => {
  beforeEach(() => {
    actionState.current = {};
  });

  it("NotificationSettingsPanel remounts number and checkbox fields", () => {
    const { rerender } = render(
      <ToastProvider>
        <NotificationSettingsPanel business={business()} />
      </ToastProvider>,
    );
    const hours = screen.getByLabelText(
      "Reminder timing (hours before)",
    ) as HTMLInputElement;
    const sms = screen.getByLabelText(
      "Customer booking confirmation SMS",
    ) as HTMLInputElement;
    fireEvent.change(hours, { target: { value: "48" } });
    fireEvent.click(sms);
    hours.value = "24";
    sms.checked = false;

    actionState.current = { success: "Notifications saved." };
    rerender(
      <ToastProvider>
        <NotificationSettingsPanel
          business={business({
            reminder_hours_before: 48,
            sms_notifications_enabled: true,
            updated_at: "2026-08-21T22:05:00.000Z",
          })}
        />
      </ToastProvider>,
    );

    expect(
      (screen.getByLabelText("Reminder timing (hours before)") as HTMLInputElement)
        .value,
    ).toBe("48");
    expect(
      (screen.getByLabelText("Customer booking confirmation SMS") as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  it("BrandingSettingsPanel remounts signature textarea and show-cover checkbox", () => {
    const { rerender } = render(
      <ToastProvider>
        <BrandingSettingsPanel business={business()} />
      </ToastProvider>,
    );
    const signature = screen.getByLabelText("Email signature") as HTMLTextAreaElement;
    const showCover = screen.getByLabelText(
      "Show cover on booking page",
    ) as HTMLInputElement;
    fireEvent.change(signature, { target: { value: "New signature" } });
    fireEvent.click(showCover);
    signature.value = "Old signature";
    showCover.checked = true;

    actionState.current = { success: "Branding saved." };
    rerender(
      <ToastProvider>
        <BrandingSettingsPanel
          business={business({
            email_signature: "New signature",
            booking_page_branding: { headline: "Old headline", show_cover: false },
            updated_at: "2026-08-21T22:05:00.000Z",
          })}
        />
      </ToastProvider>,
    );

    expect((screen.getByLabelText("Email signature") as HTMLTextAreaElement).value).toBe(
      "New signature",
    );
    expect(
      (screen.getByLabelText("Show cover on booking page") as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("AiSettingsPanel remounts greeting and enable checkbox", () => {
    const { rerender } = render(
      <ToastProvider>
        <AiSettingsPanel business={business()} />
      </ToastProvider>,
    );
    const greeting = screen.getByLabelText("Greeting") as HTMLInputElement;
    const enabled = screen.getByLabelText("Enable Summer") as HTMLInputElement;
    fireEvent.change(greeting, { target: { value: "Welcome to HQ" } });
    fireEvent.click(enabled);
    greeting.value = "Hi";
    enabled.checked = false;

    actionState.current = { success: "AI settings saved." };
    rerender(
      <ToastProvider>
        <AiSettingsPanel
          business={business({
            ai_settings: {
              summer: {
                enabled: true,
                greeting: "Welcome to HQ",
                tone: "professional",
                escalation: "",
                business_knowledge: "",
              },
            },
            updated_at: "2026-08-21T22:05:00.000Z",
          })}
        />
      </ToastProvider>,
    );

    expect((screen.getByLabelText("Greeting") as HTMLInputElement).value).toBe(
      "Welcome to HQ",
    );
    expect((screen.getByLabelText("Enable Summer") as HTMLInputElement).checked).toBe(
      true,
    );
  });
});
