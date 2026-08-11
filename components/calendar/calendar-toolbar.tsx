"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  formatDayHeader,
  formatMonthYear,
  formatWeekRange,
} from "@/lib/calendar/utils";
import { formatDayHeaderInTimezone } from "@/lib/calendar/day-geometry";
import { calendarDateInTimezone } from "@/lib/business/datetime";
import {
  PRIMARY_CALENDAR_VIEWS,
  SECONDARY_CALENDAR_VIEWS,
  isSecondaryCalendarView,
} from "@/lib/calendar/day-surface";
import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
  type CalendarView,
  type StaffWithServices,
} from "@/lib/types/booking";
import type { CalendarColorMode } from "@/components/calendar/appointment-block";
import {
  DEFAULT_CALENDAR_BOARD_FILTERS,
  sortStaffForBoardFilter,
  type CalendarBoardFilters,
  type CalendarBoardStaffFilter,
  type CalendarBoardStatusFilter,
} from "@/lib/dashboard/appointment-ops";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Undo2,
  UserPlus,
} from "lucide-react";
import { addDays, addMonths, addWeeks, format, parse } from "date-fns";
import { useEffect, useId, useRef, useState } from "react";

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
  staff?: StaffWithServices[];
  filters?: CalendarBoardFilters;
  onFiltersChange?: (next: CalendarBoardFilters) => void;
};

const PRIMARY_TABS: Array<{ id: PrimaryId; label: string }> = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

type PrimaryId = (typeof PRIMARY_CALENDAR_VIEWS)[number];

const SECONDARY_LABELS: Record<(typeof SECONDARY_CALENDAR_VIEWS)[number], string> =
  {
    agenda: "Agenda",
    timeline: "Timeline",
    employees: "Employees",
    locations: "Locations",
    resource: "Resources",
  };

const STATUS_OPTIONS: Array<{
  value: CalendarBoardStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active only" },
  ...(
    Object.entries(APPOINTMENT_STATUS_LABELS) as Array<
      [AppointmentStatus, string]
    >
  ).map(([value, label]) => ({ value, label })),
];

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

