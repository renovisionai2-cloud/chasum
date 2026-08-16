import type { BookingIntent } from "@/lib/booking-engine/types";

type ExistingSchedule = {
  start_time?: string | null;
  end_time?: string | null;
  staff_id?: string | null;
  location_id?: string | null;
};

function instantMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * True when an existing appointment keeps the same booked slot
 * (start, staff, location, duration). Non-time edits must not re-run
 * availability / min-notice against a historical time.
 */
export function isUnchangedExistingSchedule(
  existing: ExistingSchedule,
  intent: Pick<
    BookingIntent,
    "requestedStart" | "staffId" | "locationId" | "durationMinutes"
  >,
): boolean {
  const existingStart = instantMs(existing.start_time);
  const requestedStart = instantMs(intent.requestedStart);
  if (existingStart == null || requestedStart == null) return false;
  if (existingStart !== requestedStart) return false;

  const existingStaff = existing.staff_id?.trim() || null;
  const requestedStaff = intent.staffId?.trim() || null;
  if (existingStaff !== requestedStaff) return false;

  if ((existing.location_id ?? null) !== (intent.locationId ?? null)) {
    return false;
  }

  const existingEnd = instantMs(existing.end_time);
  if (
    intent.durationMinutes != null &&
    intent.durationMinutes > 0 &&
    existingStart != null
  ) {
    const requestedEnd = existingStart + intent.durationMinutes * 60_000;
    if (existingEnd != null && existingEnd !== requestedEnd) return false;
  }

  return true;
}
