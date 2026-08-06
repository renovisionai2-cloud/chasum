"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import {
  formatDayHeader,
  formatMonthYear,
  formatWeekRange,
} from "@/lib/calendar/utils";
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
      return "Reception floor — today’s operating queue.";
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

function getTitle(view: CalendarView, date: Date): string {
  switch (view) {
    case "day":
    case "timeline":
    case "employees":
    case "locations":
    case "resource":
      return formatDayHeader(date);
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
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(navigate(view, date, "prev"))}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(new Date())}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(navigate(view, date, "next"))}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <label className="sr-only" htmlFor="calendar-jump-date">
          Jump to date
        </label>
        <Input
          id="calendar-jump-date"
          type="date"
          className="h-9 w-[9.5rem] px-2 text-xs"
          value={format(date, "yyyy-MM-dd")}
          onChange={(e) => {
            const raw = e.target.value;
            if (!raw) return;
            const next = parse(raw, "yyyy-MM-dd", new Date());
            if (!Number.isNaN(next.getTime())) onDateChange(next);
          }}
          aria-label="Jump to date"
        />
        <h2 className="ml-1 text-base font-semibold text-foreground sm:text-lg">
          {getTitle(view, date)}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-border bg-muted/50 p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              colorMode === "service"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onColorModeChange("service")}
          >
            By service
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              colorMode === "staff"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onColorModeChange("staff")}
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
          <Button type="button" size="sm" variant="outline" onClick={onUndo}>
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
        ) : null}
        {onDuplicate ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canDuplicate}
            onClick={onDuplicate}
          >
            Duplicate
          </Button>
        ) : null}
        {onNewCustomer ? (
          <Button type="button" size="sm" variant="outline" onClick={onNewCustomer}>
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
          <span className="hidden sm:inline">New appointment</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
      </div>
      <p className="text-[11px] text-muted-foreground">{viewContextHint(view)}</p>
    </div>
  );
}

export { format };
