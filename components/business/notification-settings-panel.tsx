"use client";

import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBusinessNotificationSettings } from "@/lib/actions/business-management";
import type { ActionState, Business } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useActionState } from "react";

export function NotificationSettingsPanel({ business }: { business: Business }) {
  const [state, action, pending] = useActionState(
    updateBusinessNotificationSettings,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(state, undefined, () => refresh());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="email_notifications_enabled"
                defaultChecked={business.email_notifications_enabled !== false}
              />
              Email reminders & confirmations
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="sms_notifications_enabled"
                defaultChecked={business.sms_notifications_enabled === true}
              />
              SMS reminders (future)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="owner_notifications_enabled"
                defaultChecked={business.owner_notifications_enabled !== false}
              />
              Owner notifications
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="staff_notifications_enabled"
                defaultChecked={business.staff_notifications_enabled !== false}
              />
              Staff notifications
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reminder_hours_before">Reminder timing (hours before)</Label>
              <Input
                id="reminder_hours_before"
                name="reminder_hours_before"
                type="number"
                min={1}
                defaultValue={business.reminder_hours_before ?? 24}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification_email">Notification email override</Label>
              <Input
                id="notification_email"
                name="notification_email"
                type="email"
                defaultValue={business.notification_email ?? ""}
                placeholder={business.email ?? "owner@business.com"}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Appointment confirmations and cancellations follow these toggles via
            the notification orchestrator. SMS delivery remains gated until the
            SMS provider is enabled.
          </p>

          <AlertMessage error={state.error} success={state.success} />
          <FormFooter pending={pending} submitLabel="Save notifications" />
        </form>
      </CardContent>
    </Card>
  );
}
