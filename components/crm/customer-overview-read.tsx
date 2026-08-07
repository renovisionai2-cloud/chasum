"use client";

import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/ui/badge";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { updateCrmCustomer } from "@/lib/actions/crm";
import type { Membership } from "@/lib/business/types";
import {
  CRM_STATUS_EDIT_OPTIONS,
  displayCrmStatusLabel,
  isVipCustomer,
} from "@/lib/crm/customer-health";
import { displayCustomerName } from "@/lib/crm/display";
import {
  COMM_METHOD_LABELS,
  LOYALTY_STATUS_LABELS,
  type CrmProfile,
} from "@/lib/crm/types";
import type { ActionState, Location, StaffWithServices } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { useActionState, useState } from "react";

function Fact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function CustomerOverviewRead({
  profile,
  staff,
  locations,
  memberships,
}: {
  profile: CrmProfile;
  staff: StaffWithServices[];
  locations: Location[];
  memberships: Membership[];
}) {
  const { customer } = profile;
  const [editOpen, setEditOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateCrmCustomer,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(state, () => {
    setEditOpen(false);
    refresh();
  });

  const displayName = displayCustomerName(customer);
  const status = displayCrmStatusLabel(customer.crm_status);
  const preferredComm =
    COMM_METHOD_LABELS[
      (customer.preferred_communication_method as keyof typeof COMM_METHOD_LABELS) ??
        "any"
    ] ?? "Any";

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight">Overview</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 gap-1.5"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit profile
          </Button>
        </div>

        <section className="rounded-[var(--radius-md)] border border-border bg-card px-3 py-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Customer identity
          </h4>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Fact label="Name" value={displayName} />
            <Fact
              label="Preferred name"
              value={customer.preferred_name?.trim() || "Not provided"}
            />
            <Fact label="Email" value={customer.email || "Not provided"} />
            <Fact
              label="Phone"
              value={customer.phone?.trim() || "Not provided"}
            />
            <Fact label="Preferred communication" value={preferredComm} />
            <Fact label="Status" value={status} />
          </dl>
        </section>

        <section className="rounded-[var(--radius-md)] border border-border bg-card px-3 py-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Relationship
          </h4>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Fact
              label="Preferred employee"
              value={profile.assignedStaff?.name ?? "No preferred employee"}
            />
            <Fact
              label="Preferred location"
              value={
                profile.preferredLocation?.name ?? "No preferred location"
              }
            />
            <Fact
              label="Membership"
              value={profile.membership?.name ?? "No membership assigned"}
            />
            <Fact
              label="Customer since"
              value={
                customer.created_at
                  ? format(new Date(customer.created_at), "MMM d, yyyy")
                  : "Unavailable"
              }
            />
            <Fact
              label="VIP"
              value={isVipCustomer(customer) ? "Yes" : "No"}
            />
            <div className="min-w-0 sm:col-span-2 lg:col-span-3">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Tags
              </dt>
              <dd className="mt-1">
                {(customer.tags?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.map((tag, i) => (
                      <TagBadge key={tag} tag={tag} index={i} />
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[var(--radius-md)] border border-border bg-card px-3 py-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Important details
          </h4>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact
              label="Birthday"
              value={
                customer.date_of_birth
                  ? format(new Date(customer.date_of_birth), "MMM d, yyyy")
                  : "Not provided"
              }
            />
            <Fact
              label="Address"
              value={customer.address?.trim() || "Not provided"}
            />
            <Fact
              label="Emergency contact"
              value={
                customer.emergency_contact_name
                  ? [
                      customer.emergency_contact_name,
                      customer.emergency_contact_phone,
                      customer.emergency_contact_relationship,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "No emergency contact"
              }
            />
            <div className="min-w-0 sm:col-span-2">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Profile notes
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
                {customer.notes?.trim() || "No profile notes"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        description="Updates save to the customer record. Existing booking and payment engines are unchanged."
        resizable
      >
        <form action={formAction} className="space-y-5 pb-4">
          <input type="hidden" name="id" value={customer.id} />
          <ImageUploadField
            id="photo_url_edit"
            name="photo_url"
            label="Profile photo"
            folder="customer-photos"
            defaultValue={customer.photo_url}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name_edit">First name</Label>
              <Input
                id="first_name_edit"
                name="first_name"
                defaultValue={customer.first_name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name_edit">Last name</Label>
              <Input
                id="last_name_edit"
                name="last_name"
                defaultValue={customer.last_name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_name_edit">Preferred name</Label>
              <Input
                id="preferred_name_edit"
                name="preferred_name"
                defaultValue={customer.preferred_name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_edit">Email</Label>
              <Input
                id="email_edit"
                name="email"
                type="email"
                defaultValue={customer.email}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_edit">Phone</Label>
              <Input
                id="phone_edit"
                name="phone"
                defaultValue={customer.phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth_edit">Birthday</Label>
              <Input
                id="date_of_birth_edit"
                name="date_of_birth"
                type="date"
                defaultValue={customer.date_of_birth ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender_edit">Gender (optional)</Label>
              <Input
                id="gender_edit"
                name="gender"
                defaultValue={customer.gender ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_communication_method_edit">
                Preferred communication
              </Label>
              <Select
                id="preferred_communication_method_edit"
                name="preferred_communication_method"
                defaultValue={customer.preferred_communication_method ?? "any"}
              >
                {Object.entries(COMM_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address_edit">Address</Label>
              <Input
                id="address_edit"
                name="address"
                defaultValue={customer.address ?? ""}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
            <p className="ds-label">Emergency contact</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                name="emergency_contact_name"
                placeholder="Name"
                defaultValue={customer.emergency_contact_name ?? ""}
              />
              <Input
                name="emergency_contact_phone"
                placeholder="Phone"
                defaultValue={customer.emergency_contact_phone ?? ""}
              />
              <Input
                name="emergency_contact_relationship"
                placeholder="Relationship"
                defaultValue={customer.emergency_contact_relationship ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="crm_status_edit">CRM status</Label>
              <Select
                id="crm_status_edit"
                name="crm_status"
                defaultValue={customer.crm_status ?? "active"}
              >
                {CRM_STATUS_EDIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_staff_id_edit">Preferred employee</Label>
              <Select
                id="assigned_staff_id_edit"
                name="assigned_staff_id"
                defaultValue={customer.assigned_staff_id ?? ""}
              >
                <option value="">Unassigned</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_location_id_edit">
                Preferred location
              </Label>
              <Select
                id="preferred_location_id_edit"
                name="preferred_location_id"
                defaultValue={customer.preferred_location_id ?? ""}
              >
                <option value="">None</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="membership_id_edit">Membership</Label>
              <Select
                id="membership_id_edit"
                name="membership_id"
                defaultValue={customer.membership_id ?? ""}
              >
                <option value="">None</option>
                {memberships.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <input
            type="hidden"
            name="is_vip"
            value={customer.is_vip ? "true" : "false"}
          />
          <input
            type="hidden"
            name="marketing_consent"
            value={customer.marketing_consent ? "true" : "false"}
          />
          <input
            type="hidden"
            name="tags"
            value={(customer.tags ?? []).join(", ")}
          />
          <input
            type="hidden"
            name="loyalty_status"
            value={customer.loyalty_status ?? "standard"}
          />

          <div className="space-y-2">
            <Label htmlFor="notes_edit">Profile notes</Label>
            <Textarea
              id="notes_edit"
              name="notes"
              rows={3}
              defaultValue={customer.notes ?? ""}
            />
          </div>

          <AlertMessage error={state.error} success={state.success} />
          <FormFooter pending={pending} submitLabel="Save profile" />
        </form>
      </Sheet>
    </>
  );
}

/** Marketing tab keeps an editable form (loyalty / consent). */
export function CustomerMarketingForm({
  profile,
  memberships,
}: {
  profile: CrmProfile;
  memberships: Membership[];
}) {
  const { customer } = profile;
  const [state, formAction, pending] = useActionState(
    updateCrmCustomer,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(state, () => refresh());

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={customer.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tags_mkt">Tags</Label>
          <Input
            id="tags_mkt"
            name="tags"
            defaultValue={(customer.tags ?? []).join(", ")}
            placeholder="VIP, Regular, New"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="referral_source">Referral source</Label>
          <Input
            id="referral_source"
            name="referral_source"
            defaultValue={customer.referral_source ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loyalty_status">Loyalty status</Label>
          <Select
            id="loyalty_status"
            name="loyalty_status"
            defaultValue={customer.loyalty_status ?? "standard"}
          >
            {Object.entries(LOYALTY_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="membership_id_mkt">Membership</Label>
          <Select
            id="membership_id_mkt"
            name="membership_id"
            defaultValue={customer.membership_id ?? ""}
          >
            <option value="">None</option>
            {memberships.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="anniversary_date">Anniversary</Label>
          <Input
            id="anniversary_date"
            name="anniversary_date"
            type="date"
            defaultValue={customer.anniversary_date ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_of_birth_mkt">Birthday</Label>
          <Input
            id="date_of_birth_mkt"
            name="date_of_birth"
            type="date"
            defaultValue={customer.date_of_birth ?? ""}
          />
        </div>
        <label className="flex min-h-11 items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            name="is_vip"
            defaultChecked={Boolean(customer.is_vip)}
          />
          VIP customer (segment flag)
        </label>
        <label className="flex min-h-11 items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            name="marketing_consent"
            defaultChecked={Boolean(customer.marketing_consent)}
          />
          Marketing consent
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Marketing consent gates promotional email/SMS. VIP is a derived segment
        via this flag (CRM status may still store a legacy VIP value).
      </p>
      <input type="hidden" name="first_name" value={customer.first_name ?? ""} />
      <input type="hidden" name="last_name" value={customer.last_name ?? ""} />
      <input
        type="hidden"
        name="preferred_name"
        value={customer.preferred_name ?? ""}
      />
      <input type="hidden" name="email" value={customer.email} />
      <input type="hidden" name="phone" value={customer.phone ?? ""} />
      <input type="hidden" name="address" value={customer.address ?? ""} />
      <input type="hidden" name="photo_url" value={customer.photo_url ?? ""} />
      <input
        type="hidden"
        name="crm_status"
        value={customer.crm_status ?? "active"}
      />
      <input
        type="hidden"
        name="assigned_staff_id"
        value={customer.assigned_staff_id ?? ""}
      />
      <input
        type="hidden"
        name="preferred_location_id"
        value={customer.preferred_location_id ?? ""}
      />
      <input
        type="hidden"
        name="preferred_communication_method"
        value={customer.preferred_communication_method ?? "any"}
      />
      <input type="hidden" name="notes" value={customer.notes ?? ""} />
      <AlertMessage error={state.error} success={state.success} />
      <FormFooter pending={pending} submitLabel="Save marketing" />
    </form>
  );
}
