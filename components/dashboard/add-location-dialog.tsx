"use client";

import { createLocation } from "@/lib/actions/location";
import { AlertMessage } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TIMEZONES } from "@/lib/constants";
import type { ActionState } from "@/lib/types/booking";
import { useFormAction } from "@/hooks/use-form-action";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

type AddLocationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTimezone?: string;
};

export function AddLocationDialog({
  open,
  onOpenChange,
  defaultTimezone,
}: AddLocationDialogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createLocation,
    {} as ActionState,
  );

  useFormAction(state);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, onOpenChange, router]);

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="Add location"
      description="Create a new location for your business. Staff, services, and appointments are scoped per location."
    >
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location_name">Location name</Label>
          <Input id="location_name" name="name" required placeholder="Downtown Studio" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location_slug">URL slug (optional)</Label>
          <Input id="location_slug" name="slug" placeholder="downtown" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location_timezone">Timezone</Label>
          <Select
            id="location_timezone"
            name="timezone"
            defaultValue={defaultTimezone ?? "America/New_York"}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_line1">Address</Label>
          <Input id="address_line1" name="address_line1" placeholder="123 Main St" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" />
          </div>
        </div>
        <AlertMessage error={state.error} success={state.success} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create location"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
