"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ReactNode } from "react";
import {
  formatDayHeader,
  formatMonthYear,
  formatWeekRange,
} from "@/lib/calendar/utils";
import { calendarDateInTimezone } from "@/lib/business/datetime";
import { getBusinessTimezone } from "@/lib/locale";
import { parseCalendarDateParam } from "@/lib/calendar/date-param";
import type { CalendarView } from "@/lib/types/booking";
import type { CalendarColorMode } from "@/components/calendar/appointment-block";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, SlidersHorizontal, MoreHorizontal, PanelRightOpen } from "lucide-react";
import { addDays, addMonths, addWeeks, format, parse } from "date-fns";

type CalendarToolbarProps = {
  timezone?: string;
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
  filters?: ReactNode;
  filtersActive?: boolean;
  onBlockTime?: () => void;
  onOpenReception?: () => void;
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
  timezone,
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
  filters,
  filtersActive = false,
  onBlockTime,
  onOpenReception,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3" aria-label="Calendar controls">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <Button variant="outline" size="sm" className="min-h-11 px-3" onClick={() => onDateChange(navigate(view, date, "prev"))} aria-label="Previous">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" className="min-h-11" onClick={() => onDateChange(parseCalendarDateParam(calendarDateInTimezone(new Date(), getBusinessTimezone({ timezone }))))}>Today</Button>
        <Button variant="outline" size="sm" className="min-h-11 px-3" onClick={() => onDateChange(navigate(view, date, "next"))} aria-label="Next">
          <ChevronRight className="size-4" />
        </Button>
        <details className="relative" onKeyDown={closeOnEscape}>
          <summary className="ds-focus-ring flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <h2>{getTitle(view, date)}</h2><ChevronDown className="size-3 shrink-0" aria-hidden />
          </summary>
          <div className="absolute left-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-lg">
            <label className="mb-2 block text-xs font-medium" htmlFor="calendar-jump-date">Jump to date</label>
            <Input id="calendar-jump-date" type="date" value={format(date, "yyyy-MM-dd")}
              onChange={(e) => {
                if (!e.target.value) return;
                const next = parse(e.target.value, "yyyy-MM-dd", new Date());
                if (!Number.isNaN(next.getTime())) onDateChange(next);
              }} />
          </div>
        </details>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Select aria-label="Calendar view" className="w-32 px-3 text-xs font-semibold" value={view}
          onChange={(event) => onViewChange(event.target.value as CalendarView)}>
          <optgroup label="Calendar">
            {viewTabs.slice(0, 4).map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
          </optgroup>
          <optgroup label="Advanced views">
            {viewTabs.slice(4).map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
          </optgroup>
        </Select>
        <details className="relative" onKeyDown={closeOnEscape}>
          <summary className={disclosureClass}>
            <SlidersHorizontal className="size-4" aria-hidden /> Filters
            {filtersActive && <span className="size-2 rounded-full bg-primary" aria-label="Filters active" />}
          </summary>
          <div className="absolute left-0 top-full z-40 mt-2 max-h-[60dvh] w-60 overflow-auto rounded-xl border border-border bg-card p-4 shadow-lg sm:left-auto sm:right-0">
            <p className="mb-2 text-xs font-semibold">Color by</p>
            <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
              {(["service", "staff"] as const).map(mode => (
                <button key={mode} type="button" aria-pressed={colorMode === mode}
                  className="ds-focus-ring min-h-11 flex-1 rounded-md px-2 text-xs font-medium aria-pressed:bg-card aria-pressed:shadow-sm"
                  onClick={() => onColorModeChange(mode)}>By {mode}</button>
              ))}
            </div>
            {filters}
          </div>
        </details>
        <details className="relative" onKeyDown={closeOnEscape}>
          <summary className={disclosureClass}><MoreHorizontal className="size-4" aria-hidden /><span className="sr-only sm:not-sr-only">More actions</span></summary>
          <div className="absolute right-0 top-full z-40 mt-2 flex w-48 flex-col gap-1 rounded-xl border border-border bg-card p-2 shadow-lg"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("button:not(:disabled)")) {
                const details = event.currentTarget.closest("details");
                if (details) { details.open = false; details.querySelector("summary")?.focus(); }
              }
            }}>
            {onUndo && <Button variant="ghost" onClick={onUndo}>Undo</Button>}
            {onDuplicate && <Button variant="ghost" disabled={!canDuplicate} onClick={onDuplicate}>Duplicate</Button>}
            {onNewCustomer && <Button variant="ghost" onClick={onNewCustomer}>New Customer</Button>}
            {onBlockTime && <Button variant="ghost" onClick={onBlockTime}>Block time</Button>}
          </div>
        </details>
        {onOpenReception && <Button variant="outline" size="sm" className="min-h-11 px-3" aria-label="Open reception panel" title="Reception tools" onClick={onOpenReception}><PanelRightOpen className="size-4" aria-hidden /></Button>}
        <Button size="sm" className="min-h-11" onClick={onNewAppointment}>
          <Plus className="size-4" aria-hidden />New appointment
        </Button>
      </div>
    </div>
  );
}

const disclosureClass = "ds-focus-ring flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-[var(--radius-md)] border border-border bg-card px-3 text-xs font-medium shadow-xs [&::-webkit-details-marker]:hidden";

function closeOnEscape(event: React.KeyboardEvent<HTMLDetailsElement>) {
  if (event.key !== "Escape") return;
  event.stopPropagation();
  event.currentTarget.open = false;
  event.currentTarget.querySelector("summary")?.focus();
}

export { format };