function MoreMenu({
  view,
  colorMode,
  onViewChange,
  onColorModeChange,
  onUndo,
  onDuplicate,
  canDuplicate,
  onNewCustomer,
}: Pick<
  CalendarToolbarProps,
  | "view"
  | "colorMode"
  | "onViewChange"
  | "onColorModeChange"
  | "onUndo"
  | "onDuplicate"
  | "canDuplicate"
  | "onNewCustomer"
>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-[var(--touch-min)] shadow-sm"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-label="More calendar actions"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" />
        More
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="More calendar actions"
          className="absolute right-0 top-full z-[var(--z-overlay)] mt-1.5 min-w-[13.5rem] rounded-[var(--radius-md)] border border-border bg-card p-1 shadow-lg"
        >
          <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Views
          </p>
          {SECONDARY_CALENDAR_VIEWS.map((id) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              aria-current={view === id ? "page" : undefined}
              className={cn(
                "flex min-h-[var(--touch-min)] w-full items-center rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm",
                view === id
                  ? "bg-muted font-medium text-foreground"
                  : "text-foreground hover:bg-muted",
              )}
              onClick={() => {
                onViewChange(id);
                setOpen(false);
              }}
            >
              {SECONDARY_LABELS[id]}
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Color
          </p>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-[var(--touch-min)] w-full items-center rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm hover:bg-muted"
            onClick={() => {
              onColorModeChange(colorMode === "service" ? "staff" : "service");
              setOpen(false);
            }}
          >
            Color by {colorMode === "service" ? "staff" : "service"}
          </button>
          {onNewCustomer || onUndo || onDuplicate ? (
            <div className="my-1 border-t border-border" />
          ) : null}
          {onNewCustomer ? (
            <button
              type="button"
              role="menuitem"
              className="flex min-h-[var(--touch-min)] w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onNewCustomer();
                setOpen(false);
              }}
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              New Customer
            </button>
          ) : null}
          {onUndo ? (
            <button
              type="button"
              role="menuitem"
              className="flex min-h-[var(--touch-min)] w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onUndo();
                setOpen(false);
              }}
            >
              <Undo2 className="h-4 w-4" aria-hidden />
              Undo
            </button>
          ) : null}
          {onDuplicate && canDuplicate ? (
            <button
              type="button"
              role="menuitem"
              className="flex min-h-[var(--touch-min)] w-full items-center rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onDuplicate();
                setOpen(false);
              }}
            >
              Duplicate appointment
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
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
  staff = [],
  filters,
  onFiltersChange,
}: CalendarToolbarProps) {
  const civilDate = timeZone
    ? calendarDateInTimezone(date, timeZone)
    : format(date, "yyyy-MM-dd");
  const primarySelected = isSecondaryCalendarView(view) ? null : view;
  const showScope = Boolean(filters && onFiltersChange);

  return (
    <div
      className="flex flex-col gap-2"
      data-calendar-toolbar
      data-toolbar-hierarchy="primary-secondary"
    >
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div
            role="tablist"
            aria-label="Calendar view"
            className="inline-flex rounded-xl border border-border bg-muted/50 p-0.5 shadow-sm"
          >
            {PRIMARY_TABS.map((tab) => {
              const selected = primarySelected === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "min-h-[var(--touch-min)] rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm",
                    selected
                      ? "bg-card text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => onViewChange(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

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
              aria-label="Previous"
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
              aria-label="Next"
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
            className="h-10 min-h-[var(--touch-min)] w-[9.5rem] border-border bg-card px-2 text-xs shadow-sm"
            value={civilDate}
            onChange={(e) => {
              const raw = e.target.value;
              if (!raw) return;
              const next = parse(raw, "yyyy-MM-dd", new Date());
              if (!Number.isNaN(next.getTime())) onDateChange(next);
            }}
            aria-label="Jump to date"
          />
          <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {getTitle(view, date, timeZone)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {showScope && filters && onFiltersChange ? (
            <div
              className="flex flex-wrap items-center gap-1.5"
              data-day-scope-filters
            >
              <label className="sr-only" htmlFor="day-filter-staff">
                Employee
              </label>
              <Select
                id="day-filter-staff"
                className="h-10 min-h-[var(--touch-min)] w-[9.75rem] px-2.5 text-xs shadow-sm"
                value={filters.staffId}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    staffId: e.target.value as CalendarBoardStaffFilter,
                  })
                }
                aria-label="Employee filter"
              >
                <option value="all">All employees</option>
                {sortStaffForBoardFilter(staff).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
                <option value="unassigned">Unassigned</option>
              </Select>
              <label className="sr-only" htmlFor="day-filter-status">
                Status
              </label>
              <Select
                id="day-filter-status"
                className="h-10 min-h-[var(--touch-min)] w-[8.75rem] px-2.5 text-xs shadow-sm"
                value={filters.status}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    status: e.target.value as CalendarBoardStatusFilter,
                  })
                }
                aria-label="Status filter"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              {filters.staffId !== DEFAULT_CALENDAR_BOARD_FILTERS.staffId ||
              filters.status !== DEFAULT_CALENDAR_BOARD_FILTERS.status ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shadow-sm"
                  onClick={() => onFiltersChange(DEFAULT_CALENDAR_BOARD_FILTERS)}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          ) : null}

          <MoreMenu
            view={view}
            colorMode={colorMode}
            onViewChange={onViewChange}
            onColorModeChange={onColorModeChange}
            onUndo={onUndo}
            onDuplicate={onDuplicate}
            canDuplicate={canDuplicate}
            onNewCustomer={onNewCustomer}
          />

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
    </div>
  );
}

export { format };
