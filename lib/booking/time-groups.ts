import { parseISO } from "date-fns";

export type TimeOfDayGroupId = "morning" | "afternoon" | "evening";

export type TimeOfDayGroup<T> = {
  id: TimeOfDayGroupId;
  label: string;
  items: T[];
};

function hourOf(iso: string): number {
  try {
    return parseISO(iso).getHours();
  } catch {
    const match = iso.match(/T(\d{2}):/);
    return match ? Number(match[1]) : 12;
  }
}

export function timeOfDayGroupId(iso: string): TimeOfDayGroupId {
  const hour = hourOf(iso);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function groupSlotsByTimeOfDay<T>(
  items: T[],
  getStart: (item: T) => string,
): TimeOfDayGroup<T>[] {
  const buckets: Record<TimeOfDayGroupId, T[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const item of items) {
    buckets[timeOfDayGroupId(getStart(item))].push(item);
  }
  const order: Array<{ id: TimeOfDayGroupId; label: string }> = [
    { id: "morning", label: "Morning" },
    { id: "afternoon", label: "Afternoon" },
    { id: "evening", label: "Evening" },
  ];
  return order
    .map((row) => ({
      id: row.id,
      label: row.label,
      items: buckets[row.id],
    }))
    .filter((g) => g.items.length > 0);
}
