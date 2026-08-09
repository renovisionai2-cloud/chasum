"use client";

import { Button } from "@/components/ui/button";
import { bookingIntervalLabel, DEFAULT_BOOKING_INTERVAL_MINUTES } from "@/lib/booking/interval";
import {
  DEFAULT_VISIBLE_STARTS_PER_PERIOD,
  presentStartTimesForBookingUI,
  visibleItemsForPeriod,
} from "@/lib/booking/presentable-start-times";
import type { TimeOfDayGroupId } from "@/lib/booking/time-groups";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

export type AvailableTimeOption = {
  start: string;
  label?: string;
  disabled?: boolean;
};

export type AvailableTimeSelectorHandle = {
  focus: () => void;
  expand: () => void;
};

type AvailableTimeSelectorProps = {
  slots: AvailableTimeOption[];
  selectedStart: string | null;
  onSelect: (start: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  selectedInvalid?: boolean;
  selectedInvalidHint?: string | null;
  /** Force expanded (e.g. after an invalid selection). */
  forceExpanded?: boolean;
  /** Progressive Time step: show the grid immediately (no collapse chrome). */
  alwaysExpanded?: boolean;
  /** Business/location booking start increment from availability context. */
  intervalMinutes?: number;
  timezone?: string | null;
  className?: string;
  id?: string;
};

function slotKey(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export const AvailableTimeSelector = forwardRef<
  AvailableTimeSelectorHandle,
  AvailableTimeSelectorProps
>(function AvailableTimeSelector(
  {
    slots,
    selectedStart,
    onSelect,
    loading = false,
    emptyMessage = "No available times for this date.",
    selectedInvalid = false,
    selectedInvalidHint = null,
    forceExpanded = false,
    alwaysExpanded = false,
    intervalMinutes = DEFAULT_BOOKING_INTERVAL_MINUTES,
    timezone = null,
    className,
    id,
  },
  ref,
) {
  const reactId = useId();
  const panelId = id ?? `available-times-${reactId}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(alwaysExpanded);
  const [jumpTo, setJumpTo] = useState<TimeOfDayGroupId | null>(null);
  const [expandedPeriods, setExpandedPeriods] = useState<
    Partial<Record<TimeOfDayGroupId, boolean>>
  >({});
  const slotSetKey = `${intervalMinutes}:${slots.map((s) => s.start).join("|").slice(0, 120)}`;
  const [periodResetKey, setPeriodResetKey] = useState(slotSetKey);
  if (periodResetKey !== slotSetKey) {
    setPeriodResetKey(slotSetKey);
    setExpandedPeriods({});
  }

  useImperativeHandle(ref, () => ({
    focus: () => {
      setExpanded(true);
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    },
    expand: () => setExpanded(true),
  }));

  useEffect(() => {
    if (forceExpanded || selectedInvalid || alwaysExpanded) {
      setExpanded(true);
    }
  }, [forceExpanded, selectedInvalid, alwaysExpanded]);

  const presented = useMemo(
    () =>
      presentStartTimesForBookingUI(slots, {
        intervalMinutes,
        timeZone: timezone,
        visiblePerPeriod: DEFAULT_VISIBLE_STARTS_PER_PERIOD,
      }),
    [slots, intervalMinutes, timezone],
  );

  const showPanel = alwaysExpanded || expanded;

  useEffect(() => {
    if (!showPanel || !jumpTo) return;
    const el = document.getElementById(`${panelId}-${jumpTo}`);
    const list = listRef.current;
    if (el && list) {
      const top =
        el.getBoundingClientRect().top -
        list.getBoundingClientRect().top +
        list.scrollTop;
      list.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
    }
    setJumpTo(null);
  }, [showPanel, jumpTo, panelId]);

  function selectTime(start: string) {
    onSelect(start);
    if (!alwaysExpanded) {
      setExpanded(false);
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    }
  }

  const selectedLabel = selectedStart
    ? formatTime(parseISO(selectedStart))
    : null;

  const nextStart = presented.nextAvailable?.start ?? null;

  return (
    <div className={cn("space-y-2", className)}>
      <p
        className={cn(
          "text-sm font-medium",
          alwaysExpanded && "sr-only",
        )}
        id={`${panelId}-label`}
      >
        Available time
      </p>

      {alwaysExpanded ? (
        selectedStart && !selectedInvalid ? (
          <p className="text-sm tabular-nums text-muted-foreground">
            Selected{" "}
            <span className="font-semibold text-foreground">{selectedLabel}</span>
          </p>
        ) : selectedInvalid ? (
          <p className="text-sm text-amber-800 dark:text-amber-100">
            {selectedInvalidHint ?? "Choose another time"}
          </p>
        ) : null
      ) : selectedStart && !selectedInvalid ? (
        <button
          ref={triggerRef}
          type="button"
          className={cn(
            "flex w-full min-h-11 items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border bg-card px-3 text-sm",
            "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-expanded={showPanel}
          aria-controls={panelId}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="tabular-nums font-medium">{selectedLabel}</span>
          {showPanel ? (
            <ChevronUp className="size-4 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          )}
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className={cn(
            "flex w-full min-h-11 items-center justify-between gap-2 rounded-[var(--radius-md)] border border-dashed border-border bg-muted/20 px-3 text-sm text-muted-foreground",
            "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selectedInvalid && "border-amber-500/40 text-foreground",
          )}
          aria-expanded={showPanel}
          aria-controls={panelId}
          onClick={() => setExpanded(true)}
        >
          <span>
            {selectedInvalid
              ? (selectedInvalidHint ?? "Choose another time")
              : "Choose a time"}
          </span>
          <ChevronDown className="size-4" aria-hidden />
        </button>
      )}

      {showPanel ? (
        <div
          id={panelId}
          className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-card"
        >
          {loading ? (
            <p className="p-3 text-sm text-muted-foreground">Loading times…</p>
          ) : presented.slots.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            <>
              {nextStart ? (
                <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Next available</p>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      slotKey(selectedStart) === slotKey(nextStart)
                        ? "primary"
                        : "outline"
                    }
                    className="min-h-9 tabular-nums"
                    onClick={() => selectTime(nextStart)}
                  >
                    {formatTime(parseISO(nextStart))}
                  </Button>
                  <p className="ml-auto text-[11px] text-muted-foreground">
                    {bookingIntervalLabel(presented.intervalMinutes)}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-1 border-b border-border px-2 py-1.5">
                {presented.groups.map((g) => (
                  <Button
                    key={g.id}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setJumpTo(g.id)}
                  >
                    {g.label}
                  </Button>
                ))}
                {selectedStart ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-7 px-2 text-xs"
                    onClick={() => {
                      setJumpTo(timeOfDayFromIso(selectedStart));
                    }}
                  >
                    Jump to selection
                  </Button>
                ) : null}
              </div>

              <div
                ref={listRef}
                className="max-h-[min(42vh,400px)] space-y-3 overflow-y-auto overscroll-contain p-2 sm:max-h-[420px]"
                role="listbox"
                aria-labelledby={`${panelId}-label`}
              >
                {presented.groups.map((group) => {
                  const periodOpen = Boolean(expandedPeriods[group.id]);
                  const { visible, hiddenCount } = visibleItemsForPeriod(
                    group.items,
                    periodOpen,
                    {
                      dense: presented.dense || group.items.length > DEFAULT_VISIBLE_STARTS_PER_PERIOD,
                      visiblePerPeriod: DEFAULT_VISIBLE_STARTS_PER_PERIOD,
                      forceInclude: (item) =>
                        slotKey(selectedStart) === slotKey(item.start),
                    },
                  );
                  return (
                    <div
                      key={group.id}
                      id={`${panelId}-${group.id}`}
                      className="space-y-1.5"
                    >
                      <p className="sticky top-0 z-[1] bg-card/95 px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                        {group.label}
                        <span className="ml-1 font-normal normal-case text-muted-foreground/80">
                          ({group.items.length})
                        </span>
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-3 min-[560px]:grid-cols-4">
                        {visible.map((slot) => {
                          const selected =
                            slotKey(selectedStart) === slotKey(slot.start);
                          const isNext =
                            slotKey(nextStart) === slotKey(slot.start);
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              disabled={slot.disabled}
                              onClick={() => selectTime(slot.start)}
                              className={cn(
                                "rounded-lg border px-2 py-2.5 text-sm font-medium tabular-nums transition-colors",
                                "hover:border-primary hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                "disabled:cursor-not-allowed disabled:opacity-40",
                                selected
                                  ? "border-primary bg-accent ring-1 ring-primary/40"
                                  : "border-border bg-background",
                              )}
                            >
                              {slot.label ?? formatTime(parseISO(slot.start))}
                              {isNext && !selected ? (
                                <span className="mt-0.5 block text-[10px] font-normal normal-case text-muted-foreground">
                                  Next
                                </span>
                              ) : null}
                              {selected ? (
                                <span className="sr-only"> (selected)</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                      {hiddenCount > 0 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() =>
                            setExpandedPeriods((prev) => ({
                              ...prev,
                              [group.id]: true,
                            }))
                          }
                        >
                          More {group.label.toLowerCase()} times ({hiddenCount})
                        </Button>
                      ) : periodOpen &&
                        group.items.length > DEFAULT_VISIBLE_STARTS_PER_PERIOD ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() =>
                            setExpandedPeriods((prev) => ({
                              ...prev,
                              [group.id]: false,
                            }))
                          }
                        >
                          Show fewer
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-2">
                <p className="text-[11px] text-muted-foreground">
                  {presented.slots.length} available
                  {presented.slots.length !== slots.length
                    ? ` · shown on ${bookingIntervalLabel(presented.intervalMinutes).toLowerCase()}`
                    : ""}
                </p>
                {!alwaysExpanded ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setExpanded(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    Done
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
});

function timeOfDayFromIso(iso: string): TimeOfDayGroupId {
  try {
    const hour = parseISO(iso).getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  } catch {
    return "afternoon";
  }
}
