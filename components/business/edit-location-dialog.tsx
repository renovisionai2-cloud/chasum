"use client";

import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateLocationFromForm } from "@/lib/actions/location";
import { TIMEZONES } from "@/lib/constants";
import type { ActionState, Location } from "@/lib/types/booking";
import { useFormAction } from "@/hooks/use-form-action";
import { useActionState } from "react";

export function EditLocationDialog({
  location,
  open,
  onClose,
}: {
  location: Location | null;
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateLocationFromForm,
    {} as ActionState,
  );

  useFormAction(state, undefined, onClose);

  if (!location) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit location"
      description="Update the name, address, and phone customers see for this site."
      className="sm:max-w-lg"
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="location_id" value={location.id} />
        <div className="space-y-2">
          <Label htmlFor="edit_location_name">Location name</Label>
          <Input
            id="edit_location_name"
            name="name"
            required
            defaultValue={location.name}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit_location_slug">URL slug</Label>
            <Input
              id="edit_location_slug"
              name="slug"
              defaultValue={location.slug}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_location_phone">Phone</Label>
            <Input
              id="edit_location_phone"
              name="phone"
              type="tel"
              defaultValue={location.phone ?? ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_location_timezone">Timezone</Label>
          <Select
            id="edit_location_timezone"
            name="timezone"
            defaultValue={location.timezone || "America/New_York"}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_address_line1">Street address</Label>
          <Input
            id="edit_address_line1"
            name="address_line1"
            defaultValue={location.address_line1 ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_address_line2">Address line 2</Label>
          <Input
            id="edit_address_line2"
            name="address_line2"
            defaultValue={location.address_line2 ?? ""}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="edit_city">City</Label>
            <Input
              id="edit_city"
              name="city"
              defaultValue={location.city ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_state">State / province</Label>
            <Input
              id="edit_state"
              name="state"
              defaultValue={location.state ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_postal">Postal code</Label>
            <Input
              id="edit_postal"
              name="postal_code"
              defaultValue={location.postal_code ?? ""}
            />
          </div>
        </div>
        <AlertMessage error={state.error} success={state.success} />
        <FormFooter
          onCancel={onClose}
          pending={pending}
          submitLabel="Save location"
        />
      </form>
    </Dialog>
  );
}
