"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { buildSimpleIcsEvent } from "@/lib/calendar/ics";
import type { Business, PublicBookingSummary } from "@/lib/types/booking";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { format } from "date-fns";
import { CalendarPlus, Check, Download } from "lucide-react";

type BookingConfirmationProps = {
  business: Business;
  reference: string;
  summary: PublicBookingSummary;
  emailQueued?: boolean;
  onBookAnother: () => void;
};

function toGoogleCalendarUrl(summary: PublicBookingSummary, businessName: string) {
  const start = parseISO(summary.startTime);
  const end = parseISO(summary.endTime);
  const fmtUtc = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${summary.serviceName} with ${summary.staffName}`,
    dates: `${fmtUtc(start)}/${fmtUtc(end)}`,
    details: `Booked via ${businessName}. Confirmation for ${summary.customerName}.`,
    location: summary.locationName ?? businessName,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcs(
  reference: string,
  business: Business,
  summary: PublicBookingSummary,
) {
  const ics = buildSimpleIcsEvent({
    id: reference,
    title: `${summary.serviceName} with ${summary.staffName}`,
    description: `Booked for ${summary.customerName} via ${business.name}`,
    location: summary.locationName,
    startTime: summary.startTime,
    endTime: summary.endTime,
  });
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reference}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BookingConfirmation({
  business,
  reference,
  summary,
  emailQueued,
  onBookAnother,
}: BookingConfirmationProps) {
  const when = parseISO(summary.startTime);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logo_url}
                alt=""
                className="h-11 w-11 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                {business.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold sm:text-xl">
                {business.name}
              </p>
              <p className="text-sm text-muted-foreground">Booking confirmed</p>
            </div>
          </div>
          <Logo showText={false} href={null} />
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <Check className="h-8 w-8 text-success" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            You&apos;re booked
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reference{" "}
            <span className="font-mono font-medium text-foreground">
              {reference}
            </span>
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 p-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Service</span>
              <span className="text-right font-medium">{summary.serviceName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Provider</span>
              <span className="text-right font-medium">{summary.staffName}</span>
            </div>
            {summary.locationName && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Location</span>
                <span className="text-right font-medium">
                  {summary.locationName}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">When</span>
              <span className="text-right font-medium">
                {format(when, "EEEE, MMM d")} at {formatTime(when)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Duration</span>
              <span className="text-right font-medium">
                {summary.durationMinutes} min
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Guest</span>
              <span className="text-right font-medium">
                {summary.customerName}
                <br />
                <span className="font-normal text-muted-foreground">
                  {summary.customerEmail}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            onClick={() => downloadIcs(reference, business, summary)}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download .ics
          </Button>
          <a
            href={toGoogleCalendarUrl(summary, business.name)}
            target="_blank"
            rel="noreferrer"
            className="flex-1"
          >
            <Button type="button" variant="outline" className="w-full">
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Add to Google Calendar
            </Button>
          </a>
        </div>

        {business.cancellation_policy && (
          <p className="rounded-[var(--radius-md)] border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <strong className="text-foreground">Cancellation policy:</strong>{" "}
            {business.cancellation_policy}
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {emailQueued
            ? `A confirmation email with calendar invite is being sent to ${summary.customerEmail}.`
            : `Your booking is saved. If email delivery is configured, a confirmation will go to ${summary.customerEmail}.`}
        </p>

        <Button type="button" variant="ghost" onClick={onBookAnother}>
          Book another appointment
        </Button>
      </main>
    </div>
  );
}
