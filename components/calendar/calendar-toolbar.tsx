"use client";

import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import {
  formatDate,
  formatDayHeader,
  formatMonthYear,
  formatWeekRange,
} from "@/lib/calendar/utils";
import type { CalendarView } from "@/lib/types/booking";
import type { CalendarColorMode } from "@/components/calendar/appointment-block";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { addDays, addMonths, addWeeks, subDays, subMonths, subWeeks } from "date-fns";

type CalendarToolbarProps = {
  view: CalendarView;
  date: Date;
  colorMode: CalendarColorMode;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  onColorModeChange: (mode: CalendarColorMode) => void;
  onNewAppointment: () => void;
};

const viewTabs = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

function getTitle(view: CalendarView, date: Date): string {
  switch (view) {
    case "day":
      return formatDayHeader(date);
    case "week":
      return formatWeekRange(date);
    case "month":
      return formatMonthYear(date);
  }
}

function navigate(view: CalendarView, date: Date, direction: "prev" | "next"): Date {
  const fn = direction === "prev"
    ? { day: subDays, week: subWeeks, month: subMonths }
    : { day: addDays, week: addWeeks, month: addMonths };
  return fn[view](date, 1);
}

export function CalendarToolbar({
  view,
  date,
  colorMode,
  onViewChange,
  onDateChange,
  onColorModeChange,
  onNewAppointment,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
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
        <h2 className="ml-2 text-base font-semibold text-foreground sm:text-lg">
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
        <Button size="sm" onClick={onNewAppointment}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New appointment</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
    </div>
  );
}

export { formatDate };
