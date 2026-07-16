"use client";

import { CustomerDirectory } from "@/components/crm/customer-directory";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CrmDirectoryCustomer } from "@/lib/actions/crm";
import { createCrmCustomer } from "@/lib/actions/crm";
import type { ActionState, Location, Staff } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useActionState, useState } from "react";

function CreateCustomerForm({
  staff,
  locations,
  onClose,
}: {
  staff: Staff[];
  locations: Location[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createCrmCustomer,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(state, undefined, () => {
    refresh();
    onClose();
  });

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" name="first_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" name="last_name" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="crm_status">Status</Label>
          <Select id="crm_status" name="crm_status" defaultValue="active">
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="vip">VIP</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="assigned_staff_id">Assigned employee</Label>
          <Select id="assigned_staff_id" name="assigned_staff_id" defaultValue="">
            <option value="">Unassigned</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferred_location_id">Location</Label>
          <Select
            id="preferred_location_id"
            name="preferred_location_id"
            defaultValue=""
          >
            <option value="">None</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" placeholder="VIP, Regular…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      <AlertMessage error={state.error} />
      <FormFooter onCancel={onClose} pending={pending} submitLabel="Add customer" />
    </form>
  );
}

export function CrmManager({
  customers,
  staff,
  locations,
}: {
  customers: CrmDirectoryCustomer[];
  staff: Staff[];
  locations: Location[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CustomerDirectory
        customers={customers}
        staff={staff}
        locations={locations}
        onAdd={() => setOpen(true)}
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add customer"
        description="Create a CRM profile for scheduling, communication, and marketing."
      >
        <CreateCustomerForm
          staff={staff}
          locations={locations}
          onClose={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
