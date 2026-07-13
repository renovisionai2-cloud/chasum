const KEY = "chasum-booking-prefs";
export const BOOKING_PREFS_EVENT = "chasum-booking-prefs-changed";

export type BookingPreferences = {
  serviceId?: string;
  staffId?: string;
  locationId?: string;
};

export function readBookingPreferences(): BookingPreferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BookingPreferences;
    return {
      serviceId: parsed.serviceId || undefined,
      staffId: parsed.staffId || undefined,
      locationId: parsed.locationId || undefined,
    };
  } catch {
    return {};
  }
}

export function writeBookingPreferences(prefs: BookingPreferences) {
  if (typeof window === "undefined") return;
  try {
    const next = { ...readBookingPreferences(), ...prefs };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(BOOKING_PREFS_EVENT));
  } catch {
    /* ignore quota */
  }
}
