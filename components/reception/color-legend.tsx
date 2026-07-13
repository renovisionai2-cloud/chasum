"use client";

import type { Service, StaffWithServices } from "@/lib/types/booking";
import type { CalendarColorMode } from "@/components/calendar/appointment-block";

export function ColorLegend({
  colorMode,
  services,
  staff,
}: {
  colorMode: CalendarColorMode;
  services: Service[];
  staff: StaffWithServices[];
}) {
  const items =
    colorMode === "staff"
      ? staff
          .filter((s) => s.is_active)
          .slice(0, 8)
          .map((s) => ({ id: s.id, name: s.name, color: s.color }))
      : services
          .filter((s) => s.is_active)
          .slice(0, 8)
          .map((s) => ({ id: s.id, name: s.name, color: s.color }));

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">
        {colorMode === "staff" ? "Staff" : "Services"}
      </span>
      {items.map((item) => (
        <span key={item.id} className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.name}
        </span>
      ))}
    </div>
  );
}
