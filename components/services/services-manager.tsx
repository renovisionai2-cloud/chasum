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
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { createService, deleteService, updateService } from "@/lib/actions/services";
import type { ActionState, Service } from "@/lib/types/booking";
import { SERVICE_CATEGORIES, SERVICE_COLORS } from "@/lib/types/booking";
import { useToast } from "@/providers/toast-provider";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

function ServiceForm({
  service,
  onClose,
}: {
  service?: Service;
  onClose: () => void;
}) {
  const action = service ? updateService : createService;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  useFormAction(state, undefined, onClose);

  return (
    <form action={formAction} className="space-y-4">
      {service && <input type="hidden" name="id" value={service.id} />}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={service?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={service?.description ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preparation_instructions">Preparation instructions</Label>
        <Textarea
          id="preparation_instructions"
          name="preparation_instructions"
          rows={3}
          placeholder="What clients should do before the appointment…"
          defaultValue={service?.preparation_instructions ?? ""}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            name="category"
            defaultValue={service?.category ?? "Ultrasound"}
          >
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (min)</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min={5}
            step={5}
            defaultValue={service?.duration_minutes ?? 30}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step={0.01}
            defaultValue={service?.price ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buffer_before_minutes">Buffer before (min)</Label>
          <Input
            id="buffer_before_minutes"
            name="buffer_before_minutes"
            type="number"
            min={0}
            step={5}
            defaultValue={service?.buffer_before_minutes ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buffer_after_minutes">Buffer after (min)</Label>
          <Input
            id="buffer_after_minutes"
            name="buffer_after_minutes"
            type="number"
            min={0}
            step={5}
            defaultValue={service?.buffer_after_minutes ?? 0}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <ColorPicker
          name="color"
          colors={SERVICE_COLORS}
          defaultValue={service?.color ?? SERVICE_COLORS[0]}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="online_booking"
          value="true"
          defaultChecked={service?.online_booking ?? true}
        />
        Available for online booking
      </label>
      {service && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={service.is_active}
          />
          Active
        </label>
      )}
      <AlertMessage error={state.error} />
      <FormFooter
        onCancel={onClose}
        pending={pending}
        submitLabel={service ? "Update" : "Create"}
      />
    </form>
  );
}

export function ServicesManager({ services }: { services: Service[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | undefined>();
  const refresh = useRefresh();
  const { toast } = useToast();

  async function handleDelete(id: string, name: string) {
    if (!(await confirmDelete(`Delete ${name}?`))) return;
    const result = await deleteService(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Service deleted.", "success");
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
          <Plus className="h-4 w-4" aria-hidden="true" /> Add service
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          title="No services yet"
          description="Create your first service to start accepting bookings."
        >
          <Button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add service
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="ds-card-interactive">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: service.color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {service.category ?? "General"} · {service.duration_minutes}{" "}
                        min · ${Number(service.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconButton
                      label={`Edit ${service.name}`}
                      onClick={() => {
                        setEditing(service);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`Delete ${service.name}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(service.id, service.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
                {service.description && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {service.online_booking === false && (
                    <span className="rounded-md bg-muted px-2 py-0.5">
                      Offline booking only
                    </span>
                  )}
                  {(service.buffer_before_minutes > 0 ||
                    service.buffer_after_minutes > 0) && (
                    <span className="rounded-md bg-muted px-2 py-0.5">
                      Buffer {service.buffer_before_minutes}/
                      {service.buffer_after_minutes} min
                    </span>
                  )}
                  {!service.is_active && (
                    <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-destructive">
                      Inactive
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit service" : "New service"}
        className="sm:max-w-xl"
      >
        <ServiceForm service={editing} onClose={() => setOpen(false)} />
      </Dialog>
    </div>
  );
}
