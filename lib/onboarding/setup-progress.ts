import {
  BOOKING_INTERVAL_ONBOARDING_HELP,
  isBookingIntervalSetupComplete,
} from "@/lib/booking/interval";
import type { Business } from "@/lib/types/booking";

export type SetupStepId =
  | "profile"
  | "hours"
  | "booking_interval"
  | "services"
  | "staff"
  | "booking_link";

export type SetupStep = {
  id: SetupStepId;
  label: string;
  description: string;
  href: string;
  done: boolean;
};

/** True when the silent auto-create defaults still look like a placeholder tenant. */
export function isPlaceholderBusiness(business: Pick<Business, "name" | "slug">): boolean {
  const name = business.name?.trim() ?? "";
  const slug = business.slug?.trim() ?? "";
  if (!name || name === "My Business") return true;
  if (!slug) return true;
  if (/^(prod-auth|user-|test-|demo-)/i.test(slug)) return true;
  if (/\d{10,}/.test(slug)) return true;
  return false;
}

export function buildSetupSteps(input: {
  business: Pick<Business, "name" | "slug" | "appointment_interval_minutes">;
  serviceCount: number;
  staffCount: number;
  hasHours: boolean;
}): SetupStep[] {
  const profileDone = !isPlaceholderBusiness(input.business);
  const intervalConfigured = isBookingIntervalSetupComplete(
    input.business.appointment_interval_minutes,
  );

  return [
    {
      id: "profile",
      label: "Name your business",
      description: "Set a real name and a memorable booking link slug.",
      href: "/dashboard/business",
      done: profileDone,
    },
    {
      id: "hours",
      label: "Confirm business hours",
      description: "Include weekends if you take appointments then.",
      href: "/dashboard/business?tab=hours",
      done: input.hasHours,
    },
    {
      id: "booking_interval",
      label: "Choose booking time interval",
      description: `${BOOKING_INTERVAL_ONBOARDING_HELP} Every 15 minutes is a balanced starting point; every 5 minutes allows times like 9:05 and 9:10.`,
      href: "/dashboard/business?tab=booking",
      done: profileDone && intervalConfigured,
    },
    {
      id: "services",
      label: "Add a service",
      description: "Customers can only book what you list here.",
      href: "/dashboard/services",
      done: input.serviceCount > 0,
    },
    {
      id: "staff",
      label: "Add a bookable employee",
      description: "At least one provider must accept online bookings.",
      href: "/dashboard/employees",
      done: input.staffCount > 0,
    },
    {
      id: "booking_link",
      label: "Share your booking page",
      description: "Copy the public link once profile, services, and staff are ready.",
      href: "/dashboard/settings",
      done:
        profileDone &&
        input.serviceCount > 0 &&
        input.staffCount > 0,
    },
  ];
}

export function setupProgressPct(steps: SetupStep[]): number {
  if (!steps.length) return 100;
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / steps.length) * 100);
}

export function isSetupComplete(steps: SetupStep[]): boolean {
  return steps.every((s) => s.done);
}
