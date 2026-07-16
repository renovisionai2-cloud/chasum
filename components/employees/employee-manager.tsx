"use client";

import { EmployeeDirectory, type DirectoryEmployee } from "@/components/employees/employee-directory";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createStaff } from "@/lib/actions/staff";
import type { Department } from "@/lib/employees/types";
import type { ActionState, Location, Service } from "@/lib/types/booking";
import { STAFF_COLORS } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useActionState, useState } from "react";

function CreateEmployeeForm({
  services,
  locations,
  onClose,
}: {
  services: Service[];
  locations: Location[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(createStaff, {} as ActionState);
  const refresh = useRefresh();
  const defaultLocationId =
    locations.find((l) => l.is_default)?.id ?? locations[0]?.id;

  useFormAction(state, undefined, () => {
    refresh();
    onClose();
  });

  return (
    <form action={formAction} className="space-y-4">
      <ImageUploadField
        id="photo_url"
        name="photo_url"
        label="Photo"
        folder="staff-photos"
      />
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Job title</Label>
          <Input id="title" name="title" placeholder="Stylist, Trainer, Tech…" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location_id">Primary location</Label>
        <Select
          id="location_id"
          name="location_id"
          defaultValue={defaultLocationId}
          required
        >
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
              {location.is_default ? " (default)" : ""}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        Assign department, role, payroll, emergency contacts, and documents on the
        employee profile after creating.
      </p>
      <div className="space-y-2">
        <Label>Calendar color</Label>
        <ColorPicker name="color" colors={STAFF_COLORS} defaultValue={STAFF_COLORS[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="biography">Biography</Label>
        <Textarea id="biography" name="biography" rows={2} />
      </div>
      <div className="space-y-2">
        <p className="ds-label">Services</p>
        <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
          {services.map((service) => (
            <label key={service.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="service_ids" value={service.id} />
              {service.name}
            </label>
          ))}
        </div>
      </div>
      <AlertMessage error={state.error} />
      <FormFooter onCancel={onClose} pending={pending} submitLabel="Add employee" />
    </form>
  );
}

export function EmployeeManager({
  employees,
  services,
  locations,
  departments,
}: {
  employees: DirectoryEmployee[];
  services: Service[];
  locations: Location[];
  departments: Department[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <EmployeeDirectory
        employees={employees}
        services={services}
        locations={locations}
        departments={departments}
        onAdd={() => setOpen(true)}
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add employee"
        description="Create a team member for bookings, schedules, and HR records."
      >
        <CreateEmployeeForm
          services={services}
          locations={locations}
          onClose={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
