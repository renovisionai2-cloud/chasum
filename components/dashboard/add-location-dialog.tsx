"use client";

import {
  assignStaffToLocation,
  createLocation,
  type LocationCreateState,
  type LocationSetupContext,
} from "@/lib/actions/location";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import type { ActionState } from "@/lib/types/booking";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";

type SetupMode = "default" | "copy" | "blank";

type AddLocationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTimezone?: string;
  setupContext: LocationSetupContext;
  canAdd: boolean;
  planName: string;
  maxLocations: number | null;
  blankDefaults: {
    appointmentIntervalMinutes: number;
    bookingLimitDays: number;
    maxDailyBookings: number | null;
    cancellationPolicy: string | null;
  };
};

export function AddLocationDialog(props: AddLocationDialogProps) {
  if (!props.open) return null;
  return <AddLocationDialogInner {...props} />;
}

function AddLocationDialogInner({
  open,
  onOpenChange,
  defaultTimezone,
  setupContext,
  canAdd,
  planName,
  maxLocations,
  blankDefaults,
}: AddLocationDialogProps) {
  const router = useRouter();
  const defaultSource =
    setupContext.defaultLocationCount === 1
      ? setupContext.sources.find((source) => source.isDefault) ?? null
      : null;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState(
    defaultTimezone ?? "America/Toronto",
  );
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<SetupMode>(
    defaultSource ? "default" : "blank",
  );
  const [copySourceId, setCopySourceId] = useState(
    defaultSource?.id ?? setupContext.sources[0]?.id ?? "",
  );
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());

  const [createState, createAction, creating] = useActionState(
    createLocation,
    {} as LocationCreateState,
  );
  const [staffState, staffAction, assigning] = useActionState(
    assignStaffToLocation,
    {} as ActionState,
  );

  const source =
    mode === "default"
      ? defaultSource
      : mode === "copy"
        ? setupContext.sources.find((item) => item.id === copySourceId) ?? null
        : null;

  const sourceStaffIds = useMemo(() => {
    if (!source) return [];
    return setupContext.staff
      .filter((member) => member.locationIds.includes(source.id))
      .map((member) => member.id);
  }, [setupContext.staff, source]);

  const visibleStep: 1 | 2 | 3 | 4 = createState.locationId ? 4 : step;

  const closeWorkflow = () => {
    onOpenChange(false);
    router.replace("/dashboard/business?tab=locations");
  };

  useEffect(() => {
    if (!staffState.success) return;
    onOpenChange(false);
    router.replace("/dashboard/business?tab=locations");
  }, [staffState.success, onOpenChange, router]);

  const goToSetup = () => {
    if (!name.trim() || !timezone.trim()) return;
    setStep(2);
  };

  const canReview =
    mode === "blank" ||
    (source != null &&
      source.settings != null &&
      source.hourDayCount === 7);

  const toggleStaff = (staffId: string) => {
    setSelectedStaff((current) => {
      const next = new Set(current);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  const selectSourceStaff = () => {
    setSelectedStaff(new Set(sourceStaffIds));
  };

  const finishWithoutStaff = () => {
    closeWorkflow();
  };

  return (
    <Dialog
      open={open}
      onClose={closeWorkflow}
      title="Add location"
      description="Set up a new site from known business truth, then review what is different here."
    >
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        {["Details", "Setup", "Review", "Staff"].map((label, index) => {
          const number = index + 1;
          return (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold " +
                  (visibleStep >= number
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted")
                }
              >
                {number}
              </span>
              <span className="hidden truncate sm:inline">{label}</span>
            </div>
          );
        })}
      </div>

      {!canAdd ? (
        <div className="space-y-3">
          <AlertMessage
            error={
              maxLocations == null
                ? "Another location cannot be added right now."
                : `${planName} currently allows ${maxLocations} location${maxLocations === 1 ? "" : "s"}. Request a plan change before adding another site.`
            }
          />
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={closeWorkflow}>
              Close
            </Button>
          </div>
        </div>
      ) : visibleStep === 1 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location_name">Location name</Label>
            <Input
              id="location_name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Downtown Studio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location_slug">URL slug (optional)</Label>
            <Input
              id="location_slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="downtown"
            />
          </div>
          <TimezoneSelect
            id="location_timezone"
            name="timezone_preview"
            label="Timezone"
            value={timezone}
            onChange={setTimezone}
            required
          />
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address</Label>
            <Input
              id="address_line1"
              value={addressLine1}
              onChange={(event) => setAddressLine1(event.target.value)}
              placeholder="123 Main St"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line2">Address line 2</Label>
            <Input
              id="address_line2"
              value={addressLine2}
              onChange={(event) => setAddressLine2(event.target.value)}
              placeholder="Suite 200"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                value={stateRegion}
                onChange={(event) => setStateRegion(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal / ZIP code</Label>
              <Input
                id="postal_code"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_phone">Phone</Label>
              <Input
                id="location_phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </div>
          {!name.trim() || !timezone.trim() ? (
            <p className="text-xs text-muted-foreground">
              Add a location name and timezone to continue.
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeWorkflow}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={goToSetup}
              disabled={!name.trim() || !timezone.trim()}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : visibleStep === 2 ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <SetupCard
              title="Default location"
              description={
                defaultSource
                  ? `Recommended · copy ${defaultSource.name}`
                  : setupContext.defaultLocationCount > 1
                    ? "Multiple default locations need review"
                    : "No default location available"
              }
              selected={mode === "default"}
              disabled={!defaultSource}
              onClick={() => setMode("default")}
            />
            <SetupCard
              title="Copy another"
              description="Choose a different active location as the snapshot."
              selected={mode === "copy"}
              disabled={setupContext.sources.length === 0}
              onClick={() => setMode("copy")}
            />
            <SetupCard
              title="Start blank"
              description="No services or staff. Hours start closed."
              selected={mode === "blank"}
              onClick={() => setMode("blank")}
            />
          </div>

          {mode === "copy" ? (
            <div className="space-y-2">
              <Label htmlFor="copy_source">Copy from</Label>
              <Select
                id="copy_source"
                value={copySourceId}
                onChange={(event) => setCopySourceId(event.target.value)}
              >
                {setupContext.sources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.isDefault ? " · Default" : ""}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {source && (!source.settings || source.hourDayCount !== 7) ? (
            <AlertMessage error="This source location has incomplete booking settings or hours and cannot be copied safely." />
          ) : null}

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canReview}
            >
              Review setup
            </Button>
          </div>
        </div>
      ) : visibleStep === 3 ? (
        <form action={createAction} className="space-y-4">
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="timezone" value={timezone} />
          <input type="hidden" name="address_line1" value={addressLine1} />
          <input type="hidden" name="address_line2" value={addressLine2} />
          <input type="hidden" name="city" value={city} />
          <input type="hidden" name="state" value={stateRegion} />
          <input type="hidden" name="postal_code" value={postalCode} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="setup_mode" value={mode} />
          <input
            type="hidden"
            name="source_location_id"
            value={source?.id ?? ""}
          />

          <div className="rounded-[var(--radius-md)] border border-border bg-muted/20 p-4">
            <p className="text-sm font-semibold text-foreground">
              {mode === "blank"
                ? "Start blank"
                : `Copied from ${source?.name ?? "location"}`}
            </p>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {mode === "blank" ? (
                <>
                  <PreviewItem label="Services" value="None copied" />
                  <PreviewItem label="Hours" value="Closed by default" />
                  <PreviewItem
                    label="Booking interval"
                    value={`${blankDefaults.appointmentIntervalMinutes} minutes`}
                  />
                  <PreviewItem
                    label="Booking window"
                    value={`${blankDefaults.bookingLimitDays} days`}
                  />
                </>
              ) : (
                <>
                  <PreviewItem
                    label="Services"
                    value={`${source?.serviceCount ?? 0} active service${source?.serviceCount === 1 ? "" : "s"}`}
                  />
                  <PreviewItem
                    label="Hours"
                    value={`${source?.openDayCount ?? 0} open day${source?.openDayCount === 1 ? "" : "s"}`}
                  />
                  <PreviewItem
                    label="Booking interval"
                    value={`${source?.settings?.appointmentIntervalMinutes ?? 30} minutes`}
                  />
                  <PreviewItem
                    label="Booking window"
                    value={`${source?.settings?.bookingLimitDays ?? 60} days`}
                  />
                  {(source?.segmentCount ?? 0) > 0 ? (
                    <PreviewItem
                      label="Split-hour segments"
                      value={String(source?.segmentCount ?? 0)}
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border px-3 py-3 text-sm">
            <p className="font-medium">You stay in control</p>
            <p className="mt-1 text-muted-foreground">
              Staff and rooms/resources are not copied automatically. You can
              choose staff after the location is created.
            </p>
          </div>

          <AlertMessage error={createState.error} success={createState.success} />

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create location"}
            </Button>
          </div>
        </form>
      ) : (
        <form action={staffAction} className="space-y-4">
          <input
            type="hidden"
            name="location_id"
            value={createState.locationId ?? ""}
          />
          <div>
            <p className="text-sm font-semibold">
              Which staff work at {createState.locationName ?? "this location"}?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This adds a secondary works-at assignment. Home locations are not
              moved.
            </p>
          </div>

          {source && sourceStaffIds.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectSourceStaff}
            >
              Select staff from {source.name}
            </Button>
          ) : null}

          {setupContext.staff.length > 0 ? (
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-[var(--radius-md)] border border-border p-3">
              {setupContext.staff.map((member) => {
                const checked = selectedStaff.has(member.id);
                return (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      name="staff_ids"
                      value={member.id}
                      checked={checked}
                      onChange={() => toggleStaff(member.id)}
                      className="size-4"
                    />
                    <span className="min-w-0 text-sm">
                      <span className="block truncate font-medium">
                        {member.name}
                      </span>
                      {source && member.locationIds.includes(source.id) ? (
                        <span className="text-xs text-muted-foreground">
                          Works at {source.name}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="rounded-[var(--radius-md)] border border-border p-3 text-sm text-muted-foreground">
              No active staff are available to assign.
            </p>
          )}

          <AlertMessage error={staffState.error} success={staffState.success} />

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={finishWithoutStaff}
              disabled={assigning}
            >
              Skip for now
            </Button>
            {setupContext.staff.length > 0 ? (
              <Button type="submit" disabled={assigning}>
                {assigning
                  ? "Saving..."
                  : selectedStaff.size === 0
                    ? "Finish without staff"
                    : `Assign ${selectedStaff.size} & finish`}
              </Button>
            ) : (
              <Button type="button" onClick={finishWithoutStaff}>
                Done
              </Button>
            )}
          </div>
        </form>
      )}
    </Dialog>
  );
}

function SetupCard({
  title,
  description,
  selected,
  disabled = false,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={
        "rounded-[var(--radius-md)] border p-3 text-left transition " +
        (selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:bg-muted/40") +
        (disabled ? " cursor-not-allowed opacity-50" : "")
      }
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-xs text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="mt-0.5 block text-foreground">{value}</span>
    </div>
  );
}
