"use client";

import {
  BOOKING_PREFS_EVENT,
  readBookingPreferences,
  writeBookingPreferences,
  type BookingPreferences,
} from "@/lib/reception/booking-preferences";
import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(BOOKING_PREFS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(BOOKING_PREFS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getClientSnapshot(): string {
  try {
    return localStorage.getItem("chasum-booking-prefs") ?? "";
  } catch {
    return "";
  }
}

function getServerSnapshot(): string {
  return "";
}

/** Client-only booking prefs; empty on the server to avoid hydration mismatch. */
export function useBookingPreferences(): BookingPreferences {
  const raw = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  if (!raw) return {};
  try {
    return JSON.parse(raw) as BookingPreferences;
  } catch {
    return {};
  }
}

export { writeBookingPreferences, readBookingPreferences };
