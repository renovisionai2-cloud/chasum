"use client";

import { CustomerDirectory } from "@/components/crm/customer-directory";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CrmCustomerCreateState, CrmDirectoryCustomer } from "@/lib/actions/crm";
import { createCrmCustomer } from "@/lib/actions/crm";
import {
  ACKNOWLEDGED_CONTACT_FIELD,
  contactIdentityKey,
  customerEmailLabel,
  SHARED_PHONE_WARNING,
} from "@/lib/customers/contact-identity";
import type { Location, Staff } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";

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
    {} as CrmCustomerCreateState,
  );
  const refresh = useRefresh();
  const [contact, setContact] = useState({ email: "", phone: "" });

  // The warning belongs to the contact that produced it. Editing the phone or
  // email makes the chooser disappear, so an old candidate can never be used
  // for a different number — including when a slow response arrives late.
  const returnedMatches = state.phoneMatches ?? [];
  const warnedForCurrentContact =
    returnedMatches.length > 0 &&
    state.warnedContactKey === contactIdentityKey(contact);
  const staleWarning = returnedMatches.length > 0 && !warnedForCurrentContact;

  useFormAction(
    returnedMatches.length > 0 ? { ...state, error: undefined } : state,
    undefined,
    () => {
      refresh();
      onClose();
    },
  );

  // The acknowledgement is attached only by an explicit "Create a separate
  // person" click, so an ordinary save — including an Enter keypress — always
  // re-checks the phone instead of reusing an earlier authorisation.
  // Submitting inside a transition keeps the operator's typed values on screen
  // while the shared-phone chooser is answered.
  const formRef = useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    startTransition(() => formAction(formData));
  }

  function createSeparatePerson() {
    if (!formRef.current || !state.warnedContactKey) return;
    const formData = new FormData(formRef.current);
    formData.set(ACKNOWLEDGED_CONTACT_FIELD, state.warnedContactKey);
    submit(formData);
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
      className="space-y-4"
    >
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
        <Input
          id="email"
          name="email"
          type="email"
          value={contact.email}
          onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">
          A phone number or email is how you reach this customer. Either one is enough.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={contact.phone}
            onChange={(e) =>
              setContact((c) => ({ ...c, phone: e.target.value }))
            }
          />
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
      {warnedForCurrentContact ? (
        <div
          className="space-y-2 rounded-[var(--radius-md)] border border-border bg-muted/20 p-2"
          role="status"
        >
          <p className="text-xs text-muted-foreground">{SHARED_PHONE_WARNING}</p>
          <ul className="space-y-2">
            {returnedMatches.map((match) => (
              <li
                key={match.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0 truncate text-sm">
                  {match.name}
                  <span className="text-muted-foreground">
                    {" "}
                    · {customerEmailLabel(match.email)}
                    {match.phone ? ` · ${match.phone}` : ""}
                  </span>
                </span>
                <Link
                  href={`/dashboard/clients/${match.id}`}
                  className="ds-focus-ring inline-flex h-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-card/60 px-3.5 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
                >
                  Use this customer
                </Link>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={createSeparatePerson}
          >
            Create separate person
          </Button>
        </div>
      ) : staleWarning ? (
        <p className="text-xs text-muted-foreground" role="status">
          The contact details changed, so the earlier shared-phone match no
          longer applies. Save again to check the new number.
        </p>
      ) : null}
      <AlertMessage error={warnedForCurrentContact ? undefined : state.error} />
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
