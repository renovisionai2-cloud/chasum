"use client";

import { cn } from "@/lib/utils";
import type { Location } from "@/lib/types/booking";

type BookingLocationDecisionProps = {
  locations: Location[];
  locationId: string;
  /** When set, other locations are listed but not selectable for this service. */
  serviceLocationId?: string | null;
  onLocationChange: (id: string) => void;
};

export function BookingLocationDecision({
  locations,
  locationId,
  serviceLocationId,
  onLocationChange,
}: BookingLocationDecisionProps) {
  const sorted = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  const serviceBound = serviceLocationId?.trim() || "";

  return (
    <div className="space-y-3">
      <ul className="max-h-[min(50vh,420px)] space-y-1.5 overflow-y-auto">
        {sorted.map((location) => {
          const selected = location.id === locationId;
          const offeredHere = !serviceBound || location.id === serviceBound;
          return (
            <li key={location.id}>
              <button
                type="button"
                disabled={!offeredHere}
                className={cn(
                  "flex w-full min-h-11 items-center rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-accent/30 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40",
                  !offeredHere &&
                    "cursor-not-allowed opacity-45 hover:border-border",
                )}
                onClick={() => {
                  if (!offeredHere) return;
                  onLocationChange(location.id);
                }}
                aria-pressed={selected}
                aria-disabled={!offeredHere || undefined}
                title={
                  offeredHere
                    ? undefined
                    : "This service is not offered at this location"
                }
              >
                {location.name}
              </button>
            </li>
          );
        })}
        {sorted.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No active locations are available to book.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
