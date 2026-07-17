"use client";

import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBusinessBookingSettings } from "@/lib/actions/business-management";
import type { ActionState, Business } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useActionState } from "react";

export function BookingSettingsPanel({ business }: { business: Business }) {
  const [state, action, pending] = useActionState(
    updateBusinessBookingSettings,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(state, undefined, () => refresh());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="appointment_interval_minutes">Slot interval (minutes)</Label>
              <Input
                id="appointment_interval_minutes"
                name="appointment_interval_minutes"
                type="number"
                min={5}
                step={5}
                defaultValue={business.appointment_interval_minutes ?? 30}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking_limit_days">Maximum future booking (days)</Label>
              <Input
                id="booking_limit_days"
                name="booking_limit_days"
                type="number"
                min={1}
                defaultValue={business.booking_limit_days ?? 60}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_notice_minutes">Minimum notice (minutes)</Label>
              <Input
                id="min_notice_minutes"
                name="min_notice_minutes"
                type="number"
                min={0}
                defaultValue={business.min_notice_minutes ?? 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancellation_window_hours">
                Cancellation window (hours before)
              </Label>
              <Input
                id="cancellation_window_hours"
                name="cancellation_window_hours"
                type="number"
                min={0}
                defaultValue={business.cancellation_window_hours ?? 24}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="booking_confirmation_mode">Booking confirmation mode</Label>
              <Select
                id="booking_confirmation_mode"
                name="booking_confirmation_mode"
                defaultValue={business.booking_confirmation_mode ?? "auto"}
              >
                <option value="auto">Auto-confirm</option>
                <option value="manual">Manual review</option>
                <option value="request_approval">Request approval</option>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reschedule_policy">Reschedule policy</Label>
              <Textarea
                id="reschedule_policy"
                name="reschedule_policy"
                rows={2}
                defaultValue={business.reschedule_policy ?? ""}
                placeholder="e.g. Reschedule at least 12 hours before the appointment."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cancellation_policy">Cancellation policy</Label>
              <Textarea
                id="cancellation_policy"
                name="cancellation_policy"
                rows={2}
                defaultValue={business.cancellation_policy ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="online_booking_enabled"
                defaultChecked={business.online_booking_enabled !== false}
              />
              Online booking enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="waitlist_enabled"
                defaultChecked={business.waitlist_enabled !== false}
              />
              Waitlist enabled
            </label>
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="allow_double_booking"
                className="mt-0.5"
                defaultChecked={business.allow_double_booking === true}
              />
              <span>
                Allow double booking (stored preference — calendar engine still
                prevents conflicts until Phase 4 Calendar wires this flag)
              </span>
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Per-service appointment buffers are configured on each service. Slot
            interval syncs to the active location for the availability engine.
          </p>

          <AlertMessage error={state.error} success={state.success} />
          <FormFooter pending={pending} submitLabel="Save booking settings" />
        </form>
      </CardContent>
    </Card>
  );
}
