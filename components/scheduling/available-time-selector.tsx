"use client";

import { Button } from "@/components/ui/button";
import { groupSlotsByTimeOfDay } from "@/lib/booking/time-groups";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type AvailableTimeOption = {
  start: string;
  label?: string;
  disabled?: boolean;
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
  className?: string;
  id?: string;
};

function slotKey(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function AvailableTimeSelector({
  slots,
  selectedStart,
  onSelect,
  loading = false,
  emptyMessage = "No available times for this date.",
  selectedInvalid = false,
  selectedInvalidHint = null,
  forceExpanded = false,
  className,
  id,
}: AvailableTimeSelectorProps) {
  const reactId = useId();
  const panelId = id ?? `available-times-${reactId}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [jumpTo, setJumpTo] = useState<"morning" | "afternoon" | "evening" | null>(
    null,
  );

  useEffect(() => {
    if (forceExpanded || selectedInvalid) {
      setExpanded(true);
    }
  }, [forceExpanded, selectedInvalid]);

  const groups = useMemo(
    () => groupSlotsByTimeOfDay(slots, (s) => s.start),
    [slots],
  );

  useEffect(() => {
    if (!expanded || !jumpTo) return;
    const el = document.getElementById(`${panelId}-${jumpTo}`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    setJumpTo(null);
  }, [expanded, jumpTo, panelId]);

  function selectTime(start: string) {
    onSelect(start);
    setExpanded(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  const selectedLabel = selectedStart
    ? formatTime(parseISO(selectedStart))
    : null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium" id={`${panelId}-label`}>
        Available time
      </p>

      <button
        ref={triggerRef}
        type="button"
        id={`${panelId}-trigger`}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-left text-sm transition-colors",
          "hover:border-primary/60 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selectedInvalid
            ? "border-amber-500/50 bg-amber-500/10"
            : selectedStart
              ? "border-primary/50 bg-accent/30"
              : "border-border bg-card",
        )}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-labelledby={`${panelId}-label`}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {selectedStart ? "Selected time" : "Choose a time"}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate font-semibold tabular-nums",
              selectedInvalid && "text-amber-900 dark:text-amber-100",
            )}
          >
            {loading
              ? "Loading times…"
              : selectedLabel
                ? selectedLabel
                : slots.length > 0
                  ? slots.length <= 8
                    ? `${slots.length} times available — choose a time`
                    : "Many times available — choose a time"
                  : "No times yet"}
          </span>
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </button>

      {selectedInvalid && selectedStart ? (
        <p className="text-[11px] text-amber-800 dark:text-amber-200" role="status">
          {selectedInvalidHint ??
            "The previously selected time is no longer available for this service, employee, or date. Choose another time."}
        </p>
      ) : null}

      {expanded ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${panelId}-label`}
          className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-card shadow-sm"
        >
          {loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground" aria-live="polite">
              Loading available times…
            </p>
          ) : slots.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground" role="status">
              {emptyMessage}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5 border-b border-border px-2 py-2">
                {groups.map((g) => (
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
                      const group = timeOfDayFromIso(selectedStart);
                      setJumpTo(group);
                    }}
                  >
                    Jump to selection
                  </Button>
                ) : null}
              </div>

              <div
                className="max-h-[min(38vh,360px)] space-y-3 overflow-y-auto overscroll-contain p-2 sm:max-h-[380px]"
                role="listbox"
                aria-labelledby={`${panelId}-label`}
              >
                {groups.map((group) => (
                  <div key={group.id} id={`${panelId}-${group.id}`} className="space-y-1.5">
                    <p className="sticky top-0 z-[1] bg-card/95 px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                      {group.label}
                      <span className="ml-1 font-normal normal-case text-muted-foreground/80">
                        ({group.items.length})
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-3 min-[560px]:grid-cols-4">
                      {group.items.map((slot) => {
                        const selected =
                          slotKey(selectedStart) === slotKey(slot.start);
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
                            {selected ? (
                              <span className="sr-only"> (selected)</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-2">
                <p className="text-[11px] text-muted-foreground">
                  {slots.length} available
                </p>
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
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function timeOfDayFromIso(iso: string): "morning" | "afternoon" | "evening" {
  try {
    const hour = parseISO(iso).getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  } catch {
    return "afternoon";
  }
}
