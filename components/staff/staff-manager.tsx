"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/page-header";
import { createStaff, deleteStaff, updateStaff } from "@/lib/actions/staff";
import type { ActionState, Service, Staff } from "@/lib/types/booking";
import { STAFF_COLORS } from "@/lib/types/booking";
import { StaffScheduleDialog } from "@/components/staff/staff-schedule-dialog";
import type { StaffVacation, StaffWorkingHours } from "@/lib/types/booking";
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

type StaffWithServices = Staff & {
  staff_services: { service_id: string }[];
};

function StaffForm({
  member,
  services,
  onClose,
  onSuccess,
}: {
  member?: StaffWithServices;
  services: Service[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const action = member ? updateStaff : createStaff;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const assignedIds = member?.staff_services.map((ss) => ss.service_id) ?? [];

  useEffect(() => {
    if (state.success) {
      onSuccess();
      onClose();
    }
  }, [state.success, onSuccess, onClose]);

  return (
    <form action={formAction} className="space-y-4">
      {member && <input type="hidden" name="id" value={member.id} />}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={member?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={member?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={member?.title ?? ""} placeholder="Stylist, Therapist..." />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="photo_url">Photo URL</Label>
        <Input id="photo_url" name="photo_url" type="url" placeholder="https://..." defaultValue={member?.photo_url ?? ""} />
      </div>
      <div className="space-y-2">
        <Label>Services</Label>
        <div className="space-y-2 rounded-xl border border-border p-3">
          {services.filter((s) => s.is_active).map((service) => (
            <label key={service.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="service_ids" value={service.id} defaultChecked={assignedIds.includes(service.id)} />
              {service.name}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {STAFF_COLORS.map((color) => (
            <label key={color} className="cursor-pointer">
              <input type="radio" name="color" value={color} defaultChecked={color === (member?.color ?? STAFF_COLORS[0])} className="peer sr-only" />
              <span className="block h-8 w-8 rounded-full border-2 border-transparent peer-checked:border-foreground" style={{ backgroundColor: color }} />
            </label>
          ))}
        </div>
      </div>
      {member && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" value="true" defaultChecked={member.is_active} />
          Active
        </label>
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : member ? "Update" : "Add"}</Button>
      </div>
    </form>
  );
}

export function StaffManager({
  staff,
  services,
  schedules,
}: {
  staff: StaffWithServices[];
  services: Service[];
  schedules: Record<string, { hours: StaffWorkingHours[]; vacations: StaffVacation[] }>;
}) {
  const [open, setOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editing, setEditing] = useState<StaffWithServices | undefined>();
  const [scheduling, setScheduling] = useState<StaffWithServices | undefined>();

  function refresh() {
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState title="No staff yet" description="Add team members who will provide services." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <Card key={member.id} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-white" style={{ backgroundColor: member.color }}>
                      {member.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </span>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.title ?? "Team member"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Schedule" onClick={() => { setScheduling(member); setScheduleOpen(true); }}>
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditing(member); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={async () => {
                      if (confirm("Remove this staff member?")) {
                        await deleteStaff(member.id);
                        refresh();
                      }
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {member.staff_services.length} service{member.staff_services.length !== 1 ? "s" : ""} assigned
                </p>
                {!member.is_active && <p className="mt-1 text-xs text-destructive">Inactive</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Edit staff" : "Add staff member"}>
        <StaffForm member={editing} services={services} onClose={() => setOpen(false)} onSuccess={refresh} />
      </Dialog>

      {scheduling && (
        <StaffScheduleDialog
          open={scheduleOpen}
          onClose={() => { setScheduleOpen(false); setScheduling(undefined); }}
          staff={scheduling}
          workingHours={schedules[scheduling.id]?.hours ?? []}
          vacations={schedules[scheduling.id]?.vacations ?? []}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
