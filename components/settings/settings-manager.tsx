"use client";

import { WorkingHoursGrid } from "@/components/forms/working-hours-grid";
import { AvailabilityBlocksForm } from "@/components/settings/availability-blocks-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertMessage } from "@/components/ui/form-feedback";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  updateLocationHours,
  updateLocationSettings,
} from "@/lib/actions/location";
import type { LocationScope } from "@/lib/location/constants";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import {
  PUBLIC_BOOKING_MODES,
  type ActionState,
  Availability,
  Business,
  Holiday,
  LocationHours,
  LocationSettings,
  LocationWithSettings,
  Staff,
} from "@/lib/types/booking";
import { TIMEZONES } from "@/lib/constants";
import { getAppUrl } from "@/lib/env";
import { createHoliday, deleteHoliday } from "@/lib/actions/holidays";
import { updateBusinessProfile } from "@/lib/actions/business-hours";
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
  const social = business.social_links ?? {};

  useFormAction(state);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Business profile</CardTitle>
        <CardDescription>
          Public identity for your booking page, invoices, and client communications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[120px_1fr]">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                {business.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.logo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-muted-foreground">
                    {business.name.charAt(0)}
                  </span>
                )}
              </div>
              <p className="text-center text-xs text-muted-foreground">Logo</p>
            </div>
            <div className="space-y-4">
              <ImageUploadField
                id="logo_url"
                name="logo_url"
                label="Logo"
                folder="logo"
                defaultValue={business.logo_url}
              />
              <ImageUploadField
                id="cover_url"
                name="cover_url"
                label="Cover image"
                folder="cover"
                defaultValue={business.cover_url}
                hint="Wide hero image for your public booking page."
                previewClassName="sm:w-48 sm:h-24"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Business name</Label>
                  <Input id="name" name="name" defaultValue={business.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    id="timezone"
                    name="timezone"
                    defaultValue={business.timezone}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">Booking URL slug</Label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-muted-foreground">/book/</span>
                <Input id="slug" name="slug" defaultValue={business.slug} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://…"
                defaultValue={business.website ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Business phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={business.phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Business email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={business.email ?? ""}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Physical address</p>
            <div className="space-y-2">
              <Label htmlFor="address_line1">Street address</Label>
              <Input
                id="address_line1"
                name="address_line1"
                defaultValue={business.address_line1 ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line2">Address line 2</Label>
              <Input
                id="address_line2"
                name="address_line2"
                defaultValue={business.address_line2 ?? ""}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={business.city ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue={business.state ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal code</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  defaultValue={business.postal_code ?? ""}
                />
              </div>
            </div>
            <input type="hidden" name="country" value={business.country ?? "US"} />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Social media</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="social_instagram">Instagram</Label>
                <Input
                  id="social_instagram"
                  name="social_instagram"
                  placeholder="https://instagram.com/…"
                  defaultValue={social.instagram ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_facebook">Facebook</Label>
                <Input
                  id="social_facebook"
                  name="social_facebook"
                  placeholder="https://facebook.com/…"
                  defaultValue={social.facebook ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_tiktok">TikTok</Label>
                <Input
                  id="social_tiktok"
                  name="social_tiktok"
                  placeholder="https://tiktok.com/@…"
                  defaultValue={social.tiktok ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_youtube">YouTube</Label>
                <Input
                  id="social_youtube"
                  name="social_youtube"
                  placeholder="https://youtube.com/…"
                  defaultValue={social.youtube ?? ""}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Public description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Short intro shown on your public booking page…"
              defaultValue={business.description ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking_policy">Booking policy</Label>
            <Textarea
              id="booking_policy"
              name="booking_policy"
              rows={3}
              placeholder="Arrival instructions, deposit rules, late policy…"
              defaultValue={business.booking_policy ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancellation_policy">Cancellation policy</Label>
            <Textarea
              id="cancellation_policy"
              name="cancellation_policy"
              rows={3}
              placeholder="e.g. Cancel or reschedule at least 24 hours before…"
              defaultValue={business.cancellation_policy ?? ""}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="public_booking_mode">Public booking access</Label>
              <Select
                id="public_booking_mode"
                name="public_booking_mode"
                defaultValue={business.public_booking_mode ?? "public"}
              >
                {PUBLIC_BOOKING_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                {PUBLIC_BOOKING_MODES.find(
                  (m) => m.value === (business.public_booking_mode ?? "public"),
                )?.description}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking_invite_code">Invite code</Label>
              <Input
                id="booking_invite_code"
                name="booking_invite_code"
                placeholder="Required for invite-only mode"
                defaultValue={business.booking_invite_code ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                Share as <span className="font-mono">?invite=your-code</span> on
                your booking link.
              </p>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Public booking page</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">{bookingUrl}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(bookingUrl)}
              >
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
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HoursForm({
  hours,
  locationName,
}: {
  hours: LocationHours[];
  locationName: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateLocationHours,
    {} as ActionState,
  );

  useFormAction(state);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location hours</CardTitle>
        <CardDescription>{locationName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <WorkingHoursGrid hours={hours} namePrefix="day" openField="open" />
          <AlertMessage error={state.error} success={state.success} />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save hours"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function BookingSettingsForm({
  settings,
  locationName,
}: {
  settings: LocationSettings;
  locationName: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateLocationSettings,
    {} as ActionState,
  );

  useFormAction(state);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduling rules</CardTitle>
        <CardDescription>
          Slot interval and booking window for {locationName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_interval_minutes">
                Appointment interval (min)
              </Label>
              <Input
                id="appointment_interval_minutes"
                name="appointment_interval_minutes"
                type="number"
                min={5}
                step={5}
                defaultValue={settings.appointment_interval_minutes ?? 30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking_limit_days">Booking limit (days ahead)</Label>
              <Input
                id="booking_limit_days"
                name="booking_limit_days"
                type="number"
                min={1}
                defaultValue={settings.booking_limit_days ?? 60}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_daily_bookings">Max daily bookings (optional)</Label>
            <Input
              id="max_daily_bookings"
              name="max_daily_bookings"
              type="number"
              min={1}
              defaultValue={settings.max_daily_bookings ?? ""}
            />
          </div>
          <input
            type="hidden"
            name="cancellation_policy"
            value={settings.cancellation_policy ?? ""}
          />
          <AlertMessage error={state.error} success={state.success} />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save scheduling rules"}
          </Button>
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
    <Card>
      <CardHeader>
        <CardTitle>Holidays & closures</CardTitle>
        <CardDescription>Dates when the location does not accept bookings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {holidays.length > 0 ? (
          <ul className="space-y-2">
            {holidays.map((holiday) => (
              <li
                key={holiday.id}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm"
              >
                <span>
                  {holiday.name} — {holiday.date}
                  {!holiday.location_id ? (
                    <span className="ml-2 text-xs text-muted-foreground">(all locations)</span>
                  ) : null}
                </span>
                <IconButton
                  label={`Remove ${holiday.name}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(holiday.id)}
                >
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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="business_wide" /> Apply to all locations
          </label>
          <AlertMessage error={state.error} success={state.success} />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Adding..." : "Add holiday"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SettingsManager({
  business,
  location,
  locationScope,
  holidays,
  availabilityBlocks,
  staff,
}: {
  business: Business;
  location: LocationWithSettings;
  locationScope: LocationScope;
  holidays: Holiday[];
  availabilityBlocks: Availability[];
  staff: Staff[];
}) {
  const scopeNote =
    locationScope.mode === "all"
      ? "Showing settings for your default location. Switch to a specific location in the header to edit another site."
      : null;

  return (
    <div className="space-y-4">
      {scopeNote && (
        <p className="rounded-[var(--radius-md)] border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {scopeNote}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm business={business} />
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>
              Current plan, trials, invoices, upgrades, and cancellations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/billing">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Manage billing
              </Button>
            </Link>
          </CardContent>
        </Card>
        <HoursForm hours={location.hours} locationName={location.name} />
        <BookingSettingsForm
          settings={location.settings}
          locationName={location.name}
        />
        <HolidaysForm holidays={holidays} />
        <AvailabilityBlocksForm blocks={availabilityBlocks} staff={staff} />
      </div>
    </div>
  );
}
