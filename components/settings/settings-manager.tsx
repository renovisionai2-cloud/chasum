"use client";

import { WorkingHoursGrid } from "@/components/forms/working-hours-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertMessage } from "@/components/ui/form-feedback";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  updateBusinessHours,
  updateBusinessProfile,
} from "@/lib/actions/business-hours";
import type { ActionState, Business, BusinessHours } from "@/lib/types/booking";
import { TIMEZONES } from "@/lib/constants";
import { getAppUrl } from "@/lib/env";
import {
  createHoliday,
  deleteHoliday,
  updateBusinessSettings,
} from "@/lib/actions/holidays";
import type { Holiday } from "@/lib/types/booking";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

function ProfileForm({ business }: { business: Business }) {
  const [state, formAction, pending] = useActionState(
    updateBusinessProfile,
    {} as ActionState,
  );
  const bookingUrl = `${getAppUrl()}/book/${business.slug}`;

  useFormAction(state);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Business profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business name</Label>
            <Input id="name" name="name" defaultValue={business.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Booking URL slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/book/</span>
              <Input id="slug" name="slug" defaultValue={business.slug} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select id="timezone" name="timezone" defaultValue={business.timezone}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </Select>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Public booking page</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">{bookingUrl}</p>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(bookingUrl)}>
                <Copy className="h-4 w-4" /> Copy link
              </Button>
              <Link href={`/book/${business.slug}`} target="_blank">
                <Button type="button" variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" /> Preview
                </Button>
              </Link>
            </div>
          </div>
          <AlertMessage error={state.error} success={state.success} />
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save profile"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HoursForm({ hours }: { hours: BusinessHours[] }) {
  const [state, formAction, pending] = useActionState(
    updateBusinessHours,
    {} as ActionState,
  );

  useFormAction(state);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Business hours</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <WorkingHoursGrid hours={hours} namePrefix="day" openField="open" />
          <AlertMessage error={state.error} success={state.success} />
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save hours"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function BookingSettingsForm({ business }: { business: Business }) {
  const [state, formAction, pending] = useActionState(
    updateBusinessSettings,
    {} as ActionState,
  );

  useFormAction(state);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Booking settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_interval_minutes">Appointment interval (min)</Label>
              <Input id="appointment_interval_minutes" name="appointment_interval_minutes" type="number" min={5} step={5} defaultValue={business.appointment_interval_minutes ?? 30} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking_limit_days">Booking limit (days ahead)</Label>
              <Input id="booking_limit_days" name="booking_limit_days" type="number" min={1} defaultValue={business.booking_limit_days ?? 60} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_daily_bookings">Max daily bookings (optional)</Label>
            <Input id="max_daily_bookings" name="max_daily_bookings" type="number" min={1} defaultValue={business.max_daily_bookings ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancellation_policy">Cancellation policy</Label>
            <Textarea id="cancellation_policy" name="cancellation_policy" placeholder="e.g. Cancel at least 24 hours before your appointment..." defaultValue={business.cancellation_policy ?? ""} />
          </div>
          <AlertMessage error={state.error} success={state.success} />
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save settings"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HolidaysForm({ holidays }: { holidays: Holiday[] }) {
  const [state, formAction, pending] = useActionState(createHoliday, {} as ActionState);
  const refresh = useRefresh();
  const { toast } = useToast();

  useFormAction(state);

  async function handleDelete(id: string) {
    const result = await deleteHoliday(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Holiday removed.", "success");
      refresh();
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Holidays</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {holidays.length > 0 ? (
          <ul className="space-y-2">
            {holidays.map((holiday) => (
              <li key={holiday.id} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                <span>{holiday.name} — {holiday.date}</span>
                <IconButton label={`Remove ${holiday.name}`} className="text-destructive hover:text-destructive" onClick={() => handleDelete(holiday.id)}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No holidays added yet.</p>
        )}
        <form action={formAction} className="space-y-3 border-t border-border pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="holiday_name">Holiday name</Label>
              <Input id="holiday_name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday_date">Date</Label>
              <Input id="holiday_date" name="date" type="date" required />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_recurring" /> Recurring annually
          </label>
          <AlertMessage error={state.error} success={state.success} />
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Adding..." : "Add holiday"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SettingsManager({
  business,
  hours,
  holidays,
}: {
  business: Business;
  hours: BusinessHours[];
  holidays: Holiday[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileForm business={business} />
      <HoursForm hours={hours} />
      <BookingSettingsForm business={business} />
      <HolidaysForm holidays={holidays} />
    </div>
  );
}
