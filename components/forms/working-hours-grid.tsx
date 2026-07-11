import { Input } from "@/components/ui/input";
import { DAY_NAMES } from "@/lib/types/booking";

type DayHours = {
  day_of_week: number;
  is_open?: boolean;
  is_working?: boolean;
  open_time?: string;
  close_time?: string;
  start_time?: string;
  end_time?: string;
};

type WorkingHoursGridProps = {
  hours: DayHours[];
  namePrefix: "day" | "staff_day";
  openField?: "open" | "working";
};

export function WorkingHoursGrid({
  hours,
  namePrefix,
  openField = "open",
}: WorkingHoursGridProps) {
  return (
    <div className="space-y-3">
      {DAY_NAMES.map((dayName, day) => {
        const dayHours = hours.find((h) => h.day_of_week === day);
        const isActive =
          openField === "open"
            ? (dayHours?.is_open ?? (day >= 1 && day <= 5))
            : (dayHours?.is_working ?? (day >= 1 && day <= 5));
        const start =
          dayHours?.open_time?.slice(0, 5) ??
          dayHours?.start_time?.slice(0, 5) ??
          "09:00";
        const end =
          dayHours?.close_time?.slice(0, 5) ??
          dayHours?.end_time?.slice(0, 5) ??
          "17:00";

        const checkboxName =
          namePrefix === "day"
            ? `day_${day}_open`
            : `day_${day}_working`;
        const startName =
          namePrefix === "day" ? `day_${day}_open_time` : `day_${day}_start`;
        const endName =
          namePrefix === "day" ? `day_${day}_close_time` : `day_${day}_end`;

        return (
          <div
            key={dayName}
            className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center"
          >
            <label className="flex min-w-[120px] items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name={checkboxName}
                defaultChecked={isActive}
              />
              {namePrefix === "staff_day" ? dayName.slice(0, 3) : dayName}
            </label>
            <div className="flex flex-1 items-center gap-2">
              <Input type="time" name={startName} defaultValue={start} className="flex-1" />
              <span className="text-muted-foreground">to</span>
              <Input type="time" name={endName} defaultValue={end} className="flex-1" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
