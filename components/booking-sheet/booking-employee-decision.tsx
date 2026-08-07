"use client";

import {
  ASSIGN_LATER_COMING_SOON_LABEL,
  OPTIONAL_STAFF_PERSISTENCE_ENABLED,
} from "@/lib/booking/optional-staff";
import type { StaffWithServices } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

type BookingEmployeeDecisionProps = {
  staff: StaffWithServices[];
  staffId: string;
  onStaffChange: (id: string) => void;
};

/**
 * Named employee required today. “Any available professional” is future —
 * do not present Assign later as a normal usable choice.
 */
export function BookingEmployeeDecision({
  staff,
  staffId,
  onStaffChange,
}: BookingEmployeeDecisionProps) {
  const sorted = [...staff].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  return (
    <div className="space-y-3">
      <ul className="max-h-[min(50vh,420px)] space-y-1.5 overflow-y-auto">
        {sorted.map((m) => {
          const selected = m.id === staffId;
          return (
            <li key={m.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full min-h-11 items-center rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-accent/30 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40",
                )}
                onClick={() => onStaffChange(m.id)}
                aria-pressed={selected}
              >
                {m.name}
              </button>
            </li>
          );
        })}
        {sorted.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No eligible employees for this service and location.
          </li>
        ) : null}
      </ul>

      {!OPTIONAL_STAFF_PERSISTENCE_ENABLED ? (
        <p
          className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground"
          role="note"
        >
          {ASSIGN_LATER_COMING_SOON_LABEL}. Automatic “any available professional”
          routing is planned — not available in this release.
        </p>
      ) : null}
    </div>
  );
}
