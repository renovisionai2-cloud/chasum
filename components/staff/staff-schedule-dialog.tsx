"use client";

import { WorkingHoursGrid } from "@/components/forms/working-hours-grid";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage } from "@/components/ui/form-feedback";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addStaffVacation,
  deleteStaffVacation,
  updateStaffWorkingHours,
} from "@/lib/actions/staff-schedule";
import { VACATION_KIND_LABELS } from "@/lib/employees/roles";
import type {
  ActionState,
  Staff,
  StaffVacation,
  StaffWorkingHours,
} from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { Trash2 } from "lucide-react";
import { useActionState } from "react";

type StaffScheduleDialogProps = {
  open: boolean;
  onClose: () => void;
  staff: Staff;
  workingHours: StaffWorkingHours[];
  vacations: StaffVacation[];
};

export function StaffScheduleDialog({
  open,
  onClose,
  staff,
  workingHours,
  vacations,
}: StaffScheduleDialogProps) {
  const [hoursState, hoursAction, hoursPending] = useActionState(
    updateStaffWorkingHours,
    {} as ActionState,
  );
  const [vacationState, vacationAction, vacationPending] = useActionState(
    addStaffVacation,
    {} as ActionState,
  );
  const refresh = useRefresh();
  const { toast } = useToast();

  useFormAction(hoursState);
  useFormAction(vacationState);

  async function handleDeleteVacation(id: string) {
    const result = await deleteStaffVacation(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Vacation removed.", "success");
      refresh();
    }
  }

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
        <WorkingHoursGrid
          hours={workingHours}
          namePrefix="staff_day"
          openField="working"
          showLunchBreaks
        />
        <AlertMessage error={hoursState.error} success={hoursState.success} />
        <Button type="submit" size="sm" disabled={hoursPending}>
          {hoursPending ? "Saving..." : "Save hours"}
        </Button>
      </form>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 text-sm font-semibold">Vacation days</h3>
        {vacations.length > 0 ? (
          <ul className="mb-3 space-y-2">
            {vacations.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="min-w-0 break-words">{v.start_date} → {v.end_date}{v.reason ? ` (${v.reason})` : ""}</span>
                <IconButton label="Remove vacation" className="text-destructive hover:text-destructive" onClick={() => handleDeleteVacation(v.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">No vacation days scheduled.</p>
        )}
        <form action={vacationAction} className="space-y-3">
          <input type="hidden" name="staff_id" value={staff.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="start_date">Start</Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end_date">End</Label>
              <Input id="end_date" name="end_date" type="date" required />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="kind">Type</Label>
              <Select id="kind" name="kind" defaultValue="vacation">
                {Object.entries(VACATION_KIND_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Input name="reason" placeholder="Reason (optional)" aria-label="Vacation reason" />
          <AlertMessage error={vacationState.error} />
          <Button type="submit" size="sm" variant="outline" disabled={vacationPending}>
            {vacationPending ? "Adding..." : "Add vacation"}
          </Button>
        </form>
      </div>
    </Dialog>
  );
}
