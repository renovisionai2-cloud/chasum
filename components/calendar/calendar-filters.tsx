"use client";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import {
  calendarBoardFiltersAreActive,
  DEFAULT_CALENDAR_BOARD_FILTERS,
  sortStaffForBoardFilter,
  type CalendarBoardFilters,
  type CalendarBoardStaffFilter,
  type CalendarBoardStatusFilter,
} from "@/lib/dashboard/appointment-ops";
import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
  type StaffWithServices,
} from "@/lib/types/booking";
import { Filter, RotateCcw } from "lucide-react";
import { useState } from "react";

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

type CalendarFiltersProps = {
  staff: StaffWithServices[];
  filters: CalendarBoardFilters;
  onChange: (next: CalendarBoardFilters) => void;
  matchedCount: number;
  totalCount: number;
};

function FilterFields({
  staff,
  filters,
  onChange,
  idPrefix,
}: {
  staff: StaffWithServices[];
  filters: CalendarBoardFilters;
  onChange: (next: CalendarBoardFilters) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[10rem] flex-1 space-y-1">
        <label
          htmlFor={`${idPrefix}-staff`}
          className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          Employee
        </label>
        <select
          id={`${idPrefix}-staff`}
          className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-background px-2.5 text-sm ds-focus-ring"
          value={filters.staffId}
          onChange={(e) =>
            onChange({
              ...filters,
              staffId: e.target.value as CalendarBoardStaffFilter,
            })
          }
        >
          <option value="all">All employees</option>
          {sortStaffForBoardFilter(staff).map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
          <option value="unassigned">Unassigned</option>
        </select>
      </div>
      <div className="min-w-[10rem] flex-1 space-y-1">
        <label
          htmlFor={`${idPrefix}-status`}
          className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          Status
        </label>
        <select
          id={`${idPrefix}-status`}
          className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-background px-2.5 text-sm ds-focus-ring"
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as CalendarBoardStatusFilter,
            })
          }
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function CalendarFilters({
  staff,
  filters,
  onChange,
  matchedCount,
  totalCount,
}: CalendarFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const active = calendarBoardFiltersAreActive(filters);
  const staffLabel =
    filters.staffId === "all"
      ? null
      : filters.staffId === "unassigned"
        ? "Unassigned"
        : (staff.find((s) => s.id === filters.staffId)?.name ?? "Employee");
  const statusLabel =
    filters.status === "all"
      ? null
      : filters.status === "active"
        ? "Active only"
        : APPOINTMENT_STATUS_LABELS[filters.status as AppointmentStatus] ??
          filters.status;

  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-border/80 bg-card/60 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">
          Calendar filters
          <span className="ml-2 font-normal text-muted-foreground">
            Showing {matchedCount} of {totalCount}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {active ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[var(--touch-min)]"
              onClick={() => onChange(DEFAULT_CALENDAR_BOARD_FILTERS)}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[var(--touch-min)] md:hidden"
            onClick={() => setSheetOpen(true)}
            aria-expanded={sheetOpen}
          >
            <Filter className="h-3.5 w-3.5" aria-hidden />
            Filters
          </Button>
        </div>
      </div>

      {active ? (
        <div className="flex flex-wrap gap-1.5" aria-label="Active filters">
          {staffLabel ? (
            <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium">
              Employee: {staffLabel}
            </span>
          ) : null}
          {statusLabel ? (
            <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium">
              Status: {statusLabel}
            </span>
          ) : null}
          <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
            Location: use header location switcher
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Location scope comes from the header switcher. Employee and status
          filters apply to every calendar view below.
        </p>
      )}

      <div className="hidden md:block">
        <FilterFields
          staff={staff}
          filters={filters}
          onChange={onChange}
          idPrefix="cal-desk"
        />
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Calendar filters"
        description="Filter the board by employee and status. Location uses the header switcher."
        footer={
          <div className="flex w-full justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange(DEFAULT_CALENDAR_BOARD_FILTERS)}
            >
              Reset
            </Button>
            <Button type="button" onClick={() => setSheetOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <FilterFields
          staff={staff}
          filters={filters}
          onChange={onChange}
          idPrefix="cal-mobile"
        />
      </Sheet>
    </div>
  );
}
