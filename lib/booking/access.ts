import type { Business, PublicBookingMode } from "@/lib/types/booking";

export function isPublicBookingAllowed(
  business: Pick<Business, "public_booking_mode" | "booking_invite_code">,
  inviteCode?: string | null,
): boolean {
  const mode = business.public_booking_mode ?? "public";
  switch (mode) {
    case "staff_only":
      return false;
    case "invite_only":
      return (
        !!business.booking_invite_code &&
        !!inviteCode &&
        inviteCode === business.booking_invite_code
      );
    case "request_approval":
    case "public":
    default:
      return true;
  }
}

export function publicBookingModeLabel(mode?: PublicBookingMode | null): string {
  switch (mode ?? "public") {
    case "staff_only":
      return "Staff only";
    case "request_approval":
      return "Request approval";
    case "invite_only":
      return "Invite only";
    default:
      return "Public booking";
  }
}

export function publicBookingBlockedMessage(
  business: Pick<Business, "public_booking_mode" | "phone" | "email">,
): string {
  const mode = business.public_booking_mode ?? "public";
  if (mode === "staff_only") {
    return "Online booking is managed by our team. Please call or email us to schedule.";
  }
  if (mode === "invite_only") {
    return "This booking page requires a private invite link. Contact us if you need access.";
  }
  return "Online booking is not available right now.";
}
