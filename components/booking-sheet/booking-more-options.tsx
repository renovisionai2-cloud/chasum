"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MIN_BOOKING_DURATION_MINUTES } from "@/lib/booking/resolved-duration";
import type { Location } from "@/lib/types/booking";
import { useState, type ReactNode } from "react";

type BookingMoreOptionsProps = {
  notes: string;
  onNotesChange: (notes: string) => void;
  durationMinutes: number;
  durationUnresolved?: boolean;
  durationIsOverride?: boolean;
  onDurationChange: (minutes: number | null) => void;
  locations: Location[];
  locationId: string;
  onLocationChange: (id: string) => void;
  bookingSource: string;
  extra?: ReactNode;
};

/**
 * Secondary controls — collapsed by default; never interrupt the primary path.
 */
export function BookingMoreOptions({
  notes,
  onNotesChange,
  durationMinutes,
  durationUnresolved,
  durationIsOverride,
  onDurationChange,
  locations,
  locationId,
  onLocationChange,
  bookingSource,
  extra,
}: BookingMoreOptionsProps) {
  const [open, setOpen] = useState(false);
  const [draftDuration, setDraftDuration] = useState(String(durationMinutes));

  return (
    <div className="border-t border-border/60 pt-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="min-h-10 px-2 text-xs text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Hide more options" : "More options"}
      </Button>
      {open ? (
        <div className="mt-2 space-y-3 rounded-[var(--radius-md)] border border-border/70 bg-muted/10 px-3 py-3">
          {locations.length > 1 ? (
            <div className="space-y-1.5">
              <Label htmlFor="bs-more-location">Location</Label>
              <Select
                id="bs-more-location"
                value={locationId}
                onChange={(e) => onLocationChange(e.target.value)}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="bs-more-duration">Duration override</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="bs-more-duration"
                type="number"
                min={MIN_BOOKING_DURATION_MINUTES}
                className="min-h-11 w-28"
                value={draftDuration}
                disabled={durationUnresolved}
                onChange={(e) => setDraftDuration(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="min-h-11"
                disabled={durationUnresolved}
                onClick={() => {
                  const n = Number(draftDuration);
                  if (Number.isFinite(n) && n >= MIN_BOOKING_DURATION_MINUTES) {
                    onDurationChange(n);
                  }
                }}
              >
                Apply
              </Button>
              {durationIsOverride ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => onDurationChange(null)}
                >
                  Reset
                </Button>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Source: {bookingSource}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bs-more-notes">Note</Label>
            <Textarea
              id="bs-more-notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              placeholder="Optional note for this appointment"
            />
          </div>

          {extra}
        </div>
      ) : null}
    </div>
  );
}
