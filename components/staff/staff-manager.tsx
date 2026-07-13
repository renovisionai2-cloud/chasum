"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/page-header";
import { StaffScheduleDialog } from "@/components/staff/staff-schedule-dialog";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { createStaff, deleteStaff, updateStaff } from "@/lib/actions/staff";
import type {
  ActionState,
  Location,
  Service,
  StaffScheduleMap,
  StaffWithServices,
} from "@/lib/types/booking";
import { DAY_NAMES, STAFF_COLORS } from "@/lib/types/booking";
import { useToast } from "@/providers/toast-provider";
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

type StaffMember = StaffWithServices & {
  location?: Pick<Location, "id" | "name"> | null;
};

function StaffForm({
  member,
  services,
  locations,
  onClose,
}: {
  member?: StaffMember;
  services: Service[];
  locations: Location[];
  onClose: () => void;
}) {
  const action = member ? updateStaff : createStaff;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const assignedIds = member?.staff_services.map((ss) => ss.service_id) ?? [];
  const defaultLocationId =
    member?.location_id ?? locations.find((l) => l.is_default)?.id ?? locations[0]?.id;

  useFormAction(state, undefined, onClose);

  return (
    <form action={formAction} className="space-y-4">
      {member && <input type="hidden" name="id" value={member.id} />}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={member?.name} required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={member?.email ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={member?.title ?? ""}
            placeholder="Sonographer, Owner…"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location_id">Assigned location</Label>
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
      <div className="space-y-2">
        <Label htmlFor="photo_url">Photo URL</Label>
        <Input
          id="photo_url"
          name="photo_url"
          type="url"
          placeholder="https://…"
          defaultValue={member?.photo_url ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="biography">Biography</Label>
        <Textarea
          id="biography"
          name="biography"
          rows={3}
          placeholder="Short bio shown on the public booking page…"
          defaultValue={member?.biography ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="qualifications">Qualifications</Label>
        <Textarea
          id="qualifications"
          name="qualifications"
          rows={2}
          placeholder="Credentials, certifications, years of experience…"
          defaultValue={member?.qualifications ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label>Assigned services</Label>
        <div className="max-h-40 space-y-2 overflow-y-auto rounded-[var(--radius-md)] border border-border p-3">
          {services.filter((s) => s.is_active).length === 0 ? (
            <p className="text-sm text-muted-foreground">No active services yet.</p>
          ) : (
            services
              .filter((s) => s.is_active)
              .map((service) => (
                <label key={service.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="service_ids"
                    value={service.id}
                    defaultChecked={assignedIds.includes(service.id)}
                  />
                  {service.name}
                </label>
              ))
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <ColorPicker
          name="color"
          colors={STAFF_COLORS}
          defaultValue={member?.color ?? STAFF_COLORS[0]}
        />
      </div>
      {member && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={member.is_active}
          />
          Active
        </label>
      )}
      <AlertMessage error={state.error} />
      <FormFooter
        onCancel={onClose}
        pending={pending}
        submitLabel={member ? "Update" : "Add"}
      />
    </form>
  );
}

export function StaffManager({
  staff,
  services,
  locations,
  schedules,
}: {
  staff: StaffMember[];
  services: Service[];
  locations: Location[];
  schedules: StaffScheduleMap;
}) {
  const [open, setOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | undefined>();
  const [scheduling, setScheduling] = useState<StaffMember | undefined>();
  const refresh = useRefresh();
  const { toast } = useToast();

  async function handleDelete(id: string) {
    if (!(await confirmDelete("Remove this staff member?"))) return;
    const result = await deleteStaff(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Staff member removed.", "success");
      refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          title="No staff yet"
          description="Add team members who will provide services."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => {
            const hours = schedules[member.id]?.hours ?? [];
            const workingDays = hours
              .filter((h) => h.is_working)
              .map((h) => DAY_NAMES[h.day_of_week].slice(0, 3))
              .join(", ");

            return (
              <Card key={member.id} className="border-border/70 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{member.name}</h3>
                        <p className="truncate text-sm text-muted-foreground">
                          {member.title ?? "Team member"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconButton
                        label={`Manage schedule for ${member.name}`}
                        onClick={() => {
                          setScheduling(member);
                          setScheduleOpen(true);
                        }}
                      >
                        <Calendar className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label={`Edit ${member.name}`}
                        onClick={() => {
                          setEditing(member);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label={`Remove ${member.name}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                  {member.biography && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {member.biography}
                    </p>
                  )}
                  {member.qualifications && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {member.qualifications}
                    </p>
                  )}
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p>
                      {member.staff_services.length} service
                      {member.staff_services.length !== 1 ? "s" : ""} assigned
                    </p>
                    {member.location?.name && <p>Location: {member.location.name}</p>}
                    {workingDays && <p>Working: {workingDays}</p>}
                    {!member.is_active && (
                      <p className="text-destructive">Inactive</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit staff" : "Add staff member"}
        className="sm:max-w-xl"
      >
        <StaffForm
          member={editing}
          services={services}
          locations={locations}
          onClose={() => setOpen(false)}
        />
      </Dialog>

      {scheduling && (
        <StaffScheduleDialog
          open={scheduleOpen}
          onClose={() => {
            setScheduleOpen(false);
            setScheduling(undefined);
          }}
          staff={scheduling}
          workingHours={schedules[scheduling.id]?.hours ?? []}
          vacations={schedules[scheduling.id]?.vacations ?? []}
        />
      )}
    </div>
  );
}
