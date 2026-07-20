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
              SMS confirmations & reminders
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="marketing_email_enabled"
                defaultChecked={business.marketing_email_enabled === true}
              />
              Marketing email campaigns
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
            <div className="space-y-2">
              <Label htmlFor="quiet_hours_start">Quiet hours start</Label>
              <Input
                id="quiet_hours_start"
                name="quiet_hours_start"
                type="time"
                defaultValue={
                  business.quiet_hours_start
                    ? String(business.quiet_hours_start).slice(0, 5)
                    : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet_hours_end">Quiet hours end</Label>
              <Input
                id="quiet_hours_end"
                name="quiet_hours_end"
                type="time"
                defaultValue={
                  business.quiet_hours_end
                    ? String(business.quiet_hours_end).slice(0, 5)
                    : ""
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="communications_opt_out_footer">
                Email footer / opt-out text
              </Label>
              <Input
                id="communications_opt_out_footer"
                name="communications_opt_out_footer"
                defaultValue={business.communications_opt_out_footer ?? ""}
                placeholder="Reply STOP to opt out · Sent by your business"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            All email and SMS flow through the Communications Platform (Resend /
            Twilio). Quiet hours defer outbound sends. Customer marketing consent
            is respected for campaign templates. If sends fail: verify RESEND_API_KEY
            and a verified sender for email, Twilio env vars for SMS, and that the
            job cron is running. Skipped or misconfigured deliveries now fail with
            a clear error instead of looking successful.
          </p>

          <AlertMessage error={state.error} success={state.success} />
          <FormFooter pending={pending} submitLabel="Save notifications" />
        </form>
      </CardContent>
    </Card>
  );
}
