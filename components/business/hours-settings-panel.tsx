"use client";

import { WorkingHoursGrid } from "@/components/forms/working-hours-grid";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  createBusinessClosure,
  deleteBusinessClosure,
} from "@/lib/actions/business-management";
import { createHoliday, deleteHoliday } from "@/lib/actions/holidays";
import { updateLocationHours } from "@/lib/actions/location";
import type { BusinessClosure } from "@/lib/business/settings";
import type { ActionState, Holiday, LocationHours } from "@/lib/types/booking";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { useActionState, useTransition } from "react";

export function HoursSettingsPanel({
  hours,
  holidays,
  closures,
}: {
  hours: LocationHours[];
  holidays: Holiday[];
  closures: BusinessClosure[];
}) {
  const refresh = useRefresh();
  const { toast } = useToast();
  const [deleting, startDelete] = useTransition();

  const [hoursState, hoursAction, hoursPending] = useActionState(
    updateLocationHours,
    {} as ActionState,
  );
  const [holidayState, holidayAction, holidayPending] = useActionState(
    createHoliday,
    {} as ActionState,
  );
  const [closureState, closureAction, closurePending] = useActionState(
    createBusinessClosure,
    {} as ActionState,
  );

  useFormAction(hoursState, undefined, () => refresh());
  useFormAction(holidayState, undefined, () => refresh());
  useFormAction(closureState, undefined, () => refresh());

  function removeHoliday(id: string, name: string) {
    startDelete(async () => {
      if (!(await confirmDelete(`Remove holiday “${name}”?`))) return;
      const result = await deleteHoliday(id);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Removed.", "success");
        refresh();
      }
    });
  }

  function removeClosure(id: string, name: string) {
    startDelete(async () => {
      if (!(await confirmDelete(`Remove “${name}”?`))) return;
      const result = await deleteBusinessClosure(id);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Removed.", "success");
        refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Weekly hours (active location)</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={hoursAction} className="space-y-4">
            <WorkingHoursGrid hours={hours} namePrefix="day" />
            <p className="text-xs text-muted-foreground">
              Closed days: uncheck a day. Split shifts and special windows can be
              added as temporary / special-hour closures below until the calendar
              engine consumes multi-segment hours.
            </p>
            <AlertMessage error={hoursState.error} success={hoursState.success} />
            <FormFooter pending={hoursPending} submitLabel="Save weekly hours" />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Holidays</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {holidays.length === 0 ? (
            <EmptyState
              variant="panel"
              title="No holidays yet"
              description="Add closed dates that Calendar and Summer should respect."
            />
          ) : (
            <ul className="divide-y divide-border/80 rounded-[var(--radius-md)] border border-border">
              {holidays.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.date}
                      {h.is_recurring ? " · recurring" : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={deleting}
                    onClick={() => removeHoliday(h.id, h.name)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form action={holidayAction} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="holiday_name">Name</Label>
              <Input id="holiday_name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday_date">Date</Label>
              <Input id="holiday_date" name="date" type="date" required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_recurring" />
              Recurring yearly
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="business_wide" />
              All locations
            </label>
            <div className="sm:col-span-2">
              <AlertMessage error={holidayState.error} success={holidayState.success} />
              <FormFooter pending={holidayPending} submitLabel="Add holiday" />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vacations, temporary closures & special hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {closures.length === 0 ? (
            <EmptyState
              variant="panel"
              title="No closures yet"
              description="Add vacation periods, temporary closures, or special open hours."
            />
          ) : (
            <ul className="divide-y divide-border/80 rounded-[var(--radius-md)] border border-border">
              {closures.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.closure_type} · {new Date(c.starts_at).toLocaleString()} →{" "}
                      {new Date(c.ends_at).toLocaleString()}
                      {c.open_time && c.close_time
                        ? ` · open ${c.open_time.slice(0, 5)}–${c.close_time.slice(0, 5)}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={deleting}
                    onClick={() => removeClosure(c.id, c.name)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form action={closureAction} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="closure_name">Name</Label>
              <Input id="closure_name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closure_type">Type</Label>
              <Select id="closure_type" name="closure_type" defaultValue="temporary">
                <option value="vacation">Vacation</option>
                <option value="temporary">Temporary closure</option>
                <option value="special_hours">Special hours</option>
                <option value="holiday">Holiday window</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="starts_at">Starts</Label>
              <Input id="starts_at" name="starts_at" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at">Ends</Label>
              <Input id="ends_at" name="ends_at" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="open_time">Special open time (optional)</Label>
              <Input id="open_time" name="open_time" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="close_time">Special close time (optional)</Label>
              <Input id="close_time" name="close_time" type="time" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_recurring" />
              Recurring
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="business_wide" />
              All locations
            </label>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="sm:col-span-2">
              <AlertMessage error={closureState.error} success={closureState.success} />
              <FormFooter pending={closurePending} submitLabel="Add closure" />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
