"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export type DateFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  /** YYYY-MM-DD */
  value: string;
  /** Called with YYYY-MM-DD when a date is selected. */
  onChange: (value: string) => void;
  /** YYYY-MM-DD minimum selectable date */
  min?: string;
  /** YYYY-MM-DD maximum selectable date */
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Called after picker closes following a selection (focus Available time). */
  onAfterSelect?: (value: string) => void;
};

function parseYmd(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = parseISO(`${value}T12:00:00`);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toYmd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function displayLabel(value: string): string {
  const d = parseYmd(value);
  if (!d) return "Choose a date";
  return format(d, "EEEE, MMMM d, yyyy");
}

/**
 * Shared Chasum date field — popover calendar that closes on select.
 * Internal value remains YYYY-MM-DD; display uses a long weekday date.
 */
export function DateField({
  id,
  name,
  label = "Date",
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  className,
  onAfterSelect,
}: DateFieldProps) {
  const reactId = useId();
  const fieldId = id ?? `date-field-${reactId}`;
  const panelId = `${fieldId}-panel`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = parseYmd(value);
  const minDate = parseYmd(min);
  const maxDate = parseYmd(max);
  const [cursor, setCursor] = useState<Date>(
    () => selected ?? minDate ?? new Date(),
  );

  useEffect(() => {
    if (selected) setCursor(selected);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps -- sync month when value changes

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function isDisabledDay(day: Date): boolean {
    const noon = startOfDay(day);
    if (minDate && isBefore(noon, startOfDay(minDate))) return true;
    if (maxDate && isBefore(startOfDay(maxDate), noon)) return true;
    return false;
  }

  function selectDay(day: Date) {
    if (isDisabledDay(day)) return;
    const next = toYmd(day);
    onChange(next);
    setOpen(false);
    window.setTimeout(() => {
      onAfterSelect?.(next);
    }, 0);
  }

  function onGridKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (!open) return;
    const base = selected ?? cursor;
    let next = base;
    if (e.key === "ArrowLeft") next = new Date(base.getFullYear(), base.getMonth(), base.getDate() - 1);
    else if (e.key === "ArrowRight") next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
    else if (e.key === "ArrowUp") next = new Date(base.getFullYear(), base.getMonth(), base.getDate() - 7);
    else if (e.key === "ArrowDown") next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 7);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isDisabledDay(base)) selectDay(base);
      return;
    } else {
      return;
    }
    e.preventDefault();
    if (!isDisabledDay(next)) {
      setCursor(next);
    }
  }

  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className={cn("relative space-y-2", className)}>
      {label ? (
        <label htmlFor={fieldId} className="text-sm font-medium">
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </label>
      ) : null}

      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}

      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2.5 text-left text-sm transition-colors",
          "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled && "pointer-events-none opacity-50",
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{displayLabel(value)}</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            Tap to change date
          </span>
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Choose a date"
          className="absolute left-0 right-0 z-40 mt-1 rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-lg"
          onKeyDown={onGridKeyDown}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Previous month"
              onClick={() => setCursor((c) => addMonths(c, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold tabular-nums">
              {format(cursor, "MMMM yyyy")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Next month"
              onClick={() => setCursor((c) => addMonths(c, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5" role="grid">
            {days.map((day) => {
              const disabledDay = isDisabledDay(day);
              const inMonth = isSameMonth(day, cursor);
              const isSelected = selected ? isSameDay(day, selected) : false;
              const isFocus = isSameDay(day, cursor);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  role="gridcell"
                  tabIndex={isFocus ? 0 : -1}
                  disabled={disabledDay}
                  aria-selected={isSelected}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-[var(--radius-sm)] text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !inMonth && "text-muted-foreground/50",
                    disabledDay && "pointer-events-none opacity-30",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && !disabledDay && "hover:bg-muted",
                    isFocus && !isSelected && "ring-1 ring-ring",
                  )}
                  onClick={() => selectDay(day)}
                  onFocus={() => setCursor(day)}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
