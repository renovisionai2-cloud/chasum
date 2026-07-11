"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createService, deleteService, updateService } from "@/lib/actions/services";
import type { ActionState, Service } from "@/lib/types/booking";
import { SERVICE_COLORS } from "@/lib/types/booking";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page-header";

function ServiceForm({
  service,
  onClose,
  onSuccess,
}: {
  service?: Service;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const action = service ? updateService : createService;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  useEffect(() => {
    if (state.success) {
      onSuccess();
      onClose();
    }
  }, [state.success, onSuccess, onClose]);

  return (
    <form action={formAction} className="space-y-4">
      {service && <input type="hidden" name="id" value={service.id} />}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={service?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={service?.description ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (min)</Label>
          <Input id="duration_minutes" name="duration_minutes" type="number" min={5} step={5} defaultValue={service?.duration_minutes ?? 30} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input id="price" name="price" type="number" min={0} step={0.01} defaultValue={service?.price ?? 0} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <SelectColor name="color" defaultValue={service?.color ?? SERVICE_COLORS[0]} />
      </div>
      {service && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" name="is_active" value="true" defaultChecked={service.is_active} />
          <Label htmlFor="is_active">Active</Label>
        </div>
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : service ? "Update" : "Create"}</Button>
      </div>
    </form>
  );
}

function SelectColor({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SERVICE_COLORS.map((color) => (
        <label key={color} className="cursor-pointer">
          <input type="radio" name={name} value={color} defaultChecked={color === defaultValue} className="peer sr-only" />
          <span className="block h-8 w-8 rounded-full border-2 border-transparent peer-checked:border-foreground" style={{ backgroundColor: color }} />
        </label>
      ))}
    </div>
  );
}

export function ServicesManager({ services }: { services: Service[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  function refresh() {
    setRefreshKey((k) => k + 1);
    window.location.reload();
  }

  return (
    <div className="space-y-6" key={refreshKey}>
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add service
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState title="No services yet" description="Create your first service to start accepting bookings." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: service.color }} />
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.duration_minutes} min · ${Number(service.price).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditing(service); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={async () => {
                      if (confirm("Delete this service?")) {
                        await deleteService(service.id);
                        refresh();
                      }
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {service.description && <p className="mt-3 text-sm text-muted-foreground">{service.description}</p>}
                {!service.is_active && <p className="mt-2 text-xs text-destructive">Inactive</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Edit service" : "New service"}>
        <ServiceForm service={editing} onClose={() => setOpen(false)} onSuccess={refresh} />
      </Dialog>
    </div>
  );
}
