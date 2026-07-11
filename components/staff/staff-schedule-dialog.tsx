"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addStaffVacation,
  deleteStaffVacation,
  updateStaffWorkingHours,
} from "@/lib/actions/staff-schedule";
import type {
  ActionState,
  Staff,
  StaffVacation,
  StaffWorkingHours,
} from "@/lib/types/booking";
import { DAY_NAMES } from "@/lib/types/booking";
import { Trash2 } from "lucide-react";
import { useActionState, useEffect } from "react";

type StaffScheduleDialogProps = {
  open: boolean;
  onClose: () => void;
  staff: Staff;
  workingHours: StaffWorkingHours[];
  vacations: StaffVacation[];
  onSuccess: () => void;
};

export function StaffScheduleDialog({
  open,
  onClose,
  staff,
  workingHours,
  vacations,
  onSuccess,
}: StaffScheduleDialogProps) {
  const [hoursState, hoursAction, hoursPending] = useActionState(
    updateStaffWorkingHours,
    {} as ActionState,
  );
  const [vacationState, vacationAction, vacationPending] = useActionState(
    addStaffVacation,
    {} as ActionState,
  );

  useEffect(() => {
    if (hoursState.success || vacationState.success) onSuccess();
  }, [hoursState.success, vacationState.success, onSuccess]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Schedule — ${staff.name}`}
      description="Working hours and vacation days"
      className="sm:max-w-xl"
    >
      <form action={hoursAction} className="mb-6 space-y-3">
        <input type="hidden" name="staff_id" value={staff.id} />
        <h3 className="text-sm font-semibold">Working hours</h3>
        {DAY_NAMES.map((dayName, day) => {
          const dayHours = workingHours.find((h) => h.day_of_week === day);
          return (
            <div key={dayName} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
              <label className="flex min-w-[100px] items-center gap-2 text-sm">
                <input type="checkbox" name={`day_${day}_working`} defaultChecked={dayHours?.is_working ?? (day >= 1 && day <= 5)} />
                {dayName.slice(0, 3)}
              </label>
              <div className="flex flex-1 items-center gap-2">
                <Input type="time" name={`day_${day}_start`} defaultValue={dayHours?.start_time?.slice(0, 5) ?? "09:00"} className="flex-1" />
                <span className="text-muted-foreground">–</span>
                <Input type="time" name={`day_${day}_end`} defaultValue={dayHours?.end_time?.slice(0, 5) ?? "17:00"} className="flex-1" />
              </div>
            </div>
          );
        })}
        {hoursState.error && <p className="text-sm text-destructive">{hoursState.error}</p>}
        {hoursState.success && <p className="text-sm text-success">{hoursState.success}</p>}
        <Button type="submit" size="sm" disabled={hoursPending}>Save hours</Button>
      </form>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 text-sm font-semibold">Vacation days</h3>
        {vacations.length > 0 && (
          <ul className="mb-3 space-y-2">
            {vacations.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{v.start_date} → {v.end_date}{v.reason ? ` (${v.reason})` : ""}</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={async () => {
                  await deleteStaffVacation(v.id);
                  onSuccess();
                }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form action={vacationAction} className="space-y-3">
          <input type="hidden" name="staff_id" value={staff.id} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start_date">Start</Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end_date">End</Label>
              <Input id="end_date" name="end_date" type="date" required />
            </div>
          </div>
          <Input name="reason" placeholder="Reason (optional)" />
          {vacationState.error && <p className="text-sm text-destructive">{vacationState.error}</p>}
          <Button type="submit" size="sm" variant="outline" disabled={vacationPending}>Add vacation</Button>
        </form>
      </div>
    </Dialog>
  );
}
