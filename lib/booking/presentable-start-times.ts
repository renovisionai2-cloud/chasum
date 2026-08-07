/**
 * Present useful appointment START TIMES for booking UI.
 * Does not invent availability — only filters / paces authoritative engine slots.
 *
 * Principle: Chasum presents useful appointment start times, not raw
 * availability granularity dumped into an endless grid.
 */

import {
  normalizeBookingIntervalMinutes,
  type BookingIntervalMinutes,
} from "@/lib/booking/interval";
import {
  groupSlotsByTimeOfDay,
  type TimeOfDayGroup,
  type TimeOfDayGroupId,
} from "@/lib/booking/time-groups";
import { parseISO } from "date-fns";

/** Initial visible starts per Morning / Afternoon / Evening before “More times”. */
export const DEFAULT_VISIBLE_STARTS_PER_PERIOD = 8;

/** Above this total, always use per-period collapse even if each group is small. */
export const DENSE_SLOT_TOTAL_THRESHOLD = 24;

function wallClockMinutes(iso: string, timeZone?: string | null): number {
  const date = parseISO(iso);
  if (!timeZone) return date.getMinutes();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);
    return Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  } catch {
    return date.getMinutes();
  }
}

/**
 * Keep starts that land on the business booking increment (wall-clock minutes).
 * Defensive: engine should already step by interval; this prevents denser
 * accidental presentation when interval is larger than raw data.
 */
export function filterStartsToBookingInterval<T extends { start: string }>(
  slots: T[],
  intervalMinutes: number,
  timeZone?: string | null,
): T[] {
  const interval = normalizeBookingIntervalMinutes(intervalMinutes);
  return slots.filter(
    (slot) => wallClockMinutes(slot.start, timeZone) % interval === 0,
  );
}

export type PresentableStartTimesResult<T extends { start: string }> = {
  intervalMinutes: BookingIntervalMinutes;
  /** Slots after interval filter, chronological. */
  slots: T[];
  /** First valid start — “Next available” when real data exists. */
  nextAvailable: T | null;
  groups: TimeOfDayGroup<T>[];
  /** Whether the full set is dense enough to warrant progressive disclosure. */
  dense: boolean;
};

export function presentStartTimesForBookingUI<T extends { start: string }>(
  slots: T[],
  options: {
    intervalMinutes: number;
    timeZone?: string | null;
    visiblePerPeriod?: number;
    denseTotalThreshold?: number;
  },
): PresentableStartTimesResult<T> {
  const intervalMinutes = normalizeBookingIntervalMinutes(
    options.intervalMinutes,
  );
  const filtered = filterStartsToBookingInterval(
    slots,
    intervalMinutes,
    options.timeZone,
  );
  const groups = groupSlotsByTimeOfDay(filtered, (s) => s.start);
  const denseTotalThreshold =
    options.denseTotalThreshold ?? DENSE_SLOT_TOTAL_THRESHOLD;
  const dense = filtered.length > denseTotalThreshold;

  return {
    intervalMinutes,
    slots: filtered,
    nextAvailable: filtered[0] ?? null,
    groups,
    dense,
  };
}

export function visibleItemsForPeriod<T>(
  items: T[],
  expanded: boolean,
  options?: {
    dense?: boolean;
    visiblePerPeriod?: number;
    /** Always show the selected item even when collapsed. */
    forceInclude?: (item: T) => boolean;
  },
): { visible: T[]; hiddenCount: number } {
  const limit = options?.visiblePerPeriod ?? DEFAULT_VISIBLE_STARTS_PER_PERIOD;
  const shouldCollapse = (options?.dense ?? items.length > limit) && !expanded;
  if (!shouldCollapse || items.length <= limit) {
    return { visible: items, hiddenCount: 0 };
  }

  const forced = options?.forceInclude
    ? items.filter((item) => options.forceInclude!(item))
    : [];
  const head = items.slice(0, limit);
  const merged: T[] = [];
  const seen = new Set<T>();
  for (const item of [...head, ...forced]) {
    if (seen.has(item)) continue;
    seen.add(item);
    merged.push(item);
  }
  // Preserve chronological order from original list
  const ordered = items.filter((item) => seen.has(item));
  return {
    visible: ordered,
    hiddenCount: Math.max(0, items.length - ordered.length),
  };
}

export function periodExpandedKey(id: TimeOfDayGroupId): string {
  return id;
}
