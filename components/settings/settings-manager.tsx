"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  updateBusinessHours,
  updateBusinessProfile,
} from "@/lib/actions/business-hours";
import type { ActionState, Business, BusinessHours } from "@/lib/types/booking";
import { DAY_NAMES } from "@/lib/types/booking";
import { TIMEZONES } from "@/lib/constants";
import { getAppUrl } from "@/lib/env";
import {
  createHoliday,
  deleteHoliday,
  updateBusinessSettings,
} from "@/lib/actions/holidays";
import type { Holiday } from "@/lib/types/booking";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

function ProfileForm({ business }: { business: Business }) {
  const [state, formAction, pending] = useActionState(
    updateBusinessProfile,
    {} as ActionState,
  );
  const bookingUrl = `${getAppUrl()}/book/${business.slug}`;

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
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="text-sm text-success">{state.success}</p>}
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

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Business hours</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          {DAY_NAMES.map((dayName, day) => {
            const dayHours = hours.find((h) => h.day_of_week === day);
            return (
              <div key={dayName} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
                <label className="flex min-w-[120px] items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name={`day_${day}_open`}
                    defaultChecked={dayHours?.is_open ?? (day >= 1 && day <= 5)}
                  />
                  {dayName}
                </label>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="time"
                    name={`day_${day}_open_time`}
                    defaultValue={dayHours?.open_time?.slice(0, 5) ?? "09:00"}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    name={`day_${day}_close_time`}
                    defaultValue={dayHours?.close_time?.slice(0, 5) ?? "17:00"}
                    className="flex-1"
                  />
                </div>
              </div>
            );
          })}
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="text-sm text-success">{state.success}</p>}
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
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="text-sm text-success">{state.success}</p>}
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save settings"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HolidaysForm({ holidays }: { holidays: Holiday[] }) {
  const [state, formAction, pending] = useActionState(createHoliday, {} as ActionState);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Holidays</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {holidays.length > 0 && (
          <ul className="space-y-2">
            {holidays.map((holiday) => (
              <li key={holiday.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                <span>{holiday.name} — {holiday.date}</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={async () => {
                  await deleteHoliday(holiday.id);
                  window.location.reload();
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form action={formAction} className="space-y-3 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-3">
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
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="text-sm text-success">{state.success}</p>}
          <Button type="submit" size="sm" disabled={pending}>Add holiday</Button>
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
