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
import { Copy, ExternalLink } from "lucide-react";
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

export function SettingsManager({
  business,
  hours,
}: {
  business: Business;
  hours: BusinessHours[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileForm business={business} />
      <HoursForm hours={hours} />
    </div>
  );
}
