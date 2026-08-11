"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import {
  formatDayHeader,
  formatMonthYear,
  formatWeekRange,
} from "@/lib/calendar/utils";
import { formatDayHeaderInTimezone } from "@/lib/calendar/day-geometry";
import { calendarDateInTimezone } from "@/lib/business/datetime";
import type { CalendarView } from "@/lib/types/booking";
import type { CalendarColorMode } from "@/components/calendar/appointment-block";
import { ChevronLeft, ChevronRight, Plus, Undo2, UserPlus } from "lucide-react";
import { addDays, addMonths, addWeeks, format, parse } from "date-fns";

type CalendarToolbarProps = {
  view: CalendarView;
  date: Date;
  colorMode: CalendarColorMode;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  onColorModeChange: (mode: CalendarColorMode) => void;
  onNewAppointment: () => void;
  onNewCustomer?: () => void;
  onUndo?: () => void;
  onDuplicate?: () => void;
  canDuplicate?: boolean;
  timeZone?: string | null;
};

const viewTabs = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "agenda", label: "Agenda" },
  { id: "timeline", label: "Timeline" },
  { id: "employees", label: "Employees" },
  { id: "locations", label: "Locations" },
  { id: "resource", label: "Resources" },
];

function viewContextHint(view: CalendarView): string {
  switch (view) {
    case "day":
    case "timeline":
    case "employees":
      return "Day View — operate today’s schedule.";
    case "week":
    case "month":
    case "agenda":
      return "Calendar planning — schedule across dates.";
    case "locations":
      return "Appointments by location for the selected day.";
    case "resource":
      return "Resource scheduling is not active yet.";
    default:
      return "Same appointments as Reception — change view to plan or operate.";
  }
}

function getTitle(
  view: CalendarView,
  date: Date,
  timeZone?: string | null,
): string {
  switch (view) {
    case "day":
    case "timeline":
    case "employees":
    case "locations":
    case "resource":
      return timeZone
        ? formatDayHeaderInTimezone(date, timeZone)
        : formatDayHeader(date);
    case "week":
    case "agenda":
      return formatWeekRange(date);
    case "month":
      return formatMonthYear(date);
    default:
      return format(date, "MMM d, yyyy");
  }
}

function navigate(view: CalendarView, date: Date, direction: "prev" | "next"): Date {
  const delta = direction === "prev" ? -1 : 1;
  if (view === "month") return addMonths(date, delta);
  if (view === "week" || view === "agenda") return addWeeks(date, delta);
  return addDays(date, delta);
}

export function CalendarToolbar({
  view,
  date,
  colorMode,
  onViewChange,
  onDateChange,
  onColorModeChange,
  onNewAppointment,
  onNewCustomer,
  onUndo,
  onDuplicate,
  canDuplicate,
  timeZone = null,
}: CalendarToolbarProps) {
  const civilDate = timeZone
    ? calendarDateInTimezone(date, timeZone)
    : format(date, "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div
            className="inline-flex items-center rounded-xl border border-border bg-card p-0.5 shadow-sm"
            role="group"
            aria-label="Date navigation"
          >
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[var(--touch-min)] min-w-[var(--touch-min)] rounded-lg"
              onClick={() => onDateChange(navigate(view, date, "prev"))}
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[var(--touch-min)] rounded-lg border-border px-3 font-semibold shadow-sm"
              onClick={() => onDateChange(new Date())}
              aria-label="Go to today"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[var(--touch-min)] min-w-[var(--touch-min)] rounded-lg"
              onClick={() => onDateChange(navigate(view, date, "next"))}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <label className="sr-only" htmlFor="calendar-jump-date">
            Jump to date
          </label>
          <Input
            id="calendar-jump-date"
            type="date"
            className="h-9 min-h-[var(--touch-min)] w-[9.5rem] border-border bg-card px-2 text-xs shadow-sm"
            value={civilDate}
            onChange={(e) => {
              const raw = e.target.value;
              if (!raw) return;
              const next = parse(raw, "yyyy-MM-dd", new Date());
              if (!Number.isNaN(next.getTime())) onDateChange(next);
            }}
            aria-label="Jump to date"
          />
          <h2 className="ml-0.5 text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {getTitle(view, date, timeZone)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div
            className="inline-flex rounded-xl border border-border bg-muted/50 p-1 shadow-sm"
            role="group"
            aria-label="Color mode"
          >
            <button
              type="button"
              className={`min-h-[var(--touch-min)] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                colorMode === "service"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onColorModeChange("service")}
              aria-pressed={colorMode === "service"}
            >
              By service
            </button>
            <button
              type="button"
              className={`min-h-[var(--touch-min)] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                colorMode === "staff"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onColorModeChange("staff")}
              aria-pressed={colorMode === "staff"}
            >
              By staff
            </button>
          </div>
          <Tabs
            tabs={viewTabs}
            activeTab={view}
            onChange={(id) => onViewChange(id as CalendarView)}
          />
          {onUndo ? (
            <Button type="button" size="sm" variant="outline" className="shadow-sm" onClick={onUndo}>
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
          ) : null}
          {onDuplicate ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shadow-sm"
              disabled={!canDuplicate}
              onClick={onDuplicate}
            >
              Duplicate
            </Button>
          ) : null}
          {onNewCustomer ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shadow-sm"
              onClick={onNewCustomer}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">New Customer</span>
              <span className="sm:hidden">Customer</span>
            </Button>
          ) : null}
          <Button
            size="sm"
            className="min-h-[var(--touch-min)] font-semibold shadow-sm"
            onClick={onNewAppointment}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Appointment</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">{viewContextHint(view)}</p>
    </div>
  );
}

export { format };
