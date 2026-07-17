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
  lunch_start_time?: string | null;
  lunch_end_time?: string | null;
  overtime_eligible?: boolean;
};

type WorkingHoursGridProps = {
  hours: DayHours[];
  namePrefix: "day" | "staff_day";
  openField?: "open" | "working";
  showLunchBreaks?: boolean;
};

export function WorkingHoursGrid({
  hours,
  namePrefix,
  openField = "open",
  showLunchBreaks = false,
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
        const lunchStart = dayHours?.lunch_start_time?.slice(0, 5) ?? "";
        const lunchEnd = dayHours?.lunch_end_time?.slice(0, 5) ?? "";

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
            className="flex flex-col gap-2 rounded-xl border border-border p-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
            {showLunchBreaks && namePrefix === "staff_day" ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:pl-[128px]">
                <span className="min-w-[4.5rem] text-xs text-muted-foreground">
                  Lunch
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="time"
                    name={`day_${day}_lunch_start`}
                    defaultValue={lunchStart}
                    className="flex-1"
                    aria-label={`${dayName} lunch start`}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    name={`day_${day}_lunch_end`}
                    defaultValue={lunchEnd}
                    className="flex-1"
                    aria-label={`${dayName} lunch end`}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    name={`day_${day}_overtime`}
                    defaultChecked={Boolean(dayHours?.overtime_eligible)}
                  />
                  OT
                </label>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
