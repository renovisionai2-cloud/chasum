import type { AppointmentWithRelations } from "@/lib/types/booking";

/** Derive preferred staff/location from appointment history (mode), never invent. */
export function preferredFromHistory(
  appointments: {
    staff_id?: string;
    location_id?: string;
    status: string;
    staff?: { name?: string } | null;
    location?: { name?: string } | null;
  }[],
): {
  preferredStaffName: string | null;
  preferredLocationName: string | null;
} {
  const active = appointments.filter((a) => a.status !== "cancelled");
  if (active.length === 0) {
    return { preferredStaffName: null, preferredLocationName: null };
  }

  function modeName(
    key: "staff" | "location",
  ): string | null {
    const counts = new Map<string, { name: string; n: number }>();
    for (const a of active) {
      const id = key === "staff" ? a.staff_id : a.location_id;
      const name =
        key === "staff" ? a.staff?.name : a.location?.name;
      if (!id || !name) continue;
      const prev = counts.get(id);
      counts.set(id, { name, n: (prev?.n ?? 0) + 1 });
    }
    let best: { name: string; n: number } | null = null;
    for (const entry of counts.values()) {
      if (!best || entry.n > best.n) best = entry;
    }
    return best?.name ?? null;
  }

  return {
    preferredStaffName: modeName("staff"),
    preferredLocationName: modeName("location"),
  };
}

export type { AppointmentWithRelations };
